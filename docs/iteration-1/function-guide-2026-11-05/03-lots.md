---
id: DOC-CODE-IT1-LOTS-20261105
title: "Lô hàng — giải thích từng hàm"
version: 1.0.0
phase: Review
domain: Iteration1
tags: [backend, function, database]
last_updated: 2026-11-05
---

# Lô hàng — giải thích từng hàm

[Quay lại hướng dẫn đọc](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/README.md). Bản source ngày 05/11/2026; các đoạn lệnh dưới đây được lấy trực tiếp từ file hiện tại.

## Tìm nhanh

- [lot.controller.js → list()](#fn-38)
- [lot.controller.js → detail()](#fn-39)
- [lot.controller.js → create()](#fn-40)
- [lot.controller.js → update()](#fn-41)
- [lot.controller.js → movements()](#fn-42)
- [lot.mapper.js → mapLotSummary()](#fn-43)
- [lot.mapper.js → mapLotDetail()](#fn-44)
- [lot.mapper.js → mapScopedStock()](#fn-45)
- [lot.service.js → requireLotReader()](#fn-46)
- [lot.service.js → requireLotCreator()](#fn-47)
- [lot.service.js → requireLotUpdater()](#fn-48)
- [lot.service.js → withSession()](#fn-49)
- [lot.service.js → isDuplicateKey()](#fn-50)
- [lot.service.js → verificationError()](#fn-51)
- [lot.service.js → identityLockedError()](#fn-52)
- [lot.service.js → hasUnknown()](#fn-53)
- [lot.service.js → manufacturedDate()](#fn-54)
- [lot.service.js → findLot()](#fn-55)
- [lot.service.js → productForLot()](#fn-56)
- [lot.service.js → scopedStockRows()](#fn-57)
- [lot.service.js → listLots()](#fn-58)
- [lot.service.js → getLot()](#fn-59)
- [lot.service.js → createLot()](#fn-60)
- [lot.service.js → updateLot()](#fn-61)
- [lot.service.js → movementDocumentReference()](#fn-62)
- [lot.service.js → getLotMovements()](#fn-63)
- [lot.service.js → getLotMovements.allowedWarehouse()](#fn-64)
- [lot.service.js → getLotMovements.mapEndpoint()](#fn-65)
- [lot.validation.js → positiveInteger()](#fn-66)
- [lot.validation.js → optionalText()](#fn-67)
- [lot.validation.js → identityText()](#fn-68)

<a id="fn-38"></a>

## list()

**Code:** [lot.controller.js:5](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.controller.js:5).

**Tham số:** `list(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới listLots và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ listLots hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/lots` ([route dòng 12](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.routes.js:12)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [listLots()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-58), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Lot.find`, `Lot.countDocuments`, `Product.find`, `StockBalance.find`, `StockAccount.find`, `Location.find`, `Warehouse.find`, `Party.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do listLots quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
list = catchAsync(async (req, res) => {
  const data = await service.listLots(req.user, req.validated.query);
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-39"></a>

## detail()

**Code:** [lot.controller.js:10](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.controller.js:10).

**Tham số:** `detail(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới getLot và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ getLot hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/lots/:id` ([route dòng 31](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.routes.js:31)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [getLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-59), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Lot.findById`, `Product.findById`, `StockBalance.find`, `StockAccount.find`, `Location.find`, `Warehouse.find`, `Party.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do getLot quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
detail = catchAsync(async (req, res) => {
  const data = await service.getLot(req.user, req.validated.params.id);
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-40"></a>

## create()

**Code:** [lot.controller.js:15](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.controller.js:15).

**Tham số:** `create(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới createLot và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ createLot hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `POST /api/lots` ([route dòng 18](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.routes.js:18)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [createLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-60), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Product.findById`, `Lot.findOne`, `Lot.save`, `AuditEvent.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do createLot quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
create = catchAsync(async (req, res) => {
  const data = await service.createLot(req.user, req.validated.body);
  formatApiResponse(res, {
    statusCode: 201,
    message: "Tạo lô hàng thành công",
    data,
  });
})
```

</details>

<a id="fn-41"></a>

## update()

**Code:** [lot.controller.js:24](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.controller.js:24).

**Tham số:** `update(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới updateLot và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ updateLot hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `PUT /api/lots/:id` ([route dòng 37](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.routes.js:37)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Lot.updateOne`, `Lot.findOneAndUpdate`, `Lot.findById`, `DocumentLine.exists`, `StockBalance.exists`, `AuditEvent.save`, `Product.findById`, `StockBalance.find`, `StockAccount.find`, `Location.find`, `Warehouse.find`, `Party.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do updateLot quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
update = catchAsync(async (req, res) => {
  const data = await service.updateLot(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-42"></a>

## movements()

**Code:** [lot.controller.js:33](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.controller.js:33).

**Tham số:** `movements(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới getLotMovements và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ getLotMovements hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/lots/:id/movements` ([route dòng 24](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.routes.js:24)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [getLotMovements()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-63), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `StockBalance.find`, `StockMovement.find`, `StockAccount.find`, `Location.find`, `Warehouse.find`, `Party.find`, `BusinessDocument.find`, `PostingBatch.find`, `Lot.findById`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do getLotMovements quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
movements = catchAsync(async (req, res) => {
  const data = await service.getLotMovements(
    req.user,
    req.validated.params.id,
    req.validated.query,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-43"></a>

## mapLotSummary()

**Code:** [lot.mapper.js:6](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.mapper.js:6).

**Tham số:** `mapLotSummary(lot, product, hasScopedStock = false)`.

**Công việc:** Trả nhận dạng cơ bản của một lô và cờ có số dư trong phạm vi.

**Xử lý theo thứ tự:**

1. Gắn thông tin sản phẩm đã đọc.
2. Giữ mã lô/tone/calibre/trạng thái xác minh/cờ khóa/version.
3. Nhận hasScopedStock từ service, không tự đếm tồn.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapLotDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-44), [listLots()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-58). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-313).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** hasScopedStock=true có thể vẫn là số dư 0; không dùng để kết luận có hàng khả dụng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapLotSummary(lot, product, hasScopedStock = false) {
  return {
    id: idString(lot._id),
    product: product
      ? {
          id: idString(product._id),
          sku: product.sku,
          name: product.name,
        }
      : { id: idString(lot.productId), sku: null, name: null },
    manufacturerLot: lot.manufacturerLot,
    tone: lot.tone,
    calibre: lot.calibre,
    identificationStatus: lot.identificationStatus,
    manufacturedOn: isoDate(lot.manufacturedOn),
    verificationReference: lot.verificationReference ?? null,
    identityLocked: lot.identityLocked === true,
    version: lot.version ?? 1,
    hasScopedStock,
    createdAt: isoDate(lot.createdAt),
  };
}
```

</details>

<a id="fn-44"></a>

## mapLotDetail()

**Code:** [lot.mapper.js:29](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.mapper.js:29).

**Tham số:** `mapLotDetail(lot, product, stock)`.

**Công việc:** Ghép tóm tắt lô với thông tin xác minh và số dư đã lọc quyền.

**Xử lý theo thứ tự:**

1. Gọi mapLotSummary với việc danh sách stock có phần tử hay không.
2. Thêm notes, verifiedBy/At, updatedAt và stock.

**Ai gọi / gọi tiếp:** Được gọi bởi [getLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-59), [createLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-60), [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61). Gọi tiếp [mapLotSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-43), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-313).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Nhân viên kho A nhìn lô chung nhưng chỉ được nhận các dòng stock kho A mà service đã lọc.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapLotDetail(lot, product, stock) {
  return {
    ...mapLotSummary(lot, product, stock.length > 0),
    notes: lot.notes ?? null,
    verifiedBy: idString(lot.verifiedBy),
    verifiedAt: isoDate(lot.verifiedAt),
    updatedAt: isoDate(lot.updatedAt),
    stock,
  };
}
```

</details>

<a id="fn-45"></a>

## mapScopedStock()

**Code:** [lot.mapper.js:40](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.mapper.js:40).

**Tham số:** `mapScopedStock(balance, account, location, warehouse, party)`.

**Công việc:** Chuyển một số dư và các hồ sơ liên quan thành một dòng tồn lô.

**Xử lý theo thứ tự:**

1. Giữ balanceId, qtyBase và version.
2. Gắn vị trí/kho/tài khoản/chất lượng/chủ hàng từ dữ liệu đã có.
3. Không gộp chủ hàng hoặc chất lượng khác nhau.

**Ai gọi / gọi tiếp:** Được gọi bởi [scopedStockRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-57). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Cùng lô:20 GOOD của cửa hàng và 5 hàng giữ hộ vẫn là hai dòng khác nhau.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapScopedStock(balance, account, location, warehouse, party) {
  return {
    balanceId: idString(balance._id),
    qtyBase: balance.qtyBase.toString(),
    version: balance.version,
    warehouse: warehouse
      ? {
          id: idString(warehouse._id),
          code: warehouse.code,
          name: warehouse.name,
        }
      : null,
    location: location
      ? {
          id: idString(location._id),
          code: location.code,
          name: location.name,
        }
      : null,
    accountId: idString(account._id),
    qualityCode: balance.qualityCode,
    ownerParty: party
      ? {
          id: idString(party._id),
          code: party.code,
          name: party.name,
          kind: party.kind,
        }
      : { id: idString(balance.ownerPartyId), code: null, name: null, kind: null },
  };
}
```

</details>

<a id="fn-46"></a>

## requireLotReader()

**Code:** [lot.service.js:73](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:73).

**Tham số:** `requireLotReader(user)`.

**Công việc:** Yêu cầu đúng quyền đọc lô.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: chủ cửa hàng/kho.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [listLots()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-58), [getLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-59), [getLotMovements()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-63). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền đọc lô chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
requireLotReader = (user) =>
  requirePermission(user, "product_lot:read", LOT_ROLES)
```

</details>

<a id="fn-47"></a>

## requireLotCreator()

**Code:** [lot.service.js:75](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:75).

**Tham số:** `requireLotCreator(user)`.

**Công việc:** Yêu cầu đúng quyền tạo lô.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: chủ cửa hàng/kho.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [createLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-60). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền tạo lô chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
requireLotCreator = (user) =>
  requirePermission(user, "product_lot:create", LOT_ROLES)
```

</details>

<a id="fn-48"></a>

## requireLotUpdater()

**Code:** [lot.service.js:77](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:77).

**Tham số:** `requireLotUpdater(user)`.

**Công việc:** Yêu cầu đúng quyền sửa lô.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: chủ cửa hàng.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền sửa lô chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
requireLotUpdater = (user) =>
  requirePermission(user, "product_lot:update", ["OWNER"])
```

</details>

<a id="fn-49"></a>

## withSession()

**Code:** [lot.service.js:80](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:80).

**Tham số:** `withSession(query, session)`.

**Công việc:** Gắn truy vấn đang có vào giao dịch nếu bên gọi truyền session.

**Xử lý theo thứ tự:**

1. Nhận đối tượng query chưa lấy kết quả.
2. Có session thì gọi query.session(session); không có thì giữ query.
3. Trả query để bên gọi await tiếp.

**Ai gọi / gọi tiếp:** Được gọi bởi [findLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-55), [createLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-60). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Kết quả / nhánh bị chặn:** Query; helper không tự tạo một bộ lọc mới.

**Ví dụ:** Lấy sản phẩm khi tạo phiếu phải đọc cùng giao dịch; đọc ngoài giao dịch vẫn dùng được helper.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function withSession(query, session) {
  return session ? query.session(session) : query;
}
```

</details>

<a id="fn-50"></a>

## isDuplicateKey()

**Code:** [lot.service.js:84](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:84).

**Tham số:** `isDuplicateKey(error)`.

**Công việc:** Nhận biết lỗi trùng khóa duy nhất từ MongoDB.

**Xử lý theo thứ tự:**

1. Đọc error.code; so với 11000.
2. Trả true/false; không tự gửi thêm truy vấn hoặc xử lý lại giao dịch.

**Ai gọi / gọi tiếp:** Được gọi bởi [createLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-60), [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Kết quả / nhánh bị chặn:** Boolean; không chứng minh dữ liệu không trùng nếu chỉ kiểm trước khi save.

**Ví dụ:** Hai người cùng tạo một mã sản phẩm: MongoDB chặn bản trùng; hàm này giúp đổi lỗi kỹ thuật thành thông báo dễ hiểu.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function isDuplicateKey(error) {
  return error?.code === 11000;
}
```

</details>

<a id="fn-51"></a>

## verificationError()

**Code:** [lot.service.js:88](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:88).

**Tham số:** `verificationError(message)`.

**Công việc:** Tạo lỗi xác minh nhận dạng lô.

**Xử lý theo thứ tự:**

1. Gói thông báo thành ApiError 400 có mã LOT_VERIFICATION.

**Ai gọi / gọi tiếp:** Được gọi bởi [createLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-60), [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Yêu cầu VERIFIED nhưng tone là UNKNOWN thì trả lỗi rõ về xác minh.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function verificationError(message) {
  return new ApiError(400, message, { code: ERROR_CODES.LOT_VERIFICATION });
}
```

</details>

<a id="fn-52"></a>

## identityLockedError()

**Code:** [lot.service.js:92](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:92).

**Tham số:** `identityLockedError(currentVersion)`.

**Công việc:** Tạo lỗi không cho sửa nhận dạng đã dùng.

**Xử lý theo thứ tự:**

1. Gói ApiError 409, mã LOT_IDENTITY_LOCKED và currentVersion.

**Ai gọi / gọi tiếp:** Được gọi bởi [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Đã nhập theo toneT 1 thì không đổi hồ sơ thànhT 2 để sửa hộ lịch sử.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function identityLockedError(currentVersion) {
  return new ApiError(409, "Nhận dạng lô đã được sử dụng và không thể sửa", {
    code: ERROR_CODES.LOT_IDENTITY_LOCKED,
    details: { currentVersion },
  });
}
```

</details>

<a id="fn-53"></a>

## hasUnknown()

**Code:** [lot.service.js:99](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:99).

**Tham số:** `hasUnknown(values)`.

**Công việc:** Nhận diện thành phần nhận dạng chưa rõ.

**Xử lý theo thứ tự:**

1. Đổi từng giá trị sang chữ, cắt khoảng trắng và viết hoa để so UNKNOWN.
2. Trả true nếu có ít nhất một thành phần chưa rõ.

**Ai gọi / gọi tiếp:** Được gọi bởi [createLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-60), [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** unknown và UNKNOWN đều bị nhận ra khi muốn xác minh lô.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function hasUnknown(values) {
  return values.some(
    (value) => String(value ?? "").trim().toUpperCase() === "UNKNOWN",
  );
}
```

</details>

<a id="fn-54"></a>

## manufacturedDate()

**Code:** [lot.service.js:105](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:105).

**Tham số:** `manufacturedDate(value)`.

**Công việc:** Kiểm ngày sản xuất và đổi ngày Việt Nam sang thời điểm lưu.

**Xử lý theo thứ tự:**

1. Không có thì trả null.
2. So ngày YYYY-MM-DD với ngày hiện tại Việt Nam; tương lai thì lỗi.
3. Đạt thì calendarDateToInstant.

**Ai gọi / gọi tiếp:** Được gọi bởi [createLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-60), [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61). Gọi tiếp [saigonDateOnly()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-303), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [calendarDateToInstant()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-304).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Ngày sản xuất ngày mai không được lưu như một sự thật đã xảy ra.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function manufacturedDate(value) {
  if (value == null) return null;
  if (value > saigonDateOnly()) {
    throw validationError("Ngày sản xuất không được ở tương lai");
  }
  return calendarDateToInstant(value);
}
```

</details>

<a id="fn-55"></a>

## findLot()

**Code:** [lot.service.js:113](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:113).

**Tham số:** `findLot(id, session = null)`.

**Công việc:** Tìm một lô bằng mã, hỗ trợ cùng giao dịch.

**Xử lý theo thứ tự:**

1. Lot.findById và lean, gắn session nếu có.
2. Không có thì 404; có thì trả hồ sơ.

**Ai gọi / gọi tiếp:** Được gọi bởi [getLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-59), [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61), [getLotMovements()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-63). Gọi tiếp [withSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-49), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `Lot`, tại [dòng 114](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:114). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Lot.findById(id).lean()
```

**Ví dụ:** Sửa lô dùng cùng session với phần kiểm đã bị tham chiếu.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function findLot(id, session = null) {
  const lot = await withSession(Lot.findById(id).lean(), session);
  if (!lot) throw notFoundError("Không tìm thấy lô hàng");
  return lot;
}
```

</details>

<a id="fn-56"></a>

## productForLot()

**Code:** [lot.service.js:119](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:119).

**Tham số:** `productForLot(lot)`.

**Công việc:** Đọc hồ sơ sản phẩm mà lô tham chiếu.

**Xử lý theo thứ tự:**

1. Product.findById(lot.productId), trả dữ liệu thường.

**Ai gọi / gọi tiếp:** Được gọi bởi [getLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-59), [createLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-60), [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61). Không gọi hàm khác trong danh mục này.

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `Product`, tại [dòng 120](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:120). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.findById(lot.productId).lean()
```

**Ví dụ:** Lô L 01 hiện tên gạch A trong chi tiết; không tự gộp thành số tồn của sản phẩm.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function productForLot(lot) {
  return Product.findById(lot.productId).lean();
}
```

</details>

<a id="fn-57"></a>

## scopedStockRows()

**Code:** [lot.service.js:123](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:123).

**Tham số:** `scopedStockRows(lotIds, user, onlyWarehouseId = null)`.

**Công việc:** Ghép số dư lô với vị trí/kho/chủ hàng rồi lọc phạm vi xem.

**Xử lý theo thứ tự:**

1. Đọc StockBalance của các lotIds, dừng sớm nếu không có.
2. Đọc gom StockAccount, Location, Warehouse và Party.
3. Tạo Map tra cứu; chỉ giữ tài khoản giải được ra vị trí vật lý và kho được giao, hoặc chủ cửa hàng.
4. Nếu onlyWarehouseId có thì giữ đúng kho đó; map thành dòng số dư.

**Ai gọi / gọi tiếp:** Được gọi bởi [listLots()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-58), [getLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-59), [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [hasPermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-294), [mapScopedStock()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-45).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `StockBalance`, tại [dòng 125](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:125). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
StockBalance.find({ lotId: { $in: lotIds } }).lean()
```

- Đọc nhiều bản ghi qua `StockAccount`, tại [dòng 127](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:127). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
StockAccount.find({
    _id: { $in: balances.map((balance) => balance.accountId) },
  }).lean()
```

- Đọc nhiều bản ghi qua `Location`, tại [dòng 130](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:130). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Location.find({
    _id: {
      $in: accounts.map((account) => account.locationId).filter(Boolean),
    },
  }).lean()
```

- Đọc nhiều bản ghi qua `Warehouse`, tại [dòng 135](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:135). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.find({
    _id: { $in: locations.map((location) => location.warehouseId) },
  }).lean()
```

- Đọc nhiều bản ghi qua `Party`, tại [dòng 138](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:138). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Party.find({
    _id: { $in: balances.map((balance) => balance.ownerPartyId) },
  }).lean()
```

**Kết quả / nhánh bị chặn:** Mảng dòng theo lô; bản ghiqty 0 vẫn có thể làm hasScopedStock=true.

**Ví dụ:** Lô có 50 kho A và 30 kho B; nhân viên A chỉ nhận các dòng A.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function scopedStockRows(lotIds, user, onlyWarehouseId = null) {
  if (!lotIds.length) return [];
  const balances = await StockBalance.find({ lotId: { $in: lotIds } }).lean();
  if (!balances.length) return [];
  const accounts = await StockAccount.find({
    _id: { $in: balances.map((balance) => balance.accountId) },
  }).lean();
  const locations = await Location.find({
    _id: {
      $in: accounts.map((account) => account.locationId).filter(Boolean),
    },
  }).lean();
  const warehouses = await Warehouse.find({
    _id: { $in: locations.map((location) => location.warehouseId) },
  }).lean();
  const parties = await Party.find({
    _id: { $in: balances.map((balance) => balance.ownerPartyId) },
  }).lean();
  const accountById = new Map(
    accounts.map((account) => [idString(account._id), account]),
  );
  const locationById = new Map(
    locations.map((location) => [idString(location._id), location]),
  );
  const warehouseById = new Map(
    warehouses.map((warehouse) => [idString(warehouse._id), warehouse]),
  );
  const partyById = new Map(
    parties.map((party) => [idString(party._id), party]),
  );
  const owner = hasPermission(user, "product_lot:read", ["OWNER"]);
  const assigned = new Set((user.warehouseIds || []).map(idString));
  return balances
    .map((balance) => {
      const account = accountById.get(idString(balance.accountId));
      const location = locationById.get(idString(account?.locationId));
      if (!account || !location) return null;
      const warehouseId = idString(location.warehouseId);
      if (onlyWarehouseId && warehouseId !== idString(onlyWarehouseId)) return null;
      if (!owner && !assigned.has(warehouseId)) return null;
      const warehouse = warehouseById.get(warehouseId);
      if (!warehouse) return null;
      return {
        lotId: idString(balance.lotId),
        mapped: mapScopedStock(
          balance,
          account,
          location,
          warehouse,
          partyById.get(idString(balance.ownerPartyId)),
        ),
      };
    })
    .filter(Boolean);
}
```

</details>

<a id="fn-58"></a>

## listLots()

**Code:** [lot.service.js:179](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:179).

**Tham số:** `listLots(user, query)`.

**Công việc:** Đọc danh mục lô chung và cờ có số dư trong phạm vi.

**Xử lý theo thứ tự:**

1. Kiểm quyền, nếu chọn kho thì kiểm kho được phép.
2. Find/count Lot theo nhận dạng và phân trang.
3. Đọc Product, gọi scopedStockRows cho trang; mapLotSummary và cờ hiện diện.

**Ai gọi / gọi tiếp:** Được gọi bởi [list()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-38). Gọi tiếp [requireLotReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-46), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298), [scopeError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-327), [scopedStockRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-57), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [mapLotSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-43).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `Lot`, tại [dòng 195](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:195). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Lot.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean()
```

- Đếm bản ghi qua `Lot`, tại [dòng 200](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:200). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Lot.countDocuments(filter)
```

- Đọc nhiều bản ghi qua `Product`, tại [dòng 203](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:203). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.find({ _id: { $in: lots.map((lot) => lot.productId) } }).lean()
```

**Ví dụ:** Chọn warehouseId=A không loại hồ sơ lô chưa có tồnA; chỉ ảnh hưởng cờ hiện diện.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function listLots(user, query) {
  requireLotReader(user);
  if (query.warehouseId && !canAccessWarehouse(user, query.warehouseId)) {
    throw scopeError("Bạn không được phân công kho này");
  }
  const filter = {};
  for (const field of [
    "productId",
    "manufacturerLot",
    "tone",
    "calibre",
    "identificationStatus",
  ]) {
    if (query[field] != null) filter[field] = query[field];
  }
  const [lots, total] = await Promise.all([
    Lot.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Lot.countDocuments(filter),
  ]);
  const [products, stockRows] = await Promise.all([
    Product.find({ _id: { $in: lots.map((lot) => lot.productId) } }).lean(),
    scopedStockRows(
      lots.map((lot) => lot._id),
      user,
      query.warehouseId,
    ),
  ]);
  const productById = new Map(
    products.map((product) => [idString(product._id), product]),
  );
  const stockedLots = new Set(stockRows.map((row) => row.lotId));
  return {
    items: lots.map((lot) =>
      mapLotSummary(
        lot,
        productById.get(idString(lot.productId)),
        stockedLots.has(idString(lot._id)),
      ),
    ),
    total,
    page: query.page,
    limit: query.limit,
  };
}
```

</details>

<a id="fn-59"></a>

## getLot()

**Code:** [lot.service.js:228](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:228).

**Tham số:** `getLot(user, id)`.

**Công việc:** Đọc chi tiết một lô và số dư được phép.

**Xử lý theo thứ tự:**

1. Kiểm quyền; findLot.
2. Đọc Product và scopedStockRows.
3. Trả mapLotDetail, không ghi lô hoặc tồn.

**Ai gọi / gọi tiếp:** Được gọi bởi [detail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-39). Gọi tiếp [requireLotReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-46), [findLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-55), [productForLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-56), [scopedStockRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-57), [mapLotDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-44).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Lot.findById`, `Product.findById`, `StockBalance.find`, `StockAccount.find`, `Location.find`, `Warehouse.find`, `Party.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Hồ sơ lô có thể xem dù không có số dư nào trong kho được giao.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getLot(user, id) {
  requireLotReader(user);
  const lot = await findLot(id);
  const [product, stockRows] = await Promise.all([
    productForLot(lot),
    scopedStockRows([lot._id], user),
  ]);
  return mapLotDetail(lot, product, stockRows.map((row) => row.mapped));
}
```

</details>

<a id="fn-60"></a>

## createLot()

**Code:** [lot.service.js:238](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:238).

**Tham số:** `createLot(user, input)`.

**Công việc:** Tạo nhận dạng lô, chưa nhập lượng vào kho.

**Xử lý theo thứ tự:**

1. Kiểm quyền, ngày sản xuất và điều kiện VERIFIED/căn cứ.
2. Trong giao dịch kiểm sản phẩm active và bộ product/manufacturerLot/tone/calibre chưa trùng.
3. Save Lot version 1, identityLocked=false; nếu VERIFIED lưu người/thời điểm xác minh.
4. Save audit; bắt trùng khóa.

**Ai gọi / gọi tiếp:** Được gọi bởi [create()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-40). Gọi tiếp [requireLotCreator()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-47), [manufacturedDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-54), [hasUnknown()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-53), [verificationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-51), [withSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-49), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [duplicateError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-329), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [isDuplicateKey()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-50), [mapLotDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-44), [productForLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-56).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `Product`, tại [dòng 256](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:256). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.findById(input.productId).lean()
```

- Đọc một bản ghi qua `Lot`, tại [dòng 262](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:262). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Lot.findOne({
        productId: input.productId,
        manufacturerLot: input.manufacturerLot,
        tone: input.tone,
        calibre: input.calibre,
      })
        .session(session)
        .lean()
```

- Ghi đối tượng model đã tạo qua `Lot`, tại [dòng 272](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:272). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
new Lot({
        productId: input.productId,
        manufacturerLot: input.manufacturerLot,
        tone: input.tone,
        calibre: input.calibre,
        identificationStatus: input.identificationStatus,
        ...(manufacturedOn && { manufacturedOn }),
        ...(input.verificationReference != null && {
          verificationReference: input.verificationReference,
        }),
        ...(input.notes != null && { notes: input.notes }),
        ...(verified && {
          verifiedBy: user._id,
          verifiedAt: new Date(),
        }),
        version: 1,
        createdBy: user._id,
        identityLocked: false,
      }).save({ session })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
        actorId: user._id,
        action: "CREATE_LOT",
        entityType: "LOT",
        entityId: created._id,
        details: {
          productId: idString(created.productId),
          manufacturerLot: created.manufacturerLot,
          tone: created.tone,
          calibre: created.calibre,
          identificationStatus: created.identificationStatus,
        },
        session,
      })
```

**Ví dụ:** Kho nhận đúng lôL 01/T 1/C 1 của gạch A thì dùng chung hồ sơ lô, không tạo riêng vì khác kho.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function createLot(user, input) {
  requireLotCreator(user);
  const manufacturedOn = manufacturedDate(input.manufacturedOn);
  if (input.identificationStatus === "VERIFIED") {
    if (
      hasUnknown([input.manufacturerLot, input.tone, input.calibre]) ||
      !input.verificationReference
    ) {
      throw verificationError(
        "Lô VERIFIED cần đủ nhận dạng thực và căn cứ xác minh",
      );
    }
  }
  const session = await mongoose.startSession();
  let lot;
  try {
    lot = await session.withTransaction(async () => {
      const product = await withSession(
        Product.findById(input.productId).lean(),
        session,
      );
      if (!product || !product.isActive) {
        throw validationError("Sản phẩm không tồn tại hoặc đã ngừng hoạt động");
      }
      const duplicate = await Lot.findOne({
        productId: input.productId,
        manufacturerLot: input.manufacturerLot,
        tone: input.tone,
        calibre: input.calibre,
      })
        .session(session)
        .lean();
      if (duplicate) throw duplicateError("Nhận dạng lô đã tồn tại");
      const verified = input.identificationStatus === "VERIFIED";
      const created = await new Lot({
        productId: input.productId,
        manufacturerLot: input.manufacturerLot,
        tone: input.tone,
        calibre: input.calibre,
        identificationStatus: input.identificationStatus,
        ...(manufacturedOn && { manufacturedOn }),
        ...(input.verificationReference != null && {
          verificationReference: input.verificationReference,
        }),
        ...(input.notes != null && { notes: input.notes }),
        ...(verified && {
          verifiedBy: user._id,
          verifiedAt: new Date(),
        }),
        version: 1,
        createdBy: user._id,
        identityLocked: false,
      }).save({ session });
      await appendAudit({
        actorId: user._id,
        action: "CREATE_LOT",
        entityType: "LOT",
        entityId: created._id,
        details: {
          productId: idString(created.productId),
          manufacturerLot: created.manufacturerLot,
          tone: created.tone,
          calibre: created.calibre,
          identificationStatus: created.identificationStatus,
        },
        session,
      });
      return created.toObject();
    }, transactionOptions);
  } catch (error) {
    if (isDuplicateKey(error)) throw duplicateError("Nhận dạng lô đã tồn tại");
    throw error;
  } finally {
    await session.endSession();
  }
  return mapLotDetail(lot, await productForLot(lot), []);
}
```

</details>

<a id="fn-61"></a>

## updateLot()

**Code:** [lot.service.js:316](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:316).

**Tham số:** `updateLot(user, id, input)`.

**Công việc:** Sửa metadata lô và chặn thay nhận dạng đã dùng.

**Xử lý theo thứ tự:**

1. Kiểm chủ cửa hàng/version; lotHasReferences tìm dòng hoặc số dư tham chiếu.
2. Nếu nhận dạng thay mà đã khóa/có tham chiếu thì 409; VERIFIED không hạ UNKNOWN, xác minh lại cần căn cứ.
3. Dựng $set/$unset theo trường thực sự được gửi; cập nhật có điều kiện version và khi đổi nhận dạng phải identityLocked=false.
4. Tăng version và ghi audit trong giao dịch.

**Ai gọi / gọi tiếp:** Được gọi bởi [update()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-41). Gọi tiếp [requireLotUpdater()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-48), [findLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-55), [versionConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-328), [lotHasReferences()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-318), [identityLockedError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-52), [verificationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-51), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [hasUnknown()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-53), [manufacturedDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-54), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [changedFields()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-301), [isDuplicateKey()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-50), [duplicateError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-329), [productForLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-56), [scopedStockRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-57), [mapLotDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-44).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Cập nhật một bản ghi qua `Lot`, tại [dòng 331](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:331). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Lot.updateOne(
          { _id: current._id, identityLocked: false },
          { $set: { identityLocked: true } },
          { session },
        )
```

- Cập nhật rồi lấy bản ghi kết quả qua `Lot`, tại [dòng 436](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:436). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Lot.findOneAndUpdate(filter, update, {
        returnDocument: "after",
        runValidators: true,
        session,
      }).lean()
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
        actorId: user._id,
        action: "UPDATE_LOT",
        entityType: "LOT",
        entityId: next._id,
        changes: changedFields(current, next, auditFields),
        session,
      })
```

**Ví dụ:** Lô chưa dùng sửa tone nhầm được; lô đã ở GR phải sửa sai chứng từ thay vì đổi tone trên hồ sơ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function updateLot(user, id, input) {
  requireLotUpdater(user);
  const session = await mongoose.startSession();
  let updated;
  try {
    updated = await session.withTransaction(async () => {
      const current = await findLot(id, session);
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      const referencesExist = await lotHasReferences(current._id, session);
      if (referencesExist && !current.identityLocked) {
        await Lot.updateOne(
          { _id: current._id, identityLocked: false },
          { $set: { identityLocked: true } },
          { session },
        );
      }
      const identityChanged = identityFields.some(
        (field) =>
          Object.hasOwn(input, field) && input[field] !== current[field],
      );
      if (
        identityChanged &&
        (current.identityLocked || referencesExist)
      ) {
        throw identityLockedError(current.version);
      }
      const targetStatus =
        input.identificationStatus ?? current.identificationStatus;
      if (
        current.identificationStatus === "VERIFIED" &&
        targetStatus === "UNKNOWN"
      ) {
        throw verificationError(
          "Không thể chuyển lô đã xác minh về UNKNOWN trong UC-27",
        );
      }
      if (identityChanged && !input.identificationStatus) {
        throw validationError(
          "Thay đổi nhận dạng lô phải gửi kèm identificationStatus",
        );
      }
      const nextIdentity = {
        manufacturerLot: input.manufacturerLot ?? current.manufacturerLot,
        tone: input.tone ?? current.tone,
        calibre: input.calibre ?? current.calibre,
      };
      const reverify =
        targetStatus === "VERIFIED" &&
        (current.identificationStatus !== "VERIFIED" ||
          identityChanged ||
          Object.hasOwn(input, "verificationReference"));
      if (targetStatus === "VERIFIED") {
        if (
          hasUnknown(Object.values(nextIdentity)) ||
          (reverify && !input.verificationReference)
        ) {
          throw verificationError(
            "Lô VERIFIED cần đủ nhận dạng thực và căn cứ xác minh mới",
          );
        }
      }
      if (
        current.identificationStatus === "VERIFIED" &&
        !identityChanged &&
        input.verificationReference === null
      ) {
        throw verificationError("Không thể xóa căn cứ xác minh của lô VERIFIED");
      }
      const set = {
        identificationStatus: targetStatus,
      };
      for (const field of identityFields) {
        if (input[field] != null) set[field] = input[field];
      }
      const unset = {};
      if (Object.hasOwn(input, "manufacturedOn")) {
        set.manufacturedOn = manufacturedDate(input.manufacturedOn);
        if (set.manufacturedOn == null) {
          delete set.manufacturedOn;
          unset.manufacturedOn = "";
        }
      }
      if (Object.hasOwn(input, "notes")) {
        if (input.notes == null) unset.notes = "";
        else set.notes = input.notes;
      }
      if (Object.hasOwn(input, "verificationReference")) {
        if (input.verificationReference == null) {
          unset.verificationReference = "";
        } else {
          set.verificationReference = input.verificationReference;
        }
      } else if (
        identityChanged &&
        targetStatus !== "VERIFIED" &&
        !input.verificationReference
      ) {
        unset.verificationReference = "";
      }
      if (targetStatus === "VERIFIED") {
        if (reverify) {
          set.verifiedBy = user._id;
          set.verifiedAt = new Date();
        }
      } else {
        unset.verifiedBy = "";
        unset.verifiedAt = "";
      }
      const filter = {
        _id: current._id,
        version: input.expectedVersion,
        ...(identityChanged && { identityLocked: false }),
      };
      const update = { $set: set, $inc: { version: 1 } };
      if (Object.keys(unset).length) update.$unset = unset;
      const next = await Lot.findOneAndUpdate(filter, update, {
        returnDocument: "after",
        runValidators: true,
        session,
      }).lean();
      if (!next) {
        if (identityChanged) throw identityLockedError(current.version);
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      await appendAudit({
        actorId: user._id,
        action: "UPDATE_LOT",
        entityType: "LOT",
        entityId: next._id,
        changes: changedFields(current, next, auditFields),
        session,
      });
      return next;
    }, transactionOptions);
  } catch (error) {
    if (isDuplicateKey(error)) throw duplicateError("Nhận dạng lô đã tồn tại");
    throw error;
  } finally {
    await session.endSession();
  }
  const [product, stockRows] = await Promise.all([
    productForLot(updated),
    scopedStockRows([updated._id], user),
  ]);
  return mapLotDetail(updated, product, stockRows.map((row) => row.mapped));
}
```

</details>

<a id="fn-62"></a>

## movementDocumentReference()

**Code:** [lot.service.js:471](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:471).

**Tham số:** `movementDocumentReference(document, user)`.

**Công việc:** Chỉ trả thông tin nguồn của movement khi được đọc chứng từ đó.

**Xử lý theo thứ tự:**

1. Tạo tham chiếu tối thiểu access=UNAVAILABLE.
2. Tra quyền theo loại phiếu và kho.
3. Đủ thì thêm số phiếu/trạng thái/version, đặt READABLE.

**Ai gọi / gọi tiếp:** Được gọi bởi [getLotMovements()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-63). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [hasPermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-294), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Xem lịch sử lô không tự cho quyền đọc nội dung phiếu điều chỉnh.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function movementDocumentReference(document, user) {
  const base = {
    id: idString(document?._id),
    documentKind: document?.documentKind ?? null,
    access: "UNAVAILABLE",
  };
  if (!document) return base;
  const permission = documentPermissions[document.documentKind];
  const warehouseId = document.header?.warehouseId;
  if (
    !permission ||
    !hasPermission(user, permission) ||
    (warehouseId && !canAccessWarehouse(user, warehouseId))
  ) {
    return base;
  }
  return {
    ...base,
    access: "READABLE",
    documentNo: document.documentNo,
    workflowStatus: document.workflowStatus,
    version: document.version,
  };
}
```

</details>

<a id="fn-63"></a>

## getLotMovements()

**Code:** [lot.service.js:496](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:496).

**Tham số:** `getLotMovements(user, id, query)`.

**Công việc:** Đọc lịch sử lượng vào/ra của lô với nguồn và số trước/sau.

**Xử lý theo thứ tự:**

1. Kiểm quyền lô và stock_movement:read; đọc số dư lô rồi movement có một đầu thuộc chúng.
2. Đọc gom mọi đầu số dư/tài khoản/vị trí/kho/chủ hàng/chứng từ/batch liên quan.
3. Map hai đầu; đầu nào được khai báo nhưng không giải được trong phạm vi thì bỏ movement.
4. Lấy số trước/sau từ movement đã lưu, lọc xong mới chia trang.

**Ai gọi / gọi tiếp:** Được gọi bởi [movements()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-42). Gọi tiếp [requireLotReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-46), [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295), [findLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-55), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [hasPermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-294), [getLotMovements.allowedWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-64), [getLotMovements.mapEndpoint()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-65), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-313), [movementDocumentReference()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-62).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `StockBalance`, tại [dòng 500](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:500). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
StockBalance.find({ lotId: lot._id }).lean()
```

- Đọc nhiều bản ghi qua `StockMovement`, tại [dòng 505](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:505). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
StockMovement.find({
    $or: [
      { fromBalanceId: { $in: balanceIds } },
      { toBalanceId: { $in: balanceIds } },
    ],
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean()
```

- Đọc nhiều bản ghi qua `StockBalance`, tại [dòng 521](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:521). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
StockBalance.find({ _id: { $in: endpointIds } }).lean()
```

- Đọc nhiều bản ghi qua `StockAccount`, tại [dòng 522](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:522). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
StockAccount.find({
    _id: { $in: balances.map((balance) => balance.accountId) },
  }).lean()
```

- Đọc nhiều bản ghi qua `Location`, tại [dòng 525](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:525). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Location.find({
    _id: {
      $in: accounts.map((account) => account.locationId).filter(Boolean),
    },
  }).lean()
```

- Đọc nhiều bản ghi qua `Warehouse`, tại [dòng 530](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:530). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.find({
    _id: { $in: locations.map((location) => location.warehouseId) },
  }).lean()
```

- Đọc nhiều bản ghi qua `Party`, tại [dòng 533](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:533). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Party.find({
    _id: { $in: balances.map((balance) => balance.ownerPartyId) },
  }).lean()
```

- Đọc nhiều bản ghi qua `BusinessDocument`, tại [dòng 536](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:536). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.find({
    _id: { $in: movements.map((movement) => movement.documentId) },
  }).lean()
```

- Đọc nhiều bản ghi qua `PostingBatch`, tại [dòng 539](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:539). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
PostingBatch.find({
    _id: { $in: movements.map((movement) => movement.batchId) },
  }).lean()
```

**Kết quả / nhánh bị chặn:** Có thể bỏ movement liên quan tài khoản transit không có location; không phải log đầy đủ hành trình liên kho.

**Ví dụ:** Nhập 70 rồi cất 20 tạo hai sự kiện; không hiểu tổng lượng nhận là 90.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getLotMovements(user, id, query) {
  requireLotReader(user);
  requirePermission(user, "stock_movement:read", LOT_ROLES);
  const lot = await findLot(id);
  const lotBalances = await StockBalance.find({ lotId: lot._id }).lean();
  if (!lotBalances.length) {
    return { items: [], total: 0, page: query.page, limit: query.limit };
  }
  const balanceIds = lotBalances.map((balance) => balance._id);
  const movements = await StockMovement.find({
    $or: [
      { fromBalanceId: { $in: balanceIds } },
      { toBalanceId: { $in: balanceIds } },
    ],
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  const endpointIds = [
    ...new Set(
      movements.flatMap((movement) => [
        idString(movement.fromBalanceId),
        idString(movement.toBalanceId),
      ]).filter(Boolean),
    ),
  ];
  const balances = await StockBalance.find({ _id: { $in: endpointIds } }).lean();
  const accounts = await StockAccount.find({
    _id: { $in: balances.map((balance) => balance.accountId) },
  }).lean();
  const locations = await Location.find({
    _id: {
      $in: accounts.map((account) => account.locationId).filter(Boolean),
    },
  }).lean();
  const warehouses = await Warehouse.find({
    _id: { $in: locations.map((location) => location.warehouseId) },
  }).lean();
  const parties = await Party.find({
    _id: { $in: balances.map((balance) => balance.ownerPartyId) },
  }).lean();
  const documents = await BusinessDocument.find({
    _id: { $in: movements.map((movement) => movement.documentId) },
  }).lean();
  const batches = await PostingBatch.find({
    _id: { $in: movements.map((movement) => movement.batchId) },
  }).lean();
  const balanceById = new Map(
    balances.map((balance) => [idString(balance._id), balance]),
  );
  const accountById = new Map(
    accounts.map((account) => [idString(account._id), account]),
  );
  const locationById = new Map(
    locations.map((location) => [idString(location._id), location]),
  );
  const warehouseById = new Map(
    warehouses.map((warehouse) => [idString(warehouse._id), warehouse]),
  );
  const partyById = new Map(
    parties.map((party) => [idString(party._id), party]),
  );
  const documentById = new Map(
    documents.map((document) => [idString(document._id), document]),
  );
  const batchById = new Map(
    batches.map((batch) => [idString(batch._id), batch]),
  );
  const owner = hasPermission(user, "product_lot:read", ["OWNER"]);
  const assigned = new Set((user.warehouseIds || []).map(idString));
  const allowedWarehouse = (warehouseId) =>
    owner || assigned.has(idString(warehouseId));
  const mapEndpoint = (side, balanceId) => {
    if (!balanceId) return null;
    const balance = balanceById.get(idString(balanceId));
    const account = balance && accountById.get(idString(balance.accountId));
    const location = account && locationById.get(idString(account.locationId));
    const warehouse = location && warehouseById.get(idString(location.warehouseId));
    if (
      !balance ||
      !account ||
      !location ||
      !warehouse ||
      !allowedWarehouse(warehouse._id) ||
      idString(balance.lotId) !== idString(lot._id)
    ) {
      return null;
    }
    return {
      balanceId: idString(balance._id),
      qtyBefore:
        side === "from"
          ? balance.qtyBase.toString()
          : balance.qtyBase.toString(),
      warehouse: {
        id: idString(warehouse._id),
        code: warehouse.code,
        name: warehouse.name,
      },
      location: {
        id: idString(location._id),
        code: location.code,
        name: location.name,
      },
      qualityCode: balance.qualityCode,
      ownerParty: partyById.get(idString(balance.ownerPartyId))
        ? {
            id: idString(balance.ownerPartyId),
            code: partyById.get(idString(balance.ownerPartyId)).code,
            name: partyById.get(idString(balance.ownerPartyId)).name,
            kind: partyById.get(idString(balance.ownerPartyId)).kind,
          }
        : { id: idString(balance.ownerPartyId), code: null, name: null, kind: null },
    };
  };
  const items = [];
  for (const movement of movements) {
    const from = mapEndpoint("from", movement.fromBalanceId);
    const to = mapEndpoint("to", movement.toBalanceId);
    if (movement.fromBalanceId && !from) continue;
    if (movement.toBalanceId && !to) continue;
    if (!from && !to) continue;
    const batch = batchById.get(idString(movement.batchId));
    const document = documentById.get(idString(movement.documentId));
    items.push({
      id: idString(movement._id),
      qtyBase: movement.qtyBase.toString(),
      fromBalance: from
        ? {
            ...from,
            qtyBefore: movement.fromBefore?.toString() ?? null,
            qtyAfter: movement.fromAfter?.toString() ?? null,
          }
        : null,
      toBalance: to
        ? {
            ...to,
            qtyBefore: movement.toBefore?.toString() ?? null,
            qtyAfter: movement.toAfter?.toString() ?? null,
          }
        : null,
      batch: batch
        ? {
            id: idString(batch._id),
            operation: batch.operation,
            postedAt: isoDate(batch.postedAt),
            reversalOf: idString(batch.reversalOf),
          }
        : null,
      document: movementDocumentReference(document, user),
      occurredAt: isoDate(movement.createdAt),
    });
  }
  const start = (query.page - 1) * query.limit;
  return {
    items: items.slice(start, start + query.limit),
    total: items.length,
    page: query.page,
    limit: query.limit,
  };
}
```

</details>

<a id="fn-64"></a>

## getLotMovements.allowedWarehouse()

**Code:** [lot.service.js:565](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:565).

**Tham số:** `getLotMovements.allowedWarehouse(warehouseId)`.

**Công việc:** Kiểm một kho thuộc phạm vi của người xem log lô.

**Xử lý theo thứ tự:**

1. Chủ cửa hàng thì true; vai trò khác phải có mã kho trong tập assigned đã dựng.

**Ai gọi / gọi tiếp:** Được gọi bởi [getLotMovements()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-63), [getLotMovements.mapEndpoint()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-65). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Đầu nguồn khoA/đầu đíchB chỉ được hiện khi cả đầu cần thiết đều được phép.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
allowedWarehouse = (warehouseId) =>
    owner || assigned.has(idString(warehouseId))
```

</details>

<a id="fn-65"></a>

## getLotMovements.mapEndpoint()

**Code:** [lot.service.js:567](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.service.js:567).

**Tham số:** `getLotMovements.mapEndpoint(side, balanceId)`.

**Công việc:** Giải mã đầu nguồn hoặc đích của movement thành thông tin kho/vị trí.

**Xử lý theo thứ tự:**

1. Nhận mã balance, tra lần lượt balance→account→location→warehouse.
2. Thiếu mắt xích, khác lô hoặc ngoài kho được phép thì null.
3. Đạt thì trả thông tin đầu, chất lượng và chủ hàng; bên ngoài thay qtyBefore bằng dữ liệu lịch sử thật.

**Ai gọi / gọi tiếp:** Được gọi bởi [getLotMovements()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-63). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [getLotMovements.allowedWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-64).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Một tài khoản đang vận chuyển không có location sẽ trả null ở helper này.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
mapEndpoint = (side, balanceId) => {
    if (!balanceId) return null;
    const balance = balanceById.get(idString(balanceId));
    const account = balance && accountById.get(idString(balance.accountId));
    const location = account && locationById.get(idString(account.locationId));
    const warehouse = location && warehouseById.get(idString(location.warehouseId));
    if (
      !balance ||
      !account ||
      !location ||
      !warehouse ||
      !allowedWarehouse(warehouse._id) ||
      idString(balance.lotId) !== idString(lot._id)
    ) {
      return null;
    }
    return {
      balanceId: idString(balance._id),
      qtyBefore:
        side === "from"
          ? balance.qtyBase.toString()
          : balance.qtyBase.toString(),
      warehouse: {
        id: idString(warehouse._id),
        code: warehouse.code,
        name: warehouse.name,
      },
      location: {
        id: idString(location._id),
        code: location.code,
        name: location.name,
      },
      qualityCode: balance.qualityCode,
      ownerParty: partyById.get(idString(balance.ownerPartyId))
        ? {
            id: idString(balance.ownerPartyId),
            code: partyById.get(idString(balance.ownerPartyId)).code,
            name: partyById.get(idString(balance.ownerPartyId)).name,
            kind: partyById.get(idString(balance.ownerPartyId)).kind,
          }
        : { id: idString(balance.ownerPartyId), code: null, name: null, kind: null },
    };
  }
```

</details>

<a id="fn-66"></a>

## positiveInteger()

**Code:** [lot.validation.js:7](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.validation.js:7).

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

<a id="fn-67"></a>

## optionalText()

**Code:** [lot.validation.js:16](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.validation.js:16).

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
optionalText = (max) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .nullable()
    .optional()
```

</details>

<a id="fn-68"></a>

## identityText()

**Code:** [lot.validation.js:29](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.validation.js:29).

**Tham số:** `identityText(max)`.

**Công việc:** Kiểm mã nhận dạng lô là chuỗi không rỗng.

**Xử lý theo thứ tự:**

1. Cắt khoảng trắng đầu/cuối.
2. Kiểm có nội dung và không quá chiều dài cho phép; không đổi hoa thường.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Tone T 1 và t 1 không tự bị gộp thành một mã bởi helper này.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
identityText = (max) => z.string().trim().min(1).max(max)
```

</details>

