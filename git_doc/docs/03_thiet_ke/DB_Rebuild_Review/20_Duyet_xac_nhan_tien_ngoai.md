# H17 · Xác nhận đã nhận đủ tiền bên ngoài WMSD

**ĐÃ DUYỆT v0.1 · 01/11/2026.** Người dùng chọn “Giữ và duyệt H17 v0.1, chờ Sales xác nhận”. H17 xác định mốc SO chuyển từ Đã giao sang Hoàn thành. [Bản v0.1 đã trình](history/20_Duyet_xac_nhan_tien_ngoai_v0.1_de_xuat.md) · [Quy trình BF06](../../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) · [Snapshot MongoDB](03_Cau_truc_DB_hien_tai.md).

**Luồng đã chốt.** Sau khi đối chiếu xong phần khách nhận và xử lý hết phần còn lại, SO ở trạng thái Đã giao. Khi Sales Staff phụ trách đơn có căn cứ rằng cửa hàng đã nhận đủ tiền bên ngoài, nhân viên lưu H17 cho phiên bản giao hàng đó. WMSD ghi xác nhận và chuyển SO sang Hoàn thành trong cùng lần lưu.

Ví dụ kho xuất 100 viên, khách nhận 98, hai viên còn lại đã xử lý cuối cùng và không giao bù. Accountant có thể phát hành H37 cho 98 viên theo kết quả giao. SO tiếp tục ở trạng thái Đã giao đến khi Sales xác nhận cửa hàng đã nhận đủ tiền bên ngoài cho kết quả này. [Phiếu xuất, xác nhận giao và hóa đơn đã duyệt](19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md).

## external_payment_confirmations · Xác nhận tiền ngoài

Một bản ghi là một lần xác nhận kết quả nhận đủ tiền bên ngoài cho phiên bản giao hàng của một SO. Phần thu tiền, theo dõi từng khoản thu và công nợ thuộc ngoài phạm vi.

| Trường đã duyệt | Nội dung |
|---|---|
| `_id`, `salesOrderId`, `deliveredOrderVersion` | ID xác nhận, đơn bán và phiên bản kết quả giao hàng đã đối chiếu. |
| `externalReceiptRef`, `evidenceRefs[]`, `note` | Có ít nhất một căn cứ: mã chứng từ thu bên ngoài, bằng chứng hoặc ghi chú xác minh. |
| `confirmedBy`, `confirmedAt` | Sales Staff phụ trách, có quyền theo vai trò và phạm vi đơn, ghi nhận người thao tác và thời điểm. |
| `status`, `voidedBy`, `voidedAt`, `voidReason`, `replacesId` | Xác nhận có hiệu lực hoặc đã hủy hiệu lực. Nếu ghi nhầm, lưu lý do, người chỉnh và liên kết lần thay thế để tra lịch sử. |

**Điều kiện và quyền.** Dùng sau khi có kết quả giao cuối hợp lệ. Mỗi SO và phiên bản giao có tối đa một xác nhận đang hiệu lực. Lưu H17 và đổi trạng thái SO trong cùng giao dịch. Gửi lại cùng lần xác nhận chỉ trả kết quả đã lưu. Nếu sửa kết quả giao đã dùng, phải đối chiếu lại điều kiện hoàn thành cho phiên bản mới. Sales Staff được xác nhận và đính chính trong phạm vi đơn phụ trách, Store Owner và Accountant được xem để đối chiếu. Warehouse Staff chỉ xem tiến độ giao cần cho công việc. H17 không ghi bút toán tồn hay làm phát sinh một lần phát hành hóa đơn.

**Phạm vi duyệt.** Đã duyệt bảng, các trường, quyền và điều kiện chuyển trạng thái SO của phương án giữ H17 v0.1. [Danh mục thiết kế](01_Danh_muc_duyet.md) · [Nhật ký duyệt](04_Nhat_ky_duyet.md).
