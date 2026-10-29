# Kết quả kiểm chứng — 29/10/2026

- Acceptance FE-06: **4/4 pass**, không skip/cancel; gồm hai integration suite
  HTTP + MongoDB và hai bộ validation. Kiểm tra nguồn trùng, gửi đồng thời cùng
  key, rollback, scope theo Sales/kho, dữ liệu đọc không thay tồn, FD/replacement,
  reversal, quy đổi và truy cập bằng chứng riêng tư.
- Regression không dùng DB: **63 pass, 10 skip, 0 fail**. Các integration suite
  của module khác không được chạy lại ở lượt này.
- Cloudinary live smoke: **1/1 pass**. Upload ảnh tổng hợp, tải bằng chữ ký,
  từ chối tải không chữ ký, xoá đúng ảnh test.
- Gói collection: **23 HTTP checks thực tế đạt** trên database demo riêng,
  bao gồm upload thật và GET signed evidence URL. Xem verified-demo-result.json.
- `git diff --check`: đạt.

Các lượt setup test ban đầu bị timeout khi dựng/dọn database. Harness cuối tạo
index theo lô, chỉ tạo unique indexes cần kiểm tra, đóng hết kết nối HTTP khi
teardown; acceptance sau chỉnh sửa đã đạt. Không bỏ các kiểm tra uniqueness,
authorization hoặc transaction để vượt qua test.

Server test chạy localhost:3016, DB wmsd_fe06_thunder. Không sửa database từ
MONGODB_URI của dự án. Các database ngẫu nhiên được dùng cho acceptance đã được
dọn riêng; dữ liệu demo để test thủ công được giữ lại.

Đây là BE Iter 1 UC-46/47/49/50. FE Warehouse Staff đã tích hợp các API đọc
UC-46/49/50; form tạo Sales Order UC-47 trên FE chưa tích hợp. Sự kiện SALES_ORDER_SAVED được
lưu đúng transaction nhưng consumer đánh giá thiếu/notification (UC-103 và nhóm
notification) chưa được triển khai ở codebase. Ảnh upload bỏ dở chưa có job dọn.
Không khẳng định luồng WIR→OD→PGI→POD đã được code đầy đủ từ các API đọc này.
