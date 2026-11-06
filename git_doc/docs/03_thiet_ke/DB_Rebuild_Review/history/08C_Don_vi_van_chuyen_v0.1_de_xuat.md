# B08C · carriers · Đơn vị vận chuyển

**Phiếu v0.1 · Chờ duyệt cấu trúc.** Một hồ sơ cho một đơn vị vận chuyển được chọn lại qua nhiều chuyến. Danh mục giữ thông tin liên hệ chung. Thông tin người nhận bàn giao thực tế, bằng chứng và số lượng mỗi lần giao ở trên chứng từ của chuyến.

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId, tự tạo | ID ổn định để các lần bàn giao tham chiếu |
| `code` | Chuỗi, bắt buộc, duy nhất trong carriers | Mã nội bộ, giữ nguyên sau tạo |
| `name` | Chuỗi, bắt buộc | Tên đơn vị để nhân viên chọn khi bàn giao |
| `contactName`, `phone` | Chuỗi, tùy chọn | Đầu mối điều phối và số điện thoại chung |
| `isActive` | Đúng/sai, mặc định true | Chỉ đơn vị đang dùng xuất hiện trong lựa chọn cho chuyến mới |
| `version`, `createdAt`, `updatedAt` | Số nguyên và ngày giờ | Phiên bản và thời điểm thay đổi |

**Quan hệ.** Một đơn vị có thể nhận nhiều lượt bàn giao. Với chuyến qua đơn vị vận chuyển, đề xuất lưu trên chứng từ `carrierId`, tên đơn vị tại thời điểm bàn giao, người/lái xe nhận thực tế, thời điểm, lượng thực giao và tham chiếu bằng chứng. Nếu đổi tên đơn vị, người đọc vẫn thấy đúng tên đã ghi trên chuyến trước. Khách trực tiếp nhận hàng được ghi theo người nhận thực tế và hình thức bàn giao. Việc giao cho lái xe chưa xác nhận khách đã nhận.

**Quyền trình duyệt.** UC-58 giao Warehouse Staff quyền ghi bàn giao thực tế. Report 3 chưa quy định ai quản lý danh mục đơn vị vận chuyển. Đề xuất Store Owner mặc định được tạo/sửa/ngừng/kích hoạt lại đơn vị, Warehouse Staff được xem và chọn đơn vị đang hoạt động khi bàn giao trong kho được giao. Administrator có thể cấp quyền tương ứng theo role như A02/A03. Tên hãng vận chuyển là dữ liệu danh mục; bản ghi này không cấp tài khoản đăng nhập.

**Ví dụ.** Hai chuyến cùng chọn VC-003, nhưng chuyến sáng do anh A nhận và chuyến chiều do anh B nhận. Mỗi chuyến có riêng người nhận, giờ bàn giao và bằng chứng. Ngừng VC-003 chỉ chặn chọn cho chuyến mới.

[Quyết định về danh mục vận chuyển](07_Duyet_nguong_ton_va_doi_tac.md) · [Report 3, UC-58](../../01_bao_cao/WMSD_Report3_Fix.docx.txt)
