# WMSD — Backend context

Điểm bắt đầu hiện hành, cập nhật 05/11/2026.

Đọc đầy đủ [hướng dẫn dự án](git_doc/PROJECT_GUIDE.md), [bản đồ model](git_doc/MODEL_MAP.md) và [quy tắc cập nhật tài liệu](git_doc/DOCUMENTATION_RULES.md) trước khi code. Ba file AGENTS.md, CLAUDE.md, GEMINI.md áp dụng cùng nội dung.

DB mới có 59 collection, đăng ký từ `src/models/index.js` qua `registerReviewedModels(connection)`. API chưa chuyển vẫn import rõ `src/models/legacy/index.js`. Triển khai schema/seed mới và chuyển service/API là các mốc riêng, không trộn hai profile trên cùng connection.

Schema v8 có 59 collection, thêm categories và products.categoryId: sản phẩm có dài/rộng/cao từng viên và màu; mỗi lô có số viên/thùng cố định và kích thước ngoài thực tế của thùng, bỏ calibre/tone. [Quyết định và giới hạn kiểm sức chứa](git_doc/docs/03_thiet_ke/DB_Rebuild_Review/39_San_pham_va_lo_dang_chot.md). DB mẫu hiện hành: localhost:27017/wmsd_demo_tile_shop_v8. Đợt [rà trường v5](git_doc/docs/03_thiet_ke/DB_Rebuild_Review/38_Ra_soat_truong_58_bang.md) vẫn áp dụng: đầu phiếu chỉ giữ version, không thêm revision trùng; các phiên bản nguồn vẫn giữ.

Giá bán trên SO, hóa đơn tổng hợp, role tùy chỉnh, quy đổi trực tiếp trên dòng và BF04 nhiều phiếu xuất/nhận đã được duyệt trong bộ thiết kế mới. Chi tiết và nguồn nằm ở PROJECT_GUIDE. D07/D08 về xác minh nguồn còn chờ nghiệp vụ.

[Chỉ mục git_doc](git_doc/README.md) tập trung phiếu duyệt, ERD, Data Dictionary, API, migration, seed/local và lịch sử thay đổi. Khi code ảnh hưởng phần nào, tự sửa mô tả phần đó trong cùng lượt.

Các thẻ UC và ghi chú runtime baseline 3.3.x được giữ tại [context trước đợt tổng hợp](git_doc/docs/99_lich_su/context_BE_truoc_tong_hop_2026-11-05.md) để truy vết. Khi dùng thẻ cũ, đối chiếu quyết định mới và code hiện hành.

Model hiện hành đã tách: mỗi collection một file `src/models/*.model.js`, schema nhúng trong `src/models/embedded/`. Atlas `wmsd_database` đã nhận 59 collection/638 bản ghi chỉ còn gạch; DB local v7 khớp dữ liệu đọc lại. [Hướng dẫn và bằng chứng triển khai](git_doc/docs/09_phat_trien/ATLAS_DEPLOYMENT.md). API legacy và kết nối ứng dụng chưa chuyển.

Category 1–n Product, 5 nhóm do người dùng duyệt. [Cấu trúc và triển khai v8](git_doc/docs/09_phat_trien/CATEGORIES_V8.md).

## Merge main — 06/11/2026

Các API mua/nhập từ main tiếp tục dùng registry legacy, gồm PurchaseEvent, PurchaseSourceClaim, ReceiptPlacement và PurchaseEvidenceUpload. Bộ schema chính vẫn là 59 collection đã duyệt. [Ghi chú tích hợp](git_doc/docs/09_phat_trien/MERGE_MAIN_2026-11-06.md) phân biệt runtime cũ với thiết kế mới; [context main nguyên bản](git_doc/docs/99_lich_su/context_main_PO_2026-11-06.md) giữ để truy vết, không thay quyết định DB hiện hành.
