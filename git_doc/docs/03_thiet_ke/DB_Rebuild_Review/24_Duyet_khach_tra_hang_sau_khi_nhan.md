# H27, E01, H28 · Khách trả hàng sau khi đã nhận

**Cập nhật 06/11/2026:** Cách tách bảng trong phiếu dưới đây là lịch sử thiết kế. Người dùng đã duyệt [gộp 10 bảng](36_Gop_10_bang.md): ngưỡng, kiểm trả, xác nhận tiền/NCC và giao bù nhúng vào phiếu cha; bỏ chồng hàng, quy cách hiện tồn vào số dư. Quy tắc nghiệp vụ vẫn giữ; D07/D08 còn chờ.


**Đã duyệt H27 và E01 v0.1, H28 v0.2 · 01/11/2026.** [Bản H28 v0.2 được trình duyệt](history/24_Duyet_khach_tra_hang_sau_khi_nhan_v0.2_de_xuat.md). Nhóm này bắt đầu khi có căn cứ khách đã nhận hàng. Nếu khách từ chối ngay lúc giao, dùng [luồng H23–H24](22_Duyet_giao_that_bai_nhan_ve_va_giao_bu.md). [Bản trình v0.1](history/24_Duyet_khach_tra_hang_sau_khi_nhan_v0.1_de_xuat.md).

**Quyền H27 đã chốt theo UC-71 bản BE.** Sau khi Warehouse Staff kiểm, Sales Staff quyết định ca thường, kể cả yêu cầu mình lập. Store Owner quyết định ngoại lệ đủ căn cứ và phải khác người đề xuất. Đây là quyền mặc định cho thiết kế mới. [Report 3 trong docs_doan](../../01_bao_cao/WMSD_Report3_Fix.docx.txt) · [UC-71 trong bản BE được chọn](../../01_bao_cao/WMSD_Report3_Fix.docx.txt).

**Ví dụ cho cả ba bảng.** Khách đã ký nhận 20 viên, sau đó đề nghị trả 3 viên và mang cả 3 đến kho. Kho thấy 2 viên còn nguyên, chưa dùng và đủ căn cứ về thời hạn. Viên thứ ba đã thi công. Ví dụ dưới đây giả định Sales chấp nhận 2 viên đầu.

| Mốc | Ai thực hiện | Ghi nhận |
|---|---|---|
| H27 · Lập yêu cầu | Sales Staff | Ghi khách đề nghị trả 3 viên và dòng giao gốc có 20 viên đã nhận. |
| E01 · Kiểm tra | Warehouse Staff | Ghi kết quả riêng cho 2 viên đủ căn cứ xét và 1 viên đã thi công. Khi kho đang giữ cả 3 thì cả 3 vẫn thuộc khách. |
| H27 · Quyết định | Sales Staff trong ca thường | Chấp nhận 2, từ chối 1. Lưu lý do và kết quả kiểm đã dùng. |
| H28 · Nhập hàng khách trả | Warehouse Staff | Phiếu nhập ghi 2 viên đã được chấp nhận. Nếu khách mang viên đã thi công về ngay thì kho chỉ tiếp nhận 2 viên. Nếu kho đã nhận giữ hộ cả 3, chuyển quyền sở hữu cho 2 viên, theo dõi viên thứ ba đến lúc bàn giao lại. |

## H27 · customer_returns · Yêu cầu khách trả hàng

Một hồ sơ của một khách, gồm các dòng đề nghị trả. Mỗi dòng chỉ về đúng lượng khách đã nhận trên dòng H16 hoặc chứng từ lịch sử đã được Accountant xác minh. Phiếu xuất và mã sản phẩm giúp truy vết, còn hạn mức trả lấy theo lượng khách thực nhận. Bằng chứng giao cũ, hóa đơn H37 đã phát hành và giá tại lần bán vẫn tra cứu được. [Phiếu H15/H16/H37](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md).

| Trường đề xuất | Dùng để làm gì |
|---|---|
| `_id`, `returnNo`, `customerId`, `openedBy`, `openedAt`, `status`, `version` | Nhận diện yêu cầu, khách, người lập, trạng thái và phiên bản. |
| `items[]` | ID dòng, nguồn H16 hoặc nguồn lịch sử đã xác minh, sản phẩm/lô, lượng đề nghị, đơn vị nhập, hệ số và lượng gốc, lý do, bằng chứng, điều khoản áp dụng. Khi thiếu căn cứ nguồn, lưu hồ sơ chờ xác minh. |
| `decisions[]` | Dòng yêu cầu và phần lượng, ID lần kiểm E01, phiên bản, ca thường/ngoại lệ, lượng chấp nhận/từ chối, lý do, người quyết định và thời điểm. Giữ được lịch sử nếu phải quyết định lại. |

**Kiểm lượng.** Ví dụ khách đã nhận 20, cửa hàng đã nhập trả 3 và một yêu cầu khác còn giữ quyền trả 2 thì còn tối đa 15 viên cho yêu cầu mới. Kiểm cả các yêu cầu cùng lúc. Nguồn lịch sử đã xác minh được dùng một lần cho cùng lượng với chứng từ tương ứng nếu có. Cấu trúc [bảng theo dõi hạn mức E02](25_Duyet_han_muc_tra_va_hang_giu_ho.md) đã duyệt v0.1.

**Quyền đã duyệt.** Với hàng chưa dùng, đúng nguồn, đủ điều kiện và không tranh chấp, Sales Staff quyết định theo từng phần sau khi kho kiểm. Với ngoại lệ đủ căn cứ như lỗi nhà sản xuất đã xác minh, Store Owner khác người đề xuất quyết định. Thiếu căn cứ thì giữ chờ. Khi thay đổi lượng, kết quả kiểm hoặc loại trường hợp, phần bị ảnh hưởng cần quyết định mới trước khi nhập.

## E01 · return_inspections · Kết quả kiểm hàng khách trả

Warehouse Staff tại kho phụ trách ghi tình trạng hàng thực tế và căn cứ để xét trả. Một dòng H27 có thể được kiểm nhiều lần. Cùng một lần có thể tách kết quả cho từng phần lượng. Lưu được nội dung và người ghi của mỗi lần kiểm.

| Trường đề xuất | Dùng để làm gì |
|---|---|
| `_id`, `returnLineId`, `inspectionNo`, `returnVersion`, `warehouseId`, `inspectedBy`, `inspectedAt` | Liên kết dòng trả, lần kiểm, kho thực kiểm, người và thời gian. Số lần kiểm là duy nhất trong từng dòng trả. |
| `portions[]` | ID phần kiểm, lô, lượng gốc, bao bì, dấu hiệu sử dụng/thi công, tình trạng hàng, nguyên nhân hỏng, tình trạng thời hạn và tham chiếu thỏa thuận, kết quả xét điều kiện, lý do và bằng chứng. Khi đang giữ hộ, truy tới dòng giữ hộ tương ứng. |

Kết quả gồm *chờ xác minh*, *đủ căn cứ để xét* hoặc *không đủ điều kiện*. Bao bì rách hoặc nguyên thùng là thông tin để kiểm. Hàng đã thi công, hỏng do khách hoặc đã xác minh quá hạn thuộc diện từ chối. Chưa có căn cứ thời hạn thì để chờ. Mỗi lượng chỉ được tính một lần dù có kiểm lại. Quyết định ở H27 phải tham chiếu đúng phần kiểm và phiên bản còn hiệu lực. [Điều kiện trả theo BF-07 và khảo sát câu 18](../../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md).

## H28 · customer_return_receipts · Phiếu nhập hàng khách trả

**Đã duyệt v0.2.** Warehouse Staff lập H28 cho lượng đủ điều kiện trả, đã được chấp nhận trên H27 và cửa hàng thực nhận vào sở hữu. Mỗi phiếu thuộc một yêu cầu và một kho. Từng dòng gắn với kết quả kiểm E01, quyết định H27, số lượng và ô thực tế.

| Kết quả kiểm và quyết định | Ghi nhận trong kho |
|---|---|
| Hàng đạt điều kiện hoàn trả, chẳng hạn gạch còn nguyên, chưa sử dụng, đúng nguồn và còn hạn đã xác minh | Khi H27 chấp nhận, Warehouse Staff lập H28 theo đúng lượng thực nhận vào ô nhận hàng đạt để xếp kho. |
| Hàng đã thi công, hỏng do khách hoặc đã xác minh quá hạn | Từ chối trên H27. Nếu khách mang về ngay, kho không ghi nhập. Nếu kho thực sự đang giữ hàng, tiếp tục theo dõi dưới tên khách đến lúc bàn giao lại. |
| Hàng hỏng chưa rõ nguyên nhân hoặc chưa đủ căn cứ | Ghi chờ xác minh. Nếu nhận giữ tạm, ghi đúng lượng, vị trí và chủ hàng là khách. Phần này chưa đủ điều kiện lập H28. |
| Hàng lỗi nhà sản xuất đã xác minh, đủ điều kiện xét ngoại lệ | **Quy tắc đã duyệt.** Nếu Store Owner duyệt cửa hàng nhận lại vào sở hữu, H28 ghi riêng lượng lỗi vào ô cách ly/khu hỏng và loại khỏi lượng được bán. Nếu cửa hàng chỉ giữ hộ để làm việc với nhà cung cấp, ghi giữ hộ theo chủ hàng là khách. |

**Khu hỏng và việc hủy.** Đặt hàng vào khu hỏng chỉ cho biết hàng đang nằm ở đâu. Nếu cửa hàng đã nhận sở hữu phần lỗi, H18 theo dõi sự cố, H19 ghi phương án được duyệt và H20 mới ghi giảm số lượng khi thực hủy. Hàng còn thuộc khách tiếp tục được theo dõi theo chủ sở hữu. [H18–H20 đã duyệt](21_Duyet_hang_loi_phuong_an_va_phieu_huy.md).

| Trường đề xuất | Dùng để làm gì |
|---|---|
| `_id`, `receiptNo`, `returnId`, `warehouseId`, `receivedAt`, `postedBy`, `postedAt`, `status` | Mã phiếu, yêu cầu nguồn, kho, thời gian nhận thực tế, người và thời điểm xác nhận. |
| `items[]` | ID dòng, dòng H27, phần quyết định, phần kiểm E01, dòng giữ hộ nếu đã nhận tạm, sản phẩm/lô, đơn vị, hệ số và lượng gốc thực nhận. Ghi chất lượng, ô/chồng và bằng chứng theo từng phần. Với phương án nhận sở hữu hàng lỗi, dòng lỗi chỉ được vào ô cách ly của kho nhận. |
| `stockTransactionId`, `operationId`, `version` | Truy giao dịch tồn C03/C04 và chống nhập lại khi gửi lại cùng một xác nhận. |

Kiểm phần đã được duyệt còn lại, hàng thực có, kho được giao, khóa kiểm kê và sức chứa. Nếu 2 viên đã nằm trong ô và được ghi giữ hộ, đổi từ *2 viên của khách* sang *2 viên của cửa hàng* trong cùng giao dịch. Nếu đổi ô, cập nhật vị trí và sức chứa tương ứng. Số dư, quyền sở hữu, lượng đã dùng của quyết định và chứng từ phải cùng khớp. Phần từ chối tiếp tục thuộc khách đến lúc bàn giao lại. Tồn sở hữu chỉ tăng theo lượng H28 xác nhận. Phiếu này không tự mở nhu cầu giao bù hay chi hoàn tiền. Chứng từ tài chính liên quan đến trả hàng được xét riêng. [Tồn theo chủ sở hữu](09_Duyet_diem_ton_va_so_du.md) · [Lịch sử biến động](10_Duyet_giao_dich_va_lich_su_ton.md).

**Kết luận H28.** Với hàng chưa sử dụng, còn hạn và đã xác minh lỗi nhà sản xuất, Store Owner có thể duyệt cho cửa hàng nhận sở hữu. Warehouse Staff xác nhận H28 theo lượng thực nhận vào khu cách ly. Nếu toàn bộ lượng bị từ chối hoặc chỉ được giữ hộ thì không lập H28. [E02, H33 và H34 v0.1](25_Duyet_han_muc_tra_va_hang_giu_ho.md) đã duyệt riêng. [Danh mục](01_Danh_muc_duyet.md) · [Nhật ký](04_Nhat_ky_duyet.md).
