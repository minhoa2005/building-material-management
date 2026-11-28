# Hướng dẫn đọc code: từ Yêu cầu bổ sung (RR) đến Nhập hàng và Cất hàng

> RR duyệt theo đơn vị gốc. PO đối chiếu lượng duyệt theo đơn vị gốc và chỉ áp dụng ngoại lệ vượt trần cho thùng. Phiếu nhập mua ghi tồn vào bãi tiếp nhận. Kho dùng Chuyển vị trí BF03 để đưa hàng lên kệ lưu trữ.
>
> Bản hướng dẫn bám mã nguồn BE ở commit `c8474b7`. [Phần 2](#phần-2--giải-phẫu-chi-tiết-từng-hàm-theo-thứ-tự-thực-thi) mô tả luồng chính theo thứ tự gọi. [Phần 2B](#phần-2b--luồng-phụ-và-luồng-liên-quan) tra cứu sửa, hủy, chốt thiếu, mở lại PO, giữ hộ, đảo phiếu, bằng chứng và các module liên quan. [Phần 4](#phần-4--kiểm-thử-đã-chạy) ghi kết quả theo từng lượt chạy.

## 1. Thông tin quy trình nghiệp vụ

- **Tên quy trình:** Bổ sung hàng qua mua hàng — RR → PO → Hàng đến & Kiểm nhận → Phiếu nhập mua (ghi tồn). Kho dùng Chuyển vị trí để đưa hàng lên kệ.
- **Bối cảnh:** Kho (hoặc Sales) thấy thiếu hàng, lập **Yêu cầu bổ sung** (RR, mã `YCBS-...`). Owner duyệt số lượng. Kế toán lập **Đơn mua hàng** (PO, `ĐMH-...`) gửi nhà cung cấp. Khi xe hàng đến, thủ kho ghi **Hàng đến kho** (`HĐK-...`) và **Phiếu kiểm nhận** (`PKN-...`), đếm theo lô, chấm chất lượng. Hàng đạt được lập **Phiếu nhập mua** (`PNM-...`), ghi tồn vào **bãi tiếp nhận** (vị trí `RECEIVING`). Sau đó thủ kho lập **Lệnh chuyển vị trí** (`LCV-...`, `TransferOrder` loại `RELOCATE`) và chuyển hàng từ bãi tiếp nhận lên **kệ lưu trữ** (vị trí `STORAGE`).
- **Lệnh thay đổi chứng từ:** các lệnh RR, PO, kiểm nhận, nhập mua và BF03 dùng `command()` để chạy trong MongoDB transaction, xử lý gửi lại, kiểm `version` khi sửa chứng từ và ghi `audit_logs`. Bút toán thay đổi tồn nằm trong `stock_transactions.movements`.

### Mã chứng từ

Mã phiếu chính là `_id` của document (kiểu chuỗi), sinh bởi `nextDocumentFields()` theo mẫu `<tiền tố>-<mã kho>-<YYMMDD>-<6 số>`, ví dụ `YCBS-K01-261116-000001`. Bảng tiền tố `documentTypes` nằm ở [document-number.js:5](../../../src/shared/utils/document-number.js). Riêng `LCV` (và các phiếu điều chuyển) dùng mã kho rút gọn qua `compactUnit`, ví dụ kho `K-GACH-01` thành `KG1`.

| Loại | Tiền tố | Model | Collection |
|---|---|---|---|
| RR | `YCBS` | `ReplenishmentRequest` | `replenishment_requests` |
| PO | `ĐMH` | `PurchaseOrder` | `purchase_orders` |
| ARR | `HĐK` | `GoodsArrival` | `goods_arrivals` |
| INS | `PKN` | `GoodsInspection` | `goods_inspections` |
| GR | `PNM` | `PurchaseReceipt` (discriminator `PURCHASE`) | `goods_receipts` |
| CRCV | `PNGH` | `CustodyReceipt` (nhánh giữ hộ) | `custody_receipts` |
| CREL | `PXGH` | `CustodyRelease` (trả hàng giữ hộ cho NCC) | `custody_releases` |
| REV | `PĐN` | `StockReversal` (đảo phiếu nhập/giữ hộ) | `stock_reversals` |
| TO | `LCV` | `TransferOrder` (`header.taskKind = 'RELOCATE'`) | `transfer_orders` |

### API theo thứ tự quy trình

Tất cả có tiền tố `/api` ([app.js](../../../src/app.js), [routes.js](../../../src/routes.js)).

| Bước | Method & path | Hàm service | File |
|---|---|---|---|
| 1 | `POST /replenishments` | `createReplenishment` | [replenishment.commands.js:379](../../../src/modules/replenishments/replenishment.commands.js) |
| 1b | `PUT /replenishments/:id` | `updateReplenishment` | [replenishment.commands.js:406](../../../src/modules/replenishments/replenishment.commands.js) |
| 2 | `POST /replenishments/:id/submit` | `submitReplenishment` | [replenishment.commands.js:438](../../../src/modules/replenishments/replenishment.commands.js) |
| 3 | `POST /replenishments/:id/review` | `reviewReplenishment` | [replenishment.commands.js:463](../../../src/modules/replenishments/replenishment.commands.js) |
| 4 | `POST /purchase-orders` | `createPurchaseOrder` | [purchase-order.commands.js:142](../../../src/modules/purchase-orders/purchase-order.commands.js) |
| 5 | `POST /purchase-orders/:id/confirm` | `confirmPurchaseOrder` | [purchase-order.commands.js:230](../../../src/modules/purchase-orders/purchase-order.commands.js) |
| 6 | `POST /purchase-orders/:id/inspections` | `createInspection` | [goods-inspection.service.js:117](../../../src/modules/goods-inspections/goods-inspection.service.js) |
| 6b | `PUT /goods-inspections/:id` | `updateInspection` | [goods-inspection.service.js:161](../../../src/modules/goods-inspections/goods-inspection.service.js) |
| 7 | `POST /goods-inspections/:id/confirm` | `confirmInspection` | [goods-inspection.service.js:189](../../../src/modules/goods-inspections/goods-inspection.service.js) |
| 8 | `POST /goods-receipts/purchase/:id/post` | `postReceipt` | [purchase-receipt.service.js:18](../../../src/modules/goods-receipts/purchase-receipt.service.js) |
| 9a | `GET /goods-receipts/purchase/:id` | `getDocument` → `enriched` | [purchase-read.service.js:136](../../../src/modules/po-receiving/purchase-read.service.js), [enriched:61](../../../src/modules/po-receiving/purchase-read.service.js) |
| 9b | `GET /location-movements/options?warehouseId=…` | `locationMovementOptions` | [location-movement.service.js:103](../../../src/modules/location-movements/location-movement.service.js) |
| 9 | `POST /location-movements` | `createLocationMovement` | [location-movement.service.js:71](../../../src/modules/location-movements/location-movement.service.js) |
| 9c | `PATCH /location-movements/:id` · `POST /location-movements/:id/cancel` | `editLocationMovement` · `cancelLocationMovement` | [location-movement.service.js:120](../../../src/modules/location-movements/location-movement.service.js), [:130](../../../src/modules/location-movements/location-movement.service.js) |
| 10 | `POST /location-movements/:id/confirm` | `confirmLocationMovement` | [location-movement.service.js:140](../../../src/modules/location-movements/location-movement.service.js) |

**Cách tổ chức router sau đợt tách module ngày 25/11/2026:**
- **Bước 4–5 (PO):** [purchase-order.routes.js](../../../src/modules/purchase-orders/purchase-order.routes.js) gom cả route đọc và lệnh (đã xóa `purchase-order.commands.routes.js`), qua [purchase-order.validation.js](../../../src/modules/purchase-orders/purchase-order.validation.js) → [purchase-order.controller.js](../../../src/modules/purchase-orders/purchase-order.controller.js) → `purchase-order.service.js` (đọc) hoặc `purchase-order.commands.js` (lệnh).
- **Bước 6, 6b, 7 (Kiểm nhận):** tách hẳn sang module [goods-inspections/](../../../src/modules/goods-inspections/). File [goods-inspection.routes.js](../../../src/modules/goods-inspections/goods-inspection.routes.js) xuất hai router: `purchaseOrderInspectionRouter` (gắn vào `/purchase-orders` cho bước 6 và `GET /:id/inspection-context`) và `inspectionRouter` (gắn vào `/goods-inspections` cho bước 6b–7, hủy nháp, sửa kết quả kiểm), đi qua `goods-inspection.validation.js` → `goods-inspection.controller.js` → `goods-inspection.service.js` / `goods-inspection.correction.js`.
- **Bước 8 (Phiếu nhập mua):** `receiptRouter` nằm trong [purchase-receipt.routes.js](../../../src/modules/goods-receipts/purchase-receipt.routes.js), được [goods-receipt.routes.js](../../../src/modules/goods-receipts/goods-receipt.routes.js) gắn vào `/goods-receipts/purchase`, đi qua `purchase-receipt.validation.js` → `purchase-receipt.controller.js` → `purchase-receipt.service.js` (riêng preflight/đảo gọi sang `stock-reversal.service.js`).
- **Tầng đọc, hàng đợi & bằng chứng chung:** [po-receiving/](../../../src/modules/po-receiving/) chỉ còn giữ `purchaseReceivingRouter` (3 route đọc của PO: `receiving-summary`, `receiving-trips`, `receiving-operations/:key`), `queueRouter` (`/purchase-receiving/queue`) và `purchaseDocumentRouter` (`/purchase-documents/:id/history` và 4 route bằng chứng), cùng `purchase-read.service.js`, `purchase-evidence.service.js`, `purchase-reconciliation.js`.
- **Giữ hộ NCC & Đảo phiếu:** tách sang [custody/](../../../src/modules/custody/) (`custodyRouter` ở `/custody-receipts`, `custodyReleaseRouter` ở `/custody-releases`) và [stock-reversals/](../../../src/modules/stock-reversals/) (`reversalRouter` ở `/stock-reversals`).
- **Bước 9–10 (Chuyển vị trí BF03):** [location-movement.routes.js](../../../src/modules/location-movements/location-movement.routes.js) với `checkPermission` riêng (`stock_relocation:read/create/confirm`); controller ([location-movement.controller.js](../../../src/modules/location-movements/location-movement.controller.js)) gọi trực tiếp [location-movement.service.js](../../../src/modules/location-movements/location-movement.service.js) (đã bỏ `location-movement.lifecycle.js`).

Các route có quyền cố định thường đi qua `authenticate → checkPermission → validate → controller → service`. Service chọn quyền theo từng trường hợp cho route RR có quyền động, route bằng chứng và route đọc phiếu nhập gộp. Ba router gắn dưới `/purchase-orders` dùng cùng cờ `AUTHENTICATED` để tránh nạp lại `User` trong tầng route. Xem 2.0 và 2B.7.

Vai trò thực hiện theo seed quyền ([permissions.data.js](../../../src/seeds/data/permissions.data.js)): Sales và Thủ kho lập/sửa/gửi RR; Owner duyệt RR; Kế toán lập, phát hành, đổi ngày, chốt thiếu, mở lại, hủy PO và quyết định xử lý hàng giữ hộ (`purchase_custody:decide`); Thủ kho kiểm nhận, ghi nhập, đảo phiếu, thực hiện xử lý giữ hộ (`purchase_custody:execute`) và chuyển vị trí.

> **Đã gỡ (17/11/2026):** `GET /goods-receipts/purchase/:id/putaway-context`, `POST /goods-receipts/purchase/:id/putaway-tasks`, toàn bộ `/api/putaway-tasks` và hàng đợi `stage=AWAITING_PUTAWAY` của `/purchase-receiving/queue`. File `purchase-putaway.service.js` (gồm `createPutaway`, `confirmPutaway`, `placementQuantities`, `linePortionIds`) không còn. Quyết định ghi tại [change_logs.md](../../change_logs.md) mục "17/11/2026 - Chuyển hàng nhập mua bằng BF03".

---

# Phần 1 — Bức tranh tổng quan & bản đồ MongoDB Models

## 1.1. Luồng đi từ đầu đến cuối (End-to-End Flow)

1. **Lập RR (nháp hoặc gửi luôn).** Nhân viên kho/Sales chọn kho, ngày cần hàng, lý do và từng dòng sản phẩm + đơn vị + số lượng. Server quy đổi số lượng sang **đơn vị gốc** (`qtyBase`), tự đánh giá tồn khả dụng, RR đang mở, PO đang về và tồn ở kho khác. Nếu có cảnh báo, người lập phải xác nhận "vẫn cần" kèm giải trình. RR được lưu `DRAFT` (hoặc `SUBMITTED` nếu `action = 'SUBMIT'`), `version = 1`.
2. **Sửa RR** (chỉ người lập, chỉ khi `DRAFT`, chưa có PO). Mỗi lần sửa tăng `version`.
3. **Gửi duyệt RR.** Server đánh giá lại từng dòng theo dữ liệu mới nhất, rồi chụp **ảnh bất biến** (`submissions[]`) gồm kho, sản phẩm, đơn vị, hệ số quy đổi, số lượng. Trạng thái → `SUBMITTED`.
4. **Owner duyệt RR.** Người duyệt phải khác người lập. Với `APPROVE`, xét mọi dòng và gửi lượng gốc `approvedQtyBase` cho từng dòng. Giảm lượng cần lý do riêng trên dòng. Dòng thùng chỉ duyệt lượng tương ứng số thùng nguyên. Quyết định được ghi vào `approval_history`. Owner chỉ chọn duyệt (`APPROVE`) hoặc từ chối có lý do (`REJECT`); RR chuyển sang `APPROVED` hoặc `REJECTED`. Từ 22/11/2026 không còn quyết định `REVISE` / trạng thái `REVISION_REQUIRED`.
5. **Lập PO từ RR đã duyệt.** Mỗi dòng PO trỏ về một dòng RR và quyết định duyệt còn hiệu lực. Kế toán có thể đổi đơn vị bằng `uomCode`. Chỉ đơn vị thùng được vượt lượng duyệt với số thùng nguyên nhỏ nhất đủ phủ lượng duyệt. Chỉ mục duy nhất giữ một PO còn hiệu lực cho mỗi RR. PO lưu `DRAFT`.
6. **Phát hành PO.** Kiểm lại RR vẫn `APPROVED` cùng revision, sản phẩm/NCC/kho còn hoạt động. PO → `OPEN`.
7. **Hàng đến – lập phiếu kiểm nhận.** Thủ kho ghi thời điểm đến, người giao, rồi từng dòng: dòng PO, **lô thực nhận**, số đếm (theo thùng nguyên hoặc đơn vị gốc), chất lượng (`GOOD/DAMAGED/PENDING/BLOCKED`), quyết định sở hữu (`ACCEPT/CUSTODY/REJECT`), tình trạng bao bì. Server "chạm" `updatedAt` của PO (không đổi `version`) để lệnh hủy PO chạy song song phải xung đột, rồi tạo cùng lúc `GoodsArrival` + `GoodsInspection` ở `DRAFT`. Chưa có tồn kho.
8. **Xác nhận kiểm nhận.** Server kiểm tổng lượng `ACCEPT` không vượt phần PO còn được nhận; bắt buộc chọn **vị trí RECEIVING** cho mỗi dòng `ACCEPT`. Sinh **Phiếu nhập mua `DRAFT`** cho phần `ACCEPT`, sinh **Phiếu giữ hộ** cho phần `CUSTODY`. Kiểm nhận → `CONFIRMED`, Hàng đến → `RECORDED`.
9. **Ghi tồn phiếu nhập mua.** Server khóa kho và các vị trí, đối chiếu lại nguồn kiểm nhận, tìm/tạo `stock_holding_points` + `inventory_balances` (chủ hàng `STORE`, chất lượng `GOOD`), cộng tồn, tách **kiện** (`packagingPortions`: thùng nguyên `SEALED` / hàng lẻ `LOOSE`/`OPEN`), ghi `stock_transactions` (`PURCHASE_RECEIPT`), kiểm sức chứa. Phiếu → `POSTED`. PO → `PARTIAL` nếu còn lượng phải giao; hết lượng phải giao thì `COMPLETED`, hoặc `CLOSED` (kèm `closedAt`) nếu có dòng đã chốt thiếu (quyết định 23/11/2026).
10. **Lập lệnh chuyển vị trí (BF03).** Chi tiết phiếu nhập đã ghi trả `receivingBalanceId` cho từng dòng và `capabilities.relocate`. Nút **Chuyển vị trí** mở form BF03 với kho và số dư ở bãi tiếp nhận. Thủ kho chọn số dư nguồn (kèm `sourceBalanceVersion`), vị trí đích, đơn vị và **số nguyên** thùng/viên, ghi lý do. Chế độ "Thùng nguyên + viên rời" tách một hàng trên form thành tối đa hai dòng `packagingState: 'SEALED'` và `'LOOSE'` cùng nguồn, đích. Số dư tại vị trí đang có khóa kiểm kê `LOCKED` không được đưa làm nguồn (mọi vai trò; kiểm kê mù đã bỏ từ 22/11/2026). Server tạo `TransferOrder` `taskKind: 'RELOCATE'` ở `OPEN`. Chưa di chuyển tồn; lượng trên lệnh mở được tính là "đang chờ" nên lệnh khác không lấy chồng được. Người lập có thể sửa hoặc hủy lệnh.
11. **Xác nhận thực chuyển.** Chỉ **người lập lệnh** được xác nhận. Có thể xác nhận một phần (`PARTIAL`) rồi xác nhận tiếp. Server kiểm số dư nguồn chưa bị ai đổi, khóa kho/vị trí, chuyển tồn bằng `moveStock`, ghi `StockTransaction` `operation: 'RELOCATE'`, kiểm sức chứa. Đủ mọi dòng ⇒ `CONFIRMED`. Hàng ở ô `STORAGE` có `isPickable` được tính vào tồn khả dụng.
12. **Mọi bước** trả về một "biên nhận" `{ id, version, workflowStatus, operationId, resultRefs, replayed }`. Gửi lại cùng `operationKey`/`creationKey` và cùng payload sẽ nhận lại đúng biên nhận cũ (`replayed: true`) thay vì làm lại.

### Sơ đồ trạng thái

```text
RR : DRAFT ─submit─► SUBMITTED ─review─► APPROVED │ REJECTED   (cancel khi chưa có PO ─► CANCELLED)
PO : DRAFT ─confirm─► OPEN ─post GR một phần─► PARTIAL ─post GR đủ─► COMPLETED
     OPEN/PARTIAL ─hết lượng phải giao và có lượng chốt thiếu─► CLOSED
     DRAFT/OPEN ─cancel nếu đủ điều kiện─► CANCELLED
PO CLOSED còn lượng chưa nhận (sau đảo GR) ─reopen─► PARTIAL │ OPEN
ARR: DRAFT ─confirm INS─► RECORDED   (hủy INS nháp ─► CANCELLED)
INS: DRAFT ─confirm─► CONFIRMED      (hủy nháp ─► CANCELLED)
GR : DRAFT ─post─► POSTED ─reverse─► REVERSED   (hủy nháp ─► CANCELLED)
CRCV (giữ hộ NCC): DRAFT ─post─► POSTED ─reverse─► REVERSED   (hủy nháp ─► CANCELLED)
CREL (trả giữ hộ): DRAFT ─post─► POSTED
REV (phiếu đảo)  : tạo thẳng ở POSTED trong cùng giao dịch đảo
PO sau khi đảo GR: về PARTIAL nếu còn lượng đã nhận, ngược lại OPEN; PO CLOSED giữ nguyên (Kế toán mở lại bằng reopen)
TO : OPEN ─confirm thiếu─► PARTIAL ─confirm đủ─► CONFIRMED   (cancel khi OPEN/PARTIAL ─► CANCELLED; sửa chỉ khi OPEN)
```

### Bản đồ nhánh: luồng phụ gắn vào luồng chính ở đâu

```text
Lập RR ──► Gửi ──► Duyệt ──► Lập PO ──► Phát hành ──► Kiểm nhận ──► Xác nhận kiểm ──► Ghi nhập ──► Chuyển vị trí ──► Xác nhận chuyển
  │         │        │         │           │              │               │                 │              │
  │         │        │         │           │              │               ├─ ACCEPT ─► PNM  │              ├─ sửa / hủy lệnh (2.14)
  ├─ sửa (2.2)       │         ├─ sửa PO (2B.3.1)         ├─ sửa (2.8)    ├─ CUSTODY ─► PNGH ─► nhánh giữ hộ (2B.8)
  ├─ rút / hủy RR (2B.2.5)     ├─ hủy PO (2B.3.5) ──► RR lập được PO mới    ├─ REJECT ─► chỉ còn trên phiếu kiểm
  │                  │         │           ├─ đổi ngày giao (2B.3.2)        │                 │
  │                  └─ REJECT ─► REJECTED  ├─ chốt thiếu (2B.3.3)            ├─ hủy kiểm nháp (2B.4.3)
  │                            │           │                                 ├─ sửa kết quả kiểm đã xác nhận (2B.5)
  │                            │           │                                 │                 ├─ hủy phiếu nhập nháp / đổi bãi (2B.4.3, 2B.4.4)
  │                            │           │                                 │                 └─ đảo phiếu nhập (2B.6) ──► PO CLOSED? ─► mở lại (2B.3.4)
  └─ bằng chứng đính kèm cho PO, kiểm nhận, phiếu nhập, giữ hộ, lệnh chuyển (2B.7)
```

### Chuỗi liên kết chứng từ (`sources[]`)

```text
PO.items[j]  ──requestItemId─────────────────────► RR.items[i]
ARR.items[k] ──purchaseOrderItemId───────────────► PO.items[j]
INS.items[k] ──details.inspectedSourceLineId─────► ARR.items[k]
GR.items[m]  ──inspectionResultId────────────────► INS.items[k]
GR.items[m]  ──purchaseOrderItemId───────────────► PO.items[j]

PURCHASE_RECEIPT movement ──sourceLineId─────────► GR.items[m]
PURCHASE_RECEIPT movement ──toBalanceId──────────► InventoryBalance tại RECEIVING
TO(RELOCATE).items[n] ──details.sourceBalanceId──► InventoryBalance tại RECEIVING
```

Lệnh chuyển vị trí lấy hàng theo `sourceBalanceId`. Cùng bãi tiếp nhận, lô, chất lượng và chủ hàng có thể gộp nhiều phiếu nhập vào một số dư. Vì vậy, gặp một lệnh BF03 trên cùng số dư chỉ xác định được nguồn tồn dùng chung. Khi cần kiểm tra đảo một phiếu cụ thể, xem các kiện của bút toán gốc ở 2B.6.

Các phiếu mua và nhận hàng lưu `sources[]` cấp chứng từ và cấp dòng ở những nơi cần liên kết nghiệp vụ. `sourceLink` ghi `documentId`, `subjectCollection`, `relationCode` và thêm `itemId`, `linkedQty` khi có dòng và lượng nguồn. [document-copy.js](../../../src/shared/utils/document-copy.js)

## 1.2. Các MongoDB Models tham gia

| Tên Model (collection) | Hành động | Mục đích nghiệp vụ trong quy trình |
|---|---|---|
| `User` (`users`) | Find + Populate `roleId.permissionIds` | Nạp lại vai trò, quyền và kho được gán **ở mỗi lệnh**, không tin token cũ. |
| `Warehouse` (`warehouses`) | Find / exists / `findOneAndUpdate($inc stockOperationVersion)` | Kho phải `isActive`; `code` dùng để cấp mã phiếu; `stockOperationVersion` tăng ở mọi lệnh ghi tồn để tuần tự hóa theo kho. |
| `Product` (`products`) | Find / exists | Sản phẩm phải `isActive`; `baseUnit`, `wholeBaseUnits` (chỉ nhận số nguyên đơn vị gốc), `stockThresholds` (định mức theo kho). |
| `Uom` (`uoms`) | Find / exists | Đơn vị nhập; `isCarton` (là đơn vị thùng), `areaMm2` (đơn vị diện tích như m²). |
| `Conversion` (`conversions`) | Find (sort `validFrom`) / Aggregate | Hệ số quy đổi `basePerUnit` theo sản phẩm, đơn vị, (tùy chọn) lô. |
| `ProductBatch` (`product_batches`) | Find / Update (`updatedAt`) | Lô phải `VERIFIED`; `piecesPerCarton` và kích thước thùng; khóa định danh lô khi đưa vào chứng từ. |
| `ReplenishmentRequest` (`replenishment_requests`) | Create / Find / Update | Chứng từ RR, dòng hàng, ảnh gửi duyệt, lượng duyệt. |
| `ApprovalHistory` (`approval_history`) | Create / Find | Quyết định duyệt RR bất biến. PO đọc `itemDecisions[].approvedQtyBase` để giới hạn lượng. |
| `SalesOrder`, `WarehouseIssueRequest`, `Stocktake`, `StocktakeSnapshot` | Find / exists | Chỉ khi dòng RR có nguồn `SALES_SHORTAGE` hoặc `STOCKTAKE_LOW_STOCK`. |
| `PurchaseOrder` (`purchase_orders`) | Create / Find / Update / exists | Đơn mua; trạng thái theo lượng đã nhập. |
| `Supplier` (`suppliers`) | Find / exists | NCC phải `ACTIVE`; chụp `supplierSnapshot`. |
| `GoodsArrival` (`goods_arrivals`) | Create / Update / Find | Hồ sơ hàng đến: thời điểm, người giao, dòng thực nhận theo lô. |
| `GoodsInspection` (`goods_inspections`) | Create / Update / Find | Kết quả kiểm: chất lượng, quyết định sở hữu, bao bì, bãi tiếp nhận. |
| `PurchaseReceipt` (`goods_receipts`, `documentKind: 'PURCHASE'`) | Create / Update / Find | Phiếu nhập mua – chứng từ duy nhất làm tăng tồn sở hữu của cửa hàng. |
| `CustodyReceipt` (`custody_receipts`) | Create | Nhánh hàng `CUSTODY` (giữ hộ NCC), không cộng vào tồn của cửa hàng. |
| `WarehouseLocation` (`warehouse_locations`) | Find / `findOneAndUpdate($inc operationVersion)` | Kiểm vị trí đúng kho, đúng loại (`RECEIVING`, `STORAGE`…); tăng `operationVersion` để khóa vị trí trong transaction. |
| `StocktakeLocationLock` (`stocktake_location_locks`) | exists / Find | Vị trí đang kiểm kê thì không được ghi tồn, không tính tồn khả dụng. |
| `StocktakeCount` (`stocktake_counts`) — đọc | exists | Đảo phiếu nhập bị chặn nếu vị trí đã có lượt đếm kiểm kê sau thời điểm nhập (2B.6). Kiểm kê mù (`blindCountScope`) đã bị gỡ ngày 22/11/2026. |
| `StockReversal` (`stock_reversals`) | Create / Find | Phiếu đảo `PĐN-...` của phiếu nhập mua hoặc giữ hộ (2B.6). |
| `CustodyRelease` (`custody_releases`) | Create / Update / Find | Phiếu trả hàng giữ hộ cho NCC `PXGH-...` (2B.8). |
| `Attachment` (`attachments`) | Create / Update / Find | Tệp bằng chứng `PURCHASE_EVIDENCE` (2B.7). |
| `SupplierReturn` (`supplier_returns`) — đọc | Find | Chặn sửa kết quả kiểm khi có phiếu trả NCC trỏ về phiếu kiểm (2B.5); tính lượng còn trả được của phiếu giữ hộ. |
| `StockHoldingPoint` (`stock_holding_points`) | Find / Create | "Điểm giữ hàng" 1-1 với vị trí (`type: 'LOCATION'`). |
| `InventoryBalance` (`inventory_balances`) | Find / Create / `updateOne` theo `version` | Số dư tồn theo khóa (điểm giữ hàng × lô × chất lượng × chủ hàng) và các kiện. Bước 9 chọn nguồn theo `_id` và `version` của số dư. |
| `StockReservation` (`stock_reservations`) | Find (Update/Create khi chuyển giữ hàng) | Tính phần tồn đã giữ cho đơn bán. |
| `DefectReport` (`defect_reports`) | Find | Tính phần tồn đang bị chặn (`holds`). |
| `TransferOrder` (`transfer_orders`) | Create / Find / Update | Lệnh chuyển vị trí (`taskKind: 'RELOCATE'`). Lệnh `OPEN/PARTIAL` chiếm tồn "đang chờ". |
| `User` (`users`) — đọc | Find | Tên người thực hiện trong chi tiết lệnh chuyển (`performedByName`). |
| `Uom`, `Conversion` — đọc | Find | Danh sách đơn vị và quy đổi cho form BF03 (`locationMovementOptions`). |
| `StockTransaction` (`stock_transactions`, nhúng `movements[]`) | Create / Find | Sổ cái tồn kho append-only; mỗi movement ghi trước/sau của từng balance. |
| `OperationRecord` (`operation_records`) | Create / Find | Biên nhận idempotency của mỗi lệnh. |
| `AuditLog` (`audit_logs`) | Create | Nhật ký ai làm gì, version trước/sau. |
| `SystemEvent` (`system_events`) | Create | Outbox sự kiện `BUSINESS_NOTIFICATION` để gửi thông báo sau. |

### Schema then chốt (rút gọn)

```js
// --- MONGOOSE SCHEMAS (trích) ---
// Dòng hàng dùng chung: src/models/document-item.schema.js
{ lineNo, lineKind, productId: ref('Product'), lotId: ref('Lot'),
  enteredUnit, baseUnitSnapshot, baseUnitsPerUnit /*Decimal, scale 12*/,
  packagingSnapshot, enteredQty, qtyBase /*Decimal*/, productNameSnapshot,
  sources: [DocumentSource] }
// rule: enteredQty × baseUnitsPerUnit == qtyBase (hoặc làm tròn lên số nguyên khi đơn vị diện tích)

// RR: src/models/replenishment-request.model.js
{ _id: 'YCBS-...', documentNo, workflowStatus, version, createdBy,
  header: { warehouseId, neededOn, triggerReason, creationKey, submittedBy, submittedAt,
            approvedRevision, latestDecisionId: ref('ApprovalHistory') },
  items: [ DocumentItem + { approvedQtyBase, details: ReplenishmentDetails } ],
  submissions: [ { documentVersion, warehouseCodeSnapshot, lines: [...] } ] }

// PO: src/models/purchase-order.model.js
{ header: { warehouseId, supplierId, expectedOn, approvedRequestRevision, issuedAt, supplierSnapshot },
  items: [ DocumentItem + { unitPurchasePrice, lineAmount, requestItemId, cancelledRemainderQtyBase } ],
  replenishmentRequestId /*unique partial*/, totalAmount, currency }

// INS dòng: lineKind 'INSPECTION', details = src/models/inspection-details.schema.js
{ inspectedSourceLineId, qualityCode, ownershipDecision: 'ACCEPT'|'CUSTODY'|'REJECT',
  receivingLocationId, inspectedBy, inspectedAt, packagingCondition }

// GR dòng: src/models/goods-receipt.model.js
{ purchaseOrderItemId, arrivalItemId, inspectionId, inspectionResultId, destinationLocationId, custodyBalanceId }

// Tồn: src/models/inventory-balance.model.js — unique(holdingPointId, batchId, qualityStatus, ownerType, ownerId)
{ holdingPointId, batchId, qualityStatus, ownerType: 'STORE'|'SUPPLIER'|'CUSTOMER', ownerId,
  quantityBase, version, packagingPortions: [ { packagingState: 'SEALED'|'OPEN'|'LOOSE',
  sealedPackCount, quantityBase, packagingSnapshot, measuredVolumeMm3,
  volumeUpperBoundMm3 /*cận trên thể tích khi thùng bị mở lúc xuất*/ } ] }

// Sổ cái: src/models/stock-transaction.model.js — unique(sourceId, operation, eventKey), unique(requestKey)
{ sourceType, sourceId, operation, eventKey, requestKey, requestHash, performedBy,
  movements: [ { sourceLineId, fromBalanceId, toBalanceId, quantityBase,
                 fromBefore, fromAfter, toBefore, toAfter, packagingPortionIds } ] }

// Lệnh chuyển vị trí: src/models/transfer-order.model.js — header.taskKind 'RELOCATE', header.reason, stockTransactionId
// dòng: lineKind 'WAREHOUSE_TASK', details = src/models/warehouse-task-details.schema.js
{ fromLocationId, toLocationId, qualityCode, sourceBalanceId, sourceBalanceVersion,
  packagingState /*'SEALED'|'LOOSE', tùy chọn, không mặc định; lệnh cũ không có*/ }
// (service còn ghi thêm ownerType, ownerId vào details)
```

Ghi chú: `ref()` của Mongoose chỉ là khai báo, **MongoDB không kiểm khóa ngoại**. Toàn bộ kiểm tra "dòng này thuộc phiếu kia" nằm trong service.

---

# Phần 2 — Giải phẫu chi tiết từng hàm (theo thứ tự thực thi)

## 2.0. Hạ tầng chung mà mọi lệnh đi qua

Mọi lệnh ghi (tạo RR, duyệt, lập PO, kiểm nhận, ghi tồn, cất hàng) đều có cùng khung: **route (`authenticate` → `checkPermission` nếu quyền cố định) → `validate(zod)` → controller → service → `command()` → `transaction()` → `work(session, actor)`**. Đọc kỹ phần này một lần, các phần sau chỉ nói phần `work` riêng.

### Hàm: `respondWithData(getData)` và file controller

[catchAsync.js](../../../src/shared/utils/catchAsync.js). Thêm ngày 25/11/2026.

- **Vai trò:** controller của PO, nhận hàng và phiếu nhập chung chỉ là một dòng: lấy `req.user` và `req.validated`, gọi service, trả `{ data }` với HTTP 200.

```js
export const respondWithData = (getData) =>
  catchAsync(async (req, res) => {
    const data = await getData(req);
    formatApiResponse(res, { data });
  });

// src/modules/goods-receipts/purchase-receipt.controller.js:13
export const postPurchaseReceipt = respondWithData((req) =>
  service.postReceipt(req.user, req.validated.params.id, req.validated.body),
);
```

- `POST /purchase-orders` vẫn trả 200 (không phải 201 như RR). Controller RR ([replenishment.controller.js](../../../src/modules/replenishments/replenishment.controller.js)) không dùng hàm này vì phải phân biệt 201/200 khi replay.
- Kiểu Zod dùng chung cho lệnh nằm ở [command-validation.js](../../../src/shared/utils/command-validation.js): `empty`, `key` (khóa thao tác ≤ 160 ký tự), `ver` (`expectedVersion`), `qty` (thập phân dương), `reason`, `evidenceIds`, `optionalEvidenceIds`, `pagination`, `commandBody = { expectedVersion, operationKey }` và `schema(body, params, query)` (mặc định `params = { id: documentIdentifier }`). Các schema dùng chung riêng cho nhóm nhận mua (`optionalText`, `paged`, `documentListQuery`, `reversalBody`, `portion`, `packaging`, `getDocumentSchema`, `receivingHistorySchema`, `reversalPreflightSchema`) nằm ở [purchase-validation.js](../../../src/shared/utils/purchase-validation.js).

### Bốn tiện ích dùng chung của cụm mua/nhận hàng và sơ đồ phụ thuộc (tách 25/11/2026)

Trước 25/11/2026, `po-receiving` chứa cả kiểm nhận, phiếu nhập mua, giữ hộ, đảo phiếu, bằng chứng và tầng đọc (~1.500 dòng), đồng thời import chéo với `purchase-orders`. Sau khi tách theo loại chứng từ, phần lõi dùng chung được đẩy xuống `src/shared/utils/` với nguyên tắc **một chiều** (`shared/utils/` không bao giờ import `modules/`):

```text
  routes.js
    ├── /purchase-orders ──► purchase-orders ──┐
    │                        po-receiving      ├──► shared/utils/:
    │                        goods-inspections ┤      • purchase-core.js       (findPurchase, activePo, cancelDraft, purchaseOrderRef, evidenceFor)
    ├── /goods-inspections ─► goods-inspections ┤      • purchase-validation.js (portion, packaging, reversalBody, documentListQuery)
    ├── /goods-receipts/purchase ─► goods-receipts ┤   • intake-packaging.js    (intakePortions, checkPackagingLines)
    ├── /custody-receipts & /custody-releases ─► custody ┤ • evidence-storage.js (inspectFile, evidenceStorage: cloudinary | local)
    └── /stock-reversals ──► stock-reversals ──┘      • stock.js / document-command.js / conversions.js
```

**Ví dụ đường đi thực tế của một request `POST /api/purchase-orders/ĐMH-K01-261116-000001/inspections`:**
1. [routes.js:64-66](../../../src/routes.js) gắn 3 router lên `/purchase-orders`. Request đi qua `purchaseOrdersRouter` (`authenticate` chạy 1 lần, gắn `req[AUTHENTICATED] = true`, không khớp path → `next()`) → `purchaseReceivingRouter` (thấy `req[AUTHENTICATED]` nên bỏ qua `User.findById`, không khớp path → `next()`) → `purchaseOrderInspectionRouter` trong [goods-inspection.routes.js:19](../../../src/modules/goods-inspections/goods-inspection.routes.js) (khớp `POST /:id/inspections`).
2. Middleware `checkPermission('goods_receipt_inspection:create')` chạy **trước** `validate(createInspectionSchema)` → người thiếu quyền nhận `403` ngay cả khi body thiếu trường.
3. [goods-inspection.controller.js:25](../../../src/modules/goods-inspections/goods-inspection.controller.js) gọi `service.createInspection(req.user, req.validated.params.id, req.validated.body)`.
4. [goods-inspection.service.js:117](../../../src/modules/goods-inspections/goods-inspection.service.js) mở `command()` → `transaction()`, gọi `activePo()` từ [purchase-core.js:79](../../../src/shared/utils/purchase-core.js) để phân giải `ĐMH-...` thành `PurchaseOrder`, dựng dòng bằng `prepare()`, lưu `GoodsArrival` + `GoodsInspection`, ghi `OperationRecord` + `AuditLog` + `SystemEvent` rồi trả biên nhận qua `respondWithData`.

### Hàm: `validate(schema)` (middleware) và các schema Zod

- **Vai trò nghiệp vụ:** chặn payload sai hình dạng trước khi chạm DB. Mọi schema đều `.strict()` nên trường lạ bị từ chối. Số lượng truyền dưới dạng **chuỗi thập phân** (`decimalStringSchema`) để không mất độ chính xác.
- **Ví dụ dòng kiểm nhận** — [goods-inspection.validation.js:28](../../../src/modules/goods-inspections/goods-inspection.validation.js):

```js
const line = z.object({ id: oid.optional(), poLineId: oid, lotId: oid, enteredQty: qty,
  enteredUnit: z.string().trim().min(1).max(60).optional(),
  qualityCode: z.enum(['GOOD','DAMAGED','PENDING','BLOCKED']),
  ownershipDecision: z.enum(['ACCEPT','CUSTODY','REJECT']),
  packagingCondition: z.enum(PACKAGING_CONDITIONS), handlingNote: optionalText(2000),
  receivingLocationId: oid.optional() }).strict();
```

  `arrivedAt` còn bị chặn không được ở tương lai (`iso`, [goods-inspection.validation.js:23](../../../src/modules/goods-inspections/goods-inspection.validation.js)). Kết quả hợp lệ nằm ở `req.validated`.

### Hàm: `command(user, code, permission, targetId, input, authorizeReplay, work)`

[document-command.js:64](../../../src/shared/utils/document-command.js)

- **Vai trò nghiệp vụ:** "người gác cổng" của mọi lệnh: kiểm quyền, chống làm hai lần, ghi biên nhận + audit + sự kiện, tất cả trong cùng transaction với dữ liệu nghiệp vụ.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò & dữ liệu |
|---|---|---|
| `user` | User (từ JWT) | Người gọi; chỉ dùng `_id`, sẽ nạp lại từ DB. |
| `code` | string | Mã lệnh, vd `CREATE_REPLENISHMENT`, `POST_PURCHASE_RECEIPT`. |
| `permission` | string | Quyền bắt buộc, vd `goods_receipt_inspection:post`. |
| `targetId` | string \| null | Mã chứng từ đích (null khi tạo mới). |
| `input` | object | Body đã validate; phải có `operationKey` hoặc `creationKey`. |
| `authorizeReplay` | function | Hàm đọc lại chứng từ để kiểm phạm vi khi trả biên nhận cũ. |
| `work` | `(session, actor, operationId) => {document, ...}` | Phần nghiệp vụ riêng. |
| `requestKey` | string | Khóa client gửi (`operationKey`/`creationKey`). |
| `requestHash` | sha256 | Băm `{code, targetId, input}` — phát hiện "cùng khóa nhưng khác nội dung". |
| `operationKey` | sha256 | Băm `{actor, code, requestKey}` — khóa unique trong `operation_records`. |
| `actor` | User đã populate | Người dùng **hiện tại** trong DB, kèm vai trò và quyền. |
| `prior` | OperationRecord \| null | Biên nhận cũ nếu lệnh đã chạy rồi. |
| Giá trị trả về | `receipt(operation, replayed)` | `{ id, version, workflowStatus, operationId, decisionId?, resultRefs, replayed }`. |

- **Tương tác DB:** `User.findById().populate({ path: 'roleId', populate: { path: 'permissionIds' } })`; `OperationRecord.findOne/save`; `AuditLog.save` (qua `appendAudit`); `SystemEvent.save`. Tất cả dùng chung `session`.
- **Logic từng bước:**

  1. Bắt buộc có khóa thao tác, tính hai mã băm:

  ```js
  const requestKey = input.operationKey ?? input.creationKey ?? input.idempotencyKey;
  if (typeof requestKey !== "string" || !requestKey.trim())
    throw operationConflict("Thiếu mã thao tác");
  const requestHash = hash({ code, targetId: targetId ? String(targetId) : null, input });
  const operationKey = hash({ actor: String(user._id), code, requestKey });
  ```

  *Tại sao:* mạng chập chờn khiến client bấm lại. Cùng người + cùng lệnh + cùng khóa ⇒ cùng `operationKey`. Nếu payload khác (`requestHash` khác) thì đó là lỗi của client, trả 409 thay vì âm thầm làm khác đi.

  2. Trong transaction: nạp lại người dùng, kiểm quyền, tìm biên nhận cũ:

  ```js
  const actor = await User.findById(user._id)
    .populate({ path: "roleId", populate: { path: "permissionIds" } })
    .session(session);
  requirePermission(actor, permission);
  const prior = await OperationRecord.findOne({ operationKey }).session(session);
  if (prior) return replay(prior, actor, session);
  ```

  *Tại sao:* quyền có thể bị thu hồi sau khi đăng nhập; kiểm theo DB tại thời điểm thực thi. Khi replay vẫn gọi `authorizeReplay` để đảm bảo người đó còn được xem chứng từ.

  3. Chạy `work`, rồi ghi biên nhận, audit, sự kiện (dòng 108–158). `subjectType` lấy từ `document.constructor.collection.name`, `resultCode` = `workflowStatus` mới.

  4. Bắt lỗi trùng khóa / commit không rõ kết quả:

  ```js
  if (error.code === 11000 || error.hasErrorLabel?.("UnknownTransactionCommitResult")) {
    ...
    const prior = await OperationRecord.findOne({ operationKey });
    if (prior) return replay(prior, actor);
  }
  throw error;
  ```

  *Tại sao:* hai request song song cùng khóa ⇒ một cái thắng, cái kia đụng unique index `operationKey`; lúc này đọc biên nhận của cái thắng và trả về như replay.

### Hàm: `transaction(work)`

[persistence.js:11](../../../src/shared/utils/persistence.js)

- **Vai trò:** mở MongoDB session, chạy `work` trong `withTransaction` với `readConcern: snapshot`, `writeConcern: majority` ([persistence.js:7](../../../src/shared/utils/persistence.js)).
- **Biến:** `session` (ClientSession, mang thêm `session.documentNumbers` là Map số phiếu đã cấp trong lần chạy), `attempt` (số lần thử lại do trùng mã phiếu, tối đa 20), `runs` (đếm số lần driver tự chạy lại callback).
- **Logic:**

  ```js
  return await session.withTransaction(() => {
    if (runs++) observePlanning("transaction_retry", { reason: "snapshot_conflict" });
    session.documentNumbers = new Map();
    return transactionContext.run(session, () => work(session));
  }, transactionOptions);
  ...
  if (error.code === 11000 && attempt < 20 && isDocumentId(error.keyValue?._id ?? error.keyValue?.documentNo)) { ... continue; }
  ```

  *Tại sao:* mã phiếu là `_id`. Hai giao dịch song song có thể cấp cùng số `...000007`; giao dịch thua bị lỗi 11000 trên `_id` ⇒ chạy lại toàn bộ giao dịch và cấp số mới. `withTransaction` tự chạy lại khi gặp `TransientTransactionError` (xung đột ghi), nên `work` phải **không có tác dụng phụ ngoài DB**.

### Hàm: `nextDocumentFields(Model, type, warehouseId, session)`

[document-number.js:29](../../../src/shared/utils/document-number.js)

- **Vai trò:** cấp mã phiếu tăng dần theo (loại, kho, ngày) mà **không có collection đếm**.
- **Biến:** `config` (`['YCBS','Yêu cầu bổ sung']`), `unit` (= `warehouse.code`), `period` (`YYMMDD` giờ Việt Nam), `patterns` (regex mã hiện tại và mã lịch sử có khoảng trắng), `codes` (mọi `_id` khớp tiền tố trong collection + trong `operation_records.subjectId`), `last`, `sequence`. Trả về `{ _id, documentNo }`.
- **Logic chính:**

  ```js
  if(!session?.inTransaction())throw validationError('Cấp mã phiếu phải nằm trong giao dịch');
  ...
  const query=path?{$or:[{[path+'._id']:numberFilter},{[path+'.documentNo']:numberFilter}]}:{_id:numberFilter};
  const rows=await Model.collection.find(query,{session,projection}).toArray();
  ...
  const history=await operations.find({subjectId:numberFilter},{session,projection:{subjectId:1}}).toArray();
  ...
  const sequence=Math.max(last,session.documentNumbers.get(scope)??0)+1;
  ```

  *Tại sao:* đọc cả `operation_records` để một phiếu đã bị xóa không bị cấp lại số (biên nhận vẫn giữ mã cũ). `session.documentNumbers` giúp một giao dịch cấp nhiều phiếu cùng loại (vd hai phiếu) không trùng số nhau. Với chứng từ **nhúng** (`embeddedPath`, vd phương án xử lý) hàm quét cả `_id` lẫn `documentNo` của phần tử nhúng; chứng từ gốc trong luồng này (RR, PO, HĐK, PKN, PNM, LCV) vẫn chỉ quét `_id`.

- `newBusinessDocument(Model, user, header, items, status)` ([document-number.js:78](../../../src/shared/utils/document-number.js#L78)) gói lại: lấy `warehouseId` từ header, gọi `nextDocumentFields`, tạo `new Model({ ..., workflowStatus: status, version: 1, createdBy, occurredAt, header, items })`. `newDocument()` trong [purchase-core.js:29](../../../src/shared/utils/purchase-core.js) là bí danh cho các chứng từ mua hàng.

### Hàm: `checkVersion(document, expectedVersion)` và `saveVersion(document, previousVersion, session)`

[document-command.js:20](../../../src/shared/utils/document-command.js), [document-command.js:35](../../../src/shared/utils/document-command.js)

- **Vai trò:** khóa lạc quan. Client gửi `expectedVersion` (version lúc mở màn hình). Nếu người khác đã sửa, trả 409 "Chứng từ đã thay đổi, hãy tải lại".
- **Logic `saveVersion`:**

  ```js
  document.version = previousVersion + 1;
  await document.validate();
  const plain = document.toObject();
  delete plain._id;
  const updated = await document.constructor.findOneAndUpdate(
    { _id: document._id, version: previousVersion },
    { $set: plain },
    { session, returnDocument: "after" },
  );
  if (!updated) throw versionConflict("Chứng từ đã thay đổi", previousVersion);
  ```

  *Tại sao:* điều kiện `version: previousVersion` trong filter là chốt chặn cuối cùng ở tầng DB. `validate()` chạy trước để các rule lồng (vd `qtyBase = enteredQty × hệ số`) được kiểm. Ghi đè **toàn bộ** document bằng `$set: plain`.
- Lưu ý: nhiều chỗ gọi `saveVersion(po, po.version, session)` **chỉ để tăng version** của chứng từ cha (PO, GR) — đây là kỹ thuật "chạm" để hai giao dịch song song trên cùng PO xung đột ghi và một trong hai phải chạy lại.

### Hàm: `requirePermission`, `requireWarehouseAccess`, `scopedDocument`

[access.js:14](../../../src/shared/utils/access.js), [access.js:34](../../../src/shared/utils/access.js), [document-command.js:27](../../../src/shared/utils/document-command.js)

- `requirePermission(user, perm)`: user phải `isActive`, có vai trò, và vai trò chứa quyền.
- `requireWarehouseAccess(user, warehouseId)`: Owner qua hết; vai trò khác phải có kho trong `user.warehouseIds`.
- `scopedDocument(Model, id, user, session)`: `findById` + kiểm kho của `header.warehouseId`; không thấy ⇒ 404.

Mục tiếp theo giải thích vì sao một số route RR có `checkPermission` còn một số route chỉ kiểm quyền trong service.

### Kiểm quyền: middleware `checkPermission` và hàm `requirePermission` trong service

Đối chiếu code ngày 25/11/2026 (nhánh `minhtd`, commit `5e7456e`).

**Câu hỏi thường gặp:** trong [replenishment.routes.js](../../../src/modules/replenishments/replenishment.routes.js), route `POST /`, `PUT /:id`, `POST /:id/submit`, `POST /:id/review` có `checkPermission(...)`. Năm route `POST /evaluate`, `POST /:id/cancel`, `GET /options`, `GET /options/lots`, `GET /options/sources` (dòng 12–28) thì không có. Trong `replenishment.commands.js` lại có `requirePermission(...)`. Vậy có phải mỗi chỗ tự viết một hàm kiểm quyền riêng không?

**Trả lời ngắn:** không. `checkPermission` và `requirePermission` cùng gọi một hàm lõi là `hasPermission`, nên luật quyền chỉ có một. Hai hàm chỉ khác **chỗ đặt** và **cách báo lỗi**. Route không gắn `checkPermission` vì quyền cần kiểm phụ thuộc dữ liệu của request, mà middleware chỉ nhận một chuỗi quyền cố định lúc khai báo route. Các route có `checkPermission` vẫn bị kiểm lại trong `command()` khi lệnh chạy trong transaction.

#### a. Các lớp kiểm tra một request RR đi qua

Theo thứ tự thực thi. Lớp sau không thay lớp trước; mỗi lớp chặn một loại sai khác nhau.

| # | Lớp | Hàm, file | Kiểm gì | Sai thì trả |
|---|---|---|---|---|
| 1 | Xác thực | `authenticate` ([auth.js:14](../../../src/middlewares/auth.js)) | JWT hợp lệ. Nạp `User` từ DB **ở mỗi request**, populate `roleId.permissionIds`. User phải `isActive` và có vai trò hợp lệ. Từ 25/11/2026, khi thành công hàm gắn `Symbol` riêng `AUTHENTICATED` vào `req`; router thứ hai, thứ ba cùng tiền tố (vd `/purchase-orders`, `/goods-receipts/purchase`) gặp cờ này thì bỏ qua, nên mỗi request chỉ gọi `User.findById` một lần ở tầng route. `command()` vẫn nạp lại `actor` trong transaction (lớp 5). | 401 `ERR-CORE-401-001` |
| 2 | Quyền cố định ở route | `checkPermission(perm)` ([permission.js:4](../../../src/middlewares/permission.js)) | Vai trò của `req.user` chứa đúng **một** quyền ghi sẵn trong route. | 403 `ERR-CORE-403-001` |
| 3 | Hình dạng payload | `validate(schema)` ([validate.js](../../../src/middlewares/validate.js)) | Body, query, params đúng schema Zod `.strict()`. | 400 |
| 4 | Quyền tính theo input | `requirePermission(user, perm)` ([access.js:14](../../../src/shared/utils/access.js)) gọi trong service | Quyền được **chọn** dựa trên `requestId`, `mode`, `type` hoặc vai trò người gọi. | 403 `ERR-CORE-403-001` |
| 5 | Quyền lúc ghi | `command()` ([document-command.js:91](../../../src/shared/utils/document-command.js)) | Nạp lại `actor` từ DB **trong transaction**, rồi `requirePermission(actor, permission)` (dòng 94). | 403 `ERR-CORE-403-001` |
| 6 | Phạm vi kho | `requireWarehouseAccess(user, warehouseId)` ([access.js:34](../../../src/shared/utils/access.js)) | Owner qua hết. Vai trò khác phải được gán kho. | 403 `ERR-CORE-403-002` |
| 7 | Phạm vi bản ghi | `readRequest(id, user, session)` ([replenishment.commands.js:41](../../../src/modules/replenishments/replenishment.commands.js)), `replenishmentScope(user)` ([replenishment.access.js:25](../../../src/modules/replenishments/replenishment.access.js)) | Kho của RR nằm trong phạm vi. Sales và Thủ kho chỉ thấy RR **mình lập**. | 404 `ERR-CORE-404-001` (không lộ RR có tồn tại) |
| 8 | Danh tính, trạng thái, phiên bản | trong `work` của từng lệnh | Người lập mới được sửa/gửi; người duyệt khác người lập; trạng thái đúng; chưa có PO; `checkVersion`. | 403, 400 hoặc 409 |

*Tại sao lớp 7 trả 404 thay vì 403:* nếu trả 403, người dùng đoán được mã RR nào đang tồn tại trong kho khác hoặc của người khác. Trả 404 giữ kín việc đó.

#### b. Ba hàm lõi

```js
// access.js:5 — luật quyền duy nhất
export function hasPermission(user, permission, roles = []) {
  const role = currentRole(user);
  return Boolean(user?.isActive && role && rolePermissions(user).includes(permission));
}

// permission.js:4 — dạng middleware Express, quyền cố định lúc khai báo route
const checkPermission = (requiredPermission) => (req, _res, next) => {
  if (!hasPermission(req.user, requiredPermission)) return next(forbiddenError());
  next();
};

// access.js:14 — dạng hàm gọi trong service, ném lỗi
export function requirePermission(user, permission, roles = []) {
  if (!hasPermission(user, permission, roles)) throw forbiddenError();
}
```

- `currentRole(user)` ([userRole.js](../../../src/shared/utils/userRole.js)) chỉ nhận vai trò đã populate và `isActive !== false`.
- `rolePermissions(user)` chỉ lấy quyền `isActive !== false` **và** có trong `PERMISSION_CATALOGUE` của [permissions.data.js](../../../src/seeds/data/permissions.data.js). Mã quyền gõ sai hoặc quyền đã tắt không bao giờ được tính.
- Tham số `roles` của `hasPermission`/`requirePermission` hiện không được dùng (Phần 3, điểm 37).

Vì cả hai dạng cùng gọi `hasPermission`, đổi luật quyền (vd thêm điều kiện) chỉ cần sửa một chỗ.

#### c. Bốn lý do RR kiểm quyền trong service

**Lý do 1 — quyền phụ thuộc dữ liệu của request.** `checkPermission("x")` nhận chuỗi `"x"` khi Express nạp file route, lúc đó chưa có request. Các route dưới đây phục vụ nhiều tình huống trên cùng một đường dẫn, mỗi tình huống cần một quyền khác:

| Route | Hàm | Quyền được chọn theo | Ví dụ |
|---|---|---|---|
| `GET /options` | `getReplenishmentOptions` ([:291](../../../src/modules/replenishments/replenishment.commands.js)) | `requestId` và `mode` | Có `requestId` (form sửa) ⇒ `:update`. `mode=CREATE` (form lập) ⇒ `:create`. `mode=FILTER` (bộ lọc danh sách) ⇒ `:read`. Owner không có `:create` nhưng vẫn mở được bộ lọc. |
| `GET /options/lots` | `getReplenishmentLotOptions` ([:351](../../../src/modules/replenishments/replenishment.commands.js)) | `requestId` | Có ⇒ `:update`, không có ⇒ `:create`. |
| `GET /options/sources` | `getReplenishmentSourceOptions` ([replenishment.sources.js:121](../../../src/modules/replenishments/replenishment.sources.js)) | `requestId` **và** `type` | Hai lần `requirePermission`: một quyền RR (`:update`/`:create`) và một quyền của module nguồn (`stocktake:read` khi `type=stocktakes`, còn lại `sales_order:read`). |
| `POST /evaluate` | `evaluateReplenishment` ([:217](../../../src/modules/replenishments/replenishment.commands.js)) | `input.requestId` | Có ⇒ `:read` (xem lại RR đã lưu), không có ⇒ `:create`. |
| `POST /:id/cancel` | `cancelReplenishment` ([:568](../../../src/modules/replenishments/replenishment.commands.js)) | vai trò người gọi | Owner ⇒ `:approve` (hủy RR đã duyệt). Người khác ⇒ `:update` (người lập rút RR chưa duyệt). |

Muốn đưa các trường hợp này lên route thì phải viết thêm một middleware nhận callback đọc `req.query`/`req.body`, tức là chuyển cùng logic sang chỗ khác mà không bớt được dòng nào, và tách logic quyền khỏi hàm dùng nó.

*Tại sao nguồn cần quyền của module khác:* quyền `replenishment_request:create` cho phép lập RR, không cho phép xem đơn bán hay đợt kiểm kê. Nếu không có lần `requirePermission` thứ hai, người có quyền RR đọc được danh sách đơn bán qua đường `/options/sources` dù vai trò của họ không có `sales_order:read`.

**Lý do 2 — `command()` kiểm lại quyền ngay lúc ghi.** `authenticate` nạp user ở đầu request. `command()` nạp lại user **bên trong transaction**, rồi mới kiểm quyền và chạy `work`:

```js
// document-command.js:91
const actor = await User.findById(user._id)
  .populate({ path: "roleId", populate: { path: "permissionIds" } })
  .session(session);
requirePermission(actor, permission);
```

- Lần kiểm này đọc cùng snapshot với dữ liệu nghiệp vụ mà lệnh sắp ghi. Nếu admin thu hồi quyền hoặc khóa tài khoản trong lúc request đang xử lý, hoặc transaction phải chạy lại (xung đột ghi, trùng mã phiếu), lần chạy lại sẽ thấy quyền mới.
- Mọi kiểm tra sau đó trong `work` dùng `actor` (bản mới) chứ không dùng `req.user`.
- Vì vậy route `POST /`, `PUT /:id`, `/submit`, `/review` có **hai** lớp: `checkPermission` chặn sớm (trước khi chạy Zod và mở transaction), `command()` chặn đúng lúc ghi. Hai lớp dùng cùng mã quyền nên không mâu thuẫn.
- Khi request lặp lại một `operationKey` đã chạy, `command()` vẫn kiểm quyền trước, rồi gọi `authorizeReplay` = `replay` ([replenishment.commands.js:56](../../../src/modules/replenishments/replenishment.commands.js)) = `readRequest`. Người đã mất quyền hoặc mất phạm vi kho không lấy lại được biên nhận cũ.

**Lý do 3 — service được gọi từ nhiều nơi, không chỉ qua HTTP.**

- `evaluateLines` ([replenishment.evaluation.js:325](../../../src/modules/replenishments/replenishment.evaluation.js#L325)) phục vụ ba lời gọi với ba quyền khác nhau, truyền qua `options.permission`:
  - `evaluateReplenishment` (xem trước): `:read` hoặc `:create`.
  - `items()` ([:136](../../../src/modules/replenishments/replenishment.commands.js)) khi lập/sửa RR: `:update` nếu có `requestId`, ngược lại `:create`.
  - `assessSavedRequest` ([:202](../../../src/modules/replenishments/replenishment.commands.js)) khi gửi duyệt: `:update`, kèm `strictSourceVersion: true`.
- Test integration gọi thẳng hàm service, không qua route. Nếu quyền chỉ nằm ở route, các lời gọi đó bỏ qua kiểm quyền.
- `readRequest` được dùng lại ở `getReplenishment`, `listReplenishmentSubmissions`, `getReplenishmentSubmission`, `requireEditableRequest` và làm `authorizeReplay`.

**Lý do 4 — nhiều điều kiện cần đọc bản ghi trước.** Middleware chỉ có `req.user` và payload. Các điều kiện sau phải đọc RR, PO hoặc kho từ DB, nên chỉ kiểm được trong service:

- Kho trong payload có được gán cho người gọi không (`requireWarehouseAccess`).
- RR thuộc kho nào, ai lập (`readRequest`).
- Người sửa/gửi là người lập; người duyệt khác người lập.
- RR đang `DRAFT`/`SUBMITTED`/`APPROVED`; đã có PO giữ `replenishmentRequestId` chưa.
- `expectedVersion` còn khớp không.

#### d. Từng hàm RR: kiểm gì, ở đâu, vì sao

Ký hiệu: **R** = `checkPermission` ở route, **S** = `requirePermission` trong service trước `command()`, **C** = `requirePermission` trong `command()`.

| Hàm | R | S / C | Kiểm thêm | Vì sao |
|---|---|---|---|---|
| `getReplenishmentOptions` | — | S: `:update` / `:create` / `:read` | Có `requestId` ⇒ `requireEditableRequest`. Danh sách kho lọc theo `isOwner` hoặc `user.warehouseIds`. | Một endpoint dùng cho form lập, form sửa và bộ lọc danh sách. |
| `getReplenishmentLotOptions` | — | S: `:update` / `:create` | `requireWarehouseAccess(warehouseId)`, `requireEditableRequest`, kho và sản phẩm còn hoạt động. | Lô chỉ cho người đang soạn RR, trong kho được gán. |
| `getReplenishmentSourceOptions` | — | S: quyền RR + `stocktake:read` hoặc `sales_order:read` | `requireEditableRequest`; Sales chỉ thấy đơn bán mình lập; kiểm kê lọc theo kho được gán. | Xem chứng từ nguồn là quyền của module khác. |
| `evaluateReplenishment` | — | S: `:read` / `:create`; `evaluateLines` kiểm lại cùng quyền | `readRequest` khi có `requestId`. `evaluateLines` gọi `requireWarehouseAccess(input.warehouseId)` và yêu cầu RR đang sửa thuộc kho được gán và do người gọi lập (Owner/Kế toán được qua), sai thì 400 "Phiếu đang sửa không thuộc phạm vi". | Xem trước không ghi DB nên không đi qua `command()`; kiểm trong service là lớp duy nhất. |
| `cancelReplenishment` | — | C: Owner `:approve`, người khác `:update` | Chưa có PO. `APPROVED` ⇒ chỉ Owner. `DRAFT`/`SUBMITTED` ⇒ chỉ người lập. Bắt buộc lý do. | Hai vai trò khác quyền dùng cùng một endpoint. |
| `listReplenishments` ([service:55](../../../src/modules/replenishments/replenishment.service.js)) | `:read` | S: `:read` | `replenishmentScope`: Owner mọi kho; vai trò khác kho được gán; Sales/Thủ kho chỉ RR mình lập. | Route chặn sớm; service tự bảo vệ khi bị gọi trực tiếp. |
| `getReplenishment` ([service:152](../../../src/modules/replenishments/replenishment.service.js#L152)) | `:read` | S: `:read` | `readRequest`. | Route chặn sớm; service tự bảo vệ khi bị gọi trực tiếp. |
| `listReplenishmentSubmissions`, `getReplenishmentSubmission` ([service:326](../../../src/modules/replenishments/replenishment.service.js#L326), [:344](../../../src/modules/replenishments/replenishment.service.js#L344)) | `:read` | S: `:read` | `readRequest`. | Như trên. |
| `createReplenishment` ([:379](../../../src/modules/replenishments/replenishment.commands.js)) | `:create` | C: `:create`; `items()` gọi `evaluateLines` với `:create` | `header()` gọi `requireWarehouseAccess`. Mỗi dòng có nguồn đi qua `resolveSource`, nơi `canReadRelated` ([replenishment.access.js:41](../../../src/modules/replenishments/replenishment.access.js)) đòi người lập đọc được chứng từ nguồn (đơn bán, yêu cầu xuất, kiểm kê) theo quyền module đó và phạm vi kho; không đọc được ⇒ 403. | Quyền cố định ⇒ có cả R và C. Gắn nguồn không được trở thành đường đọc chứng từ của module khác. |
| `updateReplenishment` ([:406](../../../src/modules/replenishments/replenishment.commands.js)) | `:update` | C: `:update`; `items()` gọi `evaluateLines` với `:update` | `readRequest`, `checkVersion`, người lập, `DRAFT`, chưa có PO; nguồn kiểm như khi lập. | Có quyền `:update` chưa đủ; chỉ sửa được RR của chính mình. |
| `submitReplenishment` ([:438](../../../src/modules/replenishments/replenishment.commands.js)) | `:update` | C: `:update`; `evaluateLines` kiểm lại `:update` | Người lập, `DRAFT`, `assessSavedRequest` với `strictSourceVersion`. | Như trên, thêm chặn nguồn đã đổi. |
| `reviewReplenishment` ([:463](../../../src/modules/replenishments/replenishment.commands.js)) | `:approve` | C: `:approve` | `readRequest`, `checkVersion`, người duyệt khác người lập, `SUBMITTED`, bắt buộc lý do. | Tách bạch trách nhiệm: không tự duyệt RR mình lập. |

#### e. Ví dụ: Sales bị gỡ quyền `replenishment_request:create`

Lấy từ test `RR lot options use RR permission and enforce creator and warehouse scope` ([backend-permissions.integration.test.js:240](../../../test/backend-permissions.integration.test.js)). Sales vẫn còn `:update` và có một RR nháp do mình lập.

| Request | Kết quả | Lý do |
|---|---|---|
| `GET /options?mode=CREATE` | 403 | Không có `requestId` ⇒ cần `:create`. |
| `GET /options/sources?type=saleorders` | 403 | Như trên. |
| `GET /options/sources?type=saleorders&requestId=<RR của mình>` | 200 | Có `requestId` ⇒ cần `:update` (còn) + `sales_order:read` (còn). |
| `GET /options?mode=CREATE&requestId=<RR của mình>` | 200 | Cần `:update`. |
| Sales khác gọi `GET /options?mode=CREATE&requestId=<RR đó>` | 404 | `requireEditableRequest` → `readRequest`: Sales không thấy RR người khác lập. |
| `GET /options/lots?...&requestId=<RR của mình>` | 200 | Cần `:update`. |

Cùng test: Kế toán (không có `:create`) gọi `/options/lots` ⇒ 403 `ERR-CORE-403-001`; Sales gọi `/options/lots` với kho không được gán ⇒ 403 `ERR-CORE-403-002`.

Nếu năm route trên gắn cứng `checkPermission("replenishment_request:create")`, Sales trong ví dụ này không mở được form sửa RR của chính mình. Nếu gắn `checkPermission("replenishment_request:read")`, người chỉ có quyền đọc lại mở được dữ liệu form lập.

#### f. Khi thêm route hoặc lệnh mới trong module RR

Theo cách code hiện tại:

1. Quyền **cố định** ⇒ gắn `checkPermission(perm)` ở route để chặn sớm. Nếu là lệnh ghi thì vẫn truyền cùng `perm` vào `command()`.
2. Quyền **phụ thuộc input hoặc vai trò** ⇒ không gắn `checkPermission`. Gọi `requirePermission` ở dòng đầu của hàm service, trước mọi truy vấn DB. Lệnh ghi thì tính `permission` trước rồi truyền vào `command()`, như `cancelReplenishment`.
3. Có `warehouseId` trong payload ⇒ `requireWarehouseAccess`. Có id chứng từ ⇒ đọc qua `readRequest` (hoặc `scopedDocument`), không `findById` trần.
4. Điều kiện danh tính, trạng thái, phiên bản ⇒ kiểm trong `work`, sau `readRequest`.
5. Cập nhật bảng API ở [2B.1](#2b1-bản-đồ-api-đầy-đủ) và bảng ở mục d.

#### g. Kiểm chứng

- **Test tự động** (cần MongoDB replica set local, file test tự tạo DB tạm):

  ```powershell
  $env:RUN_NATIVE_API_TESTS='1'; node --test --test-concurrency=1 --test-name-pattern="HTTP permission scope" test/backend-permissions.integration.test.js
  ```

  Chạy ngày 25/11/2026 trên `rs0` cổng 27017: 6 test, 6 đạt, 0 lỗi. Các ca chứng minh nội dung mục này:
  - `RR source options validate type, scope sources and page after filtering`: Sales khác ⇒ 404; RR `SUBMITTED` hoặc đã có PO ⇒ 400; Kế toán được cấp tạm `:create` thì đọc được nguồn.
  - `RR lot options use RR permission and enforce creator and warehouse scope`: các trường hợp ở mục e.
  - `custom role uses current grants and warehouse scope across list, detail and evidence` (không thuộc RR, dùng đơn bán và phiếu giao): gỡ quyền khỏi vai trò hoặc tắt một quyền trong `permissions` thì request kế tiếp nhận 403 `ERR-CORE-403-001` ngay, không cần đăng nhập lại. Đây là cơ chế chung của `authenticate` + `hasPermission` mà RR cũng dùng.
- **Đọc code khi review:** với mỗi route không có `checkPermission`, hàm service tương ứng phải gọi `requirePermission` (hoặc `command()`) **trước** truy vấn DB đầu tiên. Lệnh tìm nhanh, chạy trong `be/`:

  ```powershell
  Select-String -Path src/modules/replenishments/*.js -Pattern 'checkPermission|requirePermission|command\('
  ```

- **Thử bằng HTTP:** gỡ một quyền khỏi vai trò trong collection `roles` (`$pull permissionIds`), gọi lại API bằng token cũ. Kết quả phải là 403 ngay ở request kế tiếp, không cần đăng nhập lại, vì `authenticate` nạp quyền từ DB ở mỗi request.

Chưa kiểm: không thấy test HTTP gọi `POST /evaluate` hoặc `POST /:id/cancel` khi thiếu quyền trong `backend-permissions.integration.test.js` và `native-api.integration.test.js`; chưa chạy test FE. Các chỗ trùng lặp còn lại trong code kiểm quyền RR ghi ở [Phần 3, mục 3.6](#36-kiểm-quyền).

### Hàm: `appendAudit({...})`

[audit.js:15](../../../src/shared/utils/audit.js) — tạo `AuditLog` với `eventKey` ngẫu nhiên, `action` = mã lệnh, `versionBefore/After`, `operationId`, `transactionId` (id sổ cái nếu lệnh có ghi tồn), `warehouseIds`, `reason`.

---

## 2.1. Bước 1 — Lập RR: `createReplenishment(user, input)`

[replenishment.commands.js:379](../../../src/modules/replenishments/replenishment.commands.js). Route `POST /api/replenishments` có `checkPermission("replenishment_request:create")` + `validate(createReplenishmentSchema)` ([replenishment.validation.js](../../../src/modules/replenishments/replenishment.validation.js)). Controller trả **201** cho lần đầu, **200** khi replay ([replenishment.controller.js:48](../../../src/modules/replenishments/replenishment.controller.js)).

- **Vai trò nghiệp vụ:** tạo phiếu RR mới (nháp hoặc gửi luôn).
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò & dữ liệu |
|---|---|---|
| `input.action` | `'SAVE_DRAFT' \| 'SUBMIT'` | Lưu nháp hay gửi duyệt ngay. |
| `input.creationKey` | string ≤160 | Khóa chống tạo trùng; lưu vào `header.creationKey`. |
| `input.warehouseId` | ObjectId string | Kho cần bổ sung. |
| `input.neededOn` | `'YYYY-MM-DD'` | Ngày cần hàng (giờ VN). |
| `input.triggerReason` | string ≤200 | Lý do chung của phiếu. |
| `input.note` | string \| null | Ghi chú. |
| `input.lines[]` | 1–100 dòng | `{ productId, enteredUnit, lotId?, enteredQty, reasonNote?, source?, independentNeedConfirmed?, independentNeedReason? }`. |
| `document` | `ReplenishmentRequest` | Phiếu mới, `workflowStatus: 'DRAFT'`, `version: 1`. |
| Trả về | `{ document }` | `command()` biến thành biên nhận. |

- **Tương tác DB:** `Warehouse` (cấp mã + kiểm), `Product`, `ProductBatch`, `Uom`, `Conversion`, các collection đánh giá tồn; `ReplenishmentRequest.save({ session })`. Có transaction (qua `command`).
- **Logic:**

  ```js
  const document = new ReplenishmentRequest({
    ...await nextDocumentFields(ReplenishmentRequest,'RR',input.warehouseId,session),
    workflowStatus: "DRAFT",
    version: 1,
    createdBy: actor._id,
    note: input.note,
    header: { ...(await header(input, actor, session)), creationKey: input.creationKey },
    items: await items(input, actor, session),
  });
  if (input.action === "SUBMIT") await submission(document, actor, session);
  await document.save({ session });
  ```

  *Tại sao:* mã RR chứa mã kho, nên kho không được đổi sau khi lưu (xem `header()`). Khi `SUBMIT` ngay, vẫn qua đúng hàm `submission()` như luồng gửi riêng, nên ảnh gửi duyệt luôn có. `authorizeReplay` là `replay = readRequest`, dùng lại kiểm phạm vi.

### Hàm: `header(input, user, session, saved)`

[replenishment.commands.js:57](../../../src/modules/replenishments/replenishment.commands.js)

- **Vai trò:** kiểm và chuẩn hóa phần đầu phiếu.
- **Biến:** `saved` (header đã lưu khi sửa; undefined khi tạo), `unchanged` (ngày cần hàng không đổi), `warehouse`. Trả về `{ warehouseId, neededOn: Date(…T00:00:00+07:00), triggerReason }`.
- **Logic:**

  ```js
  requireWarehouseAccess(user, input.warehouseId);
  if (saved && !same(saved.warehouseId, input.warehouseId))
    throw validationError("Không đổi kho sau khi đã cấp mã yêu cầu; hủy và lập yêu cầu mới");
  const unchanged = saved?.neededOn && saigonDateOnly(saved.neededOn) === input.neededOn;
  if (!unchanged && input.neededOn < saigonDateOnly())
    throw validationError("Ngày cần hàng không được trước hôm nay");
  ```

  *Tại sao:* một RR nháp từ tuần trước vẫn sửa được dù ngày cần hàng đã qua, miễn là không đổi ngày đó; đổi sang ngày mới thì không được chọn ngày quá khứ.

### Hàm: `items(input, actor, session, previous = [], requestId)`

[replenishment.commands.js:105](../../../src/modules/replenishments/replenishment.commands.js)

- **Vai trò:** biến các dòng client gửi thành dòng RR chuẩn (quy đổi, ảnh sản phẩm, đánh giá tồn, liên kết nguồn).
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `previous` | mảng dòng đã lưu | Khi sửa: để giữ `_id` và ảnh quy đổi cũ. |
| `previousById` | `Map<id, item>` | Tra dòng cũ theo id. |
| `seen` | `Set` | Chặn một id xuất hiện hai lần. |
| `staged[]` | `{ value, reasonNote }` | Dòng đã quy đổi (`value` từ `makeItem`) + lý do dòng. |
| `evaluated[]` | kết quả `evaluateLines` | Tồn khả dụng, RR đang mở, PO đang về, cảnh báo… |
| Trả về | mảng item | `{ ...value, sources, details }` sẵn để gán vào `document.items`. |

- **Logic:**

  1. Dòng có `id` phải thuộc phiếu và không trùng; dòng có nguồn chứng từ (SO/kiểm kê) không được đổi nguồn:

  ```js
  if (lineId && (!old || seen.has(lineId)))
    throw validationError("Dòng hàng không thuộc yêu cầu hoặc bị trùng");
  ...
  if (oldSource?.documentId && ( ... ))
    throw validationError("Không đổi nguồn của dòng đã lưu; xóa dòng và chọn nguồn hợp lệ");
  ```

  2. Đơn vị thùng (`Uom.isCarton`) phải nhập số nguyên, nếu không lỗi "Số thùng phải là số nguyên". Sau đó quy đổi dòng bằng `makeItem(line, index + 1, session, { previous: old, lineKind: "REPLENISHMENT" })`. Lý do dòng: bỏ trống ⇒ giữ lý do cũ; `null` ⇒ xóa.

  3. Đánh giá cả danh sách, rồi bắt buộc giải trình nếu có cảnh báo:

  ```js
  const evaluated = await evaluateLines(actor, { ...input, requestId }, session, {
    permission: requestId ? "replenishment_request:update" : "replenishment_request:create",
    items: staged.map(({ value }) => value),
    strictSourceVersion: input.action === "SUBMIT",
  });
  checkWarnings(input.lines, evaluated);
  ```

  4. Dòng có nguồn chứng từ được ghi thêm `sources[]` với `relationCode` `REPLENISHES_DEMAND` (thiếu hàng bán) hoặc `STOCKTAKE_REPLENISHMENT`; `details` lấy từ `evaluatedDetails()`.

### Hàm: `makeItem(input, lineNo, session, options)`

[document-items.js:8](../../../src/shared/utils/document-items.js) — dùng chung cho RR và cho dòng hàng đến/kiểm nhận.

- **Vai trò:** từ (sản phẩm, lô, đơn vị, số lượng nhập) tính ra dòng chứng từ có `qtyBase` chính xác và ảnh lịch sử.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input` | `{ productId, lotId?, enteredUnit, enteredQty }` | Dữ liệu người dùng. |
| `options.previous` | dòng cũ | Nếu cùng sản phẩm/đơn vị/lô ⇒ dùng lại hệ số cũ (`reuseSnapshot`). |
| `options.includeLotLabel` | bool | Ghi thêm `lotLabelSnapshot` (số lô NSX) — dùng ở kiểm nhận. |
| `options.allowInactiveUom` | bool | Cho phép đơn vị thùng đã ngừng (kiểm nhận). |
| `product` | `Product` | Phải `isActive`. |
| `batch` | `ProductBatch` | Lô phải `VERIFIED` và thuộc sản phẩm. |
| `factor` | Decimal | Hệ số quy đổi `basePerUnit`. |
| `packagingSnapshot` | object | Quy cách thùng của lô: `{ packageUnit: 'Thùng', baseUnitsPerPackage, outerLength/Width/HeightMm }`. |
| `quantity` | Decimal | `qtyBase`. |
| Trả về | item | `{ _id, lineNo, lineKind, productId, lotId, enteredUnit, baseUnitSnapshot, baseUnitsPerUnit, enteredQty, qtyBase, productNameSnapshot, packagingSnapshot, lotLabelSnapshot? }` |

- **Tương tác DB:** `Product.findOne`, `ProductBatch.findOne`, `lockLotIdentity` (update `updatedAt` của lô), `Conversion` (qua `resolveConversion`), `Uom.findOne`.
- **Logic:**

  ```js
  if (input.lotId) {
    batch = await ProductBatch.findOne({ _id: input.lotId, productId: product._id, identificationStatus: 'VERIFIED' }).session(session);
    if (!batch) throw validationError('Lô chưa xác minh hoặc không thuộc sản phẩm');
    await lockLotIdentity(batch._id, session);
    packagingSnapshot = { packageUnit: 'Thùng', baseUnitsPerPackage: String(batch.piecesPerCarton), ... };
  }
  ...
  const quantity = toBaseQuantity(input.enteredQty, factor, product, enteredUom);
  if (!quantity.gt(0) || quantity.decimalPlaces() > 6 || quantity.gte('100000000000000') ||
      (product.wholeBaseUnits && !quantity.isInteger()))
    throw validationError('Số lượng phải quy đổi chính xác sang đơn vị gốc');
  ```

  *Tại sao:* chứng từ lưu **hệ số tại thời điểm lập** (`baseUnitsPerUnit`), nên đổi bảng quy đổi sau này không làm sai phiếu cũ. `lockLotIdentity` ([lotIdentity.js:3](../../../src/shared/utils/lotIdentity.js)) ghi `updatedAt` của lô theo điều kiện `updatedAt` cũ: nếu cùng lúc có người sửa/xóa lô, một trong hai giao dịch xung đột. Sản phẩm `wholeBaseUnits` (vd gạch tính theo viên) không được có số lẻ.

### Hàm: `resolveConversion(product, batch, enteredUnit, session, opts)` và `toBaseQuantity(enteredQty, factor, product, uom)`

[conversions.js:8](../../../src/shared/utils/conversions.js), [conversions.js:46](../../../src/shared/utils/conversions.js#L46)

- **Thứ tự tìm hệ số:** đơn vị = đơn vị gốc ⇒ `1`; nếu có lô ⇒ quy đổi riêng của lô (mới nhất có `validFrom ≤ now`); nếu không có và (không có lô hoặc đơn vị không phải thùng) ⇒ quy đổi chung của sản phẩm (`productBatchId: null`); không có ⇒ lỗi "Thiếu quy đổi…".

  ```js
  let conversion = batch && await Conversion.findOne({ ...scope, productBatchId: batch._id }).sort({ validFrom: -1 }).session(session);
  if (!conversion && (!batch || !uom.isCarton)) {
    conversion = await Conversion.findOne({ ...scope, productBatchId: null }).sort({ validFrom: -1 }).session(session);
  }
  ```

  *Tại sao:* số viên/thùng khác nhau theo lô, nên đơn vị **thùng** bắt buộc phải có quy đổi theo lô; đơn vị diện tích (m²) thì dùng chung theo sản phẩm.
- `toBaseQuantity` nhân hệ số. Với đơn vị diện tích khác đơn vị gốc của sản phẩm nguyên viên, hàm làm tròn tích đến 6 chữ số rồi lấy `ceil`. `normalizedEnteredQty` chia lượng gốc cho hệ số, làm tròn 6 chữ số và kiểm tra quy đổi lại. `makeItem` lưu lượng diện tích đã chuẩn hóa. Ví dụ 10 m² gạch 600×600 được lưu thành 10,08 m² và 28 viên.

### Hàm: `evaluateLines(user, input, session, options)`

[replenishment.evaluation.js:325](../../../src/modules/replenishments/replenishment.evaluation.js#L325). Cũng được gọi trực tiếp qua `POST /replenishments/evaluate` để màn hình xem trước.

- **Vai trò nghiệp vụ:** "trợ lý" giúp người lập/duyệt thấy có thật sự cần mua không. Nó **không chặn** mà sinh cảnh báo; việc chặn do `checkWarnings` làm.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `options.items` | dòng đã quy đổi | Có ⇒ dùng `qtyBase` sẵn; không có ⇒ tự tính qua `previewQuantity`. |
| `options.strictSourceVersion` | bool | Khi gửi duyệt: nguồn (SO/kiểm kê) phải đúng version người lập đã xem. |
| `own` | RR \| undefined | Phiếu đang sửa (để loại khỏi phép tính "RR đang mở"). |
| `available` | Decimal | Tồn **khả dụng** tại kho (`availableStock`). |
| `threshold` / `minimum` | object / Decimal | Định mức tối thiểu của sản phẩm tại kho (`product.stockThresholds`). |
| `requested` | Decimal | Lượng yêu cầu (đơn vị gốc). |
| `stockLimit` | Decimal | Mốc so sánh: `minimum` nếu > 0, ngược lại chính `requested`. |
| `pending` | `{ pendingRequestQtyBase, relatedRequests }` | Lượng đang được RR khác đề nghị. |
| `incoming` | mảng PO | PO `OPEN/PARTIAL` còn chưa về. |
| `other` | object | Tồn khả dụng ở kho khác (`otherWarehouseOptions`). |
| `warnings` | `('OPEN_REQUEST'\|'INCOMING_PO'\|'STOCK_SUFFICIENT')[]` | Danh sách cảnh báo. |
| Trả về | mảng | Mỗi dòng: `{ lineNo, productId, source, availableQtyBase, minimumQtyBase, targetQtyBase, pendingRequestQtyBase, relatedRequests, incomingQtyBase, incomingPurchaseOrders, otherWarehouse..., warnings, warningRequired, evaluatedAt }`. |

- **Logic cảnh báo:**

  ```js
  const stockLimit = minimum?.gt(0) ? minimum : requested;
  const pending = await openRequests(user, product._id, warehouseId, requestId, session);
  const incoming = await incomingPurchaseOrders(product._id, warehouseId, requestId, session);
  const other = await otherWarehouseOptions(user, product._id, warehouseId, line.lotId, session);
  const warnings = [];
  if (number(pending.pendingRequestQtyBase).gt(0)) warnings.push("OPEN_REQUEST");
  if (incoming.length) warnings.push("INCOMING_PO");
  if (stockLimit != null && available.gte(stockLimit)) warnings.push("STOCK_SUFFICIENT");
  ```

  *Tại sao:* ba rủi ro mua thừa: đã có người xin rồi, đã có hàng đang về, hoặc kho còn đủ (trên định mức, hoặc nếu không có định mức thì đủ cho chính lượng xin). Định mức `0` nghĩa là "không có sàn", nếu so `tồn ≥ 0` thì kho rỗng cũng bị cảnh báo — nên mới dùng `requested` thay thế.

#### Các hàm phụ của `evaluateLines`

- **`resolveSource(line, warehouseId, user, session)`** phân nhánh theo `triggerType` và `documentType`. `MANUAL_OTHER` (mặc định khi thiếu `source`) và `STOCK_THRESHOLD` trả nguyên nguồn. Với `SALES_SHORTAGE`, hàm đọc trực tiếp `SalesOrder` nếu nguồn là đơn bán. Nếu nguồn là `WarehouseIssueRequest`, hàm kiểm yêu cầu xuất rồi lần về `SalesOrder` và dòng hàng tương ứng. Cả hai đường kiểm sản phẩm và trạng thái, rồi lấy phiên bản hiện tại để bước đánh giá so khớp khi cần. Với `STOCKTAKE_LOW_STOCK`, hàm đọc `Stocktake` đã chốt cùng kho và kiểm sản phẩm thuộc dòng kiểm kê hoặc `StocktakeSnapshot`. Ba đường nét đứt ở RR Class biểu thị ba model được đọc theo nhánh. Tham chiếu chứng từ nguồn được lưu theo từng dòng RR. [Mã `resolveSource()`](../../../src/modules/replenishments/replenishment.evaluation.js#L49), [sơ đồ RR Class và phân tích](../04_so_do/WMSD_BF01_Diagrams_Review.md#yeu-cau-bo-sung).
- **`availableStock(productId, warehouseId, lotId, session)`** ([evaluation.js:217](../../../src/modules/replenishments/replenishment.evaluation.js)) — định nghĩa "tồn khả dụng":

  ```js
  const locations = await m.WarehouseLocation.find({ warehouseId, isActive: true, locationType: "STORAGE", isPickable: true })...
  const locks = await m.StocktakeLocationLock.find({ locationId: { $in: locationIds }, status: "LOCKED" })...
  ...
  const balances = await m.InventoryBalance.find({ holdingPointId: {...}, batchId: {...}, qualityStatus: "GOOD", ownerType: "STORE" })
  for (const balance of balances) available = available.plus(positive(await freeQuantity(balance, session)));
  ```

  Tồn khả dụng chỉ tính lô `VERIFIED`, số dư `GOOD/STORE` ở ô `STORAGE` đang hoạt động, `isPickable` và không bị khóa kiểm kê. `freeQuantity` lấy tồn vật lý trừ lượng giữ còn lại, lượng lệnh chuyển đang chờ chưa được bao bởi phiếu giữ và lượng bị chặn do báo lỗi còn hiệu lực. Từng số dư chỉ góp phần dương vào tổng. RR đánh giá từng sản phẩm hoặc lô bằng `availableStock`. Cảnh báo tồn thấp và dashboard Owner áp dụng cùng cách tính theo lô đủ điều kiện qua truy vấn theo lô dữ liệu `availableStocks` (2B.11). [stock.js](../../../src/shared/utils/stock.js)
- **`openRequests(...)`** ([evaluation.js:149](../../../src/modules/replenishments/replenishment.evaluation.js)): tìm RR `DRAFT/SUBMITTED/APPROVED` cùng kho, cùng sản phẩm (trừ phiếu đang sửa). `pendingRequestQuantity()` (dòng 15) lấy `approvedQtyBase` nếu đã duyệt, ngược lại `qtyBase`; nếu RR đã có PO `OPEN/PARTIAL` thì trừ phần đã lên PO; PO kết thúc ⇒ 0. Chỉ Owner/Kế toán hoặc chính người lập mới thấy chi tiết từng RR (`relatedRequests`).
- **`incomingPurchaseOrders(...)`** ([evaluation.js:181](../../../src/modules/replenishments/replenishment.evaluation.js)): PO `OPEN/PARTIAL` cùng kho, còn lại = `qtyBase − cancelledRemainderQtyBase − đã nhập (GR POSTED)`.
- **`otherWarehouseOptions(...)`** ([evaluation.js:283](../../../src/modules/replenishments/replenishment.evaluation.js#L283)): chạy `availableStock` cho từng kho khác; kho người dùng không được vào chỉ cộng vào `restrictedOtherWarehouseQtyBase`, không lộ chi tiết.

### Hàm: `checkWarnings(lines, evaluated)` và `evaluatedDetails(line, evaluation)`

[replenishment.commands.js:91](../../../src/modules/replenishments/replenishment.commands.js), [replenishment.commands.js:76](../../../src/modules/replenishments/replenishment.commands.js)

```js
if (evaluated[index].warningRequired &&
    (line.independentNeedConfirmed !== true || !line.independentNeedReason?.trim()))
  invalidLines.push({ lineNo: evaluated[index].lineNo, message: "Cần xác nhận nhu cầu và giải trình cảnh báo" });
...
if (invalidLines.length) throw reviewRequired(evaluated, undefined, invalidLines);
```

*Tại sao:* có cảnh báo vẫn lưu được, nhưng người lập phải chủ động tick "nhu cầu độc lập" và viết lý do. Lỗi trả về **409 `ERR-RR-409-004`** kèm `latestEvaluations` để FE hiển thị ngay số liệu mới nhất.

`evaluatedDetails` ghi vào `item.details` các **ảnh số liệu** lúc đánh giá: `availableQtySnapshot`, `pendingRequestCoverageQtySnapshot`, `incomingCoverageQtySnapshot`, `minimumQtySnapshot`, `targetQtySnapshot`, `evaluatedAt`, `triggerType`, `source`, `reasonNote`, `independentNeed*`. Người duyệt xem lại được bối cảnh khi người lập quyết định.

### Hàm: `submission(document, user, session)`

[replenishment.commands.js:233](../../../src/modules/replenishments/replenishment.commands.js)

- **Vai trò:** chụp ảnh bất biến của phiếu tại version được gửi duyệt.
- **Biến:** `warehouse` (lấy `code`, `name`), `snapshots[]` (mỗi dòng: `lineId, lineNo, productId, productSkuSnapshot, productNameSnapshot, baseUomCodeSnapshot, enteredUomCodeSnapshot, enteredQty, conversionSnapshot, qtyBase, evaluation, triggerType, reasonNote`), `now`.
- **Logic:**

  ```js
  const product = await Product.findById(item.productId).session(session);
  if (!product?.isActive) throw validationError("Sản phẩm đã ngừng sử dụng");
  ...
  document.submissions.push({ documentVersion: document.version, submittedBy: user._id, submittedAt: now,
    warehouseId: warehouse._id, warehouseCodeSnapshot: warehouse.code, ..., lines: snapshots });
  document.workflowStatus = "SUBMITTED";
  ```

  *Tại sao:* sau khi gửi, tên sản phẩm/quy đổi có thể đổi; người duyệt và kiểm toán cần biết **chính xác** người lập đã gửi gì. Schema `submissions` là `appendOnly`.

---

## 2.2. Bước 1b — Sửa RR: `updateReplenishment(user, id, input)`

[replenishment.commands.js:406](../../../src/modules/replenishments/replenishment.commands.js)

- **Vai trò:** người lập chỉnh nháp.
- **Biến:** `input.expectedVersion`, `input.operationKey`, các trường như khi tạo; `lines[].id` để giữ dòng cũ (dòng bị bỏ khỏi danh sách sẽ biến mất khỏi `items`).
- **Logic:**

  ```js
  const document = await readRequest(id, actor, session);
  checkVersion(document, input.expectedVersion);
  if (!same(document.createdBy, actor._id)) throw forbiddenError("Chỉ người lập được sửa");
  if (document.workflowStatus !== "DRAFT") throw validationError("Yêu cầu không còn được sửa");
  if (await PurchaseOrder.exists({ replenishmentRequestId: id }).session(session)) throw validationError("Yêu cầu đã có đơn mua");
  document.items = await items(input, actor, session, document.items, id);
  document.header.set(await header(input, actor, session, document.header));
  ```

  `readRequest` ([dòng 41](../../../src/modules/replenishments/replenishment.commands.js)) = `scopedDocument` + chặn Sales/Warehouse đọc RR của người khác (trả 404 để không lộ tồn tại).

## 2.3. Bước 2 — Gửi duyệt: `submitReplenishment(user, id, input)`

[replenishment.commands.js:438](../../../src/modules/replenishments/replenishment.commands.js)

- **Vai trò:** chuyển RR đã lưu sang `SUBMITTED`.
- **Biến:** `input.evaluations[]` (tùy chọn, `{ lineId, independentNeedConfirmed, independentNeedReason }` — giải trình bổ sung lúc gửi).
- **Logic:**

  ```js
  const document = await readRequest(id, actor, session);
  checkVersion(document, input.expectedVersion);
  if (!same(document.createdBy, actor._id)) throw forbiddenError("Chỉ người lập được gửi");
  if (document.workflowStatus !== "DRAFT") throw validationError("Yêu cầu không thể gửi ở trạng thái hiện tại");
  await assessSavedRequest(document, actor, session, input.evaluations);
  document.version = input.expectedVersion + 1;
  await submission(document, actor, session);
  return { document: await saveVersion(document, input.expectedVersion, session), versionBefore: input.expectedVersion };
  ```

  `version` được tăng **trước** `submission()` để `submissions[].documentVersion` trùng với version sẽ được lưu (`saveVersion` đặt lại cùng giá trị).

### Hàm: `assessSavedRequest(document, actor, session, evaluations)` và `savedAssessmentInput(document, overrides)`

[replenishment.commands.js:202](../../../src/modules/replenishments/replenishment.commands.js), [dòng 165](../../../src/modules/replenishments/replenishment.commands.js)

- Dựng lại input từ dòng đã lưu (kèm giải trình mới trong `evaluations`), chạy lại `evaluateLines` với `strictSourceVersion: true`, rồi `checkWarnings`. Ghi đè `item.details` bằng số liệu mới.
- *Tại sao:* giữa lúc lưu nháp và lúc gửi có thể đã có PO khác về hoặc tồn thay đổi; người lập phải giải trình theo số liệu **lúc gửi**. Dòng có nguồn cũ dạng "legacy" (có `triggerType` khác `MANUAL_OTHER` nhưng không có `source`) bị chặn với thông điệp "Nguồn RR cũ cần được chuẩn hóa".

## 2.4. Bước 3 — Duyệt: `reviewReplenishment(user, id, input)`

[replenishment.commands.js:463](../../../src/modules/replenishments/replenishment.commands.js). Quyền `replenishment_request:approve`.

- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input.decision` | `'APPROVE'\|'REJECT'` | Quyết định (`REVISE` bị validation từ chối từ 22/11/2026). |
| `input.reason` | string | Căn cứ chung, **bắt buộc**. |
| `input.lines[]` | `{ lineId, approvedQtyBase, reason? }` với `APPROVE` | Lượng duyệt từng dòng theo đơn vị gốc, dưới dạng chuỗi thập phân. [replenishment.validation.js](../../../src/modules/replenishments/replenishment.validation.js) |
| `seen` | `Set` | Kiểm không trùng dòng và đủ dòng. |
| `products` | `Product[]` | Để kiểm `wholeBaseUnits`. |
| `uoms` | `Uom[]` | Nhận diện dòng thùng và diện tích để kiểm lượng duyệt. |
| `approve` | bool | `input.decision === "APPROVE"`. |
| `quantity` | Decimal | Lượng duyệt đơn vị gốc, ghi vào `item.approvedQtyBase`. |
| `positive` | bool | Có ít nhất một dòng > 0. |
| `itemDecisions[]` | `{ itemId, approvedQtyBase, outcome, reason }` | Ghi vào `approval_history`. |
| `approval` | `ApprovalHistory` | Bản ghi quyết định. |

- **Tương tác DB:** `Product.find`, `Uom.find`, `ApprovalHistory.save`, `saveVersion(RR)`.
- **Logic:**

  1. Tách bạch người lập và người duyệt, chỉ duyệt phiếu `SUBMITTED`:

  ```js
  if (same(document.createdBy, actor._id)) throw forbiddenError("Người duyệt phải khác người lập");
  if (document.workflowStatus !== "SUBMITTED") throw validationError("Chỉ duyệt yêu cầu đã gửi");
  ```

  Schema `approval_history` cũng có rule chặn `requestedBy == decidedBy` (trừ một luồng trả hàng đặc thù).

  2. Mỗi dòng `APPROVE` phải gửi `approvedQtyBase`. BE kiểm lượng duyệt từ 0 đến `qtyBase` và kiểm số nguyên nếu sản phẩm có `wholeBaseUnits`.

  3. BE dùng hệ số trên dòng RR để kiểm đơn vị thùng hoặc diện tích. Với thùng, lượng duyệt phải chia hết cho hệ số. Với diện tích làm tròn đến viên, lượng quy đổi ngược phải cho lại đúng lượng gốc.

  4. Mỗi dòng duyệt giảm cần lý do riêng. `APPROVE` cần ít nhất một dòng được duyệt dương. BE ghi `approvedQtyBase` vào dòng RR và `itemDecisions`. Với `REJECT`, lượng trên các dòng là 0.

  5. Lưu quyết định bất biến và cập nhật RR:

  ```js
  const approval = await new ApprovalHistory({
    decisionKey: hash({ id, version: document.version, key: input.operationKey }),
    subjectType: "replenishment_requests", subjectId: document._id, subjectRevision: document.version,
    decisionScope: "REPLENISHMENT", reviewedContent: document.toObject(), decision: input.decision, ...
  }).save({ session });
  document.header.latestDecisionId = approval._id;
  if (input.decision === "APPROVE") document.header.approvedRevision = document.version;
  ```

  *Tại sao:* PO sau này kiểm `latestDecisionId` và `approvedRevision` để biết quyết định còn hiệu lực. `reviewedContent` là toàn bộ phiếu tại thời điểm duyệt. Biên nhận trả thêm `decisionId`.

---

## 2.5. Bước 4 — Lập PO: `createPurchaseOrder(user, input)`

[purchase-order.commands.js:142](../../../src/modules/purchase-orders/purchase-order.commands.js). Route `POST /api/purchase-orders` có `checkPermission("purchase_order:create")` ở route và vẫn kiểm lại trong `command()` khi chạy transaction/replay; giữ HTTP `200`.

- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input.warehouseId`, `input.supplierId` | ObjectId | Kho nhận, NCC. |
| `input.currency` | `'VND'` | Tiền tệ cố định. |
| `input.expectedOn` | ISO datetime? | Ngày dự kiến giao (không được trước hôm nay). |
| `input.lines[]` | `{ id?, rrLineId, approvalId, enteredQty, uomCode?, unitPurchasePrice, note? }` | Mỗi dòng trỏ một dòng RR và quyết định duyệt. `uomCode` là đơn vị đặt mua (bỏ trống ⇒ giữ đơn vị đã lưu, hoặc đơn vị của RR). `unitPurchasePrice` là giá **theo đơn vị đặt**. Schema: [purchase-order.validation.js](../../../src/modules/purchase-orders/purchase-order.validation.js). |
| `prepared` | `{ request, supplier, items, total }` | Kết quả `draftItems`. |
| `po` | `PurchaseOrder` | Đơn mới `DRAFT`. |

- **Logic:**

  ```js
  checkExpectedOn(input.expectedOn);
  const prepared = await draftItems(actor, input, session);
  const request = prepared.request;
  if (await PurchaseOrder.exists({ replenishmentRequestId: request._id }).session(session))
    throw validationError("Yêu cầu bổ sung đã có đơn mua");
  await ReplenishmentRequest.updateOne({ _id: request._id }, { $set: { updatedAt } }, { session, timestamps: false });
  const po = await newDocument(PurchaseOrder, "PO", actor, { warehouseId, supplierId, expectedOn,
    approvedRequestRevision: prepared.request.header.approvedRevision, supplierSnapshot: {...} }, prepared.items);
  po.replenishmentRequestId = prepared.request._id;
  po.totalAmount = prepared.total;
  ```

  *Tại sao:* ghi `updatedAt` của RR trong cùng giao dịch là "chạm" có chủ đích: nếu cùng lúc có người hủy RR (lệnh hủy cũng kiểm "đã có PO chưa"), hai giao dịch cùng ghi một document ⇒ một cái phải chạy lại và sẽ thấy trạng thái mới. Unique partial index trên `replenishmentRequestId` là chốt cuối ở DB; kiểm `exists` trước để trả 400 dễ hiểu thay vì lỗi 11000.

### Hàm: `draftItems(actor, input, session, previous = [])`

[purchase-order.commands.js:37](../../../src/modules/purchase-orders/purchase-order.commands.js)

- **Biến:** `source` là dòng RR, `decision` là quyết định trên dòng. `uomCode` chỉ đơn vị đặt, `factor` là hệ số quy đổi, `amount` là lượng đặt theo đơn vị gốc và `enteredQty` là lượng lưu theo đơn vị đặt.
- **Logic:**

  1. Mỗi dòng phải thuộc **cùng một RR đã duyệt và cùng kho**:

  ```js
  const rr = await ReplenishmentRequest.findOne({ "items._id": line.rrLineId, workflowStatus: "APPROVED" }).session(session);
  if (!rr || !same(rr.header.warehouseId, input.warehouseId) || (request && !same(request._id, rr._id)))
    throw validationError("Một PO phải thuộc một RR đã duyệt và cùng kho");
  ```

  2. Quyết định duyệt phải là quyết định **mới nhất** và đúng revision:

  ```js
  const approval = await ApprovalHistory.findOne({ _id: line.approvalId, subjectType: "replenishment_requests",
    subjectId: rr._id, subjectRevision: rr.header.approvedRevision, decision: "APPROVE" }).session(session);
  if (!approval || !same(rr.header.latestDecisionId, approval._id))
    throw validationError("Quyết định duyệt nguồn không còn hiệu lực");
  ```

  3. Một dòng RR chỉ có một dòng PO; dòng đã lưu không được đổi dòng RR nguồn:

  ```js
  if (seen.has(String(source._id))) throw validationError("Gộp lượng của cùng dòng RR");
  ...
  const old = line.id ? previous.find((row) => same(row._id, line.id)) : null;
  if (line.id && (!old || !same(old.requestItemId, source._id))) throw validationError("Không đổi nguồn của dòng đã lưu");
  ```

  *Tại sao:* "One PO line per RR line: lots are split later, at inspection and receipt" — PO chưa biết lô, lô chỉ biết khi hàng đến.

  4. Chọn đơn vị đặt và hệ số ([purchase-order.commands.js:93](../../../src/modules/purchase-orders/purchase-order.commands.js)):

  ```js
  const uomCode = line.uomCode ?? old?.enteredUnit ?? source.enteredUnit;
  ...
  if (isWholeUnit(product, enteredUom) && !exact(line.enteredQty).isInteger())
    throw validationError(enteredUom.isCarton ? "Số thùng phải là số nguyên" : "Số lượng theo đơn vị gốc phải là số nguyên");
  const changedUnit = uomCode !== source.enteredUnit;
  const factor = changedUnit
    ? (await resolveConversion(product, null, uomCode, session)).toFixed()
    : String(source.baseUnitsPerUnit);
  const amount = toBaseQuantity(line.enteredQty, factor, product, enteredUom);
  ...
  copyItem(source, amount.toFixed(), { ..., ...(changedUnit && { lotId: undefined, packagingSnapshot: undefined }) })
  ```

  BE kiểm số thùng và số theo đơn vị gốc có `wholeBaseUnits` là số nguyên. Khi sửa và bỏ `uomCode`, PO giữ đơn vị đã lưu. Khi giữ đơn vị của RR, PO dùng lại hệ số và lô của dòng RR. Khi chọn đơn vị mới, PO lấy quy đổi cấp sản phẩm và bỏ lô.

  5. BE gọi `withinApproved(amount, line.enteredQty, factor, decision.approvedQtyBase, enteredUom.isCarton)` để kiểm trần.

  6. `normalizedEnteredQty` xác định lượng diện tích sẽ lưu. BE tính `lineAmount = round(unitPurchasePrice × enteredQty, 6)`. Dòng PO lưu hệ số và liên kết dòng RR. Kho ghi lô và quy cách thực nhận khi kiểm nhận.

### Hàm: `withinApproved(qtyBase, enteredQty, factor, approvedBase, isPackage)`

[conversions.js:65](../../../src/shared/utils/conversions.js#L65) — dùng ở `draftItems`, `confirmPurchaseOrder` và đối soát `reconcilePurchasing`.

```js
export function withinApproved(qtyBase, enteredQty, factor, approvedBase, isPackage) {
  if (exact(qtyBase).lte(approvedBase.toString())) return true;
  if (!isPackage) return false;
  const quantity = exact(enteredQty);
  return quantity.isInteger() && quantity.minus(1).mul(factor.toString()).lt(approvedBase.toString());
}
```

| Tên biến | Vai trò |
|---|---|
| `qtyBase` | Lượng PO đơn vị gốc. |
| `enteredQty` | Lượng PO theo đơn vị đặt (vd 8 thùng). |
| `factor` | Hệ số của đơn vị đặt (vd 4 viên/thùng). |
| `approvedBase` | Lượng Owner duyệt, đơn vị gốc. |
| `isPackage` | Dấu `isCarton` từ danh mục của đơn vị đặt. |
| Trả về | `true` nếu trong trần. Nếu vượt, chỉ trả `true` khi số thùng là số nguyên và bớt một thùng thì thiếu. |

*Ví dụ:* duyệt 30 viên, NCC bán thùng 4 viên. 8 thùng = 32 viên > 30, nhưng 7 thùng = 28 < 30 ⇒ hợp lệ. 9 thùng = 36 viên bị chặn vì 8 thùng đã đủ.

### Hàm: `copyItem(source, quantity, overrides)` và `sourceLink(document, item, quantity, relationCode)`

[document-copy.js:9](../../../src/shared/utils/document-copy.js), [document-copy.js:5](../../../src/shared/utils/document-copy.js)

- `copyItem`: sao dòng nguồn sang chứng từ mới với `_id` mới, giữ `productId, lotId, enteredUnit, baseUnitSnapshot, baseUnitsPerUnit, productNameSnapshot, packagingSnapshot`; `enteredQty = quantity ÷ hệ số` (nếu không chia hết 6 chữ số thập phân thì chỉ chấp nhận khi dòng nguồn vốn đã làm tròn diện tích). Được dùng ở PO, kiểm nhận, phiếu nhập và giữ hộ. Lệnh chuyển vị trí không sao dòng mà dựng dòng mới bằng `makeItem` từ số dư.
- `sourceLink`: tạo `{ documentId, subjectCollection, itemId?, linkedQty?, relationCode }` để lần ngược chuỗi chứng từ.

## 2.6. Bước 5 — Phát hành PO: `confirmPurchaseOrder(user, id, input)`

[purchase-order.commands.js:230](../../../src/modules/purchase-orders/purchase-order.commands.js)

- **Vai trò:** khóa nội dung PO và mở cho kho nhận hàng (`OPEN`).
- **Logic kiểm lại toàn bộ nguồn:**

  ```js
  if (rr?.workflowStatus !== "APPROVED" || rr.header.approvedRevision !== po.header.approvedRequestRevision)
    throw validationError("Nguồn RR đã đổi");
  ...
  if (!source || !decision || seen.has(sourceId) || !same(source.productId, item.productId) ||
      !withinApproved(item.qtyBase, item.enteredQty, item.baseUnitsPerUnit, decision.approvedQtyBase, cartonUnits.has(item.enteredUnit)))
    throw validationError("Nguồn duyệt PO không còn hợp lệ");
  seen.add(sourceId);
  ...
  po.workflowStatus = "OPEN";
  po.header.issuedAt = new Date();
  ```

  *Tại sao:* PO nháp có thể nằm vài ngày; trong thời gian đó sản phẩm/NCC/kho có thể ngừng hoạt động hoặc RR bị xử lý lại. Phát hành là điểm cam kết với NCC nên phải kiểm lại. Trước đây hàm cộng dồn các dòng PO cùng dòng RR; nay hai dòng PO trỏ cùng một dòng RR bị **chặn hẳn** (`seen`), và giới hạn lượng dùng cùng quy tắc làm tròn gói `withinApproved` với hệ số lưu trên dòng PO.

### Hàm hỗ trợ: `purchaseOrderQuantities(po, session)`

[purchase-order.service.js:11](../../../src/modules/purchase-orders/purchase-order.service.js) — được dùng ở bước 7, 8 và khi đóng PO.

```js
const receipts=await PurchaseReceipt.find({'header.purchaseOrderId':po._id,workflowStatus:{$in:['POSTED','DRAFT']}}).session(session).lean();
...
const cancelled=exact(item.cancelledRemainderQtyBase??'0'),outstanding=exact(item.qtyBase).minus(received).minus(cancelled);
return {lineId, orderedQtyBase, receivedQtyBase, cancelledQtyBase, outstandingQtyBase,
  openDraftCommitmentQtyBase: draft, acceptanceHeadroomQtyBase: outstanding.minus(draft), quantityState:'KNOWN'};
```

| Trường | Ý nghĩa nghiệp vụ |
|---|---|
| `receivedQtyBase` | Tổng lượng trên các phiếu nhập **đã ghi tồn**. |
| `openDraftCommitmentQtyBase` | Tổng lượng trên các phiếu nhập **nháp** (đã kiểm nhận nhưng chưa ghi tồn). |
| `outstandingQtyBase` | Còn phải giao = đặt − đã nhập − đã chốt thiếu. Quyết định PO `PARTIAL`/`COMPLETED`. |
| `acceptanceHeadroomQtyBase` | Còn **được phép nhận thêm** = còn phải giao − phiếu nháp. Chặn nhận vượt PO. |

---

## 2.7. Bước 6 — Hàng đến & lập phiếu kiểm nhận: `createInspection(user, id, input)`

[goods-inspection.service.js:117](../../../src/modules/goods-inspections/goods-inspection.service.js). Route `POST /api/purchase-orders/:id/inspections`, quyền `goods_receipt_inspection:create` (`checkPermission` ở route, kiểm lại trong `command()`). `:id` là mã PO.

- **Vai trò nghiệp vụ:** ghi nhận xe hàng đến và kết quả đếm/kiểm từng lô — **chưa tác động tồn kho**.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input.expectedPoVersion` | int | Version PO thủ kho đang xem. |
| `input.arrivedAt` | ISO datetime | Thời điểm hàng đến (không ở tương lai). |
| `input.deliveryReference`, `input.deliveredBy` | string? | Số phiếu giao của NCC, tên người giao. |
| `input.creationKey` | string | Khóa chống tạo trùng. |
| `input.lines[]` | xem schema `line` ở 2.0 | Mỗi dòng = một lô thực nhận của một dòng PO. |
| `po` | `PurchaseOrder` | PO `OPEN/PARTIAL` đúng version. |
| `arrival` | `GoodsArrival` | `HĐK-...`, header: `purchaseOrderId, warehouseId, supplierId, arrivedAt, deliveryReference, deliveredBy`. |
| `inspection` | `GoodsInspection` | `PKN-...`, header: `arrivalId, warehouseId, participants: [actor]`. |
| Trả về | `{ document: inspection, resultRefs: [{ documentType: 'goods_arrivals', documentId, revision: 1 }] }` | FE nhận cả mã kiểm nhận và mã hàng đến. |

- **Logic:**

  ```js
  const po = await activePo(actor, id, input.expectedPoVersion, session);
  // Contend with PO cancellation without changing its public version token.
  const updatedAt = new Date(Math.max(Date.now(), (po.updatedAt?.getTime() ?? 0) + 1));
  const locked = await PurchaseOrder.updateOne(
    { _id: po._id, version: po.version, workflowStatus: { $in: ['OPEN', 'PARTIAL'] } },
    { $set: { updatedAt } }, { session, timestamps: false });
  if (locked.matchedCount !== 1) throw validationError('PO không còn mở để nhận hàng');
  const arrival = await newDocument(GoodsArrival, "ARR", actor, { purchaseOrderId: po._id, warehouseId: po.header.warehouseId,
    supplierId: po.header.supplierId, arrivedAt: new Date(input.arrivedAt), deliveryReference: input.deliveryReference, deliveredBy: input.deliveredBy });
  arrival.sources = [sourceLink(po)];
  const inspection = await newDocument(GoodsInspection, "INS", actor, { arrivalId: arrival._id, warehouseId: po.header.warehouseId, participants: [actor._id] });
  inspection.sources = [sourceLink(arrival)];
  await prepare(po, input, actor, session, arrival, inspection);
  await arrival.save({ session });
  await inspection.save({ session });
  ```

  *Tại sao "chạm" PO:* lệnh hủy PO (`cancelBlocker`, 2B.3.5) chỉ cho hủy khi chưa có `GoodsArrival`. Nếu hủy PO và lập kiểm nhận chạy song song, cả hai cùng ghi một document PO nên một bên phải chạy lại và thấy trạng thái mới. Ghi `updatedAt` thay vì tăng `version` để màn hình khác đang giữ `expectedPoVersion` không bị 409 vô cớ. Lệnh sửa kết quả kiểm (2B.5) **không** chạm PO kiểu này (rủi ro 3.5).

### Hàm: `activePo(user, id, expectedVersion, session)`

[purchase-core.js:79](../../../src/shared/utils/purchase-core.js) — `findPurchase(kind 'PO')` + `checkVersion` + PO phải `OPEN` hoặc `PARTIAL`.

### Hàm: `findPurchase(id, user, session, { kind, readOnly })`

[purchase-core.js:49](../../../src/shared/utils/purchase-core.js) — tìm theo `_id` hoặc `documentNo` trong model ứng với `kind` (`PO`, `INSPECTION`, `GR_PURCHASE`, `TO`, …); kiểm kho, riêng Kế toán ở chế độ chỉ đọc thì xem mọi kho. Bộ lọc `_id`/`documentNo` nằm ở `purchaseIdFilter` ([purchase-core.js:41](../../../src/shared/utils/purchase-core.js)), dùng chung với `purchaseOrderRef` (2B.1).

*Quy ước từ 25/11/2026:* sau khi `findPurchase` trả chứng từ, các truy vấn liên kết dùng `_id` đã phân giải (`po._id`, `document._id`), không dùng `id` thô từ URL. **Ví dụ:** một PO tạo trước 12/11/2026 có `_id = ObjectId('6740...a1')` và `documentNo = 'ĐMH-K01-261110-000001'`; phiếu nhập con lưu `header.purchaseOrderId = ObjectId('6740...a1')`. Khi FE gọi `GET /api/goods-receipts/purchase?purchaseOrderId=ĐMH-K01-261110-000001`, `purchaseOrderRef()` đổi chuỗi `documentNo` thành `ObjectId('6740...a1')` trước khi query — nếu so thẳng chuỗi `documentNo` thì MongoDB không khớp và trả danh sách rỗng.

### Hàm: `prepare(po, input, actor, session, arrival, inspection)`

[goods-inspection.service.js:37](../../../src/modules/goods-inspections/goods-inspection.service.js) — dùng chung cho tạo và sửa kiểm nhận.

- **Vai trò:** dựng cặp dòng song song: `arrival.items[k]` (thực nhận) và `inspection.items[k]` (kết quả kiểm, `lineKind: 'INSPECTION'`).
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `row` | dòng input | Một lô của một dòng PO. |
| `source` | dòng PO | `po.items.id(row.poLineId)`. |
| `prior` | dòng kiểm cũ | Khi sửa, giữ `_id` dòng kiểm. |
| `oldArrival` | dòng hàng đến cũ | Giữ hệ số cũ, chặn đổi dòng PO. |
| `product`, `enteredUnit`, `carton` | | Đơn vị đếm: mặc định đơn vị gốc; nếu khác thì **phải là đơn vị thùng** (`Uom.isCarton`). |
| `item` | kết quả `makeItem` | Dòng đã quy đổi theo **quy đổi của lô**. |
| `arrived` | dòng `GoodsArrival` | `item` + `purchaseOrderItemId`, `packagingCondition`, `sources → PO`. |
| `arrivalItems[]`, `inspectionItems[]` | mảng | Gán đè vào `arrival.items`, `inspection.items`. |

- **Logic từng bước:**

  1. Hàng không đạt chỉ được **tạm giữ** (`CUSTODY`), không được nhận sở hữu:

  ```js
  if (row.qualityCode !== 'GOOD' && row.ownershipDecision !== 'CUSTODY')
    throw validationError('Hàng chưa đạt phải tạm giữ chờ trả nhà cung cấp');
  ...
  if (!row.lotId) throw validationError("Kiểm nhận cần lô thực nhận");
  ```

  2. Bãi tiếp nhận (nếu chọn sớm) chỉ cho dòng `ACCEPT` và phải là vị trí `RECEIVING` cùng kho:

  ```js
  if (row.receivingLocationId) {
    if (row.ownershipDecision !== 'ACCEPT') throw validationError('Chỉ chọn bãi tiếp nhận cho hàng được nhận mua');
    await locationAt(row.receivingLocationId, po.header.warehouseId, ['RECEIVING'], session);
  }
  ```

  3. Thủ kho đếm theo thứ họ cầm được — thùng nguyên hoặc đơn vị gốc, **không** đếm theo m²:

  ```js
  const enteredUnit = row.enteredUnit ?? product?.baseUnit;
  const carton = enteredUnit !== product?.baseUnit;
  if (!product || (carton && !(await Uom.exists({ code: enteredUnit, isCarton: true }).session(session))))
    throw validationError("Kiểm hàng đếm theo thùng hoặc đơn vị gốc");
  if (carton && !exact(row.enteredQty).isInteger())
    throw validationError("Số thùng phải là số nguyên; phần lẻ nhập ở dòng riêng theo đơn vị gốc");
  ```

  4. Quy đổi bằng `makeItem(..., { previous: oldArrival, includeLotLabel: true, allowInactiveUom: true })`; dòng khai "nguyên thùng" (`SEALED`) phải chia hết số viên/thùng của lô; thời điểm đến không trước ngày sản xuất của lô.

  ```js
  if (row.packagingCondition === "SEALED" && !exact(item.qtyBase).mod(String(item.packagingSnapshot.baseUnitsPerPackage)).isZero())
    throw validationError("Dòng nguyên thùng phải đủ số viên theo quy cách lô; phần lẻ ghi dòng riêng là hàng lẻ");
  ```

  5. Dòng kiểm sao từ dòng hàng đến, thêm `details`:

  ```js
  details: { inspectedSourceLineId: arrived._id, receivingLocationId: row.receivingLocationId,
    qualityCode: row.qualityCode, ownershipDecision: row.ownershipDecision,
    inspectedBy: actor._id, inspectedAt: new Date(), packagingCondition: row.packagingCondition },
  ```

  *Lưu ý:* ở bước này **chưa kiểm** tổng lượng có vượt PO không — một phiếu nháp không giữ chỗ. Kiểm vượt nằm ở bước xác nhận.

### Hàm: `locationAt(id, warehouseId, kinds, session)`

[stock.js:36](../../../src/shared/utils/stock.js) — `WarehouseLocation.findOne({ _id, warehouseId, isActive: true })` và `locationType` phải nằm trong `kinds`; sai ⇒ "Vị trí không thuộc kho hoặc sai loại".

## 2.8. Bước 6b — Sửa kiểm nhận: `updateInspection(user, id, input)`

[goods-inspection.service.js:161](../../../src/modules/goods-inspections/goods-inspection.service.js)

- `inspectionSource()` ([goods-inspection.service.js:30](../../../src/modules/goods-inspections/goods-inspection.service.js)) đọc kiểm nhận + hàng đến. Cả hai phải `DRAFT`. PO phải còn mở, đúng `expectedPoVersion`. Gọi lại `prepare()` (thay toàn bộ dòng), cập nhật header hàng đến, `saveVersion` cả hai.

## 2.9. Bước 7 — Xác nhận kiểm nhận: `confirmInspection(user, id, input)`

[goods-inspection.service.js:189](../../../src/modules/goods-inspections/goods-inspection.service.js). Route `POST /api/goods-inspections/:id/confirm`, quyền `goods_receipt_inspection:update` (`checkPermission` ở route, kiểm lại trong `command()`).

- **Vai trò nghiệp vụ:** chốt kết quả kiểm; tách hàng được nhận mua và hàng giữ hộ thành hai chứng từ riêng.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input.destinations[]` | `{ inspectionItemId, locationId }` | Vị trí RECEIVING cho **mỗi** dòng `ACCEPT`. |
| `input.expectedPoVersion` | int | Khóa PO. |
| `quantities` | kết quả `purchaseOrderQuantities` | Hạn mức nhận của từng dòng PO. |
| `free` | `Map<poLineId, Decimal>` | Bắt đầu = `acceptanceHeadroomQtyBase`, trừ dần theo từng dòng `ACCEPT`. |
| `accepted` | dòng kiểm | `ownershipDecision === 'ACCEPT'`. |
| `receipt` | `PurchaseReceipt` \| null | `PNM-...` `DRAFT` nếu có dòng `ACCEPT`. |
| `held` | dòng kiểm | `ownershipDecision === 'CUSTODY'`. |
| `custody` | `CustodyReceipt` | `PNGH-...` với `ownerType: 'SUPPLIER'`. |
| `refs[]` | | `resultRefs` trả về mã phiếu nhập và/hoặc phiếu giữ hộ. |

- **Logic:**

  1. Điều kiện đầu vào:

  ```js
  if (inspection.workflowStatus !== "DRAFT" || !inspection.items.length) throw validationError("Chỉ xác nhận hồ sơ nháp có dòng hàng");
  ...
  if (accepted.some((row) => row.details.qualityCode !== "GOOD")) throw validationError("Chỉ GOOD được nhận sở hữu");
  if (inspection.items.some(row => row.details.qualityCode !== 'GOOD' && row.details.ownershipDecision !== 'CUSTODY'))
    throw validationError('Hàng chưa đạt phải tạm giữ chờ trả nhà cung cấp');
  ...
  if (accepted.some((row) => row.details.qualityCode !== "GOOD")) throw validationError("Chỉ GOOD được nhận sở hữu");
  if (destinations.length !== accepted.length || new Set(destinations.map((row) => row.inspectionItemId)).size !== accepted.length)
    throw validationError("Chọn vị trí nhập cho từng phần nhận sở hữu");
  ```

  Mỗi vị trí trong `destinations` được kiểm bằng `locationAt(..., ['RECEIVING'])` (đúng kho, đang hoạt động) và ghi lại vào `item.details.receivingLocationId` của dòng kiểm.

  2. Chống nhận vượt PO — trừ dần hạn mức theo dòng PO:

  ```js
  const left = free.get(String(poItem._id)).minus(String(item.qtyBase));
  if (left.lt(0)) throw validationError("Tổng nhận vượt phần PO còn được nhận");
  free.set(String(poItem._id), left);
  ```

  *Tại sao:* một dòng PO có thể về thành nhiều lô ⇒ nhiều dòng kiểm cùng trỏ một dòng PO; hạn mức đã trừ phiếu nháp khác (`acceptanceHeadroomQtyBase`) nên hai xe hàng kiểm song song không vượt được.

  3. Tạo dòng phiếu nhập, giữ đủ liên kết ngược:

  ```js
  receipt.items.push(copyItem(item, item.qtyBase, {
    lineNo: i + 1, lineKind: "STANDARD", purchaseOrderItemId: poItem._id, arrivalItemId: source._id,
    inspectionId: inspection._id, inspectionResultId: item._id, destinationLocationId: destination.locationId,
    sources: [sourceLink(inspection, item, item.qtyBase)],
  }));
  ```

  4. Hàng giữ hộ thành chứng từ riêng, **không** cộng vào tồn của cửa hàng:

  ```js
  const custody = await newDocument(CustodyReceipt, "CRCV", actor, { warehouseId: po.header.warehouseId, ownerType: "SUPPLIER", ownerId: po.header.supplierId });
  ```

  5. Chốt trạng thái và "chạm" PO:

  ```js
  inspection.workflowStatus = "CONFIRMED";
  arrival.workflowStatus = "RECORDED";
  await saveVersion(arrival, arrival.version, session);
  await saveVersion(po, po.version, session);
  ```

  *Tại sao:* tăng version PO để mọi thao tác song song khác trên cùng PO (xác nhận kiểm khác, đóng PO) phải tải lại — hạn mức nhận vừa thay đổi.

- Dòng `REJECT` (hàng `GOOD` bị từ chối tại cửa) **không** đi vào phiếu nhập hay giữ hộ; chỉ còn lại trên phiếu kiểm như bằng chứng.

- Trước khi ghi tồn, có thể đổi bãi tiếp nhận bằng `PATCH /goods-receipts/purchase/:id/destinations` → `changeDestinations()` ([purchase-receipt.service.js:109](../../../src/modules/goods-receipts/purchase-receipt.service.js)), chỉ khi phiếu nhập còn `DRAFT`.

---

## 2.10. Bước 8 — Ghi tồn phiếu nhập mua: `postReceipt(user, id, input)`

[purchase-receipt.service.js:18](../../../src/modules/goods-receipts/purchase-receipt.service.js). Route `POST /api/goods-receipts/purchase/:id/post`, quyền `goods_receipt_inspection:post` (`checkPermission` ở route, kiểm lại trong `command()`).

- **Vai trò nghiệp vụ:** thời điểm **hàng chính thức thành tồn kho của cửa hàng** (tại bãi tiếp nhận).
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input.expectedVersion` / `expectedPoVersion` | int | Khóa phiếu nhập và PO. |
| `input.packaging[]` | `{ lineId, portions: [{ packagingState, sealedPackCount?, quantityBase, measuredVolumeMm3?, packagingSnapshot? }] }` | Khai kiện thủ công (tùy chọn). Không khai ⇒ hệ thống tự tách theo quy cách lô. |
| `receipt` | `PurchaseReceipt` | Phiếu `DRAFT`. |
| `quantities` | | Kiểm không phiếu nháp nào làm PO âm hạn mức. |
| `locations` | ObjectId[] | Các vị trí đích, để khóa và kiểm sức chứa. |
| `posting` | `StockTransaction` | Bút toán sổ cái `operation: 'PURCHASE_RECEIPT'`. |
| `inspection`, `source` | | Dòng kiểm gốc của từng dòng phiếu nhập. |
| `target` | `InventoryBalance` | Balance tại (vị trí đích, lô, `GOOD`, `STORE`). |
| `portions` | mảng kiện | Từ `intakePortions`. |
| `remaining` | | Lượng PO còn lại sau khi ghi, quyết định trạng thái PO. |
| Trả về | `{ document, versionBefore, stockTransactionId }` | `stockTransactionId` vào `operation_records` và `audit_logs`. |

- **Tương tác DB:** `Warehouse` (khóa `stockOperationVersion`), `WarehouseLocation` (khóa + kiểm), `StocktakeLocationLock`, `GoodsInspection`, `StockHoldingPoint` (find/create), `InventoryBalance` (find/create/update có version), `ProductBatch`, `Product`, `StockTransaction.save`, `saveVersion(GR)`, `saveVersion(PO)`.
- **Logic:**

  1. Kiểm phiếu, PO, hạn mức, kiện:

  ```js
  if (receipt.workflowStatus !== "DRAFT" || !receipt.items.length) throw validationError("Phiếu không còn nháp hoặc không có lượng nhập");
  const po = await activePo(actor, receipt.header.purchaseOrderId, input.expectedPoVersion, session);
  const quantities = await purchaseOrderQuantities(po, session);
  if (quantities.some((row) => exact(row.acceptanceHeadroomQtyBase).lt(0))) throw validationError("Các phiếu nhập vượt hạn mức PO");
  checkPackagingLines(receipt, input.packaging);
  ```

  2. Khóa kho, khóa vị trí và mở bút toán:

  ```js
  const locations = receipt.items.map((row) => row.destinationLocationId);
  await guardLocations(locations, session);
  const posting = beginStock(receipt, actor, "PURCHASE_RECEIPT", input);
  ```

  3. Với từng dòng: đối chiếu lại dòng kiểm gốc (đúng lô, sản phẩm, lượng, `GOOD` + `ACCEPT`), kiểm vị trí, lấy balance, tính kiện, cộng tồn:

  ```js
  if (!source || source.details.qualityCode !== "GOOD" || source.details.ownershipDecision !== "ACCEPT" ||
      !same(source.lotId, item.lotId) || !same(source.productId, item.productId) || !exact(source.qtyBase).eq(String(item.qtyBase)))
    throw validationError("Nguồn nhận sở hữu không hợp lệ");
  ...
  const target = await balanceAt({ type: "LOCATION", locationId: item.destinationLocationId },
    { batchId: item.lotId, ownerType: "STORE", ownerId: null }, source.details.qualityCode, session);
  const portions = await intakePortions(item, source.details.packagingCondition,
    input.packaging?.find((row) => same(row.lineId, item._id))?.portions, session);
  await receiveStock(target, item, portions, posting, actor, session, source.details.packagingCondition);
  ```

  Trước `balanceAt`, vị trí đích của dòng được kiểm lại bằng `locationAt(item.destinationLocationId, ..., ['RECEIVING'])`.

  *Tại sao:* phiếu nhập nháp có thể bị sửa vị trí; phiếu kiểm là nguồn sự thật về lượng và chất lượng, nên đối chiếu lại tại thời điểm ghi tồn. Dòng có `custodyBalanceId` (hàng giữ hộ được chuyển thành mua) đi nhánh `postOwnedCustody` (giải thích ở 2B.8.5).

  4. Kiểm sức chứa, lưu sổ cái, cập nhật phiếu và PO:

  ```js
  await verifyCapacity(locations, session);
  await posting.save({ session });
  receipt.workflowStatus = "POSTED";
  receipt.stockTransactionId = posting._id;
  receipt.postedBy = actor._id; receipt.postedAt = new Date(); receipt.header.receivedAt = new Date();
  ...
  const remaining = await purchaseOrderQuantities(po, session);
  if (remaining.every((row) => exact(row.outstandingQtyBase).isZero())) {
    // Fully settled with a short-closed line: CLOSED, not COMPLETED (user decision 23/11/2026).
    const shortClosed = remaining.some((row) => exact(row.cancelledQtyBase).gt(0));
    po.workflowStatus = shortClosed ? "CLOSED" : "COMPLETED";
    if (shortClosed) po.header.closedAt = new Date();
  } else po.workflowStatus = "PARTIAL";
  await saveVersion(po, po.version, session);
  ```

  *Tại sao `CLOSED`:* PO có dòng đã chốt thiếu không phải "giao đủ". Khi phần nhận dở cuối cùng về hết, PO kết thúc ở `CLOSED` giống trường hợp chốt thiếu cuối cùng (2B.3.3). PO `CLOSED` chỉ quay lại nhận hàng qua lệnh mở lại (2B.3.4).

### Hàm: `guardLocations(ids, session)` và `guardWarehouses(ids, session)`

[stock.js:18](../../../src/shared/utils/stock.js), [stock.js:12](../../../src/shared/utils/stock.js)

```js
// guardWarehouses: khóa từng kho theo thứ tự id
const warehouse = await Warehouse.findOneAndUpdate({ _id: warehouseId, isActive: true }, { $inc: { stockOperationVersion: 1 } }, { session, returnDocument: 'after', timestamps: false });
if (!warehouse) throw validationError('Kho đã ngừng hoạt động');

// guardLocations: trước tiên khóa kho của các vị trí, rồi khóa từng vị trí
const scoped = await WarehouseLocation.find({ _id: { $in: ids.filter(Boolean) } }).select('warehouseId').session(session);
await guardWarehouses(scoped.map(location => location.warehouseId), session);
for (const locationId of [...new Set(ids.filter(Boolean).map(String))].sort()) {
  const location = await WarehouseLocation.findOneAndUpdate({ _id: locationId, isActive: true }, { $inc: { operationVersion: 1 } }, { session, returnDocument: 'after' });
  if (!location || !await Warehouse.exists({ _id: location.warehouseId, isActive: true }).session(session)) throw validationError('Kho hoặc vị trí đã ngừng hoạt động');
  if (await StocktakeLocationLock.exists({ locationId, status: 'LOCKED' }).session(session)) throw validationError('Vị trí đang khóa kiểm kê');
}
```

*Tại sao:* `$inc operationVersion` biến vị trí thành "khóa": hai giao dịch cùng ghi tồn vào một vị trí sẽ xung đột ghi, một bên chạy lại và thấy tồn mới (quan trọng cho kiểm sức chứa). Sắp xếp id để mọi giao dịch khóa cùng thứ tự. Vị trí đang kiểm kê thì không được động vào. Khóa thêm `Warehouse.stockOperationVersion` làm **mọi lệnh ghi tồn trong cùng một kho chạy tuần tự** với nhau và với lệnh khởi tạo tồn đầu kỳ, kể cả khi chúng chạm các vị trí khác nhau (comment trong code: "Initialization and ordinary stock commands serialize on the same warehouse").

### Hàm: `beginStock(document, user, operation, input)`

[stock.js:131](../../../src/shared/utils/stock.js#L131)

```js
const requestHash = hash({ document: String(document._id), operation, input });
return new StockTransaction({ sourceType: document.constructor.collection.name, sourceId: document._id,
  operation, eventKey: String(document.version), requestKey: hash({ user: String(user._id), document: String(document._id), operation, key: input.operationKey ?? input.idempotencyKey }),
  requestHash, performedBy: user._id, occurredAt: new Date(), recordedAt: new Date(), movements: [] });
```

*Tại sao:* unique `(sourceId, operation, eventKey)` với `eventKey = version` đảm bảo một version của chứng từ chỉ ghi sổ một lần; unique `requestKey` chặn cùng thao tác ghi hai lần.

### Hàm: `balanceAt(pointFields, source, qualityStatus, session)`

[stock.js:51](../../../src/shared/utils/stock.js)

```js
let point = await StockHoldingPoint.findOne(pointFields).session(session);
if (!point) point = await new StockHoldingPoint(pointFields).save({ session });
const fields = { holdingPointId: point._id, batchId: source.batchId, qualityStatus, ownerType: source.ownerType, ownerId: source.ownerId ?? null };
return await InventoryBalance.findOne(fields).session(session) ??
  await new InventoryBalance({ ...fields, quantityBase: '0', version: 0, packagingPortions: [] }).save({ session });
```

*Tại sao:* tồn được lưu theo khóa **(vị trí, lô, chất lượng, chủ hàng)**; balance chỉ được tạo lần đầu khi có hàng vào. Cùng lô vào cùng vị trí từ hai phiếu nhập khác nhau sẽ dồn vào **một** balance. Đây cũng chính là số dư mà Bước 9 (Chuyển vị trí) chọn làm nguồn.

### Hàm: `intakePortions(item, condition, portions, session)`

[intake-packaging.js:6](../../../src/shared/utils/intake-packaging.js) (cùng `checkPackagingLines` ở [dòng 40](../../../src/shared/utils/intake-packaging.js), dùng chung cho cả phiếu nhập mua, giữ hộ và nhập khác)

- **Vai trò:** kiểm phần khai kiện thủ công (nếu có) khớp quy cách lô và khớp tình trạng bao bì đã kiểm.
- **Logic:** không khai kiện mà dòng không phải `SEALED` ⇒ trả `undefined` (để `receiveStock` tự tách). Dòng `SEALED` không khai ⇒ lượng phải chia hết `piecesPerCarton`. Có khai:

  ```js
  if (portion.measuredVolumeMm3 != null || exact(portion.extraOccupiedVolumeMm3 ?? "0").gt(0))
    throw validationError("Thùng nguyên tính thể tích theo kích thước lô, không khai thể tích");
  try { assertBatchPackaging(batch, portion.packagingSnapshot); } catch { throw validationError("Quy cách thùng khác quy cách lô"); }
  if (!portion.sealedPackCount || !exact(portion.quantityBase).eq(perCarton.mul(portion.sealedPackCount)))
    throw validationError("Số viên thùng nguyên khác quy cách lô");
  ...
  if (condition === "SEALED" && opened) throw validationError("Dòng kiểm nguyên thùng chỉ khai thùng nguyên");
  if (condition && condition !== "SEALED" && !opened) throw validationError("Dòng kiểm không nguyên thùng phải có phần hàng mở/lẻ");
  ```

### Hàm: `receiveStock(balance, item, portions, posting, user, session, condition)`

[stock.js:275](../../../src/shared/utils/stock.js#L275)

- **Vai trò:** cộng tồn vào balance, gắn kiện, ghi movement.
- **Từ điển biến:** `batch`, `product`, `amount` (= `item.qtyBase`), `packaging` (kiện cuối cùng), `cartonDims`, `hasCartonSize`, `perCarton`, `fullCartons`, `looseQty`, `received` (kiện có `_id` mới, `createdBy`, thể tích ước tính), `before`.
- **Logic:**

  1. Kiểm lô `VERIFIED`, sản phẩm active và khớp, số nguyên nếu `wholeBaseUnits`.
  2. Không có kiện khai tay ⇒ tự tách theo tình trạng bao bì:

  ```js
  if (condition === 'LOOSE' || ['OPENED', 'TORN', 'UNKNOWN'].includes(condition)) {
    packaging = [{ packagingState: condition === 'LOOSE' ? 'LOOSE' : 'OPEN', quantityBase: amount.toFixed(), packagingSnapshot }];
  } else {
    const fullCartons = amount.dividedToIntegerBy(perCarton);
    const looseQty = amount.mod(perCarton);
    if (fullCartons.gt(0)) packaging.push({ packagingState: 'SEALED', sealedPackCount: fullCartons.toNumber(), quantityBase: fullCartons.mul(perCarton).toFixed(), packagingSnapshot });
    if (looseQty.gt(0)) packaging.push({ packagingState: 'LOOSE', quantityBase: looseQty.toFixed(), packagingSnapshot });
  }
  ```

  *Tại sao:* sức chứa ô kệ tính theo **thể tích**; thùng nguyên tính theo kích thước thùng của lô. Kiện `LOOSE`/`OPEN` không khai thể tích được gán `measuredVolumeMm3 = estimateVolume(...)` ([stock.js:264](../../../src/shared/utils/stock.js#L264)): kiện mở theo số thùng làm tròn lên × kích thước thùng, hàng rời theo số viên × kích thước sản phẩm; thiếu kích thước ⇒ lỗi "Thiếu kích thước lô/sản phẩm, cần nhập thể tích thực đo". Nhờ có thể tích này, dòng BF03 `LOOSE` sau đó tách được kiện rời (xem `splitPortions`).

  3. Tổng kiện phải bằng lượng nhập; cộng tồn có khóa version; ghi movement chỉ có đầu `to`:

  ```js
  balance.quantityBase = before.plus(amount).toFixed();
  balance.packagingPortions.push(...received);
  await saveBalance(balance, balance.version, session);
  posting.movements.push({ transactionId: posting._id, lineNo: posting.movements.length + 1,
    packagingPortionIds: received.map(row=>row._id), sourceLineId: item._id, toBalanceId: balance._id,
    quantityBase: amount.toFixed(), toBefore: before.toFixed(), toAfter: balance.quantityBase });
  ```

  `movements[].toBalanceId` của bút toán này là nguồn của `receivingBalanceId` mà chi tiết phiếu nhập trả về cho Bước 9. `packagingPortionIds` vẫn được ghi (cho biết kiện nào sinh ra từ dòng nào), nhưng lệnh chuyển vị trí hiện **không** dùng nó để giới hạn kiện.

### Hàm: `saveBalance(balance, beforeVersion, session)`

[stock.js:194](../../../src/shared/utils/stock.js#L194) — `updateOne({ _id, version: beforeVersion }, { $set: { quantityBase, packagingPortions }, $inc: { version: 1 } })`; không khớp ⇒ 409 "Tồn đã thay đổi".

### Hàm: `verifyCapacity(locationIds, session)`

[stock.js:248](../../../src/shared/utils/stock.js#L248) — nạp mọi điểm giữ hàng, balance, vị trí, kho, lô của các vị trí liên quan rồi gọi `checkBinCapacity` ([capacity.js](../../../src/models/capacity.js)): ô phải có kích thước, kho phải có `clearHeightMm`; mỗi kiện `SEALED` phải đúng quy cách lô và **thùng vừa ô** (`estimateCartonCapacity`); thể tích = thùng nguyên theo kích thước ngoài, kiện mở/lẻ theo `measuredVolumeMm3` hoặc (mới) `volumeUpperBoundMm3`; tổng không vượt dài × rộng × cao. Chạy **sau** khi cộng tồn (vẫn trong transaction) nên vượt sức chứa ⇒ toàn bộ giao dịch rollback.

---

## 2.11. Bước 9a — Mở form từ phiếu nhập: `enriched(user, document)`

[purchase-read.service.js:61](../../../src/modules/po-receiving/purchase-read.service.js). Được gọi từ `GET /api/goods-receipts/purchase/:id` (`getDocument`).

- **Vai trò nghiệp vụ:** cho màn hình phiếu nhập biết hàng của từng dòng đang nằm ở **số dư nào** và người xem có được bấm **Chuyển vị trí** không. Thay cho `putawayContext` / `placementQuantities` cũ.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `posted` | bool | Phiếu ở `POSTED`. |
| `value.reversed` | bool | Phiếu `REVERSED` hoặc bút toán nhập đã có bút toán đảo (`reversedTransactionId`). |
| `posting` | `StockTransaction` (lean) | Bút toán nhập, chỉ lấy `movements.sourceLineId`, `movements.toBalanceId`. |
| `item.receivingBalanceId` | string | Số dư (ở vị trí `RECEIVING`) mà dòng phiếu đã cộng vào. |
| `value.capabilities.relocate` | bool | Hiện nút Chuyển vị trí. |

- **Logic:**

  ```js
  if (kind === 'PURCHASE') {
    value.reversed = document.workflowStatus === 'REVERSED' ||
      Boolean(document.stockTransactionId && await StockTransaction.exists({ reversedTransactionId: document.stockTransactionId }));
    if (posted && !value.reversed && document.stockTransactionId) {
      const posting = await StockTransaction.findById(document.stockTransactionId).select('movements.sourceLineId movements.toBalanceId').lean();
      for (const item of value.items) {
        const movement = posting?.movements.find(move => move.toBalanceId && same(move.sourceLineId, item._id));
        if (movement) item.receivingBalanceId = String(movement.toBalanceId);
      }
    }
  }
  ...
  relocate: kind === 'PURCHASE' && posted && writeWarehouse && !value.reversed && hasPermission(user, 'stock_relocation:create'),
  ```

  *Tại sao:* sau khi gỡ lệnh cất mua, phiếu nhập chỉ cần "chỉ đường" sang BF03. Phiếu đã đảo thì không cho chuyển. Lưu ý `receivingBalanceId` là số dư **dùng chung** theo (vị trí, lô, chất lượng, chủ hàng) nên có thể chứa cả hàng của phiếu khác; FE phải tự kiểm số lượng muốn chuyển.

- **Dữ liệu dòng (từ 20/11/2026):** dòng đầu tiên của `enriched` gọi `enrichLineItems(value.items)` ([document-items.js:46](../../../src/shared/utils/document-items.js)). Hàm gắn thêm vào mỗi dòng, chỉ khi dòng chưa có: `productSkuSnapshot`, `productNameSnapshot`, `productSpec` (`sku`, `name`, `manufacturerCode`, `material`, `surface`, `color`, kích thước, `description`, `baseUnit`), `lotLabelSnapshot`, `lotSpec` (`manufacturerLot`, `tone`, `calibre`, `piecesPerCarton`), `destinationLocationCode`, `destinationLocationName` (vị trí lấy từ `destinationLocationId` hoặc `details.receivingLocationId`). Hàm này thay `addLotLabels` cũ và cũng được dùng ở chi tiết/danh sách PO, `inspectionContext` và chi tiết chung `GET /api/goods-receipts/:id`. Chỉ đọc, không ghi DB.
- **Phiếu nhập mua ở `getDocument`** ([purchase-read.service.js:136](../../../src/modules/po-receiving/purchase-read.service.js)) thêm `header.purchaseOrderNo` và `items[].poLineNote`. Riêng Owner/Kế toán (`financial(user)`) có `items[].unitPurchasePrice`, `poEnteredUnit`, `receivedLineAmount` (bằng `lineAmount` của dòng PO khi nhận đủ, ngược lại `đơn giá × qtyBase ÷ baseUnitsPerUnit` làm tròn 6 chữ số).
- **Các `capabilities` khác** mà màn hình kiểm nhận, phiếu nhập và giữ hộ dùng:

| Khả năng | Điều kiện |
|---|---|
| `edit` | Chứng từ `DRAFT` + quyền `:update` trong kho. |
| `confirm` | Kiểm nhận `DRAFT` + `:update`. |
| `correct` | Kiểm nhận `CONFIRMED`, chưa có bản thay thế (`value.replacedBy` rỗng) + `:update`. |
| `post` | `DRAFT` + `:post`; phiếu nhập từ giữ hộ (`custodyDecisionId`) cần thêm `purchase_custody:execute`; phiếu giữ hộ chỉ khi chủ hàng là NCC. |
| `cancel` | `DRAFT` + `:update`; phiếu giữ hộ chỉ khi chủ hàng là NCC. |
| `reversePreflight` | Phiếu nhập mua hoặc giữ hộ NCC `POSTED` + `:post` + `:reverse`. |
| `relocate` | Phiếu nhập mua `POSTED`, chưa đảo + `stock_relocation:create`. |
| `createSupplierReturn` | Phiếu giữ hộ NCC `POSTED` + `supplier_return:create`. |

  Chi tiết kiểm nhận còn trả `replacedBy` (`_id`, `documentNo`, `workflowStatus` của bản kiểm thay thế chưa hủy), `receipts` và `custodyReceipts` sinh từ phiếu kiểm.

## 2.12. Bước 9b — Dữ liệu cho form BF03: `locationMovementOptions(user, warehouseId)`

[location-movement.service.js:103](../../../src/modules/location-movements/location-movement.service.js). Route `GET /api/location-movements/options`, quyền `stock_relocation:create`.

- **Vai trò:** trả mọi thứ form cần mà không ghi gì: danh sách kho người dùng được vào, các vị trí đang hoạt động, điểm giữ hàng, **số dư > 0**, lô, sản phẩm, đơn vị và quy đổi.
- **Tương tác DB (chỉ đọc, không session):**

  ```js
  const locations = await WarehouseLocation.find({ warehouseId, isActive: true }).select(optionFields.location).lean();
  const points = await StockHoldingPoint.find({ locationId: { $in: locations.map(row=>row._id) } }).select(optionFields.point).lean();
  const frozen = await stocktakeLockedLocations(locations.map(row => row._id));
  const frozenPoints = new Set(points.filter(row => frozen.has(String(row.locationId))).map(row => String(row._id)));
  const balances = (await InventoryBalance.find({ holdingPointId: { $in: points.map(row=>row._id) }, quantityBase: { $gt: 0 } })
    .select(optionFields.balance+' packagingPortions.sealedPackCount packagingPortions.quantityBase').lean()).filter(row => !frozenPoints.has(String(row.holdingPointId)));
  ```

  Không có `warehouseId` ⇒ chỉ trả `warehouses`. Có ⇒ `requireWarehouseAccess`. Các trường được chọn lọc (`optionFields`) khai trong [movement-read-fields.js](../../../src/shared/utils/movement-read-fields.js). Số dư trả về có `version` để client gửi lại làm `sourceBalanceVersion`, kèm `packagingPortions.packagingState/sealedPackCount/quantityBase` để form hiện "Thùng nguyên / Trong thùng mở / Hàng rời" và giới hạn riêng phần thùng nguyên, phần rời.


  Từ 22/11/2026, phiếu kiểm kê hiển thị tồn sổ. Lệnh kho vẫn kiểm tra khóa vị trí khi thao tác. Xem [vòng đời kiểm kê](../08_api/STOCKTAKE_LIFECYCLE.md).

  `stocktakeLockedLocations` ([stock.js:30](../../../src/shared/utils/stock.js)) tìm vị trí có khóa kiểm kê `LOCKED`. API loại số dư tại các vị trí đó khỏi nguồn chuyển của mọi vai trò và vẫn trả vị trí kèm `lockedByStocktake` để form vô hiệu hóa lựa chọn.


## 2.13. Bước 9 — Lập lệnh chuyển vị trí: `createLocationMovement(user, input)`

[location-movement.service.js:71](../../../src/modules/location-movements/location-movement.service.js). Route `POST /api/location-movements`: `checkPermission('stock_relocation:create')` + `validate(createSchema)` ([location-movement.validation.js:11](../../../src/modules/location-movements/location-movement.validation.js)). Controller trả 201 lần đầu, 200 khi replay.

- **Vai trò nghiệp vụ:** lập kế hoạch đưa hàng từ bãi tiếp nhận lên kệ (hoặc giữa hai vị trí bất kỳ trong kho). Chưa di chuyển tồn.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input.idempotencyKey` | string ≤64, `[\w.-]` | Khóa chống tạo trùng (`command()` đọc `idempotencyKey` khi không có `operationKey`/`creationKey`). |
| `input.warehouseId` | ObjectId | Kho của lệnh. |
| `input.reason` | string 1–2000 | Lý do chuyển, lưu ở `header.reason`. |
| `input.lines[]` | 1–100 dòng `{ sourceBalanceId, sourceBalanceVersion, toLocationId, enteredUnit, enteredQty, packagingState? }` | Mỗi dòng: lấy từ số dư nào (đúng version đã xem), đến vị trí nào, bao nhiêu (số **nguyên** thùng hoặc viên). `packagingState` (`SEALED`/`LOOSE`, tùy chọn) chỉ định lấy từ thùng nguyên hay hàng rời. Zod cho mỗi cặp (nguồn, đích) tối đa một dòng mỗi loại; trùng loại, hoặc trộn dòng không có loại với dòng có loại, bị từ chối. |
| `document` | `TransferOrder` | `LCV-...`, `OPEN`, `version: 1`, `header: { warehouseId, taskKind: 'RELOCATE', assignedTo: actor, reason }`. |

- **Logic:**

  ```js
  requireWarehouseAccess(actor, input.warehouseId);
  const document = await new TransferOrder({ ...await nextDocumentFields(TransferOrder, 'TO', input.warehouseId, session), workflowStatus: 'OPEN', version: 1, createdBy: actor._id,
    header: { warehouseId: input.warehouseId, taskKind: 'RELOCATE', assignedTo: actor._id, reason: input.reason },
    items: await relocationItems(actor, input.warehouseId, input, session) }).save({ session });
  ```

  `authorizeReplay` là `task(id, …)` ([dòng 17](../../../src/modules/location-movements/location-movement.service.js)): `scopedDocument` + lệnh phải có `taskKind: 'RELOCATE'`.

### Hàm: `relocationItems(user, warehouseId, input, session, excludeTaskId, previous = [])`

[location-movement.service.js:44](../../../src/modules/location-movements/location-movement.service.js) — dùng chung cho tạo và sửa lệnh.

- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `ctx` | `{ balance, point, batch, product, location }` | Bối cảnh số dư nguồn (`sourceContext`). |
| `old` | dòng lệnh cũ | Khi sửa: dòng cùng (nguồn, đích, `packagingState`) để giữ `_id` và hệ số quy đổi cũ. |
| `inPool` | function | Lọc kiện theo `line.packagingState`; dòng không có loại ⇒ mọi kiện. |
| `item` | kết quả `makeItem` | Dòng `lineKind: 'WAREHOUSE_TASK'`, quy đổi theo **lô** của số dư. |
| `packaging` | `Map<balanceId, kiện còn lại>` | Mô phỏng tách kiện qua nhiều dòng lấy cùng một số dư. |
| `totals` | `Map<balanceId, Decimal>` | Tổng lượng lấy từ mỗi số dư trong request. |
| `pending` | Decimal | Lượng các lệnh khác đang chờ trên số dư (`pendingTaskQuantity`, loại trừ chính lệnh khi sửa). |
| Trả về | mảng dòng | Mỗi dòng có `details: { sourceBalanceId, sourceBalanceVersion, fromLocationId, toLocationId, qualityCode, ownerType, ownerId, packagingState? }`. |

- **Logic từng bước:**

  1. Số dư nguồn phải ở một vị trí của đúng kho, sản phẩm còn hoạt động, lô `VERIFIED`, và **chưa bị ai đổi** kể từ lúc mở form:

  ```js
  const ctx = await sourceContext(line.sourceBalanceId, session);
  if (!ctx.location || !ctx.product.isActive || ctx.batch.identificationStatus !== 'VERIFIED' || !same(ctx.location.warehouseId, warehouseId)) throw validationError('Tồn nguồn không hợp lệ');
  if (ctx.balance.version !== line.sourceBalanceVersion) throw versionConflict('Tồn nguồn đã thay đổi', ctx.balance.version);
  ```

  2. Đích là vị trí đang hoạt động cùng kho thuộc **bất kỳ loại** nào trong năm loại, khác nguồn; lượng phải là số nguyên:

  ```js
  await locationAt(line.toLocationId, warehouseId, ['RECEIVING','STORAGE','STAGING','QUARANTINE','CUSTODY'], session);
  if (same(ctx.location._id, line.toLocationId)) throw validationError('Vị trí nguồn và đích trùng nhau');
  if (typeof line.enteredQty !== 'string' || !/^\d+$/.test(line.enteredQty)) throw validationError('Số thùng hoặc viên phải là số nguyên');
  ```

  3. Quy đổi bằng `makeItem` theo lô của số dư (đơn vị thùng ⇒ quy đổi theo lô), kết quả đơn vị gốc cũng phải nguyên:

  ```js
  const item = await makeItem({ ...line, productId: ctx.product._id, lotId: ctx.batch._id }, index + 1, session, { lineKind: 'WAREHOUSE_TASK', previous: old });
  if (!exact(item.qtyBase).isInteger()) throw validationError('Số thùng hoặc viên phải là số nguyên');
  ```

  4. Tách kiện thử trên các kiện của số dư (không giới hạn theo dòng phiếu nhập) thuộc đúng loại `packagingState` của dòng, rồi kiểm không vượt tồn còn lại sau các lệnh khác:

  ```js
  const portions = packaging.get(String(ctx.balance._id)) ?? ctx.balance.packagingPortions;
  const inPool = portion => !line.packagingState || portion.packagingState === line.packagingState;
  const split = splitPortions(portions.filter(inPool), item.qtyBase, user._id, { allowLooseSplit: line.packagingState === 'LOOSE' });
  const kept = new Map(split.kept.map(portion => [String(portion._id), portion]));
  packaging.set(String(ctx.balance._id), portions.flatMap(portion => inPool(portion) ? kept.has(String(portion._id)) ? [kept.get(String(portion._id))] : [] : [portion]));
  const total = (totals.get(String(ctx.balance._id)) ?? exact('0')).plus(item.qtyBase); totals.set(String(ctx.balance._id), total);
  const pending = await pendingTaskQuantity(ctx.balance._id, session, excludeTaskId);
  if (total.plus(pending).gt(String(ctx.balance.quantityBase))) throw validationError('Tồn nguồn đã được lập lệnh khác');
  ```

  *Tại sao:* `splitPortions` không bật `allowOpening` nên không bao giờ tự mở thùng — lỗi ngay lúc lập lệnh thay vì lúc xác nhận. Dòng `SEALED` chỉ lấy nguyên thùng. Dòng `LOOSE` bật `allowLooseSplit`, được tách một kiện `LOOSE` có thể tích đo hoặc cận trên thể tích đã biết; thiếu thể tích thì vẫn bị chặn. Dòng không có loại (lệnh cũ) giữ cách cũ: chỉ lấy trọn kiện hoặc số thùng nguyên. Map `packaging` giữ các kiện ngoài loại của dòng, nên dòng `SEALED` và dòng `LOOSE` cùng nguồn được mô phỏng nối tiếp đúng.

  5. Ghi ảnh số dư vào dòng, khóa kho + vị trí nguồn/đích:

  ```js
  result.push({ ...item, details: { sourceBalanceId: ctx.balance._id, sourceBalanceVersion: ctx.balance.version,
    fromLocationId: ctx.location._id, toLocationId: line.toLocationId, qualityCode: ctx.balance.qualityStatus,
    ownerType: ctx.balance.ownerType, ownerId: ctx.balance.ownerId, ...(line.packagingState && { packagingState: line.packagingState }) } });
  ...
  await guardLocations(result.flatMap(item => [item.details.fromLocationId, item.details.toLocationId]), session);
  ```

  *Tại sao:* lệnh `OPEN` có `sourceBalanceId` nên `pendingTaskQuantity`/`freeQuantity` tự trừ phần này khỏi tồn tự do; đơn bán hay lệnh khác không lấy chồng được.

### Hàm: `pendingTaskQuantity(balanceId, session, excludeTaskId)`

[stock.js:59](../../../src/shared/utils/stock.js) — tổng `qtyBase − đã thực hiện` của mọi `TransferOrder` `OPEN/DRAFT/PARTIAL` có dòng lấy từ balance này (đã thực hiện = tổng movement của lệnh đó từ balance này).

### Hàm: `splitPortions(portions, quantity, actorId, { allowOpening = false, allowLooseSplit = false })`

[stock.js:140](../../../src/shared/utils/stock.js#L140)

- Chế độ mặc định (`allowOpening: false`, `allowLooseSplit: false`) — dùng ở lập và xác nhận dòng chuyển `SEALED` hoặc dòng không có loại:

  ```js
  if (remaining.gte(available)) { taken.push(portion); remaining = remaining.minus(available); continue; }
  if (portion.packagingState !== 'SEALED' || portion.measuredVolumeMm3 != null || ...)
    throw validationError('Phần hàng mở/lẻ cần được đo và tách quy cách trước khi chuyển một phần');
  const packs = remaining.div(String(portion.packagingSnapshot.baseUnitsPerPackage));
  if (!packs.isInteger()) throw validationError('Không tự mở thùng; chọn lượng nguyên thùng hoặc phần hàng lẻ đã đo');
  ```

  Lấy trọn kiện theo thứ tự; chỉ kiện `SEALED` được chia, và chỉ chia theo số thùng nguyên.

- Chế độ `allowLooseSplit: true` — dòng chuyển `LOOSE`: chỉ áp cho kiện `LOOSE`. Kiện bị tách thành hai mảnh `LOOSE` (phần lấy, phần giữ lại), cả hai mang `volumeUpperBoundMm3` = thể tích đo hoặc cận trên của kiện gốc (cộng `extraOccupiedVolumeMm3`), không chia tỷ lệ. Không có thể tích dương đã biết ⇒ lỗi "Thiếu kích thước hoặc giới hạn thể tích đã biết để mở/tách thùng". Cận trên giữ nguyên nên kiểm sức chứa có thể từ chối ô đích chật.
- Chế độ `allowOpening: true` (chỉ luồng **xuất** dùng): ưu tiên lấy kiện lẻ trước, cho phép **mở thùng**; phần thùng bị mở thành kiện `OPEN` với `volumeUpperBoundMm3` = thể tích thùng (cận trên) để `checkBinCapacity` vẫn tính được sức chứa. Luồng nhập/chuyển vị trí trong tài liệu này không bật chế độ này.

## 2.14. Bước 9c — Sửa / hủy lệnh: `editLocationMovement`, `cancelLocationMovement`

[location-movement.service.js:120](../../../src/modules/location-movements/location-movement.service.js), [location-movement.service.js:130](../../../src/modules/location-movements/location-movement.service.js). Route `PATCH /api/location-movements/:id` (mã lệnh `EDIT_RELOCATION`) và `POST /api/location-movements/:id/cancel` (`CANCEL_RELOCATION`). Cả hai dùng quyền `stock_relocation:create` và **chỉ người lập** được làm.

- **Vai trò nghiệp vụ:** điều chỉnh kế hoạch cất hàng trước khi bắt đầu chuyển (`OPEN`), hoặc dừng/hủy phần chưa chuyển khi đang chuyển dở (`PARTIAL`) — ví dụ khi số dư nguồn bị phiếu nhập mới làm tăng `version` (xem rủi ro 3.1 điểm 6) nên không xác nhận tiếp được.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input.expectedVersion` | int | Khóa lạc quan của lệnh `TransferOrder`. |
| `input.idempotencyKey` | string | Khóa chống gửi trùng. |
| `input.reason` | string | Lý do sửa (`header.reason`) hoặc lý do hủy (`cancelReason`). |
| `input.lines[]` | như 2.13 (chỉ `editLocationMovement`) | Danh sách dòng thay thế hoàn toàn `document.items`. |

- **Logic `editLocationMovement`:**

  ```js
  const document = await task(id, actor, session); checkVersion(document, input.expectedVersion);
  if (!same(document.createdBy, actor._id)) throw forbiddenError('Chỉ người lập được sửa lệnh');
  if (document.workflowStatus !== 'OPEN') throw validationError('Lệnh không còn mở');
  document.items = await relocationItems(actor, document.header.warehouseId, input, session, id, document.items);
  document.header.reason = input.reason;
  return { document: await saveVersion(document, input.expectedVersion, session), versionBefore: input.expectedVersion };
  ```

  *Tại sao:* chỉ cho sửa khi `OPEN` vì khi đã `PARTIAL` một phần lượng đã ghi sổ cái (`StockTransaction` trỏ `sourceLineId`); sửa dòng lúc đó sẽ làm lệch đối chiếu đã chuyển/còn lại. Truyền `excludeTaskId = id` để `pendingTaskQuantity` bỏ qua chính lệnh đang sửa (không tự trừ lượng của mình), và truyền `previous = document.items` để giữ nguyên `_id` dòng cũ khi cùng `(sourceBalanceId, toLocationId, packagingState)`.

- **Logic `cancelLocationMovement`:**

  ```js
  const document = await task(id, actor, session); checkVersion(document, input.expectedVersion);
  if (!same(document.createdBy, actor._id)) throw forbiddenError('Chỉ người lập được hủy lệnh');
  if (!['OPEN', 'PARTIAL'].includes(document.workflowStatus)) throw validationError('Lệnh không còn mở');
  await guardLocations(document.items.map(item => item.details.fromLocationId), session);
  document.workflowStatus = 'CANCELLED'; document.cancelReason = input.reason;
  document.cancelledBy = actor._id; document.cancelledAt = new Date();
  return { document: await saveVersion(document, input.expectedVersion, session), versionBefore: input.expectedVersion };
  ```

  *Tại sao khóa vị trí nguồn (`guardLocations`):* để lệnh hủy không chạy chồng với một lệnh xác nhận hoặc lệnh tạo mới đang đọc `pendingTaskQuantity` trên cùng vị trí. Lệnh chuyển sang `CANCELLED` ngay lập tức giải phóng phần lượng "đang chờ", nhưng **không đảo** phần đã chuyển trước đó khi lệnh ở trạng thái `PARTIAL`.
- **Ví dụ thực tế:** Thủ kho lập `LCV-...` chuyển **10 thùng** từ bãi `R-01` lên kệ `A-01-01` (`OPEN`). Lượt 1 xác nhận **6 thùng** ⇒ `LCV` sang `PARTIAL` (4 thùng còn lại đang giữ ở `pendingTaskQuantity`). Sau đó xe mới về nhập thêm hàng cùng lô vào `R-01`, làm `version` của số dư `R-01` tăng lên ⇒ xác nhận 4 thùng còn lại báo 409 *"Tồn đã thay đổi; hủy phần còn lại và lập lại lệnh"*. Thủ kho gọi `POST /location-movements/:id/cancel` ⇒ 6 thùng đã lên `A-01-01` vẫn giữ nguyên, 4 thùng ở `R-01` được giải phóng để lập lệnh mới. BF03 **không có API đảo (`reverse`)** sau khi đã `CONFIRMED`; muốn đưa hàng về lại bãi/ô cũ thì lập một lệnh `RELOCATE` ngược chiều.

## 2.15. Bước 10 — Xác nhận thực chuyển: `confirmLocationMovement(user, id, input)`

[location-movement.service.js:140](../../../src/modules/location-movements/location-movement.service.js). Route `POST /api/location-movements/:id/confirm`, quyền `stock_relocation:confirm`.

- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input.expectedVersion` | int | Version lệnh. |
| `input.idempotencyKey` | string | Khóa chống xác nhận trùng. |
| `input.lines[]` | `{ lineId, actualQtyBase }` | Lượng **thực chuyển** (đơn vị gốc, số nguyên) từng dòng; có thể ít hơn kế hoạch. |
| `document` | `TransferOrder` | Lệnh `OPEN/PARTIAL`, `taskKind: 'RELOCATE'`. |
| `previous` | `StockTransaction[]` | Các bút toán `RELOCATE` trước đó của lệnh (khi đã xác nhận một phần). |
| `moved(item)` | function → Decimal | Đã chuyển của một dòng. |
| `selected[]` | `{ item, quantity }` | Dòng hợp lệ sẽ chuyển lần này. |
| `before` / `after` | `{ _id, version }[]` | Version các số dư nguồn trước/sau, để cập nhật `sourceBalanceVersion` cho lần xác nhận kế tiếp. |
| `posting` | `StockTransaction` | Bút toán `operation: 'RELOCATE'`, `sourceType: 'transfer_orders'`. |
| `destination` | `InventoryBalance` | Số dư ở vị trí đích (cùng lô, chất lượng, chủ hàng). |
| `complete` | bool | Mọi dòng đã chuyển đủ. |

- **Logic:**

  1. Chỉ người lập được xác nhận; lệnh còn mở; dòng không trùng; lượng > 0 và không vượt phần còn lại:

  ```js
  if (!same(document.createdBy,actor._id)) throw forbiddenError('Chỉ người lập được xác nhận lệnh');
  if (!['OPEN', 'PARTIAL'].includes(document.workflowStatus)) throw validationError('Lệnh không còn mở');
  ...
  if (!item || !/^\d{1,14}$/.test(actual.actualQtyBase) || !exact(actual.actualQtyBase).gt(0) || exact(actual.actualQtyBase).gt(exact(item.qtyBase).minus(moved(item))))
    throw validationError('Lượng thực chuyển phải lớn hơn 0 và không vượt phần còn lại');
  ```

  2. Số dư nguồn phải **đúng version đã chụp** trên dòng và vẫn khớp lô/chất lượng/chủ hàng; đích còn hoạt động trong kho:

  ```js
  if (ctx.balance.version !== item.details.sourceBalanceVersion) throw versionConflict('Tồn đã thay đổi; hủy phần còn lại và lập lại lệnh nếu đã chuyển một phần');
  if (!same(ctx.batch._id, item.lotId) || ctx.balance.qualityStatus !== item.details.qualityCode || ctx.balance.ownerType !== item.details.ownerType || ...) throw validationError('Tồn không khớp lệnh');
  await locationAt(item.details.toLocationId, document.header.warehouseId, null, session);
  ```

  *Tại sao:* lệnh đã giữ chỗ trên số dư; nếu số dư bị thay đổi bởi thao tác khác (nhập thêm, xuất, chuyển khác) thì kiện thực tế có thể khác kế hoạch, nên bắt người dùng lập lại.

  3. Khóa kho/vị trí, chuyển tồn từng dòng:

  ```js
  await guardLocations(locations, session);
  const posting = beginStock(document, actor, 'RELOCATE', input);
  for (const { item, quantity } of selected) {
    const ctx = await sourceContext(item.details.sourceBalanceId, session);
    const destination = await balanceAt({ type: 'LOCATION', locationId: item.details.toLocationId }, ctx.balance, ctx.balance.qualityStatus, session);
    await moveStock(ctx.balance._id, destination._id, quantity, item._id, posting, actor, session, { preserveReservations: true, excludeTaskId: id, packagingState: item.details.packagingState });
  }
  ```

  *Tại sao:* `excludeTaskId: id` loại lượng "chờ" của chính lệnh, nếu không `moveStock` sẽ tưởng tồn đã bị giữ hết. `preserveReservations: true` — hàng đã giữ cho đơn bán thì phần giữ đi theo hàng. Không truyền `portionIds`, nên kiện được lấy từ toàn bộ số dư; `packagingState` của dòng giới hạn kiện theo loại và kiểm lại trên tồn thực. Mỗi loại có `_id` dòng riêng nên lượng kế hoạch/đã chuyển/còn lại của thùng nguyên và hàng rời độc lập; xác nhận một phần có thể chuyển một hoặc cả hai loại.

  4. Kiểm sức chứa, lưu sổ cái, cập nhật version số dư trên dòng và trạng thái lệnh:

  ```js
  await verifyCapacity(locations, session); await posting.save({ session });
  ...
  if (old && old.version === item.details.sourceBalanceVersion) item.details.sourceBalanceVersion = after.find(b => same(b._id, old._id)).version;
  ...
  document.workflowStatus = complete ? 'CONFIRMED' : 'PARTIAL';
  if (complete) { document.header.confirmedBy = actor._id; document.header.confirmedAt = new Date(); }
  document.stockTransactionId = posting._id;
  ```

  *Tại sao:* chính lần xác nhận này làm version số dư nguồn tăng; cập nhật lại `sourceBalanceVersion` để lần xác nhận phần còn lại không tự báo xung đột. `stockTransactionId` trỏ bút toán **gần nhất**; chi tiết lệnh (`getLocationMovement`) đọc mọi bút toán theo `sourceId`.

### Hàm: `moveStock(sourceId, destinationId, quantity, itemId, stockTransaction, user, session, opts)`

[stock.js:200](../../../src/shared/utils/stock.js#L200)

- **Vai trò:** chuyển một lượng giữa hai balance **cùng lô, cùng chủ hàng**, kèm kiện và (tùy chọn) giữ hàng.
- **Từ điển biến:** `source`, `destination` (InventoryBalance), `amount`, `from`, `to` (số dư trước), `reservations`, `reserved`, `pending` (lệnh khác chưa có giữ hàng), `inPool` (lọc kiện theo `portionIds` và `packagingState`; chuyển vị trí không truyền `portionIds`, chỉ truyền `packagingState` của dòng nếu có), `allowOpening` (chỉ luồng xuất bật), `allowLooseSplit` (bật khi `packagingState === 'LOOSE'`), `split`, `kept`, `taken`, `movementId`.
- **Logic:**

  ```js
  if (!source || !destination || !same(source.batchId, destination.batchId) || source.ownerType !== destination.ownerType || ...)
    throw validationError('Không đổi lô hoặc chủ hàng khi chuyển tồn');
  if (!amount.gt(0) || amount.gt(from)) throw validationError('Không đủ tồn nguồn');
  ...
  if (amount.plus(pending).plus(preserveReservations ? '0' : reserved).plus(await heldQuantity(sourceId, session)).gt(from))
    throw validationError('Lượng chuyển thuộc phần hàng đang bị chặn');
  if (amount.plus(pending).plus(preserveReservations ? '0' : reserved).gt(from))
    throw validationError('Tồn đã được giữ hoặc lập lệnh khác');
  ...
  const inPool = row => (portionIds === undefined || portionIds.some(id => same(id, row._id))) && (!packagingState || row.packagingState === packagingState);
  const split = splitPortions(source.packagingPortions.filter(inPool), amount, user._id, { allowOpening, allowLooseSplit: packagingState === 'LOOSE' });
  ...
  retainPortions(source, kept);
  destination.packagingPortions.push(...taken);
  source.quantityBase = from.minus(amount).toFixed(); destination.quantityBase = to.plus(amount).toFixed();
  ...
  await saveBalance(source, source.version, session);
  await saveBalance(destination, destination.version, session);
  stockTransaction.movements.push({ _id: movementId, ..., sourceLineId: itemId, fromBalanceId: sourceId, toBalanceId: destinationId,
    quantityBase: amount.toFixed(), fromBefore: from.toFixed(), fromAfter: source.quantityBase, toBefore: to.toFixed(), toAfter: destination.quantityBase });
  ```

  Khi `preserveReservations`, phần giữ hàng vượt quá lượng tự do được "dời" sang balance đích: tăng `movedQty` của giữ hàng cũ, tạo `StockReservation` mới ở đích có `previousReservationId`. Schema `stock_movements` có rule `before ± quantity = after`, nên sổ cái luôn tự cân.

  `retainPortions(balance, kept)` ([stock.js:185](../../../src/shared/utils/stock.js#L185)) là phần tách riêng từ `moveStock`: xóa kiện đã lấy khỏi số dư nguồn, cập nhật kiện còn lại tại chỗ (giữ nguyên subdocument để không ghi lại `createdAt`), và nay chép thêm `packagingState`, `measuredVolumeMm3`, `volumeUpperBoundMm3`, `extraOccupiedVolumeMm3` — cần cho trường hợp thùng bị mở ở luồng xuất.

## 2.16. Dữ liệu biến đổi qua toàn quy trình — ví dụ số

Giả sử gạch `G60` có đơn vị gốc là viên và đã khai báo quy đổi cấp sản phẩm 4 viên/thùng. Lô thực nhận `L01` cũng có 4 viên/thùng.

| Bước | Collection | Dữ liệu chính sau bước |
|---|---|---|
| Lập RR | `replenishment_requests` | `items[0] = { enteredUnit: 'Thùng', enteredQty: '10', baseUnitsPerUnit: '4', qtyBase: '40', details.availableQtySnapshot: '12' }`, `DRAFT`, v1 |
| Gửi | `replenishment_requests` | `SUBMITTED`, v2, `submissions[0].documentVersion = 2` |
| Duyệt giảm | `approval_history` + RR | Owner gửi `approvedQtyBase: '32'` và lý do giảm. Lượng 32 viên tương đương 8 thùng nguyên. RR sang `APPROVED`, v3, `approvedRevision = 2`. |
| Lập + phát hành PO | `purchase_orders` | `items[0] = { enteredUnit: 'Thùng', enteredQty: '8', qtyBase: '32', requestItemId: RR.items[0]._id }`, `OPEN`. |
| Kiểm nhận | `goods_arrivals`, `goods_inspections` | Dòng 1: lô `L01`, 7 thùng = 28 viên, `GOOD/ACCEPT/SEALED`; dòng 2: 3 viên, `GOOD/ACCEPT/LOOSE` |
| Xác nhận kiểm | `goods_receipts` | GR `DRAFT` hai dòng (28 + 3), `destinationLocationId = R-01` (RECEIVING). Headroom PO = 32 − 31 = 1 |
| Ghi tồn | `inventory_balances`, `stock_transactions` | Balance (R-01, L01, GOOD, STORE): `quantityBase` 0 → 31, kiện `[SEALED×7=28, LOOSE 3]`; 2 movement `to`. PO `PARTIAL` (còn 1) |
| Mở form | (đọc) | Chi tiết PNM trả `items[*].receivingBalanceId` = id balance (R-01, L01, GOOD, STORE), `capabilities.relocate = true` |
| Lập lệnh chuyển | `transfer_orders` | TO `RELOCATE` `OPEN`, `sourceBalanceVersion` = version balance R-01. Dòng 1 (`packagingState: 'SEALED'`): 28 viên = 7 thùng → ô `A-01-01`; dòng 2 (`packagingState: 'LOOSE'`): 3 viên → ô `A-01-02`. Chưa đổi tồn; 31 viên ở R-01 bị tính "đang chờ" |
| Xác nhận chuyển | `inventory_balances`, `stock_transactions` | Bút toán `RELOCATE` 2 movement: R-01 31 → 0; A-01-01 +28 (kiện SEALED×7); A-01-02 +3 (kiện LOOSE). TO `CONFIRMED` |

Sau bước cuối, 31 viên mới được `availableStock()` của RR tính là "tồn khả dụng" (vì nằm ở `STORAGE`, `isPickable`).

---

# Phần 2B — Luồng phụ và luồng liên quan

Phần 2 đi theo đường thẳng RR → PO → kiểm nhận → phiếu nhập → chuyển vị trí. Phần này giải thích **mọi** nhánh rẽ khỏi đường thẳng đó theo cùng khuôn với Phần 2: vai trò nghiệp vụ, route và quyền, từ điển biến, tương tác DB, logic từng bước kèm đoạn code và *Tại sao*. Mọi lệnh ghi ở đây đều đi qua khung `command() → transaction()` của 2.0, nên có `operationKey`, `expectedVersion`, biên nhận, `audit_logs` và `SystemEvent` như luồng chính. Các hàm đọc không mở transaction và không ghi DB. Bản đồ chỗ rẽ nhánh nằm ở [1.1](#bản-đồ-nhánh-luồng-phụ-gắn-vào-luồng-chính-ở-đâu). Danh mục route lấy từ [routes.js](../../../src/routes.js) và các file `*.routes.js` ngày 25/11/2026 (commit `5105f36`).

## 2B.1. Bản đồ API đầy đủ

### Tóm tắt nhanh: Sửa / Hủy / Đảo theo từng loại chứng từ

| Loại phiếu | Sửa (Update) | Hủy (Cancel) | Đảo (Reverse) |
|---|---|---|---|
| **RR (`YCBS`)** | `PUT /:id` (`DRAFT`, người lập) — 2.2 | `POST /:id/cancel` (chưa có PO; Owner hủy được cả `APPROVED`) — 2B.2.5 | Không có (chưa ghi tồn) |
| **PO (`ĐMH`)** | `PUT /:id` khi `DRAFT`. `expected-on` và `close-remainder` khi `OPEN/PARTIAL`. Chốt thiếu yêu cầu xử lý hết kiểm nhận nháp. `reopen` khi `CLOSED` và còn lượng phải nhận sau đảo phiếu. Xem 2B.3.1–2B.3.4. | `POST /:id/cancel` (chưa có chứng từ nhận; giải phóng RR) — 2B.3.5 | Không có (chưa ghi tồn) |
| **Hàng đến (`HĐK`)** | Không có route riêng; sửa theo `PUT /goods-inspections/:id` — 2.8 | Tự hủy kèm `POST /goods-inspections/:id/cancel` — 2B.4.3 | Tạo bản thay thế kèm `replaceInspection` — 2B.5 |
| **Kiểm nhận (`PKN`)** | `PUT /:id` (`DRAFT`); `POST /:id/corrections` (tạo bản thay thế khi đã `CONFIRMED`) — 2.8, 2B.5 | `POST /:id/cancel` (`DRAFT`, hủy kèm `HĐK`) — 2B.4.3 | Không có (chưa ghi tồn) |
| **Phiếu nhập mua (`PNM`)** | `PATCH /:id/destinations` (chỉ đổi bãi khi `DRAFT`; không sửa dòng/lượng) — 2B.4.4 | `POST /:id/cancel` (`DRAFT`, trả hạn mức PO) — 2B.4.3 | `POST /:id/reverse` + `reversal-preflight` (`POSTED` → `REVERSED`, sinh `PĐN`) — 2B.6 |
| **Phiếu giữ hộ (`PNGH`)** | Không sửa trực tiếp; có tái kiểm `POST /:id/reinspections` — 2B.8.2 | `POST /:id/cancel` (`DRAFT`, chủ hàng NCC) — 2B.4.3 | `POST /:id/reverse` + `reversal-preflight` (`POSTED` → `REVERSED`, sinh `PĐN`) — 2B.6 |
| **Trả giữ hộ (`PXGH`)** | **Chưa có trong code** | **Chưa có trong code** | **Chưa có trong code** (xem 2B.8.7) |
| **Phiếu đảo (`PĐN`)** | Không có (tạo thẳng ở `POSTED`, bất biến) | Không có | Không có |
| **Chuyển vị trí (`LCV`)** | `PATCH /:id` (`OPEN`, chỉ người lập) — 2.14 | `POST /:id/cancel` (`OPEN`/`PARTIAL`, hủy phần còn lại) — 2.14 | Không có (lập lệnh `RELOCATE` ngược) |

Cột "Mục" trỏ tới phần giải thích. Quyền ghi "trong `command()`" nghĩa là route không có `checkPermission`; quyền được kiểm khi lệnh chạy, sau khi nạp lại người dùng từ DB. Từ 25/11/2026, mọi route PO, kiểm nhận, phiếu nhập mua, giữ hộ, phiếu đảo và hàng đợi nhận hàng có `checkPermission` với đúng quyền ghi trong bảng (route cần hai quyền gắn hai middleware), rồi service hoặc `command()` kiểm lại cùng quyền. Thiếu quyền ⇒ 403 trước khi Zod chạy, nên request vừa thiếu quyền vừa sai payload nhận 403, không nhận 400. Chỉ các route bằng chứng và hai route đọc chung `GET /api/goods-receipts`, `GET /api/goods-receipts/:id` còn kiểm quyền hoàn toàn trong service. Lý do một số route kiểm quyền trong service xem [2.0, mục Kiểm quyền](#kiểm-quyền-middleware-checkpermission-và-hàm-requirepermission-trong-service).

### RR — `/api/replenishments` ([replenishment.routes.js](../../../src/modules/replenishments/replenishment.routes.js))

| Method & path | Hàm | Quyền | Mục |
|---|---|---|---|
| `GET /options?mode=CREATE\|FILTER&requestId?` | `getReplenishmentOptions` | `replenishment_request:create` / `:read` / `:update` (khi có `requestId`) | 2B.2.1 |
| `GET /options/lots` | `getReplenishmentLotOptions` | `:create` hoặc `:update` | 2B.2.1 |
| `GET /options/sources?type=` | `getReplenishmentSourceOptions` | `:create`/`:update` + `sales_order:read` hoặc `stocktake:read` | 2B.2.2 |
| `POST /evaluate` | `evaluateReplenishment` | `:create` hoặc `:read` | 2B.2.3 |
| `GET /` | `listReplenishments` | `replenishment_request:read` | 2B.2.4 |
| `GET /:id` | `getReplenishment` | `:read` | 2B.2.4 |
| `GET /:id/submissions`, `GET /:id/submissions/:version` | `listReplenishmentSubmissions`, `getReplenishmentSubmission` | `:read` | 2B.2.4 |
| `POST /` | `createReplenishment` | `:create` | 2.1 |
| `PUT /:id` | `updateReplenishment` | `:update` | 2.2 |
| `POST /:id/submit` | `submitReplenishment` | `:update` | 2.3 |
| `POST /:id/review` | `reviewReplenishment` (`APPROVE` hoặc `REJECT`) | `:approve` | 2.4, 2B.2.6 |
| `POST /:id/cancel` | `cancelReplenishment` | trong `command()`: Owner `:approve`, người khác `:update` | 2B.2.5 |

### PO — `/api/purchase-orders` ([purchase-order.routes.js](../../../src/modules/purchase-orders/purchase-order.routes.js), `purchaseReceivingRouter` trong [po-receiving.routes.js](../../../src/modules/po-receiving/po-receiving.routes.js), `purchaseOrderInspectionRouter` trong [goods-inspection.routes.js](../../../src/modules/goods-inspections/goods-inspection.routes.js))

| Method & path | Hàm | Quyền (route + service/`command()`) | Mục |
|---|---|---|---|
| `GET /` | `listPurchaseOrders` | `purchase_order:read` | 2B.3.6 |
| `GET /supplier-options` | `listPurchaseOrderSupplierOptions` | `purchase_order:read` | 2B.3.6 |
| `GET /:id` | `getPurchaseOrder` | `purchase_order:read` | 2B.3.6 |
| `POST /` | `createPurchaseOrder` | `purchase_order:create` | 2.5 |
| `PUT /:id` | `updatePurchaseOrder` | `purchase_order:update` | 2B.3.1 |
| `POST /:id/confirm` | `confirmPurchaseOrder` | `:update` | 2.6 |
| `POST /:id/expected-on` | `rescheduleExpectedOn` | `:update` | 2B.3.2 |
| `POST /:id/close-remainder` | `closeRemainder` | `:update` | 2B.3.3 |
| `POST /:id/reopen` | `reopenPurchaseOrder` | `:update` | 2B.3.4 |
| `POST /:id/cancel` | `cancelPurchaseOrder` | `:update` | 2B.3.5 |
| `GET /:id/inspection-context` | `inspectionContext` (`purchaseOrderInspectionRouter`) | `goods_receipt_inspection:read` | 2B.4.1 |
| `POST /:id/inspections` | `createInspection` (`purchaseOrderInspectionRouter`) | `goods_receipt_inspection:create` | 2.7 |
| `GET /:id/receiving-summary` | `receivingSummary` (`purchaseReceivingRouter`) | `purchase_order:read` | 2B.4.5 |
| `GET /:id/receiving-trips` | `receivingTrips` (`purchaseReceivingRouter`) | `goods_receipt_inspection:read` | 2B.4.5 |
| `GET /:id/receiving-operations/:key` | `receivingOperation` (`purchaseReceivingRouter`) | `goods_receipt_inspection:read` | 2B.4.2 |

### Kiểm nhận — `/api/goods-inspections` (`inspectionRouter` trong [goods-inspection.routes.js](../../../src/modules/goods-inspections/goods-inspection.routes.js))

| Method & path | Hàm | Quyền (route + service/`command()`) | Mục |
|---|---|---|---|
| `GET /`, `GET /:id` | `listDocuments('INSPECTION')`, `getDocument` | `goods_receipt_inspection:read` | 2B.4.5 |
| `GET /:id/history` | `receivingHistory` | `:read` | 2B.4.5 |
| `PUT /:id` | `updateInspection` | `:update` | 2.8 |
| `POST /:id/confirm` | `confirmInspection` | `:update` | 2.9 |
| `POST /:id/cancel` | `cancelDraft(..., 'INSPECTION')` | `:update` | 2B.4.3 |
| `GET /:id/correction-preflight` | `correctionPreflight` | `:update` | 2B.5 |
| `POST /:id/corrections` | `replaceInspection` | `:update` | 2B.5 |

### Phiếu nhập mua — `/api/goods-receipts/purchase` (`receiptRouter` trong [purchase-receipt.routes.js](../../../src/modules/goods-receipts/purchase-receipt.routes.js), gắn qua [goods-receipt.routes.js](../../../src/modules/goods-receipts/goods-receipt.routes.js))

| Method & path | Hàm | Quyền (route + service/`command()`) | Mục |
|---|---|---|---|
| `GET /`, `GET /:id` | `listDocuments('GR_PURCHASE')`, `getDocument` | `goods_receipt_inspection:read` | 2B.4.5, 2.11 |
| `POST /:id/post` | `postReceipt` | `:post` (thêm `purchase_custody:execute` trong service nếu nhập từ hàng giữ hộ) | 2.10 |
| `POST /:id/cancel` | `cancelDraft(..., 'GR_PURCHASE')` | `:update` | 2B.4.3 |
| `PATCH /:id/destinations` | `changeDestinations` | `:update` | 2B.4.4 |
| `GET /:id/reversal-preflight` | `reversalPreflight` | `:reverse` + `:post` | 2B.6 |
| `POST /:id/reverse` | `reverseReceipt` | `:reverse` + `:post` | 2B.6 |

`GET /api/goods-receipts` và `GET /api/goods-receipts/:id` là danh sách chung mọi loại phiếu nhập (mua, khách trả, giao thất bại, điều chuyển, nhập khác); phiếu mua xuất hiện ở đây với `kind=PURCHASE` và lọc được theo `purchaseOrderId`.

### Chuyển vị trí BF03 — `/api/location-movements` ([location-movement.routes.js](../../../src/modules/location-movements/location-movement.routes.js))

| Method & path | Hàm | Quyền (route) | Mục |
|---|---|---|---|
| `GET /options?warehouseId=` | `locationMovementOptions` | `stock_relocation:create` | 2.12 |
| `POST /` | `createLocationMovement` | `stock_relocation:create` | 2.13 |
| `PATCH /:id` | `editLocationMovement` | `stock_relocation:create` | 2.14 |
| `POST /:id/cancel` | `cancelLocationMovement` | `stock_relocation:create` | 2.14 |
| `POST /:id/confirm` | `confirmLocationMovement` | `stock_relocation:confirm` | 2.15 |
| `GET /`, `GET /:id` | `listLocationMovements`, `getLocationMovement` | `stock_relocation:read` | 2B.9 |

### Các router khác của mua hàng

Từ 25/11/2026 các router này được tách về đúng module theo loại chứng từ:
- `queueRouter`, `purchaseDocumentRouter`: [po-receiving.routes.js](../../../src/modules/po-receiving/po-receiving.routes.js)
- `reversalRouter`: [stock-reversal.routes.js](../../../src/modules/stock-reversals/stock-reversal.routes.js)
- `custodyRouter`, `custodyReleaseRouter`: [custody.routes.js](../../../src/modules/custody/custody.routes.js)

Dòng "theo loại chứng từ" là route **không** có `checkPermission`; quyền chọn trong `parent()` của `purchase-evidence.service.js` (2B.7).

| Method & path | Hàm | Quyền | Mục |
|---|---|---|---|
| `GET /api/purchase-receiving/queue?stage=DRAFT_INSPECTION\|AWAITING_POST\|CORRECTION` | `receivingQueue` | `goods_receipt_inspection:read` | 2B.4.5 |
| `GET /api/purchase-documents/:id/history` | `receivingHistory` | `goods_receipt_inspection:read` | 2B.4.5 |
| `GET /api/purchase-documents/:id/evidence` | `listEvidence` | theo loại chứng từ | 2B.7 |
| `POST /api/purchase-documents/:id/evidence/uploads` | `uploadEvidence` | theo loại chứng từ | 2B.7 |
| `POST /api/purchase-documents/:id/evidence/attach` | `attachEvidence` | theo loại chứng từ | 2B.7 |
| `GET /api/purchase-documents/:id/evidence/:evidenceId/download` | `downloadEvidence` | theo loại chứng từ | 2B.7 |
| `GET /api/stock-reversals/:id` | `getReversal` | `goods_receipt_inspection:read` | 2B.6 |
| `GET /api/custody-receipts`, `GET /:id` | `listDocuments('CUSTODY_RECEIPT')`, `getDocument` | `goods_receipt_inspection:read` | 2B.8 |
| `POST /api/custody-receipts/:id/post` | `postCustodyReceipt` | `goods_receipt_inspection:post` | 2B.8.1 |
| `POST /api/custody-receipts/:id/cancel` | `cancelDraft(..., 'CUSTODY_RECEIPT')` | `goods_receipt_inspection:update` | 2B.4.3 |
| `GET /api/custody-receipts/:id/reversal-preflight` | `reversalPreflight` | `:reverse` + `:post` | 2B.6 |
| `POST /api/custody-receipts/:id/reverse` | `reverseReceipt` | `:reverse` + `:post` | 2B.6 |
| `POST /api/custody-receipts/:id/reinspections` | `reinspectCustody` | `goods_receipt_inspection:update` | 2B.8.2 |
| `POST /api/custody-receipts/:id/resolution-decisions` | `decideCustody` | `purchase_custody:decide` | 2B.8.3 |
| `POST /api/custody-receipts/:id/purchase-receipts` | `createCustodyResolution(..., 'ACCEPT')` | `purchase_custody:execute` | 2B.8.4 |
| `POST /api/custody-receipts/:id/releases` | `createCustodyResolution(..., 'RETURN')` | `purchase_custody:execute` | 2B.8.4 |
| `GET /api/custody-releases/:id` | `getDocument('CUSTODY_RELEASE')` | `goods_receipt_inspection:read` | 2B.8 |
| `POST /api/custody-releases/:id/post` | `postCustodyRelease` | `purchase_custody:execute` | 2B.8.6 |

### Hàm dùng chung của các luồng phụ mua hàng

- **`findPurchase(id, user, session, { kind, readOnly })`** ([purchase-core.js:49](../../../src/shared/utils/purchase-core.js)): tìm theo `_id` (mã phiếu) hoặc `documentNo` trong model của `kind` (`PO`, `INSPECTION`, `GR_PURCHASE`, `CUSTODY_RECEIPT`, `CUSTODY_RELEASE`, `TO`, `OTHER`); không truyền `kind` thì thử lần lượt mọi model. Kiểm kho của chứng từ, trừ Kế toán ở chế độ `readOnly`. Lệnh ghi của Kế toán (sửa, chốt thiếu, mở lại PO) vẫn cần kho được gán.
- **`purchaseOrderRef(id)`** ([purchase-core.js:44](../../../src/shared/utils/purchase-core.js), thêm 25/11/2026): đổi tham số lọc `purchaseOrderId` (mã phiếu hoặc `documentNo`) thành `_id` thật của PO để so với `header.purchaseOrderId` đã lưu. Không thấy PO thì trả nguyên giá trị (danh sách rỗng). Hàm **không** kiểm phạm vi kho; bộ lọc kho của danh sách vẫn áp dụng sau đó.

  ```js
  const purchaseIdFilter = id => (/^[a-f\d]{24}$/i.test(id) ? { $or: [{ _id: id }, { documentNo: id }] } : { documentNo: id });
  export async function purchaseOrderRef(id) {
    const po = await PurchaseOrder.findOne(purchaseIdFilter(id)).select('_id').lean();
    return po?._id ?? id;
  }
  ```

  Dùng ở `listDocuments` (kiểm nhận, phiếu nhập mua, giữ hộ, hàng đợi) và danh sách gộp `GET /api/goods-receipts?purchaseOrderId=`.
- **`replayPurchase`** ([purchase-core.js:77](../../../src/shared/utils/purchase-core.js)) là `authorizeReplay` của gần như mọi lệnh mua hàng: đọc lại chứng từ đích bằng `findPurchase` để kiểm phạm vi trước khi trả biên nhận cũ.
- **`evidenceFor(user, document, ids, session, required)`** ([purchase-core.js:63](../../../src/shared/utils/purchase-core.js)): danh sách id bằng chứng không trùng; mỗi id phải là `Attachment` `ATTACHED` của **chính** chứng từ đó. `required = true` thì danh sách không được rỗng ("Thiếu bằng chứng").

## 2B.2. Luồng phụ của RR

### 2B.2.1. Dữ liệu form RR: `getReplenishmentOptions`, `getReplenishmentLotOptions`, `requireEditableRequest`

[replenishment.commands.js:291](../../../src/modules/replenishments/replenishment.commands.js), [:351](../../../src/modules/replenishments/replenishment.commands.js), [:281](../../../src/modules/replenishments/replenishment.commands.js). Chỉ đọc, không transaction.

- **Vai trò nghiệp vụ:** đổ dữ liệu cho form lập/sửa RR: kho được vào, sản phẩm đang hoạt động, đơn vị dùng được cho từng sản phẩm kèm hệ số, và lô `VERIFIED` (phân trang).
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `mode` | `'CREATE' \| 'FILTER'` | Chọn quyền `:create` (form lập) hay `:read` (bộ lọc danh sách). |
| `requestId` | mã RR? | Có ⇒ đang sửa: đòi `:update` và gọi `requireEditableRequest`. |
| `scope` | filter | Owner thấy mọi kho; vai trò khác chỉ `user.warehouseIds`. |
| `conversions` | aggregate | Quy đổi **cấp sản phẩm** (`productBatchId: null`) mới nhất có `validFrom ≤ now` cho từng cặp (sản phẩm, đơn vị). |
| `unitsByProduct` | `Map` | Mỗi sản phẩm: đơn vị gốc (`basePerUnit: '1'`) đứng đầu, sau đó các đơn vị có quy đổi. |
| Trả về | object | `{ warehouses, products: [{ ..., units }], sources: [] }`; lô trả `{ items: [{ id, manufacturerLot, piecesPerCarton }], total, page, limit }`. |

- **Logic:**

  ```js
  if (requestId) await requireEditableRequest(user, requestId);
  ...
  { $match: { productId: {...}, productBatchId: null, uomId: {...}, validFrom: { $lte: new Date() } } },
  { $sort: { productId: -1, uomId: -1, validFrom: -1 } },
  { $group: { _id: { productId: "$productId", uomId: "$uomId" }, basePerUnit: { $first: "$basePerUnit" } } },
  ```

  `requireEditableRequest` = `readRequest` + người gọi là người lập + RR `DRAFT` + chưa có PO giữ `replenishmentRequestId`. Lô chỉ lấy `identificationStatus: 'VERIFIED'`, sắp theo `manufacturerLot`.

  *Tại sao:* form chỉ gợi ý; lệnh ghi (`makeItem`, `resolveConversion`) vẫn tự tính lại hệ số. Form hiện quy đổi cấp sản phẩm vì RR thường chưa chọn lô; khi chọn lô và đơn vị thùng, server bắt buộc dùng quy đổi theo lô (2.1).

### 2B.2.2. Chứng từ nguồn: `getReplenishmentSourceOptions(user, query)`

[replenishment.sources.js:121](../../../src/modules/replenishments/replenishment.sources.js). Chỉ đọc.

- **Vai trò nghiệp vụ:** cho người lập chọn chứng từ làm căn cứ cho dòng RR có nguồn `SALES_SHORTAGE` hoặc `STOCKTAKE_LOW_STOCK`.
- **Từ điển biến:** `query.type` (`stocktakes` hoặc mặc định đơn bán), `query.warehouseId`, phân trang. Kết quả mỗi dòng mang `version` của chứng từ.
- **Logic:**
  1. `type=stocktakes` (`stocktakeOptions`, [dòng 62](../../../src/modules/replenishments/replenishment.sources.js)): đợt kiểm kê `COMPLETED/CLOSED` trong kho được vào; danh sách sản phẩm lấy từ dòng kiểm kê và `StocktakeSnapshot` (`snapshotProductsLookup`). Cần `stocktake:read`.
  2. Loại khác (`salesOrderOptions`, [dòng 12](../../../src/modules/replenishments/replenishment.sources.js)): đơn bán chưa `CANCELLED/REJECTED/COMPLETED`; Sales chỉ thấy đơn mình lập. Cần `sales_order:read`.

  *Tại sao mang `version`:* client gửi lại `source.version`. Khi gửi duyệt (`strictSourceVersion`), `resolveSource` so version này với chứng từ hiện tại, nên người lập không gửi duyệt dựa trên một đơn bán hay đợt kiểm kê đã đổi.

### 2B.2.3. Xem trước đánh giá: `evaluateReplenishment(user, input)`

[replenishment.commands.js:217](../../../src/modules/replenishments/replenishment.commands.js). Route `POST /api/replenishments/evaluate`.

- **Vai trò nghiệp vụ:** cho FE hiện cảnh báo `OPEN_REQUEST`, `INCOMING_PO`, `STOCK_SUFFICIENT` trước khi người lập bấm lưu.
- **Biến:** `input.requestId` (có ⇒ quyền `:read` và phải đọc được RR đó), `input.warehouseId`, `input.lines[]` như khi lập.
- **Logic:**

  ```js
  return transaction(async (session) => {
    if (input.requestId) await readRequest(input.requestId, user, session);
    return evaluateLines(user, input, session, { permission: input.requestId ? "replenishment_request:read" : "replenishment_request:create" });
  });
  ```

  *Tại sao có transaction dù không ghi:* `evaluateLines` đọc nhiều collection (RR, PO, phiếu nhập, tồn, giữ hàng). Snapshot read concern của transaction cho một ảnh nhất quán. Không có `command()`, nên không có biên nhận, audit hay `operationKey`.

### 2B.2.4. Danh sách, chi tiết và ảnh gửi duyệt

[replenishment.service.js](../../../src/modules/replenishments/replenishment.service.js): `listReplenishments` [dòng 55](../../../src/modules/replenishments/replenishment.service.js), `getReplenishment` [dòng 152](../../../src/modules/replenishments/replenishment.service.js#L152), `listReplenishmentSubmissions` [dòng 326](../../../src/modules/replenishments/replenishment.service.js#L326), `getReplenishmentSubmission` [dòng 344](../../../src/modules/replenishments/replenishment.service.js#L344). Chỉ đọc.

- **Vai trò nghiệp vụ:** màn hình danh sách RR, chi tiết RR và lịch sử từng lần gửi duyệt.
- **Từ điển biến:**

| Tên biến | Vai trò |
|---|---|
| `replenishmentScope(user)` ([replenishment.access.js](../../../src/modules/replenishments/replenishment.access.js)) | Owner thấy mọi kho; vai trò khác chỉ kho được gán; Sales và Warehouse chỉ thấy RR mình lập. |
| `query.hasPurchaseOrder` / `query.poCreated` | Lọc RR đã/chưa có PO (`pageWithPurchaseOrders`, [dòng 24](../../../src/modules/replenishments/replenishment.service.js)). |
| `query.approvalDecision` | Lọc theo quyết định; `NONE` = chưa có quyết định. |
| `approvals` | `approval_history` của RR, kèm tên người yêu cầu/người quyết định. |
| `cancelledByUser` | Danh sách và chi tiết trả `{ id, fullName }` khi tra được tài khoản từ `cancelledBy`. |
| `purchaseOrders` | PO liên kết qua `replenishmentRequestId` **hoặc** `sources[]`, nên PO đã hủy (đã `$unset replenishmentRequestId`) vẫn hiện. |
| `enteredUomAreaMm2` | Diện tích đơn vị nhập nếu là đơn vị m², để FE hiện quy đổi. |

  *Tại sao đọc `sources[]`:* hủy PO giải phóng chỉ mục duy nhất bằng cách gỡ `replenishmentRequestId` (2B.3.5). Nếu chỉ đọc trường đó, lịch sử PO đã hủy sẽ biến mất khỏi chi tiết RR. Ảnh gửi duyệt đọc từ `submissions[]` (append-only) theo `documentVersion`.

### 2B.2.5. Rút / hủy RR: `cancelReplenishment(user, id, input)`

[replenishment.commands.js:568](../../../src/modules/replenishments/replenishment.commands.js). Route `POST /api/replenishments/:id/cancel`, `validate(cancelReplenishmentSchema)`, quyền chọn **trước** khi vào `command()`: Owner dùng `replenishment_request:approve`, người khác dùng `replenishment_request:update`.

- **Vai trò nghiệp vụ:** người lập rút RR chưa duyệt; Owner hủy RR đã duyệt nhưng chưa thành PO.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò & dữ liệu |
|---|---|---|
| `input.expectedVersion` | int | Khóa lạc quan. |
| `input.operationKey` | string | Khóa chống gửi trùng. |
| `input.reason` | string | Lý do, bắt buộc (Zod `reasonNote` + kiểm `trim` trong service). |
| `permission` | string | `:approve` nếu người gọi là Owner, ngược lại `:update`. |
| `document` | `ReplenishmentRequest` | RR đọc qua `readRequest` (Sales/Warehouse không thấy RR người khác ⇒ 404). |
| Trả về | `{ document, versionBefore, reason }` | RR ở `CANCELLED`. |

- **Tương tác DB:** `ReplenishmentRequest.findById`, `PurchaseOrder.exists({ replenishmentRequestId })`, `saveVersion(RR)`.
- **Logic:**

  ```js
  if (await PurchaseOrder.exists({ replenishmentRequestId: id }).session(session))
    throw validationError("Yêu cầu đã có PO; xử lý theo luồng PO");
  if (document.workflowStatus === "APPROVED") {
    if (!isOwner(actor)) throw forbiddenError("Owner xử lý phần đã duyệt");
  } else if (!["DRAFT", "SUBMITTED"].includes(document.workflowStatus) || !same(document.createdBy, actor._id))
    throw forbiddenError("Chỉ người lập được rút yêu cầu chưa duyệt");
  if (!input.reason?.trim()) throw validationError("Cần lý do rút/hủy yêu cầu");
  document.workflowStatus = "CANCELLED";
  document.cancelReason = input.reason; document.cancelledBy = actor._id; document.cancelledAt = new Date();
  ```

  *Tại sao:* RR đã có PO thì hàng có thể đang về; hủy phải đi từ PO (hủy PO ở 2B.3.5 sẽ gỡ liên kết, sau đó mới hủy RR được). Lệnh lập PO "chạm" `updatedAt` của RR (2.5), lệnh hủy PO cũng vậy, nên hủy RR song song với lập/hủy PO không cùng commit được. RR `REJECTED` hoặc `CANCELLED` không hủy lại được.

### 2B.2.6. Nhánh từ chối RR: `reviewReplenishment` với `decision: 'REJECT'`

Cùng hàm với 2.4 ([replenishment.commands.js:463](../../../src/modules/replenishments/replenishment.commands.js)), khác ở dữ liệu vào và kết quả.

- **Vai trò nghiệp vụ:** Owner trả lời "không mua" có lý do. Từ 22/11/2026 không còn nhánh trả về sửa (`REVISE`); muốn mua lại thì lập RR mới.
- **Từ điển biến:** `input.decision = 'REJECT'`; `input.reason` bắt buộc (Zod cho phép bỏ trống, service chặn "Cần ghi căn cứ quyết định"); `input.lines` mặc định `[]` và không cần đủ dòng; `approvedQtyBase` của mọi dòng = `'0'`.
- **Logic:**

  ```js
  if (input.decision === "APPROVE" && seen.size !== document.items.length) throw validationError("Phải xét tất cả dòng hàng");
  ...
  const quantity = exact(approve ? decision.approvedQtyBase : "0");
  ...
  reason: decision?.reason || input.reason,
  ...
  document.workflowStatus = input.decision === "APPROVE" ? "APPROVED" : "REJECTED";
  ```

  `approvedRevision` **không** được ghi khi từ chối; `latestDecisionId` vẫn trỏ quyết định `REJECT`. Thông báo `REVIEW_REPLENISHMENT` gửi người lập; chỉ khi `APPROVED` mới gửi thêm cho người có `purchase_order:create`.

  *Tại sao:* PO chỉ nhận quyết định `APPROVE` đúng `approvedRevision` (2.5), nên một RR bị từ chối không thể lọt sang PO dù client gửi `approvalId` cũ.

## 2B.3. Luồng phụ của PO

Mọi lệnh ở mục này dùng quyền `purchase_order:update` trong `command()` và `replayPurchase`. Theo seed, chỉ Kế toán có quyền này.

### 2B.3.1. Sửa PO nháp: `updatePurchaseOrder(user, id, input)`

[purchase-order.commands.js:195](../../../src/modules/purchase-orders/purchase-order.commands.js). Route `PUT /api/purchase-orders/:id`, body giống lập PO cộng `expectedVersion`, `operationKey`.

- **Vai trò nghiệp vụ:** Kế toán chỉnh NCC, ngày giao, đơn vị đặt, số lượng, giá trước khi phát hành.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `po` | `PurchaseOrder` | PO `DRAFT` đúng `expectedVersion`. |
| `input.lines[].id` | ObjectId? | Có ⇒ giữ `_id` dòng cũ; dòng cũ phải cùng `requestItemId`. |
| `input.lines[].uomCode` | string? | Bỏ trống ⇒ giữ đơn vị đã lưu (`old.enteredUnit`), không quay về đơn vị RR. |
| `prepared` | kết quả `draftItems(..., previous = po.items)` | Dòng mới, NCC, tổng tiền. |

- **Tương tác DB:** như `draftItems` (2.5) + `saveVersion(PO)`.
- **Logic:**

  ```js
  if (po.workflowStatus !== "DRAFT") throw validationError("Chỉ sửa trực tiếp PO nháp");
  checkExpectedOn(input.expectedOn, po.header.expectedOn);
  const prepared = await draftItems(actor, input, session, po.items);
  if (!same(prepared.request._id, po.replenishmentRequestId)) throw validationError("Không đổi RR nguồn của PO");
  po.items = prepared.items; po.totalAmount = prepared.total; ...
  ```

  *Tại sao:* `checkExpectedOn(next, saved)` ([dòng 32](../../../src/modules/purchase-orders/purchase-order.commands.js)) cho giữ nguyên một ngày đã lưu dù nay đã qua, nhưng ngày mới không được trước hôm nay. Giữ đơn vị đã lưu khi bỏ `uomCode` tránh việc số lượng bị đọc theo đơn vị RR và âm thầm đổi quy mô (comment ở [dòng 92](../../../src/modules/purchase-orders/purchase-order.commands.js)). Trần duyệt `withinApproved` được kiểm lại y như lúc lập.

### 2B.3.2. Đổi ngày dự kiến giao: `rescheduleExpectedOn(user, id, input)`

[purchase-order.commands.js:307](../../../src/modules/purchase-orders/purchase-order.commands.js). Route `POST /api/purchase-orders/:id/expected-on`.

- **Vai trò nghiệp vụ:** NCC báo dời lịch sau khi PO đã phát hành.
- **Từ điển biến:** `input.expectedOn` (ISO, bắt buộc), `input.reason` (bắt buộc), `before` (ngày cũ dạng ISO hoặc `null`).
- **Logic:**

  ```js
  if (!["OPEN", "PARTIAL"].includes(po.workflowStatus)) throw validationError("PO không còn mở");
  checkExpectedOn(input.expectedOn);
  const before = po.header.expectedOn?.toISOString() ?? null;
  po.header.expectedOn = input.expectedOn;
  return { document: await saveVersion(...), reason: input.reason,
    auditChanges: [{ field: "header.expectedOn", before, after: po.header.expectedOn.toISOString() }] };
  ```

  *Tại sao:* PO đã phát hành là cam kết với NCC nên không sửa trực tiếp; chỉ ngày giao được đổi, có lý do và giá trị trước/sau trong `audit_logs`. Thông báo `RESCHEDULE_PO_EXPECTED_ON` gửi người có `goods_receipt_inspection:create` để kho biết lịch mới.

### 2B.3.3. Chốt thiếu phần còn lại: `closeRemainder(user, id, input)` và `validateClose(po, lines, session)`

[purchase-order.commands.js:366](../../../src/modules/purchase-orders/purchase-order.commands.js), [:339](../../../src/modules/purchase-orders/purchase-order.commands.js). Route `POST /api/purchase-orders/:id/close-remainder`.

- **Vai trò nghiệp vụ:** NCC không giao đủ; Kế toán chốt "không nhận nữa" phần còn thiếu của từng dòng. Một bước, không cần Owner duyệt, bằng chứng tùy chọn (quyết định 16/11/2026).
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input.lines[]` | `{ poLineId, qtyBase }` 1–100 | Lượng chốt thiếu theo đơn vị gốc từng dòng. |
| `input.reason` | string | Lý do; ghi vào `header.closureReason`. |
| `input.evidenceIds` | ObjectId[]? | Bằng chứng tùy chọn, phải đã gắn vào PO. |
| `quantities` | `purchaseOrderQuantities` | `outstandingQtyBase`, `openDraftCommitmentQtyBase` từng dòng. |
| `item.cancelledRemainderQtyBase` | Decimal | Lượng đã chốt thiếu, cộng dồn. |

- **Tương tác DB:** `GoodsArrival.distinct('_id')` tìm các lượt hàng đến của PO, `GoodsInspection.exists` tìm bản `DRAFT` của các lượt đó. Sau đó service kiểm `Attachment`, `PurchaseReceipt` và `Product` trước khi lưu phiên bản PO.
- **Logic:**

  1. Kiểm `expectedVersion` và trạng thái `OPEN/PARTIAL`. Nếu `hasDraftInspection(po, session)` trả `true`, lệnh trả HTTP 400. Kho phải xác nhận hoặc hủy phiếu kiểm nhận nháp trước. Điều kiện áp dụng trên toàn PO, kể cả phiếu kiểm thay thế còn nháp.

  2. Kiểm bằng chứng nếu có, rồi kiểm từng dòng chốt:

  ```js
  if (product?.wholeBaseUnits && !exact(row.qtyBase).isInteger()) throw validationError("Lượng chốt thiếu phải đúng đơn vị gốc của sản phẩm");
  if (!available || seen.has(row.poLineId) ||
      exact(row.qtyBase).gt(exact(available.outstandingQtyBase).minus(available.openDraftCommitmentQtyBase)))
    throw validationError("Lượng chốt thiếu vượt phần chưa cam kết");
  ```

  3. Cộng dồn và đóng PO khi hết lượng phải giao:

  ```js
  item.cancelledRemainderQtyBase = exact(item.cancelledRemainderQtyBase ?? "0").plus(row.qtyBase).toFixed();
  ...
  if (quantities.every((row) => exact(row.outstandingQtyBase).isZero())) { po.workflowStatus = "CLOSED"; po.header.closedAt = new Date(); }
  po.header.closureReason = input.reason;
  ```

  Phiếu kiểm nhận nháp có thể đã ghi số đếm nhưng chưa giữ hạn mức PO. Điều kiện ở bước 1 ngăn đóng PO khi kho còn phải xác nhận kết quả kiểm. Sau xác nhận, phiếu nhập nháp giữ đúng lượng theo dòng qua `openDraftCommitmentQtyBase`. Lệnh chốt thiếu chỉ được dùng phần còn phải giao sau khi trừ lượng đó. Nếu vẫn còn lượng phải giao, PO giữ trạng thái `OPEN/PARTIAL`. Khi xử lý hết, PO vào `CLOSED` và giữ lượng đã chốt. `auditChanges` lưu các dòng, số lượng chốt và bằng chứng.

### 2B.3.4. Mở lại PO đã đóng: `reopenPurchaseOrder(user, id, input)`, `reopenable`, `receivingStatus`

[purchase-order.commands.js:413](../../../src/modules/purchase-orders/purchase-order.commands.js#L413), [purchase-order.service.js:22](../../../src/modules/purchase-orders/purchase-order.service.js), [:24](../../../src/modules/purchase-orders/purchase-order.service.js). Route `POST /api/purchase-orders/:id/reopen`, body `{ expectedVersion, operationKey, reason }`. Thêm ngày 23/11/2026.

- **Vai trò nghiệp vụ:** PO đã `CLOSED` (do chốt thiếu) mà sau đó một phiếu nhập bị đảo thì phần bị đảo trở thành "chưa nhận" nhưng PO đóng nên kho không kiểm/nhập lại được. Kế toán mở lại PO để kho nhận tiếp đúng phần đó.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `po` | `PurchaseOrder` | Phải `CLOSED`, đúng `expectedVersion`. |
| `quantities` | `purchaseOrderQuantities` | Tính lại sau đảo phiếu. |
| `reopenable(po, quantities)` | bool | `CLOSED` và có dòng `outstandingQtyBase > 0`. |
| `receivingStatus(quantities)` | `'PARTIAL' \| 'OPEN'` | `PARTIAL` nếu còn dòng có `receivedQtyBase > 0`. |
| Trả về | `{ document, versionBefore, reason, auditChanges }` | `auditChanges: [{ field: 'workflowStatus', before: 'CLOSED', after }]`. |

- **Logic:**

  ```js
  if (po.workflowStatus !== "CLOSED") throw validationError("PO không ở trạng thái đã đóng");
  const quantities = await purchaseOrderQuantities(po, session);
  if (!reopenable(po, quantities)) throw validationError("PO không có lượng chưa nhận để mở lại");
  po.workflowStatus = receivingStatus(quantities);
  po.header.closedAt = undefined;
  ```

  *Tại sao:* chỉ phần bị đảo được nhận lại; `cancelledRemainderQtyBase` và `closureReason` giữ nguyên nên phần đã chốt thiếu vẫn đóng. PO đóng mà không có phiếu bị đảo thì `outstanding = 0` và lệnh bị chặn. Chi tiết PO trả `reopenable` để FE hiện nút "Mở lại đơn". Thông báo `REOPEN_PURCHASE_ORDER` gửi người có `goods_receipt_inspection:create`. Sau khi mở lại, nhập hết phần còn lại thì PO lại về `CLOSED` (vì vẫn có dòng chốt thiếu). PO đã mở lại vẫn không hủy được (`cancelBlocker` chặn vì đã chốt thiếu).

### 2B.3.5. Hủy PO: `cancelPurchaseOrder(user, id, input)` và `cancelBlocker(po, session)`

[purchase-order.commands.js:440](../../../src/modules/purchase-orders/purchase-order.commands.js#L440), [purchase-order.service.js:27](../../../src/modules/purchase-orders/purchase-order.service.js). Route `POST /api/purchase-orders/:id/cancel`, body `{ expectedVersion, operationKey, reason }`.

- **Vai trò nghiệp vụ:** bỏ PO khi chưa có gì thực tế hay tài chính gắn vào, và trả RR về để lập PO khác.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `blocker` | string \| null | Lý do không được hủy. |
| `linked` | filter | `GoodsArrival` có `header.purchaseOrderId` hoặc `sources.documentId` = PO. |
| `requestId` | mã RR | `po.replenishmentRequestId` trước khi gỡ. |
| `saved` | `PurchaseOrder` | PO sau `saveVersion`, dùng `version` để gỡ liên kết. |

- **Tương tác DB:** `GoodsArrival.exists`, `PurchaseReceipt.exists`, `ReplenishmentRequest.updateOne($currentDate updatedAt)`, `saveVersion(PO)`, `PurchaseOrder.updateOne($unset replenishmentRequestId)`.
- **Logic:**

  ```js
  // cancelBlocker
  if (!["DRAFT", "OPEN"].includes(po.workflowStatus)) return "Chỉ hủy PO nháp hoặc PO đã phát hành chưa nhận hàng";
  if (po.items.some((item) => exact(item.cancelledRemainderQtyBase ?? "0").gt(0))) return "PO đã chốt thiếu một phần";
  if (await GoodsArrival.exists(linked) || await PurchaseReceipt.exists({ "header.purchaseOrderId": po._id }))
    return "PO đã có chứng từ nhận hàng liên kết";
  // cancelPurchaseOrder
  if (requestId) await ReplenishmentRequest.updateOne({ _id: requestId }, { $currentDate: { updatedAt: true } }, { session, timestamps: false });
  po.workflowStatus = "CANCELLED"; po.cancelReason = input.reason; ...
  const saved = await saveVersion(po, input.expectedVersion, session);
  await PurchaseOrder.updateOne({ _id: po._id, version: saved.version }, { $unset: { replenishmentRequestId: 1 } }, { session });
  ```

  *Tại sao:* mọi chứng từ nhận hàng đều bắt đầu bằng `GoodsArrival` hoặc `PurchaseReceipt`, nên kiểm hai collection này là đủ. Lập kiểm nhận "chạm" PO (2.7) nên không thể vừa hủy vừa lập kiểm nhận cùng lúc. Chỉ mục duy nhất trên `replenishmentRequestId` chỉ bao PO còn giữ trường này; gỡ nó giúp RR `APPROVED` lập được PO mới với cùng quyết định duyệt. `sources[]` của PO cũ vẫn giữ để chi tiết RR hiện lịch sử. Chi tiết PO trả `cancellable` theo cùng `cancelBlocker`.

### 2B.3.6. Đọc PO: `getPurchaseOrder`, `listPurchaseOrders`, `listPurchaseOrderSupplierOptions`, `openReceivingWorkIds`

[purchase-order.service.js](../../../src/modules/purchase-orders/purchase-order.service.js): `getPurchaseOrder` [dòng 57](../../../src/modules/purchase-orders/purchase-order.service.js#L57), `listPurchaseOrders` [dòng 133](../../../src/modules/purchase-orders/purchase-order.service.js#L133), `listPurchaseOrderSupplierOptions` [dòng 118](../../../src/modules/purchase-orders/purchase-order.service.js#L118), `openReceivingWorkIds` [dòng 41](../../../src/modules/purchase-orders/purchase-order.service.js). Chỉ đọc.

- **Vai trò nghiệp vụ:** chi tiết và danh sách PO cho Kế toán, Owner và kho.
- **Từ điển biến (chi tiết PO):**

| Trường trả về | Ý nghĩa |
|---|---|
| `quantities` | `purchaseOrderQuantities` từng dòng (2.6). |
| `arrivals`, `receipts` | `GoodsArrival` và `PurchaseReceipt` của PO. |
| `cancellable` | `DRAFT/OPEN` và `cancelBlocker` trả `null`. |
| `reopenable` | `reopenable(po, quantities)` (2B.3.4). |
| `hasOpenReceivingWork` | Trả trên danh sách và chi tiết. Cờ bật khi PO `OPEN/PARTIAL` còn kiểm nhận nháp hoặc phiếu nhập nháp. |
| `hasDraftInspection` | Chi tiết PO trả cờ riêng cho phiếu kiểm nhận `DRAFT`. Lệnh chốt thiếu kiểm lại cờ theo dữ liệu trong transaction. |
| `draftEdit` | Chỉ khi PO `DRAFT`: dòng sẵn cho form sửa (`rrLineId`, `approvalId` = `latestDecisionId` của RR, `enteredQty`, `enteredUomCode`, giá, ghi chú). |
| `history`, `approvals` | Chỉ Owner/Kế toán (`financial(user)`). |

- **Logic:** sau `findPurchase`, bốn truy vấn `GoodsArrival`, `PurchaseReceipt`, `AuditLog`, `ApprovalHistory` lọc theo `po._id` (trước 25/11/2026 lọc theo `id` thô từ URL). Vai trò không phải Owner/Kế toán nhận kết quả qua `redactPrices` (ẩn giá). Dòng PO được gắn `productSpec`, `lotSpec` qua `enrichLineItems` (2.11). `purchaseOrderScope` cho Owner/Kế toán đọc mọi kho, vai trò khác chỉ kho được gán. `listPurchaseOrders` tính `quantities` cho **từng** PO trong bộ lọc để lọc `outstanding=YES/NO`, rồi phân trang trong bộ nhớ. `listPurchaseOrderSupplierOptions` lấy NCC từ `supplierSnapshot` của các PO trong phạm vi, sắp theo tên tiếng Việt.

  `hasOpenReceivingWork` dùng cho cả hai loại nháp. `hasDraftInspection` chỉ báo phiếu kiểm nhận nháp. Một PO có thể có phiếu nhập nháp và trả `hasOpenReceivingWork: true`, `hasDraftInspection: false`. Khi đó chốt thiếu vẫn bị giới hạn theo lượng cam kết của từng dòng.

## 2B.4. Luồng phụ của kiểm nhận và phiếu nhập

### 2B.4.1. Dữ liệu form kiểm nhận: `inspectionContext(user, id)`

[goods-inspection.service.js:300](../../../src/modules/goods-inspections/goods-inspection.service.js). Route `GET /api/purchase-orders/:id/inspection-context`. Chỉ đọc.

- **Vai trò nghiệp vụ:** mọi thứ form kiểm nhận cần: PO (ẩn giá), hạn mức nhận từng dòng, vị trí kho, lô và thông tin sản phẩm.
- **Từ điển biến:**

| Trường trả về | Nguồn |
|---|---|
| `purchaseOrder` | `redactPrices(dto(po))`, dòng đã `enrichLineItems`. |
| `quantities` | `purchaseOrderQuantities(po)`. |
| `locations` | Mọi `WarehouseLocation` `isActive` của kho (FE lọc `RECEIVING`). |
| `batches` | `ProductBatch` `VERIFIED` của các sản phẩm trên PO. |
| `products` | `sku`, `name`, `manufacturerCode`, `material`, `surface`, `color`, `description`, `baseUnit`, dài/rộng/cao. |
| `cartonUnits` | Mã các `Uom` `isCarton` đang hoạt động. |

  *Tại sao trả kích thước và đơn vị thùng:* thủ kho đếm theo thùng hoặc viên (2.7). FE dùng hệ số và kích thước để đổi số đếm sang đơn vị gốc và m² mà không cố định tỷ lệ trong code giao diện. Kế toán đọc được mọi kho (`readOnly`).

### 2B.4.2. Tra kết quả theo khóa thao tác: `receivingOperation(user, id, key)`

[purchase-read.service.js](../../../src/modules/po-receiving/purchase-read.service.js). Route `GET /api/purchase-orders/:id/receiving-operations/:key`. Chỉ đọc.

- **Vai trò nghiệp vụ:** sau lỗi mạng, FE hỏi "lệnh có khóa này đã commit chưa" để không bấm lại một lệnh đã thành công.
- **Biến:** `key` (khóa client đã gửi, `requestKey`), `operations` (`OperationRecord` của chính người gọi với khóa đó), `subject` (chứng từ đích của từng biên nhận).
- **Logic:**

  ```js
  const po = await findPurchase(id, user, null, { kind: "PO", readOnly: true });
  const operations = await OperationRecord.find({ actorId: user._id, requestKey: key }).lean();
  for (const operation of operations) {
    const subject = await findPurchase(operation.subjectId, user, null, { readOnly: true });
    if (same(subject._id, po._id) || same(subject.header.purchaseOrderId, po._id) || subject.sources?.some((link) => same(link.documentId, po._id)))
      return serialize(operation);
  }
  return null;
  ```

  *Tại sao lọc theo người gọi và PO:* khóa thao tác chỉ duy nhất theo người gọi; không cho người khác dò biên nhận, và chỉ trả biên nhận của chứng từ thuộc PO đang xem. Trước 25/11/2026 ba phép so sánh dùng `id` thô từ URL; gọi bằng `documentNo` của PO lịch sử (`_id` ObjectId) thì không khớp và hàm trả `null` dù lệnh đã commit.

### 2B.4.3. Hủy chứng từ nháp: `cancelDraft(user, id, kind, input)`

[purchase-core.js:88](../../../src/shared/utils/purchase-core.js). Ba route dùng chung: `POST /api/goods-inspections/:id/cancel` (`kind = 'INSPECTION'`), `POST /api/goods-receipts/purchase/:id/cancel` (`'GR_PURCHASE'`, body thêm `expectedPoVersion`), `POST /api/custody-receipts/:id/cancel` (`'CUSTODY_RECEIPT'`). Mã lệnh `CANCEL_<kind>`, quyền `goods_receipt_inspection:update`.

- **Vai trò nghiệp vụ:** bỏ một phiếu kiểm nháp (xe hàng ghi nhầm), một phiếu nhập nháp (không ghi tồn phần này) hoặc một phiếu giữ hộ nháp.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `kind` | `'INSPECTION' \| 'GR_PURCHASE' \| 'CUSTODY_RECEIPT'` | Loại chứng từ. |
| `document` | chứng từ | Phải `DRAFT`, đúng `expectedVersion`. |
| `input.reason` | string | Bắt buộc, ghi `cancelReason`. |
| `arrival` | `GoodsArrival` | Chỉ với `INSPECTION`: hàng đến đi kèm. |
| `po` | `PurchaseOrder` | Chỉ với `GR_PURCHASE`: kiểm `expectedPoVersion` rồi tăng version. |

- **Logic:**

  ```js
  if (document.workflowStatus !== "DRAFT") throw validationError("Chỉ hủy phiếu nháp");
  if (kind === "CUSTODY_RECEIPT" && document.header.ownerType !== "SUPPLIER") throw validationError("Chỉ hủy phiếu giữ hộ nhà cung cấp");
  document.workflowStatus = "CANCELLED"; ...
  if (kind === "INSPECTION") { /* arrival DRAFT ⇒ CANCELLED cùng lý do */ }
  if (kind === "GR_PURCHASE") { const po = await findPurchase(...); checkVersion(po, input.expectedPoVersion); await saveVersion(po, po.version, session); }
  ```

  *Tại sao:* `GoodsArrival` sinh cùng phiếu kiểm nên phải hủy theo, nếu không sẽ treo ở `DRAFT`. Phiếu nhập nháp đang chiếm `openDraftCommitmentQtyBase` của PO; hủy nó trả lại hạn mức, nên PO được tăng version để các lệnh đang dựa trên hạn mức cũ phải tải lại. Phiếu kiểm nguồn vẫn `CONFIRMED`: muốn nhận lại phần đó phải sửa kết quả kiểm (2B.5), không có lệnh "sinh lại phiếu nhập".

### 2B.4.4. Đổi bãi tiếp nhận trước ghi tồn: `changeDestinations(user, id, input)`

[purchase-receipt.service.js:109](../../../src/modules/goods-receipts/purchase-receipt.service.js). Route `PATCH /api/goods-receipts/purchase/:id/destinations`, mã lệnh `CHANGE_RECEIPT_DESTINATIONS`, quyền `:update`.

- **Vai trò nghiệp vụ:** bãi đã chọn lúc xác nhận kiểm bị đầy hoặc chọn nhầm; đổi trước khi ghi tồn.
- **Từ điển biến:** `input.lines[]` (`{ lineId, receivingLocationId }` 1–100), `input.reason` (bắt buộc, vào audit), `source` (dòng kiểm gốc của dòng phiếu nhập).
- **Logic:**

  ```js
  if (receipt.workflowStatus !== "DRAFT") throw validationError("Không đổi vị trí sau ghi tồn");
  if (new Set(input.lines.map((row) => row.lineId)).size !== input.lines.length) throw validationError("Mỗi dòng chỉ chọn một vị trí");
  ...
  await locationAt(row.receivingLocationId, receipt.header.warehouseId, [source.details.qualityCode === "GOOD" ? "RECEIVING" : "QUARANTINE"], session);
  item.destinationLocationId = row.receivingLocationId;
  ```

  *Tại sao:* sau khi ghi tồn, đổi vị trí là di chuyển hàng thật và phải đi qua BF03 (2.13). Nhánh `QUARANTINE` trong code không xảy ra với phiếu nhập mua vì chỉ hàng `GOOD` được `ACCEPT`. `postReceipt` kiểm lại loại vị trí lúc ghi tồn.

### 2B.4.5. Màn hình đọc của nhận hàng

[purchase-read.service.js](../../../src/modules/po-receiving/purchase-read.service.js). Chỉ đọc; Owner/Kế toán xem giá, vai trò khác qua `redactPrices`.

| Hàm | Vai trò & logic chính |
|---|---|
| `listDocuments(user, kind, query)` ([dòng 191](../../../src/modules/po-receiving/purchase-read.service.js)) | Danh sách kiểm nhận, phiếu nhập, giữ hộ. Lọc kho (`purchaseWarehouseFilter`), trạng thái, mã (`q`). Lọc theo PO: `purchaseOrderId` (mã phiếu hoặc `documentNo`) được đổi thành `_id` qua `purchaseOrderRef` (2B.1); phiếu nhập dùng `header.purchaseOrderId`; kiểm nhận và giữ hộ đi qua `GoodsArrival` của PO (theo `header.purchaseOrderId` hoặc `sources`). Giữ hộ chỉ lấy chủ hàng NCC. Mỗi dòng qua `enriched`. |
| `getDocument(user, id, kind)` ([dòng 136](../../../src/modules/po-receiving/purchase-read.service.js)) | Gọi `enriched` (2.11). Phiếu nhập mua thêm tên NCC, kho, người ghi tồn, thông tin hàng đến, `purchaseOrderNo`, `poLineNote` và giá theo dòng PO. Kiểm nhận thêm `arrival`, `receipts`, `custodyReceipts`, `replacedBy`. Phiếu nhập/giữ hộ thêm `inspectionResult` từng dòng. |
| `custodyMetadata(document, value)` ([dòng 18](../../../src/modules/po-receiving/purchase-read.service.js)) | Phiếu giữ hộ: mã PO, NCC, phiếu kiểm nguồn, vị trí giữ (`holdingLocationId/Code`), `custodyBalanceId` và `returnAvailableQty` = min(lượng dòng − lượng đã đưa vào phiếu trả NCC chưa hủy, `freeQuantity` của số dư); bằng 0 khi phiếu `REVERSED`. |
| `receivingSummary(user, id)` ([dòng 230](../../../src/modules/po-receiving/purchase-read.service.js)) | Đọc PO bằng `getPurchaseOrder` (cần `purchase_order:read`), rồi lọc hàng đến và phiếu nhập theo `po.id` (`_id` đã phân giải). Tổng hợp một PO: `quantities` kèm ảnh dòng, danh sách kiểm nhận/phiếu nhập/giữ hộ (mỗi chứng từ quy về `poLineId`), `tripCount` = số `GoodsArrival`, `openWork` (số kiểm nhận nháp, phiếu nhập nháp). |
| `receivingTrips(user, id, query)` ([dòng 267](../../../src/modules/po-receiving/purchase-read.service.js)) | `findPurchase` PO, rồi `listDocuments('INSPECTION')` với `purchaseOrderId = String(po._id)`. |
| `receivingQueue(user, query)` ([dòng 268](../../../src/modules/po-receiving/purchase-read.service.js)) | `DRAFT_INSPECTION`: kiểm nhận nháp; `AWAITING_POST`: phiếu nhập nháp; `CORRECTION`: kiểm nhận nháp có `previousInspectionId` (đọc hết rồi lọc, phân trang trong bộ nhớ). Hàng đợi `AWAITING_PUTAWAY` đã bỏ từ 17/11/2026. |
| `receivingHistory(user, id, query)` ([dòng 277](../../../src/modules/po-receiving/purchase-read.service.js)) | `audit_logs` của chứng từ (tìm bằng `findPurchase` không `kind`), kèm `actorName`, ẩn giá với vai trò không tài chính. |

## 2B.5. Sửa kết quả kiểm nhận đã xác nhận: `replaceInspection`

[goods-inspection.correction.js](../../../src/modules/goods-inspections/goods-inspection.correction.js): `correctionBlockers` ([dòng 26](../../../src/modules/goods-inspections/goods-inspection.correction.js)), `correctionPreflight` ([dòng 67](../../../src/modules/goods-inspections/goods-inspection.correction.js)), `replaceInspection` ([dòng 81](../../../src/modules/goods-inspections/goods-inspection.correction.js)). Route `GET /api/goods-inspections/:id/correction-preflight` và `POST /api/goods-inspections/:id/corrections` (mã lệnh `REPLACE_GOODS_INSPECTION`, quyền `goods_receipt_inspection:update`).

- **Vai trò nghiệp vụ:** phiếu kiểm đã xác nhận bị sai (đếm nhầm, sai lô, sai chất lượng). Không sửa phiếu cũ mà lập một cặp hàng đến + phiếu kiểm **thay thế** ở `DRAFT`, sau khi đã gỡ hết chứng từ sinh ra từ phiếu cũ.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input` | như form kiểm nhận (2.7) + `expectedVersion`, `operationKey`, `reason`, `evidenceIds?` | Nội dung kiểm mới. `expectedPoVersion` bắt buộc. |
| `inspection`, `arrival` | phiếu kiểm và hàng đến cũ | Phiếu kiểm phải `CONFIRMED`. |
| `blockers[]` | `{ documentType, documentId, documentNo, workflowStatus, action, message }` | Chứng từ còn hiệu lực sinh từ phiếu cũ. |
| `po` | `PurchaseOrder` | `activePo`: PO phải `OPEN/PARTIAL`. |
| `newArrival`, `document` | `GoodsArrival`, `GoodsInspection` mới | `DRAFT`; phiếu kiểm mới có `header.previousInspectionId`, `correctionReason`. |

- **Tương tác DB:** `CustodyReceipt.find`, `PurchaseReceipt.find`, `GoodsInspection.find`, `SupplierReturn.find` (trong `correctionBlockers`), `Attachment` (qua `evidenceFor`), tạo 2 chứng từ mới, `saveVersion(inspection cũ)`.
- **Logic:**

  1. Tìm chứng từ chặn, theo thứ tự xử lý được:

  ```js
  const custodyReceipts = await CustodyReceipt.find({ 'items.sources.documentId': id });
  const receipts = await PurchaseReceipt.find({ workflowStatus: { $nin: ['CANCELLED', 'REVERSED'] },
    $or: [{ 'items.inspectionId': id }, { sources: { $elemMatch: custodyLinked } }, { 'items.sources': { $elemMatch: custodyLinked } }] });
  const ordered = [...receipts.filter(isFromCustody), ...receipts.filter(receipt => !isFromCustody(receipt))];
  ```

  Mỗi phần tử có `action` gợi ý: `CANCEL_RECEIPT`/`REVERSE_RECEIPT` (phiếu nhập `DRAFT`/`POSTED`), `CANCEL_CUSTODY`/`REVERSE_CUSTODY` (phiếu giữ hộ), `USE_REPLACEMENT` (đã có bản thay thế chưa hủy), `null` (phiếu trả NCC trỏ về phiếu kiểm, hoặc trạng thái khác). Phiếu nhập/giữ hộ chỉ thôi chặn khi `CANCELLED` hoặc `REVERSED`.

  2. Preflight trả `{ eligible, blockers, inspectionVersion }` (hoặc `reason` khi phiếu không `CONFIRMED`/thiếu hàng đến). Lệnh thật chạy lại cùng hàm trong transaction và trả lỗi kèm danh sách ở `fieldErrors`:

  ```js
  if (blockers.length) throw validationError(`Cần xử lý ${blockers.length} chứng từ trước khi sửa kết quả kiểm`, blockers);
  await evidenceFor(actor, inspection, input.evidenceIds, session);
  const po = await activePo(actor, arrival.header.purchaseOrderId, input.expectedPoVersion, session);
  ```

  3. Tạo cặp chứng từ thay thế qua cùng `prepare()` của 2.7, giữ bản cũ làm lịch sử:

  ```js
  newArrival.sources = [sourceLink(po), sourceLink(arrival, null, null, 'CORRECTION')];
  document.sources = [sourceLink(newArrival), sourceLink(inspection, null, null, 'REPLACES')];
  await prepare(po, input, actor, session, newArrival, document);
  ...
  await saveVersion(inspection, inspection.version, session);
  ```

  *Tại sao:* phiếu kiểm đã xác nhận là nguồn sự thật cho phiếu nhập và tồn (2.10); sửa tại chỗ sẽ làm sai chuỗi `sources[]` và sổ cái. Bắt gỡ hết chứng từ con trước (hủy nháp hoặc đảo phiếu đã ghi) giữ tồn kho đúng. Phiếu nhập sinh từ giữ hộ xếp trước vì phải đảo nó rồi mới đảo được phiếu giữ hộ (2B.6). Bản cũ chỉ tăng version (để lệnh song song phải tải lại); `replacedBy` trong chi tiết cho FE ẩn nút sửa lần hai. Bản mới đi tiếp bước 7 → 8 như thường và hiện ở hàng đợi `CORRECTION`. Vì gọi `activePo`, PO đã `CLOSED` phải được mở lại (2B.3.4) trước khi sửa kết quả kiểm.

## 2B.6. Đảo phiếu nhập hoặc giữ hộ đã ghi tồn: `reverseReceipt`

[stock-reversal.service.js](../../../src/modules/stock-reversals/stock-reversal.service.js): `checkDependentDocuments` ([dòng 20](../../../src/modules/stock-reversals/stock-reversal.service.js)), `eligible` ([dòng 36](../../../src/modules/stock-reversals/stock-reversal.service.js)), `reversalPreflight` ([dòng 103](../../../src/modules/stock-reversals/stock-reversal.service.js)), `getReversal` ([dòng 123](../../../src/modules/stock-reversals/stock-reversal.service.js)), `reverseReceipt` ([dòng 128](../../../src/modules/stock-reversals/stock-reversal.service.js)). Route phiếu nhập mua `GET .../reversal-preflight`, `POST .../reverse` (body thêm `expectedPoVersion`); route giữ hộ tương tự dưới `/api/custody-receipts`. Mã lệnh `REVERSE_PURCHASE_RECEIPT` hoặc `REVERSE_CUSTODY_RECEIPT`.

- **Vai trò nghiệp vụ:** hủy hiệu lực tồn của một phiếu đã ghi (nhập nhầm, hàng phải trả lại toàn bộ...) bằng một bút toán ngược, không xóa phiếu gốc.
- **Quyền:** `command()` kiểm `goods_receipt_inspection:reverse`; `work` và `authorizeReplay` kiểm thêm `:post`. Theo seed, Thủ kho có cả hai và không cần ai duyệt.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `receipt` | `PurchaseReceipt` \| `CustodyReceipt` | Phiếu `POSTED`, đúng `expectedVersion`. |
| `custody` | bool | `kind === 'CUSTODY_RECEIPT'`. |
| `original` | `StockTransaction` | Bút toán ghi tồn gốc (`receipt.stockTransactionId`). |
| `balances` | `Map<balanceId, state>` | Mô phỏng trừ dần: `{ location, portions, free, required }`. |
| `portionIds` | `Map<movementId, id[]>` | Kiện được chọn để lấy lại cho từng movement. |
| `restored` | `Map` | Kiện của phiếu giữ hộ đã từng chuyển sang mua rồi bị đảo về (`restoredCustodyPortions`). |
| `reversal` | `StockReversal` | `PĐN-...`, mỗi dòng sao từ dòng phiếu gốc, `sources` `REVERSES` trỏ movement gốc. |
| `posting` | `StockTransaction` | `operation: 'REVERSAL'`, `reversedTransactionId = original._id`. |
| `po` | `PurchaseOrder` \| null | Chỉ phiếu nhập mua; đúng `expectedPoVersion`. |

- **Tương tác DB:** `StockTransaction` (đọc gốc, ghi đảo), `InventoryBalance`/`StockHoldingPoint`/`WarehouseLocation` (qua `sourceContext`), `TransferOrder.exists`, `StocktakeCount.exists`, `DefectReport.exists`, `StockReservation` (qua `freeQuantity`), mọi model có `items` (qua `checkDependentDocuments`), `Attachment`, `StockReversal.save`, `saveVersion(receipt)`, `saveVersion(PO)`.
- **Logic `eligible(receipt, actor, session)`** (dùng cho cả preflight và lệnh thật):

  1. Điều kiện chứng từ:

  ```js
  if (receipt.workflowStatus !== 'POSTED') throw validationError('Phiếu chưa ghi hoặc đã đảo');
  if (custody && receipt.header.ownerType !== 'SUPPLIER') throw validationError('Chỉ đảo phiếu giữ hộ nhà cung cấp');
  if (!original?.movements.length || original.reversedTransactionId || await StockTransaction.exists({ reversedTransactionId: original._id }))
    throw validationError('Giao dịch gốc không đủ điều kiện đảo');
  if (custody) await checkDependentDocuments(receipt, custody, session);
  ```

  2. Duyệt ngược từng movement, mỗi số dư kiểm một lần: cùng kho; không có lệnh chuyển `DRAFT/OPEN/PARTIAL` lấy từ số dư; vị trí chưa có lượt đếm kiểm kê sau thời điểm ghi gốc; không có phần giữ báo lỗi `ACTIVE`:

  ```js
  if (await TransferOrder.exists({ workflowStatus: { $in: ['DRAFT', 'OPEN', 'PARTIAL'] }, 'items.details.sourceBalanceId': move.toBalanceId })) throw validationError('Đã lập lệnh sử dụng nguồn tồn');
  if (await StocktakeCount.exists({ locationId: location._id, recordedAt: { $gte: original.recordedAt } })) throw validationError('Nguồn đã được kiểm kê sau nhập');
  if (await DefectReport.exists({ holds: { $elemMatch: { status: 'ACTIVE', 'allocations.balanceId': move.toBalanceId } } })) throw validationError('Tồn đang bị chặn');
  ```

  3. Chọn đúng kiện của phiếu theo `packagingPortionIds` của movement và mô phỏng tách:

  ```js
  let chosen = ids.size ? state.portions.filter(portion => ids.has(String(portion._id))) : state.portions;
  ...
  if (ids.size && !quantity(chosen).eq(amount)) throw validationError('Lượng theo quy cách gốc đã thay đổi');
  ({ kept } = splitPortions(chosen, amount, actor._id));
  // lỗi 400 ⇒ "Hàng của phiếu đã bị chuyển, xuất hoặc mở thùng tại vị trí ..."
  state.required = state.required.plus(amount);
  if (state.required.gt(state.free)) throw validationError(`Hàng đang được giữ chỗ hoặc chờ chuyển, chỉ còn khả dụng ${state.free.toFixed()}`);
  ```

  Movement cũ không có `packagingPortionIds` thì lấy cả số dư (comment `shortcut` trong code). Với giữ hộ, nếu kiện gốc đã bị tách khi chuyển sang mua rồi được đảo về, `restoredCustodyPortions` bổ sung id kiện mới.

  4. Với phiếu nhập mua, `checkDependentDocuments` chạy **cuối**: bất kỳ chứng từ nào (trừ `stock_reversals`) chưa `CANCELLED/REJECTED/REVERSED` có `sources` trỏ về phiếu ⇒ "Có chứng từ phụ thuộc trong ...". Với giữ hộ, hàm chạy **đầu** và báo riêng "Hủy/Đảo phiếu nhập ... trước" khi còn phiếu nhập sinh từ giữ hộ.

- **Logic `reverseReceipt`:**

  ```js
  await evidenceFor(actor, receipt, input.evidenceIds, session);
  const { original, locations, portionIds } = await eligible(receipt, actor, session);
  await guardLocations(locations, session);
  ...
  const posting = beginStock(reversal, actor, 'REVERSAL', input);
  posting.reversedTransactionId = original._id;
  for (const move of [...original.movements].reverse()) {
    let target = null;
    if (!custody && item.custodyBalanceId) { /* phiếu nhập từ giữ hộ: trả về số dư NCC gốc */ target = ctx.balance; }
    await transferCustodyStock(move.toBalanceId, target, { ...reversalItem.toObject(), qtyBase: String(move.quantityBase) }, posting, actor, session, portionIds.get(String(move._id)));
  }
  await verifyCapacity(locations, session); await posting.save({ session });
  receipt.workflowStatus = 'REVERSED';
  if (po && po.workflowStatus !== 'CLOSED') po.workflowStatus = receivingStatus(await purchaseOrderQuantities(po, session));
  ```

  *Tại sao:* đảo theo kiện của chính phiếu cho phép hai phiếu nhập cùng lô vào cùng bãi đảo độc lập (trước 20/11/2026 mọi giao dịch chạm số dư đều chặn). Kiểm `freeQuantity` theo tổng cần đảo trên mỗi số dư để không lấy mất phần đã giữ cho đơn bán hay lệnh chuyển. Lượt đếm kiểm kê sau nhập nghĩa là số dư đã được đối chiếu; đảo lúc này làm sai biên bản kiểm. PO `CLOSED` giữ nguyên vì lượng chốt thiếu đã được duyệt; Kế toán mở lại bằng `reopenPurchaseOrder` (2B.3.4). PO khác trở về `PARTIAL` hoặc `OPEN`, kể cả PO đang `COMPLETED`. Chi tiết phiếu đảo đọc qua `GET /api/stock-reversals/:id` (`getReversal`, kiểm kho trong `header.warehouseIds`). Điều kiện và dữ liệu lịch sử: [GOODS_RECEIPTS](../08_api/GOODS_RECEIPTS.md#hủy-nháp-và-đảo-phiếu).

## 2B.7. Bằng chứng đính kèm

[purchase-evidence.service.js](../../../src/modules/po-receiving/purchase-evidence.service.js) kết hợp lớp lưu trữ và kiểm tệp tách riêng tại [evidence-storage.js](../../../src/shared/utils/evidence-storage.js) (`evidenceStorage`, `inspectFile`, `MAX_BYTES`), dùng chung cho PO, kiểm nhận, phiếu nhập, giữ hộ, lệnh chuyển và nhập khác.

- **Vai trò nghiệp vụ:** lưu ảnh/PDF làm căn cứ (biên bản giao nhận, ảnh hàng vỡ, xác nhận NCC) gắn vào đúng chứng từ.
- **Route:** `purchaseDocumentRouter` trong [po-receiving.routes.js](../../../src/modules/po-receiving/po-receiving.routes.js) gắn `checkPermission('goods_receipt_inspection:read')` cho `GET /:id/history`, nhưng bốn route bằng chứng **không** có `checkPermission`: quyền chỉ biết sau khi đọc chứng từ cha.
- **Quyền — `parent(user, id, write, session)`** ([dòng 10](../../../src/modules/po-receiving/purchase-evidence.service.js)): PO ⇒ `purchase_order:read/update` (ghi không có `:update` thì cần `purchase_order:approve_exception`); lệnh chuyển ⇒ `stock_relocation:read/confirm`; nhập khác ⇒ `goods_receipt_other:read/create` (phiếu `POSTED` cần `:reverse`); giữ hộ: người có `purchase_custody:decide` được ghi; còn lại ⇒ `goods_receipt_inspection:read/update`.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `file` | multer buffer | Một tệp JPEG/PNG/PDF ≤ 5 MB (giới hạn ở route và `MAX_BYTES`). |
| `lineId` | ObjectId? | Gắn tệp vào một dòng cụ thể. |
| `attachment` | `Attachment` | `purpose: 'PURCHASE_EVIDENCE'`, `status: 'TEMPORARY'`, `expiresAt` = +24 giờ, `accessCategory` `PURCHASE_PRICE` với PO, `BUSINESS` với loại khác. |
| `storageKey` | string | `sep490/purchase-evidence/<id>` (thêm `.pdf` với PDF). Lưu riêng tư (`type: 'authenticated'`) trên Cloudinary hoặc thư mục cục bộ khi `EVIDENCE_STORAGE_PROVIDER=local` (chỉ bật ngoài `production` để test/local). |

- **Logic:**
  1. `uploadEvidence` ([dòng 23](../../../src/modules/po-receiving/purchase-evidence.service.js)): `inspectFile` ([evidence-storage.js:74](../../../src/shared/utils/evidence-storage.js)) kiểm magic bytes và giải mã thật PNG/JPEG (≤ 10 MP) hoặc PDF (1–2000 trang, không mã hóa), tạo `Attachment` `TEMPORARY`, tải lên `evidenceStorage.upload`. Storage lỗi ⇒ cho `expiresAt` hết hạn ngay để job dọn.
  2. `attachEvidence` ([dòng 34](../../../src/modules/po-receiving/purchase-evidence.service.js)): ngoài transaction tìm tệp theo `ownerDocumentId = parentDoc._id` (chứng từ cha đã phân giải) và kiểm tệp có thật trên storage (`evidenceStorage.exists`); trong `command()` (`ATTACH_PURCHASE_EVIDENCE`) đổi tệp `TEMPORARY` còn hạn của chính người tải sang `ATTACHED`, ghi `ownerRevision`, thêm vào `document.evidenceIds`, tăng version chứng từ:

  ```js
  const write = await Attachment.updateOne({ _id: attachment._id, status: 'TEMPORARY', expiresAt: { $gt: new Date() } },
    { $set: { status: 'ATTACHED', ownerRevision: document.version + 1 }, $unset: { expiresAt: 1, uploadSessionId: 1 } }, { session, runValidators: true });
  if (write.matchedCount !== 1) throw validationError('Tệp vừa được xử lý');
  document.evidenceIds.addToSet(attachment._id);
  ```

     Trong transaction cũng lọc `ownerDocumentId: document._id`. `targetId` truyền vào `command()` vẫn là `id` client gửi, để `requestHash` của lệnh cũ không đổi khi replay.
  3. `listEvidence` / `downloadEvidence` ([dòng 51](../../../src/modules/po-receiving/purchase-evidence.service.js), [dòng 54](../../../src/modules/po-receiving/purchase-evidence.service.js)): lọc `Attachment` theo `document._id` trả từ `parent()`; ẩn tệp `PURCHASE_PRICE` với vai trò không phải Owner/Kế toán; `evidenceStorage.download` trả link ký hạn 60 giây (Cloudinary) hoặc data URL (local).

  *Tại sao lọc theo `document._id` (sửa 25/11/2026):* `Attachment.ownerDocumentId` lưu `_id` của chứng từ. Trước đó ba hàm lọc bằng `id` thô từ URL; gọi bằng `documentNo` của chứng từ lịch sử (`_id` ObjectId) thì danh sách rỗng và không gắn được tệp.
  4. Lệnh nghiệp vụ dùng `evidenceFor` (2B.1): tái kiểm và quyết định giữ hộ **bắt buộc** bằng chứng; đảo phiếu, sửa kết quả kiểm và chốt thiếu PO nhận bằng chứng tùy chọn.
  5. `cleanupPurchaseEvidence` ([dòng 59](../../../src/modules/po-receiving/purchase-evidence.service.js)) chạy qua `node scripts/purchase-maintenance.mjs cleanup-evidence [--apply]` ([purchase-maintenance.mjs](../../../scripts/purchase-maintenance.mjs)); không có `--apply` chỉ đếm. Mỗi tệp hết hạn được "giữ chỗ" bằng `SUPERSEDED` + token trước khi xóa trên storage.

  *Tại sao hai bước tải và gắn:* tải tệp lên storage không thể nằm trong transaction MongoDB. Tách bước cho phép retry gắn an toàn (`command()` có idempotency) và tệp mồ côi tự hết hạn.

## 2B.8. Nhánh hàng giữ hộ nhà cung cấp

Dòng kiểm `CUSTODY` (bắt buộc với hàng không `GOOD`) sinh `CustodyReceipt` `PNGH-...` `DRAFT` ở bước 7. Hàng này **không** thuộc cửa hàng (`ownerType: 'SUPPLIER'`, `ownerId` = NCC), không tính vào tồn khả dụng và không làm PO tiến trạng thái. Từ đây có hai lối ra: Kế toán quyết định **nhận sở hữu** (thành phiếu nhập mua) hoặc **trả NCC** (thành phiếu xuất giữ hộ). [Service giữ hộ](../../../src/modules/custody/custody.service.js).

```text
PNGH DRAFT ─post (2B.8.1)─► PNGH POSTED ─┬─ tái kiểm (2B.8.2, tùy chọn) ─► PKN CONFIRMED (REINSPECTION)
                                          ├─ quyết định ACCEPT (2B.8.3) ─► lập PNM DRAFT (2B.8.4) ─post─► tồn STORE ở RECEIVING (2B.8.5)
                                          ├─ quyết định RETURN (2B.8.3) ─► lập PXGH DRAFT (2B.8.4) ─post─► trừ tồn NCC (2B.8.6)
                                          ├─ trả NCC qua luồng supplier return (2B.11)
                                          └─ đảo phiếu (2B.6)
```

**Hàm phụ trợ** ([custody-stock.js](../../../src/modules/custody/custody-stock.js), [custody.service.js](../../../src/modules/custody/custody.service.js)):

| Hàm | Vai trò |
|---|---|
| `custody(id, actor, session, version)` | Đọc phiếu giữ hộ, kiểm version (nếu có), phải `POSTED` và chủ hàng NCC. |
| `origin(d, item, session)` | Lần ngược dòng giữ hộ → dòng kiểm → hàng đến; NCC của hàng đến phải là chủ hàng. |
| `allocations(d, item, session)` | Movement đúng một cái của dòng trong bút toán ghi giữ hộ ⇒ `toBalanceId` là số dư NCC. |
| `consumed(d, item, session)` | Tổng lượng dòng đã đưa vào `PurchaseReceipt`/`CustodyRelease` chưa `CANCELLED/REVERSED`. |
| `available(d, item, quantity, session)` | Lượng > 0, đúng đơn vị gốc, `consumed + quantity ≤ item.qtyBase` ("Vượt lượng giữ hộ chưa cam kết"). |

### 2B.8.1. Ghi tồn giữ hộ: `postCustodyReceipt(user, id, input)`

[custody.service.js:56](../../../src/modules/custody/custody.service.js). Route `POST /api/custody-receipts/:id/post`, mã lệnh `POST_PURCHASE_CUSTODY`, quyền `goods_receipt_inspection:post`.

- **Vai trò nghiệp vụ:** đưa hàng không đạt (hoặc tạm giữ) vào vị trí giữ hộ/cách ly, có sổ cái, để theo dõi tới khi trả hoặc nhận.
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input.destinations[]` | `{ lineId, locationId }` | Đúng một vị trí cho mỗi dòng; vị trí loại `CUSTODY` hoặc `QUARANTINE`. |
| `input.packaging[]` | như 2.10 | Khai kiện tùy chọn. |
| `input.handedOverBy` | string? | Người bàn giao, tùy chọn ("chưa xác nhận nghĩa nghiệp vụ" theo comment code). |
| `origin` | dòng kiểm gốc | Phải `CUSTODY`, cùng NCC, lô, sản phẩm, lượng. |
| `target` | `InventoryBalance` | Số dư (vị trí, lô, chất lượng của dòng kiểm, `SUPPLIER`, NCC). |
| `posting` | `StockTransaction` | `operation: 'CUSTODY_RECEIPT'`. |

- **Logic:**

  ```js
  if (receipt.workflowStatus !== "DRAFT" || receipt.header.ownerType !== "SUPPLIER" || !receipt.items.length) throw validationError("Phiếu giữ hộ không còn nháp");
  if (input.destinations.length !== receipt.items.length || ...) throw validationError("Chọn vị trí cho mỗi dòng giữ hộ");
  await guardLocations(locations, session);
  ...
  await locationAt(dest.locationId, receipt.header.warehouseId, ["CUSTODY", "QUARANTINE"], session);
  const target = await balanceAt({ type: "LOCATION", locationId: dest.locationId },
    { batchId: item.lotId, ownerType: "SUPPLIER", ownerId: receipt.header.ownerId }, origin.details.qualityCode, session);
  await receiveStock(target, item, portions, posting, actor, session, origin.details.packagingCondition);
  ```

  *Tại sao:* hàng vẫn chiếm chỗ và có thể bị yêu cầu trả, nên phải có tồn và sổ cái, nhưng chủ hàng là NCC nên `availableStock` (chỉ `STORE`) không đếm. Chất lượng của số dư giữ đúng kết quả kiểm (`DAMAGED`, `PENDING`...). Thông báo `POST_PURCHASE_CUSTODY` gửi người có `purchase_custody:decide`.

### 2B.8.2. Tái kiểm hàng giữ hộ: `reinspectCustody(user, id, input)`

[custody.service.js:139](../../../src/modules/custody/custody.service.js). Route `POST /api/custody-receipts/:id/reinspections`, mã lệnh `REINSPECT_PURCHASE_CUSTODY`, quyền `goods_receipt_inspection:update`.

- **Vai trò nghiệp vụ:** kiểm lại phần hàng đang giữ (ví dụ hàng `PENDING` nay xác định là `GOOD`) làm căn cứ cho quyết định nhận sở hữu.
- **Từ điển biến:** `input.lines[]` (`{ custodyItemId, qtyBase, qualityCode }`, không trùng dòng), `input.reason`, `input.evidenceIds` (**bắt buộc**), `inspected` (phiếu kiểm mới).
- **Logic:**

  ```js
  const d = await custody(id, actor, session, input.expectedVersion);
  await evidenceFor(actor, d, input.evidenceIds, session, true);
  const inspected = await newDocument(GoodsInspection, 'INS', actor, { warehouseId, participants: [actor._id], confirmedBy, confirmedAt }, [], 'CONFIRMED');
  for (...) { await available(d, item, line.qtyBase, session); const o = await origin(d, item, session);
    inspected.items.push(copyItem(item, line.qtyBase, { lineKind: 'INSPECTION', sources: [sourceLink(d, item, line.qtyBase, 'REINSPECTION')],
      details: { inspectedSourceLineId: o.arrived._id, qualityCode: line.qualityCode, ownershipDecision: 'CUSTODY', ... } })); }
  await saveVersion(d, d.version, session);
  ```

  *Tại sao:* kết quả tái kiểm là một phiếu kiểm độc lập, sinh thẳng ở `CONFIRMED`, không sửa phiếu kiểm gốc. Tồn chưa đổi chất lượng ở bước này; số dư chỉ đổi chủ/chất lượng khi phiếu nhập từ giữ hộ được ghi (2B.8.5).

### 2B.8.3. Quyết định xử lý: `decideCustody(user, id, input)`

[custody.service.js:177](../../../src/modules/custody/custody.service.js). Route `POST /api/custody-receipts/:id/resolution-decisions`, mã lệnh `DECIDE_PURCHASE_CUSTODY`, quyền `purchase_custody:decide` (Kế toán).

- **Vai trò nghiệp vụ:** Kế toán thỏa thuận với NCC: nhận mua phần nào (`ACCEPT`) hay trả lại phần nào (`RETURN`).
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input.decision` | `'ACCEPT' \| 'RETURN'` | Hướng xử lý. |
| `input.lines[]` | `{ custodyItemId, qtyBase, reinspectionId? }` | Lượng từng dòng; `reinspectionId` chọn kết quả tái kiểm làm căn cứ. |
| `input.evidenceIds` | ObjectId[] | **Bắt buộc**. |
| `check` | dòng kiểm | Kết quả kiểm gốc hoặc tái kiểm dùng làm căn cứ `ACCEPT`. |
| `decision` | `ApprovalHistory` | `decisionScope: 'PURCHASE_CUSTODY'`, `decision: 'APPROVE'`, `reviewedContent: { action, lines }`, `subjectRevision = d.version`. |

- **Logic:**

  ```js
  await available(d, item, line.qtyBase, session);
  if (input.decision === 'ACCEPT') {
    check = line.reinspectionId ? /* dòng của phiếu tái kiểm CONFIRMED trỏ về phiếu giữ hộ */ : (await origin(d, item, session)).row;
    if (!check || check.details.qualityCode !== 'GOOD' || exact(line.qtyBase).gt(String(check.qtyBase)))
      throw validationError('Nhận sở hữu cần kết quả GOOD đủ lượng');
  }
  const decision = await new ApprovalHistory({ ..., subjectRevision: d.version, reviewedContent: { action: input.decision, lines: reviewed } }).save({ session });
  await saveVersion(d, d.version, session);
  ```

  *Tại sao:* chỉ hàng có kết quả kiểm `GOOD` mới được nhận sở hữu (cùng quy tắc với 2.7). Quyết định ghi `subjectRevision = d.version` rồi tăng version phiếu giữ hộ; lệnh thực hiện (2B.8.4) đòi `subjectRevision + 1 === version`, nên một quyết định cũ không dùng được sau khi phiếu giữ hộ đã đổi. Thông báo `DECIDE_PURCHASE_CUSTODY` gửi người có `purchase_custody:execute`.

### 2B.8.4. Lập chứng từ thực hiện: `createCustodyResolution(user, id, input, action)`

[custody.service.js:233](../../../src/modules/custody/custody.service.js). Route `POST /api/custody-receipts/:id/purchase-receipts` (`action = 'ACCEPT'`, body thêm `expectedPoVersion` và `destinationLocationId` mỗi dòng) và `POST /api/custody-receipts/:id/releases` (`'RETURN'`). Mã lệnh `CREATE_CUSTODY_ACCEPT` / `CREATE_CUSTODY_RETURN`, quyền `purchase_custody:execute` (Thủ kho).

- **Vai trò nghiệp vụ:** từ quyết định của Kế toán, kho lập phiếu nháp để thực hiện: phiếu nhập mua (`PNM`) hoặc phiếu xuất giữ hộ (`PXGH`).
- **Từ điển biến:**

| Tên biến | Kiểu | Vai trò |
|---|---|---|
| `input.decisionId` | ObjectId | Quyết định ở 2B.8.3, `reviewedContent.action` phải bằng `action`. |
| `approved` | dòng quyết định | Lượng dòng ≤ lượng đã quyết. |
| `move`, `ctx` | movement, số dư | Số dư NCC của dòng, phải đúng chủ hàng và kho. |
| `po`, `q`, `committed` | PO, hạn mức | Chỉ `ACCEPT`: `activePo` và `acceptanceHeadroomQtyBase` của dòng PO. |
| `doc` | `PurchaseReceipt` \| `CustodyRelease` | Chứng từ `DRAFT` mới, `custodyDecisionId` = quyết định. |

- **Logic:**

  ```js
  if (!decision || decision.subjectRevision + 1 !== d.version || decision.reviewedContent.action !== action) throw validationError('Quyết định không đúng nguồn/phiên bản');
  ...
  if (action === 'ACCEPT') {
    po = await activePo(actor, o.arrival.header.purchaseOrderId, input.expectedPoVersion, session);
    if (!q || exact(line.qtyBase).plus(committed).gt(q.acceptanceHeadroomQtyBase)) throw validationError('PO hết hạn mức');
    await locationAt(line.destinationLocationId, d.header.warehouseId, ['RECEIVING'], session);
    overrides = { ..., purchaseOrderItemId, arrivalItemId, inspectionId: approved.reinspectionId || o.inspection._id,
      inspectionResultId: approved.inspectionItemId, destinationLocationId, custodyReceiptRef: {...}, custodyBalanceId: move.toBalanceId };
  }
  doc.items.push(copyItem(item, line.qtyBase, overrides));
  ...
  if (po) await saveVersion(po, po.version, session); await saveVersion(d, d.version, session);
  ```

  *Tại sao:* nhận sở hữu là mua thêm theo PO gốc, nên phải còn hạn mức PO và PO phải mở. `custodyBalanceId` đánh dấu dòng phiếu nhập này lấy hàng từ số dư NCC, không phải hàng mới về. Phiếu nhập này được ghi bằng `postReceipt` (2.10) nhưng đi nhánh `postOwnedCustody`.

### 2B.8.5. Ghi phiếu nhập từ giữ hộ: `postOwnedCustody` và `transferCustodyStock`

[custody-stock.js:145](../../../src/modules/custody/custody-stock.js) (`postOwnedCustody`) và [dòng 91](../../../src/modules/custody/custody-stock.js) (`transferCustodyStock`). Được `postReceipt` gọi cho dòng có `custodyBalanceId`; `capabilities.post` của phiếu này đòi thêm `purchase_custody:execute`.

- **Vai trò nghiệp vụ:** đổi chủ hàng từ NCC sang cửa hàng và đưa hàng sang bãi tiếp nhận, giữ nguyên các kiện đã đo lúc nhập giữ hộ.
- **Từ điển biến:** `d` (phiếu giữ hộ nguồn), `original` (dòng giữ hộ), `decision` (phải `ACCEPT` của đúng phiếu), `move` (movement ghi giữ hộ; `toBalanceId` phải bằng `item.custodyBalanceId`), `checked` (kết quả kiểm `GOOD`), `ids` (kiện gốc + kiện đã trả về qua `restoredCustodyPortions`), `target` (số dư `STORE`/`GOOD` ở `RECEIVING`).
- **Logic:**

  ```js
  requirePermission(actor, 'purchase_custody:execute');
  if (ctx.balance.ownerType !== 'SUPPLIER' || !same(ctx.balance.ownerId, po.header.supplierId) || ... || !same(ctx.balance.batchId, item.lotId)) throw validationError('Sai chủ/lô/kho giữ hộ');
  if (!checked || checked.details.qualityCode !== 'GOOD') throw validationError('Chưa có kết quả GOOD');
  await locationAt(item.destinationLocationId, po.header.warehouseId, ['RECEIVING'], session);
  await guardLocations([ctx.location._id, item.destinationLocationId], session);
  const target = await balanceAt({ type: 'LOCATION', locationId: item.destinationLocationId }, { batchId: item.lotId, ownerType: 'STORE', ownerId: null }, 'GOOD', session);
  await transferCustodyStock(item.custodyBalanceId, target, item, posting, actor, session, ids);
  ```

  `transferCustodyStock(sourceId, target, item, posting, actor, session, preferredIds)`: lượng phải ≤ `freeQuantity` của số dư nguồn; số dư không có phần giữ báo lỗi `ACTIVE`; tách kiện bằng `splitPortions` trên `preferredIds` (nếu có); trừ nguồn theo `version`; nếu có `target` thì cộng đích theo `version` và ghi movement hai đầu, nếu `target = null` thì movement chỉ có đầu `from` (hàng rời kho).

  *Tại sao:* một hàm dùng chung cho ba việc: đổi chủ (giữ hộ → mua), trả NCC (`target = null`) và đảo phiếu (2B.6). Giữ kiện cũ thay vì sinh kiện mới để thể tích đã đo không bị tính lại.

### 2B.8.6. Trả hàng giữ hộ cho NCC: `postCustodyRelease(user, id, input)`

[custody.service.js:305](../../../src/modules/custody/custody.service.js). Route `POST /api/custody-releases/:id/post`, mã lệnh `POST_PURCHASE_CUSTODY_RELEASE`, quyền `purchase_custody:execute`.

- **Vai trò nghiệp vụ:** bàn giao hàng giữ hộ cho NCC mang đi, trừ tồn NCC khỏi kho.
- **Từ điển biến:** `input.recipientName` (bắt buộc), `doc` (`CustodyRelease` `DRAFT`), `decision` (phải `RETURN`), `posting` (`operation: 'CUSTODY_RELEASE'`).
- **Logic:**

  ```js
  if (doc.workflowStatus !== 'DRAFT') throw validationError('Phiếu không còn nháp');
  if (!decision || decision.reviewedContent.action !== 'RETURN') throw validationError('Thiếu thỏa thuận trả');
  for (const item of doc.items) { ... await guardLocations([ctx.location._id], session);
    await transferCustodyStock(move.toBalanceId, null, item, posting, actor, session); await saveVersion(d, d.version, session); }
  doc.header.recipientName = input.recipientName; doc.header.releasedBy = actor._id; doc.header.releasedAt = new Date(); doc.workflowStatus = 'POSTED';
  ```

  *Tại sao:* trả hàng giữ hộ là việc của NCC nhận lại tài sản của chính họ, không phải xuất bán hay trả hàng mua, nên đi chứng từ riêng và không đụng PO.

### 2B.8.7. Hủy, đảo phiếu giữ hộ và giới hạn của phiếu trả giữ hộ (`PXGH`)

- **Hủy phiếu giữ hộ (`PNGH`) `DRAFT`:** `cancelDraft(..., 'CUSTODY_RECEIPT')` ([purchase-core.js:88](../../../src/shared/utils/purchase-core.js), mục 2B.4.3), từ chối nếu chủ hàng không phải NCC.
- **Đảo phiếu giữ hộ (`PNGH`) `POSTED`:** `reverseReceipt(..., 'CUSTODY_RECEIPT')` ([stock-reversal.service.js:128](../../../src/modules/stock-reversals/stock-reversal.service.js), mục 2B.6). Phải hủy/đảo trước mọi phiếu nhập sinh từ giữ hộ. Hàng đã đảo về số dư NCC muốn nhận lại thì đi lại luồng quyết định giữ hộ (2B.8.3), không lập phiếu kiểm mới (giới hạn ghi trong changelog 23/11/2026).
- **Giới hạn hiện tại của phiếu xuất trả giữ hộ (`CustodyRelease` / `PXGH`):** [custody.routes.js:33-36](../../../src/modules/custody/custody.routes.js) hiện chỉ mở hai route `GET /api/custody-releases/:id` và `POST /api/custody-releases/:id/post` — **không có** API sửa nháp, **không có** API hủy nháp (`cancelDraft` chưa mở cho `CUSTODY_RELEASE`) và **không có** API đảo sau khi ghi tồn. Lưu ý hệ quả: nếu lập nhầm một `PXGH` ở `DRAFT`, lượng trên phiếu đó vẫn được `consumed()` ([custody.service.js:27](../../../src/modules/custody/custody.service.js)) tính là đã cam kết nên không dùng để lập phiếu khác từ `PNGH` cho tới khi có API hủy.

## 2B.9. Đọc lệnh chuyển vị trí: `getLocationMovement`, `listLocationMovements`

[location-movement.service.js:80](../../../src/modules/location-movements/location-movement.service.js), [:93](../../../src/modules/location-movements/location-movement.service.js). Route `GET /api/location-movements/:id` và `GET /api/location-movements`, quyền `stock_relocation:read`. Chỉ đọc.

- **Vai trò nghiệp vụ:** xem lệnh chuyển, các lần xác nhận một phần và ai đã thực hiện.
- **Từ điển biến:**

| Tên biến | Vai trò |
|---|---|
| `movementDetailFields`, `relocationLedgerFields` ([movement-read-fields.js](../../../src/shared/utils/movement-read-fields.js)) | Trường được chọn của lệnh và bút toán. |
| `transactions` | Mọi `StockTransaction` có `sourceType: 'transfer_orders'`, `sourceId` = lệnh, sắp theo thời gian. |
| `performedByName` | Tên người thực hiện; người đã bị xóa ⇒ "Không còn trong danh mục". |
| `movementDisplay(documents, includeLines)` ([dòng 24](../../../src/modules/location-movements/location-movement.service.js)) | Gắn tên kho; với chi tiết gắn thêm `fromLocation`, `toLocation`, `lot` của từng dòng. Chỉ gọi **sau** khi đã kiểm phạm vi kho. |
| `query.q` | Tìm theo mã lệnh, tên sản phẩm, SKU hoặc số lô NSX. |

- **Logic:** chi tiết đọc lệnh, kiểm kho bằng `requireWarehouseAccess`, chỉ nhận `taskKind: 'RELOCATE'` (loại khác ⇒ 404). Danh sách lọc `taskKind: 'RELOCATE'`; người không phải Owner chỉ thấy kho được gán; phân trang qua `movementList`, kèm `summary` đếm lệnh đang dở / đã xong (`CONFIRMED`) / đã hủy.

  *Tại sao đọc mọi bút toán:* `document.stockTransactionId` chỉ trỏ lần xác nhận gần nhất (2.15). Lịch sử đầy đủ của các lần xác nhận một phần nằm ở các bút toán cùng `sourceId`.

## 2B.10. Đối soát mua hàng: `reconcilePurchasing(session)`

[purchase-reconciliation.js:6](../../../src/modules/po-receiving/purchase-reconciliation.js). Chỉ đọc, chạy bằng `node scripts/purchase-maintenance.mjs reconcile` (cần `MONGODB_URI`, thoát mã 1 khi có lỗi) và trong `test/native-api.integration.test.js`. Không có API HTTP.

- **Vai trò nghiệp vụ:** phát hiện dữ liệu lệch giữa sổ cái, số dư, kiện và hạn mức mua.
- **Mã lỗi trả về** (`{ ok, checked, issues }`):

| Mã | Điều kiện |
|---|---|
| `MISSING_BALANCE` | Movement trỏ số dư không tồn tại. |
| `LEDGER_BALANCE` | Tổng movement vào/ra của số dư ≠ `quantityBase`. |
| `PACKAGING_BALANCE` | Tổng kiện ≠ `quantityBase`. |
| `RR_ALLOWANCE` | Dòng PO (không `CANCELLED`) vượt `approvedQtyBase` của dòng RR theo `withinApproved`. |
| `PO_ALLOWANCE` | `outstandingQtyBase` hoặc `acceptanceHeadroomQtyBase` âm. |

  *Tại sao dùng lại `withinApproved` và `purchaseOrderQuantities`:* đối soát phải cùng quy tắc với lệnh ghi, nếu không sẽ báo lỗi giả hoặc bỏ sót. Hàm quét toàn bộ số dư và bút toán, nên chỉ chạy định kỳ hoặc khi điều tra.

## 2B.11. Luồng thượng nguồn và hạ nguồn

**Đầu vào của RR** (`source.triggerType`):

| Nguồn | Từ đâu | Kiểm ở `resolveSource` |
|---|---|---|
| `MANUAL_OTHER` | Người lập tự nhập | Không kiểm. |
| `STOCK_THRESHOLD` | Định mức tồn của sản phẩm theo kho (`product.stockThresholds`) | Không kiểm chứng từ; định mức dùng trong cảnh báo `STOCK_SUFFICIENT`. |
| `SALES_SHORTAGE` | Yêu cầu mua hàng của khách (`SalesOrder`, collection `sales_orders`) hoặc yêu cầu xuất kho (`warehouse_issue_requests`) | Kiểm quyền đọc, trạng thái và sản phẩm. Nguồn yêu cầu xuất phải lần được về dòng `SalesOrder`. Khi gửi duyệt, đối chiếu phiên bản nguồn. |
| `STOCKTAKE_LOW_STOCK` | Đợt kiểm kê `COMPLETED/CLOSED` cùng kho | Có `header.completedAt` và sản phẩm thuộc dòng kiểm kê hoặc snapshot kiểm kê. |

**Thiếu hàng theo yêu cầu của khách.** Khi lập yêu cầu hoặc sửa lịch giao, backend có thể giữ phần tồn khả dụng và ghi chú phần thiếu. `notifySalesShortage` tạo thông báo trong ứng dụng cho Owner và Kế toán đang hoạt động. Màn chi tiết tính tiến độ theo dòng từ lượng xuất đã ghi, lượng giao thất bại đã nhập lại, lượng đã hủy, lượng giữ còn lại và tồn khả dụng theo lô. Nhân viên vẫn lập RR bằng `createReplenishment`. Dòng RR lưu tham chiếu nguồn trong `details.source` và `sources[]` với `REPLENISHES_DEMAND`. Khi PO về, phiếu nhập cộng vào tồn chung ở bãi tiếp nhận. Lệnh nhập và BF03 không tạo phiếu giữ mới cho yêu cầu khách gắn nguồn. [Tạo yêu cầu](../../../src/modules/sales-orders/sales-create.service.js), [sửa lịch giao](../../../src/modules/sales-orders/sales-schedule.service.js), [tiến độ và thông báo](../../../src/modules/sales-orders/sales-progress.service.js).

**Cảnh báo tồn thấp.** `evaluateThresholds` lấy định mức riêng từ `product.stockThresholds`. Khi mức tối thiểu mặc định lớn hơn 0, hàm bổ sung các cặp sản phẩm và kho đã có bản ghi số dư của cửa hàng tại một vị trí trong kho và chưa có định mức riêng. `availableStocks` tính tồn cho cả danh sách và trả Map theo `productId:warehouseId`. `freeQuantities` gom truy vấn phiếu giữ, lệnh chuyển, bút toán thực chuyển và báo cáo lỗi để khấu trừ tồn. Kết quả dùng cho dashboard Owner và danh sách cảnh báo. `BELOW` khi tồn khả dụng dưới `minimumQty`, với `shortageQty = targetQty − availableQty`. `NEAR` hiển thị ngưỡng gần chạm theo cấu hình. Job quét chỉ gửi thông báo cho `BELOW`. `GET /api/stock-alerts` cần `inventory:read`. `POST /api/stock-alerts/scan` cần `product:update`. Người dùng lập RR với nguồn `STOCK_THRESHOLD` khi cần mua thêm. [Cảnh báo](../../../src/modules/stock-alerts/stock-alert.service.js), [truy vấn tồn](../../../src/modules/replenishments/replenishment.evaluation.js#L248), [route](../../../src/modules/dashboard/dashboard.routes.js), [cấu hình](../../../src/modules/settings/system-settings.service.js).

**Danh mục và tồn đầu.** `POST /api/products/import/preview` và `POST /api/products/import` dùng chung cơ chế đối chiếu sản phẩm theo hãng, SKU và màu. Lượt lưu tạo sản phẩm, lô và hệ số quy đổi mới trong cùng transaction. Kiểm nhận dùng lô `VERIFIED` theo sản phẩm và lưu quy cách thực tế của lô trên dòng. Tồn đầu tham chiếu danh mục có sẵn. Khi ghi phiếu tồn đầu, service cộng hàng `GOOD/STORE` vào ô `STORAGE` hợp lệ của kho đã chọn, ghi bút toán `OPENING` tại mốc chốt của kho và kiểm sức chứa. Một kho có thể có nhiều phiếu trước khi chốt. Các dòng cùng lô và ô được cộng tồn khi ghi từng phiếu. Phiếu tồn đầu dùng chung số dư và sổ cái với nhập mua, nên hàng trong ô đủ điều kiện góp vào tồn khả dụng của RR tại 2.1. [Import danh mục](../../../src/modules/products/product-import.service.js), [ghi tồn đầu](../../../src/modules/opening-stock/service.js), [hợp đồng import và tồn đầu](../08_api/EXCEL_AND_OPENING_STOCK.md#catalogue-import-and-partial-opening-stock-27112026).

**Vị trí và sức chứa.** Lưu sơ đồ kho có thể tạo `WarehouseLocation` từ ô mới nếu người thao tác có `warehouse_location:create`. Backend gán loại vị trí từ chức năng khu, chẳng hạn `RECEIVING` cho khu nhận và `STORAGE` cho khu lưu trữ, rồi bật `isPickable` cho ô lưu trữ mới. Khi đồng bộ kích thước một ô đã gắn với vị trí, backend kiểm khóa kiểm kê, lệnh chuyển đang mở và sức chứa của hàng hiện có. Phiếu nhập mua, BF03 và RR đọc dữ liệu vị trí từ danh mục kho. [Lưu sơ đồ](../../../src/modules/warehouse-stock/layout.js), [đồng bộ vị trí](../../../src/modules/warehouse-stock/service.js#L153).

**Các module khác dùng chứng từ của quy trình:**

| Module | Dùng gì | Ghi chú |
|---|---|---|
| Chuyển vị trí BF03 | Số dư ở bãi tiếp nhận do phiếu nhập tạo | Phần 2.11–2.15, 2B.9. |
| Báo cáo hàng lỗi ([`createDefect`](../../../src/modules/return-workflows/native.service.js#L19)) | Dòng phiếu nhập mua (`sourceKind: 'RECEIPT'`) và số dư vật lý cùng kho, cùng lô | Lệnh kiểm dòng nguồn có tồn tại và số dư có lượng chưa bị chặn. `itemById` kiểm kho, còn nhánh `RECEIPT` chưa có bộ lọc riêng theo trạng thái của phiếu nguồn. Hàng bị giữ làm giảm `freeQuantity` và có thể chặn đảo phiếu. |
| Trả nhà cung cấp ([`createSupplierReturn`](../../../src/modules/return-workflows/native.service.js#L238)) | Dòng `PurchaseReceipt` `POSTED` hoặc `CustodyReceipt` NCC `POSTED` | Phiếu nhập mua lần về PO để kiểm NCC. Với phiếu giữ hộ, kiểm chủ hàng NCC. Đề nghị giữ riêng hạn mức theo chứng từ nguồn và lượng vật lý theo số dư cùng lô. |
| Cảnh báo tồn thấp, dashboard Owner | `availableStocks` | Dùng cùng điều kiện tồn khả dụng của RR ở 2.1. |
| Báo cáo vận hành ([operational-reports.service.js](../../../src/modules/operational-reports/operational-reports.service.js)) | Nhóm `purchases` (PO + phiếu nhập `POSTED`), `receipts` | Owner và Kế toán. Từ 23/11/2026 lượng chưa nhận trừ thêm lượng chốt thiếu và không ép PO `CLOSED` về 0 ([OPERATIONAL_REPORTS](../08_api/OPERATIONAL_REPORTS.md)). |
| Nhà cung cấp ([supplier.service.js](../../../src/modules/suppliers/supplier.service.js)) | Danh sách PO, phiếu nhập mua, trả NCC của một NCC | |
| Tồn kho và lịch sử movement ([warehouse-stock/service.js](../../../src/modules/warehouse-stock/service.js)) | Mọi `stock_transactions` của kho, gồm bút toán luồng này sinh ra: `PURCHASE_RECEIPT`, `CUSTODY_RECEIPT`, `CUSTODY_RELEASE`, `REVERSAL`, `RELOCATE` | Liên kết ngược về chứng từ nguồn khi người xem có quyền đọc loại chứng từ đó. |
| Chuyển liên kho BF04 ([transfer.service.js](../../../src/modules/transfers/transfer.service.js)) | Tồn theo lô tại kho nguồn, các phần giữ hàng và vị trí khả dụng | Có hồ sơ điều chuyển và luồng nhận riêng. Dùng chung số dư, sổ cái và điều kiện khóa kiểm kê với luồng nhập mua. |
| Truy vết theo lô ([native.trace.js](../../../src/modules/return-workflows/native.trace.js)) | Phiếu có `items.lotId` trùng và bút toán có dòng nguồn tương ứng | `GET /api/lots/:id/trace/records` kiểm `stock_movement:read` và phạm vi dữ liệu. Với Kế toán, danh sách model chỉ gồm chứng từ mua, nhập, giữ hộ và trả NCC. Kết quả theo lô có thể gồm nhiều phiếu cùng lô. |
| Đánh giá RR | `incomingPurchaseOrders`, `openRequests` đọc PO và phiếu nhập `POSTED` | Mục 2.1. |

Khi bàn giao trả NCC, lệnh ghi lượng thực xuất bằng `SupplierReturnIssue` cho hàng của cửa hàng hoặc `CustodyRelease` cho hàng giữ hộ. Kế toán ghi ACK trên dòng đã giao. Tiền tố `XNNCC` lấy chung một dãy số từ cả hai loại phiếu và thao tác cấp mã giữ khóa kho trong transaction. ACK ghi nhận phản hồi. Bước đóng kiểm lượng đã giao khớp thỏa thuận và toàn bộ số đã giao có phản hồi `ACCEPTED` còn hiệu lực. [Xử lý trả NCC](../../../src/modules/return-workflows/native.service.js), [cấp số ACK](../../../src/shared/utils/document-number.js), [hợp đồng trả hàng](../08_api/RETURN_WORKFLOWS_NATIVE.md).

**Thông báo:** mỗi lệnh qua `command()` ghi một `SystemEvent` `handlerCode: 'BUSINESS_NOTIFICATION'` `PENDING`. [Notification worker](../../../src/modules/notifications/worker.js) chỉ xử lý mã lệnh có trong [quy tắc thông báo](../../../src/modules/notifications/rules.js), từ thời điểm bắt đầu được cấu hình và bỏ qua sự kiện demo. Các quy tắc của luồng này: `CREATE_REPLENISHMENT`/`SUBMIT_REPLENISHMENT` (khi `SUBMITTED` ⇒ người có `replenishment_request:approve`), `REVIEW_REPLENISHMENT` (người lập; khi `APPROVED` thêm `purchase_order:create`), `CONFIRM_PURCHASE_ORDER`, `RESCHEDULE_PO_EXPECTED_ON`, `REOPEN_PURCHASE_ORDER` (người có `goods_receipt_inspection:create`), `POST_PURCHASE_CUSTODY` (`purchase_custody:decide`), `DECIDE_PURCHASE_CUSTODY` (`purchase_custody:execute`). Kiểm nhận, ghi nhập, đảo phiếu, chốt thiếu và chuyển vị trí không có quy tắc nên không sinh thông báo.

**Frontend** (checkout `fe` cạnh `be`, không liên kết vì nằm ngoài repo này): `fe/src/features/replenishments`, `purchase-orders`, `receiving` (tách ngày 25/11/2026: `receivingApi.ts`, `receivingMappers.ts`, `PurchaseEvidenceField.tsx`), `inspections`, `receipts`, `custody`, `location-moves`, `supplier-returns`.

---


# Phần 3 — Các điểm cần lưu ý / Rủi ro tiềm ẩn

Các điểm dưới đây rút ra từ đọc code. Lượt cập nhật 24/11/2026 chạy bộ test hiện có của luồng (Phần 4); các test đó kiểm hành vi đúng của lệnh, **không** có test riêng cho từng rủi ro dưới đây. Điểm 30–34 là giới hạn đã biết, ghi trong [change_logs.md](../../change_logs.md) mục 23/11/2026 hoặc thấy khi đối chiếu code.

### 3.1. Giao dịch và đồng thời

1. **Lệnh nghiệp vụ ghi cùng transaction.** `command` gom chứng từ, tồn, sổ cái, biên nhận và audit của thao tác trong MongoDB. Upload bằng chứng là request riêng, tải file lên storage trước khi gắn vào chứng từ. Dữ liệu từ các màn đọc như `locationMovementOptions` và `inspectionContext` có thể thay đổi trước khi người dùng gửi lệnh. Service kiểm lại điều kiện ghi khi xử lý lệnh.
2. **`withTransaction` có thể chạy lại `work` nhiều lần** khi xung đột ghi. Code trong `work` hiện không có tác dụng phụ ngoài DB, nhưng nếu sau này thêm gửi email/gọi API bên ngoài vào trong `work` thì sẽ bị gửi trùng. Dùng `SystemEvent` (outbox) thay vì gọi trực tiếp.
3. **Vòng `for` trong `command()` không bao giờ lặp lại** ([document-command.js:88](../../../src/shared/utils/document-command.js)): nhánh `catch` hoặc `return` replay hoặc `throw`. Biến `attempt` vô tác dụng; việc thử lại thật sự nằm trong `transaction()`. Không sai, nhưng dễ gây hiểu nhầm khi đọc.
4. **Tạo `StockHoldingPoint`/`InventoryBalance` lần đầu đồng thời**: hai giao dịch cùng ghi tồn lần đầu vào cùng (vị trí, lô) có thể cùng `new ...().save()` ⇒ một bên lỗi 11000 trên unique index của balance. `transaction()` chỉ tự thử lại 11000 khi khóa là **mã phiếu**; `command()` chỉ cứu 11000 khi đã có biên nhận. Trong luồng này, `postReceipt` và `confirmLocationMovement` đều gọi `guardLocations` (nay kèm `guardWarehouses`) **trước** `balanceAt`, nên hai giao dịch cùng kho đã xung đột ghi ở bản ghi kho và được `withTransaction` chạy lại trước khi tới bước tạo balance. Rủi ro chỉ còn ở luồng nào tạo balance mà không khóa kho/vị trí trước. Đổi lại, khóa theo kho làm **mọi lệnh ghi tồn trong cùng kho** (nhập, chuyển, xuất, kiểm kê) chạy tuần tự; kho bận có thể thấy nhiều lượt thử lại hơn.
5. **Khóa lạc quan theo `version` có ở mọi chứng từ và mọi balance**; FE bắt buộc gửi `expectedVersion`, `expectedPoVersion`, `sourceBalanceVersion`. Một thao tác bị 409 phải tải lại dữ liệu; gửi lại cùng `operationKey`/`idempotencyKey` sau khi tải lại sẽ bị coi là **payload khác** (vì `expectedVersion` đổi) ⇒ cần sinh khóa mới.
6. **Xác nhận chuyển vị trí có thể gặp xung đột phiên bản khi dùng chung số dư.** Phiếu nhập khác ghi cùng lô, chất lượng và chủ hàng tại cùng bãi có thể tăng `sourceBalanceVersion`. Khi xác nhận dòng dùng số dư đó, backend trả 409. Người lập có thể tải dữ liệu nguồn mới và sửa lệnh ở `OPEN`. Khi lệnh đã `PARTIAL`, người lập có thể hủy phần còn lại và lập lệnh mới cho lượng chưa chuyển. [Lệnh sửa, hủy và xác nhận BF03](../../../src/modules/location-movements/location-movement.service.js#L120).

### 3.2. Toàn vẹn số liệu

7. **Hạn mức nhận được trừ khi xác nhận kiểm nhận.** Tổng số đếm của nhiều bản kiểm nháp có thể vượt phần PO còn được nhận. Lệnh xác nhận kiểm lại lượng `ACCEPT` và tạo phiếu nhập nháp để giữ hạn mức. Trong thời gian còn bản kiểm nháp, lệnh chốt thiếu bị chặn theo 2B.3.3.
8. **Dòng `GOOD` + `REJECT`** được chấp nhận ở `prepare()` nhưng ở `confirmInspection()` không đi vào phiếu nhập hay giữ hộ. Nếu hàng bị từ chối nhưng thực tế vẫn nằm trong kho (chờ NCC lấy), nó **không có trong tồn**, không chiếm sức chứa và không ai theo dõi được ngoài phiếu kiểm.
9. **Hàng mới ghi nhập vẫn nằm ngoài tồn khả dụng để bán.** Trong khoảng từ ghi nhập đến chuyển lên ô `STORAGE` đủ điều kiện, lượng đó nằm ngoài kết quả đánh giá RR và cảnh báo tồn thấp. Cảnh báo `INCOMING_PO` cũng chỉ tính lượng chưa nhập trên PO `OPEN/PARTIAL`. Vì thế hệ thống có thể báo tồn dưới ngưỡng ngay sau khi PO vừa nhận đủ. Xem 2.1 và 2B.11.
10. **Không còn gì theo dõi "hàng nhập chưa lên kệ".** Sau khi gỡ lệnh cất mua, phiếu nhập kết thúc ở `POSTED`; `receivingSummary` bỏ `unplacedReceiptLines/unplacedQtyBase`, hàng đợi bỏ `AWAITING_PUTAWAY`, đối soát bỏ `PLACEMENT_CAP`. Lệnh `RELOCATE` chỉ trỏ tới số dư, không trỏ tới phiếu nhập, nên hệ thống không trả lời được "phiếu PNM-... đã lên kệ bao nhiêu". Hàng có thể nằm ở bãi tiếp nhận vô thời hạn mà không có cảnh báo.
11. **Thùng không vừa ô kệ chỉ bị phát hiện lúc xác nhận.** Lệnh cất mua cũ gọi `estimateCartonCapacity` ngay khi **lập** lệnh. BF03 không kiểm lúc lập; việc kiểm nằm trong `verifyCapacity → checkBinCapacity` khi **xác nhận** (thùng nguyên phải vừa kích thước ô, tổng thể tích không vượt). Thủ kho có thể lập lệnh, mang hàng tới ô rồi mới bị từ chối.
12. **BF03 không ràng buộc loại vị trí hay chất lượng như lệnh cất cũ.** Đích có thể là `RECEIVING`, `STORAGE`, `STAGING`, `QUARANTINE` hoặc `CUSTODY`; nguồn có thể là số dư bất kỳ chất lượng/chủ hàng (kể cả hàng giữ hộ NCC). `moveStock` giữ nguyên lô, chất lượng và chủ hàng, nên tồn không bị đổi bản chất, nhưng hàng `GOOD` của cửa hàng có thể bị đặt vào ô `CUSTODY` mà không có cảnh báo.
13. **Lượng chuyển chỉ nhận số nguyên** (`/^\d+$/` ở `relocationItems`, `/^\d{1,14}$/` ở xác nhận và Zod). Sản phẩm có `wholeBaseUnits = false` (lượng gốc thập phân) không chuyển được phần lẻ thập phân qua BF03.
14. **`submission()` ghi `conversionVersion: document.version`** ([replenishment.commands.js:249](../../../src/modules/replenishments/replenishment.commands.js)) — đây là version của phiếu RR, không phải version của bản ghi `Conversion`. Ai đọc ảnh gửi duyệt nên dựa vào `conversionSnapshot` (= `baseUnitsPerUnit`), không dựa vào `conversionVersion`.
15. Với `REJECT`, `reviewReplenishment` ghi `approvedQtyBase = '0'` và quyết định tương ứng trên mọi dòng. PO đọc quyết định `APPROVE` của đúng bản RR đã duyệt.
16. `reviewedContent` chụp RR sau khi đã ghi lượng duyệt. Nội dung lúc gửi duyệt nằm ở `submissions[]`.
17. `RR_ALLOWANCE` dùng cùng trần với lệnh lập và phát hành PO. Ngoại lệ vượt trần chỉ áp dụng cho đơn vị có `isCarton`.
18. **Hệ số của dòng PO tùy đơn vị đặt.** Giữ đơn vị của RR ⇒ dùng hệ số lịch sử của RR (`source.baseUnitsPerUnit`). Đổi đơn vị (`uomCode`) ⇒ dùng quy đổi **hiện hành, cấp sản phẩm** (`resolveConversion(product, null, …)`) — không theo lô, vì PO chưa có lô. Nếu thùng thực tế của lô về có số viên khác quy đổi chung, lượng PO theo thùng và lượng đếm thực tế theo lô sẽ lệch; kiểm nhận đếm theo quy đổi **của lô**.

### 3.3. Kiểm tra null/undefined và đầu vào

19. `prepare()` truy cập `item.packagingSnapshot.baseUnitsPerPackage` cho dòng `SEALED`; an toàn vì `lotId` là bắt buộc nên `makeItem` luôn tạo `packagingSnapshot`. Nếu sau này cho phép kiểm không có lô, dòng này sẽ lỗi.
20. **Đã sửa ngày 25/11/2026.** Trước đó `createPurchaseOrder` và các route lệnh PO, kiểm nhận, phiếu nhập, giữ hộ không có `checkPermission` ở tầng route; request thiếu quyền chạy hết Zod rồi mới bị 403 trong `command()`. Nay các route này có `checkPermission` (2B, bảng route), test `refactor-regression.integration.test.js` kiểm 403 đến trước 400. Còn lại: bốn route bằng chứng và hai route đọc chung `/api/goods-receipts` kiểm quyền trong service vì quyền phụ thuộc chứng từ.
21. Cấp mã phiếu quét toàn bộ `_id` cùng tiền tố trong ngày bằng regex (`$in: [RegExp]`) mỗi lần tạo phiếu. Với lượng phiếu lớn trong một ngày/kho, chi phí tăng tuyến tính; số trùng được xử lý bằng thử lại tối đa 20 lần.
22. Controller BF03 truyền `req.body` (không phải `req.validated.body`) vào service. Hiện an toàn vì middleware `validate` gán lại `req.body = parsed.body` ([validate.js](../../../src/middlewares/validate.js)); nếu middleware đổi cách làm, service sẽ nhận payload chưa qua Zod.

### 3.4. Tách bạch trách nhiệm

23. RR: người duyệt ≠ người lập (kiểm ở service và rule schema `approval_history`). PO, kiểm nhận, ghi tồn **không** có ràng buộc người khác người: cùng một người có quyền `goods_receipt_inspection:update` và `:post` có thể vừa kiểm vừa ghi tồn. Lệnh chuyển vị trí còn ngược lại: **chỉ người lập** được sửa, hủy và xác nhận (`assignedTo` cũng là người lập), nên người lập vắng mặt thì lệnh đứng yên và giữ tồn "đang chờ" cho tới khi chính họ hủy. Đây là hiện trạng code, không phải quyết định nghiệp vụ được ghi trong tài liệu này.

### 3.5. Luồng phụ

24. **Thông báo phụ thuộc loại sự kiện.** Worker chỉ nhận các loại có quy tắc gửi và bỏ qua sự kiện trước mốc bắt đầu.
25. **Hủy phiếu nhập nháp giải phóng hạn mức PO.** Phiếu kiểm vẫn `CONFIRMED`. Để nhận lại phần đó, dùng sửa kết quả kiểm (2B.5).
26. **Đảo phiếu kiểm phần đóng gói theo giao dịch gốc.** Các phiếu cùng số dư có thể đảo độc lập nếu phần hàng còn nguyên và đủ lượng khả dụng. Lệnh chuyển đang mở, lượt đếm kiểm kê và phần giữ do báo lỗi vẫn có thể chặn trên số dư hoặc vị trí chung (2B.6).
27. **Chốt thiếu giữ lại lượng đã chốt.** PO có lượng chốt thiếu bị chặn hủy. Lệnh mở lại chỉ cho xử lý lượng cần nhận sau đảo phiếu nhập. Xem 2B.3.3–2B.3.5.
28. **Hủy PO giải phóng RR** (`$unset replenishmentRequestId`): RR `APPROVED` đó lập được PO mới với cùng quyết định duyệt. PO đã hủy không còn tính trong `incomingPurchaseOrders`; vì RR không còn PO liên kết, `openRequests` lại tính **toàn bộ** `approvedQtyBase` của RR là "đang đề nghị" cho tới khi có PO mới hoặc Owner hủy RR.
29. **RR nguồn thiếu hàng bán không gắn hàng về cho đơn bán.** Nhập về xong, đơn bán vẫn phải giữ hàng theo luồng bán thông thường.
30. **Đảo phiếu nhập sinh từ giữ hộ trả hàng về số dư NCC.** Muốn nhận lại phần đó phải đi lại luồng quyết định giữ hộ (2B.8.3–2B.8.5), không lập phiếu kiểm mới (giới hạn ghi ngày 23/11/2026, chưa sửa).
31. **`pendingRequestQuantity` phụ thuộc trạng thái PO.** PO `CLOSED/COMPLETED/CANCELLED` ⇒ phần duyệt của RR tính 0; PO `OPEN/PARTIAL` ⇒ tính `approvedQtyBase − qtyBase của PO`. Sau khi Kế toán mở lại một PO đặt ít hơn lượng duyệt, phần duyệt chưa dùng lại hiện thành "RR đang mở" và có thể bật cảnh báo `OPEN_REQUEST`, dù RR không lập được PO thứ hai (giới hạn ghi ngày 23/11/2026, chưa sửa).
32. **Sửa kết quả kiểm có thể chạy chồng với chốt thiếu.** Lệnh chốt thiếu chặn khi đã thấy bản kiểm `DRAFT`. `replaceInspection` đọc phiên bản PO qua `activePo` và lưu phiên bản phiếu kiểm gốc. Lệnh thay thế không ghi PO để tạo xung đột với lần chốt thiếu đồng thời. Theo luồng ghi hiện tại, hai transaction có thể cùng qua điều kiện nếu lệnh chốt thiếu chưa thấy bản thay thế khi đọc. Lúc xác nhận bản thay thế, service kiểm lại PO còn mở và còn hạn mức. [Thay kết quả kiểm](../../../src/modules/goods-inspections/goods-inspection.correction.js), [chốt thiếu PO](../../../src/modules/purchase-orders/purchase-order.commands.js).
33. **Sửa kết quả kiểm cần PO đang mở.** PO `CLOSED` (kể cả do chốt thiếu rồi nhận đủ phần còn lại) phải được mở lại trước; mà mở lại chỉ được khi có phiếu nhập bị đảo (`reopenable`). Kết quả: kiểm nhận của PO đã `CLOSED`/`COMPLETED` chỉ sửa được sau khi đảo phiếu nhập liên quan.
34. **Màn hình đọc tính trong bộ nhớ.** `listPurchaseOrders` gọi `purchaseOrderQuantities` cho mọi PO khớp bộ lọc rồi mới phân trang; `receivingQueue` với `stage=CORRECTION` đọc mọi kiểm nhận nháp rồi lọc. Dữ liệu lớn sẽ chậm.

### 3.6. Kiểm quyền

Ghi ngày 25/11/2026, chưa sửa. Giải thích đầy đủ ở [2.0, mục Kiểm quyền](#kiểm-quyền-middleware-checkpermission-và-hàm-requirepermission-trong-service).

35. **`canAccessWarehouse` có hai bản.** [replenishment.access.js:16](../../../src/modules/replenishments/replenishment.access.js) viết lại hàm cùng tên của [access.js:30](../../../src/shared/utils/access.js). Khác nhau một trường hợp: `warehouseId == null` thì bản RR trả `false` cho mọi vai trò, bản chung trả `true` cho Owner. Gộp về bản chung sẽ đổi kết quả của trường hợp này, nên cần quyết định trước khi gộp.
36. **`replenishmentScope` tự kiểm quyền đọc.** [replenishment.access.js:27](../../../src/modules/replenishments/replenishment.access.js) dùng `rolePermissions(user).includes(READ_PERMISSION)` thay vì `hasPermission`, nên bỏ qua điều kiện `user.isActive`. Hiện chưa thành lỗ hổng vì `authenticate` chặn tài khoản bị khóa, route `GET /` có `checkPermission(READ_PERMISSION)` và `listReplenishments` gọi `requirePermission` trước `replenishmentScope`.
37. **Tham số `roles` thừa.** `hasPermission(user, permission, roles = [])` và `requirePermission(user, permission, roles = [])` nhận `roles` nhưng không dùng.
38. **Quyền `replenishment_request:evaluate` không được kiểm.** Seed quyền ([permissions.data.js:43](../../../src/seeds/data/permissions.data.js)) có mã này cho Owner, Thủ kho, Sales, nhưng BE không gọi nó ở đâu. `POST /evaluate` kiểm `:read` hoặc `:create`. Gỡ `:evaluate` khỏi một vai trò không làm thay đổi gì ở API.

---

# Phần 4 — Kiểm thử đã chạy

Ngày 24/11/2026, máy local, MongoDB replica set `rs0` cổng 27017. Mỗi file test integration tự tạo database tạm tên ngẫu nhiên và xóa khi xong; không dùng database của ứng dụng.

```powershell
$env:RUN_NATIVE_API_TESTS='1'; $env:RUN_RELOCATION_PARTIAL_TESTS='1'; node --test --test-concurrency=1 test/native-api.integration.test.js test/location-movement-partial.integration.test.js test/replenishment-evaluation.integration.test.js test/replenishment-review-decision.test.js test/replenishment-warnings.integration.test.js test/receiving-custody-policy.test.js test/location-movements.test.js test/purchase-evidence.test.js test/stock-receipt-volume.test.js
```

Kết quả: 79 test, **78 đạt**, 1 lỗi, 0 bỏ qua. Ca lỗi là `BF03 confirms partial quantities, preserves history, cancels only the remainder and serializes competing confirmations` trong `location-movement-partial.integration.test.js`: file này kết nối cố định `127.0.0.1:27018` replica set `hieudt-test`, máy chạy không có MongoDB ở cổng đó nên hết thời gian chờ kết nối (5 giây). Đây là lỗi môi trường, không phải kết quả của code; luồng xác nhận một phần của BF03 vẫn có các ca đạt trong `native-api.integration.test.js` (xác nhận nguyên thùng và chạy lại cùng khóa chỉ ghi một lần, đảo phiếu khi đã có lệnh chuyển đã xác nhận).

Các ca đạt bao phủ những nhánh tài liệu mô tả:

- **RR (2.1–2.4, 2B.2):** cảnh báo đánh giá (định mức, RR đang mở, PO đang về, tồn khả dụng loại giữ hàng/khóa kiểm kê/bãi tiếp nhận, kho ngoài phạm vi), kiểm nguồn đơn bán/yêu cầu xuất/kiểm kê, gửi duyệt đánh giá lại và chặn nguồn đã đổi, duyệt chỉ nhận `APPROVE`/`REJECT`, chặn thùng lẻ và chuẩn hóa m², replay biên nhận lập/hủy, danh sách và chi tiết RR.
- **PO (2.5–2.6, 2B.3):** một dòng PO cho một dòng RR, vượt trần chỉ cho thùng nguyên, giữ đơn vị qua sửa/phát hành/đối soát, vòng đời HTTP (sửa nháp, đổi ngày, lịch sử, chốt thiếu), chốt thiếu một phần rồi nhận đủ ⇒ `CLOSED`, mở lại PO về `OPEN` và `PARTIAL` (kể cả hai lệnh song song), hủy PO giải phóng RR, lập PO song song với hủy RR không cùng commit.
- **Kiểm nhận, ghi nhập, đảo phiếu (2.7–2.10, 2B.4–2B.6):** quy đổi kế hoạch PO và quy đổi lô thực tế, hàng không `GOOD` bắt buộc vào giữ hộ, ghi nhập cập nhật PO và trả số dư cho BF03, hàng đợi phiếu nhập nháp, ước tính thể tích và khai kiện, chặn hai vị trí cho một dòng, sửa kết quả kiểm trả đủ danh sách chặn và thành công sau khi đảo/hủy, đảo phiếu trả hạn mức PO một lần, đảo theo kiện trên số dư dùng chung, đảo mở lại PO `COMPLETED` nhưng giữ PO `CLOSED`, cờ `hasOpenReceivingWork`.
- **Giữ hộ (2B.8):** nhận sở hữu, đảo sở hữu và trả NCC giữ nguyên hàng vật lý và nguồn; đảo giữ hộ sau tái kiểm; chặn đảo khi lệnh chuyển đã dùng kiện gốc; chặn quyết định cũ, sai vai trò, nhận trùng song song; trả NCC từ phiếu giữ hộ đã ghi.
- **BF03 và bằng chứng (2.12–2.15, 2B.7):** xác nhận nguyên thùng và chạy lại cùng khóa chỉ ghi một lần, tách kiện `SEALED`/`LOOSE`, kiểm nội dung tệp PNG/JPEG/PDF thật.

Chưa chạy: toàn bộ suite `npm test`, test frontend, kiểm tra trên trình duyệt, và `location-movement-partial.integration.test.js` trên replica set `hieudt-test`.

### Lượt chạy 25/11/2026 sau đợt tách controller

Cùng máy và MongoDB `rs0` cổng 27017, chỉ các test chạm phần code đổi (route, controller, validation, `authenticate`, `_id` đã phân giải):

```powershell
$env:RUN_NATIVE_API_TESTS='1'; $env:RUN_GOODS_RECEIPT_TESTS='1'; node --test --test-concurrency=1 test/refactor-regression.integration.test.js test/goods-receipt.integration.test.js test/backend-permissions.integration.test.js test/purchase-evidence.test.js test/public-routing.test.js test/receiving-custody-policy.test.js
```

Kết quả: 19 test, **19 đạt**, 0 lỗi. [refactor-regression.integration.test.js](../../../test/refactor-regression.integration.test.js) gọi HTTP bằng `documentNo` của một PO có `_id` ObjectId: chi tiết PO, `receiving-summary`, `receiving-trips`, `receiving-operations/:key`, ba danh sách lọc `purchaseOrderId` (kiểm nhận, phiếu nhập mua, hàng đợi), danh sách gộp `GET /goods-receipts`, liệt kê, tải và gắn bằng chứng, `POST /purchase-orders` trả 200 và replay. Phần không cần DB kiểm `authenticate` chỉ nạp người dùng một lần và 403 đến trước 400 trên các route có `checkPermission`.

Lượt này không chạy lại `native-api.integration.test.js` và các test RR/BF03 của lượt 24/11/2026 vì code RR và BF03 không đổi; kết quả do người thực hiện đợt tách ghi ở [change_logs.md](../../change_logs.md) mục 25/11/2026.

### Lượt chạy 25/11/2026 sau đợt tách module `po-receiving` (commit `5105f36`)

Ghi nhận từ [change_logs.md](../../change_logs.md) (mục "25/11/2026 — Tách module `po-receiving` theo loại chứng từ"):
- **Đối chiếu route trước/sau tách:** `discoverRoutes(app)` khớp tuyệt đối `307/307` route và `257/257` cặp `(method, path, checkPermission...)` (`0` diff).
- **BE unit tests** (`purchase-evidence.test.js`, `purchase-evidence.local.test.js`, `receiving-custody-policy.test.js`): `9/9` đạt.
- **BE integration tests** trên MongoDB local `rs0` (`native-api.integration.test.js`, `refactor-regression.integration.test.js`, `goods-receipt.integration.test.js`): `38/38` đạt.
- **FE:** `npx tsc --noEmit` và `npm run build` đạt (`0` lỗi); `vitest` cho `purchase-orders`, `receiving`, `inspections`, `receipts`, `custody` đạt `146/148` (2 ca fail có sẵn trên nhánh `minhtd` thuộc `CUSTOMER_RETURN`, không liên quan đợt tách).

---

## Phụ lục — Vị trí file

| Khâu | File |
|---|---|
| Khung lệnh, version, biên nhận | [src/shared/utils/document-command.js](../../../src/shared/utils/document-command.js) |
| Transaction, phân trang, serialize | [src/shared/utils/persistence.js](../../../src/shared/utils/persistence.js) |
| Cấp mã phiếu | [src/shared/utils/document-number.js](../../../src/shared/utils/document-number.js) |
| Quy đổi đơn vị | [src/shared/utils/conversions.js](../../../src/shared/utils/conversions.js), [document-items.js](../../../src/shared/utils/document-items.js) |
| Sao dòng, liên kết nguồn | [src/shared/utils/document-copy.js](../../../src/shared/utils/document-copy.js) |
| Tồn kho, kiện, sổ cái | [src/shared/utils/stock.js](../../../src/shared/utils/stock.js) |
| Route → controller dùng chung | [src/middlewares/auth.js](../../../src/middlewares/auth.js), [src/middlewares/permission.js](../../../src/middlewares/permission.js), [src/shared/utils/catchAsync.js](../../../src/shared/utils/catchAsync.js) (`respondWithData`), [src/shared/utils/command-validation.js](../../../src/shared/utils/command-validation.js) |
| RR | [src/modules/replenishments/](../../../src/modules/replenishments/) |
| PO | [src/modules/purchase-orders/](../../../src/modules/purchase-orders/): `purchase-order.routes.js`, `.validation.js`, `.controller.js`, `.service.js` (đọc), `.commands.js` (lệnh) |
| Kiểm nhận và sửa kết quả kiểm | [src/modules/goods-inspections/](../../../src/modules/goods-inspections/): `goods-inspection.routes.js`, `.validation.js`, `.controller.js`, `.service.js`, `.correction.js` |
| Phiếu nhập mua | [src/modules/goods-receipts/](../../../src/modules/goods-receipts/): `purchase-receipt.routes.js`, `.validation.js`, `.controller.js`, `.service.js` |
| Đảo phiếu nhập / giữ hộ | [src/modules/stock-reversals/](../../../src/modules/stock-reversals/): `stock-reversal.routes.js`, `.validation.js`, `.controller.js`, `.service.js` |
| Giữ hộ NCC | [src/modules/custody/](../../../src/modules/custody/): `custody.routes.js`, `.validation.js`, `.controller.js`, `.service.js`, `custody-stock.js` |
| Tiện ích nhận hàng dùng chung | [purchase-core.js](../../../src/shared/utils/purchase-core.js), [intake-packaging.js](../../../src/shared/utils/intake-packaging.js), [evidence-storage.js](../../../src/shared/utils/evidence-storage.js), [purchase-validation.js](../../../src/shared/utils/purchase-validation.js) |
| Bằng chứng đính kèm | [purchase-evidence.service.js](../../../src/modules/po-receiving/purchase-evidence.service.js) |
| Đọc, hàng đợi, lịch sử nhận hàng | [purchase-read.service.js](../../../src/modules/po-receiving/purchase-read.service.js) |
| Đối soát, dọn bằng chứng | [purchase-reconciliation.js](../../../src/modules/po-receiving/purchase-reconciliation.js), [scripts/purchase-maintenance.mjs](../../../scripts/purchase-maintenance.mjs) |
| Danh sách phiếu nhập chung | [src/modules/goods-receipts/goods-receipt.routes.js](../../../src/modules/goods-receipts/goods-receipt.routes.js), [goods-receipt.controller.js](../../../src/modules/goods-receipts/goods-receipt.controller.js), [goods-receipt.service.js](../../../src/modules/goods-receipts/goods-receipt.service.js), [goods-receipt.validation.js](../../../src/modules/goods-receipts/goods-receipt.validation.js) |
| Trả NCC, báo cáo lỗi từ phiếu nhập | [src/modules/return-workflows/native.service.js](../../../src/modules/return-workflows/native.service.js) |
| Chuyển vị trí (lên kệ) | [src/modules/location-movements/](../../../src/modules/location-movements/) · [API BF03](../08_api/location-movements/README.md) |
| Cảnh báo tồn thấp (dùng `availableStock`) | [src/modules/stock-alerts/stock-alert.service.js](../../../src/modules/stock-alerts/stock-alert.service.js) |
| Quy tắc thông báo | [src/modules/notifications/rules.js](../../../src/modules/notifications/rules.js) |
| Test của luồng | [test/native-api.integration.test.js](../../../test/native-api.integration.test.js), [test/replenishment-evaluation.integration.test.js](../../../test/replenishment-evaluation.integration.test.js), [test/location-movement-partial.integration.test.js](../../../test/location-movement-partial.integration.test.js), [test/refactor-regression.integration.test.js](../../../test/refactor-regression.integration.test.js) |
| Model | [src/models/](../../../src/models/) |
