# Iteration 1 native — setup và chuyển dữ liệu

Đọc [contract và lệnh dry-run](../08_api/ITERATION1_NATIVE_2026-11-06.md). Chỉ dùng DB local thử riêng, không ghi demo/Atlas. Test native tạo DB ngẫu nhiên wmsd_api_test_* trên 127.0.0.1:27017 replicaSet rs0 và dọn đúng DB này sau chạy.

PowerShell: `$env:RUN_NATIVE_API_TESTS="1"`; `node --test test/native-api.integration.test.js test/native-catalogue-migration.test.js`. API ví dụ dùng RR/PO mã sinh RR-<ObjectId>/PO-<ObjectId>, không có mã cố định để giả lập nguồn thật. Cần replica set local sẵn sàng.

Migration --apply bổ sung catalogue permission và quyền mặc định cho role có sẵn bằng addToSet, không tạo role hay xóa quyền tùy chỉnh. Đã dry-run/apply thử DB local riêng: 3 đơn vị/111 permission, dọn DB sau test. [Kết quả kiểm chứng](../08_api/ITERATION1_NATIVE_VERIFICATION.md).
