14 November 2026 — explicit user decision: purchase inspection lines whose quality is not GOOD must use CUSTODY. Create/update and confirmation reject ACCEPT or REJECT for these lines, including historical drafts. GOOD retains existing decisions. Confirm creates draft receipts; posting custody records supplier-owned stock. Posted custody detail offers supplier-return creation from the actual line/balance, without a defect report. See RETURN_WORKFLOWS_NATIVE.md for agreement, CustodyRelease dispatch and ACK/closure.

> 10/11/2026: [18 UC HieuDT](HIEUDT_ITERATIONS_NATIVE.md) bổ sung lệnh sửa/hủy SO, WIR/OD, soạn từng phần, chốt kiểm kê và báo cáo. FE đã nối các màn tương ứng vào API. GI posting/POD/thanh toán và các UC chuẩn bị kiểm kê ngoài phạm vi không được suy là đã hoàn tất.

> Quyết định 09/11/2026 bổ sung [Conversion theo sản phẩm và lô](CONVERSIONS.md). [Iteration 1 native](ITERATION1_NATIVE_2026-11-06.md) tiếp tục áp dụng cho NCC, giữ hộ và đảo nhập.

# Hợp đồng runtime theo model mới — 06/11/2026

Nguồn quyết định: người dùng yêu cầu đồng bộ toàn project, xác nhận bỏ src/models/legacy, rebuild, embedded và duyệt danh sách 42 file phụ thuộc cùng 6 lệnh cũ. Đây là hợp đồng hiện hành; các test pack và báo cáo trước lần chuyển là bằng chứng lịch sử, không phải payload cho runtime này.

## Lưu trữ và bảo vệ thao tác

The runtime uses one registry: `src/models/index.js` exports `registerModels(connection)`; `runtime.js` supplies API models. There are 58 collection schemas (`*.model.js`) and five GoodsReceipt kinds in one collection. Nested schemas do not create collections. `registerReviewedModels` is a compatibility alias. Pure historical transforms and synthetic fixtures under `src/migrations/rebuild` and `src/seeds/rebuild` remain for regression checks.

API trả decimal dưới dạng chuỗi; ObjectId thành chuỗi. Chứng từ có _id/id, documentNo, documentKind, workflowStatus, version, header, items và sources. items có _id ổn định, productId, lotId khi có, enteredQty, enteredUnit, baseUnitsPerUnit, qtyBase, baseUnitSnapshot. Sources dùng subjectCollection, documentId, itemId, linkedQty, relationCode. Không gửi conversionId hoặc dòng BusinessDocument cũ.

Các mapper cũ cho product, lot, supplier và replenishment không thuộc runtime hiện hành. DTO được tạo bởi các service native; tài liệu function-guide ngày 05/11 chỉ là ảnh chụp lịch sử. Các tiện ích `scopedWarehouseIds`, `isPastCalendarDate`, `multiplyBaseQuantity` và `sha256Text` không còn được sử dụng và đã được gỡ khỏi mã hiện hành.

Lệnh ghi chứng từ kiểm quyền hiện tại, kho, trạng thái, nguồn và expectedVersion trong transaction. creationKey/operationKey được gắn actor và hash nội dung; thử lại dùng nguyên key lẫn payload. AuditLog, OperationRecord và BusinessEvent PENDING ghi cùng giao dịch. Lệnh ghi tồn cập nhật balance, packagingPortions, StockTransaction.movements, nguồn và hạn mức nguyên tử; kiểm khóa kiểm kê và sức chứa. Catalogue sửa bằng expectedUpdatedAt.

## Tài khoản, danh mục

User có một roleId và warehouseIds; email/phone/fullName được lưu trực tiếp. GET /users/options trả vai trò hoạt động và kho hoạt động. GET /roles/permissions trả danh mục để chọn quyền; tạo role (`POST /roles`, `access_control:create`) không tạo permission mới, và mã role trùng trả 409 `ERR-CORE-409-002` "Mã vai trò đã tồn tại" (từ 24/11/2026; trước đó lộ lỗi E11000 dưới dạng 500). Tạo vai trò và `PUT /roles/:code/permissions` ghi audit `CREATE_ROLE` / `UPDATE_ROLE_PERMISSIONS`. Vai trò tùy chỉnh được xét theo quyền thay vì chỉ tên vai trò. Giá mua vẫn chỉ dành Owner/Accountant theo quyết định đã duyệt.

Middleware nạp role và permission hiện hành từ DB cho mỗi request. Route khai báo mã quyền thao tác, ví dụ `GET /api/roles` dùng `access_control:read` mặc định của Admin. Service kiểm thêm kho, người lập, nguồn và trạng thái theo nghiệp vụ. Thiếu quyền thao tác trả `ERR-CORE-403-001`; các endpoint có kiểm kho trực tiếp trả `ERR-CORE-403-002` khi ngoài phân công.

Product dùng manufacturerCode, sku, color, categoryId, baseUnit, wholeBaseUnits, lengthMm/widthMm/heightMm, stockThresholds nhúng và imageUrls (mảng URL String có thứ tự, mặc định rỗng). `imageUrls[0]` là ảnh đại diện. POST `/api/products` nhận trường này tùy chọn; PUT `/api/products/:id` giữ ảnh hiện tại nếu bỏ trường, thay toàn bộ mảng nếu gửi và xóa hết khi gửi `[]`. BE chỉ nhận URL HTTPS tuyệt đối có hostname, không chứa thông tin đăng nhập; tối đa 5 URL, tối đa 2.048 ký tự/URL, không trùng sau khi trim. List/detail luôn trả mảng, gồm `[]` với bản ghi cũ. Quyền tạo/sửa giữ nguyên `product:create`/`product:update`; cập nhật dùng `expectedUpdatedAt` và ghi audit. Lô dùng productId, manufacturerLot, identificationStatus VERIFIED/UNKNOWN, piecesPerCarton, cartonLengthMm/cartonWidthMm/cartonHeightMm. Uom holds its immutable code, name, status and carton marker. Product.baseUnit stores the code. See [Conversion](CONVERSIONS.md) for effective factors and snapshots. Supplier dùng contactName, taxCode, notes và status ACTIVE/SUSPENDED/TERMINATED; tạo mới ACTIVE. Tồn lô dùng quantityBase/qualityStatus; biến động dùng quantityBase.

### Sửa và đổi trạng thái sản phẩm

Cả hai API cần `product:update` và trả sản phẩm đã lưu cùng `updatedAt` mới. Gửi `expectedUpdatedAt` dạng ISO 8601 có múi giờ từ dữ liệu vừa đọc. Bản ghi đã được cập nhật trả HTTP 409. Mỗi lần cập nhật thành công ghi audit trong cùng giao dịch.

- `PUT /api/products/:id` nhận `name`, `categoryId`, `lengthMm`, `widthMm`, `heightMm`, `manufacturerCode`, `color` và `baseUnit`. Kích thước là chuỗi số dương theo mm, tối đa ba chữ số thập phân. Nhóm sản phẩm phải hoạt động. `material`, `surface`, `origin` và `description` nhận chuỗi hoặc `null`. Bỏ các trường này sẽ xóa giá trị tương ứng.
- Hãng, SKU và màu cố định từ lúc tạo. Client gửi lại hãng, màu và đơn vị gốc hiện tại cùng `wholeBaseUnits`. `wholeBaseUnits` có mặc định `true` nếu bỏ trường. Đổi hãng hoặc màu trả 400 với `fieldErrors[].path` tương ứng `body.manufacturerCode` hoặc `body.color`. Schema sửa từ chối `sku` và `isActive`.
- `PATCH /api/products/:id/status` nhận `expectedUpdatedAt`, `isActive` kiểu boolean và `reason` có 1 đến 2.000 ký tự sau trim. `false` đánh dấu ngừng kinh doanh. Audit lưu lý do. Việc lập lệnh [chuyển vị trí](location-movements/README.md) yêu cầu sản phẩm đang hoạt động.

## Mua và nhập

20 November 2026 — creating an inspection performs a guaranteed timestamp write on the same PO, conditional on its current version and OPEN/PARTIAL state. It leaves the public version unchanged and contends with cancellation; transaction retry rechecks state and linked receiving documents. An inspection cannot commit alongside cancellation of its source PO.

RR lưu header/items/submissions; duyệt tạo ApprovalHistory độc lập người lập, kiểm đầy đủ từng dòng và lượng nguyên nếu sản phẩm yêu cầu. Một RR tối đa một PO, thuộc một NCC/kho. PO lưu nguồn, snapshot giá, trạng thái, phiên bản và ngày nhận dự kiến chung `header.expectedOn`. Lập, sửa nháp và phát hành PO kiểm nguồn RR đã duyệt, quyết định mới nhất, trần lượng từng dòng và trạng thái danh mục. Cảnh báo RR được xem riêng qua `POST /api/replenishments/evaluate`. Từ 16/11/2026: `currency` chỉ nhận `VND`; `expectedOn` khi lập PO, đổi ngày dự kiến hoặc đổi sang ngày khác lúc sửa nháp không được trước hôm nay theo giờ Việt Nam (giữ nguyên ngày đã lưu thì vẫn sửa được); `lineAmount` làm tròn 6 số lẻ; phát hành kiểm cả kho còn hoạt động; chốt thiếu kiểm số nguyên với sản phẩm đếm nguyên đơn vị gốc. Mọi ObjectId trong payload được chuẩn hóa chữ thường trước khi kiểm trùng.

Kế toán chốt với NCC trước khi lập PO (nguồn quyết định: user, 2026-11-11).

| Lệnh PO | Hành vi |
| --- | --- |
| `POST /api/purchase-orders` | Tạo `DRAFT` từ RR đã duyệt, dùng `creationKey`. Mỗi dòng bắt buộc có `unitPurchasePrice` (chuỗi thập phân ≥ 0, tối đa 6 chữ số thập phân); FE yêu cầu Kế toán nhập, không tự điền 0 (16/11/2026). RR đã có PO trả 400 `Yêu cầu bổ sung đã có đơn mua` thay vì lỗi trùng khóa 500. |
| `PUT /api/purchase-orders/:id` | Sửa nội dung khi còn `DRAFT`, dùng `expectedVersion` và `operationKey`. `GET /api/purchase-orders/:id` của PO nháp trả `draftEdit.lines[].unitPurchasePrice` để điền sẵn form; vai trò không xem giá (Warehouse) không nhận trường này. Với version hiện tại của PO đã phát hành, trả 400 `Chỉ sửa trực tiếp PO nháp`. |
| `POST /api/purchase-orders/:id/confirm` | Phát hành nháp sang `OPEN` và ghi `header.issuedAt`. |
| `POST /api/purchase-orders/:id/expected-on` | Đổi ngày dự kiến khi PO `OPEN` hoặc `PARTIAL`. Body gồm `expectedVersion`, `operationKey`, `expectedOn` dạng ISO 8601 có múi giờ và `reason` bắt buộc. Kiểm `purchase_order:update` và quyền truy cập kho của PO. Trả biên nhận với phiên bản mới. Phiên bản cũ trả 409. Trạng thái khác trả 400 khi phiên bản khớp. |
| `POST /api/purchase-orders/:id/close-remainder` | Chốt thiếu một bước do Kế toán thực hiện (quyết định user 16/11/2026; thay ba lệnh `close-requests`/`close-approvals`/`close-executions`, nay trả 404). Body: `expectedVersion`, `operationKey`, `reason` bắt buộc, `evidenceIds` tùy chọn (tệp đã gắn vào PO), `lines[{poLineId,qtyBase}]`. PO còn phiếu kiểm nhận `DRAFT` thì trả 400 “PO còn phiếu kiểm nhận nháp…”; phải xác nhận hoặc hủy phiếu kiểm trước (quyết định user 27/11/2026). Mỗi dòng không vượt phần chưa nhận trừ lượng trên phiếu nhập nháp. Cộng vào `items[].cancelledRemainderQtyBase`; hết phần chưa nhận thì PO `CLOSED`. Lượng đã chốt thiếu không hoàn tác được; AuditLog `CLOSE_PO_REMAINDER` lưu dòng, lý do và bằng chứng. `purchase_order:approve_exception` không còn lệnh PO nào dùng. |
| `POST /api/purchase-orders/:id/reopen` | Kế toán mở lại PO `CLOSED` sau khi một phiếu nhập của nó bị đảo (quyết định user 23/11/2026). Body: `expectedVersion`, `operationKey`, `reason` bắt buộc. Quyền `purchase_order:update` và quyền ghi kho của PO. Chỉ cho khi PO `CLOSED` và còn dòng `outstandingQtyBase > 0`; nếu không trả 400 (`PO không ở trạng thái đã đóng` hoặc `PO không có lượng chưa nhận để mở lại`). PO về `PARTIAL` nếu còn lượng đã nhận, ngược lại `OPEN`; gỡ `header.closedAt`, giữ `header.closureReason` và `items[].cancelledRemainderQtyBase`. Chỉ phần bị đảo nhận lại được; phần đã chốt thiếu vẫn đóng. AuditLog `REOPEN_PURCHASE_ORDER` lưu lý do và trạng thái trước/sau; thông báo kho như khi xác nhận PO. `GET /api/purchase-orders/:id` trả `reopenable`. |
| `POST /api/purchase-orders/:id/cancel` | Kế toán hủy PO `DRAFT`, hoặc `OPEN` chưa có hàng đến, phiếu nhập hay chốt thiếu nào (16/11/2026). Body: `expectedVersion`, `operationKey`, `reason`. PO chuyển `CANCELLED`, gỡ `replenishmentRequestId` để RR lập được PO mới; `sources[]` và `items[].requestItemId` giữ liên kết lịch sử. Unique index một phần trên `replenishmentRequestId` vẫn bảo đảm một RR chỉ có một PO còn hiệu lực. `GET /api/purchase-orders/:id` trả `cancellable`. Chi tiết RR liệt kê cả PO đã hủy. |

Khi tạo hoặc sửa PO nháp, mỗi dòng RR xuất hiện tối đa một lần trong `lines[]`. Gửi trùng `rrLineId` trả 400 “Gộp lượng của cùng dòng RR”. Khi sửa, giữ `lines[].id` của từng dòng đã lưu và bỏ `id` cho dòng mới. `lines[].note` là chuỗi tùy chọn từ 1 đến 2000 ký tự sau khi bỏ khoảng trắng đầu cuối. Gửi lại `note` khi cần giữ ghi chú trong lệnh `PUT`. Chi tiết PO trả ghi chú tại `items[].note`, và nháp trả thêm tại `draftEdit.lines[].note`. Kho chọn lô thực nhận bằng `lotId` khi kiểm hàng. Ngày dự kiến giao dùng chung `header.expectedOn`.

Mỗi dòng `POST /api/purchase-orders` hoặc `PUT /api/purchase-orders/:id` nhận `uomCode?` (chuỗi đã trim, 1–60 ký tự). Khi bỏ trống, BE dùng đơn vị PO đã lưu nếu có `id`, hoặc đơn vị RR cho dòng mới. Nếu trùng đơn vị RR, BE giữ hệ số và lô của dòng RR, kể cả thùng theo lô. Khi đổi đơn vị, BE lấy quy đổi cấp sản phẩm đang hiệu lực, bỏ lô và trả 400 nếu thiếu quy đổi. `draftEdit.lines[].enteredUomCode` trả mã đã lưu.

Khi lập hoặc sửa RR và PO, số lượng theo đơn vị có `isCarton` hoặc theo đơn vị gốc của sản phẩm có `wholeBaseUnits` phải nguyên. Với đơn vị diện tích khác đơn vị gốc của sản phẩm nguyên viên, BE tính `qtyBase = ceil(round(enteredQty × baseUnitsPerUnit, 6))`, rồi lưu `enteredQty = round(qtyBase ÷ baseUnitsPerUnit, 6)`. Quy đổi lại phải ra cùng `qtyBase`. Ví dụ 20 m² gạch 600×600 được lưu thành 20,16 m² và 56 viên. PO tính `lineAmount` bằng đơn giá theo đơn vị đặt nhân với `enteredQty` đã chuẩn hóa, làm tròn 6 chữ số thập phân.

`POST /api/replenishments/:id/review` với `decision: "APPROVE"` yêu cầu một mục `{ lineId, approvedQtyBase, reason? }` cho mỗi dòng. `approvedQtyBase` là chuỗi thập phân từ 0 đến `qtyBase`, phải nguyên với sản phẩm có `wholeBaseUnits`. Nếu dòng RR dùng thùng, lượng duyệt phải chia hết cho hệ số của dòng. Mọi dòng duyệt giảm cần lý do riêng và ít nhất một dòng phải được duyệt dương. Chi tiết RR trả `approvedQtyBase` trên dòng và trong `approvals[].lines[]`.

Khi tạo, sửa, phát hành hoặc đối soát PO (`RR_ALLOWANCE`), BE so `qtyBase` với `approvedQtyBase`. Chỉ đơn vị có `uoms.isCarton = true` được vượt trần khi số thùng nguyên và bớt một thùng thì thiếu. Ví dụ duyệt 30 viên với quy đổi cấp sản phẩm 4 viên/thùng thì được đặt 8 thùng. Đặt theo viên hoặc m² phải nằm trong lượng duyệt. Kiểm nhận đối chiếu theo lượng gốc và ghi quy cách của lô thực nhận.

FE lấy đơn vị và hệ số đang hiệu lực qua `GET /api/replenishments/options?mode=FILTER` bằng quyền `replenishment_request:read`. Form tạo mặc định theo RR và form sửa nháp mặc định theo mã đơn vị PO đã lưu.

Khi tạo hoặc sửa PO, số lượng sai quy tắc đơn vị, quy đổi hoặc hạn mức trả 400.

Trạng thái PO: `DRAFT`, `OPEN`, `PARTIAL`, `COMPLETED` (nhận đủ, không dòng nào chốt thiếu), `CLOSED` (hết phần chưa nhận và có dòng đã chốt thiếu), `CANCELLED` (đã hủy trước khi nhận hàng). `PARTIAL` chỉ đặt khi có phiếu nhập `POSTED`. Ghi sổ phiếu nhập làm hết phần chưa nhận thì PO `COMPLETED`, hoặc `CLOSED` kèm `header.closedAt` nếu có dòng `cancelledRemainderQtyBase > 0` (quyết định user, 2026-11-23; trước đó trường hợp này lên `COMPLETED`). Đảo phiếu nhập tính lại `PARTIAL`/`OPEN` cho PO `OPEN`, `PARTIAL` hoặc `COMPLETED`, còn PO `CLOSED` giữ nguyên `CLOSED` (quyết định user, 2026-11-11); Kế toán mở lại bằng `POST /api/purchase-orders/:id/reopen`. `GET /api/purchase-orders` và `GET /api/purchase-orders/:id` trả thêm `hasOpenReceivingWork`: `true` khi PO `OPEN`/`PARTIAL` còn phiếu nhập nháp hoặc kiểm nhận nháp, để FE hiện nhãn “Đang nhận hàng” mà không thêm trạng thái PO. `GET /api/purchase-orders/:id` còn trả `hasDraftInspection`: `true` khi PO có phiếu kiểm nhận `DRAFT`, khớp điều kiện chặn của `close-remainder`.

`POST /api/purchase-orders/:id/supplier-confirmations` và `POST /api/purchase-orders/:id/amendments` đã được gỡ và trả 404. DTO PO bỏ thông tin xác nhận NCC trên đầu phiếu và dòng. Chi tiết FE hiện vẫn có cột “NCC xác nhận” với giá trị rỗng từ bộ ánh xạ phía FE.

Quyết định người dùng ngày 11/11/2026 bỏ `items[].deliverySchedule` khỏi PO. Đánh giá RR hiển thị `header.expectedOn` cùng lượng PO chưa nhận và phát cảnh báo cho PO `OPEN`/`PARTIAL` cùng kho và sản phẩm còn lượng dương. Ngày dự kiến có thể sau hạn cần hoặc vắng mặt. Lệnh đổi ngày ghi AuditLog `RESCHEDULE_PO_EXPECTED_ON` với lý do, hai phiên bản và giá trị `header.expectedOn` trước/sau.

`GET /api/purchase-orders/:id/receiving-summary` trả `documents` thay `schedules` và giữ `quantities`, `tripCount`, `openWork`. Mỗi chứng từ có `kind` (`INSPECTION` hoặc `GR_PURCHASE`), `id`, `documentNo`, `workflowStatus`, `occurredAt` nếu có, `createdAt` và `lines: [{ poLineId, qtyBase }]`. `qtyBase` là chuỗi thập phân. Phiếu kiểm lần theo dòng hàng đến để lấy dòng PO. `poLineId` là `null` nếu dòng chứng từ thiếu liên kết. Danh sách sắp mới nhất theo `occurredAt` hoặc `createdAt` nếu thiếu `occurredAt`, rồi theo ID giảm dần khi cùng thời điểm. Chỉ Owner/Accountant nhận thông tin giá. FE hiện dùng `GET /api/purchase-orders/:id/receiving-trips` có phân trang và chưa nối `documents` hay lệnh đổi ngày.

PO cũ chưa ghi lại có thể còn `deliverySchedule` trong MongoDB. DTO và đánh giá RR bỏ qua trường này. `saveVersion` thay cả mảng `items` bằng dữ liệu đã lọc nên lần ghi phiên bản tiếp theo loại trường cũ trên PO đó. Không cần chạy migration.

POST /purchase-orders/:id/inspections tạo GoodsArrival và GoodsInspection cùng giao dịch; payload có expectedPoVersion, creationKey, arrivedAt, deliveredBy, deliveryReference, lines. Dòng dùng poLineId, lotId, enteredQty, qualityCode, ownershipDecision ACCEPT/CUSTODY/REJECT, packagingCondition SEALED/OPENED/TORN/UNKNOWN và handlingNote nếu có. `lines` có từ 1 đến 100 dòng. `enteredUnit` chỉ là đơn vị gốc hoặc UOM `isCarton`; bỏ trống thì lấy đơn vị gốc (không còn lấy đơn vị PO). Số thùng phải nguyên; dòng `SEALED` phải là bội số `piecesPerCarton` của lô; `arrivedAt` không được trước `manufacturedOn` của lô. PUT /goods-inspections/:id dùng expectedVersion/operationKey cùng nội dung. `POST /goods-inspections/:id/cancel` hủy hồ sơ kiểm nháp và hủy luôn GoodsArrival nháp tạo cùng lúc (`CANCELLED`, cùng lý do). Confirm dùng expectedPoVersion và destinations[{inspectionItemId,locationId}].

Confirm kiểm nhận tạo GoodsReceipt `PURCHASE`/CustodyReceipt nháp, chưa ghi tồn. POST /goods-receipts/purchase/:id/post nhận expectedVersion, expectedPoVersion, operationKey và packaging nếu cần. Nhập sở hữu kiểm chất lượng/nguồn/hạn mức rồi mới tăng tồn STORE. Hàng giữ hộ dùng /custody-receipts/:id/post với handedOverBy (tùy chọn), destinations[{lineId,locationId}], ghi tồn SUPPLIER, không tăng lượng PO nhận sở hữu. [Hợp đồng năm loại phiếu](GOODS_RECEIPTS.md).

Khi ghi nhập mua hoặc tạm giữ, `packaging` gồm các phần tử `{lineId, portions: [{packagingState, quantityBase, measuredVolumeMm3, ...}]}`. Mỗi ID xuất hiện một lần và phải thuộc phiếu. Tổng lượng các phần kiện bằng lượng nhập. Dòng kiểm `SEALED` chỉ nhận lượng chia hết quy cách lô và chỉ chứa phần `SEALED`. Với quy cách `SEALED` do client gửi, `sealedPackCount` và `packagingSnapshot` phải khớp lô. BE từ chối khai thể tích cho phần `SEALED`. Khi client khai quy cách cho dòng kiểm `OPENED`, `TORN`, `UNKNOWN` hoặc `LOOSE`, quy cách phải có ít nhất một phần `OPEN` hoặc `LOOSE`. Kiểm sức chứa tính thùng nguyên theo kích thước lô và số thùng. Với thùng nguyên lịch sử có lưu số đo, BE dùng giá trị lớn hơn giữa số đo và thể tích tính theo lô. `PATCH .../destinations` từ chối hai đích cho cùng dòng.

Khi bỏ qua `packaging`, nhập mua và tạm giữ dùng tình trạng bao bì của dòng kiểm nhận nguồn. `OPENED`, `TORN` và `UNKNOWN` tạo một phần `OPEN` cho toàn bộ dòng. `LOOSE` (hàng lẻ, viên rời) tạo một phần `LOOSE`. `SEALED` tạo phần nguyên thùng. Các luồng không truyền tình trạng bao bì tách thùng nguyên và ghi số lượng dư thành một phần `LOOSE`.

BE điền `measuredVolumeMm3` khi phần `OPEN` hoặc `LOOSE` chưa có giá trị hay giới hạn thể tích đã biết. Với `OPEN`, lấy `ceil(quantityBase / piecesPerCarton)` nhân thể tích ngoài thùng của lô. Với `LOOSE`, lấy `quantityBase` nhân thể tích một đơn vị gốc từ `Product.lengthMm × widthMm × heightMm`. BE tính bằng Decimal và làm tròn đến 3 chữ số thập phân. Giá trị client gửi được dùng trực tiếp. Nếu thiếu kích thước dương cần cho công thức, lệnh trả 400 `Thiếu kích thước lô/sản phẩm, cần nhập thể tích thực đo`. For [DIRECT customer returns](RETURN_WORKFLOWS_NATIVE.md#reassessment-claim-and-packaging-correction--20-november-2026), an inspected measurement travels with the whole portion; a partial receipt can use `volumeUpperBoundMm3` for capacity.

GET receipt/custody bổ sung inspectionResult trên từng item để hiển thị chất lượng và tình trạng bao bì từ kiểm nhận; đây là dữ liệu đọc, không thêm field lưu trên item. GET inspection bổ sung arrival, receipts, custodyReceipts. FE chuyển các DTO này thành dòng bảng hiển thị, không ghi trở lại dạng cũ.

Phiếu nhập mua kết thúc ở `POSTED` và cập nhật lượng đã nhận của PO ngay trong luồng ghi nhập. Kho chuyển hàng từ bãi tiếp nhận lên kệ bằng TransferOrder `RELOCATE`. Xem [DTO số dư và quyền trên phiếu](GOODS_RECEIPTS.md#chi-tiết-phiếu-nhập-mua) và [hợp đồng BF03](location-movements/README.md).

Preflight đảo nhập đối chiếu phần đóng gói của giao dịch gốc và lượng khả dụng cộng dồn trên từng số dư. Warehouse đảo nhập mua trực tiếp, tạo `StockReversal POSTED` và khôi phục hạn mức PO. GR từ giữ hộ đảo `STORE` về số dư `SUPPLIER` gốc. Warehouse có thể hủy phiếu giữ hộ NCC `DRAFT` hoặc đảo phiếu `POSTED` theo quyền tại kho. Sửa kiểm nhận đã xác nhận trả danh sách chứng từ cần xử lý trước. Bằng chứng tùy chọn cho các lệnh đảo nhập mua, nhập khác, giữ hộ NCC và sửa kết quả kiểm. [Điều kiện, quyền và API](GOODS_RECEIPTS.md#hủy-nháp-và-đảo-phiếu).

## Chuyển kho và bán

Contract cập nhật 07/11: [BF03](location-movements/README.md) và
[BF04](transfers/BF04_API.md). BF03 không có trạng thái PARTIAL, lượng thực lấy
từ ledger. BF04 có `/options` với `sourceWarehouseIds` cho kho được thao tác;
warehouses dùng chọn kho đích; tồn/vị trí vẫn scope. Một nguồn sinh một ITR,
một ITR sinh một TO bằng lock và unique partial index. Nhận toàn hàng hỏng dùng
destinations rỗng, sinh TO hoàn tất không có movement. Replay TO kiểm lại quyền
dispatch/receive. Giữ ID và createdAt của packagingPortions còn lại khi chuyển.

Chuyển ô dùng TransferOrder RELOCATE, một lần xác nhận toàn lệnh bởi người lập. Chuyển liên kho đi TR → duyệt → Dispatch → PICK và bàn giao → transit → Receipt bởi người khác → PUTAWAY → đóng. PICK bắt buộc recipientName, biển số nếu có. Hàng không đạt chuyển vào QUARANTINE. Mỗi bước giữ hạn mức và kiểm quyền/kho/version.

API sales-orders dùng SalesOrder, ExternalReference và Attachment mới, redaction giá theo quyền. D07/D08 chưa có quyết định xác minh nguồn ngoài; không tự suy ra người xác minh được duyệt. Các màn hình prototype ngoài router API đang triển khai không chứng minh đã có đầy đủ nghiệp vụ phía server.

Role tùy chỉnh có `sales_order:read` chỉ xem SO có yêu cầu xuất tại kho được giao và chỉ nhận các dòng liên quan. `outbound_delivery:read` cho xem lệnh giao khi cả lệnh và yêu cầu xuất nguồn nằm trong kho được giao. Danh sách rỗng khi role chưa có kho. DTO giới hạn ẩn giá, tham chiếu nội bộ và thông tin bằng chứng. API tải ảnh nguồn SO trả 404 cho role tùy chỉnh. Giới hạn của các role mặc định giữ theo phạm vi nghiệp vụ đã duyệt.

## Bằng chứng và việc đang làm

Dùng endpoint upload riêng của từng nghiệp vụ với xác thực, permission và scope của chứng từ. Route upload chung `POST /api/upload` đã được gỡ. Router hàng lỗi và trả hàng áp dụng xác thực theo route của nhóm, nên `/api/health` và các route xác thực công khai vẫn được xử lý bởi router tương ứng.

07/11: 5/5 integration native đạt, 64 unit/model test đạt (14 profile cần môi
trường bị skip khi chạy mặc định); FE build và 3/3 BF03 presentation test đạt.
Đây là service transaction và build verification, chưa là browser E2E. Số liệu
toàn suite FE bên dưới là bằng chứng lịch sử, không phải kết quả chạy lại lượt này.

Ba test tích hợp native trên DB local riêng đã qua: mua/nhập/xếp từng phần và replay; đảo nhập độc lập; chuyển kho đủ bước. FE build đã qua tại mốc kiểm tra trước các chỉnh sửa tiếp theo. Toàn suite FE hiện có 102 test thất bại/264 qua, 2 lỗi không bắt: nhiều fixture và kỳ vọng vẫn theo hợp đồng cũ; đang chuyển và chưa tuyên bố hoàn thành. Các kiểm tra cần chạy lại sau chỉnh sửa cuối. Không ghi dữ liệu Atlas, không commit/push.

## Historical return-source decision — 7 November 2026

The user confirmed Accountant verification with uploaded evidence for historical customer-delivery sources. This scope is implemented in [the native return contract](RETURN_WORKFLOWS_NATIVE.md). It does not settle broader new-SO external-source gates. Trungph return workflows now use the native registry; local automated verification and rollout limits are recorded in that contract and the PR evidence. No Atlas data or connection change.

## Cảnh báo bổ sung hàng — 11/11/2026

[Hợp đồng RR](REPLENISHMENT_COVERAGE.md) mô tả cảnh báo RR đang mở, PO còn hàng chưa nhận và tồn khả dụng đủ ngưỡng. Lưu và gửi RR cần xác nhận kèm giải trình khi có cảnh báo. Quyết định duyệt và lệnh PO dùng bản RR đã gửi hoặc đã duyệt. Guard coverage theo kho/sản phẩm đã được gỡ khỏi runtime.
