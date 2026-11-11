# BF04 API

Hợp đồng native hiện hành: [BF04_API.md](BF04_API.md).

`GET /api/warehouse-transfers` nhận `sourceWarehouseId`,
`destinationWarehouseId`, `status`, `from`, `to`, `page` và `limit` (tối đa 100).
Kết quả trong envelope `data={items,total,page,limit}`. Bộ lọc lạ, toán tử và ngày
không hợp lệ trả 400. Scope được lọc trước phân trang.

`GET /api/warehouse-transfers/:id` trả TR với `header`, `items`, các dispatch,
receipt, internalRequirements, tasks và approvals native. Các dòng nằm trong
`items[]`, số lượng là decimal string. Sales chỉ nhận tiến độ dispatch/receipt;
không trả dữ liệu vận hành nội bộ của chúng.

`GET /api/warehouse-transfers/options` trả danh mục kho hoạt động để chọn kho
đích, và `sourceWarehouseIds` cho kho được thao tác. Truyền `warehouseId` chỉ trả
vị trí/tồn khi caller có quyền trong kho đó. Products là danh mục đang hoạt động;
balances/batches dùng cho chọn tồn xuất.

Mọi route cần `stock_transfer:read`. Owner đọc toàn cửa hàng, Accountant đọc dữ
liệu đối chiếu, Sales chỉ đọc TR liên kết nhu cầu của chính mình; người dùng còn
lại đọc trong kho được phân công. Các command kiểm thêm quyền tương ứng, nguồn,
version, trạng thái và tách người duyệt/nhận như hợp đồng chính.

Kiểm tra DTO: `node --test test/transfer-reads.test.js`. Luồng transaction native:
`RUN_NATIVE_API_TESTS=1 node --test test/native-api.integration.test.js`, dùng DB
test ngẫu nhiên tại localhost:27028, không dùng URI ứng dụng.
