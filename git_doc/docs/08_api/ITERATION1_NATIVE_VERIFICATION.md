# Kiểm chứng triển khai native Iteration 1 — 06/11/2026

Đã giải quyết 5 conflict trên nền main 49d0aac; không tạo merge commit. Giữ nguyên product.mapper.js và các tài liệu/test untracked ngoài phạm vi. Không đổi FE runtime. Model mới 60 collections, thêm Uom, metadata, quyết định giữ hộ và provenance bao bì trên movement. Contract: [Iteration 1 native](ITERATION1_NATIVE_2026-11-06.md).

## Kết quả thực chạy

- Bộ BE hiện hành (các test có trong index Git và test migration mới), RUN_NATIVE_API_TESTS=1: 84 tests; 75 pass, 9 skip, 0 fail. Có HTTP thực bằng Express/fetch và MongoDB replica set rs0 tại 127.0.0.1:27017, DB wmsd_api_test_<random> riêng, dọn sau test.
- Test native gồm mua/nhập/cất từng phần; Warehouse đảo trực tiếp có replay; chuyển kho đầy đủ; hàng mở phải khai quy cách thực đo; giữ hộ → nhập sở hữu → đảo → trả NCC; replay RR mất scope; HTTP UOM/NCC/product/ẩn giá; kiểm lại chất lượng/role/evidence/stale/concurrent custody; tranh chấp RR→PO và rollback khi freeze.
- Test migration pure: giữ lịch sử, báo nhiều PO cho RR, map NCC và từ chối remote/shared DB trước kết nối.
- Thử migration dry-run rồi --apply trên wmsd_migration_test_<timestamp> mới: 3 đơn vị, 111 permission; sau đó dọn chính DB thử. Không ghi Atlas/demo. Migration bổ sung permission và quyền mặc định vào role hiện có bằng addToSet, giữ quyền tùy chỉnh.
- npm run docs:check đạt: 3 instruction files đồng nhất, 60 collections, liên kết và changelog signals.
- npm test quét cả test local chưa commit: hai file iteration1-foundation.test.js và iteration1-master.integration.test.js vẫn import src/migrations/iteration-1.js hoặc src/seeds/data/demo.data.js đã bị main xóa. Giữ nguyên các file này; không coi lỗi import đó là test nghiệp vụ đã chạy. Không khôi phục persistence cũ để làm chúng pass.

## Giới hạn

9 test bị skip theo điều kiện môi trường riêng; chưa kiểm FE/browser, Cloudinary live, tải thực, Atlas hoặc toàn bộ nghiệp vụ ngoài các router trong scope. FE cũ chưa tương thích API native. Không tự commit/push; merge còn cần commit được người dùng cho phép sau review.

Full npm test cuối với RUN_NATIVE_API_TESTS=1: 87 tests, 76 pass, 2 lỗi import legacy untracked, 9 skip. Bộ hiện hành không gồm hai file legacy đó: 84 tests, 75 pass/9 skip/0 fail. Những lần chạy trước thêm test được thay bằng kết quả cuối này.

## 07/11/2026 — Rà và sửa phân quyền BE

Thay đổi thực hiện trên `minhtd` sau khi fast-forward tới `origin/main` tại `756e23a`, theo kế hoạch BE đã được người dùng xác nhận.

| Phần | Trước | Sau |
|---|---|---|
| Đơn bán và lệnh giao | Role tùy chỉnh có quyền đọc có thể lọt qua điều kiện kiểm đúng mã WAREHOUSE. | Role tùy chỉnh chỉ đọc hồ sơ có yêu cầu xuất thuộc kho được giao. Lệnh giao cũng phải thuộc kho được giao. DTO lọc giá và thông tin bằng chứng nội bộ. Tải ảnh nguồn SO trả 404 cho role tùy chỉnh. |
| Middleware và upload | Route khai báo danh sách role bị bỏ qua. Upload chung không xác thực. Router hàng lỗi và trả hàng áp xác thực cho cả đường dẫn khác dưới `/api`. | Route dùng mã permission hiệu lực và kiểm scope riêng ở service. Upload chung trả 404, upload nghiệp vụ có xác thực và quyền. Health và login đến đúng router. |
| Chọn lô khi lập/sửa RR | Form gọi danh mục lô và Sales nhận 403. | BE có `GET /api/replenishments/options/lots` theo quyền RR, kho nhận và sản phẩm. Chỉ trả thông tin quy cách của lô VERIFIED. |
| Bộ lọc NCC trên PO | Danh sách PO gọi danh mục NCC và Warehouse nhận 403. | BE có `GET /api/purchase-orders/supplier-options` theo quyền xem PO và phạm vi kho. Chỉ trả ID, mã và tên từ snapshot trên PO, gồm NCC lịch sử. |
| Quyền thiếu trong DB cũ | Đồng bộ role chỉ cập nhật khi bản ghi permission đã tồn tại. | Script dry-run báo sai lệch. Apply theo transaction chỉ thêm tối đa bảy mã trong đợt này và các grant mặc định của mã vừa thêm. |

Chạy dry-run read-only trên cả hai DB local. Đích trong `.env` có 0 mã thiếu, 0 grant mặc định thiếu, 0 quyền inactive và 0 tham chiếu hỏng. `sep490` vẫn thiếu bảy mã, gồm bốn quyền UOM, hai quyền giữ hộ và quyền duyệt đảo tồn lịch sử. Apply chỉ chạy trên fixture `wmsd_api_test_*`, tạo bảy mã ở lần đầu và không có thay đổi ở lần hai. Fixture xác nhận grant thu hồi, role tùy chỉnh, quyền inactive và tham chiếu hỏng được giữ nguyên.

Kiểm thử BE tập trung đạt **37/37**, gồm HTTP phân quyền, hai API lựa chọn, transaction đồng bộ quyền, RR–PO–nhập–xếp hàng, trả hàng, đăng xuất và validation đơn bán. Bộ test dùng replica set local `rs0` trên cổng 27017 và replica set tạm `wmsd_model_tests` trên cổng 27028. DB test được dọn sau khi chạy. `npm run docs:check` và `git diff --check` đạt.

```powershell
$env:RUN_NATIVE_API_TESTS = '1'
$env:RUN_RETURNS_NATIVE_TESTS = '1'
node --test test/backend-permissions.integration.test.js test/native-api.integration.test.js test/native-catalogue-migration.test.js test/return-workflows.integration.test.js test/auth-logout.test.js test/sales-validation.test.js
npm run docs:check
git diff --check
```

Hợp đồng cho FE ở [RR coverage](REPLENISHMENT_COVERAGE.md) và [Iteration 1 native](ITERATION1_NATIVE_2026-11-06.md). [Hướng dẫn đồng bộ quyền](../09_phat_trien/ITERATION1_NATIVE_MIGRATION.md) ghi lệnh và điều kiện chạy. Hai request phụ 403 trên giao diện vẫn phụ thuộc đợt FE chuyển sang API mới. Kiểm upload bằng HTTP và URL ký bằng cấu hình fixture, chưa gửi tệp tới Cloudinary.

## 07/11/2026 — Nối frontend sau khi tái hiện 403

- Form RR bỏ request danh mục lô toàn cục. FE tải lô theo kho, sản phẩm và RR đang sửa, dùng phân trang của API. BE kiểm quyền sửa cho cả hai query tùy chọn khi có `requestId`. Test HTTP xác nhận role bị thu hồi quyền tạo vẫn sửa được RR của mình nếu còn quyền update và bị chặn khi đọc tùy chọn cho RR của người khác.
- Bộ lọc PO dùng endpoint NCC theo PO. Tab kiểm nhận dùng `batches` từ `inspection-context`, nên Accountant xem được lô của chuyến trong phạm vi PO. Chuẩn hóa DTO PO, chứng từ nhận và put-away cho các màn này.
- Route và sidebar kiểm grant cho RR, PO, phiếu nhập, UOM, lô và NCC. Chi tiết lô chỉ tải biến động nếu có quyền đọc biến động. Chi tiết NCC kiểm riêng quyền đọc PO, GR và phiếu trả. Admin dùng các grant thực tế.
- Giữ hộ, đảo nhập và put-away tách quyền từng thao tác. BE trả capability ghi theo kho và điều kiện post/đảo; modal dùng bằng chứng gắn vào đúng chứng từ và giữ payload khi thử lại kết quả chưa rõ.
- Kiểm đọc trên `wmsd_api_test_6aedf823b3e33975e06c07d1` qua Express với đúng vai trò. Sales dùng API lô RR được 200 và 2 lô, Warehouse dùng bộ lọc PO được 200 và 1 NCC, Accountant dùng inspection context được 200 và 3 lô. Endpoint danh mục lô vẫn trả 403 cho Sales theo quyền hiện hành. DB ứng dụng chỉ được đọc.
- Kiểm thử tập trung đạt 49/49 FE trên tám file, gồm RR, PO, route/phiên, lô và NCC. Build FE và `docs:check` đều đạt. Hai suite BE `test/backend-permissions.integration.test.js` và `test/native-api.integration.test.js` đạt 15/15 với `RUN_NATIVE_API_TESTS=1`. Chưa kiểm trên trình duyệt live hoặc thử upload tệp thật. FE triển khai trên checkout hiện tại theo quyết định của người dùng, để tích hợp main sau.
