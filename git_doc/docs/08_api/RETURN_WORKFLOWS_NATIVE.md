Backend sequence diagrams: the workflow router applies authentication, permissions and validation before calling the [return workflow controller](../../../src/modules/return-workflows/workflow.controller.js). The controller calls the existing read or write service and formats the HTTP response. Customer and supplier return commands, evidence handling, stock effects and response contracts are unchanged.

## Purchase request and goods issue links

Sales can choose the purchase request first or start with a posted goods issue. An order-linked return can combine issue lines from the same purchase request, handling warehouse and intake mode. Standalone and verified historical returns each use one source document. Each line retains the issue, issue line, actual lot and quantity claimed.

- `GET /return-workflows/lookup?kind=return-orders&warehouseId=…` searches purchase requests with posted sales issues visible in that warehouse. It uses the existing return-source permissions and pagination. Fulfilled requests remain searchable.
- `kind=sources&purpose=customer-returns` accepts an optional `salesOrderId` and returns that identity on linked lines. `documentId` can narrow the result to one issue. Available quantities use recorded customer receipts and outstanding claims. A warehouse completion can create a receipt for the open balance.
- The Customer Return form sends `withoutSalesOrder=true` on `kind=sources&purpose=customer-returns` until Sales chooses a purchase request. This filter shows eligible standalone sales issues and verified historical delivery sources. The lookup rejects combining it with `salesOrderId`. With a purchase request selected, the form uses `salesOrderId` to show that request's shipments. Clearing or changing the request clears the entered source lines.
- `POST /customer-returns` accepts optional `salesOrderId` as a document identifier. When supplied, every line must resolve to that request. Mismatches fail validation and the transaction rolls back. When omitted, the server derives the grouping from the source lines. The optional `salesOrderReference` remains a manual text field.
- Return detail includes `sourceOrders` and `sourceIssues` arrays of readable `{id, documentNo}` references derived from the saved source lines. The goods issue list supports `salesOrderId` and `warehouseId` together.

See the [transaction tests](../../../test/customer-return-order-links.integration.test.js) and [original design review](CUSTOMER_RETURN_PURCHASE_REQUEST_LINK_PLAN.md).

## Partial returns and unresolved cases

### Customer returns

For a request covering 10 tiles, Warehouse records how many arrived, Sales decides how many to accept, and Warehouse posts the accepted tiles into stock. Each return line carries its own quantities.

| What happened | Where the other 4 are | Next action |
|---|---|---|
| Only 6 arrived and Sales accepted 6 | With the customer. Approval releases the claim on 4. | If the 4 arrive later, open another eligible return against the original source. |
| All 10 arrived and Sales accepted 6 | At the warehouse, still customer-owned. | In direct intake, record Handback when the customer collects the 4. Record the recipient and evidence. No Goods Issue is needed because those tiles never entered store stock. |
| Sales accepted 10 and Warehouse posted a receipt for 6 | At the warehouse, approved and awaiting stock posting. | Post the remaining 4 on another receipt under the same return. The return stays `PARTIAL` until then. |

**Who confirmed delivery?** For a direct Goods Issue, completing a line with no delivered quantity entered records the open quantity as received. Completion can use the order's customer name and the completion time, with an empty evidence list. This records the warehouse operator's entry. It does not establish that the customer signed for the goods. [Goods Issue completion](../../../src/modules/goods-issues/direct-sales.service.js) · [Customer inspection, decision and receipt](../../../src/modules/return-workflows/native.service.js)

### Supplier returns

| What happened | Current result |
|---|---|
| Proposed 10, supplier agreed to 6 | Ship 6. The other 4 stay at the warehouse. Closure after acceptance of the 6 releases the unused reservation. |
| Agreed 10, shipped 6 | Accounting records the supplier's acceptance of 6. The request stays `PARTIAL` while 4 agreed tiles await dispatch. Warehouse ships the remaining 4 under the same request, Accounting records the second acknowledgement and closes. An older `ACKNOWLEDGED` request with a positive agreed remainder can also resume dispatch. |
| Shipped 10, supplier confirmed 6, response pending on 4 | Accounting can record the later response against the dispatched line. Closure waits for acceptance of the full dispatched quantity. |
| Shipped 10, supplier rejected 4 and physically sent them back | Accounting can record the rejection. Closure remains blocked. The supplier-return workflow has no receipt for the goods coming back or settlement action to close that dispute. Correcting a mistaken acknowledgement does not receive stock. |
| Supplier-owned goods held in custody, 6 of 10 already handed over | Accounting can revise the agreement down to 6. The server rejects any quantity below the 6 already dispatched. Posted store issues and supplier custody releases both count. |

[Agreement, dispatch, acknowledgement and closure](../../../src/modules/return-workflows/native.service.js) · [Available workflow actions](../../../src/modules/return-workflows/workflow.routes.js)

### Other review findings

| Area | Current behavior and operational consequence |
|---|---|
| Multi-line approvals | A line-by-line decision must include every customer return or selected defect plan line exactly once. Enter zero for each refused line. An incomplete list fails before approval is saved. Existing whole-document decisions that omit the lines array retain their behavior. [Decision handlers](../../../src/modules/return-workflows/native.service.js) |
| Defects returned to suppliers | Supplier dispatch updates the defect report in the same transaction as the stock movement. A remaining active hold keeps the report partial. Resolving the last hold closes the report. This applies to new dispatches. [Defect execution and supplier dispatch](../../../src/modules/return-workflows/native.service.js) |
| Lot trace | Both lot trace views follow a visible direct Goods Issue to its customer purchase request via `salesOrderId`. Legacy deliveries follow the warehouse issue request chain. The Accountant's purchasing-only view keeps its existing scope. [Lot document traversal](../../../src/modules/return-workflows/native.trace.js) |
| Historical delivery evidence | Verification requires an uploaded file and a verified product and lot. The unique document key includes source system, reference kind and reference number. Recording the same paper slip under a different number falls outside that duplicate check. Accounting must reconcile the identifiers against the evidence. [Historical verification](../../../src/modules/return-workflows/native.read.js) · [Reference index](../../../src/models/external-reference.model.js) |

## Customer details on documents — 18 November 2026

User decision: customers are not managed as catalogue records. New sales orders require `customerName` (1–160 characters) and allow `customerPhone` (up to 30 characters); the delivery address remains on the order. Creating an order does not query or create a Customer. Sales options return an empty compatibility `customers` array.

Customer-return creation uses a posted SALE Goods Issue line or a verified historical delivery; it does not require a Sales Order or a customer catalogue. Sales may select a warehouse-created standalone SALE issue when it has an external reference and belongs to the selected warehouse; this path does not require a customer-receipt confirmation. The server uses customer details already present on the source, or requires `customerName` (1–160 characters) when the Goods Issue has no customer name. Multiple lines and split parts are supported under the source rules above. Warehouse and eligible-source scope, source quantity, existing claims, evidence, versions and idempotency remain enforced.

Historical verification requires customer name text and optional phone from the external document; verification/evidence remains mandatory. New historical sources with customer snapshots use the current inspection/acceptance/receipt flow without custody. Previously stored sources and custody ledgers retain their legacy behavior. Optional legacy customerId fields and the Customer collection remain readable; no records or collections are deleted or backfilled. Deploy FE and BE together; old clients sending customerId to new creation endpoints must update.

Validation: focused sales/return contract tests and the local direct-sales transaction test passed using an isolated database on the local rs0 replica set (port 27017). The transaction fixture creates a new sale and return with no Customer record, and separately verifies legacy custody compatibility. No Atlas write or migration was performed.

Current contract: [customer document snapshots](CUSTOMER_DOCUMENT_SNAPSHOTS.md).

# Current customer returns — 18 November 2026

Latest user decision: Customer Return starts from a posted SALE Goods Issue, whether or not it has a Sales Order. No Sales Order setup is needed for the return flow. New CR uses `header.intakeMode=DIRECT`: Sales requests → Warehouse inspects actual quantity, packaging, use, damage and evidence → Sales accepts/rejects → Warehouse receives only accepted quantity as STORE stock. Inspection changes no stock and requires no custody location. Rejected handback appends `handbacks[]` with item, quantity, recipient, operator/time and evidence; it changes no stock. Reassessment is blocked after a posted receipt or handback.

For an SO-linked issue, the return limit remains confirmed customer-received quantity less CR claims. For a standalone posted SALE issue, the limit is posted issue quantity less posted undelivered returns, CR claims. The source issue and entered customer name (when needed) are saved on the return. Verified historical sources remain supported. Warehouse records physical facts; Sales checks eligibility and accepts/rejects. This flow does not issue a refund. See [current Goods Issue contract](GOODS_ISSUES.md).

Legacy documents without `intakeMode=DIRECT` retain the dated custody behavior below so existing posted balances/history remain valid. Supplier custody is unaffected.

15 November 2026 — quantity handling across customer returns, supplier returns and defects (explicit user request to implement the four reviewed Minh patterns). Detail items now include read-only `progress`: requested, inspected/accepted/received/handedBack/custodyRemaining/handbackAvailable for CR; agreed/dispatched/acknowledged for SR; processed/remaining/proposable for defects. Pending inspection/agreement/approval is absent rather than a fabricated zero. Counts use the latest inspection and decision, posted receipts/releases/issues only, and current non-superseded accepted ACKs. Defect plans expose `remainingQtyBase` per plan line after execution. FE selects submitted plans for decision and approved plans with remaining quantities for execution, sends their exact planId, and can resume older outstanding plans. Stocktake-bound holds expose zero ordinary proposable quantity and remain in stocktake resolution. These are DTO fields, not persisted schema additions.

CR creation accepts up to 100 lines under the source rules above. Each part has its own item ID, claim, reason, inspection and decision. Warehouse then inspects each part separately; it cannot change the lot or source of a posted request. Aggregate source caps and concurrent locks still apply inside the existing transaction. Defect proposals similarly allow multiple outcomes for one defect source, with the aggregate including all earlier submitted/approved plans and earlier rows of the same new proposal. Supplier proposal and receipt source uniqueness rules stay in force. Partial physical movements use separate posted documents with current remaining caps.

Customer rejected parts can be handed back in REJECTED, ACCEPTED, PARTIAL or COMPLETED states, but only up to current inspected quantity minus approved quantity minus prior handbacks. Approved quantities cannot be handed back through this action. This supports an accepted part entering store stock while the refused part remains customer-owned until handover. Permission, evidence, recipient, version and idempotency checks continue to apply.

FE quantities for physical actions and customer-return receipt entry start blank. Source/request and defect-plan rows can be split into independent blank parts, and combined quantities are validated before submission and by the backend. Carton/piece input uses the historical packaging snapshot first; carton totals continue to be written as base-unit decimal strings. Area equivalence is shown only when the source already carries an area-unit conversion snapshot; it is read-only, never rounded up to increase a return. No new collection, migration or live database rollout.

14 November 2026 — non-GOOD purchase intake must enter supplier custody. An unused GOOD item can also be explicitly marked CUSTODY at intake; it remains supplier-owned, outside STORE stock. Posted supplier custody DTO adds header.supplierId, capabilities.createSupplierReturn (permission, assigned warehouse, posted supplier ownership), and per-item custodyBalanceId / returnAvailableQty. Advisory quantity is capped by original quantity less supplier-return commitments and free physical stock at the original receiving balance; commands enforce current limits atomically. Warehouse selects “Tạo đề nghị trả NCC” on a custody line and enters quantity/reason. The proposal uses that exact custody item/balance, creates no DefectReport, and starts at AGREEMENT_PENDING. Accountant agreement → Warehouse dispatch creates CustodyRelease → Accountant ACK/close. Supplier-owned goods do not create SupplierReturnIssue. After relocation or STORE acceptance, use the regular supplier-return form with the current balance. No schema change or migration.

# Trungph return workflows on native models

12 November 2026: stock consumption preserves retained packaging subdocument identities and creation timestamps when earlier custody arrivals are removed. Balance validation, version guards, ledger and transaction boundaries remain enforced. The multiple-arrival custody regression reproduces the former immutable-timestamp failure and verifies the later portion remains unchanged after receipt.

Updated 7 November 2026. Scope: Trungph's three iterations, carried forward by function name through the [UC crosswalk](../07_ra_soat/UC_RENUMBER_2026-10-30.md). This implementation uses the single 59-collection registry and does not restore BusinessDocument, DocumentLine, UOM, separate holds/plans/ACKs or standalone movements.

## Scope and routes

All routes below are under `/api`, require active authentication, and recheck the current operation permission. Owner can access all warehouse scopes; other users require an assigned warehouse. Custom roles use the same permission checks. Requester/reviewer identity checks apply independently of role changes.

| Function / current UC | HTTP routes |
|---|---|
| Defect search/detail, UC-73/74 | GET `/defects`, `/defects/:id` |
| Detection/hold and proposal, UC-75/76 | POST `/defects`; POST `/defects/:id/proposals` |
| Decision/execution, UC-77/78 | POST `/defects/:id/decision`, `/execute` |
| Customer return list/detail/request, UC-79/80/81 | GET `/customer-returns`, `/:id`; POST `/customer-returns` |
| Ordinary / eligible exception decision, UC-82/83 | POST `/customer-returns/:id/decision`, `/exception-decision` |
| CR inspection / decision, UC-84 | POST `/customer-returns/:id/inspect`, `/reassess` |
| CR receipt, UC-86 | POST `/customer-returns/:id/receipt` |
| Customer handback (DIRECT: event only; legacy: custody release) | POST `/customer-returns/:id/handback` |
| Supplier return search/detail/proposal, UC-88/89/90 | GET/POST `/supplier-returns`; GET `/supplier-returns/:id` |
| Actual supplier dispatch / closure, UC-91/92 | POST `/supplier-returns/:id/dispatch`, `/close` |
| Supplier agreement and later acknowledgement (original UC-107 scope) | POST `/supplier-returns/:id/agreement`, `/acknowledgement` |
| Lot trace, UC-116 | GET `/lots/:id/trace`, `/lots/:id/trace/evidence/:evidenceId` |
| Verified historical delivery, UC-122 | POST `/external-references/historical` |
| External result references, UC-123 | GET/POST `/external-references` |
| Shared source options and evidence | GET `/return-workflows/options`; POST `/return-workflows/:id/evidence`; GET `/return-workflows/:id/evidence/:evidenceId` |

The older 19-UC assignment is covered by these functions; split UCs are shown separately. Retired supplier Owner approval is not restored.

Customer Return receipts post only the quantity actually received. A partial posting leaves the return `PARTIAL`; detail exposes the posted and remaining quantities in `items[].progress` and the positive remainder in `receivableLines`. After an uncertain response, resubmit the same payload, version and idempotency key: replay returns the original receipt reference without another stock movement. Posting the final eligible remainder completes the return. Posted Customer Return receipts have no reversal or generic reopen command.

Return evidence download checks the authorized parent first and matches attached business evidence against that parent's stored `_id`, as the evidence list and upload do. The document identifier can be a current string ID or a historical ObjectId, not an arbitrary display-label alias. Evidence belonging to a different parent returns `404` without generating a download URL.

## In-app notification handoff

Supplier-return events notify the next actor after creation, agreement and dispatch. Recording the supplier's acknowledgement (`ACK_SR`) now notifies the original request creator that the supplier responded; closing a completed return (`CLOSE_SR`) sends that creator a final closure notice. Notifications use the existing durable business-event worker and per-recipient deduplication. The recipient must still have `notification:read`, permission to read the source record and access to its warehouse; the notification links to the supplier-return detail.

## Posted Goods Issue source lots — 25 November 2026

`POST /customer-returns` optionally accepts `salesOrderReference` (trimmed plain text, at most 100 characters). Nonblank values are stored as `header.salesOrderReference` and returned in the request detail. This is neither a Sales Order ID nor a lookup, and omitting it does not change eligibility, stock posting, permissions or the requirement for a verified source line. The customer return and receiving screens can be used without enabling the Sales Order screens. For a no-order demo, use an eligible posted standalone SALE issue or an existing verified historical delivery.

For a direct or legacy standalone SALE Goods Issue, `lookup?kind=sources&purpose=customer-returns` returns `sourceLots` from the active, non-reversed stock movements for that issue line. Each lot includes its ID, manufacturer lot, issued base quantity and remaining quantity after existing Customer Return claims. This lets Sales split one return request across the lots the customer actually received. A single-lot source can default to that lot; a multi-lot source requires an explicit lot on each return line. The create payload accepts optional `lotId` for Goods Issue sources, and the server validates both the full source claim and the selected lot claim transactionally. The saved request line retains the selected lot, which the warehouse receipt uses for stock posting and traceability. No new collection or migration is required.

This does not add a receipt-confirmation field to Goods Issue. SO-linked returns remain capped by the quantity Sales confirmed as received. Standalone SALE issues created with an external reference remain capped by their posted issue quantity and existing customer-return claims. New standalone manual SALE creation is supported through the Goods Issue form; Supplier receipt/acceptance remains a separate `ACK_SR` event on the Supplier Return, not a Goods Issue field.

## Standalone sale snapshot and source search — 25 November 2026

Standalone SALE headers may retain optional plain-text `customerName` and
`customerPhone`. `lookup?kind=sources&purpose=customer-returns` projects the
external reference and these snapshots for posted SALE lines, and searches by
both PXB number and external reference. Customer Return creation copies the
selected source snapshot and keeps the existing per-lot and source claim caps.
The source remains selectable by its document/line identity; customer name or
phone alone never selects a source.

## Reassessment claim and packaging correction — 20 November 2026

CR approval keeps already RECEIVED quantity charged to its source. When reacquiring a released allowance, the command checks both the source-line total and the original lot's remaining allowance for stock-backed direct returns. A reduction appends RELEASED for the unresolved reduction only; an increase appends REACQUIRED after taking the same source-item lock used by creation and checking the current cumulative source allowance. This applies to issue and verified historical sources and to split lines. Reductions are applied before increases, which are checked and saved sequentially. Approval cannot fall below quantity already received.

For each return_quantity_claims record, remaining = claimedQtyBase - RECEIVED - RELEASED + REACQUIRED; cumulative source charge = claimedQtyBase - RELEASED + REACQUIRED. Every event prefix must keep remaining nonnegative and reacquisition within the released allowance. Events remain append-only; the original claimed quantity and event history are not rewritten. Existing claims without REACQUIRED retain their meaning.

DIRECT inspections save the observed packaging state and optional OPEN/LOOSE measurement on each inspection portion without posting stock. Explicit portions must sum to the inspected quantity and match the declared condition when known. Without explicit portions, SEALED maps to SEALED, LOOSE to LOOSE, and OPENED/TORN/UNKNOWN to OPEN. Reassessment retains compatible recorded portions when no replacement is supplied.

SEALED inspection, approval and receipt require complete cartons. The server prefers the saved item or inspection snapshot and checks it against the verified lot of that product. For a historical return without a snapshot, the server uses the verified lot's fixed carton size and dimensions and saves the snapshot on the new inspection and receipt. Missing or incompatible carton specifications are rejected; client packaging does not replace them.

Partial receipts consume the remaining inspected portions in order, skipping quantities already posted. A whole measured portion keeps the original measurement. A fragment without its own measurement uses the original measurement as `volumeUpperBoundMm3`, not as an actual measurement; several fragments can therefore reserve more space than the original portion. Receipt-supplied portions must match inspected quantities and states, and cannot override a whole portion's measurement. Unmeasured OPEN/LOOSE portions keep the existing estimation path. Old inspection records remain readable and cannot recover a measurement that was never saved. No new collection, index, migration or backfill is required.

## Nhập kho từ chứng từ nguồn

Kho dùng **Lập phiếu nhập** trên hồ sơ khách trả hoặc giao thất bại, hoặc tìm nguồn từ **Phiếu nhập kho**. API danh sách nhận `status` phân tách bằng dấu phẩy và `receivable=true`. Khách trả lọc `ACCEPTED,PARTIAL` và có tham chiếu quyết định. Giao thất bại lọc `INSPECTED,PARTIAL`. Chi tiết trả `receivableLines` theo dòng gốc, gồm lượng còn được nhập và phẩm cấp hợp lệ. Giao thất bại có thêm tình trạng bao bì đã kiểm.

Form gọi lệnh `/receipt` của nguồn với `expectedVersion`, `idempotencyKey`, minh chứng đã đính kèm và các dòng có lượng thực nhận. ĐVT là đơn vị gốc. Form nhận hàng giao thất bại ánh xạ `SEALED` thành `SEALED`, `LOOSE` thành `LOOSE`, các tình trạng còn lại thành `OPEN`. Khi nhận lại hàng giao thất bại hoặc kiểm hàng khách trả vào khu giữ hộ, mỗi phần `OPEN` hoặc `LOOSE` có thể kèm `measuredVolumeMm3`. Nếu không có giá trị, BE dùng [công thức ước tính](NATIVE_MODEL_RUNTIME.md#mua-và-nhập). Kiểm nhận và đánh giá lại chấp nhận tình trạng bao bì `LOOSE` (hàng lẻ). Lệnh thành công trả ID phiếu nhập trong `resultRefs` và cập nhật tồn trong cùng giao dịch. Kiểm hàng, ra quyết định và bàn giao lại khách thực hiện ở hồ sơ nguồn.

## Payload and response rules

Quantities are exact decimal strings, never JS floating-point numbers. IDs identify a native parent document and stable embedded item. `items[].sources[]` identifies the source collection/document/item and linked quantity. Client DTO adapters may call display rows `lines`; storage remains `items[]`.

All business creations use a stable `idempotencyKey`; commands also require `expectedVersion` on the parent. Reuse the original payload/key after a lost response. Changing payload requires a new key. Operation records bind actor, operation, target and payload hash. Replays recheck permission and scope. Command results are `{id, version, workflowStatus, operationId, resultRefs, replayed}` in the usual `data` envelope. Lists use `data.items` with `data.total/page/limit`; detail responses include `relatedDocuments`, scoped attachment metadata and audit history.

- Stocktake locks in option lists (22 Nov 2026): `GET /return-workflows/options` flags balances and locations of a location locked by an active stocktake with `lockedByStocktake: true`, and `lookup?kind=balances` adds `lockedByStocktake` and returns `availableQty: "0"` for them; rows are kept so a stocktake-sourced defect can still reference the counted balance. See [HIEUDT_WAREHOUSE_SCOPE.md](HIEUDT_WAREHOUSE_SCOPE.md#option-lists-and-stocktake-locks-22-nov-2026).
- Defect creation: `warehouseId, balanceId, quantity, sourceKind, reason`, optional matching source item and optional initial disposition. `sourceKind=STOCKTAKE` requires the actual locked session and forbids ordinary disposition. [Superseded 22 Nov 2026: blind count removed — a non-Owner may now create a stocktake-sourced defect while the session is `COUNTING`, `kind=balances` returns real quantities without `blindCount`, and `kind=stocktakes` also offers `COUNTING` sessions to non-Owners; `redactMovement` was removed from the lot trace.] Historical rule (18 Nov 2026): while that session is `COUNTING`, a non-Owner is refused before any quantity check ("Đợt kiểm kê đang đếm…"; user decision 18 Nov 2026), because repeated over-quantity refusals would reveal the blind book; the condition goes into the count note and the defect is recorded once the session is reconciled. During `COUNTING` the balance lookup (`kind=balances`) returns such balances with null quantities and `blindCount: true`, and the session lookup (`kind=stocktakes`) does not offer a `COUNTING` session to a non-Owner. Source-free inspection is MANUAL. Detection may be followed later by `/proposals` with `lines[{lineId,qtyBase,outcome,targetQuality?}]`, evidence and note.
- Decisions: `expectedVersion, idempotencyKey, decision, reason`, optional per-item `lines[{lineId,qtyBase}]`. The form checks eligibility per line. On a mixed request, Owner can approve eligible lines and record zero for excluded lines. Defect approval binds the plan and approved quantity; CR approval binds the actual current inspection snapshot. Installed/customer-damaged/verified-overdue or unknown facts cannot be approved as an eligible return.
- CR creation: `warehouseId, salesOrderId?, customerName?, idempotencyKey, lines[{salesIssueLineId OR historicalExternalLineId,lotId?,qtyBase,reason}]`. `customerName` is required only when the posted Goods Issue has no name snapshot. `lotId` is available for Goods Issue sources and must identify a lot recorded on its active issue movements; the server also enforces the per-lot claim. Never use both source types. Creation claims quantity but does not receive inventory.
- CR inspection: version/key/note/evidence, `custodyLocationId` only for legacy custody-backed requests, and `lines[{returnLineId,qtyReceived,packagingCondition,installationStatus,damageCause,deadlineStatus,deadlineReference?,assessmentReason,portions?}]`. Zero records non-arrival. The API normalizes exact decimal zero forms such as `0.0` to `0`. A zero-quantity inspection carries no packaging portions. Reassessment uses the same observed quantity and appends facts without receiving twice.
- Receipt: version/key/note/evidence and `lines[{lineId,qtyBase,locationId,qualityCode,portions?}]`. GOOD uses an appropriate receiving/storage location; defective STORE goods require quarantine. DIRECT customer receipt posts only accepted quantity as STORE stock. Legacy customer receipt consumes existing customer custody and transfers ownership, not a second physical arrival. It does not reopen demand or refund money.
- FD inspection records actual quantity/quality/packaging without stock. FD receipt, source claim consumption, stock movement and original SO/WIR/OD reopening commit together. Shared source cap is effective POD + posted FD returns + unresolved FD claims <= valid PGI. Claims do not reopen demand.
- Supplier proposal: warehouse/supplier/key/note and `lines[{originLineId,balanceId,qtyBase,defectHoldId?}]`. Source must trace to a posted receipt from that supplier's PO, or that supplier's custody receipt. Proposal reserves quantity and records PROPOSED details without inventing agreement facts. Returning held goods requires the explicit evidenced hold; unrelated holds are not consumed.
- Agreement: version/key/note/evidence/reference and `lines[{lineId,qtyBase}]`. Zero records refusal. An agreement for a whole-unit product requires a whole base quantity. A new agreement cannot reduce quantities already dispatched. After a dispatch, an unresolved agreement line keeps the request `PARTIAL`.
- Supplier dispatch / custody handback: version/key/note/evidence, actual `recipientName`, and source item quantities. Store-owned goods use SupplierReturnIssue; supplier-owned goods use CustodyRelease. Neither uses Owner approval.
- ACK: version/key/note/evidence and actual dispatch `lines[{lineId,qtyBase,outcome}]`. Whole-unit products require whole base quantities. Outcome is ACCEPTED, REJECTED or DAMAGED. Once all lines have agreements and the agreed quantities are fully dispatched, the request remains `DISPATCHED` while any quantity awaits acknowledgement. It becomes `ACKNOWLEDGED` when all dispatched quantities have an outcome. Unacknowledged quantity remains missing, independently of rejected quantity. Optional `supersedesAcknowledgementId` corrects one earlier acknowledgement of exactly the same source quantity, preserves its facts as SUPERSEDED, and retains the reconciliation reason/evidence.
- Closure requires every agreed quantity dispatched and accepted acknowledgements for every dispatched portion; disputes block closure. Explicit verified refusal plus the closure reason accounts for an unshipped portion. Unused reservations are released; defect holds remain until actually resolved. Closure never posts stock.

## Selection and review interface

The frontend requests `GET /return-workflows/options?compact=true` for warehouses and permissions only. Growing catalogs are not bundled into that response. Existing callers without `compact=true` retain the older options response for compatibility.

`GET /return-workflows/lookup` accepts `kind`, `search` (literal text, maximum 100 characters), `page`, and `limit` (default 10, maximum 25). Kinds are customers, suppliers, parties, lots, locations, balances, sources, documents, document-lines, evidence, stocktakes and holds. Optional identity filters are warehouseId, customerId, supplierId, lotId, balanceId and documentId; locationKinds is a bounded comma-separated set. `sources` uses a workflow `purpose` and optional defect sourceKind. Responses use array `data` plus `meta.total/page/limit`. Queries recheck permissions and warehouse assignments, preserve Sales source ownership, and project only selection metadata. Source rows show advisory remaining claim quantity; balances show advisory free quantity. Actual commands still lock and revalidate all limits transactionally.

Large choices open searchable, paginated record tables. Changing warehouse, partner, balance or source clears dependent choices and entered source quantities. Quantities use exact decimal validation and the selected product's whole-unit rule. Detection can create a hold without a disposal proposal; no scrap direction is preselected. Actual quantities, supplier acknowledgement outcomes and actual receiving quality require deliberate entry. Stock changes and decisions receive a scope/consequence review before submission. Row identity is stable after partial-operation row removal. An evidence upload inside a command refreshes the version without remounting its form.

`GET /return-workflows/:id/context` returns only the currently authorized parent identity, version, warehouse and evidence-upload permission for external-reference creation. Existing parent evidence is searchable without granting upload permission. After evidence upload, the reference form waits for this version before submitting. External-reference lists now include pagination totals and bounded search. No payment or stock action is added.

`GET /lots/:id/trace/records?section=documents|movements|reservations|evidence|history&page=1&limit=10` loads one bounded trace section. It uses the same warehouse and Accountant purchasing restrictions as the existing trace route, scanning only source identities before fetching the selected page. In the `documents` section, `recordType` distinguishes `CUSTOMER_RETURN_REQUEST` from `CUSTOMER_RETURN_RECEIPT`, whose `documentKind` is the same. Private storage fields and financial snapshots are excluded. The older full trace endpoint remains compatible. See the [UX review and verification record](RETURN_WORKFLOWS_UX_REVIEW_2026-11-07.md).

## Packaging, locks and stock

`InventoryBalance` uses holdingPointId/batchId/qualityStatus/ownerType/ownerId/quantityBase plus packagingPortions. STORE has no external owner ID; CUSTOMER/SUPPLIER stock has its actual owner. Every stock-changing command preserves exact quantities, acquires sorted location operation guards, checks LOCKED stocktake scopes, updates balance versions and packaging, records StockTransaction.movements, and checks destination capacity within its transaction.

`portions` declares actual SEALED/OPEN/LOOSE packaging. Incoming open/loose goods follow the receiving contract from main: use measuredVolumeMm3 when supplied, otherwise estimate from verified batch/product dimensions and reject missing dimensions. The user's outbound decision permits fractional-carton supplier dispatch and SCRAP execution: the shared split helper may open cartons or split known open portions, retaining conservative volumeUpperBoundMm3 on both fragments and no fabricated measurement. It prefers existing loose stock, preserves whole-base quantities, source caps and stock guards, and rejects a split without known volume/dimensions. Other movements keep the default whole-carton or whole-measured-portion restriction. See [Goods Issue outbound packaging](GOODS_ISSUES.md).

An active defect hold blocks its unresolved quantity, not automatically the entire balance. Reservations and pending tasks also reduce availability. Ordinary movements cannot consume held portions. Authorized defect execution and explicitly linked supplier returns consume only their selected hold. Existing multi-balance holds require explicit reconciliation before these execution commands; the API does not guess how a prior scalar resolution event should be allocated between balances.

## Historical-source decision and external results

In this implementation session the user explicitly confirmed: **“Yes—Accountant verifies with evidence.”** This authorizes the historical CR source workflow, not a broader new-sales-order verification gate. Broader D07/D08 decisions outside this scope remain open.

Historical creation is multipart with `file` and JSON `payload`: key/sourceSystem/referenceNo/referenceDate/correlationId/customerId/warehouseId/note and `lines[{productId,lotId,qtyBase,enteredUnit,baseUnitsPerUnit,returnedQty?}]`. Accountant verifies actual customer, warehouse, product/batch, historical conversion, delivered quantity and prior returns against uploaded evidence. No fake SO, GI or POD is created. Existing competing WMS source chains are rejected. Quantity claims serialize on the external source item and include prior returns. Sales can use only verified records with the required facts/evidence.

Ordinary external references remain linked to an authorized WMS parent/version and attachment; matched quantities are capped by source item and reference kind. Unique source identity/correlation indexes prevent duplicates. Invoice/Credit Note/refund/reconciliation references never execute money transfers, post stock or complete an SO.

Evidence accepts real bounded JPEG/PNG/PDF content through the existing file inspector, stores authenticated Cloudinary files by default, and retains owner/revision, checksum, actor and access category. Isolated local demos may explicitly set `EVIDENCE_STORAGE_PROVIDER=local`; files stay under `.local/evidence-storage` (or `EVIDENCE_LOCAL_DIR`) and retrieval rechecks current parent/warehouse access before returning the file for preview. Do not enable local storage in a deployed environment. Price-restricted evidence and internal storage keys are excluded from these DTOs. Synthetic seed metadata is not proof of a real inspection or delivery; acceptance uses real uploads.

## Compatibility and rollout

No Atlas write, reseed, index creation or connection change is part of this port. The inspected Atlas database was `wmsd_database`; the old checkout selected `sep490`. Use a native isolated local database first. Never point these APIs at the old generic-document database. Existing defect rows with no derivable warehouse scope fail closed. No warehouse ID is guessed or backfilled.

New model fields are additive: supplier details have PROPOSED/VERIFIED phase, sourceBalanceId and optional defectHoldId; verified metadata remains mandatory in VERIFIED phase. Disposition details retain targetQuality. External references optionally store customer/warehouse/status/evidence/note and historical item conversion/lot/prior returns. CustodyRelease may embed supplier acknowledgements for supplier-owned handbacks. No new collection is introduced. Old external references without complete verified historical facts are not silently made return sources.

Before a separate approved rollout, review current native indexes and affected historical records against their real sources. Existing data is not rewritten by this feature. Runtime registry disables automatic collection/index creation. Keep real evidence, secrets and backups outside Git.

## Verification

Run `npm test`, `npm run test:returns`, `npm run docs:check`, and frontend `npm run build` plus the return-workflow tests. `test:returns` uses an isolated local replica set and a random `returns_test_<ObjectId>` database; it checks that exact name before dropping only its own database and never reads `MONGODB_URI`. It defaults to `127.0.0.1:27017` (`rs0`); set `RUN_HIEUDT_TESTS=1` to use `127.0.0.1:27018` (`hieudt-test`). It does not call Cloudinary. Current branch results and the known frontend full-suite failures are recorded in [verification evidence](RETURN_WORKFLOWS_VERIFICATION.md).

The suite exercises native model/validation contracts; actual defect, CR/FD, SR and historical claim transactions; partial execution; replay; stale versions; concurrent caps; freeze rollback; wrong roles/scope; rejected custody handback; custom permissions; HTTP authentication/options/trace; and acknowledgement correction. Shared native purchase/receiving/reversal/transfer tests remain separate. These are local automated checks, not an Atlas rollout or a real-image browser acceptance claim. Record current run results and any pre-existing FE suite failures in the PR evidence.
