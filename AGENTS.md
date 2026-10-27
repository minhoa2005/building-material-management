# Hướng dẫn agent BE

Trước khi phân tích, lập kế hoạch hoặc sửa backend, hãy đọc đầy đủ [context.md](context.md) trong thư mục này. Dùng các quy tắc nghiệp vụ chung và thẻ UC liên quan làm căn cứ triển khai. Context mô tả cả phần đã có lẫn phần đề xuất, vì vậy hãy đối chiếu với source code hiện tại trước khi kết luận hoặc thay đổi.

Khi thay đổi API, quyền, dữ liệu hoặc nghiệp vụ có liên quan giao diện, hãy đọc thêm [context FE](../fe/context.md) và giữ contract FE–BE nhất quán. Bảo toàn phạm vi UC, liên kết chứng từ nguồn, kiểm tra kho được giao, version, bằng chứng và tác động tồn kho.

Không tự commit.

Các file trong `git_doc/docs/01_bao_cao/` là bản đối chiếu và nộp. Chỉ cập nhật nội dung trong các mục có sẵn; không tự thêm banner phiên bản, dòng/bảng lịch sử chỉnh sửa, khối REVISION, phụ lục cập nhật hoặc ghi chú đồng bộ/triển khai ở cuối report. Yêu cầu mới phải đưa vào đúng phần nghiệp vụ, phạm vi, dữ liệu, use case, màn hình hoặc kế hoạch/kiểm thử tương ứng. Giữ bảng Change Log có sẵn, không tự thêm bản ghi.

