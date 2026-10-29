# Test BE FE-06 Iteration 1 bằng Thunder Client

Phạm vi: UC-47 tạo SO sao chép, UC-46 xem chi tiết SO, UC-49 danh sách OD,
UC-50 chi tiết OD. Các chức năng tạo WIR/OD, picking, PGI và xác nhận giao hàng
không thuộc Iter 1; dùng lịch sử seed để kiểm tra các màn hình đọc.

## 1. Khởi động dữ liệu demo riêng

Chạy tại thư mục BE:

```powershell
npm run test:fe06:server
```

Server sử dụng `http://127.0.0.1:3016/api`, database **wmsd_fe06_thunder** trên
MongoDB replica set local `127.0.0.1:27136` (replica set `uc36test`). Không sử dụng
MONGODB_URI trong .env làm database đích. Chỉ seed khi database trống; chạy lại
không xoá các SO bạn đã thử. Cloudinary và JWT vẫn dùng cấu hình .env của BE.
Nếu dùng replica set local khác, đặt FE06_TEST_MONGO_URI trước khi chạy.

Nếu MongoDB test ở máy này đang tắt, mở PowerShell và chạy trong một terminal riêng:

```powershell
& 'C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe' --dbpath 'E:\Doan\outputs\uc35-36-verification\mongo-data' --port 27136 --bind_ip 127.0.0.1 --replSet uc36test
```

Đây là replica set test đã được khởi tạo trên máy này. Không chạy thêm mongod
nếu cổng 27136 đã có tiến trình. Với máy khác cần chuẩn bị replica set riêng.

## 2. Import và thiết lập

- Import `FE06.postman_collection.json` vào tab Collections của Thunder Client.
- Import `FE06.postman_environment.json`, chọn environment **FE06 local isolated demo**.
- Bộ file dùng Postman 2.1, được [Thunder Client hỗ trợ import](https://docs.thunderclient.com/features/import).
- Nếu phiên bản extension không hỗ trợ import, tạo request thủ công theo bảng API
  dưới đây; JSON mẫu ở `create-sales-order.json`, IDs ở `seed-ids.json`.
- Không cần chạy script Postman; tất cả biến quan trọng được copy thủ công.

Tài khoản **chỉ dành cho dữ liệu demo**:

| Role | Username | Password |
| --- | --- | --- |
| Sales | sales@ceratile.vn | Sales@123 |
| Store Owner | owner@ceratile.vn | Owner@123 |
| Accountant | accountant@ceratile.vn | KeToan@123 |
| Warehouse | warehouse@ceratile.vn | Kho@12345678 |
| Administrator | admin@ceratile.vn | Admin@123 |

## 3. Thứ tự test tạo đơn

1. Chạy **Login Sales**. Copy `data.accessToken` vào biến `accessToken`.
2. Chạy **01 Upload source evidence**: Body → Form, trường `file` kiểu File,
   chọn `source-order.png` trong thư mục này (ảnh kỹ thuật 1px để test), hoặc ảnh
   đơn mẫu của bạn. Không tự đặt Content-Type; Thunder tạo multipart boundary.
   Copy `data.receipt` vào `evidenceReceipt`. Receipt có hạn 24 giờ, thuộc Sales upload.
3. Chạy **02 Create copied SO** → 201. Copy `data.id` vào `createdSalesOrderId`.
   Mẫu có 2 thùng, hệ số seed 4 viên/thùng, kết quả 8 viên. Các lượng phải là string.
4. Chạy **03 Retry identical creation** → 200, cùng ID, `replayed=true`.
   Không thay receipt hoặc nội dung body giữa hai lần thử retry.
5. Chạy **06 View newly created SO** → 200, trạng thái OPEN, đúng source/lines,
   chưa có WIR/OD/GI/POD. Copy `data.evidence[0].id` vào `evidenceId`.
6. Chạy **07 Get private evidence URL**. Mở `data.url` trong 60 giây để xem ảnh.
7. Lần muốn tạo một đơn mới, thay `runId` (ví dụ manual-002). Điều này đổi cả
   source referenceNo và idempotencyKey. Không dùng cùng mã đơn nguồn cho đơn mới.

Lưu SO không thay tồn kho, reservation hoặc phát sinh phiếu xuất. Sự kiện
SALES_ORDER_SAVED được lưu cùng transaction; phần xử lý thông báo/đánh giá thiếu
hàng là dependency của UC-103/notification, chưa có consumer ở codebase.
`shortageEvaluation: PENDING` không phải là kết luận đủ/thiếu hàng.

## 4. API và kết quả mong đợi

Base URL mặc định khi chạy BE thường: `http://localhost:3000/api` (hoặc PORT .env).
Base URL gói demo riêng: `http://127.0.0.1:3016/api`.

| Method | Path | Nội dung / quyền |
| --- | --- | --- |
| POST | /auth/login | username + password; lấy accessToken |
| POST | /sales-orders/source-evidence | Sales; multipart file PNG/JPEG/WebP, tối đa 5 MB |
| POST | /sales-orders | Sales; tạo source + SO + bằng chứng + audit/outbox nguyên tử |
| GET | /sales-orders/:id | Owner/Accountant, Sales tạo đơn, Warehouse thuộc phạm vi thực hiện |
| GET | /sales-orders/:id/evidence/:evidenceId | Owner/Accountant, Sales tạo đơn; trả link riêng tư có hạn |
| GET | /outbound-deliveries | List có phân trang, lọc quyền trước khi đếm total |
| GET | /outbound-deliveries/:id | OD + WIR/SO + reservation/picking/GI/POD/FD/commitment |

Header cho API nghiệp vụ: `Authorization: Bearer {{accessToken}}`.
JSON body: `Content-Type: application/json` (trừ upload).
List hỗ trợ `q` (mã OD, không phân biệt hoa thường), `warehouseId`, `salesOrderId`,
`issueRequestId`, `status`, `from`, `to` (ISO date-time theo createdAt), `page`, `limit`.
Mặc định page=1, limit=20; tối đa limit=100. Không truyền trường thừa.

## 5. Test lịch sử và quyền

| Request / tình huống | Mong đợi |
| --- | --- |
| Completed seeded SO | Xuất12, giao12; có PAY-CFM; giữ COMPLETED |
| Failed delivery seeded SO | OD gốc: xuất10, FD về4, ròng6; cam kết giao lại4 |
| Cancelled seeded SO | Giữ lịch sử huỷ, không sinh giao nhận giả |
| OD filtered list/detail | Liên kết đúng WIR/SO, chỉ dữ liệu thuộc quyền |
| Same source, key mới | 409; không tạo SO thứ hai |
| Same key, body đổi | 409 |
| quantity=0 / quantity dạng number / thiếu evidence | 400 |
| Sai ObjectId / limit=101 / khoảng ngày ngược | 400 |
| SO ID dùng cho OD detail / ID không tồn tại | 404 |
| Không token / token hết hạn | 401 |
| Admin xem SO/OD; Owner/Accountant/Warehouse tạo SO | 403 |
| Sales khác người tạo đọc đơn | 404 |
| Warehouse không thuộc kho OD | 404; list không chứa OD đó |
| Warehouse xem source evidence | 404 |
| Storage không hoạt động khi upload | 502; không có SO được tạo |

Login role khác rồi thay accessToken để test quyền. Seed chỉ có một Sales;
test Sales khác và concurrent retry đã có trong integration test tự động.
Các IDs trong environment chỉ đúng cho bộ seed này. Khi dùng database có sẵn
khác, lấy IDs thật từ dữ liệu đó; đừng coi 404 của ID seed là lỗi API.

## 6. Kiểm thử tự động

```powershell
$env:MONGODB_TEST_URI='mongodb://127.0.0.1:27136/?replicaSet=uc36test'
node --test test/sales-validation.test.js test/sales-create.integration.test.js test/sales-iteration1.integration.test.js
```

Integration tests tạo database ngẫu nhiên và chỉ xoá đúng database ấy. Upload
được giả lập trong HTTP suite để kiểm lỗi/retry ổn định. Smoke test Cloudinary thật:

```powershell
$env:LIVE_SALES_EVIDENCE_TEST='true'
node --import dotenv/config --test test/sales-evidence.live.test.js
```

Smoke test upload ảnh tổng hợp 1px, thử tải có chữ ký/không chữ ký và xoá chính ảnh
vừa tạo. Ảnh bạn upload thủ công bằng Thunder được giữ lại; ảnh upload nhưng không
tạo SO chưa có tác vụ dọn tự động. Gói test không chứa token hoặc Cloudinary secret.
