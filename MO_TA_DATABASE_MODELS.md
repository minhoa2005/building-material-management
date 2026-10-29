# Giải thích các model database WMSD

> Đối chiếu trực tiếp mã nguồn trong `src/models` ngày 29/10/2026. Backend sử dụng **MongoDB + Mongoose**. Tài liệu này giải thích cấu trúc đang có trong code; ví dụ là tình huống thực tế được mô phỏng, không phải sự kiện đã xác minh của cửa hàng hoặc bằng chứng các luồng nghiệp vụ đã triển khai đầy đủ.

## Mục lục

1. [Cách đọc và bức tranh tổng thể](#tong-quan)
2. [Tài khoản, phân quyền và dữ liệu danh mục — model 01–11](#danh-muc)
3. [Chứng từ, nguồn, phê duyệt và bằng chứng — model 12–19](#chung-tu)
4. [Tồn kho, giữ hàng và phân bổ nguồn — model 20–25](#ton-kho)
5. [Thao tác nghiệp vụ và hủy phần đơn — model 26–27](#thao-tac)
6. [Kiểm kê và chặn hàng lỗi — model 28–31](#kiem-ke)
7. [Trả hàng và giao thất bại — model 32–35](#tra-hang)
8. [Nhật ký, sự kiện và thông báo — model 36–39](#su-kien)
9. [Tra cứu đủ 35 loại chứng từ](#loai-chung-tu)
10. [Tra cứu đủ 19 loại dòng chứng từ](#loai-dong)
11. [Ví dụ xuyên suốt các luồng](#vi-du-luong)
12. [Các điểm dễ nhầm và giới hạn của model](#luu-y)
13. [Nguồn đối chiếu](#nguon)

<a id="tong-quan"></a>
## 1. Cách đọc và bức tranh tổng thể

### 1.1 Model, collection và bản ghi khác nhau thế nào?

| Khái niệm | Hiểu đơn giản | Ví dụ |
|---|---|---|
| Schema | Bản mô tả các trường, kiểu dữ liệu và kiểm tra cục bộ | `StockBalance` cần tài khoản tồn, lô, chất lượng, chủ hàng và số lượng |
| Model | Đối tượng Mongoose dùng để tạo/đọc dữ liệu theo schema | Tra số gạch đang có ở ô A01 |
| Collection | Nơi MongoDB lưu các bản ghi cùng nhóm | `stock_balances` |
| Document MongoDB | Một bản ghi trong collection | Một số dư của lô A ở vị trí K1-A01 |
| Chứng từ nghiệp vụ | Phiếu nghiệp vụ lưu bằng model `BusinessDocument` | Phiếu mua PO, phiếu nhập GR, đơn bán SO |
| Discriminator | Các schema con dùng chung collection, phân biệt bằng một trường loại | Phiếu mua và phiếu nhập cùng là chứng từ nhưng có thông tin riêng theo loại |

**Hiện có 39 model gốc tương ứng 39 collection.** Ngoài ra Mongoose đăng ký 35 discriminator cho `BusinessDocument` và 19 discriminator cho `DocumentLine`; các schema con này không tạo thêm collection riêng.

SQL trong `git_doc` là thiết kế tham chiếu với 84 bảng/2 view. Không thể lấy số bảng SQL làm số collection MongoDB. Ví dụ quan hệ user–warehouse được lưu bằng `User.warehouseIds`, còn nhiều loại phiếu cùng nằm trong `business_documents`.

### 1.2 Sơ đồ đọc nhanh

| Nhóm liên hệ | Cách hiểu trong cửa hàng |
|---|---|
| User, Role, Permission | Một nhân viên có vai trò và các quyền thao tác phù hợp |
| Warehouse, Location | Một kho có nhiều khu vực hoặc ô chứa hàng |
| Product, Uom, ProductUomVersion, Lot | Phân biệt mặt hàng, đơn vị, quy cách đóng gói và lô hàng |
| BusinessDocument, DocumentLine | Một phiếu có phần đầu và nhiều dòng hàng |
| DocumentLink, LineLink | Truy phiếu và từng lượng hàng về đúng nguồn |
| StockAccount, StockBalance | Xác định hàng ở đâu, thuộc lô nào, chất lượng gì, của ai và còn bao nhiêu |
| PostingBatch, StockMovement | Truy một lần nhập/xuất/chuyển và các thay đổi số lượng của lần đó |
| Approval, Evidence, AuditEvent | Biết ai quyết định, dựa trên căn cứ nào và ai đã thao tác |

Các quan hệ này được lưu bằng các định danh liên kết. MongoDB không tự kiểm tra chúng như khóa ngoại trong cơ sở dữ liệu quan hệ.

### 1.3 Bối cảnh các ví dụ thực tế

Các ví dụ mô phỏng việc vận hành một cửa hàng gạch, dùng để giải thích ý nghĩa model bằng tình huống đời thường. Đây là tình huống giả định, không phải dữ liệu hoặc sự kiện đã xác minh của cửa hàng.

- **Nhân vật:** cô Mai là chủ cửa hàng (Owner), chị Lan là nhân viên bán hàng (Sales), chị Hương là kế toán (Accountant); anh Nam và anh Bình là nhân viên kho (Warehouse).
- **Hàng hóa:** gạch lát nền 60 × 60 màu xám; giả sử quy cách đang dùng là 4 viên/thùng. Hệ số thật phải theo từng sản phẩm và phiên bản.
- **Địa điểm:** kho A, kho B; mỗi kho có khu nhận hàng, ô lưu trữ, khu chờ xuất và khu cách ly.
- **Cách đọc:** mỗi model có một đoạn “Ví dụ thực tế” nêu việc xảy ra, thông tin cần ghi nhận và lý do cần model. Tên trường kỹ thuật được giữ trong phần mô tả để đối chiếu source.
- **Số lượng:** các ví dụ luôn nói rõ viên/thùng; phần mô tả kỹ thuật vẫn giải thích cách database lưu số chính xác. Các tình huống độc lập trừ khi được nói rõ là cùng một chuỗi.

### 1.4 Những quy tắc dữ liệu dùng chung

| Đặc điểm | Ý nghĩa |
|---|---|
| `_id` | Định danh MongoDB; các trường `...Id` thường tham chiếu tới `_id`, không phải `code` |
| `createdAt`, `updatedAt` | Timestamp tự sinh. Model append-only chỉ có `createdAt`, không có `updatedAt` tự sinh |
| `strict: "throw"` | Schema từ chối trường ngoài cấu trúc khi đi qua API Mongoose tương ứng |
| `versionKey: false` | Không sử dụng `__v` mặc định; một số model có `version` riêng |
| `version` | Phiên bản phục vụ kiểm soát cập nhật; service phải đọc/so khớp/tăng phiên bản đúng cách |
| Số lượng | Mặc định precision 20, scale 6; không âm, một số trường bắt buộc lớn hơn 0 |
| Hệ số | Precision 24, scale 12; phải dương |
| Append-only | Chỉ thêm lịch sử mới; middleware chặn save lại/update/delete thông thường. Sửa sai bằng bản ghi điều chỉnh có liên kết |
| `unique` | Khai báo index ở database; không phải kiểm tra trùng tự chạy chỉ bằng `validate()` |

<a id="danh-muc"></a>
## 2. Tài khoản, phân quyền và dữ liệu danh mục

### 01. Permission — một quyền thao tác

**Collection:** `permissions`. **Nguồn:** [access.model.js](src/models/access.model.js).

Lưu mã một quyền, ví dụ đọc yêu cầu bổ sung. Trường `code` là chuỗi bắt buộc, duy nhất. Model không tự giới hạn mã quyền theo danh mục nghiệp vụ; lớp quản trị/service phải kiểm danh mục được phép.

**Ví dụ thực tế:** Anh Nam là nhân viên kho. Khi mở danh sách yêu cầu bổ sung, anh cần quyền “Xem yêu cầu bổ sung”; khi lập phiếu mới, anh cần thêm quyền “Tạo yêu cầu bổ sung”. Permission biểu diễn từng quyền riêng lẻ như vậy. Có quyền xem không đồng nghĩa được duyệt phiếu hoặc xem phiếu ngoài phạm vi được giao.

Hiểu là: quyền “xem yêu cầu bổ sung hàng”. Có quyền này chưa có nghĩa được xem mọi phiếu; vẫn phải xét kho và phạm vi bản ghi.

### 02. Role — vai trò và tập quyền

**Collection:** `roles`. **Nguồn:** [access.model.js](src/models/access.model.js).

`code` nhận một trong `OWNER`, `SALES`, `WAREHOUSE`, `ACCOUNTANT`, `ADMIN`, và có index duy nhất. `permissionIds` là mảng tham chiếu `Permission`, không chứa ID trùng.

**Ví dụ thực tế:** Cửa hàng có hai nhân viên kho là anh Nam và anh Bình. Cả hai cùng thuộc vai trò Nhân viên kho, nên được gán nhóm quyền phù hợp với công việc kho. Role lưu nhóm quyền của vai trò này; cửa hàng không phải thiết lập lại từng quyền cho từng người. Tuy nhiên, Nam được giao kho A và Bình được giao kho B thì phạm vi làm việc của họ vẫn khác nhau.

Nhiều nhân viên kho có thể cùng dùng role WAREHOUSE. Quyền của role và kho được phân công cho từng user là hai chiều khác nhau.

### 03. User — tài khoản nhân viên

**Collection:** `users`. **Nguồn:** [user.model.js](src/models/user.model.js).

| Trường | Giải thích |
|---|---|
| `username`, `fullName` | Tên đăng nhập duy nhất và họ tên |
| `passwordHash` | Mật khẩu đã băm; mặc định không được select trong query thông thường |
| `roleId` | Một tham chiếu Role bắt buộc; không phải mảng nhiều role |
| `warehouseIds` | Các kho được phân công; không chứa ID trùng |
| `phone`, `isActive` | Liên hệ tùy chọn; trạng thái hoạt động mặc định `true` |

**Ví dụ thực tế:** Anh Nam đăng nhập bằng tài khoản cá nhân để nhận hàng và soạn hàng tại kho A và kho B. User ghi nhận Nam là ai, tài khoản có còn hoạt động không, đang giữ vai trò Nhân viên kho và được phân công những kho nào. Khi Nam xác nhận một lần nhận hàng, hệ thống có thể truy lại đúng Nam là người thực hiện. Anh Bình có cùng vai trò vẫn cần tài khoản riêng để không lẫn trách nhiệm.

Anh Nam có đúng một role nhưng được làm việc ở hai kho. `roles=[role]` hoặc `primaryRole` trong DTO tương thích không phải các trường lưu trong model User. Schema chỉ lưu hash dạng chuỗi; việc băm mật khẩu thuộc service.

### 04. Warehouse — kho vật lý

**Collection:** `warehouses`. **Nguồn:** [warehouse.model.js](src/models/warehouse.model.js).

`code` duy nhất; `name` bắt buộc; `address` tùy chọn; `isActive` mặc định `true`. Warehouse mô tả kho, không trực tiếp lưu số tồn.

**Ví dụ thực tế:** Cửa hàng có kho A và kho B ở hai địa điểm khác nhau. Khi một xe giao hàng đến kho A, nhân viên phải ghi nhận đúng kho A, không chỉ ghi chung là “hàng của cửa hàng”. Warehouse giúp phân biệt các kho vật lý, tên kho, địa chỉ và tình trạng hoạt động. Bản thân hồ sơ kho chưa cho biết trong kho còn bao nhiêu viên gạch.

Muốn biết kho này có bao nhiêu gạch phải đi qua Location → StockAccount → StockBalance và Lot → Product.

### 05. Location — vị trí/khu vực bên trong kho

**Collection:** `locations`. **Nguồn:** [warehouse.model.js](src/models/warehouse.model.js).

`warehouseId` chỉ kho cha; `code` duy nhất **trong cùng kho**. `kind` gồm RECEIVING (tiếp nhận), STORAGE (lưu trữ), STAGING (chờ xuất), QUARANTINE (cách ly), CUSTODY (giữ hộ). `allocatable` mặc định `false`, chỉ được `true` khi kind là STORAGE; `isActive` mặc định `true`.

**Ví dụ thực tế:** Bên trong kho A có khu nhận hàng, ô lưu trữ A01, khu chờ xuất và khu cách ly. Xe vừa giao 12 viên thì hàng nằm ở khu nhận hàng; sau khi cất xong, hàng chuyển sang A01. Location giúp trả lời “hàng đang ở chỗ nào trong kho?”. Cùng là kho A nhưng gạch ở khu cách ly không được xử lý như gạch sẵn cấp tại ô lưu trữ A01.

A01 của kho A và A01 của kho B là hai vị trí khác nhau. GOOD tại RECEIVING chưa tự trở thành hàng có thể cấp cho đơn mới.

### 06. Party — cửa hàng, nhà cung cấp, khách hàng, đơn vị vận chuyển

**Collection:** `parties`. **Nguồn:** [party.model.js](src/models/party.model.js).

`code` duy nhất toàn collection; `name`, `kind` bắt buộc. `kind` nhận STORE/SUPPLIER/CUSTOMER/CARRIER. `contactReference` tùy chọn, `isActive` mặc định `true`. Partial unique index chỉ cho phép **một Party kind STORE**.

**Ví dụ thực tế:** Trong một chuyến nhận hàng có cửa hàng, nhà cung cấp và đơn vị vận chuyển; khi bán còn có khách hàng. Party lưu thông tin các bên này. Chẳng hạn khách mang 2 viên đến để đề nghị trả: hàng đã nằm tại cửa hàng nhưng vẫn có thể thuộc khách trong lúc chờ quyết định. Model này giúp phân biệt người đang giữ hàng với bên thực sự sở hữu hàng.

Party còn trả lời “hàng thuộc về ai?” qua `StockBalance.ownerPartyId`. Gạch khách gửi lại nhưng chưa được nhận vào sở hữu vẫn có thể nằm tại cửa hàng mà chủ hàng là CUSTOMER. Vai trò CARRIER trong Party không phải role đăng nhập.

### 07. Uom — danh mục đơn vị tính

**Collection:** `uoms`. **Nguồn:** [product.model.js](src/models/product.model.js).

`code` duy nhất và `name` bắt buộc. PIECE/BOX/M2 là các ví dụ; schema không hardcode chỉ ba mã này. Uom không lưu hệ số quy đổi cho mọi sản phẩm.

**Ví dụ thực tế:** Chị Lan bán hàng thường nói “3 thùng gạch”, anh Nam kiểm kho lại cần biết có bao nhiêu “viên”, còn khách có thể hỏi theo “mét vuông”. Uom lưu các tên đơn vị như thùng, viên, mét vuông để hệ thống hiểu mọi người đang dùng đơn vị nào. Riêng việc một thùng có bao nhiêu viên phải xét từng sản phẩm, không lấy một hệ số chung cho tất cả gạch.

Một thùng của sản phẩm A có thể có 4 viên, sản phẩm B có thể có 6 viên; hệ số nằm ở ProductUomVersion.

### 08. Product — sản phẩm/SKU

**Collection:** `products`. **Nguồn:** [product.model.js](src/models/product.model.js).

`sku` duy nhất; `name`, `baseUomId` bắt buộc. `wholeBaseUnits=true` mô tả yêu cầu đơn vị gốc nguyên; `nominalSize` là kích thước danh nghĩa tùy chọn; `isActive` mặc định `true`.

**Ví dụ thực tế:** Cửa hàng bán gạch lát nền 60 × 60 màu xám và gạch ốp tường 30 × 60 màu trắng. Mỗi mặt hàng được quản lý bằng một mã sản phẩm riêng. Product lưu hồ sơ mặt hàng, tên, quy cách danh nghĩa và đơn vị gốc. Hai chuyến nhập khác nhau của cùng loại gạch xám vẫn dùng chung một Product; thông tin lô sản xuất được tách sang Lot.

Product trả lời “mặt hàng gì?”, Lot trả lời “lô/tone/calibre nào?”. Product không có trường tồn kho hoặc giá bán. Service phải thực thi yêu cầu nguyên viên khi xử lý số lượng; Boolean này không tự kiểm mọi dòng liên quan.

### 09. ProductUomVersion — phiên bản quy đổi của sản phẩm

**Collection:** `product_uom_versions`. **Nguồn:** [product.model.js](src/models/product.model.js). **Append-only.**

`productId`, `uomId`, `version`, `basePerUnit`, `validFrom` bắt buộc. Bộ `(productId, uomId, version)` duy nhất. `basePerUnit` là **số đơn vị gốc trong một đơn vị đang quy đổi**.

**Ví dụ thực tế:** Tháng 10, loại gạch xám được đóng 4 viên một thùng; chị Lan ghi 3 thùng thì hệ thống hiểu là 12 viên. Đến tháng 11, nhà cung cấp đổi quy cách thành 6 viên một thùng. ProductUomVersion giữ riêng hai phiên bản quy đổi, để phiếu tháng 10 vẫn là 12 viên và không bị tính lại thành 18 viên chỉ vì quy cách mới đã thay đổi.

Nhập 3 BOX với phiên bản này tương ứng 12 PIECE. Nếu sau này đóng gói 6 viên/thùng thì tạo version mới; phiếu cũ giữ conversionSnapshot = 4. Với M2, chiều hệ số vẫn là “viên trên m²”, không phải “m² trên viên”; không suy hệ số từ calibre.

### 10. ProductWarehousePolicy — ngưỡng bổ sung của sản phẩm theo kho

**Collection:** `product_warehouse_policies`. **Nguồn:** [product.model.js](src/models/product.model.js).

Một bản ghi cho mỗi `(productId, warehouseId)`. `minimumQty` là ngưỡng thấp; `targetQty` là mức muốn bổ sung tới, mặc định bằng minimum và không được nhỏ hơn minimum. Số lượng theo đơn vị gốc. `version` mặc định 1, `updatedBy` tùy chọn.

**Ví dụ thực tế:** Cô Mai quy định tại kho A: loại gạch xám xuống dưới 50 viên có thể cấp thì cần xem xét bổ sung, và muốn bổ sung tới mức 80 viên. Kho B có thể dùng ngưỡng khác cho cùng mặt hàng. ProductWarehousePolicy lưu quy định theo từng sản phẩm và từng kho. Nếu kho A còn 18 viên, chưa có nguồn bù hoặc yêu cầu đang chờ, thì lượng cần xem xét để đạt mục tiêu là 62 viên.

Nếu available = 18 và không có nguồn bù/pending RR thì thấp hơn 50, lượng để đạt target là 62. Nếu có nguồn đã được tính hợp lệ thì phải trừ coverage trước khi đề nghị. Policy không tự tạo RR/PO và không thay tồn.

### 11. Lot — lô hàng và thông tin tương thích

**Collection:** `lots`. **Nguồn:** [product.model.js](src/models/product.model.js).

`productId`, `manufacturerLot`, `tone`, `calibre`, `identificationStatus` bắt buộc; `manufacturedOn` tùy chọn. Bộ product + manufacturer lot + tone + calibre duy nhất. `identificationStatus` là VERIFIED hoặc UNKNOWN.

**Ví dụ thực tế:** Hai đợt gạch xám cùng mã sản phẩm được giao tới cửa hàng. Đợt thứ nhất có tone T01, calibre C01; đợt thứ hai có tone T02, calibre C01. Khi khách cần lát nối tiếp nền đã dùng tone T01, nhân viên không thể gộp gạch tone T02 vào chỉ vì cùng tên sản phẩm. Lot giúp nhận diện và chọn đúng lô, sắc độ và cỡ thực tế phù hợp.

Hai lô cùng SKU nhưng khác tone/calibre không tự hoán đổi cho nhau. VERIFIED nghĩa nhận dạng đã xác minh, không có nghĩa chất lượng GOOD: chất lượng thuộc từng StockBalance, nên cùng lô có thể vừa có hàng GOOD vừa có hàng DAMAGED.

<a id="chung-tu"></a>
## 3. Chứng từ, nguồn, phê duyệt và bằng chứng

### 12. BusinessDocument — thông tin chung và đầu phiếu nghiệp vụ

**Collection:** `business_documents`. **Nguồn:** [business-document.model.js](src/models/business-document.model.js).

| Trường | Giải thích |
|---|---|
| `documentNo` | Mã chứng từ duy nhất trên toàn collection, không chỉ trong từng loại |
| `documentKind` | Một trong 35 loại; quyết định schema con |
| `workflowStatus` | Mặc định DRAFT; SO và hai loại confirmation có enum riêng |
| `version` | Phiên bản chứng từ, mặc định 1 |
| `createdBy` | User thực lập phiếu |
| `occurredAt`, `note` | Thời điểm nghiệp vụ và ghi chú tùy chọn |
| `externalReferenceIds` | Mảng tham chiếu nguồn ngoài không trùng |
| `header` | Đối tượng có kiểu theo documentKind; không phải túi JSON tùy ý |

**Ví dụ thực tế:** Chị Lan lập phiếu đề nghị bổ sung RR-001 cho kho A, cần hàng ngày 02/11 và hiện mới lưu nháp. Phần đầu phiếu cho biết mã phiếu, loại phiếu, ai lập, kho nhận và ngày cần. BusinessDocument quản lý phần thông tin chung này, tương tự phần đầu của một tờ phiếu giấy. Danh sách từng loại gạch và lượng cần mua nằm ở các dòng phiếu.

Đây mới là đầu phiếu RR: kho nào, ngày cần, ai lập. Các sản phẩm và số lượng nằm trong DocumentLine. `creationKey` chống tạo lặp theo người lập; service còn phải so payloadHash. Nếu có thông tin gửi duyệt thì `submittedBy` và `submittedAt` phải cùng xuất hiện.

35 loại phiếu **không phải 35 collection**. Khi chọn loại đơn mua, hệ thống dùng cấu trúc thông tin của đơn mua; phiếu đề nghị bổ sung dùng cấu trúc riêng của loại đề nghị. Các kind có shape rỗng không định nghĩa thêm header riêng, xem mục 9.

### 13. DocumentLine — dòng sản phẩm của một chứng từ

**Collection:** `document_lines`. **Nguồn:** [document-line.model.js](src/models/document-line.model.js).

| Trường | Giải thích |
|---|---|
| `documentId`, `lineNo` | Phiếu cha và số thứ tự dương; cặp này duy nhất |
| `lineKind` | Một trong 19 loại dòng, mặc định STANDARD; có thể khác tên documentKind |
| `productId`, `lotId` | Sản phẩm bắt buộc, lô tùy chọn tại schema gốc |
| `conversionId` | ProductUomVersion đã dùng; đơn vị nhập được xác định qua bản ghi này |
| `enteredQty` | Số lượng nhập theo đơn vị của conversionId, phải dương |
| `conversionSnapshot` | Hệ số quy đổi chốt tại thời điểm lập dòng, phải dương |
| `qtyBase` | Số lượng đơn vị gốc, phải dương |
| `productNameSnapshot` | Tên sản phẩm lúc lập, giữ cách đọc lịch sử |
| `details` | Dữ liệu có kiểu theo lineKind |

**Ví dụ thực tế:** Trên phiếu RR-001, dòng thứ nhất đề nghị 3 thùng gạch xám, mỗi thùng 4 viên, tương ứng 12 viên; dòng thứ hai có thể đề nghị một mặt hàng khác. DocumentLine lưu riêng từng dòng như vậy. Nhờ đó, cô Mai có thể duyệt 12 viên ở dòng đầu và yêu cầu sửa dòng sau mà không lẫn số lượng giữa hai sản phẩm.

Dòng này đề nghị 3 thùng = 12 viên. Schema kiểm `qtyBase = enteredQty × conversionSnapshot`, làm tròn 6 chữ số thập phân theo helper decimal; quy tắc nguyên viên vẫn cần service. Model hiện **không có trường `enteredUom` riêng**.

Một phiếu nhiều dòng cần các bản ghi riêng với cùng documentId. Cách tách này giúp approval, nguồn, reservation, POD và ledger trỏ đúng từng dòng. `documentId` đã là ID phiếu cha; không thêm `replenishmentId`/`salesOrderId` tùy ý vào details.

RR có ba trigger: SALES_SHORTAGE, STOCKTAKE_LOW_STOCK, MANUAL_OTHER. Hai trigger có nguồn bắt buộc lưu phiên bản/đánh giá/coverage snapshot tương ứng; MANUAL_OTHER không gắn giả nguồn SO/kiểm kê. Lượng khác suggestedQty cần `quantityAdjustmentReason`; lượng vượt thiếu bán phải tách dòng nhu cầu khác. Chi tiết ở mục 10.

### 14. DocumentLink — quan hệ giữa hai chứng từ

**Collection:** `document_links`. **Nguồn:** [document-link.model.js](src/models/document-link.model.js).

`parentDocumentId`, `childDocumentId`, `relationCode` bắt buộc; bộ ba duy nhất. Hai đầu không được cùng ID. Mã quan hệ là chuỗi; service kiểm ngữ nghĩa từng mã.

**Ví dụ thực tế:** Sau khi RR-001 được duyệt, chị Hương lập đơn mua PO-001 để đặt nhà cung cấp. Một tuần sau, cô Mai muốn biết “đơn mua này xuất phát từ đề nghị nào?”. DocumentLink nối hai phiếu RR-001 và PO-001 để truy ngược nguồn, thay vì phải đọc ghi chú hoặc đoán theo ngày lập.

Hiểu là PO này được lập từ RR kia. Link chỉ biểu diễn liên hệ, không tự chứng minh RR đã duyệt hoặc làm tăng tồn.

### 15. LineLink — quan hệ và lượng giữa hai dòng

**Collection:** `line_links`. **Nguồn:** [document-link.model.js](src/models/document-link.model.js).

`sourceLineId`, `targetLineId`, `relationCode`, `linkedQty` bắt buộc; lượng dương; hai đầu khác nhau; bộ nguồn–đích–quan hệ duy nhất.

**Ví dụ thực tế:** RR-001 có hai dòng: 12 viên gạch xám và 20 viên gạch trắng. Chị Hương mới đặt 8 trong 12 viên gạch xám vào PO-001, còn 4 viên dự kiến đặt ở đợt sau. LineLink ghi rõ dòng mua 8 viên đang đáp ứng dòng đề nghị gạch xám nào và với lượng bao nhiêu. Nó giải thích chi tiết hơn quan hệ chung giữa hai phiếu.

DocumentLink nói “PO từ RR nào”, LineLink nói “12 viên trên dòng PO lấy từ dòng RR nào”. Một dòng nguồn có thể được chia sang nhiều dòng đích; tổng không vượt nguồn phải do service kiểm.

### 16. Approval — quyết định theo phiên bản chứng từ

**Collection:** `approvals`. **Nguồn:** [approval.model.js](src/models/approval.model.js). **Append-only.**

`documentId`, `documentVersion`, `decisionKind`, `decision`, `requestedBy`, `decidedBy`, `reason` bắt buộc; `decidedAt` mặc định hiện tại. Decision gồm APPROVE/REJECT/REVISE. `lines` chứa thông tin từng dòng được quyết định, gồm dòng phiếu, lượng duyệt và kết quả; không trùng lineId trong cùng quyết định. Bộ phiếu–phiên bản–loại quyết định duy nhất.

**Ví dụ thực tế:** Chị Lan gửi đề nghị mua thêm 12 viên. Cô Mai xem xét và đồng ý đúng 12 viên trên nội dung hiện tại của phiếu, kèm lý do quyết định. Approval lưu ai đề nghị, ai quyết định, quyết định gì và áp dụng cho phiên bản nào. Nếu chị Lan sửa đề nghị thành 20 viên, quyết định duyệt 12 viên trước đó không tự trở thành quyết định duyệt 20 viên.

Loại quyết định được ghi ở decisionKind; trường này là chuỗi mở trong schema, nên service cần thống nhất mã cho từng nghiệp vụ. Người đề nghị và người duyệt phải khác nhau, trừ decisionKind STANDARD_ACCEPTANCE cho ngoại lệ tự quyết CR thông thường. Service vẫn phải kiểm đúng Sales, kiểm hàng, điều kiện CR và version; chỉ đặt chuỗi này không tự cấp quyền.

Nếu RR sửa sang version 2, approval version 1 vẫn là lịch sử, không tự cho phép mua theo nội dung mới. Duyệt không post tồn.

### 17. Evidence — metadata của bằng chứng

**Collection:** `evidence_refs`. **Nguồn:** [evidence.model.js](src/models/evidence.model.js). **Append-only.**

`documentId` là phiếu sở hữu bằng chứng; `objectKey` là khóa lưu tệp; `sha256` là hash 64 ký tự hex; `mediaType`, `uploadedBy` bắt buộc; `uploadedAt` mặc định hiện tại.

**Ví dụ thực tế:** Khi giao gạch cho khách, anh Nam chụp ảnh hàng cùng phiếu giao để làm bằng chứng khách thực nhận. Evidence lưu dấu vết của ảnh: ảnh thuộc phiếu nào, ai tải lên, lúc nào và cách tìm lại đúng tệp. Khi có tranh chấp, người có quyền có thể mở bằng chứng gắn với đúng lần giao đó. Model này quản lý thông tin bằng chứng; nội dung ảnh được lưu tại nơi lưu tệp.

Database lưu thông tin tham chiếu để tìm đúng tệp và dấu kiểm tra nội dung, không nhúng nội dung ảnh vào model này. Có bản ghi Evidence chưa chứng minh tệp thật đã upload thành công, là ảnh hợp lệ, hay user có quyền tải; các điều kiện đó thuộc storage/service.

### 18. ExternalReference — đầu hồ sơ/chứng từ nguồn ngoài

**Collection:** `external_references`. **Nguồn:** [external-reference.model.js](src/models/external-reference.model.js).

`sourceSystem`, `referenceKind`, `referenceNo`, `correlationId` bắt buộc. correlationId duy nhất; bộ hệ thống–loại–số tham chiếu cũng duy nhất. `referenceDate`, `sourceVersion`, `verifiedBy`, `verifiedAt` tùy chọn.

**Ví dụ thực tế:** Khách đã có đơn bán số MISA-001 ở hệ thống bên ngoài. Chị Lan sao đơn vào WMSD để tổ chức xuất và giao hàng. ExternalReference lưu nguồn “MISA”, số đơn gốc và thông tin xác minh để sau này biết đơn trong WMSD dựa trên căn cứ nào. Nếu người khác nhập lại cùng đơn gốc, hệ thống có cơ sở phát hiện nguồn bị lặp.

Lưu căn cứ đơn bán ngoài để WMSD sao lại và truy vết. Không có nghĩa đang kết nối API MISA. Chỉ ghi sourceVersion khi nguồn ngoài thực sự cung cấp; không tự chế phiên bản nguồn.

### 19. ExternalReferenceLine — dòng hàng của nguồn ngoài

**Collection:** `external_reference_lines`. **Nguồn:** [external-reference.model.js](src/models/external-reference.model.js).

`referenceId` trỏ ExternalReference; `lineKey` là mã dòng nguồn; `productId` là sản phẩm; `eligibleQty` là lượng đủ điều kiện của nguồn theo đơn vị gốc. Cặp referenceId–lineKey duy nhất; eligibleQty không âm.

**Ví dụ thực tế:** Đơn MISA-001 có dòng 1 đặt 40 viên gạch xám và dòng 2 đặt 20 viên gạch trắng. ExternalReferenceLine lưu riêng từng dòng nguồn để dòng gạch xám trong WMSD trỏ đúng 40 viên ở dòng 1. Nhờ vậy không lấy tổng 60 viên của cả đơn làm hạn mức cho riêng sản phẩm gạch xám.

Dòng SO có thể tham chiếu dòng này để tránh sao cùng nguồn hai lần. Nguồn lịch sử dùng cho CR phải được xác minh đúng ngữ cảnh; một con số eligibleQty không tự chứng minh khách đã nhận lượng đó.

<a id="ton-kho"></a>
## 4. Tồn kho, giữ hàng và phân bổ nguồn

### 20. StockAccount — nơi hạch toán tồn

**Collection:** `stock_accounts`. **Nguồn:** [inventory.model.js](src/models/inventory.model.js).

Một StockAccount chứa **đúng một** trong hai trường: `locationId` (tồn tại vị trí vật lý) hoặc `transitDispatchLineId` (tồn đang chuyển theo một dòng dispatch). Mỗi trường có partial unique index khi có ObjectId; các đường dẫn này immutable.

**Ví dụ thực tế:** Có 20 viên đang nằm ở ô A01 và 10 viên đã rời kho A nhưng còn trên đường tới kho B. Hệ thống cần phân biệt hai nơi hạch toán này: một nơi là vị trí vật lý, một nơi là hàng đang chuyển theo chuyến xuất cụ thể. StockAccount đại diện cho mỗi nơi đó, giúp 10 viên đang đi không đồng thời bị tính là đang nằm tại cả hai kho.

Tài khoản tồn tại A01 liên kết với vị trí A01. Tài khoản transit liên kết với dòng xuất điều chuyển cụ thể và không gắn một vị trí vật lý. “Đang chuyển” là cách xác định tài khoản, không phải qualityCode IN_TRANSIT.

### 21. StockBalance — số lượng hiện tại theo đúng chiều tồn

**Collection:** `stock_balances`. **Nguồn:** [inventory.model.js](src/models/inventory.model.js).

Khóa logic duy nhất là `(accountId, lotId, qualityCode, ownerPartyId)`. Bốn chiều này immutable; `qtyBase` không âm, mặc định 0; `version` mặc định 0. qualityCode là PENDING/GOOD/DAMAGED/BLOCKED.

**Ví dụ thực tế:** Tại ô A01 hiện có 100 viên còn tốt, thuộc lô gạch xám T01/C01 và thuộc sở hữu cửa hàng. StockBalance lưu đúng số dư cho tổ hợp này. Nếu cùng ô còn 5 viên hỏng của lô đó, 5 viên hỏng là một số dư khác. Nhờ vậy, hệ thống không báo chung 105 viên rồi coi cả 105 viên đều có thể giao cho khách.

Nghĩa là A01 đang giữ 100 viên GOOD thuộc cửa hàng của lô A. Nếu 2 viên cùng lô bị hỏng, ghi sang balance DAMAGED bằng thao tác hợp lệ; không sửa qualityCode của balance 100 viên. Product được xác định qua Lot, kho qua StockAccount → Location.

StockBalance là số dư hiện tại, không phải available trực tiếp. Để cấp hàng còn phải xét chủ STORE, GOOD, lô VERIFIED, dữ liệu active, STORAGE allocatable, khóa/hold và reservation.

### 22. PostingBatch — một lần ghi sổ tồn kho

**Collection:** `posting_batches`. **Nguồn:** [inventory.model.js](src/models/inventory.model.js). **Append-only.**

`documentId`, `operation`, `operationKey`, `idempotencyKey`, `payloadHash`, `postedBy` bắt buộc. `postedAt` mặc định hiện tại. idempotencyKey và bộ phiếu–operation–operationKey có index duy nhất. `reversalOf` tùy chọn, duy nhất khi có, không trỏ chính batch đó.

**Ví dụ thực tế:** Anh Nam xác nhận nhập một chuyến 12 viên. Điện thoại mất mạng ngay sau khi bấm xác nhận nên anh bấm lại. PostingBatch giúp nhận diện đây là cùng một lần ghi sổ nhập hàng, để lần thử lại có thể tìm kết quả cũ thay vì tăng tồn thêm 12 viên. Nó cũng gom các biến động của lần nhập này thành một lần thực hiện có thể truy vết.

Nút post nhập hàng được gửi lại vì timeout phải tra batch cũ theo key, so hash rồi trả kết quả đã có. Model định nghĩa chỗ lưu dấu; transaction/service mới thực hiện cơ chế chống post lặp và cập nhật tồn nguyên tử.

### 23. StockMovement — một biến động tồn có nguồn/đích

**Collection:** `stock_movements`. **Nguồn:** [inventory.model.js](src/models/inventory.model.js). **Append-only.**

`batchId`, `documentId`, `lineId`, `qtyBase` bắt buộc. Cần ít nhất một trong `fromBalanceId`, `toBalanceId`; nếu có cả hai phải khác nhau. Mỗi đầu có ID phải có đủ before/after và khớp chính xác số lượng.

**Ví dụ thực tế:** Trước khi cất hàng, khu nhận hàng có 12 viên và ô A01 có 100 viên. Anh Nam chuyển toàn bộ 12 viên sang A01; sau đó khu nhận còn 0 và A01 có 112 viên. StockMovement ghi lại việc chuyển 12 viên từ đâu tới đâu, số trước và sau ở mỗi đầu. Tổng vẫn là 112 viên: đây là đổi vị trí, không phải nhập thêm một lần nữa.

Chuyển 12 viên từ receiving sang A01: tổng vẫn 112. Một StockMovement có thể biểu diễn cả hai vế giảm/tăng; không bắt buộc tách thành hai bản ghi movement.

| Hai đầu | Cách hiểu |
|---|---|
| Chỉ `toBalanceId` | Nhập/tăng vào hệ thống, ví dụ GR-P hoặc OPENING; chỉ có toBefore/toAfter |
| Chỉ `fromBalanceId` | Xuất/giảm ra ngoài, ví dụ PGI/SCRAP; chỉ có fromBefore/fromAfter |
| Cả hai | Chuyển vị trí, chất lượng, chủ hàng hoặc transit theo command hợp lệ; tổng hai đầu bảo toàn |

Service phải kiểm movement đúng loại nghiệp vụ, không cho client tự chọn thay đổi owner/lô tùy ý. Lịch sử movement hỗ trợ đối chiếu số dư.

### 24. Reservation — giữ một phần hàng hiện có cho nhu cầu

**Collection:** `reservations`. **Nguồn:** [inventory.model.js](src/models/inventory.model.js).

`demandLineId` là dòng nhu cầu; `executionLineId` là dòng thực hiện; `balanceId` là hàng cụ thể được giữ; `qtyBase` dương. `status`: ACTIVE/CONSUMED/RELEASED.

**Ví dụ thực tế:** Kho A có 100 viên đạt điều kiện cấp hàng. Chị Lan đã cam kết dành 20 viên cho đơn của khách Minh, dù anh Nam chưa lấy chúng ra khỏi kệ. Reservation ghi nhận 20 viên cụ thể đang được giữ cho đơn đó. Kho vẫn có 100 viên thực tế, nhưng nếu không có hạn chế khác thì chỉ còn 80 viên tự do để hứa cho khách khác.

Balance đang có 100 viên, giữ 20 cho đơn này thì phần sẵn cấp cho nhu cầu khác còn 80 nếu mọi điều kiện khác đều đạt. Reservation không giảm qtyBase của balance. Khi picking chuyển hàng sang staging, service phải chuyển liên kết giữ hàng tương ứng, không tạo available mới từ hàng đã giữ.

### 25. DemandSupplyAllocation — gắn nhu cầu với một nguồn cung

**Collection:** `demand_supply_allocations`. **Nguồn:** [inventory.model.js](src/models/inventory.model.js).

`demandLineId`, `supplyLineId`, `qtyBase`, `status` bắt buộc; cặp demand–supply duy nhất. Status: PLANNED/FULFILLED/CANCELLED.

**Ví dụ thực tế:** Khách Minh còn cần 20 viên nhưng kho chưa có hàng phù hợp. Nhà cung cấp đã xác nhận một đơn mua sắp về, và cửa hàng dự kiến dùng 20 viên từ đơn mua đó để đáp ứng khách Minh. DemandSupplyAllocation lưu sự gắn kết giữa nhu cầu và nguồn cung này. Vì hàng chưa thực về nên 20 viên đó chưa thể đem xuất như tồn có sẵn.

20 viên của PO dự kiến dùng đáp ứng SO này. Khác Reservation: allocation có thể trỏ nguồn **chưa về**, nên chưa tạo hàng có thể xuất. Khi SO có WIR con, phải quy về cùng nghĩa vụ SO, không cộng cả allocation SO và WIR thành hai lần nhu cầu.

<a id="thao-tac"></a>
## 5. Thao tác nghiệp vụ và hủy phần đơn

### 26. BusinessOperation — dấu thực hiện thao tác không ghi sổ tồn

**Collection:** `business_operations`. **Nguồn:** [business-operation.model.js](src/models/business-operation.model.js). **Append-only.**

Lưu `documentId`, `operation`, `operationKey`, `idempotencyKey`, `payloadHash`, `documentVersion`, `performedBy`, `performedAt` và `reason` tùy chọn. Key/hash có ý nghĩa chống lặp tương tự PostingBatch, nhưng không phải một batch biến động tồn. idempotencyKey và bộ phiếu–operation–operationKey duy nhất.

**Ví dụ thực tế:** Khách Minh yêu cầu hủy 4 viên chưa thực hiện. Chị Lan xác nhận hủy nhưng màn hình bị chậm, khiến thao tác được gửi lại. BusinessOperation lưu dấu nhận diện của lần hủy để hệ thống biết yêu cầu đã xử lý và không hủy thêm 4 viên lần nữa. Đây là thao tác nghiệp vụ không trực tiếp ghi tăng/giảm tồn, nên cần phân biệt với lần ghi sổ tồn kho.

Ví dụ hủy phần chưa thực hiện, xác nhận POD hoặc xác nhận đủ tiền ngoài cần dấu thao tác nhưng không tạo PostingBatch chỉ để đánh dấu. Một command không post tồn vẫn có thể phải xử lý reservation theo quy tắc nghiệp vụ.

### 27. SalesOrderCancellation — lịch sử hủy lượng trên dòng đơn bán

**Collection:** `sales_order_cancellations`. **Nguồn:** [business-operation.model.js](src/models/business-operation.model.js). **Append-only.**

`salesOrderId`, `salesOrderLineId`, `cancelledQtyBase`, `cancelledBy`, `reason`, `operationId` bắt buộc; `cancelledAt` mặc định hiện tại. Lượng dương; operationId duy nhất trong collection này.

**Ví dụ thực tế:** Ban đầu khách Minh đặt 40 viên, sau đó chỉ hủy 4 viên chưa thực hiện. SalesOrderCancellation ghi riêng sự kiện hủy 4 viên, ai ghi nhận, thời điểm và lý do. Khi xem lại, cửa hàng vẫn biết khách từng đặt 40 rồi hủy 4, thay vì nhìn thấy một đơn 36 viên và mất dấu thay đổi ban đầu.

SO đặt 40 viên, hủy hợp lệ 4 thì nghĩa vụ còn 36. Không ghi đè lịch sử thành “đặt 36 từ đầu”. Lượng đã PGI đang ngoài kho chưa được giải quyết không tự được hủy; service phải kiểm nguồn và downstream.

<a id="kiem-ke"></a>
## 6. Kiểm kê và chặn hàng lỗi

### 28. LocationLock — khóa vị trí trong phiên kiểm kê

**Collection:** `location_locks`. **Nguồn:** [stocktake.model.js](src/models/stocktake.model.js).

`locationId` duy nhất; `stocktakeId` chỉ phiên; `lockedAt` mặc định hiện tại. Bản ghi đang tồn tại biểu diễn khóa hiện hành; schema không có trường status hay lịch sử unlock riêng.

**Ví dụ thực tế:** Sáng kiểm kê, anh Nam bắt đầu đếm hàng tại ô A01. Trong lúc đếm, nhân viên khác không được vừa lấy hàng ra hoặc đưa hàng vào ô này theo giao dịch thông thường. LocationLock ghi nhận A01 đang được khóa bởi phiên kiểm kê nào. Nhờ đó, kết quả đếm có một phạm vi ổn định để đối chiếu với sổ.

A01 thuộc phạm vi đang freeze. Mọi command ảnh hưởng tồn ở đó phải kiểm cùng cơ chế khóa; index một mình không tự chặn StockMovement được ghi ở collection khác. Giải phóng khóa chỉ khi chốt kiểm kê hợp lệ.

### 29. StocktakeSnapshot — tồn sổ sách tại thời điểm chốt mốc

**Collection:** `stocktake_snapshots`. **Nguồn:** [stocktake.model.js](src/models/stocktake.model.js). **Append-only.**

`stocktakeId`, `balanceId`, `bookQty` bắt buộc; `foundAfterCutoff` mặc định false. Mỗi balance chỉ có một snapshot trong một phiên.

**Ví dụ thực tế:** Lúc bắt đầu kiểm kê, sổ đang ghi 50 viên tại A01. StocktakeSnapshot giữ con số 50 tại thời điểm đó làm mốc đối chiếu. Dù sau khi kết thúc kiểm kê cửa hàng nhập thêm hàng và số dư thay đổi, lần kiểm kê cũ vẫn phải so với mốc 50, không lấy số tồn mới thay vào.

Sổ ghi 50 tại cutoff. Khi tồn hiện tại thay đổi sau này, không thay bookQty bằng tồn mới. Hàng tìm thấy sau cutoff trong phạm vi có thể thêm dòng foundAfterCutoff=true/bookQty=0 theo quy trình, không sửa snapshot cũ.

### 30. CountAttempt — một lần đếm thực tế

**Collection:** `count_attempts`. **Nguồn:** [stocktake.model.js](src/models/stocktake.model.js). **Append-only.**

`snapshotId`, `attemptNo`, `countedQty`, `countedBy`, `countedAt` bắt buộc. `(snapshotId, attemptNo)` duy nhất; attemptNo từ 1. countedQty không có giá trị mặc định.

**Ví dụ thực tế:** Lần đầu đếm A01, anh Nam ghi nhận 48 viên. Vì cần kiểm tra lại, anh Bình đếm lần hai và ghi nhận 49 viên. CountAttempt lưu cả hai lần, người đếm và thời điểm riêng để có căn cứ chọn kết quả và giải trình. Không ghi đè 48 thành 49; nếu chưa ai đếm thì cũng không được hiểu ô trống là đã đếm được 0 viên.

Đếm lần đầu được 48 so với book 50. Nếu đếm lại thì thêm attemptNo=2, không sửa lần 1. Chưa có CountAttempt là chưa đếm; một CountAttempt countedQty="0" mới là đã đếm và xác nhận không có hàng. Model này không có trường chất lượng/vị trí riêng; các chiều đó đi theo snapshot/balance, kế hoạch xử lý và bằng chứng.

### 31. DefectHold — chặn cấp hàng đang có nghi vấn lỗi

**Collection:** `defect_holds`. **Nguồn:** [stocktake.model.js](src/models/stocktake.model.js).

`defectDocumentId`, `balanceId`, `qtyBase`, `evidenceId`, `recordedBy`, `recordedAt` là sự kiện nguồn immutable; `stocktakeId` tùy chọn cũng immutable. `status` có thể ACTIVE/RESOLVED.

**Ví dụ thực tế:** Trong khi kiểm 50 viên ở A01, anh Nam phát hiện 2 viên có dấu hiệu nứt và chụp ảnh. Anh lập chặn hàng để nhân viên khác không tiếp tục phân bổ số dư đang có nghi vấn. DefectHold ghi nhận phần nghi lỗi và căn cứ kiểm tra, nhưng chưa làm tồn giảm 2 viên hoặc tự đổi chất lượng. Theo cách chặn hiện hành, cả số dư liên quan bị loại khỏi hàng cấp mới cho tới khi xử lý hợp lệ.

Phát hiện 2 viên nghi hỏng và lập hold chưa làm balance giảm 2 hoặc chuyển GOOD thành DAMAGED. Theo quy tắc availability hiện hành, **chỉ cần có ACTIVE hold thì chặn cả balance đó**, dù hold ghi 2/50 viên. Không tự tính 50 − 2 thành 48 available. Trong freeze có thể ghi hold/evidence, nhưng thay quality/location phải theo batch chốt kiểm kê.

<a id="tra-hang"></a>
## 7. Trả hàng và giao thất bại

### 32. CustomerReturnAssessment — đánh giá điều kiện trả hàng của khách

**Collection:** `customer_return_assessments`. **Nguồn:** [return.model.js](src/models/return.model.js). **Append-only.**

| Nhóm trường | Giải thích |
|---|---|
| `returnLineId`, `assessmentNo`, `documentVersion` | Dòng CR, lần đánh giá và version đang xét; dòng–assessmentNo duy nhất |
| `packagingCondition` | SEALED/OPENED/TORN/UNKNOWN; mô tả bao bì |
| `installationStatus` | UNUSED/INSTALLED/UNKNOWN |
| `damageCause` | NONE/CUSTOMER/SUPPLIER/OTHER/UNKNOWN |
| `deadlineStatus`, `deadlineReference` | WITHIN/EXCEEDED/NOT_APPLICABLE/UNKNOWN; trạng thái đã biết phải có căn cứ |
| `eligibilityStatus` | PENDING/CASE_REVIEW/INELIGIBLE; phải khớp điều kiện đã ghi |
| `assessmentReason`, `assessedBy`, `assessedAt`, `approvalId` | Giải thích, người/thời điểm đánh giá; approvalId tùy chọn |

**Ví dụ thực tế:** Khách Minh mang 2 viên về trả. Thùng đã mở nhưng gạch chưa sử dụng, không có lỗi do khách và điều kiện thời hạn đã được xác minh. Anh Nam ghi kết quả kiểm tra để Sales xem xét chấp nhận. CustomerReturnAssessment lưu những căn cứ này và kết luận đủ thông tin để xét; nó chưa phải quyết định nhận trả. Nếu phát hiện gạch đã thi công thì phải ghi nhận không đủ điều kiện theo quy tắc.

CASE_REVIEW chỉ là đủ điều kiện để xét, **chưa phải đã chấp nhận nhập trả**. Đã thi công, lỗi do khách hoặc quá hạn xác minh → INELIGIBLE. Còn thông tin UNKNOWN và không thuộc điều cấm → PENDING. Không tự áp thời hạn 7/15/30 ngày. Assessment này phục vụ CR; FD chưa khách nhận không đi qua quy trình này.

### 33. ReturnSourceClaim — giữ hạn mức trên nguồn xuất/nhận cũ

**Collection:** `return_source_claims`. **Nguồn:** [return.model.js](src/models/return.model.js).

`requestLineId`, `claimKind` (CR/FD), `qtyBase`, `operationId` bắt buộc và immutable. Phải chọn đúng một trong `salesIssueLineId`, `historicalExternalLineId`; FD bắt buộc dùng salesIssueLineId. `status`: OPEN/CONSUMED/RELEASED. Cặp requestLineId–operationId duy nhất.

**Ví dụ thực tế:** Một lần giao đã xuất 10 viên, khách thực nhận 7; còn 3 viên giao thất bại cần nhận về. Khi anh Nam mở hồ sơ cho 3 viên đó, ReturnSourceClaim giữ hạn mức 3 viên trên lần xuất gốc. Một người khác không thể đồng thời coi cùng 3 viên ấy là phần còn trống để lập thêm hồ sơ nhận về. Đây là giữ hạn mức của nguồn cũ, không phải giữ 3 viên đang nằm trong kho.

Đã xuất 10, POD 7 thì chỉ còn tối đa 3 cho FD; claim giữ 3 để command khác không dùng trùng hạn mức nguồn. Claim giữ **quyền nhận lại từ nguồn**, không giữ hàng trong kho như Reservation. Chỉ post receipt thật mới tăng tồn và consume claim; không cộng cả claim CONSUMED và receipt thành hai lần đã trả.

### 34. DemandReopening — lượng nhu cầu gốc được mở lại sau GR-FD

**Collection:** `demand_reopenings`. **Nguồn:** [return.model.js](src/models/return.model.js). **Append-only.**

`receiptLineId` duy nhất, trỏ dòng nhập FD. Lưu `salesOrderLineId`, `issueRequestLineId`, `outboundDeliveryLineId`, `reopenedQty` dương, `sourceVersion`, `postingBatchId`.

**Ví dụ thực tế:** Cửa hàng xuất 10 viên cho khách Minh, khách nhận 7, còn 3 viên giao thất bại đã thực quay về kho và được ghi nhập hợp lệ. Khách vẫn muốn nhận đủ 10 viên nên còn nghĩa vụ giao lại 3. DemandReopening ghi nhận 3 viên nhu cầu được mở lại trên đơn và yêu cầu xuất gốc, để tổ chức giao lại mà không phải tạo một đơn bán mới.

3 viên giao thất bại thực quay về làm nghĩa vụ giao còn thiếu 3 trên **cùng SO/WIR/OD gốc**. Receipt + consume claim + reopening + cập nhật tiến độ/version phải cùng transaction. CR thông thường không tự sinh DemandReopening.

### 35. OdCommitmentTransfer — chuyển cam kết giao lại giữa hai dòng OD

**Collection:** `od_commitment_transfers`. **Nguồn:** [return.model.js](src/models/return.model.js). **Append-only.**

`reopeningReceiptLineId`, `fromOdLineId`, `toOdLineId`, `qtyBase`, `sourceVersion`, `targetVersion`, `operationId` bắt buộc. Hai OD line khác nhau; bộ operation–nguồn–đích duy nhất.

**Ví dụ thực tế:** Sau khi 3 viên giao thất bại được nhận về, chị Lan muốn giao lại bằng phiếu giao OD-002 thay cho OD-001. OdCommitmentTransfer ghi nhận việc chuyển đúng phần cam kết giao 3 viên còn thiếu sang dòng phiếu mới. Khách vẫn chỉ đặt tổng 10 viên; thêm phiếu giao không được làm nhu cầu biến thành 13 viên.

Nếu giao lại bằng OD mới thì chuyển 3 viên cam kết cũ sang OD mới; không biến thành thêm 3 viên nhu cầu SO. Điểm dễ nhầm: reopeningReceiptLineId trỏ **DocumentLine._id** của receipt và join với `DemandReopening.receiptLineId`, không trỏ `DemandReopening._id`.

<a id="su-kien"></a>
## 8. Nhật ký, sự kiện và thông báo

### 36. AuditEvent — nhật ký ai đã làm gì

**Collection:** `audit_events`. **Nguồn:** [event.model.js](src/models/event.model.js). **Append-only.**

`actorId`, `action`, `details` bắt buộc; `eventAt` mặc định hiện tại; `documentId` tùy chọn. `details` hiện là **chuỗi**, không phải object JSON tự do.

**Ví dụ thực tế:** Chị Lan lưu nháp đề nghị bổ sung lúc 9 giờ; sau đó cô Mai duyệt phiếu lúc 10 giờ. AuditEvent ghi lại từng hành động, người thực hiện, thời điểm và diễn giải. Khi có thắc mắc “ai đã duyệt phiếu này?”, cửa hàng tra nhật ký hành động. Muốn biết tồn tăng/giảm bao nhiêu thì phải xem biến động tồn, không chỉ dựa vào nhật ký này.

AuditEvent giải thích hành vi của user. StockMovement giải thích biến động số tồn; BusinessOperation/PostingBatch nhận dạng lần thực hiện. Ba loại dấu vết này có vai trò khác nhau.

### 37. OutboxEvent — việc cần xử lý sau khi transaction nguồn commit

**Collection:** `outbox_events`. **Nguồn:** [event.model.js](src/models/event.model.js).

`documentId`, `eventType`, `eventKey` bắt buộc; eventKey duy nhất. `documentVersion` bắt buộc cho STOCKTAKE_CLOSED/SALES_ORDER_SAVED. `attempts` mặc định 0; `deliveredAt` tùy chọn đánh dấu xử lý/giao sự kiện. Mô hình cho phép cập nhật trạng thái retry.

**Ví dụ thực tế:** Phiên kiểm kê đã chốt thành công nhưng lúc đó phần xử lý thông báo tạm thời bị lỗi. OutboxEvent giữ lại việc “phiên kiểm kê đã đóng, cần xử lý sau” để bộ phận xử lý nền có thể thử lại. Vì việc chốt đã hoàn tất, thử lại thông báo không được thực hiện lại các điều chỉnh tồn. Có model này chưa có nghĩa chương trình xử lý nền đã được triển khai đầy đủ.

Ý nghĩa: sau khi lưu SO version 2 thành công, consumer đánh giá thiếu hàng/thông báo. Sự kiện cần ghi cùng transaction nguồn, xử lý sau commit. Outbox không tự chạy worker; retry thông báo không được post tồn hoặc tạo RR lần nữa.

### 38. Notification — thông báo riêng cho từng người nhận

**Collection:** `notifications`. **Nguồn:** [notification.model.js](src/models/notification.model.js).

| Trường | Giải thích |
|---|---|
| `recipientId` | User nhận; mỗi recipient có lịch sử đọc riêng |
| `type` | LOW_STOCK_AFTER_STOCKTAKE hoặc SALES_SHORTAGE |
| `title`, `message` | Nội dung lịch sử lúc đánh giá |
| `warehouseId` | Bắt buộc với thông báo sau kiểm kê; tùy chọn với SALES_SHORTAGE |
| `sourceDocumentId`, `sourceDocumentVersion` | Nguồn và phiên bản gây thông báo |
| `eventKey`, `evaluatedAt` | Sự kiện và thời điểm đánh giá |
| `readAt` | Null khi chưa đọc; có thể cập nhật |
| `dedupKey` | Tự ghép từ eventKey + type + recipientId + warehouseId hoặc `-`; duy nhất |

**Ví dụ thực tế:** Sau kiểm kê, kho A có một sản phẩm dưới ngưỡng nên anh Nam và anh Bình đều nhận thông báo. Nam mở đọc trước, Bình chưa mở. Notification lưu riêng thông báo của từng người, nên việc Nam đọc không làm mất trạng thái chưa đọc của Bình. Khi mở nguồn, hệ thống còn phải kiểm tra tình hình mới nhất; thông báo đã đọc không có nghĩa hàng thiếu đã được mua đủ.

Các sự kiện nguồn/nội dung/recipient là immutable; readAt là trạng thái đọc riêng. User A đọc không làm thông báo user B thành đã đọc. Đã đọc không có nghĩa thiếu hàng đã giải quyết; mở nguồn hoặc tạo RR cần tính lại coverage và quyền hiện tại. Model không có trường lượng cảnh báo sống hay vòng đời snooze/dismiss.

### 39. ReplenishmentPlanningGuard — điểm phối hợp khi tính/lưu nguồn bổ sung

**Collection:** `replenishment_planning_guards`. **Nguồn:** [replenishment.model.js](src/models/replenishment.model.js).

`warehouseId`, `productId` tạo cặp duy nhất; `version` từ 0, mặc định 0. Không lưu số tồn hoặc lượng đề nghị.

**Ví dụ thực tế:** Chị Lan và anh Nam cùng thấy kho A thiếu 20 viên và gần như đồng thời gửi đề nghị bổ sung. Nếu cả hai đều dựa vào số cũ, cửa hàng có thể đề nghị mua trùng thành 40 viên. ReplenishmentPlanningGuard là điểm kiểm tra chung theo sản phẩm và kho để các thao tác phát hiện đã có người khác thay đổi kế hoạch, rồi tính lại trước khi lưu. Cơ chế này chỉ hoạt động khi các thao tác cùng tuân theo quy trình kiểm soát cập nhật.

Hai người cùng thấy thiếu 20 rồi cùng tạo RR20 có nguy cơ mua trùng. Guard là nơi các command liên quan cùng conditional-write trong transaction để phát hiện xung đột và tính lại. Có bản ghi guard không tự ngăn race nếu các command không cùng tham gia protocol.

<a id="loai-chung-tu"></a>
## 9. Tra cứu đủ 35 loại chứng từ

Tất cả dưới đây dùng **BusinessDocument / `business_documents`**. Cột header là các trường của schema con; trường tùy chọn đánh dấu `?`. Các trường chung như documentNo/createdBy nằm ngoài header. Cột tồn mô tả **hiệu ứng nghiệp vụ khi command hợp lệ thực hiện**, không phải side effect tự động khi `save()` một model.

| # | `documentKind` | Ý nghĩa và ví dụ | Header riêng | Hiệu ứng tồn |
|---|---|---|---|---|
| 1 | REPLENISHMENT | RR: đề nghị mua thêm 12 viên | warehouseId, neededOn, triggerReason, creationKey; submittedBy?/submittedAt? đi cùng nhau | Không |
| 2 | PO | Đơn mua gửi NCC từ RR đã duyệt | warehouseId, supplierId, expectedOn?, supplierConfirmation? | Không |
| 3 | ARRIVAL | Ghi chuyến xe thực đến, kể cả có lượng chờ kiểm | warehouseId, supplierId?, arrivedAt, deliveryReference? | Chưa tăng sở hữu chỉ vì ghi arrival |
| 4 | INSPECTION | Phiếu kiểm nhận, ví dụ tách 10 GOOD và 2 DAMAGED | Không định nghĩa header riêng | Kiểm không tự post |
| 5 | GR_PURCHASE | GR-P: nhập phần mua được nhận | warehouseId, receiptKind=PURCHASE | Tăng phần thực nhận sở hữu khi post |
| 6 | TO | Nhiệm vụ PUTAWAY/PICK/RELOCATE/QUARANTINE/UNPICK | warehouseId, taskKind, assignedTo | Xác nhận chuyển nguồn→đích; tổng bảo toàn |
| 7 | TRANSFER_REQUEST | TR: đề nghị chuyển từ kho A sang B | sourceWarehouseId, destinationWarehouseId, neededOn?; hai kho khác nhau | Chưa chuyển tồn; giữ hàng theo command hợp lệ |
| 8 | TRANSFER_DISPATCH | TD: xuất thực tế đi kho B | requestId, dispatchedBy, dispatchedAt | Kho đi giảm, transit tăng khi bàn giao |
| 9 | MWTR | Phiếu nhận điều chuyển tại kho đích | dispatchId, receivedBy, receivedAt | Transit giảm, kho đích tăng |
| 10 | HANDOVER | Xác nhận bàn giao, người nhận/đơn vị vận chuyển | relatedDocumentId, recipientName, carrierId?, handedOverAt, confirmedBy | Gắn mốc bàn giao; không post thêm lần hai cùng lượng |
| 11 | SALES_ORDER | SO: bản sao đơn nguồn ngoài | externalReferenceId, customerId, neededOn, deliveryAddressSnapshot | Không |
| 12 | ISSUE_REQUEST | WIR: đợt yêu cầu xuất gắn SO | salesOrderId, requestedWarehouseId, neededOn, deliveryAddressSnapshot | Không tự post |
| 13 | OUTBOUND_DELIVERY | OD: kế hoạch giao từ một kho cho WIR | warehouseId, issueRequestId, plannedOn | Không giảm tổng; có thể giữ hàng |
| 14 | GI_SALE | GI-S: xuất bán thực bàn giao | warehouseId, issueKind=SALE | PGI giảm thực xuất một lần |
| 15 | DELIVERY_CONFIRMATION | POD: khách thực nhận có ảnh | salesOrderId, warehouseId, recipientName, deliveredAt, confirmedBy, confirmedAt, operationId | Không |
| 16 | PAYMENT_CONFIRMATION | PAY-CFM: Sales xác nhận đủ tiền bên ngoài sau giao đủ | salesOrderId, deliveredOrderVersion, fullPaymentReceived=true, confirmedBy, confirmedAt, operationId; externalReceiptReference?/receiptEvidenceId?/confirmationNote? cần ít nhất một | Không |
| 17 | DEFECT_CASE | Hồ sơ phát hiện hàng lỗi tại chỗ | discoveredAt, reason | Hold/evidence không tự giảm tồn |
| 18 | DISPOSITION | Phương án giải phóng/đổi phẩm cấp/hủy/trả NCC | Không định nghĩa header riêng | Phương án chưa post |
| 19 | SCRAP | Hủy hàng thực tế theo quyết định hợp lệ | Không định nghĩa header riêng | Giảm thực hủy |
| 20 | STOCKTAKE | Phiên kiểm kê theo kho/vị trí | warehouseId, cutoffAt?, completedAt?, mode=FROZEN, scopeLocationIds | Tạo plan chưa đổi tồn; activation snapshot/freeze |
| 21 | ADJUSTMENT | Điều chỉnh tăng/giảm khác 0 từ kết quả kiểm kê | Không định nghĩa header riêng | Post delta có dấu được duyệt |
| 22 | FAILED_DELIVERY | FD: giao thất bại, chưa khách nhận | warehouseId, failureEvidenceId, reason | Ghi nhận ca chưa tăng tồn |
| 23 | GR_FAILED_DELIVERY | GR-FD: nhập lượng FD thực quay về | warehouseId, receiptKind=FAILED_DELIVERY | Tăng thực về + mở lại nghĩa vụ ròng cùng commit |
| 24 | ST_RESOLUTION | Kế hoạch xử lý chênh kiểm kê | stocktakeId, planVersion, approvalId?, closureBatchId? | Chỉ chốt batch hợp lệ mới post |
| 25 | RECLASS | Đổi phân loại chất lượng có kiểm soát | Không định nghĩa header riêng | Balance cũ giảm/balance mới tăng; tổng giữ nguyên |
| 26 | CUSTOMER_RETURN | CR: khách đã nhận rồi trả | warehouseId, customerId, financialFollowupStatus mặc định NOT_RECORDED | Đề nghị chưa tăng sở hữu |
| 27 | GR_CUSTOMER_RETURN | GR-CR: nhận phần trả được chấp nhận | warehouseId, receiptKind=CUSTOMER_RETURN | Nhận/chuyển đúng custody vào sở hữu, không đếm arrival hai lần |
| 28 | SUPPLIER_RETURN | SR: đề nghị trả NCC theo agreement | warehouseId, supplierId, agreementReference?, agreedAt?, financialFollowupStatus mặc định NOT_RECORDED | Chưa thực xuất |
| 29 | GI_SUPPLIER_RETURN | GI-SR: thực trả NCC | warehouseId, issueKind=SUPPLIER_RETURN | Giảm phần sở hữu thực xuất |
| 30 | SUPPLIER_ACK | NCC xác nhận thực nhận/kết quả | Không định nghĩa header riêng | Không trừ thêm lần nữa |
| 31 | DISCREPANCY | Hồ sơ thiếu/thừa/hỏng/sai lô/sai sản phẩm | Không định nghĩa header riêng | Ghi sai lệch chưa tự điều chỉnh tồn |
| 32 | CUSTODY_RECEIPT | Nhận giữ hộ hàng khách/NCC | Không định nghĩa header riêng | Tăng hàng giữ hộ đúng owner, không tăng tồn STORE |
| 33 | CUSTODY_RELEASE | Trả/bàn giao hàng giữ hộ | Không định nghĩa header riêng | Giảm custody, không giảm owned STORE |
| 34 | REVERSAL | Đảo nghiệp vụ có liên kết lịch sử | Không định nghĩa header riêng | Batch đảo hiệu ứng theo kiểm tra downstream |
| 35 | OPENING | Ghi nhận tồn đầu kỳ | Không định nghĩa header riêng | Tăng tồn đầu kỳ có ledger, không sửa balance trần |

“Không định nghĩa header riêng” nghĩa subtype chỉ kế thừa các trường chung; không có collection header phụ để tự bổ sung trường. Quan hệ nguồn có thể nằm ở typed line, DocumentLink hoặc LineLink; service phải kiểm đúng chuỗi.

**Trạng thái có enum kiểm trực tiếp:**

- SALES_ORDER: DRAFT, OPEN, IN_PROGRESS, PARTIALLY_DELIVERED, DELIVERED, COMPLETED, CANCELLED.
- DELIVERY_CONFIRMATION/PAYMENT_CONFIRMATION: DRAFT, CONFIRMED, VOIDED.
- Các loại khác đang dùng workflowStatus dạng chuỗi. Điều đó không cho phép chuyển trạng thái tùy ý; các bước SUBMITTED/APPROVED/POSTED... cần service nghiệp vụ kiểm soát.

POD/PAY-CFM có confirmedAt mặc định hiện tại. Các receiptKind/issueKind có default cố định theo subtype. `financialFollowupStatus` là theo dõi tham chiếu ngoài, không triển khai công nợ/hoàn tiền trong WMSD.

<a id="loai-dong"></a>
## 10. Tra cứu đủ 19 loại dòng chứng từ

Tất cả dùng **DocumentLine / `document_lines`** và có các trường chung ở model 13. Những trường dưới đây nằm trong `details`; trường tùy chọn đánh dấu `?`. Đây là mapping cách dùng theo mô hình nghiệp vụ; schema reference không tự xác minh phiếu cha đúng loại hoặc dòng nguồn đúng chuỗi.

| # | `lineKind` | Dùng để làm gì | Các trường details |
|---|---|---|---|
| 1 | STANDARD | Dòng chung cho loại chưa cần schema details riêng, ví dụ dòng PO | Không định nghĩa details riêng |
| 2 | REPLENISHMENT | Lý do/nguồn và snapshot đề nghị bổ sung | triggerType, reasonNote và nhóm trường nguồn/đánh giá ở bảng dưới |
| 3 | SALES_ORDER | Dòng SO có dòng nguồn ngoài và yêu cầu tương thích | externalReferenceId, externalLineId, requiredTone?, requiredCalibre? |
| 4 | OUTBOUND_DELIVERY | Dòng OD từ một dòng WIR | issueRequestLineId |
| 5 | SALES_GOODS_ISSUE | Dòng GI_SALE từ một dòng OD | outboundDeliveryLineId |
| 6 | DELIVERY_CONFIRMATION | Lượng khách thực nhận trên dòng GI, có ảnh | salesIssueLineId, photoEvidenceId |
| 7 | FAILED_DELIVERY | Lượng FD theo dòng GI chưa POD | salesIssueLineId |
| 8 | FAILED_DELIVERY_RECEIPT | Dòng nhập GR-FD sau kiểm thực tế | failedDeliveryLineId, salesIssueLineId, inspectionLineId, claimId? |
| 9 | ST_RESOLUTION | Một hành động xử lý chênh kiểm kê | countId, holdId?, actionKind, fromBalanceId?, toBalanceId?, deltaQty?, executedBy?, executedAt?, executionEvidenceId? |
| 10 | INSPECTION | Kiểm nguồn, chất lượng, quyết định sở hữu và bao bì | inspectedSourceLineId, qualityCode, ownershipDecision=ACCEPT/CUSTODY/REJECT, inspectedBy, inspectedAt, packagingCondition mặc định UNKNOWN |
| 11 | TRANSFER_RECEIPT | Nhận một phần của dòng dispatch | dispatchLineId, qualityCode |
| 12 | ISSUE_REQUEST | Release nhu cầu từ SO | salesOrderLineId, releaseKey, requiredTone?, requiredCalibre?, substitutionApprovalReference? |
| 13 | WAREHOUSE_TASK | Chuyển giữa hai vị trí theo TO | fromLocationId, toLocationId, qualityCode; hai vị trí khác nhau |
| 14 | DISPOSITION | Cách xử lý dòng lỗi | defectLineId, outcome=RELEASE/REGRADE/SCRAP/RETURN_SUPPLIER, approvalId? |
| 15 | CUSTOMER_RETURN | Nguồn CR và lý do | originalIssueLineId? XOR historicalExternalLineId?, reason |
| 16 | SUPPLIER_RETURN | Nguồn và thỏa thuận trả NCC đã xác minh | originLineId, ownerPartyId, agreedQty, agreementVersion, agreementVerifiedBy, agreementVerifiedAt, agreementEvidenceId |
| 17 | SUPPLIER_ACK | Kết quả NCC nhận trên dòng dispatch | dispatchLineId, outcome=ACCEPTED/REJECTED/DAMAGED, acknowledgedAt |
| 18 | DISCREPANCY | Sai lệch và cách giải quyết | sourceLineId, discrepancyKind=SHORT/OVER/DAMAGED/WRONG_LOT/WRONG_PRODUCT, resolutionStatus mặc định OPEN, resolutionDocumentId? |
| 19 | ADJUSTMENT | Điều chỉnh tổng tăng/giảm khác 0 | countId, approvalId?, deltaQty có dấu và khác 0; qtyBase=abs(deltaQty) |

XOR nghĩa **chọn đúng một**, không được bỏ cả hai hoặc gửi cả hai. Chú ý tên: documentKind `GI_SALE` đi với lineKind `SALES_GOODS_ISSUE`; documentKind `MWTR` dùng lineKind `TRANSFER_RECEIPT`; documentKind `TO` dùng lineKind `WAREHOUSE_TASK`.

### 10.1 Chi tiết nguồn dòng REPLENISHMENT

| Trigger | Trường phải có theo schema | Ví dụ dễ hiểu |
|---|---|---|
| SALES_SHORTAGE | sourceSalesOrderLineId/sourceSalesOrderVersion; remainingDemandQtySnapshot, reservedForDemandQtySnapshot, onHandCoverageQtySnapshot, otherWarehouseCoverageQtySnapshot; bộ đánh giá chung | SO còn cần 40, các nguồn phù hợp đã bao phủ 28, phần thiếu 12 được đề nghị |
| STOCKTAKE_LOW_STOCK | sourceStocktakeId/sourceStocktakeVersion, policyId/policyVersion, minimumQtySnapshot/targetQtySnapshot; bộ đánh giá chung | Sau chốt kiểm kê available18, min50, target50, incoming10, pending0 → gợi ý22 |
| MANUAL_OTHER | reasonNote bắt buộc; không được gắn trường nguồn SO/WIR/stocktake/policy | Chủ động đề nghị dự trữ 12 viên từ menu, không cần giả đơn thiếu |

**Bộ đánh giá chung** bắt buộc với hai trigger có nguồn: evaluationKey, evaluatedAt, availableQtySnapshot, incomingCoverageQtySnapshot, pendingRequestCoverageQtySnapshot, suggestedQty. SALES_SHORTAGE có thể kèm sourceIssueRequestLineId/sourceIssueRequestVersion nhưng phải đủ cặp; không cần WIR mới tạo được RR từ SO. STOCKTAKE_LOW_STOCK không nhận nhóm nguồn SO/WIR; target snapshot không thấp hơn minimum snapshot.

Các trường snapshot mô tả **lúc đánh giá**, không thay số tồn hiện tại. Ý nghĩa các lượng quan trọng:

| Trường | Cách hiểu |
|---|---|
| remainingDemandQtySnapshot | Nhu cầu bán còn phải đáp ứng |
| reservedForDemandQtySnapshot | Hàng cụ thể đã giữ cho nhu cầu đó |
| availableQtySnapshot | Hàng tự do khả dụng tại kho khi đánh giá |
| onHandCoverageQtySnapshot | Phần hàng đang có được xác định dùng bao phủ nhu cầu |
| otherWarehouseCoverageQtySnapshot | Phần coverage từ phương án kho khác theo đánh giá |
| incomingCoverageQtySnapshot | Phần nguồn về phù hợp đã tính vào coverage |
| pendingRequestCoverageQtySnapshot | Phần đề nghị đang có được tính để tránh đề nghị trùng |
| minimumQtySnapshot / targetQtySnapshot | Ngưỡng/mục tiêu theo policy lúc đánh giá |
| suggestedQty | Lượng gợi ý, không mặc nhiên bằng lượng user thực đề nghị |
| quantityAdjustmentReason | Giải thích khi qtyBase khác suggestedQty |

Không cộng cơ học mọi snapshot: một số lượng có thể cùng mô tả các khía cạnh của một nguồn đã giữ, không phải các khoản độc lập. Service phải định nghĩa coverage, kiểm trùng SO/WIR và xét thời điểm/tương thích. Schema hiện kiểm trường bắt buộc, quy đổi, lượng vượt suggested trong SALES_SHORTAGE và lý do đổi lượng; không tự tính toàn bộ coverage.

### 10.2 Chi tiết dòng ST_RESOLUTION

| actionKind | Điều kiện cục bộ | Ví dụ |
|---|---|---|
| DELTA | deltaQty khác 0; dương chỉ có toBalanceId, âm chỉ có fromBalanceId; qtyBase bằng trị tuyệt đối delta | Sổ có 50 viên, thực tế chỉ có 48: ghi giảm 2 viên |
| RECLASS | Có cả from/toBalanceId khác nhau; không có deltaQty | GOOD giảm 2, DAMAGED tăng 2; tổng không đổi |
| RELOCATE | Có cả from/toBalanceId khác nhau; không có deltaQty | Điều chỉnh vị trí, tổng không đổi |

executedBy/executedAt/executionEvidenceId phải có đủ ba hoặc cùng vắng. Dòng phương án mới không tự post; cần đúng count/plan/version/approval/execution trước khi Owner chốt.

### 10.3 Các index chống lặp nguồn đáng chú ý

- Một externalReferenceId chỉ có một SALES_ORDER; một externalLineId chỉ được sao thành một dòng SALES_ORDER.
- Dòng ISSUE_REQUEST duy nhất theo `(details.salesOrderLineId, details.releaseKey)`, kể cả ở hai WIR khác nhau.
- Trong một POD, mỗi salesIssueLineId chỉ có một dòng DELIVERY_CONFIRMATION; nhiều POD có thể nhận các phần hợp lệ khác nhau của cùng GI nếu tổng không vượt trần.
- PAY-CFM duy nhất theo `(header.salesOrderId, header.deliveredOrderVersion)`; confirmation còn có index duy nhất theo documentKind + operationId.
- VOIDED giữ lịch sử và uniqueness; xác nhận lại phải dùng version/operation mới đúng quy trình.

Các index không tự kiểm tổng số lượng đã thực hiện hay quyền user. Chỉ có hiệu lực chống trùng ở database khi index đã được triển khai thành công.

<a id="vi-du-luong"></a>
## 11. Ví dụ xuyên suốt các luồng

Các bước dưới đây giải thích vai trò dữ liệu và quy tắc cần thực thi. Chúng không khẳng định toàn bộ API/worker tương ứng đã tồn tại. Các số lượng đều là viên, trừ khi nói rõ.

### 11.1 Mua và nhập 12 viên

1. Sales/Warehouse lập BusinessDocument REPLENISHMENT và DocumentLine REPLENISHMENT: 3 BOX × 4 = 12 PIECE. Có lý do/nguồn thật; chưa thay tồn.
2. Owner khác người đề nghị lưu Approval đúng documentVersion và approvedQty=12.
3. Accountant lập PO; DocumentLink/LineLink nối RR→PO. Vẫn chưa có tồn tăng.
4. Warehouse ghi ARRIVAL/INSPECTION khi hàng tới, xác định 12 GOOD được nhận sở hữu. Bao bì OPENED/TORN không tự kết luận gạch DAMAGED.
5. Post GR_PURCHASE: PostingBatch + StockMovement chỉ có đầu đích + tăng StockBalance receiving của STORE cùng transaction.
6. Xác nhận TO PUTAWAY: StockMovement receiving −12 / storage +12, tổng tồn không tăng thêm. Hàng đạt các điều kiện availability mới được cấp cho nhu cầu mới.

| Mốc | Receiving | Storage | Tổng sở hữu |
|---|---:|---:|---:|
| Chưa nhập | 0 | 0 | 0 |
| Post GR-P | 12 | 0 | 12 |
| Put-away xong | 0 | 12 | 12 |

Nếu arrival 12 nhưng chỉ nhận sở hữu 10, còn 2 giữ hộ NCC, phải tách owner/custody; không báo owned STORE=12.

### 11.2 Bán 10 viên, giao thất bại 3 rồi giao lại

> Sao đơn nguồn ngoài → yêu cầu xuất → kế hoạch giao → soạn hàng → xuất 10 viên → khách nhận 7, giao thất bại 3 → nhận lại 3 vào kho và mở lại phần cần giao → giao lại 3 → xác nhận khách nhận đủ → Sales xác nhận đủ tiền bên ngoài.

| Sự kiện | Tác động dữ liệu | Ý nghĩa lượng |
|---|---|---|
| PGI lần đầu 10 | Batch/movement xuất và consume reservation tương ứng | Gross PGI=10; khách chưa mặc nhiên nhận |
| POD 7 | Confirmation + ảnh Evidence + BusinessOperation | Khách thực nhận7; không trừ tồn thêm |
| OPEN FD claim3 | ReturnSourceClaim theo cùng GI line | Giữ phần chưa POD; chưa tăng tồn |
| Post GR-FD3 | Nhập thực3, consume claim, ghi DemandReopening và cập nhật chuỗi nguồn cùng commit | Net fulfilment=10−3=7; nhu cầu mở lại3 |
| PGI giao lại3 | Batch xuất mới trên nghĩa vụ đã mở lại | Gross PGI=13; net fulfilment=13−3=10 |
| POD giao lại3 | Xác nhận thực nhận có ảnh | Tổng thực nhận10; đủ điều kiện giao đủ |
| PAY-CFM | Sales xác nhận đủ tiền ngoài theo current deliveredOrderVersion | SO mới có thể COMPLETED; không đổi tồn |

Trên **cùng dòng GI**: POD hiệu lực + GR-FD đã post + OPEN FD claim không vượt valid PGI. PGI10/POD7 chỉ được xử lý FD tối đa3. Phần7 khách đã nhận muốn trả dùng CR riêng.

Nếu cần OD thay thế để giao lại, OdCommitmentTransfer chuyển phần cam kết đã mở; không tạo thêm SO/WIR giả hoặc ghi đè lịch sử PGI10.

### 11.3 Khách đã nhận rồi trả lại 2 viên

1. Sales tạo CUSTOMER_RETURN/line theo nguồn khách đã nhận; ReturnSourceClaim CR giữ hạn mức phù hợp.
2. Warehouse ghi custody/inspection và CustomerReturnAssessment. Ví dụ thùng mở nhưng gạch chưa dùng, không lỗi do khách và thời hạn có căn cứ → CASE_REVIEW.
3. CR thông thường đạt điều kiện do Sales STANDARD_ACCEPTANCE sau kiểm; có thể là Sales đã lập ca. Owner chỉ EXCEPTION_APPROVAL cho ngoại lệ đủ điều kiện và phải khác người đề nghị.
4. Warehouse post GR_CUSTOMER_RETURN theo quyết định hiện hành: chuyển phần được chấp nhận từ custody vào sở hữu đúng chất lượng; không đếm việc khách mang hàng tới và việc nhận sở hữu thành hai lần tăng vật lý.
5. Giữ POD/PAY-CFM gốc; CR thường không tự mở lại nhu cầu bán. Hoàn tiền nằm ngoài WMSD, nếu cần chỉ tham chiếu hồ sơ ngoài.

Đã thi công/hỏng do khách/quá hạn đã xác minh thì INELIGIBLE; Owner không được dùng approval để vượt điều cấm. Chưa biết thời hạn phải chờ xác minh.

### 11.4 Chuyển 100 viên từ kho A sang B

TR được duyệt → TD nháp → picking → bàn giao post TD → người kho B độc lập nhận MWTR → put-away. StockAccount transit gắn từng **dòng TD**.

| Mốc | Kho A | Transit | Kho B GOOD | Kho B DAMAGED | Tổng theo ví dụ |
|---|---:|---:|---:|---:|---:|
| Ban đầu | 100 | 0 | 0 | 0 | 100 |
| Post TD100 | 0 | 100 | 0 | 0 | 100 |
| MWTR nhận95GOOD+3DAMAGED | 0 | 2 | 95 | 3 | 100 |

3 viên hỏng đã nhận vẫn là hàng có mặt ở B, không được coi đồng thời là mất transit. 2 chưa giải quyết còn ở transit. Không tạo GI/GR mua phụ để ghi lần hai cùng lượng điều chuyển. TR chỉ đóng khi mọi phần nhu cầu, transit, sai lệch và nhiệm vụ đã được xử lý hợp lệ.

### 11.5 Kiểm kê: sổ 50 GOOD, thực tế 46 GOOD + 2 hỏng

| Bước | Model liên quan | Số liệu/ý nghĩa |
|---|---|---|
| Kích hoạt | STOCKTAKE + LocationLock + StocktakeSnapshot | Snapshot 50, freeze phạm vi nguyên tử |
| Đếm/kiểm | CountAttempt, DEFECT_CASE, DefectHold, Evidence | Tổng thực48; trong đó2 hỏng, có bằng chứng; hold chưa sửa balance |
| Đối chiếu | ST_RESOLUTION | Thiếu thực2 và phân loại lại2, là hai việc khác nhau |
| Duyệt/thực hiện | Approval, execution fields của resolution line | Đúng phiên bản plan/count; Warehouse xác nhận thực hiện |
| Chốt | PostingBatch + StockMovement + balances + kết quả closure | DELTA−2 và RECLASS2 trong cùng batch hợp lệ |
| Hoàn tất | Resolve hold, giải phóng lock, OutboxEvent | Chỉ sau khi transaction chốt thành công |

Kết quả đúng: GOOD46 + DAMAGED2 = tổng48. Từ GOOD50 có thể giảm thiếu2 còn48, rồi chuyển2 sang DAMAGED còn46GOOD. Không ghi shortage−4 rồi lại trừ/hủy2 hỏng.

Nếu thực tế48GOOD+2hỏng=tổng50 thì **chỉ RECLASS2**, không có ADJUSTMENT0 hoặc shortage−2. CountAttempt lưu lượng theo các snapshot/balance; schema không tự có trường `goodQty`/`damagedQty` trên một count, nên việc tách chiều chất lượng, hàng phát hiện mới và chọn count phải được quy trình xử lý rõ.

Lỗi chốt thì rollback, giữ lock/hold. Đếm lại chỉ khi cần làm rõ hoặc được chọn; thêm CountAttempt, không sửa snapshot/lần đếm cũ.

### 11.6 Trả NCC 4 viên

Warehouse lập SUPPLIER_RETURN đúng nguồn/owner → Accountant xác minh agreementVersion/qty/evidence → Warehouse thực xuất GI_SUPPLIER_RETURN → NCC SUPPLIER_ACK → Accountant đối chiếu/đóng phần kho.

Chỉ GI-SR thực xuất sở hữu mới giảm tồn STORE. ACK và việc đóng không trừ thêm; hàng giữ hộ NCC chỉ giảm custody khi bàn giao, không giảm owned STORE. BF-08 này không có Owner approval và không dùng UC-106 đã retired. Theo dõi Invoice/Credit Note ngoài không tự tạo receipt thay hàng hoặc thực hiện hoàn tiền.

### 11.7 Tồn thấp sau kiểm kê: thông báo rồi mới lập RR

Ví dụ policy min50/target50, available18, nguồn về phù hợp10, pending RR0: lượng gợi ý minh họa là `50 − 18 − 10 = 22`.

1. Chốt kiểm kê hợp lệ ghi OutboxEvent STOCKTAKE_CLOSED và version cùng transaction nguồn.
2. Consumer sau commit đánh giá nguồn và ghi Notification riêng cho từng người được nhận. Không tự lập RR.
3. Mở thông báo tính lại tồn/coverage và quyền hiện hành. Đọc chỉ đổi readAt.
4. Mở form chưa lưu gì. Sales/Warehouse chọn Lưu nháp/Gửi duyệt hợp lệ mới ghi RR22 và các source/snapshot/link tương ứng.
5. Đánh giá sau đó phải xét RR22 đã có đúng một lần để tránh đề nghị trùng; dùng guard/version và transaction khi triển khai command.

Available mới thành30 thì snapshot18 vẫn giải thích lần đánh giá cũ; không được dùng18 như số sống để tạo RR mới. Đổi lượng so với suggested phải có lý do và review dữ liệu mới.

<a id="luu-y"></a>
## 12. Các điểm dễ nhầm và giới hạn của model

| Dễ nhầm | Cách hiểu đúng |
|---|---|
| Product có field tổng tồn | Số dư nằm ở StockBalance theo account/lô/quality/owner; Product không lưu tồn |
| Lot VERIFIED là hàng GOOD | VERIFIED xác minh nhận dạng; quality nằm ở balance/inspection |
| Quarantine nghĩa chủ hàng là khách/NCC | Vị trí và chủ hàng độc lập; ownerPartyId quyết định sở hữu |
| Tồn100, hold2, reserve20 luôn available78 | ACTIVE hold hiện chặn toàn balance; không dùng phép trừ này |
| PO/allocation chưa về có thể xuất ngay | Đó là nguồn dự kiến; chưa phải available hiện tại |
| Picking/put-away làm tổng tồn tăng/giảm | Chuyển hai đầu; PGI/receipt thực tế mới là các mốc nhập/xuất tương ứng |
| PGI là khách nhận và đơn hoàn thành | PGI, POD, PAY-CFM là ba mốc độc lập |
| Claim trả hàng là Reservation tồn kho | Claim giữ hạn mức nguồn cũ; Reservation giữ balance hiện có |
| CASE_REVIEW là APPROVED | Chỉ đủ điều kiện để xét, vẫn cần quyết định đúng quyền |
| Chỉ lưu một bản ghi là đã hoàn tất nghiệp vụ | Model chỉ lưu/validate/hook; service mới điều phối transaction/permission/stock |
| Có ref thì Mongo tự kiểm FK | ref hỗ trợ liên kết/populate; service phải kiểm tồn tại, loại, cùng chuỗi, product/kho |
| unique tự kiểm trong `validate()` | Unique là index database cần được triển khai; validation tại chỗ không chứng minh index |
| version tự chống mọi ghi đồng thời | Phải conditional write/check/increment cùng transaction; không chỉ đọc rồi lưu |
| Append-only bảo vệ mọi truy cập DB | Middleware bảo vệ API Mongoose tương ứng; raw collection/DB access cần kiểm soát riêng |
| Có model nghĩa có API/UI đầy đủ | Checkout có auth/users/roles/upload và replenishment read routes; phần lớn command/worker nghiệp vụ còn cần triển khai |

Tại lần đọc này, router có nhóm `/health`, `/auth`, `/upload`, `/users`, `/roles`, `/replenishments`; replenishment có API đọc list/detail. Không lấy schema/seed làm bằng chứng create/submit/approve/post/notification consumer đã hoàn chỉnh. Tài liệu không kiểm dữ liệu hoặc index trên database đang dùng.

Các bất biến xuyên collection còn phải thực hiện tại service/transaction: actor và kho hợp lệ; đúng loại nguồn; quy đổi/lô tương thích và nguyên viên; trần lượng approval/POD/FD/CR; hàng freeze/hold; chống ghi lặp; batch/movement/balance/reservation/progress/audit/outbox đồng nhất. Schema POSTED document/line cũng chưa tự bất biến toàn bộ; phải chặn sửa ở persistence/service.

Model-utils, constants và index.js là file hỗ trợ/đăng ký, không phải collection mới. `notificationDedupKey` là hàm helper. QUALITY_CODES/QUALITY_STATUSES là danh mục code trong source, không phải collection `quality_status`. Hai view SQL inventory_ledger/available_stock cần aggregation/service tương ứng, không tự có thêm collection/view MongoDB.

<a id="nguon"></a>
## 13. Nguồn đối chiếu

Ưu tiên cấu trúc thực tế tại [điểm export model](src/models/index.js), [constants](src/models/constants.js), [helper chung](src/models/model-utils.js) và từng file model đã liên kết ở các mục trên. Tổng quan kỹ thuật và mapping SQL nằm ở [README models](src/models/README.md).

Quy tắc nghiệp vụ được đối chiếu với [context BE](context.md), [quy trình VI](git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) theo các quy tắc được tổng hợp trong context, và [đề xuất bổ sung hàng](git_doc/docs/03_thiet_ke/De_xuat_bo_sung_hang_theo_nguon_2026-10-27.md) được README models tham chiếu. Phạm vi route hiện tại xem [routes.js](src/routes.js) và [replenishment read API](src/modules/replenishments/README.md).

Khi schema thay đổi, cần cập nhật lại field/enum/index/ví dụ trong tài liệu này; không dùng ngày đối chiếu trên đầu file để suy rằng database đã chạy migration hoặc mọi flow đã được nghiệm thu.
