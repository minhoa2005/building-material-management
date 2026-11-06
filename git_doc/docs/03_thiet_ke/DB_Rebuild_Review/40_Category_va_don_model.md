# Category và dọn model — 06/11/2026

## Quyết định đã duyệt

Người dùng yêu cầu thêm bảng category, tham khảo [Gạch Tốt](https://gachtot.vn/), rồi duyệt: **5 nhóm, mỗi product 1 category**. Website dùng menu theo loại gạch, hãng, kích thước và công dụng. WMSD áp dụng 5 nhóm phù hợp bộ gạch hiện có; hãng, kích thước và màu vẫn là thuộc tính riêng của product. Không nhập danh mục hãng/kích thước lặp vào categories.

## Bảng categories

Một bản ghi là một nhóm phân loại sản phẩm. File: `src/models/category.model.js`, model `Category`, collection `categories`.

| Trường | Kiểu / quy tắc | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId | Khóa liên kết nội bộ |
| `code` | String, bắt buộc, tối đa 60, unique, immutable | Mã category ổn định |
| `name` | String, bắt buộc, tối đa 160 | Tên nhóm hiển thị |
| `description` | String tùy chọn, tối đa 1000 | Giải thích nhóm |
| `isActive` | Boolean, mặc định true | Có được chọn cho phân loại mới hay không |
| `createdAt`, `updatedAt` | Date UTC, timestamps | Thời gian tạo/sửa |

Không thêm version, parentId hay bảng nối. `products.categoryId` là ObjectId bắt buộc ref `Category`, có index tìm theo nhóm. Quan hệ **Category 1–n Product**; một sản phẩm đúng một nhóm. Không xóa category đang được tham chiếu; khi port API danh mục phải kiểm tồn tại/trạng thái và kiểm quyền theo nghiệp vụ danh mục. Schema/ref không tự kiểm bản ghi nguồn hay quyền. Không triển khai API category trong lượt sửa DB này.

## Phân loại dữ liệu mẫu

| Mã | Tên | Số product | SKU mẫu |
|---|---|---|---|
| GACH-LAT-NEN | Gạch lát nền | 9 | AP6601, AP6602, AP6603, AP8801, AP8802, AP61201, AP6604, TV3301, TV3302 |
| GACH-OP-TUONG | Gạch ốp tường | 3 | TV3601, TV3602, AP61202 |
| GACH-TRANG-TRI | Gạch trang trí | 2 | TV3603, MK2201 |
| GACH-SAN-VUON | Gạch sân vườn | 2 | TV4401, TV4402 |
| GACH-GIA-GO | Gạch giả gỗ | 2 | MK15901, MK15902 |

Mapping theo cặp hãng/SKU, chỉ áp dụng fixture. Không đoán category cho dữ liệu thật hoặc SKU chưa khai báo. Các ID lô, tồn, chứng từ vẫn liên kết qua productId như trước; category không thay đổi số lượng hoặc lịch sử giao dịch.

## Tương thích và dữ liệu

Profile reviewed hiện có **59 collection**. Profile migration lịch sử giữ schema và danh sách collection cũ, không buộc nguồn cũ có category. Seed v8 tạo 5 nhóm và categoryId cho 18 product; tổng 638 bản ghi. Trình kiểm dữ liệu kiểm categoryId trỏ tới bản ghi tồn tại, không chỉ đúng kiểu ObjectId.

`add-product-categories.mjs` hỗ trợ nâng bản v7 còn nguyên sang v8 và nâng Atlas có đúng bản v7 đó: giữ nguyên dữ liệu khác, chỉ thêm category và categoryId, dừng nếu nguồn/đích khác, ghi remote trong transaction và đối chiếu đọc lại. Trong môi trường lần thực hiện này, local v7 và Atlas wmsd_database đều đã trống khi kiểm tra; do đó tạo lại fixture v8 trên local rồi triển khai vào Atlas rỗng bằng công cụ deploy, không coi đây là nâng dữ liệu cũ thành công. Các báo cáo v7 trước vẫn giữ là bằng chứng lịch sử.

## Thư mục model

- `embedded`: tất cả 96 file còn nơi gọi; là phần nhúng trong model cha, không phải collection riêng.
- `legacy`: ít nhất 12 file trong các module API hiện có còn import registry cũ; chưa thể xóa khi chưa port API.
- `rebuild`: registry, collection/ref map, kiểm sức chứa và công cụ seed/migration vẫn dùng. Đã xóa `reviewed-events.js`, `reviewed-support.js`, `reviewed-workflows.js`: ba builder này không còn importer ngoài nhóm chính chúng trong src/scripts/test.

[Bằng chứng rà import](../../../outputs/model_folder_usage_2026-11-06.json) · [Bản đồ model](../../../MODEL_MAP.md) · [Triển khai hiện hành](../../09_phat_trien/CATEGORIES_V8.md).
