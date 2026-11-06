# Quyết định bỏ UOM và UOM Version

**ĐÃ CHỐT · 01/11/2026.** Người dùng yêu cầu “bỏ cái uom và uomversion đi nhé, làm bước tiếp theo”, sau đó chọn “Bỏ hai bảng, giữ quy đổi ngay trên dòng phiếu”. Quyết định này thay phần B03 v0.4 và B06 v0.2 đã duyệt trước đây. Đây là sửa thiết kế; không xóa collection hoặc dữ liệu MongoDB hiện có.

## Thiết kế hiện hành

| Vị trí | Thay đổi đã chốt |
|---|---|
| B03 `units` / tên cũ `uoms` | Loại khỏi thiết kế mới. Không có bảng hoặc màn hình quản lý đơn vị riêng |
| B06 `product_unit_conversions` / tên cũ `product_uom_versions` | Loại khỏi thiết kế mới. Không tạo bảng phiên bản quy đổi thay tên khác |
| B04 sản phẩm | `baseUnitId` được thay bằng `baseUnit`: tên đơn vị gốc lưu trực tiếp trên sản phẩm, ví dụ Viên/Chiếc/Bộ |
| Dòng RR, PO, nhập/xuất/chuyển và các dòng nghiệp vụ liên quan | Lưu tên đơn vị nhập và hệ số thực dùng ngay trên dòng; giữ số lượng theo đơn vị gốc |
| C08 hàng trong chồng | Giữ bản thông tin đóng gói thực tế của phần hàng; thay tham chiếu phiên bản quy cách bằng thông tin được sao chép từ dòng nguồn |
| C02 số dư, C03/C04 lịch sử, C05/C06 giữ và nguồn hàng | Tiếp tục tính theo đơn vị gốc của sản phẩm. Không cộng thùng của hai quy cách như thể chúng bằng nhau |

## Các trường trên dòng phiếu

Đây là thành phần nhúng trong dòng hàng, không phải collection mới. Tên trường số lượng theo loại phiếu vẫn giữ ý nghĩa riêng: `requestedQty`, `orderedQty` hoặc `enteredQty`.

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `enteredUnit` | Chuỗi, bắt buộc | Tên đơn vị nhân viên dùng trên dòng, ví dụ Thùng |
| `baseUnitSnapshot` | Chuỗi, bắt buộc | Đơn vị gốc lấy từ sản phẩm tại lần lập, ví dụ Viên |
| `baseUnitsPerUnit` | Decimal128 > 0 | Một đơn vị nhập bằng bao nhiêu đơn vị gốc; ví dụ 4 viên/thùng. Nhập bằng đơn vị gốc thì bằng 1 |
| Số lượng nhập | Decimal128 > 0 khi ghi nhận lượng phát sinh | Số lượng theo `enteredUnit`, ví dụ 10 thùng; dòng nháp tuân thủ kiểm tra khi gửi/xác nhận |
| Số lượng gốc | Decimal128 | Phần mềm tính bằng lượng nhập × `baseUnitsPerUnit`; tuân thủ `wholeBaseUnits` của sản phẩm |
| `packagingSnapshot` | Đối tượng nhúng, khi có bao gói | Quy cách kiện thực tế cần để phân biệt hàng và tính sức chứa theo bảng dưới |

`packagingSnapshot` gồm `packageUnit` (Thùng/Hộp...), `baseUnitsPerPackage` và `outerLengthMm`, `outerWidthMm`, `outerHeightMm` khi xác định được. `baseUnitSnapshot` của dòng xác định đơn vị gốc. Nếu nhập nguyên kiện và đơn vị nhập chính là đơn vị kiện, hệ số trên dòng phải bằng hệ số kiện. Khi nhập viên lẻ, hệ số nhập là 1, thông tin bao gói có thể để trống hoặc ghi lại bao gói còn dùng thực tế; không suy số thùng nguyên từ phép chia số viên.

Đơn vị được chuẩn hóa khoảng trắng, Unicode và chữ hoa/thường để so sánh trong sản phẩm/phiếu. Không tự coi hai tên khác nhau như Hộp và Thùng là cùng đơn vị hoặc tự suy hệ số. Nhập tên đơn vị mới không tạo bản ghi danh mục riêng. Người quản lý sản phẩm đặt đơn vị gốc theo quyền B04; người có quyền lập phiếu ghi đơn vị/hệ số của dòng trong phạm vi nghiệp vụ đó.

## Quy tắc giữ số lượng và lịch sử

1. Sản phẩm có một đơn vị gốc cố định sau khi phát sinh giao dịch. Số dư và các trần đặt/nhận/xuất đối chiếu theo đơn vị này.
2. Người lập/kiểm nhận ghi hệ số theo chứng cứ thực tế trên nhãn hoặc hồ sơ nguồn. Phần mềm kiểm số dương, đơn vị gốc đúng sản phẩm và nguyên đơn vị khi áp dụng. Không tự làm tròn để che phần lẻ hoặc hợp thức hóa thiếu hàng.
3. Một phiếu có thể có hai dòng cùng sản phẩm/lô nhưng khác quy cách: 10 thùng × 4 viên và 2 thùng × 5 viên, tổng 50 viên. Các quy cách thực tế được giữ riêng.
4. Dòng đã gửi duyệt, đã đặt hoặc đã ghi nhận giữ nguyên thông tin của bản đó. Thay quy cách về sau không tính lại lượng lịch sử. Sửa sai qua bản sửa/quyết định/ghi điều chỉnh đúng nghiệp vụ, không sửa ngược hệ số để thay tồn đã ghi.
5. Khi nhập khác quy cách đặt, giữ cả dòng PO đã đặt và quy cách thực nhập; so sánh bằng lượng gốc. TO/xuất theo nguồn tồn phải mang quy cách thực tế của hàng nguồn, không tự đổi nhãn hệ số để lấy được nhiều hàng hơn.
6. Giá mua trên PO vẫn là giá cho một `enteredUnit` của dòng; tổng dòng = lượng đặt theo đơn vị nhập × giá đó. Thay hệ số phải kiểm lại cả lượng và ý nghĩa giá của bản chưa thực hiện; không âm thầm áp giá một thùng cho một viên.

## Áp dụng vào chồng hàng C07–C08

C08 lưu `packagingSnapshot` thay cho ID phiên bản quy đổi. Với SEALED, phải biết đơn vị kiện và số đơn vị gốc/kiện; `quantityBase = sealedPackCount × packagingSnapshot.baseUnitsPerPackage`. Kích thước ngoài chưa rõ thì dùng số đo cả chồng theo MEASURED của C07, không bỏ qua kiểm sức chứa.

Khi nhóm các dòng C08, phân biệt số dư, tình trạng đóng gói và toàn bộ quy cách thực tế. Có thể dùng `packagingKey` do phần mềm tính từ các giá trị đã chuẩn hóa để tra nhanh; khóa này không trỏ bảng quy cách hay bảng phiên bản. Khi gộp phải kiểm lại các giá trị đầy đủ. Hai quy cách khác hệ số hoặc kích thước vẫn là hai dòng dù cùng tên Thùng. Nguồn và các lần thay đổi giữ qua lịch sử nghiệp vụ.

Đổi vị trí mang theo bản thông tin đóng gói của hàng. Mở thùng ghi lượng còn thực theo OPEN, không mặc định thùng còn đầy. Hàng giữ hộ/hàng lỗi vẫn chiếm chỗ như C07–C08 đã duyệt.

## Trạng thái các phiếu bị ảnh hưởng

B03 và B06 đã bị loại khỏi thiết kế hiện hành. B04 v0.3, C07–C08 v0.1 và H02 v0.1 được điều chỉnh phần đơn vị/quy cách theo quyết định mới này; phần nghiệp vụ khác vẫn theo các bản đã duyệt. H01 vẫn chờ duyệt cả bảng: quyết định bỏ UOM không được hiểu là duyệt H01. Các bảng nhập/kiểm nhận tiếp theo sử dụng quy đổi trên dòng.

Các bản trước thay đổi được lưu trong `history` với hậu tố `_truoc_bo_UOM_2026-11-01.md`. [Danh mục hiện hành](01_Danh_muc_duyet.md) · [Nhật ký quyết định](04_Nhat_ky_duyet.md).
