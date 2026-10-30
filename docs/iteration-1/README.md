# Backend Iteration 1 — UC-01–07 and UC-17–32

Status: backend implemented and verified on 2026-10-30. Frontend remains unwired.
Scope owner: minhtd.

## Scope and locked decisions

Implemented UCs:

| Group | UCs |
|---|---|
| Replenishment request | UC-01–UC-06 |
| Purchase order list | UC-07 |
| Product, conversion, policy | UC-17–UC-23 |
| Lot | UC-24–UC-27 |
| Supplier | UC-28–UC-32 |

Locked decisions applied:

- RR is created manually; each new line is `MANUAL_OTHER` with its own nonblank reason.
- A product does not have to be below minimum to be requested.
- A new request can be saved as DRAFT or submitted immediately.
- Owner reviews each line's approved base quantity and cannot exceed the submitted quantity.
- Supplier states are `ACTIVE`, `SUSPENDED`, `TERMINATED`; Accountant creates ACTIVE suppliers; only Owner changes cooperation status.
- Lot identity is product + manufacturer lot + tone + actual calibre; a lot is shared catalog metadata while stock/history remain warehouse-scoped.
- PO confirmed quantity stays `null` without structured supplier confirmation data.
- No frontend or PO mutation work is included.

Out of scope: source-based RR creation, shortage/coverage evaluation, notifications, PO create/update/cancel/close, receipt posting, goods receipt/put-away commands, lot file upload, selling price, debt, payment and invoices.

## Architecture

```text
routes
  -> authenticate
  -> checkPermission
  -> Zod validation
  -> thin controller
  -> service transaction / scope / state machine
  -> Mongoose models and mappers
```

New modules are under `src/modules/products`, `suppliers`, `lots`,
`purchase-orders`, plus command functions in `replenishments`. Shared
input/error/audit/identity helpers are under `src/shared/utils`.

## Invariants

All commands in this iteration:

- Do not create/update PostingBatch or StockMovement.
- Do not change StockBalance, Reservation or DemandSupplyAllocation.
- Do not create a PO, receipt, approval for another document type, notification or email.
- Do not mutate posted source documents.
- Reject client-supplied actor, version, result, qtyBase or evaluation snapshot fields.
- Use decimal strings and exact decimal.js arithmetic; JSON floating-point quantities are rejected.

RR manual commands are allowed independently of stocktake freeze because they do
not post stock or evaluate coverage.

## Record scope

| Resource | Owner | Accountant | Sales | Warehouse |
|---|---|---|---|---|
| RR read | all warehouses | assigned warehouses | own creator + assigned | own creator + assigned |
| RR write | none | none | own DRAFT/REVISION_REQUIRED | own DRAFT/REVISION_REQUIRED |
| RR review | all warehouses, not creator/sender | none | none | none |
| PO | all | assigned | none | assigned, receiving projection |
| Product master | read/write as permissions | read | read | read |
| Lot catalog | read/create/update as permissions | none | none | read/create only, stock scoped |
| Supplier master | read/status | read/create/update | none | none |
| Supplier documents | all + own doc permissions | assigned + own doc permissions | none | none |

No warehouse assignment yields an empty warehouse-scoped list, 404 detail outside
scope, and an empty CREATE warehouse lookup. Owner retains store-wide RR, PO,
product and supplier access according to the settled rights above.

## Endpoint and code traceability

| UC | Endpoint | Service | Main tests |
|---|---|---|---|
| UC-01 | GET `/api/replenishments` | `listReplenishments` | `replenishment-read.test.js`, `replenishment-read.integration.test.js` |
| UC-02 | GET `/api/replenishments/:id`, GET submissions | `getReplenishment`, `listReplenishmentSubmissions`, `getReplenishmentSubmission` | same + `iteration1-replenishment.integration.test.js` |
| UC-03 | POST `/api/replenishments` | `createReplenishment` | RR integration |
| UC-04 | PUT `/api/replenishments/:id` | `updateReplenishment` | RR integration |
| UC-05 | POST collection SUBMIT; POST `/:id/submit` | `createReplenishment`, `submitReplenishment` | RR integration |
| UC-06 | POST `/api/replenishments/:id/review` | `reviewReplenishment` | RR integration |
| UC-07 | GET `/api/purchase-orders` | `listPurchaseOrders` | `iteration1-purchase-order.integration.test.js` |
| UC-17/18 | GET `/api/products`, GET `/:id` | `listProducts`, `getProduct` | master integration |
| UC-19 | POST `/api/products` | `createProduct` | master integration |
| UC-20 | PUT `/api/products/:id` | `updateProduct` | master integration |
| UC-21 | PATCH `/api/products/:id/status` | `changeProductStatus` | master integration |
| UC-22 | POST/GET `/api/products/:id/conversions` | `createConversion`, `listConversions` | master integration |
| UC-23 | GET/PUT `/api/products/:id/warehouse-policies` | `listPolicies`, `configurePolicy` | master integration |
| UC-24/25 | GET `/api/lots`, GET `/:id` | `listLots`, `getLot` | master integration |
| UC-26 | POST `/api/lots` | `createLot` | master integration |
| UC-27 | PUT `/api/lots/:id` | `updateLot` | master integration |
| UC-25 history | GET `/api/lots/:id/movements` | `getLotMovements` | master integration |
| UC-28/29 | GET `/api/suppliers`, GET `/:id` | `listSuppliers`, `getSupplier` | master integration |
| UC-30 | POST `/api/suppliers` | `createSupplier` | master integration |
| UC-31 | PUT `/api/suppliers/:id` | `updateSupplier` | master integration |
| UC-32 | PATCH `/api/suppliers/:id/status` | `changeSupplierStatus` | master integration |
| UC-29 history/docs | GET `/:id/history`, GET `/:id/documents` | `getSupplierHistory`, `getSupplierDocuments` | master integration |

Full API rules: [API reference](../api/iteration-1/README.md).  
Per-UC cards: [use-cases.md](use-cases.md).  
Migration: [MIGRATION.md](MIGRATION.md).  
Check results: [VERIFICATION.md](VERIFICATION.md).

## Model changes

- Product adds version and optional tile attributes; SKU is normalized for new records.
- ProductUomVersion adds createdBy/verificationReference and current-version indexes.
- Party adds supplier contact, cooperation status, reason and version.
- Lot adds version, creator, notes, verification facts and identityLocked.
- Approval line adds optional reason.
- BusinessOperation adds result {workflowStatus, approvalId}.
- AuditEvent adds entityType/entityId/changes and an entity history index.
- New append-only ReplenishmentSubmission stores immutable per-submission line snapshots.
- REPLENISHMENT line details add removedAt for soft deletion.
- MongoDB representation is now 40 collections (the previous 39 plus
  `replenishment_submissions`).

## Remaining limitations

- The migration has not been applied to the shared/live database.
- Frontend screens/API adapters are not changed in this package.
- No notification/evaluation/RR source-creation or PO command API exists.
- PO list quantity derivation is evaluated in the service before pagination for
  correctness; large datasets need an aggregation/materialized reader later.
- Existing historical RR without a submission snapshot returns an explicit
  unavailable result; the backend does not fabricate history.
