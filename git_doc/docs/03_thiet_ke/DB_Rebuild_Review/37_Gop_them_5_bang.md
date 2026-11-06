# Gộp tiếp 5 bảng — 06/11/2026

Người dùng yêu cầu tiếp tục gộp các bảng vào bảng khác và xác nhận tiếp tục trên HieuDT hiện tại khi main có thay đổi trùng các file đang sửa. Bộ model reviewed giảm 63 xuống 58 collection. Nghiệp vụ và quyền giữ theo quyết định đã duyệt; thay đổi nơi lưu dữ liệu.

| Bảng cũ | Nơi lưu mới | Liên kết cần giữ |
|---|---|---|
| stock_movements | stock_transactions.movements[] | ID giao dịch, ID dòng nguồn, số dư nguồn/đích, lượng và số trước/sau; lineNo duy nhất trong một giao dịch. |
| stock_holds | defect_reports.holds[] | Dòng phát hiện lỗi, các số dư và lượng đang chặn, lịch sử mở chặn. |
| defect_resolution_plans | defect_reports.resolutionPlans[] | Các lần đề xuất, duyệt và kết quả theo từng dòng lỗi; ID phương án vẫn được phiếu hủy/trả/đổi chất lượng tham chiếu. |
| stocktake_resolution_plans | stocktakes.resolutionPlans[] | Các phiên bản phương án, kết quả đếm được chọn, quyết định và thực hiện. |
| delivery_confirmations | sales_orders.deliveryConfirmations[] | Từng lần khách nhận, thời gian, bằng chứng, dòng phiếu xuất; không mất phân biệt các đợt giao. |

Xác nhận khách nhận lưu dưới SO vì dữ liệu hiện có một biên bản tham chiếu nhiều phiếu xuất của cùng SO. Không nhân bản biên bản vào từng phiếu xuất. Cách tính hóa đơn theo lượng khách nhận vẫn giữ nguyên.

## Kiểm soát dữ liệu

- Giữ nguyên ID của phần nhúng; bộ kiểm liên kết truy phần nhúng thay vì populate model đã bỏ. Các trường sourceType/documentType của hồ sơ lịch sử vẫn giữ mã loại đã dùng.
- Index duy nhất, sparse trên ID phần nhúng ngăn trùng ID ở hai bảng cha. Validator ngăn trùng trong cùng mảng, kiểm đúng hồ sơ cha và lineNo của biến động tồn.
- Có index truy biến động theo số dư nguồn/đích và chặn hàng theo số dư/trạng thái. Cần kiểm các phần tử bằng cùng $elemMatch khi lọc nhiều điều kiện trên mảng.
- Lịch sử biến động tồn vẫn bất biến. Nghiệp vụ chặn/giải phóng và phương án vẫn dùng trạng thái/phiên bản, không được xem việc nhúng là quyền sửa lịch sử.
- Bộ chuyển dữ liệu dừng nếu không xác định được duy nhất hồ sơ cha. Chuyển lại dữ liệu đã gộp không nhân đôi các dòng. Dữ liệu nguồn không bị sửa.
- Preflight kiểm kích thước BSON trước ghi, chặn document vượt 16 MiB. Phạm vi kiểm kê quá lớn cần đánh giá dung lượng trước khi xác nhận; không tự chia giao dịch hoặc bỏ lịch sử.

## Các bảng còn giữ riêng

goods_inspections hiện dùng cho hàng mua đến, giao thất bại và giữ hộ; không gộp toàn bộ vào goods_arrivals. stocktake_snapshots và stocktake_counts có nhiều dòng/đợt đếm, cần truy vấn và cập nhật độc lập. stock_reservations, supply_allocations và return_quantity_claims tiếp tục giữ kiểm soát phân bổ số lượng. Các khóa đồng thời, nhật ký và hàng đợi vẫn giữ riêng. Không gộp hồ sơ nhập/xuất có thời điểm và ảnh hưởng tồn khác nhau chỉ để giảm số bảng.

## Dữ liệu mẫu và triển khai

Seed v4: localhost:27017/wmsd_demo_tile_shop_v4, 58 collection / 654 bản ghi cấp bảng; 82 hồ sơ nghiệp vụ tính cả phần nhúng, 74 dòng biến động tồn nằm trong 33 giao dịch. V3 63 bảng và các DB trước được giữ để đối chiếu. Không ghi DB nhóm.

Model, seed, converter, validator, từ điển và diagram đã theo cấu trúc 58 bảng. API legacy cần port riêng, gồm DTO, truy vấn mảng và kiểm giao dịch; ứng dụng chưa tự chuyển DB. D07/D08 về xác minh nguồn ngoài vẫn chờ.

Kiểm tra: 41 test DB/model; đọc lại dữ liệu local kiểm liên kết/tồn/sức chứa/hóa đơn; docs:check và cấu trúc XML diagram. Báo cáo local nằm trong git_doc/outputs. Không có commit/push hoặc merge main trong lượt này.
