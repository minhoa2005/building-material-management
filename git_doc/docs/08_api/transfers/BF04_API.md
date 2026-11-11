# BF04 — Inter-warehouse transfer

Base path: `/api/warehouse-transfers`.  All endpoints use authenticated users,
the existing `{ success, message, data }` envelope, decimal-string quantities,
optimistic `expectedVersion`, and a client-retained `idempotencyKey` (48 chars
maximum).  Re-submit exactly the same key and body after a timeout.

The caller's live permission grants and warehouse assignments are authoritative;
the UI must not infer access from a fixed role name.  The `GET /options` endpoint
is selection data only: each write command repeats its data, stock, capacity and
scope checks inside its transaction.

## Read and selection APIs

| Endpoint | Permission | Result |
| --- | --- | --- |
| `GET /` | `stock_transfer:read` | Scoped TR list; filters include source/destination warehouse, status and date. |
| `GET /:id` | `stock_transfer:read` | TR, dispatches, receipts, ITRs, generated TOs and approvals within scope. |
| `GET /options?warehouseId=` | `stock_transfer:read` | Accessible warehouses; with `warehouseId`, its locations, holding points, positive balances, verified batches and active products. |

The active warehouse catalogue supports choosing a destination outside the source
user's assignments. `sourceWarehouseIds` lists warehouses the caller may operate.
Only those warehouses expose locations and balances. Sales read scope remains
restricted to its linked demand documents.

## Main flow

| Step | API | Permission | Result |
| --- | --- | --- | --- |
| 1 | `POST /` | `stock_transfer:create` | Create `PENDING_APPROVAL` Transfer Request (TR). |
| 2 | `POST /:id/review` | `stock_transfer:approve` | A different user approves or rejects the TR. |
| 3 | `POST /:id/outbound-deliveries` | `stock_transfer:dispatch` | Create one DRAFT Transfer Dispatch from approved lines. More than one dispatch may fulfil a TR, never beyond approved quantity. |
| 4 | `POST /documents/:dispatchId/internal-requirements` | `stock_transfer:dispatch` | Create one ITR and one PICK Transfer Order (TO) for that dispatch. |
| 5 | `POST /tasks/:pickToId/confirm` | `stock_transfer:dispatch` | Creator confirms PICK; source → staging → transit posts atomically, and dispatch becomes `POSTED`. |
| 6 | `POST /dispatches/:dispatchId/receipts` | `stock_transfer:receive` | A different destination user receives transit stock into RECEIVING or QUARANTINE. |
| 7 | `POST /documents/:receiptId/internal-requirements` | `stock_transfer:receive` | Create one ITR/PUTAWAY TO for the receipt. |
| 8 | `POST /tasks/:putawayToId/confirm` | `stock_transfer:receive` | Confirm PUTAWAY: receiving → storage. |
| 9 | `POST /:id/close` | `stock_transfer:receive` | Close only after every approved quantity is dispatched, transit is zero and every receipt's ITR is complete. |

An ITR is one-to-one with its source dispatch or receipt, and a TO is one-to-one
with the ITR.  The indexes and command locking enforce those relationships even
when two clients submit concurrently.

## Request bodies

Create TR:

```json
{
  "idempotencyKey": "tr-001",
  "sourceWarehouseId": "<sourceWarehouseId>",
  "destinationWarehouseId": "<destinationWarehouseId>",
  "reason": "Replenish destination stock",
  "lines": [{ "productId": "<productId>", "enteredUnit": "PIECE", "enteredQty": "20" }]
}
```

Review: `{"idempotencyKey":"review-001","expectedVersion":1,"decision":"APPROVE","reason":"Approved"}`.
The approver must not be the TR creator.

Create dispatch:

```json
{
  "idempotencyKey": "dispatch-001",
  "expectedVersion": 2,
  "lines": [{
    "requestLineId": "<TR line id>",
    "sourceBalanceId": "<good STORE balance id>",
    "stagingLocationId": "<source STAGING location id>",
    "qtyBase": "20"
  }]
}
```

Create PICK requirement: `{"idempotencyKey":"pick-itr-001","expectedVersion":1}`.
Confirm PICK additionally requires `recipientName` (and may include `vehiclePlate`).

Receive dispatch:

```json
{
  "idempotencyKey": "receipt-001",
  "expectedVersion": 2,
  "lines": [
    { "dispatchLineId": "<dispatch line id>", "locationId": "<RECEIVING id>", "qtyBase": "18", "qualityCode": "GOOD" },
    { "dispatchLineId": "<dispatch line id>", "locationId": "<QUARANTINE id>", "qtyBase": "2", "qualityCode": "DAMAGED", "damageReason": "Broken in transit" }
  ]
}
```

For a receipt with GOOD lines, create its PUTAWAY requirement with
`destinations:[{receiptLineId,locationId}]`, one STORAGE location for every good
receipt line.  A receipt containing only DAMAGED lines validly sends
`destinations:[]`; it completes its empty putaway task without inventing a stock
movement.  Confirming a PUTAWAY TO and closing a TR otherwise use
`{idempotencyKey, expectedVersion}`.

## Guarantees and checks

Commands reject inactive warehouses/products, unverified lots, non-STORE/GOOD
outbound balances, wrong location kinds, self-approval, same dispatcher/receiver,
stale versions, over-dispatch, shortage, remaining transit, duplicate source
requirements, and changed idempotency bodies.  A successful command writes stock
ledger changes, document statuses, audit and outbox records atomically.  Failed
commands roll back completely.

The isolated native test (`RUN_NATIVE_API_TESTS=1 node --test
test/native-api.integration.test.js`) covers the complete happy path, a custom
destination role, scoped option data, and the all-damaged receipt closure path.
