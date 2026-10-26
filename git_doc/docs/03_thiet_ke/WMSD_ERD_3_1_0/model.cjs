/* Scope selected by the user: master data + retained original entities, one ERD. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const entities=[
 ['User','master','FullName|Email|Roles|AccountStatus','Tài khoản cá nhân; vai trò cố định và phạm vi kho được phân công.'],
 ['Warehouse','master','Code|Name|Address|Status','Kho vật lý; các khu chức năng cùng địa điểm không phải các kho riêng.'],
 ['Location','master','Code|AreaCode|LocationType|CapacityLimit|Status','Vị trí thuộc một kho; AreaCode thay Zone trong bản rút gọn.'],
 ['Product','master','SKU|Name|NominalSize|Surface|Status','Danh mục sản phẩm; kích thước danh nghĩa khác calibre thực tế của lô.'],
 ['ProductConversion','master','Version|PiecesPerBox|AreaPerPieceM2|BoxesPerPallet|EffectiveFrom','Master data phụ thuộc sản phẩm, giữ lịch sử quy đổi. Giao dịch chụp phiên bản/hệ số đã dùng; tồn cơ sở PIECE.'],
 ['ProductLot','master','ManufacturerLotNo|ToneCode|CalibreCode|ProductionDate','Lô thuộc một sản phẩm; không chứa số lượng tồn.'],
 ['Partner','master','Code|Name|PartnerType|Contact|Status','Danh mục SUPPLIER/CUSTOMER thay Supplier; thông tin liên hệ cần cho cung ứng/giao nhận.'],
 ['Inventory','business','StockBucket|Quality|Quantity|Reservations|DefectHolds|TransitReference','Số dư hàng thuộc cửa hàng theo lô/chất lượng/vị trí hoặc tài khoản transit; không chứa custody. DefectHolds chặn phân bổ nhưng không tự đổi balance/snapshot khi đang kiểm kê.'],
 ['StockMovement','business','EventType|Quantity|SourceAccount|DestinationAccount|SourceLineReference|PostedAt','Sự kiện ghi sổ thực tế; nguồn/đích xác định vị trí hoặc transit và chất lượng; giữ người post và nguồn/dòng.'],
 ['PurchaseOrder','business','OrderNo|OrderDate|ExpectedDate|ApprovedDemandReference|Items|SupplierConfirmation|Status','PO từ nhu cầu đã duyệt; kho dự kiến nhận, NCC xác nhận và nhiều lần GR.'],
 ['GoodsReceipt','business','ReceiptNo|ReceiptType|ReceivedAt|SourceReference|Items|InspectionEvidence|ReturnClaims|AcceptanceDecision|DemandReopening|Status','GR-P/GR-CR/GR-FD ghi lượng thực nhận vào sở hữu cửa hàng; không nhận điều chuyển/ADJ lần nữa qua GR-P. GR-FD consume claim và tái mở ròng cùng commit; GR-CR theo quyết định C2 và không tái mở.'],
 ['SalesOrder','business','OrderNo|ExternalOrderReference|Version|DeliveryContact|NeedDate|Items|NetFulfilment|ReopenedDemand|ODCommitmentTransfers|Status','Bản chép đơn ngoài đã xác minh, kèm bằng chứng nguồn; có thể được thực hiện từ nhiều kho. Giữ tiến độ ròng, GR-FD tái mở và chuyển cam kết OD thay thế đúng source/version, không nhân nhu cầu.'],
 ['GoodsIssue','business','IssueNo|IssueType|SourceReference|PlannedItems|IssuedItems|Handover|Status','GI-S/GI-SR: tách lượng dự kiến/thực giao, nháp trước picking và post tại bàn giao.'],
 ['StockCount','business','CountNo|Scope|FrozenAt|SnapshotItems|CountAttempts|DefectHolds|ResolutionPlans|ExecutionEvidence|ClosureBatch|Status','Snapshot bất biến, hold không balance và lịch sử đếm; Warehouse đề xuất/xác nhận thực hiện, Owner UC-92/93 chốt batch delta thực/RECLASS trước mở khóa; không ADJ=0.']
].map(([id,kind,fields,description])=>({id,kind,fields:fields.split('|'),description}));
const relations=[
 ['Warehouse','one','Location','many','containing'],
 ['User','many','Warehouse','many','accessing'],
 ['Product','one','ProductConversion','oneMany','using'],
 ['Product','one','ProductLot','many','identifying'],
 ['ProductLot','one','Inventory','many','distinguishing'],
 ['Location','zeroOne','Inventory','many','holding'],
 ['Inventory','zeroOne','StockMovement','many','decreasing'],
 ['Inventory','zeroOne','StockMovement','many','increasing'],
 ['ProductLot','one','StockMovement','many','tracing'],
 ['User','one','StockMovement','many','posting'],
 ['Partner','one','PurchaseOrder','many','supplying'],
 ['Warehouse','one','PurchaseOrder','many','expecting'],
 ['PurchaseOrder','many','Product','many','ordering'],
 ['PurchaseOrder','zeroOne','GoodsReceipt','many','receiving'],
 ['Warehouse','one','GoodsReceipt','many','receiving'],
 ['GoodsReceipt','many','ProductLot','many','receiving'],
 ['GoodsReceipt','many','Location','many','using'],
 ['GoodsReceipt','zeroOne','StockMovement','many','recording'],
 ['Partner','zeroOne','SalesOrder','many','ordering'],
 ['SalesOrder','many','Product','many','ordering'],
 ['SalesOrder','zeroOne','GoodsIssue','many','fulfilling'],
 ['Warehouse','one','GoodsIssue','many','issuing'],
 ['GoodsIssue','many','ProductLot','many','issuing'],
 ['GoodsIssue','many','Location','many','using'],
 ['GoodsIssue','zeroOne','StockMovement','many','recording'],
 ['Warehouse','one','StockCount','many','hosting'],
 ['StockCount','many','Location','many','scoping'],
 ['StockCount','many','ProductLot','many','counting'],
 ['StockCount','zeroOne','StockMovement','many','resolving'],
 ['User','one','SalesOrder','many','creating'],
 ['User','one','PurchaseOrder','many','creating'],
 ['User','one','StockCount','many','planning']
].map(([a,ac,b,bc,label])=>({a,ac,b,bc,label}));
const starts={one:'||',zeroOne:'|o',many:'}o',oneMany:'}|'},ends={one:'||',zeroOne:'o|',many:'o{',oneMany:'|{'};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mermaid(){
 const out=['%% 14 conceptual entities: original ERD after README merges + identified master data.',
 '%% attr is only a Mermaid syntax placeholder, not a physical data type.',
 '%% Items retain source-linked lines and quantities. SO -> GI is traced THROUGH WIR/OD.',
 'erDiagram','    direction LR'];
 for(const r of relations)out.push(`    ${r.a} ${starts[r.ac]}--${ends[r.bc]} ${r.b} : "${r.label}"`);
 for(const e of entities)out.push('',`    ${e.id} {`,...e.fields.map(f=>`        attr ${f}`),'    }');
 return out.join('\n')+'\n';
}
function explanation(){return `# ERD rút gọn — master data và các bảng còn lại từ ERD gốc

Ngày cập nhật: 25/10/2026. Bản tài liệu 3.1.1, baseline nghiệp vụ 3.1.0. Nguồn chuẩn: [Process Proposal 2 — EN, 3.1.0](../../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md). Phạm vi mới theo yêu cầu người dùng: sửa ERD gốc gồm 18 bảng, áp dụng kết luận gộp/bỏ và bổ sung master data; thể hiện trên **một ERD duy nhất**.

- [Xem ERD tổng thể](erd.html) — một canvas Crow-Foot, có nút phóng to/thu nhỏ, dùng offline.
- [Mã Mermaid](erd.mmd) — nguồn để sao chép/chỉnh sửa.
- [ERD trong Markdown](erd.md) — cùng sơ đồ và chú giải.
- [Nguồn mô hình](model.cjs) — 14 thực thể, 32 quan hệ; [lệnh dựng lại](build.cjs).

| Phiên bản | Ngày | Nội dung |
|---|---|---|
| 3.1.0 | 24/10/2026 | Góc nhìn rút gọn 14 thực thể/32 quan hệ. |
| 3.1.1 | 25/10/2026 | Đồng bộ nhóm thuộc tính A1/B1/C2 và dựng lại Mermaid/Markdown/HTML; giữ phạm vi 14 thực thể. |

## 1. Phạm vi chốt: 14 thực thể

**7 thực thể danh mục/quản trị:** User, Warehouse, Location, Product, ProductConversion, ProductLot, Partner. User là danh mục quản trị; ProductConversion là master data phụ thuộc Product.

**7 thực thể nghiệp vụ còn lại từ ERD gốc:** Inventory, StockMovement, PurchaseOrder, GoodsReceipt, SalesOrder, GoodsIssue, StockCount.

Bản này thay bản trình bày 35 thực thể/tám nhóm theo phạm vi mới. Đây là **góc nhìn rút gọn**, không liệt kê đầy đủ đối tượng độc lập của tám quy trình và không quy định số collection MongoDB. Các chứng từ không được chọn hiển thị vẫn giữ yêu cầu nghiệp vụ của 3.1.0.

## 2. Kết luận sửa ERD gốc đã áp dụng

| Xử lý | Thực thể / nội dung |
|---|---|
| Giữ 12 bảng gốc | User, Warehouse, Location, Product, ProductLot, Inventory, StockMovement, PurchaseOrder, GoodsReceipt, SalesOrder, GoodsIssue, StockCount |
| Gộp Zone | Location.AreaCode và Location.LocationType; mỗi Location thuộc đúng một Warehouse |
| Thay Supplier | Partner với PartnerType SUPPLIER/CUSTOMER; PO chỉ chọn SUPPLIER, SO nếu liên kết danh mục chỉ chọn CUSTOMER |
| Ẩn bốn bảng Line khỏi hình | PurchaseOrderLine, GoodsReceiptLine, SalesOrderLine, GoodsIssueLine được biểu diễn bằng Items/PlannedItems/IssuedItems; dữ liệu dòng và lượng liên kết nguồn vẫn phải giữ |
| Bổ sung master data | ProductConversion: lịch sử quy đổi riêng theo sản phẩm |
| Rút chi tiết kiểm kê vào StockCount | SnapshotItems, CountAttempts, ResolutionPlans; không thêm bảng nghiệp vụ ngoài phạm vi mới |

Số lượng: **18 − Zone − 4 Line − Supplier + Partner + ProductConversion = 14**. Ẩn Line khỏi hình là trừu tượng hóa khái niệm, không phải xóa chức năng dòng hàng.

## 3. Thuộc tính và chức năng

Quan hệ thay cho FK trên hình. Không hiển thị ID nội bộ, PK/FK, kiểu dữ liệu hoặc trường kỹ thuật. Token attr trong Mermaid chỉ là thành phần cú pháp, không phải kiểu dữ liệu database.

| Thực thể | Nhóm | Thuộc tính chính | Chức năng |
|---|---|---|---|
${entities.map(e=>`| ${e.id} | ${e.kind==='master'?'Danh mục/quản trị':'Nghiệp vụ'} | ${e.fields.join(', ')} | ${e.description} |`).join('\n')}

## 4. Cách đọc quan hệ rút gọn

1. **Đơn hàng–sản phẩm và chứng từ–lô/vị trí:** M:N đi qua Items. Dòng giữ định danh, sản phẩm/lô, chất lượng, vị trí, lượng nhập liệu, đơn vị, phiên bản quy đổi, lượng PIECE và lượng nguồn. Không thay bằng danh sách mã không có số lượng. Nháp có thể chưa có dòng/lô/vị trí thực tế; post phải kiểm đủ dữ liệu hợp lệ.
2. **PO–GR:** một PO có nhiều GR-P; mỗi GR-P có đúng một PO. Đầu PO là 0..1 vì GR còn có nguồn CR/FD hoặc nhận lại được kiểm chứng theo ngoại lệ. Nguồn đó không có ô riêng trong phạm vi này; không được post GR khi thiếu nguồn phù hợp.
3. **SO–GI:** liên kết truy vết tổng hợp **qua SO → WIR → OD → GI-S**, không phải quyền xuất thẳng SO hoặc bỏ WIR/OD. GI-S bắt buộc có OD hợp lệ; GI-SR có nguồn supplier-return riêng. Cạnh SO là 0..1 để bao quát hai loại GI. SO không thuộc duy nhất một Warehouse; kho thực hiện thể hiện ở từng GI/đợt xuất.
4. **Inventory–Location:** ON_HAND có đúng một vị trí; TRANSIT không có vị trí vật lý và giữ TransitReference đến dispatch/dòng nguồn. StockBucket độc lập với Quality. Inventory chỉ chứa hàng thuộc cửa hàng; custody không vào đây.
5. **Inventory–StockMovement:** decreasing/increasing chỉ số dư nguồn/đích. Sự kiện có một hoặc cả hai phía phù hợp; chuyển nội bộ có hai phía bảo toàn tổng. SourceAccount/DestinationAccount xác định vị trí/tài khoản transit và chất lượng. Ghi bằng chứng/đóng hồ sơ không trừ lần nữa.
6. **StockCount:** Scope chọn kho/vị trí/lô/trạng thái. SnapshotItems bất biến; CountAttempts lưu mỗi lần đếm, chưa đếm khác 0; ResolutionPlans giữ phiên bản/quyết định/bằng chứng/batch. Chỉ plan được duyệt đúng phiên bản mới post delta/RECLASS. Book50 good, count48 good+2 broken → RECLASS2, không ADJ=0.
7. **User:** creating/planning/posting ghi người thực hiện, không hàm ý mọi chứng từ đều có Owner approval. Quyền và phân tách nhiệm vụ vẫn theo 3.1.0; không suy quyền duyệt từ cạnh User.
8. **Partner:** SO có thể chỉ giữ snapshot giao nhận, nên liên kết Customer là 0..1. Nếu liên kết thì phải đúng loại; PO luôn gắn một Supplier. Nhãn cạnh dùng động từ -ing theo ảnh mẫu.

## 5. Các nhóm thuộc tính phải bảo toàn

| Nhóm | Nội dung tối thiểu |
|---|---|
| ExternalOrderReference / SourceReference | Hệ thống/chứng từ/dòng nguồn, phiên bản khi được cung cấp, bằng chứng hoặc liên kết hồ sơ đã xác minh |
| Items / PlannedItems / IssuedItems | Dòng ổn định, sản phẩm/lô, chất lượng/vị trí khi áp dụng, lượng dự kiến/thực tế, đơn vị/hệ số và lượng nguồn được sử dụng |
| Reservations | Dòng nhu cầu, số dư nguồn, lượng giữ, trạng thái; không chỉ QtyReserved tổng không biết giữ cho ai |
| SnapshotItems / CountAttempts | Lô/vị trí/quyền sở hữu/chất lượng, từng lần đếm có người/thời điểm/lượng/bằng chứng; hàng mới tìm thấy ghi riêng book=0 |
| ResolutionPlans | Phiên bản, delta/RECLASS/vị trí, quyết định đúng vai trò, xác nhận thực hiện và batch; giữ freeze/hold tới khi giải quyết xong |
| ReturnClaims / AcceptanceDecision | Trần POD/FD/CR chung theo dòng GI, claim OPEN/CONSUMED/RELEASED; Sales STANDARD_ACCEPTANCE thường hoặc Owner EXCEPTION_APPROVAL đủ điều kiện đúng version; FD không cần D6/Owner/custody khách |
| NetFulfilment / ReopenedDemand / ODCommitmentTransfers | PGI hợp lệ trừ GR-FD, lượng tái mở nguồn gốc và chuyển cam kết có version; claim chưa post không tạo quyền giao lại, GR-CR không tái mở |
| DefectHolds / ExecutionEvidence / ClosureBatch | Hold không đổi balance/snapshot; xác nhận thực hiện Warehouse, Owner UC-92/93 và batch delta/RECLASS nguyên tử trước mở khóa |
| Handover / InspectionEvidence | Người/thời điểm, lượng thực nhận/giao, tình trạng và bằng chứng có kiểm soát truy cập |

Các nhóm này không quy định một cột JSON duy nhất. Thiết kế logic/vật lý vẫn giữ dòng, liên kết lượng, lịch sử, quyền, version và operation key/ghi sổ nguyên tử. Không thay các chứng từ nguồn bằng ghi chú tự do để bỏ kiểm soát.

## 6. Phạm vi không hiển thị

RR, ARR/INS, TO, WIR/OD, TR/TD/MWTR, CR/FD/SR, POD, PAY-CFM, custody và các hồ sơ độc lập khác không có ô riêng trong bản rút gọn. Không vì vậy bỏ yêu cầu phê duyệt, ghi nhận giao nhận hoặc tách hàng giữ hộ. Chỉ SO/GR/GI trên hình chưa mô tả đầy đủ các vòng đời này.

GR-FD mở lại đúng nhu cầu; GR-CR không mở lại. POD ảnh xác nhận DELIVERED; Sales xác nhận tiền ngoài mới COMPLETED. Ngưỡng tối thiểu theo Product + Warehouse và các mã chuẩn/quyền vẫn là cấu hình phụ trợ, không thêm thành bảng trên hình này.

Đã lược giá, đơn giá/thành tiền, đặt cọc, thu/chi, DateOfBirth, Password và các trường kỹ thuật khỏi hình. Không gộp Product với ProductLot và không bỏ Inventory/StockMovement.

## 7. Dựng lại và kiểm chứng

Chạy node build.cjs để tạo Mermaid và tài liệu; chạy node build.cjs --render khi có Mermaid/Playwright để tạo lại HTML. Có thể dùng WMSD_MERMAID_DIST trỏ thư mục dist của Mermaid, WMSD_PLAYWRIGHT_MODULE trỏ module Playwright và WMSD_BROWSER_EXECUTABLE trỏ Chrome/Edge cục bộ. HTML đã nhúng SVG nên mở không cần mạng/thư viện.

Đã kiểm tra phạm vi 14 thực thể, đầu mút 32 quan hệ, cú pháp Mermaid và bản hiển thị. Đây là kiểm chứng tài liệu/hình, không phải test backend. Lượt 25/10 đồng bộ Mermaid nhúng, context độc lập, PNG BF-04 và gói Mermaid/HTML; chỉ file draw.io bị loại trừ. Không migration database hoặc tự commit.
`;}
function html(svg){return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WMSD — ERD rút gọn 14 thực thể</title><style>
*{box-sizing:border-box}body{margin:0;color:#171717;background:white;font:15px/1.6 Arial,sans-serif}main{padding:32px;max-width:1800px;margin:auto}h1{font-size:28px;line-height:1.3;margin:4px 0 16px}p{max-width:1150px}a{color:#164e89}.meta{font-size:12px;letter-spacing:.08em;color:#555}.note{border-left:3px solid #777;padding:8px 18px;margin:20px 0}.toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 0;position:sticky;top:0;background:white;z-index:2;border-bottom:1px solid #ddd}.toolbar button{font:inherit;border:1px solid #aaa;background:white;padding:6px 12px;cursor:pointer}.diagram{overflow:auto;max-height:82vh;border:1px solid #ddd;margin:16px 0 32px;width:100%}.diagram svg{display:block;max-width:none!important;height:auto!important}.caption{font-size:13px;color:#555}details{margin:24px 0}summary{cursor:pointer;font-weight:bold}.table-scroll{overflow:auto}table{border-collapse:collapse;font-size:14px;width:100%}td,th{text-align:left;vertical-align:top;border-bottom:1px solid #ddd;padding:10px}th{background:#f5f5f5}td:first-child{white-space:nowrap}@media(max-width:600px){main{padding:16px}h1{font-size:23px}}@media print{@page{size:A3 landscape;margin:10mm}main{padding:0}.toolbar{display:none}.diagram{overflow:visible;max-height:none;border:0}.diagram svg{width:100%!important}details{display:none}}
</style></head><body><main><div class="meta">WMSD · ERD KHÁI NIỆM · 25/10/2026 · BASELINE 3.1.0</div><h1>Master data và các bảng còn lại từ ERD gốc</h1><p><strong>Một ERD · 14 thực thể · 7 danh mục/quản trị + 7 nghiệp vụ.</strong> Các ô chỉ hiện thuộc tính chính; quan hệ Crow-Foot và động từ -ing theo ảnh mẫu.</p><p><a href="erd.mmd">Mã Mermaid</a> · <a href="erd.md">Bản Markdown</a> · <a href="README.md">Đối chiếu gộp/bỏ và cách đọc</a></p><div class="note">Gộp Zone vào Location, thay Supplier bằng Partner, thêm ProductConversion và ẩn bốn bảng Line dưới Items. SO–GI là truy vết <strong>qua WIR/OD</strong>. Đây là góc nhìn rút gọn; các chứng từ độc lập còn lại của tám quy trình không hiển thị thành ô riêng.</div><div class="toolbar"><button id="all" type="button">Toàn bộ</button><button id="fit" type="button">Vừa chiều ngang</button><button id="minus" type="button" aria-label="Thu nhỏ">−</button><output id="scale"></output><button id="plus" type="button" aria-label="Phóng to">+</button><button id="actual" type="button">100%</button><span class="caption">Dùng thanh cuộn để xem toàn sơ đồ.</span></div><div class="diagram" id="diagram">${svg}</div><p class="caption">Crow-Foot: || = đúng 1; o| = 0..1; o{ = 0..n; |{ = 1..n. M:N đi qua các dòng có số lượng ẩn trong Items. Xem README để đọc các nhánh nguồn tùy chọn và nguồn transit.</p><details><summary>Danh sách thực thể và thuộc tính</summary><div class="table-scroll"><table><thead><tr><th>Thực thể</th><th>Nhóm</th><th>Thuộc tính chính</th></tr></thead><tbody>${entities.map(n=>`<tr><td>${n.id}</td><td>${n.kind==='master'?'Danh mục/quản trị':'Nghiệp vụ'}</td><td>${n.fields.map(esc).join(', ')}</td></tr>`).join('')}</tbody></table></div></details></main><script>
const diagram=document.getElementById('diagram'),svg=diagram.querySelector('svg'),out=document.getElementById('scale');const original=svg.viewBox.baseVal.width;let zoom=1;function setZoom(value){zoom=Math.max(.1,Math.min(2,value));svg.style.width=(original*zoom)+'px';out.textContent=Math.round(zoom*100)+'%'}function fit(){setZoom((diagram.clientWidth-4)/original)}function fitAll(){setZoom(Math.min((diagram.clientWidth-4)/original,innerHeight*.74/svg.viewBox.baseVal.height))}document.getElementById('plus').onclick=()=>setZoom(zoom*1.2);document.getElementById('minus').onclick=()=>setZoom(zoom/1.2);document.getElementById('actual').onclick=()=>setZoom(1);document.getElementById('fit').onclick=fit;document.getElementById('all').onclick=fitAll;fitAll();
</script></body></html>`;}
function validate(){
 const ids=new Set(entities.map(e=>e.id));
 if(ids.size!==14||entities.filter(e=>e.kind==='master').length!==7||relations.length!==32)throw Error('Unexpected scope');
 for(const name of ['Zone','Supplier','PurchaseOrderLine','GoodsReceiptLine','SalesOrderLine','GoodsIssueLine'])if(ids.has(name))throw Error('Retired box '+name);
 for(const r of relations)if(!ids.has(r.a)||!ids.has(r.b)||!starts[r.ac]||!ends[r.bc])throw Error('Invalid relationship');
}
async function render(mmd){
 const root=path.resolve(process.env.WMSD_MERMAID_DIST||path.dirname(require.resolve('mermaid')));
 const {chromium}=require(process.env.WMSD_PLAYWRIGHT_MODULE||'playwright');
 const server=http.createServer((req,res)=>{
  if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');return;}
  const requested=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!requested.startsWith(root+path.sep)||!fs.existsSync(requested)||!fs.statSync(requested).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':'text/javascript'});fs.createReadStream(requested).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.WMSD_BROWSER_EXECUTABLE?{executablePath:process.env.WMSD_BROWSER_EXECUTABLE}:{})});
  const page=await browser.newPage({viewport:{width:1800,height:1200}});await page.goto('http://127.0.0.1:'+server.address().port+'/');
  const svg=await page.evaluate(async text=>{
   const mermaid=(await import('/mermaid.esm.min.mjs')).default;
   mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'base',fontFamily:'Arial',themeVariables:{background:'#ffffff',primaryColor:'#ffffff',primaryTextColor:'#171717',primaryBorderColor:'#333333',lineColor:'#555555',secondaryColor:'#ffffff',tertiaryColor:'#ffffff',fontFamily:'Arial',fontSize:'16px',attributeBackgroundColorOdd:'#ffffff',attributeBackgroundColorEven:'#ffffff'},er:{useMaxWidth:false,minEntityWidth:220,minEntityHeight:80,entityPadding:16,nodeSpacing:100,rankSpacing:120,layoutDirection:'LR',fontSize:16}});
   const result=await mermaid.render('wmsd-reduced-erd',text);document.body.innerHTML=result.svg;
   const node=document.querySelector('svg');
   // Keep Mermaid's tested Crow-Foot routing, replace typed table cells with conceptual attribute lists.
   for(const group of node.querySelectorAll('g.node')){
    const bounds=group.querySelector('.outer-path').getBBox();
    const name=group.querySelector('.name').textContent.trim();
    const fields=[...group.querySelectorAll('.attribute-name')].map(g=>g.textContent.trim());
    const safe=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const row=(bounds.height-44)/fields.length;
    group.setAttribute('data-entity',name);
    group.innerHTML=`<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" rx="2" fill="white" stroke="#222" style="fill:white!important;stroke:#222!important;stroke-width:1.4!important;filter:none!important"/><path d="M ${bounds.x} ${bounds.y+44} H ${bounds.x+bounds.width}" fill="none" stroke="#222"/><text class="concept-name" x="${bounds.x+bounds.width/2}" y="${bounds.y+28}" text-anchor="middle">${safe(name)}</text>`+fields.map((f,i)=>`<text class="concept-attribute" x="${bounds.x+12}" y="${bounds.y+44+row*(i+.5)+6}">+ ${safe(f)}</text>`).join('');
   }
   const css=document.createElementNS('http://www.w3.org/2000/svg','style');
   css.textContent='.node{filter:none!important}.node rect{filter:none!important;fill:white;stroke:#222;stroke-width:1.2}.concept-name{font:600 16px Arial,sans-serif;fill:#171717}.concept-attribute{font:16px Arial,sans-serif;fill:#171717}';node.append(css);
   node.setAttribute('role','img');node.setAttribute('aria-labelledby','wmsd-erd-title wmsd-erd-description');
   const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.id='wmsd-erd-title';title.textContent='WMSD — ERD rút gọn 14 thực thể';
   const desc=document.createElementNS('http://www.w3.org/2000/svg','desc');desc.id='wmsd-erd-description';desc.textContent='Một ERD Crow-Foot gồm bảy thực thể danh mục/quản trị và bảy thực thể nghiệp vụ còn lại từ ERD gốc sau gộp và rút thuộc tính.';
   node.prepend(desc);node.prepend(title);return node.outerHTML;
  },mmd);
  fs.writeFileSync(path.join(__dirname,'erd.html'),html(svg),'utf8');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
async function main(){
 validate();const mmd=mermaid();
 fs.writeFileSync(path.join(__dirname,'erd.mmd'),mmd,'utf8');fs.writeFileSync(path.join(__dirname,'README.md'),explanation(),'utf8');
 fs.writeFileSync(path.join(__dirname,'erd.md'),'# ERD tổng thể rút gọn — 14 thực thể\n\n7 master data/quản trị + 7 bảng nghiệp vụ còn lại từ ERD gốc. [Cách đọc và giới hạn](README.md).\n\n```mermaid\n'+mmd+'```\n\n`attr` chỉ là token cú pháp Mermaid, không phải kiểu dữ liệu. [Bản HTML](erd.html) không hiển thị cột này.\n','utf8');
 if(process.argv.includes('--render'))await render(mmd);
 console.log(`Generated ${entities.length} entities (7 master/admin), ${relations.length} relationships, one ERD.`);
}
module.exports={entities,relations,mermaid,explanation,html,validate,main};
