# Category và dữ liệu v8 — 06/11/2026

Người dùng duyệt 5 nhóm sau khi tham khảo [Gạch Tốt](https://gachtot.vn/): Gạch lát nền, Gạch ốp tường, Gạch trang trí, Gạch sân vườn, Gạch giả gỗ. Mỗi product có đúng một categoryId. [Trường, quy tắc, phân loại từng SKU và thư mục model](../03_thiet_ke/DB_Rebuild_Review/40_Category_va_don_model.md).

## Bản hiện hành

- Local: `mongodb://localhost:27017/wmsd_demo_tile_shop_v8`.
- Atlas: `wmsd_database` trên kết nối đã cấp cho nhóm.
- 59 collection / 638 bản ghi, gồm 5 categories và 18 products có categoryId. Các số lượng tồn, giá, chứng từ và quy cách giữ cùng kịch bản mẫu trước.
- Tại lần kiểm tra này, local không còn v7 và Atlas wmsd_database không có collection; không xác định nguyên nhân. Công cụ nâng v7 dừng trước khi ghi. Đã tạo lại fixture v8 trên local rồi triển khai vào đích Atlas rỗng. ID fixture v8 có thể khác bản v7 lịch sử. Không có dữ liệu đang tồn tại bị ghi đè.

[Seed/đọc lại local](../../outputs/categories_v8_local_seed_2026-11-06.json) · [Triển khai Atlas](../../outputs/categories_v8_atlas_deployed_2026-11-06.json) · [Xác minh Atlas](../../outputs/categories_v8_atlas_verified_2026-11-06.json).

Trong Compass chọn đúng kết nối rồi Refresh Databases. Với product, mở categoryId để đối chiếu `_id` trong categories. `code` category là mã dễ đọc; không thay thế ObjectId liên kết.

## Code

- `src/models/category.model.js`: schema Category; mỗi schema vẫn một file.
- `src/models/product.model.js`: categoryId bắt buộc và index tìm theo nhóm.
- `src/models/reviewed-registry.js`: đăng ký 59 model hiện hành. Profile migration lịch sử giữ nguyên hợp đồng cũ.
- `src/seeds/rebuild/categories.js`: 5 nhóm và mapping fixture theo hãng/SKU; SKU không biết phải chỉ định rõ, không đoán theo tên.
- `scripts/add-product-categories.mjs`: công cụ nâng đúng bản v7 còn nguyên sang v8. Đích có chỉnh sửa khác sẽ bị từ chối.

## Lệnh cho bộ mẫu mới

```powershell
npm run db:demo
npm run db:local:seed
npm run db:local:verify
npm run test:db-rebuild
npm run docs:check
```

Đưa DB local mới vào Atlas rỗng vẫn dùng `npm run db:deploy -- --apply --source wmsd_demo_tile_shop_v8 --target wmsd_database`, nhận URI từ biến môi trường bí mật MONGODB_TARGET_URI. Không lưu URI có mật khẩu vào Git. Công cụ không ghi đè Atlas đang có dữ liệu khác.

## Nếu máy khác vẫn còn đúng v7

```powershell
# Xem trước và tạo local v8 từ v7, giữ ID và dữ liệu khác
npm run db:categories -- --local
npm run db:categories -- --local --apply
# Chỉ áp dụng nếu Atlas đang khớp chính xác baseline v7 đó
npm run db:categories -- --atlas
npm run db:categories -- --atlas --apply
npm run db:categories -- --atlas --verify
```

Chỉ thêm 5 category và trường categoryId, không sửa ngày/số lượng/giá/chứng từ cũ. Mã thao tác kiểm nguồn và đích, transaction remote, hash đọc lại và index. Không chạy công cụ nâng trên DB v8 tạo mới vì đó là trường hợp triển khai mới, không phải baseline v7.

## Dọn thư mục

Giữ embedded (schema con), legacy (API cũ còn dùng) và phần rebuild đang dùng (registry/ref/helper/seed/migration). Đã xóa ba builder không còn nơi gọi: reviewed-events.js, reviewed-support.js, reviewed-workflows.js. Không xóa các model đang phục vụ API. [Báo cáo rà import](../../outputs/model_folder_usage_2026-11-06.json).

API danh mục category và các API legacy chưa được port trong lượt này; kết nối ứng dụng chưa đổi. Cần kiểm tồn tại/trạng thái category và quyền ở service khi bổ sung API. Các quyết định D07/D08 vẫn chờ như trước.

## Kiểm chứng

57/57 test DB/model/category/deploy đạt: [kết quả](../../outputs/category_v8_tests_2026-11-06.txt). SQL-style diagram có 11 tab/493 quan hệ; đã kiểm nguồn/đích các cạnh và xem ảnh xuất tab Warehouse & catalogue. docs:check kiểm đủ 59 collection và các liên kết chính. Đây không phải chứng nhận các API legacy đã port.
