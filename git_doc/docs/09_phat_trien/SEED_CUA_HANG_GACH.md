# Dữ liệu mô phỏng cửa hàng gạch ốp lát

Bản seed BE hiện hành: `wmsd-tile-shop-20261109-v10`, 57 collection sau gộp `goods_receipts`, 661 bản ghi mẫu. Người dùng sẽ tự chạy seed trên DB test sau khi đợt BE hoàn tất. Các tên, giá và số đo là dữ liệu tổng hợp; bằng chứng là PNG test và SMTP không gửi thật. [Sản phẩm, lô và thùng](../03_thiet_ke/DB_Rebuild_Review/39_San_pham_va_lo_dang_chot.md).

## Mở trong Compass

```text
mongodb://localhost:27017/wmsd_api_test_6aedf823b3e33975e06c07d1
```

Sau reset test, database trên phải chưa tồn tại cho đến khi người dùng tự chạy `npm run seed` từ BE. Chỉ dùng URI loopback; không chạy seed demo hoặc seed ứng dụng trên Atlas. Các báo cáo v1–v8 giữ làm lịch sử.

## Quy mô

| Nhóm | Dữ liệu |
|---|---|
| Kho | 3 kho: gạch trung tâm 3.000 m², gạch số 2 1.000 m², gạch dự phòng 900 m² (chưa có hàng trong bộ mẫu; đổi nhãn kho mẫu, không khẳng định khảo sát thực tế đổi). Chiều dài/rộng/cao được mô phỏng phù hợp diện tích khảo sát |
| Nhân sự | 15 tài khoản: Owner, Admin, 7 Sales, 3 Warehouse, 3 Accountant. Có role mẫu Trưởng ca kho |
| Category | 5 nhóm: lát nền (9), ốp tường (3), trang trí (2), sân vườn (2), giả gỗ (2); mỗi product một categoryId |
| Sản phẩm | 18 mã gạch hãng giả lập: ốp/lát/sân/giả gỗ; bỏ thiết bị vệ sinh theo yêu cầu |
| Lô | 39 lô theo sản phẩm + mã hãng, số viên/thùng cố định và một lô chờ xác minh |
| Đối tác | 20 khách, 3 NCC; không có danh mục đội xe, biển số ghi trên bàn giao |
| Tồn | 51 nhóm số dư theo ô/lô/chất lượng/chủ hàng, 32 giao dịch tồn và 70 dòng biến động |
| Tổng | 57 collection nghiệp vụ, 661 bản ghi cấp bảng. 81 hồ sơ nghiệp vụ tính cả bàn giao nhúng, 115 dòng nhúng. Không có collection marker kỹ thuật |

## Nên xem

- `products`: lọc `{ "sku": "AP6601" }` để xem gạch lát nền vân đá trắng 60×60, đơn vị gốc Viên.
- `product_batches`: lọc theo productId đó để thấy manufacturerLot, piecesPerCarton và cartonLengthMm/cartonWidthMm/cartonHeightMm; không có calibre/tone.
- `goods_arrivals`, `goods_receipts` với `documentKind: "PURCHASE"`: mở `items` để xem productId, lotId, enteredUnit/enteredQty, baseUnitsPerUnit, qtyBase và packagingSnapshot. Dòng 10 thùng × 4 viên cho qtyBase 40. Các phần kiểm nhận/hàng mở có thể ghi theo viên thực tế.
- `opening_stocks`: các dòng thùng nguyên theo lô có locationId, số thùng và quy cách. Nguồn tồn này có người kho lập, Owner xác minh, transaction và movement tương ứng.
- `inventory_balances.packagingPortions[]`: SEALED ghi số thùng nguyên và quy cách; OPEN/LOOSE ghi hàng mở/lẻ và thể tích đo. Đây là bố trí cùng lượng tồn, không cộng thêm lần nữa; không có bảng storage_stacks/storage_stack_items.
- `warehouse_transfer_requests`, `transfer_dispatches`, `goods_receipts` với `documentKind: "TRANSFER"`: TR có nhiều phiếu xuất, một phiếu xuất có nhiều lần nhận. Liên kết bằng ID dòng và header nguồn.
- `goods_receipts` với `documentKind: "OTHER"`: nhập thủ công, phê duyệt và các tình huống sửa sai (`NK-202610-001` đã ghi sổ kèm chứng cứ, `NK-202610-002-OLD` đã bỏ ghi `REVERSED`, `NK-202610-002` thay thế liên kết `originalReceiptId`, `NK-202610-003` nháp có chứng cứ).
- `transfer_orders`: lọc `{ "header.taskKind": "RELOCATE" }` cho BF03 hoặc PICK/PUTAWAY cho BF04.
- `sales_invoices`: hóa đơn `HD-202610-001` có hai phiếu xuất khác ngày, 12 viên khách nhận, giá mô phỏng 50.000 đồng/viên, tổng 600.000 đồng. Mở goodsIssueId để đối chiếu phiếu xuất.
- `stocktake_counts`: lọc `{ "attemptNo": 2 }` để xem đếm lại và liên kết lần đếm cũ.

## Nguồn seed và cách thay

- `src/seeds/rebuild/data.js` dựng đồ thị dữ liệu và gọi các kịch bản.
- `tile-shop.js` khai báo danh mục mô phỏng, nhân sự, lô, ô, tồn đầu kỳ theo thùng và quy cách số dư cuối kỳ.
- `workflow-data.js`, `scenarios.js`, `support-data.js` giữ các kịch bản liên luồng và lịch sử.
- `validate.js` kiểm schema/ref, chuỗi tồn, lượng giữ, quyền duyệt, TR/nhận, sức chứa, hóa đơn và dữ liệu thùng.
- `database.js` kiểm đúng 59 collection, fingerprint và ghi seed; `run.js` là CLI.

Một thùng chứa đúng một sản phẩm và một lô. Các thùng chung dòng phải cùng quy cách. Quy cách của seed nằm trong mã seed để tạo snapshot trên dòng, không phải danh mục UOM mới. Kích thước sản phẩm và kích thước ngoài thùng có ý nghĩa riêng.

```powershell
npm run seed                    # Tự động seed toàn bộ 57 collection khi DB trống
npm run seed:goods-receipts     # Seed riêng 5 loại GoodsReceipt (PURCHASE, CUSTOMER_RETURN, FAILED_DELIVERY, TRANSFER, OTHER)
npm run db:demo
npm run test:db-rebuild
npm run db:local:seed
npm run db:local:verify
npm run docs:check
```

Lệnh xem trước không cần MongoDB. Lệnh seed tạo target mới hoặc xác minh đúng target đã seed cùng version. Khi bộ đã seed bị sửa, công cụ từ chối ghi đè. Khi thay nội dung seed, tăng version và chọn một target local mới hoặc chuẩn bị kế hoạch chuyển rõ ràng. Không drop DB để làm test pass.

Đã bổ sung test category và kiểm liên kết. [Seed local v8](../../outputs/categories_v8_local_seed_2026-11-06.json); [Atlas v8](../../outputs/categories_v8_atlas_deployed_2026-11-06.json); [hướng dẫn category](CATEGORIES_V8.md). Các test này kiểm dữ liệu/model, không phải chứng nhận API/FE đã chuyển hoàn tất.
