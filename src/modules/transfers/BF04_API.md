# BF04 — Main flow, 30 October 2026

Uses the user's revised swimlane. Source confirmation (step 7) also confirms
physical dispatch. Damaged goods are received into QUARANTINE in the destination
warehouse. All quantities are decimal strings. MongoDB replica set is required.

Base URL: `/api/warehouse-transfers`. Use an authenticated Bearer token.
All writes accept an `idempotencyKey` (max 48 characters) and, except initial
creation, `expectedVersion` of the document named in the URL. Keep the same key
and unchanged payload when retrying. Responses use `{success,message,data}` and
return `data.id`, `documentNo`, `status`, `version`, `replayed`.

| Step | API | Role and result |
| --- | --- | --- |
| 1 | POST `/` | Source Warehouse Staff creates TRANSFER_REQUEST, PENDING_APPROVAL. |
| 2–3 | POST `/:id/review` | Store Owner approves or rejects with a reason; approver differs from creator. |
| 4 | POST `/:id/outbound-deliveries` | Source Warehouse Staff creates a DRAFT TRANSFER_DISPATCH referencing TR lines. This is separate from the sales OUTBOUND_DELIVERY model. |
| 5–6 | POST `/documents/:id/internal-requirements` | Source is the draft dispatch; creates an INTERNAL_TRANSFER_REQUIREMENT and automatically generates a PICK TO. Returns the TO ID. |
| 7 | POST `/tasks/:id/confirm` | Confirms the entire PICK TO and dispatch together. Source → STAGING → transit are recorded in one posting transaction. |
| 8 | POST `/dispatches/:id/receipts` | Destination Warehouse Staff, different from dispatcher, posts MWTR: transit → RECEIVING for GOOD, or QUARANTINE for DAMAGED. Damage reason creates a linked DEFECT_CASE. |
| 9–10 | POST `/documents/:id/internal-requirements` | Source is MWTR; select destination bins for GOOD lines. Creates requirement and PUTAWAY TO automatically. Damaged lines are already placed in QUARANTINE; if there are no GOOD lines, the empty putaway task is recorded as confirmed without a stock movement. |
| 11 | POST `/tasks/:id/confirm` | Destination Warehouse Staff confirms the full PUTAWAY TO: receiving → storage. |
| 12 | POST `/:id/close` | Destination Warehouse Staff closes TR only when all requested quantities were dispatched, all transit is zero and every receipt has completed putaway. |

Step 1 body:
```json
{
  "idempotencyKey": "tr-001",
  "sourceWarehouseId": "<ObjectId>",
  "destinationWarehouseId": "<ObjectId>",
  "reason": "Replenish destination warehouse",
  "lines": [{"productId":"<ObjectId>","conversionId":"<ObjectId>","enteredQty":"20"}]
}
```

Review: `{"idempotencyKey":"review-001","expectedVersion":1,"decision":"APPROVE","reason":"Approved"}`.
Use `REJECT` and the actual rejection reason for step 3.

Step 4: `{"idempotencyKey":"out-001","expectedVersion":2,"lines":[{"requestLineId":"<TR line ID>","sourceBalanceId":"<balance ID>","stagingLocationId":"<STAGING ID>","qtyBase":"20"}]}`.

Step 5 and confirmations: `{"idempotencyKey":"unique-key","expectedVersion":1}`.
TO IDs are returned from requirement creation. GET `/:trId` includes dispatches,
receipts, their versions/line IDs, internal requirements and generated TOs.

Step 8:
```json
{
  "idempotencyKey":"receipt-001","expectedVersion":2,
  "lines":[
    {"dispatchLineId":"<ID>","locationId":"<RECEIVING ID>","qtyBase":"18","qualityCode":"GOOD"},
    {"dispatchLineId":"<ID>","locationId":"<QUARANTINE ID>","qtyBase":"2","qualityCode":"DAMAGED","damageReason":"Broken during transport"}
  ]
}
```

Step 9: `{"idempotencyKey":"putaway-001","expectedVersion":1,"destinations":[{"receiptLineId":"<GOOD receipt line ID>","locationId":"<STORAGE ID>"}]}`.

Multiple dispatches may fulfil one TR, matching the loop back to step 4. Draft
dispatch quantities consume request allowance; a full TO confirms one dispatch.
Short receipts leave stock in transit and cannot close the TR. Overreceipts are
rejected. Ledger, balances, status and audit are committed together; failure rolls
back the whole command. Frozen/held sources and quantities reserved for other
demands cannot be dispatched. Demand-linked reservation/allocation transfer and
shortage write-off/reversal are not introduced by this main-flow implementation.

Verification: `MONGODB_TEST_URI` pointing at an isolated local replica set,
`node --test test/transfer-lifecycle.integration.test.js`. The test creates and
drops only its uniquely named `sep490_bf04_*` database.
