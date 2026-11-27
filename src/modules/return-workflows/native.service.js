import { guardWarehouses } from '../../shared/utils/stock.js';
import { directInspectionPortions, directReceiptPortions, receiveDirect } from './direct-customer-return.js';
import { nextDocumentFields } from '../../shared/utils/document-number.js';
import { attachStored } from './native.read.js';
import * as s from './native.shared.js';
const {m,exact,sum,same,ref,source,copy,fromBalance,envelope,scoped,replay,command,newId,checkVersion,saveVersion,evidence,requirePermission,requireWarehouseAccess,validationError,notFoundError,sourceContext,guardLocations,beginStock,takeStock,postIn,savePosted,verifyCapacity,serialize,hasPermission}=s;
const changed = (doc,input,session) => saveVersion(doc,input.expectedVersion,session);
const operation = (Model,user,id,input,code,permission,work) => command(user,code,permission,id,input,replay(Model),async(session,actor,operationId)=>{
 const doc=await scoped(Model,id,actor,session);checkVersion(doc,input.expectedVersion);
 const result=await work(doc,session,actor,operationId);return {document:await changed(doc,input,session),versionBefore:input.expectedVersion,...result};
});
const requireState=(doc,states)=>{if(!states.includes(doc.workflowStatus))throw validationError('Trạng thái không cho phép thao tác');};
const rowOf=(doc,id)=>{const row=doc.items.id(id);if(!row)throw validationError('Dòng không thuộc hồ sơ');return row;};
const attached=(doc,ids)=>{doc.evidenceIds.addToSet(...ids);};
async function decision(doc,scope,content,user,session,input,requestedBy=doc.createdBy){
 const approval=await new m.ApprovalHistory({decisionKey:String(newId()),subjectType:doc.constructor.collection.name,subjectId:doc._id,subjectRevision:doc.version,decisionScope:scope,reviewedContent:serialize(content),decision:input.decision??'APPROVE',reason:input.reason??input.note,requestedBy,decidedBy:user._id,decidedAt:new Date(),recordedAt:new Date(),itemDecisions:content.items.map(i=>({itemId:i._id,approvedQtyBase:String(i.approvedQtyBase??i.qtyBase),outcome:i.details?.outcome??scope})),authoritySnapshot:{roleCode:user.roleId.code,permissionCode:scope==='DEFECT_DISPOSITION'?'defect:approve':scope==='STANDARD_ACCEPTANCE'?'customer_return:accept':'customer_return:approve_exception',warehouseIds:user.warehouseIds},basisRefs:[ref(doc)],evidenceIds:doc.evidenceIds}).save({session});
 return approval;
}
export async function createDefect(user,input,stored){
 if(stored)input={...input,evidenceChecksum:stored.checksum};
 return command(user,'CREATE_DEFECT','defect:create',null,input,replay(m.DefectReport),async(session,actor)=>{
  requireWarehouseAccess(actor,input.warehouseId);const {balance,location}=await sourceContext(input.balanceId,session);
  if(!location||!same(location.warehouseId,input.warehouseId))throw validationError('Tồn nguồn sai kho');
  if(input.sourceKind==='STOCKTAKE'){
   const lock=await m.StocktakeLocationLock.findOne({locationId:location._id,stocktakeId:input.stocktakeId,status:'LOCKED'}).session(session);if(!lock)throw validationError('Không có kiểm kê khóa đúng vị trí');
   await m.WarehouseLocation.updateOne({_id:location._id},{$inc:{operationVersion:1}},{session});
  }else await guardLocations([location._id],session);
  const free=await s.heldQuantity(balance._id,session);if(exact(input.quantity).plus(free).gt(String(balance.quantityBase)))throw validationError('Vượt lượng chưa chặn');
  const item=await fromBalance(balance,input.quantity,session,{balanceId:balance._id,ownerType:balance.ownerType,ownerId:balance.ownerId,note:input.reason});
  const doc=await envelope(m.DefectReport,actor,{warehouseId:input.warehouseId,discoveredAt:new Date(),reason:input.reason,reportedBy:actor._id,recordedAt:new Date(),sourceKind:input.sourceKind},[item],'OPEN',input.reason);
  if(stored)await attachStored(doc,stored,actor,session);
  if(input.sourceLineId){const models={RECEIPT:m.PurchaseReceipt,ISSUE:m.SalesGoodsIssue,TRANSFER:m.TransferReceipt,CUSTOMER_RETURN:m.CustomerReturnReceipt};const Model=models[input.sourceKind];if(!Model)throw validationError('Invalid defect source');const origin=await s.itemById(Model,input.sourceLineId,actor,session);if(!same(origin.item.lotId,item.lotId)||!same(origin.doc.header.warehouseId,input.warehouseId))throw validationError('Defect source does not match batch and warehouse');doc.sources=[source(origin.doc,origin.item,'DEFECT_SOURCE',input.quantity)];doc.header.sourceRef=ref(origin.doc,origin.item);}else if(!['MANUAL','STOCKTAKE'].includes(input.sourceKind))throw validationError('Missing defect source');
  const holdId=newId();doc.holds.push({_id:holdId,defectReportLineId:item._id,stocktakeId:input.stocktakeId,recordedBy:actor._id,recordedAt:new Date(),reason:input.reason,evidenceIds:doc.evidenceIds,allocations:[{balanceId:balance._id,quantityBase:input.quantity}],events:[],status:'ACTIVE',version:1});
  if(input.disposition){const p=input.disposition;doc.resolutionPlans.push({...await nextDocumentFields(m.DefectReport,'DEF_PLAN',doc.header.warehouseId,session,undefined,'resolutionPlans'),documentKind:'DISPOSITION',sources:[source(doc,item,'DEFECT_PLAN')],workflowStatus:'SUBMITTED',version:1,createdBy:actor._id,occurredAt:new Date(),note:p.reason,header:{defectReportId:doc._id,proposedBy:actor._id,submittedAt:new Date()},items:[copy(item,p.quantity,1,{lineKind:'DISPOSITION',details:{defectLineId:item._id,outcome:p.outcome,targetQuality:p.targetQuality}})]});}
  await doc.save({session});return {document:doc};
 });
}
function requireDecisionLines(items,input){
 if(input.lines && (input.lines.length!==items.length || !items.every(item=>input.lines.some(line=>same(line.lineId,item._id)))))
  throw validationError('Phải quyết định đủ các dòng, nhập 0 cho phần từ chối');
}
export const decideDefect=(user,id,input)=>operation(m.DefectReport,user,id,input,'DECIDE_DEFECT','defect:approve',async(doc,session,actor)=>{
 const plan=input.planId?doc.resolutionPlans.id(input.planId):doc.resolutionPlans.at(-1);if(!plan||plan.workflowStatus!=='SUBMITTED')throw validationError('Không có phương án chờ duyệt');
 requireDecisionLines(plan.items,input);
 for(const item of plan.items){item.approvedQtyBase=input.lines?.find(r=>same(r.lineId,item._id))?.qtyBase??input.approvedQty??item.qtyBase;await s.assertWholeQuantity(item.productId,item.approvedQtyBase,session);if(exact(item.approvedQtyBase).gt(String(item.qtyBase)))throw validationError('Vượt lượng đề xuất');}
 const approval=await decision(doc,'DEFECT_DISPOSITION',{planId:plan._id,planVersion:plan.version,items:plan.items},actor,session,input,plan.createdBy);
 plan.reviewDecisions.push({decisionId:approval._id,revision:plan.version,reviewedBy:actor._id,reviewedAt:new Date(),decision:input.decision,reason:input.reason});plan.workflowStatus=input.decision==='APPROVE'?'APPROVED':'REJECTED';return {decisionId:approval._id};
});
export const executeDefect=(user,id,input)=>operation(m.DefectReport,user,id,input,'EXECUTE_DEFECT','defect:execute',async(doc,session,actor)=>{
 await evidence(doc,input.evidenceIds,session);const plan=input.planId?doc.resolutionPlans.id(input.planId):doc.resolutionPlans.at(-1);if(!plan||plan.workflowStatus!=='APPROVED')throw validationError('Chưa có phương án duyệt');
 const approval=await m.ApprovalHistory.findById(plan.reviewDecisions.at(-1)?.decisionId).session(session);if(!approval||approval.decision!=='APPROVE')throw validationError('Thiếu quyết định');
 for(const request of input.lines??plan.items.filter(i=>exact(i.approvedQtyBase).gt(0)).map(i=>({lineId:i._id,qtyBase:String(i.approvedQtyBase)}))){
  const item=plan.items.id(request.lineId);if(!item)throw validationError('Sai dòng phương án');const defectItem=rowOf(doc,item.details.defectLineId);
  const executed=doc.inspections.filter(e=>same(e.itemId,item._id));if(exact(request.qtyBase).plus(sum(executed,'quantityBase')).gt(String(item.approvedQtyBase)))throw validationError('Vượt lượng đã duyệt');
  const hold=doc.holds.find(h=>same(h.defectReportLineId,defectItem._id)&&h.status==='ACTIVE');if(!hold||hold.allocations.length!==1||hold.stocktakeId)throw validationError('Phải xử lý trong phương án kiểm kê');
  const held=sum(hold.allocations,'quantityBase').minus(sum(hold.events,'quantityBase'));if(exact(request.qtyBase).gt(held))throw validationError('Vượt lượng chặn còn lại');
  const ctx=await sourceContext(defectItem.balanceId,session);requireWarehouseAccess(actor,ctx.location?.warehouseId);await guardLocations([ctx.location?._id],session);
  if(ctx.balance.ownerType!=='STORE')throw validationError('Chỉ xử lý hàng thuộc cửa hàng');
  let transactionId;
  if(item.details.outcome!=='RELEASE'){
   const Model=item.details.outcome==='SCRAP'?m.StockScrapRecord:m.StockQualityChange;
   const execution=await envelope(Model,actor,{warehouseId:doc.header.warehouseId,planId:plan._id,...(Model===m.StockScrapRecord&&{approvedRevision:plan.version,destroyedBy:actor._id,destroyedAt:new Date()})},[copy(defectItem,request.qtyBase,1,{sources:[source(doc,defectItem,'DEFECT_EXECUTION',request.qtyBase)]})],'DRAFT',input.note);
   execution.evidenceIds=input.evidenceIds;const posting=beginStock(execution,actor,'DEFECT_EXECUTION',input);
   const {portions}=await takeStock(ctx.balance._id,request.qtyBase,execution.items[0]._id,posting,actor,session,{holdId:hold._id,allowOpening:item.details.outcome==='SCRAP'});
   if(Model===m.StockQualityChange){if(!item.details.targetQuality)throw validationError('Thiếu phẩm cấp đích');await postIn(execution,execution.items[0],actor,session,posting,{locationId:request.locationId??ctx.location._id,qualityCode:item.details.targetQuality,portions});}
   await savePosted(execution,posting,actor,session);transactionId=posting._id;
  }else if(ctx.balance.qualityStatus!=='GOOD')throw validationError('Giải phóng chỉ dành hàng đạt; đổi phẩm cấp phải có phương án riêng');
  hold.events.push({kind:'CONSUMED',quantityBase:request.qtyBase,sourceRef:ref(doc,defectItem),performedBy:actor._id,performedAt:new Date(),reason:input.note});hold.version++;if(exact(request.qtyBase).eq(held))hold.status='RESOLVED';
  doc.inspections.push({itemId:item._id,performedBy:actor._id,performedAt:new Date(),quantityBase:request.qtyBase,transactionId,evidenceIds:input.evidenceIds,note:input.note});
 }
 doc.workflowStatus=doc.holds.some(h=>h.status==='ACTIVE')?'PARTIAL':'CLOSED';attached(doc,input.evidenceIds);return {};
});
async function returnSource(input,user,session){
 if(input.historicalExternalLineId){
  const {doc,item}=await s.itemById(m.ExternalReference,input.historicalExternalLineId,user,session);
  if(doc.referenceKind!=='HISTORICAL_DELIVERY'||doc.status!=='VERIFIED'||!doc.verifiedBy||!doc.verifiedAt||!doc.evidenceIds.length||!item.lotId||!item.baseUnitsPerUnit)throw validationError('Nguồn lịch sử chưa xác minh');
  const competing=await m.SalesOrder.exists({'header.externalReferenceId':doc._id}).session(session);if(competing)throw validationError('Nguồn đã có chuỗi WMS, dùng nguồn giao thực tế');
  const legacyCustomer=!doc.customerName&&doc.customerId&&await m.Customer.findById(doc.customerId).select('name phone').session(session).lean();
  await s.lockSource(doc,item,session);return {doc,item:{...item.toObject(),qtyBase:String(item.eligibleQty),enteredQty:exact(item.eligibleQty).div(String(item.baseUnitsPerUnit)).toFixed(),productNameSnapshot:'Historical source'},customerId:doc.customerId,customerName:doc.customerName||legacyCustomer?.name,customerPhone:doc.customerPhone||legacyCustomer?.phone,warehouseId:doc.warehouseId,allowance:exact(item.eligibleQty).minus(String(item.previouslyReturnedQty)),sourceKind:'EXTERNAL',intakeMode:doc.customerName?'DIRECT':'LEGACY'};
 }
 const c=await s.issueSource(input.salesIssueLineId,user,session,{allowWarehouseCreatedStandalone:true}),direct=c.doc.header.fulfillmentMode==='DIRECT';
 if(c.standaloneSale)return {...c,customerName:c.doc.header.customerName,warehouseId:c.doc.header.warehouseId,allowance:s.standaloneSaleReturnAllowance(c.issued,await s.undeliveredReturnedQuantity(c.item._id,session),await s.claimTotal(c.item._id,'FD',session)),sourceLots:await s.postedIssueLots(c.doc,c.item._id,session),sourceKind:'GOODS_ISSUE',intakeMode:'DIRECT'};
 const legacyCustomer=!c.so.header.customerName&&c.so.header.customerId&&await s.m.Customer.findById(c.so.header.customerId).select('name phone').session(session).lean();
 return {...c,customerId:c.so.header.customerId,customerName:c.so.header.customerName||legacyCustomer?.name,customerPhone:c.so.header.customerPhone||legacyCustomer?.phone,warehouseId:c.doc.header.warehouseId,allowance:c.delivered,...(direct&&{sourceLots:await s.postedIssueLots(c.doc,c.item._id,session)}),sourceKind:direct?'GOODS_ISSUE':'DELIVERY_CONFIRMATION',intakeMode:direct?'DIRECT':'LEGACY'};
}
export async function createCustomerReturn(user,input){return command(user,'CREATE_CR','customer_return:create',null,input,replay(m.CustomerReturn),async(session,actor,operationId)=>{
 requireWarehouseAccess(actor,input.warehouseId);
 const doc=await envelope(m.CustomerReturn,actor,{warehouseId:input.warehouseId,openedBy:actor._id,openedAt:new Date(),...(input.salesOrderReference&&{salesOrderReference:input.salesOrderReference})},[]);let intakeMode,sourceGroup;const requestedByLot=new Map();
 for(const row of input.lines){const c=await returnSource(row,actor,session);if(intakeMode&&intakeMode!==c.intakeMode)throw validationError('Không thể kết hợp nguồn trả hàng trực tiếp và nguồn giao hàng cũ');intakeMode=c.intakeMode;await s.assertWholeQuantity(c.item.productId,row.qtyBase,session);if(!same(c.warehouseId,input.warehouseId))throw validationError('Nguồn sai kho');
  if(row.salesIssueLineId && c.doc.workflowStatus!=='POSTED')throw validationError('Phiếu xuất chưa ghi sổ');
  if(c.so && hasPermission(actor,'customer_return:create') && !hasPermission(actor,'customer_return:inspect') && !same(c.so.createdBy,actor._id))throw notFoundError();
  if(input.salesOrderId && (!c.so || !same(input.salesOrderId,c.so._id)))throw validationError('Phiếu xuất không thuộc yêu cầu mua hàng đã chọn');
  const parent=c.so ?? c.doc, group=parent.constructor.collection.name+':'+parent._id;
  if(sourceGroup && sourceGroup!==group)throw validationError('Các dòng phải cùng yêu cầu mua hàng hoặc cùng một chứng từ nguồn độc lập');
  sourceGroup=group;
  const customerName=c.customerName||input.customerName;if(!customerName)throw validationError('Nhập tên khách hàng cho phiếu xuất chưa có thông tin khách');
  doc.header.customerId=c.customerId;doc.header.customerName=customerName;doc.header.customerPhone=c.customerPhone||input.customerPhone;
  const sourceKey=String(c.item._id);
  if(exact(row.qtyBase).plus(await s.claimTotal(c.item._id,'CR',session)).gt(c.allowance))throw validationError('Vượt lượng khách đã nhận còn được trả');
  let lotId=c.item.lotId;
  if(c.intakeMode==='DIRECT'&&c.sourceKind==='GOODS_ISSUE'){
   const lots=c.sourceLots??await s.postedIssueLots(c.doc,c.item._id,session),selected=row.lotId??(lots.length===1?lots[0].lotId:undefined),sourceLot=lots.find(lot=>same(lot.lotId,selected));
   if(!sourceLot)throw validationError(lots.length?'Chọn đúng lô đã xuất cho từng dòng trả':'Không xác định được lô của dòng xuất; cần đối chiếu chứng từ nguồn');
   const lotKey=`${sourceKey}:${selected}`,alreadyOnLot=requestedByLot.get(lotKey)??exact('0'),committed=await s.committedCustomerReturnLot(c.item._id,selected,session);
   if(exact(row.qtyBase).plus(committed).plus(alreadyOnLot).gt(sourceLot.quantityBase))throw validationError('Vượt lượng đã xuất còn lại của lô');
   requestedByLot.set(lotKey,alreadyOnLot.plus(row.qtyBase));lotId=selected;
  }else if(row.lotId)throw validationError('Không thể chọn lô cho nguồn này');
  const item=copy(c.item,row.qtyBase,doc.items.length+1,{...(lotId&&{lotId}),lineKind:'CUSTOMER_RETURN',details:{...(row.historicalExternalLineId?{historicalExternalLineId:row.historicalExternalLineId}:{originalIssueLineId:row.salesIssueLineId}),reason:row.reason},sources:[source(c.doc,c.item,'RETURN_SOURCE',row.qtyBase)]});doc.items.push(item);
  await new m.ReturnQuantityClaim({claimKind:'CR',requestLineId:item._id,sourceKind:c.sourceKind,sourceLineId:c.item._id,claimedQtyBase:row.qtyBase,createdBy:actor._id,operationId,version:1,events:[]}).save({session});
 }
 if(intakeMode==='DIRECT')doc.header.intakeMode='DIRECT';
 await doc.save({session});return {document:doc};
});}
export function eligibility(row){
 if(row.installationStatus==='INSTALLED'||row.damageCause==='CUSTOMER'||row.deadlineStatus==='EXCEEDED')return 'INELIGIBLE';
 if(row.installationStatus==='UNKNOWN'||row.damageCause==='UNKNOWN'||row.deadlineStatus==='UNKNOWN'||!row.deadlineReference)return 'PENDING';return 'CASE_REVIEW';
}
export const inspectCustomerReturn=(user,id,input,reassess=false)=>operation(m.CustomerReturn,user,id,input,reassess?'REASSESS_CR':'INSPECT_CR','customer_return:inspect',async(doc,session,actor)=>{
 if(reassess&&doc.header.intakeMode==='DIRECT'&&((doc.handbacks||[]).length||await m.CustomerReturnReceipt.exists({'header.returnId':doc._id,workflowStatus:'POSTED'}).session(session)))throw validationError('Đã nhận hoặc trả lại hàng; không thể kiểm lại quyết định');
 requireState(doc,reassess?['INSPECTED','ACCEPTED','PARTIAL','REJECTED']:['OPEN']);await evidence(doc,input.evidenceIds,session);
 if(input.lines.length!==doc.items.length||!doc.items.every(i=>input.lines.some(r=>same(r.returnLineId,i._id))))throw validationError('Phải kiểm đủ các dòng');
 let receipt,posting;if(!reassess&&doc.header.intakeMode!=='DIRECT'){await s.locationAt(input.custodyLocationId,doc.header.warehouseId,['CUSTODY'],session);receipt=await envelope(m.CustodyReceipt,actor,{warehouseId:doc.header.warehouseId,ownerType:'CUSTOMER',ownerId:doc.header.customerId,receivedAt:new Date(),receivedBy:actor._id},[],'DRAFT',input.note);posting=beginStock(receipt,actor,'CR_CUSTODY',input);}
 for(const row of input.lines){const item=rowOf(doc,row.returnLineId),quantity=exact(row.qtyReceived);await s.assertWholeQuantity(item.productId,row.qtyReceived,session);if(quantity.gt(String(item.qtyBase)))throw validationError('Vượt lượng yêu cầu');
  const old=doc.inspections.filter(i=>same(i.returnLineId,item._id)).at(-1);if(reassess&&(!old||!quantity.eq(sum(old.portions,'quantityBase'))))throw validationError('Kiểm lại không được nhận vật lý lần nữa');
  const facts={packagingCondition:row.packagingCondition,installationStatus:row.installationStatus,damageCause:row.damageCause,deadlineStatus:row.deadlineStatus,deadlineReference:row.deadlineReference,eligibilityStatus:eligibility(row),reason:row.assessmentReason,evidenceIds:input.evidenceIds};
  if(doc.header.intakeMode==='DIRECT'&&quantity.isZero()&&row.portions?.length)throw validationError('Không khai quy cách khi không có hàng thực đến');
  const savedPortions=quantity.isZero()?[]:doc.header.intakeMode==='DIRECT'
   ? await directInspectionPortions(item,row,quantity,old,facts,session) : [{...facts,quantityBase:quantity.toFixed()}];
  if(receipt&&quantity.gt(0)){const r=copy(item,quantity,receipt.items.length+1,{sources:[source(doc,item,'CUSTOMER_CUSTODY',quantity)]});receipt.items.push(r);await postIn(receipt,receipt.items.at(-1),actor,session,posting,{locationId:input.custodyLocationId,qualityCode:'PENDING',ownerType:'CUSTOMER',ownerId:doc.header.customerId,portions:row.portions});}
  doc.inspections.push({_id:newId(),returnLineId:item._id,inspectionNo:(old?.inspectionNo??0)+1,returnVersion:doc.version+1,warehouseId:doc.header.warehouseId,inspectedBy:actor._id,inspectedAt:new Date(),portions:savedPortions});
 }
 if(receipt?.items.length){receipt.evidenceIds=input.evidenceIds;await savePosted(receipt,posting,actor,session);}
 doc.workflowStatus='INSPECTED';attached(doc,input.evidenceIds);return {stockTransactionId:receipt?.items.length?posting._id:undefined};
});
export const decideCustomerReturn=(user,id,input,exception=false)=>operation(m.CustomerReturn,user,id,input,exception?'EXCEPTION_CR':'DECIDE_CR',exception?'customer_return:approve_exception':'customer_return:accept',async(doc,session,actor)=>{
 requireState(doc,['INSPECTED']);requireDecisionLines(doc.items,input);const decisions=[];
 for(const item of doc.items){const inspection=doc.inspections.filter(i=>same(i.returnLineId,item._id)).at(-1);if(!inspection)throw validationError('Chưa kiểm hàng');const request=input.lines?.find(r=>same(r.lineId,item._id));const approved=exact(input.decision==='REJECT'?'0':request?.qtyBase??sum(inspection.portions,'quantityBase'));
  await s.assertWholeQuantity(item.productId,approved,session);if(approved.gt(sum(inspection.portions,'quantityBase')))throw validationError('Vượt lượng đã kiểm');
  if(approved.gt(0)&&(!inspection.portions.length||inspection.portions.some(p=>p.eligibilityStatus!=='CASE_REVIEW')||(!exception&&inspection.portions.some(p=>p.damageCause!=='NONE'))))throw validationError('Điều kiện không cho phép chấp nhận theo quyền này');
  if(doc.header.intakeMode==='DIRECT'&&approved.gt(0))await directReceiptPortions(item,inspection,approved,session);
  decisions.push({...item.toObject(),approvedQtyBase:approved.toFixed(),inspection:serialize(inspection)});
 }
 // Release reductions before reacquiring increases, including split lines sharing one source.
 for(const item of decisions){
  const claim=await m.ReturnQuantityClaim.findOne({requestLineId:item._id}).session(session);
  if(!claim)throw validationError('Thiếu hạn mức nguồn trả');
  const received=sum(claim.events.filter(event=>event.kind==='RECEIVED'),'quantityBase');
  const target=exact(item.approvedQtyBase).minus(received);
  if(target.lt(0))throw validationError('Lượng duyệt không được thấp hơn lượng đã nhập');
  const release=s.remainingClaim(claim).minus(target);
  if(release.gt(0))await s.resolveClaim(item._id,release,'RELEASED',doc,actor,session);
 }
 for(const item of decisions){
  const claim=await m.ReturnQuantityClaim.findOne({requestLineId:item._id}).session(session);
  const received=sum(claim.events.filter(event=>event.kind==='RECEIVED'),'quantityBase');
  const needed=exact(item.approvedQtyBase).minus(received).minus(s.remainingClaim(claim));
  if(!needed.gt(0))continue;
  const current=doc.items.id(item._id);
  const source=await returnSource({historicalExternalLineId:current.details.historicalExternalLineId,salesIssueLineId:current.details.originalIssueLineId},actor,session);
  if(!same(source.item._id,claim.sourceLineId)||needed.plus(await s.claimTotal(source.item._id,'CR',session)).gt(source.allowance))
   throw validationError('Lượng duyệt vượt hạn mức nguồn trả còn hiệu lực');
  if(source.sourceLots){
   const lot=source.sourceLots.find(row=>same(row.lotId,current.lotId));
   if(!lot||needed.plus(await s.committedCustomerReturnLot(source.item._id,current.lotId,session)).gt(lot.quantityBase))
    throw validationError('Lượng duyệt vượt hạn mức còn lại của lô đã xuất');
  }
  await s.reacquireClaim(item._id,needed,doc,actor,session);
 }
 const approval=await decision(doc,exception?'EXCEPTION_APPROVAL':'STANDARD_ACCEPTANCE',{items:decisions},actor,session,input);
 doc.decisions.push({decisionId:approval._id,revision:doc.version+1,reviewedBy:actor._id,reviewedAt:new Date(),decision:input.decision??'APPROVE',reason:input.reason});
 doc.workflowStatus=decisions.some(i=>exact(i.approvedQtyBase).gt(0))?'ACCEPTED':'REJECTED';
 return {decisionId:approval._id};
});
async function custodyBalance(doc,item,session){
 const receipts=await m.CustodyReceipt.find({'items.sources':{$elemMatch:{documentId:doc._id,itemId:item._id}},workflowStatus:'POSTED'}).session(session);
 const transactions=await m.StockTransaction.find({sourceId:{$in:receipts.map(r=>r._id)}}).session(session);
 const ids=transactions.flatMap(t=>t.movements).filter(v=>receipts.some(r=>r.items.some(i=>same(i._id,v.sourceLineId)&&i.sources.some(src=>same(src.itemId,item._id))))).map(v=>v.toBalanceId);
 return m.InventoryBalance.find({_id:{$in:ids},ownerType:'CUSTOMER',ownerId:doc.header.customerId}).session(session);
}
export const receiveCustomerReturn=(user,id,input,handback=false)=>operation(m.CustomerReturn,user,id,input,handback?'HANDBACK_CR':'RECEIVE_CR','customer_return:post',async(doc,session,actor,operationId)=>{
 requireState(doc,handback?['REJECTED','ACCEPTED','PARTIAL','COMPLETED']:['ACCEPTED','PARTIAL']);await evidence(doc,input.evidenceIds,session);
 const approval=await m.ApprovalHistory.findById(doc.decisions.at(-1)?.decisionId).session(session);if(!handback&&!approval)throw validationError('Thiếu quyết định');
 if(doc.header.intakeMode==='DIRECT')return receiveDirect(doc,actor,input,session,operationId,approval,handback);
 const receipt=await envelope(handback?m.CustodyRelease:m.CustomerReturnReceipt,actor,handback?{warehouseId:doc.header.warehouseId,ownerType:'CUSTOMER',ownerId:doc.header.customerId,recipientName:input.recipientName,releasedBy:actor._id,releasedAt:new Date()}:{warehouseId:doc.header.warehouseId,returnId:doc._id,receivedAt:new Date(),operationId},[],'DRAFT',input.note);
 if(handback&&!input.recipientName)throw validationError('Cần tên người nhận bàn giao');const posting=beginStock(receipt,actor,handback?'CR_HANDBACK':'GR_CR',input);
 for(const row of input.lines){const item=rowOf(doc,row.lineId),inspection=doc.inspections.filter(i=>same(i.returnLineId,item._id)).at(-1);
  const old=await m.CustomerReturnReceipt.find({workflowStatus:'POSTED','header.returnId':doc._id}).session(session);const handedBack=await m.CustodyRelease.find({workflowStatus:'POSTED','items.sources.documentId':doc._id}).session(session);const back=sum(handedBack.flatMap(r=>r.items).filter(i=>i.sources.some(src=>same(src.itemId,item._id))));if(handback&&exact(row.qtyBase).plus(back).gt(sum(inspection?.portions??[],'quantityBase').minus(approval?.reviewedContent.items.find(i=>same(i._id,item._id))?.approvedQtyBase ?? '0')))throw validationError('Exceeds remaining customer custody');const prior=sum(old.flatMap(r=>r.items).filter(i=>i.sources.some(src=>same(src.itemId,item._id))));
  if(!handback){const accepted=approval.reviewedContent.items.find(i=>same(i._id,item._id));if(!accepted||!same(accepted.inspection._id,inspection?._id)||exact(row.qtyBase).plus(prior).gt(accepted.approvedQtyBase))throw validationError('Quyết định đã cũ hoặc vượt lượng chấp nhận');if(inspection.portions.some(p=>p.damageCause!=='NONE')&&row.qualityCode==='GOOD')throw validationError('Hàng ngoại lệ hỏng phải nhập khu lỗi');}
  const r=copy(item,row.qtyBase,receipt.items.length+1,{...(!handback&&{inspectionId:inspection?._id}),sources:[source(doc,item,handback?'CUSTODY_HANDBACK':'ACCEPTED_RETURN',row.qtyBase)]});receipt.items.push(r);let left=exact(row.qtyBase),portions=[];
  const custodySources=await custodyBalance(doc,item,session);if(custodySources.length===1&&!handback)r.custodyBalanceId=custodySources[0]._id;
  for(const balance of custodySources){if(left.isZero())break;const q=exact(balance.quantityBase).lt(left)?exact(balance.quantityBase):left;if(!q.gt(0))continue;const taken=await takeStock(balance._id,q,r._id,posting,actor,session);portions.push(...taken.portions);left=left.minus(q);}
  if(!left.isZero())throw validationError('Không đủ hàng khách giữ hộ');
  if(!handback){await postIn(receipt,receipt.items.at(-1),actor,session,posting,{locationId:row.locationId,qualityCode:row.qualityCode,portions});await s.resolveClaim(item._id,row.qtyBase,'RECEIVED',receipt,actor,session);}
 }
 receipt.evidenceIds=input.evidenceIds;await savePosted(receipt,posting,actor,session);if(!handback){const claims=await m.ReturnQuantityClaim.find({requestLineId:{$in:doc.items.map(i=>i._id)}}).session(session);doc.workflowStatus=claims.every(c=>s.remainingClaim(c).isZero())?'COMPLETED':'PARTIAL';}return {stockTransactionId:posting._id,resultRefs:[ref(receipt)]};
});
export async function createFailedDelivery(user,input,stored){if(stored)input={...input,evidenceChecksum:stored.checksum};return command(user,'CREATE_FD','failed_delivery:inspect',null,input,replay(m.FailedDelivery),async(session,actor,operationId)=>{
 requireWarehouseAccess(actor,input.warehouseId);const doc=await envelope(m.FailedDelivery,actor,{warehouseId:input.warehouseId,reason:input.note},[],'OPEN',input.note);
 if(!stored)throw validationError('Cần bằng chứng giao thất bại');const attachment=await attachStored(doc,stored,actor,session);doc.header.failureEvidenceId=attachment._id;
 for(const row of input.lines){const c=await s.issueSource(row.salesIssueLineId,actor,session);if(c.doc.header.fulfillmentMode==='DIRECT')throw validationError('Dùng Nhận lại hàng chưa giao trên phiếu xuất');await s.assertWholeQuantity(c.item.productId,row.qtyBase,session);if(!same(c.doc.header.warehouseId,input.warehouseId))throw validationError('Sai kho nguồn');
  if(exact(row.qtyBase).plus(c.delivered).plus(await s.claimTotal(c.item._id,'FD',session)).gt(c.issued))throw validationError('Vượt lượng đã xuất chưa khách nhận');
  const item=copy(c.item,row.qtyBase,doc.items.length+1,{lineKind:'FAILED_DELIVERY',details:{salesIssueLineId:c.item._id},holderName:row.holderName,sources:[source(c.doc,c.item,'FAILED_DELIVERY',row.qtyBase)]});doc.items.push(item);
  await new m.ReturnQuantityClaim({claimKind:'FD',requestLineId:item._id,sourceKind:'GOODS_ISSUE',sourceLineId:c.item._id,claimedQtyBase:row.qtyBase,createdBy:actor._id,operationId,version:1,events:[]}).save({session});
 }await doc.save({session});return {document:doc};
});}
export const inspectFailedDelivery=(user,id,input)=>operation(m.FailedDelivery,user,id,input,'INSPECT_FD','failed_delivery:inspect',async(doc,session,actor)=>{
 requireState(doc,['OPEN','PARTIAL','INSPECTED']);await evidence(doc,input.evidenceIds,session);const inspection=await envelope(m.GoodsInspection,actor,{warehouseId:doc.header.warehouseId},[],'CONFIRMED',input.note);
 for(const row of input.lines){const item=rowOf(doc,row.lineId);await s.assertWholeQuantity(item.productId,row.qtyBase,session);if(exact(row.qtyBase).gt(String(item.qtyBase)))throw validationError('Vượt lượng giao thất bại');inspection.items.push(copy(item,row.qtyBase,inspection.items.length+1,{lineKind:'INSPECTION',details:{inspectedSourceLineId:item._id,qualityCode:row.qualityCode,ownershipDecision:'ACCEPT',inspectedBy:actor._id,inspectedAt:new Date(),packagingCondition:row.packagingCondition},sources:[source(doc,item,'FD_INSPECTION',row.qtyBase)]}));}
 inspection.evidenceIds=input.evidenceIds;await inspection.save({session});doc.workflowStatus='INSPECTED';attached(doc,input.evidenceIds);return {resultRefs:[ref(inspection)]};
});
export const receiveFailedDelivery=(user,id,input)=>operation(m.FailedDelivery,user,id,input,'RECEIVE_FD','failed_delivery:post',async(doc,session,actor)=>{
 requireState(doc,['INSPECTED','PARTIAL']);await evidence(doc,input.evidenceIds,session);const receipt=await envelope(m.FailedDeliveryReceipt,actor,{warehouseId:doc.header.warehouseId,failedDeliveryId:doc._id,receivedAt:new Date(),receivedBy:actor._id},[],'DRAFT',input.note),posting=beginStock(receipt,actor,'GR_FD',input);
 const orders=new Map(),requests=new Map(),deliveries=new Map();
 for(const row of input.lines){const item=rowOf(doc,row.lineId),c=await s.issueSource(item.details.salesIssueLineId,actor,session);
  const inspected=await m.GoodsInspection.findOne({workflowStatus:'CONFIRMED',items:{$elemMatch:{'details.inspectedSourceLineId':item._id,'details.qualityCode':row.qualityCode}}}).sort({createdAt:-1,_id:-1}).session(session);
  const inspectionItem=inspected?.items.find(i=>same(i.details?.inspectedSourceLineId,item._id)&&i.details.qualityCode===row.qualityCode);if(!inspectionItem)throw validationError('Chưa kiểm đúng phần hàng thực về');
  const old=await m.FailedDeliveryReceipt.find({'items.details.inspectionLineId':inspectionItem._id,workflowStatus:'POSTED'}).session(session);if(exact(row.qtyBase).plus(sum(old.flatMap(d=>d.items).filter(i=>same(i.details.inspectionLineId,inspectionItem._id)))).gt(String(inspectionItem.qtyBase)))throw validationError('Vượt lượng kiểm thực về');
  const total=await s.claimTotal(c.item._id,'FD',session);if(c.delivered.plus(total).gt(c.issued))throw validationError('Nguồn giao đã thay đổi');
  const claim=await m.ReturnQuantityClaim.findOne({requestLineId:item._id}).session(session);
  const r=copy(item,row.qtyBase,receipt.items.length+1,{lineKind:'FAILED_DELIVERY_RECEIPT',details:{failedDeliveryLineId:item._id,salesIssueLineId:c.item._id,inspectionLineId:inspectionItem._id,claimId:claim?._id},sources:[source(doc,item,'FD_RECEIPT',row.qtyBase)]});receipt.items.push(r);
  await postIn(receipt,receipt.items.at(-1),actor,session,posting,{locationId:row.locationId,qualityCode:row.qualityCode,portions:row.portions});await s.resolveClaim(item._id,row.qtyBase,'RECEIVED',receipt,actor,session);
  receipt.demandReopenings.push({_id:newId(),receiptLineId:r._id,stockTransactionId:posting._id,salesOrderLineId:c.soItem._id,issueRequestLineId:c.wirItem._id,deliveryOrderLineId:c.odItem._id,goodsIssueLineId:c.item._id,reopenedQtyBase:row.qtyBase,sourceVersion:c.so.version});
  orders.set(String(c.so._id),c.so);requests.set(String(c.wir._id),c.wir);deliveries.set(String(c.od._id),c.od);
 }
 for(const d of [...orders.values(),...requests.values(),...deliveries.values()]){d.workflowStatus='PARTIAL';await saveVersion(d,d.version,session);}
 receipt.evidenceIds=input.evidenceIds;await savePosted(receipt,posting,actor,session);const claims=await m.ReturnQuantityClaim.find({requestLineId:{$in:doc.items.map(i=>i._id)}}).session(session);doc.workflowStatus=claims.every(c=>s.remainingClaim(c).isZero())?'COMPLETED':'PARTIAL';return {stockTransactionId:posting._id,resultRefs:[ref(receipt)]};
});
async function supplierOrigin(row,supplierId,actor,session){
 let Model=m.PurchaseReceipt,found=await Model.findOne({'items._id':row.originLineId,workflowStatus:'POSTED'}).session(session);
 if(!found){Model=m.CustodyReceipt;found=await Model.findOne({'items._id':row.originLineId,workflowStatus:'POSTED','header.ownerType':'SUPPLIER','header.ownerId':supplierId}).session(session);}
 if(!found)throw validationError('Cần nguồn nhập mua hoặc giữ hộ NCC đã ghi tồn');requireWarehouseAccess(actor,found.header.warehouseId);const item=found.items.id(row.originLineId);
 if(Model===m.PurchaseReceipt){
  const queue=[{doc:found,item}],seen=new Set();let matches=false;
  const models=new Map([['goods_inspections',m.GoodsInspection],['goods_arrivals',m.GoodsArrival],['purchase_orders',m.PurchaseOrder]]);
  while(queue.length){const current=queue.shift(),key=String(current.doc._id)+':'+String(current.item?._id);if(seen.has(key))continue;seen.add(key);
   if(current.doc.constructor===m.PurchaseOrder){if(same(current.doc.header.supplierId,supplierId))matches=true;continue;}
   for(const src of [...(current.doc.sources??[]),...(current.item?.sources??[])]){const Next=models.get(src.subjectCollection);if(!Next)continue;const parent=await Next.findById(src.documentId).session(session);if(!parent)throw validationError('Broken purchase source');const parentItem=src.itemId?parent.items.id(src.itemId):undefined;if(src.itemId&&!parentItem)throw validationError('Wrong purchase source item');queue.push({doc:parent,item:parentItem});}
  }
  if(!matches)throw validationError('Purchase source does not belong to this supplier');
 }
 return {doc:found,item};
}
export async function createSupplierReturn(user,input){return command(user,'CREATE_SR','supplier_return:create',null,input,replay(m.SupplierReturn),async(session,actor)=>{
 requireWarehouseAccess(actor,input.warehouseId);if(!await m.Supplier.exists({_id:input.supplierId,status:'ACTIVE'}).session(session))throw validationError('NCC không hoạt động');const doc=await envelope(m.SupplierReturn,actor,{warehouseId:input.warehouseId,supplierId:input.supplierId},[],'AGREEMENT_PENDING',input.note);
 for(const row of input.lines){const {balance,location}=await sourceContext(row.balanceId,session),origin=await supplierOrigin(row,input.supplierId,actor,session);
  await s.assertWholeQuantity(origin.item.productId,row.qtyBase,session);await s.lockSource(origin.doc,origin.item,session);const historicalRequests=await m.SupplierReturn.find({'items.details.originLineId':origin.item._id,workflowStatus:{$nin:['CANCELLED','REJECTED']}}).session(session);const committedSource=historicalRequests.reduce((n,d)=>n.plus(sum(d.items.filter(i=>same(i.details.originLineId,origin.item._id)).map(i=>({qtyBase:d.workflowStatus==='COMPLETED'?i.details.agreedQty??'0':i.qtyBase})))),exact('0'));const validSource=await s.effectivePosted(origin.doc,origin.item._id,session);if(exact(row.qtyBase).plus(committedSource).gt(validSource))throw validationError('Supplier source quantity already claimed or reversed');
  if(!location||!same(location.warehouseId,input.warehouseId)||!same(balance.batchId,origin.item.lotId)||(balance.ownerType!=='STORE'&&!(balance.ownerType==='SUPPLIER'&&same(balance.ownerId,input.supplierId))))throw validationError('Nguồn sai kho, lô hoặc chủ hàng');await guardLocations([location._id],session);
  const reserved=sum((await m.StockReservation.find({balanceId:balance._id}).session(session)).map(r=>({qtyBase:s.remainingReservation(r)})));if(exact(row.qtyBase).plus(reserved).plus(await s.pendingTaskQuantity(balance._id,session)).gt(String(balance.quantityBase)))throw validationError('Quantity exceeds unreserved physical stock');
  if(row.defectHoldId){const defect=await m.DefectReport.findOne({'holds._id':row.defectHoldId}).session(session);const hold=defect?.holds.id(row.defectHoldId);if(!hold||hold.allocations.length!==1||hold.status!=='ACTIVE'||hold.stocktakeId||!same(defect.header.warehouseId,input.warehouseId)||!hold.allocations.some(a=>same(a.balanceId,balance._id)))throw validationError('Wrong defect hold');await evidence(defect,hold.evidenceIds,session);
   const requests=await m.SupplierReturn.find({'items.details.defectHoldId':hold._id}).session(session);const ids=requests.flatMap(d=>d.items.filter(i=>same(i.details.defectHoldId,hold._id)).map(i=>i._id));const committed=sum((await m.StockReservation.find({'demandRef.itemId':{$in:ids}}).session(session)).map(r=>({qtyBase:s.remainingReservation(r)})));
   if(exact(row.qtyBase).plus(committed).gt(sum(hold.allocations,'quantityBase').minus(sum(hold.events,'quantityBase'))))throw validationError('Defect quantity already committed');
  }else{if(balance.ownerType==='STORE'&&balance.qualityStatus!=='GOOD')throw validationError('Select the evidenced defect hold');const free=await import('../../shared/utils/stock.js');if(exact(row.qtyBase).gt(await free.freeQuantity(balance,session)))throw validationError('Không đủ tồn tự do');}
  const item=copy(origin.item,row.qtyBase,doc.items.length+1,{lineKind:'SUPPLIER_RETURN',details:{phase:'PROPOSED',originLineId:origin.item._id,sourceBalanceId:balance._id,defectHoldId:row.defectHoldId,ownerType:balance.ownerType,ownerId:balance.ownerId},sources:[source(origin.doc,origin.item,'SUPPLIER_RETURN',row.qtyBase)]});doc.items.push(item);
  await new m.StockReservation({demandRef:ref(doc,item),balanceId:balance._id,reservedQty:row.qtyBase,creationKey:`SR:${doc._id}:${item._id}`,createdBy:actor._id,version:1}).save({session});
 }await doc.save({session});return {document:doc};
});}
async function supplierDispatches(doc,session){
 const issues=await m.SupplierReturnIssue.find({'header.supplierReturnId':doc._id,workflowStatus:'POSTED'}).session(session);
 const releases=await m.CustodyRelease.find({'sources.documentId':doc._id,workflowStatus:'POSTED'}).session(session);
 return [...issues,...releases];
}
function dispatchedFor(item,documents){
 return sum(documents.flatMap(d=>d.items).filter(line=>line.sources.some(src=>same(src.itemId,item._id))));
}
function acknowledgementsFor(document,item){
 return document.acknowledgements.filter(ack=>ack.workflowStatus!=='SUPERSEDED').flatMap(ack=>ack.items).filter(row=>same(row.details.dispatchLineId,item._id));
}
function supplierReturnState(doc,documents){
 if(!documents.length)return doc.items.some(i=>exact(i.details.agreedQty??'0').gt(0))?'READY':'AGREEMENT_PENDING';
 if(doc.items.some(i=>i.details.agreedQty==null||!dispatchedFor(i,documents).eq(String(i.details.agreedQty))))return 'PARTIAL';
 return documents.every(document=>document.items.every(item=>sum(acknowledgementsFor(document,item)).eq(String(item.qtyBase))))?'ACKNOWLEDGED':'DISPATCHED';
}
export const supplierAgreement=(user,id,input)=>operation(m.SupplierReturn,user,id,input,'AGREEMENT_SR','supplier_return:record_agreement',async(doc,session,actor)=>{
 const states=['AGREEMENT_PENDING','READY','PARTIAL'];
 if(doc.items.some(item=>item.details.agreedQty==null))states.push('DISPATCHED','ACKNOWLEDGED');
 requireState(doc,states);await evidence(doc,input.evidenceIds,session);const issues=await supplierDispatches(doc,session);
 for(const row of input.lines){const item=rowOf(doc,row.lineId);await s.assertWholeQuantity(item.productId,row.qtyBase,session);const dispatched=dispatchedFor(item,issues);if(exact(row.qtyBase).gt(String(item.qtyBase))||exact(row.qtyBase).lt(dispatched))throw validationError('Thỏa thuận ngoài lượng đề nghị hoặc thấp hơn lượng đã giao');
  const version=(doc.agreements.filter(a=>same(a.itemId,item._id)).at(-1)?.version??0)+1;doc.agreements.push({itemId:item._id,agreedQtyBase:row.qtyBase,verifiedBy:actor._id,verifiedAt:new Date(),version,evidenceIds:input.evidenceIds});
  Object.assign(item.details,{phase:'VERIFIED',agreedQty:row.qtyBase,agreementVersion:version,agreementVerifiedBy:actor._id,agreementVerifiedAt:new Date(),agreementEvidenceId:input.evidenceIds[0]});
 }
 doc.header.agreementReference=input.reference;doc.header.agreedAt=new Date();doc.workflowStatus=supplierReturnState(doc,issues);attached(doc,input.evidenceIds);return {};
});
export const dispatchSupplierReturn=(user,id,input)=>operation(m.SupplierReturn,user,id,input,'DISPATCH_SR','supplier_return:dispatch',async(doc,session,actor)=>{
 requireState(doc,['READY','PARTIAL','ACKNOWLEDGED']);await evidence(doc,input.evidenceIds,session);if(!input.recipientName)throw validationError('Cần tên người thực nhận bàn giao');
 const issues=await supplierDispatches(doc,session);
 const created=[];
 for(const ownerType of ['STORE','SUPPLIER']){
  const lines=input.lines.filter(r=>rowOf(doc,r.lineId).details.ownerType===ownerType);if(!lines.length)continue;
  const issue=await envelope(ownerType==='STORE'?m.SupplierReturnIssue:m.CustodyRelease,actor,ownerType==='STORE'?{warehouseId:doc.header.warehouseId,supplierReturnId:doc._id,issuedAt:new Date(),issuedBy:actor._id,receivedByName:input.recipientName}:{warehouseId:doc.header.warehouseId,ownerType,ownerId:doc.header.supplierId,releasedAt:new Date(),releasedBy:actor._id,recipientName:input.recipientName},[],'DRAFT',input.note);issue.sources=[source(doc,null,'SUPPLIER_RETURN')];const posting=beginStock(issue,actor,'GI_SR',input);
  for(const row of lines){const item=rowOf(doc,row.lineId),agreement=doc.agreements.filter(a=>same(a.itemId,item._id)).at(-1);if(!agreement)throw validationError('Chưa có thỏa thuận');const prior=dispatchedFor(item,issues);if(exact(row.qtyBase).plus(prior).gt(String(agreement.agreedQtyBase)))throw validationError('Vượt thỏa thuận còn lại');
   const r=copy(item,row.qtyBase,issue.items.length+1,{sources:[source(doc,item,'SUPPLIER_DISPATCH',row.qtyBase)]});issue.items.push(r);
   const ctx=await sourceContext(item.details.sourceBalanceId,session);if(ctx.balance.ownerType!==ownerType||(ownerType==='SUPPLIER'&&!same(ctx.balance.ownerId,doc.header.supplierId)))throw validationError('Chủ hàng đã thay đổi');
   const defect=item.details.defectHoldId?await m.DefectReport.findOne({'holds._id':item.details.defectHoldId}).session(session):null;const hold=defect?.holds.id(item.details.defectHoldId);if(item.details.defectHoldId&&(!hold||hold.status!=='ACTIVE'||!hold.allocations.some(a=>same(a.balanceId,ctx.balance._id))))throw validationError('Defect hold changed');
   if(hold&&(hold.stocktakeId||hold.allocations.length!==1))throw validationError('Hàng đang thuộc kiểm kê');
   await takeStock(ctx.balance._id,row.qtyBase,r._id,posting,actor,session,{reservationDocumentId:doc._id,holdId:hold?._id,allowOpening:true});
   if(hold){const remaining=sum(hold.allocations,'quantityBase').minus(sum(hold.events,'quantityBase'));if(exact(row.qtyBase).gt(remaining))throw validationError('Vượt lượng lỗi đang chặn');hold.events.push({kind:'CONSUMED',quantityBase:row.qtyBase,sourceRef:ref(issue,r),performedBy:actor._id,performedAt:new Date()});hold.version++;if(exact(row.qtyBase).eq(remaining))hold.status='RESOLVED';defect.workflowStatus=defect.holds.some(h=>h.status==='ACTIVE')?'PARTIAL':'CLOSED';await saveVersion(defect,defect.version,session);}
  }issue.evidenceIds=input.evidenceIds;await savePosted(issue,posting,actor,session);created.push(issue);
 }
 doc.workflowStatus=supplierReturnState(doc,[...issues,...created]);return {resultRefs:created.map(d=>ref(d))};
});
export const acknowledgeSupplierReturn=(user,id,input)=>operation(m.SupplierReturn,user,id,input,'ACK_SR','supplier_return:record_agreement',async(doc,session,actor)=>{
 requireState(doc,['PARTIAL','DISPATCHED','ACKNOWLEDGED']);await evidence(doc,input.evidenceIds,session);
 // Serialize ACK numbers shared by supplier issues and custody releases.
 await guardWarehouses([doc.header.warehouseId],session);
 for(const row of input.lines){let issue=await m.SupplierReturnIssue.findOne({'header.supplierReturnId':doc._id,'items._id':row.lineId,workflowStatus:'POSTED'}).session(session);
  if(!issue)issue=await m.CustodyRelease.findOne({'sources.documentId':doc._id,'items._id':row.lineId,workflowStatus:'POSTED'}).session(session);if(!issue)throw validationError('Sai dòng thực giao');
  // Custody releases retain the same embedded acknowledgement shape.
  const item=rowOf(issue,row.lineId);
  await s.assertWholeQuantity(item.productId,row.qtyBase,session);
  let superseded;
  if(input.supersedesAcknowledgementId){superseded=issue.acknowledgements.id(input.supersedesAcknowledgementId);if(input.lines.length!==1||!superseded||superseded.workflowStatus==='SUPERSEDED'||superseded.items.length!==1||!same(superseded.items[0].details.dispatchLineId,item._id)||!exact(row.qtyBase).eq(String(superseded.items[0].qtyBase)))throw validationError('Correction must replace the same acknowledged source quantity');superseded.workflowStatus='SUPERSEDED';superseded.version++;superseded.reconciliations.push({itemId:superseded.items[0]._id,performedBy:actor._id,performedAt:new Date(),quantityBase:row.qtyBase,evidenceIds:input.evidenceIds,note:input.note});}
  const prior=sum((issue.acknowledgements??[]).filter(a=>a.workflowStatus!=='SUPERSEDED').flatMap(a=>a.items).filter(i=>same(i.details?.dispatchLineId,item._id)));if(exact(row.qtyBase).plus(prior).gt(String(item.qtyBase)))throw validationError('Vượt lượng đã giao');
  const ack={...await nextDocumentFields(m.SupplierReturnIssue,'ACK',doc.header.warehouseId,session,undefined,'acknowledgements'),documentKind:'SUPPLIER_ACK',workflowStatus:'RECORDED',version:1,createdBy:actor._id,occurredAt:new Date(),note:input.note,header:{supplierReturnId:doc._id,supplierId:doc.header.supplierId,acknowledgedAt:new Date(),recordedBy:actor._id,recordedAt:new Date()},evidenceIds:input.evidenceIds,items:[copy(item,row.qtyBase,1,{lineKind:'SUPPLIER_ACK',details:{dispatchLineId:item._id,outcome:row.outcome,acknowledgedAt:new Date()},sources:[source(issue,item,'ACK',row.qtyBase)]})]};if(superseded)ack.sources=[{subjectCollection:issue.constructor.collection.name,documentId:issue._id,itemId:superseded.items[0]._id,relationCode:'CORRECTS_ACK',linkedQty:row.qtyBase}];issue.acknowledgements.push(ack);await saveVersion(issue,issue.version,session);
 }
 doc.workflowStatus=supplierReturnState(doc,await supplierDispatches(doc,session));return {};
});
export const closeSupplierReturn=(user,id,input)=>operation(m.SupplierReturn,user,id,input,'CLOSE_SR','supplier_return:close',async(doc,session,actor)=>{
 requireState(doc,['ACKNOWLEDGED','DISPATCHED','AGREEMENT_PENDING','READY','PARTIAL']);const issues=await supplierDispatches(doc,session);
 for(const item of doc.items){const dispatched=sum(issues.flatMap(d=>d.items).filter(i=>i.sources.some(src=>same(src.itemId,item._id))));const agreement=doc.agreements.filter(a=>same(a.itemId,item._id)).at(-1);if(!agreement||!dispatched.eq(String(agreement.agreedQtyBase)))throw validationError('Còn lượng đã thỏa thuận chưa giao hoặc chưa có phản hồi');}
 for(const issue of issues)for(const item of issue.items){const acks=acknowledgementsFor(issue,item);if(!sum(acks.filter(i=>i.details.outcome==='ACCEPTED')).eq(String(item.qtyBase))||acks.some(i=>i.details.outcome!=='ACCEPTED'))throw validationError('Còn lượng chưa đối chiếu hoặc tranh chấp');}
 for(const reservation of await m.StockReservation.find({'demandRef.documentId':doc._id}).session(session)){const remaining=s.remainingReservation(reservation);if(remaining.gt(0)){reservation.releasedQty=exact(reservation.releasedQty).plus(remaining).toFixed();reservation.version++;await reservation.save({session});}}
 doc.closure={closedBy:actor._id,closedAt:new Date(),reason:input.note};doc.workflowStatus='COMPLETED';return {};
});
export const submitDefectProposal=(user,id,input)=>operation(m.DefectReport,user,id,input,'PROPOSE_DEFECT','defect:create',async(doc,session,actor)=>{
 requireState(doc,['OPEN','PARTIAL']);await evidence(doc,input.evidenceIds,session);
 const plan={...await nextDocumentFields(m.DefectReport,'DEF_PLAN',doc.header.warehouseId,session,undefined,'resolutionPlans'),documentKind:'DISPOSITION',workflowStatus:'SUBMITTED',version:1,createdBy:actor._id,occurredAt:new Date(),note:input.note,header:{defectReportId:doc._id,proposedBy:actor._id,submittedAt:new Date()},sources:[source(doc,null,'DEFECT_PLAN')],evidenceIds:input.evidenceIds,items:[]};
 for(const row of input.lines){const item=rowOf(doc,row.lineId),hold=doc.holds.find(h=>same(h.defectReportLineId,item._id)&&h.status==='ACTIVE');if(!hold||hold.allocations.length!==1||hold.stocktakeId)throw validationError('No ordinary unresolved hold');
  const available=sum(hold.allocations,'quantityBase').minus(sum(hold.events,'quantityBase'));
  const committed=doc.resolutionPlans.filter(p=>['SUBMITTED','APPROVED'].includes(p.workflowStatus)).flatMap(p=>p.items.filter(i=>same(i.details.defectLineId,item._id))).reduce((n,i)=>n.plus(exact(i.approvedQtyBase??i.qtyBase).minus(sum(doc.inspections.filter(e=>same(e.itemId,i._id)),'quantityBase'))),exact('0'));
  if(exact(row.qtyBase).plus(committed).plus(sum(plan.items.filter(i=>same(i.details.defectLineId,item._id)))).gt(available))throw validationError('Quantity already committed to another plan');
  if((row.outcome==='REGRADE'&&!row.targetQuality)||(row.outcome==='RELEASE'&&row.targetQuality!=='GOOD'))throw validationError('Target quality required');
  plan.items.push(copy(item,row.qtyBase,plan.items.length+1,{lineKind:'DISPOSITION',details:{defectLineId:item._id,outcome:row.outcome,targetQuality:row.targetQuality},note:input.note}));
 }doc.resolutionPlans.push(plan);return {};
});
