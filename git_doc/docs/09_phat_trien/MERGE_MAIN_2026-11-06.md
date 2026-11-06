# Merge main vào HieuDT — 06/11/2026

## Kết quả và phạm vi

Giải quyết merge main tại baf5fb4 vào HieuDT tại 5f4a296. Giữ API mua/nhập, sản phẩm, lô, NCC, phân quyền và lỗi xác thực của main; giữ nguyên 59 schema đã duyệt, categoryId và sản phẩm/lô/thùng v8 của HieuDT. Đây là tích hợp code, chưa chuyển các API legacy sang DB mới và không ghi dữ liệu vào localhost/Atlas.

## Model và cách chạy

- src/models/index.js vẫn chỉ đăng ký bộ schema đã duyệt qua registerReviewedModels(connection). Mỗi collection hiện hành vẫn một file model; không thêm bảng mới vào bộ 59 collection.
- Các API mua/nhập và tiện ích main tiếp tục import src/models/legacy/index.js. PurchaseEvent, PurchaseSourceClaim, ReceiptPlacement, PurchaseEvidenceUpload nằm trong legacy/purchase.model.js; ReplenishmentSubmission cũng được export ở registry legacy. Runtime legacy có 44 collection; đây là số riêng, không cộng vào 59.
- legacy/product.model.js giữ các field/index phục vụ API main (brand/category dạng text, kích thước, version, xác minh lô/quy đổi); legacy/party.model.js giữ thông tin NCC và trạng thái hợp tác. Các field đó không thay schema Product/Category/ProductBatch hiện hành.
- Auth giữ mã lỗi và cách reload quyền theo role hiện tại của main; User lấy từ registry legacy. Không đổi response đăng nhập để né conflict.
- package.json giữ cả lệnh DB/local/docs và seed/migration/maintenance/benchmark từ main. Cài thư viện theo package-lock.json bằng npm ci hoặc npm install.

## Tách fixture và profile lịch sử

Main thay chuỗi runtime ARRIVAL bằng PO_INSPECTION. Không đưa thay đổi đó ngược vào thiết kế đã duyệt H03/H04/H05. Bộ mẫu reviewed và bài kiểm thử migration dùng src/seeds/rebuild/historical-source.js, đọc fixtures/legacy-v8.ejson: snapshot dữ liệu tổng hợp tại commit 5f4a296, không phải dump DB thật. EJSON giữ ObjectId/Decimal128/Date; mỗi lần đọc trả bản độc lập. Seed runtime vẫn dùng src/seeds/data/demo.data.js của main với PO_INSPECTION.

rebuild/historical/ giữ đúng schema chứng từ/dòng/enum của migration trước merge trên connection riêng không kết nối DB. Chỉ builder migration đọc chúng; reviewed-registry vẫn nạp trực tiếp 59 schema hiện hành, còn runtime vẫn dùng schema main. Không lặng lẽ bỏ collection chưa biết trong transformSnapshot: nguồn runtime mới chưa có mapping sẽ bị chặn như trước. Muốn chuyển DB runtime mới cần task mapping và xác minh riêng.

## Tài liệu nguồn

[Contract nhận mua main](../../../docs/po-receiving-proposal/BACKEND_V3.md) và [hướng dẫn kiểm thử main](../../../docs/po-receiving-proposal/VERIFICATION_V3.md) mô tả runtime legacy được giữ. [Context main nguyên bản](../99_lich_su/context_main_PO_2026-11-06.md) chỉ là bằng chứng lịch sử; quyết định DB hiện hành theo [PROJECT_GUIDE](../../PROJECT_GUIDE.md). D07/D08 vẫn chờ nghiệp vụ. Không chạy seed/migration/cleanup trên DB nhóm trong lượt merge.

## Kiểm chứng

- npm test: 161 test, 135 đạt, 0 lỗi, 26 bỏ qua do thiếu cấu hình môi trường tích hợp.
- npm run test:db-rebuild: 57/57 đạt.
- npm run docs:check: đạt; ba file luật giống nhau, đủ 59 collection và 659 liên kết được kiểm.
- Ba test mới kiểm nạp route API, tách model runtime/reviewed/historical, fixture lịch sử độc lập.
- Nạp src/app.js thành công; chạy HTTP localhost trên cổng tạm: /api/purchase-orders, /api/location-movements và /api/warehouse-transfers đều trả 401 khi chưa đăng nhập. Đây chỉ là kiểm tra routing/auth gate, chưa chứng minh giao dịch nhập/xuất thành công.
- Đối chiếu toàn bộ file *.model.js ở gốc models của main với bản trong legacy sau khi sửa đường dẫn import: giữ nguyên nội dung model main. origin/main đã fetch vẫn là baf5fb4. MongoDB localhost đang là standalone, không có replica set: các kiểm thử transaction cần database riêng và replica set, chưa được chạy bằng dữ liệu DB nhóm.
