# Định danh chứng từ — quy tắc áp dụng từ 12/11/2026

Chứng từ mới dùng mã phiếu dạng `LoạiPhiếu-MãKhoHoặcBộPhận-YYMMDD-SốThứTự`. Dấu nối giữa các phần là `-` liền.

Ví dụ `ĐMH-K-GACH-01-261113-000001` và `YCĐC-KG1-261113-000001`.

- Ngày dùng múi giờ Asia/Ho_Chi_Minh và gồm hai số cuối năm, tháng, ngày.
- Loại phiếu là mã tiếng Việt khai báo trong src/shared/utils/document-number.js; không dùng mã ngẫu nhiên hoặc mã theo ObjectId.
- Mã kho lấy từ `Warehouse.code`. Nhóm điều chuyển, chuyển vị trí và chênh lệch chuyển kho rút gọn mã kho gạch, ví dụ `K-GACH-01` thành `KG1`. Chứng từ bán hàng hoặc đối soát không thuộc kho dùng mã bộ phận `KD`.
- Số thứ tự tăng theo loại phiếu + kho/bộ phận + ngày, bắt đầu 000001, tối thiểu sáu chữ số.
- Chứng từ mới đặt `_id = documentNo` trong cùng transaction. MongoDB giữ `_id` duy nhất và bất biến.
- Bộ cấp số tìm số thứ tự lớn nhất trong dữ liệu chứng từ và `operation_records`. Trong cùng phạm vi cấp số, bộ cấp số tính cả mã liền, mã có dấu cách quanh dấu nối và mã dùng mã kho gốc hoặc rút gọn. Khi trùng mã, hệ thống thử lại transaction. Registry không có collection `document_sequences`.
- API nhận mã liền, mã đã lưu có dấu cách quanh dấu nối và ObjectId lịch sử tại các trường tham chiếu chứng từ trong route, query và body. Gửi nguyên giá trị ID do API trả về.
- Catalogue, sản phẩm, lô, kho, vị trí và dòng nhúng tiếp tục dùng ObjectId. Chứng từ đã lưu giữ nguyên `_id` và `documentNo`.

Nguồn triển khai: src/models/document-identity.js, src/shared/utils/document-number.js, src/models/references.js, src/shared/utils/document-id.validation.js. Không ghi DB Atlas trong thay đổi này; kiểm thử transaction dùng DB loopback riêng.
