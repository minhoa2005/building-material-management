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
| B03 | 0.4 — lịch sử | Duyệt B03, Warehouse Staff và Store Owner được thêm | Đã từng duyệt bảng units | Đã được thay bằng quyết định bỏ bảng bên dưới | PHIẾU CŨ ĐÃ THAY THẾ |
| B04 | 0.3 | Duyệt B04, phân biệt theo hãng và SKU | Sản phẩm duy nhất theo hãng + SKU. Dòng phiếu tham chiếu ID sản phẩm | — | ĐÃ DUYỆT |
| B05 | 0.3 | Duyệt B05, dùng chung lô khi khớp | Cùng sản phẩm, mã lô, tông và cỡ áp dụng thì dùng chung giữa các nhà cung cấp. Chặn phân bổ/xuất khi chưa xác minh. Warehouse Staff tạo lô, Store Owner tạo/sửa | — | ĐÃ DUYỆT |
| B06 | 0.2 — lịch sử | Duyệt B06 theo phiếu v0.2 | Đã từng duyệt bảng quy đổi theo phiên bản | Đã được thay bằng quyết định bỏ bảng bên dưới | PHIẾU CŨ ĐÃ THAY THẾ |
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
| C07 | 0.1 | Duyệt C07 v0.1 | Chồng/cụm trong ô, kích thước chiếm chỗ, cách tính thể tích, quyền và lịch sử | Lịch sử thao tác G02 đã duyệt riêng v0.1 ngày 02/11 | ĐÃ DUYỆT |
| C08 | 0.1 | Duyệt C08 v0.1 | Hàng trong chồng theo số dư/quy cách, kiện nguyên/mở/lẻ, đối chiếu số lượng | Lịch sử thao tác G02 đã duyệt riêng v0.1 ngày 02/11 | ĐÃ DUYỆT |
| H02 — phạm vi giá mua | Làm rõ trước phiếu v0.1 | Có giá mua và tổng tiền; chỉ Accountant/Store Owner xem | PO có đơn giá mua và tổng tiền; Warehouse Staff không được xem các trường giá | Quyết định phạm vi trước khi duyệt cả H02 ở dòng dưới | ĐÃ CHỐT PHẠM VI GIÁ |
| H01 | 0.1 | Cần giải thích thêm H01 | Chưa duyệt cấu trúc; đã thêm ví dụ và phân biệt thông tin nhập với dữ liệu tự ghi | Đầu RR và dòng nhúng, nguồn nhu cầu, các bản duyệt, lượng và quyền | CHỜ DUYỆT — ĐÃ BỔ SUNG GIẢI THÍCH |
| H02 | 0.1 | Duyệt H02 v0.1 | Mỗi PO một RR/NCC/kho, dòng nhúng, giá/lịch, nhận nhiều lần, sửa/đóng phần chưa nhận | H01 và các bảng nhập/lịch sử/đính chính vẫn duyệt riêng | ĐÃ DUYỆT |
| B03/B06 — quyết định mới | 01/11/2026 | bỏ cái uom và uomversion đi nhé, làm bước tiếp theo | Bỏ hai collection khỏi thiết kế mới | Không xóa dữ liệu DB nguồn hiện tại | ĐÃ CHỐT BỎ BẢNG |
| Quy đổi trên dòng | Phiếu 14 | Bỏ hai bảng, giữ quy đổi ngay trên dòng phiếu | baseUnit ở products; đơn vị/hệ số/quy cách ở dòng, C08 giữ packagingSnapshot. Áp dụng vào B04/C07/C08/H02; H01 vẫn chờ duyệt cả bảng | Nhóm nhập/kiểm nhận trình tiếp | ĐÃ CHỐT |
| H03 | 0.1 | Duyệt H03 v0.1 | Hàng thực đến theo PO, số lượng/nhãn, quyền Warehouse Staff và dữ liệu vật lý | H33/H34 đã duyệt riêng v0.1, dữ liệu dùng chung trình riêng | ĐÃ DUYỆT |
| H04 | 0.1 | Duyệt H04 v0.1 | Phân kết quả kiểm theo lượng/chất lượng/sở hữu; kiểm lại giữ lịch sử và không dùng trùng kết quả | Dùng lại cho chuyển/trả sẽ đối chiếu ở lượt tương ứng | ĐÃ DUYỆT |
| H05 | 0.1 | Duyệt H05 v0.1 | Phiếu nhập sở hữu, dòng quy đổi trực tiếp, quyền POST và cập nhật tồn/giữ/chồng cùng một lần | H33/H34 đã duyệt v0.1, H35 và lịch sử tiếp tục trình riêng | ĐÃ DUYỆT |
| Q04 · H07/H09 | 01/11/2026 | Một TR có nhiều phiếu xuất, tổng không vượt lượng duyệt | Mỗi phiếu xuất truy về một TR đã duyệt. Kiểm tổng theo từng dòng TR. Mỗi TO vẫn xác nhận trọn lệnh một lần. | Quan hệ phiếu xuất với phiếu nhận đã có quyết định riêng bên dưới | ĐÃ CHỐT QUAN HỆ TR VỚI PHIẾU XUẤT |
| H06 | 0.1 | Duyệt H06 v0.1 | Dùng chung TO cho chuyển vị trí, lấy hàng, xếp hàng. Quyền người lập BF03 và ghi tồn một lần khi xác nhận theo loại TO | Chứng từ xuất/nhận liên kho duyệt riêng | ĐÃ DUYỆT |
| H07 | 0.1 | Duyệt H07 v0.1 | Đầu TR, dòng hàng, quyền, điều kiện đóng. Phiếu xuất mở giữ hạn mức từng dòng. Hủy trước xuất trả hạn mức | Cấu trúc phiếu nhận duyệt riêng ở H10 | ĐÃ DUYỆT |
| H08 | 0.1 | Duyệt H08 v0.1 | Lưu yêu cầu nội kho riêng. Mỗi yêu cầu có hàng cần di chuyển sinh một TO. Khi toàn bộ hàng đã vào khu cách ly, việc xếp hàng đạt là không áp dụng | Cách lưu kết quả trên phiếu nhận thuộc H10 | ĐÃ DUYỆT |
| Q04 · H09/H10 | 01/11/2026 | Cho lập phiếu nhận thứ hai trên cùng phiếu xuất | Một H09 có nhiều H10. Mỗi lượt ghi phần thực nhận riêng và chỉ dùng phần còn đang chuyển của dòng xuất đó | Cấu trúc H10 trình riêng dưới đây | ĐÃ CHỐT QUAN HỆ PHIẾU XUẤT VỚI PHIẾU NHẬN |
| H09 | 0.1 | Duyệt H09 v0.1 | Mỗi đợt xuất có một phiếu theo TR, lưu dòng, lô, ô lấy và ô tập kết. Phiếu mở giữ hạn mức và tồn. Xác nhận TO nguồn mới ghi thực xuất | — | ĐÃ DUYỆT |
| H10 | 0.1 | Duyệt H10 v0.1 | Mỗi lần nhận trên H09 có mã, người, ngày, lượng đạt/lỗi theo dòng xuất. Người nhận khác người xuất. Giới hạn theo lượng còn đang chuyển | — | ĐÃ DUYỆT |
| H11 · BF04 | 0.1 | Duyệt H11 v0.1 cho BF04 | Nhúng từng lần bàn giao trong H09. Ghi đội, lái xe, thời gian, lượng, người giao và bằng chứng. Tổng bàn giao khớp thực xuất | Bàn giao xuất bán đã duyệt riêng tại H15/H16 | ĐÃ DUYỆT CHO BF04 |
| H12/H37 · phạm vi | 01/11/2026 | SO lưu giá, WMSD lập hóa đơn tổng hợp | SO lưu giá bán theo dòng. Hóa đơn trong WMSD tổng hợp phiếu xuất của cùng SO và thể hiện ngày từng lần xuất | Quyền và cấu trúc đã duyệt ở các dòng H12/H37 riêng | ĐÃ CHỐT PHẠM VI |
| H37 · lượng tính tiền | 01/11/2026 | Tính 98 viên khách nhận, vẫn hiển thị 100 viên đã xuất | Hiển thị lượng đã xuất và tính tiền theo lượng khách nhận trong từng dòng nguồn | Điều kiện phát hành và làm tròn đã duyệt ở H37 v0.1 | ĐÃ CHỐT CĂN CỨ TÍNH TIỀN |
| H12 | 0.2 | Duyệt H12 v0.2 | Đơn giá theo đơn vị bán và hệ số trên từng dòng SO. Phần đã chuyển xuống WIR giữ phiên bản giá cũ. Sales Staff ghi giá, Store Owner/Accountant xem theo quyền. Warehouse Staff xem dữ liệu thực hiện | Bằng chứng giao khách đã duyệt ở H16. H17 v0.1 đã duyệt cho mốc hoàn thành SO | ĐÃ DUYỆT |
| H13 | 0.1 | Duyệt H13 v0.1 | WIR lưu riêng, chia nhu cầu theo dòng SO. Theo dõi hạn mức, phần chưa thực hiện và quyền theo đơn/kho | — | ĐÃ DUYỆT |
| H14 | 0.1 | Duyệt H14 v0.1 | Mỗi OD là một đợt của một WIR, từ một kho. Lệnh có hiệu lực mới giữ lượng tương ứng. Ghi lịch, người nhận, địa chỉ từng đợt | — | ĐÃ DUYỆT |
| H15 | 0.1 | Duyệt H15 v0.1 | Mỗi phiếu ghi một lần Warehouse Staff bàn giao theo lệnh giao, với ngày giờ, dòng hàng, lô, lượng, người giao/nhận và bằng chứng. Xác nhận bàn giao trừ tồn một lần | — | ĐÃ DUYỆT |
| H16 | 0.1 | Duyệt H16 v0.1 | Một phiếu xuất có thể có nhiều biên bản nhận. Warehouse Staff ghi ảnh, người nhận, thời điểm, lượng theo dòng và lý do phần chưa nhận. Hóa đơn tính theo lượng khách nhận hợp lệ | — | ĐÃ DUYỆT |
| H17 | 0.1 | Giữ và duyệt H17 v0.1, chờ Sales xác nhận | Giữ external_payment_confirmations. Sau giao hàng, Sales Staff phụ trách xác nhận cửa hàng đã nhận đủ tiền ngoài WMSD cho phiên bản SO, lưu người/giờ và ít nhất một căn cứ. H17 và trạng thái Hoàn thành được ghi cùng giao dịch | — | ĐÃ DUYỆT |
| H18 | 0.1 | Duyệt H18 v0.1 | Warehouse Staff ghi sự cố, nguồn, lô, vị trí, chủ hàng, lượng và bằng chứng. Chặn đúng lượng nghi lỗi, giữ nguyên tổng vật lý, cập nhật kiểm lại cùng hồ sơ | E06 v0.1 đã duyệt riêng | ĐÃ DUYỆT |
| H19 | 0.1 | Duyệt H19 v0.1 | Warehouse Staff đề xuất, Store Owner mặc định duyệt theo hành động và lượng. Có thể trả hoặc hủy toàn bộ, chỉ chia dòng khi khác hướng xử lý. Phần chưa quyết định tiếp tục cách ly | Chứng từ đổi chất lượng và trả NCC duyệt riêng | ĐÃ DUYỆT |
| H20 | 0.1 | Duyệt H20 v0.1 | Giữ phiếu hủy theo từng lần thực hiện, có quyết định nguồn, ngày, người thực hiện, lượng và bằng chứng. Chỉ giảm tồn theo lượng thực hủy trong hạn mức còn được phép | H18 và H19 đã duyệt riêng | ĐÃ DUYỆT |
| H23 | 0.1 | Duyệt H23 v0.1 | Warehouse Staff ghi lượng giao không thành, lý do, bằng chứng và người giữ theo dòng xuất bán | Hàng trên xe chưa ghi tăng tồn tại kho | ĐÃ DUYỆT |
| H24 | 0.1 | Duyệt H24 v0.1 | Mỗi lần thực về có phiếu riêng theo dòng H23. Hàng lỗi được ghi vào ô cách ly | Phần chưa về tiếp tục theo dõi | ĐÃ DUYỆT |
| E03 | 0.1 | Duyệt E03 v0.1 | Mỗi dòng thực nhận về mở đúng lượng trên đơn cũ. Sales có thể chờ, giao bù bằng hàng đạt hoặc hủy theo thỏa thuận | Gắn với dòng nhận về H24 | ĐÃ DUYỆT |
| E04 | 0.1 | Duyệt E04 v0.1 | Sales Staff được dùng lệnh cũ hoặc chuyển lượng đã mở sang lệnh thay thế trên cùng dòng đơn. Ghi hai lệnh, dòng nhận về, lượng, người và thời điểm | Một lượng chỉ còn quyền giao ở một lệnh | ĐÃ DUYỆT |
| E05 | 0.1 | Duyệt E05 v0.1 | Sales Staff ghi hủy phần chưa xuất hoặc giao thất bại đã thực về, chưa xuất giao bù. Ghi lượng, nguồn, lý do và thời điểm | Thu hồi phần soạn có thể dừng và giải phóng hàng giữ liên quan | ĐÃ DUYỆT |
| H27 | 0.1 | Duyệt H27 v0.1 theo UC-71 bản BE | Sau kiểm, Sales Staff quyết định ca thường, kể cả yêu cầu mình lập. Store Owner khác người đề xuất quyết định ngoại lệ đủ căn cứ | Đã chốt phiên bản UC-71 áp dụng | ĐÃ DUYỆT |
| E01 | 0.1 | Duyệt E01 v0.1 | Warehouse Staff ghi tình trạng từng phần, bằng chứng và các lần kiểm. Thiếu căn cứ thời hạn thì chờ xác minh | Liên kết quyết định H27 với phần kiểm hiệu lực | ĐÃ DUYỆT |
| H28 | 0.2 | Duyệt H28 v0.2: cho phép nhận sở hữu khi Owner duyệt | Store Owner duyệt ngoại lệ đủ căn cứ. Warehouse Staff ghi H28 theo lượng thực nhận, hàng lỗi nhà sản xuất vào khu cách ly, chặn xuất bán | Khi thực hủy dùng H20 theo phương án H19 | ĐÃ DUYỆT |
| E02 | 0.1 | Duyệt E02 v0.1 | Chặn đề nghị trả trùng theo phần khách đã nhận hoặc giao thất bại. Ghi nguồn, lượng đang mở, đã dùng và đã giải phóng | Trường hợp khách trả và trường hợp từ chối tại lúc giao có trần riêng | ĐÃ DUYỆT |
| H33 | 0.1 | Duyệt H33 v0.1 | Warehouse Staff ghi lần giữ thực tế, chủ hàng, lô, số lượng, ô, người bàn giao và bằng chứng | Khi nhận sở hữu chỉ chuyển đúng lượng đã duyệt | ĐÃ DUYỆT |
| H34 | 0.1 | Duyệt H34 v0.1 | Warehouse Staff xác nhận khi thực giao, theo dòng H33 còn giữ, số lượng, người nhận, ngày giờ và bằng chứng | Loại phần đã nhận sở hữu khỏi lượng có thể bàn giao | ĐÃ DUYỆT |
| H29 | 0.1 | Duyệt H29 v0.1 theo BF-08 bản BE | Warehouse Staff lập yêu cầu, Accountant xác minh thỏa thuận đúng nguồn/lượng rồi kho thực xuất. Accountant đối chiếu và đóng phần kho | Cập nhật nhánh trả NCC đã nêu trước ở H19 theo quyết định mới này | ĐÃ DUYỆT |
| H30 | 0.1 | Duyệt H30 v0.1 | Warehouse Staff xác nhận từng lần giao thực, người giao/nhận, ngày, lô, lượng và bằng chứng. H30 ghi giảm phần thuộc cửa hàng | Phần còn thuộc NCC bàn giao qua H34 | ĐÃ DUYỆT |
| H31 | 0.1 | Duyệt H31 v0.1 | Accountant lưu lượng NCC thực nhận và bằng chứng theo từng dòng, đối chiếu phần chưa khớp và đóng khi mọi lượng có kết quả | Giữ số lượng phiếu xuất cũ, chứng từ thực hiện xác định biến động tồn | ĐÃ DUYỆT |
| E06 | 0.1 | Duyệt E06 v0.1 | Chặn đúng phần nghi lỗi theo lô/ô/lượng, lưu bằng chứng và lịch sử. Warehouse Staff giải phóng theo phương án kiểm lại được Store Owner duyệt | Chặn được xét theo từng phần cùng ràng buộc tồn khác | ĐÃ DUYỆT |
| H26 | 0.1 | Duyệt H26 v0.1 | Warehouse Staff xác nhận đổi chất lượng theo H19 được duyệt, giữ lô/chủ/vị trí và tổng lượng. Lưu trạng thái trước/sau và người/thời điểm | Chuyển ô dùng lệnh di chuyển | ĐÃ DUYỆT |
| H32 | 0.1 | Duyệt H32 v0.1 | Bảng dùng chung ghi thiếu, thừa, sai hàng/lô, hư hỏng và kết quả theo dòng nguồn. Warehouse Staff ghi tại kho, Accountant đối chiếu NCC | Chứng từ thực hiện làm căn cứ thay đổi tồn | ĐÃ DUYỆT |
| H21 | 0.1 | Duyệt H21 v0.1 | Đợt kiểm thuộc một kho; Store Owner lập phạm vi, lịch và người đếm; Warehouse Staff kích hoạt khi đủ điều kiện, cùng lúc ghi mốc và khóa | F02/H25/H22 đã duyệt v0.1 bổ sung phần đếm và chốt | ĐÃ DUYỆT |
| F01 | 0.1 | Duyệt F01 v0.1 | Giữ mốc từng ô/lô/chất lượng/chủ; hàng phát hiện thêm có dòng số sổ 0 và bằng chứng, không sửa mốc gốc | F02 v0.1 đã duyệt cách giữ các lần đếm | ĐÃ DUYỆT |
| F03 | 0.1 | Duyệt F03 v0.1 | Mỗi ô chỉ có một khóa hiệu lực; chặn giao dịch trong ô, lưu lịch sử và chỉ mở khi chốt hợp lệ thành công | H25/H22 v0.1 đã duyệt chi tiết phương án và giao dịch chốt | ĐÃ DUYỆT |
| F02 | 0.1 | Duyệt F02 v0.1 | Giữ riêng các lần đếm/đếm lại, lượng/quy đổi, người, thời điểm và bằng chứng; kho chọn kết quả có căn cứ, giữ lịch sử; xác nhận cả phạm vi trống | — | ĐÃ DUYỆT |
| H25 | 0.1 | Duyệt H25 v0.1 | Kho đề xuất và ghi thực hiện; Owner khác người đề xuất duyệt rồi chốt. Tách thiếu/thừa khỏi đổi chất lượng/vị trí, đổi căn cứ cần duyệt lại | Chốt thành công cùng ghi tồn và mở khóa; không tạo phương án giả khi hoàn toàn khớp | ĐÃ DUYỆT |
| H22 | 0.1 | Duyệt H22 v0.1 | Tự sinh phiếu điều chỉnh lượng khác 0 từ phương án được duyệt khi chốt; đổi chất lượng/vị trí không tạo thiếu/thừa giả | Liên kết C03/C04 cùng lần ghi, H35 sửa sai được trình riêng | ĐÃ DUYỆT |
| H35 | 0.1 | Chờ phản hồi | Đã trình đảo toàn bộ một lần ghi sai, giữ liên kết gốc, kiểm nghiệp vụ phụ thuộc và quyền | Chờ duyệt cấu trúc và luồng người có quyền đề nghị, Owner duyệt/ghi | CHỜ DUYỆT |
| H36 | 0.1 | Duyệt H36 v0.1 | Duyệt ngày 02/11/2026: kho lập tồn ban đầu theo ô/lô/chủ/chất lượng và nguồn đối chiếu; Owner khác người lập xác minh/ghi một lần; giữ quy đổi và lịch sử | Ngày/cách chuyển dữ liệu quyết định riêng; H01 và H35 chưa được duyệt qua phản hồi này | ĐÃ DUYỆT |
| D01 | 0.1 | Duyệt D01 v0.1 | Duyệt ngày 02/11/2026: nơi lưu riêng theo nghiệp vụ thay business_documents; giữ TO dùng chung và bàn giao nhúng; không thêm đầu phiếu chung trùng dữ liệu | D02–D06 đã duyệt; H01/H35 và D07/D08 còn chờ riêng | ĐÃ DUYỆT |
| D02 | 0.1 | Duyệt D02 v0.1 | Dòng items có ID cố định trong phiếu, giữ quy đổi/phiên bản nguồn; thay bảng document_lines, giữ riêng lịch sử và nghiệp vụ có vòng đời riêng | Ánh xạ ID cũ–mới và kiểm lịch sử khi lập kế hoạch chuyển đổi | ĐÃ DUYỆT |
| D03 | 0.1 | Duyệt D03 v0.1 | Tham chiếu nguồn trên phiếu hoặc suy từ dòng, không tạo bảng quan hệ chung chép lại liên kết đã có | Quan hệ bổ sung chỉ theo nghiệp vụ cho phép, không đổi cardinality đã chốt | ĐÃ DUYỆT |
| D04 | 0.1 | Duyệt D04 v0.1 | Giữ đúng nguồn/dòng/phiên bản và lượng trên dòng xử lý hoặc bảng nghiệp vụ đã duyệt; kiểm trần, không chép thêm line_links | Giữ khả năng truy nguồn và lượng khi chuyển đổi | ĐÃ DUYỆT |
| D05 | 0.1 | Duyệt D05 v0.1 | Lưu quyết định theo đúng phiên bản/dòng/lượng, người và bằng chứng; giữ lịch sử và ngoại lệ quyền theo nghiệp vụ | Không tự chốt quyền H01/H35 còn mở | ĐÃ DUYỆT |
| D06 | 0.1 | Duyệt D06 v0.1 | JPG/PNG/WEBP/PDF tối đa 10 MB; gắn đúng nguồn, kiểm quyền theo nội dung và giữ bản bằng chứng đã dùng | Lưu trữ và quy trình triển khai kỹ thuật sẽ tổng hợp sau | ĐÃ DUYỆT |
| D07 | Chưa trình cấu trúc | chuưa ro do phần này người khác làm nghiệp vụ | Chưa chốt người/thời điểm xác minh đơn nguồn mới; giữ quyền Accountant với nguồn giao lịch sử H27 đã duyệt | Cần người phụ trách làm rõ; không tự chọn Sales/Accountant hoặc thêm chặn WIR/OD | CHƯA DUYỆT |
| G01 | 0.1 | Duyệt G01 v0.1 | Thông báo theo người/quyền nguồn, email trạng thái và cảnh báo tồn theo đợt; đọc không đồng nghĩa xử lý | Đã duyệt cấu trúc; chưa triển khai/gửi email | ĐÃ DUYỆT |
| G02 | 0.1 | Duyệt G02 v0.1 | Nhật ký hành động, người, thời gian, kết quả và thay đổi trước/sau theo quyền; giữ lịch sử và che thông tin không được xem | Đã duyệt cấu trúc; chưa triển khai | ĐÃ DUYỆT |
| G03 | 0.1 | Duyệt G03 v0.1 | Công việc sau lưu nguồn, thử lại có giới hạn và chống lặp nghiệp vụ | Đã duyệt cấu trúc; không bảo đảm SMTP luôn gửi đúng một lần | ĐÃ DUYỆT |
| G04 | 0.1 | Duyệt G04 v0.1 | Duyệt kết quả thao tác chống lặp, khóa nghiệp vụ, quyền xem và liên kết C03 theo phiếu 35 | Đã duyệt thiết kế; chưa triển khai | ĐÃ DUYỆT |
| G05 | 0.1 | Duyệt G05 v0.1 | Duyệt mốc phối hợp theo kho/sản phẩm, tính lại nhu cầu khi thao tác đồng thời | H01 vẫn mở; chưa triển khai | ĐÃ DUYỆT |
| G06 | 0.1 | Duyệt G06 v0.1 | Duyệt mốc nguồn giao/nhận chung để không dùng trùng lượng; không nhân đôi hạn mức E02 | D07/D08 và nguồn tạo collection cũ vẫn cần làm rõ; chưa triển khai | ĐÃ DUYỆT |
| H37 | 0.1 | Duyệt H37 v0.1 | Mỗi SO tối đa một hóa đơn cuối còn hiệu lực. Accountant phát hành khi mọi phần hàng đã có kết quả và lượng khách nhận dương. Giữ số/ngày từng phiếu xuất, lượng xuất/nhận và giá SO. Làm tròn từng dòng đến đồng, in lại từ bản đã phát hành | Chứng từ nguồn H15/H16 v0.1 đã duyệt | ĐÃ DUYỆT |


Phản hồi H28 cho bản v0.1: “chỉ lấy viên còn đúng yêu cầu được hoàn như kiểu còn nguyên vẹn,.. , còn hàng hỏng ko nhập lại hoặc nhập vào khu hỏng/huỷ”. [Bản v0.2 sau khi làm rõ](24_Duyet_khach_tra_hang_sau_khi_nhan.md).

Trước khi duyệt H18 và H19, người dùng yêu cầu mô tả rõ hồ sơ hàng lỗi và giải thích vì sao ví dụ chia 3 viên hủy, 7 viên trả nhà cung cấp khi có thể xử lý cả 10 viên theo một hướng. [Bản giải thích được duyệt](history/21_Duyet_hang_loi_phuong_an_va_phieu_huy_v0.1_bo_sung_giai_thich.md).

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

## Quyết định 01/11/2026 thay B03/B06

[Quyết định bỏ UOM](14_Bo_UOM_va_luu_quy_doi_tren_dong.md) là cấu trúc đơn vị/quy đổi hiện hành. Các đoạn trước về duyệt B03/B06 ghi diễn tiến lịch sử; không còn chỉ định tạo hai collection đó. Các trường thay thế đã đồng bộ trong phiếu sản phẩm, số dư, đóng gói và RR/PO.
