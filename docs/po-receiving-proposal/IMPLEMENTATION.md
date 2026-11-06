# PO receiving — trạng thái triển khai BE hiện hành

Quyết định người dùng ngày03/11/2026 thay luồng custody đã triển khai trước đó: chỉ ghi lượng đồng ý nhập. Confirm inspection không stock; post GR cộng STORE tại Receiving. Không ARRIVAL hoặc traversal mua cũ.

- Contract/payload/permissions/breaking changes: [BACKEND_V3.md](BACKEND_V3.md).
- Test, benchmark, reconciliation, reset và mapping18 gap: [VERIFICATION_V3.md](VERIFICATION_V3.md).
- Plan v2 gốc: [ui/design-plan-v2.md](ui/design-plan-v2.md), đã ghi rõ phần bị thay thế/hoãn.

Đã có các gói BE-1–5: quantity-only receiving, PO từ RR duyệt, amendment/supplier schedule/chốt thiếu có duyệt, read/evidence/recovery, purchase put-away partial/split, correction/reversal. Hoãn custody resolution/handback và xử lý hàng sai/lỗi/unknown. Giữ CR/FD và BF-04; không sửa FE.

Không có migration dựng lại lịch sử giả hoặc hỗ trợ ARRIVAL. Reset chỉ demo localhost sep490, backup bắt buộc. Không commit/push tự động.
