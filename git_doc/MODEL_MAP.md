# Bản đồ model WMSD

Mốc schema 04/11, cập nhật 05/11/2026. Đủ 74 collection nghiệp vụ. Không có collection marker kỹ thuật. Bảng này định hướng file cần đọc, xem Data Dictionary để tra từng field và index.

[Từ điển dữ liệu](docs/03_thiet_ke/DB_Current_2026-11-04/WMSD_Data_Dictionary.md) · [Phiếu duyệt](docs/03_thiet_ke/DB_Rebuild_Review/01_Danh_muc_duyet.md)

## Registry và các file cùng tác động

Đăng ký model chính qua `src/models/index.js` bằng `registerReviewedModels(connection)`. Các file triển khai nằm dưới `src/models/rebuild`: map collection tại `collections.js`, remap ref tại `references.js`, danh mục tại `catalogue.js`, tồn tại `stock.js`, phiếu tại `documents.js` + `reviewed-workflows.js`, hỗ trợ tại `reviewed-support.js` và sự kiện tại `reviewed-events.js`. Header và 19 kiểu details còn kế thừa schema legacy; sửa loại dòng chung phải rà tất cả phiếu sử dụng.

Một số model kế thừa được chỉ ra bên dưới. Kiểm factory hiện tại trước khi sửa vì profile mới và profile migration dùng connection riêng.

## Toàn bộ collection

| Collection | Một bản ghi dùng để làm gì | Nơi bắt đầu đọc trong src/models |
|---|---|---|
| `users` | Tài khoản nhân viên: một vai trò, nhiều kho được phân công; mật khẩu được băm. | catalogue.js |
| `roles` | Vai trò có sẵn hoặc do Administrator tạo; giữ danh sách quyền được chọn. | catalogue.js |
| `permissions` | Danh mục quyền thao tác có sẵn, phân nhóm theo chức năng. | catalogue.js |
| `warehouses` | Kho vật lý, thông tin nhận diện và kích thước sử dụng được. | catalogue.js |
| `warehouse_locations` | Ô/vị trí thuộc một kho, loại ô và kích thước phục vụ kiểm sức chứa. | catalogue.js |
| `products` | Sản phẩm nhận diện bằng hãng và SKU của hãng; đơn vị gốc lưu trực tiếp. | catalogue.js |
| `customers` | Khách hàng gồm mã WMSD, tên và điện thoại; không lưu địa chỉ giao mặc định. | catalogue.js |
| `suppliers` | Nhà cung cấp và thông tin liên hệ; theo dõi trạng thái chờ/kích hoạt/ngừng. | catalogue.js |
| `delivery_teams` | Đội vận chuyển nội bộ của shop, dùng để chọn khi bàn giao. | catalogue.js |
| `storage_stacks` | Chồng/cụm hàng tại một ô, có kích thước bao ngoài để kiểm diện tích/thể tích. | catalogue.js |
| `storage_stack_items` | Hàng trong chồng theo số dư, quy cách và trạng thái đóng gói; không tạo tồn thứ hai. | catalogue.js |
| `stock_holding_points` | Điểm theo dõi tồn: một ô kho hoặc phần hàng đang chuyển theo dòng xuất. | stock.js |
| `inventory_balances` | Số dư theo điểm tồn, lô, chất lượng và chủ sở hữu; lượng dùng đơn vị gốc. | stock.js |
| `stock_transactions` | Một lần ghi tồn đã thành công, liên kết nghiệp vụ nguồn và mã chống ghi lặp. | stock.js |
| `stock_movements` | Các dòng biến động của giao dịch tồn; lưu số trước/sau ở nhóm tồn nguồn và đích. | stock.js |
| `stock_reservations` | Giữ hàng thực tế cho nhu cầu và lệnh thực hiện; theo dõi đã dùng, giải phóng hoặc chuyển. | reviewed-support.js |
| `supply_allocations` | Phân bổ nguồn dự kiến từ PO/TR cho nhu cầu; không cộng như tồn thực tế. | reviewed-support.js |
| `approval_history` | Lịch sử quyết định theo đúng phiên bản phiếu/dòng, người quyết định và căn cứ. | reviewed-support.js |
| `attachments` | Metadata ảnh/PDF và quyền truy cập bằng chứng; dữ liệu tệp lưu theo storageKey. | reviewed-support.js |
| `return_inspections` | Các lần kiểm hàng khách trả, giữ lịch sử thay vì ghi đè kết quả trước. | reviewed-support.js |
| `return_quantity_claims` | Giữ hạn mức theo nguồn giao/nhận để không đề nghị trả vượt lượng còn được trả. | reviewed-support.js |
| `delivery_demand_reopenings` | Mở lại đúng lượng thực về trên nhu cầu của SO/WIR/lệnh giao ban đầu. | reviewed-support.js |
| `delivery_commitment_transfers` | Chuyển quyền giao bù từ lệnh cũ sang lệnh mới, tránh giao trùng cùng lượng. | reviewed-support.js |
| `sales_order_cancellations` | Ghi hủy phần chưa giao hoặc đã về kho đủ điều kiện, có căn cứ và lịch sử. | reviewed-support.js |
| `stock_holds` | Chặn đúng phần hàng nghi lỗi và lưu lịch sử phân bổ/mở chặn. | reviewed-support.js |
| `stocktake_snapshots` | Số tồn làm mốc theo ô/lô/chủ/chất lượng tại lúc khóa phạm vi. | reviewed-support.js |
| `stocktake_counts` | Các lần đếm/đếm lại, đơn vị/quy đổi và bằng chứng; chưa đếm khác với đã xác nhận 0. | reviewed-support.js |
| `stocktake_location_locks` | Lịch sử khóa ô khi kiểm kê; mỗi ô chỉ có một khóa đang hiệu lực. | reviewed-support.js |
| `notifications` | Thông báo theo nhân viên và trạng thái đọc; kèm theo dõi gửi email SMTP. | reviewed-events.js |
| `audit_logs` | Nhật ký người thao tác, kết quả và thay đổi; tách khỏi lịch sử số lượng tồn. | reviewed-events.js |
| `system_events` | Công việc sau khi lưu thành công, như gửi thông báo/email và thử lại độc lập. | reviewed-events.js |
| `operation_records` | Ghi kết quả thao tác theo mã yêu cầu để chống xử lý lặp và liên kết kết quả. | reviewed-events.js |
| `replenishment_locks` | Phối hợp xử lý đồng thời theo kho/sản phẩm để tránh lập bổ sung trùng. | reviewed-events.js |
| `return_source_locks` | Phối hợp xử lý đồng thời theo nguồn trả; hạn mức thực tế ở return_quantity_claims. | reviewed-events.js |
| `external_references` | Hồ sơ chứng từ nguồn bên ngoài. D07 còn chờ chốt người/quy trình xác minh; không tích hợp MISA. | legacy/index.js (ExternalReference kế thừa) |
| `external_reference_lines` | Dòng của hồ sơ nguồn bên ngoài; D08 còn chờ chốt nghiệp vụ xác minh. | legacy/index.js (ExternalReferenceLine kế thừa) |
| `product_batches` | Lô theo sản phẩm, mã trên thùng, tông màu và cỡ; không tách theo nhà cung cấp nếu khớp. | legacy/index.js (Lot kế thừa product.model.js) |
| `stock_thresholds` | Mức tối thiểu và mục tiêu của một sản phẩm tại một kho. | legacy/index.js (ProductWarehousePolicy kế thừa product.model.js) |
| `replenishment_requests` | Yêu cầu bổ sung cho một kho; các dòng lưu lượng đề nghị, lượng duyệt và căn cứ nhu cầu. | documents.js + reviewed-workflows.js |
| `purchase_orders` | Đơn mua theo một RR, một nhà cung cấp và một kho; lưu giá mua, tổng tiền và lịch giao. | documents.js + reviewed-workflows.js |
| `goods_arrivals` | Mỗi lần hàng mua thực đến; giữ lịch sử kể cả khi từ chối toàn bộ, chưa tự tăng tồn sở hữu. | documents.js + reviewed-workflows.js |
| `goods_inspections` | Kết quả kiểm nhận theo từng phần hàng đến, chất lượng và quyết định sở hữu/giữ hộ/từ chối. | documents.js + reviewed-workflows.js |
| `purchase_receipts` | Phiếu nhận sở hữu hàng mua theo PO và kiểm nhận; có giao dịch tồn khi xác nhận. | documents.js + reviewed-workflows.js |
| `transfer_orders` | TO dùng chung cho chuyển ô, lấy hàng và xếp hàng; ghi nguồn/đích và xác nhận trọn lệnh một lần. | documents.js + reviewed-workflows.js |
| `warehouse_transfer_requests` | TR chuyển giữa hai kho: lượng đề nghị/duyệt và tiến độ; một TR có nhiều phiếu xuất. | documents.js + reviewed-workflows.js |
| `internal_transfer_requirements` | Yêu cầu lấy/xếp hàng theo phiếu xuất hoặc nhận, là căn cứ tự sinh TO. | documents.js + reviewed-workflows.js |
| `transfer_dispatches` | Phiếu xuất điều chuyển từng đợt theo TR; chứa bàn giao và lượng thực xuất sang đang chuyển. | documents.js + reviewed-workflows.js |
| `transfer_receipts` | Phiếu nhận một phần hoặc toàn bộ hàng của phiếu xuất; tách hàng đạt và hàng lỗi tại kho đích. | documents.js + reviewed-workflows.js |
| `sales_orders` | Đơn bán có khách hàng, giá và quy đổi trên từng dòng; lưu tham chiếu đơn nguồn. | documents.js + reviewed-workflows.js |
| `warehouse_issue_requests` | Yêu cầu xuất do Sales chia từ đơn bán; mới lập chưa giữ hoặc trừ tồn. | documents.js + reviewed-workflows.js |
| `delivery_orders` | Lệnh giao một đợt từ một kho theo WIR; có lịch, người nhận, địa chỉ và lượng cam kết. | documents.js + reviewed-workflows.js |
| `sales_goods_issues` | Phiếu thực xuất bán theo lệnh giao; lưu lô, lượng, giá chụp tại nguồn và bàn giao nhúng. | documents.js + reviewed-workflows.js |
| `delivery_confirmations` | Kết quả khách thực nhận theo phiếu xuất; lượng nhận hợp lệ dùng tính hóa đơn. | documents.js + reviewed-workflows.js |
| `external_payment_confirmations` | Sales xác nhận đã nhận đủ tiền bên ngoài để hoàn thành SO; không quản lý thanh toán/công nợ. | documents.js + reviewed-workflows.js |
| `defect_reports` | Hồ sơ phần hàng nghi lỗi, nguồn phát hiện, dấu hiệu, bằng chứng và các lần kiểm. | documents.js + reviewed-workflows.js |
| `defect_resolution_plans` | Phương án xử lý lỗi theo lượng: trả NCC, hủy, kiểm lại hoặc hướng xử lý đủ căn cứ. | documents.js + reviewed-workflows.js |
| `stock_scrap_records` | Phiếu thực hủy theo phương án duyệt; chỉ trừ đúng lượng thực hủy. | documents.js + reviewed-workflows.js |
| `stocktakes` | Đợt kiểm kê theo kho/phạm vi, lịch, người đếm, mốc kích hoạt và chốt. | documents.js + reviewed-workflows.js |
| `stock_adjustments` | Phiếu điều chỉnh số lượng theo phần thiếu/thừa được duyệt khi chốt kiểm kê. | documents.js + reviewed-workflows.js |
| `failed_deliveries` | Phần hàng đã xuất nhưng khách không nhận, gồm lý do, lượng và người đang giữ. | documents.js + reviewed-workflows.js |
| `failed_delivery_receipts` | Phiếu nhận thực tế hàng giao thất bại quay về kho; không cộng hàng còn trên xe. | documents.js + reviewed-workflows.js |
| `stocktake_resolution_plans` | Phương án đối chiếu đếm với sổ, duyệt xử lý và ghi kết quả trước khi chốt. | documents.js + reviewed-workflows.js |
| `stock_quality_changes` | Phiếu chuyển lượng giữa trạng thái chất lượng; tổng lượng và vị trí không tự thay đổi. | documents.js + reviewed-workflows.js |
| `customer_returns` | Yêu cầu trả sau khi khách đã nhận; có kết quả kiểm và quyết định theo từng phần. | documents.js + reviewed-workflows.js |
| `customer_return_receipts` | Nhập sở hữu lượng được chấp nhận trả; có thể chuyển chủ hàng từ giữ hộ mà không cộng vật lý lần nữa. | documents.js + reviewed-workflows.js |
| `supplier_returns` | Đề nghị trả NCC và thỏa thuận được Accountant xác minh theo dòng. | documents.js + reviewed-workflows.js |
| `supplier_return_issues` | Phiếu thực xuất trả phần thuộc cửa hàng theo lượng đã thống nhất với NCC. | documents.js + reviewed-workflows.js |
| `supplier_acknowledgements` | Kết quả NCC thực nhận hàng trả và đối chiếu từng dòng xuất. | documents.js + reviewed-workflows.js |
| `stock_discrepancies` | Hồ sơ thiếu/thừa/sai/hỏng và chứng từ giải quyết; không tự xóa lượng chưa rõ. | documents.js + reviewed-workflows.js |
| `custody_receipts` | Nhận vật lý hàng thuộc khách/NCC; chiếm chỗ nhưng chưa thuộc cửa hàng. | documents.js + reviewed-workflows.js |
| `custody_releases` | Bàn giao lại hàng giữ hộ chưa chuyển sang sở hữu cửa hàng. | documents.js + reviewed-workflows.js |
| `stock_reversals` | Phiếu đề nghị/duyệt đảo toàn bộ lần ghi tồn sai đủ điều kiện, giữ liên kết giao dịch gốc. | documents.js + reviewed-workflows.js |
| `opening_stocks` | Phiếu số dư ban đầu đã đối chiếu/xác minh theo ô, lô, chất lượng và chủ hàng. | documents.js + reviewed-workflows.js |
| `sales_invoices` | Hóa đơn tổng hợp một SO: từng dòng có phiếu/ngày xuất, lượng xuất, lượng nhận và giá tính tiền. | documents.js → invoiceSchema |

## Khi thay một model

Tìm collection, ref, model name và các trường liên quan bằng `rg` trong `src/modules`, `src/seeds`, `src/migrations`, `test` và `git_doc`. Kiểm bên tiêu thụ trước khi đổi tên/kiểu. Cập nhật mục tương ứng trong Data Dictionary và sơ đồ nếu cấu trúc đổi, thêm test hành vi cần bảo vệ, ghi cả hai changelog. Lưu ý source reference tới `_id` dòng nhúng phải kèm chứng từ đúng cha.
