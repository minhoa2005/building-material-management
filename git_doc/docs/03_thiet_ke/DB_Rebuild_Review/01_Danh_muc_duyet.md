# Danh mục dữ liệu cần duyệt

**Quyết định mới 06/11/2026:** [Sản phẩm và lô v6](39_San_pham_va_lo_dang_chot.md) thay các trường nominalSize/tone/calibre bên dưới: sản phẩm có dài/rộng/cao và màu, khác màu khác ID; lô có số viên/thùng cố định và kích thước ngoài thực tế. Các phần duyệt cũ giữ để truy vết, không phải cấu trúc hiện hành của B04/B05.

**Hiện hành:** [Gộp tiếp 5 bảng ngày 06/11/2026](37_Gop_them_5_bang.md), còn 58 collection. Cách tách các bảng được thay thế là lịch sử; quyền và kết quả nghiệp vụ vẫn giữ.


**Cập nhật 06/11/2026:** Cách tách bảng trong phiếu dưới đây là lịch sử thiết kế. Người dùng đã duyệt [gộp 10 bảng](36_Gop_10_bang.md): ngưỡng, kiểm trả, xác nhận tiền/NCC và giao bù nhúng vào phiếu cha; bỏ chồng hàng, quy cách hiện tồn vào số dư. Quy tắc nghiệp vụ vẫn giữ; D07/D08 còn chờ.


**Tiến độ sau phản hồi H01/H35 ngày 02/11/2026:** đã duyệt 77/79 mục còn áp dụng. B03/B06 đã bỏ, không tính vào 79. Còn D07 và D08. Đây là số mục duyệt thiết kế, không phải số collection vật lý đã tạo.

**Cập nhật 05/11/2026:** Người dùng bỏ chức năng quản lý danh mục đội xe; trên từng lần bàn giao chỉ lưu biển số xe. Quyết định này thay thế B08C và phần trường đội xe của H11. Bảng `delivery_teams`, `carrierId` và `teamNameAtHandover` không thuộc schema mới. Các quyết định B08C cũ được giữ ở phần lịch sử.

**Kiểm tra hiện trạng 31/10/2026; cập nhật thiết kế 02/11/2026.** B03 (UOM) và B06 (UOM Version) đã bỏ theo yêu cầu mới; quy đổi nằm trên dòng phiếu. A01–A03, B01/B02/B04/B05/B07, B08A–B08B, C01–C08, H02–H10 và H11 (phần BF04) đã duyệt theo phiên bản/quyết định trong bảng; B08C cũ đã bị thay thế ngày 05/11. H13–H27, H29–H34, D01–D06, E01–E06, F01–F03 và H36 v0.1 đã duyệt. H12 v0.2 và hóa đơn H37 v0.1 đã duyệt. H28 v0.2 đã duyệt. H01 và H35 v0.1 đã duyệt riêng ngày 02/11/2026; G01–G06 v0.1 cũng đã duyệt. D07/D08 để mở cần người phụ trách làm rõ nghiệp vụ xác minh nguồn mới. [Quyết định bỏ UOM](14_Bo_UOM_va_luu_quy_doi_tren_dong.md).

Đây là danh mục kiểm soát độ đầy đủ, chưa phải danh sách collection mới đã chốt. 40 collection hiện có và 36 loại hồ sơ bên trong không được cộng thành 76 bảng mới. Các dòng con, bảng liên kết, lịch sử và cơ chế kỹ thuật cũng phải được trình bày và duyệt; nếu gộp/nhúng/bỏ thì ghi rõ thay thế bằng gì.

Tên tiếng Anh là tên đề xuất trong DB; tên tiếng Việt dùng giải thích. Tên đã rõ như users, products, warehouses được giữ. Tên mới chưa được áp vào MongoDB hoặc source code.

## 1. Thứ tự trao đổi

| Lượt | Nội dung | Đầu ra cần duyệt |
|---|---|---|
| 1 | Tài khoản, vai trò, quyền | A01–A03 đã duyệt; role mới theo quyền được Admin tick |
| 2 | Kho, ô kho, sản phẩm, lô, ngưỡng, đối tác | B03/B06 đã bỏ; đơn vị gốc ở sản phẩm, quy đổi ở dòng phiếu. Các bảng còn lại đã duyệt/chốt |
| 3 | Tồn thực, khả dụng, đang chuyển, giữ hàng, nguồn cung | C01–C08 đã duyệt; gồm giữ hàng, nguồn dự kiến và chồng hàng/đóng gói thực tế |
| 4 | Mua hàng và kiểm nhận | H01–H05 v0.1 đã duyệt, đơn vị/quy đổi theo phiếu 14; H01 được duyệt sau giải thích |
| 5 | BF03 và BF04 | H06–H08 v0.1 đã duyệt. Đã chốt TR → nhiều phiếu xuất và một phiếu xuất → nhiều phiếu nhận. H09/H10 v0.1 và H11 v0.1 cho BF04 đã duyệt. |
| 6 | SO, xuất và giao | [H12 v0.2, H13/H14 v0.1](18_Duyet_don_ban_yeu_cau_xuat_va_lenh_giao.md). H12–H14 đã duyệt. [H15, H16 và H37](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md) đã duyệt v0.1. [H17](20_Duyet_xac_nhan_tien_ngoai.md) v0.1 đã duyệt. Hoàn thành SO sau xác nhận đủ tiền ngoài của Sales. |
| 7 | Hàng lỗi, khách trả, giao thất bại, trả NCC | [H18–H20 v0.1](21_Duyet_hang_loi_phuong_an_va_phieu_huy.md) đã duyệt. [H23, H24 và E03 v0.1](22_Duyet_giao_that_bai_nhan_ve_va_giao_bu.md) đã duyệt. [E04 và E05 v0.1](23_Duyet_doi_lenh_giao_bu_va_huy_phan_don.md) đã duyệt. [H27, E01 v0.1 và H28 v0.2](24_Duyet_khach_tra_hang_sau_khi_nhan.md) · Cả ba đã duyệt. [E02, H33 và H34 v0.1](25_Duyet_han_muc_tra_va_hang_giu_ho.md) đã duyệt. [H29–H31 v0.1](26_Duyet_yeu_cau_xuat_tra_va_xac_nhan_nha_cung_cap.md) đã duyệt theo BF-08 bản BE. [E06, H26 và H32 v0.1](27_Duyet_chan_hang_doi_chat_luong_va_chenh_lech.md) đã duyệt riêng. |
| 8 | Kiểm kê và điều chỉnh | [H21, F01 và F03 v0.1](28_Duyet_dot_kiem_ke_moc_ton_va_khoa_vi_tri.md) và [F02, H25, H22 v0.1](29_Duyet_ket_qua_dem_phuong_an_va_dieu_chinh.md) đã duyệt riêng. |
| 9 | Hồ sơ dùng chung và hỗ trợ | [H35 và H36 v0.1 đã duyệt](30_Duyet_dao_giao_dich_va_ton_dau_ky.md). [D01](31_Duyet_cach_to_chuc_ho_so_nghiep_vu.md), [D02–D04](32_Duyet_dong_hang_va_lien_ket_chung_tu.md), [D05/D06 v0.1](33_Duyet_lich_su_quyet_dinh_va_tep_dinh_kem.md), [G01–G03 v0.1](34_Duyet_thong_bao_nhat_ky_va_su_kien.md) và [G04–G06 v0.1](35_Duyet_chong_lap_thao_tac_va_kiem_soat_dong_thoi.md) đã duyệt. D07/D08 còn mở cho người phụ trách nghiệp vụ. |
| 10 | Đối chiếu toàn hệ thống và chuyển đổi | ERD, cardinality, từ điển dữ liệu, ánh xạ cũ–mới và kế hoạch chuyển đổi riêng |

## 2. Toàn bộ collection đang có

Số bản ghi là ước lượng tại thời điểm đọc DB; 0 không chứng minh bảng thừa. Mỗi mục có phần giải thích và vấn đề cần hỏi ở mục 4.

| Mã duyệt | Collection hiện tại | Tên đề xuất / hướng xử lý | Ý nghĩa | Nhóm | Trạng thái |
|---|---|---|---|---|---|
| A01 | `users` | `users` | Tài khoản nhân viên | FE-09 | ĐÃ DUYỆT v0.1 |
| A02 | `roles` | `roles` | Vai trò có sẵn và do Admin tạo | FE-09 | ĐÃ DUYỆT v0.2 |
| A03 | `permissions` | `permissions` | Danh mục quyền thao tác | FE-09 | ĐÃ DUYỆT v0.2 |
| B01 | `warehouses` | `warehouses` | Kho hàng | FE-04 | ĐÃ DUYỆT v0.1 + bổ sung kích thước v0.3 |
| B02 | `locations` | `warehouse_locations` | Vị trí và sức chứa | FE-04 | ĐÃ DUYỆT v0.3 |
| B03 | `uoms` | Bỏ collection riêng; đơn vị gốc trên products, đơn vị nhập trên dòng | Đơn vị tính | FE-02 | ĐÃ BỎ THEO YÊU CẦU 01/11/2026 |
| B04 | `products` | `products` | Sản phẩm theo SKU của hãng, đơn vị gốc lưu trực tiếp | FE-02 | ĐÃ DUYỆT v0.3 + quyết định bỏ UOM |
| B05 | `lots` | `product_batches` | Lô theo mã nhà sản xuất in trên thùng | FE-02 | ĐÃ DUYỆT v0.3 |
| B06 | `product_uom_versions` | Bỏ collection riêng; quy đổi và quy cách giữ trên dòng | Quy đổi đơn vị | Nhiều FE | ĐÃ BỎ THEO YÊU CẦU 01/11/2026 |
| B07 | `product_warehouse_policies` | `stock_thresholds` | Ngưỡng tồn theo sản phẩm và kho | FE-01/02 | ĐÃ DUYỆT v0.1 |
| B08A | `parties` (CUSTOMER) | `customers` | Mã khách do WMSD sinh, tên và điện thoại | FE-02/06/07 | ĐÃ DUYỆT v0.3 |
| B08B | `parties` (SUPPLIER) | `suppliers` | Danh mục nhà cung cấp | FE-02/03/07 | ĐÃ DUYỆT v0.1 |
| B08C | `parties` (CARRIER), phiếu bàn giao | Bỏ danh mục đội xe; `vehiclePlate` trên từng bàn giao | Ghi biển số xe thực tế khi có phương tiện | Bàn giao/FE-06 | B08C cũ ĐÃ BỊ THAY THẾ 05/11/2026 |
| C01 | `stock_accounts` | `stock_holding_points` | Điểm theo dõi tồn | FE-04/05 | ĐÃ DUYỆT v0.1 |
| C02 | `stock_balances` | `inventory_balances` | Số dư tồn kho | FE-04 | ĐÃ DUYỆT v0.2 |
| C03 | `posting_batches` | `stock_transactions` | Lần ghi nhận biến động tồn | FE-03/04/05/06/07/08 | ĐÃ DUYỆT v0.1 |
| C04 | `stock_movements` | `stock_movements` | Chi tiết biến động tồn | FE-09 | ĐÃ DUYỆT v0.1 |
| C05 | `reservations` | `stock_reservations` | Giữ hàng cho nhu cầu | FE-04/05/06 | ĐÃ DUYỆT v0.1 |
| C06 | `demand_supply_allocations` | `supply_allocations` | Gắn nguồn cung với nhu cầu | FE-01/05/06 | ĐÃ DUYỆT v0.1 |
| D01 | `business_documents` | Nơi lưu riêng theo nghiệp vụ đã duyệt, giữ phần nhúng | Thay cách gộp chung nhiều loại đầu phiếu; không thêm bảng D01 | Tất cả BF | [D01 v0.1](31_Duyet_cach_to_chuc_ho_so_nghiep_vu.md) **ĐÃ DUYỆT** |
| D02 | `document_lines` | Nhúng `items[]` theo phiếu, mỗi dòng có ID cố định | Dòng hàng của hồ sơ, thay bảng dòng chung | Tất cả BF | [D02 v0.1](32_Duyet_dong_hang_va_lien_ket_chung_tu.md) **ĐÃ DUYỆT** |
| D03 | `document_links` | Tham chiếu trên phiếu hoặc suy từ dòng; không tạo bảng quan hệ chung trùng dữ liệu | Quan hệ giữa hồ sơ | Tất cả BF | [D03 v0.1](32_Duyet_dong_hang_va_lien_ket_chung_tu.md) **ĐÃ DUYỆT** |
| D04 | `line_links` | Tham chiếu dòng/phiên bản và lượng trên dòng xử lý hoặc bảng nghiệp vụ đã duyệt | Quan hệ và lượng giữa dòng nguồn/đích | Tất cả BF | [D04 v0.1](32_Duyet_dong_hang_va_lien_ket_chung_tu.md) **ĐÃ DUYỆT** |
| D05 | `approvals` | `approval_history` | Lịch sử quyết định đúng hồ sơ/phiên bản/dòng/lượng | FE-01/05/07/08 | [D05 v0.1](33_Duyet_lich_su_quyet_dinh_va_tep_dinh_kem.md) **ĐÃ DUYỆT** |
| D06 | `evidence_refs` | `attachments` | Tệp bằng chứng, quyền truy cập và bản đã dùng | FE-03/05/06/07/08/09 | [D06 v0.1](33_Duyet_lich_su_quyet_dinh_va_tep_dinh_kem.md) **ĐÃ DUYỆT** |
| D07 | `external_references` | `external_documents` | Chứng từ nguồn bên ngoài | FE-06/07/09 | **CHƯA DUYỆT**; [người dùng chưa rõ, cần người phụ trách nghiệp vụ](33_Duyet_lich_su_quyet_dinh_va_tep_dinh_kem.md) xác nhận người/thời điểm xác minh nguồn mới |
| D08 | `external_reference_lines` | `external_document_items` | Dòng hàng chứng từ ngoài | FE-06/07/09 | **CHƯA DUYỆT**; để mở cùng D07, không tự chốt cấu trúc nguồn/dòng phụ thuộc |
| E01 | `customer_return_assessments` | `return_inspections` | Đánh giá điều kiện trả hàng | FE-07 | [E01 v0.1](24_Duyet_khach_tra_hang_sau_khi_nhan.md) **ĐÃ DUYỆT** |
| E02 | `return_source_claims` | `return_quantity_claims` | Lượng nguồn đang đề nghị nhận lại | FE-07 | [E02 v0.1](25_Duyet_han_muc_tra_va_hang_giu_ho.md) **ĐÃ DUYỆT** |
| E03 | `demand_reopenings` | `delivery_demand_reopenings` | Mở lại lượng cần giao | FE-06/07 | [E03 v0.1](22_Duyet_giao_that_bai_nhan_ve_va_giao_bu.md) **ĐÃ DUYỆT** |
| E04 | `od_commitment_transfers` | `delivery_commitment_transfers` | Chuyển lượng cam kết giữa lệnh giao | FE-06/07 | [E04 v0.1](23_Duyet_doi_lenh_giao_bu_va_huy_phan_don.md) **ĐÃ DUYỆT** |
| E05 | `sales_order_cancellations` | `sales_order_cancellations` | Lịch sử hủy lượng đơn bán | FE-06 | [E05 v0.1](23_Duyet_doi_lenh_giao_bu_va_huy_phan_don.md) **ĐÃ DUYỆT** |
| E06 | `defect_holds` | `stock_holds` | Khóa sử dụng hàng có vấn đề | FE-07/08 | [E06 v0.1](27_Duyet_chan_hang_doi_chat_luong_va_chenh_lech.md) **ĐÃ DUYỆT** |
| F01 | `stocktake_snapshots` | `stocktake_snapshots` | Tồn tại thời điểm khóa kiểm kê | FE-08 | [F01 v0.1](28_Duyet_dot_kiem_ke_moc_ton_va_khoa_vi_tri.md) **ĐÃ DUYỆT** |
| F02 | `count_attempts` | `stocktake_counts` | Các lần đếm kiểm kê | FE-08 | [F02 v0.1](29_Duyet_ket_qua_dem_phuong_an_va_dieu_chinh.md) **ĐÃ DUYỆT** |
| F03 | `location_locks` | `stocktake_location_locks` | Vị trí đang khóa kiểm kê | FE-08 | [F03 v0.1](28_Duyet_dot_kiem_ke_moc_ton_va_khoa_vi_tri.md) **ĐÃ DUYỆT** |
| G01 | `notifications` | `notifications` | Thông báo theo người, quyền nguồn, trạng thái đọc và email | FE-01/06/08/09 | [G01 v0.1](34_Duyet_thong_bao_nhat_ky_va_su_kien.md) **ĐÃ DUYỆT** |
| G02 | `audit_events` | `audit_logs` | Ai làm gì, kết quả và thay đổi trước/sau theo quyền | FE-09 | [G02 v0.1](34_Duyet_thong_bao_nhat_ky_va_su_kien.md) **ĐÃ DUYỆT** |
| G03 | `outbox_events` | `system_events` | Công việc sau khi nguồn lưu thành công, thử lại không lặp nghiệp vụ | Hỗ trợ FE-09 | [G03 v0.1](34_Duyet_thong_bao_nhat_ky_va_su_kien.md) **ĐÃ DUYỆT** |
| G04 | `business_operations` | `operation_records` | Kết quả thao tác chống thực hiện trùng | Hỗ trợ nhiều FE | [G04 v0.1](35_Duyet_chong_lap_thao_tac_va_kiem_soat_dong_thoi.md) **ĐÃ DUYỆT** |
| G05 | `replenishment_planning_guards` | `replenishment_locks` | Kiểm soát lập bổ sung đồng thời theo kho/sản phẩm | Hỗ trợ FE-01 | [G05 v0.1](35_Duyet_chong_lap_thao_tac_va_kiem_soat_dong_thoi.md) **ĐÃ DUYỆT** |
| G06 | `return_source_guards` | `return_source_locks` | Kiểm soát dùng chung nguồn giao/nhận | Hỗ trợ FE-07 | [G06 v0.1](35_Duyet_chong_lap_thao_tac_va_kiem_soat_dong_thoi.md) **ĐÃ DUYỆT** |

### 2.1. Dữ liệu bổ sung từ yêu cầu sức chứa

Các bảng sau đã duyệt thiết kế cho yêu cầu sức chứa B02; không phải collection quan sát được trong snapshot 40 collection hiện tại và chưa được tạo trong DB.

| Mã duyệt | Tên đề xuất | Ý nghĩa | Căn cứ | Trạng thái |
|---|---|---|---|---|
| C07 | `storage_stacks` | Chồng/cụm hàng chiếm diện tích và thể tích tại một ô | B02, dữ liệu đo thực tế | ĐÃ DUYỆT v0.1 |
| C08 | `storage_stack_items` | Hàng trong chồng, giữ quy cách thực tế trên dòng | C02, C07, dòng nguồn | ĐÃ DUYỆT v0.1 + quyết định bỏ UOM |

[Phiếu C07–C08](12_Duyet_chong_hang_va_dong_goi_thuc_te.md) giải thích trường, quan hệ, quyền, cách đo/tính và ví dụ. Không cộng C08 lần nữa vào số lượng tồn C02.

## 3. Các hồ sơ nằm trong business_documents phải duyệt riêng về nghiệp vụ

Các tên sau chỉ là ứng viên nếu tách collection. Ví dụ TO có thể giữ chung picking/putaway/relocate, còn bàn giao có thể là phần dữ liệu của phiếu xuất. Cách gộp/tách sẽ được hỏi, không tự tạo một bảng cho mỗi bước của swimlane.

| Mã | Loại hiện tại | Tên đề xuất | Ý nghĩa và dữ liệu cần giữ | Điểm cần trao đổi |
|---|---|---|---|---|
| H01 | `REPLENISHMENT` | `replenishment_requests` — Yêu cầu bổ sung | Một kho, nguồn nhu cầu, bản gửi/duyệt và các dòng hàng nhúng có ID ổn định. | Người dùng “Duyệt H01 v0.1” sau giải thích. [H01 v0.1](13_Duyet_yeu_cau_bo_sung_va_don_mua.md) **ĐÃ DUYỆT** đầu phiếu, dòng nhúng, nguồn nhu cầu, bản duyệt và quyền. |
| H02 | `PO` | `purchase_orders` — Đơn mua hàng | Một RR, một NCC, một kho; dòng hàng nhúng, giá mua, lịch và nhiều phiếu nhập. | Người dùng “Duyệt H02 v0.1”. [H02 v0.1](13_Duyet_yeu_cau_bo_sung_va_don_mua.md) **ĐÃ DUYỆT**, gồm giá chỉ Accountant/Owner xem. |
| H03 | `ARRIVAL` | `goods_arrivals` — Thông tin hàng đến | Một lần NCC giao theo PO; dòng thực đến, thời gian và bằng chứng, kể cả không nhận sở hữu. | [H03 v0.1](15_Duyet_hang_den_kiem_nhan_va_phieu_nhap.md) **ĐÃ DUYỆT** đầu hồ sơ/dòng/quyền và xử lý lượng vật lý. |
| H04 | `INSPECTION` | `goods_inspections` — Biên bản kiểm nhận | Một lần kiểm phần hàng đến; kết luận theo lượng, chất lượng, sở hữu; giữ lịch sử kiểm lại. | [H04 v0.1](15_Duyet_hang_den_kiem_nhan_va_phieu_nhap.md) **ĐÃ DUYỆT** cấu trúc phục vụ nhập mua. Dùng lại cho chuyển/trả sẽ đối chiếu sau. |
| H05 | `GR_PURCHASE` | `purchase_receipts` — Phiếu nhập mua hàng | Nhận sở hữu từ một PO/lần hàng đến theo kết quả kiểm; quy đổi ngay trên dòng. | [H05 v0.1](15_Duyet_hang_den_kiem_nhan_va_phieu_nhap.md) **ĐÃ DUYỆT** quyền và ghi tồn một lần, chuyển từ giữ hộ không nhập vật lý trùng. |
| H06 | `TO` | `transfer_orders` — Lệnh thao tác nội kho | Chuyển ô trong cùng kho, lấy hàng hoặc xếp hàng. Mỗi TO xác nhận trọn lệnh một lần. | [H06 v0.1](16_Duyet_lenh_va_yeu_cau_chuyen_kho.md) **ĐÃ DUYỆT** cấu trúc, quyền và cách ghi từng loại TO. |
| H07 | `TRANSFER_REQUEST` | `warehouse_transfer_requests` — Yêu cầu chuyển giữa kho | Một TR đã duyệt có thể có nhiều phiếu xuất. Tổng xuất mỗi dòng nằm trong lượng duyệt. | [H07 v0.1](16_Duyet_lenh_va_yeu_cau_chuyen_kho.md) **ĐÃ DUYỆT** cấu trúc, tiến độ và cách kiểm hạn mức. |
| H08 | `INTERNAL_TRANSFER_REQUIREMENT` | `internal_transfer_requirements` — Yêu cầu thao tác nội kho | Từ phiếu xuất hoặc phiếu nhận, sinh TO lấy hoặc xếp hàng. | [H08 v0.1](16_Duyet_lenh_va_yeu_cau_chuyen_kho.md) **ĐÃ DUYỆT** lưu riêng và sinh một TO cho mỗi yêu cầu có hàng cần di chuyển. |
| H09 | `TRANSFER_DISPATCH` | `transfer_dispatches` — Phiếu xuất điều chuyển | Mỗi phiếu thuộc một TR. Mỗi dòng truy về dòng TR được duyệt. | TR → 0..n phiếu xuất đã chốt. Xác nhận PICK TO đưa hàng qua tập kết và xuất đi cùng lần. [H09 v0.1](17_Duyet_phieu_xuat_nhan_va_ban_giao_chuyen_kho.md) **ĐÃ DUYỆT** cấu trúc và cách xác nhận xuất. |
| H10 | `MWTR` | `transfer_receipts` — Phiếu nhận điều chuyển | Một phiếu xuất có thể nhận nhiều lần. Mỗi phiếu nhận có mã, ngày, người và lượng thực nhận theo dòng xuất. | [H10 v0.1](17_Duyet_phieu_xuat_nhan_va_ban_giao_chuyen_kho.md) **ĐÃ DUYỆT** cấu trúc và kiểm trần lượng đang chuyển. |
| H11 | `HANDOVER` | BF04 nhúng `handovers[]` trong `transfer_dispatches` | Đội nội bộ, người giao/nhận, lượng theo dòng, thời điểm và bằng chứng khi xác nhận xuất. | [H11 v0.1](17_Duyet_phieu_xuat_nhan_va_ban_giao_chuyen_kho.md) **ĐÃ DUYỆT** cho BF04. Bàn giao xuất bán đã duyệt riêng tại H15/H16. |
| H12 | `SALES_ORDER` | `sales_orders` — Đơn bán | Sales nhập chứng từ nguồn, khách, sản phẩm, lượng và giá bán theo đơn vị bán trên từng dòng. | [H12 v0.2](18_Duyet_don_ban_yeu_cau_xuat_va_lenh_giao.md) **ĐÃ DUYỆT** cấu trúc, lưu phiên bản giá và quyền xem. |
| H13 | `ISSUE_REQUEST` | `warehouse_issue_requests` — Yêu cầu xuất cho đơn bán | Mỗi WIR lấy lượng từ từng dòng của một SO. Một SO có nhiều WIR. | [H13 v0.1](18_Duyet_don_ban_yeu_cau_xuat_va_lenh_giao.md) **ĐÃ DUYỆT** lưu riêng, quyền và hạn mức từng dòng. |
| H14 | `OUTBOUND_DELIVERY` | `delivery_orders` — Lệnh giao hàng | Một đợt của một WIR, một kho thực xuất. Lệnh có hiệu lực giữ phần hàng tương ứng. | [H14 v0.1](18_Duyet_don_ban_yeu_cau_xuat_va_lenh_giao.md) **ĐÃ DUYỆT** kế hoạch giao, xử lý lượng đã cam kết và mốc giữ hàng. |
| H15 | `GI_SALE` | `sales_goods_issues` — Phiếu xuất bán | Ghi kho, ngày xuất và lượng thực bàn giao theo dòng OD, lô và dòng SO làm nguồn giá. | [H15 v0.1](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md) **ĐÃ DUYỆT** nguồn xuất và cách lưu bàn giao của bán hàng. |
| H16 | `DELIVERY_CONFIRMATION` | `delivery_confirmations` — Xác nhận khách nhận hàng | Kho ghi người nhận, ảnh và lượng khách nhận từng dòng xuất. Lượng nhận hợp lệ là cơ sở tiền hóa đơn. | [H16 v0.1](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md) **ĐÃ DUYỆT** cấu trúc POD và trần lượng. |
| H17 | `PAYMENT_CONFIRMATION` | `external_payment_confirmations` — Xác nhận đã nhận đủ tiền bên ngoài | Sales Staff phụ trách xác nhận sau giao hàng, lưu phiên bản SO, người, giờ và căn cứ. | [H17 v0.1](20_Duyet_xac_nhan_tien_ngoai.md) **ĐÃ DUYỆT**. Lưu H17 và chuyển SO từ Đã giao sang Hoàn thành cùng lần. |
| H18 | `DEFECT_CASE` | `defect_reports` — Hồ sơ hàng lỗi | Nguồn phát hiện, kho/ô, lô, chủ hàng, lượng, dấu hiệu, lần kiểm và bằng chứng. | [H18 v0.1](21_Duyet_hang_loi_phuong_an_va_phieu_huy.md) **ĐÃ DUYỆT** sau giải thích về ghi sự cố, chặn phần nghi lỗi và kiểm lại. |
| H19 | `DISPOSITION` | `defect_resolution_plans` — Phương án xử lý hàng lỗi | Ghi phương án và quyết định theo dòng, hành động, lượng và phiên bản. | [H19 v0.1](21_Duyet_hang_loi_phuong_an_va_phieu_huy.md) **ĐÃ DUYỆT** sau giải thích về trả hết, hủy hết hoặc tách theo căn cứ thực tế. |
| H20 | `SCRAP` | `stock_scrap_records` — Phiếu hủy hàng | Căn cứ quyết định và bằng chứng thực hủy, kho/lô, lượng, người và thời điểm. | [H20 v0.1](21_Duyet_hang_loi_phuong_an_va_phieu_huy.md) **ĐÃ DUYỆT** ghi giảm một lần và theo dõi lượng còn được phép hủy. |
| H21 | `STOCKTAKE` | `stocktakes` — Đợt kiểm kê | Kế hoạch, phạm vi, người đếm, thời điểm khóa và trạng thái đợt. | [H21 v0.1](28_Duyet_dot_kiem_ke_moc_ton_va_khoa_vi_tri.md) **ĐÃ DUYỆT** phạm vi, phân công, thời điểm bắt đầu và tiến độ đợt. |
| H22 | `ADJUSTMENT` | `stock_adjustments` — Phiếu điều chỉnh số lượng | Tăng/giảm đúng chênh lệch được duyệt, gắn kiểm kê và giao dịch tồn. | [H22 v0.1](29_Duyet_ket_qua_dem_phuong_an_va_dieu_chinh.md) **ĐÃ DUYỆT**; chỉ sinh khi chốt có chênh lệch lượng thực, không tạo dòng 0. |
| H23 | `FAILED_DELIVERY` | `failed_deliveries` — Hồ sơ giao không thành | Ghi phần đã xuất nhưng khách chưa nhận, bằng chứng và lượng còn phải đối chiếu theo từng dòng xuất. | [H23 v0.1](22_Duyet_giao_that_bai_nhan_ve_va_giao_bu.md) **ĐÃ DUYỆT** cấu trúc, quyền và giới hạn chung với POD. |
| H24 | `GR_FAILED_DELIVERY` | `failed_delivery_receipts` — Phiếu nhận về | Mỗi lần thực nhận hàng giao không thành ghi lượng, lô, tình trạng và ô thực nhận. | [H24 v0.1](22_Duyet_giao_that_bai_nhan_ve_va_giao_bu.md) **ĐÃ DUYỆT** theo lượng và tình trạng từng lần thực nhận. |
| H25 | `ST_RESOLUTION` | `stocktake_resolution_plans` — Phương án xử lý chênh lệch kiểm kê | Đề xuất điều chỉnh lượng/đổi chất lượng/chuyển vị trí dựa trên lần đếm và phiên bản. | [H25 v0.1](29_Duyet_ket_qua_dem_phuong_an_va_dieu_chinh.md) **ĐÃ DUYỆT**; kho đề xuất/thực hiện, Owner khác người đề xuất duyệt, chốt thành công mới mở khóa. |
| H26 | `RECLASS` | `stock_quality_changes` — Phiếu đổi chất lượng tồn | Chuyển số lượng giữa hai trạng thái chất lượng và giữ tổng tồn. | [H26 v0.1](27_Duyet_chan_hang_doi_chat_luong_va_chenh_lech.md) **ĐÃ DUYỆT** quyền, nguồn quyết định và ghi hai nhóm chất lượng cùng lượng. |
| H27 | `CUSTOMER_RETURN` | `customer_returns` — Yêu cầu khách trả hàng | Theo lượng khách đã nhận, lý do, kiểm nhận và quyết định chấp nhận. | [H27 v0.1](24_Duyet_khach_tra_hang_sau_khi_nhan.md) **ĐÃ DUYỆT** theo UC-71 bản BE. Sales Staff quyết định ca thường, Store Owner xét ngoại lệ sau kiểm. |
| H28 | `GR_CUSTOMER_RETURN` | `customer_return_receipts` — Phiếu nhập khách trả | Nhận sở hữu phần được chấp nhận; chuyển từ giữ hộ nếu đã nhận tạm. | [H28 v0.2](24_Duyet_khach_tra_hang_sau_khi_nhan.md) **ĐÃ DUYỆT** nhận sở hữu hàng lỗi nhà sản xuất khi Store Owner duyệt và ghi nhận vào khu cách ly. |
| H29 | `SUPPLIER_RETURN` | `supplier_returns` — Yêu cầu trả nhà cung cấp | Nguồn PO/phiếu nhập, lượng và thỏa thuận trả hàng. | [H29 v0.1](26_Duyet_yeu_cau_xuat_tra_va_xac_nhan_nha_cung_cap.md) **ĐÃ DUYỆT** quyền Warehouse Staff lập và Accountant xác minh thỏa thuận theo BF-08. |
| H30 | `GI_SUPPLIER_RETURN` | `supplier_return_issues` — Phiếu xuất trả nhà cung cấp | Giảm tồn sở hữu khi thực xuất theo thỏa thuận đã xác minh. | [H30 v0.1](26_Duyet_yeu_cau_xuat_tra_va_xac_nhan_nha_cung_cap.md) **ĐÃ DUYỆT** xuất phần thuộc cửa hàng, H34 bàn giao phần giữ hộ. |
| H31 | `SUPPLIER_ACK` | `supplier_acknowledgements` — Xác nhận nhà cung cấp nhận hàng trả | Accountant ghi kết quả NCC thực nhận và đối chiếu với lượng thực xuất. | [H31 v0.1](26_Duyet_yeu_cau_xuat_tra_va_xac_nhan_nha_cung_cap.md) **ĐÃ DUYỆT** số lượng thực nhận, cách đối chiếu và điều kiện đóng. |
| H32 | `DISCREPANCY` | `stock_discrepancies` — Hồ sơ chênh lệch | Ghi lượng và nguồn chưa khớp để theo dõi kết quả xử lý. | [H32 v0.1](27_Duyet_chan_hang_doi_chat_luong_va_chenh_lech.md) **ĐÃ DUYỆT** bảng dùng chung, liên kết phần sai lệch và chứng từ giải quyết. |
| H33 | `CUSTODY_RECEIPT` | `custody_receipts` — Phiếu nhận giữ hộ | Ghi hàng vật lý đang giữ nhưng chưa thuộc sở hữu cửa hàng. | [H33 v0.1](25_Duyet_han_muc_tra_va_hang_giu_ho.md) **ĐÃ DUYỆT** người nhận, chủ hàng, lượng và cách chuyển sở hữu. |
| H34 | `CUSTODY_RELEASE` | `custody_releases` — Phiếu trả hàng giữ hộ | Ghi thực bàn giao lại hàng chưa nhận sở hữu. | [H34 v0.1](25_Duyet_han_muc_tra_va_hang_giu_ho.md) **ĐÃ DUYỆT** bàn giao thực tế theo dòng nhận giữ và hạn mức còn lại. |
| H35 | `REVERSAL` | `stock_reversals` — Phiếu đảo giao dịch | Sửa giao dịch đã ghi bằng nghiệp vụ liên kết giữ nguyên lịch sử gốc. | [H35 v0.1](30_Duyet_dao_giao_dich_va_ton_dau_ky.md) **ĐÃ DUYỆT**; đảo toàn bộ một lần ghi sai đủ điều kiện, Store Owner khác người đề nghị duyệt và ghi. |
| H36 | `OPENING` | `opening_stocks` — Phiếu tồn đầu kỳ | Nguồn số dư ban đầu có chứng từ và lịch sử. | [H36 v0.1](30_Duyet_dao_giao_dich_va_ton_dau_ky.md) **ĐÃ DUYỆT** ngày 02/11/2026; kho lập, Owner khác người lập xác minh/ghi một lần; kế hoạch chuyển dữ liệu quyết định riêng. |
| H37 | Bổ sung thiết kế mới | `sales_invoices` — Hóa đơn bán hàng tổng hợp | Một SO, nhiều phiếu xuất có ngày và lượng riêng. Hóa đơn hiển thị lượng thực xuất và tính tiền theo lượng khách nhận. | [H37 v0.1](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md) **ĐÃ DUYỆT** cấu trúc, vòng đời, quyền phát hành và quy tắc chống tính trùng. |

## 4. Chú thích từng collection hiện tại và điểm phải hỏi

### A01 — Tài khoản nhân viên

- **Hiện tại → đề xuất:** `users` → `users`.
- **Phục vụ:** FE-09.
- **Lý do tồn tại:** Danh tính đăng nhập, một vai trò và các kho được phân công. Là người tạo, duyệt, xác nhận trong hồ sơ nghiệp vụ.
- **DB đang có:** khoảng 6 bản ghi; model `User`.
- **Nội dung đã duyệt:** Tên đăng nhập cố định; liên hệ tùy chọn; Admin quản lý; chỉ khóa; một user một role và nhiều kho được phân công; các trường/quan hệ của phiếu A01 v0.1.
- **Quan hệ, trường mới và cách lưu:** xem A01 trong [phiếu chi tiết](02_Duyet_tai_khoan_va_phan_quyen.md); metadata cũ ở phụ lục 03 không bị thay đổi.
- **Ý kiến người dùng:** “Duyệt A01 theo phiếu 0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1. Thêm role ở A02 không đổi quan hệ một user một role.

### A02 — Vai trò

- **Hiện tại → đề xuất:** `roles` → `roles`.
- **Phục vụ:** FE-09.
- **Lý do tồn tại:** Vai trò hiện có và vai trò do Administrator tạo thêm, với các quyền được tick từ danh mục. Không tự mở chức năng tài khoản khách hàng/NCC.
- **DB đang có:** khoảng 5 bản ghi; model `Role`.
- **Đã chốt:** Tên Warehouse Staff thay Inventory Staff; Admin được tạo role và tick quyền. Không còn giới hạn chỉ năm role.
- **Đã chốt bổ sung:** Role mới thực hiện theo các quyền Admin tick; cấu trúc/vòng đời 0.2 được duyệt. Role tùy chỉnh được sửa/ngừng, giữ lịch sử và chuyển user active trước khi ngừng; role nền được bảo vệ.
- **Quan hệ, trường mới và cách lưu:** bản 0.2 trong [phiếu chi tiết](02_Duyet_tai_khoan_va_phan_quyen.md); code là String thay enum năm mã, có isSystemRole/isActive/version.
- **Ý kiến người dùng:** “ko có inventory staff, đổi sang warehouse staff”; “Admin có thể tạo thêm role và tick các phân quyền”.
- **Kết luận:** ĐÃ DUYỆT A02 v0.2 theo câu trả lời Q-A02-01/02.

### A03 — Danh mục quyền thao tác

- **Hiện tại → đề xuất:** `permissions` → `permissions`.
- **Phục vụ:** FE-09.
- **Lý do tồn tại:** Mã thao tác được backend kiểm tra. Quyền xem không tự cấp quyền tạo, sửa, duyệt hoặc xác nhận.
- **DB đang có:** khoảng 98 bản ghi; model `Permission`.
- **Đã duyệt:** Danh mục hữu hạn; tên/mô tả/nhóm FE/trạng thái; cấp quyền qua role; không tạo policy hoặc mã quyền tùy ý; không cấp ngoại lệ từng user.
- **Đã chốt bổ sung:** Bỏ allowedRoleCodes theo Q-A02-01; không thêm nhóm role nền. Role mới thực hiện theo permission được tick, vẫn chịu kiểm kho/người thực hiện/trạng thái.
- **Quan hệ, trường mới và cách lưu:** xem A03 trong [phiếu chi tiết](02_Duyet_tai_khoan_va_phan_quyen.md). Chưa duyệt toàn bộ các mã permission/ma trận nghiệp vụ chỉ bằng việc duyệt cấu trúc bảng.
- **Ý kiến người dùng:** “Duyệt A03 theo phiếu 0.1”.
- **Kết luận:** ĐÃ DUYỆT A03 v0.2 (giữ v0.1, bỏ giới hạn mã role theo Q-A02-01).

### B01 — Kho hàng

- **Hiện tại → đề xuất:** `warehouses` → `warehouses`.
- **Phục vụ:** FE-04.
- **Lý do tồn tại:** Danh mục kho vật lý; đầu nguồn và đầu nhận của mua, bán, điều chuyển, kiểm kê.
- **DB đang có:** khoảng 3 bản ghi; model `Warehouse`.
- **Đã duyệt:** Mã, tên, địa chỉ và mô tả tùy chọn, trạng thái, các quan hệ, quyền quản lý mặc định và điều kiện ngừng dùng kho.
- [Chi tiết trường, quan hệ và điều kiện ngừng dùng kho — B01 v0.1](05_Duyet_kho_vi_tri_don_vi_tinh.md#b01--warehouses--kho-hàng)
- **Ý kiến người dùng:** “Duyệt B01 v0.1”.
- **Trạng thái:** Đã duyệt B01 v0.1 và ba số đo bổ sung v0.3. Bản đồ 3D để giai đoạn sau.

### B02 — Vị trí trong kho

- **Tên đã duyệt:** `locations` → `warehouse_locations`. Tên này bao quát cả cửa nhận, lưu trữ, tập kết và cách ly.
- **Phục vụ:** FE-04.
- **Lý do tồn tại:** Vị trí nhận hàng, lưu trữ, tập kết, cách ly hoặc giữ hộ trong một kho.
- **DB đang có:** khoảng 15 bản ghi; model `Location`.
- **Đã chốt:** kiểm diện tích sàn và thể tích của từng ô. Khi vượt, chặn xác nhận và yêu cầu chọn ô khác hoặc chia lượng.
- [Trường, cách tính theo chồng và ví dụ ô A-01 — B02 v0.3](05_Duyet_kho_vi_tri_don_vi_tinh.md#b02--warehouse_locations--vị-tríô-trong-kho)
- **Trạng thái:** Đã duyệt B02 theo phiếu v0.3, bao gồm cách xử lý hàng xếp chồng.

### B03 — Đơn vị tính (đã bỏ bảng riêng)

- **Hiện trạng nguồn cũ:** uoms, model Uom. Snapshot giữ nguyên để đối chiếu, không còn là bảng đích.
- **Quyết định mới:** “Bỏ hai bảng, giữ quy đổi ngay trên dòng phiếu”. Đơn vị gốc trên sản phẩm; đơn vị nhập là giá trị của dòng.
- **Thay thế:** [Quyết định bỏ UOM](14_Bo_UOM_va_luu_quy_doi_tren_dong.md); không tạo bảng units hoặc quyền quản lý danh mục đơn vị riêng.
- **Trạng thái:** ĐÃ BỎ KHỎI THIẾT KẾ HIỆN HÀNH; phê duyệt v0.4 trước đây giữ trong lịch sử.

### B04 — Sản phẩm

[Phiếu B04–B06](06_Nhap_san_pham_lo_va_quy_cach.md) ghi cấu trúc, quan hệ và quyết định duyệt riêng cho từng bảng.

- **Hiện tại → đề xuất:** `products` → `products`.
- **Phục vụ:** FE-02.
- **Lý do tồn tại:** Danh mục SKU, tên, quy cách và đơn vị gốc; không phải số dư tồn.
- **DB đang có:** khoảng 2 bản ghi; model `Product`.
- **Ý kiến người dùng:** “Cần dùng mã của hãng làm SKU”.
- **Đã duyệt:** cặp hãng và SKU là duy nhất, chứng từ tham chiếu bằng ID nội bộ. Hai nhà cung cấp cùng bán hàng của cùng hãng thì cùng tham chiếu một sản phẩm.
- **Kết luận:** B04 v0.3 đã duyệt; đơn vị gốc sửa thành baseUnit lưu trực tiếp theo quyết định bỏ UOM.


### B05 — Lô sản phẩm

- **Hiện tại → đề xuất:** `lots` → `product_batches`.
- **Phục vụ:** FE-02.
- **Lý do tồn tại:** Nhận dạng lô theo sản phẩm, lô nhà sản xuất, tone và calibre thực tế.
- **DB đang có:** khoảng 3 bản ghi; model `Lot`.
- **Ý kiến người dùng:** “Cùng một mã”. Mã lô nhà sản xuất in trên thùng lưu một lần trong `manufacturerLot`.
- **Đã duyệt:** dùng chung lô khi cùng sản phẩm, mã lô, tông màu và cỡ áp dụng. Mỗi lần nhận vẫn lưu nhà cung cấp trên phiếu. Thiếu nhãn thì giữ chờ xác minh.
- **Kết luận:** B05 v0.3 ĐÃ DUYỆT.


### B06 — Quy đổi đơn vị theo phiên bản (đã bỏ bảng riêng)

- **Hiện trạng nguồn cũ:** product_uom_versions; không còn là bảng đích.
- **Quyết định mới:** giữ hệ số, đơn vị nhập/gốc và quy cách kiện trực tiếp ở dòng phiếu, mang theo thông tin thực tế khi chuyển hàng.
- **Thay thế:** [Quyết định bỏ UOM](14_Bo_UOM_va_luu_quy_doi_tren_dong.md); không tạo collection phiên bản quy đổi dưới tên khác.
- **Trạng thái:** ĐÃ BỎ KHỎI THIẾT KẾ HIỆN HÀNH; phê duyệt v0.2 trước đây giữ trong lịch sử.

### B07 — Ngưỡng tồn theo sản phẩm và kho

- **Hiện tại → đề xuất:** `product_warehouse_policies` → `stock_thresholds`.
- **Phục vụ:** FE-01/02.
- **Lý do tồn tại:** Mức tồn tối thiểu và mục tiêu để gợi ý bổ sung; không là policy tùy ý.
- **DB đang có:** khoảng 6 bản ghi; model `ProductWarehousePolicy`.
- **Ý kiến người dùng:** “Duyệt B07 theo phiếu v0.1”.
- **Kết luận:** B07 v0.1 ĐÃ DUYỆT. [Phiếu ngưỡng tồn](07_Duyet_nguong_ton_va_doi_tac.md).

### B08 — Khách hàng, nhà cung cấp và đơn vị vận chuyển

- **Đã chọn:** khách có mã do WMSD tự sinh, tên và số điện thoại. Khách hàng và nhà cung cấp có bảng riêng. Cập nhật 05/11: bỏ quản lý đội xe; biển số ghi trực tiếp trên lần bàn giao.
- **Kết quả:** [B08A · customers](08A_Khach_hang.md) v0.3 và [B08B · suppliers](08B_Nha_cung_cap.md) v0.1 vẫn có hiệu lực. [B08C](08C_Don_vi_van_chuyen.md) v0.4 đã bị thay thế bởi quyết định mới.
- **Hiện trạng:** MongoDB dùng `parties` cho cả STORE, CUSTOMER, SUPPLIER và CARRIER. Tham chiếu chủ sở hữu theo loại sau khi tách, cấu trúc số dư và khóa theo chủ hàng đã duyệt ở C02 v0.2. [Quyết định và ánh xạ](07_Duyet_nguong_ton_va_doi_tac.md).


### C01 — Điểm theo dõi tồn

- **Hiện tại → đề xuất:** `stock_accounts` → `stock_holding_points`.
- **Phục vụ:** FE-04/05.
- **Lý do tồn tại:** Một điểm vật lý hoặc một nguồn hàng đang chuyển, hiện dùng để tách on-hand và transit.
- **DB đang có:** khoảng 16 bản ghi; model `StockAccount`.
- **Đã duyệt:** C01 v0.1 có điểm tại ô hoặc điểm đang chuyển gắn từng dòng xuất liên kho. [Phiếu C01–C02](09_Duyet_diem_ton_va_so_du.md).
- **Ý kiến người dùng:** “Duyệt C01 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.


### C02 — Số dư tồn kho

- **Hiện tại → đề xuất:** `stock_balances` → `inventory_balances`.
- **Phục vụ:** FE-04.
- **Lý do tồn tại:** Số lượng hiện tại theo điểm tồn, lô, chất lượng và chủ sở hữu.
- **DB đang có:** khoảng 11 bản ghi; model `StockBalance`.
- **Đã duyệt C02 v0.2:** số dư theo điểm C01, lô, chất lượng, loại và ID chủ hàng; phân biệt khả dụng/vật lý, không sửa tay số dư. Quyền xem theo UC-30–31. Dữ liệu đóng gói và chồng hàng để kiểm sức chứa sẽ trình riêng. [Phiếu C02](09_Duyet_diem_ton_va_so_du.md).
- **Ý kiến người dùng:** “Duyệt C02 v0.2”.
- **Kết luận:** ĐÃ DUYỆT v0.2.

### C03 — Lần ghi nhận biến động tồn

- **Hiện tại → đề xuất:** `posting_batches` → `stock_transactions`.
- **Phục vụ:** FE-03/04/05/06/07/08.
- **Lý do tồn tại:** Nhóm các chuyển động phải thành công cùng nhau; truy người thực hiện, chứng từ và lần đảo.
- **DB đang có:** khoảng 21 bản ghi; model `PostingBatch`.
- **Đã duyệt C03 v0.1:** chứng từ nguồn, người/thời gian, nhận diện lần nghiệp vụ, xử lý gửi lại cùng yêu cầu, dấu vết đảo nếu được phép. [Phiếu C03–C04](10_Duyet_giao_dich_va_lich_su_ton.md).
- **Ý kiến người dùng:** “Duyệt C03 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.


### C04 — Chi tiết biến động tồn

- **Hiện tại → đề xuất:** `stock_movements` → `stock_movements`.
- **Phục vụ:** FE-09.
- **Lý do tồn tại:** Lịch sử tăng/giảm/chuyển giữa các số dư, số lượng trước/sau và nguồn chứng từ.
- **DB đang có:** khoảng 22 bản ghi; model `StockMovement`.
- **Đã duyệt C04 v0.1:** lượng tăng/giảm giữa các nhóm tồn, số lượng trước/sau, thứ tự dòng và liên kết lần ghi C03. [Phiếu C03–C04](10_Duyet_giao_dich_va_lich_su_ton.md).
- **Ý kiến người dùng:** “Duyệt C04 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.


### C05 — Giữ hàng cho nhu cầu

- **Hiện tại → đề xuất:** `reservations` → `stock_reservations`.
- **Phục vụ:** FE-04/05/06.
- **Lý do tồn tại:** Giữ lượng tồn cụ thể cho nhu cầu; tách khỏi nguồn hàng dự kiến chưa về.
- **DB đang có:** khoảng 2 bản ghi; model `Reservation`.
- **Đã duyệt C05 v0.1:** mốc giữ/giải phóng, lượng giữ thực tế theo số dư, chuyển giữ theo hàng, xử lý hủy/lỗi, chống vượt trần và quyền. [Phiếu C05–C06](11_Duyet_giu_hang_va_nguon_cung.md).
- **Ý kiến người dùng:** “Duyệt C05 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### C06 — Gắn nguồn cung với nhu cầu

- **Hiện tại → đề xuất:** `demand_supply_allocations` → `supply_allocations`.
- **Phục vụ:** FE-01/05/06.
- **Lý do tồn tại:** Liên kết nhu cầu với nguồn PO/điều chuyển dự kiến; hàng thực tế giữ riêng qua C05.
- **DB đang có:** khoảng 2 bản ghi; model `DemandSupplyAllocation`.
- **Đã duyệt C06 v0.1:** nhu cầu gốc, nguồn đủ điều kiện, lượng chờ/đã chuyển sang giữ thực tế/giải phóng, ngày cần và quyền. Kiểm trần nguồn/nhu cầu, không tính trùng với C05 hoặc chuỗi chứng từ. [Phiếu C05–C06](11_Duyet_giu_hang_va_nguon_cung.md).
- **Ý kiến người dùng:** “Duyệt C06 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### C07 — Chồng/cụm hàng trong ô (bảng mới đã duyệt)

- **Tên đề xuất:** `storage_stacks`.
- **Lý do tồn tại:** Ghi một diện tích đáy cho cả chồng cùng kích thước thực tế; xác định sức chứa khi thêm/lấy/xếp lại hàng.
- **Đã duyệt v0.1:** Ô, mã chồng, chiều dài/rộng/cao, cách tính thể tích, trạng thái dọn hết, người/phiên bản/thời gian. Không thay kích thước danh mục ô và không bao gồm bản đồ 3D.
- **Phiếu chi tiết:** [C07–C08](12_Duyet_chong_hang_va_dong_goi_thuc_te.md).
- **Ý kiến người dùng:** “Duyệt C07 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### C08 — Hàng trong chồng (bảng mới đã duyệt)

- **Tên đề xuất:** `storage_stack_items`.
- **Lý do tồn tại:** Phân biệt kiện nguyên, kiện đã mở và hàng lẻ theo quy cách thực tế; đối chiếu với tổng số dư C02.
- **Đã duyệt v0.1, sửa theo quyết định bỏ UOM:** Chồng C07, số dư C02, tình trạng đóng gói, packagingSnapshot thực tế trên dòng, số kiện nguyên và lượng thực tế, người/phiên bản/thời gian; giữ truy vết khi xếp/chuyển/mở kiện.
- **Phiếu chi tiết:** [C07–C08](12_Duyet_chong_hang_va_dong_goi_thuc_te.md).
- **Ý kiến người dùng:** “Duyệt C08 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### D01 — Hồ sơ nghiệp vụ đang gộp chung

- **Hiện tại → đề xuất:** `business_documents` → `Tên riêng theo loại nghiệp vụ ở mục 3`.
- **Phục vụ:** Tất cả BF.
- **Lý do tồn tại:** Hiện chứa 36 loại header trong code; các loại có vòng đời, quyền và nguồn khác nhau.
- **DB đang có:** khoảng 51 bản ghi; model `BusinessDocument`.
- **Đề xuất:** Dùng nơi lưu chính theo loại hồ sơ trong nhóm H đã duyệt; giữ H11 nhúng và TO dùng chung theo loại thao tác. Không tạo thêm đầu phiếu chung trùng dữ liệu.
- **Quan hệ, trường và cách lưu:** [Phiếu D01 v0.1](31_Duyet_cach_to_chuc_ho_so_nghiep_vu.md). Trường, trạng thái và quyền giữ theo từng phiếu riêng; D02–D06 và H01/H35 đã duyệt riêng; D07/D08 vẫn chờ.
- **Ý kiến người dùng:** “Duyệt D01 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1 ngày 02/11/2026; đây là quyết định tổ chức dữ liệu, không phải bảng mới.

### D02 — Dòng hàng của hồ sơ

- **Hiện tại → đề xuất:** `document_lines` → dòng `items[]` trong phiếu nghiệp vụ.
- **Phục vụ:** Tất cả BF.
- **Lý do tồn tại:** Hiện chứa 20 loại dòng; liên kết sản phẩm/lô, lượng nhập, quy đổi và nguồn dòng.
- **DB đang có:** khoảng 50 bản ghi; model `DocumentLine`.
- **Đề xuất:** Nhúng dòng có ID cố định, giữ lượng/quy đổi/phiên bản nguồn theo phiếu; không gộp lịch sử hoặc các bảng có vòng đời riêng vào items.
- **Quan hệ, trường và cách lưu:** [Phiếu D02 v0.1](32_Duyet_dong_hang_va_lien_ket_chung_tu.md).
- **Ý kiến người dùng:** “Duyệt D02 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### D03 — Quan hệ giữa hồ sơ

- **Hiện tại → đề xuất:** `document_links` → tham chiếu phiếu trực tiếp hoặc suy từ nguồn dòng, không tạo bảng quan hệ chung trùng dữ liệu.
- **Phục vụ:** Tất cả BF.
- **Lý do tồn tại:** Truy hồ sơ nguồn và hồ sơ xử lý tiếp; có loại quan hệ.
- **DB đang có:** khoảng 40 bản ghi; model `DocumentLink`.
- **Đề xuất:** Một nơi lưu chính cho mỗi quan hệ; dùng trường nguồn đã có, chỉ bổ sung danh sách quan hệ khi nghiệp vụ cần và chưa có cấu trúc tương đương.
- **Quan hệ, trường và cách lưu:** [Phiếu D03 v0.1](32_Duyet_dong_hang_va_lien_ket_chung_tu.md).
- **Ý kiến người dùng:** “Duyệt D03 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### D04 — Quan hệ giữa dòng hàng

- **Hiện tại → đề xuất:** `line_links` → tham chiếu dòng nguồn và lượng trên dòng xử lý hoặc bảng nghiệp vụ đã duyệt.
- **Phục vụ:** Tất cả BF.
- **Lý do tồn tại:** Truy lượng từ dòng nguồn đến dòng kế tiếp thay vì chỉ nối hai header.
- **DB đang có:** khoảng 38 bản ghi; model `LineLink`.
- **Đề xuất:** Nối đúng phiếu/dòng/phiên bản và ý nghĩa lượng; kiểm trần theo nghiệp vụ, không cộng liên kết tra cứu/giá như lượng hàng mới.
- **Quan hệ, trường và cách lưu:** [Phiếu D04 v0.1](32_Duyet_dong_hang_va_lien_ket_chung_tu.md).
- **Ý kiến người dùng:** “Duyệt D04 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### D05 — Lịch sử quyết định

- **Hiện tại → đề xuất:** `approvals` → `approval_history`.
- **Phục vụ:** FE-01/05/07/08.
- **Lý do tồn tại:** Quyết định gắn đúng hồ sơ, phiên bản, dòng, lượng và người duyệt.
- **DB đang có:** khoảng 5 bản ghi; model `Approval`.
- **Đề xuất:** Lịch sử bất biến theo hồ sơ/phiên bản/dòng/lượng, một nơi lưu quyết định chính; quyền và tách người theo nghiệp vụ, giữ ngoại lệ ca thường của H27.
- **Quan hệ, trường và cách lưu:** [Phiếu D05 v0.1](33_Duyet_lich_su_quyet_dinh_va_tep_dinh_kem.md).
- **Ý kiến người dùng:** “Duyệt D05 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### D06 — Ảnh và chứng từ đính kèm

- **Hiện tại → đề xuất:** `evidence_refs` → `attachments`.
- **Phục vụ:** FE-03/05/06/07/08/09.
- **Lý do tồn tại:** Thông tin tệp, người tải, nguồn hồ sơ/dòng và thông tin kiểm tra tệp.
- **DB đang có:** khoảng 5 bản ghi; model `Evidence`.
- **Đề xuất:** JPG/PNG/WEBP/PDF tối đa 10 MB mỗi tệp; gắn đúng phiếu/dòng/bước, giới hạn xem theo hồ sơ và nội dung, giữ nguyên bằng chứng đã dùng.
- **Quan hệ, trường và cách lưu:** [Phiếu D06 v0.1](33_Duyet_lich_su_quyet_dinh_va_tep_dinh_kem.md).
- **Ý kiến người dùng:** “Duyệt D06 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### D07 — Chứng từ nguồn bên ngoài

- **Hiện tại → đề xuất:** `external_references` → `external_documents`.
- **Phục vụ:** FE-06/07/09.
- **Lý do tồn tại:** Số/ngày/bằng chứng của chứng từ nguồn nhập thủ công; không kết nối hoặc thao tác MISA theo quyết định mới.
- **DB đang có:** khoảng 3 bản ghi; model `ExternalReference`.
- **Phần còn hỏi ở D07:** H12 đã chốt nhập nguồn ngay khi lập SO; cần rõ Sales tự đối chiếu hay Accountant xác minh trước WIR/OD. [Câu hỏi chuẩn bị D07](33_Duyet_lich_su_quyet_dinh_va_tep_dinh_kem.md). Nguồn giao lịch sử dùng trả hàng vẫn cần Accountant xác minh theo H27 đã duyệt.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** “chuưa ro do phần này người khác làm nghiệp vụ”.
- **Kết luận:** CHƯA DUYỆT; giữ mở để người phụ trách xác nhận. Không chọn thay người dùng hoặc tự chặn WIR/OD.

### D08 — Dòng hàng chứng từ ngoài

- **Hiện tại → đề xuất:** `external_reference_lines` → `external_document_items`.
- **Phục vụ:** FE-06/07/09.
- **Lý do tồn tại:** Sản phẩm, lượng và định danh dòng nguồn để chống sao chép/hoàn trả trùng.
- **DB đang có:** khoảng 3 bản ghi; model `ExternalReferenceLine`.
- **Cần hỏi trước duyệt:** Nhúng hay tách; nguồn lịch sử thiếu dòng; lượng đã giao/trả còn lại có căn cứ.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa duyệt D08; câu hỏi nguồn mới D07 do người khác phụ trách và chưa rõ.
- **Kết luận:** CHƯA DUYỆT; giữ mở phần cấu trúc nguồn/dòng phụ thuộc D07, tiếp tục các nhóm độc lập.

### E01 — Đánh giá điều kiện trả hàng

- **Hiện tại → đề xuất:** `customer_return_assessments` → `return_inspections`.
- **Phục vụ:** FE-07.
- **Lý do tồn tại:** Kết quả theo phiên bản về tình trạng, bao bì, đã dùng, nguồn và điều kiện trả.
- **DB đang có:** khoảng 1 bản ghi; model `CustomerReturnAssessment`.
- **Đã duyệt.** Warehouse Staff ghi tình trạng, nguồn, điều kiện thời hạn, kết quả theo từng phần và lần kiểm. H27 ghi quyết định kinh doanh dựa trên phiên bản kiểm đang áp dụng.
- **Trường và ví dụ.** [Phiếu E01 v0.1](24_Duyet_khach_tra_hang_sau_khi_nhan.md).
- **Trạng thái.** ĐÃ DUYỆT v0.1.

### E02 — Lượng nguồn đang đề nghị nhận lại

- **Hiện tại → đề xuất:** `return_source_claims` → `return_quantity_claims`.
- **Phục vụ:** FE-07.
- **Lý do tồn tại:** Ngăn cùng lượng đã giao/đã xuất bị đề nghị nhận lại nhiều lần đồng thời.
- **DB đang có:** khoảng 2 bản ghi; model `ReturnSourceClaim`.
- **Đã duyệt.** Lấy trần theo dòng khách nhận hoặc nguồn lịch sử đã xác minh cho H27. Với H23, lấy phần đã xuất còn chưa được khách nhận và chưa dùng để báo giao thất bại hoặc nhập về. Theo dõi riêng số lượng mở, đã dùng, đã giải phóng.
- **Trường và ví dụ.** [Phiếu E02 v0.1](25_Duyet_han_muc_tra_va_hang_giu_ho.md).
- **Trạng thái.** ĐÃ DUYỆT v0.1.

### E03 — Mở lại lượng cần giao

- **Hiện tại → đề xuất:** `demand_reopenings` → `delivery_demand_reopenings`.
- **Phục vụ:** FE-06/07.
- **Lý do tồn tại:** Ghi lượng giao thất bại đã thực nhập về được giao lại trên đơn cũ.
- **DB đang có:** khoảng 1 bản ghi; model `DemandReopening`.
- **Mốc đã duyệt:** mỗi dòng H24 thực nhập tạo đúng một lần mở trên dòng SO/WIR/OD cũ, trong cùng giao dịch. Sales dùng phần đã mở để chờ, giao bù hoặc hủy phần đủ điều kiện.
- **Quan hệ và trường đã duyệt.** [Phiếu E03 v0.1](22_Duyet_giao_that_bai_nhan_ve_va_giao_bu.md). Hai bảng [E04/E05 v0.1](23_Duyet_doi_lenh_giao_bu_va_huy_phan_don.md) đã duyệt riêng.
- **Trạng thái.** ĐÃ DUYỆT v0.1.

### E04 — Chuyển lượng cam kết giữa lệnh giao

- **Hiện tại → đề xuất:** `od_commitment_transfers` → `delivery_commitment_transfers`.
- **Phục vụ:** FE-06/07.
- **Lý do tồn tại:** Chuyển nghĩa vụ giao lại từ OD cũ sang OD thay thế mà không nhân nhu cầu.
- **DB đang có:** khoảng 1 bản ghi; model `OdCommitmentTransfer`.
- **Quyết định đã duyệt.** Sales Staff có thể chuyển phần E03 chưa dùng giữa hai lệnh giao cùng dòng WIR và SO. Nếu giao tiếp bằng lệnh cũ thì giữ quyền giao ở lệnh đó.
- **Trường và giới hạn.** [Phiếu E04 v0.1](23_Duyet_doi_lenh_giao_bu_va_huy_phan_don.md).
- **Trạng thái.** ĐÃ DUYỆT v0.1.

### E05 — Lịch sử hủy lượng đơn bán

- **Hiện tại → đề xuất:** `sales_order_cancellations` → `sales_order_cancellations`.
- **Phục vụ:** FE-06.
- **Lý do tồn tại:** Ghi dòng/lượng/lý do hủy đủ điều kiện, không xóa lịch sử đã xuất hoặc đã giao.
- **DB đang có:** khoảng 1 bản ghi; model `SalesOrderCancellation`.
- **Quyết định đã duyệt.** Sales Staff hủy lượng chưa xuất hoặc giao không thành đã thực nhập về, chưa xuất giao bù. Ghi nguồn, người hủy, lý do và số lượng hủy.
- **Trường và giới hạn.** [Phiếu E05 v0.1](23_Duyet_doi_lenh_giao_bu_va_huy_phan_don.md).
- **Trạng thái.** ĐÃ DUYỆT v0.1.

### E06 — Khóa sử dụng hàng có vấn đề

- **Hiện tại → đề xuất:** `defect_holds` → `stock_holds`.
- **Phục vụ:** FE-07/08.
- **Lý do tồn tại:** Chặn cấp hàng khi phát hiện lỗi; bản ghi giữ hàng không tự đổi lượng hoặc chất lượng.
- **DB đang có:** khoảng 1 bản ghi; model `DefectHold`.
- **Đã duyệt.** Warehouse Staff ghi chặn ngay phần nghi lỗi theo nhóm tồn và lượng. Giải phóng theo kết quả kiểm và quyết định đúng quyền, xử lý theo lượng thực tế hoặc mang chặn theo vị trí mới khi chuyển hợp lệ.
- **Trường và ví dụ.** [Phiếu E06 v0.1](27_Duyet_chan_hang_doi_chat_luong_va_chenh_lech.md).
- **Trạng thái.** ĐÃ DUYỆT v0.1.

### F01 — Tồn tại thời điểm khóa kiểm kê

- **Hiện tại → đề xuất:** `stocktake_snapshots` → `stocktake_snapshots`.
- **Phục vụ:** FE-08.
- **Lý do tồn tại:** Bản chụp bất biến làm mốc so sánh, khác số dư hiện tại.
- **DB đang có:** khoảng 1 bản ghi; model `StocktakeSnapshot`.
- **Đề xuất.** Tạo mốc khi kích hoạt, mỗi nhóm tồn một dòng giữ số sổ theo ô/lô/chất lượng/chủ. Hàng phát hiện thêm có căn cứ riêng với lượng sổ 0, các dòng chụp ban đầu được giữ.
- **Trường và ví dụ.** [Phiếu F01 v0.1](28_Duyet_dot_kiem_ke_moc_ton_va_khoa_vi_tri.md).
- **Ý kiến người dùng.** “Duyệt F01 v0.1”.
- **Trạng thái.** ĐÃ DUYỆT v0.1.

### F02 — Các lần đếm kiểm kê

- **Hiện tại → đề xuất:** `count_attempts` → `stocktake_counts`.
- **Phục vụ:** FE-08.
- **Lý do tồn tại:** Mỗi lần đếm/đếm lại có người, thời gian, lượng và chất lượng; giữ lịch sử.
- **DB đang có:** khoảng 1 bản ghi; model `CountAttempt`.
- **Đề xuất.** Mỗi lần đếm một dòng mốc có bản ghi riêng; xác nhận phạm vi trống cũng có người/thời điểm. Warehouse Staff chọn kết quả có căn cứ để đối chiếu, giữ lịch sử và quy đổi trên dòng.
- **Trường và ví dụ.** [Phiếu F02 v0.1](29_Duyet_ket_qua_dem_phuong_an_va_dieu_chinh.md).
- **Ý kiến người dùng.** “Duyệt F02 v0.1”.
- **Trạng thái.** ĐÃ DUYỆT v0.1.

### F03 — Vị trí đang khóa kiểm kê

- **Hiện tại → đề xuất:** `location_locks` → `stocktake_location_locks`.
- **Phục vụ:** FE-08.
- **Lý do tồn tại:** Chặn giao dịch tại phạm vi kiểm kê đến khi hoàn tất xử lý hợp lệ.
- **DB đang có:** khoảng 1 bản ghi; model `LocationLock`.
- **Đề xuất.** Mỗi ô có tối đa một khóa kiểm kê đang hiệu lực. Khóa cùng lúc ghi mốc và bắt đầu kiểm, mở cùng lần chốt hợp lệ. Giữ lịch sử khóa và xử lý nhiệm vụ dở trước kích hoạt.
- **Trường và ví dụ.** [Phiếu F03 v0.1](28_Duyet_dot_kiem_ke_moc_ton_va_khoa_vi_tri.md).
- **Ý kiến người dùng.** “Duyệt F03 v0.1”.
- **Trạng thái.** ĐÃ DUYỆT v0.1.

### G01 — Thông báo cho từng người

- **Hiện tại → đề xuất:** `notifications` → `notifications`.
- **Phục vụ:** FE-01/06/08/09.
- **Lý do tồn tại:** Thông báo theo người nhận và quyền nguồn; readAt không đồng nghĩa nhu cầu đã xử lý.
- **DB đang có:** khoảng 0 bản ghi; model `Notification`.
- **Đề xuất:** Thông báo theo tài khoản và sự kiện; email trạng thái đơn/hóa đơn nếu có địa chỉ; cảnh báo tồn theo đợt, đọc không đồng nghĩa xử lý.
- **Quan hệ, trường và cách lưu:** [Phiếu G01 v0.1](34_Duyet_thong_bao_nhat_ky_va_su_kien.md).
- **Ý kiến người dùng:** “Duyệt G01 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### G02 — Lịch sử thao tác

- **Hiện tại → đề xuất:** `audit_events` → `audit_logs`.
- **Phục vụ:** FE-09.
- **Lý do tồn tại:** Ai làm gì với hồ sơ nào, khi nào; khác lịch sử biến động tồn.
- **DB đang có:** khoảng 51 bản ghi; model `AuditEvent`.
- **Đề xuất:** Nhật ký người/hành động/đối tượng/kết quả và thay đổi cần thiết; không sửa/xóa dấu vết, không lộ giá hoặc bí mật qua màn hình lịch sử.
- **Quan hệ, trường và cách lưu:** [Phiếu G02 v0.1](34_Duyet_thong_bao_nhat_ky_va_su_kien.md).
- **Ý kiến người dùng:** “Duyệt G02 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### G03 — Sự kiện xử lý sau khi lưu

- **Hiện tại → đề xuất:** `outbox_events` → `system_events`.
- **Phục vụ:** Hỗ trợ FE-09.
- **Lý do tồn tại:** Lưu sự kiện cùng giao dịch để gửi thông báo/xử lý tiếp và thử lại khi lỗi.
- **DB đang có:** khoảng 51 bản ghi; model `OutboxEvent`.
- **Đề xuất:** Mỗi sự kiện/tác vụ có việc cần xử lý riêng; ghi cùng nghiệp vụ nguồn, chạy sau thành công, thử lại có giới hạn, không lặp biến động tồn.
- **Quan hệ, trường và cách lưu:** [Phiếu G03 v0.1](34_Duyet_thong_bao_nhat_ky_va_su_kien.md).
- **Ý kiến người dùng:** “Duyệt G03 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### G04 — Dấu vết chống thực hiện trùng

- **Hiện tại → đề xuất:** `business_operations` → `operation_records`.
- **Phục vụ:** Hỗ trợ nhiều FE.
- **Lý do tồn tại:** Khóa yêu cầu, dấu vân tay dữ liệu và kết quả lần xử lý; dùng cho thao tác không nhất thiết đổi tồn.
- **Snapshot 31/10:** khoảng 6 bản ghi; model `BusinessOperation`.
- **Đề xuất:** Lưu kết quả thành công cùng phiếu, dùng lại kết quả khi gửi lại cùng mã/nội dung; kiểm quyền hiện tại và khóa nghiệp vụ, tham chiếu C03 khi đổi tồn. Giữ khóa và dấu vết tối thiểu, chưa tự xóa.
- **Quan hệ, trường và cách lưu:** [Phiếu G04 v0.1](35_Duyet_chong_lap_thao_tac_va_kiem_soat_dong_thoi.md).
- **Ý kiến người dùng:** “Duyệt G04 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### G05 — Kiểm soát lập bổ sung đồng thời

- **Hiện tại → đề xuất:** `replenishment_planning_guards` → `replenishment_locks`.
- **Phục vụ:** Hỗ trợ FE-01.
- **Lý do tồn tại:** Phiên bản chung cho sản phẩm/kho khi đánh giá và tạo nhu cầu bổ sung.
- **Snapshot 31/10:** khoảng 0 bản ghi; model `ReplenishmentPlanningGuard`.
- **Đề xuất:** Một mốc phối hợp theo kho/sản phẩm, tính lại phần thiếu khi ghi; các nguồn liên quan cùng tham gia. Không giữ hàng, không khóa kho; quyền H01 theo phiếu v0.1 đã duyệt riêng.
- **Quan hệ, trường và cách lưu:** [Phiếu G05 v0.1](35_Duyet_chong_lap_thao_tac_va_kiem_soat_dong_thoi.md).
- **Ý kiến người dùng:** “Duyệt G05 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### G06 — Kiểm soát dùng chung nguồn giao/nhận

- **Hiện tại → đề xuất:** `return_source_guards` → `return_source_locks`.
- **Phục vụ:** Hỗ trợ FE-07.
- **Lý do đề xuất mới:** Chống hai thao tác khác nhau cùng dùng lượng của một nguồn giao/nhận; E02 giữ hạn mức, G06 chỉ phối hợp cập nhật.
- **Snapshot 31/10:** khoảng 0 bản ghi; chưa tìm thấy model export tương ứng. Nguồn tạo collection cũ chưa xác định, không coi là bằng chứng chức năng đã chạy và không xóa DB cũ.
- **Đề xuất:** Một mốc theo nguồn giao chuẩn, các lần nhận/giao thất bại/đề nghị trả cùng kiểm; không lưu lượng lần hai. Quy tắc xác minh nguồn ngoài D07/D08 vẫn chờ riêng.
- **Quan hệ, trường và cách lưu:** [Phiếu G06 v0.1](35_Duyet_chong_lap_thao_tac_va_kiem_soat_dong_thoi.md).
- **Ý kiến người dùng:** “Duyệt G06 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

## 5. Mẫu hồ sơ bắt buộc cho mỗi mục trước phê duyệt

1. Tên collection, tên nghiệp vụ và lý do cần có.
2. UC/BF nào dùng; ai tạo, xem, sửa, duyệt, xác nhận hoặc hủy.
3. Một bản ghi đại diện điều gì; dữ liệu mẫu minh họa không lấy thông tin cá nhân thật.
4. Mỗi trường: tên, kiểu, bắt buộc, mặc định, mô tả và nguồn dữ liệu.
5. Quan hệ nguồn–đích, 1–1 / 1–n / n–n, bắt buộc hay tùy chọn; dùng ID trực tiếp, dòng con hay nhúng.
6. Trạng thái, thời điểm đổi tồn, giới hạn lượng, dữ liệu không được sửa sau xác nhận.
7. Kiểm trùng, phiên bản, lịch sử, khóa đồng thời và cách phục hồi/sửa sai nếu liên quan.
8. Câu hỏi chi tiết; câu trả lời nguyên ý; phiên bản đề xuất đã duyệt.
9. Những mục phụ thuộc chưa được duyệt và tác động lên ERD/BE/FE.

Chỉ chuyển sang **ĐÃ DUYỆT** khi người dùng xác nhận rõ phiên bản/nội dung đó. Trả lời một câu không tự duyệt các câu còn lại. Nếu gộp/bỏ một bảng, phương án gộp/bỏ cũng phải được duyệt.
