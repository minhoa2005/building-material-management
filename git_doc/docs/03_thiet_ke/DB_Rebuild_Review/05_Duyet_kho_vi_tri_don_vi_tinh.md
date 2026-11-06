# B01–B02 — Kho, vị trí; B03 đã bỏ khỏi thiết kế

**Cập nhật 01/11/2026.** B01 v0.1 và bổ sung kích thước v0.3, B02 v0.3 giữ kết quả đã duyệt. B03 đã bỏ theo quyết định mới; các phiếu liên kết sau là lịch sử. [Quyết định bỏ UOM và lưu quy đổi trên dòng](14_Bo_UOM_va_luu_quy_doi_tren_dong.md). [Phiếu 0.1](history/05_Duyet_kho_vi_tri_don_vi_tinh_v0.1.md) · [Phiếu 0.2](history/05_Duyet_kho_vi_tri_don_vi_tinh_v0.2.md) · [Phiếu v0.3](history/05_Duyet_kho_vi_tri_don_vi_tinh_v0.3_de_xuat.md) · [Phiếu B03 v0.4 đã trình](history/05_Duyet_kho_vi_tri_don_vi_tinh_v0.4_de_xuat.md).

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
- Phần v0.1 chỉ duyệt các trường danh mục nêu trên. Các số đo kho được trình riêng bên dưới.

**Ví dụ minh họa:** `KHO-GACH-A`, tên “Kho gạch A”, địa chỉ đã khảo sát, active. Trong kho có các vị trí nhận hàng, lưu trữ và hàng lỗi; mỗi vị trí là bản ghi B02 riêng.

### Quyết định B01

1. Duyệt tên bảng, các trường và quan hệ trên; địa chỉ/mô tả tùy chọn.
2. Quyền duy trì kho cấp ban đầu cho Store Owner, role khác được Admin cấp quyền khi cần.
3. Mã cố định; chỉ ngừng dùng khi đã xử lý hết tồn/giao dịch; giữ lịch sử thay vì xóa.

**ĐÃ DUYỆT B01 v0.1.** Phản hồi của người dùng: “Duyệt B01 v0.1”. Bảng trường, các quan hệ, quyền mặc định và điều kiện ngừng dùng trong phiếu 0.1 được duyệt đầy đủ.

### B01 · Bổ sung kích thước kho (đã duyệt v0.3)

| Trường bổ sung | Kiểu đề xuất | Chú thích |
|---|---|---|
| `lengthMm` | Số nguyên dương | Chiều dài bên trong kho, tính bằng mm |
| `widthMm` | Số nguyên dương | Chiều rộng bên trong kho, tính bằng mm |
| `clearHeightMm` | Số nguyên dương | Chiều cao thông thủy, từ nền tới giới hạn sử dụng an toàn đã đo |

Đề xuất nhập cả bộ số đo khi đã đo thực tế. Kho hiện hữu chưa đo có thể để trống cả bộ. Không suy ra chiều dài, chiều rộng từ diện tích khảo sát. Với kho hình chữ nhật, dài × rộng cho diện tích mặt bằng và dài × rộng × cao cho thể tích bao. Lối đi, cột và vùng cấm xếp hàng khiến diện tích chứa hàng thực tế nhỏ hơn. Kiểm sức chứa lúc xếp dùng số đo hữu dụng của **từng ô** ở B02.

**Ý tưởng cho giai đoạn sau:** dùng số đo kho và ô làm cơ sở cho bản đồ 3D. Khi triển khai mới khảo sát vị trí tương đối của các ô, tầng kệ và hình dạng mặt bằng. Phiếu hiện tại chỉ duyệt cấu trúc dữ liệu phục vụ quản lý kho.

## B02 — warehouse_locations — Vị trí/ô trong kho

**Một bản ghi là một điểm đặt hàng được định danh trong một kho**, gồm ô lưu trữ, cửa nhận, chỗ tập kết hoặc khu cách ly. Đây chính là “Lot” theo nghĩa vị trí mà người dùng đã giải thích trước đây; **khác lô sản xuất** ở `product_batches` đã duyệt tại B05.

**Tên đã duyệt:** `locations` → `warehouse_locations`. Tên mới bao quát cả nhận, tập kết và cách ly.

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
| `usableLengthMm` | Số nguyên dương | Khi cho phép xác nhận xếp hàng | Chiều dài hữu dụng bên trong ô |
| `usableWidthMm` | Số nguyên dương | Cùng bộ số đo | Chiều rộng hữu dụng sau khi trừ phần không thể xếp |
| `usableHeightMm` | Số nguyên dương | Cùng bộ số đo | Chiều cao tối đa có thể xếp an toàn trong ô |
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

### Kiểm sức chứa khi xác nhận xếp hàng

**Đã chốt:** kiểm đồng thời diện tích sàn (m²) và thể tích (m³) của từng ô. Nếu vượt một trong hai giới hạn thì chặn xác nhận. Nhân viên chọn ô khác hoặc chia lượng sang nhiều ô. Mỗi phần được xếp phải đạt điều kiện của ô tương ứng.

**Cách tính đề xuất cho ô hình chữ nhật.** Diện tích tối đa = dài hữu dụng × rộng hữu dụng. Thể tích tối đa = diện tích tối đa × cao hữu dụng. Lưu số đo bằng mm, quy đổi ra m² và m³ để hiển thị. Mỗi tầng kệ có mã ô riêng thì tính sức chứa riêng. Số m² gạch bán cho khách thể hiện diện tích lát được, không thể dùng để tính diện tích sàn kho đang chiếm.

| Dữ liệu | Cách dùng đề xuất |
|---|---|
| Hàng nguyên thùng | Dùng kích thước **ngoài** của thùng được lưu trực tiếp tại dòng nhập và phần hàng trong chồng theo quyết định bỏ B06. Thể tích một thùng = dài × rộng × cao. |
| Hàng xếp chồng | Một chồng chỉ chiếm một phần diện tích đáy. Khi thêm hàng lên chồng cũ, kiểm chiều cao còn lại và khả năng xếp chồng của mặt hàng. Khi phải mở chồng mới, tính thêm diện tích đáy. Tổng diện tích và thể tích còn trống vẫn chưa chứng minh kiện vừa kích thước ô. |
| Hàng lẻ, mở thùng hoặc kiện không đều | Đề xuất Warehouse Staff ghi nhận diện tích đáy và chiều cao thực tế của chồng/kiện nếu không suy được từ quy cách. Dữ liệu chiếm chỗ cần gắn với lần xếp hoặc di chuyển và được duyệt riêng cùng nhóm tồn kho. |
| Khi xác nhận nhập, putaway hoặc chuyển ô | Tính theo hàng thực có trong ô, kể cả hàng lỗi hoặc giữ hộ. Kiểm lại sau khi áp dụng thay đổi dự kiến, kể cả hai nhân viên cùng chọn một ô. Xếp vượt thì giữ nguyên tồn. Thiếu số đo để kiểm thì yêu cầu bổ sung trước khi xác nhận. |

**Ví dụ:** Ô A-01 rộng 2 m, dài 2 m, cao hữu dụng 1 m. Nếu các kiện 1 × 1 × 0,5 m được phép chồng hai tầng thì 6 kiện xếp thành 3 chồng đang dùng 3 m² và 3 m³. Thêm 2 kiện vào phần sàn còn trống thì vừa đủ 4 m² và 4 m³. Thêm 3 kiện sẽ vượt, nhân viên có thể chuyển kiện thứ 9 sang ô đủ chỗ. Các số đo chỉ minh họa cách tính.

**ĐÃ DUYỆT B02 v0.3.** Phản hồi của người dùng: “Duyệt B02 theo phiếu v0.3”. Áp dụng toàn bộ bảng trường, năm loại vị trí, quan hệ, phân quyền và quy tắc sức chứa ở trên. Dữ liệu lần xếp và di chuyển sẽ được mô tả tại các bảng giao dịch liên quan.


## B03 — units — Đơn vị tính

**ĐÃ BỎ KHỎI THIẾT KẾ MỚI · 01/11/2026.** Người dùng yêu cầu bỏ UOM/UOM Version và chọn “Bỏ hai bảng, giữ quy đổi ngay trên dòng phiếu”. B03 v0.4 chỉ còn là lịch sử duyệt, không còn là bảng cần triển khai.

Sản phẩm giữ tên đơn vị gốc trực tiếp. Từng dòng phiếu giữ tên đơn vị nhập, hệ số thực dùng và lượng gốc; không có danh mục đơn vị riêng hoặc quyền tạo/sửa/ngừng danh mục đó. [Quyết định bỏ UOM và lưu quy đổi trên dòng](14_Bo_UOM_va_luu_quy_doi_tren_dong.md).

Mã trên thùng tiếp tục nhận diện lô B05; hãng/SKU/kích thước sản phẩm ở B04. Quy cách và kích thước kiện thực tế nằm trên dòng nguồn và C08. Bỏ bảng đơn vị không bỏ khả năng nhập theo Thùng/Hộp/Viên/Chiếc.

## Ghi nhận ý kiến

B01/B02 giữ cấu trúc và quy tắc đã duyệt. Dữ liệu đơn vị/quy cách theo quyết định mới trong phiếu 14. Việc triển khai hoặc chuyển dữ liệu MongoDB thuộc đợt sau.
