# B08A · customers · Khách hàng

**Phiếu v0.3 · Chờ duyệt cấu trúc.** Nhân viên nhập **tên và số điện thoại**. WMSD tự sinh mã khách dùng để tra cứu. MISA chỉ là tham khảo khi thiết kế cách ghi mã. Toàn bộ việc tạo mã và sửa hồ sơ thực hiện trong WMSD. [Phiếu v0.1](history/08A_Khach_hang_v0.1_de_xuat.md) · [Phiếu v0.2](history/08A_Khach_hang_v0.2_de_xuat.md).

| Trường đề xuất | Kiểu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId, tự tạo | ID nội bộ và ổn định để đơn bán, phiếu giao hoặc phiếu khách trả tham chiếu đúng người |
| `code` | Chuỗi, do WMSD tự sinh | Mã hiển thị cho nhân viên, ví dụ KH-015. Đề xuất duy nhất trong danh mục, cố định sau tạo và không tái sử dụng |
| `name` | Chuỗi, bắt buộc | Tên khách theo cách cửa hàng ghi nhận |
| `phone` | Chuỗi | Số điện thoại liên hệ. Lưu dạng chữ để giữ số 0 đầu. Đề xuất bắt buộc khi tạo mới |
| `version`, `createdAt`, `updatedAt` | Số nguyên, ngày giờ, tự ghi | Phục vụ kiểm soát sửa đồng thời và truy vết. Nhân viên không phải nhập |

**Cách làm việc.** Sales Staff tạo hoặc sửa tên và số điện thoại. Hai khách có thể trùng tên hoặc dùng chung số điện thoại, ví dụ người nhà cùng đặt hàng. Khi tra cứu có nhiều kết quả, người lập phiếu chọn đúng hồ sơ. Điện thoại không phải khóa duy nhất. Các phiếu đã lập tiếp tục tham chiếu được khách cũ.

**Địa chỉ theo từng lần giao.** Nếu cần giao tại công trình A hôm nay và công trình B ngày mai, mỗi địa chỉ được ghi ngay trên chứng từ của lần giao đó. Bảng khách không lưu địa chỉ mặc định. Quyền xem đề xuất giữ theo UC-20–22: Store Owner và Sales Staff được xem, Accountant xem trong phạm vi đối chiếu, Warehouse Staff xem thông tin cần cho chuyến thuộc kho được giao.

**Quyết định về mã khách.** Người dùng chọn “Thêm mã khách do WMSD tự sinh”. Khi lưu hồ sơ mới, WMSD cấp một mã duy nhất kể cả khi hai nhân viên tạo khách cùng lúc. Nhân viên tra theo mã, tên hoặc số điện thoại. Đổi tên hay điện thoại vẫn giữ nguyên mã và ID nên chứng từ cũ trỏ đúng khách. “KH-015” chỉ minh họa cách hiển thị. Bảng không có trường mã MISA và không lưu địa chỉ giao mặc định.

**Đối chiếu tài liệu.** UC-22 và mô tả trường SC-24 trong Report 3 còn nhắc đến mã ngoài và địa chỉ trên hồ sơ khách. Hồ sơ thiết kế mới áp dụng quyết định của người dùng ở trên. Đây là điểm cần đồng bộ khi sửa tài liệu yêu cầu. [Report 3](../../01_bao_cao/WMSD_Report3_Fix.docx.txt) · [Tổng hợp nhóm B08](07_Duyet_nguong_ton_va_doi_tac.md)
