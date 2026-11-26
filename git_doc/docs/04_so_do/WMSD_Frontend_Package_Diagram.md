# WMSD Frontend Package Diagram

Sơ đồ tổng quan frontend tại `frontend/src`. Các hộp trong `features/` là nhóm nghiệp vụ để trình bày, không phải thư mục mới. `services` gom các tiện ích dùng chung trong `shared/hooks`, `shared/api` và `shared/lib`; phần UI dùng chung nằm trong `shared/ui` và `shared/components`.

[Draw.io source](WMSD_Frontend_Package_Diagram.drawio) · [SVG](WMSD_Frontend_Package_Diagram.svg) · [PNG](WMSD_Frontend_Package_Diagram.png)

Các mũi tên thể hiện luồng phụ thuộc/chính: `main.tsx → app → features`, feature dùng UI và services chung, services gọi Backend API. `config/` cung cấp theme, màu và branding. Sơ đồ không đi vào từng feature nhỏ hay liệt kê từng import.

Nguồn được đối chiếu với cấu trúc frontend ngày 26/11/2026. Chỉ thay đổi tài liệu; không khẳng định toàn bộ chức năng đã nghiệm thu.
