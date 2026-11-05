# Nghiệm thu BE nhận mua v3 — 03/11/2026

Phạm vi theo plan BE được người dùng yêu cầu thực hiện: chỉ ghi lượng đồng ý nhập; confirm không stock; post GR nhận STORE tại Receiving. Không triển khai UI, hàng sai/lỗi/unknown hay custody resolution. Contract: [BACKEND_V3.md](BACKEND_V3.md).

## Kết quả thực chạy

| Kiểm tra | Kết quả |
|---|---|
| Toàn bộ BE, MONGODB_TEST_URI trên replica set local, database random riêng | **189 tests: 187 pass, 0 fail, 2 skip opt-in storage live**; khoảng36 giây |
| Purchase storage live chạy riêng, dotenv + LIVE_PURCHASE_EVIDENCE_TEST=true | **1/1 pass**: PNG/PDF authenticated upload, signed download200, unsigned delivery bị chặn, destroy tệp thử thành công |
| Node HTTP receiving suite | RR submit/Owner review → Accountant PO → nhiều đợt → GR → put-away; concurrency, correction, scope, history/queue và đối soát cuối đều pass trong full run |
| File parser tests | JPEG/PNG/PDF decode thật; fake/truncated/oversize/huge images bị chặn |
| BF-04 / relocation / RR / PO / supplier / lot / model / seed regression | Pass trong full run; BF-04 full confirm giữ nguyên |
| git diff --check | Pass |
| Reset dry-run và reset thực local sep490 | Pass, backup hoàn tất trước drop |
| Đối soát sau reset | **ok=true, issues=[]**: 12 balances,22 movements,1 placement,2 claims,2 PO |
| Evidence cleanup preview sau reset | dryRun=true, expired=0; không xóa chứng cứ demo đã attach |

Hai skip trong full run là test storage live của Sales và Purchase. Purchase đã được bật và kiểm riêng thành công; Sales live không chạy lại trong gói này. Không chạy FE/browser E2E vì không sửa UI. Kết quả không phải nghiệm thu tải production.

## Kịch bản có regression

- PO100 nhận40+35+25: ròng40/75/100, PARTIAL/PARTIAL/COMPLETED, confirm không movement/balance và không tăng custody NCC.
- Nhận70 thì còn30; old disposition/holding payload bị từ chối. Stable key giữ cả line ID lẫn LineLink ID; reorder không đổi identity; stale/key mismatch không ghi đè.
- GR nháp70 giữ headroom, confirm40 vượt30 bị409; confirm cạnh tranh chỉ một nhánh thành công.
- Hai PO80 cùng RR100: draft không giữ cap, chỉ một confirm OPEN được phép giữ80.
- Hủy GR giải phóng cap mà không stock; cancel-versus-post chỉ một branch commit. Freeze làm rollback ledger/projection/versions.
- PO draft update giữ ID và nguồn duyệt; PO OPEN không PUT facts. Amendment dùng RR bổ sung20, giữ ordered gốc100 và authorized120.
- Schedule không movement. Chốt thiếu50 sau nhận70/authorized120 cần đúng Owner authority và source version, kết quả CLOSED/closed50/net70/outstanding0, không post giả.
- Put-away GR70 trên PO COMPLETED: split40/30, actual20/20/30, tổng STORE không đổi; cạnh tranh task không overclaim; partial cancel chỉ giải phóng remainder.
- Receiving relocation không được bỏ qua receipt provenance; put-away mang reservation theo khi cần.
- Reversal có evidence: đảo toàn GR đúng một lần, net PO giảm và mở lại; preflight/execute chặn freeze/reservation/hold/task mới và actual placement/downstream. Không force balance.
- Correction trước post cancel GR và tạo replacement nguyên tử; correction sau reversal giữ rootInspectionId và arrivedAt, trip count vẫn1, không tạo chuyến giao giả.
- Evidence kiểm actor/parent/bytes/size/private delivery; attach replay không nhân bản, cleanup chỉ dọn orphan. Metadata đọc không lộ objectKey/hash.
- Owner/Accountant đọc summary không cần create; Admin/Sales không mutate; actor mất kho không replay. History mua không mở history TO/PICK khác; count/filter/pagination và queue đúng scope.
- Ledger/claims/placements của toàn bộ fixture + các command trong suite đối soát không lệch.

## Benchmark và tối ưu

Đã chạy `npm run purchase:benchmark` trên database random local rồi xóa database thử. Fixture thêm100 PO ×100 inspections=10.000 đợt,5.000 GR nháp,15.100 documents,15.100 lines và10.000 links; không tạo stock posting để sinh tải. Mỗi phép đo có2 warm-up và12 mẫu tuần tự. Chi tiết máy đọc được tại [benchmark-v3.json](benchmark-v3.json).

| Service | p50 ms | p95 ms | Query count |
|---|---:|---:|---:|
| trips, page size5 |48.64|57.60|7|
| trips, page size50 |60.73|66.00|7|
| receiving summary |61.50|68.84|24|
| queue, page size20 |32.32|45.48|5|
| PO list, page size20 |180.52|257.48|23|

Query count trips không tăng theo số mục trên trang. Đã thay các vòng find lồng nhau trong reader nguồn PO bằng map/set và batch labels, phân trang PO ở DB trước tính quantities khi không lọc derived outstanding. Cùng fixture, PO list p50 trước tối ưu4940.30ms, sau180.52ms. Bộ lọc outstanding vẫn cần tính derived quantity trước count/pagination; chưa có projection materialized cho bộ lọc đó. Các số trên là đo service/warm cache local, không phải concurrency benchmark hoặc SLA.

## Reset local và dữ liệu sau reset

Đã chạy CLI chỉ cho `mongodb://localhost hoặc127.0.0.1/sep490`, flags `--apply --reset-demo --database=sep490`. Không drop database khác. Backup manifest:

`C:/Users/minhs/.codex/backups/sep490-po-receiving-1793704240120/manifest.ejson`

Hậu kiểm trực tiếp: 44 collections, ARRIVAL0, DEMO-PURCHASE-CUSTODY0, PO_INSPECTION1, GR_PURCHASE1, PurchaseSourceClaim2, ReceiptPlacement1. GR demo nhận từ bên ngoài, task purchase đã cất đủ120; PO demo OPEN100 có RR duyệt và source claim hợp lệ. Seed vẫn giữ credentials, CR/FD/transfer và shared custody của các phân hệ đó. Không dựng submission lịch sử giả.

Đã chạy `npm run purchase:reconcile` và `npm run purchase:cleanup-evidence` (preview) sau reset. Không có converter production; database vận hành cần kế hoạch riêng, không chạy demo reset để nâng cấp.

## Đối chiếu18 GAP-REC

| GAP | Kết quả trong phạm vi mới |
|---|---|
|001 UI/demo|BE contract thật đã có; UI ngoài gói, cần nối FE riêng|
|002 Read DTO|Hoàn tất summary/trips/queue, snapshots/progress/capabilities|
|003 Headroom|Hoàn tất snapshot read và recheck nguyên tử khi command|
|004 Stable draft/destination|Hoàn tất required unique key, incremental updates, persisted destination|
|005 Cancel/destination|Hoàn tất cancel inspection/GR, đổi đích GR, cancel task remainder|
|006 Custody resolution/handback|Hoãn; nhận mua không ghi custody theo quyết định mới|
|007 Purchase put-away|Hoàn tất partial/split, allocation/projection, ledger/reservation/provenance guards|
|008 Correction/reversal|Hoàn tất trước post và full-GR reversal chưa downstream; partial reversal/unwind không thuộc gói|
|009 Evidence|Hoàn tất parent/actor/bytes/private storage/attach/download/cleanup; storage PNG/PDF thật đã kiểm|
|010 Audit/recovery/errors|Hoàn tất history phân trang xuyên nguồn, actor operation lookup, structured command errors|
|011 Permissions|Hoàn tất server/seed; FE route/action guards ngoài gói|
|012 PO lifecycle/schedule|Hoàn tất PO từ RR, allowance, amendment, confirmed schedule và short closure có Owner authority|
|013 Wrong/unknown goods|Hoãn theo lựa chọn chỉ ghi lượng đồng ý nhập|
|014 Draft/form|BE save hợp lệ/tối đa100/stable identity đã có; autosave/input chưa hợp lệ/leave guard thuộc FE|
|015 Version/duplicate trip|BE version/key/CAS/replay đã có; cảnh báo người dùng nhập trùng chuyến bằng key mới không thuộc gói này|
|016 Query/queue/scale|Queue và benchmark đã có, bỏ N+1 labels/trip queries và tối ưu PO reader; chưa load test production|
|017 Migration/compatibility|Thay bằng reset/seed new-only được user chọn, backup và đối soát đã chạy; không legacy converter|
|018 Coverage|BE HTTP/replica-set/concurrency/parser/live storage/reconciliation/benchmark đã kiểm; FE/browser ngoài gói|

Đã cập nhật contract, context BE, model README/changelog và doc changelog. Working tree có thay đổi sẵn trước task được giữ nguyên. Không commit, stage hoặc push tự động.
