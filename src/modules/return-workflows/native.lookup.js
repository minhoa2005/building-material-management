import mongoose from 'mongoose';
import * as s from './native.shared.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { freeQuantity } from '../../shared/utils/stock.js';
import { parent } from './native.read.js';

const { m, exact, same, serialize, requirePermission, requireWarehouseAccess, hasPermission } = s;
const oid = value => new mongoose.Types.ObjectId(String(value));
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const join = (Model, localField, as, foreignField = '_id') => ({ $lookup: { from: Model.collection.name, localField, foreignField, as } });
const first = path => ({ $arrayElemAt: [`$${path}`, 0] });
const flattenSources = { $setUnion: [{ $ifNull: ['$sources.documentId', []] }, { $ifNull: ['$items.sources.documentId', []] }] };
function scope(user, query, field = 'header.warehouseId') {
  if (query.warehouseId) { requireWarehouseAccess(user, query.warehouseId); return { [field]: oid(query.warehouseId) }; }
  return currentRole(user)?.code === 'OWNER' ? {} : { [field]: { $in: (user.warehouseIds || []).map(oid) } };
}
function authorize(user, query) {
  const permissions = query.kind === 'customers' ? ['customer_return:read', 'external_reference:create']
    : query.kind === 'suppliers' ? ['supplier_return:read', 'external_reference:create']
    : ['documents','document-lines','evidence'].includes(query.kind) ? ['external_reference:create']
    : query.kind === 'stocktakes' ? ['defect:create']
    : query.kind === 'holds' ? ['supplier_return:create']
    : ['defect:read', 'customer_return:read', 'failed_delivery:read', 'failed_delivery:inspect', 'supplier_return:read', 'external_reference:create'];
  if (!permissions.some(permission => hasPermission(user, permission))) requirePermission(user, permissions[0]);
  if (query.kind === 'sources') requirePermission(user, query.purpose === 'customer-returns' ? 'customer_return:create' : query.purpose === 'failed-deliveries' ? 'failed_delivery:inspect' : query.purpose === 'supplier-returns' ? 'supplier_return:create' : 'defect:create');
}
async function page(Model, stages, query, searchFields = ['code', 'name']) {
  if (query.search) stages.push({ $match: { $or: searchFields.map(field => ({ [field]: { $regex: escape(query.search), $options: 'i' } })) } });
  const [result] = await Model.aggregate([...stages, { $sort: { code: 1, documentNo: 1, _id: 1 } }, { $facet: {
    items: [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }], count: [{ $count: 'total' }],
  } }]);
  return { items: result?.items || [], total: result?.count[0]?.total || 0, page: query.page, limit: query.limit };
}
const productContext = [join(m.ProductBatch, 'lotId', 'batch'), { $set: { manufacturerLot: first('batch.manufacturerLot') } }, join(m.Product, 'productId', 'product'), { $set: { productName: first('product.name'), productCode: first('product.sku'), unit: first('product.baseUnit'), wholeBaseUnits: first('product.wholeBaseUnits') } }];
const sourceProjection = { _id: '$items._id', documentId: '$_id', documentNo: 1, documentKind: 1, warehouseId: '$header.warehouseId', customerId: 1, supplierId: 1, lotId: '$items.lotId', productId: '$items.productId', name: '$items.productNameSnapshot', qtyBase: '$items.qtyBase', unit: '$items.baseUnitSnapshot', version: 1, sourceKind: 1 };
async function sourceLookup(user, query) {
  const purpose = query.purpose;
  const stages = [{ $match: { ...scope(user, query), workflowStatus: 'POSTED', ...(query.documentId && { _id: oid(query.documentId) }) } }, { $unwind: '$items' }];
  let Model = m.SalesGoodsIssue;
  if (purpose === 'supplier-returns' || query.sourceKind === 'RECEIPT') {
    Model = m.PurchaseReceipt;
    stages.push({ $set: { sourceIds: flattenSources } }, join(m.GoodsInspection, 'sourceIds', 'inspection'),
      { $set: { arrivalIds: { $setUnion: [{ $ifNull: ['$inspection.header.arrivalId', []] }, { $reduce: { input: '$inspection', initialValue: [], in: { $setUnion: ['$$value', { $ifNull: ['$$this.sources.documentId', []] }] } } }] } } },
      join(m.GoodsArrival, 'arrivalIds', 'arrival'),
      { $set: { orderIds: { $setUnion: [{ $ifNull: ['$arrival.header.purchaseOrderId', []] }, { $reduce: { input: '$arrival', initialValue: [], in: { $setUnion: ['$$value', { $ifNull: ['$$this.sources.documentId', []] }] } } }, [{ $ifNull: ['$header.purchaseOrderId', null] }], '$sourceIds'] } } },
      join(m.PurchaseOrder, 'orderIds', 'purchaseOrder'),
      { $set: { supplierId: { $ifNull: ['$header.supplierId', first('purchaseOrder.header.supplierId')] } } });
    if (purpose === 'supplier-returns') stages.push({ $unionWith: { coll: m.CustodyReceipt.collection.name, pipeline: [
      { $match: { ...scope(user, query), workflowStatus: 'POSTED', 'header.ownerType': 'SUPPLIER', ...(query.documentId && { _id: oid(query.documentId) }) } },
      { $unwind: '$items' }, { $set: { supplierId: '$header.ownerId' } },
    ] } });
  } else if (purpose === 'defects' && query.sourceKind !== 'ISSUE') {
    Model = query.sourceKind === 'TRANSFER' ? m.TransferReceipt : m.CustomerReturnReceipt;
  } else {
    stages.push(join(m.DeliveryOrder, 'items.details.outboundDeliveryLineId', 'delivery', 'items._id'),
      join(m.WarehouseIssueRequest, 'delivery.header.issueRequestId', 'request'), join(m.SalesOrder, 'request.header.salesOrderId', 'sale'),
      { $set: { customerId: first('sale.header.customerId'), salesCreatedBy: first('sale.createdBy') } });
    if (hasPermission(user, 'customer_return:create') && !hasPermission(user, 'customer_return:inspect')) stages.push({ $match: { salesCreatedBy: oid(user._id) } });
    if (purpose === 'customer-returns') stages.push({ $unionWith: { coll: m.ExternalReference.collection.name, pipeline: [
      { $match: { ...scope(user, query, 'warehouseId'), referenceKind: 'HISTORICAL_DELIVERY', status: 'VERIFIED', 'evidenceIds.0': { $exists: true }, ...(query.documentId && { _id: oid(query.documentId) }) } },
      { $unwind: '$items' }, { $set: { documentNo: '$referenceNo', documentKind: 'HISTORICAL_DELIVERY', header: { warehouseId: '$warehouseId' }, 'items.qtyBase': '$items.eligibleQty', 'items.baseUnitSnapshot': '$items.baseUnitSnapshot', sourceKind: 'HISTORICAL' } },
    ] } });
  }
  if (query.customerId) stages.push({ $match: { customerId: oid(query.customerId) } });
  if (query.supplierId) stages.push({ $match: { supplierId: oid(query.supplierId) } });
  if (query.lotId) stages.push({ $match: { 'items.lotId': oid(query.lotId) } });
  stages.push({ $project: sourceProjection }, ...productContext);
  const result = await page(Model, stages, query, ['documentNo', 'name', 'productName', 'productCode', 'manufacturerLot']);
  const models = new Map([m.SalesGoodsIssue, m.PurchaseReceipt, m.CustodyReceipt, m.TransferReceipt, m.CustomerReturnReceipt].map(model => [model.schema.path('documentKind').defaultValue, model]));
  for (const row of result.items) {
    let available = exact('0');
    if (row.documentKind === 'HISTORICAL_DELIVERY') {
      const external = await m.ExternalReference.findById(row.documentId), item = external.items.id(row._id);
      available = exact(item.eligibleQty).minus(String(item.previouslyReturnedQty || '0')).minus(await s.claimTotal(item._id, 'CR'));
    } else {
      const Source = models.get(row.documentKind) || Model, doc = await Source.findById(row.documentId);
      available = await s.effectivePosted(doc, row._id);
      if (purpose === 'customer-returns' || purpose === 'failed-deliveries') {
        const deliveries = await m.DeliveryOrder.find({ 'items._id': doc.items.id(row._id).details.outboundDeliveryLineId });
        const requests = await m.WarehouseIssueRequest.find({ _id: { $in: deliveries.map(d => d.header.issueRequestId) } });
        const orders = await m.SalesOrder.find({ _id: { $in: requests.map(r => r.header.salesOrderId) } });
        const delivered = s.sum(orders.flatMap(order => order.deliveryConfirmations.filter(c => c.workflowStatus === 'CONFIRMED').flatMap(c => c.items)).filter(i => same(i.details.salesIssueLineId, row._id)));
        available = purpose === 'customer-returns' ? delivered.minus(await s.claimTotal(row._id, 'CR')) : available.minus(delivered).minus(await s.claimTotal(row._id, 'FD'));
      } else if (purpose === 'supplier-returns') {
        const returns = await m.SupplierReturn.find({ 'items.details.originLineId': row._id, workflowStatus: { $nin: ['CANCELLED', 'REJECTED'] } });
        available = available.minus(s.sum(returns.flatMap(d => d.items.filter(i => same(i.details.originLineId, row._id)).map(i => ({ qtyBase: d.workflowStatus === 'COMPLETED' ? i.details.agreedQty || '0' : i.qtyBase })))));
      }
    }
    row.availableQty = available.gt(0) ? available.toFixed() : '0';
    row.name = row.name || row.productName;
    delete row.batch; delete row.product;
  }
  return result;
}
export async function lookup(user, query) {
  authorize(user, query);
  if (query.warehouseId) requireWarehouseAccess(user, query.warehouseId);
  if (query.kind === 'sources') return serialize(await sourceLookup(user, query));
  if (query.kind === 'document-lines') {
    if (!query.documentId) throw s.validationError('Chọn chứng từ nguồn trước');
    const doc = await parent(user, query.documentId);
    return serialize(await page(doc.constructor, [{ $match: { _id: doc._id } }, { $unwind: '$items' }, { $project: { ...sourceProjection, name: '$items.productNameSnapshot' } }], query, ['name', 'documentNo']));
  }
  if(query.kind==='evidence'){
    if(!query.documentId)throw s.validationError('Chọn chứng từ nguồn trước');
    const doc=await parent(user,query.documentId);
    return serialize(await page(m.Attachment,[{$match:{ownerDocumentId:doc._id,status:'ATTACHED',accessCategory:'BUSINESS'}},{$project:{name:'$originalName',code:{$cond:[{$eq:['$mediaType','application/pdf']},'Tài liệu PDF','Ảnh chứng cứ']},uploadedAt:1}}],query));
  }
  let Model, stages;
  if (query.kind === 'customers' || query.kind === 'suppliers' || query.kind === 'parties') {
    Model = query.kind === 'suppliers' ? m.Supplier : m.Customer;
    stages = [{ $match: query.kind === 'suppliers' ? { status: 'ACTIVE' } : {} }, { $project: { code: 1, name: 1 } }];
    if (query.kind === 'parties') stages.push({ $unionWith: { coll: m.Supplier.collection.name, pipeline: [{ $match: { status: 'ACTIVE' } }, { $project: { code: 1, name: 1 } }] } });
  } else if (query.kind === 'locations') {
    Model = m.WarehouseLocation;
    stages = [{ $match: { ...scope(user, query, 'warehouseId'), isActive: true, ...(query.locationKinds && { locationType: { $in: query.locationKinds.split(',') } }) } }, { $project: { code: 1, name: 1, warehouseId: 1, locationType: 1 } }];
  } else if (query.kind === 'lots') {
    Model = m.ProductBatch;
    stages = [{ $match: { identificationStatus: 'VERIFIED' } }, { $set: { lotId: '$_id' } }, ...productContext,
      { $project: { code: '$manufacturerLot', name: '$productName', productId: 1, unit: 1, productCode: 1, manufacturerLot: 1 } }];
  } else if (query.kind === 'balances') {
    Model = m.InventoryBalance;
    stages = [{ $match: { quantityBase: { $gt: 0 }, ...(query.lotId && { batchId: oid(query.lotId) }), ...(query.purpose === 'supplier-returns' && { $or: [{ ownerType: 'STORE' }, { ownerType: 'SUPPLIER', ...(query.supplierId && { ownerId: oid(query.supplierId) }) }] }) } },
      join(m.StockHoldingPoint, 'holdingPointId', 'point'), { $set: { locationId: first('point.locationId'), lotId: '$batchId' } }, join(m.WarehouseLocation, 'locationId', 'location'),
      { $set: { warehouseId: first('location.warehouseId'), locationCode: first('location.code'), locationActive: first('location.isActive') } }, { $match: { ...scope(user, query, 'warehouseId'), locationActive: true } },
      join(m.ProductBatch, 'batchId', 'batch'), { $set: { manufacturerLot: first('batch.manufacturerLot'), productId: first('batch.productId') } }, join(m.Product, 'productId', 'product'),
      { $project: { code: '$manufacturerLot', name: first('product.name'), unit: first('product.baseUnit'), wholeBaseUnits: first('product.wholeBaseUnits'), productCode: first('product.sku'), lotId: 1, warehouseId: 1, locationId: 1, locationCode: 1, ownerType: 1, ownerId: 1, qualityCode: '$qualityStatus', qtyBase: '$quantityBase' } }];
  } else if (query.kind === 'stocktakes') {
    Model = m.Stocktake;
    let locationId;
    if(query.balanceId){const context=await s.sourceContext(query.balanceId);if(!context.location)throw s.validationError('Tồn nguồn không nằm trong kho');requireWarehouseAccess(user,context.location.warehouseId);locationId=context.location._id;}
    stages = [{ $match: { ...scope(user, query), workflowStatus: { $nin: ['CLOSED', 'POSTED'] } } },join(m.StocktakeLocationLock,'_id','locks','stocktakeId'),{$match:{locks:{$elemMatch:{status:'LOCKED',...(locationId&&{locationId})}}}}, { $project: { documentNo: 1, warehouseId: '$header.warehouseId', workflowStatus: 1 } }];
  } else if (query.kind === 'holds') {
    Model = m.DefectReport;
    stages = [{ $match: scope(user, query) }, { $unwind: '$holds' }, { $match: { 'holds.status': 'ACTIVE', 'holds.stocktakeId': { $exists: false } } }, { $unwind: '$holds.allocations' },
      ...(query.balanceId ? [{ $match: { 'holds.allocations.balanceId': oid(query.balanceId) } }] : []),
      { $project: { _id: '$holds._id', documentNo: 1, qtyBase: '$holds.allocations.quantityBase' } }];
  } else {
    Model = m.PurchaseOrder;
    const models = [m.PurchaseOrder, m.PurchaseReceipt, m.SalesOrder, m.DefectReport, m.CustomerReturn, m.FailedDelivery, m.SupplierReturn, m.SupplierReturnIssue, m.CustodyRelease];
    stages = [{ $match: scope(user, query) }, ...models.slice(1).map(model => ({ $unionWith: { coll: model.collection.name, pipeline: [{ $match: scope(user, query) }] } })),
      { $project: { documentNo: 1, documentKind: 1, warehouseId: '$header.warehouseId', version: 1, workflowStatus: 1 } }];
  }
  const result = await page(Model, stages, query, query.kind === 'balances' ? ['code', 'name', 'productCode', 'locationCode'] : ['code', 'name', 'documentNo']);
  if (query.kind === 'balances') for (const row of result.items) {
    const balance = await m.InventoryBalance.findById(row._id), free = await freeQuantity(balance);
    row.availableQty = free.gt(0) ? free.toFixed() : '0';
  }
  return serialize(result);
}
