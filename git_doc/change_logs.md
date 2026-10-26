# Cập nhật Mermaid và bản xuất liên quan, chỉ loại trừ draw.io — 25/10/2026

Theo yêu cầu bổ sung, phạm vi loại trừ chỉ còn **file draw.io**. Các mục nhật ký cũ về “giữ nguyên diagrams/Mermaid” bên dưới phản ánh lượt trước, không mô tả trạng thái hiện tại. Chi tiết tại [hậu kiểm mục 6](docs/07_ra_soat/Ket_qua_dong_bo_tai_lieu_2026-10-25.md#6-bổ-sung-mermaid--chỉ-loại-trừ-file-drawio).

- Hai quy trình lên bản tài liệu 3.1.2, baseline nghiệp vụ giữ 3.1.0: cập nhật 18 Mermaid context/BF. BF-06/07 tách kết quả sau PGI khỏi POD trước nhánh FD; GR-FD/claim/tái mở nguồn cùng commit. BF-02/05 làm rõ freeze/hold, recount, thực hiện B1 và lỗi/unknown commit. BF-04 theo dõi toàn TR, put-away phần nhận hợp lệ; BF-08 không Owner, tài chính riêng.
- Database VI/EN và Report 3 dùng cùng ba ERD Mermaid hiện hành cho A1, B1, C2/BF-08; có các khóa/trường quan trọng, không vẽ đủ 82 bảng DDL. Context Report 3 và file `.mermaid` đồng bộ cùng bản EN trong quy trình.
- Đồng bộ generator/Mermaid/Markdown/README/HTML của gói ERD rút gọn; giữ 14 thực thể/32 quan hệ, thêm nhóm thuộc tính claim/quyết định/tái mở/OD transfer và B1 hold/execution/closure. Dựng lại PNG BF-04 VI/EN từ Mermaid, có nhãn baseline/ngày; không lấy draw.io cũ làm nguồn.
- Mermaid 12.2.0 parse/render thành công 31 nguồn hiện hành, 22 graph khác nhau. Tám khối Mermaid lịch sử parse được và giữ nguyên. Đã xem render đại diện; kiểm cấu trúc VI–EN và đồng bộ các bản nguồn/bản xuất.
- SHA-256 xác nhận sáu file draw.io không thay đổi. Giữ Mermaid/PNG lịch sử và nguồn khảo sát/biên bản/PDF; không sửa DDL/backend trong lượt bổ sung. README, phạm vi ở Report 1/2/3, thiết kế và báo cáo hậu kiểm phản ánh yêu cầu mới. Không stage/commit.

---

# Đồng bộ tài liệu theo quy trình 3.1.0, loại trừ diagrams — 25/10/2026

## 1. Phạm vi và chuẩn hiện hành

Theo yêu cầu rà soát toàn repo dựa trên hai bản quy trình vừa cập nhật, đã đồng bộ tài liệu hiện hành với quyết định A1/B1/C2 và BF-08 không Owner approval. Baseline nghiệp vụ giữ **3.1.0 ngày 24/10**; hai bản quy trình lên patch tài liệu **3.1.1** để sửa trạng thái phát hành/khuyến nghị còn sót và làm rõ trần nguồn trong nghiệm thu, không đổi các quyết định đã chốt. Chi tiết tại [hậu kiểm 25/10](docs/07_ra_soat/Ket_qua_dong_bo_tai_lieu_2026-10-25.md).

Kiểm kê trước sửa: 47 file; 30 file ngoài sơ đồ và 17 file diagrams/gói ERD. Sửa 15 file có sẵn và thêm một báo cáo hậu kiểm. Các mục nhật ký từ 24/10 trở về trước dưới đây là lịch sử theo đúng mốc ghi nhận, gồm cả tuyên bố “Report 2 giữ nguyên/chưa đồng bộ” ở lượt cũ.

## 2. Nội dung đã cập nhật

- Report 1/2/3, thiết kế hệ thống, database VI/EN, SQL tham chiếu, README và trạng thái hai quy trình cùng baseline: 8 BF, 5 role, 111 UC với **97 active/14 retired**, BR-01–33, SC-01–31 với 28 active/3 retired. UC-106 giữ ID/lịch sử, không quyền thực thi/association/action/route mới.
- A1: Warehouse nhận FD theo GI-S chưa POD và bằng chứng, không D6/Owner/POD giả/custody khách; GR-FD thực về và tái mở đúng SO/WIR/OD gốc ròng cùng commit. POD/FD/CR chia trần dòng nguồn; consume claim không cộng trùng receipt, OD thay thế chuyển cam kết có version, đảo kiểm downstream. GR-CR thông thường không tự tái mở nhu cầu.
- B1: giữ FROZEN/snapshot, hold/evidence không đổi balance được ghi ngay. Cho phép giải trình trực tiếp hoặc recount; Warehouse lập/xác nhận thực hiện phương án, Owner UC-92/93 duyệt/post delta thực tế và RECLASS/vị trí cùng batch trước mở khóa. Quality-only không ADJ=0; không thiếu/hủy hai lần một lượng lỗi.
- C2: Sales STANDARD_ACCEPTANCE CR thông thường sau Warehouse kiểm, có thể cùng creator; Owner EXCEPTION_APPROVAL chỉ ngoại lệ đủ điều kiện và khác người đề xuất. Không vượt điều cấm D6/UNKNOWN. BF-08 bỏ Owner duyệt xuất/sai lệch/đóng; Accountant UC-107/83 xác minh/đối chiếu/đóng, Warehouse thực xuất, tài chính Invoice/Credit Note độc lập.
- TD/GI-S nháp trước picking; TO xác nhận thực hiện, post tại bàn giao. TR chỉ đóng khi hết phần cần thực hiện/transit/sai lệch/TO. SRS đồng bộ cả catalogue, quyền, associations, đặc tả và hợp đồng màn hình, không chỉ thêm ghi chú tổng quát.
- DDL tham chiếu 3.1.0: 82 bảng, 215 FK, 2 view; thêm 9 bảng cho FD/claim/tái mở/OD transfer và B1 hold/resolution; thêm `reference_date`, ngoại lệ CHECK C2 và thông tin xác minh thỏa thuận SR thay Owner authorization. Thiết kế giữ MongoDB runtime, mở rộng **R-01–26/T01–T56**.
- Report 2 cập nhật phạm vi, rủi ro/ưu tiên kiểm thử/đào tạo; giữ số liệu effort/capacity/lịch gốc, chưa tái ước lượng OBS-01. Đề xuất bảy quy trình và ba báo cáo rà soát lịch sử chỉ sửa banner/chỉ mục; thân nội dung cũ được bảo toàn.

## 3. Hậu kiểm và phần giữ nguyên

Đã kiểm đối chiếu dãy mã, tên/trạng thái/quyền và screens/specs/appendix, BR/R/T VI–EN, 40 mã nhánh A/E/FD; cấu trúc bảng/fence/Unicode và liên kết nội bộ hiện hành. ScriptDom 180.140.0 / TSql160Parser parse DDL đạt **0 lỗi**, 6 batch; kiểm tĩnh 82 bảng/PK, 215 FK và 2 view. `git diff --check` đạt. Kết quả chi tiết nằm trong báo cáo hậu kiểm; các case nghiệm thu không phải backend tests đã chạy.

SHA-256 xác nhận 17 file sơ đồ/gói ERD, 13 file nguồn (CSV, sáu biên bản, năm PDF, link tham khảo) và file đánh giá database 23/10 chưa tracked giữ nguyên. Các khối Mermaid nhúng và thân snapshot lịch sử không đổi. Không sửa hai file chưa tracked từ đầu, không sửa `debug.log`. Không render/xuất lại hình, sửa Word/Google Docs ngoài repo hoặc chạy SQL Server/MongoDB/backend. Script/bản chụp QA và parser đặt ngoài repo. Không stage/commit.

---

# Cập nhật quy trình theo góp ý GVHD — 24/10/2026 — phiên bản 3.1.0

## 1. Phạm vi và căn cứ

Cập nhật trực tiếp hai bản [quy trình VI](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) và [quy trình EN](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) lên 3.1.0, theo [báo cáo rà soát 24/10](docs/07_ra_soat/Bao_cao_ra_soat_quy_trinh_theo_gop_y_GVHD_2026-10-24.md), biên bản góp ý và note draw.io được cung cấp. Ưu tiên biên bản Markdown, sau đó note; không lấy đường nối cũ chưa sửa làm chuẩn cao hơn nhận xét.

Người dùng chốt A1, B1, C2 và bỏ toàn bộ Owner approval trong BF-08. Không dùng AGY, không stage/commit. Lượt bổ sung nhật ký này chỉ sửa change_logs.md; hai bản quy trình giữ nguyên kết quả đã sửa ở lượt trước. Các mục 22/10 trở về trước dưới đường phân cách là lịch sử theo phiên bản tại thời điểm đó, không phải xác nhận toàn bộ tài liệu đã đồng bộ 3.1.0.

## 2. Thay đổi đã ghi nhận

- **BF-01/BF-03:** tách hàng chấp nhận, custody và từ chối trên Mermaid; hàng từ chối không đi qua put-away như tồn sở hữu. Làm rõ tạo/xác nhận TO và tên activity thể hiện thao tác trên phần mềm.
- **BF-04/BF-06:** tạo TD/GI-S nháp trước Picking; xác nhận thực hiện TO khi áp dụng, chỉ post khi thực bàn giao. Nháp không đổi tồn. BF-04 có vòng lặp nhận/xuất nhiều đợt và chỉ đóng TR khi hết nhu cầu, transit, sai lệch và nhiệm vụ liên quan.
- **BF-05:** có hai hướng khi chênh lệch: đủ căn cứ thì giải trình/lập phương án trực tiếp; chưa rõ hoặc chọn đếm lại thì Start Recount → Enter Recount → so sánh lại. Không bắt mọi chênh lệch phải recount.
- **A1 — BF-07-FD:** nhánh riêng nhận hàng giao thất bại theo GI-S đã post và chứng cứ, không áp D6 của khách trả sau nhận, không cần POD giả, Owner approval hoặc custody thuộc khách. Warehouse post GR-FD theo lượng thực về/quality; cùng commit tái mở đúng nhu cầu ròng trên SO/WIR/OD gốc để Sales chọn chờ/giao lại/hủy phần đã nhận về. Kiểm chung trần POD/FD/CR, chuyển claim thành receipt không tính hai lần, giữ nguyên ledger xuất/nhận và kiểm nghiệp vụ phụ thuộc khi đảo.
- **B1 — kiểm kê có hàng lỗi:** ghi defect hold/evidence ngay, không thay balance bằng giao dịch thường dưới khóa. Warehouse lập và xác nhận thực hiện phương án; Owner UC-92 duyệt, UC-93 post batch delta thực tế và RECLASS/vị trí có kiểm soát trước mở khóa. Quality-only không ADJ=0; đếm đủ 50 gồm 48 đạt + 2 vỡ không bị ghi thiếu 2 rồi hủy thêm 2.
- **C2 — BF-07 trả thông thường:** Sales chấp nhận/từ chối sau Warehouse kiểm và có thể là người lập CR. Owner chỉ duyệt ngoại lệ đủ điều kiện, không vượt điều cấm D6; chưa rõ thời hạn/điều kiện vẫn chờ. Warehouse post GR-CR theo quyết định đúng loại/phiên bản; CR thông thường không tự mở lại nhu cầu bán.
- **BF-08:** bỏ Owner duyệt xuất, xử lý sai lệch và đóng; Accountant xác minh thỏa thuận NCC, đối chiếu và đóng phần kho qua UC-83; Warehouse post xuất/nhận thực tế. Không đặt quyết định BF-02 lịch sử làm điều kiện xuất trả. Hủy/đổi phẩm cấp/giải phóng hàng lỗi còn tại kho vẫn theo quyền BF-02 hoặc batch B1. Bổ sung tham chiếu Invoice/Credit Note ngoài WMS; trạng thái tài chính độc lập phần kho.
- **UC và phân quyền:** UC-106 retired, giữ ID/lịch sử và năm role; catalogue vẫn 111 ID, nay 97 active/14 retired. Retired: UC-23–25, UC-42, UC-59–62, UC-74–78, UC-106. Đồng bộ UC mapping, permissions, BR-01–33, chứng từ/trạng thái, mainflow/Mermaid và tiêu chí nghiệm thu trong hai bản quy trình.
- **Mục 17:** lưu cả phương án A1/A2/A3 và B1/B2/B3, ưu/nhược điểm, lựa chọn đã chốt, quyền C2/BF-08 và tác động triển khai. Báo cáo rà soát giữ là snapshot phát hiện trước sửa.

## 3. Kiểm tra và giới hạn

- Ở lượt sửa quy trình: mỗi bản có 34 bảng, 9 khối Mermaid (context + tám BF), 15 liên kết tệp nội bộ được kiểm tra; không có liên kết lỗi được phát hiện. Cấu trúc nhánh/nút và đường nối Mermaid VI/EN khớp; thứ tự 17 mục và mã UC trong phạm vi catalogue hợp lệ.
- Đây là kiểm tra cấu trúc tài liệu và đối chiếu nội dung; chưa render lại Mermaid/draw.io hoặc kiểm thử backend, MongoDB, SQL, API hay transaction. Các tình huống nghiệm thu là yêu cầu đề xuất, không phải test phần mềm đã chạy.
- Lượt bổ sung change log: đối chiếu nội dung với hai bản 3.1.0, kiểm liên kết mới, bảo toàn nguyên phần nhật ký cũ và nội dung hai bản quy trình; git diff --check đạt. Không stage/commit.

## 4. Phần còn cần đồng bộ

Report 1/3, thiết kế dữ liệu VI/EN, SQL tham chiếu, thiết kế chi tiết liên quan, bộ draw.io/PNG và Word/Google Docs ngoài repo chưa được cập nhật theo lượt 3.1.0 này. Report 2 giữ nguyên. Các tuyên bố đồng bộ toàn bộ bộ tài liệu ở mục 22/10 chỉ ứng với baseline 3.0.0.

Cần đánh giá/cập nhật CR/FD, decision_kind, liên kết dòng GI/POD/GR-FD và claim, lượng thực hiện ròng/tái mở/OD thay thế, defect hold/RECLASS/batch chốt và quyền UC-71/73/83/92/93; ngừng gọi UC-106. Chưa có schema/API/backend nào được sửa hoặc chạy thử trong lượt này.

---

# Đồng bộ toàn bộ tài liệu hiện hành, giữ Report 2 — 22/10/2026 — baseline 3.0.0

## 1. Phạm vi

Theo yêu cầu sau rà soát, Codex chỉnh sửa trực tiếp, không dùng AGY; không stage/commit. Report 2 được giữ nguyên. Phần dưới đường phân cách là lịch sử các lượt trước; các phát biểu “chưa sửa Report 1/3/hình” trong những lượt đó chỉ đúng tại thời điểm ghi nhận.

Đã xử lý SYNC-01–09 trong [báo cáo trước sửa](docs/07_ra_soat/Bao_cao_dong_bo_tai_lieu_2026-10-22.md); chi tiết và giới hạn tại [kết quả hậu kiểm](docs/07_ra_soat/Ket_qua_dong_bo_tai_lieu_2026-10-22.md). OBS-01 về Report 2 tạm hoãn.

## 2. Thay đổi

- Report 1/3: tám BF; SO UC-45–48, WIR UC-109, Warehouse POD có ảnh UC-110 và Sales PAY-CFM UC-111. Catalogue, actor associations, permissions, đặc tả, BR-01–33, SC-01–31, NFR và lỗi cùng phiên bản. Giữ 111 ID, 98 active/13 retired; 31 screen, 28 active/3 retired.
- Thay thiết kế chi tiết 1.0/16-10 bằng 3.0.0, giữ MongoDB runtime và ranh giới nghiệp vụ hiện hành; truy vết đủ 111 UC, 33 BR, 21 R, 40 T. Không khôi phục giá bán, hóa đơn/hoàn tiền nội bộ, vai trò mới hoặc live MISA.
- Database draw.io: 10 trang, 73 bảng đầy đủ/cột/kiểu/PK, 173 FK và 2 view; thêm các khái niệm SO/POD/PAY-CFM và sửa nguồn WIR/OD/GI theo DDL. Stub FK cục bộ có cặp cột và liên kết trang; SQL giữ nguyên.
- Tạo lại mainflow VI/EN 16 trang, cập nhật EN 8 trang, context và ảnh BF-04 VI/EN. Bản EN riêng có graph giống phần EN của bản song ngữ. Hai workbook cũ gắn nhãn lịch sử trên 24 trang, bảo toàn nội dung/ID và offset nhãn; ảnh BF-03B gốc giữ nguyên.
- Quy trình/database VI/EN: sửa nhận định nguồn/trạng thái cũ, đồng bộ API-02 chưa chốt provider, sửa căn cứ ảnh POD. Liên kết nguồn hiện hành dùng SAP v4.1 trong repo; review1/v4.2 ngoài repo được ghi rõ là nguồn lịch sử chưa đóng gói.
- README: mục lục đủ tài liệu hiện hành/lịch sử, 6 biên bản và CSV. Báo cáo trước sửa được thêm nhãn snapshot; kết quả sau sửa nằm ở tệp hậu kiểm riêng.

## 3. Kiểm tra

41 kiểm tra tự động tài liệu đạt, bao gồm liên kết file; đối chiếu 30 bảng/9 Mermaid blocks quy trình VI–EN, 16 bảng/ERD thiết kế dữ liệu, 37 A/E, 33 BR và đủ R/T. Kiểm độc lập 73 PK và từng tuple của 173 FK với SQL, cùng SHA nguồn; các link trang draw.io không treo.

Validator của ba workbook hiện hành báo 0 lỗi/0 cảnh báo, score 0. draw.io desktop 32.5.5 xuất thử toàn bộ 34 trang; đã xem ảnh tổng hợp và trang trọng điểm, xuất lại hai PNG BF-04 từ workbook hiện hành. `git diff --check` đạt, không stage/commit.

Hash 17 tệp cần bảo toàn khớp trước sửa: Report 2, khảo sát/6 biên bản, 5 PDF/link nguồn, SQL và hai PNG lịch sử. Chưa sửa Word/Google Docs ngoài repo, chưa chạy SQL Server/MongoDB/backend; 40 case T là tiêu chí nghiệm thu, không phải báo cáo backend tests. Các tham số thực địa/vận hành chưa xác minh vẫn để mở.

---

# Tách chuyển vị trí và điều chuyển liên kho — 22/10/2026 — phiên bản 3.0.0

## 1. Yêu cầu và phạm vi

Theo yêu cầu mới nhất, tách hai nội dung của BF-03 cũ thành hai quy trình độc lập; Codex sửa trực tiếp, không dùng AGY. Tiếp tục giữ các cập nhật thiết kế dữ liệu và chỉnh câu chữ từ lượt trước. Sáu tệp được cập nhật: hai bản quy trình EN/VI, hai bản thiết kế database EN/VI, SQL tham chiếu và change log. Không stage/commit, không sửa các báo cáo hoặc hình xuất riêng.

## 2. Ánh xạ mã quy trình

| Mã trước khi tách | Mã hiện tại | Quy trình |
|---|---|---|
| BF-01 | BF-01 | Bổ sung hàng, đặt mua và nhập kho |
| BF-02 | BF-02 | Hàng lỗi |
| BF-03A, nhánh chuyển vị trí | BF-03 | Chuyển vị trí trong cùng kho |
| BF-03B, nhánh liên kho | BF-04 | Điều chuyển giữa các kho và xử lý chênh lệch |
| BF-04 | BF-05 | Kiểm kê, đối chiếu và điều chỉnh |
| BF-05 | BF-06 | Đơn bán, xuất kho, giao hàng và hoàn thành đơn |
| BF-06 | BF-07 | Khách trả hàng |
| BF-07 | BF-08 | Trả nhà cung cấp |

BF-03 có trigger, bốn bước, kết thúc, chứng từ TO-RELOCATE, ngoại lệ và sơ đồ riêng; Warehouse thực hiện, không Owner duyệt, không tạo TR/TD/MWTR. BF-04 có trigger riêng và chuỗi TR → Owner duyệt → TD/HO → MWTR kiểm nhận độc lập → put-away/xử lý sai lệch. Trường hợp xuất thẳng kho khác chuyển BF-06, không tạo điều chuyển hoặc nhập giả.

Đã cập nhật tham chiếu BF đầy đủ và dạng rút gọn, mã nhánh A/E, tên mục/anchor, bảng chứng từ, UC/rule mapping, checklist đồng bộ báo cáo, trình tự triển khai và chú thích SQL. BF-03-A1 dành cho chuyển hàng đã giữ; thêm BF-03-E1 cho sai kho/khóa/thiếu nguồn. Nhánh xuất thẳng BF-03-A2 cũ trở thành BF-04-A1. Các nhánh sau đánh lại mã theo quy trình mới. Tổng hiện có 37 nhánh A/E; giữ 111 UC (98 active/13 retired), 33 BR, 21 quy tắc thiết kế dữ liệu và 40 tình huống nghiệm thu.

Việc tách mã không đổi định nghĩa bảng/cột/ràng buộc/view: SQL vẫn 73 bảng và 2 view. BF-03 ánh xạ warehouse_task/warehouse_task_line; BF-04 ánh xạ transfer_request/dispatch/receipt. Các dữ liệu SO/POD/PAY-CFM từ lượt trước được giữ nguyên, nay thuộc BF-06.

## 3. Kiểm tra và giới hạn

- EN/VI: đủ và đúng thứ tự BF-01–BF-08 ở cả phần mô tả và sơ đồ; 30 bảng có cấu trúc tương ứng; 9 khối Mermaid cùng quan hệ nối (context + 8 BF). Không còn mã quy trình ghép BF-03A/B trong nội dung hiện hành.
- Mã tham chiếu: khớp 37 nhánh A/E, 33 BR và đủ 111 UC; hai bản database khớp 16 bảng, 21 quy tắc, 40 case và ERD. Không thêm liên kết file lỗi so với bản chụp trước sửa.
- SQL: so sánh sau loại bỏ chú thích xác nhận toàn bộ lệnh thực thi không đổi so với trước khi tách; kiểm cú pháp ScriptDom hiện tại 0 lỗi/6 batch. Kết quả kiểm dữ liệu 21 trường hợp của lượt đồng bộ trước vẫn được ghi riêng phía dưới, không coi đây là chạy backend.
- Giữ nguyên nội dung nhật ký cũ làm phần lịch sử; git diff --check đạt; không stage/commit. Giữ nguyên trạng thái xóa draw.io đã có trước lượt này. Script và bản chụp kiểm tra nằm ngoài repository.

Report 1/3, Word và bộ draw.io/PNG vẫn dùng mã cũ; phải cập nhật theo bảng ánh xạ này khi đồng bộ tiếp. Lịch sử bên dưới giữ các mã BF đúng với thời điểm từng lượt, không tự đổi mã trong nhật ký cũ. Chưa chạy SQL Server hoặc backend MongoDB; Mermaid được đối chiếu cấu trúc, chưa xuất lại bộ hình.

---

# Đồng bộ dữ liệu và rà soát BF-05 — 21/10/2026 — phiên bản 2.0.0

## 1. Yêu cầu và phạm vi

Người dùng yêu cầu sửa thiết kế dữ liệu theo quy trình hiện tại, kiểm tra lại nội dung AGY đã tạo, giảm highlight, làm rõ tiếng Việt và cập nhật change log. Lượt này do Codex sửa trực tiếp theo chỉ dẫn mới nhất, không sử dụng AGY, không stage/commit. Nội dung các bản ghi trước được giữ nguyên phía dưới.

| Tệp | Thay đổi |
|---|---|
| [SQL tham chiếu](docs/03_thiet_ke/WMSD_SQL_schema.sql) | Bổ sung mô hình SO, hủy phần chưa xuất, dòng OD/GI-S, POD có ảnh và PAY-CFM; thêm khóa ngoại ghép, khóa chống trùng, CHECK trạng thái và hợp đồng transaction. |
| [Thiết kế database VI](docs/03_thiet_ke/de_xuat_database_design_VI.md), [EN](docs/03_thiet_ke/de_xuat_database_design_EN.md) | Đồng bộ 7 quy trình theo BF-05 mới; cập nhật nguồn, MongoDB mapping, bảng/quan hệ, ERD, quyền, trạng thái, quy tắc và nghiệm thu. |
| [Quy trình VI](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), [EN](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) | Rà nội dung AGY: viết gọn BF-05, bỏ nhấn mạnh dài và định dạng code trên chữ viết tắt nghiệp vụ; chỉnh tiếng Việt; làm rõ số lượng cam kết, trạng thái xác nhận và cách đính chính. |
| [Nhật ký này](change_logs.md) | Ghi tác động, kết quả kiểm tra thực tế và giới hạn; giữ toàn bộ lịch sử trước lượt sửa. |

## 2. Tác động và quyết định thiết kế

- Luồng thống nhất: SO nhập lại từ MISA/giấy tờ → WIR liên kết → OD/soạn/PGI → Warehouse xác nhận POD kèm ảnh → DELIVERED → Sales xác nhận nhận đủ tiền ngoài hệ thống (PAY-CFM) → COMPLETED.
- Thay đổi hợp đồng dữ liệu WIR: tham chiếu trực tiếp external_line được thay bằng SO/dòng SO bắt buộc. Các FK ghép giữ đúng chuỗi chứng từ và chặn dòng thuộc đơn/yêu cầu khác. Một nguồn chỉ có một bản sao SO; sửa/mở lại dùng SO cũ. Đây là thay đổi phiên bản lớn của mô hình tham chiếu, không phải migration đã chạy trên cơ sở dữ liệu thực.
- SQL tăng từ 64 lên 73 bảng, giữ 2 view. Chín bảng mới: sales_order, sales_order_line, sales_order_cancellation, outbound_delivery_line, sales_goods_issue_line, customer_delivery, customer_delivery_line, external_payment_confirmation và business_operation. Tệp ảnh tiếp tục dùng evidence riêng tư; ảnh POD/tệp PAY-CFM phải thuộc đúng phiếu.
- Tổng cam kết WIR tính cả phần đã xuất; hoàn tất WIR không làm phát sinh lại nhu cầu. Tổng OD nằm trong WIR, tổng POD đã xác nhận chưa hủy hiệu lực nằm trong PGI hợp lệ. Kiểm tổng nhiều dòng và cập nhật đồng thời là trách nhiệm service/transaction, không tuyên bố CHECK/FK đã thực hiện thay.
- Chuẩn hóa POD/PAY-CFM thành DRAFT → CONFIRMED, hoặc VOIDED khi đính chính có lý do. Giao một phần thuộc trạng thái SO. Hủy toàn bộ khi chưa giao là CANCELLED; không tự thành DELIVERED/COMPLETED. Đính chính tăng phiên bản SO, tính lại tiến độ và không tái dùng điều kiện hoàn thành cũ.
- POD/PAY-CFM dùng business_operation để chống ghi lặp, cập nhật cùng SO/audit/outbox; không tạo movement hoặc đổi tồn. Hủy phần chưa xuất chỉ giải phóng lượng giữ phù hợp. Khách trả thông thường vẫn giữ lịch sử giao/nhận tiền và dùng BF-06 riêng.
- Giữ 5 vai trò, 111 UC (98 active/13 retired), BR-01–33 và 36 nhánh A/E. Thiết kế database bổ sung R-16–21 và T27–T40, tổng 40 tình huống nghiệm thu đề xuất. Không thêm phân hệ thu tiền, hóa đơn, công nợ hoặc đồng bộ MISA tự động.
- Tác động triển khai: cần cập nhật API/service/validator/index MongoDB và kiểm thử đồng thời trước sử dụng. Rủi ro chính là vượt nguồn, xác nhận giao thiếu ảnh, hoàn thành sớm hoặc dùng xác nhận cũ; đã mô tả điểm kiểm và case nghiệm thu. Chưa có mã backend/lịch sprint để ước lượng thời gian triển khai đáng tin cậy.

## 3. Kiểm tra đã thực hiện

| Kiểm tra | Kết quả và giới hạn |
|---|---|
| Cú pháp SQL Server | Microsoft ScriptDom TSql160Parser: 0 lỗi, 6 batch. Parse không thay thế chạy SQL Server. |
| Khóa/FK/CHECK | 21 kiểm tra trên SQLite in-memory sau chuyển đổi cú pháp DDL: chuỗi SO–WIR–OD–GI–POD–PAY hợp lệ; chặn nguồn trùng, sai chứng từ cha, ảnh sai/thiếu, lượng âm, trạng thái sai, xác nhận tiền thiếu căn cứ/không đủ/lặp phiên bản, mã chống trùng và hủy không hợp lệ. Không mô phỏng đầy đủ kiểu số, collation hoặc transaction SQL Server/MongoDB. |
| Bảo toàn mô hình kho | So sánh với bản chụp trước lượt sửa: định nghĩa 58 bảng cũ ngoài nhóm được sửa và cả hai view inventory_ledger/available_stock giữ nguyên. |
| Hai bản quy trình | Khớp 111 mã UC, 33 BR, 36 nhánh A/E; 29 bảng cùng cấu trúc và 8 sơ đồ cùng quan hệ nối. Không còn định dạng code trên SO/WIR/POD/PAY-CFM/DELIVERED/COMPLETED hoặc đoạn nhấn mạnh dài. |
| Hai bản thiết kế database | Khớp 21 mã quy tắc, 40 case T01–T40, 16 bảng cùng cấu trúc và ERD; có đủ thực thể và quyền cho UC-109–111. Đây là kiểm tra tài liệu, không phải 40 case đã chạy trên backend. |
| Liên kết, lịch sử và Git | Không thêm liên kết file lỗi; giữ lịch sử nhật ký và các thay đổi có sẵn; git diff --check đạt; không stage/commit. Script kiểm tra và bản chụp nằm ở thư mục tạm ngoài repository. |

## 4. Giới hạn và tài liệu còn cần đồng bộ

Report 1/3 dạng text, Word, hình PNG và draw.io chưa được sửa trong lượt này; ghi chú trong tài liệu phân biệt rõ baseline cũ với thiết kế hiện hành. File docs/04_so_do/WMSD_Mainflows_VI_EN.drawio đã ở trạng thái bị xóa khi bắt đầu lượt này và được giữ nguyên trạng thái; liên kết tới file đó vẫn chưa có đích. Chưa chạy SQL Server hoặc backend MongoDB để kiểm phân quyền, lưu ảnh, transaction/concurrency và toàn bộ quy trình đầu cuối.

---

# Nhật ký cập nhật BF-05 trong Đề xuất quy trình 2 — 21/10/2026 (Lượt sửa đổi BF-05)

## 1. Phạm vi và căn cứ thực hiện

- **Yêu cầu người dùng (21/10/2026):** Sửa BF-05 (xuất hàng, soạn hàng, giao hàng) và toàn bộ các phần liên quan trong hai bản Đề xuất quy trình 2 song ngữ theo luồng: bước đầu Sales Staff tạo đơn bán (`Sales Order` — `SO`) bằng cách sao chép/nhập lại đơn bán từ bên ngoài đã xác minh (MISA, giấy tờ, ...), sau đó mới tạo yêu cầu xuất hàng (`Warehouse Issue Request` — `WIR`) liên kết với đơn bán `SO`; có bước giao hàng cho khách kèm chụp ảnh xác nhận để cập nhật trạng thái đơn sang đã giao (`DELIVERED`); khi Sales Staff xác nhận đã nhận đủ tiền ngoài hệ thống thì cập nhật trạng thái đơn sang hoàn thành (`COMPLETED`); cập nhật tất cả phần liên quan trong hai file quy trình và nhật ký này.
- **Phạm vi 3 file tài liệu được phép sửa của nhiệm vụ này (phân biệt với thay đổi đồng thời ngoài nhiệm vụ trong workspace):**
  1. [docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md)
  2. [docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md)
  3. [change_logs.md](change_logs.md)
- **Thực thi, kiểm chứng độc lập của Codex và ghi chú workspace:** Phần triển khai được ủy quyền cho AGY thực hiện; lượt kiểm chứng độc lập ban đầu của Codex đã hoàn tất với kết quả thực tế: hai bản EN/VI đều khớp đúng 33 mã `BR`, 36 mã nhánh `A/E`, 27 bảng với kích thước dòng/cột tương ứng, 8 khối Mermaid đóng/mở fence đầy đủ; toàn bộ nội dung nhật ký trước khi chạy được bảo toàn nguyên vẹn làm phần hậu tố chuẩn hóa line-ending; `git diff --check` đạt; không có stage hay commit. Tiếp theo kết quả review của Codex, lượt hiệu chỉnh tập trung này cập nhật nhánh vòng lặp giao hàng/ảnh chụp trong Mermaid BF-05, trần định lượng theo từng tầng dòng (`SO` → `WIR` → `OD` và `POSTED GI-S` → `POD`) và quy tắc hủy toàn bộ đơn (`CANCELLED` so với `DELIVERED` khi lượng active `> 0`), sau đó Codex thực hiện lượt kiểm chứng độc lập cuối cùng. **Ghi chú trạng thái workspace:** file `docs/04_so_do/WMSD_Mainflows_VI_EN.drawio` đã bị xóa đồng thời ngoài phạm vi nhiệm vụ (`git status D`) trong quá trình chạy trước; thao tác `git checkout` khôi phục trái phép của AGY đối với file đó đã được hoàn tác (sau khi xác minh nội dung khớp `HEAD`) để trả lại đúng trạng thái `DELETED` đã quan sát, nên `git status` tổng thể của workspace gồm 3 file tài liệu được sửa của nhiệm vụ này cùng 1 thay đổi xóa `drawio` độc lập đó.

## 2. Tóm tắt thay đổi trong hai bản Đề xuất quy trình 2 (VI & EN)

| Nhóm nội dung | Nội dung cập nhật chính |
|---|---|
| Ranh giới phạm vi & Thuật ngữ (`SO`, `WIR`, `POD`, `PAY-CFM`) | Giữ ngừng (retired) tính giá bán (`UC-23–25`), hóa đơn nội bộ (`UC-59–62`) và workflow hoàn tiền (`UC-74–78`). Thay vì bỏ hoàn toàn `SO` nội bộ, giữ `Sales Order` (`SO`) làm bản ghi theo dõi nội bộ do Sales Staff sao chép thủ công từ đơn bán bên ngoài đã xác minh (MISA/giấy tờ) kèm mã tham chiếu đơn/dòng nguồn và tệp/ảnh bằng chứng. Tách rõ `SO` với `WIR` liên kết, `POD` (xác nhận giao khách kèm ảnh) và `PAY-CFM` (xác nhận của Sales về việc đã thu đủ tiền ngoài hệ thống). |
| Luồng chính BF-05 & Mermaid BF-05 | Cập nhật thành 10 bước có thứ tự: (1) Sales tạo `SO` sao chép từ đơn ngoài đã xác minh → (2) Sales tạo `WIR` riêng biệt liên kết ở cả cấp header và dòng số lượng với `SO` đã lưu (`tổng WIR active <= lượng_đặt − lượng_hủy` trên dòng `SO`, `tổng OD active <= lượng WIR` mà không cộng gộp `WIR` với `OD`; tạo `SO`/`WIR` không đổi tồn) → (3–4) kiểm tra khả dụng, gợi ý BF-03/BF-01 khi thiếu và thống nhất khách → (5–7) giữ hàng theo FIFO tương thích, tạo task soạn `TO`, soạn/đếm vào staging, xử lý thiếu/lỗi qua BF-02/BF-04 → (8) lập `GI-S`, bàn giao kho `HO` và post `PGI` trừ tồn đúng một lần (bàn giao carrier/`PGI` không tự chuyển `DELIVERED`) → (9) Warehouse Staff xác nhận giao khách thực tế kèm ảnh chụp bắt buộc (`POD`, `UC-110` gắn với dòng `GI-S` đã `POSTED`, kiểm tra nguyên tử `tổng POD <= lượng PGI hợp lệ đã POSTED`) để chuyển `SO` sang `DELIVERED` khi lượng đặt active còn lại `> 0` đã giao đủ kèm ảnh (Mermaid BF-05 tách riêng nhánh thiếu ảnh/chờ khách nhận chỉ quay lại bước `POD`, nhánh từ chối/trả hàng sau `PGI` chuyển `BF-06`, nhánh giao một phần còn lượng chưa xuất mới quay lại bước kiểm nguồn kho `B`) → (10) sau `DELIVERED`, chỉ Sales Staff xác nhận đã nhận đủ tiền ngoài hệ thống (`PAY-CFM`, `UC-111`) để chuyển `SO` sang `COMPLETED`. |
| Luồng thay thế & ngoại lệ BF-05 (`05.X`) | Cập nhật `BF-05-E1..E3`, `BF-05-A1..A2` và bổ sung `BF-05-A3` (tiền ngoài hệ thống chưa thu/thu một phần/chưa rõ hoặc trả trước khi `DELIVERED`): chặn tạo `WIR` không có `SO` hoặc vượt lượng dòng `SO`; thiếu ảnh chụp giao hàng hoặc giao một phần/từ chối nhận chỉ giữ `PARTIALLY_DELIVERED`; chưa nhận đủ tiền ngoài hệ thống thì giữ `DELIVERED`; biết trả tiền sớm trước khi giao đủ hàng kèm ảnh không thể chuyển `COMPLETED`; không tự cộng/trừ tồn kho khi đổi trạng thái đơn. |
| Vai trò, Catalogue UC (111 mã) & Ma trận phân quyền | Giữ nguyên 5 role (`Store Owner`, `Sales Staff`, `Warehouse Staff`, `Accountant`, `Administrator`), không thêm role tài xế/thu ngân. Giữ `UC-45–48` cho danh sách/chi tiết/tạo/cập nhật bản sao `SO` và theo dõi tiến độ; bổ sung 3 UC mới: `UC-109` (*Manage Linked Warehouse Issue Requests* — Sales tạo/sửa/hủy phần chưa xuất, các role nghiệp vụ khác xem theo phạm vi), `UC-110` (*Confirm Customer Delivery with Photo Evidence* — Warehouse Staff), `UC-111` (*Confirm External Receipt and Complete Sales Order* — chỉ Sales Staff). Giữ `UC-108` của Accountant cho đối chiếu/tham chiếu chứng từ bên ngoài, không thay thế bước hoàn thành đơn của Sales. Tổng số mã UC: **111 mã (`UC-01–UC-111`), gồm 98 active và 13 retired** (13 mã retired giữ nguyên). |
| Quy tắc nghiệp vụ (`BR-01–BR-33`), Chứng từ, Trạng thái & Nghiệm thu | Cập nhật `BR-14`, `BR-25`, `BR-26`, `BR-28` và bổ sung `BR-31` (bắt buộc `SO` sao chép từ nguồn ngoài trước `WIR`, trần định lượng từng tầng `SO` → `WIR` → `OD`), `BR-32` (Warehouse xác nhận `POD` gắn dòng `GI-S` đã `POSTED` kèm ảnh chụp bắt buộc, kiểm tra nguyên tử không vượt lượng `PGI` hợp lệ, idempotent cùng operation key không trừ tồn lần hai; chỉ sang `DELIVERED` khi lượng đặt active còn lại `> 0` đã giao đủ kèm ảnh, còn hủy toàn bộ đơn khi thực giao bằng `0` thì chuyển `CANCELLED` chứ không `DELIVERED`/`COMPLETED`), `BR-33` (chỉ Sales xác nhận đã nhận đủ tiền ngoài hệ thống sau `DELIVERED` mới sang `COMPLETED`, không xử lý thanh toán/hóa đơn hay đổi tồn). Cập nhật bảng chứng từ (`SO`, `WIR`/`OD`, `GI-S`, `POD`, `PAY-CFM`), liên kết dòng (15.2), trạng thái `SO` (15.3) tách biệt với `WIR`, chuỗi chứng từ BF-05 và 3 tình huống nghiệm thu BF-05. |

## 3. Các tài liệu ngoài phạm vi lượt này (cần đồng bộ tiếp theo)

- [docs/01_bao_cao/WMSD_Report1_Fix.docx.txt](docs/01_bao_cao/WMSD_Report1_Fix.docx.txt), [docs/01_bao_cao/WMSD_Report3_Fix.docx.txt](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt), [docs/03_thiet_ke/de_xuat_database_design_VI.md](docs/03_thiet_ke/de_xuat_database_design_VI.md), [docs/03_thiet_ke/de_xuat_database_design_EN.md](docs/03_thiet_ke/de_xuat_database_design_EN.md), [docs/03_thiet_ke/WMSD_SQL_schema.sql](docs/03_thiet_ke/WMSD_SQL_schema.sql) cũng như các file Word `.docx`, ảnh PNG và sơ đồ `draw.io` **không nằm trong danh sách file được phép sửa của lượt này** và vẫn đang ở baseline 108 UC (95 active / 13 retired) đầu ngày 21/10/2026. Mục 9 và các ghi chú liên quan trong hai bản Đề xuất quy trình 2 đã được đánh dấu rõ là danh mục yêu cầu cần đồng bộ tiếp theo cho các tài liệu đó.

---

> **Nhật ký lịch sử đầu ngày 21/10/2026 và ngày 20/10/2026:** Toàn bộ nội dung bên dưới được giữ nguyên văn để bảo toàn lịch sử. Các phát biểu trong các bản ghi cũ bên dưới như “không dùng AGY”, “bỏ SO nội bộ / thay SO bằng WIR”, “108 ID: 95 active, 13 retired” hoặc “đã đồng bộ toàn bộ 7 file” phản ánh trạng thái của các lượt trước (trước khi có yêu cầu sửa đổi BF-05 `SO` → `WIR` → `DELIVERED` → `COMPLETED` ở trên).

# Nhật ký đồng bộ WMSD — 21/10/2026

## 1. Phạm vi và căn cứ hiện hành

- Yêu cầu lần này: đồng bộ toàn bộ bảy file đã chỉ định theo quy trình mới và bổ sung các luồng ngoài happy case. Sửa trực tiếp theo chỉ dẫn mới nhất; không dùng AGY, không stage/commit, không gửi email hoặc yêu cầu review ra ngoài.
- Căn cứ: quyết định D1–D8 trong nhật ký 20/10 bên dưới, khảo sát một phản hồi lúc 09:04:25 ngày 20/10/2026 (GMT+7), và hai bản Đề xuất quy trình 2. Không tự thay đổi các quyết định đã chốt hoặc bịa thời hạn nhận trả/hệ số SKU/danh sách kho.
- Git trước sửa sạch. Chỉ bảy file được yêu cầu và nhật ký này thay đổi; tài liệu nguồn cũ/CSV, Word, hình và draw.io giữ nguyên. Bản chụp trước sửa và script kiểm tra ở thư mục tạm của phiên, ngoài repository.

## 2. Nội dung đã đồng bộ

| File | Thay đổi |
|---|---|
| [Report 1 text](docs/01_bao_cao/WMSD_Report1_Fix.docx.txt) | Đồng bộ mục tiêu, bối cảnh As-is, giải pháp, đủ 7 BF, 9 FE và giới hạn LI. Tách dữ kiện khảo sát khỏi To-be; bỏ cam kết SO/giá/hóa đơn/hoàn tiền trong WMS. Giữ thông tin dự án/stakeholders và lịch sử chỉnh sửa. Bỏ số trang Word cũ khỏi mục lục text. |
| [Report 3 text](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt) | Viết lại các phần baseline cũ và gom boilerplate lặp; đồng bộ context/mainflow/model/rules, catalogue, associations, quyền, đặc tả, màn hình/API/job, NFR và appendix. Giữ 108 ID: 95 active, 13 retired; đủ 108 đặc tả và 108 dòng quyền. 49 UC có hợp đồng thao tác cụ thể; UC xem/trace giữ input/display phù hợp và không post. UC-72 là custody/inspection trước Owner; UC-73 chỉ nhận phần đủ điều kiện đúng version/quantity. |
| [Quy trình VI](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), [EN](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) | Thêm 35 nhánh A/E ở ngay từng BF với điều kiện, người xử lý, điểm tiếp tục, tác động tồn và UC; thêm EX-01–05 dùng chung. Cập nhật phạm vi đồng bộ, trạng thái checklist, source version/correlation và tham chiếu database. |
| [Thiết kế database VI](docs/03_thiet_ke/de_xuat_database_design_VI.md), [EN](docs/03_thiet_ke/de_xuat_database_design_EN.md) | Chuyển căn cứ sang baseline 21/10 và D1–D8; xác nhận từ 3 kho nhưng chưa biết danh sách. Đồng bộ T-SQL/schema wmsd, MongoDB runtime, assessment D6, packaging, external source/correlation, enforcement R-13–15, 26 case nghiệm thu và trace nhánh ngoại lệ. Không gán kết quả PostgreSQL cũ cho T-SQL hiện tại. |
| [SQL tham chiếu](docs/03_thiet_ke/WMSD_SQL_schema.sql) | Thêm CHECK cố định 5 role; inspection packaging enum độc lập quality; lý do assessment không trống và index tìm assessment theo dòng/version; source_version nullable, correlation_id UNIQUE không trống; bổ sung nghĩa vụ service theo các ngoại lệ. Vẫn 64 bảng, 2 view; không thêm engine runtime hoặc stored procedure giả. |
| [Nhật ký này](change_logs.md) | Bổ sung bản ghi 21/10; giữ toàn bộ nhật ký 20/10 nguyên văn phía dưới dưới nhãn lịch sử. |

Màn hình Report 3: SC-01–24 tiếp tục active, SC-25–27 retired; thêm SC-28 External Document References. Tổng 28 ID màn hình, 25 active/3 retired. UC-103 dùng SC-10/16; UC-104 tại SC-13; UC-105 tại SC-14; UC-106/107 tại SC-19; UC-108 tại SC-28. API-02 mô tả hợp đồng lưu chứng cứ riêng tư, chưa chọn nhà cung cấp; JOB-01 chỉ xử lý thông báo kho sau commit, không có job tự tạo kiểm kê/PO.

## 3. Phủ luồng ngoài happy case

| BF | Số nhánh mỗi ngôn ngữ | Các tình huống bổ sung |
|---|---:|---|
| BF-01 | 6 | Nhu cầu đã có nguồn; từ chối/trả sửa; giao phần/chốt thiếu; thừa/sai; không nhận lượng nào; thùng mở/rách và hàng thay thế. |
| BF-02 | 4 | Lỗi trên hàng đã giữ/soạn; chưa rõ chủ/cause; duyệt phần/từ chối; chưa thực hủy/trả và chống trừ lặp. |
| BF-03 | 5 | Nội kho; xuất trực tiếp kho khác; thiếu nguồn/người nhận độc lập; nhận phần/hỏng; thừa/sai lô/thất lạc đã xác minh. |
| BF-04 | 5 | Task dở/khóa chồng; chưa đếm/0/hàng mới; quality khác mất lượng; không lệch/trả sửa; lỗi mạng khi clearing. |
| BF-05 | 5 | Nguồn chưa rõ/trùng/tranh hàng; giao phần/đổi lô; soạn lệch; hủy trước PGI/unpick; hủy/trả sau PGI. |
| BF-06 | 5 | Lịch sử ngoài WMS; D6 chưa rõ/bị loại; trả hỗn hợp; đổi assessment/vượt nguồn; rút yêu cầu/chậm giao trả custody. |
| BF-07 | 5 | NCC chưa đồng ý/đồng ý phần; tái dùng quyết định BF-02; soạn thiếu/custody; ACK lệch; đổi hàng/bồi thường ngoài WMS. |

EX-01–05: phân quyền/tách người; version/cạnh tranh nguồn; chưa rõ commit/retry; khóa kiểm kê; chứng cứ/in/email lỗi. Nhánh quy định rõ rollback/giữ trạng thái/chờ hoặc tiếp tục, không tự tạo quyền hay tăng/trừ tồn bằng đổi trạng thái.

## 4. Kiểm tra của lượt 21/10

| Kiểm tra | Kết quả và giới hạn |
|---|---|
| Catalogue ↔ đặc tả ↔ quyền | 108 ID duy nhất, tên/trạng thái khớp; 95 active/13 retired; mọi retired không có quyền hoặc bước thực thi. |
| Màn hình | 28 ID, 25 active/3 retired; mọi active UC có màn hình, không màn hình active nào gắn UC retired. |
| VI–EN và SRS | Cùng 35 mã nhánh theo thứ tự, 5 lỗi chung, 30 BR; BR tiếng Anh trong SRS trùng bộ quy trình. Hai bản quy trình cùng 27 bảng với số dòng tương ứng; hai bản database cùng 13 bảng và 26 case T01–T26. |
| Liên kết nội bộ | Các liên kết file trong 4 bản quy trình/database không có đích bị thiếu; kiểm range UC trong SRS không có range đảo/vượt 108. |
| Cú pháp SQL Server | Microsoft ScriptDom 180.140.0, TSql160Parser: 0 lỗi, 6 batch; đếm 64 bảng/2 view. Đây là parse, chưa thực thi trên SQL Server. |
| Biểu thức CHECK | 750 phép kiểm trên SQLite in-memory dùng nguyên biểu thức CHECK/enum từ DDL và hàm LEN tương thích. Gồm 720 tổ hợp D6, 9 thiếu bằng chứng thời hạn, 2 lý do trống, 1 enum D6 sai; 18 kiểm bổ sung về role/packaging/source-version/correlation và unique nguồn. Không thay thế hành vi collation, FK, service hay concurrency SQL Server. |
| Diff / phạm vi | Đọc diff các thay đổi, rà các phần nguồn/role/stock effect và whitespace; git diff --check đạt. Không stage hoặc commit; không sửa file ngoài 8 file nêu trên. |

## 5. Giới hạn còn lại

- Chỉ cập nhật các bản text/Markdown/DDL được chỉ định. Word .docx, hình nhúng, PNG và draw.io không được sửa trong lượt này; sơ đồ Mermaid/context/ER và nội dung text hiện hành không làm ảnh cũ tự đổi. Khi dựng Word/PDF mới phải thay hình cũ theo bộ này.
- Chưa có SQL Server engine hoặc backend runtime để chạy migration, phân quyền, transaction/concurrency và end-to-end. Các nhánh/26 case là tiêu chí nghiệm thu, không tuyên bố hệ thống đã vượt qua chúng.
- Chưa xác minh danh sách/địa chỉ/số kho chính xác (đã biết từ 3), người từng kho, actual calibre, hệ số từng SKU, thời hạn trả và lịch đối chiếu MISA. Không tự đặt giá trị mặc định.
- Các tham khảo sản phẩm/thuế/SAP từ bản trước là lịch sử; lượt này không tái xác minh nguồn web hay đưa hướng dẫn pháp lý mới.

---

> **Nhật ký lịch sử 20/10/2026:** phạm vi và giới hạn dưới đây mô tả lượt trước. Phần “Report 3 chưa viết lại toàn bộ”, “không sửa Report 1” và “chưa cập nhật thiết kế database” đã được thay bằng kết quả lượt 21/10 phía trên; không còn là trạng thái hiện tại của bộ text.

# Nhật ký cập nhật quy trình WMSD — 20/10/2026

## 1. Căn cứ và phạm vi

- [Khảo sát Tân Thương](docs/05_khao_sat/khao_sat_kho_gach.csv): 1 phản hồi lúc 09:04:25 ngày 20/10/2026 (GMT+7), 26 câu hỏi.
- [Đề xuất sau review1](docs/02_nghiep_vu/De_xuat_7_quy_trinh_sau_review1.md): nguồn kế thừa; giữ nguyên file gốc.
- Quyết định D1–D8 của người dùng trong chat: đã cho phép cập nhật hai bản đề xuất mới, bảng UC của Report 3 dạng text, sơ đồ mainflow và SQL tham chiếu.
- Không sử dụng AGY; không tạo commit; không gửi email hoặc yêu cầu review ra ngoài.

## 2. Quyết định áp dụng

| Mã | Nội dung đã chốt | Tác động |
|---|---|---|
| D1 | Giữ giảm tồn vật lý tại bàn giao/PGI | Lập yêu cầu chỉ giữ hàng/giảm khả dụng. Ghi rõ khác câu 17 của khảo sát và cần đối chiếu đơn MISA chưa thực giao. |
| D2 | Giữ các bộ phận tự nhập/xác nhận như bản cũ | Không thêm nhập hộ hoặc tài khoản dùng chung, dù khảo sát chọn kế toán/một người nhập chung. |
| D3 | Giữ đúng 5 application role | Store Owner, Sales Staff, Warehouse Staff, Accountant, Administrator. Warehouse Staff là tên thống nhất của Inventory Staff, không phải role mới. Không thêm mua hàng/giao hàng hoặc cơ chế ủy quyền động. |
| D4 | Có chuyển hàng giữa các kho | Giải quyết mâu thuẫn chọn có/không ở câu 13 bằng xác nhận người dùng; không sửa CSV. Giữ BF-03B và xác nhận độc lập hai đầu. |
| D5 | Giữ khóa phạm vi kiểm kê | Bổ sung lịch kiểm hằng tháng. Không chọn vừa đếm vừa nhập/xuất; không thêm job tự tạo phiên. |
| D6 | Bổ sung điều kiện khách trả | Nguyên thùng/viên lẻ chưa dùng xét từng trường hợp; không nhận đã thi công, hỏng do khách, quá hạn đã xác minh. Chưa rõ điều kiện/thời hạn thì chờ, không tự đặt số ngày. |
| D7 | Cập nhật dữ kiện có căn cứ | Từ 3 kho trở lên theo khảo sát; đã chia khu/kệ và đánh mã; ghi lô/màu/kích thước; thùng/viên/m², thùng mở, bao bì rách; dùng điện thoại; phối hợp kiểm nhận/liên hệ NCC. Không suy diễn calibre, địa chỉ, hệ số hay quyền mới. |
| D8 | Giữ các kiểm soát còn lại dưới nhãn To-be | Custody, staging/put-away, FIFO tương thích, chống post trùng, không tự duyệt, duyệt TR, không live MISA tiếp tục là thiết kế đề xuất. |

## 3. File được tạo/cập nhật

| File | Nội dung |
|---|---|
| [de_xuat_quy_trinh_2_VI.md](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) | Tạo bản Việt đầy đủ từ nguồn cũ, giữ cấu trúc thuật ngữ và 16 mục. Thêm nguồn khảo sát, bảng D1–D8, phân biệt As-is/To-be, dữ kiện đã rõ/chưa rõ, BR-29/30 và tình huống nghiệm thu mới. |
| [de_xuat_quy_trinh_2_EN.md](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) | Tạo bản Anh tương ứng đầy đủ: thuật ngữ, 7 quy trình, UC, quyền, context, 30 BR, Mermaid, nghiệm thu, nguồn, chứng từ/trạng thái và quy ước lane. |
| [WMSD_Report3_Fix.docx.txt](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt) | Cập nhật 4.1 actors, 4.2 catalogue và 4.4 permission matrix; sửa tên Warehouse Staff và ghi chú trạng thái sơ đồ cũ tại 4.3. Nội dung trước mục 4.1 và từ mục 5 trở đi được giữ nguyên. |
| [WMSD_Mainflows_VI_EN.drawio](docs/04_so_do/WMSD_Mainflows_VI_EN.drawio) | Cập nhật phiên bản/nguồn đề xuất trên 16 trang, nhãn/ghi chú liên quan khảo sát và D1–D8; giữ IDs, lanes, edges và hình học các bước hiện có. |
| [WMSD_Mainflow_BF03B_VI.png](docs/04_so_do/WMSD_Mainflow_BF03B_VI.png) và [WMSD_Mainflow_BF03B_EN.png](docs/04_so_do/WMSD_Mainflow_BF03B_EN.png) | Xuất lại hai ảnh đã được tài liệu tham chiếu từ trang 4 và 12 của draw.io cập nhật, tránh ảnh cũ lệch nhãn/ghi chú. |
| [WMSD_SQL_schema.sql](docs/03_thiet_ke/WMSD_SQL_schema.sql) | Bổ sung bảng đánh giá điều kiện khách trả theo dòng/phiên bản, CHECK và index; bổ sung các nghĩa vụ kiểm soát tại tầng ứng dụng. Bảo toàn toàn bộ dòng SQL có trước lượt này. |
| [change_logs.md](change_logs.md) | Nhật ký này: phạm vi, quyết định, thay đổi, kiểm tra và giới hạn. |

## 4. Thay đổi theo quy trình

| Quy trình | Thay đổi / phần giữ nguyên |
|---|---|
| BF-01 | Ghi chủ/kế toán có thể cùng kiểm và lưu người tham gia trong bằng chứng. Warehouse vẫn xác nhận/post GR. Bao bì rách không tự là gạch hỏng; thùng mở ghi viên thực tế. Luồng RR → Owner → Accountant PO → Warehouse nhận/put-away giữ nguyên. |
| BF-02 | Giữ nguyên luồng, quyền và tác động tồn. Không thêm quyền tự động cho người được ủy quyền trong thực tế. |
| BF-03A | Giữ nguyên di chuyển nội kho không Owner approval, bảo toàn tổng/lô/chất lượng/reservation. |
| BF-03B | Ghi có điều chuyển theo D4 và từ 3 kho theo khảo sát; danh sách kho cụ thể chưa có. Giữ TR duyệt, TD/MWTR riêng, người nhận độc lập và xử lý chênh lệch. |
| BF-04 | Thêm lịch hằng tháng, giữ khóa phạm vi đến khi hoàn tất xử lý. Phương án reconcile giao dịch sau cutoff được ghi là phương án chưa chọn. |
| BF-05 | Ghi các kênh yêu cầu thực tế nhưng Sales chuẩn hóa thành WIR có nguồn xác minh; không tích hợp tự động các kênh. Giữ PGI, reservation, partial delivery và từng bộ phận tự nhập. |
| BF-06 | Thêm điều kiện D6, phân loại theo từng lượng, phiên bản đánh giá/bằng chứng và kiểm điều kiện trước khi duyệt/post. Chưa rõ → custody/chờ xác minh; bị loại → không GR-CR, bàn giao lại nếu đã giữ hàng. Lỗi do NCC không bị đánh đồng hỏng do khách. Mermaid thể hiện riêng nhánh chưa rõ. Hoàn tiền tiếp tục ngoài WMS. |
| BF-07 | Ghi chủ/nhân viên mua hàng có thể liên hệ NCC ngoài phần mềm; Accountant vẫn nhập thỏa thuận/ACK, không thêm role. Giữ chấp thuận NCC trước xuất, duyệt nội bộ, thực xuất và đối chiếu. |

## 5. Catalogue UC và quyền

**108 mã để truy vết = 95 UC active + 13 UC retired.** Không đánh lại số UC.

| Nhóm | Cập nhật |
|---|---|
| UC-03/04/07 | Sales/Warehouse đề xuất, Owner duyệt khác người đề xuất, Accountant lập PO theo dòng đã duyệt. |
| UC-13/26/30/31 | Quy đổi/bao bì, cùng kiểm nhận không đồng nghĩa quyền post, phân biệt tồn vật lý/khả dụng/giữ hộ/đang chuyển. |
| UC-32/33, UC-52–55 | Đặt tên put-away/picking task; không gọi là tầng phê duyệt mới. |
| UC-40/41/43/44 | TR → duyệt → xuất nguồn; UC-43 đổi thành Record Transfer Dispatch, UC-104 nhận đích. |
| UC-45–48/51/58 | Sales Order đổi thành Warehouse Issue Request có nguồn ngoài; kế hoạch giao theo outstanding; PGI theo bàn giao thực tế. |
| UC-65–67 | Cách ly ngay, duyệt và thực hiện đúng lượng; không trừ lặp khi chuyển BF-07. |
| UC-70–73 | Sales tạo; Warehouse kiểm/đánh giá D6; Owner duyệt sau kiểm; chỉ post lượng đủ điều kiện đúng phiên bản. |
| UC-81–83 | Kho đề nghị/thực xuất, NCC đồng ý + Owner duyệt trước xuất; ACK về sau, đóng không trừ lại. |
| UC-86–93 | Kiểm theo tháng/mục tiêu; snapshot và FROZEN; phiếu đếm/recount; Warehouse đề xuất delta; Owner duyệt và Clear Difference riêng. UC-92 đổi tên Review Inventory Adjustment để thể hiện duyệt/từ chối/trả về. |
| UC-98–102 | Năm role, scope kho, nhật ký, báo cáo và trace theo phạm vi kho; không nhập hộ/ủy quyền động. |
| UC retired | UC-23–25 giá bán; UC-42 TO liên kho dư; UC-59–62 hóa đơn nội bộ; UC-74–78 workflow hoàn tiền. Giữ mã/lý do, không có quyền active. |
| UC-103 mới | View and Select Shortage Fulfilment Options — Sales/Warehouse; hỗ trợ BF-01/03/05. |
| UC-104 mới | Inspect and Post Transfer Receipt — Warehouse kho đích độc lập. |
| UC-105 mới | Export or Print Stocktake Count Sheet — Warehouse/Owner; giữ riêng, chưa gộp vào UC-87. |
| UC-106 mới | Approve Supplier Return and Variance Resolution — Owner; phân biệt quyết định trước xuất và xử lý sai lệch. |
| UC-107 mới | Record Supplier Agreement and Receipt Acknowledgement — Accountant; hai mốc độc lập. |
| UC-108 mới | Record External Document References — Accountant; nguồn lịch sử/hóa đơn/hoàn tiền/đối chiếu bên ngoài. |

Bảng quyền được đồng bộ cho đủ 108 mã; cả 13 retired đều không còn quyền thực hiện. Quyền xem không tự cấp quyền nhập, duyệt hoặc post. Bản đề xuất giữ ma trận nghiệp vụ tổng hợp, Report 3 giữ ma trận từng UC.

## 6. SQL: đánh giá phù hợp và bổ sung

### 6.1 Cấu trúc có sẵn phù hợp, giữ nguyên

- `app_role` có đúng OWNER, SALES, WAREHOUSE, ACCOUNTANT, ADMIN.
- `warehouse`, `location`, `user_warehouse` đã hỗ trợ nhiều kho, mã vị trí và phạm vi người dùng; không cần seed ba kho giả.
- `product_uom_version`, `document_line` đã lưu hệ số/đơn vị và snapshot để theo dõi thùng/viên/m².
- `transfer_dispatch`, `transfer_receipt`, `stock_account` đã tách xuất, nhận và transit.
- `reservation`, `posting_batch`, `stock_movement`, `available_stock` đã biểu diễn giữ hàng và ghi nhận thực xuất.
- `stocktake.mode = 'FROZEN'`, `location_lock`, snapshot/count/adjustment phù hợp D5.
- `evidence`, `document.note`, `audit_event`, `external_reference` dùng để ghi phối hợp kiểm nhận, người liên hệ NCC và kết quả bên ngoài; không cần role mới.

### 6.2 Khoảng trống và cách bổ sung

Trước cập nhật, `customer_return_line` chỉ có nguồn và lý do, chưa biểu diễn có cấu trúc các điều kiện D6. Thêm `customer_return_assessment`:

| Dữ liệu | Ý nghĩa |
|---|---|
| `return_line_id`, `assessment_no`, `document_version` | Lượng/dòng được đánh giá, lần đánh giá và phiên bản hồ sơ. Tách dòng khi điều kiện từng lượng khác nhau. |
| `packaging_condition` | SEALED / OPENED / TORN / UNKNOWN; không đồng nghĩa quality. |
| `installation_status` | UNUSED / INSTALLED / UNKNOWN. |
| `damage_cause` | NONE / CUSTOMER / SUPPLIER / OTHER / UNKNOWN. |
| `deadline_status`, `deadline_reference` | WITHIN / EXCEEDED / NOT_APPLICABLE / UNKNOWN; trạng thái đã xác minh phải có căn cứ, kể cả không áp dụng thời hạn. Không có số ngày mặc định. |
| `eligibility_status` | PENDING / CASE_REVIEW / INELIGIBLE. CASE_REVIEW chỉ có nghĩa đủ căn cứ để xét, chưa phải Owner đã chấp nhận. |
| `assessment_reason`, `assessed_by`, `assessed_at`, `approval_id` | Lý do, người/thời điểm đánh giá và liên kết quyết định. |

- `ck_return_deadline_evidence`: chặn trạng thái thời hạn đã xác minh nhưng thiếu/trống tham chiếu.
- `ck_return_eligibility`: đã thi công/hỏng do khách/quá hạn không thể là CASE_REVIEW; điều kiện chưa rõ phải PENDING nếu chưa có căn cứ loại; biết chắc điều kiện loại phải INELIGIBLE.
- Unique `(return_line_id, assessment_no)` và index theo trạng thái/dòng.
- Tầng ứng dụng phải chọn đánh giá mới nhất đúng phiên bản, kiểm kết quả inspection và approval đúng hồ sơ/dòng/lượng trước GR-CR; thay điều kiện phải đánh giá/duyệt lại. DDL không tự thực hiện các kiểm tra liên bảng này.

**Bảo toàn thay đổi có sẵn:** trước lượt này SQL đã được sửa từ PostgreSQL sang SQL Server/T-SQL, gồm `wmsd.*`, `IDENTITY`, `bit`, `datetimeoffset`, filtered indexes và `GO`. Toàn bộ các dòng đang có được giữ theo đúng thứ tự; lần này chỉ chèn bổ sung. Diff với Git HEAD lớn hơn phần thay đổi của lượt này vì bao gồm chuyển đổi cú pháp có trước.

SQL tiếp tục là **DDL tham chiếu để review**, không phải schema runtime MongoDB, không phải migration đã triển khai và chưa có posting/authorization service.

## 7. Kiểm tra đã thực hiện

| Kiểm tra | Kết quả và giới hạn |
|---|---|
| Giữ nguyên tài liệu gốc | Không sửa `De_xuat_7_quy_trinh_sau_review1.md` hoặc CSV. |
| Bảo toàn phần Việt không thay đổi | So sánh nguyên văn mục 3, 6, 7, 13, 14, 15 với nguồn cũ: trùng khớp. Các mục còn lại sửa tại phần có tác động hoặc thêm dữ kiện. |
| Tương ứng Việt–Anh | Đủ 16 mục đánh số, 19 bảng có cùng số dòng tương ứng, 7 BF chi tiết và 7 Mermaid mainflow mỗi bản; cùng các mã BR/UC. Đã đọc đối chiếu nội dung, không chỉ đếm mục. |
| Catalogue / permission | 108 mã duy nhất; 95 active, 13 retired; đủ 108 dòng quyền; mọi retired đều không có quyền. |
| Phạm vi Report 3 | Nội dung trước 4.1 và từ mục 5 trở đi trùng bản trước sửa. 4.3 chỉ đổi tên role và ghi chú sơ đồ cũ cần đồng bộ. |
| Draw.io | `validate.py --score`: 0 lỗi, 0 cảnh báo; 16 trang. IDs/lane/edge và geometry bước không đổi; chỉ tăng vùng note/page ở trang cần ghi chú dài. |
| Bản vẽ xuất | Draw.io Desktop 32.5.5 xuất thành công PDF kiểm tra đủ 16 trang và ảnh PNG; đã xem toàn bộ bố cục qua contact sheet và BF-06 Việt/Anh ở kích thước đọc được. Hai PNG BF-03B đã xuất lại. |
| Cú pháp SQL | Microsoft ScriptDom 180.140.0, parser `TSql160Parser`: 0 lỗi, 6 batch. Đây là parse cú pháp SQL Server, không phải chạy DDL trên SQL Server. |
| Điều kiện trả hàng | 20 tình huống thử các CHECK mới trong SQLite in-memory, giữ biểu thức CHECK và cung cấp hàm LEN tương thích: nguyên thùng, lẻ, bao bì rách, lỗi NCC, đã thi công, hỏng do khách, quá hạn, thiếu căn cứ và chờ xác minh đều cho kết quả mong đợi. Không thay thế kiểm thử SQL Server hoặc service thật. |
| Bảo toàn SQL trước sửa | So sánh với bản chụp đầu lượt: chỉ có insert, không delete/replace các dòng SQL cũ. |
| Git | `git diff --check` không báo lỗi whitespace. Không stage hoặc commit. |

Các script kiểm tra, bản chụp trước sửa, parser tải về và ảnh/PDF xem trước nằm trong thư mục tạm của phiên, không thêm vào repository.

## 8. Phần còn ngoài phạm vi / chưa xác minh

1. **Report 3 chưa được viết lại toàn bộ.** Người dùng yêu cầu cập nhật bảng UC trong bản `.docx.txt`; catalogue, actor và permission đã đồng bộ. Các mainflow bằng chữ, đặc tả UC chi tiết ở phần II, screen, entity/rule và hình nhúng cũ vẫn còn nội dung baseline. Ghi chú ngay trong mục 4.2/4.3 chỉ rõ các phần cũ không được dùng để khôi phục quyền/phạm vi đã retired. Cần một lượt đồng bộ toàn SRS trước khi gọi cả report là bản cuối. Không sửa Word `.docx` hay Report 1.
2. Không có SQL Server engine được dùng để chạy DDL hoặc test dịch vụ thực tế; chỉ kiểm cú pháp và biểu thức điều kiện như mục 7. Không chạy trên database có dữ liệu.
3. Không tự cập nhật ERD database draw.io hoặc tài liệu thiết kế database khác: người dùng chỉ chỉ định SQL và mainflow, và ERD đang là file chưa theo dõi có trước lượt này.
4. Chưa xác minh số kho chính xác/danh sách/địa chỉ, số người từng kho, actual calibre, hệ số từng SKU, thời hạn nhận trả và lịch đối chiếu MISA. Giữ các mục này ở trạng thái cần xác minh.
5. Các liên kết SAP/MISA và hướng dẫn hóa đơn được kế thừa từ đề xuất gốc; lượt này không tái xác minh toàn bộ nguồn trực tuyến hoặc quy định thuế. Không coi đó là tư vấn pháp lý được cập nhật.
6. Các file có sẵn chưa theo dõi `docs/03_thiet_ke/WMSD_database_design.drawio`, `docs/03_thiet_ke/debug.log` và CSV khảo sát được giữ nguyên. Không thu dọn hoặc gán chúng là sản phẩm của lượt này.
