# C05–C06 · Giữ hàng và nguồn hàng dự kiến

**Phiếu v0.1 · C05 và C06 đều CHỜ DUYỆT riêng.** Đề xuất dựa trên `reservations`, `demand_supply_allocations` trong [snapshot MongoDB](03_Cau_truc_DB_hien_tai.md), UC-41/51/55/58/103/104 và BR-04/09/11/14/15 trong [Report 3](../../01_bao_cao/WMSD_Report3_Fix.docx.txt), cùng [C01–C02 đã duyệt](09_Duyet_diem_ton_va_so_du.md). Những bảng chứng từ chưa duyệt vẫn phải trình riêng; phiếu này không chốt số lần xuất/nhận của một TR hoặc TO.

## Phân biệt hai bảng

| Bảng | Một bản ghi là gì? | Ví dụ |
|---|---|---|
| C05 · `stock_reservations` | Một lượng hàng đã có trong số dư C02, được giữ cho một nhu cầu cụ thể | Trong ô A có 20 viên; giữ 8 viên cho đơn khách K, còn 12 viên chưa giữ |
| C06 · `supply_allocations` | Một phần nguồn hàng dự kiến được dành để đáp ứng một nhu cầu | PO sẽ mang về 15 viên; dự kiến dành 7 viên cho đơn khách K |

Ví dụ khách cần 20 viên, đã giữ thực tế 8 viên và có 7 viên sắp về đúng hạn được gắn cho đơn thì **còn thiếu 5 viên**. Chỉ 8 viên đang giữ là hàng thực tế dành cho đơn; 7 viên sắp về chưa được phép xuất. Khi 7 viên đó thực nhận hợp lệ, chuyển phần tương ứng từ nguồn dự kiến sang giữ hàng thực tế, không cộng thành 22 viên được đáp ứng.

## C05 · stock_reservations · Giữ hàng cho nhu cầu

### Ý nghĩa và các mốc đề xuất

Giữ hàng làm giảm lượng còn dành được cho nhu cầu khác, nhưng không giảm tổng tồn vật lý. Một nhu cầu có thể giữ nhiều lô/ô hợp lệ. Một nhóm tồn có thể được chia giữ cho nhiều nhu cầu; tổng phần còn giữ không vượt số lượng của nhóm tồn.

| Tình huống | Đề xuất |
|---|---|
| Chỉ tạo SO hoặc TR nháp | Chưa giữ hàng |
| Tạo lệnh giao hàng hợp lệ cho đơn bán | Giữ phần tồn phù hợp đã chọn cho lần giao, trong quyền của người lập lệnh |
| Tạo phiếu xuất điều chuyển từ TR đã duyệt | Giữ phần tồn phù hợp tại kho nguồn cho phiếu xuất đó |
| Nhận hàng đã có C06 dành cho một nhu cầu | Phần thực nhận thuộc shop, đạt chất lượng được gắn giữ cho nhu cầu đó ngay khi ghi nhận; hàng ở ô nhận vẫn chưa được xuất cho đến khi đủ điều kiện vị trí |
| Picking hoặc chuyển vị trí | Chuyển liên kết giữ theo đúng lượng thực di chuyển; hàng không trở thành hàng tự do giữa chừng |
| Xuất chuyển giữa kho cho đơn khách | Giữ liên kết nhu cầu qua nguồn → đang chuyển → ô nhận → ô lưu đích; không coi xuất chuyển là đã giao khách |
| Xuất bán thực tế | Dùng hết phần giữ tương ứng với lượng xuất, cùng lần ghi giảm tồn |
| Hủy phần chưa xuất hoặc đổi nguồn | Giải phóng đúng phần còn giữ, lưu lý do; không sửa phần đã xuất |
| Hàng đã giữ bị lỗi | Chặn hàng theo hồ sơ lỗi, giải phóng/thay thế phần giữ không còn đủ điều kiện, giữ dấu vết nhu cầu cần bù; hàng lỗi không trở thành tồn khả dụng |

Giữ mới trực tiếp lấy từ tồn của shop đã đạt chất lượng, rõ lô và tại vị trí cho phép lấy hàng. Giữ theo hàng được di chuyển hoặc theo nguồn C06 có thể nằm ở staging, receiving hoặc transit để bảo toàn liên kết, nhưng không làm các vị trí đó đủ điều kiện xuất. Nếu nhu cầu chỉ là bổ sung kho đích, phần giữ kết thúc khi nhu cầu điều chuyển đã thực hiện xong; nếu phục vụ đơn khách thì tiếp tục giữ cho đơn khách. Mốc kết thúc từng chứng từ phải khớp các phiếu H06–H16 được duyệt sau.

### Trường đề xuất

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId | ID lần giữ tại một nhóm tồn |
| `demandRef` | Loại chứng từ + ID chứng từ + ID dòng, bắt buộc | Nhu cầu gốc mà lượng hàng phục vụ; ví dụ dòng SO. Các phiếu con phải truy về cùng nhu cầu gốc |
| `executionRef` | Loại chứng từ + ID chứng từ + ID dòng, khi đã có | Lệnh giao/phiếu xuất điều chuyển đang thực hiện. Cho phép chưa có khi hàng từ C06 mới về và đang chờ lập lệnh giao |
| `balanceId` | ObjectId → C02, bắt buộc | Lô, vị trí/điểm, chất lượng và chủ hàng cụ thể đang giữ |
| `reservedQty` | Decimal128 > 0 | Lượng gốc của lần giữ, theo đơn vị gốc sản phẩm |
| `consumedQty` | Decimal128 ≥ 0, mặc định 0 | Lượng đã thực hiện xong đúng nhu cầu, chẳng hạn đã xuất bán |
| `releasedQty` | Decimal128 ≥ 0, mặc định 0 | Lượng đã giải phóng do hủy, đổi nguồn hoặc không còn đủ điều kiện |
| `movedQty` | Decimal128 ≥ 0, mặc định 0 | Lượng chuyển sang bản ghi giữ khác khi hàng đổi nhóm tồn; không phải lượng đã xuất bán |
| `previousReservationId` | ObjectId → C05, tùy chọn | Lần giữ trước khi chuyển vị trí/điểm hoặc chia lượng; giữ đường truy vết |
| `sourceAllocationId` | ObjectId → C06, tùy chọn | Nguồn dự kiến trước đây, nếu hàng giữ này được nhận từ một phân bổ C06 |
| `originMovementId` | ObjectId → C04, khi sinh do nhập/chuyển tồn | Dòng biến động làm xuất hiện phần hàng tại nhóm tồn mới |
| `creationKey` | Chuỗi duy nhất, phần mềm tạo | Nhận diện lần tạo giữ hoặc lần chuyển giữ, chống tạo trùng khi gửi lại |
| `createdBy`, `updatedBy` | ObjectId → A01 | Người thực hiện nghiệp vụ dẫn tới tạo/sửa |
| `version`, `createdAt`, `updatedAt` | Phiên bản và ngày giờ | Kiểm cập nhật đồng thời và tra lịch sử |

`còn giữ = reservedQty − consumedQty − releasedQty − movedQty`. Các lượng thành phần không âm, tổng không vượt `reservedQty`. Trạng thái đang giữ/kết thúc tính từ các lượng, không cần thêm một cờ dễ lệch với số lượng. Hủy, giải phóng hoặc đổi nguồn bắt buộc ghi lý do, người, thời gian và giá trị trước/sau trong lịch sử thao tác G02; cấu trúc G02 được trình riêng.

**Chuyển một phần hàng đang giữ.** Ví dụ 8 viên đang giữ ở A, chuyển 3 viên sang B: bản ghi A tăng `movedQty` thêm 3, còn giữ 5; tạo bản ghi B giữ 3 và trỏ `previousReservationId` về A. Cập nhật tồn, lịch sử C03/C04 và hai bản ghi giữ cùng thành công. Tổng giữ vẫn 8. Một thao tác gửi lại dùng cùng `creationKey` và không tạo thêm 3 viên giữ. Ví dụ này mô tả cách bảo toàn dữ liệu, không cấp thêm quyền xác nhận TO từng phần.

**Quan hệ và chống giữ trùng.** Một dòng nhu cầu có nhiều lần giữ, một số dư C02 có nhiều phần giữ, mỗi bản ghi C05 chỉ trỏ một số dư. Không cộng SO và WIR thành hai nhu cầu độc lập. Phần đã chuyển sang lệnh giao phải dùng lại liên kết giữ hiện có hoặc chuyển đúng lượng sang liên kết thực hiện, không giữ lần hai. Đồng thời kiểm trần nhu cầu còn phải đáp ứng và trần số dư còn có thể giữ. Khóa theo phiên bản hoặc cơ chế đồng thời tương đương phải bảo vệ cả hai trần.

**Quyền đề xuất.** Tạo/sửa giữ thông qua chứng từ và thao tác đã được cấp quyền: Sales Staff lập lệnh giao trong phạm vi đơn được giao; Warehouse Staff xử lý phiếu xuất điều chuyển, picking, putaway, lỗi và hàng nhận tại kho phụ trách. Không có màn hình sửa số dư hoặc giữ hàng tự do. Store Owner xem; Accountant xem theo phạm vi đối chiếu; Sales không xem ghi chú/chứng từ nội bộ ngoài quyền. Administrator cấp quyền theo A02/A03, không tự có quyền nghiệp vụ do tên role. Mốc nghiệp vụ trên là phần đang xin duyệt cùng C05.

## C06 · supply_allocations · Nguồn hàng dự kiến cho nhu cầu

### Ý nghĩa và phạm vi đề xuất

Một bản ghi gắn một dòng nhu cầu với một dòng nguồn PO hoặc TR liên kho đủ điều kiện. Quan hệ tổng quát là nhiều–nhiều: một nguồn có thể phục vụ nhiều nhu cầu, một nhu cầu có thể được bù từ nhiều nguồn. Tất cả đều bị chặn theo lượng còn có thể phân bổ. C06 không tạo số dư hay ghi tăng tồn trước khi có hàng thực nhận.

Nguồn PO phải còn hiệu lực và có lượng còn sẽ nhận tại kho phù hợp. Nguồn chuyển kho phải được duyệt, có lượng còn thực hiện/đang chuyển và đúng kho nhận. Ngày dự kiến, sản phẩm, lô/tông/cỡ yêu cầu và điều kiện thực tế phải phù hợp với nhu cầu. RR chưa thành PO hoặc TR chưa duyệt chỉ là đề nghị, không tính như nguồn đã có thể đáp ứng.

### Trường đề xuất

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId | ID liên kết nguồn với nhu cầu |
| `demandRef` | Loại chứng từ + ID chứng từ + ID dòng, bắt buộc | Cùng định danh nhu cầu gốc với C05; không tạo một nhu cầu mới cho mỗi phiếu con |
| `sourceRef` | Loại PO/TR + ID chứng từ + ID dòng, bắt buộc | Dòng nguồn gốc. Giữ liên kết này khi nguồn đi qua xuất, đang chuyển và nhận |
| `destinationWarehouseId` | ObjectId → B01, bắt buộc | Kho sẽ nhận nguồn để đáp ứng nhu cầu, phải khớp nguồn và nhu cầu |
| `allocatedQty` | Decimal128 > 0 | Lượng gốc đã dành từ nguồn cho nhu cầu, theo đơn vị gốc sản phẩm |
| `receivedAssignedQty` | Decimal128 ≥ 0, mặc định 0 | Lượng đã thực nhận hợp lệ và được chuyển sang giữ hàng C05 cho nhu cầu |
| `releasedQty` | Decimal128 ≥ 0, mặc định 0 | Lượng đã bỏ gắn với nguồn này vì hủy, đổi nguồn hoặc không còn đáp ứng được |
| `neededBy` | Ngày giờ, khi nhu cầu có hạn | Thời điểm cần hàng dùng để so với lịch nguồn hiện tại |
| `creationKey` | Chuỗi duy nhất, phần mềm tạo | Chặn tạo liên kết trùng do gửi lại cùng thao tác |
| `createdBy`, `updatedBy` | ObjectId → A01 | Người thực hiện lựa chọn/cập nhật thông qua nghiệp vụ |
| `version`, `createdAt`, `updatedAt` | Phiên bản và ngày giờ | Kiểm cập nhật đồng thời và lịch sử |

`còn chờ từ nguồn = allocatedQty − receivedAssignedQty − releasedQty`. Các lượng không âm, tổng hai lượng cuối không vượt `allocatedQty`. Ngày dự kiến nhận và trạng thái hiệu lực đọc từ nguồn hiện tại; nếu lưu để hiển thị nhanh thì phải có cơ chế làm mới, không dùng dữ liệu cũ để khẳng định đáp ứng đúng hạn. Các kiểu tham chiếu của C05/C06 là danh sách nghiệp vụ được triển khai, phải kiểm được đúng loại phiếu và dòng thuộc phiếu; tên collection cuối cùng chốt theo lượt duyệt chứng từ.

### Nhận, đổi nguồn và tính nhu cầu còn thiếu

1. Nhân viên chọn nguồn trong nghiệp vụ được cấp quyền; lựa chọn chỉ gắn nguồn, không tự mua, duyệt TR hoặc ghi tăng tồn.
2. Khi nguồn có hàng thực nhận thuộc shop, đúng sản phẩm/lô và đạt chất lượng, ghi nhận đủ số dư C02, lịch sử C03/C04, C05 và tăng `receivedAssignedQty` tương ứng cùng một lần thành công. Nếu hàng chuyển kho đã có giữ C05 theo cùng nhu cầu, chuyển hoặc phân chia đúng liên kết hiện có, không tạo thêm lượng giữ cho cùng phần hàng. Hàng ở ô nhận vẫn chờ putaway trước khi đủ điều kiện xuất.
3. Hàng đang chờ kiểm, bị lỗi, sai hoặc giữ hộ không được chuyển thành giữ hàng tốt để coi là đã bù đủ. Chỉ phần hợp lệ đã gắn C05 mới tăng `receivedAssignedQty`. Phần không còn nguồn bù phải giải phóng liên kết nguồn và cho thấy nhu cầu cần tìm nguồn khác.
4. Đổi nguồn: giải phóng phần còn chờ từ nguồn cũ và tạo liên kết với nguồn mới trong cùng thao tác; giữ lịch sử cả hai. Hủy nguồn hoặc thay ngày khiến về muộn phải đánh giá lại, không tiếp tục báo rằng nhu cầu đã được đáp ứng đúng hạn.
5. Khi tính còn thiếu tại kho đáp ứng nhu cầu, tính lượng nghĩa vụ còn lại, trừ phần C05 còn giữ hợp lệ tại kho đó và phần C06 còn chờ tương thích, đúng hạn. Phần C05 ở kho nguồn hoặc đang chuyển để thực hiện chính nguồn C06 đó không được cộng thêm vào lượng đáp ứng tại kho đích. Không trừ `receivedAssignedQty` lần nữa vì lượng này đã được phản ánh bằng C05 hoặc kết quả thực hiện chứng từ. Hàng đã xuất nhưng chưa hoàn tất giao khách theo dõi qua chứng từ giao; không tự biến thành nhu cầu mua mới.

**Không đếm trùng chuỗi chứng từ.** SO → WIR → lệnh giao vẫn chung nhu cầu gốc. TR → phiếu xuất → transit → phiếu nhận vẫn theo nguồn chuyển gốc; không cộng từng mắt xích thành những nguồn độc lập. Nếu hàng nhận đã đủ và được chuyển tiếp để phục vụ nhu cầu, phần đã nhận không còn nằm trong lượng nguồn PO/TR đang chờ. Kiểm đồng thời theo dòng nguồn và dòng nhu cầu, cùng quy tắc chống gửi lại, để hai người không gắn cùng một phần hàng cho hai nhu cầu vượt trần.

**Quan hệ với C05.** Một C06 có thể sinh nhiều C05 theo các lô/ô thực nhận. C05 giữ `sourceAllocationId` để tra lại nguồn; đây là liên kết lịch sử, không phải lượng được cộng thêm. Nếu sau đó hàng đã giữ bị lỗi hoặc được giải phóng, C05 phản ánh lượng không còn giữ hợp lệ. C06 không tự tăng lại lượng đang chờ của một PO/TR đã thực hiện xong; phải chọn nguồn bù mới.

**Quyền đề xuất.** Sales Staff chọn phương án đáp ứng cho nhu cầu khách thuộc phạm vi mình; Warehouse Staff chọn nguồn/kho phù hợp và xử lý liên kết trong nghiệp vụ kho được giao. Store Owner xem nguồn và quyết định các yêu cầu cần duyệt trong đúng nghiệp vụ, không được sửa C06 chỉ vì có quyền xem. Accountant cập nhật nguồn PO trong quyền mua hàng; việc đó làm đánh giá lại nguồn, không cấp quyền lấy phần nguồn đã dành cho nhu cầu khác. Quyền tùy chỉnh theo A02/A03 vẫn kiểm kho, hồ sơ và trạng thái.

## Phạm vi đang trình duyệt

C05 v0.1 trình cấu trúc giữ hàng, các mốc bắt đầu/kết thúc, chuyển liên kết khi đổi vị trí và quyền ở trên. C06 v0.1 trình cấu trúc nguồn dự kiến, chuyển sang giữ thực tế, giới hạn lượng và chống đếm trùng. Hai bảng chờ câu trả lời riêng. Các bảng chứng từ, khóa kiểm kê, lịch sử thao tác và dữ liệu đóng gói/chồng hàng kiểm sức chứa được duyệt theo lượt của chúng.
