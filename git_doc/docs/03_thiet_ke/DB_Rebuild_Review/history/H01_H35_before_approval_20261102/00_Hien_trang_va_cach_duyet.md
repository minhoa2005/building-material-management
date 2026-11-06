# Hồ sơ thiết kế lại DB WMSD — bản đề xuất chờ duyệt

Ngày rà soát: 31/10/2026. Phạm vi: ERD được chỉ định, tài liệu chức năng và nghiệp vụ, schema/backend hiện tại, cấu trúc MongoDB đang kết nối.

**Cập nhật thiết kế 02/11/2026.** B03 (UOM) và B06 (UOM Version) đã bỏ. Đơn vị gốc lưu trên sản phẩm, hệ số và quy cách thực tế nằm trên dòng chứng từ và C08. H02–H10 và H11 (phần BF04) đã duyệt, H12 v0.2, H13–H27, H29–H34, D01–D06, E01–E06, F01–F03, H36 và H37 v0.1 đã duyệt. H28 v0.2 đã duyệt. H01 và H35 còn chờ duyệt riêng; D07/D08 còn mở vì phần xác minh đơn nguồn cần người phụ trách nghiệp vụ làm rõ. SO lưu giá bán, hóa đơn tổng hợp hiển thị từng lần xuất và tính theo lượng khách nhận. BF04 cho phép nhiều phiếu xuất theo một TR trong lượng được duyệt cho từng dòng. Mỗi phiếu xuất có thể được kho đích nhận nhiều lần. Bản đồ 3D thuộc giai đoạn sau. [Quyết định bỏ UOM](14_Bo_UOM_va_luu_quy_doi_tren_dong.md) · [Phiếu chuyển kho](16_Duyet_lenh_va_yeu_cau_chuyen_kho.md).

Quyết định mới thay ràng buộc “chỉ năm role” trong tài liệu/code cũ. Năm role đang có là danh mục ban đầu; tên role kho dùng **Warehouse Staff**. Đã bỏ `allowedRoleCodes`, không thêm nhóm role nền. Vòng đời role tùy chỉnh đã duyệt: sửa/ngừng sử dụng, chuyển user active trước khi ngừng, giữ lịch sử; các role nền giữ mã và không bị xóa/ngừng.

## 1. Kết quả kiểm tra ban đầu

| Nguồn | Kết quả đọc được | Ý nghĩa với thiết kế mới |
|---|---|---|
| `../ERD.drawio` | Một trang, 12 thực thể hiện được vẽ | Là sơ đồ tổng quan; chưa đủ để suy ra toàn bộ cấu trúc lưu dữ liệu |
| MongoDB `sep490` | 40 collection tại thời điểm đọc | Là cấu trúc thực đang tồn tại, không đồng nghĩa tất cả đều cần giữ nguyên |
| BE `src/models/index.js` | 39 model cơ sở; 36 loại document và 20 loại line | Nhiều hồ sơ nghiệp vụ đang gộp chung vào `business_documents` và `document_lines` |
| `return_source_guards` | Collection rỗng có trong DB, chưa tìm thấy model export tương ứng | Chưa kết luận thừa; cần xác định nguồn tạo trước đề xuất bỏ/gộp |
| README models / một số đoạn context | Vẫn ghi 35 document kinds, 19 line kinds | Đã lệch với schema đang khai báo, không dùng số trong mô tả làm kết luận hiện tại |
| Backend routes | Đã có các module auth/users/roles, replenishments, location-movements, warehouse-transfers, sales-orders/outbound-deliveries | Sự tồn tại schema cho các nhóm khác chưa chứng minh chức năng đã chạy hoàn chỉnh |

MongoDB được đọc bằng danh sách collection, index, kiểu trường trong mẫu và số lượng ước tính. Không sửa dữ liệu; không đưa mật khẩu, URI kết nối hoặc nội dung cá nhân vào hồ sơ. Kiểm tra mẫu không thay kiểm toán từng bản ghi.

## 2. ERD hiện tại thể hiện gì và còn thiếu gì

12 thực thể đang được vẽ: **Warehouse, Location, User, Product, ProductLot, StockMovement, Supplier, PurchaseOrder, GoodsReceipt, SalesOrder, GoodsIssue, StockCount**.

Các quan hệ nền đã có như Warehouse–Location, Product–ProductLot, Supplier–PurchaseOrder, PO–Product, SO–Product và quan hệ nhập/xuất. Vì vậy không kết luận lại rằng sơ đồ hiện tại hoàn toàn thiếu PO–Product.

Những nội dung chưa được thể hiện riêng để thiết kế DB đầy đủ:

- Số dư tồn theo vị trí, lô, chất lượng, chủ sở hữu; hàng đang chuyển; hàng giữ hộ và hàng đã giữ cho nhu cầu.
- Yêu cầu bổ sung và các dòng nguồn; TR liên kho, yêu cầu thao tác nội kho, TO, phiếu xuất/nhận điều chuyển.
- Khách hàng; yêu cầu xuất, lệnh giao, xác nhận khách nhận; nguồn MISA/giấy và các dòng sản phẩm.
- Hồ sơ hàng lỗi, khách trả, giao thất bại, trả NCC, thỏa thuận và kết quả nhận của NCC.
- Chi tiết kiểm kê: phạm vi, snapshot, các lần đếm, phương án xử lý, khóa và giao dịch điều chỉnh.
- Vai trò, quyền, lịch sử quyết định, tệp đính kèm, audit, thông báo và dữ liệu chống ghi trùng.

Quan hệ n–n như PO–Product đủ cho sơ đồ khái niệm, nhưng khi lưu phải có dòng hàng chứa số lượng, đơn vị và nguồn. Không thể chỉ lưu danh sách productId rồi mất lượng từng dòng. Dòng hàng có thể là collection riêng hoặc phần `items` có ID ổn định; phương án nào cũng cần duyệt.

`User.Roles` trong ERD chưa diễn đạt rõ quy tắc một user chỉ có một role đã duyệt ở A01. `Location.CapacityLimit` có trong sơ đồ nhưng model hiện tại chưa khai báo trường sức chứa. Thiết kế B02 mới dùng kích thước hữu dụng của ô để tính cả m² và m³. Phải chặn xác nhận khi vượt một trong hai giới hạn.

## 3. Các khác biệt nguồn cần chốt theo nhóm

| Mã | Khác biệt | Cách xử lý trong đợt duyệt |
|---|---|---|
| Q01 | `docs_doan` và bộ `git_doc`/context trong repo không cùng mức cập nhật | Ghi rõ nguồn của mỗi đề xuất; không coi ngày sửa file hoặc code hiện có là tự động đúng nghiệp vụ |
| Q02 | Report 3 bản text tại `docs_doan` có 108 UC, trong khi context BE ghi 111 UC, 97 active/14 retired | Dùng danh mục chức năng để rà bao phủ; xác nhận phần thay đổi trước thiết kế phụ thuộc |
| Q03 | Phạm vi giá bán, hóa đơn, xác nhận tiền ngoài và hoàn trả | Đã chốt giá trên SO và hóa đơn tổng hợp trong WMSD, hiển thị lượng xuất và tính tiền theo lượng khách nhận. H17 v0.1 đã duyệt. Sales xác nhận đủ tiền ngoài sau giao hàng để hoàn thành SO. Hồ sơ hoàn trả duyệt riêng. [H37](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md). |
| Q04 | Số đợt xuất và số lần nhận trong BF04 | Một TR → 0..n phiếu xuất, mỗi phiếu xuất → 0..n phiếu nhận. Theo dõi lượng duyệt và lượng còn đang chuyển trên đúng dòng chứng từ nguồn. |
| Q05 | Bản cũ có TR/Owner cho chuyển nội kho; BF03 mới chỉ Create TO → Confirm TO | Đề xuất theo BF03 mới: TO nội kho không cần TR/Owner; vẫn trình từng bảng/trường để duyệt |
| Q06 | BF04 xác nhận picking đồng thời ghi xuất và nhận hàng lỗi vào khu cách ly ở kho đích | H09–H11 đã duyệt cách ghi xuất, nhận và lưu bàn giao trong phiếu xuất. Cấu trúc hồ sơ xử lý lỗi và chênh lệch được hỏi riêng. |
| Q07 | Luồng khách trả thường, ngoại lệ và trả NCC khác nhau giữa tài liệu cũ và context mới | Đã chọn UC-71 bản BE cho H27. Sales Staff quyết định ca thường sau kiểm, Store Owner quyết định ngoại lệ đủ căn cứ và khác người đề xuất. H28 v0.2 đã chốt cửa hàng được nhận sở hữu hàng lỗi nhà sản xuất khi Owner duyệt, nhập khu cách ly và chặn xuất bán. [H27, E01 v0.1 và H28 v0.2](24_Duyet_khach_tra_hang_sau_khi_nhan.md). [H29–H31 v0.1](26_Duyet_yeu_cau_xuat_tra_va_xac_nhan_nha_cung_cap.md) đã duyệt theo BF-08 bản BE. Accountant xác minh thỏa thuận, đối chiếu và đóng phần kho; Warehouse Staff xác nhận thực xuất. |
| Q08 | SQL tham chiếu có nhiều bảng; Mongo gộp nhiều quan hệ và subtype | Không chuyển 1 bảng SQL thành 1 collection máy móc; duyệt nghiệp vụ trước, cấu trúc vật lý sau |
| Q09 — ĐÃ CHỐT | A02 mới cho Admin tạo role; A03 v0.1 trước đây giới hạn năm mã | Đã chốt theo quyền Admin tick, bỏ allowedRoleCodes, không thêm roleGroup/allowedRoleGroups; A02/A03 hoàn tất duyệt cấu trúc |

Trong lượt này chưa kiểm thử đầy đủ API/UI, chưa xác nhận tất cả dữ liệu cũ hợp lệ và chưa thiết kế xong migration. Các nhận xét về hiện trạng dựa trên nguồn cụ thể, không phải tuyên bố toàn bộ dự án đã đạt nghiệm thu.

## 4. Cách đặt tên và lưu chú thích đề xuất

- Collection dùng tên tiếng Anh dễ đọc, số nhiều và `snake_case`. Trường dùng `camelCase` để phù hợp code. Ví dụ `warehouse_locations` là bảng ô/vị trí B02 và `product_batches` là bảng lô B05, cả hai tên đã duyệt.
- Tên đã rõ giữ lại: `users`, `roles`, `permissions`, `products`, `warehouses`.
- Mỗi bảng có tên tiếng Việt, mô tả một bản ghi, ví dụ, bảng trường, quan hệ và các quy tắc nghiệp vụ.
- Phân biệt **lô sản phẩm** với **vị trí/ô kho**; không dùng chung từ Lot cho cả hai.
- Phân biệt phiếu nguồn, thao tác dự kiến, xác nhận thực hiện và lịch sử tồn. Gộp UI/UC không có nghĩa được xóa các mốc dữ liệu cần truy vết.
- Một thao tác trên swimlane không tự trở thành một bảng. Ngược lại, bảng kỹ thuật không bắt buộc có màn hình nhập tay.
- Không đánh dấu đã duyệt vì người dùng chưa phản hồi. Đổi tên, gộp, nhúng hoặc loại bỏ bảng đều cần xác nhận.

Đây là quy ước đề xuất cho hồ sơ mới, chưa áp vào ứng dụng. Cách lưu MongoDB sẽ được giải thích bằng ý nghĩa nghiệp vụ trước khi đi vào kiểu dữ liệu kỹ thuật.

## 5. Hồ sơ để mở theo thứ tự

1. [Danh mục toàn bộ dữ liệu cần duyệt](01_Danh_muc_duyet.md): 40 collection và 36 loại hồ sơ hiện có, ý nghĩa và điểm cần hỏi.
2. [Phiếu A01–A03: tài khoản, vai trò, quyền](02_Duyet_tai_khoan_va_phan_quyen.md): đã duyệt; giữ lịch sử nội dung cũ và các câu trả lời mới.
3. [Phụ lục cấu trúc DB hiện tại](03_Cau_truc_DB_hien_tai.md): field/schema/index và số lượng quan sát, chưa phải schema mới.
4. [Nhật ký quyết định](04_Nhat_ky_duyet.md): lưu câu trả lời và phạm vi đã chốt của từng bảng.
5. [Phiếu B01–B03](05_Duyet_kho_vi_tri_don_vi_tinh.md). Kho/ô đã duyệt; B03 đã bỏ bảng đơn vị riêng.
6. [Phiếu B04–B06](06_Nhap_san_pham_lo_va_quy_cach.md). B04/B05 đã duyệt; B04 giữ đơn vị gốc trực tiếp, B06 đã bỏ theo quyết định mới.
7. [Kết quả B07–B08](07_Duyet_nguong_ton_va_doi_tac.md). Đã duyệt [B08A · khách hàng](08A_Khach_hang.md) v0.3 và [B08B · nhà cung cấp](08B_Nha_cung_cap.md) v0.1. [B08C · đội nội bộ](08C_Don_vi_van_chuyen.md) v0.4 đã ghi quyền Store Owner và Warehouse Staff tạo/sửa, Store Owner ngừng/kích hoạt lại.
8. [Phiếu C01–C02](09_Duyet_diem_ton_va_so_du.md). C01 v0.1 và C02 v0.2 đã duyệt: điểm theo dõi và số dư theo lô, trạng thái, chủ sở hữu.
9. [Phiếu C03–C04](10_Duyet_giao_dich_va_lich_su_ton.md). C03 v0.1 và C04 v0.1 đã duyệt: lần ghi nhận thành công và chi tiết tăng/giảm, đối chiếu và xử lý gửi lại.
10. [Phiếu C05–C06](11_Duyet_giu_hang_va_nguon_cung.md). C05 v0.1 và C06 v0.1 đã duyệt riêng: giữ lượng hàng thực và gắn nguồn dự kiến với nhu cầu, có ví dụ chống tính trùng.
11. [Phiếu C07–C08](12_Duyet_chong_hang_va_dong_goi_thuc_te.md). C07 v0.1 và C08 v0.1 đã duyệt riêng: diện tích/kích thước chồng và hàng nằm trong chồng; dữ liệu thực hiện kiểm sức chứa B02.
12. [Phiếu H01–H02](13_Duyet_yeu_cau_bo_sung_va_don_mua.md). H02 v0.1 đã duyệt; đơn vị/quy đổi chuyển lên dòng theo quyết định mới. H01 vẫn chờ duyệt.
13. [Quyết định bỏ UOM](14_Bo_UOM_va_luu_quy_doi_tren_dong.md). Loại B03/B06 khỏi thiết kế; giữ lượng gốc, hệ số trên dòng và quy cách thực tế cho kiểm sức chứa.
14. [Phiếu H03–H05](15_Duyet_hang_den_kiem_nhan_va_phieu_nhap.md). H03 v0.1, H04 v0.1 và H05 v0.1 đã duyệt riêng: lần hàng đến, kết quả kiểm nhận và phiếu nhập sở hữu. Dùng quy đổi trực tiếp trên dòng.
15. [Phiếu H06–H08](16_Duyet_lenh_va_yeu_cau_chuyen_kho.md). Đã duyệt cả ba bảng v0.1. Phiếu mở giữ hạn mức TR và mỗi yêu cầu nội kho có hàng cần di chuyển sinh một TO.
16. [Phiếu H09–H11](17_Duyet_phieu_xuat_nhan_va_ban_giao_chuyen_kho.md). H09 và H10 đã duyệt. H11 đã duyệt cho BF04, nhúng từng lần bàn giao trong phiếu xuất chuyển kho.
17. [Phiếu H12–H14](18_Duyet_don_ban_yeu_cau_xuat_va_lenh_giao.md). H12 v0.2 và H13/H14 v0.1 đã duyệt, gồm giá bán và quy đổi được lưu theo từng dòng SO.
18. [Phiếu H15, H16 và H37](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md). H15, H16 và H37 v0.1 đã duyệt riêng.
19. [H17 · Xác nhận đã nhận đủ tiền ngoài WMSD](20_Duyet_xac_nhan_tien_ngoai.md). Đã duyệt H17 v0.1, SO ở Đã giao cho đến khi Sales xác nhận.
20. [H18–H20 · Phát hiện, duyệt xử lý và hủy hàng lỗi](21_Duyet_hang_loi_phuong_an_va_phieu_huy.md). H18, H19 và H20 v0.1 đã duyệt riêng.
21. [H23, H24 và E03 · Giao không thành, nhận về, giao bù](22_Duyet_giao_that_bai_nhan_ve_va_giao_bu.md). H23, H24 và E03 v0.1 đã duyệt riêng.
22. [E04 và E05 · Đổi lệnh giao bù và hủy phần còn lại của đơn bán](23_Duyet_doi_lenh_giao_bu_va_huy_phan_don.md). Cả hai bảng đã duyệt v0.1.
23. [H27, E01 v0.1 và H28 v0.2](24_Duyet_khach_tra_hang_sau_khi_nhan.md) · Cả ba mục đã duyệt.
24. [E02, H33 và H34 v0.1](25_Duyet_han_muc_tra_va_hang_giu_ho.md) · Lượng còn được đề nghị trả, phiếu nhận giữ hộ và phiếu bàn giao lại. Ba bảng đã duyệt riêng.
25. [H29–H31 v0.1](26_Duyet_yeu_cau_xuat_tra_va_xac_nhan_nha_cung_cap.md) · Yêu cầu và thỏa thuận, phiếu xuất trả, xác nhận NCC thực nhận. Cả ba bảng đã duyệt riêng.
26. [E06, H26 và H32 v0.1](27_Duyet_chan_hang_doi_chat_luong_va_chenh_lech.md) · Chặn sử dụng, đổi chất lượng và hồ sơ chênh lệch. Cả ba đã duyệt.
27. [H21, F01 và F03 v0.1](28_Duyet_dot_kiem_ke_moc_ton_va_khoa_vi_tri.md) · Đợt kiểm kê, mốc tồn và khóa vị trí. Cả ba đã duyệt.
28. [F02, H25 và H22 v0.1](29_Duyet_ket_qua_dem_phuong_an_va_dieu_chinh.md) · Các lần đếm, phương án xử lý và phiếu điều chỉnh số lượng. Cả ba đã duyệt.
29. [H35 và H36 v0.1](30_Duyet_dao_giao_dich_va_ton_dau_ky.md) · H36 đã duyệt ngày 02/11/2026; H35 còn chờ. H01 cũng còn chờ sau giải thích.
30. [D01 v0.1](31_Duyet_cach_to_chuc_ho_so_nghiep_vu.md) · Đã duyệt nơi lưu riêng theo nghiệp vụ, giữ phần nhúng; không thêm một bảng đầu phiếu chung trùng dữ liệu.
31. [D02–D04 v0.1](32_Duyet_dong_hang_va_lien_ket_chung_tu.md) · Đã duyệt riêng dòng hàng nhúng, tham chiếu phiếu và tham chiếu lượng theo dòng; thay các bảng dòng/liên kết chung.
32. [D05–D06 v0.1](33_Duyet_lich_su_quyet_dinh_va_tep_dinh_kem.md) · Cả hai đã duyệt. D07/D08 để mở, chưa chọn người xác minh đơn nguồn mới; người dùng cho biết phần này do người khác phụ trách.
33. [G01–G03 v0.1](34_Duyet_thong_bao_nhat_ky_va_su_kien.md) · Thông báo, nhật ký thao tác và công việc sau khi lưu. Đã duyệt riêng cả ba mục.
34. [G04–G06 v0.1](35_Duyet_chong_lap_thao_tac_va_kiem_soat_dong_thoi.md) · Kết quả thao tác chống lặp và kiểm soát dùng chung số lượng. Đã duyệt riêng cả ba mục.

**Tiến độ duyệt thiết kế ngày 02/11/2026:** 75/79 mục còn áp dụng đã duyệt; hai mục B03/B06 đã bỏ nên không tính vào mẫu số. Bốn mục còn mở là D07, D08, H01 và H35. Đây là số mục rà soát thiết kế, không phải số collection đã tạo hay phần trăm triển khai DB.

Sau khi đủ các nhóm được duyệt, bước tiếp theo là ERD mới, từ điển dữ liệu đã chốt, ánh xạ cũ–mới và kế hoạch chuyển đổi. Việc tạo DB trống mới, chuyển dữ liệu lịch sử hoặc bỏ dữ liệu thử nghiệm sẽ được hỏi riêng; yêu cầu thiết kế lại không được hiểu là cho phép xóa DB đang dùng.

## 6. Nguồn đã đối chiếu

- `E:/Doan/docs_doan/docs/03_thiet_ke/ERD.drawio` — nhãn entity/field và quan hệ trong XML trang hiện tại.
- `E:/Doan/docs_doan/docs/01_bao_cao/WMSD_Report1_Fix.docx.txt` — FE, scope, giới hạn.
- `E:/Doan/docs_doan/docs/01_bao_cao/WMSD_Report3_Fix.docx.txt` — UC và phân quyền.
- `E:/Doan/docs_doan/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md` và step descriptions chuyển kho — quy trình, nhánh và điểm khác biệt.
- `E:/Doan/docs_doan/docs/03_thiet_ke/WMSD_Thiet_ke_he_thong_chi_tiet.md` và `de_xuat_database_design_VI.md` — thiết kế tham chiếu, không mặc định là phiên bản mới nhất.
- `E:/Doan/CODE/BE/building-material-management/context.md`, `src/models`, `src/routes.js`, service phân quyền — baseline và cấu trúc thực; các phần context [TK] chỉ là dự kiến.
- MongoDB `sep490` tại thời điểm snapshot trong phụ lục 03. Thông tin kết nối không được lưu trong các tài liệu này.
