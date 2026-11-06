# B08A · customers · Khách hàng

**Phiếu v0.1 · Chờ duyệt cấu trúc.** Một hồ sơ cho một khách hàng mà cửa hàng cần đối chiếu với đơn nguồn hoặc liên hệ để giao, nhận lại hàng. Khách có thể là cá nhân hoặc tổ chức. Nếu tổ chức này cũng bán hàng cho cửa hàng, bộ phận mua hàng dùng hồ sơ riêng ở [B08B](08B_Nha_cung_cap.md).

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId, tự tạo | ID ổn định của khách trên các chứng từ |
| `code` | Chuỗi, bắt buộc, duy nhất trong customers | Mã khách nội bộ, đề xuất cố định sau khi tạo |
| `name` | Chuỗi, bắt buộc | Tên người hoặc tổ chức để tìm kiếm và in trên phiếu |
| `misaCode` | Chuỗi, tùy chọn | Mã khách MISA nếu chứng từ nguồn có cung cấp. Giữ số 0 ở đầu, đề xuất duy nhất trong danh mục khi có mã |
| `contactName`, `phone` | Chuỗi, tùy chọn | Người liên hệ và số điện thoại giao hàng. Hai khách có thể dùng chung số điện thoại |
| `defaultDeliveryAddress` | Chuỗi, tùy chọn | Địa chỉ để gợi ý khi lập phiếu. Nhân viên ghi địa chỉ thực tế của từng chuyến trên chứng từ |
| `isActive` | Đúng/sai | Hồ sơ mới mặc định đang dùng. Giữ trạng thái đối với hồ sơ cũ và cho tra cứu lịch sử. Phiếu này chưa đề xuất cấp thêm quyền đổi trạng thái khách |
| `version`, `createdAt`, `updatedAt` | Số nguyên và ngày giờ | Kiểm soát hai người sửa đồng thời và ghi thời điểm thay đổi |

**Quan hệ.** Một khách có thể có nhiều đơn bán, lần giao và phiếu trả. Đơn bán tham chiếu đúng khách và giữ thông tin nguồn tại thời điểm lập. Phiếu trả truy về lần giao liên quan. Hàng giữ hộ của khách có thể nằm ở nhiều kho; số lượng theo từng khách sẽ được duyệt ở C02. Nếu khách đổi địa chỉ, phiếu giao cũ giữ nguyên địa chỉ đã giao.

**Quyền mặc định theo UC-20–22.** Sales Staff tạo/cập nhật thông tin liên hệ, giao hàng và mã tham chiếu ngoài. Store Owner và Sales Staff được xem. Accountant xem trong phạm vi đối chiếu chứng từ; Warehouse Staff xem thông tin cần cho lượt giao thuộc phạm vi được giao. Quyền duy trì bảng khách không cho sửa hồ sơ nhà cung cấp.

**Kiểm tra dữ liệu.** Đề xuất giữ mã nội bộ cố định, từ chối mã MISA đã thuộc khách khác và hiển thị kết quả khớp để người có quyền đối chiếu. Không tự gộp hồ sơ theo tên hoặc số điện thoại. Chứng từ đã phát sinh vẫn truy được khách cũ. Quyền thay đổi trạng thái nếu cần sẽ trình riêng.

**Ví dụ.** Khách KH-015 có địa chỉ mặc định A. Hôm nay khách yêu cầu giao tại công trình B. Phiếu hôm nay lưu B, hồ sơ khách và các phiếu trước đó vẫn giữ địa chỉ tương ứng.

[Quyết định tách bảng và tham chiếu chủ hàng](07_Duyet_nguong_ton_va_doi_tac.md) · [Report 3, UC-20–22](../../01_bao_cao/WMSD_Report3_Fix.docx.txt)
