# B04–B06 · Sản phẩm, lô và quy cách tại lần nhập

**Quyết định mới 06/11/2026:** [Sản phẩm và lô v6](39_San_pham_va_lo_dang_chot.md) thay các trường nominalSize/tone/calibre bên dưới: sản phẩm có dài/rộng/cao và màu, khác màu khác ID; lô có số viên/thùng cố định và kích thước ngoài thực tế. Các phần duyệt cũ giữ để truy vết, không phải cấu trúc hiện hành của B04/B05.

**Cập nhật 01/11/2026.** B04 v0.3 đã duyệt, sửa tham chiếu đơn vị thành tên đơn vị trực tiếp theo quyết định mới. B05 v0.3 giữ nguyên. B06 đã bỏ; v0.2 chỉ còn là lịch sử. [Quyết định bỏ UOM và lưu quy đổi trên dòng](14_Bo_UOM_va_luu_quy_doi_tren_dong.md). [Bản v0.2 đã trình](history/06_Nhap_san_pham_lo_va_quy_cach_v0.2_de_xuat.md) và [bản v0.3 đã trình](history/06_Nhap_san_pham_lo_va_quy_cach_v0.3_de_xuat.md) lưu nội dung trước khi duyệt. Quyền mặc định đối chiếu UC-13 và UC-16 trong [Report 3](../../01_bao_cao/WMSD_Report3_Fix.docx.txt). Quy tắc phân biệt hàng theo sản phẩm, lô, tông màu và cỡ thực tế lấy từ BR-01 trong [tài liệu nghiệp vụ](../../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md). Xem [phiếu kho, ô và đơn vị](05_Duyet_kho_vi_tri_don_vi_tinh.md) và [hiện trạng MongoDB](03_Cau_truc_DB_hien_tai.md).

## B04 · products · Sản phẩm

Một bản ghi đại diện cho một mã mặt hàng mà cửa hàng mua, lưu kho hoặc bán. Ví dụ gạch G60 kích thước danh nghĩa 600 × 600 mm có thể có nhiều lô. Kích thước này mô tả viên gạch. Để biết một thùng hàng chiếm bao nhiêu chỗ trong kho, cần kích thước ngoài thực tế lưu trên dòng nhập và C08.

| Trường đề xuất | Kiểu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId | ID nội bộ ổn định để dòng phiếu, lô và số dư tham chiếu đúng sản phẩm |
| `sku` | Chuỗi | Mã sản phẩm do hãng cấp, giữ nguyên cách viết và số 0 đầu mã trên nhãn |
| `manufacturerCode` | Chuỗi, bắt buộc | Mã ổn định đại diện cho hãng phát hành SKU. Hai nhà cung cấp phân phối cùng hàng của một hãng vẫn có thể tham chiếu một sản phẩm |
| `name` | Chuỗi | Tên thương mại |
| `material` | Chuỗi tùy chọn | Chất liệu theo thông tin sản phẩm ở UC-13. Ví dụ gạch porcelain. Không suy chất liệu nếu nhãn không ghi |
| `baseUnit` | Chuỗi bắt buộc, chuẩn hóa tên | Một đơn vị gốc lưu trực tiếp dùng ghi tồn, ví dụ Viên hoặc Cái; không tham chiếu bảng đơn vị |
| `wholeBaseUnits` | Đúng/sai | Nếu quản lý nguyên viên, kết quả quy đổi sang viên phải nguyên |
| `nominalSize` | Chuỗi tùy chọn | Kích thước danh nghĩa theo nhãn. Giữ được các mô tả khác nhau của gạch và thiết bị vệ sinh |
| `isActive`, `version` | Đúng/sai, số nguyên | Cho phép chọn cho giao dịch mới và kiểm soát cập nhật đồng thời |
| `createdAt`, `updatedAt` | Ngày giờ | Lịch sử tạo và cập nhật danh mục |

**Quan hệ.** Một sản phẩm có nhiều lô B05. Quy đổi và quy cách thực dùng lưu ngay trên từng dòng phiếu, không có bảng phiên bản quy đổi. Các dòng mua, nhập, bán, xuất và điều chuyển tham chiếu sản phẩm theo ID. Số dư theo kho thuộc nhóm tồn. Khóa việc đổi đơn vị gốc sau khi sản phẩm đã phát sinh giao dịch.

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

**Quan hệ.** Mỗi lô thuộc đúng một sản phẩm, có thể nằm ở nhiều kho/ô. Tồn thực tế lấy từ C02. Một hoặc nhiều dòng nhận có thể tham chiếu cùng một lô, từng dòng giữ bản thông tin quy cách thực tế tương ứng. Giữ lịch sử nếu cần sửa nhận dạng lô đã sử dụng.

**Đã chốt về mã trên thùng.** Người dùng xác nhận “Cùng một mã”. Kho nhập mã lô in trên thùng một lần vào `manufacturerLot` và dùng trường đó khi tra cứu. SKU xác định mẫu hàng, mã lô phân biệt các lô của mẫu đó.

**B05 v0.3 · ĐÃ DUYỆT.** Người dùng trả lời “Duyệt B05, dùng chung lô khi khớp”. Tra mã lô trong phạm vi sản phẩm. Khi nhận qua hai nhà cung cấp, dùng lại dòng lô đã xác minh nếu cùng sản phẩm, mã lô, tông màu và nhóm cỡ thực tế. Giữ riêng nhóm tồn khi tông màu hoặc cỡ thực tế khác nhau theo BR-01. Nhà cung cấp và lần nhận vẫn truy được từ từng phiếu nhập. Mã `00127` của sản phẩm khác có thể được dùng lại. Với lô đã xác minh, kiểm trùng bộ `(productId, manufacturerLot, tone, calibre)`, áp dụng tông/cỡ với mặt hàng có các thuộc tính này.

**Nhãn thiếu và quyền thao tác.** Tiếp nhận hàng chưa xác định theo từng nguồn nhận, giữ bằng chứng và chặn phân bổ/xuất cho đến khi xác minh. Theo UC-16, Warehouse Staff mặc định được tạo lô, Store Owner được tạo/sửa. Khi đã lên phiếu, phải lưu lịch sử xác minh hoặc sửa sai và giữ thông tin trên chứng từ cũ.

## B06 · product_unit_conversions · Quy cách và quy đổi đơn vị

**ĐÃ BỎ KHỎI THIẾT KẾ MỚI · 01/11/2026.** Không tạo bảng này hoặc bảng UOM Version dưới tên khác. Người dùng đã chọn giữ quy đổi trực tiếp trên dòng phiếu.

Mỗi dòng giữ tên đơn vị nhập, đơn vị gốc tại lúc lập, hệ số, lượng nhập/lượng gốc và thông tin kiện khi áp dụng. Người có quyền lập/kiểm nhận ghi theo nhãn thực tế; dòng đã ghi giữ hệ số ban đầu. Hai quy cách 4 viên/thùng và 5 viên/thùng vẫn lưu riêng. [Quyết định bỏ UOM và lưu quy đổi trên dòng](14_Bo_UOM_va_luu_quy_doi_tren_dong.md).

## Ví dụ đọc mã trên thùng

Giả sử kho nhận 10 thùng G60 mang mã nhãn `00127`, mỗi thùng 4 viên. Tra `00127` trong phạm vi sản phẩm đã xác định sẽ cho thấy lô tương ứng (B05), tên và kích thước gạch (B04), quy cách 4 viên/thùng đã lưu ngay trên dòng nhận. Phiếu nhận ghi 40 viên. Sau khi đã xuất một phần, muốn biết còn bao nhiêu ở mỗi ô phải đọc số dư tồn hiện tại (C02). Nhờ vậy có thể so sánh hai lô mà không tạo một bản ghi riêng cho từng thùng.

**Trạng thái.** B04/B05 đã duyệt; phần đơn vị của B04 sửa theo quyết định mới. B06 đã bỏ, dùng quy đổi trên dòng. Các mã, số lượng và kích thước ở ví dụ chỉ minh họa.
