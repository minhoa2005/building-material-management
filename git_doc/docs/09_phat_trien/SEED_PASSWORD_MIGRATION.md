## Khôi phục tài khoản chọn sẵn FE — 11/11/2026

Đã bổ sung 5 tài khoản admin@ceratile.vn, owner@ceratile.vn, sales@ceratile.vn, warehouse@ceratile.vn, accountant@ceratile.vn vào wmsd_database theo yêu cầu trực tiếp. Mật khẩu theo preset FE/SEED_ACCOUNTS, lưu bcrypt hash. Giữ 15 tài khoản nhân viên hiện hữu; dùng role và phạm vi kho từ admin/chucuahang/banhang01/thukho01/ketoan01. Thủ kho email được giao K-GACH-01 và K-GACH-02. Không tạo kho WH01/WH02 giả hoặc ghi đè role permissions. Đã kiểm 5/5 đăng nhập HTTP 200 qua Vite. Công cụ migrate-seed-passwords chỉ cập nhật mật khẩu tài khoản có sẵn; không tự tạo tài khoản thiếu và không hỗ trợ ghi remote. Khôi phục này là thao tác thêm có kiểm tra riêng, không chạy seed toàn bộ.

# Đồng bộ mật khẩu tài khoản seed local

Ngày 07/11/2026: `scripts/migrate-seed-passwords.mjs` đọc `SEED_ACCOUNTS` trong `src/seeds/data/accounts.data.js` và tìm chính xác theo username trong collection `users`. Mật khẩu khác được băm bcrypt cost 10 trước khi cập nhật `passwordHash`; user không có trong seed và các trường khác không bị sửa. User seed chưa tồn tại được báo `missing`, không tạo mới. Nếu username bị trùng, script dừng trước khi ghi. Mật khẩu đã khớp được giữ nguyên; có thể chạy lại. Không in mật khẩu hoặc hash.

Khi khởi động backend (`npm run dev` hoặc `npm start`), sau khi kết nối và chạy seed tùy chọn, ứng dụng tự đồng bộ trước khi lắng nghe API nếu `NODE_ENV` khác `production`, MongoDB đã kết nối và `MONGODB_URI` là URI loopback có tên database. Nếu không đáp ứng điều kiện thì bỏ qua; nếu đồng bộ lỗi thì ứng dụng không mở cổng. Vì chạy mỗi lần khởi động, mật khẩu seed đã đổi sẽ bị đặt lại về giá trị trong source. Nếu kết nối ban đầu thất bại, ứng dụng tiếp tục khởi động theo cơ chế hiện có và không tự chạy lại đồng bộ khi kết nối phục hồi.

Chỉ dành cho database phát triển/test local vì mật khẩu seed đã được công khai trong source. Chỉ kết nối MongoDB loopback, phải chỉ định tên database. Chạy từ backend, thay `<database>` bằng tên database local mong muốn:

```powershell
node scripts/migrate-seed-passwords.mjs --uri=mongodb://127.0.0.1:27017/<database>
node scripts/migrate-seed-passwords.mjs --uri=mongodb://127.0.0.1:27017/<database> --apply
```

Lệnh đầu chỉ xem `update`, `unchanged`, `missing`; lệnh thứ hai thực hiện cập nhật và báo `updated`. Các update riêng lẻ không nằm trong transaction: nếu lỗi hoặc dữ liệu bị thay đổi đồng thời, một số user trước đó có thể đã được cập nhật; chạy lại để hoàn tất. Thay mật khẩu không thu hồi token đã cấp. Script không được chạy trên database thật; chưa thực hiện ghi DB hoặc kiểm tra đăng nhập API trong lượt này.

Kiểm tra logic với `node --test test/seed-password-migration.test.js`; test dùng collection giả, bao gồm điều kiện chạy khi khởi động, và không kết nối MongoDB.
