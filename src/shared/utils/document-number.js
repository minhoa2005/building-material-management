import { escapeRegex } from './domain.js';
import { validationError } from './ApiError.js';
import { currentTransactionSession } from './transaction-context.js';

const documentNumberSeparator = '-';

export const documentTypes = Object.freeze({
 SO:['ĐBH','Đơn bán hàng'],WIR:['YCX','Yêu cầu xuất kho'],OD:['LGH','Lệnh giao hàng'],GI:['PXB','Phiếu xuất bán'],PICK:['LSH','Lệnh soạn hàng'],TO:['LCV','Lệnh chuyển vị trí'],TR:['YCĐC','Yêu cầu điều chuyển'],TD:['PXĐC','Phiếu xuất điều chuyển'],ITR:['YCNB','Yêu cầu chuyển nội bộ'],MWTR:['PNĐC','Nhận điều chuyển'],DEF:['BCH','Báo cáo hàng hỏng'],ADJ:['ĐCKK','Điều chỉnh kiểm kê'],HO:['BBBG','Biên bản bàn giao'],
 RR:['YCBS','Yêu cầu bổ sung'],PO:['ĐMH','Đơn mua hàng'],ARR:['HĐK','Hàng đến kho'],INS:['PKN','Phiếu kiểm nhận'],GR:['PNM','Phiếu nhập mua'],OTHER:['PNK','Phiếu nhập khác'],CR:['ĐTK','Đề nghị khách trả hàng'],CR_GR:['PNKT','Nhập khách trả'],FD:['GHTB','Giao hàng thất bại'],FD_GR:['PNGHTB','Nhập giao thất bại'],SR:['ĐTNCC','Đề nghị trả nhà cung cấp'],SR_GI:['PXNCC','Xuất trả nhà cung cấp'],ACK:['XNNCC','Xác nhận nhà cung cấp'],CRCV:['PNGH','Nhập giữ hộ'],CREL:['PXGH','Xuất giữ hộ'],REV:['PĐN','Phiếu đảo nhập'],SCRAP:['PHH','Phiếu hủy hàng'],QUALITY:['PĐCL','Đổi chất lượng'],DISC:['CLCK','Chênh lệch chuyển kho'],ST:['KK','Đợt kiểm kê'],ST_PLAN:['PAXLKK','Phương án kiểm kê'],DEF_PLAN:['PAXLHL','Phương án hàng lỗi'],OPENING:['TDK','Tồn đầu kỳ'],INVOICE:['HĐBH','Hóa đơn bán hàng'],CANCEL:['HỦYĐBH','Hủy đơn bán'],POD:['XNGH','Xác nhận giao hàng'],PAY:['XNTT','Xác nhận thanh toán']
});
export const modelDocumentTypes=Object.freeze({SalesOrder:'SO',WarehouseIssueRequest:'WIR',DeliveryOrder:'OD',SalesGoodsIssue:'GI',TransferOrder:'TO',WarehouseTransferRequest:'TR',TransferDispatch:'TD',InternalTransferRequirement:'ITR',TransferReceipt:'MWTR',DefectReport:'DEF',StockAdjustment:'ADJ',ReplenishmentRequest:'RR',PurchaseOrder:'PO',GoodsArrival:'ARR',GoodsInspection:'INS',PurchaseReceipt:'GR',OtherGoodsReceipt:'OTHER',GoodsReceipt:'OTHER',CustomerReturn:'CR',CustomerReturnReceipt:'CR_GR',FailedDelivery:'FD',FailedDeliveryReceipt:'FD_GR',SupplierReturn:'SR',SupplierReturnIssue:'SR_GI',CustodyReceipt:'CRCV',CustodyRelease:'CREL',StockReversal:'REV',StockScrapRecord:'SCRAP',StockQualityChange:'QUALITY',StockDiscrepancy:'DISC',Stocktake:'ST',OpeningStock:'OPENING',SalesInvoice:'INVOICE'});
export function numberPeriod(now=new Date()) {
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',year:'2-digit',month:'2-digit',day:'2-digit'}).formatToParts(now).map(v=>[v.type,v.value]));return p.year+p.month+p.day;
}
export function formatDocumentNumber(type,unit,period,sequence) {
 if(!Number.isSafeInteger(sequence)||sequence<1)throw validationError('Số thứ tự phiếu vượt giới hạn');
 return [type, unit, period, String(sequence).padStart(6, '0')].join(documentNumberSeparator);
}
// No counter collection. The immutable unique document _id arbitrates concurrent
// allocations. The complete transaction is retried on a duplicate coded ID.
export async function nextDocumentFields(Model,type,warehouseId,session=currentTransactionSession(),now=new Date(),embeddedPath) {
 if(!session?.inTransaction())throw validationError('Cấp mã phiếu phải nằm trong giao dịch');
 const config=documentTypes[type??modelDocumentTypes[Model.modelName]];
 if(!config)throw validationError('Loại phiếu chưa hỗ trợ cấp mã');
 const warehouse=warehouseId&&await Model.db.model('Warehouse').findById(warehouseId).session(session);
 if(warehouseId&&!warehouse)throw validationError('Không tìm thấy kho cấp mã');
 if(!warehouse&&!['SO','POD','PAY','CANCEL','INVOICE'].includes(type))throw validationError('Chứng từ phải có kho cấp mã');
 const unit=warehouse?warehouse.code:'KD';
 const period = numberPeriod(now);
 const parts = [config[0], unit, period, ''];
 const prefix = parts.join(documentNumberSeparator);
 const legacyPrefix = parts.join(' - ');
 const [compactCode, legacyCode] = [prefix, legacyPrefix].map(
   value => new RegExp(`^${escapeRegex(value)}([0-9]+)$`),
 );
 const numberFilter = { $in: [compactCode, legacyCode] };
 const path = embeddedPath ?? (type === 'HO' ? 'handovers' : null);
 const field=path?path+'._id':'_id',projection=path?{[path+'._id']:1}:{_id:1};
 const rows=await Model.collection.find({[field]:numberFilter},{session,projection}).toArray();
 const codes=path?rows.flatMap(r=>(r[path]??[]).map(v=>v._id)):rows.map(r=>r._id);
 // Retained operation receipts prevent reusing a deleted root document number.
 const operations=Model.db.collection('operation_records');
 const history=await operations.find({subjectId:numberFilter},{session,projection:{subjectId:1}}).toArray();
 codes.push(...history.map(r=>r.subjectId));
 let last = 0;
 for (const code of codes) {
   if (typeof code !== 'string') continue;
   const match = compactCode.exec(code) ?? legacyCode.exec(code);
   if (match) last = Math.max(last, Number(match[1]));
 }
 if(!Number.isSafeInteger(last))throw validationError('Mã phiếu cuối vượt giới hạn');
 session.documentNumbers??=new Map();const scope=Model.collection.name+':'+prefix;const sequence=Math.max(last,session.documentNumbers.get(scope)??0)+1;
 if(!Number.isSafeInteger(sequence))throw validationError('Số thứ tự phiếu vượt giới hạn');session.documentNumbers.set(scope,sequence);
 const id=formatDocumentNumber(config[0],unit,period,sequence);
 return {_id:id,documentNo:id,tenLoaiPhieu:config[1],maDonVi:unit,kyDanhSo:period,soThuTu:sequence};
}
export async function newBusinessDocument(Model,user,header,items=[],status='DRAFT',note,type) {
 const warehouseId=header.warehouseId??header.sourceWarehouseId??header.requestedWarehouseId??header.warehouseIds?.[0];
 return new Model({...await nextDocumentFields(Model,type??modelDocumentTypes[Model.modelName],warehouseId),workflowStatus:status,version:1,createdBy:user._id,occurredAt:new Date(),header,items,...(note!=null&&{note})});
}
