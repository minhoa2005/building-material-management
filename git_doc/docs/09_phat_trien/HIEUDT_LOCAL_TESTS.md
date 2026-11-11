## Migration Atlas receipts — 12/11/2026

Migration được thực hiện bằng scripts/migrate-receipts-to-goods-receipts.mjs. Dry-run phát hiện 7 phiếu và 21 liên kết legacy. Apply đã đổi documentKind, giữ _id/documentNo, chuyển sourceType/subjectType/subjectCollection/documentType sang goods_receipts, tạo goods_receipts/uoms/conversions và index, xác minh referencesAfter=0 rồi drop 4 collection legacy. Kết quả Atlas wmsd_database: 58 collections; goods_receipts gồm PURCHASE=1, CUSTOMER_RETURN=1, FAILED_DELIVERY=1, TRANSFER=4; purchase_receipts/customer_return_receipts/failed_delivery_receipts/transfer_receipts không còn. Script yêu cầu đúng database name và cờ --allow-atlas; chạy lại idempotent.

## Định danh chứng từ — kiểm chứng 12/11/2026

Mã tạo mới được kiểm trên test/document-number.test.js: YYYY cũ không còn dùng; ngày local tạo YYMMDD, _id trùng documentNo, số tăng cạnh tranh trong transaction, rollback không tiêu số, không tạo document_sequences. test/document-identities.test.js đạt 4/4: root document dùng DocumentIdentity, source/subject/reservation/transaction refs nhận mã hoặc ObjectId lịch sử, catalogue/item IDs vẫn ObjectId, _id bất biến. Native 15/15 và HieuDT scope2/2 đã chạy lại với mã chuỗi trên DB tách biệt loopback27018.

## Kiểm chứng phạm vi 20 UC mới — 12/11/2026

[Hợp đồng hiện hành](../08_api/HIEUDT_WAREHOUSE_SCOPE.md). Test mới test/hieudt-scope.integration.test.js dùng RUN_HIEUDT_SCOPE_TESTS=1, URI cố định loopback27018/hieudt-test, DB ngẫu nhiên prefix wmsd_hieudt_scope_test_; teardown kiểm prefix rồi drop đúng DB. Giữ đầy đủ collection/index, không dùng DB app hoặc dữ liệu nhóm. Phạm vi: location create/replay/update/stale/freeze/scope; inventory và Sales redaction; TR revise/update/approve; reservation draft/cancel/recreate; pick/handover; độc lập nhận GOOD+DAMAGED; linked difference review; good putaway; close và ledger/progress. Kết quả cuối2/2 pass, không skip.

Kiểm tra BE mặc định npm test:110 pass,0 fail,80 integration skip (190 tổng). Các bộ có cờ bật chạy riêng; không cộng các bài skip thành pass. FE các màn native mới, BF03/BF04, route/session và MovementList:41/41 pass; lint file liên quan, typecheck/build đạt. Full FE lần rà đầu437 pass/24 fail (prototype cũ, products/lots/issue/replenishments và session stub đã đổi route); lint toàn FE còn59 lỗi,13 warning trong các module ngoài native warehouse-stock/BF03/BF04. Không khẳng định toàn FE xanh. Browser desktop và viewport390x844 đã xem danh sách kho/vị trí, tồn, nhật ký, bảng tiến độ transfer hoàn thành; không chạy browser mutation trên DB nhóm.

Chạy scope integration từ PowerShell BE:

```powershell
$env:RUN_HIEUDT_SCOPE_TESTS='1'
node --test test/hieudt-scope.integration.test.js
Remove-Item Env:RUN_HIEUDT_SCOPE_TESTS
```

Hồi quy native cuối15/15 pass,0 fail,0 skip (410.8 giây, phần lớn khởi tạo đầy đủ collection/index). Ca toàn hàng lỗi xác nhận createRequirement bị từ chối, không tạo ITR/TO, vẫn đóng TR khi transit bằng0 và các điều kiện khác đã đủ. Đã kiểm chỉ đọc trên DB review rằng Sales options không trả tồn/địa điểm/nguồn tác nghiệp. Giữ các báo cáo ngày trước như lịch sử, không dùng thay bằng chứng của code mới.

## Local review for manual testing — 11/11/2026

User requires local review before any rollout of units/conversions to wmsd_database. Local review DB: mongodb://127.0.0.1:27018/wmsd_hieudt_local_20261111?replicaSet=hieudt-test. Source is the existing standalone local wmsd_demo_tile_shop_v8 at port 27017, copied read-only into a new DB; it is not a live snapshot of the shared DB. The local copy receives the active Viên/BOX UOMs, 38 batch carton conversions derived from verified packaging, 5 FE email preset accounts, and warehouse2@ceratile.vn as an independent local receiving tester. Source DB and shared wmsd_database remain unchanged.

Replica set 27018 is named hieudt-test and PRIMARY; standalone 27017 cannot be made transactional by appending replicaSet=rs0 to the URI. Keep the standalone instance intact. In BE run npm run dev:hieudt-local to start port 3001 with a hard-coded local-only URI and no startup seed/password sync. FE .env.development.local has VITE_API_PROXY_TARGET=http://127.0.0.1:3001; normal default remains port 3000. Restart Vite after changing this local-only setting. Local test account passwords match current FE/SEED_ACCOUNTS presets. The receiver warehouse2@ceratile.vn uses Kho2@12345678 and inherits thukho02 warehouse scope. No shared rollout until user checks and explicitly approves.

Cập nhật 11/11: thêm test/document-number.test.js. Bật RUN_HIEUDT_TESTS=1 để kiểm lấy mã cuối +1, tạo đồng thời, rollback và tách tháng trên DB tạm hieudt_numbers_<ObjectId> tại replica set test. Mã cũ không bị đánh lại. Collection kỹ thuật document_sequences cần được tạo trước transaction đầu tiên.

# Kiểm thử local ba iteration HieuDT — 10/11/2026

Đọc [phạm vi và hợp đồng](../08_api/HIEUDT_ITERATIONS_NATIVE.md) trước khi chuẩn bị dữ liệu. Không dùng DB nhóm làm nơi chạy fixture.

## Bật lại replica set hiện có trên máy này

Đã xác minh port 27018 có setName hieudt-test, isWritablePrimary=true. Port 27017 là standalone; thêm replicaSet=rs0 vào URI không cấu hình được server. Nếu instance 27018 đã chạy thì chỉ cần dùng URI đúng ở trên. Khi cần khởi động lại instance đã cấu hình, mở PowerShell riêng và chạy:

```powershell
& 'C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe' --dbpath 'E:\Doan\outputs\hieudt-number-mongo' --port 27018 --bind_ip 127.0.0.1 --replSet hieudt-test --wiredTigerCacheSizeGB 1
```

Giữ terminal đó chạy. Trong MongoDB Compass kết nối URI local, mở MongoDB Shell rồi dùng db.adminCommand({hello:1}) hoặc rs.status(). Một thư mục dữ liệu mới chỉ cần khởi tạo một lần với rs.initiate({_id:'hieudt-test',members:[{_id:0,host:'127.0.0.1:27018'}]}); thư mục hiện có đã khởi tạo nên không cần chạy lại. Chờ isWritablePrimary=true trước khi dùng transaction.

## Kết quả kiểm tra local thực — 11/11/2026

FE3334 proxy sang BE3001, health có header X-WMSD-Review-Database=wmsd_hieudt_local_20261111. Hai script check-bf03-local.mjs và check-bf04-local.mjs từ chối chạy nếu proxy không có dấu local này. Các script chỉ mở URI local cố định và tạo chứng từ/vị trí thử; không chạy với DB shared.

BF03 tạo LCV–K-GACH-01–202611–000001, chuyển 1 thùng = 8 viên vào BF03-LOCAL-DEST; tạo lệnh chưa đổi tồn, xác nhận ghi 1 ledger, retry không ghi lần hai; số thập phân và tách 1 viên bị từ chối 400. BF04 tạo YCĐC–K-GACH-01–202611–000001, chuyển tiếp 8 viên sang kho02 qua đầy đủ tạo/duyệt/xuất/pick/nhận/putaway/đóng, trạng thái COMPLETED; người nhận warehouse2 khác người gửi warehouse. Dữ liệu thử được giữ trong local để người dùng xem. Native cuối 15/15 pass; FE component 10/10; typecheck và production build đạt. Đây là kiểm API qua proxy và component, chưa kiểm browser E2E vì truy cập trình duyệt đang tắt trong Work.

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
