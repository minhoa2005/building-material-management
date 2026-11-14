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

User có một roleId và warehouseIds; email/phone/fullName được lưu trực tiếp. GET /users/options trả vai trò hoạt động và kho hoạt động. GET /roles/permissions trả danh mục để chọn quyền; tạo role không tạo permission mới. Vai trò tùy chỉnh được xét theo quyền thay vì chỉ tên vai trò. Giá mua vẫn chỉ dành Owner/Accountant theo quyết định đã duyệt.

Middleware nạp role và permission hiện hành từ DB cho mỗi request. Route khai báo mã quyền thao tác, ví dụ `GET /api/roles` dùng `access_control:read` mặc định của Admin. Service kiểm thêm kho, người lập, nguồn và trạng thái theo nghiệp vụ. Thiếu quyền thao tác trả `ERR-CORE-403-001`; các endpoint có kiểm kho trực tiếp trả `ERR-CORE-403-002` khi ngoài phân công.

Product dùng manufacturerCode, sku, color, categoryId, baseUnit, wholeBaseUnits, lengthMm/widthMm/heightMm, stockThresholds nhúng và imageUrls (mảng URL String có thứ tự, mặc định rỗng). `imageUrls[0]` là ảnh đại diện. POST `/api/products` nhận trường này tùy chọn; PUT `/api/products/:id` giữ ảnh hiện tại nếu bỏ trường, thay toàn bộ mảng nếu gửi và xóa hết khi gửi `[]`. BE chỉ nhận URL HTTPS tuyệt đối có hostname, không chứa thông tin đăng nhập; tối đa 5 URL, tối đa 2.048 ký tự/URL, không trùng sau khi trim. List/detail luôn trả mảng, gồm `[]` với bản ghi cũ. Quyền tạo/sửa giữ nguyên `product:create`/`product:update`; cập nhật dùng `expectedUpdatedAt` và ghi audit. Lô dùng productId, manufacturerLot, identificationStatus VERIFIED/UNKNOWN, piecesPerCarton, cartonLengthMm/cartonWidthMm/cartonHeightMm. Uom holds its immutable code, name, status and carton marker. Product.baseUnit stores the code. See [Conversion](CONVERSIONS.md) for effective factors and snapshots. Supplier dùng contactName, taxCode, notes và status ACTIVE/SUSPENDED/TERMINATED; tạo mới ACTIVE. Tồn lô dùng quantityBase/qualityStatus; biến động dùng quantityBase.

## Mua và nhập

RR lưu header/items/submissions; duyệt tạo ApprovalHistory độc lập người lập, kiểm đầy đủ từng dòng và lượng nguyên nếu sản phẩm yêu cầu. Một RR tối đa một PO, thuộc một NCC/kho. PO lưu nguồn, snapshot giá, trạng thái, phiên bản và ngày nhận dự kiến chung `header.expectedOn`. Lập, sửa nháp và phát hành PO kiểm nguồn RR đã duyệt, quyết định mới nhất, trần lượng từng dòng và trạng thái danh mục. Cảnh báo RR được xem riêng qua `POST /api/replenishments/evaluate`.

Kế toán chốt với NCC trước khi lập PO (nguồn quyết định: user, 2026-11-11).

| Lệnh PO | Hành vi |
| --- | --- |
| `POST /api/purchase-orders` | Tạo `DRAFT` từ RR đã duyệt, dùng `creationKey`. |
| `PUT /api/purchase-orders/:id` | Sửa nội dung khi còn `DRAFT`, dùng `expectedVersion` và `operationKey`. Với version hiện tại của PO đã phát hành, trả 400 `Chỉ sửa trực tiếp PO nháp`. |
| `POST /api/purchase-orders/:id/confirm` | Phát hành nháp sang `OPEN` và ghi `header.issuedAt`. |
| `POST /api/purchase-orders/:id/expected-on` | Đổi ngày dự kiến khi PO `OPEN` hoặc `PARTIAL`. Body gồm `expectedVersion`, `operationKey`, `expectedOn` dạng ISO 8601 có múi giờ và `reason` bắt buộc. Kiểm `purchase_order:update` và quyền truy cập kho của PO. Trả biên nhận với phiên bản mới. Phiên bản cũ trả 409. Trạng thái khác trả 400 khi phiên bản khớp. |
| `POST /api/purchase-orders/:id/close-requests`, `/close-approvals`, `/close-executions` | Đề nghị, duyệt độc lập và thực hiện đóng phần chưa nhận. Kiểm lượng đã nhập và cam kết nháp, lưu quyết định và lượng hủy riêng với lượng đặt. |

Khi tạo hoặc sửa PO nháp, nhiều phần tử trong `lines[]` có thể dùng chung một `rrLineId`. Trong mỗi PO, tổng lượng gốc của các dòng cùng nguồn phải nhỏ hơn hoặc bằng `approvedQtyBase` của dòng RR đó. BE kiểm lại tổng này khi phát hành qua `/confirm`. Khi sửa, giữ `lines[].id` của từng dòng đã lưu và bỏ `id` cho dòng mới.

Mỗi dòng RR chỉ xuất hiện một lần trong `lines[]`; gửi trùng `rrLineId` trả 400 "Gộp lượng của cùng dòng RR" (quyết định 14/11/2026: tách theo lô làm khi kiểm hàng và nhập kho). `lines[].note` là chuỗi tùy chọn. BE bỏ khoảng trắng đầu cuối và yêu cầu từ 1 đến 2000 ký tự nếu gửi trường này. Có thể dùng ghi chú để ghi lô NCC báo giao. `PUT` thay toàn bộ nội dung dòng, nên cần gửi lại `note` nếu muốn giữ ghi chú hiện có. `GET /api/purchase-orders/:id` trả ghi chú đã lưu tại `items[].note`. Với PO nháp, `draftEdit.lines[].note` là chuỗi hoặc `null` khi chưa có ghi chú. Kho chọn lô thực nhận bằng `lotId` trên dòng kiểm nhận. Ngày dự kiến giao dùng chung `header.expectedOn`.

Trạng thái PO: `DRAFT`, `OPEN`, `PARTIAL`, `COMPLETED` (nhận đủ), `CLOSED` (đã chốt thiếu và hủy phần còn lại). `PARTIAL` chỉ đặt khi có phiếu nhập `POSTED`. Đảo phiếu nhập tính lại `PARTIAL`/`OPEN` cho PO `OPEN`, `PARTIAL` hoặc `COMPLETED`, còn PO `CLOSED` giữ nguyên `CLOSED` (quyết định user, 2026-11-11). `GET /api/purchase-orders` và `GET /api/purchase-orders/:id` trả thêm `hasOpenReceivingWork`: `true` khi PO `OPEN`/`PARTIAL` còn phiếu nhập nháp hoặc kiểm nhận nháp, để FE hiện nhãn “Đang nhận hàng” mà không thêm trạng thái PO.

`POST /api/purchase-orders/:id/supplier-confirmations` và `POST /api/purchase-orders/:id/amendments` đã được gỡ và trả 404. DTO PO bỏ thông tin xác nhận NCC trên đầu phiếu và dòng. Chi tiết FE hiện vẫn có cột “NCC xác nhận” với giá trị rỗng từ bộ ánh xạ phía FE.

Quyết định người dùng ngày 11/11/2026 bỏ `items[].deliverySchedule` khỏi PO. Đánh giá RR hiển thị `header.expectedOn` cùng lượng PO chưa nhận và phát cảnh báo cho PO `OPEN`/`PARTIAL` cùng kho và sản phẩm còn lượng dương. Ngày dự kiến có thể sau hạn cần hoặc vắng mặt. Lệnh đổi ngày ghi AuditLog `RESCHEDULE_PO_EXPECTED_ON` với lý do, hai phiên bản và giá trị `header.expectedOn` trước/sau.

`GET /api/purchase-orders/:id/receiving-summary` trả `documents` thay `schedules` và giữ `quantities`, `tripCount`, `openWork`. Mỗi chứng từ có `kind` (`INSPECTION` hoặc `GR_PURCHASE`), `id`, `documentNo`, `workflowStatus`, `occurredAt` nếu có, `createdAt` và `lines: [{ poLineId, qtyBase }]`. `qtyBase` là chuỗi thập phân. Phiếu kiểm lần theo dòng hàng đến để lấy dòng PO. `poLineId` là `null` nếu dòng chứng từ thiếu liên kết. Danh sách sắp mới nhất theo `occurredAt` hoặc `createdAt` nếu thiếu `occurredAt`, rồi theo ID giảm dần khi cùng thời điểm. Chỉ Owner/Accountant nhận thông tin giá. FE hiện dùng `GET /api/purchase-orders/:id/receiving-trips` có phân trang và chưa nối `documents` hay lệnh đổi ngày.

PO cũ chưa ghi lại có thể còn `deliverySchedule` trong MongoDB. DTO và đánh giá RR bỏ qua trường này. `saveVersion` thay cả mảng `items` bằng dữ liệu đã lọc nên lần ghi phiên bản tiếp theo loại trường cũ trên PO đó. Không cần chạy migration.

POST /purchase-orders/:id/inspections tạo GoodsArrival và GoodsInspection cùng giao dịch; payload có expectedPoVersion, creationKey, arrivedAt, deliveredBy, deliveryReference, lines. Dòng dùng poLineId, lotId, enteredQty, qualityCode, ownershipDecision ACCEPT/CUSTODY/REJECT, packagingCondition SEALED/OPENED/TORN/UNKNOWN và handlingNote nếu có. PUT /goods-inspections/:id dùng expectedVersion/operationKey cùng nội dung. Confirm dùng expectedPoVersion và destinations[{inspectionItemId,locationId}].

Confirm kiểm nhận tạo GoodsReceipt `PURCHASE`/CustodyReceipt nháp, chưa ghi tồn. POST /goods-receipts/purchase/:id/post nhận expectedVersion, expectedPoVersion, operationKey và packaging nếu cần. Nhập sở hữu kiểm chất lượng/nguồn/hạn mức rồi mới tăng tồn STORE. Hàng giữ hộ dùng /custody-receipts/:id/post với handedOverBy (tùy chọn), destinations[{lineId,locationId}], ghi tồn SUPPLIER, không tăng lượng PO nhận sở hữu. [Hợp đồng năm loại phiếu](GOODS_RECEIPTS.md).

packaging là [{lineId,portions:[{packagingState,quantityBase,measuredVolumeMm3,...}]}]. Hàng không nguyên thùng phải có khai báo quy cách thực đo; lượng thùng nguyên có thể lấy quy cách cố định của lô. Tổng portions phải bằng lượng nhập. Không được tự coi hàng mở/lẻ là thùng nguyên.

GET receipt/custody bổ sung inspectionResult trên từng item để hiển thị chất lượng và tình trạng bao bì từ kiểm nhận; đây là dữ liệu đọc, không thêm field lưu trên item. GET inspection bổ sung arrival, receipts, custodyReceipts. FE chuyển các DTO này thành dòng bảng hiển thị, không ghi trở lại dạng cũ.

Putaway tạo TransferOrder và xác nhận từng phần; lượng đã xếp lấy từ ledger. Không tự mở thùng: mỗi dòng cất là số thùng nguyên, có thể cộng trọn phần lẻ (phần lẻ không chia nhỏ và đi sau các thùng nguyên). `POST /goods-receipts/purchase/:id/putaway-tasks` mô phỏng `splitPortions` trên quy cách tồn nguồn và trả 400 ngay khi lập lệnh nếu vi phạm; bỏ qua mô phỏng khi tồn nguồn còn lệnh cất khác đang mở, lúc đó `confirm` vẫn kiểm cuối. `GET .../putaway-context` trả thêm `piecesPerCarton` và `looseQtyBase` cho từng dòng. Hủy chỉ hủy phần chưa thực hiện. Warehouse đảo nhập mua trực tiếp qua /goods-receipts/purchase/:id/reverse, tạo StockReversal POSTED và bút toán ngược một lần, khôi phục hạn mức PO; không yêu cầu duyệt độc lập. GR từ giữ hộ đảo STORE về SUPPLIER gốc. `OTHER` có Bỏ ghi trực tiếp theo điều kiện. Không đảo khi đã có nghiệp vụ phụ thuộc. Bằng chứng là Attachment riêng tư, kiểm nội dung JPEG/PNG/PDF, quyền tải và hạn dùng.

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
