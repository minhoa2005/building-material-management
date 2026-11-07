---
id: DOC-CODE-IT1-PURCHASE-ORDERS-20261105
title: "Đơn mua — giải thích từng hàm"
version: 1.0.0
phase: Review
domain: Iteration1
tags: [backend, function, database]
last_updated: 2026-11-05
---

# Đơn mua — giải thích từng hàm

[Quay lại hướng dẫn đọc](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/README.md). Bản source ngày 05/11/2026; các đoạn lệnh dưới đây được lấy trực tiếp từ file hiện tại.

## Tìm nhanh

- [purchase-order.commands.js → accountant()](#fn-182)
- [purchase-order.commands.js → source()](#fn-183)
- [purchase-order.commands.js → master()](#fn-184)
- [purchase-order.commands.js → draftLines()](#fn-185)
- [purchase-order.commands.js → claim()](#fn-186)
- [purchase-order.commands.js → createPurchaseOrder()](#fn-187)
- [purchase-order.commands.js → updatePurchaseOrder()](#fn-188)
- [purchase-order.commands.js → confirmPurchaseOrder()](#fn-189)
- [purchase-order.commands.js → amendPurchaseOrder()](#fn-190)
- [purchase-order.commands.js → supplierConfirmation()](#fn-191)
- [purchase-order.commands.js → requestClose()](#fn-192)
- [purchase-order.commands.js → validateClose()](#fn-193)
- [purchase-order.commands.js → approveClose()](#fn-194)
- [purchase-order.commands.js → executeClose()](#fn-195)
- [purchase-order.commands.routes.js → action()](#fn-196)
- [purchase-order.controller.js → list()](#fn-197)
- [purchase-order.controller.js → get()](#fn-198)
- [purchase-order.service.js → canReadAllPurchaseOrders()](#fn-199)
- [purchase-order.service.js → scopedWarehouseFilter()](#fn-200)
- [purchase-order.service.js → loadBatchGraph()](#fn-201)
- [purchase-order.service.js → batchSign()](#fn-202)
- [purchase-order.service.js → resolveGrLines()](#fn-203)
- [purchase-order.service.js → grLineReceivedQuantities()](#fn-204)
- [purchase-order.service.js → emptyComputedLine()](#fn-205)
- [purchase-order.service.js → quantityStatus()](#fn-206)
- [purchase-order.service.js → computedDocuments()](#fn-207)
- [purchase-order.service.js → computedDocuments.sumEvents()](#fn-208)
- [purchase-order.service.js → mapPreviewLines()](#fn-209)
- [purchase-order.service.js → listPurchaseOrders()](#fn-210)
- [purchase-order.service.js → purchaseOrderQuantities()](#fn-211)
- [purchase-order.service.js → getPurchaseOrder()](#fn-212)
- [purchase-order.validation.js → positiveInteger()](#fn-213)

<a id="fn-182"></a>

## accountant()

**Code:** [purchase-order.commands.js:9](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:9).

**Tham số:** `accountant(u, action = 'update')`.

**Công việc:** Chặn lệnh mua nếu không đúng kế toán/quyền thao tác.

**Xử lý theo thứ tự:**

1. Gọi rights trên resource purchase_order và role ACCOUNTANT; action mặc định update.

**Ai gọi / gọi tiếp:** Được gọi bởi [createPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-187), [updatePurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-188), [confirmPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-189), [amendPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-190), [supplierConfirmation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-191), [requestClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-192), [executeClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-195). Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Chủ cửa hàng không tự tạo PO qua lệnh kế toán chỉ vì có quyền đọc PO.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
accountant = (u, action = 'update') => rights(u, action, 'purchase_order', ['ACCOUNTANT'])
```

</details>

<a id="fn-183"></a>

## source()

**Code:** [purchase-order.commands.js:10](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:10).

**Tham số:** `source(user, input, warehouseId, session)`.

**Công việc:** Đọc nguồn RR đã duyệt cho một dòng PO.

**Xử lý theo thứ tự:**

1. Tìm DocumentLine REPLENISHMENT chưa removed, lấy RR bằng scoped.
2. Tìm Approval đúng mã/cùng RR.version/loại RR/APPROVE và dòng được duyệt dương.
3. Kiểm RR APPROVED, cùng warehouse; đọc Product active và quy đổi lượng theo snapshot RR.
4. Không vượt lượng dòng được duyệt, kiểm nguyên viên.

**Ai gọi / gọi tiếp:** Được gọi bởi [draftLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-185), [claim()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-186). Gọi tiếp [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [multiplyBaseQuantity()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-308), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `m.DocumentLine`, tại [dòng 11](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:11). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.findOne({ _id: input.rrLineId, lineKind: 'REPLENISHMENT' })
```

- Đọc một bản ghi qua `m.Approval`, tại [dòng 14](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:14). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Approval.findOne({ _id: input.approvalId, documentId: rr._id, documentVersion: rr.version, decisionKind: RR_APPROVAL_KIND, decision: 'APPROVE' })
```

- Đọc theo mã _id qua `m.Product`, tại [dòng 17](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:17). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Product.findById(line.productId)
```

**Ví dụ:** Duyệt 100 viên không cho lập dòng PO 120; có trạng thái APPROVED nhưng dòng duyệt 0 vẫn không dùng được.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function source(user, input, warehouseId, session) {
  const line = await read(m.DocumentLine.findOne({ _id: input.rrLineId, lineKind: 'REPLENISHMENT' }), session);
  if (!line || line.details?.removedAt) throw notFoundError();
  const rr = await scoped(user, line.documentId, 'REPLENISHMENT', session);
  const approval = await read(m.Approval.findOne({ _id: input.approvalId, documentId: rr._id, documentVersion: rr.version, decisionKind: RR_APPROVAL_KIND, decision: 'APPROVE' }), session);
  const decision = approval?.lines.find(r => same(r.lineId, line._id) && r.outcome === 'APPROVE');
  if (rr.workflowStatus !== 'APPROVED' || !same(rr.header.warehouseId, warehouseId) || !decision || !exact(decision.approvedQty).gt(0)) fail('RR_SOURCE', 'Nguồn RR chưa được duyệt đúng phiên bản/kho');
  const product = await read(m.Product.findById(line.productId), session);
  const q = multiplyBaseQuantity(input.enteredQty, line.conversionSnapshot.toString());
  if (!product?.isActive || !q.valid || (product.wholeBaseUnits && !q.value.isInteger())) throw validationError('Sản phẩm hoặc lượng theo RR không hợp lệ');
  if (q.value.gt(exact(decision.approvedQty))) fail('RR_CAP', 'Lượng PO vượt lượng RR được duyệt');
  return { line, rr, approval, decision, product, qty: q.string };
}
```

</details>

<a id="fn-184"></a>

## master()

**Code:** [purchase-order.commands.js:23](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:23).

**Tham số:** `master(user, input, session)`.

**Công việc:** Kiểm kho và nhà cung cấp trước tạo/sửa/mở PO.

**Xử lý theo thứ tự:**

1. Đọc Warehouse và Party SUPPLIER active/ACTIVE.
2. Kho phải active và được người thực hiện phân công.
3. Sai master trả lỗi trước khi ghi phiếu.

**Ai gọi / gọi tiếp:** Được gọi bởi [createPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-187), [updatePurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-188), [confirmPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-189). Gọi tiếp [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `m.Warehouse`, tại [dòng 24](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:24). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Warehouse.findById(input.warehouseId)
```

- Đọc một bản ghi qua `m.Party`, tại [dòng 25](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:25). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Party.findOne({ _id: input.supplierId, kind: 'SUPPLIER', isActive: true, cooperationStatus: 'ACTIVE' })
```

**Ví dụ:** Kế toán đọc toàn khoB nhưng chưa được giaoB thì không tạo PO tạiB.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function master(user, input, session) {
  const wh = await read(m.Warehouse.findById(input.warehouseId), session);
  const supplier = await read(m.Party.findOne({ _id: input.supplierId, kind: 'SUPPLIER', isActive: true, cooperationStatus: 'ACTIVE' }), session);
  if (!wh?.isActive || !supplier) throw validationError('Kho/NCC không hoạt động');
  // Scope is checked before creating a document, not after its insertion.
  if (!canAccessWarehouse(user, wh._id)) throw notFoundError();
}
```

</details>

<a id="fn-185"></a>

## draftLines()

**Code:** [purchase-order.commands.js:30](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:30).

**Tham số:** `draftLines(user, po, input, session)`.

**Công việc:** Ghi lại các dòng PO nháp cùng liên kết nguồn và claim lượng 0.

**Xử lý theo thứ tự:**

1. Đọc dòng cũ; mỗi RR line chỉ dùng một lần, kiểm source và id dòng sửa.
2. Chuẩn bị snapshot từ RR; không đổi sản phẩm trên id cũ.
3. Đảm bảo claim cũ chưa có lượng đã xác nhận; xóa claim 0/liên kết, xóa dòng bỏ và dời lineNo tạm cho dòng giữ.
4. Update/add dòng theo thứ tự mới, tạo LineLink RR→PO và PurchaseSourceClaim qty 0.

**Ai gọi / gọi tiếp:** Được gọi bởi [createPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-187), [updatePurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-188). Gọi tiếp [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-183), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [lineLink()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-243).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `m.ProductUomVersion`, tại [dòng 40](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:40). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ProductUomVersion.findById(src.line.conversionId)
```

- Đọc theo mã _id qua `m.Uom`, tại [dòng 41](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:41). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Uom.findById(conversion.uomId)
```

- Đọc nhiều bản ghi qua `m.PurchaseSourceClaim`, tại [dòng 47](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:47). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseSourceClaim.find({ purchaseOrderId: po._id })
```

- Xóa các bản ghi khớp qua `m.PurchaseSourceClaim`, tại [dòng 49](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:49). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseSourceClaim.deleteMany({ purchaseOrderId: po._id }, { session })
```

- Xóa các bản ghi khớp qua `m.LineLink`, tại [dòng 51](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:51). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.LineLink.deleteMany({ targetLineId: old._id }, { session })
```

- Xóa một bản ghi qua `m.DocumentLine`, tại [dòng 52](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:52). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.deleteOne({ _id: old._id }, { session })
```

- Cập nhật một bản ghi qua `m.DocumentLine`, tại [dòng 53](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:53). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.updateOne({ _id: old._id }, { $set: { lineNo: old.lineNo + 1000 } }, { session })
```

- Cập nhật một bản ghi qua `m.DocumentLine`, tại [dòng 57](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:57). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.updateOne({ _id: p.old._id }, { $set: { ...p.values, lineNo: i + 1 } }, { session, runValidators: true })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.DocumentLine`:

```js
save(m.DocumentLine, { ...p.values, lineNo: i + 1 }, session)
```

- `lineLink` → `LineLink`:

```js
lineLink(p.src.line._id, line._id, p.src.qty, session, 'REPLENISHMENT_PURCHASE')
```

- `save` → `m.PurchaseSourceClaim`:

```js
save(m.PurchaseSourceClaim, { purchaseOrderId: po._id, poLineId: line._id, rrLineId: p.src.line._id, approvalId: p.src.approval._id, qtyBase: '0' }, session)
```

**Ví dụ:** Lưu nháp mua 80 chưa chiếm 80 trong quyền mua 100; các bản nháp có thể cùng tồn tại.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function draftLines(user, po, input, session) {
  const previous = await rows(po._id, session); const seen = new Set(); const seenIds = new Set(); const keep = new Set();
  const prepared = [];
  for (const l of input.lines) {
    if (seen.has(l.rrLineId)) throw validationError('Gộp các lượng của cùng dòng RR'); seen.add(l.rrLineId);
    const src = await source(user, l, input.warehouseId, session);
    const old = l.id && previous.find(r => same(r._id, l.id));
    if (l.id && (!old || seenIds.has(l.id))) throw validationError('Dòng PO cần sửa không hợp lệ hoặc trùng ID');
    if (l.id) seenIds.add(l.id);
    if (old && !same(old.productId, src.line.productId)) throw validationError('Không đổi sản phẩm dòng đã lưu');
    const conversion = await read(m.ProductUomVersion.findById(src.line.conversionId), session);
    const uom = conversion && await read(m.Uom.findById(conversion.uomId), session);
    prepared.push({ src, old, values: { documentId: po._id, productId: src.line.productId,
      conversionId: src.line.conversionId, conversionSnapshot: src.line.conversionSnapshot, enteredQty: l.enteredQty,
      qtyBase: src.qty, productNameSnapshot: src.line.productNameSnapshot, productSkuSnapshot: src.product.sku, enteredUomCodeSnapshot: uom?.code } });
    if (old) keep.add(id(old._id));
  }
  const draftClaims = await read(m.PurchaseSourceClaim.find({ purchaseOrderId: po._id }), session);
  if (draftClaims.some(c => exact(c.qtyBase).gt(0))) fail('RR_SOURCE', 'PO nháp có claim đã xác nhận');
  await m.PurchaseSourceClaim.deleteMany({ purchaseOrderId: po._id }, { session });
  for (const old of previous) {
    await m.LineLink.deleteMany({ targetLineId: old._id }, { session });
    if (!keep.has(id(old._id))) await m.DocumentLine.deleteOne({ _id: old._id }, { session });
    else await m.DocumentLine.updateOne({ _id: old._id }, { $set: { lineNo: old.lineNo + 1000 } }, { session });
  }
  for (const [i, p] of prepared.entries()) {
    let line;
    if (p.old) { await m.DocumentLine.updateOne({ _id: p.old._id }, { $set: { ...p.values, lineNo: i + 1 } }, { session, runValidators: true }); line = p.old; }
    else line = await save(m.DocumentLine, { ...p.values, lineNo: i + 1 }, session);
    await lineLink(p.src.line._id, line._id, p.src.qty, session, 'REPLENISHMENT_PURCHASE');
    await save(m.PurchaseSourceClaim, { purchaseOrderId: po._id, poLineId: line._id, rrLineId: p.src.line._id, approvalId: p.src.approval._id, qtyBase: '0' }, session);
  }
}
```

</details>

<a id="fn-186"></a>

## claim()

**Code:** [purchase-order.commands.js:64](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:64).

**Tham số:** `claim(user, po, poLine, input, session)`.

**Công việc:** Chiếm lượng được duyệt của dòng RR mà không vượt giữa nhiều PO.

**Xử lý theo thứ tự:**

1. Kiểm source và cùng sản phẩm dòngPO.
2. Conditional update RR đúng version/status, tăng header.purchasingVersion để các PO cạnh tranh cùng điểm ghi.
3. Đọc tất cả PurchaseSourceClaim của RR line, cộng lượng đã dùng rồi so với approved.
4. Thêm hoặc tăng claim theo version, giữ đúng approvalId.

**Ai gọi / gọi tiếp:** Được gọi bởi [confirmPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-189), [amendPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-190). Gọi tiếp [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-183), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Cập nhật một bản ghi qua `m.BusinessDocument`, tại [dòng 67](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:67). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.updateOne({ _id: src.rr._id, documentKind: 'REPLENISHMENT', version: src.rr.version, workflowStatus: 'APPROVED' }, { $inc: { 'header.purchasingVersion': 1 } }, { session })
```

- Đọc nhiều bản ghi qua `m.PurchaseSourceClaim`, tại [dòng 69](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:69). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseSourceClaim.find({ rrLineId: src.line._id })
```

- Cập nhật một bản ghi qua `m.PurchaseSourceClaim`, tại [dòng 74](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:74). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseSourceClaim.updateOne({ _id: prior._id, version: prior.version }, { $inc: { version: 1 }, $set: { qtyBase: exact(prior.qtyBase).plus(exact(src.qty)).toString() } }, { session })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.PurchaseSourceClaim`:

```js
save(m.PurchaseSourceClaim, { purchaseOrderId: po._id, poLineId: poLine._id, rrLineId: src.line._id, approvalId: src.approval._id, qtyBase: src.qty }, session)
```

**Kết quả / nhánh bị chặn:** Giữ quyền mua, không phải giữ StockBalance hoặc tạo Reservation.

**Ví dụ:** Hai PO cùng xin 80 trên RR 100: chỉ một mở 80, bên còn lại không còn đủ 80.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function claim(user, po, poLine, input, session) {
  const src = await source(user, input, po.header.warehouseId, session);
  if (!same(src.line.productId, poLine.productId)) fail('RR_SOURCE', 'RR bổ sung sai SKU');
  const lock = await m.BusinessDocument.updateOne({ _id: src.rr._id, documentKind: 'REPLENISHMENT', version: src.rr.version, workflowStatus: 'APPROVED' }, { $inc: { 'header.purchasingVersion': 1 } }, { session });
  if (lock.matchedCount !== 1) fail('RR_SOURCE', 'Nguồn RR đã thay đổi');
  const claims = await read(m.PurchaseSourceClaim.find({ rrLineId: src.line._id }), session);
  const used = claims.reduce((sum, r) => sum.plus(exact(r.qtyBase)), exact('0'));
  if (used.plus(exact(src.qty)).gt(exact(src.decision.approvedQty))) fail('RR_CAP', 'Allowance RR đã được PO khác sử dụng', { approvedQtyBase: src.decision.approvedQty.toString(), committedQtyBase: used.toString() });
  const prior = claims.find(r => same(r.poLineId, poLine._id));
  if (prior && !same(prior.approvalId, src.approval._id)) fail('RR_SOURCE', 'Claim gắn phiên bản duyệt khác');
  if (prior) { const changed = await m.PurchaseSourceClaim.updateOne({ _id: prior._id, version: prior.version }, { $inc: { version: 1 }, $set: { qtyBase: exact(prior.qtyBase).plus(exact(src.qty)).toString() } }, { session }); if (changed.matchedCount !== 1) fail('RR_SOURCE', 'Claim RR vừa đổi'); }
  else await save(m.PurchaseSourceClaim, { purchaseOrderId: po._id, poLineId: poLine._id, rrLineId: src.line._id, approvalId: src.approval._id, qtyBase: src.qty }, session);
  return src;
}
```

</details>

<a id="fn-187"></a>

## createPurchaseOrder()

**Code:** [purchase-order.commands.js:78](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:78).

**Tham số:** `createPurchaseOrder(user, input)`.

**Công việc:** Tạo PO DRAFT từ những dòng RR được duyệt.

**Xử lý theo thứ tự:**

1. Kiểm kế toán:create; command chống lặp.
2. master kiểm nguồn; newDoc PO DRAFT với kho/supplier/ngày dự kiến.
3. draftLines lưu dòng và nguồn; command thêm operation/audit.

**Đường dẫn gọi tới hàm này:** `POST /api/purchase-orders` ([route dòng 14](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:14)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [accountant()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-182), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [master()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-184), [newDoc()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-241), [draftLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-185).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `newDoc` → `BusinessDocument`:

```js
newDoc('PO', { warehouseId: input.warehouseId, supplierId: input.supplierId, creationKey: input.creationKey, ...(input.expectedOn && { expectedOn: new Date(input.expectedOn) }) }, user, session)
```

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.BusinessOperation.findOne`, `m.BusinessDocument.findOne`, `Model.save`, `AuditEvent.save`, `m.Warehouse.findById`, `m.Party.findOne`, `m.ProductUomVersion.findById`, `m.Uom.findById`, `m.PurchaseSourceClaim.find`, `m.PurchaseSourceClaim.deleteMany`, `m.LineLink.deleteMany`, `m.DocumentLine.deleteOne`, `m.DocumentLine.updateOne`, `m.DocumentLine.find`, `m.DocumentLine.findOne`, `m.Approval.findOne`, `m.Product.findById`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Soạn đơn 100 chưa tăng tồn và chưa giữ quyền mua cho tới confirm.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function createPurchaseOrder(user, input) {
  accountant(user, 'create');
  return command(user, 'CREATE_PURCHASE_ORDER', input.warehouseId, input, async session => {
    await master(user, input, session);
    const po = await newDoc('PO', { warehouseId: input.warehouseId, supplierId: input.supplierId, creationKey: input.creationKey, ...(input.expectedOn && { expectedOn: new Date(input.expectedOn) }) }, user, session);
    await draftLines(user, po, input, session);
    return { document: po };
  });
}
```

</details>

<a id="fn-188"></a>

## updatePurchaseOrder()

**Code:** [purchase-order.commands.js:87](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:87).

**Tham số:** `updatePurchaseOrder(user, poId, input)`.

**Công việc:** Sửa toàn bộ PO còn nháp theo phiên bản.

**Xử lý theo thứ tự:**

1. Kế toán:update; scoped PO/version và chỉ DRAFT.
2. Kiểm lại master, draftLines và cập nhật header giữ creationKey.
3. bump tăng version; command lưu kết quả.

**Đường dẫn gọi tới hàm này:** `PUT /api/purchase-orders/:id` ([route dòng 15](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:15)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [accountant()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-182), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [master()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-184), [draftLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-185), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `bump` → `BusinessDocument`:

```js
bump(po, session, { header: { warehouseId: input.warehouseId, supplierId: input.supplierId, creationKey: po.header.creationKey, ...(input.expectedOn && { expectedOn: new Date(input.expectedOn) }) } })
```

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.BusinessOperation.findOne`, `m.BusinessDocument.findOne`, `Model.save`, `AuditEvent.save`, `m.Warehouse.findById`, `m.Party.findOne`, `m.ProductUomVersion.findById`, `m.Uom.findById`, `m.PurchaseSourceClaim.find`, `m.PurchaseSourceClaim.deleteMany`, `m.LineLink.deleteMany`, `m.DocumentLine.deleteOne`, `m.DocumentLine.updateOne`, `m.DocumentLine.find`, `m.DocumentLine.findOne`, `m.Approval.findOne`, `m.Product.findById`, `m.BusinessDocument.findOneAndUpdate`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** PO đã OPEN không sửa ordered gốc bằng PUT; dùng amendment/chốt thiếu.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function updatePurchaseOrder(user, poId, input) {
  accountant(user);
  return command(user, 'UPDATE_PURCHASE_ORDER', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    if (po.workflowStatus !== 'DRAFT') fail('STATE', 'Chỉ sửa PO nháp; PO mở dùng amendment');
    await master(user, input, session);
    await draftLines(user, po, input, session);
    return { document: await bump(po, session, { header: { warehouseId: input.warehouseId, supplierId: input.supplierId, creationKey: po.header.creationKey, ...(input.expectedOn && { expectedOn: new Date(input.expectedOn) }) } }) };
  });
}
```

</details>

<a id="fn-189"></a>

## confirmPurchaseOrder()

**Code:** [purchase-order.commands.js:97](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:97).

**Tham số:** `confirmPurchaseOrder(user, poId, input)`.

**Công việc:** Chuyển PO DRAFT thành OPEN và giữ nguồn mua.

**Xử lý theo thứ tự:**

1. Kiểm version/status/master; đọc mọi dòng, cần ít nhất 1.
2. Mỗi dòng phải có đúng một link RR mua và linkedQty bằng dòng.
3. Đọc RR/Approval và claim lưu ở nháp; approval hiện hành phải đúng bản đã chọn.
4. claim từng dòng trong cùng giao dịch; bump PO OPEN.

**Đường dẫn gọi tới hàm này:** `POST /api/purchase-orders/:id/confirm` ([route dòng 16](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:16)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [accountant()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-182), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [master()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-184), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [claim()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-186), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.LineLink`, tại [dòng 105](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:105). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.LineLink.find({ targetLineId: l._id, relationCode: 'REPLENISHMENT_PURCHASE' })
```

- Đọc theo mã _id qua `m.DocumentLine`, tại [dòng 107](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:107). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.findById(links[0].sourceLineId)
```

- Đọc theo mã _id qua `m.BusinessDocument`, tại [dòng 108](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:108). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.findById(rrLine.documentId)
```

- Đọc một bản ghi qua `m.Approval`, tại [dòng 109](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:109). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Approval.findOne({ documentId: rr._id, documentVersion: rr.version, decisionKind: RR_APPROVAL_KIND, decision: 'APPROVE' })
```

- Đọc một bản ghi qua `m.PurchaseSourceClaim`, tại [dòng 110](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:110). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseSourceClaim.findOne({ poLineId: l._id, rrLineId: rrLine?._id })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `bump` → `BusinessDocument`:

```js
bump(po, session, { workflowStatus: 'OPEN' })
```

**Ví dụ:** Hai draft 80 trên RR 100 không thể cùng confirm thành 160.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function confirmPurchaseOrder(user, poId, input) {
  accountant(user);
  return command(user, 'CONFIRM_PURCHASE_ORDER', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    if (po.workflowStatus !== 'DRAFT') fail('STATE', 'PO không còn nháp');
    await master(user, po.header, session);
    const lines = await rows(po._id, session); if (!lines.length) throw validationError('PO cần có dòng hàng');
    for (const l of lines) {
      const links = await read(m.LineLink.find({ targetLineId: l._id, relationCode: 'REPLENISHMENT_PURCHASE' }), session);
      if (links.length !== 1 || !exact(links[0].linkedQty).eq(exact(l.qtyBase))) fail('RR_SOURCE', 'Dòng PO thiếu nguồn RR');
      const rrLine = await read(m.DocumentLine.findById(links[0].sourceLineId), session);
      const rr = rrLine && await read(m.BusinessDocument.findById(rrLine.documentId), session);
      const approval = rr && await read(m.Approval.findOne({ documentId: rr._id, documentVersion: rr.version, decisionKind: RR_APPROVAL_KIND, decision: 'APPROVE' }), session);
      const savedSource = await read(m.PurchaseSourceClaim.findOne({ poLineId: l._id, rrLineId: rrLine?._id }), session);
      if (!approval || !savedSource || !same(savedSource.approvalId, approval._id)) fail('RR_SOURCE', 'Duyệt RR đã đổi so với PO nháp; lưu lại trước khi xác nhận');
      await claim(user, po, l, { rrLineId: id(rrLine._id), approvalId: id(approval._id), enteredQty: l.enteredQty.toString() }, session);
    }
    return { document: await bump(po, session, { workflowStatus: 'OPEN' }) };
  });
}
```

</details>

<a id="fn-190"></a>

## amendPurchaseOrder()

**Code:** [purchase-order.commands.js:117](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:117).

**Tham số:** `amendPurchaseOrder(user, poId, input)`.

**Công việc:** Ghi tăng quyền mua trên dòng hiện có mà giữ lượng gốc.

**Xử lý theo thứ tự:**

1. Kế toán, PO OPEN/PARTIAL/COMPLETED đúng version; evidenceFor bắt chứng cứ thuộc PO.
2. Với từng dòng hiện có dùng claim từ RR bổ sung cùng SKU/kho.
3. Save PurchaseEvent AMENDMENT, có thể đổi expectedOn.
4. bump PO; có lượng bổ sung thì trạng thái PARTIAL.

**Đường dẫn gọi tới hàm này:** `POST /api/purchase-orders/:id/amendments` ([route dòng 17](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:17)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [accountant()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-182), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [evidenceFor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-255), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [claim()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-186), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.PurchaseEvent`:

```js
save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'AMENDMENT', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, lines: events }, session)
```

- `bump` → `BusinessDocument`:

```js
bump(po, session, { ...(input.expectedOn && { 'header.expectedOn': new Date(input.expectedOn) }), ...(events.length && { workflowStatus: 'PARTIAL' }) })
```

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.BusinessOperation.findOne`, `m.BusinessDocument.findOne`, `Model.save`, `AuditEvent.save`, `m.Evidence.find`, `m.DocumentLine.find`, `m.BusinessDocument.updateOne`, `m.PurchaseSourceClaim.find`, `m.PurchaseSourceClaim.updateOne`, `m.DocumentLine.findOne`, `m.Approval.findOne`, `m.Product.findById`, `m.BusinessDocument.findOneAndUpdate`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** PO gốc 100 đã nhận 70, thêm nguồn RR 20: authorized 120 nhưng ordered gốc vẫn 100.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function amendPurchaseOrder(user, poId, input) {
  accountant(user);
  return command(user, 'AMEND_PURCHASE_ORDER', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    if (!['OPEN', 'PARTIAL', 'COMPLETED'].includes(po.workflowStatus)) fail('STATE', 'PO không thể amendment');
    await evidenceFor(user, po._id, input.evidenceIds, session, true);
    const lines = await rows(po._id, session); const events = [];
    for (const r of input.lines) {
      const l = lines.find(l => same(l._id, r.poLineId)); if (!l) throw notFoundError();
      const src = await claim(user, po, l, r, session);
      events.push({ poLineId: l._id, rrLineId: src.line._id, approvalId: src.approval._id, qtyBase: src.qty });
    }
    const event = await save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'AMENDMENT', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, lines: events }, session);
    return { document: await bump(po, session, { ...(input.expectedOn && { 'header.expectedOn': new Date(input.expectedOn) }), ...(events.length && { workflowStatus: 'PARTIAL' }) }), eventId: event._id };
  });
}
```

</details>

<a id="fn-191"></a>

## supplierConfirmation()

**Code:** [purchase-order.commands.js:133](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:133).

**Tham số:** `supplierConfirmation(user, poId, input)`.

**Công việc:** Ghi bản xác nhận lượng/ngày giao của nhà cung cấp.

**Xử lý theo thứ tự:**

1. Kế toán, PO OPEN/PARTIAL/version và chứng cứ PO.
2. Tính q hiện tại; mỗi dòng không trùng, KNOWN, lượng<=authorized và nguyên viên nếu cần.
3. Save SUPPLIER_CONFIRMATION event rồi bump PO.

**Đường dẫn gọi tới hàm này:** `POST /api/purchase-orders/:id/supplier-confirmations` ([route dòng 19](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:19)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [accountant()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-182), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [evidenceFor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-255), [purchaseOrderQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-211), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.Product`, tại [dòng 140](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:140). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Product.find({ _id: { $in: q.map(l => l.productId) } })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.PurchaseEvent`:

```js
save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'SUPPLIER_CONFIRMATION', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, lines: input.lines }, session)
```

- `bump` → `BusinessDocument`:

```js
bump(po, session)
```

**Ví dụ:** N xác nhận giao 60 ngày 05/11; không tăng tồn 60, không cộng mọi bản lịch thành đã giao.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function supplierConfirmation(user, poId, input) {
  accountant(user);
  return command(user, 'CONFIRM_SUPPLIER_SCHEDULE', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    if (!['OPEN', 'PARTIAL'].includes(po.workflowStatus)) fail('STATE', 'PO không còn mở');
    await evidenceFor(user, po._id, input.evidenceIds, session, true);
    const q = await purchaseOrderQuantities(po, session); const seen = new Set();
    const products = await read(m.Product.find({ _id: { $in: q.map(l => l.productId) } }), session);
    for (const l of input.lines) {
      const current = q.find(r => r.lineId === l.poLineId);
      if (seen.has(l.poLineId) || !current || current.quantityState !== 'KNOWN' || exact(l.qtyBase).gt(exact(current.authorizedOrderedQtyBase))) fail('SCHEDULE', 'Lượng xác nhận NCC không hợp lệ');
      if (products.find(p => same(p._id, current.productId))?.wholeBaseUnits && !exact(l.qtyBase).isInteger()) throw validationError('Số viên xác nhận phải nguyên');
      seen.add(l.poLineId);
    }
    const event = await save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'SUPPLIER_CONFIRMATION', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, lines: input.lines }, session);
    return { document: await bump(po, session), eventId: event._id };
  });
}
```

</details>

<a id="fn-192"></a>

## requestClose()

**Code:** [purchase-order.commands.js:151](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:151).

**Tham số:** `requestClose(user, poId, input)`.

**Công việc:** Đề nghị không nhận tiếp một phần lượng còn lại.

**Xử lý theo thứ tự:**

1. Kế toán, PO OPEN/PARTIAL/version, có chứng cứ thuộc PO.
2. validateClose kiểm lượng/GR nháp xung đột.
3. Save CLOSE_REQUEST rồi bump PO.

**Đường dẫn gọi tới hàm này:** `POST /api/purchase-orders/:id/close-requests` ([route dòng 21](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:21)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [accountant()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-182), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [evidenceFor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-255), [validateClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-193), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.PurchaseEvent`:

```js
save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'CLOSE_REQUEST', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, lines: input.lines }, session)
```

- `bump` → `BusinessDocument`:

```js
bump(po, session)
```

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.BusinessOperation.findOne`, `m.BusinessDocument.findOne`, `Model.save`, `AuditEvent.save`, `m.Evidence.find`, `m.Product.find`, `m.BusinessDocument.find`, `m.DocumentLine.find`, `PurchaseEvent.find`, `DocumentLine.find`, `Party.findOne`, `BusinessDocument.find`, `LineLink.find`, `StockMovement.find`, `StockBalance.find`, `StockAccount.find`, `Location.find`, `Lot.find`, `PostingBatch.find`, `m.BusinessDocument.findOneAndUpdate`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Đã nhập 70/authorized 120, xin chốt 50 không tự làm PO đóng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function requestClose(user, poId, input) {
  accountant(user);
  return command(user, 'REQUEST_PO_REMAINDER_CLOSE', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    if (!['OPEN', 'PARTIAL'].includes(po.workflowStatus)) fail('STATE', 'PO không còn mở');
    await evidenceFor(user, po._id, input.evidenceIds, session, true);
    await validateClose(po, input.lines, session);
    const event = await save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'CLOSE_REQUEST', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, lines: input.lines }, session);
    return { document: await bump(po, session), eventId: event._id };
  });
}
```

</details>

<a id="fn-193"></a>

## validateClose()

**Code:** [purchase-order.commands.js:162](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:162).

**Tham số:** `validateClose(po, lines, session)`.

**Công việc:** Kiểm lượng chốt thiếu và công việc nháp xung đột.

**Xử lý theo thứ tự:**

1. Tính quantity PO, đọc Product để kiểm nguyên.
2. Đọc GR DRAFT và dòng của chúng.
3. Mỗi dòng chốt phải thuộc PO, không trùng, KNOWN, không vượt outstanding và không có GR draft giữ trên dòng.

**Ai gọi / gọi tiếp:** Được gọi bởi [requestClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-192), [approveClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-194), [executeClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-195). Gọi tiếp [purchaseOrderQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-211), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.Product`, tại [dòng 164](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:164). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Product.find({ _id: { $in: q.map(l => l.productId) } })
```

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 165](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:165). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find({ documentKind: 'GR_PURCHASE', 'header.purchaseOrderId': po._id, workflowStatus: 'DRAFT' }).select('_id')
```

- Đọc nhiều bản ghi qua `m.DocumentLine`, tại [dòng 166](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:166). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.find({ documentId: { $in: drafts.map(d => d._id) } })
```

**Ví dụ:** Đơn còn 50 nhưng GR nháp 20 trên dòng đó thì cần giải quyết nháp trước khi chốt.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function validateClose(po, lines, session) {
  const q = await purchaseOrderQuantities(po, session); const seen = new Set();
  const products = await read(m.Product.find({ _id: { $in: q.map(l => l.productId) } }), session);
  const drafts = await read(m.BusinessDocument.find({ documentKind: 'GR_PURCHASE', 'header.purchaseOrderId': po._id, workflowStatus: 'DRAFT' }).select('_id'), session);
  const held = await read(m.DocumentLine.find({ documentId: { $in: drafts.map(d => d._id) } }), session);
  for (const l of lines) {
    const current = q.find(q => same(q.lineId, l.poLineId));
    if (seen.has(l.poLineId) || !current || current.quantityState !== 'KNOWN' || exact(l.qtyBase).gt(exact(current.outstandingQtyBase)) || held.some(r => same(r.details.poLineId, l.poLineId))) fail('CLOSE_SOURCE', 'Phần chốt thiếu vượt nguồn hoặc còn GR nháp xung đột');
    if (products.find(p => same(p._id, current.productId))?.wholeBaseUnits && !exact(l.qtyBase).isInteger()) throw validationError('Số viên chốt thiếu phải nguyên');
    seen.add(l.poLineId);
  }
}
```

</details>

<a id="fn-194"></a>

## approveClose()

**Code:** [purchase-order.commands.js:174](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:174).

**Tham số:** `approveClose(user, poId, input)`.

**Công việc:** Chủ cửa hàng duyệt yêu cầu chốt thiếu đúng phiên bản.

**Xử lý theo thứ tự:**

1. Quyền approve_exception; scoped PO/version và đọc CLOSE_REQUEST.
2. request.sourcePoVersion+1 phải bằng po.version; actor không tự duyệt.
3. Kiểm chứng cứ và validateClose lần nữa.
4. Save CLOSE_APPROVAL liên kết request và bump PO.

**Đường dẫn gọi tới hàm này:** `POST /api/purchase-orders/:id/close-approvals` ([route dòng 22](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:22)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [evidenceFor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-255), [validateClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-193), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `m.PurchaseEvent`, tại [dòng 178](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:178). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvent.findOne({ _id: input.requestId, purchaseOrderId: po._id, kind: 'CLOSE_REQUEST' })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.PurchaseEvent`:

```js
save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'CLOSE_APPROVAL', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, lines: request.lines, relatedEventId: request._id }, session)
```

- `bump` → `BusinessDocument`:

```js
bump(po, session)
```

**Ví dụ:** Sau đề nghị, PO thay đổi bởi nhận hàng hoặc gắn chứng cứ thì yêu cầu cũ không còn dùng trực tiếp.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function approveClose(user, poId, input) {
  rights(user, 'approve_exception', 'purchase_order', ['OWNER']);
  return command(user, 'APPROVE_PO_REMAINDER_CLOSE', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    const request = await read(m.PurchaseEvent.findOne({ _id: input.requestId, purchaseOrderId: po._id, kind: 'CLOSE_REQUEST' }), session);
    if (!request || request.sourcePoVersion + 1 !== po.version || same(request.actorId, user._id)) fail('CLOSE_APPROVAL', 'Yêu cầu chốt thiếu đã cũ hoặc tự duyệt');
    await evidenceFor(user, po._id, input.evidenceIds, session, true);
    await validateClose(po, request.lines, session);
    const event = await save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'CLOSE_APPROVAL', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, lines: request.lines, relatedEventId: request._id }, session);
    return { document: await bump(po, session), eventId: event._id };
  });
}
```

</details>

<a id="fn-195"></a>

## executeClose()

**Code:** [purchase-order.commands.js:186](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:186).

**Tham số:** `executeClose(user, poId, input)`.

**Công việc:** Kế toán thực hiện quyết định chốt thiếu và giải phóng quyền mua chưa dùng.

**Xử lý theo thứ tự:**

1. Kiểm version và CLOSE_APPROVAL thuộc PO, đúng source version hiện hành.
2. validateClose; save CLOSE_EXECUTION.
3. Theo từng dòng, giảm các claim theo thứ tự, bảo vệ RR purchasingVersion và claim.version; thiếu lượng nguồn thì rollback.
4. Tính lại q gồm event mới; bump CLOSED nếu mọi outstanding 0, không thì PARTIAL.

**Đường dẫn gọi tới hàm này:** `POST /api/purchase-orders/:id/close-executions` ([route dòng 23](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:23)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [accountant()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-182), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [validateClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-193), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [purchaseOrderQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-211), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `m.PurchaseEvent`, tại [dòng 190](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:190). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvent.findOne({ _id: input.approvalId, purchaseOrderId: po._id, kind: 'CLOSE_APPROVAL' })
```

- Đọc nhiều bản ghi qua `m.PurchaseSourceClaim`, tại [dòng 197](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:197). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseSourceClaim.find({ poLineId: l.poLineId }).sort({ _id: 1 })
```

- Đọc theo mã _id qua `m.DocumentLine`, tại [dòng 200](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:200). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.findById(c.rrLineId)
```

- Cập nhật một bản ghi qua `m.BusinessDocument`, tại [dòng 202](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:202). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.updateOne({ _id: rrLine.documentId, documentKind: 'REPLENISHMENT' }, { $inc: { 'header.purchasingVersion': 1 } }, { session })
```

- Cập nhật một bản ghi qua `m.PurchaseSourceClaim`, tại [dòng 204](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.js:204). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseSourceClaim.updateOne({ _id: c._id, version: c.version }, { $set: { qtyBase: exact(c.qtyBase).minus(take).toString() }, $inc: { version: 1 } }, { session })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.PurchaseEvent`:

```js
save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'CLOSE_EXECUTION', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: approval.evidenceIds, lines: approval.lines, relatedEventId: approval._id }, session)
```

- `bump` → `BusinessDocument`:

```js
bump(po, session, { workflowStatus: q.every(r => r.quantityState === 'KNOWN' && exact(r.outstandingQtyBase).isZero()) ? 'CLOSED' : 'PARTIAL' })
```

**Ví dụ:** Nhập 70/chốt 50 trên authorized 120 giữ tồn 70; không có GR 50 giả.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function executeClose(user, poId, input) {
  accountant(user);
  return command(user, 'EXECUTE_PO_REMAINDER_CLOSE', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    const approval = await read(m.PurchaseEvent.findOne({ _id: input.approvalId, purchaseOrderId: po._id, kind: 'CLOSE_APPROVAL' }), session);
    if (!approval || approval.sourcePoVersion + 1 !== po.version) fail('CLOSE_APPROVAL', 'Duyệt chốt thiếu không còn hiện hành');
    await validateClose(po, approval.lines, session);
    const event = await save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'CLOSE_EXECUTION', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: approval.evidenceIds, lines: approval.lines, relatedEventId: approval._id }, session);
    // Release only the closed, unreceived allowance. Received authority remains reserved.
    for (const l of approval.lines) {
      let left = exact(l.qtyBase);
      const claims = await read(m.PurchaseSourceClaim.find({ poLineId: l.poLineId }).sort({ _id: 1 }), session);
      for (const c of claims) {
        if (left.isZero()) break;
        const rrLine = await read(m.DocumentLine.findById(c.rrLineId), session);
        if (!rrLine) fail('RR_SOURCE', 'Nguồn claim RR bị thiếu');
        await m.BusinessDocument.updateOne({ _id: rrLine.documentId, documentKind: 'REPLENISHMENT' }, { $inc: { 'header.purchasingVersion': 1 } }, { session });
        const take = exact(c.qtyBase).lt(left) ? exact(c.qtyBase) : left;
        const changed = await m.PurchaseSourceClaim.updateOne({ _id: c._id, version: c.version }, { $set: { qtyBase: exact(c.qtyBase).minus(take).toString() }, $inc: { version: 1 } }, { session });
        if (changed.matchedCount !== 1) fail('RR_SOURCE', 'Claim RR vừa đổi khi chốt thiếu');
        left = left.minus(take);
      }
      if (!left.isZero()) fail('RR_SOURCE', 'Không đủ allowance nguồn để chốt');
    }
    const q = await purchaseOrderQuantities(po, session);
    return { document: await bump(po, session, { workflowStatus: q.every(r => r.quantityState === 'KNOWN' && exact(r.outstandingQtyBase).isZero()) ? 'CLOSED' : 'PARTIAL' }), eventId: event._id };
  });
}
```

</details>

<a id="fn-196"></a>

## action()

**Code:** [purchase-order.commands.routes.js:11](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:11).

**Tham số:** `action(fields)`.

**Công việc:** Ghép schema chung của lệnh PO với các trường riêng.

**Xử lý theo thứ tự:**

1. Ghép expectedVersion/operationKey và fields.
2. z.object(...).strict cấm trường thừa.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Gửi supplierId vào lệnh confirm không tự đổi supplier vì không thuộc schema lệnh.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
action = fields => z.object({ ...commandBody, ...fields }).strict()
```

</details>

<a id="fn-197"></a>

## list()

**Code:** [purchase-order.controller.js:5](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.controller.js:5).

**Tham số:** `list(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới listPurchaseOrders và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ listPurchaseOrders hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/purchase-orders` ([route dòng 10](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.routes.js:10)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [listPurchaseOrders()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-210), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `BusinessDocument.find`, `BusinessDocument.countDocuments`, `Party.find`, `Warehouse.find`, `PurchaseEvent.find`, `DocumentLine.find`, `Party.findOne`, `LineLink.find`, `StockMovement.find`, `StockBalance.find`, `StockAccount.find`, `Location.find`, `Lot.find`, `PostingBatch.find`, `Product.find`, `Uom.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do listPurchaseOrders quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
list = catchAsync(async (req, res) => {
  const data = await service.listPurchaseOrders(req.user, req.validated.query);
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-198"></a>

## get()

**Code:** [purchase-order.controller.js:9](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.controller.js:9).

**Tham số:** `get(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới getPurchaseOrder và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ getPurchaseOrder hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/purchase-orders/:id` ([route dòng 20](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.routes.js:20)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [getPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-212), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `BusinessDocument.findOne`, `Party.findById`, `Warehouse.findById`, `PurchaseEvent.find`, `DocumentLine.find`, `Party.findOne`, `BusinessDocument.find`, `LineLink.find`, `StockMovement.find`, `StockBalance.find`, `StockAccount.find`, `Location.find`, `Lot.find`, `PostingBatch.find`, `Product.find`, `Uom.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do getPurchaseOrder quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
get = catchAsync(async (req, res) => {
  const data = await service.getPurchaseOrder(req.user, req.validated.params.id);
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-199"></a>

## canReadAllPurchaseOrders()

**Code:** [purchase-order.service.js:33](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:33).

**Tham số:** `canReadAllPurchaseOrders(user)`.

**Công việc:** Nhận ra vai trò được đọc PO mọi kho trong code hiện tại.

**Xử lý theo thứ tự:**

1. Lấy role hiện tại; true cho OWNER hoặc ACCOUNTANT.

**Ai gọi / gọi tiếp:** Được gọi bởi [scopedWarehouseFilter()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-200), [getPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-212). Gọi tiếp [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Kế toán đọc được PO khoB dù chưa được giaoB; không suy ra có quyền sửa/nhận ởB.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
canReadAllPurchaseOrders = (user) => ["OWNER", "ACCOUNTANT"].includes(currentRole(user)?.code)
```

</details>

<a id="fn-200"></a>

## scopedWarehouseFilter()

**Code:** [purchase-order.service.js:34](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:34).

**Tham số:** `scopedWarehouseFilter(user, warehouseId)`.

**Công việc:** Dựng filter kho cho reader PO với ngoại lệ đọc kế toán.

**Xử lý theo thứ tự:**

1. Nếu có warehouseId: chủ/kế toán được chọn; người khác phải được giao.
2. Không chọn: chủ/kế toán filter rỗng; người khác giới hạn warehouseIds.

**Ai gọi / gọi tiếp:** Được gọi bởi [listPurchaseOrders()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-210). Gọi tiếp [canReadAllPurchaseOrders()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-199), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298), [scopeError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-327), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Kế toán xem toàn bộ danh sách mua, còn nhân viên kho chỉ các kho được giao.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function scopedWarehouseFilter(user, warehouseId) {
  if (warehouseId) {
    if (!canReadAllPurchaseOrders(user) && !canAccessWarehouse(user, warehouseId)) throw scopeError();
    return {
      "header.warehouseId": new mongoose.Types.ObjectId(idString(warehouseId)),
    };
  }
  if (canReadAllPurchaseOrders(user)) return {};
  return {
    "header.warehouseId": {
      $in: (user.warehouseIds || []).map(
        (warehouseId) => new mongoose.Types.ObjectId(idString(warehouseId)),
      ),
    },
  };
}
```

</details>

<a id="fn-201"></a>

## loadBatchGraph()

**Code:** [purchase-order.service.js:51](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:51).

**Tham số:** `loadBatchGraph(batchIds, session = null)`.

**Công việc:** Đọc batch và các batch gốc của giao dịch đảo.

**Xử lý theo thứ tự:**

1. Bắt đầu từ các batchId của movement.
2. Đọc gom batch chưa có; nếu reversalOf tồn tại thì thêm mã nguồn vào lượt sau.
3. Dừng khi hết mã hoặc không tìm thấy; trả Map batch.

**Ai gọi / gọi tiếp:** Được gọi bởi [grLineReceivedQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-204). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `PostingBatch`, tại [dòng 55](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:55). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
PostingBatch.find({
      _id: { $in: pending },
    }).session(session).lean()
```

**Ví dụ:** Batch đảoB tham chiếu batch nhậpA cần đọc cảA để biết chiều hợp lệ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function loadBatchGraph(batchIds, session = null) {
  const batches = new Map();
  let pending = [...new Set(batchIds.filter(Boolean).map(idString))];
  while (pending.length) {
    const records = await PostingBatch.find({
      _id: { $in: pending },
    }).session(session).lean();
    if (!records.length) break;
    pending = [];
    for (const batch of records) {
      if (!batches.has(idString(batch._id))) {
        batches.set(idString(batch._id), batch);
        if (batch.reversalOf) pending.push(idString(batch.reversalOf));
      }
    }
  }
  return batches;
}
```

</details>

<a id="fn-202"></a>

## batchSign()

**Code:** [purchase-order.service.js:70](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:70).

**Tham số:** `batchSign(batch, batches)`.

**Công việc:** Tính chiều của batch theo số tầng đảo.

**Xử lý theo thứ tự:**

1. Bắt đầu dấu+1.
2. Mỗi reversalOf đổi dấu; giữ tập đã đi để phát hiện vòng.
3. Thiếu batch gốc hoặc vòng thì lỗi.

**Ai gọi / gọi tiếp:** Được gọi bởi [grLineReceivedQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-204). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Nhập gốc dấu+; đảo dấu−; đảo của đảo dấu+, nếu chuỗi nguồn có đủ căn cứ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function batchSign(batch, batches) {
  let sign = 1;
  const seen = new Set();
  while (batch?.reversalOf) {
    if (seen.has(idString(batch._id))) throw new Error("batch cycle");
    seen.add(idString(batch._id));
    sign *= -1;
    batch = batches.get(idString(batch.reversalOf));
    if (!batch) throw new Error("missing reversal batch");
  }
  return sign;
}
```

</details>

<a id="fn-203"></a>

## resolveGrLines()

**Code:** [purchase-order.service.js:83](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:83).

**Tham số:** `resolveGrLines(poLines, poDocuments, session = null)`.

**Công việc:** Xác định các dòng nhập hợp lệ thuộc từng dòng PO.

**Xử lý theo thứ tự:**

1. Khởi tạo trạng thái từng dòng PO.
2. Đọc GR trỏ trực tiếp PO, dòng GR, kiểm nhận và dòng kiểm được tham chiếu.
3. Kiểm cùng PO/kho/supplier/sản phẩm/lô/quality và conversion/qty giữa kiểm và nhập; gắn dòng nhập vào nguồn PO.
4. Thiếu dòng GR hoặc liên kết đi từ dòng PO sang loại khác ngoài PO_INSPECTION thì đánh broken.

**Ai gọi / gọi tiếp:** Được gọi bởi [computedDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-207). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `BusinessDocument`, tại [dòng 96](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:96). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.find({documentKind:'GR_PURCHASE','header.purchaseOrderId':{$in:poDocuments.map(d=>d._id)}}).session(session).lean()
```

- Đọc nhiều bản ghi qua `DocumentLine`, tại [dòng 97](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:97). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.find({documentId:{$in:directDocuments.map(d=>d._id)}}).session(session).lean()
```

- Đọc nhiều bản ghi qua `BusinessDocument`, tại [dòng 98](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:98). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.find({_id:{$in:directDocuments.map(d=>d.header.poInspectionId).filter(Boolean)},documentKind:'PO_INSPECTION'}).session(session).lean()
```

- Đọc nhiều bản ghi qua `DocumentLine`, tại [dòng 99](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:99). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.find({_id:{$in:directLines.map(l=>l.details?.inspectionLineId).filter(Boolean)}}).session(session).lean()
```

- Đọc nhiều bản ghi qua `LineLink`, tại [dòng 129](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:129). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
LineLink.find({sourceLineId:{$in:poLines.map(l=>l._id)}}).session(session).lean()
```

- Đọc nhiều bản ghi qua `DocumentLine`, tại [dòng 130](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:130). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.find({_id:{$in:links.map(l=>l.targetLineId)}}).session(session).lean()
```

- Đọc nhiều bản ghi qua `BusinessDocument`, tại [dòng 131](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:131). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.find({_id:{$in:targets.map(l=>l.documentId)}}).session(session).lean()
```

**Ví dụ:** Chỉ sửa supplierId trên GR không đủ khiến phiếu trở thành nguồn hợp lệ củaPO khác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function resolveGrLines(poLines, poDocuments, session = null) {
  const states = new Map();
  for (const line of poLines) {
    states.set(idString(line._id), {
      broken: false,
      grLines: new Set(),
      received: new ExactDecimal(0),
    });
  }
  const poById = new Map(
    poDocuments.map((document) => [idString(document._id), document]),
  );
  const grLineDocuments = new Map();
  const directDocuments = await BusinessDocument.find({documentKind:'GR_PURCHASE','header.purchaseOrderId':{$in:poDocuments.map(d=>d._id)}}).session(session).lean();
  const directLines = await DocumentLine.find({documentId:{$in:directDocuments.map(d=>d._id)}}).session(session).lean();
  const directInspections = await BusinessDocument.find({_id:{$in:directDocuments.map(d=>d.header.poInspectionId).filter(Boolean)},documentKind:'PO_INSPECTION'}).session(session).lean();
  const inspectedLines = await DocumentLine.find({_id:{$in:directLines.map(l=>l.details?.inspectionLineId).filter(Boolean)}}).session(session).lean();
  const directDocById=new Map(directDocuments.map(d=>[idString(d._id),d]));
  const inspectionById=new Map(directInspections.map(d=>[idString(d._id),d]));
  const inspectedById=new Map(inspectedLines.map(l=>[idString(l._id),l]));
  const poLineById=new Map(poLines.map(l=>[idString(l._id),l]));
  const grsWithLines = new Set(directLines.map(l => idString(l.documentId)));
  for(const gr of directDocuments) if(!grsWithLines.has(idString(gr._id))) {
    for(const p of poLines.filter(p=>idString(p.documentId)===idString(gr.header.purchaseOrderId))) states.get(idString(p._id)).broken=true;
  }
  for(const line of directLines) {
    const gr=directDocById.get(idString(line.documentId));
    const po=poById.get(idString(gr.header.purchaseOrderId));
    const source=poLineById.get(idString(line.details?.poLineId));
    const inspection=inspectionById.get(idString(gr.header.poInspectionId));
    const inspected=inspectedById.get(idString(line.details?.inspectionLineId));
    const valid=source && idString(source.documentId)===idString(po._id) && line.lineKind==='PURCHASE_RECEIPT'
      && idString(line.productId)===idString(source.productId) && idString(gr.header.warehouseId)===idString(po.header.warehouseId)
      && idString(gr.header.supplierId)===idString(po.header.supplierId) && inspection?.workflowStatus==='CONFIRMED'
      && idString(inspection.header.warehouseId)===idString(po.header.warehouseId)
      && idString(inspection.header.supplierId)===idString(po.header.supplierId) && inspected?.lineKind==='PO_INSPECTION'
      && idString(inspection.header.purchaseOrderId)===idString(po._id) && idString(inspected?.documentId)===idString(inspection._id)
      && idString(inspected?.details?.poLineId)===idString(source._id) 
      && idString(inspected?.productId)===idString(line.productId) && idString(inspected?.lotId)===idString(line.lotId)
      && inspected?.details?.qualityCode==='GOOD' && line.details?.qualityCode==='GOOD'
      && idString(inspected?.conversionId)===idString(line.conversionId)
      && new ExactDecimal(inspected.conversionSnapshot.toString()).eq(new ExactDecimal(line.conversionSnapshot.toString())) && new ExactDecimal(inspected.qtyBase.toString()).eq(new ExactDecimal(line.qtyBase.toString()));
    if(!valid) { for(const p of poLines.filter(p=>idString(p.documentId)===idString(po?._id))) states.get(idString(p._id)).broken=true; continue; }
    states.get(idString(source._id)).grLines.add(idString(line._id));grLineDocuments.set(idString(line._id),gr);
  }
  // Only PO -> PO_INSPECTION links are supported; malformed sources are unknown.
  const links=await LineLink.find({sourceLineId:{$in:poLines.map(l=>l._id)}}).session(session).lean();
  const targets=await DocumentLine.find({_id:{$in:links.map(l=>l.targetLineId)}}).session(session).lean();
  const documents=await BusinessDocument.find({_id:{$in:targets.map(l=>l.documentId)}}).session(session).lean();
  const targetById = new Map(targets.map(l => [idString(l._id), l]));
  const documentById = new Map(documents.map(d => [idString(d._id), d]));
  for(const link of links) {
    const source=poLineById.get(idString(link.sourceLineId));
    const target=targetById.get(idString(link.targetLineId));
    const document=target && documentById.get(idString(target.documentId));
    if(!document || document.documentKind!=='PO_INSPECTION' || target.lineKind!=='PO_INSPECTION'
      || idString(target.details?.poLineId)!==idString(source._id)
      || idString(document.header.purchaseOrderId)!==idString(source.documentId)
      || idString(target.productId)!==idString(source.productId)) states.get(idString(source._id)).broken=true;
  }
  return { states, grLineDocuments };
}
```

</details>

<a id="fn-204"></a>

## grLineReceivedQuantities()

**Code:** [purchase-order.service.js:146](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:146).

**Tham số:** `grLineReceivedQuantities(grLineDocuments, storePartyId, session = null)`.

**Công việc:** Tính lượng nhập ròng từng dòng GR từ lịch sử thật.

**Xử lý theo thứ tự:**

1. Đọc movement, batch graph, số dư, tài khoản, vị trí, chứng từ, lô và dòng GR.
2. GR chưa POSTED không được có movement; POSTED cần movement và STORE.
3. Mỗi movement kiểm đúng document/batch/chuỗi đảo, đúng lô thuộc sản phẩm và kho.
4. Đếm đúng một đầu STORE, chiều phải khớp dấu batch; cộng/trừ q. Nguồn sai đánh incomplete.

**Ai gọi / gọi tiếp:** Được gọi bởi [computedDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-207). Gọi tiếp [loadBatchGraph()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-201), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [batchSign()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-202).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `StockMovement`, tại [dòng 155](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:155). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
StockMovement.find({
    lineId: { $in: grLineIds },
  }).session(session).lean()
```

- Đọc nhiều bản ghi qua `StockBalance`, tại [dòng 171](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:171). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
StockBalance.find({
    _id: { $in: balanceIds },
  }).session(session).lean()
```

- Đọc nhiều bản ghi qua `StockAccount`, tại [dòng 174](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:174). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
StockAccount.find({
    _id: { $in: balances.map((balance) => balance.accountId) },
  }).session(session).lean()
```

- Đọc nhiều bản ghi qua `Location`, tại [dòng 177](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:177). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Location.find({
    _id: { $in: accounts.map((account) => account.locationId).filter(Boolean) },
  }).session(session).lean()
```

- Đọc nhiều bản ghi qua `BusinessDocument`, tại [dòng 180](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:180). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.find({
    _id: {
      $in: movements.map((movement) => movement.documentId),
    },
  }).session(session).lean()
```

- Đọc nhiều bản ghi qua `Lot`, tại [dòng 188](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:188). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Lot.find({_id:{$in:balances.map(b=>b.lotId)}}).session(session).lean()
```

- Đọc nhiều bản ghi qua `DocumentLine`, tại [dòng 190](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:190). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.find({_id:{$in:grLineIds}}).session(session).lean()
```

**Ví dụ:** Nhập 70 và đảo 70 có ròng 0, không tính 140 hoặc trừ hai lần vì vừa đổi dấu batch vừa đổi chiều.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function grLineReceivedQuantities(grLineDocuments, storePartyId, session = null) {
  const grLineIds = [...grLineDocuments.keys()];
  const results = new Map(
    grLineIds.map((lineId) => [
      lineId,
      { qty: new ExactDecimal(0), incomplete: false, posted: false },
    ]),
  );
  if (!grLineIds.length) return results;
  const movements = await StockMovement.find({
    lineId: { $in: grLineIds },
  }).session(session).lean();
  const batches = await loadBatchGraph(
    movements.map((movement) => movement.batchId), session,
  );
  const balanceIds = [
    ...new Set(
      movements
        .flatMap((movement) => [
          idString(movement.fromBalanceId),
          idString(movement.toBalanceId),
        ])
        .filter(Boolean),
    ),
  ];
  const balances = await StockBalance.find({
    _id: { $in: balanceIds },
  }).session(session).lean();
  const accounts = await StockAccount.find({
    _id: { $in: balances.map((balance) => balance.accountId) },
  }).session(session).lean();
  const locations = await Location.find({
    _id: { $in: accounts.map((account) => account.locationId).filter(Boolean) },
  }).session(session).lean();
  const documents = await BusinessDocument.find({
    _id: {
      $in: movements.map((movement) => movement.documentId),
    },
  }).session(session).lean();
  const balanceById = new Map(
    balances.map((balance) => [idString(balance._id), balance]),
  );
  const lots=await Lot.find({_id:{$in:balances.map(b=>b.lotId)}}).session(session).lean();
  const lotById=new Map(lots.map(l=>[idString(l._id),l]));
  const grLines=await DocumentLine.find({_id:{$in:grLineIds}}).session(session).lean();
  const grById=new Map(grLines.map(l=>[idString(l._id),l]));
  const accountById = new Map(
    accounts.map((account) => [idString(account._id), account]),
  );
  const locationById = new Map(
    locations.map((location) => [idString(location._id), location]),
  );
  const documentById = new Map(
    documents.map((document) => [idString(document._id), document]),
  );
  const movementsByLine = new Map();
  for (const movement of movements) {
    const list = movementsByLine.get(idString(movement.lineId)) || [];
    list.push(movement);
    movementsByLine.set(idString(movement.lineId), list);
  }
  for (const [lineId, grDocument] of grLineDocuments) {
    const result = results.get(lineId);
    const lineMovements = movementsByLine.get(lineId) || [];
    if (grDocument.workflowStatus !== "POSTED") {
      if (lineMovements.length) result.incomplete = true;
      continue;
    }
    result.posted = true;
    if (!lineMovements.length || !storePartyId) {
      result.incomplete = true;
      continue;
    }
    for (const movement of lineMovements) {
      try {
        const batch = batches.get(idString(movement.batchId));
        if (!batch) throw new Error("missing batch");
        if(idString(batch.documentId)!==idString(grDocument._id)) throw new Error('wrong batch document');
        let ancestor=batch; const ancestry=new Set();
        while(ancestor) {
          if(ancestry.has(idString(ancestor._id)) || idString(ancestor.documentId)!==idString(grDocument._id)) throw new Error('wrong reversal ancestry');
          ancestry.add(idString(ancestor._id));
          if(!ancestor.reversalOf) break;
          ancestor=batches.get(idString(ancestor.reversalOf));
          if(!ancestor || !lineMovements.some(m=>idString(m.batchId)===idString(ancestor._id))) throw new Error('reversal has no source movement for receipt line');
        }
        const sign = batchSign(batch, batches);
        const document = documentById.get(idString(movement.documentId));
        if (
          !document ||
          document.documentKind !== "GR_PURCHASE" ||
          idString(document._id) !== idString(grDocument._id)
        ) {
          throw new Error("wrong receipt document");
        }
        let storeEndpoints = 0;
        let direction=0;
        for (const balanceId of [
          movement.fromBalanceId,
          movement.toBalanceId,
        ]) {
          if (!balanceId) continue;
          const balance = balanceById.get(idString(balanceId));
          if (!balance) throw new Error("missing balance");
          const grLine=grById.get(lineId);
          const lot=lotById.get(idString(balance.lotId));
          if(!lot || idString(lot.productId)!==idString(grLine.productId) || (grLine.lotId && idString(grLine.lotId)!==idString(lot._id))) throw new Error('wrong receipt product/lot');
          const account = accountById.get(idString(balance.accountId));
          const location = account
            ? locationById.get(idString(account.locationId))
            : null;
          if (
            !account ||
            !location ||
            idString(location.warehouseId) !==
              idString(grDocument.header.warehouseId)
          ) {
            throw new Error("wrong receipt warehouse");
          }
          if (idString(balance.ownerPartyId) === idString(storePartyId)) {
            storeEndpoints += 1;
            direction=idString(balanceId)===idString(movement.toBalanceId)?1:-1;
          }
        }
        // A ledger row is counted once, not once per endpoint. The batch-chain
        // sign already represents reversal/reversal-of-reversal; the movement
        // direction is part of that same fact and must not be inverted again.
        if (storeEndpoints === 1) {
          if(direction!==sign) throw new Error('receipt direction contradicts reversal ancestry');
          result.qty = result.qty.plus(
            new ExactDecimal(movement.qtyBase.toString()).mul(direction),
          );
        } else if (storeEndpoints > 1) {
          throw new Error("receipt movement does not cross ownership");
        }
      } catch {
        result.incomplete = true;
      }
    }
    if (result.qty.isNegative()) result.incomplete = true;
  }
  return results;
}
```

</details>

<a id="fn-205"></a>

## emptyComputedLine()

**Code:** [purchase-order.service.js:290](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:290).

**Tham số:** `emptyComputedLine(line)`.

**Công việc:** Trả kết quả lượng khi nguồn chưa đủ căn cứ.

**Xử lý theo thứ tự:**

1. Giữ lượng gốc đã biết và mã dòng/sản phẩm.
2. Đặt những lượng không đủ cơ sở thành null, quantityState=INCOMPLETE.

**Ai gọi / gọi tiếp:** Được gọi bởi [computedDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-207). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Phiếu bị hỏng nguồn không được trả received=0 như thể đã đối soát xong.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function emptyComputedLine(line) {
  const ordered = new ExactDecimal(line.qtyBase.toString());
  return {
    lineId: idString(line._id),
    lineNo: line.lineNo,
    productId: idString(line.productId),
    orderedQtyBase: ordered.toString(),
    confirmedQtyBase: null,
    receivedQtyBase: null,
    cancelledQtyBase: null,
    outstandingQtyBase: null,
    quantityState: "INCOMPLETE",
  };
}
```

</details>

<a id="fn-206"></a>

## quantityStatus()

**Code:** [purchase-order.service.js:305](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:305).

**Tham số:** `quantityStatus(lines)`.

**Công việc:** Đánh dấu đơn còn phải nhận hay chưa biết.

**Xử lý theo thứ tự:**

1. Không dòng hoặc có INCOMPLETE thì UNKNOWN.
2. Nếu có outstanding dương thì YES, hết thì NO.

**Ai gọi / gọi tiếp:** Được gọi bởi [computedDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-207). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Đơn có một dòng chưa rõ không được kết luận đã hết nghĩa vụ từ dòng khác bằng 0.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function quantityStatus(lines) {
  if (!lines.length || lines.some((line) => line.quantityState === "INCOMPLETE")) {
    return "UNKNOWN";
  }
  return lines.some(
    (line) => new ExactDecimal(line.outstandingQtyBase).gt(0),
  )
    ? "YES"
    : "NO";
}
```

</details>

<a id="fn-207"></a>

## computedDocuments()

**Code:** [purchase-order.service.js:316](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:316).

**Tham số:** `computedDocuments(documents, session = null)`.

**Công việc:** Tính lượng PO từ lượng gốc, sự kiện thay đổi và GR hợp lệ.

**Xử lý theo thứ tự:**

1. Đọc PurchaseEvent amendment/close execution/confirmation và mọi dòng của tập PO.
2. resolveGrLines, kiểm một GR line không thuộc nhiều nguồn PO, tìm STORE rồi grLineReceivedQuantities.
3. Theo từng dòng: authorized=original+amendments; closed=tổng close execution; confirmation là bản gần nhất có dòng.
4. Nếu broken, closed thiếu căn cứ hoặc received+closed>authorized thì INCOMPLETE; nếu đạt outstanding=authorized−closed−received.

**Ai gọi / gọi tiếp:** Được gọi bởi [listPurchaseOrders()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-210), [purchaseOrderQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-211), [getPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-212). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [resolveGrLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-203), [grLineReceivedQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-204), [computedDocuments.sumEvents()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-208), [emptyComputedLine()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-205), [quantityStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-206).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `PurchaseEvent`, tại [dòng 318](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:318). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
PurchaseEvent.find({ purchaseOrderId: { $in: documents.map(d => d._id) }, kind: { $in: ['AMENDMENT','CLOSE_EXECUTION','SUPPLIER_CONFIRMATION'] } }).sort({ createdAt: -1, _id: -1 }).session(session).lean()
```

- Đọc nhiều bản ghi qua `DocumentLine`, tại [dòng 319](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:319). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.find({
    documentId: { $in: documents.map((document) => document._id) },
  })
    .sort({ lineNo: 1 })
    .session(session).lean()
```

- Đọc một bản ghi qua `Party`, tại [dòng 345](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:345). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Party.findOne({ kind: "STORE" }).select("_id").session(session).lean()
```

**Ví dụ:** Đơn 100 bổ sung 20 nhập 70 chốt 10: authorized 120, outstanding 40.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function computedDocuments(documents, session = null) {
  if (!documents.length) return [];
  const events = await PurchaseEvent.find({ purchaseOrderId: { $in: documents.map(d => d._id) }, kind: { $in: ['AMENDMENT','CLOSE_EXECUTION','SUPPLIER_CONFIRMATION'] } }).sort({ createdAt: -1, _id: -1 }).session(session).lean();
  const lines = await DocumentLine.find({
    documentId: { $in: documents.map((document) => document._id) },
  })
    .sort({ lineNo: 1 })
    .session(session).lean();
  const linesByDocument = new Map();
  for (const line of lines) {
    const key = idString(line.documentId);
    const values = linesByDocument.get(key) || [];
    values.push(line);
    linesByDocument.set(key, values);
  }
  const { states, grLineDocuments } = await resolveGrLines(lines, documents, session);
  const grOwners = new Map();
  for (const [poLineId, state] of states) {
    for (const grLineId of state.grLines) {
      const owners = grOwners.get(grLineId) || new Set();
      owners.add(poLineId);
      grOwners.set(grLineId, owners);
    }
  }
  for (const owners of grOwners.values()) {
    if (owners.size > 1) {
      for (const poLineId of owners) states.get(poLineId).broken = true;
    }
  }
  const store = await Party.findOne({ kind: "STORE" }).select("_id").session(session).lean();
  const receivedByGrLine = await grLineReceivedQuantities(
    grLineDocuments,
    store?._id, session,
  );
  for (const [poLineId, state] of states) {
    if (state.broken) continue;
    for (const grLineId of state.grLines) {
      const received = receivedByGrLine.get(grLineId);
      if (!received || received.incomplete) {
        state.broken = true;
        continue;
      }
      state.received = state.received.plus(received.qty);
    }
  }
  return documents.map((document) => {
    const documentLines = linesByDocument.get(idString(document._id)) || [];
    const lineResults = documentLines.map((line) => {
      const state = states.get(idString(line._id));
      const originalOrdered = new ExactDecimal(line.qtyBase.toString());
      const ownEvents = events.filter(e => idString(e.purchaseOrderId) === idString(document._id));
      const sumEvents = kind => ownEvents.filter(e => e.kind === kind).flatMap(e => e.lines).filter(l => idString(l.poLineId) === idString(line._id)).reduce((sum,l) => sum.plus(new ExactDecimal(l.qtyBase.toString())), new ExactDecimal(0));
      const ordered = originalOrdered.plus(sumEvents('AMENDMENT'));
      const closed = sumEvents('CLOSE_EXECUTION');
      const confirmation = ownEvents.filter(e => e.kind === 'SUPPLIER_CONFIRMATION').flatMap(e => e.lines).find(l => idString(l.poLineId) === idString(line._id));
      const closedWithoutBasis = ["CANCELLED", "CLOSED"].includes(
        document.workflowStatus,
      ) && !ownEvents.some(e => e.kind === 'CLOSE_EXECUTION');
      if (!state || state.broken || closedWithoutBasis) {
        return emptyComputedLine(line);
      }
      if (state.received.plus(closed).gt(ordered)) {
        return emptyComputedLine(line);
      }
      const outstanding = ordered.minus(closed).minus(state.received);
      return {
        lineId: idString(line._id),
        lineNo: line.lineNo,
        productId: idString(line.productId),
        productNameSnapshot: line.productNameSnapshot, productSkuSnapshot: line.productSkuSnapshot,
        orderedQtyBase: originalOrdered.toString(),
        authorizedOrderedQtyBase: ordered.toString(),
        netPostedReceiptQtyBase: state.received.toString(),
        closedRemainderQtyBase: closed.toString(),
        confirmedQtyBase: confirmation?.qtyBase.toString() ?? null,
        receivedQtyBase: state.received.toString(),
        cancelledQtyBase: closed.toString(),
        outstandingQtyBase: outstanding.toString(),
        quantityState: "KNOWN",
      };
    });
    return {
      document,
      lines: lineResults,
      outstandingStatus: quantityStatus(lineResults),
    };
  });
}
```

</details>

<a id="fn-208"></a>

## computedDocuments.sumEvents()

**Code:** [purchase-order.service.js:367](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:367).

**Tham số:** `computedDocuments.sumEvents(kind)`.

**Công việc:** Cộng lượng sự kiện của đúng dòng PO và đúng loại.

**Xử lý theo thứ tự:**

1. Lọc ownEvents theo kind, dàn các lines, giữ poLineId đang tính.
2. Cộng qtyBase bằng ExactDecimal từ 0.

**Ai gọi / gọi tiếp:** Được gọi bởi [computedDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-207). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Chỉ cộng amendment của dòngA, không cộng lượng dòngB trên cùng sự kiện.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
sumEvents = kind => ownEvents.filter(e => e.kind === kind).flatMap(e => e.lines).filter(l => idString(l.poLineId) === idString(line._id)).reduce((sum,l) => sum.plus(new ExactDecimal(l.qtyBase.toString())), new ExactDecimal(0))
```

</details>

<a id="fn-209"></a>

## mapPreviewLines()

**Code:** [purchase-order.service.js:405](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:405).

**Tham số:** `mapPreviewLines(computedLines, session = null)`.

**Công việc:** Gắn nhãn sản phẩm/đơn vị vào các lượng PO đã tính.

**Xử lý theo thứ tự:**

1. Đọc gom Product và Uom gốc.
2. Tên/mã ưu tiên snapshot của dòng, rồi mới dùng master hiện tại.
3. Trả các lượng gốc/authorized/ròng/closed/confirmed/outstanding và quantityState.

**Ai gọi / gọi tiếp:** Được gọi bởi [listPurchaseOrders()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-210), [getPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-212). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `Product`, tại [dòng 406](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:406). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.find({
    _id: { $in: computedLines.map((line) => line.productId) },
  }).session(session).lean()
```

- Đọc nhiều bản ghi qua `Uom`, tại [dòng 409](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:409). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Uom.find({
    _id: { $in: products.map((product) => product.baseUomId) },
  }).session(session).lean()
```

**Ví dụ:** Tên sản phẩm cũ trên PO không mất chỉ vì hồ sơ hôm nay đổi tên.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function mapPreviewLines(computedLines, session = null) {
  const products = await Product.find({
    _id: { $in: computedLines.map((line) => line.productId) },
  }).session(session).lean();
  const uoms = await Uom.find({
    _id: { $in: products.map((product) => product.baseUomId) },
  }).session(session).lean();
  const productById = new Map(
    products.map((product) => [idString(product._id), product]),
  );
  const uomById = new Map(uoms.map((uom) => [idString(uom._id), uom]));
  return computedLines.map((line) => {
    const product = productById.get(line.productId);
    const uom = product ? uomById.get(idString(product.baseUomId)) : null;
    return {
      lineId: line.lineId,
      lineNo: line.lineNo,
      product: {
        id: line.productId,
        sku: line.productSkuSnapshot ?? product?.sku ?? null,
        name: line.productNameSnapshot ?? product?.name ?? null,
      },
      baseUom: product
        ? {
            id: idString(product.baseUomId),
            code: uom?.code ?? null,
            name: uom?.name ?? null,
          }
        : null,
      orderedQtyBase: line.orderedQtyBase,
      authorizedOrderedQtyBase: line.authorizedOrderedQtyBase ?? null,
      netPostedReceiptQtyBase: line.netPostedReceiptQtyBase ?? null,
      closedRemainderQtyBase: line.closedRemainderQtyBase ?? null,
      confirmedQtyBase: line.confirmedQtyBase,
      receivedQtyBase: line.receivedQtyBase,
      outstandingQtyBase: line.outstandingQtyBase,
      quantityState: line.quantityState,
    };
  });
}
```

</details>

<a id="fn-210"></a>

## listPurchaseOrders()

**Code:** [purchase-order.service.js:446](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:446).

**Tham số:** `listPurchaseOrders(user, query)`.

**Công việc:** Đọc danh sách PO, lọc và trình bày lượng đã đối soát.

**Xử lý theo thứ tự:**

1. Kiểm quyền và scopedWarehouseFilter, ghép supplier/status/mã/ngày.
2. Không lọc outstanding thì chia trang tại DB trước tính; có lọc thì đọc/tính tập phù hợp trước count/page.
3. computedDocuments, đọc gom supplier/warehouse/preview.
4. Trả mỗi PO tối đa 3 dòng xem trước cùng lineCount và outstandingStatus.

**Ai gọi / gọi tiếp:** Được gọi bởi [list()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-197). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295), [scopedWarehouseFilter()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-200), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [escapeRegex()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-309), [calendarDateRange()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-305), [computedDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-207), [mapPreviewLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-209), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-313).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `BusinessDocument`, tại [dòng 464](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:464). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.find(filter).sort({ createdAt: -1, _id: -1 })
```

- Đếm bản ghi qua `BusinessDocument`, tại [dòng 473](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:473). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.countDocuments(filter)
```

- Đọc nhiều bản ghi qua `Party`, tại [dòng 476](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:476). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Party.find({
      _id: {
        $in: pageItems
          .map((item) => item.document.header.supplierId)
          .filter(Boolean),
      },
    })
      .select("_id code name")
      .session(session).lean()
```

- Đọc nhiều bản ghi qua `Warehouse`, tại [dòng 485](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:485). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.find({
      _id: {
        $in: pageItems
          .map((item) => item.document.header.warehouseId)
          .filter(Boolean),
      },
    })
      .select("_id code name isActive")
      .session(session).lean()
```

**Kết quả / nhánh bị chặn:** Reader này không mở snapshot transaction; kết quả nhiều truy vấn là tình trạng quan sát, command sẽ kiểm lại.

**Ví dụ:** Trang đầu 10 đơn còn hàng phải nhận phải lọc lượng đúng trước đếm tổng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function listPurchaseOrders(user, query) {
  const session = null;
  requirePermission(user, "purchase_order:read", PO_READ_ROLES);
  const filter = {
    documentKind: "PO",
    ...scopedWarehouseFilter(user, query.warehouseId),
  };
  if (query.supplierId) {
    filter["header.supplierId"] = new mongoose.Types.ObjectId(
      idString(query.supplierId),
    );
  }
  if (query.status) filter.workflowStatus = query.status;
  if (query.search) {
    filter.documentNo = new RegExp(escapeRegex(query.search), "i");
  }
  const created = calendarDateRange(query.createdFrom, query.createdTo);
  if (created) filter.createdAt = created;
  const sourceQuery = BusinessDocument.find(filter).sort({ createdAt: -1, _id: -1 });
  if (!query.outstanding) sourceQuery.skip((query.page - 1) * query.limit).limit(query.limit);
  const documents = await sourceQuery.session(session).lean();
  let computed = await computedDocuments(documents);
  if (query.outstanding) {
    computed = computed.filter(
      (item) => item.outstandingStatus === query.outstanding,
    );
  }
  const total = query.outstanding ? computed.length : await BusinessDocument.countDocuments(filter);
  const pageItems = query.outstanding ? computed.slice((query.page - 1) * query.limit, query.page * query.limit) : computed;
  const [suppliers, warehouses, previews] = await Promise.all([
    Party.find({
      _id: {
        $in: pageItems
          .map((item) => item.document.header.supplierId)
          .filter(Boolean),
      },
    })
      .select("_id code name")
      .session(session).lean(),
    Warehouse.find({
      _id: {
        $in: pageItems
          .map((item) => item.document.header.warehouseId)
          .filter(Boolean),
      },
    })
      .select("_id code name isActive")
      .session(session).lean(),
    mapPreviewLines(pageItems.flatMap(item => item.lines.slice(0, 3))),
  ]);
  const supplierById = new Map(
    suppliers.map((supplier) => [idString(supplier._id), supplier]),
  );
  const warehouseById = new Map(
    warehouses.map((warehouse) => [idString(warehouse._id), warehouse]),
  );
  return {
    items: pageItems.map((item) => {
      const supplier = supplierById.get(
        idString(item.document.header.supplierId),
      );
      const warehouse = warehouseById.get(
        idString(item.document.header.warehouseId),
      );
      return {
        id: idString(item.document._id),
        documentNo: item.document.documentNo,
        workflowStatus: item.document.workflowStatus,
        version: item.document.version,
        supplier: supplier
          ? {
              id: idString(supplier._id),
              code: supplier.code,
              name: supplier.name,
            }
          : null,
        warehouse: warehouse
          ? {
              id: idString(warehouse._id),
              code: warehouse.code,
              name: warehouse.name,
              isActive: warehouse.isActive,
            }
          : null,
        expectedOn: isoDate(item.document.header.expectedOn),
        createdAt: isoDate(item.document.createdAt),
        lineCount: item.lines.length,
        outstandingStatus: item.outstandingStatus,
        linePreview: item.lines.slice(0, 3).map(l => previews.find(p => p.lineId === l.lineId)),
      };
    }),
    total,
    page: query.page,
    limit: query.limit,
  };
}
```

</details>

<a id="fn-211"></a>

## purchaseOrderQuantities()

**Code:** [purchase-order.service.js:543](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:543).

**Tham số:** `purchaseOrderQuantities(document, session = null)`.

**Công việc:** Cấp bộ tính lượng PO dùng chung cho các command.

**Xử lý theo thứ tự:**

1. Gọi computedDocuments với mảng chỉ một PO và session được truyền.
2. Trả lines, không có thì mảng rỗng.

**Ai gọi / gọi tiếp:** Được gọi bởi [supplierConfirmation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-191), [validateClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-193), [executeClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-195), [commitments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-220), [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258), [reconcilePurchasing()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-293). Gọi tiếp [computedDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-207).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `PurchaseEvent.find`, `DocumentLine.find`, `Party.findOne`, `BusinessDocument.find`, `LineLink.find`, `StockMovement.find`, `StockBalance.find`, `StockAccount.find`, `Location.find`, `Lot.find`, `PostingBatch.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Confirm kiểm nhận dùng cùng phép tính lượng như màn hình nhưng trong giao dịch command.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function purchaseOrderQuantities(document, session = null) {
  const [computed] = await computedDocuments([document], session);
  return computed?.lines ?? [];
}
```

</details>

<a id="fn-212"></a>

## getPurchaseOrder()

**Code:** [purchase-order.service.js:548](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:548).

**Tham số:** `getPurchaseOrder(user, id)`.

**Công việc:** Đọc chi tiết mọi dòng PO theo phạm vi đọc hiện tại.

**Xử lý theo thứ tự:**

1. Kiểm quyền, tìm PO theo mã.
2. Chủ/kế toán được đọc mọi kho; người khác kiểm assigned kho.
3. computedDocuments, đọc supplier/warehouse và map mọi dòng.

**Ai gọi / gọi tiếp:** Được gọi bởi [get()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-198). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [canReadAllPurchaseOrders()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-199), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298), [scopeError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-327), [computedDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-207), [mapPreviewLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-209), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-313).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `BusinessDocument`, tại [dòng 550](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:550). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.findOne({ _id: id, documentKind: "PO" }).lean()
```

- Đọc theo mã _id qua `Party`, tại [dòng 555](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:555). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Party.findById(document.header.supplierId).select("_id code name").lean()
```

- Đọc theo mã _id qua `Warehouse`, tại [dòng 556](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.service.js:556). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.findById(document.header.warehouseId).select("_id code name isActive").lean()
```

**Ví dụ:** Chi tiết không giới hạn 3 dòng như danh sách; không trả quyền ghi chỉ vì xem được.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getPurchaseOrder(user, id) {
  requirePermission(user, "purchase_order:read", PO_READ_ROLES);
  const document = await BusinessDocument.findOne({ _id: id, documentKind: "PO" }).lean();
  if (!document) throw notFoundError("Không tìm thấy đơn mua hàng");
  if (!canReadAllPurchaseOrders(user) && !canAccessWarehouse(user, document.header.warehouseId)) throw scopeError();
  const [computed] = await computedDocuments([document]);
  const [supplier, warehouse, lines] = await Promise.all([
    Party.findById(document.header.supplierId).select("_id code name").lean(),
    Warehouse.findById(document.header.warehouseId).select("_id code name isActive").lean(),
    mapPreviewLines(computed.lines),
  ]);
  return {
    id: idString(document._id), documentNo: document.documentNo,
    workflowStatus: document.workflowStatus, version: document.version,
    supplier: supplier ? { id: idString(supplier._id), code: supplier.code, name: supplier.name } : null,
    warehouse: warehouse ? { id: idString(warehouse._id), code: warehouse.code, name: warehouse.name, isActive: warehouse.isActive } : null,
    expectedOn: isoDate(document.header.expectedOn), createdAt: isoDate(document.createdAt),
    outstandingStatus: computed.outstandingStatus, lines,
  };
}
```

</details>

<a id="fn-213"></a>

## positiveInteger()

**Code:** [purchase-order.validation.js:7](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.validation.js:7).

**Tham số:** `positiveInteger(fallback, max = Number.MAX_SAFE_INTEGER)`.

**Công việc:** Tạo bộ kiểm tra số trang hoặc giới hạn là số nguyên dương.

**Xử lý theo thứ tự:**

1. Nhận giá trị mặc định và trần nếu có.
2. Yêu cầu chuỗi chỉ chứa chữ số và bắt đầu khác 0; đổi sang Number rồi kiểm nguyên, dương và trong giới hạn.
3. Đặt mặc định nếu chưa nhập.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Kết quả / nhánh bị chặn:** Bộ kiểm tra Zod; không đọc MongoDB.

**Ví dụ:** limit=20 hợp lệ; limit=-1 hoặc abc bị chặn trước service.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
positiveInteger = (fallback, max = Number.MAX_SAFE_INTEGER) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, "Phải là số nguyên dương")
    .transform(Number)
    .pipe(z.number().int().min(1).max(max))
    .default(fallback)
```

</details>

