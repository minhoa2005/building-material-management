# H18–H20 · Từ lúc phát hiện hàng lỗi đến khi thực hiện phương án xử lý

**Bản trình v0.1 · 01/11/2026 · Chờ duyệt riêng H18, H19 và H20.** Phiếu bám quy trình BF02, UC-65 đến UC-67 và các quyết định đã duyệt về tồn, giữ hàng và quyền theo kho. [Quy trình BF02](../../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) · [Report 3](../../01_bao_cao/WMSD_Report3_Fix.docx.txt) · [Snapshot MongoDB](03_Cau_truc_DB_hien_tai.md).

| Hồ sơ | Câu hỏi khi tra cứu | Ví dụ với 10 viên gạch của shop bị nứt |
|---|---|---|
| H18 · Hồ sơ hàng lỗi | Phát hiện hàng gì, ở đâu, bao nhiêu và đã chặn sử dụng chưa? | Thủ kho ghi 10 viên đúng lô và chặn lấy hàng. Cả 10 viên còn ở kho. |
| H19 · Phương án xử lý | Ai duyệt hành động nào cho phần hàng nào? | Store Owner duyệt hủy 3 viên và chuyển 7 viên sang quy trình trả nhà cung cấp. Tổng vật lý vẫn là 10. |
| H20 · Phiếu hủy | Đã hủy thực tế bao nhiêu, ngày nào và theo quyết định nào? | Thủ kho thực hủy 2 viên và ghi biên bản. Kho còn 8 viên của nhóm này: 1 viên còn được phép hủy và 7 viên chờ xuất trả. |

## H18 · defect_reports · Hồ sơ hàng lỗi

Một hồ sơ ghi một lần phát hiện tại một kho. Warehouse Staff của kho đó ghi hiện trạng khi nhận hàng, soạn hàng, kiểm kê, nhận hàng trả hoặc kiểm tra thường ngày. Mỗi dòng xác định chính xác phần hàng cần theo dõi. Khi phát hiện một sự cố đã được lập hồ sơ, các lần kiểm bổ sung được ghi tiếp vào hồ sơ hiện có.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `reportNo`, `warehouseId`, `reportedBy`, `observedAt`, `recordedAt` | Mã duy nhất, kho phụ trách, người báo, lúc phát hiện thực tế và lúc ghi nhận. |
| `sourceType`, `sourceId`, `items[].sourceLineId` | Liên kết nguồn phát hiện và dòng nguồn, chẳng hạn phiếu nhận liên kho H10. Với kiểm tra thường ngày, ghi nguồn là kiểm tra tại kho và ghi vị trí quan sát. |
| `items[]` | ID dòng, sản phẩm, lô hoặc nhãn chờ xác minh, vị trí, nhóm tồn nếu đã có, chủ sở hữu tại thời điểm phát hiện, tình trạng ban đầu, lượng bị ảnh hưởng, đơn vị và hệ số theo dòng, mô tả lỗi, ảnh hoặc biên bản. |
| `inspections[]`, `status`, `version` | Ghi lần kiểm, người, thời điểm, kết quả và bằng chứng theo dòng. Theo dõi đang kiểm, chờ quyết định, đang xử lý hoặc đã đóng. Liên kết các phiếu chặn, di chuyển và xử lý theo ID dòng. |

**Tại lúc phát hiện.** Khóa sử dụng đúng phần hàng nghi lỗi ngay để kho khác hoặc đơn bán không lấy nhầm. Nếu lượng này đã được giữ cho đơn, lưu liên kết nhu cầu để tìm nguồn bù. Nếu đang kiểm kê thì ghi phát hiện và chặn phân bổ, còn di chuyển hoặc đổi chất lượng phải tuân khóa kiểm kê. Khi hàng thực tế được chuyển vào ô cách ly, dùng chứng từ di chuyển thích hợp. Mỗi lần đổi chất lượng, vị trí hoặc chủ sở hữu phải truy được chứng từ nguồn.

Ví dụ H10 đã ghi 2 viên vỡ vào ô cách ly ở kho đích. H18 dùng đúng dòng nhận đó làm căn cứ. Việc mở H18 giữ nguyên số dư 2 viên. Hàng giữ hộ khách/NCC tiếp tục theo dõi đúng chủ. Chỉ đóng hồ sơ khi từng phần đã có kết quả đối chiếu được. Phần chuyển sang quy trình trả hàng còn theo dõi liên kết tới kết quả thực hiện. [Điểm tồn và chủ sở hữu](09_Duyet_diem_ton_va_so_du.md) · [Giữ hàng thực tế](11_Duyet_giu_hang_va_nguon_cung.md).

## H19 · defect_resolution_plans · Phương án xử lý hàng lỗi

Warehouse Staff đề xuất phương án cho một hồ sơ H18. Store Owner hoặc người được cấp đúng quyền xét duyệt từng hành động, dòng và lượng. Người xét duyệt phải khác người đề xuất. Một H18 có thể có nhiều phương án theo các phần hàng khác nhau hoặc phiên bản bổ sung.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `planNo`, `defectReportId`, `proposedBy`, `submittedAt`, `revision`, `previousPlanId` | Nhận diện phương án, hồ sơ nguồn và bản gửi xét. Giữ nguyên quyết định cũ khi cần lập bản thay thế. |
| `items[]` | ID dòng phương án và dòng H18, hành động đề nghị, lượng đề nghị theo đơn vị gốc, lý do và bằng chứng. Hành động gồm tiếp tục cách ly, giải phóng sau kiểm lại, đổi chất lượng, chuyển trả NCC hoặc hủy. |
| `items[].decision`, `approvedQtyBase`, `reviewedBy`, `reviewedAt`, `decisionReason` | Cho phép duyệt một phần, từ chối hoặc trả bổ sung. Lượng được phép thực hiện gắn với đúng hành động và phiên bản quyết định. |
| `status`, `version` | Theo dõi nháp, đã gửi, đã có kết quả xét và tiến độ thực hiện qua các chứng từ liên kết. |

**Hạn mức thực hiện.** Kiểm cả lượng chưa xử lý của dòng H18 và lượng đã được dành cho hành động ở các phương án còn hiệu lực. Một lượng đã dành để hủy chỉ có thể đổi sang trả NCC khi phần quyết định chưa thực hiện được thu hồi có lịch sử. Người thực hiện dùng đúng lượng đã duyệt còn lại. Phần bị trả về hoặc chưa duyệt tiếp tục bị chặn.

**Kết quả thực tế.** Chỉ chứng từ thực hiện mới thay đổi tồn. Đổi chất lượng ghi qua H26 và bảo toàn tổng vật lý. Chuyển hồ sơ sang trả NCC dùng lại căn cứ duyệt còn hiệu lực cho đúng phần hàng. Tồn giảm khi thực xuất trả qua chứng từ tương ứng. Với hàng giữ hộ, chuyển sang luồng làm việc với chủ hàng. Cấu trúc các bảng liên quan duyệt riêng. [Danh mục H26 và nhóm trả NCC](01_Danh_muc_duyet.md).

## H20 · stock_scrap_records · Phiếu hủy hàng thực tế

Đề xuất mỗi phiếu ghi một lần Warehouse Staff thực hủy hàng thuộc shop tại một kho, theo một phương án H19 đã duyệt. Có thể hủy qua nhiều lần, mỗi lần có ngày và biên bản riêng. Kho chỉ ghi giảm đúng lượng thực đã hủy.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `scrapNo`, `warehouseId`, `planId`, `approvedRevision` | Mã phiếu duy nhất, kho và đúng phiên bản phương án cho phép hủy. |
| `items[]` | ID dòng, ID dòng quyết định H19, ID dòng lỗi H18, nhóm tồn hiện tại, sản phẩm, lô, ô/chồng hàng, đơn vị, hệ số và lượng thực hủy theo đơn vị gốc. |
| `destroyedBy`, `destroyedAt`, `evidenceRefs[]`, `note` | Người thực hiện, thời điểm thực tế, ảnh hoặc biên bản làm căn cứ ghi số lượng hủy. |
| `status`, `postedBy`, `postedAt`, `stockTransactionId`, `version` | Giữ nháp trước khi thực hiện. Khi xác nhận, lưu người ghi, giờ ghi và giao dịch tồn C03. Giữ chứng từ gốc nếu phải sửa sai bằng nghiệp vụ có quyền. |

**Khi xác nhận.** Kiểm kho được giao, quyền thực hiện, phiên bản phương án, quyền sở hữu của shop, khóa kiểm kê và số dư thực. Lượng hủy phải dương và nằm trong cả số dư nguồn và hạn mức hủy chưa dùng của quyết định. Ghi C03/C04, giảm C02 và lượng vật lý trong C08, đồng thời dùng hạn mức H19. Giữ đúng diện tích chồng còn chiếm chỗ theo C07 cho tới khi chồng/bao bì thực được dọn. Hai phiếu xác nhận cùng lúc cùng chịu trần chưa dùng. Nếu gửi lại cùng xác nhận, trả kết quả đã ghi. [Giao dịch và lịch sử tồn](10_Duyet_giao_dich_va_lich_su_ton.md) · [Chồng hàng và lượng thực tế](12_Duyet_chong_hang_va_dong_goi_thuc_te.md).

**Phạm vi duyệt.** H18, H19, H20 là ba mục độc lập. Bảng chặn sử dụng E06, đổi chất lượng H26, trả NCC và chứng từ đính chính còn có lượt duyệt riêng. [Nhật ký](04_Nhat_ky_duyet.md).
