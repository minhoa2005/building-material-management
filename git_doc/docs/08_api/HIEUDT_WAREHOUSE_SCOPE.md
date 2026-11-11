# HieuDT — phạm vi 20 UC được giao ngày 12/11/2026

Bản này đối chiếu bảng người dùng dán mới nhất; thay cách xác định phạm vi HieuDT theo bảng 18 UC cũ. Những chức năng bán/kiểm kê/báo cáo đã làm trước được giữ nguyên. Nguồn thiết kế: phiếu duyệt kho/vị trí 05, H06–H08 ở phiếu 16 và H09–H11 ở phiếu 17. Không thêm collection/model, không seed hoặc ghi DB nhóm.

## Đối chiếu màn hình và API

Tất cả API có tiền tố /api, yêu cầu xác thực và quyền thật từ session.

| UC | Màn hình FE | API |
|---|---|---|
| 38 | /warehouses | GET /warehouses; GET /warehouse-catalogue; GET /warehouse-locations |
| 39 | /warehouses/locations/:id | GET /warehouse-locations/:id |
| 40 | /warehouses/create; /warehouses/locations/create | POST /warehouse-catalogue; POST /warehouse-locations |
| 41–42 | /warehouses/locations/:id/edit | PATCH /warehouse-locations/:id |
| 43 | /inventory | GET /inventory/options; GET /inventory |
| 44 | /inventory/:id | GET /inventory/:id; GET /stock-movements?balanceId= |
| 47–48 | /location-moves; /location-moves/:id | GET /location-movements; GET /location-movements/:id |
| 49 | /location-moves/create; /location-moves/:id/edit | POST /location-movements; PATCH /location-movements/:id |
| 50 | /location-moves/:id | POST /location-movements/:id/confirm |
| 51–52 | /transfers; /transfers/:id | GET /warehouse-transfers; GET /warehouse-transfers/:id |
| 53 | /transfers/create; /transfers/:id/edit | POST /warehouse-transfers; PUT /warehouse-transfers/:id |
| 54 | /transfers/:id | POST /warehouse-transfers/:id/review |
| 55 | /transfers/:id | POST /warehouse-transfers/:id/outbound-deliveries; /documents/:id/internal-requirements; /tasks/:id/confirm; /dispatches/:id/cancel |
| 56 | /transfers/:id | POST /warehouse-transfers/dispatches/:id/differences; /differences/:id/review |
| 114–115 | /inventory/movements; /inventory/movements/:id | GET /stock-movements/options; /stock-movements; /stock-movements/:id |
| 120 | /transfers/:id | POST /warehouse-transfers/dispatches/:id/receipts; /documents/:id/internal-requirements; /tasks/:id/confirm |

## Kho, vị trí và tồn kho

GET /warehouses vẫn trả options theo phạm vi; GET /warehouse-catalogue trả danh sách kho cửa hàng với số vị trí; GET /warehouse-catalogue/:id trả chi tiết. POST/PATCH /warehouse-catalogue dùng warehouse_location:create/update để Owner quản lý kho. Mã kho bất biến sau tạo; tên/địa chỉ/mô tả/kích thước/trạng thái được sửa bằng expectedUpdatedAt + idempotencyKey. Không thể ngừng kho còn tồn, reservation, nhiệm vụ mở; thay đổi kích thước vẫn kiểm tra sức chứa thực. Kho được phân công mới hiển thị cho non-Owner; Owner xem toàn bộ. Danh sách vị trí lọc q literal theo mã/tên/khu vực/mô tả, warehouseId, active=true|false, type, page, limit≤100. Chỉ dùng trường mô hình đã duyệt: areaCode, không tạo aisle/rack giả.

Đọc vị trí dùng warehouse_location:read; tạo dùng warehouse_location:create; sửa/trạng thái dùng warehouse_location:update. Owner mặc định có quyền, custom role theo grant và kho. POST nhận warehouseId, code≤50, name≤160, locationType, usableLengthMm/usableWidthMm chuỗi dương, isPickable, isActive, areaCode/description tùy chọn và idempotencyKey. PATCH thêm expectedVersion. Không đổi warehouseId sau tạo. Chỉ STORAGE được isPickable. Chiều cao lấy clearHeightMm thực của kho.

Lệnh danh mục dùng command/transaction: tải lại actor/quyền, optimistic version, idempotency receipt, audit/outbox. Khóa operationVersion của vị trí cạnh tranh với lệnh ghi tồn/khóa kiểm kê. Không sửa khi freeze; không ngừng/đổi loại/đổi khả năng lấy hàng nếu còn tồn dương, reservation chưa dùng hoặc nhiệm vụ mở; không đổi mã/kích thước khi còn nhiệm vụ. Sau sửa kiểm lại sức chứa thực. Không sinh giao dịch hoặc sửa quantityBase.

GET chi tiết trả warehouse, stock theo lô/chất lượng/chủ hàng, locked, openTaskCount, capacity={capacityMm3,occupiedMm3}. Thiếu kích thước trả null; thiếu quy cách thực đo trả occupiedMm3=null, không suy ra số giả.

Đọc tồn dùng inventory:read. Bộ lọc warehouseId/locationId/productId/batchId/balanceId/quality/ownerType/q/page/limit. Options lấy sản phẩm/lô/vị trí từ các số dư thuộc phạm vi. Tồn theo từng sản phẩm giữ đơn vị gốc, không cộng gạch khác đơn vị thành KPI tổng. Các số lượng là decimal strings:

- physicalQtyBase: tồn ở điểm vật lý; IN_TRANSIT không tính vật lý.
- transitQtyBase: lượng còn ở điểm giữ IN_TRANSIT liên kết dòng phiếu xuất của kho nguồn.
- custodyQtyBase: lượng CUSTOMER/SUPPLIER; không coi là hàng cửa hàng.
- heldQtyBase: hold thực còn hiệu lực.
- reservedQtyBase: reservation còn lại sau consumed/released/moved.
- pendingQtyBase: lượng nhiệm vụ còn mở chưa được reservation bao phủ; không trừ reservation hai lần.
- usableQtyBase: hàng GOOD/STORE, lô VERIFIED, sản phẩm/kho/vị trí hoạt động, không freeze, trừ hold; gồm hàng tốt ở khu nhận/tập kết.
- availableQtyBase: khả dụng cấp hàng ở STORAGE pickable; trừ reservation, nhiệm vụ chưa được bao phủ và hold, chặn hàng lỗi/giữ hộ/transit/freeze.

Sales chỉ nhận availableQtyBase và định danh catalogue, không nhận tồn vật lý, hold, reservation hoặc tồn giữ hộ. Kho scope áp trước lookup/pagination. Chi tiết không thấy số dư trả 404, kho không có quyền trả 403; không fallback localStorage.

## Nhật ký tồn

stock_movement:read; list/options/detail áp phạm vi điểm giữ của kho trước phân trang. Bộ lọc q (sản phẩm/SKU/lô/vị trí/operation), warehouseId/locationId/productId/batchId/balanceId, operation, from/to ISO có múi giờ, page/limit. Options.operations lấy distinct từ giao dịch thật được phép xem. Từ/đến ngày gồm hai đầu, ngày đảo hoặc trường lạ bị từ chối 400.

Mỗi hàng là một movements[] đã ghi trong StockTransaction: id dòng, transactionId, operation, occurredAt, recordedAt, performedBy từ User, quantityBase, from/to và before/after. Đầu tồn ngoài scope trả null; không lộ số lượng đầu ngoài kho. source chỉ trả mã/loại/lý do khi người đọc có quyền chứng từ nguồn tương ứng; PICK/PUTAWAY BF04 và receipt TRANSFER dùng stock_transfer:read. Thiếu chứng từ/lý do hiển thị chưa có thông tin, không tự điền người hoặc nguyên nhân.

## BF03/BF04

Chi tiết giữ tại [BF03](location-movements/README.md) và [BF04](transfers/BF04_API.md). BF03 q tìm cả sản phẩm/SKU/lô; xác nhận chuyển nguyên tử giữ nguyên lô/chất lượng/chủ hàng và reservation, kiểm freeze/capacity. Tạo/sửa/xác nhận/tìm kiếm dùng native API, không seed UI.

BF04 options của Sales chỉ trả catalogue kho, không trả locations/holdingPoints/balances/batches/products hoặc sourceWarehouseIds tác nghiệp; đã xác minh đọc trên DB review local. BF04 trả REVISE -> REVISION_REQUIRED; chỉ người lập có quyền update và kho nguồn được sửa/gửi lại chưa duyệt, giữ ID dòng tương ứng. Phiếu xuất DRAFT giữ nguồn thật ngay lúc tạo, chuyển reservation sang PICK task khi sinh TO. Xác nhận PICK + bàn giao là giao dịch nguyên tử đã duyệt; không tạo GI thứ hai. Hủy draft do người lập giải phóng reservation, hủy task/requirement mở, trả hạn mức dòng TR, giữ lịch sử và không ghi tồn.

Detail thêm progress theo dòng dispatch và lineProgress theo dòng TR: dispatchedQtyBase, receivedGoodQtyBase, receivedDamagedQtyBase, transitQtyBase, unresolvedQtyBase. Số nhận lấy phiếu POSTED trừ đảo thực, số transit lấy số dư điểm giữ, không dùng số kế hoạch hoặc tổng UI.

Nhận độc lập, cho phép nhiều lần và tách GOOD/DAMAGED cùng dòng; lượng chưa nhận còn transit. Hàng tốt nhận RECEIVING rồi PUTAWAY vào STORAGE, hàng lỗi nhận QUARANTINE kèm lý do. Phiếu toàn hàng lỗi không tạo TO rỗng. Đóng chỉ khi xuất đủ duyệt, không còn transit/hồ sơ chênh lệch và đã cất mọi phần hàng tốt.

UC56 báo lượng chưa nhận bằng stock_transfer:update tại kho đích, expectedVersion của dispatch; chưa vượt transit hoặc trùng hồ sơ mở. Lưu StockDiscrepancy sẵn có với mã CLCK do server cấp, nguồn dispatch và từng sourceLineId. Duyệt dùng stock_transfer:approve_variance, người duyệt khác người báo. APPROVE cần receiptId của phiếu POSTED cùng dispatch được lập sau báo, lượng thực chưa đảo đủ và chưa dùng cho hồ sơ khác. Ghi ApprovalHistory + resolutionEvents liên kết giao dịch thực, không sửa lượng phiếu đã post. REJECT/REVISE lưu lịch sử quyết định và giữ hồ sơ OPEN. Lượng thiếu chưa có chứng từ xử lý tiếp tục mở; không tự ghi mất hàng/write-off.

FE dùng trang riêng cho tạo/sửa/xem, header/breadcrumb/trạng thái, tìm kiếm/dropdown/phân trang; bảng cuộn ngang trên điện thoại. Lệnh chưa rõ kết quả giữ đúng key/payload để thử lại. Cache tồn/options/overview/nhật ký được làm mới sau các lệnh kho. Không dùng số kho/KPI/tồn/hàng mẫu làm fallback khi API lỗi. Nhãn enum/brand/giao diện là cấu hình hiển thị hợp lệ.

## Kiểm chứng và triển khai

Xem [hướng dẫn kiểm thử local](../09_phat_trien/HIEUDT_LOCAL_TESTS.md). Không có migration schema; giữ collection/index và liên kết tài liệu cũ. Đích review vẫn loopback 27018; không thay DB nhóm hoặc tự triển khai.
