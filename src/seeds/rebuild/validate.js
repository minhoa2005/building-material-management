import { exact } from '../../models/model-utils.js';
import { validateTarget } from '../../migrations/rebuild/verify.js';
import { verifyReferences } from '../../migrations/rebuild/references.js';
import { dataContext } from './data.js';

const same=(a,b)=>String(a)===String(b);
const sum=(rows,key)=>rows.reduce((total,row)=>total.plus(String(row[key]??0)),exact(0));
function ensure(condition,message) { if(!condition) throw new Error('Demo integrity: '+message); }

export async function validateReviewedDemo(data,models) {
  const errors=await validateTarget(data,models);
  ensure(!errors.length,'schema '+JSON.stringify(errors));
  const refs=verifyReferences(data,models);
  ensure(!refs.length,'references '+JSON.stringify(refs));
  const {documents,items,itemParents,byId,document,ancestor}=dataContext(data);
  for(const [name,rows] of Object.entries(data)) {
    ensure(rows.length===new Set(rows.map(row=>String(row._id))).size,'duplicate ID in '+name);
  }
  const findDocument=(collection,id)=>data[collection]?.find(row=>same(row._id,id)) ??
    (documents.get(String(id))?.collection===collection?documents.get(String(id)).document:undefined);
  function checkReference(ref,label) {
    const collection=ref.documentType??ref.subjectCollection;
    const target=findDocument(collection,ref.documentId);
    ensure(target,'missing '+label+' document');
    const parent=ref.handoverId?target.handovers?.find(row=>same(row._id,ref.handoverId)):target;
    if(ref.itemId) ensure(parent?.items?.some(row=>same(row._id,ref.itemId)),'wrong '+label+' item parent');
  }
  for(const {document:doc} of documents.values()) {
    for(const link of doc.sources??[]) checkReference(link,doc.documentNo);
    for(const item of doc.items??[]) {
      if(item.lotId) ensure(same(byId('product_batches',item.lotId).productId,item.productId),'batch/product mismatch');
      if(item.enteredUnit==='Thùng'&&['ARRIVAL','GR_PURCHASE','OPENING'].includes(doc.documentKind)) {
        ensure(item.lotId&&item.packagingSnapshot,'carton needs product batch and packaging');
        ensure(exact(item.enteredQty).isInteger(),'physical carton count must be whole');
        ensure(exact(item.baseUnitsPerUnit).eq(String(item.packagingSnapshot.baseUnitsPerPackage)),'carton conversion mismatch');
      }
      for(const link of item.sources??[]) checkReference(link,doc.documentNo);
    }
  }
  // Validate typed document references that intentionally are not Mongoose refs:
  // a referenced document can live in any one of the separate collections.
  function traverse(value) {
    if(!value||typeof value!=='object'||value._bsontype||value instanceof Date) return;
    if(value.documentType&&value.documentId) checkReference(value,'source');
    if(value.subjectType&&value.subjectId) ensure(findDocument(value.subjectType,value.subjectId),'subject reference');
    if(value.sourceType&&value.sourceId) ensure(findDocument(value.sourceType,value.sourceId),'event source reference');
    if(value.ownerDocumentType&&value.ownerDocumentId) {
      const owner=findDocument(value.ownerDocumentType,value.ownerDocumentId);
      ensure(owner,'evidence owner');
      if(value.ownerItemId) ensure(owner.items.some(row=>same(row._id,value.ownerItemId)),'evidence item owner');
    }
    for(const [key,child] of Object.entries(value)) {
      if(child && /(?:LineId|ItemId)$/.test(key) && !['externalLineId'].includes(key)) {
        ensure(items.has(String(child))||data.external_reference_lines.some(row=>same(row._id,child)),'missing embedded item '+key);
      }
      if(Array.isArray(child)) child.forEach(traverse); else traverse(child);
    }
  }
  Object.values(data).flat().forEach(traverse);

  // A connected Euler path of before->after quantities must run from zero to
  // the stored balance. This is independent of MongoDB's document return order.
  const histories=new Map(data.inventory_balances.map(row=>[String(row._id),[]]));
  for(const move of data.stock_movements) {
    ensure(items.has(String(move.sourceLineId)),'movement source item');
    for(const side of ['from','to']) if(move[side+'BalanceId']) histories.get(String(move[side+'BalanceId'])).push([
      String(move[side+'Before']),String(move[side+'After']),
    ]);
  }
  for(const balance of data.inventory_balances) {
    const edges=histories.get(String(balance._id)), degree=new Map(), neighbours=new Map();
    const add=(value,delta)=>degree.set(value,(degree.get(value)??0)+delta);
    for(const [before,after] of edges) {
      add(before,1);add(after,-1);
      for(const [a,b] of [[before,after],[after,before]]) {
        if(!neighbours.has(a)) neighbours.set(a,new Set());
        neighbours.get(a).add(b);
      }
    }
    const end=String(balance.quantityBase);
    add('0',-1);add(end,1);
    ensure([...degree.values()].every(n=>n===0),'stock ledger does not reconcile '+balance._id);
    const reached=new Set(['0']),pending=['0'];
    while(pending.length) for(const next of neighbours.get(pending.pop())??[]) if(!reached.has(next)) { reached.add(next);pending.push(next); }
    ensure([...neighbours.keys()].every(key=>reached.has(key)),'disconnected stock history '+balance._id);
  }
  const outstandingReservations=new Map();
  for(const row of data.stock_reservations) {
    const amount=exact(row.reservedQty).minus(String(row.consumedQty)).minus(String(row.releasedQty)).minus(String(row.movedQty));
    outstandingReservations.set(String(row.balanceId),(outstandingReservations.get(String(row.balanceId))??exact(0)).plus(amount));
  }
  for(const [id,amount] of outstandingReservations) ensure(amount.lte(String(byId('inventory_balances',id).quantityBase)),'reservation exceeds balance');
  for(const hold of data.stock_holds.filter(row=>row.status==='ACTIVE')) {
    for(const portion of hold.allocations) ensure(exact(portion.quantityBase).lte(String(byId('inventory_balances',portion.balanceId).quantityBase)),'hold exceeds balance');
  }
  for(const decision of data.approval_history) {
    const permission=data.permissions.find(row=>row.code===decision.authoritySnapshot.permissionCode);
    const user=byId('users',decision.decidedBy),role=byId('roles',user.roleId);
    ensure(permission&&role.permissionIds.some(id=>same(id,permission._id)),'decision permission');
    for(const line of decision.itemDecisions) ensure(same(itemParents.get(String(line.itemId))?._id,decision.subjectId),'decision item owner');
  }
  for(const req of data.warehouse_transfer_requests) {
    const dispatches=data.transfer_dispatches.filter(row=>same(row.header.requestId,req._id));
    for(const line of req.items) {
      const issued=dispatches.flatMap(row=>row.items).filter(row=>same(row.details.requestLineId,line._id));
      ensure(sum(issued,'qtyBase').lte(String(line.approvedQtyBase??0)),'TR approved quantity exceeded');
      if(req.workflowStatus==='COMPLETED') ensure(sum(issued,'qtyBase').eq(String(line.approvedQtyBase)),'TR closed before dispatch');
    }
    for(const dispatch of dispatches) {
      for(const line of dispatch.items) {
        const receipts=data.transfer_receipts.filter(row=>same(row.header.dispatchId,dispatch._id));
        const received=receipts.flatMap(row=>row.items).filter(row=>same(row.details.dispatchLineId,line._id));
        ensure(sum(received,'qtyBase').lte(String(line.qtyBase)),'receipt exceeds dispatch');
        for(const receipt of receipts) ensure(!same(receipt.header.receivedBy,dispatch.header.dispatchedBy),'dispatcher cannot receive');
        if(req.workflowStatus==='COMPLETED') {
          ensure(sum(received,'qtyBase').eq(String(line.qtyBase)),'TR closed before receipt');
          ensure(receipts.every(row=>row.header.putawayStatus==='COMPLETED'||row.header.putawayStatus==='NOT_APPLICABLE'),'TR putaway incomplete');
        }
      }
    }
  }
  for(const task of data.transfer_orders) {
    for(const row of task.items) if(row.details?.fromLocationId&&row.details?.toLocationId) {
      const source=byId('warehouse_locations',row.details.fromLocationId),target=byId('warehouse_locations',row.details.toLocationId);
      ensure(same(source.warehouseId,target.warehouseId)&&same(source.warehouseId,task.header.warehouseId),'TO crosses physical warehouses');
    }
    if(task.header.taskKind==='RELOCATE') {
      ensure(!task.header.requirementId,'BF03 unexpectedly has internal requirement');
      ensure(same(task.createdBy,task.header.confirmedBy),'BF03 creator confirmation');
    }
  }
  for(const req of data.internal_transfer_requirements) {
    const tasks=data.transfer_orders.filter(row=>same(row.header.requirementId,req._id));
    ensure(tasks.length===1,'internal requirement must create one TO');
    ensure(tasks[0].occurredAt>=req.occurredAt,'TO precedes requirement');
  }

  const packedTotals=new Map(),capacities=new Map();
  for(const stack of data.storage_stacks.filter(row=>!row.isCleared)) {
    const location=byId('warehouse_locations',stack.locationId),user=byId('users',stack.createdBy);
    ensure(user.warehouseIds.some(id=>same(id,location.warehouseId)),'stack warehouse access');
    const contents=data.storage_stack_items.filter(row=>same(row.stackId,stack._id));
    let volume=stack.volumeMethod==='MEASURED'?exact(stack.occupiedLengthMm).mul(stack.occupiedWidthMm).mul(stack.occupiedHeightMm):exact(stack.supportVolumeMm3);
    for(const row of contents) {
      const balance=byId('inventory_balances',row.balanceId),point=byId('stock_holding_points',balance.holdingPointId);
      if(row.packagingState==='SEALED') ensure(exact(row.quantityBase).eq(exact(row.packagingSnapshot.baseUnitsPerPackage).mul(row.sealedPackCount)),'sealed carton quantity mismatch');
      ensure(same(point.locationId,stack.locationId),'stack and balance locations differ');
      packedTotals.set(String(balance._id),(packedTotals.get(String(balance._id))??exact(0)).plus(String(row.quantityBase)));
      if(stack.volumeMethod==='PACKAGES') {
        ensure(row.packagingState==='SEALED','package volume requires sealed packs');
        const p=row.packagingSnapshot;
        volume=volume.plus(exact(p.outerLengthMm).mul(p.outerWidthMm).mul(p.outerHeightMm).mul(row.sealedPackCount));
      }
    }
    const current=capacities.get(String(location._id))??{area:exact(0),volume:exact(0)};
    current.area=current.area.plus(exact(stack.occupiedLengthMm).mul(stack.occupiedWidthMm));current.volume=current.volume.plus(volume);
    capacities.set(String(location._id),current);
    ensure(stack.occupiedLengthMm<=location.usableLengthMm&&stack.occupiedWidthMm<=location.usableWidthMm&&stack.occupiedHeightMm<=location.usableHeightMm,'stack dimensions exceed bin');
  }
  for(const balance of data.inventory_balances) if(byId('stock_holding_points',balance.holdingPointId).type==='LOCATION') {
    ensure((packedTotals.get(String(balance._id))??exact(0)).eq(String(balance.quantityBase)),'stack quantity differs from physical balance');
  }
  for(const [id,used] of capacities) {
    const location=byId('warehouse_locations',id),area=exact(location.usableLengthMm).mul(location.usableWidthMm);
    ensure(used.area.lte(area)&&used.volume.lte(area.mul(location.usableHeightMm)),'bin capacity exceeded');
  }
  for(const count of data.stocktake_counts) {
    const staff=byId('users',count.countedBy),location=byId('warehouse_locations',count.locationId);
    ensure(staff.warehouseIds.some(id=>same(id,location.warehouseId)),'stock counter warehouse access');
  }
  for(const invoice of data.sales_invoices) {
    const so=byId('sales_orders',invoice.salesOrderId);
    ensure(same(so.header.customerId,invoice.customerId),'invoice customer mismatch');
    for(const row of invoice.items) {
      const issue=byId('sales_goods_issues',row.goodsIssueId);
      const issued=issue.items.find(item=>same(item._id,row.goodsIssueItemId));
      const sale=ancestor(row.goodsIssueItemId,'SALES_ORDER');
      ensure(issued&&same(sale?.document._id,so._id)&&same(sale.item._id,row.salesOrderItemId),'invoice source mismatch');
      ensure(row.goodsIssueNo===issue.documentNo&&+row.issuedAt===+issue.occurredAt,'invoice dispatch history');
      const accepted=data.delivery_confirmations.filter(doc=>doc.workflowStatus==='CONFIRMED').flatMap(doc=>doc.items).filter(item=>same(item.details.salesIssueLineId,issued._id));
      ensure(exact(row.billedQtyBase).eq(sum(accepted,'qtyBase'))&&exact(row.issuedQtyBase).eq(String(issued.qtyBase)),'invoice accepted quantity mismatch');
      ensure(exact(row.unitSellingPrice).eq(String(issued.salePriceSnapshot.unitSellingPrice)),'invoice historical price mismatch');
    }
  }
  ensure(data.system_events.every(row=>row.status==='COMPLETED'&&row.payload.demo===true),'demo events must not send real notifications');
  ensure(data.notifications.every(row=>row.emailDelivery.status==='SKIPPED'),'demo email must be skipped');
  return {collections:Object.keys(data).length,records:Object.values(data).reduce((n,rows)=>n+rows.length,0),
    businessDocuments:documents.size,embeddedItems:items.size,balances:data.inventory_balances.length,
    stockTransactions:data.stock_transactions.length,stockMovements:data.stock_movements.length,
    invoices:data.sales_invoices.length,checks:['schemas','references','stock ledger','reservations','approval permissions','BF03/BF04 quantities','bin capacities','invoice accepted quantities','outbound messages disabled']};
}
