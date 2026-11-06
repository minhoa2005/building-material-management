# H23, H24 và E03 · Giao không thành, nhận hàng về kho và giao bù

**Bản trình v0.1 · 01/11/2026 · Chờ duyệt riêng ba mục.** Áp dụng cho phần hàng kho đã xuất trên H15 nhưng khách chưa nhận. Nếu khách đã nhận theo H16 rồi mới yêu cầu trả thì dùng quy trình khách trả hàng. [H15/H16 đã duyệt](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md) · [Quy tắc BF07 trong dự án](../../../../CODE/BE/building-material-management/context.md) · [Snapshot MongoDB](03_Cau_truc_DB_hien_tai.md).

| Thực tế với một dòng phiếu xuất 40 viên | Ghi vào đâu | Kết quả |
|---|---|---|
| Khách ký nhận 38 viên, từ chối 2 viên bị nứt trên xe | H16 ghi 38 viên khách nhận. H23 ghi 2 viên giao không thành, lý do và bằng chứng. | Kho đã xuất 40 viên. Hai viên còn trên xe, chưa được tính vào tồn tại kho. |
| Hôm nay xe mới mang 1 trong 2 viên về | Warehouse Staff kiểm đếm và xác nhận H24 cho 1 viên thuộc đúng dòng H23, ghi vào ô cách ly. | Tồn vật lý tại kho tăng 1 viên lỗi. H23 còn 1 viên phải đối chiếu. |
| Cùng lúc xác nhận nhận về 1 viên | Phần mềm tạo E03 cho 1 viên trên dòng đơn bán cũ. | Sales có thể chờ, lên lịch giao bù 1 viên từ nguồn đạt hoặc ghi hủy phần đủ điều kiện nếu khách đồng ý. Viên lỗi tại kho tiếp tục xử lý theo H18. |

## H23 · failed_deliveries · Hồ sơ giao hàng không thành

Đề xuất Warehouse Staff phụ trách ghi một sự việc theo một phiếu xuất bán H15. Mỗi dòng chỉ ra lượng đã xuất nhưng khách chưa nhận, lý do và ai đang giữ hàng theo thông tin lúc báo. Sales xem kết quả của đơn liên quan để trao đổi với khách.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `failureNo`, `goodsIssueId`, `warehouseId`, `occurredAt`, `reportedBy`, `recordedAt` | Mã hồ sơ, phiếu/kho xuất, người ghi và thời điểm sự việc. |
| `items[]` | ID dòng, ID dòng H15, sản phẩm/lô đã xuất, lượng giao không thành, đơn vị và hệ số tại lúc xuất. Ghi lý do, người giữ hoặc nơi đang giữ theo thông tin thực tế và bằng chứng. Liên kết tới H16 khi cùng một chuyến có cả phần khách nhận. |
| `status`, `version` | Theo dõi đang chờ hàng về, đã về một phần hoặc đã đối chiếu xong. Nếu còn thiếu hàng, giữ lượng còn mở và chứng cứ để xử lý. |

**Giới hạn trên dòng xuất.** Tổng lượng khách đã nhận hợp lệ, lượng đã nhập lại qua H24 và lượng còn mở trong các hồ sơ H23 không được vượt lượng xuất còn hiệu lực. Khi xác nhận H24, cùng một lượng chuyển từ “H23 đang mở” sang “đã nhập lại”. Với ví dụ 40 viên, sau lần nhận về đầu tiên phép đối chiếu là 38 khách nhận + 1 đã nhập lại + 1 H23 đang mở = 40. Kiểm cùng một hạn mức khi ghi H16 và H23 đồng thời. Lập H23 chưa làm tăng tồn hoặc mở quyền giao bù.

## H24 · failed_delivery_receipts · Phiếu nhận lại hàng giao không thành

Đề xuất mỗi lần hàng thực về có một phiếu của Warehouse Staff tại kho nhận thuộc phạm vi được giao. Một H23 có thể nhận về nhiều lần. Nhân viên kiểm số lượng, lô và tình trạng thực tế rồi xác nhận theo đúng phần hàng còn mở. Phần hàng đạt đi vào vị trí nhận phù hợp, phần lỗi vào khu cách ly và liên kết H18.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `receiptNo`, `failedDeliveryId`, `warehouseId`, `receivedAt`, `receivedBy` | Mã phiếu nhận, hồ sơ giao không thành, kho thực nhận, ngày giờ và người nhận. |
| `items[]` | ID dòng, ID dòng H23 và dòng H15, sản phẩm/lô thực đếm, đơn vị và hệ số, lượng thực về, chất lượng, ô/chồng đặt hàng và bằng chứng. Tách dòng đạt và lỗi khi cùng một lần nhận có hai tình trạng. |
| `status`, `postedAt`, `postedBy`, `stockTransactionId`, `version` | Nháp cho đến lúc ghi tồn. Phiếu đã xác nhận giữ liên kết tới giao dịch C03 và lịch sử dòng C04. |

**Khi xác nhận.** Kiểm còn lượng nào trên đúng dòng H23/H15, lô, quyền tại kho nhận, khóa kiểm kê và sức chứa. Trong cùng giao dịch, tăng tồn theo lượng và chất lượng thực nhận, cập nhật chồng hàng, giảm lượng H23 đang mở và ghi E03. Hai phiếu nhận cùng lúc không thể cùng sử dụng phần lượng cuối. Sai lô, thừa hoặc hàng chưa xác minh phải ghi bằng chứng và xử lý chênh lệch trước khi ghi theo dòng nguồn. Phiếu xuất gốc và lượng khách đã ký nhận vẫn tra được. [Số dư tồn](09_Duyet_diem_ton_va_so_du.md) · [Giao dịch tồn](10_Duyet_giao_dich_va_lich_su_ton.md) · [Hồ sơ hàng lỗi](21_Duyet_hang_loi_phuong_an_va_phieu_huy.md).

## E03 · delivery_demand_reopenings · Lượng được giao bù trên đơn cũ

Đề xuất lưu một bản ghi tự động cho từng dòng H24 đã ghi tồn thành công. Bản ghi trả lời “Dòng đơn nào được thực hiện lại bao nhiêu và căn cứ vào phiếu nhận về nào?”. Warehouse Staff chỉ xác nhận lần nhận hàng. Sales Staff dùng lượng đã mở khi thống nhất với khách về chờ hàng, giao bù hoặc hủy phần còn đủ điều kiện.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `receiptLineId`, `stockTransactionId` | Dòng H24 là duy nhất cho mỗi lần mở. Có thể truy tới đúng giao dịch đã nhận hàng về. Gửi lại cùng xác nhận cho kết quả cũ. |
| `salesOrderLineId`, `issueRequestLineId`, `deliveryOrderLineId`, `goodsIssueLineId` | Truy được dòng SO, WIR, OD và phiếu xuất gốc. Khi lập lệnh giao bù, lệnh vẫn phục vụ dòng SO ban đầu. |
| `reopenedQtyBase`, `sourceVersion`, `createdAt` | Lượng được mở theo đơn vị gốc bằng lượng thực nhập về trên dòng H24, phiên bản nguồn và thời điểm. Lượng còn có thể dùng được đối chiếu sau các lần lên lệnh, giải phóng hoặc hủy hợp lệ. |

Nếu hàng về bị vỡ, E03 vẫn mở phần nghĩa vụ với khách theo lượng thực nhận về. Lệnh giao bù chỉ được giữ hàng khi có nguồn đủ điều kiện theo C05. Ví dụ đã mở 1 viên thì Sales chỉ có thể cam kết giao bù tối đa 1 viên từ lần mở này. Nếu khách chọn hủy phần đó thì cùng lượng không còn được dùng cho một lệnh giao mới. Tổng khách đặt vẫn là 40 viên. Sau khi đã có kết quả cuối, hóa đơn H37 tính theo lượng khách thực nhận trên các lần giao. [WIR và lệnh giao đã duyệt](18_Duyet_don_ban_yeu_cau_xuat_va_lenh_giao.md) · [Giữ hàng](11_Duyet_giu_hang_va_nguon_cung.md).

**Phạm vi duyệt.** H23 ghi sự việc, H24 ghi nhập lại thực tế, E03 ghi phần nhu cầu được mở cho chính đơn cũ. Cấu trúc chuyển cam kết sang lệnh giao thay thế (E04), lịch sử hủy phần đơn (E05), xử lý chênh lệch và sửa sai sẽ trình riêng. [Danh mục](01_Danh_muc_duyet.md) · [Nhật ký](04_Nhat_ky_duyet.md).
