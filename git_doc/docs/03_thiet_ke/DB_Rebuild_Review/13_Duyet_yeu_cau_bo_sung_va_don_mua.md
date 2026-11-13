# H01–H02 · Yêu cầu bổ sung và Đơn mua hàng

**H01 và H02 v0.1 ĐÃ DUYỆT RIÊNG.** Ngày 02/11/2026, người dùng trả lời “Duyệt H01 v0.1” sau khi đã được giải thích; H02 đã được duyệt trước đó. Giữ nguyên trường và quy tắc đã trình. [Bản ngay trước khi duyệt H01](history/H01_H35_before_approval_20261102/13_Duyet_yeu_cau_bo_sung_va_don_mua.md) lưu nội dung giải thích và quyết định bỏ UOM để đối chiếu. [Phiếu v0.1 đã trình](history/13_Duyet_yeu_cau_bo_sung_va_don_mua_v0.1_de_xuat.md). Cơ sở: BF-01, UC-01–10 trong [Report 3](../../01_bao_cao/WMSD_Report3_Fix.docx.txt), cấu trúc REPLENISHMENT/PO trong [snapshot MongoDB](03_Cau_truc_DB_hien_tai.md), [B08B nhà cung cấp](08B_Nha_cung_cap.md) và [C05–C06](11_Duyet_giu_hang_va_nguon_cung.md). Tài liệu/code cũ là nguồn đối chiếu; các quyết định mới của người dùng được ưu tiên. H01 được duyệt qua câu trả lời riêng, không suy từ việc H02 đã được duyệt. Phần đơn vị/quy cách được sửa theo [Quyết định bỏ UOM và lưu quy đổi trên dòng](14_Bo_UOM_va_luu_quy_doi_tren_dong.md); H01 đã duyệt cả đầu phiếu và dòng nhúng theo cách lưu này.

## Quy tắc RR cập nhật ngày 11/11/2026

Theo quyết định người dùng, số lượng đề nghị do người lập quyết định. Cùng kho nhận và sản phẩm, hệ thống cảnh báo khi có RR khác đang mở, PO còn hàng chưa nhận hoặc tồn khả dụng đủ ngưỡng. Khi chưa có ngưỡng, so tồn khả dụng với lượng dòng đang đề nghị. Người lập xác nhận và giải trình từng dòng có cảnh báo khi lưu hoặc gửi. Chứng từ nguồn được kiểm và lưu để truy vết.

Người duyệt độc lập quyết định lượng được chấp thuận. Có thể đọc cảnh báo hiện tại khi xem xét. Tạo, sửa nháp và phát hành PO dựa trên quyết định RR còn hiệu lực và trần lượng được duyệt.

[Hợp đồng triển khai](../../08_api/REPLENISHMENT_COVERAGE.md) · [Bản trước cập nhật ngày 11/11/2026](history/13_Duyet_yeu_cau_bo_sung_va_don_mua_truoc_canh_bao_2026-11-11.md)

## Những điểm đã chốt trước phiếu này

- Một Replenishment Request (RR) tạo **tối đa một Purchase Order (PO)**. Không hỏi lại hoặc tự đổi thành một RR nhiều PO.
- PO có **giá mua và tổng tiền; chỉ Accountant/Store Owner xem**. Phạm vi giá được chốt trước, sau đó người dùng đã duyệt cả H02 v0.1.
- Nhà cung cấp phải ACTIVE khi được chọn cho PO mới. Sales Staff/Warehouse Staff khởi tạo nhu cầu; Store Owner duyệt; Accountant lập PO theo tài liệu nghiệp vụ đang đối chiếu.
- Hai collection có tên riêng. Dòng hàng nằm trong `items[]` của từng phiếu, có ID ổn định; không tạo collection dòng hàng riêng cho H01/H02 trong phương án này. Cấu trúc đầu phiếu và dòng PO đã duyệt trong H02; cấu trúc đầu phiếu và dòng RR đã duyệt ở H01.

## H01 · replenishment_requests · Yêu cầu bổ sung

### Giải thích dễ hiểu theo phản hồi người dùng

H01 là hồ sơ ghi **kho cần bổ sung hàng gì, bao nhiêu, khi nào và đã được phép mua bao nhiêu**. Sau khi kiểm tra tồn và các nguồn sắp về, nhân viên lập RR cho phần còn thiếu. Chủ cửa hàng xem xét trước khi kế toán dùng kết quả để đặt PO.

**Ví dụ:** Warehouse Staff kiểm tra kho A và đề nghị bổ sung 20 thùng gạch G60, cần trước ngày 05/11/2026. Chủ cửa hàng chỉ duyệt 15 thùng và ghi lý do. H01 giữ cả con số đề nghị 20 và con số được duyệt 15. Accountant lập PO tham chiếu dòng này trong giới hạn 15 thùng. Việc duyệt 15 thùng chưa tăng tồn kho; số lượng thực nhận sẽ được ghi qua phiếu nhập.

| Phần trong H01 | Ví dụ | Tác dụng |
|---|---|---|
| Thông tin chung của yêu cầu | RR-001, kho A, người tạo, lý do thiếu, ngày cần, trạng thái | Biết ai cần hàng cho kho nào và đã duyệt hay chưa |
| Danh sách hàng cần bổ sung | G60, 20 thùng đề nghị, 15 thùng được duyệt | Một phiếu có thể có nhiều sản phẩm, mỗi sản phẩm/nguồn nhu cầu là một dòng |
| Nguồn nhu cầu | Thiếu cho đơn khách, dưới ngưỡng tồn hoặc căn cứ kiểm kê | Giải thích vì sao cần mua và tránh lập nhiều yêu cầu cho cùng phần thiếu |
| Thông tin phê duyệt | Người duyệt, thời gian, lý do, bản nội dung đã duyệt | Chứng minh PO được lập từ đúng nội dung cho phép, không dùng một bản đã bị sửa |

**“Dòng lưu trong phiếu” nghĩa là gì?** Khi mở RR-001, danh sách G60, G80... được lưu ngay trong hồ sơ RR-001. Mỗi dòng có ID riêng do phần mềm tạo để PO trỏ đúng dòng. Người dùng không phải tạo mã dòng bằng tay và không cần mở thêm một bảng nhập độc lập.

**Người dùng cần nhập gì?** Chọn kho, sản phẩm, đơn vị, lượng cần, ngày cần và lý do/nguồn nhu cầu. Hệ số quy đổi được ghi trên dòng theo quy cách thực tế và nguồn đối chiếu. Mã phiếu, ID dòng, phiên bản, người/thời điểm thao tác và các thông tin chống gửi trùng do phần mềm ghi. Các trường kỹ thuật trong bảng thiết kế không đồng nghĩa form có từng ấy ô bắt nhập.

**Quyền mặc định đã duyệt:** Sales Staff tạo khi thiếu cho nhu cầu khách; Warehouse Staff tạo khi kho cần bổ sung; Store Owner duyệt và phải khác người tạo; Accountant xem kết quả đã duyệt để lập PO. H01 không lưu giá mua. Mỗi RR cho một kho và tạo tối đa một PO như đã chốt. Phần giải thích không thay cấu trúc v0.1; trạng thái đã duyệt căn cứ câu trả lời “Duyệt H01 v0.1” sau đó.

### Ý nghĩa và quan hệ đã duyệt

Một bản ghi là một yêu cầu bổ sung cho **một kho nhận**, có một hoặc nhiều dòng sản phẩm. Lý do có thể là thiếu cho đơn khách, dưới ngưỡng tồn, kết quả kiểm kê/hàng lỗi hoặc nhu cầu kho có giải trình. Hai nguồn nhu cầu khác nhau có thể ghi thành hai dòng cùng sản phẩm để giữ đúng nguồn.

| Quan hệ | Ý nghĩa |
|---|---|
| Kho 1 — n RR | Mỗi RR có đúng một kho cần bổ sung |
| User 1 — n RR | Một người tạo nhiều yêu cầu; mỗi yêu cầu có một người tạo |
| RR 1 — n dòng RR | Dòng nhúng trong `items[]`, mỗi dòng tham chiếu một sản phẩm và nguồn nhu cầu khi có |
| RR 1 — 0..1 PO | Một yêu cầu chưa có PO hoặc đã có đúng một PO; khóa ở H02 bảo đảm điều này |
| RR 1 — n quyết định | Mỗi lần gửi lại cần quyết định cho đúng bản nội dung; lịch sử duyệt D05 được trình riêng |

### Trường đầu phiếu

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId | ID RR |
| `code` | Chuỗi, tự sinh, duy nhất/cố định | Mã dễ tra như RR-0001; không tái cấp |
| `warehouseId` | ObjectId → B01, bắt buộc | Kho cần bổ sung |
| `reason` | Chuỗi, bắt buộc | Lý do yêu cầu ở cấp phiếu |
| `neededBy` | Ngày giờ, bắt buộc | Thời điểm cần hàng; dòng có thể có hạn riêng |
| `approvalStatus` | DRAFT, SUBMITTED, RETURNED, APPROVED, REJECTED, CANCELLED | Trạng thái xét duyệt; không dùng trạng thái này để khẳng định đã nhận hàng |
| `revision` | Số nguyên dương | Bản nội dung gửi duyệt. Sửa nội dung đã gửi tạo bản mới; bản cũ giữ được để đối chiếu |
| `approvedRevision` | Số nguyên hoặc null | Bản được duyệt còn hiệu lực; PO phải tham chiếu đúng bản này |
| `createdBy`, `updatedBy` | ObjectId → A01 | Người tạo và người sửa gần nhất |
| `submittedAt` | Ngày giờ hoặc null | Mốc gửi duyệt gần nhất; lịch sử giữ các lần trước |
| `latestDecision` | Dữ liệu quyết định hoặc null | Tham chiếu quyết định D05, hành động, người, thời gian và lý do; là thông tin hiện tại để hiển thị, không thay lịch sử |
| `creationKey` | Chuỗi duy nhất theo người tạo | Chặn tạo hai RR khi gửi lại cùng thao tác |
| `version`, `createdAt`, `updatedAt` | Phiên bản cập nhật và ngày giờ | Chống ghi đè đồng thời; `version` khác bản nội dung nghiệp vụ `revision` |

### Dòng yêu cầu — items[]

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id`, `lineNo` | ObjectId ổn định; số thứ tự | Phiếu khác liên kết bằng ID dòng, không dùng vị trí trong mảng |
| `productId` | ObjectId → B04 | Sản phẩm theo hãng và SKU đã duyệt |
| `productSnapshot` | Mã hãng/SKU, tên và đơn vị gốc tại lúc lập | Đọc phiếu cũ không bị đổi theo tên danh mục mới |
| `enteredUnit`, `baseUnitSnapshot`, `baseUnitsPerUnit`, `packagingSnapshot` | Dữ liệu nhúng trực tiếp trên dòng | Đơn vị nhập, đơn vị gốc, hệ số thực dùng và quy cách kiện khi có; nhập bằng đơn vị gốc dùng hệ số 1. Không tham chiếu B03/B06 |
| `requestedQty`, `requestedQtyBase` | Decimal128 > 0 | Lượng đề nghị ở đơn vị nhập và đơn vị gốc; phần mềm kiểm hai giá trị khớp |
| `approvedQtyBase` | Decimal128 ≥ 0 hoặc null trước quyết định | Lượng Owner chấp thuận, không vượt lượng đề nghị; có thể duyệt ít hơn và ghi lý do |
| `sourceType`, `sourceRef` | SALES_DEMAND, STOCK_THRESHOLD, STOCKTAKE, DEFECT hoặc OTHER; tham chiếu nguồn khi có | Truy về dòng SO, thiết lập ngưỡng và phiên bản, kiểm kê/hồ sơ lỗi. Loại nguồn và tham chiếu phải khớp. Theo quyết định 10/11/2026, lý do từng dòng là tùy chọn. Mọi dòng có cảnh báo cần xác nhận và giải trình độc lập. |
| `requiredBatchId`, `requiredTone`, `requiredCalibre` | Tham chiếu B05 hoặc chuỗi, khi nhu cầu có yêu cầu | Giữ điều kiện tương thích từ nguồn, không tự thay lô/tông/cỡ để coi là đã đáp ứng |
| `neededBy`, `note` | Ngày giờ/chuỗi, tùy chọn | Hạn riêng của dòng, nếu trống dùng hạn đầu phiếu; ghi chú nhu cầu |
| `items[].details` và snapshot gửi duyệt | Số liệu có thời điểm và tham chiếu nguồn | Tồn khả dụng, lượng RR mở, lượng PO đang về, ngưỡng và mục tiêu, cùng xác nhận và giải trình nếu có. |

### Vòng đời, quyền và trần lượng

1. **Sales Staff/Warehouse Staff** tạo DRAFT theo phạm vi nhu cầu/kho được giao. Người lập nhập lượng đề nghị và xác nhận kèm giải trình nếu có cảnh báo.
2. Người tạo sửa DRAFT hoặc RETURNED rồi gửi SUBMITTED. **Store Owner** duyệt đúng bản nội dung, trả sửa hoặc từ chối; người duyệt phải khác `createdBy` theo userId. Từ chối/trả sửa/duyệt giảm lượng cần lý do. Ít nhất một dòng có lượng được duyệt dương mới trở thành APPROVED.
3. Sau APPROVED, Accountant được lập PO trong trần dòng đã duyệt. Kiểm bản được duyệt và quyết định mới nhất khi lập, sửa nháp và phát hành. Sửa sản phẩm/kho/điều kiện/lượng của bản đã duyệt phải gửi lại duyệt. Nếu đã có PO, kiểm các lượng đang đặt/đã nhận trước thay đổi; không ghi đè dữ liệu mà PO đã tham chiếu.
4. Người tạo có thể hủy nháp hoặc rút yêu cầu đang chờ chưa có quyết định. Hủy phần đã duyệt cần quyền quyết định của Store Owner và lý do; phần đã có PO đi theo xử lý PO, không chỉ đổi trạng thái RR để bỏ nghĩa vụ mua. Lịch sử các lần gửi/duyệt được giữ.
5. Tiến độ đặt mua và nhận hàng được đọc từ PO và phiếu nhập. Đã lập PO không đồng nghĩa hàng đã về. Phần chưa được đặt vẫn hiển thị và xử lý trên PO duy nhất đó hoặc đóng phần không tiếp tục theo quyết định hợp lệ.

**Không thay đổi tồn.** Tạo, sửa, gửi hoặc duyệt RR không tăng tồn và không tạo giữ hàng C05. Lựa chọn nguồn đã có vẫn phải đúng C06; RR chưa thành PO không được tính như hàng đã đặt chắc chắn sắp về.

**Phạm vi xem.** Owner/Accountant xem theo quyền nghiệp vụ; Sales/Warehouse xem hồ sơ của mình hoặc được phân công. Quyền theo A02/A03 luôn kèm phạm vi kho/hồ sơ và trạng thái. RR không chứa giá mua hoặc làm lộ giá PO qua dữ liệu liên kết.

## H02 · purchase_orders · Đơn mua hàng

**Nguồn quyết định cập nhật H02 (user, 2026-11-11).** Kế toán chốt với NCC trước khi lập PO. Bỏ bước và dữ liệu xác nhận NCC trên PO. Chỉ sửa PO nháp. Sau phát hành, dùng quy trình đề nghị, duyệt và thực hiện đóng phần chưa nhận.

### Quan hệ và cách tổ chức đã duyệt

Một PO được Accountant lập từ **một RR đã duyệt**, cho **một nhà cung cấp và một kho nhận**. Chiều ngược của quan hệ đã được duyệt cùng H02: không gộp nhiều RR vào một PO. Một RR vẫn tối đa một PO như đã chốt; PO bị hủy vẫn giữ liên kết lịch sử, không xóa để tạo PO khác cho cùng RR. Nếu cần đặt đơn khác sau hủy hoặc tách nhà cung cấp, lập RR mới có liên kết lý do và đối chiếu lượng còn thiếu.

| Quan hệ | Ý nghĩa |
|---|---|
| RR 1 — 0..1 PO; PO — đúng 1 RR | `replenishmentRequestId` duy nhất trên toàn bộ PO, kể cả PO đã hủy |
| Supplier 1 — n PO | Mỗi PO thuộc đúng một nhà cung cấp; chọn hồ sơ ACTIVE cho PO mới |
| Kho 1 — n PO | Mỗi PO nhận vào một kho, khớp RR; chuyển tiếp sang kho khác dùng nghiệp vụ chuyển kho |
| PO 1 — n dòng PO | Dòng nhúng trong `items[]`; mỗi dòng trỏ đúng một dòng RR và bản duyệt |
| PO 1 — 0..n phiếu nhập | Mỗi lần hàng đến có thông tin ngày và lượng riêng; H03–H05 trình tiếp |
| Dòng PO n — n nhu cầu qua C06 | Nguồn mua được phân bổ trong trần lượng, không biến thành tồn khả dụng trước nhận |

### Trường đầu phiếu

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id`, `code` | ObjectId; mã tự sinh duy nhất/cố định | ID và mã PO để tra cứu |
| `replenishmentRequestId`, `approvedRequestRevision` | ObjectId → H01; số bản đã duyệt | Chứng minh căn cứ được mua |
| `supplierId`, `supplierSnapshot` | ObjectId → B08B; mã/tên/liên hệ lúc đặt | Nhà cung cấp và thông tin lịch sử trên PO |
| `warehouseId` | ObjectId → B01 | Kho nhận của PO, khớp RR |
| `orderDate`, `expectedOn` | Ngày giờ | Ngày đặt và ngày dự kiến chung cho lượng chưa nhận |
| `status` | DRAFT, OPEN, PARTIALLY_RECEIVED, COMPLETED, CLOSED_SHORT, CANCELLED | Nháp; đang đặt; đã nhận một phần; nhận đủ; đóng phần thiếu được phép; hủy khi chưa có phần thực hiện |
| `currency` | VND trong phương án v0.1 | Đơn vị tiền của PO; chưa đề xuất đa tiền tệ |
| `totalAmount` | Decimal128 ≥ 0, phần mềm tính | Tổng giá trị theo lượng đặt của phiên bản PO hiện tại; không phải giá trị thực nhận hoặc số tiền đã thanh toán |
| `note` | Chuỗi, tùy chọn | Ghi chú nội bộ |
| `createdBy`, `updatedBy` | ObjectId → A01 | Người lập và người cập nhật |
| `issuedAt`, `closedAt` | Ngày giờ hoặc null | Mốc ghi nhận đã đặt và kết thúc; không mặc nhiên là đã gửi email hoặc đã trả tiền |
| `closureDecisionRef`, `closureReason` | Quyết định D05 và lý do, khi đóng thiếu/hủy cần quyết định | Căn cứ xử lý phần không tiếp tục nhận |
| `revision`, `version`, `createdAt`, `updatedAt` | Bản nội dung, phiên bản cập nhật và ngày giờ | Giữ phiên bản giá/lượng/ngày dự kiến và chống sửa đè |
| `creationKey` | Chuỗi duy nhất theo người tạo | Chặn tạo lặp khi gửi lại; khóa duy nhất RR vẫn kiểm đồng thời |

### Dòng đơn mua — items[]

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id`, `lineNo` | ObjectId ổn định; số thứ tự | ID để nhập hàng, trả hàng và phân bổ nguồn tham chiếu |
| `requestItemId` | ID dòng H01, bắt buộc | Dòng được duyệt tương ứng; phải thuộc RR đầu phiếu |
| `productId`, `productSnapshot` | B04 và bản thông tin lúc đặt | Khớp sản phẩm được duyệt, giữ SKU hãng/tên/đơn vị gốc |
| `enteredUnit`, `baseUnitSnapshot`, `baseUnitsPerUnit`, `packagingSnapshot` | Dữ liệu nhúng trực tiếp trên dòng | Đơn vị đặt và quy đổi của lần đặt; không lấy hệ số mới để viết lại lượng cũ. Nhập hàng khác quy cách đối chiếu bằng lượng gốc |
| `orderedQty`, `orderedQtyBase` | Decimal128 > 0 | Lượng đặt ở đơn vị nhập và đơn vị gốc; không vượt trần RR được duyệt |
| `unitPurchasePrice` | Decimal128 ≥ 0 | Giá mua đã chốt cho **một đơn vị đặt** của dòng, chẳng hạn một thùng; không tự hiểu là giá một viên |
| `lineAmount` | Decimal128 ≥ 0, phần mềm tính | `orderedQty × unitPurchasePrice`. Tính thập phân chính xác, không nhân theo đơn vị gốc nếu giá nhập theo thùng |
| `note` | Chuỗi tùy chọn, tối đa 2000 ký tự | Ghi chú dòng, ví dụ lô NCC báo giao. Kho chọn lô thực nhận độc lập với ghi chú. Quyết định của người dùng ngày 13/11/2026, phương án A; từ 14/11/2026 không còn tách dòng PO theo lô. |
| `requiredBatchId`, `requiredTone`, `requiredCalibre` | Theo yêu cầu được duyệt, khi có | Điều kiện hàng nhà cung cấp cần đáp ứng; lô thực nhập xác định tại kiểm nhận |
| `cancelledRemainderQtyBase`, `cancellationDecisionRef` | Decimal128 ≥ 0 và quyết định liên quan | Phần chưa nhận được phép ngừng chờ; không nhập số lượng đã hủy thành hàng nhận |

### Giá mua và quyền xem đã chốt

Theo câu trả lời mới, giá mua và tổng tiền chỉ hiển thị cho **Accountant/Store Owner**. Warehouse Staff chỉ nhận mã PO, NCC, kho, sản phẩm, đơn vị, số lượng, ngày dự kiến và dữ liệu phục vụ kiểm nhận. Sales Staff xem nguồn/tiến độ nhu cầu được phép, không xem giá mua. Administrator không tự có quyền xem giá vì là người quản lý tài khoản. Không tự suy rộng quyền giá sang role tùy chỉnh từ quyền xem PO chung; nếu cần mở rộng sẽ trình riêng theo quyết định mới, không thêm lại giới hạn vai trò chung đã bỏ ở A03.

Bộ lọc quyền áp dụng cả chi tiết, danh sách, xuất file, thông báo, lịch sử, lỗi API và chứng từ đính kèm. Bản chứng từ có giá phải có quyền riêng; nếu Warehouse Staff cần nhận hàng thì cung cấp phần thông tin không có giá. Không chỉ ẩn cột ở giao diện trong khi API vẫn trả giá.

**Cách tính v0.1 đã duyệt:** Accountant nhập giá mua cuối cùng đã thỏa thuận cho đơn vị trên dòng; tổng tiền bằng tổng `lineAmount`. Đóng thiếu không tự viết lại lượng đặt và tổng tiền của bản đã đặt; lượng không nhận được trình bày riêng để phân biệt với giá trị thực nhận. Không tự thêm cơ chế tính VAT, chiết khấu, phí vận chuyển hoặc thanh toán vào bảng này. Đây là giá trị của đơn đặt, không phải công nợ hay số tiền đã trả. Nếu cần tách các khoản thương mại đó, phải chốt cách tính trước khi mở rộng cấu trúc. Giá và lượng của mỗi bản đã đặt phải truy lại được.

### Đặt, nhận, sửa và đóng PO

1. Accountant tạo DRAFT từ bản RR APPROVED còn hiệu lực, chọn một NCC ACTIVE và kho đúng RR. Mỗi dòng RR có tối đa một dòng PO; lượng gốc của dòng không vượt lượng được duyệt. Đối chiếu lượng khi đặt và khi nhận bằng đơn vị gốc. Theo quyết định của người dùng ngày 14/11/2026, PO không tách dòng theo lô NCC báo giao: việc tách theo lô diễn ra khi kiểm hàng và nhập kho. Quyết định này thay phương án tách dòng PO ngày 13/11/2026.
2. Accountant phát hành nháp sang OPEN và ghi thời điểm phát hành. BE kiểm lại lượng gốc theo từng dòng RR trước khi phát hành. Việc lập hoặc phát hành PO chỉ ghi chứng từ đặt mua.
3. Mỗi lần hàng đến ghi phiếu nhận theo đúng dòng PO. Tiến độ phải phân biệt lượng mang đến, lượng chấp nhận sở hữu, lượng chờ/giữ hộ và từ chối. Lượng đã nhận lấy từ chứng từ đã ghi hợp lệ, không nhập tay ở PO. Cảnh báo RR hiển thị ngày dự kiến chung và phần PO chưa nhận, kể cả khi ngày dự kiến sau hạn cần của RR. Chi tiết nhận hàng H03–H05 được trình riêng.
4. `còn phải nhận = lượng đặt − lượng đã chấp nhận theo phiếu nhập hợp lệ − phần chưa nhận được duyệt hủy`. Các lượng quy về đơn vị gốc, không âm. Hàng thừa/sai không tự cộng vào lượng đã hoàn thành PO. Hàng đã nhận rồi trả NCC giữ lịch sử nhập gốc; việc NCC giao bù phải có nguồn liên kết và trần nhận riêng được duyệt ở luồng trả, không tự mở lại trần vô hạn.
5. Sửa nội dung khi còn DRAFT, trong phạm vi RR đã duyệt. Khi PO `OPEN` hoặc `PARTIAL`, Accountant có thể đổi ngày dự kiến chung và phải ghi lý do. Sau phát hành, nếu ngừng chờ một phần hàng, Accountant đề nghị, người có thẩm quyền duyệt độc lập, rồi Accountant thực hiện đóng lượng chưa nhận đủ điều kiện. Lượng đặt, giá mua và chứng từ nhập đã ghi được giữ để đối chiếu.
6. Nhận đủ các dòng hợp lệ và xử lý xong các chênh lệch thuộc PO thì COMPLETED. Nếu không nhận phần còn lại, Store Owner cho phép đóng thiếu có lý do rồi CLOSED_SHORT; PO đã nhận một phần không đổi thành CANCELLED để xóa lịch sử. Hủy khi chưa có phần thực hiện cũng phải có căn cứ và giải phóng/đánh giá lại các nguồn C06 liên quan. Thông báo/số liệu đặt lại chỉ là đề xuất, không tự mua thay.

**Bảo toàn dữ liệu.** Dòng hàng có ID ổn định. Nội dung đã phát hành, lần đổi ngày dự kiến, chứng từ nhận hàng và quyết định đóng phần chưa nhận được giữ để đối chiếu. API hiện hành ghi lượng hủy và quyết định đóng riêng với lượng đặt.

## Ví dụ liên kết

RR-001 được duyệt 20 thùng G60, hệ số 4 viên/thùng, cho kho A. Accountant lập PO-001 từ RR-001 cho NCC-01: đặt 20 thùng, giá mua 120.000 đồng/thùng, tổng 2.400.000 đồng. Nhận đợt đầu 8 thùng hợp lệ, tương đương 32 viên; còn phải nhận 12 thùng hoặc 48 viên. Đợt thứ hai có phiếu nhập, ngày nhận và kết quả kiểm riêng. Warehouse Staff thấy số lượng, ngày dự kiến và các phiếu nhận. Giá mua chỉ hiển thị cho Accountant và Store Owner. Số liệu chỉ minh họa, không phải giá thị trường.

H02 v0.1 đã duyệt đầu phiếu, dòng nhúng, quan hệ mỗi PO đúng một RR/NCC/kho, nhận nhiều đợt, giá mua và lịch giao. Quyết định ngày 11/11/2026 bỏ lịch giao từng dòng và cập nhật quy tắc lập, sửa, đổi ngày dự kiến và đóng PO như trên. H01 v0.1 đã duyệt đầu phiếu, dòng nhúng, nguồn nhu cầu, bản duyệt và quyền sau giải thích. Các bảng nhập/kiểm nhận, lịch sử và trả hàng giữ kết quả duyệt theo phiếu riêng.
