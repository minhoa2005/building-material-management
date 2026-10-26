# Hướng dẫn agent BE

Trước khi phân tích, lập kế hoạch hoặc sửa backend, hãy đọc đầy đủ [context.md](context.md) trong thư mục này. Dùng các quy tắc nghiệp vụ chung và thẻ UC liên quan làm căn cứ triển khai. Context mô tả cả phần đã có lẫn phần đề xuất, vì vậy hãy đối chiếu với source code hiện tại trước khi kết luận hoặc thay đổi.

Khi thay đổi API, quyền, dữ liệu hoặc nghiệp vụ có liên quan giao diện, hãy đọc thêm [context FE](../fe/context.md) và giữ contract FE–BE nhất quán. Bảo toàn phạm vi UC, liên kết chứng từ nguồn, kiểm tra kho được giao, version, bằng chứng và tác động tồn kho.

Không tự commit.

## Cập nhật main trước khi code

Trước khi bắt đầu code, hãy kiểm tra branch hiện tại và working tree. Bảo toàn mọi thay đổi chưa commit; không ghi đè hoặc làm mất chúng. Fetch origin/main và cập nhật local main theo kiểu fast-forward nếu có thể. Sau đó kiểm tra các commit mới trên main và xác định cách đồng bộ branch làm việc với main theo quy ước của repo để giảm nguy cơ conflict. Nếu working tree không sạch, remote/main không truy cập được, hoặc fast-forward không thể thực hiện an toàn, dừng trước khi code và báo rõ tình trạng; không tự ý reset, force push hay commit.

