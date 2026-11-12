# Trạng thái tài khoản và phân quyền — 12/11/2026

`PATCH /api/users/:id/status` cần quyền `user:update`. Payload `{ "isActive": false, "reason": "Lý do khoá" }` bắt buộc lý do sau khi cắt khoảng trắng (1–2000 ký tự). Mở khoá dùng `{ "isActive": true }`. Không được tự khoá tài khoản hiện tại.

Backend lưu `users.lockReason` khi khoá và trả trường này trong danh sách/chi tiết người dùng. Mở khoá xoá lý do hiện tại; audit giữ sự kiện LOCK_USER/UNLOCK_USER và lý do. Dữ liệu khoá từ trước có thể chưa có lý do. `PUT /api/users/:id` chỉ sửa thông tin, role và kho; không đổi trạng thái.

FE có button Xem, Khoá/Mở khoá tại bảng tài khoản; sửa thông tin trong trang chi tiết. Bảng không hiển thị kho phân công. Nội dung dài xuống dòng trong cột cố định; dưới 768px chuyển thành thẻ tài khoản có phân trang, bộ lọc co theo màn hình. Điều hướng và thao tác trên danh sách dùng button có icon, không dùng liên kết bọc button. Tại trang vai trò, admin có thể tick nhiều tài khoản trên một trang và gán cùng role. FE gọi `PUT /api/users/:id` theo từng tài khoản, báo số ca thành công/thất bại; đây chưa phải giao dịch hàng loạt nguyên tử. Quyền role tiếp tục dùng `PUT /api/roles/:code/permissions` với danh sách mã quyền đang hoạt động. BE kiểm quyền ở từng request; không suy quyền từ checkbox FE.

## UI bảng phân quyền — cập nhật 12/11/2026
Trang phân quyền mở trực tiếp bảng tick của vai trò đầu tiên. Người dùng bấm một vai trò để xem/sửa quyền của vai trò đó. Mỗi hàng là chức năng; cột gồm Chọn cả nhóm, Xem, Tạo mới, Chỉnh sửa và Quyền khác (từng thao tác có nhãn riêng). Ô không có quyền tương ứng hiện dấu gạch, không tạo quyền giả. Lưu gửi đúng mã quyền đã chọn, giữ quyền ngoài bộ lọc. Bản sửa chưa lưu được giữ riêng khi chuyển vai trò. Gán nhiều tài khoản mở bằng nút riêng trong hộp thoại, không chiếm màn chỉnh quyền. Bảng có tiêu đề cố định và cuộn ngang trong vùng bảng ở màn nhỏ.
