# C07–C08 · Chồng hàng và đóng gói thực tế

**C07 v0.1 và C08 v0.1 đều ĐÃ DUYỆT riêng.** Người dùng trả lời “Duyệt C07 v0.1” và “Duyệt C08 v0.1”. [Phiếu v0.1 đã trình](history/12_Duyet_chong_hang_va_dong_goi_thuc_te_v0.1_de_xuat.md). Đây là dữ liệu thực hiện [kiểm sức chứa B02 đã duyệt](05_Duyet_kho_vi_tri_don_vi_tinh.md) bằng quy cách thực tế trên dòng và [số dư C02](09_Duyet_diem_ton_va_so_du.md). Phần tham chiếu B06 được sửa theo [Quyết định bỏ UOM và lưu quy đổi trên dòng](14_Bo_UOM_va_luu_quy_doi_tren_dong.md); các quy tắc sức chứa vẫn giữ. Chưa áp vào DB hoặc code. Bản đồ 3D, tọa độ từng kiện và thuật toán tự xếp hàng chưa nằm trong lượt thiết kế này.

## Vì sao cần hai bảng

Ô A-01 có thể chứa 40 viên gạch, nhưng 40 viên đó có thể là 10 thùng nguyên, hoặc 9 thùng và 4 viên lẻ. Mười thùng có thể xếp thành 5 chồng hai tầng, chiếm diện tích khác với 10 thùng để riêng trên sàn. C02 trả lời số lượng còn bao nhiêu; C07–C08 ghi cách lượng đó đang chiếm chỗ.

| Mã | Tên đề xuất | Một bản ghi là gì? |
|---|---|---|
| C07 | `storage_stacks` — Chồng/cụm hàng trong ô | Một chồng hoặc một cụm hàng có chung phần diện tích đáy tại một ô; có thể là một pallet, một kiện riêng hoặc một cụm hàng lẻ |
| C08 | `storage_stack_items` — Hàng trong chồng | Một phần hàng trong chồng, thuộc đúng một số dư C02 và một tình trạng/quy cách đóng gói |

Một ô có nhiều chồng; một chồng có nhiều dòng hàng. Cùng lô và cùng ô nhưng hai quy cách đóng gói khác nhau vẫn lưu riêng ở C08. Mã chồng do phần mềm sinh để chọn lại khi xếp hàng, không thay mã lô trên thùng và không yêu cầu gán mã riêng cho từng thùng vật lý.

## C07 · storage_stacks · Chồng/cụm hàng trong ô

### Trường đã duyệt

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId | ID chồng/cụm để C08 và lịch sử tham chiếu |
| `locationId` | ObjectId → B02, bắt buộc | Ô thực chứa chồng; cố định cho bản ghi. Chuyển sang ô khác phải qua nghiệp vụ kho, tạo/cập nhật chồng ở ô đích |
| `code` | Chuỗi, phần mềm sinh | Mã dễ chọn như CH-001; duy nhất trong ô, không đổi hoặc cấp lại cho chồng khác |
| `occupiedLengthMm` | Số nguyên > 0 khi chưa dọn hết | Chiều dài bao ngoài thực tế của chồng theo hướng chiều dài ô, gồm pallet/bao bì nếu có |
| `occupiedWidthMm` | Số nguyên > 0 khi chưa dọn hết | Chiều rộng bao ngoài thực tế của chồng theo hướng chiều rộng ô |
| `occupiedHeightMm` | Số nguyên > 0 khi chưa dọn hết | Chiều cao cao nhất của chồng, gồm phần đế/bao bì |
| `volumeMethod` | PACKAGES hoặc MEASURED | Cách tính thể tích chiếm chỗ, theo quy tắc bên dưới |
| `supportVolumeMm3` | Decimal128 ≥ 0; bắt buộc với PACKAGES | Thể tích vật đỡ/bao bì ngoài chưa nằm trong kích thước kiện đã ghi trên dòng C08. Nhập 0 nếu không có; thiếu số đo thì dùng MEASURED |
| `isCleared` | Boolean, mặc định false | Đã dọn hết hàng và phần vật đỡ/bao bì còn chiếm chỗ. Khi true, ba kích thước và thể tích chiếm chỗ bằng 0, không còn dòng C08 có lượng dương |
| `measurementNote` | Chuỗi, tùy chọn | Ghi chú cách đo; bắt buộc lý do nếu sửa số đo đã xác nhận |
| `createdBy`, `updatedBy` | ObjectId → A01 | Người thực hiện nghiệp vụ xác nhận cách xếp hoặc số đo |
| `version`, `createdAt`, `updatedAt` | Phiên bản và ngày giờ | Kiểm thay đổi đồng thời và lịch sử |

Không bắt nhân viên tự tính số m²/m³: nhập kích thước theo đơn vị hiển thị, phần mềm quy về mm và tính diện tích/thể tích. Ba số đo là kích thước hàng đang chiếm chỗ, không phải kích thước danh mục ô B02.

### Tính sức chứa đã duyệt

- **Diện tích chồng:** dài bao ngoài × rộng bao ngoài; tính một lần cho cả chồng, không cộng diện tích mỗi thùng ở tầng trên.
- **PACKAGES:** chỉ dùng khi toàn bộ hàng trong chồng là kiện nguyên, có quy cách và kích thước ngoài đầy đủ. Thể tích hàng bằng tổng số kiện × thể tích kiện theo bản thông tin kiện thực tế ở từng dòng C08, cộng `supportVolumeMm3` nếu có. Kích thước bao ngoài vẫn phải được xác nhận để kiểm chiều cao và diện tích đáy. Thể tích này không được lớn hơn thể tích bao ngoài của chồng; nếu lớn hơn thì dữ liệu đo/đóng gói đang sai.
- **MEASURED:** dùng cho hàng mở thùng, hàng lẻ, cách xếp khó suy từ quy cách hoặc chưa biết thể tích vật đỡ. Thể tích chiếm chỗ tính bằng dài bao ngoài × rộng bao ngoài × cao; cách tính này gồm cả khoảng trống bên trong chồng nên có thể chặn sớm hơn cách cộng thể tích kiện. Kích thước bao ngoài phải bao trùm toàn bộ chồng, không chỉ một phần hàng.
- **Toàn ô:** cộng diện tích của mọi chồng chưa dọn và cộng thể tích theo cách tính của từng chồng. Kiểm đồng thời với sức chứa diện tích/thể tích B02; từng chồng cũng phải vừa chiều dài, chiều rộng và chiều cao hữu dụng của ô theo hướng đặt thực tế.
- **Xếp chồng:** nhân viên xác nhận hàng được phép chồng theo hướng dẫn mặt hàng và chiều cao thực tế. Có thể ghi chồng nhiều loại hàng bằng C08, nhưng số đo phải bao trùm tất cả; việc có thể lưu chung không có nghĩa mọi loại hàng đều được phép chồng lên nhau.

Giới hạn diện tích/thể tích và kích thước từng chồng là các kiểm tra số liệu. Chúng chưa chứng minh mọi chồng có thể ghép vừa các khoảng trống trên mặt sàn. Trong phạm vi chưa có bản đồ vị trí chi tiết, Warehouse Staff xác nhận cách xếp thực tế và điều kiện đặt an toàn; phần mềm không tự tuyên bố đã tìm được cách xếp tối ưu.

### Vòng đời, quyền và lịch sử

Warehouse Staff tạo/cập nhật chồng khi xác nhận nhập, picking, putaway hoặc chuyển vị trí trong kho được giao. Nháp dự kiến không chiếm chỗ thật. Khi xác nhận phải kiểm lại ô, phiên bản và toàn bộ sức chứa sau thay đổi; hai người cùng chọn một ô không được cùng dùng một phần sức chứa còn lại. Vượt giới hạn hoặc thiếu số đo thì chặn, giữ nguyên số dư và các bản ghi cách xếp.

Lấy một phần hàng không tự giảm diện tích chồng theo tỷ lệ số lượng: phần còn lại có thể vẫn chiếm nguyên đáy. Nhân viên xác nhận lại kích thước khi hình dạng chồng thay đổi. Chỉ đặt `isCleared = true` sau khi dọn hết cả phần chiếm chỗ còn lại. Nếu hết hàng nhưng còn pallet/bao bì chưa dọn, chồng vẫn chiếm chỗ và dùng MEASURED. Giữ bản ghi đã dọn để tra lịch sử, không tái dùng ID cho một chồng khác.

Store Owner được xem; Warehouse Staff ghi nhận theo nghiệp vụ được cấp quyền. Quyền thay kích thước danh mục ô vẫn theo B02. Sửa phép đo không cấp quyền sửa số lượng hàng. Mỗi lần đổi cách xếp/số đo phải lưu giá trị trước/sau, người, thời điểm, lý do và phiếu nguồn nếu có trong G02; bảng lịch sử đó trình riêng. Khi có biến động tồn, ghi C02/C03/C04, C05 liên quan và C07/C08 cùng thành công. Chỉ sửa số đo mà không đổi số dư thì ghi lịch sử thao tác, không tạo biến động tồn giả.

## C08 · storage_stack_items · Hàng trong chồng

### Trường đã duyệt

| Trường | Kiểu và yêu cầu | Ý nghĩa |
|---|---|---|
| `_id` | ObjectId | ID dòng hàng trong chồng |
| `stackId` | ObjectId → C07, bắt buộc | Chồng đang chứa phần hàng này |
| `balanceId` | ObjectId → C02, bắt buộc | Xác định đúng lô/sản phẩm, chất lượng và chủ sở hữu; điểm C01 phải là LOCATION cùng ô với chồng |
| `packagingState` | SEALED, OPEN hoặc LOOSE | Kiện nguyên; hàng còn trong kiện đã mở; hoặc hàng lẻ không còn bao gói dùng để tính theo kiện |
| `packagingSnapshot` | Dữ liệu nhúng, không tham chiếu collection quy đổi | Đơn vị kiện, đơn vị gốc, số đơn vị gốc/kiện và kích thước ngoài thực tế. Bắt buộc biết hệ số với SEALED; OPEN có thể giữ quy cách gốc; LOOSE có thể null |
| `packagingKey` | Chuỗi phần mềm tính | Nhóm các quy cách thực tế giống nhau, không phải ID phiên bản. Khi gộp phải so sánh đủ các giá trị quy cách |
| `sealedPackCount` | Số nguyên ≥ 0, chỉ dùng với SEALED | Số kiện nguyên thực có. OPEN/LOOSE để null, không tính một kiện mở thành kiện đầy |
| `quantityBase` | Decimal128 ≥ 0 | Số lượng sản phẩm thực tế theo đơn vị gốc; tuân thủ nguyên đơn vị nếu mặt hàng yêu cầu |
| `createdBy`, `updatedBy` | ObjectId → A01 | Người xác nhận nghiệp vụ tạo/cập nhật dòng |
| `version`, `createdAt`, `updatedAt` | Phiên bản và ngày giờ | Đối chiếu thay đổi và lịch sử |

**Khóa đề xuất:** trong một chồng, duy nhất tổ hợp số dư + tình trạng đóng gói + quy cách thực tế (packagingKey); dữ liệu không áp dụng dùng null thống nhất. Khi cùng tổ hợp nhập thêm thì cộng đúng phần mới qua nghiệp vụ, giữ lịch sử tăng chứ không tạo hai dòng giống nhau do gửi lại.

### Cách dùng và ràng buộc

**Kiện nguyên.** `quantityBase = sealedPackCount × packagingSnapshot.baseUnitsPerPackage` theo quy cách thực tế đã lưu trên dòng. Ví dụ một chồng có 3 thùng × 4 viên và 2 thùng × 5 viên thì có hai dòng, tổng 22 viên. Không lấy quy cách của phiếu mới để tính lại thùng cũ. Kích thước ngoài giữ trong packagingSnapshot của hàng thực tế; nếu thiếu thì đo thủ công theo C07, không bỏ qua kiểm sức chứa.

**Mở thùng.** Nếu mở một thùng 4 viên rồi lấy ra 1 viên để chuyển hoặc xuất, giảm một kiện ở dòng SEALED và ghi 3 viên còn lại vào dòng OPEN. Một viên được lấy đi phải có nguồn/đích hoặc phiếu xuất tương ứng. Nếu chỉ mở thùng mà chưa lấy viên nào thì ghi 4 viên OPEN, tổng số dư C02 vẫn giữ nguyên. Chồng có hàng OPEN/LOOSE phải dùng MEASURED; không suy thể tích theo tỷ lệ số viên còn trong vỏ thùng. Không thêm mã riêng cho từng thùng.

**Nhiều dòng trên một chồng.** Có thể ghi nhiều sản phẩm/lô/quy cách trên cùng chồng khi thực tế cho phép. Mỗi dòng vẫn trỏ đúng số dư C02; không gộp lô, chất lượng hoặc chủ hàng. Nếu một kiện được mở để phân loại một phần hàng lỗi thì ghi các dòng OPEN theo số dư chất lượng tương ứng; không đếm vỏ thùng thành hai kiện nguyên. Diện tích và thể tích thủ công thuộc chồng C07, không cộng lại theo từng dòng hàng bên trong.

**Đối chiếu số lượng.** Với mỗi số dư C02 tại LOCATION, tổng `quantityBase` của các dòng C08 thuộc số dư đó phải bằng số lượng C02 sau mỗi xác nhận. Một số dư có thể chia ở nhiều chồng trong cùng ô. C08 diễn tả cách xếp của lượng C02, báo cáo tồn không cộng thêm C08 vào C02. Hàng IN_TRANSIT không có chồng trong ô; khi thực nhận mới gắn chồng tại ô đích. Hàng lỗi và hàng giữ hộ vẫn có C08 và chiếm sức chứa.

**Di chuyển và gửi lại.** Chuyển từ ô A sang B giảm đúng dòng ở chồng A, tăng/tạo dòng ở chồng B với số dư đích tương ứng, mang theo bản thông tin đóng gói thực tế. Thực hiện cùng cập nhật số dư, lịch sử và phần giữ C05; kiểm sức chứa cho các ô bị ảnh hưởng. Gửi lại cùng nghiệp vụ phải trả kết quả cũ. Các dòng đã về 0 được giữ để truy lịch sử; không xóa lịch sử nguồn hoặc tự điều chỉnh C02 cho khớp khi phát hiện lệch.

**Nguồn gốc và quyền.** Lịch sử G02 ghi dòng C08 nào thay đổi, lượng/đóng gói trước và sau, phiếu/dòng nguồn, người và thời gian; liên kết C03/C04 nếu có biến động số dư. Nhiều lần nhập cùng lô vẫn truy được các lần tăng qua lịch sử này. Warehouse Staff xác nhận đóng gói thực tế trong nghiệp vụ kho đã có quyền; ghi hệ số/quy cách theo nhãn và dòng nguồn, không sửa hệ số đã ghi để hợp thức hóa lượng thiếu. Store Owner xem; các quyền khác theo A02/A03 và phạm vi dữ liệu. Không tự mở thêm chức năng chỉnh tồn tự do từ màn hình đóng gói.

## Ví dụ tính sức chứa

Ô có chiều dài 2 m, rộng 2 m, cao hữu dụng 1 m. Sáu kiện 1 × 1 × 0,5 m xếp thành ba chồng hai tầng, không dùng pallet: mỗi C07 dài 1 m, rộng 1 m, cao 1 m; mỗi C08 ghi 2 kiện. Tổng chiếm 3 m² và 3 m³. Thêm hai kiện thành chồng thứ tư vừa đủ 4 m² và 4 m³. Thêm một kiện nữa thì không thể tạo chồng mới vì vượt diện tích; đặt lên chồng cũ thì vượt chiều cao. Phải chọn ô khác hoặc chia hàng theo phần ô còn chứa được. Số liệu chỉ minh họa.

**Trạng thái:** C07 v0.1 và C08 v0.1 đã duyệt riêng, gồm trường, quan hệ, quy tắc đo/tính, quyền và dấu vết nêu trên. Kết quả duyệt bao gồm việc lưu chung nhiều dòng trên một chồng, cách nhập kích thước và xử lý kiện mở. Các bảng chứng từ và lịch sử thao tác liên quan tiếp tục được trình riêng.

**Điều chỉnh đơn vị/quy cách 01/11/2026 đã chốt:** bỏ B03/B06; thay ID quy đổi bằng dữ liệu trên dòng và packagingSnapshot được giữ khi chuyển hàng. Việc sửa tham chiếu theo quyết định này không mở lại các quyền và quy tắc sức chứa đã duyệt.
