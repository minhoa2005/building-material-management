# B08B · suppliers · Nhà cung cấp

**Phiếu v0.1 · Chờ duyệt cấu trúc.** Một hồ sơ cho một nhà cung cấp mà cửa hàng đặt mua hoặc trả hàng. Hãng phát hành SKU thuộc B04. Một hãng có thể được phân phối qua nhiều nhà cung cấp.

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId, tự tạo | ID nhà cung cấp trên phiếu mua, nhận và trả |
| `code` | Chuỗi, bắt buộc, duy nhất trong suppliers | Mã nhà cung cấp nội bộ. Đề xuất cố định sau tạo |
| `name` | Chuỗi, bắt buộc | Tên giao dịch |
| `contactName`, `phone`, `email`, `address` | Chuỗi, tùy chọn | Thông tin liên hệ khi xác nhận đơn, lịch giao hoặc trả hàng |
| `status` | PENDING, ACTIVE hoặc INACTIVE | Đề xuất tạo ở PENDING. Chỉ ACTIVE mới được chọn cho PO mới |
| `version`, `createdAt`, `updatedAt` | Số nguyên và ngày giờ | Phiên bản và thời điểm thay đổi. Quyết định đổi trạng thái lưu người thực hiện trong lịch sử |

**Quan hệ.** Một nhà cung cấp có nhiều PO. Phiếu nhập truy về nhà cung cấp của PO và đợt giao thực tế. Phiếu trả nhà cung cấp phải đối chiếu đúng bên đã giao trên chứng từ nguồn. Hai nhà cung cấp có thể đưa hàng vào cùng lô B05 khi thông tin nhận dạng khớp. Hàng còn thuộc nhà cung cấp nhưng cửa hàng đang giữ vẫn truy được về đúng nhà cung cấp.

**Quyền và vòng đời đề xuất theo UC-17–19.** Accountant tạo/sửa danh tính và liên hệ. Store Owner kích hoạt, ngừng hoặc kích hoạt lại. Cả hai được xem. Ngừng dùng chặn PO mới. Chứng từ đã mở tiếp tục được đối chiếu, hoàn tất hoặc xử lý trả hàng theo đúng nguồn. Không xóa hồ sơ đã có giao dịch. Mỗi thay đổi trạng thái kiểm quyền riêng với thao tác chỉnh thông tin.

**Ví dụ.** Accountant tạo NCC-014 ở trạng thái PENDING. Sau khi Store Owner kích hoạt, nhân viên có quyền lập PO mới cho NCC-014. Nếu sau này NCC-014 ngừng hoạt động, một phiếu trả cho lần nhập trước vẫn thể hiện NCC-014.

[Quyết định tách bảng và tham chiếu chủ hàng](07_Duyet_nguong_ton_va_doi_tac.md) · [Report 3, UC-17–19](../../01_bao_cao/WMSD_Report3_Fix.docx.txt)
