# Model changelog

Record future changes to model files here, including the date, affected models, and a concise description of the change. This log starts on 2026-10-28; it does not reconstruct earlier model history.

## 2026-10-29 — Trungph return workflows, iterations 1–3

- Supplier-return lines distinguish PROPOSED from VERIFIED agreement facts; the legacy default remains VERIFIED with mandatory evidence, actor, time and agreement version. Added optional sourceBalanceId.
- External references add source document, evidence, status, note, customer and warehouse. Lines retain matched source, historical lot/conversion, prior returns and a conditional-write claim version.
- ReturnSourceClaim adds optional actual consumedQty for partially accepted customer requests; existing consumed records fall back to qtyBase. No bulk data rewrite is required.

## 2026-10-29 — UC-35 / UC-36 relocation source and planning guard

- WAREHOUSE_TASK details add optional sourceBalanceId, sourceBalanceVersion and ownerPartyId. New UC-36 tasks always record them; existing tasks remain readable. No quantity or reservation is changed on creation.
- Location adds planningVersion (default 0) to serialize overlapping task planners. Existing rows acquire it on the first guarded write; no bulk migration or new collection/index is required. Future stocktake/task/posting writers must share this guard.
- API and verification contract: [location movements](../modules/location-movements/README.md).
- 2026-10-29 — `DEFECT_CASE`/`DISPOSITION`/`DefectHold`: added defect source and warehouse references, disposition target quality, and a unique active hold per stock balance.
- 2026-10-29 — `ReturnSourceGuard`: added a per-issued-line transaction guard for concurrent customer-return claims.
