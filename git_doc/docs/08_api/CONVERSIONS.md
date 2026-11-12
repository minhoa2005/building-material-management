# Quy đổi đơn vị theo sản phẩm và lô

Quyết định ngày 09/11/2026 bổ sung model `Conversion`. Cấu hình cấp sản phẩm dùng cho số lượng dự kiến khi chưa chọn lô. Nếu đã chọn lô, dùng hệ số có hiệu lực của lô trước. Đơn vị thường có thể dùng cấu hình cấp sản phẩm nếu lô chưa có cấu hình. Đơn vị thùng yêu cầu cấu hình của lô khi đã chọn lô.

`GET /api/products/:id` trả `currentConversions` theo một phạm vi đơn nhất. Endpoint không nhận query parameters. Gửi `batchId` trả 400.

- API chọn lô `VERIFIED` được tạo gần nhất theo `createdAt` giảm dần và dùng `_id` giảm dần khi trùng thời điểm. Nếu sản phẩm chưa có lô đã xác minh hoặc lô được chọn chưa có hệ số hiệu lực cho UOM đang hoạt động, API trả cấu hình mặc định cấp sản phẩm với `productBatchId: null`.
- Trong phạm vi được trả về, mỗi UOM đang hoạt động có tối đa một hệ số theo `validFrom` mới nhất đã đến hiệu lực. Mỗi kết quả thuộc cùng một phạm vi. Nếu phạm vi cuối cùng chưa có hệ số hiện hành, API trả mảng rỗng.

Trang chi tiết sản phẩm mặc định mở tab **Quy cách đóng gói & Quy đổi**, hiển thị hệ số hiện hành từ `currentConversions`. Tab **Lịch sử quy đổi** đọc danh sách phiên bản từ endpoint riêng bên dưới.

- `GET /api/products/:id/conversions` cần `product:read`. Query hỗ trợ `page`, `limit`, `uomId`, `productBatchId`. Dùng `productBatchId=null` để lọc riêng cấp sản phẩm. `isCurrent` xác định phiên bản hiệu lực mới nhất trong từng bộ khóa.
- `POST /api/products/:id/conversions` cần `product:update`. Body yêu cầu `uomId`, `basePerUnit` dạng chuỗi decimal và `validFrom` dạng ISO có múi giờ hoặc ngày YYYY-MM-DD theo UTC. `verificationReference` và `productBatchId` là tùy chọn. Tạo phiên bản mới phải có mốc lớn hơn mốc mới nhất, kể cả phiên bản tương lai. Xung đột trả 409. `POST /api/products` tiếp tục nhận mảng `conversions` cấp sản phẩm.
- Cả hai API chấp nhận bỏ qua `verificationReference`, gửi `null` hoặc gửi chuỗi trắng. Backend lưu nội dung đã cắt khoảng trắng đầu/cuối nếu có, tối đa 500 ký tự. Khi để trống, backend lưu **Quy cách gắn theo lô** nếu có `productBatchId`, **Cập nhật quy cách thủ công** nếu đã có phiên bản cấp sản phẩm cho UOM đó, hoặc **Khai báo khi tạo sản phẩm** nếu đây là phiên bản cấp sản phẩm đầu tiên cho UOM đó. Model yêu cầu trường này khi lưu. Quy đổi thùng đồng bộ tự động khi xác minh lô vẫn ghi căn cứ từ lô.
- Bản ghi trả `id` của Conversion, `productId`, `productBatchId`, `version`, `uom`, `basePerUnit`, `validFrom`, `verificationReference`, `createdBy`, `isCurrent`. `productVersion` giữ giá trị tương thích 1.
- Lịch sử quy đổi giữ bản ghi và trả `uom: null` khi tham chiếu đơn vị tính không còn khớp danh mục. Các bản ghi này vẫn được tính trong phân trang và chỉ hiển thị ở tab lịch sử. Giao diện ghi “Không tìm thấy đơn vị tính” ở cột đơn vị.
- UOM của cấu hình mới phải đang hoạt động. Quy đổi thùng của lô đã xác minh phải khớp `piecesPerCarton` và có hiệu lực ngay hoặc trong quá khứ. Khi tạo, xác minh hoặc sửa số viên/thùng của lô chưa được sử dụng, BE đồng bộ hệ số thùng cho các UOM đã đánh dấu `isCarton`.

Dòng chứng từ giữ `lotId`, `enteredQty`, `enteredUnit`, `baseUnitSnapshot`, `baseUnitsPerUnit`, `qtyBase` và snapshot đóng gói hiện có. Sửa số lượng với cùng sản phẩm, UOM và lô tiếp tục dùng snapshot. PO giữ hệ số RR đã duyệt. Kiểm nhận tạo dòng mới theo hệ số lô thực nhận, giữ snapshot khi sửa cùng lô và truyền xuống phiếu nhập. Kiểm nhận có thể tiếp tục với UOM đã ngừng hoạt động nếu PO đã sử dụng UOM đó và có hệ số hiệu lực cho quy đổi thực nhận. Giới hạn PO và phần còn lại tính theo `qtyBase`.

Snapshot đóng gói mặc định do backend tạo dùng `packageUnit: "Thùng"`. API tiếp tục đọc giá trị được lưu trên snapshot cũ. Danh mục từ `GET /api/products/options` cung cấp `isCarton` để frontend kiểm hệ số nguyên cho sản phẩm tính theo đơn vị nguyên.

Xem [quy trình backfill](../09_phat_trien/CONVERSION_BACKFILL.md) trước khi triển khai BE trên cơ sở dữ liệu hiện có.
