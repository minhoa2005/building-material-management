# Rà soát và đề xuất tách Use Case — 29/10/2026

Đã áp dụng nhóm P1/P2 ngày 30/10/2026; mã chính thức và phạm vi hiện hành tại [crosswalk](CR-2026-10-30-UC-SPLIT.md). Nội dung đánh giá dưới đây giữ theo thời điểm đề xuất.

## 1. Kết quả và phạm vi

Rà soát catalogue 111 mã trong Report 3, gồm **97 ACTIVE và 14 RETIRED**, cùng ma trận quyền và đặc tả từng UC. Đề xuất **11 UC ưu tiên tách (P1)** và **10 UC chuẩn hóa tiếp (P2)**. Có **7 UC cần cân nhắc theo cách vận hành**; 69 UC ACTIVE còn lại giữ cấu trúc hiện tại trong lượt rà soát này.

Đây là đề xuất cấu trúc yêu cầu, chưa sửa catalogue, cấp mã chính thức, thay quyền, thay quy trình hay xác nhận chức năng đã triển khai. P1/P2 thể hiện ưu tiên sửa tài liệu, không phải ưu tiên triển khai tính năng.

**Nguồn chính là bản trong `src/be/git_doc`**, theo baseline 3.3.0 và quyết định mỗi user đúng một role ngày 28/10. Repo riêng `D:/Ky_9/SEP490/git_doc` vẫn có baseline 3.1.0 và khác nội dung; không dùng bản đó để ghi đè quyết định mới.

| Nguồn | Phần đã dùng |
|---|---|
| [Report 3](../01_bao_cao/WMSD_Report3_Fix.docx.txt) | I.4.2 catalogue; I.4.4 quyền; II đặc tả 111 UC; III màn hình. Các đoạn nguồn được chỉ rõ trong bảng bên dưới. |
| [Quy trình VI](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) | BF-01–08, quyền, BR-01–33 và điều kiện trạng thái/chứng từ. |
| [Thiết kế hệ thống](../03_thiet_ke/WMSD_Thiet_ke_he_thong_chi_tiet.md) | Hợp đồng transaction/API thiết kế, màn hình và truy vết UC; không coi các API thiết kế là API đã chạy. |
| [Đề xuất bổ sung hàng 1.4.0](../03_thiet_ke/De_xuat_bo_sung_hang_theo_nguon_2026-10-27.md) | Một form RR, nguồn từng dòng, lưu nháp/gửi duyệt, policy minimum/target và Notification. |
| [Context BE](../../../context.md) | Mục 1–4: baseline, một role/user, quyền master, A1/B1/C2 và BF-08. |

## 2. Nguyên tắc tách

Một UC nên diễn tả một mục tiêu có trigger, quyền, tiền điều kiện và kết quả thành công rõ. Cần ưu tiên tách khi khác người chịu trách nhiệm/quyền thao tác, khác giai đoạn có thể lưu và tiếp tục sau, hoặc khác kết quả nghiệp vụ như nháp so với post tồn.

Không phải mọi chữ “and/or” hoặc mọi nút bấm đều cần một UC riêng. Approve/reject/return thường là các kết quả của cùng mục tiêu xét duyệt; filter/sort/export thường là nhánh của việc tra cứu. Activate/deactivate có thể là hai nhánh của một UC “Change … Status” nếu cùng quyền và cùng tài nguyên; từng nhánh vẫn phải có tiền/hậu điều kiện riêng.

Các thao tác tạo/sửa master được đề xuất tách để nhất quán với mức chi tiết hiện có của catalogue, vốn đã tách list/detail/create ở nhiều phân hệ. Đây là lựa chọn chuẩn hóa của dự án, không phải khẳng định mọi mô hình UC bắt buộc tách CRUD.

Ký hiệu `UC-13.A`, `UC-19.B`… trong báo cáo chỉ là **nhãn đối chiếu tạm**, không phải mã UC mới. Tách UC không đồng nghĩa tách màn hình, API hay transaction; nhiều UC có thể dùng chung form.

## 3. Hai trường hợp cần sửa rõ nhất

### UC-19 — Maintain Supplier → 3 UC

Đặc tả nguồn ghi riêng Accountant Create/Update và Owner Activate/Deactivate, nhưng tên UC vẫn bao trùm cả hai. Nguồn: Report 3, UC-19, phần II; dòng ma trận quyền UC-19 trong I.4.4.

| Nhãn | Tên đề xuất | Actor thực hiện | Tiền điều kiện và kết quả chính |
|---|---|---|---|
| UC-19.A | Create Supplier — Tạo nhà cung cấp | Accountant | Chưa có định danh trùng; tạo hồ sơ định danh/liên hệ. Không suy ra Accountant có quyền đổi trạng thái hoạt động. |
| UC-19.B | Update Supplier Information — Cập nhật thông tin nhà cung cấp | Accountant | Hồ sơ đã tồn tại; sửa trường định danh/liên hệ được phép, giữ liên kết PO/GR/SR và lịch sử. Không đổi trạng thái hoạt động. |
| UC-19.C | Change Supplier Cooperation Status — Thay đổi trạng thái hợp tác | Owner | Hồ sơ đã tồn tại; kích hoạt/ngừng hợp tác có audit. NCC inactive không dùng cho PO mới; chứng từ lịch sử vẫn đọc được. |

Owner không nhận quyền sửa thông tin chỉ vì tham gia nhóm Supplier. Accountant không nhận quyền activate/deactivate chỉ vì được tạo hồ sơ. Trạng thái khởi tạo cụ thể phải dùng quy tắc đã được chốt; đặc tả hiện tại chưa mô tả đủ để tự thêm cơ chế “tạo xong tự active” hoặc “Owner duyệt mọi NCC mới”. Không đề xuất hard delete NCC.

### UC-13 — Maintain Product and Packaging → 5 UC

UC này bao gồm ít nhất ba tài nguyên nghiệp vụ: Product, Conversion Version và Product/Warehouse Policy. Nguồn: Report 3, UC-13, phần II; mục Product / Conversion Version / Warehouse Policy trong I.3.2.

| Nhãn | Tên đề xuất | Actor thực hiện | Tiền điều kiện và kết quả chính |
|---|---|---|---|
| UC-13.A | Create Product — Tạo sản phẩm | Owner | Tạo SKU và thuộc tính cơ bản; kiểm trùng. Việc tạo hồ sơ chưa có quy đổi hợp lệ không cấp quyền sử dụng quy đổi đó. |
| UC-13.B | Update Product Information — Cập nhật thông tin sản phẩm | Owner | Sản phẩm tồn tại; sửa tên/vật liệu/kích thước danh nghĩa và thuộc tính được phép, giữ tham chiếu lịch sử. |
| UC-13.C | Change Product Status — Thay đổi trạng thái sản phẩm | Owner | Kích hoạt/ngừng sử dụng theo điều kiện hợp lệ; không xóa lịch sử hoặc sửa tồn. Không sửa trạng thái qua UC-13.B. |
| UC-13.D | Define Packaging Conversion Version — Thiết lập phiên bản quy đổi đóng gói | Owner | Sản phẩm tồn tại; lưu hệ số BOX/PIECE/m² dương theo thông số xác minh; phiên bản đã dùng bất biến, chứng từ giữ snapshot. Không suy hệ số từ calibre. |
| UC-13.E | Configure Warehouse Stock Policy — Cấu hình chính sách tồn theo kho | Owner | Có product/warehouse; lưu minimumQty, targetQty, version và updatedBy; `target >= minimum >= 0`, mặc định target bằng minimum. Không tự tạo RR/PO. |

UC-11/12 tiếp tục là xem danh sách/chi tiết. Kiểm số viên trong thùng mở và phân biệt bao bì rách với gạch hỏng là quy tắc khi kiểm nhận/soạn/kiểm kê; không biến thành thao tác nhập tồn trong UC-13. Thay policy/quy đổi không tính lại chứng từ cũ.

## 4. P1 — 11 UC nên ưu tiên tách

Các tên ngăn bằng dấu chấm phẩy tương ứng lần lượt nhãn `.A`, `.B`… của UC gốc. Quyền xem liên quan giữ như ma trận hiện hành; cột Actor dưới đây tập trung vào người thực hiện mục tiêu.

| UC gốc | Vấn đề trong đặc tả hiện tại | UC đề xuất và actor | Ranh giới phải giữ |
|---|---|---|---|
| UC-03 Create replenishment request | Phần II bước 4–5 gộp lưu mới, cập nhật nháp và gửi duyệt; DRAFT/SUBMITTED có kết quả khác nhau. | **3:** Create Replenishment Draft; Update Replenishment Draft/Returned Request; Submit Replenishment Request — Sales/Warehouse. | Một form SC-06; Submit có thể lưu mới và gửi trong cùng lần bấm, không bắt buộc người dùng lưu nháp trước. Mở form/Later không tạo RR. Chỉ sửa trạng thái cho phép, recheck version/coverage; MANUAL_OTHER có lý do, không ép nguồn SO/kiểm kê giả. UC-04 xử lý quyết định Owner khác người gửi. |
| UC-07 Manage Purchase Order and Supplier Confirmation | Phần II bước 1–4 gộp lập PO, sửa/hủy phần chưa nhận, xác nhận NCC và đóng PO. | **5:** Create Purchase Order; Update Unreceived PO Remainder; Record Supplier Order Confirmation; Cancel Unreceived PO Remainder; Close Purchase Order — Accountant. | Chỉ từ RR đã duyệt; thay vượt duyệt/chốt thiếu cần quyết định phù hợp. Không cấp Accountant quyền tự duyệt; không hủy lịch sử nhận. Theo dõi outstanding đã có UC-06, không tạo UC đọc trùng. |
| UC-13 Maintain Product and Packaging | Gộp product, trạng thái, quy đổi và policy kho. | **5:** Các UC-13.A–E ở mục 3 — Owner. | Bảo toàn snapshot/version; policy gồm cả minimum và target. |
| UC-19 Maintain Supplier | Gộp hai vai trò với quyền không thay thế nhau. | **3:** Các UC-19.A–C ở mục 3. | Accountant tạo/sửa; Owner thay trạng thái. |
| UC-58 Post Goods Issue | Phần II bước 1 lập GI-S nháp trước picking, bước 3–4 mới PGI khi bàn giao. | **2:** Prepare Goods Issue Draft; Post Actual Goods Issue — Warehouse. | Nháp không trừ tồn. UC-54/55 đã tạo/xác nhận picking, chỉ tham chiếu chúng. PGI giảm thực bàn giao một lần; chưa phải POD/COMPLETED. |
| UC-71 Decide Customer Return Acceptance | Phần II bước 2 gộp STANDARD_ACCEPTANCE của Sales và EXCEPTION_APPROVAL của Owner. | **2:** Decide Ordinary Customer Return Acceptance — Sales; Review Eligible Customer Return Exception — Owner. | Sales được quyết định CR thường mình lập sau Warehouse kiểm. Owner khác requester ở ca ngoại lệ, không override điều cấm D6. Accept/reject/return là nhánh trong mỗi UC. |
| UC-72 Inspect Return or Failed-Delivery Intake | Phần II bước 2–3 có nguồn, custody và điều kiện CR/FD khác nhau. | **2:** Inspect Customer Return; Inspect Failed-Delivery Intake — Warehouse. | CR dùng nguồn khách đã nhận và assessment D6/customer custody. FD dùng GI-S chưa POD và bằng chứng thất bại; không D6/customer custody/Owner approval. Inspection chưa tăng owned stock hoặc tái mở nhu cầu. |
| UC-73 Post Customer Return or Failed-Delivery Receipt | Phần II bước 2–3 gộp GR-CR và GR-FD với hậu điều kiện khác nhau. | **2:** Post Customer Return Receipt; Post Failed-Delivery Receipt — Warehouse. | GR-CR theo quyết định đúng loại/role/version, không mở nhu cầu. GR-FD nhận thực tế và tái mở ròng SO/WIR/OD gốc trong **cùng commit**; không tách “reopen demand” thành command độc lập. |
| UC-87 Perform Stocktake Count and Record Results | Phần II bước 1 kích hoạt freeze/snapshot; bước 2–4 nhập count/recount sau đó. | **2:** Activate Stocktake Session; Record Stocktake Count Attempt — Warehouse. | Freeze và snapshot vẫn nguyên tử. Count/recount append-only; blank khác 0. UC-105 in phiếu giữ riêng. Hold khi phát hiện lỗi phải ghi ngay, không chờ count hoàn tất. |
| UC-91 Create Inventory Adjustment Request | Phần II gộp đề xuất phương án với xác nhận Warehouse thực hiện, kể cả mô tả quyền. | **2:** Propose Stocktake Resolution; Confirm Stocktake Resolution Execution — Warehouse. | Đề xuất có version, tách DELTA khỏi RECLASS/location. Xác nhận thực hiện cuối cùng khớp plan đã duyệt UC-92; đổi plan cần duyệt lại. Bằng chứng kiểm tra có thể ghi trước, nhưng không thay xác nhận thực hiện. UC-93 mới post/chốt. |
| UC-107 Record Supplier Agreement and Receipt Acknowledgement | Phần II bước 1 trước xuất; bước 2 sau xuất; bước 3 đối chiếu sai lệch; bước 4 lại nhắc đóng. | **3:** Verify Supplier Return Agreement; Record Supplier Receipt Acknowledgement; Reconcile Supplier Return Variance — Accountant. | Agreement và ACK là hai mốc khác nhau. UC-83 chịu trách nhiệm đóng phần kho sau khi đối chiếu xong, không tạo UC đóng trùng ở UC-107. Không Owner/UC-106; ACK không post tồn. |

## 5. P2 — 10 UC nên chuẩn hóa tiếp

| UC gốc | UC đề xuất và actor | Căn cứ và giới hạn |
|---|---|---|
| UC-16 Maintain Product Lot | **2:** Create Product Lot — Owner/Warehouse; Update Product Lot Information — Owner. | Report 3 UC-16 tiền điều kiện/quyền: Warehouse chỉ create. Không thêm quyền sửa lô cho Warehouse, không sửa nhận dạng đã giao dịch để che thiếu; lô UNKNOWN chưa được cấp hàng. |
| UC-22 Maintain Customer | **2:** Create Customer Delivery Reference; Update Customer Delivery Reference — Sales. | Report 3 UC-22, normal flow maintain contact/delivery/external code. Tách đăng ký mới và sửa bản có sẵn; vẫn chỉ tham chiếu giao hàng, không thêm CRM, công nợ hay xóa hồ sơ có liên kết. |
| UC-29 Maintain Storage Location | **3:** Create Storage Location; Update Storage Location Information; Change Storage Location Status — Owner. | Catalogue ghi create/update/deactivate; phần II có active/allocatable và kiểm tra tồn/open refs. Không deactivate vị trí còn hàng/tham chiếu mở; sửa master không di chuyển tồn hoặc vượt freeze. |
| UC-48 Update or Cancel Unissued Sales Order Remainder | **2:** Update Eligible Sales Order Remainder; Cancel Eligible Sales Order Remainder — Sales. | Phần II bước 2–3: sửa và hủy có kết quả/cancellation history khác nhau. Chỉ phần chưa thực hiện hoặc GR-FD đã về chưa giao lại; không hủy hàng đang ngoài kho chưa giải quyết. Sửa/hủy không tạo stock movement. |
| UC-65 Inspect Defective Goods and Submit Disposition | **2:** Record Defect Inspection and Immediate Hold; Submit Defective Goods Disposition Proposal — Warehouse. | Phần II bước 1 chặn ngay; bước 2–3 mới đề xuất. UC thứ nhất không tách hold khỏi ghi nhận cần chặn. Ngoài freeze đến UC-66/67; B1 đến UC-91/92/93; trả NCC đến BF-08. |
| UC-88 Reconcile Stocktake | **2:** Reconcile Stocktake Results; Close Stocktake Without Variance — Warehouse. | Phần II bước 2 đang đóng/unlock ngay trong UC mang tên đối chiếu. UC đóng chỉ khi không lệch quantity/quality/location, không hold/task mở; quality-only vẫn cần resolution. Recount quay về UC-87.B, không thêm UC nhập recount trùng. |
| UC-97 Maintain Staff Account | **3:** Create Staff Account; Update Staff Account Information; Change Staff Account Status — Administrator. | Catalogue và phần II ghi create/update/activate/deactivate. Không trộn role/operation/warehouse assignment UC-98 vào sửa hồ sơ. Mỗi account đúng một role, kể cả inactive; inactive không được đăng nhập. |
| UC-103 View and Select Shortage Fulfilment Options | **3:** Compare Shortage Fulfilment Options — Owner/Sales/Warehouse; Select Warehouse Supply Option — Warehouse; Confirm Customer Fulfilment Choice — Sales. | Report 3 UC-103 phân biệt Owner view-only, Warehouse chọn nguồn, Sales xác nhận lựa chọn khách. Không cho Owner quyền chọn chỉ vì xem cùng màn hình. RR/TR/OD thực hiện bằng UC tương ứng; đọc Notification phải đánh giá lại nguồn, không tự tạo RR. |
| UC-108 Record External Document References | **2:** Verify Historical Customer Delivery Source; Record External Document Reference — Accountant. | Phần II bước 2 gộp xác minh nguồn khách đã nhận dùng cho CR với tham chiếu Invoice/Credit Note/kết quả ngoài. Giữ bằng chứng/lượng nguồn; không tự sinh POD, thu tiền, hoàn tiền hoặc hoàn thành SO. Các loại chứng từ ngoài vẫn là nhánh của UC thứ hai. |
| UC-109 Manage Linked Warehouse Issue Request | **5:** View WIR List; View WIR Details — Owner/Accountant/Warehouse/Sales theo scope hiện có; Create Linked WIR; Update Linked WIR; Cancel Eligible WIR Remainder — Sales. | Ma trận quyền gộp view và manage; phần II bước 1 và 4 gộp create/update/cancel. Hai UC đọc chuẩn hóa quyền xem đang có ở SC-29; không mở scope. Tái mở ròng là hậu điều kiện GR-FD, chuyển commitment OD thuộc UC-51, không thêm UC tạo lại demand/SO/WIR. |

## 6. Bảy UC chỉ nên tách thêm khi có mục tiêu vận hành độc lập

| UC | Phương án có thể tách | Điều kiện quyết định |
|---|---|---|
| UC-26 Inspect and Post Goods Receipt | Inspect PO Delivery; Post Purchase Goods Receipt — Warehouse. | Tách nếu kết quả kiểm được lưu, chờ quyết định/bổ sung chứng cứ rồi một lần khác mới post. Nếu một hành động xác nhận sau kiểm là mục tiêu duy nhất thì giữ UC, mô tả inspection là bước bắt buộc. UC-10 đã lập arrival/draft, không nhân bản. |
| UC-43 Record Transfer Dispatch | Prepare Transfer Dispatch Draft; Confirm Transfer Picking; Post Transfer Handover — Warehouse. | Nháp, picking và bàn giao có thể diễn ra khác thời điểm. Chỉ đưa cả ba vào catalogue nếu picking có task/xác nhận độc lập; khi picking ghi ngay trên TD thì giữ bước trong UC bàn giao. Không phục hồi UC-42, thêm Owner duyệt TO hay trừ thêm GI cho cùng TD. |
| UC-55 Confirm Picking Task | Confirm Picking; Confirm Unpick — Warehouse. | Phần II đã có unpick sau bàn giao thất bại. Tách khi người kho khởi tạo một tác vụ hoàn soạn độc lập; nếu chỉ là nhánh xử lý task hiện tại thì mô tả branch. Unpick phải bảo toàn reservation và tổng; không dùng để đảo PGI đã post. |
| UC-99 View Operational Reports | Các UC xem báo cáo theo mục tiêu: tồn; mua/nhận; đáp ứng/xuất/giao; điều chuyển; lỗi/trả; kiểm kê. | Nên tách khi có hợp đồng dữ liệu/quyền hoặc lần chạy riêng cho từng nhóm. Nếu chỉ đổi reportType và cùng flow thì giữ UC, bổ sung bảng quyền từng nhóm. Owner xem mọi nhóm; Accountant movement/mua-nhận; Warehouse movement/tồn/transfer/stocktake theo scope; không tự thêm Sales hoặc báo cáo doanh thu/lợi nhuận. |
| UC-104 Inspect and Post Transfer Receipt | Inspect Transfer Arrival; Post Transfer Receipt — Warehouse kho đích. | Giống UC-26: chỉ tách khi inspection là kết quả lưu độc lập. Bắt buộc receiver khác dispatcher; post transit→đích nguyên tử, không tách hai đầu cập nhật. |
| UC-110 Confirm Customer Delivery with Photo Evidence | Confirm Customer Delivery; Correct/Void Delivery Confirmation — Warehouse. | Phần II bước 4 đã có VOID. Có thể tách correction để nêu rõ lý do/dependency/version; không đồng nghĩa thêm quyền hoặc cho sửa/xóa POD đã xác nhận. Không cần UC riêng cho upload ảnh. |
| UC-111 Confirm Full External Payment Receipt | Confirm Full External Payment Receipt; Correct/Void External Payment Confirmation — Sales. | Phần II có correction. Tách khi cần mô tả riêng đường đính chính, vô hiệu hiệu lực cũ và tính lại tiến độ; không đưa thu/chuyển tiền vào WMSD. |

Chưa tính các phương án ở mục này vào số UC dự kiến. Khác hiệu ứng tồn là dấu hiệu cần phân tích, nhưng không tự động đòi tách mọi bước kiểm đếm trước một lần post.

## 7. Các trường hợp nên giữ và chỉ làm rõ tên/luồng

| UC/nhóm | Đề xuất |
|---|---|
| UC-04, UC-41, UC-44, UC-66, UC-92 | Giữ một UC xét duyệt với approve/reject/return là nhánh. Có thể đổi UC-04 thành Review Replenishment Request, UC-66 thành Review Defective Goods Disposition, UC-92 thành Review Stocktake Resolution để tên bao phủ quyết định. |
| UC-93 | Giữ một mục tiêu chốt kiểm kê. DELTA, RECLASS/location, resolve hold và unlock thuộc batch có điều kiện nguyên tử; không tách thành các UC post riêng có thể để hệ thống dở dang. Phải giữ đánh giá bổ sung hàng sau commit theo baseline 3.3.0. |
| UC-67 | Giữ Execute Approved Defective Goods Disposition; scrap/regrade/release là action theo quyết định đã duyệt. Nêu rõ hậu điều kiện từng action, không suy rằng action nào cũng giảm tổng. B1/trả NCC theo luồng riêng. |
| UC-81 | Giữ tạo SR kèm hold/reservation cần thiết. Xác minh agreement đã thuộc UC-107, chỉ gọi/chuyển luồng; không phải bước Warehouse hoặc Owner quyết định hộ. |
| UC-83 | Giữ và có thể đổi tên Close Supplier Return Warehouse Work. Đối chiếu sai lệch chi tiết đặt tại UC-107.C; UC-83 kiểm điều kiện đầy đủ và đóng phần kho, tránh hai UC cùng sở hữu command đóng. |
| UC-98 | Có thể giữ Configure Staff Access: một role trong năm role và operation/warehouse scope. Chỉ tách role/scope khi có quy trình độc lập; không biến thành quản trị role động, đa role hay ủy quyền. |
| UC-105 | Giữ xuất/in phiếu kiểm kê thành một UC, không tách PDF/print thành các mục tiêu mới. |
| Các UC xem list/detail, movement/trace | Giữ filter/sort/paging/source links trong flow/nhánh hiện có. UC-30/31 có nhiều chiều tồn không có nghĩa phải tách một UC cho mỗi quality/ownership/cột số lượng. |

Nhóm giữ nguyên cấu trúc (69 UC ACTIVE), để kiểm độ phủ:

`UC-01, UC-02, UC-04, UC-05, UC-06, UC-08, UC-09, UC-10, UC-11, UC-12, UC-14, UC-15, UC-17, UC-18, UC-20, UC-21, UC-27, UC-28, UC-30, UC-31, UC-32, UC-33, UC-34, UC-35, UC-36, UC-37, UC-38, UC-39, UC-40, UC-41, UC-44, UC-45, UC-46, UC-47, UC-49, UC-50, UC-51, UC-52, UC-53, UC-54, UC-56, UC-57, UC-63, UC-64, UC-66, UC-67, UC-68, UC-69, UC-70, UC-79, UC-80, UC-81, UC-82, UC-83, UC-84, UC-85, UC-86, UC-89, UC-90, UC-92, UC-93, UC-94, UC-95, UC-96, UC-98, UC-100, UC-101, UC-102, UC-105`.

14 mã RETIRED tiếp tục giữ lịch sử: `UC-23, UC-24, UC-25, UC-42, UC-59, UC-60, UC-61, UC-62, UC-74, UC-75, UC-76, UC-77, UC-78, UC-106`. Không dùng lại chúng cho UC mới.

## 8. Cách áp dụng đề xuất và số lượng dự kiến

| Phạm vi áp dụng | UC gốc được thay thế | UC sau tách cho nhóm đó | Tăng ròng | ACTIVE dự kiến |
|---|---:|---:|---:|---:|
| Chỉ P1 | 11 | 31 | 20 | 117 |
| P1 và P2 | 21 | 57 | 36 | 133 |

Đây là phép tính dự kiến theo đúng các phương án trong bảng, chưa gồm mục 6. Nếu giữ một mã cũ cho một UC sau tách và cấp mã mới cho các UC còn lại, tổng tương ứng là 131 hoặc 147 mã, gồm 14 RETIRED. Nếu chọn giữ UC gốc làm nhóm lịch sử/SUPERSEDED và cấp mã mới cho toàn bộ UC con thì tổng số identifier khác; không tính nhóm cha là UC ACTIVE thực thi thêm một lần.

Khuyến nghị giữ nguyên mọi mã không bị ảnh hưởng; với nhóm tách, giữ mã cũ cho mục tiêu kế thừa phù hợp nhất và lưu bảng mapping trước/sau theo phiên bản. Cấp mã bổ sung từ vùng chưa sử dụng sau UC-111 sau khi chốt phương án và kiểm tra mã mới của các thay đổi khác. Không đánh lại toàn bộ 111 mã hoặc tái sử dụng mã retired. Tuyệt đối không thu hẹp âm thầm nghĩa mã cũ mà bỏ bảng mapping.

Thứ tự cập nhật khi áp dụng:

1. Chốt các mục tiêu/actor trong P1, rồi P2; quyết định trường hợp cần thêm ở mục 6 dựa trên cách vận hành.
2. Viết mỗi UC với trigger, quyền thao tác, input, tiền/hậu điều kiện, luồng chính/nhánh, BR và hiệu ứng tồn. Tách đặc tả không làm rời các cập nhật phải cùng transaction.
3. Cập nhật đồng bộ Report 3 catalogue, actor mapping, permission, phần II, screens và BR references; giữ nội dung mới trong các mục hiện có của report.
4. Cập nhật quy trình VI/EN, thiết kế hệ thống/dữ liệu, context FE/BE, sơ đồ UC liên quan và bảng crosswalk. Chỉ đồng bộ repo tài liệu riêng theo baseline đã chọn, không ghi đè bản 3.3.0 bằng bản 3.1.0.
5. Cập nhật Report 1/2, Project Tracking, test checklist/acceptance và tổng ACTIVE/RETIRED nếu có tham chiếu bị ảnh hưởng; số UC tăng không đồng nghĩa khối lượng nghiệp vụ mới tăng tương ứng.

Không tự suy ra cần thêm UC tồn đầu kỳ/import, auto-transfer, logout, password reset hoặc tính năng chưa có từ thao tác tách này. Những khoảng trống yêu cầu khác cần đánh giá riêng. Không sửa code, migration, API hay quyền runtime trong lượt đề xuất.
