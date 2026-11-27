## Stocktake plan and simplified reconciliation — 22 November 2026

User decision 22 Nov 2026 following lecturer feedback (separate plan/slip, remove blind count, simplified reconciliation, drop closing reason). New collection `stocktake_plans` (model `StocktakePlan`, nested `stocktake-plan-header.schema.js`, reusing `stocktake-header-scope.schema.js`) initially raised the registry to 59 collections. `stocktakes.header` adds optional `planId` (document identity of `StocktakePlan`), `planPeriodNo`, `planPeriodDueAt`, `settledLines[]` (`stocktake-settled-line.schema.js`) and `recountLines[]` (`stocktake-recount-line.schema.js`); unique partial index `stocktake_plan_period_once` on `stocktakes` `{header.planId, header.planPeriodNo}` (partial on non-cancelled `workflowStatus`, so a cancelled slip frees its period; amended 22 Nov 2026). The embedded `resolutionPlans` and their schemas stay for historical sessions only (no new writes). `src/shared/utils/blind-count.js` is deleted. Contracts: [STOCKTAKE_PLANS.md](docs/08_api/STOCKTAKE_PLANS.md), [STOCKTAKE_LIFECYCLE.md](docs/08_api/STOCKTAKE_LIFECYCLE.md#redesign--22-november-2026-current-contract). Index and collection are definitions in code only; nothing was built on a shared database.

## BF03 mixed packaging — 18 November 2026

`transfer_orders.items[].details.packagingState` (WAREHOUSE_TASK embedded schema) is optional `SEALED|LOOSE`, with no default. Explicit BF03 lines consume only that category; mixed entry creates separate items for independent partial progress. Historical absent values retain generic behavior. No collection, index, ref/relationship, ERD relationship or migration changes. See [contract](docs/08_api/location-movements/README.md#mixed-sealed-cartons-and-loose-pieces--18-november-2026) and current Data Dictionary. Other task kinds do not enable this mode.

## Customer details on documents — 17 November 2026

User decision: customers are not managed as catalogue records. New sales orders require `customerName` (1–160 characters) and allow `customerPhone` (up to 30 characters); the delivery address remains on the order. Creating an order does not query or create a Customer. Sales options return an empty compatibility `customers` array.

Customer-return creation sends warehouse and source lines only, without `customerId` or a customer selector. The server resolves name/phone from the source sales order or verified historical delivery and saves a snapshot on the return. Each new request is limited to one source document, while allowing multiple lines and split parts from that document. Warehouse access, source ownership/permissions, confirmed received quantity, claims, evidence, versions and idempotency remain enforced. Direct goods issues retain the sales-order link and no longer require a customer catalogue ID.

Historical verification requires customer name text and optional phone from the external document; verification/evidence remains mandatory. New historical sources with customer snapshots use the current inspection/acceptance/receipt flow without custody. Previously stored sources and custody ledgers retain their legacy behavior. Optional legacy customerId fields and the Customer collection remain readable; no records or collections are deleted or backfilled. Deploy FE and BE together; old clients sending customerId to new creation endpoints must update.

Validation: focused sales/return contract tests and the local direct-sales transaction test passed using an isolated database on the local rs0 replica set (port 27017). The transaction fixture creates a new sale and return with no Customer record, and separately verifies legacy custody compatibility. No Atlas write or migration was performed.

## Direct sales / returns — 17 November 2026

Latest explicit user decision supersedes manual-sale and custody requirements for new records. Sales Order → direct Goods Issue; Sales confirms evidenced customer receipt; Warehouse receives undelivered goods inline. New CR inspection records facts only, acceptance authorizes receipt, and only receipt posts STORE stock. Legacy mode markers are absent and retain original ledgers. Optional issue header/order/customer/sourceBalance and embedded customerReceipts, CR intakeMode/handbacks, and FAILED_DELIVERY receipt goodsIssueId add no collection. See [current contract](docs/08_api/GOODS_ISSUES.md) for permissions, exact caps, schema, compatibility and setup.

# Bản đồ model WMSD

Mốc schema 23/11/2026: 61 collection = 58 collection nghiệp vụ + 3 collection quản trị hệ thống (`app_settings`, `api_endpoints`, `error_logs`) và trường `users.lastLoginAt` ([quản trị hệ thống](docs/08_api/SYSTEM_ADMIN.md)). Mốc 22/11/2026 bổ sung `stocktake_plans`; sau đợt 1 còn 58 collection nghiệp vụ, gồm `conversions` theo sản phẩm và lô; không còn collection kỹ thuật bộ đếm. Năm loại phiếu nhập dùng chung `goods_receipts`. Không quản lý danh mục đội xe. Biển số xe được ghi trực tiếp trên lần bàn giao. Không có collection marker kỹ thuật.

[Từ điển dữ liệu](docs/03_thiet_ke/DB_Current_2026-11-12_58/WMSD_Data_Dictionary.md) · [Rà trường từng bảng](docs/03_thiet_ke/DB_Rebuild_Review/38_Ra_soat_truong_58_bang.md) · [Phiếu duyệt](docs/03_thiet_ke/DB_Rebuild_Review/01_Danh_muc_duyet.md)

## 25/11/2026 — Bỏ năm trường sao chép trên chứng từ

Chứng từ và chứng từ nhúng không còn `tenLoaiPhieu`, `maDonVi`, `kyDanhSo`, `soThuTu`, `trangThaiTiengViet`. Mã phiếu giữ ở `_id`/`documentNo`, nhãn trạng thái tính lúc đọc từ `workflowStatus`. Dọn dữ liệu cũ trên localhost bằng `scripts/drop-vietnamese-document-fields.mjs`.

## Excel and opening stock — 16 November 2026

[Current contract](docs/08_api/EXCEL_AND_OPENING_STOCK.md): opening_stocks uses its existing document/item relationships. New optional item packagingState and measuredVolumeMm3 preserve physical packaging for opening imports; the one-initialization index was removed on 27/11/2026: a warehouse takes several opening documents for one cut-off (`warehouses.openingCutoffAt`) until the Owner closes it (`openingClosedAt`, `openingClosedBy`); `header.openingImportSource` accepts FILE or MANUAL. warehouses.stockOperationVersion (integer, default zero) serializes shared stock commands and location edits against opening posting without changing catalogue updatedAt. No collection or relationship was added. Legacy data needs the additive [local setup](docs/09_phat_trien/EXCEL_OPENING_SETUP.md) before exposing the feature. No remote rollout was performed.

## Registry và các file cùng tác động

Từ 25/11/2026 có 62 collection. Đơn bán mới nhập tên/SĐT khách, lưu bằng chứng nguồn và lập lịch giao ngay trong cùng giao dịch. [Hợp đồng lịch giao](docs/08_api/SALES_DELIVERY_SCHEDULE.md).

The runtime uses one registry: `src/models/index.js` exports `registerModels(connection)`; `runtime.js` supplies API models. There are 62 collection schemas (`*.model.js`; 59 business + 3 system administration); `GoodsReceipt` có năm discriminator cùng collection. Nested schemas do not create collections. `registerReviewedModels` is a compatibility alias. Pure historical transforms and synthetic fixtures under `src/migrations/rebuild` and `src/seeds/rebuild` remain for regression checks.

[Hợp đồng API hiện hành](docs/08_api/GOODS_RECEIPTS.md). Các bản v8/Atlas trước đây là bằng chứng triển khai có ngày; lượt đồng bộ này không ghi lên Atlas.

Các model có `documentNo` dùng `DocumentIdentity` cho `_id`. Kiểu này hỗ trợ mã mới nối bằng `-`, mã đã lưu có dấu cách quanh dấu nối và ObjectId lịch sử. [Hợp đồng định danh](docs/08_api/DOCUMENT_IDENTITIES.md).

## Toàn bộ collection

BF04 (07/11/2026): `internal_transfer_requirements.header.sourceDocumentId` có
unique partial index cho DocumentIdentity chuỗi/ObjectId; `transfer_orders.header.requirementId`
có cùng ràng buộc. Một nguồn sinh một ITR, một ITR sinh một TO. RELOCATE không
có requirementId. Trước triển khai index lên DB đã có dữ liệu, rà và xử lý
nguồn/requirement trùng; không tự xóa bản ghi hoặc dựng lại DB.

BF04 lifecycle (17/11/2026): posting a GOOD transfer receipt automatically creates
an OPEN ITR/PUTAWAY TO with header source links and empty items while destinations
are unplanned. Receipt lines remain authoritative for product/lot/quantity and
receiving balances. Confirmation fills the existing item/source/detail fields after
destination selection and posts stock atomically, then completes the request when
ready. No fake/null required location, new field, model, collection, index or schema
migration is introduced. Existing planned TOs remain readable/confirmable; historical
receipts without an ITR use the explicit legacy open-task command. See [BF04 API](docs/08_api/transfers/BF04_API.md).

| Collection | Một bản ghi dùng để làm gì | Nơi bắt đầu đọc trong src/models |
|---|---|---|
| `users` | Tài khoản nhân viên: một vai trò, nhiều kho được phân công; mật khẩu được băm, lý do khoá hiện tại lưu ở `lockReason`; `lastLoginAt` ghi lần đăng nhập thành công gần nhất (23/11/2026). | [user.model.js](../src/models/user.model.js) |
| `roles` | Vai trò có sẵn hoặc do Administrator tạo; giữ danh sách quyền được chọn. | [role.model.js](../src/models/role.model.js) |
| `permissions` | Danh mục quyền thao tác có sẵn, phân nhóm theo chức năng. | [permission.model.js](../src/models/permission.model.js) |
| `warehouses` | Kho vật lý, kích thước; `layout3d` nháp gồm mặt bằng/khu vực/ô, `layout3dApplied` snapshot áp dụng và `layout3dAppliedAt`; `openingCutoffAt`/`openingClosedAt`/`openingClosedBy` là mốc và trạng thái chốt tồn đầu ([hợp đồng](docs/08_api/EXCEL_AND_OPENING_STOCK.md)). Ô thiết kế có thể giữ `locationId` của vị trí nghiệp vụ cùng kho; [hợp đồng chặng 2](docs/10_Kho3D/STAGE2_ZONES.md), [lớp hàng pallet](docs/10_Kho3D/STAGE3_PALLET_LAYERS.md) chỉ là phương án, không ghi tồn. | [warehouse.model.js](../src/models/warehouse.model.js) |
| `warehouse_locations` | Ô/vị trí thuộc một kho, loại ô và kích thước phục vụ kiểm sức chứa. | [warehouse-location.model.js](../src/models/warehouse-location.model.js) |
| `categories` | Nhóm phân loại sản phẩm: 5 nhóm đã duyệt, mỗi sản phẩm thuộc một category. | [category.model.js](../src/models/category.model.js) |
| `uoms` | Danh mục đơn vị. Mã bất biến và `isCarton` đánh dấu đơn vị thùng. `areaMm2` (mm² của một đơn vị, bất biến, null = không phải đơn vị diện tích; M2 = 1000000) bật quy đổi tự sinh và làm tròn lên tới viên. `Product.baseUnit` tham chiếu mã qua service. | [uom.model.js](../src/models/uom.model.js) |
| `conversions` | Hệ số Decimal128 có phiên bản theo sản phẩm, lô tùy chọn và UOM. Dòng chứng từ giữ hệ số tại thời điểm lập. | [conversion.model.js](../src/models/conversion.model.js) |
| `products` | Hãng + SKU + màu; categoryId thuộc một nhóm; dài/rộng/cao từng viên (mm), đơn vị gốc lưu trực tiếp; imageUrls lưu tối đa 5 URL HTTPS theo thứ tự. | [product.model.js](../src/models/product.model.js) |
| `customers` | Khách hàng gồm mã WMSD, tên và điện thoại; không lưu địa chỉ giao mặc định. | [customer.model.js](../src/models/customer.model.js) |
| `suppliers` | Nhà cung cấp và thông tin liên hệ; theo dõi trạng thái chờ/kích hoạt/ngừng. | [supplier.model.js](../src/models/supplier.model.js) |
| `stock_holding_points` | Điểm theo dõi tồn: một ô kho hoặc phần hàng đang chuyển theo dòng xuất. | [stock-holding-point.model.js](../src/models/stock-holding-point.model.js) |
| `inventory_balances` | Số dư theo điểm tồn, lô, chất lượng và chủ sở hữu; lượng dùng đơn vị gốc. OPEN/LOOSE parts retain measurements or use the existing estimate. Splits of known-volume stock, including partially received direct returns, can use a conservative `volumeUpperBoundMm3` instead of a fabricated measurement. | [inventory-balance.model.js](../src/models/inventory-balance.model.js) |
| `stock_transactions` | Một lần ghi tồn đã thành công, liên kết nghiệp vụ nguồn và mã chống ghi lặp. | [stock-transaction.model.js](../src/models/stock-transaction.model.js) |
| `stock_reservations` | Giữ hàng thực tế cho nhu cầu và lệnh thực hiện; theo dõi đã dùng, giải phóng hoặc chuyển. | [stock-reservation.model.js](../src/models/stock-reservation.model.js) |
| `supply_allocations` | Dữ liệu phân bổ nguồn PO/TR. Luồng đánh giá RR đã ngừng đọc. Chi tiết điều chuyển vẫn đọc bản ghi có sẵn. | [supply-allocation.model.js](../src/models/supply-allocation.model.js) |
| `approval_history` | Lịch sử quyết định theo đúng phiên bản phiếu/dòng, người quyết định và căn cứ. Dòng duyệt RR lưu lượng theo đơn vị gốc ở `itemDecisions[].approvedQtyBase`. | [approval-history.model.js](../src/models/approval-history.model.js) |
| `attachments` | Metadata ảnh/PDF và quyền truy cập bằng chứng; dữ liệu tệp lưu theo storageKey. | [attachment.model.js](../src/models/attachment.model.js) |
| `return_quantity_claims` | Giữ hạn mức theo nguồn giao/nhận để không đề nghị trả vượt lượng còn được trả. RELEASED and REACQUIRED preserve reassessment history; RECEIVED stays charged to the source. Prefix validation bounds resolved/reacquired quantities without a new field or index. | [return-quantity-claim.model.js](../src/models/return-quantity-claim.model.js) |
| `stocktake_snapshots` | Số tồn làm mốc theo ô/lô/chủ/chất lượng tại lúc khóa phạm vi. | [stocktake-snapshot.model.js](../src/models/stocktake-snapshot.model.js) |
| `stocktake_counts` | Các lần đếm/đếm lại, đơn vị/quy đổi và bằng chứng; chưa đếm khác với đã xác nhận 0. Correction hàng phát hiện giữ `correctsEmptyCountId` và `correctionReason` để liên kết append-only với xác nhận trống bị sửa. | [stocktake-count.model.js](../src/models/stocktake-count.model.js) |
| `stocktake_location_locks` | Lịch sử khóa ô khi kiểm kê; mỗi ô chỉ có một khóa đang hiệu lực. | [stocktake-location-lock.model.js](../src/models/stocktake-location-lock.model.js) |
| `notifications` | Thông báo theo nhân viên và trạng thái đọc; kèm theo dõi gửi email SMTP (`emailDelivery` PENDING/SENT/FAILED/SKIPPED, gửi thật từ 23/11/2026). Cảnh báo tồn dưới ngưỡng dùng `conditionKey`/`conditionState` (BELOW/RESOLVED) với nguồn `products`. | [notification.model.js](../src/models/notification.model.js) |
| `audit_logs` | Nhật ký người thao tác, kết quả và thay đổi; tách khỏi lịch sử số lượng tồn. Index `{occurredAt:-1,_id:-1}` và `{actorId:1,occurredAt:-1}` phục vụ màn hình Nhật ký hệ thống (23/11/2026). | [audit-log.model.js](../src/models/audit-log.model.js) |
| `system_events` | Công việc sau khi lưu thành công, như gửi thông báo/email và thử lại độc lập. | [system-event.model.js](../src/models/system-event.model.js) |
| `operation_records` | Ghi kết quả thao tác theo mã yêu cầu để chống xử lý lặp và liên kết kết quả. | [operation-record.model.js](../src/models/operation-record.model.js) |
| `return_source_locks` | Phối hợp xử lý đồng thời theo nguồn trả; hạn mức thực tế ở return_quantity_claims. | [return-source-lock.model.js](../src/models/return-source-lock.model.js) |
| `external_references` | Hồ sơ chứng từ nguồn bên ngoài. D07 còn chờ chốt người/quy trình xác minh; không tích hợp MISA. | [external-reference.model.js](../src/models/external-reference.model.js) |
| `product_batches` | Lô theo productId + manufacturerLot; số viên/thùng cố định và kích thước ngoài thùng (mm). Tone (`tone`) và calibre (`calibre`) là mã tùy chọn tối đa 20 ký tự, không nằm trong khóa duy nhất; `verificationReference`/`notes` (tối đa 500 ký tự) và `verifiedAt`/`verifiedBy` (đặt khi lô chuyển sang VERIFIED). | [product-batch.model.js](../src/models/product-batch.model.js) |
| `replenishment_requests` | Yêu cầu bổ sung cho một kho. Các dòng lưu lượng đề nghị theo đơn vị nhập và đơn vị gốc, cùng lượng duyệt `approvedQtyBase` theo đơn vị gốc. `reasonNote` tùy chọn trên dòng hiện tại và snapshot gửi duyệt. | [replenishment-request.model.js](../src/models/replenishment-request.model.js) |
| `purchase_orders` | Đơn mua theo một RR, một nhà cung cấp và một kho. Lưu giá mua, tổng tiền và ngày dự kiến chung `header.expectedOn` cho phần chưa nhận. Chỉ sửa nội dung khi còn nháp. Từ 11/11/2026, `OPEN` và `PARTIAL` có lệnh đổi ngày dự kiến. Từ 16/11/2026, `replenishmentRequestId` tùy chọn: hủy PO gỡ trường này để RR lập PO mới, unique index một phần giữ một RR một PO còn hiệu lực. Các lần nhận thực tế liên kết qua hàng đến, phiếu kiểm và phiếu nhập. | [purchase-order.model.js](../src/models/purchase-order.model.js) |
| `goods_arrivals` | Mỗi lần hàng mua thực đến; giữ lịch sử kể cả khi từ chối toàn bộ, chưa tự tăng tồn sở hữu. | [goods-arrival.model.js](../src/models/goods-arrival.model.js) |
| `goods_inspections` | Kết quả kiểm nhận theo từng phần hàng đến, chất lượng, tình trạng bao bì (gồm `LOOSE` cho hàng lẻ), quyết định sở hữu và vị trí tiếp nhận tùy chọn trên dòng mua được chấp nhận. | [goods-inspection.model.js](../src/models/goods-inspection.model.js) |
| `goods_receipts` | Phiếu nhập PURCHASE, CUSTOMER_RETURN, FAILED_DELIVERY, TRANSFER, OTHER; `documentKind` chọn header và ràng buộc dòng, ghi tồn theo luồng nguồn. | [goods-receipt.model.js](../src/models/goods-receipt.model.js) |
| `transfer_orders` | TO dùng chung cho chuyển ô, lấy hàng và xếp hàng; ghi nguồn/đích và xác nhận trọn lệnh một lần. BF03 hỗ trợ nhiều chuyến OPEN/PARTIAL→CONFIRMED; mỗi chuyến là StockTransaction, hủy chỉ phần còn lại. | [transfer-order.model.js](../src/models/transfer-order.model.js) |
| `warehouse_transfer_requests` | TR chuyển giữa hai kho: lượng đề nghị/duyệt, lô và phân bổ ô nguồn tùy chọn trên mỗi dòng (`sourceLocations[]`). Một TR có nhiều phiếu xuất; lượng chưa phân bổ có thể lấy từ tồn khả dụng của cùng lô khi xuất. | [warehouse-transfer-request.model.js](../src/models/warehouse-transfer-request.model.js), [transfer-source-location.schema.js](../src/models/transfer-source-location.schema.js) |
| `internal_transfer_requirements` | Yêu cầu lấy/xếp hàng theo phiếu xuất hoặc nhận, là căn cứ tự sinh TO. | [internal-transfer-requirement.model.js](../src/models/internal-transfer-requirement.model.js) |
| `transfer_dispatches` | Phiếu xuất điều chuyển từng đợt theo TR; chứa bàn giao và lượng thực xuất sang đang chuyển. | [transfer-dispatch.model.js](../src/models/transfer-dispatch.model.js) |
| `sales_orders` | Đơn bán có khách hàng, giá và quy đổi trên từng dòng; lưu tham chiếu đơn nguồn. | [sales-order.model.js](../src/models/sales-order.model.js) |
| `delivery_schedules` | One schedule per SalesOrder, with planned deliveries, quantities per line, and FIFO reservation links. | [delivery-schedule.model.js](../src/models/delivery-schedule.model.js) |
| `warehouse_issue_requests` | Yêu cầu xuất do Sales chia từ đơn bán; mới lập chưa giữ hoặc trừ tồn. | [warehouse-issue-request.model.js](../src/models/warehouse-issue-request.model.js) |
| `delivery_orders` | Lệnh giao một đợt từ một kho theo WIR; có lịch, người nhận, địa chỉ và lượng cam kết. | [delivery-order.model.js](../src/models/delivery-order.model.js) |
| `sales_goods_issues` | GI_SALE/GI_OTHER: mã tham chiếu tay, sản phẩm/lượng/ghi chú; SALE có snapshot khách tùy chọn (`header.customerName`, `header.customerPhone`); SALES tạo PENDING_APPROVAL, Owner duyệt cùng ID sang DRAFT, không đổi tồn. Kho phân bổ lô/ô vào PICK TO rồi PGI. OD/giá nguồn cũ vẫn tương thích; approval User refs và bàn giao nhúng. [Goods Issue + sơ đồ quan hệ](docs/08_api/GOODS_ISSUES.md). | [sales-goods-issue.model.js](../src/models/sales-goods-issue.model.js) |
| `defect_reports` | Hồ sơ phần hàng nghi lỗi, nguồn phát hiện, dấu hiệu, bằng chứng và các lần kiểm. | [defect-report.model.js](../src/models/defect-report.model.js) |
| `stock_scrap_records` | Phiếu thực hủy theo phương án duyệt; chỉ trừ đúng lượng thực hủy. | [stock-scrap-record.model.js](../src/models/stock-scrap-record.model.js) |
| `stocktakes` | Đợt kiểm kê theo kho/phạm vi, lịch, người đếm, mốc kích hoạt và chốt; dòng phương án xử lý chênh lệch mang lý do (`details.reasonCode`, `details.reasonNote`, từ 18/11/2026). Từ 22/11/2026 header thêm `planId`/`planPeriodNo`/`planPeriodDueAt` (phiếu sinh từ kế hoạch), `settledLines[]` (dòng đã duyệt chênh lệch) và `recountLines[]` (dòng Owner yêu cầu đếm lại); `resolutionPlans` chỉ còn là lịch sử. Từ 23/11/2026 header thêm `countReasons[]` (`stocktake-count-reason.schema.js`): lý do chênh lệch do người đếm chọn cho lần đếm mới nhất của từng dòng. | [stocktake.model.js](../src/models/stocktake.model.js) |
| `stocktake_plans` | Kế hoạch kiểm kê định kỳ (22/11/2026): kho, phạm vi (vị trí/khu vực/lô/sản phẩm), người đếm, tần suất MONTHLY/QUARTERLY/YEARLY, kỳ kế tiếp và phiếu đã sinh; không ghi tồn, không khóa ô. Mã `KHKK-<kho>-YYMMDD-<số>`. | [stocktake-plan.model.js](../src/models/stocktake-plan.model.js) |
| `app_settings` | Cài đặt hệ thống theo khoá (23/11/2026): `SALES_POLICY` (chính sách bán hàng & ngưỡng kho, có `version`, audit từng trường) và mốc `LOW_STOCK_LAST_SCAN` của tác vụ quét tồn. `value` do API sở hữu khoá kiểm tra. | [app-setting.model.js](../src/models/app-setting.model.js) |
| `api_endpoints` | Danh mục API (23/11/2026): dòng `SYSTEM` đồng bộ từ router Express, dòng `MANUAL` do Administrator thêm (URL, tên, mô tả). Duy nhất theo `{method,url}`; `isPresent` = còn trong mã nguồn. | [api-endpoint.model.js](../src/models/api-endpoint.model.js) |
| `error_logs` | Lỗi máy chủ (5xx), tác vụ nền và tiến trình (23/11/2026), gộp theo `fingerprint` (đếm `count`, `firstSeenAt`/`lastSeenAt`); có trạng thái đã xử lý. Không lưu body, query, cookie hay token. | [error-log.model.js](../src/models/error-log.model.js) |
| `stock_adjustments` | Phiếu điều chỉnh số lượng theo phần thiếu/thừa được duyệt khi chốt kiểm kê. | [stock-adjustment.model.js](../src/models/stock-adjustment.model.js) |
| `failed_deliveries` | Phần hàng đã xuất nhưng khách không nhận, gồm lý do, lượng và người đang giữ. | [failed-delivery.model.js](../src/models/failed-delivery.model.js) |
| `stock_quality_changes` | Phiếu chuyển lượng giữa trạng thái chất lượng; tổng lượng và vị trí không tự thay đổi. | [stock-quality-change.model.js](../src/models/stock-quality-change.model.js) |
| `customer_returns` | Yêu cầu trả sau khi khách đã nhận; có kết quả kiểm và quyết định theo từng phần. Optional `header.salesOrderReference` is plain text, not a relationship. New DIRECT inspection portions retain optional packaging state, measured volume and a verified carton snapshot. Existing records do not need backfill. | [customer-return.model.js](../src/models/customer-return.model.js), [return-inspection-portions.schema.js](../src/models/return-inspection-portions.schema.js) |
| `supplier_returns` | Đề nghị trả NCC và thỏa thuận được Accountant xác minh theo dòng. | [supplier-return.model.js](../src/models/supplier-return.model.js) |
| `supplier_return_issues` | Phiếu thực xuất trả phần thuộc cửa hàng theo lượng đã thống nhất với NCC. | [supplier-return-issue.model.js](../src/models/supplier-return-issue.model.js) |
| `stock_discrepancies` | Hồ sơ thiếu/thừa/sai/hỏng và chứng từ giải quyết; không tự xóa lượng chưa rõ. | [stock-discrepancy.model.js](../src/models/stock-discrepancy.model.js) |
| `custody_receipts` | Nhận vật lý hàng thuộc khách/NCC; chiếm chỗ nhưng chưa thuộc cửa hàng. | [custody-receipt.model.js](../src/models/custody-receipt.model.js) |
| `custody_releases` | Bàn giao lại hàng giữ hộ chưa chuyển sang sở hữu cửa hàng. | [custody-release.model.js](../src/models/custody-release.model.js) |
| `stock_reversals` | Phiếu đề nghị/duyệt đảo toàn bộ lần ghi tồn sai đủ điều kiện, giữ liên kết giao dịch gốc. | [stock-reversal.model.js](../src/models/stock-reversal.model.js) |
| `opening_stocks` | Phiếu số dư ban đầu đã đối chiếu/xác minh theo ô, lô, chất lượng và chủ hàng; mỗi kho nhiều phiếu (nhập từng phần) cho một mốc cho tới khi chốt. | [opening-stock.model.js](../src/models/opening-stock.model.js) |
| `sales_invoices` | Hóa đơn tổng hợp một SO: từng dòng có phiếu/ngày xuất, lượng xuất, lượng nhận và giá tính tiền. | [sales-invoice.model.js](../src/models/sales-invoice.model.js) |

## Khi thay một model

Tìm collection, ref, model name và các trường liên quan bằng `rg` trong `src/modules`, `src/seeds`, `src/migrations`, `test` và `git_doc`. Kiểm bên tiêu thụ trước khi đổi tên/kiểu. Cập nhật mục tương ứng trong Data Dictionary và sơ đồ nếu cấu trúc đổi, thêm test hành vi cần bảo vệ, ghi cả hai changelog. Lưu ý source reference tới `_id` dòng nhúng phải kèm chứng từ đúng cha.

## Cách lưu sau gộp

[Quyết định gộp 10 bảng](docs/03_thiet_ke/DB_Rebuild_Review/36_Gop_10_bang.md). Số dư tồn chứa packagingPortions[] thay chồng hàng. Registry migration chỉ dùng đọc dữ liệu lịch sử.

[Gộp tiếp 5 bảng](docs/03_thiet_ke/DB_Rebuild_Review/37_Gop_them_5_bang.md): hiện còn 58 collection.

Đã bỏ ba builder không còn importer: reviewed-events.js, reviewed-support.js, reviewed-workflows.js. [Category v8 và kiểm thư mục](docs/03_thiet_ke/DB_Rebuild_Review/40_Category_va_don_model.md).

## Native return workflows — 7 November 2026

See [current return API and compatibility rules](docs/08_api/RETURN_WORKFLOWS_NATIVE.md). SupplierReturn item details now distinguish an honest PROPOSED request from VERIFIED agreement facts, bind sourceBalanceId and optionally an evidenced defectHoldId. Embedded dispositions preserve targetQuality; defect headers preserve sourceKind. ExternalReference and its embedded items carry verified historical customer/warehouse/evidence, lot/conversion and prior returns without synthetic POD. CustodyRelease also holds supplier acknowledgements when supplier-owned goods are returned. Holds, plans, inspections, movements and claims retain their existing parents and IDs. These return changes added no collections or nested schema files. The 59-collection baseline preceded the local UOM and replenishment changes described below. Missing historical warehouse/source facts are not invented; no database migration or rollout was executed.

Mốc Iteration 1 ngày 06/11: [Data Dictionary 60 collections](docs/03_thiet_ke/DB_Current_2026-11-06_60/WMSD_Data_Dictionary.md), [quan hệ thay đổi](docs/03_thiet_ke/DB_Current_2026-11-06_60/Iteration1_Model_Relationships.mmd). Phiếu nhập đã được gộp trong schema 09/11 ở đầu bản đồ.

## Nguồn và cảnh báo RR — 11/11/2026

`ReplenishmentRequest.items[].details.source` giữ tham chiếu đã kiểm, `evaluatedAt`, các snapshot cảnh báo và giải trình. `submissions[].lines[].evaluation` giữ bản tại thời điểm gửi duyệt. `canonicalSourceKey`, `evaluationKey`, lượng đề xuất và các snapshot coverage cũ là trường tương thích dữ liệu lịch sử. Đợt 1 gỡ collection `replenishment_locks`, bộ đếm `SalesOrder.replenishmentPlanningVersion` và `WarehouseTransferRequest.header.executionStatus`. Xem [migration và rollback](docs/09_phat_trien/DB_PHASE_ONE.md). `SupplyAllocation` còn được đọc trong luồng điều chuyển và không tham gia đánh giá RR. Xem [hợp đồng RR](docs/08_api/REPLENISHMENT_COVERAGE.md).
