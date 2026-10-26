# ERD rút gọn — master data và các bảng còn lại từ ERD gốc

Ngày cập nhật: 25/10/2026. Bản tài liệu 3.1.1, baseline nghiệp vụ 3.1.0. Nguồn chuẩn: [Process Proposal 2 — EN, 3.1.0](../../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md). Phạm vi mới theo yêu cầu người dùng: sửa ERD gốc gồm 18 bảng, áp dụng kết luận gộp/bỏ và bổ sung master data; thể hiện trên **một ERD duy nhất**.

- [Xem ERD tổng thể](erd.html) — một canvas Crow-Foot, có nút phóng to/thu nhỏ, dùng offline.
- [Mã Mermaid](erd.mmd) — nguồn để sao chép/chỉnh sửa.
- [ERD trong Markdown](erd.md) — cùng sơ đồ và chú giải.
- [Nguồn mô hình](model.cjs) — 14 thực thể, 32 quan hệ; [lệnh dựng lại](build.cjs).

| Phiên bản | Ngày | Nội dung |
|---|---|---|
| 3.1.0 | 24/10/2026 | Góc nhìn rút gọn 14 thực thể/32 quan hệ. |
| 3.1.1 | 25/10/2026 | Đồng bộ nhóm thuộc tính A1/B1/C2 và dựng lại Mermaid/Markdown/HTML; giữ phạm vi 14 thực thể. |

## 1. Phạm vi chốt: 14 thực thể

**7 thực thể danh mục/quản trị:** User, Warehouse, Location, Product, ProductConversion, ProductLot, Partner. User là danh mục quản trị; ProductConversion là master data phụ thuộc Product.

**7 thực thể nghiệp vụ còn lại từ ERD gốc:** Inventory, StockMovement, PurchaseOrder, GoodsReceipt, SalesOrder, GoodsIssue, StockCount.

Bản này thay bản trình bày 35 thực thể/tám nhóm theo phạm vi mới. Đây là **góc nhìn rút gọn**, không liệt kê đầy đủ đối tượng độc lập của tám quy trình và không quy định số collection MongoDB. Các chứng từ không được chọn hiển thị vẫn giữ yêu cầu nghiệp vụ của 3.1.0.

## 2. Kết luận sửa ERD gốc đã áp dụng

| Xử lý | Thực thể / nội dung |
|---|---|
| Giữ 12 bảng gốc | User, Warehouse, Location, Product, ProductLot, Inventory, StockMovement, PurchaseOrder, GoodsReceipt, SalesOrder, GoodsIssue, StockCount |
| Gộp Zone | Location.AreaCode và Location.LocationType; mỗi Location thuộc đúng một Warehouse |
| Thay Supplier | Partner với PartnerType SUPPLIER/CUSTOMER; PO chỉ chọn SUPPLIER, SO nếu liên kết danh mục chỉ chọn CUSTOMER |
| Ẩn bốn bảng Line khỏi hình | PurchaseOrderLine, GoodsReceiptLine, SalesOrderLine, GoodsIssueLine được biểu diễn bằng Items/PlannedItems/IssuedItems; dữ liệu dòng và lượng liên kết nguồn vẫn phải giữ |
| Bổ sung master data | ProductConversion: lịch sử quy đổi riêng theo sản phẩm |
| Rút chi tiết kiểm kê vào StockCount | SnapshotItems, CountAttempts, ResolutionPlans; không thêm bảng nghiệp vụ ngoài phạm vi mới |

Số lượng: **18 − Zone − 4 Line − Supplier + Partner + ProductConversion = 14**. Ẩn Line khỏi hình là trừu tượng hóa khái niệm, không phải xóa chức năng dòng hàng.

## 3. Thuộc tính và chức năng

Quan hệ thay cho FK trên hình. Không hiển thị ID nội bộ, PK/FK, kiểu dữ liệu hoặc trường kỹ thuật. Token attr trong Mermaid chỉ là thành phần cú pháp, không phải kiểu dữ liệu database.

| Thực thể | Nhóm | Thuộc tính chính | Chức năng |
|---|---|---|---|
| User | Danh mục/quản trị | FullName, Email, Roles, AccountStatus | Tài khoản cá nhân; vai trò cố định và phạm vi kho được phân công. |
| Warehouse | Danh mục/quản trị | Code, Name, Address, Status | Kho vật lý; các khu chức năng cùng địa điểm không phải các kho riêng. |
| Location | Danh mục/quản trị | Code, AreaCode, LocationType, CapacityLimit, Status | Vị trí thuộc một kho; AreaCode thay Zone trong bản rút gọn. |
| Product | Danh mục/quản trị | SKU, Name, NominalSize, Surface, Status | Danh mục sản phẩm; kích thước danh nghĩa khác calibre thực tế của lô. |
| ProductConversion | Danh mục/quản trị | Version, PiecesPerBox, AreaPerPieceM2, BoxesPerPallet, EffectiveFrom | Master data phụ thuộc sản phẩm, giữ lịch sử quy đổi. Giao dịch chụp phiên bản/hệ số đã dùng; tồn cơ sở PIECE. |
| ProductLot | Danh mục/quản trị | ManufacturerLotNo, ToneCode, CalibreCode, ProductionDate | Lô thuộc một sản phẩm; không chứa số lượng tồn. |
| Partner | Danh mục/quản trị | Code, Name, PartnerType, Contact, Status | Danh mục SUPPLIER/CUSTOMER thay Supplier; thông tin liên hệ cần cho cung ứng/giao nhận. |
| Inventory | Nghiệp vụ | StockBucket, Quality, Quantity, Reservations, DefectHolds, TransitReference | Số dư hàng thuộc cửa hàng theo lô/chất lượng/vị trí hoặc tài khoản transit; không chứa custody. DefectHolds chặn phân bổ nhưng không tự đổi balance/snapshot khi đang kiểm kê. |
| StockMovement | Nghiệp vụ | EventType, Quantity, SourceAccount, DestinationAccount, SourceLineReference, PostedAt | Sự kiện ghi sổ thực tế; nguồn/đích xác định vị trí hoặc transit và chất lượng; giữ người post và nguồn/dòng. |
| PurchaseOrder | Nghiệp vụ | OrderNo, OrderDate, ExpectedDate, ApprovedDemandReference, Items, SupplierConfirmation, Status | PO từ nhu cầu đã duyệt; kho dự kiến nhận, NCC xác nhận và nhiều lần GR. |
| GoodsReceipt | Nghiệp vụ | ReceiptNo, ReceiptType, ReceivedAt, SourceReference, Items, InspectionEvidence, ReturnClaims, AcceptanceDecision, DemandReopening, Status | GR-P/GR-CR/GR-FD ghi lượng thực nhận vào sở hữu cửa hàng; không nhận điều chuyển/ADJ lần nữa qua GR-P. GR-FD consume claim và tái mở ròng cùng commit; GR-CR theo quyết định C2 và không tái mở. |
| SalesOrder | Nghiệp vụ | OrderNo, ExternalOrderReference, Version, DeliveryContact, NeedDate, Items, NetFulfilment, ReopenedDemand, ODCommitmentTransfers, Status | Bản chép đơn ngoài đã xác minh, kèm bằng chứng nguồn; có thể được thực hiện từ nhiều kho. Giữ tiến độ ròng, GR-FD tái mở và chuyển cam kết OD thay thế đúng source/version, không nhân nhu cầu. |
| GoodsIssue | Nghiệp vụ | IssueNo, IssueType, SourceReference, PlannedItems, IssuedItems, Handover, Status | GI-S/GI-SR: tách lượng dự kiến/thực giao, nháp trước picking và post tại bàn giao. |
| StockCount | Nghiệp vụ | CountNo, Scope, FrozenAt, SnapshotItems, CountAttempts, DefectHolds, ResolutionPlans, ExecutionEvidence, ClosureBatch, Status | Snapshot bất biến, hold không balance và lịch sử đếm; Warehouse đề xuất/xác nhận thực hiện, Owner UC-92/93 chốt batch delta thực/RECLASS trước mở khóa; không ADJ=0. |

## 4. Cách đọc quan hệ rút gọn

1. **Đơn hàng–sản phẩm và chứng từ–lô/vị trí:** M:N đi qua Items. Dòng giữ định danh, sản phẩm/lô, chất lượng, vị trí, lượng nhập liệu, đơn vị, phiên bản quy đổi, lượng PIECE và lượng nguồn. Không thay bằng danh sách mã không có số lượng. Nháp có thể chưa có dòng/lô/vị trí thực tế; post phải kiểm đủ dữ liệu hợp lệ.
2. **PO–GR:** một PO có nhiều GR-P; mỗi GR-P có đúng một PO. Đầu PO là 0..1 vì GR còn có nguồn CR/FD hoặc nhận lại được kiểm chứng theo ngoại lệ. Nguồn đó không có ô riêng trong phạm vi này; không được post GR khi thiếu nguồn phù hợp.
3. **SO–GI:** liên kết truy vết tổng hợp **qua SO → WIR → OD → GI-S**, không phải quyền xuất thẳng SO hoặc bỏ WIR/OD. GI-S bắt buộc có OD hợp lệ; GI-SR có nguồn supplier-return riêng. Cạnh SO là 0..1 để bao quát hai loại GI. SO không thuộc duy nhất một Warehouse; kho thực hiện thể hiện ở từng GI/đợt xuất.
4. **Inventory–Location:** ON_HAND có đúng một vị trí; TRANSIT không có vị trí vật lý và giữ TransitReference đến dispatch/dòng nguồn. StockBucket độc lập với Quality. Inventory chỉ chứa hàng thuộc cửa hàng; custody không vào đây.
5. **Inventory–StockMovement:** decreasing/increasing chỉ số dư nguồn/đích. Sự kiện có một hoặc cả hai phía phù hợp; chuyển nội bộ có hai phía bảo toàn tổng. SourceAccount/DestinationAccount xác định vị trí/tài khoản transit và chất lượng. Ghi bằng chứng/đóng hồ sơ không trừ lần nữa.
6. **StockCount:** Scope chọn kho/vị trí/lô/trạng thái. SnapshotItems bất biến; CountAttempts lưu mỗi lần đếm, chưa đếm khác 0; ResolutionPlans giữ phiên bản/quyết định/bằng chứng/batch. Chỉ plan được duyệt đúng phiên bản mới post delta/RECLASS. Book50 good, count48 good+2 broken → RECLASS2, không ADJ=0.
7. **User:** creating/planning/posting ghi người thực hiện, không hàm ý mọi chứng từ đều có Owner approval. Quyền và phân tách nhiệm vụ vẫn theo 3.1.0; không suy quyền duyệt từ cạnh User.
8. **Partner:** SO có thể chỉ giữ snapshot giao nhận, nên liên kết Customer là 0..1. Nếu liên kết thì phải đúng loại; PO luôn gắn một Supplier. Nhãn cạnh dùng động từ -ing theo ảnh mẫu.

## 5. Các nhóm thuộc tính phải bảo toàn

| Nhóm | Nội dung tối thiểu |
|---|---|
| ExternalOrderReference / SourceReference | Hệ thống/chứng từ/dòng nguồn, phiên bản khi được cung cấp, bằng chứng hoặc liên kết hồ sơ đã xác minh |
| Items / PlannedItems / IssuedItems | Dòng ổn định, sản phẩm/lô, chất lượng/vị trí khi áp dụng, lượng dự kiến/thực tế, đơn vị/hệ số và lượng nguồn được sử dụng |
| Reservations | Dòng nhu cầu, số dư nguồn, lượng giữ, trạng thái; không chỉ QtyReserved tổng không biết giữ cho ai |
| SnapshotItems / CountAttempts | Lô/vị trí/quyền sở hữu/chất lượng, từng lần đếm có người/thời điểm/lượng/bằng chứng; hàng mới tìm thấy ghi riêng book=0 |
| ResolutionPlans | Phiên bản, delta/RECLASS/vị trí, quyết định đúng vai trò, xác nhận thực hiện và batch; giữ freeze/hold tới khi giải quyết xong |
| ReturnClaims / AcceptanceDecision | Trần POD/FD/CR chung theo dòng GI, claim OPEN/CONSUMED/RELEASED; Sales STANDARD_ACCEPTANCE thường hoặc Owner EXCEPTION_APPROVAL đủ điều kiện đúng version; FD không cần D6/Owner/custody khách |
| NetFulfilment / ReopenedDemand / ODCommitmentTransfers | PGI hợp lệ trừ GR-FD, lượng tái mở nguồn gốc và chuyển cam kết có version; claim chưa post không tạo quyền giao lại, GR-CR không tái mở |
| DefectHolds / ExecutionEvidence / ClosureBatch | Hold không đổi balance/snapshot; xác nhận thực hiện Warehouse, Owner UC-92/93 và batch delta/RECLASS nguyên tử trước mở khóa |
| Handover / InspectionEvidence | Người/thời điểm, lượng thực nhận/giao, tình trạng và bằng chứng có kiểm soát truy cập |

Các nhóm này không quy định một cột JSON duy nhất. Thiết kế logic/vật lý vẫn giữ dòng, liên kết lượng, lịch sử, quyền, version và operation key/ghi sổ nguyên tử. Không thay các chứng từ nguồn bằng ghi chú tự do để bỏ kiểm soát.

## 6. Phạm vi không hiển thị

RR, ARR/INS, TO, WIR/OD, TR/TD/MWTR, CR/FD/SR, POD, PAY-CFM, custody và các hồ sơ độc lập khác không có ô riêng trong bản rút gọn. Không vì vậy bỏ yêu cầu phê duyệt, ghi nhận giao nhận hoặc tách hàng giữ hộ. Chỉ SO/GR/GI trên hình chưa mô tả đầy đủ các vòng đời này.

GR-FD mở lại đúng nhu cầu; GR-CR không mở lại. POD ảnh xác nhận DELIVERED; Sales xác nhận tiền ngoài mới COMPLETED. Ngưỡng tối thiểu theo Product + Warehouse và các mã chuẩn/quyền vẫn là cấu hình phụ trợ, không thêm thành bảng trên hình này.

Đã lược giá, đơn giá/thành tiền, đặt cọc, thu/chi, DateOfBirth, Password và các trường kỹ thuật khỏi hình. Không gộp Product với ProductLot và không bỏ Inventory/StockMovement.

## 7. Dựng lại và kiểm chứng

Chạy node build.cjs để tạo Mermaid và tài liệu; chạy node build.cjs --render khi có Mermaid/Playwright để tạo lại HTML. Có thể dùng WMSD_MERMAID_DIST trỏ thư mục dist của Mermaid, WMSD_PLAYWRIGHT_MODULE trỏ module Playwright và WMSD_BROWSER_EXECUTABLE trỏ Chrome/Edge cục bộ. HTML đã nhúng SVG nên mở không cần mạng/thư viện.

Đã kiểm tra phạm vi 14 thực thể, đầu mút 32 quan hệ, cú pháp Mermaid và bản hiển thị. Đây là kiểm chứng tài liệu/hình, không phải test backend. Lượt 25/10 đồng bộ Mermaid nhúng, context độc lập, PNG BF-04 và gói Mermaid/HTML; chỉ file draw.io bị loại trừ. Không migration database hoặc tự commit.
