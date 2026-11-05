# MongoDB local cho thiết kế DB mới

Ngày thiết lập: 03/11/2026, cập nhật 05/11/2026. Bộ seed cửa hàng dùng MongoDB local đã cài trên máy qua `localhost:27017`; không lấy đích ghi từ URI cloud trong `.env`.

## Kết nối trong MongoDB Compass

Chọn **Add new connection**, nhập:

```text
mongodb://localhost:27017/wmsd_demo_tile_shop
```

Đặt tên kết nối **WMSD Local** rồi Connect. Mở database **wmsd_demo_tile_shop**. Bộ này có 74 collection nghiệp vụ và 851 bản ghi. Các collection chính để xem là `products`, `warehouse_locations`, `inventory_balances`, `transfer_orders`, `warehouse_transfer_requests`, `sales_orders`, `sales_invoices`.

WMSD dùng chính dịch vụ MongoDB local của máy ở cổng **27017**. Lệnh `db:local:start` chỉ kiểm tra kết nối và tạo `.env.local` nếu chưa có; không tự dừng hay cấu hình lại dịch vụ dùng chung. Seed mẫu hỗ trợ server standalone. Các API ghi tồn sau này vẫn cần MongoDB replica set hoặc Atlas để thực hiện transaction nhiều collection.

## Lệnh sử dụng

Chạy tại thư mục gốc backend sau khi clone repo:

```powershell
# Kiểm tra MongoDB local và tạo .env.local nếu chưa có
npm run db:local:start

# Xem trạng thái và tên database
npm run db:local:status

# Tạo bộ mẫu nếu chưa có; nếu đã có thì xác minh, không ghi trùng
npm run db:local:seed

# Đối chiếu lại toàn bộ bộ mẫu
npm run db:local:verify

# Kiểm model, liên kết và nghiệp vụ trên dữ liệu mẫu (không cần kết nối)
npm run test:db-rebuild

# Kiểm model/transaction thực; chỉ chạy được khi MongoDB local là replica set
npm run test:db:local
```

Nếu đã sửa dữ liệu mẫu bằng tay, lệnh seed/verify sẽ kiểm lại đúng 74 collection và **không ghi đè**. Không xóa database mẫu để làm test pass.

## File trên máy

| File/thư mục | Nội dung |
|---|---|
| `.env.local` | File tham chiếu tạo lần start đầu. Máy đã tạo trước có thể còn trỏ bộ v2; lệnh local dùng config, khi chuyển API phải đối chiếu URI hiện hành |
| `.local/demo-fixtures` | Ảnh PNG bằng chứng mẫu |
| `.local/latest-report.json` | Kết quả seed/xác minh local gần nhất |

`.env.local` và `.local/` đã bị loại khỏi Git. Giữ `.env` hiện có để đối chiếu cấu hình nhóm; các lệnh local không dùng nó làm đích kết nối.

## Backend đã kiểm đến đâu

- Model mới đã ghi/đọc lại thành công dữ liệu mẫu trên `localhost:27017`; có 74 collection nghiệp vụ và 851 bản ghi.
- Kiểm schema, liên kết, chuỗi tồn, lượng giữ, quyền duyệt, BF03/BF04, sức chứa và hóa đơn chạy cục bộ trong `npm run test:db-rebuild`.
- Test transaction thực vẫn yêu cầu replica set; MongoDB local hiện kiểm tra ngày 05/11 là standalone nên chưa chạy test đó.

**Các service/API nghiệp vụ chưa chuyển vẫn dùng `src/models/legacy/index.js`.** Bộ 74 model đã duyệt là entry point chính tại `src/models/index.js`, nhưng việc tạo `.env.local` không tự chuyển `npm run dev` sang schema mới. Giai đoạn chuyển API tiếp theo phải dùng local này, kiểm quyền/kho/trạng thái cùng các giao dịch trước khi đưa lên DB chung.

Lệnh `db:demo --apply` nay từ chối remote theo mặc định. Chỉ khi có chủ đích triển khai mới mới dùng `--allow-remote`; không dùng cờ đó trong giai đoạn local hiện tại. Đợt thiết lập local này không ghi hoặc thay đổi DB cloud.

## Bộ seed hiện tại

[Danh mục, kịch bản và cách xem dữ liệu cửa hàng](SEED_CUA_HANG_GACH.md). `wmsd_demo_v2` là bộ mẫu trước. Các lệnh local hiện chọn `wmsd_demo_tile_shop` theo `src/config/local-mongo.js`.
