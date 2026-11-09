# Quy đổi đơn vị theo sản phẩm và lô

Quyết định ngày 09/11/2026 bổ sung model `Conversion`. Cấu hình cấp sản phẩm dùng cho số lượng dự kiến khi chưa chọn lô. Nếu đã chọn lô, dùng hệ số có hiệu lực của lô trước. Đơn vị thường có thể dùng cấu hình cấp sản phẩm nếu lô chưa có cấu hình. Đơn vị thùng yêu cầu cấu hình của lô khi đã chọn lô.

`GET /api/products/:id` cũng trả `currentConversions` theo một phạm vi đơn nhất. Không có `batchId` hoặc có `batchId=null` sẽ trả hệ số cấp sản phẩm với `productBatchId: null`. `?batchId=<id>` trả hệ số chỉ của đúng lô. API xác nhận lô thuộc sản phẩm và đã VERIFIED. Batch ID sai định dạng hoặc lô chưa VERIFIED trả 400; lô không tồn tại hoặc thuộc sản phẩm khác trả 404. Mỗi UOM đang hoạt động có tối đa một hệ số, chọn bản có `validFrom` mới nhất nhưng không ở tương lai. Không kế thừa hệ số sản phẩm sang kết quả chi tiết lô. Nếu phạm vi không có hệ số hiện hành, trả mảng rỗng.

- `GET /api/products/:id/conversions` cần `product:read`. Query hỗ trợ `page`, `limit`, `uomId`, `productBatchId`. Dùng `productBatchId=null` để lọc riêng cấp sản phẩm. `isCurrent` xác định phiên bản hiệu lực mới nhất trong từng bộ khóa.
- `POST /api/products/:id/conversions` cần `product:update`. Body gồm `uomId`, `basePerUnit` dạng chuỗi decimal, `validFrom` dạng ISO có múi giờ hoặc ngày YYYY-MM-DD theo UTC, `verificationReference` và `productBatchId` tùy chọn. Tạo phiên bản mới phải có mốc lớn hơn mốc mới nhất, kể cả phiên bản tương lai. Xung đột trả 409. `POST /api/products` tiếp tục nhận mảng `conversions` cấp sản phẩm.
- Bản ghi trả `id` của Conversion, `productId`, `productBatchId`, `version`, `uom`, `basePerUnit`, `validFrom`, `verificationReference`, `createdBy`, `isCurrent`. `productVersion` giữ giá trị tương thích 1.
- UOM của cấu hình mới phải đang hoạt động. Quy đổi thùng của lô đã xác minh phải khớp `piecesPerCarton` và có hiệu lực ngay hoặc trong quá khứ. Khi tạo, xác minh hoặc sửa số viên/thùng của lô chưa được sử dụng, BE đồng bộ hệ số thùng cho các UOM đã đánh dấu `isCarton`.

Dòng chứng từ giữ `lotId`, `enteredQty`, `enteredUnit`, `baseUnitSnapshot`, `baseUnitsPerUnit`, `qtyBase` và snapshot đóng gói hiện có. Sửa số lượng với cùng sản phẩm, UOM và lô tiếp tục dùng snapshot. PO giữ hệ số RR đã duyệt. Kiểm nhận tạo dòng mới theo hệ số lô thực nhận, giữ snapshot khi sửa cùng lô và truyền xuống phiếu nhập. Kiểm nhận có thể tiếp tục với UOM đã ngừng hoạt động nếu PO đã sử dụng UOM đó và có hệ số hiệu lực cho quy đổi thực nhận. Giới hạn PO và phần còn lại tính theo `qtyBase`.

Xem [quy trình backfill](../09_phat_trien/CONVERSION_BACKFILL.md) trước khi triển khai BE trên cơ sở dữ liệu hiện có.
