# BF04 — Inter-warehouse transfer

Base path: `/api/warehouse-transfers`.  All endpoints use authenticated users,
the existing `{ success, message, data }` envelope, decimal-string quantities,
optimistic `expectedVersion`, and a client-retained `idempotencyKey` (48 chars
maximum).  Re-submit exactly the same key and body after a timeout.

The caller's live permission grants and warehouse assignments are authoritative;
the UI must not infer access from a fixed role name.  The `GET /options` endpoint
is selection data only: each write command repeats its data, stock, capacity and
scope checks inside its transaction.

## Read DTO names — 11/11/2026

Scoped list/detail responses add sourceWarehouse and destinationWarehouse objects containing id,code,name (null if a reference no longer exists). FE renders explicit warehouse source/destination code and name for BF04, retaining the header IDs separately for actions. Lookups happen only after the request scope check; Sales redaction of operational documents remains unchanged. These fields are response-only current catalogue labels; no migration or shared-DB write is required.

## Read and selection APIs

| Endpoint | Permission | Result |
| --- | --- | --- |
| `GET /` | `stock_transfer:read` | Scoped TR list; filters include source/destination warehouse, status and date. |
| `GET /dispatches` | `stock_transfer:read` | Tra phiếu xuất theo kho nguồn, kho đích, số phiếu và trạng thái. Với `receivable=true`, cần `stock_transfer:receive`. Kết quả chỉ gồm phiếu xuất đã ghi, yêu cầu đã duyệt, còn hàng đang chuyển và người nhận khác người xuất. |
| `GET /dispatches/:id` | `stock_transfer:read` | Chi tiết phiếu xuất với `receivableLines` nếu người dùng đủ điều kiện nhận. |
| `GET /:id` | `stock_transfer:read` | TR, dispatches, receipts, ITRs, generated TOs and approvals within scope. |
| `GET /options?warehouseId=` | `stock_transfer:read` | Accessible warehouses; with `warehouseId`, its locations, holding points, positive balances, verified batches and active products. |

The active warehouse catalogue supports choosing a destination outside the source
user's assignments. `sourceWarehouseIds` lists warehouses the caller may operate.
Only those warehouses expose locations and balances. Sales read scope remains
restricted to its linked demand documents. Sales options return warehouse catalogue only, with empty operational source IDs, locations, balances and product/lot data.

Bộ lọc `status` của danh sách yêu cầu và phiếu xuất nhận một hoặc nhiều trạng thái phân tách bằng dấu phẩy. Từ yêu cầu điều chuyển, nút **Lập phiếu nhập** mở form Nhập kho với phiếu xuất điền sẵn. Form gọi `POST /dispatches/:id/receipts` và mở phiếu nhập theo `data.id`. Các dòng hư hỏng cần vị trí cách ly và lý do.

## Main flow

| Step | API | Permission | Result |
| --- | --- | --- | --- |
| 1 | `POST /` | `stock_transfer:create` | Create `PENDING_APPROVAL` Transfer Request (TR). |
| 2 | `POST /:id/review` | `stock_transfer:approve` | A different user approves, rejects or returns the TR (REVISE). |
| 3 | `POST /:id/outbound-deliveries` | `stock_transfer:dispatch` | Create one DRAFT Transfer Dispatch from approved lines. More than one dispatch may fulfil a TR, never beyond approved quantity. |
| 4 | `POST /documents/:dispatchId/internal-requirements` | `stock_transfer:dispatch` | Create one ITR and one PICK Transfer Order (TO) for that dispatch. |
| 5 | `POST /tasks/:pickToId/confirm` | `stock_transfer:dispatch` | Creator confirms PICK; source → staging → transit posts atomically, and dispatch becomes `POSTED`. |
| 6 | `POST /dispatches/:dispatchId/receipts` | `stock_transfer:receive` | A different destination user receives transit stock into RECEIVING or QUARANTINE. |
| 7 | `POST /documents/:receiptId/internal-requirements` | `stock_transfer:receive` | Create one ITR/PUTAWAY TO for its GOOD lines; all-DAMAGED receipts need no TO. |
| 8 | `POST /tasks/:putawayToId/confirm` | `stock_transfer:receive` | Confirm PUTAWAY: receiving → storage. |
| 9 | `POST /:id/close` | `stock_transfer:receive` | Close only after every approved quantity is dispatched, transit is zero and every required GOOD putaway is complete, with no unresolved difference report. |

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
receipt line.  A receipt containing only DAMAGED lines needs no ITR/TO; the service rejects empty putaway work.  Confirming a PUTAWAY TO and closing a TR otherwise use
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

## Danh sách chuyển kho — 12/11/2026

Theo yêu cầu UX của người dùng: GET `/api/warehouse-transfers` hỗ trợ thêm `q` (mã đơn literal, không phân biệt hoa thường), `sortBy=createdAt|documentNo|workflowStatus|warehouse|destinationWarehouse`, `sortOrder=asc|desc`. Giữ bộ lọc sourceWarehouseId, destinationWarehouseId, status, from/to ISO có múi giờ (bao gồm hai đầu), page/limit (tối đa 100). Sắp xếp warehouse/destinationWarehouse theo tên kho nguồn/đích, đồng hạng theo _id. Chỉ nhận khóa sort trong allowlist, khoảng ngày đảo bị từ chối.

Response data giữ items/total/page/limit; thêm summary={total,incomplete,completed,cancelled}, warehouses=[{id,code,name}], capturedAt. Summary và các kho lấy từ toàn bộ đơn được phép xem trước bộ lọc; total là số đơn phù hợp bộ lọc. completed=COMPLETED; cancelled=CANCELLED hoặc REJECTED; incomplete là các trạng thái còn lại (bao gồm PENDING_APPROVAL, APPROVED). Scope role/warehouse/record hiện hành được áp trước mọi nhánh thống kê/lọc. Không thay lệnh ghi, quyền hoặc tồn. FE mở danh sách trước, ẩn form tạo sau nút Tạo đơn, đánh STT xuyên trang và dùng createdAt thật từ DTO. Ngày lọc FE lấy trọn ngày giờ Việt Nam.

### UX trang riêng — 12/11/2026

Theo yêu cầu người dùng, FE chuyển tạo đơn sang `/transfers/create`; lưu thành công mở `/transfers/:id`. Danh sách không nhúng form. Trang tạo chia thông tin kho, hàng hóa và lý do, giữ payload/key khi retry chưa rõ kết quả; trang chi tiết có header/trạng thái, metadata và bảng dòng yêu cầu. Các cập nhật duyệt/xuất/nhận/cất/đóng vẫn thực hiện trên trang chi tiết với quyền/trạng thái đang có. Cập nhật 12/11: sửa/gửi lại TR ở /transfers/:id/edit qua PUT với expectedVersion; xem hợp đồng phạm vi mới bên dưới.

## Phạm vi hoàn thiện 12/11/2026

[Hợp đồng 20 UC hiện hành](../HIEUDT_WAREHOUSE_SCOPE.md) mô tả update/resubmit, reservation từ draft dispatch, hủy draft, bảng tiến độ, UC56 và nhận hỗn hợp/từng phần. Bổ sung PUT /:id (stock_transfer:update), POST /dispatches/:id/cancel (dispatch, key/version/reason), POST /dispatches/:id/differences (update, key/version/reason/lines[{dispatchLineId,qtyBase}]), POST /differences/:id/review (approve_variance, key/version/decision/reason/receiptId khi APPROVE). Không có lệnh sửa số lượng đã POSTED hoặc tự đóng thiếu hàng.
