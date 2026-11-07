# Đồng bộ Iteration 1 native — quyết định 06/11/2026

Nguồn: người dùng phê duyệt kế hoạch trong chat và yêu cầu triển khai. Các quyết định này thay các phần tương ứng trong phiếu duyệt cũ.

## Model hiện hành

Registry có 60 collection, gồm Uom. UOM chỉ quản lý mã/tên/isActive/timestamps, mã bất biến; không có conversion collection. Product.baseUnit là mã được BE kiểm ở danh mục hoạt động, không phải ObjectId. Dòng chứng từ giữ hệ số và đơn vị snapshot. Ngừng dùng UOM không đổi lịch sử. Custom UOM chỉ dùng với factor=1 khi là đơn vị gốc; BOX/Thùng lấy số viên từ lô, M2/m² theo kích thước; không chấp nhận làm tròn.

Product thêm surface(100), origin(100), description(2000) tùy chọn. nominalSize chỉ được tính khi đọc, giữ nguyên decimal lengthMm x widthMm, không lưu. Hãng/SKU/màu và categoryId giữ nguyên. Lô không tone/calibre. Supplier thêm taxCode(50), notes(2000), statusReason(2000); status ACTIVE/SUSPENDED/TERMINATED, mặc định ACTIVE, contactName giữ tên mới. Catalogue dùng expectedUpdatedAt, chứng từ dùng expectedVersion.

PurchaseReceipt và CustodyRelease có custodyDecisionId → ApprovalHistory. GR từ giữ hộ dùng custodyReceiptRef gồm documentId/itemId/revision, custodyBalanceId và sources. StockTransaction.movements[].packagingPortionIds giữ ID phần bao bì đã ghi nhận để đảo đúng phần, kể cả balance đã chứa tồn cũ. ApprovalHistory quyết định giữ hộ có decisionScope PURCHASE_CUSTODY, reviewedContent.action ACCEPT/RETURN và reviewedContent.lines. Quyết định bất biến, phân biệt người lập phiếu với Accountant quyết định.

## API và quyền

- GET /api/uoms và GET /:id: uom:read. POST /api/uoms: code,name; uom:create. PUT /:id: expectedUpdatedAt,name; uom:update. PATCH /:id/status: expectedUpdatedAt,isActive,reason; uom:activate. Owner có quyền quản lý; business roles đọc. Không có DELETE hoặc đổi mã.
- Sản phẩm native dùng manufacturerCode/categoryId/baseUnit/heightMm và metadata mới. Không nhận baseUomId, conversionId, thicknessMm hoặc nominalSize ghi vào.
- NCC dùng contactName/status/taxCode/notes, expectedUpdatedAt. names yêu cầu supplier:read và chỉ trả ACTIVE.
- RR → PO là một–một, unique index bảo vệ cả hai lệnh đồng thời. PO có giá, currency và tổng decimal; Owner/Accountant xem giá, các vai trò khác bị redaction. Confirm kiểm lại quyết định duyệt, lượng, sản phẩm và NCC.
- Kiểm nhận ACCEPT chỉ GOOD; confirm tạo GR/CustodyReceipt DRAFT, không ghi tồn. Post GR trực tiếp ghi STORE/GOOD tại RECEIVING. Post custody ghi SUPPLIER vào CUSTODY/QUARANTINE; REJECT không ghi tồn. Lượng giữ hộ không tính đã nhập sở hữu PO.

### Giữ hộ

Các POST dưới /api/custody-receipts/:id đều có expectedVersion,operationKey.

| Đường dẫn | Body bổ sung | Quyền |
|---|---|---|
| reinspections | reason,evidenceIds,lines[{custodyItemId,qtyBase,qualityCode}] | goods_receipt_inspection:update |
| resolution-decisions | reason,evidenceIds,decision ACCEPT/RETURN,lines[{custodyItemId,qtyBase,reinspectionId?}] | purchase_custody:decide — Accountant |
| purchase-receipts | decisionId,expectedPoVersion,lines[{custodyItemId,qtyBase,destinationLocationId}] | purchase_custody:execute — Warehouse |
| releases | decisionId,lines[{custodyItemId,qtyBase}] | purchase_custody:execute — Warehouse |

POST /api/custody-releases/:id/post có expectedVersion,operationKey,recipientName; cùng quyền execute. GET /api/custody-releases/:id dùng quyền đọc nhận mua. Decision command trả decisionId, replay trả cùng ID. Kết quả kiểm lại là GoodsInspection CONFIRMED mới, không tạo chuyến vật lý mới. Quyết định áp dụng đúng source version; một lần lập phiếu tiêu thụ quyết định, lượng còn lại lập quyết định mới. Tổng lượng đã thực hiện và nháp không vượt nguồn. ACCEPT cần GOOD, headroom PO và PO mở. RETURN vẫn được thực hiện khi PO đã đóng.

GR từ giữ hộ trừ SUPPLIER và cộng STORE trong một transaction, giữ packaging và tổng lượng vật lý; không nhập từ bên ngoài lần hai. Quy tắc tách bao bì giữ nguyên: thùng niêm phong chia theo nguyên thùng; phần mở/lẻ đã đo phải chọn trọn phần, không tự suy thể tích cho lượng lẻ. Trả NCC chỉ giảm SUPPLIER, không giảm lượng PO nhận sở hữu. Kho, người dùng, chứng cứ, nguồn, trạng thái, version, freeze và capacity được kiểm phía BE.

### Đảo nhập

POST /api/purchase-receipts/:id/reverse: expectedVersion,expectedPoVersion,operationKey,reason,evidenceIds; Warehouse có reverse và post trong kho thực hiện nguyên tử, tạo StockReversal POSTED. Không tạo PENDING_APPROVAL mới. Endpoint review chỉ còn hồ sơ lịch sử; endpoint post cũ từ chối dùng cho API mua mới.

Đảo nhập trực tiếp giảm STORE ra ngoài; đảo nhập từ giữ hộ chuyển STORE về balance SUPPLIER gốc. Hoàn hạn mức PO đúng một lần; unique reversedTransactionId và operation key chặn ghi lặp. Chặn khi có putaway, giữ hàng, giao dịch hoặc kiểm kê phụ thuộc. Trường approvalDecision giữ cho hồ sơ lịch sử.

## Mapping FE đợt sau

FE src/fe hiện còn payload cũ. Chuyển baseUomId→baseUnit code; thicknessMm→heightMm; brand→manufacturerCode; category text→categoryId; contactPerson→contactName; cooperationStatus→status; expectedVersion catalogue→expectedUpdatedAt. Không giả conversionId tương ứng UOM; bỏ endpoint conversion cũ. Render nominalSize chỉ đọc. Đổi /po-inspections thành /goods-inspections. Nhận mua cần ownershipDecision/qualityCode/packagingCondition và destinations. Đảo nhập không cần review bước hai. Sửa fixture/UI trong đợt FE riêng; không claim FE đang tương thích.

## Dữ liệu và giới hạn triển khai

Script scripts/migrate-iteration1-native.mjs mặc định dry-run, chỉ nhận DB loopback có tên wmsd_api_test_* hoặc wmsd_migration_test_*. PENDING→SUSPENDED (chưa xác nhận hoạt động), INACTIVE→SUSPENDED; ACTIVE giữ nguyên, không suy TERMINATED. Seed UOM từ baseUnit và snapshot đơn vị đang dùng, báo mã không có quy tắc quy đổi. Không đổi snapshot, không gộp PO, chặn legacy thiếu nguồn hoặc nhiều PO cùng RR. --apply chỉ ghi test DB local. Không chạy Atlas hoặc DB demo đang dùng.

Lệnh: node scripts/migrate-iteration1-native.mjs --uri=mongodb://127.0.0.1:27017/wmsd_migration_test_example?replicaSet=rs0 [--apply]. Bổ sung quyền vào catalogue/role mặc định; DB đang dùng cần đồng bộ quyền trước rollout có kiểm soát.

[Kết quả kiểm chứng](ITERATION1_NATIVE_VERIFICATION.md). [Data Dictionary mới](../03_thiet_ke/DB_Current_2026-11-06_60/WMSD_Data_Dictionary.md), [sơ đồ quan hệ](../03_thiet_ke/DB_Current_2026-11-06_60/Iteration1_Model_Relationships.svg).
