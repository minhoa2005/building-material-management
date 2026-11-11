# Bản đồ model WMSD

Mốc schema 09/11/2026. Có 58 collection nghiệp vụ và 1 collection kỹ thuật document_sequences (tổng 59), gồm `conversions` theo sản phẩm và lô. Năm loại phiếu nhập dùng chung `goods_receipts`. Không quản lý danh mục đội xe. Biển số xe được ghi trực tiếp trên lần bàn giao. Không có collection marker kỹ thuật.

[Từ điển dữ liệu](docs/03_thiet_ke/DB_Current_2026-11-09_57/WMSD_Data_Dictionary.md) · [Rà trường từng bảng](docs/03_thiet_ke/DB_Rebuild_Review/38_Ra_soat_truong_58_bang.md) · [Phiếu duyệt](docs/03_thiet_ke/DB_Rebuild_Review/01_Danh_muc_duyet.md)

## Registry và các file cùng tác động

The runtime uses one registry: `src/models/index.js` exports `registerModels(connection)`; `runtime.js` supplies API models. There are 59 collection schemas (`*.model.js`); `GoodsReceipt` có năm discriminator cùng collection. Nested schemas do not create collections. `registerReviewedModels` is a compatibility alias. Pure historical transforms and synthetic fixtures under `src/migrations/rebuild` and `src/seeds/rebuild` remain for regression checks.

[Hợp đồng API hiện hành](docs/08_api/GOODS_RECEIPTS.md). Các bản v8/Atlas trước đây là bằng chứng triển khai có ngày; lượt đồng bộ này không ghi lên Atlas.

## Toàn bộ collection

BF04 (07/11/2026): `internal_transfer_requirements.header.sourceDocumentId` có
unique partial index khi là ObjectId; `transfer_orders.header.requirementId`
có cùng ràng buộc. Một nguồn sinh một ITR, một ITR sinh một TO. RELOCATE không
có requirementId. Trước triển khai index lên DB đã có dữ liệu, rà và xử lý
nguồn/requirement trùng; không tự xóa bản ghi hoặc dựng lại DB.

| Collection | Một bản ghi dùng để làm gì | Nơi bắt đầu đọc trong src/models |
|---|---|---|
| `document_sequences` | Bộ đếm nguyên tử loại phiếu/đơn vị/tháng cho HieuDT; _id tiền tố, soCuoi, tenLoaiPhieu, maDonVi, ky, timestamps. | [document-sequence.model.js](../src/models/document-sequence.model.js) |
| `users` | Tài khoản nhân viên: một vai trò, nhiều kho được phân công; mật khẩu được băm. | [user.model.js](../src/models/user.model.js) |
| `roles` | Vai trò có sẵn hoặc do Administrator tạo; giữ danh sách quyền được chọn. | [role.model.js](../src/models/role.model.js) |
| `permissions` | Danh mục quyền thao tác có sẵn, phân nhóm theo chức năng. | [permission.model.js](../src/models/permission.model.js) |
| `warehouses` | Kho vật lý, thông tin nhận diện và kích thước sử dụng được. | [warehouse.model.js](../src/models/warehouse.model.js) |
| `warehouse_locations` | Ô/vị trí thuộc một kho, loại ô và kích thước phục vụ kiểm sức chứa. | [warehouse-location.model.js](../src/models/warehouse-location.model.js) |
| `categories` | Nhóm phân loại sản phẩm: 5 nhóm đã duyệt, mỗi sản phẩm thuộc một category. | [category.model.js](../src/models/category.model.js) |
| `uoms` | Danh mục đơn vị. Mã bất biến và `isCarton` đánh dấu đơn vị thùng. `Product.baseUnit` tham chiếu mã qua service. | [uom.model.js](../src/models/uom.model.js) |
| `conversions` | Hệ số Decimal128 có phiên bản theo sản phẩm, lô tùy chọn và UOM. Dòng chứng từ giữ hệ số tại thời điểm lập. | [conversion.model.js](../src/models/conversion.model.js) |
| `products` | Hãng + SKU + màu; categoryId thuộc một nhóm; dài/rộng/cao từng viên (mm), đơn vị gốc lưu trực tiếp; imageUrls lưu tối đa 5 URL HTTPS theo thứ tự. | [product.model.js](../src/models/product.model.js) |
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
| `replenishment_requests` | Yêu cầu bổ sung cho một kho. Các dòng lưu lượng đề nghị và lượng duyệt. `reasonNote` tùy chọn trên dòng hiện tại và snapshot gửi duyệt. | [replenishment-request.model.js](../src/models/replenishment-request.model.js) |
| `purchase_orders` | Đơn mua theo một RR, một nhà cung cấp và một kho; lưu giá mua, tổng tiền và lịch giao. | [purchase-order.model.js](../src/models/purchase-order.model.js) |
| `goods_arrivals` | Mỗi lần hàng mua thực đến; giữ lịch sử kể cả khi từ chối toàn bộ, chưa tự tăng tồn sở hữu. | [goods-arrival.model.js](../src/models/goods-arrival.model.js) |
| `goods_inspections` | Kết quả kiểm nhận theo từng phần hàng đến, chất lượng và quyết định sở hữu/giữ hộ/từ chối. | [goods-inspection.model.js](../src/models/goods-inspection.model.js) |
| `goods_receipts` | Phiếu nhập PURCHASE, CUSTOMER_RETURN, FAILED_DELIVERY, TRANSFER, OTHER; `documentKind` chọn header và ràng buộc dòng, ghi tồn theo luồng nguồn. | [goods-receipt.model.js](../src/models/goods-receipt.model.js) |
| `transfer_orders` | TO dùng chung cho chuyển ô, lấy hàng và xếp hàng; ghi nguồn/đích và xác nhận trọn lệnh một lần. | [transfer-order.model.js](../src/models/transfer-order.model.js) |
| `warehouse_transfer_requests` | TR chuyển giữa hai kho: lượng đề nghị/duyệt và tiến độ; một TR có nhiều phiếu xuất. | [warehouse-transfer-request.model.js](../src/models/warehouse-transfer-request.model.js) |
| `internal_transfer_requirements` | Yêu cầu lấy/xếp hàng theo phiếu xuất hoặc nhận, là căn cứ tự sinh TO. | [internal-transfer-requirement.model.js](../src/models/internal-transfer-requirement.model.js) |
| `transfer_dispatches` | Phiếu xuất điều chuyển từng đợt theo TR; chứa bàn giao và lượng thực xuất sang đang chuyển. | [transfer-dispatch.model.js](../src/models/transfer-dispatch.model.js) |
| `sales_orders` | Đơn bán có khách hàng, giá và quy đổi trên từng dòng; lưu tham chiếu đơn nguồn. | [sales-order.model.js](../src/models/sales-order.model.js) |
| `warehouse_issue_requests` | Yêu cầu xuất do Sales chia từ đơn bán; mới lập chưa giữ hoặc trừ tồn. | [warehouse-issue-request.model.js](../src/models/warehouse-issue-request.model.js) |
| `delivery_orders` | Lệnh giao một đợt từ một kho theo WIR; có lịch, người nhận, địa chỉ và lượng cam kết. | [delivery-order.model.js](../src/models/delivery-order.model.js) |
| `sales_goods_issues` | Phiếu thực xuất bán theo lệnh giao; lưu lô, lượng, giá chụp tại nguồn và bàn giao nhúng. | [sales-goods-issue.model.js](../src/models/sales-goods-issue.model.js) |
| `defect_reports` | Hồ sơ phần hàng nghi lỗi, nguồn phát hiện, dấu hiệu, bằng chứng và các lần kiểm. | [defect-report.model.js](../src/models/defect-report.model.js) |
| `stock_scrap_records` | Phiếu thực hủy theo phương án duyệt; chỉ trừ đúng lượng thực hủy. | [stock-scrap-record.model.js](../src/models/stock-scrap-record.model.js) |
| `stocktakes` | Đợt kiểm kê theo kho/phạm vi, lịch, người đếm, mốc kích hoạt và chốt. | [stocktake.model.js](../src/models/stocktake.model.js) |
| `stock_adjustments` | Phiếu điều chỉnh số lượng theo phần thiếu/thừa được duyệt khi chốt kiểm kê. | [stock-adjustment.model.js](../src/models/stock-adjustment.model.js) |
| `failed_deliveries` | Phần hàng đã xuất nhưng khách không nhận, gồm lý do, lượng và người đang giữ. | [failed-delivery.model.js](../src/models/failed-delivery.model.js) |
| `stock_quality_changes` | Phiếu chuyển lượng giữa trạng thái chất lượng; tổng lượng và vị trí không tự thay đổi. | [stock-quality-change.model.js](../src/models/stock-quality-change.model.js) |
| `customer_returns` | Yêu cầu trả sau khi khách đã nhận; có kết quả kiểm và quyết định theo từng phần. | [customer-return.model.js](../src/models/customer-return.model.js) |
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

[Gộp tiếp 5 bảng](docs/03_thiet_ke/DB_Rebuild_Review/37_Gop_them_5_bang.md): hiện còn 59 collection.

Đã bỏ ba builder không còn importer: reviewed-events.js, reviewed-support.js, reviewed-workflows.js. [Category v8 và kiểm thư mục](docs/03_thiet_ke/DB_Rebuild_Review/40_Category_va_don_model.md).

## Native return workflows — 7 November 2026

See [current return API and compatibility rules](docs/08_api/RETURN_WORKFLOWS_NATIVE.md). SupplierReturn item details now distinguish an honest PROPOSED request from VERIFIED agreement facts, bind sourceBalanceId and optionally an evidenced defectHoldId. Embedded dispositions preserve targetQuality; defect headers preserve sourceKind. ExternalReference and its embedded items carry verified historical customer/warehouse/evidence, lot/conversion and prior returns without synthetic POD. CustodyRelease also holds supplier acknowledgements when supplier-owned goods are returned. Holds, plans, inspections, movements and claims retain their existing parents and IDs. These return changes added no collections or nested schema files. The 59-collection baseline preceded the local UOM and replenishment changes described below. Missing historical warehouse/source facts are not invented; no database migration or rollout was executed.

Mốc Iteration 1 ngày 06/11: [Data Dictionary 60 collections](docs/03_thiet_ke/DB_Current_2026-11-06_60/WMSD_Data_Dictionary.md), [quan hệ thay đổi](docs/03_thiet_ke/DB_Current_2026-11-06_60/Iteration1_Model_Relationships.mmd). Phiếu nhập đã được gộp trong schema 09/11 ở đầu bản đồ.

## Nguồn bổ sung native — 07/11/2026

Không thêm collection: 60 collection, 97 nested schemas. ReplenishmentRequest.items.details.source dùng [replenishment-source.schema.js](../src/models/replenishment-source.schema.js), canonicalSourceKey và snapshot đánh giá; submissions.lines.evaluation giữ bản lịch sử. SalesOrder.replenishmentPlanningVersion phối hợp nguồn giữa nhiều kho; ReplenishmentLock.lastOperationId chỉ thao tác commit. [API và tương thích](docs/08_api/REPLENISHMENT_COVERAGE.md).
