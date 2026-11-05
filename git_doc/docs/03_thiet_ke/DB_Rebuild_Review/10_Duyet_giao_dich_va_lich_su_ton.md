# C03–C04 · Giao dịch và lịch sử tồn kho

**C03 v0.1 và C04 v0.1 đã duyệt riêng.** Người dùng trả lời “Duyệt C03 v0.1” và “Duyệt C04 v0.1”. [Phiếu v0.1 đã trình](history/10_Duyet_giao_dich_va_lich_su_ton_v0.1_de_xuat.md). Đối chiếu các mục posting_batches và stock_movements trong [snapshot MongoDB](03_Cau_truc_DB_hien_tai.md), BR-06 và BR-24/25 trong [Report 3](../../01_bao_cao/WMSD_Report3_Fix.docx.txt), cùng [điểm tồn C01 và số dư C02](09_Duyet_diem_ton_va_so_du.md). Kết quả duyệt thuộc thiết kế, chưa áp vào DB hoặc code.

## C03 · stock_transactions · Lần ghi nhận biến động tồn

Một bản ghi là **một lần xác nhận thành công làm thay đổi tồn kho**. Ví dụ Confirm TO nội kho chuyển 8 viên từ A sang B. Bản ghi này cho biết người xác nhận, chứng từ nguồn, thời gian và mã của lần thực hiện. C04 chứa từng thay đổi số lượng trong lần xác nhận đó.

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId, tự tạo | ID lần xác nhận thành công |
| `sourceType`, `sourceId` | Mã loại chứng từ và ObjectId, bắt buộc | Xác định phiếu nguồn như phiếu nhập, phiếu xuất, TO hoặc điều chỉnh kiểm kê. Loại chứng từ lấy từ danh mục nghiệp vụ được triển khai |
| `operation` | Mã thao tác, bắt buộc | Phân biệt nhận, xuất, chuyển vị trí, đổi chất lượng hoặc điều chỉnh theo chứng từ |
| `eventKey` | Chuỗi, phần mềm xác định | Nhận diện lần nghiệp vụ trên phiếu nguồn, dùng lại khi gửi lại cùng xác nhận. Cặp phiếu nguồn + thao tác + lần nghiệp vụ là duy nhất |
| `requestKey`, `requestHash` | Chuỗi, bắt buộc | Mã của yêu cầu xác nhận và dấu kiểm nội dung. Cùng mã nhưng khác nội dung thì báo xung đột |
| `performedBy` | ObjectId → users | Người đã thực hiện, lấy từ phiên đăng nhập hợp lệ |
| `occurredAt`, `recordedAt` | Ngày giờ | Thời điểm nghiệp vụ theo phiếu và thời điểm hệ thống ghi thành công. Giữ cả hai để đối chiếu lịch sử |
| `reversedTransactionId` | ObjectId → stock_transactions, tùy chọn | Liên kết lần ghi đảo với lần gốc nếu nghiệp vụ sửa sai được phép |

**Quan hệ.** Một lần C03 có một hoặc nhiều dòng C04. Một phiếu có thể có nhiều lần nghiệp vụ hợp lệ theo luồng của chính phiếu đó. Mỗi lần chỉ ghi các lượng của lần đó. C03 giữ tham chiếu đúng loại phiếu để tra cả nguồn và người thực hiện.

**Ghi nhận an toàn.** Cập nhật số dư, trạng thái chứng từ, C03 và C04 cùng thành công hoặc cùng thất bại. Khóa duy nhất của lần nghiệp vụ chặn ghi lặp ngay cả khi yêu cầu gửi lại có mã request khác. Cùng requestKey và cùng nội dung thì trả lại kết quả đã có sau khi kiểm quyền người yêu cầu. Khác nội dung thì báo xung đột để kiểm tra. Phải xác thực chứng từ, phiên bản và phạm vi kho trước khi trả kết quả hoặc ghi mới.

**Lịch sử.** Giao dịch đã ghi được giữ nguyên. Khi cần sửa sai, lập chứng từ sửa hoặc đảo đủ điều kiện và liên kết về giao dịch gốc. Quyền và điều kiện đảo chi tiết được duyệt ở H35. Phiếu này chốt cách giữ dấu vết. Thời điểm nghiệp vụ quá khứ vẫn phải tuân thủ khóa kiểm kê và ràng buộc phiếu. In lại chứng từ hoặc gửi lại email đọc kết quả đã ghi.

**Quyền.** Người dùng tạo dữ liệu C03 thông qua nghiệp vụ đã được cấp quyền. Không có thao tác nhập tự do một lần biến động vào danh mục. Người được xem lịch sử thấy các giao dịch thuộc phạm vi phiếu/kho của mình. Sales Staff giữ phạm vi hàng khả dụng hoặc nhu cầu liên quan theo C02.

**Ví dụ.** Confirm TO-015 chuyển 8 viên từ A sang B thành công. Mạng chậm khiến người dùng bấm lại. C03 xác định đây vẫn là lần xác nhận của TO-015, trả kết quả lần trước. Tồn được chuyển 8 viên đúng một lần.

## C04 · stock_movements · Chi tiết biến động tồn

Một bản ghi thể hiện **một lượng hàng được tăng, giảm hoặc chuyển giữa hai nhóm tồn** trong một lần C03. Giữ số lượng trước và sau để đối chiếu. Nếu một phiếu có nhiều sản phẩm/lô, mỗi nhóm hàng được ghi thành dòng riêng.

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId | ID dòng lịch sử |
| `transactionId` | ObjectId → C03, bắt buộc | Lần xác nhận chứa dòng này |
| `lineNo` | Số nguyên dương | Thứ tự dòng, duy nhất trong cùng transactionId |
| `sourceLineId` | ID ổn định của dòng chứng từ, bắt buộc | Truy đúng mặt hàng và số lượng trên phiếu nguồn của C03 |
| `fromBalanceId`, `toBalanceId` | ObjectId → C02, tùy loại thao tác | Nhóm tồn giảm và nhóm tồn tăng. Ít nhất một đầu phải có; khi cùng có thì phải là hai nhóm khác nhau |
| `quantityBase` | Decimal128 > 0 | Lượng đã thực hiện theo đơn vị gốc của sản phẩm, tuân thủ nguyên đơn vị khi áp dụng |
| `fromBefore`, `fromAfter` | Decimal128 ≥ 0, khi có nguồn | Số lượng trước/sau tại nguồn. Chênh lệch đúng bằng quantityBase |
| `toBefore`, `toAfter` | Decimal128 ≥ 0, khi có đích | Số lượng trước/sau tại đích. Chênh lệch đúng bằng quantityBase |
| `createdAt` | Ngày giờ, tự ghi | Thời điểm ghi dòng lịch sử. Thời điểm nghiệp vụ tra từ C03 |

**Ví dụ nguồn và đích.**

| Nghiệp vụ | Nguồn trong C02 | Đích trong C02 | Kết quả minh họa |
|---|---|---|---|
| Nhận 8 viên lần đầu vào dữ liệu tồn | Trống | Ô nhận | Tăng 8 viên, với chủ hàng và chất lượng theo kết quả kiểm nhận |
| Chấp nhận 3 viên trước đó đang giữ hộ khách | Nhóm CUSTOMER | Nhóm STORE cùng ô | Giảm giữ hộ 3, tăng hàng shop 3, tổng vật lý giữ nguyên |
| Xuất bán 8 viên | Ô xuất | Trống | Giảm vật lý 8 viên |
| Điều chuyển nội kho 8 viên | Ô A | Ô B | A giảm 8, B tăng 8 |
| Xuất chuyển sang kho khác 8 viên | Ô nguồn | Điểm IN_TRANSIT | Giảm nguồn 8, theo dõi đang chuyển 8 |
| Nhận 8 viên từ kho khác | Điểm IN_TRANSIT | Ô nhận đích | Giảm đang chuyển 8, tăng ô nhận 8 |

**Quy tắc đối chiếu.** Nguồn và đích của cùng một dòng phải tương thích với sản phẩm, lô, chủ hàng và loại nghiệp vụ được phép. Khi chuyển vị trí thì giữ nguyên lô/chất lượng/chủ hàng. Khi đổi chất lượng hoặc chủ hàng phải có chứng từ cho phép và hai nhóm số dư tương ứng. Mỗi dòng bảo toàn số lượng giữa hai đầu khi cả hai đầu cùng tồn tại. Nếu một lần có nhiều dòng tác động cùng nhóm tồn, số lượng trước/sau phải nối tiếp đúng thứ tự lineNo.

**Lịch sử và báo cáo.** Dòng đã ghi được giữ để tra nguồn. Phiếu sửa sai tạo lần ghi mới, không ghi đè số lượng cũ. Báo cáo theo thời điểm thực hiện đọc occurredAt của C03; báo cáo thao tác hệ thống đọc recordedAt. Các số dư và nhật ký phải đối chiếu được tại thời điểm cần kiểm tra.

**Tình trạng duyệt.** C03 v0.1 và C04 v0.1 đều đã duyệt. Quyết định về loại phiếu nguồn, số lần nhận/xuất của từng nghiệp vụ và quyền đảo sẽ theo lượt duyệt chứng từ tương ứng.
