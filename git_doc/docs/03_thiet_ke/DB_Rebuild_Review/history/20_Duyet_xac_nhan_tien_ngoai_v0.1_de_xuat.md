# H17 · Có cần lưu xác nhận đã nhận đủ tiền bên ngoài WMSD?

**Phiếu v0.1 · 01/11/2026 · Chờ chọn giữ hoặc bỏ.** Quy trình BF06 ngày 21/10 có một bước sau giao hàng: Sales Staff xác nhận cửa hàng đã nhận đủ tiền bên ngoài rồi SO chuyển từ Đã giao sang Hoàn thành. Snapshot MongoDB có loại chứng từ `PAYMENT_CONFIRMATION` theo SO và phiên bản giao hàng. Thiết kế mới đã duyệt H15 (xuất kho), H16 (khách nhận) và H37 (hóa đơn). Quyết định H17 dưới đây chỉ xác định dữ liệu và mốc hoàn thành SO. [Quy trình BF06](../../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) · [Snapshot MongoDB](03_Cau_truc_DB_hien_tai.md) · [Phiếu H15/H16/H37](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md).

| Nếu giữ H17 | Nếu bỏ H17 |
|---|---|
| SO ở trạng thái Đã giao sau khi các phần phải giao đã được đối chiếu. Sales Staff phụ trách đơn ghi xác nhận có căn cứ rằng cửa hàng đã nhận đủ tiền bên ngoài. Khi lưu thành công, SO chuyển sang Hoàn thành. | Bỏ bảng và thao tác xác nhận tiền. Đề xuất SO hoàn thành khi có lượng khách thực nhận, tất cả phần hàng còn lại đã giao hoặc đã có kết quả cuối hợp lệ và hết nghĩa vụ giao bù. SO hủy toàn bộ trước giao dùng trạng thái Đã hủy. |

Ví dụ kho xuất 100 viên, khách nhận 98, phần 2 viên còn lại đã được xử lý cuối cùng và không giao bù. H37 có thể phát hành cho 98 viên theo quy tắc đã duyệt. Nếu giữ H17, Sales chỉ xác nhận khi có căn cứ cửa hàng đã nhận đủ tiền cho kết quả cuối đó. Nếu bỏ H17, điều kiện kết thúc SO trong phương án trên dựa vào kết quả giao hàng này. Trong cả hai phương án, quyền phát hành và số tiền trên H37 theo phiếu hóa đơn đã duyệt.

## Nếu giữ · external_payment_confirmations

Một bản ghi là một lần xác nhận kết quả nhận đủ tiền bên ngoài cho phiên bản giao hàng của một SO. Phần thu tiền, theo dõi từng khoản thu và công nợ thuộc ngoài phạm vi.

| Trường đề xuất | Nội dung |
|---|---|
| `_id`, `salesOrderId`, `deliveredOrderVersion` | ID xác nhận, đơn bán và phiên bản kết quả giao hàng đã đối chiếu. |
| `externalReceiptRef`, `evidenceRefs[]`, `note` | Có ít nhất một căn cứ: mã chứng từ thu bên ngoài, bằng chứng hoặc ghi chú xác minh. |
| `confirmedBy`, `confirmedAt` | Sales Staff phụ trách, có quyền theo vai trò và phạm vi đơn, ghi nhận người thao tác và thời điểm. |
| `status`, `voidedBy`, `voidedAt`, `voidReason`, `replacesId` | Xác nhận có hiệu lực hoặc đã hủy hiệu lực. Nếu ghi nhầm, lưu lý do, người chỉnh và liên kết lần thay thế để tra lịch sử. |

**Điều kiện và quyền.** Dùng sau khi có kết quả giao cuối hợp lệ. Mỗi SO và phiên bản giao có tối đa một xác nhận đang hiệu lực. Lưu H17 và đổi trạng thái SO trong cùng giao dịch. Gửi lại cùng lần xác nhận chỉ trả kết quả đã lưu. Nếu sửa kết quả giao đã dùng, phải đối chiếu lại điều kiện hoàn thành cho phiên bản mới. Đề xuất Sales Staff được xác nhận và đính chính trong phạm vi đơn phụ trách, Store Owner và Accountant được xem để đối chiếu. Warehouse Staff chỉ xem tiến độ giao cần cho công việc. H17 không ghi bút toán tồn hay làm phát sinh một lần phát hành hóa đơn.

**Phạm vi duyệt.** Chọn giữ và duyệt v0.1 nghĩa là duyệt bảng cùng các trường, quyền và điều kiện trên. Chọn bỏ nghĩa là ghi vào danh mục bỏ bảng và áp mốc hoàn thành đã chọn cho thiết kế mới. Mọi xử lý dữ liệu lịch sử trong DB hiện tại thuộc kế hoạch chuyển đổi riêng.
