# E06, H26 và H32 · Chặn sử dụng, đổi chất lượng và theo dõi chênh lệch

**E06, H26 và H32 đã duyệt riêng v0.1 · 01/11/2026.** [Bản trình đã duyệt](history/27_Duyet_chan_hang_doi_chat_luong_va_chenh_lech_v0.1_de_xuat.md). Các thiết kế này dùng lại hồ sơ hàng lỗi H18, phương án H19, số dư C02 và lịch sử C03/C04 đã duyệt. Quyền nêu trong phiếu là quyền mặc định. [H18–H20](21_Duyet_hang_loi_phuong_an_va_phieu_huy.md) · [C02](09_Duyet_diem_ton_va_so_du.md) · [C03/C04](10_Duyet_giao_dich_va_lich_su_ton.md).

## E06 · stock_holds · Chặn sử dụng phần hàng có vấn đề

Khi Warehouse Staff phát hiện 10 viên nghi nứt trong 100 viên, phần mềm ghi chặn đúng 10 viên thuộc lô, chủ hàng và vị trí đó ngay cùng hồ sơ H18. Cả 100 viên vẫn nằm trong kho. Phần còn lại được kiểm khả dụng theo các điều kiện khác như hàng đã giữ cho đơn, trạng thái chất lượng và vị trí.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `defectReportLineId`, `stocktakeId`, `recordedBy`, `recordedAt`, `reason`, `evidenceIds` | Dòng phát hiện H18, kỳ kiểm kê nếu có, người ghi, thời điểm và căn cứ. |
| `allocations[]` | ID phần chặn, nhóm tồn C02, dòng hàng trong chồng C08 nếu xác định được, lô/chủ/vị trí và số lượng gốc bị chặn. Giữ tham chiếu tới nguồn ban đầu khi hàng được chuyển bằng nghiệp vụ hợp lệ. |
| `events[]`, `status`, `version` | Lịch sử xử lý theo phần lượng, kết quả kiểm lại, quyết định liên quan và chứng từ thực hiện. Theo dõi lượng còn chặn, đã giải phóng hoặc đã được xử lý. |

**Tác dụng của E06.** Ngăn lấy lượng nghi lỗi để bán hoặc chuyển phục vụ đơn bình thường. Nếu lượng đó đã được giữ cho đơn, phải đánh dấu phần nguồn bị ảnh hưởng và tìm nguồn thay thế. Các lần báo về cùng phần hàng tham chiếu chung phần chặn để tránh tính trùng. Khi lượng này đã chuyển sang chất lượng DAMAGED hoặc BLOCKED, tính lượng bị loại khỏi khả dụng một lần.

**Căn cứ mở chặn.** Ngoài kỳ kiểm kê, Warehouse Staff thực hiện giải phóng sau kiểm lại theo phương án H19 còn hiệu lực đã được Store Owner duyệt. Với thực xuất trả NCC, hủy hoặc đổi chất lượng, cập nhật phần chặn cùng chứng từ thực hiện đúng quyền. Chặn còn hiệu lực khác vẫn phải được xét. Kết quả kiểm lại, ngày hết hạn hoặc việc đóng tên hồ sơ tự nó chưa đủ làm hàng được bán.

**Giữ nhất quán với C02.** Tạo E06 chỉ ghi hạn chế sử dụng và bằng chứng. Khi cần chuyển một phần số dư sang BLOCKED hoặc trạng thái chất lượng khác, H26 ghi biến động giữa hai nhóm tồn và giữ trạng thái trước đó. Khi một lệnh được phép chuyển hàng cách ly, phần chặn đi theo đúng lượng sang vị trí mới. Trong phạm vi đang khóa kiểm kê, vẫn ghi phát hiện và chặn sử dụng, còn việc đổi chất lượng/vị trí theo luồng chốt kiểm kê sẽ duyệt ở nhóm riêng. [Quy tắc hiện có về chặn hàng và kiểm kê](../../../../context.md).

## H26 · stock_quality_changes · Phiếu đổi trạng thái chất lượng

Ví dụ kho ghi 100 viên GOOD và đã chặn 10 viên nghi lỗi. Sau khi kiểm và được duyệt xử lý, Warehouse Staff xác nhận đổi 10 viên sang DAMAGED. Kết quả là 90 GOOD và 10 DAMAGED, tổng vẫn 100.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `changeNo`, `warehouseId`, `createdBy`, `createdAt`, `status`, `version` | Phiếu tại một kho, người lập, trạng thái nháp hoặc đã ghi nhận. |
| `items[]` | ID dòng, nhóm tồn nguồn và đích, trạng thái trước/sau, lô, chủ, điểm tồn, lượng gốc và hệ số nếu nhập bằng đơn vị khác. Hai đầu có cùng vị trí, lô và chủ, khác chất lượng. Liên kết dòng H18, E06, phần quyết định H19 và bằng chứng kiểm. |
| `postedBy`, `postedAt`, `stockTransactionId`, `operationId` | Người, thời điểm thực ghi và giao dịch C03/C04 để kiểm lại từng biến động. |

Đề xuất ngoài khóa kiểm kê, Warehouse Staff xác nhận H26 theo phần hành động/phiên bản H19 được duyệt, trong lượng thực còn. Chuyển trạng thái phải đồng thời trừ nhóm nguồn và cộng nhóm đích cùng lượng, cập nhật phần hàng trong chồng và liên kết giữ/chặn tương ứng. Gửi lại cùng xác nhận trả về kết quả cũ. Đưa hàng trở lại GOOD vẫn cần đúng kết quả kiểm và quyết định giải phóng, cùng kiểm vị trí và các ràng buộc khác trước khi cấp hàng cho đơn.

Việc hàng đi sang ô khác dùng chứng từ di chuyển riêng theo H06. Phiếu đổi chất lượng ghi trạng thái ở vị trí thực tế của hàng tại lúc xác nhận. Với kiểm kê đang khóa, phần đổi chất lượng cần gắn phương án và lần chốt kiểm kê hợp lệ. Cấu trúc và người thực hiện lần chốt đó sẽ trình riêng, trước khi áp dụng.

## H32 · stock_discrepancies · Hồ sơ theo dõi chênh lệch

Đề xuất một bảng dùng chung để liên kết điều gì chưa khớp với chứng từ nguồn và kết quả xử lý. Mỗi hồ sơ thuộc một nghiệp vụ, các dòng giữ nguyên số liệu đã quan sát tại lần đối chiếu. Lần cập nhật sau giữ được lịch sử.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `discrepancyNo`, `sourceKind`, `sourceDocumentId`, `warehouseId`, `reportedBy`, `reportedAt`, `status`, `version` | Nguồn mua, điều chuyển, giao/nhận hoặc trả NCC, người phát hiện, kho liên quan và tiến độ xử lý. |
| `items[]` | ID dòng, dòng nguồn, loại sai lệch, sản phẩm/lô dự kiến và thực thấy, lượng kỳ vọng tại lần đối chiếu, lượng thực đếm, đơn vị, quy đổi, tình trạng, nguyên nhân ban đầu và bằng chứng. Loại sai lệch gồm thiếu, thừa, sai sản phẩm, sai lô và hư hỏng. |
| `resolutionEvents[]` | Phần lượng đã làm rõ, dòng chứng từ xử lý, bằng chứng, người ghi, thời điểm và kết quả. Cập nhật hoặc sửa sai tham chiếu bản trước để giữ số liệu gốc. |

**Ví dụ chuyển kho.** Phiếu xuất 60 viên, kho đích nhận 58 đạt và 2 vỡ. H10 ghi đủ 60 đã đến, gồm 58 đạt và 2 vào khu lỗi. H32 liên kết phần 2 viên hỏng với H18. Nếu chuyến chỉ đến 58 viên tổng cộng và xác nhận thiếu 2, H32 ghi thiếu 2, lượng đang chuyển còn được theo dõi cho tới khi có chứng từ làm rõ. Nếu lịch hẹn còn một đợt giao 2 viên thì theo dõi phần chưa đến, chỉ mở chênh lệch khi có sự việc chưa khớp cần xử lý. [Phiếu chuyển kho](17_Duyet_phieu_xuat_nhan_va_ban_giao_chuyen_kho.md).

**Quyền và kết thúc.** Warehouse Staff ghi phát hiện và kết quả nhận/xuất thuộc kho phụ trách. Accountant ghi đối chiếu NCC theo H31. Phương án đổi chất lượng, hủy hoặc sửa số lượng vẫn theo chứng từ và quyền của nghiệp vụ nguồn. Khi mọi phần sai lệch có kết quả được kiểm chứng và các chứng từ liên quan đã có hiệu lực, hồ sơ được đánh dấu đã xử lý. H32 chỉ liên kết và theo dõi, lượng tồn thay đổi qua chứng từ thực hiện. Các bảng chốt kiểm kê, điều chỉnh và đảo giao dịch sẽ duyệt riêng. [Trả NCC đã duyệt](26_Duyet_yeu_cau_xuat_tra_va_xac_nhan_nha_cung_cap.md) · [Khảo sát DB](03_Cau_truc_DB_hien_tai.md) · [Danh mục](01_Danh_muc_duyet.md) · [Nhật ký](04_Nhat_ky_duyet.md).
