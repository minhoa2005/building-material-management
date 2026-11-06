# Nhật ký duyệt thiết kế DB

Ngày bắt đầu: 31/10/2026.

Đã nhận đủ phản hồi A01–A03 và Q-A02-01/02. A01 v0.1, A02 v0.2 và A03 v0.2 được duyệt. Chưa áp dụng các thiết kế này vào schema/code/DB thực.

| Mã | Phiên bản phiếu | Câu trả lời người dùng | Nội dung đã chốt | Nội dung còn mở | Trạng thái |
|---|---|---|---|---|---|
| A01 | 0.1 | Duyệt A01 theo phiếu 0.1 | Toàn bộ trường/quan hệ/ràng buộc users của phiếu 0.1; một user một role | Không có câu hỏi mở riêng A01; chi tiết quyền nghiệp vụ duyệt sau | ĐÃ DUYỆT |
| A02 | 0.2 | Phản hồi đổi tên/tạo role và Q-A02-01/02 bên dưới | Warehouse Staff; Admin tạo role/tick quyền; bỏ giới hạn chỉ năm role; mã String, isSystemRole/isActive/version và vòng đời đã trình | Không còn câu hỏi mở cấu trúc; ma trận từng nghiệp vụ duyệt sau | ĐÃ DUYỆT |
| A03 | 0.2 | Duyệt A03 theo phiếu 0.1; sau đó chọn quyền theo checkbox tại Q-A02-01 | Giữ v0.1, bỏ allowedRoleCodes, không thêm roleGroup; danh mục quyền hữu hạn/cấp qua role | Chưa chốt toàn bộ mã quyền/ma trận từng nghiệp vụ | ĐÃ DUYỆT CẤU TRÚC |
| B01 | 0.1 | Duyệt B01 v0.1 | Toàn bộ cấu trúc, quan hệ, quyền mặc định và vòng đời của warehouses | — | ĐÃ DUYỆT |
| B01 bổ sung | 0.3 | Duyệt bổ sung kích thước B01 | Dài trong, rộng trong và cao hữu dụng của kho, chưa đo để trống cả bộ. Giữ B01 v0.1 | 3D để giai đoạn sau | ĐÃ DUYỆT PHẦN BỔ SUNG |
| B02 | 0.3 | Duyệt B02 theo phiếu v0.3 | Toàn bộ cấu trúc và quy tắc v0.3, tính đáy theo chồng, chặn khi vượt diện tích hoặc thể tích | Cách lưu lần xếp ở bảng giao dịch sẽ được duyệt riêng | ĐÃ DUYỆT |
| B03 | 0.3 | Cần chỉnh bảng đơn vị tính | Cùng lô cùng mã trên thùng, khác lô đổi mã | Cần một dòng mẫu của người dùng để xác định phần sửa. B04–B06 duyệt độc lập | YÊU CẦU CHỈNH |
| B03 | 0.4 | Duyệt B03, Warehouse Staff và Store Owner được thêm | Duyệt bảng units, chọn/thêm đơn vị ngay lúc lập phiếu. Sửa/ngừng đơn vị mặc định thuộc Store Owner. Administrator cấp quyền qua role | Quy cách sản phẩm sẽ duyệt riêng ở B06 | ĐÃ DUYỆT |
| B04 | 0.3 | Duyệt B04, phân biệt theo hãng và SKU | Sản phẩm duy nhất theo hãng + SKU. Dòng phiếu tham chiếu ID sản phẩm | — | ĐÃ DUYỆT |
| B05 | 0.3 | Duyệt B05, dùng chung lô khi khớp | Cùng sản phẩm, mã lô, tông và cỡ áp dụng thì dùng chung giữa các nhà cung cấp. Chặn phân bổ/xuất khi chưa xác minh. Warehouse Staff tạo lô, Store Owner tạo/sửa | — | ĐÃ DUYỆT |
| B06 | 0.2 | Duyệt B06 theo phiếu v0.2 | Duyệt bảng quy đổi theo phiên bản, kích thước ngoài khi áp dụng, quyền khai báo và chọn phiên bản theo phiếu | Quy tắc đặc thù của mặt hàng mới sẽ được xác nhận khi phát sinh | ĐÃ DUYỆT |
| B07 | 0.1 | Duyệt B07 theo phiếu v0.1 | Ngưỡng theo sản phẩm/kho, Store Owner cấu hình, cảnh báo khi tồn khả dụng dưới mức tối thiểu | — | ĐÃ DUYỆT |
| B08 (cách tổ chức) | Phản hồi 0.1 | Tách bảng khách hàng và nhà cung cấp · Cần danh mục để chọn lại | Tách customers, suppliers và có danh mục carriers dùng lại khi giao | Duyệt cấu trúc và quyền mỗi bảng riêng, C02 sẽ duyệt tham chiếu chủ hàng | PHẢN HỒI TRƯỚC KHI LÀM RÕ SHOP TỰ GIAO |
| B08A | 0.3 | Duyệt B08A v0.3 | Mã WMSD tự sinh, tên, điện thoại bắt buộc; Sales Staff tạo/sửa. Địa chỉ theo lần giao | — | ĐÃ DUYỆT |
| B08B | 0.1 | Duyệt B08B theo phiếu v0.1 | Accountant tạo ở PENDING, Store Owner kích hoạt thì mới lập PO mới, giữ lịch sử nếu ngừng | — | ĐÃ DUYỆT |
| B08C | 0.4 (v0.3 + sửa quyền) | Warehouse Staff cũng được tạo/sửa đội | Store Owner và Warehouse Staff tạo/sửa đội. Store Owner ngừng/kích hoạt lại. Giữ thông tin bàn giao từng chuyến | — | ĐÃ CHỐT THEO LỰA CHỌN |
| C01 | 0.1 | Duyệt C01 v0.1 | Điểm tại ô hoặc đang chuyển theo dòng xuất liên kho, phần mềm tạo khi cần | — | ĐÃ DUYỆT |
| C02 | 0.2 | Duyệt C02 v0.2 | Số dư theo điểm, lô, chất lượng và chủ sở hữu, quyền và nguyên tắc ghi tồn | Dữ liệu đóng gói/chồng hàng để kiểm sức chứa trình riêng | ĐÃ DUYỆT |
| C03 | 0.1 | Duyệt C03 v0.1 | Lần xác nhận làm đổi tồn, chứng từ, người/thời gian, gửi lại và sửa sai có liên kết | Quyền đảo và quy tắc từng chứng từ trình riêng | ĐÃ DUYỆT |
| C04 | 0.1 | Duyệt C04 v0.1 | Chi tiết biến động từng nhóm tồn, lượng trước/sau và dòng nguồn | — | ĐÃ DUYỆT |
| C05 | 0.1 | Duyệt C05 v0.1 | Giữ hàng thực tế, mốc giữ/giải phóng, chuyển giữ theo hàng và quyền | Quy tắc từng chứng từ trình riêng | ĐÃ DUYỆT |
| C06 | 0.1 | Duyệt C06 v0.1 | Gắn PO/TR với nhu cầu, trần lượng, nguồn đúng hạn, nhận và chuyển sang giữ hàng | Quy tắc từng chứng từ trình riêng | ĐÃ DUYỆT |
| C07 | 0.1 | Duyệt C07 v0.1 | Chồng/cụm trong ô, kích thước chiếm chỗ, cách tính thể tích, quyền và lịch sử | Lịch sử thao tác G02 trình riêng | ĐÃ DUYỆT |
| C08 | 0.1 | Duyệt C08 v0.1 | Hàng trong chồng theo số dư/quy cách, kiện nguyên/mở/lẻ, đối chiếu số lượng | Lịch sử thao tác G02 trình riêng | ĐÃ DUYỆT |
| H02 — phạm vi giá mua | Làm rõ trước phiếu v0.1 | Có giá mua và tổng tiền; chỉ Accountant/Store Owner xem | PO có đơn giá mua và tổng tiền; Warehouse Staff không được xem các trường giá | Quyết định phạm vi trước khi duyệt cả H02 ở dòng dưới | ĐÃ CHỐT PHẠM VI GIÁ |
| H01 | 0.1 | Cần giải thích thêm H01 | Chưa duyệt cấu trúc; đã thêm ví dụ và phân biệt thông tin nhập với dữ liệu tự ghi | Đầu RR và dòng nhúng, nguồn nhu cầu, các bản duyệt, lượng và quyền | CHỜ DUYỆT — ĐÃ BỔ SUNG GIẢI THÍCH |
| H02 | 0.1 | Duyệt H02 v0.1 | Mỗi PO một RR/NCC/kho, dòng nhúng, giá/lịch, nhận nhiều lần, sửa/đóng phần chưa nhận | H01 và các bảng nhập/lịch sử/đính chính vẫn duyệt riêng | ĐÃ DUYỆT |


Phản hồi A02 nguyên văn:

> ko có inventory staff, đổi sang warehouse staff
> Admin có thể tạo thêm role và tick các phân quyền

## Quyết định bổ sung A02/A03 đã nhận

| Câu hỏi | Câu trả lời người dùng | Tác động đã chốt | Trạng thái |
|---|---|---|---|
| Q-A02-01 | Có — role mới thực hiện theo các quyền Admin tick | Bỏ allowedRoleCodes; không thêm allowedRoleGroups/roleGroup; permission quyết định thao tác, vẫn giữ scope/trạng thái/độc lập người thực hiện | ĐÃ CHỐT |
| Q-A02-02 | Duyệt cấu trúc và vòng đời roles 0.2 như đề xuất | code String duy nhất/cố định, isSystemRole/isActive/version; sửa/ngừng role tùy chỉnh, gán lại user active trước ngừng; không xóa lịch sử; bảo vệ role nền | ĐÃ CHỐT |

[Phiếu gốc 0.1](history/02_Duyet_tai_khoan_va_phan_quyen_v0.1.md) và [đề xuất 0.2 trước khi chốt](history/02_Duyet_tai_khoan_va_phan_quyen_v0.2_de_xuat.md) được lưu để biết chính xác nội dung người dùng đã phản hồi. Phiếu chính thể hiện kết quả đã duyệt A01–A03. Không sửa nội dung bản lịch sử để giả rằng mọi phiên bản đều giống nhau.

## Phản hồi B03 nguyên văn

> với đơn vị tính, tôi muốn hiểu như này nhé, tôi sẽ quản lý mã thùng,  tron thùng sẽ có mã của sp, kích thước sp, quy cách đóng gói, các thông tin cần thiết nhất, tôi sẽ lưu mã thùng như là để lưu 1 lô hàng xem có khác gì lô khác ko ấy

B01 đã duyệt theo [phiếu gốc v0.1](history/05_Duyet_kho_vi_tri_don_vi_tinh_v0.1.md). [Phiếu v0.2](history/05_Duyet_kho_vi_tri_don_vi_tinh_v0.2.md) giữ các câu hỏi trước khi nhận phản hồi. [Phiếu v0.3 đã trình](history/05_Duyet_kho_vi_tri_don_vi_tinh_v0.3_de_xuat.md) dùng các quyết định dưới đây.

## Phản hồi về mã thùng, sức chứa và phạm vi

- **Mã trên thùng:** “Cùng lô cùng mã, khác lô đổi mã”.
- **Số đo:** “theo diện tích, thể tích của ô, trong dự án sẽ phải thêm chức năng kích thước của kho hàng, lên dc 3d map hàng càng tốt”.
- **Xếp vượt:** “Chặn xác nhận, yêu cầu chọn ô khác hoặc chia lượng”.
- **Phạm vi hiện tại:** “chức năng 3d minh hoạ kho sẽ thực hiện sau, hiện tại chỉ lên ý tưởng và xây dựng các bảng Database thôi nhé”.

[Bản v0.3 trình duyệt](history/05_Duyet_kho_vi_tri_don_vi_tinh_v0.3_de_xuat.md) là nội dung người dùng đã xem. Sau phản hồi, B01 bổ sung và B02 được duyệt. B03 phải sửa rồi trình lại.

## B03 v0.4 · Chọn hoặc thêm đơn vị

> Chọn theo thùng, hộp, viên, chiếc,... gì gì đó có lẽ là có thể tự thêm nếu chưa có

[Phiếu v0.4 đã trình](history/05_Duyet_kho_vi_tri_don_vi_tinh_v0.4_de_xuat.md). Người dùng trả lời “Duyệt B03, Warehouse Staff và Store Owner được thêm”. Quyền tạo đơn vị có thể cấp độc lập với quyền sửa hoặc ngừng dùng. [Kết quả duyệt B03](05_Duyet_kho_vi_tri_don_vi_tinh.md#b03--units--đơn-vị-tính).
