# Phiếu duyệt B01–B03 — Kho hàng, vị trí và đơn vị tính

Hồ sơ cập nhật 0.2 ngày 31/10/2026. **B01 đã duyệt theo v0.1. B02 đã chốt yêu cầu quản lý sức chứa. B03 đang làm rõ mã trên thùng để truy lô.** Đối chiếu [phiếu 0.1 đã gửi](history/05_Duyet_kho_vi_tri_don_vi_tinh_v0.1.md).

Nguồn đối chiếu: Warehouse/Location trong ERD; UC-27–33 và master data trong tài liệu; model `warehouse.model.js`, `product.model.js`; snapshot MongoDB hiện có 3 warehouses, 15 locations và 3 uoms. Số lượng này mô tả hiện trạng, không giới hạn số bản ghi của thiết kế mới.

Áp dụng quyết định A02/A03: tên vai trò kho là **Warehouse Staff**, Admin được tạo role và tick quyền. “Cấp mặc định cho Store Owner” bên dưới là đề xuất cấu hình ban đầu, không là kiểm cứng mã OWNER; Admin có thể cấp các quyền đã có cho role khác. Điều kiện về phạm vi kho, tồn và chứng từ vẫn phải giữ.

## B01 — warehouses — Kho hàng

**Một bản ghi là một kho vật lý của cửa hàng.** Ví dụ Kho gạch A, Kho gạch B, Kho thiết bị vệ sinh. Bảng này lưu danh mục kho và địa chỉ; số lượng hàng từng kho được tính từ dữ liệu tồn, không ghi một số `totalStock` tùy ý vào bảng kho.

**Tên hiện tại → đề xuất:** `warehouses` → `warehouses`, giữ vì đã dễ hiểu. Không thêm bảng công ty/chi nhánh trong phiếu này.

### Trường đề xuất

| Trường | Kiểu | Bắt buộc / mặc định | Chú thích |
|---|---|---|---|
| `_id` | ObjectId | Có, tự tạo | Định danh kho dùng trong các quan hệ; giữ nguyên khi đổi tên/địa chỉ |
| `code` | String | Có, duy nhất toàn hệ thống | Mã kho, ví dụ `KHO-GACH-A`; đề xuất chuẩn chữ hoa, bỏ khoảng trắng hai đầu và không đổi sau tạo |
| `name` | String | Có | Tên kho người dùng nhìn thấy |
| `address` | String | Không bắt buộc | Địa chỉ/vị trí thực tế; chỉ ghi thông tin có thật, không tự sinh từ tên kho |
| `description` **(mới)** | String | Không bắt buộc | Chú thích mục đích sử dụng, ví dụ kho gạch hoặc thiết bị vệ sinh; không giới hạn sản phẩm được lưu chỉ bằng câu mô tả |
| `isActive` | Boolean | Có, mặc định true | Kho còn được sử dụng cho giao dịch mới |
| `version` **(mới)** | Integer | Có, mặc định 1 | Ngăn ghi đè khi nhiều người cùng sửa danh mục kho |
| `createdAt` / `updatedAt` | Date | Có, tự ghi | Thời gian UTC; người thay đổi và chi tiết thay đổi ghi trong audit_logs, duyệt riêng ở G02 |

### Quan hệ

- **Warehouse 1 — n WarehouseLocation:** mỗi vị trí thuộc đúng một kho; kho mới có thể chưa có vị trí. Muốn thao tác theo ô phải tạo vị trí phù hợp trước.
- **User n — n Warehouse:** phân công qua `users.warehouseIds` đã duyệt ở A01; không thêm một trường người phụ trách duy nhất làm mất khả năng một kho có nhiều nhân viên.
- **Warehouse 1 — n hồ sơ:** kho nhận PO/GR, kho xuất hàng, phiên kiểm kê; mỗi loại phiếu có ràng buộc riêng sẽ duyệt ở nhóm đó.
- TR có hai quan hệ riêng đến Warehouse: kho nguồn và kho đích, phải khác nhau. TO di chuyển trong cùng kho phải có hai vị trí thuộc cùng Warehouse. Không dùng tên/địa chỉ để phân biệt hai kho.
- Kho chứa nhiều lô/sản phẩm thông qua các vị trí và số dư tồn; không nhúng lịch sử xuất/nhập hoặc toàn bộ sản phẩm vào bảng kho.

### Quyền, sửa và ngừng sử dụng đã duyệt

- Quyền tạo/sửa/ngừng sử dụng kho **cấp mặc định cho Store Owner**; Admin có thể cấp cho role khác theo A02. Admin quản lý tài khoản không tự có quyền chỉnh kho nếu chưa được cấp.
- Sửa tên/địa chỉ/mô tả không chuyển hàng và không đổi số dư. Tên/địa chỉ trên phiếu đã xác nhận cần giữ thông tin lịch sử theo thiết kế chứng từ, không dùng việc sửa master để sửa phiếu cũ.
- Chỉ ngừng kho khi hết hàng vật lý, hàng giữ hộ và hàng đang chuyển liên quan; không còn phiếu/nhiệm vụ đang thực hiện hoặc khóa kiểm kê. Điều kiện chi tiết sẽ kiểm theo các bảng giao dịch tương ứng.
- Không xóa kho; ngừng dùng vẫn giữ lịch sử để xem các phiếu cũ. User còn tham chiếu kho ngừng dùng không được thao tác mới tại kho đó.
- Không thêm diện tích/sức chứa/người quản lý chính/giờ mở cửa khi chưa có chức năng cần dùng. Nếu cần trường nào, người dùng bổ sung trước duyệt.

**Ví dụ minh họa:** `KHO-GACH-A`, tên “Kho gạch A”, địa chỉ đã khảo sát, active. Trong kho có các vị trí nhận hàng, lưu trữ và hàng lỗi; mỗi vị trí là bản ghi B02 riêng.

### Quyết định B01

1. Duyệt tên bảng, các trường và quan hệ trên; địa chỉ/mô tả tùy chọn.
2. Quyền duy trì kho cấp ban đầu cho Store Owner, role khác được Admin cấp quyền khi cần.
3. Mã cố định; chỉ ngừng dùng khi đã xử lý hết tồn/giao dịch; giữ lịch sử thay vì xóa.

**ĐÃ DUYỆT B01 v0.1.** Phản hồi của người dùng: “Duyệt B01 v0.1”. Bảng trường, các quan hệ, quyền mặc định và điều kiện ngừng dùng trong phiếu 0.1 được duyệt đầy đủ.

## B02 — warehouse_locations — Vị trí/ô trong kho

**Một bản ghi là một điểm đặt hàng được định danh trong một kho**, gồm ô lưu trữ, cửa nhận, chỗ tập kết hoặc khu cách ly. Đây chính là “Lot” theo nghĩa vị trí mà người dùng đã giải thích trước đây; **khác lô sản xuất** ở `product_batches` sẽ duyệt tại B05.

**Tên hiện tại → đề xuất:** `locations` → `warehouse_locations`. Danh mục sơ bộ trước từng đề xuất `storage_locations`; tên mới bao quát cả nhận, tập kết và cách ly, chưa mặc định được duyệt.

### Trường đề xuất

| Trường | Kiểu | Bắt buộc / mặc định | Chú thích |
|---|---|---|---|
| `_id` | ObjectId | Có, tự tạo | ID vị trí để tồn, TO và kiểm kê tham chiếu |
| `warehouseId` | ObjectId → warehouses | Có | Kho chứa vị trí; đề xuất cố định sau tạo, không sửa kho của một vị trí để chuyển hàng |
| `code` | String | Có | Mã vị trí, ví dụ `A-01` hoặc `RECEIVING-01`; duy nhất trong một kho, có thể trùng mã ở kho khác; đề xuất không đổi sau tạo |
| `name` **(mới)** | String | Có | Tên dễ hiểu, ví dụ “Ô A-01 — gạch lát nền” hoặc “Khu hàng lỗi” |
| `areaCode` **(mới)** | String | Không bắt buộc | Mã khu để nhóm vị trí, ví dụ `GACH-LAT`; không tạo thêm bảng khu trong phương án 0.1 |
| `locationType` **(đổi tên từ kind)** | String enum | Có | Một trong năm loại vị trí ở bảng bên dưới |
| `isPickable` **(đổi tên từ allocatable)** | Boolean | Có, mặc định false | Cho phép chọn hàng tại vị trí này làm nguồn cấp cho nhu cầu. Chỉ được true với STORAGE; chưa đủ để kết luận hàng khả dụng |
| `description` **(mới)** | String | Không bắt buộc | Hướng dẫn tìm vị trí hoặc ghi chú vận hành |
| `isActive` | Boolean | Có, mặc định true | Cho phép sử dụng vị trí cho tác vụ mới |
| `version` **(mới)** | Integer | Có, mặc định 1 | Phiên bản thay đổi thông tin vị trí |
| `operationVersion` **(đổi tên từ planningVersion)** | Integer | Có, mặc định 0 | Backend dùng phối hợp tạo/xác nhận nhiệm vụ và khóa kiểm kê khi có thao tác đồng thời; người dùng không nhập/sửa |
| `capacityLimit` **(đề xuất v0.2)** | Decimal128 | Giá trị dương khi đã cấu hình | Sức chứa tối đa của vị trí theo đơn vị đo đã chọn. Cần hỏi các loại vị trí bắt buộc cấu hình |
| `capacityUnit` **(đề xuất v0.2)** | Mã đơn vị đo | Đi cùng `capacityLimit` | Cho biết giới hạn tính theo số thùng, pallet, kg hoặc thước đo thực tế khác của cửa hàng. Danh mục mã chờ duyệt |
| `createdAt` / `updatedAt` | Date | Có | Thời điểm tạo/cập nhật |

Đổi tên `allocatable` thành `isPickable` ở đây nghĩa là có thể chọn tồn làm nguồn cho nhu cầu thông thường. Không có nghĩa cấm TO lấy hàng ở RECEIVING để putaway, STAGING để bàn giao hoặc QUARANTINE để xử lý hợp lệ. Mỗi loại TO kiểm điều kiện nguồn/đích riêng.

### Năm loại vị trí đề xuất giữ

| Mã | Tên tiếng Việt | Ý nghĩa |
|---|---|---|
| RECEIVING | Khu nhận hàng | Hàng đã đến/được ghi nhận ở điểm nhận, chờ thao tác đưa vào ô lưu trữ |
| STORAGE | Vị trí lưu trữ | Hàng xếp vào vị trí khai thác bình thường; chỉ hàng đủ điều kiện mới khả dụng |
| STAGING | Khu tập kết | Hàng đang chuẩn bị xuất/giao; không tự trở lại nguồn hàng tự do |
| QUARANTINE | Khu cách ly/hàng lỗi | Hàng cần kiểm tra/xử lý trong chính kho đang chứa; không phải một kho vật lý khác |
| CUSTODY | Khu giữ hộ | Vị trí theo dõi hàng giữ hộ/chưa nhận sở hữu; chủ sở hữu vẫn phải ghi trong dữ liệu tồn |

Đề xuất cho một kho có nhiều vị trí cùng loại nếu cần; không bắt buộc tạo đủ năm loại trước khi tạo kho. Luồng nào cần nguồn/đích loại nào thì phải có vị trí đó. Vị trí có thể là khu đánh dấu trên sàn, không bắt buộc kệ vật lý.

### Quan hệ và quy tắc

- **Warehouse 1 — n WarehouseLocation**; mỗi vị trí đúng một kho, unique `(warehouseId, code)`.
- **WarehouseLocation 1 — n số dư tồn:** một vị trí có thể chứa nhiều sản phẩm/lô/chất lượng/chủ sở hữu; số dư phải giữ các chiều riêng, không gộp chỉ theo mã vị trí.
- TO có **sourceLocationId** và **destinationLocationId** tham chiếu B02. Chuyển vị trí là nghiệp vụ TO, không sửa warehouseId/code của master.
- Nhiều phiên kiểm kê có thể tham chiếu một vị trí ở các thời điểm khác nhau; không cho các phạm vi đang khóa xung đột nhau. Lock/snapshot không nhúng lịch sử vào B02.
- `areaCode` chỉ nhóm vị trí. Sửa khu hoặc tên không đổi tồn. Nếu cần khu–dãy–kệ–tầng quản lý độc lập thì phải thiết kế các thực thể đó riêng và hỏi trước, không coi chuỗi areaCode là đã đủ.
- Quyền tạo/sửa/ngừng vị trí cấp mặc định cho Store Owner; Admin được cấp quyền đó cho role khác. Warehouse Staff xem/chọn nguồn/đích theo quyền và kho được giao; thao tác chuyển hàng không tự cấp quyền sửa danh mục vị trí.
- Có hàng, task mở hoặc khóa kiểm kê thì không đổi loại/ngừng vị trí. Không xóa vị trí; giữ lịch sử. Đổi `isPickable` cũng phải kiểm task/giữ hàng đang có, không dùng để bỏ qua ràng buộc tồn.
- Chất lượng GOOD/DAMAGED và chủ sở hữu phải lưu riêng: chuyển vào QUARANTINE không tự đổi ownership, tên “Khu hàng lỗi” không thay kết quả kiểm nhận.

### Sức chứa của vị trí

Người dùng xác nhận “Cần quản lý sức chứa”. Yêu cầu này áp dụng ở cấp ô/vị trí B02. Trong ERD hiện tại, Location đã có `CapacityLimit`. Hai trường trên là đề xuất hiện thực hóa yêu cầu, còn chờ đơn vị và cách xử lý khi vượt giới hạn.

Ví dụ minh họa nếu cửa hàng đo bằng thùng: ô A-01 chứa tối đa 20 thùng, hiện có 18. Xếp thêm 2 thùng thì vừa đầy. Xếp thêm 3 thùng thì vượt 1 thùng. Khi đó cửa hàng muốn cho xác nhận kèm cảnh báo hay yêu cầu chọn ô khác? Khi lập TO có thể dự báo trước, khi xác nhận cần tính lại theo hàng thực có tại vị trí. Cách tính hàng lẻ, thùng đã mở hoặc thùng khác cỡ chỉ xác định được sau khi biết thước đo thực tế. Nếu đo bằng diện tích, cần phân biệt diện tích sàn bị chiếm với m² gạch bán ra.

**Ví dụ minh họa:** `warehouseId=Kho A`, `code=A-01`, `name=Ô A-01`, `areaCode=GACH-LAT`, `locationType=STORAGE`, `isPickable=true`. “Khu hàng lỗi” là một vị trí khác loại QUARANTINE trong cùng kho, không phải tạo thêm một Warehouse.

### Cần xác nhận B02

1. Duyệt tên `warehouse_locations`, bảng trường và năm loại vị trí; vị trí không phải lô sản xuất.
2. Chỉ nhóm bằng `areaCode` tùy chọn, chưa cần bảng khu/dãy/kệ riêng; một vị trí có thể chứa nhiều sản phẩm/lô.
3. Đã chốt cần quản lý sức chứa. Còn hỏi đơn vị đo thực tế và cách xử lý khi vượt. Sau khi có câu trả lời mới trình toàn bộ cấu trúc B02 để duyệt.
4. Duyệt quyền duy trì mặc định, cách ngừng/đổi loại và các ràng buộc trên.

**Trạng thái B02:** Đã chốt phạm vi sức chứa. Phiếu B02 v0.2 đang đề xuất, chưa duyệt toàn bảng.

## B03 — units — Đơn vị tính

**Một bản ghi là một đơn vị dùng để biểu diễn số lượng**, ví dụ Viên, Thùng, m², Cái, Bộ. Danh mục mở rộng khi có loại hàng cần dùng; không giới hạn chỉ ba bản ghi đang có.

**Tên hiện tại → đề xuất:** `uoms` → `units`, dễ đọc hơn chữ viết tắt UOM.

### Trường đề xuất

| Trường | Kiểu | Bắt buộc / mặc định | Chú thích |
|---|---|---|---|
| `_id` | ObjectId | Có, tự tạo | ID đơn vị để sản phẩm, quy đổi và dòng phiếu tham chiếu |
| `code` | String | Có, duy nhất | Mã như PIECE, BOX, M2; đề xuất chuẩn chữ hoa và không đổi sau tạo |
| `name` | String | Có | Tên hiển thị như Viên, Thùng, Mét vuông |
| `symbol` **(mới)** | String | Không bắt buộc | Ký hiệu trình bày, ví dụ m²; không dùng làm khóa hoặc tự suy hệ số |
| `description` **(mới)** | String | Không bắt buộc | Chú thích ý nghĩa đơn vị nếu cần |
| `isActive` **(mới)** | Boolean | Có, mặc định true | Còn được chọn cho dữ liệu/giao dịch mới |
| `version` **(mới)** | Integer | Có, mặc định 1 | Phiên bản khi sửa danh mục |
| `createdAt` / `updatedAt` | Date | Có | Thời gian UTC |

### Quan hệ và ràng buộc

- **Unit 1 — n Product theo đơn vị gốc:** mỗi sản phẩm có đúng một đơn vị gốc; một đơn vị có thể là đơn vị gốc của nhiều sản phẩm.
- **Product n — n Unit thông qua quy đổi B06:** cùng một sản phẩm có thể nhập theo thùng/viên/m² nếu có quy đổi đã xác minh. Một đơn vị như BOX được nhiều sản phẩm sử dụng với hệ số khác nhau.
- **Unit 1 — n dòng phiếu:** mỗi dòng ghi đơn vị nhập và thông tin quy đổi của thời điểm lập phiếu. Thay tên master không được tính lại số lượng lịch sử.
- Không lưu `1 BOX = 4 PIECE` trong units vì hệ số phụ thuộc sản phẩm/phiên bản. Bảng quy đổi sẽ được duyệt riêng, không coi việc duyệt B03 là đã chốt hệ số cụ thể.
- Quy tắc cho phép số lẻ/nguyên viên phải xét sản phẩm và đơn vị đang nhập tại B04/B06. B03 không ép một quy tắc số lẻ cho mọi sản phẩm hoặc tự làm tròn.
- Quyền tạo/sửa/ngừng đơn vị cấp mặc định cho Store Owner; Admin có thể cấp permission đó cho role khác. Người được tạo phiếu chỉ được chọn đơn vị hợp lệ, không tự sửa hệ số bằng cách đổi đơn vị.
- Đề xuất giữ mã cố định, không xóa. Không ngừng đơn vị đang được dùng bởi sản phẩm/quy đổi còn hoạt động hoặc chứng từ chưa hoàn tất; dữ liệu lịch sử vẫn đọc được sau khi đơn vị ngừng dùng hợp lệ.

**Ví dụ minh họa:** PIECE — Viên; BOX — Thùng; M2 — Mét vuông. Hệ số một thùng có bao nhiêu viên nằm ở từng sản phẩm, không nằm trên dòng BOX này.

### Thông tin cần đọc từ mã trên thùng

Người dùng muốn từ mã thùng xác định **mã sản phẩm, kích thước sản phẩm, quy cách đóng gói và lô hàng** để so sánh với lô khác. Ví dụ hai thùng gạch cùng mã sản phẩm G60, cùng kích thước 600 × 600 mm, cùng quy cách 4 viên/thùng, vẫn có thể thuộc hai lô L01 và L02. “Thùng” cho biết cách đếm. Để biết hàng đang thuộc lô nào cần đọc mã nhận diện trên nhãn.

| Thông tin muốn xem khi đọc nhãn | Nguồn dữ liệu đề xuất | Lý do |
|---|---|---|
| Mã sản phẩm và kích thước danh nghĩa | B04 — Sản phẩm | Nhận ra cùng một mẫu gạch dù nhập nhiều lô |
| Đơn vị Thùng, Viên, m² | B03 — Đơn vị tính | Dùng để nhập số lượng trên phiếu |
| Số viên/thùng và quy cách tại lúc nhập | B06 — Quy cách và quy đổi theo sản phẩm, phiên bản | So sánh được hai lô kể cả khi nhà sản xuất thay đổi quy cách. Dòng phiếu giữ quy cách đã dùng |
| Mã lô nhà sản xuất, tông màu (`tone`), cỡ thực tế (`calibre`) nếu có trên nhãn | B05 — Lô sản phẩm | Giúp kho phân biệt hai lô cùng mã sản phẩm. Thuộc tính thiếu ghi là chưa biết |

Model hiện có SKU và kích thước danh nghĩa trên Product, nhận dạng lô trên Lot, hệ số quy đổi có phiên bản trên ProductUomVersion. Phần cần người dùng xác nhận là **mã trên nhãn lặp lại ở cấp nào**. Từ đó mới chọn cách tra theo mã.

| Thực tế dán nhãn | Hướng thiết kế để xem xét |
|---|---|
| 10 thùng cùng lô cùng mã, sang lô khác đổi mã | Đề xuất gắn mã với lô B05 để tra sản phẩm và quy cách đã nhận. Chỉ dẫn đến đúng một lô sau khi xác định phạm vi duy nhất của mã, chẳng hạn theo nhà cung cấp và sản phẩm |
| 10 thùng cùng lô có 10 mã riêng | Một lô có nhiều thùng vật lý. Mỗi mã thùng trỏ về lô và quy cách đóng gói. Nếu cần collection theo dõi từng thùng, sẽ trình phiếu riêng trước khi duyệt |
| Hai lô khác nhau vẫn có cùng mã thùng vì cùng mẫu/quy cách | Mã này dẫn tới sản phẩm hoặc quy cách B06. Muốn phân biệt hai lô phải đọc thêm mã lô trên nhãn hoặc ghi nhận lô ở phiếu nhập |

Đây là ba khả năng để xác định cách dán nhãn tại cửa hàng. Chưa chọn trường khóa, quan hệ 1–n hay collection thùng. Không bắt buộc máy quét hoặc sinh mã mới trong đề xuất này.

### Các điểm B03 đang đề xuất

1. Duyệt tên `units`, trường và quan hệ, danh mục có thể thêm đơn vị.
2. Store Owner được cấp quyền duy trì ban đầu; role khác do Admin cấp; mã cố định, chỉ ngừng dùng khi đủ điều kiện và giữ lịch sử.
3. Hệ số và quy tắc số lẻ thuộc B04/B06, không gắn cứng vào units.

**Trạng thái B03:** Đã ghi nhận nhu cầu tra và so sánh lô bằng mã trên thùng. Bảng `units` và các thiết kế liên quan B04–B06 chưa được duyệt. Cần ví dụ hai thùng cùng lô và một thùng khác lô để chọn cách lưu phù hợp.

## Ghi nhận ý kiến

B01 đã hoàn tất duyệt. B02 và B03 sẽ được trình lại riêng theo câu trả lời về sức chứa và mã trên nhãn. B04–B06 vẫn được duyệt độc lập.

Các tên quyền hiển thị và cấu hình mặc định ở đây là đề xuất nghiệp vụ, chưa tạo permission mới trong DB. Chưa đổi tên collection hoặc field của code đang dùng.
