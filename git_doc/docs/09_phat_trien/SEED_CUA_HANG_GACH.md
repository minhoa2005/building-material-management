# Dữ liệu mô phỏng cửa hàng gạch ốp lát

Ngày 05/11/2026. Seed version `wmsd-tile-shop-20261105-v1`. Tên người, hãng, giá và kích thước chi tiết là dữ liệu tổng hợp để chạy thử. Số điện thoại bắt đầu bằng 000 và email thuộc `.example` để tránh sử dụng liên hệ thật. Ảnh bằng chứng là PNG test, SMTP bị bỏ qua và sự kiện mẫu đã hoàn tất.

## Mở trong Compass

```text
mongodb://localhost:27017/wmsd_demo_tile_shop
```

Chọn database `wmsd_demo_tile_shop`. Bộ trước là `wmsd_demo_v2`. API hiện có vẫn cần chuyển sang registry mới trước khi dùng dữ liệu này.

## Quy mô

| Nhóm | Dữ liệu |
|---|---|
| Kho | 3 kho: gạch trung tâm 3.000 m², gạch số 2 1.000 m², thiết bị vệ sinh 900 m². Chiều dài/rộng/cao được mô phỏng phù hợp diện tích khảo sát |
| Nhân sự | 15 tài khoản: Owner, Admin, 7 Sales, 3 Warehouse, 3 Accountant. Có role mẫu Trưởng ca kho |
| Sản phẩm | 20 mã hãng giả lập, gồm 18 gạch ốp/lát/sân/giả gỗ và 2 thiết bị vệ sinh |
| Lô | 43 lô, có nhiều lô khác tone của cùng sản phẩm và một lô chờ xác minh |
| Đối tác | 20 khách, 4 NCC, 2 đội xe nội bộ |
| Tồn | 55 nhóm số dư theo ô/lô/chất lượng/chủ hàng, 33 giao dịch tồn và 74 dòng biến động |
| Tổng | 74 collection nghiệp vụ, 851 bản ghi. 82 hồ sơ nghiệp vụ tính cả bàn giao nhúng, 119 dòng nhúng. Không có collection marker kỹ thuật |

## Nên xem

- `products`: lọc `{ "sku": "AP6601" }` để xem gạch lát nền vân đá trắng 60×60, đơn vị gốc Viên.
- `product_batches`: lọc theo productId đó để thấy từng mã lô/tone/calibre.
- `goods_arrivals`, `purchase_receipts`: mở `items` để xem productId, lotId, enteredUnit/enteredQty, baseUnitsPerUnit, qtyBase và packagingSnapshot. Dòng 10 thùng × 4 viên cho qtyBase 40. Các phần kiểm nhận/hàng mở có thể ghi theo viên thực tế.
- `opening_stocks`: các dòng thùng nguyên theo lô có locationId, số thùng và quy cách. Nguồn tồn này có người kho lập, Owner xác minh, transaction và movement tương ứng.
- `storage_stack_items`: SEALED ghi số thùng nguyên và hệ số. LOOSE ghi lượng viên lẻ. Truy qua balanceId để biết lô, chủ và vị trí. Đây là bố trí cùng lượng tồn, không cộng thêm lần nữa.
- `warehouse_transfer_requests`, `transfer_dispatches`, `transfer_receipts`: TR có nhiều phiếu xuất, một phiếu xuất có nhiều lần nhận. Liên kết bằng ID dòng và header nguồn.
- `transfer_orders`: lọc `{ "header.taskKind": "RELOCATE" }` cho BF03 hoặc PICK/PUTAWAY cho BF04.
- `sales_invoices`: hóa đơn `HD-202610-001` có hai phiếu xuất khác ngày, 12 viên khách nhận, giá mô phỏng 50.000 đồng/viên, tổng 600.000 đồng. Mở goodsIssueId để đối chiếu phiếu xuất.
- `stocktake_counts`: lọc `{ "attemptNo": 2 }` để xem đếm lại và liên kết lần đếm cũ.

## Nguồn seed và cách thay

- `src/seeds/rebuild/data.js` dựng đồ thị dữ liệu và gọi các kịch bản.
- `tile-shop.js` khai báo danh mục mô phỏng, nhân sự, lô, ô, tồn đầu kỳ theo thùng và bố trí chồng cuối kỳ.
- `workflow-data.js`, `scenarios.js`, `support-data.js` giữ các kịch bản liên luồng và lịch sử.
- `validate.js` kiểm schema/ref, chuỗi tồn, lượng giữ, quyền duyệt, TR/nhận, sức chứa, hóa đơn và dữ liệu thùng.
- `database.js` kiểm đúng 74 collection, fingerprint và ghi seed; `run.js` là CLI.

Một thùng chứa đúng một sản phẩm và một lô. Các thùng chung dòng phải cùng quy cách. Quy cách của seed nằm trong mã seed để tạo snapshot trên dòng, không phải danh mục UOM mới. Kích thước sản phẩm và kích thước ngoài thùng có ý nghĩa riêng.

```powershell
npm run db:demo
npm run test:db-rebuild
npm run db:local:seed
npm run db:local:verify
npm run docs:check
```

Lệnh xem trước không cần MongoDB. Lệnh seed tạo target mới hoặc xác minh đúng target đã seed cùng version. Khi bộ đã seed bị sửa, công cụ từ chối ghi đè. Khi thay nội dung seed, tăng version và chọn một target local mới hoặc chuẩn bị kế hoạch chuyển rõ ràng. Không drop DB để làm test pass.

Đã chạy 31 test migration/demo/local-config và ghi/đọc lại bộ mới trên `localhost:27017`. Các test này kiểm dữ liệu/model, không phải chứng nhận API/FE đã chuyển hoàn tất.
