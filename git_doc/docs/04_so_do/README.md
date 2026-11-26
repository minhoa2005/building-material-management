# Sơ đồ hệ thống WMSD

## System architecture

- [System Architecture — Monolithic Backend](WMSD_System_Architecture.md) — black-and-white view in the layout of the user's microservices reference: client roles, the React SPA, one Express backend (API layer, eight business module groups, shared layer, background jobs, monitoring), MongoDB, Cloudinary, SMTP and the configured deployment targets. Includes editable Draw.io source and SVG/PNG previews (26 November 2026).

## Frontend

- [Frontend Package Diagram](WMSD_Frontend_Package_Diagram.md) — high-level view of `main.tsx`, `app`, broad feature groups, shared UI/services, config and the backend API; includes Draw.io source and PNG/SVG previews.

## Backend

- [Backend UML Package Diagram](WMSD_Backend_Packages_UML.md) — current source packages and verified import dependencies (26 November 2026), with all 29 feature directories, an editable two-page Draw.io file, and PNG/SVG exports. Page 1 shows selected cross-package dependencies; page 2 details three pairs of two-way feature dependencies. The companion document lists all 18 cross-package and 34 cross-feature edges with source evidence.

- [Backend Package Diagram](WMSD_Backend_Package_Diagram.drawio) — sơ đồ package UML theo hiện trạng `src/` ngày 26/11/2026: entry/router, middleware, đủ 29 feature module trong `modules/`, `shared/utils`, 61 collection schema trong `models/`, `config`, `seeds/migrations`, cùng MongoDB, Cloudinary và SMTP. Các nhóm màu xanh lá là nhóm trình bày feature, không phải thư mục con mới trong mã nguồn. Đây là sơ đồ phụ thuộc package, không thay thế ERD hay sơ đồ lớp.

## Business flows

- [Mainflows VI/EN](WMSD_Mainflows_VI_EN.drawio)
- [Mainflows EN](WMSD_Mainflows_EN.drawio)
- [Business Process](Business_Process.drawio)

Sơ đồ ERD và thiết kế database hiện hành nằm trong [thư mục thiết kế](../03_thiet_ke/DB_Current_2026-11-12_58/); xem [chỉ mục tài liệu](../../README.md) để chọn đúng bản hiện hành.
