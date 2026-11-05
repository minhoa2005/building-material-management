# WMSD — Backend context

Điểm bắt đầu hiện hành, cập nhật 05/11/2026.

Đọc đầy đủ [hướng dẫn dự án](git_doc/PROJECT_GUIDE.md), [bản đồ model](git_doc/MODEL_MAP.md) và [quy tắc cập nhật tài liệu](git_doc/DOCUMENTATION_RULES.md) trước khi code. Ba file AGENTS.md, CLAUDE.md, GEMINI.md áp dụng cùng nội dung.

DB mới có 74 collection, đăng ký từ `src/models/index.js` qua `registerReviewedModels(connection)`. API chưa chuyển vẫn import rõ `src/models/legacy/index.js`. Triển khai schema/seed mới và chuyển service/API là các mốc riêng, không trộn hai profile trên cùng connection.

Giá bán trên SO, hóa đơn tổng hợp, role tùy chỉnh, quy đổi trực tiếp trên dòng và BF04 nhiều phiếu xuất/nhận đã được duyệt trong bộ thiết kế mới. Chi tiết và nguồn nằm ở PROJECT_GUIDE. D07/D08 về xác minh nguồn còn chờ nghiệp vụ.

[Chỉ mục git_doc](git_doc/README.md) tập trung phiếu duyệt, ERD, Data Dictionary, API, migration, seed/local và lịch sử thay đổi. Khi code ảnh hưởng phần nào, tự sửa mô tả phần đó trong cùng lượt.

Các thẻ UC và ghi chú runtime baseline 3.3.x được giữ tại [context trước đợt tổng hợp](git_doc/docs/99_lich_su/context_BE_truoc_tong_hop_2026-11-05.md) để truy vết. Khi dùng thẻ cũ, đối chiếu quyết định mới và code hiện hành.
