# Registry và công cụ chuyển dữ liệu

Thư mục này vẫn được sử dụng:

- `index.js`: đăng ký model trên connection; entry point `../index.js` gọi vào đây.
- `collections.js`, `references.js`: tên collection/model và cách liên kết.
- `capacity.js`: kiểm kích thước thùng và sức chứa ô.
- `consolidation.js`, `field-cleanup.js`: xử lý dữ liệu gộp và bỏ trường cũ khi dựng seed/chuyển dữ liệu.
- `catalogue.js`, `stock.js`, `documents.js`: chỉ còn dùng cho profile migration lịch sử, không phải nơi sửa schema hiện hành.

Đã bỏ ba builder không còn được gọi: `reviewed-events.js`, `reviewed-support.js`, `reviewed-workflows.js`. Không xóa cả thư mục vì seed, kiểm tra và registry vẫn cần các file còn lại.

Đọc và cập nhật [tài liệu chính](../../../git_doc/docs/09_phat_trien/DB_REBUILD.md). Khi đổi code, sửa tài liệu chính trong cùng lượt làm việc.

Các ghi chú runtime trong tài liệu được đối chiếu với [hướng dẫn dự án](../../../git_doc/PROJECT_GUIDE.md).
