# Từ điển GoodsReceipt hiện hành — 09/11/2026

Registry hiện hành có 57 collection. Các collection ngoài phiếu nhập giữ định nghĩa ở [từ điển trước lần gộp](../DB_Current_2026-11-06_60/WMSD_Data_Dictionary.md). Bốn collection `purchase_receipts`, `customer_return_receipts`, `failed_delivery_receipts`, `transfer_receipts` được thay bằng một collection `goods_receipts`. Bộ seed dựng sạch, không di chuyển bản ghi DB cũ.

[ERD 57 collection](WMSD_ERD_Current.drawio) được sinh từ registry hiện hành; GoodsReceipt nằm trong nhóm nhận hàng và liên kết các luồng nguồn qua `sources`.

## `goods_receipts` / `GoodsReceipt`

Mỗi bản ghi là một phiếu nhập có `_id` ObjectId bất biến, `documentNo` string tối đa 50 ký tự, `documentKind` thuộc `PURCHASE | CUSTOMER_RETURN | FAILED_DELIVERY | TRANSFER | OTHER`, `workflowStatus`, `version` nguyên dương, `createdBy`, `occurredAt`, `note`, `externalReferenceIds`, `sources[]`, `updatedBy`, `evidenceIds[]`, `cancelledBy`, `cancelledAt`, `cancelReason`, `stockTransactionId`, `postedBy`, `postedAt`, và `createdAt/updatedAt`. `custodyDecisionId` chỉ hợp lệ cho `PURCHASE`. Mã phiếu duy nhất theo `{documentKind, documentNo}`; có index theo trạng thái, nguồn, dòng, kho và ngày tạo.

`items[]` giữ `_id`, `lineNo`, `lineKind`, `productId`, `lotId`, `enteredUnit`, `baseUnitSnapshot`, `baseUnitsPerUnit` Decimal128, `packagingSnapshot` với `packageUnit`, `baseUnitsPerPackage` Decimal128 và ba chiều ngoài Decimal128, `enteredQty`/`qtyBase` Decimal128, `productNameSnapshot`, `sources[]`, `createdAt/updatedAt`, `note`, `evidenceIds`. Điều kiện `enteredQty × baseUnitsPerUnit = qtyBase` được kiểm chính xác. Dòng `PURCHASE` giữ thêm `purchaseOrderItemId`, `arrivalItemId`, `inspectionId`, `inspectionResultId`, `destinationLocationId`, `custodyReceiptRef`, `custodyBalanceId`, `supplierScheduleId`; dòng `CUSTOMER_RETURN` dùng `custodyBalanceId`, `inspectionId`; `OTHER` dùng `destinationLocationId`, `qualityCode`. `inspectionId` giữ ObjectId gốc vì bản kiểm hàng trả có thể là thực thể nhúng, không dùng populate tới model độc lập.

Các `items.details` theo `lineKind` giữ toàn bộ 19 discriminator cũ. `FAILED_DELIVERY_RECEIPT` giữ `failedDeliveryLineId`, `salesIssueLineId`, `inspectionLineId`, `claimId`; `TRANSFER_RECEIPT` giữ `dispatchLineId`, `qualityCode`, `destinationBalanceId`, `receivingLocationId`. `FAILED_DELIVERY` còn giữ `demandReopenings[]`, `commitmentTransfers[]` với ID nhúng, trường và index ID duy nhất riêng từng mảng.

| `documentKind` | `header` bắt buộc | Nguồn tạo và ghi tồn |
|---|---|---|
| `PURCHASE` | `warehouseId`, `receiptKind=PURCHASE`, `purchaseOrderId`, `arrivalId`, `supplierId`, `receivedAt` | Kiểm nhận tạo nháp; Warehouse ghi sổ, có luồng đảo mua. |
| `CUSTOMER_RETURN` | `warehouseId`, `receiptKind=CUSTOMER_RETURN`, `returnId`, `receivedAt`, `operationId` | Nhận khách trả ghi tồn trong giao dịch nguồn, kiểm hạn mức và quyền sở hữu. |
| `FAILED_DELIVERY` | `warehouseId`, `receiptKind=FAILED_DELIVERY`, `failedDeliveryId`, `receivedAt`, `receivedBy` | Nhận hàng thực quay về và mở nhu cầu còn lại trong giao dịch nguồn. |
| `TRANSFER` | `dispatchId`, `receivedBy`, `receivedAt`, `warehouseId`, `putawayStatus`, `damageReportIds` | Nhận từ hàng đang chuyển; không tạo tồn từ hư không. |
| `OTHER` | `warehouseId`, `reason`, `originalReceiptId` nếu thay thế | Warehouse lập và gửi duyệt, Owner duyệt phiên bản, Warehouse ghi sổ hoặc Bỏ ghi. |

Trường nguồn tùy loại được Mongoose header discriminator và service kiểm. Các đường link `sources.subjectCollection`, `Attachment.ownerDocumentType`, `StockTransaction.sourceType`, `ApprovalHistory.subjectType` trỏ tới `goods_receipts`. `CustodyReceipt` vẫn là collection riêng. Các trường `approvedStockHash`, `approvedVersion`, `approvalDecisionId` chỉ dùng cho `OTHER` để chặn ghi tồn khi nội dung đã duyệt thay đổi.

## Sửa sai và dữ liệu mẫu

`OTHER` nháp có thể hủy. Phiếu đã ghi được giữ tại `REVERSED` sau một bút toán ngược; nếu số dư, đặt giữ, lệnh, kiểm kê hoặc chứng từ phụ thuộc đã thay đổi, Bỏ ghi trả lý do chặn. Phiếu thay thế cùng nội dung ghi tồn được ghi lại theo duyệt trước; đổi sản phẩm, lô, kho, vị trí, số lượng, chất lượng hoặc quy cách cần Owner duyệt lại. Mua hàng tiếp tục đảo nhận và trả NCC theo điều kiện hiện hành. Ba loại nhận từ luồng khách trả/giao thất bại/điều chuyển chưa có lệnh đảo độc lập.

Seed lịch sử chỉ là đầu vào dựng bộ dữ liệu mẫu. Sau bước dựng, bốn mảng phiếu được chuyển sang `goods_receipts`, giữ nguyên ID, dòng, chứng cứ, số Decimal128, các mảng lịch sử và liên kết. Chạy `npm run docs:check`, `npm test` và kiểm thử HTTP có MongoDB tạm trước khi reset DB test đích; người dùng tự chạy seed sau.
