# Backend trên Cloudflare Workers

Kết nối repo backend trong Workers & Pages. Với repo riêng cho BE, để thư mục gốc là `/` và dùng lệnh deploy `npx wrangler@4.166.0 deploy`. Tên Worker trong `wrangler.json` là `wmsd-be`. Nếu dự án trên dashboard dùng tên khác, điền tên đó vào thuộc tính `name` trước khi deploy.

Cài các dependency của backend bằng `npm ci` theo `package-lock.json`. API catalogue lấy `Router` từ dependency trực tiếp `express`.

Thêm `MONGODB_URI`, `JWT_SECRET` và `REFRESH_TOKEN_SECRET` dưới dạng Worker secrets. Dùng DB Atlas thử có replica set khi kiểm tra giao dịch tồn kho. Cấu hình `CLOUDINARY_URL` cho tải ảnh và các biến `SMTP_*` / `MAIL_FROM` nếu phiên bản backend triển khai có luồng email. Biến runtime `APP_URL` của BE là `https://wmsd.tanthuong.workers.dev` để email dẫn đến đúng FE. Cấu hình Wrangler giữ các biến runtime đã đặt trên dashboard khi deploy. Vite cần `VITE_API_URL` ở thời điểm build FE trỏ tới API của cùng BE cấp mật khẩu. Đặt `NOTIFICATIONS_START_AT` theo ISO UTC để Cron Trigger xử lý tối đa 25 sự kiện mỗi phút.

Worker chuyển request HTTP vào Express qua một Durable Object, nơi Mongoose có thể dùng lại kết nối. Route `GET /api/health` kiểm tra HTTP. Kiểm tra thêm đăng nhập, refresh cookie và thao tác chuyển kho trên DB thử để xác nhận kết nối thực tế. Nếu FE dùng `VITE_API_URL=/api`, cấu hình proxy production từ FE đến Worker.

Preflight CORS và health check chạy khi MongoDB chưa kết nối. Nếu API trả 503 và log hiển thị `MissingWorkerSecrets`, kiểm tra ba secret runtime của BE. Với `MongooseServerSelectionError`, kiểm tra cấu hình kết nối Atlas và danh sách IP được phép truy cập.

Trước khi xử lý API cần MongoDB hoặc tác vụ theo lịch, Worker kiểm tra trạng thái kết nối Mongoose. Nếu kết nối đã ngắt, một lần mở lại được dùng chung cho các request đang chờ. Nếu mở lại thất bại, API trả 503 và lần gọi sau có thể thử kết nối lại.

```powershell
npx wrangler@4.166.0 deploy --dry-run
```

Đã kiểm tra bundle, health, đăng nhập, chữ ký JWT, cookie Secure và refresh đồng thời với đọc thông tin tài khoản qua Wrangler local. MongoDB dùng một DB thử trên localhost. Giao dịch kho và Cron Trigger với dữ liệu thật còn cần kiểm tra ở môi trường staging.
