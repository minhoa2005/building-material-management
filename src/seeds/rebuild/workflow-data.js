import { exact } from '../../models/model-utils.js';
import { documentCollections } from '../../models/rebuild/collections.js';
import { dataContext, fixtureId, demoDate, decimalValue, hash } from './data.js';

export function createDocument(data,key,kind,actor,header,status='DRAFT',day=28) {
  const document={_id:fixtureId('doc:'+key),documentNo:'DEMO2-'+key,documentKind:kind,workflowStatus:status,
    version:1,createdBy:actor,occurredAt:demoDate(day),createdAt:demoDate(day),updatedAt:demoDate(day),
    note:'Kịch bản mẫu tổng hợp, không phải giao dịch của cửa hàng.',header,items:[],sources:[]};
  data[documentCollections[kind]].push(document);
  return document;
}
export function addItem(document,key,product,batch,qty,lineKind='STANDARD',details) {
  const item={_id:fixtureId('item:'+key),lineNo:document.items.length+1,lineKind,productId:product._id,lotId:batch._id,
    enteredUnit:product.baseUnit,baseUnitSnapshot:product.baseUnit,baseUnitsPerUnit:decimalValue(1),
    enteredQty:decimalValue(qty),qtyBase:decimalValue(qty),productNameSnapshot:product.name,
    ...(details?{details}:{}),sources:[]};
  document.items.push(item);
  return item;
}
export function link(parent,source,child,target) {
  child.sources.push({_id:fixtureId('doc-link:'+parent._id+':'+child._id),documentId:parent._id,
    subjectCollection:documentCollections[parent.documentKind],relationCode:'SOURCE'});
  target.sources.push({_id:fixtureId('item-link:'+source._id+':'+target._id),documentId:parent._id,
    subjectCollection:documentCollections[parent.documentKind],itemId:source._id,relationCode:'SOURCE',linkedQty:target.qtyBase});
}
function locationBalance(data,location,batch) {
  let point=data.stock_holding_points.find(row=>String(row.locationId)===String(location._id));
  if(!point) {
    point={_id:fixtureId('point:'+location._id),type:'LOCATION',locationId:location._id};
    data.stock_holding_points.push(point);
  }
  return pointBalance(data,point,batch);
}
function pointBalance(data,point,batch) {
  let balance=data.inventory_balances.find(row=>String(row.holdingPointId)===String(point._id)&&String(row.batchId)===String(batch._id)&&row.qualityStatus==='GOOD'&&row.ownerType==='STORE');
  if(!balance) {
    balance={_id:fixtureId('balance:'+point._id+':'+batch._id),holdingPointId:point._id,batchId:batch._id,
      qualityStatus:'GOOD',ownerType:'STORE',ownerId:null,quantityBase:decimalValue(0),version:0};
    data.inventory_balances.push(balance);
  }
  return balance;
}
function post(data,key,document,item,from,to,transaction) {
  if(!transaction) {
    transaction={_id:fixtureId('transaction:'+key),sourceType:documentCollections[document.documentKind],sourceId:document._id,
      operation:'CONFIRM',eventKey:key,requestKey:'demo2:'+key,requestHash:hash(key),performedBy:document.createdBy,
      occurredAt:document.occurredAt,recordedAt:document.occurredAt,createdAt:document.occurredAt};
    data.stock_transactions.push(transaction);
  }
  const movement={_id:fixtureId('movement:'+key+':'+item._id),transactionId:transaction._id,
    lineNo:data.stock_movements.filter(row=>String(row.transactionId)===String(transaction._id)).length+1,
    sourceLineId:item._id,quantityBase:item.qtyBase,createdAt:document.occurredAt};
  for(const [side,balance,sign] of [['from',from,-1],['to',to,1]]) {
    if(!balance) continue;
    const next=exact(balance.quantityBase).plus(exact(item.qtyBase).mul(sign));
    if(next.lt(0)) throw new Error('Negative demo stock at '+key);
    movement[side+'BalanceId']=balance._id;
    movement[side+'Before']=balance.quantityBase;
    movement[side+'After']=decimalValue(next);
    balance.quantityBase=decimalValue(next);
    balance.version++;
  }
  data.stock_movements.push(movement);
  document.stockTransactionId=transaction._id;
  document.postedBy=document.createdBy;
  document.postedAt=document.occurredAt;
  return transaction;
}
function approve(data,document,owner,permissionCode,scope) {
  const decision={_id:fixtureId('approval:'+document._id),decisionKey:'demo2-approval:'+document._id,
    subjectType:documentCollections[document.documentKind],subjectId:document._id,subjectRevision:document.version,decisionScope:scope,
    reviewedContent:{documentNo:document.documentNo,items:document.items.map(row=>({_id:row._id,quantityBase:row.qtyBase}))},
    decision:'APPROVE',reason:'Duyệt nhu cầu mẫu',itemDecisions:document.items.map(row=>({itemId:row._id,approvedQtyBase:row.qtyBase,outcome:'APPROVE'})),
    requestedBy:document.createdBy,decidedBy:owner,decidedAt:document.occurredAt,recordedAt:document.occurredAt,
    authoritySnapshot:{roleCode:'OWNER',permissionCode,warehouseIds:[]},basisRefs:[],evidenceIds:[]};
  data.approval_history.push(decision);
  return decision;
}
function requirement(data,key,source,sourceItem,task,warehouseId,purpose,actor) {
  const req=createDocument(data,'ITR-'+key,'INTERNAL_TRANSFER_REQUIREMENT',actor,
    {warehouseId,sourceDocumentId:source._id,sourceType:documentCollections[source.documentKind],taskKind:purpose},'COMPLETED');
  req.occurredAt=source.occurredAt;
  req.createdAt=source.occurredAt;
  req.updatedAt=task.occurredAt;
  const reqItem={...sourceItem,_id:fixtureId('item:ITR-'+key),lineNo:1,sources:[],lineKind:'STANDARD'};
  delete reqItem.details;
  req.items.push(reqItem);
  link(source,sourceItem,req,reqItem);
  link(req,reqItem,task,task.items[0]);
  task.header.requirementId=req._id;
  task.header.confirmedBy=actor;
  task.header.confirmedAt=task.occurredAt;
  return req;
}

export function addTransferExamples(context) {
  const {data,byId,actor}=context;
  const owner=actor('OWNER'), sourceActor=actor('WAREHOUSE');
  const receiver=data.users.find(row=>row.username==='warehouse2@ceratile.vn')._id;
  const sourceWarehouse=data.warehouses.find(row=>row.code==='WH01');
  const destinationWarehouse=data.warehouses.find(row=>row.code==='WH02');
  const location=(warehouseId,kind)=>data.warehouse_locations.find(row=>String(row.warehouseId)===String(warehouseId)&&row.locationType===kind);
  const sourceLocation=location(sourceWarehouse._id,'STORAGE'), staging=location(sourceWarehouse._id,'STAGING');
  const receiving=location(destinationWarehouse._id,'RECEIVING'), destinationLocation=location(destinationWarehouse._id,'STORAGE');
  const product=data.products[0],batch=data.product_batches.find(row=>String(row.productId)===String(product._id)&&row.identificationStatus==='VERIFIED');
  const sourceBalance=locationBalance(data,sourceLocation,batch), stagingBalance=locationBalance(data,staging,batch);
  const receivingBalance=locationBalance(data,receiving,batch), destinationBalance=locationBalance(data,destinationLocation,batch);

  // Bring the original BF04 example into the reviewed picking/putaway requirement structure.
  for(const dispatch of data.transfer_dispatches) {
    const request=context.document(dispatch.header.requestId);
    Object.assign(dispatch.header,{sourceWarehouseId:request.header.sourceWarehouseId,destinationWarehouseId:request.header.destinationWarehouseId,approvedRevision:1});
    for(const item of dispatch.items) {
      item.lineKind='TRANSFER_OUTBOUND';
      item.details={requestLineId:request.items[0]._id,sourceBalanceId:sourceBalance._id,stagingLocationId:staging._id};
      const pick=data.transfer_orders.find(row=>row.items.some(line=>line.sources?.some(ref=>String(ref.itemId)===String(item._id))));
      if(pick) {
        const pickTransaction=byId('stock_transactions',pick.stockTransactionId);
        const dispatchTransaction=byId('stock_transactions',dispatch.stockTransactionId);
        const pickMovements=data.stock_movements.filter(row=>String(row.transactionId)===String(pickTransaction._id));
        const dispatchMovements=data.stock_movements.filter(row=>String(row.transactionId)===String(dispatchTransaction._id));
        for(const [index,movement] of [...pickMovements,...dispatchMovements].entries()) {
          movement.transactionId=pickTransaction._id; movement.lineNo=index+1;
        }
        data.stock_transactions=data.stock_transactions.filter(row=>String(row._id)!==String(dispatchTransaction._id));
        pick.occurredAt=dispatch.occurredAt;
        pick.postedAt=dispatch.occurredAt;
        pickTransaction.occurredAt=dispatch.occurredAt;
        pickTransaction.recordedAt=dispatch.occurredAt;
        dispatch.stockTransactionId=pickTransaction._id;
        requirement(data,'PICK-ORIGINAL',dispatch,item,pick,sourceWarehouse._id,'PICK',sourceActor);
      }
    }
  }
  for(const receipt of data.transfer_receipts) {
    receipt.header.warehouseId=destinationWarehouse._id;
    receipt.header.putawayStatus='COMPLETED';
    for(const item of receipt.items) item.details.receivingLocationId=receiving._id;
    const task=data.transfer_orders.find(row=>row.items.some(line=>line.sources?.some(ref=>String(ref.itemId)===String(receipt.items[0]._id))));
    if(task) requirement(data,'PUTAWAY-ORIGINAL',receipt,receipt.items[0],task,destinationWarehouse._id,'PUTAWAY',receiver);
  }
  const originalDispatch=data.transfer_dispatches[0];
  const transit=data.stock_holding_points.find(row=>String(row.dispatchLineId)===String(originalDispatch.items[0]._id));
  const transitBalance=pointBalance(data,transit,batch);
  const remaining=createDocument(data,'RECEIPT-REMAINING','MWTR',receiver,
    {dispatchId:originalDispatch._id,receivedBy:receiver,receivedAt:demoDate(28),warehouseId:destinationWarehouse._id,putawayStatus:'COMPLETED'},'POSTED');
  const received=addItem(remaining,'remaining',product,batch,'2','TRANSFER_RECEIPT',{dispatchLineId:originalDispatch.items[0]._id,qualityCode:'GOOD',receivingLocationId:receiving._id});
  link(originalDispatch,originalDispatch.items[0],remaining,received);
  post(data,'receive-remaining',remaining,received,transitBalance,receivingBalance);
  const putaway=createDocument(data,'PUTAWAY-REMAINING','TO',receiver,{warehouseId:destinationWarehouse._id,taskKind:'PUTAWAY',assignedTo:receiver},'CONFIRMED');
  const putItem=addItem(putaway,'putaway-remaining',product,batch,'2','WAREHOUSE_TASK',{fromLocationId:receiving._id,toLocationId:destinationLocation._id,qualityCode:'GOOD'});
  requirement(data,'PUTAWAY-REMAINING',remaining,received,putaway,destinationWarehouse._id,'PUTAWAY',receiver);
  post(data,'putaway-remaining',putaway,putItem,receivingBalance,destinationBalance);
  const originalRequest=context.document(originalDispatch.header.requestId);
  originalRequest.workflowStatus='COMPLETED';
  Object.assign(originalRequest.header,{approvalStatus:'APPROVED',executionStatus:'COMPLETED',approvedRevision:1,closedBy:receiver,closedAt:demoDate(28)});
  originalRequest.items[0].approvedQtyBase=originalRequest.items[0].qtyBase;
  for(const discrepancy of data.stock_discrepancies) {
    discrepancy.workflowStatus='RESOLVED';
    for(const row of discrepancy.items) {
      row.details.resolutionStatus='RESOLVED';
      row.details.resolutionDocumentId=remaining._id;
    }
  }

  // One approved TR, two dispatches. Each picking TO posts both staging and in-transit in one transaction.
  const request=createDocument(data,'TR-TWO-DISPATCHES','TRANSFER_REQUEST',sourceActor,
    {sourceWarehouseId:sourceWarehouse._id,destinationWarehouseId:destinationWarehouse._id,approvedRevision:1,
      approvalStatus:'APPROVED',executionStatus:'COMPLETED',closedBy:receiver,closedAt:demoDate(29)},'COMPLETED',29);
  const requested=addItem(request,'multi-request',product,batch,'8');
  requested.approvedQtyBase=decimalValue(8);
  approve(data,request,owner,'stock_transfer:approve','TRANSFER_APPROVAL');
  for(let n=1;n<=2;n++) {
    const dispatch=createDocument(data,'DISPATCH-'+n,'TRANSFER_DISPATCH',sourceActor,
      {requestId:request._id,dispatchedBy:sourceActor,dispatchedAt:demoDate(29),sourceWarehouseId:sourceWarehouse._id,
        destinationWarehouseId:destinationWarehouse._id,approvedRevision:1},'POSTED',29);
    const issued=addItem(dispatch,'dispatch-'+n,product,batch,'4','TRANSFER_OUTBOUND',
      {requestLineId:requested._id,sourceBalanceId:sourceBalance._id,stagingLocationId:staging._id});
    link(request,requested,dispatch,issued);
    const point={_id:fixtureId('transit:'+n),type:'IN_TRANSIT',dispatchLineId:issued._id};
    data.stock_holding_points.push(point);
    const onRoad=pointBalance(data,point,batch);
    const pick=createDocument(data,'PICK-'+n,'TO',sourceActor,{warehouseId:sourceWarehouse._id,taskKind:'PICK',assignedTo:sourceActor},'CONFIRMED',29);
    const picked=addItem(pick,'pick-'+n,product,batch,'4','WAREHOUSE_TASK',{fromLocationId:sourceLocation._id,toLocationId:staging._id,qualityCode:'GOOD'});
    requirement(data,'PICK-'+n,dispatch,issued,pick,sourceWarehouse._id,'PICK',sourceActor);
    const transaction=post(data,'pick-'+n,pick,picked,sourceBalance,stagingBalance);
    post(data,'dispatch-'+n,dispatch,issued,stagingBalance,onRoad,transaction);
    const receipt=createDocument(data,'RECEIVE-'+n,'MWTR',receiver,
      {dispatchId:dispatch._id,receivedBy:receiver,receivedAt:demoDate(29),warehouseId:destinationWarehouse._id,putawayStatus:'COMPLETED'},'POSTED',29);
    const accepted=addItem(receipt,'receive-'+n,product,batch,'4','TRANSFER_RECEIPT',
      {dispatchLineId:issued._id,qualityCode:'GOOD',receivingLocationId:receiving._id});
    link(dispatch,issued,receipt,accepted);
    post(data,'receive-'+n,receipt,accepted,onRoad,receivingBalance);
    const task=createDocument(data,'PUT-'+n,'TO',receiver,{warehouseId:destinationWarehouse._id,taskKind:'PUTAWAY',assignedTo:receiver},'CONFIRMED',29);
    const stored=addItem(task,'put-'+n,product,batch,'4','WAREHOUSE_TASK',{fromLocationId:receiving._id,toLocationId:destinationLocation._id,qualityCode:'GOOD'});
    requirement(data,'PUT-'+n,receipt,accepted,task,destinationWarehouse._id,'PUTAWAY',receiver);
    post(data,'put-'+n,task,stored,receivingBalance,destinationBalance);
  }

  // BF03 has only a creator-owned TO and its confirmation, between two bins in WH01.
  const otherLocation={...sourceLocation,_id:fixtureId('location:relocate'),code:'WH01-STORAGE-B',name:'Ô lưu trữ B (mẫu)'};
  data.warehouse_locations.push(otherLocation);
  const otherBalance=locationBalance(data,otherLocation,batch);
  const relocation=createDocument(data,'RELOCATE','TO',sourceActor,
    {warehouseId:sourceWarehouse._id,taskKind:'RELOCATE',assignedTo:sourceActor,confirmedBy:sourceActor,confirmedAt:demoDate(30)},'CONFIRMED',30);
  const moved=addItem(relocation,'relocate',product,batch,'8','WAREHOUSE_TASK',
    {fromLocationId:sourceLocation._id,toLocationId:otherLocation._id,qualityCode:'GOOD',sourceBalanceId:sourceBalance._id});
  post(data,'relocate',relocation,moved,sourceBalance,otherBalance);
}

export function addInvoiceExample(context) {
  const {data,actor}=context;
  const refreshed=dataContext(data);
  const so=data.sales_orders.find(row=>row.workflowStatus==='COMPLETED');
  const customer=refreshed.byId('customers',so.header.customerId);
  const issues=data.sales_goods_issues.filter(issue=>issue.items.some(row=>refreshed.ancestor(row._id,'SALES_ORDER')?.document._id.equals(so._id)));
  const lines=[];
  for(const issue of issues) for(const row of issue.items) {
    const confirmation=data.delivery_confirmations.flatMap(doc=>doc.items).filter(item=>String(item.details.salesIssueLineId)===String(row._id));
    const accepted=confirmation.reduce((sum,item)=>sum.plus(String(item.qtyBase)),exact(0));
    const sale=refreshed.ancestor(row._id,'SALES_ORDER').item;
    lines.push({_id:fixtureId('invoice-line:'+row._id),salesOrderItemId:sale._id,goodsIssueId:issue._id,goodsIssueItemId:row._id,
      goodsIssueNo:issue.documentNo,issuedAt:issue.occurredAt,productId:row.productId,productNameSnapshot:row.productNameSnapshot,
      issuedQtyBase:row.qtyBase,billedQtyBase:decimalValue(accepted),saleUnit:sale.enteredUnit,baseUnitsPerSaleUnit:sale.baseUnitsPerUnit,
      unitSellingPrice:sale.unitSellingPrice,lineAmount:decimalValue(accepted.div(String(sale.baseUnitsPerUnit)).mul(String(sale.unitSellingPrice)).toDecimalPlaces(0))});
  }
  data.sales_invoices.push({_id:fixtureId('invoice'),invoiceNo:'DEMO2-INVOICE',salesOrderId:so._id,customerId:customer._id,
    customerSnapshot:{name:customer.name,phone:customer.phone},currencyCode:'VND',items:lines,
    totalAmount:decimalValue(lines.reduce((sum,row)=>sum.plus(String(row.lineAmount)),exact(0))),
    status:'ISSUED',createdBy:actor('ACCOUNTANT'),issuedBy:actor('ACCOUNTANT'),issuedAt:demoDate(14),createdAt:demoDate(14),version:1});
}

export function addStorageExamples(context,actor) {
  const {data,byId}=context;
  for(const balance of data.inventory_balances) {
    if(exact(balance.quantityBase).isZero()) continue;
    const point=byId('stock_holding_points',balance.holdingPointId);
    if(point.type!=='LOCATION') continue;
    const warehouseId=byId('warehouse_locations',point.locationId).warehouseId;
    const staff=data.users.find(user=>user.warehouseIds.some(id=>String(id)===String(warehouseId))&&byId('roles',user.roleId).code==='WAREHOUSE');
    actor=staff._id;
    const stack={_id:fixtureId('stack:'+balance._id),locationId:point.locationId,code:'DEMO-STACK-'+(data.storage_stacks.length+1),
      occupiedLengthMm:700,occupiedWidthMm:700,occupiedHeightMm:1200,volumeMethod:'MEASURED',isCleared:false,
      measurementNote:'Kích thước giả lập của cụm hàng lẻ',createdBy:actor,version:1};
    data.storage_stacks.push(stack);
    data.storage_stack_items.push({_id:fixtureId('stack-item:'+balance._id),stackId:stack._id,balanceId:balance._id,
      packagingState:'LOOSE',packagingKey:'LOOSE',quantityBase:balance.quantityBase,createdBy:actor,version:1});
  }
}
