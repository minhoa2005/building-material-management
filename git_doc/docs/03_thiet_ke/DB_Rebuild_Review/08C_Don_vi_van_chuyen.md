# B08C · Bỏ danh mục đội xe

**Quyết định mới ngày 05/11/2026:** không xây chức năng quản lý đội xe/đội vận chuyển. B08C và cấu trúc `delivery_teams` đã duyệt trước đây được thay thế.

Khi có phương tiện, nhân viên ghi trực tiếp biển số vào `handovers[].header.vehiclePlate` trên từng lần bàn giao. Không tạo danh mục để chọn lại, không lưu `carrierId` hoặc tên đội. Với trường hợp khách tự đến nhận và không dùng xe giao hàng, biển số có thể để trống; vẫn ghi người nhận và thông tin bàn giao theo nghiệp vụ.

Các quyết định B08C v0.1–v0.4 được giữ trong `history/` để tra cứu, không còn là yêu cầu hiện hành. Biển số cũ không thể suy ra từ tham chiếu carrier cũ; nếu có dữ liệu lịch sử cần chuyển đổi, phải bổ sung biển số từ nguồn đáng tin cậy.
