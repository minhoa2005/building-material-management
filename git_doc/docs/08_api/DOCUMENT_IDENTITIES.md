# Định danh chứng từ — quy tắc áp dụng từ 12/11/2026

Mọi chứng từ nghiệp vụ có thể lưu trong runtime mới phải dùng cùng một định danh mã phiếu:

[Loại Phiếu] - [Mã kho/Bộ phận] - [YYMMDD] - [Số thứ tự tăng dần]

Ví dụ: YCĐC - K-GACH-01 - 261112 - 000001.

- Ngày dùng múi giờ Asia/Ho_Chi_Minh và gồm hai số cuối năm, tháng, ngày.
- Loại phiếu là mã tiếng Việt khai báo trong src/shared/utils/document-number.js; không dùng mã ngẫu nhiên hoặc mã theo ObjectId.
- Mã kho lấy từ Warehouse.code. Chứng từ không thuộc kho dùng mã bộ phận KD cho bán hàng/đối soát.
- Số thứ tự tăng theo loại phiếu + kho/bộ phận + ngày, bắt đầu 000001, tối thiểu sáu chữ số.
- Chứng từ mới đặt _id = documentNo trong cùng transaction. MongoDB giữ _id duy nhất và bất biến; không sửa _id sau khi ghi.
- Không có collection document_sequences. Bộ số suy ra từ mã phiếu đã ghi và operation_records giữ lịch sử, có kiểm tra va chạm và retry transaction.
- Catalogue, sản phẩm, lô, kho, vị trí và dòng nhúng tiếp tục dùng ObjectId. Các tham chiếu chứng từ dùng kiểu hỗn hợp chấp nhận mã mới và ObjectId lịch sử.
- API nhận mã chứng từ hoặc ObjectId cũ ở route/query/body khi đó là tham chiếu chứng từ; ID catalogue vẫn chỉ nhận ObjectId.
- Chứng từ cũ không bị đổi _id hoặc documentNo; migration đổi định danh cũ phải là kế hoạch riêng.

Nguồn triển khai: src/models/document-identity.js, src/shared/utils/document-number.js, src/models/references.js, src/shared/utils/document-id.validation.js. Không ghi DB Atlas trong thay đổi này; kiểm thử transaction dùng DB loopback riêng.
