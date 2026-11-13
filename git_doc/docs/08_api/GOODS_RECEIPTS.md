# GoodsReceipt API

Mọi API có tiền tố `/api`. Một collection `goods_receipts`; mỗi router cố định `documentKind` và chỉ trả phiếu thuộc loại đó. ID loại khác trả `404`; thiếu quyền trả `403`; ngoài kho được giao trả `403`. Quyền được kiểm trước truy vấn và trước lệnh ghi, cùng phiên bản, trạng thái và nguồn nghiệp vụ.

| Loại | List, detail | Quyền đọc | Nơi tạo và quyền ghi |
|---|---|---|---|
| `PURCHASE` | `GET /goods-receipts/purchase`, `GET /goods-receipts/purchase/:id` | `goods_receipt_inspection:read` | Kiểm nhận mua; `goods_receipt_inspection:post/update/reverse`. |
| `CUSTOMER_RETURN` | `GET /goods-receipts/customer-return`, `GET /goods-receipts/customer-return/:id` | `customer_return:read` | `/customer-returns/:id/receipt`; `customer_return:post`. |
| `FAILED_DELIVERY` | `GET /goods-receipts/failed-delivery`, `GET /goods-receipts/failed-delivery/:id` | `failed_delivery:read` | `/failed-deliveries/:id/receipt`; `failed_delivery:inspect/post`. |
| `TRANSFER` | `GET /goods-receipts/transfer`, `GET /goods-receipts/transfer/:id` | `stock_transfer:read` | `/warehouse-transfers/...` nhận tại nguồn; `stock_transfer:receive`. |
| `OTHER` | `GET /goods-receipts/other`, `GET /goods-receipts/other/:id` | `goods_receipt_other:read` | Các lệnh bên dưới. |

List nhận `page` (mặc định 1), `limit` (mặc định 10, tối đa 100), `warehouseId` và `status`. Kết quả `{items,total,page,limit}`. Purchase còn nhận `purchaseOrderId`. BE chỉ truy vấn kho được phân công, Owner xem các kho. DTO trả ObjectId và Decimal128 dưới dạng chuỗi.

## Danh sách gộp và chi tiết

- `GET /goods-receipts` trả `{items,total,page,limit}`. Bộ lọc `kind`, `status`, `warehouseId`, `purchaseOrderId`, `q` (tìm theo số phiếu) và `from`/`to` (ISO 8601 theo `createdAt`) chạy trước phân trang. Mỗi dòng trả `documentKind`, header kèm tên kho/NCC nếu có, `lineCount` và `totalQtyBase` dạng chuỗi thập phân.
- `totalsByBaseUnit` gồm `{unit, quantity}`: tổng `qtyBase` theo từng `baseUnitSnapshot`, với `quantity` là chuỗi thập phân và `unit` là `null` nếu thiếu đơn vị. Mảng rỗng khi phiếu không có dòng; `totalQtyBase` được giữ để tương thích.
- Danh sách gộp áp dụng quyền đọc từng loại. Accountant có phạm vi toàn kho cho phiếu mua. SALES chỉ thấy phiếu khách trả từ yêu cầu do chính mình lập trong phạm vi kho. Nếu lọc loại nằm ngoài quyền đọc, kết quả rỗng.
- `GET /goods-receipts/:id` xác định loại từ collection chung và áp dụng cùng quyền với chi tiết từng loại. Dòng phiếu trả hàng và giao thất bại lấy phẩm cấp, vị trí nhận từ giao dịch ghi tồn. Chi tiết điều chuyển trả `header.transferRequestId` để mở yêu cầu nguồn qua phiếu xuất.

## Kiểm hàng, hàng tạm giữ và lệnh cất

- `GET /goods-inspections` và chi tiết trả `items`, `arrival`, `receipts` và `custodyReceipts`. `GET /purchase-orders/:id/inspection-context` trả `purchaseOrder.items`, hạn mức theo ĐVT gốc, lô xác minh và vị trí kho. Context còn trả `products[]` (`id`, `baseUnit`, `lengthMm`, `widthMm`) và `cartonUnits[]` (mã ĐVT thùng đang hoạt động) để FE quy đổi sang đơn vị gốc và m². Dòng kiểm (tạo/sửa) nhận `enteredUnit?` (mặc định là ĐVT của dòng PO); BE quy đổi `enteredQty` bằng `Conversion` theo lô (thùng) hoặc 1 (đơn vị gốc) và đối chiếu hạn mức theo `qtyBase`. Dòng nháp nhận `receivingLocationId?` cho quyết định `ACCEPT` tại vị trí `RECEIVING` cùng kho. Khi chốt, `destinations` tham chiếu ID dòng kiểm đã lưu. `resultRefs` trả ID phiếu nhập mua và phiếu tạm giữ phát sinh.
- `GET /custody-receipts` dùng `goods_receipt_inspection:read`, nhận `status=DRAFT|POSTED|CLOSED`, `warehouseId`, `purchaseOrderId`, `page`, `limit`. Lọc PO theo hàng đến và biên bản kiểm. Chi tiết trả `sourceInspection`, mã PO, tên kho/NCC và vị trí đã ghi lấy theo giao dịch tồn. `POST /custody-receipts/:id/post` nhận `handedOverBy` tùy chọn (bỏ trống, rỗng hoặc null đều được; từ 13/11/2026 FE không còn gửi vì chưa xác nhận ý nghĩa nghiệp vụ) và yêu cầu vị trí `CUSTODY` hoặc `QUARANTINE` cho mỗi dòng. Hàng đã mở thùng hoặc lẻ gửi quy cách và thể tích đo. Giao diện Hàng tạm giữ kết thúc ở bước đưa vào khu giữ hộ.
- `GET /putaway-tasks` dùng `putaway_task:read`, nhận `status=OPEN|PARTIAL|CONFIRMED|CANCELLED`, `warehouseId`, `receiptId`, `purchaseOrderId`, `page`, `limit` và `q` để tìm theo mã lệnh cất. Mỗi dòng trả phiếu nhập nguồn và tổng cần cất, đã cất, còn lại. Tạo lệnh từ `unplannedQtyBase`, gửi phiên bản phiếu, tồn nguồn và phiên bản lập lệnh do ngữ cảnh cung cấp. Lệnh xác nhận và hủy phần dư dùng phiên bản lệnh. `GET /putaway-tasks/:id` trả thêm `header.warehouseName` và `lotLabelSnapshot` từng dòng (mã lô nhà sản xuất, lấy từ `product_batches.manufacturerLot` khi dòng chưa có); `putaway-context` trả `lotLabelSnapshot` từng dòng. FE hiển thị các trường này thay cho `_id` Mongo.
- `GET /purchase-receiving/queue?stage=AWAITING_PUTAWAY` dùng `goods_receipt_inspection:read`, nhận `warehouseId`, `purchaseOrderId`, `page`, `limit` và `q` để tìm theo mã phiếu nhập. Các stage khác tìm theo mã chứng từ của stage tương ứng.
- `GET /purchase-orders/:id/receiving-summary` trả `documents` gồm `INSPECTION`, `GR_PURCHASE`, `CUSTODY_RECEIPT` và `PUTAWAY`. Giao diện đơn mua liên kết đến từng chứng từ.

Tham số `q` là chuỗi tùy chọn dài 1–100 ký tự sau khi bỏ khoảng trắng hai đầu. BE tìm đoạn mã khớp theo ký tự, không phân biệt hoa thường, và áp dụng cùng các bộ lọc trước khi tính `total` và phân trang. FE bỏ qua tham số khi ô tìm kiếm trống và gửi lại `page=1` khi từ khóa thay đổi.

## Chi tiết phiếu nhập mua

`GET /goods-receipts/purchase/:id` bổ sung `header.supplierName` và `header.warehouseName` theo tên hiện tại của NCC và kho trên phiếu. BE lấy các tên sau khi kiểm quyền và phạm vi đọc phiếu. Màn chi tiết dùng trực tiếp dữ liệu này trong phần thông tin chung.

`header.postedAt` là thời điểm ghi sổ (chuỗi ISO 8601), `header.postedBy` là ID người ghi sổ, và `header.postedByName` là họ tên hiện tại của người đó. BE lấy mốc và người thực hiện từ `GoodsReceipt.postedAt` và `GoodsReceipt.postedBy`, vốn được lưu trong cùng giao dịch ghi tồn. Phiếu đã đảo vẫn hiển thị mốc ghi sổ gốc. Trường tương ứng được bỏ qua nếu phiếu chưa có dữ liệu ghi sổ hoặc không tra được tên. FE hiển thị giờ Việt Nam và dùng `—` cho dữ liệu thiếu. Phiếu cũ dùng được với dữ liệu đã lưu, không cần migration.

Nếu có chứng từ hàng đến liên kết cùng kho và cùng PO của phiếu, `arrival.header` trả `arrivedAt`, `deliveredBy` và `deliveryReference`. FE tách số điện thoại đã lưu trong `deliveredBy` theo định dạng `tên - số điện thoại` của form kiểm nhận, hoặc hiển thị riêng số điện thoại nếu chỉ có số. Tên người giao không kèm số được hiển thị nguyên văn.

Mỗi dòng trả `inspectionResult` từ dòng kiểm nhận nguồn. Nếu phiếu thiếu `lotLabelSnapshot`, API dùng nhãn trên dòng hàng đến liên kết khi ID lô khớp. Chi tiết phiếu hiển thị dòng hàng. Nút Lập lệnh cất hàng mở trang lệnh cất của phiếu.

## Lệnh `OTHER`

`POST /goods-receipts/other` dùng `operationKey`, `warehouseId`, `reason`, `note?`, `originalReceiptId?`, `lines?`. Mỗi dòng gồm `productId`, `lotId`, `enteredUnit`, `enteredQty` chuỗi decimal, `destinationLocationId`, `qualityCode`. Nếu thay phiếu đã Bỏ ghi mà giữ nguyên dòng, bỏ `lines` để sao chép snapshot, ID dòng mới. Kho của phiếu gốc phải bằng kho của phiếu mới và chỉ có một phiếu thay thế đang hiệu lực. Warehouse Staff cần `goods_receipt_other:create`.

`PUT /goods-receipts/other/:id` cho phép sửa phiếu `DRAFT` với `expectedVersion`, `operationKey`, `reason`, `note?`, `originalReceiptId?` và `lines`. Kho lấy từ phiếu đã lưu. Gửi `originalReceiptId: null` để bỏ tham chiếu phiếu gốc. Lệnh dựng lại dòng qua cùng quy tắc tạo mới và trả `id`, `version`, `workflowStatus`, `resultRefs`.

Trên giao diện, đính kèm minh chứng nháp qua `POST /return-workflows/:id/evidence`. Có thể tải/gắn chứng cứ qua `POST /purchase-documents/:id/evidence/uploads` và `/purchase-documents/:id/evidence/attach` (API chứng cứ dùng chung vẫn giữ). `POST /goods-receipts/other/:id/submit` dùng `expectedVersion`, `operationKey` và yêu cầu ít nhất một chứng cứ đã gắn. Nếu nội dung ghi tồn bằng phiếu gốc `OTHER` đã duyệt và Bỏ ghi, phiếu thay thế sang `APPROVED` theo duyệt trước; nếu khác, sang `PENDING_APPROVAL`.

`POST /goods-receipts/other/:id/approve` dùng `expectedVersion`, `operationKey`, `decision: APPROVE|REJECT`, `reason`; chỉ Owner khác người lập, với `goods_receipt_other:approve`. Duyệt lưu `ApprovalHistory` theo đúng phiên bản và hash nội dung ghi tồn. `POST /goods-receipts/other/:id/post` chỉ Warehouse Staff với `goods_receipt_other:post`; dùng `expectedVersion`, `operationKey`, `packaging?`. Hệ thống kiểm lại lô, quy đổi, kho/vị trí, sức chứa, khóa kiểm kê, chứng cứ và hash đã duyệt. Tồn, quy cách, chứng từ và StockTransaction được ghi nguyên tử. Gửi lại cùng key/payload nhận kết quả replay; phiên bản khác bị từ chối.

`POST /goods-receipts/other/:id/cancel` hủy nháp với `expectedVersion`, `operationKey`, `reason`. `GET /goods-receipts/other/:id/reversal-preflight` trả `{eligible,reason?,receiptVersion}`. `POST /goods-receipts/other/:id/reverse` dùng `expectedVersion`, `operationKey`, `reason`, `evidenceIds` và quyền `goods_receipt_other:reverse`. Warehouse Staff trực tiếp Bỏ ghi bằng một StockTransaction có `reversedTransactionId`, phiếu gốc ở `REVERSED`. Số dư đã dùng, đặt giữ, lệnh, kiểm kê và chứng từ phụ thuộc sẽ chặn cùng lý do; giải quyết chứng từ đó rồi gọi lại preflight.

Luồng mua cũ chuyển sang `/goods-receipts/purchase/:id/post`, `/:id/reverse`, `/:id/reversal-preflight`, `/:id/cancel`, `/:id/destinations`, `/:id/putaway-context`, `/:id/putaway-tasks`. `/purchase-receipts` và lệnh `/stock-reversals/:id/review|post` trả `404`. `CustodyReceipt` và API kiểm nhận, putaway, chứng cứ vẫn hoạt động theo nghiệp vụ nguồn. Ba loại nhận từ khách trả/giao thất bại/điều chuyển chưa có API đảo độc lập.
