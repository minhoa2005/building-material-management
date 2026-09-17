# Tổng quan workspace

## Mục đích

Workspace tại `D:\Ky_9\SEP490\src` chứa API backend của SEP490.

## Hiện trạng

- Ứng dụng dùng Express.js với JavaScript ESM.
- `src/` chứa API, middleware, cấu hình cơ sở dữ liệu và các thành phần backend.
- `package.json` và `package-lock.json` ở thư mục gốc quản lý dependency.
- `.env.example` là mẫu cấu hình; không đưa thông tin xác thực thật vào repository.
- MongoDB là tùy chọn và được cấu hình qua `MONGODB_URI`.

## API

- `GET /api/health` kiểm tra tình trạng API.
- Cổng mặc định là `3000`; có thể đổi bằng biến môi trường `PORT`.
- Nếu không có `MONGODB_URI`, API vẫn chạy và bỏ qua kết nối cơ sở dữ liệu.

## Lệnh

- `npm install`: cài dependency.
- `npm run dev`: chạy backend với nodemon.
- `npm start`: chạy backend.

Sao chép `.env.example` thành `.env` để cấu hình cục bộ.

## Quy tắc làm việc

- Không tự commit.
- Không đưa bí mật hoặc thông tin xác thực thật vào repository; dùng file `.env` cục bộ và cập nhật `.env.example` nếu thêm biến môi trường.
- Giữ mã nguồn backend trong `src/` và cấu hình npm ở thư mục gốc.
