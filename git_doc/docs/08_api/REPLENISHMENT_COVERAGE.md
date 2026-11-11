---
id: DOC-API-RR-COVERAGE-001
title: Chống trùng yêu cầu bổ sung theo nguồn
version: 1.0.0
phase: Implementation
domain: Replenishment
tags: [replenishment, concurrency, coverage]
depends_on: [DOC-API-NATIVE-RUNTIME]
author: Codex
last_updated: 2026-11-10
---

# Yêu cầu bổ sung theo nguồn

Quyết định triển khai: người dùng yêu cầu thực hiện toàn bộ kế hoạch chống trùng ngày 07/11/2026. G05/H01 vẫn là căn cứ nghiệp vụ; lần này bổ sung xử lý RR thủ công tương tự bằng cảnh báo, xác nhận nhu cầu độc lập và giải trình. Không thực hiện xác minh nguồn ngoài D07/D08.

## Giao thức API

`GET /api/replenishments/options/lots?productId=<id>&warehouseId=<id>&page=1&limit=20` lấy quy cách thùng cho form RR. Mặc định page 1, limit 20, tối đa 100. Khi tạo, quyền là `replenishment_request:create`. Thêm `requestId=<id>` khi sửa, dùng `replenishment_request:update` và kiểm người lập, kho hiện tại, trạng thái còn sửa được và chưa có PO. Kho nhận phải đang hoạt động và nằm trong phạm vi của người dùng. Response `data: { items: [{ id, manufacturerLot, piecesPerCarton }], total, page, limit }` chỉ gồm lô VERIFIED của sản phẩm đang hoạt động, sắp theo mã lô. Đây là thông tin quy đổi trên danh mục sản phẩm, không chứa lượng tồn hoặc vị trí. FE dùng API này cho danh sách chọn lô, tải khi đã chọn kho và sản phẩm, tải thêm trang khi cuộn.

`GET /api/replenishments/options?mode=CREATE|FILTER` trả `data: { warehouses, products, sources: [] }`. Mỗi sản phẩm đang hoạt động có thêm `units: [{ id, code, name, basePerUnit }]`. Danh sách gồm đơn vị gốc đang hoạt động với hệ số `"1"` và phiên bản quy đổi cấp sản phẩm đang hiệu lực mới nhất của mỗi đơn vị đang hoạt động. `basePerUnit` là chuỗi thập phân. Quy đổi cấp lô được tra riêng theo lô đã chọn. Endpoint giữ mảng `sources` rỗng để tương thích với frontend và bỏ truy vấn danh sách chứng từ nguồn.

Khi sửa, thêm `requestId=<id>` để kiểm quyền `replenishment_request:update` và điều kiện sửa RR như tùy chọn lô. Form tạo dùng `mode=CREATE` với quyền tạo. `mode=FILTER` dùng quyền đọc. Đánh giá RR đã lưu cần quyền đọc RR.

### Danh sách chứng từ nguồn

`GET /api/replenishments/options/sources?type=stocktakes` lấy phiên kiểm kê. Dùng `type=saleorders` để lấy đơn bán. Tham số `type` là bắt buộc. `page` mặc định 1, `limit` mặc định 20 và tối đa 100. `productId` lọc chứng từ và dòng trả về theo sản phẩm. `warehouseId` chỉ áp dụng cho kiểm kê và phải thuộc phạm vi người dùng. Kết quả được lọc trước khi phân trang, sắp theo `createdAt` rồi `_id` giảm dần.

- Khi tạo, API yêu cầu `replenishment_request:create`. Khi có `requestId`, API yêu cầu `replenishment_request:update` và kiểm điều kiện sửa giống tùy chọn lô. Cả hai trường hợp cần quyền đọc loại nguồn tương ứng.
- Đơn bán yêu cầu `sales_order:read`. Owner và Accountant xem theo phạm vi rộng, các vai trò khác chỉ thấy đơn do mình lập. API loại đơn `CANCELLED`, `REJECTED` và `COMPLETED`.
- Kiểm kê yêu cầu `stocktake:read`. API chỉ lấy phiên `COMPLETED` hoặc `CLOSED` có mốc `completedAt` trong phạm vi kho. Mỗi sản phẩm xuất hiện một lần trong mỗi phiên, kể cả khi có mặt ở cả dòng kiểm kê và snapshot theo lô.

Response trả `data: { items, total, page, limit }`. Mỗi chứng từ có `id`, `documentNo`, `documentType`, `version` và `items`. Đơn bán trả `documentType: "sales_orders"` với dòng `{ id, productId, label }`. Kiểm kê trả `documentType: "stocktakes"`, thêm `warehouseId` và có dòng `{ productId, label }`. Tìm kiếm hợp lệ không có kết quả trả HTTP 200 với `items: []`. Chứng từ được kiểm tra lại khi đánh giá và lưu RR. Form chưa gọi endpoint này.

`POST /api/replenishments/evaluate` chỉ đọc trong snapshot transaction. Body gồm `warehouseId`, `neededOn` (YYYY-MM-DD), `lines[]` và `requestId` nếu đánh giá phiếu đang sửa. Dòng có `productId` và `source`. Form chưa lưu không tạo RR/khóa/cam kết.

Nguồn `MANUAL_OTHER` không có chứng từ giả. `SALES_SHORTAGE` dùng `documentType: sales_orders | warehouse_issue_requests`, `documentId`, `itemId`, `version`; WIR chuẩn hóa về SO/dòng gốc. `STOCK_THRESHOLD` dùng sản phẩm/kho hiện hành. `STOCKTAKE_LOW_STOCK` dùng `documentType: stocktakes`, `documentId`, `version`, tham chiếu kiểm kê đã chốt và dùng chung định danh dự trữ kho/sản phẩm. Nguồn không xác định được không được coi là lượng 0. Response source có thêm định danh SO chuẩn hóa do server ghi; khi gửi lại chỉ gửi trường source input trong hợp đồng, không gửi các trường suy ra. Ngày cần luôn là ngày lịch Asia/Saigon, không cắt trực tiếp ngày UTC để nhập form.

Response `data` là mảng đánh giá theo dòng: `lineNo`, `canonicalKey`, `source`, `evaluationKey`, `evaluatedAt`, các lượng `availableQtyBase`, `reservedForDemandQtyBase`, `remainingDemandQtyBase`, `incomingCoverageQtyBase`, `pendingRequestCoverageQtyBase`, `suggestedQtyBase`, ngưỡng minimum/target và `relatedRequests` theo quyền. Mọi lượng là decimal string.

Create/update dùng `enteredUnit`, `enteredQty`, `lotId` khi chọn đơn vị thùng; không nhận `conversionId`. Dòng mang `source`, `evaluationKey`, `quantityAdjustmentReason`; nhu cầu thủ công đã được cảnh báo cần `independentNeedConfirmed: true` và `independentNeedReason`. Server tự tính quy đổi/snapshot, không nhận số liệu tồn từ browser.

`POST /api/replenishments` với `SAVE_DRAFT` hoặc `SUBMIT` và `PUT /api/replenishments/:id` chấp nhận dòng thiếu `reasonNote`. Nếu gửi, giá trị phải là chuỗi từ 1 đến 2.000 ký tự sau khi cắt khoảng trắng. Khi sửa dòng có cùng ID, bỏ trường này sẽ giữ lý do đã lưu. Snapshot gửi duyệt ghi lý do nếu có. `triggerReason` cấp phiếu vẫn bắt buộc. `reasonNote` độc lập với `independentNeedReason` khi có cảnh báo trùng và `quantityAdjustmentReason` khi điều chỉnh lượng đề xuất theo quy tắc coverage. Form FE hiện vẫn yêu cầu lý do từng dòng.

Submit/review và PO create/update/confirm hỗ trợ `evaluations: [{lineId,evaluationKey}]` để xác nhận lại đánh giá. RR lifecycle còn hỗ trợ giải trình độc lập/điều chỉnh lượng trong từng xác nhận. Thiếu token hiện hành, phần thiếu không đủ hoặc thiếu xác nhận thủ công trả HTTP 409 `ERR-RR-409-004`, `details.requiresReview`, `latestEvaluations`, `invalidLines` khi có. Không lưu một phần; frontend giữ input để người dùng xem và gửi lại. Thay nội dung đã gửi cần key mới sau khi đã xác định kết quả lần trước; retry kết quả chưa rõ giữ nguyên key/payload.

`POST /api/replenishments/:id/cancel` dùng `expectedVersion`, `operationKey`, `reason`. Người lập rút nháp/chờ duyệt còn đủ điều kiện; Owner xử lý phần đã duyệt chưa có PO. RR có PO không được bỏ qua quy trình PO. Không có API mở khóa thủ công.

## Coverage và ghi đồng thời

RR DRAFT đã lưu, SUBMITTED và phần APPROVED chưa chuyển nguồn cung chiếm lượng. REVISION_REQUIRED/REJECTED/CANCELLED không chiếm lượng. Loại chính RR đang đánh giá, cộng gộp các dòng cùng nguồn. SO/WIR cùng nguồn và RR khác kho dùng chung trần nghĩa vụ SO. Ngưỡng và ngữ cảnh kiểm kê cùng kho/sản phẩm là một nhu cầu dự trữ. Phân chia pool tồn chưa giữ theo SO: ngày cần, thời điểm tạo, ID SO và ID dòng; phần còn lại mới xét dự trữ. Đây là phép đánh giá, không tự tạo reservation. Tồn RECEIVING/STAGING đủ quyền sở hữu/chất lượng được tính là phần bù đang chờ xử lý, tách khỏi available có thể lấy ngay. Giữ hàng bị chặn lỗi/khóa kiểm kê không được coi là phần đáp ứng khả dụng.

RR → PO → tồn/giữ hàng phải chuyển phần đáp ứng một lần. PO nháp tiếp tục được đại diện bởi RR; nguồn PO/TR có hiệu lực xét sản phẩm/kho, hạn và phần chưa dành nơi khác. Hàng giữ hộ không phải tồn sở hữu. Hàng khả dụng ở kho khác trả trong `otherWarehouseAvailableQtyBase`, `otherWarehouseOptions` theo quyền và tổng hạn chế; `supplyStatus: OPTIONS_AVAILABLE` yêu cầu người dùng xem xét phương án, không tự tính là coverage cho tới khi có TR/phân bổ thực. Stocktake chỉ đọc nguồn chốt đủ dữ liệu, không bổ sung toàn bộ API vận hành kiểm kê trong thay đổi này.

Từ 11/11/2026, PO `OPEN`/`PARTIAL` dùng `header.expectedOn` để xét đúng hạn cho lượng đặt trừ lượng nhập `POSTED` và lượng đã hủy. Nếu ngày dự kiến sau ngày cần, phần còn thiếu không đóng góp vào `incomingCoverageQtyBase`. Nếu nguồn cung liên quan còn lượng chưa nhận mà thiếu ngày dự kiến, đánh giá trả `ERR-RR-409-004` để đối chiếu. Lệnh đổi ngày tăng phiên bản PO và dùng guard cùng giao dịch. Xem [hợp đồng PO](NATIVE_MODEL_RUNTIME.md#mua-và-nhập).

Helper ghi chứng từ thu thập sản phẩm từ input, chứng từ đích, dòng nhúng, tồn/lô và chuỗi nguồn trước khi ghi. Khóa SO theo ID tăng `replenishmentPlanningVersion`, tiếp theo khóa cặp kho/sản phẩm theo thứ tự cố định, rồi mới tới khóa vị trí. Hiện khóa tất cả kho cho các sản phẩm bị ảnh hưởng vì nguồn ở kho khác có thể thay đổi lựa chọn đáp ứng; đánh đổi này tăng tranh chấp theo sản phẩm nhưng không khóa mọi sản phẩm/toàn hệ thống. Chuỗi nguồn quá sâu bị từ chối, không tiếp tục với tập khóa thiếu.

Tăng phiên bản guard, ghi RR/PO/tồn, OperationRecord, audit và outbox cùng transaction. `lastOperationId` chỉ cập nhật sau khi OperationRecord tồn tại. Thử lại transaction xóa tập guard trong session, đọc lại snapshot; xử lý duplicate-key khi hai bên tạo guard lần đầu bằng transaction mới, tối đa 3 lần retry ngoài lần đầu. Replay thành công không tăng guard.

Đổi ngưỡng, trạng thái/sửa sản phẩm và lô tham gia cùng giao thức guard; thay đổi catalogue tiếp tục dùng `expectedUpdatedAt`. OperationRecord catalogue dùng versionBefore=0/versionAfter=1 làm receipt thao tác, không thêm trường version giả vào catalogue.

## Dữ liệu và triển khai

Không tăng số collection. Thêm nested schema `replenishment-source.schema.js`. Dòng RR giữ `details.source`, `canonicalSourceKey`, token/thời điểm/snapshot và xác nhận nhu cầu độc lập. Submission giữ snapshot `evaluation` riêng của từng lần gửi. SO thêm số nguyên `replenishmentPlanningVersion` mặc định 0, độc lập với phiên bản nội dung. SO cũ thiếu trường sẽ được `$inc` khởi tạo khi cần.

Chạy `node scripts/audit-replenishment-coverage.mjs --uri mongodb://127.0.0.1:27017/<local_database>?replicaSet=rs0` trước bật tính năng. Script luôn read-only; kiểm unique index, RR active thiếu canonical source và nhóm cùng nguồn cần đối chiếu. Exit 2 nếu thiếu index/nguồn chưa giải được. Không tự gộp/xóa/từ chối phiếu hoặc chuyển RR cũ sang nguồn khác. Nhu cầu thủ công cũ giữ nguyên và áp dụng cảnh báo khi thao tác tiếp. Chuẩn hóa nguồn cũ chỉ sau khi xác minh đủ liên kết.

Bật BE/FE cùng đợt sau kiểm local; không có rollout Atlas tự động. Theo dõi mã 409 coverage, retry transaction, lỗi nguồn không xác định và độ trễ theo sản phẩm. Không ghi payload/giá/chứng từ riêng tư vào log tổng hợp. Instrumentation có thể subscribe Node `diagnostics_channel` tên `wmsd.replenishment`: `coverage_conflict` gồm operationCode/durationMs, `transaction_retry` gồm reason/attempt; không chứa ID phiếu, giá, payload hay danh tính.

## Kiểm chứng

Kiểm transaction local bằng `RUN_NATIVE_API_TESTS=1` với các file `test/replenishment-*.integration.test.js` và native API tests. Mỗi suite tạo database riêng và xóa đúng database test sau chạy. Đã kiểm 24 ca tích hợp local ở bốn file native/RR (8 evaluator, 6 RR API, 1 guard+audit, 9 native flow), gồm ledger tái mở/đảo, chặn lỗi/freeze, PO lấy một phần và policy stale. Frontend build/typecheck và các test tập trung qua; kết quả chi tiết/giới hạn trong changelog. Full suite chưa xanh: hai file BE import module cũ không còn trong checkout và các test/fixture FE ngoài nghiệm thu tập trung còn lỗi. Browser local dừng ở tài khoản demo đăng nhập thất bại; không xác nhận visual QA form bằng trình duyệt.
