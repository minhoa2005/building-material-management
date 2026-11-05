# H27, E01, H28 · Khách trả hàng sau khi đã nhận

**Bản trình v0.1 · 01/11/2026 · Chờ duyệt từng bảng.** Nhóm này bắt đầu khi có căn cứ khách đã nhận hàng. Nếu khách từ chối ngay lúc giao, hàng chưa được khách nhận thì theo [luồng H23–H24 đã duyệt](22_Duyet_giao_that_bai_nhan_ve_va_giao_bu.md).

**Điểm khác nhau giữa hai bản Report 3.** Bản trong thư mục `docs_doan` giao Store Owner quyết định sau kiểm. Bản trong `BE/git_doc` ở UC-71 và ma trận quyền giao Sales Staff quyết định ca thường, kể cả yêu cầu mình lập. Store Owner quyết định ngoại lệ đủ căn cứ và phải khác người đề xuất. H27 dưới đây đề xuất phương án trong `BE/git_doc`; người dùng chọn quyền khi duyệt. Các vai trò nêu dưới đây là phân công mặc định. [Report 3 trong docs_doan](../../01_bao_cao/WMSD_Report3_Fix.docx.txt) · [Report 3 trong BE](../../../../CODE/BE/building-material-management/git_doc/docs/01_bao_cao/WMSD_Report3_Fix.docx.txt).

**Ví dụ cho cả ba bảng.** Khách đã ký nhận 20 viên, sau đó đề nghị trả 3 viên và mang cả 3 đến kho. Kho thấy 2 viên còn nguyên, chưa dùng và đủ căn cứ về thời hạn. Viên thứ ba đã thi công. Ví dụ dưới đây giả định Sales chấp nhận 2 viên đầu.

| Mốc | Ai thực hiện | Ghi nhận |
|---|---|---|
| H27 · Lập yêu cầu | Sales Staff | Ghi khách đề nghị trả 3 viên và dòng giao gốc có 20 viên đã nhận. |
| E01 · Kiểm tra | Warehouse Staff | Ghi kết quả riêng cho 2 viên đủ căn cứ xét và 1 viên đã thi công. Khi kho đang giữ cả 3 thì cả 3 vẫn thuộc khách. |
| H27 · Quyết định | Sales Staff trong ca thường theo phương án đề xuất | Chấp nhận 2, từ chối 1. Lưu lý do và kết quả kiểm đã dùng. |
| H28 · Nhập hàng khách trả | Warehouse Staff | Chuyển 2 viên từ giữ hộ khách sang sở hữu cửa hàng. Trong kho vẫn có đúng 3 viên vật lý cho tới khi bàn giao lại 1 viên bị từ chối cho khách. |

## H27 · customer_returns · Yêu cầu khách trả hàng

Một hồ sơ của một khách, gồm các dòng đề nghị trả. Mỗi dòng chỉ về đúng lượng khách đã nhận trên dòng H16 hoặc chứng từ lịch sử đã được Accountant xác minh. Phiếu xuất và mã sản phẩm giúp truy vết, còn hạn mức trả lấy theo lượng khách thực nhận. Bằng chứng giao cũ, hóa đơn H37 đã phát hành và giá tại lần bán vẫn tra cứu được. [Phiếu H15/H16/H37](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md).

| Trường đề xuất | Dùng để làm gì |
|---|---|
| `_id`, `returnNo`, `customerId`, `openedBy`, `openedAt`, `status`, `version` | Nhận diện yêu cầu, khách, người lập, trạng thái và phiên bản. |
| `items[]` | ID dòng, nguồn H16 hoặc nguồn lịch sử đã xác minh, sản phẩm/lô, lượng đề nghị, đơn vị nhập, hệ số và lượng gốc, lý do, bằng chứng, điều khoản áp dụng. Khi thiếu căn cứ nguồn, lưu hồ sơ chờ xác minh. |
| `decisions[]` | Dòng yêu cầu và phần lượng, ID lần kiểm E01, phiên bản, ca thường/ngoại lệ, lượng chấp nhận/từ chối, lý do, người quyết định và thời điểm. Giữ được lịch sử nếu phải quyết định lại. |

**Kiểm lượng.** Ví dụ khách đã nhận 20, cửa hàng đã nhập trả 3 và một yêu cầu khác còn giữ quyền trả 2 thì còn tối đa 15 viên cho yêu cầu mới. Kiểm cả các yêu cầu cùng lúc. Nguồn lịch sử đã xác minh được dùng một lần cho cùng lượng với chứng từ tương ứng nếu có. Cấu trúc bảng theo dõi hạn mức E02 sẽ duyệt riêng.

**Quyền đề xuất.** Với hàng chưa dùng, đúng nguồn, đủ điều kiện và không tranh chấp, Sales Staff quyết định theo từng phần sau khi kho kiểm. Với ngoại lệ đủ căn cứ như nghi lỗi nhà sản xuất đã được xác minh nguyên nhân, Store Owner khác người đề xuất quyết định. Thiếu căn cứ thì giữ chờ. Khi thay đổi lượng, kết quả kiểm hoặc loại trường hợp, phần bị ảnh hưởng cần quyết định mới trước khi nhập.

## E01 · return_inspections · Kết quả kiểm hàng khách trả

Warehouse Staff tại kho phụ trách ghi tình trạng hàng thực tế và căn cứ để xét trả. Một dòng H27 có thể được kiểm nhiều lần. Cùng một lần có thể tách kết quả cho từng phần lượng. Lưu được nội dung và người ghi của mỗi lần kiểm.

| Trường đề xuất | Dùng để làm gì |
|---|---|
| `_id`, `returnLineId`, `inspectionNo`, `returnVersion`, `warehouseId`, `inspectedBy`, `inspectedAt` | Liên kết dòng trả, lần kiểm, kho thực kiểm, người và thời gian. Số lần kiểm là duy nhất trong từng dòng trả. |
| `portions[]` | ID phần kiểm, lô, lượng gốc, bao bì, dấu hiệu sử dụng/thi công, tình trạng hàng, nguyên nhân hỏng, tình trạng thời hạn và tham chiếu thỏa thuận, kết quả xét điều kiện, lý do và bằng chứng. Khi đang giữ hộ, truy tới dòng giữ hộ tương ứng. |

Kết quả gồm *chờ xác minh*, *đủ căn cứ để xét* hoặc *không đủ điều kiện*. Bao bì rách hoặc nguyên thùng là thông tin để kiểm. Hàng đã thi công, hỏng do khách hoặc đã xác minh quá hạn thuộc diện từ chối. Chưa có căn cứ thời hạn thì để chờ. Mỗi lượng chỉ được tính một lần dù có kiểm lại. Quyết định ở H27 phải tham chiếu đúng phần kiểm và phiên bản còn hiệu lực. [Điều kiện trả theo BF-07 và khảo sát câu 18](../../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md).

## H28 · customer_return_receipts · Phiếu nhập hàng khách trả

Warehouse Staff xác nhận theo phần đã chấp nhận ở H27, còn hiệu lực và thực có ở kho. Mỗi phiếu thuộc một yêu cầu, một kho nhận. Mỗi dòng ghi lượng dương, nguồn, chất lượng và ô chứa. Nếu đã ghi hàng giữ hộ, phiếu chuyển chủ cho đúng lượng đó. Hàng đạt vào ô nhận để xếp, hàng lỗi được chấp nhận vào khu cách ly.

| Trường đề xuất | Dùng để làm gì |
|---|---|
| `_id`, `receiptNo`, `returnId`, `warehouseId`, `receivedAt`, `postedBy`, `postedAt`, `status` | Mã phiếu, yêu cầu nguồn, kho, thời gian nhận thực tế, người và thời điểm xác nhận. |
| `items[]` | ID dòng, dòng H27, phần quyết định, phần kiểm E01, dòng giữ hộ nếu đã nhận tạm, sản phẩm/lô, đơn vị và quy đổi trên dòng, lượng gốc thực nhận, chất lượng, ô/chồng và bằng chứng. |
| `stockTransactionId`, `operationId`, `version` | Truy giao dịch tồn C03/C04 và chống nhập lại khi gửi lại cùng một xác nhận. |

Kiểm phần đã được duyệt còn lại, hàng thực có, kho được giao, khóa kiểm kê và sức chứa. Nếu 2 viên đã nằm trong ô và được ghi giữ hộ, đổi từ *2 viên của khách* sang *2 viên của cửa hàng* trong cùng giao dịch. Nếu đổi ô, cập nhật vị trí và sức chứa tương ứng. Số dư, quyền sở hữu, lượng đã dùng của quyết định và chứng từ phải cùng khớp. Phần từ chối tiếp tục thuộc khách đến lúc bàn giao lại. Tồn sở hữu chỉ tăng theo lượng H28 xác nhận. Phiếu này không tự mở nhu cầu giao bù hay chi hoàn tiền. Chứng từ tài chính liên quan đến trả hàng được xét riêng. [Tồn theo chủ sở hữu](09_Duyet_diem_ton_va_so_du.md) · [Lịch sử biến động](10_Duyet_giao_dich_va_lich_su_ton.md).

Bảng E02 về hạn mức và các chứng từ giữ hộ, bàn giao lại H33/H34 sẽ được trình riêng. [Danh mục](01_Danh_muc_duyet.md) · [Nhật ký](04_Nhat_ky_duyet.md).
