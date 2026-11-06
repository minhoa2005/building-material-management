# B04–B06 · Sản phẩm, lô và quy cách tại lần nhập

**31/10/2026 · Đã duyệt B04 v0.3, B05 v0.3 và B06 v0.2.** [Bản v0.2 đã trình](history/06_Nhap_san_pham_lo_va_quy_cach_v0.2_de_xuat.md) và [bản v0.3 đã trình](history/06_Nhap_san_pham_lo_va_quy_cach_v0.3_de_xuat.md) lưu nội dung trước khi duyệt. Quyền mặc định đối chiếu UC-13 và UC-16 trong [Report 3](../../01_bao_cao/WMSD_Report3_Fix.docx.txt). Quy tắc phân biệt hàng theo sản phẩm, lô, tông màu và cỡ thực tế lấy từ BR-01 trong [tài liệu nghiệp vụ](../../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md). Xem [phiếu kho, ô và đơn vị](05_Duyet_kho_vi_tri_don_vi_tinh.md) và [hiện trạng MongoDB](03_Cau_truc_DB_hien_tai.md).

## B04 · products · Sản phẩm

Một bản ghi đại diện cho một mã mặt hàng mà cửa hàng mua, lưu kho hoặc bán. Ví dụ gạch G60 kích thước danh nghĩa 600 × 600 mm có thể có nhiều lô. Kích thước này mô tả viên gạch. Để biết một thùng hàng chiếm bao nhiêu chỗ trong kho, cần kích thước ngoài của kiện ở B06.

| Trường đề xuất | Kiểu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId | ID nội bộ ổn định để dòng phiếu, lô và số dư tham chiếu đúng sản phẩm |
| `sku` | Chuỗi | Mã sản phẩm do hãng cấp, giữ nguyên cách viết và số 0 đầu mã trên nhãn |
| `manufacturerCode` | Chuỗi, bắt buộc | Mã ổn định đại diện cho hãng phát hành SKU. Hai nhà cung cấp phân phối cùng hàng của một hãng vẫn có thể tham chiếu một sản phẩm |
| `name` | Chuỗi | Tên thương mại |
| `material` | Chuỗi tùy chọn | Chất liệu theo thông tin sản phẩm ở UC-13. Ví dụ gạch porcelain. Không suy chất liệu nếu nhãn không ghi |
| `baseUnitId` | Tham chiếu B03 | Một đơn vị gốc dùng ghi tồn, ví dụ Viên hoặc Cái |
| `wholeBaseUnits` | Đúng/sai | Nếu quản lý nguyên viên, kết quả quy đổi sang viên phải nguyên |
| `nominalSize` | Chuỗi tùy chọn | Kích thước danh nghĩa theo nhãn. Giữ được các mô tả khác nhau của gạch và thiết bị vệ sinh |
| `isActive`, `version` | Đúng/sai, số nguyên | Cho phép chọn cho giao dịch mới và kiểm soát cập nhật đồng thời |
| `createdAt`, `updatedAt` | Ngày giờ | Lịch sử tạo và cập nhật danh mục |

**Quan hệ.** Một sản phẩm có nhiều lô B05 và nhiều phiên bản quy đổi B06. Các dòng mua, nhập, bán, xuất và điều chuyển tham chiếu sản phẩm theo ID. Số dư theo kho thuộc nhóm tồn. Khóa việc đổi đơn vị gốc sau khi sản phẩm đã phát sinh giao dịch.

**Đã chốt về nguồn mã.** Người dùng yêu cầu “Cần dùng mã của hãng làm SKU”. Khi lập danh mục, ghi mã sản phẩm trên nhãn hãng vào `sku`. Các giao dịch liên kết bằng `_id`.

**B04 v0.3 · ĐÃ DUYỆT.** Người dùng trả lời “Duyệt B04, phân biệt theo hãng và SKU”. Yêu cầu hãng và SKU khi tạo sản phẩm, với cặp `(manufacturerCode, sku)` duy nhất. Nếu hãng A và hãng B cùng in mã G60 thì tìm G60 sẽ thấy hai mặt hàng kèm tên hoặc mã hãng để chọn đúng. Chứng từ mua lưu riêng nhà cung cấp bán hàng trong lần đó. Khóa hãng và SKU sau khi phát sinh giao dịch để giữ lịch sử. Theo UC-13, Store Owner mặc định tạo, sửa và ngừng sử dụng sản phẩm. Theo UC-11/12, Store Owner, Accountant, Warehouse Staff và Sales Staff mặc định được xem. Administrator cấu hình quyền qua vai trò. Giá bán thuộc phần rà soát phạm vi riêng.

## B05 · product_batches · Lô sản phẩm

Một bản ghi đại diện cho một lô của một sản phẩm. Theo xác nhận của cửa hàng, các thùng cùng lô của một sản phẩm có chung mã trên nhãn và mã thay đổi khi đổi lô. Số lượng và vị trí mỗi lô thay đổi trong quá trình nhập, xuất và điều chuyển.

| Trường đề xuất | Kiểu | Ý nghĩa |
|---|---|---|
| `_id`, `productId` | ObjectId, tham chiếu B04 | ID lô và sản phẩm mà lô thuộc về |
| `manufacturerLot` | Chuỗi | Một trường cho mã lô của hãng in trên thùng, ví dụ `00127`. Giữ số 0 đầu mã. Bắt buộc có mã khi xác minh lô hàng theo nhãn |
| `tone`, `calibre` | Chuỗi tùy mặt hàng | Tông màu và nhóm cỡ thực tế ghi trên nhãn nếu có. Không suy calibre từ kích thước danh nghĩa |
| `identificationStatus` | Giá trị theo danh mục | Đã xác minh hoặc chưa xác định. Hàng chưa xác minh bị chặn phân bổ và xuất |
| `manufacturedOn` | Ngày, tùy chọn | Ngày sản xuất nếu có căn cứ trên nhãn |
| `createdAt`, `updatedAt` | Ngày giờ | Thời điểm ghi nhận và cập nhật |

**Quan hệ.** Mỗi lô thuộc đúng một sản phẩm, có thể nằm ở nhiều kho/ô. Tồn thực tế lấy từ C02. Một hoặc nhiều dòng nhận có thể tham chiếu cùng một lô, từng dòng giữ phiên bản quy cách tương ứng. Giữ lịch sử nếu cần sửa nhận dạng lô đã sử dụng.

**Đã chốt về mã trên thùng.** Người dùng xác nhận “Cùng một mã”. Kho nhập mã lô in trên thùng một lần vào `manufacturerLot` và dùng trường đó khi tra cứu. SKU xác định mẫu hàng, mã lô phân biệt các lô của mẫu đó.

**B05 v0.3 · ĐÃ DUYỆT.** Người dùng trả lời “Duyệt B05, dùng chung lô khi khớp”. Tra mã lô trong phạm vi sản phẩm. Khi nhận qua hai nhà cung cấp, dùng lại dòng lô đã xác minh nếu cùng sản phẩm, mã lô, tông màu và nhóm cỡ thực tế. Giữ riêng nhóm tồn khi tông màu hoặc cỡ thực tế khác nhau theo BR-01. Nhà cung cấp và lần nhận vẫn truy được từ từng phiếu nhập. Mã `00127` của sản phẩm khác có thể được dùng lại. Với lô đã xác minh, kiểm trùng bộ `(productId, manufacturerLot, tone, calibre)`, áp dụng tông/cỡ với mặt hàng có các thuộc tính này.

**Nhãn thiếu và quyền thao tác.** Tiếp nhận hàng chưa xác định theo từng nguồn nhận, giữ bằng chứng và chặn phân bổ/xuất cho đến khi xác minh. Theo UC-16, Warehouse Staff mặc định được tạo lô, Store Owner được tạo/sửa. Khi đã lên phiếu, phải lưu lịch sử xác minh hoặc sửa sai và giữ thông tin trên chứng từ cũ.

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

**B06 v0.2 · ĐÃ DUYỆT.** Người dùng trả lời “Duyệt B06 theo phiếu v0.2”. Store Owner mặc định khai báo quy cách từ thông tin đã xác minh theo UC-13. Warehouse Staff khi nhập chọn phiên bản khớp nhãn thực tế. Cùng một ngày có thể nhận cả thùng cũ 4 viên và thùng mới 5 viên. Nếu nhận 10 thùng loại cũ và 2 thùng loại mới thì ghi hai dòng, tổng cộng 50 viên. Mỗi phiên bản lưu kích thước ngoài của loại kiện khi áp dụng để kiểm sức chứa B02. Thiếu hệ số thì chưa được xác nhận quy đổi. Với hàng quản lý nguyên viên, kết quả phải nguyên. Hàng mua theo cân nặng hoặc diện tích dùng độ chính xác phù hợp với đơn vị gốc. Quy tắc riêng nếu có sẽ được xác nhận theo mặt hàng.

## Ví dụ đọc mã trên thùng

Giả sử kho nhận 10 thùng G60 mang mã nhãn `00127`, mỗi thùng 4 viên. Tra `00127` trong phạm vi sản phẩm đã xác định sẽ cho thấy lô tương ứng (B05), tên và kích thước gạch (B04), quy cách 4 viên/thùng của lần nhận (B06). Phiếu nhận ghi 40 viên. Sau khi đã xuất một phần, muốn biết còn bao nhiêu ở mỗi ô phải đọc số dư tồn hiện tại (C02). Nhờ vậy có thể so sánh hai lô mà không tạo một bản ghi riêng cho từng thùng.

**Trạng thái.** Đã duyệt B04 và B05 theo v0.3, B06 theo v0.2. Các mã, số lượng và kích thước ở ví dụ chỉ minh họa.
