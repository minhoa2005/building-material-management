---
id: DOC-CODE-IT1-SHARED-20261105
title: "Hàm dùng chung và kiểm quyền — giải thích từng hàm"
version: 1.0.0
phase: Review
domain: Iteration1
tags: [backend, function, database]
last_updated: 2026-11-05
---

# Hàm dùng chung và kiểm quyền — giải thích từng hàm

[Quay lại hướng dẫn đọc](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/README.md). Bản source ngày 05/11/2026; các đoạn lệnh dưới đây được lấy trực tiếp từ file hiện tại.

## Tìm nhanh

- [access.js → hasPermission()](#fn-294)
- [access.js → requirePermission()](#fn-295)
- [access.js → isOwner()](#fn-296)
- [access.js → isAssignedWarehouse()](#fn-297)
- [access.js → canAccessWarehouse()](#fn-298)
- [access.js → requireWarehouseAccess()](#fn-299)
- [access.js → scopedWarehouseIds()](#fn-300)
- [audit.js → changedFields()](#fn-301)
- [audit.js → appendAudit()](#fn-302)
- [domain.js → saigonDateOnly()](#fn-303)
- [domain.js → calendarDateToInstant()](#fn-304)
- [domain.js → calendarDateRange()](#fn-305)
- [domain.js → isPastCalendarDate()](#fn-306)
- [domain.js → decimalStringSchema()](#fn-307)
- [domain.js → multiplyBaseQuantity()](#fn-308)
- [domain.js → escapeRegex()](#fn-309)
- [domain.js → normalizeCode()](#fn-310)
- [domain.js → idString()](#fn-311)
- [domain.js → decimalString()](#fn-312)
- [domain.js → isoDate()](#fn-313)
- [domain.js → stableJson()](#fn-314)
- [domain.js → sha256Json()](#fn-315)
- [domain.js → sha256Text()](#fn-316)
- [lotIdentity.js → lockLotIdentity()](#fn-317)
- [lotIdentity.js → lotHasReferences()](#fn-318)
- [purchaseProvenance.js → rejectUntrackedPurchaseRelocation()](#fn-319)
- [userRole.js → currentRole()](#fn-320)
- [userRole.js → rolePermissions()](#fn-321)
- [userRole.js → userRoleDto()](#fn-322)
- [ApiError.js → ApiError.constructor()](#fn-323)
- [ApiError.js → validationError()](#fn-324)
- [ApiError.js → notFoundError()](#fn-325)
- [ApiError.js → forbiddenError()](#fn-326)
- [ApiError.js → scopeError()](#fn-327)
- [ApiError.js → versionConflict()](#fn-328)
- [ApiError.js → duplicateError()](#fn-329)
- [ApiError.js → operationConflict()](#fn-330)
- [ApiResponse.js → formatApiResponse()](#fn-331)
- [catchAsync.js → catchAsync()](#fn-332)
- [auth.js → unauthenticated()](#fn-333)
- [auth.js → authenticate()](#fn-334)
- [auth.js → authorize()](#fn-335)
- [permission.js → checkPermission()](#fn-336)
- [validate.js → validate()](#fn-337)
- [location-movement.service.js → netMovedQuantity()](#fn-338)
- [location-movement.service.js → netMovedQuantity.sign()](#fn-339)
- [location-movement.service.js → pendingTaskQuantity()](#fn-340)
- [location-movement.lifecycle.js → carryReservations()](#fn-341)

<a id="fn-294"></a>

## hasPermission()

**Code:** [access.js:5](D:/Ky_9/SEP490/src/be/src/shared/utils/access.js:5).

**Tham số:** `hasPermission(user, permission, roles = [])`.

**Công việc:** Kiểm tài khoản đang hoạt động, vai trò đúng và quyền đang được gán.

**Xử lý theo thứ tự:**

1. currentRole lấy một role hợp lệ.
2. Nếu danh sách roles không rỗng thì role phải nằm trong đó.
3. rolePermissions lấy quyền hợp lệ hiện tại; kiểm có permission.

**Ai gọi / gọi tiếp:** Được gọi bởi [getProductOptions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-32), [scopedStockRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-57), [movementDocumentReference()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-62), [getLotMovements()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-63), [getSupplierDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-97), [getReplenishmentOptions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-143), [capabilities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-284), [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295). Gọi tiếp [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320), [rolePermissions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-321).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Boolean; chính helper không đọc database.

**Ví dụ:** ADMIN không tự được quyền postGR; quyền từ token không thay việc tải User/Role hiện hành.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function hasPermission(user, permission, roles = []) {
  const role = currentRole(user);
  return Boolean(
    user?.isActive &&
      role &&
      (!roles.length || roles.includes(role.code)) &&
      rolePermissions(user).includes(permission),
  );
}
```

</details>

<a id="fn-295"></a>

## requirePermission()

**Code:** [access.js:15](D:/Ky_9/SEP490/src/be/src/shared/utils/access.js:15).

**Tham số:** `requirePermission(user, permission, roles = [])`.

**Công việc:** Dừng lệnh nếu hasPermission không đạt.

**Xử lý theo thứ tự:**

1. Gọi hasPermission; false thì forbiddenError 403.

**Ai gọi / gọi tiếp:** Được gọi bởi [requireProductReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-16), [requireProductEditor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-17), [requireProductCreator()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-18), [requireLotReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-46), [requireLotCreator()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-47), [requireLotUpdater()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-48), [getLotMovements()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-63), [requireSupplierReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-82), [requireSupplierCreator()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-83), [requireSupplierEditor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-84), [requireSupplierStatusEditor()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-85), [requireCreator()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-110), [requireUpdater()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-111), [requireApprover()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-112), [requireReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-113), [listPurchaseOrders()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-210), [getPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-212), [rights()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-236), [parent()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-264), [writableParent()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-265). Gọi tiếp [hasPermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-294), [forbiddenError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-326).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Có quyền đọc mà không có quyềnpost vẫn bị chặn.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function requirePermission(user, permission, roles = []) {
  if (!hasPermission(user, permission, roles)) {
    throw forbiddenError();
  }
}
```

</details>

<a id="fn-296"></a>

## isOwner()

**Code:** [access.js:21](D:/Ky_9/SEP490/src/be/src/shared/utils/access.js:21).

**Tham số:** `isOwner(user)`.

**Công việc:** Kiểm vai trò hiện tại là chủ cửa hàng.

**Xử lý theo thứ tự:**

1. currentRole(user).code so OWNER.

**Ai gọi / gọi tiếp:** Được gọi bởi [getReplenishmentOptions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-143), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298). Gọi tiếp [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Hàm này không tự cấp mọi permission; action vẫn phải requirePermission.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function isOwner(user) {
  return currentRole(user)?.code === "OWNER";
}
```

</details>

<a id="fn-297"></a>

## isAssignedWarehouse()

**Code:** [access.js:25](D:/Ky_9/SEP490/src/be/src/shared/utils/access.js:25).

**Tham số:** `isAssignedWarehouse(user, warehouseId)`.

**Công việc:** Kiểm mã kho trong danh sách kho của người dùng.

**Xử lý theo thứ tự:**

1. Duyệt user.warehouseIds; chuẩn hóa và so mã.

**Ai gọi / gọi tiếp:** Được gọi bởi [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Có A không có B thì B trả false, dù biết mã B.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function isAssignedWarehouse(user, warehouseId) {
  return (user?.warehouseIds || []).some(
    (id) => idString(id) === idString(warehouseId),
  );
}
```

</details>

<a id="fn-298"></a>

## canAccessWarehouse()

**Code:** [access.js:31](D:/Ky_9/SEP490/src/be/src/shared/utils/access.js:31).

**Tham số:** `canAccessWarehouse(user, warehouseId)`.

**Công việc:** Kiểm phạm vi kho dùng chung cho command.

**Xử lý theo thứ tự:**

1. Chủ cửa hàng hoặc isAssignedWarehouse thì true.
2. Không có ngoại lệ kế toán đọc toàn kho trong helper này.

**Ai gọi / gọi tiếp:** Được gọi bởi [listLots()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-58), [movementDocumentReference()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-62), [usableWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-125), [ownedDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-126), [replayCreated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-135), [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [master()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-184), [scopedWarehouseFilter()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-200), [getPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-212), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [scopedPurchaseRead()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-238), [location()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-250), [warehouseFilter()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-287), [requireWarehouseAccess()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-299). Gọi tiếp [isOwner()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-296), [isAssignedWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-297).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Kế toán đọc PO khoB qua scopedPurchaseRead nhưng sửa vẫn cần assignedB.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function canAccessWarehouse(user, warehouseId) {
  return isOwner(user) || isAssignedWarehouse(user, warehouseId);
}
```

</details>

<a id="fn-299"></a>

## requireWarehouseAccess()

**Code:** [access.js:35](D:/Ky_9/SEP490/src/be/src/shared/utils/access.js:35).

**Tham số:** `requireWarehouseAccess(user, warehouseId)`.

**Công việc:** Bắt buộc đạt canAccessWarehouse.

**Xử lý theo thứ tự:**

1. Không đạt thì scopeError 403; đạt không trả hồ sơ nào.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Gọi tiếp [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298), [scopeError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-327).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Lệnh chọn kho ngoài quyền bị chặn trước ghi dữ liệu.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function requireWarehouseAccess(user, warehouseId) {
  if (!canAccessWarehouse(user, warehouseId)) {
    throw scopeError();
  }
}
```

</details>

<a id="fn-300"></a>

## scopedWarehouseIds()

**Code:** [access.js:41](D:/Ky_9/SEP490/src/be/src/shared/utils/access.js:41).

**Tham số:** `scopedWarehouseIds(user)`.

**Công việc:** Lấy mảng mã kho được phân công dưới dạng chuỗi.

**Xử lý theo thứ tự:**

1. Map warehouseIds qua idString; thiếu thì mảng rỗng.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Một query có thể dùng mảng này làm $in; hàm chưa tạo query.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function scopedWarehouseIds(user) {
  return (user?.warehouseIds || []).map((id) => idString(id));
}
```

</details>

<a id="fn-301"></a>

## changedFields()

**Code:** [audit.js:5](D:/Ky_9/SEP490/src/be/src/shared/utils/audit.js:5).

**Tham số:** `changedFields(before, after, fields)`.

**Công việc:** So các trường cho phép để tạo lịch sử trước/sau.

**Xử lý theo thứ tự:**

1. Duyệt whitelist fields; thiếu đổi null, giá trị có toString được chuẩn hóa.
2. So JSON của hai phía.
3. Chỉ thêm trường thật sự khác với path/before/after.

**Ai gọi / gọi tiếp:** Được gọi bởi [updateProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-26), [configurePolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-30), [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61), [updateSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-93). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Đổi phone từA sangB tạo một change; không tự đưa password hoặc trường ngoài whitelist vào audit.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function changedFields(before, after, fields) {
  const changes = [];
  for (const field of fields) {
    const left = before?.[field] ?? null;
    const right = after?.[field] ?? null;
    const leftValue = left?.toString?.() ?? left;
    const rightValue = right?.toString?.() ?? right;
    if (JSON.stringify(leftValue) !== JSON.stringify(rightValue)) {
      changes.push({ path: field, before: leftValue, after: rightValue });
    }
  }
  return changes;
}
```

</details>

<a id="fn-302"></a>

## appendAudit()

**Code:** [audit.js:19](D:/Ky_9/SEP490/src/be/src/shared/utils/audit.js:19).

**Tham số:** `appendAudit({
  documentId = null,
  actorId,
  action,
  entityType = null,
  entityId = null,
  changes = [],
  details = null,
  eventAt = new Date(),
  session = null,
} = {})`.

**Công việc:** Ghi nhật ký người thực hiện và nội dung thay đổi.

**Xử lý theo thứ tự:**

1. entityType/entityId phải cùng có hoặc cùng thiếu.
2. Dựng summary từ details hoặc tên trường đổi; serialized không quá 4000 ký tự.
3. Tạo AuditEvent và save bằng session nếu có.
4. Trả event, không sửa bản ghi lịch sử cũ.

**Ai gọi / gọi tiếp:** Được gọi bởi [createProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-25), [updateProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-26), [changeProductStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-27), [createConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-28), [configurePolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-30), [createLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-60), [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61), [createSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-92), [updateSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-93), [changeSupplierStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-94), [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142), [changeDestinations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-229), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248). Không gọi hàm khác trong danh mục này.

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Ghi đối tượng model đã tạo qua `AuditEvent`, tại [dòng 52](D:/Ky_9/SEP490/src/be/src/shared/utils/audit.js:52). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
event.save(session ? { session } : undefined)
```

**Ví dụ:** Cập nhật supplier và audit dùng cùng session: nếu audit lỗi thì cập nhật cũng rollback.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function appendAudit({
  documentId = null,
  actorId,
  action,
  entityType = null,
  entityId = null,
  changes = [],
  details = null,
  eventAt = new Date(),
  session = null,
} = {}) {
  if (Boolean(entityType) !== Boolean(entityId)) {
    throw new Error("Audit entityType and entityId must be supplied together");
  }
  const summary =
    details ??
    (changes.length
      ? { changedFields: changes.map((change) => change.path) }
      : { action });
  const serialized =
    typeof summary === "string" ? summary : JSON.stringify(summary);
  if (serialized.length > MAX_DETAILS) {
    throw new Error("Audit details exceed the 4000-character limit");
  }
  const event = new AuditEvent({
    ...(documentId && { documentId }),
    actorId,
    action,
    eventAt,
    details: serialized,
    ...(entityType && { entityType, entityId }),
    changes,
  });
  await event.save(session ? { session } : undefined);
  return event;
}
```

</details>

<a id="fn-303"></a>

## saigonDateOnly()

**Code:** [domain.js:21](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:21).

**Tham số:** `saigonDateOnly(now = new Date())`.

**Công việc:** Lấy ngày lịch Việt Nam từ một thời điểm.

**Xử lý theo thứ tự:**

1. Cộng lệch 7 giờ vào thời điểm và lấy YYYY-MM-DD của ISO.

**Ai gọi / gọi tiếp:** Được gọi bởi [manufacturedDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-54), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [isPastCalendarDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-306). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Một thời điểm chiều tốiUTC có thể đã là ngày hôm sau ở Việt Nam.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function saigonDateOnly(now = new Date()) {
  return new Date(now.getTime() + SAIGON_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}
```

</details>

<a id="fn-304"></a>

## calendarDateToInstant()

**Code:** [domain.js:27](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:27).

**Tham số:** `calendarDateToInstant(value)`.

**Công việc:** Biến ngày Việt Nam thành thời điểm đầu ngày để lưu/lọc.

**Xử lý theo thứ tự:**

1. Ghép ngày với 00:00:00+07:00 rồi tạo Date.

**Ai gọi / gọi tiếp:** Được gọi bởi [manufacturedDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-54), [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [calendarDateRange()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-305). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Ngày 03/11 Việt Nam có mốc UTC từ 17:00 ngày 02/11.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function calendarDateToInstant(value) {
  return new Date(`${value}T00:00:00+07:00`);
}
```

</details>

<a id="fn-305"></a>

## calendarDateRange()

**Code:** [domain.js:31](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:31).

**Tham số:** `calendarDateRange(from, to)`.

**Công việc:** Dựng mốc lọc ngày Việt Nam bao gồm trọn ngày kết thúc.

**Xử lý theo thứ tự:**

1. from dùng $gte đầu ngày.
2. to dùng $lt đầu ngày tiếp theo; không có mốc thì null.

**Ai gọi / gọi tiếp:** Được gọi bởi [listPurchaseOrders()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-210). Gọi tiếp [calendarDateToInstant()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-304).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Lấy 03/11 không bỏ sót bản ghi 23:59.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function calendarDateRange(from, to) {
  const range = {};
  if (from) range.$gte = calendarDateToInstant(from);
  if (to) {
    range.$lt = new Date(calendarDateToInstant(to).getTime() + 86_400_000);
  }
  return Object.keys(range).length ? range : null;
}
```

</details>

<a id="fn-306"></a>

## isPastCalendarDate()

**Code:** [domain.js:40](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:40).

**Tham số:** `isPastCalendarDate(value, now = new Date())`.

**Công việc:** Kiểm một ngày đã trước hôm nay Việt Nam chưa.

**Xử lý theo thứ tự:**

1. So chuỗi YYYY-MM-DD với saigonDateOnly(now).

**Ai gọi / gọi tiếp:** Được gọi bởi [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140). Gọi tiếp [saigonDateOnly()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-303).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Gửi RR có neededOn hôm qua bị chặn, dù nháp có thể đã được lưu.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function isPastCalendarDate(value, now = new Date()) {
  return value < saigonDateOnly(now);
}
```

</details>

<a id="fn-307"></a>

## decimalStringSchema()

**Code:** [domain.js:44](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:44).

**Tham số:** `decimalStringSchema({
  scale = 6,
  precision = 20,
  positive = false,
  allowZero = true,
  label = "Số lượng",
} = {})`.

**Công việc:** Tạo bộ kiểm tra lượng/hệ số là chuỗi thập phân chính xác.

**Xử lý theo thứ tự:**

1. Yêu cầu chuỗi số không âm không dùng dạng số mũ.
2. ExactDecimal kiểm hữu hạn, số chữ số thập phân và giới hạn precision/scale.
3. Nếu positive thì phải>0; quy tắc allowZero áp riêng.
4. Chuẩn hóa về chuỗi bằng ExactDecimal.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Lượng 0.5 có thể đúng định dạng nhưng nếu quy ra lẻ viên thì service còn chặn sau đó.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function decimalStringSchema({
  scale = 6,
  precision = 20,
  positive = false,
  allowZero = true,
  label = "Số lượng",
} = {}) {
  return z
    .string()
    .trim()
    .regex(
      /^\d+(?:\.\d+)?$/,
      `${label} phải là chuỗi số thập phân không âm`,
    )
    .superRefine((value, ctx) => {
      try {
        const number = new ExactDecimal(value);
        if (!number.isFinite()) throw new Error("not finite");
        if (number.decimalPlaces() > scale) {
          ctx.addIssue({
            code: "custom",
            message: `${label} tối đa ${scale} chữ số thập phân`,
          });
        }
        if (number.abs().gte(new ExactDecimal(10).pow(precision - scale))) {
          ctx.addIssue({
            code: "custom",
            message: `${label} vượt độ chính xác cho phép`,
          });
        }
        if (positive ? number.lte(0) : !allowZero && number.isZero()) {
          ctx.addIssue({
            code: "custom",
            message: positive ? `${label} phải lớn hơn 0` : `${label} phải lớn hơn 0`,
          });
        }
      } catch {
        ctx.addIssue({
          code: "custom",
          message: `${label} không hợp lệ`,
        });
      }
    })
    .transform((value) => new ExactDecimal(value).toString());
}
```

</details>

<a id="fn-308"></a>

## multiplyBaseQuantity()

**Code:** [domain.js:90](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:90).

**Tham số:** `multiplyBaseQuantity(enteredQty, factor)`.

**Công việc:** Tính lượng đơn vị gốc và trả kết quả kiểm độ chính xác.

**Xử lý theo thứ tự:**

1. Nhân enteredQty với factor bằng ExactDecimal.
2. Kiểm hữu hạn, dương, tối đa 6 số thập phân và giá trị<10^14.
3. Trả value/string/valid; không tự kiểm product.wholeBaseUnits ở đây.

**Ai gọi / gọi tiếp:** Được gọi bởi [prepareLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-127), [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-183), [prepare()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-221). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** 2.5 thùng×4=10 viên; 2.7 viên cần service kiểm nguyên viên.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function multiplyBaseQuantity(enteredQty, factor) {
  const quantity = new ExactDecimal(enteredQty).mul(new ExactDecimal(factor));
  return {
    value: quantity,
    string: quantity.toString(),
    valid:
      quantity.isFinite() &&
      quantity.gt(0) &&
      quantity.decimalPlaces() <= 6 &&
      quantity.abs().lt(new ExactDecimal(10).pow(14)),
  };
}
```

</details>

<a id="fn-309"></a>

## escapeRegex()

**Code:** [domain.js:103](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:103).

**Tham số:** `escapeRegex(value)`.

**Công việc:** Biến từ khóa thành chữ cần tìm, tránh ký tự có nghĩa đặc biệt trong mẫu tìm kiếm.

**Xử lý theo thứ tự:**

1. Thêm dấu bảo vệ trước các ký tự đặc biệt của biểu thức tìm kiếm.
2. Trả chuỗi đã bảo vệ; bên gọi mới tạo RegExp hoặc bộ lọc MongoDB.

**Ai gọi / gọi tiếp:** Được gọi bởi [listProducts()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-23), [createProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-25), [listSuppliers()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-90), [createSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-92), [listPurchaseOrders()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-210). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Tìm A+B là tìm dấu cộng thật, không hiểu + như một phép lặp.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

</details>

<a id="fn-310"></a>

## normalizeCode()

**Code:** [domain.js:107](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:107).

**Tham số:** `normalizeCode(value)`.

**Công việc:** Chuẩn hóa mã danh mục.

**Xử lý theo thứ tự:**

1. Trim rồi viết hoa.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** ncc-ma thành NCC-MA; không tự kiểm Party có trùng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function normalizeCode(value) {
  return value.trim().toUpperCase();
}
```

</details>

<a id="fn-311"></a>

## idString()

**Code:** [domain.js:111](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:111).

**Tham số:** `idString(value)`.

**Công việc:** Chuẩn hóa mã tham chiếu thành chuỗi.

**Xử lý theo thứ tự:**

1. Chấp nhận ObjectId, đối tượng có _id hoặc chuỗi.
2. Không có thì trả null; chuỗi 24 ký tự hex được viết thường theo code.
3. Không kiểm bản ghi đó tồn tại.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapUom()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-10), [mapConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-11), [mapProductSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-12), [mapPolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-14), [loadUoms()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-20), [currentConversionsByProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-21), [detailWithMasters()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-22), [createProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-25), [createConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-28), [configurePolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-30), [listPolicies()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-31), [getProductOptions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-32), [mapLotSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-43), [mapLotDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-44), [mapScopedStock()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-45), [scopedStockRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-57), [listLots()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-58), [createLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-60), [movementDocumentReference()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-62), [getLotMovements()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-63), [getLotMovements.allowedWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-64), [getLotMovements.mapEndpoint()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-65), [mapSupplierSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-78), [mapSupplierDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-80), [warehouseScope()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-87), [getSupplierHistory()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-95), [supplierDocumentIdsForGr()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-96), [getSupplierDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-97), [operationKeyHash()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-120), [creationOperationKey()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-121), [commandResult()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-122), [assertReplay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-124), [prepareLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-127), [canonicalLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-130), [creationPayload()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-131), [updatePayload()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-132), [submitPayload()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-133), [reviewPayload()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-134), [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [appendApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-141), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142), [getReplenishmentOptions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-143), [mapWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-144), [scopedWarehouseFilter()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-200), [loadBatchGraph()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-201), [batchSign()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-202), [resolveGrLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-203), [grLineReceivedQuantities()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-204), [emptyComputedLine()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-205), [computedDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-207), [computedDocuments.sumEvents()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-208), [mapPreviewLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-209), [listPurchaseOrders()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-210), [getPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-212), [isAssignedWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-297), [scopedWarehouseIds()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-300). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Hai ObjectId cùng nội dung được so dưới dạng chuỗi; biết mã không có nghĩa có quyền đọc hồ sơ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function idString(value) {
  if (value == null) return null;
  const text = String(value._id ?? value);
  return /^[a-f\d]{24}$/i.test(text) ? text.toLowerCase() : text;
}
```

</details>

<a id="fn-312"></a>

## decimalString()

**Code:** [domain.js:117](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:117).

**Tham số:** `decimalString(value)`.

**Công việc:** Đổi giá trị thập phân đang có sang chuỗi để trả API.

**Xử lý theo thứ tự:**

1. Nếu null hoặc không có thì giữ null.
2. Ngược lại gọi toString, không nhân hay làm tròn.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-11), [mapProductSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-12), [mapPolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-14). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Decimal 128 của 100 trả chuỗi 100; thiếu dữ liệu trả null, không tự đổi thành 0.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function decimalString(value) {
  return value == null ? null : value.toString();
}
```

</details>

<a id="fn-313"></a>

## isoDate()

**Code:** [domain.js:121](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:121).

**Tham số:** `isoDate(value)`.

**Công việc:** Đổi ngày/thời điểm đang có thành chuỗi ISO.

**Xử lý theo thứ tự:**

1. Không có giá trị thì trả null.
2. Có giá trị thì tạo Date và gọi toISOString.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-11), [mapProductSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-12), [mapPolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-14), [mapLotSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-43), [mapLotDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-44), [getLotMovements()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-63), [mapSupplierSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-78), [mapSupplierDetail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-79), [mapSupplierDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-80), [getSupplierHistory()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-95), [listPurchaseOrders()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-210), [getPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-212). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Một thời điểm lưu UTC được trả rõ múi giờZ; helper không áp bộ lọc ngày Việt Nam.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function isoDate(value) {
  return value == null ? null : new Date(value).toISOString();
}
```

</details>

<a id="fn-314"></a>

## stableJson()

**Code:** [domain.js:125](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:125).

**Tham số:** `stableJson(value)`.

**Công việc:** Chuẩn hóa thứ tự khóa object để so nội dung thao tác.

**Xử lý theo thứ tự:**

1. Mảng giữ thứ tự và xử lý từng phần tử.
2. Object sắp khóa, bỏ giá trị undefined, xử lý đệ quy.
3. Date và giá trị đơn giản giữ nguyên.

**Ai gọi / gọi tiếp:** Được gọi bởi [sha256Json()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-315). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Hai object cùng dữ liệu nhưng thứ tự key khác nhau có thể tạo cùng nội dung băm.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, stableJson(value[key])]),
    );
  }
  return value;
}
```

</details>

<a id="fn-315"></a>

## sha256Json()

**Code:** [domain.js:138](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:138).

**Tham số:** `sha256Json(value)`.

**Công việc:** Tạo dấu kiểm của payload đã chuẩn hóa.

**Xử lý theo thứ tự:**

1. stableJson rồi JSON.stringify.
2. Băm SHA 256, trả chuỗihex.

**Ai gọi / gọi tiếp:** Được gọi bởi [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248). Gọi tiếp [stableJson()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-314).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** CùngoperationKey nhưng lượng 70 đổi 60 cho hash khác, bị chặn ghi đè ý nghĩa thao tác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function sha256Json(value) {
  return createHash("sha256")
    .update(JSON.stringify(stableJson(value)))
    .digest("hex");
}
```

</details>

<a id="fn-316"></a>

## sha256Text()

**Code:** [domain.js:144](D:/Ky_9/SEP490/src/be/src/shared/utils/domain.js:144).

**Tham số:** `sha256Text(value)`.

**Công việc:** Băm một chuỗi thành mã SHA 256.

**Xử lý theo thứ tự:**

1. createHash SHA 256, update text, digest hex.

**Ai gọi / gọi tiếp:** Được gọi bởi [operationKeyHash()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-120), [creationOperationKey()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-121), [operationKey()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-246). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Biến raw key gắn user thành mã cố định để tra operation; không phải mã hóa để khôi phục raw key.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}
```

</details>

<a id="fn-317"></a>

## lockLotIdentity()

**Code:** [lotIdentity.js:10](D:/Ky_9/SEP490/src/be/src/shared/utils/lotIdentity.js:10).

**Tham số:** `lockLotIdentity(lotId, session)`.

**Công việc:** Khóa nhận dạng lô khi writer tạo tham chiếu.

**Xử lý theo thứ tự:**

1. Lot.updateOne theo _id, set identityLocked=true cùng session.
2. matchedCount khác 1 thì lỗi vì lô không còn tồn tại.

**Ai gọi / gọi tiếp:** Được gọi bởi [writeRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-222). Không gọi hàm khác trong danh mục này.

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Cập nhật một bản ghi qua `Lot`, tại [dòng 11](D:/Ky_9/SEP490/src/be/src/shared/utils/lotIdentity.js:11). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Lot.updateOne(
    { _id: lotId },
    { $set: { identityLocked: true } },
    { session },
  )
```

**Ví dụ:** Chọn lô vào nháp cũng khóa; bỏ nháp không tự mở lại khóa.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function lockLotIdentity(lotId, session) {
  const result = await Lot.updateOne(
    { _id: lotId },
    { $set: { identityLocked: true } },
    { session },
  );
  if (result.matchedCount !== 1) {
    throw new Error("Lot identity lock failed: lot no longer exists");
  }
}
```

</details>

<a id="fn-318"></a>

## lotHasReferences()

**Code:** [lotIdentity.js:21](D:/Ky_9/SEP490/src/be/src/shared/utils/lotIdentity.js:21).

**Tham số:** `lotHasReferences(lotId, session)`.

**Công việc:** Kiểm lô đã được dòng chứng từ hoặc số dư dùng chưa.

**Xử lý theo thứ tự:**

1. DocumentLine.exists lotId trong session, có thì true.
2. Nếu chưa có, StockBalance.exists lotId.
3. Trả boolean.

**Ai gọi / gọi tiếp:** Được gọi bởi [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61). Không gọi hàm khác trong danh mục này.

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Kiểm có bản ghi hay không qua `DocumentLine`, tại [dòng 22](D:/Ky_9/SEP490/src/be/src/shared/utils/lotIdentity.js:22). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.exists({ lotId }).session(session)
```

- Kiểm có bản ghi hay không qua `StockBalance`, tại [dòng 24](D:/Ky_9/SEP490/src/be/src/shared/utils/lotIdentity.js:24). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
StockBalance.exists({ lotId }).session(session)
```

**Ví dụ:** Ngay cả số dư 0 vẫn là tham chiếu khiến không đổi nhận dạng đã dùng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function lotHasReferences(lotId, session) {
  const line = await DocumentLine.exists({ lotId }).session(session);
  if (line) return true;
  const balance = await StockBalance.exists({ lotId }).session(session);
  return Boolean(balance);
}
```

</details>

<a id="fn-319"></a>

## rejectUntrackedPurchaseRelocation()

**Code:** [purchaseProvenance.js:6](D:/Ky_9/SEP490/src/be/src/shared/utils/purchaseProvenance.js:6).

**Tham số:** `rejectUntrackedPurchaseRelocation(balanceId, session)`.

**Công việc:** Chặn chuyển vị trí thường lấy mất hàng nhận mua chưa được theo dõi cất.

**Xử lý theo thứ tự:**

1. Đọc ReceiptPlacement theo sourceBalanceId.
2. Nếu có received−reversed−placed>0 thì 409 PROVENANCE.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Không gọi hàm khác trong danh mục này.

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `ReceiptPlacement`, tại [dòng 7](D:/Ky_9/SEP490/src/be/src/shared/utils/purchaseProvenance.js:7). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ReceiptPlacement.find({ sourceBalanceId: balanceId }).session(session).lean()
```

**Ví dụ:** R 1 còn 70 củaGR phải dùng nhiệm vụ cất có receiptLineId, không đi chuyển thường rồi bỏ sai placement.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function rejectUntrackedPurchaseRelocation(balanceId, session) {
  const sources = await ReceiptPlacement.find({ sourceBalanceId: balanceId }).session(session).lean();
  if (sources.some(p => exact(p.receivedQtyBase).minus(exact(p.reversedQtyBase)).minus(exact(p.placedQtyBase)).gt(0))) {
    throw new ApiError(409, 'Nguồn nhận mua phải đi qua put-away để giữ truy vết GR', { code: 'ERR-REC-PROVENANCE' });
  }
}
```

</details>

<a id="fn-320"></a>

## currentRole()

**Code:** [userRole.js:6](D:/Ky_9/SEP490/src/be/src/shared/utils/userRole.js:6).

**Tham số:** `currentRole(user)`.

**Công việc:** Chọn đúng một vai trò hiện tại đã được populate.

**Xử lý theo thứ tự:**

1. Lấy user.roleId; không nhận mảng.
2. Chỉ chấp nhận role.code nằm trong ROLE_CODES.

**Ai gọi / gọi tiếp:** Được gọi bởi [warehouseScope()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-87), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-104), [replenishmentScope()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-105), [canReadRelated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-106), [canReadAllPurchaseOrders()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-199), [inspectionContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-230), [scopedPurchaseRead()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-238), [warehouseFilter()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-287), [hasPermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-294), [isOwner()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-296), [rolePermissions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-321), [userRoleDto()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-322), [authenticate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-334), [authorize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-335), [checkPermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-336). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Mảng role cũ hoặc chỉObjectId chưa có code không tự cấp quyền.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function currentRole(user) {
  const role = user?.roleId;
  return role && !Array.isArray(role) && ROLE_CODES.includes(role.code) ? role : null;
}
```

</details>

<a id="fn-321"></a>

## rolePermissions()

**Code:** [userRole.js:11](D:/Ky_9/SEP490/src/be/src/shared/utils/userRole.js:11).

**Tham số:** `rolePermissions(user)`.

**Công việc:** Lấy quyền thực gán trong role và giới hạn bởi catalogue của vai trò.

**Xử lý theo thứ tự:**

1. currentRole; thiếu thì mảng rỗng.
2. Map permissionIds đãpopulate thànhcode.
3. Chỉ giữ code trong ROLE_PERMISSIONS[role.code], loại trùng.

**Ai gọi / gọi tiếp:** Được gọi bởi [canReadRelated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-106), [hasPermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-294), [checkPermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-336). Gọi tiếp [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Nếu roleWAREHOUSE bị gán nhầm quyềnOwner ngoài catalogue, helper không tự công nhận.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function rolePermissions(user) {
  const role = currentRole(user);
  if (!role) return [];
  const allowed = ROLE_PERMISSIONS[role.code];
  return [...new Set((role.permissionIds || [])
    .map((permission) => permission?.code)
    .filter((code) => allowed.includes(code)))];
}
```

</details>

<a id="fn-322"></a>

## userRoleDto()

**Code:** [userRole.js:20](D:/Ky_9/SEP490/src/be/src/shared/utils/userRole.js:20).

**Tham số:** `userRoleDto(user)`.

**Công việc:** Trả thông tin vai trò cho phía gọi theo hợp đồng hiện tại.

**Xử lý theo thứ tự:**

1. currentRole thiếu thì 401.
2. Đổi code thành chữ thường; trả role và aliases roles=[role], primaryRole.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Gọi tiếp [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** aliases dạngmảng phục vụ tương thích, không có nghĩa tài khoản có nhiều role.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function userRoleDto(user) {
  const assigned = currentRole(user);
  if (!assigned) throw new ApiError(401, 'Tài khoản chưa có vai trò hợp lệ; cần hoàn tất chuyển đổi dữ liệu');
  const role = assigned.code.toLowerCase();
  return { role, roles: [role], primaryRole: role };
}
```

</details>

<a id="fn-323"></a>

## ApiError.constructor()

**Code:** [ApiError.js:2](D:/Ky_9/SEP490/src/be/src/shared/utils/ApiError.js:2).

**Tham số:** `ApiError.constructor(statusCode, message, { code = null, fieldErrors = [], details = null } = {})`.

**Công việc:** Tạo lỗi dùng chung kèm trạng thái, mã và chi tiết.

**Xử lý theo thứ tự:**

1. Gọi Error(message), đặt statusCode.
2. Chỉ thêm code/fieldErrors/details khi được cung cấp.
3. Không ghi log hay database tại constructor.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** 409 kèm currentVersion giúp màn hình yêu cầu tải lại, không đoán lỗi từ câu chữ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
constructor(statusCode, message, { code = null, fieldErrors = [], details = null } = {}) {
    super(message);
    this.statusCode = statusCode;
    if (code) this.code = code;
    if (fieldErrors.length) this.fieldErrors = fieldErrors;
    if (details != null) this.details = details;
  }
```

</details>

<a id="fn-324"></a>

## validationError()

**Code:** [ApiError.js:30](D:/Ky_9/SEP490/src/be/src/shared/utils/ApiError.js:30).

**Tham số:** `validationError(message, fieldErrors = [])`.

**Công việc:** Tạo lỗi dữ liệu không hợp lệ.

**Xử lý theo thứ tự:**

1. Tạo ApiError mãHTTP 400 và code nghiệp vụ đúng trong code.
2. Gắn message và chi tiết mà hàm hỗ trợ; không tự đọc/gửi HTTP hoặc sửa hồ sơ.

**Ai gọi / gọi tiếp:** Được gọi bởi [createProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-25), [createConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-28), [configurePolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-30), [requireActiveProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-33), [manufacturedDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-54), [createLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-60), [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61), [usableWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-125), [prepareLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-127), [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [appendApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-141), [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-183), [master()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-184), [draftLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-185), [confirmPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-189), [supplierConfirmation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-191), [validateClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-193), [prepare()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-221), [writeRows()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-222), [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226), [changeDestinations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-229), [inspectFile()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-266), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281), [validate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-337). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Service phát hiện dữ liệu không hợp lệ rồi ném lỗi; middleware trả lỗi cho bên gọi.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
validationError = (message, fieldErrors = []) =>
  new ApiError(400, message, { code: ERROR_CODES.VALIDATION, fieldErrors })
```

</details>

<a id="fn-325"></a>

## notFoundError()

**Code:** [ApiError.js:32](D:/Ky_9/SEP490/src/be/src/shared/utils/ApiError.js:32).

**Tham số:** `notFoundError(message = "Không tìm thấy dữ liệu")`.

**Công việc:** Tạo lỗi không tìm thấy hoặc không cho thấy hồ sơ.

**Xử lý theo thứ tự:**

1. Tạo ApiError mãHTTP 404 và code nghiệp vụ đúng trong code.
2. Gắn message và chi tiết mà hàm hỗ trợ; không tự đọc/gửi HTTP hoặc sửa hồ sơ.

**Ai gọi / gọi tiếp:** Được gọi bởi [getProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-24), [updateProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-26), [changeProductStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-27), [createConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-28), [listConversions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-29), [listPolicies()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-31), [findLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-55), [findSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-89), [ownedDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-126), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142), [source()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-183), [master()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-184), [amendPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-190), [getPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-212), [changeDestinations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-229), [receivingOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-231), [scoped()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-237), [scopedPurchaseRead()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-238), [parent()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-264), [uploadEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-267), [attachEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-268), [downloadEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-271), [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [taskState()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-279), [receivingHistory()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-292). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Service phát hiện không tìm thấy hoặc không cho thấy hồ sơ rồi ném lỗi; middleware trả lỗi cho bên gọi.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
notFoundError = (message = "Không tìm thấy dữ liệu") =>
  new ApiError(404, message, { code: ERROR_CODES.NOT_FOUND })
```

</details>

<a id="fn-326"></a>

## forbiddenError()

**Code:** [ApiError.js:34](D:/Ky_9/SEP490/src/be/src/shared/utils/ApiError.js:34).

**Tham số:** `forbiddenError(message = "Bạn không có quyền thực hiện hành động này")`.

**Công việc:** Tạo lỗi không có quyền thao tác.

**Xử lý theo thứ tự:**

1. Tạo ApiError mãHTTP 403 và code nghiệp vụ đúng trong code.
2. Gắn message và chi tiết mà hàm hỗ trợ; không tự đọc/gửi HTTP hoặc sửa hồ sơ.

**Ai gọi / gọi tiếp:** Được gọi bởi [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295), [checkPermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-336). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Service phát hiện không có quyền thao tác rồi ném lỗi; middleware trả lỗi cho bên gọi.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
forbiddenError = (message = "Bạn không có quyền thực hiện hành động này") =>
  new ApiError(403, message, { code: ERROR_CODES.FORBIDDEN })
```

</details>

<a id="fn-327"></a>

## scopeError()

**Code:** [ApiError.js:36](D:/Ky_9/SEP490/src/be/src/shared/utils/ApiError.js:36).

**Tham số:** `scopeError(message = "Bạn không được phân công kho này")`.

**Công việc:** Tạo lỗi ngoài phạm vi kho.

**Xử lý theo thứ tự:**

1. Tạo ApiError mãHTTP 403 và code nghiệp vụ đúng trong code.
2. Gắn message và chi tiết mà hàm hỗ trợ; không tự đọc/gửi HTTP hoặc sửa hồ sơ.

**Ai gọi / gọi tiếp:** Được gọi bởi [listLots()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-58), [usableWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-125), [ownedDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-126), [replayCreated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-135), [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [scopedWarehouseFilter()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-200), [getPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-212), [warehouseFilter()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-287), [requireWarehouseAccess()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-299). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Service phát hiện ngoài phạm vi kho rồi ném lỗi; middleware trả lỗi cho bên gọi.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
scopeError = (message = "Bạn không được phân công kho này") =>
  new ApiError(403, message, { code: ERROR_CODES.WAREHOUSE_SCOPE })
```

</details>

<a id="fn-328"></a>

## versionConflict()

**Code:** [ApiError.js:38](D:/Ky_9/SEP490/src/be/src/shared/utils/ApiError.js:38).

**Tham số:** `versionConflict(message, currentVersion, code = ERROR_CODES.VERSION_CONFLICT)`.

**Công việc:** Tạo lỗi phiên bản đã thay đổi.

**Xử lý theo thứ tự:**

1. Tạo ApiError mãHTTP 409 và code nghiệp vụ đúng trong code.
2. Gắn message và chi tiết mà hàm hỗ trợ; không tự đọc/gửi HTTP hoặc sửa hồ sơ.

**Ai gọi / gọi tiếp:** Được gọi bởi [updateProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-26), [changeProductStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-27), [createConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-28), [configurePolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-30), [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61), [updateSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-93), [changeSupplierStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-94), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142), [version()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-235). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Service phát hiện phiên bản đã thay đổi rồi ném lỗi; middleware trả lỗi cho bên gọi.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
versionConflict = (message, currentVersion, code = ERROR_CODES.VERSION_CONFLICT) =>
  new ApiError(409, message, {
    code,
    details: currentVersion == null ? null : { currentVersion },
  })
```

</details>

<a id="fn-329"></a>

## duplicateError()

**Code:** [ApiError.js:43](D:/Ky_9/SEP490/src/be/src/shared/utils/ApiError.js:43).

**Tham số:** `duplicateError(message = "Dữ liệu đã tồn tại")`.

**Công việc:** Tạo lỗi dữ liệu trùng.

**Xử lý theo thứ tự:**

1. Tạo ApiError mãHTTP 409 và code nghiệp vụ đúng trong code.
2. Gắn message và chi tiết mà hàm hỗ trợ; không tự đọc/gửi HTTP hoặc sửa hồ sơ.

**Ai gọi / gọi tiếp:** Được gọi bởi [createProduct()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-25), [createLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-60), [updateLot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-61), [createSupplier()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-92). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Service phát hiện dữ liệu trùng rồi ném lỗi; middleware trả lỗi cho bên gọi.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
duplicateError = (message = "Dữ liệu đã tồn tại") =>
  new ApiError(409, message, { code: ERROR_CODES.DUPLICATE })
```

</details>

<a id="fn-330"></a>

## operationConflict()

**Code:** [ApiError.js:45](D:/Ky_9/SEP490/src/be/src/shared/utils/ApiError.js:45).

**Tham số:** `operationConflict(message = "Operation key đã được dùng với nội dung khác")`.

**Công việc:** Tạo lỗi key đã dùng với nội dung khác.

**Xử lý theo thứ tự:**

1. Tạo ApiError mãHTTP 409 và code nghiệp vụ đúng trong code.
2. Gắn message và chi tiết mà hàm hỗ trợ; không tự đọc/gửi HTTP hoặc sửa hồ sơ.

**Ai gọi / gọi tiếp:** Được gọi bởi [assertReplay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-124), [replayCreated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-135), [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [command()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-248), [command.replay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-249). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Service phát hiện key đã dùng với nội dung khác rồi ném lỗi; middleware trả lỗi cho bên gọi.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
operationConflict = (message = "Operation key đã được dùng với nội dung khác") =>
  new ApiError(409, message, { code: ERROR_CODES.OPERATION_CONFLICT })
```

</details>

<a id="fn-331"></a>

## formatApiResponse()

**Code:** [ApiResponse.js:1](D:/Ky_9/SEP490/src/be/src/shared/utils/ApiResponse.js:1).

**Tham số:** `formatApiResponse(res, { statusCode = 200, message = 'Success', data = null, meta = null } = {})`.

**Công việc:** Gửi kết quả thành công theo cấu trúc API chung.

**Xử lý theo thứ tự:**

1. Dùng statusCode mặc định 200 và message mặc địnhSuccess.
2. Trả success=true, thêm data/meta nếu khôngnull.

**Ai gọi / gọi tiếp:** Được gọi bởi [list()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-0), [options()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-1), [detail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-2), [create()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-3), [update()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-4), [changeStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-5), [conversions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-6), [createConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-7), [policies()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-8), [configurePolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-9), [list()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-38), [detail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-39), [create()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-40), [update()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-41), [movements()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-42), [list()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-69), [detail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-70), [create()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-71), [update()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-72), [changeStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-73), [history()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-74), [documents()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-75), [getNames()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-76), [listReplenishments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-145), [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-146), [options()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-147), [create()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-148), [update()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-149), [submit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-150), [review()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-151), [submissions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-152), [submission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-153), [list()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-197), [get()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-198), [handle()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-218). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** POST tạo master có thể chọn 201, danh sách thường 200; không tự ghi dữ liệu.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function formatApiResponse(res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
  });
}
```

</details>

<a id="fn-332"></a>

## catchAsync()

**Code:** [catchAsync.js:1](D:/Ky_9/SEP490/src/be/src/shared/utils/catchAsync.js:1).

**Tham số:** `catchAsync(fn)`.

**Công việc:** Chuyển lỗi của hàm xử lý bất đồng bộ sang bộ trả lỗi Express.

**Xử lý theo thứ tự:**

1. Trả hàm nhận req/res/next.
2. Promise.resolve(fn(...)).catch(next).

**Ai gọi / gọi tiếp:** Được gọi bởi [handle()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-218). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Service ném lỗi 409 thì controller không phải viết try/catch giống nhau ở mọi route.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}
```

</details>

<a id="fn-333"></a>

## unauthenticated()

**Code:** [auth.js:6](D:/Ky_9/SEP490/src/be/src/middlewares/auth.js:6).

**Tham số:** `unauthenticated(message)`.

**Công việc:** Tạo lỗi chưa xác thực hoặc phiên không hợp lệ.

**Xử lý theo thứ tự:**

1. Tạo ApiError mãHTTP 401 và code nghiệp vụ đúng trong code.
2. Gắn message và chi tiết mà hàm hỗ trợ; không tự đọc/gửi HTTP hoặc sửa hồ sơ.

**Ai gọi / gọi tiếp:** Được gọi bởi [authenticate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-334), [authorize()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-335). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Service phát hiện chưa xác thực hoặc phiên không hợp lệ rồi ném lỗi; middleware trả lỗi cho bên gọi.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
unauthenticated = (message) =>
  new ApiError(401, message, { code: ERROR_CODES.UNAUTHENTICATED })
```

</details>

<a id="fn-334"></a>

## authenticate()

**Code:** [auth.js:12](D:/Ky_9/SEP490/src/be/src/middlewares/auth.js:12).

**Tham số:** `authenticate(req, _res, next)`.

**Công việc:** Đọc tài khoản/vai trò/quyền hiện hành từ database sau kiểm token.

**Xử lý theo thứ tự:**

1. Lấy Bearer hoặc cookieclaim_access_token; thiếu thì 401.
2. Xác minh JWT bằng secret cấu hình.
3. User.findById(decoded.userId).populate roleId rồi permissionIds.
4. Cầnuser active và currentRole hợp lệ; gắn req.user, gọi next; lỗi phiên trả 401.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Gọi tiếp [unauthenticated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-333), [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `User`, tại [dòng 29](D:/Ky_9/SEP490/src/be/src/middlewares/auth.js:29). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
User.findById(decoded.userId).populate({
      path: "roleId",
      populate: { path: "permissionIds" },
    })
```

**Ví dụ:** Vừa thu hồi quyền trongRole thì request tiếp theo tải lại dữ liệu, không chỉ tin danh sách quyền cũ củafrontend.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
authenticate = async (req, _res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.claim_access_token) {
      token = req.cookies.claim_access_token;
    }

    if (!token) {
      return next(
        unauthenticated("Yêu cầu đăng nhập để truy cập tài nguyên này"),
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).populate({
      path: "roleId",
      populate: { path: "permissionIds" },
    });
    if (!user || !user.isActive || !currentRole(user)) {
      return next(
        unauthenticated("Tài khoản không hợp lệ hoặc đã bị vô hiệu hóa"),
      );
    }

    req.user = user;
    next();
  } catch (_err) {
    next(unauthenticated("Phiên đăng nhập không hợp lệ hoặc đã hết hạn"));
  }
}
```

</details>

<a id="fn-335"></a>

## authorize()

**Code:** [auth.js:46](D:/Ky_9/SEP490/src/be/src/middlewares/auth.js:46).

**Tham số:** `authorize(allowedRoles = [])`.

**Công việc:** Tạo middleware kiểm role hiện tại trong nhóm được phép.

**Xử lý theo thứ tự:**

1. Nhận allowedRoles rồi trả hàm request.
2. Cần req.user; so currentRole.code với danh sách viết hoa.
3. Không có role đúng thì 403, đạt next.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Gọi tiếp [unauthenticated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-333), [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Route choACCOUNTANT không mở choOWNER nếu danh sách không cóOWNER.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
authorize =
  (allowedRoles = []) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(unauthenticated("Chưa xác thực"));
    }

    const assigned = currentRole(req.user);
    const hasRole = assigned && allowedRoles.some((role) => assigned.code === role.toUpperCase());

    if (!hasRole) {
      return next(
        new ApiError(403, "Bạn không có quyền thực hiện hành động này", {
          code: ERROR_CODES.FORBIDDEN,
        }),
      );
    }

    next();
  }
```

</details>

<a id="fn-336"></a>

## checkPermission()

**Code:** [permission.js:4](D:/Ky_9/SEP490/src/be/src/middlewares/permission.js:4).

**Tham số:** `checkPermission(requiredPermission, requiredRoles = [])`.

**Công việc:** Tạo middleware kiểm cả role và operation permission.

**Xử lý theo thứ tự:**

1. Nhận requiredPermission/requiredRoles.
2. Tại request dùng currentRole và rolePermissions củareq.user.
3. Sai role hoặc thiếu permission thì 403; đúng thì next.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Gọi tiếp [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320), [rolePermissions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-321), [forbiddenError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-326).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Tài khoản córole đúng nhưng permission bịgỡ vẫn không điđược.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
checkPermission =
  (requiredPermission, requiredRoles = []) =>
  (req, _res, next) => {
    const role = currentRole(req.user);
    if (
      !role ||
      (requiredRoles.length &&
        !requiredRoles.some((code) => code.toUpperCase() === role.code)) ||
      !rolePermissions(req.user).includes(requiredPermission)
    ) {
      return next(forbiddenError());
    }
    next();
  }
```

</details>

<a id="fn-337"></a>

## validate()

**Code:** [validate.js:3](D:/Ky_9/SEP490/src/be/src/middlewares/validate.js:3).

**Tham số:** `validate(schema)`.

**Công việc:** Chặn request sai cấu trúc trước khi gọi service.

**Xử lý theo thứ tự:**

1. Nhận Zod schema; parse body/query/params.
2. Lưu kết quảchuẩn hóa trong req.validated; cập nhật body/params, không dựa vào việc gánreq.query củaExpress 5.
3. LỗiZod đổi thành fieldErrors vàvalidationError, chuyển next.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Gọi tiếp [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** page làchuỗi 20 được parser thànhsố 20; controller đọc req.validated đểkhông mấtgiá trị mặc định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
validate = (schema) => (req, _res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body ?? {},
      query: req.query,
      params: req.params,
    });
    // Express 5 req.query is a getter. Preserve parsed defaults/transforms for
    // controllers instead of relying on mutations of its temporary value.
    req.validated = parsed;
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) Object.assign(req.query, parsed.query);
    if (parsed.params) Object.assign(req.params, parsed.params);
    next();
  } catch (error) {
    if (!error.issues) {
      return next(validationError(error.message || "Dữ liệu không hợp lệ"));
    }
    const fieldErrors = error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    const summary = fieldErrors
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join(", ");
    next(validationError(summary, fieldErrors));
  }
}
```

</details>

<a id="fn-338"></a>

## netMovedQuantity()

**Code:** [location-movement.service.js:52](D:/Ky_9/SEP490/src/be/src/modules/location-movements/location-movement.service.js:52).

**Tham số:** `netMovedQuantity(movements, batches)`.

**Công việc:** Cộng lượng đã thực hiện của nhiệm vụ từ movement và batch.

**Xử lý theo thứ tự:**

1. Lập Map batch; với mỗi movement lấy batch tương ứng.
2. Dùng helper sign xác định chiều theo chuỗi đảo; thiếu batch củamovement thì bỏ trong phép cộng hiện tại.
3. Cộng qty×dấu bằng ExactDecimal.

**Ai gọi / gọi tiếp:** Được gọi bởi [taskState()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-279), [pendingTaskQuantity()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-340). Gọi tiếp [netMovedQuantity.sign()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-339).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Chuyển 20 rồi đảo 20 có ròng 0; một movement có hai đầu không bị cộng thành 40.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function netMovedQuantity(movements, batches) {
  const byId = new Map(batches.map((batch) => [id(batch), batch]));
  const sign = (batch) => {
    let direction = 1;
    const seen = new Set();
    while (batch?.reversalOf) {
      if (seen.has(id(batch))) conflict('Lịch sử đảo giao dịch không hợp lệ');
      seen.add(id(batch));
      direction *= -1;
      batch = byId.get(id(batch.reversalOf));
      if (!batch) conflict('Thiếu giao dịch gốc của bút toán đảo');
    }
    return direction;
  };
  return movements.reduce((total, movement) => {
    const batch = byId.get(id(movement.batchId));
    if (!batch) return total;
    return total.plus(exact(movement.qtyBase).mul(sign(batch)));
  }, exact('0'));
}
```

</details>

<a id="fn-339"></a>

## netMovedQuantity.sign()

**Code:** [location-movement.service.js:54](D:/Ky_9/SEP490/src/be/src/modules/location-movements/location-movement.service.js:54).

**Tham số:** `netMovedQuantity.sign(batch)`.

**Công việc:** Tính chiều cho lịch sử chuyển vị trí có đảo.

**Xử lý theo thứ tự:**

1. Theo reversalOf, mỗi bước đổi dấu.
2. Phát hiện vòng hoặc thiếu batch gốc thì lỗi 409.

**Ai gọi / gọi tiếp:** Được gọi bởi [netMovedQuantity()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-338). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Một lần đảo làm lượng đã cất ròng giảm, không tăng thêm.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
sign = (batch) => {
    let direction = 1;
    const seen = new Set();
    while (batch?.reversalOf) {
      if (seen.has(id(batch))) conflict('Lịch sử đảo giao dịch không hợp lệ');
      seen.add(id(batch));
      direction *= -1;
      batch = byId.get(id(batch.reversalOf));
      if (!batch) conflict('Thiếu giao dịch gốc của bút toán đảo');
    }
    return direction;
  }
```

</details>

<a id="fn-340"></a>

## pendingTaskQuantity()

**Code:** [location-movement.service.js:73](D:/Ky_9/SEP490/src/be/src/modules/location-movements/location-movement.service.js:73).

**Tham số:** `pendingTaskQuantity(balance, sourceLocationId, session, excludeDocumentId = null)`.

**Công việc:** Cộng phần kế hoạch chưa thực hiện đang giữ cùng nguồn.

**Xử lý theo thứ tự:**

1. Đọc WAREHOUSE_TASK line cùnglot/fromLocation/quality và cácTO DRAFT/OPEN/PARTIAL.
2. Bỏ task hiện tại nếu excludeDocumentId và bỏ owner khác biết rõ.
3. Với mỗi dòng còn mở, đọc movement/batch, lấy planned−netMovedQuantity.
4. Cộng phầncòn dương.

**Ai gọi / gọi tiếp:** Được gọi bởi [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278), [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281). Gọi tiếp [netMovedQuantity()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-338).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `DocumentLine`, tại [dòng 74](D:/Ky_9/SEP490/src/be/src/modules/location-movements/location-movement.service.js:74). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.find({
    lineKind: 'WAREHOUSE_TASK', lotId: balance.lotId,
    'details.fromLocationId': sourceLocationId, 'details.qualityCode': balance.qualityCode,
  })
```

- Đọc nhiều bản ghi qua `BusinessDocument`, tại [dòng 78](D:/Ky_9/SEP490/src/be/src/modules/location-movements/location-movement.service.js:78). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.find({
    _id: { $in: lines.map((line) => line.documentId) }, documentKind: 'TO',
    workflowStatus: { $in: ['DRAFT', 'OPEN', 'PARTIAL'] },
  })
```

- Đọc nhiều bản ghi qua `StockMovement`, tại [dòng 89](D:/Ky_9/SEP490/src/be/src/modules/location-movements/location-movement.service.js:89). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
StockMovement.find({ documentId: line.documentId, lineId: line._id })
```

- Đọc nhiều bản ghi qua `PostingBatch`, tại [dòng 90](D:/Ky_9/SEP490/src/be/src/modules/location-movements/location-movement.service.js:90). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
PostingBatch.find({ _id: { $in: movements.map((m) => m.batchId) }, documentId: line.documentId })
```

**Kết quả / nhánh bị chặn:** Có đọc history theo từng dòng; không phải chỉ tính từ ReceiptPlacement.

**Ví dụ:** Balance 70, taskkhác giữ 50, muốn lập thêm 30 bị chặn vì tổng 80>70.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function pendingTaskQuantity(balance, sourceLocationId, session, excludeDocumentId = null) {
  const lines = await read(DocumentLine.find({
    lineKind: 'WAREHOUSE_TASK', lotId: balance.lotId,
    'details.fromLocationId': sourceLocationId, 'details.qualityCode': balance.qualityCode,
  }), session);
  const docs = await read(BusinessDocument.find({
    _id: { $in: lines.map((line) => line.documentId) }, documentKind: 'TO',
    workflowStatus: { $in: ['DRAFT', 'OPEN', 'PARTIAL'] },
  }), session);
  const openIds = new Set(docs.map(id));
  let pending = exact('0');
  for (const line of lines) {
    if (!openIds.has(id(line.documentId))) continue;
    if (excludeDocumentId && same(line.documentId, excludeDocumentId)) continue;
    if (line.details.ownerPartyId && !same(line.details.ownerPartyId, balance.ownerPartyId)) continue;
    // Legacy tasks without owner/source cannot safely be attributed to another owner.
    const movements = await read(StockMovement.find({ documentId: line.documentId, lineId: line._id }), session);
    const batches = await read(PostingBatch.find({ _id: { $in: movements.map((m) => m.batchId) }, documentId: line.documentId }), session);
    const remaining = exact(line.qtyBase).minus(netMovedQuantity(movements, batches));
    if (remaining.gt(0)) pending = pending.plus(remaining);
  }
  return pending;
}
```

</details>

<a id="fn-341"></a>

## carryReservations()

**Code:** [location-movement.lifecycle.js:116](D:/Ky_9/SEP490/src/be/src/modules/location-movements/location-movement.lifecycle.js:116).

**Tham số:** `carryReservations(source, destination, sourceBefore, moved, session)`.

**Công việc:** Chuyển phần giữ cho nhu cầu khác theo lượng hàng thực di chuyển.

**Xử lý theo thứ tự:**

1. Đọc Reservation ACTIVE nguồn và cộngreserved; vượt sourceBefore thìlỗi.
2. toCarry=moved−(sourceBefore−reserved); nếu<=0 thìđang chuyển toàn hàngchưa giữ, không sửareservation.
3. Lần lượt đổi balanceId nếu mangtoàn reservation, hoặcgiảmnguồn và thêmreservation đích cùng demand/execution nếu mangmột phần.
4. Khôngmangđủ thìlỗi, rollbackcùnggiao dịch.

**Ai gọi / gọi tiếp:** Được gọi bởi [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281). Không gọi hàm khác trong danh mục này.

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `Reservation`, tại [dòng 117](D:/Ky_9/SEP490/src/be/src/modules/location-movements/location-movement.lifecycle.js:117). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Reservation.find({ balanceId: source._id, status: 'ACTIVE' }).sort({ _id: 1 })
```

- Cập nhật một bản ghi qua `Reservation`, tại [dòng 127](D:/Ky_9/SEP490/src/be/src/modules/location-movements/location-movement.lifecycle.js:127). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Reservation.updateOne({ _id: reservation._id, balanceId: source._id, status: 'ACTIVE' },
        { $set: { balanceId: destination._id } }, { session })
```

- Cập nhật một bản ghi qua `Reservation`, tại [dòng 130](D:/Ky_9/SEP490/src/be/src/modules/location-movements/location-movement.lifecycle.js:130). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Reservation.updateOne({ _id: reservation._id, balanceId: source._id, status: 'ACTIVE' },
        { $set: { qtyBase: quantity.minus(part).toFixed() } }, { session })
```

- Ghi đối tượng model đã tạo qua `Reservation`, tại [dòng 132](D:/Ky_9/SEP490/src/be/src/modules/location-movements/location-movement.lifecycle.js:132). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
new Reservation({ demandLineId: reservation.demandLineId, executionLineId: reservation.executionLineId,
        balanceId: destination._id, qtyBase: part.toFixed(), status: 'ACTIVE' }).save({ session })
```

**Ví dụ:** Nguồn 70 giữ 20, cất 60:50 là tự do, chỉ 10 reservation cần đi theo; khônggiải phóng 20 thành hàngtự do.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function carryReservations(source, destination, sourceBefore, moved, session) {
  const reservations = await read(Reservation.find({ balanceId: source._id, status: 'ACTIVE' }).sort({ _id: 1 }), session);
  const reserved = reservations.reduce((total, item) => total.plus(exact(item.qtyBase)), exact('0'));
  if (reserved.gt(sourceBefore)) conflict('Lượng giữ hàng vượt tồn nguồn');
  let toCarry = exact(moved).minus(sourceBefore.minus(reserved));
  if (toCarry.lte(0)) return;
  for (const reservation of reservations) {
    if (toCarry.lte(0)) break;
    const quantity = exact(reservation.qtyBase);
    const part = quantity.lt(toCarry) ? quantity : toCarry;
    if (part.eq(quantity)) {
      await Reservation.updateOne({ _id: reservation._id, balanceId: source._id, status: 'ACTIVE' },
        { $set: { balanceId: destination._id } }, { session });
    } else {
      await Reservation.updateOne({ _id: reservation._id, balanceId: source._id, status: 'ACTIVE' },
        { $set: { qtyBase: quantity.minus(part).toFixed() } }, { session });
      await new Reservation({ demandLineId: reservation.demandLineId, executionLineId: reservation.executionLineId,
        balanceId: destination._id, qtyBase: part.toFixed(), status: 'ACTIVE' }).save({ session });
    }
    toCarry = toCarry.minus(part);
  }
  if (toCarry.gt(0)) conflict('Không thể chuyển đủ lượng giữ hàng');
}
```

</details>

