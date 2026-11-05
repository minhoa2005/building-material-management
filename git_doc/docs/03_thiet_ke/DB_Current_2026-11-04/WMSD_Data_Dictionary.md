# WMSD — Từ điển DB hiện tại

- Nguồn đọc: `127.0.0.1:27018/wmsd_demo_v2`; snapshot `2026-11-03T21:10:22.293Z`.
- 74 collection nghiệp vụ, 511 bản ghi mẫu; `_db_rebuild` là collection điều khiển chuyển đổi, không tính vào 74.
- Schema profile: `reviewed-20261103`. Kiểu/required/default/ref lấy từ model đăng ký mới; index lấy trực tiếp từ MongoDB.
- 3.327 path cơ sở, kể cả đối tượng cha và trường nhúng. 19 cấu trúc `items[].details` trình bày ở phụ lục; không phải 19 collection.
- `required` là quy tắc của Mongoose từng path; parent optional và kiểm tra nghiệp vụ phải xét riêng. MongoDB hiện chưa có `$jsonSchema` validator.
- `ref`/ObjectId là liên kết logic; không có khóa ngoại SQL. Mã dòng nhúng `items[]._id` không phải `_id` của collection riêng.
- Bản ghi mẫu chỉ dùng kiểm số lượng và hình dạng; tài liệu này không chứa mật khẩu/hash, token hoặc dữ liệu khách hàng thực.

## Các điểm phải phân biệt

1. D07/D08 (`external_references`, `external_reference_lines`) đang có trong DB mẫu nhưng nghiệp vụ xác minh chưa chốt.
2. `stocktakes.header.scopeLocationIds[]` hiện có `ref: Location`; registry mới chỉ đăng ký `WarehouseLocation`. Đây là lệch ref cần sửa khi hoàn thiện model.
3. Một internal requirement sinh tối đa một TO là quy tắc đã duyệt, nhưng chưa có unique index trên `transfer_orders.header.requirementId`. Không coi quan hệ 1–1 này là ràng buộc DB đã thực thi.
4. Các schema phiếu dùng chung 19 discriminator dòng. Có schema details không có nghĩa loại đó hợp lệ cho mọi phiếu; tầng nghiệp vụ phải kiểm lineKind phù hợp.
5. `runtimeReady=false` trong marker: DB mới và sơ đồ không chứng minh toàn bộ API cũ đã chuyển sang schema mới.
6. Không có các collection `uoms`, `product_uom_versions`, `business_documents`, `document_lines`, `line_links`; quy đổi/giá/chứng từ nguồn nằm trên dòng hoặc hồ sơ chuyên biệt.

<!-- receiving-cartons:start -->
## Nhập mua theo thùng: đọc một dòng phiếu như thế nào?

**Đã xác nhận ngày 05/11/2026. Mỗi thùng vật lý chỉ chứa một mã sản phẩm của một lô.** Warehouse Staff có thể ghi chung các thùng nguyên trên một dòng `items[]` khi cùng sản phẩm, cùng lô, cùng số đơn vị trong mỗi thùng và cùng kích thước ngoài. Khi đổi sản phẩm, lô hoặc quy cách, ghi dòng riêng. Mã in trên các thùng cùng lô dùng để tra lô.

| Nhân viên kho ghi/tra | Trường thực tế | Ví dụ minh họa |
|---|---|---|
| Sản phẩm bên trong | `items[].productId` → `products._id`; mã in trên sản phẩm tra bằng `manufacturerCode` + `sku` | Gạch G60 của hãng A |
| Mã lô trên thùng | `items[].lotId` → `product_batches._id`; mã lô hãng ở `manufacturerLot`. Hàng đến còn có `items[].lotLabelSnapshot` | L01 |
| Số thùng đến/được nhận | `items[].enteredQty`, `items[].enteredUnit` | 10 Thùng |
| Số sản phẩm trong **một** thùng nguyên | `items[].baseUnitsPerUnit`, `items[].baseUnitSnapshot`; `packagingSnapshot.packageUnit`, `packagingSnapshot.baseUnitsPerPackage` chụp quy cách của dòng | 4 viên/thùng. Khi đơn vị nhập chính là thùng, hai hệ số phải cùng bằng 4 |
| Kích thước một sản phẩm | `products.nominalSize` (tra theo sản phẩm, không phải số đo vỏ thùng) | Viên gạch 600 × 600 mm |
| Kích thước **ngoài** một thùng | `items[].packagingSnapshot.outerLengthMm`, `outerWidthMm`, `outerHeightMm` (mm) | Thùng 620 × 620 × 60 mm |
| Số lượng theo đơn vị gốc | `items[].qtyBase = enteredQty × baseUnitsPerUnit` | 10 × 4 = 40 viên |

`goods_arrivals` ghi hàng thực đến; `goods_inspections` ghi kết quả kiểm; `purchase_receipts` ghi đúng lượng nhận sở hữu được chấp nhận. Nếu cả 10 thùng đều đạt và được nhận, tồn tăng **40 viên một lần**. Thùng mở/lẻ thì kiểm số viên thực có; không tự nhân theo quy cách thùng nguyên. Kích thước đang là trường có thể trống trong model; thiếu số đo không được mặc định là 0 để bỏ qua kiểm sức chứa.

Nếu cùng chuyến có thêm 2 thùng G60 lô L02, mỗi thùng 4 viên, kho ghi dòng thứ hai. Khi nhận đủ, L01 tăng 40 viên, L02 tăng 8 viên. Phiếu giữ được cả tổng 48 viên và lượng của từng lô.

<!-- receiving-cartons:end -->

## Mục lục

- A — Tài khoản và phân quyền: [users](#users), [roles](#roles), [permissions](#permissions)
- B — Danh mục kho, hàng và đối tác: [warehouses](#warehouses), [warehouse_locations](#warehouse_locations), [products](#products), [product_batches](#product_batches), [stock_thresholds](#stock_thresholds), [customers](#customers), [suppliers](#suppliers), [delivery_teams](#delivery_teams)
- C — Tồn kho, giữ hàng và sức chứa: [stock_holding_points](#stock_holding_points), [inventory_balances](#inventory_balances), [stock_transactions](#stock_transactions), [stock_movements](#stock_movements), [stock_reservations](#stock_reservations), [supply_allocations](#supply_allocations), [storage_stacks](#storage_stacks), [storage_stack_items](#storage_stack_items)
- D — Bổ sung, mua và nhập hàng: [replenishment_requests](#replenishment_requests), [purchase_orders](#purchase_orders), [goods_arrivals](#goods_arrivals), [goods_inspections](#goods_inspections), [purchase_receipts](#purchase_receipts)
- E — BF03 chuyển ô và BF04 chuyển giữa kho: [warehouse_transfer_requests](#warehouse_transfer_requests), [transfer_dispatches](#transfer_dispatches), [transfer_receipts](#transfer_receipts), [internal_transfer_requirements](#internal_transfer_requirements), [transfer_orders](#transfer_orders)
- F — Bán, xuất, giao hàng và hóa đơn: [sales_orders](#sales_orders), [warehouse_issue_requests](#warehouse_issue_requests), [delivery_orders](#delivery_orders), [sales_goods_issues](#sales_goods_issues), [delivery_confirmations](#delivery_confirmations), [sales_invoices](#sales_invoices), [external_payment_confirmations](#external_payment_confirmations)
- G — Giao thất bại, nhận về và giao bù: [failed_deliveries](#failed_deliveries), [failed_delivery_receipts](#failed_delivery_receipts), [delivery_demand_reopenings](#delivery_demand_reopenings), [delivery_commitment_transfers](#delivery_commitment_transfers), [sales_order_cancellations](#sales_order_cancellations)
- H — Khách trả, giữ hộ và chứng từ nguồn: [customer_returns](#customer_returns), [return_inspections](#return_inspections), [customer_return_receipts](#customer_return_receipts), [return_quantity_claims](#return_quantity_claims), [custody_receipts](#custody_receipts), [custody_releases](#custody_releases), [external_references](#external_references), [external_reference_lines](#external_reference_lines)
- I — Hàng lỗi, hủy và chênh lệch: [defect_reports](#defect_reports), [defect_resolution_plans](#defect_resolution_plans), [stock_scrap_records](#stock_scrap_records), [stock_holds](#stock_holds), [stock_quality_changes](#stock_quality_changes), [stock_discrepancies](#stock_discrepancies)
- J — Trả nhà cung cấp và đối chiếu: [supplier_returns](#supplier_returns), [supplier_return_issues](#supplier_return_issues), [supplier_acknowledgements](#supplier_acknowledgements)
- K — Kiểm kê, khóa ô và điều chỉnh: [stocktakes](#stocktakes), [stocktake_snapshots](#stocktake_snapshots), [stocktake_counts](#stocktake_counts), [stocktake_location_locks](#stocktake_location_locks), [stocktake_resolution_plans](#stocktake_resolution_plans), [stock_adjustments](#stock_adjustments)
- L — Tồn đầu kỳ và sửa giao dịch tồn: [opening_stocks](#opening_stocks), [stock_reversals](#stock_reversals)
- M — Lịch sử, bằng chứng và tác vụ hỗ trợ: [approval_history](#approval_history), [attachments](#attachments), [notifications](#notifications), [audit_logs](#audit_logs), [system_events](#system_events), [operation_records](#operation_records), [replenishment_locks](#replenishment_locks), [return_source_locks](#return_source_locks)

## Quan hệ và cơ sở lưu trữ

Nhãn 1/n thể hiện số tối đa ở mức quan hệ; điều kiện optional và chỉ số vật lý xem cột cơ sở. Các quan hệ theo dòng có thể nối nhiều phiếu với nhiều phiếu.

| Nguồn | Quan hệ | Đích | Cardinality | Cơ sở / giới hạn |
|---|---|---|---|---|
| `roles` | assigns | `users` | 1–n | users.roleId |
| `roles` | grants | `permissions` | n–n | roles.permissionIds[] |
| `users` | works at | `warehouses` | n–n | users.warehouseIds[] |
| `warehouses` | contains | `warehouse_locations` | 1–n | warehouse_locations.warehouseId |
| `products` | has batches | `product_batches` | 1–n | product_batches.productId |
| `warehouses` | sets threshold | `stock_thresholds` | 1–n | stock_thresholds.warehouseId |
| `products` | has threshold | `stock_thresholds` | 1–n | stock_thresholds.productId |
| `warehouse_locations` | tracks at | `stock_holding_points` | 1–1 | partial unique locationId; 0..1 LOCATION point |
| `stock_holding_points` | holds | `inventory_balances` | 1–n | inventory_balances.holdingPointId |
| `product_batches` | is counted in | `inventory_balances` | 1–n | inventory_balances.batchId |
| `stock_transactions` | records | `stock_movements` | 1–n | stock_movements.transactionId |
| `inventory_balances` | moves from/to | `stock_movements` | n–n | stock_movements.fromBalanceId / toBalanceId; combined source and destination roles |
| `inventory_balances` | reserves | `stock_reservations` | 1–n | stock_reservations.balanceId |
| `supply_allocations` | becomes | `stock_reservations` | 1–n | stock_reservations.sourceAllocationId |
| `warehouse_locations` | stores | `storage_stacks` | 1–n | storage_stacks.locationId |
| `storage_stacks` | contains | `storage_stack_items` | 1–n | storage_stack_items.stackId |
| `inventory_balances` | packed as | `storage_stack_items` | 1–n | storage_stack_items.balanceId |
| `replenishment_requests` | fulfilled by | `purchase_orders` | 1–1 | purchase_orders.replenishmentRequestId; unique index; 0..1 PO |
| `suppliers` | supplies | `purchase_orders` | 1–n | purchase_orders.header.supplierId |
| `purchase_orders` | arrives in | `goods_arrivals` | 1–n | goods_arrivals.header.purchaseOrderId |
| `goods_arrivals` | inspected by | `goods_inspections` | 1–n | goods_inspections.header.arrivalId |
| `purchase_orders` | received by | `purchase_receipts` | 1–n | purchase_receipts.header.purchaseOrderId |
| `goods_inspections` | supports | `purchase_receipts` | n–n | purchase_receipts.items[].inspectionId; item-level references |
| `purchase_orders` | contains | `products` | n–n | items[].productId |
| `purchase_receipts` | contains | `products` | n–n | items[].productId |
| `replenishment_requests` | requests | `products` | n–n | items[].productId |
| `warehouse_transfer_requests` | dispatched by | `transfer_dispatches` | 1–n | header.requestId and sources; per-line quantity cap |
| `transfer_dispatches` | received by | `transfer_receipts` | 1–n | header.dispatchId + items[].details.dispatchLineId |
| `transfer_dispatches` | needs picking | `internal_transfer_requirements` | 1–n | header.sourceDocumentId + source kind; 0..n physically; BF04 one active picking requirement per dispatch |
| `transfer_receipts` | needs putaway | `internal_transfer_requirements` | 1–n | header.sourceDocumentId + source kind; 0..n physically |
| `internal_transfer_requirements` | creates | `transfer_orders` | 1–1 | H08 approved: 0..1 TO; NOT enforced by unique index |
| `transfer_orders` | moves between | `warehouse_locations` | n–n | items[].details.fromLocationId / toLocationId |
| `warehouses` | source for | `warehouse_transfer_requests` | 1–n | header.sourceWarehouseId; destination is a separate warehouse role |
| `warehouses` | destination for | `warehouse_transfer_requests` | 1–n | header.destinationWarehouseId; source is a separate warehouse role |
| `customers` | places | `sales_orders` | 1–n | sales_orders.header.customerId |
| `sales_orders` | released by | `warehouse_issue_requests` | 1–n | header.salesOrderId + item source links |
| `warehouse_issue_requests` | scheduled by | `delivery_orders` | 1–n | header.issueRequestId + items[].details.issueRequestLineId |
| `delivery_orders` | fulfilled by | `sales_goods_issues` | 1–n | sales_goods_issues.header.deliveryOrderId |
| `sales_goods_issues` | confirmed by | `delivery_confirmations` | 1–n | delivery_confirmations.header.goodsIssueId |
| `sales_orders` | invoiced by | `sales_invoices` | 1–n | sales_invoices.salesOrderId; <=1 ISSUED via partial unique |
| `sales_goods_issues` | listed in | `sales_invoices` | n–n | sales_invoices.items[].goodsIssueId + goodsIssueLineId |
| `sales_orders` | confirmed paid | `external_payment_confirmations` | 1–n | header.salesOrderId / sources; external confirmation only |
| `sales_orders` | contains | `products` | n–n | items[].productId |
| `sales_goods_issues` | contains | `products` | n–n | items[].productId |
| `delivery_teams` | delivers | `sales_goods_issues` | n–n | handovers[].header.carrierId; one issue may have several handovers |
| `sales_goods_issues` | has failure | `failed_deliveries` | 1–n | failed_deliveries.header.goodsIssueId |
| `failed_deliveries` | returns by | `failed_delivery_receipts` | 1–n | failed_delivery_receipts.header.failedDeliveryId |
| `failed_delivery_receipts` | reopens | `delivery_demand_reopenings` | 1–n | receiptLineId -> embedded receipt item; unique per receipt line |
| `delivery_demand_reopenings` | reassigns | `delivery_commitment_transfers` | 1–n | reopeningReceiptLineId -> reopening.receiptLineId |
| `sales_orders` | cancels part | `sales_order_cancellations` | 1–n | sales_order_cancellations.salesOrderId |
| `delivery_demand_reopenings` | may cancel | `sales_order_cancellations` | 1–n | reopeningReceiptLineId; conditional source |
| `customers` | requests return | `customer_returns` | 1–n | customer_returns.header.customerId |
| `customer_returns` | inspected by | `return_inspections` | 1–n | returnLineId -> customer_returns.items[]._id |
| `customer_returns` | accepted by | `customer_return_receipts` | 1–n | customer_return_receipts.header.returnId |
| `customer_returns` | claims quantity | `return_quantity_claims` | 1–n | requestLineId -> embedded return item; claimKind |
| `external_references` | contains | `external_reference_lines` | 1–n | external_reference_lines.referenceId |
| `external_reference_lines` | supports | `customer_returns` | n–n | items[].details.historicalExternalLineId |
| `custody_receipts` | released by | `custody_releases` | n–n | item source references; each release may cite several custody receipt items |
| `custody_receipts` | changes owner | `customer_return_receipts` | n–n | item source/custody links; conditional |
| `defect_reports` | blocks part | `stock_holds` | 1–n | stock_holds.defectReportLineId -> embedded defect item |
| `defect_reports` | resolved by | `defect_resolution_plans` | n–n | items[].details.defectLineId -> embedded defect item |
| `defect_resolution_plans` | authorizes | `stock_scrap_records` | 1–n | stock_scrap_records.header.planId |
| `defect_resolution_plans` | reclassifies | `stock_quality_changes` | 1–n | stock_quality_changes.header.planId |
| `inventory_balances` | has hold | `stock_holds` | n–n | stock_holds.allocations[].balanceId |
| `stock_discrepancies` | may link | `defect_reports` | n–n | polymorphic sources/resolution refs; not a mandatory direct FK |
| `suppliers` | receives request | `supplier_returns` | 1–n | supplier_returns.header.supplierId |
| `supplier_returns` | returned by | `supplier_return_issues` | 1–n | supplier_return_issues.header.supplierReturnId |
| `supplier_returns` | acknowledged by | `supplier_acknowledgements` | 1–n | supplier_acknowledgements.header.supplierReturnId |
| `supplier_return_issues` | reconciled by | `supplier_acknowledgements` | n–n | items[].details.dispatchLineId -> embedded return issue item |
| `purchase_receipts` | return basis | `supplier_returns` | n–n | items[].details.originLineId -> receipt item, conditional |
| `warehouses` | counted by | `stocktakes` | 1–n | stocktakes.header.warehouseId |
| `stocktakes` | captures | `stocktake_snapshots` | 1–n | stocktake_snapshots.stocktakeId |
| `stocktakes` | locks | `stocktake_location_locks` | 1–n | stocktake_location_locks.stocktakeId |
| `stocktake_snapshots` | counted in | `stocktake_counts` | 1–n | stocktake_counts.snapshotId; EMPTY_LOCATION counts may not have snapshot |
| `stocktakes` | resolved by | `stocktake_resolution_plans` | 1–n | stocktake_resolution_plans.header.stocktakeId; logical ref |
| `stocktake_resolution_plans` | adjusted by | `stock_adjustments` | 1–n | stock_adjustments.header.resolutionPlanId |
| `stocktake_counts` | selected in | `stocktake_resolution_plans` | n–n | selectedCounts[] / items[].details.countId |
| `warehouses` | initialized by | `opening_stocks` | 1–n | opening_stocks.header.warehouseId |
| `stock_transactions` | reversed by | `stock_reversals` | 1–n | stock_reversals.header.originalTransactionId; requests/history may be many |
| `opening_stocks` | posts | `stock_transactions` | 1–1 | stockTransactionId; optional before posted; logical 1:1 |
| `stock_reversals` | posts reversal | `stock_transactions` | 1–1 | stockTransactionId; logical 1:1; reversedTransactionId unique on posted transaction |
| `users` | decides | `approval_history` | 1–n | approval_history.decidedBy / requestedBy |
| `users` | uploads | `attachments` | 1–n | attachments.uploadedBy |
| `users` | receives | `notifications` | 1–n | notifications.recipientId |
| `users` | performs | `audit_logs` | 1–n | audit_logs.actorId; SYSTEM actor may have no user |
| `users` | executes | `operation_records` | 1–n | operation_records.actorId |
| `operation_records` | traced by | `audit_logs` | 1–n | audit_logs.operationId |
| `approval_history` | uses evidence | `attachments` | n–n | approval_history.evidenceIds[] |
| `operation_records` | records stock | `stock_transactions` | n–1 | operation_records.stockTransactionId; one operation references at most one transaction |
| `operation_records` | last used by | `replenishment_locks` | 1–n | replenishment_locks.lastOperationId |
| `operation_records` | last used by | `return_source_locks` | 1–n | return_source_locks.lastOperationId |
| `warehouses` | plans for | `replenishment_locks` | 1–n | replenishment_locks.warehouseId |
| `products` | plans for | `replenishment_locks` | 1–n | replenishment_locks.productId |

## A — Tài khoản và phân quyền

<a id="users"></a>
### `users`

Tài khoản nhân viên: một vai trò, nhiều kho được phân công; mật khẩu được băm.

- Model: `User`; số bản ghi mẫu: **6**.
- Nhóm: Tài khoản và phân quyền. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `username` | String | Có | — | maxLength=60; immutable | 6/6 | Tên đăng nhập cố định. |
| `fullName` | String | Có | — | maxLength=160 | 6/6 | Họ tên nhân viên. |
| `passwordHash` | String | Có | — | maxLength=255; select:false | 6/6 | Mật khẩu đã băm; không lưu mật khẩu rõ. |
| `roleId` | ObjectId | Có | REF → roles | — | 6/6 | Tham chiếu roles. |
| `warehouseIds[]` | ObjectId[] | Không | REF → warehouses | default=[] | 6/6 | Tham chiếu warehouses. Mảng ID lưu ngay trong document. |
| `phone` | String | Không | — | maxLength=30 | 6/6 | Số điện thoại. |
| `email` | String | Không | — | maxLength=254 | 0/6 | Địa chỉ email. |
| `isActive` | Boolean | Có | — | default=true | 6/6 | Đang hoạt động/được sử dụng. |
| `version` | Number | Có | — | default=1; min=1 | 6/6 | Phiên bản kiểm soát cập nhật đồng thời. |
| `_id` | ObjectId | Không | — | — | 6/6 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 6/6 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 6/6 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `username_1` | `{"username": 1}` | Có | — |
<a id="roles"></a>
### `roles`

Vai trò có sẵn hoặc do Administrator tạo; giữ danh sách quyền được chọn.

- Model: `Role`; số bản ghi mẫu: **6**.
- Nhóm: Tài khoản và phân quyền. Khóa document: `_id: ObjectId`.
- Quyền lưu trực tiếp trong permissionIds[]. Admin được tạo role mới theo quyền được tick.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `code` | String | Có | — | maxLength=60; immutable | 6/6 | Mã định danh dễ đọc theo phạm vi index. |
| `name` | String | Có | — | maxLength=160 | 6/6 | Tên hiển thị. |
| `description` | String | Không | — | maxLength=500 | 1/6 | Mô tả. |
| `permissionIds[]` | ObjectId[] | Không | REF → permissions | default=[] | 6/6 | Tham chiếu permissions. Mảng ID lưu ngay trong document. |
| `isSystemRole` | Boolean | Không | — | default=false | 6/6 | Thuộc tính is System Role. |
| `isActive` | Boolean | Có | — | default=true | 6/6 | Đang hoạt động/được sử dụng. |
| `version` | Number | Có | — | default=1; min=1 | 6/6 | Phiên bản kiểm soát cập nhật đồng thời. |
| `_id` | ObjectId | Không | — | — | 6/6 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 6/6 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 6/6 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `code_1` | `{"code": 1}` | Có | — |
<a id="permissions"></a>
### `permissions`

Danh mục quyền thao tác có sẵn, phân nhóm theo chức năng.

- Model: `Permission`; số bản ghi mẫu: **101**.
- Nhóm: Tài khoản và phân quyền. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `code` | String | Có | — | maxLength=100; immutable | 101/101 | Mã định danh dễ đọc theo phạm vi index. |
| `name` | String | Có | — | maxLength=250 | 101/101 | Tên hiển thị. |
| `description` | String | Không | — | maxLength=500 | 101/101 | Mô tả. |
| `featureCode` | String | Không | — | maxLength=30 | 101/101 | Thuộc tính feature Code. |
| `isActive` | Boolean | Có | — | default=true | 101/101 | Đang hoạt động/được sử dụng. |
| `_id` | ObjectId | Không | — | — | 101/101 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 101/101 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 101/101 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `code_1` | `{"code": 1}` | Có | — |

## B — Danh mục kho, hàng và đối tác

<a id="warehouses"></a>
### `warehouses`

Kho vật lý, thông tin nhận diện và kích thước sử dụng được.

- Model: `Warehouse`; số bản ghi mẫu: **3**.
- Nhóm: Danh mục kho, hàng và đối tác. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `code` | String | Có | — | maxLength=60; immutable | 3/3 | Mã định danh dễ đọc theo phạm vi index. |
| `name` | String | Có | — | maxLength=160 | 3/3 | Tên hiển thị. |
| `address` | String | Không | — | maxLength=500 | 3/3 | Thuộc tính address. |
| `description` | String | Không | — | maxLength=500 | 3/3 | Mô tả. |
| `lengthMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; length Mm. |
| `widthMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; width Mm. |
| `clearHeightMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; clear Height Mm. |
| `isActive` | Boolean | Có | — | default=true | 3/3 | Đang hoạt động/được sử dụng. |
| `version` | Number | Có | — | default=1; min=1 | 3/3 | Phiên bản kiểm soát cập nhật đồng thời. |
| `_id` | ObjectId | Không | — | — | 3/3 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 3/3 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `code_1` | `{"code": 1}` | Có | — |
<a id="warehouse_locations"></a>
### `warehouse_locations`

Ô/vị trí thuộc một kho, loại ô và kích thước phục vụ kiểm sức chứa.

- Model: `WarehouseLocation`; số bản ghi mẫu: **16**.
- Nhóm: Danh mục kho, hàng và đối tác. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `warehouseId` | ObjectId | Có | REF → warehouses | — | 16/16 | Tham chiếu warehouses. |
| `code` | String | Có | — | maxLength=50 | 16/16 | Mã định danh dễ đọc theo phạm vi index. |
| `name` | String | Không | — | maxLength=160 | 1/16 | Tên hiển thị. |
| `areaCode` | String | Không | — | maxLength=50 | 0/16 | Thuộc tính area Code. |
| `locationType` | String | Có | — | enum=["RECEIVING","STORAGE","STAGING","QUARANTINE","CUSTODY"] | 16/16 | Thuộc tính location Type. |
| `isPickable` | Boolean | Không | — | default=false | 16/16 | Thuộc tính is Pickable. |
| `description` | String | Không | — | maxLength=500 | 0/16 | Mô tả. |
| `isActive` | Boolean | Có | — | default=true | 16/16 | Đang hoạt động/được sử dụng. |
| `version` | Number | Có | — | default=1; min=1 | 16/16 | Phiên bản kiểm soát cập nhật đồng thời. |
| `operationVersion` | Number | Có | — | default=0; min=0 | 16/16 | Phiên bản nguồn/nội dung tại thời điểm xử lý: operation Version. |
| `usableLengthMm` | Number | Không | — | min=1 | 16/16 | Kích thước, đơn vị mm; usable Length Mm. |
| `usableWidthMm` | Number | Không | — | min=1 | 16/16 | Kích thước, đơn vị mm; usable Width Mm. |
| `usableHeightMm` | Number | Không | — | min=1 | 16/16 | Kích thước, đơn vị mm; usable Height Mm. |
| `_id` | ObjectId | Không | — | — | 16/16 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 16/16 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 16/16 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `warehouseId_1_code_1` | `{"warehouseId": 1, "code": 1}` | Có | — |
<a id="products"></a>
### `products`

Sản phẩm nhận diện bằng hãng và SKU của hãng; đơn vị gốc lưu trực tiếp.

- Model: `Product`; số bản ghi mẫu: **2**.
- Nhóm: Danh mục kho, hàng và đối tác. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `sku` | String | Có | — | maxLength=60 | 2/2 | Mã sản phẩm do hãng quy định. |
| `manufacturerCode` | String | Có | — | maxLength=100 | 2/2 | Mã hãng; kết hợp SKU tạo khóa nhận diện sản phẩm. |
| `name` | String | Có | — | maxLength=200 | 2/2 | Tên hiển thị. |
| `material` | String | Không | — | maxLength=160 | 2/2 | Thuộc tính material. |
| `baseUnit` | String | Có | — | maxLength=60 | 2/2 | Tên đơn vị gốc của sản phẩm. |
| `wholeBaseUnits` | Boolean | Có | — | default=true | 2/2 | Thuộc tính whole Base Units. |
| `nominalSize` | String | Không | — | maxLength=60 | 2/2 | Thuộc tính nominal Size. |
| `isActive` | Boolean | Có | — | default=true | 2/2 | Đang hoạt động/được sử dụng. |
| `version` | Number | Có | — | default=1; min=1 | 2/2 | Phiên bản kiểm soát cập nhật đồng thời. |
| `_id` | ObjectId | Không | — | — | 2/2 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 2/2 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 2/2 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `manufacturerCode_1_sku_1` | `{"manufacturerCode": 1, "sku": 1}` | Có | — |
<a id="product_batches"></a>
### `product_batches`

Lô theo sản phẩm, mã trên thùng, tông màu và cỡ; không tách theo nhà cung cấp nếu khớp.

- Model: `ProductBatch`; số bản ghi mẫu: **3**.
- Nhóm: Danh mục kho, hàng và đối tác. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `productId` | ObjectId | Có | REF → products | — | 3/3 | Tham chiếu products. |
| `manufacturerLot` | String | Có | — | maxLength=100 | 3/3 | Thuộc tính manufacturer Lot. |
| `tone` | String | Có | — | maxLength=60 | 3/3 | Thuộc tính tone. |
| `calibre` | String | Có | — | maxLength=60 | 3/3 | Thuộc tính calibre. |
| `identificationStatus` | String | Có | — | enum=["VERIFIED","UNKNOWN"] | 3/3 | Thuộc tính identification Status. |
| `manufacturedOn` | Date | Không | — | — | 2/3 | Thuộc tính manufactured On. |
| `_id` | ObjectId | Không | — | — | 3/3 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 3/3 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `productId_1_manufacturerLot_1_tone_1_calibre_1` | `{"productId": 1, "manufacturerLot": 1, "tone": 1, "calibre": 1}` | Có | — |
<a id="stock_thresholds"></a>
### `stock_thresholds`

Mức tối thiểu và mục tiêu của một sản phẩm tại một kho.

- Model: `StockThreshold`; số bản ghi mẫu: **6**.
- Nhóm: Danh mục kho, hàng và đối tác. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `productId` | ObjectId | Có | REF → products | — | 6/6 | Tham chiếu products. |
| `warehouseId` | ObjectId | Có | REF → warehouses | — | 6/6 | Tham chiếu warehouses. |
| `minimumQty` | Decimal128 | Có | — | — | 6/6 | Số lượng nghiệp vụ: minimum Qty; kiểm quy đổi/nguồn của dòng. |
| `targetQty` | Decimal128 | Có | — | default="[conditional/function]" | 6/6 | Số lượng nghiệp vụ: target Qty; kiểm quy đổi/nguồn của dòng. |
| `version` | Number | Có | — | default=1; min=1 | 6/6 | Phiên bản kiểm soát cập nhật đồng thời. |
| `updatedBy` | ObjectId | Không | REF → users | — | 6/6 | Tham chiếu users. |
| `_id` | ObjectId | Không | — | — | 6/6 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 6/6 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 6/6 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `productId_1_warehouseId_1` | `{"productId": 1, "warehouseId": 1}` | Có | — |
<a id="customers"></a>
### `customers`

Khách hàng gồm mã WMSD, tên và điện thoại; không lưu địa chỉ giao mặc định.

- Model: `Customer`; số bản ghi mẫu: **1**.
- Nhóm: Danh mục kho, hàng và đối tác. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `code` | String | Có | — | maxLength=60; immutable | 1/1 | Mã định danh dễ đọc theo phạm vi index. |
| `name` | String | Có | — | maxLength=200 | 1/1 | Tên hiển thị. |
| `version` | Number | Có | — | default=1; min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `phone` | String | Có | — | maxLength=30 | 1/1 | Số điện thoại. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `code_1` | `{"code": 1}` | Có | — |
<a id="suppliers"></a>
### `suppliers`

Nhà cung cấp và thông tin liên hệ; theo dõi trạng thái chờ/kích hoạt/ngừng.

- Model: `Supplier`; số bản ghi mẫu: **1**.
- Nhóm: Danh mục kho, hàng và đối tác. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `code` | String | Có | — | maxLength=60; immutable | 1/1 | Mã định danh dễ đọc theo phạm vi index. |
| `name` | String | Có | — | maxLength=200 | 1/1 | Tên hiển thị. |
| `version` | Number | Có | — | default=1; min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `contactName` | String | Không | — | maxLength=160 | 0/1 | Thuộc tính contact Name. |
| `phone` | String | Không | — | maxLength=30 | 0/1 | Số điện thoại. |
| `email` | String | Không | — | maxLength=254 | 0/1 | Địa chỉ email. |
| `address` | String | Không | — | maxLength=500 | 0/1 | Thuộc tính address. |
| `status` | String | Có | — | enum=["PENDING","ACTIVE","INACTIVE"]; default="PENDING" | 1/1 | Trạng thái, xem tập enum. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `code_1` | `{"code": 1}` | Có | — |
<a id="delivery_teams"></a>
### `delivery_teams`

Đội vận chuyển nội bộ của shop, dùng để chọn khi bàn giao.

- Model: `DeliveryTeam`; số bản ghi mẫu: **1**.
- Nhóm: Danh mục kho, hàng và đối tác. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `code` | String | Có | — | maxLength=60; immutable | 1/1 | Mã định danh dễ đọc theo phạm vi index. |
| `name` | String | Có | — | maxLength=200 | 1/1 | Tên hiển thị. |
| `version` | Number | Có | — | default=1; min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `isActive` | Boolean | Có | — | default=true | 1/1 | Đang hoạt động/được sử dụng. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `code_1` | `{"code": 1}` | Có | — |

## C — Tồn kho, giữ hàng và sức chứa

<a id="stock_holding_points"></a>
### `stock_holding_points`

Điểm theo dõi tồn: một ô kho hoặc phần hàng đang chuyển theo dòng xuất.

- Model: `StockHoldingPoint`; số bản ghi mẫu: **19**.
- Nhóm: Tồn kho, giữ hàng và sức chứa. Khóa document: `_id: ObjectId`.
- LOCATION: locationId unique khi có ObjectId. IN_TRANSIT: dispatchLineId unique khi có ObjectId.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `type` | String | Có | — | enum=["LOCATION","IN_TRANSIT"] | 19/19 | Thuộc tính type. |
| `locationId` | ObjectId | Không | REF → warehouse_locations | — | 16/19 | Tham chiếu warehouse_locations. |
| `dispatchLineId` | ObjectId | Không | LOGIC → transfer_dispatches.items[]._id | — | 3/19 | ID dòng xuất điều chuyển (dòng nhúng). |
| `_id` | ObjectId | Không | — | — | 19/19 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 16/19 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 16/19 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `locationId_1` | `{"locationId": 1}` | Có | {"partialFilterExpression": {"locationId": {"$type": "objectId"}}} |
| `dispatchLineId_1` | `{"dispatchLineId": 1}` | Có | {"partialFilterExpression": {"dispatchLineId": {"$type": "objectId"}}} |
<a id="inventory_balances"></a>
### `inventory_balances`

Số dư theo điểm tồn, lô, chất lượng và chủ sở hữu; lượng dùng đơn vị gốc.

- Model: `InventoryBalance`; số bản ghi mẫu: **15**.
- Nhóm: Tồn kho, giữ hàng và sức chứa. Khóa document: `_id: ObjectId`.
- ownerId là liên kết đa hình theo ownerType; STORE không cần một bản ghi đối tác.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `holdingPointId` | ObjectId | Có | REF → stock_holding_points | — | 15/15 | Tham chiếu stock_holding_points. |
| `batchId` | ObjectId | Có | REF → product_batches | — | 15/15 | Tham chiếu product_batches. |
| `qualityStatus` | String | Có | — | enum=["PENDING","GOOD","DAMAGED","BLOCKED"] | 15/15 | Trạng thái chất lượng của nhóm tồn. |
| `ownerType` | String | Có | — | enum=["STORE","SUPPLIER","CUSTOMER"] | 15/15 | Loại chủ sở hữu để diễn giải ownerId. |
| `ownerId` | ObjectId | Không | LOGIC → customers / suppliers (ownerType) | — | 15/15 | ID khách/NCC theo ownerType; STORE không có đối tác sở hữu. |
| `quantityBase` | Decimal128 | Có | — | — | 15/15 | Số lượng theo đơn vị gốc của sản phẩm. |
| `version` | Number | Có | — | min=0 | 15/15 | Phiên bản kiểm soát cập nhật đồng thời. |
| `_id` | ObjectId | Không | — | — | 15/15 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 12/15 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 12/15 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `holdingPointId_1_batchId_1_qualityStatus_1_ownerType_1_ownerId_1` | `{"holdingPointId": 1, "batchId": 1, "qualityStatus": 1, "ownerType": 1, "ownerId": 1}` | Có | — |
<a id="stock_transactions"></a>
### `stock_transactions`

Một lần ghi tồn đã thành công, liên kết nghiệp vụ nguồn và mã chống ghi lặp.

- Model: `StockTransaction`; số bản ghi mẫu: **30**.
- Nhóm: Tồn kho, giữ hàng và sức chứa. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `sourceType` | String | Có | — | maxLength=80 | 30/30 | Loại chứng từ để diễn giải sourceId. |
| `sourceId` | ObjectId | Có | — | — | 30/30 | ID chứng từ nguồn, diễn giải theo sourceType. |
| `operation` | String | Có | — | maxLength=40 | 30/30 | Thuộc tính operation. |
| `eventKey` | String | Có | — | maxLength=100 | 30/30 | Thuộc tính event Key. |
| `requestKey` | String | Có | — | maxLength=120 | 30/30 | Khóa của lần gửi để chống lặp. |
| `requestHash` | String | Có | — | maxLength=64; match="/^[a-f\\d]{64}$/i" | 30/30 | Dấu kiểm tra nội dung yêu cầu. |
| `performedBy` | ObjectId | Có | REF → users | — | 30/30 | Tham chiếu users. |
| `occurredAt` | Date | Có | — | — | 30/30 | Thời điểm occurred. |
| `recordedAt` | Date | Có | — | — | 30/30 | Thời điểm recorded. |
| `reversedTransactionId` | ObjectId | Không | REF → stock_transactions | — | 1/30 | Tham chiếu stock_transactions. |
| `_id` | ObjectId | Không | — | — | 30/30 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 30/30 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 21/30 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `requestKey_1` | `{"requestKey": 1}` | Có | — |
| `sourceId_1_operation_1_eventKey_1` | `{"sourceId": 1, "operation": 1, "eventKey": 1}` | Có | — |
| `reversedTransactionId_1` | `{"reversedTransactionId": 1}` | Có | {"partialFilterExpression": {"reversedTransactionId": {"$type": "objectId"}}} |
<a id="stock_movements"></a>
### `stock_movements`

Các dòng biến động của giao dịch tồn; lưu số trước/sau ở nhóm tồn nguồn và đích.

- Model: `StockMovement`; số bản ghi mẫu: **34**.
- Nhóm: Tồn kho, giữ hàng và sức chứa. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `transactionId` | ObjectId | Có | REF → stock_transactions | — | 34/34 | Tham chiếu stock_transactions. |
| `lineNo` | Number | Có | — | min=1 | 34/34 | Thuộc tính line No. |
| `sourceLineId` | ObjectId | Có | — | — | 34/34 | ID dòng nhúng của chứng từ nguồn. |
| `fromBalanceId` | ObjectId | Không | REF → inventory_balances | — | 26/34 | Tham chiếu inventory_balances. |
| `toBalanceId` | ObjectId | Không | REF → inventory_balances | — | 28/34 | Tham chiếu inventory_balances. |
| `quantityBase` | Decimal128 | Có | — | — | 34/34 | Số lượng theo đơn vị gốc của sản phẩm. |
| `fromBefore` | Decimal128 | Không | — | — | 26/34 | Thuộc tính from Before. |
| `fromAfter` | Decimal128 | Không | — | — | 26/34 | Thuộc tính from After. |
| `toBefore` | Decimal128 | Không | — | — | 28/34 | Thuộc tính to Before. |
| `toAfter` | Decimal128 | Không | — | — | 28/34 | Thuộc tính to After. |
| `_id` | ObjectId | Không | — | — | 34/34 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 34/34 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 23/34 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `transactionId_1_lineNo_1` | `{"transactionId": 1, "lineNo": 1}` | Có | — |
<a id="stock_reservations"></a>
### `stock_reservations`

Giữ hàng thực tế cho nhu cầu và lệnh thực hiện; theo dõi đã dùng, giải phóng hoặc chuyển.

- Model: `StockReservation`; số bản ghi mẫu: **2**.
- Nhóm: Tồn kho, giữ hàng và sức chứa. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `demandRef` | Embedded | Có | — | — | 2/2 | Đối tượng nhúng. |
| `demandRef.documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 2/2 | Thuộc tính document Type. |
| `demandRef.documentId` | ObjectId | Có | — | — | 2/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `demandRef.itemId` | ObjectId | Không | — | — | 2/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `demandRef.revision` | Number | Không | — | min=1 | 2/2 | Phiên bản nội dung nghiệp vụ. |
| `executionRef` | Embedded | Không | — | — | 2/2 | Đối tượng nhúng. |
| `executionRef.documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 2/2 | Thuộc tính document Type. |
| `executionRef.documentId` | ObjectId | Có | — | — | 2/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `executionRef.itemId` | ObjectId | Không | — | — | 2/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `executionRef.revision` | Number | Không | — | min=1 | 2/2 | Phiên bản nội dung nghiệp vụ. |
| `balanceId` | ObjectId | Có | REF → inventory_balances | — | 2/2 | Tham chiếu inventory_balances. |
| `reservedQty` | Decimal128 | Có | — | — | 2/2 | Số lượng nghiệp vụ: reserved Qty; kiểm quy đổi/nguồn của dòng. |
| `consumedQty` | Decimal128 | Có | — | default="0" | 2/2 | Số lượng nghiệp vụ: consumed Qty; kiểm quy đổi/nguồn của dòng. |
| `releasedQty` | Decimal128 | Có | — | default="0" | 2/2 | Số lượng nghiệp vụ: released Qty; kiểm quy đổi/nguồn của dòng. |
| `movedQty` | Decimal128 | Có | — | default="0" | 2/2 | Số lượng nghiệp vụ: moved Qty; kiểm quy đổi/nguồn của dòng. |
| `previousReservationId` | ObjectId | Không | REF → stock_reservations | — | 0/2 | Tham chiếu stock_reservations. |
| `sourceAllocationId` | ObjectId | Không | REF → supply_allocations | — | 0/2 | Tham chiếu supply_allocations. |
| `originMovementId` | ObjectId | Không | REF → stock_movements | — | 0/2 | Tham chiếu stock_movements. |
| `creationKey` | String | Có | — | maxLength=160 | 2/2 | Thuộc tính creation Key. |
| `createdBy` | ObjectId | Có | REF → users | — | 2/2 | Tham chiếu users. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `version` | Number | Có | — | default=1; min=1 | 2/2 | Phiên bản kiểm soát cập nhật đồng thời. |
| `_id` | ObjectId | Không | — | — | 2/2 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 2/2 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `creationKey_1` | `{"creationKey": 1}` | Có | — |
| `balanceId_1` | `{"balanceId": 1}` | Không | — |
| `demandRef.documentId_1_demandRef.itemId_1` | `{"demandRef.documentId": 1, "demandRef.itemId": 1}` | Không | — |
<a id="supply_allocations"></a>
### `supply_allocations`

Phân bổ nguồn dự kiến từ PO/TR cho nhu cầu; không cộng như tồn thực tế.

- Model: `SupplyAllocation`; số bản ghi mẫu: **2**.
- Nhóm: Tồn kho, giữ hàng và sức chứa. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `demandRef` | Embedded | Có | — | — | 2/2 | Đối tượng nhúng. |
| `demandRef.documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 2/2 | Thuộc tính document Type. |
| `demandRef.documentId` | ObjectId | Có | — | — | 2/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `demandRef.itemId` | ObjectId | Không | — | — | 2/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `demandRef.revision` | Number | Không | — | min=1 | 2/2 | Phiên bản nội dung nghiệp vụ. |
| `sourceRef` | Embedded | Có | — | — | 2/2 | Đối tượng nhúng. |
| `sourceRef.documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 2/2 | Thuộc tính document Type. |
| `sourceRef.documentId` | ObjectId | Có | — | — | 2/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sourceRef.itemId` | ObjectId | Không | — | — | 2/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sourceRef.revision` | Number | Không | — | min=1 | 2/2 | Phiên bản nội dung nghiệp vụ. |
| `destinationWarehouseId` | ObjectId | Có | REF → warehouses | — | 2/2 | Tham chiếu warehouses. |
| `allocatedQty` | Decimal128 | Có | — | — | 2/2 | Số lượng nghiệp vụ: allocated Qty; kiểm quy đổi/nguồn của dòng. |
| `receivedAssignedQty` | Decimal128 | Có | — | default="0" | 2/2 | Số lượng nghiệp vụ: received Assigned Qty; kiểm quy đổi/nguồn của dòng. |
| `releasedQty` | Decimal128 | Có | — | default="0" | 2/2 | Số lượng nghiệp vụ: released Qty; kiểm quy đổi/nguồn của dòng. |
| `neededBy` | Date | Có | — | — | 2/2 | Người thực hiện: needed. |
| `creationKey` | String | Có | — | maxLength=160 | 2/2 | Thuộc tính creation Key. |
| `createdBy` | ObjectId | Có | REF → users | — | 2/2 | Tham chiếu users. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `version` | Number | Có | — | default=1; min=1 | 2/2 | Phiên bản kiểm soát cập nhật đồng thời. |
| `_id` | ObjectId | Không | — | — | 2/2 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 2/2 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `creationKey_1` | `{"creationKey": 1}` | Có | — |
<a id="storage_stacks"></a>
### `storage_stacks`

Chồng/cụm hàng tại một ô, có kích thước bao ngoài để kiểm diện tích/thể tích.

- Model: `StorageStack`; số bản ghi mẫu: **7**.
- Nhóm: Tồn kho, giữ hàng và sức chứa. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `locationId` | ObjectId | Có | REF → warehouse_locations | — | 7/7 | Tham chiếu warehouse_locations. |
| `code` | String | Có | — | maxLength=60; immutable | 7/7 | Mã định danh dễ đọc theo phạm vi index. |
| `occupiedLengthMm` | Number | Có | — | min=1 | 7/7 | Kích thước, đơn vị mm; occupied Length Mm. |
| `occupiedWidthMm` | Number | Có | — | min=1 | 7/7 | Kích thước, đơn vị mm; occupied Width Mm. |
| `occupiedHeightMm` | Number | Có | — | min=1 | 7/7 | Kích thước, đơn vị mm; occupied Height Mm. |
| `volumeMethod` | String | Có | — | enum=["PACKAGES","MEASURED"] | 7/7 | Thuộc tính volume Method. |
| `supportVolumeMm3` | Decimal128 | C | — | — | 0/7 | Thể tích, đơn vị mm³; support Volume Mm3. |
| `isCleared` | Boolean | Không | — | default=false | 7/7 | Thuộc tính is Cleared. |
| `measurementNote` | String | Không | — | maxLength=1000 | 7/7 | Thuộc tính measurement Note. |
| `createdBy` | ObjectId | Có | REF → users | — | 7/7 | Tham chiếu users. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/7 | Tham chiếu users. |
| `version` | Number | Có | — | default=1; min=1 | 7/7 | Phiên bản kiểm soát cập nhật đồng thời. |
| `_id` | ObjectId | Không | — | — | 7/7 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 0/7 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/7 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `code_1` | `{"code": 1}` | Có | — |
| `locationId_1_isCleared_1` | `{"locationId": 1, "isCleared": 1}` | Không | — |
<a id="storage_stack_items"></a>
### `storage_stack_items`

Hàng trong chồng theo số dư, quy cách và trạng thái đóng gói; không tạo tồn thứ hai.

- Model: `StorageStackItem`; số bản ghi mẫu: **7**.
- Nhóm: Tồn kho, giữ hàng và sức chứa. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `stackId` | ObjectId | Có | REF → storage_stacks | — | 7/7 | Tham chiếu storage_stacks. |
| `balanceId` | ObjectId | Có | REF → inventory_balances | — | 7/7 | Tham chiếu inventory_balances. |
| `packagingState` | String | Có | — | enum=["SEALED","OPEN","LOOSE"] | 7/7 | Thuộc tính packaging State. |
| `packagingSnapshot` | Embedded | Không | — | — | 0/7 | Đối tượng nhúng. |
| `packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 0/7 | Thuộc tính package Unit. |
| `packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 0/7 | Thuộc tính base Units Per Package. |
| `packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 0/7 | Kích thước, đơn vị mm; outer Length Mm. |
| `packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 0/7 | Kích thước, đơn vị mm; outer Width Mm. |
| `packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 0/7 | Kích thước, đơn vị mm; outer Height Mm. |
| `packagingKey` | String | Không | — | maxLength=300 | 7/7 | Thuộc tính packaging Key. |
| `sealedPackCount` | Number | Không | — | min=0 | 0/7 | Thuộc tính sealed Pack Count. |
| `quantityBase` | Decimal128 | Có | — | — | 7/7 | Số lượng theo đơn vị gốc của sản phẩm. |
| `createdBy` | ObjectId | Có | REF → users | — | 7/7 | Tham chiếu users. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/7 | Tham chiếu users. |
| `version` | Number | Có | — | default=1; min=1 | 7/7 | Phiên bản kiểm soát cập nhật đồng thời. |
| `_id` | ObjectId | Không | — | — | 7/7 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 0/7 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/7 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `stackId_1_balanceId_1_packagingState_1_packagingKey_1` | `{"stackId": 1, "balanceId": 1, "packagingState": 1, "packagingKey": 1}` | Có | — |

## D — Bổ sung, mua và nhập hàng

<a id="replenishment_requests"></a>
### `replenishment_requests`

Yêu cầu bổ sung cho một kho; các dòng lưu lượng đề nghị, lượng duyệt và căn cứ nhu cầu.

- Model: `ReplenishmentRequest`; số bản ghi mẫu: **3**.
- Nhóm: Bổ sung, mua và nhập hàng. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 3/3 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["REPLENISHMENT"]; default="REPLENISHMENT" | 3/3 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 3/3 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 3/3 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 3/3 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 3/3 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 3/3 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 3/3 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 2/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 2/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 2/3 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 2/3 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 2/3 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 3/3 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 3/3 | Tham chiếu warehouses. |
| `header.neededOn` | Date | Có | — | — | 3/3 | Thuộc tính needed On. |
| `header.triggerReason` | String | Có | — | maxLength=200 | 3/3 | Thuộc tính trigger Reason. |
| `header.creationKey` | String | Có | — | maxLength=160 | 3/3 | Thuộc tính creation Key. |
| `header.submittedBy` | ObjectId | Không | REF → users | — | 1/3 | Tham chiếu users. |
| `header.submittedAt` | Date | Không | — | — | 1/3 | Thời điểm submitted. |
| `header.approvedRevision` | Number | Không | — | min=1 | 0/3 | Phiên bản nguồn/nội dung tại thời điểm xử lý: approved Revision. |
| `header.latestDecisionId` | ObjectId | Không | REF → approval_history | — | 0/3 | Tham chiếu approval_history. |
| `_id` | ObjectId | Không | — | — | 3/3 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 3/3 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 3/3 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 3/3 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 3/3 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 3/3 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 3/3 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 3/3 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 3/3 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 3/3 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 3/3 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 3/3 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 3/3 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/3 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/3 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/3 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 3/3 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/3 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 3/3 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].approvedQtyBase` | Decimal128 | Không | — | — | 0/3 | Số lượng nghiệp vụ: approved Qty Base; đơn vị gốc. |
| `items[].requiredBatchId` | ObjectId | Không | REF → product_batches | — | 0/3 | Tham chiếu product_batches. |
| `items[].neededBy` | Date | Không | — | — | 0/3 | Người thực hiện: needed. |
| `submissions[]` | Embedded[] | Không | — | — | 0/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `submissions[].documentVersion` | Number | Có | — | min=1 | 0/3 | Phiên bản nguồn/nội dung tại thời điểm xử lý: document Version. |
| `submissions[].submittedBy` | ObjectId | Có | REF → users | — | 0/3 | Tham chiếu users. |
| `submissions[].submittedAt` | Date | Có | — | — | 0/3 | Thời điểm submitted. |
| `submissions[].warehouseId` | ObjectId | Có | REF → warehouses | — | 0/3 | Tham chiếu warehouses. |
| `submissions[].warehouseCodeSnapshot` | String | Có | — | maxLength=30 | 0/3 | Thông tin chụp tại thời điểm ghi phiếu: warehouse Code. |
| `submissions[].warehouseNameSnapshot` | String | Có | — | maxLength=200 | 0/3 | Thông tin chụp tại thời điểm ghi phiếu: warehouse Name. |
| `submissions[].neededOn` | Date | Có | — | — | 0/3 | Thuộc tính needed On. |
| `submissions[].triggerReason` | String | Có | — | maxLength=200 | 0/3 | Thuộc tính trigger Reason. |
| `submissions[].note` | String | Không | — | maxLength=2000 | 0/3 | Ghi chú nghiệp vụ. |
| `submissions[].lines[]` | Embedded[] | Có | — | — | 0/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `submissions[].lines[].lineId` | ObjectId | Có | LOGIC → item (theo loại nguồn) | — | 0/3 | Liên kết logic: item. |
| `submissions[].lines[].lineNo` | Number | Có | — | min=1 | 0/3 | Thuộc tính line No. |
| `submissions[].lines[].productId` | ObjectId | Có | REF → products | — | 0/3 | Tham chiếu products. |
| `submissions[].lines[].productSkuSnapshot` | String | Có | — | maxLength=60 | 0/3 | Thông tin chụp tại thời điểm ghi phiếu: product Sku. |
| `submissions[].lines[].productNameSnapshot` | String | Có | — | maxLength=200 | 0/3 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `submissions[].lines[].baseUomCodeSnapshot` | String | Có | — | maxLength=12 | 0/3 | Thông tin chụp tại thời điểm ghi phiếu: base Uom Code. |
| `submissions[].lines[].enteredUomCodeSnapshot` | String | Có | — | maxLength=12 | 0/3 | Thông tin chụp tại thời điểm ghi phiếu: entered Uom Code. |
| `submissions[].lines[].conversionVersion` | Number | Có | — | min=1 | 0/3 | Phiên bản nguồn/nội dung tại thời điểm xử lý: conversion Version. |
| `submissions[].lines[].enteredQty` | Decimal128 | Có | — | — | 0/3 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `submissions[].lines[].conversionSnapshot` | Decimal128 | Có | — | — | 0/3 | Thông tin chụp tại thời điểm ghi phiếu: conversion. |
| `submissions[].lines[].qtyBase` | Decimal128 | Có | — | — | 0/3 | Thuộc tính qty Base. |
| `submissions[].lines[].triggerType` | String | Có | — | enum=["SALES_SHORTAGE","STOCKTAKE_LOW_STOCK","MANUAL_OTHER"] | 0/3 | Thuộc tính trigger Type. |
| `submissions[].lines[].reasonNote` | String | Có | — | maxLength=2000 | 0/3 | Thuộc tính reason Note. |
| `submissions[].lines[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 0/3 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `submissions[].lines[].enteredUnit` | String | Có | — | maxLength=60 | 0/3 | Đơn vị được nhập trên dòng. |
| `submissions[].lines[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 0/3 | Thuộc tính base Units Per Unit. |
| `submissions[]._id` | ObjectId | Không | — | — | 0/3 | ID ổn định của phần tử nhúng. |
| `submissions[].createdAt` | Date | Không | — | immutable | 0/3 | Thời điểm tạo bản ghi. |
| `submissions[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/3 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 3/3 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/3 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/3 | Thuộc tính cancel Reason. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="purchase_orders"></a>
### `purchase_orders`

Đơn mua theo một RR, một nhà cung cấp và một kho; lưu giá mua, tổng tiền và lịch giao.

- Model: `PurchaseOrder`; số bản ghi mẫu: **1**.
- Nhóm: Bổ sung, mua và nhập hàng. Khóa document: `_id: ObjectId`.
- RR → PO: 1 → tối đa 1; unique index replenishmentRequestId. PO được nhận nhiều đợt.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["PO"]; default="PO" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 1/1 | Tham chiếu warehouses. |
| `header.supplierId` | ObjectId | Có | REF → suppliers | — | 1/1 | Tham chiếu suppliers. |
| `header.expectedOn` | Date | Không | — | — | 1/1 | Thuộc tính expected On. |
| `header.supplierConfirmation` | String | Không | — | maxLength=1000 | 1/1 | Thuộc tính supplier Confirmation. |
| `header.approvedRequestRevision` | Number | Không | — | min=1 | 1/1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: approved Request Revision. |
| `header.orderDate` | Date | Không | — | — | 1/1 | Thuộc tính order Date. |
| `header.issuedAt` | Date | Không | — | — | 1/1 | Thời điểm issued. |
| `header.closedAt` | Date | Không | — | — | 0/1 | Thời điểm closed. |
| `header.closureDecisionId` | ObjectId | Không | REF → approval_history | — | 0/1 | Tham chiếu approval_history. |
| `header.closureReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính closure Reason. |
| `header.supplierSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `header.supplierSnapshot.code` | String | Có | — | maxLength=60 | 1/1 | Mã định danh dễ đọc theo phạm vi index. |
| `header.supplierSnapshot.name` | String | Có | — | maxLength=200 | 1/1 | Tên hiển thị. |
| `header.supplierSnapshot.phone` | String | Không | — | maxLength=30 | 0/1 | Số điện thoại. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].unitPurchasePrice` | Decimal128 | Có | — | — | 1/1 | Thuộc tính unit Purchase Price. |
| `items[].lineAmount` | Decimal128 | Có | — | — | 1/1 | Thuộc tính line Amount. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].requestItemId` | ObjectId | Không | LOGIC → replenishment_requests.items[]._id | — | 1/1 | ID liên kết nghiệp vụ request Item. Không có ref model cố định tại path này. |
| `items[].supplierConfirmedQtyBase` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: supplier Confirmed Qty Base; đơn vị gốc. |
| `items[].supplierConfirmedBy` | ObjectId | Không | REF → users | — | 1/1 | Tham chiếu users. |
| `items[].supplierConfirmedAt` | Date | Không | — | — | 1/1 | Thời điểm supplier confirmed. |
| `items[].cancelledRemainderQtyBase` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: cancelled Remainder Qty Base; đơn vị gốc. |
| `items[].cancellationDecisionId` | ObjectId | Không | REF → approval_history | — | 0/1 | Tham chiếu approval_history. |
| `items[].deliverySchedule[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].deliverySchedule[].quantityBase` | Decimal128 | Có | — | — | 1/1 | Số lượng theo đơn vị gốc của sản phẩm. |
| `items[].deliverySchedule[].expectedAt` | Date | Có | — | — | 1/1 | Thời điểm expected. |
| `items[].deliverySchedule[].supplierReference` | String | Không | — | maxLength=160 | 0/1 | Thuộc tính supplier Reference. |
| `replenishmentRequestId` | ObjectId | Có | LOGIC → replenishment_requests | — | 1/1 | ID liên kết nghiệp vụ replenishment Request. Không có ref model cố định tại path này. |
| `totalAmount` | Decimal128 | Có | — | — | 1/1 | Tổng tiền theo quy tắc của phiếu. |
| `currency` | String | Có | — | maxLength=3 | 1/1 | Thuộc tính currency. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
| `replenishmentRequestId_1` | `{"replenishmentRequestId": 1}` | Có | {"partialFilterExpression": {"replenishmentRequestId": {"$type": "objectId"}}} |
<a id="goods_arrivals"></a>
### `goods_arrivals`

Mỗi lần hàng mua thực đến; giữ lịch sử kể cả khi từ chối toàn bộ, chưa tự tăng tồn sở hữu.

- Model: `GoodsArrival`; số bản ghi mẫu: **1**.
- Nhóm: Bổ sung, mua và nhập hàng. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["ARRIVAL"]; default="ARRIVAL" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 1/1 | Tham chiếu warehouses. |
| `header.supplierId` | ObjectId | Không | REF → suppliers | — | 1/1 | Tham chiếu suppliers. |
| `header.arrivedAt` | Date | Có | — | — | 1/1 | Thời điểm arrived. |
| `header.deliveryReference` | String | Không | — | maxLength=100 | 1/1 | Thuộc tính delivery Reference. |
| `header.purchaseOrderId` | ObjectId | Không | REF → purchase_orders | — | 0/1 | Tham chiếu purchase_orders. |
| `header.recordedAt` | Date | Không | — | — | 0/1 | Thời điểm recorded. |
| `header.deliveredBy` | String | Không | — | maxLength=160 | 0/1 | Người thực hiện: delivered. |
| `header.vehicleReference` | String | Không | — | maxLength=100 | 0/1 | Thuộc tính vehicle Reference. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].purchaseOrderItemId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ purchase Order Item. Không có ref model cố định tại path này. |
| `items[].expectedProductId` | ObjectId | Không | REF → products | — | 0/1 | Tham chiếu products. |
| `items[].observedLabel` | String | Không | — | maxLength=500 | 0/1 | Thuộc tính observed Label. |
| `items[].lotLabelSnapshot` | String | Không | — | maxLength=200 | 0/1 | Thông tin chụp tại thời điểm ghi phiếu: lot Label. |
| `items[].packagingCondition` | String | Không | — | maxLength=30 | 0/1 | Thuộc tính packaging Condition. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="goods_inspections"></a>
### `goods_inspections`

Kết quả kiểm nhận theo từng phần hàng đến, chất lượng và quyết định sở hữu/giữ hộ/từ chối.

- Model: `GoodsInspection`; số bản ghi mẫu: **3**.
- Nhóm: Bổ sung, mua và nhập hàng. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 3/3 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["INSPECTION"]; default="INSPECTION" | 3/3 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 3/3 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 3/3 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 3/3 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 3/3 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 3/3 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 3/3 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 3/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 3/3 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 3/3 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `_id` | ObjectId | Không | — | — | 3/3 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 3/3 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 3/3 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 3/3 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 3/3 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 3/3 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 3/3 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 3/3 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 3/3 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 3/3 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 3/3 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 3/3 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 3/3 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 3/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 3/3 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 3/3 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 3/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 3/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 3/3 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/3 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 3/3 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/3 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 3/3 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/3 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/3 | Thuộc tính cancel Reason. |
| `header` | Embedded | Có | — | — | 3/3 | Đối tượng nhúng. |
| `header.arrivalId` | ObjectId | Không | REF → goods_arrivals | — | 0/3 | Tham chiếu goods_arrivals. |
| `header.warehouseId` | ObjectId | Không | REF → warehouses | — | 0/3 | Tham chiếu warehouses. |
| `header.previousInspectionId` | ObjectId | Không | REF → goods_inspections | — | 0/3 | Tham chiếu goods_inspections. |
| `header.correctionReason` | String | Không | — | maxLength=2000 | 0/3 | Thuộc tính correction Reason. |
| `header.participants[]` | ObjectId[] | Không | REF → users | default=[] | 3/3 | Tham chiếu users. Mảng ID lưu ngay trong document. |
| `header.confirmedBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `header.confirmedAt` | Date | Không | — | — | 0/3 | Thời điểm confirmed. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="purchase_receipts"></a>
### `purchase_receipts`

Phiếu nhận sở hữu hàng mua theo PO và kiểm nhận; có giao dịch tồn khi xác nhận.

- Model: `PurchaseReceipt`; số bản ghi mẫu: **1**.
- Nhóm: Bổ sung, mua và nhập hàng. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["GR_PURCHASE"]; default="GR_PURCHASE" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 1/1 | Tham chiếu warehouses. |
| `header.receiptKind` | String | Có | — | enum=["PURCHASE"]; default="PURCHASE" | 1/1 | Thuộc tính receipt Kind. |
| `header.purchaseOrderId` | ObjectId | Không | REF → purchase_orders | — | 0/1 | Tham chiếu purchase_orders. |
| `header.arrivalId` | ObjectId | Không | REF → goods_arrivals | — | 0/1 | Tham chiếu goods_arrivals. |
| `header.supplierId` | ObjectId | Không | REF → suppliers | — | 0/1 | Tham chiếu suppliers. |
| `header.receivedAt` | Date | Không | — | — | 0/1 | Thời điểm received. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].purchaseOrderItemId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ purchase Order Item. Không có ref model cố định tại path này. |
| `items[].arrivalItemId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ arrival Item. Không có ref model cố định tại path này. |
| `items[].inspectionId` | ObjectId | Không | REF → goods_inspections | — | 0/1 | Tham chiếu goods_inspections. |
| `items[].inspectionResultId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ inspection Result. Không có ref model cố định tại path này. |
| `items[].destinationLocationId` | ObjectId | Không | REF → warehouse_locations | — | 0/1 | Tham chiếu warehouse_locations. |
| `items[].custodyReceiptRef` | Embedded | Không | — | — | 0/1 | Đối tượng nhúng. |
| `items[].custodyReceiptRef.documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 0/1 | Thuộc tính document Type. |
| `items[].custodyReceiptRef.documentId` | ObjectId | Có | — | — | 0/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].custodyReceiptRef.itemId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].custodyReceiptRef.revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `items[].custodyBalanceId` | ObjectId | Không | REF → inventory_balances | — | 0/1 | Tham chiếu inventory_balances. |
| `items[].supplierScheduleId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ supplier Schedule. Không có ref model cố định tại path này. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 1/1 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 1/1 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 1/1 | Thời điểm posted. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |

## E — BF03 chuyển ô và BF04 chuyển giữa kho

<a id="warehouse_transfer_requests"></a>
### `warehouse_transfer_requests`

TR chuyển giữa hai kho: lượng đề nghị/duyệt và tiến độ; một TR có nhiều phiếu xuất.

- Model: `WarehouseTransferRequest`; số bản ghi mẫu: **2**.
- Nhóm: BF03 chuyển ô và BF04 chuyển giữa kho. Khóa document: `_id: ObjectId`.
- Một TR → nhiều phiếu xuất; tổng lượng không vượt duyệt. Hạn mức phải kiểm theo dòng trong nghiệp vụ.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 2/2 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["TRANSFER_REQUEST"]; default="TRANSFER_REQUEST" | 2/2 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 2/2 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 2/2 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 2/2 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 2/2 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 2/2 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 2/2 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/2 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 0/2 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/2 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/2 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 0/2 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 2/2 | Đối tượng nhúng. |
| `header.sourceWarehouseId` | ObjectId | Có | REF → warehouses | — | 2/2 | Tham chiếu warehouses. |
| `header.destinationWarehouseId` | ObjectId | Có | REF → warehouses | — | 2/2 | Tham chiếu warehouses. |
| `header.neededOn` | Date | Không | — | — | 1/2 | Thuộc tính needed On. |
| `header.approvedVersion` | Number | Không | — | min=1 | 0/2 | Phiên bản nguồn/nội dung tại thời điểm xử lý: approved Version. |
| `header.approvedRevision` | Number | Không | — | min=1 | 2/2 | Phiên bản nguồn/nội dung tại thời điểm xử lý: approved Revision. |
| `header.requestedBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `header.requestedAt` | Date | Không | — | — | 0/2 | Thời điểm requested. |
| `header.reason` | String | Không | — | maxLength=2000 | 0/2 | Lý do xử lý. |
| `header.approvalStatus` | String | Không | — | maxLength=40 | 2/2 | Thuộc tính approval Status. |
| `header.executionStatus` | String | Không | — | maxLength=40 | 2/2 | Thuộc tính execution Status. |
| `header.reviewedBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `header.reviewedAt` | Date | Không | — | — | 0/2 | Thời điểm reviewed. |
| `header.rejectionReason` | String | Không | — | maxLength=2000 | 0/2 | Thuộc tính rejection Reason. |
| `header.closedBy` | ObjectId | Không | REF → users | — | 2/2 | Tham chiếu users. |
| `header.closedAt` | Date | Không | — | — | 2/2 | Thời điểm closed. |
| `_id` | ObjectId | Không | — | — | 2/2 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 2/2 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 2/2 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 2/2 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 2/2 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 2/2 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 2/2 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 2/2 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 2/2 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 2/2 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/2 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/2 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/2 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/2 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/2 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/2 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 2/2 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 2/2 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 2/2 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/2 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 0/2 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/2 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 0/2 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 0/2 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/2 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/2 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 2/2 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/2 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 2/2 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].approvedQtyBase` | Decimal128 | Không | — | — | 2/2 | Số lượng nghiệp vụ: approved Qty Base; đơn vị gốc. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/2 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 2/2 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/2 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/2 | Thuộc tính cancel Reason. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="transfer_dispatches"></a>
### `transfer_dispatches`

Phiếu xuất điều chuyển từng đợt theo TR; chứa bàn giao và lượng thực xuất sang đang chuyển.

- Model: `TransferDispatch`; số bản ghi mẫu: **3**.
- Nhóm: BF03 chuyển ô và BF04 chuyển giữa kho. Khóa document: `_id: ObjectId`.
- handovers[] nhúng, không phải collection. Một phiếu xuất có nhiều phiếu nhận.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 3/3 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["TRANSFER_DISPATCH"]; default="TRANSFER_DISPATCH" | 3/3 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 3/3 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 3/3 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 3/3 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 3/3 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 3/3 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 3/3 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 3/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 3/3 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 3/3 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 3/3 | Đối tượng nhúng. |
| `header.requestId` | ObjectId | Có | LOGIC → warehouse_transfer_requests | — | 3/3 | Liên kết logic: document. |
| `header.dispatchedBy` | ObjectId | Có | REF → users | — | 3/3 | Tham chiếu users. |
| `header.dispatchedAt` | Date | Có | — | — | 3/3 | Thời điểm dispatched. |
| `header.approvedRevision` | Number | Không | — | min=1 | 3/3 | Phiên bản nguồn/nội dung tại thời điểm xử lý: approved Revision. |
| `header.sourceWarehouseId` | ObjectId | Không | REF → warehouses | — | 3/3 | Tham chiếu warehouses. |
| `header.destinationWarehouseId` | ObjectId | Không | REF → warehouses | — | 3/3 | Tham chiếu warehouses. |
| `_id` | ObjectId | Không | — | — | 3/3 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 3/3 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 3/3 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 3/3 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 3/3 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 3/3 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 3/3 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 3/3 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/3 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/3 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/3 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/3 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/3 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/3 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 3/3 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 3/3 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 3/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 3/3 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 3/3 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 3/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 3/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/3 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/3 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/3 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 3/3 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `handovers[]` | Embedded[] | Không | — | — | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `handovers[].documentNo` | String | Có | — | maxLength=50 | 3/3 | Số phiếu dễ đọc, duy nhất trong collection. |
| `handovers[].documentKind` | String | Có | — | enum=["HANDOVER"]; default="HANDOVER" | 3/3 | Loại chứng từ. |
| `handovers[].workflowStatus` | String | Có | — | maxLength=40 | 3/3 | Trạng thái xử lý của phiếu. |
| `handovers[].version` | Number | Có | — | min=1 | 3/3 | Phiên bản kiểm soát cập nhật đồng thời. |
| `handovers[].createdBy` | ObjectId | Có | REF → users | — | 3/3 | Tham chiếu users. |
| `handovers[].occurredAt` | Date | Không | — | — | 3/3 | Thời điểm occurred. |
| `handovers[].note` | String | Không | — | maxLength=2000 | 1/3 | Ghi chú nghiệp vụ. |
| `handovers[].externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 3/3 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `handovers[].sources[]` | Embedded[] | Không | — | — | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `handovers[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 3/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `handovers[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 3/3 | Thuộc tính subject Collection. |
| `handovers[].sources[].relationCode` | String | Có | — | maxLength=40 | 3/3 | Thuộc tính relation Code. |
| `handovers[].sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `handovers[].sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `handovers[].sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `handovers[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `handovers[].sources[].linkedQty` | Decimal128 | Không | — | — | 0/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `handovers[].sources[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `handovers[].header` | Embedded | Có | — | — | 3/3 | Đối tượng nhúng. |
| `handovers[].header.relatedDocumentId` | ObjectId | Có | LOGIC → document (theo loại nguồn) | — | 3/3 | Liên kết logic: document. |
| `handovers[].header.recipientName` | String | Có | — | maxLength=160 | 3/3 | Thuộc tính recipient Name. |
| `handovers[].header.carrierId` | ObjectId | Không | REF → delivery_teams | — | 3/3 | Tham chiếu delivery_teams. |
| `handovers[].header.handedOverAt` | Date | Có | — | — | 3/3 | Thời điểm handed over. |
| `handovers[].header.confirmedBy` | ObjectId | Có | REF → users | — | 3/3 | Tham chiếu users. |
| `handovers[].header.teamNameAtHandover` | String | Không | — | maxLength=200 | 3/3 | Thuộc tính team Name At Handover. |
| `handovers[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `handovers[].createdAt` | Date | Không | — | immutable | 3/3 | Thời điểm tạo bản ghi. |
| `handovers[].updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |
| `handovers[].items[]` | Embedded[] | Không | — | default=[] | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `handovers[].items[].lineNo` | Number | Có | — | min=1 | 3/3 | Thuộc tính line No. |
| `handovers[].items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 3/3 | Discriminator chọn cấu trúc details của dòng. |
| `handovers[].items[].productId` | ObjectId | Có | REF → products | — | 3/3 | Tham chiếu products. |
| `handovers[].items[].lotId` | ObjectId | Không | REF → product_batches | — | 3/3 | Tham chiếu product_batches. |
| `handovers[].items[].enteredUnit` | String | Có | — | maxLength=60 | 3/3 | Đơn vị được nhập trên dòng. |
| `handovers[].items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `handovers[].items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 3/3 | Thuộc tính base Units Per Unit. |
| `handovers[].items[].packagingSnapshot` | Embedded | Không | — | — | 1/3 | Đối tượng nhúng. |
| `handovers[].items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/3 | Thuộc tính package Unit. |
| `handovers[].items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/3 | Thuộc tính base Units Per Package. |
| `handovers[].items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/3 | Kích thước, đơn vị mm; outer Length Mm. |
| `handovers[].items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/3 | Kích thước, đơn vị mm; outer Width Mm. |
| `handovers[].items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/3 | Kích thước, đơn vị mm; outer Height Mm. |
| `handovers[].items[].enteredQty` | Decimal128 | Có | — | — | 3/3 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `handovers[].items[].qtyBase` | Decimal128 | Có | — | — | 3/3 | Thuộc tính qty Base. |
| `handovers[].items[].productNameSnapshot` | String | Có | — | maxLength=200 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `handovers[].items[].sources[]` | Embedded[] | Không | — | — | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `handovers[].items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 3/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `handovers[].items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 3/3 | Thuộc tính subject Collection. |
| `handovers[].items[].sources[].relationCode` | String | Có | — | maxLength=40 | 3/3 | Thuộc tính relation Code. |
| `handovers[].items[].sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `handovers[].items[].sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `handovers[].items[].sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `handovers[].items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 3/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `handovers[].items[].sources[].linkedQty` | Decimal128 | Không | — | — | 3/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `handovers[].items[].sources[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `handovers[].items[].createdAt` | Date | Không | — | — | 1/3 | Thời điểm tạo bản ghi. |
| `handovers[].items[].updatedAt` | Date | Không | — | — | 1/3 | Thời điểm cập nhật bản ghi. |
| `handovers[].items[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/3 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 3/3 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/3 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/3 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 3/3 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 3/3 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 3/3 | Thời điểm posted. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="transfer_receipts"></a>
### `transfer_receipts`

Phiếu nhận một phần hoặc toàn bộ hàng của phiếu xuất; tách hàng đạt và hàng lỗi tại kho đích.

- Model: `TransferReceipt`; số bản ghi mẫu: **4**.
- Nhóm: BF03 chuyển ô và BF04 chuyển giữa kho. Khóa document: `_id: ObjectId`.
- Nhận vào ô nhận/cách ly; TO xếp hàng xử lý phần hàng cần xếp, không cộng lại tồn.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 4/4 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["MWTR"]; default="MWTR" | 4/4 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 4/4 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 4/4 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 4/4 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 4/4 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 4/4 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 4/4 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 4/4 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 4/4 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 4/4 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 4/4 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/4 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/4 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/4 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/4 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/4 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 4/4 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 4/4 | Đối tượng nhúng. |
| `header.dispatchId` | ObjectId | Có | LOGIC → transfer_dispatches | — | 4/4 | Liên kết logic: document. |
| `header.receivedBy` | ObjectId | Có | REF → users | — | 4/4 | Tham chiếu users. |
| `header.receivedAt` | Date | Có | — | — | 4/4 | Thời điểm received. |
| `header.warehouseId` | ObjectId | Không | REF → warehouses | — | 4/4 | Tham chiếu warehouses. |
| `header.putawayStatus` | String | Không | — | maxLength=40 | 4/4 | Thuộc tính putaway Status. |
| `header.damageReportIds[]` | ObjectId[] | Không | REF → defect_reports | default=[] | 4/4 | Tham chiếu defect_reports. Mảng ID lưu ngay trong document. |
| `_id` | ObjectId | Không | — | — | 4/4 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 4/4 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 4/4 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 4/4 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 4/4 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 4/4 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 4/4 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 4/4 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 4/4 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 4/4 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 4/4 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/4 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/4 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/4 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/4 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/4 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/4 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 4/4 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 4/4 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 4/4 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 4/4 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 4/4 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 4/4 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 4/4 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/4 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/4 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/4 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 4/4 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 4/4 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 4/4 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/4 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/4 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 4/4 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/4 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 4/4 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/4 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/4 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 4/4 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/4 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/4 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/4 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 4/4 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 4/4 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 4/4 | Thời điểm posted. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="internal_transfer_requirements"></a>
### `internal_transfer_requirements`

Yêu cầu lấy/xếp hàng theo phiếu xuất hoặc nhận, là căn cứ tự sinh TO.

- Model: `InternalTransferRequirement`; số bản ghi mẫu: **7**.
- Nhóm: BF03 chuyển ô và BF04 chuyển giữa kho. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 7/7 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["INTERNAL_TRANSFER_REQUIREMENT"]; default="INTERNAL_TRANSFER_REQUIREMENT" | 7/7 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 7/7 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 7/7 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 7/7 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 7/7 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 7/7 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 7/7 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 7/7 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 7/7 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 7/7 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 7/7 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/7 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/7 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/7 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/7 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/7 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 7/7 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 7/7 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 7/7 | Tham chiếu warehouses. |
| `header.sourceDocumentId` | ObjectId | Có | LOGIC → transfer_dispatches / transfer_receipts (sourceType) | — | 7/7 | Liên kết logic: document. |
| `header.taskKind` | String | Có | — | enum=["PICK","PUTAWAY"] | 7/7 | Thuộc tính task Kind. |
| `header.sourceType` | String | Không | — | maxLength=80 | 7/7 | Loại chứng từ để diễn giải sourceId. |
| `_id` | ObjectId | Không | — | — | 7/7 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 7/7 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 7/7 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 7/7 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 7/7 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 7/7 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 7/7 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 7/7 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 7/7 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 7/7 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 7/7 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 2/7 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 2/7 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 2/7 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 2/7 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 2/7 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 2/7 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 7/7 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 7/7 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 7/7 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 7/7 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 7/7 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 7/7 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 7/7 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/7 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/7 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/7 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 7/7 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 7/7 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 7/7 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 2/7 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 2/7 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 7/7 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/7 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 7/7 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/7 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/7 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 7/7 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/7 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/7 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/7 | Thuộc tính cancel Reason. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="transfer_orders"></a>
### `transfer_orders`

TO dùng chung cho chuyển ô, lấy hàng và xếp hàng; ghi nguồn/đích và xác nhận trọn lệnh một lần.

- Model: `TransferOrder`; số bản ghi mẫu: **11**.
- Nhóm: BF03 chuyển ô và BF04 chuyển giữa kho. Khóa document: `_id: ObjectId`.
- BF03 không cần TR. Với BF04: TO PICK xác nhận xuất đi; TO PUTAWAY đổi ô trong kho đích. Quy tắc một ITR → một TO chưa có unique index ở header.requirementId.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 11/11 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["TO"]; default="TO" | 11/11 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 11/11 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 11/11 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 11/11 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 11/11 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 11/11 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 11/11 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 11/11 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 10/11 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 10/11 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 10/11 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/11 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/11 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/11 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/11 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/11 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 10/11 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 11/11 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 11/11 | Tham chiếu warehouses. |
| `header.taskKind` | String | Có | — | enum=["PUTAWAY","PICK","RELOCATE","QUARANTINE","UNPICK"] | 11/11 | Thuộc tính task Kind. |
| `header.assignedTo` | ObjectId | Có | REF → users | — | 11/11 | Tham chiếu users. |
| `header.requirementId` | ObjectId | Không | REF → internal_transfer_requirements | — | 7/11 | Tham chiếu internal_transfer_requirements. |
| `header.reason` | String | Không | — | maxLength=2000 | 0/11 | Lý do xử lý. |
| `header.confirmedBy` | ObjectId | Không | REF → users | — | 8/11 | Tham chiếu users. |
| `header.confirmedAt` | Date | Không | — | — | 8/11 | Thời điểm confirmed. |
| `_id` | ObjectId | Không | — | — | 11/11 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 11/11 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 11/11 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 11/11 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 11/11 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 11/11 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 11/11 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 11/11 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 11/11 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 11/11 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 11/11 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 5/11 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 5/11 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 5/11 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 5/11 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 5/11 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 5/11 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 11/11 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 11/11 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 11/11 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 11/11 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 10/11 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 10/11 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 10/11 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/11 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/11 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/11 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 10/11 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 10/11 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 10/11 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 5/11 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 5/11 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 11/11 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/11 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 11/11 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/11 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/11 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 11/11 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/11 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/11 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/11 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 11/11 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 11/11 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 11/11 | Thời điểm posted. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |

## F — Bán, xuất, giao hàng và hóa đơn

<a id="sales_orders"></a>
### `sales_orders`

Đơn bán có khách hàng, giá và quy đổi trên từng dòng; lưu tham chiếu đơn nguồn.

- Model: `SalesOrder`; số bản ghi mẫu: **5**.
- Nhóm: Bán, xuất, giao hàng và hóa đơn. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 5/5 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["SALES_ORDER"]; default="SALES_ORDER" | 5/5 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 5/5 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 5/5 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 5/5 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 5/5 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 5/5 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 5/5 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 0/5 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/5 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/5 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 0/5 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/5 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/5 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/5 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/5 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/5 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 0/5 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 5/5 | Đối tượng nhúng. |
| `header.externalReferenceId` | ObjectId | Có | REF → external_references | — | 5/5 | Tham chiếu external_references. |
| `header.customerId` | ObjectId | Có | REF → customers | — | 5/5 | Tham chiếu customers. |
| `header.neededOn` | Date | Có | — | — | 5/5 | Thuộc tính needed On. |
| `header.deliveryAddressSnapshot` | String | Có | — | maxLength=500 | 5/5 | Thông tin chụp tại thời điểm ghi phiếu: delivery Address. |
| `header.recipientName` | String | Không | — | maxLength=160 | 0/5 | Thuộc tính recipient Name. |
| `header.recipientPhone` | String | Không | — | maxLength=30 | 0/5 | Thuộc tính recipient Phone. |
| `_id` | ObjectId | Không | — | — | 5/5 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 5/5 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 5/5 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 5/5 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 5/5 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 5/5 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 5/5 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 5/5 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 5/5 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 5/5 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 5/5 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 5/5 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 5/5 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 5/5 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 5/5 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 5/5 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 5/5 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 5/5 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 5/5 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 5/5 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 0/5 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/5 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/5 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 0/5 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/5 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/5 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/5 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/5 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 0/5 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 0/5 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 5/5 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 5/5 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 5/5 | ID ổn định của phần tử nhúng. |
| `items[].unitSellingPrice` | Decimal128 | Có | — | — | 5/5 | Thuộc tính unit Selling Price. |
| `items[].lineAmount` | Decimal128 | Có | — | — | 5/5 | Thuộc tính line Amount. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/5 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 5/5 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].priceRevision` | Number | Không | — | min=1 | 5/5 | Phiên bản nguồn/nội dung tại thời điểm xử lý: price Revision. |
| `orderAmount` | Decimal128 | Có | — | — | 5/5 | Thuộc tính order Amount. |
| `currencyCode` | String | Có | — | maxLength=3 | 5/5 | Thuộc tính currency Code. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/5 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/5 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 5/5 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/5 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/5 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/5 | Thuộc tính cancel Reason. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
| `header.externalReferenceId_1` | `{"header.externalReferenceId": 1}` | Có | — |
<a id="warehouse_issue_requests"></a>
### `warehouse_issue_requests`

Yêu cầu xuất do Sales chia từ đơn bán; mới lập chưa giữ hoặc trừ tồn.

- Model: `WarehouseIssueRequest`; số bản ghi mẫu: **2**.
- Nhóm: Bán, xuất, giao hàng và hóa đơn. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 2/2 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["ISSUE_REQUEST"]; default="ISSUE_REQUEST" | 2/2 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 2/2 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 2/2 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 2/2 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 2/2 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 2/2 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 2/2 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 2/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 2/2 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 2/2 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/2 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/2 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 2/2 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 2/2 | Đối tượng nhúng. |
| `header.salesOrderId` | ObjectId | Có | LOGIC → sales_orders | — | 2/2 | Liên kết logic: document. |
| `header.requestedWarehouseId` | ObjectId | Có | REF → warehouses | — | 2/2 | Tham chiếu warehouses. |
| `header.neededOn` | Date | Có | — | — | 2/2 | Thuộc tính needed On. |
| `header.deliveryAddressSnapshot` | String | Có | — | maxLength=500 | 2/2 | Thông tin chụp tại thời điểm ghi phiếu: delivery Address. |
| `header.salesOrderVersion` | Number | Không | — | min=1 | 0/2 | Phiên bản nguồn/nội dung tại thời điểm xử lý: sales Order Version. |
| `header.requestedBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `header.requestedAt` | Date | Không | — | — | 0/2 | Thời điểm requested. |
| `_id` | ObjectId | Không | — | — | 2/2 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 2/2 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 2/2 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 2/2 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 2/2 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 2/2 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 2/2 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 2/2 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 2/2 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 2/2 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 2/2 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 2/2 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 2/2 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 2/2 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 2/2 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 2/2 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 2/2 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 2/2 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 2/2 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 2/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 2/2 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 2/2 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/2 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 2/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 2/2 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 2/2 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 2/2 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 2/2 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 2/2 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/2 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 2/2 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/2 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 2/2 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/2 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/2 | Thuộc tính cancel Reason. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="delivery_orders"></a>
### `delivery_orders`

Lệnh giao một đợt từ một kho theo WIR; có lịch, người nhận, địa chỉ và lượng cam kết.

- Model: `DeliveryOrder`; số bản ghi mẫu: **3**.
- Nhóm: Bán, xuất, giao hàng và hóa đơn. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 3/3 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["OUTBOUND_DELIVERY"]; default="OUTBOUND_DELIVERY" | 3/3 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 3/3 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 3/3 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 3/3 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 3/3 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 3/3 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 3/3 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 3/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 3/3 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 3/3 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 3/3 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 3/3 | Tham chiếu warehouses. |
| `header.issueRequestId` | ObjectId | Có | LOGIC → warehouse_issue_requests | — | 3/3 | Liên kết logic: document. |
| `header.plannedOn` | Date | Có | — | — | 3/3 | Thuộc tính planned On. |
| `header.recipientName` | String | Không | — | maxLength=160 | 0/3 | Thuộc tính recipient Name. |
| `header.recipientPhone` | String | Không | — | maxLength=30 | 0/3 | Thuộc tính recipient Phone. |
| `header.deliveryAddress` | String | Không | — | maxLength=500 | 0/3 | Thuộc tính delivery Address. |
| `header.deliveryInstructions` | String | Không | — | maxLength=2000 | 0/3 | Thuộc tính delivery Instructions. |
| `header.releasedBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `header.releasedAt` | Date | Không | — | — | 0/3 | Thời điểm released. |
| `header.replacesDeliveryOrderId` | ObjectId | Không | REF → delivery_orders | — | 0/3 | Tham chiếu delivery_orders. |
| `_id` | ObjectId | Không | — | — | 3/3 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 3/3 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 3/3 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 3/3 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 3/3 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 3/3 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 3/3 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 3/3 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 3/3 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 3/3 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 3/3 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 3/3 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 3/3 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 3/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 3/3 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 3/3 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 3/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 3/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 3/3 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/3 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 3/3 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/3 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 3/3 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/3 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/3 | Thuộc tính cancel Reason. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="sales_goods_issues"></a>
### `sales_goods_issues`

Phiếu thực xuất bán theo lệnh giao; lưu lô, lượng, giá chụp tại nguồn và bàn giao nhúng.

- Model: `SalesGoodsIssue`; số bản ghi mẫu: **3**.
- Nhóm: Bán, xuất, giao hàng và hóa đơn. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 3/3 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["GI_SALE"]; default="GI_SALE" | 3/3 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 3/3 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 3/3 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 3/3 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 3/3 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 3/3 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 3/3 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 3/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 3/3 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 3/3 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 3/3 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 3/3 | Tham chiếu warehouses. |
| `header.issueKind` | String | Có | — | enum=["SALE"]; default="SALE" | 3/3 | Thuộc tính issue Kind. |
| `header.deliveryOrderId` | ObjectId | Không | REF → delivery_orders | — | 0/3 | Tham chiếu delivery_orders. |
| `header.issuedAt` | Date | Không | — | — | 3/3 | Thời điểm issued. |
| `header.issuedBy` | ObjectId | Không | REF → users | — | 3/3 | Tham chiếu users. |
| `_id` | ObjectId | Không | — | — | 3/3 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 3/3 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 3/3 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 3/3 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 3/3 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 3/3 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 3/3 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 3/3 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 3/3 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 3/3 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 3/3 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 3/3 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 3/3 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 3/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 3/3 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 3/3 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 3/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 3/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 3/3 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/3 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 3/3 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].salesOrderItemId` | ObjectId | Không | — | — | 3/3 | ID liên kết nghiệp vụ sales Order Item. Không có ref model cố định tại path này. |
| `items[].salePriceSnapshot` | Embedded | Không | — | — | 3/3 | Đối tượng nhúng. |
| `items[].salePriceSnapshot.saleUnit` | String | Có | — | maxLength=60 | 3/3 | Thuộc tính sale Unit. |
| `items[].salePriceSnapshot.baseUnitsPerSaleUnit` | Decimal128 | Có | — | — | 3/3 | Thuộc tính base Units Per Sale Unit. |
| `items[].salePriceSnapshot.unitSellingPrice` | Decimal128 | Có | — | — | 3/3 | Thuộc tính unit Selling Price. |
| `items[].salePriceSnapshot.salesOrderRevision` | Number | Có | — | min=1 | 3/3 | Phiên bản nguồn/nội dung tại thời điểm xử lý: sales Order Revision. |
| `handovers[]` | Embedded[] | Không | — | — | 0/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `handovers[].documentNo` | String | Có | — | maxLength=50 | 0/3 | Số phiếu dễ đọc, duy nhất trong collection. |
| `handovers[].documentKind` | String | Có | — | enum=["HANDOVER"]; default="HANDOVER" | 0/3 | Loại chứng từ. |
| `handovers[].workflowStatus` | String | Có | — | maxLength=40 | 0/3 | Trạng thái xử lý của phiếu. |
| `handovers[].version` | Number | Có | — | min=1 | 0/3 | Phiên bản kiểm soát cập nhật đồng thời. |
| `handovers[].createdBy` | ObjectId | Có | REF → users | — | 0/3 | Tham chiếu users. |
| `handovers[].occurredAt` | Date | Không | — | — | 0/3 | Thời điểm occurred. |
| `handovers[].note` | String | Không | — | maxLength=2000 | 0/3 | Ghi chú nghiệp vụ. |
| `handovers[].externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 0/3 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `handovers[].sources[]` | Embedded[] | Không | — | — | 0/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `handovers[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `handovers[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/3 | Thuộc tính subject Collection. |
| `handovers[].sources[].relationCode` | String | Có | — | maxLength=40 | 0/3 | Thuộc tính relation Code. |
| `handovers[].sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `handovers[].sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `handovers[].sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `handovers[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `handovers[].sources[].linkedQty` | Decimal128 | Không | — | — | 0/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `handovers[].sources[]._id` | ObjectId | Không | — | — | 0/3 | ID ổn định của phần tử nhúng. |
| `handovers[].header` | Embedded | Có | — | — | 0/3 | Đối tượng nhúng. |
| `handovers[].header.relatedDocumentId` | ObjectId | Có | LOGIC → document (theo loại nguồn) | — | 0/3 | Liên kết logic: document. |
| `handovers[].header.recipientName` | String | Có | — | maxLength=160 | 0/3 | Thuộc tính recipient Name. |
| `handovers[].header.carrierId` | ObjectId | Không | REF → delivery_teams | — | 0/3 | Tham chiếu delivery_teams. |
| `handovers[].header.handedOverAt` | Date | Có | — | — | 0/3 | Thời điểm handed over. |
| `handovers[].header.confirmedBy` | ObjectId | Có | REF → users | — | 0/3 | Tham chiếu users. |
| `handovers[].header.teamNameAtHandover` | String | Không | — | maxLength=200 | 0/3 | Thuộc tính team Name At Handover. |
| `handovers[]._id` | ObjectId | Không | — | — | 0/3 | ID ổn định của phần tử nhúng. |
| `handovers[].createdAt` | Date | Không | — | immutable | 0/3 | Thời điểm tạo bản ghi. |
| `handovers[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `handovers[].items[]` | Embedded[] | Không | — | default=[] | 0/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `handovers[].items[].lineNo` | Number | Có | — | min=1 | 0/3 | Thuộc tính line No. |
| `handovers[].items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 0/3 | Discriminator chọn cấu trúc details của dòng. |
| `handovers[].items[].productId` | ObjectId | Có | REF → products | — | 0/3 | Tham chiếu products. |
| `handovers[].items[].lotId` | ObjectId | Không | REF → product_batches | — | 0/3 | Tham chiếu product_batches. |
| `handovers[].items[].enteredUnit` | String | Có | — | maxLength=60 | 0/3 | Đơn vị được nhập trên dòng. |
| `handovers[].items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 0/3 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `handovers[].items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 0/3 | Thuộc tính base Units Per Unit. |
| `handovers[].items[].packagingSnapshot` | Embedded | Không | — | — | 0/3 | Đối tượng nhúng. |
| `handovers[].items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 0/3 | Thuộc tính package Unit. |
| `handovers[].items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 0/3 | Thuộc tính base Units Per Package. |
| `handovers[].items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 0/3 | Kích thước, đơn vị mm; outer Length Mm. |
| `handovers[].items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 0/3 | Kích thước, đơn vị mm; outer Width Mm. |
| `handovers[].items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 0/3 | Kích thước, đơn vị mm; outer Height Mm. |
| `handovers[].items[].enteredQty` | Decimal128 | Có | — | — | 0/3 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `handovers[].items[].qtyBase` | Decimal128 | Có | — | — | 0/3 | Thuộc tính qty Base. |
| `handovers[].items[].productNameSnapshot` | String | Có | — | maxLength=200 | 0/3 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `handovers[].items[].sources[]` | Embedded[] | Không | — | — | 0/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `handovers[].items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `handovers[].items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/3 | Thuộc tính subject Collection. |
| `handovers[].items[].sources[].relationCode` | String | Có | — | maxLength=40 | 0/3 | Thuộc tính relation Code. |
| `handovers[].items[].sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `handovers[].items[].sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `handovers[].items[].sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `handovers[].items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `handovers[].items[].sources[].linkedQty` | Decimal128 | Không | — | — | 0/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `handovers[].items[].sources[]._id` | ObjectId | Không | — | — | 0/3 | ID ổn định của phần tử nhúng. |
| `handovers[].items[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `handovers[].items[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `handovers[].items[]._id` | ObjectId | Không | — | — | 0/3 | ID ổn định của phần tử nhúng. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/3 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 3/3 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/3 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/3 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 3/3 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 3/3 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 3/3 | Thời điểm posted. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="delivery_confirmations"></a>
### `delivery_confirmations`

Kết quả khách thực nhận theo phiếu xuất; lượng nhận hợp lệ dùng tính hóa đơn.

- Model: `DeliveryConfirmation`; số bản ghi mẫu: **2**.
- Nhóm: Bán, xuất, giao hàng và hóa đơn. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 2/2 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["DELIVERY_CONFIRMATION"]; default="DELIVERY_CONFIRMATION" | 2/2 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 2/2 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 2/2 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 2/2 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 2/2 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 2/2 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 2/2 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 2/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 2/2 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 2/2 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/2 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/2 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 2/2 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 2/2 | Đối tượng nhúng. |
| `header.salesOrderId` | ObjectId | Có | LOGIC → document (theo loại nguồn) | — | 2/2 | Liên kết logic: document. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 2/2 | Tham chiếu warehouses. |
| `header.recipientName` | String | Có | — | maxLength=160 | 2/2 | Thuộc tính recipient Name. |
| `header.deliveredAt` | Date | Có | — | — | 2/2 | Thời điểm delivered. |
| `header.confirmedBy` | ObjectId | Có | REF → users | — | 2/2 | Tham chiếu users. |
| `header.confirmedAt` | Date | Có | — | default="[conditional/function]" | 2/2 | Thời điểm confirmed. |
| `header.operationId` | ObjectId | Có | REF → operation_records | — | 2/2 | Tham chiếu operation_records. |
| `header.goodsIssueId` | ObjectId | Không | REF → sales_goods_issues | — | 1/2 | Tham chiếu sales_goods_issues. |
| `header.correctsConfirmationId` | ObjectId | Không | REF → delivery_confirmations | — | 0/2 | Tham chiếu delivery_confirmations. |
| `_id` | ObjectId | Không | — | — | 2/2 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 2/2 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 2/2 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 2/2 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 2/2 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 2/2 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 2/2 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 2/2 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 2/2 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 2/2 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/2 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/2 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/2 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/2 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/2 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/2 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 2/2 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 2/2 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 2/2 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 2/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 2/2 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 2/2 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/2 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 2/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 2/2 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 2/2 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/2 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/2 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 2/2 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/2 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 2/2 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/2 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 2/2 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/2 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/2 | Thuộc tính cancel Reason. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="sales_invoices"></a>
### `sales_invoices`

Hóa đơn tổng hợp một SO: từng dòng có phiếu/ngày xuất, lượng xuất, lượng nhận và giá tính tiền.

- Model: `SalesInvoice`; số bản ghi mẫu: **1**.
- Nhóm: Bán, xuất, giao hàng và hóa đơn. Khóa document: `_id: ObjectId`.
- Có tối đa một hóa đơn ISSUED cho mỗi SO (partial unique). Ví dụ xuất 100, nhận 98: hiển thị 100, tính tiền 98.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `invoiceNo` | String | Có | — | maxLength=50 | 1/1 | Thuộc tính invoice No. |
| `salesOrderId` | ObjectId | Có | REF → sales_orders | — | 1/1 | Tham chiếu sales_orders. |
| `customerId` | ObjectId | Có | REF → customers | — | 1/1 | Tham chiếu customers. |
| `customerSnapshot.name` | String | Có | — | maxLength=200 | 1/1 | Tên hiển thị. |
| `customerSnapshot.phone` | String | Có | — | maxLength=30 | 1/1 | Số điện thoại. |
| `currencyCode` | String | Có | — | enum=["VND"] | 1/1 | Thuộc tính currency Code. |
| `items[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].salesOrderItemId` | ObjectId | Có | — | — | 1/1 | ID liên kết nghiệp vụ sales Order Item. Không có ref model cố định tại path này. |
| `items[].goodsIssueId` | ObjectId | Có | REF → sales_goods_issues | — | 1/1 | Tham chiếu sales_goods_issues. |
| `items[].goodsIssueItemId` | ObjectId | Có | — | — | 1/1 | ID liên kết nghiệp vụ goods Issue Item. Không có ref model cố định tại path này. |
| `items[].goodsIssueNo` | String | Có | — | maxLength=50 | 1/1 | Thuộc tính goods Issue No. |
| `items[].issuedAt` | Date | Có | — | — | 1/1 | Thời điểm issued. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].issuedQtyBase` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: issued Qty Base; đơn vị gốc. |
| `items[].billedQtyBase` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: billed Qty Base; đơn vị gốc. |
| `items[].saleUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính sale Unit. |
| `items[].baseUnitsPerSaleUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Sale Unit. |
| `items[].unitSellingPrice` | Decimal128 | Có | — | — | 1/1 | Thuộc tính unit Selling Price. |
| `items[].lineAmount` | Decimal128 | Có | — | — | 1/1 | Thuộc tính line Amount. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `totalAmount` | Decimal128 | Có | — | — | 1/1 | Tổng tiền theo quy tắc của phiếu. |
| `status` | String | Có | — | enum=["DRAFT","ISSUED"] | 1/1 | Trạng thái, xem tập enum. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `issuedBy` | ObjectId | Không | REF → users | — | 1/1 | Tham chiếu users. |
| `issuedAt` | Date | Không | — | — | 1/1 | Thời điểm issued. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `invoiceNo_1` | `{"invoiceNo": 1}` | Có | — |
| `salesOrderId_1` | `{"salesOrderId": 1}` | Có | {"partialFilterExpression": {"status": "ISSUED"}} |
<a id="external_payment_confirmations"></a>
### `external_payment_confirmations`

Sales xác nhận đã nhận đủ tiền bên ngoài để hoàn thành SO; không quản lý thanh toán/công nợ.

- Model: `ExternalPaymentConfirmation`; số bản ghi mẫu: **1**.
- Nhóm: Bán, xuất, giao hàng và hóa đơn. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["PAYMENT_CONFIRMATION"]; default="PAYMENT_CONFIRMATION" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.salesOrderId` | ObjectId | Có | LOGIC → sales_orders | — | 1/1 | Liên kết logic: document. |
| `header.deliveredOrderVersion` | Number | Có | — | min=1 | 1/1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: delivered Order Version. |
| `header.fullPaymentReceived` | Boolean | Có | — | — | 1/1 | Thuộc tính full Payment Received. |
| `header.externalReceiptReference` | String | Không | — | maxLength=300 | 1/1 | Thuộc tính external Receipt Reference. |
| `header.receiptEvidenceId` | ObjectId | Không | REF → attachments | — | 0/1 | Tham chiếu attachments. |
| `header.confirmationNote` | String | Không | — | maxLength=2000 | 1/1 | Thuộc tính confirmation Note. |
| `header.confirmedBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `header.confirmedAt` | Date | Có | — | default="[conditional/function]" | 1/1 | Thời điểm confirmed. |
| `header.operationId` | ObjectId | Có | REF → operation_records | — | 1/1 | Tham chiếu operation_records. |
| `header.voidedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.voidedAt` | Date | Không | — | — | 0/1 | Thời điểm voided. |
| `header.voidReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính void Reason. |
| `header.replacesId` | ObjectId | Không | REF → external_payment_confirmations | — | 0/1 | Tham chiếu external_payment_confirmations. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 0/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 0/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 0/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 0/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 0/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 0/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 0/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 0/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 0/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 0/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 0/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 0/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 0/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 0/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 0/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 0/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 0/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 0/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 0/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 0/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 0/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |

## G — Giao thất bại, nhận về và giao bù

<a id="failed_deliveries"></a>
### `failed_deliveries`

Phần hàng đã xuất nhưng khách không nhận, gồm lý do, lượng và người đang giữ.

- Model: `FailedDelivery`; số bản ghi mẫu: **1**.
- Nhóm: Giao thất bại, nhận về và giao bù. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["FAILED_DELIVERY"]; default="FAILED_DELIVERY" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 1/1 | Tham chiếu warehouses. |
| `header.failureEvidenceId` | ObjectId | Có | REF → attachments | — | 1/1 | Tham chiếu attachments. |
| `header.reason` | String | Có | — | maxLength=2000 | 1/1 | Lý do xử lý. |
| `header.goodsIssueId` | ObjectId | Không | REF → sales_goods_issues | — | 0/1 | Tham chiếu sales_goods_issues. |
| `header.reportedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.recordedAt` | Date | Không | — | — | 0/1 | Thời điểm recorded. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].holderName` | String | Không | — | maxLength=160 | 0/1 | Thuộc tính holder Name. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="failed_delivery_receipts"></a>
### `failed_delivery_receipts`

Phiếu nhận thực tế hàng giao thất bại quay về kho; không cộng hàng còn trên xe.

- Model: `FailedDeliveryReceipt`; số bản ghi mẫu: **1**.
- Nhóm: Giao thất bại, nhận về và giao bù. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["GR_FAILED_DELIVERY"]; default="GR_FAILED_DELIVERY" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 1/1 | Tham chiếu warehouses. |
| `header.receiptKind` | String | Có | — | enum=["FAILED_DELIVERY"]; default="FAILED_DELIVERY" | 1/1 | Thuộc tính receipt Kind. |
| `header.failedDeliveryId` | ObjectId | Không | REF → failed_deliveries | — | 0/1 | Tham chiếu failed_deliveries. |
| `header.receivedAt` | Date | Không | — | — | 0/1 | Thời điểm received. |
| `header.receivedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 1/1 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 1/1 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 1/1 | Thời điểm posted. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="delivery_demand_reopenings"></a>
### `delivery_demand_reopenings`

Mở lại đúng lượng thực về trên nhu cầu của SO/WIR/lệnh giao ban đầu.

- Model: `DeliveryDemandReopening`; số bản ghi mẫu: **1**.
- Nhóm: Giao thất bại, nhận về và giao bù. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `receiptLineId` | ObjectId | Có | LOGIC → failed_delivery_receipts.items[]._id | — | 1/1 | ID liên kết nghiệp vụ receipt Line. Không có ref model cố định tại path này. |
| `stockTransactionId` | ObjectId | Có | REF → stock_transactions | — | 1/1 | Tham chiếu stock_transactions. |
| `salesOrderLineId` | ObjectId | Có | LOGIC → sales_orders.items[]._id | — | 1/1 | ID liên kết nghiệp vụ sales Order Line. Không có ref model cố định tại path này. |
| `issueRequestLineId` | ObjectId | Có | LOGIC → warehouse_issue_requests.items[]._id | — | 1/1 | ID liên kết nghiệp vụ issue Request Line. Không có ref model cố định tại path này. |
| `deliveryOrderLineId` | ObjectId | Có | LOGIC → delivery_orders.items[]._id | — | 1/1 | ID liên kết nghiệp vụ delivery Order Line. Không có ref model cố định tại path này. |
| `goodsIssueLineId` | ObjectId | Có | LOGIC → sales_goods_issues.items[]._id | — | 1/1 | ID liên kết nghiệp vụ goods Issue Line. Không có ref model cố định tại path này. |
| `reopenedQtyBase` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: reopened Qty Base; đơn vị gốc. |
| `sourceVersion` | Number | Có | — | min=1 | 1/1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: source Version. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `receiptLineId_1` | `{"receiptLineId": 1}` | Có | — |
<a id="delivery_commitment_transfers"></a>
### `delivery_commitment_transfers`

Chuyển quyền giao bù từ lệnh cũ sang lệnh mới, tránh giao trùng cùng lượng.

- Model: `DeliveryCommitmentTransfer`; số bản ghi mẫu: **1**.
- Nhóm: Giao thất bại, nhận về và giao bù. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `reopeningReceiptLineId` | ObjectId | Có | LOGIC → delivery_demand_reopenings.receiptLineId | — | 1/1 | ID liên kết nghiệp vụ reopening Receipt Line. Không có ref model cố định tại path này. |
| `fromDeliveryOrderLineId` | ObjectId | Có | LOGIC → delivery_orders.items[]._id | — | 1/1 | ID liên kết nghiệp vụ from Delivery Order Line. Không có ref model cố định tại path này. |
| `toDeliveryOrderLineId` | ObjectId | Có | LOGIC → delivery_orders.items[]._id | — | 1/1 | ID liên kết nghiệp vụ to Delivery Order Line. Không có ref model cố định tại path này. |
| `quantityBase` | Decimal128 | Có | — | — | 1/1 | Số lượng theo đơn vị gốc của sản phẩm. |
| `sourceVersion` | Number | Có | — | min=1 | 1/1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: source Version. |
| `targetVersion` | Number | Có | — | min=1 | 1/1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: target Version. |
| `transferredBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `transferredAt` | Date | Có | — | — | 1/1 | Thời điểm transferred. |
| `operationId` | ObjectId | Có | REF → operation_records | — | 1/1 | Tham chiếu operation_records. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `operationId_1_fromDeliveryOrderLineId_1_toDeliveryOrderLineId_1` | `{"operationId": 1, "fromDeliveryOrderLineId": 1, "toDeliveryOrderLineId": 1}` | Có | — |
<a id="sales_order_cancellations"></a>
### `sales_order_cancellations`

Ghi hủy phần chưa giao hoặc đã về kho đủ điều kiện, có căn cứ và lịch sử.

- Model: `SalesOrderCancellation`; số bản ghi mẫu: **1**.
- Nhóm: Giao thất bại, nhận về và giao bù. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `salesOrderId` | ObjectId | Có | REF → sales_orders | — | 1/1 | Tham chiếu sales_orders. |
| `salesOrderLineId` | ObjectId | Có | LOGIC → sales_orders.items[]._id | — | 1/1 | ID liên kết nghiệp vụ sales Order Line. Không có ref model cố định tại path này. |
| `sourceKind` | String | Có | — | enum=["UNISSUED","FAILED_DELIVERY_RETURN"] | 1/1 | Thuộc tính source Kind. |
| `reopeningReceiptLineId` | ObjectId | Không | LOGIC → delivery_demand_reopenings.receiptLineId | — | 0/1 | ID liên kết nghiệp vụ reopening Receipt Line. Không có ref model cố định tại path này. |
| `cancelledQtyBase` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: cancelled Qty Base; đơn vị gốc. |
| `reason` | String | Có | — | maxLength=2000 | 1/1 | Lý do xử lý. |
| `sourceVersion` | Number | Có | — | min=1 | 1/1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: source Version. |
| `cancelledBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `cancelledAt` | Date | Có | — | — | 1/1 | Thời điểm cancelled. |
| `operationId` | ObjectId | Có | REF → operation_records | — | 1/1 | Tham chiếu operation_records. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `operationId_1_salesOrderLineId_1` | `{"operationId": 1, "salesOrderLineId": 1}` | Có | — |

## H — Khách trả, giữ hộ và chứng từ nguồn

<a id="customer_returns"></a>
### `customer_returns`

Yêu cầu trả sau khi khách đã nhận; có kết quả kiểm và quyết định theo từng phần.

- Model: `CustomerReturn`; số bản ghi mẫu: **1**.
- Nhóm: Khách trả, giữ hộ và chứng từ nguồn. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["CUSTOMER_RETURN"]; default="CUSTOMER_RETURN" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 1/1 | Tham chiếu warehouses. |
| `header.customerId` | ObjectId | Có | REF → customers | — | 1/1 | Tham chiếu customers. |
| `header.financialFollowupStatus` | String | Có | — | default="NOT_RECORDED"; maxLength=20 | 1/1 | Thuộc tính financial Followup Status. |
| `header.openedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.openedAt` | Date | Không | — | — | 0/1 | Thời điểm opened. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `decisions[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `decisions[].decisionId` | ObjectId | Có | REF → approval_history | — | 0/1 | Tham chiếu approval_history. |
| `decisions[].revision` | Number | Có | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `decisions[].reviewedBy` | ObjectId | Có | REF → users | — | 0/1 | Tham chiếu users. |
| `decisions[].reviewedAt` | Date | Có | — | — | 0/1 | Thời điểm reviewed. |
| `decisions[].decision` | String | Có | — | enum=["APPROVE","REJECT","REVISE"] | 0/1 | Thuộc tính decision. |
| `decisions[].reason` | String | Có | — | maxLength=2000 | 0/1 | Lý do xử lý. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="return_inspections"></a>
### `return_inspections`

Các lần kiểm hàng khách trả, giữ lịch sử thay vì ghi đè kết quả trước.

- Model: `ReturnInspection`; số bản ghi mẫu: **1**.
- Nhóm: Khách trả, giữ hộ và chứng từ nguồn. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `returnLineId` | ObjectId | Có | LOGIC → customer_returns.items[]._id | — | 1/1 | ID liên kết nghiệp vụ return Line. Không có ref model cố định tại path này. |
| `inspectionNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính inspection No. |
| `returnVersion` | Number | Có | — | min=1 | 1/1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: return Version. |
| `warehouseId` | ObjectId | Có | REF → warehouses | — | 1/1 | Tham chiếu warehouses. |
| `inspectedBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `inspectedAt` | Date | Có | — | — | 1/1 | Thời điểm inspected. |
| `portions[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `portions[].quantityBase` | Decimal128 | Có | — | — | 1/1 | Số lượng theo đơn vị gốc của sản phẩm. |
| `portions[].packagingCondition` | String | Có | — | enum=["SEALED","OPENED","TORN","UNKNOWN"] | 1/1 | Thuộc tính packaging Condition. |
| `portions[].installationStatus` | String | Có | — | enum=["UNUSED","INSTALLED","UNKNOWN"] | 1/1 | Thuộc tính installation Status. |
| `portions[].damageCause` | String | Có | — | enum=["NONE","CUSTOMER","SUPPLIER","OTHER","UNKNOWN"] | 1/1 | Thuộc tính damage Cause. |
| `portions[].deadlineStatus` | String | Có | — | enum=["WITHIN","EXCEEDED","NOT_APPLICABLE","UNKNOWN"] | 1/1 | Thuộc tính deadline Status. |
| `portions[].deadlineReference` | String | Không | — | maxLength=1000 | 1/1 | Thuộc tính deadline Reference. |
| `portions[].eligibilityStatus` | String | Có | — | enum=["PENDING","CASE_REVIEW","INELIGIBLE"] | 1/1 | Thuộc tính eligibility Status. |
| `portions[].reason` | String | Có | — | maxLength=2000 | 1/1 | Lý do xử lý. |
| `portions[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `returnLineId_1_inspectionNo_1` | `{"returnLineId": 1, "inspectionNo": 1}` | Có | — |
<a id="customer_return_receipts"></a>
### `customer_return_receipts`

Nhập sở hữu lượng được chấp nhận trả; có thể chuyển chủ hàng từ giữ hộ mà không cộng vật lý lần nữa.

- Model: `CustomerReturnReceipt`; số bản ghi mẫu: **1**.
- Nhóm: Khách trả, giữ hộ và chứng từ nguồn. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["GR_CUSTOMER_RETURN"]; default="GR_CUSTOMER_RETURN" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 1/1 | Tham chiếu warehouses. |
| `header.receiptKind` | String | Có | — | enum=["CUSTOMER_RETURN"]; default="CUSTOMER_RETURN" | 1/1 | Thuộc tính receipt Kind. |
| `header.returnId` | ObjectId | Không | REF → customer_returns | — | 0/1 | Tham chiếu customer_returns. |
| `header.receivedAt` | Date | Không | — | — | 0/1 | Thời điểm received. |
| `header.operationId` | ObjectId | Không | REF → operation_records | — | 0/1 | Tham chiếu operation_records. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].custodyBalanceId` | ObjectId | Không | REF → inventory_balances | — | 0/1 | Tham chiếu inventory_balances. |
| `items[].inspectionId` | ObjectId | Không | REF → return_inspections | — | 0/1 | Tham chiếu return_inspections. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 1/1 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 1/1 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 1/1 | Thời điểm posted. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="return_quantity_claims"></a>
### `return_quantity_claims`

Giữ hạn mức theo nguồn giao/nhận để không đề nghị trả vượt lượng còn được trả.

- Model: `ReturnQuantityClaim`; số bản ghi mẫu: **2**.
- Nhóm: Khách trả, giữ hộ và chứng từ nguồn. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `claimKind` | String | Có | — | enum=["FD","CR"] | 2/2 | Thuộc tính claim Kind. |
| `requestLineId` | ObjectId | Có | LOGIC → customer_returns / failed_deliveries items (claimKind) | — | 2/2 | ID liên kết nghiệp vụ request Line. Không có ref model cố định tại path này. |
| `sourceKind` | String | Có | — | enum=["GOODS_ISSUE","DELIVERY_CONFIRMATION","EXTERNAL"] | 2/2 | Thuộc tính source Kind. |
| `sourceLineId` | ObjectId | Có | LOGIC → sourceKind → source item / external_reference_lines | — | 2/2 | ID dòng nhúng của chứng từ nguồn. |
| `claimedQtyBase` | Decimal128 | Có | — | — | 2/2 | Số lượng nghiệp vụ: claimed Qty Base; đơn vị gốc. |
| `createdBy` | ObjectId | Có | REF → users | — | 2/2 | Tham chiếu users. |
| `operationId` | ObjectId | Có | REF → operation_records | — | 2/2 | Tham chiếu operation_records. |
| `version` | Number | Có | — | default=1; min=1 | 2/2 | Phiên bản kiểm soát cập nhật đồng thời. |
| `events[]` | Embedded[] | Không | — | — | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `events[].kind` | String | Có | — | maxLength=40 | 2/2 | Thuộc tính kind. |
| `events[].quantityBase` | Decimal128 | Có | — | — | 2/2 | Số lượng theo đơn vị gốc của sản phẩm. |
| `events[].sourceRef` | Embedded | Không | — | — | 2/2 | Đối tượng nhúng. |
| `events[].sourceRef.documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 2/2 | Thuộc tính document Type. |
| `events[].sourceRef.documentId` | ObjectId | Có | — | — | 2/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `events[].sourceRef.itemId` | ObjectId | Không | — | — | 2/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `events[].sourceRef.revision` | Number | Không | — | min=1 | 2/2 | Phiên bản nội dung nghiệp vụ. |
| `events[].performedBy` | ObjectId | Có | REF → users | — | 2/2 | Tham chiếu users. |
| `events[].performedAt` | Date | Có | — | — | 2/2 | Thời điểm performed. |
| `events[].reason` | String | Không | — | maxLength=1000 | 2/2 | Lý do xử lý. |
| `_id` | ObjectId | Không | — | — | 2/2 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 2/2 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
<a id="custody_receipts"></a>
### `custody_receipts`

Nhận vật lý hàng thuộc khách/NCC; chiếm chỗ nhưng chưa thuộc cửa hàng.

- Model: `CustodyReceipt`; số bản ghi mẫu: **1**.
- Nhóm: Khách trả, giữ hộ và chứng từ nguồn. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["CUSTODY_RECEIPT"]; default="CUSTODY_RECEIPT" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 1/1 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 1/1 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 1/1 | Thời điểm posted. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Không | REF → warehouses | — | 0/1 | Tham chiếu warehouses. |
| `header.ownerType` | String | Không | — | enum=["CUSTOMER","SUPPLIER"] | 0/1 | Loại chủ sở hữu để diễn giải ownerId. |
| `header.ownerId` | ObjectId | Không | — | — | 0/1 | ID khách/NCC theo ownerType; STORE không có đối tác sở hữu. |
| `header.receivedAt` | Date | Không | — | — | 0/1 | Thời điểm received. |
| `header.receivedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.handedOverBy` | String | Không | — | maxLength=160 | 0/1 | Người thực hiện: handed over. |
| `header.releasedAt` | Date | Không | — | — | 0/1 | Thời điểm released. |
| `header.releasedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.recipientName` | String | Không | — | maxLength=160 | 0/1 | Thuộc tính recipient Name. |
| `header.operationId` | ObjectId | Không | REF → operation_records | — | 0/1 | Tham chiếu operation_records. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="custody_releases"></a>
### `custody_releases`

Bàn giao lại hàng giữ hộ chưa chuyển sang sở hữu cửa hàng.

- Model: `CustodyRelease`; số bản ghi mẫu: **1**.
- Nhóm: Khách trả, giữ hộ và chứng từ nguồn. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["CUSTODY_RELEASE"]; default="CUSTODY_RELEASE" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 1/1 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 1/1 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 1/1 | Thời điểm posted. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Không | REF → warehouses | — | 0/1 | Tham chiếu warehouses. |
| `header.ownerType` | String | Không | — | enum=["CUSTOMER","SUPPLIER"] | 0/1 | Loại chủ sở hữu để diễn giải ownerId. |
| `header.ownerId` | ObjectId | Không | — | — | 0/1 | ID khách/NCC theo ownerType; STORE không có đối tác sở hữu. |
| `header.receivedAt` | Date | Không | — | — | 0/1 | Thời điểm received. |
| `header.receivedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.handedOverBy` | String | Không | — | maxLength=160 | 0/1 | Người thực hiện: handed over. |
| `header.releasedAt` | Date | Không | — | — | 0/1 | Thời điểm released. |
| `header.releasedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.recipientName` | String | Không | — | maxLength=160 | 0/1 | Thuộc tính recipient Name. |
| `header.operationId` | ObjectId | Không | REF → operation_records | — | 0/1 | Tham chiếu operation_records. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="external_references"></a>
### `external_references`

Hồ sơ chứng từ nguồn bên ngoài. D07 còn chờ chốt người/quy trình xác minh; không tích hợp MISA.

- Model: `ExternalReference`; số bản ghi mẫu: **5**.
- Nhóm: Khách trả, giữ hộ và chứng từ nguồn. Khóa document: `_id: ObjectId`.
- D07 chưa duyệt quy trình xác minh. Bảng đang có trong DB mẫu, chưa coi là nghiệp vụ đã chốt.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `sourceSystem` | String | Có | — | maxLength=50 | 5/5 | Thuộc tính source System. |
| `referenceKind` | String | Có | — | maxLength=40 | 5/5 | Thuộc tính reference Kind. |
| `referenceNo` | String | Có | — | maxLength=100 | 5/5 | Thuộc tính reference No. |
| `referenceDate` | Date | Không | — | — | 5/5 | Thuộc tính reference Date. |
| `sourceVersion` | String | Không | — | maxLength=100 | 0/5 | Phiên bản nguồn/nội dung tại thời điểm xử lý: source Version. |
| `correlationId` | String | Có | — | maxLength=100 | 5/5 | ID liên kết nghiệp vụ correlation. Không có ref model cố định tại path này. |
| `verifiedBy` | ObjectId | Không | REF → users | — | 5/5 | Tham chiếu users. |
| `verifiedAt` | Date | Không | — | — | 5/5 | Thời điểm verified. |
| `_id` | ObjectId | Không | — | — | 5/5 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 5/5 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 5/5 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `correlationId_1` | `{"correlationId": 1}` | Có | — |
| `sourceSystem_1_referenceKind_1_referenceNo_1` | `{"sourceSystem": 1, "referenceKind": 1, "referenceNo": 1}` | Có | — |
<a id="external_reference_lines"></a>
### `external_reference_lines`

Dòng của hồ sơ nguồn bên ngoài; D08 còn chờ chốt nghiệp vụ xác minh.

- Model: `ExternalReferenceLine`; số bản ghi mẫu: **5**.
- Nhóm: Khách trả, giữ hộ và chứng từ nguồn. Khóa document: `_id: ObjectId`.
- D08 chưa chốt đầy đủ nghiệp vụ xác minh; giữ đúng cấu trúc đang có.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `referenceId` | ObjectId | Có | REF → external_references | — | 5/5 | Tham chiếu external_references. |
| `lineKey` | String | Có | — | maxLength=100 | 5/5 | Thuộc tính line Key. |
| `productId` | ObjectId | Có | REF → products | — | 5/5 | Tham chiếu products. |
| `eligibleQty` | Decimal128 | Có | — | — | 5/5 | Số lượng nghiệp vụ: eligible Qty; kiểm quy đổi/nguồn của dòng. |
| `_id` | ObjectId | Không | — | — | 5/5 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 5/5 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 5/5 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `referenceId_1_lineKey_1` | `{"referenceId": 1, "lineKey": 1}` | Có | — |

## I — Hàng lỗi, hủy và chênh lệch

<a id="defect_reports"></a>
### `defect_reports`

Hồ sơ phần hàng nghi lỗi, nguồn phát hiện, dấu hiệu, bằng chứng và các lần kiểm.

- Model: `DefectReport`; số bản ghi mẫu: **2**.
- Nhóm: Hàng lỗi, hủy và chênh lệch. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 2/2 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["DEFECT_CASE"]; default="DEFECT_CASE" | 2/2 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 2/2 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 2/2 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 2/2 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 2/2 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 2/2 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 2/2 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 0/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/2 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 0/2 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/2 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/2 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 0/2 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 2/2 | Đối tượng nhúng. |
| `header.discoveredAt` | Date | Có | — | — | 2/2 | Thời điểm discovered. |
| `header.reason` | String | Có | — | maxLength=1000 | 2/2 | Lý do xử lý. |
| `header.warehouseId` | ObjectId | Không | REF → warehouses | — | 0/2 | Tham chiếu warehouses. |
| `header.reportedBy` | ObjectId | Không | REF → users | — | 2/2 | Tham chiếu users. |
| `header.recordedAt` | Date | Không | — | — | 2/2 | Thời điểm recorded. |
| `header.sourceRef` | Embedded | Không | — | — | 0/2 | Đối tượng nhúng. |
| `header.sourceRef.documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 0/2 | Thuộc tính document Type. |
| `header.sourceRef.documentId` | ObjectId | Có | — | — | 0/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `header.sourceRef.itemId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `header.sourceRef.revision` | Number | Không | — | min=1 | 0/2 | Phiên bản nội dung nghiệp vụ. |
| `_id` | ObjectId | Không | — | — | 2/2 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 2/2 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 2/2 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 2/2 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 2/2 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 2/2 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 2/2 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 2/2 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 2/2 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 2/2 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 2/2 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 2/2 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 2/2 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 2/2 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 2/2 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 2/2 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 2/2 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 2/2 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 2/2 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 0/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/2 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 0/2 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/2 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 0/2 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 0/2 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 2/2 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 2/2 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 2/2 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/2 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 2/2 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].sourceRef` | Embedded | Không | — | — | 0/2 | Đối tượng nhúng. |
| `items[].sourceRef.documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 0/2 | Thuộc tính document Type. |
| `items[].sourceRef.documentId` | ObjectId | Có | — | — | 0/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sourceRef.itemId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sourceRef.revision` | Number | Không | — | min=1 | 0/2 | Phiên bản nội dung nghiệp vụ. |
| `items[].balanceId` | ObjectId | Không | REF → inventory_balances | — | 0/2 | Tham chiếu inventory_balances. |
| `items[].ownerType` | String | Không | — | maxLength=30 | 0/2 | Loại chủ sở hữu để diễn giải ownerId. |
| `items[].ownerId` | ObjectId | Không | — | — | 0/2 | ID khách/NCC theo ownerType; STORE không có đối tác sở hữu. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/2 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 2/2 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/2 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/2 | Thuộc tính cancel Reason. |
| `inspections[]` | Embedded[] | Không | — | — | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `inspections[].itemId` | ObjectId | Có | — | — | 0/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `inspections[].performedBy` | ObjectId | Có | REF → users | — | 0/2 | Tham chiếu users. |
| `inspections[].performedAt` | Date | Có | — | — | 0/2 | Thời điểm performed. |
| `inspections[].quantityBase` | Decimal128 | Có | — | — | 0/2 | Số lượng theo đơn vị gốc của sản phẩm. |
| `inspections[].transactionId` | ObjectId | Không | REF → stock_transactions | — | 0/2 | Tham chiếu stock_transactions. |
| `inspections[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 0/2 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `inspections[].note` | String | Không | — | maxLength=2000 | 0/2 | Ghi chú nghiệp vụ. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="defect_resolution_plans"></a>
### `defect_resolution_plans`

Phương án xử lý lỗi theo lượng: trả NCC, hủy, kiểm lại hoặc hướng xử lý đủ căn cứ.

- Model: `DefectResolutionPlan`; số bản ghi mẫu: **2**.
- Nhóm: Hàng lỗi, hủy và chênh lệch. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 2/2 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["DISPOSITION"]; default="DISPOSITION" | 2/2 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 2/2 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 2/2 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 2/2 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 2/2 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 2/2 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 2/2 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 2/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 2/2 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 2/2 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/2 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/2 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 2/2 | ID ổn định của phần tử nhúng. |
| `_id` | ObjectId | Không | — | — | 2/2 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 2/2 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 2/2 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 2/2 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 2/2 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 2/2 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 2/2 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 2/2 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 2/2 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 2/2 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 2/2 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 2/2 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 2/2 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 2/2 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 2/2 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 2/2 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 2/2 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 2/2 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 2/2 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 2/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 2/2 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 2/2 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/2 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 2/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 2/2 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 2/2 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 2/2 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 2/2 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 2/2 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/2 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 2/2 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].approvedQtyBase` | Decimal128 | Không | — | — | 0/2 | Số lượng nghiệp vụ: approved Qty Base; đơn vị gốc. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/2 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 2/2 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/2 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/2 | Thuộc tính cancel Reason. |
| `header` | Embedded | Có | — | — | 2/2 | Đối tượng nhúng. |
| `header.defectReportId` | ObjectId | Không | REF → defect_reports | — | 0/2 | Tham chiếu defect_reports. |
| `header.proposedBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `header.submittedAt` | Date | Không | — | — | 0/2 | Thời điểm submitted. |
| `header.previousPlanId` | ObjectId | Không | REF → defect_resolution_plans | — | 0/2 | Tham chiếu defect_resolution_plans. |
| `reviewDecisions[]` | Embedded[] | Không | — | — | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `reviewDecisions[].decisionId` | ObjectId | Có | REF → approval_history | — | 0/2 | Tham chiếu approval_history. |
| `reviewDecisions[].revision` | Number | Có | — | min=1 | 0/2 | Phiên bản nội dung nghiệp vụ. |
| `reviewDecisions[].reviewedBy` | ObjectId | Có | REF → users | — | 0/2 | Tham chiếu users. |
| `reviewDecisions[].reviewedAt` | Date | Có | — | — | 0/2 | Thời điểm reviewed. |
| `reviewDecisions[].decision` | String | Có | — | enum=["APPROVE","REJECT","REVISE"] | 0/2 | Thuộc tính decision. |
| `reviewDecisions[].reason` | String | Có | — | maxLength=2000 | 0/2 | Lý do xử lý. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="stock_scrap_records"></a>
### `stock_scrap_records`

Phiếu thực hủy theo phương án duyệt; chỉ trừ đúng lượng thực hủy.

- Model: `StockScrapRecord`; số bản ghi mẫu: **1**.
- Nhóm: Hàng lỗi, hủy và chênh lệch. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["SCRAP"]; default="SCRAP" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 1/1 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 1/1 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 1/1 | Thời điểm posted. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Không | REF → warehouses | — | 0/1 | Tham chiếu warehouses. |
| `header.planId` | ObjectId | Không | REF → defect_resolution_plans | — | 0/1 | Tham chiếu defect_resolution_plans. |
| `header.approvedRevision` | Number | Không | — | min=1 | 0/1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: approved Revision. |
| `header.destroyedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.destroyedAt` | Date | Không | — | — | 0/1 | Thời điểm destroyed. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="stock_holds"></a>
### `stock_holds`

Chặn đúng phần hàng nghi lỗi và lưu lịch sử phân bổ/mở chặn.

- Model: `StockHold`; số bản ghi mẫu: **1**.
- Nhóm: Hàng lỗi, hủy và chênh lệch. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `defectReportLineId` | ObjectId | Có | LOGIC → defect_reports.items[]._id | — | 1/1 | ID liên kết nghiệp vụ defect Report Line. Không có ref model cố định tại path này. |
| `stocktakeId` | ObjectId | Không | REF → stocktakes | — | 1/1 | Tham chiếu stocktakes. |
| `recordedBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `recordedAt` | Date | Có | — | — | 1/1 | Thời điểm recorded. |
| `reason` | String | Có | — | maxLength=2000 | 1/1 | Lý do xử lý. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `allocations[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `allocations[].balanceId` | ObjectId | Có | REF → inventory_balances | — | 1/1 | Tham chiếu inventory_balances. |
| `allocations[].quantityBase` | Decimal128 | Có | — | — | 1/1 | Số lượng theo đơn vị gốc của sản phẩm. |
| `events[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `events[].kind` | String | Có | — | maxLength=40 | 0/1 | Thuộc tính kind. |
| `events[].quantityBase` | Decimal128 | Có | — | — | 0/1 | Số lượng theo đơn vị gốc của sản phẩm. |
| `events[].sourceRef` | Embedded | Không | — | — | 0/1 | Đối tượng nhúng. |
| `events[].sourceRef.documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 0/1 | Thuộc tính document Type. |
| `events[].sourceRef.documentId` | ObjectId | Có | — | — | 0/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `events[].sourceRef.itemId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `events[].sourceRef.revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `events[].performedBy` | ObjectId | Có | REF → users | — | 0/1 | Tham chiếu users. |
| `events[].performedAt` | Date | Có | — | — | 0/1 | Thời điểm performed. |
| `events[].reason` | String | Không | — | maxLength=1000 | 0/1 | Lý do xử lý. |
| `status` | String | Có | — | enum=["ACTIVE","RESOLVED"] | 1/1 | Trạng thái, xem tập enum. |
| `version` | Number | Có | — | default=1; min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `allocations.balanceId_1_status_1` | `{"allocations.balanceId": 1, "status": 1}` | Không | — |
<a id="stock_quality_changes"></a>
### `stock_quality_changes`

Phiếu chuyển lượng giữa trạng thái chất lượng; tổng lượng và vị trí không tự thay đổi.

- Model: `StockQualityChange`; số bản ghi mẫu: **1**.
- Nhóm: Hàng lỗi, hủy và chênh lệch. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["RECLASS"]; default="RECLASS" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].fromBalanceId` | ObjectId | Không | REF → inventory_balances | — | 0/1 | Tham chiếu inventory_balances. |
| `items[].toBalanceId` | ObjectId | Không | REF → inventory_balances | — | 0/1 | Tham chiếu inventory_balances. |
| `items[].previousQuality` | String | Không | — | enum=["PENDING","GOOD","DAMAGED","BLOCKED"] | 0/1 | Thuộc tính previous Quality. |
| `items[].targetQuality` | String | Không | — | enum=["PENDING","GOOD","DAMAGED","BLOCKED"] | 0/1 | Thuộc tính target Quality. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 1/1 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 1/1 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 1/1 | Thời điểm posted. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Không | REF → warehouses | — | 0/1 | Tham chiếu warehouses. |
| `header.operationId` | ObjectId | Không | REF → operation_records | — | 0/1 | Tham chiếu operation_records. |
| `header.planId` | ObjectId | Không | REF → defect_resolution_plans | — | 0/1 | Tham chiếu defect_resolution_plans. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="stock_discrepancies"></a>
### `stock_discrepancies`

Hồ sơ thiếu/thừa/sai/hỏng và chứng từ giải quyết; không tự xóa lượng chưa rõ.

- Model: `StockDiscrepancy`; số bản ghi mẫu: **1**.
- Nhóm: Hàng lỗi, hủy và chênh lệch. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["DISCREPANCY"]; default="DISCREPANCY" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.sourceRef` | Embedded | Không | — | — | 0/1 | Đối tượng nhúng. |
| `header.sourceRef.documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 0/1 | Thuộc tính document Type. |
| `header.sourceRef.documentId` | ObjectId | Có | — | — | 0/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `header.sourceRef.itemId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `header.sourceRef.revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `header.warehouseId` | ObjectId | Không | REF → warehouses | — | 0/1 | Tham chiếu warehouses. |
| `header.reportedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.reportedAt` | Date | Không | — | — | 0/1 | Thời điểm reported. |
| `resolutionEvents[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `resolutionEvents[].itemId` | ObjectId | Có | — | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `resolutionEvents[].performedBy` | ObjectId | Có | REF → users | — | 0/1 | Tham chiếu users. |
| `resolutionEvents[].performedAt` | Date | Có | — | — | 0/1 | Thời điểm performed. |
| `resolutionEvents[].quantityBase` | Decimal128 | Có | — | — | 0/1 | Số lượng theo đơn vị gốc của sản phẩm. |
| `resolutionEvents[].transactionId` | ObjectId | Không | REF → stock_transactions | — | 0/1 | Tham chiếu stock_transactions. |
| `resolutionEvents[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 0/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `resolutionEvents[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |

## J — Trả nhà cung cấp và đối chiếu

<a id="supplier_returns"></a>
### `supplier_returns`

Đề nghị trả NCC và thỏa thuận được Accountant xác minh theo dòng.

- Model: `SupplierReturn`; số bản ghi mẫu: **1**.
- Nhóm: Trả nhà cung cấp và đối chiếu. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["SUPPLIER_RETURN"]; default="SUPPLIER_RETURN" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 1/1 | Tham chiếu warehouses. |
| `header.supplierId` | ObjectId | Có | REF → suppliers | — | 1/1 | Tham chiếu suppliers. |
| `header.agreementReference` | String | Không | — | maxLength=300 | 1/1 | Thuộc tính agreement Reference. |
| `header.agreedAt` | Date | Không | — | — | 1/1 | Thời điểm agreed. |
| `header.financialFollowupStatus` | String | Có | — | default="NOT_RECORDED"; maxLength=20 | 1/1 | Thuộc tính financial Followup Status. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `agreements[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `agreements[].itemId` | ObjectId | Có | — | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `agreements[].agreedQtyBase` | Decimal128 | Có | — | — | 0/1 | Số lượng nghiệp vụ: agreed Qty Base; đơn vị gốc. |
| `agreements[].verifiedBy` | ObjectId | Có | REF → users | — | 0/1 | Tham chiếu users. |
| `agreements[].verifiedAt` | Date | Có | — | — | 0/1 | Thời điểm verified. |
| `agreements[].version` | Number | Có | — | min=1 | 0/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `agreements[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 0/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `closure` | Embedded | Không | — | — | 0/1 | Đối tượng nhúng. |
| `closure.closedBy` | ObjectId | Có | REF → users | — | 0/1 | Tham chiếu users. |
| `closure.closedAt` | Date | Có | — | — | 0/1 | Thời điểm closed. |
| `closure.reason` | String | Có | — | maxLength=2000 | 0/1 | Lý do xử lý. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="supplier_return_issues"></a>
### `supplier_return_issues`

Phiếu thực xuất trả phần thuộc cửa hàng theo lượng đã thống nhất với NCC.

- Model: `SupplierReturnIssue`; số bản ghi mẫu: **1**.
- Nhóm: Trả nhà cung cấp và đối chiếu. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["GI_SUPPLIER_RETURN"]; default="GI_SUPPLIER_RETURN" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 1/1 | Tham chiếu warehouses. |
| `header.issueKind` | String | Có | — | enum=["SUPPLIER_RETURN"]; default="SUPPLIER_RETURN" | 1/1 | Thuộc tính issue Kind. |
| `header.supplierReturnId` | ObjectId | Không | REF → supplier_returns | — | 0/1 | Tham chiếu supplier_returns. |
| `header.issuedAt` | Date | Không | — | — | 0/1 | Thời điểm issued. |
| `header.issuedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.receivedByName` | String | Không | — | maxLength=160 | 0/1 | Thuộc tính received By Name. |
| `header.operationId` | ObjectId | Không | REF → operation_records | — | 0/1 | Tham chiếu operation_records. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 1/1 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 1/1 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 1/1 | Thời điểm posted. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="supplier_acknowledgements"></a>
### `supplier_acknowledgements`

Kết quả NCC thực nhận hàng trả và đối chiếu từng dòng xuất.

- Model: `SupplierAcknowledgement`; số bản ghi mẫu: **1**.
- Nhóm: Trả nhà cung cấp và đối chiếu. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["SUPPLIER_ACK"]; default="SUPPLIER_ACK" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.supplierReturnId` | ObjectId | Không | REF → supplier_returns | — | 0/1 | Tham chiếu supplier_returns. |
| `header.supplierId` | ObjectId | Không | REF → suppliers | — | 0/1 | Tham chiếu suppliers. |
| `header.acknowledgedAt` | Date | Không | — | — | 0/1 | Thời điểm acknowledged. |
| `header.supplierContact` | String | Không | — | maxLength=160 | 0/1 | Thuộc tính supplier Contact. |
| `header.recordedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.recordedAt` | Date | Không | — | — | 0/1 | Thời điểm recorded. |
| `reconciliations[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `reconciliations[].itemId` | ObjectId | Có | — | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `reconciliations[].performedBy` | ObjectId | Có | REF → users | — | 0/1 | Tham chiếu users. |
| `reconciliations[].performedAt` | Date | Có | — | — | 0/1 | Thời điểm performed. |
| `reconciliations[].quantityBase` | Decimal128 | Có | — | — | 0/1 | Số lượng theo đơn vị gốc của sản phẩm. |
| `reconciliations[].transactionId` | ObjectId | Không | REF → stock_transactions | — | 0/1 | Tham chiếu stock_transactions. |
| `reconciliations[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 0/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `reconciliations[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |

## K — Kiểm kê, khóa ô và điều chỉnh

<a id="stocktakes"></a>
### `stocktakes`

Đợt kiểm kê theo kho/phạm vi, lịch, người đếm, mốc kích hoạt và chốt.

- Model: `Stocktake`; số bản ghi mẫu: **2**.
- Nhóm: Kiểm kê, khóa ô và điều chỉnh. Khóa document: `_id: ObjectId`.
- header.scopeLocationIds[] hiện ref="Location" nhưng registry chỉ có WarehouseLocation. Đây là lệch tên ref trong model, chưa sửa trong tác vụ vẽ.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 2/2 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["STOCKTAKE"]; default="STOCKTAKE" | 2/2 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 2/2 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 2/2 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 2/2 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 2/2 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 2/2 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 2/2 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 0/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/2 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 0/2 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/2 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/2 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 0/2 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 2/2 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Có | REF → warehouses | — | 2/2 | Tham chiếu warehouses. |
| `header.cutoffAt` | Date | Không | — | — | 2/2 | Thời điểm cutoff. |
| `header.completedAt` | Date | Không | — | — | 1/2 | Thời điểm completed. |
| `header.mode` | String | Có | — | enum=["FROZEN"]; default="FROZEN" | 2/2 | Thuộc tính mode. |
| `header.scopeLocationIds[]` | ObjectId[] | Không | REF → Location | default=[] | 2/2 | Tham chiếu Location. Mảng ID lưu ngay trong document. |
| `header.reason` | String | Không | — | maxLength=2000 | 2/2 | Lý do xử lý. |
| `header.plannedAt` | Date | Không | — | — | 2/2 | Thời điểm planned. |
| `header.scopeVersion` | Number | Không | — | min=1 | 2/2 | Phiên bản nguồn/nội dung tại thời điểm xử lý: scope Version. |
| `header.scope` | Embedded | Không | — | — | 2/2 | Đối tượng nhúng. |
| `header.scope.locationIds[]` | ObjectId[] | Không | REF → warehouse_locations | default=[] | 2/2 | Tham chiếu warehouse_locations. Mảng ID lưu ngay trong document. |
| `header.scope.batchIds[]` | ObjectId[] | Không | REF → product_batches | default=[] | 2/2 | Tham chiếu product_batches. Mảng ID lưu ngay trong document. |
| `header.scope.productIds[]` | ObjectId[] | Không | REF → products | default=[] | 2/2 | Tham chiếu products. Mảng ID lưu ngay trong document. |
| `header.scope.areaCodes[]` | String[] | Không | — | — | 2/2 | Thuộc tính area Codes. |
| `header.assignedCounterIds[]` | ObjectId[] | Không | REF → users | default=[] | 2/2 | Tham chiếu users. Mảng ID lưu ngay trong document. |
| `header.activatedBy` | ObjectId | Không | REF → users | — | 2/2 | Tham chiếu users. |
| `header.activatedAt` | Date | Không | — | — | 2/2 | Thời điểm activated. |
| `header.closedBy` | ObjectId | Không | REF → users | — | 1/2 | Tham chiếu users. |
| `header.closureReferenceId` | ObjectId | Không | — | — | 1/2 | ID liên kết nghiệp vụ closure Reference. Không có ref model cố định tại path này. |
| `_id` | ObjectId | Không | — | — | 2/2 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 2/2 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 2/2 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 2/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 0/2 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 0/2 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 0/2 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 0/2 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 0/2 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 0/2 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 0/2 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 0/2 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 0/2 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 0/2 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 0/2 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 0/2 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 0/2 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 0/2 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 0/2 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 0/2 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 0/2 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/2 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/2 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 0/2 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/2 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/2 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/2 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 0/2 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 0/2 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 0/2 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 0/2 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/2 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 0/2 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/2 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 2/2 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/2 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/2 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/2 | Thuộc tính cancel Reason. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="stocktake_snapshots"></a>
### `stocktake_snapshots`

Số tồn làm mốc theo ô/lô/chủ/chất lượng tại lúc khóa phạm vi.

- Model: `StocktakeSnapshot`; số bản ghi mẫu: **3**.
- Nhóm: Kiểm kê, khóa ô và điều chỉnh. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `stocktakeId` | ObjectId | Có | REF → stocktakes | — | 3/3 | Tham chiếu stocktakes. |
| `scopeVersion` | Number | Có | — | min=1 | 3/3 | Phiên bản nguồn/nội dung tại thời điểm xử lý: scope Version. |
| `cutoffAt` | Date | Có | — | — | 3/3 | Thời điểm cutoff. |
| `capturedAt` | Date | Có | — | — | 3/3 | Thời điểm captured. |
| `sourceBalanceId` | ObjectId | Không | REF → inventory_balances | — | 3/3 | Tham chiếu inventory_balances. |
| `locationId` | ObjectId | Có | REF → warehouse_locations | — | 3/3 | Tham chiếu warehouse_locations. |
| `batchId` | ObjectId | Có | REF → product_batches | — | 3/3 | Tham chiếu product_batches. |
| `ownerType` | String | Có | — | enum=["STORE","SUPPLIER","CUSTOMER"] | 3/3 | Loại chủ sở hữu để diễn giải ownerId. |
| `ownerId` | ObjectId | Không | — | — | 3/3 | ID khách/NCC theo ownerType; STORE không có đối tác sở hữu. |
| `qualityStatus` | String | Có | — | enum=["PENDING","GOOD","DAMAGED","BLOCKED"] | 3/3 | Trạng thái chất lượng của nhóm tồn. |
| `bookQtyBase` | Decimal128 | Có | — | — | 3/3 | Số tồn sổ làm mốc, theo đơn vị gốc. |
| `baseUnitSnapshot` | String | Có | — | maxLength=60 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `sourceBalanceVersion` | Number | Không | — | min=0 | 3/3 | Phiên bản nguồn/nội dung tại thời điểm xử lý: source Balance Version. |
| `origin` | String | Có | — | enum=["BOOK","DISCOVERED"] | 3/3 | Thuộc tính origin. |
| `discoveredAt` | Date | Không | — | — | 0/3 | Thời điểm discovered. |
| `discoveredBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 3/3 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `_id` | ObjectId | Không | — | — | 3/3 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 3/3 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `stocktakeId_1_locationId_1_batchId_1_qualityStatus_1_ownerType_1_ownerId_1` | `{"stocktakeId": 1, "locationId": 1, "batchId": 1, "qualityStatus": 1, "ownerType": 1, "ownerId": 1}` | Có | — |
<a id="stocktake_counts"></a>
### `stocktake_counts`

Các lần đếm/đếm lại, đơn vị/quy đổi và bằng chứng; chưa đếm khác với đã xác nhận 0.

- Model: `StocktakeCount`; số bản ghi mẫu: **4**.
- Nhóm: Kiểm kê, khóa ô và điều chỉnh. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `stocktakeId` | ObjectId | Có | REF → stocktakes | — | 4/4 | Tham chiếu stocktakes. |
| `scopeVersion` | Number | Có | — | min=1 | 4/4 | Phiên bản nguồn/nội dung tại thời điểm xử lý: scope Version. |
| `locationId` | ObjectId | Có | REF → warehouse_locations | — | 4/4 | Tham chiếu warehouse_locations. |
| `targetType` | String | Có | — | enum=["STOCK","EMPTY_LOCATION"] | 4/4 | Thuộc tính target Type. |
| `snapshotId` | ObjectId | Không | REF → stocktake_snapshots | — | 4/4 | Tham chiếu stocktake_snapshots. |
| `attemptNo` | Number | Có | — | min=1 | 4/4 | Thuộc tính attempt No. |
| `previousCountId` | ObjectId | Không | REF → stocktake_counts | — | 1/4 | Tham chiếu stocktake_counts. |
| `recountReason` | String | Không | — | maxLength=1000 | 1/4 | Thuộc tính recount Reason. |
| `quantityEntries[]` | Embedded[] | Không | — | — | 4/4 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `quantityEntries[].enteredUnit` | String | Có | — | maxLength=60 | 4/4 | Đơn vị được nhập trên dòng. |
| `quantityEntries[].enteredQty` | Decimal128 | Có | — | — | 4/4 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `quantityEntries[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 4/4 | Thuộc tính base Units Per Unit. |
| `quantityEntries[].quantityBase` | Decimal128 | Có | — | — | 4/4 | Số lượng theo đơn vị gốc của sản phẩm. |
| `countedQtyBase` | Decimal128 | Có | — | — | 4/4 | Số thực đếm theo đơn vị gốc. |
| `baseUnitSnapshot` | String | Không | — | maxLength=60 | 4/4 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `conditionNote` | String | Không | — | maxLength=2000 | 0/4 | Thuộc tính condition Note. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 4/4 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `countedBy` | ObjectId | Có | REF → users | — | 4/4 | Tham chiếu users. |
| `countedAt` | Date | Có | — | — | 4/4 | Thời điểm counted. |
| `recordedAt` | Date | Có | — | — | 4/4 | Thời điểm recorded. |
| `_id` | ObjectId | Không | — | — | 4/4 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 4/4 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/4 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `stocktakeId_1_locationId_1_snapshotId_1_attemptNo_1` | `{"stocktakeId": 1, "locationId": 1, "snapshotId": 1, "attemptNo": 1}` | Có | — |
<a id="stocktake_location_locks"></a>
### `stocktake_location_locks`

Lịch sử khóa ô khi kiểm kê; mỗi ô chỉ có một khóa đang hiệu lực.

- Model: `StocktakeLocationLock`; số bản ghi mẫu: **2**.
- Nhóm: Kiểm kê, khóa ô và điều chỉnh. Khóa document: `_id: ObjectId`.
- Unique locationId chỉ khi status=LOCKED; một ô có nhiều bản ghi khóa đã RELEASED.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `stocktakeId` | ObjectId | Có | REF → stocktakes | — | 2/2 | Tham chiếu stocktakes. |
| `locationId` | ObjectId | Có | REF → warehouse_locations | — | 2/2 | Tham chiếu warehouse_locations. |
| `scopeVersion` | Number | Có | — | min=1 | 2/2 | Phiên bản nguồn/nội dung tại thời điểm xử lý: scope Version. |
| `lockedAt` | Date | Có | — | — | 2/2 | Thời điểm locked. |
| `lockedBy` | ObjectId | Có | REF → users | — | 2/2 | Tham chiếu users. |
| `status` | String | Có | — | enum=["LOCKED","RELEASED"] | 2/2 | Trạng thái, xem tập enum. |
| `version` | Number | Có | — | default=1; min=1 | 2/2 | Phiên bản kiểm soát cập nhật đồng thời. |
| `releasedAt` | Date | Không | — | — | 1/2 | Thời điểm released. |
| `releasedBy` | ObjectId | Không | REF → users | — | 1/2 | Tham chiếu users. |
| `closureReferenceId` | ObjectId | Không | — | — | 1/2 | ID liên kết nghiệp vụ closure Reference. Không có ref model cố định tại path này. |
| `_id` | ObjectId | Không | — | — | 2/2 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/2 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `locationId_1` | `{"locationId": 1}` | Có | {"partialFilterExpression": {"status": "LOCKED"}} |
<a id="stocktake_resolution_plans"></a>
### `stocktake_resolution_plans`

Phương án đối chiếu đếm với sổ, duyệt xử lý và ghi kết quả trước khi chốt.

- Model: `StocktakeResolutionPlan`; số bản ghi mẫu: **1**.
- Nhóm: Kiểm kê, khóa ô và điều chỉnh. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["ST_RESOLUTION"]; default="ST_RESOLUTION" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.stocktakeId` | ObjectId | Có | LOGIC → stocktakes | — | 1/1 | Liên kết logic: document. |
| `header.planVersion` | Number | Có | — | min=1 | 1/1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: plan Version. |
| `header.approvalId` | ObjectId | Không | REF → approval_history | — | 0/1 | Tham chiếu approval_history. |
| `header.closureBatchId` | ObjectId | Không | REF → stock_transactions | — | 0/1 | Tham chiếu stock_transactions. |
| `header.scopeVersion` | Number | Không | — | min=1 | 0/1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: scope Version. |
| `header.previousPlanId` | ObjectId | Không | REF → stocktake_resolution_plans | — | 0/1 | Tham chiếu stocktake_resolution_plans. |
| `header.reason` | String | Không | — | maxLength=2000 | 0/1 | Lý do xử lý. |
| `header.proposedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.proposedAt` | Date | Không | — | — | 0/1 | Thời điểm proposed. |
| `header.closedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.closedAt` | Date | Không | — | — | 0/1 | Thời điểm closed. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 0/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 0/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 0/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `selectedCounts[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `selectedCounts[].snapshotId` | ObjectId | Có | REF → stocktake_snapshots | — | 1/1 | Tham chiếu stocktake_snapshots. |
| `selectedCounts[].countId` | ObjectId | Có | REF → stocktake_counts | — | 1/1 | Tham chiếu stocktake_counts. |
| `reviewDecisions[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `reviewDecisions[].decisionId` | ObjectId | Có | REF → approval_history | — | 0/1 | Tham chiếu approval_history. |
| `reviewDecisions[].revision` | Number | Có | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `reviewDecisions[].reviewedBy` | ObjectId | Có | REF → users | — | 0/1 | Tham chiếu users. |
| `reviewDecisions[].reviewedAt` | Date | Có | — | — | 0/1 | Thời điểm reviewed. |
| `reviewDecisions[].decision` | String | Có | — | enum=["APPROVE","REJECT","REVISE"] | 0/1 | Thuộc tính decision. |
| `reviewDecisions[].reason` | String | Có | — | maxLength=2000 | 0/1 | Lý do xử lý. |
| `executionRecords[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `executionRecords[].itemId` | ObjectId | Có | — | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `executionRecords[].performedBy` | ObjectId | Có | REF → users | — | 0/1 | Tham chiếu users. |
| `executionRecords[].performedAt` | Date | Có | — | — | 0/1 | Thời điểm performed. |
| `executionRecords[].quantityBase` | Decimal128 | Có | — | — | 0/1 | Số lượng theo đơn vị gốc của sản phẩm. |
| `executionRecords[].transactionId` | ObjectId | Không | REF → stock_transactions | — | 0/1 | Tham chiếu stock_transactions. |
| `executionRecords[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 0/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `executionRecords[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="stock_adjustments"></a>
### `stock_adjustments`

Phiếu điều chỉnh số lượng theo phần thiếu/thừa được duyệt khi chốt kiểm kê.

- Model: `StockAdjustment`; số bản ghi mẫu: **1**.
- Nhóm: Kiểm kê, khóa ô và điều chỉnh. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["ADJUSTMENT"]; default="ADJUSTMENT" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].planItemId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ plan Item. Không có ref model cố định tại path này. |
| `items[].snapshotIds[]` | ObjectId[] | Không | REF → stocktake_snapshots | default=[] | 1/1 | Tham chiếu stocktake_snapshots. Mảng ID lưu ngay trong document. |
| `items[].countIds[]` | ObjectId[] | Không | REF → stocktake_counts | default=[] | 1/1 | Tham chiếu stocktake_counts. Mảng ID lưu ngay trong document. |
| `items[].stockBalanceId` | ObjectId | Không | REF → inventory_balances | — | 0/1 | Tham chiếu inventory_balances. |
| `items[].quantityDeltaBase` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: quantity Delta Base; đơn vị gốc. |
| `items[].beforeQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: before Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].afterQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: after Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].reason` | String | Không | — | maxLength=1000 | 0/1 | Lý do xử lý. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 0/1 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 0/1 | Thời điểm posted. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.stocktakeId` | ObjectId | Không | REF → stocktakes | — | 0/1 | Tham chiếu stocktakes. |
| `header.resolutionPlanId` | ObjectId | Không | REF → stocktake_resolution_plans | — | 0/1 | Tham chiếu stocktake_resolution_plans. |
| `header.warehouseId` | ObjectId | Không | REF → warehouses | — | 0/1 | Tham chiếu warehouses. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |

## L — Tồn đầu kỳ và sửa giao dịch tồn

<a id="opening_stocks"></a>
### `opening_stocks`

Phiếu số dư ban đầu đã đối chiếu/xác minh theo ô, lô, chất lượng và chủ hàng.

- Model: `OpeningStock`; số bản ghi mẫu: **3**.
- Nhóm: Tồn đầu kỳ và sửa giao dịch tồn. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 3/3 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["OPENING"]; default="OPENING" | 3/3 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 3/3 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 3/3 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 3/3 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 3/3 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 3/3 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 3/3 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 0/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/3 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 0/3 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 0/3 | ID ổn định của phần tử nhúng. |
| `_id` | ObjectId | Không | — | — | 3/3 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 3/3 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 3/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 3/3 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 3/3 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 3/3 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 3/3 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 3/3 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 3/3 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 3/3 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 3/3 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 3/3 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 3/3 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 3/3 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 3/3 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 3/3 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 0/3 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 0/3 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 0/3 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 0/3 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/3 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/3 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/3 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/3 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 0/3 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 0/3 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 3/3 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 3/3 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 3/3 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/3 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 3/3 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `items[].locationId` | ObjectId | Không | REF → warehouse_locations | — | 0/3 | Tham chiếu warehouse_locations. |
| `items[].ownerType` | String | Không | — | maxLength=30 | 0/3 | Loại chủ sở hữu để diễn giải ownerId. |
| `items[].ownerId` | ObjectId | Không | — | — | 0/3 | ID khách/NCC theo ownerType; STORE không có đối tác sở hữu. |
| `items[].qualityStatus` | String | Không | — | maxLength=30 | 0/3 | Trạng thái chất lượng của nhóm tồn. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/3 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 3/3 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/3 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/3 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/3 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 3/3 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 3/3 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 3/3 | Thời điểm posted. |
| `header` | Embedded | Có | — | — | 3/3 | Đối tượng nhúng. |
| `header.warehouseId` | ObjectId | Không | REF → warehouses | — | 3/3 | Tham chiếu warehouses. |
| `header.cutoverKey` | String | Không | — | maxLength=160 | 3/3 | Thuộc tính cutover Key. |
| `header.openingAt` | Date | Không | — | — | 3/3 | Thời điểm opening. |
| `header.coveredLocationIds[]` | ObjectId[] | Không | REF → warehouse_locations | default=[] | 3/3 | Tham chiếu warehouse_locations. Mảng ID lưu ngay trong document. |
| `header.sourceDescription` | String | Không | — | maxLength=2000 | 3/3 | Thuộc tính source Description. |
| `header.preparedBy` | ObjectId | Không | REF → users | — | 3/3 | Tham chiếu users. |
| `header.preparedAt` | Date | Không | — | — | 3/3 | Thời điểm prepared. |
| `header.verifiedBy` | ObjectId | Không | REF → users | — | 3/3 | Tham chiếu users. |
| `header.verifiedAt` | Date | Không | — | — | 3/3 | Thời điểm verified. |
| `header.verifiedVersion` | Number | Không | — | min=1 | 3/3 | Phiên bản nguồn/nội dung tại thời điểm xử lý: verified Version. |
| `header.verificationNote` | String | Không | — | maxLength=2000 | 0/3 | Thuộc tính verification Note. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |
<a id="stock_reversals"></a>
### `stock_reversals`

Phiếu đề nghị/duyệt đảo toàn bộ lần ghi tồn sai đủ điều kiện, giữ liên kết giao dịch gốc.

- Model: `StockReversal`; số bản ghi mẫu: **1**.
- Nhóm: Tồn đầu kỳ và sửa giao dịch tồn. Khóa document: `_id: ObjectId`.
- Có 19 loại dòng dùng chung; các trường thêm của `details` ở phụ lục. `handovers[].items[]` dùng cùng schema khi có bàn giao.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `documentNo` | String | Có | — | maxLength=50 | 1/1 | Số phiếu dễ đọc, duy nhất trong collection. |
| `documentKind` | String | Có | — | enum=["REVERSAL"]; default="REVERSAL" | 1/1 | Loại chứng từ. |
| `workflowStatus` | String | Có | — | maxLength=40 | 1/1 | Trạng thái xử lý của phiếu. |
| `version` | Number | Có | — | min=1 | 1/1 | Phiên bản kiểm soát cập nhật đồng thời. |
| `createdBy` | ObjectId | Có | REF → users | — | 1/1 | Tham chiếu users. |
| `occurredAt` | Date | Không | — | — | 1/1 | Thời điểm occurred. |
| `note` | String | Không | — | maxLength=2000 | 1/1 | Ghi chú nghiệp vụ. |
| `externalReferenceIds[]` | ObjectId[] | Không | LOGIC → external_references | — | 1/1 | ID các hồ sơ nguồn bên ngoài; liên kết logic, không phải kết nối MISA. |
| `sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `sources[].linkedQty` | Decimal128 | Không | — | — | 0/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `_id` | ObjectId | Không | — | — | 1/1 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 1/1 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]` | Embedded[] | Không | — | default=[] | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].lineNo` | Number | Có | — | min=1 | 1/1 | Thuộc tính line No. |
| `items[].lineKind` | String | Có | — | enum=["STANDARD","REPLENISHMENT","SALES_ORDER","OUTBOUND_DELIVERY","SALES_GOODS_ISSUE","DELIVERY_CONFIRMATION","FAILED_DELIVERY","FAILED_DELIVERY_RECEIPT","ST_RESOLUTION","INSPECTION","TRANSFER_RECEIPT","TRANSFER_OUTBOUND","ISSUE_REQUEST","WAREHOUSE_TASK","DISPOSITION","CUSTOMER_RETURN","SUPPLIER_RETURN","SUPPLIER_ACK","DISCREPANCY","ADJUSTMENT"] | 1/1 | Discriminator chọn cấu trúc details của dòng. |
| `items[].productId` | ObjectId | Có | REF → products | — | 1/1 | Tham chiếu products. |
| `items[].lotId` | ObjectId | Không | REF → product_batches | — | 1/1 | Tham chiếu product_batches. |
| `items[].enteredUnit` | String | Có | — | maxLength=60 | 1/1 | Đơn vị được nhập trên dòng. |
| `items[].baseUnitSnapshot` | String | Có | — | maxLength=60 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: base Unit. |
| `items[].baseUnitsPerUnit` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Unit. |
| `items[].packagingSnapshot` | Embedded | Không | — | — | 1/1 | Đối tượng nhúng. |
| `items[].packagingSnapshot.packageUnit` | String | Có | — | maxLength=60 | 1/1 | Thuộc tính package Unit. |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | Có | — | — | 1/1 | Thuộc tính base Units Per Package. |
| `items[].packagingSnapshot.outerLengthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Length Mm. |
| `items[].packagingSnapshot.outerWidthMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Width Mm. |
| `items[].packagingSnapshot.outerHeightMm` | Number | Không | — | min=1 | 1/1 | Kích thước, đơn vị mm; outer Height Mm. |
| `items[].enteredQty` | Decimal128 | Có | — | — | 1/1 | Số lượng nghiệp vụ: entered Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].qtyBase` | Decimal128 | Có | — | — | 1/1 | Thuộc tính qty Base. |
| `items[].productNameSnapshot` | String | Có | — | maxLength=200 | 1/1 | Thông tin chụp tại thời điểm ghi phiếu: product Name. |
| `items[].sources[]` | Embedded[] | Không | — | — | 1/1 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `items[].sources[].documentId` | ObjectId | Có | LOGIC → collection trong sources[].subjectCollection | — | 1/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `items[].sources[].subjectCollection` | String | Có | — | maxLength=80 | 1/1 | Thuộc tính subject Collection. |
| `items[].sources[].relationCode` | String | Có | — | maxLength=40 | 1/1 | Thuộc tính relation Code. |
| `items[].sources[].handoverId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ handover. Không có ref model cố định tại path này. |
| `items[].sources[].createdAt` | Date | Không | — | — | 0/1 | Thời điểm tạo bản ghi. |
| `items[].sources[].updatedAt` | Date | Không | — | — | 0/1 | Thời điểm cập nhật bản ghi. |
| `items[].sources[].itemId` | ObjectId | Không | LOGIC → items[]._id của chứng từ nguồn | — | 1/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `items[].sources[].linkedQty` | Decimal128 | Không | — | — | 1/1 | Số lượng nghiệp vụ: linked Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].sources[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].createdAt` | Date | Không | — | — | 1/1 | Thời điểm tạo bản ghi. |
| `items[].updatedAt` | Date | Không | — | — | 1/1 | Thời điểm cập nhật bản ghi. |
| `items[]._id` | ObjectId | Không | — | — | 1/1 | ID ổn định của phần tử nhúng. |
| `items[].note` | String | Không | — | maxLength=2000 | 0/1 | Ghi chú nghiệp vụ. |
| `items[].evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `updatedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 1/1 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `cancelledBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `cancelledAt` | Date | Không | — | — | 0/1 | Thời điểm cancelled. |
| `cancelReason` | String | Không | — | maxLength=2000 | 0/1 | Thuộc tính cancel Reason. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 1/1 | Tham chiếu stock_transactions. |
| `postedBy` | ObjectId | Không | REF → users | — | 1/1 | Tham chiếu users. |
| `postedAt` | Date | Không | — | — | 1/1 | Thời điểm posted. |
| `header` | Embedded | Có | — | — | 1/1 | Đối tượng nhúng. |
| `header.originalTransactionId` | ObjectId | Không | REF → stock_transactions | — | 0/1 | Tham chiếu stock_transactions. |
| `header.sourceDocument` | Embedded | Không | — | — | 0/1 | Đối tượng nhúng. |
| `header.sourceDocument.documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 0/1 | Thuộc tính document Type. |
| `header.sourceDocument.documentId` | ObjectId | Có | — | — | 0/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `header.sourceDocument.itemId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `header.sourceDocument.revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `header.sourceVersion` | Number | Không | — | min=1 | 0/1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: source Version. |
| `header.warehouseIds[]` | ObjectId[] | Không | REF → warehouses | default=[] | 1/1 | Tham chiếu warehouses. Mảng ID lưu ngay trong document. |
| `header.requestedBy` | ObjectId | Không | REF → users | — | 0/1 | Tham chiếu users. |
| `header.requestedAt` | Date | Không | — | — | 0/1 | Thời điểm requested. |
| `header.reason` | String | Không | — | maxLength=2000 | 0/1 | Lý do xử lý. |
| `header.replacementDocument` | Embedded | Không | — | — | 0/1 | Đối tượng nhúng. |
| `header.replacementDocument.documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 0/1 | Thuộc tính document Type. |
| `header.replacementDocument.documentId` | ObjectId | Có | — | — | 0/1 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `header.replacementDocument.itemId` | ObjectId | Không | — | — | 0/1 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `header.replacementDocument.revision` | Number | Không | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `approvalDecision` | Embedded | Không | — | — | 0/1 | Đối tượng nhúng. |
| `approvalDecision.decisionId` | ObjectId | Có | REF → approval_history | — | 0/1 | Tham chiếu approval_history. |
| `approvalDecision.revision` | Number | Có | — | min=1 | 0/1 | Phiên bản nội dung nghiệp vụ. |
| `approvalDecision.reviewedBy` | ObjectId | Có | REF → users | — | 0/1 | Tham chiếu users. |
| `approvalDecision.reviewedAt` | Date | Có | — | — | 0/1 | Thời điểm reviewed. |
| `approvalDecision.decision` | String | Có | — | enum=["APPROVE","REJECT","REVISE"] | 0/1 | Thuộc tính decision. |
| `approvalDecision.reason` | String | Có | — | maxLength=2000 | 0/1 | Lý do xử lý. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `documentNo_1` | `{"documentNo": 1}` | Có | — |
| `items._id_1` | `{"items._id": 1}` | Không | — |
| `sources.documentId_1` | `{"sources.documentId": 1}` | Không | — |
| `items.sources.itemId_1` | `{"items.sources.itemId": 1}` | Không | — |
| `workflowStatus_1_createdAt_-1` | `{"workflowStatus": 1, "createdAt": -1}` | Không | — |

## M — Lịch sử, bằng chứng và tác vụ hỗ trợ

<a id="approval_history"></a>
### `approval_history`

Lịch sử quyết định theo đúng phiên bản phiếu/dòng, người quyết định và căn cứ.

- Model: `ApprovalHistory`; số bản ghi mẫu: **6**.
- Nhóm: Lịch sử, bằng chứng và tác vụ hỗ trợ. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `decisionKey` | String | Có | — | maxLength=160 | 6/6 | Thuộc tính decision Key. |
| `subjectType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 6/6 | Loại đối tượng để diễn giải subjectId. |
| `subjectId` | ObjectId | Có | — | — | 6/6 | ID đối tượng theo subjectType. |
| `subjectRevision` | Number | Có | — | min=1 | 6/6 | Phiên bản nguồn/nội dung tại thời điểm xử lý: subject Revision. |
| `decisionScope` | String | Có | — | maxLength=60 | 6/6 | Thuộc tính decision Scope. |
| `reviewedContent` | Mixed | Có | — | — | 6/6 | Thuộc tính reviewed Content. |
| `decision` | String | Có | — | enum=["APPROVE","REJECT","REVISE"] | 6/6 | Thuộc tính decision. |
| `reason` | String | Có | — | maxLength=2000 | 6/6 | Lý do xử lý. |
| `itemDecisions[]` | Embedded[] | Không | — | — | 6/6 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `itemDecisions[].itemId` | ObjectId | Có | — | — | 6/6 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `itemDecisions[].approvedQtyBase` | Decimal128 | Có | — | — | 6/6 | Số lượng nghiệp vụ: approved Qty Base; đơn vị gốc. |
| `itemDecisions[].outcome` | String | Có | — | maxLength=40 | 6/6 | Thuộc tính outcome. |
| `itemDecisions[].reason` | String | Không | — | maxLength=1000 | 0/6 | Lý do xử lý. |
| `requestedBy` | ObjectId | Có | REF → users | — | 6/6 | Tham chiếu users. |
| `decidedBy` | ObjectId | Có | REF → users | — | 6/6 | Tham chiếu users. |
| `decidedAt` | Date | Có | — | — | 6/6 | Thời điểm decided. |
| `recordedAt` | Date | Có | — | — | 6/6 | Thời điểm recorded. |
| `authoritySnapshot` | Embedded | Không | — | — | 6/6 | Đối tượng nhúng. |
| `authoritySnapshot.roleCode` | String | Có | — | maxLength=60 | 6/6 | Thuộc tính role Code. |
| `authoritySnapshot.permissionCode` | String | Có | — | maxLength=100 | 6/6 | Thuộc tính permission Code. |
| `authoritySnapshot.warehouseIds[]` | ObjectId[] | Không | REF → warehouses | default=[] | 6/6 | Tham chiếu warehouses. Mảng ID lưu ngay trong document. |
| `basisRefs[]` | Embedded[] | Không | — | — | 6/6 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `basisRefs[].documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 0/6 | Thuộc tính document Type. |
| `basisRefs[].documentId` | ObjectId | Có | — | — | 0/6 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `basisRefs[].itemId` | ObjectId | Không | — | — | 0/6 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `basisRefs[].revision` | Number | Không | — | min=1 | 0/6 | Phiên bản nội dung nghiệp vụ. |
| `evidenceIds[]` | ObjectId[] | Không | REF → attachments | default=[] | 6/6 | Tham chiếu attachments. Mảng ID lưu ngay trong document. |
| `supersedesDecisionId` | ObjectId | Không | REF → approval_history | — | 0/6 | Tham chiếu approval_history. |
| `_id` | ObjectId | Không | — | — | 6/6 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 5/6 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/6 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `decisionKey_1` | `{"decisionKey": 1}` | Có | — |
| `subjectType_1_subjectId_1_subjectRevision_1` | `{"subjectType": 1, "subjectId": 1, "subjectRevision": 1}` | Không | — |
<a id="attachments"></a>
### `attachments`

Metadata ảnh/PDF và quyền truy cập bằng chứng; dữ liệu tệp lưu theo storageKey.

- Model: `Attachment`; số bản ghi mẫu: **6**.
- Nhóm: Lịch sử, bằng chứng và tác vụ hỗ trợ. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `ownerDocumentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 6/6 | Thuộc tính owner Document Type. |
| `ownerDocumentId` | ObjectId | Không | — | — | 6/6 | ID liên kết nghiệp vụ owner Document. Không có ref model cố định tại path này. |
| `ownerItemId` | ObjectId | Không | — | — | 0/6 | ID liên kết nghiệp vụ owner Item. Không có ref model cố định tại path này. |
| `ownerRevision` | Number | Không | — | min=1 | 6/6 | Phiên bản nguồn/nội dung tại thời điểm xử lý: owner Revision. |
| `purpose` | String | Có | — | maxLength=80 | 6/6 | Thuộc tính purpose. |
| `originalName` | String | Có | — | maxLength=250 | 6/6 | Thuộc tính original Name. |
| `mediaType` | String | Có | — | enum=["image/jpeg","image/png","image/webp","application/pdf"] | 6/6 | Thuộc tính media Type. |
| `sizeBytes` | Number | Có | — | min=1; max=10485760 | 6/6 | Thuộc tính size Bytes. |
| `storageKey` | String | Có | — | maxLength=600 | 6/6 | Thuộc tính storage Key. |
| `checksum` | String | Có | — | maxLength=64; match="/^[a-f\\d]{64}$/i" | 6/6 | Thuộc tính checksum. |
| `uploadedBy` | ObjectId | Có | REF → users | — | 6/6 | Tham chiếu users. |
| `uploadedAt` | Date | Có | — | — | 6/6 | Thời điểm uploaded. |
| `capturedAt` | Date | Không | — | — | 0/6 | Thời điểm captured. |
| `accessCategory` | String | Có | — | enum=["BUSINESS","INTERNAL","PURCHASE_PRICE","SALES_PRICE"] | 6/6 | Thuộc tính access Category. |
| `status` | String | Có | — | enum=["TEMPORARY","ATTACHED","SUPERSEDED"] | 6/6 | Trạng thái, xem tập enum. |
| `uploadSessionId` | String | Không | — | maxLength=160 | 0/6 | ID liên kết nghiệp vụ upload Session. Không có ref model cố định tại path này. |
| `expiresAt` | Date | Không | — | — | 0/6 | Thời điểm expires. |
| `replacesAttachmentId` | ObjectId | Không | REF → attachments | — | 0/6 | Tham chiếu attachments. |
| `replacementReason` | String | Không | — | maxLength=1000 | 0/6 | Thuộc tính replacement Reason. |
| `_id` | ObjectId | Không | — | — | 6/6 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 6/6 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/6 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
<a id="notifications"></a>
### `notifications`

Thông báo theo nhân viên và trạng thái đọc; kèm theo dõi gửi email SMTP.

- Model: `Notification`; số bản ghi mẫu: **4**.
- Nhóm: Lịch sử, bằng chứng và tác vụ hỗ trợ. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `recipientId` | ObjectId | Có | REF → users | — | 4/4 | Tham chiếu users. |
| `type` | String | Có | — | maxLength=80 | 4/4 | Thuộc tính type. |
| `eventKey` | String | Có | — | maxLength=160 | 4/4 | Thuộc tính event Key. |
| `dedupKey` | String | Có | — | maxLength=400 | 4/4 | Thuộc tính dedup Key. |
| `sourceType` | String | Có | — | maxLength=80 | 4/4 | Loại chứng từ để diễn giải sourceId. |
| `sourceId` | ObjectId | Có | — | — | 4/4 | ID chứng từ nguồn, diễn giải theo sourceType. |
| `sourceVersion` | Number | Có | — | min=1 | 4/4 | Phiên bản nguồn/nội dung tại thời điểm xử lý: source Version. |
| `warehouseIds[]` | ObjectId[] | Không | REF → warehouses | default=[] | 4/4 | Tham chiếu warehouses. Mảng ID lưu ngay trong document. |
| `title` | String | Có | — | maxLength=200 | 4/4 | Thuộc tính title. |
| `message` | String | Có | — | maxLength=2000 | 4/4 | Thuộc tính message. |
| `occurredAt` | Date | Có | — | — | 4/4 | Thời điểm occurred. |
| `readAt` | Date | Không | — | — | 4/4 | Thời điểm read. |
| `archivedAt` | Date | Không | — | — | 0/4 | Thời điểm archived. |
| `conditionKey` | String | Không | — | maxLength=160 | 0/4 | Thuộc tính condition Key. |
| `conditionState` | String | Không | — | maxLength=40 | 0/4 | Thuộc tính condition State. |
| `evaluatedAt` | Date | Không | — | — | 4/4 | Thời điểm evaluated. |
| `emailDelivery` | Embedded | Không | — | — | 4/4 | Đối tượng nhúng. |
| `emailDelivery.status` | String | Có | — | enum=["PENDING","SENT","FAILED","SKIPPED"] | 4/4 | Trạng thái, xem tập enum. |
| `emailDelivery.attempts` | Number | Có | — | min=0 | 4/4 | Thuộc tính attempts. |
| `emailDelivery.sentAt` | Date | Không | — | — | 0/4 | Thời điểm sent. |
| `emailDelivery.lastError` | String | Không | — | maxLength=500 | 0/4 | Thuộc tính last Error. |
| `_id` | ObjectId | Không | — | — | 4/4 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 4/4 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/4 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `dedupKey_1` | `{"dedupKey": 1}` | Có | — |
| `recipientId_1_readAt_1_createdAt_-1` | `{"recipientId": 1, "readAt": 1, "createdAt": -1}` | Không | — |
<a id="audit_logs"></a>
### `audit_logs`

Nhật ký người thao tác, kết quả và thay đổi; tách khỏi lịch sử số lượng tồn.

- Model: `AuditLog`; số bản ghi mẫu: **56**.
- Nhóm: Lịch sử, bằng chứng và tác vụ hỗ trợ. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `eventKey` | String | Có | — | maxLength=160 | 56/56 | Thuộc tính event Key. |
| `correlationId` | String | Không | — | maxLength=160 | 0/56 | ID liên kết nghiệp vụ correlation. Không có ref model cố định tại path này. |
| `actorType` | String | Có | — | enum=["USER","SYSTEM"] | 56/56 | Thuộc tính actor Type. |
| `actorId` | ObjectId | Không | REF → users | — | 56/56 | Tham chiếu users. |
| `actorSnapshot` | Embedded | Không | — | — | 56/56 | Đối tượng nhúng. |
| `actorSnapshot.username` | String | Có | — | maxLength=100 | 56/56 | Tên đăng nhập cố định. |
| `actorSnapshot.roleCode` | String | Có | — | maxLength=60 | 56/56 | Thuộc tính role Code. |
| `action` | String | Có | — | maxLength=100 | 56/56 | Thuộc tính action. |
| `result` | String | Có | — | enum=["SUCCESS","REJECTED","FAILED"] | 56/56 | Thuộc tính result. |
| `reason` | String | Không | — | maxLength=2000 | 56/56 | Lý do xử lý. |
| `subjectType` | String | Có | — | maxLength=80 | 56/56 | Loại đối tượng để diễn giải subjectId. |
| `subjectId` | ObjectId | Có | — | — | 56/56 | ID đối tượng theo subjectType. |
| `warehouseIds[]` | ObjectId[] | Không | REF → warehouses | default=[] | 56/56 | Tham chiếu warehouses. Mảng ID lưu ngay trong document. |
| `versionBefore` | Number | Không | — | min=0 | 0/56 | Thuộc tính version Before. |
| `versionAfter` | Number | Không | — | min=1 | 0/56 | Thuộc tính version After. |
| `changes[]` | Embedded[] | Không | — | — | 56/56 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `changes[].field` | String | Có | — | maxLength=150 | 0/56 | Thuộc tính field. |
| `changes[].before` | Mixed | Không | — | — | 0/56 | Thuộc tính before. |
| `changes[].after` | Mixed | Không | — | — | 0/56 | Thuộc tính after. |
| `decisionId` | ObjectId | Không | REF → approval_history | — | 0/56 | Tham chiếu approval_history. |
| `transactionId` | ObjectId | Không | REF → stock_transactions | — | 0/56 | Tham chiếu stock_transactions. |
| `operationId` | ObjectId | Không | REF → operation_records | — | 0/56 | Tham chiếu operation_records. |
| `occurredAt` | Date | Có | — | — | 56/56 | Thời điểm occurred. |
| `recordedAt` | Date | Có | — | — | 56/56 | Thời điểm recorded. |
| `_id` | ObjectId | Không | — | — | 56/56 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 56/56 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/56 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `eventKey_1` | `{"eventKey": 1}` | Có | — |
| `subjectId_1_occurredAt_1` | `{"subjectId": 1, "occurredAt": 1}` | Không | — |
<a id="system_events"></a>
### `system_events`

Công việc sau khi lưu thành công, như gửi thông báo/email và thử lại độc lập.

- Model: `SystemEvent`; số bản ghi mẫu: **56**.
- Nhóm: Lịch sử, bằng chứng và tác vụ hỗ trợ. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `eventKey` | String | Có | — | maxLength=160 | 56/56 | Thuộc tính event Key. |
| `handlerCode` | String | Có | — | maxLength=80 | 56/56 | Thuộc tính handler Code. |
| `eventType` | String | Có | — | maxLength=80 | 56/56 | Thuộc tính event Type. |
| `sourceType` | String | Có | — | maxLength=80 | 56/56 | Loại chứng từ để diễn giải sourceId. |
| `sourceId` | ObjectId | Có | — | — | 56/56 | ID chứng từ nguồn, diễn giải theo sourceType. |
| `sourceVersion` | Number | Có | — | min=1 | 56/56 | Phiên bản nguồn/nội dung tại thời điểm xử lý: source Version. |
| `correlationId` | String | Không | — | maxLength=160 | 0/56 | ID liên kết nghiệp vụ correlation. Không có ref model cố định tại path này. |
| `payload` | Mixed | Có | — | — | 56/56 | Thuộc tính payload. |
| `payloadVersion` | Number | Có | — | min=1 | 56/56 | Phiên bản nguồn/nội dung tại thời điểm xử lý: payload Version. |
| `status` | String | Có | — | enum=["PENDING","PROCESSING","COMPLETED","FAILED"] | 56/56 | Trạng thái, xem tập enum. |
| `attempts` | Number | Có | — | min=0 | 56/56 | Thuộc tính attempts. |
| `nextAttemptAt` | Date | Không | — | — | 0/56 | Thời điểm next attempt. |
| `leaseOwner` | String | Không | — | maxLength=100 | 0/56 | Thuộc tính lease Owner. |
| `leaseToken` | String | Không | — | maxLength=100 | 0/56 | Thuộc tính lease Token. |
| `leaseUntil` | Date | Không | — | — | 0/56 | Thuộc tính lease Until. |
| `lastErrorCode` | String | Không | — | maxLength=100 | 0/56 | Thuộc tính last Error Code. |
| `lastErrorSummary` | String | Không | — | maxLength=1000 | 0/56 | Thuộc tính last Error Summary. |
| `completedAt` | Date | Không | — | — | 56/56 | Thời điểm completed. |
| `occurredAt` | Date | Có | — | — | 56/56 | Thời điểm occurred. |
| `_id` | ObjectId | Không | — | — | 56/56 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 56/56 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/56 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `eventKey_1_handlerCode_1` | `{"eventKey": 1, "handlerCode": 1}` | Có | — |
| `status_1_nextAttemptAt_1` | `{"status": 1, "nextAttemptAt": 1}` | Không | — |
<a id="operation_records"></a>
### `operation_records`

Ghi kết quả thao tác theo mã yêu cầu để chống xử lý lặp và liên kết kết quả.

- Model: `OperationRecord`; số bản ghi mẫu: **10**.
- Nhóm: Lịch sử, bằng chứng và tác vụ hỗ trợ. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `actorType` | String | Có | — | enum=["USER","SYSTEM"] | 10/10 | Thuộc tính actor Type. |
| `actorId` | ObjectId | Không | REF → users | — | 10/10 | Tham chiếu users. |
| `operationCode` | String | Có | — | maxLength=100 | 10/10 | Thuộc tính operation Code. |
| `requestKey` | String | Có | — | maxLength=160 | 10/10 | Khóa của lần gửi để chống lặp. |
| `requestHash` | String | Có | — | maxLength=64; match="/^[a-f\\d]{64}$/i" | 10/10 | Dấu kiểm tra nội dung yêu cầu. |
| `operationKey` | String | Có | — | maxLength=200 | 10/10 | Thuộc tính operation Key. |
| `subjectType` | String | Có | — | maxLength=80 | 10/10 | Loại đối tượng để diễn giải subjectId. |
| `subjectId` | ObjectId | Có | — | — | 10/10 | ID đối tượng theo subjectType. |
| `versionBefore` | Number | Có | — | min=0 | 10/10 | Thuộc tính version Before. |
| `versionAfter` | Number | Có | — | min=1 | 10/10 | Thuộc tính version After. |
| `resultRefs[]` | Embedded[] | Không | — | — | 10/10 | Danh sách đối tượng nhúng; không phải collection riêng. |
| `resultRefs[].documentType` | String | Có | — | enum=["replenishment_requests","purchase_orders","goods_arrivals","goods_inspections","purchase_receipts","transfer_orders","warehouse_transfer_requests","internal_transfer_requirements","transfer_dispatches","transfer_receipts","sales_orders","warehouse_issue_requests","delivery_orders","sales_goods_issues","delivery_confirmations","external_payment_confirmations","defect_reports","defect_resolution_plans","stock_scrap_records","stocktakes","stock_adjustments","failed_deliveries","failed_delivery_receipts","stocktake_resolution_plans","stock_quality_changes","customer_returns","customer_return_receipts","supplier_returns","supplier_return_issues","supplier_acknowledgements","stock_discrepancies","custody_receipts","custody_releases","stock_reversals","opening_stocks","sales_invoices","external_references"] | 10/10 | Thuộc tính document Type. |
| `resultRefs[].documentId` | ObjectId | Có | — | — | 10/10 | ID liên kết nghiệp vụ document. Không có ref model cố định tại path này. |
| `resultRefs[].itemId` | ObjectId | Không | — | — | 0/10 | ID liên kết nghiệp vụ item. Không có ref model cố định tại path này. |
| `resultRefs[].revision` | Number | Không | — | min=1 | 0/10 | Phiên bản nội dung nghiệp vụ. |
| `resultCode` | String | Có | — | maxLength=60 | 10/10 | Thuộc tính result Code. |
| `completedAt` | Date | Có | — | — | 10/10 | Thời điểm completed. |
| `stockTransactionId` | ObjectId | Không | REF → stock_transactions | — | 0/10 | Tham chiếu stock_transactions. |
| `decisionId` | ObjectId | Không | REF → approval_history | — | 0/10 | Tham chiếu approval_history. |
| `correlationId` | String | Không | — | maxLength=160 | 0/10 | ID liên kết nghiệp vụ correlation. Không có ref model cố định tại path này. |
| `_id` | ObjectId | Không | — | — | 10/10 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 10/10 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/10 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `actorType_1_actorId_1_operationCode_1_requestKey_1` | `{"actorType": 1, "actorId": 1, "operationCode": 1, "requestKey": 1}` | Có | — |
| `operationKey_1` | `{"operationKey": 1}` | Có | — |
<a id="replenishment_locks"></a>
### `replenishment_locks`

Phối hợp xử lý đồng thời theo kho/sản phẩm để tránh lập bổ sung trùng.

- Model: `ReplenishmentLock`; số bản ghi mẫu: **6**.
- Nhóm: Lịch sử, bằng chứng và tác vụ hỗ trợ. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `warehouseId` | ObjectId | Có | REF → warehouses | — | 6/6 | Tham chiếu warehouses. |
| `productId` | ObjectId | Có | REF → products | — | 6/6 | Tham chiếu products. |
| `version` | Number | Có | — | default=0; min=0 | 6/6 | Phiên bản kiểm soát cập nhật đồng thời. |
| `lastOperationId` | ObjectId | Không | REF → operation_records | — | 0/6 | Tham chiếu operation_records. |
| `_id` | ObjectId | Không | — | — | 6/6 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 6/6 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 6/6 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `warehouseId_1_productId_1` | `{"warehouseId": 1, "productId": 1}` | Có | — |
<a id="return_source_locks"></a>
### `return_source_locks`

Phối hợp xử lý đồng thời theo nguồn trả; hạn mức thực tế ở return_quantity_claims.

- Model: `ReturnSourceLock`; số bản ghi mẫu: **2**.
- Nhóm: Lịch sử, bằng chứng và tác vụ hỗ trợ. Khóa document: `_id: ObjectId`.

| Path | Kiểu | Required | Ref / liên kết | Ràng buộc model | Có trong mẫu | Mô tả |
|---|---|---|---|---|---|---|
| `sourceKey` | String | Có | — | maxLength=200 | 2/2 | Thuộc tính source Key. |
| `sourceKind` | String | Có | — | maxLength=80 | 2/2 | Thuộc tính source Kind. |
| `sourceDocumentId` | ObjectId | Có | — | — | 2/2 | ID liên kết nghiệp vụ source Document. Không có ref model cố định tại path này. |
| `sourceItemId` | ObjectId | Có | — | — | 2/2 | ID liên kết nghiệp vụ source Item. Không có ref model cố định tại path này. |
| `version` | Number | Có | — | default=0; min=0 | 2/2 | Phiên bản kiểm soát cập nhật đồng thời. |
| `lastOperationId` | ObjectId | Không | REF → operation_records | — | 2/2 | Tham chiếu operation_records. |
| `_id` | ObjectId | Không | — | — | 2/2 | ID document MongoDB. |
| `createdAt` | Date | Không | — | immutable | 0/2 | Thời điểm tạo bản ghi. |
| `updatedAt` | Date | Không | — | — | 0/2 | Thời điểm cập nhật bản ghi. |

**Index thực tế trên MongoDB**

| Tên | Keys | Unique | Điều kiện / tùy chọn |
|---|---|---|---|
| `_id_` | `{"_id": 1}` | Có | — |
| `sourceKey_1` | `{"sourceKey": 1}` | Có | — |

## Phụ lục — 19 kiểu details nhúng

Các path dưới đây bổ sung/ghi đè phần dòng chung, chọn bởi `lineKind`. Nếu ở bàn giao, thay tiền tố `items[]` bằng `handovers[].items[]`.

### `REPLENISHMENT`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.triggerType` | String | True | — | enum=["SALES_SHORTAGE","STOCKTAKE_LOW_STOCK","MANUAL_OTHER"] | Thuộc tính trigger Type. |
| `items[].details.sourceSalesOrderLineId` | ObjectId | False | item | — | Liên kết logic: item. |
| `items[].details.sourceSalesOrderVersion` | Number | False | — | min=1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: source Sales Order Version. |
| `items[].details.sourceIssueRequestLineId` | ObjectId | False | item | — | Liên kết logic: item. |
| `items[].details.sourceIssueRequestVersion` | Number | False | — | min=1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: source Issue Request Version. |
| `items[].details.sourceStocktakeId` | ObjectId | False | document | — | Liên kết logic: document. |
| `items[].details.sourceStocktakeVersion` | Number | False | — | min=1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: source Stocktake Version. |
| `items[].details.policyId` | ObjectId | False | stock_thresholds | — | Tham chiếu stock_thresholds. |
| `items[].details.policyVersion` | Number | False | — | min=1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: policy Version. |
| `items[].details.evaluationKey` | String | False | — | maxLength=200 | Thuộc tính evaluation Key. |
| `items[].details.evaluatedAt` | Date | False | — | — | Thời điểm evaluated. |
| `items[].details.availableQtySnapshot` | Decimal128 | False | — | — | Số lượng nghiệp vụ: available Qty Snapshot; kiểm quy đổi/nguồn của dòng. |
| `items[].details.otherWarehouseCoverageQtySnapshot` | Decimal128 | False | — | — | Số lượng nghiệp vụ: other Warehouse Coverage Qty Snapshot; kiểm quy đổi/nguồn của dòng. |
| `items[].details.remainingDemandQtySnapshot` | Decimal128 | False | — | — | Số lượng nghiệp vụ: remaining Demand Qty Snapshot; kiểm quy đổi/nguồn của dòng. |
| `items[].details.reservedForDemandQtySnapshot` | Decimal128 | False | — | — | Số lượng nghiệp vụ: reserved For Demand Qty Snapshot; kiểm quy đổi/nguồn của dòng. |
| `items[].details.onHandCoverageQtySnapshot` | Decimal128 | False | — | — | Số lượng nghiệp vụ: on Hand Coverage Qty Snapshot; kiểm quy đổi/nguồn của dòng. |
| `items[].details.incomingCoverageQtySnapshot` | Decimal128 | False | — | — | Số lượng nghiệp vụ: incoming Coverage Qty Snapshot; kiểm quy đổi/nguồn của dòng. |
| `items[].details.pendingRequestCoverageQtySnapshot` | Decimal128 | False | — | — | Số lượng nghiệp vụ: pending Request Coverage Qty Snapshot; kiểm quy đổi/nguồn của dòng. |
| `items[].details.minimumQtySnapshot` | Decimal128 | False | — | — | Số lượng nghiệp vụ: minimum Qty Snapshot; kiểm quy đổi/nguồn của dòng. |
| `items[].details.targetQtySnapshot` | Decimal128 | False | — | — | Số lượng nghiệp vụ: target Qty Snapshot; kiểm quy đổi/nguồn của dòng. |
| `items[].details.suggestedQty` | Decimal128 | False | — | — | Số lượng nghiệp vụ: suggested Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].details.reasonNote` | String | True | — | maxLength=2000 | Thuộc tính reason Note. |
| `items[].details.quantityAdjustmentReason` | String | False | — | maxLength=2000 | Số lượng nghiệp vụ: quantity Adjustment Reason; kiểm quy đổi/nguồn của dòng. |
### `SALES_ORDER`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.externalReferenceId` | ObjectId | True | external_references | — | Tham chiếu external_references. |
| `items[].details.externalLineId` | ObjectId | True | external_reference_lines | — | Tham chiếu external_reference_lines. |
| `items[].details.requiredTone` | String | False | — | maxLength=60 | Thuộc tính required Tone. |
| `items[].details.requiredCalibre` | String | False | — | maxLength=60 | Thuộc tính required Calibre. |
### `OUTBOUND_DELIVERY`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.issueRequestLineId` | ObjectId | True | item | — | Liên kết logic: item. |
### `SALES_GOODS_ISSUE`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.outboundDeliveryLineId` | ObjectId | True | item | — | Liên kết logic: item. |
### `DELIVERY_CONFIRMATION`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.salesIssueLineId` | ObjectId | True | item | — | Liên kết logic: item. |
| `items[].details.photoEvidenceId` | ObjectId | True | attachments | — | Tham chiếu attachments. |
### `FAILED_DELIVERY`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.salesIssueLineId` | ObjectId | True | item | — | Liên kết logic: item. |
### `FAILED_DELIVERY_RECEIPT`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.failedDeliveryLineId` | ObjectId | True | item | — | Liên kết logic: item. |
| `items[].details.salesIssueLineId` | ObjectId | True | item | — | Liên kết logic: item. |
| `items[].details.inspectionLineId` | ObjectId | True | item | — | Liên kết logic: item. |
| `items[].details.claimId` | ObjectId | False | return_quantity_claims | — | Tham chiếu return_quantity_claims. |
### `ST_RESOLUTION`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.countId` | ObjectId | True | stocktake_counts | — | Tham chiếu stocktake_counts. |
| `items[].details.holdId` | ObjectId | False | stock_holds | — | Tham chiếu stock_holds. |
| `items[].details.actionKind` | String | True | — | enum=["DELTA","RECLASS","RELOCATE"] | Thuộc tính action Kind. |
| `items[].details.fromBalanceId` | ObjectId | False | inventory_balances | — | Tham chiếu inventory_balances. |
| `items[].details.toBalanceId` | ObjectId | False | inventory_balances | — | Tham chiếu inventory_balances. |
| `items[].details.deltaQty` | Decimal128 | False | — | — | Số lượng nghiệp vụ: delta Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].details.executedBy` | ObjectId | False | users | — | Tham chiếu users. |
| `items[].details.executedAt` | Date | False | — | — | Thời điểm executed. |
| `items[].details.executionEvidenceId` | ObjectId | False | attachments | — | Tham chiếu attachments. |
### `INSPECTION`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.inspectedSourceLineId` | ObjectId | True | item | — | Liên kết logic: item. |
| `items[].details.qualityCode` | String | True | — | enum=["PENDING","GOOD","DAMAGED","BLOCKED"] | Thuộc tính quality Code. |
| `items[].details.ownershipDecision` | String | True | — | enum=["ACCEPT","CUSTODY","REJECT"] | Thuộc tính ownership Decision. |
| `items[].details.inspectedBy` | ObjectId | True | users | — | Tham chiếu users. |
| `items[].details.inspectedAt` | Date | True | — | — | Thời điểm inspected. |
| `items[].details.packagingCondition` | String | True | — | enum=["SEALED","OPENED","TORN","UNKNOWN"]; default="UNKNOWN" | Thuộc tính packaging Condition. |
### `TRANSFER_RECEIPT`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.dispatchLineId` | ObjectId | True | item | — | Liên kết logic: item. |
| `items[].details.qualityCode` | String | True | — | enum=["PENDING","GOOD","DAMAGED","BLOCKED"] | Thuộc tính quality Code. |
| `items[].details.destinationBalanceId` | ObjectId | False | inventory_balances | — | Tham chiếu inventory_balances. |
| `items[].details.receivingLocationId` | ObjectId | False | warehouse_locations | — | Tham chiếu warehouse_locations. |
### `TRANSFER_OUTBOUND`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.requestLineId` | ObjectId | True | item | — | Liên kết logic: item. |
| `items[].details.sourceBalanceId` | ObjectId | True | inventory_balances | — | Tham chiếu inventory_balances. |
| `items[].details.stagingLocationId` | ObjectId | True | warehouse_locations | — | Tham chiếu warehouse_locations. |
### `ISSUE_REQUEST`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.salesOrderLineId` | ObjectId | True | item | — | Liên kết logic: item. |
| `items[].details.releaseKey` | String | True | — | maxLength=60 | Thuộc tính release Key. |
| `items[].details.requiredTone` | String | False | — | maxLength=60 | Thuộc tính required Tone. |
| `items[].details.requiredCalibre` | String | False | — | maxLength=60 | Thuộc tính required Calibre. |
| `items[].details.substitutionApprovalReference` | String | False | — | maxLength=300 | Thuộc tính substitution Approval Reference. |
### `WAREHOUSE_TASK`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.fromLocationId` | ObjectId | True | warehouse_locations | — | Tham chiếu warehouse_locations. |
| `items[].details.toLocationId` | ObjectId | True | warehouse_locations | — | Tham chiếu warehouse_locations. |
| `items[].details.qualityCode` | String | True | — | enum=["PENDING","GOOD","DAMAGED","BLOCKED"] | Thuộc tính quality Code. |
| `items[].details.sourceBalanceId` | ObjectId | False | inventory_balances | — | Tham chiếu inventory_balances. |
| `items[].details.sourceBalanceVersion` | Number | False | — | min=0 | Phiên bản nguồn/nội dung tại thời điểm xử lý: source Balance Version. |
| `items[].details.ownerType` | String | False | — | enum=["STORE","SUPPLIER","CUSTOMER"] | Loại chủ sở hữu để diễn giải ownerId. |
| `items[].details.ownerId` | ObjectId | False | — | — | ID khách/NCC theo ownerType; STORE không có đối tác sở hữu. |
### `DISPOSITION`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.defectLineId` | ObjectId | True | item | — | Liên kết logic: item. |
| `items[].details.outcome` | String | True | — | enum=["RELEASE","REGRADE","SCRAP","RETURN_SUPPLIER"] | Thuộc tính outcome. |
| `items[].details.approvalId` | ObjectId | False | approval_history | — | Tham chiếu approval_history. |
### `CUSTOMER_RETURN`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.originalIssueLineId` | ObjectId | False | item | — | Liên kết logic: item. |
| `items[].details.historicalExternalLineId` | ObjectId | False | external_reference_lines | — | Tham chiếu external_reference_lines. |
| `items[].details.reason` | String | True | — | maxLength=1000 | Lý do xử lý. |
### `SUPPLIER_RETURN`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.originLineId` | ObjectId | True | item | — | Liên kết logic: item. |
| `items[].details.agreedQty` | Decimal128 | True | — | — | Số lượng nghiệp vụ: agreed Qty; kiểm quy đổi/nguồn của dòng. |
| `items[].details.agreementVersion` | Number | True | — | min=1 | Phiên bản nguồn/nội dung tại thời điểm xử lý: agreement Version. |
| `items[].details.agreementVerifiedBy` | ObjectId | True | users | — | Tham chiếu users. |
| `items[].details.agreementVerifiedAt` | Date | True | — | — | Thời điểm agreement verified. |
| `items[].details.agreementEvidenceId` | ObjectId | True | attachments | — | Tham chiếu attachments. |
| `items[].details.ownerType` | String | False | — | enum=["STORE","SUPPLIER","CUSTOMER"] | Loại chủ sở hữu để diễn giải ownerId. |
| `items[].details.ownerId` | ObjectId | False | — | — | ID khách/NCC theo ownerType; STORE không có đối tác sở hữu. |
### `SUPPLIER_ACK`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.dispatchLineId` | ObjectId | True | item | — | Liên kết logic: item. |
| `items[].details.outcome` | String | True | — | enum=["ACCEPTED","REJECTED","DAMAGED"] | Thuộc tính outcome. |
| `items[].details.acknowledgedAt` | Date | True | — | — | Thời điểm acknowledged. |
### `DISCREPANCY`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.sourceLineId` | ObjectId | True | item | — | Liên kết logic: item. |
| `items[].details.discrepancyKind` | String | True | — | enum=["SHORT","OVER","DAMAGED","WRONG_LOT","WRONG_PRODUCT"] | Thuộc tính discrepancy Kind. |
| `items[].details.resolutionStatus` | String | True | — | default="OPEN"; maxLength=20 | Thuộc tính resolution Status. |
| `items[].details.resolutionDocumentId` | ObjectId | False | document | — | Liên kết logic: document. |
### `ADJUSTMENT`

| Path | Kiểu | Required | Ref | Ràng buộc | Mô tả |
|---|---|---|---|---|---|
| `items[]._id` | ObjectId | False | — | — | ID ổn định của phần tử nhúng. |
| `items[].details` | Embedded | True | — | — | Đối tượng nhúng. |
| `items[].details.countId` | ObjectId | True | stocktake_counts | — | Tham chiếu stocktake_counts. |
| `items[].details.approvalId` | ObjectId | False | approval_history | — | Tham chiếu approval_history. |
| `items[].details.deltaQty` | Decimal128 | True | — | — | Số lượng nghiệp vụ: delta Qty; kiểm quy đổi/nguồn của dòng. |

## Collection điều khiển `_db_rebuild`

Không phải bảng nghiệp vụ. Marker chứa trạng thái schema/migration/seed. Giá trị đã đọc: schemaProfile=`reviewed-20261103`, runtimeReady=`false`, seedVersion=`wmsd-reviewed-demo-20261103-v1`. Không đổi trong tác vụ lập sơ đồ.
