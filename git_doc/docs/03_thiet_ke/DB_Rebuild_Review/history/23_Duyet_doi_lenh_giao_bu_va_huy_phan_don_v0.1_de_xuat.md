# E04 và E05 · Đổi lệnh giao bù hoặc hủy phần còn lại của đơn bán

**Bản trình v0.1 · 01/11/2026 · Chờ duyệt riêng từng bảng.** Sales Staff phụ trách dòng đơn bán quyết định phần nào tiếp tục giao và phần nào hủy theo thỏa thuận với khách. Kho ghi nhận việc xuất, nhận và giữ hàng theo chứng từ tương ứng. [Quy tắc UC-48 và UC-51](../../../../CODE/BE/building-material-management/context.md) · [Cấu trúc MongoDB đã khảo sát](03_Cau_truc_DB_hien_tai.md).

**Ví dụ xuyên suốt.** Khách đặt 40 viên và đã ký nhận 38. Hai viên bị từ chối lúc giao đã được kho nhận lại, một viên hôm qua và một viên hôm nay. Mỗi dòng phiếu nhận về mở lại 1 viên trên đơn cũ theo E03. Khách muốn giao bù 1 viên và hủy 1 viên. [H23, H24 và E03 đã duyệt](22_Duyet_giao_that_bai_nhan_ve_va_giao_bu.md).

| Quyết định của Sales | Bảng ghi nhận | Sau khi ghi |
|---|---|---|
| Hẹn chuyến mới cho 1 viên theo dòng nhận về hôm qua | E04 chuyển quyền thực hiện 1 viên từ lệnh giao cũ sang lệnh giao thay thế | Chỉ lệnh thay thế được thực hiện phần này. Nghĩa vụ của đơn vẫn là giao 40 viên cho tới khi có quyết định hủy. |
| Khách đồng ý hủy 1 viên theo dòng nhận về hôm nay | E05 ghi hủy 1 viên và lý do | Đơn gốc vẫn ghi khách đặt 40, đã hủy 1, cần giao tổng cộng 39. Đã nhận 38 nên còn phải giao 1. |
| Kho xuất hàng đạt cho chuyến mới, khách ký nhận viên giao bù | H15 ghi xuất và H16 ghi khách nhận | Khách đã nhận đủ 39 viên còn hiệu lực. Hóa đơn cuối tính 39 viên, giữ ngày và số lượng của từng lần xuất. |

## E04 · delivery_commitment_transfers · Chuyển số lượng sang lệnh giao thay thế

Sales Staff có thể tiếp tục giao trên lệnh cũ nếu lệnh còn dùng được. Đề xuất chỉ tạo E04 khi Sales chọn một lệnh khác để thực hiện phần được mở lại. Một dòng E04 trả lời “Vì lần nhận hàng về nào mà bao nhiêu hàng được chuyển từ lệnh nào sang lệnh nào?”.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `reopeningReceiptLineId` | ID bản ghi và dòng H24 đã xác nhận, tra trực tiếp sang E03 bằng khóa dòng nhận. |
| `fromDeliveryOrderLineId`, `toDeliveryOrderLineId` | Hai dòng lệnh giao khác nhau, cùng dòng yêu cầu xuất H13 và đơn bán H12. Giữ được cả lịch sử của lệnh cũ và nhiệm vụ của lệnh mới. |
| `quantityBase`, `sourceVersion`, `targetVersion` | Lượng chuyển theo đơn vị gốc và phiên bản hai lệnh tại lần chuyển. |
| `transferredBy`, `transferredAt`, `operationId` | Người thực hiện, thời điểm và mã thao tác để truy vết. Gửi lại cùng thao tác trả về kết quả đã ghi. |

Khi ghi E04, giảm lượng được phép giao ở lệnh nguồn và tăng đúng lượng đó ở lệnh đích trong cùng lần lưu. Tổng đã dùng trên từng dòng E03 bao gồm lượng đã giao lại, lượng đang dành cho lệnh giao và lượng đã hủy. Mỗi viên chỉ thuộc một trong các phần này tại cùng thời điểm. Nếu lệnh mới có hiệu lực, giữ hàng đạt theo C05 và giải phóng hoặc chuyển đúng phần giữ trước đó nếu có. H15 chỉ ghi xuất khi kho thực bàn giao. [Lệnh giao H14](18_Duyet_don_ban_yeu_cau_xuat_va_lenh_giao.md) · [Giữ hàng C05](11_Duyet_giu_hang_va_nguon_cung.md).

## E05 · sales_order_cancellations · Lịch sử hủy số lượng trên đơn bán

Đề xuất Sales Staff ghi mỗi lần hủy theo dòng đơn, số lượng và lý do. Có hai nguồn hợp lệ. Thứ nhất là lượng chưa từng xuất. Thứ hai là lượng đã xuất, giao thất bại, đã thực nhập về theo H24 và chưa xuất giao bù. Ví dụ 1 viên khách đã từ chối nhưng còn trên xe vẫn phải chờ kho đối chiếu, kể cả khi khách báo hủy trước.

| Trường đề xuất | Ý nghĩa |
|---|---|
| `_id`, `salesOrderId`, `salesOrderLineId` | ID bản ghi hủy và dòng SO gốc. |
| `sourceKind`, `reopeningReceiptLineId` | Phân biệt phần chưa xuất và phần thực nhận về từ giao thất bại. Với nguồn thứ hai, bắt buộc trỏ tới dòng H24 đã mở E03. Nếu hủy từ nhiều nguồn, mỗi nguồn có một dòng. |
| `cancelledQtyBase`, `reason`, `sourceVersion` | Lượng hủy theo đơn vị gốc, lý do và phiên bản dòng đơn dùng để kiểm giới hạn. |
| `cancelledBy`, `cancelledAt`, `operationId` | Người thao tác, thời điểm và mã liên kết các dòng của cùng một lần hủy. |

Khi hủy, đối chiếu các lệnh giao, phần kho đang soạn và lượng đang giữ. Nếu đã dành hàng cho chuyến mới, phải thu hồi phần có thể dừng và giải phóng lượng giữ tương ứng trước khi xác nhận hủy. Lưu quyết định hủy, cập nhật phần còn phải giao và hạn mức liên quan cùng một lần. Hai người cùng thao tác trên 1 viên còn lại thì chỉ một lần được dùng viên đó. Lượng đã xuất còn ở ngoài kho hoặc đã được khách ký nhận không đủ điều kiện hủy theo E05. Hủy phần chưa giao giữ nguyên số dư vật lý và các phiếu xuất cũ. H37 tính theo từng lần khách thực nhận. [Phiếu xuất, khách nhận và hóa đơn](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md).

**Điểm xin duyệt riêng.** E04 cho Sales chuyển phần đã mở sang một lệnh thay thế. E05 cho Sales hủy phần chưa xuất hoặc đã thực về đủ điều kiện và lưu lịch sử. [Danh mục](01_Danh_muc_duyet.md) · [Nhật ký](04_Nhat_ky_duyet.md).
