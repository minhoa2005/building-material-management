## 07/11/2026 — Sửa danh mục khi tạo sản phẩm

- Form tạo sản phẩm lấy danh mục đang hoạt động từ API tùy chọn, bắt buộc chọn và gửi ObjectId tương ứng. Đơn vị gốc gửi mã UOM. Giữ nguyên API, model và dữ liệu. [Hợp đồng Iteration 1 native](docs/08_api/ITERATION1_NATIVE_2026-11-06.md).
- Sáu test form đạt, gồm kiểm giá trị danh mục, mã UOM, yêu cầu chọn danh mục và hiển thị lỗi `body.categoryId` tại ô phân loại. Kiểm thử form dùng fixture API.

## 07/11/2026 — Sửa các request frontend gây 403

- Chuyển form RR sang API lô theo kho/sản phẩm, bộ lọc PO sang NCC theo PO và tab kiểm nhận sang danh sách lô trong inspection context. Thêm ngữ cảnh sửa RR cho API tùy chọn và capability theo kho cho chứng từ nhận mua.
- Route, sidebar và các request phụ dùng grant phù hợp. Tách quyền từng thao tác UOM, giữ hộ, đảo nhập và put-away. Bổ sung chọn/gắn bằng chứng và giữ payload khi retry.
- Kiểm chứng 49 test FE và 15 test BE tập trung, cùng kiểm HTTP chỉ đọc trên DB local đang dùng. Giữ worktree FE hiện tại theo quyết định người dùng và để tích hợp main sau. [Báo cáo trước/sau và giới hạn](docs/08_api/ITERATION1_NATIVE_VERIFICATION.md).

## 07/11/2026 — Sửa phạm vi phân quyền backend và bổ sung API lựa chọn

- Theo kế hoạch BE được người dùng duyệt, dùng permission hiệu lực ở route và kiểm scope ở service. Role tùy chỉnh đọc SO/lệnh giao theo kho được giao và nhận DTO đã lọc giá, tham chiếu, bằng chứng. Gỡ upload chung và giới hạn xác thực của router trả hàng vào route thuộc nhóm.
- Thêm endpoint chọn lô theo quyền RR và endpoint lọc NCC theo quyền PO. FE nối hai endpoint trong đợt sau. Contract tại [RR coverage](docs/08_api/REPLENISHMENT_COVERAGE.md), [Iteration 1 native](docs/08_api/ITERATION1_NATIVE_2026-11-06.md) và [native runtime](docs/08_api/NATIVE_MODEL_RUNTIME.md).
- Thêm [lệnh đồng bộ quyền local](docs/09_phat_trien/ITERATION1_NATIVE_MIGRATION.md) và test HTTP/transaction. Dry-run xác nhận DB cấu hình đủ quyền, `sep490` thiếu bảy mã. Apply chỉ dùng fixture cô lập. Hành vi trước/sau và kết quả thực chạy ở [báo cáo kiểm chứng](docs/08_api/ITERATION1_NATIVE_VERIFICATION.md).

## 2026-11-07 — Trungph native return workflows, iterations 1–3

User requested implementation and branch pushes for merge review; explicitly confirmed Accountant historical-source verification with uploaded evidence. Ported defects/proposals/decisions/execution, CR custody/assessment/acceptance/receipt/handback, FD receipt and atomic reopening, supplier agreements/dispatch/ACK correction/closure, lot trace and external references to the current registry. Removed the replaced generic services. Added native transaction/HTTP/regression tests and frontend embedded-record mapping, permissions, packaging, recipients and historical evidence forms. Shared commands expose the actual operation ID to claim writers; quantity holds and ownership/packaging use native balances and transactions. No Atlas data/configuration/index change. See [canonical contract](docs/08_api/RETURN_WORKFLOWS_NATIVE.md) for scope, additive fields, migration limits and verification commands. Broader new-SO source decisions remain separate from historical CR verification.

## 07/11/2026 — Seed khởi động database tự động và phân quyền chuẩn 60 models

- Nguồn quyết định: Yêu cầu đọc toàn bộ models hiện tại và tạo file seed khởi động database, tự động kiểm tra database đã có dữ liệu chưa; chỉ chạy seed khi DB hoàn toàn trống và đảm bảo phân quyền chuẩn theo tài liệu dự án.
- Phân quyền & Tài khoản: Cấp chuẩn 5 vai trò (ADMIN, OWNER, SALES, WAREHOUSE, ACCOUNTANT) theo `de_xuat_quy_trinh_2_VI.md` §3 & §6. Danh mục 77+ quyền nghiệp vụ chuẩn (gồm các quyền mới native UOM, custody, reversal, exception chốt thiếu PO, hủy putaway). Bổ sung đầy đủ 6 tài khoản chuẩn `SEED_ACCOUNTS` (`admin@ceratile.vn`, `owner@ceratile.vn`, `sales@ceratile.vn`, `warehouse@ceratile.vn`, `warehouse2@ceratile.vn`, `accountant@ceratile.vn`) băm mật khẩu bcrypt cost 10, gán role và kho tương ứng (giữ nguyên quy tắc người nhận khác người xuất giữa 2 tài khoản kho).
- Cơ chế khởi động: Thêm `src/seeds/seed.js` và cập nhật `src/seeds/index.js`, `src/index.js`. Khi server khởi động và kết nối MongoDB, hệ thống tự động kiểm tra `databaseHasData(db)`: nếu DB đã có dữ liệu sẽ ghi log bỏ qua; nếu DB trống sẽ tự động khởi tạo collections, indexes và insert đầy đủ dữ liệu 60 models (hỗ trợ cả standalone MongoDB và Replica Set/Atlas qua transaction).
- Kiểm chứng: Thêm `test/database-seed.test.js` (3 test qua); toàn bộ 24 test liên quan (rebuild demo, model files, password migration) tiếp tục qua 100%. `npm run docs:check` qua.

## 07/11/2026 — Tích hợp chống trùng RR theo nguồn

- Nguồn quyết định: người dùng yêu cầu triển khai toàn bộ kế hoạch RR coverage; RR thủ công tương tự cần cảnh báo, xác nhận độc lập và giải trình. Không tự xử lý D07/D08, không thêm module kiểm kê vận hành.
- BE: evaluator SO/WIR/ngưỡng/kiểm kê đã chốt; canonical nguồn xuyên kho, chia pool tồn chung, RR→PO→tồn một lần, hàng lỗi/freeze và ledger giao thất bại/đảo. Source/token/snapshot gửi duyệt, hủy/rút RR, recheck PO một phần và giải phóng approval chưa đặt khi PO kết thúc. Shared command guard + thay ngưỡng/sản phẩm/lô dùng cùng khóa SO/kho/sản phẩm, retry và OperationRecord; audit dry-run local có kiểm read-only.
- FE: form native enteredUnit/lotId/source/evaluation, cảnh báo nhu cầu độc lập, giữ input khi409 và nguyên key/payload khi kết quả chưa rõ. Detail/PO có bước xác nhận lại nguồn; DTO giữ snapshot đầy đủ, ngày cần theo Saigon; phép đổi lượng duyệt dùng decimal chính xác thay vì làm tròn đơn vị gốc. Test danh sách kiểm đúng từng row khi trùng tên kho/sản phẩm.
- Tài liệu: [contract RR](docs/08_api/REPLENISHMENT_COVERAGE.md), native runtime, PROJECT_GUIDE/MODEL_MAP, G05/H01, dictionary/schema hiện hành, model changelog và context FE/BE. 60 collections/97 nested schemas; không tạo collection policy/conversion.
- Kiểm chứng cuối: bốn suite integration native/RR local 24/24 qua; FE focus 46/46 ở9 file qua. Build/typecheck, lint9 file mới/sửa và docs:check đều qua.
- Full BE npm test:70 qua/32 bỏ qua/2 file lỗi import src/migrations/iteration-1.js và src/seeds/data/demo.data.js không có trong checkout. Full FE lượt kiểm rộng:342 qua/25 lỗi; sau đó sửa assertion RR list và focused qua, chưa tuyên bố toàn suite xanh. Nhiều lỗi còn ở receiving fixture dùng endpoint cũ và timeout, không sửa ngoài phạm vi.
- Browser local: mở trang RR bị chuyển login; tài khoản demo kho báo sai thông tin, không đổi mật khẩu/data để vượt qua. Chưa xác nhận visual QA form thật; test component/API không thay bằng chứng đó.
- Dữ liệu/Git: chỉ ghi database test local ngẫu nhiên và xóa đúng test DB. Không rollout/migrate dữ liệu đang dùng, không commit/push; giữ thay đổi có sẵn. Lock mọi kho cho sản phẩm liên quan để bảo vệ nguồn khác kho, có đánh đổi tranh chấp theo sản phẩm. Instrumentation qua diagnostics_channel không chứa dữ liệu riêng tư.

## 07/11/2026 — Tự đồng bộ mật khẩu seed khi khởi động

- Theo yêu cầu, `src/index.js` gọi `src/config/seed-password-startup.js` sau kết nối và seed tùy chọn, trước khi mở API; chỉ chạy với MongoDB loopback đã kết nối và `NODE_ENV` khác `production`. Mỗi lần khởi động đưa mật khẩu user seed về giá trị trong source; lỗi đồng bộ chặn mở cổng. Kết nối ban đầu thất bại hoặc remote thì bỏ qua, không tự thử lại sau khi kết nối phục hồi.
- Cập nhật [hướng dẫn](docs/09_phat_trien/SEED_PASSWORD_MIGRATION.md); kiểm tra `node --test test/seed-password-migration.test.js` (3 test thành công với collection giả). Chưa ghi DB hoặc kiểm tra API đăng nhập.

## 07/11/2026 — Migration mật khẩu theo tài khoản seed

- Yêu cầu: đồng bộ mật khẩu user với `src/seeds/data/accounts.data.js` trên database local dev/test.
- Thêm `scripts/migrate-seed-passwords.mjs`: xem trước mặc định, `--apply` băm bcrypt cost 10 cho các username seed hiện có và chưa khớp; không tạo user, không sửa trường khác. Từ chối DB không phải loopback, kiểm tra username trùng, không thu hồi token; ghi từng user nên có thể cần chạy lại sau lỗi.
- Hướng dẫn và giới hạn tại [SEED_PASSWORD_MIGRATION](docs/09_phat_trien/SEED_PASSWORD_MIGRATION.md). Test logic bằng `node --test test/seed-password-migration.test.js` (2 test thành công, collection giả); chưa ghi DB hoặc kiểm tra API đăng nhập.

## 07/11/2026 — Script đặt lại mật khẩu database test local

Theo yêu cầu tạo và chạy script cho `wmsd_api_test_6aedf823b3e33975e06c07d1`, thêm `scripts/reset-test-user-password.mjs` và [hướng dẫn chạy](docs/09_phat_trien/RESET_TEST_USER_PASSWORD.md). Script mặc định xem trước; `--apply` băm bcrypt cost 10 và chỉ cập nhật `passwordHash` của một trong bốn user được chỉ định trên localhost. Đã kiểm tra xem trước, từ chối user không hợp lệ và thiếu mật khẩu; đã cập nhật cả bốn user và đối chiếu bcrypt thành công. Chưa kiểm thử đăng nhập qua API.

# 06/11/2026 — Iteration 1 native theo kế hoạch được duyệt

Thêm Uom, metadata sản phẩm/NCC, xử lý giữ hộ trọn vòng đời và Warehouse tự đảo nhập. Registry 60 collections; giữ items/source/snapshot native. Quyết định mới trong git_doc/docs/08_api/ITERATION1_NATIVE_2026-11-06.md. Có migration dry-run chỉ test DB local; không chạy Atlas, không commit/push. Kết quả kiểm thử ghi trong tài liệu bàn giao cùng đợt.

## 2026-11-06 — Đồng bộ runtime theo model mới (đang kiểm chứng)

Theo xác nhận trực tiếp của người dùng: bỏ ba thư mục model và danh sách phụ thuộc đã rà. 59 collection + 96 nested schema chuyển về src/models; services/DTO/permissions/transaction và FE connected consumers chuyển hợp đồng native. Registry được đổi tên trung tính (`registry-entries.js`, `configureReferences`) để không còn chỉ dẫn profile cũ. Seed v9 thêm quyền mới, 642 bản ghi mẫu; không ghi DB ứng dụng hoặc remote. Xem [hợp đồng và giới hạn](docs/08_api/NATIVE_MODEL_RUNTIME.md). Ba test tích hợp native đã qua; FE build đã qua nhưng suite giao diện còn lỗi cần chuyển fixture. Chưa hoàn tất nghiệm thu/commit/push.

## 06/11/2026 — Giải quyết merge main và giữ ranh giới model

Merge baf5fb4 vào HieuDT; giữ API PO/nhận mua, auth, field sản phẩm/lô/NCC của main trong registry legacy (44 collection), giữ bộ schema/category v8 (59 collection). Union scripts/dependencies, sửa import API/test/tool và bổ sung export ReplenishmentSubmission. Fixture reviewed/migration tách khỏi seed PO_INSPECTION runtime bằng EJSON tổng hợp từ 5f4a296; schema lịch sử dùng connection riêng. Không đổi schema/ERD 59 collection, không ghi DB và không port API trong lượt này. Cập nhật MODEL_MAP, PROJECT_GUIDE, context, README và hướng dẫn MERGE_MAIN_2026-11-06. Kiểm chứng cuối ghi trong hướng dẫn merge.

# Bỏ quản lý đội xe và lưu biển số theo lần bàn giao — 05/11/2026

## 06/11/2026 — Category 1–n Product và bỏ builder không dùng (v8)

Người dùng yêu cầu bảng category, tham khảo Gạch Tốt và duyệt 5 nhóm, mỗi product 1 category. Thêm category.model.js (code unique/immutable, name, description, isActive, timestamps), products.categoryId bắt buộc ref Category và index, registry reviewed 59 collection. Profile migration lịch sử giữ hợp đồng cũ. Seed v8 gắn 18 product theo hãng/SKU: lát nền 9, ốp tường 3, trang trí 2, sân vườn 2, giả gỗ 2. Không đổi nghiệp vụ tồn, giá, lô hay quyền API; chưa làm API category.

Rà 315 file JS/MJS trong src/scripts/test: 96 schema embedded có nơi gọi; ít nhất 12 file module API dùng legacy; registry/ref/capacity/seed/migration dùng rebuild. Chỉ bỏ reviewed-events.js, reviewed-support.js, reviewed-workflows.js vì không có importer ngoài chính nhóm ba file này. Giữ các thư mục đang dùng. Báo cáo git_doc/outputs/model_folder_usage_2026-11-06.json.

Khi kiểm tra, local v7 không còn và Atlas wmsd_database đang trống; công cụ nâng v7 dừng trước ghi. Không có nguồn để bảo toàn ID v7, nên tạo mới mẫu local wmsd_demo_tile_shop_v8, rồi deploy vào Atlas rỗng: 59 collection/638 bản ghi. Đọc lại Atlas khớp hash local và toàn bộ index, schema/ref/tồn/hạn mức/sức chứa/hóa đơn. Báo cáo categories_v8_local_seed_2026-11-06.json, categories_v8_atlas_deployed_2026-11-06.json, categories_v8_atlas_verified_2026-11-06.json. Không đổi kết nối ứng dụng, không lưu URI có mật khẩu vào Git.

Bổ sung công cụ nâng category cho máy vẫn có đúng v7: chỉ thêm category/categoryId, không ghi đè dữ liệu khác; bảo vệ bằng so sánh snapshot và transaction Atlas. Nhánh nâng v7 chưa chạy thành công trên môi trường này do nguồn trống; guard và tính bảo toàn dữ liệu có test. 57/57 test DB/model/category/deploy đạt. Cập nhật MODEL_MAP, Data Dictionary 59_v8, SQL-style diagram (11 tab/493 quan hệ), context, PROJECT_GUIDE, hướng dẫn local/seed/category/Atlas, README và ba file luật giống nhau. Đã xuất và xem ảnh tab Warehouse & catalogue; tăng chiều cao theo dòng quấn và khoảng hàng để tránh cắt trường. Các báo cáo v7 giữ nguyên là lịch sử. API legacy chưa port; D07/D08 vẫn chờ; không commit/push Git.

## 06/11/2026 — Tách model từng file, seed chỉ gạch và đưa DB lên Atlas

Theo yêu cầu trực tiếp: mỗi schema hiện hành một file .model.js. 58 collection có file riêng ngay src/models; 96 schema nhúng có file riêng trong embedded, không tăng collection. reviewed-registry nạp factory mới; model cũ chuyển vào legacy cho API chưa port, rebuild giữ registry/helper/profile migration lịch sử. Không đổi trường, ref, default, index hay dữ liệu BSON sau serialize khi tách. Đã đối chiếu metadata trước/sau và hash serialize trên cùng fixture; xem git_doc/outputs/model_files_split_2026-11-06.json.

Người dùng chọn bỏ thiết bị vệ sinh. Giữ nguyên local v6, sao dữ liệu thực đang có sang v7, loại các lô/tồn/ô/điểm tồn/phiếu đầu kỳ/giao dịch/NCC liên quan, kiểm không còn tham chiếu bị bỏ; giữ ID và dữ liệu khác. Seed v7 chỉ gạch: 58 collection, 633 bản ghi, 18 sản phẩm, 39 lô. Atlas wmsd_database trước khi ghi rỗng; đã triển khai từ v7, đọc lại đối chiếu hash toàn bộ dữ liệu cùng index và kiểm nghiệp vụ; xác minh độc lập đạt. Bí mật chỉ nhận qua biến môi trường, không đưa vào Git/tài liệu. Công cụ không ghi đè đích đã có dữ liệu khác.

Cập nhật MODEL_MAP trỏ đúng 58 file, Data Dictionary v7 có sourceFile, hướng dẫn Atlas/local/seed/registry, context, PROJECT_GUIDE, ba file luật giống nhau và README. 52/52 test DB/model/deploy đạt. Full suite ở mốc trước seed v7: 114 đạt, 10 lỗi legacy (9 import thiếu src/shared/utils/domain.js, 1 fixture thiếu INTERNAL_TRANSFER_REQUIREMENT), 13 bỏ qua. Chưa port API/service, chưa đổi kết nối ứng dụng; D07/D08 vẫn chờ. Tiếp tục HieuDT không merge main theo lựa chọn đã có; không commit/push Git trong lượt này.

## 06/11/2026 — Kích thước sản phẩm, màu và thùng theo lô (v6)

Theo quyết định trực tiếp: products bỏ nominalSize, thêm dài/rộng/cao (mm) và màu bắt buộc; mỗi màu một ID, khóa hãng/SKU/màu. product_batches bỏ calibre/tone, khóa productId/manufacturerLot, số viên/thùng cố định và kích thước ngoài thực tế. Snapshot quy cách giữ trên dòng, số thùng trên lần nhập; kiểm quy cách khớp lô, cạnh thùng vừa ô và dung tích. Không suy kích thước ngoài từ thể tích viên. Helper chỉ ước tính lượng xếp được khi chưa có tọa độ/3D. Cập nhật schema, seed v6, validator, tests, dictionary, diagram, MODEL_MAP và hướng dẫn. 48 test DB/model đạt; kết quả local tại git_doc/outputs/product_carton_v6_local_2026-11-06.json. Vẫn 58 collection/654 bản ghi; DB trước giữ nguyên. API legacy chưa port, không ghi DB nhóm, không commit/push.

## 06/11/2026 — Lược trường trùng/thừa trên 58 bảng

Theo yêu cầu rà biến từng bảng: bỏ 44 đường dẫn field, giữ chức năng trạng thái và kiểm sửa đồng thời riêng. Chi tiết từng collection tại DB_Rebuild_Review/38_Ra_soat_truong_58_bang.md; dictionary v5 và diagram đã tái tạo. Seed v5 có 58 collection / 654 bản ghi. 43 test DB/model đạt, docs:check và kiểm local. Danh mục bỏ version cần API kiểm updatedAt khi port; API legacy còn riêng. Không thay DB nhóm và không commit/push.

## 06/11/2026 — Gộp tiếp 5 bảng, 63 → 58

Theo yêu cầu người dùng: movements vào stock_transactions; holds và resolutionPlans vào defect_reports; resolutionPlans vào stocktakes; deliveryConfirmations vào sales_orders. Giữ ID/lịch sử, kiểm hồ sơ cha và trùng dòng, index truy vấn, preflight BSON. Seed v4 riêng ở localhost, API legacy chưa port. Kiểm 41 test và docs:check; kết quả local ở git_doc/outputs. Người dùng chọn tiếp tục HieuDT, chưa merge 5 commit mới của main do file trùng đang sửa; không commit/push.


## 06/11/2026 — Gộp 10 collection theo duyệt của người dùng

Reviewed registry giảm 73 → 63. Giữ ID và lịch sử trong bảng cha; packagingPortions thay chồng, ô dùng chiều cao kho. Cập nhật seed v3, bộ chuyển/kiểm dữ liệu, schema refs tới phần nhúng, sơ đồ và từ điển hiện hành. Migration profile lịch sử/API legacy tách riêng. Không ghi DB nhóm. Kiểm test:db-rebuild, seed preview/local và docs:check; báo cáo ở git_doc/outputs.


Theo quyết định mới, bỏ collection/model `delivery_teams`, tham chiếu `carrierId` và snapshot tên đội. Thêm `vehiclePlate` tùy chọn trực tiếp trong header của từng lần bàn giao; chuyển đổi không đoán biển số từ carrier cũ và tạo cảnh báo khi hồ sơ nguồn có tham chiếu không chuyển được. Bộ seed mới là v2, 73 collection/849 bản ghi; không ghi đè database local v1. Tạo lại SQL-style DB diagram và cập nhật danh mục quyết định, model map, hướng dẫn DB/seed, tài liệu bàn giao và changelog. Các phiếu B08C lịch sử được giữ nhưng đánh dấu đã bị thay thế.

# DB Diagram kiểu SQL theo model hiện hành — 05/11/2026

Tạo [WMSD_SQL_Style_DB_Diagram_2026-11-05.drawio](docs/03_thiet_ke/WMSD_SQL_Style_DB_Diagram_2026-11-05.drawio) theo cách trình bày bảng như SQL/Miro: header tên collection, các trường PK/FK, kiểu dữ liệu, trường bắt buộc/tùy chọn và đường quan hệ crow's-foot. Tab `00` đặt toàn bộ 73 bảng trên một sơ đồ; 10 tab nhóm nghiệp vụ giúp đọc field và quan hệ rõ hơn. Sơ đồ được sinh trực tiếp từ 73 Mongoose model hiện hành để tránh lệch tên collection/ref. Kiểm XML đạt: 11 tab, 146 khung bảng và 502 đường quan hệ FK trực tiếp (gồm tab tổng hợp và các tab nhóm).

# Sơ đồ database chi tiết theo model hiện hành — 05/11/2026

Tạo [WMSD_DB_Diagram_2026-11-05.drawio](docs/03_thiet_ke/WMSD_DB_Diagram_2026-11-05.drawio) từ thiết kế 74 collection đã duyệt. File có 94 tab: chỉ mục, 74 collection, và 19 biến thể dòng hàng nhúng. Header phản ánh database mẫu `wmsd_demo_tile_shop` tại `localhost:27017`, 851 bản ghi seed; không dùng `_db_rebuild`. Nội dung field/ref/index kế thừa thiết kế đang được model hiện hành kiểm thử; D07/D08 và API chưa port vẫn được ghi rõ là điểm mở.

# Đưa model đã duyệt thành model chính và dùng MongoDB Compass localhost — 05/11/2026

Theo yêu cầu người dùng, `src/models/index.js` trở thành entry point của 74 collection đã duyệt qua `registerReviewedModels(connection)`. API chưa chuyển dùng rõ `src/models/legacy/index.js`; không trộn hai profile model trên một Mongoose connection. Giữ `registerMigrationModels` cho công cụ chuyển đổi cũ.

Đã bỏ hoàn toàn collection/guard `_db_rebuild`. Seed và verify chỉ kiểm đúng 74 collection nghiệp vụ, schema/index và quy tắc dữ liệu. Chuyển đích local sang `mongodb://localhost:27017/wmsd_demo_tile_shop`; kiểm tra trực tiếp MongoDB đang chạy standalone, seed đã ghi/đọc lại 74 collection và 851 bản ghi. Seed hỗ trợ standalone, còn API ghi tồn đa collection phải dùng replica set hoặc Atlas khi được port.

Kiểm chứng: `npm run test:db-rebuild` đạt 31/31; `npm run db:local:status` và `npm run db:local:seed` chạy tại localhost:27017. Cập nhật PROJECT_GUIDE, MODEL_MAP, luật agent, hướng dẫn local/seed và model changelog. API/DTO/permission/service chưa được chuyển sang model mới trong đợt này; D07/D08 tiếp tục chờ nghiệp vụ.

# Tổng hợp tài liệu, luật agent và seed cửa hàng — 05/11/2026

Theo yêu cầu người dùng, tập trung phiếu duyệt DB, ERD/Data Dictionary/snapshot, hướng dẫn migration/local, báo cáo chuyển thử và contract API vào git_doc. Manifest nhập tài liệu giữ nguồn/hash, các README module trỏ về bản chính. Tạo PROJECT_GUIDE, MODEL_MAP đủ 74 collection, DOCUMENTATION_RULES; context và README dẫn về đầu mối hiện hành. Các bản context/README trước được lưu theo ngày để tra cứu.

AGENTS.md, CLAUDE.md và GEMINI.md đồng nhất. Agent phải tự cập nhật nội dung tài liệu liên quan trong cùng lượt khi thay model/API/quyền/nghiệp vụ/seed/config, ghi changelog và chạy docs:check. Kiểm này phát hiện lệch ba file luật, liên kết chính, thiếu collection và dấu vết cập nhật; nội dung nghiệp vụ vẫn cần review.

Bổ sung tile-shop.js vào seed reviewed và đổi version thành wmsd-tile-shop-20261105-v1. Bộ gồm 3 kho, 20 sản phẩm, 43 lô, 15 nhân viên, 20 khách, 4 NCC, 2 đội nội bộ. Tồn đầu kỳ có nguồn và lịch sử, thùng nguyên/lẻ theo cùng sản phẩm/lô, kích thước kiện và bố trí chồng. Quy tắc một thùng một sản phẩm/một lô theo xác nhận 05/11; chưa đổi schema collection. Local target là wmsd_demo_tile_shop, bộ v2 giữ riêng. Không ghi DB nhóm.

Kiểm chứng: main đã cập nhật trước code; 32 test DB migration/demo/local config đạt. Seed đã ghi và đọc lại MongoDB local, 74 collection/851 bản ghi nghiệp vụ, 55 số dư, 33 giao dịch/74 dòng biến động. Chạy seed lại trả ALREADY_SEEDED và cùng fingerprint. docs:check đạt, git diff --check sạch, liên kết các phiếu duyệt đã được kiểm. Báo cáo tại outputs/tile_shop_seed_2026-11-05.json. Chưa chuyển các API cũ sang model mới, marker runtimeReady=false; D07/D08 tiếp tục chờ nghiệp vụ.

# Chuyển môi trường thử DB mới về localhost — 03/11/2026

Theo yêu cầu thử trên máy trước DB chung: chạy instance MongoDB riêng tại 127.0.0.1:27018, replica set wmsd-local, dữ liệu dưới .local/mongodb. Giữ dịch vụ 27017 và DB cloud nguyên trạng. Nạp bộ wmsd_demo_v2 tại local; thêm lệnh start/status/stop/seed/verify, cấu hình .env.local và loại dữ liệu máy khỏi Git. Seed remote bị chặn mặc định, cần cờ triển khai rõ ràng.

Kiểm thử trực tiếp bằng model mới trên DB local tạm: populate, commit/rollback transaction, khóa chống trừ lặp, tranh chấp phiên bản tồn, lịch sử append-only và unique hãng/SKU. Cả 7 test đạt; DB tạm được dọn sau kiểm tra. Hướng dẫn tại src/models/rebuild/LOCAL_DEVELOPMENT.md. Chưa chuyển toàn bộ service/API, không đổi URI trong .env nhóm và không commit/push.

# Bộ DB mẫu theo thiết kế đã duyệt — 03/11/2026

Người dùng xác nhận dữ liệu cũ chỉ để test và yêu cầu tạo bộ mới. Đã tạo wmsd_demo_v2 gồm 74 collection nghiệp vụ, 511 bản ghi; tách biệt sep490 và bản chuyển thử ngày 02/11. Bổ sung model hỗ trợ theo phiếu đã duyệt, kịch bản chuyển kho/nhập/xuất/bán/trả/kiểm kê, đơn vị và quy đổi trên dòng, giá mẫu, sức chứa, vai trò tùy chỉnh, ảnh bằng chứng giả lập. Hướng dẫn xem DB và danh mục collection tại E:/Doan/outputs/db_rebuild/HUONG_DAN_DB_MOI.md; mô tả cách chạy và giới hạn tại src/models/rebuild/README.md.

Kiểm chứng: 27 test migration/demo đạt; đọc lại MongoDB đối chiếu liên kết, chuỗi tăng giảm tồn, số lượng điều chuyển, sức chứa và hóa đơn. Chạy lại không tạo thêm dữ liệu. Full suite còn lỗi có sẵn do thiếu dependency replenishment và fixture cũ thiếu INTERNAL_TRANSFER_REQUIREMENT. Chưa chuyển API sang schema mới, không đổi .env, không commit/push; D07/D08 tiếp tục chờ nghiệp vụ.

# Chuyển thử DB và model — 02/11/2026

Bổ sung hướng dẫn tại src/models/rebuild/README.md về model đích, lệnh chuyển và kiểm tra dữ liệu, tên DB sao lưu, dữ liệu cần bổ sung và phạm vi chưa chuyển ở API. Bản chuyển thử sep490_rebuild_20261102 đã được đối chiếu với nguồn. Các phiếu duyệt thiết kế tiếp tục là căn cứ nghiệp vụ.
# PO draft edit and confirmation UI — 05/11/2026

Added Accountant-only draft edit and confirmation actions to PO detail. The editor changes supplier, expected date and entered quantities while preserving line IDs and saved RR/approval references. Existing PUT and POST /confirm commands retain permission, assigned-warehouse, version and idempotency checks. The PO detail reader adds scoped draftEdit source data. Success refreshes purchase/replenishment queries; errors preserve input, and uncertain outcomes retry the exact request. Confirmation opens Warehouse receiving without posting stock.

Verification: 16 focused FE tests and 33 BE integration tests passed; BE used an isolated MongoDB replica set. Typecheck, production build and targeted ESLint passed. A real browser exercised live edit/confirm and Warehouse receiving availability at desktop/mobile sizes using temporary demo data; no browser runtime errors. Full-repo lint retains 7 existing errors and 2 warnings outside this change. Legacy ui:check/ui:cleanup scripts are absent and host Bash fails. No shared demo database reset, commit or push.

---

# Mở quyền xem chuỗi mua cho Owner và Accountant — 05/11/2026

Owner/Accountant xem PO, kiểm nhận, GR và put-away mua ở mọi kho, gồm chi tiết task, lịch sử và chứng cứ có xác thực. Thêm `putaway_task:read` cho Accountant trong catalogue và permissions.json; chỉ reader dùng scope mua mở rộng, command và phạm vi kho Warehouse giữ nguyên. FE hiển thị workspace put-away cho Accountant trên trang GR; tab PO vẫn hỗ trợ chế độ xem. Cập nhật context FE/BE.

Thêm `npm run seed:purchase-read-permissions` để bổ sung ba quyền đọc vào OWNER/ACCOUNTANT bằng $addToSet, chỉ cập nhật role còn thiếu quyền; không ghi đè quyền khác hoặc seed/reset dữ liệu. Đã áp dụng trên database local sep490, một role được bổ sung. Kiểm tra: 32 bài BE (HTTP/MongoDB trên database thử riêng và seed unit), 17 bài FE (RTL/MSW), typecheck và lint các file FE sửa đều đạt. Kiểm role không có warehouseIds vẫn đọc được; lệnh post/tạo/xác nhận/hủy put-away bị403, Warehouse ngoài kho không đọc task/chứng cứ, Sales/Admin không được đọc. Không kiểm storage live hoặc giao diện bằng trình duyệt; không commit/push.

---

# Giải thích từng hàm và tương tác cơ sở dữ liệu — 05/11/2026

Thêm bộ tài liệu `docs/iteration-1/function-guide-2026-11-05/`: 342 hàm có tên trong sáu nhóm module Iteration 1 và các helper liên quan, mỗi hàm có tham số, mục đích, thứ tự xử lý, nơi gọi/gọi tiếp, query MongoDB nguyên văn, bước ghi qua helper với model/đối số cụ thể, ví dụ và code đối chiếu. Thêm luồng đọc/ghi theo từng bước của tạo/gửi/duyệt yêu cầu, mở PO, confirm/post GR, cất/đảo/chứng cứ; bảng72 route,53 khai báo kiểm tra và các model/collection/header/details liên quan. Lưu inventory/source hashes và cập nhật mục lục.

Đọc lại phạm vi kế toán được mở rộng ở reader mua nhưng không ở command và tab supplier; ghi rõ các giới hạn về xóa dòng nháp có chứng cứ, trạng thái cuối khi chốt thiếu/nhận nốt và các điểm quyền/nhận dạng đã biết. Chạy lại sáu tệp kiểm thử liên quan (gồm hai tệp reader RR sau cập nhật bộ lọc PO): 84/84 đạt, 0 lỗi, 0 bỏ qua, khoảng 14,6 giây trên database thử riêng. Không chạy lại full suite/storage thật/browser/benchmark, không sửa runtime hoặc reset/seed demo, không commit/push.

---

# Sửa logic đăng xuất FE/BE — 03/11/2026

Thêm POST /api/auth/logout để xóa HttpOnly refresh_token và cookie claim_access_token bằng cùng cookie defaults, kể cả khi token thiếu/hết hạn. FE xóa token/profile và tăng session generation ngay khi thoát; chặn refresh/phản hồi cũ khôi phục hoặc ghi đè phiên mới. Logout đi trực tiếp ngoài mutex, không retry401, timeout 5 giây; luôn reset RTK Query cache và thay route bằng /login khi thành công, lỗi mạng/API hoặc timeout. Nút thoát khóa trong lúc xử lý, nội dung bảo vệ được ẩn. Login thành công cũng bắt đầu generation mới.

Cập nhật context FE/BE và sửa comment authToken về cookie/rotation theo runtime. JWT vẫn stateless; xóa cookie không thu hồi bản sao token ở nơi khác. Thêm test HTTP cookie cleanup, test menu thật/reset cache/navigation và test race refresh/late 401/đăng nhập tài khoản khác. Kiểm tra: 21 test FE liên quan và 7 test BE auth/role đạt; typecheck, lint các file thay đổi và production build FE đạt. UI kiểm bằng RTL/MSW, HTTP BE chạy Express thật không cần DB; chưa kiểm bằng phiên trình duyệt đang mở. Không thay model/database, không commit/push.

---

# Review và giải thích nhận mua v3 — 03/11/2026

Thêm docs/po-receiving-proposal/REVIEW_GIAI_THICH_NHAN_HANG_V3.md: giải thích bằng tiếng Việt các nghiệp vụ đã triển khai, người thực hiện, luồng chứng từ, vai trò/liên kết model, hàm xử lý, bảng lượng trước/sau và ví dụ theo từng tình huống. Có mục riêng cho quyền, phiên bản, gửi lại an toàn, chứng cứ, cất từng phần, sửa sai và đối soát.

Đã đối chiếu source và tái hiện hai vấn đề trên database thử ngẫu nhiên: xóa dòng inspection DRAFT để Evidence.lineId tham chiếu dòng đã mất; chốt thiếu trước đợt nhập cuối làm trạng thái PO thành COMPLETED trong khi đường chốt thiếu chọn CLOSED. Báo cáo ghi rõ ảnh hưởng, hướng sửa, kiểm thử cần bổ sung và các giới hạn đã biết. Chỉ thêm tài liệu/changelog; không sửa code nghiệp vụ, không thay sep490, không chạy lại full suite hoặc upload storage thật trong lượt này. Không commit/push.

---

# Review code hiện tại bằng tiếng Việt, kèm ví dụ nghiệp vụ — 03/11/2026

Thêm `docs/iteration-1/REVIEW_GIAI_THICH_CODE_2026-11-03.md`: đọc lại code cho đủ 23 UC gốc và các phần mua/nhận/cất/sửa sai/chứng cứ đã triển khai; giải thích luồng, hàm, model, phiên bản, lượng, quyền và ví dụ từng nghiệp vụ. Phân biệt luồng hiện tại chỉ nhận lượng đồng ý nhập với custody lịch sử đã bỏ; cập nhật link bản hiện hành trong README Iteration 1.

Chạy lại toàn bộ backend: 189 bài, 187 đạt, 0 lỗi, 2 bỏ qua kiểm storage live. Thêm script kiểm tra review dùng database ngẫu nhiên riêng và kết quả JSON: xác nhận `/suppliers/names` thiếu quyền đọc nghiệp vụ, cùng hành vi lô UNKNOWN được post Receiving nhưng chặn cất vào Storage allocatable. Lưu dấu kiểm source và kết quả kiểm thử để nhận biết code đổi sau review. Không sửa runtime, không reset/seed demo, không commit/push.

---

# BE nhận mua v3 theo plan điều chỉnh — 03/11/2026

Thực hiện yêu cầu chỉ ghi lượng cửa hàng đồng ý nhập: bỏ stock custody của nhận mua, giữ confirm riêng với post. Bổ sung PO từ RR duyệt có guard allowance, amendment/schedule/chốt thiếu có quyết định Owner, DTO summary/trips/queue/history/operation recovery, evidence private có kiểm bytes và cleanup intent, put-away mua partial/split với projection/claim và bảo vệ Receiving relocation, reversal toàn GR do Warehouse thực hiện có chứng cứ/dependency guards, correction cùng chuyến gốc. Không triển khai hàng sai/lỗi/unknown/custody resolution và không đổi UI.

Thêm contract BACKEND_V3.md, báo cáo VERIFICATION_V3.md, benchmark-v3.json; cập nhật IMPLEMENTATION, context BE, model README/changelog và đánh dấu phần plan v2 được thay thế. Kết quả test/reset và manifest ghi trong báo cáo. Không commit/push.

---

# Loại bỏ nhận mua cũ và tạo lại DB local — 03/11/2026

Theo yêu cầu, xóa ARRIVAL khỏi model/catalogue/seed; bỏ traversal PO→ARRIVAL→INSPECTION→GR ở reader PO/NCC, bắt buộc direct PO/PO_INSPECTION/supplier refs cho GR mua. INSPECTION chung chỉ giữ cho CR/FD. Chuyển fixture và regression sang chuỗi mới, có ca từ chối ARRIVAL và GR thiếu nguồn. FE receipt list/detail đọc API thật; xóa các form, hooks, stores và components nhập mua localStorage cũ, thay tests bằng kiểm API/no-fallback.

DB localhost sep490 đã dry-run, backup, drop và seed lại bằng CLI có kiểm target. Manifest: `C:/Users/minhs/.codex/backups/sep490-po-receiving-1793695344564/manifest.ejson`. Hậu kiểm: ARRIVAL0,PO_INSPECTION1,GR mua1 với nguồn đầy đủ,INSPECTION CR/FD2,36 document kinds. Không commit/push. Kết quả test/build cuối ghi trong bàn giao.

Kiểm chứng cuối: backend178 tests/177 pass/0 fail/1 skip; focused receiving/PO/reset23/23 pass sau bổ sung kiểm lineage. Frontend11/11 pass, build và lint receipt/API pass. Các thay đổi UI nhận hàng song song được giữ; sửa các import/type không khớp để build working tree hiện tại.

---

# Triển khai nền tảng nháp và workspace nhận mua — 03/11/2026

PO detail nối API thật cho nhiều đợt nhận, create/update/confirm inspection, chọn lô/split lượng/đích GR, review/post GR và cancel draft. Backend giữ line ID theo clientLineKey, lưu plannedReceiptLocationId, cancel DRAFT không xóa custody, scoped history/operation lookup. Cập nhật contract và context hai repo/model changelog. Các gói custody resolution, purchase put-away, reversal, evidence scoped, PO lifecycle và migration còn chưa hoàn thành; không nhận là đã triển khai toàn plan v2.

Kiểm chứng: full backend177 tests/176 pass/0 fail/1 skip;7 frontend tests PO/workspace pass; build/typecheck và lint runtime frontend thay đổi pass. Database test riêng đã cleanup, không reset demo. Chưa kiểm browser end-to-end, không commit/push.

---

# Bổ sung lượng có thể chấp nhận trong context nhận mua — 03/11/2026

Inspection context trả thêm lượng GR nháp đang cam kết và lượng còn được chấp nhận theo từng dòng PO trên cùng snapshot đọc; trả null khi nguồn không đủ căn cứ. Confirm vẫn kiểm lại trong transaction. Kiểm thử tập trung nhận mua: 9/9 pass trên database test riêng. Đây là một phần của plan v2, chưa triển khai các gói và UI còn lại; không commit/push.

---

# Rà soát giới hạn nhận mua và plan v2 — 03/11/2026

Thêm [báo cáo18 giới hạn](../docs/po-receiving-proposal/gap-analysis-current-2026-11-03.md) và [plan v2](../docs/po-receiving-proposal/ui/design-plan-v2.md), liên kết từ tài liệu UI v1. Rà nguồn BE/FE/PO/supplier/upload/evidence/audit/BF04/relocation; phân biệt quan hệ PO nhiều đợt đã có với thiếu UI, headroom, stable draft/destination, cancel, custody resolution/actual handback, put-away mua partial, correction/reversal, evidence scoped, PO amendment/close/schedule và exception intake. Đề xuất source GR bổ sung, claims theo dòng nguồn, quyền/DTO/API, migration add-only, lộ trình W0–W5 và tiêu chí nghiệm thu; không đổi catalogue hoặc runtime theo các đề xuất này.

Kiểm chứng mới: chạy hai file integration nhận mua/PO ledger trên DB replica set local riêng,18/18 pass,0 fail,0 skip (gồm hai bài cha). Ba probe DB random riêng đạt:40+35+25 trên cùng PO; GR nháp70 chặn ACCEPT40 nhưng context chưa trả headroom; save thay line ID và không lưu đích GR. DB probe đã cleanup, không reset/migrate DB sep490. Chỉ thêm/cập nhật tài liệu và script kiểm tra ngoài Git; không sửa runtime/model/test repo, không commit/push. Liên kết và whitespace kiểm riêng trước bàn giao.

---

# Kế hoạch UI nhận mua theo PO — 03/11/2026

Thêm [kế hoạch UI](../docs/po-receiving-proposal/ui/design-plan.md), [luồng người dùng](../docs/po-receiving-proposal/ui/user-flow.md) và [wireframe](../docs/po-receiving-proposal/ui/wireframe-ascii.md). Đề xuất PO detail làm màn trung tâm, mỗi đợt có stepper Tiếp nhận → Kiểm hàng & lô → Ghi nhận GR → Xếp kho. Đối chiếu contract PO_INSPECTION hiện tại: custody NCC khi chốt kiểm, tối đa một GR nháp cho toàn bộ ACCEPT, post riêng nhận STORE, lựa chọn đích GR trước confirm và line IDs thay sau cập nhật nháp. Phân biệt PO nhận đủ với xếp kho và custody còn chờ; ghi rõ UI receipt đang dùng demo, giới hạn dữ liệu read/enrichment, cap GR nháp, evidence/audit và put-away chưa tích hợp.

Đây là đề xuất thiết kế theo nội dung tham khảo người dùng gửi, không thay nghiệp vụ/quyền hoặc khẳng định đã triển khai. Kiểm chứng bằng đọc source/routes/contract hiện tại và kiểm liên kết tài liệu; không chạy test ứng dụng vì không sửa runtime. Không sửa dữ liệu, không commit/push.

---

# Review toàn bộ UC Iteration 1 của minhtd — 02/11/2026

Thêm [báo cáo tổng hợp23 UC](../docs/iteration-1/REVIEW_TOAN_BO_UC_2026-11-02.md), đọc lại trực tiếp bản plan chi tiết cuối trong chat `01a18c8f-8d7c-7032-965b-95a746e96ae6`, đối chiếu working tree hiện tại. Mỗi UC-01–07/17–32 có nghiệp vụ/actor/API/input, chuỗi function và các bước xử lý, model đọc/ghi, ví dụ, lỗi và test references. Giải thích quyền, decimal/version/snapshot/idempotency, sơ đồ quan hệ model, luồng RR và PO_INSPECTION/custody/GR ảnh hưởng UC-07/29; ghi rõ extension không thay danh sách phân công23 UC và RV-01–04 đã sửa. Bổ sung giới hạn UI/performance/transit/lot race/reversal thay vì coi pass test là nghiệm thu toàn hệ thống.

Kiểm chứng tài liệu: kiểm đủ23 mã UC không trùng/thiếu, liên kết source và git diff --check. Kết quả172 tests/171 pass/1 skip được dẫn từ lượt triển khai trước cùng ngày, không nhận là full-suite chạy lại. Chỉ viết tài liệu/index/changelog; không sửa runtime/model/test, không reset hoặc ghi DB, không commit/push.

---

# Triển khai backend PO_INSPECTION, custody và GR — 02/11/2026

Theo các lựa chọn đã chốt, triển khai model/command kiểm hàng theo chuyến, intake giữ hộ toàn bộ phần keptOnSite thuộc NCC, một GR draft cho phần ACCEPT và post GR riêng chuyển custody sang STORE receiving/quarantine. Thêm API context/list/detail/create/update/confirm/handling-note/post, source PO/inspection/supplier và thông tin người giao; transaction, PO/location CAS guards, freeze, scope, idempotent receipt/batch IDs và audit. Không thêm FE UI, put-away hay command xử lý/return hàng chưa chấp nhận.

Sửa reader PO/NCC cho nguồn mới và xác thực legacy; sửa direction/product/batch RV-01/02, scope replay RR RV-03, typed source traversal RV-04. Thêm test luồng ownership, accepted0, rollback, race confirm/post, sửa draft/note, quyền/freeze và regression bốn finding. Seed dùng flow mua mới; CLI migrate:po-receiving mặc định dry-run, chỉ reset localhost/sep490 khi đủ flags và backup đã hoàn tất. Đã backup và tạo lại DB demo sep490 theo lựa chọn người dùng; manifest ngoài Git tại `C:/Users/minhs/.codex/backups/sep490-po-receiving-1793619545404/manifest.ejson`.

Contract, quyết định và kế hoạch thực hiện: [IMPLEMENTATION.md](../docs/po-receiving-proposal/IMPLEMENTATION.md). Cập nhật context BE/FE và model changelog. Main đã merge không commit, giữ thay đổi có sẵn; không commit/push. Kết quả kiểm thử cuối được ghi trong tài liệu implementation và bàn giao chat.

---

# Đánh giá đề xuất gộp nhận hàng PO_INSPECTION — 02/11/2026

Thêm [gap analysis](../docs/po-receiving-proposal/gap-analysis.md) cho ý tưởng gộp ARRIVAL/INSPECTION trong nhánh mua hàng, GR tham chiếu trực tiếp PO và ghi người giao. Đánh giá nhận nhiều đợt, actual/accepted/rejected/pending, lot/quality/ownership, note xử lý lỗi, nguồn inspection cho GR, supplier từ PO, concurrency/retry và ảnh hưởng CR/FD/legacy. Đề xuất giới hạn thay đổi trong flow PO; đây là tài liệu đánh giá, chưa chấp thuận thay baseline hoặc triển khai.

Kiểm chứng: đọc context và model/seed/readers liên quan, kiểm liên kết và git diff --check. Không sửa runtime/model/test, không migration hoặc thao tác DB, không commit/push.

---

# Giải thích chi tiết nghiệp vụ và luồng code của các finding — 01/11/2026

Thêm [báo cáo giải thích bốn vấn đề](../docs/iteration-1/BAO_CAO_GIAI_THICH_VAN_DE_2026-11-01.md): nghiệp vụ đúng, vai trò model, chuỗi gọi function và vị trí source, ví dụ tính từng bước, nguyên nhân RV-01/02/03/04, phạm vi tác động thực tế, hướng sửa và regression cases. Làm rõ dữ liệu bất thường trong probe khác dữ liệu thật, GET sai kết quả khác post sai tồn, quyền record khác idempotency; giải thích nguy cơ đảo dấu reversal hai lần khi sửa và yêu cầu kiểm scope cả replay fallback. Bổ sung liên kết trong README iteration, giữ nguyên review và bằng chứng lịch sử.

Kiểm chứng: đối chiếu checkout HEAD `2e31d79`, chạy lại sáu probe trên database localhost random và nhận lại kết quả cũ; kiểm liên kết source và git diff --check. Số157 pass/1 skip là kết quả full suite của lượt review trước, không phải full suite mới trong lượt viết giải thích này. Không sửa logic/model/API ứng dụng, không apply migration vào DB dùng chung, không commit/push.

---

# Review backend Iteration 1 và giải thích module — 31/10/2026

Thêm [báo cáo review](../docs/iteration-1/REVIEW_2026-10-31.md) đối chiếu bản plan chi tiết trong chat `01a18c8f-8d7c-7032-965b-95a746e96ae6` với checkout `2e31d79`: đủ 23 UC có endpoint/service; giải thích kiến trúc, logic/flow/function, transaction/retry/version và quan hệ model của replenishments, products, lots, suppliers, purchase-orders. Ghi bốn phát hiện P2 đã tái hiện: PO tính dương movement sai chiều; PO thiếu kiểm lot-product/batch-document; replay tạo RR bỏ qua scope kho hiện tại; supplier GR traversal chấp nhận nguồn thiếu ARRIVAL/INSPECTION. Kèm JSON bằng chứng và script probe chỉ dùng DB localhost random, cập nhật liên kết tại README iteration.

Kiểm chứng mới: `npm test` 90 test/75 pass/15 skip; replica set cục bộ 158 test/157 pass/1 skip Cloudinary; sáu probe gồm một control và năm ca xác nhận bốn phát hiện. Các DB test riêng được dọn sau chạy. Không sửa logic/model ứng dụng, không apply migration vào DB dùng chung, không commit/push. Báo cáo cũng ghi các ca race/rollback/reversal còn thiếu và giới hạn hiệu năng chưa benchmark.

---

# Triển khai backend Iteration 1 — 30/10/2026

Triển khai backend UC-01–UC-07 và UC-17–UC-32 trên nhánh `codex/uc-01-32-iteration-1`; frontend chưa nối. Thêm API RR thủ công (tạo nháp/gửi trực tiếp, sửa, gửi, Owner duyệt lượng từng dòng), snapshot bất biến theo version, lịch sử submission; PO list đọc lượng nhận từ chuỗi PO→ARRIVAL→INSPECTION→GR→ledger/reversal; product/master, conversion, policy, lot, supplier và history/documents. Bổ sung model/version/audit/submission và migration mặc định dry-run.

Tài liệu mới: [đặc tả Iteration 1](docs/iteration-1/README.md), [API reference](docs/api/iteration-1/README.md), [use-case cards](docs/iteration-1/use-cases.md), [migration guide](docs/iteration-1/MIGRATION.md), [verification](docs/iteration-1/VERIFICATION.md). Cập nhật context BE/FE, model README/changelog và ánh xạ UC trong permission metadata; giữ nguyên permission keys runtime. Số collection MongoDB tăng 39→40 do `replenishment_submissions`.

Kiểm chứng: `npm test` (90 test, 75 pass, 15 skip khi không có DB); với MongoDB replica set cục bộ (DB random) 158 test, 157 pass, 1 skip Cloudinary live. Không chạy frontend/browser, không apply migration lên DB dùng chung, không commit/push thay đổi implementation.

---

# Bỏ nhóm UC-107 cũ khỏi catalogue — 30/10/2026

Theo yêu cầu người dùng, bỏ ba mục UC độc lập Verify Supplier Return Agreement, Record Supplier Receipt Acknowledgement và Reconcile Supplier Return Variance (mã trước lượt này UC-122/123/124, tách từ UC-107 cũ). Không khôi phục dòng UC-107 gộp. Catalogue còn 130 UC, mã liên tục UC-01–UC-130; chín mã cuối được dịch xuống ba số. Đồng bộ catalogue/quyền/spec/actor/screen/BR/BF, phụ lục thiết kế, VI/EN, context và crosswalk. Không loại bỏ bằng chứng/thỏa thuận/ACK hay kiểm soát đang có trong luồng trả NCC, không cấp thêm quyền.

Mapping WBS còn 96 nguồn active với 20 nhóm tách thành 54 UC, thêm 34 dòng, tổng 130. Nếu kế thừa kế hoạch và bỏ dòng UC-107 nguồn effort 1: iteration 74/49/7 UC, effort 29.75/32.5/7.75, tổng 70; đây là hướng dẫn cho Gemini, chưa sửa sheet. Cập nhật prompt tự chứa, không sửa runtime/database/cloud hoặc file lịch sử, không commit/push.

---

# Loại UC ngoài phạm vi và đánh lại mã — 30/10/2026

Theo yêu cầu người dùng, xóa 14 UC retired khỏi catalogue, ma trận quyền, đặc tả Report 3, phụ lục thiết kế và context BE/FE. Đánh lại 133 UC active liên tục UC-01–UC-133 theo thứ tự catalogue sau tách. Đồng bộ tham chiếu đầy đủ, shorthand/range, actor, BF/BR/SC, Report 1/2/3, quy trình VI/EN, thiết kế hệ thống/dữ liệu và đề xuất replenishment đang dùng. Bảng đối chiếu mã đầy đủ: docs/07_ra_soat/UC_RENUMBER_2026-10-30.md; crosswalk phân rã đã ghi rõ cột mã cũ và mã hiện hành.

Kiểm chứng: 133 mã duy nhất ở catalogue/quyền/spec/phụ lục, tên tương ứng đúng mapping; đủ dãy UC-01–UC-133, không còn mục UC RETIRED; bảo toàn nội dung nhật ký phiên bản. Tài liệu rà soát và sơ đồ lịch sử giữ nguyên mã tại thời điểm ghi nhận, đối chiếu qua mapping mới. Không sửa runtime, permission strings, dữ liệu, spreadsheet/cloud, Word hoặc draw.io; không commit/push.

---

# Áp dụng phân rã UC — 30/10/2026

Áp dụng P1/P2 đã chấp thuận: 21 UC thành 57 mục tiêu, tăng ròng 36; 147 mã = 133 active + 14 retired. Giữ mã cha cho mục tiêu kế thừa, thêm UC-112–147. Cập nhật SRS catalogue/quyền/actor/spec/screen, quy trình VI/EN, thiết kế/dữ liệu, Report 1/2, README và context BE/FE. Crosswalk/impact/QA tại docs/07_ra_soat/CR-2026-10-30-UC-SPLIT.md. Giữ nguyên effort/ngày và dòng WBS cũ ở cấp nhóm, không nhân estimate hoặc tuyên bố hoàn thành UC con. Không sửa runtime, spreadsheet, Word/cloud hoặc draw.io lịch sử; không commit/push.

---

# Chuyển ví dụ model sang tình huống thực tế — 29/10/2026

Theo điều chỉnh của người dùng, sửa [MO_TA_DATABASE_MODELS.md](../MO_TA_DATABASE_MODELS.md): thay toàn bộ 39 ví dụ JSON bằng tình huống vận hành cửa hàng gạch, có nhân vật, hàng hóa, số lượng và giải thích model ghi nhận điều gì. Đổi quy ước ví dụ và sơ đồ dạng khối sang diễn giải/bảng dễ đọc; bỏ các minh họa gọi hàm, tạo object và định danh giả. Giữ mô tả trường/quan hệ/ràng buộc và các luồng nghiệp vụ để đối chiếu source.

Kiểm chứng: đủ 39 mục model và mỗi mục có ví dụ thực tế; không còn khối mã hoặc ví dụ JSON; kiểm bảng, liên kết nội bộ và git diff --check. Đây là sửa tài liệu, không chạy kiểm thử ứng dụng hoặc thao tác database. Bảo toàn thay đổi có sẵn; không stage, commit hoặc push.

---

# Giải thích model database tại root backend — 29/10/2026

Thêm [MO_TA_DATABASE_MODELS.md](../MO_TA_DATABASE_MODELS.md) tại root `be`, giải thích đủ 39 model/collection MongoDB, 35 loại chứng từ và 19 loại dòng chứng từ theo source hiện tại. Mỗi model có mục đích, trường chính, quan hệ/ràng buộc đáng chú ý và ví dụ JSON; có các tình huống nhập mua, PGI/POD/PAY-CFM, FD mở lại nhu cầu, CR, điều chuyển, kiểm kê B1, trả NCC và thông báo/bổ sung hàng. Làm rõ discriminator dùng chung collection, decimal/snapshot/version, reservation/allocation/claim/hold và giới hạn schema so với service/transaction/API.

Kiểm chứng: đối chiếu model/collection/discriminator từ registry Mongoose không kết nối database; parse và validate cục bộ các ví dụ JSON sau thay alias ID bằng ObjectId minh họa; kiểm liên kết và git diff --check. Không thay model/code ứng dụng, không chạy server/seed/migration hoặc ghi database. Bảo toàn các thay đổi có sẵn; không stage, commit hoặc push.

---

# Rà soát và đề xuất tách Use Case — 29/10/2026

Thêm [báo cáo đề xuất tách UC](docs/07_ra_soat/De_xuat_tach_Use_Case_2026-10-29.md), dựa trên catalogue/quyền/đặc tả Report 3 trong workspace và baseline 3.3.0. Phân loại đủ 111 mã: 11 UC ưu tiên tách, 10 UC chuẩn hóa tiếp, 7 UC cân nhắc theo cách vận hành, 69 ACTIVE giữ cấu trúc và 14 RETIRED giữ lịch sử. Chi tiết UC-13 thành 5 mục tiêu sản phẩm/trạng thái/quy đổi/policy minimum-target; UC-19 thành tạo/sửa của Accountant và thay trạng thái của Owner. Các nhóm khác có actor, ranh giới trạng thái/tồn, mapping tạm và số lượng dự kiến.

Đây là đề xuất để review; không thay catalogue, mã UC chính thức, quyền, quy trình, code hoặc bản tài liệu riêng tại SEP490/git_doc. Bảo toàn các thay đổi có sẵn trong workspace và changelog. Kiểm chứng bằng đối chiếu tập mã, số lượng/mapping, liên kết cục bộ và git diff --check; không chạy test ứng dụng cho báo cáo tài liệu. Không stage, commit hoặc push.

---

# Làm rõ tạo yêu cầu bổ sung chủ động — 29/10/2026

Theo yêu cầu người dùng, bổ sung trực tiếp vào các mục hiện có của Report 3 (BF-01, catalogue/đặc tả UC-03, SC-06, BR-03) và quy trình VI/EN: Sales/Warehouse được tạo RR hoàn toàn bằng MANUAL_OTHER từ menu dù không có đơn thiếu, cảnh báo tồn thấp hay kiểm kê. Bắt buộc lý do nghiệp vụ từng dòng, kho/ngày cần và lượng dương; đối chiếu tồn, yêu cầu và nguồn sắp về để tránh mua trùng; không tạo giả refs/snapshot nguồn. Owner khác người đề xuất duyệt, Accountant lập PO sau duyệt; RR không đổi tồn.

Tác động: làm rõ nhánh nhu cầu khác đã được chấp thuận trong đề xuất replenishment 1.4.0; không phát sinh UC/role/schema/API mới. Đồng bộ nội dung này trong cả bản tài liệu src/be/git_doc và SEP490/git_doc, không nâng toàn bộ bản cũ lên baseline 3.3.0. Bản quy trình tăng patch tài liệu; giữ bảng Change Log trong report. Bổ sung hai tình huống nghiệm thu: tạo không có trigger và chặn lý do trống. Rủi ro cần kiểm khi triển khai: không ép nguồn SO/kiểm kê vào MANUAL_OTHER, không mua trùng. Đây là cập nhật tài liệu, không phải xác nhận runtime.

Kiểm chứng: rà soát các mục đã sửa, đối chiếu VI/EN, kiểm cấu trúc bảng/liên kết và git diff --check; không chạy kiểm thử ứng dụng cho thay đổi tài liệu. Không stage, commit hoặc push.

---

# Cập nhật hướng dẫn agent và changelog — 28/10/2026

## 2026-10-29 — Trungph iterations 1–3 application contracts

Implemented and connected UC-63–73, UC-79–83, UC-102, UC-107 and UC-108 through the return-workflow API screens. Added transaction/HTTP verification on an isolated temporary database, frontend permission/error tests, and the shared manual acceptance guide at workspace ALL_ITERATIONS_TEST_GUIDE.md. Runtime contract and optional model additions are documented in src/modules/return-workflows/README.md and src/models/CHANGELOG.md. Existing report/submission copies were not edited.
## 2026-10-30 — Revised BF04 backend main flow

Implemented request/review/outbound/internal requirement/generated TO/dispatch/receipt/putaway/closure commands.
Step 7 confirms dispatch into transit; damage is received in destination QUARANTINE with a linked defect report.
API contract and boundaries are in `src/modules/transfers/BF04_API.md`; additive model changes are logged in `src/models/CHANGELOG.md`.

Updated BE/FE agent contexts with the latest BF04 decisions and API handoff (frontend command screens are not implemented in this change). Tests cover BF03 lifecycle and BF04 posting/receipt/quarantine/putaway, with isolated replica-set databases; schema and read/validation tests also run. Test setup now explicitly creates the relevant collections before indexes, avoiding unrelated full-registry initialization.

## 2026-10-29 — BF03 same-warehouse relocation lifecycle

Added scoped list/form options and creator-only edit, confirm and cancel APIs for
RELOCATE Transfer Orders. Confirmation posts exact source/destination balance
movements and carries reservations in a MongoDB transaction; only the unposted
remainder can be cancelled. The FE location-move routes now use live API data.
Updated the module README and backend context for the implemented lifecycle.

## 2026-10-29 — FE-06 Iteration 1 read API contract

Documented UC-46/49/50 routes, scoped SO/OD source-chain reads, decimal quantities,
FD/replacement and reversal semantics in src/modules/sales-orders/README.md.
UC-47 implements the confirmed single-form source entry, signed evidence receipt,
atomic creation, idempotency and outbox. Added private scoped evidence retrieval,
OD search, stale conversion guards and a Thunder-compatible Postman 2.1 pack with
isolated local demo server. Live Cloudinary smoke test passed private upload,
signed retrieval, denied unsigned retrieval and test-asset cleanup.
FE Warehouse Staff read screens now consume UC-46/49/50; FE UC-47 create form and
shortage evaluation/notification consumer remain separate.
Final verification: 4/4 FE06 acceptance tests passed without skips; 63 non-DB
regression tests passed (10 integration/live skips); 1/1 live Cloudinary smoke
passed; 23 collection HTTP checks passed against isolated local demo data.

## 2026-10-29 — FE-05 Iteration 1 backend reads

Added UC-38/39 API contract in src/modules/transfers/README.md: pagination, scope,
posted-document progress, transit balances and read-only detail. Documented the
confirmed Sales access to overall related-TR progress (including mixed-demand
TRs), while hiding internal documents/notes, and separate write workflows.

Chuyển hướng dẫn FE/BE sang tiếng Anh; bổ sung quy tắc pull main trước khi sửa code, đề nghị người dùng push sau khi hoàn thành feature và ghi thay đổi tài liệu vào changelog này. Tạo changelog riêng cho các thay đổi model về sau. Không tự commit hoặc push.

---

# Phân quyền mỗi user một role — 28/10/2026

Theo quyết định người dùng, User.roleId là ObjectId đơn bắt buộc; bỏ roleIds, giữ warehouseIds và năm role. SQL tham chiếu chuyển user_role sang app_user.role_code NOT NULL FK: 84 bảng/2 view; Mongo vẫn 39 collections. BE auth/middleware/users/roles/replenishment/seed đồng bộ; DTO lowercase role và alias roles=[role], primaryRole=role phục vụ FE chưa sửa. Runtime không gộp quyền, không fallback ADMIN và lọc quyền theo role catalogue.

Chuẩn bị migrate:single-role mặc định dry-run; user nhiều/thiếu/sai/mâu thuẫn role cần ánh xạ userId→roleCode; preflight toàn bộ, backup users/roles, transaction chuyển dữ liệu và index roleId không unique. Không tự chạy migration trên database đang dùng. Đồng bộ quy trình VI/EN, report đúng mục có sẵn, thiết kế, context, Mermaid/ERD hiện hành; giữ draw.io lịch sử, khảo sát và biên bản. Bảo toàn thay đổi có sẵn, không stage/commit.

Kiểm chứng: SQL ScriptDom TSql160Parser 0 lỗi, 6 batch, 84 bảng/2 view; không chạy DDL trên SQL Server. Toàn bộ 99 test đạt trên MongoDB replica set tạm, không skip; gồm HTTP tạo/đổi role, login/refresh/me bằng token cũ, scope replenishment, seed, migration/rollback. Kiểm chứng thêm CLI thật trên DB tạm: mặc định read-only, mapping, EJSON backup, transaction/index và apply lần hai cập nhật 0 user. Parse 31 Mermaid và dựng lại ERD HTML; đã xem ảnh Role 1–N User và User.Role đơn. git diff --check đạt. Các kết quả này không áp dụng cho database đang dùng hoặc DDL thực thi trên SQL Server.

---

# Đồng bộ form tạo RR và Notification — 27/10/2026

Baseline hiện hành 3.3.0 theo đề xuất1.4.0 được chấp thuận. Đã cập nhật model/seed/DTO/tài liệu/context cho một form điền sẵn, lựa chọn dòng và thêm sản phẩm, hỏi sau lưu SO còn thiếu, giữ form khi dữ liệu đổi, lưu nháp/gửi duyệt và source từng dòng. Không có phân loại cách tạo. API/consumer/UI vẫn cần triển khai; chưa thay database người dùng hoặc commit. Chi tiết [báo cáo đồng bộ](docs/07_ra_soat/CR-2026-10-27-REPLENISHMENT.md).

---

# Cập nhật Mermaid và bản xuất liên quan, chỉ loại trừ draw.io — 25/10/2026

Theo yêu cầu bổ sung, phạm vi loại trừ chỉ còn **file draw.io**. Các mục nhật ký cũ về “giữ nguyên diagrams/Mermaid” bên dưới phản ánh lượt trước, không mô tả trạng thái hiện tại. Chi tiết tại [hậu kiểm mục 6](docs/07_ra_soat/Ket_qua_dong_bo_tai_lieu_2026-10-25.md#6-bổ-sung-mermaid--chỉ-loại-trừ-file-drawio).

- Hai quy trình lên bản tài liệu 3.1.2, baseline nghiệp vụ giữ 3.1.0: cập nhật 18 Mermaid context/BF. BF-06/07 tách kết quả sau PGI khỏi POD trước nhánh FD; GR-FD/claim/tái mở nguồn cùng commit. BF-02/05 làm rõ freeze/hold, recount, thực hiện B1 và lỗi/unknown commit. BF-04 theo dõi toàn TR, put-away phần nhận hợp lệ; BF-08 không Owner, tài chính riêng.
- Database VI/EN và Report 3 dùng cùng ba ERD Mermaid hiện hành cho A1, B1, C2/BF-08; có các khóa/trường quan trọng, không vẽ đủ 82 bảng DDL. Context Report 3 và file `.mermaid` đồng bộ cùng bản EN trong quy trình.
- Đồng bộ generator/Mermaid/Markdown/README/HTML của gói ERD rút gọn; giữ 14 thực thể/32 quan hệ, thêm nhóm thuộc tính claim/quyết định/tái mở/OD transfer và B1 hold/execution/closure. Dựng lại PNG BF-04 VI/EN từ Mermaid, có nhãn baseline/ngày; không lấy draw.io cũ làm nguồn.
- Mermaid 12.2.0 parse/render thành công 31 nguồn hiện hành, 22 graph khác nhau. Tám khối Mermaid lịch sử parse được và giữ nguyên. Đã xem render đại diện; kiểm cấu trúc VI–EN và đồng bộ các bản nguồn/bản xuất.
- SHA-256 xác nhận sáu file draw.io không thay đổi. Giữ Mermaid/PNG lịch sử và nguồn khảo sát/biên bản/PDF; không sửa DDL/backend trong lượt bổ sung. README, phạm vi ở Report 1/2/3, thiết kế và báo cáo hậu kiểm phản ánh yêu cầu mới. Không stage/commit.

---

# Đồng bộ tài liệu theo quy trình 3.1.0, loại trừ diagrams — 25/10/2026

## 1. Phạm vi và chuẩn hiện hành

Theo yêu cầu rà soát toàn repo dựa trên hai bản quy trình vừa cập nhật, đã đồng bộ tài liệu hiện hành với quyết định A1/B1/C2 và BF-08 không Owner approval. Baseline nghiệp vụ giữ **3.1.0 ngày 24/10**; hai bản quy trình lên patch tài liệu **3.1.1** để sửa trạng thái phát hành/khuyến nghị còn sót và làm rõ trần nguồn trong nghiệm thu, không đổi các quyết định đã chốt. Chi tiết tại [hậu kiểm 25/10](docs/07_ra_soat/Ket_qua_dong_bo_tai_lieu_2026-10-25.md).

Kiểm kê trước sửa: 47 file; 30 file ngoài sơ đồ và 17 file diagrams/gói ERD. Sửa 15 file có sẵn và thêm một báo cáo hậu kiểm. Các mục nhật ký từ 24/10 trở về trước dưới đây là lịch sử theo đúng mốc ghi nhận, gồm cả tuyên bố “Report 2 giữ nguyên/chưa đồng bộ” ở lượt cũ.

## 2. Nội dung đã cập nhật

- Report 1/2/3, thiết kế hệ thống, database VI/EN, SQL tham chiếu, README và trạng thái hai quy trình cùng baseline: 8 BF, 5 role, 111 UC với **97 active/14 retired**, BR-01–33, SC-01–31 với 28 active/3 retired. UC-106 giữ ID/lịch sử, không quyền thực thi/association/action/route mới.
- A1: Warehouse nhận FD theo GI-S chưa POD và bằng chứng, không D6/Owner/POD giả/custody khách; GR-FD thực về và tái mở đúng SO/WIR/OD gốc ròng cùng commit. POD/FD/CR chia trần dòng nguồn; consume claim không cộng trùng receipt, OD thay thế chuyển cam kết có version, đảo kiểm downstream. GR-CR thông thường không tự tái mở nhu cầu.
- B1: giữ FROZEN/snapshot, hold/evidence không đổi balance được ghi ngay. Cho phép giải trình trực tiếp hoặc recount; Warehouse lập/xác nhận thực hiện phương án, Owner UC-92/93 duyệt/post delta thực tế và RECLASS/vị trí cùng batch trước mở khóa. Quality-only không ADJ=0; không thiếu/hủy hai lần một lượng lỗi.
- C2: Sales STANDARD_ACCEPTANCE CR thông thường sau Warehouse kiểm, có thể cùng creator; Owner EXCEPTION_APPROVAL chỉ ngoại lệ đủ điều kiện và khác người đề xuất. Không vượt điều cấm D6/UNKNOWN. BF-08 bỏ Owner duyệt xuất/sai lệch/đóng; Accountant UC-107/83 xác minh/đối chiếu/đóng, Warehouse thực xuất, tài chính Invoice/Credit Note độc lập.
- TD/GI-S nháp trước picking; TO xác nhận thực hiện, post tại bàn giao. TR chỉ đóng khi hết phần cần thực hiện/transit/sai lệch/TO. SRS đồng bộ cả catalogue, quyền, associations, đặc tả và hợp đồng màn hình, không chỉ thêm ghi chú tổng quát.
- DDL tham chiếu 3.1.0: 82 bảng, 215 FK, 2 view; thêm 9 bảng cho FD/claim/tái mở/OD transfer và B1 hold/resolution; thêm `reference_date`, ngoại lệ CHECK C2 và thông tin xác minh thỏa thuận SR thay Owner authorization. Thiết kế giữ MongoDB runtime, mở rộng **R-01–26/T01–T56**.
- Report 2 cập nhật phạm vi, rủi ro/ưu tiên kiểm thử/đào tạo; giữ số liệu effort/capacity/lịch gốc, chưa tái ước lượng OBS-01. Đề xuất bảy quy trình và ba báo cáo rà soát lịch sử chỉ sửa banner/chỉ mục; thân nội dung cũ được bảo toàn.

## 3. Hậu kiểm và phần giữ nguyên

Đã kiểm đối chiếu dãy mã, tên/trạng thái/quyền và screens/specs/appendix, BR/R/T VI–EN, 40 mã nhánh A/E/FD; cấu trúc bảng/fence/Unicode và liên kết nội bộ hiện hành. ScriptDom 180.140.0 / TSql160Parser parse DDL đạt **0 lỗi**, 6 batch; kiểm tĩnh 82 bảng/PK, 215 FK và 2 view. `git diff --check` đạt. Kết quả chi tiết nằm trong báo cáo hậu kiểm; các case nghiệm thu không phải backend tests đã chạy.

SHA-256 xác nhận 17 file sơ đồ/gói ERD, 13 file nguồn (CSV, sáu biên bản, năm PDF, link tham khảo) và file đánh giá database 23/10 chưa tracked giữ nguyên. Các khối Mermaid nhúng và thân snapshot lịch sử không đổi. Không sửa hai file chưa tracked từ đầu, không sửa `debug.log`. Không render/xuất lại hình, sửa Word/Google Docs ngoài repo hoặc chạy SQL Server/MongoDB/backend. Script/bản chụp QA và parser đặt ngoài repo. Không stage/commit.

---

# Cập nhật quy trình theo góp ý GVHD — 24/10/2026 — phiên bản 3.1.0

## 1. Phạm vi và căn cứ

Cập nhật trực tiếp hai bản [quy trình VI](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) và [quy trình EN](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) lên 3.1.0, theo [báo cáo rà soát 24/10](docs/07_ra_soat/Bao_cao_ra_soat_quy_trinh_theo_gop_y_GVHD_2026-10-24.md), biên bản góp ý và note draw.io được cung cấp. Ưu tiên biên bản Markdown, sau đó note; không lấy đường nối cũ chưa sửa làm chuẩn cao hơn nhận xét.

Người dùng chốt A1, B1, C2 và bỏ toàn bộ Owner approval trong BF-08. Không dùng AGY, không stage/commit. Lượt bổ sung nhật ký này chỉ sửa change_logs.md; hai bản quy trình giữ nguyên kết quả đã sửa ở lượt trước. Các mục 22/10 trở về trước dưới đường phân cách là lịch sử theo phiên bản tại thời điểm đó, không phải xác nhận toàn bộ tài liệu đã đồng bộ 3.1.0.

## 2. Thay đổi đã ghi nhận

- **BF-01/BF-03:** tách hàng chấp nhận, custody và từ chối trên Mermaid; hàng từ chối không đi qua put-away như tồn sở hữu. Làm rõ tạo/xác nhận TO và tên activity thể hiện thao tác trên phần mềm.
- **BF-04/BF-06:** tạo TD/GI-S nháp trước Picking; xác nhận thực hiện TO khi áp dụng, chỉ post khi thực bàn giao. Nháp không đổi tồn. BF-04 có vòng lặp nhận/xuất nhiều đợt và chỉ đóng TR khi hết nhu cầu, transit, sai lệch và nhiệm vụ liên quan.
- **BF-05:** có hai hướng khi chênh lệch: đủ căn cứ thì giải trình/lập phương án trực tiếp; chưa rõ hoặc chọn đếm lại thì Start Recount → Enter Recount → so sánh lại. Không bắt mọi chênh lệch phải recount.
- **A1 — BF-07-FD:** nhánh riêng nhận hàng giao thất bại theo GI-S đã post và chứng cứ, không áp D6 của khách trả sau nhận, không cần POD giả, Owner approval hoặc custody thuộc khách. Warehouse post GR-FD theo lượng thực về/quality; cùng commit tái mở đúng nhu cầu ròng trên SO/WIR/OD gốc để Sales chọn chờ/giao lại/hủy phần đã nhận về. Kiểm chung trần POD/FD/CR, chuyển claim thành receipt không tính hai lần, giữ nguyên ledger xuất/nhận và kiểm nghiệp vụ phụ thuộc khi đảo.
- **B1 — kiểm kê có hàng lỗi:** ghi defect hold/evidence ngay, không thay balance bằng giao dịch thường dưới khóa. Warehouse lập và xác nhận thực hiện phương án; Owner UC-92 duyệt, UC-93 post batch delta thực tế và RECLASS/vị trí có kiểm soát trước mở khóa. Quality-only không ADJ=0; đếm đủ 50 gồm 48 đạt + 2 vỡ không bị ghi thiếu 2 rồi hủy thêm 2.
- **C2 — BF-07 trả thông thường:** Sales chấp nhận/từ chối sau Warehouse kiểm và có thể là người lập CR. Owner chỉ duyệt ngoại lệ đủ điều kiện, không vượt điều cấm D6; chưa rõ thời hạn/điều kiện vẫn chờ. Warehouse post GR-CR theo quyết định đúng loại/phiên bản; CR thông thường không tự mở lại nhu cầu bán.
- **BF-08:** bỏ Owner duyệt xuất, xử lý sai lệch và đóng; Accountant xác minh thỏa thuận NCC, đối chiếu và đóng phần kho qua UC-83; Warehouse post xuất/nhận thực tế. Không đặt quyết định BF-02 lịch sử làm điều kiện xuất trả. Hủy/đổi phẩm cấp/giải phóng hàng lỗi còn tại kho vẫn theo quyền BF-02 hoặc batch B1. Bổ sung tham chiếu Invoice/Credit Note ngoài WMS; trạng thái tài chính độc lập phần kho.
- **UC và phân quyền:** UC-106 retired, giữ ID/lịch sử và năm role; catalogue vẫn 111 ID, nay 97 active/14 retired. Retired: UC-23–25, UC-42, UC-59–62, UC-74–78, UC-106. Đồng bộ UC mapping, permissions, BR-01–33, chứng từ/trạng thái, mainflow/Mermaid và tiêu chí nghiệm thu trong hai bản quy trình.
- **Mục 17:** lưu cả phương án A1/A2/A3 và B1/B2/B3, ưu/nhược điểm, lựa chọn đã chốt, quyền C2/BF-08 và tác động triển khai. Báo cáo rà soát giữ là snapshot phát hiện trước sửa.

## 3. Kiểm tra và giới hạn

- Ở lượt sửa quy trình: mỗi bản có 34 bảng, 9 khối Mermaid (context + tám BF), 15 liên kết tệp nội bộ được kiểm tra; không có liên kết lỗi được phát hiện. Cấu trúc nhánh/nút và đường nối Mermaid VI/EN khớp; thứ tự 17 mục và mã UC trong phạm vi catalogue hợp lệ.
- Đây là kiểm tra cấu trúc tài liệu và đối chiếu nội dung; chưa render lại Mermaid/draw.io hoặc kiểm thử backend, MongoDB, SQL, API hay transaction. Các tình huống nghiệm thu là yêu cầu đề xuất, không phải test phần mềm đã chạy.
- Lượt bổ sung change log: đối chiếu nội dung với hai bản 3.1.0, kiểm liên kết mới, bảo toàn nguyên phần nhật ký cũ và nội dung hai bản quy trình; git diff --check đạt. Không stage/commit.

## 4. Phần còn cần đồng bộ

Report 1/3, thiết kế dữ liệu VI/EN, SQL tham chiếu, thiết kế chi tiết liên quan, bộ draw.io/PNG và Word/Google Docs ngoài repo chưa được cập nhật theo lượt 3.1.0 này. Report 2 giữ nguyên. Các tuyên bố đồng bộ toàn bộ bộ tài liệu ở mục 22/10 chỉ ứng với baseline 3.0.0.

Cần đánh giá/cập nhật CR/FD, decision_kind, liên kết dòng GI/POD/GR-FD và claim, lượng thực hiện ròng/tái mở/OD thay thế, defect hold/RECLASS/batch chốt và quyền UC-71/73/83/92/93; ngừng gọi UC-106. Chưa có schema/API/backend nào được sửa hoặc chạy thử trong lượt này.

---

# Đồng bộ toàn bộ tài liệu hiện hành, giữ Report 2 — 22/10/2026 — baseline 3.0.0

## 1. Phạm vi

Theo yêu cầu sau rà soát, Codex chỉnh sửa trực tiếp, không dùng AGY; không stage/commit. Report 2 được giữ nguyên. Phần dưới đường phân cách là lịch sử các lượt trước; các phát biểu “chưa sửa Report 1/3/hình” trong những lượt đó chỉ đúng tại thời điểm ghi nhận.

Đã xử lý SYNC-01–09 trong [báo cáo trước sửa](docs/07_ra_soat/Bao_cao_dong_bo_tai_lieu_2026-10-22.md); chi tiết và giới hạn tại [kết quả hậu kiểm](docs/07_ra_soat/Ket_qua_dong_bo_tai_lieu_2026-10-22.md). OBS-01 về Report 2 tạm hoãn.

## 2. Thay đổi

- Report 1/3: tám BF; SO UC-45–48, WIR UC-109, Warehouse POD có ảnh UC-110 và Sales PAY-CFM UC-111. Catalogue, actor associations, permissions, đặc tả, BR-01–33, SC-01–31, NFR và lỗi cùng phiên bản. Giữ 111 ID, 98 active/13 retired; 31 screen, 28 active/3 retired.
- Thay thiết kế chi tiết 1.0/16-10 bằng 3.0.0, giữ MongoDB runtime và ranh giới nghiệp vụ hiện hành; truy vết đủ 111 UC, 33 BR, 21 R, 40 T. Không khôi phục giá bán, hóa đơn/hoàn tiền nội bộ, vai trò mới hoặc live MISA.
- Database draw.io: 10 trang, 73 bảng đầy đủ/cột/kiểu/PK, 173 FK và 2 view; thêm các khái niệm SO/POD/PAY-CFM và sửa nguồn WIR/OD/GI theo DDL. Stub FK cục bộ có cặp cột và liên kết trang; SQL giữ nguyên.
- Tạo lại mainflow VI/EN 16 trang, cập nhật EN 8 trang, context và ảnh BF-04 VI/EN. Bản EN riêng có graph giống phần EN của bản song ngữ. Hai workbook cũ gắn nhãn lịch sử trên 24 trang, bảo toàn nội dung/ID và offset nhãn; ảnh BF-03B gốc giữ nguyên.
- Quy trình/database VI/EN: sửa nhận định nguồn/trạng thái cũ, đồng bộ API-02 chưa chốt provider, sửa căn cứ ảnh POD. Liên kết nguồn hiện hành dùng SAP v4.1 trong repo; review1/v4.2 ngoài repo được ghi rõ là nguồn lịch sử chưa đóng gói.
- README: mục lục đủ tài liệu hiện hành/lịch sử, 6 biên bản và CSV. Báo cáo trước sửa được thêm nhãn snapshot; kết quả sau sửa nằm ở tệp hậu kiểm riêng.

## 3. Kiểm tra

41 kiểm tra tự động tài liệu đạt, bao gồm liên kết file; đối chiếu 30 bảng/9 Mermaid blocks quy trình VI–EN, 16 bảng/ERD thiết kế dữ liệu, 37 A/E, 33 BR và đủ R/T. Kiểm độc lập 73 PK và từng tuple của 173 FK với SQL, cùng SHA nguồn; các link trang draw.io không treo.

Validator của ba workbook hiện hành báo 0 lỗi/0 cảnh báo, score 0. draw.io desktop 32.5.5 xuất thử toàn bộ 34 trang; đã xem ảnh tổng hợp và trang trọng điểm, xuất lại hai PNG BF-04 từ workbook hiện hành. `git diff --check` đạt, không stage/commit.

Hash 17 tệp cần bảo toàn khớp trước sửa: Report 2, khảo sát/6 biên bản, 5 PDF/link nguồn, SQL và hai PNG lịch sử. Chưa sửa Word/Google Docs ngoài repo, chưa chạy SQL Server/MongoDB/backend; 40 case T là tiêu chí nghiệm thu, không phải báo cáo backend tests. Các tham số thực địa/vận hành chưa xác minh vẫn để mở.

---

# Tách chuyển vị trí và điều chuyển liên kho — 22/10/2026 — phiên bản 3.0.0

## 1. Yêu cầu và phạm vi

Theo yêu cầu mới nhất, tách hai nội dung của BF-03 cũ thành hai quy trình độc lập; Codex sửa trực tiếp, không dùng AGY. Tiếp tục giữ các cập nhật thiết kế dữ liệu và chỉnh câu chữ từ lượt trước. Sáu tệp được cập nhật: hai bản quy trình EN/VI, hai bản thiết kế database EN/VI, SQL tham chiếu và change log. Không stage/commit, không sửa các báo cáo hoặc hình xuất riêng.

## 2. Ánh xạ mã quy trình

| Mã trước khi tách | Mã hiện tại | Quy trình |
|---|---|---|
| BF-01 | BF-01 | Bổ sung hàng, đặt mua và nhập kho |
| BF-02 | BF-02 | Hàng lỗi |
| BF-03A, nhánh chuyển vị trí | BF-03 | Chuyển vị trí trong cùng kho |
| BF-03B, nhánh liên kho | BF-04 | Điều chuyển giữa các kho và xử lý chênh lệch |
| BF-04 | BF-05 | Kiểm kê, đối chiếu và điều chỉnh |
| BF-05 | BF-06 | Đơn bán, xuất kho, giao hàng và hoàn thành đơn |
| BF-06 | BF-07 | Khách trả hàng |
| BF-07 | BF-08 | Trả nhà cung cấp |

BF-03 có trigger, bốn bước, kết thúc, chứng từ TO-RELOCATE, ngoại lệ và sơ đồ riêng; Warehouse thực hiện, không Owner duyệt, không tạo TR/TD/MWTR. BF-04 có trigger riêng và chuỗi TR → Owner duyệt → TD/HO → MWTR kiểm nhận độc lập → put-away/xử lý sai lệch. Trường hợp xuất thẳng kho khác chuyển BF-06, không tạo điều chuyển hoặc nhập giả.

Đã cập nhật tham chiếu BF đầy đủ và dạng rút gọn, mã nhánh A/E, tên mục/anchor, bảng chứng từ, UC/rule mapping, checklist đồng bộ báo cáo, trình tự triển khai và chú thích SQL. BF-03-A1 dành cho chuyển hàng đã giữ; thêm BF-03-E1 cho sai kho/khóa/thiếu nguồn. Nhánh xuất thẳng BF-03-A2 cũ trở thành BF-04-A1. Các nhánh sau đánh lại mã theo quy trình mới. Tổng hiện có 37 nhánh A/E; giữ 111 UC (98 active/13 retired), 33 BR, 21 quy tắc thiết kế dữ liệu và 40 tình huống nghiệm thu.

Việc tách mã không đổi định nghĩa bảng/cột/ràng buộc/view: SQL vẫn 73 bảng và 2 view. BF-03 ánh xạ warehouse_task/warehouse_task_line; BF-04 ánh xạ transfer_request/dispatch/receipt. Các dữ liệu SO/POD/PAY-CFM từ lượt trước được giữ nguyên, nay thuộc BF-06.

## 3. Kiểm tra và giới hạn

- EN/VI: đủ và đúng thứ tự BF-01–BF-08 ở cả phần mô tả và sơ đồ; 30 bảng có cấu trúc tương ứng; 9 khối Mermaid cùng quan hệ nối (context + 8 BF). Không còn mã quy trình ghép BF-03A/B trong nội dung hiện hành.
- Mã tham chiếu: khớp 37 nhánh A/E, 33 BR và đủ 111 UC; hai bản database khớp 16 bảng, 21 quy tắc, 40 case và ERD. Không thêm liên kết file lỗi so với bản chụp trước sửa.
- SQL: so sánh sau loại bỏ chú thích xác nhận toàn bộ lệnh thực thi không đổi so với trước khi tách; kiểm cú pháp ScriptDom hiện tại 0 lỗi/6 batch. Kết quả kiểm dữ liệu 21 trường hợp của lượt đồng bộ trước vẫn được ghi riêng phía dưới, không coi đây là chạy backend.
- Giữ nguyên nội dung nhật ký cũ làm phần lịch sử; git diff --check đạt; không stage/commit. Giữ nguyên trạng thái xóa draw.io đã có trước lượt này. Script và bản chụp kiểm tra nằm ngoài repository.

Report 1/3, Word và bộ draw.io/PNG vẫn dùng mã cũ; phải cập nhật theo bảng ánh xạ này khi đồng bộ tiếp. Lịch sử bên dưới giữ các mã BF đúng với thời điểm từng lượt, không tự đổi mã trong nhật ký cũ. Chưa chạy SQL Server hoặc backend MongoDB; Mermaid được đối chiếu cấu trúc, chưa xuất lại bộ hình.

---

# Đồng bộ dữ liệu và rà soát BF-05 — 21/10/2026 — phiên bản 2.0.0

## 1. Yêu cầu và phạm vi

Người dùng yêu cầu sửa thiết kế dữ liệu theo quy trình hiện tại, kiểm tra lại nội dung AGY đã tạo, giảm highlight, làm rõ tiếng Việt và cập nhật change log. Lượt này do Codex sửa trực tiếp theo chỉ dẫn mới nhất, không sử dụng AGY, không stage/commit. Nội dung các bản ghi trước được giữ nguyên phía dưới.

| Tệp | Thay đổi |
|---|---|
| [SQL tham chiếu](docs/03_thiet_ke/WMSD_SQL_schema.sql) | Bổ sung mô hình SO, hủy phần chưa xuất, dòng OD/GI-S, POD có ảnh và PAY-CFM; thêm khóa ngoại ghép, khóa chống trùng, CHECK trạng thái và hợp đồng transaction. |
| [Thiết kế database VI](docs/03_thiet_ke/de_xuat_database_design_VI.md), [EN](docs/03_thiet_ke/de_xuat_database_design_EN.md) | Đồng bộ 7 quy trình theo BF-05 mới; cập nhật nguồn, MongoDB mapping, bảng/quan hệ, ERD, quyền, trạng thái, quy tắc và nghiệm thu. |
| [Quy trình VI](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), [EN](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) | Rà nội dung AGY: viết gọn BF-05, bỏ nhấn mạnh dài và định dạng code trên chữ viết tắt nghiệp vụ; chỉnh tiếng Việt; làm rõ số lượng cam kết, trạng thái xác nhận và cách đính chính. |
| [Nhật ký này](change_logs.md) | Ghi tác động, kết quả kiểm tra thực tế và giới hạn; giữ toàn bộ lịch sử trước lượt sửa. |

## 2. Tác động và quyết định thiết kế

- Luồng thống nhất: SO nhập lại từ MISA/giấy tờ → WIR liên kết → OD/soạn/PGI → Warehouse xác nhận POD kèm ảnh → DELIVERED → Sales xác nhận nhận đủ tiền ngoài hệ thống (PAY-CFM) → COMPLETED.
- Thay đổi hợp đồng dữ liệu WIR: tham chiếu trực tiếp external_line được thay bằng SO/dòng SO bắt buộc. Các FK ghép giữ đúng chuỗi chứng từ và chặn dòng thuộc đơn/yêu cầu khác. Một nguồn chỉ có một bản sao SO; sửa/mở lại dùng SO cũ. Đây là thay đổi phiên bản lớn của mô hình tham chiếu, không phải migration đã chạy trên cơ sở dữ liệu thực.
- SQL tăng từ 64 lên 73 bảng, giữ 2 view. Chín bảng mới: sales_order, sales_order_line, sales_order_cancellation, outbound_delivery_line, sales_goods_issue_line, customer_delivery, customer_delivery_line, external_payment_confirmation và business_operation. Tệp ảnh tiếp tục dùng evidence riêng tư; ảnh POD/tệp PAY-CFM phải thuộc đúng phiếu.
- Tổng cam kết WIR tính cả phần đã xuất; hoàn tất WIR không làm phát sinh lại nhu cầu. Tổng OD nằm trong WIR, tổng POD đã xác nhận chưa hủy hiệu lực nằm trong PGI hợp lệ. Kiểm tổng nhiều dòng và cập nhật đồng thời là trách nhiệm service/transaction, không tuyên bố CHECK/FK đã thực hiện thay.
- Chuẩn hóa POD/PAY-CFM thành DRAFT → CONFIRMED, hoặc VOIDED khi đính chính có lý do. Giao một phần thuộc trạng thái SO. Hủy toàn bộ khi chưa giao là CANCELLED; không tự thành DELIVERED/COMPLETED. Đính chính tăng phiên bản SO, tính lại tiến độ và không tái dùng điều kiện hoàn thành cũ.
- POD/PAY-CFM dùng business_operation để chống ghi lặp, cập nhật cùng SO/audit/outbox; không tạo movement hoặc đổi tồn. Hủy phần chưa xuất chỉ giải phóng lượng giữ phù hợp. Khách trả thông thường vẫn giữ lịch sử giao/nhận tiền và dùng BF-06 riêng.
- Giữ 5 vai trò, 111 UC (98 active/13 retired), BR-01–33 và 36 nhánh A/E. Thiết kế database bổ sung R-16–21 và T27–T40, tổng 40 tình huống nghiệm thu đề xuất. Không thêm phân hệ thu tiền, hóa đơn, công nợ hoặc đồng bộ MISA tự động.
- Tác động triển khai: cần cập nhật API/service/validator/index MongoDB và kiểm thử đồng thời trước sử dụng. Rủi ro chính là vượt nguồn, xác nhận giao thiếu ảnh, hoàn thành sớm hoặc dùng xác nhận cũ; đã mô tả điểm kiểm và case nghiệm thu. Chưa có mã backend/lịch sprint để ước lượng thời gian triển khai đáng tin cậy.

## 3. Kiểm tra đã thực hiện

| Kiểm tra | Kết quả và giới hạn |
|---|---|
| Cú pháp SQL Server | Microsoft ScriptDom TSql160Parser: 0 lỗi, 6 batch. Parse không thay thế chạy SQL Server. |
| Khóa/FK/CHECK | 21 kiểm tra trên SQLite in-memory sau chuyển đổi cú pháp DDL: chuỗi SO–WIR–OD–GI–POD–PAY hợp lệ; chặn nguồn trùng, sai chứng từ cha, ảnh sai/thiếu, lượng âm, trạng thái sai, xác nhận tiền thiếu căn cứ/không đủ/lặp phiên bản, mã chống trùng và hủy không hợp lệ. Không mô phỏng đầy đủ kiểu số, collation hoặc transaction SQL Server/MongoDB. |
| Bảo toàn mô hình kho | So sánh với bản chụp trước lượt sửa: định nghĩa 58 bảng cũ ngoài nhóm được sửa và cả hai view inventory_ledger/available_stock giữ nguyên. |
| Hai bản quy trình | Khớp 111 mã UC, 33 BR, 36 nhánh A/E; 29 bảng cùng cấu trúc và 8 sơ đồ cùng quan hệ nối. Không còn định dạng code trên SO/WIR/POD/PAY-CFM/DELIVERED/COMPLETED hoặc đoạn nhấn mạnh dài. |
| Hai bản thiết kế database | Khớp 21 mã quy tắc, 40 case T01–T40, 16 bảng cùng cấu trúc và ERD; có đủ thực thể và quyền cho UC-109–111. Đây là kiểm tra tài liệu, không phải 40 case đã chạy trên backend. |
| Liên kết, lịch sử và Git | Không thêm liên kết file lỗi; giữ lịch sử nhật ký và các thay đổi có sẵn; git diff --check đạt; không stage/commit. Script kiểm tra và bản chụp nằm ở thư mục tạm ngoài repository. |

## 4. Giới hạn và tài liệu còn cần đồng bộ

Report 1/3 dạng text, Word, hình PNG và draw.io chưa được sửa trong lượt này; ghi chú trong tài liệu phân biệt rõ baseline cũ với thiết kế hiện hành. File docs/04_so_do/WMSD_Mainflows_VI_EN.drawio đã ở trạng thái bị xóa khi bắt đầu lượt này và được giữ nguyên trạng thái; liên kết tới file đó vẫn chưa có đích. Chưa chạy SQL Server hoặc backend MongoDB để kiểm phân quyền, lưu ảnh, transaction/concurrency và toàn bộ quy trình đầu cuối.

---

# Nhật ký cập nhật BF-05 trong Đề xuất quy trình 2 — 21/10/2026 (Lượt sửa đổi BF-05)

## 1. Phạm vi và căn cứ thực hiện

- **Yêu cầu người dùng (21/10/2026):** Sửa BF-05 (xuất hàng, soạn hàng, giao hàng) và toàn bộ các phần liên quan trong hai bản Đề xuất quy trình 2 song ngữ theo luồng: bước đầu Sales Staff tạo đơn bán (`Sales Order` — `SO`) bằng cách sao chép/nhập lại đơn bán từ bên ngoài đã xác minh (MISA, giấy tờ, ...), sau đó mới tạo yêu cầu xuất hàng (`Warehouse Issue Request` — `WIR`) liên kết với đơn bán `SO`; có bước giao hàng cho khách kèm chụp ảnh xác nhận để cập nhật trạng thái đơn sang đã giao (`DELIVERED`); khi Sales Staff xác nhận đã nhận đủ tiền ngoài hệ thống thì cập nhật trạng thái đơn sang hoàn thành (`COMPLETED`); cập nhật tất cả phần liên quan trong hai file quy trình và nhật ký này.
- **Phạm vi 3 file tài liệu được phép sửa của nhiệm vụ này (phân biệt với thay đổi đồng thời ngoài nhiệm vụ trong workspace):**
  1. [docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md)
  2. [docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md)
  3. [change_logs.md](change_logs.md)
- **Thực thi, kiểm chứng độc lập của Codex và ghi chú workspace:** Phần triển khai được ủy quyền cho AGY thực hiện; lượt kiểm chứng độc lập ban đầu của Codex đã hoàn tất với kết quả thực tế: hai bản EN/VI đều khớp đúng 33 mã `BR`, 36 mã nhánh `A/E`, 27 bảng với kích thước dòng/cột tương ứng, 8 khối Mermaid đóng/mở fence đầy đủ; toàn bộ nội dung nhật ký trước khi chạy được bảo toàn nguyên vẹn làm phần hậu tố chuẩn hóa line-ending; `git diff --check` đạt; không có stage hay commit. Tiếp theo kết quả review của Codex, lượt hiệu chỉnh tập trung này cập nhật nhánh vòng lặp giao hàng/ảnh chụp trong Mermaid BF-05, trần định lượng theo từng tầng dòng (`SO` → `WIR` → `OD` và `POSTED GI-S` → `POD`) và quy tắc hủy toàn bộ đơn (`CANCELLED` so với `DELIVERED` khi lượng active `> 0`), sau đó Codex thực hiện lượt kiểm chứng độc lập cuối cùng. **Ghi chú trạng thái workspace:** file `docs/04_so_do/WMSD_Mainflows_VI_EN.drawio` đã bị xóa đồng thời ngoài phạm vi nhiệm vụ (`git status D`) trong quá trình chạy trước; thao tác `git checkout` khôi phục trái phép của AGY đối với file đó đã được hoàn tác (sau khi xác minh nội dung khớp `HEAD`) để trả lại đúng trạng thái `DELETED` đã quan sát, nên `git status` tổng thể của workspace gồm 3 file tài liệu được sửa của nhiệm vụ này cùng 1 thay đổi xóa `drawio` độc lập đó.

## 2. Tóm tắt thay đổi trong hai bản Đề xuất quy trình 2 (VI & EN)

| Nhóm nội dung | Nội dung cập nhật chính |
|---|---|
| Ranh giới phạm vi & Thuật ngữ (`SO`, `WIR`, `POD`, `PAY-CFM`) | Giữ ngừng (retired) tính giá bán (`UC-23–25`), hóa đơn nội bộ (`UC-59–62`) và workflow hoàn tiền (`UC-74–78`). Thay vì bỏ hoàn toàn `SO` nội bộ, giữ `Sales Order` (`SO`) làm bản ghi theo dõi nội bộ do Sales Staff sao chép thủ công từ đơn bán bên ngoài đã xác minh (MISA/giấy tờ) kèm mã tham chiếu đơn/dòng nguồn và tệp/ảnh bằng chứng. Tách rõ `SO` với `WIR` liên kết, `POD` (xác nhận giao khách kèm ảnh) và `PAY-CFM` (xác nhận của Sales về việc đã thu đủ tiền ngoài hệ thống). |
| Luồng chính BF-05 & Mermaid BF-05 | Cập nhật thành 10 bước có thứ tự: (1) Sales tạo `SO` sao chép từ đơn ngoài đã xác minh → (2) Sales tạo `WIR` riêng biệt liên kết ở cả cấp header và dòng số lượng với `SO` đã lưu (`tổng WIR active <= lượng_đặt − lượng_hủy` trên dòng `SO`, `tổng OD active <= lượng WIR` mà không cộng gộp `WIR` với `OD`; tạo `SO`/`WIR` không đổi tồn) → (3–4) kiểm tra khả dụng, gợi ý BF-03/BF-01 khi thiếu và thống nhất khách → (5–7) giữ hàng theo FIFO tương thích, tạo task soạn `TO`, soạn/đếm vào staging, xử lý thiếu/lỗi qua BF-02/BF-04 → (8) lập `GI-S`, bàn giao kho `HO` và post `PGI` trừ tồn đúng một lần (bàn giao carrier/`PGI` không tự chuyển `DELIVERED`) → (9) Warehouse Staff xác nhận giao khách thực tế kèm ảnh chụp bắt buộc (`POD`, `UC-110` gắn với dòng `GI-S` đã `POSTED`, kiểm tra nguyên tử `tổng POD <= lượng PGI hợp lệ đã POSTED`) để chuyển `SO` sang `DELIVERED` khi lượng đặt active còn lại `> 0` đã giao đủ kèm ảnh (Mermaid BF-05 tách riêng nhánh thiếu ảnh/chờ khách nhận chỉ quay lại bước `POD`, nhánh từ chối/trả hàng sau `PGI` chuyển `BF-06`, nhánh giao một phần còn lượng chưa xuất mới quay lại bước kiểm nguồn kho `B`) → (10) sau `DELIVERED`, chỉ Sales Staff xác nhận đã nhận đủ tiền ngoài hệ thống (`PAY-CFM`, `UC-111`) để chuyển `SO` sang `COMPLETED`. |
| Luồng thay thế & ngoại lệ BF-05 (`05.X`) | Cập nhật `BF-05-E1..E3`, `BF-05-A1..A2` và bổ sung `BF-05-A3` (tiền ngoài hệ thống chưa thu/thu một phần/chưa rõ hoặc trả trước khi `DELIVERED`): chặn tạo `WIR` không có `SO` hoặc vượt lượng dòng `SO`; thiếu ảnh chụp giao hàng hoặc giao một phần/từ chối nhận chỉ giữ `PARTIALLY_DELIVERED`; chưa nhận đủ tiền ngoài hệ thống thì giữ `DELIVERED`; biết trả tiền sớm trước khi giao đủ hàng kèm ảnh không thể chuyển `COMPLETED`; không tự cộng/trừ tồn kho khi đổi trạng thái đơn. |
| Vai trò, Catalogue UC (111 mã) & Ma trận phân quyền | Giữ nguyên 5 role (`Store Owner`, `Sales Staff`, `Warehouse Staff`, `Accountant`, `Administrator`), không thêm role tài xế/thu ngân. Giữ `UC-45–48` cho danh sách/chi tiết/tạo/cập nhật bản sao `SO` và theo dõi tiến độ; bổ sung 3 UC mới: `UC-109` (*Manage Linked Warehouse Issue Requests* — Sales tạo/sửa/hủy phần chưa xuất, các role nghiệp vụ khác xem theo phạm vi), `UC-110` (*Confirm Customer Delivery with Photo Evidence* — Warehouse Staff), `UC-111` (*Confirm External Receipt and Complete Sales Order* — chỉ Sales Staff). Giữ `UC-108` của Accountant cho đối chiếu/tham chiếu chứng từ bên ngoài, không thay thế bước hoàn thành đơn của Sales. Tổng số mã UC: **111 mã (`UC-01–UC-111`), gồm 98 active và 13 retired** (13 mã retired giữ nguyên). |
| Quy tắc nghiệp vụ (`BR-01–BR-33`), Chứng từ, Trạng thái & Nghiệm thu | Cập nhật `BR-14`, `BR-25`, `BR-26`, `BR-28` và bổ sung `BR-31` (bắt buộc `SO` sao chép từ nguồn ngoài trước `WIR`, trần định lượng từng tầng `SO` → `WIR` → `OD`), `BR-32` (Warehouse xác nhận `POD` gắn dòng `GI-S` đã `POSTED` kèm ảnh chụp bắt buộc, kiểm tra nguyên tử không vượt lượng `PGI` hợp lệ, idempotent cùng operation key không trừ tồn lần hai; chỉ sang `DELIVERED` khi lượng đặt active còn lại `> 0` đã giao đủ kèm ảnh, còn hủy toàn bộ đơn khi thực giao bằng `0` thì chuyển `CANCELLED` chứ không `DELIVERED`/`COMPLETED`), `BR-33` (chỉ Sales xác nhận đã nhận đủ tiền ngoài hệ thống sau `DELIVERED` mới sang `COMPLETED`, không xử lý thanh toán/hóa đơn hay đổi tồn). Cập nhật bảng chứng từ (`SO`, `WIR`/`OD`, `GI-S`, `POD`, `PAY-CFM`), liên kết dòng (15.2), trạng thái `SO` (15.3) tách biệt với `WIR`, chuỗi chứng từ BF-05 và 3 tình huống nghiệm thu BF-05. |

## 3. Các tài liệu ngoài phạm vi lượt này (cần đồng bộ tiếp theo)

- [docs/01_bao_cao/WMSD_Report1_Fix.docx.txt](docs/01_bao_cao/WMSD_Report1_Fix.docx.txt), [docs/01_bao_cao/WMSD_Report3_Fix.docx.txt](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt), [docs/03_thiet_ke/de_xuat_database_design_VI.md](docs/03_thiet_ke/de_xuat_database_design_VI.md), [docs/03_thiet_ke/de_xuat_database_design_EN.md](docs/03_thiet_ke/de_xuat_database_design_EN.md), [docs/03_thiet_ke/WMSD_SQL_schema.sql](docs/03_thiet_ke/WMSD_SQL_schema.sql) cũng như các file Word `.docx`, ảnh PNG và sơ đồ `draw.io` **không nằm trong danh sách file được phép sửa của lượt này** và vẫn đang ở baseline 108 UC (95 active / 13 retired) đầu ngày 21/10/2026. Mục 9 và các ghi chú liên quan trong hai bản Đề xuất quy trình 2 đã được đánh dấu rõ là danh mục yêu cầu cần đồng bộ tiếp theo cho các tài liệu đó.

---

> **Nhật ký lịch sử đầu ngày 21/10/2026 và ngày 20/10/2026:** Toàn bộ nội dung bên dưới được giữ nguyên văn để bảo toàn lịch sử. Các phát biểu trong các bản ghi cũ bên dưới như “không dùng AGY”, “bỏ SO nội bộ / thay SO bằng WIR”, “108 ID: 95 active, 13 retired” hoặc “đã đồng bộ toàn bộ 7 file” phản ánh trạng thái của các lượt trước (trước khi có yêu cầu sửa đổi BF-05 `SO` → `WIR` → `DELIVERED` → `COMPLETED` ở trên).

# Nhật ký đồng bộ WMSD — 21/10/2026

## 1. Phạm vi và căn cứ hiện hành

- Yêu cầu lần này: đồng bộ toàn bộ bảy file đã chỉ định theo quy trình mới và bổ sung các luồng ngoài happy case. Sửa trực tiếp theo chỉ dẫn mới nhất; không dùng AGY, không stage/commit, không gửi email hoặc yêu cầu review ra ngoài.
- Căn cứ: quyết định D1–D8 trong nhật ký 20/10 bên dưới, khảo sát một phản hồi lúc 09:04:25 ngày 20/10/2026 (GMT+7), và hai bản Đề xuất quy trình 2. Không tự thay đổi các quyết định đã chốt hoặc bịa thời hạn nhận trả/hệ số SKU/danh sách kho.
- Git trước sửa sạch. Chỉ bảy file được yêu cầu và nhật ký này thay đổi; tài liệu nguồn cũ/CSV, Word, hình và draw.io giữ nguyên. Bản chụp trước sửa và script kiểm tra ở thư mục tạm của phiên, ngoài repository.

## 2. Nội dung đã đồng bộ

| File | Thay đổi |
|---|---|
| [Report 1 text](docs/01_bao_cao/WMSD_Report1_Fix.docx.txt) | Đồng bộ mục tiêu, bối cảnh As-is, giải pháp, đủ 7 BF, 9 FE và giới hạn LI. Tách dữ kiện khảo sát khỏi To-be; bỏ cam kết SO/giá/hóa đơn/hoàn tiền trong WMS. Giữ thông tin dự án/stakeholders và lịch sử chỉnh sửa. Bỏ số trang Word cũ khỏi mục lục text. |
| [Report 3 text](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt) | Viết lại các phần baseline cũ và gom boilerplate lặp; đồng bộ context/mainflow/model/rules, catalogue, associations, quyền, đặc tả, màn hình/API/job, NFR và appendix. Giữ 108 ID: 95 active, 13 retired; đủ 108 đặc tả và 108 dòng quyền. 49 UC có hợp đồng thao tác cụ thể; UC xem/trace giữ input/display phù hợp và không post. UC-72 là custody/inspection trước Owner; UC-73 chỉ nhận phần đủ điều kiện đúng version/quantity. |
| [Quy trình VI](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), [EN](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) | Thêm 35 nhánh A/E ở ngay từng BF với điều kiện, người xử lý, điểm tiếp tục, tác động tồn và UC; thêm EX-01–05 dùng chung. Cập nhật phạm vi đồng bộ, trạng thái checklist, source version/correlation và tham chiếu database. |
| [Thiết kế database VI](docs/03_thiet_ke/de_xuat_database_design_VI.md), [EN](docs/03_thiet_ke/de_xuat_database_design_EN.md) | Chuyển căn cứ sang baseline 21/10 và D1–D8; xác nhận từ 3 kho nhưng chưa biết danh sách. Đồng bộ T-SQL/schema wmsd, MongoDB runtime, assessment D6, packaging, external source/correlation, enforcement R-13–15, 26 case nghiệm thu và trace nhánh ngoại lệ. Không gán kết quả PostgreSQL cũ cho T-SQL hiện tại. |
| [SQL tham chiếu](docs/03_thiet_ke/WMSD_SQL_schema.sql) | Thêm CHECK cố định 5 role; inspection packaging enum độc lập quality; lý do assessment không trống và index tìm assessment theo dòng/version; source_version nullable, correlation_id UNIQUE không trống; bổ sung nghĩa vụ service theo các ngoại lệ. Vẫn 64 bảng, 2 view; không thêm engine runtime hoặc stored procedure giả. |
| [Nhật ký này](change_logs.md) | Bổ sung bản ghi 21/10; giữ toàn bộ nhật ký 20/10 nguyên văn phía dưới dưới nhãn lịch sử. |

Màn hình Report 3: SC-01–24 tiếp tục active, SC-25–27 retired; thêm SC-28 External Document References. Tổng 28 ID màn hình, 25 active/3 retired. UC-103 dùng SC-10/16; UC-104 tại SC-13; UC-105 tại SC-14; UC-106/107 tại SC-19; UC-108 tại SC-28. API-02 mô tả hợp đồng lưu chứng cứ riêng tư, chưa chọn nhà cung cấp; JOB-01 chỉ xử lý thông báo kho sau commit, không có job tự tạo kiểm kê/PO.

## 3. Phủ luồng ngoài happy case

| BF | Số nhánh mỗi ngôn ngữ | Các tình huống bổ sung |
|---|---:|---|
| BF-01 | 6 | Nhu cầu đã có nguồn; từ chối/trả sửa; giao phần/chốt thiếu; thừa/sai; không nhận lượng nào; thùng mở/rách và hàng thay thế. |
| BF-02 | 4 | Lỗi trên hàng đã giữ/soạn; chưa rõ chủ/cause; duyệt phần/từ chối; chưa thực hủy/trả và chống trừ lặp. |
| BF-03 | 5 | Nội kho; xuất trực tiếp kho khác; thiếu nguồn/người nhận độc lập; nhận phần/hỏng; thừa/sai lô/thất lạc đã xác minh. |
| BF-04 | 5 | Task dở/khóa chồng; chưa đếm/0/hàng mới; quality khác mất lượng; không lệch/trả sửa; lỗi mạng khi clearing. |
| BF-05 | 5 | Nguồn chưa rõ/trùng/tranh hàng; giao phần/đổi lô; soạn lệch; hủy trước PGI/unpick; hủy/trả sau PGI. |
| BF-06 | 5 | Lịch sử ngoài WMS; D6 chưa rõ/bị loại; trả hỗn hợp; đổi assessment/vượt nguồn; rút yêu cầu/chậm giao trả custody. |
| BF-07 | 5 | NCC chưa đồng ý/đồng ý phần; tái dùng quyết định BF-02; soạn thiếu/custody; ACK lệch; đổi hàng/bồi thường ngoài WMS. |

EX-01–05: phân quyền/tách người; version/cạnh tranh nguồn; chưa rõ commit/retry; khóa kiểm kê; chứng cứ/in/email lỗi. Nhánh quy định rõ rollback/giữ trạng thái/chờ hoặc tiếp tục, không tự tạo quyền hay tăng/trừ tồn bằng đổi trạng thái.

## 4. Kiểm tra của lượt 21/10

| Kiểm tra | Kết quả và giới hạn |
|---|---|
| Catalogue ↔ đặc tả ↔ quyền | 108 ID duy nhất, tên/trạng thái khớp; 95 active/13 retired; mọi retired không có quyền hoặc bước thực thi. |
| Màn hình | 28 ID, 25 active/3 retired; mọi active UC có màn hình, không màn hình active nào gắn UC retired. |
| VI–EN và SRS | Cùng 35 mã nhánh theo thứ tự, 5 lỗi chung, 30 BR; BR tiếng Anh trong SRS trùng bộ quy trình. Hai bản quy trình cùng 27 bảng với số dòng tương ứng; hai bản database cùng 13 bảng và 26 case T01–T26. |
| Liên kết nội bộ | Các liên kết file trong 4 bản quy trình/database không có đích bị thiếu; kiểm range UC trong SRS không có range đảo/vượt 108. |
| Cú pháp SQL Server | Microsoft ScriptDom 180.140.0, TSql160Parser: 0 lỗi, 6 batch; đếm 64 bảng/2 view. Đây là parse, chưa thực thi trên SQL Server. |
| Biểu thức CHECK | 750 phép kiểm trên SQLite in-memory dùng nguyên biểu thức CHECK/enum từ DDL và hàm LEN tương thích. Gồm 720 tổ hợp D6, 9 thiếu bằng chứng thời hạn, 2 lý do trống, 1 enum D6 sai; 18 kiểm bổ sung về role/packaging/source-version/correlation và unique nguồn. Không thay thế hành vi collation, FK, service hay concurrency SQL Server. |
| Diff / phạm vi | Đọc diff các thay đổi, rà các phần nguồn/role/stock effect và whitespace; git diff --check đạt. Không stage hoặc commit; không sửa file ngoài 8 file nêu trên. |

## 5. Giới hạn còn lại

- Chỉ cập nhật các bản text/Markdown/DDL được chỉ định. Word .docx, hình nhúng, PNG và draw.io không được sửa trong lượt này; sơ đồ Mermaid/context/ER và nội dung text hiện hành không làm ảnh cũ tự đổi. Khi dựng Word/PDF mới phải thay hình cũ theo bộ này.
- Chưa có SQL Server engine hoặc backend runtime để chạy migration, phân quyền, transaction/concurrency và end-to-end. Các nhánh/26 case là tiêu chí nghiệm thu, không tuyên bố hệ thống đã vượt qua chúng.
- Chưa xác minh danh sách/địa chỉ/số kho chính xác (đã biết từ 3), người từng kho, actual calibre, hệ số từng SKU, thời hạn trả và lịch đối chiếu MISA. Không tự đặt giá trị mặc định.
- Các tham khảo sản phẩm/thuế/SAP từ bản trước là lịch sử; lượt này không tái xác minh nguồn web hay đưa hướng dẫn pháp lý mới.

---

> **Nhật ký lịch sử 20/10/2026:** phạm vi và giới hạn dưới đây mô tả lượt trước. Phần “Report 3 chưa viết lại toàn bộ”, “không sửa Report 1” và “chưa cập nhật thiết kế database” đã được thay bằng kết quả lượt 21/10 phía trên; không còn là trạng thái hiện tại của bộ text.

# Nhật ký cập nhật quy trình WMSD — 20/10/2026

## 1. Căn cứ và phạm vi

- [Khảo sát Tân Thương](docs/05_khao_sat/khao_sat_kho_gach.csv): 1 phản hồi lúc 09:04:25 ngày 20/10/2026 (GMT+7), 26 câu hỏi.
- [Đề xuất sau review1](docs/02_nghiep_vu/De_xuat_7_quy_trinh_sau_review1.md): nguồn kế thừa; giữ nguyên file gốc.
- Quyết định D1–D8 của người dùng trong chat: đã cho phép cập nhật hai bản đề xuất mới, bảng UC của Report 3 dạng text, sơ đồ mainflow và SQL tham chiếu.
- Không sử dụng AGY; không tạo commit; không gửi email hoặc yêu cầu review ra ngoài.

## 2. Quyết định áp dụng

| Mã | Nội dung đã chốt | Tác động |
|---|---|---|
| D1 | Giữ giảm tồn vật lý tại bàn giao/PGI | Lập yêu cầu chỉ giữ hàng/giảm khả dụng. Ghi rõ khác câu 17 của khảo sát và cần đối chiếu đơn MISA chưa thực giao. |
| D2 | Giữ các bộ phận tự nhập/xác nhận như bản cũ | Không thêm nhập hộ hoặc tài khoản dùng chung, dù khảo sát chọn kế toán/một người nhập chung. |
| D3 | Giữ đúng 5 application role | Store Owner, Sales Staff, Warehouse Staff, Accountant, Administrator. Warehouse Staff là tên thống nhất của Inventory Staff, không phải role mới. Không thêm mua hàng/giao hàng hoặc cơ chế ủy quyền động. |
| D4 | Có chuyển hàng giữa các kho | Giải quyết mâu thuẫn chọn có/không ở câu 13 bằng xác nhận người dùng; không sửa CSV. Giữ BF-03B và xác nhận độc lập hai đầu. |
| D5 | Giữ khóa phạm vi kiểm kê | Bổ sung lịch kiểm hằng tháng. Không chọn vừa đếm vừa nhập/xuất; không thêm job tự tạo phiên. |
| D6 | Bổ sung điều kiện khách trả | Nguyên thùng/viên lẻ chưa dùng xét từng trường hợp; không nhận đã thi công, hỏng do khách, quá hạn đã xác minh. Chưa rõ điều kiện/thời hạn thì chờ, không tự đặt số ngày. |
| D7 | Cập nhật dữ kiện có căn cứ | Từ 3 kho trở lên theo khảo sát; đã chia khu/kệ và đánh mã; ghi lô/màu/kích thước; thùng/viên/m², thùng mở, bao bì rách; dùng điện thoại; phối hợp kiểm nhận/liên hệ NCC. Không suy diễn calibre, địa chỉ, hệ số hay quyền mới. |
| D8 | Giữ các kiểm soát còn lại dưới nhãn To-be | Custody, staging/put-away, FIFO tương thích, chống post trùng, không tự duyệt, duyệt TR, không live MISA tiếp tục là thiết kế đề xuất. |

## 3. File được tạo/cập nhật

| File | Nội dung |
|---|---|
| [de_xuat_quy_trinh_2_VI.md](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) | Tạo bản Việt đầy đủ từ nguồn cũ, giữ cấu trúc thuật ngữ và 16 mục. Thêm nguồn khảo sát, bảng D1–D8, phân biệt As-is/To-be, dữ kiện đã rõ/chưa rõ, BR-29/30 và tình huống nghiệm thu mới. |
| [de_xuat_quy_trinh_2_EN.md](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) | Tạo bản Anh tương ứng đầy đủ: thuật ngữ, 7 quy trình, UC, quyền, context, 30 BR, Mermaid, nghiệm thu, nguồn, chứng từ/trạng thái và quy ước lane. |
| [WMSD_Report3_Fix.docx.txt](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt) | Cập nhật 4.1 actors, 4.2 catalogue và 4.4 permission matrix; sửa tên Warehouse Staff và ghi chú trạng thái sơ đồ cũ tại 4.3. Nội dung trước mục 4.1 và từ mục 5 trở đi được giữ nguyên. |
| [WMSD_Mainflows_VI_EN.drawio](docs/04_so_do/WMSD_Mainflows_VI_EN.drawio) | Cập nhật phiên bản/nguồn đề xuất trên 16 trang, nhãn/ghi chú liên quan khảo sát và D1–D8; giữ IDs, lanes, edges và hình học các bước hiện có. |
| [WMSD_Mainflow_BF03B_VI.png](docs/04_so_do/WMSD_Mainflow_BF03B_VI.png) và [WMSD_Mainflow_BF03B_EN.png](docs/04_so_do/WMSD_Mainflow_BF03B_EN.png) | Xuất lại hai ảnh đã được tài liệu tham chiếu từ trang 4 và 12 của draw.io cập nhật, tránh ảnh cũ lệch nhãn/ghi chú. |
| [WMSD_SQL_schema.sql](docs/03_thiet_ke/WMSD_SQL_schema.sql) | Bổ sung bảng đánh giá điều kiện khách trả theo dòng/phiên bản, CHECK và index; bổ sung các nghĩa vụ kiểm soát tại tầng ứng dụng. Bảo toàn toàn bộ dòng SQL có trước lượt này. |
| [change_logs.md](change_logs.md) | Nhật ký này: phạm vi, quyết định, thay đổi, kiểm tra và giới hạn. |

## 4. Thay đổi theo quy trình

| Quy trình | Thay đổi / phần giữ nguyên |
|---|---|
| BF-01 | Ghi chủ/kế toán có thể cùng kiểm và lưu người tham gia trong bằng chứng. Warehouse vẫn xác nhận/post GR. Bao bì rách không tự là gạch hỏng; thùng mở ghi viên thực tế. Luồng RR → Owner → Accountant PO → Warehouse nhận/put-away giữ nguyên. |
| BF-02 | Giữ nguyên luồng, quyền và tác động tồn. Không thêm quyền tự động cho người được ủy quyền trong thực tế. |
| BF-03A | Giữ nguyên di chuyển nội kho không Owner approval, bảo toàn tổng/lô/chất lượng/reservation. |
| BF-03B | Ghi có điều chuyển theo D4 và từ 3 kho theo khảo sát; danh sách kho cụ thể chưa có. Giữ TR duyệt, TD/MWTR riêng, người nhận độc lập và xử lý chênh lệch. |
| BF-04 | Thêm lịch hằng tháng, giữ khóa phạm vi đến khi hoàn tất xử lý. Phương án reconcile giao dịch sau cutoff được ghi là phương án chưa chọn. |
| BF-05 | Ghi các kênh yêu cầu thực tế nhưng Sales chuẩn hóa thành WIR có nguồn xác minh; không tích hợp tự động các kênh. Giữ PGI, reservation, partial delivery và từng bộ phận tự nhập. |
| BF-06 | Thêm điều kiện D6, phân loại theo từng lượng, phiên bản đánh giá/bằng chứng và kiểm điều kiện trước khi duyệt/post. Chưa rõ → custody/chờ xác minh; bị loại → không GR-CR, bàn giao lại nếu đã giữ hàng. Lỗi do NCC không bị đánh đồng hỏng do khách. Mermaid thể hiện riêng nhánh chưa rõ. Hoàn tiền tiếp tục ngoài WMS. |
| BF-07 | Ghi chủ/nhân viên mua hàng có thể liên hệ NCC ngoài phần mềm; Accountant vẫn nhập thỏa thuận/ACK, không thêm role. Giữ chấp thuận NCC trước xuất, duyệt nội bộ, thực xuất và đối chiếu. |

## 5. Catalogue UC và quyền

**108 mã để truy vết = 95 UC active + 13 UC retired.** Không đánh lại số UC.

| Nhóm | Cập nhật |
|---|---|
| UC-03/04/07 | Sales/Warehouse đề xuất, Owner duyệt khác người đề xuất, Accountant lập PO theo dòng đã duyệt. |
| UC-13/26/30/31 | Quy đổi/bao bì, cùng kiểm nhận không đồng nghĩa quyền post, phân biệt tồn vật lý/khả dụng/giữ hộ/đang chuyển. |
| UC-32/33, UC-52–55 | Đặt tên put-away/picking task; không gọi là tầng phê duyệt mới. |
| UC-40/41/43/44 | TR → duyệt → xuất nguồn; UC-43 đổi thành Record Transfer Dispatch, UC-104 nhận đích. |
| UC-45–48/51/58 | Sales Order đổi thành Warehouse Issue Request có nguồn ngoài; kế hoạch giao theo outstanding; PGI theo bàn giao thực tế. |
| UC-65–67 | Cách ly ngay, duyệt và thực hiện đúng lượng; không trừ lặp khi chuyển BF-07. |
| UC-70–73 | Sales tạo; Warehouse kiểm/đánh giá D6; Owner duyệt sau kiểm; chỉ post lượng đủ điều kiện đúng phiên bản. |
| UC-81–83 | Kho đề nghị/thực xuất, NCC đồng ý + Owner duyệt trước xuất; ACK về sau, đóng không trừ lại. |
| UC-86–93 | Kiểm theo tháng/mục tiêu; snapshot và FROZEN; phiếu đếm/recount; Warehouse đề xuất delta; Owner duyệt và Clear Difference riêng. UC-92 đổi tên Review Inventory Adjustment để thể hiện duyệt/từ chối/trả về. |
| UC-98–102 | Năm role, scope kho, nhật ký, báo cáo và trace theo phạm vi kho; không nhập hộ/ủy quyền động. |
| UC retired | UC-23–25 giá bán; UC-42 TO liên kho dư; UC-59–62 hóa đơn nội bộ; UC-74–78 workflow hoàn tiền. Giữ mã/lý do, không có quyền active. |
| UC-103 mới | View and Select Shortage Fulfilment Options — Sales/Warehouse; hỗ trợ BF-01/03/05. |
| UC-104 mới | Inspect and Post Transfer Receipt — Warehouse kho đích độc lập. |
| UC-105 mới | Export or Print Stocktake Count Sheet — Warehouse/Owner; giữ riêng, chưa gộp vào UC-87. |
| UC-106 mới | Approve Supplier Return and Variance Resolution — Owner; phân biệt quyết định trước xuất và xử lý sai lệch. |
| UC-107 mới | Record Supplier Agreement and Receipt Acknowledgement — Accountant; hai mốc độc lập. |
| UC-108 mới | Record External Document References — Accountant; nguồn lịch sử/hóa đơn/hoàn tiền/đối chiếu bên ngoài. |

Bảng quyền được đồng bộ cho đủ 108 mã; cả 13 retired đều không còn quyền thực hiện. Quyền xem không tự cấp quyền nhập, duyệt hoặc post. Bản đề xuất giữ ma trận nghiệp vụ tổng hợp, Report 3 giữ ma trận từng UC.

## 6. SQL: đánh giá phù hợp và bổ sung

### 6.1 Cấu trúc có sẵn phù hợp, giữ nguyên

- `app_role` có đúng OWNER, SALES, WAREHOUSE, ACCOUNTANT, ADMIN.
- `warehouse`, `location`, `user_warehouse` đã hỗ trợ nhiều kho, mã vị trí và phạm vi người dùng; không cần seed ba kho giả.
- `product_uom_version`, `document_line` đã lưu hệ số/đơn vị và snapshot để theo dõi thùng/viên/m².
- `transfer_dispatch`, `transfer_receipt`, `stock_account` đã tách xuất, nhận và transit.
- `reservation`, `posting_batch`, `stock_movement`, `available_stock` đã biểu diễn giữ hàng và ghi nhận thực xuất.
- `stocktake.mode = 'FROZEN'`, `location_lock`, snapshot/count/adjustment phù hợp D5.
- `evidence`, `document.note`, `audit_event`, `external_reference` dùng để ghi phối hợp kiểm nhận, người liên hệ NCC và kết quả bên ngoài; không cần role mới.

### 6.2 Khoảng trống và cách bổ sung

Trước cập nhật, `customer_return_line` chỉ có nguồn và lý do, chưa biểu diễn có cấu trúc các điều kiện D6. Thêm `customer_return_assessment`:

| Dữ liệu | Ý nghĩa |
|---|---|
| `return_line_id`, `assessment_no`, `document_version` | Lượng/dòng được đánh giá, lần đánh giá và phiên bản hồ sơ. Tách dòng khi điều kiện từng lượng khác nhau. |
| `packaging_condition` | SEALED / OPENED / TORN / UNKNOWN; không đồng nghĩa quality. |
| `installation_status` | UNUSED / INSTALLED / UNKNOWN. |
| `damage_cause` | NONE / CUSTOMER / SUPPLIER / OTHER / UNKNOWN. |
| `deadline_status`, `deadline_reference` | WITHIN / EXCEEDED / NOT_APPLICABLE / UNKNOWN; trạng thái đã xác minh phải có căn cứ, kể cả không áp dụng thời hạn. Không có số ngày mặc định. |
| `eligibility_status` | PENDING / CASE_REVIEW / INELIGIBLE. CASE_REVIEW chỉ có nghĩa đủ căn cứ để xét, chưa phải Owner đã chấp nhận. |
| `assessment_reason`, `assessed_by`, `assessed_at`, `approval_id` | Lý do, người/thời điểm đánh giá và liên kết quyết định. |

- `ck_return_deadline_evidence`: chặn trạng thái thời hạn đã xác minh nhưng thiếu/trống tham chiếu.
- `ck_return_eligibility`: đã thi công/hỏng do khách/quá hạn không thể là CASE_REVIEW; điều kiện chưa rõ phải PENDING nếu chưa có căn cứ loại; biết chắc điều kiện loại phải INELIGIBLE.
- Unique `(return_line_id, assessment_no)` và index theo trạng thái/dòng.
- Tầng ứng dụng phải chọn đánh giá mới nhất đúng phiên bản, kiểm kết quả inspection và approval đúng hồ sơ/dòng/lượng trước GR-CR; thay điều kiện phải đánh giá/duyệt lại. DDL không tự thực hiện các kiểm tra liên bảng này.

**Bảo toàn thay đổi có sẵn:** trước lượt này SQL đã được sửa từ PostgreSQL sang SQL Server/T-SQL, gồm `wmsd.*`, `IDENTITY`, `bit`, `datetimeoffset`, filtered indexes và `GO`. Toàn bộ các dòng đang có được giữ theo đúng thứ tự; lần này chỉ chèn bổ sung. Diff với Git HEAD lớn hơn phần thay đổi của lượt này vì bao gồm chuyển đổi cú pháp có trước.

SQL tiếp tục là **DDL tham chiếu để review**, không phải schema runtime MongoDB, không phải migration đã triển khai và chưa có posting/authorization service.

## 7. Kiểm tra đã thực hiện

| Kiểm tra | Kết quả và giới hạn |
|---|---|
| Giữ nguyên tài liệu gốc | Không sửa `De_xuat_7_quy_trinh_sau_review1.md` hoặc CSV. |
| Bảo toàn phần Việt không thay đổi | So sánh nguyên văn mục 3, 6, 7, 13, 14, 15 với nguồn cũ: trùng khớp. Các mục còn lại sửa tại phần có tác động hoặc thêm dữ kiện. |
| Tương ứng Việt–Anh | Đủ 16 mục đánh số, 19 bảng có cùng số dòng tương ứng, 7 BF chi tiết và 7 Mermaid mainflow mỗi bản; cùng các mã BR/UC. Đã đọc đối chiếu nội dung, không chỉ đếm mục. |
| Catalogue / permission | 108 mã duy nhất; 95 active, 13 retired; đủ 108 dòng quyền; mọi retired đều không có quyền. |
| Phạm vi Report 3 | Nội dung trước 4.1 và từ mục 5 trở đi trùng bản trước sửa. 4.3 chỉ đổi tên role và ghi chú sơ đồ cũ cần đồng bộ. |
| Draw.io | `validate.py --score`: 0 lỗi, 0 cảnh báo; 16 trang. IDs/lane/edge và geometry bước không đổi; chỉ tăng vùng note/page ở trang cần ghi chú dài. |
| Bản vẽ xuất | Draw.io Desktop 32.5.5 xuất thành công PDF kiểm tra đủ 16 trang và ảnh PNG; đã xem toàn bộ bố cục qua contact sheet và BF-06 Việt/Anh ở kích thước đọc được. Hai PNG BF-03B đã xuất lại. |
| Cú pháp SQL | Microsoft ScriptDom 180.140.0, parser `TSql160Parser`: 0 lỗi, 6 batch. Đây là parse cú pháp SQL Server, không phải chạy DDL trên SQL Server. |
| Điều kiện trả hàng | 20 tình huống thử các CHECK mới trong SQLite in-memory, giữ biểu thức CHECK và cung cấp hàm LEN tương thích: nguyên thùng, lẻ, bao bì rách, lỗi NCC, đã thi công, hỏng do khách, quá hạn, thiếu căn cứ và chờ xác minh đều cho kết quả mong đợi. Không thay thế kiểm thử SQL Server hoặc service thật. |
| Bảo toàn SQL trước sửa | So sánh với bản chụp đầu lượt: chỉ có insert, không delete/replace các dòng SQL cũ. |
| Git | `git diff --check` không báo lỗi whitespace. Không stage hoặc commit. |

Các script kiểm tra, bản chụp trước sửa, parser tải về và ảnh/PDF xem trước nằm trong thư mục tạm của phiên, không thêm vào repository.

## 8. Phần còn ngoài phạm vi / chưa xác minh

1. **Report 3 chưa được viết lại toàn bộ.** Người dùng yêu cầu cập nhật bảng UC trong bản `.docx.txt`; catalogue, actor và permission đã đồng bộ. Các mainflow bằng chữ, đặc tả UC chi tiết ở phần II, screen, entity/rule và hình nhúng cũ vẫn còn nội dung baseline. Ghi chú ngay trong mục 4.2/4.3 chỉ rõ các phần cũ không được dùng để khôi phục quyền/phạm vi đã retired. Cần một lượt đồng bộ toàn SRS trước khi gọi cả report là bản cuối. Không sửa Word `.docx` hay Report 1.
2. Không có SQL Server engine được dùng để chạy DDL hoặc test dịch vụ thực tế; chỉ kiểm cú pháp và biểu thức điều kiện như mục 7. Không chạy trên database có dữ liệu.
3. Không tự cập nhật ERD database draw.io hoặc tài liệu thiết kế database khác: người dùng chỉ chỉ định SQL và mainflow, và ERD đang là file chưa theo dõi có trước lượt này.
4. Chưa xác minh số kho chính xác/danh sách/địa chỉ, số người từng kho, actual calibre, hệ số từng SKU, thời hạn nhận trả và lịch đối chiếu MISA. Giữ các mục này ở trạng thái cần xác minh.
5. Các liên kết SAP/MISA và hướng dẫn hóa đơn được kế thừa từ đề xuất gốc; lượt này không tái xác minh toàn bộ nguồn trực tuyến hoặc quy định thuế. Không coi đó là tư vấn pháp lý được cập nhật.
6. Các file có sẵn chưa theo dõi `docs/03_thiet_ke/WMSD_database_design.drawio`, `docs/03_thiet_ke/debug.log` và CSV khảo sát được giữ nguyên. Không thu dọn hoặc gán chúng là sản phẩm của lượt này.

## 2026-10-29 — BE UC-35 / UC-36

- Added the implementation/API handoff document at `src/modules/location-movements/README.md` and linked it from the root README.
- Updated the BE context entries for UC-35/36 to point at the implemented routes. Business scope and permissions remain unchanged; FE mock screens are not represented as HTTP-integrated.
- Documented additive task-source fields and the Location planning guard in `src/models/CHANGELOG.md`, including future cross-module guard obligations and replica-set tests.

Kiểm chứng đợt native 06/11: [báo cáo](docs/08_api/ITERATION1_NATIVE_VERIFICATION.md), 75 pass/9 skip/0 fail cho bộ test hiện hành. Hai test legacy untracked không import được module đã bị main xóa, được giữ nguyên. Không ghi Atlas, commit/push hoặc merge commit.
