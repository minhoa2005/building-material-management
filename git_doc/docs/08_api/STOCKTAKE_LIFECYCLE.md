# Vòng đời kiểm kê BF-04 — hợp đồng API native (13/11/2026)

Nguồn yêu cầu: luồng "Inventory Audit Process — To-Be" do người dùng cung cấp (bản 13/11/2026: Owner lập kế hoạch → Warehouse Staff đóng băng, đếm, đối chiếu → tạo phương án khi lệch → Owner duyệt độc lập → Staff ghi thực hiện → Owner chốt; luồng hiện hành từ 22/11/2026 ở phần Redesign bên dưới) và các bảng review 28/29. Quyết định bổ sung ngày 13/11/2026: **hàng đếm thực tế nhưng chưa có trong sổ (found-not-in-book) thuộc phạm vi lần triển khai này**. Chốt kiểm kê UC-93 giữ nguyên logic ghi sổ; xem [HIEUDT_ITERATIONS_NATIVE.md](HIEUDT_ITERATIONS_NATIVE.md).

Mọi endpoint nằm dưới `/api/stocktakes`, dùng `Authorization: Bearer`, body strict (khóa lạ bị từ chối 400) và nhận `idempotencyKey` (+ `expectedVersion` khi sửa chứng từ có sẵn). Mã đợt là định danh chứng từ `KK-<kho>-YYMMDD-<số>` (dấu nối liền từ 12/11/2026; API vẫn nhận mã cũ có dấu cách); phương án là `PAXLKK-…` (xem [DOCUMENT_IDENTITIES.md](DOCUMENT_IDENTITIES.md)). Phản hồi lệnh: `{ id, version, workflowStatus, operationId, decisionId?, resultRefs, replayed }`; `resultRefs[]` chỉ gồm `documentType`, `documentId`, `itemId?`, `revision?` (đếm → `stocktakes` + `itemId` = mã lần đếm + `revision` = lần thứ; phương án → `stocktake_resolution_plans` + `revision` = phiên bản). **Đối chiếu không trả danh sách chênh lệch trong phản hồi**: bên đọc tính từ `GET /stocktakes/:id` (`snapshots`, `counts`, `header.selectedCounts`; chênh lệch = `countedQtyBase − bookQtyBase`).

> **Redesigned on 22 Nov 2026 — read the section below first.** The design of 13–18 Nov 2026 described in the older sections (blind count, resolution plans with review and execution records, `POST /:id/close` with a mandatory `reason`, `POST /:id/reopen-counting`) is **superseded history**; those sections are kept as dated evidence and are marked where they conflict. Current plan entity: [STOCKTAKE_PLANS.md](STOCKTAKE_PLANS.md).

## Redesign — 22 November 2026 (current contract)

Decision source: **User decision 22 Nov 2026 following lecturer feedback (separate plan/slip, remove blind count, simplified reconciliation, drop closing reason).** It supersedes the BF-04 blind-count rule and the 18 Nov 2026 blind-count decision ([HIEUDT_WAREHOUSE_SCOPE.md](HIEUDT_WAREHOUSE_SCOPE.md)); the old text stays as dated history.

### What changed

1. **Plan vs slip.** A recurring plan is its own entity (`stocktake_plans`, see [STOCKTAKE_PLANS.md](STOCKTAKE_PLANS.md)). The counted document is the *slip* (`stocktakes`, `KK-…`), either ad-hoc (`POST /`) or generated from a plan (`POST /api/stocktake-plans/:id/generate`, stamps `header.planId`, `header.planPeriodNo`, `header.planPeriodDueAt`). `PLANNED` remains the slip's pre-activation state. `GET /` accepts `planId` (document identity) to list the slips of a plan.
2. **No blind count.** Every authorized reader receives the frozen book quantity (`bookQtyBase`) as soon as the slip is `COUNTING`: `GET /:id` snapshots, the count sheet, the stock/movement/lot/report readers. `blind-count.js`, `redactMovement`, `blindCountScope`, `blindLockedLocationIds` and every `blindCount` response flag are gone. Frozen-snapshot immutability, bin locking, separation of duties, warehouse scope and "OWNER or assigned counter" access are unchanged. Option lists that offer stock for issue/transfer/relocation no longer drop balances of counting locations for non-Owners (Owners never had them dropped); writers still refuse a locked bin (`Vị trí đang khóa kiểm kê`). **Amended 22 Nov 2026 (same day, follow-up):** the lock is a lock concept, not a blind concept, so every option/lookup that offers stock now treats stock in a location with an active `StocktakeLocationLock` (`LOCKED`) as having zero selectable quantity for **every role** — see [Option lists and stocktake locks](HIEUDT_WAREHOUSE_SCOPE.md#option-lists-and-stocktake-locks-22-nov-2026).
3. **Simplified reconciliation.** The resolution-plan round trip (submit plan → review → execution evidence → close) is removed. After the counter reconciles (`RECONCILING`) the Owner has two actions: **recount** selected lines, or **approve differences** ("Clear Difference", UC-93).
4. **No closing reason.** Approve takes no mandatory `reason`; unknown keys are rejected by the strict body. An optional per-line discrepancy label (`reasonCode` ∈ `DAMAGED|LOST|MISPLACED|FOUND|RECORD_ERROR|OTHER`, `reasonNote`) is accepted and never required (`OTHER` needs a note).
5. **Units everywhere.** Snapshot, count, reconciliation line and lookup payloads carry `uomCode` and `uomName` of the product base unit (`Product.baseUnit` is a `Uom.code`; `uomName` is the Uom name, e.g. `PIECE` / `Viên`). Entered units stay in `quantityEntries[].enteredUnit`. Stocktake payloads carry no price or value, so no currency field exists.

### State machine

`PLANNED → COUNTING → RECONCILING → COMPLETED`, with `RECONCILING → COUNTING` (recount) and `PLANNED|COUNTING|RECONCILING → CANCELLED`. `RECONCILING` stays while some lines are unsettled. The retired states `PENDING_APPROVAL`, `APPROVED`, `IN_PROGRESS` only exist on slips created before 22 Nov 2026 (see Compatibility).

### Endpoints that changed or are new (base `/api/stocktakes`)

| Endpoint | Permission | Notes |
|---|---|---|
| `GET /` | `stocktake:read` | New optional query `planId`. No redaction of any field. |
| `GET /:id` | `stocktake:read` | Same document as before, **no field is redacted while `COUNTING`**, plus `lines[]` (reconciliation view), `uomCode/uomName` on `snapshots[]` and `counts[]`, `lookups.units`, `uomCode/uomName` on `lookups.products[]`. `header` additionally exposes `planId?`, `planPeriodNo?`, `planPeriodDueAt?`, `settledLines[]`, `recountLines[]`. |
| `GET /:id/lots` | `stocktake:read` + `product_lot:read`, warehouse access | **New 26 Nov 2026.** Verified lots that may be recorded as found stock in this session: limited to `header.scope.batchIds` / `header.scope.productIds` when set (all verified lots when neither is set), the same filter `POST /:id/counts` enforces. Query `manufacturerLot?`, `page`, `limit` (≤ 100); response has the same shape as `GET /api/lots`. Read-only. |
| `GET /:id/count-sheet` | `stocktake:export` | Each row now also has `uomCode`, `uomName` and `bookQtyBase` (`baseUnit` kept). Still read-only and no counts, locks or balances are read. |
| `POST /:id/count-reason` | `stocktake:update` (assigned counter) | **New 23 Nov 2026.** Counter's reason for a differing line; see below. |
| `POST /:id/recount` | `stocktake:create` (Owner) | **New.** Replaces `reopen-counting`. |
| `POST /:id/approve-differences` | `stock_adjustment:post` (Owner) | **New.** Replaces `close`, `resolution-plans`, `…/review`, `…/executions`. |
| `POST /:id/cancel` | `stocktake:create` | As before, plus: refused once any line has been settled (stock was already posted). |
| `POST /:id/counts`, `reconcile` | `stocktake:update` / `stocktake:reconcile` | Behaviour extended for recount, below. |

**Removed (404):** `POST /:id/close`, `POST /:id/reopen-counting`, `POST /:id/resolution-plans`, `POST /:id/resolution-plans/:planId/review`, `POST /:id/resolution-plans/:planId/executions`. **Kept read-only for history:** `GET /resolution-plans`, `GET /resolution-plans/:planId` (permission `stock_adjustment:read`), `GET /:id/evidence/:evidenceId` (also for plan evidence). Evidence upload `POST /:id/evidence` is accepted only while `COUNTING` (`stocktake:update`).

### `lines[]` — reconciliation view in `GET /:id`

One entry per snapshot line, built from the frozen snapshot, every count attempt and the header:

```json
{
  "snapshotId": "…", "origin": "BOOK", "locationId": "…", "batchId": "…", "productId": "…",
  "sku": "RD", "productName": "Tile RD", "manufacturerLot": "B1",
  "qualityStatus": "GOOD", "ownerType": "STORE", "ownerId": null,
  "uomCode": "PIECE", "uomName": "Viên",
  "bookQtyBase": "12", "countedQtyBase": "9", "differenceBase": "-3",
  "latestCountId": "…", "attemptCount": 2,
  "status": "DIFFERENCE",
  "attempts": [ { "countId": "…", "attemptNo": 1, "countedQtyBase": "10", "uomCode": "PIECE", "uomName": "Viên", "quantityEntries": [ … ], "countedBy": "…", "countedAt": "…", "recountReason": null },
                { "countId": "…", "attemptNo": 2, "countedQtyBase": "9", "recountReason": "Recount after Owner request", "…": "…" } ],
  "settlement": null,
  "countReason": { "reasonCode": "LOST", "reasonNote": null, "setBy": "…", "setAt": "…" },
  "recount": null
}
```

`countReason` (23 Nov 2026) is the counter's reason for the **newest** attempt of the line, or `null` when none was chosen for that attempt (a recount needs a new one).

`status`: `NOT_COUNTED` (no attempt yet), `MATCHED` (newest count equals book, not yet closed), `DIFFERENCE` (newest count differs), `RECOUNT_REQUESTED` (Owner sent it back; `recount = { afterAttemptNo, requestedBy, requestedAt, note }`), `SETTLED` (`settlement = { outcome: "POSTED"|"MATCHED", deltaQtyBase, uomCode, uomName, reasonCode?, reasonNote?, adjustmentId?, settledBy, settledAt }`). All quantities are exact decimal strings in the product base unit. `differenceBase = countedQtyBase − bookQtyBase`.

### `POST /:id/count-reason` (23 November 2026)

User decision 23 Nov 2026: the Warehouse Staff counter chooses why a counted line differs from the book; the Owner only approves it or sends the line back for recount.

Body (strict): `{ "idempotencyKey": "…", "expectedVersion": 7, "snapshotId": "…", "countId": "<newest count of the line>", "reasonCode": "DAMAGED|LOST|MISPLACED|FOUND|RECORD_ERROR|OTHER", "reasonNote": "≤ 500, required for OTHER" }`.

Rules: state `COUNTING`; caller assigned to the slip; the snapshot belongs to the current `scopeVersion` and is not settled; `countId` is still the newest attempt of that line; its counted quantity differs from the book. Effect: `header.countReasons[]` keeps one `{ snapshotId, countId, reasonCode, reasonNote?, setBy, setAt }` per line (a new choice replaces it). No stock change. `POST /:id/reconcile` now refuses with `Còn N dòng chênh lệch chưa chọn lý do` while any line whose newest count differs from the book has no reason for that attempt.

### `POST /:id/recount`

Body (strict): `{ "idempotencyKey": "…", "expectedVersion": 7, "snapshotIds": ["<snapshotId>", …], "note": "optional, ≤ 1000" }`.

Rules: state `RECONCILING` (and, for sessions created before 22 Nov 2026, `PENDING_APPROVAL`, `APPROVED`, `IN_PROGRESS` — open resolution plans are marked `CANCELLED` as history); every id must be a snapshot of the current `scopeVersion`; settled lines cannot be recounted. Effect: `header.recountLines[]` records `{ snapshotId, afterAttemptNo, requestedBy, requestedAt, note }`, `selectedCounts` and `lastReconciledAt/By` are cleared, the slip goes back to `COUNTING`. Bin locks, snapshots and **all earlier attempts are kept** (counts are append-only). While recounting, `POST /:id/counts` accepts new attempts only for the requested lines (and for newly found stock), still needing `previousCountId` + `recountReason`; lines already settled are refused. `POST /:id/reconcile` refuses until every requested line has an attempt newer than `afterAttemptNo`, then clears `recountLines` and returns to `RECONCILING`. No stock changes. Response is the usual receipt (`workflowStatus: "COUNTING"`).

### `POST /:id/approve-differences`

Body (strict):

```json
{
  "idempotencyKey": "6b0…",
  "expectedVersion": 9,
  "all": false,
  "lines": [ { "snapshotId": "…" } ],
  "packaging": [ { "lineId": "<snapshotId>", "portions": [ … ] } ]
}
```

`all: true` selects every unsettled line; otherwise `lines` is the checkbox selection. Since 23 Nov 2026 `lines[]` items carry only `snapshotId` (a `reasonCode`/`reasonNote` is refused by the strict schema): each posted line takes the counter's `countReason` for the approved attempt into `settledLines[].reasonCode/reasonNote` and the adjustment item `reason`; slips reconciled before that date may have none and post with the default reason. One of the two is required. `packaging` is optional and only used for a surplus (counted > book) to describe the received portions, exactly as the old close did; without it the batch carton data is used.

Preconditions (all re-checked inside the transaction): state `RECONCILING` and fully reconciled; `expectedVersion` current; every scoped location still `LOCKED`; the newest attempt of each selected line is the reconciled one; the frozen balance still equals the snapshot (quantity, owner, quality, version) and has no active defect hold; reservations stay below the new quantity. **Separation of duties:** the approver may not be the counter of any selected line (`Người đếm không được tự duyệt chênh lệch của chính mình`). Creator of the slip is *not* restricted (same as before; see risks).

Effect, in ONE transaction: for each selected line with a difference the balance moves from the book to the counted quantity through the same stock primitives the old close used (`receiveStock` for a surplus, `splitPortions` with carton opening for a shortage); one `StockTransaction` (operation `STOCKTAKE_CLOSE`) with one movement per posted line (ledger + `InventoryBalance` + packaging portions), and one `StockAdjustment` (`ĐCKK-…`, `POSTED`) with one `ADJUSTMENT` item per posted line (`quantityDeltaBase`, `beforeQty`, `afterQty`, `reason`, `snapshotIds`, `countIds`, no approval id) as the history record. Quality, owner, lot and location are those of the snapshot's balance. `DISCOVERED` (found-not-in-book, book 0) lines post their counted quantity as a surplus; `EMPTY_LOCATION` confirmations have no line and post nothing. Lines with a zero difference are closed as `MATCHED` without posting (and when no *unselected* line still differs, the remaining matching lines are closed together with the last approval, so the Owner never has to tick them). Each settled line is recorded once in `header.settledLines[]` (`snapshotId`, `countId`, `outcome`, `deltaQtyBase`, `baseUnitSnapshot`, `reasonCode?`, `reasonNote?`, `adjustmentId?`, `settledBy`, `settledAt`).

Result: if every snapshot line is settled the slip becomes `COMPLETED`, `header.completedAt/closedBy/closureReferenceId` are set and all locks are released in the same transaction; otherwise it stays `RECONCILING` with locks kept, so the remaining lines can be approved later or sent to recount. Response: receipt `{ id, version, workflowStatus, operationId, resultRefs: [{ documentType: "stock_adjustments", documentId }], replayed }` (no `resultRefs` when only matching lines were closed); `stockTransactionId` is recorded on the operation.

Empty-only scope (fixed 22 Nov 2026 after independent review): a slip whose scope has **no snapshot line** and only `EMPTY_LOCATION` counts confirmed as 0 completes with `{ all: true }` — there is nothing to select, so the "no line" refusal is skipped, every empty location is re-verified as confirmed, the slip becomes `COMPLETED`, the locks are released in the same transaction, nothing is posted and the receipt is the normal one (`resultRefs: []`; replay, stale-version 409 and a later call 400 behave as usual). `lines` alone is still refused for such a slip (no snapshot to name).

`packaging[]` entries must name a selected line: a `lineId` that is not among the lines being approved (unknown, already settled or not selected) is refused with `400 ERR-CORE-400-001` ("Quy cách nhập thuộc dòng không nằm trong các dòng được duyệt") instead of being ignored.

Idempotency: the same `idempotencyKey` and payload replays the receipt without posting again; a different key cannot re-approve a settled line (400 `Dòng đã được duyệt trước đó`); a stale `expectedVersion` → 409 `ERR-CORE-409-001`; a failed approval rolls back everything and keeps the locks.

### Errors

State/business refusals of this module use `400 ERR-CORE-400-001` with a Vietnamese `message` (existing convention for stocktake), e.g. `Đợt chưa đối chiếu hoặc đang đếm lại; chưa thể duyệt chênh lệch`, `Dòng đã được duyệt trước đó`, `Số dư không còn khớp mốc kiểm kê`, `Còn phần hàng bị chặn chưa xử lý; giữ khóa kiểm kê`, `Còn dòng được yêu cầu đếm lại chưa có kết quả mới`, `Còn N dòng chênh lệch chưa chọn lý do`, `Lý do "Khác" cần ghi rõ lý do`, `Lần đếm không còn là kết quả mới nhất của dòng`, `Dòng khớp sổ không cần lý do chênh lệch`, `Đợt đang đếm lại: chỉ nhận kết quả cho các dòng được yêu cầu đếm lại`. `403` for a missing permission or unassigned warehouse, `404` for an unknown slip, `409 ERR-CORE-409-001` for a stale version, `409 ERR-CORE-409-003` for a reused key with a different payload.

### Frontend contract notes (22 Nov 2026)

- Remove every blind-count UI assumption: show `bookQtyBase` (+ `uomName`) to counters as soon as the slip is `COUNTING`; stop reading `blindCount`, `blindCountedLocations` and null quantities. Render every stocktake quantity as number + `uomName` (fallback `uomCode`).
- Drive the Owner reconciliation screen from `GET /:id` `lines[]` (`status`, `differenceBase`, `attempts`, `settlement`, `recount`) instead of recomputing from `snapshots`/`counts`/`header.selectedCounts`. Checkbox selection → `POST /:id/approve-differences { lines: [{ snapshotId }] }`, "select all" → `{ all: true }`, "recount" → `POST /:id/recount { snapshotIds }`. There is no closing-reason input any more. Since 23 Nov 2026 the counter picks the reason per differing line on the count screen (`POST /:id/count-reason`, "Khác" opens a text box) and the Owner sees it read-only from `lines[].countReason`.
- After a partial approval the slip stays `RECONCILING` and `lines[].status` shows `SETTLED` for the approved ones; reload the slip (the receipt's `version` is the new `expectedVersion`). When it returns `COMPLETED` the locks are already released.
- "Found outside the book" form: `GET /api/lots` `items[]` now carries the product base unit as `uomCode` (`Product.baseUnit`) and `uomName` (`Uom.name`, `null` when the code is unknown) — the same two names and semantics as stocktake `lines[]`; `GET /api/lots/:id` carries them too. `GET /api/lots` has no `lookups` block, so there is nothing else to extend.
- Plan screens use `/api/stocktake-plans` ([STOCKTAKE_PLANS.md](STOCKTAKE_PLANS.md)); show the due notice from `isDue`/`dueSoon`/`dueState`/`daysUntilDue` and disable "generate" when `canGenerate` is false. The generated slip id is `resultRefs[0].documentId` of the generate receipt.
- Misplaced / wrong-quality lines (note 22 Nov 2026): `approve-differences` posts each counted line on its own — the shortage at the book location/quality as a decrease and the surplus at the other location/quality as an increase, as separate balances in one `StockTransaction` and one `StockAdjustment`; the source→target link of the old `RECLASS`/`RELOCATE` plan items is not kept, and the old refusal of opposite `DELTA`s on one lot and owner no longer applies.
- Remove calls to `close`, `reopen-counting`, `resolution-plans` (POST), `resolution-plans/:id/review` and `…/executions`; the resolution-plan GETs remain only for historical slips.

### Compatibility and removed code

- Removed: `closeStocktake`, `approvalContent`, `submitResolutionPlan`, `reviewResolutionPlan`, `recordExecution`, `reopenCounting`, `isBlind`, `src/shared/utils/blind-count.js`.
- Kept for history: the embedded `resolutionPlans` array and its schemas (`stocktake-resolution-plan*.schema.js`, `stocktake-resolution-details.schema.js`; `DISCREPANCY_REASONS` is reused), the plan read endpoints, `ApprovalHistory` rows of subject `stocktake_resolution_plans`, `StockAdjustment.header.resolutionPlanId` and item `planItemId`/`approvalId`. Existing `COMPLETED`/`CANCELLED` slips and their adjustments are read exactly as before (and `operational-reports` still reads `stocktakes`/`stock_adjustments`).
- Legacy in-flight slips in `PENDING_APPROVAL`/`APPROVED`/`IN_PROGRESS` cannot be closed through the removed endpoints; the Owner uses `POST /:id/recount` to bring them back to `COUNTING` and then the new flow. No automatic migration was run.
- Permissions: `stock_adjustment:create`, `stock_adjustment:update`, `stock_adjustment:approve` are no longer used by any endpoint and are labelled "[Ngừng dùng từ 22/11/2026]" in the seed catalogue and `permissions.json`; they were **not deleted** (roles in existing databases reference them). `stock_adjustment:read` still guards the historical plan reads; `stock_adjustment:post` now guards `approve-differences`; `stocktake:create` additionally guards plan writes and `recount`.

## Shortage approval fix (22 November 2026)

`approve-differences` for a counted shortage now updates the balance's existing packaging portions in place (`retainPortions`) instead of reassigning plain objects, which previously failed with an immutable `createdAt` validation error on balances that already had portions. Contract unchanged. Evidence: [STOCKTAKE_E2E_WALKTHROUGH](../09_phat_trien/STOCKTAKE_E2E_WALKTHROUGH.md).

## Verification and number allocation follow-up (16 November 2026)

Embedded resolution plans retain ObjectId identities while `documentNo` stores their `PAXLKK` number. The allocator now scans both embedded identity fields, instead of restarting the sequence when only ObjectId `_id` values are present. Existing numbers are not rewritten; no schema, index or migration is introduced. See [DOCUMENT_IDENTITIES](DOCUMENT_IDENTITIES.md) for the concurrency limits.

The lifecycle integration suite passed 5/5 and the native iterations suite passed 11/11 after this change on an isolated loopback replica set. The resolution integration suite is **not green**: its number-uniqueness TODO assertion now succeeds, but its text-filter assertion at `test/stocktake-resolution.integration.test.js:241` fails because literal substring search also matches a plan number containing the requested stocktake number. Search behavior and test files were not changed to hide this failure. Default `npm test` exits zero but skips opt-in integration tests; it is not evidence that this failure is resolved. Full frontend lint also fails. The sole independent reviewer accepted the allocator delta with notes and found no new production issue, but blocked overall BF-05 acceptance because required checks and mobile command verification remain incomplete. Completion and archive remain blocked.

Browser verification exercised both close paths with the real local API and synthetic local data. Execution attachment metadata was inserted into the disposable visual database because no stocktake evidence upload/attach endpoint existed at that time (added on 17 November 2026, see Evidence upload and view). This proves ID-reference validation, not file storage or upload. Mobile verification covered completed detail/list layout only, not every command form.

## Trạng thái và quyền (13–18/11/2026 — superseded 22/11/2026 for the plan/review/execution/close steps; see the redesign section above)

`PLANNED → COUNTING → RECONCILING → PENDING_APPROVAL → APPROVED → IN_PROGRESS → COMPLETED` (từ chối phương án quay về `RECONCILING`; không chênh lệch thì chốt thẳng từ `RECONCILING`). Quyền theo vai trò seed: Owner `stocktake:create`, `stock_adjustment:approve`, `stock_adjustment:post`; Warehouse Staff `stocktake:update`, `stocktake:reconcile`, `stock_adjustment:create`, `stock_adjustment:update`. Mọi lệnh còn kiểm tra kho được giao, trạng thái, version, và với đếm/đối chiếu/phương án/thực hiện: nhân viên phải nằm trong `header.assignedCounterIds`. Từ 17/11/2026 Owner có thể hủy đợt ở `PLANNED`, `COUNTING` hoặc `RECONCILING` → `CANCELLED` (xem lệnh Hủy đợt).

| Lệnh | Endpoint | Quyền | Hiệu lực |
|---|---|---|---|
| Danh sách (UC-93) | `GET /` | `stocktake:read` | Chỉ đọc. Owner thấy mọi kho, vai trò khác chỉ kho được giao. Query strict (khóa lạ, id/ngày sai hoặc `from` > `to` → 400): `warehouseId` (ngoài phạm vi → bị chặn), `status`, `locationId` (đợt có vị trí này trong `header.scopeLocationIds`), `from`/`to` (ISO, bao gồm hai đầu, lọc theo `header.cutoffAt` nên đợt `PLANNED` chưa có cutoff bị loại khi có khoảng cutoff), `q` (mã đợt, khớp nguyên văn, không phân biệt hoa thường), `page`, `limit` ≤ 100. Mặc định sắp xếp `createdAt` giảm dần; `total` khớp tập đã lọc. Không thêm index mới. |
| Tùy chọn lập kế hoạch | `GET /options` | `stocktake:create` | Kho, vị trí (kèm `areaCode`, `locationType`), nhân viên có quyền đếm trong kho, `lockedLocationIds` (vị trí đang bị đợt khác khóa), `products` đang hoạt động `{ id, sku, name }` cho bộ lọc sản phẩm tùy chọn (17/11/2026), và `stockedProductIdsByLocation` `{ [locationId]: productId[] }` liệt kê sản phẩm đã có dòng tồn tại từng vị trí (cùng các dòng mà kích hoạt sẽ chụp snapshot) để form chỉ gợi ý sản phẩm thuộc vị trí/kho đã chọn (18/11/2026). |
| Lập kế hoạch | `POST /` | `stocktake:create` | Tạo `PLANNED` (version 1), phạm vi ≥1 vị trí, không đổi tồn, không khóa. |
| Sửa kế hoạch | `POST /:id/update` | `stocktake:create` | Chỉ `PLANNED`, đúng version; đổi phạm vi tăng `scopeVersion`. |
| Kích hoạt | `POST /:id/activate` | `stocktake:update` (người được giao) | Một transaction: tăng `operationVersion` mọi vị trí, từ chối nếu còn giữ chỗ/nhiệm vụ/hold hoặc vị trí đã bị đợt khác khóa, chụp snapshot `BOOK` cho từng balance, khóa **mọi** vị trí kể cả trống → `COUNTING`. Thua tranh chấp thì rollback toàn bộ. |
| Ghi số đếm | `POST /:id/counts` | `stocktake:update` (người được giao) | Chỉ `COUNTING`; chỉ ghi thêm (append-only). Đếm lại cần `previousCountId` (lần mới nhất) và `recountReason`. Hàng phát hiện sau một xác nhận trống phải dùng route correction riêng bên dưới; discovery thường vẫn từ chối vị trí đã xác nhận trống. |
| Sửa xác nhận trống | `POST /:id/correct-empty-location` | `stocktake:update` (người được giao) | Chỉ `COUNTING`; body `{ idempotencyKey, expectedVersion, emptyCountId, discovered: { locationId, batchId, ownerType, ownerId?, qualityStatus }, countedQtyBase, correctionReason, evidenceIds, quantityEntries?, conditionNote? }`. Chỉ chấp nhận lần `EMPTY_LOCATION` mới nhất của cùng vị trí/scope và đúng 0; chỉ sửa một lần. Ghi append-only `STOCK` count và `DISCOVERED` snapshot (book 0), snapshot/số dư theo guard discovery hiện hữu; liên kết count mới tới count trống cũ bằng `correctsEmptyCountId`. Lịch sử cũ còn nguyên; không ghi tồn, không mở khóa, không đổi cutoff. Lý do/evidence bắt buộc. Sau correction có thể ghi thêm hàng phát hiện khác cùng vị trí theo route `/counts`. |
| Đối chiếu | `POST /:id/reconcile` | `stocktake:reconcile` (người được giao) | Cần mọi snapshot có lần đếm mới nhất và mọi vị trí không có snapshot có xác nhận trống = 0; lưu `header.selectedCounts` → `RECONCILING`. Không ghi tồn, không mở khóa. |
| Trình phương án | `POST /:id/resolution-plans` | `stock_adjustment:create` | Chỉ khi có lệch; gắn `scopeVersion` và đúng `selectedCounts`; submission từ chối tập hiện tại thiếu/trùng snapshot, count không thuộc mốc đã chọn, lượng lẻ với sản phẩm yêu cầu đơn vị gốc nguyên, hoặc dòng `RECLASS`/`RELOCATE` sai cùng lô/chủ hàng và quan hệ vị trí/chất lượng; dòng không vượt chênh lệch; từ 18/11/2026 phương án phải đưa **mọi** nhóm tồn về đúng số đếm đã chọn (cùng phép chiếu với bước chốt), thiếu thì bị từ chối `Phương án phải xử lý đủ toàn bộ chênh lệch của mọi nhóm tồn`; hai dòng `DELTA` ngược dấu cùng lô và chủ hàng cũng bị từ chối ngay khi nộp (trước đây chỉ khi chốt); → `PENDING_APPROVAL`. Không cần phương án nếu mọi dòng khớp (bị từ chối nếu nộp). Từ 18/11/2026 mỗi dòng bắt buộc `reasonCode` (`DAMAGED` vỡ/hỏng, `LOST` mất, `MISPLACED` để nhầm vị trí/chất lượng, `FOUND` thừa/tìm thấy, `RECORD_ERROR` sai sót ghi sổ, `OTHER` khác — bắt buộc `reasonNote` ≤ 500 ký tự) để thủ kho chia một chênh lệch theo lý do (ví dụ −30 = 27 `DAMAGED` + 3 `LOST`). `DELTA` giảm chỉ nhận `LOST`/`RECORD_ERROR`/`OTHER`, `DELTA` tăng chỉ nhận `FOUND`/`RECORD_ERROR`/`OTHER`; hàng vỡ không được ghi giảm mà phải là `RECLASS` sang chất lượng `DAMAGED`: ghép với dòng hàng lỗi cùng vị trí/lô/chủ đang thừa, hoặc — khi đợt không có dòng hàng lỗi đó — gửi `fromBalanceId` của nhóm thiếu và bỏ `toBalanceId`, dòng được lưu không có `toBalanceId`; khi chốt BE tìm hoặc tạo số dư `DAMAGED` tại cùng vị trí/lô/chủ hàng làm đích (nhóm này không có mốc nên không vào phép chiếu), nên phương án bị từ chối hoặc hủy không để lại số dư rác. Khi chốt, dòng `DAMAGED` được phép mở thùng. Quy ước đếm đi kèm: nhân viên chỉ đếm hàng còn tốt vào dòng hàng tốt. |
| Duyệt/từ chối | `POST /:id/resolution-plans/:planId/review` | `stock_adjustment:approve` | Chủ cửa hàng thấy lý do từng dòng (`details.reasonCode`, `details.reasonNote` trong `GET /resolution-plans/:planId`); lý do nằm trong nội dung được băm khi duyệt. Đúng `expectedPlanVersion`; người lập không tự duyệt; lưu `approval_history` với nội dung đã duyệt (hash đối chiếu khi chốt). Duyệt không ghi tồn. |
| Ghi thực hiện | `POST /:id/resolution-plans/:planId/executions` | `stock_adjustment:update` (người được giao) | Sau khi duyệt; không vượt lượng dòng; bằng chứng phải là `Attachment` `ATTACHED`, thuộc đợt/phương án và do chính người ghi tải lên. Không ghi tồn. |
| Hủy đợt | `POST /:id/cancel` | `stocktake:create` (Owner) | Body `{ idempotencyKey, expectedVersion, reason }`. Chỉ khi `PLANNED`, `COUNTING` hoặc `RECONCILING` (chưa có phương án được duyệt; quyết định người dùng 17/11/2026). Một transaction: mở mọi khóa `LOCKED` của đợt (`closureReferenceId` = mã thao tác), phương án chưa kết thúc → `CANCELLED`, ghi `cancelledBy/cancelledAt/cancelReason` có sẵn trên đợt → `CANCELLED`. Giữ snapshot/lần đếm làm lịch sử, không ghi tồn. Từ chối nếu đợt có phương án `PENDING_APPROVAL`/`APPROVED`/`EXECUTED` (chặn dữ liệu cũ); phương án bị hủy theo cũng ghi `cancelledBy/cancelledAt/cancelReason`. |
| Mở lại bước đếm | `POST /:id/reopen-counting` | `stocktake:create` (Owner) | Quyết định 18/11/2026. Body `{ idempotencyKey, expectedVersion, reason }`. Chỉ khi `RECONCILING`, `PENDING_APPROVAL`, `APPROVED` hoặc `IN_PROGRESS` (chưa chốt, chưa ghi tồn). Hủy mọi phương án chưa kết thúc (`cancelReason` = "Mở lại bước đếm: …"), xóa `selectedCounts`/`lastReconciledAt`/`lastReconciledBy`, giữ khóa vị trí, snapshot và các lần đếm; đợt về `COUNTING`. Nhân viên ghi lần đếm lại (kèm lý do) rồi đối chiếu lại. Trong lúc `COUNTING` (và với đợt hủy chưa từng đối chiếu), `GET /` và `GET /:id` trả `resolutionPlans` đã lược `items`, `selectedCounts`, `executionRecords` để dòng phương án cũ không làm lộ số sổ. Cùng lúc đó `GET /resolution-plans` không liệt kê phương án của đợt đang mù (đang `COUNTING`, hoặc `CANCELLED` chưa từng đối chiếu), `GET /resolution-plans/:planId` trả phương án không có dòng/lần đếm/thực hiện, `snapshots`, `counts` rỗng và `lookups` chỉ còn kho, người dùng, còn tùy chọn trả hàng (`return-workflows` options) bỏ `resolutionPlans` và không đưa đợt `COUNTING` cho người không phải Owner. Lý do (mở lại, duyệt, phương án) là văn bản tự do không bị che; hộp thoại dặn Owner không ghi số lượng. Giới hạn: số sổ đã từng hiển thị sau đối chiếu nên lần đếm lại không còn mù. |
| Tải bằng chứng | `POST /:id/evidence` | `stocktake:update` (khi `COUNTING`) hoặc `stock_adjustment:update` (khi `APPROVED`/`IN_PROGRESS`), người được giao | Lưu một tệp riêng tư và tạo `Attachment` `ATTACHED` thuộc đợt; không đổi đợt/version. Xem mục Evidence upload and view. |
| Xem bằng chứng | `GET /:id/evidence/:evidenceId` | `stocktake:read` | Link tải riêng tư 60 giây cho tệp thuộc đợt hoặc phương án. |
| Chốt | `POST /:id/close` | `stock_adjustment:post` | UC-93: chỉ chốt khi đã đối chiếu và `selectedCounts` khớp `header.selectedCounts`; không lệch → không cần phương án, không tạo phiếu điều chỉnh; có lệch → phương án được duyệt độc lập, đủ thực hiện. Ghi sổ một lần, mở khóa cùng transaction; lỗi thì giữ nguyên khóa. |

## UC-94 detail read metadata (15 November 2026)

`GET /api/stocktakes/:id` requires `stocktake:read` and warehouse access before any related-record lookup. The response retains the native document plus `snapshots`, `counts` (descending `attemptNo`) and `locks` for its current `scopeVersion`. It additionally returns `lookups` with allowlisted catalogue projections:

- `warehouses[]`: `{ id, code, name }` for the record warehouse.
- `locations[]`: `{ id, warehouseId, code, name }` for `header.scopeLocationIds`, constrained to that warehouse.
- `batches[]`: `{ id, productId, manufacturerLot }` referenced by those snapshots.
- `products[]`: `{ id, sku, name }` referenced by those batches.
- `conversions[]` (17/11/2026): `{ productId, productBatchId, unit: { code, name }, basePerUnit }`, the current factors (latest `validFrom` ≤ now per product/lot/unit) of those products, so counters can enter cartons and pieces. They are current factors, not snapshots; the count stores the entered unit and factor in `quantityEntries`, which the model checks (`enteredQty × baseUnitsPerUnit = quantityBase`, sum = `countedQtyBase`). Factors with more than 6 decimals are not offered because the count API accepts at most 6.

These are current catalogue labels, not historical product-name/unit snapshots. Missing catalogue references are omitted; callers retain the stable snapshot/reference identity and display unavailable labels. No `inventory:read` permission, inventory-options request or current balance lookup is needed. This read performs no stock/workflow writes and adds no schema, index or migration.

The frontend displays stored `header.cutoffAt` and `snapshot.baseUnitSnapshot`; it never substitutes current balances or current base units for frozen values. Since 17/11/2026 count entry uses the current conversion factors from `lookups.conversions` only to convert what is counted now; the entered unit and factor are stored on the count in `quantityEntries`, and book quantities, variance and posting stay in the frozen base unit. Exact decimal variance uses the explicitly selected attempt in `header.selectedCounts`; the latest attempt is a fallback only when that snapshot has no selection. Missing book quantities and invalid selections are not zero or a match. History displays recorded attempts, timestamps, recount reasons and condition notes; since 17/11/2026 attached evidence has a **Xem** button that requests a 60-second link from `GET /:id/evidence/:evidenceId` (no URL is stored in the history). Empty-location confirmations remain distinct from stock snapshot counts.

**Superseded 22 November 2026 — book quantities are no longer hidden (see the redesign section).** History of 17–21 November 2026: while the stocktake is `COUNTING`, `GET /stocktakes/:id` omits `bookQtyBase` from every snapshot for every role, the Owner included. Book quantities return after reconciliation. A session cancelled before it was ever reconciled (no `header.lastReconciledBy`) keeps omitting `bookQtyBase` after cancellation, for every role (user decision 18 November 2026); a session cancelled after reconciliation shows them. Outside this endpoint, current balances of locations locked by a `COUNTING` session are withheld from non-Owner readers; see [HIEUDT_WAREHOUSE_SCOPE.md](HIEUDT_WAREHOUSE_SCOPE.md). The frontend keeps its cache redaction as a second layer. History: before this date the server returned book quantities during `COUNTING` and only the frontend hid them.

Verification: `node --test test/stocktake-detail.test.js` covers stocktake-only readers, owner/warehouse authorization, missing references, empty snapshots and no current-balance query with mocked Mongoose models. It does not prove live MongoDB query execution or transactional isolation.

## Resolution request reads (UC-100, UC-101; 15 November 2026)

Resolution plans stay sub-documents of the stocktake (`resolutionPlans`, `ST_RESOLUTION`); there is no separate request collection and nothing is written. Both reads require `stock_adjustment:read` and use the same warehouse scope as the stocktake list: the Owner sees every warehouse, other roles only assigned warehouses. Both are registered before `GET /:id`.

**`GET /api/stocktakes/resolution-plans`** — one row per plan version. Strict query (unknown key, malformed id or unknown status -> 400), every filter optional and combined:

| Query | Rule |
|---|---|
| `warehouseId` | 24-hex id; a warehouse outside the actor's scope -> 403 (not an empty list) |
| `stocktakeId` | stocktake identity (document number or historical 24-hex id) |
| `lotId` | 24-hex `ProductBatch` id, matched on the plan line's `lotId` |
| `locationId` | 24-hex location id; the stocktake must have it in `header.scopeLocationIds` and a line must touch it through its selected count (`details.countId`) or a balance endpoint (`fromBalanceId`/`toBalanceId`) resolving to a snapshot at that location. Lot and location must hold on the same line |
| `status` | plan status: `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `EXECUTED`, `CLOSED`, `CANCELLED` |
| `q` | 1-80 chars, literal case-insensitive match on the plan number or the stocktake number |
| `page`, `limit` | default 1 and 20, `limit` <= 100 |

Sorted by `proposedAt` descending. Response `data`: `{ items, total, page, limit, lookups }` with `items[]`: `{ id, documentNo, planVersion, workflowStatus, reason?, proposedBy, proposedAt, scopeVersion, lineCount, stocktakeId, stocktakeNo, stocktakeStatus, warehouseId }` and `lookups`: `{ warehouses: [{ id, code, name }], users: [{ id, username, fullName }] }` for the rows returned. `reason` is omitted when absent. `proposedBy`/`proposedAt` fall back to `createdBy`/`occurredAt` for plans stored without them.

**`GET /api/stocktakes/resolution-plans/:planId`** — `:planId` is the 24-hex plan `_id` (the same id the review and execution commands take). Unknown plan -> 404, warehouse outside the scope -> 403, before any related read. Response `data`:

- `plan`: `{ id, documentNo, workflowStatus, version, planVersion, scopeVersion, previousPlanId, reason, note, createdBy, proposedBy, proposedAt, approvalId, closureBatchId, closedBy, closedAt, items[], selectedCounts[], reviewDecisions[], executionRecords[] }`.
- `plan.items[]`: `{ id, lineNo, productId, lotId, productNameSnapshot, baseUnitSnapshot, qtyBase, executedQtyBase, details: { actionKind, deltaQty, countId, fromBalanceId, toBalanceId, holdId }, snapshotId, fromSnapshotId, toSnapshotId, variance }`. `variance` is `{ locationId, qualityStatus, baseUnit, bookQtyBase, countedQtyBase, differenceBase }` computed with exact decimals (`differenceBase = countedQtyBase - bookQtyBase`) from the frozen snapshot and the selected count, or `null` when either record can no longer be resolved; it is never replaced by a zero.
- `plan.reviewDecisions[]`: `{ decisionId, revision, reviewedBy, reviewedAt, decision, reason }`. `plan.executionRecords[]`: `{ itemId, performedBy, performedAt, quantityBase, transactionId, note, evidence[] }` where `evidence[]` is `{ id, available: true, status, originalName, mediaType }` or `{ id, available: false }` for a reference that no longer resolves. No download URL is returned.
- `stocktake`: `{ id, documentNo, workflowStatus, version, header: { warehouseId, scopeVersion, scopeLocationIds, plannedAt, cutoffAt, activatedAt, completedAt } }`.
- `versions[]`: `{ id, documentNo, planVersion, workflowStatus }` for every plan of the stocktake, ascending by `planVersion`.
- `snapshots[]` and `counts[]`: only the records referenced by the plan lines, for the plan's own `scopeVersion` (`snapshots`: `{ id, locationId, batchId, sourceBalanceId, ownerType, ownerId, qualityStatus, bookQtyBase, baseUnitSnapshot, origin }`; `counts`: `{ id, snapshotId, locationId, targetType, attemptNo, countedQtyBase, baseUnitSnapshot, countedBy, countedAt }`).
- `lookups`: `{ warehouses, locations (with warehouseId), batches, products, users }` with the same projections as the detail read plus `users: [{ id, username, fullName }]`. References missing from the catalogue are omitted; callers keep the identity and show it as unavailable.

Neither read creates, decides, posts or unlocks anything; proposing, approving, executing and closing stay on the stocktake commands above. No schema, index, seed or migration was added: the list filters before unwinding the embedded plans, and an index request is raised only if it proves slow on real data. Verification: `node --test test/stocktake-resolution-list.test.js test/stocktake-resolution-detail.test.js` with mocked Mongoose models (scope, permission, filters, exact decimals, refusals, no write call); it does not prove live MongoDB aggregation or timing.

## Count sheet read (UC-121; 15 November 2026)

`GET /api/stocktakes/:id/count-sheet` returns the data for a printable count sheet built from the activation snapshot. It requires `stocktake:export` (seeded for Owner and Warehouse Staff) and checks, in order: permission, existence (404), warehouse access (403 `ERR-CORE-403-002`), counter assignment (403 `ERR-CORE-403-001`; the Owner is exempt) and activation (400 when `header.activatedAt` is missing, i.e. a `PLANNED` session that has no snapshot). An activated session is allowed in any later status.

Response `data`:

- `stocktake`: `{ id, documentNo, workflowStatus, scopeVersion, cutoffAt, activatedAt }`; `warehouse`: `{ id, code, name }`; `counters[]`: `{ id, username, fullName }`.
- `locations[]` (every location of `header.scopeLocationIds`, sorted by location code): `{ locationId, code, name, rows[], emptyConfirmation }`. `emptyConfirmation` is `true` exactly when the location had no snapshot entry at cutoff; its `rows` is empty and the sheet shows a line to confirm it is empty.
- `rows[]`: `{ snapshotId, productId, sku, productName, batchId, manufacturerLot, qualityStatus, ownerType, ownerId, owner: { code, name } | null, baseUnit, uomCode, uomName, bookQtyBase }`, sorted by SKU then lot (`uomCode`, `uomName` and `bookQtyBase` since 22 November 2026). `owner` is resolved for supplier- and customer-owned stock only. Missing catalogue labels are `null`.

**Read contract (22 November 2026).** Each row carries the frozen book quantity (`bookQtyBase`) with its unit; the response never contains a variance or any count, and the service does not read counts, locks or current balances. (15–21 November 2026 the sheet omitted the book quantity.) Only `origin: BOOK` snapshots of the current `scopeVersion` are listed, so stock moved after cutoff still shows what was frozen and items found during counting are not printed. The blank count and note cells, the confirmation line for empty locations and the blank rows for newly found items are layout decisions of the client, not response fields. The read changes no count, status, version, lock or stock, so printing twice yields the same data.

From 17 to 21 November 2026 `GET /stocktakes/:id` also omitted book quantities during `COUNTING`; both reads return them since 22 November 2026. Verification (15 November 2026): `node --test test/stocktake-count-sheet.test.js` (mocked models: each refusal, empty-location rows, absence of book quantity, no write or count/lock/balance read).

## Evidence upload and view (17 November 2026)

Source: user decision on 17/11/2026 — store stocktake evidence in the existing private Cloudinary storage used by returns and purchasing, with upload plus view. This closes the "no stocktake evidence upload endpoint" gap below for new records.

**`POST /api/stocktakes/:id/evidence`** — `multipart/form-data` with exactly one `file` (no other fields), JPEG/PNG/PDF up to 5 MB. Content is verified by `inspectFile` (real PNG/JPEG/PDF bytes, not the declared type). Checks, in order: `stocktake:read`, existence (404), warehouse access (403), workflow step, step permission, then counter assignment:

| Status | Required permission | Used by |
|---|---|---|
| `COUNTING` | `stocktake:update` | found-not-in-book counts (`evidenceIds`) |
| `APPROVED`, `IN_PROGRESS` | `stock_adjustment:update` | plan executions (`evidenceIds`) |

Any other status → 400. A user outside `header.assignedCounterIds` → 400 (same message as the commands). The file is stored first as `sep490/stocktake-evidence/<id>` (`type: authenticated`), then one `Attachment` is saved with `status: ATTACHED`, `ownerDocumentType: stocktakes`, `ownerDocumentId` = stocktake id, `ownerRevision` = current stocktake version, `purpose: STOCKTAKE_EVIDENCE`, `accessCategory: BUSINESS`, `uploadedBy` = actor and a SHA-256 checksum. If the storage confirmation or the record validation fails, the stored asset is destroyed; an unknown write outcome (for example a network error) keeps it so a saved record never points to a deleted file. The stocktake document and its `version` are **not** changed, so a form's `expectedVersion` stays valid; the following count/execution command still verifies ownership, status and uploader exactly as before. Response `data`: `{ id, originalName, mediaType, sizeBytes }`.

**`GET /api/stocktakes/:id/evidence/:evidenceId`** — `stocktake:read` and warehouse access; the attachment must be `ATTACHED` and owned by the stocktake or one of its resolution plans. Returns `{ url, expiresAt, originalName, mediaType }` where `url` is a private download link valid for 60 seconds. No storage key or checksum is returned.

Limits: uploads are not idempotent and an uploaded file that is never referenced by a command remains as an unused `ATTACHED` record (no cleanup job, unlike purchase `TEMPORARY` uploads). The step is checked before storage; a status change between the check and the save can leave such an unused record but cannot bypass the command checks. Frontend: `EvidenceUploadField` replaces the paste-an-id control in the found-not-in-book and execution forms; count history, plan execution lines and the adjustment detail show **Xem** buttons that open the short-lived link.

## Hàng phát hiện ngoài sổ (found-not-in-book)

`POST /:id/counts` với `targetType: "STOCK"`, **không** `snapshotId`, kèm:

```json
{ "discovered": { "locationId": "…", "batchId": "…", "ownerType": "STORE|SUPPLIER|CUSTOMER", "ownerId": "… (bắt buộc nếu không phải STORE)", "qualityStatus": "GOOD|…" },
  "countedQtyBase": "8", "evidenceIds": ["<attachmentId>"] }
```

Đúng một trong `snapshotId` hoặc `discovered` (hoặc `targetType: "EMPTY_LOCATION"` + `locationId`). Backend tạo snapshot `origin: "DISCOVERED"` với `bookQtyBase = 0`, `discoveredBy/At`, kèm `InventoryBalance` số lượng 0 tại vị trí (và `sourceBalanceId` của snapshot trỏ tới nó) để phương án/duyệt/chốt xử lý như mọi snapshot khác; không đổi logic ghi sổ UC-93. Từ chối khi: vị trí ngoài phạm vi hoặc đã xác nhận trống; bộ định danh (vị trí, lô, chất lượng, chủ hàng) đã có snapshot sổ (phải đếm theo mốc); đã có số dư dương cho bộ định danh; lô không `VERIFIED`/sản phẩm ngừng hoạt động/ngoài bộ lọc lô-sản phẩm của đợt; số lượng không dương; thiếu hoặc sai bằng chứng; sản phẩm nguyên đơn vị gốc mà số lượng không nguyên. Đếm lại cùng bộ định danh dùng lại snapshot đã phát hiện.

**Hàng phát hiện sau khi xác nhận trống và correction.** Route discovery thường (`POST /:id/counts`, `targetType: STOCK`, không `snapshotId`, có `discovered`) từ chối nếu vị trí có xác nhận trống mới nhất chưa được correction. Với xác nhận nhầm, dùng `POST /:id/correct-empty-location` theo bảng lệnh: `emptyCountId` phải là count `EMPTY_LOCATION` mới nhất của đúng vị trí/scope và bằng 0; correction chỉ một lần cho mỗi count; `correctionReason` không rỗng, evidence phải ATTACHED do actor tải lên. Lệnh append-only tạo `StocktakeCount` `STOCK` liên kết `correctsEmptyCountId` và snapshot `DISCOVERED` book 0, giữ cutoff/scope/lock; không sửa/xóa lần xác nhận cũ hoặc post số dư dương. `GET /:id` trả count cũ và mới, detail FE đánh dấu lần xác nhận đã sửa. Sau đó route discovery thường có thể ghi thêm các identity/lô khác ở vị trí này; mọi lô, phạm vi, số dư, evidence, owner và quantity guards hiện hành vẫn giữ.

Giới hạn đã biết của hợp đồng hiện hành: chốt từ chối hai `DELTA` ngược dấu trên cùng lô + chủ hàng (phải dùng `RECLASS`/`RELOCATE`). ~~Không tự mở thùng nên `DELTA` giảm phải là bội số nguyên thùng~~ — từ 18/11/2026 (quyết định người dùng sau E2E) chốt `DELTA` giảm dùng `splitPortions(..., { allowOpening: true })` như xuất hàng: phần mở/lẻ được trừ trước, nếu cần thì tách một thùng nguyên thành phần mở với giới hạn thể tích theo kích thước thùng; thiếu kích thước thùng thì vẫn bị từ chối (`Thiếu kích thước hoặc giới hạn thể tích đã biết để mở/tách thùng`); `DELTA` tăng của hàng lẻ cần `packaging` khi chốt.

## Giới hạn và điểm chưa quyết

- ~~Đếm mù chỉ được thực thi ở UI.~~ Đã giải quyết 17/11/2026 (rồi **bỏ hoàn toàn ngày 22/11/2026**, mọi người đọc nhận số sổ đóng băng khi `COUNTING`): API chi tiết không trả `bookQtyBase` khi `COUNTING` cho mọi vai trò. Từ 18/11/2026 các màn đọc tồn (`/inventory`, chi tiết vị trí, nhật ký biến động, báo cáo tồn, lô) cũng ẩn số dư của vị trí đang đếm với mọi vai trò trừ Owner; xem [HIEUDT_WAREHOUSE_SCOPE.md](HIEUDT_WAREHOUSE_SCOPE.md).
- ~~Chưa có API tải bằng chứng cho kiểm kê.~~ Đã giải quyết ngày 17/11/2026: xem [Evidence upload and view](#evidence-upload-and-view-17-november-2026). `evidenceIds` vẫn phải là `Attachment` đã `ATTACHED` với `ownerDocumentId` là mã đợt (hoặc phương án) và `uploadedBy` là người thao tác.
- Hủy đợt: đã có từ 17/11/2026 (Owner, trước khi phương án được duyệt). Mở lại đợt sau đối chiếu hoặc hủy sau khi phương án đã duyệt vẫn chưa có quy trình; không tự mở khóa.

## Kiểm chứng

`test/stocktake-lifecycle.integration.test.js` (bật `RUN_STOCKTAKE_LIFECYCLE_TESTS=1`, replica set cô lập `127.0.0.1:27018/hieudt-test`, DB `stocktake_lc_test_<ObjectId>` bị drop khi kết thúc) kiểm: lập kế hoạch Owner-only, kích hoạt đóng băng và khóa kể cả vị trí trống, đếm chỉ-ghi-thêm/đếm lại/trễ, bao phủ đủ khi đối chiếu, hàng phát hiện ngoài sổ (bằng chứng, trùng sổ, ngoài phạm vi), phương án (sai chiều/vượt), duyệt độc lập (người lập, version cũ, từ chối + trình lại), thực hiện (vượt, sai người tải), chốt có lệch ghi sổ đúng một lần + phát hiện thành tồn thật, chốt không lệch không phiếu điều chỉnh, kích hoạt đồng thời hai đợt chồng vị trí (một thắng), và DTO HTTP strict. Kết quả thực từng lần chạy ghi ở [change_logs](../../change_logs.md).
