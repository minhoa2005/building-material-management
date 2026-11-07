---
id: DOC-CODE-IT1-PO-RECEIVING-20261105
title: "Kiểm nhận, nhập, cất, sửa sai và chứng cứ — giải thích từng hàm"
version: 1.0.0
phase: Review
domain: Iteration1
tags: [backend, function, database]
last_updated: 2026-11-05
---

# Kiểm nhận, nhập, cất, sửa sai và chứng cứ — giải thích từng hàm

[Quay lại hướng dẫn đọc](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/README.md). Bản source ngày 05/11/2026; các đoạn lệnh dưới đây được lấy trực tiếp từ file hiện tại.

## Tìm nhanh

- [po-receiving.routes.js → optionalText()](#fn-214)
- [po-receiving.routes.js → paged()](#fn-215)
- [po-receiving.routes.js → query()](#fn-216)
- [po-receiving.routes.js → schema()](#fn-217)
- [po-receiving.routes.js → handle()](#fn-218)
- [po-receiving.service.js → activePo()](#fn-219)
- [po-receiving.service.js → commitments()](#fn-220)
- [po-receiving.service.js → prepare()](#fn-221)
- [po-receiving.service.js → writeRows()](#fn-222)
- [po-receiving.service.js → header()](#fn-223)
- [po-receiving.service.js → createInspection()](#fn-224)
- [po-receiving.service.js → updateInspection()](#fn-225)
- [po-receiving.service.js → confirmInspection()](#fn-226)
- [po-receiving.service.js → postReceipt()](#fn-227)
- [po-receiving.service.js → cancelDraft()](#fn-228)
- [po-receiving.service.js → changeDestinations()](#fn-229)
- [po-receiving.service.js → inspectionContext()](#fn-230)
- [po-receiving.service.js → receivingOperation()](#fn-231)
- [purchase-core.js → same()](#fn-232)
- [purchase-core.js → read()](#fn-233)
- [purchase-core.js → fail()](#fn-234)
- [purchase-core.js → version()](#fn-235)
- [purchase-core.js → rights()](#fn-236)
- [purchase-core.js → scoped()](#fn-237)
- [purchase-core.js → scopedPurchaseRead()](#fn-238)
- [purchase-core.js → rows()](#fn-239)
- [purchase-core.js → save()](#fn-240)
- [purchase-core.js → newDoc()](#fn-241)
- [purchase-core.js → link()](#fn-242)
- [purchase-core.js → lineLink()](#fn-243)
- [purchase-core.js → bump()](#fn-244)
- [purchase-core.js → serialize()](#fn-245)
- [purchase-core.js → operationKey()](#fn-246)
- [purchase-core.js → receipt()](#fn-247)
- [purchase-core.js → command()](#fn-248)
- [purchase-core.js → command.replay()](#fn-249)
- [purchase-core.js → location()](#fn-250)
- [purchase-core.js → guardLocations()](#fn-251)
- [purchase-core.js → balance()](#fn-252)
- [purchase-core.js → adjust()](#fn-253)
- [purchase-core.js → batch()](#fn-254)
- [purchase-core.js → evidenceFor()](#fn-255)
- [purchase-correction.service.js → preflight()](#fn-256)
- [purchase-correction.service.js → reversalPreflight()](#fn-257)
- [purchase-correction.service.js → reverseReceipt()](#fn-258)
- [purchase-correction.service.js → replaceInspection()](#fn-259)
- [purchase-evidence.service.js → evidenceStorage.upload()](#fn-260)
- [purchase-evidence.service.js → evidenceStorage.exists()](#fn-261)
- [purchase-evidence.service.js → evidenceStorage.destroy()](#fn-262)
- [purchase-evidence.service.js → evidenceStorage.download()](#fn-263)
- [purchase-evidence.service.js → parent()](#fn-264)
- [purchase-evidence.service.js → writableParent()](#fn-265)
- [purchase-evidence.service.js → inspectFile()](#fn-266)
- [purchase-evidence.service.js → uploadEvidence()](#fn-267)
- [purchase-evidence.service.js → attachEvidence()](#fn-268)
- [purchase-evidence.service.js → versionCheck()](#fn-269)
- [purchase-evidence.service.js → listEvidence()](#fn-270)
- [purchase-evidence.service.js → downloadEvidence()](#fn-271)
- [purchase-evidence.service.js → cleanupPurchaseEvidence()](#fn-272)
- [purchase-putaway.service.js → permit()](#fn-273)
- [purchase-putaway.service.js → placementQuantities()](#fn-274)
- [purchase-putaway.service.js → updatePlacement()](#fn-275)
- [purchase-putaway.service.js → source()](#fn-276)
- [purchase-putaway.service.js → putawayContext()](#fn-277)
- [purchase-putaway.service.js → createPutaway()](#fn-278)
- [purchase-putaway.service.js → taskState()](#fn-279)
- [purchase-putaway.service.js → getPutaway()](#fn-280)
- [purchase-putaway.service.js → confirmPutaway()](#fn-281)
- [purchase-putaway.service.js → cancelPutaway()](#fn-282)
- [purchase-read.service.js → readReceiving()](#fn-283)
- [purchase-read.service.js → capabilities()](#fn-284)
- [purchase-read.service.js → enriched()](#fn-285)
- [purchase-read.service.js → getDocument()](#fn-286)
- [purchase-read.service.js → warehouseFilter()](#fn-287)
- [purchase-read.service.js → listDocuments()](#fn-288)
- [purchase-read.service.js → receivingSummary()](#fn-289)
- [purchase-read.service.js → receivingTrips()](#fn-290)
- [purchase-read.service.js → receivingQueue()](#fn-291)
- [purchase-read.service.js → receivingHistory()](#fn-292)
- [purchase-reconciliation.js → reconcilePurchasing()](#fn-293)

<a id="fn-214"></a>

## optionalText()

**Code:** [po-receiving.routes.js:22](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:22).

**Tham số:** `optionalText(max)`.

**Công việc:** Tạo bộ kiểm tra chuỗi tùy chọn theo quy tắc riêng của file.

**Xử lý theo thứ tự:**

1. Nhận chiều dài tối đa; chuẩn hóa khoảng trắng và kiểm chiều dài.
2. Đọc code bên dưới để phân biệt file nào chấp nhận null, file nào đổi chuỗi rỗng thành null, file nào cấm rỗng.
3. Trả bộ kiểm tra để ghép vào schema.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Kết quả / nhánh bị chặn:** Schema; không cập nhật hồ sơ.

**Ví dụ:** Ở nhà cung cấp, số điện thoại để rỗng được đổi thành null; form sản phẩm có quy tắc rỗng khác, không dùng thay thế tùy ý.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
optionalText = max => z.string().trim().min(1).max(max).optional()
```

</details>

<a id="fn-215"></a>

## paged()

**Code:** [po-receiving.routes.js:28](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:28).

**Tham số:** `paged(fields)`.

**Công việc:** Ghép bộ lọc danh sách với giới hạn trang an toàn.

**Xử lý theo thứ tự:**

1. Ghép page/limit mặc định và fields riêng.
2. Strict cấm trường thừa, kiểm offset=(page−1)×limit là số nguyên an toàn.

**Ai gọi / gọi tiếp:** Được gọi bởi [query()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-216). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** page=2/limit 10 lấy trang sau, không nhận một offset lớn ngoài miền an toàn.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
paged = fields => z.object({ ...pagination, ...fields }).strict().refine(q => Number.isSafeInteger((q.page - 1) * q.limit))
```

</details>

<a id="fn-216"></a>

## query()

**Code:** [po-receiving.routes.js:29](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:29).

**Tham số:** `query(status)`.

**Công việc:** Tạo schema lọc list kiểm nhận hoặc GR theo trạng thái cho phép.

**Xử lý theo thứ tự:**

1. Gọi paged với purchaseOrderId, warehouseId và enum status được truyền.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Gọi tiếp [paged()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-215).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** List kiểm nhận nhận CONFIRMED, list GR dùng POSTED; không dùng tùy ý mọi status.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
query = status => paged({ purchaseOrderId: oid.optional(), warehouseId: oid.optional(), status: z.enum(status).optional() })
```

</details>

<a id="fn-217"></a>

## schema()

**Code:** [po-receiving.routes.js:30](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:30).

**Tham số:** `schema(body = empty, params = z.object({ id: oid }).strict(), query = empty)`.

**Công việc:** Ghép ba phần body/params/query thành bộ kiểm tra request.

**Xử lý theo thứ tự:**

1. Mặc định params có id ObjectId, body/query rỗng strict.
2. Bên khai báo route có thể thay từng phần phù hợp.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Route list không có id phải truyền params rỗng, route detail cần id hợp lệ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
schema = (body = empty, params = z.object({ id: oid }).strict(), query = empty) => z.object({ body, params, query })
```

</details>

<a id="fn-218"></a>

## handle()

**Code:** [po-receiving.routes.js:31](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:31).

**Tham số:** `handle(fn)`.

**Công việc:** Tạo controller mỏng dùng chung cho các route nhận mua.

**Xử lý theo thứ tự:**

1. catchAsync bọc một hàm request.
2. Gọi fn với req.user và req.validated, await kết quả.
3. formatApiResponse trả data.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Gọi tiếp [catchAsync()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-332), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** GET chi tiết và POST confirm có thể dùng chung kiểu bọc, nhưng fn service khác nhau quyết định tác động.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
handle = fn => catchAsync(async (req, res) => { const data = await fn(req.user, req.validated); formatApiResponse(res, { data }); })
```

</details>

<a id="fn-219"></a>

## activePo()

**Code:** [po-receiving.service.js:13](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:13).

**Tham số:** `activePo(user, poId, expected, session)`.

**Công việc:** Đọc PO còn nhận được hàng và đúng phiên bản.

**Xử lý theo thứ tự:**

1. scoped PO và version.
2. Chỉ OPEN/PARTIAL; đọc kho và supplier.
3. Kho phải active, Party phải là SUPPLIER; supplier không bắt còn ACTIVE ở nghĩa vụ cũ.

**Ai gọi / gọi tiếp:** Được gọi bởi [createInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-224), [updateInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-225), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259). Gọi tiếp [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `m.Warehouse`, tại [dòng 16](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:16). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Warehouse.findById(po.header.warehouseId)
```

- Đọc một bản ghi qua `m.Party`, tại [dòng 17](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:17). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Party.findOne({ _id: po.header.supplierId, kind: 'SUPPLIER' })
```

**Ví dụ:** Nhà cung cấp tạm dừng nhưng PO đã mở trước đó vẫn có thể thực nhận theo nguồn hợp lệ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function activePo(user, poId, expected, session) {
  const po = await scoped(user, poId, 'PO', session); version(po, expected);
  if (!['OPEN', 'PARTIAL'].includes(po.workflowStatus)) fail('STATE', 'PO không còn mở để nhận hàng');
  const wh = await read(m.Warehouse.findById(po.header.warehouseId), session);
  const supplier = await read(m.Party.findOne({ _id: po.header.supplierId, kind: 'SUPPLIER' }), session);
  if (!wh?.isActive || !supplier) fail('SOURCE', 'Kho/NCC nguồn không hợp lệ');
  return po;
}
```

</details>

<a id="fn-220"></a>

## commitments()

**Code:** [po-receiving.service.js:21](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:21).

**Tham số:** `commitments(po, session)`.

**Công việc:** Tính phần còn được chấp nhận sau các phiếu nhập nháp.

**Xử lý theo thứ tự:**

1. purchaseOrderQuantities tính outstanding từ lịch sử.
2. Đọc GR DRAFT của PO và các dòng.
3. Cộng qty theo poLineId; dòng không có nguồn hợp lệ làm kết quả thiếu căn cứ.
4. acceptanceHeadroom=outstanding−draft commitments; âm/unknown thì null.

**Ai gọi / gọi tiếp:** Được gọi bởi [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [inspectionContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-230), [receivingSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-289). Gọi tiếp [purchaseOrderQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-211), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 23](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:23). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find({ documentKind: 'GR_PURCHASE', 'header.purchaseOrderId': po._id, workflowStatus: 'DRAFT' })
```

- Đọc nhiều bản ghi qua `m.DocumentLine`, tại [dòng 24](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:24). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.find({ documentId: { $in: drafts.map(d => d._id) } })
```

**Ví dụ:** PO 100 đã post 40, nháp 35: outstanding 60 nhưng còn nhận thêm 25.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function commitments(po, session) {
  const computed = await purchaseOrderQuantities(po, session);
  const drafts = await read(m.BusinessDocument.find({ documentKind: 'GR_PURCHASE', 'header.purchaseOrderId': po._id, workflowStatus: 'DRAFT' }), session);
  const draftRows = await read(m.DocumentLine.find({ documentId: { $in: drafts.map(d => d._id) } }), session);
  const held = new Map(computed.map(r => [r.lineId, exact('0')]));
  let invalid = false;
  for (const r of draftRows) {
    const key = id(r.details?.poLineId);
    if (!held.has(key)) { invalid = true; continue; }
    held.set(key, held.get(key).plus(exact(r.qtyBase)));
  }
  return computed.map(r => {
    const amount = held.get(r.lineId);
    const headroom = r.quantityState === 'KNOWN' && r.outstandingQtyBase != null ? exact(r.outstandingQtyBase).minus(amount) : null;
    return { ...r, openDraftCommitmentQtyBase: invalid ? null : amount.toString(), acceptanceHeadroomQtyBase: invalid || !headroom || headroom.isNegative() ? null : headroom.toString() };
  });
}
```

</details>

<a id="fn-221"></a>

## prepare()

**Code:** [po-receiving.service.js:38](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:38).

**Tham số:** `prepare(user, po, input, session)`.

**Công việc:** Kiểm và chụp các dòng nhận theo quy đổi PO.

**Xử lý theo thứ tự:**

1. Đọc dòng PO và cấm clientLineKey trùng.
2. Mỗi dòng kiểm nguồn, Product active, Lot thuộc Product; enteredQty×conversionSnapshot của PO đúng chính xác/nguyên viên.
3. Kiểm plannedReceiptLocationId là RECEIVING cùng kho; đọc conversion/Uom để chụp nhãn.
4. Nếu có scheduleId thì đọc SUPPLIER_CONFIRMATION đúng PO.
5. Trả dữ liệu dòng chuẩn bị, quality nội bộ GOOD.

**Ai gọi / gọi tiếp:** Được gọi bởi [createInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-224), [updateInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-225), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259). Gọi tiếp [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [multiplyBaseQuantity()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-308), [location()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-250).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `m.Product`, tại [dòng 46](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:46). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Product.findById(source.productId)
```

- Đọc theo mã _id qua `m.Lot`, tại [dòng 47](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:47). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Lot.findById(r.lotId)
```

- Đọc theo mã _id qua `m.ProductUomVersion`, tại [dòng 52](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:52). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ProductUomVersion.findById(source.conversionId)
```

- Đọc theo mã _id qua `m.Uom`, tại [dòng 53](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:53). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Uom.findById(conv.uomId)
```

- Đọc một bản ghi qua `m.PurchaseEvent`, tại [dòng 61](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:61). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvent.findOne({ _id: input.scheduleId, purchaseOrderId: po._id, kind: 'SUPPLIER_CONFIRMATION' })
```

**Ví dụ:** PO theo thùng 4; nhập 10 nghĩa 40 viên. Lô UNKNOWN hiện vẫn qua nếu đúng product, chưa yêu cầu VERIFIED tại đây.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function prepare(user, po, input, session) {
  const sources = new Map((await rows(po._id, session)).map(r => [id(r._id), r]));
  const seen = new Set(); const result = [];
  for (const [i, r] of input.lines.entries()) {
    if (seen.has(r.clientLineKey)) throw validationError('Mã dòng bị trùng', [{ field: 'lines.' + i + '.clientLineKey', message: 'Trùng mã dòng' }]);
    seen.add(r.clientLineKey);
    const source = sources.get(id(r.poLineId));
    if (!source) throw validationError('Dòng không thuộc PO');
    const product = await read(m.Product.findById(source.productId), session);
    const lot = await read(m.Lot.findById(r.lotId), session);
    if (!product?.isActive || !lot || !same(lot.productId, product._id)) throw validationError('Sản phẩm/lô không hợp lệ');
    const qty = multiplyBaseQuantity(r.enteredQty, source.conversionSnapshot.toString());
    if (!qty.valid || (product.wholeBaseUnits && !qty.value.isInteger())) throw validationError('Lượng nhập không hợp lệ');
    await location(user, r.plannedReceiptLocationId, po.header.warehouseId, ['RECEIVING'], session);
    const conv = await read(m.ProductUomVersion.findById(source.conversionId), session);
    const uom = conv && await read(m.Uom.findById(conv.uomId), session);
    result.push({ source, productId: source.productId, lotId: lot._id, conversionId: source.conversionId, conversionSnapshot: source.conversionSnapshot,
      enteredQty: r.enteredQty, qtyBase: qty.string, productNameSnapshot: source.productNameSnapshot,
      productSkuSnapshot: source.productSkuSnapshot ?? product.sku, enteredUomCodeSnapshot: source.enteredUomCodeSnapshot ?? uom?.code,
      lotLabelSnapshot: [lot.manufacturerLot, lot.tone, lot.calibre].filter(Boolean).join(' / '),
      details: { clientLineKey: r.clientLineKey, poLineId: source._id, qualityCode: 'GOOD', plannedReceiptLocationId: r.plannedReceiptLocationId, ...(r.handlingNote && { handlingNote: r.handlingNote }) } });
  }
  if (input.scheduleId) {
    const schedule = await read(m.PurchaseEvent.findOne({ _id: input.scheduleId, purchaseOrderId: po._id, kind: 'SUPPLIER_CONFIRMATION' }), session);
    if (!schedule) throw validationError('Lịch giao không thuộc PO');
  }
  return result;
}
```

</details>

<a id="fn-222"></a>

## writeRows()

**Code:** [po-receiving.service.js:66](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:66).

**Tham số:** `writeRows(documentId, prepared, session, previous = [])`.

**Công việc:** Thêm/sửa/xóa dòng nháp kiểm nhận theo khóa dòng ổn định.

**Xử lý theo thứ tự:**

1. Dòng cũ không còn key: xóa LineLink đích và DocumentLine.
2. Dời lineNo của dòng giữ ra vùng tạm để tránh unique khi đổi thứ tự.
3. Cùng key phải giữ poLineId; update dòng và linkedQty, dòng mới thì save + link.
4. lockLotIdentity sau khi ghi tham chiếu trong cùng session.

**Ai gọi / gọi tiếp:** Được gọi bởi [createInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-224), [updateInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-225), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259). Gọi tiếp [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [lineLink()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-243), [lockLotIdentity()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-317).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Xóa các bản ghi khớp qua `m.LineLink`, tại [dòng 69](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:69). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.LineLink.deleteMany({ targetLineId: old._id }, { session })
```

- Xóa một bản ghi qua `m.DocumentLine`, tại [dòng 70](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:70). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.deleteOne({ _id: old._id, documentId }, { session })
```

- Cập nhật một bản ghi qua `Line`, tại [dòng 74](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:74). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Line.updateOne({ _id: old._id }, { $set: { lineNo: old.lineNo + 1000 } }, { session })
```

- Cập nhật một bản ghi qua `Line`, tại [dòng 81](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:81). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Line.updateOne({ _id: old._id, documentId }, { $set: values }, { session, runValidators: true })
```

- Cập nhật một bản ghi qua `m.LineLink`, tại [dòng 82](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:82). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.LineLink.updateOne({ sourceLineId: source._id, targetLineId: old._id, relationCode: 'SOURCE' }, { $set: { linkedQty: fields.qtyBase } }, { session })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.DocumentLine`:

```js
save(m.DocumentLine, values, session)
```

- `lineLink` → `LineLink`:

```js
lineLink(source._id, line._id, fields.qtyBase, session)
```

- `lockLotIdentity` → `Lot`:

```js
lockLotIdentity(fields.lotId, session)
```

**Kết quả / nhánh bị chặn:** Điểm cần chú ý từ code: xóa dòng nháp không kiểm Evidence đã gắn theo lineId. Nếu dòng đã có chứng cứ rồi bị bỏ, Evidence có thể còn trỏ tới dòng đã mất; kiểm lúc attach chỉ bảo vệ trường hợp gắn sau khi dòng bị xóa.

**Ví dụ:** Đổi thứ tự hai lô không tạo mã dòng/link mới; bỏ rồi thêm key mới là dòng mới.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function writeRows(documentId, prepared, session, previous = []) {
  const keys = new Set(prepared.map(r => r.details.clientLineKey));
  for (const old of previous.filter(r => !keys.has(r.details.clientLineKey))) {
    await m.LineLink.deleteMany({ targetLineId: old._id }, { session });
    await m.DocumentLine.deleteOne({ _id: old._id, documentId }, { session });
  }
  // Move existing line numbers out of the way before reordering (unique document/lineNo).
  const Line = m.DocumentLine.discriminators.DocumentLine_PO_INSPECTION;
  for (const old of previous.filter(r => keys.has(r.details.clientLineKey))) await Line.updateOne({ _id: old._id }, { $set: { lineNo: old.lineNo + 1000 } }, { session });
  for (const [i, r] of prepared.entries()) {
    const { source, ...fields } = r;
    const old = previous.find(p => p.details.clientLineKey === fields.details.clientLineKey);
    const values = { ...fields, documentId, lineNo: i + 1, lineKind: 'PO_INSPECTION' };
    if (old) {
      if (!same(old.details.poLineId, source._id)) throw validationError('Không đổi nguồn của dòng đã lưu; thêm dòng mới');
      await Line.updateOne({ _id: old._id, documentId }, { $set: values }, { session, runValidators: true });
      await m.LineLink.updateOne({ sourceLineId: source._id, targetLineId: old._id, relationCode: 'SOURCE' }, { $set: { linkedQty: fields.qtyBase } }, { session });
    } else {
      const line = await save(m.DocumentLine, values, session);
      await lineLink(source._id, line._id, fields.qtyBase, session);
    }
    await lockLotIdentity(fields.lotId, session);
  }
}
```

</details>

<a id="fn-223"></a>

## header()

**Code:** [po-receiving.service.js:90](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:90).

**Tham số:** `header(po, input, creationKey)`.

**Công việc:** Chuẩn bị phần chung PO_INSPECTION từ PO và form.

**Xử lý theo thứ tự:**

1. Lấy PO/kho/supplier/sourcePoVersion từ server.
2. Giữ creationKey, arrivedAt và các trường giao nhận/lịch có giá trị.
3. Không tự lưu hồ sơ.

**Ai gọi / gọi tiếp:** Được gọi bởi [createInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-224), [updateInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-225), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Anh Bình giao cho supplierN: supplierId vẫn từPO, delivererName là anhBình.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function header(po, input, creationKey) {
  return { purchaseOrderId: po._id, warehouseId: po.header.warehouseId, supplierId: po.header.supplierId, sourcePoVersion: po.version, creationKey,
    arrivedAt: new Date(input.arrivedAt), ...(input.deliveryReference && { deliveryReference: input.deliveryReference }), ...(input.delivererName && { delivererName: input.delivererName }),
    ...(input.delivererContact && { delivererContact: input.delivererContact }), ...(input.scheduleId && { scheduleId: input.scheduleId }) };
}
```

</details>

<a id="fn-224"></a>

## createInspection()

**Code:** [po-receiving.service.js:95](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:95).

**Tham số:** `createInspection(user, poId, input)`.

**Công việc:** Lưu một đợt kiểm nhận nháp của PO.

**Xử lý theo thứ tự:**

1. rights create rồi command.
2. activePo, prepare, newDoc PO_INSPECTION DRAFT.
3. writeRows và link PO→inspection; trả document để command lưu kết quả.

**Đường dẫn gọi tới hàm này:** `POST /api/purchase-orders/:id/inspections` ([route dòng 56](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:56)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [activePo()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-219), [prepare()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-221), [newDoc()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-241), [header()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-223), [writeRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-222), [link()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-242).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `newDoc` → `BusinessDocument`:

```js
newDoc('PO_INSPECTION', header(po, input, input.creationKey), user, session)
```

- `link` → `DocumentLink`:

```js
link(po, d, 'PO_INSPECTION', session)
```

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.BusinessOperation.findOne`, `m.BusinessDocument.findOne`, `Model.save`, `AuditEvent.save`, `m.Warehouse.findById`, `m.Party.findOne`, `m.Product.findById`, `m.Lot.findById`, `m.ProductUomVersion.findById`, `m.Uom.findById`, `m.PurchaseEvent.findOne`, `m.DocumentLine.find`, `m.Location.findById`, `m.LineLink.deleteMany`, `m.DocumentLine.deleteOne`, `Line.updateOne`, `m.LineLink.updateOne`, `Lot.updateOne`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Lưu đợt nhận 70 chưa tăng tồn và chưa giữ 70 trong GR draft.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function createInspection(user, poId, input) {
  rights(user, 'create');
  return command(user, 'CREATE_PO_INSPECTION', poId, input, async session => {
    const po = await activePo(user, poId, input.expectedPoVersion, session);
    const prepared = await prepare(user, po, input, session);
    const d = await newDoc('PO_INSPECTION', header(po, input, input.creationKey), user, session);
    await writeRows(d._id, prepared, session); await link(po, d, 'PO_INSPECTION', session);
    return { document: d };
  });
}
```

</details>

<a id="fn-225"></a>

## updateInspection()

**Code:** [po-receiving.service.js:105](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:105).

**Tham số:** `updateInspection(user, inspectionId, input)`.

**Công việc:** Sửa kiểm nhận DRAFT theo phiên bản và nguồn PO hiện tại.

**Xử lý theo thứ tự:**

1. rights update/command, scoped inspection và version/status DRAFT.
2. activePo rồi prepare.
3. bump header giữ creationKey và các refs correction nếu có.
4. writeRows với các dòng cũ để giữ định danh.

**Đường dẫn gọi tới hàm này:** `PUT /api/po-inspections/:id` ([route dòng 39](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:39)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [activePo()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-219), [prepare()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-221), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244), [header()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-223), [writeRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-222), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `bump` → `BusinessDocument`:

```js
bump(d, session, { header: { ...header(po, input, d.header.creationKey), ...Object.fromEntries(['rootInspectionId', 'replacesInspectionId', 'correctionId'].filter(k => d.header[k]).map(k => [k, d.header[k]])) } })
```

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.BusinessOperation.findOne`, `m.BusinessDocument.findOne`, `Model.save`, `AuditEvent.save`, `m.Warehouse.findById`, `m.Party.findOne`, `m.Product.findById`, `m.Lot.findById`, `m.ProductUomVersion.findById`, `m.Uom.findById`, `m.PurchaseEvent.findOne`, `m.DocumentLine.find`, `m.Location.findById`, `m.BusinessDocument.findOneAndUpdate`, `m.LineLink.deleteMany`, `m.DocumentLine.deleteOne`, `Line.updateOne`, `m.LineLink.updateOne`, `Lot.updateOne`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** PO vừa có amendment thì lưu lại nháp trên phiên bảnPO mới trước confirm.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function updateInspection(user, inspectionId, input) {
  rights(user, 'update');
  return command(user, 'UPDATE_PO_INSPECTION', inspectionId, input, async session => {
    const d = await scoped(user, inspectionId, 'PO_INSPECTION', session); version(d, input.expectedVersion);
    if (d.workflowStatus !== 'DRAFT') fail('STATE', 'Chỉ sửa phiếu đang nháp');
    const po = await activePo(user, d.header.purchaseOrderId, input.expectedPoVersion, session);
    const prepared = await prepare(user, po, input, session);
    const next = await bump(d, session, { header: { ...header(po, input, d.header.creationKey), ...Object.fromEntries(['rootInspectionId', 'replacesInspectionId', 'correctionId'].filter(k => d.header[k]).map(k => [k, d.header[k]])) } });
    await writeRows(d._id, prepared, session, await rows(d._id, session));
    return { document: next };
  });
}
```

</details>

<a id="fn-226"></a>

## confirmInspection()

**Code:** [po-receiving.service.js:117](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:117).

**Tham số:** `confirmInspection(user, inspectionId, input)`.

**Công việc:** Chốt kết quả nhận và sinh một phiếu nhập nháp, chưa ghi tồn.

**Xử lý theo thứ tự:**

1. rights update, command, kiểm inspection DRAFT/version và activePo.
2. sourcePoVersion phải khớp; cần dòng dương, prepare lại.
3. commitments đủ căn cứ; trừ dồn mỗi dòng vào headroom, âm thì lỗi.
4. bump PO; newDoc GR DRAFT + links; copy đầy đủ dòng sang PURCHASE_RECEIPT và link inspection→GR.
5. bump inspection CONFIRMED cùng inspectedBy/At.

**Đường dẫn gọi tới hàm này:** `POST /api/po-inspections/:id/confirm` ([route dòng 40](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:40)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [activePo()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-219), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [prepare()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-221), [commitments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-220), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244), [newDoc()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-241), [link()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-242), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [lineLink()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-243).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `bump` → `BusinessDocument`:

```js
bump(po, session)
```

- `newDoc` → `BusinessDocument`:

```js
newDoc('GR_PURCHASE', { warehouseId: po.header.warehouseId, purchaseOrderId: po._id, poInspectionId: d._id, supplierId: po.header.supplierId, delivererName: d.header.delivererName, delivererContact: d.header.delivererContact }, user, session)
```

- `link` → `DocumentLink`:

```js
link(po, gr, 'PO_RECEIPT', session)
```

- `link` → `DocumentLink`:

```js
link(d, gr, 'INSPECTION_RECEIPT', session)
```

- `save` → `m.DocumentLine`:

```js
save(m.DocumentLine, { documentId: gr._id, lineNo: i + 1, lineKind: 'PURCHASE_RECEIPT', productId: r.productId, lotId: r.lotId, conversionId: r.conversionId, conversionSnapshot: r.conversionSnapshot,
        enteredQty: r.enteredQty, qtyBase: r.qtyBase, productNameSnapshot: r.productNameSnapshot, productSkuSnapshot: r.productSkuSnapshot, enteredUomCodeSnapshot: r.enteredUomCodeSnapshot, lotLabelSnapshot: r.lotLabelSnapshot,
        details: { poLineId: r.details.poLineId, inspectionLineId: r._id, qualityCode: 'GOOD', receivingLocationId: r.details.plannedReceiptLocationId } }, session)
```

- `lineLink` → `LineLink`:

```js
lineLink(r._id, line._id, r.qtyBase, session)
```

- `bump` → `BusinessDocument`:

```js
bump(d, session, { workflowStatus: 'CONFIRMED', 'header.inspectedBy': user._id, 'header.inspectedAt': new Date() })
```

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.BusinessOperation.findOne`, `m.BusinessDocument.findOne`, `Model.save`, `AuditEvent.save`, `m.Warehouse.findById`, `m.Party.findOne`, `m.DocumentLine.find`, `m.Product.findById`, `m.Lot.findById`, `m.ProductUomVersion.findById`, `m.Uom.findById`, `m.PurchaseEvent.findOne`, `m.Location.findById`, `m.BusinessDocument.find`, `PurchaseEvent.find`, `DocumentLine.find`, `Party.findOne`, `BusinessDocument.find`, `LineLink.find`, `StockMovement.find`, `StockBalance.find`, `StockAccount.find`, `Location.find`, `Lot.find`, `PostingBatch.find`, `m.BusinessDocument.findOneAndUpdate`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Chốt 70/PO 100 giữ 70 cho GR draft, chỉ còn thêm 30; movement/balance chưa tăng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function confirmInspection(user, inspectionId, input) {
  rights(user, 'update');
  return command(user, 'CONFIRM_PO_INSPECTION', inspectionId, input, async session => {
    const d = await scoped(user, inspectionId, 'PO_INSPECTION', session); version(d, input.expectedVersion);
    if (d.workflowStatus !== 'DRAFT') fail('STATE', 'Phiếu không còn nháp');
    const po = await activePo(user, d.header.purchaseOrderId, input.expectedPoVersion, session);
    if (d.header.sourcePoVersion !== po.version) fail('VERSION', 'PO đã đổi; lưu lại nháp trên phiên bản mới trước khi chốt');
    const stored = await rows(d._id, session);
    if (!stored.length) throw validationError('Cần ít nhất một dòng nhận lượng dương');
    await prepare(user, po, { lines: stored.map(r => ({ ...r.details, lotId: id(r.lotId), enteredQty: r.enteredQty.toString() })), scheduleId: d.header.scheduleId }, session);
    const q = await commitments(po, session);
    if (q.some(r => r.acceptanceHeadroomQtyBase == null)) fail('SOURCE', 'PO thiếu căn cứ lượng nhận');
    const free = new Map(q.map(r => [r.lineId, exact(r.acceptanceHeadroomQtyBase)]));
    for (const r of stored) {
      const left = free.get(id(r.details.poLineId))?.minus(exact(r.qtyBase));
      if (!left || left.isNegative()) fail('HEADROOM', 'Lượng nhập vượt phần PO còn được nhận', { quantities: q }, [{ clientLineKey: r.details.clientLineKey, message: 'Vượt headroom' }]);
      free.set(id(r.details.poLineId), left);
    }
    await bump(po, session);
    const gr = await newDoc('GR_PURCHASE', { warehouseId: po.header.warehouseId, purchaseOrderId: po._id, poInspectionId: d._id, supplierId: po.header.supplierId, delivererName: d.header.delivererName, delivererContact: d.header.delivererContact }, user, session);
    await link(po, gr, 'PO_RECEIPT', session); await link(d, gr, 'INSPECTION_RECEIPT', session);
    for (const [i, r] of stored.entries()) {
      const line = await save(m.DocumentLine, { documentId: gr._id, lineNo: i + 1, lineKind: 'PURCHASE_RECEIPT', productId: r.productId, lotId: r.lotId, conversionId: r.conversionId, conversionSnapshot: r.conversionSnapshot,
        enteredQty: r.enteredQty, qtyBase: r.qtyBase, productNameSnapshot: r.productNameSnapshot, productSkuSnapshot: r.productSkuSnapshot, enteredUomCodeSnapshot: r.enteredUomCodeSnapshot, lotLabelSnapshot: r.lotLabelSnapshot,
        details: { poLineId: r.details.poLineId, inspectionLineId: r._id, qualityCode: 'GOOD', receivingLocationId: r.details.plannedReceiptLocationId } }, session);
      await lineLink(r._id, line._id, r.qtyBase, session);
    }
    return { document: await bump(d, session, { workflowStatus: 'CONFIRMED', 'header.inspectedBy': user._id, 'header.inspectedAt': new Date() }), goodsReceiptId: gr._id };
  });
}
```

</details>

<a id="fn-227"></a>

## postReceipt()

**Code:** [po-receiving.service.js:147](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:147).

**Tham số:** `postReceipt(user, receiptId, input)`.

**Công việc:** Ghi sổ GR để tăng tồn cửa hàng tại khu nhận.

**Xử lý theo thứ tự:**

1. Kiểm quyền/post, GR DRAFT/version, inspection CONFIRMED và PO OPEN/PARTIAL/version.
2. Đối chiếu nguồn header và đủ dòng/product/lot/qty/GOOD; kiểm lại đích/sản phẩm/lô.
3. commitments đủ trần; guardLocations; đọc STORE; tạo batch.
4. balance đích, kiểm hold, adjust(+q), save movement vào kho và ReceiptPlacement từng dòng.
5. bump PO PARTIAL/COMPLETED và GR POSTED trong cùng command transaction.

**Đường dẫn gọi tới hàm này:** `POST /api/purchase-receipts/:id/post` ([route dòng 50](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:50)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [activePo()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-219), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [location()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-250), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [commitments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-220), [guardLocations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-251), [batch()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-254), [balance()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-252), [adjust()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-253), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `m.Product`, tại [dòng 163](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:163). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Product.findById(r.productId)
```

- Đọc theo mã _id qua `m.Lot`, tại [dòng 164](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:164). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Lot.findById(r.lotId)
```

- Đọc một bản ghi qua `m.Party`, tại [dòng 172](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:172). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Party.findOne({ kind: 'STORE' })
```

- Kiểm có bản ghi hay không qua `m.DefectHold`, tại [dòng 176](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:176). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DefectHold.exists({ balanceId: target._id, status: 'ACTIVE' }).session(session)
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `batch` → `PostingBatch`:

```js
batch(gr, user, key, hash, session)
```

- `adjust` → `StockBalance`:

```js
adjust(target, exact(r.qtyBase), session)
```

- `save` → `m.StockMovement`:

```js
save(m.StockMovement, { batchId: posting._id, documentId: gr._id, lineId: r._id, toBalanceId: target._id, qtyBase: r.qtyBase, toBefore: numbers.before, toAfter: numbers.after }, session)
```

- `save` → `m.ReceiptPlacement`:

```js
save(m.ReceiptPlacement, { purchaseOrderId: po._id, receiptId: gr._id, receiptLineId: r._id, sourceBalanceId: target._id, receivedQtyBase: r.qtyBase }, session)
```

- `bump` → `BusinessDocument`:

```js
bump(po, session, { workflowStatus: [...received.values()].every(q => q.isZero()) ? 'COMPLETED' : 'PARTIAL' })
```

- `bump` → `BusinessDocument`:

```js
bump(gr, session, { workflowStatus: 'POSTED' })
```

**Kết quả / nhánh bị chặn:** Hàm chọn COMPLETED khi mọi outstanding sau nhập bằng0, kể cả trước đó đã chốt một phần thiếu. executeClose lại chọn CLOSED khi chính bước chốt làm outstanding bằng0; vì vậy trạng thái cuối có thể phụ thuộc thứ tự hai nghiệp vụ. Lượng ròng/chốt thiếu vẫn cần đọc riêng.

**Ví dụ:** Nhập 70: R 1 STORE/GOOD tăng 70, PO còn 30; không tăng custody supplier.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function postReceipt(user, receiptId, input) {
  rights(user, 'post');
  return command(user, 'POST_PURCHASE_RECEIPT', receiptId, input, async (session, key, hash) => {
    const gr = await scoped(user, receiptId, 'GR_PURCHASE', session); version(gr, input.expectedVersion);
    if (gr.workflowStatus !== 'DRAFT') fail('STATE', 'GR không còn nháp');
    const inspection = await scoped(user, gr.header.poInspectionId, 'PO_INSPECTION', session);
    const po = await activePo(user, gr.header.purchaseOrderId, input.expectedPoVersion, session);
    if (inspection.workflowStatus !== 'CONFIRMED' || !same(inspection.header.purchaseOrderId, po._id) || !same(gr.header.supplierId, po.header.supplierId) || !same(gr.header.warehouseId, po.header.warehouseId) || !same(inspection.header.warehouseId, po.header.warehouseId) || !same(inspection.header.supplierId, po.header.supplierId)) fail('SOURCE', 'Nguồn GR không khớp');
    const lines = await rows(gr._id, session); const inspected = await rows(inspection._id, session);
    if (!lines.length || lines.length !== inspected.length) fail('SOURCE', 'GR phải bao phủ đúng lượng đã chốt');
    const seen = new Set();
    for (const r of lines) {
      const source = inspected.find(s => same(s._id, r.details.inspectionLineId));
      if (!source || seen.has(id(source._id)) || !same(source.details.poLineId, r.details.poLineId) || !same(source.productId, r.productId) || !same(source.lotId, r.lotId) || !exact(source.qtyBase).eq(exact(r.qtyBase)) || r.details.qualityCode !== 'GOOD') fail('SOURCE', 'Dòng GR không khớp hồ sơ nhận');
      seen.add(id(source._id));
      await location(user, r.details.receivingLocationId, po.header.warehouseId, ['RECEIVING'], session);
      const product = await read(m.Product.findById(r.productId), session);
      const lot = await read(m.Lot.findById(r.lotId), session);
      if (!product?.isActive || !lot || !same(lot.productId, product._id)) fail('SOURCE', 'Sản phẩm/lô không hợp lệ');
    }
    const q = await commitments(po, session);
    if (q.some(r => r.acceptanceHeadroomQtyBase == null)) fail('HEADROOM', 'PO có cam kết vượt nguồn hoặc thiếu căn cứ');
    const received = new Map(q.map(r => [r.lineId, exact(r.outstandingQtyBase)]));
    for (const r of lines) received.set(id(r.details.poLineId), received.get(id(r.details.poLineId)).minus(exact(r.qtyBase)));
    await guardLocations(lines.map(r => r.details.receivingLocationId), session);
    const store = await read(m.Party.findOne({ kind: 'STORE' }), session); if (!store) fail('SOURCE', 'Thiếu STORE');
    const posting = await batch(gr, user, key, hash, session);
    for (const r of lines) {
      const target = await balance(r.details.receivingLocationId, r.lotId, store._id, 'GOOD', session);
      if (await m.DefectHold.exists({ balanceId: target._id, status: 'ACTIVE' }).session(session)) fail('HOLD', 'Balance đích đang bị giữ do lỗi');
      const numbers = await adjust(target, exact(r.qtyBase), session);
      await save(m.StockMovement, { batchId: posting._id, documentId: gr._id, lineId: r._id, toBalanceId: target._id, qtyBase: r.qtyBase, toBefore: numbers.before, toAfter: numbers.after }, session);
      await save(m.ReceiptPlacement, { purchaseOrderId: po._id, receiptId: gr._id, receiptLineId: r._id, sourceBalanceId: target._id, receivedQtyBase: r.qtyBase }, session);
    }
    await bump(po, session, { workflowStatus: [...received.values()].every(q => q.isZero()) ? 'COMPLETED' : 'PARTIAL' });
    return { document: await bump(gr, session, { workflowStatus: 'POSTED' }), goodsReceiptId: gr._id, postingBatchId: posting._id };
  });
}
```

</details>

<a id="fn-228"></a>

## cancelDraft()

**Code:** [po-receiving.service.js:185](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:185).

**Tham số:** `cancelDraft(user, documentId, kind, input)`.

**Công việc:** Hủy kiểm nhận hoặc GR nháp, không đảo tồn.

**Xử lý theo thứ tự:**

1. rights update, command, scoped đúng loại/version và chỉ DRAFT.
2. Nếu GR: kiểm PO.version và bump PO để giải phóng phần dự kiến đang giữ.
3. bump document CANCELLED, command lưu lý do/audit.

**Đường dẫn gọi tới hàm này:** `POST /api/po-inspections/:id/cancel` ([route dòng 35](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:35)); `POST /api/purchase-receipts/:id/cancel` ([route dòng 42](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:42)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `bump` → `BusinessDocument`:

```js
bump(po, session)
```

- `bump` → `BusinessDocument`:

```js
bump(d, session, { workflowStatus: 'CANCELLED' })
```

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.BusinessOperation.findOne`, `m.BusinessDocument.findOne`, `Model.save`, `AuditEvent.save`, `m.BusinessDocument.findOneAndUpdate`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Hủy GR 70 nháp trả lại headroom 70; không có movement nên không trừ kho.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function cancelDraft(user, documentId, kind, input) {
  rights(user, 'update');
  return command(user, kind === 'GR_PURCHASE' ? 'CANCEL_PURCHASE_RECEIPT' : 'CANCEL_PO_INSPECTION', documentId, input, async session => {
    const d = await scoped(user, documentId, kind, session); version(d, input.expectedVersion);
    if (d.workflowStatus !== 'DRAFT') fail('STATE', 'Chỉ hủy phiếu nháp');
    if (kind === 'GR_PURCHASE') { const po = await scoped(user, d.header.purchaseOrderId, 'PO', session); version(po, input.expectedPoVersion); await bump(po, session); }
    return { document: await bump(d, session, { workflowStatus: 'CANCELLED' }) };
  });
}
```

</details>

<a id="fn-229"></a>

## changeDestinations()

**Code:** [po-receiving.service.js:194](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:194).

**Tham số:** `changeDestinations(user, documentId, input)`.

**Công việc:** Đổi các khu nhận trên GR còn nháp.

**Xử lý theo thứ tự:**

1. Kiểm quyền, GR DRAFT/version.
2. Đọc dòng; mỗi dòng gửi phải thuộc GR và không trùng, location mới RECEIVING cùng kho.
3. Update typed PURCHASE_RECEIPT.receivingLocationId, appendAudit trước/sau từng dòng.
4. bump GR.

**Đường dẫn gọi tới hàm này:** `PATCH /api/purchase-receipts/:id/destinations` ([route dòng 43](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:43)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [location()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-250), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Cập nhật một bản ghi qua `m.DocumentLine.discriminators.DocumentLine_PURCHASE_RECEIPT`, tại [dòng 204](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:204). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.discriminators.DocumentLine_PURCHASE_RECEIPT.updateOne({ _id: old._id }, { $set: { 'details.receivingLocationId': r.receivingLocationId } }, { session, runValidators: true })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({ documentId: gr._id, actorId: user._id, action: 'GR_DESTINATION', changes: [{ path: 'lines.' + id(old._id) + '.receivingLocationId', before: id(old.details.receivingLocationId), after: r.receivingLocationId }], session })
```

- `bump` → `BusinessDocument`:

```js
bump(gr, session)
```

**Ví dụ:** Đổi R 1 sangR 2 không cho đổi lô hoặc lượng 70 thành 80.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function changeDestinations(user, documentId, input) {
  rights(user, 'update');
  return command(user, 'CHANGE_GR_DESTINATIONS', documentId, input, async session => {
    const gr = await scoped(user, documentId, 'GR_PURCHASE', session); version(gr, input.expectedVersion);
    if (gr.workflowStatus !== 'DRAFT') fail('STATE', 'Chỉ đổi đích GR nháp');
    const lines = await rows(gr._id, session); const seen = new Set();
    for (const r of input.lines) {
      if (seen.has(r.lineId)) throw validationError('Dòng đổi đích bị trùng'); seen.add(r.lineId);
      const old = lines.find(l => same(l._id, r.lineId)); if (!old) throw notFoundError();
      await location(user, r.receivingLocationId, gr.header.warehouseId, ['RECEIVING'], session);
      await m.DocumentLine.discriminators.DocumentLine_PURCHASE_RECEIPT.updateOne({ _id: old._id }, { $set: { 'details.receivingLocationId': r.receivingLocationId } }, { session, runValidators: true });
      await appendAudit({ documentId: gr._id, actorId: user._id, action: 'GR_DESTINATION', changes: [{ path: 'lines.' + id(old._id) + '.receivingLocationId', before: id(old.details.receivingLocationId), after: r.receivingLocationId }], session });
    }
    return { document: await bump(gr, session) };
  });
}
```

</details>

<a id="fn-230"></a>

## inspectionContext()

**Code:** [po-receiving.service.js:210](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:210).

**Tham số:** `inspectionContext(user, poId)`.

**Công việc:** Cấp dữ liệu PO/dòng/lượng/vị trí để chuẩn bị hoặc xem nhận hàng.

**Xử lý theo thứ tự:**

1. WAREHOUSE cần quyền create; OWNER/ACCOUNTANT cần purchase_order:read.
2. Đọc scopedPurchaseRead PO, rows, commitments và Location RECEIVING active trong snapshot transaction.
3. serialize trả purchaseOrder/lines/quantities/locations/computedAt.

**Đường dẫn gọi tới hàm này:** `GET /api/purchase-orders/:id/inspection-context` ([route dòng 55](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:55)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320), [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [scopedPurchaseRead()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-238), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [commitments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-220), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [serialize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-245).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.Location`, tại [dòng 217](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:217). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Location.find({ warehouseId: po.header.warehouseId, kind: 'RECEIVING', isActive: true })
```

**Ví dụ:** Kế toán có thể xem context hiện tại; không được dùng quyền đọc này để create inspection.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function inspectionContext(user, poId) {
  if (currentRole(user)?.code === 'WAREHOUSE') rights(user, 'create');
  else rights(user, 'read', 'purchase_order', ['OWNER', 'ACCOUNTANT']);
  const session = await mongoose.startSession();
  try { return await session.withTransaction(async () => {
    const po = await scopedPurchaseRead(user, poId, 'PO', session);
    const lines = await rows(po._id, session); const quantities = await commitments(po, session);
    const locations = await read(m.Location.find({ warehouseId: po.header.warehouseId, kind: 'RECEIVING', isActive: true }), session);
    return serialize({ purchaseOrder: po, lines, quantities, locations, computedAt: new Date() });
  }, txOptions); } finally { await session.endSession(); }
}
```

</details>

<a id="fn-231"></a>

## receivingOperation()

**Code:** [po-receiving.service.js:221](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:221).

**Tham số:** `receivingOperation(user, poId, rawKey)`.

**Công việc:** Tra kết quả một mã thao tác của chính người gọi trong một PO.

**Xử lý theo thứ tự:**

1. Kiểm purchase_order:read và scoped PO theo kho command hiện tại.
2. Tìm BusinessOperation theo key có actor và performedBy.
3. scoped document kết quả, kiểm thuộc PO; nếu TO thì kiểm qua dòng/placement.
4. Trả NOT_FOUND hoặc COMMITTED với receipt.

**Đường dẫn gọi tới hàm này:** `GET /api/purchase-orders/:id/receiving-operations/:key` ([route dòng 52](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:52)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [operationKey()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-246), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [receipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-247).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `m.BusinessOperation`, tại [dòng 224](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:224). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessOperation.findOne({ idempotencyKey: operationKey(user, rawKey), performedBy: user._id })
```

- Kiểm có bản ghi hay không qua `m.DocumentLine`, tại [dòng 229](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:229). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.exists({ documentId: d._id, 'details.placementId': { $in: (await m.ReceiptPlacement.find({ purchaseOrderId: poId }).select('_id').lean()).map(p => p._id) } })
```

- Đọc nhiều bản ghi qua `m.ReceiptPlacement`, tại [dòng 229](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.service.js:229). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ReceiptPlacement.find({ purchaseOrderId: poId }).select('_id').lean()
```

**Ví dụ:** Kế toán đọc PO ngoài kho được giao vẫn có thể bị chặn operation lookup vì hàm này cố ý chưa dùng scopedPurchaseRead.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function receivingOperation(user, poId, rawKey) {
  rights(user, 'read', 'purchase_order', ['OWNER', 'ACCOUNTANT', 'WAREHOUSE']);
  await scoped(user, poId, 'PO');
  const op = await read(m.BusinessOperation.findOne({ idempotencyKey: operationKey(user, rawKey), performedBy: user._id }));
  if (!op) return { status: 'NOT_FOUND' };
  const d = await scoped(user, op.documentId);
  const targetPoId = d.documentKind === 'PO' ? d._id : d.header?.purchaseOrderId;
  let belongs = same(targetPoId, poId);
  if (d.documentKind === 'TO') belongs = Boolean(await m.DocumentLine.exists({ documentId: d._id, 'details.placementId': { $in: (await m.ReceiptPlacement.find({ purchaseOrderId: poId }).select('_id').lean()).map(p => p._id) } }));
  if (!belongs) throw notFoundError();
  return { status: 'COMMITTED', receipt: receipt(op, true) };
}
```

</details>

<a id="fn-232"></a>

## same()

**Code:** [purchase-core.js:11](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:11).

**Tham số:** `same(a, b)`.

**Công việc:** So hai mã tham chiếu sau khi đổi về chuỗi.

**Xử lý theo thứ tự:**

1. Chuẩn hóa hai phía.
2. So bằng nhau; bản sameId ở module yêu cầu còn kiểm hai phía không null.

**Ai gọi / gọi tiếp:** Được gọi bởi [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-183), [draftLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-185), [claim()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-186), [confirmPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-189), [amendPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-190), [supplierConfirmation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-191), [validateClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-193), [approveClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-194), [prepare()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-221), [writeRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-222), [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [changeDestinations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-229), [receivingOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-231), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [command.replay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-249), [location()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-250), [preflight()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-256), [uploadEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-267), [attachEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-268), [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-276), [putawayContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-277), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [taskState()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-279), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281), [enriched()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-285), [receivingSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-289), [receivingTrips()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-290), [receivingHistory()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-292), [reconcilePurchasing()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-293). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Mã lô lấy từ JSON và mã ObjectId trong database vẫn so đúng nếu cùng nội dung.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
same = (a, b) => id(a) === id(b)
```

</details>

<a id="fn-233"></a>

## read()

**Code:** [purchase-core.js:12](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:12).

**Tham số:** `read(query, session = null)`.

**Công việc:** Thực thi một query Mongoose trong session được truyền và lấy object thường.

**Xử lý theo thứ tự:**

1. Nhận query đã dựng, gọi session(session).lean().
2. Trả query có thể await; việc truy vấn bao nhiêu và điều kiện nằm ở bên gọi.

**Ai gọi / gọi tiếp:** Được gọi bởi [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-183), [master()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-184), [draftLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-185), [claim()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-186), [confirmPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-189), [supplierConfirmation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-191), [validateClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-193), [approveClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-194), [executeClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-195), [activePo()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-219), [commitments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-220), [prepare()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-221), [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [inspectionContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-230), [receivingOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-231), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [scopedPurchaseRead()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-238), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [location()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-250), [balance()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-252), [evidenceFor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-255), [preflight()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-256), [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259), [attachEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-268), [downloadEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-271), [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-276), [putawayContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-277), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [taskState()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-279), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281), [cancelPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-282), [enriched()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-285), [receivingSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-289), [receivingHistory()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-292), [reconcilePurchasing()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-293). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** read(Product.findById(A), session) lấy sản phẩmA trong cùng giao dịch tạo phiếu.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
read = (query, session = null) => query.session(session).lean()
```

</details>

<a id="fn-234"></a>

## fail()

**Code:** [purchase-core.js:14](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:14).

**Tham số:** `fail(code, message, details = null, fieldErrors = [])`.

**Công việc:** Dừng lệnh nhận mua bằng lỗi 409 có mã nghiệp vụ.

**Xử lý theo thứ tự:**

1. Ghép ERR-REC- với code.
2. Ném ApiError mang message/details/fieldErrors.

**Ai gọi / gọi tiếp:** Được gọi bởi [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-183), [draftLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-185), [claim()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-186), [updatePurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-188), [confirmPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-189), [amendPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-190), [supplierConfirmation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-191), [requestClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-192), [validateClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-193), [approveClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-194), [executeClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-195), [activePo()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-219), [updateInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-225), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [cancelDraft()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-228), [changeDestinations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-229), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [location()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-250), [guardLocations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-251), [adjust()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-253), [evidenceFor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-255), [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259), [attachEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-268), [versionCheck()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-269), [placementQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-274), [updatePlacement()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-275), [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-276), [putawayContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-277), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281), [cancelPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-282). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Vượt lượng còn nhận trả ERR-REC-HEADROOM để bên gọi biết cần xem lại lượng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
fail = (code, message, details = null, fieldErrors = []) => { throw new ApiError(409, message, { code: `ERR-REC-${code}`, details, fieldErrors }); }
```

</details>

<a id="fn-235"></a>

## version()

**Code:** [purchase-core.js:15](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:15).

**Tham số:** `version(d, expected)`.

**Công việc:** Chặn thao tác dựa trên bản cũ.

**Xử lý theo thứ tự:**

1. So d.version với expected; khác thì versionConflict có currentVersion.

**Ai gọi / gọi tiếp:** Được gọi bởi [updatePurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-188), [confirmPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-189), [amendPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-190), [supplierConfirmation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-191), [requestClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-192), [approveClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-194), [executeClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-195), [activePo()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-219), [updateInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-225), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [cancelDraft()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-228), [changeDestinations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-229), [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281), [cancelPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-282). Gọi tiếp [versionConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-328).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** NgườiA đã lưu bản 3, ngườiB vẫn gửi 2 thì không ghi đè.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
version = (d, expected) => { if (d.version !== expected) throw versionConflict('Dữ liệu đã thay đổi', d.version); }
```

</details>

<a id="fn-236"></a>

## rights()

**Code:** [purchase-core.js:16](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:16).

**Tham số:** `rights(u, action, resource = 'goods_receipt_inspection', roles = ['WAREHOUSE'])`.

**Công việc:** Kiểm quyền thao tác nhận mua hoặc resource được truyền.

**Xử lý theo thứ tự:**

1. Ghép resource:action; gọi requirePermission với roles, mặc định chỉ WAREHOUSE.

**Ai gọi / gọi tiếp:** Được gọi bởi [accountant()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-182), [approveClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-194), [createInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-224), [updateInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-225), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [cancelDraft()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-228), [changeDestinations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-229), [inspectionContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-230), [receivingOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-231), [reversalPreflight()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-257), [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259), [permit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-273), [readReceiving()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-283), [receivingSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-289). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** post receipt cần goods_receipt_inspection:post và đúng vai trò, biết ObjectId không đủ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
rights = (u, action, resource = 'goods_receipt_inspection', roles = ['WAREHOUSE']) => requirePermission(u, `${resource}:${action}`, roles)
```

</details>

<a id="fn-237"></a>

## scoped()

**Code:** [purchase-core.js:17](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:17).

**Tham số:** `scoped(user, documentId, kind = null, session = null)`.

**Công việc:** Đọc một chứng từ trong phạm vi kho dùng cho command.

**Xử lý theo thứ tự:**

1. FindOne BusinessDocument theo _id và kind nếu có.
2. Không có hoặc không canAccessWarehouse thì 404.
3. Trả hồ sơ, không tự kiểm action permission.

**Ai gọi / gọi tiếp:** Được gọi bởi [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-183), [updatePurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-188), [confirmPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-189), [amendPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-190), [supplierConfirmation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-191), [requestClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-192), [approveClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-194), [executeClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-195), [activePo()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-219), [updateInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-225), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [cancelDraft()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-228), [changeDestinations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-229), [receivingOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-231), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [command.replay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-249), [evidenceFor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-255), [preflight()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-256), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259), [parent()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-264), [writableParent()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-265), [putawayContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-277), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [taskState()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-279), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281). Gọi tiếp [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `m.BusinessDocument`, tại [dòng 18](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:18). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.findOne({ _id: documentId, ...(kind && { documentKind: kind }) })
```

**Ví dụ:** Kế toán được đọc PO toàn kho qua helper khác nhưng sửa PO vẫn phải đi scoped này.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function scoped(user, documentId, kind = null, session = null) {
  const d = await read(m.BusinessDocument.findOne({ _id: documentId, ...(kind && { documentKind: kind }) }), session);
  if (!d || !canAccessWarehouse(user, d.header?.warehouseId)) throw notFoundError();
  return d;
}
```

</details>

<a id="fn-238"></a>

## scopedPurchaseRead()

**Code:** [purchase-core.js:23](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:23).

**Tham số:** `scopedPurchaseRead(user, documentId, kind = null, session = null)`.

**Công việc:** Đọc hồ sơ mua với ngoại lệ chỉ-đọc dành cho kế toán.

**Xử lý theo thứ tự:**

1. FindOne theo _id/kind.
2. Nếu role ACCOUNTANT và loại PO/PO_INSPECTION/GR_PURCHASE thì không bắt assigned warehouse.
3. Loại khác/vai trò khác vẫn dùng canAccessWarehouse; ngoài scope thì 404.

**Ai gọi / gọi tiếp:** Được gọi bởi [inspectionContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-230), [parent()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-264), [getDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-286), [receivingSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-289), [receivingTrips()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-290), [receivingHistory()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-292). Gọi tiếp [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `m.BusinessDocument`, tại [dòng 24](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:24). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.findOne({ _id: documentId, ...(kind && { documentKind: kind }) })
```

**Kết quả / nhánh bị chặn:** Không dùng thay scoped trong lệnh ghi; quyền đọc operation vẫn do hàm gọi kiểm.

**Ví dụ:** Kế toán đọc GR khoB, nhưng TO cất của khoB không tự được ngoại lệ này.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function scopedPurchaseRead(user, documentId, kind = null, session = null) {
  const d = await read(m.BusinessDocument.findOne({ _id: documentId, ...(kind && { documentKind: kind }) }), session);
  const accountantPurchase = currentRole(user)?.code === 'ACCOUNTANT' && ['PO', 'PO_INSPECTION', 'GR_PURCHASE'].includes(d?.documentKind);
  if (!d || (!accountantPurchase && !canAccessWarehouse(user, d.header?.warehouseId))) throw notFoundError();
  return d;
}
```

</details>

<a id="fn-239"></a>

## rows()

**Code:** [purchase-core.js:29](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:29).

**Tham số:** `rows(documentId, session = null)`.

**Công việc:** Đọc các dòng của một phiếu theo thứ tự dòng.

**Xử lý theo thứ tự:**

1. DocumentLine.find documentId, sort lineNo tăng.
2. Gắn session và lean qua read.

**Ai gọi / gọi tiếp:** Được gọi bởi [draftLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-185), [confirmPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-189), [amendPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-190), [prepare()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-221), [updateInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-225), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [changeDestinations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-229), [inspectionContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-230), [preflight()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-256), [uploadEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-267), [attachEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-268), [putawayContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-277), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [taskState()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-279), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281), [receivingSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-289). Gọi tiếp [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.DocumentLine`, tại [dòng 29](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:29). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.find({ documentId }).sort({ lineNo: 1 })
```

**Ví dụ:** Lấy đủ hai dòng lôL 01/L 02 của cùng kiểm nhận trước đối chiếu GR.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
rows = (documentId, session = null) => read(m.DocumentLine.find({ documentId }).sort({ lineNo: 1 }), session)
```

</details>

<a id="fn-240"></a>

## save()

**Code:** [purchase-core.js:30](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:30).

**Tham số:** `save(Model, fields, session)`.

**Công việc:** Tạo đối tượng model và ghi trong session bên gọi.

**Xử lý theo thứ tự:**

1. new Model(fields) mới chỉ chuẩn bị bản ghi.
2. await d.save({session}) mới ghi, chạy kiểm schema/index.
3. Trả đối tượng đã lưu.

**Ai gọi / gọi tiếp:** Được gọi bởi [draftLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-185), [claim()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-186), [amendPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-190), [supplierConfirmation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-191), [requestClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-192), [approveClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-194), [executeClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-195), [writeRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-222), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [newDoc()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-241), [link()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-242), [lineLink()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-243), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [balance()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-252), [batch()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-254), [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259), [uploadEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-267), [attachEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-268), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281). Không gọi hàm khác trong danh mục này.

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Ghi đối tượng model đã tạo qua `Model`, tại [dòng 30](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:30). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
d.save({ session })
```

**Ví dụ:** save(ReceiptPlacement, ...) ghi tiến độ cất sau tăng tồn; bước sau lỗi thì cùng transaction rollback.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function save(Model, fields, session) { const d = new Model(fields); await d.save({ session }); return d; }
```

</details>

<a id="fn-241"></a>

## newDoc()

**Code:** [purchase-core.js:31](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:31).

**Tham số:** `newDoc(kind, header, user, session, status = 'DRAFT')`.

**Công việc:** Tạo phần chung một chứng từ mới.

**Xử lý theo thứ tự:**

1. Tạo ObjectId và documentNo từ kind/mã.
2. save BusinessDocument với header, creator, status mặc định DRAFT và version 1.

**Ai gọi / gọi tiếp:** Được gọi bởi [createPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-187), [createInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-224), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278). Gọi tiếp [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.BusinessDocument`:

```js
save(m.BusinessDocument, { _id, documentNo: `${kind}-${_id}`, documentKind: kind, header, workflowStatus: status, version: 1, createdBy: user._id }, session)
```

**Đi tới cơ sở dữ liệu qua hàm khác:** `Model.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** newDoc(GR_PURCHASE, ...) tạo header phiếu nhập; dòng vẫn được ghi riêng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function newDoc(kind, header, user, session, status = 'DRAFT') {
  const _id = new mongoose.Types.ObjectId();
  return save(m.BusinessDocument, { _id, documentNo: `${kind}-${_id}`, documentKind: kind, header, workflowStatus: status, version: 1, createdBy: user._id }, session);
}
```

</details>

<a id="fn-242"></a>

## link()

**Code:** [purchase-core.js:35](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:35).

**Tham số:** `link(a, b, relationCode, session)`.

**Công việc:** Ghi liên kết nguồn giữa hai phiếu.

**Xử lý theo thứ tự:**

1. save DocumentLink với parentDocumentId, childDocumentId và relationCode.

**Ai gọi / gọi tiếp:** Được gọi bởi [createInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-224), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278). Gọi tiếp [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.DocumentLink`:

```js
save(m.DocumentLink, { parentDocumentId: a._id, childDocumentId: b._id, relationCode }, session)
```

**Đi tới cơ sở dữ liệu qua hàm khác:** `Model.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** PO→kiểm nhận cho biết kiểm nhận thuộc đơn nào, không tăng tồn.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
link = (a, b, relationCode, session) => save(m.DocumentLink, { parentDocumentId: a._id, childDocumentId: b._id, relationCode }, session)
```

</details>

<a id="fn-243"></a>

## lineLink()

**Code:** [purchase-core.js:36](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:36).

**Tham số:** `lineLink(a, b, qty, session, relationCode = 'SOURCE')`.

**Công việc:** Ghi liên kết có lượng giữa hai dòng hàng.

**Xử lý theo thứ tự:**

1. save LineLink sourceLineId/targetLineId/linkedQty/relationCode, mặc định SOURCE.

**Ai gọi / gọi tiếp:** Được gọi bởi [draftLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-185), [writeRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-222), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278). Gọi tiếp [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.LineLink`:

```js
save(m.LineLink, { sourceLineId: a, targetLineId: b, linkedQty: qty, relationCode }, session)
```

**Đi tới cơ sở dữ liệu qua hàm khác:** `Model.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Dòng kiểm nhận 40 nối dòng nhập 40; sau này truy đúng dòng chứ không đoán bằng tên.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
lineLink = (a, b, qty, session, relationCode = 'SOURCE') => save(m.LineLink, { sourceLineId: a, targetLineId: b, linkedQty: qty, relationCode }, session)
```

</details>

<a id="fn-244"></a>

## bump()

**Code:** [purchase-core.js:37](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:37).

**Tham số:** `bump(d, session, set = {})`.

**Công việc:** Cập nhật chứng từ khi phiên bản chưa bị người khác thay.

**Xử lý theo thứ tự:**

1. FindOneAndUpdate theo _id/documentKind/version.
2. $inc version 1 và $set nếu có, runValidators, trả bản sau.
3. Không matched thì fail VERSION.

**Ai gọi / gọi tiếp:** Được gọi bởi [updatePurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-188), [confirmPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-189), [amendPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-190), [supplierConfirmation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-191), [requestClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-192), [approveClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-194), [executeClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-195), [updateInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-225), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [cancelDraft()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-228), [changeDestinations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-229), [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259), [attachEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-268), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281), [cancelPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-282). Gọi tiếp [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Cập nhật rồi lấy bản ghi kết quả qua `m.BusinessDocument`, tại [dòng 38](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:38). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.findOneAndUpdate({ _id: d._id, documentKind: d.documentKind, version: d.version }, { $inc: { version: 1 }, ...(Object.keys(set).length && { $set: set }) }, { session, returnDocument: 'after', runValidators: true }).lean()
```

**Ví dụ:** Chốt kiểm nhận cùng PO bản 2: một nhánh tăng PO 3, nhánh cạnh tranh phải tải lại.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function bump(d, session, set = {}) {
  const next = await m.BusinessDocument.findOneAndUpdate({ _id: d._id, documentKind: d.documentKind, version: d.version }, { $inc: { version: 1 }, ...(Object.keys(set).length && { $set: set }) }, { session, returnDocument: 'after', runValidators: true }).lean();
  if (!next) fail('VERSION', 'Chứng từ vừa thay đổi');
  return next;
}
```

</details>

<a id="fn-245"></a>

## serialize()

**Code:** [purchase-core.js:42](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:42).

**Tham số:** `serialize(v)`.

**Công việc:** Đổi mã/số/ngày trong kết quả thành dạng JSON ổn định.

**Xử lý theo thứ tự:**

1. Null giữ nguyên; Date sang ISO; ObjectId/Decimal 128 sang chuỗi.
2. Mảng và object xử lý đệ quy, object Mongoose dùng toObject nếu có.
3. Không đọc database hoặc đổi nghiệp vụ.

**Ai gọi / gọi tiếp:** Được gọi bởi [inspectionContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-230), [receipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-247), [reversalPreflight()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-257), [listEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-270), [putawayContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-277), [getPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-280), [getDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-286), [listDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-288), [receivingSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-289), [receivingTrips()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-290), [receivingQueue()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-291), [receivingHistory()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-292). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** qtyBase Decimal 12870 trả chuỗi 70, không trả object $numberDecimal.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function serialize(v) {
  if (v == null) return v;
  if (v instanceof Date) return v.toISOString();
  if (v._bsontype === 'Decimal128' || v._bsontype === 'ObjectId') return v.toString();
  if (Array.isArray(v)) return v.map(serialize);
  if (typeof v === 'object') return Object.fromEntries(Object.entries(v.toObject ? v.toObject() : v).map(([k, x]) => [k, serialize(x)]));
  return v;
}
```

</details>

<a id="fn-246"></a>

## operationKey()

**Code:** [purchase-core.js:50](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:50).

**Tham số:** `operationKey(user, raw)`.

**Công việc:** Tạo mã chống lặp của lệnh mua/nhận theo người thực hiện.

**Xử lý theo thứ tự:**

1. Ghép po-receiving, userId và rawKey rồi băm SHA 256.

**Ai gọi / gọi tiếp:** Được gọi bởi [receivingOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-231), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248). Gọi tiếp [sha256Text()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-316).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Hai người cùng dùng key receipt-post-1 có hai miền mã khác nhau.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
operationKey = (user, raw) => sha256Text(`po-receiving:${id(user._id)}:${raw}`)
```

</details>

<a id="fn-247"></a>

## receipt()

**Code:** [purchase-core.js:51](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:51).

**Tham số:** `receipt(value, replayed)`.

**Công việc:** Tạo biên nhận thao tác từ BusinessOperation.

**Xử lý theo thứ tự:**

1. Lấy id/version/result/operationId và replayed.
2. serialize để mã/ngày/số trả JSON.

**Ai gọi / gọi tiếp:** Được gọi bởi [receivingOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-231), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [command.replay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-249). Gọi tiếp [serialize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-245).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Phản hồi post có postingBatchId đã lưu, dùng in lại không post lần nữa.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function receipt(value, replayed) { const op = value.toObject ? value.toObject() : value; return serialize({ id: op.documentId, version: op.documentVersion, ...op.result, operationId: op._id, replayed }); }
```

</details>

<a id="fn-248"></a>

## command()

**Code:** [purchase-core.js:52](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:52).

**Tham số:** `command(user, action, targetId, input, work)`.

**Công việc:** Bao một lệnh mua/nhận trong giao dịch cùng biên nhận và audit.

**Xử lý theo thứ tự:**

1. Tạo key/hash từ actor/action/target/input; startSession.
2. Trong withTransaction tra BusinessOperation: đã có thì replay; chưa có gọi work(session,key,hash).
3. Save BusinessOperation và AuditEvent với kết quả work trong cùng session.
4. Nếu lỗi 11000/unknown commit tra lại biên nhận ngoài transaction; có thì replay, không có báo xử lý cạnh tranh.
5. finally đóng session.

**Ai gọi / gọi tiếp:** Được gọi bởi [createPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-187), [updatePurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-188), [confirmPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-189), [amendPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-190), [supplierConfirmation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-191), [requestClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-192), [approveClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-194), [executeClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-195), [createInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-224), [updateInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-225), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [cancelDraft()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-228), [changeDestinations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-229), [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259), [attachEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-268), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281), [cancelPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-282). Gọi tiếp [operationKey()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-246), [sha256Json()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-315), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [operationConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-330), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [receipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-247), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [command.replay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-249), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `m.BusinessOperation`, tại [dòng 63](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:63). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessOperation.findOne({ idempotencyKey: key })
```

- Đọc một bản ghi qua `m.BusinessOperation`, tại [dòng 72](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:72). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessOperation.findOne({ idempotencyKey: key })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.BusinessOperation`:

```js
save(m.BusinessOperation, { documentId: document._id, operation: action, operationKey: key, idempotencyKey: key, payloadHash: hash, documentVersion: document.version, performedBy: user._id, result: { workflowStatus: document.workflowStatus, ...result } }, session)
```

- `appendAudit` → `AuditEvent`:

```js
appendAudit({ documentId: document._id, actorId: user._id, action, details: { version: document.version, operationId: id(op._id), ...(input.reason && { reason: input.reason }) }, session })
```

**Kết quả / nhánh bị chặn:** work là hàm công việc do lệnh cấp; command không tự biết mọi điều kiện nhận/cất/đảo.

**Ví dụ:** Lệnh post đã tăng tồn nhưng mất phản hồi: gửi lại cùng key/payload trả batch cũ, không cộng lại.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function command(user, action, targetId, input, work) {
  const key = operationKey(user, input.creationKey ?? input.operationKey);
  const hash = sha256Json({ action, targetId: id(targetId), input });
  const replay = async (op, session = null) => {
    if (op.payloadHash !== hash || op.operation !== action || !same(op.performedBy, user._id)) throw operationConflict();
    await scoped(user, op.documentId, null, session);
    return receipt(op, true);
  };
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const prior = await read(m.BusinessOperation.findOne({ idempotencyKey: key }), session);
      if (prior) return replay(prior, session);
      const { document, ...result } = await work(session, key, hash);
      const op = await save(m.BusinessOperation, { documentId: document._id, operation: action, operationKey: key, idempotencyKey: key, payloadHash: hash, documentVersion: document.version, performedBy: user._id, result: { workflowStatus: document.workflowStatus, ...result } }, session);
      await appendAudit({ documentId: document._id, actorId: user._id, action, details: { version: document.version, operationId: id(op._id), ...(input.reason && { reason: input.reason }) }, session });
      return receipt(op, false);
    }, txOptions);
  } catch (e) {
    if (e.code === 11000 || e.hasErrorLabel?.('UnknownTransactionCommitResult')) {
      const prior = await read(m.BusinessOperation.findOne({ idempotencyKey: key }));
      if (prior) return replay(prior);
      fail('CONCURRENT', 'Nguồn đang được xử lý; tra cứu hoặc thử lại cùng key');
    }
    throw e;
  } finally { await session.endSession(); }
}
```

</details>

<a id="fn-249"></a>

## command.replay()

**Code:** [purchase-core.js:55](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:55).

**Tham số:** `command.replay(op, session = null)`.

**Công việc:** Xác minh quyền và nội dung trước trả lại kết quả cũ.

**Xử lý theo thứ tự:**

1. So hash/action/performedBy với lệnh hiện tại.
2. scoped lại op.documentId theo kho hiện hành.
3. Trả receipt(replayed=true).

**Ai gọi / gọi tiếp:** Được gọi bởi [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248). Gọi tiếp [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [operationConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-330), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [receipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-247).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.BusinessDocument.findOne`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Tài khoản mất kho sau lần post không mở lại biên nhận cũ bằng key để vượt scope.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
replay = async (op, session = null) => {
    if (op.payloadHash !== hash || op.operation !== action || !same(op.performedBy, user._id)) throw operationConflict();
    await scoped(user, op.documentId, null, session);
    return receipt(op, true);
  }
```

</details>

<a id="fn-250"></a>

## location()

**Code:** [purchase-core.js:79](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:79).

**Tham số:** `location(user, locationId, warehouseId, kinds, session)`.

**Công việc:** Đọc vị trí và kiểm đúng kho/loại/hoạt động.

**Xử lý theo thứ tự:**

1. Location.findById trong session.
2. Kiểm isActive, warehouseId, kind thuộc danh sách và user có kho.
3. Sai thì fail LOCATION.

**Ai gọi / gọi tiếp:** Được gọi bởi [prepare()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-221), [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [changeDestinations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-229), [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-276). Gọi tiếp [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `m.Location`, tại [dòng 80](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:80). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Location.findById(locationId)
```

**Ví dụ:** Khu RECEIVING khoB không dùng làm đích nhập PO khoA.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function location(user, locationId, warehouseId, kinds, session) {
  const l = await read(m.Location.findById(locationId), session);
  if (!l?.isActive || !same(l.warehouseId, warehouseId) || !kinds.includes(l.kind) || !canAccessWarehouse(user, warehouseId)) fail('LOCATION', 'Vị trí không phù hợp kho/loại hoặc đã ngừng hoạt động');
  return l;
}
```

</details>

<a id="fn-251"></a>

## guardLocations()

**Code:** [purchase-core.js:84](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:84).

**Tham số:** `guardLocations(ids, session)`.

**Công việc:** Tạo điểm ghi chung để chống thao tác cùng lúc với khóa vị trí.

**Xử lý theo thứ tự:**

1. Loại mã trùng và sắp mã.
2. Update Location active tăng planningVersion từng mã.
3. Kiểm matched và LocationLock.exists; không đạt fail FREEZE.

**Ai gọi / gọi tiếp:** Được gọi bởi [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281). Gọi tiếp [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Cập nhật một bản ghi qua `m.Location`, tại [dòng 86](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:86). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Location.updateOne({ _id: locationId, isActive: true }, { $inc: { planningVersion: 1 } }, { session })
```

- Kiểm có bản ghi hay không qua `m.LocationLock`, tại [dòng 87](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:87). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.LocationLock.exists({ locationId }).session(session)
```

**Kết quả / nhánh bị chặn:** Có ghi metadata vị trí dù chưa move stock ở một số lệnh lập việc.

**Ví dụ:** Vị trí vừa bị khóa kiểm kê không được post hàng vào bằng dữ liệu cũ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function guardLocations(ids, session) {
  for (const locationId of [...new Set(ids.map(id))].sort()) {
    const changed = await m.Location.updateOne({ _id: locationId, isActive: true }, { $inc: { planningVersion: 1 } }, { session });
    if (changed.matchedCount !== 1 || await m.LocationLock.exists({ locationId }).session(session)) fail('FREEZE', 'Vị trí bị khóa kiểm kê hoặc ngừng hoạt động', { locationId });
  }
}
```

</details>

<a id="fn-252"></a>

## balance()

**Code:** [purchase-core.js:90](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:90).

**Tham số:** `balance(locationId, lotId, ownerPartyId, qualityCode, session)`.

**Công việc:** Tìm hoặc tạo số dư đúng chiều dữ liệu.

**Xử lý theo thứ tự:**

1. Tìm StockAccount theo locationId; thiếu thì save account.
2. Tìm StockBalance theo accountId/lotId/ownerPartyId/qualityCode.
3. Thiếu thì save số dư 0/version 0; chưa cộng lượng ở helper này.

**Ai gọi / gọi tiếp:** Được gọi bởi [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281). Gọi tiếp [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `m.StockAccount`, tại [dòng 91](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:91). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.StockAccount.findOne({ locationId })
```

- Đọc một bản ghi qua `m.StockBalance`, tại [dòng 93](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:93). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.StockBalance.findOne({ accountId: account._id, lotId, ownerPartyId, qualityCode })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.StockAccount`:

```js
save(m.StockAccount, { locationId }, session)
```

- `save` → `m.StockBalance`:

```js
save(m.StockBalance, { accountId: account._id, lotId, ownerPartyId, qualityCode, qtyBase: '0', version: 0 }, session)
```

**Ví dụ:** Cùng R 1/lôL 01 nhưng owner STORE và supplier tạo hai số dư khác nhau.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function balance(locationId, lotId, ownerPartyId, qualityCode, session) {
  let account = await read(m.StockAccount.findOne({ locationId }), session);
  if (!account) account = await save(m.StockAccount, { locationId }, session);
  let b = await read(m.StockBalance.findOne({ accountId: account._id, lotId, ownerPartyId, qualityCode }), session);
  if (!b) b = await save(m.StockBalance, { accountId: account._id, lotId, ownerPartyId, qualityCode, qtyBase: '0', version: 0 }, session);
  return b;
}
```

</details>

<a id="fn-253"></a>

## adjust()

**Code:** [purchase-core.js:97](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:97).

**Tham số:** `adjust(b, delta, session)`.

**Công việc:** Tăng/giảm một số dư với bảo vệ phiên bản và không âm.

**Xử lý theo thứ tự:**

1. after=qty hiện tại+delta bằng ExactDecimal.
2. Âm thì fail SOURCE.
3. Update StockBalance theo _id/version, set qty và tăng version; không matched thì fail VERSION.
4. Trả before/after để ghi movement.

**Ai gọi / gọi tiếp:** Được gọi bởi [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281). Gọi tiếp [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Cập nhật một bản ghi qua `m.StockBalance`, tại [dòng 100](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:100). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.StockBalance.updateOne({ _id: b._id, version: b.version }, { $set: { qtyBase: after.toString() }, $inc: { version: 1 } }, { session })
```

**Ví dụ:** R 1 có 70 chuyển 20 thì 50; hai người không cùng ghi đè dựa bản 70.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function adjust(b, delta, session) {
  const after = exact(b.qtyBase).plus(delta);
  if (after.isNegative()) fail('SOURCE', 'Không đủ lượng nguồn');
  const changed = await m.StockBalance.updateOne({ _id: b._id, version: b.version }, { $set: { qtyBase: after.toString() }, $inc: { version: 1 } }, { session });
  if (changed.matchedCount !== 1) fail('VERSION', 'Số dư vừa thay đổi');
  return { before: b.qtyBase.toString(), after: after.toString() };
}
```

</details>

<a id="fn-254"></a>

## batch()

**Code:** [purchase-core.js:104](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:104).

**Tham số:** `batch(document, user, key, hash, session, extra = {})`.

**Công việc:** Ghi một lần ghi sổ tồn có mã chống lặp.

**Xử lý theo thứ tự:**

1. save PostingBatch với document, operation mặc định POST, key/hash/postedBy.
2. extra có thể đổi operation sang REVERSE hoặc PURCHASE_PUTAWAY và thêm reversalOf.

**Ai gọi / gọi tiếp:** Được gọi bởi [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227), [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281). Gọi tiếp [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.PostingBatch`:

```js
save(m.PostingBatch, { documentId: document._id, operation: 'POST', operationKey: key, idempotencyKey: key, payloadHash: hash, postedBy: user._id, ...extra }, session)
```

**Đi tới cơ sở dữ liệu qua hàm khác:** `Model.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Một phiếu cất xác nhận 20 rồi 20 có hai batch thao tác riêng, không một batch bị sửa từ 20 thành 40.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
batch = (document, user, key, hash, session, extra = {}) => save(m.PostingBatch, { documentId: document._id, operation: 'POST', operationKey: key, idempotencyKey: key, payloadHash: hash, postedBy: user._id, ...extra }, session)
```

</details>

<a id="fn-255"></a>

## evidenceFor()

**Code:** [purchase-core.js:105](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:105).

**Tham số:** `evidenceFor(user, documentId, ids, session, required = false)`.

**Công việc:** Kiểm các mã chứng cứ đã gắn đúng hồ sơ để lệnh dùng.

**Xử lý theo thứ tự:**

1. Nếu required mà rỗng thì lỗi.
2. scoped hồ sơ và Evidence.find theo tập _id + documentId.
3. Số tìm được phải đúng số yêu cầu, nếu không fail EVIDENCE.

**Ai gọi / gọi tiếp:** Được gọi bởi [amendPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-190), [supplierConfirmation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-191), [requestClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-192), [approveClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-194), [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258), [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259). Gọi tiếp [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.Evidence`, tại [dòng 108](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-core.js:108). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Evidence.find({ _id: { $in: ids ?? [] }, documentId })
```

**Ví dụ:** Chứng cứ PO A không được dùng đảo GR B; phải gắn đúng GR cần đảo.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function evidenceFor(user, documentId, ids, session, required = false) {
  if (required && !ids?.length) fail('EVIDENCE', 'Cần chứng cứ đã lưu trên hồ sơ');
  await scoped(user, documentId, null, session);
  const found = await read(m.Evidence.find({ _id: { $in: ids ?? [] }, documentId }), session);
  if (found.length !== (ids?.length ?? 0)) fail('EVIDENCE', 'Chứng cứ không thuộc đúng hồ sơ');
  return found;
}
```

</details>

<a id="fn-256"></a>

## preflight()

**Code:** [purchase-correction.service.js:8](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:8).

**Tham số:** `preflight(user, receiptId, session)`.

**Công việc:** Đọc đủ phụ thuộc để xác định GR có thể đảo toàn phiếu hay không.

**Xử lý theo thứ tự:**

1. scoped GR/PO; đọc kho/dòng/placements/batch gốc và batch đảo.
2. Chặn thiếu nguồn, đã đảo, đã cất, đang có task giữ; cộng lượng cần trừ theo source balance.
3. Đọc balance/reservation/hold/account/location/lock; chặn thiếu tồn hoặc vị trí không đúngReceiving.
4. Tìm movement lấy ra sau thời điểm nhập và task mở cùng source balance.
5. Trả hồ sơ đã đọc, canReverse và blockers; không tự đảo.

**Ai gọi / gọi tiếp:** Được gọi bởi [reversalPreflight()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-257), [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258). Gọi tiếp [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `m.Warehouse`, tại [dòng 11](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:11). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Warehouse.findById(gr.header.warehouseId)
```

- Đọc nhiều bản ghi qua `m.ReceiptPlacement`, tại [dòng 13](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:13). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ReceiptPlacement.find({ receiptId: gr._id })
```

- Đọc nhiều bản ghi qua `m.PostingBatch`, tại [dòng 14](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:14). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PostingBatch.find({ documentId: gr._id, reversalOf: { $exists: false } })
```

- Đọc nhiều bản ghi qua `m.PostingBatch`, tại [dòng 15](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:15). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PostingBatch.find({ reversalOf: { $in: roots.map(r => r._id) } })
```

- Đọc nhiều bản ghi qua `m.StockBalance`, tại [dòng 21](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:21). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.StockBalance.find({ _id: { $in: ids } })
```

- Đọc nhiều bản ghi qua `m.Reservation`, tại [dòng 35](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:35). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Reservation.find({ balanceId: { $in: ids }, status: 'ACTIVE' }).select('_id balanceId')
```

- Đọc nhiều bản ghi qua `m.DefectHold`, tại [dòng 36](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:36). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DefectHold.find({ balanceId: { $in: ids }, status: 'ACTIVE' }).select('_id balanceId')
```

- Đọc nhiều bản ghi qua `m.StockAccount`, tại [dòng 39](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:39). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.StockAccount.find({ _id: { $in: balances.map(b => b.accountId) } })
```

- Đọc nhiều bản ghi qua `m.Location`, tại [dòng 40](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:40). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Location.find({ _id: { $in: accounts.map(a => a.locationId) } })
```

- Kiểm có bản ghi hay không qua `m.LocationLock`, tại [dòng 42](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:42). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.LocationLock.exists({ locationId: { $in: locations.map(l => l._id) } }).session(session)
```

- Đọc nhiều bản ghi qua `m.StockMovement`, tại [dòng 44](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:44). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.StockMovement.find({ fromBalanceId: { $in: ids }, documentId: { $ne: gr._id }, createdAt: { $gte: roots[0].postedAt } }).select('_id documentId')
```

- Đọc nhiều bản ghi qua `m.DocumentLine`, tại [dòng 46](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:46). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.find({ lineKind: 'WAREHOUSE_TASK', 'details.sourceBalanceId': { $in: ids } }).select('documentId')
```

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 47](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:47). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find({ _id: { $in: taskLines.map(l => l.documentId) }, documentKind: 'TO', workflowStatus: { $in: ['OPEN','PARTIAL','DRAFT'] } }).select('_id')
```

**Ví dụ:** GR 70 còn tạiR 1 nhưng đã dùng 20 trong movement sau đó thì bị chặn, kể cả đang gộp với chuyến khác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function preflight(user, receiptId, session) {
  const gr = await scoped(user, receiptId, 'GR_PURCHASE', session);
  const po = await scoped(user, gr.header.purchaseOrderId, 'PO', session);
  const wh = await read(m.Warehouse.findById(gr.header.warehouseId), session);
  const lines = await rows(gr._id, session);
  const placements = await read(m.ReceiptPlacement.find({ receiptId: gr._id }), session);
  const roots = await read(m.PostingBatch.find({ documentId: gr._id, reversalOf: { $exists: false } }), session);
  const reversed = await read(m.PostingBatch.find({ reversalOf: { $in: roots.map(r => r._id) } }), session);
  const blockers = [];
  if (!wh?.isActive) blockers.push({ code: 'WAREHOUSE_INACTIVE' });
  if (gr.workflowStatus !== 'POSTED' || roots.length !== 1 || reversed.length) blockers.push({ code: 'NOT_REVERSIBLE_STATE' });
  if (placements.length !== lines.length || !lines.length) blockers.push({ code: 'MISSING_PROVENANCE' });
  const ids = placements.map(p => p.sourceBalanceId);
  const balances = await read(m.StockBalance.find({ _id: { $in: ids } }), session);
  const totals = new Map();
  for (const p of placements) {
    const line = lines.find(l => same(l._id, p.receiptLineId));
    if (!line || !exact(line.qtyBase).eq(exact(p.receivedQtyBase))) blockers.push({ code: 'INVALID_PROVENANCE', lineId: id(p.receiptLineId) });
    if (exact(p.placedQtyBase).gt(0)) blockers.push({ code: 'PLACED', lineId: id(p.receiptLineId) });
    if (exact(p.claimedQtyBase).gt(0)) blockers.push({ code: 'OPEN_TASK', lineId: id(p.receiptLineId) });
    if (exact(p.reversedQtyBase).gt(0)) blockers.push({ code: 'ALREADY_REVERSED', lineId: id(p.receiptLineId) });
    totals.set(id(p.sourceBalanceId), (totals.get(id(p.sourceBalanceId)) ?? exact('0')).plus(exact(p.receivedQtyBase)));
  }
  for (const [balanceId, qty] of totals) {
    const b = balances.find(b => same(b._id, balanceId));
    if (!b || exact(b.qtyBase).lt(qty)) blockers.push({ code: 'INSUFFICIENT_STOCK', balanceId });
  }
  const reservations = await read(m.Reservation.find({ balanceId: { $in: ids }, status: 'ACTIVE' }).select('_id balanceId'), session);
  const holds = await read(m.DefectHold.find({ balanceId: { $in: ids }, status: 'ACTIVE' }).select('_id balanceId'), session);
  if (reservations.length) blockers.push({ code: 'RESERVATION', dependencies: reservations.map(r => id(r._id)) });
  if (holds.length) blockers.push({ code: 'HOLD', dependencies: holds.map(r => id(r._id)) });
  const accounts = await read(m.StockAccount.find({ _id: { $in: balances.map(b => b.accountId) } }), session);
  const locations = await read(m.Location.find({ _id: { $in: accounts.map(a => a.locationId) } }), session);
  if (locations.length !== accounts.length || locations.some(l => !l.isActive || l.kind !== 'RECEIVING' || !same(l.warehouseId, gr.header.warehouseId))) blockers.push({ code: 'LOCATION' });
  if (await m.LocationLock.exists({ locationId: { $in: locations.map(l => l._id) } }).session(session)) blockers.push({ code: 'FREEZE' });
  if (roots.length) {
    const downstream = await read(m.StockMovement.find({ fromBalanceId: { $in: ids }, documentId: { $ne: gr._id }, createdAt: { $gte: roots[0].postedAt } }).select('_id documentId'), session);
    if (downstream.length) blockers.push({ code: 'DOWNSTREAM', dependencies: downstream.map(d => id(d.documentId)) });
    const taskLines = await read(m.DocumentLine.find({ lineKind: 'WAREHOUSE_TASK', 'details.sourceBalanceId': { $in: ids } }).select('documentId'), session);
    const openTasks = await read(m.BusinessDocument.find({ _id: { $in: taskLines.map(l => l.documentId) }, documentKind: 'TO', workflowStatus: { $in: ['OPEN','PARTIAL','DRAFT'] } }).select('_id'), session);
    if (openTasks.length) blockers.push({ code: 'OPEN_TASK', dependencies: openTasks.map(d => id(d._id)) });
  }
  return { gr, po, placements, roots, locations, canReverse: !blockers.length, blockers };
}
```

</details>

<a id="fn-257"></a>

## reversalPreflight()

**Code:** [purchase-correction.service.js:52](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:52).

**Tham số:** `reversalPreflight(user, receiptId)`.

**Công việc:** Cấp kết quả kiểm tra đảo trên một snapshot đọc.

**Xử lý theo thứ tự:**

1. Kiểm quyền reverse.
2. Trong read transaction gọi preflight, trả receiptVersion/poVersion/canReverse/blockers.
3. Kết thúc session; execute phải kiểm lại.

**Đường dẫn gọi tới hàm này:** `GET /api/purchase-receipts/:id/reversal-preflight` ([route dòng 46](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:46)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [preflight()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-256), [serialize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-245).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.Warehouse.findById`, `m.ReceiptPlacement.find`, `m.PostingBatch.find`, `m.StockBalance.find`, `m.Reservation.find`, `m.DefectHold.find`, `m.StockAccount.find`, `m.Location.find`, `m.LocationLock.exists`, `m.StockMovement.find`, `m.DocumentLine.find`, `m.BusinessDocument.find`, `m.BusinessDocument.findOne`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Kiểm tra lúc 10 h được phép không bảo đảm 10 h 05 vẫn được nếu đã cótask mới.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function reversalPreflight(user, receiptId) {
  rights(user, 'reverse'); const session = await mongoose.startSession();
  try { return await session.withTransaction(async () => {
    const p = await preflight(user, receiptId, session);
    return serialize({ receiptId: p.gr._id, receiptVersion: p.gr.version, poVersion: p.po.version, canReverse: p.canReverse, blockers: p.blockers });
  }, txOptions); } finally { await session.endSession(); }
}
```

</details>

<a id="fn-258"></a>

## reverseReceipt()

**Code:** [purchase-correction.service.js:59](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:59).

**Tham số:** `reverseReceipt(user, receiptId, input)`.

**Công việc:** Ghi giao dịch đảo toàn GR với chứng cứ và kiểm phụ thuộc lại.

**Xử lý theo thứ tự:**

1. Trong command chạy preflight, kiểm phiên bản GR/PO và evidenceFor đúngGR.
2. Nếu có blockers dừng; guardLocations và tạo REVERSE batch tham chiếu batch gốc.
3. Mỗi placement: đọc balance mới, adjust−received, save movement đi ra, set reversedQty và tăng placement.version.
4. Save REVERSAL event; tính lại PO quantity đủ căn cứ; bump PO OPEN/PARTIAL và tăng GR.version.

**Đường dẫn gọi tới hàm này:** `POST /api/purchase-receipts/:id/reverse` ([route dòng 47](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:47)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [preflight()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-256), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [evidenceFor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-255), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [guardLocations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-251), [batch()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-254), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [adjust()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-253), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [purchaseOrderQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-211), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `m.StockBalance`, tại [dòng 68](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:68). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.StockBalance.findById(placement.sourceBalanceId)
```

- Cập nhật một bản ghi qua `m.ReceiptPlacement`, tại [dòng 71](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:71). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ReceiptPlacement.updateOne({ _id: placement._id, version: placement.version }, { $set: { reversedQtyBase: placement.receivedQtyBase }, $inc: { version: 1 } }, { session })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `batch` → `PostingBatch`:

```js
batch(p.gr, user, key, hash, session, { operation: 'REVERSE', reversalOf: p.roots[0]._id })
```

- `adjust` → `StockBalance`:

```js
adjust(b, exact(placement.receivedQtyBase).negated(), session)
```

- `save` → `m.StockMovement`:

```js
save(m.StockMovement, { batchId: posting._id, documentId: p.gr._id, lineId: placement.receiptLineId, fromBalanceId: b._id, qtyBase: placement.receivedQtyBase, fromBefore: numbers.before, fromAfter: numbers.after }, session)
```

- `save` → `m.PurchaseEvent`:

```js
save(m.PurchaseEvent, { purchaseOrderId: p.po._id, documentId: p.gr._id, kind: 'REVERSAL', sourcePoVersion: p.po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, postingBatchId: posting._id }, session)
```

- `bump` → `BusinessDocument`:

```js
bump(p.po, session, { workflowStatus: q.every(r => exact(r.netPostedReceiptQtyBase).isZero()) ? 'OPEN' : 'PARTIAL' })
```

- `bump` → `BusinessDocument`:

```js
bump(p.gr, session)
```

**Ví dụ:** Nhập 70 rồi đảo 70 tạo ròng 0; GR gốc vẫn POSTED, reader trả reversed=true.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function reverseReceipt(user, receiptId, input) {
  rights(user, 'reverse');
  return command(user, 'REVERSE_PURCHASE_RECEIPT', receiptId, input, async (session, key, hash) => {
    const p = await preflight(user, receiptId, session); version(p.gr, input.expectedVersion); version(p.po, input.expectedPoVersion);
    await evidenceFor(user, p.gr._id, input.evidenceIds, session, true);
    if (!p.canReverse) fail('REVERSAL_DEPENDENCY', 'Không đủ điều kiện đảo GR', { blockers: p.blockers });
    await guardLocations(p.locations.map(l => l._id), session);
    const posting = await batch(p.gr, user, key, hash, session, { operation: 'REVERSE', reversalOf: p.roots[0]._id });
    for (const placement of p.placements) {
      const b = await read(m.StockBalance.findById(placement.sourceBalanceId), session);
      const numbers = await adjust(b, exact(placement.receivedQtyBase).negated(), session);
      await save(m.StockMovement, { batchId: posting._id, documentId: p.gr._id, lineId: placement.receiptLineId, fromBalanceId: b._id, qtyBase: placement.receivedQtyBase, fromBefore: numbers.before, fromAfter: numbers.after }, session);
      const changed = await m.ReceiptPlacement.updateOne({ _id: placement._id, version: placement.version }, { $set: { reversedQtyBase: placement.receivedQtyBase }, $inc: { version: 1 } }, { session });
      if (changed.matchedCount !== 1) fail('VERSION', 'Nguồn GR vừa đổi');
    }
    const event = await save(m.PurchaseEvent, { purchaseOrderId: p.po._id, documentId: p.gr._id, kind: 'REVERSAL', sourcePoVersion: p.po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, postingBatchId: posting._id }, session);
    const q = await purchaseOrderQuantities(p.po, session);
    if (q.some(r => r.quantityState !== 'KNOWN')) fail('SOURCE', 'Không thể đối soát PO sau đảo');
    await bump(p.po, session, { workflowStatus: q.every(r => exact(r.netPostedReceiptQtyBase).isZero()) ? 'OPEN' : 'PARTIAL' });
    return { document: await bump(p.gr, session), eventId: event._id, postingBatchId: posting._id };
  });
}
```

</details>

<a id="fn-259"></a>

## replaceInspection()

**Code:** [purchase-correction.service.js:81](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:81).

**Tham số:** `replaceInspection(user, inspectionId, input)`.

**Công việc:** Tạo bản kiểm nhận thay thế thuộc cùng chuyến gốc.

**Xử lý theo thứ tự:**

1. Cần quyền create/update; original CONFIRMED và version đúng, PO version và chứng cứ đúnginspection.
2. Đọc GR gốc: DRAFT thì hủy; POSTED phải có REVERSAL event trước.
3. Bump PO, activePo lại; prepare các dòng mới.
4. Save CORRECTION event, inspection DRAFT mới giữ arrivedAt gốc/root/replaces/correction refs.
5. writeRows, links và bump original; command lưu kết quả nguyên tử.

**Đường dẫn gọi tới hàm này:** `POST /api/po-inspections/:id/corrections` ([route dòng 36](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:36)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [evidenceFor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-255), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244), [activePo()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-219), [prepare()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-221), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [header()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-223), [writeRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-222), [link()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-242).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `m.BusinessDocument`, tại [dòng 88](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:88). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.findOne({ documentKind: 'GR_PURCHASE', 'header.poInspectionId': original._id })
```

- Đọc một bản ghi qua `m.PurchaseEvent`, tại [dòng 91](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-correction.service.js:91). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvent.findOne({ documentId: gr._id, kind: 'REVERSAL' })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `bump` → `BusinessDocument`:

```js
bump(gr, session, { workflowStatus: 'CANCELLED' })
```

- `bump` → `BusinessDocument`:

```js
bump(po, session)
```

- `save` → `m.PurchaseEvent`:

```js
save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: original._id, kind: 'CORRECTION', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, relatedDocumentId: replacementId }, session)
```

- `save` → `m.BusinessDocument`:

```js
save(m.BusinessDocument, { _id: replacementId, documentNo: 'PO_INSPECTION-' + replacementId, documentKind: 'PO_INSPECTION', workflowStatus: 'DRAFT', version: 1, createdBy: user._id,
      header: { ...header(nextPo, input, input.operationKey), arrivedAt: original.header.arrivedAt, rootInspectionId: original.header.rootInspectionId ?? original._id, replacesInspectionId: original._id, correctionId: event._id } }, session)
```

- `link` → `DocumentLink`:

```js
link(original, d, 'CORRECTION', session)
```

- `link` → `DocumentLink`:

```js
link(po, d, 'PO_INSPECTION', session)
```

- `bump` → `BusinessDocument`:

```js
bump(original, session)
```

**Ví dụ:** Chốt 70 nhưng chưa post, sửa thành 60: GR 70 bịhủy, bản mới 60 phải confirm/post lại; vẫn chỉ một chuyến.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function replaceInspection(user, inspectionId, input) {
  rights(user, 'update'); rights(user, 'create');
  return command(user, 'CORRECT_PO_INSPECTION', inspectionId, input, async session => {
    const original = await scoped(user, inspectionId, 'PO_INSPECTION', session); version(original, input.expectedVersion);
    if (original.workflowStatus !== 'CONFIRMED') fail('STATE', 'Chỉ thay thế hồ sơ đã chốt');
    const po = await scoped(user, original.header.purchaseOrderId, 'PO', session); version(po, input.expectedPoVersion);
    await evidenceFor(user, original._id, input.evidenceIds, session, true);
    const gr = await read(m.BusinessDocument.findOne({ documentKind: 'GR_PURCHASE', 'header.poInspectionId': original._id }), session);
    if (!gr) fail('SOURCE', 'Thiếu GR gốc');
    if (gr.workflowStatus === 'POSTED') {
      const reversal = await read(m.PurchaseEvent.findOne({ documentId: gr._id, kind: 'REVERSAL' }), session);
      if (!reversal) fail('STATE', 'Phải đảo GR đã post trước khi tạo bản sửa');
    } else if (!['DRAFT','CANCELLED'].includes(gr.workflowStatus)) fail('STATE', 'GR không thể thay thế');
    if (gr.workflowStatus === 'DRAFT') await bump(gr, session, { workflowStatus: 'CANCELLED' });
    // SourcePoVersion on the replacement must reflect the PO guard that releases the old GR.
    const nextPo = await bump(po, session);
    await activePo(user, po._id, nextPo.version, session);
    const prepared = await prepare(user, nextPo, input, session);
    const replacementId = new mongoose.Types.ObjectId();
    const event = await save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: original._id, kind: 'CORRECTION', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, relatedDocumentId: replacementId }, session);
    const d = await save(m.BusinessDocument, { _id: replacementId, documentNo: 'PO_INSPECTION-' + replacementId, documentKind: 'PO_INSPECTION', workflowStatus: 'DRAFT', version: 1, createdBy: user._id,
      header: { ...header(nextPo, input, input.operationKey), arrivedAt: original.header.arrivedAt, rootInspectionId: original.header.rootInspectionId ?? original._id, replacesInspectionId: original._id, correctionId: event._id } }, session);
    await writeRows(d._id, prepared, session); await link(original, d, 'CORRECTION', session); await link(po, d, 'PO_INSPECTION', session);
    await bump(original, session);
    return { document: d, eventId: event._id, relatedDocumentId: original._id };
  });
}
```

</details>

<a id="fn-260"></a>

## evidenceStorage.upload()

**Code:** [purchase-evidence.service.js:14](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:14).

**Tham số:** `evidenceStorage.upload(buffer, options)`.

**Công việc:** Gửi bytes của chứng cứ tới dịch vụ lưu tệp.

**Xử lý theo thứ tự:**

1. Tạo upload_stream với options và timeout 20 giây.
2. Ghi buffer; callback lỗi đổi thành 502, thành công trả phản hồi storage.

**Ai gọi / gọi tiếp:** Được gọi bởi [uploadEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-267). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Không mở transaction MongoDB để chờ tải ảnh; uploadEvidence ghi intent trước/sau riêng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
upload: (buffer, options) => new Promise((resolve, reject) => cloudinary.uploader.upload_stream({ ...options, timeout: 20000 }, (e, r) => e ? reject(new ApiError(502, 'Không lưu được chứng cứ')) : resolve(r)).end(buffer))
```

</details>

<a id="fn-261"></a>

## evidenceStorage.exists()

**Code:** [purchase-evidence.service.js:15](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:15).

**Tham số:** `evidenceStorage.exists(key, resourceType)`.

**Công việc:** Hỏi dịch vụ lưu tệp xem object đã được lưu ở chế độ xác thực chưa.

**Xử lý theo thứ tự:**

1. cloudinary.api.resource theo key/resourceType/type authenticated.

**Ai gọi / gọi tiếp:** Được gọi bởi [attachEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-268). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Trước attach kiểm tệp thật có trênstorage; không chỉ dựa READY trongMongoDB.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
exists: (key, resourceType) => cloudinary.api.resource(key, { resource_type: resourceType, type: 'authenticated' })
```

</details>

<a id="fn-262"></a>

## evidenceStorage.destroy()

**Code:** [purchase-evidence.service.js:16](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:16).

**Tham số:** `evidenceStorage.destroy(key, resourceType)`.

**Công việc:** Xóa tệp upload bỏ dở ở dịch vụ lưu tệp.

**Xử lý theo thứ tự:**

1. Gọi destroy với resourceType, authenticated và invalidate.
2. Kết quả phải được cleanup kiểm trước đánh dấu DELETED.

**Ai gọi / gọi tiếp:** Được gọi bởi [cleanupPurchaseEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-272). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** TệpREADY hết hạn không gắn hồ sơ mới được dọn; không xóa Evidence đãATTACHED qua đây.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
destroy: (key, resourceType) => cloudinary.uploader.destroy(key, { resource_type: resourceType, type: 'authenticated', invalidate: true })
```

</details>

<a id="fn-263"></a>

## evidenceStorage.download()

**Code:** [purchase-evidence.service.js:17](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:17).

**Tham số:** `evidenceStorage.download(key, format, resourceType, expiresAt)`.

**Công việc:** Tạo đường tải có chữ ký và hạn dùng.

**Xử lý theo thứ tự:**

1. Gọi private_download_url với key/format/type/resourceType/expires_at và attachment=true.
2. Không tải nội dung hoặc đọc MongoDB trong wrapper.

**Ai gọi / gọi tiếp:** Được gọi bởi [downloadEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-271). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Đường tải 60 giây được tạo sau khi downloadEvidence kiểm quyền hồ sơ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
download: (key, format, resourceType, expiresAt) => cloudinary.utils.private_download_url(key, format, { resource_type: resourceType, type: 'authenticated', expires_at: expiresAt, attachment: true })
```

</details>

<a id="fn-264"></a>

## parent()

**Code:** [purchase-evidence.service.js:19](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:19).

**Tham số:** `parent(user, documentId, write = false, session = null)`.

**Công việc:** Đọc hồ sơ và kiểm quyền chứng cứ theo loại phiếu, phân biệt đọc/ghi.

**Xử lý theo thứ tự:**

1. write dùng scoped; read dùng scopedPurchaseRead.
2. PO kiểm purchase_order quyền tương ứng; inspection/GR dùng goods_receipt_inspection; TO mua dùng putaway_task.
3. Loại không hỗ trợ thì 404.

**Ai gọi / gọi tiếp:** Được gọi bởi [writableParent()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-265), [listEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-270), [downloadEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-271). Gọi tiếp [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [scopedPurchaseRead()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-238), [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.BusinessDocument.findOne`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Kế toán đọc chứng cứGR mọi kho theo ngoại lệđọc, nhưng ghi chứng cứ vẫn bị kiểm kho và vai trò.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function parent(user, documentId, write = false, session = null) {
  const d = await (write ? scoped(user, documentId, null, session) : scopedPurchaseRead(user, documentId, null, session));
  if (d.documentKind === 'PO') requirePermission(user, 'purchase_order:' + (write ? 'update' : 'read'), write ? ['ACCOUNTANT','OWNER'] : ['OWNER','ACCOUNTANT','WAREHOUSE']);
  else if (['PO_INSPECTION','GR_PURCHASE'].includes(d.documentKind)) requirePermission(user, 'goods_receipt_inspection:' + (write ? 'update' : 'read'), write ? ['WAREHOUSE'] : ['OWNER','ACCOUNTANT','WAREHOUSE']);
  else if (d.documentKind === 'TO' && d.header.receiptId) requirePermission(user, 'putaway_task:' + (write ? 'confirm' : 'read'), write ? ['WAREHOUSE'] : ['OWNER','WAREHOUSE']);
  else throw notFoundError();
  // Owner can attach evidence to a PO exception only through the explicit exception authority.
  return d;
}
```

</details>

<a id="fn-265"></a>

## writableParent()

**Code:** [purchase-evidence.service.js:28](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:28).

**Tham số:** `writableParent(user, documentId, session)`.

**Công việc:** Chọn quyền hợp lệ khi gắn chứng cứ vào hồ sơ.

**Xử lý theo thứ tự:**

1. scoped hồ sơ theo quyền kho ghi.
2. PO cho ACCOUNTANT:update hoặc OWNER:approve_exception.
3. Các loại khác chuyển parent(write=true).

**Ai gọi / gọi tiếp:** Được gọi bởi [uploadEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-267), [attachEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-268). Gọi tiếp [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295), [parent()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-264).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.BusinessDocument.findOne`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Chủ có thể chuẩn bị chứng cứ cho quyết định chốt thiếu qua quyềnngoại lệ, không tự được mọi quyền kế toán.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function writableParent(user, documentId, session) {
  const d = await scoped(user, documentId, null, session);
  if (d.documentKind === 'PO') {
    try { requirePermission(user, 'purchase_order:update', ['ACCOUNTANT']); }
    catch { requirePermission(user, 'purchase_order:approve_exception', ['OWNER']); }
    return d;
  }
  return parent(user, documentId, true, session);
}
```

</details>

<a id="fn-266"></a>

## inspectFile()

**Code:** [purchase-evidence.service.js:37](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:37).

**Tham số:** `inspectFile(file)`.

**Công việc:** Kiểm bytes thực là JPEG/PNG/PDF đủ giới hạn.

**Xử lý theo thứ tự:**

1. Không cóbuffer hoặc quá 5 MB thì lỗi.
2. Nhận chữ kýPNG và giải mãCRC/giới hạn 10 MP; JPEG kiểm đầu/cuối và decode an toàn.
3. PDF cần header/EOF, load được và 1..2000 trang.
4. Trả mediaType/resourceType/format; lỗi nội dung thì 400.

**Ai gọi / gọi tiếp:** Được gọi bởi [uploadEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-267). Gọi tiếp [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Đổi tên tệp text thành.png không qua; kiểm này không đọc database.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function inspectFile(file) {
  if (!file?.buffer?.length) throw validationError('Thiếu tệp chứng cứ');
  const bytes = file.buffer;
  if (bytes.length > MAX_BYTES) throw new ApiError(413, 'Chứng cứ tối đa 5 MB', { code: 'ERR-REC-FILE_SIZE' });
  try {
    if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
      if (bytes.length < 24 || bytes.readUInt32BE(16) * bytes.readUInt32BE(20) > 10000000) throw new Error('Image too large');
      PNG.sync.read(bytes, { checkCRC: true }); return { mediaType: 'image/png', resourceType: 'image', format: 'png' };
    }
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217) {
      jpeg.decode(bytes, { maxResolutionInMP: 10, maxMemoryUsageInMB: 64, tolerantDecoding: false });
      return { mediaType: 'image/jpeg', resourceType: 'image', format: 'jpg' };
    }
    if (bytes.subarray(0, 5).toString() === '%PDF-' && bytes.subarray(Math.max(0, bytes.length - 1024)).includes(Buffer.from('%%EOF'))) {
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
      if (pdf.getPageCount() < 1 || pdf.getPageCount() > 2000) throw new Error('Invalid page count');
      return { mediaType: 'application/pdf', resourceType: 'raw', format: 'pdf' };
    }
  } catch { throw validationError('Nội dung JPEG/PNG/PDF không hợp lệ'); }
  throw validationError('Chỉ nhận nội dung JPEG, PNG hoặc PDF thật');
}
```

</details>

<a id="fn-267"></a>

## uploadEvidence()

**Code:** [purchase-evidence.service.js:58](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:58).

**Tham số:** `uploadEvidence(user, documentId, file, lineId = null)`.

**Công việc:** Tải chứng cứ riêng tư và ghi trạng thái chuẩn bị, chưa gắn hồ sơ.

**Xử lý theo thứ tự:**

1. writableParent; lineId nếu có phải thuộcrows củaphiếu; inspectFile.
2. Tạo key tựsinh/hash/bytes/expiry 24 h, save PurchaseEvidenceUpload UPLOADING.
3. Upload ngoài transaction, kiểm public_id/type authenticated rồi update READY.
4. Lỗi storage giữdấu vết và đặt expiry để dọn, không tạo Evidence giả.

**Đường dẫn gọi tới hàm này:** `POST /api/purchase-documents/:id/evidence/uploads` ([route dòng 67](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:67)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [writableParent()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-265), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [inspectFile()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-266), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [evidenceStorage.upload()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-260).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Cập nhật một bản ghi qua `m.PurchaseEvidenceUpload`, tại [dòng 69](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:69). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvidenceUpload.updateOne({ _id: intent._id, status: 'UPLOADING' }, { $set: { status: 'READY' } })
```

- Cập nhật một bản ghi qua `m.PurchaseEvidenceUpload`, tại [dòng 73](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:73). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvidenceUpload.updateOne({ _id: intent._id, status: 'UPLOADING' }, { $set: { expiresAt: new Date() } })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.PurchaseEvidenceUpload`:

```js
save(m.PurchaseEvidenceUpload, { _id: uploadId, documentId, ...(lineId && { lineId }), actorId: user._id, objectKey,
    ...type, sha256: createHash('sha256').update(file.buffer).digest('hex'), bytes: file.buffer.length, status: 'UPLOADING', expiresAt: new Date(Date.now() + 86400000) })
```

**Ví dụ:** Ảnh đã lên nhưng chưaattach vẫn chỉ là tệpbỏdở có thể bịdọn sauhết hạn.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function uploadEvidence(user, documentId, file, lineId = null) {
  await writableParent(user, documentId);
  if (lineId && !(await rows(documentId)).some(l => same(l._id, lineId))) throw notFoundError();
  const type = await inspectFile(file);
  const uploadId = new mongoose.Types.ObjectId();
  const objectKey = 'sep490/purchase-evidence/' + uploadId + (type.resourceType === 'raw' ? '.pdf' : '');
  const intent = await save(m.PurchaseEvidenceUpload, { _id: uploadId, documentId, ...(lineId && { lineId }), actorId: user._id, objectKey,
    ...type, sha256: createHash('sha256').update(file.buffer).digest('hex'), bytes: file.buffer.length, status: 'UPLOADING', expiresAt: new Date(Date.now() + 86400000) });
  try {
    const stored = await evidenceStorage.upload(file.buffer, { public_id: objectKey, resource_type: type.resourceType, type: 'authenticated', overwrite: false });
    if (stored.public_id !== objectKey || stored.type !== 'authenticated') throw new ApiError(502, 'Storage không xác nhận tệp private');
    await m.PurchaseEvidenceUpload.updateOne({ _id: intent._id, status: 'UPLOADING' }, { $set: { status: 'READY' } });
    return { uploadIntentId: id(intent._id), expiresAt: intent.expiresAt.toISOString(), mediaType: type.mediaType, bytes: file.buffer.length };
  } catch (e) {
    // Keep a traceable orphan for cleanup even when the provider response was lost.
    await m.PurchaseEvidenceUpload.updateOne({ _id: intent._id, status: 'UPLOADING' }, { $set: { expiresAt: new Date() } });
    throw e;
  }
}
```

</details>

<a id="fn-268"></a>

## attachEvidence()

**Code:** [purchase-evidence.service.js:77](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:77).

**Tham số:** `attachEvidence(user, documentId, input)`.

**Công việc:** Gắn tệpREADY vào đúng hồ sơ trong giao dịch.

**Xử lý theo thứ tự:**

1. Kiểm writableParent và upload đúng actor/document.
2. Nếu READY hỏi storage.exists ngoài transaction.
3. Trong command kiểm lại parent/version, intent READY/chưaexpiry và line còn tồn tại.
4. Save Evidence, đổi intent ATTACHED/evidenceId bằng điều kiện trạng thái, bump hồ sơ.
5. Replay đúngkey khôngtạo haiEvidence.

**Đường dẫn gọi tới hàm này:** `POST /api/purchase-documents/:id/evidence/attach` ([route dòng 68](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:68)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [writableParent()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-265), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [evidenceStorage.exists()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-261), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [versionCheck()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-269), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `m.PurchaseEvidenceUpload`, tại [dòng 79](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:79). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvidenceUpload.findOne({ _id: input.uploadIntentId, documentId, actorId: user._id })
```

- Đọc một bản ghi qua `m.PurchaseEvidenceUpload`, tại [dòng 88](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:88). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvidenceUpload.findOne({ _id: input.uploadIntentId, documentId, actorId: user._id, status: 'READY', expiresAt: { $gt: new Date() } })
```

- Cập nhật một bản ghi qua `m.PurchaseEvidenceUpload`, tại [dòng 92](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:92). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvidenceUpload.updateOne({ _id: intent._id, status: 'READY' }, { $set: { status: 'ATTACHED', evidenceId: evidence._id } }, { session })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `save` → `m.Evidence`:

```js
save(m.Evidence, { documentId, ...(intent.lineId && { lineId: intent.lineId }), objectKey: intent.objectKey, sha256: intent.sha256, mediaType: intent.mediaType, uploadedBy: user._id }, session)
```

- `bump` → `BusinessDocument`:

```js
bump(d, session)
```

**Ví dụ:** Upload choPO A không gắn được sangPO B hoặc dưới người tải khác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function attachEvidence(user, documentId, input) {
  await writableParent(user, documentId);
  const upload = await read(m.PurchaseEvidenceUpload.findOne({ _id: input.uploadIntentId, documentId, actorId: user._id }));
  if (!upload) throw notFoundError();
  // No external I/O inside the transaction. READY/actor/parent are checked again atomically below.
  if (upload.status === 'READY') {
    try { await evidenceStorage.exists(upload.objectKey, upload.resourceType); }
    catch { throw new ApiError(502, 'Tệp chưa tồn tại trên storage'); }
  }
  return command(user, 'ATTACH_PURCHASE_EVIDENCE', documentId, input, async session => {
    const d = await writableParent(user, documentId, session); versionCheck(d, input.expectedVersion);
    const intent = await read(m.PurchaseEvidenceUpload.findOne({ _id: input.uploadIntentId, documentId, actorId: user._id, status: 'READY', expiresAt: { $gt: new Date() } }), session);
    if (!intent) fail('EVIDENCE', 'Upload đã hết hạn, đang dọn hoặc đã gắn vào hồ sơ');
    if (intent.lineId && !(await rows(documentId, session)).some(l => same(l._id, intent.lineId))) fail('EVIDENCE', 'Dòng nguồn không còn tồn tại');
    const evidence = await save(m.Evidence, { documentId, ...(intent.lineId && { lineId: intent.lineId }), objectKey: intent.objectKey, sha256: intent.sha256, mediaType: intent.mediaType, uploadedBy: user._id }, session);
    const changed = await m.PurchaseEvidenceUpload.updateOne({ _id: intent._id, status: 'READY' }, { $set: { status: 'ATTACHED', evidenceId: evidence._id } }, { session });
    if (changed.matchedCount !== 1) fail('EVIDENCE', 'Upload vừa được xử lý');
    return { document: await bump(d, session), evidenceId: evidence._id };
  });
}
```

</details>

<a id="fn-269"></a>

## versionCheck()

**Code:** [purchase-evidence.service.js:97](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:97).

**Tham số:** `versionCheck(d, expected)`.

**Công việc:** Kiểm phiên bản hồ sơ trong bước gắn tệp.

**Xử lý theo thứ tự:**

1. So d.version với expected; khác thì ERR-REC-VERSION kèm currentVersion.

**Ai gọi / gọi tiếp:** Được gọi bởi [attachEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-268). Gọi tiếp [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Có người vừa gắn tệp khác tăngversion thì attach phải tải tình trạng mới.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function versionCheck(d, expected) { if (d.version !== expected) fail('VERSION', 'Hồ sơ đã thay đổi', { currentVersion: d.version }); }
```

</details>

<a id="fn-270"></a>

## listEvidence()

**Code:** [purchase-evidence.service.js:98](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:98).

**Tham số:** `listEvidence(user, documentId)`.

**Công việc:** Đọc thông tin an toàn của chứng cứ thuộc hồ sơ.

**Xử lý theo thứ tự:**

1. parent(read) kiểm quyền.
2. Evidence.find documentId, select mã/dòng/media/người/thời điểm.
3. serialize, không trả objectKey/hash.

**Đường dẫn gọi tới hàm này:** `GET /api/purchase-documents/:id/evidence` ([route dòng 65](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:65)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [parent()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-264), [serialize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-245).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.Evidence`, tại [dòng 100](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:100). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Evidence.find({ documentId }).select('_id lineId mediaType uploadedBy uploadedAt').lean()
```

**Ví dụ:** Biết danh sáchảnh không có nghĩa được mộtđường URL côngkhai lâu dài.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function listEvidence(user, documentId) {
  await parent(user, documentId);
  const found = await m.Evidence.find({ documentId }).select('_id lineId mediaType uploadedBy uploadedAt').lean();
  return serialize({ items: found });
}
```

</details>

<a id="fn-271"></a>

## downloadEvidence()

**Code:** [purchase-evidence.service.js:103](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:103).

**Tham số:** `downloadEvidence(user, documentId, evidenceId)`.

**Công việc:** Cho tải chứng cứ đã gắn sau kiểm quyền lại.

**Xử lý theo thứ tự:**

1. parent(read); tìm upload ATTACHED đúngdocument/evidenceId.
2. Kiểm Evidence đúng hồ sơ cũng tồn tại.
3. Tạo đường ký 60 giây qua evidenceStorage.download và trả expiry.

**Đường dẫn gọi tới hàm này:** `GET /api/purchase-documents/:id/evidence/:evidenceId/download` ([route dòng 69](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:69)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [parent()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-264), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [evidenceStorage.download()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-263).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `m.PurchaseEvidenceUpload`, tại [dòng 105](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:105). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvidenceUpload.findOne({ documentId, evidenceId, status: 'ATTACHED' })
```

- Kiểm có bản ghi hay không qua `m.Evidence`, tại [dòng 106](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:106). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Evidence.exists({ _id: evidenceId, documentId })
```

**Ví dụ:** Copy evidenceId từkho ngoài quyền không giúp mởtệp.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function downloadEvidence(user, documentId, evidenceId) {
  await parent(user, documentId);
  const intent = await read(m.PurchaseEvidenceUpload.findOne({ documentId, evidenceId, status: 'ATTACHED' }));
  if (!intent || !await m.Evidence.exists({ _id: evidenceId, documentId })) throw notFoundError();
  const expiresAt = Math.floor(Date.now() / 1000) + 60;
  return { url: evidenceStorage.download(intent.objectKey, intent.format, intent.resourceType, expiresAt), expiresAt: new Date(expiresAt * 1000).toISOString() };
}
```

</details>

<a id="fn-272"></a>

## cleanupPurchaseEvidence()

**Code:** [purchase-evidence.service.js:110](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:110).

**Tham số:** `cleanupPurchaseEvidence({ now = new Date(), limit = 100 } = {})`.

**Công việc:** Dọn upload hết hạn mà không xóa chứng cứ đã gắn.

**Xử lý theo thứ tự:**

1. Lặp tối đa limit 100 mặc định; findOneAndUpdate trạng thái UPLOADING/READY/DELETING hết hạn sangDELETING, hạnthử sau 5 phút.
2. Xóa storage ngoài transaction; chỉ chấp nhận ok/not found.
3. Update DELETED và cộngremoved; xóa lỗi để lạiDELETING cho lần sau.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Gọi tiếp [evidenceStorage.destroy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-262).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Cập nhật rồi lấy bản ghi kết quả qua `m.PurchaseEvidenceUpload`, tại [dòng 113](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:113). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvidenceUpload.findOneAndUpdate({ status: { $in: ['UPLOADING','READY','DELETING'] }, expiresAt: { $lte: now } }, { $set: { status: 'DELETING', expiresAt: new Date(now.getTime() + 300000) } }, { returnDocument: 'after' }).lean()
```

- Cập nhật một bản ghi qua `m.PurchaseEvidenceUpload`, tại [dòng 118](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-evidence.service.js:118). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvidenceUpload.updateOne({ _id: intent._id, status: 'DELETING' }, { $set: { status: 'DELETED' } })
```

**Ví dụ:** ATTACHED không khớp điều kiện lấyviệc nên không bịdọnnhư tệpbỏdở.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function cleanupPurchaseEvidence({ now = new Date(), limit = 100 } = {}) {
  let removed = 0;
  for (let i = 0; i < limit; i += 1) {
    const intent = await m.PurchaseEvidenceUpload.findOneAndUpdate({ status: { $in: ['UPLOADING','READY','DELETING'] }, expiresAt: { $lte: now } }, { $set: { status: 'DELETING', expiresAt: new Date(now.getTime() + 300000) } }, { returnDocument: 'after' }).lean();
    if (!intent) break;
    // A failed destroy leaves DELETING for a later retry. ATTACHED can never match the claim.
    const result = await evidenceStorage.destroy(intent.objectKey, intent.resourceType);
    if (!['ok','not found'].includes(result.result)) throw new ApiError(502, 'Không dọn được upload mồ côi');
    await m.PurchaseEvidenceUpload.updateOne({ _id: intent._id, status: 'DELETING' }, { $set: { status: 'DELETED' } });
    removed += 1;
  }
  return { removed };
}
```

</details>

<a id="fn-273"></a>

## permit()

**Code:** [purchase-putaway.service.js:8](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:8).

**Tham số:** `permit(u, action)`.

**Công việc:** Kiểm quyền nhiệm vụ cất hàng.

**Xử lý theo thứ tự:**

1. Gọi rights với putaway_task:action.
2. Đọc cho OWNER/WAREHOUSE; các lệnh ghi chỉ WAREHOUSE.

**Ai gọi / gọi tiếp:** Được gọi bởi [putawayContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-277), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [getPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-280), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281), [cancelPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-282). Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Kế toán xem GR không đồng nghĩa có quyền xác nhận nhiệm vụ cất.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
permit = (u, action) => rights(u, action, 'putaway_task', action === 'read' ? ['OWNER', 'WAREHOUSE'] : ['WAREHOUSE'])
```

</details>

<a id="fn-274"></a>

## placementQuantities()

**Code:** [purchase-putaway.service.js:9](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:9).

**Tham số:** `placementQuantities(p)`.

**Công việc:** Tính lượng nhận còn chưa cất và chưa có kế hoạch.

**Xử lý theo thứ tự:**

1. unplaced=received−reversed−placed.
2. unplanned=unplaced−claimed; âm thì lỗi PROVENANCE.
3. Trả các lượng dạng chuỗi cùng placementVersion.

**Ai gọi / gọi tiếp:** Được gọi bởi [putawayContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-277), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [enriched()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-285). Gọi tiếp [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Nhận 70, cất 20, nhiệm vụ giữ 30: chưa cất 50, chưa lập việc 20.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
placementQuantities = p => {
  const unplaced = exact(p.receivedQtyBase).minus(exact(p.reversedQtyBase)).minus(exact(p.placedQtyBase));
  const unplanned = unplaced.minus(exact(p.claimedQtyBase));
  if (unplaced.isNegative() || unplanned.isNegative()) fail('PROVENANCE', 'Projection xếp kho không hợp lệ');
  return { receivedQtyBase: p.receivedQtyBase.toString(), placedQtyBase: p.placedQtyBase.toString(), claimedQtyBase: p.claimedQtyBase.toString(), unplacedQtyBase: unplaced.toString(), unplannedQtyBase: unplanned.toString(), placementVersion: p.version };
}
```

</details>

<a id="fn-275"></a>

## updatePlacement()

**Code:** [purchase-putaway.service.js:15](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:15).

**Tham số:** `updatePlacement(p, session, { claimDelta = '0', placedDelta = '0' })`.

**Công việc:** Cập nhật phần việc đang giữ và lượng đã cất có kiểm version.

**Xử lý theo thứ tự:**

1. Cộng claimDelta/placedDelta vào số hiện tại.
2. Chặn âm hoặc claimed+placed+reversed>received.
3. Update ReceiptPlacement theo _id/version, set hai lượng và tăng version.
4. Không matched thì báo nguồn vừa đổi.

**Ai gọi / gọi tiếp:** Được gọi bởi [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281), [cancelPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-282). Gọi tiếp [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Cập nhật một bản ghi qua `m.ReceiptPlacement`, tại [dòng 18](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:18). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ReceiptPlacement.updateOne({ _id: p._id, version: p.version }, { $set: { claimedQtyBase: claimed.toString(), placedQtyBase: placed.toString() }, $inc: { version: 1 } }, { session, runValidators: true })
```

**Ví dụ:** Xác nhận cất 20 làm claimed−20, placed+20; không làm received tăng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function updatePlacement(p, session, { claimDelta = '0', placedDelta = '0' }) {
  const claimed = exact(p.claimedQtyBase).plus(exact(claimDelta)); const placed = exact(p.placedQtyBase).plus(exact(placedDelta));
  if (claimed.isNegative() || placed.isNegative() || claimed.plus(placed).plus(exact(p.reversedQtyBase)).gt(exact(p.receivedQtyBase))) fail('PROVENANCE', 'Lượng kế hoạch/thực cất vượt nguồn GR');
  const write = await m.ReceiptPlacement.updateOne({ _id: p._id, version: p.version }, { $set: { claimedQtyBase: claimed.toString(), placedQtyBase: placed.toString() }, $inc: { version: 1 } }, { session, runValidators: true });
  if (write.matchedCount !== 1) fail('VERSION', 'Nguồn GR vừa có task khác xử lý');
}
```

</details>

<a id="fn-276"></a>

## source()

**Code:** [purchase-putaway.service.js:21](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:21).

**Tham số:** `source(user, gr, receiptLine, p, destinationId, session)`.

**Công việc:** Kiểm nguồn GR và đích cất vẫn đủ điều kiện.

**Xử lý theo thứ tự:**

1. Đọc kho, balance, account, lot, product, owner.
2. Kiểm nguồn STORE/GOOD, đúng sản phẩm/lô và đúng receivingLocation của dòng GR.
3. Đọc/kiểm nguồn RECEIVING và đích STORAGE cùng kho.
4. Đích allocatable cần lot VERIFIED; nguồn không có hold ACTIVE.

**Ai gọi / gọi tiếp:** Được gọi bởi [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281). Gọi tiếp [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [location()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-250).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `m.Warehouse`, tại [dòng 22](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:22). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Warehouse.findById(gr.header.warehouseId)
```

- Đọc theo mã _id qua `m.StockBalance`, tại [dòng 23](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:23). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.StockBalance.findById(p.sourceBalanceId)
```

- Đọc theo mã _id qua `m.StockAccount`, tại [dòng 24](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:24). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.StockAccount.findById(b.accountId)
```

- Đọc theo mã _id qua `m.Lot`, tại [dòng 25](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:25). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Lot.findById(receiptLine.lotId)
```

- Đọc theo mã _id qua `m.Product`, tại [dòng 26](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:26). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Product.findById(receiptLine.productId)
```

- Đọc theo mã _id qua `m.Party`, tại [dòng 27](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:27). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Party.findById(b.ownerPartyId)
```

- Kiểm có bản ghi hay không qua `m.DefectHold`, tại [dòng 32](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:32). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DefectHold.exists({ balanceId: b._id, status: 'ACTIVE' }).session(session)
```

**Ví dụ:** Lô UNKNOWN đã vàoReceiving nhưng không được cất vào ô cho cấp hàng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function source(user, gr, receiptLine, p, destinationId, session) {
  const wh = await read(m.Warehouse.findById(gr.header.warehouseId), session);
  const b = await read(m.StockBalance.findById(p.sourceBalanceId), session);
  const account = b && await read(m.StockAccount.findById(b.accountId), session);
  const lot = await read(m.Lot.findById(receiptLine.lotId), session);
  const product = await read(m.Product.findById(receiptLine.productId), session);
  const owner = b && await read(m.Party.findById(b.ownerPartyId), session);
  if (!wh?.isActive || !b || !lot || !product?.isActive || !same(lot.productId, product._id) || !same(b.lotId, lot._id) || b.qualityCode !== 'GOOD' || owner?.kind !== 'STORE' || !same(account?.locationId, receiptLine.details.receivingLocationId)) fail('SOURCE', 'Nguồn put-away không hợp lệ');
  await location(user, account.locationId, gr.header.warehouseId, ['RECEIVING'], session);
  const to = await location(user, destinationId, gr.header.warehouseId, ['STORAGE'], session);
  if (to.allocatable && lot.identificationStatus !== 'VERIFIED') fail('LOT', 'Lô chưa xác minh không được cất vào vị trí cấp hàng');
  if (await m.DefectHold.exists({ balanceId: b._id, status: 'ACTIVE' }).session(session)) fail('HOLD', 'Nguồn đang bị giữ do lỗi');
  return { b, product, to, sourceLocationId: account.locationId };
}
```

</details>

<a id="fn-277"></a>

## putawayContext()

**Code:** [purchase-putaway.service.js:35](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:35).

**Tham số:** `putawayContext(user, receiptId)`.

**Công việc:** Đọc số lượng, phiên bản và vị trí để lập nhiệm vụ cất.

**Xử lý theo thứ tự:**

1. Kiểm quyền đọc/scoped GR, chỉ POSTED.
2. Đọc dòng/placements/locations STORAGE active/tasks củaGR, rồi số dư nguồn.
3. Mỗi dòng ghép placementQuantities, sourceBalanceId và sourceBalanceVersion.

**Đường dẫn gọi tới hàm này:** `GET /api/purchase-receipts/:id/putaway-context` ([route dòng 44](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:44)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [permit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-273), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [serialize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-245), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [placementQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-274).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.ReceiptPlacement`, tại [dòng 39](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:39). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ReceiptPlacement.find({ receiptId: gr._id })
```

- Đọc nhiều bản ghi qua `m.Location`, tại [dòng 40](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:40). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Location.find({ warehouseId: gr.header.warehouseId, kind: 'STORAGE', isActive: true })
```

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 41](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:41). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find({ documentKind: 'TO', 'header.receiptId': gr._id })
```

- Đọc nhiều bản ghi qua `m.StockBalance`, tại [dòng 43](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:43). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.StockBalance.find({ _id: { $in: placements.map(p => p.sourceBalanceId) } })
```

**Ví dụ:** PO đã nhận đủ 100 vẫn mở context để cất 70 còn nằmReceiving.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function putawayContext(user, receiptId) {
  permit(user, 'read'); const gr = await scoped(user, receiptId, 'GR_PURCHASE');
  if (gr.workflowStatus !== 'POSTED') fail('STATE', 'GR chưa post');
  const [lines, placements, locations, tasks] = await Promise.all([
    rows(gr._id), read(m.ReceiptPlacement.find({ receiptId: gr._id })),
    read(m.Location.find({ warehouseId: gr.header.warehouseId, kind: 'STORAGE', isActive: true })),
    read(m.BusinessDocument.find({ documentKind: 'TO', 'header.receiptId': gr._id })),
  ]);
  const balances = await read(m.StockBalance.find({ _id: { $in: placements.map(p => p.sourceBalanceId) } }));
  return serialize({ receiptId: gr._id, receiptVersion: gr.version, locations, tasks, lines: lines.map(l => {
    const p = placements.find(p => same(p.receiptLineId, l._id));
    return { ...l, ...(p ? placementQuantities(p) : { quantityState: 'INCOMPLETE' }), sourceBalanceId: p?.sourceBalanceId ?? null, sourceBalanceVersion: balances.find(b => same(b._id, p?.sourceBalanceId))?.version ?? null };
  }) });
}
```

</details>

<a id="fn-278"></a>

## createPutaway()

**Code:** [purchase-putaway.service.js:49](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:49).

**Tham số:** `createPutaway(user, receiptId, input)`.

**Công việc:** Lập nhiệm vụ cất từ lượng riêng của dòng GR, có chia ô.

**Xử lý theo thứ tự:**

1. Kiểm quyền, GR POSTED/version.
2. Mỗi dòng kiểm receipt line/placement.version/sourceBalance.version, source và nguyên viên.
3. guardLocations rồi tạo TO PUTAWAY OPEN.
4. Đọc lại placement cho từng phần split, kiểm unplanned và lượng task khác giữ balance.
5. Tạo WAREHOUSE_TASK line, link từGR, update claimed và liên kết phiếu.

**Đường dẫn gọi tới hàm này:** `POST /api/purchase-receipts/:id/putaway-tasks` ([route dòng 45](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:45)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [permit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-273), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-276), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [guardLocations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-251), [newDoc()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-241), [placementQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-274), [pendingTaskQuantity()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-340), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [lineLink()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-243), [updatePlacement()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-275), [link()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-242).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `m.ReceiptPlacement`, tại [dòng 57](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:57). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ReceiptPlacement.findOne({ receiptLineId: line._id })
```

- Đọc một bản ghi qua `m.ReceiptPlacement`, tại [dòng 67](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:67). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ReceiptPlacement.findOne({ receiptLineId: line._id })
```

- Đọc một bản ghi qua `m.ProductUomVersion`, tại [dòng 71](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:71). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ProductUomVersion.findOne({ productId: ctx.product._id, uomId: ctx.product.baseUomId, basePerUnit: '1', validFrom: { $lte: new Date() } }).sort({ version: -1 })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `newDoc` → `BusinessDocument`:

```js
newDoc('TO', { warehouseId: gr.header.warehouseId, taskKind: 'PUTAWAY', assignedTo: user._id, purchaseOrderId: gr.header.purchaseOrderId, receiptId: gr._id }, user, session, 'OPEN')
```

- `save` → `m.DocumentLine`:

```js
save(m.DocumentLine, { documentId: task._id, lineNo: i + 1, lineKind: 'WAREHOUSE_TASK', productId: line.productId, lotId: line.lotId, productNameSnapshot: line.productNameSnapshot,
        conversionId: conversion._id, conversionSnapshot: '1', enteredQty: r.qtyBase, qtyBase: r.qtyBase,
        details: { fromLocationId: ctx.sourceLocationId, toLocationId: r.toLocationId, qualityCode: 'GOOD', sourceBalanceId: ctx.b._id, sourceBalanceVersion: ctx.b.version, ownerPartyId: ctx.b.ownerPartyId, receiptLineId: line._id, placementId: p._id } }, session)
```

- `lineLink` → `LineLink`:

```js
lineLink(line._id, taskLine._id, r.qtyBase, session, 'PURCHASE_PUTAWAY')
```

- `updatePlacement` → `ReceiptPlacement`:

```js
updatePlacement(p, session, { claimDelta: r.qtyBase })
```

- `link` → `DocumentLink`:

```js
link(gr, task, 'PURCHASE_PUTAWAY', session)
```

**Ví dụ:** GR 70 chia 40 vàoA 1 và 30 vàoA 2; mới lập việc thì số dư vẫn 70.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function createPutaway(user, receiptId, input) {
  permit(user, 'create');
  return command(user, 'CREATE_PURCHASE_PUTAWAY', receiptId, input, async session => {
    const gr = await scoped(user, receiptId, 'GR_PURCHASE', session); version(gr, input.expectedVersion);
    if (gr.workflowStatus !== 'POSTED') fail('STATE', 'GR chưa post');
    const lines = await rows(gr._id, session); const prepared = [];
    for (const r of input.lines) {
      const line = lines.find(l => same(l._id, r.receiptLineId));
      const p = line && await read(m.ReceiptPlacement.findOne({ receiptLineId: line._id }), session);
      if (!p) throw notFoundError(); version(p, r.expectedPlacementVersion);
      const ctx = await source(user, gr, line, p, r.toLocationId, session); version(ctx.b, r.expectedSourceVersion);
      if (ctx.product.wholeBaseUnits && !exact(r.qtyBase).isInteger()) throw validationError('Số viên phải nguyên');
      prepared.push({ r, line, p, ctx });
    }
    await guardLocations(prepared.flatMap(p => [p.ctx.sourceLocationId, p.r.toLocationId]), session);
    const task = await newDoc('TO', { warehouseId: gr.header.warehouseId, taskKind: 'PUTAWAY', assignedTo: user._id, purchaseOrderId: gr.header.purchaseOrderId, receiptId: gr._id }, user, session, 'OPEN');
    for (const [i, { r, line, ctx }] of prepared.entries()) {
      // Re-read after each allocation: splitting one receipt line in this request is supported.
      const p = await read(m.ReceiptPlacement.findOne({ receiptLineId: line._id }), session);
      if (exact(r.qtyBase).gt(exact(placementQuantities(p).unplannedQtyBase))) fail('CLAIM', 'Kế hoạch vượt lượng chưa cất của GR');
      const pending = await pendingTaskQuantity(ctx.b, ctx.sourceLocationId, session);
      if (pending.plus(exact(r.qtyBase)).gt(exact(ctx.b.qtyBase))) fail('CLAIM', 'Tồn nguồn đã được task khác giữ');
      const conversion = await read(m.ProductUomVersion.findOne({ productId: ctx.product._id, uomId: ctx.product.baseUomId, basePerUnit: '1', validFrom: { $lte: new Date() } }).sort({ version: -1 }), session);
      if (!conversion) fail('UOM', 'Thiếu phiên bản đơn vị cơ sở');
      const taskLine = await save(m.DocumentLine, { documentId: task._id, lineNo: i + 1, lineKind: 'WAREHOUSE_TASK', productId: line.productId, lotId: line.lotId, productNameSnapshot: line.productNameSnapshot,
        conversionId: conversion._id, conversionSnapshot: '1', enteredQty: r.qtyBase, qtyBase: r.qtyBase,
        details: { fromLocationId: ctx.sourceLocationId, toLocationId: r.toLocationId, qualityCode: 'GOOD', sourceBalanceId: ctx.b._id, sourceBalanceVersion: ctx.b.version, ownerPartyId: ctx.b.ownerPartyId, receiptLineId: line._id, placementId: p._id } }, session);
      await lineLink(line._id, taskLine._id, r.qtyBase, session, 'PURCHASE_PUTAWAY');
      await updatePlacement(p, session, { claimDelta: r.qtyBase });
    }
    await link(gr, task, 'PURCHASE_PUTAWAY', session);
    return { document: task };
  });
}
```

</details>

<a id="fn-279"></a>

## taskState()

**Code:** [purchase-putaway.service.js:83](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:83).

**Tham số:** `taskState(user, taskId, session)`.

**Công việc:** Đọc nhiệm vụ mua và lượng đã thực cất từ lịch sử.

**Xử lý theo thứ tự:**

1. scoped TO; phải taskKind PUTAWAY và có receiptId.
2. Đọc các dòng, StockMovement và PostingBatch của task.
3. Dùng netMovedQuantity theo từng taskLine để tạo Map actual.

**Ai gọi / gọi tiếp:** Được gọi bởi [getPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-280), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281), [cancelPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-282). Gọi tiếp [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [netMovedQuantity()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-338), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.StockMovement`, tại [dòng 87](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:87). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.StockMovement.find({ documentId: task._id })
```

- Đọc nhiều bản ghi qua `m.PostingBatch`, tại [dòng 88](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:88). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PostingBatch.find({ documentId: task._id })
```

**Ví dụ:** Kế hoạch 70, đã thực hiện 20: actual 20 lấy từ movement, không suy từ status PARTIAL.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function taskState(user, taskId, session) {
  const task = await scoped(user, taskId, 'TO', session);
  if (task.header.taskKind !== 'PUTAWAY' || !task.header.receiptId) throw notFoundError();
  const lines = await rows(task._id, session);
  const movements = await read(m.StockMovement.find({ documentId: task._id }), session);
  const batches = await read(m.PostingBatch.find({ documentId: task._id }), session);
  return { task, lines, actual: new Map(lines.map(l => [id(l._id), netMovedQuantity(movements.filter(m => same(m.lineId, l._id)), batches)])) };
}
```

</details>

<a id="fn-280"></a>

## getPutaway()

**Code:** [purchase-putaway.service.js:91](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:91).

**Tham số:** `getPutaway(user, taskId)`.

**Công việc:** Trả nhiệm vụ và lượng còn lại từng dòng.

**Xử lý theo thứ tự:**

1. Kiểm quyền đọc rồi taskState.
2. Map actual và remaining=planned−actual, serialize.

**Đường dẫn gọi tới hàm này:** `GET /api/putaway-tasks/:id` ([route dòng 58](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:58)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [permit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-273), [taskState()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-279), [serialize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-245).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.StockMovement.find`, `m.PostingBatch.find`, `m.BusinessDocument.findOne`, `m.DocumentLine.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Dòng 40 đã cất 20 trả còn 20; không chỉ hiện trạng thái chung của cảtask.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getPutaway(user, taskId) {
  permit(user, 'read'); const { task, lines, actual } = await taskState(user, taskId);
  return serialize({ ...task, lines: lines.map(l => ({ ...l, actualQtyBase: actual.get(id(l._id)).toString(), remainingQtyBase: exact(l.qtyBase).minus(actual.get(id(l._id))).toString() })) });
}
```

</details>

<a id="fn-281"></a>

## confirmPutaway()

**Code:** [purchase-putaway.service.js:95](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:95).

**Tham số:** `confirmPutaway(user, taskId, input)`.

**Công việc:** Ghi lượng thực cất từng phần và bảo toàn tổng tồn.

**Xử lý theo thứ tự:**

1. Kiểm task OPEN/PARTIAL/version, chọn dòng hợp lệ không trùng.
2. guard nguồn/đích và tạo batch PURCHASE_PUTAWAY.
3. Với từng dòng kiểm actual<=remaining, placement đúngGR, source đủ và không bịtask khác giữ vượt.
4. Tìm đích, kiểm hold, carryReservations nếu cần; adjust nguồn−q/đích+q rồi save movement.
5. updatePlacement claimed−q/placed+q, tính trạng thái PARTIAL/CONFIRMED và bump task.

**Đường dẫn gọi tới hàm này:** `POST /api/putaway-tasks/:id/confirm` ([route dòng 59](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:59)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [permit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-273), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [taskState()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-279), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [guardLocations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-251), [batch()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-254), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-276), [pendingTaskQuantity()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-340), [balance()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-252), [carryReservations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-341), [adjust()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-253), [save()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-240), [updatePlacement()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-275), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `m.ReceiptPlacement`, tại [dòng 112](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:112). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ReceiptPlacement.findById(l.details.placementId)
```

- Kiểm có bản ghi hay không qua `m.DefectHold`, tại [dòng 120](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:120). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DefectHold.exists({ balanceId: target._id, status: 'ACTIVE' }).session(session)
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `batch` → `PostingBatch`:

```js
batch(task, user, key, hash, session, { operation: 'PURCHASE_PUTAWAY' })
```

- `carryReservations` → `Reservation`:

```js
carryReservations(ctx.b, target, exact(ctx.b.qtyBase), qty, session)
```

- `adjust` → `StockBalance`:

```js
adjust(ctx.b, qty.negated(), session)
```

- `adjust` → `StockBalance`:

```js
adjust(target, qty, session)
```

- `save` → `m.StockMovement`:

```js
save(m.StockMovement, { batchId: posting._id, documentId: task._id, lineId: l._id, fromBalanceId: ctx.b._id, toBalanceId: target._id, qtyBase: qty.toString(), fromBefore: from.before, fromAfter: from.after, toBefore: to.before, toAfter: to.after }, session)
```

- `updatePlacement` → `ReceiptPlacement`:

```js
updatePlacement(p, session, { claimDelta: qty.negated().toString(), placedDelta: qty.toString() })
```

- `bump` → `BusinessDocument`:

```js
bump(task, session, { workflowStatus: complete ? 'CONFIRMED' : 'PARTIAL' })
```

**Ví dụ:** Cất 20 từ 70: Receiving 50, Storage 20; tổng 70, reservation cần mang đi cùng hàng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function confirmPutaway(user, taskId, input) {
  permit(user, 'confirm');
  return command(user, 'CONFIRM_PURCHASE_PUTAWAY', taskId, input, async (session, key, hash) => {
    const { task, lines, actual } = await taskState(user, taskId, session); version(task, input.expectedVersion);
    if (!['OPEN', 'PARTIAL'].includes(task.workflowStatus)) fail('STATE', 'Task không còn mở');
    const gr = await scoped(user, task.header.receiptId, 'GR_PURCHASE', session);
    const receiptLines = await rows(gr._id, session); const seen = new Set();
    const selected = input.lines.map(r => {
      const l = lines.find(l => same(l._id, r.taskLineId));
      if (!l || seen.has(r.taskLineId)) throw validationError('Dòng task không hợp lệ/trùng'); seen.add(r.taskLineId);
      return { r, l };
    });
    await guardLocations(selected.flatMap(({ l }) => [l.details.fromLocationId, l.details.toLocationId]), session);
    const posting = await batch(task, user, key, hash, session, { operation: 'PURCHASE_PUTAWAY' });
    for (const { r, l } of selected) {
      const qty = exact(r.actualQtyBase);
      if (qty.gt(exact(l.qtyBase).minus(actual.get(id(l._id))))) fail('CLAIM', 'Thực cất vượt phần task còn lại');
      const p = await read(m.ReceiptPlacement.findById(l.details.placementId), session);
      const receiptLine = receiptLines.find(r => same(r._id, l.details.receiptLineId));
      if (!p || !receiptLine || !same(p.receiptId, gr._id)) fail('PROVENANCE', 'Thiếu nguồn GR của task');
      const ctx = await source(user, gr, receiptLine, p, l.details.toLocationId, session);
      if (ctx.product.wholeBaseUnits && !qty.isInteger()) throw validationError('Số viên phải nguyên');
      const pending = await pendingTaskQuantity(ctx.b, ctx.sourceLocationId, session, task._id);
      if (qty.plus(pending).gt(exact(ctx.b.qtyBase))) fail('SOURCE', 'Không đủ tồn sau task khác');
      const target = await balance(l.details.toLocationId, l.lotId, l.details.ownerPartyId, 'GOOD', session);
      if (await m.DefectHold.exists({ balanceId: target._id, status: 'ACTIVE' }).session(session)) fail('HOLD', 'Đích đang bị giữ do lỗi');
      await carryReservations(ctx.b, target, exact(ctx.b.qtyBase), qty, session);
      const from = await adjust(ctx.b, qty.negated(), session); const to = await adjust(target, qty, session);
      await save(m.StockMovement, { batchId: posting._id, documentId: task._id, lineId: l._id, fromBalanceId: ctx.b._id, toBalanceId: target._id, qtyBase: qty.toString(), fromBefore: from.before, fromAfter: from.after, toBefore: to.before, toAfter: to.after }, session);
      await updatePlacement(p, session, { claimDelta: qty.negated().toString(), placedDelta: qty.toString() });
      actual.set(id(l._id), actual.get(id(l._id)).plus(qty));
    }
    const complete = lines.every(l => actual.get(id(l._id)).eq(exact(l.qtyBase)));
    return { document: await bump(task, session, { workflowStatus: complete ? 'CONFIRMED' : 'PARTIAL' }), postingBatchId: posting._id };
  });
}
```

</details>

<a id="fn-282"></a>

## cancelPutaway()

**Code:** [purchase-putaway.service.js:131](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:131).

**Tham số:** `cancelPutaway(user, taskId, input)`.

**Công việc:** Hủy phần còn lại mà giữ lượng đã cất thực tế.

**Xử lý theo thứ tự:**

1. taskState và version, chỉ OPEN/PARTIAL.
2. Mỗi dòng remaining=planned−actual; giảm claimed phần chưa làm.
3. bump task CANCELLED; không tạo movement đảo phần đã làm.

**Đường dẫn gọi tới hàm này:** `POST /api/putaway-tasks/:id/cancel-remainder` ([route dòng 60](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:60)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [permit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-273), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [taskState()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-279), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235), [fail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-234), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [updatePlacement()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-275), [bump()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-244).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `m.ReceiptPlacement`, tại [dòng 139](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-putaway.service.js:139). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ReceiptPlacement.findById(l.details.placementId)
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `updatePlacement` → `ReceiptPlacement`:

```js
updatePlacement(p, session, { claimDelta: remainder.negated().toString() })
```

- `bump` → `BusinessDocument`:

```js
bump(task, session, { workflowStatus: 'CANCELLED' })
```

**Ví dụ:** Kế hoạch 70 đã cất 20: hủy giải phóng 50 để lập việc mới,20 vẫn tại đích.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function cancelPutaway(user, taskId, input) {
  permit(user, 'cancel');
  return command(user, 'CANCEL_PURCHASE_PUTAWAY', taskId, input, async session => {
    const { task, lines, actual } = await taskState(user, taskId, session); version(task, input.expectedVersion);
    if (!['OPEN', 'PARTIAL'].includes(task.workflowStatus)) fail('STATE', 'Task không còn phần mở');
    for (const l of lines) {
      const remainder = exact(l.qtyBase).minus(actual.get(id(l._id)));
      if (!remainder.gt(0)) continue;
      const p = await read(m.ReceiptPlacement.findById(l.details.placementId), session);
      if (!p) fail('PROVENANCE', 'Thiếu nguồn task');
      await updatePlacement(p, session, { claimDelta: remainder.negated().toString() });
    }
    return { document: await bump(task, session, { workflowStatus: 'CANCELLED' }) };
  });
}
```

</details>

<a id="fn-283"></a>

## readReceiving()

**Code:** [purchase-read.service.js:11](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:11).

**Tham số:** `readReceiving(u)`.

**Công việc:** Kiểm quyền đọc nhóm nhận mua.

**Xử lý theo thứ tự:**

1. rights read goods_receipt_inspection cho OWNER/ACCOUNTANT/WAREHOUSE.

**Ai gọi / gọi tiếp:** Được gọi bởi [getDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-286), [listDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-288), [receivingTrips()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-290), [receivingQueue()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-291), [receivingHistory()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-292). Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** SALES khôngđược đọcGR chỉ vì cóquyền sản phẩm.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
readReceiving = u => rights(u, 'read', 'goods_receipt_inspection', ['OWNER','ACCOUNTANT','WAREHOUSE'])
```

</details>

<a id="fn-284"></a>

## capabilities()

**Code:** [purchase-read.service.js:12](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:12).

**Tham số:** `capabilities(user, d)`.

**Công việc:** Tính gợi ý thao tác để màn hình bật/tắt nút.

**Xử lý theo thứ tự:**

1. So trạng thái/loại phiếu và quyền củauser.
2. Trả edit/confirm/post/cancel/reversePreflight/planPutaway.
3. Khôngkiểm hết lượng, khóa hoặc phụthuộc như command thật.

**Ai gọi / gọi tiếp:** Được gọi bởi [enriched()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-285). Gọi tiếp [hasPermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-294).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** GR đã đảo vẫnPOSTED có thể trảplanPutaway=true; cầnxem reversed và context, khôngcoi nút là giấyphép.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function capabilities(user, d) {
  const warehouse = ['WAREHOUSE'];
  return {
    edit: d.workflowStatus === 'DRAFT' && hasPermission(user, 'goods_receipt_inspection:update', warehouse),
    confirm: d.documentKind === 'PO_INSPECTION' && d.workflowStatus === 'DRAFT' && hasPermission(user, 'goods_receipt_inspection:update', warehouse),
    post: d.documentKind === 'GR_PURCHASE' && d.workflowStatus === 'DRAFT' && hasPermission(user, 'goods_receipt_inspection:post', warehouse),
    cancel: d.workflowStatus === 'DRAFT' && hasPermission(user, 'goods_receipt_inspection:update', warehouse),
    reversePreflight: d.documentKind === 'GR_PURCHASE' && d.workflowStatus === 'POSTED' && hasPermission(user, 'goods_receipt_inspection:reverse', warehouse),
    planPutaway: d.documentKind === 'GR_PURCHASE' && d.workflowStatus === 'POSTED' && hasPermission(user, 'putaway_task:create', warehouse),
  };
}
```

</details>

<a id="fn-285"></a>

## enriched()

**Code:** [purchase-read.service.js:23](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:23).

**Tham số:** `enriched(user, documents, session = null)`.

**Công việc:** Bổ sung dòng, GR, placement và sự kiện cho một tập hồ sơ nhận mua.

**Xử lý theo thứ tự:**

1. Rỗng trảmảngrỗng.
2. Đọc gom DocumentLine, GR củainspection, ReceiptPlacement và CORRECTION/REVERSAL events.
3. Lập Map, mapmỗi hồ sơ vớicapabilities, dòng và progress cất, receipts/reversed/corrections.

**Ai gọi / gọi tiếp:** Được gọi bởi [getDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-286), [listDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-288), [receivingTrips()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-290), [receivingQueue()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-291). Gọi tiếp [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [capabilities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-284), [placementQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-274), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.DocumentLine`, tại [dòng 26](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:26). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.find({ documentId: { $in: ids } }).sort({ lineNo: 1 })
```

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 27](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:27). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find({ documentKind: 'GR_PURCHASE', 'header.poInspectionId': { $in: ids } })
```

- Đọc nhiều bản ghi qua `m.ReceiptPlacement`, tại [dòng 28](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:28). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ReceiptPlacement.find({ receiptId: { $in: [...ids, ...receipts.map(r => r._id)] } })
```

- Đọc nhiều bản ghi qua `m.PurchaseEvent`, tại [dòng 29](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:29). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvent.find({ documentId: { $in: [...ids, ...receipts.map(r => r._id)] }, kind: { $in: ['CORRECTION','REVERSAL'] } }).select('-evidenceIds')
```

**Ví dụ:** Đọc 10 kiểm nhận không cần 10 truyvấn riêng tìmGR; lượngcất lấyplacement.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function enriched(user, documents, session = null) {
  if (!documents.length) return [];
  const ids = documents.map(d => d._id);
  const lines = await read(m.DocumentLine.find({ documentId: { $in: ids } }).sort({ lineNo: 1 }), session);
  const receipts = await read(m.BusinessDocument.find({ documentKind: 'GR_PURCHASE', 'header.poInspectionId': { $in: ids } }), session);
  const placements = await read(m.ReceiptPlacement.find({ receiptId: { $in: [...ids, ...receipts.map(r => r._id)] } }), session);
  const events = await read(m.PurchaseEvent.find({ documentId: { $in: [...ids, ...receipts.map(r => r._id)] }, kind: { $in: ['CORRECTION','REVERSAL'] } }).select('-evidenceIds'), session);
  const lineByDocument = new Map(), receiptByInspection = new Map(), placementByLine = new Map(placements.map(p => [id(p.receiptLineId), p]));
  for (const l of lines) { const k=id(l.documentId); if (!lineByDocument.has(k)) lineByDocument.set(k,[]); lineByDocument.get(k).push(l); }
  for (const r of receipts) { const k=id(r.header.poInspectionId); if (!receiptByInspection.has(k)) receiptByInspection.set(k,[]); receiptByInspection.get(k).push(r); }
  return documents.map(d => ({ ...d, capabilities: capabilities(user, d),
    lines: (lineByDocument.get(id(d._id)) ?? []).map(l => {
      const p = placementByLine.get(id(l._id));
      return { ...l, ...(p && { putaway: placementQuantities(p) }) };
    }),
    goodsReceiptId: receiptByInspection.get(id(d._id))?.[0]?._id ?? null,
    receipts: (receiptByInspection.get(id(d._id)) ?? []).map(r => ({ id: r._id, documentNo: r.documentNo, workflowStatus: r.workflowStatus, version: r.version, reversed: events.some(e => e.kind === 'REVERSAL' && same(e.documentId, r._id)) })),
    reversed: events.some(e => e.kind === 'REVERSAL' && same(e.documentId, d._id)),
    corrections: events.filter(e => same(e.documentId, d._id)),
  }));
}
```

</details>

<a id="fn-286"></a>

## getDocument()

**Code:** [purchase-read.service.js:44](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:44).

**Tham số:** `getDocument(user, documentId, kind)`.

**Công việc:** Đọc chi tiết kiểm nhận hoặcGR bằng phạm viđọc hiện hành.

**Xử lý theo thứ tự:**

1. readReceiving rồi scopedPurchaseRead đúngkind.
2. enriched mộthồ sơ vàserialize.

**Đường dẫn gọi tới hàm này:** `GET /api/po-inspections/:id` ([route dòng 38](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:38)); `GET /api/purchase-receipts/:id` ([route dòng 49](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:49)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [readReceiving()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-283), [scopedPurchaseRead()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-238), [serialize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-245), [enriched()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-285).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `m.BusinessDocument.findOne`, `m.DocumentLine.find`, `m.BusinessDocument.find`, `m.ReceiptPlacement.find`, `m.PurchaseEvent.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Kế toán xemGR ngoàiassigned warehouse theo helperđọc mới; không đượcpost ở đó.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getDocument(user, documentId, kind) {
  readReceiving(user); const d = await scopedPurchaseRead(user, documentId, kind);
  return serialize((await enriched(user, [d]))[0]);
}
```

</details>

<a id="fn-287"></a>

## warehouseFilter()

**Code:** [purchase-read.service.js:48](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:48).

**Tham số:** `warehouseFilter(user, warehouseId)`.

**Công việc:** Dựng bộ lọc kho cho list/queue nhận mua.

**Xử lý theo thứ tự:**

1. OWNER hoặc ACCOUNTANT đượcmọikho.
2. Có warehouseId thì vai tròkhác phải được giao; không có thì lọc warehouseIds.
3. Trả filter, khônggửiquery.

**Ai gọi / gọi tiếp:** Được gọi bởi [listDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-288), [receivingQueue()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-291). Gọi tiếp [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298), [scopeError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-327).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Kế toán chọnB đểxem việcchờnhận; khoA không tựchọnB.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function warehouseFilter(user, warehouseId) {
  const allWarehouses = currentRole(user)?.code === 'ACCOUNTANT' || canAccessWarehouse(user, null);
  if (warehouseId) { if (!allWarehouses && !canAccessWarehouse(user, warehouseId)) throw scopeError(); return { 'header.warehouseId': new mongoose.Types.ObjectId(warehouseId) }; }
  return allWarehouses ? {} : { 'header.warehouseId': { $in: (user.warehouseIds ?? []).map(v => new mongoose.Types.ObjectId(id(v))) } };
}
```

</details>

<a id="fn-288"></a>

## listDocuments()

**Code:** [purchase-read.service.js:53](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:53).

**Tham số:** `listDocuments(user, kind, query)`.

**Công việc:** Đọc danh sách inspection/GR với count và trang cùng điều kiện.

**Xử lý theo thứ tự:**

1. readReceiving; filter kind/kho/PO/status.
2. Find/count đồng thời ngoài transaction, sort mới trước và chia trang tạiDB.
3. enriched cácmục trêntrang rồiserialize.

**Đường dẫn gọi tới hàm này:** `GET /api/po-inspections` ([route dòng 37](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:37)); `GET /api/purchase-receipts` ([route dòng 48](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:48)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [readReceiving()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-283), [warehouseFilter()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-287), [serialize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-245), [enriched()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-285).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 56](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:56). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean()
```

- Đếm bản ghi qua `m.BusinessDocument`, tại [dòng 56](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:56). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.countDocuments(filter)
```

**Ví dụ:** Trang 20 GR chỉenrich 20 phiếu, không làm tăngtồn khiGET.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function listDocuments(user, kind, query) {
  readReceiving(user);
  const filter = { documentKind: kind, ...warehouseFilter(user, query.warehouseId), ...(query.purchaseOrderId && { 'header.purchaseOrderId': query.purchaseOrderId }), ...(query.status && { workflowStatus: query.status }) };
  const [documents, total] = await Promise.all([m.BusinessDocument.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(), m.BusinessDocument.countDocuments(filter)]);
  return serialize({ items: await enriched(user, documents), total, page: query.page, limit: query.limit });
}
```

</details>

<a id="fn-289"></a>

## receivingSummary()

**Code:** [purchase-read.service.js:59](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:59).

**Tham số:** `receivingSummary(user, poId)`.

**Công việc:** Đọc lượng và côngviệc nhận mua củaPO trong cùng snapshot.

**Xử lý theo thứ tự:**

1. Kiểm purchase_order:read, mở transaction đọc.
2. scopedPurchaseRead PO; commitments/rows; đọc hồ sơcon, placements và supplier schedules.
3. Đếm chuyến gốc, nhápkểm/GR và lượng chưa cất sauđảo.
4. Trả version/computedAt và snapshot dòng.

**Đường dẫn gọi tới hàm này:** `GET /api/purchase-orders/:id/receiving-summary` ([route dòng 53](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:53)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [scopedPurchaseRead()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-238), [commitments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-220), [rows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-239), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [serialize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-245), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 66](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:66). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find({ 'header.purchaseOrderId': po._id }).select('_id documentKind workflowStatus header')
```

- Đọc nhiều bản ghi qua `m.ReceiptPlacement`, tại [dòng 67](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:67). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ReceiptPlacement.find({ purchaseOrderId: po._id })
```

- Đọc nhiều bản ghi qua `m.PurchaseEvent`, tại [dòng 68](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:68). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseEvent.find({ purchaseOrderId: po._id, kind: 'SUPPLIER_CONFIRMATION' }).sort({ createdAt: -1, _id: -1 })
```

**Ví dụ:** POCOMPLETED nhưng unplaced 70 nghĩa nhậnđủ còn 70 chưa cất.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function receivingSummary(user, poId) {
  rights(user, 'read', 'purchase_order', ['OWNER','ACCOUNTANT','WAREHOUSE']);
  const session = await mongoose.startSession();
  try { return await session.withTransaction(async () => {
    const po = await scopedPurchaseRead(user, poId, 'PO', session);
    const quantities = await commitments(po, session);
    const lines = await rows(po._id, session);
    const docs = await read(m.BusinessDocument.find({ 'header.purchaseOrderId': po._id }).select('_id documentKind workflowStatus header'), session);
    const placements = await read(m.ReceiptPlacement.find({ purchaseOrderId: po._id }), session);
    const schedules = await read(m.PurchaseEvent.find({ purchaseOrderId: po._id, kind: 'SUPPLIER_CONFIRMATION' }).sort({ createdAt: -1, _id: -1 }), session);
    const openPlacement = placements.filter(p => exact(p.receivedQtyBase).minus(exact(p.reversedQtyBase)).minus(exact(p.placedQtyBase)).gt(0));
    return serialize({ purchaseOrder: { id: po._id, documentNo: po.documentNo, workflowStatus: po.workflowStatus, version: po.version }, poVersion: po.version, computedAt: new Date(),
      quantities: quantities.map(q => ({ ...q, snapshot: lines.find(l => same(l._id, q.lineId)) })), schedules,
      tripCount: docs.filter(d => d.documentKind === 'PO_INSPECTION' && !d.header.rootInspectionId).length,
      openWork: { draftInspections: docs.filter(d => d.documentKind === 'PO_INSPECTION' && d.workflowStatus === 'DRAFT').length,
        draftReceipts: docs.filter(d => d.documentKind === 'GR_PURCHASE' && d.workflowStatus === 'DRAFT').length,
        unplacedReceiptLines: openPlacement.length,
        unplacedQtyBase: openPlacement.reduce((sum,p) => sum.plus(exact(p.receivedQtyBase)).minus(exact(p.reversedQtyBase)).minus(exact(p.placedQtyBase)), exact('0')).toString() },
    });
  }, txOptions); } finally { await session.endSession(); }
}
```

</details>

<a id="fn-290"></a>

## receivingTrips()

**Code:** [purchase-read.service.js:80](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:80).

**Tham số:** `receivingTrips(user, poId, query)`.

**Công việc:** Phân trang theo chuyến gốc, gộp các bản sửa của cùngđợt.

**Xử lý theo thứ tự:**

1. readReceiving và scopedPurchaseRead PO.
2. Aggregate inspection theoPO, group rootInspectionId hoặc _id; chọnbản mới nhất đểlọcstatus.
3. Đếm/chia trang chuyến gốc bằngfacet.
4. Đọc cácrevision trêntrang vàenriched, trả root/current/revisions.

**Đường dẫn gọi tới hàm này:** `GET /api/purchase-orders/:id/receiving-trips` ([route dòng 54](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:54)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [readReceiving()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-283), [scopedPurchaseRead()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-238), [enriched()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-285), [serialize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-245), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Tổng hợp/lọc/ghép nhóm dữ liệu qua `m.BusinessDocument`, tại [dòng 82](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:82). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.aggregate([
    { $match: { documentKind: 'PO_INSPECTION', 'header.purchaseOrderId': new mongoose.Types.ObjectId(poId) } },
    { $sort: { createdAt: -1, _id: -1 } },
    { $group: { _id: { $ifNull: ['$header.rootInspectionId','$_id'] }, current: { $first: '$$ROOT' }, tripCreatedAt: { $min: '$createdAt' } } },
    ...(query.status ? [{ $match: { 'current.workflowStatus': query.status } }] : []),
    { $sort: { tripCreatedAt: -1, _id: -1 } },
    { $facet: { total: [{ $count: 'count' }], items: [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }] } },
  ])
```

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 91](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:91). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find({ documentKind: 'PO_INSPECTION', $or: [{ _id: { $in: rootIds } }, { 'header.rootInspectionId': { $in: rootIds } }] }).sort({ createdAt: 1, _id: 1 }).lean()
```

**Ví dụ:** Mộtchuyến kiểm 70 sửa 60 là mộtchuyến với 2 bản, không phải hai xegiao.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function receivingTrips(user, poId, query) {
  readReceiving(user); await scopedPurchaseRead(user, poId, 'PO');
  const [result] = await m.BusinessDocument.aggregate([
    { $match: { documentKind: 'PO_INSPECTION', 'header.purchaseOrderId': new mongoose.Types.ObjectId(poId) } },
    { $sort: { createdAt: -1, _id: -1 } },
    { $group: { _id: { $ifNull: ['$header.rootInspectionId','$_id'] }, current: { $first: '$$ROOT' }, tripCreatedAt: { $min: '$createdAt' } } },
    ...(query.status ? [{ $match: { 'current.workflowStatus': query.status } }] : []),
    { $sort: { tripCreatedAt: -1, _id: -1 } },
    { $facet: { total: [{ $count: 'count' }], items: [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }] } },
  ]);
  const rootIds = result.items.map(r => r._id);
  const revisions = await m.BusinessDocument.find({ documentKind: 'PO_INSPECTION', $or: [{ _id: { $in: rootIds } }, { 'header.rootInspectionId': { $in: rootIds } }] }).sort({ createdAt: 1, _id: 1 }).lean();
  const data = await enriched(user, revisions);
  return serialize({ items: result.items.map(r => ({ rootInspectionId: r._id, currentInspectionId: r.current._id, revisions: data.filter(d => same(d._id, r._id) || same(d.header.rootInspectionId, r._id)) })), total: result.total[0]?.count ?? 0, page: query.page, limit: query.limit });
}
```

</details>

<a id="fn-291"></a>

## receivingQueue()

**Code:** [purchase-read.service.js:95](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:95).

**Tham số:** `receivingQueue(user, query)`.

**Công việc:** Đọc côngviệcchờ theo giaiđoạn, quyền kho và PO.

**Xử lý theo thứ tự:**

1. readReceiving/warehouseFilter; chọnfilter cho draft inspection, draftGR, postedGR hoặc correction.
2. Chờcất lookup placements và giữ tổngreceived−reversed−placed>0.
3. Correction lookup events/replacements, giữ bản sửa nháp hoặcGR đã đảo chưa thay.
4. Sort cũtrước, facet count/page; enriched kết quả.

**Đường dẫn gọi tới hàm này:** `GET /api/purchase-receiving/queue` ([route dòng 62](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:62)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [readReceiving()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-283), [warehouseFilter()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-287), [serialize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-245), [enriched()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-285).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Tổng hợp/lọc/ghép nhóm dữ liệu qua `m.BusinessDocument`, tại [dòng 111](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:111). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.aggregate(pipeline)
```

**Ví dụ:** Phiếu còn 50 chưa cất vẫn trongqueue dù đãcótask giữ 50.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function receivingQueue(user, query) {
  readReceiving(user);
  const base = { ...warehouseFilter(user, query.warehouseId), ...(query.purchaseOrderId && { 'header.purchaseOrderId': new mongoose.Types.ObjectId(query.purchaseOrderId) }) };
  const stage = query.stage;
  const filter = stage === 'DRAFT_INSPECTION' ? { documentKind: 'PO_INSPECTION', workflowStatus: 'DRAFT' }
    : stage === 'AWAITING_POST' ? { documentKind: 'GR_PURCHASE', workflowStatus: 'DRAFT' }
    : stage === 'AWAITING_PUTAWAY' ? { documentKind: 'GR_PURCHASE', workflowStatus: 'POSTED' }
    : { $or: [{ documentKind: 'PO_INSPECTION', workflowStatus: 'DRAFT', 'header.correctionId': { $exists: true } }, { documentKind: 'GR_PURCHASE', workflowStatus: 'POSTED' }] };
  const pipeline = [{ $match: { ...base, ...filter } }];
  if (stage === 'AWAITING_PUTAWAY') pipeline.push({ $lookup: { from: 'receipt_placements', localField: '_id', foreignField: 'receiptId', as: 'placements' } },
    { $match: { $expr: { $gt: [{ $sum: { $map: { input: '$placements', as: 'p', in: { $subtract: [{ $subtract: ['$$p.receivedQtyBase','$$p.reversedQtyBase'] }, '$$p.placedQtyBase'] } } } }, 0] } } });
  if (stage === 'CORRECTION') pipeline.push(
    { $lookup: { from: 'purchase_events', localField: '_id', foreignField: 'documentId', as: 'events' } },
    { $lookup: { from: 'business_documents', localField: 'header.poInspectionId', foreignField: 'header.replacesInspectionId', as: 'replacements' } },
    { $match: { $or: [{ documentKind: 'PO_INSPECTION' }, { 'events.kind': 'REVERSAL', replacements: { $size: 0 } }] } });
  pipeline.push({ $sort: { createdAt: 1, _id: 1 } }, { $facet: { total: [{ $count: 'count' }], items: [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }, { $project: { placements: 0, events: 0, replacements: 0 } }] } });
  const [result] = await m.BusinessDocument.aggregate(pipeline);
  return serialize({ items: await enriched(user, result.items), total: result.total[0]?.count ?? 0, page: query.page, limit: query.limit, stage });
}
```

</details>

<a id="fn-292"></a>

## receivingHistory()

**Code:** [purchase-read.service.js:114](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:114).

**Tham số:** `receivingHistory(user, documentId, query)`.

**Công việc:** Đọc audit của hồ sơmua và tập con được xácđịnh theo loại.

**Xử lý theo thứ tự:**

1. readReceiving và scopedPurchaseRead; chỉloạiPO/inspection/GR hoặcTO mua.
2. PO gom mãcủaPO vàheader.purchaseOrderId; inspection gom root/revisions/GR/TO.
3. GR riêng chỉchínhGR; audit find/count phân trang theo tập mã.
4. ĐọcUser đểgắn actorName.

**Đường dẫn gọi tới hàm này:** `GET /api/po-inspections/:id/history` ([route dòng 34](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:34)); `GET /api/purchase-documents/:id/history` ([route dòng 64](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:64)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [readReceiving()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-283), [scopedPurchaseRead()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-238), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [serialize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-245), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 118](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:118). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find({ $or: [{ _id: d._id }, { 'header.purchaseOrderId': d._id }] }).select('_id')
```

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 121](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:121). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find({ documentKind: 'PO_INSPECTION', $or: [{ _id: root }, { 'header.rootInspectionId': root }] }).select('_id')
```

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 122](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:122). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find({ documentKind: 'GR_PURCHASE', 'header.poInspectionId': { $in: inspections.map(i => i._id) } }).select('_id')
```

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 123](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:123). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find({ documentKind: 'TO', 'header.receiptId': { $in: grs.map(g => g._id) } }).select('_id')
```

- Đọc nhiều bản ghi qua `m.AuditEvent`, tại [dòng 126](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:126). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.AuditEvent.find(filter).sort({ eventAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).select('documentId actorId action eventAt changes details').lean()
```

- Đếm bản ghi qua `m.AuditEvent`, tại [dòng 126](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:126). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.AuditEvent.countDocuments(filter)
```

- Đọc nhiều bản ghi qua `m.User`, tại [dòng 127](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-read.service.js:127). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.User.find({ _id: { $in: events.map(e => e.actorId) } }).select('_id fullName').lean()
```

**Ví dụ:** History inspection cócảGR/task liênquan, nhưng không mở logPICK không liênquan bằngquyền nhận mua.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function receivingHistory(user, documentId, query) {
  readReceiving(user); const d = await scopedPurchaseRead(user, documentId);
  if (!['PO','PO_INSPECTION','GR_PURCHASE'].includes(d.documentKind) && !(d.documentKind === 'TO' && d.header.receiptId)) throw notFoundError();
  let docs;
  if (d.documentKind === 'PO') docs = await read(m.BusinessDocument.find({ $or: [{ _id: d._id }, { 'header.purchaseOrderId': d._id }] }).select('_id'));
  else if (d.documentKind === 'PO_INSPECTION') {
    const root = d.header.rootInspectionId ?? d._id;
    const inspections = await read(m.BusinessDocument.find({ documentKind: 'PO_INSPECTION', $or: [{ _id: root }, { 'header.rootInspectionId': root }] }).select('_id'));
    const grs = await read(m.BusinessDocument.find({ documentKind: 'GR_PURCHASE', 'header.poInspectionId': { $in: inspections.map(i => i._id) } }).select('_id'));
    docs = [...inspections, ...grs, ...await read(m.BusinessDocument.find({ documentKind: 'TO', 'header.receiptId': { $in: grs.map(g => g._id) } }).select('_id'))];
  } else docs = [d];
  const filter = { documentId: { $in: docs.map(d => d._id) } };
  const [events, total] = await Promise.all([m.AuditEvent.find(filter).sort({ eventAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).select('documentId actorId action eventAt changes details').lean(), m.AuditEvent.countDocuments(filter)]);
  const actors = await m.User.find({ _id: { $in: events.map(e => e.actorId) } }).select('_id fullName').lean();
  return serialize({ items: events.map(e => ({ ...e, actorName: actors.find(u => same(u._id, e.actorId))?.fullName ?? null })), total, page: query.page, limit: query.limit });
}
```

</details>

<a id="fn-293"></a>

## reconcilePurchasing()

**Code:** [purchase-reconciliation.js:7](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-reconciliation.js:7).

**Tham số:** `reconcilePurchasing(session = null)`.

**Công việc:** So các số dư và bản theo dõi với lịch sử để tìm chênh lệch.

**Xử lý theo thứ tự:**

1. Đọc tấtcảbalance/movement, tính tổngdelta từngbalance và sosố dư.
2. Đọc placements/tasklines/taskdocs, so received ròng/placed/claimed và lượng còn vật lý.
3. Đọc sourceclaims/approvals, so trầnRR và quyền mua trênPO sauchốt.
4. Tính PO quantities, gom issues; không tự update hay sửa chữa.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Gọi tiếp [read()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-233), [same()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-232), [purchaseOrderQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-211).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `m.StockBalance`, tại [dòng 9](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-reconciliation.js:9). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.StockBalance.find({})
```

- Đọc nhiều bản ghi qua `m.StockMovement`, tại [dòng 10](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-reconciliation.js:10). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.StockMovement.find({})
```

- Đọc nhiều bản ghi qua `m.ReceiptPlacement`, tại [dòng 21](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-reconciliation.js:21). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.ReceiptPlacement.find({})
```

- Đọc nhiều bản ghi qua `m.DocumentLine`, tại [dòng 22](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-reconciliation.js:22). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.DocumentLine.find({ 'details.placementId': { $in: placements.map(p => p._id) }, lineKind: 'WAREHOUSE_TASK' })
```

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 23](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-reconciliation.js:23). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find({ _id: { $in: taskLines.map(l => l.documentId) }, documentKind: 'TO' })
```

- Đọc nhiều bản ghi qua `m.PurchaseSourceClaim`, tại [dòng 45](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-reconciliation.js:45). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.PurchaseSourceClaim.find({})
```

- Đọc nhiều bản ghi qua `m.Approval`, tại [dòng 46](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-reconciliation.js:46). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.Approval.find({ _id: { $in: claims.map(c => c.approvalId) } })
```

- Đọc nhiều bản ghi qua `m.BusinessDocument`, tại [dòng 53](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/purchase-reconciliation.js:53). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
m.BusinessDocument.find({ documentKind: 'PO' })
```

**Ví dụ:** Projection nói cất 20 nhưng movement 30 thì báo PLACEMENT_PROJECTION, không tựgán 20 thành 30.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function reconcilePurchasing(session = null) {
  const issues = [];
  const balances = await read(m.StockBalance.find({}), session);
  const movements = await read(m.StockMovement.find({}), session);
  const ledger = new Map(balances.map(b => [id(b._id), exact('0')]));
  for (const movement of movements) {
    for (const [key, sign] of [['fromBalanceId',-1],['toBalanceId',1]]) {
      if (!movement[key]) continue;
      const balanceId = id(movement[key]);
      if (!ledger.has(balanceId)) { issues.push({ code: 'MISSING_BALANCE', balanceId }); continue; }
      ledger.set(balanceId, ledger.get(balanceId).plus(exact(movement.qtyBase).mul(sign)));
    }
  }
  for (const b of balances) if (!ledger.get(id(b._id)).eq(exact(b.qtyBase))) issues.push({ code: 'LEDGER_BALANCE', balanceId: id(b._id) });
  const placements = await read(m.ReceiptPlacement.find({}), session);
  const taskLines = await read(m.DocumentLine.find({ 'details.placementId': { $in: placements.map(p => p._id) }, lineKind: 'WAREHOUSE_TASK' }), session);
  const taskDocs = await read(m.BusinessDocument.find({ _id: { $in: taskLines.map(l => l.documentId) }, documentKind: 'TO' }), session);
  const totals = new Map();
  for (const p of placements) {
    const own = movements.filter(r => same(r.lineId, p.receiptLineId));
    const received = own.reduce((sum,r) => sum.plus(exact(r.qtyBase).mul(r.toBalanceId ? 1 : -1)), exact('0'));
    if (!received.eq(exact(p.receivedQtyBase).minus(exact(p.reversedQtyBase)))) issues.push({ code: 'RECEIPT_PROJECTION', receiptLineId: id(p.receiptLineId) });
    let placed = exact('0'), claimed = exact('0');
    for (const line of taskLines.filter(l => same(l.details.placementId, p._id))) {
      const actual = movements.filter(r => same(r.lineId, line._id)).reduce((sum,r) => sum.plus(exact(r.qtyBase)), exact('0'));
      placed = placed.plus(actual);
      const d = taskDocs.find(d => same(d._id, line.documentId));
      if (d && ['DRAFT','OPEN','PARTIAL'].includes(d.workflowStatus)) claimed = claimed.plus(exact(line.qtyBase).minus(actual));
    }
    if (!placed.eq(exact(p.placedQtyBase)) || !claimed.eq(exact(p.claimedQtyBase))) issues.push({ code: 'PLACEMENT_PROJECTION', receiptLineId: id(p.receiptLineId) });
    const remaining = received.minus(placed);
    if (remaining.isNegative() || claimed.gt(remaining)) issues.push({ code: 'PLACEMENT_CAP', receiptLineId: id(p.receiptLineId) });
    totals.set(id(p.sourceBalanceId), (totals.get(id(p.sourceBalanceId)) ?? exact('0')).plus(remaining));
  }
  for (const [balanceId, remaining] of totals) {
    const b = balances.find(b => same(b._id, balanceId));
    if (!b || remaining.gt(exact(b.qtyBase))) issues.push({ code: 'PLACEMENT_PHYSICAL_SOURCE', balanceId });
  }
  const claims = await read(m.PurchaseSourceClaim.find({}), session);
  const approvals = await read(m.Approval.find({ _id: { $in: claims.map(c => c.approvalId) } }), session);
  const byRr = new Map();
  for (const c of claims) byRr.set(id(c.rrLineId), (byRr.get(id(c.rrLineId)) ?? exact('0')).plus(exact(c.qtyBase)));
  for (const [lineId, used] of byRr) {
    const authority = approvals.flatMap(a => a.lines).filter(l => same(l.lineId, lineId) && l.outcome === 'APPROVE');
    if (!authority.length || used.gt(exact(authority[0].approvedQty))) issues.push({ code: 'RR_ALLOWANCE', rrLineId: lineId });
  }
  const pos = await read(m.BusinessDocument.find({ documentKind: 'PO' }), session);
  for (const po of pos) {
    const q = await purchaseOrderQuantities(po, session);
    for (const line of q) {
      if (line.quantityState !== 'KNOWN') { issues.push({ code: 'PO_SOURCE_INCOMPLETE', poId: id(po._id), lineId: line.lineId }); continue; }
      const used = claims.filter(c => same(c.poLineId, line.lineId)).reduce((sum,c) => sum.plus(exact(c.qtyBase)), exact('0'));
      const expected = po.workflowStatus === 'DRAFT' ? exact('0') : exact(line.authorizedOrderedQtyBase).minus(exact(line.closedRemainderQtyBase));
      if (!used.eq(expected)) issues.push({ code: 'PO_ALLOWANCE_PROJECTION', poId: id(po._id), lineId: line.lineId });
    }
  }
  return { ok: issues.length === 0, checked: { balances: balances.length, movements: movements.length, placements: placements.length, claims: claims.length, purchaseOrders: pos.length }, issues };
}
```

</details>

