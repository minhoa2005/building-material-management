# B04–B06 · Sản phẩm, lô và quy cách tại lần nhập

**Phiếu lấy ý kiến v0.2 · 31/10/2026. B04, B05 và B06 chưa được duyệt.** B03 v0.4 đã duyệt cách chọn và thêm đơn vị khi lập phiếu. Quyền mặc định dưới đây đối chiếu UC-13 và UC-16 trong [Report 3, ma trận quyền và luồng chính](../../01_bao_cao/WMSD_Report3_Fix.docx.txt). Dữ liệu đối chiếu từ Product, Lot, ProductUomVersion và BR-01, BR-02, BR-30 trong [tài liệu nghiệp vụ](../../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md). Xem [phiếu kho, ô và đơn vị](05_Duyet_kho_vi_tri_don_vi_tinh.md) và [hiện trạng MongoDB](03_Cau_truc_DB_hien_tai.md).

## B04 · products · Sản phẩm

Một bản ghi đại diện cho một mã mặt hàng mà cửa hàng mua, lưu kho hoặc bán. Ví dụ gạch G60 kích thước danh nghĩa 600 × 600 mm có thể có nhiều lô. Kích thước này mô tả viên gạch. Để biết một thùng hàng chiếm bao nhiêu chỗ trong kho, cần kích thước ngoài của kiện ở B06.

| Trường đề xuất | Kiểu | Ý nghĩa |
|---|---|---|
| `_id`, `sku` | ObjectId, chuỗi | ID liên kết và mã mặt hàng duy nhất mà cửa hàng dùng trên phiếu. Đề xuất SKU do cửa hàng quản lý và cố định sau tạo |
| `name` | Chuỗi | Tên thương mại |
| `material` | Chuỗi tùy chọn | Chất liệu theo thông tin sản phẩm ở UC-13. Ví dụ gạch porcelain. Không suy chất liệu nếu nhãn không ghi |
| `baseUnitId` | Tham chiếu B03 | Một đơn vị gốc dùng ghi tồn, ví dụ Viên hoặc Cái |
| `wholeBaseUnits` | Đúng/sai | Nếu quản lý nguyên viên, kết quả quy đổi sang viên phải nguyên |
| `nominalSize` | Chuỗi tùy chọn | Kích thước danh nghĩa theo nhãn. Giữ được các mô tả khác nhau của gạch và thiết bị vệ sinh |
| `isActive`, `version` | Đúng/sai, số nguyên | Cho phép chọn cho giao dịch mới và kiểm soát cập nhật đồng thời |
| `createdAt`, `updatedAt` | Ngày giờ | Lịch sử tạo và cập nhật danh mục |

**Quan hệ.** Một sản phẩm có nhiều lô B05 và nhiều phiên bản quy đổi B06. Các dòng mua, nhập, bán, xuất và điều chuyển tham chiếu sản phẩm theo ID. Số dư theo kho thuộc nhóm tồn. Đề xuất khóa việc đổi đơn vị gốc sau khi sản phẩm đã phát sinh giao dịch.

**Trình B04.** Theo UC-13, đề xuất Store Owner mặc định tạo, sửa và ngừng sử dụng sản phẩm. Store Owner, Accountant, Warehouse Staff, Sales Staff mặc định được xem theo UC-11/12. Administrator có thể cấp các quyền theo vai trò. Đề xuất dùng SKU của cửa hàng, giữ tên, chất liệu, kích thước danh nghĩa, đơn vị gốc và trạng thái. Nếu cửa hàng dùng mã của hãng làm SKU hoặc cần thêm trường riêng như thương hiệu/màu, ghi rõ trước khi duyệt. Phiếu này xét danh mục hàng hóa; quyết định về giá bán sẽ được đối chiếu riêng.

## B05 · product_batches · Lô sản phẩm

Một bản ghi đại diện cho một lô của một sản phẩm. Theo xác nhận của cửa hàng, các thùng cùng lô của một sản phẩm có chung mã trên nhãn và mã thay đổi khi đổi lô. Số lượng và vị trí mỗi lô thay đổi trong quá trình nhập, xuất và điều chuyển.

| Trường đề xuất | Kiểu | Ý nghĩa |
|---|---|---|
| `_id`, `productId` | ObjectId, tham chiếu B04 | ID lô và sản phẩm mà lô thuộc về |
| `cartonLabelCode` | Chuỗi | Mã thực tế dùng tra lô từ nhãn thùng. Giữ số 0 đầu mã. Chờ xác nhận quy tắc cho mặt hàng thiếu nhãn |
| `manufacturerLot` | Chuỗi tùy trường hợp | Mã lô của nhà sản xuất. Chỉ tách khỏi mã nhãn nếu hai mã có ý nghĩa khác nhau tại cửa hàng |
| `tone`, `calibre` | Chuỗi tùy mặt hàng | Tông màu và nhóm cỡ thực tế ghi trên nhãn nếu có. Không suy calibre từ kích thước danh nghĩa |
| `identificationStatus` | Giá trị theo danh mục | Đã xác minh hoặc chưa xác định, kế thừa nhu cầu hiện tại. Điều kiện xuất với lô chưa rõ sẽ hỏi riêng |
| `manufacturedOn` | Ngày, tùy chọn | Ngày sản xuất nếu có căn cứ trên nhãn |
| `createdAt`, `updatedAt` | Ngày giờ | Thời điểm ghi nhận và cập nhật |

**Quan hệ.** Mỗi lô thuộc đúng một sản phẩm, có thể nằm ở nhiều kho/ô. Tồn thực tế lấy từ C02. Một hoặc nhiều dòng nhận có thể tham chiếu cùng một lô, từng dòng giữ phiên bản quy cách tương ứng. Đề xuất giữ lịch sử nếu cần sửa nhận dạng lô đã sử dụng.

**Cần làm rõ trước khi trình duyệt B05.** Trên nhãn một thùng thực tế, mã mà cửa hàng dùng để tra lô có phải chính là mã lô nhà sản xuất hay là hai mã riêng? Một ví dụ từ nhãn sẽ quyết định cần lưu một hay hai trường. Khi duyệt B05 sẽ hỏi tiếp phạm vi trùng mã giữa sản phẩm/nhà cung cấp. Theo UC-16, đề xuất Warehouse Staff mặc định được tạo lô, Store Owner được tạo/sửa, nhân viên chỉ xuất theo lô đủ nhận dạng. Nếu thiếu dữ kiện thì ghi chưa xác định và chờ kiểm tra, không tự gán chung các kiện thiếu nhãn vào một lô. Giữ bằng chứng và lịch sử nhận dạng khi lô đã lên chứng từ.

## B06 · product_unit_conversions · Quy cách và quy đổi đơn vị

Một bản ghi là một phiên bản quy đổi cho một sản phẩm và một đơn vị giao dịch. Ví dụ gạch G60, phiên bản 1 có 4 viên/thùng. Nếu thay thành 5 viên/thùng, lập phiên bản mới. Mười thùng của phiên bản cũ vẫn tương ứng 40 viên khi tra phiếu cũ.

| Trường đề xuất | Kiểu | Ý nghĩa |
|---|---|---|
| `_id`, `productId`, `unitId` | ObjectId, tham chiếu B04 và B03 | Xác định sản phẩm và đơn vị đang quy đổi sang đơn vị gốc |
| `version`, `validFrom` | Số nguyên dương, ngày giờ | Số phiên bản và thời điểm bắt đầu áp dụng |
| `baseUnitsPerUnit` | Số thập phân dương | Số đơn vị gốc trong một đơn vị này, ví dụ 4 viên trong 1 thùng |
| `outerLengthMm`, `outerWidthMm`, `outerHeightMm` | Ba số nguyên dương, khi áp dụng | Kích thước ngoài đo được của kiện nguyên theo phiên bản này. Đơn vị diện tích giao dịch như m² không cần kích thước bao bì |
| `createdAt` | Ngày giờ | Thời điểm tạo phiên bản |

**Quan hệ và quy tắc.** Từng dòng phiếu cần giữ số lượng nhập, đơn vị giao dịch, phiên bản quy đổi, hệ số đã dùng và số lượng gốc. Đề xuất giữ duy nhất bộ sản phẩm + đơn vị + số phiên bản, không sửa phiên bản đã dùng. Với hàng bao bì cũ nhập sau khi có phiên bản mới, phải ghi phiên bản thực tế của kiện. Hàng mở thùng ghi số còn thực, không mặc định đủ thùng hoặc tự chuyển thành hàng lỗi.

**Trình B06.** Đề xuất Store Owner mặc định khai báo quy cách dựa trên thông tin đã xác minh theo UC-13. Warehouse Staff khi nhập chỉ chọn phiên bản khớp nhãn thực tế. Cùng một ngày có thể nhận cả thùng cũ 4 viên và thùng mới 5 viên. Nếu nhận 10 thùng loại cũ và 2 thùng loại mới thì ghi hai dòng, tổng cộng 50 viên. Mỗi phiên bản lưu kích thước ngoài của loại kiện khi áp dụng để kiểm sức chứa B02. Thiếu hệ số thì chưa được xác nhận quy đổi; với hàng quản lý nguyên viên, kết quả phải nguyên. Hàng mua theo cân nặng hoặc diện tích dùng độ chính xác phù hợp với đơn vị gốc; quy tắc riêng nếu có sẽ được xác nhận theo mặt hàng.

## Ví dụ đọc mã trên thùng

Giả sử kho nhận 10 thùng G60 mang mã nhãn `00127`, mỗi thùng 4 viên. Tra `00127` trong phạm vi sản phẩm đã xác định sẽ cho thấy lô tương ứng (B05), tên và kích thước gạch (B04), quy cách 4 viên/thùng của lần nhận (B06). Phiếu nhận ghi 40 viên. Sau khi đã xuất một phần, muốn biết còn bao nhiêu ở mỗi ô phải đọc số dư tồn hiện tại (C02). Nhờ vậy có thể so sánh hai lô mà không tạo một bản ghi riêng cho từng thùng.

**Thứ tự duyệt.** Chốt B04, B05 và B06 bằng ba quyết định riêng sau nhóm B01–B03. Các mã, số lượng và kích thước ở ví dụ chỉ dùng để giải thích quan hệ.
