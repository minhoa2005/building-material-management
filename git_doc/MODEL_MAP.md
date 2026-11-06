# Bản đồ model WMSD

Mốc schema 06/11/2026. Có 59 collection nghiệp vụ; không quản lý danh mục đội xe. Biển số xe được ghi trực tiếp trên lần bàn giao. Không có collection marker kỹ thuật. Bảng này định hướng file cần đọc, xem DB diagram kiểu SQL để tra field/ref hiện hành.

[Từ điển dữ liệu](docs/03_thiet_ke/DB_Current_2026-11-06_59_v8/WMSD_Data_Dictionary.md) · [Rà trường từng bảng](docs/03_thiet_ke/DB_Rebuild_Review/38_Ra_soat_truong_58_bang.md) · [Phiếu duyệt](docs/03_thiet_ke/DB_Rebuild_Review/01_Danh_muc_duyet.md)

## Registry và các file cùng tác động

Sau merge main 06/11/2026: registry legacy còn 44 collection cho API cũ, có thêm purchase.model.js và export ReplenishmentSubmission. Không phải phần mở rộng bộ 59 schema mới. Profile migration đọc schema chứng từ/dòng/enum lịch sử trong rebuild/historical; seed reviewed dùng fixture EJSON riêng. [Phạm vi, field và tương thích sau merge](docs/09_phat_trien/MERGE_MAIN_2026-11-06.md).

**Bản v6:** products tách kích thước từng viên và màu. Lô giữ productId + manufacturerLot, số viên/thùng cố định và kích thước ngoài thùng; bỏ calibre/tone. Xem [quyết định và cách tính sức chứa](docs/03_thiet_ke/DB_Rebuild_Review/39_San_pham_va_lo_dang_chot.md). DB mẫu hiện hành: wmsd_demo_tile_shop_v8, thêm 5 category; Atlas: wmsd_database.

Schema v5 còn 58 bảng, bỏ 44 đường dẫn trường trùng/thừa. Quy tắc lược trường ở `field-cleanup.js` áp dụng cho profile reviewed và dữ liệu đã gộp. Giữ version cho phiếu/tồn/phân quyền/khóa và các mốc nguồn; bỏ revision đầu phiếu bị trùng. Ngưỡng lấy productId từ cha, dòng nguồn lấy referenceId từ cha, quy cách tồn lấy balanceId từ cha. Bốn danh mục products/warehouses/customers/suppliers dùng updatedAt khi kiểm sửa đồng thời ở API được port.

Đăng ký model chính qua `src/models/index.js` bằng `registerReviewedModels(connection)`. `reviewed-registry.js` nạp 59 file `*.model.js` ngay trong `src/models`, mỗi file khai báo một schema collection. 96 schema nhúng nằm trong `embedded/*.model.js`, mỗi schema một file, không tạo collection riêng. Các header, details và lịch sử nhúng hiện đã tách khỏi model legacy.

`legacy/` giữ mã cũ cho API chưa port. `rebuild/` giữ registry, map/ref, helper và profile migration lịch sử; các builder gộp cũ không được dùng để dựng profile reviewed hiện hành. Khi sửa model mới, sửa file được chỉ ra bên dưới. [Cách tổ chức và triển khai Atlas](docs/09_phat_trien/ATLAS_DEPLOYMENT.md).

## Toàn bộ collection

| Collection | Một bản ghi dùng để làm gì | Nơi bắt đầu đọc trong src/models |
|---|---|---|
| `users` | Tài khoản nhân viên: một vai trò, nhiều kho được phân công; mật khẩu được băm. | [user.model.js](../src/models/user.model.js) |
| `roles` | Vai trò có sẵn hoặc do Administrator tạo; giữ danh sách quyền được chọn. | [role.model.js](../src/models/role.model.js) |
| `permissions` | Danh mục quyền thao tác có sẵn, phân nhóm theo chức năng. | [permission.model.js](../src/models/permission.model.js) |
| `warehouses` | Kho vật lý, thông tin nhận diện và kích thước sử dụng được. | [warehouse.model.js](../src/models/warehouse.model.js) |
| `warehouse_locations` | Ô/vị trí thuộc một kho, loại ô và kích thước phục vụ kiểm sức chứa. | [warehouse-location.model.js](../src/models/warehouse-location.model.js) |
| `categories` | Nhóm phân loại sản phẩm: 5 nhóm đã duyệt, mỗi sản phẩm thuộc một category. | [category.model.js](../src/models/category.model.js) |
| `products` | Hãng + SKU + màu; categoryId thuộc một nhóm; dài/rộng/cao từng viên (mm), đơn vị gốc lưu trực tiếp. | [product.model.js](../src/models/product.model.js) |
| `customers` | Khách hàng gồm mã WMSD, tên và điện thoại; không lưu địa chỉ giao mặc định. | [customer.model.js](../src/models/customer.model.js) |
| `suppliers` | Nhà cung cấp và thông tin liên hệ; theo dõi trạng thái chờ/kích hoạt/ngừng. | [supplier.model.js](../src/models/supplier.model.js) |
| `stock_holding_points` | Điểm theo dõi tồn: một ô kho hoặc phần hàng đang chuyển theo dòng xuất. | [stock-holding-point.model.js](../src/models/stock-holding-point.model.js) |
| `inventory_balances` | Số dư theo điểm tồn, lô, chất lượng và chủ sở hữu; lượng dùng đơn vị gốc. | [inventory-balance.model.js](../src/models/inventory-balance.model.js) |
| `stock_transactions` | Một lần ghi tồn đã thành công, liên kết nghiệp vụ nguồn và mã chống ghi lặp. | [stock-transaction.model.js](../src/models/stock-transaction.model.js) |
| `stock_reservations` | Giữ hàng thực tế cho nhu cầu và lệnh thực hiện; theo dõi đã dùng, giải phóng hoặc chuyển. | [stock-reservation.model.js](../src/models/stock-reservation.model.js) |
| `supply_allocations` | Phân bổ nguồn dự kiến từ PO/TR cho nhu cầu; không cộng như tồn thực tế. | [supply-allocation.model.js](../src/models/supply-allocation.model.js) |
| `approval_history` | Lịch sử quyết định theo đúng phiên bản phiếu/dòng, người quyết định và căn cứ. | [approval-history.model.js](../src/models/approval-history.model.js) |
| `attachments` | Metadata ảnh/PDF và quyền truy cập bằng chứng; dữ liệu tệp lưu theo storageKey. | [attachment.model.js](../src/models/attachment.model.js) |
| `return_quantity_claims` | Giữ hạn mức theo nguồn giao/nhận để không đề nghị trả vượt lượng còn được trả. | [return-quantity-claim.model.js](../src/models/return-quantity-claim.model.js) |
| `stocktake_snapshots` | Số tồn làm mốc theo ô/lô/chủ/chất lượng tại lúc khóa phạm vi. | [stocktake-snapshot.model.js](../src/models/stocktake-snapshot.model.js) |
| `stocktake_counts` | Các lần đếm/đếm lại, đơn vị/quy đổi và bằng chứng; chưa đếm khác với đã xác nhận 0. | [stocktake-count.model.js](../src/models/stocktake-count.model.js) |
| `stocktake_location_locks` | Lịch sử khóa ô khi kiểm kê; mỗi ô chỉ có một khóa đang hiệu lực. | [stocktake-location-lock.model.js](../src/models/stocktake-location-lock.model.js) |
| `notifications` | Thông báo theo nhân viên và trạng thái đọc; kèm theo dõi gửi email SMTP. | [notification.model.js](../src/models/notification.model.js) |
| `audit_logs` | Nhật ký người thao tác, kết quả và thay đổi; tách khỏi lịch sử số lượng tồn. | [audit-log.model.js](../src/models/audit-log.model.js) |
| `system_events` | Công việc sau khi lưu thành công, như gửi thông báo/email và thử lại độc lập. | [system-event.model.js](../src/models/system-event.model.js) |
| `operation_records` | Ghi kết quả thao tác theo mã yêu cầu để chống xử lý lặp và liên kết kết quả. | [operation-record.model.js](../src/models/operation-record.model.js) |
| `replenishment_locks` | Phối hợp xử lý đồng thời theo kho/sản phẩm để tránh lập bổ sung trùng. | [replenishment-lock.model.js](../src/models/replenishment-lock.model.js) |
| `return_source_locks` | Phối hợp xử lý đồng thời theo nguồn trả; hạn mức thực tế ở return_quantity_claims. | [return-source-lock.model.js](../src/models/return-source-lock.model.js) |
| `external_references` | Hồ sơ chứng từ nguồn bên ngoài. D07 còn chờ chốt người/quy trình xác minh; không tích hợp MISA. | [external-reference.model.js](../src/models/external-reference.model.js) |
| `product_batches` | Lô theo productId + manufacturerLot; số viên/thùng cố định và kích thước ngoài thùng (mm). Không có calibre/tone. | [product-batch.model.js](../src/models/product-batch.model.js) |
| `replenishment_requests` | Yêu cầu bổ sung cho một kho; các dòng lưu lượng đề nghị, lượng duyệt và căn cứ nhu cầu. | [replenishment-request.model.js](../src/models/replenishment-request.model.js) |
| `purchase_orders` | Đơn mua theo một RR, một nhà cung cấp và một kho; lưu giá mua, tổng tiền và lịch giao. | [purchase-order.model.js](../src/models/purchase-order.model.js) |
| `goods_arrivals` | Mỗi lần hàng mua thực đến; giữ lịch sử kể cả khi từ chối toàn bộ, chưa tự tăng tồn sở hữu. | [goods-arrival.model.js](../src/models/goods-arrival.model.js) |
| `goods_inspections` | Kết quả kiểm nhận theo từng phần hàng đến, chất lượng và quyết định sở hữu/giữ hộ/từ chối. | [goods-inspection.model.js](../src/models/goods-inspection.model.js) |
| `purchase_receipts` | Phiếu nhận sở hữu hàng mua theo PO và kiểm nhận; có giao dịch tồn khi xác nhận. | [purchase-receipt.model.js](../src/models/purchase-receipt.model.js) |
| `transfer_orders` | TO dùng chung cho chuyển ô, lấy hàng và xếp hàng; ghi nguồn/đích và xác nhận trọn lệnh một lần. | [transfer-order.model.js](../src/models/transfer-order.model.js) |
| `warehouse_transfer_requests` | TR chuyển giữa hai kho: lượng đề nghị/duyệt và tiến độ; một TR có nhiều phiếu xuất. | [warehouse-transfer-request.model.js](../src/models/warehouse-transfer-request.model.js) |
| `internal_transfer_requirements` | Yêu cầu lấy/xếp hàng theo phiếu xuất hoặc nhận, là căn cứ tự sinh TO. | [internal-transfer-requirement.model.js](../src/models/internal-transfer-requirement.model.js) |
| `transfer_dispatches` | Phiếu xuất điều chuyển từng đợt theo TR; chứa bàn giao và lượng thực xuất sang đang chuyển. | [transfer-dispatch.model.js](../src/models/transfer-dispatch.model.js) |
| `transfer_receipts` | Phiếu nhận một phần hoặc toàn bộ hàng của phiếu xuất; tách hàng đạt và hàng lỗi tại kho đích. | [transfer-receipt.model.js](../src/models/transfer-receipt.model.js) |
| `sales_orders` | Đơn bán có khách hàng, giá và quy đổi trên từng dòng; lưu tham chiếu đơn nguồn. | [sales-order.model.js](../src/models/sales-order.model.js) |
| `warehouse_issue_requests` | Yêu cầu xuất do Sales chia từ đơn bán; mới lập chưa giữ hoặc trừ tồn. | [warehouse-issue-request.model.js](../src/models/warehouse-issue-request.model.js) |
| `delivery_orders` | Lệnh giao một đợt từ một kho theo WIR; có lịch, người nhận, địa chỉ và lượng cam kết. | [delivery-order.model.js](../src/models/delivery-order.model.js) |
| `sales_goods_issues` | Phiếu thực xuất bán theo lệnh giao; lưu lô, lượng, giá chụp tại nguồn và bàn giao nhúng. | [sales-goods-issue.model.js](../src/models/sales-goods-issue.model.js) |
| `defect_reports` | Hồ sơ phần hàng nghi lỗi, nguồn phát hiện, dấu hiệu, bằng chứng và các lần kiểm. | [defect-report.model.js](../src/models/defect-report.model.js) |
| `stock_scrap_records` | Phiếu thực hủy theo phương án duyệt; chỉ trừ đúng lượng thực hủy. | [stock-scrap-record.model.js](../src/models/stock-scrap-record.model.js) |
| `stocktakes` | Đợt kiểm kê theo kho/phạm vi, lịch, người đếm, mốc kích hoạt và chốt. | [stocktake.model.js](../src/models/stocktake.model.js) |
| `stock_adjustments` | Phiếu điều chỉnh số lượng theo phần thiếu/thừa được duyệt khi chốt kiểm kê. | [stock-adjustment.model.js](../src/models/stock-adjustment.model.js) |
| `failed_deliveries` | Phần hàng đã xuất nhưng khách không nhận, gồm lý do, lượng và người đang giữ. | [failed-delivery.model.js](../src/models/failed-delivery.model.js) |
| `failed_delivery_receipts` | Phiếu nhận thực tế hàng giao thất bại quay về kho; không cộng hàng còn trên xe. | [failed-delivery-receipt.model.js](../src/models/failed-delivery-receipt.model.js) |
| `stock_quality_changes` | Phiếu chuyển lượng giữa trạng thái chất lượng; tổng lượng và vị trí không tự thay đổi. | [stock-quality-change.model.js](../src/models/stock-quality-change.model.js) |
| `customer_returns` | Yêu cầu trả sau khi khách đã nhận; có kết quả kiểm và quyết định theo từng phần. | [customer-return.model.js](../src/models/customer-return.model.js) |
| `customer_return_receipts` | Nhập sở hữu lượng được chấp nhận trả; có thể chuyển chủ hàng từ giữ hộ mà không cộng vật lý lần nữa. | [customer-return-receipt.model.js](../src/models/customer-return-receipt.model.js) |
| `supplier_returns` | Đề nghị trả NCC và thỏa thuận được Accountant xác minh theo dòng. | [supplier-return.model.js](../src/models/supplier-return.model.js) |
| `supplier_return_issues` | Phiếu thực xuất trả phần thuộc cửa hàng theo lượng đã thống nhất với NCC. | [supplier-return-issue.model.js](../src/models/supplier-return-issue.model.js) |
| `stock_discrepancies` | Hồ sơ thiếu/thừa/sai/hỏng và chứng từ giải quyết; không tự xóa lượng chưa rõ. | [stock-discrepancy.model.js](../src/models/stock-discrepancy.model.js) |
| `custody_receipts` | Nhận vật lý hàng thuộc khách/NCC; chiếm chỗ nhưng chưa thuộc cửa hàng. | [custody-receipt.model.js](../src/models/custody-receipt.model.js) |
| `custody_releases` | Bàn giao lại hàng giữ hộ chưa chuyển sang sở hữu cửa hàng. | [custody-release.model.js](../src/models/custody-release.model.js) |
| `stock_reversals` | Phiếu đề nghị/duyệt đảo toàn bộ lần ghi tồn sai đủ điều kiện, giữ liên kết giao dịch gốc. | [stock-reversal.model.js](../src/models/stock-reversal.model.js) |
| `opening_stocks` | Phiếu số dư ban đầu đã đối chiếu/xác minh theo ô, lô, chất lượng và chủ hàng. | [opening-stock.model.js](../src/models/opening-stock.model.js) |
| `sales_invoices` | Hóa đơn tổng hợp một SO: từng dòng có phiếu/ngày xuất, lượng xuất, lượng nhận và giá tính tiền. | [sales-invoice.model.js](../src/models/sales-invoice.model.js) |

## Khi thay một model

Tìm collection, ref, model name và các trường liên quan bằng `rg` trong `src/modules`, `src/seeds`, `src/migrations`, `test` và `git_doc`. Kiểm bên tiêu thụ trước khi đổi tên/kiểu. Cập nhật mục tương ứng trong Data Dictionary và sơ đồ nếu cấu trúc đổi, thêm test hành vi cần bảo vệ, ghi cả hai changelog. Lưu ý source reference tới `_id` dòng nhúng phải kèm chứng từ đúng cha.

## Cách lưu sau gộp

[Quyết định gộp 10 bảng](docs/03_thiet_ke/DB_Rebuild_Review/36_Gop_10_bang.md). Số dư tồn chứa packagingPortions[] thay chồng hàng. Registry migration chỉ dùng đọc dữ liệu lịch sử.

[Gộp tiếp 5 bảng](docs/03_thiet_ke/DB_Rebuild_Review/37_Gop_them_5_bang.md): hiện còn 58 collection.

Đã bỏ ba builder không còn importer: reviewed-events.js, reviewed-support.js, reviewed-workflows.js. [Category v8 và kiểm thư mục](docs/03_thiet_ke/DB_Rebuild_Review/40_Category_va_don_model.md).
