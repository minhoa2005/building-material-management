# Tổng quan workspace

## Mục đích

Workspace này nằm tại `D:\Ky_9\SEP490\src` và là mã nguồn cho ứng dụng web full-stack của SEP490.

## Hiện trạng

- Workspace đã được khởi tạo bằng npm workspaces ở thư mục gốc.
- `client/` chứa ứng dụng Vite vanilla JavaScript, Tailwind CSS và cấu hình Axios.
- `be/` chứa API Express ESM, middleware cookie/JSON và kết nối Mongoose tùy chọn.
- Dependency được quản lý bằng `package-lock.json` ở thư mục gốc.
- `be/.env.example` là mẫu cấu hình; không có file `.env` hoặc thông tin xác thực thật trong repository.
- Spec thiết kế: `docs/superpowers/specs/2026-09-17-vite-express-starter-design.md`.
- Kế hoạch triển khai: `docs/superpowers/plans/2026-09-17-vite-express-starter.md`.

## Kiến trúc

Hai ứng dụng được quản lý riêng bằng npm workspaces.

### Frontend (`client/`)

- Vite với vanilla JavaScript, không dùng TypeScript hoặc React.
- Tailwind CSS.
- Axios để gọi API qua tiền tố `/api`.
- Day.js cho xử lý ngày giờ.
- Lucide cho icon SVG.
- Dev server chạy ở cổng `5173` và proxy `/api` sang backend tại `localhost:3000`.

### Backend (`be/`)

- Express.js dùng JavaScript ESM.
- dotenv để nạp biến môi trường.
- cookie-parser để đọc cookie từ request.
- Mongoose để kết nối MongoDB khi có `MONGODB_URI`.
- API kiểm tra tình trạng là `GET /api/health`.
- Cổng mặc định là `3000`.

### Lệnh

- `npm install`: cài dependency cho các workspace.
- `npm run dev`: chạy frontend và backend cùng lúc.
- `npm run dev:client`: chỉ chạy frontend.
- `npm run dev:server`: chỉ chạy backend.
- `npm run build`: build frontend cho production.

Sao chép `be/.env.example` thành `be/.env` để cấu hình MongoDB local. Có thể để trống hoặc bỏ `MONGODB_URI`; khi đó API vẫn chạy và bỏ qua kết nối cơ sở dữ liệu.

## Quy tắc làm việc

- Không tự commit.
- Không đưa bí mật hoặc thông tin xác thực thật vào repository; dùng file `.env` cục bộ và cập nhật `.env.example` nếu thêm biến môi trường.
- Giữ frontend và backend tách biệt trong `client/` và `be/`, trừ khi người dùng yêu cầu đổi cấu trúc.
