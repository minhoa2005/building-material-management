# MongoDB local hiện hành

Ngày 06/11/2026: local v8 có 59 collection / 638 bản ghi, gồm 18 product gạch và 5 categories. Trong Compass dùng:

```text
mongodb://localhost:27017/wmsd_demo_tile_shop_v8
```

Refresh Databases rồi chọn v8. Product giữ categoryId trỏ tới categories._id. Bản trên Atlas là wmsd_database; phải dùng kết nối Atlas riêng để xem.

```powershell
npm run db:demo
npm run db:local:seed
npm run db:local:verify
npm run test:db-rebuild
```

Lúc kiểm tra lần này, local v7 và Atlas wmsd_database đều trống; đã tạo lại bộ mẫu v8, không ghi đè dữ liệu. Báo cáo cũ là lịch sử, không khẳng định DB cũ còn trên máy. Seed chỉ ghi DB demo local riêng hoặc kiểm target đã có; không drop DB để chạy lại. API legacy và kết nối ứng dụng chưa chuyển.

[Bộ mẫu](SEED_CUA_HANG_GACH.md) · [Category và triển khai v8](CATEGORIES_V8.md) · [Báo cáo local](../../outputs/categories_v8_local_seed_2026-11-06.json).
