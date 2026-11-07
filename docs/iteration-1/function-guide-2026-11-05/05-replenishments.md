---
id: DOC-CODE-IT1-REPLENISHMENTS-20261105
title: "Yêu cầu bổ sung — giải thích từng hàm"
version: 1.0.0
phase: Review
domain: Iteration1
tags: [backend, function, database]
last_updated: 2026-11-05
---

# Yêu cầu bổ sung — giải thích từng hàm

[Quay lại hướng dẫn đọc](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/README.md). Bản source ngày 05/11/2026; các đoạn lệnh dưới đây được lấy trực tiếp từ file hiện tại.

## Tìm nhanh

- [replenishment.access.js → idString()](#fn-101)
- [replenishment.access.js → objectId()](#fn-102)
- [replenishment.access.js → sameId()](#fn-103)
- [replenishment.access.js → canAccessWarehouse()](#fn-104)
- [replenishment.access.js → replenishmentScope()](#fn-105)
- [replenishment.access.js → canReadRelated()](#fn-106)
- [replenishment.access.js → canReadRelated.inScope()](#fn-107)
- [replenishment.availability.js → sumAvailableBalances()](#fn-108)
- [replenishment.availability.js → getCurrentAvailability()](#fn-109)
- [replenishment.commands.js → requireCreator()](#fn-110)
- [replenishment.commands.js → requireUpdater()](#fn-111)
- [replenishment.commands.js → requireApprover()](#fn-112)
- [replenishment.commands.js → requireReader()](#fn-113)
- [replenishment.commands.js → withSession()](#fn-114)
- [replenishment.commands.js → stateError()](#fn-115)
- [replenishment.commands.js → selfApprovalError()](#fn-116)
- [replenishment.commands.js → conversionChangedError()](#fn-117)
- [replenishment.commands.js → manualSourceError()](#fn-118)
- [replenishment.commands.js → reviewQuantityError()](#fn-119)
- [replenishment.commands.js → operationKeyHash()](#fn-120)
- [replenishment.commands.js → creationOperationKey()](#fn-121)
- [replenishment.commands.js → commandResult()](#fn-122)
- [replenishment.commands.js → findOperation()](#fn-123)
- [replenishment.commands.js → assertReplay()](#fn-124)
- [replenishment.commands.js → usableWarehouse()](#fn-125)
- [replenishment.commands.js → ownedDocument()](#fn-126)
- [replenishment.commands.js → prepareLines()](#fn-127)
- [replenishment.commands.js → lineDocument()](#fn-128)
- [replenishment.commands.js → writeSubmission()](#fn-129)
- [replenishment.commands.js → canonicalLines()](#fn-130)
- [replenishment.commands.js → creationPayload()](#fn-131)
- [replenishment.commands.js → updatePayload()](#fn-132)
- [replenishment.commands.js → submitPayload()](#fn-133)
- [replenishment.commands.js → reviewPayload()](#fn-134)
- [replenishment.commands.js → replayCreated()](#fn-135)
- [replenishment.commands.js → replayCommand()](#fn-136)
- [replenishment.commands.js → isUnknownCommit()](#fn-137)
- [replenishment.commands.js → createReplenishment()](#fn-138)
- [replenishment.commands.js → updateReplenishment()](#fn-139)
- [replenishment.commands.js → submitReplenishment()](#fn-140)
- [replenishment.commands.js → appendApproval()](#fn-141)
- [replenishment.commands.js → reviewReplenishment()](#fn-142)
- [replenishment.commands.js → getReplenishmentOptions()](#fn-143)
- [replenishment.commands.js → mapWarehouse()](#fn-144)
- [replenishment.controller.js → listReplenishments()](#fn-145)
- [replenishment.controller.js → getReplenishment()](#fn-146)
- [replenishment.controller.js → options()](#fn-147)
- [replenishment.controller.js → create()](#fn-148)
- [replenishment.controller.js → update()](#fn-149)
- [replenishment.controller.js → submit()](#fn-150)
- [replenishment.controller.js → review()](#fn-151)
- [replenishment.controller.js → submissions()](#fn-152)
- [replenishment.controller.js → submission()](#fn-153)
- [replenishment.mapper.js → decimalString()](#fn-154)
- [replenishment.mapper.js → isoDate()](#fn-155)
- [replenishment.mapper.js → indexById()](#fn-156)
- [replenishment.mapper.js → mapUser()](#fn-157)
- [replenishment.mapper.js → mapUom()](#fn-158)
- [replenishment.mapper.js → mapHeader()](#fn-159)
- [replenishment.mapper.js → mapApproval()](#fn-160)
- [replenishment.mapper.js → mapLine()](#fn-161)
- [replenishment.mapper.js → mapSavedSource()](#fn-162)
- [replenishment.mapper.js → mapEvaluationSnapshot()](#fn-163)
- [replenishment.mapper.js → mapRelatedReference()](#fn-164)
- [replenishment.service.js → distinctIds()](#fn-165)
- [replenishment.service.js → escapeRegex()](#fn-166)
- [replenishment.service.js → latestApprovalLookup()](#fn-167)
- [replenishment.service.js → buildListPipeline()](#fn-168)
- [replenishment.service.js → loadMasters()](#fn-169)
- [replenishment.service.js → listReplenishments()](#fn-170)
- [replenishment.service.js → loadRelations()](#fn-171)
- [replenishment.service.js → sourceReferences()](#fn-172)
- [replenishment.service.js → mapRelations()](#fn-173)
- [replenishment.service.js → mapRelations.canonicalId()](#fn-174)
- [replenishment.service.js → getReplenishment()](#fn-175)
- [replenishment.service.js → scopedReplenishmentDocument()](#fn-176)
- [replenishment.service.js → mapSubmissionSummary()](#fn-177)
- [replenishment.service.js → listReplenishmentSubmissions()](#fn-178)
- [replenishment.service.js → getReplenishmentSubmission()](#fn-179)
- [replenishment.validation.js → positiveInteger()](#fn-180)
- [replenishment.validation.js → creationDateRange()](#fn-181)

<a id="fn-101"></a>

## idString()

**Code:** [replenishment.access.js:7](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.access.js:7).

**Tham số:** `idString(value)`.

**Công việc:** Chuẩn hóa mã tham chiếu thành chuỗi.

**Xử lý theo thứ tự:**

1. Chấp nhận ObjectId, đối tượng có _id hoặc chuỗi.
2. Không có thì trả null; chuỗi 24 ký tự hex được viết thường theo code.
3. Không kiểm bản ghi đó tồn tại.

**Ai gọi / gọi tiếp:** Được gọi bởi [objectId()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-102), [sameId()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-103), [sumAvailableBalances()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-108), [getCurrentAvailability()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-109), [indexById()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-156), [mapUser()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-157), [mapUom()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-158), [mapHeader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-159), [mapApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-160), [mapLine()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-161), [mapSavedSource()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-162), [mapRelatedReference()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-164), [loadRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-171), [sourceReferences()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-172), [mapRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-173), [mapRelations.canonicalId()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-174), [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175), [mapSubmissionSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-177), [listReplenishmentSubmissions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-178), [getReplenishmentSubmission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-179). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Hai ObjectId cùng nội dung được so dưới dạng chuỗi; biết mã không có nghĩa có quyền đọc hồ sơ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
idString = (value) => {
  if (value == null) return null;
  const text = String(value._id ?? value);
  return /^[a-f\d]{24}$/i.test(text) ? text.toLowerCase() : text;
}
```

</details>

<a id="fn-102"></a>

## objectId()

**Code:** [replenishment.access.js:12](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.access.js:12).

**Tham số:** `objectId(value)`.

**Công việc:** Đổi chuỗi mã sang ObjectId cho điều kiện MongoDB.

**Xử lý theo thứ tự:**

1. Chuẩn hóa bằng idString.
2. Tạo mongoose.Types.ObjectId và trả ra.

**Ai gọi / gọi tiếp:** Được gọi bởi [replenishmentScope()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-105), [buildListPipeline()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-168), [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175), [scopedReplenishmentDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-176). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Bộ lọc tổng hợp cần ObjectId cho warehouseId, thay vì chuỗi từ URL.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
objectId = (value) => new mongoose.Types.ObjectId(idString(value))
```

</details>

<a id="fn-103"></a>

## sameId()

**Code:** [replenishment.access.js:13](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.access.js:13).

**Tham số:** `sameId(left, right)`.

**Công việc:** So hai mã tham chiếu sau khi đổi về chuỗi.

**Xử lý theo thứ tự:**

1. Chuẩn hóa hai phía.
2. So bằng nhau; bản sameId ở module yêu cầu còn kiểm hai phía không null.

**Ai gọi / gọi tiếp:** Được gọi bởi [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-104), [canReadRelated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-106), [loadRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-171), [sourceReferences()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-172), [mapRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-173). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Mã lô lấy từ JSON và mã ObjectId trong database vẫn so đúng nếu cùng nội dung.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
sameId = (left, right) =>
  left != null && right != null && idString(left) === idString(right)
```

</details>

<a id="fn-104"></a>

## canAccessWarehouse()

**Code:** [replenishment.access.js:16](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.access.js:16).

**Tham số:** `canAccessWarehouse(user, warehouseId)`.

**Công việc:** Kiểm quyền kho trong nhóm đọc yêu cầu bổ sung.

**Xử lý theo thứ tự:**

1. Mã kho vắng thì false.
2. Chủ cửa hàng được mọi kho; vai trò khác phải có mã kho trong warehouseIds.

**Ai gọi / gọi tiếp:** Được gọi bởi [canReadRelated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-106), [canReadRelated.inScope()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-107), [buildListPipeline()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-168). Gọi tiếp [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320), [sameId()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-103).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Không truyền kho không được hiểu là được đọc toàn bộ tại helper này.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function canAccessWarehouse(user, warehouseId) {
  if (warehouseId == null) return false;
  return (
    currentRole(user)?.code === "OWNER" ||
    (user.warehouseIds || []).some((id) => sameId(id, warehouseId))
  );
}
```

</details>

<a id="fn-105"></a>

## replenishmentScope()

**Code:** [replenishment.access.js:25](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.access.js:25).

**Tham số:** `replenishmentScope(user)`.

**Công việc:** Dựng bộ lọc quyền trước khi tìm yêu cầu.

**Xử lý theo thứ tự:**

1. Kiểm có role hợp lệ trong 4 vai trò nghiệp vụ.
2. Luôn documentKind=REPLENISHMENT; không phải chủ thì thêm kho được giao.
3. Kho/bán hàng thêm createdBy=chính người dùng.

**Ai gọi / gọi tiếp:** Được gọi bởi [buildListPipeline()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-168), [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175), [scopedReplenishmentDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-176). Gọi tiếp [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320), [objectId()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-102).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Lan không đọc yêu cầu củaMinh chỉ vì cùng khoA.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function replenishmentScope(user) {
  const role = currentRole(user);
  if (!role || !BUSINESS_ROLES.includes(role.code))
    throw new ApiError(403, "Bạn không có quyền xem yêu cầu bổ sung hàng");
  const scope = { documentKind: "REPLENISHMENT" };
  if (role.code !== "OWNER")
    scope["header.warehouseId"] = {
      $in: (user.warehouseIds || []).map(objectId),
    };
  if (role.code === "SALES" || role.code === "WAREHOUSE")
    scope.createdBy = objectId(user._id);
  return scope;
}
```

</details>

<a id="fn-106"></a>

## canReadRelated()

**Code:** [replenishment.access.js:41](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.access.js:41).

**Tham số:** `canReadRelated(document, user)`.

**Công việc:** Quyết định có được hiện thông tin một chứng từ liên quan tới yêu cầu hay không.

**Xử lý theo thứ tự:**

1. Tra permission theo loại phiếu và role hiện tại.
2. Với SO, xét chủ/kế toán hoặc creator; WIR xét kho và trách nhiệm; PO/kiểm kê xét kho; điều chuyển xét một trong hai kho.
3. Loại không hỗ trợ hoặc thiếu quyền thì false.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapRelatedReference()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-164), [loadRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-171), [sourceReferences()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-172), [mapRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-173). Gọi tiếp [currentRole()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-320), [rolePermissions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-321), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-104), [sameId()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-103), [canReadRelated.inScope()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-107).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Biết RR có tham chiếu SO không tự cho người xem RR mở mọi thông tin SO.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function canReadRelated(document, user) {
  if (!document) return false;
  const permissions = {
    SALES_ORDER: "sales_order:read",
    ISSUE_REQUEST: "issue_request:read",
    PO: "purchase_order:read",
    STOCKTAKE: "stocktake:read",
    TRANSFER_REQUEST: "stock_transfer:read",
  };
  const role = currentRole(user);
  if (
    !role ||
    !rolePermissions(user).includes(permissions[document.documentKind])
  )
    return false;
  const header = document.header || {};
  const inScope = (warehouseId) => canAccessWarehouse(user, warehouseId);
  const broad = role.code === "OWNER" || role.code === "ACCOUNTANT";
  switch (document.documentKind) {
    case "SALES_ORDER":
      // SO has no warehouse header. Only return its metadata to its creator or
      // responsibility-scoped Owner/Accountant through the already-scoped RR.
      return broad || sameId(document.createdBy, user._id);
    case "ISSUE_REQUEST":
      return (
        inScope(header.requestedWarehouseId) &&
        (broad ||
          role.code === "WAREHOUSE" ||
          sameId(document.createdBy, user._id))
      );
    case "PO":
    case "STOCKTAKE":
      // rolePermissions already restricts each operation to its role catalogue.
      return inScope(header.warehouseId);
    case "TRANSFER_REQUEST":
      return (
        inScope(header.sourceWarehouseId) ||
        inScope(header.destinationWarehouseId)
      );
    default:
      return false;
  }
}
```

</details>

<a id="fn-107"></a>

## canReadRelated.inScope()

**Code:** [replenishment.access.js:57](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.access.js:57).

**Tham số:** `canReadRelated.inScope(warehouseId)`.

**Công việc:** Áp kiểm quyền kho cho từng nhánh loại chứng từ.

**Xử lý theo thứ tự:**

1. Chuyển warehouseId của chứng từ tới canAccessWarehouse cùng user đang xét.

**Ai gọi / gọi tiếp:** Được gọi bởi [canReadRelated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-106). Gọi tiếp [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-104).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Một WIR của khoB bị ẩn metadata khi nhân viên chỉ được giaoA.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
inScope = (warehouseId) => canAccessWarehouse(user, warehouseId)
```

</details>

<a id="fn-108"></a>

## sumAvailableBalances()

**Code:** [replenishment.availability.js:17](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.availability.js:17).

**Tham số:** `sumAvailableBalances(balances, reservations, heldBalanceIds = [], lockedAccountIds = [])`.

**Công việc:** Cộng lượng khả dụng từ các số dư đã chọn đủ điều kiện.

**Xử lý theo thứ tự:**

1. Gom reservation ACTIVE theo balance.
2. Bỏ mọi balance có hold hoặc account khóa.
3. Lấy qtyBase trừ reserved một lần; âm/không hợp lệ thì lỗi nhất quán dữ liệu.
4. Cộng theo productId và trả chuỗi.

**Ai gọi / gọi tiếp:** Được gọi bởi [getCurrentAvailability()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-109). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Tồn 100 giữ 20 còn 80; có hold trên cả balance thì balance đó không đóng góp vào khả dụng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function sumAvailableBalances(
  balances,
  reservations,
  heldBalanceIds = [],
  lockedAccountIds = [],
) {
  const held = new Set(heldBalanceIds.map(idString));
  const locked = new Set(lockedAccountIds.map(idString));
  const reserved = new Map();
  const totals = new Map();
  for (const reservation of reservations) {
    if (reservation.status !== "ACTIVE") continue;
    const key = idString(reservation.balanceId);
    reserved.set(
      key,
      (reserved.get(key) || exact("0")).plus(exact(reservation.qtyBase)),
    );
  }
  for (const balance of balances) {
    if (
      held.has(idString(balance._id)) ||
      locked.has(idString(balance.accountId))
    )
      continue;
    const free = exact(balance.qtyBase).minus(
      reserved.get(idString(balance._id)) || exact("0"),
    );
    if (!free.isFinite() || free.isNegative()) {
      throw new ApiError(
        500,
        "Dữ liệu tồn kho không nhất quán: lượng giữ hàng vượt tồn khả dụng",
      );
    }
    const productId = idString(balance.productId);
    totals.set(productId, (totals.get(productId) || exact("0")).plus(free));
  }
  return new Map([...totals].map(([key, value]) => [key, value.toFixed()]));
}
```

</details>

<a id="fn-109"></a>

## getCurrentAvailability()

**Code:** [replenishment.availability.js:58](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.availability.js:58).

**Tham số:** `getCurrentAvailability(warehouseId, productIds)`.

**Công việc:** Đọc điều kiện thực tế để tính khả dụng sản phẩm trong một kho.

**Xử lý theo thứ tự:**

1. Đọc kho active, sản phẩm active, STORE và STORAGE active/allocatable.
2. Đọc lô VERIFIED, tài khoản vật lý và khóa vị trí.
3. Đọc balance STORE/GOOD, reservation ACTIVE và hold ACTIVE.
4. Gắn sản phẩm qua lô rồi sumAvailableBalances, ghép các sản phẩm thiếu số dư thành 0.

**Ai gọi / gọi tiếp:** Được gọi bởi [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101), [sumAvailableBalances()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-108).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `Warehouse`, tại [dòng 63](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.availability.js:63). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.findOne({ _id: warehouseId, isActive: true })
      .select("_id")
      .lean()
```

- Đọc nhiều bản ghi qua `Product`, tại [dòng 66](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.availability.js:66). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.find({ _id: { $in: uniqueIds }, isActive: true })
      .select("_id")
      .lean()
```

- Đọc một bản ghi qua `Party`, tại [dòng 69](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.availability.js:69). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Party.findOne({ kind: "STORE" }).select("_id").lean()
```

- Đọc nhiều bản ghi qua `Location`, tại [dòng 70](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.availability.js:70). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Location.find({
      warehouseId,
      kind: "STORAGE",
      allocatable: true,
      isActive: true,
    })
      .select("_id")
      .lean()
```

- Đọc nhiều bản ghi qua `Lot`, tại [dòng 83](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.availability.js:83). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Lot.find({
      productId: { $in: products.map((item) => item._id) },
      identificationStatus: "VERIFIED",
    })
      .select("_id productId")
      .lean()
```

- Đọc nhiều bản ghi qua `StockAccount`, tại [dòng 89](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.availability.js:89). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
StockAccount.find({
      locationId: { $in: locations.map((item) => item._id) },
      transitDispatchLineId: null,
    })
      .select("_id locationId")
      .lean()
```

- Đọc nhiều bản ghi qua `LocationLock`, tại [dòng 95](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.availability.js:95). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
LocationLock.find({
      locationId: { $in: locations.map((item) => item._id) },
    })
      .select("locationId")
      .lean()
```

- Đọc nhiều bản ghi qua `StockBalance`, tại [dòng 101](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.availability.js:101). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
StockBalance.find({
    accountId: { $in: accounts.map((item) => item._id) },
    lotId: { $in: lots.map((item) => item._id) },
    ownerPartyId: owner._id,
    qualityCode: "GOOD",
  })
    .select("_id accountId lotId qtyBase")
    .lean()
```

- Đọc nhiều bản ghi qua `Reservation`, tại [dòng 111](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.availability.js:111). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Reservation.find({ balanceId: { $in: balanceIds }, status: "ACTIVE" })
      .select("balanceId qtyBase status")
      .lean()
```

- Đọc nhiều bản ghi qua `DefectHold`, tại [dòng 114](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.availability.js:114). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DefectHold.find({ balanceId: { $in: balanceIds }, status: "ACTIVE" })
      .select("balanceId")
      .lean()
```

**Kết quả / nhánh bị chặn:** quantities Map và computedAt; không giữ hàng cho nhu cầu khi xem.

**Ví dụ:** 70 viên mới nhập ở RECEIVING chưa vào lượng khả dụng dù đã thuộc cửa hàng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getCurrentAvailability(warehouseId, productIds) {
  const uniqueIds = [...new Set(productIds.map(idString))];
  const zero = new Map(uniqueIds.map((id) => [id, "0"]));
  if (!uniqueIds.length) return { quantities: zero, computedAt: new Date() };
  const [warehouse, products, owner, locations] = await Promise.all([
    Warehouse.findOne({ _id: warehouseId, isActive: true })
      .select("_id")
      .lean(),
    Product.find({ _id: { $in: uniqueIds }, isActive: true })
      .select("_id")
      .lean(),
    Party.findOne({ kind: "STORE" }).select("_id").lean(),
    Location.find({
      warehouseId,
      kind: "STORAGE",
      allocatable: true,
      isActive: true,
    })
      .select("_id")
      .lean(),
  ]);
  if (!warehouse || !owner || !products.length || !locations.length) {
    return { quantities: zero, computedAt: new Date() };
  }
  const [lots, accounts, locks] = await Promise.all([
    Lot.find({
      productId: { $in: products.map((item) => item._id) },
      identificationStatus: "VERIFIED",
    })
      .select("_id productId")
      .lean(),
    StockAccount.find({
      locationId: { $in: locations.map((item) => item._id) },
      transitDispatchLineId: null,
    })
      .select("_id locationId")
      .lean(),
    LocationLock.find({
      locationId: { $in: locations.map((item) => item._id) },
    })
      .select("locationId")
      .lean(),
  ]);
  const balances = await StockBalance.find({
    accountId: { $in: accounts.map((item) => item._id) },
    lotId: { $in: lots.map((item) => item._id) },
    ownerPartyId: owner._id,
    qualityCode: "GOOD",
  })
    .select("_id accountId lotId qtyBase")
    .lean();
  const balanceIds = balances.map((item) => item._id);
  const [reservations, holds] = await Promise.all([
    Reservation.find({ balanceId: { $in: balanceIds }, status: "ACTIVE" })
      .select("balanceId qtyBase status")
      .lean(),
    DefectHold.find({ balanceId: { $in: balanceIds }, status: "ACTIVE" })
      .select("balanceId")
      .lean(),
  ]);
  const lotProducts = new Map(
    lots.map((item) => [idString(item._id), item.productId]),
  );
  const lockedLocations = new Set(
    locks.map((item) => idString(item.locationId)),
  );
  const totals = sumAvailableBalances(
    balances.map((item) => ({
      ...item,
      productId: lotProducts.get(idString(item.lotId)),
    })),
    reservations,
    holds.map((item) => item.balanceId),
    accounts
      .filter((item) => lockedLocations.has(idString(item.locationId)))
      .map((item) => item._id),
  );
  return { quantities: new Map([...zero, ...totals]), computedAt: new Date() };
}
```

</details>

<a id="fn-110"></a>

## requireCreator()

**Code:** [replenishment.commands.js:51](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:51).

**Tham số:** `requireCreator(user)`.

**Công việc:** Yêu cầu đúng quyền tạo yêu cầu.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: kho/bán hàng.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền tạo yêu cầu chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
requireCreator = (user) =>
  requirePermission(user, "replenishment_request:create", [
    "WAREHOUSE",
    "SALES",
  ])
```

</details>

<a id="fn-111"></a>

## requireUpdater()

**Code:** [replenishment.commands.js:56](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:56).

**Tham số:** `requireUpdater(user)`.

**Công việc:** Yêu cầu đúng quyền sửa/gửi yêu cầu.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: kho/bán hàng.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền sửa/gửi yêu cầu chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
requireUpdater = (user) =>
  requirePermission(user, "replenishment_request:update", [
    "WAREHOUSE",
    "SALES",
  ])
```

</details>

<a id="fn-112"></a>

## requireApprover()

**Code:** [replenishment.commands.js:61](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:61).

**Tham số:** `requireApprover(user)`.

**Công việc:** Yêu cầu đúng quyền duyệt yêu cầu.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: chủ cửa hàng.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền duyệt yêu cầu chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
requireApprover = (user) =>
  requirePermission(user, "replenishment_request:approve", ["OWNER"])
```

</details>

<a id="fn-113"></a>

## requireReader()

**Code:** [replenishment.commands.js:63](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:63).

**Tham số:** `requireReader(user)`.

**Công việc:** Yêu cầu đúng quyền đọc yêu cầu.

**Xử lý theo thứ tự:**

1. Gọi requirePermission với tên quyền và các vai trò được phép: chủ cửa hàng/kế toán/kho/bán hàng.
2. Không tự tải lại User; dựa vào người dùng đã được authenticate lấy từ database.
3. Thiếu quyền thì ném lỗi 403, trước phần ghi dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [getReplenishmentOptions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-143). Gọi tiếp [requirePermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-295).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Không trả dữ liệu nghiệp vụ khi đạt; không có tác động database.

**Ví dụ:** Tài khoản quản trị không tự được quyền đọc yêu cầu chỉ vì quản trị được tài khoản.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
requireReader = (user) =>
  requirePermission(user, "replenishment_request:read", [
    "OWNER",
    "ACCOUNTANT",
    "WAREHOUSE",
    "SALES",
  ])
```

</details>

<a id="fn-114"></a>

## withSession()

**Code:** [replenishment.commands.js:71](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:71).

**Tham số:** `withSession(query, session)`.

**Công việc:** Gắn truy vấn đang có vào giao dịch nếu bên gọi truyền session.

**Xử lý theo thứ tự:**

1. Nhận đối tượng query chưa lấy kết quả.
2. Có session thì gọi query.session(session); không có thì giữ query.
3. Trả query để bên gọi await tiếp.

**Ai gọi / gọi tiếp:** Được gọi bởi [findOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-123), [usableWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-125), [ownedDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-126), [prepareLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-127), [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [appendApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-141), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142). Không gọi hàm khác trong danh mục này.

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

<a id="fn-115"></a>

## stateError()

**Code:** [replenishment.commands.js:75](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:75).

**Tham số:** `stateError(message)`.

**Công việc:** Trạng thái RR không cho phép thao tác.

**Xử lý theo thứ tự:**

1. Tạo ApiError với mã nghiệp vụ RR và status đúng như code; không truy vấn hoặc sửa dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [usableWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-125), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [appendApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-141), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Backend phát hiện điều kiện sai thì dừng giao dịch, giữ nguyên phiếu trước thao tác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function stateError(message) {
  return new ApiError(409, message, { code: ERROR_CODES.RR_STATE });
}
```

</details>

<a id="fn-116"></a>

## selfApprovalError()

**Code:** [replenishment.commands.js:79](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:79).

**Tham số:** `selfApprovalError()`.

**Công việc:** Người tạo/người gửi không tự duyệt.

**Xử lý theo thứ tự:**

1. Tạo ApiError với mã nghiệp vụ RR và status đúng như code; không truy vấn hoặc sửa dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [appendApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-141), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Backend phát hiện điều kiện sai thì dừng giao dịch, giữ nguyên phiếu trước thao tác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function selfApprovalError() {
  return new ApiError(403, "Người đề xuất không được tự duyệt yêu cầu", {
    code: ERROR_CODES.RR_SELF_APPROVAL,
  });
}
```

</details>

<a id="fn-117"></a>

## conversionChangedError()

**Code:** [replenishment.commands.js:85](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:85).

**Tham số:** `conversionChangedError()`.

**Công việc:** Quy đổi không còn hiện hành.

**Xử lý theo thứ tự:**

1. Tạo ApiError với mã nghiệp vụ RR và status đúng như code; không truy vấn hoặc sửa dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [prepareLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-127). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Backend phát hiện điều kiện sai thì dừng giao dịch, giữ nguyên phiếu trước thao tác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function conversionChangedError() {
  return new ApiError(
    409,
    "Quy đổi đã thay đổi, vui lòng chọn lại trước khi gửi",
    { code: ERROR_CODES.RR_CONVERSION_CHANGED },
  );
}
```

</details>

<a id="fn-118"></a>

## manualSourceError()

**Code:** [replenishment.commands.js:93](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:93).

**Tham số:** `manualSourceError()`.

**Công việc:** Nguồn của phiếu không thuộc luồng thủ công.

**Xử lý theo thứ tự:**

1. Tạo ApiError với mã nghiệp vụ RR và status đúng như code; không truy vấn hoặc sửa dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Backend phát hiện điều kiện sai thì dừng giao dịch, giữ nguyên phiếu trước thao tác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function manualSourceError() {
  return new ApiError(409, "Yêu cầu có nguồn không thuộc phạm vi thao tác thủ công", {
    code: ERROR_CODES.RR_SOURCE_READ_ONLY,
  });
}
```

</details>

<a id="fn-119"></a>

## reviewQuantityError()

**Code:** [replenishment.commands.js:99](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:99).

**Tham số:** `reviewQuantityError(message)`.

**Công việc:** Lượng duyệt không hợp lệ.

**Xử lý theo thứ tự:**

1. Tạo ApiError với mã nghiệp vụ RR và status đúng như code; không truy vấn hoặc sửa dữ liệu.

**Ai gọi / gọi tiếp:** Được gọi bởi [appendApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-141). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Backend phát hiện điều kiện sai thì dừng giao dịch, giữ nguyên phiếu trước thao tác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function reviewQuantityError(message) {
  return new ApiError(400, message, {
    code: ERROR_CODES.RR_REVIEW_QUANTITY,
  });
}
```

</details>

<a id="fn-120"></a>

## operationKeyHash()

**Code:** [replenishment.commands.js:105](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:105).

**Tham số:** `operationKeyHash(user, rawKey)`.

**Công việc:** Ràng buộc mã thao tác RR vào người thực hiện.

**Xử lý theo thứ tự:**

1. Ghép tiền tố rr-operation, userId và rawKey.
2. Băm SHA 256 thành mã lưu/tra BusinessOperation.

**Ai gọi / gọi tiếp:** Được gọi bởi [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142). Gọi tiếp [sha256Text()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-316), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Hai tài khoản cùng gõ save-1 không trở thành cùng thao tác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function operationKeyHash(user, rawKey) {
  return sha256Text(`rr-operation:${idString(user._id)}:${rawKey}`);
}
```

</details>

<a id="fn-121"></a>

## creationOperationKey()

**Code:** [replenishment.commands.js:109](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:109).

**Tham số:** `creationOperationKey(user, creationKey)`.

**Công việc:** Tạo mã tra cho lần tạo RR của một người.

**Xử lý theo thứ tự:**

1. Ghép rr-create, userId và creationKey.
2. Băm SHA 256; tách miền mã tạo khỏi miền update/submit/review.

**Ai gọi / gọi tiếp:** Được gọi bởi [replayCreated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-135), [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138). Gọi tiếp [sha256Text()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-316), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Gửi lại cùng form tạo vì timeout tìm đúng kết quả lần trước.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function creationOperationKey(user, creationKey) {
  return sha256Text(
    `rr-create:${idString(user._id)}:${creationKey}`,
  );
}
```

</details>

<a id="fn-122"></a>

## commandResult()

**Code:** [replenishment.commands.js:115](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:115).

**Tham số:** `commandResult(operation, replayed)`.

**Công việc:** Trả biên nhận thao tác RR từ BusinessOperation đã lưu.

**Xử lý theo thứ tự:**

1. Lấy documentId/version/status/operationId/approvalId.
2. Đổi mã sang chuỗi và thêm replayed do bên gọi truyền.

**Ai gọi / gọi tiếp:** Được gọi bởi [assertReplay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-124), [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Lệnh gửi lại có replayed=true và mã phiếu cũ, không tạo thêm yêu cầu.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function commandResult(operation, replayed) {
  return {
    id: idString(operation.documentId),
    version: operation.documentVersion,
    workflowStatus: operation.result?.workflowStatus ?? null,
    operationId: idString(operation._id),
    approvalId: idString(operation.result?.approvalId),
    replayed,
  };
}
```

</details>

<a id="fn-123"></a>

## findOperation()

**Code:** [replenishment.commands.js:126](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:126).

**Tham số:** `findOperation(key, session = null)`.

**Công việc:** Tra một thao tác đã commit bằng mã chống lặp.

**Xử lý theo thứ tự:**

1. BusinessOperation.findOne theo idempotencyKey, lean.
2. Nếu có session gắn vào cùng giao dịch.

**Ai gọi / gọi tiếp:** Được gọi bởi [replayCreated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-135), [replayCommand()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-136), [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142). Gọi tiếp [withSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-114).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `BusinessOperation`, tại [dòng 128](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:128). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessOperation.findOne({ idempotencyKey: key }).lean()
```

**Ví dụ:** Trước sửa bản 2, tra mã xem lệnh này đã được thực hiện chưa.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function findOperation(key, session = null) {
  return withSession(
    BusinessOperation.findOne({ idempotencyKey: key }).lean(),
    session,
  );
}
```

</details>

<a id="fn-124"></a>

## assertReplay()

**Code:** [replenishment.commands.js:133](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:133).

**Tham số:** `assertReplay(operation, { user, operationName, documentId, hash })`.

**Công việc:** Chỉ trả kết quả cũ khi mã thật sự ứng với cùng thao tác.

**Xử lý theo thứ tự:**

1. So người, tên hành động, mã phiếu và payloadHash.
2. Khác bất kỳ phần nào thì operationConflict.
3. Khớp thì commandResult(replayed=true).

**Ai gọi / gọi tiếp:** Được gọi bởi [replayCreated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-135), [replayCommand()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-136), [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [operationConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-330), [commandResult()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-122).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Dùng cùng mã review nhưng đổi lượng 80 thành 100 bị từ chối.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function assertReplay(operation, { user, operationName, documentId, hash }) {
  if (
    !operation ||
    idString(operation.performedBy) !== idString(user._id) ||
    operation.operation !== operationName ||
    idString(operation.documentId) !== idString(documentId) ||
    operation.payloadHash !== hash
  ) {
    throw operationConflict();
  }
  return commandResult(operation, true);
}
```

</details>

<a id="fn-125"></a>

## usableWarehouse()

**Code:** [replenishment.commands.js:146](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:146).

**Tham số:** `usableWarehouse(warehouseId, user, session, { requireActive = true } = {})`.

**Công việc:** Đọc kho và kiểm người dùng còn được dùng nó.

**Xử lý theo thứ tự:**

1. Warehouse.findById.
2. Không tồn tại thì lỗi dữ liệu; ngoài phân công thì scopeError.
3. Nếu requireActive thì kho phải đang hoạt động.

**Ai gọi / gọi tiếp:** Được gọi bởi [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140). Gọi tiếp [withSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-114), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298), [scopeError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-327), [stateError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-115).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc theo mã _id qua `Warehouse`, tại [dòng 148](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:148). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.findById(warehouseId).lean()
```

**Ví dụ:** Phiếu của kho đã bị gỡ khỏi tài khoản không được tiếp tục sửa/gửi.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function usableWarehouse(warehouseId, user, session, { requireActive = true } = {}) {
  const warehouse = await withSession(
    Warehouse.findById(warehouseId).lean(),
    session,
  );
  if (!warehouse) throw validationError("Kho không tồn tại");
  if (!canAccessWarehouse(user, warehouse._id)) throw scopeError();
  if (requireActive && !warehouse.isActive) {
    throw stateError("Kho đã ngừng hoạt động");
  }
  return warehouse;
}
```

</details>

<a id="fn-126"></a>

## ownedDocument()

**Code:** [replenishment.commands.js:159](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:159).

**Tham số:** `ownedDocument(user, id, session)`.

**Công việc:** Tìm phiếu RR của chính người thực hiện để sửa/gửi.

**Xử lý theo thứ tự:**

1. FindOne theo _id, kind REPLENISHMENT và createdBy=user.
2. Không thấy thì 404; thấy nhưng mất quyền kho thì 403.

**Ai gọi / gọi tiếp:** Được gọi bởi [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140). Gọi tiếp [withSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-114), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298), [scopeError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-327).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `BusinessDocument`, tại [dòng 161](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:161). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.findOne({
      _id: id,
      documentKind: "REPLENISHMENT",
      createdBy: user._id,
    }).lean()
```

**Ví dụ:** Biết mã RR của người khác không đủ để cập nhật dù cùng kho.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function ownedDocument(user, id, session) {
  const document = await withSession(
    BusinessDocument.findOne({
      _id: id,
      documentKind: "REPLENISHMENT",
      createdBy: user._id,
    }).lean(),
    session,
  );
  if (!document) throw notFoundError("Không tìm thấy yêu cầu bổ sung hàng");
  if (!canAccessWarehouse(user, document.header.warehouseId)) {
    throw scopeError();
  }
  return document;
}
```

</details>

<a id="fn-127"></a>

## prepareLines()

**Code:** [replenishment.commands.js:175](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:175).

**Tham số:** `prepareLines(rawLines, session)`.

**Công việc:** Kiểm và quy đổi các dòng RR bằng dữ liệu master thật.

**Xử lý theo thứ tự:**

1. Đọc gom Product, các conversion được gửi, conversion hiện hành và Uom.
2. Mỗi dòng kiểm sản phẩm active, conversion đúng sản phẩm/đã hiệu lực/đúng bản hiện hành.
3. Tính enteredQty×basePerUnit, kiểm độ chính xác và nguyên viên.
4. Cấm trùng cùng sản phẩm/đơn vị/lý do; trả bộ dữ liệu đã chuẩn bị có snapshot tên/hệ số.

**Ai gọi / gọi tiếp:** Được gọi bởi [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [withSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-114), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [conversionChangedError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-117), [multiplyBaseQuantity()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-308).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `Product`, tại [dòng 181](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:181). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.find({ _id: { $in: productIds } }).lean()
```

- Đọc nhiều bản ghi qua `ProductUomVersion`, tại [dòng 191](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:191). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ProductUomVersion.find({ _id: { $in: conversionIds } }).lean()
```

- Đọc nhiều bản ghi qua `ProductUomVersion`, tại [dòng 198](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:198). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ProductUomVersion.find({
      productId: { $in: productIds },
      validFrom: { $lte: now },
    })
      .sort({ validFrom: -1, version: -1 })
      .lean()
```

- Đọc nhiều bản ghi qua `Uom`, tại [dòng 218](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:218). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Uom.find({ _id: { $in: uomIds } }).lean()
```

**Ví dụ:** Nháp 25 thùng theo 4 bị chặn khi gửi nếu bản 6 đã thay thế; không tự sửa nhu cầu thành 150.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function prepareLines(rawLines, session) {
  const now = new Date();
  const productIds = [
    ...new Set(rawLines.map((line) => idString(line.productId))),
  ];
  const products = await withSession(
    Product.find({ _id: { $in: productIds } }).lean(),
    session,
  );
  const productById = new Map(
    products.map((product) => [idString(product._id), product]),
  );
  const conversionIds = [
    ...new Set(rawLines.map((line) => idString(line.conversionId))),
  ];
  const conversions = await withSession(
    ProductUomVersion.find({ _id: { $in: conversionIds } }).lean(),
    session,
  );
  const conversionById = new Map(
    conversions.map((conversion) => [idString(conversion._id), conversion]),
  );
  const currentConversions = await withSession(
    ProductUomVersion.find({
      productId: { $in: productIds },
      validFrom: { $lte: now },
    })
      .sort({ validFrom: -1, version: -1 })
      .lean(),
    session,
  );
  const currentByProductUom = new Map();
  for (const conversion of currentConversions) {
    const key = `${idString(conversion.productId)}:${idString(conversion.uomId)}`;
    if (!currentByProductUom.has(key)) currentByProductUom.set(key, conversion);
  }
  const uomIds = [
    ...new Set([
      ...products.map((product) => idString(product.baseUomId)),
      ...conversions.map((conversion) => idString(conversion.uomId)),
    ]),
  ];
  const uoms = await withSession(
    Uom.find({ _id: { $in: uomIds } }).lean(),
    session,
  );
  const uomById = new Map(uoms.map((uom) => [idString(uom._id), uom]));
  const prepared = [];
  const duplicateKeys = new Set();
  for (const [index, raw] of rawLines.entries()) {
    const product = productById.get(idString(raw.productId));
    if (!product || !product.isActive) {
      throw validationError(
        `Dòng ${index + 1}: sản phẩm không tồn tại hoặc đã ngừng hoạt động`,
      );
    }
    const conversion = conversionById.get(idString(raw.conversionId));
    if (
      !conversion ||
      idString(conversion.productId) !== idString(product._id) ||
      !conversion.validFrom ||
      new Date(conversion.validFrom).getTime() > now.getTime()
    ) {
      throw conversionChangedError();
    }
    const current = currentByProductUom.get(
      `${idString(product._id)}:${idString(conversion.uomId)}`,
    );
    if (!current || idString(current._id) !== idString(conversion._id)) {
      throw conversionChangedError();
    }
    const uom = uomById.get(idString(conversion.uomId));
    const baseUom = uomById.get(idString(product.baseUomId));
    if (!uom || !baseUom) {
      throw validationError(`Dòng ${index + 1}: đơn vị tính không tồn tại`);
    }
    const quantity = multiplyBaseQuantity(
      raw.enteredQty,
      conversion.basePerUnit.toString(),
    );
    if (
      !quantity.valid ||
      (product.wholeBaseUnits && !quantity.value.isInteger())
    ) {
      throw validationError(
        `Dòng ${index + 1}: số lượng quy đổi không hợp lệ hoặc không nguyên`,
      );
    }
    const duplicateKey = `${idString(product._id)}:${idString(uom._id)}:${raw.reasonNote}`;
    if (duplicateKeys.has(duplicateKey)) {
      throw validationError(
        "Không được lặp cùng sản phẩm, đơn vị và lý do trong một yêu cầu",
      );
    }
    duplicateKeys.add(duplicateKey);
    prepared.push({
      product,
      conversion,
      uom,
      baseUom,
      enteredQty: raw.enteredQty,
      conversionSnapshot: conversion.basePerUnit.toString(),
      qtyBase: quantity.string,
      reasonNote: raw.reasonNote,
      productNameSnapshot: product.name,
    });
  }
  return prepared;
}
```

</details>

<a id="fn-128"></a>

## lineDocument()

**Code:** [replenishment.commands.js:285](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:285).

**Tham số:** `lineDocument(preparedLine, lineNo)`.

**Công việc:** Tạo bộ trường cho một DocumentLine RR từ dữ liệu đã kiểm.

**Xử lý theo thứ tự:**

1. Nhận preparedLine và lineNo.
2. Giữ product/conversion/enteredQty/factor/qtyBase/tên chụp.
3. Đặt triggerType MANUAL_OTHER và lý do riêng.

**Ai gọi / gọi tiếp:** Được gọi bởi [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Hàm trả object 100 viên, nhưng phải gọi save mới thật sự có dòng trong database.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function lineDocument(preparedLine, lineNo) {
  return {
    lineNo,
    lineKind: "REPLENISHMENT",
    productId: preparedLine.product._id,
    conversionId: preparedLine.conversion._id,
    enteredQty: preparedLine.enteredQty,
    conversionSnapshot: preparedLine.conversionSnapshot,
    qtyBase: preparedLine.qtyBase,
    productNameSnapshot: preparedLine.productNameSnapshot,
    details: {
      triggerType: TRIGGER_TYPE,
      reasonNote: preparedLine.reasonNote,
    },
  };
}
```

</details>

<a id="fn-129"></a>

## writeSubmission()

**Code:** [replenishment.commands.js:302](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:302).

**Tham số:** `writeSubmission({
  document,
  version,
  prepared,
  lineDocuments,
  warehouse,
  submittedBy,
  submittedAt,
  session,
})`.

**Công việc:** Ghi bản chụp bất biến của nội dung đúng lúc gửi RR.

**Xử lý theo thứ tự:**

1. Ghép thông tin kho/ngày/lý do/người gửi từ server.
2. Ghép mã dòng và snapshot sản phẩm/đơn vị/quy đổi/lượng từng dòng.
3. Save ReplenishmentSubmission với documentId/documentVersion trong session hiện tại.

**Ai gọi / gọi tiếp:** Được gọi bởi [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140). Không gọi hàm khác trong danh mục này.

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Ghi đối tượng model đã tạo qua `ReplenishmentSubmission`, tại [dòng 312](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:312). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
new ReplenishmentSubmission({
    documentId: document._id,
    documentVersion: version,
    submittedBy,
    submittedAt,
    warehouseId: document.header.warehouseId,
    warehouseCodeSnapshot: warehouse.code,
    warehouseNameSnapshot: warehouse.name,
    neededOn: document.header.neededOn,
    triggerReason: document.header.triggerReason,
    note: document.note ?? null,
    lines: prepared.map((preparedLine, index) => {
      const line = lineDocuments[index];
      return {
        lineId: line._id,
        lineNo: line.lineNo,
        productId: preparedLine.product._id,
        productSkuSnapshot: preparedLine.product.sku,
        productNameSnapshot: preparedLine.productNameSnapshot,
        baseUomId: preparedLine.product.baseUomId,
        baseUomCodeSnapshot: preparedLine.baseUom.code,
        enteredUomId: preparedLine.uom._id,
        enteredUomCodeSnapshot: preparedLine.uom.code,
        conversionId: preparedLine.conversion._id,
        conversionVersion: preparedLine.conversion.version,
        enteredQty: preparedLine.enteredQty,
        conversionSnapshot: preparedLine.conversionSnapshot,
        qtyBase: preparedLine.qtyBase,
        triggerType: TRIGGER_TYPE,
        reasonNote: preparedLine.reasonNote,
      };
    }),
  }).save({ session })
```

**Ví dụ:** Sau trả sửa 100 thành 80, lần gửi cũ vẫn giữ 100.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function writeSubmission({
  document,
  version,
  prepared,
  lineDocuments,
  warehouse,
  submittedBy,
  submittedAt,
  session,
}) {
  await new ReplenishmentSubmission({
    documentId: document._id,
    documentVersion: version,
    submittedBy,
    submittedAt,
    warehouseId: document.header.warehouseId,
    warehouseCodeSnapshot: warehouse.code,
    warehouseNameSnapshot: warehouse.name,
    neededOn: document.header.neededOn,
    triggerReason: document.header.triggerReason,
    note: document.note ?? null,
    lines: prepared.map((preparedLine, index) => {
      const line = lineDocuments[index];
      return {
        lineId: line._id,
        lineNo: line.lineNo,
        productId: preparedLine.product._id,
        productSkuSnapshot: preparedLine.product.sku,
        productNameSnapshot: preparedLine.productNameSnapshot,
        baseUomId: preparedLine.product.baseUomId,
        baseUomCodeSnapshot: preparedLine.baseUom.code,
        enteredUomId: preparedLine.uom._id,
        enteredUomCodeSnapshot: preparedLine.uom.code,
        conversionId: preparedLine.conversion._id,
        conversionVersion: preparedLine.conversion.version,
        enteredQty: preparedLine.enteredQty,
        conversionSnapshot: preparedLine.conversionSnapshot,
        qtyBase: preparedLine.qtyBase,
        triggerType: TRIGGER_TYPE,
        reasonNote: preparedLine.reasonNote,
      };
    }),
  }).save({ session });
}
```

</details>

<a id="fn-130"></a>

## canonicalLines()

**Code:** [replenishment.commands.js:347](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:347).

**Tham số:** `canonicalLines(lines)`.

**Công việc:** Chọn các trường có ý nghĩa để so nội dung một thao tác.

**Xử lý theo thứ tự:**

1. Chuẩn hóa id/product/conversion và giữ lượng/lý do theo thứ tự dòng.
2. Không tự truy vấn master hoặc ghi phiếu.

**Ai gọi / gọi tiếp:** Được gọi bởi [creationPayload()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-131), [updatePayload()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-132). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Cùng mã tạo nhưng đổi productId sẽ làm hash khác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function canonicalLines(lines) {
  return lines.map((line) => ({
    id: line.id ? idString(line.id) : null,
    productId: idString(line.productId),
    conversionId: idString(line.conversionId),
    enteredQty: line.enteredQty,
    reasonNote: line.reasonNote,
  }));
}
```

</details>

<a id="fn-131"></a>

## creationPayload()

**Code:** [replenishment.commands.js:357](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:357).

**Tham số:** `creationPayload(user, input)`.

**Công việc:** Tạo nội dung chuẩn để băm cho lệnh tạo/gửi ngay RR.

**Xử lý theo thứ tự:**

1. Chọn actor/action/target/version và những trường mà lệnh này sử dụng đúng như object trong code.
2. Chuẩn hóa các mã/lý do/dòng nếu có; bên gọi mới băm SHA 256.
3. Không coi payload này là dữ liệu đã đủ quyền hoặc đủ điều kiện ghi.

**Ai gọi / gọi tiếp:** Được gọi bởi [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [canonicalLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-130).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Cùng key nhưng thay nội dung tạo/gửi ngay sẽ bị nhận ra khác hash.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function creationPayload(user, input) {
  return {
    action: input.action,
    actorId: idString(user._id),
    creationKey: input.creationKey,
    warehouseId: idString(input.warehouseId),
    neededOn: input.neededOn,
    triggerReason: input.triggerReason,
    note: input.note ?? null,
    lines: canonicalLines(input.lines),
  };
}
```

</details>

<a id="fn-132"></a>

## updatePayload()

**Code:** [replenishment.commands.js:370](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:370).

**Tham số:** `updatePayload(user, id, input)`.

**Công việc:** Tạo nội dung chuẩn để băm cho lệnh sửa RR.

**Xử lý theo thứ tự:**

1. Chọn actor/action/target/version và những trường mà lệnh này sử dụng đúng như object trong code.
2. Chuẩn hóa các mã/lý do/dòng nếu có; bên gọi mới băm SHA 256.
3. Không coi payload này là dữ liệu đã đủ quyền hoặc đủ điều kiện ghi.

**Ai gọi / gọi tiếp:** Được gọi bởi [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [canonicalLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-130).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Cùng key nhưng thay nội dung sửa sẽ bị nhận ra khác hash.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function updatePayload(user, id, input) {
  return {
    action: "UPDATE_REPLENISHMENT",
    actorId: idString(user._id),
    targetId: idString(id),
    expectedVersion: input.expectedVersion,
    warehouseId: idString(input.warehouseId),
    neededOn: input.neededOn,
    triggerReason: input.triggerReason,
    note: input.note ?? null,
    lines: canonicalLines(input.lines),
  };
}
```

</details>

<a id="fn-133"></a>

## submitPayload()

**Code:** [replenishment.commands.js:384](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:384).

**Tham số:** `submitPayload(user, id, input)`.

**Công việc:** Tạo nội dung chuẩn để băm cho lệnh gửi phiếu đã có RR.

**Xử lý theo thứ tự:**

1. Chọn actor/action/target/version và những trường mà lệnh này sử dụng đúng như object trong code.
2. Chuẩn hóa các mã/lý do/dòng nếu có; bên gọi mới băm SHA 256.
3. Không coi payload này là dữ liệu đã đủ quyền hoặc đủ điều kiện ghi.

**Ai gọi / gọi tiếp:** Được gọi bởi [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Cùng key nhưng thay nội dung gửi phiếu đã có sẽ bị nhận ra khác hash.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function submitPayload(user, id, input) {
  return {
    action: "SUBMIT_REPLENISHMENT",
    actorId: idString(user._id),
    targetId: idString(id),
    expectedVersion: input.expectedVersion,
  };
}
```

</details>

<a id="fn-134"></a>

## reviewPayload()

**Code:** [replenishment.commands.js:393](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:393).

**Tham số:** `reviewPayload(user, id, input)`.

**Công việc:** Tạo nội dung chuẩn để băm cho lệnh duyệt/từ chối/trả sửa RR.

**Xử lý theo thứ tự:**

1. Chọn actor/action/target/version và những trường mà lệnh này sử dụng đúng như object trong code.
2. Chuẩn hóa các mã/lý do/dòng nếu có; bên gọi mới băm SHA 256.
3. Không coi payload này là dữ liệu đã đủ quyền hoặc đủ điều kiện ghi.

**Ai gọi / gọi tiếp:** Được gọi bởi [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Cùng key nhưng thay nội dung duyệt/từ chối/trả sửa sẽ bị nhận ra khác hash.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function reviewPayload(user, id, input) {
  return {
    action: "REVIEW_REPLENISHMENT",
    actorId: idString(user._id),
    targetId: idString(id),
    expectedVersion: input.expectedVersion,
    decision: input.decision,
    reason: input.reason?.trim() || null,
    lines: [...input.lines]
      .map((line) => ({
        lineId: idString(line.lineId),
        approvedQtyBase: line.approvedQtyBase,
        reason: line.reason?.trim() || null,
      })),
  };
}
```

</details>

<a id="fn-135"></a>

## replayCreated()

**Code:** [replenishment.commands.js:410](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:410).

**Tham số:** `replayCreated(user, creationKey, hash)`.

**Công việc:** Khôi phục kết quả tạo RR sau lỗi trùng hoặc không rõ commit.

**Xử lý theo thứ tự:**

1. Tìm REPLENISHMENT theo creator và creationKey.
2. Kiểm lại kho hiện tại rồi tra operation tương ứng.
3. Chỉ chấp nhận CREATE/SUBMIT hợp lệ; assertReplay so hash/người/phiếu.

**Ai gọi / gọi tiếp:** Được gọi bởi [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138). Gọi tiếp [creationOperationKey()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-121), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298), [scopeError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-327), [findOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-123), [operationConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-330), [assertReplay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-124).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `BusinessDocument`, tại [dòng 412](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:412). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.findOne({
    documentKind: "REPLENISHMENT",
    createdBy: user._id,
    "header.creationKey": creationKey,
  }).lean()
```

**Ví dụ:** Mất kết nối sau tạo thành công rồi bị gỡ quyền kho: không lấy lại dữ liệu chỉ nhờ key cũ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function replayCreated(user, creationKey, hash) {
  const key = creationOperationKey(user, creationKey);
  const document = await BusinessDocument.findOne({
    documentKind: "REPLENISHMENT",
    createdBy: user._id,
    "header.creationKey": creationKey,
  }).lean();
  if (!document) return null;
  if (!canAccessWarehouse(user, document.header.warehouseId)) throw scopeError();
  const operation = await findOperation(key);
  if (!operation) return null;
  if (
    !["CREATE_REPLENISHMENT", "SUBMIT_REPLENISHMENT"].includes(
      operation.operation,
    )
  ) {
    throw operationConflict();
  }
  return assertReplay(operation, {
    user,
    operationName: operation.operation,
    documentId: document._id,
    hash,
  });
}
```

</details>

<a id="fn-136"></a>

## replayCommand()

**Code:** [replenishment.commands.js:436](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:436).

**Tham số:** `replayCommand(user, key, operationName, documentId, hash)`.

**Công việc:** Tra kết quả cũ của update/submit/review sau nhánh lỗi cạnh tranh.

**Xử lý theo thứ tự:**

1. findOperation theo key.
2. Không có trả null; có thì assertReplay với operationName/documentId/hash bên gọi truyền.

**Ai gọi / gọi tiếp:** Được gọi bởi [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142). Gọi tiếp [findOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-123), [assertReplay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-124).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `BusinessOperation.findOne`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Kết quả / nhánh bị chặn:** Helper này tự so thao tác, không tự gọi lại ownedDocument; kiểm phạm vi ở luồng gọi cần được xem riêng.

**Ví dụ:** Lệnh cập nhật đã commit nhưng mất phản hồi được nhận diện bằng operation đã lưu.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function replayCommand(user, key, operationName, documentId, hash) {
  const operation = await findOperation(key);
  if (!operation) return null;
  return assertReplay(operation, {
    user,
    operationName,
    documentId,
    hash,
  });
}
```

</details>

<a id="fn-137"></a>

## isUnknownCommit()

**Code:** [replenishment.commands.js:447](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:447).

**Tham số:** `isUnknownCommit(error)`.

**Công việc:** Nhận ra lỗi MongoDB chưa xác định kết quả commit.

**Xử lý theo thứ tự:**

1. Hỏi error.hasErrorLabel(UnknownTransactionCommitResult) nếu có.
2. Trả boolean để bên gọi tra biên nhận trước thử lại.

**Ai gọi / gọi tiếp:** Được gọi bởi [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Timeout không tự chứng minh giao dịch thất bại; không tạo mã thao tác mới ngay.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function isUnknownCommit(error) {
  return error?.hasErrorLabel?.("UnknownTransactionCommitResult");
}
```

</details>

<a id="fn-138"></a>

## createReplenishment()

**Code:** [replenishment.commands.js:451](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:451).

**Tham số:** `createReplenishment(user, input)`.

**Công việc:** Tạo RR nháp hoặc tạo và gửi ngay, chống tạo trùng.

**Xử lý theo thứ tự:**

1. Kiểm quyền; băm payload và tạo key theo actor; mở giao dịch.
2. Nếu đã có creator/creationKey: kiểm kho, tra operation, so payload rồi trả cũ.
3. Kiểm kho và nếu gửi thì ngày cần; prepareLines; save header và từng dòng.
4. Nếu SUBMIT thì writeSubmission; save BusinessOperation/AuditEvent cùng session.
5. Nhánh lỗi 11000/unknown commit dùng replayCreated; luôn đóng session.

**Ai gọi / gọi tiếp:** Được gọi bởi [create()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-148). Gọi tiếp [requireCreator()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-110), [sha256Json()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-315), [creationPayload()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-131), [creationOperationKey()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-121), [withSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-114), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-298), [scopeError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-327), [findOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-123), [operationConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-330), [assertReplay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-124), [usableWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-125), [isPastCalendarDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-306), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [prepareLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-127), [calendarDateToInstant()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-304), [lineDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-128), [writeSubmission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-129), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [commandResult()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-122), [isUnknownCommit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-137), [replayCreated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-135).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `BusinessDocument`, tại [dòng 459](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:459). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.findOne({
          documentKind: "REPLENISHMENT",
          createdBy: user._id,
          "header.creationKey": input.creationKey,
        }).lean()
```

- Ghi đối tượng model đã tạo qua `BusinessDocument`, tại [dòng 515](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:515). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
document.save({ session })
```

- Ghi đối tượng model đã tạo qua `DocumentLine`, tại [dòng 522](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:522). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
line.save({ session })
```

- Ghi đối tượng model đã tạo qua `BusinessOperation`, tại [dòng 541](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:541). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
new BusinessOperation({
        documentId,
        operation: operationName,
        operationKey,
        idempotencyKey: operationKey,
        payloadHash: hash,
        documentVersion: 1,
        performedBy: user._id,
        result: { workflowStatus: status, approvalId: null },
      }).save({ session })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
        documentId,
        actorId: user._id,
        action: operationName,
        details: {
          operationId: idString(operation._id),
          workflowStatus: status,
          lineCount: lineDocuments.length,
          warehouseId: idString(warehouse._id),
        },
        session,
      })
```

**Ví dụ:** 25 thùng×4=100 viên; SAVE_DRAFT chưa chụp lần gửi, SUBMIT có bản chụp ngay version 1.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function createReplenishment(user, input) {
  requireCreator(user);
  const hash = sha256Json(creationPayload(user, input));
  const operationKey = creationOperationKey(user, input.creationKey);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const existing = await withSession(
        BusinessDocument.findOne({
          documentKind: "REPLENISHMENT",
          createdBy: user._id,
          "header.creationKey": input.creationKey,
        }).lean(),
        session,
      );
      if (existing) {
        if (!canAccessWarehouse(user, existing.header.warehouseId)) throw scopeError();
        const operation = await findOperation(operationKey, session);
        if (!operation) throw operationConflict();
        if (
          !["CREATE_REPLENISHMENT", "SUBMIT_REPLENISHMENT"].includes(
            operation.operation,
          )
        ) {
          throw operationConflict();
        }
        return assertReplay(operation, {
          user,
          operationName: operation.operation,
          documentId: existing._id,
          hash,
        });
      }
      const warehouse = await usableWarehouse(
        input.warehouseId,
        user,
        session,
      );
      if (input.action === "SUBMIT" && isPastCalendarDate(input.neededOn)) {
        throw validationError("Ngày cần không được trước ngày hiện tại khi gửi");
      }
      const prepared = await prepareLines(input.lines, session);
      const now = new Date();
      const status = input.action === "SUBMIT" ? "SUBMITTED" : "DRAFT";
      const documentId = new mongoose.Types.ObjectId();
      const document = new BusinessDocument({
        _id: documentId,
        documentNo: `RR-${String(documentId).toUpperCase()}`,
        documentKind: "REPLENISHMENT",
        workflowStatus: status,
        version: 1,
        createdBy: user._id,
        note: input.note ?? undefined,
        header: {
          warehouseId: warehouse._id,
          neededOn: calendarDateToInstant(input.neededOn),
          triggerReason: input.triggerReason,
          creationKey: input.creationKey,
          ...(status === "SUBMITTED" && {
            submittedBy: user._id,
            submittedAt: now,
          }),
        },
      });
      await document.save({ session });
      const lineDocuments = [];
      for (const [index, preparedLine] of prepared.entries()) {
        const line = new DocumentLine({
          ...lineDocument(preparedLine, index + 1),
          documentId,
        });
        await line.save({ session });
        lineDocuments.push(line);
      }
      if (status === "SUBMITTED") {
        await writeSubmission({
          document,
          version: 1,
          prepared,
          lineDocuments,
          warehouse,
          submittedBy: user._id,
          submittedAt: now,
          session,
        });
      }
      const operationName =
        input.action === "SUBMIT"
          ? "SUBMIT_REPLENISHMENT"
          : "CREATE_REPLENISHMENT";
      const operation = await new BusinessOperation({
        documentId,
        operation: operationName,
        operationKey,
        idempotencyKey: operationKey,
        payloadHash: hash,
        documentVersion: 1,
        performedBy: user._id,
        result: { workflowStatus: status, approvalId: null },
      }).save({ session });
      await appendAudit({
        documentId,
        actorId: user._id,
        action: operationName,
        details: {
          operationId: idString(operation._id),
          workflowStatus: status,
          lineCount: lineDocuments.length,
          warehouseId: idString(warehouse._id),
        },
        session,
      });
      return commandResult(operation, false);
    }, transactionOptions);
  } catch (error) {
    if (error?.code === 11000 || isUnknownCommit(error)) {
      const replay = await replayCreated(user, input.creationKey, hash);
      if (replay) return replay;
      throw error?.code === 11000
        ? operationConflict("Creation key đã được sử dụng bởi một yêu cầu khác")
        : operationConflict("Không thể xác nhận kết quả thao tác");
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
```

</details>

<a id="fn-139"></a>

## updateReplenishment()

**Code:** [replenishment.commands.js:579](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:579).

**Tham số:** `updateReplenishment(user, id, input)`.

**Công việc:** Sửa nội dung RR của creator, giữ dấu vết dòng đã bỏ.

**Xử lý theo thứ tự:**

1. ownedDocument rồi tra operation; kiểm DRAFT/REVISION_REQUIRED, version, kho cũ/mới.
2. Đọc mọi dòng và chỉ sửa dòng manual hiện hành; cấm đổi sản phẩm trên id cũ.
3. prepareLines; tăng version và cập nhật header theo điều kiện.
4. Update dòng giữ lại; thêm dòng mới với lineNo mới; dòng bỏ đặt removedAt.
5. Save kết quả thao tác và audit trong cùng giao dịch.

**Ai gọi / gọi tiếp:** Được gọi bởi [update()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-149). Gọi tiếp [requireUpdater()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-111), [operationKeyHash()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-120), [sha256Json()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-315), [updatePayload()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-132), [ownedDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-126), [findOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-123), [assertReplay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-124), [stateError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-115), [versionConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-328), [usableWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-125), [withSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-114), [manualSourceError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-118), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [prepareLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-127), [calendarDateToInstant()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-304), [lineDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-128), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [commandResult()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-122), [isUnknownCommit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-137), [replayCommand()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-136).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `DocumentLine`, tại [dòng 613](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:613). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.find({
          documentId: current._id,
          lineKind: "REPLENISHMENT",
        })
          .sort({ lineNo: 1 })
          .lean()
```

- Cập nhật rồi lấy bản ghi kết quả qua `BusinessDocument`, tại [dòng 656](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:656). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.findOneAndUpdate(
        {
          _id: current._id,
          documentKind: "REPLENISHMENT",
          createdBy: user._id,
          workflowStatus: { $in: EDITABLE_STATUSES },
          version: input.expectedVersion,
        },
        {
          $set: {
            "header.warehouseId": warehouse._id,
            "header.neededOn": calendarDateToInstant(input.neededOn),
            "header.triggerReason": input.triggerReason,
            note: input.note ?? null,
          },
          $inc: { version: 1 },
        },
        { returnDocument: "after", runValidators: true, session },
      ).lean()
```

- Cập nhật một bản ghi qua `ReplenishmentLine`, tại [dòng 690](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:690). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ReplenishmentLine.updateOne(
            { _id: existing._id, documentId: current._id },
            {
              $set: {
                conversionId: preparedLine.conversion._id,
                enteredQty: preparedLine.enteredQty,
                conversionSnapshot: preparedLine.conversionSnapshot,
                qtyBase: preparedLine.qtyBase,
                productNameSnapshot: preparedLine.productNameSnapshot,
                "details.triggerType": TRIGGER_TYPE,
                "details.reasonNote": preparedLine.reasonNote,
              },
            },
            { session, runValidators: true },
          )
```

- Ghi đối tượng model đã tạo qua `DocumentLine`, tại [dòng 710](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:710). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
new DocumentLine({
            ...lineDocument(preparedLine, nextLineNo),
            documentId: current._id,
          }).save({ session })
```

- Cập nhật một bản ghi qua `ReplenishmentLine`, tại [dòng 720](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:720). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ReplenishmentLine.updateOne(
          {
            _id: line._id,
            documentId: current._id,
            "details.removedAt": null,
          },
          { $set: { "details.removedAt": now } },
          { session, runValidators: true },
        )
```

- Ghi đối tượng model đã tạo qua `BusinessOperation`, tại [dòng 731](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:731). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
new BusinessOperation({
        documentId: current._id,
        operation: operationName,
        operationKey: key,
        idempotencyKey: key,
        payloadHash: hash,
        documentVersion: updated.version,
        performedBy: user._id,
        result: {
          workflowStatus: updated.workflowStatus,
          approvalId: null,
        },
      }).save({ session })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
        documentId: current._id,
        actorId: user._id,
        action: operationName,
        details: {
          operationId: idString(operation._id),
          version: updated.version,
          added,
          edited,
          removed,
          warehouseId: idString(warehouse._id),
        },
        session,
      })
```

**Ví dụ:** A dòng 1 giữ lại, bỏB dòng 2, thêmC dòng 3; quyết định cũ choB không biến thànhC.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function updateReplenishment(user, id, input) {
  requireUpdater(user);
  const key = operationKeyHash(user, input.operationKey);
  const hash = sha256Json(updatePayload(user, id, input));
  const operationName = "UPDATE_REPLENISHMENT";
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const current = await ownedDocument(user, id, session);
      const existingOperation = await findOperation(key, session);
      if (existingOperation) {
        return assertReplay(existingOperation, {
          user,
          operationName,
          documentId: current._id,
          hash,
        });
      }
      if (!EDITABLE_STATUSES.includes(current.workflowStatus)) {
        throw stateError("Trạng thái yêu cầu không cho phép sửa");
      }
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      await usableWarehouse(current.header.warehouseId, user, session);
      const warehouse = await usableWarehouse(
        input.warehouseId,
        user,
        session,
      );
      const allLines = await withSession(
        DocumentLine.find({
          documentId: current._id,
          lineKind: "REPLENISHMENT",
        })
          .sort({ lineNo: 1 })
          .lean(),
        session,
      );
      const currentLines = allLines.filter(
        (line) => line.details?.removedAt == null,
      );
      if (
        currentLines.some(
          (line) => line.details?.triggerType !== TRIGGER_TYPE,
        )
      ) {
        throw manualSourceError();
      }
      const lineById = new Map(
        currentLines.map((line) => [idString(line._id), line]),
      );
      const incomingIds = new Set();
      for (const line of input.lines) {
        if (!line.id) continue;
        const lineId = idString(line.id);
        if (incomingIds.has(lineId)) {
          throw validationError("Một dòng không được xuất hiện hai lần");
        }
        incomingIds.add(lineId);
        const existing = lineById.get(lineId);
        if (!existing) {
          throw validationError(
            "Dòng cần sửa không còn hiện hành hoặc không thuộc yêu cầu",
          );
        }
        if (idString(existing.productId) !== idString(line.productId)) {
          throw validationError(
            "Không đổi sản phẩm trên dòng cũ; hãy bỏ dòng và thêm dòng mới",
          );
        }
      }
      const prepared = await prepareLines(input.lines, session);
      const now = new Date();
      const updated = await BusinessDocument.findOneAndUpdate(
        {
          _id: current._id,
          documentKind: "REPLENISHMENT",
          createdBy: user._id,
          workflowStatus: { $in: EDITABLE_STATUSES },
          version: input.expectedVersion,
        },
        {
          $set: {
            "header.warehouseId": warehouse._id,
            "header.neededOn": calendarDateToInstant(input.neededOn),
            "header.triggerReason": input.triggerReason,
            note: input.note ?? null,
          },
          $inc: { version: 1 },
        },
        { returnDocument: "after", runValidators: true, session },
      ).lean();
      if (!updated) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      let added = 0;
      let removed = 0;
      let edited = 0;
      let nextLineNo =
        allLines.reduce((max, line) => Math.max(max, line.lineNo), 0) + 1;
      for (const [index, lineInput] of input.lines.entries()) {
        const preparedLine = prepared[index];
        if (lineInput.id) {
          const existing = lineById.get(idString(lineInput.id));
          const result = await ReplenishmentLine.updateOne(
            { _id: existing._id, documentId: current._id },
            {
              $set: {
                conversionId: preparedLine.conversion._id,
                enteredQty: preparedLine.enteredQty,
                conversionSnapshot: preparedLine.conversionSnapshot,
                qtyBase: preparedLine.qtyBase,
                productNameSnapshot: preparedLine.productNameSnapshot,
                "details.triggerType": TRIGGER_TYPE,
                "details.reasonNote": preparedLine.reasonNote,
              },
            },
            { session, runValidators: true },
          );
          if (result.matchedCount !== 1) {
            throw stateError("Dòng yêu cầu vừa thay đổi, vui lòng tải lại");
          }
          edited += 1;
        } else {
          await new DocumentLine({
            ...lineDocument(preparedLine, nextLineNo),
            documentId: current._id,
          }).save({ session });
          nextLineNo += 1;
          added += 1;
        }
      }
      for (const line of currentLines) {
        if (incomingIds.has(idString(line._id))) continue;
        const result = await ReplenishmentLine.updateOne(
          {
            _id: line._id,
            documentId: current._id,
            "details.removedAt": null,
          },
          { $set: { "details.removedAt": now } },
          { session, runValidators: true },
        );
        if (result.matchedCount === 1) removed += 1;
      }
      const operation = await new BusinessOperation({
        documentId: current._id,
        operation: operationName,
        operationKey: key,
        idempotencyKey: key,
        payloadHash: hash,
        documentVersion: updated.version,
        performedBy: user._id,
        result: {
          workflowStatus: updated.workflowStatus,
          approvalId: null,
        },
      }).save({ session });
      await appendAudit({
        documentId: current._id,
        actorId: user._id,
        action: operationName,
        details: {
          operationId: idString(operation._id),
          version: updated.version,
          added,
          edited,
          removed,
          warehouseId: idString(warehouse._id),
        },
        session,
      });
      return commandResult(operation, false);
    }, transactionOptions);
  } catch (error) {
    if (error?.code === 11000 || isUnknownCommit(error)) {
      const replay = await replayCommand(user, key, operationName, id, hash);
      if (replay) return replay;
      throw stateError("Thao tác đã được xử lý bởi một yêu cầu khác");
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
```

</details>

<a id="fn-140"></a>

## submitReplenishment()

**Code:** [replenishment.commands.js:772](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:772).

**Tham số:** `submitReplenishment(user, id, input)`.

**Công việc:** Chốt nội dung RR đã lưu để gửi duyệt.

**Xử lý theo thứ tự:**

1. ownedDocument/operation/version và trạng thái được gửi.
2. Kiểm kho/ngày cần; đọc dòng chưa removed, ít nhất 1 tối đa 100 và đủ lý do manual.
3. prepareLines kiểm lại quy đổi hiện hành.
4. Đổi SUBMITTED, lưu sender/time và tăng version; writeSubmission cùng operation/audit.
5. Gặp lỗi cạnh tranh tra lại biên nhận cùng key.

**Ai gọi / gọi tiếp:** Được gọi bởi [submit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-150). Gọi tiếp [requireUpdater()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-111), [operationKeyHash()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-120), [sha256Json()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-315), [submitPayload()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-133), [ownedDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-126), [findOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-123), [assertReplay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-124), [stateError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-115), [versionConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-328), [usableWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-125), [isPastCalendarDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-306), [saigonDateOnly()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-303), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324), [withSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-114), [manualSourceError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-118), [prepareLines()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-127), [writeSubmission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-129), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [commandResult()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-122), [isUnknownCommit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-137), [replayCommand()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-136).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `DocumentLine`, tại [dòng 808](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:808). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.find({
          documentId: current._id,
          lineKind: "REPLENISHMENT",
          "details.removedAt": null,
        })
          .sort({ lineNo: 1 })
          .lean()
```

- Cập nhật rồi lấy bản ghi kết quả qua `BusinessDocument`, tại [dòng 844](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:844). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.findOneAndUpdate(
        {
          _id: current._id,
          documentKind: "REPLENISHMENT",
          createdBy: user._id,
          workflowStatus: { $in: EDITABLE_STATUSES },
          version: input.expectedVersion,
        },
        {
          $set: {
            workflowStatus: "SUBMITTED",
            "header.submittedBy": user._id,
            "header.submittedAt": now,
          },
          $inc: { version: 1 },
        },
        { returnDocument: "after", runValidators: true, session },
      ).lean()
```

- Ghi đối tượng model đã tạo qua `BusinessOperation`, tại [dòng 878](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:878). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
new BusinessOperation({
        documentId: current._id,
        operation: operationName,
        operationKey: key,
        idempotencyKey: key,
        payloadHash: hash,
        documentVersion: updated.version,
        performedBy: user._id,
        result: { workflowStatus: "SUBMITTED", approvalId: null },
      }).save({ session })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
        documentId: current._id,
        actorId: user._id,
        action: operationName,
        details: {
          operationId: idString(operation._id),
          version: updated.version,
          submittedAt: now.toISOString(),
          lineCount: lineDocuments.length,
        },
        session,
      })
```

**Ví dụ:** Bản cũ hệ số 4 không được tự gửi nếu bản 6 đã hiệu lực; người dùng xem lại rồi lưu/gửi.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function submitReplenishment(user, id, input) {
  requireUpdater(user);
  const key = operationKeyHash(user, input.operationKey);
  const hash = sha256Json(submitPayload(user, id, input));
  const operationName = "SUBMIT_REPLENISHMENT";
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const current = await ownedDocument(user, id, session);
      const existingOperation = await findOperation(key, session);
      if (existingOperation) {
        return assertReplay(existingOperation, {
          user,
          operationName,
          documentId: current._id,
          hash,
        });
      }
      if (!EDITABLE_STATUSES.includes(current.workflowStatus)) {
        throw stateError("Chỉ nháp hoặc phiếu bị trả lại mới được gửi");
      }
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      const warehouse = await usableWarehouse(
        current.header.warehouseId,
        user,
        session,
      );
      if (isPastCalendarDate(saigonDateOnly(current.header.neededOn))) {
        throw validationError("Ngày cần không được trước ngày hiện tại khi gửi");
      }
      const lineDocuments = await withSession(
        DocumentLine.find({
          documentId: current._id,
          lineKind: "REPLENISHMENT",
          "details.removedAt": null,
        })
          .sort({ lineNo: 1 })
          .lean(),
        session,
      );
      if (!lineDocuments.length) {
        throw stateError("Yêu cầu không còn dòng hiện hành để gửi");
      }
      if (lineDocuments.length > 100) {
        throw validationError("Yêu cầu gửi tối đa 100 dòng hiện hành");
      }
      if (
        lineDocuments.some(
          (line) =>
            line.details?.triggerType !== TRIGGER_TYPE ||
            !line.details?.reasonNote?.trim(),
        )
      ) {
        throw lineDocuments.some(
          (line) => line.details?.triggerType !== TRIGGER_TYPE,
        )
          ? manualSourceError()
          : validationError("Mỗi dòng phải có lý do riêng trước khi gửi");
      }
      const rawLines = lineDocuments.map((line) => ({
        productId: line.productId,
        conversionId: line.conversionId,
        enteredQty: line.enteredQty.toString(),
        reasonNote: line.details.reasonNote,
      }));
      const prepared = await prepareLines(rawLines, session);
      const now = new Date();
      const updated = await BusinessDocument.findOneAndUpdate(
        {
          _id: current._id,
          documentKind: "REPLENISHMENT",
          createdBy: user._id,
          workflowStatus: { $in: EDITABLE_STATUSES },
          version: input.expectedVersion,
        },
        {
          $set: {
            workflowStatus: "SUBMITTED",
            "header.submittedBy": user._id,
            "header.submittedAt": now,
          },
          $inc: { version: 1 },
        },
        { returnDocument: "after", runValidators: true, session },
      ).lean();
      if (!updated) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      await writeSubmission({
        document: updated,
        version: updated.version,
        prepared,
        lineDocuments,
        warehouse,
        submittedBy: user._id,
        submittedAt: now,
        session,
      });
      const operation = await new BusinessOperation({
        documentId: current._id,
        operation: operationName,
        operationKey: key,
        idempotencyKey: key,
        payloadHash: hash,
        documentVersion: updated.version,
        performedBy: user._id,
        result: { workflowStatus: "SUBMITTED", approvalId: null },
      }).save({ session });
      await appendAudit({
        documentId: current._id,
        actorId: user._id,
        action: operationName,
        details: {
          operationId: idString(operation._id),
          version: updated.version,
          submittedAt: now.toISOString(),
          lineCount: lineDocuments.length,
        },
        session,
      });
      return commandResult(operation, false);
    }, transactionOptions);
  } catch (error) {
    if (error?.code === 11000 || isUnknownCommit(error)) {
      const replay = await replayCommand(user, key, operationName, id, hash);
      if (replay) return replay;
      throw stateError("Yêu cầu đã được xử lý bởi một thao tác khác");
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
```

</details>

<a id="fn-141"></a>

## appendApproval()

**Code:** [replenishment.commands.js:914](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:914).

**Tham số:** `appendApproval({
  document,
  snapshot,
  user,
  input,
  now,
  session,
})`.

**Công việc:** Kiểm lượng duyệt theo bản chụp và tạo quyết định.

**Xử lý theo thứ tự:**

1. Cấm user trùng creator hoặc submitter, cần người gửi thật.
2. APPROVE phải đủ mọi dòng, không trùng, lượng 0..requested và đúng nguyên viên.
3. Dòng giảm/0 phải có lý do; ít nhất một dòng dương. REJECT/REVISE không nhận lượng và cần lý do chung.
4. Save Approval đúng documentVersion, decisionKind, người yêu cầu/người duyệt; trả status đích.

**Ai gọi / gọi tiếp:** Được gọi bởi [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [selfApprovalError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-116), [stateError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-115), [reviewQuantityError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-119), [withSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-114), [validationError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-324).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `Product`, tại [dòng 964](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:964). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.find({ _id: { $in: productIds } }).lean()
```

- Ghi đối tượng model đã tạo qua `Approval`, tại [dòng 1019](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:1019). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
new Approval({
    documentId: document._id,
    documentVersion: document.version,
    decisionKind: APPROVAL_KIND,
    decision,
    requestedBy: snapshot.submittedBy,
    decidedBy: user._id,
    decidedAt: now,
    ...(generalReason && { reason: generalReason }),
    lines,
  }).save({ session })
```

**Ví dụ:** Xin A 100/B 40; duyệtA 80/B 0 cần lý do giảm của từng dòng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function appendApproval({
  document,
  snapshot,
  user,
  input,
  now,
  session,
}) {
  if (idString(document.createdBy) === idString(user._id)) {
    throw selfApprovalError();
  }
  if (
    snapshot.submittedBy &&
    idString(snapshot.submittedBy) === idString(user._id)
  ) {
    throw selfApprovalError();
  }
  if (!snapshot.submittedBy) {
    throw stateError("Lần gửi hiện tại thiếu người gửi");
  }
  let decision = input.decision;
  let status;
  let lines = [];
  const generalReason = input.reason?.trim() || null;
  if (decision === "APPROVE") {
    if (!input.lines.length) {
      throw reviewQuantityError("Duyệt yêu cầu phải gửi lượng duyệt từng dòng");
    }
    const snapshotById = new Map(
      snapshot.lines.map((line) => [idString(line.lineId), line]),
    );
    const submittedById = new Map();
    for (const line of input.lines) {
      const lineId = idString(line.lineId);
      if (submittedById.has(lineId)) {
        throw reviewQuantityError("Dòng duyệt bị lặp");
      }
      const requested = snapshotById.get(lineId);
      if (!requested) {
        throw reviewQuantityError("Dòng duyệt không thuộc lần gửi hiện tại");
      }
      submittedById.set(lineId, line);
    }
    if (submittedById.size !== snapshot.lines.length) {
      throw reviewQuantityError("Phải duyệt đủ toàn bộ dòng đã gửi");
    }
    const productIds = [
      ...new Set(snapshot.lines.map((line) => idString(line.productId))),
    ];
    const products = await withSession(
      Product.find({ _id: { $in: productIds } }).lean(),
      session,
    );
    const productById = new Map(
      products.map((product) => [idString(product._id), product]),
    );
    let positive = 0;
    for (const requested of snapshot.lines) {
      const product = productById.get(idString(requested.productId));
      if (!product) {
        throw stateError("Sản phẩm của lần gửi không còn tồn tại để duyệt");
      }
      const payload = submittedById.get(idString(requested.lineId));
      const approved = new ExactDecimal(payload.approvedQtyBase);
      const requestedQty = new ExactDecimal(requested.qtyBase.toString());
      if (
        approved.isNegative() ||
        approved.gt(requestedQty) ||
        (product.wholeBaseUnits && !approved.isInteger())
      ) {
        throw reviewQuantityError(
          "Lượng duyệt phải nằm trong khoảng đề nghị và đúng độ hạt",
        );
      }
      if (approved.gt(0)) positive += 1;
      const lineReason = payload.reason?.trim() || null;
      if (approved.lt(requestedQty) && !lineReason) {
        throw reviewQuantityError(
          "Dòng bị giảm hoặc bằng 0 phải có lý do riêng",
        );
      }
      lines.push({
        lineId: requested.lineId,
        approvedQty: approved.toString(),
        outcome: approved.lte(0) ? "REJECT" : "APPROVE",
        ...(lineReason && { reason: lineReason }),
      });
    }
    if (!positive) {
      throw reviewQuantityError(
        "Phải duyệt dương ít nhất một dòng; dùng REJECT nếu từ chối toàn bộ",
      );
    }
    status = "APPROVED";
  } else {
    if (input.lines.length) {
      throw reviewQuantityError("Từ chối hoặc trả sửa không nhận lượng duyệt");
    }
    if (!generalReason) {
      throw validationError("Từ chối hoặc trả sửa bắt buộc có lý do chung");
    }
    status = decision === "REJECT" ? "REJECTED" : "REVISION_REQUIRED";
    decision = input.decision;
    lines = [];
  }
  const approval = await new Approval({
    documentId: document._id,
    documentVersion: document.version,
    decisionKind: APPROVAL_KIND,
    decision,
    requestedBy: snapshot.submittedBy,
    decidedBy: user._id,
    decidedAt: now,
    ...(generalReason && { reason: generalReason }),
    lines,
  }).save({ session });
  return { approval, status };
}
```

</details>

<a id="fn-142"></a>

## reviewReplenishment()

**Code:** [replenishment.commands.js:1033](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:1033).

**Tham số:** `reviewReplenishment(user, id, input)`.

**Công việc:** Duyệt RR đang chờ theo đúng nội dung đã gửi.

**Xử lý theo thứ tự:**

1. Kiểm chủ cửa hàng; đọc phiếu và cấm tự duyệt, kiểm operation replay.
2. Yêu cầu SUBMITTED/đúng version; đọc ReplenishmentSubmission cùng version.
3. appendApproval rồi cập nhật trạng thái với filter SUBMITTED/version.
4. Save operation và audit; không tăng version nội dung tại bước review.

**Ai gọi / gọi tiếp:** Được gọi bởi [review()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-151). Gọi tiếp [requireApprover()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-112), [operationKeyHash()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-120), [sha256Json()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-315), [reviewPayload()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-134), [withSession()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-114), [notFoundError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-325), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [selfApprovalError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-116), [findOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-123), [assertReplay()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-124), [stateError()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-115), [versionConflict()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-328), [appendApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-141), [appendAudit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-302), [commandResult()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-122), [isUnknownCommit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-137), [replayCommand()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-136).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `BusinessDocument`, tại [dòng 1042](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:1042). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.findOne({
          _id: id,
          documentKind: "REPLENISHMENT",
        }).lean()
```

- Đọc một bản ghi qua `ReplenishmentSubmission`, tại [dòng 1073](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:1073). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ReplenishmentSubmission.findOne({
          documentId: document._id,
          documentVersion: document.version,
        }).lean()
```

- Cập nhật rồi lấy bản ghi kết quả qua `BusinessDocument`, tại [dòng 1093](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:1093). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.findOneAndUpdate(
        {
          _id: document._id,
          documentKind: "REPLENISHMENT",
          workflowStatus: "SUBMITTED",
          version: input.expectedVersion,
        },
        { $set: { workflowStatus: status } },
        { returnDocument: "after", session },
      ).lean()
```

- Ghi đối tượng model đã tạo qua `BusinessOperation`, tại [dòng 1109](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:1109). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
new BusinessOperation({
        documentId: document._id,
        operation: operationName,
        operationKey: key,
        idempotencyKey: key,
        payloadHash: hash,
        documentVersion: document.version,
        performedBy: user._id,
        result: {
          workflowStatus: status,
          approvalId: approval._id,
        },
      }).save({ session })
```

**Các bước ghi được giao cho helper, với model/đối số cụ thể tại đây:**

- `appendAudit` → `AuditEvent`:

```js
appendAudit({
        documentId: document._id,
        actorId: user._id,
        action: operationName,
        details: {
          operationId: idString(operation._id),
          approvalId: idString(approval._id),
          documentVersion: document.version,
          decision: input.decision,
          workflowStatus: status,
        },
        session,
      })
```

**Ví dụ:** Duyệt bản 2 gắn Approval bản 2; trả sửa rồi sửa/gửi lại mới sang bản khác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function reviewReplenishment(user, id, input) {
  requireApprover(user);
  const key = operationKeyHash(user, input.operationKey);
  const hash = sha256Json(reviewPayload(user, id, input));
  const operationName = "REVIEW_REPLENISHMENT";
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const document = await withSession(
        BusinessDocument.findOne({
          _id: id,
          documentKind: "REPLENISHMENT",
        }).lean(),
        session,
      );
      if (!document) {
        throw notFoundError("Không tìm thấy yêu cầu bổ sung hàng");
      }
      if (idString(document.createdBy) === idString(user._id)) {
        throw selfApprovalError();
      }
      const existingOperation = await findOperation(key, session);
      if (existingOperation) {
        return assertReplay(existingOperation, {
          user,
          operationName,
          documentId: document._id,
          hash,
        });
      }
      if (document.workflowStatus !== "SUBMITTED") {
        throw stateError("Chỉ yêu cầu đang chờ duyệt mới được review");
      }
      if (document.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          document.version,
        );
      }
      const snapshot = await withSession(
        ReplenishmentSubmission.findOne({
          documentId: document._id,
          documentVersion: document.version,
        }).lean(),
        session,
      );
      if (!snapshot) {
        throw stateError(
          "Không có snapshot của nội dung đã gửi; không thể review",
        );
      }
      const now = new Date();
      const { approval, status } = await appendApproval({
        document,
        snapshot,
        user,
        input,
        now,
        session,
      });
      const updated = await BusinessDocument.findOneAndUpdate(
        {
          _id: document._id,
          documentKind: "REPLENISHMENT",
          workflowStatus: "SUBMITTED",
          version: input.expectedVersion,
        },
        { $set: { workflowStatus: status } },
        { returnDocument: "after", session },
      ).lean();
      if (!updated) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          document.version,
        );
      }
      const operation = await new BusinessOperation({
        documentId: document._id,
        operation: operationName,
        operationKey: key,
        idempotencyKey: key,
        payloadHash: hash,
        documentVersion: document.version,
        performedBy: user._id,
        result: {
          workflowStatus: status,
          approvalId: approval._id,
        },
      }).save({ session });
      await appendAudit({
        documentId: document._id,
        actorId: user._id,
        action: operationName,
        details: {
          operationId: idString(operation._id),
          approvalId: idString(approval._id),
          documentVersion: document.version,
          decision: input.decision,
          workflowStatus: status,
        },
        session,
      });
      return commandResult(operation, false);
    }, transactionOptions);
  } catch (error) {
    if (error?.code === 11000 || isUnknownCommit(error)) {
      const replay = await replayCommand(user, key, operationName, id, hash);
      if (replay) return replay;
      throw stateError("Yêu cầu đã được review bởi thao tác khác");
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
```

</details>

<a id="fn-143"></a>

## getReplenishmentOptions()

**Code:** [replenishment.commands.js:1149](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:1149).

**Tham số:** `getReplenishmentOptions(user, mode)`.

**Công việc:** Cấp kho để tạo hoặc lọc RR theo mục đích.

**Xử lý theo thứ tự:**

1. mode CREATE cần quyền create/update của kho/bán hàng, chỉ tìm kho assigned active.
2. mode FILTER cần quyền đọc; chủ thấy mọi kho, vai trò khác chỉ assigned, kể cả kho inactive để đọc lịch sử.
3. Map từng Warehouse.

**Ai gọi / gọi tiếp:** Được gọi bởi [options()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-147). Gọi tiếp [hasPermission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-294), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311), [requireReader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-113), [isOwner()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-296).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `Warehouse`, tại [dòng 1163](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:1163). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.find({
      _id: {
        $in: (user.warehouseIds || []).map(
          (warehouseId) => new mongoose.Types.ObjectId(idString(warehouseId)),
        ),
      },
      isActive: true,
    })
      .select("_id code name isActive")
      .sort({ code: 1 })
      .lean()
```

- Đọc nhiều bản ghi qua `Warehouse`, tại [dòng 1186](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:1186). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.find(filter)
    .select("_id code name isActive")
    .sort({ code: 1 })
    .lean()
```

**Ví dụ:** KhoA đã inactive không xuất hiện khi tạo nhưng vẫn có thể xuất hiện ở bộ lọc lịch sử.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getReplenishmentOptions(user, mode) {
  if (mode === "CREATE") {
    const allowed =
      hasPermission(user, "replenishment_request:create", [
        "WAREHOUSE",
        "SALES",
      ]) ||
      hasPermission(user, "replenishment_request:update", [
        "WAREHOUSE",
        "SALES",
      ]);
    if (!allowed) {
      throw new ApiError(403, "Bạn không có quyền tạo yêu cầu bổ sung hàng");
    }
    const warehouses = await Warehouse.find({
      _id: {
        $in: (user.warehouseIds || []).map(
          (warehouseId) => new mongoose.Types.ObjectId(idString(warehouseId)),
        ),
      },
      isActive: true,
    })
      .select("_id code name isActive")
      .sort({ code: 1 })
      .lean();
    return { warehouses: warehouses.map(mapWarehouse) };
  }
  requireReader(user);
  const filter = isOwner(user)
    ? {}
    : {
        _id: {
          $in: (user.warehouseIds || []).map(
            (warehouseId) => new mongoose.Types.ObjectId(idString(warehouseId)),
          ),
        },
      };
  const warehouses = await Warehouse.find(filter)
    .select("_id code name isActive")
    .sort({ code: 1 })
    .lean();
  return { warehouses: warehouses.map(mapWarehouse) };
}
```

</details>

<a id="fn-144"></a>

## mapWarehouse()

**Code:** [replenishment.commands.js:1193](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.commands.js:1193).

**Tham số:** `mapWarehouse(warehouse)`.

**Công việc:** Chuyển hồ sơ kho thành dữ liệu chọn/hiển thị.

**Xử lý theo thứ tự:**

1. Giữ mã, code, name và trạng thái hoạt động.
2. Không tự thêm kho ngoài danh sách service đã cho phép.

**Ai gọi / gọi tiếp:** Chưa ghi nhận lời gọi trực tiếp bằng tên trong tập file rà; có thể được truyền làm callback hoặc gọi từ ngoài phạm vi. Xem bảng route và code. Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-311).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Danh sách kho tạo yêu cầu chỉ có kho được giao đang hoạt động.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function mapWarehouse(warehouse) {
  return {
    id: idString(warehouse._id),
    code: warehouse.code,
    name: warehouse.name,
    isActive: warehouse.isActive,
  };
}
```

</details>

<a id="fn-145"></a>

## listReplenishments()

**Code:** [replenishment.controller.js:6](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.controller.js:6).

**Tham số:** `listReplenishments(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới listReplenishments và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ listReplenishments hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/replenishments` ([route dòng 18](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:18)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [listReplenishments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-170), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `BusinessDocument.aggregate`, `User.find`, `Warehouse.find`, `Product.find`, `ProductUomVersion.find`, `Uom.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do listReplenishments quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
listReplenishments = catchAsync(async (req, res) => {
  const data = await service.listReplenishments(req.user, req.validated.query);
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-146"></a>

## getReplenishment()

**Code:** [replenishment.controller.js:11](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.controller.js:11).

**Tham số:** `getReplenishment(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới getReplenishment và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ getReplenishment hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/replenishments/:id` ([route dòng 54](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:54)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `BusinessDocument.findOne`, `DocumentLine.find`, `Approval.find`, `ReplenishmentSubmission.countDocuments`, `User.find`, `Warehouse.find`, `Product.find`, `ProductUomVersion.find`, `Uom.find`, `Warehouse.findOne`, `Party.findOne`, `Location.find`, `Lot.find`, `StockAccount.find`, `LocationLock.find`, `StockBalance.find`, `Reservation.find`, `DefectHold.find`, `DocumentLink.find`, `LineLink.find`, `BusinessDocument.find`, `DemandSupplyAllocation.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do getReplenishment quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
getReplenishment = catchAsync(async (req, res) => {
  const data = await service.getReplenishment(
    req.user,
    req.validated.params.id,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-147"></a>

## options()

**Code:** [replenishment.controller.js:19](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.controller.js:19).

**Tham số:** `options(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới getReplenishmentOptions và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ getReplenishmentOptions hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/replenishments/options` ([route dòng 13](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:13)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [getReplenishmentOptions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-143), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `Warehouse.find`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do getReplenishmentOptions quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
options = catchAsync(async (req, res) => {
  const data = await commands.getReplenishmentOptions(
    req.user,
    req.validated.query.mode,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-148"></a>

## create()

**Code:** [replenishment.controller.js:27](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.controller.js:27).

**Tham số:** `create(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới createReplenishment và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ createReplenishment hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `POST /api/replenishments` ([route dòng 24](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:24)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [createReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-138), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `BusinessDocument.findOne`, `BusinessDocument.save`, `DocumentLine.save`, `BusinessOperation.save`, `BusinessOperation.findOne`, `Warehouse.findById`, `Product.find`, `ProductUomVersion.find`, `Uom.find`, `ReplenishmentSubmission.save`, `AuditEvent.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do createReplenishment quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
create = catchAsync(async (req, res) => {
  const data = await commands.createReplenishment(
    req.user,
    req.validated.body,
  );
  formatApiResponse(res, {
    statusCode: data.replayed ? 200 : 201,
    message: data.replayed
      ? "Yêu cầu đã được lưu trước đó"
      : data.workflowStatus === "SUBMITTED"
        ? "Gửi yêu cầu bổ sung hàng thành công"
        : "Lưu nháp yêu cầu bổ sung hàng thành công",
    data,
  });
})
```

</details>

<a id="fn-149"></a>

## update()

**Code:** [replenishment.controller.js:43](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.controller.js:43).

**Tham số:** `update(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới updateReplenishment và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ updateReplenishment hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `PUT /api/replenishments/:id` ([route dòng 60](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:60)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [updateReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-139), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `DocumentLine.find`, `BusinessDocument.findOneAndUpdate`, `ReplenishmentLine.updateOne`, `DocumentLine.save`, `BusinessOperation.save`, `BusinessDocument.findOne`, `BusinessOperation.findOne`, `Warehouse.findById`, `Product.find`, `ProductUomVersion.find`, `Uom.find`, `AuditEvent.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do updateReplenishment quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
update = catchAsync(async (req, res) => {
  const data = await commands.updateReplenishment(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, {
    message: "Cập nhật yêu cầu bổ sung hàng thành công",
    data,
  });
})
```

</details>

<a id="fn-150"></a>

## submit()

**Code:** [replenishment.controller.js:55](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.controller.js:55).

**Tham số:** `submit(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới submitReplenishment và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ submitReplenishment hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `POST /api/replenishments/:id/submit` ([route dòng 42](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:42)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [submitReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-140), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `DocumentLine.find`, `BusinessDocument.findOneAndUpdate`, `BusinessOperation.save`, `BusinessDocument.findOne`, `BusinessOperation.findOne`, `Warehouse.findById`, `Product.find`, `ProductUomVersion.find`, `Uom.find`, `ReplenishmentSubmission.save`, `AuditEvent.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do submitReplenishment quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
submit = catchAsync(async (req, res) => {
  const data = await commands.submitReplenishment(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, {
    message: data.replayed
      ? "Yêu cầu đã được gửi trước đó"
      : "Gửi yêu cầu bổ sung hàng thành công",
    data,
  });
})
```

</details>

<a id="fn-151"></a>

## review()

**Code:** [replenishment.controller.js:69](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.controller.js:69).

**Tham số:** `review(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới reviewReplenishment và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ reviewReplenishment hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `POST /api/replenishments/:id/review` ([route dòng 48](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:48)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [reviewReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-142), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `BusinessDocument.findOne`, `ReplenishmentSubmission.findOne`, `BusinessDocument.findOneAndUpdate`, `BusinessOperation.save`, `BusinessOperation.findOne`, `Product.find`, `Approval.save`, `AuditEvent.save`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do reviewReplenishment quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
review = catchAsync(async (req, res) => {
  const data = await commands.reviewReplenishment(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, {
    message: "Ghi nhận quyết định duyệt yêu cầu thành công",
    data,
  });
})
```

</details>

<a id="fn-152"></a>

## submissions()

**Code:** [replenishment.controller.js:81](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.controller.js:81).

**Tham số:** `submissions(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới listReplenishmentSubmissions và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ listReplenishmentSubmissions hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/replenishments/:id/submissions` ([route dòng 30](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:30)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [listReplenishmentSubmissions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-178), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `ReplenishmentSubmission.find`, `ReplenishmentSubmission.countDocuments`, `User.find`, `Warehouse.find`, `BusinessDocument.findOne`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do listReplenishmentSubmissions quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
submissions = catchAsync(async (req, res) => {
  const data = await service.listReplenishmentSubmissions(
    req.user,
    req.validated.params.id,
    req.validated.query,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-153"></a>

## submission()

**Code:** [replenishment.controller.js:90](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.controller.js:90).

**Tham số:** `submission(req, res)`.

**Công việc:** Nhận yêu cầu từ route, chuyển dữ liệu tới getReplenishmentSubmission và gửi kết quả về bên gọi.

**Xử lý theo thứ tự:**

1. Truyền req.user đã xác thực xuống service; những phần req.validated được dùng thể hiện đúng trong code bên dưới.
2. Đợi hàm nghiệp vụ getReplenishmentSubmission hoàn tất. Lỗi được catchAsync chuyển tới bộ trả lỗi chung.
3. Gói data bằng formatApiResponse; lệnh tạo có thể trả mã 201, đọc/cập nhật thường trả 200.

**Đường dẫn gọi tới hàm này:** `GET /api/replenishments/:id/submissions/:version` ([route dòng 36](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:36)).

**Ai gọi / gọi tiếp:** Được route ở trên gọi hoặc chuyển làm hàm xử lý. Gọi tiếp [getReplenishmentSubmission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-179), [formatApiResponse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/01-shared.md#fn-331).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Đi tới cơ sở dữ liệu qua hàm khác:** `ReplenishmentSubmission.findOne`, `User.findById`, `Approval.findOne`, `User.find`, `BusinessDocument.findOne`. Đây là các đường có thể đi tới, không phải mọi nhánh đều thực hiện tất cả các lệnh.

**Ví dụ:** Mở hoặc lưu hồ sơ qua API: controller chỉ chuyển yêu cầu; điều kiện được phép và dữ liệu ghi do getReplenishmentSubmission quyết định.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
submission = catchAsync(async (req, res) => {
  const data = await service.getReplenishmentSubmission(
    req.user,
    req.validated.params.id,
    req.validated.params.version,
  );
  formatApiResponse(res, { data });
})
```

</details>

<a id="fn-154"></a>

## decimalString()

**Code:** [replenishment.mapper.js:3](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.mapper.js:3).

**Tham số:** `decimalString(value)`.

**Công việc:** Đổi giá trị thập phân đang có sang chuỗi để trả API.

**Xử lý theo thứ tự:**

1. Nếu null hoặc không có thì giữ null.
2. Ngược lại gọi toString, không nhân hay làm tròn.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-160), [mapLine()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-161), [mapEvaluationSnapshot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-163), [mapRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-173), [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175), [getReplenishmentSubmission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-179). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Decimal 128 của 100 trả chuỗi 100; thiếu dữ liệu trả null, không tự đổi thành 0.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
decimalString = (value) =>
  value == null ? null : value.toString()
```

</details>

<a id="fn-155"></a>

## isoDate()

**Code:** [replenishment.mapper.js:5](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.mapper.js:5).

**Tham số:** `isoDate(value)`.

**Công việc:** Đổi ngày/thời điểm đang có thành chuỗi ISO.

**Xử lý theo thứ tự:**

1. Không có giá trị thì trả null.
2. Có giá trị thì tạo Date và gọi toISOString.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapHeader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-159), [mapApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-160), [mapEvaluationSnapshot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-163), [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175), [mapSubmissionSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-177). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Một thời điểm lưu UTC được trả rõ múi giờZ; helper không áp bộ lọc ngày Việt Nam.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
isoDate = (value) =>
  value == null ? null : new Date(value).toISOString()
```

</details>

<a id="fn-156"></a>

## indexById()

**Code:** [replenishment.mapper.js:7](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.mapper.js:7).

**Tham số:** `indexById(items)`.

**Công việc:** Lập bảng tra mã→đối tượng từ danh sách đã đọc.

**Xử lý theo thứ tự:**

1. Duyệt mảng và lấy _id đã chuẩn hóa làm khóa.
2. Trả Map để các mapper lấy nhanh theo mã.

**Ai gọi / gọi tiếp:** Được gọi bởi [loadMasters()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-169), [loadRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-171), [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175), [listReplenishmentSubmissions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-178). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Đọc 10 người dùng một lần, sau đó tra tên người lập của từng phiếu từ Map.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
indexById = (items) =>
  new Map(items.map((item) => [idString(item._id), item]))
```

</details>

<a id="fn-157"></a>

## mapUser()

**Code:** [replenishment.mapper.js:10](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.mapper.js:10).

**Tham số:** `mapUser(value, users)`.

**Công việc:** Gắn tên người dùng từ bảng tra đã có.

**Xử lý theo thứ tự:**

1. Không có mã thì trả null.
2. Lấy người trong Map; trả id và fullName, tên thiếu thì null.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapHeader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-159), [mapApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-160), [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175), [mapSubmissionSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-177). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Hồ sơ lịch sử có mã người lập nhưng danh mục không còn tên: vẫn giữ mã, không bịa tên.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapUser(value, users) {
  if (value == null) return null;
  const user = users.get(idString(value));
  return { id: idString(value), fullName: user?.fullName ?? null };
}
```

</details>

<a id="fn-158"></a>

## mapUom()

**Code:** [replenishment.mapper.js:16](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.mapper.js:16).

**Tham số:** `mapUom(value, uoms)`.

**Công việc:** Gắn mã và tên đơn vị từ bảng tra đã có.

**Xử lý theo thứ tự:**

1. Chuẩn hóa mã đơn vị.
2. Tra Map; trả id/code/name, phần thiếu để null.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapLine()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-161). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101).

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

<a id="fn-159"></a>

## mapHeader()

**Code:** [replenishment.mapper.js:26](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.mapper.js:26).

**Tham số:** `mapHeader(document, masters)`.

**Công việc:** Đổi phần chung RR thành kết quả dùng ở danh sách/chi tiết.

**Xử lý theo thứ tự:**

1. Tra kho từ masters, giữ số phiếu/status/version.
2. Gắn người tạo và thời điểm, ngày cần; không đọc thêm database.

**Ai gọi / gọi tiếp:** Được gọi bởi [listReplenishments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-170), [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101), [mapUser()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-157), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-155).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Đổi tên kho hôm nay ảnh hưởng nhãn hiện tại, nhưng bản chụp lần gửi có tên kho riêng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapHeader(document, masters) {
  const warehouse = masters.warehouses.get(
    idString(document.header.warehouseId),
  );
  return {
    id: idString(document._id),
    documentNo: document.documentNo,
    workflowStatus: document.workflowStatus,
    version: document.version,
    warehouse: {
      id: idString(document.header.warehouseId),
      code: warehouse?.code ?? null,
      name: warehouse?.name ?? null,
    },
    createdBy: mapUser(document.createdBy, masters.users),
    createdAt: isoDate(document.createdAt),
    neededOn: isoDate(document.header.neededOn),
  };
}
```

</details>

<a id="fn-160"></a>

## mapApproval()

**Code:** [replenishment.mapper.js:46](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.mapper.js:46).

**Tham số:** `mapApproval(approval, documentVersion, users, includeLines = false)`.

**Công việc:** Trình bày quyết định và xác định nó có áp vào phiên bản hiện tại không.

**Xử lý theo thứ tự:**

1. Không có approval thì null.
2. So documentVersion với phiên bản hiện tại; gắn người yêu cầu/người duyệt.
3. Chỉ thêm lượng từng dòng nếu includeLines=true.

**Ai gọi / gọi tiếp:** Được gọi bởi [listReplenishments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-170), [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175), [getReplenishmentSubmission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-179). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101), [mapUser()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-157), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-155), [decimalString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-154).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Duyệt bản 2 vẫn hiện trong history của bản 4 nhưng isForCurrentVersion=false.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapApproval(
  approval,
  documentVersion,
  users,
  includeLines = false,
) {
  if (!approval) return null;
  return {
    id: idString(approval._id),
    documentVersion: approval.documentVersion,
    isForCurrentVersion: approval.documentVersion === documentVersion,
    decisionKind: approval.decisionKind,
    decision: approval.decision,
    requestedBy: mapUser(approval.requestedBy, users),
    decidedBy: mapUser(approval.decidedBy, users),
    decidedAt: isoDate(approval.decidedAt),
    reason: approval.reason,
    ...(includeLines && {
      lines: (approval.lines || []).map((line) => ({
        lineId: idString(line.lineId),
        approvedQtyBase: decimalString(line.approvedQty),
        outcome: line.outcome,
        reason: line.reason ?? null,
      })),
    }),
  };
}
```

</details>

<a id="fn-161"></a>

## mapLine()

**Code:** [replenishment.mapper.js:74](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.mapper.js:74).

**Tham số:** `mapLine(line, masters)`.

**Công việc:** Trình bày lượng/đơn vị và thông tin một dòng RR.

**Xử lý theo thứ tự:**

1. Tra Product/Conversion/Uom đã được đọc gom.
2. Tên ưu tiên snapshot trên dòng; lượng và hệ số trả chuỗi.
3. Trả riêng enteredQty, conversionSnapshot và qtyBase.

**Ai gọi / gọi tiếp:** Được gọi bởi [listReplenishments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-170), [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101), [decimalString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-154), [mapUom()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-158).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** 25 thùng hệ số 4 cho 100 viên; không tính lại bằng quy đổi mới 6.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapLine(line, masters) {
  const product = masters.products.get(idString(line.productId));
  const conversion = masters.conversions.get(idString(line.conversionId));
  return {
    id: idString(line._id),
    lineNo: line.lineNo,
    product: {
      id: idString(line.productId),
      sku: product?.sku ?? null,
      name: line.productNameSnapshot ?? product?.name ?? null,
      isActive: product?.isActive ?? null,
    },
    enteredQty: decimalString(line.enteredQty),
    enteredUom: mapUom(conversion?.uomId, masters.uoms),
    conversionId: idString(line.conversionId),
    conversionVersion: conversion?.version ?? null,
    conversionSnapshot: decimalString(line.conversionSnapshot),
    qtyBase: decimalString(line.qtyBase),
    baseUom: mapUom(product?.baseUomId, masters.uoms),
  };
}
```

</details>

<a id="fn-162"></a>

## mapSavedSource()

**Code:** [replenishment.mapper.js:120](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.mapper.js:120).

**Tham số:** `mapSavedSource(details = {})`.

**Công việc:** Trả các mã và phiên bản nguồn đã lưu trên dòng RR.

**Xử lý theo thứ tự:**

1. Lấy triggerType.
2. Đổi source IDs thành chuỗi, nguồn version thiếu để null.
3. Không giả tạo mã SO hoặc dữ liệu cảnh báo cho dòng thủ công.

**Ai gọi / gọi tiếp:** Được gọi bởi [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** MANUAL_OTHER có lý do riêng, không tự xuất hiện SO nguồn từ suy đoán.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapSavedSource(details = {}) {
  return {
    triggerType: details.triggerType ?? null,
    ...Object.fromEntries(
      sourceIds.map((key) => [key, idString(details[key])]),
    ),
    ...Object.fromEntries(
      sourceVersions.map((key) => [key, details[key] ?? null]),
    ),
  };
}
```

</details>

<a id="fn-163"></a>

## mapEvaluationSnapshot()

**Code:** [replenishment.mapper.js:132](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.mapper.js:132).

**Tham số:** `mapEvaluationSnapshot(details = {})`.

**Công việc:** Trình bày những lượng đánh giá đã lưu ở thời điểm đánh giá.

**Xử lý theo thứ tự:**

1. Lấy evaluationKey/time/suggestedQty.
2. Đổi các lượng snapshot sang chuỗi; trường không có vẫn null.
3. Không tính lại thiếu hàng hiện tại.

**Ai gọi / gọi tiếp:** Được gọi bởi [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175). Gọi tiếp [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-155), [decimalString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-154).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Dòng manual mới không có đánh giá thì trả null, không bịa suggestedQty từ lượng đề nghị.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapEvaluationSnapshot(details = {}) {
  return {
    evaluationKey: details.evaluationKey ?? null,
    evaluatedAt: isoDate(details.evaluatedAt),
    suggestedQtyBase: decimalString(details.suggestedQty),
    ...Object.fromEntries(
      snapshotFields.map((key) => [
        `${key}Base`,
        decimalString(details[`${key}Snapshot`]),
      ]),
    ),
  };
}
```

</details>

<a id="fn-164"></a>

## mapRelatedReference()

**Code:** [replenishment.mapper.js:146](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.mapper.js:146).

**Tham số:** `mapRelatedReference(id, expectedKind, documents, user)`.

**Công việc:** Trả tham chiếu đầy đủ chỉ khi đúng loại và được đọc hồ sơ nguồn.

**Xử lý theo thứ tự:**

1. Lấy document từ Map theo mã; mặc định UNAVAILABLE.
2. Kiểm expectedKind và canReadRelated.
3. Nếu đạt thêm số phiếu/trạng thái/version và READABLE.

**Ai gọi / gọi tiếp:** Được gọi bởi [sourceReferences()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-172), [mapRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-173). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101), [canReadRelated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-106).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Người dùng vẫn biết có saved reference nhưng không thấy nội dung nguồn ngoài quyền.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function mapRelatedReference(id, expectedKind, documents, user) {
  const document = documents.get(idString(id));
  const base = {
    id: idString(id),
    documentKind: expectedKind,
    access: "UNAVAILABLE",
  };
  if (
    !document ||
    (expectedKind && document.documentKind !== expectedKind) ||
    !canReadRelated(document, user)
  )
    return base;
  return {
    ...base,
    documentKind: document.documentKind,
    access: "READABLE",
    documentNo: document.documentNo,
    workflowStatus: document.workflowStatus,
    version: document.version,
  };
}
```

</details>

<a id="fn-165"></a>

## distinctIds()

**Code:** [replenishment.service.js:43](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:43).

**Tham số:** `distinctIds(values)`.

**Công việc:** Loại mã trùng/rỗng trước khi đọc gom.

**Xử lý theo thứ tự:**

1. Bỏ null, đổi mã qua idString, đưa vào Set rồi trả mảng.

**Ai gọi / gọi tiếp:** Được gọi bởi [loadMasters()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-169), [loadRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-171), [mapRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-173), [listReplenishmentSubmissions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-178), [getReplenishmentSubmission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-179). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** 20 dòng cùng gạch A chỉ cần một mãA trong truy vấn master.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
distinctIds = (values) => [
  ...new Set(values.filter((value) => value != null).map(idString)),
]
```

</details>

<a id="fn-166"></a>

## escapeRegex()

**Code:** [replenishment.service.js:46](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:46).

**Tham số:** `escapeRegex(value)`.

**Công việc:** Biến từ khóa thành chữ cần tìm, tránh ký tự có nghĩa đặc biệt trong mẫu tìm kiếm.

**Xử lý theo thứ tự:**

1. Thêm dấu bảo vệ trước các ký tự đặc biệt của biểu thức tìm kiếm.
2. Trả chuỗi đã bảo vệ; bên gọi mới tạo RegExp hoặc bộ lọc MongoDB.

**Ai gọi / gọi tiếp:** Được gọi bởi [buildListPipeline()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-168). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Tìm A+B là tìm dấu cộng thật, không hiểu + như một phép lặp.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
```

</details>

<a id="fn-167"></a>

## latestApprovalLookup()

**Code:** [replenishment.service.js:48](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:48).

**Tham số:** `latestApprovalLookup()`.

**Công việc:** Tạo các bước ghép quyết định gần nhất cho mỗi RR.

**Xử lý theo thứ tự:**

1. Tạo $lookup từ approvals theo documentId và decisionKind RR.
2. Sắp documentVersion/decidedAt/_id giảm dần, lấy 1 rồi đặt _latestApproval.
3. Chỉ trả pipeline; aggregate của bên gọi mới thực hiện đọc.

**Ai gọi / gọi tiếp:** Được gọi bởi [buildListPipeline()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-168). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Lọc quyết định REVISE phải lấy quyết định gần nhất, không khớp một lần revise rất cũ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function latestApprovalLookup() {
  return [
    {
      $lookup: {
        from: Approval.collection.name,
        let: { documentId: "$_id" },
        pipeline: [
          {
            $match: {
              decisionKind: APPROVAL_KIND,
              $expr: { $eq: ["$documentId", "$$documentId"] },
            },
          },
          { $sort: approvalSort },
          { $limit: 1 },
        ],
        as: "_approvals",
      },
    },
    {
      $set: {
        _latestApproval: {
          $ifNull: [{ $arrayElemAt: ["$_approvals", 0] }, null],
        },
      },
    },
    { $unset: "_approvals" },
  ];
}
```

</details>

<a id="fn-168"></a>

## buildListPipeline()

**Code:** [replenishment.service.js:78](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:78).

**Tham số:** `buildListPipeline(user, query)`.

**Công việc:** Dựng thứ tự lọc/đếm/chia trang danh sách RR.

**Xử lý theo thứ tự:**

1. Lấy replenishmentScope; kiểm kho chọn rồi ghép tìm mã/người/trạng thái/ngày.
2. Nếu lọc decision thì ghép latest approval và lọc trước đếm.
3. Nếu có hasPurchaseOrder hoặc alias poCreated: ưu tiên hasPurchaseOrder; lookup dòng RR hiện hành→LineLink quan hệ PURCHASE và DocumentLink nguồn RR→PO. Lọc có/không liên kết trước facet đếm/chia trang. Trên từng item cũng lookup tối đa1 liên kết để trả cờ hiện diện.
4. Tạo $facet: total đếm tất cả khớp, items chia trang và lấy preview 3 dòng hiện hành/count dòng.

**Ai gọi / gọi tiếp:** Được gọi bởi [listReplenishments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-170). Gọi tiếp [replenishmentScope()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-105), [canAccessWarehouse()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-104), [objectId()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-102), [escapeRegex()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-166), [creationDateRange()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-181), [latestApprovalLookup()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-167).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Kết quả / nhánh bị chặn:** Bộ lọc kiểm sự hiện diện của link mua, không join để chứng minh PO đã OPEN/POSTED hoặc còn hợp lệ. Một PO nháp có link đã có thể làm cờ true; hasPurchaseOrder được ưu tiên nếu gửi cả hai tên.

**Ví dụ:** Tìm phiếu bị trả sửa: tổng phải tính sau lọc quyết định, không chỉ lọc trên 10 mục của trang.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function buildListPipeline(user, query) {
  const scope = replenishmentScope(user);
  if (query.warehouseId) {
    if (!canAccessWarehouse(user, query.warehouseId)) {
      throw new ApiError(403, "Bạn không có quyền xem kho này");
    }
    scope["header.warehouseId"] = objectId(query.warehouseId);
  }
  const filters = {};
  if (query.createdBy) filters.createdBy = objectId(query.createdBy);
  if (query.status) filters.workflowStatus = query.status;
  if (query.search)
    filters.documentNo = { $regex: escapeRegex(query.search), $options: "i" };
  const range = creationDateRange(query);
  if (range) filters.createdAt = range;
  const pipeline = [
    { $match: { $and: [scope, filters] } },
    { $sort: { createdAt: -1, _id: -1 } },
  ];
  if (query.approvalDecision) {
    pipeline.push(...latestApprovalLookup(), {
      $match:
        query.approvalDecision === "NONE"
          ? { _latestApproval: null }
          : { "_latestApproval.decision": query.approvalDecision },
    });
  }
  const poFilter =
    query.hasPurchaseOrder !== undefined
      ? query.hasPurchaseOrder
      : query.poCreated;
  if (poFilter !== undefined) {
    pipeline.push(
      {
        $lookup: {
          from: DocumentLine.collection.name,
          let: { docId: "$_id" },
          pipeline: [
            {
              $match: {
                lineKind: "REPLENISHMENT",
                "details.removedAt": null,
                $expr: { $eq: ["$documentId", "$$docId"] },
              },
            },
            {
              $lookup: {
                from: LineLink.collection.name,
                let: { lineId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      relationCode: REPLENISHMENT_RELATIONS.PURCHASE,
                      $expr: { $eq: ["$sourceLineId", "$$lineId"] },
                    },
                  },
                ],
                as: "_poLinks",
              },
            },
            {
              $match: {
                "_poLinks.0": { $exists: true },
              },
            },
          ],
          as: "_linesWithPo",
        },
      },
      {
        $lookup: {
          from: DocumentLink.collection.name,
          let: { docId: "$_id" },
          pipeline: [
            {
              $match: {
                relationCode: REPLENISHMENT_RELATIONS.PURCHASE,
                $expr: { $eq: ["$parentDocumentId", "$$docId"] },
              },
            },
          ],
          as: "_docPoLinks",
        },
      },
      {
        $match: poFilter
          ? {
              $or: [
                { "_linesWithPo.0": { $exists: true } },
                { "_docPoLinks.0": { $exists: true } },
              ],
            }
          : {
              "_linesWithPo.0": { $exists: false },
              "_docPoLinks.0": { $exists: false },
            },
      },
    );
  }
  pipeline.push({
    $facet: {
      items: [
        { $skip: (query.page - 1) * query.limit },
        { $limit: query.limit },
        ...(!query.approvalDecision ? latestApprovalLookup() : []),
        {
          $lookup: {
            from: DocumentLine.collection.name,
            let: { documentId: "$_id" },
            pipeline: [
              {
                $match: {
                  lineKind: "REPLENISHMENT",
                  "details.removedAt": null,
                  $expr: { $eq: ["$documentId", "$$documentId"] },
                },
              },
              { $sort: { lineNo: 1 } },
              { $limit: 3 },
            ],
            as: "_linePreview",
          },
        },
        {
          $lookup: {
            from: DocumentLine.collection.name,
            let: { documentId: "$_id" },
            pipeline: [
              {
                $match: {
                  lineKind: "REPLENISHMENT",
                  "details.removedAt": null,
                  $expr: { $eq: ["$documentId", "$$documentId"] },
                },
              },
              { $count: "value" },
            ],
            as: "_lineCount",
          },
        },
        {
          $lookup: {
            from: DocumentLine.collection.name,
            let: { docId: "$_id" },
            pipeline: [
              {
                $match: {
                  lineKind: "REPLENISHMENT",
                  "details.removedAt": null,
                  $expr: { $eq: ["$documentId", "$$docId"] },
                },
              },
              {
                $lookup: {
                  from: LineLink.collection.name,
                  let: { lineId: "$_id" },
                  pipeline: [
                    {
                      $match: {
                        relationCode: REPLENISHMENT_RELATIONS.PURCHASE,
                        $expr: { $eq: ["$sourceLineId", "$$lineId"] },
                      },
                    },
                  ],
                  as: "_poLinks",
                },
              },
              {
                $match: {
                  "_poLinks.0": { $exists: true },
                },
              },
              { $limit: 1 },
            ],
            as: "_itemPoLines",
          },
        },
        {
          $lookup: {
            from: DocumentLink.collection.name,
            let: { docId: "$_id" },
            pipeline: [
              {
                $match: {
                  relationCode: REPLENISHMENT_RELATIONS.PURCHASE,
                  $expr: { $eq: ["$parentDocumentId", "$$docId"] },
                },
              },
              { $limit: 1 },
            ],
            as: "_itemDocPoLinks",
          },
        },
      ],
      total: [{ $count: "value" }],
    },
  });
  return pipeline;
}
```

</details>

<a id="fn-169"></a>

## loadMasters()

**Code:** [replenishment.service.js:278](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:278).

**Tham số:** `loadMasters(documents, lines, approvals = [])`.

**Công việc:** Đọc gom danh mục để trình bày RR.

**Xử lý theo thứ tự:**

1. Gom mã người, kho, sản phẩm, conversion từ các phiếu/dòng/quyết định.
2. Đọc User/Warehouse/Product/ProductUomVersion với các trường cần thiết.
3. Đọc Uom từ product baseUom và conversion uom; trả các Map.

**Ai gọi / gọi tiếp:** Được gọi bởi [listReplenishments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-170), [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175). Gọi tiếp [distinctIds()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-165), [indexById()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-156).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `User`, tại [dòng 284](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:284). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
User.find({ _id: { $in: userIds } })
      .select("_id fullName")
      .lean()
```

- Đọc nhiều bản ghi qua `Warehouse`, tại [dòng 287](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:287). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.find({
      _id: {
        $in: distinctIds(documents.map((item) => item.header?.warehouseId)),
      },
    })
      .select("_id code name")
      .lean()
```

- Đọc nhiều bản ghi qua `Product`, tại [dòng 294](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:294). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Product.find({
      _id: { $in: distinctIds(lines.map((item) => item.productId)) },
    })
      .select("_id sku name baseUomId isActive")
      .lean()
```

- Đọc nhiều bản ghi qua `ProductUomVersion`, tại [dòng 299](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:299). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ProductUomVersion.find({
      _id: { $in: distinctIds(lines.map((item) => item.conversionId)) },
    })
      .select("_id uomId version")
      .lean()
```

- Đọc nhiều bản ghi qua `Uom`, tại [dòng 305](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:305). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Uom.find({
    _id: {
      $in: distinctIds([
        ...products.map((item) => item.baseUomId),
        ...conversions.map((item) => item.uomId),
      ]),
    },
  })
    .select("_id code name")
    .lean()
```

**Ví dụ:** Một trang 10 phiếu không cần truy vấn tên kho riêng cho từng phiếu.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function loadMasters(documents, lines, approvals = []) {
  const userIds = distinctIds([
    ...documents.flatMap((item) => [item.createdBy, item.header?.submittedBy]),
    ...approvals.flatMap((item) => [item.requestedBy, item.decidedBy]),
  ]);
  const [users, warehouses, products, conversions] = await Promise.all([
    User.find({ _id: { $in: userIds } })
      .select("_id fullName")
      .lean(),
    Warehouse.find({
      _id: {
        $in: distinctIds(documents.map((item) => item.header?.warehouseId)),
      },
    })
      .select("_id code name")
      .lean(),
    Product.find({
      _id: { $in: distinctIds(lines.map((item) => item.productId)) },
    })
      .select("_id sku name baseUomId isActive")
      .lean(),
    ProductUomVersion.find({
      _id: { $in: distinctIds(lines.map((item) => item.conversionId)) },
    })
      .select("_id uomId version")
      .lean(),
  ]);
  const uoms = await Uom.find({
    _id: {
      $in: distinctIds([
        ...products.map((item) => item.baseUomId),
        ...conversions.map((item) => item.uomId),
      ]),
    },
  })
    .select("_id code name")
    .lean();
  return {
    users: indexById(users),
    warehouses: indexById(warehouses),
    products: indexById(products),
    conversions: indexById(conversions),
    uoms: indexById(uoms),
  };
}
```

</details>

<a id="fn-170"></a>

## listReplenishments()

**Code:** [replenishment.service.js:324](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:324).

**Tham số:** `listReplenishments(user, query)`.

**Công việc:** Chạy truy vấn danh sách RR và gắn nhãn dữ liệu.

**Xử lý theo thứ tự:**

1. Aggregate buildListPipeline và cho phép dùng đĩa nếu MongoDB cần.
2. Gom preview/approval để loadMasters.
3. Map header/preview/latestDecision và trả tổng/trang.
4. Trả hasPurchaseOrder và poCreated cùng giá trị boolean theo các link vừa lookup; không tự tính phần lượng RR đã mua đủ hay còn thiếu.

**Ai gọi / gọi tiếp:** Được gọi bởi [listReplenishments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-145). Gọi tiếp [buildListPipeline()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-168), [loadMasters()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-169), [mapHeader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-159), [mapLine()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-161), [mapApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-160).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Tổng hợp/lọc/ghép nhóm dữ liệu qua `BusinessDocument`, tại [dòng 325](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:325). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.aggregate(
    buildListPipeline(user, query),
  ).allowDiskUse(true)
```

**Ví dụ:** RR có một dòng đã liên kết PO nháp80 có thể hiện hasPurchaseOrder=true, dù RR được duyệt100 và PO chưa được confirm. Cờ này không có nghĩa đã nhận hàng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function listReplenishments(user, query) {
  const [result] = await BusinessDocument.aggregate(
    buildListPipeline(user, query),
  ).allowDiskUse(true);
  const documents = result?.items || [];
  const previews = documents.flatMap((item) => item._linePreview);
  const masters = await loadMasters(
    documents,
    previews,
    documents.map((item) => item._latestApproval).filter(Boolean),
  );
  return {
    items: documents.map((document) => ({
      ...mapHeader(document, masters),
      lineCount: document._lineCount[0]?.value ?? 0,
      linePreview: document._linePreview.map((line) => mapLine(line, masters)),
      hasPurchaseOrder: Boolean(
        document._linesWithPo?.length ||
          document._docPoLinks?.length ||
          document._itemPoLines?.length ||
          document._itemDocPoLinks?.length,
      ),
      poCreated: Boolean(
        document._linesWithPo?.length ||
          document._docPoLinks?.length ||
          document._itemPoLines?.length ||
          document._itemDocPoLinks?.length,
      ),
      latestDecision: mapApproval(
        document._latestApproval,
        document.version,
        masters.users,
      ),
    })),
    total: result?.total[0]?.value ?? 0,
    page: query.page,
    limit: query.limit,
  };
}
```

</details>

<a id="fn-171"></a>

## loadRelations()

**Code:** [replenishment.service.js:366](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:366).

**Tham số:** `loadRelations(document, lines, user)`.

**Công việc:** Đọc các liên kết nguồn và mua hàng đã lưu của RR.

**Xử lý theo thứ tự:**

1. Đọc DocumentLink/LineLink đúng các relation RR và các dòng nguồn đã tham chiếu.
2. Lấy dòng mua và WIR có nguồn SO; đọc gom các phiếu liên quan.
3. Chỉ công nhận dòng nhu cầu cùng SO/sản phẩm/chuỗi và được đọc; lập mã nhu cầu gốc.
4. Đọc reservation ACTIVE và allocation của nhu cầu đó; đọc nguồn cung và phiếu để trả quan hệ.

**Ai gọi / gọi tiếp:** Được gọi bởi [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175). Gọi tiếp [distinctIds()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-165), [sameId()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-103), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101), [indexById()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-156), [canReadRelated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-106).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `DocumentLink`, tại [dòng 369](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:369). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLink.find({
      $or: [
        { parentDocumentId: document._id },
        { childDocumentId: document._id },
      ],
      relationCode: { $in: Object.values(REPLENISHMENT_RELATIONS) },
    }).lean()
```

- Đọc nhiều bản ghi qua `LineLink`, tại [dòng 376](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:376). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
LineLink.find({
      $or: [
        { sourceLineId: { $in: rrLineIds } },
        { targetLineId: { $in: rrLineIds } },
      ],
      relationCode: { $in: Object.values(REPLENISHMENT_RELATIONS) },
    }).lean()
```

- Đọc nhiều bản ghi qua `DocumentLine`, tại [dòng 383](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:383). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.find({
      _id: {
        $in: distinctIds(
          lines.flatMap((line) => [
            line.details?.sourceSalesOrderLineId,
            line.details?.sourceIssueRequestLineId,
          ]),
        ),
      },
    }).lean()
```

- Đọc nhiều bản ghi qua `DocumentLine`, tại [dòng 400](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:400). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.find({
      _id: { $in: distinctIds(purchaseLinks.map((link) => link.targetLineId)) },
    }).lean()
```

- Đọc nhiều bản ghi qua `DocumentLine`, tại [dòng 403](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:403). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.find({
      lineKind: "ISSUE_REQUEST",
      "details.salesOrderLineId": {
        $in: sourceLines
          .filter((line) => line.lineKind === "SALES_ORDER")
          .map((line) => line._id),
      },
    }).lean()
```

- Đọc nhiều bản ghi qua `BusinessDocument`, tại [dòng 423](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:423). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.find({ _id: { $in: relatedDocumentIds } }).lean()
```

- Đọc nhiều bản ghi qua `Reservation`, tại [dòng 456](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:456). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Reservation.find({ demandLineId: { $in: demandIds }, status: "ACTIVE" })
      .sort({ _id: 1 })
      .lean()
```

- Đọc nhiều bản ghi qua `DemandSupplyAllocation`, tại [dòng 459](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:459). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DemandSupplyAllocation.find({ demandLineId: { $in: demandIds } })
      .sort({ _id: 1 })
      .lean()
```

- Đọc nhiều bản ghi qua `DocumentLine`, tại [dòng 464](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:464). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.find({
      _id: { $in: distinctIds(allocations.map((item) => item.supplyLineId)) },
    }).lean()
```

- Đọc nhiều bản ghi qua `BusinessDocument`, tại [dòng 468](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:468). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.find({
    _id: {
      $in: distinctIds(
        [...supplyLines.values()].map((line) => line.documentId),
      ),
    },
  }).lean()
```

**Kết quả / nhánh bị chặn:** Chỉ đọc saved facts; không đánh giá thiếu hoặc tạo phương án mua mới.

**Ví dụ:** RR manual mới không có SO nguồn thì không tự tạo demand hoặc allocation từ số lượng đề nghị.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function loadRelations(document, lines, user) {
  const rrLineIds = lines.map((line) => line._id);
  const [documentLinks, lineLinks, sourceLines] = await Promise.all([
    DocumentLink.find({
      $or: [
        { parentDocumentId: document._id },
        { childDocumentId: document._id },
      ],
      relationCode: { $in: Object.values(REPLENISHMENT_RELATIONS) },
    }).lean(),
    LineLink.find({
      $or: [
        { sourceLineId: { $in: rrLineIds } },
        { targetLineId: { $in: rrLineIds } },
      ],
      relationCode: { $in: Object.values(REPLENISHMENT_RELATIONS) },
    }).lean(),
    DocumentLine.find({
      _id: {
        $in: distinctIds(
          lines.flatMap((line) => [
            line.details?.sourceSalesOrderLineId,
            line.details?.sourceIssueRequestLineId,
          ]),
        ),
      },
    }).lean(),
  ]);
  const purchaseLinks = lineLinks.filter(
    (link) =>
      link.relationCode === REPLENISHMENT_RELATIONS.PURCHASE &&
      rrLineIds.some((id) => sameId(id, link.sourceLineId)),
  );
  const [purchaseLines, wirLines] = await Promise.all([
    DocumentLine.find({
      _id: { $in: distinctIds(purchaseLinks.map((link) => link.targetLineId)) },
    }).lean(),
    DocumentLine.find({
      lineKind: "ISSUE_REQUEST",
      "details.salesOrderLineId": {
        $in: sourceLines
          .filter((line) => line.lineKind === "SALES_ORDER")
          .map((line) => line._id),
      },
    }).lean(),
  ]);
  const relatedDocumentIds = distinctIds([
    ...documentLinks.flatMap((link) => [
      link.parentDocumentId,
      link.childDocumentId,
    ]),
    ...sourceLines.map((line) => line.documentId),
    ...wirLines.map((line) => line.documentId),
    ...purchaseLines.map((line) => line.documentId),
    ...lines.map((line) => line.details?.sourceStocktakeId),
  ]).filter((id) => id !== idString(document._id));
  const documents = indexById(
    await BusinessDocument.find({ _id: { $in: relatedDocumentIds } }).lean(),
  );
  const sources = indexById(sourceLines);
  const canonical = new Map();
  for (const rrLine of lines) {
    const source = sources.get(
      idString(rrLine.details?.sourceSalesOrderLineId),
    );
    const parent = documents.get(idString(source?.documentId));
    if (
      source?.lineKind === "SALES_ORDER" &&
      parent?.documentKind === "SALES_ORDER" &&
      sameId(source.productId, rrLine.productId) &&
      canReadRelated(parent, user)
    ) {
      canonical.set(idString(source._id), source._id);
    }
  }
  // Only genuine WIR releases of the same SO/product may extend its demand IDs.
  for (const line of wirLines) {
    const source = sources.get(idString(line.details.salesOrderLineId));
    const wir = documents.get(idString(line.documentId));
    if (
      canonical.has(idString(source?._id)) &&
      wir?.documentKind === "ISSUE_REQUEST" &&
      sameId(wir.header?.salesOrderId, source.documentId) &&
      sameId(line.productId, source.productId) &&
      canReadRelated(wir, user)
    )
      canonical.set(idString(line._id), source._id);
  }
  const demandIds = [...canonical.keys()];
  const [reservations, allocations] = await Promise.all([
    Reservation.find({ demandLineId: { $in: demandIds }, status: "ACTIVE" })
      .sort({ _id: 1 })
      .lean(),
    DemandSupplyAllocation.find({ demandLineId: { $in: demandIds } })
      .sort({ _id: 1 })
      .lean(),
  ]);
  const supplyLines = indexById(
    await DocumentLine.find({
      _id: { $in: distinctIds(allocations.map((item) => item.supplyLineId)) },
    }).lean(),
  );
  const supplyDocuments = await BusinessDocument.find({
    _id: {
      $in: distinctIds(
        [...supplyLines.values()].map((line) => line.documentId),
      ),
    },
  }).lean();
  for (const item of supplyDocuments) documents.set(idString(item._id), item);
  return {
    documents,
    sources,
    purchaseLines: indexById(purchaseLines),
    documentLinks,
    lineLinks,
    purchaseLinks,
    canonical,
    reservations,
    allocations,
    supplyLines,
  };
}
```

</details>

<a id="fn-172"></a>

## sourceReferences()

**Code:** [replenishment.service.js:490](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:490).

**Tham số:** `sourceReferences(line, relations, user)`.

**Công việc:** Trình bày từng mã nguồn của một dòng, có kiểm chuỗi và quyền.

**Xử lý theo thứ tự:**

1. Lấy các nguồn SO/WIR/kiểm kê trong details.
2. Với WIR kiểm thuộc đúng SO và dòng gốc; cùng sản phẩm và loại nguồn.
3. READABLE mới gắn metadata, không đủ thì chỉ giữ tham chiếu UNAVAILABLE.

**Ai gọi / gọi tiếp:** Được gọi bởi [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101), [sameId()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-103), [canReadRelated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-106), [mapRelatedReference()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-164).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** WIR trỏ SO khác không được gắn như nguồn đúng chỉ vì mã hàng giống.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function sourceReferences(line, relations, user) {
  const details = line.details || {};
  const references = [];
  for (const [field, kind] of [
    ["sourceSalesOrderLineId", "SALES_ORDER"],
    ["sourceIssueRequestLineId", "ISSUE_REQUEST"],
  ]) {
    if (!details[field]) continue;
    const source = relations.sources.get(idString(details[field]));
    const document = relations.documents.get(idString(source?.documentId));
    const salesSource = relations.sources.get(
      idString(details.sourceSalesOrderLineId),
    );
    const sameChain =
      kind !== "ISSUE_REQUEST" ||
      (salesSource?.lineKind === "SALES_ORDER" &&
        sameId(source?.details?.salesOrderLineId, salesSource._id) &&
        sameId(document?.header?.salesOrderId, salesSource.documentId));
    const readable =
      sameChain &&
      source?.lineKind === kind &&
      sameId(source.productId, line.productId) &&
      document?.documentKind === kind &&
      canReadRelated(document, user);
    references.push({
      lineId: idString(details[field]),
      documentKind: kind,
      access: readable ? "READABLE" : "UNAVAILABLE",
      ...(readable && {
        document: mapRelatedReference(
          source.documentId,
          kind,
          relations.documents,
          user,
        ),
      }),
    });
  }
  if (details.sourceStocktakeId) {
    references.push(
      mapRelatedReference(
        details.sourceStocktakeId,
        "STOCKTAKE",
        relations.documents,
        user,
      ),
    );
  }
  return references;
}
```

</details>

<a id="fn-173"></a>

## mapRelations()

**Code:** [replenishment.service.js:541](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:541).

**Tham số:** `mapRelations(document, lines, relations, user)`.

**Công việc:** Ghép các quan hệ đã đọc thành kết quả chi tiết RR.

**Xử lý theo thứ tự:**

1. Gom mã PO từ liên kết phiếu và dòng mua.
2. Map reservation/allocation theo nhu cầu SO gốc, chỉ mở metadata nguồn cung được phép.
3. Map links nguồn/dòng mua và các tham chiếu PO; không tự cộng chúng thành lượng nhập thực tế.

**Ai gọi / gọi tiếp:** Được gọi bởi [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-175). Gọi tiếp [distinctIds()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-165), [sameId()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-103), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101), [mapRelations.canonicalId()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-174), [decimalString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-154), [canReadRelated()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-106), [mapRelatedReference()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-164).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Một RR có nhiều PO hiện các liên kết, nhưng tiến độ nhập phải xem reader PO.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function mapRelations(document, lines, relations, user) {
  const poIds = distinctIds([
    ...relations.documentLinks
      .filter(
        (link) =>
          sameId(link.parentDocumentId, document._id) &&
          link.relationCode === REPLENISHMENT_RELATIONS.PURCHASE,
      )
      .map((link) => link.childDocumentId),
    ...[...relations.purchaseLines.values()].map((line) => line.documentId),
  ]).sort();
  const canonicalId = (item) =>
    idString(relations.canonical.get(idString(item.demandLineId)));
  const rrLineIds = new Set(lines.map((line) => idString(line._id)));
  return {
    reservations: relations.reservations.map((item) => ({
      id: idString(item._id),
      demandLineId: idString(item.demandLineId),
      canonicalSalesOrderLineId: canonicalId(item),
      qtyBase: decimalString(item.qtyBase),
      status: item.status,
    })),
    allocations: relations.allocations.map((item) => {
      const supply = relations.supplyLines.get(idString(item.supplyLineId));
      const parent = relations.documents.get(idString(supply?.documentId));
      const demand = relations.sources.get(canonicalId(item));
      const reference =
        supply &&
        sameId(supply.productId, demand?.productId) &&
        canReadRelated(parent, user)
          ? mapRelatedReference(
              supply.documentId,
              null,
              relations.documents,
              user,
            )
          : null;
      return {
        id: idString(item._id),
        demandLineId: idString(item.demandLineId),
        canonicalSalesOrderLineId: canonicalId(item),
        qtyBase: decimalString(item.qtyBase),
        status: item.status,
        supply: reference
          ? {
              lineId: idString(supply._id),
              document: reference,
              access: "READABLE",
            }
          : { access: "UNAVAILABLE" },
      };
    }),
    purchaseReferences: poIds.map((id) =>
      mapRelatedReference(id, "PO", relations.documents, user),
    ),
    sourceLineLinks: relations.lineLinks
      .filter(
        (link) =>
          rrLineIds.has(idString(link.targetLineId)) &&
          link.relationCode !== REPLENISHMENT_RELATIONS.PURCHASE,
      )
      .map((link) => ({
        id: idString(link._id),
        relationCode: link.relationCode,
        sourceLineId: idString(link.sourceLineId),
        replenishmentLineId: idString(link.targetLineId),
        linkedQtyBase: decimalString(link.linkedQty),
      })),
    purchaseLineLinks: relations.purchaseLinks.map((link) => {
      const target = relations.purchaseLines.get(idString(link.targetLineId));
      return {
        id: idString(link._id),
        replenishmentLineId: idString(link.sourceLineId),
        purchaseLineId: idString(link.targetLineId),
        linkedQtyBase: decimalString(link.linkedQty),
        purchaseOrder: target
          ? mapRelatedReference(
              target.documentId,
              "PO",
              relations.documents,
              user,
            )
          : null,
      };
    }),
    sourceDocumentLinks: relations.documentLinks
      .filter((link) => sameId(link.childDocumentId, document._id))
      .map((link) => {
        const kind = {
          [REPLENISHMENT_RELATIONS.SALES_ORDER]: "SALES_ORDER",
          [REPLENISHMENT_RELATIONS.STOCKTAKE]: "STOCKTAKE",
          [REPLENISHMENT_RELATIONS.ISSUE_REQUEST]: "ISSUE_REQUEST",
        }[link.relationCode];
        return {
          relationCode: link.relationCode,
          source: mapRelatedReference(
            link.parentDocumentId,
            kind ?? null,
            relations.documents,
            user,
          ),
        };
      }),
  };
}
```

</details>

<a id="fn-174"></a>

## mapRelations.canonicalId()

**Code:** [replenishment.service.js:552](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:552).

**Tham số:** `mapRelations.canonicalId(item)`.

**Công việc:** Quy nguồn nhu cầu WIR về dòng SO gốc đã xác định.

**Xử lý theo thứ tự:**

1. Tra relations.canonical bằng demandLineId rồi đổi mã sang chuỗi.

**Ai gọi / gọi tiếp:** Được gọi bởi [mapRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-173). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** SO và WIR cùng nhu cầu được nhận ra chung gốc, tránh hiểu thành hai nhu cầu độc lập.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
canonicalId = (item) =>
    idString(relations.canonical.get(idString(item.demandLineId)))
```

</details>

<a id="fn-175"></a>

## getReplenishment()

**Code:** [replenishment.service.js:647](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:647).

**Tham số:** `getReplenishment(user, id)`.

**Công việc:** Đọc chi tiết RR, quyết định đúng version và tồn hiện tại tách biệt.

**Xử lý theo thứ tự:**

1. FindOne theo _id trong replenishmentScope; thiếu thì 404.
2. Đọc dòng chưa bỏ, mọi Approval RR và số submission.
3. Đọc master, availability hiện tại, relations.
4. Chọn Approval cùng document.version để gắn approvedQty; map source/snapshot/currentStock và lịch sử.

**Ai gọi / gọi tiếp:** Được gọi bởi [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-146). Gọi tiếp [replenishmentScope()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-105), [objectId()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-102), [loadMasters()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-169), [getCurrentAvailability()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-109), [loadRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-171), [indexById()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-156), [mapHeader()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-159), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-155), [mapUser()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-157), [mapLine()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-161), [decimalString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-154), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101), [mapSavedSource()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-162), [sourceReferences()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-172), [mapEvaluationSnapshot()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-163), [mapApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-160), [mapRelations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-173).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `BusinessDocument`, tại [dòng 648](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:648). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.findOne({
    ...replenishmentScope(user),
    _id: objectId(id),
  }).lean()
```

- Đọc nhiều bản ghi qua `DocumentLine`, tại [dòng 654](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:654). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
DocumentLine.find({
      documentId: document._id,
      lineKind: "REPLENISHMENT",
      "details.removedAt": null,
    })
      .sort({ lineNo: 1 })
      .lean()
```

- Đọc nhiều bản ghi qua `Approval`, tại [dòng 661](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:661). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Approval.find({ documentId: document._id, decisionKind: APPROVAL_KIND })
      .sort(approvalSort)
      .lean()
```

- Đếm bản ghi qua `ReplenishmentSubmission`, tại [dòng 664](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:664). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ReplenishmentSubmission.countDocuments({ documentId: document._id })
```

**Ví dụ:** Bản gửi 100 giữ nguyên 100; tồn hôm nay 80 là thông tin tham khảo riêng.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getReplenishment(user, id) {
  const document = await BusinessDocument.findOne({
    ...replenishmentScope(user),
    _id: objectId(id),
  }).lean();
  if (!document) throw new ApiError(404, "Không tìm thấy yêu cầu bổ sung hàng");
  const [lines, approvals, submissionCount] = await Promise.all([
    DocumentLine.find({
      documentId: document._id,
      lineKind: "REPLENISHMENT",
      "details.removedAt": null,
    })
      .sort({ lineNo: 1 })
      .lean(),
    Approval.find({ documentId: document._id, decisionKind: APPROVAL_KIND })
      .sort(approvalSort)
      .lean(),
    ReplenishmentSubmission.countDocuments({ documentId: document._id }),
  ]);
  const [masters, availability, relations] = await Promise.all([
    loadMasters([document], lines, approvals),
    getCurrentAvailability(
      document.header.warehouseId,
      lines.map((line) => line.productId),
    ),
    loadRelations(document, lines, user),
  ]);
  const currentApproval = approvals.find(
    (approval) => approval.documentVersion === document.version,
  );
  const approvedLines = indexById(
    (currentApproval?.decision === "APPROVE"
      ? currentApproval.lines || []
      : []
    ).map((line) => ({ ...line, _id: line.lineId })),
  );
  return {
    ...mapHeader(document, masters),
    updatedAt: isoDate(document.updatedAt),
    submittedBy: mapUser(document.header.submittedBy, masters.users),
    submittedAt: isoDate(document.header.submittedAt),
    triggerReason: document.header.triggerReason,
    note: document.note ?? null,
    lines: lines.map((line) => {
      const mapped = mapLine(line, masters);
      return {
        ...mapped,
        approvedQtyBase: decimalString(
          approvedLines.get(idString(line._id))?.approvedQty,
        ),
        reasonNote: line.details?.reasonNote ?? null,
        quantityAdjustmentReason:
          line.details?.quantityAdjustmentReason ?? null,
        source: {
          ...mapSavedSource(line.details),
          references: sourceReferences(line, relations, user),
        },
        evaluationSnapshot: mapEvaluationSnapshot(line.details),
        currentStock: {
          warehouseId: idString(document.header.warehouseId),
          productId: idString(line.productId),
          scope: "PRODUCT_WAREHOUSE",
          baseUom: mapped.baseUom,
          availableQtyBase: availability.quantities.get(
            idString(line.productId),
          ),
          computedAt: isoDate(availability.computedAt),
        },
      };
    }),
    latestDecision: mapApproval(approvals[0], document.version, masters.users),
    approvalHistory: approvals.map((approval) =>
      mapApproval(approval, document.version, masters.users, true),
    ),
    submissionHistoryAvailable: submissionCount > 0,
    submissionCount,
    ...mapRelations(document, lines, relations, user),
  };
}
```

</details>

<a id="fn-176"></a>

## scopedReplenishmentDocument()

**Code:** [replenishment.service.js:727](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:727).

**Tham số:** `scopedReplenishmentDocument(user, id)`.

**Công việc:** Tìm RR trong phạm vi trước khi đọc lịch sử gửi.

**Xử lý theo thứ tự:**

1. FindOne kết hợp scope và _id.
2. Không có thì 404; không đọc submission ngoài scope trước.

**Ai gọi / gọi tiếp:** Được gọi bởi [listReplenishmentSubmissions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-178), [getReplenishmentSubmission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-179). Gọi tiếp [replenishmentScope()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-105), [objectId()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-102).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `BusinessDocument`, tại [dòng 728](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:728). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
BusinessDocument.findOne({
    ...replenishmentScope(user),
    _id: objectId(id),
  }).lean()
```

**Ví dụ:** Biết documentId không cho mở snapshot của người khác.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
async function scopedReplenishmentDocument(user, id) {
  const document = await BusinessDocument.findOne({
    ...replenishmentScope(user),
    _id: objectId(id),
  }).lean();
  if (!document) throw new ApiError(404, "Không tìm thấy yêu cầu bổ sung hàng");
  return document;
}
```

</details>

<a id="fn-177"></a>

## mapSubmissionSummary()

**Code:** [replenishment.service.js:736](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:736).

**Tham số:** `mapSubmissionSummary(submission, users, warehouse)`.

**Công việc:** Trình bày thông tin một lần gửi bằng nhãn đã chụp.

**Xử lý theo thứ tự:**

1. Lấy documentVersion/người/thời điểm gửi.
2. Kho dùng code/name snapshot; trạng thái kho hiện tại chỉ là thông tin thêm nếu được truyền.
3. Đếm snapshot.lines.

**Ai gọi / gọi tiếp:** Được gọi bởi [listReplenishmentSubmissions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-178), [getReplenishmentSubmission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-179). Gọi tiếp [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101), [mapUser()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-157), [isoDate()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-155).

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Ảnh hưởng gián tiếp đi qua các hàm gọi tiếp ở trên.

**Ví dụ:** Đổi tên kho hôm nay không viết lại tên kho trong lần gửi cũ.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
function mapSubmissionSummary(submission, users, warehouse) {
  return {
    id: idString(submission._id),
    documentVersion: submission.documentVersion,
    submittedBy: mapUser(submission.submittedBy, users),
    submittedAt: isoDate(submission.submittedAt),
    warehouse: {
      id: idString(submission.warehouseId),
      code: submission.warehouseCodeSnapshot,
      name: submission.warehouseNameSnapshot,
      isActive: warehouse?.isActive ?? null,
    },
    neededOn: isoDate(submission.neededOn),
    triggerReason: submission.triggerReason,
    note: submission.note ?? null,
    lineCount: submission.lines.length,
  };
}
```

</details>

<a id="fn-178"></a>

## listReplenishmentSubmissions()

**Code:** [replenishment.service.js:755](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:755).

**Tham số:** `listReplenishmentSubmissions(user, id, query)`.

**Công việc:** Liệt kê các bản chụp lần gửi của một RR.

**Xử lý theo thứ tự:**

1. scopedReplenishmentDocument trước.
2. Find/count ReplenishmentSubmission theo documentId, version mới trước.
3. Đọc gom User/Warehouse để bổ sung thông tin và map summary.

**Ai gọi / gọi tiếp:** Được gọi bởi [submissions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-152). Gọi tiếp [scopedReplenishmentDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-176), [distinctIds()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-165), [indexById()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-156), [mapSubmissionSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-177), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc nhiều bản ghi qua `ReplenishmentSubmission`, tại [dòng 758](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:758). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ReplenishmentSubmission.find({ documentId: document._id })
      .sort({ documentVersion: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean()
```

- Đếm bản ghi qua `ReplenishmentSubmission`, tại [dòng 763](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:763). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ReplenishmentSubmission.countDocuments({ documentId: document._id })
```

- Đọc nhiều bản ghi qua `User`, tại [dòng 769](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:769). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
User.find({ _id: { $in: userIds } }).select("_id fullName").lean()
```

- Đọc nhiều bản ghi qua `Warehouse`, tại [dòng 770](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:770). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Warehouse.find({
      _id: { $in: distinctIds(submissions.map((item) => item.warehouseId)) },
    })
      .select("_id code name isActive")
      .lean()
```

**Ví dụ:** Phiếu gửi 2 lần có 2 mục lịch sử dù chỉ có một BusinessDocument hiện hành.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function listReplenishmentSubmissions(user, id, query) {
  const document = await scopedReplenishmentDocument(user, id);
  const [submissions, total] = await Promise.all([
    ReplenishmentSubmission.find({ documentId: document._id })
      .sort({ documentVersion: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    ReplenishmentSubmission.countDocuments({ documentId: document._id }),
  ]);
  const userIds = distinctIds(
    submissions.map((submission) => submission.submittedBy),
  );
  const [users, warehouses] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("_id fullName").lean(),
    Warehouse.find({
      _id: { $in: distinctIds(submissions.map((item) => item.warehouseId)) },
    })
      .select("_id code name isActive")
      .lean(),
  ]);
  const userMap = indexById(users);
  const warehouseMap = indexById(warehouses);
  return {
    items: submissions.map((submission) =>
      mapSubmissionSummary(
        submission,
        userMap,
        warehouseMap.get(idString(submission.warehouseId)),
      ),
    ),
    total,
    page: query.page,
    limit: query.limit,
  };
}
```

</details>

<a id="fn-179"></a>

## getReplenishmentSubmission()

**Code:** [replenishment.service.js:792](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:792).

**Tham số:** `getReplenishmentSubmission(user, id, version)`.

**Công việc:** Mở nội dung đúng một lần gửi và quyết định gắn với lần đó.

**Xử lý theo thứ tự:**

1. Kiểm scope RR rồi tìm snapshot đúng documentId/version.
2. Thiếu thì trả available=false, không dựng lịch sử giả.
3. Có thì đọc submitter và Approval cùng version/decisionKind; đọc tên người quyết định nếu cần.
4. Trả snapshot từng dòng đúng tên/đơn vị/lượng đã chụp.

**Ai gọi / gọi tiếp:** Được gọi bởi [submission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-153). Gọi tiếp [scopedReplenishmentDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-176), [idString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-101), [distinctIds()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-165), [mapSubmissionSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-177), [decimalString()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-154), [mapApproval()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-160).

**Tương tác cơ sở dữ liệu xuất hiện trực tiếp trong thân hàm:**

- Đọc một bản ghi qua `ReplenishmentSubmission`, tại [dòng 794](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:794). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
ReplenishmentSubmission.findOne({
    documentId: document._id,
    documentVersion: version,
  }).lean()
```

- Đọc theo mã _id qua `User`, tại [dòng 808](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:808). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
User.findById(submission.submittedBy).select("_id fullName").lean()
```

- Đọc một bản ghi qua `Approval`, tại [dòng 809](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:809). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
Approval.findOne({
      documentId: document._id,
      documentVersion: version,
      decisionKind: APPROVAL_KIND,
    }).lean()
```

- Đọc nhiều bản ghi qua `User`, tại [dòng 819](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.service.js:819). Điều kiện lọc, dữ liệu ghi, trường chọn, sắp xếp và session được giữ nguyên trong lệnh:

```js
User.find({
      _id: { $in: distinctIds([approval.requestedBy, approval.decidedBy]) },
    })
      .select("_id fullName")
      .lean()
```

**Ví dụ:** Lần gửi bản 2 có 100 viên không bị thay bằng 80 viên từ dòng hiện tại bản 4.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export async function getReplenishmentSubmission(user, id, version) {
  const document = await scopedReplenishmentDocument(user, id);
  const submission = await ReplenishmentSubmission.findOne({
    documentId: document._id,
    documentVersion: version,
  }).lean();
  if (!submission) {
    return {
      available: false,
      documentVersion: version,
      availabilityStatus: "UNAVAILABLE",
      snapshot: null,
      approval: null,
    };
  }
  const [submitter, approval] = await Promise.all([
    User.findById(submission.submittedBy).select("_id fullName").lean(),
    Approval.findOne({
      documentId: document._id,
      documentVersion: version,
      decisionKind: APPROVAL_KIND,
    }).lean(),
  ]);
  const userMap = new Map(
    submitter ? [[idString(submitter._id), submitter]] : [],
  );
  if (approval) {
    const approvalUsers = await User.find({
      _id: { $in: distinctIds([approval.requestedBy, approval.decidedBy]) },
    })
      .select("_id fullName")
      .lean();
    for (const item of approvalUsers) userMap.set(idString(item._id), item);
  }
  return {
    available: true,
    availabilityStatus: "AVAILABLE",
    documentVersion: version,
    snapshot: {
      ...mapSubmissionSummary(submission, userMap, null),
      warehouse: {
        id: idString(submission.warehouseId),
        code: submission.warehouseCodeSnapshot,
        name: submission.warehouseNameSnapshot,
        isActive: null,
      },
      lines: submission.lines.map((line) => ({
        lineId: idString(line.lineId),
        lineNo: line.lineNo,
        productId: idString(line.productId),
        productSkuSnapshot: line.productSkuSnapshot,
        productNameSnapshot: line.productNameSnapshot,
        baseUomId: idString(line.baseUomId),
        baseUomCodeSnapshot: line.baseUomCodeSnapshot,
        enteredUomId: idString(line.enteredUomId),
        enteredUomCodeSnapshot: line.enteredUomCodeSnapshot,
        conversionId: idString(line.conversionId),
        conversionVersion: line.conversionVersion,
        enteredQty: decimalString(line.enteredQty),
        conversionSnapshot: decimalString(line.conversionSnapshot),
        qtyBase: decimalString(line.qtyBase),
        triggerType: line.triggerType,
        reasonNote: line.reasonNote,
      })),
    },
    approval: mapApproval(approval, version, userMap, true),
  };
}
```

</details>

<a id="fn-180"></a>

## positiveInteger()

**Code:** [replenishment.validation.js:7](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:7).

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

<a id="fn-181"></a>

## creationDateRange()

**Code:** [replenishment.validation.js:227](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:227).

**Tham số:** `creationDateRange({ createdFrom, createdTo })`.

**Công việc:** Đổi khoảng ngày lọc RR sang mốc thời gian Việt Nam.

**Xử lý theo thứ tự:**

1. Từ ngày bắt đầu tạo $gte lúc 00:00+07.
2. Ngày kết thúc dùng $lt đầu ngày tiếp theo, tránh thiếu bản ghi tối.
3. Không có hai đầu thì trả null.

**Ai gọi / gọi tiếp:** Được gọi bởi [buildListPipeline()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-168). Không gọi hàm khác trong danh mục này.

**Cơ sở dữ liệu trực tiếp:** không có lệnh đọc/ghi model trực tiếp trong thân hàm. Hàm xử lý dữ liệu đang có trong bộ nhớ hoặc tạo bộ kiểm tra/lỗi; không tự kết nối MongoDB.

**Ví dụ:** Lọc 03/11 bao gồm phiếu 23:59 Việt Nam, không cắt theo 00:00 UTC.

<details>
<summary>Mở code đầy đủ của hàm để đối chiếu từng câu lệnh</summary>

```js
export function creationDateRange({ createdFrom, createdTo }) {
  const range = {};
  if (createdFrom) range.$gte = new Date(`${createdFrom}T00:00:00+07:00`);
  if (createdTo)
    range.$lt = new Date(
      new Date(`${createdTo}T00:00:00+07:00`).getTime() + 86400000,
    );
  return Object.keys(range).length ? range : null;
}
```

</details>

