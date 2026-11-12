12/11/2026: Kho 3D chặng 2 thêm danh mục chức năng theo kho, vùng chữ nhật xoay, ô local có tính kích thước theo lưới pallet; vẽ/kéo khu vực và kéo ô trong 2D, phản ánh màu/vạch trên 3D. Schema layout3d mở rộng; warehouses thêm layout3dApplied/layout3dAppliedAt. API lưu nháp giữ snapshot áp dụng, apply:true kiểm containment và ghi snapshot/audit nguyên tử với optimistic updatedAt; đổi functions cần access_control:update. Chặn chồng vùng/ô, kiểm vùng trong kho lõm theo cả cạnh; vùng ngoài do sửa đường bao lưu nháp được nhưng chặn apply. Catalogue kho loại field layout nặng khỏi response danh sách. Cập nhật MODEL_MAP, Data Dictionary, sơ đồ nhúng STAGE2_ZONES, PROJECT_GUIDE, context FE/BE và model log. Không migration/seed/ghi DB chung, không đổi tồn hoặc enum vị trí nghiệp vụ. FE 13 test Kho 3D và 6 test trang kho đạt; BE 8 test hình học/schema đạt; build (kèm typecheck), lint module và docs:check đạt. Chưa kiểm WebGL trực tiếp hoặc tích hợp ghi DB.

12/11/2026: Kho 3D chặng 1 thêm warehouses.layout3d tùy chọn cho mặt bằng/tường/cửa; lưu qua PUT warehouse-catalogue/:id/layout với optimistic updatedAt, scope, transaction và audit. Không đổi collection/index hoặc tồn, không backfill/rollout DB. FE thêm Three.js, vẽ 2D theo kích thước và góc, dựng 3D có cửa, lưu/mở theo kho. Thực hiện gộp main BE với backup stash theo lựa chọn người dùng; giữ cả hai phía changelog. Hợp đồng và sơ đồ field: git_doc/docs/10_Kho3D/IMPLEMENTATION.md. FE build/lint và 9 test, BE 3 test hình học đạt; chưa kiểm DB transaction hoặc browser GPU. Các phần khu vực/ô/pallet còn tiếp theo.

# 12/11/2026 — User.lockReason

Thêm `users.lockReason` tùy chọn, tối đa 2000 ký tự, lưu lý do khoá hiện tại; dữ liệu cũ không cần backfill. API khoá ghi lý do và mở khoá xoá lý do. Không đổi collection hoặc index. Chi tiết tại [hợp đồng trạng thái tài khoản](../../git_doc/docs/08_api/USER_ACCESS_STATUS.md).

12/11/2026: bỏ document_sequences và đổi định danh chứng từ mới: mọi model có documentNo dùng _id DocumentIdentity = mã phiếu [Loại Phiếu] - [Mã kho/Bộ phận] - [YYMMDD] - [Số thứ tự]. Các ref documentId/sourceId/subjectId và hậu tố liên kết chứng từ chấp nhận mã mới hoặc ObjectId lịch sử; warehouse/product/lot/location và embedded item vẫn ObjectId. Registry còn 58 collection. Chứng từ cũ không migration/đổi _id; kiểm thử concurrency và rollback chạy DB loopback riêng. Xem git_doc/docs/08_api/DOCUMENT_IDENTITIES.md.

## 11/11/2026 — Chi tiết dòng RR theo cảnh báo

Theo quyết định người dùng, `replenishment-details.schema.js` yêu cầu `evaluatedAt` và loại nguồn khớp khi có `source`. Dòng xác nhận nhu cầu phải có giải trình. Các trường `canonicalSourceKey`, `evaluationKey`, lượng đề xuất và snapshot coverage đời cũ còn để đọc dữ liệu lịch sử. Nhánh validation cho dữ liệu không có `source` giữ quy tắc cũ. Lần đánh giá mới ghi nguồn, giải trình và các snapshot tồn, RR mở, PO còn phải nhận, ngưỡng và mục tiêu. Không đổi collection, index hoặc chạy migration. Xem [nhật ký kiểm chứng](../../git_doc/change_logs.md).

## 11/11/2026 — Bỏ lịch giao từng dòng PO

Theo quyết định người dùng, `purchase-order.model.js` bỏ `items[].deliverySchedule` và xóa `purchase-order-delivery-schedule.schema.js`. Seed PO dùng ngày dự kiến chung `header.expectedOn` cho phần chưa nhận. Không thêm collection hay index. BSON chưa ghi lại có thể còn dữ liệu lịch cũ. DTO lọc trường cũ, còn `saveVersion` loại trường khi thay mảng `items`. Không cần migration. Đã kiểm tương thích bản ghi cũ qua HTTP và kiểm PO mẫu từ bộ dựng seed. [Nhật ký thay đổi](../../git_doc/change_logs.md).

## 11/11/2026 — Đảo phiếu nhập giữ PO đã đóng

Không đổi model. Logic đảo phiếu giữ `CLOSED` cho PO đã đóng; DTO PO thêm trường dẫn xuất `hasOpenReceivingWork`. Chi tiết ở `git_doc/change_logs.md`.

## 11/11/2026 — Bỏ dữ liệu xác nhận NCC khỏi PO

`purchase-order.model.js` và `purchase-order-header.schema.js` bỏ `supplierConfirmedQtyBase`, `supplierConfirmedBy`, `supplierConfirmedAt` và `header.supplierConfirmation` theo quyết định user, 2026-11-11. Khi đọc và lưu phiên bản mới, schema PO lọc riêng các trường cũ. Bộ dựng seed loại các trường này và vẫn tạo `deliverySchedule` cho PO mẫu.

PO cũ có thể còn các trường này trên MongoDB cho đến lần ghi tiếp theo. Để có dữ liệu demo mới, seed vào DB demo trống. Lượt này không có migration. API nháp chỉ nhận ngày dự kiến chung, chưa ghi lịch giao từng dòng. Đã kiểm thử PO cũ qua HTTP, đánh giá RR theo lịch giao và xác minh PO mẫu trên MongoDB local. Xem [nhật ký thay đổi](../../git_doc/change_logs.md).

11/11/2026: theo yêu cầu người dùng thêm document_sequences và metadata tiếng Việt tùy chọn của phiếu HieuDT; documentNo tăng max cuối+1 theo loại/đơn vị/tháng, transaction an toàn; giới hạn mã 160 ký tự. Registry 59 collection, gồm 58 nghiệp vụ và 1 bộ đếm kỹ thuật. Phiếu cũ giữ mã và ID. Xem hợp đồng HIEUDT_ITERATIONS_NATIVE.


## 10/11/2026 — Lý do từng dòng yêu cầu bổ sung

`reasonNote` là tùy chọn trong chi tiết dòng và snapshot gửi duyệt. Các lý do đã lưu được giữ nguyên khi cập nhật cùng ID dòng và bỏ trường này. Không cần migration. Kiểm tra lưu nháp, cập nhật và tạo snapshot qua HTTP trên MongoDB local.

## 09/11/2026 — Conversion theo sản phẩm và lô

Thêm `conversions` với hệ số Decimal128, phạm vi sản phẩm hoặc lô, phiên bản và ngày hiệu lực. Thêm `uoms.isCarton` để đồng bộ hệ số từ quy cách lô. Registry có 58 collection. Dòng chứng từ giữ snapshot, kiểm nhận ghi hệ số lô thực. Xem [hợp đồng](../../git_doc/docs/08_api/CONVERSIONS.md) và [backfill](../../git_doc/docs/09_phat_trien/CONVERSION_BACKFILL.md).

## 09/11/2026 — URL ảnh theo thứ tự trên Product

Thêm `products.imageUrls` kiểu mảng String, mặc định `[]`, để lưu tối đa 5 URL ảnh theo thứ tự; không thêm collection/index hoặc migration. API Product kiểm cú pháp HTTPS, giới hạn 2.048 ký tự mỗi URL và loại URL trùng sau trim. Client cũ tạo sản phẩm không gửi trường vẫn nhận mảng rỗng; bản ghi cũ thiếu trường được DTO chuẩn hóa thành `[]`. Hợp đồng sửa chỉ đổi ảnh khi request gửi `imageUrls`, giữ nguyên khi bỏ trường và ghi audit khi có thay đổi. Cập nhật Model Map, Data Dictionary hiện hành, ERD và API contract. Kiểm tra 18 test Product và một test tích hợp API Product qua MongoDB local được ghi trong `git_doc/change_logs.md`.

## 2026-11-07 — Native return workflow contracts

Supplier-return details add PROPOSED/VERIFIED phase, sourceBalanceId and optional defectHoldId; actual agreement facts remain required for VERIFIED records. Defect report headers retain sourceKind; disposition details retain targetQuality. ExternalReference adds optional customer/warehouse/evidence/status/note; embedded items add historical lot/conversion/prior returns. CustodyRelease embeds the existing supplier acknowledgement schema for actual supplier-owned handbacks. These additions introduced no collections or nested schema files. The return workflow branch had 59 collections and 96 nested schema files. No bulk data rewrite or Atlas index creation. Current dictionary/schema and SQL-style diagram regenerated from the registry; runtime and compatibility rules are in ../../git_doc/docs/08_api/RETURN_WORKFLOWS_NATIVE.md. Verification is recorded in the PR evidence.

# 06/11/2026 — Iteration 1 native theo kế hoạch được duyệt

Thêm Uom, metadata sản phẩm/NCC, xử lý giữ hộ trọn vòng đời và Warehouse tự đảo nhập. Registry 60 collections; giữ items/source/snapshot native. Quyết định mới trong git_doc/docs/08_api/ITERATION1_NATIVE_2026-11-06.md. Có migration dry-run chỉ test DB local; không chạy Atlas, không commit/push. Kết quả kiểm thử ghi trong tài liệu bàn giao cùng đợt.

## 2026-11-07 — BF03/BF04 API consistency

Added partial unique indexes on ITR sourceDocumentId and TO requirementId to
enforce the existing one-source/one-requirement/one-task flow. No fields or
collections changed. Existing databases need a duplicate audit before index
deployment; only isolated local test databases were indexed in this task.
Stock movement retains original embedded packaging timestamps and IDs when
removing a preceding portion. Native integration: 5/5 passed.

## 2026-11-06 — Flat native runtime

Removed the three model directories with user approval. Registered 59 collections and 96 nested schemas from the root model directory; runtime services use this single registry. Renamed the former reviewed registry entry file and reference configurator to neutral runtime names. Added native transaction integration coverage. Seed v9 has 642 records. See ../../git_doc/docs/08_api/NATIVE_MODEL_RUNTIME.md for verification limits.

## 06/11/2026 — Giải quyết merge main và giữ ranh giới model

Merge baf5fb4 vào HieuDT; giữ API PO/nhận mua, auth, field sản phẩm/lô/NCC của main trong registry legacy (44 collection), giữ bộ schema/category v8 (59 collection). Union scripts/dependencies, sửa import API/test/tool và bổ sung export ReplenishmentSubmission. Fixture reviewed/migration tách khỏi seed PO_INSPECTION runtime bằng EJSON tổng hợp từ 5f4a296; schema lịch sử dùng connection riêng. Không đổi schema/ERD 59 collection, không ghi DB và không port API trong lượt này. Cập nhật MODEL_MAP, PROJECT_GUIDE, context, README và hướng dẫn MERGE_MAIN_2026-11-06. Kiểm chứng cuối ghi trong hướng dẫn merge.

## 2026-11-03 — Quantity-only purchase receiving v3

- Purchase inspection requires clientLineKey/planned Receiving location; removes disposition/holding/custody fields. GR lines reference PO/inspection only and receive GOOD from outside STORE. Unique draft row keys; replacement inspection links preserve the physical trip.
- Add PurchaseEvent append-only authority/correction history, PurchaseSourceClaim (zero for draft; guarded RR allowance on OPEN), ReceiptPlacement (receipt provenance/claims/actual/reversal) and PurchaseEvidenceUpload (actor/parent/private upload lifecycle). 44 collections; 36 document kinds and 22 line kinds unchanged.
- Add RR purchasingVersion guard without invalidating approval snapshots, PO creation key, schedule/replacement refs, purchase task source refs, line label snapshots, optional Evidence.lineId and command receipt references.
- Shared quality/custody/INSPECTION schemas remain for CR/FD/transfer. This decision supersedes the purchase supplier-custody notes below.

# Model changelog

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

## 06/11/2026 — Rà trường 58 bảng, seed v5

Bỏ 44 đường dẫn trường: revision trùng version ở đầu phiếu; version trên bốn danh mục và các phần nhúng theo cha; FK lặp lại trong ngưỡng, dòng nguồn và phần đóng gói tồn. Giữ phiên bản kho/tồn/quyền, mốc phê duyệt và snapshot nguồn. Converter dừng nếu revision/version khác nhau. Cập nhật schema, seed, validator sức chứa, dictionary, diagram và báo cáo từng bảng. 43 test DB/model đạt; xác minh DB mẫu v5 tại localhost. Không port API legacy, không merge main theo lựa chọn đang có của người dùng.

## 06/11/2026 — Gộp tiếp 5 bảng, 63 → 58

Theo yêu cầu người dùng: movements vào stock_transactions; holds và resolutionPlans vào defect_reports; resolutionPlans vào stocktakes; deliveryConfirmations vào sales_orders. Giữ ID/lịch sử, kiểm hồ sơ cha và trùng dòng, index truy vấn, preflight BSON. Seed v4 riêng ở localhost, API legacy chưa port. Kiểm 41 test và docs:check; kết quả local ở git_doc/outputs. Người dùng chọn tiếp tục HieuDT, chưa merge 5 commit mới của main do file trùng đang sửa; không commit/push.


## 06/11/2026 — Gộp 10 collection theo duyệt của người dùng

Reviewed registry giảm 73 → 63. Giữ ID và lịch sử trong bảng cha; packagingPortions thay chồng, ô dùng chiều cao kho. Cập nhật seed v3, bộ chuyển/kiểm dữ liệu, schema refs tới phần nhúng, sơ đồ và từ điển hiện hành. Migration profile lịch sử/API legacy tách riêng. Không ghi DB nhóm. Kiểm test:db-rebuild, seed preview/local và docs:check; báo cáo ở git_doc/outputs.


## 2026-11-05 — removed delivery-team catalogue

- Removed the reviewed `delivery_teams` collection and `DeliveryTeam` model. Handover records now keep an optional `vehiclePlate` directly on each handover; removed `carrierId` and `teamNameAtHandover` from the reviewed schema.
- Updated migration behavior: legacy carrier references cannot be converted into a plate, so they are not represented as a new catalogue record; missing historical plates are flagged for source review.
- Updated the local demo design to 73 collections / 849 records and bumped its seed version to v2. Existing v1 MongoDB demo data is preserved; load v2 into a new demo database.

## 2026-11-05 — promoted reviewed registry and local Compass database

- Promoted the approved 74-collection registry through `src/models/index.js` as `registerReviewedModels(connection)`. Legacy API modules now import explicitly from `src/models/legacy/index.js`, keeping the two schema profiles from sharing a connection.
- Removed the `_db_rebuild` marker and marker-based startup guard. Seed and verification now inspect only the registered business collections.
- Changed the local target to `mongodb://localhost:27017/wmsd_demo_tile_shop`. The synthetic tile-shop dataset was verified there with 74 collections and 851 records. Standalone MongoDB can seed/read the demo; transactional API commands still require a replica set or Atlas.

## 2026-11-05 — shared reviewed-model documentation and shop seed

- Centralized the approved design, field dictionary, diagrams and migration/local guidance under git_doc. MODEL_MAP covers all 74 collections and PROJECT_GUIDE explains the legacy/reviewed registry boundary.
- Root AGENTS.md, CLAUDE.md and GEMINI.md now require corresponding documentation updates in the same task as model or project changes. The module READMEs point to the canonical documents.
- The reviewed schemas are exercised by the new local tile-shop seed, including carton/lot identity, packaging snapshots, opening-stock ledger and physical stack reconciliation. Detailed changes and verification are in git_doc/change_logs.md.

## 2026-11-03 — reviewed schemas and synthetic demo

- Replaced the reused support schemas in the reviewed registry: reservations/expected supply, decisions/evidence, return inspections/claims, delivery reopening/commitment changes/cancellations, holds, stocktake snapshots/counts/lock history, notifications/audits/events and operation/concurrency records.
- Added reviewed workflow header/item fields, including frozen sale prices, source references, warehouse tasks, inspection/ownership, stocktake resolution and posting information. Fixed extensions on embedded item discriminators. Migration and reviewed profiles require separate connections.
- Added isolated wmsd_demo_v2 seeding with approved synthetic values, BF03/BF04 examples, multiple dispatch/receipt records, a two-dispatch invoice, recount history, capacity examples and a custom role. Preserved old databases and the current application URI.
- Added cross-document/quantity/capacity/permission checks, idempotent apply, canonical BSON fingerprinting and 17 focused tests (27 including prior migration tests). Legacy API migration remains pending; current API cannot use the demo schema yet.

## 2026-11-02 — isolated DB rebuild

- Added the public registerRebuildModels factory with 74 target schemas, explicit collection names and readable model names. Reuses existing typed workflow details while introducing embedded items, explicit source references, handovers, inline unit conversion, split party catalogues, typed stock ownership, warehouse dimensions, stacks and accepted-quantity invoices.
- Added native-driver snapshot migration, backup, source/reference/quantity reconciliation and post-write verification. Applied to sep490_rebuild_20261102 and retained sep490 as the application database.
- The rebuilt database remains REVIEW_REQUIRED. Missing source values and incomplete runtime/field mappings are listed in src/models/rebuild/README.md. D07/D08 retain existing schemas pending their business decision.
- Added migration regressions and a pre-connection guard against starting the legacy API or seeder on the rebuilt/backup database.

## 2026-11-03 — Remove the old purchase receiving chain

- Remove ARRIVAL discriminator/catalogue entry; 36 document kinds remain. Shared INSPECTION remains for customer returns and failed deliveries.
- GR_PURCHASE now requires purchaseOrderId, poInspectionId and supplierId. PO/supplier readers support only PO_INSPECTION purchase sources, without legacy chain traversal.
- Remove old purchase arrival/inspection fixtures from seed. The approved local sep490 reset uses the new chain only; prior data was backed up before recreation.

## 2026-11-03 — Receiving draft identity and planned destination

- PO_INSPECTION lines optionally preserve clientLineKey and plannedReceiptLocationId. Draft saves retain line IDs when the same key is supplied; confirmed facts remain immutable. Legacy clients without keys retain their existing behavior.

## 2026-11-02 — PO receiving and supplier custody

- Add PO_INSPECTION typed header and line; PURCHASE_RECEIPT lines preserve PO/inspection/custody source and destination.
- GR_PURCHASE adds optional PO/inspection/supplier and deliverer snapshots; commands enforce their presence/consistency for new purchase receipts. One GR per inspection is indexed uniquely.
- BusinessOperation result can preserve custody/GR/posting batch IDs for idempotent replay. Existing CR/FD INSPECTION representation is retained.
- Demo purchasing now records supplier custody before ownership transfer; reset CLI is restricted to explicitly selected local sep490 with a completed external EJSON backup.


Record future changes to model files here, including the date, affected models, and a concise description of the change. This log starts on 2026-10-28; it does not reconstruct earlier model history.

## 2026-10-30 — Iteration 1 master, lot, RR snapshot and audit history

- Product: version and optional tile metadata/dimensions; status index.
- ProductUomVersion: createdBy/verificationReference and current-version index.
- Party: version, supplier contact fields, cooperationStatus/statusReason and
  supplier status index.
- Lot: version/createdBy/notes/verification facts/identityLocked.
- Approval line: optional reason.
- BusinessOperation: optional result.workflowStatus/approvalId.
- AuditEvent: optional entityType/entityId/changes and entity history index.
- New append-only ReplenishmentSubmission collection
  (`replenishment_submissions`), unique per document/version.
- REPLENISHMENT line details: optional removedAt.
- Collection representation changes from 39 to 40.
- Migration: `npm run migrate:iteration-1` (dry-run default).

## 2026-10-29 — UC-35 / UC-36 relocation source and planning guard

- WAREHOUSE_TASK details add optional sourceBalanceId, sourceBalanceVersion and ownerPartyId. New UC-36 tasks always record them; existing tasks remain readable. No quantity or reservation is changed on creation.
- Location adds planningVersion (default 0) to serialize overlapping task planners. Existing rows acquire it on the first guarded write; no bulk migration or new collection/index is required. Future stocktake/task/posting writers must share this guard.
- API and verification contract: [location movements](../modules/location-movements/README.md).

## 2026-10-30 — BF04 internal requirements

Added INTERNAL_TRANSFER_REQUIREMENT with warehouse, source document and PICK/PUTAWAY kind.
Added TRANSFER_OUTBOUND line details linking TR line, source balance and staging bin.
TRANSFER_RECEIPT optionally stores destination balance and receiving location;
TRANSFER_REQUEST optionally stores approvedVersion so read projections retain the
approved quantity after closure. Existing records remain valid. No production data migration was run.

## 07/11/2026 — Nguồn và kiểm soát đồng thời RR

Theo kế hoạch người dùng duyệt: thêm STOCK_THRESHOLD, nested ReplenishmentSource, canonicalSourceKey/xác nhận nhu cầu độc lập và snapshot evaluation trên submission. SO thêm replenishmentPlanningVersion mặc định 0. Không tăng collection (60); nested schemas 97. Lock có unique kho/sản phẩm hiện hữu được dùng trong transaction; không migrate/xóa dữ liệu từ schema. Hợp đồng tại ../../git_doc/docs/08_api/REPLENISHMENT_COVERAGE.md.
## 09/11/2026 — GoodsReceipt chung cho năm loại phiếu

Thay bốn collection phiếu nhập bằng `goods_receipts`, đăng ký GoodsReceipt và năm discriminator `documentKind`. Giữ trường chung, header riêng, 19 cấu trúc dòng và hai lịch sử giao thất bại; index mã phiếu theo loại. `OTHER` có trường duyệt/hash phiên bản và liên kết phiếu thay thế. Seed dựng sạch gộp bốn mảng sau khi xử lý fixture lịch sử; không có migration DB cũ. Xem [từ điển hiện hành](../../git_doc/docs/03_thiet_ke/DB_Current_2026-11-09_57/WMSD_Data_Dictionary.md).
