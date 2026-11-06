# Sản phẩm, màu và lô trên thùng — đã chốt 06/11/2026

## Phần đã rõ và đã sửa

products bỏ nominalSize, thêm lengthMm, widthMm, heightMm dạng số chính xác (mm, tối đa 3 số lẻ), và color bắt buộc ghi tên màu cụ thể. heightMm của gạch là độ dày một viên. Mỗi màu là một productId riêng; cặp hãng/SKU cũ mở thành hãng/SKU/màu với unique index không phân biệt hoa/thường. Các nguồn phiếu tiếp tục dùng productId.

Bộ mẫu gạch có số đo và màu minh họa rõ ràng; chiều dày và số đo thiết bị vệ sinh trong mẫu là dữ liệu giả lập, không suy ra từ nominalSize cũ. Dữ liệu thật thiếu chiều dày/màu cần bổ sung trước khi chuyển.

## Lô và thùng đã cập nhật

Người dùng xác nhận số viên/thùng cố định theo lô và kích thước thùng phục vụ xếp vào ô còn chỗ. product_batches hiện lưu:

| Trường | Ý nghĩa |
|---|---|
| productId | Một sản phẩm, đã phân biệt màu và kích thước từng viên. |
| manufacturerLot | Mã lô in trên thùng, giữ số 0 đầu. |
| piecesPerCarton | Số viên/chiếc trong một thùng, số nguyên dương, cố định theo lô. |
| cartonLengthMm / cartonWidthMm / cartonHeightMm | Kích thước ngoài thực tế một thùng, gồm phần bao bì. |
| identificationStatus / manufacturedOn | Giữ trạng thái xác minh và ngày sản xuất nếu có. |

Lô không lưu calibre hoặc tone; màu thuộc sản phẩm. Khóa duy nhất của lô là productId + manufacturerLot. Hai thùng cùng cặp này dùng chung một bản ghi, không tạo ID cho từng thùng vật lý. Nếu màu khác, tạo/chọn productId khác trước khi xác định lô. Không đổi quy cách một lô đã sử dụng mà làm sai các phiếu cũ.

## Nhập hàng và kiểm sức chứa

Phiếu nhập ghi số thùng thực nhận; lượng viên/chiếc = số thùng × piecesPerCarton. Một dòng chỉ một sản phẩm/lô. Dòng phiếu giữ packagingSnapshot của lần nhập; snapshot phải khớp quy cách cố định của lô. Số thùng đã nhận không lưu như một số dư trên danh mục lô; tồn hiện tại theo inventory_balances và packagingPortions.

Kích thước thùng phải được ghi từ nhãn/đo ngoài thực tế. Không lấy dài/rộng/cao một viên nhân số viên để suy ra thùng vì chưa biết hướng đóng gói, vỏ và khoảng trống. Chiều dài/rộng/cao sản phẩm và thùng là hai thông tin khác nhau.

BE kiểm thùng vừa các cạnh ô (cho phép đổi hướng dài/rộng, giữ chiều cao đứng), rồi kiểm tổng thể tích đang chiếm. estimateCartonCapacity tính số thùng theo lưới cho ô trống đồng nhất và giới hạn ước tính từ thể tích còn lại. Với ô đã chứa nhiều kiểu hàng, đây là ước tính, không xác nhận được khoảng trống liên tục hoặc cách xếp thực tế khi chưa lưu tọa độ từng kiện. Bản đồ/xếp hàng 3D triển khai sau; chưa quản lý sức chịu tải hoặc số tầng an toàn.

## Dữ liệu và trạng thái triển khai

Seed v6 tại localhost:27017/wmsd_demo_tile_shop_v6, vẫn 58 bảng / 654 bản ghi cấp bảng. Các chiều đo, màu và tên trong mẫu là giả lập có ghi rõ. DB v5 và trước được giữ lại. Không suy đoán chiều dày/màu/kích thước thùng cho dữ liệu thật; phải bổ sung và đối chiếu các lô trùng trước khi chuyển. Không ghi DB nhóm.

Đã sửa schema reviewed, seed, kiểm dữ liệu/quy cách, helpers sức chứa, dictionary và diagram. 48 test DB/model đạt, gồm khác màu khác ID, số đo dương, số viên nguyên và kiểm thùng không lọt ô dù còn dung tích. API legacy chưa port sang cấu trúc này.
