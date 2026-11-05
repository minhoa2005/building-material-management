# H09–H11 · Xuất, nhận và bàn giao khi chuyển giữa hai kho

**Đã duyệt ngày 01/11/2026.** Người dùng trả lời “Duyệt H09 v0.1”, “Duyệt H10 v0.1” và “Duyệt H11 v0.1 cho BF04”. [Bản v0.1 đã trình](history/17_Duyet_phieu_xuat_nhan_va_ban_giao_chuyen_kho_v0.1_de_xuat.md). Đã chốt hai quan hệ. Một TR cho phép nhiều phiếu xuất trong hạn mức từng dòng đã duyệt. Mỗi phiếu xuất cho phép nhiều phiếu nhận. Người dùng xác nhận “Cho lập phiếu nhận thứ hai trên cùng phiếu xuất”. [Quyết định H06–H08](16_Duyet_lenh_va_yeu_cau_chuyen_kho.md) · [Nhật ký duyệt](04_Nhat_ky_duyet.md).

| Hồ sơ | Một bản ghi trả lời điều gì? | Mốc ghi tồn |
|---|---|---|
| H09 · Phiếu xuất điều chuyển | Kho nguồn xuất những dòng hàng nào, từ phiếu yêu cầu nào và trong đợt nào? | Xác nhận TO lấy hàng ở bước 7 chuyển hàng từ kho nguồn sang đang chuyển. |
| H10 · Phiếu nhận điều chuyển | Kho đích thực nhận bao nhiêu của từng dòng xuất, lúc nào, tình trạng nào và đưa vào ô nào? | Mỗi lần nhận chỉ giảm đang chuyển và ghi tồn đích cho phần thực nhận có căn cứ. |
| H11 · Thông tin bàn giao | Nhân viên kho giao cho ai, thuộc đội nào, bao nhiêu và có bằng chứng gì? | Ghi cùng lần xác nhận xuất ở bước 7. |

Ví dụ TR duyệt 100 viên. Phiếu xuất thứ nhất giao 60. Phiếu nhận số 1 ghi **40 viên đạt**, còn **20 viên đang chuyển** trên dòng xuất. Hôm sau phiếu nhận số 2 ghi **18 viên đạt và 2 viên vỡ**. Kho đích có tổng cộng 58 viên đạt và 2 viên ở khu cách ly. Lượng đang chuyển của dòng đó bằng 0. Nếu chưa lập phiếu xuất nào khác, TR còn **40 viên được phép lập phiếu xuất**. Các lần nhận chỉ ảnh hưởng số đang chuyển và tồn đích. [C01–C02 · Điểm và số dư tồn](09_Duyet_diem_ton_va_so_du.md).

## H09 · transfer_dispatches · Phiếu xuất điều chuyển

Mỗi phiếu là một đợt xuất từ một kho nguồn tới một kho đích, theo một phiên bản TR đã duyệt. Warehouse Staff kho nguồn lập phiếu ở bước 4. Đề xuất cho một phiếu có nhiều dòng và dùng một TO lấy hàng để xác nhận trọn đợt.

| Trường đề xuất | Ý nghĩa và ràng buộc |
|---|---|
| `_id`, `dispatchNo`, `transferRequestId`, `approvedRevision` | ID, mã phiếu xuất duy nhất và TR đã cho phép xuất. Mỗi phiếu có mã riêng dù cùng TR. |
| `sourceWarehouseId`, `destinationWarehouseId`, `createdBy`, `createdAt` | Hai kho khớp TR. Ghi nhân viên thuộc kho nguồn lập phiếu và thời điểm lập. |
| `status`, `dispatchedBy`, `dispatchedAt`, `stockTransactionId` | DRAFT khi đang chuẩn bị, DISPATCHED khi xác nhận xuất thành công, CANCELLED nếu hủy trước xuất. Lưu người và thời điểm thực xuất cùng giao dịch C03 đã ghi ở bước 7. |
| `cancelledBy`, `cancelledAt`, `cancelReason`, `version` | Giữ lý do hủy, trả phần hạn mức và lượng hàng giữ tương ứng trong cùng thao tác. Phiên bản kiểm soát các lần thao tác đồng thời. |
| `items[]` | Mỗi dòng có ID cố định, ID dòng TR, sản phẩm, lô, số dư nguồn, ô nguồn, ô tập kết, lượng dự kiến và lượng thực xuất theo đơn vị gốc. Lưu đơn vị nhập, hệ số và quy cách thực tế trên dòng. Tách dòng nếu lấy từ các lô hoặc nhóm tồn khác nhau. |
| `handovers[]` | Từng lần bàn giao của phiếu xuất theo cấu trúc H11 đã duyệt bên dưới. Liên kết TO lấy hàng qua H08 và dòng nguồn H09. |

**Khi lập phiếu.** Kiểm và giữ hạn mức từng dòng H07 cùng lượng tồn nguồn tương thích theo C05. Đây là hai giới hạn khác nhau. Ví dụ TR cho phép xuất thêm 40 nhưng kho chỉ có 25 viên có thể giữ thì phiếu không thể dành 40 viên. Nếu có liên kết giữ hàng đúng nhu cầu, sử dụng phần đã giữ theo C05. Kiểm đồng thời hạn mức và tồn khi hai nhân viên lập phiếu.

**Khi xuất.** Người có quyền tại kho nguồn xác nhận TO trọn lượng thực bàn giao. Nếu hàng thực khác lệnh, phải xử lý phiếu và lệnh đang mở trước khi xuất. Ghi H09, H06, H08, hàng bàn giao, C03/C04 và biến động nguồn → tập kết → đang chuyển trong cùng lần xác nhận. Mỗi dòng xuất có điểm đang chuyển riêng ở C01. Hủy phiếu chưa xuất giải phóng phần chưa dùng, đóng các nhiệm vụ mở liên quan và giữ lịch sử. Với phiếu đã xuất, mọi sửa sai phải truy được về chứng từ đã ghi. [C03–C04](10_Duyet_giao_dich_va_lich_su_ton.md) · [C05–C06](11_Duyet_giu_hang_va_nguon_cung.md).

## H10 · transfer_receipts · Phiếu nhận điều chuyển

Mỗi phiếu ghi **một lần nhận thực tế cho một phiếu xuất**. Một H09 có từ 0 đến nhiều H10. Nếu cùng một xe mang hàng từ hai phiếu xuất, nhân viên truy về từng phiếu xuất và lập các phiếu nhận tương ứng. Ngày lập phiếu, thời điểm hàng đến và người kiểm nhận tra được theo từng lần.

| Trường đề xuất | Ý nghĩa và ràng buộc |
|---|---|
| `_id`, `receiptNo`, `dispatchId`, `warehouseId` | Mã phiếu nhận duy nhất, phiếu xuất thực tế và kho nhận đúng theo H09. TR được truy qua H09. |
| `createdBy`, `createdAt`, `receivedAt`, `postedBy`, `postedAt`, `status` | Nhân viên kho đích ghi lượng kiểm đếm, xác nhận khi hàng thực đến. Người xác nhận phải khác người đã xuất H09. DRAFT có thể sửa hoặc hủy, POSTED giữ kết quả đã ghi. |
| `items[]` | ID dòng nhận cố định, ID dòng xuất, lô và sản phẩm đối chiếu, lượng thực nhận trong **lần này**, đơn vị và quy cách trên dòng, chất lượng, ô tiếp nhận hoặc ô cách ly, phân bổ chồng hàng. Một dòng xuất có thể tách thành phần đạt và phần lỗi trên cùng phiếu. |
| `stockTransactionId`, `evidenceRefs[]`, `damageReportRefs[]`, `note`, `version` | Giao dịch C03 của lần nhận, bằng chứng, liên kết hồ sơ hàng hỏng và ghi chú nội bộ. Hồ sơ chênh lệch giữ liên kết tới phiếu xuất và dòng liên quan để theo dõi đến khi có kết quả. |
| `putawayStatus` | PENDING khi còn lượng đạt tại ô nhận cần xếp, COMPLETED khi hoàn tất các TO cần thiết, NOT_APPLICABLE khi toàn bộ hàng thực nhận đã vào khu cách ly. |

**Trần lượng và ghi nhận.** Với mỗi dòng xuất, tổng lượng nhận đạt và lỗi của lần này phải nhỏ hơn hoặc bằng lượng còn đang chuyển đúng dòng/lô đó. Đọc lại số đang chuyển khi xác nhận và ghi phiếu, tồn, giữ hàng, sức chứa và lịch sử cùng nhau. Hai nhân viên không thể cùng nhận nốt 20 viên nếu chỉ còn 20. Gửi lại cùng lần xác nhận trả về kết quả đã lưu. Nếu còn hàng trên đường, lượt sau lập phiếu mới trên cùng H09. Đối với phần đã xác nhận sai, giữ phiếu gốc và xử lý bằng chứng từ sửa sai có quyền.

**Phân loại.** Hàng đạt vào ô nhận, hàng lỗi thực có vào ô cách ly tại chính kho nhận và liên kết biên bản lỗi. Phần hỏng đã ghi nhận cũng giảm lượng đang chuyển. Phần thiếu tiếp tục ở đang chuyển cho tới khi nhận thêm hoặc có chứng từ xử lý hợp lệ. Hàng thừa/sai lô ghi rõ hàng thực thấy và bằng chứng để xác minh trước khi ghi vào số dư phù hợp. Nếu đang lưu giữ tại kho phải theo dõi thực tế và sức chứa theo quy trình giữ hàng áp dụng. Nếu chuyến chưa giao được viên nào, ghi sự việc và duy trì số đang chuyển. Phiếu nhận ghi tồn chỉ phát sinh với lượng thực nhận dương.

**Sau nhận.** Mỗi H10 có lượng đạt cần xếp có thể làm nguồn cho H08/H06 PUTAWAY. Xác nhận TO chỉ chuyển từ ô nhận vào ô lưu trữ. Kho đích được đóng TR sau khi xử lý đủ mọi đợt xuất, lượng đang chuyển, chênh lệch và lệnh xếp hàng theo H07. [Lệnh và điều kiện đóng TR đã duyệt](16_Duyet_lenh_va_yeu_cau_chuyen_kho.md).

## H11 · handovers[] · Bàn giao cho đội vận chuyển

**BF04 lưu từng lần bàn giao trong chính phiếu xuất H09.** Khi đối chiếu, nhân viên mở phiếu xuất sẽ thấy ai đã giao, tài xế nào đã nhận và đã nhận những dòng nào. Giữ ID riêng cho từng lần bàn giao. Việc xác nhận của kho đích nằm trên H10. Bàn giao xuất bán và xác nhận khách nhận đã duyệt riêng tại [H15/H16](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md).

| Trường đề xuất trên mỗi lần bàn giao | Ý nghĩa và ràng buộc |
|---|---|
| `handoverId`, `deliveryTeamId`, `teamNameAtHandover` | ID lần bàn giao, đội nội bộ được chọn từ B08C và tên đội tại lúc giao. Khi đổi tên đội, phiếu cũ vẫn hiển thị tên lúc giao. |
| `handedOverBy`, `receivedByName`, `handedOverAt`, `recordedBy` | Nhân viên giao, họ tên người/lái xe thực nhận, thời điểm thực bàn giao và người nhập trên phần mềm. |
| `items[]` | Tham chiếu dòng H09 và lượng thực giao cho đội/người này, giữ đơn vị và hệ số tại lần giao. Nếu chia hàng cho hai đội thì cộng theo từng dòng H09. |
| `evidenceRefs[]`, `note` | Ảnh, biên bản hoặc bằng chứng của đúng lần bàn giao và ghi chú cần thiết. Giới hạn theo quyền xem chứng từ nội bộ. |

**Kiểm ở bước 7.** Từng dòng H09 phải có tổng lượng các lần bàn giao bằng lượng thực xuất. Kho chỉ xác nhận xuất một lần. Ví dụ trong cùng lần xuất 60 viên, đội A nhận 35 và đội B nhận 25 thì lưu hai mục bàn giao. Tồn chuyển từ kho nguồn sang đang chuyển đúng 60 viên. Lái xe được ghi theo chuyến, Warehouse Staff thao tác trên phần mềm. [B08C · Đội vận chuyển nội bộ](08C_Don_vi_van_chuyen.md).

## Kết quả duyệt

Trong snapshot, phiếu xuất, phiếu nhận và bàn giao từng là các loại chứng từ trong bảng dùng chung. Thiết kế đã duyệt tách H09 và H10 để mỗi bên xác nhận tại đúng kho của mình, đồng thời cho phép tra nhiều lần nhận trên một lần xuất. Đã duyệt nhúng H11 vào H09 riêng cho BF04. Mỗi mục bàn giao có ID và lượng riêng theo từng dòng xuất. Cách lưu bàn giao xuất bán đã duyệt ở H15/H16. H01 (yêu cầu bổ sung hàng) đã được duyệt riêng v0.1 ngày 02/11/2026. [Snapshot MongoDB](03_Cau_truc_DB_hien_tai.md) · [Luồng BF04 hiện có](../../../../src/modules/transfers/BF04_API.md) · [Quy đổi trên dòng](14_Bo_UOM_va_luu_quy_doi_tren_dong.md).
