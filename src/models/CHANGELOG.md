## 2026-11-03 — Quantity-only purchase receiving v3

- Purchase inspection requires clientLineKey/planned Receiving location; removes disposition/holding/custody fields. GR lines reference PO/inspection only and receive GOOD from outside STORE. Unique draft row keys; replacement inspection links preserve the physical trip.
- Add PurchaseEvent append-only authority/correction history, PurchaseSourceClaim (zero for draft; guarded RR allowance on OPEN), ReceiptPlacement (receipt provenance/claims/actual/reversal) and PurchaseEvidenceUpload (actor/parent/private upload lifecycle). 44 collections; 36 document kinds and 22 line kinds unchanged.
- Add RR purchasingVersion guard without invalidating approval snapshots, PO creation key, schedule/replacement refs, purchase task source refs, line label snapshots, optional Evidence.lineId and command receipt references.
- Shared quality/custody/INSPECTION schemas remain for CR/FD/transfer. This decision supersedes the purchase supplier-custody notes below.

# Model changelog

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
