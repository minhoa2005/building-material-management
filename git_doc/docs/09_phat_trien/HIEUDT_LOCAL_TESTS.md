# Kiểm thử local ba iteration HieuDT — 10/11/2026

Đọc [phạm vi và hợp đồng](../08_api/HIEUDT_ITERATIONS_NATIVE.md) trước khi chuẩn bị dữ liệu. Không dùng DB nhóm làm nơi chạy fixture.

## Replica set riêng

Test `hieudt-iterations.integration.test.js` được bật bằng `RUN_HIEUDT_TESTS=1`. Đích cố định `127.0.0.1:27018`, replica set `hieudt-test`, DB tên `hieudt_test_<ObjectId>`. Hook teardown kiểm prefix trước khi xóa DB tạm. `native-api.integration.test.js` khi có cùng cờ dùng replica set này và prefix `wmsd_api_test_`; không đổi instance 27017.

Chuẩn bị một thư mục dữ liệu trống riêng, chạy MongoDB với `--port 27018 --bind_ip 127.0.0.1 --replSet hieudt-test --dbpath <test-data-dir> --logpath <test-log-file>`. Trên Windows dùng Start-Process -WindowStyle Hidden. Khởi tạo một lần bằng admin command `replSetInitiate` với cấu hình `{_id:'hieudt-test',members:[{_id:0,host:'127.0.0.1:27018'}]}`; chờ PRIMARY. Không thay cấu hình DB đang dùng.

Tại BE, PowerShell:

```powershell
$env:RUN_HIEUDT_TESTS='1'
node --test test/hieudt-iterations.integration.test.js
$env:RUN_NATIVE_API_TESTS='1'
node --test test/native-api.integration.test.js
Remove-Item Env:RUN_HIEUDT_TESTS, Env:RUN_NATIVE_API_TESTS
npm test
npm run docs:check
```

Tại FE:

```powershell
npx tsc --noEmit
npx vitest run src/features/sales-execution/pages.test.tsx src/app/routeAccess.test.ts src/features/location-moves/live/presentation.test.ts src/features/operational-reports/live.test.ts
npm run build
```

## Loại bằng chứng

Suite HieuDT kiểm tạo nguồn SO/replay/trùng, sửa-hủy/cam kết, tạo OD đồng thời, nhiều nhiệm vụ không giữ hàng hai lần, soạn từng phần/đúng người/khóa kiểm kê/lượng nguyên, giao bù-hủy chung hạn mức, chốt kiểm kê không lệch/DELTA/RECLASS với count mới và rollback, báo cáo thật và HTTP auth/DTO/validation. Native suite kiểm BF03/BF04 và mua/nhập/đảo theo main; không dùng kết quả này thay cho chứng minh các UC chưa được gọi.

Suite mặc định có các integration bị skip theo cờ và live Cloudinary test chưa bật. FE tests kiểm list thực, retry payload, quyền route và CSV. Build/typecheck không chứng minh thao tác đầy đủ trong browser. Không seed hoặc sửa dữ liệu shared/Atlas. Kết quả thực từng lần ghi ở [change_logs](../../change_logs.md).
