# Danh mục dữ liệu cần duyệt

**Kiểm tra hiện trạng 31/10/2026; cập nhật duyệt 01/11/2026.** A01–A03, B01–B07, B08A–B08B, C01–C08 và H02 đã duyệt theo các phiên bản trong bảng bên dưới. B08C v0.4 chốt theo lựa chọn sửa quyền. H01 v0.1 chờ duyệt, người dùng cần giải thích thêm; đã bổ sung ví dụ. H02 v0.1 đã duyệt cả cấu trúc, gồm giá mua và tổng tiền chỉ Accountant/Store Owner xem.

Đây là danh mục kiểm soát độ đầy đủ, chưa phải danh sách collection mới đã chốt. 40 collection hiện có và 36 loại hồ sơ bên trong không được cộng thành 76 bảng mới. Các dòng con, bảng liên kết, lịch sử và cơ chế kỹ thuật cũng phải được trình bày và duyệt; nếu gộp/nhúng/bỏ thì ghi rõ thay thế bằng gì.

Tên tiếng Anh là tên đề xuất trong DB; tên tiếng Việt dùng giải thích. Tên đã rõ như users, products, warehouses được giữ. Tên mới chưa được áp vào MongoDB hoặc source code.

## 1. Thứ tự trao đổi

| Lượt | Nội dung | Đầu ra cần duyệt |
|---|---|---|
| 1 | Tài khoản, vai trò, quyền | A01–A03 đã duyệt; role mới theo quyền được Admin tick |
| 2 | Kho, ô kho, đơn vị, sản phẩm, lô, quy đổi, ngưỡng, đối tác | B01–B07 và B08A–B08B đã duyệt. B08C đã chốt thêm quyền Warehouse Staff tạo/sửa |
| 3 | Tồn thực, khả dụng, đang chuyển, giữ hàng, nguồn cung | C01–C08 đã duyệt; gồm giữ hàng, nguồn dự kiến và chồng hàng/đóng gói thực tế |
| 4 | Mua hàng và kiểm nhận | H02 v0.1 đã duyệt; H01 v0.1 chờ sau giải thích. Arrival, inspection, receipt trình tiếp |
| 5 | BF03 và BF04 | TR, internal requirement, TO, xuất/nhận, chênh lệch |
| 6 | SO, xuất và giao | Nguồn ngoài, SO/WIR/OD/GI, POD; ranh giới xác nhận tiền ngoài |
| 7 | Hàng lỗi, khách trả, giao thất bại, trả NCC | Quyền quyết định, custody, nhận/xuất thực, xử lý thiếu |
| 8 | Kiểm kê và điều chỉnh | Phạm vi, snapshot, lần đếm, khóa, phương án, chốt |
| 9 | Hồ sơ dùng chung và hỗ trợ | D01–D08, G01–G06, đảo giao dịch/tồn đầu kỳ |
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
| B03 | `uoms` | `units` | Đơn vị tính | FE-02 | ĐÃ DUYỆT v0.4 |
| B04 | `products` | `products` | Sản phẩm theo SKU của hãng | FE-02 | ĐÃ DUYỆT v0.3 |
| B05 | `lots` | `product_batches` | Lô theo mã nhà sản xuất in trên thùng | FE-02 | ĐÃ DUYỆT v0.3 |
| B06 | `product_uom_versions` | `product_unit_conversions` | Quy đổi đơn vị theo phiên bản | FE-02 | ĐÃ DUYỆT v0.2 |
| B07 | `product_warehouse_policies` | `stock_thresholds` | Ngưỡng tồn theo sản phẩm và kho | FE-01/02 | ĐÃ DUYỆT v0.1 |
| B08A | `parties` (CUSTOMER) | `customers` | Mã khách do WMSD sinh, tên và điện thoại | FE-02/06/07 | ĐÃ DUYỆT v0.3 |
| B08B | `parties` (SUPPLIER) | `suppliers` | Danh mục nhà cung cấp | FE-02/03/07 | ĐÃ DUYỆT v0.1 |
| B08C | `parties` (CARRIER), phiếu bàn giao | `delivery_teams` | Đội vận chuyển của shop để chọn lại theo chuyến | Bàn giao/FE-06 | ĐÃ CHỐT v0.4, bổ sung quyền |
| C01 | `stock_accounts` | `stock_holding_points` | Điểm theo dõi tồn | FE-04/05 | ĐÃ DUYỆT v0.1 |
| C02 | `stock_balances` | `inventory_balances` | Số dư tồn kho | FE-04 | ĐÃ DUYỆT v0.2 |
| C03 | `posting_batches` | `stock_transactions` | Lần ghi nhận biến động tồn | FE-03/04/05/06/07/08 | ĐÃ DUYỆT v0.1 |
| C04 | `stock_movements` | `stock_movements` | Chi tiết biến động tồn | FE-09 | ĐÃ DUYỆT v0.1 |
| C05 | `reservations` | `stock_reservations` | Giữ hàng cho nhu cầu | FE-04/05/06 | ĐÃ DUYỆT v0.1 |
| C06 | `demand_supply_allocations` | `supply_allocations` | Gắn nguồn cung với nhu cầu | FE-01/05/06 | ĐÃ DUYỆT v0.1 |
| D01 | `business_documents` | `Tên riêng theo loại nghiệp vụ ở mục 3` | Hồ sơ nghiệp vụ đang gộp chung | Tất cả BF | CHƯA DUYỆT |
| D02 | `document_lines` | `Tên dòng chi tiết theo hồ sơ đã duyệt` | Dòng hàng của hồ sơ | Tất cả BF | CHƯA DUYỆT |
| D03 | `document_links` | `document_relations` | Quan hệ giữa hồ sơ | Tất cả BF | CHƯA DUYỆT |
| D04 | `line_links` | `document_item_relations` | Quan hệ giữa dòng hàng | Tất cả BF | CHƯA DUYỆT |
| D05 | `approvals` | `approval_history` | Lịch sử quyết định | FE-01/05/07/08 | CHƯA DUYỆT |
| D06 | `evidence_refs` | `attachments` | Ảnh và chứng từ đính kèm | FE-03/05/06/07/08/09 | CHƯA DUYỆT |
| D07 | `external_references` | `external_documents` | Chứng từ nguồn bên ngoài | FE-06/07/09 | CHƯA DUYỆT |
| D08 | `external_reference_lines` | `external_document_items` | Dòng hàng chứng từ ngoài | FE-06/07/09 | CHƯA DUYỆT |
| E01 | `customer_return_assessments` | `return_inspections` | Đánh giá điều kiện trả hàng | FE-07 | CHƯA DUYỆT |
| E02 | `return_source_claims` | `return_quantity_claims` | Lượng nguồn đang đề nghị nhận lại | FE-07 | CHƯA DUYỆT |
| E03 | `demand_reopenings` | `delivery_demand_reopenings` | Mở lại lượng cần giao | FE-06/07 | CHƯA DUYỆT |
| E04 | `od_commitment_transfers` | `delivery_commitment_transfers` | Chuyển lượng cam kết giữa lệnh giao | FE-06/07 | CHƯA DUYỆT |
| E05 | `sales_order_cancellations` | `sales_order_cancellations` | Lịch sử hủy lượng đơn bán | FE-06 | CHƯA DUYỆT |
| E06 | `defect_holds` | `stock_holds` | Khóa sử dụng hàng có vấn đề | FE-07/08 | CHƯA DUYỆT |
| F01 | `stocktake_snapshots` | `stocktake_snapshots` | Tồn tại thời điểm khóa kiểm kê | FE-08 | CHƯA DUYỆT |
| F02 | `count_attempts` | `stocktake_counts` | Các lần đếm kiểm kê | FE-08 | CHƯA DUYỆT |
| F03 | `location_locks` | `stocktake_location_locks` | Vị trí đang khóa kiểm kê | FE-08 | CHƯA DUYỆT |
| G01 | `notifications` | `notifications` | Thông báo cho từng người | FE-01/06/08/09 | CHƯA DUYỆT |
| G02 | `audit_events` | `audit_logs` | Lịch sử thao tác | FE-09 | CHƯA DUYỆT |
| G03 | `outbox_events` | `system_events` | Sự kiện xử lý sau khi lưu | Hỗ trợ FE-09 | CHƯA DUYỆT |
| G04 | `business_operations` | `operation_records` | Dấu vết chống thực hiện trùng | Hỗ trợ nhiều FE | CHƯA DUYỆT |
| G05 | `replenishment_planning_guards` | `replenishment_locks` | Kiểm soát lập bổ sung đồng thời | Hỗ trợ FE-01 | CHƯA DUYỆT |
| G06 | `return_source_guards` | `return_source_locks` | Kiểm soát nguồn trả đồng thời — cần xác minh | Hỗ trợ FE-07 | CHƯA DUYỆT |

### 2.1. Dữ liệu bổ sung từ yêu cầu sức chứa

Các bảng sau đã duyệt thiết kế cho yêu cầu sức chứa B02; không phải collection quan sát được trong snapshot 40 collection hiện tại và chưa được tạo trong DB.

| Mã duyệt | Tên đề xuất | Ý nghĩa | Căn cứ | Trạng thái |
|---|---|---|---|---|
| C07 | `storage_stacks` | Chồng/cụm hàng chiếm diện tích và thể tích tại một ô | B02, dữ liệu đo thực tế | ĐÃ DUYỆT v0.1 |
| C08 | `storage_stack_items` | Hàng thực tế trong chồng theo số dư và quy cách đóng gói | B06, C02, C07 | ĐÃ DUYỆT v0.1 |

[Phiếu C07–C08](12_Duyet_chong_hang_va_dong_goi_thuc_te.md) giải thích trường, quan hệ, quyền, cách đo/tính và ví dụ. Không cộng C08 lần nữa vào số lượng tồn C02.

## 3. Các hồ sơ nằm trong business_documents phải duyệt riêng về nghiệp vụ

Các tên sau chỉ là ứng viên nếu tách collection. Ví dụ TO có thể giữ chung picking/putaway/relocate, còn bàn giao có thể là phần dữ liệu của phiếu xuất. Cách gộp/tách sẽ được hỏi, không tự tạo một bảng cho mỗi bước của swimlane.

| Mã | Loại hiện tại | Tên đề xuất | Ý nghĩa và dữ liệu cần giữ | Điểm cần trao đổi |
|---|---|---|---|---|
| H01 | `REPLENISHMENT` | `replenishment_requests` — Yêu cầu bổ sung | Một kho, nguồn nhu cầu, bản gửi/duyệt và các dòng hàng nhúng có ID ổn định. | Người dùng “Cần giải thích thêm H01”. [H01 v0.1](13_Duyet_yeu_cau_bo_sung_va_don_mua.md) **CHỜ DUYỆT**, đã bổ sung ví dụ và giải thích. |
| H02 | `PO` | `purchase_orders` — Đơn mua hàng | Một RR, một NCC, một kho; dòng hàng nhúng, giá mua, lịch và nhiều phiếu nhập. | Người dùng “Duyệt H02 v0.1”. [H02 v0.1](13_Duyet_yeu_cau_bo_sung_va_don_mua.md) **ĐÃ DUYỆT**, gồm giá chỉ Accountant/Owner xem. |
| H03 | `ARRIVAL` | `goods_arrivals` — Thông tin hàng đến | Ghi lượng thực mang đến trước khi quyết định nhận sở hữu. | Tách hồ sơ hay nhúng trong phiếu kiểm nhận; vẫn phải ghi được trường hợp không nhận đơn vị nào. **CHƯA DUYỆT**. |
| H04 | `INSPECTION` | `goods_inspections` — Biên bản kiểm nhận | Kiểm từng lượng/sản phẩm/lô/tình trạng/bao bì và kết quả chấp nhận hoặc giữ hộ. | Gộp vào receipt hay riêng; nhiều lần kiểm; nguồn purchase/return/transfer. **CHƯA DUYỆT**. |
| H05 | `GR_PURCHASE` | `purchase_receipts` — Phiếu nhập mua hàng | Lượng nhận sở hữu từ PO sau kiểm; kho nhận, chất lượng và nguồn dòng. | Phân biệt hàng đến với lượng được nhập; tăng tồn một lần. **CHƯA DUYỆT**. |
| H06 | `TO` | `transfer_orders` — Lệnh thao tác nội kho | TO thực hiện relocate, picking hoặc putaway; có nguồn, đích và lượng thực tế. | Một loại bảng với taskType; BF03 không TR/Owner; confirm từng phần hay toàn bộ sẽ hỏi rõ. **CHƯA DUYỆT**. |
| H07 | `TRANSFER_REQUEST` | `warehouse_transfer_requests` — Yêu cầu chuyển giữa kho | Nhu cầu kho nguồn → kho đích do Owner duyệt trước thực hiện. | Một hay nhiều phiếu xuất/nhận theo quyết định mới nhất; không dùng bảng này cho BF03. **CHƯA DUYỆT**. |
| H08 | `INTERNAL_TRANSFER_REQUIREMENT` | `internal_transfer_requirements` — Yêu cầu thao tác nội kho | Bước yêu cầu picking/putaway tự sinh TO trong BF04 mới. | Phân biệt với TR liên kho; cần lưu độc lập hay là thông tin thuộc TO/phiếu nguồn. **CHƯA DUYỆT**. |
| H09 | `TRANSFER_DISPATCH` | `transfer_dispatches` — Phiếu xuất điều chuyển | Tham chiếu TR, kho xuất và dòng hàng; xác nhận PICK TO đồng thời thực xuất. | Nháp không đổi tồn; confirm nguồn → staging → transit cùng lần; không thêm GI giảm trùng. **CHƯA DUYỆT**. |
| H10 | `MWTR` | `transfer_receipts` — Phiếu nhận điều chuyển | Nhận thực từ phiếu xuất, giảm transit; tốt vào receiving, lỗi vào quarantine cùng kho nhận. | Nhận thiếu/thừa/sai và các lần nhận; người nhận khác người xuất; putaway không nhập tồn lần hai. **CHƯA DUYỆT**. |
| H11 | `HANDOVER` | `handover_records` — Thông tin bàn giao | Người, thời gian, lượng và bằng chứng bàn giao hàng. | BF04 mới không có bước confirm bàn giao riêng; xem có thể nhúng vào phiếu xuất thay collection riêng. **CHƯA DUYỆT**. |
| H12 | `SALES_ORDER` | `sales_orders` — Đơn bán sao chép | Sales nhập đơn nguồn MISA/giấy ngay lúc tạo; lưu khách, sản phẩm và lượng cần giao. | Chốt lại ranh giới giá/hóa đơn; dòng nguồn chống trùng; SO không tự giảm tồn. **CHƯA DUYỆT**. |
| H13 | `ISSUE_REQUEST` | `warehouse_issue_requests` — Yêu cầu xuất cho đơn bán | Chia nhu cầu SO sang xử lý kho, giữ dòng nguồn và lượng còn nghĩa vụ. | Một SO nhiều yêu cầu; không cộng nhu cầu cha/con hai lần; có thật sự cần header riêng. **CHƯA DUYỆT**. |
| H14 | `OUTBOUND_DELIVERY` | `delivery_orders` — Lệnh giao hàng | Lập kế hoạch giao từ một kho theo yêu cầu xuất; liên kết giữ hàng và phiếu xuất thực. | Phân biệt với sales_goods_issues; lệnh thay thế khi giao thất bại. **CHƯA DUYỆT**. |
| H15 | `GI_SALE` | `sales_goods_issues` — Phiếu xuất bán hàng | Nháp trước picking; ghi giảm tồn khi thực bàn giao; số lượng và ngày xuất riêng từng phiếu. | Không gọi đây là hóa đơn; một đơn có nhiều phiếu xuất; trần lượng và bằng chứng. **CHƯA DUYỆT**. |
| H16 | `DELIVERY_CONFIRMATION` | `delivery_confirmations` — Xác nhận khách nhận hàng | Xác nhận người nhận, lượng thực và ảnh theo phiếu xuất; không giảm tồn lần nữa. | Giao một phần; sửa sai bằng lịch sử; trần POD cùng hàng giao thất bại. **CHƯA DUYỆT**. |
| H17 | `PAYMENT_CONFIRMATION` | `external_payment_confirmations` — Xác nhận đã nhận đủ tiền bên ngoài | Theo baseline code: Sales xác nhận thông tin bên ngoài sau giao đủ; không thu tiền trong WMSD. | Cần chốt có giữ mốc này không; khác quản lý thanh toán/công nợ và khác phát hành hóa đơn. **CHƯA DUYỆT**. |
| H18 | `DEFECT_CASE` | `defect_reports` — Hồ sơ hàng lỗi | Ghi nguồn, lô, vị trí, lượng, hiện trạng và bằng chứng vấn đề. | Liên kết hàng lỗi từ nhận/chuyển/trả/kiểm kê; không giảm tồn lúc chỉ phát hiện. **CHƯA DUYỆT**. |
| H19 | `DISPOSITION` | `defect_resolution_plans` — Phương án xử lý hàng lỗi | Đề xuất và quyết định hủy/đổi chất lượng/giải phóng; thực hiện sau đúng thẩm quyền. | Tách quyết định với thực hiện; trả NCC và kiểm kê dùng luồng riêng. **CHƯA DUYỆT**. |
| H20 | `SCRAP` | `stock_scrap_records` — Phiếu hủy hàng | Bằng chứng lượng thực hủy dẫn tới giảm tồn một lần. | Người duyệt/thực hiện; nguồn lỗi; không vừa hủy vừa trả cùng lượng. **CHƯA DUYỆT**. |
| H21 | `STOCKTAKE` | `stocktakes` — Đợt kiểm kê | Kế hoạch, phạm vi, người đếm, thời điểm khóa và trạng thái đợt. | Khóa/snapshot khi kích hoạt, không khi mới lập kế hoạch; đóng khi xử lý hết sai lệch. **CHƯA DUYỆT**. |
| H22 | `ADJUSTMENT` | `stock_adjustments` — Phiếu điều chỉnh số lượng | Tăng/giảm đúng chênh lệch được duyệt, gắn kiểm kê và giao dịch tồn. | Không tạo phiếu số lượng 0 để xử lý đổi chất lượng/vị trí. **CHƯA DUYỆT**. |
| H23 | `FAILED_DELIVERY` | `failed_deliveries` — Hồ sơ giao hàng thất bại | Hàng đã xuất nhưng khách chưa nhận; ghi nguyên nhân và lượng quay về. | Không nhầm khách đã nhận rồi trả; không tự mở lại nhu cầu trước nhận thực. **CHƯA DUYỆT**. |
| H24 | `GR_FAILED_DELIVERY` | `failed_delivery_receipts` — Phiếu nhận hàng giao thất bại | Thực nhập lại đúng lượng còn thuộc phiếu xuất và mở lại nghĩa vụ giao cùng giao dịch. | Theo lô/chất lượng; giữ lịch sử xuất gốc; chống nhận trùng. **CHƯA DUYỆT**. |
| H25 | `ST_RESOLUTION` | `stocktake_resolution_plans` — Phương án xử lý chênh lệch kiểm kê | Đề xuất điều chỉnh lượng/đổi chất lượng/chuyển vị trí dựa trên lần đếm và phiên bản. | Warehouse đề xuất/thực hiện; Owner duyệt và chốt; chỉ bỏ khóa sau ghi thành công. **CHƯA DUYỆT**. |
| H26 | `RECLASS` | `stock_quality_changes` — Phiếu đổi chất lượng tồn | Chuyển số lượng giữa hai trạng thái chất lượng và giữ tổng tồn. | Nguồn duyệt, điểm thực hiện; không coi hàng hỏng còn trong kho là thiếu hàng. **CHƯA DUYỆT**. |
| H27 | `CUSTOMER_RETURN` | `customer_returns` — Yêu cầu khách trả hàng | Theo lượng khách đã nhận, lý do, kiểm nhận và quyết định chấp nhận. | CR thường Sales quyết định hay Owner; ngoại lệ và điều kiện cấm; nguồn lịch sử. **CHƯA DUYỆT**. |
| H28 | `GR_CUSTOMER_RETURN` | `customer_return_receipts` — Phiếu nhập khách trả | Nhận sở hữu phần được chấp nhận; chuyển từ giữ hộ nếu đã nhận tạm. | Không cộng cả hàng giữ hộ lẫn hàng thuộc cửa hàng; không tự hoàn tiền. **CHƯA DUYỆT**. |
| H29 | `SUPPLIER_RETURN` | `supplier_returns` — Yêu cầu trả nhà cung cấp | Nguồn PO/phiếu nhập, lượng và thỏa thuận trả hàng. | Luồng Accountant hay Owner đang lệch giữa tài liệu cũ và context; cần chốt trước dựng trường duyệt. **CHƯA DUYỆT**. |
| H30 | `GI_SUPPLIER_RETURN` | `supplier_return_issues` — Phiếu xuất trả nhà cung cấp | Giảm tồn sở hữu khi thực xuất theo thỏa thuận đã xác minh. | Hàng chỉ giữ hộ dùng trả giữ hộ; không giảm hàng sở hữu hai lần. **CHƯA DUYỆT**. |
| H31 | `SUPPLIER_ACK` | `supplier_acknowledgements` — Xác nhận nhà cung cấp nhận hàng trả | Accountant ghi kết quả NCC thực nhận và đối chiếu với lượng thực xuất. | Khác thỏa thuận trước khi xuất; thiếu/tranh chấp giữ mở; không đổi tồn lần nữa. **CHƯA DUYỆT**. |
| H32 | `DISCREPANCY` | `stock_discrepancies` — Hồ sơ chênh lệch | Ghi lượng và nguồn chưa khớp để theo dõi kết quả xử lý. | Dùng chung hay thuộc từng loại phiếu; ai quyết định; không tự xóa lượng transit thiếu. **CHƯA DUYỆT**. |
| H33 | `CUSTODY_RECEIPT` | `custody_receipts` — Phiếu nhận giữ hộ | Ghi hàng vật lý đang giữ nhưng chưa thuộc sở hữu cửa hàng. | Chủ sở hữu; tách khỏi hàng khả dụng; chuyển nhận chính thức không đếm hai lần. **CHƯA DUYỆT**. |
| H34 | `CUSTODY_RELEASE` | `custody_releases` — Phiếu trả hàng giữ hộ | Ghi thực bàn giao lại hàng chưa nhận sở hữu. | Giảm custody, không giảm tồn sở hữu; chữ ký/bằng chứng và nguồn nhận tạm. **CHƯA DUYỆT**. |
| H35 | `REVERSAL` | `stock_reversals` — Phiếu đảo giao dịch | Sửa giao dịch đã ghi bằng nghiệp vụ liên kết giữ nguyên lịch sử gốc. | Ai được phép; có chứng từ phía sau phải kiểm trước đảo; không mở màn hình đảo tùy ý. **CHƯA DUYỆT**. |
| H36 | `OPENING` | `opening_stocks` — Phiếu tồn đầu kỳ | Nguồn số dư ban đầu có chứng từ và lịch sử. | Tạo mới DB không làm mất lịch sử; số dư mở đầu lấy từ đâu, ai xác minh, thời điểm chuyển đổi. **CHƯA DUYỆT**. |

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

### B03 — Đơn vị tính

- **Hiện tại → đề xuất:** `uoms` → `units`.
- **Phục vụ:** FE-02.
- **Lý do tồn tại:** Danh mục đơn vị dùng chung như Thùng, Hộp, Viên, Chiếc. Nhân viên chọn khi nhập số lượng và có thể thêm đơn vị chưa có nếu được cấp quyền.
- **DB đang có:** khoảng 3 bản ghi; model `Uom`.
- **Đã chốt:** các thùng cùng lô của cùng sản phẩm mang cùng mã, sang lô khác thì đổi mã. Đề xuất B05 lưu mã nhãn, B04 cung cấp thông tin sản phẩm, B06 cung cấp quy cách lúc nhập.
- [Phiếu B03 và ví dụ phân biệt lô bằng nhãn thùng](05_Duyet_kho_vi_tri_don_vi_tinh.md#b03--units--đơn-vị-tính)
- **Ý kiến người dùng:** Muốn quản lý mã thùng để xem mã sản phẩm, kích thước, quy cách đóng gói, nhận ra sự khác nhau giữa các lô.
- **Trạng thái:** Đã duyệt B03 v0.4. Warehouse Staff và Store Owner được thêm đơn vị. Sửa/ngừng dùng mặc định thuộc Store Owner. Quy đổi theo sản phẩm được duyệt riêng ở B06.

### B04 — Sản phẩm

[Phiếu B04–B06](06_Nhap_san_pham_lo_va_quy_cach.md) ghi cấu trúc, quan hệ và quyết định duyệt riêng cho từng bảng.

- **Hiện tại → đề xuất:** `products` → `products`.
- **Phục vụ:** FE-02.
- **Lý do tồn tại:** Danh mục SKU, tên, quy cách và đơn vị gốc; không phải số dư tồn.
- **DB đang có:** khoảng 2 bản ghi; model `Product`.
- **Ý kiến người dùng:** “Cần dùng mã của hãng làm SKU”.
- **Đã duyệt:** cặp hãng và SKU là duy nhất, chứng từ tham chiếu bằng ID nội bộ. Hai nhà cung cấp cùng bán hàng của cùng hãng thì cùng tham chiếu một sản phẩm.
- **Kết luận:** B04 v0.3 ĐÃ DUYỆT.


### B05 — Lô sản phẩm

- **Hiện tại → đề xuất:** `lots` → `product_batches`.
- **Phục vụ:** FE-02.
- **Lý do tồn tại:** Nhận dạng lô theo sản phẩm, lô nhà sản xuất, tone và calibre thực tế.
- **DB đang có:** khoảng 3 bản ghi; model `Lot`.
- **Ý kiến người dùng:** “Cùng một mã”. Mã lô nhà sản xuất in trên thùng lưu một lần trong `manufacturerLot`.
- **Đã duyệt:** dùng chung lô khi cùng sản phẩm, mã lô, tông màu và cỡ áp dụng. Mỗi lần nhận vẫn lưu nhà cung cấp trên phiếu. Thiếu nhãn thì giữ chờ xác minh.
- **Kết luận:** B05 v0.3 ĐÃ DUYỆT.


### B06 — Quy đổi đơn vị theo phiên bản

- **Hiện tại → đề xuất:** `product_uom_versions` → `product_unit_conversions`.
- **Phục vụ:** FE-02.
- **Lý do tồn tại:** Hệ số quy đổi từng sản phẩm và phiên bản đóng gói; dòng phiếu giữ hệ số đã dùng.
- **DB đang có:** khoảng 4 bản ghi; model `ProductUomVersion`.
- **Đã duyệt:** Store Owner khai báo phiên bản quy cách, Warehouse Staff chọn phiên bản thực tế. Mỗi dòng giữ hệ số đã dùng và kích thước ngoài của kiện được quản lý khi áp dụng.
- **Ý kiến người dùng:** “Duyệt B06 theo phiếu v0.2”.
- **Kết luận:** B06 v0.2 ĐÃ DUYỆT.


### B07 — Ngưỡng tồn theo sản phẩm và kho

- **Hiện tại → đề xuất:** `product_warehouse_policies` → `stock_thresholds`.
- **Phục vụ:** FE-01/02.
- **Lý do tồn tại:** Mức tồn tối thiểu và mục tiêu để gợi ý bổ sung; không là policy tùy ý.
- **DB đang có:** khoảng 6 bản ghi; model `ProductWarehousePolicy`.
- **Ý kiến người dùng:** “Duyệt B07 theo phiếu v0.1”.
- **Kết luận:** B07 v0.1 ĐÃ DUYỆT. [Phiếu ngưỡng tồn](07_Duyet_nguong_ton_va_doi_tac.md).

### B08 — Khách hàng, nhà cung cấp và đơn vị vận chuyển

- **Đã chọn:** khách có mã do WMSD tự sinh, tên và số điện thoại. Khách hàng và nhà cung cấp có bảng riêng. Shop tự vận chuyển, có danh mục đội nội bộ để chọn và ghi thông tin thực tế từng lần bàn giao.
- **Kết quả:** [B08A · customers](08A_Khach_hang.md) v0.3 và [B08B · suppliers](08B_Nha_cung_cap.md) v0.1 đã duyệt. [B08C · delivery_teams](08C_Don_vi_van_chuyen.md) v0.4 ghi thêm Warehouse Staff tạo/sửa theo lựa chọn người dùng.
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
- **Đã duyệt v0.1:** Chồng C07, số dư C02, tình trạng đóng gói, phiên bản B06, số kiện nguyên và lượng thực tế, người/phiên bản/thời gian; giữ truy vết khi xếp/chuyển/mở kiện.
- **Phiếu chi tiết:** [C07–C08](12_Duyet_chong_hang_va_dong_goi_thuc_te.md).
- **Ý kiến người dùng:** “Duyệt C08 v0.1”.
- **Kết luận:** ĐÃ DUYỆT v0.1.

### D01 — Hồ sơ nghiệp vụ đang gộp chung

- **Hiện tại → đề xuất:** `business_documents` → `Tên riêng theo loại nghiệp vụ ở mục 3`.
- **Phục vụ:** Tất cả BF.
- **Lý do tồn tại:** Hiện chứa 36 loại header trong code; các loại có vòng đời, quyền và nguồn khác nhau.
- **DB đang có:** khoảng 51 bản ghi; model `BusinessDocument`.
- **Cần hỏi trước duyệt:** Duyệt từng loại trước; chọn tách collection hay dùng phần chung sau; không mặc định 36 loại là 36 bảng mới.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### D02 — Dòng hàng của hồ sơ

- **Hiện tại → đề xuất:** `document_lines` → `Tên dòng chi tiết theo hồ sơ đã duyệt`.
- **Phục vụ:** Tất cả BF.
- **Lý do tồn tại:** Hiện chứa 20 loại dòng; liên kết sản phẩm/lô, lượng nhập, quy đổi và nguồn dòng.
- **DB đang có:** khoảng 50 bản ghi; model `DocumentLine`.
- **Cần hỏi trước duyệt:** Nhúng items hay collection con; dòng cần ID ổn định để nhận/xuất/trả/duyệt và truy vết.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### D03 — Quan hệ giữa hồ sơ

- **Hiện tại → đề xuất:** `document_links` → `document_relations`.
- **Phục vụ:** Tất cả BF.
- **Lý do tồn tại:** Truy hồ sơ nguồn và hồ sơ xử lý tiếp; có loại quan hệ.
- **DB đang có:** khoảng 40 bản ghi; model `DocumentLink`.
- **Cần hỏi trước duyệt:** Quan hệ nào dùng trường trực tiếp, quan hệ nào n–n cần bản ghi; tránh lưu cùng liên kết hai nơi không đồng bộ.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### D04 — Quan hệ giữa dòng hàng

- **Hiện tại → đề xuất:** `line_links` → `document_item_relations`.
- **Phục vụ:** Tất cả BF.
- **Lý do tồn tại:** Truy lượng từ dòng nguồn đến dòng kế tiếp thay vì chỉ nối hai header.
- **DB đang có:** khoảng 38 bản ghi; model `LineLink`.
- **Cần hỏi trước duyệt:** Số lượng đã dùng/còn lại; nhiều nguồn; sửa/hủy và đảo dòng; giữ chứng cứ nguồn.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### D05 — Lịch sử quyết định

- **Hiện tại → đề xuất:** `approvals` → `approval_history`.
- **Phục vụ:** FE-01/05/07/08.
- **Lý do tồn tại:** Quyết định gắn đúng hồ sơ, phiên bản, dòng, lượng và người duyệt.
- **DB đang có:** khoảng 5 bản ghi; model `Approval`.
- **Cần hỏi trước duyệt:** Điểm nào còn cần duyệt; ai duyệt; lý do từ chối; sửa yêu cầu phải duyệt lại; không tự duyệt.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### D06 — Ảnh và chứng từ đính kèm

- **Hiện tại → đề xuất:** `evidence_refs` → `attachments`.
- **Phục vụ:** FE-03/05/06/07/08/09.
- **Lý do tồn tại:** Thông tin tệp, người tải, nguồn hồ sơ/dòng và thông tin kiểm tra tệp.
- **DB đang có:** khoảng 5 bản ghi; model `Evidence`.
- **Cần hỏi trước duyệt:** Loại tệp và mức bắt buộc mỗi bước; quyền đọc/tải; lưu trữ riêng; không phát tán URL công khai.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### D07 — Chứng từ nguồn bên ngoài

- **Hiện tại → đề xuất:** `external_references` → `external_documents`.
- **Phục vụ:** FE-06/07/09.
- **Lý do tồn tại:** MISA/giấy tờ/nguồn ngoài, số/ngày/trạng thái xác minh và bằng chứng; không thực hiện thu tiền.
- **DB đang có:** khoảng 3 bản ghi; model `ExternalReference`.
- **Cần hỏi trước duyệt:** SO nhập nguồn ngay khi tạo; lúc nào Accountant xác minh; có phát hành hóa đơn hay chỉ tham chiếu.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### D08 — Dòng hàng chứng từ ngoài

- **Hiện tại → đề xuất:** `external_reference_lines` → `external_document_items`.
- **Phục vụ:** FE-06/07/09.
- **Lý do tồn tại:** Sản phẩm, lượng và định danh dòng nguồn để chống sao chép/hoàn trả trùng.
- **DB đang có:** khoảng 3 bản ghi; model `ExternalReferenceLine`.
- **Cần hỏi trước duyệt:** Nhúng hay tách; nguồn lịch sử thiếu dòng; lượng đã giao/trả còn lại có căn cứ.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### E01 — Đánh giá điều kiện trả hàng

- **Hiện tại → đề xuất:** `customer_return_assessments` → `return_inspections`.
- **Phục vụ:** FE-07.
- **Lý do tồn tại:** Kết quả theo phiên bản về tình trạng, bao bì, đã dùng, nguồn và điều kiện trả.
- **DB đang có:** khoảng 1 bản ghi; model `CustomerReturnAssessment`.
- **Cần hỏi trước duyệt:** Tách kiểm nhận vật lý và quyết định chấp nhận; không tự đặt thời hạn trả; lưu lần đánh giá cũ.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### E02 — Lượng nguồn đang đề nghị nhận lại

- **Hiện tại → đề xuất:** `return_source_claims` → `return_quantity_claims`.
- **Phục vụ:** FE-07.
- **Lý do tồn tại:** Ngăn cùng lượng đã giao/đã xuất bị đề nghị nhận lại nhiều lần đồng thời.
- **DB đang có:** khoảng 2 bản ghi; model `ReturnSourceClaim`.
- **Cần hỏi trước duyệt:** CR theo khách đã nhận; FD theo xuất chưa giao; giữ/chuyển consumed/hủy claim; không coi claim là tồn.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### E03 — Mở lại lượng cần giao

- **Hiện tại → đề xuất:** `demand_reopenings` → `delivery_demand_reopenings`.
- **Phục vụ:** FE-06/07.
- **Lý do tồn tại:** Ghi lượng giao thất bại đã thực nhập về được giao lại trên đơn cũ.
- **DB đang có:** khoảng 1 bản ghi; model `DemandReopening`.
- **Cần hỏi trước duyệt:** Chỉ mở sau nhận thực; không mở cho CR thông thường; liên kết lần giao lại hoặc hủy.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### E04 — Chuyển lượng cam kết giữa lệnh giao

- **Hiện tại → đề xuất:** `od_commitment_transfers` → `delivery_commitment_transfers`.
- **Phục vụ:** FE-06/07.
- **Lý do tồn tại:** Chuyển nghĩa vụ giao lại từ OD cũ sang OD thay thế mà không nhân nhu cầu.
- **DB đang có:** khoảng 1 bản ghi; model `OdCommitmentTransfer`.
- **Cần hỏi trước duyệt:** Có thực sự cho OD thay thế không; nếu bỏ bảng cần cơ chế khác giữ lượng ròng.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### E05 — Lịch sử hủy lượng đơn bán

- **Hiện tại → đề xuất:** `sales_order_cancellations` → `sales_order_cancellations`.
- **Phục vụ:** FE-06.
- **Lý do tồn tại:** Ghi dòng/lượng/lý do hủy đủ điều kiện, không xóa lịch sử đã xuất hoặc đã giao.
- **DB đang có:** khoảng 1 bản ghi; model `SalesOrderCancellation`.
- **Cần hỏi trước duyệt:** Hủy phần chưa làm hoặc hàng đã quay về; ai hủy; giải phóng giữ hàng và nhiệm vụ liên quan.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### E06 — Khóa sử dụng hàng có vấn đề

- **Hiện tại → đề xuất:** `defect_holds` → `stock_holds`.
- **Phục vụ:** FE-07/08.
- **Lý do tồn tại:** Chặn cấp hàng khi phát hiện lỗi; bản ghi giữ hàng không tự đổi lượng hoặc chất lượng.
- **DB đang có:** khoảng 1 bản ghi; model `DefectHold`.
- **Cần hỏi trước duyệt:** Khóa toàn số dư hay tách phần lỗi; ai mở khóa; khác reservation; giữ khóa khi đang kiểm kê.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### F01 — Tồn tại thời điểm khóa kiểm kê

- **Hiện tại → đề xuất:** `stocktake_snapshots` → `stocktake_snapshots`.
- **Phục vụ:** FE-08.
- **Lý do tồn tại:** Bản chụp bất biến làm mốc so sánh, khác số dư hiện tại.
- **DB đang có:** khoảng 1 bản ghi; model `StocktakeSnapshot`.
- **Cần hỏi trước duyệt:** Phạm vi, thời điểm khóa; hàng phát hiện ngoài danh sách; lưu dòng hay nhúng có giới hạn.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### F02 — Các lần đếm kiểm kê

- **Hiện tại → đề xuất:** `count_attempts` → `stocktake_counts`.
- **Phục vụ:** FE-08.
- **Lý do tồn tại:** Mỗi lần đếm/đếm lại có người, thời gian, lượng và chất lượng; giữ lịch sử.
- **DB đang có:** khoảng 1 bản ghi; model `CountAttempt`.
- **Cần hỏi trước duyệt:** Chưa đếm khác số 0; ai chọn kết quả cuối; không ghi đè lần đếm trước.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### F03 — Vị trí đang khóa kiểm kê

- **Hiện tại → đề xuất:** `location_locks` → `stocktake_location_locks`.
- **Phục vụ:** FE-08.
- **Lý do tồn tại:** Chặn giao dịch tại phạm vi kiểm kê đến khi hoàn tất xử lý hợp lệ.
- **DB đang có:** khoảng 1 bản ghi; model `LocationLock`.
- **Cần hỏi trước duyệt:** Khóa theo ô/khu/kho; task dở; quyền kích hoạt/mở khóa; lỗi ghi tồn phải giữ khóa.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### G01 — Thông báo cho từng người

- **Hiện tại → đề xuất:** `notifications` → `notifications`.
- **Phục vụ:** FE-01/06/08/09.
- **Lý do tồn tại:** Thông báo theo người nhận và quyền nguồn; readAt không đồng nghĩa nhu cầu đã xử lý.
- **DB đang có:** khoảng 0 bản ghi; model `Notification`.
- **Cần hỏi trước duyệt:** Loại thông báo, người nhận, thời gian lưu; SMTP hay trong ứng dụng; cảnh báo tính lại khi mở.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### G02 — Lịch sử thao tác

- **Hiện tại → đề xuất:** `audit_events` → `audit_logs`.
- **Phục vụ:** FE-09.
- **Lý do tồn tại:** Ai làm gì với hồ sơ nào, khi nào; khác lịch sử biến động tồn.
- **DB đang có:** khoảng 51 bản ghi; model `AuditEvent`.
- **Cần hỏi trước duyệt:** Phạm vi đọc, trường thay đổi, dữ liệu nhạy cảm, thời hạn lưu; không cho sửa dấu vết.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### G03 — Sự kiện xử lý sau khi lưu

- **Hiện tại → đề xuất:** `outbox_events` → `system_events`.
- **Phục vụ:** Hỗ trợ FE-09.
- **Lý do tồn tại:** Lưu sự kiện cùng giao dịch để gửi thông báo/xử lý tiếp và thử lại khi lỗi.
- **DB đang có:** khoảng 51 bản ghi; model `OutboxEvent`.
- **Cần hỏi trước duyệt:** Các consumer thực có; trạng thái gửi; retry không thực hiện lại xuất/nhập; không phải màn hình nhập tay.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### G04 — Dấu vết chống thực hiện trùng

- **Hiện tại → đề xuất:** `business_operations` → `operation_records`.
- **Phục vụ:** Hỗ trợ nhiều FE.
- **Lý do tồn tại:** Khóa yêu cầu, dấu vân tay dữ liệu và kết quả lần xử lý; dùng cho thao tác không nhất thiết đổi tồn.
- **DB đang có:** khoảng 6 bản ghi; model `BusinessOperation`.
- **Cần hỏi trước duyệt:** Thời hạn giữ và trả kết quả cũ; khác stock_transactions và audit_logs; không bỏ chỉ vì khó hiểu.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### G05 — Kiểm soát lập bổ sung đồng thời

- **Hiện tại → đề xuất:** `replenishment_planning_guards` → `replenishment_locks`.
- **Phục vụ:** Hỗ trợ FE-01.
- **Lý do tồn tại:** Phiên bản chung cho sản phẩm/kho khi đánh giá và tạo nhu cầu bổ sung.
- **DB đang có:** khoảng 0 bản ghi; model `ReplenishmentPlanningGuard`.
- **Cần hỏi trước duyệt:** Giữ riêng hay tích hợp; không hiểu là khóa giữ hàng hoặc khóa kiểm kê.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

### G06 — Kiểm soát nguồn trả đồng thời — cần xác minh

- **Hiện tại → đề xuất:** `return_source_guards` → `return_source_locks`.
- **Phục vụ:** Hỗ trợ FE-07.
- **Lý do tồn tại:** Collection đang tồn tại nhưng rỗng; chưa thấy model export tương ứng trong source hiện tại.
- **DB đang có:** khoảng 0 bản ghi; chưa tìm thấy model export tương ứng.
- **Cần hỏi trước duyệt:** Xác định nguồn tạo/mục đích trước khi giữ, gộp hoặc bỏ; không xóa dựa vào việc hiện rỗng.
- **Quan hệ, trường mới và cách lưu:** sẽ chốt trong phiếu riêng của mục này; metadata cũ xem [03_Cau_truc_DB_hien_tai.md](03_Cau_truc_DB_hien_tai.md).
- **Ý kiến người dùng:** chưa nhận.
- **Kết luận:** CHƯA DUYỆT.

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
