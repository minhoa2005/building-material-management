# Trungph return workflows on native models

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
| CR inspection / FD inspection, UC-84/85 | POST `/customer-returns/:id/inspect`, `/reassess`; POST `/failed-deliveries/:id/inspect` |
| CR receipt / FD receipt, UC-86/87 | POST `/customer-returns/:id/receipt`; POST `/failed-deliveries/:id/receipt` |
| Failed delivery record / search / detail | POST/GET `/failed-deliveries`; GET `/failed-deliveries/:id` |
| Customer custody handback | POST `/customer-returns/:id/handback` |
| Supplier return search/detail/proposal, UC-88/89/90 | GET/POST `/supplier-returns`; GET `/supplier-returns/:id` |
| Actual supplier dispatch / closure, UC-91/92 | POST `/supplier-returns/:id/dispatch`, `/close` |
| Supplier agreement and later acknowledgement (original UC-107 scope) | POST `/supplier-returns/:id/agreement`, `/acknowledgement` |
| Lot trace, UC-116 | GET `/lots/:id/trace`, `/lots/:id/trace/evidence/:evidenceId` |
| Verified historical delivery, UC-122 | POST `/external-references/historical` |
| External result references, UC-123 | GET/POST `/external-references` |
| Shared source options and evidence | GET `/return-workflows/options`; POST `/return-workflows/:id/evidence`; GET `/return-workflows/:id/evidence/:evidenceId` |

The older 19-UC assignment is covered by these functions; split UCs are shown separately. Retired supplier Owner approval is not restored.

## Payload and response rules

Quantities are exact decimal strings, never JS floating-point numbers. IDs identify a native parent document and stable embedded item. `items[].sources[]` identifies the source collection/document/item and linked quantity. Client DTO adapters may call display rows `lines`; storage remains `items[]`.

All business creations use a stable `idempotencyKey`; commands also require `expectedVersion` on the parent. Reuse the original payload/key after a lost response. Changing payload requires a new key. Operation records bind actor, operation, target and payload hash. Replays recheck permission and scope. Command results are `{id, version, workflowStatus, operationId, resultRefs, replayed}` in the usual `data` envelope. Lists use array `data` with `meta.total/page/limit`; detail responses include `relatedDocuments`, scoped attachment metadata and audit history.

- Defect creation: `warehouseId, balanceId, quantity, sourceKind, reason`, optional matching source item and optional initial disposition. `sourceKind=STOCKTAKE` requires the actual locked session and forbids ordinary disposition. Source-free inspection is MANUAL. Detection may be followed later by `/proposals` with `lines[{lineId,qtyBase,outcome,targetQuality?}]`, evidence and note.
- Decisions: `expectedVersion, idempotencyKey, decision, reason`, optional per-item `lines[{lineId,qtyBase}]`. Defect approval binds the plan and approved quantity; CR approval binds the actual current inspection snapshot. Installed/customer-damaged/verified-overdue or unknown facts cannot be approved as an eligible return.
- CR creation: `warehouseId, customerId, idempotencyKey, lines[{salesIssueLineId OR historicalExternalLineId,qtyBase,reason}]`. Never use both source types. Creation claims quantity but does not receive inventory.
- CR inspection: version/key/note/evidence, `custodyLocationId`, and `lines[{returnLineId,qtyReceived,packagingCondition,installationStatus,damageCause,deadlineStatus,deadlineReference?,assessmentReason,portions?}]`. Zero means an actual recorded non-arrival. Reassessment uses the same observed quantity and appends facts without receiving twice.
- Receipt: version/key/note/evidence and `lines[{lineId,qtyBase,locationId,qualityCode,portions?}]`. GOOD uses an appropriate receiving/storage location; defective STORE goods require quarantine. Customer receipt consumes customer custody and transfers ownership, not a second physical arrival. It does not reopen demand or refund money.
- FD inspection records actual quantity/quality/packaging without stock. FD receipt, source claim consumption, stock movement and original SO/WIR/OD reopening commit together. Shared source cap is effective POD + posted FD returns + unresolved FD claims <= valid PGI. Claims do not reopen demand.
- Supplier proposal: warehouse/supplier/key/note and `lines[{originLineId,balanceId,qtyBase,defectHoldId?}]`. Source must trace to a posted receipt from that supplier's PO, or that supplier's custody receipt. Proposal reserves quantity and records PROPOSED details without inventing agreement facts. Returning held goods requires the explicit evidenced hold; unrelated holds are not consumed.
- Agreement: version/key/note/evidence/reference and `lines[{lineId,qtyBase}]`; zero records refusal. Verified facts are retained in agreement history and current line metadata. A new agreement cannot reduce quantities already dispatched.
- Supplier dispatch / custody handback: version/key/note/evidence, actual `recipientName`, and source item quantities. Store-owned goods use SupplierReturnIssue; supplier-owned goods use CustodyRelease. Neither uses Owner approval.
- ACK: version/key/note/evidence and actual dispatch `lines[{lineId,qtyBase,outcome}]`. Outcome is ACCEPTED, REJECTED or DAMAGED. Unacknowledged quantity remains missing, independently of rejected quantity. Optional `supersedesAcknowledgementId` corrects one earlier acknowledgement of exactly the same source quantity, preserves its facts as SUPERSEDED, and retains the reconciliation reason/evidence.
- Closure requires every agreed quantity dispatched and accepted acknowledgements for every dispatched portion; disputes block closure. Explicit verified refusal plus the closure reason accounts for an unshipped portion. Unused reservations are released; defect holds remain until actually resolved. Closure never posts stock.

## Packaging, locks and stock

`InventoryBalance` uses holdingPointId/batchId/qualityStatus/ownerType/ownerId/quantityBase plus packagingPortions. STORE has no external owner ID; CUSTOMER/SUPPLIER stock has its actual owner. Every stock-changing command preserves exact quantities, acquires sorted location operation guards, checks LOCKED stocktake scopes, updates balance versions and packaging, records StockTransaction.movements, and checks destination capacity within its transaction.

`portions` declares actual SEALED/OPEN/LOOSE packaging. Whole cartons can use the fixed verified batch carton dimensions. Open/loose quantities require measuredVolumeMm3; no inferred volume or silent carton opening. The existing shared split helper only splits sealed groups at whole-carton boundaries; a loose/open portion can move whole. Unsupported partial repackaging is rejected rather than inventing the remaining volume.

An active defect hold blocks its unresolved quantity, not automatically the entire balance. Reservations and pending tasks also reduce availability. Ordinary movements cannot consume held portions. Authorized defect execution and explicitly linked supplier returns consume only their selected hold. Existing multi-balance holds require explicit reconciliation before these execution commands; the API does not guess how a prior scalar resolution event should be allocated between balances.

## Historical-source decision and external results

In this implementation session the user explicitly confirmed: **“Yes—Accountant verifies with evidence.”** This authorizes the historical CR source workflow, not a broader new-sales-order verification gate. Broader D07/D08 decisions outside this scope remain open.

Historical creation is multipart with `file` and JSON `payload`: key/sourceSystem/referenceNo/referenceDate/correlationId/customerId/warehouseId/note and `lines[{productId,lotId,qtyBase,enteredUnit,baseUnitsPerUnit,returnedQty?}]`. Accountant verifies actual customer, warehouse, product/batch, historical conversion, delivered quantity and prior returns against uploaded evidence. No fake SO, GI or POD is created. Existing competing WMS source chains are rejected. Quantity claims serialize on the external source item and include prior returns. Sales can use only verified records with the required facts/evidence.

Ordinary external references remain linked to an authorized WMS parent/version and attachment; matched quantities are capped by source item and reference kind. Unique source identity/correlation indexes prevent duplicates. Invoice/Credit Note/refund/reconciliation references never execute money transfers, post stock or complete an SO.

Evidence accepts real bounded JPEG/PNG/PDF content through the existing file inspector, stores authenticated Cloudinary files, and retains owner/revision, checksum, actor and access category. Retrieval rechecks current parent/warehouse access and issues a short-lived signed URL. Price-restricted evidence and internal storage keys are excluded from these DTOs. Synthetic seed metadata is not proof of a real inspection or delivery; acceptance uses real uploads.

## Compatibility and rollout

No Atlas write, reseed, index creation or connection change is part of this port. The inspected Atlas database was `wmsd_database`; the old checkout selected `sep490`. Use a native isolated local database first. Never point these APIs at the old generic-document database. Existing defect rows with no derivable warehouse scope fail closed. No warehouse ID is guessed or backfilled.

New model fields are additive: supplier details have PROPOSED/VERIFIED phase, sourceBalanceId and optional defectHoldId; verified metadata remains mandatory in VERIFIED phase. Disposition details retain targetQuality. External references optionally store customer/warehouse/status/evidence/note and historical item conversion/lot/prior returns. CustodyRelease may embed supplier acknowledgements for supplier-owned handbacks. No new collection is introduced. Old external references without complete verified historical facts are not silently made return sources.

Before a separate approved rollout, review current native indexes and affected historical records against their real sources. Existing data is not rewritten by this feature. Runtime registry disables automatic collection/index creation. Keep real evidence, secrets and backups outside Git.

## Verification

Run `npm test`, `npm run test:returns`, `npm run docs:check`, and frontend `npm run build` plus the return-workflow tests. `test:returns` requires an isolated local replica set on `127.0.0.1:27028` named `wmsd_model_tests`. It creates a random `returns_test_<ObjectId>` database, checks that exact name before dropping only its own database, and never reads MONGODB_URI. It does not call Cloudinary. Current branch results and the known frontend full-suite failures are recorded in [verification evidence](RETURN_WORKFLOWS_VERIFICATION.md).

The suite exercises native model/validation contracts; actual defect, CR/FD, SR and historical claim transactions; partial execution; replay; stale versions; concurrent caps; freeze rollback; wrong roles/scope; rejected custody handback; custom permissions; HTTP authentication/options/trace; and acknowledgement correction. Shared native purchase/receiving/reversal/transfer tests remain separate. These are local automated checks, not an Atlas rollout or a real-image browser acceptance claim. Record current run results and any pre-existing FE suite failures in the PR evidence.
