# BF03 — Relocate within one warehouse

Base path: `/api/location-movements`.  All responses retain the project envelope
`{ success, message, data }`.  This is a native `transfer_orders` document with
`header.taskKind = RELOCATE`; it does not create a transfer request or require a
separate approval.

## Read DTO names — 11/11/2026

List/detail responses add warehouse:{id,code,name} after warehouse scope authorization. Detail items also include fromLocation/toLocation:{id,code,name} and lot:{id,manufacturerLot}; absent referenced rows return null. Location lookups are restricted to the document warehouse. Original header.warehouseId, item.details.fromLocationId/toLocationId and lotId remain unchanged for commands. These are current catalogue display values, not new persisted snapshots or new DB fields.

FE explicitly labels BF03 as movement between locations within one warehouse. Warehouse code/name appears in list/detail; each line and confirmation displays source/destination location code/name and manufacturer lot. Editing uses a separate fromLocationId field so showing a readable location code does not corrupt select values. Missing catalogue rows show descriptive Vietnamese text, never a raw ObjectID.

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

## FE table workflow — user decision 11/11/2026

Select warehouse, then source location. Search the table by product name, SKU or manufacturer lot. Select individual balances, enter a positive whole number of cartons/pieces, and choose one destination location. The whole-location action selects every eligible row at the source, including rows hidden by search; it resets the search so all selected lines are visible. Source and destination must differ. One command is limited to 100 rows; oversized selections are rejected without silently truncating. The table retains separate lot, quality and owner rows. Active UOMs and current lot-specific carton conversions come from the server; no assumed BOX conversion is invented by FE. Network/5xx retries retain the original full payload and idempotency key.

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
positive integer strings for cartons/pieces, never JavaScript numbers or fractional quantities. The service also verifies integer base quantities and simulates packaging splits while creating/editing: sealed cartons remain whole, and existing measured loose/open portions may only move whole. Confirmation still checks the live stock and packaging again.

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

## Danh sách chuyển vị trí — 12/11/2026

Theo yêu cầu thiết kế UX của người dùng: GET `/api/location-movements` bổ sung `from`/`to` (ISO có múi giờ, bao gồm hai đầu), `sortBy=createdAt|documentNo|workflowStatus|warehouse|destinationWarehouse`, `sortOrder=asc|desc`. Giữ `q` (tìm mã đơn literal, không phân biệt hoa thường), `warehouseId`, `status`, page/limit (tối đa 100). `destinationWarehouse` trên BF03 tương đương kho hiện tại. Khoảng ngày đảo và khóa sort ngoài danh sách bị từ chối.

Response data giữ items/total/page/limit và thêm summary={total,incomplete,completed,cancelled}, warehouses=[{id,code,name}], capturedAt. Summary và danh sách kho được suy từ toàn bộ đơn trong phạm vi được xem, trước các bộ lọc; total là số đơn phù hợp bộ lọc. BF03 incomplete=OPEN, completed=CONFIRMED, cancelled=CANCELLED; không đổi vòng đời/hiệu ứng tồn. Sắp xếp kho theo tên, đồng hạng theo _id để phân trang ổn định. FE hiển thị STT theo trang, “Mã đơn”, thống kê tổng quan và form tạo thu gọn. Ngày FE lấy trọn ngày Asia/Ho_Chi_Minh. Không tải toàn bộ hồ sơ về client để thống kê.

### UX trang riêng — 12/11/2026

Quyết định người dùng thay việc mở form trong danh sách: FE dùng `/location-moves/create`, `/location-moves/:id`, `/location-moves/:id/edit` cho tạo/xem/cập nhật. Header có đường dẫn quay lại, mã đơn, trạng thái; thông tin chung và hàng hóa được nhóm riêng. Trang edit kiểm create permission, người tạo và OPEN; backend vẫn kiểm lại khi ghi. Lưu thành công chuyển về chi tiết và tải lại dữ liệu. Không đổi API hoặc vòng đời.
