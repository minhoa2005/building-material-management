# Đặt lại mật khẩu user của database test local

Ngày 07/11/2026: database local `wmsd_api_test_6aedf823b3e33975e06c07d1` có 60 collection và bốn user `owner`, `warehouse`, `accountant`, `receiver`. Script `scripts/reset-test-user-password.mjs` chỉ kết nối database này trên `127.0.0.1:27017`, chỉ sửa `passwordHash` của một user được chọn và dùng bcrypt cost 10 như service tạo user. Không dùng mật khẩu seed cho các username khác.

Chạy từ thư mục backend. Xem trước, không ghi:

```powershell
node scripts/reset-test-user-password.mjs --user=owner
```

Đặt biến môi trường trong phiên PowerShell và thêm `--apply` để ghi; thay placeholder bằng mật khẩu riêng (tối thiểu 8 ký tự, tối đa 72 byte UTF-8):

```powershell
$env:WMSD_TEST_NEW_PASSWORD = '<mat-khau-moi>'
node scripts/reset-test-user-password.mjs --user=owner --apply
Remove-Item Env:WMSD_TEST_NEW_PASSWORD
```

Lặp lại với user khác nếu cần. Script không in mật khẩu hoặc hash, không tạo user và không đổi các trường khác. Mật khẩu thay đổi không tự thu hồi các token đã cấp. Database có tên test này có thể bị bộ test xóa hoặc tạo lại. Ngày 07/11/2026 đã chạy cập nhật cả bốn user và kiểm tra bcrypt thành công; chưa kiểm thử đăng nhập qua API.
