---
id: DOC-CODE-IT1-SUPPLIERS-20261105
title: "Nhà cung cấp — giải thích từng hàm"
version: 1.0.0
phase: Review
domain: Iteration1
tags: [backend, function, database]
last_updated: 2026-11-05
---

# Nhà cung cấp — giải thích từng hàm

[Quay lại hướng dẫn đọc](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/README.md). Bản source ngày 05/11/2026; các đoạn lệnh dưới đây được lấy trực tiếp từ file hiện tại.

## Tìm nhanh

- [supplier.controller.js → list()](#fn-69)
- [supplier.controller.js → detail()](#fn-70)
- [supplier.controller.js → create()](#fn-71)
- [supplier.controller.js → update()](#fn-72)
- [supplier.controller.js → changeStatus()](#fn-73)
- [supplier.controller.js → history()](#fn-74)
- [supplier.controller.js → documents()](#fn-75)
- [supplier.controller.js → getNames()](#fn-76)
- [supplier.mapper.js → supplierStatus()](#fn-77)
- [supplier.mapper.js → mapSupplierSummary()](#fn-78)
- [supplier.mapper.js → mapSupplierDetail()](#fn-79)
- [supplier.mapper.js → mapSupplierDocument()](#fn-80)
- [supplier.service.js → isDuplicateKey()](#fn-81)
- [supplier.service.js → requireSupplierReader()](#fn-82)
- [supplier.service.js → requireSupplierCreator()](#fn-83)
- [supplier.service.js → requireSupplierEditor()](#fn-84)
- [supplier.service.js → requireSupplierStatusEditor()](#fn-85)
- [supplier.service.js → withSession()](#fn-86)
- [supplier.service.js → warehouseScope()](#fn-87)
- [supplier.service.js → supplierFilter()](#fn-88)
- [supplier.service.js → findSupplier()](#fn-89)
- [supplier.service.js → listSuppliers()](#fn-90)
- [supplier.service.js → getSupplier()](#fn-91)
- [supplier.service.js → createSupplier()](#fn-92)
- [supplier.service.js → updateSupplier()](#fn-93)
- [supplier.service.js → changeSupplierStatus()](#fn-94)
- [supplier.service.js → getSupplierHistory()](#fn-95)
- [supplier.service.js → supplierDocumentIdsForGr()](#fn-96)
- [supplier.service.js → getSupplierDocuments()](#fn-97)
- [supplier.service.js → getSupplierNames()](#fn-98)
- [supplier.validation.js → positiveInteger()](#fn-99)
- [supplier.validation.js → optionalText()](#fn-100)

<a id="fn-69"></a>

## list()

**Code:** [supplier.controller.js:5](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.controller.js:5).

**Tham số:** `list(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới listSuppliers và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ listSuppliers hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/suppliers` ([route dòng 12](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:12)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [listSuppliers()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-90), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Party.find`, `Party.countDocuments`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do listSuppliers quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
list = catchAsync(async (req, res) => {
  const data = await service.listSuppliers(req.user, req.validated.query);
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-70"></a>

## detail()

**Code:** [supplier.controller.js:10](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.controller.js:10).

**Tham số:** `detail(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới getSupplier và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ getSupplier hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/suppliers/:id` ([route dòng 39](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:39)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [getSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-91), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Party.findOne`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do getSupplier quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
detail = catchAsync(async (req, res) => {
  const data = await service.getSupplier(req.user, req.validated.params.id);
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-71"></a>

## create()

**Code:** [supplier.controller.js:15](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.controller.js:15).

**Tham số:** `create(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới createSupplier và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ createSupplier hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `POST /api/suppliers` ([route dòng 21](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:21)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [createSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-92), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Party.findOne`, `Party.save`, `AuditEvent.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do createSupplier quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
create = catchAsync(async (req, res) => {
  const data = await service.createSupplier(req.user, req.validated.body);
  formatApiResponse(res, {
    statusCode: 201,
    message: "Tạo nhà cung cấp thành công",
    data,
  });
})
```

</details>

<a id="fn-72"></a>

## update()

**Code:** [supplier.controller.js:24](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.controller.js:24).

**Tham số:** `update(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới updateSupplier và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ updateSupplier hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `PUT /api/suppliers/:id` ([route dòng 45](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:45)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [updateSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-93), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Party.findOneAndUpdate`, `Party.findOne`, `AuditEvent.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do updateSupplier quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
update = catchAsync(async (req, res) => {
  const data = await service.updateSupplier(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-73"></a>

## changeStatus()

**Code:** [supplier.controller.js:33](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.controller.js:33).

**Tham số:** `changeStatus(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới changeSupplierStatus và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ changeSupplierStatus hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `PATCH /api/suppliers/:id/status` ([route dòng 51](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:51)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [changeSupplierStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-94), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Party.findOneAndUpdate`, `Party.findOne`, `AuditEvent.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do changeSupplierStatus quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
changeStatus = catchAsync(async (req, res) => {
  const data = await service.changeSupplierStatus(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-74"></a>

## history()

**Code:** [supplier.controller.js:42](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.controller.js:42).

**Tham số:** `history(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới getSupplierHistory và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ getSupplierHistory hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/suppliers/:id/history` ([route dòng 27](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:27)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [getSupplierHistory()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-95), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `AuditEvent.find`, `AuditEvent.countDocuments`, `Party.findOne`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do getSupplierHistory quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
history = catchAsync(async (req, res) => {
  const data = await service.getSupplierHistory(
    req.user,
    req.validated.params.id,
    req.validated.query,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-75"></a>

## documents()

**Code:** [supplier.controller.js:51](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.controller.js:51).

**Tham số:** `documents(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới getSupplierDocuments và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ getSupplierDocuments hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/suppliers/:id/documents` ([route dòng 33](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:33)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [getSupplierDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-97), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `BusinessDocument.find`, `BusinessDocument.countDocuments`, `Warehouse.find`, `Party.findOne`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do getSupplierDocuments quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
documents = catchAsync(async (req, res) => {
  const data = await service.getSupplierDocuments(
    req.user,
    req.validated.params.id,
    req.validated.query,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-76"></a>

## getNames()

**Code:** [supplier.controller.js:60](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.controller.js:60).

**Tham số:** `getNames(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới getSupplierNames và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Hàm này không truyền req.user xuống service; việc kiểm quyền cần xem route và service, không mặc định đã có.
2. Đợi hàm nghiệp vụ getSupplierNames hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/suppliers/names` ([route dòng 19](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:19)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [getSupplierNames()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-98), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Party.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do getSupplierNames quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
getNames = catchAsync(async (req, res) => {
  const data = await service.getSupplierNames();
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-77"></a>

## supplierStatus()

**Code:** [supplier.mapper.js:6](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.mapper.js:6).

**Tham số:** `supplierStatus(party)`.

**Công việc:** Giải nghĩa trạng thái hợp tác, kể cả hồ sơ cũ chưa có trường mới.

**Xử lý theo thứ tự:**

1. Ưu tiên cooperationStatus đã lưu.
2. Thiếu thì isActive=false được hiểu SUSPENDED, còn lại ACTIVE.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapSupplierSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-78), [changeSupplierStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-94). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Hồ sơ cũ chỉ có isActive=false vẫn lọc/hiển thị đang tạm dừng; hàm không ghi sửa Party.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function supplierStatus(party) {
  return (
    party.cooperationStatus ??
    (party.isActive === false ? "SUSPENDED" : "ACTIVE")
  );
}
```

</details>

<a id="fn-78"></a>

## mapSupplierSummary()

**Code:** [supplier.mapper.js:13](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.mapper.js:13).

**Tham số:** `mapSupplierSummary(party)`.

**Công việc:** Trả phần thông tin nhà cung cấp dùng ở danh sách.

**Xử lý theo thứ tự:**

1. Lấy mã/tên/thông tin liên hệ cơ bản.
2. Giải nghĩa trạng thái bằng supplierStatus; đổi mã/ngày và giữ version.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapSupplierDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-79). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [supplierStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-77), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-313).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Nhà cung cấp N hiện ACTIVE và số điện thoại hiện có; không kèm mọi đơn mua của họ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapSupplierSummary(party) {
  return {
    id: idString(party._id),
    code: party.code,
    name: party.name,
    contact: {
      phone: party.phone ?? null,
      email: party.email ?? null,
      contactPerson: party.contactPerson ?? null,
    },
    cooperationStatus: supplierStatus(party),
    isActive: party.isActive,
    version: party.version ?? 1,
    createdAt: isoDate(party.createdAt),
  };
}
```

</details>

<a id="fn-79"></a>

## mapSupplierDetail()

**Code:** [supplier.mapper.js:30](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.mapper.js:30).

**Tham số:** `mapSupplierDetail(party)`.

**Công việc:** Mở rộng tóm tắt nhà cung cấp với các thông tin hồ sơ.

**Xử lý theo thứ tự:**

1. Dùng mapSupplierSummary.
2. Thêm địa chỉ, mã số thuế, ghi chú, lý do trạng thái và ngày sửa.

**Ai gọi / gọi tiếp:** Được gọi bởi [getSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-91), [createSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-92), [updateSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-93), [changeSupplierStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-94). Gọi tiếp [mapSupplierSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-78), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-313).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Chi tiết có địa chỉ giao dịch, nhưng lịch sử chứng từ là API riêng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapSupplierDetail(party) {
  return {
    ...mapSupplierSummary(party),
    address: party.address ?? null,
    taxCode: party.taxCode ?? null,
    notes: party.notes ?? null,
    statusReason: party.statusReason ?? null,
    updatedAt: isoDate(party.updatedAt),
  };
}
```

</details>

<a id="fn-80"></a>

## mapSupplierDocument()

**Code:** [supplier.mapper.js:41](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.mapper.js:41).

**Tham số:** `mapSupplierDocument(document, warehouse)`.

**Công việc:** Tóm tắt một chứng từ nhà cung cấp đã được service lọc.

**Xử lý theo thứ tự:**

1. Giữ mã/số/loại/trạng thái/version của phiếu.
2. Gắn kho; chọn ngày từ expectedOn rồi occurredAt rồi createdAt.

**Ai gọi / gọi tiếp:** Được gọi bởi [getSupplierDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-97). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-313).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Phiếu nhập của kho A hiện ở tab chứng từ; mapper không quyết định nó có thật thuộc supplier N hay không.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapSupplierDocument(document, warehouse) {
  return {
    id: idString(document._id),
    documentNo: document.documentNo,
    documentKind: document.documentKind,
    workflowStatus: document.workflowStatus,
    version: document.version,
    warehouse: document.header?.warehouseId
      ? {
          id: idString(document.header.warehouseId),
          code: warehouse?.code ?? null,
          name: warehouse?.name ?? null,
        }
      : null,
    documentDate: isoDate(
      document.header?.expectedOn ?? document.occurredAt ?? document.createdAt,
    ),
    createdAt: isoDate(document.createdAt),
  };
}
```

</details>

<a id="fn-81"></a>

## isDuplicateKey()

**Code:** [supplier.service.js:45](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:45).

**Tham số:** `isDuplicateKey(error)`.

**Công việc:** Nhận biết lỗi trùng khóa duy nhất từ MongoDB.

**Xử lý theo thứ tự:**

1. Đọc error.code; so với 11000.
2. Trả true/false; không tự gửi thêm truy vấn hoặc xử lý lại giao dịch.

**Ai gọi / gọi tiếp:** Được gọi bởi [createSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-92). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Kết quả / nhánh bị chặn:** Boolean; không chứng minh dữ liệu không trùng nếu chỉ kiểm trước khi save.

**Ví dụ:** Hai người cùng tạo một mã sản phẩm: MongoDB chặn bản trùng; hàm này giúp đổi lỗi kỹ thuật thành thông báo dễ hiểu.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
isDuplicateKey = (error) => error?.code === 11000
```

</details>

<a id="fn-82"></a>

## requireSupplierReader()

**Code:** [supplier.service.js:47](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:47).

**Tham số:** `requireSupplierReader(user)`.

**Công việc:** Yêu cầu đúng quyền đọc nhà cung cấp.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: chủ cửa hàng/kế toán.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [listSuppliers()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-90), [getSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-91), [getSupplierHistory()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-95), [getSupplierDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-97). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền đọc nhà cung cấp chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
requireSupplierReader = (user) =>
  requirePermission(user, "supplier:read", supplierReadRoles)
```

</details>

<a id="fn-83"></a>

## requireSupplierCreator()

**Code:** [supplier.service.js:49](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:49).

**Tham số:** `requireSupplierCreator(user)`.

**Công việc:** Yêu cầu đúng quyền tạo nhà cung cấp.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: kế toán.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [createSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-92). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền tạo nhà cung cấp chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
requireSupplierCreator = (user) =>
  requirePermission(user, "supplier:create", ["ACCOUNTANT"])
```

</details>

<a id="fn-84"></a>

## requireSupplierEditor()

**Code:** [supplier.service.js:51](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:51).

**Tham số:** `requireSupplierEditor(user)`.

**Công việc:** Yêu cầu đúng quyền sửa liên hệ nhà cung cấp.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: kế toán.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [updateSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-93). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền sửa liên hệ nhà cung cấp chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
requireSupplierEditor = (user) =>
  requirePermission(user, "supplier:update", ["ACCOUNTANT"])
```

</details>

<a id="fn-85"></a>

## requireSupplierStatusEditor()

**Code:** [supplier.service.js:53](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:53).

**Tham số:** `requireSupplierStatusEditor(user)`.

**Công việc:** Yêu cầu đúng quyền đổi trạng thái nhà cung cấp.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: chủ cửa hàng.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [changeSupplierStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-94). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền đổi trạng thái nhà cung cấp chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
requireSupplierStatusEditor = (user) =>
  requirePermission(user, "supplier:activate", ["OWNER"])
```

</details>

<a id="fn-86"></a>

## withSession()

**Code:** [supplier.service.js:56](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:56).

**Tham số:** `withSession(query, session)`.

**Công việc:** Gắn truy vấn đang có vào giao dịch nếu bên gọi truyền session.

**Xử lý theo thứ tự:**

1. Nhận đối tượng query chưa lấy kết quả.
2. Có session thì gọi query.session(session); không có thì giữ query.
3. Trả query để bên gọi await tiếp.

**Ai gọi / gọi tiếp:** Được gọi bởi [findSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-89). Không gọi hàm khác trong danh mục này.

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

<a id="fn-87"></a>

## warehouseScope()

**Code:** [supplier.service.js:60](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:60).

**Tham số:** `warehouseScope(user)`.

**Công việc:** Dựng phạm vi kho cho tab chứng từ của nhà cung cấp.

**Xử lý theo thứ tự:**

1. Chủ cửa hàng trả filter rỗng.
2. Những vai trò còn lại dựng header.warehouseId trong warehouseIds.

**Ai gọi / gọi tiếp:** Được gọi bởi [getSupplierDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-97). Gọi tiếp [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Chỉ tạo điều kiện; chưa gửi truy vấn.

**Ví dụ:** Kế toán đọc PO toàn kho ở reader mua mới nhưng tab chứng từ nhà cung cấp vẫn dùng assigned warehouses tại helper này.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function warehouseScope(user) {
  if (currentRole(user)?.code === "OWNER") return {};
  return {
    "header.warehouseId": {
      $in: (user.warehouseIds || []).map(
        (id) => new mongoose.Types.ObjectId(idString(id)),
      ),
    },
  };
}
```

</details>

<a id="fn-88"></a>

## supplierFilter()

**Code:** [supplier.service.js:71](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:71).

**Tham số:** `supplierFilter(supplierId)`.

**Công việc:** Dựng điều kiện tham chiếu nhà cung cấp trên chứng từ.

**Xử lý theo thứ tự:**

1. Trả header.supplierId bằng mã được chọn.

**Ai gọi / gọi tiếp:** Được gọi bởi [getSupplierDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-97). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Lấy PO của N thì cần field supplierId=N; service còn ghép loại phiếu và kho.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function supplierFilter(supplierId) {
  return { "header.supplierId": supplierId };
}
```

</details>

<a id="fn-89"></a>

## findSupplier()

**Code:** [supplier.service.js:75](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:75).

**Tham số:** `findSupplier(id, session = null)`.

**Công việc:** Đọc đúng Party loại nhà cung cấp.

**Xử lý theo thứ tự:**

1. FindOne theo _id và kind=SUPPLIER, gắn session nếu có.
2. Không có thì 404; không trả nhầm CUSTOMER cùng một nhóm Party.

**Ai gọi / gọi tiếp:** Được gọi bởi [getSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-91), [updateSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-93), [changeSupplierStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-94), [getSupplierHistory()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-95), [getSupplierDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-97). Gọi tiếp [withSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-86), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `Party`, tại [dòng 76](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:76). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Party.findOne({ _id: id, kind: "SUPPLIER" }).lean()
```

**Ví dụ:** Đưa mã khách hàng vào URL nhà cung cấp không mở được hồ sơ nhà cung cấp.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function findSupplier(id, session = null) {
  const query = Party.findOne({ _id: id, kind: "SUPPLIER" }).lean();
  const supplier = await withSession(query, session);
  if (!supplier) throw notFoundError("Không tìm thấy nhà cung cấp");
  return supplier;
}
```

</details>

<a id="fn-90"></a>

## listSuppliers()

**Code:** [supplier.service.js:82](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:82).

**Tham số:** `listSuppliers(user, query)`.

**Công việc:** Tìm danh sách nhà cung cấp và giải nghĩa trạng thái hồ sơ cũ.

**Xử lý theo thứ tự:**

1. Kiểm quyền đọc, filter kind SUPPLIER.
2. Lọc cooperationStatus, có nhánh cho hồ sơ thiếu field theo isActive; tìm chữ trong code/name.
3. Find/count cùng filter, phân trang rồi map.

**Ai gọi / gọi tiếp:** Được gọi bởi [list()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-69). Gọi tiếp [requireSupplierReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-82), [escapeRegex()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-309).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `Party`, tại [dòng 109](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:109). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Party.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean()
```

- Đếm bản ghi qua `Party`, tại [dòng 114](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:114). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Party.countDocuments(filter)
```

**Ví dụ:** Lọc tạm dừng vẫn thấy hồ sơ cũ chỉ có isActive=false.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function listSuppliers(user, query) {
  requireSupplierReader(user);
  const filter = { kind: "SUPPLIER" };
  const and = [];
  if (query.cooperationStatus === "ACTIVE") {
    and.push({
      $or: [
        { cooperationStatus: "ACTIVE" },
        { cooperationStatus: null, isActive: { $ne: false } },
      ],
    });
  } else if (query.cooperationStatus === "SUSPENDED") {
    and.push({
      $or: [
        { cooperationStatus: "SUSPENDED" },
        { cooperationStatus: null, isActive: false },
      ],
    });
  } else if (query.cooperationStatus === "TERMINATED") {
    filter.cooperationStatus = "TERMINATED";
  }
  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), "i");
    and.push({ $or: [{ code: search }, { name: search }] });
  }
  if (and.length) filter.$and = and;
  const [items, total] = await Promise.all([
    Party.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Party.countDocuments(filter),
  ]);
  return {
    items: items.map(mapSupplierSummary),
    total,
    page: query.page,
    limit: query.limit,
  };
}
```

</details>

<a id="fn-91"></a>

## getSupplier()

**Code:** [supplier.service.js:124](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:124).

**Tham số:** `getSupplier(user, id)`.

**Công việc:** Đọc một hồ sơ nhà cung cấp.

**Xử lý theo thứ tự:**

1. Kiểm quyền; findSupplier theo mã.
2. Trả mapSupplierDetail, không tự đọc toàn bộ chứng từ.

**Ai gọi / gọi tiếp:** Được gọi bởi [detail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-70). Gọi tiếp [requireSupplierReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-82), [mapSupplierDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-79), [findSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-89).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Party.findOne`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hồ sơN không đồng thời mở mọi phiếu nhập củaN.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getSupplier(user, id) {
  requireSupplierReader(user);
  return mapSupplierDetail(await findSupplier(id));
}
```

</details>

<a id="fn-92"></a>

## createSupplier()

**Code:** [supplier.service.js:129](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:129).

**Tham số:** `createSupplier(user, input)`.

**Công việc:** Tạo Party SUPPLIER hoạt động theo quyền kế toán.

**Xử lý theo thứ tự:**

1. Kiểm quyền; mở giao dịch, tìm code trùng trên toàn Party.
2. Save loại SUPPLIER, ACTIVE/isActive=true, version 1 và các trường liên hệ cho phép.
3. Save AuditEvent cùng giao dịch; bắt trùng khóa.

**Ai gọi / gọi tiếp:** Được gọi bởi [create()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-71). Gọi tiếp [requireSupplierCreator()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-83), [escapeRegex()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-309), [duplicateError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-329), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [isDuplicateKey()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-81), [mapSupplierDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-79).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `Party`, tại [dòng 135](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:135). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Party.findOne({
        code: { $regex: `^${escapeRegex(input.code)}$`, $options: "i" },
      })
        .session(session)
        .lean()
```

- Ghi đối tượng model đã tạo qua `Party`, tại [dòng 141](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:141). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
new Party({
        code: input.code,
        name: input.name,
        kind: "SUPPLIER",
        ...(input.phone != null && { phone: input.phone }),
        ...(input.email != null && { email: input.email }),
        ...(input.address != null && { address: input.address }),
        ...(input.taxCode != null && { taxCode: input.taxCode }),
        ...(input.contactPerson != null && {
          contactPerson: input.contactPerson,
        }),
        ...(input.notes != null && { notes: input.notes }),
        cooperationStatus: "ACTIVE",
        isActive: true,
        version: 1,
      }).save({ session })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
        actorId: user._id,
        action: "CREATE_SUPPLIER",
        entityType: "SUPPLIER",
        entityId: created._id,
        details: {
          code: created.code,
          name: created.name,
          cooperationStatus: created.cooperationStatus,
        },
        session,
      })
```

**Ví dụ:** Mã đã được một CUSTOMER sử dụng cũng không tái dùng cho SUPPLIER vì code unique toàn Party.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function createSupplier(user, input) {
  requireSupplierCreator(user);
  const session = await mongoose.startSession();
  let supplier;
  try {
    supplier = await session.withTransaction(async () => {
      const duplicate = await Party.findOne({
        code: { $regex: `^${escapeRegex(input.code)}$`, $options: "i" },
      })
        .session(session)
        .lean();
      if (duplicate) throw duplicateError("Mã nhà cung cấp đã tồn tại");
      const created = await new Party({
        code: input.code,
        name: input.name,
        kind: "SUPPLIER",
        ...(input.phone != null && { phone: input.phone }),
        ...(input.email != null && { email: input.email }),
        ...(input.address != null && { address: input.address }),
        ...(input.taxCode != null && { taxCode: input.taxCode }),
        ...(input.contactPerson != null && {
          contactPerson: input.contactPerson,
        }),
        ...(input.notes != null && { notes: input.notes }),
        cooperationStatus: "ACTIVE",
        isActive: true,
        version: 1,
      }).save({ session });
      await appendAudit({
        actorId: user._id,
        action: "CREATE_SUPPLIER",
        entityType: "SUPPLIER",
        entityId: created._id,
        details: {
          code: created.code,
          name: created.name,
          cooperationStatus: created.cooperationStatus,
        },
        session,
      });
      return created.toObject();
    }, transactionOptions);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw duplicateError("Mã nhà cung cấp đã tồn tại");
    }
    throw error;
  } finally {
    await session.endSession();
  }
  return mapSupplierDetail(supplier);
}
```

</details>

<a id="fn-93"></a>

## updateSupplier()

**Code:** [supplier.service.js:182](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:182).

**Tham số:** `updateSupplier(user, id, input)`.

**Công việc:** Lưu lại bộ thông tin liên hệ nhà cung cấp.

**Xử lý theo thứ tự:**

1. Kế toán, đúng version; đọc hồ sơ trong giao dịch.
2. Set tên/thông tin có giá trị; unset thông tin tùy chọn vắng hoặc null.
3. Cập nhật theo _id/kind/version, tăng phiên bản và audit các thay đổi.

**Ai gọi / gọi tiếp:** Được gọi bởi [update()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-72). Gọi tiếp [requireSupplierEditor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-84), [findSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-89), [versionConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-328), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [changedFields()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-301), [mapSupplierDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-79).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Cập nhật rồi lấy bản ghi kết quả qua `Party`, tại [dòng 203](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:203). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Party.findOneAndUpdate(
        { _id: id, kind: "SUPPLIER", version: input.expectedVersion },
        update,
        { returnDocument: "after", runValidators: true, session },
      ).lean()
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
        actorId: user._id,
        action: "UPDATE_SUPPLIER",
        entityType: "SUPPLIER",
        entityId: next._id,
        changes: changedFields(current, next, editableFields),
        session,
      })
```

**Ví dụ:** Gửi mỗi tên có thể xóa điện thoại/email; không có quyền đổi trạng thái qua lệnh này.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function updateSupplier(user, id, input) {
  requireSupplierEditor(user);
  const session = await mongoose.startSession();
  let updated;
  try {
    updated = await session.withTransaction(async () => {
      const current = await findSupplier(id, session);
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      const set = { name: input.name };
      const unset = {};
      for (const field of editableFields.filter((field) => field !== "name")) {
        if (input[field] != null) set[field] = input[field];
        else unset[field] = "";
      }
      const update = { $set: set, $inc: { version: 1 } };
      if (Object.keys(unset).length) update.$unset = unset;
      const next = await Party.findOneAndUpdate(
        { _id: id, kind: "SUPPLIER", version: input.expectedVersion },
        update,
        { returnDocument: "after", runValidators: true, session },
      ).lean();
      if (!next) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      await appendAudit({
        actorId: user._id,
        action: "UPDATE_SUPPLIER",
        entityType: "SUPPLIER",
        entityId: next._id,
        changes: changedFields(current, next, editableFields),
        session,
      });
      return next;
    }, transactionOptions);
  } finally {
    await session.endSession();
  }
  return mapSupplierDetail(updated);
}
```

</details>

<a id="fn-94"></a>

## changeSupplierStatus()

**Code:** [supplier.service.js:230](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:230).

**Tham số:** `changeSupplierStatus(user, id, input)`.

**Công việc:** Đổi ACTIVE/SUSPENDED/TERMINATED theo quyền chủ cửa hàng.

**Xử lý theo thứ tự:**

1. Kiểm version; nếu cùng trạng thái thì trả hiện tại.
2. Tự đặt isActive theo trạng thái ACTIVE.
3. Cập nhật có điều kiện, tăng version; lưu lý do và AuditEvent.

**Ai gọi / gọi tiếp:** Được gọi bởi [changeStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-73). Gọi tiếp [requireSupplierStatusEditor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-85), [findSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-89), [versionConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-328), [supplierStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-77), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [mapSupplierDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-79).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Cập nhật rồi lấy bản ghi kết quả qua `Party`, tại [dòng 245](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:245). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Party.findOneAndUpdate(
        { _id: id, kind: "SUPPLIER", version: input.expectedVersion },
        {
          $set: {
            cooperationStatus: input.cooperationStatus,
            isActive,
            statusReason: input.reason,
          },
          $inc: { version: 1 },
        },
        { returnDocument: "after", runValidators: true, session },
      ).lean()
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
        actorId: user._id,
        action: "CHANGE_SUPPLIER_STATUS",
        entityType: "SUPPLIER",
        entityId: next._id,
        changes: [
          {
            path: "cooperationStatus",
            before: supplierStatus(current),
            after: next.cooperationStatus,
          },
          {
            path: "isActive",
            before: current.isActive,
            after: next.isActive,
          },
        ],
        details: { reason: input.reason },
        session,
      })
```

**Ví dụ:** Khôi phục TERMINATED về ACTIVE cần lý do và để lại lịch sử; không tự sửa hồ sơ liên hệ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function changeSupplierStatus(user, id, input) {
  requireSupplierStatusEditor(user);
  const session = await mongoose.startSession();
  let updated;
  try {
    updated = await session.withTransaction(async () => {
      const current = await findSupplier(id, session);
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      if (supplierStatus(current) === input.cooperationStatus) return current;
      const isActive = input.cooperationStatus === "ACTIVE";
      const next = await Party.findOneAndUpdate(
        { _id: id, kind: "SUPPLIER", version: input.expectedVersion },
        {
          $set: {
            cooperationStatus: input.cooperationStatus,
            isActive,
            statusReason: input.reason,
          },
          $inc: { version: 1 },
        },
        { returnDocument: "after", runValidators: true, session },
      ).lean();
      if (!next) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      await appendAudit({
        actorId: user._id,
        action: "CHANGE_SUPPLIER_STATUS",
        entityType: "SUPPLIER",
        entityId: next._id,
        changes: [
          {
            path: "cooperationStatus",
            before: supplierStatus(current),
            after: next.cooperationStatus,
          },
          {
            path: "isActive",
            before: current.isActive,
            after: next.isActive,
          },
        ],
        details: { reason: input.reason },
        session,
      });
      return next;
    }, transactionOptions);
  } finally {
    await session.endSession();
  }
  return mapSupplierDetail(updated);
}
```

</details>

<a id="fn-95"></a>

## getSupplierHistory()

**Code:** [supplier.service.js:291](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:291).

**Tham số:** `getSupplierHistory(user, id, query)`.

**Công việc:** Đọc lịch sử thay đổi hồ sơ nhà cung cấp.

**Xử lý theo thứ tự:**

1. Kiểm quyền và hồ sơ tồn tại.
2. AuditEvent.find/count theo entityType SUPPLIER và entityId, sắp mới trước và chia trang.
3. Trả người thao tác, thời điểm, action, changes và details.

**Ai gọi / gọi tiếp:** Được gọi bởi [history()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-74). Gọi tiếp [requireSupplierReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-82), [findSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-89), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-313).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `AuditEvent`, tại [dòng 296](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:296). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
AuditEvent.find(filter)
      .sort({ eventAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean()
```

- Đếm bản ghi qua `AuditEvent`, tại [dòng 301](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:301). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
AuditEvent.countDocuments(filter)
```

**Ví dụ:** Thấy ai đổi trạng thái, không coi đây là lịch sử tăng/giảm hàng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getSupplierHistory(user, id, query) {
  requireSupplierReader(user);
  await findSupplier(id);
  const filter = { entityType: "SUPPLIER", entityId: id };
  const [events, total] = await Promise.all([
    AuditEvent.find(filter)
      .sort({ eventAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    AuditEvent.countDocuments(filter),
  ]);
  return {
    items: events.map((event) => ({
      id: idString(event._id),
      action: event.action,
      actorId: idString(event.actorId),
      eventAt: isoDate(event.eventAt),
      changes: (event.changes || []).map((change) => ({
        path: change.path,
        before: change.before ?? null,
        after: change.after ?? null,
      })),
      details: event.details ?? null,
    })),
    total,
    page: query.page,
    limit: query.limit,
  };
}
```

</details>

<a id="fn-96"></a>

## supplierDocumentIdsForGr()

**Code:** [supplier.service.js:322](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:322).

**Tham số:** `supplierDocumentIdsForGr(supplierId, scope)`.

**Công việc:** Kiểm phiếu nhập mua thật sự cùng nhà cung cấp và nguồn.

**Xử lý theo thứ tự:**

1. Đọc mọi GR_PURCHASE trong scope kho, mới trước.
2. Đọc gom PO và PO_INSPECTION được GR tham chiếu; kiểm nhận phải CONFIRMED.
3. Kiểm supplier của cả ba, kho của cả ba và mã PO trên kiểm nhận.
4. Chỉ giữ GR khớp; trả tập đầy đủ và total trước phân trang.

**Ai gọi / gọi tiếp:** Được gọi bởi [getSupplierDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-97). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `BusinessDocument`, tại [dòng 323](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:323). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.find({
    documentKind: "GR_PURCHASE",
    ...scope,
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean()
```

- Đọc nhiều bản ghi qua `BusinessDocument`, tại [dòng 331](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:331). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.find({
    _id: {
      $in: grDocuments.map((d) => d.header.purchaseOrderId).filter(Boolean),
    },
    documentKind: "PO",
  }).lean()
```

- Đọc nhiều bản ghi qua `BusinessDocument`, tại [dòng 338](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:338). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.find({
    _id: {
      $in: grDocuments.map((d) => d.header.poInspectionId).filter(Boolean),
    },
    documentKind: "PO_INSPECTION",
    workflowStatus: "CONFIRMED",
  }).lean()
```

**Kết quả / nhánh bị chặn:** Không đi qua ARRIVAL; vẫn đối chiếu PO/kiểm nhận bằng truy vấn gom.

**Ví dụ:** GR gắn supplierN nhưng PO gốc supplierM bị loại khỏi danh sáchN.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function supplierDocumentIdsForGr(supplierId, scope) {
  const grDocuments = await BusinessDocument.find({
    documentKind: "GR_PURCHASE",
    ...scope,
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  if (!grDocuments.length) return { documents: [], total: 0 };
  const matched = [];
  const directPos = await BusinessDocument.find({
    _id: {
      $in: grDocuments.map((d) => d.header.purchaseOrderId).filter(Boolean),
    },
    documentKind: "PO",
  }).lean();
  const poById = new Map(directPos.map((d) => [idString(d._id), d]));
  const inspections = await BusinessDocument.find({
    _id: {
      $in: grDocuments.map((d) => d.header.poInspectionId).filter(Boolean),
    },
    documentKind: "PO_INSPECTION",
    workflowStatus: "CONFIRMED",
  }).lean();
  const inspectionById = new Map(inspections.map((d) => [idString(d._id), d]));
  for (const document of grDocuments) {
    if (document.header.purchaseOrderId) {
      const po = poById.get(idString(document.header.purchaseOrderId));
      const inspection = inspectionById.get(
        idString(document.header.poInspectionId),
      );
      if (
        po &&
        inspection &&
        idString(po.header.supplierId) === idString(supplierId) &&
        idString(document.header.supplierId) === idString(supplierId) &&
        idString(inspection.header.supplierId) === idString(supplierId) &&
        idString(po.header.warehouseId) ===
          idString(document.header.warehouseId) &&
        idString(inspection.header.purchaseOrderId) === idString(po._id) &&
        idString(inspection.header.warehouseId) ===
          idString(po.header.warehouseId)
      )
        matched.push(document);
      continue;
    }
  }
  return { documents: matched, total: matched.length };
}
```

</details>

<a id="fn-97"></a>

## getSupplierDocuments()

**Code:** [supplier.service.js:371](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:371).

**Tham số:** `getSupplierDocuments(user, id, query)`.

**Công việc:** Đọc tab PO/phiếu nhập/phiếu trả của nhà cung cấp theo quyền loại chứng từ.

**Xử lý theo thứ tự:**

1. Kiểm supplier:read và quyền đọc query.kind.
2. Dựng warehouseScope; GR dùng supplierDocumentIdsForGr rồi cắt trang.
3. PO/phiếu trả tìm trực tiếp theo kind/supplier/kho và count cùng filter.
4. Đọc tên kho rồi mapSupplierDocument.

**Ai gọi / gọi tiếp:** Được gọi bởi [documents()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-75). Gọi tiếp [requireSupplierReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-82), [findSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-89), [hasPermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-294), [warehouseScope()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-87), [supplierDocumentIdsForGr()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-96), [supplierFilter()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-88), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [mapSupplierDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-80).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `BusinessDocument`, tại [dòng 395](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:395). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean()
```

- Đếm bản ghi qua `BusinessDocument`, tại [dòng 400](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:400). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.countDocuments(filter)
```

- Đọc nhiều bản ghi qua `Warehouse`, tại [dòng 405](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:405). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.find({
        _id: {
          $in: documents
            .map((document) => document.header?.warehouseId)
            .filter(Boolean),
        },
      })
        .select("_id code name")
        .lean()
```

**Ví dụ:** Kế toán không thấy GR khoB trong tab này nếu chỉ được giao khoA, dù reader mua riêng có quy tắc đọc khác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getSupplierDocuments(user, id, query) {
  requireSupplierReader(user);
  await findSupplier(id);
  const permission = documentPermissions[query.kind];
  if (!hasPermission(user, permission)) {
    throw new ApiError(403, "Bạn không có quyền xem loại chứng từ này");
  }
  const scope = warehouseScope(user);
  let documents;
  let total;
  if (query.kind === "GR_PURCHASE") {
    const result = await supplierDocumentIdsForGr(id, scope);
    total = result.total;
    documents = result.documents.slice(
      (query.page - 1) * query.limit,
      query.page * query.limit,
    );
  } else {
    const filter = {
      documentKind: query.kind,
      ...supplierFilter(id),
      ...scope,
    };
    [documents, total] = await Promise.all([
      BusinessDocument.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      BusinessDocument.countDocuments(filter),
    ]);
  }
  const warehouses = new Map(
    (
      await Warehouse.find({
        _id: {
          $in: documents
            .map((document) => document.header?.warehouseId)
            .filter(Boolean),
        },
      })
        .select("_id code name")
        .lean()
    ).map((warehouse) => [idString(warehouse._id), warehouse]),
  );
  return {
    items: documents.map((document) =>
      mapSupplierDocument(
        document,
        warehouses.get(idString(document.header?.warehouseId)),
      ),
    ),
    total,
    page: query.page,
    limit: query.limit,
  };
}
```

</details>

<a id="fn-98"></a>

## getSupplierNames()

**Code:** [supplier.service.js:429](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:429).

**Tham số:** `getSupplierNames()`.

**Công việc:** Đọc danh sách mã hồ sơ và tên của mọi nhà cung cấp.

**Xử lý theo thứ tự:**

1. Party.find kind SUPPLIER; chỉ select _id/name và lean.
2. Trả danh sách nguyên trạng; hàm hiện không nhận user hoặc kiểm supplier:read.

**Ai gọi / gọi tiếp:** Được gọi bởi [getNames()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-76). Không gọi hàm khác trong danh mục này.

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `Party`, tại [dòng 430](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.service.js:430). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Party.find({ kind: "SUPPLIER" })
    .select("_id name")
    .lean()
```

**Kết quả / nhánh bị chặn:** Đây là điểm quyền chưa đồng nhất với list chuẩn; đợt này chỉ giải thích, không sửa.

**Ví dụ:** Một tài khoản đăng nhập nhưng không có quyền nhà cung cấp vẫn đi được route /suppliers/names hiện tại.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
getSupplierNames = async () => {
  const suppliers = await Party.find({ kind: "SUPPLIER" })
    .select("_id name")
    .lean();
  return suppliers;
}
```

</details>

<a id="fn-99"></a>

## positiveInteger()

**Code:** [supplier.validation.js:4](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.validation.js:4).

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

<a id="fn-100"></a>

## optionalText()

**Code:** [supplier.validation.js:13](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.validation.js:13).

**Tham số:** `optionalText(max, extra = {})`.

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
optionalText = (max, extra = {}) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value == null || value === "" ? null : value))
    .pipe(z.string().max(max).nullable().optional())
    .superRefine((value, ctx) => {
      if (value != null && extra.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        ctx.addIssue({ code: "custom", message: "Email không hợp lệ" });
      }
    })
```

</details>

