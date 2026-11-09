import { PurchaseOrder, GoodsArrival, GoodsInspection, PurchaseReceipt, TransferOrder, CustodyReceipt, CustodyRelease, OtherGoodsReceipt, Attachment } from '../../models/runtime.js';
import { requirePermission, requireWarehouseAccess } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { notFoundError, validationError } from '../../shared/utils/ApiError.js';
import { newId, same } from '../../shared/utils/document-command.js';
export const purchaseModels={PO:PurchaseOrder,ARRIVAL:GoodsArrival,INSPECTION:GoodsInspection,GR_PURCHASE:PurchaseReceipt,OTHER:OtherGoodsReceipt,TO:TransferOrder,CUSTODY_RECEIPT:CustodyReceipt,CUSTODY_RELEASE:CustodyRelease};
export const newDocument=(Model,prefix,user,header,items=[],status='DRAFT')=>new Model({documentNo:prefix+'-'+newId(),workflowStatus:status,version:1,createdBy:user._id,header,items});
export async function findPurchase(id,user,session,{kind,readOnly=false}={}){
  let document;
  const candidates=kind?[purchaseModels[kind]]:Object.values(purchaseModels);
  for(const Model of candidates){if(!Model)throw notFoundError();document=await Model.findById(id).session(session);if(document)break;}
  if(!document)throw notFoundError();
  if(!(readOnly&&currentRole(user)?.code==='ACCOUNTANT'))requireWarehouseAccess(user,document.header.warehouseId);
  return document;
}
export async function evidenceFor(user,document,ids,session,required=false){
  if(required&&!ids?.length)throw validationError('Thiếu bằng chứng');
  if(new Set(ids||[]).size!==(ids||[]).length)throw validationError('Bằng chứng trùng');
  for(const id of ids||[]){
    const evidence=await Attachment.findOne({_id:id,status:'ATTACHED',ownerDocumentId:document._id,ownerDocumentType:document.constructor.collection.name}).session(session);
    if(!evidence)throw validationError('Bằng chứng không thuộc chứng từ hoặc chưa gắn');
  }
}
export const replayPurchase=(id,user,session)=>findPurchase(id,user,session);

