> Quyết định mới 06/11/2026: [Iteration 1 native](ITERATION1_NATIVE_2026-11-06.md) thay quy tắc UOM, NCC, giữ hộ và đảo nhập ở các phần lịch sử bên dưới. Danh mục UOM được khôi phục; không có bảng conversion. Warehouse tự đảo nhận mua; Accountant quyết định xử lý giữ hộ.

# Hợp đồng runtime theo model mới — 06/11/2026

Nguồn quyết định: người dùng yêu cầu đồng bộ toàn project, xác nhận bỏ src/models/legacy, rebuild, embedded và duyệt danh sách 42 file phụ thuộc cùng 6 lệnh cũ. Đây là hợp đồng hiện hành; các test pack và báo cáo trước lần chuyển là bằng chứng lịch sử, không phải payload cho runtime này.

## Lưu trữ và bảo vệ thao tác

The runtime uses one registry: `src/models/index.js` exports `registerModels(connection)`; `runtime.js` supplies API models. There are 60 collection schemas (`*.model.js`) and 96 nested schemas (`*.schema.js`) directly under `src/models`. Nested schemas do not create collections. `registerReviewedModels` is a compatibility alias. No legacy profile or migration-model registration remains. Pure historical transforms and synthetic fixtures under `src/migrations/rebuild` and `src/seeds/rebuild` remain for regression checks.

API trả decimal dưới dạng chuỗi; ObjectId thành chuỗi. Chứng từ có _id/id, documentNo, documentKind, workflowStatus, version, header, items và sources. items có _id ổn định, productId, lotId khi có, enteredQty, enteredUnit, baseUnitsPerUnit, qtyBase, baseUnitSnapshot. Sources dùng subjectCollection, documentId, itemId, linkedQty, relationCode. Không gửi conversionId hoặc dòng BusinessDocument cũ.

Lệnh ghi chứng từ kiểm quyền hiện tại, kho, trạng thái, nguồn và expectedVersion trong transaction. creationKey/operationKey được gắn actor và hash nội dung; thử lại dùng nguyên key lẫn payload. AuditLog, OperationRecord và BusinessEvent PENDING ghi cùng giao dịch. Lệnh ghi tồn cập nhật balance, packagingPortions, StockTransaction.movements, nguồn và hạn mức nguyên tử; kiểm khóa kiểm kê và sức chứa. Catalogue sửa bằng expectedUpdatedAt.

## Tài khoản, danh mục

User có một roleId và warehouseIds; email/phone/fullName được lưu trực tiếp. GET /users/options trả vai trò hoạt động và kho hoạt động. GET /roles/permissions trả danh mục để chọn quyền; tạo role không tạo permission mới. Vai trò tùy chỉnh được xét theo quyền thay vì chỉ tên vai trò. Giá mua vẫn chỉ dành Owner/Accountant theo quyết định đã duyệt.

Product dùng manufacturerCode, sku, color, categoryId, baseUnit, wholeBaseUnits, lengthMm/widthMm/heightMm và stockThresholds nhúng. Lô dùng productId, manufacturerLot, identificationStatus VERIFIED/UNKNOWN, piecesPerCarton, cartonLengthMm/cartonWidthMm/cartonHeightMm. Không tone/calibre hay bảng quy đổi. Uom là danh mục mã/tên/trạng thái do Owner quản lý; Product.baseUnit giữ mã được kiểm bởi service. Supplier dùng contactName, taxCode, notes và status ACTIVE/SUSPENDED/TERMINATED; tạo mới ACTIVE. Tồn lô dùng quantityBase/qualityStatus; biến động dùng quantityBase.

## Mua và nhập

RR lưu header/items/submissions; duyệt tạo ApprovalHistory độc lập người lập, kiểm đầy đủ từng dòng và lượng nguyên nếu sản phẩm yêu cầu. Một RR tối đa một PO, thuộc một NCC/kho. PO giữ source và snapshot giá, trạng thái/version, lịch nhận trên dòng. Sửa/đóng PO kiểm lượng đã nhập và cam kết nháp.

POST /purchase-orders/:id/inspections tạo GoodsArrival và GoodsInspection cùng giao dịch; payload có expectedPoVersion, creationKey, arrivedAt, deliveredBy, deliveryReference, lines. Dòng dùng poLineId, lotId, enteredQty, qualityCode, ownershipDecision ACCEPT/CUSTODY/REJECT, packagingCondition SEALED/OPENED/TORN/UNKNOWN và handlingNote nếu có. PUT /goods-inspections/:id dùng expectedVersion/operationKey cùng nội dung. Confirm dùng expectedPoVersion và destinations[{inspectionItemId,locationId}].

Confirm kiểm nhận tạo PurchaseReceipt/CustodyReceipt nháp, chưa ghi tồn. POST /purchase-receipts/:id/post nhận expectedVersion, expectedPoVersion, operationKey và packaging nếu cần. Nhập sở hữu kiểm chất lượng/nguồn/hạn mức rồi mới tăng tồn STORE. Hàng giữ hộ dùng /custody-receipts/:id/post với handedOverBy, destinations[{lineId,locationId}], ghi tồn SUPPLIER, không tăng lượng PO nhận sở hữu.

packaging là [{lineId,portions:[{packagingState,quantityBase,measuredVolumeMm3,...}]}]. Hàng không nguyên thùng phải có khai báo quy cách thực đo; lượng thùng nguyên có thể lấy quy cách cố định của lô. Tổng portions phải bằng lượng nhập. Không được tự coi hàng mở/lẻ là thùng nguyên.

GET receipt/custody bổ sung inspectionResult trên từng item để hiển thị chất lượng và tình trạng bao bì từ kiểm nhận; đây là dữ liệu đọc, không thêm field lưu trên item. GET inspection bổ sung arrival, receipts, custodyReceipts. FE chuyển các DTO này thành dòng bảng hiển thị, không ghi trở lại dạng cũ.

Putaway tạo TransferOrder và xác nhận từng phần; lượng đã xếp lấy từ ledger. Hủy chỉ hủy phần chưa thực hiện. Warehouse đảo nhập trực tiếp qua /purchase-receipts/:id/reverse, tạo StockReversal POSTED và bút toán ngược một lần, khôi phục hạn mức PO; không yêu cầu duyệt độc lập. GR từ giữ hộ đảo STORE về SUPPLIER gốc. Trường duyệt chỉ giữ cho lịch sử. Không đảo khi đã có nghiệp vụ phụ thuộc. Bằng chứng là Attachment riêng tư, kiểm nội dung JPEG/PNG/PDF, quyền tải và hạn dùng.

## Chuyển kho và bán

Chuyển ô dùng TransferOrder RELOCATE, một lần xác nhận toàn lệnh bởi người lập. Chuyển liên kho đi TR → duyệt → Dispatch → PICK và bàn giao → transit → Receipt bởi người khác → PUTAWAY → đóng. PICK bắt buộc recipientName, biển số nếu có. Hàng không đạt chuyển vào QUARANTINE. Mỗi bước giữ hạn mức và kiểm quyền/kho/version.

API sales-orders dùng SalesOrder, ExternalReference và Attachment mới, redaction giá theo quyền. D07/D08 chưa có quyết định xác minh nguồn ngoài; không tự suy ra người xác minh được duyệt. Các màn hình prototype ngoài router API đang triển khai không chứng minh đã có đầy đủ nghiệp vụ phía server.

## Bằng chứng và việc đang làm

Ba test tích hợp native trên DB local riêng đã qua: mua/nhập/xếp từng phần và replay; đảo nhập độc lập; chuyển kho đủ bước. FE build đã qua tại mốc kiểm tra trước các chỉnh sửa tiếp theo. Toàn suite FE hiện có 102 test thất bại/264 qua, 2 lỗi không bắt: nhiều fixture và kỳ vọng vẫn theo hợp đồng cũ; đang chuyển và chưa tuyên bố hoàn thành. Các kiểm tra cần chạy lại sau chỉnh sửa cuối. Không ghi dữ liệu Atlas, không commit/push.

## Historical return-source decision — 7 November 2026

The user confirmed Accountant verification with uploaded evidence for historical customer-delivery sources. This scope is implemented in [the native return contract](RETURN_WORKFLOWS_NATIVE.md). It does not settle broader new-SO external-source gates. Trungph return workflows now use the native registry; local automated verification and rollout limits are recorded in that contract and the PR evidence. No Atlas data or connection change.

## Chống trùng bổ sung theo nguồn — 07/11/2026

[Hợp đồng RR coverage](REPLENISHMENT_COVERAGE.md) quy định evaluate/source/token, cảnh báo thủ công, hủy RR và giao thức lock chung RR–PO–tồn. 60 collections, 97 nested schemas; nguồn RR và snapshot gửi duyệt dùng native schema, không tạo bảng policy/conversion.
