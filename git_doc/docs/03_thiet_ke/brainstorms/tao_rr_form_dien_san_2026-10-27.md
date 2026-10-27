# Quyết định tạo RR từ form điền sẵn — 27/10/2026

Trạng thái: người dùng chấp thuận, đã đồng bộ cấu trúc theo [đề xuất1.4.0](../De_xuat_bo_sung_hang_theo_nguon_2026-10-27.md), baseline3.3.0.


**Form tạo RR thống nhất (đề xuất 1.4.0 được chấp thuận, baseline 3.3.0):** Người dùng chọn dòng cảnh báo và bấm Tạo yêu cầu, hoặc mở từ menu rồi chọn nguồn/nhu cầu khác. Form điền sẵn sản phẩm, kho, lượng gợi ý, lý do và refs có căn cứ. Sửa lượng/ngày cần/lý do; dòng nguồn giữ sản phẩm/kho/refs. Đổi ngữ cảnh phải chọn lại và tính lại. Một RR một kho/ngày cần; khác nhóm tạo phiếu riêng sau review.

- Mở/hủy form hoặc chọn Để sau không lưu RR, links hay pending coverage. Lưu nháp mới ghi DRAFT; Gửi duyệt kiểm dữ liệu rồi ghi SUBMITTED theo quyền. Nháp đã lưu được cập nhật cùng ID/version. Owner khác người gửi duyệt; Accountant lập PO sau duyệt.
- Sau lưu SO thành công, xét các kho, nguồn về đúng hạn/tương thích và RR đã có. Còn thiếu thì hỏi “Đơn đã lưu; còn thiếu lượng chưa có nguồn phù hợp đúng hạn. Bạn có muốn tạo yêu cầu bổ sung?” Người dùng chọn dòng rồi mở form. Áp dụng cho cả không có nguồn và chỉ đủ một phần; đủ RR/nguồn thì dẫn tới phương án đang có. Có phương án kho khác chưa chọn phải hiển thị trước, không kết luận không có nguồn.
- Đánh giá lỗi/chậm hiển thị chưa kiểm tra được/đang kiểm tra, không coi nguồn bằng0 hoặc làm SO lưu thất bại. Hộp thoại theo lần lưu có thay đổi nhu cầu; refresh/retry/sửa ghi chú không liên quan không tự lặp. Cảnh báo và nút tạo vẫn có trên chi tiết SO.
- Được thêm sản phẩm ngoài cảnh báo. Dòng thêm chọn nguồn đúng của chính nó hoặc MANUAL_OTHER kèm lý do; sản phẩm ngoài SO không gắn giả vào SO line ban đầu. Cùng sản phẩm khác nguồn/lý do có thể tách dòng; trùng đúng cùng nguồn cần gộp/sửa.
- Khi lưu/gửi, BE kiểm lại source/version/coverage và trả số cũ–mới nếu thay đổi. Giữ nội dung người dùng nhập; chỉ lưu sau khi xác nhận dữ liệu hợp lệ. Nguồn hủy/hết quyền/hết nhu cầu phải sửa/xóa dòng; không âm thầm thay lượng hoặc đổi loại lý do. Phần vượt thiếu bán phải tách nhu cầu khác.
- Contract tạo dùng action SAVE_DRAFT/SUBMIT, creationKey, kho/ngày/lý do và source từng dòng; không có trường phân loại cách tạo. Quyền, Notification/readAt, guard và payloadHash giữ nguyên mục đích; mở form/đọc thông báo không ghi tồn. Ngày cần sau kiểm kê không có căn cứ thì để người dùng chọn.

## Phạm vi

Một form từ cảnh báo/menu/chi tiết SO; chọn và thêm dòng có căn cứ riêng; lưu/gửi mới tạo chứng từ; user và Owner duyệt theo quyền; cảnh báo tính lại, Notification riêng. Một RR một kho/ngày cần. Không tự tạo trong nền, không mở rộng vòng đời StockAlert/giao việc/hẹn nhắc.

## Áp dụng

Model/seed/DTO và tài liệu/context đã đồng bộ. API đánh giá/lưu/gửi, worker thông báo và UI thực thi vẫn cần triển khai; không coi schema/fixture là luồng đã chạy.
