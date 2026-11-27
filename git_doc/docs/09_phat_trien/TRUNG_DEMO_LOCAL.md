# Trungph — usable local demo data, 12 November 2026

## Nghiệm thu kế hoạch xuất bán và trả hàng — 25/11/2026

Ma trận này là tiêu chí và kết quả kiểm chứng tự động của implementation. Bài backend dùng fixture cô lập; không sửa chứng từ demo gốc hoặc ghi DB dùng chung.

| Mã | Thao tác và bằng chứng cần lưu | Kết quả đạt |
|---|---|---|
| DEMO-01 | Kinh doanh tạo `PXB` với `DEMO-XUAT-TRUNG-01`, 8 viên `AP6601`; Ban điều hành duyệt; Kho vận chọn lô `AP6601-260928-B`, soạn tại `STAGING-03`, rồi bàn giao. So sánh sổ tồn từng mốc. | Duyệt không giữ chỗ; tạo lệnh soạn giữ 8; soạn mới 4/8 chưa được ghi xuất. Ghi xuất sau đủ 8 làm giảm tổng tồn 8 đúng một lần. |
| DEMO-02 | Từ đúng dòng `PXB` đã ghi sổ, đề nghị và kiểm 1 thùng (4 viên), Kinh doanh chấp nhận 4, Kho vận nhập 4 vào `RECEIVING-01`; tra lại cùng dòng nguồn. | Kiểm và chấp nhận không ghi tồn; nhập tăng 4 một lần. Hạn mức mới là 4 nếu ban đầu cả 8 đủ điều kiện và không có khoản trả/giữ chỗ khác; không nhập vượt 4. |
| DEMO-03 | Tạo `ĐTNCC` từ `PN-202610-001`, lô **`AP6601-261001-A`**, không dùng lại lô khách trả. Thỏa thuận 4, bàn giao 4 qua một trong hai màn, Kế toán ghi nhận NCC nhận 4. | Thỏa thuận không giảm tồn vật lý; bàn giao tạo `PXNCC` và giảm 4 đúng một lần. Xác nhận chỉ đổi tiến độ nhận (4/4), không ghi xuất lại. |
| EDGE-01 | Với sản phẩm chỉ cho phép viên nguyên, thử quy cách 4 viên/thùng, nhập 1,5 rồi 0,1 thùng trên phiếu luyện tập riêng. | 1,5 thùng hiển thị 6 viên; 0,1 thùng bị chặn tại form và backend nếu gửi trực tiếp. |
| EDGE-02 | Tạo fixture riêng có hai `PXB` đã ghi sổ cùng mã `SO-001`; phiếu được chọn có 6 viên đủ điều kiện. Yêu cầu trả 3, kiểm/chấp nhận/nhập 3, rồi tra lại. | Cả hai phiếu đủ quyền hiện riêng; chọn theo phiếu/dòng, không theo tên hoặc SĐT. Hạn mức còn 3 trên dòng đã chọn; phiếu kia không đổi. Phiếu chưa ghi sổ hoặc khác kho ngoài phạm vi không xuất hiện. |
| EDGE-03 | Với thỏa thuận 4 và đã bàn giao 3, yêu cầu bàn giao thêm 2; sau đó thử đúng 1. | Hệ thống từ chối 2, không sinh phiếu hoặc biến động tồn; chỉ 1 được bàn giao tiếp. |

**Kết quả chạy ngày 25/11/2026:** backend direct-sales HTTP test đạt 1/1 và
return-workflows native integration đạt 22/22 trên `27018/hieudt-test`. FE
focused tests đạt 27/32; 5 lỗi còn lại thuộc jsdom/Ant Design event handling
ở test đổi kho và staged return. Chưa có browser visual run và chưa có remote
rollout.

Giữ các ca từ chối khách trả (không lập phiếu nhập), NCC xác nhận 3 rồi 1 trên **cùng** dòng bàn giao, và NCC từ chối trước bàn giao làm kiểm tra hồi quy. Không chạy nhánh giữ hộ nếu chưa có nguồn đủ điều kiện.

## Bản diễn tập ngày 12/11/2026

This is an isolated synthetic rehearsal environment for UC-73–92, UC-116, UC-122 and UC-123. It is not a shared-database rollout. The application is running at <http://127.0.0.1:3334> against `mongodb://127.0.0.1:27017/wmsd_demo_trung_20261112?replicaSet=rs0`.

The canonical backend checkout is now `building-material-management`, on branch `trungph`. Only local `main` and `trungph` remain. The former `-latest` and `-usability` checkouts were archived outside the workspace under `~/.codex/backups/whms-backend-branches-20261112`; all old side-branch commits are already in main and a verified Git bundle preserves their former refs. Demo files and the cleanly shut-down local database were moved into this checkout and restarted successfully. The initial local consolidation made no commit/push or shared database write. Subsequent user-requested GitHub cleanup now keeps main, HieuDT, minhbach03, minhtd and the consolidated user branch trungph; the user confirmed combining trung into trungph. Teammate branches are preserved.

## Shared receipt integration — checked 12 November, 23:30

Frontend main 069f2bd includes minhtd's source-based receipt screen. Backend main cb8d881 is now integrated into local trungph with local changes reapplied successfully; a pre-integration patch was saved outside the workspace. The local API was restarted without reseeding/resetting the database.

- Accepted CR detail → **Lập phiếu nhập** → **Phiếu nhập hàng khách trả**. Review remaining quantity, allowed quality, destination and evidence, then **Ghi tồn** and its confirmation. Calls the existing customer-returns/:id/receipt command; converts customer custody to store ownership once, with no demand reopening.
- Inspected FD detail → **Lập phiếu nhập** → **Phiếu nhập giao thất bại**. Also review actual packaging; opened/loose goods require measured volume. The existing failed-deliveries/:id/receipt command posts stock and original demand reopening together.
- Alternative entry: Phiếu nhập kho → Tạo phiếu → correct return type → choose an eligible source. Do not use OTHER for these returns. The source-linked entry locks its type/source; Ghi tồn is the posting point, not form opening.
- Prepared CR 000004 and FD 000002 each still expose 4 receivable pieces; the source picker and generic posted-receipt list/detail were verified against the live API. Browser checks opened both actual forms without consuming these backups. The CR historical fixture's saved product caption is Historical source; verify its lot and quantity.
- The 1004 records still validate and 54 balances reconcile to 48 stock transactions. Backend transaction/contract tests: 23/23; frontend receipt/workflow tests: 41/41. Read-only integration report: .local/trung-demo/receipt-integration-verification.json. This is not a full browser posting rehearsal.
- Updated human runbook: workspace DEMO_PLAN_TOMORROW.md. Its steps cover the new list/status/detail tabs and the complete shared receipt handoff. Plans/guides remain local and unpushed.

## Start tomorrow

Run in PowerShell from the backend checkout:

```powershell
./scripts/start-trung-demo.ps1
```

Or from the workspace root:

```powershell
./building-material-management/scripts/start-trung-demo.ps1
```

This starts the existing local replica set/API/frontend as needed, preserves your data and refuses an API on port 3333 that does not identify the expected local database. It does not seed, reset, delete, change `.env`, or write to Atlas. MongoDB is bound to `127.0.0.1`; no Windows service is installed. If another frontend already occupies 3334, check its `/api/health` proxy header rather than assuming it targets this API.

Use the login screen's role presets. Local accounts:

| Role | Username | Demo password |
|---|---|---|
| Warehouse Staff | warehouse@ceratile.vn | Kho@12345678 |
| Sales | sales@ceratile.vn | Sales@123 |
| Owner | owner@ceratile.vn | Owner@123 |
| Accountant | accountant@ceratile.vn | KeToan@123 |
| Independent Warehouse receiver | warehouse2@ceratile.vn | Kho2@12345678 |
| Admin | admin@ceratile.vn | Admin@123 |

These are synthetic local accounts, created separately from immutable baseline usernames. Business users have all three local warehouses assigned. Role grants come from the existing finite `ROLE_PERMISSIONS` catalogue, including separate `failed_delivery:*` permissions. Admin is not given business permissions.

## Use these inputs

- Warehouse: **K-GACH-01**.
- Product: **Gạch lát nền vân đá trắng 60×60**; lot **AP6601-261001-A**.
- Quantity: **4 pieces = 1 sealed carton**. Enter `4` in base-quantity fields, not `1`.
- Source inventory: **TRUNG-STOCK**. New stock was posted through a labelled synthetic opening document and stock ledger, not directly added to a balance.
- Customer custody: **TRUNG-CUSTODY**.
- Store-owned GOOD receipts: **TRUNG-RECEIVE**.
- DAMAGED/BLOCKED receipts: **TRUNG-QUARANTINE**.
- Historical customer source: **TRUNG-HISTORY-001**, initially 120 delivered pieces; the six prepared CRs claim 24, leaving 96 before further practice.
- New FD creation source: **PXB - K-GACH-01 - 261112 - 000004**, 40 posted undelivered pieces initially unclaimed. This supports ten 4-piece FD creations before exhausting the source. Existing staged FD records have their own source chains.
- Supplier-return source: purchase receipt **PN-202610-001**, its first line and matching supplier, with inventory at TRUNG-STOCK. All prepared supplier returns use that matching lot/source.
- Evidence file for new forms: `.local/trung-demo/SYNTHETIC-DEMO-tiles.png`. It is an intentionally synthetic tile diagram. Do not present it as a real inspection, delivery or commercial agreement.

Search **DEMO Trung** to distinguish new workflow cases from the older baseline examples. Record IDs use the current immutable document numbering contract. The final sequence digits below identify the prepared case; the full prefix includes warehouse and date.

## Start at the stage you want to demonstrate

| Screen / prefix | Suffix | Case / next action | Sign in as |
|---|---|---|---|
| Hàng lỗi — BCH | 000001 | Hold only → submit proposal | Warehouse |
| Hàng lỗi — BCH | 000002 | Submitted proposal → approve/reject | Owner |
| Hàng lỗi — BCH | 000003 | Approved scrap → execute | Warehouse |
| Hàng lỗi — BCH | 000004 | Completed scrap → inspect evidence and ledger | Warehouse |
| Hàng khách trả — ĐTK | 000001 | OPEN → inspect into TRUNG-CUSTODY | Warehouse |
| Hàng khách trả — ĐTK | 000002 | INSPECTED ordinary → accept/reject | Sales |
| Hàng khách trả — ĐTK | 000003 | INSPECTED supplier-caused → eligible exception decision | Owner |
| Hàng khách trả — ĐTK | 000004 | ACCEPTED → receive into TRUNG-RECEIVE | Warehouse |
| Hàng khách trả — ĐTK | 000005 | REJECTED installed goods → physical handback | Warehouse |
| Hàng khách trả — ĐTK | 000006 | COMPLETED → inspect custody/ownership receipt | Warehouse |
| Giao Thất Bại — GHTB | 000001 | OPEN → inspect actual return | Warehouse |
| Giao Thất Bại — GHTB | 000002 | INSPECTED → receive and reopen original demand | Warehouse |
| Giao Thất Bại — GHTB | 000003 | COMPLETED → inspect receipt and demand reopening | Warehouse |
| Trả nhà cung cấp — ĐTNCC | 000001 | AGREEMENT_PENDING → verify supplier agreement | Accountant |
| Trả nhà cung cấp — ĐTNCC | 000002 | READY → dispatch 4 pieces | Warehouse |
| Trả nhà cung cấp — ĐTNCC | 000003 | DISPATCHED → record supplier ACK against dispatch line | Accountant |
| Trả nhà cung cấp — ĐTNCC | 000004 | ACKNOWLEDGED → reconcile and close | Accountant |
| Trả nhà cung cấp — ĐTNCC | 000005 | COMPLETED → inspect closure/external reference | Accountant |

For example, the receipt-ready CR is **ĐTK - K-GACH-01 - 261112 - 000004**. Defect parent cases remain OPEN while their embedded proposal is SUBMITTED or APPROVED; inspect the proposal rather than expecting the parent status to say APPROVED.

For UC-116, open the lot trace from any prepared line. For UC-122, Accountant can inspect/create verified historical delivery sources on **Chứng Từ Ngoài**. For UC-123, **TRUNG-CREDIT-001** is a recorded credit-note reference against the completed supplier return; it posts no money or stock. Use a different unique reference/correlation and a source with remaining matching allowance for another reference.

Actions consume real local quantities and advance states. Repeated practice therefore changes the data. The startup script preserves that progress; it does not restore starting states. The machine-readable starting record list and direct URLs are in `.local/trung-demo/manifest.json` and can become stale after your own actions.

## How it was prepared

MongoDB Community 8.0.38 ZIP was obtained from the [official MongoDB archive](https://www.mongodb.com/try/download/community-edition/releases). The extracted binary is under `.local/tools`, replica-set files under `.local/trung-mongo/data`, and logs under `.local/trung-mongo/mongod.log`. The single member is `rs0`, `127.0.0.1:27017`.

The existing reviewed baseline seeded 58 collections / 742 records and passed schema, source-reference, ledger, reservation, capacity and other baseline checks. Initial load command:

```powershell
$env:MONGODB_URI='mongodb://127.0.0.1:27017/admin?replicaSet=rs0'
node src/seeds/rebuild/run.js --apply --target wmsd_demo_trung_20261112 --assets .local/trung-evidence --report .local/trung-baseline-report.json
node scripts/prepare-trung-demo.mjs
```

Do not rerun these as a reset. The baseline loader verifies an existing database rather than discarding it. The preparation script is hard-coded to the named local DB, uses stable creation keys/checkpoints, creates staged documents through native services, and does not accept a remote URI. It is a preparation recipe, not a general-purpose migration or fixture reset utility. Later user changes must be preserved.

Preparation stores one synthetic PNG through the existing authenticated evidence storage; only its metadata is attached to local documents. Existing baseline placeholder evidence remains dated seed data. Cloudinary configuration is read from the existing private environment and is never printed. No shared MongoDB data, indexes, roles, passwords or connection file were changed.

## Validation and code fix

- All four business demo logins and relevant lists returned 200 through the frontend proxy; failed-delivery access now works for Warehouse.
- Prepared defect detail and paginated lot movements returned 200. Native services executed completed defect, CR, FD and SR examples while leaving independent intermediate cases untouched.
- Every stored document was validated against its current model. Exact ledger reconciliation is checked by `node scripts/verify-trung-demo.mjs`.
- The return/customer contract and local transaction suite passed **23/23**, including the new multiple-custody-arrivals regression. Two pre-existing supplier-custody fixtures needed `await` for the now-async document envelope; they then passed.
- A live fixture exposed Mongoose recasting retained packaging subdocuments by shifted array index. Return-workflow stock consumption now keeps retained subdocument identities, validates the balance, and persists it with the same version guard while preserving portion timestamps. Quantity/evidence/scope/idempotency rules are unchanged. See [the native contract](../08_api/RETURN_WORKFLOWS_NATIVE.md).
- This does not certify every browser action or unrelated module. Fresh creations still require correct source, capacity, evidence and remaining quantity; no business guard is bypassed.

Tests:

```powershell
$env:RUN_RETURNS_NATIVE_TESTS='1'
node --test test/return-workflows.integration.test.js test/return-workflows.contract.test.js test/customer-returns.contract.test.js
npm run docs:check
```
