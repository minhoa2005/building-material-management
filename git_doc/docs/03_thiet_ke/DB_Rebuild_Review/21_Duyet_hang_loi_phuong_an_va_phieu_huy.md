# H18–H20 · Từ lúc phát hiện hàng lỗi đến khi thực hiện phương án xử lý

**Đã duyệt H18, H19 và H20 v0.1 · 01/11/2026.** Sau khi đọc ví dụ bổ sung, người dùng trả lời “Duyệt H18 v0.1” và “Duyệt H19 v0.1”. H20 v0.1 đã duyệt ở lượt trước. [Bản giải thích đã duyệt](history/21_Duyet_hang_loi_phuong_an_va_phieu_huy_v0.1_bo_sung_giai_thich.md) · [Bản trình ban đầu](history/21_Duyet_hang_loi_phuong_an_va_phieu_huy_v0.1_de_xuat.md) · [Quy trình BF02](../../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) · [Report 3](../../01_bao_cao/WMSD_Report3_Fix.docx.txt) · [Snapshot MongoDB](03_Cau_truc_DB_hien_tai.md).

| Hồ sơ | Câu hỏi khi tra cứu | Ví dụ với 10 viên gạch của shop bị nứt |
|---|---|---|
| H18 · Hồ sơ hàng lỗi | Phát hiện hàng gì, ở đâu, bao nhiêu và đã chặn sử dụng chưa? | Thủ kho ghi 10 viên đúng lô và chặn lấy hàng. Cả 10 viên còn ở kho. |
| H19 · Phương án xử lý | Ai duyệt cách xử lý nào, cho bao nhiêu viên? | Nếu nhà cung cấp (NCC) đồng ý nhận lại cả 10 viên, thủ kho đề xuất một dòng “Trả NCC · 10 viên”. Store Owner xét duyệt. |
| H20 · Phiếu hủy | Nếu được duyệt hủy thì đã hủy thực tế bao nhiêu và khi nào? | Chỉ lập khi có hàng thực hủy. Nếu cả 10 viên được xuất trả NCC thì cả 10 đi theo phiếu xuất trả. |

## H18 · defect_reports · Hồ sơ hàng lỗi

Một hồ sơ ghi một lần phát hiện tại một kho. Warehouse Staff của kho đó ghi hiện trạng khi nhận hàng, soạn hàng, kiểm kê, nhận hàng trả hoặc kiểm tra thường ngày. Mỗi dòng xác định chính xác phần hàng cần theo dõi. Khi phát hiện một sự cố đã được lập hồ sơ, các lần kiểm bổ sung được ghi tiếp vào hồ sơ hiện có.

**Một ví dụ từ lúc phát hiện đến lúc bàn giao xử lý.** Ô A-01 có 100 viên G60 lô L01 của shop, ban đầu đều đủ điều kiện xuất. Trong lúc soạn đơn, nhân viên phát hiện 10 viên nứt cạnh.

| Nhân viên làm gì? | H18 lưu hoặc liên kết thông tin gì? |
|---|---|
| Mở một hồ sơ tại kho phụ trách | Nguồn “phát hiện khi soạn hàng”, dòng phiếu soạn nếu có, người phát hiện và thời điểm. Mã hồ sơ giúp lần sau mở lại đúng sự cố. |
| Ghi một dòng hàng bị ảnh hưởng | G60, lô L01, ô A-01, hàng của shop, 10 viên, mô tả “nứt cạnh”, ảnh hoặc biên bản. Có thể ghi đúng dấu hiệu nhìn thấy dù chưa xác định được nguyên nhân. |
| Chặn 10 viên đang nghi lỗi | 100 viên vẫn hiện diện trong kho, nhưng chỉ 90 viên còn có thể xuất, giả sử không có ràng buộc khác. Nếu sau đó chuyển 10 viên sang ô cách ly thì ghi nhận việc chuyển vị trí bằng chứng từ liên kết. |
| Kiểm lại và chuyển sang bước xử lý | Bổ sung ai đã kiểm, khi nào, kết quả và ảnh vào hồ sơ ban đầu. H19 lấy đúng dòng 10 viên này làm căn cứ đề xuất hướng xử lý. |

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `reportNo`, `warehouseId`, `reportedBy`, `observedAt`, `recordedAt` | Mã duy nhất, kho phụ trách, người báo, lúc phát hiện thực tế và lúc ghi nhận. |
| `sourceType`, `sourceId`, `items[].sourceLineId` | Liên kết nguồn phát hiện và dòng nguồn, chẳng hạn phiếu nhận liên kho H10. Với kiểm tra thường ngày, ghi nguồn là kiểm tra tại kho và ghi vị trí quan sát. |
| `items[]` | ID dòng, sản phẩm, lô hoặc nhãn chờ xác minh, vị trí, nhóm tồn nếu đã có, chủ sở hữu tại thời điểm phát hiện, tình trạng ban đầu, lượng bị ảnh hưởng, đơn vị và hệ số theo dòng, mô tả lỗi, ảnh hoặc biên bản. |
| `inspections[]`, `status`, `version` | Ghi lần kiểm, người, thời điểm, kết quả và bằng chứng theo dòng. Theo dõi đang kiểm, chờ quyết định, đang xử lý hoặc đã đóng. Liên kết các phiếu chặn, di chuyển và xử lý theo ID dòng. |

**Tại lúc phát hiện.** Khóa sử dụng đúng phần hàng nghi lỗi ngay để kho khác hoặc đơn bán không lấy nhầm. Nếu lượng này đã được giữ cho đơn, lưu liên kết nhu cầu để tìm nguồn bù. Nếu đang kiểm kê thì ghi phát hiện và chặn phân bổ, còn di chuyển hoặc đổi chất lượng phải tuân khóa kiểm kê. Khi hàng thực tế được chuyển vào ô cách ly, dùng chứng từ di chuyển thích hợp. Mỗi lần đổi chất lượng, vị trí hoặc chủ sở hữu phải truy được chứng từ nguồn.

Ví dụ H10 đã ghi 2 viên vỡ vào ô cách ly ở kho đích. H18 dùng đúng dòng nhận đó làm căn cứ. Việc mở H18 giữ nguyên số dư 2 viên. Hàng giữ hộ khách/NCC tiếp tục theo dõi đúng chủ. Chỉ đóng hồ sơ khi từng phần đã có kết quả đối chiếu được. Phần chuyển sang quy trình trả hàng còn theo dõi liên kết tới kết quả thực hiện. [Điểm tồn và chủ sở hữu](09_Duyet_diem_ton_va_so_du.md) · [Giữ hàng thực tế](11_Duyet_giu_hang_va_nguon_cung.md).

## H19 · defect_resolution_plans · Phương án xử lý hàng lỗi

**Cập nhật theo H29 đã duyệt sau H19.** Nhánh trả NCC áp dụng BF-08 bản BE. Warehouse Staff lập H29, Accountant xác minh thỏa thuận theo từng nguồn/lượng rồi kho ghi xuất H30 hoặc bàn giao H34. H19 tiếp tục lưu phương án tại kho như hủy, đổi chất lượng hoặc giải phóng hàng theo quyền đã duyệt. Nếu có phương án trả NCC trước đó, giữ tham chiếu để đối chiếu lượng. [H29–H31 đã duyệt](26_Duyet_yeu_cau_xuat_tra_va_xac_nhan_nha_cung_cap.md) · [Bản H19 trước cập nhật](history/21_Duyet_hang_loi_phuong_an_va_phieu_huy_truoc_chot_BF08_2026-11-01.md).

Warehouse Staff đề xuất phương án cho một hồ sơ H18. Store Owner hoặc người được cấp đúng quyền xét duyệt từng hành động, dòng và lượng. Người xét duyệt phải khác người đề xuất. Một H18 có thể có nhiều phương án theo các phần hàng khác nhau hoặc phiên bản bổ sung.

**Cùng 10 viên nghi lỗi, có thể chọn một hướng cho cả 10.** Trong H19, mỗi dòng trả lời “làm gì, với bao nhiêu viên, vì sao?”. Chỉ cần tách dòng khi các phần hàng có hướng xử lý khác nhau. Ba trường hợp dưới đây là các lựa chọn độc lập cho cùng ví dụ.

| Kết quả kiểm tra và trao đổi thực tế | Cách ghi phương án theo luồng hiện hành | Khi đủ căn cứ thực hiện |
|---|---|---|
| NCC đồng ý nhận lại cả 10 viên | Một dòng **Trả NCC · 10 viên** chuyển sang H29 | Accountant xác minh thỏa thuận, kho ghi xuất trả khi bàn giao thực tế. |
| Cả 10 viên thuộc shop, kết quả kiểm cho thấy đều vỡ không dùng được và shop quyết định hủy | Một dòng **Hủy · 10 viên** | Lập H20 cho lượng thực hủy từng lần. Nếu hôm nay hủy 6 thì tồn chỉ giảm 6, còn 4 trong hạn mức hủy. |
| NCC chỉ nhận lại 7 viên lỗi sản xuất. Ba viên còn lại vỡ do bốc xếp tại kho, shop đề nghị hủy | Phần **Trả NCC · 7 viên** theo H29, phần **Hủy · 3 viên** theo H19 | Accountant xác minh phần trả 7, Store Owner duyệt phần hủy 3. Kho ghi H30/H20 theo lượng thực hiện. |

Nếu mới đủ căn cứ xử lý 7/10 viên, có thể chỉ đề xuất hoặc duyệt 7. Ba viên còn lại vẫn cách ly chờ quyết định. Mỗi viên chỉ được dành cho một hành động thực hiện tại một thời điểm. Việc NCC không nhận lại một phần hàng tự nó chưa quyết định rằng phần đó sẽ bị hủy.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `planNo`, `defectReportId`, `proposedBy`, `submittedAt`, `revision`, `previousPlanId` | Nhận diện phương án, hồ sơ nguồn và bản gửi xét. Giữ nguyên quyết định cũ khi cần lập bản thay thế. |
| `items[]` | ID dòng phương án và dòng H18, hành động đề nghị, lượng đề nghị theo đơn vị gốc, lý do và bằng chứng. Hành động gồm tiếp tục cách ly, giải phóng sau kiểm lại, đổi chất lượng, chuyển trả NCC hoặc hủy. |
| `items[].decision`, `approvedQtyBase`, `reviewedBy`, `reviewedAt`, `decisionReason` | Cho phép duyệt một phần, từ chối hoặc trả bổ sung. Lượng được phép thực hiện gắn với đúng hành động và phiên bản quyết định. |
| `status`, `version` | Theo dõi nháp, đã gửi, đã có kết quả xét và tiến độ thực hiện qua các chứng từ liên kết. |

**Hạn mức thực hiện.** Kiểm cả lượng chưa xử lý của dòng H18 và lượng đã được dành cho hành động ở các phương án còn hiệu lực. Một lượng đã dành để hủy chỉ có thể đổi sang trả NCC khi phần quyết định chưa thực hiện được thu hồi có lịch sử. Người thực hiện dùng đúng lượng đã duyệt còn lại. Phần bị trả về hoặc chưa duyệt tiếp tục bị chặn.

**Kết quả thực tế.** Chỉ chứng từ thực hiện mới thay đổi tồn. Đổi chất lượng ghi qua H26 và bảo toàn tổng vật lý. Chuyển sang trả NCC dùng thỏa thuận H29 đã được Accountant xác minh; các quyết định H19 có sẵn được giữ làm căn cứ đối chiếu. Tồn giảm khi thực xuất trả qua chứng từ tương ứng. Với hàng giữ hộ, chuyển sang luồng làm việc với chủ hàng. Cấu trúc các bảng liên quan duyệt riêng. [Danh mục H26 và nhóm trả NCC](01_Danh_muc_duyet.md).

## H20 · stock_scrap_records · Phiếu hủy hàng thực tế

Đề xuất mỗi phiếu ghi một lần Warehouse Staff thực hủy hàng thuộc shop tại một kho, theo một phương án H19 đã duyệt. Có thể hủy qua nhiều lần, mỗi lần có ngày và biên bản riêng. Kho chỉ ghi giảm đúng lượng thực đã hủy.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `scrapNo`, `warehouseId`, `planId`, `approvedRevision` | Mã phiếu duy nhất, kho và đúng phiên bản phương án cho phép hủy. |
| `items[]` | ID dòng, ID dòng quyết định H19, ID dòng lỗi H18, nhóm tồn hiện tại, sản phẩm, lô, ô/chồng hàng, đơn vị, hệ số và lượng thực hủy theo đơn vị gốc. |
| `destroyedBy`, `destroyedAt`, `evidenceRefs[]`, `note` | Người thực hiện, thời điểm thực tế, ảnh hoặc biên bản làm căn cứ ghi số lượng hủy. |
| `status`, `postedBy`, `postedAt`, `stockTransactionId`, `version` | Giữ nháp trước khi thực hiện. Khi xác nhận, lưu người ghi, giờ ghi và giao dịch tồn C03. Giữ chứng từ gốc nếu phải sửa sai bằng nghiệp vụ có quyền. |

**Khi xác nhận.** Kiểm kho được giao, quyền thực hiện, phiên bản phương án, quyền sở hữu của shop, khóa kiểm kê và số dư thực. Lượng hủy phải dương và nằm trong cả số dư nguồn và hạn mức hủy chưa dùng của quyết định. Ghi C03/C04, giảm C02 và lượng vật lý trong C08, đồng thời dùng hạn mức H19. Giữ đúng diện tích chồng còn chiếm chỗ theo C07 cho tới khi chồng/bao bì thực được dọn. Hai phiếu xác nhận cùng lúc cùng chịu trần chưa dùng. Nếu gửi lại cùng xác nhận, trả kết quả đã ghi. [Giao dịch và lịch sử tồn](10_Duyet_giao_dich_va_lich_su_ton.md) · [Chồng hàng và lượng thực tế](12_Duyet_chong_hang_va_dong_goi_thuc_te.md).

**Phạm vi duyệt.** H18 ghi nhận và chặn đúng lượng nghi lỗi. H19 cho phép duyệt một hành động cho toàn bộ lượng hoặc chia theo căn cứ thực tế. H20 ghi giảm tồn theo lượng thực hủy. Cả ba bảng đã duyệt riêng. [E06, H26 và H32 v0.1](27_Duyet_chan_hang_doi_chat_luong_va_chenh_lech.md) đã duyệt riêng. H29–H31 đã được duyệt. Chứng từ đính chính sẽ trình sau. [Nhật ký](04_Nhat_ky_duyet.md).
