# H06–H08 · Lệnh thao tác kho và yêu cầu điều chuyển

**Phiếu v0.1 · 01/11/2026 · Chờ duyệt riêng H06, H07 và H08.** Quy tắc BF04 đã chốt là “Một TR có nhiều phiếu xuất, tổng không vượt lượng duyệt”. Mỗi TO vẫn xác nhận trọn lệnh một lần. Số lần nhận của từng phiếu xuất sẽ được hỏi khi duyệt H10.

| Chứng từ | Ví dụ tại cửa hàng | Người thao tác mặc định |
|---|---|---|
| H07 · Transfer Request (TR liên kho) | Kho A đề nghị chuyển 100 viên G60 sang kho B. Chủ cửa hàng duyệt nhu cầu này. | Warehouse Staff kho nguồn lập, Store Owner xét duyệt |
| H08 · Internal Transfer Requirement (yêu cầu thao tác trong một kho) | Phiếu xuất đợt đầu cần lấy 60 viên ra khu tập kết. Kho nhận cũng có thể yêu cầu xếp số hàng đạt đã nhận từ cửa kho vào ô lưu trữ. | Warehouse Staff của kho tương ứng |
| H06 · Transfer Order (TO) | Lệnh chỉ rõ lấy hàng từ ô nào, đưa tới ô nào và bao nhiêu. Nhân viên xác nhận sau khi thực hiện. | Warehouse Staff của kho thực hiện |

**BF03** chỉ có hai thao tác trên phần mềm. Nhân viên tạo TO chuyển vị trí rồi xác nhận TO sau khi đã di chuyển hàng. **BF04** bắt đầu bằng TR được duyệt. Mỗi phiếu xuất tham chiếu TR. Khi nhân viên tạo H08, phần mềm sinh TO lấy hàng ở kho nguồn hoặc TO xếp hàng ở kho đích, tùy chứng từ nguồn. Chức năng và mốc ghi tồn dựa trên sơ đồ người dùng đã sửa và mô tả BF04 ngày 30/10. [Luồng BF04 trong dự án](../../../../CODE/BE/building-material-management/src/modules/transfers/BF04_API.md) · [Snapshot MongoDB](03_Cau_truc_DB_hien_tai.md).

## H06 · transfer_orders · Lệnh thao tác kho

Một bản ghi giao một nhiệm vụ trong một kho. Đề xuất dùng chung cấu trúc cho ba loại lệnh sau.

| Loại | Cách tạo | Điều xảy ra khi xác nhận |
|---|---|---|
| RELOCATE · Chuyển vị trí | Người tạo chọn hai ô khác nhau cùng kho, lô và số lượng. | Giảm ở ô nguồn, tăng ở ô đích đúng cùng lượng, lô, chất lượng và chủ sở hữu. Ví dụ chuyển 8 viên từ A-01 có 20 sang A-02 có 5 thì hai ô còn 12 và 13 viên. |
| PICKING · Lấy hàng cho phiếu xuất chuyển kho | Sinh từ H08 của kho nguồn, theo đúng dòng phiếu xuất H09. TO ghi ô lấy và ô tập kết. | Bước 7 đồng thời xác nhận đã xuất đi. Ghi hai chặng ô nguồn → tập kết → đang chuyển trong cùng một giao dịch C03. Phiếu xuất và TO cùng ghi nhận kết quả, chỉ trừ khỏi tổng kho nguồn một lần. |
| PUTAWAY · Xếp hàng đã nhận | Sinh từ H08 của kho đích, theo dòng phiếu nhận H10. | Chuyển phần hàng đạt từ ô nhận đến ô lưu trữ. Tồn toàn kho đích đã được ghi khi nhận hàng. Phần hư hỏng thực nhận được theo dõi ở khu cách ly của chính kho đích. |

| Trường đề xuất | Nội dung và cách dùng |
|---|---|
| `_id`, `orderNo`, `taskType`, `warehouseId` | ID liên kết, mã lệnh duy nhất để tra, loại nhiệm vụ và kho thực hiện. |
| `requirementId`, `createdBy`, `createdAt`, `reason` | TO BF04 liên kết H08 duy nhất và lưu người đã yêu cầu sinh lệnh. TO BF03 do nhân viên tạo trực tiếp, ghi lý do chuyển. |
| `status`, `confirmedBy`, `confirmedAt`, `stockTransactionId` | OPEN → CONFIRMED khi toàn bộ lệnh đã thực hiện và ghi tồn thành công. Lưu giao dịch C03 dùng để truy lại số lượng trước/sau. |
| `cancelledBy`, `cancelledAt`, `cancelReason`, `version` | Khi hủy lệnh đang mở, giữ lý do và người hủy. Phiên bản bảo vệ khi hai thao tác sửa/xác nhận đến cùng lúc. |
| `items[]` | Mỗi dòng có ID cố định, dòng H08 nếu có, sản phẩm, lô B05, nhóm tồn nguồn C02, chất lượng/chủ sở hữu, ô nguồn, ô đích dự kiến, lượng giao thực hiện và lượng xác nhận. Dòng đã xác nhận lưu ô thực tế, quy cách, phân bổ chồng hàng và nhóm tồn tương ứng để truy vết. |

**Quyền và giới hạn.** Với BF03, chỉ người lập còn quyền tại kho mới được sửa, hủy lệnh mở hoặc xác nhận lệnh của mình. Xác nhận một lần cho toàn bộ lượng đã ghi. Nếu thực tế khác kế hoạch thì sửa khi lệnh còn mở rồi kiểm tra lại. Khi lệnh đã xác nhận, xử lý sai sót qua chứng từ điều chỉnh có liên kết. Với BF04, nhân viên đúng kho và có quyền xác nhận nhiệm vụ của kho đó. Người nhận H10 phải khác người đã xác nhận xuất. TO tự sinh lấy phạm vi và mặt hàng từ chứng từ nguồn.

**Kiểm tra khi ghi tồn.** Kiểm tra lại ô, lượng, lô, khóa kiểm kê, quyền sử dụng phần hàng đã giữ và sức chứa tại nơi xếp. Cập nhật số dư, chồng hàng, liên kết giữ hàng, lịch sử và trạng thái trong cùng lần xác nhận. Gửi lại cùng yêu cầu trả về kết quả đã ghi. Đơn vị, hệ số và quy cách được lưu trên từng dòng theo quyết định bỏ UOM. [C03–C04](10_Duyet_giao_dich_va_lich_su_ton.md) · [C05–C06](11_Duyet_giu_hang_va_nguon_cung.md) · [C07–C08](12_Duyet_chong_hang_va_dong_goi_thuc_te.md) · [Quy đổi trên dòng](14_Bo_UOM_va_luu_quy_doi_tren_dong.md).

## H07 · warehouse_transfer_requests · Yêu cầu chuyển giữa hai kho

Một TR ghi nhu cầu chuyển hàng giữa đúng một cặp kho khác nhau. Mỗi phiếu xuất H09 thuộc đúng một TR. Một TR có thể có **0 đến nhiều phiếu xuất** trong vòng đời, kể cả khi đã duyệt nhưng chưa lập phiếu đầu tiên.

| Trường đề xuất | Nội dung và cách dùng |
|---|---|
| `_id`, `requestNo`, `sourceWarehouseId`, `destinationWarehouseId` | Mã yêu cầu duy nhất, kho thực xuất và kho thực nhận. |
| `requestedBy`, `requestedAt`, `reason`, `neededBy` | Người lập tại kho nguồn, thời điểm, lý do điều chuyển và ngày cần tại kho đích nếu có. |
| `approvalStatus`, `reviewedBy`, `reviewedAt`, `rejectionReason`, `approvedRevision` | Chờ duyệt, đã duyệt hoặc từ chối. Người xét phải khác người lập. Nếu từ chối thì bắt buộc ghi lý do. Các phiếu xuất phải truy được phiên bản TR đã duyệt. |
| `items[]` | Mỗi dòng có ID cố định, sản phẩm, yêu cầu lô nếu có, đơn vị nhập và hệ số, lượng đề nghị, lượng được duyệt theo đơn vị gốc, cùng liên kết nhu cầu nếu có. Phiếu xuất tham chiếu đúng ID dòng để kiểm giới hạn. |
| `executionStatus`, `closedBy`, `closedAt`, `version` | Theo dõi chưa xuất, đang thực hiện hoặc đã đóng. Khi hiển thị tiến độ, lấy lượng thực xuất từ H09, thực nhận từ H10 và đang chuyển từ C01/C02. |

**Giới hạn theo từng dòng đã duyệt.** Đề xuất tính lượng còn có thể lập phiếu bằng lượng duyệt trừ lượng đã thực xuất và lượng đã dành cho các phiếu xuất còn mở. Khi phiếu mở được xác nhận, chuyển chính phần đó sang đã xuất. Nếu hủy phiếu chưa xuất, trả lại phần được dành. Kiểm cùng phiên bản dòng TR khi hai nhân viên lập phiếu đồng thời. Có thể xuất nhiều dòng hoặc nhiều lô trong một đợt nếu phù hợp phạm vi đã duyệt. Lượng dư của sản phẩm này không bù cho sản phẩm khác.

Ví dụ TR duyệt **100 viên G60**. Phiếu 1 đã xuất 60, phiếu 2 đang mở 30. Lúc đó chỉ còn **10 viên** để lập phiếu mới. Nếu hủy phiếu 2 trước khi xuất thì còn **40 viên**. Kho đích nhận hàng từ phiếu 1 chỉ làm giảm lượng đang chuyển, không cấp thêm hạn mức xuất. Mỗi phiếu giữ mã, dòng nguồn, thời điểm thực xuất và người xác nhận riêng.

**Quyền và đóng yêu cầu.** Warehouse Staff kho nguồn lập, Store Owner mặc định duyệt hoặc từ chối. Quyền vận hành áp theo A02/A03 và phạm vi kho. Duyệt TR cho phép lập phiếu xuất. Theo C05, giữ hàng thực tế bắt đầu ở phiếu xuất hợp lệ. Kho đích đóng TR khi các dòng duyệt đã được thực hiện, tất cả lượng đang chuyển và chênh lệch đã được đối chiếu, các việc xếp hàng cần thiết đã xong. Với một TR liên quan đến nhiều Sales, Sales có nhu cầu liên quan xem được tiến độ tổng của TR. Ghi chú và bằng chứng nội bộ chỉ hiển thị cho người có quyền nghiệp vụ tương ứng.

## H08 · internal_transfer_requirements · Yêu cầu lấy hoặc xếp hàng

Đề xuất giữ H08 thành **bảng riêng** để trả lời hai câu hỏi khi tra cứu. Phiếu nào phát sinh nhu cầu lấy hoặc xếp hàng? TO nào đã thực hiện nhu cầu đó? Nhân viên chỉ cần lập yêu cầu một lần. Phần mềm đồng thời lưu H08 và sinh H06.

| Trường đề xuất | Nội dung và cách dùng |
|---|---|
| `_id`, `requirementNo`, `purpose`, `warehouseId` | Mã yêu cầu duy nhất, mục đích PICKING hoặc PUTAWAY và kho phải thực hiện. |
| `sourceType`, `sourceId` | PICKING căn cứ phiếu xuất H09 còn hiệu lực tại kho nguồn. PUTAWAY căn cứ phiếu nhận H10 đã ghi hàng thực nhận tại kho đích. |
| `items[]` | ID dòng, ID dòng phiếu nguồn, sản phẩm/lô, lượng gốc, quy đổi và quy cách thực tế. Với picking, chỉ rõ ô lấy và ô tập kết. Với putaway, chỉ rõ ô nhận và ô lưu trữ dự kiến. Có thể chia dòng theo nhiều ô, tổng vẫn phải khớp lượng đưa vào lệnh. |
| `createdBy`, `createdAt`, `status`, `version` | Người và thời điểm yêu cầu. Trạng thái theo lệnh liên kết, mở khi giao việc, hoàn tất khi TO đã xác nhận. Giữ lịch sử nếu hủy trước khi thực hiện. |

**Quan hệ đề xuất.** Mỗi H08 có đúng một H06 tự sinh. Đặt ràng buộc duy nhất trên `transfer_orders.requirementId` đối với TO do H08 sinh. Lưu cả hai trong cùng giao dịch và trả về cùng mã TO nếu gửi lại yêu cầu. Chặn dùng lại cùng phần lượng của dòng H09/H10 trên hai yêu cầu còn hiệu lực. Với picking, tổng lượng của TO bao phủ trọn phiếu xuất thuộc đợt đó. Với putaway, lấy tối đa lượng thực nhận đủ điều kiện xếp. Đề xuất chỉ sinh yêu cầu/lệnh khi có lượng dương cần di chuyển. Nếu toàn bộ hàng lỗi đã đặt vào khu cách ly lúc nhận, phiếu nhận ghi việc xếp hàng đạt là “không áp dụng”. Điểm này khác mô tả BE hiện tại vốn ghi một TO rỗng tự hoàn tất.

**Ví dụ.** Kho A lập phiếu xuất 60 viên theo TR. Nhân viên tạo H08 lấy 60 viên từ A-01 ra khu tập kết. Phần mềm sinh TO lấy hàng cho chính phiếu xuất đó. Tại B, một phiếu nhận ghi 58 viên đạt ở cửa nhận và 2 viên vỡ ở khu cách ly. Nhân viên chọn ô B-03 cho 58 viên. H08 tại B sinh TO xếp 58 viên từ cửa nhận vào B-03. Nếu còn 40 viên trong phạm vi TR, kho A có thể lập phiếu xuất tiếp theo.

## Phạm vi duyệt

H06, H07 và H08 trình theo v0.1. Quan hệ TR → nhiều phiếu xuất và trần lượng từng dòng đã chốt. Cấu trúc H09 (phiếu xuất), H10 (phiếu nhận) và H11 (bàn giao) sẽ được trình riêng. Khi duyệt H10 cần xác định một phiếu xuất có thể được nhận một lần hay nhiều lần. [Danh mục](01_Danh_muc_duyet.md) · [Nhật ký](04_Nhat_ky_duyet.md).
