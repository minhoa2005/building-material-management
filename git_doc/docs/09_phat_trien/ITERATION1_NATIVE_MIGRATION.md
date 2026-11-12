# Iteration 1 native — setup và chuyển dữ liệu

Đọc [contract và lệnh dry-run](../08_api/ITERATION1_NATIVE_2026-11-06.md). Chỉ dùng DB local thử riêng, không ghi demo/Atlas. Test native tạo DB ngẫu nhiên wmsd_api_test_* trên 127.0.0.1:27017 replicaSet rs0 và dọn đúng DB này sau chạy.

PowerShell: `$env:RUN_NATIVE_API_TESTS="1"`; `node --test test/native-api.integration.test.js test/native-catalogue-migration.test.js`. API ví dụ dùng RR/PO mã sinh RR-<ObjectId>/PO-<ObjectId>, không có mã cố định để giả lập nguồn thật. Cần replica set local sẵn sàng.

Migration --apply bổ sung catalogue permission và quyền mặc định cho role có sẵn bằng addToSet, không tạo role hay xóa quyền tùy chỉnh. Đã dry-run/apply thử DB local riêng: 3 đơn vị/111 permission, dọn DB sau test. [Kết quả kiểm chứng](../08_api/ITERATION1_NATIVE_VERIFICATION.md).

## Bổ sung quyền Iteration 1 trên DB local đã có dữ liệu

Chạy dry-run với DB đích được ghi rõ. Ví dụ kiểm tra `sep490` hiện có trên máy local.

```powershell
node scripts/sync-iteration1-permissions.mjs --uri=mongodb://127.0.0.1:27017/sep490
```

Kết quả gồm catalogue thiếu, quyền vô hiệu hóa, grant mặc định chưa có hiệu lực, tham chiếu hỏng và danh sách thay đổi dự kiến. Script chỉ nhận một endpoint loopback với tên DB ứng dụng rõ ràng. Thêm `--apply` vào lệnh khi đã chọn đúng DB đích, có unique index `permissions.code` và MongoDB hỗ trợ transaction.

Transaction chỉ tạo các mã còn thiếu trong nhóm `uom:read/create/update/activate`, `purchase_custody:decide/execute` và `stock_reversal:approve`, rồi thêm grant mặc định tương ứng cho role hệ thống hiện hữu. Role tùy chỉnh, grant đã có, quyền đã bị thu hồi và các cảnh báo ngoài bảy mã được giữ nguyên. Kiểm lại bằng dry-run sau apply. Lệnh này chỉ đồng bộ quyền. Xác minh migration model riêng trước khi chạy runtime native trên một DB cũ như `sep490`.

## Danh mục đơn vị

Script mặc định bổ sung Viên, Thùng và Mét vuông (mã `M2`). Mã đơn vị lịch sử đang được sản phẩm hoặc dòng chứng từ tham chiếu vẫn có trong kế hoạch để các bản ghi đó đọc được.
