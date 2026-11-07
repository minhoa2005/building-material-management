---
id: DOC-CODE-IT1-PRODUCTS-20261105
title: "Sản phẩm, quy đổi và ngưỡng kho — giải thích từng hàm"
version: 1.0.0
phase: Review
domain: Iteration1
tags: [backend, function, database]
last_updated: 2026-11-05
---

# Sản phẩm, quy đổi và ngưỡng kho — giải thích từng hàm

[Quay lại hướng dẫn đọc](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/README.md). Bản source ngày 05/11/2026; các đoạn lệnh dưới đây được lấy trực tiếp từ file hiện tại.

## Tìm nhanh

- [product.controller.js → list()](#fn-0)
- [product.controller.js → options()](#fn-1)
- [product.controller.js → detail()](#fn-2)
- [product.controller.js → create()](#fn-3)
- [product.controller.js → update()](#fn-4)
- [product.controller.js → changeStatus()](#fn-5)
- [product.controller.js → conversions()](#fn-6)
- [product.controller.js → createConversion()](#fn-7)
- [product.controller.js → policies()](#fn-8)
- [product.controller.js → configurePolicy()](#fn-9)
- [product.mapper.js → mapUom()](#fn-10)
- [product.mapper.js → mapConversion()](#fn-11)
- [product.mapper.js → mapProductSummary()](#fn-12)
- [product.mapper.js → mapProductDetail()](#fn-13)
- [product.mapper.js → mapPolicy()](#fn-14)
- [product.service.js → isDuplicateKey()](#fn-15)
- [product.service.js → requireProductReader()](#fn-16)
- [product.service.js → requireProductEditor()](#fn-17)
- [product.service.js → requireProductCreator()](#fn-18)
- [product.service.js → buildReadSession()](#fn-19)
- [product.service.js → loadUoms()](#fn-20)
- [product.service.js → currentConversionsByProduct()](#fn-21)
- [product.service.js → detailWithMasters()](#fn-22)
- [product.service.js → listProducts()](#fn-23)
- [product.service.js → getProduct()](#fn-24)
- [product.service.js → createProduct()](#fn-25)
- [product.service.js → updateProduct()](#fn-26)
- [product.service.js → changeProductStatus()](#fn-27)
- [product.service.js → createConversion()](#fn-28)
- [product.service.js → listConversions()](#fn-29)
- [product.service.js → configurePolicy()](#fn-30)
- [product.service.js → listPolicies()](#fn-31)
- [product.service.js → getProductOptions()](#fn-32)
- [product.service.js → requireActiveProduct()](#fn-33)
- [product.validation.js → positiveInteger()](#fn-34)
- [product.validation.js → optionalText()](#fn-35)
- [product.validation.js → expectedVersion()](#fn-36)
- [product.validation.js → pairedDimensions()](#fn-37)

<a id="fn-0"></a>

## list()

**Code:** [product.controller.js:5](D:/Ky_9/SEP490/src/be/src/modules/products/product.controller.js:5).

**Tham số:** `list(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới listProducts và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ listProducts hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/products` ([route dòng 18](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:18)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [listProducts()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-23), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Product.find`, `Product.countDocuments`, `Uom.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do listProducts quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
list = catchAsync(async (req, res) => {
  const data = await service.listProducts(req.user, req.validated.query);
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-1"></a>

## options()

**Code:** [product.controller.js:10](D:/Ky_9/SEP490/src/be/src/modules/products/product.controller.js:10).

**Tham số:** `options(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới getProductOptions và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ getProductOptions hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/products/options` ([route dòng 12](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:12)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331), [getProductOptions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-32).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Uom.find`, `Warehouse.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do getProductOptions quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
options = catchAsync(async (req, res) => {
  formatApiResponse(res, { data: await service.getProductOptions(req.user) });
})
```

</details>

<a id="fn-2"></a>

## detail()

**Code:** [product.controller.js:14](D:/Ky_9/SEP490/src/be/src/modules/products/product.controller.js:14).

**Tham số:** `detail(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới getProduct và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ getProduct hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/products/:id` ([route dòng 54](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:54)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [getProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-24), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Product.findById`, `ProductUomVersion.find`, `Uom.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do getProduct quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
detail = catchAsync(async (req, res) => {
  const data = await service.getProduct(req.user, req.validated.params.id);
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-3"></a>

## create()

**Code:** [product.controller.js:19](D:/Ky_9/SEP490/src/be/src/modules/products/product.controller.js:19).

**Tham số:** `create(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới createProduct và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ createProduct hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `POST /api/products` ([route dòng 24](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:24)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [createProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-25), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Uom.findById`, `Product.findOne`, `Product.save`, `ProductUomVersion.save`, `AuditEvent.save`, `ProductUomVersion.find`, `Uom.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do createProduct quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
create = catchAsync(async (req, res) => {
  const data = await service.createProduct(req.user, req.validated.body);
  formatApiResponse(res, {
    statusCode: 201,
    message: "Tạo sản phẩm thành công",
    data,
  });
})
```

</details>

<a id="fn-4"></a>

## update()

**Code:** [product.controller.js:28](D:/Ky_9/SEP490/src/be/src/modules/products/product.controller.js:28).

**Tham số:** `update(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới updateProduct và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ updateProduct hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `PUT /api/products/:id` ([route dòng 60](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:60)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [updateProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-26), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Product.findById`, `Product.findOneAndUpdate`, `AuditEvent.save`, `ProductUomVersion.find`, `Uom.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do updateProduct quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
update = catchAsync(async (req, res) => {
  const data = await service.updateProduct(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-5"></a>

## changeStatus()

**Code:** [product.controller.js:37](D:/Ky_9/SEP490/src/be/src/modules/products/product.controller.js:37).

**Tham số:** `changeStatus(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới changeProductStatus và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ changeProductStatus hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `PATCH /api/products/:id/status` ([route dòng 66](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:66)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [changeProductStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-27), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Product.findById`, `Product.findOneAndUpdate`, `AuditEvent.save`, `ProductUomVersion.find`, `Uom.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do changeProductStatus quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
changeStatus = catchAsync(async (req, res) => {
  const data = await service.changeProductStatus(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-6"></a>

## conversions()

**Code:** [product.controller.js:46](D:/Ky_9/SEP490/src/be/src/modules/products/product.controller.js:46).

**Tham số:** `conversions(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới listConversions và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ listConversions hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/products/:id/conversions` ([route dòng 42](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:42)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [listConversions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-29), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Product.exists`, `ProductUomVersion.find`, `ProductUomVersion.countDocuments`, `Uom.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do listConversions quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
conversions = catchAsync(async (req, res) => {
  const data = await service.listConversions(
    req.user,
    req.validated.params.id,
    req.validated.query,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-7"></a>

## createConversion()

**Code:** [product.controller.js:55](D:/Ky_9/SEP490/src/be/src/modules/products/product.controller.js:55).

**Tham số:** `createConversion(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới createConversion và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ createConversion hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `POST /api/products/:id/conversions` ([route dòng 48](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:48)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [createConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-28), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Product.findById`, `Uom.findById`, `Product.findOneAndUpdate`, `ProductUomVersion.findOne`, `ProductUomVersion.save`, `AuditEvent.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do createConversion quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
createConversion = catchAsync(async (req, res) => {
  const data = await service.createConversion(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, {
    statusCode: 201,
    message: "Tạo phiên bản quy đổi thành công",
    data,
  });
})
```

</details>

<a id="fn-8"></a>

## policies()

**Code:** [product.controller.js:68](D:/Ky_9/SEP490/src/be/src/modules/products/product.controller.js:68).

**Tham số:** `policies(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới listPolicies và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ listPolicies hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/products/:id/warehouse-policies` ([route dòng 30](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:30)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [listPolicies()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-31), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Product.exists`, `ProductWarehousePolicy.find`, `Warehouse.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do listPolicies quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
policies = catchAsync(async (req, res) => {
  const data = await service.listPolicies(
    req.user,
    req.validated.params.id,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-9"></a>

## configurePolicy()

**Code:** [product.controller.js:76](D:/Ky_9/SEP490/src/be/src/modules/products/product.controller.js:76).

**Tham số:** `configurePolicy(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới configurePolicy và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ configurePolicy hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `PUT /api/products/:id/warehouse-policies/:warehouseId` ([route dòng 36](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:36)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [configurePolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-30), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Product.findById`, `Warehouse.findById`, `ProductWarehousePolicy.findOne`, `ProductWarehousePolicy.save`, `ProductWarehousePolicy.findOneAndUpdate`, `AuditEvent.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do configurePolicy quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
configurePolicy = catchAsync(async (req, res) => {
  const data = await service.configurePolicy(
    req.user,
    req.validated.params.id,
    req.validated.params.warehouseId,
    req.validated.body,
  );
  formatApiResponse(res, {
    message: "Lưu chính sách kho thành công",
    data,
  });
})
```

</details>

<a id="fn-10"></a>

## mapUom()

**Code:** [product.mapper.js:7](D:/Ky_9/SEP490/src/be/src/modules/products/product.mapper.js:7).

**Tham số:** `mapUom(value, uoms)`.

**Công việc:** Gắn mã và tên đơn vị từ bảng tra đã có.

**Xử lý theo thứ tự:**

1. Chuẩn hóa mã đơn vị.
2. Tra Map; trả id/code/name, phần thiếu để null.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-11), [mapProductSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-12). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Đơn vị viên được trả PIECE cùng tên dễ đọc; không đổi số lượng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapUom(value, uoms) {
  if (value == null) return null;
  const uom = uoms.get(idString(value));
  return {
    id: idString(value),
    code: uom?.code ?? null,
    name: uom?.name ?? null,
  };
}
```

</details>

<a id="fn-11"></a>

## mapConversion()

**Code:** [product.mapper.js:17](D:/Ky_9/SEP490/src/be/src/modules/products/product.mapper.js:17).

**Tham số:** `mapConversion(conversion, uoms)`.

**Công việc:** Chuyển một phiên bản quy đổi thành dữ liệu trả API.

**Xử lý theo thứ tự:**

1. Gắn đơn vị từ Map.
2. Đổi hệ số thành chuỗi, thời điểm thành ISO; giữ version, người tạo và căn cứ.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapProductDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-13), [createConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-28), [listConversions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-29). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [mapUom()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-10), [decimalString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-312), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-313).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** BOX bản 2 hệ số 6 được hiển thị đúng bản 2; mapper không chọn giúp bản hiện hành.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapConversion(conversion, uoms) {
  if (!conversion) return null;
  return {
    id: idString(conversion._id),
    uom: mapUom(conversion.uomId, uoms),
    version: conversion.version,
    basePerUnit: decimalString(conversion.basePerUnit),
    validFrom: isoDate(conversion.validFrom),
    createdBy: idString(conversion.createdBy),
    verificationReference: conversion.verificationReference ?? null,
  };
}
```

</details>

<a id="fn-12"></a>

## mapProductSummary()

**Code:** [product.mapper.js:30](D:/Ky_9/SEP490/src/be/src/modules/products/product.mapper.js:30).

**Tham số:** `mapProductSummary(product, uoms)`.

**Công việc:** Lấy các thông tin sản phẩm dùng ở danh sách.

**Xử lý theo thứ tự:**

1. Giữ mã/tên/thuộc tính tóm tắt, trạng thái và version.
2. Đổi kích thước, mã, ngày về dạng API; gắn đơn vị gốc.
3. Không tính số tồn.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapProductDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-13), [listProducts()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-23). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [decimalString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-312), [mapUom()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-10), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-313).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Gạch A 600 x 600 hiện lên danh sách nhưng không tự có 100 viên chỉ từ Product.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapProductSummary(product, uoms) {
  return {
    id: idString(product._id),
    sku: product.sku,
    name: product.name,
    category: product.category ?? null,
    brand: product.brand ?? null,
    nominalSize: product.nominalSize ?? null,
    lengthMm: decimalString(product.lengthMm),
    widthMm: decimalString(product.widthMm),
    thicknessMm: decimalString(product.thicknessMm),
    baseUom: mapUom(product.baseUomId, uoms),
    wholeBaseUnits: product.wholeBaseUnits,
    isActive: product.isActive,
    version: product.version,
    createdAt: isoDate(product.createdAt),
    updatedAt: isoDate(product.updatedAt),
  };
}
```

</details>

<a id="fn-13"></a>

## mapProductDetail()

**Code:** [product.mapper.js:50](D:/Ky_9/SEP490/src/be/src/modules/products/product.mapper.js:50).

**Tham số:** `mapProductDetail(product, uoms, currentConversions = [])`.

**Công việc:** Ghép thông tin sản phẩm chi tiết với những quy đổi bên gọi đã chọn.

**Xử lý theo thứ tự:**

1. Dùng mapProductSummary cho phần chung.
2. Thêm vật liệu, bề mặt, xuất xứ, mô tả.
3. Map danh sách currentConversions được service truyền vào.

**Ai gọi / gọi tiếp:** Được gọi bởi [detailWithMasters()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-22). Gọi tiếp [mapProductSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-12), [mapConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-11).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Hôm nay bản 4 viên/thùng được chọn thì detail hiển thị 4; mapper không đọc lại ngày hiệu lực.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapProductDetail(product, uoms, currentConversions = []) {
  return {
    ...mapProductSummary(product, uoms),
    material: product.material ?? null,
    surface: product.surface ?? null,
    origin: product.origin ?? null,
    description: product.description ?? null,
    currentConversions: currentConversions.map((conversion) =>
      mapConversion(conversion, uoms),
    ),
  };
}
```

</details>

<a id="fn-14"></a>

## mapPolicy()

**Code:** [product.mapper.js:63](D:/Ky_9/SEP490/src/be/src/modules/products/product.mapper.js:63).

**Tham số:** `mapPolicy(policy, warehouse)`.

**Công việc:** Chuyển chính sách sản phẩm/kho thành kết quả dễ dùng.

**Xử lý theo thứ tự:**

1. Gắn thông tin kho được truyền vào.
2. Đổi minimum/target thành chuỗi, giữ version/người/thời điểm sửa.

**Ai gọi / gọi tiếp:** Được gọi bởi [configurePolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-30), [listPolicies()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-31). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [decimalString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-312), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-313).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Kho A có minimum 100 và target 180; không sinh yêu cầu mua 80 ở mapper.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapPolicy(policy, warehouse) {
  return {
    id: idString(policy._id),
    productId: idString(policy.productId),
    warehouse: {
      id: idString(policy.warehouseId),
      code: warehouse?.code ?? null,
      name: warehouse?.name ?? null,
      isActive: warehouse?.isActive ?? null,
    },
    minimumQtyBase: decimalString(policy.minimumQty),
    targetQtyBase: decimalString(policy.targetQty),
    version: policy.version,
    updatedBy: idString(policy.updatedBy),
    updatedAt: isoDate(policy.updatedAt),
  };
}
```

</details>

<a id="fn-15"></a>

## isDuplicateKey()

**Code:** [product.service.js:52](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:52).

**Tham số:** `isDuplicateKey(error)`.

**Công việc:** Nhận biết lỗi trùng khóa duy nhất từ MongoDB.

**Xử lý theo thứ tự:**

1. Đọc error.code; so với 11000.
2. Trả true/false; không tự gửi thêm truy vấn hoặc xử lý lại giao dịch.

**Ai gọi / gọi tiếp:** Được gọi bởi [createProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-25), [createConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-28), [configurePolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-30). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Kết quả / nhánh bị chặn:** Boolean; không chứng minh dữ liệu không trùng nếu chỉ kiểm trước khi save.

**Ví dụ:** Hai người cùng tạo một mã sản phẩm: MongoDB chặn bản trùng; hàm này giúp đổi lỗi kỹ thuật thành thông báo dễ hiểu.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
isDuplicateKey = (error) => error?.code === 11000
```

</details>

<a id="fn-16"></a>

## requireProductReader()

**Code:** [product.service.js:54](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:54).

**Tham số:** `requireProductReader(user)`.

**Công việc:** Yêu cầu đúng quyền đọc sản phẩm.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: chủ cửa hàng/kế toán/kho/bán hàng.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [listProducts()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-23), [getProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-24), [listConversions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-29), [getProductOptions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-32). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền đọc sản phẩm chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function requireProductReader(user) {
  requirePermission(user, "product:read", BUSINESS_ROLES);
}
```

</details>

<a id="fn-17"></a>

## requireProductEditor()

**Code:** [product.service.js:58](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:58).

**Tham số:** `requireProductEditor(user)`.

**Công việc:** Yêu cầu đúng quyền sửa sản phẩm.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: chủ cửa hàng.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [updateProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-26), [changeProductStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-27), [createConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-28), [configurePolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-30), [listPolicies()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-31). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền sửa sản phẩm chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function requireProductEditor(user) {
  requirePermission(user, "product:update", ["OWNER"]);
}
```

</details>

<a id="fn-18"></a>

## requireProductCreator()

**Code:** [product.service.js:62](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:62).

**Tham số:** `requireProductCreator(user)`.

**Công việc:** Yêu cầu đúng quyền tạo sản phẩm.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: chủ cửa hàng.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [createProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-25). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền tạo sản phẩm chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function requireProductCreator(user) {
  requirePermission(user, "product:create", ["OWNER"]);
}
```

</details>

<a id="fn-19"></a>

## buildReadSession()

**Code:** [product.service.js:66](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:66).

**Tham số:** `buildReadSession(query, session)`.

**Công việc:** Gắn truy vấn đang có vào giao dịch nếu bên gọi truyền session.

**Xử lý theo thứ tự:**

1. Nhận đối tượng query chưa lấy kết quả.
2. Có session thì gọi query.session(session); không có thì giữ query.
3. Trả query để bên gọi await tiếp.

**Ai gọi / gọi tiếp:** Được gọi bởi [loadUoms()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-20), [currentConversionsByProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-21), [requireActiveProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-33). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Kết quả / nhánh bị chặn:** Query; helper không tự tạo một bộ lọc mới.

**Ví dụ:** Lấy sản phẩm khi tạo phiếu phải đọc cùng giao dịch; đọc ngoài giao dịch vẫn dùng được helper.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function buildReadSession(query, session) {
  return session ? query.session(session) : query;
}
```

</details>

<a id="fn-20"></a>

## loadUoms()

**Code:** [product.service.js:70](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:70).

**Tham số:** `loadUoms(ids, session = null)`.

**Công việc:** Đọc gom tên/mã đơn vị cho nhiều tham chiếu.

**Xử lý theo thứ tự:**

1. Loại mã trùng/vắng.
2. Nếu rỗng trả Map rỗng; nếu có thì Uom.find theo tập _id, chỉ chọn _id/code/name.
3. Gắn session nếu được truyền và lập Map.

**Ai gọi / gọi tiếp:** Được gọi bởi [detailWithMasters()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-22), [listProducts()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-23), [listConversions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-29). Gọi tiếp [buildReadSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-19), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `Uom`, tại [dòng 73](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:73). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Uom.find({ _id: { $in: unique } })
    .select("_id code name")
    .lean()
```

**Kết quả / nhánh bị chặn:** Map đơn vị theo mã.

**Ví dụ:** 100 sản phẩm dùng đơn vị viên thì không cần 100 truy vấn lấy cùng tên đơn vị.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function loadUoms(ids, session = null) {
  const unique = [...new Set(ids.filter(Boolean).map(idString))];
  if (!unique.length) return new Map();
  const query = Uom.find({ _id: { $in: unique } })
    .select("_id code name")
    .lean();
  const items = await buildReadSession(query, session);
  return new Map(items.map((item) => [idString(item._id), item]));
}
```

</details>

<a id="fn-21"></a>

## currentConversionsByProduct()

**Code:** [product.service.js:80](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:80).

**Tham số:** `currentConversionsByProduct(productIds, session = null)`.

**Công việc:** Chọn quy đổi đã có hiệu lực gần nhất cho mỗi sản phẩm/đơn vị.

**Xử lý theo thứ tự:**

1. Loại mã sản phẩm trùng.
2. Tìm ProductUomVersion có validFrom<=hiện tại; sắp theo product/uom rồi validFrom và version giảm dần.
3. Giữ bản đầu cho từng cặp và gom theo sản phẩm.

**Ai gọi / gọi tiếp:** Được gọi bởi [detailWithMasters()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-22). Gọi tiếp [buildReadSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-19), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `ProductUomVersion`, tại [dòng 83](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:83). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ProductUomVersion.find({
    productId: { $in: ids },
    validFrom: { $lte: new Date() },
  })
    .sort({ productId: 1, uomId: 1, validFrom: -1, version: -1 })
    .lean()
```

**Kết quả / nhánh bị chặn:** Map productId→các bản quy đổi hiện hành.

**Ví dụ:** Bản 6 viên/thùng mai mới hiệu lực không thay bản 4 hôm nay.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function currentConversionsByProduct(productIds, session = null) {
  const ids = [...new Set(productIds.filter(Boolean).map(idString))];
  if (!ids.length) return new Map();
  const query = ProductUomVersion.find({
    productId: { $in: ids },
    validFrom: { $lte: new Date() },
  })
    .sort({ productId: 1, uomId: 1, validFrom: -1, version: -1 })
    .lean();
  const conversions = await buildReadSession(query, session);
  const seen = new Set();
  const result = new Map(ids.map((id) => [id, []]));
  for (const conversion of conversions) {
    const key = `${idString(conversion.productId)}:${idString(conversion.uomId)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.get(idString(conversion.productId)).push(conversion);
  }
  return result;
}
```

</details>

<a id="fn-22"></a>

## detailWithMasters()

**Code:** [product.service.js:101](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:101).

**Tham số:** `detailWithMasters(product)`.

**Công việc:** Hoàn thiện một hồ sơ sản phẩm bằng quy đổi và tên đơn vị.

**Xử lý theo thứ tự:**

1. Gọi currentConversionsByProduct cho đúng sản phẩm.
2. Đọc Uom của đơn vị gốc và các quy đổi hiện hành.
3. Trả mapProductDetail.

**Ai gọi / gọi tiếp:** Được gọi bởi [getProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-24), [createProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-25), [updateProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-26), [changeProductStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-27). Gọi tiếp [currentConversionsByProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-21), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [loadUoms()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-20), [mapProductDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-13).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `ProductUomVersion.find`, `Uom.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở gạch A thấy viên và thùng đã khai báo, không thấy quy đổi tương lai là hiện hành.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function detailWithMasters(product) {
  const conversions = await currentConversionsByProduct([product._id]);
  const current = conversions.get(idString(product._id)) || [];
  const uoms = await loadUoms([
    product.baseUomId,
    ...current.map((conversion) => conversion.uomId),
  ]);
  return mapProductDetail(product, uoms, current);
}
```

</details>

<a id="fn-23"></a>

## listProducts()

**Code:** [product.service.js:111](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:111).

**Tham số:** `listProducts(user, query)`.

**Công việc:** Tìm danh sách sản phẩm có phân trang.

**Xử lý theo thứ tự:**

1. Kiểm quyền đọc; dựng bộ lọc hoạt động/kích thước/từ khóa mã hoặc tên.
2. Find và count cùng filter; chỉ lấy trang yêu cầu theo sắp xếp cho phép.
3. Đọc gom Uom rồi map từng sản phẩm.

**Ai gọi / gọi tiếp:** Được gọi bởi [list()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-0). Gọi tiếp [requireProductReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-16), [escapeRegex()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-309), [loadUoms()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-20), [mapProductSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-12).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `Product`, tại [dòng 123](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:123). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean()
```

- Đếm bản ghi qua `Product`, tại [dòng 128](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:128). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.countDocuments(filter)
```

**Kết quả / nhánh bị chặn:** items/total/page/limit; không tính tồn.

**Ví dụ:** Tìm gạch 600 đang hoạt động, trang 2 mỗi trang 10.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function listProducts(user, query) {
  requireProductReader(user);
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.nominalSize) filter.nominalSize = query.nominalSize;
  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ sku: search }, { name: search }];
  }
  const direction = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [query.sortBy]: direction, _id: -1 };
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  const uoms = await loadUoms(products.map((product) => product.baseUomId));
  return {
    items: products.map((product) => mapProductSummary(product, uoms)),
    total,
    page: query.page,
    limit: query.limit,
  };
}
```

</details>

<a id="fn-24"></a>

## getProduct()

**Code:** [product.service.js:139](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:139).

**Tham số:** `getProduct(user, id)`.

**Công việc:** Đọc một sản phẩm và chi tiết quy đổi hiện hành.

**Xử lý theo thứ tự:**

1. Kiểm quyền rồi Product.findById.
2. Không có thì 404; có thì detailWithMasters.

**Ai gọi / gọi tiếp:** Được gọi bởi [detail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-2). Gọi tiếp [requireProductReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-16), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [detailWithMasters()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-22).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `Product`, tại [dòng 141](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:141). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.findById(id).lean()
```

**Ví dụ:** Mở mã gạch đã ngừng vẫn xem được hồ sơ theo quyền đọc.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getProduct(user, id) {
  requireProductReader(user);
  const product = await Product.findById(id).lean();
  if (!product) throw notFoundError("Không tìm thấy sản phẩm");
  return detailWithMasters(product);
}
```

</details>

<a id="fn-25"></a>

## createProduct()

**Code:** [product.service.js:146](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:146).

**Tham số:** `createProduct(user, input)`.

**Công việc:** Tạo sản phẩm và quy đổi đơn vị gốc trong cùng giao dịch.

**Xử lý theo thứ tự:**

1. Kiểm quyền tạo; mở session.withTransaction.
2. Đọc Uom gốc, tìm mã trùng không phân biệt hoa thường; tạo Product hoạt động/version 1, có thể ghép nhãn kích thước từ số đo.
3. Save Product rồi save ProductUomVersion hệ số 1 và AuditEvent; lỗi một bước không lưu phần còn lại.
4. Bắt trùng khóa 11000; sau commit trả chi tiết.

**Ai gọi / gọi tiếp:** Được gọi bởi [create()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-3). Gọi tiếp [requireProductCreator()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-18), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [escapeRegex()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-309), [duplicateError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-329), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [isDuplicateKey()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-15), [detailWithMasters()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-22).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `Uom`, tại [dòng 152](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:152). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Uom.findById(input.baseUomId).session(session).lean()
```

- Đọc một bản ghi qua `Product`, tại [dòng 154](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:154). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.findOne({
        sku: { $regex: `^${escapeRegex(input.sku)}$`, $options: "i" },
      })
        .session(session)
        .lean()
```

- Ghi đối tượng model đã tạo qua `Product`, tại [dòng 184](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:184). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
created.save({ session })
```

- Ghi đối tượng model đã tạo qua `ProductUomVersion`, tại [dòng 185](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:185). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
new ProductUomVersion({
        productId: created._id,
        uomId: created.baseUomId,
        version: 1,
        basePerUnit: "1",
        validFrom: new Date(),
        createdBy: user._id,
      }).save({ session })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
        actorId: user._id,
        action: "CREATE_PRODUCT",
        entityType: "PRODUCT",
        entityId: created._id,
        details: { sku: created.sku, name: created.name, baseUomId: idString(created.baseUomId) },
        session,
      })
```

**Ví dụ:** Tạo gạch A đơn vị viên chỉ sinh quy đổi 1 viên=1 viên, chưa có thùng hoặc tồn.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function createProduct(user, input) {
  requireProductCreator(user);
  const session = await mongoose.startSession();
  let product;
  try {
    product = await session.withTransaction(async () => {
      const uom = await Uom.findById(input.baseUomId).session(session).lean();
      if (!uom) throw validationError("Đơn vị tính cơ bản không tồn tại");
      const duplicate = await Product.findOne({
        sku: { $regex: `^${escapeRegex(input.sku)}$`, $options: "i" },
      })
        .session(session)
        .lean();
      if (duplicate) throw duplicateError("SKU đã tồn tại");
      const created = new Product({
        sku: input.sku,
        name: input.name,
        baseUomId: input.baseUomId,
        wholeBaseUnits: input.wholeBaseUnits,
        nominalSize:
          input.nominalSize ??
          (input.lengthMm && input.widthMm
            ? `${Math.round(Number(input.lengthMm))}x${Math.round(Number(input.widthMm))}`
            : undefined),
        ...(input.category != null && { category: input.category }),
        ...(input.brand != null && { brand: input.brand }),
        ...(input.material != null && { material: input.material }),
        ...(input.surface != null && { surface: input.surface }),
        ...(input.lengthMm != null && { lengthMm: input.lengthMm }),
        ...(input.widthMm != null && { widthMm: input.widthMm }),
        ...(input.thicknessMm != null && {
          thicknessMm: input.thicknessMm,
        }),
        ...(input.origin != null && { origin: input.origin }),
        ...(input.description != null && { description: input.description }),
        isActive: true,
        version: 1,
      });
      await created.save({ session });
      await new ProductUomVersion({
        productId: created._id,
        uomId: created.baseUomId,
        version: 1,
        basePerUnit: "1",
        validFrom: new Date(),
        createdBy: user._id,
      }).save({ session });
      await appendAudit({
        actorId: user._id,
        action: "CREATE_PRODUCT",
        entityType: "PRODUCT",
        entityId: created._id,
        details: { sku: created.sku, name: created.name, baseUomId: idString(created.baseUomId) },
        session,
      });
      return created.toObject();
    }, transactionOptions);
  } catch (error) {
    if (isDuplicateKey(error)) throw duplicateError("SKU đã tồn tại");
    throw error;
  } finally {
    await session.endSession();
  }
  return detailWithMasters(product);
}
```

</details>

<a id="fn-26"></a>

## updateProduct()

**Code:** [product.service.js:212](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:212).

**Tham số:** `updateProduct(user, id, input)`.

**Công việc:** Lưu lại bộ thuộc tính cho phép của sản phẩm, có kiểm phiên bản.

**Xử lý theo thứ tự:**

1. Kiểm quyền; trong giao dịch đọc Product hiện tại và so expectedVersion.
2. Tên và trường có giá trị đi vào $set; các trường tùy chọn không có giá trị đi vào $unset.
3. FindOneAndUpdate với _id/version, tăng version; ghi chênh lệch AuditEvent.
4. Trả chi tiết sau commit.

**Ai gọi / gọi tiếp:** Được gọi bởi [update()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-4). Gọi tiếp [requireProductEditor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-17), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [versionConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-328), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [changedFields()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-301), [detailWithMasters()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-22).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `Product`, tại [dòng 218](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:218). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.findById(id).session(session).lean()
```

- Cập nhật rồi lấy bản ghi kết quả qua `Product`, tại [dòng 234](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:234). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.findOneAndUpdate(
        { _id: id, version: input.expectedVersion },
        update,
        { returnDocument: "after", runValidators: true, session },
      ).lean()
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
        actorId: user._id,
        action: "UPDATE_PRODUCT",
        entityType: "PRODUCT",
        entityId: next._id,
        changes: changedFields(current, next, editableFields),
        session,
      })
```

**Kết quả / nhánh bị chặn:** 409 khi bản cũ; không đổi SKU/đơn vị gốc qua lệnh này.

**Ví dụ:** Chỉ gửi tên mà bỏ mô tả sẽ xóa mô tả; muốn giữ phải gửi phần muốn giữ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function updateProduct(user, id, input) {
  requireProductEditor(user);
  const session = await mongoose.startSession();
  let updated;
  try {
    updated = await session.withTransaction(async () => {
      const current = await Product.findById(id).session(session).lean();
      if (!current) throw notFoundError("Không tìm thấy sản phẩm");
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      const set = { name: input.name };
      const unset = {};
      for (const field of optionalFields) {
        if (input[field] != null) set[field] = input[field];
        else unset[field] = "";
      }
      const update = { $set: set, $inc: { version: 1 } };
      if (Object.keys(unset).length) update.$unset = unset;
      const next = await Product.findOneAndUpdate(
        { _id: id, version: input.expectedVersion },
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
        action: "UPDATE_PRODUCT",
        entityType: "PRODUCT",
        entityId: next._id,
        changes: changedFields(current, next, editableFields),
        session,
      });
      return next;
    }, transactionOptions);
  } finally {
    await session.endSession();
  }
  return detailWithMasters(updated);
}
```

</details>

<a id="fn-27"></a>

## changeProductStatus()

**Code:** [product.service.js:261](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:261).

**Tham số:** `changeProductStatus(user, id, input)`.

**Công việc:** Đổi trạng thái hoạt động và lưu lý do.

**Xử lý theo thứ tự:**

1. Kiểm quyền, đọc Product và kiểm version trong giao dịch.
2. Trạng thái không đổi thì trả hiện tại, không audit/tăng version.
3. Nếu đổi thì cập nhật có điều kiện phiên bản, tăng version, ghi audit.

**Ai gọi / gọi tiếp:** Được gọi bởi [changeStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-5). Gọi tiếp [requireProductEditor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-17), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [versionConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-328), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [detailWithMasters()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-22).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `Product`, tại [dòng 267](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:267). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.findById(id).session(session).lean()
```

- Cập nhật rồi lấy bản ghi kết quả qua `Product`, tại [dòng 276](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:276). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.findOneAndUpdate(
        { _id: id, version: input.expectedVersion },
        { $set: { isActive: input.isActive }, $inc: { version: 1 } },
        { returnDocument: "after", runValidators: true, session },
      ).lean()
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
        actorId: user._id,
        action: "CHANGE_PRODUCT_STATUS",
        entityType: "PRODUCT",
        entityId: next._id,
        changes: [{ path: "isActive", before: current.isActive, after: next.isActive }],
        details: { reason: input.reason },
        session,
      })
```

**Ví dụ:** Tắt gạch còn đơn mua khiến bước nhận kiểm sản phẩm hoạt động có thể bị chặn; không xóa tồn cũ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function changeProductStatus(user, id, input) {
  requireProductEditor(user);
  const session = await mongoose.startSession();
  let updated;
  try {
    updated = await session.withTransaction(async () => {
      const current = await Product.findById(id).session(session).lean();
      if (!current) throw notFoundError("Không tìm thấy sản phẩm");
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      if (current.isActive === input.isActive) return current;
      const next = await Product.findOneAndUpdate(
        { _id: id, version: input.expectedVersion },
        { $set: { isActive: input.isActive }, $inc: { version: 1 } },
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
        action: "CHANGE_PRODUCT_STATUS",
        entityType: "PRODUCT",
        entityId: next._id,
        changes: [{ path: "isActive", before: current.isActive, after: next.isActive }],
        details: { reason: input.reason },
        session,
      });
      return next;
    }, transactionOptions);
  } finally {
    await session.endSession();
  }
  return detailWithMasters(updated);
}
```

</details>

<a id="fn-28"></a>

## createConversion()

**Code:** [product.service.js:304](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:304).

**Tham số:** `createConversion(user, productId, input)`.

**Công việc:** Thêm phiên bản quy đổi mà không sửa bản đã dùng.

**Xử lý theo thứ tự:**

1. Kiểm quyền, Product/version/hoạt động và Uom tồn tại, khác đơn vị gốc.
2. Kiểm hệ số dương, BOX nguyên viên phải hệ số nguyên; validFrom không quá khứ và có căn cứ.
3. Tăng version Product để chống tạo cạnh tranh, đọc phiên bản cao nhất của cặp product/uom, thêm version kế tiếp.
4. Save quy đổi và audit trong giao dịch.

**Ai gọi / gọi tiếp:** Được gọi bởi [createConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-7). Gọi tiếp [requireProductEditor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-17), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [versionConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-328), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [isDuplicateKey()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-15), [mapConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-11).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `Product`, tại [dòng 310](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:310). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.findById(productId).session(session).lean()
```

- Đọc theo mã _id qua `Uom`, tại [dòng 321](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:321). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Uom.findById(input.uomId).session(session).lean()
```

- Cập nhật rồi lấy bản ghi kết quả qua `Product`, tại [dòng 339](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:339). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.findOneAndUpdate(
        {
          _id: productId,
          version: input.expectedProductVersion,
          isActive: true,
        },
        { $inc: { version: 1 } },
        { returnDocument: "after", session },
      ).lean()
```

- Đọc một bản ghi qua `ProductUomVersion`, tại [dòng 354](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:354). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ProductUomVersion.findOne({
        productId,
        uomId: input.uomId,
      })
        .sort({ version: -1 })
        .session(session)
        .lean()
```

- Ghi đối tượng model đã tạo qua `ProductUomVersion`, tại [dòng 361](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:361). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
new ProductUomVersion({
        productId,
        uomId: input.uomId,
        version: (latest?.version ?? 0) + 1,
        basePerUnit: input.basePerUnit,
        validFrom,
        createdBy: user._id,
        verificationReference: input.verificationReference,
      }).save({ session })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
        actorId: user._id,
        action: "CREATE_PRODUCT_UOM_VERSION",
        entityType: "PRODUCT_UOM_VERSION",
        entityId: created._id,
        details: {
          productId: idString(productId),
          uomId: idString(input.uomId),
          version: created.version,
          basePerUnit: created.basePerUnit.toString(),
          productVersion: guard.version,
        },
        session,
      })
```

**Ví dụ:** Đổi thùng 4 thành 6 có hiệu lực ngày mai; chứng từ dùng hệ số 4 vẫn giữ 4.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function createConversion(user, productId, input) {
  requireProductEditor(user);
  const session = await mongoose.startSession();
  let conversion;
  try {
    conversion = await session.withTransaction(async () => {
      const product = await Product.findById(productId).session(session).lean();
      if (!product) throw notFoundError("Không tìm thấy sản phẩm");
      if (product.version !== input.expectedProductVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          product.version,
        );
      }
      if (!product.isActive) {
        throw new ApiError(409, "Sản phẩm đã ngừng hoạt động");
      }
      const uom = await Uom.findById(input.uomId).session(session).lean();
      if (!uom) throw validationError("Đơn vị tính không tồn tại");
      if (idString(product.baseUomId) === idString(input.uomId)) {
        throw validationError("Đơn vị cơ bản đã có hệ số 1 và không thể tạo lại");
      }
      const factor = new ExactDecimal(input.basePerUnit);
      if (uom.code === "BOX" && product.wholeBaseUnits && !factor.isInteger()) {
        throw validationError(
          "Hệ số quy đổi thùng phải nguyên với sản phẩm tính theo viên",
        );
      }
      const validFrom = new Date(input.validFrom);
      if (validFrom.getTime() < Date.now()) {
        throw validationError("Thời điểm hiệu lực không được ở quá khứ");
      }
      if (!input.verificationReference) {
        throw validationError("Quy đổi không phải đơn vị gốc cần căn cứ xác minh");
      }
      const guard = await Product.findOneAndUpdate(
        {
          _id: productId,
          version: input.expectedProductVersion,
          isActive: true,
        },
        { $inc: { version: 1 } },
        { returnDocument: "after", session },
      ).lean();
      if (!guard) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          product.version,
        );
      }
      const latest = await ProductUomVersion.findOne({
        productId,
        uomId: input.uomId,
      })
        .sort({ version: -1 })
        .session(session)
        .lean();
      const created = await new ProductUomVersion({
        productId,
        uomId: input.uomId,
        version: (latest?.version ?? 0) + 1,
        basePerUnit: input.basePerUnit,
        validFrom,
        createdBy: user._id,
        verificationReference: input.verificationReference,
      }).save({ session });
      await appendAudit({
        actorId: user._id,
        action: "CREATE_PRODUCT_UOM_VERSION",
        entityType: "PRODUCT_UOM_VERSION",
        entityId: created._id,
        details: {
          productId: idString(productId),
          uomId: idString(input.uomId),
          version: created.version,
          basePerUnit: created.basePerUnit.toString(),
          productVersion: guard.version,
        },
        session,
      });
      return {
        conversion: created.toObject(),
        productVersion: guard.version,
        uom,
      };
    }, transactionOptions);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new ApiError(409, "Phiên bản quy đổi vừa được tạo bởi yêu cầu khác");
    }
    throw error;
  } finally {
    await session.endSession();
  }
  const uoms = new Map([[idString(conversion.uom._id), conversion.uom]]);
  return {
    productId: idString(productId),
    productVersion: conversion.productVersion,
    conversion: mapConversion(conversion.conversion, uoms),
  };
}
```

</details>

<a id="fn-29"></a>

## listConversions()

**Code:** [product.service.js:406](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:406).

**Tham số:** `listConversions(user, productId, query)`.

**Công việc:** Đọc lịch sử quy đổi kể cả bản chưa tới hiệu lực.

**Xử lý theo thứ tự:**

1. Kiểm quyền và Product tồn tại.
2. Lọc productId/uomId nếu có, đọc/count chia trang theo validFrom/version mới trước.
3. Đọc tên đơn vị và mapConversion.

**Ai gọi / gọi tiếp:** Được gọi bởi [conversions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-6). Gọi tiếp [requireProductReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-16), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [loadUoms()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-20), [mapConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-11).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Kiểm có bản ghi hay không qua `Product`, tại [dòng 408](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:408). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.exists({ _id: productId })
```

- Đọc nhiều bản ghi qua `ProductUomVersion`, tại [dòng 414](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:414). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ProductUomVersion.find(filter)
      .sort({ validFrom: -1, version: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean()
```

- Đếm bản ghi qua `ProductUomVersion`, tại [dòng 419](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:419). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ProductUomVersion.countDocuments(filter)
```

**Ví dụ:** Có thể thấy bản 6 ngày mai trong lịch sử, dù chi tiết hiện hành vẫn 4.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function listConversions(user, productId, query) {
  requireProductReader(user);
  if (!(await Product.exists({ _id: productId }))) {
    throw notFoundError("Không tìm thấy sản phẩm");
  }
  const filter = { productId };
  if (query.uomId) filter.uomId = query.uomId;
  const [items, total] = await Promise.all([
    ProductUomVersion.find(filter)
      .sort({ validFrom: -1, version: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    ProductUomVersion.countDocuments(filter),
  ]);
  const uoms = await loadUoms(items.map((item) => item.uomId));
  return {
    items: items.map((item) => mapConversion(item, uoms)),
    total,
    page: query.page,
    limit: query.limit,
  };
}
```

</details>

<a id="fn-30"></a>

## configurePolicy()

**Code:** [product.service.js:430](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:430).

**Tham số:** `configurePolicy(user, productId, warehouseId, input)`.

**Công việc:** Tạo/cập nhật mức tối thiểu và mục tiêu cho một sản phẩm tại một kho.

**Xử lý theo thứ tự:**

1. Kiểm chủ cửa hàng; đọc Product và Warehouse đang hoạt động trong giao dịch.
2. Kiểm target>=minimum>=0, mặc định target=minimum, nguyên viên nếu cần.
3. expectedVersion=0 thì chỉ tạo nếu chưa có; bản đã có thì cập nhật theo _id/version, tăng version và ghi người sửa.
4. Thêm audit cùng giao dịch, trả mapPolicy.

**Ai gọi / gọi tiếp:** Được gọi bởi [configurePolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-9). Gọi tiếp [requireProductEditor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-17), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [versionConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-328), [isDuplicateKey()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-15), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [changedFields()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-301), [mapPolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-14).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `Product`, tại [dòng 437](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:437). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.findById(productId).session(session).lean()
```

- Đọc theo mã _id qua `Warehouse`, tại [dòng 441](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:441). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.findById(warehouseId)
        .session(session)
        .lean()
```

- Đọc một bản ghi qua `ProductWarehousePolicy`, tại [dòng 460](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:460). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ProductWarehousePolicy.findOne({
        productId,
        warehouseId,
      })
        .session(session)
        .lean()
```

- Ghi đối tượng model đã tạo qua `ProductWarehousePolicy`, tại [dòng 475](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:475). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
new ProductWarehousePolicy({
            productId,
            warehouseId,
            minimumQty: input.minimumQtyBase,
            targetQty: target.toString(),
            version: 1,
            updatedBy: user._id,
          }).save({ session })
```

- Cập nhật rồi lấy bản ghi kết quả qua `ProductWarehousePolicy`, tại [dòng 516](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:516). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ProductWarehousePolicy.findOneAndUpdate(
          { _id: existing._id, version: input.expectedVersion },
          {
            $set: {
              minimumQty: input.minimumQtyBase,
              targetQty: target.toString(),
              updatedBy: user._id,
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
          action: "CREATE_PRODUCT_WAREHOUSE_POLICY",
          entityType: "PRODUCT_WAREHOUSE_POLICY",
          entityId: next._id,
          details: {
            productId: idString(productId),
            warehouseId: idString(warehouseId),
            minimumQtyBase: minimum.toString(),
            targetQtyBase: target.toString(),
          },
          session,
        })
```

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
          actorId: user._id,
          action: "UPDATE_PRODUCT_WAREHOUSE_POLICY",
          entityType: "PRODUCT_WAREHOUSE_POLICY",
          entityId: next._id,
          changes: changedFields(existing, next, ["minimumQty", "targetQty"]),
          session,
        })
```

**Kết quả / nhánh bị chặn:** Không tự tạo phiếu bổ sung hoặc đơn mua.

**Ví dụ:** Kho A minimum 100 target 180; kho B có cặp chính sách riêng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function configurePolicy(user, productId, warehouseId, input) {
  requireProductEditor(user);
  const session = await mongoose.startSession();
  let policy;
  let warehouse;
  try {
    const result = await session.withTransaction(async () => {
      const product = await Product.findById(productId).session(session).lean();
      if (!product || !product.isActive) {
        throw new ApiError(400, "Sản phẩm không tồn tại hoặc đã ngừng hoạt động");
      }
      const selectedWarehouse = await Warehouse.findById(warehouseId)
        .session(session)
        .lean();
      if (!selectedWarehouse || !selectedWarehouse.isActive) {
        throw new ApiError(400, "Kho không tồn tại hoặc đã ngừng hoạt động");
      }
      const minimum = new ExactDecimal(input.minimumQtyBase);
      const target = input.targetQtyBase == null
        ? minimum
        : new ExactDecimal(input.targetQtyBase);
      if (target.lt(minimum)) {
        throw validationError("Lượng mục tiêu phải lớn hơn hoặc bằng lượng tối thiểu");
      }
      if (
        product.wholeBaseUnits &&
        (!minimum.isInteger() || !target.isInteger())
      ) {
        throw validationError("Sản phẩm tính theo viên yêu cầu số lượng nguyên");
      }
      const existing = await ProductWarehousePolicy.findOne({
        productId,
        warehouseId,
      })
        .session(session)
        .lean();
      let next;
      if (input.expectedVersion === 0) {
        if (existing) {
          throw versionConflict(
            "Chính sách kho đã tồn tại, vui lòng tải lại.",
            existing.version,
          );
        }
        try {
          next = await new ProductWarehousePolicy({
            productId,
            warehouseId,
            minimumQty: input.minimumQtyBase,
            targetQty: target.toString(),
            version: 1,
            updatedBy: user._id,
          }).save({ session });
        } catch (error) {
          if (isDuplicateKey(error)) {
            throw new ApiError(409, "Chính sách kho vừa được tạo bởi yêu cầu khác");
          }
          throw error;
        }
        await appendAudit({
          actorId: user._id,
          action: "CREATE_PRODUCT_WAREHOUSE_POLICY",
          entityType: "PRODUCT_WAREHOUSE_POLICY",
          entityId: next._id,
          details: {
            productId: idString(productId),
            warehouseId: idString(warehouseId),
            minimumQtyBase: minimum.toString(),
            targetQtyBase: target.toString(),
          },
          session,
        });
        next = next.toObject();
      } else {
        if (!existing) {
          throw versionConflict(
            "Chính sách kho chưa tồn tại, vui lòng tải lại.",
            0,
          );
        }
        if (existing.version !== input.expectedVersion) {
          throw versionConflict(
            "Dữ liệu đã thay đổi, vui lòng tải lại.",
            existing.version,
          );
        }
        next = await ProductWarehousePolicy.findOneAndUpdate(
          { _id: existing._id, version: input.expectedVersion },
          {
            $set: {
              minimumQty: input.minimumQtyBase,
              targetQty: target.toString(),
              updatedBy: user._id,
            },
            $inc: { version: 1 },
          },
          { returnDocument: "after", runValidators: true, session },
        ).lean();
        if (!next) {
          throw versionConflict(
            "Dữ liệu đã thay đổi, vui lòng tải lại.",
            existing.version,
          );
        }
        await appendAudit({
          actorId: user._id,
          action: "UPDATE_PRODUCT_WAREHOUSE_POLICY",
          entityType: "PRODUCT_WAREHOUSE_POLICY",
          entityId: next._id,
          changes: changedFields(existing, next, ["minimumQty", "targetQty"]),
          session,
        });
      }
      return { next, selectedWarehouse };
    }, transactionOptions);
    policy = result.next;
    warehouse = result.selectedWarehouse;
  } finally {
    await session.endSession();
  }
  return mapPolicy(policy, warehouse);
}
```

</details>

<a id="fn-31"></a>

## listPolicies()

**Code:** [product.service.js:553](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:553).

**Tham số:** `listPolicies(user, productId)`.

**Công việc:** Xem các chính sách kho của một sản phẩm.

**Xử lý theo thứ tự:**

1. Yêu cầu quyền sửa sản phẩm của chủ cửa hàng; kiểm Product có tồn tại.
2. Tìm ProductWarehousePolicy theo productId.
3. Đọc gom Warehouse rồi mapPolicy.

**Ai gọi / gọi tiếp:** Được gọi bởi [policies()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-8). Gọi tiếp [requireProductEditor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-17), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [mapPolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-14).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Kiểm có bản ghi hay không qua `Product`, tại [dòng 555](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:555). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.exists({ _id: productId })
```

- Đọc nhiều bản ghi qua `ProductWarehousePolicy`, tại [dòng 558](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:558). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ProductWarehousePolicy.find({ productId })
    .sort({ warehouseId: 1 })
    .lean()
```

- Đọc nhiều bản ghi qua `Warehouse`, tại [dòng 563](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:563). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.find({
        _id: { $in: policies.map((policy) => policy.warehouseId) },
      })
        .select("_id code name isActive")
        .lean()
```

**Ví dụ:** Chủ xem ngưỡng của mọi kho, không bị warehouseIds của mình thu hẹp ở chức năng này.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function listPolicies(user, productId) {
  requireProductEditor(user);
  if (!(await Product.exists({ _id: productId }))) {
    throw notFoundError("Không tìm thấy sản phẩm");
  }
  const policies = await ProductWarehousePolicy.find({ productId })
    .sort({ warehouseId: 1 })
    .lean();
  const warehouses = new Map(
    (
      await Warehouse.find({
        _id: { $in: policies.map((policy) => policy.warehouseId) },
      })
        .select("_id code name isActive")
        .lean()
    ).map((warehouse) => [idString(warehouse._id), warehouse]),
  );
  return {
    items: policies.map((policy) =>
      mapPolicy(policy, warehouses.get(idString(policy.warehouseId))),
    ),
  };
}
```

</details>

<a id="fn-32"></a>

## getProductOptions()

**Code:** [product.service.js:577](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:577).

**Tham số:** `getProductOptions(user)`.

**Công việc:** Cấp danh mục đơn vị và kho để chọn trong form.

**Xử lý theo thứ tự:**

1. Kiểm quyền đọc sản phẩm.
2. Đọc tất cả Uom; chỉ khi có quyền cấu hình của chủ cửa hàng mới đọc kho hoạt động.
3. Trả uoms và chỉ thêm warehouses cho người được phép.

**Ai gọi / gọi tiếp:** Được gọi bởi [options()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-1). Gọi tiếp [requireProductReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-16), [hasPermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-294), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `Uom`, tại [dòng 581](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:581). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Uom.find().sort({ code: 1 }).lean()
```

- Đọc nhiều bản ghi qua `Warehouse`, tại [dòng 583](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:583). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.find({ isActive: true })
          .select("_id code name isActive")
          .sort({ code: 1 })
          .lean()
```

**Ví dụ:** Bán hàng lấy danh mục đơn vị nhưng không nhận danh sách kho cấu hình chính sách từ endpoint này.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getProductOptions(user) {
  requireProductReader(user);
  const canConfigurePolicies = hasPermission(user, "product:update", ["OWNER"]);
  const [uoms, warehouses] = await Promise.all([
    Uom.find().sort({ code: 1 }).lean(),
    canConfigurePolicies
      ? Warehouse.find({ isActive: true })
          .select("_id code name isActive")
          .sort({ code: 1 })
          .lean()
      : [],
  ]);
  return {
    uoms: uoms.map((uom) => ({
      id: idString(uom._id),
      code: uom.code,
      name: uom.name,
    })),
    ...(canConfigurePolicies && {
      warehouses: warehouses.map((warehouse) => ({
        id: idString(warehouse._id),
        code: warehouse.code,
        name: warehouse.name,
        isActive: warehouse.isActive,
      })),
    }),
  };
}
```

</details>

<a id="fn-33"></a>

## requireActiveProduct()

**Code:** [product.service.js:607](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:607).

**Tham số:** `requireActiveProduct(productId, session = null)`.

**Công việc:** Đọc và bắt buộc sản phẩm đang hoạt động cho lệnh nội bộ.

**Xử lý theo thứ tự:**

1. Product.findById với session nếu có.
2. Thiếu hoặc inactive thì lỗi dữ liệu; đạt thì trả Product đã đọc.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Gọi tiếp [buildReadSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-19), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `Product`, tại [dòng 608](D:/Ky_9/SEP490/src/be/src/modules/products/product.service.js:608). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.findById(productId).lean()
```

**Ví dụ:** Lệnh nghiệp vụ chọn mã đã tắt bị chặn dù biết ObjectId của mã đó.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function requireActiveProduct(productId, session = null) {
  const query = Product.findById(productId).lean();
  const product = await buildReadSession(query, session);
  if (!product || !product.isActive) {
    throw validationError("Sản phẩm không tồn tại hoặc đã ngừng hoạt động");
  }
  return product;
}
```

</details>

<a id="fn-34"></a>

## positiveInteger()

**Code:** [product.validation.js:8](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:8).

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

<a id="fn-35"></a>

## optionalText()

**Code:** [product.validation.js:17](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:17).

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
  z.string().trim().min(1).max(max).nullable().optional()
```

</details>

<a id="fn-36"></a>

## expectedVersion()

**Code:** [product.validation.js:19](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:19).

**Tham số:** `expectedVersion(minimum = 1)`.

**Công việc:** Tạo bộ kiểm tra số phiên bản mong đợi của người dùng.

**Xử lý theo thứ tự:**

1. Nhận mức nhỏ nhất, thường 1, riêng tạo chính sách có thể 0.
2. Chỉ nhận số nguyên trong miền an toàn của JavaScript.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Kết quả / nhánh bị chặn:** Schema; chưa truy vấn phiên bản thật.

**Ví dụ:** Đang sửa bản 3 gửi expectedVersion=3; việc có còn đúng bản 3 phải kiểm lại trong service.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
expectedVersion = (minimum = 1) =>
  z.number().int().min(minimum).max(Number.MAX_SAFE_INTEGER)
```

</details>

<a id="fn-37"></a>

## pairedDimensions()

**Code:** [product.validation.js:43](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:43).

**Tham số:** `pairedDimensions(value, ctx)`.

**Công việc:** Bắt chiều dài và chiều rộng sản phẩm cùng có hoặc cùng vắng.

**Xử lý theo thứ tự:**

1. So việc có lengthMm và widthMm.
2. Nếu chỉ một giá trị có, thêm lỗi vào widthMm; nếu cả hai có hoặc cả hai không có thì không thêm lỗi.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Nhập dài 600 mà bỏ rộng thì không lưu được bộ thuộc tính.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
pairedDimensions = (value, ctx) => {
  if (Boolean(value.lengthMm) !== Boolean(value.widthMm)) {
    ctx.addIssue({
      code: "custom",
      path: ["widthMm"],
      message: "Chiều dài và chiều rộng phải cùng có hoặc cùng không có",
    });
  }
}
```

</details>

