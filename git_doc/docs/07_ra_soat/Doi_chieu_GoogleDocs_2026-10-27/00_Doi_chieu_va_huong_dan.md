# Đối chiếu ba báo cáo Word/Google Docs với 01_bao_cao

Ngày: 27/10/2026. Chỉ tạo bản đối chiếu và prompt; không sửa nguồn, không sửa Drive, không commit.

## Nguồn và giới hạn

| Báo cáo | Nguồn chính xác theo yêu cầu | Bản cần sửa |
|---|---|---|
| Report 1 | [WMSD_Report1_Fix.docx.txt](../../01_bao_cao/WMSD_Report1_Fix.docx.txt) | [Word/Google Docs](https://docs.google.com/document/d/1kb36v5HuFrM75NFCTXvnJcsg6QnPjYkb/edit) |
| Report 2 | [WMSD_Report2.docx.txt](../../01_bao_cao/WMSD_Report2.docx.txt) | [Word/Google Docs](https://docs.google.com/document/d/1aweQqG4yAx1xsLEpRaJUflqjSEjdj4gw/edit) |
| Report 3 | [WMSD_Report3_Fix.docx.txt](../../01_bao_cao/WMSD_Report3_Fix.docx.txt) | [Word/Google Docs](https://docs.google.com/document/d/1HvhlCmYjfXj7766ZVNUBAU4J063Lmr71/edit) |

Đã đọc nội dung cả ba bản đích qua Google Drive. Metadata xác định chúng là Word .docx mở trong Google Docs. Đối chiếu dựa trên văn bản và bảng trích xuất; chưa kiểm tra trực quan từng hình nhúng, bố cục hoặc số trang. Các yêu cầu sửa hình là đồng bộ với text chuẩn, không phải kết luận đã nhìn và xác nhận từng hình sai.

Hai workbook trong thư mục không có bản đối ứng được cung cấp để so sánh; số liệu kế hoạch lấy từ Report 2 chuẩn. Không đánh giá mức hoàn thành code.

## Kết luận và loại UC retired

Cả ba báo cáo đích cần cập nhật. Report 3 lệch nghiệp vụ nhiều nhất; Report 2 lệch lịch, effort và phân công.

| Hạng mục | Bản đích | Kết quả phải có |
|---|---|---|
| UC Report 3 | 102 active, UC-01–102 | **97 active**, giữ nguyên ID |
| UC cũ cần bỏ | 13 retired đang có trong bản đích | UC-23–25, UC-42, UC-59–62, UC-74–78 |
| Retired chưa có | UC-106 | Không bổ sung |
| UC active thiếu | Chưa có UC-103–111 | Chỉ thêm 8 mã: UC-103–105, UC-107–111 |
| Business flows Report 3 | 7 BF | 8 BF theo mapping bên dưới |
| Screens Report 3 | SC-01–27 | **28 active**: SC-01–24, SC-28–31 |
| Scope | Selling prices, internal invoices, refund workflow | Loại các workflow này; giữ external references và PAY-CFM đúng phạm vi |
| Plan Report 2 | 14 tuần, 350 pd, vai trò chung | 5 tuần còn lại, 92.25 pd, 5 owner nghiệp vụ |

Nguồn giữ 111 ID lịch sử (97 active/14 retired). Theo yêu cầu “UC retired hãy loại ra”, bộ prompt loại cả 14 UC retired khỏi catalogue, detailed specifications, permission matrix, sơ đồ UC và navigation hoạt động. Có thể ghi việc loại bỏ trong change log; không đánh số lại để lấp khoảng trống và không gọi 111 UC là active.

Bỏ SC-25 Selling Prices, SC-26 Internal Invoices, SC-27 Refund Requests khỏi danh mục/mockup/field/screen flow hoạt động. **UC-108 vẫn active**: external Invoice/Credit Note/refund references không phải workflow hóa đơn/hoàn tiền trong WMSD. **UC-111 vẫn active**: xác nhận thu đủ tiền bên ngoài không phải thực hiện thanh toán.

Kiểm đếm: **102 − 13 + 8 = 97 UC**; **27 − 3 + 4 = 28 screens**.

## Report 1: phần sai và cách sửa

| Mã | Vị trí / đoạn nhận diện bản đích | Sai lệch | Theo bản chuẩn |
|---|---|---|---|
| R1-01 | I.1 Baseline scope; I.2 Purpose | SO thương mại, giá bán, invoice/PDF/email, refund approval vẫn in scope | WMSD là lớp kho; SO sao chép nguồn ngoài đã xác minh; delivery photo POD và Sales PAY-CFM; tài chính ngoài WMSD |
| R1-02 | II: “exact warehouse positions are not maintained in a structured location map” | Khẳng định thiếu mã vị trí trái nguồn | Khảo sát20/10 báo ≥3 kho, khu/kệ/mã vị trí; lot/màu/kích thước lưu phần mềm/ảnh hộp; actual calibre và hệ số SKU chưa xác minh |
| R1-03 | II: địa chỉ, mua hàng, kiểm kê/nhập liệu | Địa chỉ như đã xác minh; Accountant tạo nhu cầu; recount bắt buộc | Phân biệt As-is/To-be D1–D8; địa chỉ từ ghi chú cũ; Sales/Warehouse tạo RR; đủ căn cứ có thể giải trình trực tiếp |
| R1-04 | III Consolidated Gaps / Section Summary | Còn “internal invoicing” trong giải pháp | Source-linked warehouse fulfilment/external reconciliation; giữ phần KiotViet/MISA đúng nguồn |
| R1-05 | IV; V FE-02/06/07 và LI-02/03/08/10 | Tên feature và limitations hồi sinh giá/invoice/refund | Thay đủ FE-01–09 và LI-01–10 theo nguồn; đổi Warehouse Staff, giữ đúng5 role |
| R1-06 | IV purchasing table | Accountant tạo request, “Approve closure of the remaining quantity”; kho chờ invoice | Sales/Warehouse RR, Owner approve/short closure, Accountant PO/ACK; warehouse completion độc lập accounting |
| R1-07 | IV transfer: “one batch”, “No partial task confirmation”, “additional planned shipment starts a new request” | Ép một lượt, không partial | Nhiều TD/MWTR/partial tasks; TR100/TD60/MWTR60 còn unissued40; không tự đóng TR |
| R1-08 | IV CR: Owner “Approve inspection acceptance” | Warehouse tạo CR, Owner duyệt trước inspection; thiếu C2/A1 | Sales tạo; Warehouse inspection; Sales ordinary decision sau kiểm tra (được cùng creator); Owner chỉ eligible exception; FD là nhánh riêng |
| R1-09 | IV supplier return | Warehouse agreement/ACK; Owner approve/close | Accountant agreement/ACK/reconciliation/UC-83 closure; Warehouse UC-82 actual dispatch; không Owner |
| R1-10 | IV stocktake/defects | Thiếu B1 hiện tại | FROZEN snapshot, balance-neutral hold, direct explanation hoặc append-only recount; Warehouse plan/execution, Owner UC-92/93 delta+RECLASS/location; no ADJ0/unlock sớm |
| R1-11 | Figure3/4 cùng “Same-Warehouse Relocation” | Caption trùng | Kiểm tra hình thực rồi gắn đúng BF-03 relocation và BF-04 transfer; đồng bộ8 BF, không đoán nội dung ảnh |
| R1-12 | Change log/acronyms/TOC | Chưa có cập nhật21/22/25 Oct và thuật ngữ mới | Theo nguồn chuẩn; ngày sửa tài liệu không đồng nghĩa business sign-off |

## Report 2: phần sai và số liệu thay thế

| Mã | Phần | Bản đích | Nguồn chuẩn |
|---|---|---|---|
| R2-01 | I.1 Scope | Chưa cập nhật baseline/97 UC | Baseline3.1.0;8 BF/9 FE/5 role/97 UC/BR-01–33/28 screen; A1/B1/C2/BF-08 không Owner |
| R2-02 | I.2 Assumptions/Constraints | Kế hoạch14 tuần | Remaining window26/10–29/11/2026, project Weeks8–12; Mon–Fri, internal deadline27/11 |
| R2-03 | I.3 Estimations | 350pd, stages1–6 | UC build67.25+support25=**92.25pd**; tuần20/20/20/17.75/14.50pd |
| R2-04 | I.4 Capacity | Gross2800h/effective2240h | Gross1000h/125pd; reserve200h/25pd; effective800h/100pd; planned738h/92.25pd; spare62h/7.75pd |
| R2-05 | I.5 Objectives | Effort/defect/coverage targets cũ |97/97 UC accepted; hiện0 accepted evidenced,5 auth/admin UC reported coded; không coi mockup/coded là nghiệm thu |
| R2-06 | I.6 Risks | Rủi ro14 tuần chung | Full scope5 tuần, shared posting, CR/FD/B1/BF-08, deployment/evidence; owner đúng nguồn |
| R2-07 | II.1–3 Process/Quality/Training | Iterations6–7/8–9/10–11; test12–13 | Nhịp2–2–1:26/10–08/11;09–22/11;23–29/11; tests/docs trong5 tuần |
| R2-08 | II.4 RACI | “student names are not available”; PM/BA/FE/BE/Tester | 5 named business owners làm FE/API/rules/tests/docs; independent peer review |
| R2-09 | II.5 Communications | Chung chung | Friday reviews30/10,06/11,13/11,20/11,27/11; internal iteration reviews06/11,20/11,27/11 |
| R2-10 | II.6 Configuration/tools | Drive duy nhất; thiếu React/Cloudinary | Local text/tracker, ReactJS/Node.js/MongoDB; Cloudinary nhóm báo cấu hình, phải verify; framework/test tooling/deploy TBC |

Week13 là30/11–06/12/2026, chỉ dự kiến rehearsal, chưa có ngày cố định và không tính capacity. Không bịa ngân sách/actuals/test results.

| Owner | UC scope | Active | Build pd | Support pd | Total pd | Peer |
|---|---|---:|---:|---:|---:|---|
| minhtd |01–19,26,32–33|22|13.00|5.00|18.00|hieudt|
| hieudt |27–31,34–41,43–44,100–101,104|18|11.75|5.00|16.75|bachhm|
| danghh |45–58,103,109–111|18|13.50|5.00|18.50|minhtd|
| trungph |63–73,79–83,102,107–108|19|16.75|3.00|19.75|bachhm|
| bachhm |20–22,84–99,105|20|12.25|7.00|19.25|trungph|
| **Tổng** ||**97**|**67.25**|**25.00**|**92.25**||

UC-20–22 thuộc bachhm, danghh chỉ sales/issue. bachhm hỗ trợ returns test/docs2pd; trungph giữ code/nghiệp vụ. UC-94–98 zero remaining build, vẫn regression.
Primary finishing iterations:63/31/3UC và33.75/30.50/3pd build. Weekly capacity phân theo lúc làm, gồm support/cross-iteration:40/37.75/14.50pd. Không ép hai cơ sở thành cùng số.

Tên tracker trong Report2 chuẩn có “Project_Tracking_Template.xlsx”; thư mục hiện có “Project_Tracking_Template_1.xlsx” và “Project_Tracking.xlsx”. Không tự đổi tên workbook hay khẳng định đã cập nhật tracker/Drive.

## Report 3: mapping business flows

| Bản đích | Bản chuẩn |
|---|---|
| BF-01 Replenishment... | BF-01 Replenishment, purchasing and goods receipt |
| BF-02 Defective... | BF-02 Defect detection, isolation and disposition |
| Chưa có BF riêng | BF-03 Same-warehouse relocation |
| BF-03 Warehouse Transfer... | BF-04 Inter-warehouse transfer and discrepancy resolution |
| BF-04 Stocktake... | BF-05 Stocktake, reconciliation and adjustment |
| BF-05 Sales...Internal Invoice | BF-06 Sales order, warehouse issue, customer delivery and completion |
| BF-06 Customer Return... | BF-07 Post-delivery customer returns and failed-delivery intake |
| BF-07 Supplier Return... | BF-08 Supplier return and quantity reconciliation |

Đây là thay contract và thứ tự quy trình, không chỉ find/replace số BF. Thêm I.2.9 Shared failures/EX-01–05.

## Report 3: các phần phải sửa

| Mã | Vị trí | Sai lệch quan sát | Theo nguồn chuẩn |
|---|---|---|---|
| R3-01 | I.1 Context/I.4.1 Actors | Pricing/invoice/refund in scope; Inventory Staff | Warehouse Staff, đúng5 role, external parties không login/API actor; commercial finance ngoài WMSD |
| R3-02 | I.2 BF-01; UC-01–04 | Accountant UC-03; Sales/Warehouse không quyền UC-01–03 | Sales/Warehouse originate/view own scope; Owner exact-version decision khác requester; Accountant PO |
| R3-03 | Receiving/location; UC-26/32–37 | Thiếu đầy đủ ownership/custody/identity contract | Accepted owned khác pending/custody/rejected; UNKNOWN không available; put-away/local relocate không tăng tổng lần2 |
| R3-04 | Transfer UC-38–44 | UC-42 active; UC-43 Confirm Warehouse Transfer Order; thiếu104 | TR→draftTD→picking execution→TD/HO→independentMWTR→put-away; partial/multiple trips; không thêm GI trừ tồn lần2 |
| R3-05 | Sales UC-45–58 | SO→OD→PGI→invoice, thiếu WIR/POD/PAY-CFM | Copied external SO→WIR→OD→draftGI-S trước pick→PGI→photoPOD/DELIVERED→SalesPAY-CFM/COMPLETED |
| R3-06 | Customer return UC-70–73 | Warehouse tạo; Owner trước inspection; refund active | Sales tạo; Warehouse inspection; C2 Sales ordinary acceptance sau inspection; Owner eligible exception; đúng D6/decision/version |
| R3-07 | UC-72/73/48/51/58/109/110 | Không có A1/GR-FD/net reopening | FD từ undeliveredGI; không D6/Owner/fakePOD/customer custody; stock+claim consumption+net demand/version atomically |
| R3-08 | Defects/stocktake UC-65–67/84–93 | Post-cutoff reconciliation, thiếu B1 | Scope freeze, immediate balance-neutral hold; direct explanation hoặc append-only recount; UC-92/93 batch delta+RECLASS/location theo execution, noADJ0 |
| R3-09 | Supplier return UC-79–83 | Owner UC-83Approve; Warehouse agreement/ACK | Accountant UC-107 agreement/ACK/reconcile, UC-83 close; Warehouse UC-82dispatch; UC-108finance độc lập |
| R3-10 | I.3 ERD/entities | “15 business entities”; Supplier→UC-18–22, RR→UC-23–26, GR→UC-33–40 | Model/traceability I.3 chuẩn, không giữ giới hạn15 entity hoặc UC links cũ |
| R3-11 | I.3.3/V BR | DR/GB riêng, UC-65–56 và UC-91–81,95,100; GB-NEW-04/05 invoice/refund | BR-01–33 duy nhất; legacy alias đúng nguồn; bỏ rule hỗ trợ retired, sửa traceability |
| R3-12 | I.4.2/I.4.4/II UC specs | 102 active; actor/permission/spec cũ | 97 active;8 bổ sung;15 tên đổi; đối chiếu cả UC giữ tên |
| R3-13 | I.5/III screens | 27 màn hình, pricing/invoice/refund active | 28active, thêmSC-28–31, bỏSC-25–27; cập nhật CR/FD/B1/WIR/POD/PAY-CFM fields/actions |
| R3-14 | API/Jobs/IV/V | Invoice email; chỉMSG-01–07; thiếu guard mới | SMTP outbox sau commit, controlled evidenceAPI-02, MSG-01–17; atomic/idempotent/source/version/freeze; không bịa SLA |
| R3-15 | Context/UC/ERD/screen figures | Caption/associations theo baseline cũ | Tái đồng bộ theo text/matrix active; không để draw.io/hình lịch sử lấn át nguồn |

### 8 UC active thiếu

| ID | Tên chuẩn |
|---|---|
| UC-103 | View and Select Shortage Fulfilment Options |
| UC-104 | Inspect and Post Transfer Receipt |
| UC-105 | Export or Print Stocktake Count Sheet |
| UC-107 | Record Supplier Agreement and Receipt Acknowledgement |
| UC-108 | Record External Document References |
| UC-109 | Manage Linked Warehouse Issue Request |
| UC-110 | Confirm Customer Delivery with Photo Evidence |
| UC-111 | Confirm Full External Payment Receipt |

### 15 tên UC active thay đổi

Đổi tên phải đi cùng nội dung, quyền và liên kết.

| ID | Bản đích | Bản chuẩn |
|---|---|---|
| UC-32 | Create Put-away Transfer Order | Create Put-away Task |
| UC-33 | Confirm Put-away Transfer Order | Confirm Put-away Task |
| UC-43 | Confirm Warehouse Transfer Order | Record Transfer Dispatch |
| UC-45 | View Sales Order List | View Copied Sales Order List |
| UC-46 | View Sales Order Details | View Copied Sales Order Details |
| UC-47 | Create Sales Order | Create Copied Sales Order |
| UC-48 | Update or Cancel Sales Order | Update or Cancel Unissued Sales Order Remainder |
| UC-52 | View Picking Transfer Order List | View Picking Task List |
| UC-53 | View Picking Transfer Order Details | View Picking Task Details |
| UC-54 | Create Picking Transfer Order | Create Picking Task |
| UC-55 | Confirm Picking Transfer Order | Confirm Picking Task |
| UC-71 | Review Customer Return Request | Decide Customer Return Acceptance |
| UC-72 | Inspect Customer Return | Inspect Return or Failed-Delivery Intake |
| UC-73 | Confirm Customer Return Receipt | Post Customer Return or Failed-Delivery Receipt |
| UC-92 | Approve Inventory Adjustment | Approve Stocktake Resolution |

UC-83 giữ tên Review Supplier Return Closure nhưng quyền đóng đổi sang Accountant; kiểm tra chỉ tên UC sẽ bỏ sót lỗi.

## Invariant dùng để nghiệm thu tài liệu sau sửa

- SO/WIR/draftGI không đổi stock; reservation giảm available; picking đổi location; PGI trừ đúng1 lần. POD/PAY-CFM không post stock.
- EffectivePOD + postedGR-FD + OPEN_FD ≤ validPGI trên mỗi GI line; receipt tiêu thụ claim, không giữ cả2 lần.
- Net fulfilment=validPGI−postedGR-FD; redelivery cùng SO/WIR; replacementOD chuyển commitment, không thêm demand.
- CR receipts+openCR claims ≤ customer-received eligible quantity (POD hoặc historical source đã xác minh). Ordinary GR-CR không mở demand.
- D6 loại installed/customer-caused damage/verified overdue; UNKNOWN chờ; Owner không override và không tự đặt return-day limit.
- B1 book50/count48GOOD+2broken→RECLASS2,total50; count46GOOD+2broken→delta−2+RECLASS2,total48. Không coi damaged hiện hữu là thiếu, không ADJ0.
- BF-08 không Owner dispatch/variance/closure; ACK/closure không trừ lại; custody release không giảm owned.
- Posting checks role/suboperation/warehouse/source/version/freeze; retry cùng key/payload trả prior result; key khác payload conflict; failure rollback toàn bộ, không unlock sớm.

## Nội dung thay thế đã viết sẵn bằng tiếng Anh

Bộ tài liệu đã được sửa theo yêu cầu: không cần upload file chuẩn hoặc cho công cụ truy cập workspace để tự so sánh. Nội dung đúng đã được đưa trực tiếp vào từng phần thay thế.

1. [Report 1 — các phần thay thế bằng tiếng Anh](01_Prompts_Report1.md): định nghĩa, I.1–I.2, II, III.3, IV, V và caption/nội dung hình.
2. [Report 2 — kế hoạch thay thế hoàn chỉnh bằng tiếng Anh](02_Prompt_Report2.md): toàn bộ I và II, số liệu, lịch, owner, quality và configuration.
3. [Report 3 — tám phần thay thế bằng tiếng Anh](03_Prompts_Report3.md): đủ nội dung overall/data/catalogue/permissions/97 đặc tả UC/28 màn hình/NFR/33BR/17messages.

Mở file tương ứng và copy cả chỉ dẫn lẫn phần replacement vào công cụ đang sửa báo cáo. Các thẻ replacement_text là dấu phân định cho công cụ, không chèn vào báo cáo cuối. Ba file chuẩn trong 01_bao_cao được giữ nguyên; không sửa Google Docs và không commit.
