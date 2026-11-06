# Xem DB mẫu mới của WMSD

**Ưu tiên mới: thử trên localhost trước DB nhóm.** Bộ mẫu hiện đã có thêm trên máy tại `mongodb://127.0.0.1:27018/wmsd_demo_v2?replicaSet=wmsd-local`. Trong Compass tạo kết nối **WMSD Local** bằng URI này. [Hướng dẫn local và lệnh chạy](../09_phat_trien/MONGODB_LOCAL.md). Các mục bên dưới mô tả dữ liệu; thông tin kết nối cloud là lịch sử của lần tạo trước.

Ngày xác minh: 03/11/2026. Database cần mở: **wmsd_demo_v2**.

## Mở trong MongoDB Compass

1. Mở kết nối MongoDB bạn đang dùng để xem database `sep490`.
2. Làm mới danh sách database, chọn **wmsd_demo_v2**.
3. Chọn collection cần xem, mở phần **Documents**. Mở rộng `header`, `items`, `details`, `sources` để thấy dữ liệu từng phiếu/dòng.

Nếu chưa có kết nối, dùng giá trị `MONGODB_URI` trong file `.env` của backend tại `E:/Doan/CODE/BE/building-material-management`. Dùng URI đó để kết nối trong Compass; không cần sửa `.env`.

**Đây là DB dữ liệu mẫu mới.** API/FE hiện tại vẫn dùng DB `sep490` và model cũ. Chưa đổi URI của ứng dụng sang `wmsd_demo_v2`: các API cần được chuyển và kiểm thử trước. Dữ liệu mẫu không đồng nghĩa mọi chức năng trên giao diện đã chạy với cấu trúc mới.

## Phân biệt các database

| Database | Mục đích |
|---|---|
| `wmsd_demo_v2` | Bộ mẫu mới theo model đã bổ sung ngày 03/11; mở DB này để xem thiết kế và dữ liệu mới |
| `sep490` | DB ứng dụng hiện tại, giữ nguyên |
| `sep490_rebuild_20261102` | Bản chuyển thử dữ liệu cũ; còn các giá trị nguồn bị thiếu |
| `sep490_rebuild_20261102_backup` | Bản sao nguồn trước lần chuyển thử |

Bộ mới có **74 collection dữ liệu, 511 bản ghi**. Chứng từ có **79 phiếu** tính cả bàn giao nằm trong phiếu xuất, và **79 dòng hàng** nằm trong `items`. Có **15 nhóm số dư tồn**, **30 giao dịch tồn**, **34 dòng biến động**. Collection `_db_rebuild` chỉ lưu trạng thái kiểm chứng, không phải bảng nghiệp vụ.

## Nên xem theo thứ tự này

| Nội dung | Collection cần mở | Thông tin đáng chú ý |
|---|---|---|
| Sản phẩm và lô | `products`, `product_batches` | SKU + hãng; đơn vị gốc; mã lô, tông, cỡ |
| Kho, ô, sức chứa | `warehouses`, `warehouse_locations`, `storage_stacks`, `storage_stack_items` | Kích thước giả lập theo mm; hàng trong từng chồng; chưa có bản đồ 3D |
| Số dư và lịch sử | `inventory_balances`, `stock_holding_points`, `stock_transactions`, `stock_movements` | Số dư theo lô/vị trí/chất lượng/chủ hàng và từng lần tăng giảm |
| Nhập mua | `replenishment_requests`, `purchase_orders`, `goods_arrivals`, `goods_inspections`, `purchase_receipts` | Yêu cầu → PO → hàng đến → kiểm → phiếu nhập |
| BF03 | `transfer_orders` | Lệnh `DEMO2-RELOCATE`: đổi ô trong cùng kho, người tạo tự xác nhận |
| BF04 | `warehouse_transfer_requests`, `transfer_dispatches`, `transfer_receipts`, `internal_transfer_requirements`, `transfer_orders` | TR → phiếu xuất → yêu cầu lấy/TO → nhận → yêu cầu xếp/TO |
| Bán hàng | `sales_orders`, `warehouse_issue_requests`, `delivery_orders`, `sales_goods_issues`, `delivery_confirmations`, `sales_invoices` | Giá SO; ngày/số lượng xuất; lượng khách nhận; hóa đơn cuối |
| Trả và hàng lỗi | `customer_returns`, `supplier_returns`, `defect_reports`, `stock_holds`, `stock_scrap_records` | Phân biệt hàng khách trả, trả NCC, chặn hàng và hủy thực tế |
| Kiểm kê | `stocktakes`, `stocktake_snapshots`, `stocktake_counts`, `stocktake_resolution_plans`, `stocktake_location_locks` | Số sổ, các lần đếm/đếm lại, đề xuất xử lý và khóa ô |
| Tài khoản/quyền | `users`, `roles`, `permissions` | 6 tài khoản mẫu; 5 role ban đầu + 1 role tùy chỉnh; 101 mã quyền |

## Kịch bản chuyển kho và hóa đơn để kiểm tra

- `warehouse_transfer_requests`: tìm `{ "documentNo": "DEMO2-TR-TWO-DISPATCHES" }`. Yêu cầu duyệt 8 viên, chia hai phiếu xuất, mỗi phiếu 4 viên.
- `transfer_dispatches`: `DEMO2-DISPATCH-1` và `DEMO2-DISPATCH-2`. Mỗi phiếu có bàn giao trong `handovers` và tham chiếu dòng TR trong `items`.
- `transfer_receipts`: phiếu `DEMO2-RECEIPT-REMAINING` nhận nốt 2 viên của chuyến cũ đã nhận trước 18/20. Đây là ví dụ nhiều lần nhận trên cùng phiếu xuất.
- `transfer_orders`: tìm `{ "header.taskKind": "RELOCATE" }` để xem chuyển ô. Lệnh mới là `DEMO2-RELOCATE`.
- `sales_invoices`: hóa đơn `DEMO2-INVOICE` có hai dòng phiếu xuất vào hai ngày, tổng 12 viên khách nhận, giá mẫu 50.000 đồng/viên, thành tiền 600.000 đồng. Một kịch bản giao khác xuất 10, khách nhận 6 và 4 quay về; phần đó chưa phát hành hóa đơn cuối.
- `stocktake_counts`: tìm `{ "attemptNo": 2 }` để thấy lần đếm lại và `previousCountId` liên kết lần trước. Bản ghi lần một vẫn còn.

## Đọc đơn vị, số lượng và liên kết

- Không có collection UOM hoặc UOM Version. `products.baseUnit` là đơn vị gốc; dòng phiếu giữ `enteredUnit`, `enteredQty`, `baseUnitsPerUnit`, `qtyBase` và quy cách khi áp dụng.
- Các giá trị tiền/số lượng dùng Decimal128, Compass có thể hiển thị dưới dạng `NumberDecimal(...)` hoặc `$numberDecimal`.
- `_id` là mã liên kết. Trong chứng từ, `sources` truy về phiếu nguồn; trong mỗi `items`, `sources` truy về cả phiếu và dòng nguồn. Dòng có `_id` riêng nên đổi thứ tự không mất liên kết.
- `inventory_balances.quantityBase` là tồn theo đơn vị gốc. Không cộng thêm lượng trong `storage_stack_items`: đó là cách phân bố cùng lượng tồn vào chồng hàng.
- Bảng `stock_holding_points` phân biệt vị trí vật lý và hàng đang chuyển. Hàng giữ hộ có chủ sở hữu riêng.

Tên, giá, số điện thoại, kích thước và ảnh trong bộ này đều là dữ liệu giả lập. Ảnh bằng chứng là PNG mẫu ở [demo-fixtures](../../../../../../outputs/db_rebuild/demo-fixtures), chưa được upload lên dịch vụ ảnh. Email mẫu ở trạng thái SKIPPED, công việc gửi thông báo đã được đánh dấu hoàn thành để không gửi thư thật.

## Kết quả kiểm tra và phần tiếp theo

- 27 test migration/demo đạt; kiểm tra cả lượng chuyển vượt duyệt, nhận sai người, sức chứa vượt ô, giữ hàng quá lượng, liên kết sai dòng và hóa đơn tính quá lượng được nhận.
- Đã đọc lại MongoDB để đối chiếu toàn bộ collection, chuỗi số dư và liên kết. Chạy lại seed chỉ xác minh, không tạo dữ liệu lần hai.
- Báo cáo thực tế: [demo_verified_20261103.json](../../../../../../outputs/db_rebuild/demo_verified_20261103.json).
- Cần chuyển các service/API sang collection và dòng nhúng mới, kiểm thử quyền/kho/trạng thái trong các giao dịch, rồi mới chuyển FE/API sang DB này.
- D07/D08 về chứng từ nguồn tiếp tục giữ cấu trúc cũ trong lúc chờ người phụ trách nghiệp vụ quyết định.
- Full test của repo chưa đạt do lỗi có sẵn: thiếu module replenishment và fixture cũ chưa có loại Internal Transfer Requirement. Chi tiết tại [tests_20261103.txt](../../../../../../outputs/db_rebuild/tests_20261103.txt).

## Lệnh cho người phát triển

Chạy trong `E:/Doan/CODE/BE/building-material-management`:

```powershell
npm run db:demo
npm run db:demo -- --verify --target wmsd_demo_v2
npm run db:demo -- --apply --target wmsd_demo_v2
npm run test:db-rebuild
```

Lệnh đầu chỉ xem trước. `--apply` chỉ tạo DB riêng nếu chưa tồn tại; nếu đã có bộ mẫu đúng phiên bản thì kiểm tra lại. Công cụ từ chối ghi đè DB khác hoặc DB mẫu đã bị sửa. Model và hướng dẫn kỹ thuật ở [src/models/rebuild](../09_phat_trien/DB_REBUILD.md).
