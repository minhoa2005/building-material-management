import { validationError } from './ApiError.js';
import { escapeRegex } from './domain.js';
export const documentTypes = Object.freeze({SO:['ĐBH','Đơn bán hàng'],WIR:['YCX','Yêu cầu xuất kho'],OD:['LGH','Lệnh giao hàng'],GI:['PXB','Phiếu xuất bán'],PICK:['LSH','Lệnh soạn hàng'],TO:['LCV','Lệnh chuyển vị trí'],TR:['YCĐC','Yêu cầu điều chuyển'],TD:['PXĐC','Phiếu xuất điều chuyển'],ITR:['YCNB','Yêu cầu chuyển nội bộ'],MWTR:['PNĐC','Phiếu nhận điều chuyển'],DEF:['BCH','Báo cáo hàng hỏng'],ADJ:['ĐCKK','Điều chỉnh kiểm kê'],HO:['BBBG','Biên bản bàn giao']});
export function numberPeriod(now=new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));
  return parts.year+parts.month;
}
export function formatDocumentNumber(type,unit,period,sequence) {
  if(!Number.isSafeInteger(sequence)||sequence<1) throw validationError('Số thứ tự phiếu vượt giới hạn');
  return type+'–'+unit+'–'+period+'–'+String(sequence).padStart(6,'0');
}
export async function nextDocumentFields(Model,type,warehouseId,session,now=new Date()) {
  if(!session?.inTransaction()) throw validationError('Cấp mã phiếu phải nằm trong giao dịch');
  const connection=Model.db,config=documentTypes[type];
  if(!config) throw validationError('Loại phiếu chưa hỗ trợ cấp mã');
  const warehouse=warehouseId && await connection.model('Warehouse').findById(warehouseId).session(session);
  if(warehouseId&&!warehouse) throw validationError('Không tìm thấy kho cấp mã');
  const unit=warehouse?warehouse.code:'KD',period=numberPeriod(now),prefix=config[0]+'–'+unit+'–'+period+'–';
  const path=type==='HO'?'handovers.documentNo':'documentNo';
  const escaped=escapeRegex(prefix);
  const rows=await Model.find({[path]:new RegExp('^'+escaped+'[0-9]+$')}).select(path).session(session).lean();
  const codes=type==='HO'?rows.flatMap(r=>(r.handovers||[]).map(h=>h.documentNo)):rows.map(r=>r.documentNo);
  const last=codes.filter(v=>v?.startsWith(prefix)).reduce((max,v)=>Math.max(max,Number(v.slice(prefix.length))),0);
  if(!Number.isSafeInteger(last)) throw validationError('Mã phiếu cuối vượt giới hạn');
  const counter=await connection.model('DocumentSequence').findOneAndUpdate({_id:prefix},[{$set:{soCuoi:{$add:[{$max:[{$ifNull:['$soCuoi',0]},last]},1]},tenLoaiPhieu:config[1],maDonVi:unit,ky:period}}],{upsert:true,returnDocument:'after',session,updatePipeline:true});
  return {documentNo:formatDocumentNumber(config[0],unit,period,counter.soCuoi),tenLoaiPhieu:config[1],maDonVi:unit,kyDanhSo:period,soThuTu:counter.soCuoi};
}
