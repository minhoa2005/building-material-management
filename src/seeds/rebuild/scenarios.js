import { exact } from '../../models/model-utils.js';
import { dataContext, demoDate, fixtureId, decimalValue, demoPng, hash } from './data.js';
import { createDocument, addItem, link } from './workflow-data.js';

// Turn the completed sample into two real dispatches on distinct dates, without
// changing its ordered, physical, accepted or invoiced totals.
export function splitCompletedSale(data) {
  const ctx=dataContext(data);
  const so=data.sales_orders.find(row=>row.workflowStatus==='COMPLETED');
  const issue=data.sales_goods_issues.find(row=>ctx.ancestor(row.items[0]._id,'SALES_ORDER')?.document._id.equals(so._id));
  const issued=issue.items[0],originalQty=exact(issued.qtyBase),half=originalQty.div(2);
  const delivery=ctx.ancestor(issued._id,'OUTBOUND_DELIVERY');
  const issue2={...issue,_id:fixtureId('second-sales-issue'),documentNo:'DEMO2-GI-SECOND',occurredAt:demoDate(13),createdAt:demoDate(13),updatedAt:demoDate(13),items:[],sources:[]};
  issue2.header={...issue.header,issuedAt:demoDate(13)};
  const issued2={...issued,_id:fixtureId('second-sales-item'),sources:[]};
  for(const item of [issued,issued2]) { item.qtyBase=decimalValue(half);item.enteredQty=decimalValue(half); }
  for(const source of issued.sources) source.linkedQty=issued.qtyBase;
  issue2.items.push(issued2);
  link(delivery.document,delivery.item,issue2,issued2);
  data.sales_goods_issues.push(issue2);
  const movement=data.stock_movements.find(row=>String(row.sourceLineId)===String(issued._id));
  const transaction=ctx.byId('stock_transactions',movement.transactionId);
  const transaction2={...transaction,_id:fixtureId('second-sales-transaction'),sourceId:issue2._id,
    requestKey:'demo2:second-sale',requestHash:hash('demo2:second-sale'),eventKey:'second-sale',occurredAt:issue2.occurredAt,recordedAt:issue2.occurredAt,createdAt:issue2.occurredAt};
  data.stock_transactions.push(transaction2);
  const final=movement.fromAfter;
  movement.quantityBase=issued.qtyBase;
  movement.fromAfter=decimalValue(exact(movement.fromBefore).minus(half));
  data.stock_movements.push({...movement,_id:fixtureId('second-sales-movement'),transactionId:transaction2._id,
    sourceLineId:issued2._id,fromBefore:movement.fromAfter,fromAfter:final,createdAt:issue2.occurredAt});
  ctx.byId('inventory_balances',movement.fromBalanceId).version++;
  Object.assign(issue2,{stockTransactionId:transaction2._id,postedAt:issue2.occurredAt});
  // The original picking task covers the delivery order for both dispatches.
  for(const task of data.transfer_orders) if(task.items.some(item=>item.sources?.some(ref=>String(ref.itemId)===String(issued._id)))) {
    task.sources=[];
    task.items[0].sources=[];
    link(delivery.document,delivery.item,task,task.items[0]);
  }
  const pod=data.delivery_confirmations.find(doc=>doc.items.some(item=>String(item.details.salesIssueLineId)===String(issued._id)));
  const accepted=pod.items[0];
  accepted.qtyBase=decimalValue(half);accepted.enteredQty=decimalValue(half);
  for(const source of accepted.sources) source.linkedQty=accepted.qtyBase;
  const accepted2={...accepted,_id:fixtureId('second-accepted-item'),lineNo:2,sources:[],details:{...accepted.details,salesIssueLineId:issued2._id}};
  pod.items.push(accepted2);
  link(issue2,issued2,pod,accepted2);
}

export function addOperationalExamples(data) {
  const ctx=dataContext(data);
  // Record the six units actually accepted in the existing 10-issued/4-returned example.
  const failure=data.failed_deliveries[0],failedItem=failure.items[0];
  const issued=ctx.items.get(String(failedItem.details.salesIssueLineId));
  const issue=ctx.itemParents.get(String(issued._id)),sale=ctx.ancestor(issued._id,'SALES_ORDER');
  const photoId=fixtureId('partial-pod-photo'),operationId=fixtureId('partial-pod-operation');
  const pod=createDocument(data,'POD-PARTIAL','DELIVERY_CONFIRMATION',issue.createdBy,{
    salesOrderId:sale.document._id,warehouseId:issue.header.warehouseId,goodsIssueId:issue._id,
    recipientName:'Khách hàng mẫu',deliveredAt:demoDate(14),confirmedBy:issue.createdBy,confirmedAt:demoDate(14),operationId,
  },'CONFIRMED',14);
  const accepted=addItem(pod,'partial-pod',ctx.byId('products',issued.productId),ctx.byId('product_batches',issued.lotId),'6',
    'DELIVERY_CONFIRMATION',{salesIssueLineId:issued._id,photoEvidenceId:photoId});
  link(issue,issued,pod,accepted);
  data.attachments.push({_id:photoId,ownerDocumentType:'delivery_confirmations',ownerDocumentId:pod._id,ownerRevision:1,
    purpose:'DELIVERY_PHOTO',originalName:'demo-pod.png',mediaType:'image/png',sizeBytes:demoPng.length,
    storageKey:'demo-fixtures/'+photoId+'.png',checksum:hash(demoPng),uploadedBy:issue.createdBy,uploadedAt:pod.occurredAt,
    accessCategory:'BUSINESS',status:'ATTACHED',createdAt:pod.occurredAt});
  data.operation_records.push({_id:operationId,actorType:'USER',actorId:issue.createdBy,operationCode:'CONFIRM_POD',
    requestKey:'demo2:partial-pod',requestHash:hash('partial-pod'),operationKey:'demo2:partial-pod',
    subjectType:'delivery_confirmations',subjectId:pod._id,versionBefore:0,versionAfter:1,resultRefs:[{documentType:'delivery_confirmations',documentId:pod._id}],
    resultCode:'SUCCESS',completedAt:pod.occurredAt,createdAt:pod.occurredAt});

  // Keep both original counting and recounting attempts; plan uses the selected recount.
  const first=data.stocktake_counts.find(row=>ctx.document(row.stocktakeId).workflowStatus!=='CLOSED');
  const recount={...first,_id:fixtureId('recount'),attemptNo:2,previousCountId:first._id,recountReason:'Kiểm đếm lại để xác minh thiếu 2 viên (mẫu)',
    countedAt:demoDate(25,11),recordedAt:demoDate(25,11),createdAt:demoDate(25,11)};
  data.stocktake_counts.push(recount);
  const plan=data.stocktake_resolution_plans.find(row=>String(row.header.stocktakeId)===String(first.stocktakeId));
  plan.selectedCounts=[{snapshotId:first.snapshotId,countId:recount._id}];
  plan.items[0].details.countId=recount._id;
  for(const adjustment of data.stock_adjustments) for(const item of adjustment.items) if(String(item.details.countId)===String(first._id)) item.details.countId=recount._id;

  // Demonstrate a custom role using existing permissions, without another policy system.
  const warehouseRole=data.roles.find(row=>row.code==='WAREHOUSE');
  data.roles.push({...warehouseRole,_id:fixtureId('custom-role'),code:'WAREHOUSE_LEAD',name:'Trưởng ca kho (mẫu)',isSystemRole:false,
    description:'Vai trò tùy chỉnh; quyền lấy từ danh mục có sẵn',version:1});
}

export function addHandoverExamples(data) {
  const team=data.delivery_teams[0];
  for(const dispatch of data.transfer_dispatches) {
    if(dispatch.handovers?.length) continue;
    const handover={_id:fixtureId('handover:'+dispatch._id),documentNo:dispatch.documentNo+'-HANDOVER',
      documentKind:'HANDOVER',workflowStatus:'CONFIRMED',version:1,createdBy:dispatch.createdBy,
      occurredAt:dispatch.occurredAt,createdAt:dispatch.occurredAt,updatedAt:dispatch.occurredAt,sources:[],items:[],
      header:{relatedDocumentId:dispatch._id,recipientName:'Lái xe nội bộ mẫu',carrierId:team._id,
        teamNameAtHandover:team.name,handedOverAt:dispatch.occurredAt,confirmedBy:dispatch.createdBy}};
    for(const line of dispatch.items) {
      const item={...line,_id:fixtureId('handover-item:'+line._id),lineKind:'STANDARD',sources:[]};delete item.details;
      handover.items.push(item);link(dispatch,line,handover,item);
    }
    dispatch.handovers=[handover];
  }
}
