# GoodsReceipt API — BE 09/11/2026

Mọi API có tiền tố `/api`. Một collection `goods_receipts`; mỗi router cố định `documentKind` và chỉ trả phiếu thuộc loại đó. ID loại khác trả `404`; thiếu quyền trả `403`; ngoài kho được giao trả `403`. Quyền được kiểm trước truy vấn và trước lệnh ghi, cùng phiên bản, trạng thái và nguồn nghiệp vụ.

| Loại | List, detail | Quyền đọc | Nơi tạo và quyền ghi |
|---|---|---|---|
| `PURCHASE` | `GET /goods-receipts/purchase`, `GET /goods-receipts/purchase/:id` | `goods_receipt_inspection:read` | Kiểm nhận mua; `goods_receipt_inspection:post/update/reverse`. |
| `CUSTOMER_RETURN` | `GET /goods-receipts/customer-return`, `GET /goods-receipts/customer-return/:id` | `customer_return:read` | `/customer-returns/:id/receipt`; `customer_return:post`. |
| `FAILED_DELIVERY` | `GET /goods-receipts/failed-delivery`, `GET /goods-receipts/failed-delivery/:id` | `failed_delivery:read` | `/failed-deliveries/:id/receipt`; `failed_delivery:inspect/post`. |
| `TRANSFER` | `GET /goods-receipts/transfer`, `GET /goods-receipts/transfer/:id` | `stock_transfer:read` | `/warehouse-transfers/...` nhận tại nguồn; `stock_transfer:receive`. |
| `OTHER` | `GET /goods-receipts/other`, `GET /goods-receipts/other/:id` | `goods_receipt_other:read` | Các lệnh bên dưới. |

List nhận `page` (mặc định 1), `limit` (mặc định 10, tối đa 100), `warehouseId` và `status`. Kết quả `{items,total,page,limit}`. Purchase còn nhận `purchaseOrderId`. BE chỉ truy vấn kho được phân công, Owner xem các kho. DTO trả ObjectId và Decimal128 dưới dạng chuỗi.

## Lệnh `OTHER`

`POST /goods-receipts/other` dùng `operationKey`, `warehouseId`, `reason`, `note?`, `originalReceiptId?`, `lines?`. Mỗi dòng gồm `productId`, `lotId`, `enteredUnit`, `enteredQty` chuỗi decimal, `destinationLocationId`, `qualityCode`. Nếu thay phiếu đã Bỏ ghi mà giữ nguyên dòng, bỏ `lines` để sao chép snapshot, ID dòng mới. Kho của phiếu gốc phải bằng kho của phiếu mới và chỉ có một phiếu thay thế đang hiệu lực. Warehouse Staff cần `goods_receipt_other:create`.

Sau khi tạo nháp, tải/gắn chứng cứ qua `POST /purchase-documents/:id/evidence/uploads` và `/purchase-documents/:id/evidence/attach` (API chứng cứ dùng chung vẫn giữ). `POST /goods-receipts/other/:id/submit` dùng `expectedVersion`, `operationKey` và yêu cầu ít nhất một chứng cứ đã gắn. Nếu nội dung ghi tồn bằng phiếu gốc `OTHER` đã duyệt và Bỏ ghi, phiếu thay thế sang `APPROVED` theo duyệt trước; nếu khác, sang `PENDING_APPROVAL`.

`POST /goods-receipts/other/:id/approve` dùng `expectedVersion`, `operationKey`, `decision: APPROVE|REJECT`, `reason`; chỉ Owner khác người lập, với `goods_receipt_other:approve`. Duyệt lưu `ApprovalHistory` theo đúng phiên bản và hash nội dung ghi tồn. `POST /goods-receipts/other/:id/post` chỉ Warehouse Staff với `goods_receipt_other:post`; dùng `expectedVersion`, `operationKey`, `packaging?`. Hệ thống kiểm lại lô, quy đổi, kho/vị trí, sức chứa, khóa kiểm kê, chứng cứ và hash đã duyệt. Tồn, quy cách, chứng từ và StockTransaction được ghi nguyên tử. Gửi lại cùng key/payload nhận kết quả replay; phiên bản khác bị từ chối.

`POST /goods-receipts/other/:id/cancel` hủy nháp với `expectedVersion`, `operationKey`, `reason`. `GET /goods-receipts/other/:id/reversal-preflight` trả `{eligible,reason?,receiptVersion}`. `POST /goods-receipts/other/:id/reverse` dùng `expectedVersion`, `operationKey`, `reason`, `evidenceIds` và quyền `goods_receipt_other:reverse`. Warehouse Staff trực tiếp Bỏ ghi bằng một StockTransaction có `reversedTransactionId`, phiếu gốc ở `REVERSED`. Số dư đã dùng, đặt giữ, lệnh, kiểm kê và chứng từ phụ thuộc sẽ chặn cùng lý do; giải quyết chứng từ đó rồi gọi lại preflight.

Luồng mua cũ chuyển sang `/goods-receipts/purchase/:id/post`, `/:id/reverse`, `/:id/reversal-preflight`, `/:id/cancel`, `/:id/destinations`, `/:id/putaway-context`, `/:id/putaway-tasks`. `/purchase-receipts` và lệnh `/stock-reversals/:id/review|post` trả `404`. `CustodyReceipt` và API kiểm nhận, putaway, chứng cứ vẫn hoạt động theo nghiệp vụ nguồn. Ba loại nhận từ khách trả/giao thất bại/điều chuyển chưa có API đảo độc lập.
