import {readFile,writeFile,mkdir} from 'node:fs/promises';
import mongoose from 'mongoose';
import {registerReviewedModels} from '../src/models/index.js';
const connection=mongoose.createConnection(),models=registerReviewedModels(connection);
const prior=JSON.parse(await readFile(new URL('../git_doc/docs/03_thiet_ke/DB_Current_2026-11-06_58/schema.json',import.meta.url),'utf8'));
let report='# Rà soát trường của toàn bộ 58 bảng — 06/11/2026\n\n';
report+='Đã áp dụng cho reviewed model, seed v5. Status chỉ mô tả trạng thái; version bảo vệ nội dung và thao tác đồng thời. Một phiếu DRAFT sửa hai lần vẫn là DRAFT nên không dùng status thay version. Phiên bản nguồn/giá/phạm vi đã duyệt giữ nguyên để xác định đúng nội dung tại thời điểm phát sinh.\n\n';
report+='Đã bỏ: revision ở cấp đầu phiếu vì có version; version của products/warehouses/customers/suppliers; version và productId ở ngưỡng nhúng; referenceId của dòng nguồn nhúng; version và balanceId ở phần đóng gói nhúng. Không thêm status chỉ để thay bộ đếm. Vai trò/tài khoản, vị trí, tồn, lượng giữ/phân bổ, khóa đồng thời và các mốc xác minh vẫn cần bộ đếm hoặc phiên bản nguồn.\n\n';
report+='Bốn danh mục bỏ version vẫn có updatedAt. Khi port API sửa danh mục, kiểm updatedAt của bản vừa đọc và quyền/trạng thái, còn những thay đổi có ảnh hưởng kho/tồn phải kiểm điều kiện nghiệp vụ ngay trong transaction. Chưa chuyển API legacy trong lượt này.\n\n';
report+='Converter không ghi đè nguồn. Nếu revision khác version, dừng để đối chiếu thay vì tự bỏ một giá trị. Các foreign key đã bỏ chỉ trùng với bảng cha; phép chiếu phục vụ kiểm dữ liệu sẽ suy ra từ cha, không lưu hai lần.\n\n';
let removed=0;
for(const [name,Model] of models){
  const fields=[];
  function walk(schema,prefix=''){
    schema.eachPath((key,path)=>{
      const full=prefix+key;fields.push(full);
      if(path.schema)walk(path.schema,full+(path.instance==='Array'?'[].':'.'));
    });
    for(const [kind,child] of Object.entries(schema.discriminators||{}))child.eachPath((key)=>{if(!schema.path(key))fields.push(prefix+'{'+kind+'}.'+key);});
  }
  walk(Model.schema);
  const old=prior.find(row=>row.collection===name).fields.map(row=>row.path);
  const dropped=old.filter(path=>!fields.includes(path));removed+=dropped.length;
  const kept=fields.filter(path=>/(?:version|revision)$/i.test(path));
  report+='## '+name+'\n\n';
  report+='Bỏ '+dropped.length+' trường: '+(dropped.map(path=>'`'+path+'`').join(', ')||'không có trường chứng minh là thừa')+'.\n\n';
  report+='Các trường phiên bản giữ lại: '+(kept.map(path=>'`'+path+'`').join(', ')||'không có')+'.\n\n';
  report+='Các trường còn lại giữ thông tin danh mục, lịch sử, người/thời điểm, nguồn/đích, quyền, đơn vị/quy cách, chất lượng/chủ hàng, trạng thái hoặc kiểm soát số lượng; xem từ điển hiện hành để tra từng trường.\n\n';
}
report+='Tổng cộng bỏ '+removed+' đường dẫn trường trên 58 collection (tính riêng các phần nhúng). DB mẫu: localhost:27017/wmsd_demo_tile_shop_v5. Các DB v3/v4 là mốc lịch sử.\n';
const output=new URL('../git_doc/docs/03_thiet_ke/DB_Rebuild_Review/38_Ra_soat_truong_58_bang.md',import.meta.url);
await writeFile(output,report);
await connection.close();
console.log(JSON.stringify({collections:models.size,removedFieldPaths:removed}));
