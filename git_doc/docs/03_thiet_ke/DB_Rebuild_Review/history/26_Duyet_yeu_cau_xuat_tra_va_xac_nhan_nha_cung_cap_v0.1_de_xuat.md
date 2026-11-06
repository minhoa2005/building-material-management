# H29, H30 và H31 · Trả hàng nhà cung cấp

**Bản trình v0.1 · 01/11/2026 · Chờ duyệt riêng từng bảng.** Trong hồ sơ này, “đồng ý nhận lại” là thỏa thuận trước khi xe chở hàng đi. “Đã nhận” là kết quả nhà cung cấp (NCC) xác nhận sau khi giao. Hai mốc có thể có số lượng, ngày và bằng chứng khác nhau.

**Điểm xin chốt về quyền.** Report 3 trong `docs_doan` có thêm bước Store Owner duyệt nội bộ. BF-08 trong bản BE giao Warehouse Staff lập yêu cầu và xác nhận thực xuất, Accountant xác minh thỏa thuận rồi đối chiếu và đóng phần kho. Bản BE bỏ bước Store Owner duyệt xuất trả. Đề xuất dùng cách thứ hai, phù hợp ghi chú khảo sát của cửa hàng về việc kế toán hai bên thống nhất trước khi thủ kho giao hàng trả. Quyền Store Owner duyệt nhận lại hàng khách ở H28 là một quyết định riêng. [Report 3 trong docs_doan](../../01_bao_cao/WMSD_Report3_Fix.docx.txt) · [Report 3 trong BE, BF-08 và UC-81/82/83/107](../../../../CODE/BE/building-material-management/git_doc/docs/01_bao_cao/WMSD_Report3_Fix.docx.txt).

| Ví dụ cho một lô gạch đã nhập vào sở hữu cửa hàng | Ghi vào đâu | Tác động lên tồn của cửa hàng |
|---|---|---|
| Kho đề nghị trả 10 viên. NCC mới đồng ý nhận lại 8. | H29 ghi 10 đề nghị, Accountant xác minh 8 được chấp thuận. 2 viên còn lại chờ kết quả. | Ghi lượng dành cho hồ sơ hoặc tiếp tục chặn hàng lỗi. Cả 10 viên vẫn ở kho. |
| Kho thực giao cho xe đủ 8 viên. | Warehouse Staff xác nhận H30 theo đúng dòng thỏa thuận. | Ghi xuất 8 viên một lần. |
| NCC xác nhận đã nhận 7, chưa tìm thấy 1. | Accountant ghi 7 trên H31, đối chiếu 1 viên còn thiếu với chứng từ và bằng chứng vận chuyển. | Lịch sử vẫn thể hiện kho xuất 8. Hồ sơ còn 2 viên chưa thống nhất và 1 viên đã xuất đang đối chiếu. |

## H29 · supplier_returns · Yêu cầu và thỏa thuận trả hàng

Đề xuất một yêu cầu cho một NCC và một kho xuất. Warehouse Staff ghi hàng đề nghị trả. Accountant lưu kết quả liên hệ và xác minh đúng NCC, nguồn mua hoặc giữ hộ, từng dòng hàng, số lượng và bằng chứng. Dòng đủ căn cứ có thể xuất trước, trong phần đã được NCC đồng ý.

| Trường đề xuất | Nội dung |
|---|---|
| `_id`, `returnNo`, `supplierId`, `warehouseId`, `createdBy`, `createdAt`, `status`, `version` | Mã yêu cầu, NCC, kho, người lập và trạng thái theo tiến độ thực hiện. |
| `items[]` | ID dòng, nguồn mua/nhận và dòng PO liên quan hoặc dòng H33 của NCC, chủ sở hữu, sản phẩm/lô, ô thực tế, lượng đề nghị, đơn vị và hệ số trên dòng, lý do và bằng chứng. Nếu đã có hồ sơ lỗi H18/H19 thì liên kết để theo dõi cùng lượng. |
| `agreements[]` | Mỗi lần NCC phản hồi ghi ngày, người liên hệ phía NCC, bằng chứng, lịch và cách giao. Từng dòng ghi lượng có thỏa thuận, bị từ chối hoặc còn chờ; lưu phiên bản, Accountant xác minh và thời điểm. |
| `closure` | Accountant, ngày đóng, lý do và tham chiếu kết quả đối chiếu H31 hoặc kết quả phần chưa thực hiện. |

Lượng đủ điều kiện xuất bị giới hạn bởi lượng NCC đã đồng ý còn lại, đúng lô/chủ và lượng thực còn. Khi thỏa thuận đổi, giữ lịch sử và chỉ điều chỉnh phần chưa thực hiện. Với hàng lỗi, tiếp tục chặn sử dụng. Với hàng đạt, dành lượng cho hồ sơ để tránh xuất sang việc khác. Việc NCC từ chối nhận lại chưa giải phóng hàng lỗi để bán. [Hồ sơ hàng lỗi H18–H20](21_Duyet_hang_loi_phuong_an_va_phieu_huy.md).

## H30 · supplier_return_issues · Phiếu xuất trả hàng thuộc cửa hàng

Đề xuất Warehouse Staff lập và xác nhận từng lần thực bàn giao. Một H29 có thể được xuất nhiều lần trong lượng đã thỏa thuận. Với lượng còn thuộc NCC, dùng H34 theo đúng dòng H33 và liên kết về H29. Mỗi phần hàng chỉ xuất hiện trên một chứng từ ghi giảm.

| Trường đề xuất | Nội dung |
|---|---|
| `_id`, `issueNo`, `supplierReturnId`, `warehouseId`, `issuedAt`, `issuedBy`, `receivedByName` | Mã phiếu, H29, kho, ngày giờ, người giao và người thực nhận hàng. |
| `items[]` | ID dòng, dòng H29 và phần thỏa thuận đã xác minh, nguồn sở hữu, sản phẩm/lô, ô lấy, đơn vị và lượng giao thực tế, tình trạng, quy đổi trên dòng. |
| `evidenceIds`, `status`, `operationId`, `stockTransactionId` | Bằng chứng bàn giao, kết quả xác nhận và liên kết giao dịch C03/C04. |

Khi xác nhận, kiểm quyền tại kho, khóa kiểm kê, lô, chủ sở hữu, số dư và lượng còn lại của thỏa thuận. Ghi giảm hàng thực giao cùng lúc với lượng giữ/chặn đã sử dụng, hàng trong chồng và lượng đã xuất của H29. Hai lần xác nhận đồng thời cùng chịu một hạn mức, gửi lại cùng xác nhận không trừ lặp. Ví dụ xe nhận 5 viên của cửa hàng và 3 viên cửa hàng chỉ giữ hộ NCC thì H30 giảm 5 viên của cửa hàng, H34 giảm 3 viên giữ hộ. [H33 và H34 đã duyệt](25_Duyet_han_muc_tra_va_hang_giu_ho.md) · [Giao dịch tồn C03/C04](10_Duyet_giao_dich_va_lich_su_ton.md).

## H31 · supplier_acknowledgements · Kết quả NCC nhận hàng trả

Đề xuất Accountant ghi từng lần NCC báo kết quả sau giao, theo dòng thực xuất H30 hoặc bàn giao H34. Warehouse Staff cung cấp chứng từ hoặc ảnh làm căn cứ. Khi có chênh lệch, giữ được cả lượng kho đã giao và lượng NCC xác nhận.

| Trường đề xuất | Nội dung |
|---|---|
| `_id`, `ackNo`, `supplierReturnId`, `supplierId`, `acknowledgedAt`, `supplierContact`, `recordedBy`, `recordedAt` | NCC, ngày và người xác nhận phía NCC, Accountant ghi nhận, thời gian thực ghi. |
| `items[]` | ID dòng, loại và ID dòng thực giao H30/H34, lượng NCC xác nhận đã nhận thực tế, phần chấp nhận, từ chối hoặc chưa kết luận trong lượng nhận, lý do và bằng chứng. Lượng chưa xác nhận nhận tính riêng từ lượng đã xuất. |
| `reconciliations[]` | Dòng liên quan, căn cứ xử lý phần lệch, lượng, kết quả, người và thời điểm đối chiếu. Khi NCC bổ sung/đính chính, liên kết kết quả trước để tránh cộng hai lần. |

Nếu NCC đã thấy đủ 8 nhưng từ chối 1, ghi **thực nhận 8, chấp nhận 7, từ chối 1**. Nếu NCC mới thấy 7 trên 8, ghi **thực nhận 7, còn thiếu 1**. H31 và việc đóng H29 giữ nguyên số lượng đã xuất. Hàng bị gửi ngược hoặc giao thay thế chỉ ghi tăng kho khi có lần nhận thực tế có chứng từ. Accountant chỉ đóng phần kho khi mọi lượng đề nghị đều có kết quả, mọi lượng đã giao được đối chiếu và các tranh chấp đã giải quyết. [Phiếu nhập mua](15_Duyet_hang_den_kiem_nhan_va_phieu_nhap.md) · [Khảo sát MongoDB](03_Cau_truc_DB_hien_tai.md) · [Danh mục](01_Danh_muc_duyet.md) · [Nhật ký](04_Nhat_ky_duyet.md).
