# H01–H02 · Yêu cầu bổ sung và Đơn mua hàng

**Phiếu v0.1 · H01 và H02 CHỜ DUYỆT riêng.** Cập nhật 01/11/2026. Cơ sở: BF-01, UC-01–10 trong [Report 3](../../01_bao_cao/WMSD_Report3_Fix.docx.txt), cấu trúc REPLENISHMENT/PO trong [snapshot MongoDB](03_Cau_truc_DB_hien_tai.md), [B08B nhà cung cấp](08B_Nha_cung_cap.md) và [C05–C06](11_Duyet_giu_hang_va_nguon_cung.md). Tài liệu/code cũ là nguồn đối chiếu; các quyết định mới của người dùng được ưu tiên.

## Những điểm đã chốt trước phiếu này

- Một Replenishment Request (RR) tạo **tối đa một Purchase Order (PO)**. Không hỏi lại hoặc tự đổi thành một RR nhiều PO.
- PO có **giá mua và tổng tiền; chỉ Accountant/Store Owner xem**, theo câu trả lời mới. Đây mới là quyết định về phạm vi giá, chưa phải duyệt toàn bộ cấu trúc H02.
- Nhà cung cấp phải ACTIVE khi được chọn cho PO mới. Sales Staff/Warehouse Staff khởi tạo nhu cầu; Store Owner duyệt; Accountant lập PO theo tài liệu nghiệp vụ đang đối chiếu.
- Đề xuất hai collection có tên riêng. Dòng hàng nằm trong `items[]` của từng phiếu, có ID ổn định; không tạo collection dòng hàng riêng cho H01/H02 trong phương án này. Các trường dòng bên dưới là một phần của nội dung cần duyệt.

## H01 · replenishment_requests · Yêu cầu bổ sung

### Ý nghĩa và quan hệ đề xuất

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
| `unitId`, `conversionId`, `conversionSnapshot` | Tham chiếu B03/B06 và hệ số chốt | Đơn vị nhân viên nhập và hệ số sang đơn vị gốc; nhập bằng đơn vị gốc dùng hệ số 1 |
| `requestedQty`, `requestedQtyBase` | Decimal128 > 0 | Lượng đề nghị ở đơn vị nhập và đơn vị gốc; phần mềm kiểm hai giá trị khớp |
| `approvedQtyBase` | Decimal128 ≥ 0 hoặc null trước quyết định | Lượng Owner chấp thuận, không vượt lượng đề nghị; có thể duyệt ít hơn và ghi lý do |
| `sourceType`, `sourceRef` | SALES_DEMAND, STOCK_THRESHOLD, STOCKTAKE, DEFECT hoặc OTHER; tham chiếu nguồn khi có | Truy về dòng SO, thiết lập ngưỡng và phiên bản, kiểm kê/hồ sơ lỗi; OTHER cần lý do. Loại nguồn và tham chiếu phải khớp |
| `requiredBatchId`, `requiredTone`, `requiredCalibre` | Tham chiếu B05 hoặc chuỗi, khi nhu cầu có yêu cầu | Giữ điều kiện tương thích từ nguồn, không tự thay lô/tông/cỡ để coi là đã đáp ứng |
| `neededBy`, `note` | Ngày giờ/chuỗi, tùy chọn | Hạn riêng của dòng, nếu trống dùng hạn đầu phiếu; ghi chú nhu cầu |
| `coverageSnapshot` | Số liệu có thời điểm và tham chiếu nguồn | Lượng còn nghĩa vụ, đã giữ, nguồn dự kiến đúng hạn và thiếu tại lúc gửi. Chỉ là căn cứ lịch sử; khi duyệt/lập PO phải tính lại |

### Vòng đời, quyền và trần lượng

1. **Sales Staff/Warehouse Staff** tạo DRAFT theo phạm vi nhu cầu/kho được giao. Chỉ phần thiếu sau đối chiếu nguồn hợp lệ mới được gửi. Các RR đang mở cho cùng nhu cầu cũng phải được đối chiếu để tránh hai người cùng đề nghị trùng.
2. Người tạo sửa DRAFT hoặc RETURNED rồi gửi SUBMITTED. **Store Owner** duyệt đúng bản nội dung, trả sửa hoặc từ chối; người duyệt phải khác `createdBy` theo userId. Từ chối/trả sửa/duyệt giảm lượng cần lý do. Ít nhất một dòng có lượng được duyệt dương mới trở thành APPROVED.
3. Sau APPROVED, Accountant được lập PO trong trần dòng đã duyệt. Sửa sản phẩm/kho/điều kiện/lượng của bản đã duyệt phải gửi lại duyệt. Nếu đã có PO, kiểm các lượng đang đặt/đã nhận trước thay đổi; không ghi đè dữ liệu mà PO đã tham chiếu.
4. Người tạo có thể hủy nháp hoặc rút yêu cầu đang chờ chưa có quyết định. Hủy phần đã duyệt cần quyền quyết định của Store Owner và lý do; phần đã có PO đi theo xử lý PO, không chỉ đổi trạng thái RR để bỏ nghĩa vụ mua. Lịch sử các lần gửi/duyệt được giữ.
5. Tiến độ đặt mua và nhận hàng được đọc từ PO và phiếu nhập. Đã lập PO không đồng nghĩa hàng đã về. Phần chưa được đặt vẫn hiển thị và xử lý trên PO duy nhất đó hoặc đóng phần không tiếp tục theo quyết định hợp lệ.

**Không thay đổi tồn.** Tạo, sửa, gửi hoặc duyệt RR không tăng tồn và không tạo giữ hàng C05. Lựa chọn nguồn đã có vẫn phải đúng C06; RR chưa thành PO không được tính như hàng đã đặt chắc chắn sắp về.

**Phạm vi xem.** Owner/Accountant xem theo quyền nghiệp vụ; Sales/Warehouse xem hồ sơ của mình hoặc được phân công. Quyền theo A02/A03 luôn kèm phạm vi kho/hồ sơ và trạng thái. RR không chứa giá mua hoặc làm lộ giá PO qua dữ liệu liên kết.

## H02 · purchase_orders · Đơn mua hàng

### Quan hệ và cách tổ chức đề xuất

Một PO được Accountant lập từ **một RR đã duyệt**, cho **một nhà cung cấp và một kho nhận**. Đây là đề xuất chiều ngược của quan hệ: không gộp nhiều RR vào một PO. Một RR vẫn tối đa một PO như đã chốt; PO bị hủy vẫn giữ liên kết lịch sử, không xóa để tạo PO khác cho cùng RR. Nếu cần đặt đơn khác sau hủy hoặc tách nhà cung cấp, lập RR mới có liên kết lý do và đối chiếu lượng còn thiếu.

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
| `orderDate`, `expectedDeliveryAt` | Ngày giờ | Ngày đặt và ngày dự kiến mặc định cho lượng chưa nhận; lịch riêng của dòng được ưu tiên |
| `status` | DRAFT, OPEN, PARTIALLY_RECEIVED, COMPLETED, CLOSED_SHORT, CANCELLED | Nháp; đang đặt; đã nhận một phần; nhận đủ; đóng phần thiếu được phép; hủy khi chưa có phần thực hiện |
| `currency` | VND trong phương án v0.1 | Đơn vị tiền của PO; chưa đề xuất đa tiền tệ |
| `totalAmount` | Decimal128 ≥ 0, phần mềm tính | Tổng giá trị theo lượng đặt của phiên bản PO hiện tại; không phải giá trị thực nhận hoặc số tiền đã thanh toán |
| `supplierReference`, `note` | Chuỗi, tùy chọn | Mã xác nhận/ghi chú của nhà cung cấp và ghi chú nội bộ |
| `createdBy`, `updatedBy` | ObjectId → A01 | Người lập và người cập nhật |
| `issuedAt`, `closedAt` | Ngày giờ hoặc null | Mốc ghi nhận đã đặt và kết thúc; không mặc nhiên là đã gửi email hoặc đã trả tiền |
| `closureDecisionRef`, `closureReason` | Quyết định D05 và lý do, khi đóng thiếu/hủy cần quyết định | Căn cứ xử lý phần không tiếp tục nhận |
| `revision`, `version`, `createdAt`, `updatedAt` | Bản nội dung, phiên bản cập nhật và ngày giờ | Giữ phiên bản giá/lượng/lịch và chống sửa đè |
| `creationKey` | Chuỗi duy nhất theo người tạo | Chặn tạo lặp khi gửi lại; khóa duy nhất RR vẫn kiểm đồng thời |

### Dòng đơn mua — items[]

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id`, `lineNo` | ObjectId ổn định; số thứ tự | ID để nhập hàng, trả hàng và phân bổ nguồn tham chiếu |
| `requestItemId` | ID dòng H01, bắt buộc | Dòng được duyệt tương ứng; phải thuộc RR đầu phiếu |
| `productId`, `productSnapshot` | B04 và bản thông tin lúc đặt | Khớp sản phẩm được duyệt, giữ SKU hãng/tên/đơn vị gốc |
| `unitId`, `conversionId`, `conversionSnapshot` | B03/B06 và hệ số chốt | Đơn vị đặt và hệ số của lần đặt; không lấy hệ số mới để viết lại lượng cũ |
| `orderedQty`, `orderedQtyBase` | Decimal128 > 0 | Lượng đặt ở đơn vị nhập và đơn vị gốc; không vượt trần RR được duyệt |
| `unitPurchasePrice` | Decimal128 ≥ 0 | Giá mua đã chốt cho **một đơn vị đặt** của dòng, chẳng hạn một thùng; không tự hiểu là giá một viên |
| `lineAmount` | Decimal128 ≥ 0, phần mềm tính | `orderedQty × unitPurchasePrice`. Tính thập phân chính xác, không nhân theo đơn vị gốc nếu giá nhập theo thùng |
| `requiredBatchId`, `requiredTone`, `requiredCalibre` | Theo yêu cầu được duyệt, khi có | Điều kiện hàng nhà cung cấp cần đáp ứng; lô thực nhập xác định tại kiểm nhận |
| `supplierConfirmedQtyBase` | Decimal128 ≥ 0, mặc định 0 | Tổng lượng nhà cung cấp đã xác nhận đáp ứng, không vượt lượng đặt hợp lệ |
| `deliverySchedule[]` | Các mốc xác nhận có ID, lượng đơn vị gốc và ngày dự kiến | Cho phép NCC hẹn nhiều đợt cho một dòng; tổng lượng lịch không vượt lượng xác nhận. Ngày chưa rõ không được coi là nguồn bù đúng hạn |
| `supplierConfirmedBy`, `supplierConfirmedAt`, `confirmationEvidenceRefs` | Người ghi nhận, thời điểm và chứng cứ | Accountant ghi lại xác nhận thực tế của NCC; không cần tài khoản nhà cung cấp |
| `cancelledRemainderQtyBase`, `cancellationDecisionRef` | Decimal128 ≥ 0 và quyết định liên quan | Phần chưa nhận được phép ngừng chờ; không nhập số lượng đã hủy thành hàng nhận |

### Giá mua và quyền xem đã chốt

Theo câu trả lời mới, giá mua và tổng tiền chỉ hiển thị cho **Accountant/Store Owner**. Warehouse Staff chỉ nhận mã PO, NCC, kho, sản phẩm, đơn vị, số lượng, lịch giao và dữ liệu phục vụ kiểm nhận. Sales Staff xem nguồn/tiến độ nhu cầu được phép, không xem giá mua. Administrator không tự có quyền xem giá vì là người quản lý tài khoản. Không tự suy rộng quyền giá sang role tùy chỉnh từ quyền xem PO chung; nếu cần mở rộng sẽ trình riêng theo quyết định mới, không thêm lại giới hạn vai trò chung đã bỏ ở A03.

Bộ lọc quyền áp dụng cả chi tiết, danh sách, xuất file, thông báo, lịch sử, lỗi API và chứng từ đính kèm. Bản chứng từ có giá phải có quyền riêng; nếu Warehouse Staff cần nhận hàng thì cung cấp phần thông tin không có giá. Không chỉ ẩn cột ở giao diện trong khi API vẫn trả giá.

**Đề xuất cách tính v0.1:** Accountant nhập giá mua cuối cùng đã thỏa thuận cho đơn vị trên dòng; tổng tiền bằng tổng `lineAmount`. Đóng thiếu không tự viết lại lượng đặt và tổng tiền của bản đã đặt; lượng không nhận được trình bày riêng để phân biệt với giá trị thực nhận. Không tự thêm cơ chế tính VAT, chiết khấu, phí vận chuyển hoặc thanh toán vào bảng này. Đây là giá trị của đơn đặt, không phải công nợ hay số tiền đã trả. Nếu cần tách các khoản thương mại đó, phải chốt cách tính trước khi mở rộng cấu trúc. Giá và lượng của mỗi bản đã đặt phải truy lại được.

### Đặt, nhận, sửa và đóng PO

1. Accountant tạo DRAFT từ bản RR APPROVED còn hiệu lực, chọn một NCC ACTIVE và kho đúng RR. Một dòng RR có thể được chia thành các dòng PO theo quy cách khi cần, nhưng tổng lượng gốc của mọi dòng tham chiếu nó không vượt lượng được duyệt. Quy cách khi nhận có thể khác quy cách đặt, phải đối chiếu bằng đơn vị gốc.
2. Ghi nhận đã đặt chuyển OPEN. Accountant ghi xác nhận lượng/lịch của NCC. Việc xem, tạo PO, ghi lịch hoặc in/gửi chứng từ không tạo tồn và không tự lập phiếu nhập.
3. Mỗi lần hàng đến ghi phiếu nhận theo đúng dòng PO. Tiến độ phải phân biệt lượng mang đến, lượng chấp nhận sở hữu, lượng chờ/giữ hộ và từ chối. Lượng đã nhận lấy từ chứng từ đã ghi hợp lệ, không nhập tay ở PO. Quan hệ phiếu nhận với mốc lịch NCC phải xác định được trước khi dùng lịch để tính C06 đúng hạn; chi tiết nhận hàng H03–H05 được trình riêng.
4. `còn phải nhận = lượng đặt − lượng đã chấp nhận theo phiếu nhập hợp lệ − phần chưa nhận được duyệt hủy`. Các lượng quy về đơn vị gốc, không âm. Hàng thừa/sai không tự cộng vào lượng đã hoàn thành PO. Hàng đã nhận rồi trả NCC giữ lịch sử nhập gốc; việc NCC giao bù phải có nguồn liên kết và trần nhận riêng được duyệt ở luồng trả, không tự mở lại trần vô hạn.
5. Sửa DRAFT theo quyền lập PO. Sau khi đặt, chỉ sửa phần chưa thực hiện và giữ các bản lịch sử; không sửa chứng từ nhập đã ghi. Thay đổi vượt bản RR duyệt phải được duyệt lại trước khi có hiệu lực. Giá mua do Accountant ghi nhận, không tự thêm bước duyệt giá riêng vào flow hiện tại; thay đổi giá trên phần đã thực hiện phải qua đính chính có dấu vết, không ghi đè giá của phiếu cũ. Quy tắc đính chính chứng từ được trình ở nhóm lịch sử/sửa sai.
6. Nhận đủ các dòng hợp lệ và xử lý xong các chênh lệch thuộc PO thì COMPLETED. Nếu không nhận phần còn lại, Store Owner cho phép đóng thiếu có lý do rồi CLOSED_SHORT; PO đã nhận một phần không đổi thành CANCELLED để xóa lịch sử. Hủy khi chưa có phần thực hiện cũng phải có căn cứ và giải phóng/đánh giá lại các nguồn C06 liên quan. Thông báo/số liệu đặt lại chỉ là đề xuất, không tự mua thay.

**Bảo toàn dữ liệu.** Dòng hàng của mỗi phiếu có ID ổn định và giới hạn số dòng phù hợp ứng dụng; không nhúng lịch sử vô hạn vào `items[]`. Các bản nội dung đã gửi/đặt, quyết định duyệt, lịch xác nhận NCC và thay đổi giá cần được lưu bằng D05/G02 hoặc cấu trúc phiên bản được duyệt ở nhóm dùng chung. Tên/trường tham chiếu D05/G02 trong phiếu này nêu dữ liệu bắt buộc phải truy được, không có nghĩa các bảng đó đã được duyệt. Xóa nháp cũng không được xóa bản đã có liên kết/chứng từ lịch sử.

## Ví dụ liên kết

RR-001 được duyệt 20 thùng G60, hệ số 4 viên/thùng, cho kho A. Accountant lập PO-001 từ RR-001 cho NCC-01: đặt 20 thùng, giá mua 120.000 đồng/thùng, tổng 2.400.000 đồng. Nhận đợt đầu 8 thùng hợp lệ, tương đương 32 viên; còn phải nhận 12 thùng hoặc 48 viên. Đợt thứ hai có phiếu nhập, ngày nhận và kết quả kiểm riêng. Warehouse Staff thấy các lượng và lịch, không thấy 120.000 hoặc 2.400.000 đồng. Số liệu chỉ minh họa, không phải giá thị trường.

**Đang xin duyệt:** H01 v0.1 gồm đầu phiếu, các dòng nhúng, nguồn nhu cầu, bản duyệt và quyền. H02 v0.1 gồm đầu phiếu, các dòng nhúng, mỗi PO đúng một RR/NCC/kho, nhận nhiều đợt, giá mua và lịch NCC. Các bảng nhập/kiểm nhận, lịch sử và trả hàng tiếp tục trình riêng.
