# Iteration 1 use-case cards

Tests referenced below are:
`test/iteration1-foundation.test.js`,
`test/iteration1-master.integration.test.js`,
`test/iteration1-replenishment.integration.test.js`,
`test/iteration1-purchase-order.integration.test.js`,
`test/iteration1-migration.integration.test.js`, and the pre-existing RR read
unit/integration suites.

## UC-01 — View replenishment request list

- **Actor/trigger:** Owner/Accountant/Sales/Warehouse opens the RR list.
- **Preconditions:** Active user, current role and `replenishment_request:read`.
- **Input:** page/limit/search/warehouseId/createdBy/status/approvalDecision/date range.
- **Main flow:** Build role scope, intersect filters, look up latest decision,
  sort, count, paginate, preview up to three current lines.
- **Alternative/errors:** explicit foreign warehouse 403; empty result 200; removed
  lines excluded.
- **DB reads/writes:** read document/line/approval/master only; no writes.
- **Postcondition:** unchanged RR/approval/stock.
- **Tests:** RR read suites; master RR integration indirectly; full suite.

## UC-02 — View replenishment request details

- **Actor/trigger:** Authorized user opens one RR.
- **Preconditions:** RR exists inside role/creator/warehouse scope.
- **Input:** RR ID; optional submission page/version.
- **Main flow:** Load current lines, approvals, stored source relations, live
  availability, submission summary; fetch snapshot/history from subresources.
- **Alternative/errors:** wrong kind/out of scope returns the same 404; missing old
  snapshot returns explicit `available=false`, never synthesized history.
- **DB reads/writes:** document/line/approval/master/stock/link/submission reads.
- **Postcondition:** no mutation.
- **Tests:** replenishment read suites and RR integration.

## UC-03 — Create replenishment draft

- **Actor/trigger:** Warehouse/Sales saves the manual form.
- **Preconditions:** create permission; active assigned warehouse; active products;
  current conversions.
- **Input:** action SAVE_DRAFT, creationKey, warehouse, neededOn, triggerReason,
  1–100 lines with product/conversion/positive quantity/line reason.
- **Main flow:** Replay lookup; validate scope and masters; exact qtyBase; reject
  duplicate product+UOM+reason; create DRAFT v1, lines, operation and audit in one
  transaction.
- **Alternative/errors:** inactive product/warehouse, changed/old conversion,
  fractional whole piece, missing reason, forged qty/source/actor fields.
- **DB reads/writes:** write BusinessDocument, DocumentLine, BusinessOperation,
  AuditEvent; no stock records.
- **Postcondition:** DRAFT v1 with no submission snapshot/approval.
- **Tests:** foundation contract; RR integration create/replay/duplicate scope.

## UC-04 — Update replenishment request

- **Actor/trigger:** Creator edits DRAFT or returned RR.
- **Preconditions:** update permission, creator identity, current warehouse
  assignment, DRAFT/REVISION_REQUIRED, expectedVersion.
- **Input:** header, current line set (existing ID/new line), expectedVersion,
  operationKey.
- **Main flow:** Replay; scope/state/version; reject product replacement; validate
  all current conversions; update IDs in place, soft-delete omitted lines, append
  new lines with lineNo above the historical maximum; CAS version + audit +
  operation.
- **Alternative/errors:** stale version 409; removed ID reuse/wrong product 400;
  source-backed RR 409; lost assignment 403; conversion drift 409.
- **DB reads/writes:** update document/line; append operation/audit; no snapshot or
  stock writes.
- **Postcondition:** version+1, same state, submitted facts preserved.
- **Tests:** RR integration update/replay/rollback/scope.

## UC-05 — Submit replenishment request

- **Actor/trigger:** Warehouse/Sales sends a new form or saved RR.
- **Preconditions:** creator, update/create permission, editable state,
  expectedVersion, active assigned warehouse, current neededOn, current conversions.
- **Input:** collection direct submit or `/:id/submit {expectedVersion, operationKey}`.
- **Main flow:** Replay-before-version; validate current lines; CAS version; set
  server submittedBy/time; append immutable snapshot for the submitted version;
  set SUBMITTED; operation/audit in one transaction.
- **Alternative/errors:** past neededOn 400; no lines/state 409; conversion drift
  409; competing submit one transition only.
- **DB reads/writes:** write document header/status/version, ReplenishmentSubmission,
  BusinessOperation, AuditEvent; no stock.
- **Postcondition:** SUBMITTED version with immutable line snapshot.
- **Tests:** RR integration direct submit, saved submit, conversion drift, race.

## UC-06 — Approve, reject or return RR

- **Actor/trigger:** Owner reviews a SUBMITTED RR.
- **Preconditions:** allow permission, exact current version, snapshot exists,
  reviewer differs from creator/submitter.
- **Input:** decision APPROVE/REJECT/REVISE, expectedVersion, operationKey, general
  reason and per-line approved base quantities/reasons for APPROVE.
- **Main flow:** Replay; load snapshot; validate coverage/range/granularity/reasons;
  append Approval; CAS status without changing version; operation/audit in one
  transaction.
- **Alternative/errors:** self approval 403; stale/state 409; all-zero/oversized/
  missing coverage or reason 400; concurrent decision one commit.
- **DB reads/writes:** read document/snapshot/product whole-unit flag; write Approval,
  document status, operation/audit; no stock.
- **Postcondition:** APPROVED/REJECTED/REVISION_REQUIRED on the exact submitted
  version; requested snapshot unchanged.
- **Tests:** RR integration partial approval, revise, reject, self-review, races.

## UC-07 — View purchase order list

- **Actor/trigger:** Owner/Accountant/Warehouse opens PO list.
- **Preconditions:** `purchase_order:read`; non-Owner has an assigned warehouse.
- **Input:** page/limit/search/supplier/warehouse/status/date/outstanding.
- **Main flow:** Scope POs, derive ordered/received/outstanding from the
  PO→arrival→inspection→GR line chain and effective STORE ledger, filter
  outstanding, count/paginate, preview max three lines.
- **Alternative/errors:** foreign explicit warehouse 403; draft GR/custody ignored
  as owned receipt; broken chain/over-receipt/closed-without-basis INCOMPLETE and
  null quantities; empty result 200.
- **DB reads/writes:** read PO/line/arrival/inspection/GR/link/batch/movement/stock/
  account/location/party/warehouse/product/UOM. No writes.
- **Postcondition:** no stock/document mutation.
- **Tests:** PO integration baseline, draft, reversal, custody, over, closed, broken,
  filters, scope, side effects.

## UC-17 — View product list

- **Actor/trigger:** Business user opens product list.
- **Preconditions:** `product:read`.
- **Input:** page/limit/literal search/nominalSize/isActive/sort whitelist.
- **Main flow:** Query global product master, count/sort/paginate, attach base UOM.
- **Alternative/errors:** unknown sort/operator 400; inactive remains readable.
- **DB reads/writes:** Product/Uom reads only.
- **Postcondition:** no mutation; no stock/price fabricated.
- **Tests:** master integration.

## UC-18 — View product details

- **Actor/trigger:** Business user opens one product.
- **Preconditions:** read permission; product exists.
- **Input:** product ID, optional conversion history page/UOM.
- **Main flow:** Return metadata/version and current conversion per UOM; history is
  a separate subresource. Policies require Owner update permission.
- **Alternative/errors:** missing 404; future conversion not current; historical
  missing creator/reference stays null.
- **DB reads/writes:** Product/Uom/current conversion reads.
- **Postcondition:** no mutation.
- **Tests:** master integration.

## UC-19 — Create product

- **Actor/trigger:** Owner creates product master.
- **Preconditions:** `product:create`, UOM exists, SKU unique.
- **Input:** SKU/name/base UOM/whole-piece flag and optional tile metadata.
- **Main flow:** Normalize SKU; validate fields; create Product v1, base conversion
  v1 factor 1, audit in one transaction.
- **Alternative/errors:** duplicate 409; invalid UOM/dimension 400; no client
  status/version/conversion/policy.
- **DB reads/writes:** write Product, ProductUomVersion, AuditEvent; no stock/lot.
- **Postcondition:** active Product v1 with base conversion; no lot/balance/policy.
- **Tests:** foundation contract, master integration duplicate race/atomic base.

## UC-20 — Update product information

- **Actor/trigger:** Owner edits product metadata.
- **Preconditions:** update permission, product/version exists.
- **Input:** expectedVersion and permitted metadata set.
- **Main flow:** CAS metadata/version; append before/after audit; return detail.
- **Alternative/errors:** stale version 409 with currentVersion; identity/system
  fields rejected.
- **DB reads/writes:** update Product; append AuditEvent.
- **Postcondition:** version+1; old document snapshots untouched.
- **Tests:** master integration snapshot/version conflict.

## UC-21 — Change product status

- **Actor/trigger:** Owner activates/deactivates product.
- **Preconditions:** update permission, expectedVersion.
- **Input:** isActive and reason.
- **Main flow:** Validate version; no-op returns current; real change CAS status/
  version + audit.
- **Alternative/errors:** stale conflict; same-state does not create history.
- **DB reads/writes:** Product update + AuditEvent for real changes.
- **Postcondition:** status changed or unchanged; stock/history preserved.
- **Tests:** master integration no-op, deactivation/readability.

## UC-22 — Define packaging conversion version

- **Actor/trigger:** Owner adds a conversion rule.
- **Preconditions:** active product/version, UOM exists, non-base UOM, valid factor/
  time/reference.
- **Input:** expectedProductVersion, UOM, factor, validFrom, verificationReference.
- **Main flow:** Validate factor/precision/whole-piece BOX; CAS Product version as
  shared guard; append max+1 conversion; audit in transaction.
- **Alternative/errors:** past/future invalid time, missing reference, base UOM,
  fractional whole-piece BOX, stale product version 409.
- **DB reads/writes:** write ProductUomVersion and AuditEvent; bump Product version;
  never update/delete old conversion.
- **Postcondition:** new immutable version; old document factors unchanged.
- **Tests:** master integration future/current/history/concurrency.

## UC-23 — Configure warehouse stock policy

- **Actor/trigger:** Owner sets minimum/target for product+warehouse.
- **Preconditions:** active product/warehouse, expectedVersion (0=create).
- **Input:** minimumQtyBase, optional targetQtyBase, expectedVersion.
- **Main flow:** Validate target >= minimum/granularity; insert v1 or CAS update+1;
  set updatedBy; audit.
- **Alternative/errors:** absent policy on update or existing policy on create 409;
  invalid target 400.
- **DB reads/writes:** Product/Warehouse reads; ProductWarehousePolicy + AuditEvent.
- **Postcondition:** policy version changed; no RR/PO/stock effect.
- **Tests:** master integration create/default/update/invalid.

## UC-24 — View lot list

- **Actor/trigger:** Owner/Warehouse opens lot catalog.
- **Preconditions:** `product_lot:read`.
- **Input:** page/limit/product/identity/status/optional warehouse.
- **Main flow:** Query shared catalog by identity; compute `hasScopedStock` only in
  authorized warehouses; return lots without stock too.
- **Alternative/errors:** explicit foreign warehouse 403.
- **DB reads/writes:** Lot/Product/StockBalance/Account/Location/Warehouse/Party reads.
- **Postcondition:** no mutation; no out-of-scope stock disclosure.
- **Tests:** master integration.

## UC-25 — View lot details and history

- **Actor/trigger:** Owner/Warehouse opens lot detail/history.
- **Preconditions:** lot read; movements additionally need `stock_movement:read`.
- **Input:** lot ID; movement page/limit.
- **Main flow:** Return shared metadata and scoped stock dimensions; history checks
  both movement endpoints, then hydrates source document only with its own permission.
- **Alternative/errors:** movement with any endpoint outside scope hidden; source
  reference unavailable without permission; no fabricated supplier/first-import data.
- **DB reads/writes:** Lot/stock/account/location/party/warehouse/movement/batch/
  document reads.
- **Postcondition:** no mutation.
- **Tests:** master integration stock/detail/history scope.

## UC-26 — Create product lot

- **Actor/trigger:** Owner/Warehouse registers a new lot identity.
- **Preconditions:** active product, create permission.
- **Input:** product, manufacturerLot/tone/calibre, identificationStatus, optional
  manufacturedOn/reference/notes.
- **Main flow:** Validate identity and verification basis; duplicate check; create
  v1 with createdBy and server verification facts; audit.
- **Alternative/errors:** duplicate 409; VERIFIED incomplete 400; future
  manufacturedOn 400; UNKNOWN is explicit and non-allocatable.
- **DB reads/writes:** write Lot + AuditEvent; no stock/quality.
- **Postcondition:** new common lot catalog record, identityLocked=false.
- **Tests:** master integration.

## UC-27 — Update product lot information

- **Actor/trigger:** Owner edits lot metadata/re-verifies identity.
- **Preconditions:** update permission, expectedVersion, record exists.
- **Input:** expectedVersion and allowed metadata/identity fields.
- **Main flow:** Check identityLocked and real line/balance references; lock if used;
  validate identity/status/reference; conditional CAS update with audit.
- **Alternative/errors:** identity on used lot 409; VERIFIED→UNKNOWN rejected;
  identity change without status/reference 400; duplicate identity 409.
- **DB reads/writes:** read references; write Lot + AuditEvent; never quantity/quality.
- **Postcondition:** metadata/version updated; identity protected.
- **Tests:** master integration reference lock.

## UC-28 — View supplier list

- **Actor/trigger:** Owner/Accountant opens suppliers.
- **Preconditions:** `supplier:read`.
- **Input:** page/limit/literal search/cooperationStatus.
- **Main flow:** Force kind=SUPPLIER, filter/sort/paginate, return contact summary/
  status/version.
- **Alternative/errors:** Warehouse/Sales/Admin blocked; no Customer/Store/Carrier.
- **DB reads/writes:** Party read only.
- **Postcondition:** no mutation.
- **Tests:** master integration.

## UC-29 — View supplier details, history and documents

- **Actor/trigger:** Owner/Accountant opens supplier detail.
- **Preconditions:** supplier read; document kind also has its own read permission
  and warehouse scope.
- **Input:** supplier ID; history page; documents kind/page.
- **Main flow:** Return contact/status; page supplier AuditEvents; resolve direct PO/
  SR supplier headers or GR chain back to a supplier PO.
- **Alternative/errors:** missing chain excludes GR; foreign warehouse documents
  hidden; inactive supplier history remains readable; no evidence URL.
- **DB reads/writes:** Party/AuditEvent/document/line/link/warehouse reads.
- **Postcondition:** no mutation.
- **Tests:** master integration PO/GR chain and history.

## UC-30 — Create supplier

- **Actor/trigger:** Accountant creates supplier.
- **Preconditions:** `supplier:create`; globally unique code.
- **Input:** code/name/contact/tax/notes.
- **Main flow:** Normalize code; validate; force SUPPLIER/ACTIVE/isActive/version 1;
  insert and audit in transaction.
- **Alternative/errors:** duplicate code 409; invalid email 400; no client status/
  kind/version/actor.
- **DB reads/writes:** write Party + AuditEvent.
- **Postcondition:** ACTIVE supplier v1.
- **Tests:** foundation contract, master integration concurrent code.

## UC-31 — Update supplier information

- **Actor/trigger:** Accountant edits supplier contact/profile.
- **Preconditions:** update permission, expectedVersion.
- **Input:** permitted name/contact fields.
- **Main flow:** CAS metadata/version; audit before/after; return detail.
- **Alternative/errors:** Owner edit 403; stale 409; status/code/kind not accepted.
- **DB reads/writes:** Party update + AuditEvent.
- **Postcondition:** contact/version updated; cooperation unchanged.
- **Tests:** master integration.

## UC-32 — Change supplier cooperation status

- **Actor/trigger:** Owner changes ACTIVE/SUSPENDED/TERMINATED.
- **Preconditions:** `supplier:activate`, expectedVersion, nonblank reason.
- **Input:** cooperationStatus, reason.
- **Main flow:** Same-state no-op; otherwise CAS status/isActive/version, statusReason
  and audit.
- **Alternative/errors:** Accountant blocked; stale 409; no-op creates no history.
- **DB reads/writes:** Party update + AuditEvent.
- **Postcondition:** new state/version with reason; PO/stock history untouched.
- **Tests:** master integration TERMINATED restore/no-op.
