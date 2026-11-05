# E02, H33 và H34 · Số lượng được đề nghị trả và hàng kho đang giữ hộ

**E02, H33 và H34 đã duyệt riêng v0.1 · 01/11/2026.** [Bản trình đã duyệt](history/25_Duyet_han_muc_tra_va_hang_giu_ho_v0.1_de_xuat.md). E02 theo dõi số lượng đã được dùng cho một yêu cầu trả hoặc một lần báo giao thất bại. H33 và H34 theo dõi hàng của khách hoặc nhà cung cấp (NCC) thực sự đi vào và ra khỏi kho. Các vai trò bên dưới là quyền mặc định theo nghiệp vụ.

**Ví dụ.** Khách ký nhận 20 viên rồi mang 3 viên đến nhờ kho kiểm. Một viên còn nguyên được Sales chấp nhận. Một viên lỗi nhà sản xuất được Store Owner duyệt nhận vào sở hữu cửa hàng. Một viên đã thi công bị từ chối và khách để lại đến hôm sau.

| Thời điểm | Chứng từ và kết quả | Số viên trong kho của lần trả này |
|---|---|---|
| Sales lập yêu cầu trả 3 viên theo dòng khách đã nhận | E02 ghi 3 viên đang được đề nghị trả. Nếu nguồn chưa dùng trước đó, còn tối đa 17 viên cho yêu cầu khác. | Chưa ghi hàng vào kho. |
| Warehouse Staff thực nhận giữ tạm 3 viên | H33 ghi chủ hàng là khách, ghi lô, vị trí và người bàn giao. | 3 của khách, 0 của cửa hàng. |
| H28 nhập phần cửa hàng đã chấp nhận | Dùng hạn mức cho 2 viên, chuyển quyền sở hữu 2 viên từ H33. Phần bị từ chối được giải phóng khỏi E02 khi quyết định từ chối có hiệu lực. | 1 viên đạt và 1 viên lỗi thuộc cửa hàng, 1 viên còn thuộc khách. Viên lỗi vào khu cách ly và bị chặn xuất bán. |
| Hôm sau khách lấy viên còn lại | H34 ghi giao lại đúng 1 viên từ dòng H33, có người nhận và bằng chứng thực giao. | Còn 2 viên của cửa hàng, 0 viên giữ hộ. |

## E02 · return_quantity_claims · Số lượng đang được đề nghị nhận lại

Đề xuất phần mềm ghi E02 cùng lúc lưu yêu cầu hợp lệ của Sales Staff ở H27 hoặc báo cáo có căn cứ của Warehouse Staff ở H23. Một dòng gắn một loại nghiệp vụ, một dòng yêu cầu và một nguồn lượng đã xác minh.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `claimKind`, `requestLineId`, `sourceKind`, `sourceLineId` | Phân biệt khách đã nhận rồi trả (H27) với khách từ chối ngay lúc giao (H23). Với H27, tham chiếu dòng khách nhận H16 hoặc dòng bán lịch sử đã xác minh. Với H23, tham chiếu dòng thực xuất H15. |
| `claimedQtyBase`, `createdBy`, `createdAt`, `operationId`, `version` | Lượng theo đơn vị gốc, người và thời điểm mở cùng mã thao tác. Một lần gửi lại cùng thao tác chỉ có một kết quả. |
| `events[]` | Mỗi lần dùng hoặc giải phóng một phần lưu dòng chứng từ, lượng, lý do, người và thời điểm. Lượng còn mở bằng lượng ban đầu trừ tổng đã dùng và đã giải phóng. |

- **Khách đã nhận rồi mới trả.** Lượng có thể đề nghị thêm bằng lượng khách đã nhận hợp lệ trừ lượng H28 đã nhập và lượng E02 còn mở trên nguồn. Ví dụ khách nhận 20, H28 đã nhập 3, yêu cầu khác đang mở 2 thì còn 15. Với nguồn lịch sử, dùng lượng đã nhận và các lần trả đã xác minh, tránh tính lại một lần bán dưới hai mã nguồn.
- **Giao không thành.** Lượng có thể báo thêm bằng lượng thực xuất H15 trừ lượng khách đã nhận H16, lượng H24 đã nhập về và lượng báo giao không thành còn mở trên dòng xuất đó. Ví dụ xuất 40, khách nhận 38, đã báo 2 thì cùng chuyến không thể báo thêm. H24 thực nhận 1 viên chỉ chuyển 1 viên từ đang mở sang đã dùng. Viên còn trên xe tiếp tục được theo dõi.
- **Ghi nhận một lần.** Cùng một lượng không đồng thời tính là hồ sơ đang mở và phiếu đã nhập. Kiểm hạn mức cả khi hai người thao tác đồng thời. Chỉ giải phóng đúng phần rút, từ chối hoặc được xử lý hợp lệ theo nghiệp vụ nguồn. Giải phóng E02 chưa chứng minh khách đã đến lấy hàng đang giữ hộ. [H23 và H24](22_Duyet_giao_that_bai_nhan_ve_va_giao_bu.md) · [H27 và H28](24_Duyet_khach_tra_hang_sau_khi_nhan.md).

## H33 · custody_receipts · Phiếu nhận giữ hộ

Warehouse Staff tại kho được giao xác nhận từng lần cửa hàng **thực sự giữ** hàng thuộc khách hoặc NCC, kể cả khi hàng đến chờ kiểm. Một phiếu cho một kho, một chủ hàng. Nếu khách/NCC mang hàng về ngay tại lúc từ chối và kho chưa nhận giữ, chỉ ghi kết quả nghiệp vụ nguồn.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `receiptNo`, `warehouseId`, `ownerKind`, `ownerId`, `receivedAt`, `receivedBy`, `handedOverBy` | Mã phiếu, kho, khách hoặc NCC còn sở hữu hàng, thời điểm, nhân viên nhận và người bàn giao thực tế. |
| `items[]` | ID dòng, chứng từ và dòng nguồn (lần NCC giao H03 hoặc yêu cầu H27), sản phẩm/lô, đơn vị và hệ số, lượng thực đếm, bao bì, tình trạng, ô/chồng và lý do giữ. Liên kết kiểm nhận khi có. |
| `evidenceIds`, `status`, `stockTransactionId`, `operationId`, `version` | Bằng chứng bàn giao và giao dịch ghi lượng vật lý dưới đúng chủ hàng khi xác nhận. |

H33 tăng lượng giữ hộ và mức chiếm chỗ thực tế. Cửa hàng chưa được bán lượng này. Chỉ ghi tồn vật lý một lần, dù H03 hoặc E01 cũng ghi việc hàng đến/được kiểm. Khi H05 hoặc H28 nhận vào sở hữu, chuyển đúng phần đã duyệt từ số dư của NCC/khách sang số dư của cửa hàng trong cùng lần xác nhận. Lượng còn giữ theo từng dòng H33 bằng lượng nhận giữ trừ phần đã chuyển sở hữu và phần đã thực giao lại. [Nhập mua H03–H05](15_Duyet_hang_den_kiem_nhan_va_phieu_nhap.md) · [Tồn theo chủ sở hữu](09_Duyet_diem_ton_va_so_du.md).

## H34 · custody_releases · Phiếu bàn giao lại hàng giữ hộ

Warehouse Staff xác nhận mỗi lần giao hàng còn thuộc khách/NCC cho chủ hàng hoặc người nhận thay có căn cứ. Có thể giao từng phần. Nếu NCC đến lấy hàng, đối chiếu với hồ sơ/thỏa thuận giao trả áp dụng. Các bảng thỏa thuận và đối chiếu NCC trình ở nhóm riêng.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `releaseNo`, `ownerKind`, `ownerId`, `warehouseId`, `releasedAt`, `releasedBy`, `recipientName` | Mã phiếu, chủ hàng, kho thực giao, người giao/nhận và ngày giờ bàn giao. |
| `items[]` | ID dòng H34, dòng nhận giữ H33, dòng quyết định hoặc căn cứ giao lại, sản phẩm/lô, ô/chồng hiện tại, đơn vị và hệ số, lượng thực giao. |
| `evidenceIds`, `status`, `stockTransactionId`, `operationId`, `version` | Chữ ký hoặc bằng chứng bàn giao, thời điểm chứng từ có hiệu lực và liên kết biến động tồn. |

Chỉ ghi giảm lượng đang giữ của **đúng chủ, kho, lô và dòng H33** khi bàn giao thực tế. Hẹn khách đến lấy hoặc quyết định từ chối H27 chưa làm giảm số dư. Phần đã nhận sở hữu qua H05/H28 không còn dùng cho H34. Ví dụ H33 giữ 3, H28 đã chuyển sở hữu 2 thì H34 được giao tối đa 1. Cùng một viên không thể vừa giao trả vừa chuyển sở hữu trong hai thao tác đồng thời. Cập nhật số dư, lượng còn giữ và hàng trong chồng cùng một lần. [Giao dịch và lịch sử tồn](10_Duyet_giao_dich_va_lich_su_ton.md).

Đối chiếu với cách lưu các loại chứng từ và `return_source_claims` trong bản khảo sát MongoDB, cùng hai nhánh khách trả và giao thất bại ở BF-07. [Khảo sát MongoDB](03_Cau_truc_DB_hien_tai.md) · [Report 3 trong BE](../../01_bao_cao/WMSD_Report3_Fix.docx.txt) · [Danh mục](01_Danh_muc_duyet.md) · [Nhật ký](04_Nhat_ky_duyet.md).
