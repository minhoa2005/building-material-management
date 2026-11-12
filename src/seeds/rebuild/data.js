import { PERMISSION_CATALOGUE,ROLE_PERMISSIONS } from '../data/permissions.data.js';
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { buildHistoricalSource } from './historical-source.js';
import { transformSnapshot } from '../../migrations/rebuild/transform.js';
import { exact } from '../../models/model-utils.js';
import { documentCollections } from '../../models/collections.js';
import { upgradeSupportingData } from './support-data.js';
import { addTransferExamples, addInvoiceExample, addStorageExamples } from './workflow-data.js';
import { splitCompletedSale, addOperationalExamples, addHandoverExamples } from './scenarios.js';
import { buildTileShopScenario } from './tile-shop.js';
import { consolidateData } from '../../models/consolidation.js';
import { addTileCategories } from './categories.js';
import { planConversionBackfill } from '../../migrations/conversions.js';

export const SEED_VERSION = 'wmsd-tile-shop-20261109-v10';
export const hash = value => createHash('sha256').update(value).digest('hex');
export const fixtureId = key => new mongoose.Types.ObjectId(hash(SEED_VERSION + ':' + key).slice(0,24));
export const demoDate = (day, hour = 8) => new Date(Date.UTC(2026,9,day,hour));
export const decimalValue = value => mongoose.Types.Decimal128.fromString(String(value));
// Real local PNG bytes. These are synthetic evidence for exercising file metadata.
export const demoPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY9sAAAAASUVORK5CYII=', 'base64');

export function dataContext(data) {
  const documents = new Map(), items = new Map(), itemParents = new Map();
  const addDocument = (document, collection) => {
    documents.set(String(document._id), { document, collection });
    for (const item of document.items || []) { items.set(String(item._id),item); itemParents.set(String(item._id),document); }
    for (const handover of document.handovers || []) addDocument(handover,collection);
  };
  for (const [collection,rows] of Object.entries(data)) for (const row of rows) if (row.documentKind) addDocument(row,collection);
  function byId(collection,id) {
    const row = data[collection].find(value => String(value._id) === String(id));
    if (!row) throw new Error('Missing demo ' + collection + ' ' + id);
    return row;
  }
  function document(id) {
    const row = documents.get(String(id));
    if (!row) throw new Error('Missing demo document ' + id);
    return row.document;
  }
  function sourceRef(itemId) {
    const parent = itemParents.get(String(itemId));
    if (!parent) throw new Error('Missing demo source item ' + itemId);
    return { documentType: documentCollections[parent.documentKind], documentId:parent._id, itemId, revision:parent.version };
  }
  function ancestor(itemId, kind) {
    const visited = new Set();
    const pending = [itemId];
    while (pending.length) {
      const current = pending.shift();
      if (visited.has(String(current))) continue;
      visited.add(String(current));
      const parent = itemParents.get(String(current));
      if (parent?.documentKind === kind) return { document:parent, item:items.get(String(current)) };
      for (const source of items.get(String(current))?.sources || []) pending.push(source.itemId);
    }
    return null;
  }
  return { data, documents, items, itemParents, byId, document, sourceRef, ancestor };
}

export async function buildReviewedDemo({ consolidate = true } = {}) {
  const source = buildHistoricalSource();
  const data = transformSnapshot(source).target;
  for (const rows of Object.values(data)) for (const row of rows) {
    row.createdAt ??= row.occurredAt ?? row.postedAt ?? demoDate(1);
    row.updatedAt ??= row.createdAt;
  }
  for(const permission of PERMISSION_CATALOGUE)if(!data.permissions.some(p=>p.code===permission.code))data.permissions.push({_id:fixtureId('permission:'+permission.code),code:permission.code,name:permission.description,description:permission.description,isActive:true,createdAt:demoDate(1),updatedAt:demoDate(1)});
  for(const role of data.roles)if(ROLE_PERMISSIONS[role.code])for(const permission of data.permissions)if(ROLE_PERMISSIONS[role.code].includes(permission.code)&&!role.permissionIds.some(id=>String(id)===String(permission._id)))role.permissionIds.push(permission._id);
  const context = dataContext(data);
  const actor = roleCode => {
    const role = data.roles.find(row => row.code === roleCode);
    return data.users.find(row => String(row.roleId) === String(role._id))._id;
  };
  context.actor = actor;
  const owner = actor('OWNER'), warehouse = actor('WAREHOUSE'), accountant = actor('ACCOUNTANT');
  for (const row of data.products) { row.manufacturerCode='DEMO-FACTORY'; row.material='Porcelain mẫu'; }
  data.customers.forEach((row,index) => { row.phone='09000000' + String(index+1).padStart(2,'0'); });
  data.warehouses.forEach(row => {
    Object.assign(row,{lengthMm:30000,widthMm:20000,clearHeightMm:6000,description:'Kích thước giả lập phục vụ kiểm thử'});
  });
  data.warehouse_locations.forEach(row => Object.assign(row,{ usableLengthMm:5000,usableWidthMm:5000,usableHeightMm:3000 }));
  for (const {document} of context.documents.values()) {
    document.header ??= {};
    document.note='Dữ liệu mẫu tổng hợp theo thiết kế đã duyệt. Mọi tên, giá và kích thước chỉ phục vụ kiểm thử.';
    document.createdAt=document.occurredAt ?? demoDate(10);
    document.updatedAt=document.createdAt;
    const transactions=data.stock_transactions.filter(row => String(row.sourceId)===String(document._id));
    if(transactions.length) {
      document.stockTransactionId=transactions[0]._id;
      document.postedBy=transactions[0].performedBy;
      document.postedAt=transactions[0].occurredAt;
    }
    for (const row of document.items || []) {
      row.createdAt=document.createdAt;
      row.updatedAt=document.createdAt;
      row.packagingSnapshot={packageUnit:'Thùng',baseUnitsPerPackage:decimalValue(String(row.productId)===String(data.products[0]._id)?'4':'8'),outerLengthMm:620,outerWidthMm:620,outerHeightMm:50};
    }
  }
  for (const po of data.purchase_orders) {
    delete po.header.supplierConfirmation;
    po.currency='VND';
    po.header.orderDate=demoDate(9);
    po.header.issuedAt=demoDate(9);
    po.header.approvedRequestRevision=1;
    const supplier=context.byId('suppliers',po.header.supplierId);
    po.header.supplierSnapshot={code:supplier.code,name:supplier.name};
    for (const row of po.items) {
      row.unitPurchasePrice=decimalValue('35000');
      row.lineAmount=decimalValue(exact(row.enteredQty).mul('35000'));
      row.requestItemId=row.sources.find(link => link.subjectCollection==='replenishment_requests')?.itemId;
    }
    po.totalAmount=decimalValue(po.items.reduce((sum,row)=>sum.plus(String(row.lineAmount)),exact(0)));
  }
  for (const so of data.sales_orders) {
    so.currencyCode='VND';
    for (const row of so.items) {
      row.unitSellingPrice=decimalValue('50000');
      row.priceRevision=1;
      row.lineAmount=decimalValue(exact(row.enteredQty).mul('50000'));
    }
    so.orderAmount=decimalValue(so.items.reduce((sum,row)=>sum.plus(String(row.lineAmount)),exact(0)));
  }
  for (const issue of data.sales_goods_issues) {
    issue.header.issuedAt=issue.occurredAt;
    issue.header.issuedBy=issue.createdBy;
    for (const row of issue.items) {
      const original=context.ancestor(row._id,'SALES_ORDER');
      row.salesOrderItemId=original.item._id;
      row.salePriceSnapshot={saleUnit:original.item.enteredUnit,baseUnitsPerSaleUnit:original.item.baseUnitsPerUnit,
        unitSellingPrice:original.item.unitSellingPrice,salesOrderRevision:1};
    }
  }
  for (const {document} of context.documents.values()) {
    for (const handover of document.handovers || []) {
      handover.header.vehiclePlate ??= '29A-123.45';
    }
    if(document.documentKind==='OPENING') {
      const movement=data.stock_movements.find(row => String(row.transactionId)===String(document.stockTransactionId));
      const balance=context.byId('inventory_balances',movement.toBalanceId);
      const point=context.byId('stock_holding_points',balance.holdingPointId);
      const location=context.byId('warehouse_locations',point.locationId);
      Object.assign(document.header,{warehouseId:location.warehouseId,cutoverKey:'demo-opening:'+location.warehouseId,
        openingAt:demoDate(2),coveredLocationIds:[location._id],sourceDescription:'Tồn đầu kỳ giả lập',
        preparedBy:document.createdBy,preparedAt:demoDate(1),verifiedBy:owner,verifiedAt:demoDate(2),verifiedVersion:1});
    }
    if(document.documentKind==='DEFECT_CASE') Object.assign(document.header,{
      reportedBy:document.createdBy,recordedAt:document.occurredAt,
    });
  }
  await upgradeSupportingData(context);
  addTransferExamples(context);
  splitCompletedSale(data);
  addOperationalExamples(data);
  addHandoverExamples(data);
  addInvoiceExample(context);
  addStorageExamples(dataContext(data),warehouse);
  buildTileShopScenario(data);
  const categorized=addTileCategories(data);
  const codes=new Set(['Viên','Thùng','M2',...categorized.products.map(p=>p.baseUnit)]);
  for(const rows of Object.values(categorized))for(const row of rows)for(const item of row.items||[])if(item.enteredUnit)codes.add(item.enteredUnit);
  categorized.uoms=[...codes].map(code=>({
    _id:fixtureId('uom:'+code),code,name:code==='M2'?'Mét vuông':code,
    isActive:true,isCarton:code==='Thùng',createdAt:demoDate(1),updatedAt:demoDate(1),
  }));
  for(const supplier of categorized.suppliers){if(supplier.status!=='ACTIVE')supplier.status='SUSPENDED';}

  if (!consolidate) return categorized;
  const result = consolidateData(categorized);
  const kinds = { purchase_receipts: 'PURCHASE', customer_return_receipts: 'CUSTOMER_RETURN',
    failed_delivery_receipts: 'FAILED_DELIVERY', transfer_receipts: 'TRANSFER' };
  result.goods_receipts = [];
  for (const [collection, kind] of Object.entries(kinds)) {
    for (const receipt of result[collection] ?? []) {
      receipt.documentKind = kind;
      result.goods_receipts.push(receipt);
    }
    delete result[collection];
  }
  // Historical demo receipts predate the source-specific header fields. Resolve
  // their existing document chain rather than creating replacement IDs.
  const byId = collection => new Map((result[collection] ?? []).map(row => [String(row._id), row]));
  const inspections = byId('goods_inspections');
  const arrivals = byId('goods_arrivals');
  const custody = byId('custody_receipts');
  for (const receipt of result.goods_receipts) {
    const inspection = inspections.get(String(receipt.sources?.[0]?.documentId));
    const source = inspection?.sources?.[0];
    if (receipt.documentKind === 'PURCHASE') {
      const arrival = arrivals.get(String(source?.documentId));
      receipt.header.arrivalId = arrival?._id;
      receipt.header.purchaseOrderId = arrival?.sources?.[0]?.documentId;
      receipt.header.supplierId = arrival?.header?.supplierId;
      receipt.header.receivedAt = receipt.postedAt;
    } else if (receipt.documentKind === 'CUSTOMER_RETURN') {
      const custodyReceipt = custody.get(String(source?.documentId));
      receipt.header.returnId = custodyReceipt?.sources?.[0]?.documentId;
      receipt.header.receivedAt = receipt.postedAt;
    } else if (receipt.documentKind === 'FAILED_DELIVERY') {
      receipt.header.failedDeliveryId = source?.documentId;
      receipt.header.receivedAt = receipt.postedAt;
      receipt.header.receivedBy = receipt.postedBy;
    }
  }
  const oldCollections = new Set(Object.keys(kinds));
  const rewrite = value => {
    if (!value || typeof value !== 'object' || value._bsontype || value instanceof Date) return;
    for (const [key, child] of Object.entries(value)) {
      if (['subjectCollection', 'documentType', 'sourceType', 'ownerDocumentType', 'subjectType', 'entityType'].includes(key) && oldCollections.has(child)) value[key] = 'goods_receipts';
      else if (Array.isArray(child)) child.forEach(rewrite);
      else rewrite(child);
    }
  };
  for (const rows of Object.values(result)) rows.forEach(rewrite);
  const conversionPlan = planConversionBackfill({
    products: result.products, batches: result.product_batches, uoms: result.uoms,
  });
  result.conversions = conversionPlan.candidates.map(row => ({
    ...row,
    _id: fixtureId(`conversion:${row.productId}:${row.productBatchId}:${row.uomId}`),
    basePerUnit: mongoose.Types.Decimal128.fromString(row.basePerUnit),
    createdAt: demoDate(1), updatedAt: demoDate(1),
  }));
  return result;
}
