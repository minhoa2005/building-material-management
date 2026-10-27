# Đồng bộ tạo RR từ form điền sẵn — 27/10/2026

Trạng thái: được người dùng chấp thuận theo đề xuất1.4.0. Baseline3.3.0; giữ8 BF,5 role,111 UC (97 active/14 retired).


**Form tạo RR thống nhất (đề xuất 1.4.0 được chấp thuận, baseline 3.3.0):** Người dùng chọn dòng cảnh báo và bấm Tạo yêu cầu, hoặc mở từ menu rồi chọn nguồn/nhu cầu khác. Form điền sẵn sản phẩm, kho, lượng gợi ý, lý do và refs có căn cứ. Sửa lượng/ngày cần/lý do; dòng nguồn giữ sản phẩm/kho/refs. Đổi ngữ cảnh phải chọn lại và tính lại. Một RR một kho/ngày cần; khác nhóm tạo phiếu riêng sau review.

- Mở/hủy form hoặc chọn Để sau không lưu RR, links hay pending coverage. Lưu nháp mới ghi DRAFT; Gửi duyệt kiểm dữ liệu rồi ghi SUBMITTED theo quyền. Nháp đã lưu được cập nhật cùng ID/version. Owner khác người gửi duyệt; Accountant lập PO sau duyệt.
- Sau lưu SO thành công, xét các kho, nguồn về đúng hạn/tương thích và RR đã có. Còn thiếu thì hỏi “Đơn đã lưu; còn thiếu lượng chưa có nguồn phù hợp đúng hạn. Bạn có muốn tạo yêu cầu bổ sung?” Người dùng chọn dòng rồi mở form. Áp dụng cho cả không có nguồn và chỉ đủ một phần; đủ RR/nguồn thì dẫn tới phương án đang có. Có phương án kho khác chưa chọn phải hiển thị trước, không kết luận không có nguồn.
- Đánh giá lỗi/chậm hiển thị chưa kiểm tra được/đang kiểm tra, không coi nguồn bằng0 hoặc làm SO lưu thất bại. Hộp thoại theo lần lưu có thay đổi nhu cầu; refresh/retry/sửa ghi chú không liên quan không tự lặp. Cảnh báo và nút tạo vẫn có trên chi tiết SO.
- Được thêm sản phẩm ngoài cảnh báo. Dòng thêm chọn nguồn đúng của chính nó hoặc MANUAL_OTHER kèm lý do; sản phẩm ngoài SO không gắn giả vào SO line ban đầu. Cùng sản phẩm khác nguồn/lý do có thể tách dòng; trùng đúng cùng nguồn cần gộp/sửa.
- Khi lưu/gửi, BE kiểm lại source/version/coverage và trả số cũ–mới nếu thay đổi. Giữ nội dung người dùng nhập; chỉ lưu sau khi xác nhận dữ liệu hợp lệ. Nguồn hủy/hết quyền/hết nhu cầu phải sửa/xóa dòng; không âm thầm thay lượng hoặc đổi loại lý do. Phần vượt thiếu bán phải tách nhu cầu khác.
- Contract tạo dùng action SAVE_DRAFT/SUBMIT, creationKey, kho/ngày/lý do và source từng dòng; không có trường phân loại cách tạo. Quyền, Notification/readAt, guard và payloadHash giữ nguyên mục đích; mở form/đọc thông báo không ghi tồn. Ngày cần sau kiểm kê không có căn cứ thì để người dùng chọn.

## Thành phần đồng bộ

| Thành phần | Kết quả |
|---|---|
| Mongoose | Một header tạo RR, typed source lines, quantity/source validation và index;39 collections/35 document/19 line |
| Seed | RR từ form kiểm kê; RR SO chưa WIR có thêm sản phẩm dự trữ; SO không có tone phù hợp chưa tạo RR; Notification per recipient và readAt độc lập |
| FE contract | action SAVE_DRAFT/SUBMIT; assessment READY/PENDING/FAILED và NONE/PARTIAL/COVERED/OPTIONS_AVAILABLE; review-required giữ form |
| Tài liệu | Quy trình/database VI–EN, Report1/2/3 text, thiết kế hệ thống, SQL85 bảng/2 view, README và context FE/BE |
| Nghiệm thu | R01–30/T01–T69, form chưa lưu/cancel, thêm sản phẩm, SO post-save no/partial supply, stale review và single-use coverage |
| Runtime | Schema/DTO/fixture có cấu trúc; API/consumer/UI và kiểm transaction/scope thực vẫn cần triển khai |

## Kiểm chứng

- BE npm test: 47 đạt, 0 lỗi, 3 nhóm tích hợp MongoDB bỏ qua vì không có MONGODB_TEST_URI. Đã kiểm local schema, reference seed, ledger, mixed source/other-need lines, saved SO no-compatible-source without RR, recipient read state và kế hoạch migration/idempotency/bảo toàn dữ liệu.
- FE npm run typecheck: đạt; contract action/lưu-gửi và update nháp giữ ID/version/lineId không gây lỗi TypeScript.
- git diff --check tại FE/BE: đạt. Kiểm liên kết local mới và code fences trong18 tài liệu thay đổi: đạt. SQL tham chiếu có85 bảng/2 view.
- Quét model/seed/test/DTO/tài liệu hiện hành: cấu trúc và luồng phân loại cách tạo đã được loại bỏ; chỉ còn một form.
- Chưa kiểm UI/API/consumer hoặc concurrency với database thật; schema/fixture không thay cho kiểm transaction và quyền ở service.
- Đã chạy `npm run migrate:replenishment -- --apply` vào database cấu hình `sep490` theo yêu cầu người dùng: sao lưu nhất quán 39 collections ngoài Git tại `~/.codex/backups/`, cập nhật 6 policy, 1 RR và 1 dòng RR, thêm 3 permission và bổ sung quyền cho 3 role. Index được tạo bổ sung, không drop/sync index hoặc seed lại. RR lịch sử giữ lý do thật dưới MANUAL_OTHER, không bịa snapshot nguồn hay người/thời điểm gửi.
- Đối chiếu 536 bản ghi có sẵn với backup: chỉ các field migration dự kiến thay đổi; IDs, trạng thái/version, approvals, tồn kho/ledger, tài khoản và quyền khác được giữ nguyên. Dry-run sau áp dụng trả 0 thay đổi. Các kiểm thử API/consumer/UI/concurrency nghiệp vụ ở dòng trên vẫn chưa được thực hiện.
