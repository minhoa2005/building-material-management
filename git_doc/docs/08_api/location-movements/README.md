# BF03 — Relocate within one warehouse

Base path: `/api/location-movements`.  All responses retain the project envelope
`{ success, message, data }`.  This is a native `transfer_orders` document with
`header.taskKind = RELOCATE`; it does not create a transfer request or require a
separate approval.

## Contract

| Endpoint | Permission | Purpose |
| --- | --- | --- |
| `GET /` | `stock_relocation:read` | List RELOCATE orders inside the caller's warehouse scope. |
| `GET /options?warehouseId=` | `stock_relocation:create` | Selection data: accessible warehouses, active locations, balances, lots and products. |
| `POST /` | `stock_relocation:create` | Create an `OPEN` order. |
| `GET /:id` | `stock_relocation:read` | Read order and committed stock transactions. |
| `PATCH /:id` | `stock_relocation:create` | Creator replaces reason/lines while the order is `OPEN`. |
| `POST /:id/confirm` | `stock_relocation:confirm` | Creator confirms the **whole** order once. |
| `POST /:id/cancel` | `stock_relocation:create` | Creator cancels an `OPEN`, unposted order. |

Permissions are loaded from the authenticated role; do not rely on a hard-coded
frontend role name.  Warehouse access is still checked on every command.

## Create or edit

`POST /` body (use the same line structure for `PATCH /:id`, plus
`expectedVersion` and without `warehouseId`):

```json
{
  "idempotencyKey": "relocate-001",
  "warehouseId": "<warehouseId>",
  "reason": "Move verified lot to a new bin",
  "lines": [{
    "sourceBalanceId": "<balanceId>",
    "sourceBalanceVersion": 3,
    "toLocationId": "<destinationLocationId>",
    "enteredUnit": "PIECE",
    "enteredQty": "12"
  }]
}
```

The API derives product, lot, quality, owner and exact base quantity from the
live balance.  It requires an active product and verified lot, a current source
balance version, different active locations in the same warehouse, available
quantity after other open tasks, and capacity at confirmation.  Quantities are
decimal strings (up to six decimal places), never JavaScript numbers.

## Confirmation is all-or-nothing

BF03 has only `OPEN`, `CONFIRMED` and `CANCELLED`; `PARTIAL` is not a valid
state.  The creator must submit every current line and each actual base quantity
must exactly equal the planned quantity:

```json
{
  "idempotencyKey": "relocate-confirm-001",
  "expectedVersion": 1,
  "lines": [{ "lineId": "<TO line id>", "actualQtyBase": "12" }]
}
```

The command atomically decreases the source balance and increases the destination
balance, preserves eligible reservations, writes one `StockTransaction`, marks
the order `CONFIRMED`, and records audit/outbox data.  To change quantity or a
destination, edit the still-open order first.  Reuse the same idempotency key and
unchanged payload after a timeout; a replay returns the prior result and never
posts stock twice.

`GET /:id` exposes the actual quantity calculated from committed movements, not
from planned data.  Cancel accepts `{idempotencyKey, expectedVersion, reason}`;
it never reverses a posted order because confirmed relocation is immutable.

## Errors and verification

- `400`: invalid body, stale location/balance conditions or unusable stock.
- `403`: missing permission or a command not allowed for the actor.
- `404`: unavailable/out-of-scope order.
- `409`: stale document/balance or idempotency payload conflict.

`test/location-movements.test.js` verifies DTO validation.  The isolated native
integration profile in `test/native-api.integration.test.js` verifies creator-only
full confirmation, rejection of a partial amount, a single ledger posting on
replay, and stock restoration for the test fixture.
