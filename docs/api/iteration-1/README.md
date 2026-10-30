# Iteration 1 API reference — UC-01–07, UC-17–32

Base prefix: `/api`. All endpoints require a Bearer access token (or the existing
access cookie). IDs are ObjectId strings, quantities/factors are decimal strings,
dates are UTC ISO and `neededOn` input/filter dates are `YYYY-MM-DD` in
Asia/Saigon. JSON bodies are limited to 1 MiB.

Success:

```json
{ "success": true, "message": "Success", "data": {} }
```

List:

```json
{
  "success": true,
  "message": "Success",
  "data": { "items": [], "total": 0, "page": 1, "limit": 10 }
}
```

Error:

```json
{
  "success": false,
  "message": "Dữ liệu đã thay đổi, vui lòng tải lại.",
  "code": "ERR-CORE-409-001",
  "fieldErrors": [],
  "details": { "currentVersion": 4 }
}
```

`currentVersion` is returned only after the record is confirmed inside the
caller's scope. Unknown fields, operator/object query values, malformed ObjectIds,
JSON-number quantities and unsupported sort fields are rejected.

## Permissions and scope

| Operation | Roles | Permission |
|---|---|---|
| RR read | Owner/Accountant/Warehouse/Sales | `replenishment_request:read` |
| RR create/direct submit | Warehouse/Sales | `replenishment_request:create` |
| RR update/saved submit | Warehouse/Sales | `replenishment_request:update` |
| RR review | Owner | `replenishment_request:approve` |
| PO read | Owner/Accountant/Warehouse | `purchase_order:read` |
| Product read | all business roles | `product:read` |
| Product create/update/status/conversion/policy | Owner | `product:create` / `product:update` |
| Lot read/create | Owner/Warehouse | `product_lot:read` / `product_lot:create` |
| Lot update | Owner | `product_lot:update` |
| Lot movement history | Owner/Warehouse | `product_lot:read` + `stock_movement:read` |
| Supplier read | Owner/Accountant | `supplier:read` |
| Supplier create/update | Accountant | `supplier:create` / `supplier:update` |
| Supplier status | Owner | `supplier:activate` |

A role with a revoked permission is blocked. ADMIN has no implicit business
operation. Owner is not granted RR creation or supplier contact edits by read
access. Record/warehouse checks are applied again inside services.

## Replenishment request

### GET `/api/replenishments`

Query: `page`, `limit` 1–100, `search` (RR number, literal), `warehouseId`,
`createdBy`, `status`, `approvalDecision`, `createdFrom`, `createdTo`.
Owner may filter any warehouse; another role gets 403 for an explicit warehouse
outside assignment. Sorting is `createdAt DESC, _id DESC`. Removed RR lines are
excluded from `lineCount` and `linePreview` (max 3).

Item fields: `id`, `documentNo`, `workflowStatus`, `version`, warehouse,
creator, createdAt, neededOn, lineCount, linePreview and latestDecision.

### GET `/api/replenishments/:id`

Returns current lines only, saved conversion/source snapshot, approval history,
current availability as a live reference, submission summary and related stored
links. Added fields:

```json
{
  "submissionHistoryAvailable": true,
  "submissionCount": 2
}
```

`approvedQtyBase="0"` is a real zero decision; `null` means no applicable decision
for the current version. GET is side-effect free.

### GET `/api/replenishments/options?mode=CREATE|FILTER`

- CREATE: Warehouse/Sales with create or update permission; active assigned
  warehouses only.
- FILTER: any RR reader; Owner sees all, other roles see assigned warehouses,
  including historical inactive warehouses.

Response:

```json
{ "warehouses": [{ "id": "…", "code": "WH01", "name": "Kho chính", "isActive": true }] }
```

### POST `/api/replenishments`

Permission: `replenishment_request:create`, roles Warehouse/Sales.

```json
{
  "action": "SAVE_DRAFT",
  "creationKey": "client-key",
  "warehouseId": "…",
  "neededOn": "2026-12-01",
  "triggerReason": "Bổ sung hàng dự trữ",
  "note": "Ghi chú",
  "lines": [
    {
      "productId": "…",
      "conversionId": "…",
      "enteredQty": "10",
      "reasonNote": "Chuẩn bị hàng cho đợt bán"
    }
  ]
}
```

`action` is `SAVE_DRAFT` or `SUBMIT`. 1–100 lines. The server forces
`triggerType=MANUAL_OTHER`, verifies the selected conversion is the current
version for the same product/UOM, calculates `qtyBase` exactly, rejects duplicate
product+UOM+reason lines and rejects fractional whole-piece quantities. A direct
SUBMIT creates SUBMITTED v1 and an immutable snapshot in one transaction.
`neededOn` in the past is allowed only for a draft.

Response:

```json
{
  "id": "…",
  "version": 1,
  "workflowStatus": "DRAFT",
  "operationId": "…",
  "approvalId": null,
  "replayed": false
}
```

### PUT `/api/replenishments/:id`

Permission: `replenishment_request:update`, creator only. Body:
`expectedVersion`, `operationKey`, warehouse/date/reason/note and the current
line set. An existing line includes `id`; a new line omits it.

- Omitted current lines are soft-deleted (`details.removedAt`), not physically erased.
- A removed line ID cannot be reused. A new line gets a new ID and a lineNo above
  the maximum ever used.
- Product cannot be changed on an existing line; remove and add instead.
- Conversion/quantity/reason can be changed while preserving the line ID.
- Status remains DRAFT or REVISION_REQUIRED; submittedBy/At are not fabricated.

### POST `/api/replenishments/:id/submit`

```json
{ "expectedVersion": 2, "operationKey": "submit-key" }
```

Allowed from DRAFT/REVISION_REQUIRED. Increments version, stores server
submittedBy/time, validates current conversions, and creates the immutable
snapshot for the new version. It does not accept header/line edits.

### POST `/api/replenishments/:id/review`

Permission: Owner, not creator or submitter.

```json
{
  "expectedVersion": 3,
  "operationKey": "review-key",
  "decision": "APPROVE",
  "reason": "Duyệt theo kế hoạch",
  "lines": [
    { "lineId": "…", "approvedQtyBase": "6", "reason": "Giảm lượng" },
    { "lineId": "…", "approvedQtyBase": "0", "reason": "Chưa cần" }
  ]
}
```

- APPROVE requires exactly every snapshot line, unique IDs, `0 <= approved <= requested`,
  correct whole-piece granularity and a line reason whenever reduced/zero.
  At least one line must be positive. Version is unchanged.
- REJECT/REVISE require a general reason and no approval quantities.
- Review uses the submitted snapshot, not current masters/stock/conversion or
  current neededOn.
- Competing reviews create exactly one approval.

### Submission history

- GET `/api/replenishments/:id/submissions?page=&limit=` newest version first.
- GET `/api/replenishments/:id/submissions/:version`:
  - existing snapshot: `{available:true, availabilityStatus:"AVAILABLE", snapshot, approval}`;
  - historical version without a snapshot: `{available:false, availabilityStatus:"UNAVAILABLE", snapshot:null, approval:null}`.

Snapshots contain warehouse/product/UOM/quantity/reason text and never current
master names substituted for history.

### RR state/version

| Action | From | To | Version |
|---|---|---|---|
| Create draft | — | DRAFT | 1 |
| Direct submit | — | SUBMITTED | 1 |
| Edit | DRAFT/REVISION_REQUIRED | unchanged | +1 |
| Submit saved | DRAFT/REVISION_REQUIRED | SUBMITTED | +1 |
| Approve/Reject/Revise | SUBMITTED | APPROVED/REJECTED/REVISION_REQUIRED | unchanged |

### Idempotency and conflicts

- `creationKey` is unique per creator. Same creator/key/payload replays the old
  receipt; changed payload or SAVE_DRAFT↔SUBMIT returns 409.
- Existing-document commands hash `operationKey` per actor. Replay is checked
  before expectedVersion. Same actor/key on another target/action or with another
  payload returns 409.
- Canonical payload includes action, actor, target, expectedVersion and normalized
  business fields; line order is preserved. Server timestamps/document numbers are
  not part of the hash.
- A conflict requires a refreshed version and a new key after the payload changes.

## Purchase orders

### GET `/api/purchase-orders`

Query: `page`, `limit`, `search` (document number), `supplierId`, `warehouseId`,
`status` (literal max 30), `createdFrom`, `createdTo`,
`outstanding=YES|NO|UNKNOWN`.

Owner sees all warehouses; Accountant/Warehouse see assigned warehouses.
Warehouse receives a receiving projection (no supplier confirmation/commercial
fields). Outstanding filtering is applied before count/pagination.

Preview line:

```json
{
  "lineId": "…",
  "lineNo": 1,
  "product": { "id": "…", "sku": "…", "name": "…" },
  "baseUom": { "id": "…", "code": "PIECE", "name": "Viên" },
  "orderedQtyBase": "100",
  "confirmedQtyBase": null,
  "receivedQtyBase": "60",
  "outstandingQtyBase": "40",
  "quantityState": "KNOWN"
}
```

Quantity source is the typed chain
`PO line -> ARRIVAL -> INSPECTION -> GR_PURCHASE -> StockMovement/PostingBatch`.
Only posted owned STORE receipt is subtracted. Draft GR, custody-only receipts,
invalid chains, over-receipts, negative results and CLOSED/CANCELLED POs without
cancellation facts produce `quantityState=INCOMPLETE` and null received/outstanding.
Root/reversal/reversal-of-reversal batches are counted once with batch-chain sign.
Only text supplier confirmation exists, so `confirmedQtyBase` is `null`.

## Products

### GET `/api/products`

Query: `page`, `limit`, `search` (literal SKU/name), `nominalSize`, `isActive`,
`sortBy=createdAt|sku|name`, `sortOrder=asc|desc`. No warehouse/stock filter.

### GET `/api/products/:id`

Returns metadata, current conversions (one current version per UOM with
`validFrom <= now`) and version. Future conversions appear only in conversion
history.

### GET `/api/products/options`

- `product:read`: UOM catalogue.
- Owner with `product:update`: also active warehouse catalogue for policies.

### POST `/api/products`

Owner only. Fields: `sku`, `name`, `baseUomId`, optional `wholeBaseUnits`,
nominal/immaterial attributes and tile dimensions. Not accepted: isActive,
version, conversions, policy, quantities. SKU is trimmed/uppercased; length and
width must both be present or absent. The command creates Product v1, its base
conversion v1/factor 1 and an audit event in one transaction. It creates no lot,
balance, policy, RR or PO.

### PUT `/api/products/:id`

Owner only. Body: `expectedVersion` and the editable metadata fields. This is a
replace of editable optional metadata: omitted optional fields are cleared.
SKU/baseUomId/wholeBaseUnits/isActive/conversions/policies are rejected. CAS on
version; historical document line name snapshots are untouched.

### PATCH `/api/products/:id/status`

Body: `expectedVersion`, `isActive`, `reason`. A same-state no-op returns the
current product without a version bump or audit. A real transition uses CAS and
audit. Historical stock/documents remain readable; new RR create/submit rejects
an inactive product.

### GET `/api/products/:id/conversions`

Query: `page`, `limit`, optional `uomId`. History sorted newest validFrom/version.
Historical records with missing creator/reference return null, not invented data.

### POST `/api/products/:id/conversions`

```json
{
  "expectedProductVersion": 4,
  "uomId": "…",
  "basePerUnit": "4",
  "validFrom": "2026-11-01T00:00:00.000Z",
  "verificationReference": "Verified supplier sheet"
}
```

Owner only. Product must be active. Base UOM cannot be recreated. Factor is
positive decimal NUMERIC(24,12); BOX factor for whole-piece products must be an
integer. validFrom cannot be in the past. Product version acts as the shared write
guard; the conversion version is max+1 and append-only.

### GET/PUT `/api/products/:id/warehouse-policies`

Owner only. `minimumQtyBase` and optional `targetQtyBase` are base-UOM quantities.
`target` defaults to minimum and must be >= minimum. Whole-piece products require
integer values. Create uses `expectedVersion:0`; updates CAS `version` and set the
actual updatedBy. No RR/PO or stock change is created.

## Lots

### GET `/api/lots`

Owner/Warehouse. Query: `page`, `limit`, `productId`, exact
`manufacturerLot`/`tone`/`calibre`, `identificationStatus`, optional
`warehouseId`. Lots with no stock are still returned. `hasScopedStock` is computed
only from warehouses the caller may access; an explicit foreign warehouse is 403.

### GET `/api/lots/:id`

Common lot metadata is readable by Owner/Warehouse. `stock[]` contains only
in-scope balances and separates warehouse, location, quality and owner. It does
not invent supplier, first import date or initial quantity.

### POST `/api/lots`

Owner/Warehouse. Fields: productId, manufacturerLot, tone, calibre,
identificationStatus, optional manufacturedOn, verificationReference, notes.
VERIFIED needs complete non-UNKNOWN identity and a reference; the server records
verifiedBy/At. Explicit UNKNOWN is not allocatable. manufacturedOn cannot be in
the future. Duplicate identity is 409. Warehouse may create but not update.

### PUT `/api/lots/:id`

Owner only. Body: expectedVersion plus permitted metadata. Product cannot change.
Identity fields are locked once DocumentLine/StockBalance references exist or
identityLocked is true. Identity edits require identificationStatus; VERIFIED
requires a fresh reference. A VERIFIED lot cannot be moved back to UNKNOWN in this
UC. CAS protects concurrent edits; the identity write is guarded by
`identityLocked:false` when identity changes.

### GET `/api/lots/:id/movements`

Requires `product_lot:read` and `stock_movement:read`. Owner/Warehouse only.
Every movement endpoint must be in an allowed warehouse; otherwise the whole
movement is hidden. Source document metadata is readable only with its own
operation permission and warehouse scope, otherwise `access=UNAVAILABLE`.
Responses contain before/after quantities, batch/reversal and document reference.

## Suppliers

### GET `/api/suppliers`

Owner/Accountant. Query: page/limit, literal search on code/name,
`cooperationStatus`. Only Party kind SUPPLIER is returned. Legacy missing status
is interpreted from isActive for filtering/presentation until migration.

### GET `/api/suppliers/:id`

Contact fields, tax code, contact person, notes, status/isActive, reason, version
and timestamps. GET `/history` pages AuditEvent records. GET
`/documents?kind=PO|GR_PURCHASE|SUPPLIER_RETURN&page=&limit=` applies document
read permission, warehouse scope and supplier-chain attribution. GR has no direct
supplier header; it is attributed only when its line chain resolves to a PO of the
supplier with matching product/warehouse. No supplier document detail/evidence URL
is created by this endpoint.

### POST `/api/suppliers`

Accountant only. Fields: code, name, phone, email, address, taxCode,
contactPerson, notes. Server forces kind=SUPPLIER, ACTIVE, isActive=true, version=1
and writes an audit event. Email must be valid if supplied; blank taxCode is valid.
Code is unique across all Party kinds and normalized for new records.

### PUT `/api/suppliers/:id`

Accountant only. Full replace of permitted name/contact fields; omitted optional
fields are cleared. Code/kind/cooperationStatus/isActive/version are not accepted.
CAS expectedVersion. Editing a TERMINATED supplier does not restore cooperation.

### PATCH `/api/suppliers/:id/status`

Owner only. Body: expectedVersion, cooperationStatus
ACTIVE/SUSPENDED/TERMINATED, nonblank reason. Any transition among the three states
is allowed. A same-state call is a history-free no-op. A transition updates
isActive, stores statusReason, increments version and appends an audit event.

## Error matrix

| Code | HTTP | Condition |
|---|---:|---|
| `ERR-CORE-400-001` | 400 | Schema/allowlist/format failure; inspect fieldErrors |
| `ERR-CORE-401-001` | 401 | Invalid/inactive session |
| `ERR-CORE-403-001` | 403 | Missing role/permission |
| `ERR-CORE-403-002` | 403 | Explicit warehouse outside scope |
| `ERR-CORE-404-001` | 404 | Missing/wrong-kind/out-of-scope record |
| `ERR-CORE-409-001` | 409 | Expected version conflict; details.currentVersion |
| `ERR-CORE-409-002` | 409 | Duplicate SKU/code/identity |
| `ERR-CORE-409-003` | 409 | Operation/creation key used with another payload/target |
| `ERR-CORE-413-001` | 413 | Body over 1 MiB |
| `ERR-RR-409-001` | 409 | RR state/transition or missing current snapshot |
| `ERR-RR-403-001` | 403 | Creator/submitter attempts self-approval |
| `ERR-RR-409-002` | 409 | Selected conversion is no longer current at submit |
| `ERR-RR-409-003` | 409 | Manual command attempted on a sourced RR |
| `ERR-RR-400-001` | 400 | Approval coverage/quantity/all-zero/reason error |
| `ERR-LOT-409-001` | 409 | Lot identity is already referenced/locked |
| `ERR-LOT-400-001` | 400 | VERIFIED lot lacks complete identity/reference |

## Frontend integration rules

- Use real IDs from API; never localStorage/demo warehouse IDs.
- Reuse creationKey/operationKey only for the same payload when retrying network
  or 401 refresh. A changed payload after 409 needs a new key.
- Keep form values after validation/conflict. Do not silently replace conversion,
  quantity, approval quantity or null with zero.
- Null means unknown/not recorded. Use `approvedQtyBase="0"` only for a real zero.
- Do not present submission history as current stock/coverage or fabricate history
  when `available=false`.
- Hide controls by permission/state but rely on server enforcement.
- Do not fall back to demo data when HTTP fails.
