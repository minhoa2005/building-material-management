# H03–H05 · Hàng đến, kiểm nhận và nhập mua hàng

**H03 v0.1, H04 v0.1 và H05 v0.1 đều ĐÃ DUYỆT riêng.** Người dùng trả lời “Duyệt H03 v0.1”, “Duyệt H04 v0.1” và “Duyệt H05 v0.1”. Cập nhật 01/11/2026. [Phiếu v0.1 đã trình](history/15_Duyet_hang_den_kiem_nhan_va_phieu_nhap_v0.1_de_xuat.md). Theo BF-01, UC-10/26 trong [Report 3](../../01_bao_cao/WMSD_Report3_Fix.docx.txt), [PO H02 đã duyệt](13_Duyet_yeu_cau_bo_sung_va_don_mua.md), [C01–C02](09_Duyet_diem_ton_va_so_du.md), [C03–C04](10_Duyet_giao_dich_va_lich_su_ton.md) và [quyết định bỏ UOM](14_Bo_UOM_va_luu_quy_doi_tren_dong.md). Các trường đơn vị/hệ số nằm trên dòng; không tham chiếu bảng UOM hoặc phiên bản quy đổi.

## Phân biệt ba loại hồ sơ

| Mã | Bảng đề xuất | Trả lời câu hỏi |
|---|---|---|
| H03 | `goods_arrivals` — Hàng đến | NCC thực tế mang hàng gì tới, lúc nào, số lượng bao nhiêu? |
| H04 | `goods_inspections` — Kiểm nhận | Phần hàng nào đạt, lỗi, còn chờ; phần nào được nhận vào sở hữu shop? |
| H05 | `purchase_receipts` — Phiếu nhập mua hàng | Lượng nào đã chính thức được ghi nhận vào tồn của shop từ PO? |

Ví dụ NCC mang tới 100 viên: kiểm nhận xác định 90 viên tốt được nhận, 5 viên lỗi được chấp nhận vào sở hữu để xử lý, 5 viên còn chờ thỏa thuận và giữ hộ NCC. H03 ghi 100 viên đến; H04 ghi ba phần; H05 nhập sở hữu 95 viên theo hai chất lượng. Năm viên giữ hộ theo H33 riêng, không làm PO được coi là đã nhận đủ 100. Nếu giữ cả 100 viên trong kho thì sức chứa phải phản ánh cả 100.

Ba hồ sơ có thể được thao tác trong cùng màn hình nhập hàng; số bảng không yêu cầu thêm ba màn hình hoặc ba lần nhập lại sản phẩm. Thiết kế tách để giữ được cả trường hợp hàng đến nhưng không chấp nhận đơn vị nào, hoặc phần đang chờ được kiểm và nhận sau. Cấu trúc ba bảng đã được duyệt; việc triển khai và các bảng phụ thuộc vẫn theo giai đoạn riêng.

## H03 · goods_arrivals · Hàng đến

Một bản ghi tương ứng một lần NCC giao hàng tới một kho theo một PO. Cùng PO giao hai lần thì có hai hồ sơ với thời điểm, lượng và bằng chứng riêng. Nếu cùng chuyến xe chở hàng của hai PO, lập hai hồ sơ và có thể ghi chung số chứng từ/chuyến để đối chiếu.

### Đầu hồ sơ

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id`, `code` | ObjectId; mã tự sinh duy nhất | ID và mã lần hàng đến |
| `purchaseOrderId` | ObjectId → H02, bắt buộc | PO được giao; hàng sai/ngoài dòng PO vẫn ghi nhận riêng để xử lý |
| `supplierId`, `warehouseId` | Tham chiếu B08B/B01 | Lấy từ PO, kiểm khớp; không cho người nhận tự đổi NCC hoặc kho để hợp thức hóa hàng |
| `arrivedAt`, `recordedAt` | Ngày giờ | Thời điểm hàng đến thực tế và thời điểm ghi vào phần mềm |
| `supplierDeliveryReference` | Chuỗi tùy chọn | Số phiếu giao hàng NCC/chứng từ đi cùng |
| `deliveredBy`, `vehicleReference` | Chuỗi tùy chọn | Người giao thực tế và phương tiện nếu có thông tin; không bắt tạo tài khoản lái xe |
| `status` | DRAFT, RECORDED, RESOLVED, VOIDED | Nháp; đã chốt lượng đến còn xử lý; đã giải quyết hết; hủy hiệu lực do ghi nhầm có lý do |
| `evidenceRefs`, `note` | Tệp D06/chuỗi | Nhãn, ảnh, phiếu giao và ghi chú; tệp có giá mua tuân thủ quyền giá H02 |
| `createdBy`, `updatedBy`, `creationKey` | A01; mã thao tác | Người ghi và chống lập trùng khi gửi lại |
| `revision`, `version`, `createdAt`, `updatedAt` | Số nguyên và ngày giờ | Bản nội dung, kiểm đồng thời và lịch sử |

### Dòng hàng đến — items[]

| Trường | Ý nghĩa |
|---|---|
| `_id`, `lineNo`, `purchaseOrderItemId` | ID dòng ổn định; dòng PO dự kiến. Hàng ngoài PO có thể chưa gắn dòng, không tự được nhập vào sở hữu |
| `expectedProductId`, `actualProductId`, `observedLabel` | Sản phẩm theo PO và thực tế; ghi rõ trường hợp giao sai. Nếu chưa nhận diện thì giữ nội dung nhãn/bằng chứng, chưa cho ghi tồn bằng một sản phẩm đoán |
| `batchId`, `lotLabelSnapshot` | Lô B05 và nhãn thực tế khi xác định được. Lô chưa xác minh phải giữ trạng thái chưa xác minh theo B05 |
| `enteredQty`, `enteredUnit`, `baseUnitSnapshot`, `baseUnitsPerUnit`, `quantityBase` | Lượng thực đếm, đơn vị và hệ số trên dòng; phần mềm tính lượng gốc. Nháp chưa nhận dạng đủ có thể thiếu hệ số/lượng gốc, phải hoàn thiện trước khi dùng để ghi tồn |
| `packagingSnapshot`, `packagingCondition` | Quy cách/kích thước kiện thực tế và tình trạng nguyên, mở, rách… Bao bì rách không tự có nghĩa sản phẩm hỏng |
| `note`, `evidenceRefs` | Ghi chú và bằng chứng riêng của dòng |

**Phạm vi và quyền đề xuất.** Warehouse Staff tại kho được giao tạo, kiểm đếm và chốt dữ liệu hàng đến. Store Owner/Accountant xem để phối hợp; việc xem hoặc đồng kiểm không cấp quyền xác nhận tăng tồn. Người tạo sửa nháp; sau khi có kiểm nhận/phiếu nhập phải giữ bản gốc và dùng sửa sai có liên kết, không ghi đè các lượng đã được hồ sơ sau sử dụng.

**Hàng vật lý và tồn theo sở hữu.** Chốt hàng đến không tự tăng tồn sở hữu. Nếu hàng được dỡ và giữ thực sự trong kho nhưng chưa chấp nhận sở hữu, phải ghi nhận giữ hộ H33 đúng nguồn, số lượng, vị trí và sức chứa; không để lượng đã cất vào kho biến mất khỏi dữ liệu vật lý. H03 ghi sự kiện hàng đến, H33/H05 ghi lượng thực giữ/nhận; không cộng cả hai thành hai lần nhập. [H33 v0.1](25_Duyet_han_muc_tra_va_hang_giu_ho.md) đã duyệt riêng.

**Kết thúc.** RESOLVED khi toàn bộ lượng đến đã có kết quả rõ ràng: nhận sở hữu hoặc thực bàn giao trả/không giữ, và không còn phần kiểm nhận/giữ hộ chưa xử lý. Việc NCC giao thiếu so với PO vẫn để PO còn lượng chờ; không thêm hàng chưa đến vào H03. Ghi nhầm có thể VOIDED chỉ khi xử lý được các tham chiếu phía sau theo nghiệp vụ sửa sai, không hủy một nhãn trạng thái để bỏ hàng thực đang giữ.

## H04 · goods_inspections · Kiểm nhận

Một bản ghi là một lần kiểm nhận một phần hoặc toàn bộ hàng của một H03. H03 có thể có nhiều lần kiểm cho các phần còn chờ. Phiếu này chốt cấu trúc phục vụ nhập mua; việc dùng lại H04 cho chuyển kho/khách trả sẽ được đối chiếu trong các lượt đó, không tự cấp quyền quyết định thương mại cho Warehouse Staff.

### Đầu biên bản

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id`, `code` | ObjectId; mã tự sinh | ID/mã biên bản |
| `arrivalId` | ObjectId → H03, bắt buộc | Lần hàng đến đang được kiểm |
| `warehouseId` | B01, lấy từ H03 | Phạm vi kho của việc kiểm |
| `status` | DRAFT, CONFIRMED, SUPERSEDED | Nháp; kết quả đã chốt; bản được thay thế hợp lệ sau sửa sai |
| `inspectedBy`, `inspectedAt` | A01/ngày giờ | Người kiểm chịu trách nhiệm và thời điểm thực tế |
| `participants` | Danh sách người/tên và vai trò tham gia | Owner/Accountant có thể đồng kiểm; giữ đúng người thực hiện, không coi tham gia là quyền ghi nhập |
| `confirmedBy`, `confirmedAt` | A01/ngày giờ | Người có quyền chốt kết quả kiểm nhận |
| `previousInspectionId`, `correctionReason` | H04/chuỗi khi kiểm lại | Truy bản trước và lý do; không xóa kết quả đã dùng để lập phiếu nhập |
| `evidenceRefs`, `note`, `creationKey` | Tệp, ghi chú, mã thao tác | Bằng chứng và chống ghi trùng |
| `createdBy`, `updatedBy`, `version`, `createdAt`, `updatedAt` | Người, phiên bản, thời gian | Kiểm cập nhật và lịch sử |

### Phần hàng được kết luận — results[]

| Trường | Ý nghĩa |
|---|---|
| `_id`, `arrivalItemId`, `previousResultId` | ID kết quả; dòng thực đến; phần chờ/kết quả trước khi kiểm tiếp nếu có |
| `productId`, `batchId`, `packagingSnapshot` | Nhận dạng đã kiểm và quy cách thực tế; giữ đường truy từ H03, không đổi sản phẩm/lô của phần đã nhập |
| `quantityBase`, `baseUnitSnapshot` | Lượng thuộc đúng kết luận này, phải dương và trong lượng thực đến chưa được phân loại/đang chờ hợp lệ |
| `qualityStatus` | PENDING, GOOD, DAMAGED hoặc BLOCKED theo C02 |
| `ownershipOutcome` | ACCEPT_STORE, HOLD_SUPPLIER, REJECT_RETURN hoặc PENDING_DECISION — quyết định nhận sở hữu, giữ hộ NCC, từ chối/đề nghị trả hoặc chưa có quyết định |
| `packagingCondition`, `issueTypes`, `reason` | Tình trạng vỏ và lỗi thực tế: sai mã/lô, thiếu/thừa, sứt vỡ…; lý do cho phần không nhận bình thường |
| `authorizationRef`, `evidenceRefs` | Quyết định/thỏa thuận/bằng chứng cần thiết với trường hợp vượt hoặc khác PO; không tự duyệt bằng một cờ nhập tay |

**Phân lượng và kiểm lại.** Mỗi phần hàng chỉ có một kết luận hiện hành. Các kết luận mới của cùng dòng không được đếm trùng phần đã phân loại; phần chưa kiểm còn hiển thị chờ kiểm. Ví dụ 100 viên đã chia 90/5/5 thì kiểm lại 5 viên chờ phải tham chiếu đúng phần 5 đó, không tạo thêm 5 viên như một lần hàng đến mới. Kết quả cũ còn truy được, chỉ phần được thay thế hợp lệ mới mất hiệu lực. Không đồng thời dùng kết quả trước và sau để nhập.

**Quyền đề xuất.** Warehouse Staff kiểm, ghi tình trạng thực tế và chốt kết quả trong phạm vi kho. Phần phù hợp PO được chấp nhận theo nghiệp vụ đã cho phép. Hàng thừa, sai, thay thế hoặc cần thỏa thuận phải có căn cứ quyết định đúng quyền trước khi được dùng lập H05; Accountant phối hợp NCC và Store Owner cho phép thay đổi cần duyệt theo H02. H04 không tạo quyền tự duyệt vượt PO.

**Chưa ghi tăng tồn chỉ bằng kết luận.** CONFIRMED là có kết quả kiểm. H05 hoặc chứng từ giữ hộ/trả giữ hộ mới ghi biến động theo lượng thực hiện. Kết luận REJECT_RETURN chưa chứng minh hàng đã được chở trả; nếu hàng vẫn ở kho thì vẫn phải theo dõi vật lý/giữ hộ đến khi bàn giao thực tế. Không tạo phiếu nhập số lượng 0 để đóng phần bị từ chối.

## H05 · purchase_receipts · Phiếu nhập mua hàng

Một phiếu ghi lượng thực nhận vào sở hữu của shop từ **một PO và một lần hàng đến H03**. Có thể lấy các phần đã chấp nhận từ nhiều lần kiểm của chính H03 đó. PO có nhiều lần nhập; phần đang chờ của một lần giao có thể được nhận bằng phiếu tiếp theo khi đủ căn cứ. Phiếu đã POSTED không sửa số lượng/hệ số cũ.

### Đầu phiếu

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id`, `code` | ObjectId; mã tự sinh duy nhất | ID/mã phiếu nhập |
| `purchaseOrderId`, `arrivalId` | H02/H03, bắt buộc | Nguồn đặt mua và lần hàng thực đến; phải khớp nhau |
| `supplierId`, `warehouseId` | B08B/B01, lấy theo nguồn | NCC và kho nhận; không tự chọn lại để đổi nguồn |
| `receivedAt` | Ngày giờ | Thời điểm nhận theo nghiệp vụ; kiểm khóa kiểm kê và quy tắc hồi tố khi áp dụng |
| `status` | DRAFT, POSTED, CANCELLED, REVERSED | Nháp; đã ghi tồn; hủy nháp; giao dịch đã được đảo hợp lệ, vẫn giữ dữ liệu gốc |
| `postedBy`, `postedAt`, `stockTransactionId` | A01, thời gian, C03 | Ai xác nhận và giao dịch tồn đã ghi |
| `evidenceRefs`, `note` | Tệp/chuỗi | Biên bản và chứng từ nhận; quyền tệp có giá tuân thủ H02 |
| `creationKey`, `createdBy`, `updatedBy`, `version`, `createdAt`, `updatedAt` | Mã thao tác, người, phiên bản, thời gian | Chống gửi trùng và sửa đè |

### Dòng nhập — items[]

| Trường | Ý nghĩa |
|---|---|
| `_id`, `lineNo`, `purchaseOrderItemId`, `arrivalItemId` | ID dòng nhập ổn định, dòng đặt và dòng thực đến |
| `inspectionId`, `inspectionResultId` | Kết luận H04 còn hiệu lực cho đúng phần hàng được nhận |
| `productId`, `batchId`, `qualityStatus` | Sản phẩm/lô/chất lượng thực nhận; đúng nguồn và điều kiện nhận |
| `enteredQty`, `enteredUnit`, `baseUnitSnapshot`, `baseUnitsPerUnit`, `quantityBase` | Đơn vị và quy đổi ngay trên dòng; lượng gốc đối chiếu PO/H03/H04 |
| `packagingSnapshot` | Quy cách/kích thước thực tế sao chép từ phần hàng đã kiểm; không có conversionId |
| `destinationLocationId`, `stackItems` | Ô nhận/cách ly phù hợp và phân lượng vào các chồng C07–C08 để kiểm sức chứa. Tổng phân lượng đúng lượng dòng |
| `custodyReceiptRef`, `custodyBalanceId` | Nguồn giữ hộ nếu hàng đã được ghi vật lý vào kho trước đó; chỉ bắt buộc với trường hợp chuyển từ giữ hộ sang sở hữu |
| `supplierScheduleId` | Mốc giao của dòng PO khi có lịch NCC | Đối chiếu lượng lịch đã thực hiện và lượng đúng hạn còn để phân bổ C06 |
| `note`, `evidenceRefs` | Ghi chú/bằng chứng cần thiết riêng của dòng |

### Quyền và lúc thay đổi tồn

Warehouse Staff có quyền nhập tại kho được giao lập và xác nhận H05. Owner/Accountant xem, đối chiếu và có thể đồng kiểm theo H04, nhưng không mặc nhiên có quyền POST chỉ vì được xem PO. Role tùy chỉnh theo A02/A03 vẫn phải được cấp đúng quyền và phạm vi kho. Giá mua không được trả về màn hình/API kiểm nhận của Warehouse Staff; H05 tham chiếu dòng/bản PO để Accountant/Owner tra giá theo quyền, không tạo một bản giá dễ lộ trong dữ liệu chung.

Trước POSTED, đồng thời kiểm PO còn hiệu lực, lượng được phép nhận, kết luận ACCEPT_STORE, lô/chất lượng hợp lệ, phần kết quả chưa được phiếu khác dùng, ô/khóa kiểm kê và sức chứa sau xếp. Nếu chỉ nhận được một phần thì dòng ghi đúng phần thực nhận; phần chưa ghi vẫn còn để xử lý, không tự đóng đủ.

- **Chưa từng ghi giữ hộ:** tăng số dư sở hữu STORE theo đúng chất lượng và vị trí nhận. C03/C04 ghi lượng từ bên ngoài vào.
- **Đã ghi giữ hộ NCC:** chuyển đúng lượng từ số dư SUPPLIER sang STORE; không nhập vật lý lần hai. C07/C08 đổi liên kết chủ hàng tương ứng, tổng vật lý và sức chứa không tăng nếu hàng không di chuyển.
- **Hàng GOOD ở khu nhận:** có thể giữ cho nhu cầu C05/C06 theo quy tắc đã duyệt, nhưng chưa khả dụng để xuất thông thường cho đến khi đủ điều kiện vị trí. Putaway chỉ đổi vị trí, không tăng tổng thêm lần nữa.
- **Hàng DAMAGED được chấp nhận sở hữu:** ghi đúng chất lượng tại vị trí phù hợp, theo dõi hồ sơ lỗi; không đổi thành hàng GOOD để hoàn thành PO.

Phiếu, số dư C02, giao dịch C03/C04, giữ/phân bổ C05/C06 nếu có, dữ liệu chồng C07/C08 và tiến độ nguồn cùng thành công hoặc giữ nguyên toàn bộ khi lỗi. Cùng lần xác nhận gửi lại trả kết quả cũ. Hai phiếu không được cùng nhận vượt phần kết quả H04 hoặc lượng PO còn cho phép. H05 phải có tổng lượng dương khi POSTED; nếu nhận 0 thì giữ H03/H04 cùng kết quả trả/giữ hộ, không tạo biến động giả.

**Sửa sai.** Nháp được sửa theo quyền; POSTED giữ nguyên dữ liệu đã ghi. REVERSED chỉ sau khi giao dịch đảo đúng quyền và điều kiện đã thực hiện thành công, không đổi nhãn để xóa tồn. Quyền đảo giao dịch H35 sẽ trình riêng. [H33/H34 v0.1](25_Duyet_han_muc_tra_va_hang_giu_ho.md) đã duyệt.

## Quan hệ và trạng thái duyệt

PO 1 — n H03; H03 1 — n H04; H03 1 — n H05; PO 1 — n H05. Mỗi dòng nhập truy về đúng dòng PO, dòng hàng đến và phần kết quả kiểm nhận. Một kết quả có thể được nhập từng phần nếu còn lượng hợp lệ; mọi phần có tổng không vượt lượng được chấp nhận. Quan hệ này chỉ dành cho nhập mua, không thay quyết định số đợt giao của BF03/BF04.

H03/H04/H05 v0.1 đều đã duyệt từng bảng, bao gồm các dòng nhúng, quyền, nguồn và thời điểm ghi tồn. Các đoạn mô tả đề xuất phía trên là nội dung v0.1 đã được chấp thuận. H01 vẫn chờ duyệt sau giải thích; kết quả này không đồng nghĩa H01 đã được chấp thuận. Đây là cập nhật hồ sơ thiết kế, chưa áp vào MongoDB/code; H33/H34 đã duyệt v0.1. H35 và lịch sử dùng chung tiếp tục trình riêng.
