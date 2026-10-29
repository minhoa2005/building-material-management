# Kết quả đồng bộ tài liệu WMSD — 22/10/2026

> Snapshot lịch sử theo ngày trong tiêu đề, giữ nguyên kết luận/số liệu/đường dẫn nguồn tại thời điểm ghi nhận. Trạng thái tài liệu hiện tại: [hậu kiểm đồng bộ 25/10/2026](Ket_qua_dong_bo_tai_lieu_2026-10-25.md). Các mục “chưa sửa/giữ Report 2”, quyền cũ hoặc số bảng cũ bên dưới không mô tả baseline hiện hành.


Đã cập nhật bộ tài liệu hiện hành trong repository theo baseline **3.0.0**, xử lý các phát hiện SYNC-01–09 của [báo cáo trước sửa](Bao_cao_dong_bo_tai_lieu_2026-10-22.md). Codex chỉnh trực tiếp theo yêu cầu, không dùng AGY. **Report 2 được giữ nguyên**; OBS-01 về effort/buffer tạm hoãn. Không stage hoặc commit.

## 1. Chuẩn nội dung sau sửa

| Thành phần | Kết quả |
|---|---|
| Quy trình | BF-01–08; BF-03 chỉ chuyển vị trí cùng kho, BF-04 điều chuyển liên kho; 37 A/E và EX-01–05 |
| Vai trò | Store Owner, Sales Staff, Warehouse Staff, Accountant, Administrator; quyền theo operation và kho/bản ghi |
| Use case | 111 ID; 98 active, 13 retired; catalogue, ma trận quyền, actor associations, đặc tả và màn hình khớp nhau |
| Chuỗi đơn | SO sao chép nguồn đã xác minh → WIR liên kết → OD/soạn/PGI → Warehouse POD có ảnh, DELIVERED → Sales PAY-CFM, COMPLETED |
| Quy tắc và màn hình | BR-01–33; SC-01–31, trong đó 28 active và 3 retired |
| Dữ liệu | MongoDB runtime; SQL tham chiếu giữ nguyên 73 bảng, 173 FK, 2 view; 21 quy tắc R và 40 tình huống T |
| Hình hiện hành | Database 10 trang; mainflow VI/EN 16 trang và EN 8 trang; context cùng 5 role/API-01/API-02; ảnh BF-04 mới |

POD và PAY-CFM không ghi tồn hoặc thực hiện thu tiền. PGI diễn ra tại bàn giao thực tế; bàn giao vận chuyển chưa đủ để coi khách đã nhận. Hủy phần chưa xuất, giao từng phần, đính chính VOIDED và giới hạn lượng tích lũy được ghi trong quy trình, SRS và thiết kế chi tiết. Kiểm kê giữ FROZEN theo D5.

## 2. Đối chiếu từng phát hiện

| Mã | Trạng thái sau sửa | Nội dung đã thực hiện |
|---|---|---|
| SYNC-01 | Đã xử lý | [Report 1](../01_bao_cao/WMSD_Report1_Fix.docx.txt) có phạm vi SO/POD/PAY-CFM; [Report 3](../01_bao_cao/WMSD_Report3_Fix.docx.txt) đổi UC-45–48 về SO, thêm UC-109–111 và BR-31–33; cập nhật đồng thời danh mục, quyền, đặc tả, SC-16/29–31, NFR và lỗi. |
| SYNC-02 | Đã xử lý | Report 1/3 và hình hiện hành dùng đủ 8 BF; tham chiếu A/E, UC, quy tắc và quyền theo mapping mới. Thân Report 3 có một bộ 8 quy trình, không còn bản 7 luồng nằm lẫn với mục lục. |
| SYNC-03 | Đã xử lý | [Thiết kế chi tiết](../03_thiet_ke/WMSD_Thiet_ke_he_thong_chi_tiet.md) thay bản 1.0/16-10 bằng 3.0.0: quyền, trạng thái, MongoDB mapping, transaction, API, bằng chứng, 33 BR, 21 R, 40 T và truy vết 111 UC. Không còn route thực thi cho UC retired. |
| SYNC-04 | Đã xử lý | [Database draw.io](../03_thiet_ke/WMSD_database_design.drawio) có đầy đủ bảng/cột/kiểu/PK và 173 quan hệ FK theo SQL, gồm các bảng SO/POD/PAY-CFM và khóa nguồn mới của WIR/OD/GI. Mỗi bảng có một định nghĩa đầy đủ; stub FK cục bộ ghi cặp cột và liên kết sang trang gốc. |
| SYNC-05 | Đã xử lý | [VI/EN mainflow](../04_so_do/WMSD_Mainflows_VI_EN.drawio) 16 trang và [EN mainflow](../04_so_do/WMSD_Mainflows_EN.drawio) 8 trang dùng actor lanes; context và ảnh BF-04 [VI](../04_so_do/WMSD_Mainflow_BF04_VI.png)/[EN](../04_so_do/WMSD_Mainflow_BF04_EN.png) hiện hành. Hai workbook cũ có nhãn lịch sử trên toàn bộ 24 trang; nội dung/ID gốc giữ nguyên. |
| SYNC-06 | Đã xử lý | [Quy trình VI](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md)/[EN](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) và thiết kế dữ liệu VI/EN ghi đúng trạng thái Report 1/3, UC-103–111, D5 và bộ hình sau sửa. Context/rule trace dùng API-02 với nhà cung cấp chưa chốt. |
| SYNC-07 | Đã xử lý | [README](../../README.md) phân biệt tài liệu hiện hành, lịch sử, Report 2 hoãn sửa, đủ 6 biên bản họp, CSV khảo sát và bộ tham khảo. |
| SYNC-08 | Đã xử lý liên kết hiện hành | Tạo lại workbook song ngữ bị thiếu; thay tham chiếu ERD ảnh không tồn tại bằng mô hình chỉnh sửa được; bỏ liên kết máy cá nhân. Nguồn hiện hành trỏ bộ SAP v4.1 trong repo với số trang đã đối chiếu. review1.md và SAP v4.2 được ghi là nguồn lịch sử chưa đóng gói, không tạo tệp giả hoặc đồng nhất hai phiên bản. |
| SYNC-09 | Đã xử lý | Tách dữ kiện CSV Q16 về kênh/giữ hàng/giao nhiều đợt, Q22/24 về cập nhật bằng điện thoại, Q8/12 về ảnh nhập hàng/hàng lỗi. Ảnh POD bắt buộc và PAY-CFM ghi rõ là chỉ dẫn thiết kế ngày 21/10. |
| OBS-01 | Tạm hoãn theo yêu cầu | [Report 2](../01_bao_cao/WMSD_Report2.docx.txt) không thay đổi; chưa hiệu chỉnh effort/buffer hoặc kế hoạch theo phạm vi mới. |

## 3. Hậu kiểm đã thực hiện

| Kiểm tra | Kết quả / giới hạn |
|---|---|
| 41 kiểm tra tự động về tài liệu | Đạt: dãy ID, trạng thái, tên, FE, ma trận quyền/actor associations, liên kết UC↔screen, 37 nhánh và định nghĩa, 33 BR, cấu trúc bảng/graph VI–EN, ERD, liên kết file và bảo toàn nguồn. |
| So sánh VI/EN | Quy trình khớp cấu trúc 30 bảng và 9 Mermaid blocks; thiết kế dữ liệu khớp 16 bảng, ERD và R-01–21/T01–40. Đây là kiểm tra cấu trúc/mã, kết hợp đọc đối chiếu nghiệp vụ; không phải chứng nhận dịch thuật từng câu. |
| Kiểm database độc lập | Đọc lại DDL để đối chiếu đủ 73 bảng/cột/kiểu/PK và từng tuple của 173 FK, kể cả FK composite. SHA nguồn ghi trong workbook khớp tệp SQL. SQL không bị sửa trong lượt này. |
| Kiểm XML draw.io | Ba workbook hiện hành đều đạt 0 lỗi, 0 cảnh báo; điểm layout 0: không phát hiện đường qua hộp, đường cắt nhau hoặc hộp chồng nhau theo validator. |
| Render native | draw.io desktop 32.5.5 xuất thử thành công toàn bộ 34 trang hiện hành. Đã xem ảnh tổng hợp và phóng to các trang trọng điểm; 8 trang EN dùng cùng graph với nửa EN của workbook song ngữ. Hai PNG BF-04 được xuất từ đúng trang VI/EN hiện hành. |
| Bảo toàn lịch sử sơ đồ | ID, tên trang, nhãn và quan hệ gốc của 2 workbook lịch sử giữ nguyên; chỉ thêm banner và dịch bố cục toàn trang để chừa chỗ. Offset nhãn tương đối được bảo toàn. |
| Hash bảo toàn 17 tệp | Report 2, 6 biên bản .docx, CSV, 5 PDF, tệp link tham khảo, SQL và 2 PNG BF-03B khớp bản chụp trước sửa. |
| Git | `git diff --check` đạt; không có thay đổi staged, không tạo commit. Script/ảnh QA/bản chụp trước sửa nằm ngoài repository. |

SHA-256 Report 2 trước và sau: `ff008c53849e72881a7bc4f522b988ac09bc832152a528fe74d2721e6426813b`.

## 4. Phạm vi còn để mở

- Các bản Word/Google Docs bên ngoài repo chưa được cập nhật; các báo cáo trong repo là bản văn bản .docx.txt. Khi phát hành cần dùng nội dung mới và bộ hình cùng baseline.
- Report 2/OBS-01 giữ nguyên. review1.md và bộ SAP v4.2 lịch sử vẫn chưa được đóng gói trong repo; liên kết nguồn hiện hành không phụ thuộc chúng.
- Giữ các mục chưa có dữ liệu thực địa như tên/địa chỉ kho, nhân sự nhận độc lập, calibre/hệ số SKU, thời hạn trả hàng, provider storage và chỉ tiêu vận hành ở trạng thái cần xác minh; không tự tạo số liệu.
- Các 40 case T và 37 nhánh A/E là tiêu chí nghiệm thu cho triển khai. Lượt này kiểm tài liệu/sơ đồ, không thực thi SQL Server hoặc backend MongoDB và không tuyên bố các dịch vụ nghiệp vụ đã chạy.
