import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { buildDemoData } from '../data/demo.data.js';
import { transformSnapshot } from '../../migrations/rebuild/transform.js';
import { exact } from '../../models/model-utils.js';
import { documentCollections } from '../../models/rebuild/collections.js';
import { upgradeSupportingData } from './support-data.js';
import { addTransferExamples, addInvoiceExample, addStorageExamples } from './workflow-data.js';
import { splitCompletedSale, addOperationalExamples, addHandoverExamples } from './scenarios.js';
import { buildTileShopScenario } from './tile-shop.js';
import { consolidateData } from '../../models/rebuild/consolidation.js';
import { addTileCategories } from './categories.js';

export const SEED_VERSION = 'wmsd-tile-shop-20261106-v8';
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
  const groups = await buildDemoData();
  const source = Object.fromEntries(groups.map(group => [group.Model.collection.name,group.documents.map(row => row.toObject())]));
  const data = transformSnapshot(source).target;
  for (const rows of Object.values(data)) for (const row of rows) {
    row.createdAt ??= row.occurredAt ?? row.postedAt ?? demoDate(1);
    row.updatedAt ??= row.createdAt;
  }
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
      row.supplierConfirmedQtyBase=row.qtyBase;
      row.supplierConfirmedBy=accountant;
      row.supplierConfirmedAt=demoDate(9);
      row.deliverySchedule=[{quantityBase:row.qtyBase,expectedAt:po.header.expectedOn}];
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
  return consolidate ? consolidateData(categorized) : categorized;
}
