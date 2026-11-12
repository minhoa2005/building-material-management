---
id: DOC-API-RR-COVERAGE-001
title: Cảnh báo yêu cầu bổ sung hàng
version: 2.0.0
phase: Implementation
domain: Replenishment
tags: [replenishment, warnings]
depends_on: [DOC-API-NATIVE-RUNTIME]
author: Codex
last_updated: 2026-11-11
---

# Cảnh báo yêu cầu bổ sung hàng

Theo quyết định người dùng ngày 11/11/2026, người lập quyết định lượng đề nghị và giải trình khi có cảnh báo. Quy tắc giống nhau cho mọi loại nguồn. Người duyệt độc lập quyết định lượng được chấp thuận trong giới hạn lượng đề nghị. SO, WIR và kiểm kê được lưu để truy vết.

## Tùy chọn nhập phiếu

`GET /api/replenishments/options/lots?productId=<id>&warehouseId=<id>&page=1&limit=20` lấy quy cách thùng cho form RR. Mặc định page 1, limit 20, tối đa 100. Khi tạo, quyền là `replenishment_request:create`. Thêm `requestId=<id>` khi sửa, dùng `replenishment_request:update` và kiểm người lập, kho hiện tại, trạng thái còn sửa được và chưa có PO. Kho nhận phải đang hoạt động và nằm trong phạm vi của người dùng. Response `data: { items: [{ id, manufacturerLot, piecesPerCarton }], total, page, limit }` chỉ gồm lô VERIFIED của sản phẩm đang hoạt động, sắp theo mã lô. Đây là thông tin quy đổi trên danh mục sản phẩm, không chứa lượng tồn hoặc vị trí. FE dùng API này cho danh sách chọn lô, tải khi đã chọn kho và sản phẩm, tải thêm trang khi cuộn.

`GET /api/replenishments/options?mode=CREATE|FILTER` trả `data: { warehouses, products, sources: [] }`. Mỗi sản phẩm đang hoạt động có thêm `units: [{ id, code, name, isCarton, basePerUnit }]`. Danh sách gồm đơn vị gốc đang hoạt động với hệ số `"1"` và phiên bản quy đổi cấp sản phẩm đang hiệu lực mới nhất của mỗi đơn vị đang hoạt động. `basePerUnit` là chuỗi thập phân. Frontend dùng `isCarton` để yêu cầu chọn lô cho đơn vị thùng. Quy đổi cấp lô được tra riêng theo lô đã chọn. Endpoint giữ mảng `sources` rỗng để tương thích với frontend và bỏ truy vấn danh sách chứng từ nguồn.

Khi sửa, thêm `requestId=<id>` để kiểm quyền `replenishment_request:update` và điều kiện sửa RR như tùy chọn lô. Form tạo dùng `mode=CREATE` với quyền tạo. `mode=FILTER` dùng quyền đọc. Đánh giá RR đã lưu cần quyền đọc RR.

### Danh sách chứng từ nguồn

`GET /api/replenishments/options/sources?type=stocktakes` lấy phiên kiểm kê. Dùng `type=saleorders` để lấy đơn bán. Tham số `type` là bắt buộc. `page` mặc định 1, `limit` mặc định 20 và tối đa 100. `productId` lọc chứng từ và dòng trả về theo sản phẩm. `warehouseId` chỉ áp dụng cho kiểm kê và phải thuộc phạm vi người dùng. Kết quả được lọc trước khi phân trang, sắp theo `createdAt` rồi `_id` giảm dần.

- Khi tạo, API yêu cầu `replenishment_request:create`. Khi có `requestId`, API yêu cầu `replenishment_request:update` và kiểm điều kiện sửa giống tùy chọn lô. Cả hai trường hợp cần quyền đọc loại nguồn tương ứng.
- Đơn bán yêu cầu `sales_order:read`. Owner và Accountant xem theo phạm vi rộng, các vai trò khác chỉ thấy đơn do mình lập. API loại đơn `CANCELLED`, `REJECTED` và `COMPLETED`.
- Kiểm kê yêu cầu `stocktake:read`. API chỉ lấy phiên `COMPLETED` hoặc `CLOSED` có mốc `completedAt` trong phạm vi kho. Mỗi sản phẩm xuất hiện một lần trong mỗi phiên, kể cả khi có mặt ở cả dòng kiểm kê và snapshot theo lô.

Response trả `data: { items, total, page, limit }`. Mỗi chứng từ có `id`, `documentNo`, `documentType`, `version` và `items`. Đơn bán trả `documentType: "sales_orders"` với dòng `{ id, productId, label }`. Kiểm kê trả `documentType: "stocktakes"`, thêm `warehouseId` và có dòng `{ productId, label }`. Tìm kiếm hợp lệ không có kết quả trả HTTP 200 với `items: []`. Chứng từ được kiểm tra lại khi đánh giá và lưu RR. Form chưa gọi endpoint này.

## Đánh giá cảnh báo

`POST /api/replenishments/evaluate` đọc một snapshot giao dịch. Body gồm `warehouseId`, `neededOn` (ngày lịch Asia/Saigon dạng YYYY-MM-DD), `lines[]` và `requestId` tùy chọn. Form mới cần `replenishment_request:create`. Đánh giá phiếu đã lưu cần `replenishment_request:read` và quyền truy cập phiếu. Kho nhận phải đang hoạt động và thuộc phạm vi của người dùng.

Mỗi dòng có `productId` và có thể có `id`, `source`, `lotId`, `enteredUnit`, `enteredQty` và `reasonNote`. `enteredUnit` mặc định là đơn vị gốc khi preview chỉ gửi lượng. Nếu gửi lượng và đơn vị, server quy đổi sang đơn vị gốc theo quy đổi hiệu lực hoặc snapshot tương ứng của dòng đã lưu. Lô đã chọn giới hạn tồn khả dụng hiển thị trong kho nhận và các kho khác.

- `MANUAL_OTHER` là nguồn mặc định. `STOCK_THRESHOLD` lưu loại lý do theo ngưỡng sản phẩm/kho.
- `SALES_SHORTAGE` gửi `documentType` là `sales_orders` hoặc `warehouse_issue_requests`, cùng `documentId`, `itemId` và `version`. Server kiểm quyền đọc, dòng nguồn hợp lệ và sản phẩm khớp. WIR giữ tham chiếu WIR và thêm liên kết SO gốc. Khi gửi lại, dùng các trường đầu vào của source, bỏ ba trường SO do server bổ sung.
- `STOCKTAKE_LOW_STOCK` gửi `documentType: "stocktakes"`, `documentId` và `version`. Server kiểm quyền đọc, sản phẩm, kho nhận và kiểm kê đã chốt có thời điểm hoàn tất.

Response `data` là mảng theo thứ tự dòng đầu vào.

| Trường | Giá trị |
| --- | --- |
| `lineNo`, `productId`, `source`, `evaluatedAt` | Số dòng từ 1, sản phẩm, nguồn đã đối chiếu và thời điểm đánh giá ISO 8601. |
| `availableQtyBase` | Tồn GOOD sở hữu STORE ở vị trí STORAGE hoạt động và có thể lấy, theo lô VERIFIED. Đã trừ giữ hàng, công việc chuyển vị trí chưa thực hiện và hàng bị giữ do lỗi. Bỏ qua vị trí đang khóa kiểm kê. |
| `minimumQtyBase`, `targetQtyBase` | Ngưỡng và mục tiêu của sản phẩm tại kho nhận. Cả hai là `null` nếu kho chưa cấu hình. |
| `pendingRequestQtyBase`, `relatedRequests` | Tổng lượng RR đang mở và danh sách `{ id, documentNo, workflowStatus, qtyBase }` theo phiếu. Owner, Accountant và người lập phiếu liên quan xem được chi tiết trong kho có quyền. Tổng lượng vẫn tính cả phiếu bị ẩn chi tiết. |
| `incomingQtyBase`, `incomingPurchaseOrders` | Tổng lượng PO còn phải nhận và danh sách `{ id, documentNo, workflowStatus, expectedOn, outstandingQtyBase }` theo PO cùng kho. `expectedOn` là ISO 8601 hoặc `null`. |
| `otherWarehouseAvailableQtyBase`, `restrictedOtherWarehouseQtyBase`, `otherWarehouseOptions` | Tồn khả dụng tại các kho khác đang hoạt động. Tùy chọn `{ warehouseId, qtyBase }` chỉ hiện cho kho có quyền. Tổng hạn chế là phần ở các kho còn lại. |
| `warnings`, `warningRequired` | Danh sách mã cảnh báo. `warningRequired` là `true` khi có ít nhất một mã. |

Các lượng trong response là chuỗi thập phân theo đơn vị gốc. Hàng ở RECEIVING, STAGING và hàng SUPPLIER giữ hộ nằm ngoài tồn khả dụng. Tồn kho khác dùng để tham khảo.

### Điều kiện phát cảnh báo

- `OPEN_REQUEST` khi có lượng trên RR `DRAFT`, `SUBMITTED` hoặc phần duyệt còn có thể đặt của RR `APPROVED` cùng sản phẩm và kho nhận. PO nháp vẫn tính lượng qua RR. PO `OPEN` hoặc `PARTIAL` trừ lượng đã đặt khỏi lượng duyệt. Khi PO ở trạng thái kết thúc, phần duyệt chưa đặt trên RR đó thôi phát cảnh báo. Loại chính `requestId` đang đánh giá.
- `INCOMING_PO` khi PO `OPEN` hoặc `PARTIAL` cùng sản phẩm và kho nhận còn lượng dương sau khi lấy lượng đặt trừ lượng hủy và lượng nhập `POSTED`. Tính cả PO dự kiến sau `neededOn` hoặc chưa có ngày dự kiến. Loại PO liên kết trực tiếp với `requestId` đang đánh giá.
- `STOCK_SUFFICIENT` khi tồn khả dụng đạt `minimumQtyBase` lớn hơn 0. Với kho chưa cấu hình ngưỡng hoặc ngưỡng tối thiểu bằng 0, so tồn với lượng đề nghị sau quy đổi. Preview thiếu lượng trong trường hợp này sẽ bỏ qua phép so.

### Lưu, gửi duyệt và đặt mua

`POST /api/replenishments` (`SAVE_DRAFT` hoặc `SUBMIT`) và `PUT /api/replenishments/:id` tính lại cảnh báo ở server. Dòng có cảnh báo cần `independentNeedConfirmed: true` và `independentNeedReason` khác rỗng. Người lập nhập lượng dương hợp lệ theo đơn vị và quy cách. `reasonNote` tùy chọn, tối đa 2.000 ký tự sau khi trim. Sửa cùng ID dòng và bỏ `reasonNote` sẽ giữ lý do đã lưu. `triggerReason` ở cấp phiếu là bắt buộc. Dòng đã lưu có chứng từ nguồn (SO/WIR hoặc kiểm kê) không đổi được chứng từ, dòng hoặc bỏ nguồn; muốn thay thì xóa dòng và thêm dòng mới. Dòng lập tay hoặc theo ngưỡng tồn được gắn thêm chứng từ nguồn khi sửa.

`POST /api/replenishments/:id/submit` đánh giá lại. Có thể gửi `evaluations: [{ lineId, independentNeedConfirmed, independentNeedReason }]` để bổ sung xác nhận cho từng dòng. Trường bỏ qua lấy giá trị đã lưu. Snapshot gửi duyệt giữ nguồn, lượng khả dụng, lượng RR mở, lượng PO còn phải nhận, ngưỡng, mục tiêu và giải trình tại lúc gửi.

Thiếu xác nhận khi có cảnh báo trả HTTP 409 `ERR-RR-409-004` kèm `details.requiresReview`, `latestEvaluations` và `invalidLines`. Giao dịch lưu toàn bộ hoặc rollback. Thử lại khi chưa rõ kết quả cần cùng key và payload. Sửa payload sau khi đã xác định kết quả dùng key mới.

`POST /api/replenishments/:id/review` duyệt theo bản đã gửi. Người duyệt có thể gọi `POST /evaluate` để xem cảnh báo hiện tại. Khi duyệt cần người quyết định khác người lập, xét mọi dòng, đúng đơn vị gốc và lượng duyệt trong lượng đề nghị. PO tạo, sửa nháp và phát hành dựa trên RR `APPROVED`, bản và quyết định duyệt còn hiệu lực, sản phẩm/NCC hoạt động và lượng PO trong trần từng dòng.

`POST /api/replenishments/:id/cancel` dùng `expectedVersion`, `operationKey` và `reason`. Người lập rút nháp hoặc phiếu chờ duyệt còn đủ điều kiện. Owner xử lý phần đã duyệt chưa có PO. RR đã liên kết PO đi theo quy trình xử lý PO.

### Tương thích

Các input `evaluationKey` và `quantityAdjustmentReason` của RR, `evaluations` của lệnh review RR và các lệnh PO vẫn nhận theo schema cũ và bị bỏ qua. `POST /evaluate` trả hợp đồng cảnh báo mới. FE hiện vẫn đọc các trường lượng thiếu, token và lượng đề xuất theo hợp đồng trước. Màn hình cần cập nhật để hiển thị đúng từng loại cảnh báo và bỏ giới hạn lượng đề nghị phía FE.

Các snapshot coverage đời cũ có thể còn trên dữ liệu đã lưu. Runtime đã gỡ guard RR theo kho/sản phẩm. Transaction, version và replay của chứng từ vẫn được kiểm, cùng unique index một PO mỗi RR. Khi tạo PO, transaction cập nhật `updatedAt` của RR nguồn để cạnh tranh với lệnh hủy RR cùng lúc. Không có migration dữ liệu. Xem [từ điển dữ liệu](../03_thiet_ke/DB_Current_2026-11-09_57/WMSD_Data_Dictionary.md) và [nhật ký kiểm chứng](../../change_logs.md).
