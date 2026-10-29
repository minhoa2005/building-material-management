# WMSD — Agent context BE

> Phạm vi file: backend Node/MongoDB tại src/be. Dùng để code UC theo baseline 3.3.0, không phải tài liệu dịch ngược code thành SRS. **Không tự commit.**

Đọc cùng [FE context](../fe/context.md) khi thay API/permission/quantity/source contract. Hai file có phần nghiệp vụ chung để mỗi agent đọc độc lập, phần thiết kế triển khai và thẻ UC khác nhau theo vai trò.

Chỉ mục: [Bối cảnh](#1-bối-cảnh-và-cách-dùng) · [Quyền](#2-ngôn-ngữ-nghiệp-vụ-và-quyền) · [Bất biến](#3-bất-biến-cần-bảo-vệ) · [Trạng thái/lỗi](#4-trạng-thái-và-lỗi-dùng-chung) · Quy tắc code mục 5 · Git mục 6 · Từng UC mục 7 · Checklist mục 8 · Nguồn/hash mục 9.

## 1. Bối cảnh và cách dùng

WMSD (SEP490_G56) phục vụ cửa hàng gạch ốp lát Tân Thương: quản lý hàng thực tế theo kho/vị trí/lô/tone/calibre, nhu cầu bổ sung, mua và nhận hàng, xuất/giao, hàng lỗi, trả hàng, điều chuyển, kiểm kê và truy vết. Phạm vi một cửa hàng; khảo sát ghi nhận từ ba kho. Không suy ra tên, địa chỉ, khoảng cách hoặc đủ nhân sự ở từng kho từ dữ liệu demo.

Đây là context để agent **thực hiện chức năng**: đọc phần quy tắc chung, phần kiến trúc của repo này và thẻ UC cần làm; lần theo UC liên quan để không phá chuỗi nguồn. Không coi tài liệu này là bằng chứng chức năng đã chạy. Mỗi thẻ UC gồm quyền, đầu vào, xử lý, hiệu ứng và hướng dẫn triển khai riêng cho repo.

Baseline nghiệp vụ **3.3.0 (quyết định 27/10/2026)**; quy trình và thiết kế được đồng bộ theo đề xuất bổ sung hàng/Notification/form1.4.0. Giữ 8 BF, 9 nhóm FE-01–09, 5 role, **111 UC = 97 ACTIVE + 14 RETIRED**, BR-01–33, SC-01–31 =28 active/3 retired. Lịch sử A1/B1/C2 của3.1.0 vẫn áp dụng.

### Nguồn và cách giải quyết mâu thuẫn

| Nguồn | Phần agent cần dùng |
|---|---|
| [Quy trình VI](git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) | mục 3–4 quyền/luồng, mục 8 BR, mục 11 nghiệm thu, mục 15 chứng từ/trạng thái, mục 17 A1/B1/C2 |
| [Quy trình EN (đã đọc và đối chiếu)](git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) | mục 3–4 Eight To-be processes và EX-01–05, mục 6 permissions, mục 8 BR, mục 11 acceptance, mục 15/17 |
| [Report 3](git_doc/docs/01_bao_cao/WMSD_Report3_Fix.docx.txt) | I.4.4 ma trận quyền; II đặc tả từng UC; III SC; IV NFR; V BR/MSG |
| [Thiết kế chi tiết](git_doc/docs/03_thiet_ke/WMSD_Thiet_ke_he_thong_chi_tiet.md) | mục 5–8 model/trạng thái/transaction/API; mục 11 R-01–26; mục 14 nghiệm thu; phụ lục 111 UC |
| [Thiết kế dữ liệu VI](git_doc/docs/03_thiet_ke/de_xuat_database_design_VI.md) | mục 2 MongoDB; mục 3.4/3.6 A1/B1/C2; mục 4 ràng buộc; mục 6 T01–T56 |
| [DDL tham chiếu](git_doc/docs/03_thiet_ke/WMSD_SQL_schema.sql) | 84 bảng/2 view để đối chiếu; không chạy như migration MongoDB |
| [Report 1](git_doc/docs/01_bao_cao/WMSD_Report1_Fix.docx.txt) | bối cảnh, phạm vi, FE và giới hạn |
| [Report 2](git_doc/docs/01_bao_cao/WMSD_Report2.docx.txt) | Software Configuration Management: nhánh theo việc, peer review, UC/task, kiểm tra trước merge |
| [Hậu kiểm 25/10](git_doc/docs/07_ra_soat/Ket_qua_dong_bo_tai_lieu_2026-10-25.md) | quyết định đã đồng bộ; mục 6 là trạng thái Mermaid mới hơn mục 1–5 |
| [README tài liệu](git_doc/README.md) | chỉ mục và thứ tự tài liệu hiện hành |

Quyền/nghiệp vụ hiện hành ưu tiên quy trình VI **và EN** cùng baseline, đối chiếu Report 3 và thiết kế chi tiết. Cấu trúc/syntax/contract đang chạy lấy từ code thực tế; các API gắn [TK] trong thiết kế là đề xuất. Nếu code lệch nghiệp vụ, ghi nhận độ lệch và sửa đúng phạm vi UC; không biến mock hoặc bug thành quy tắc. Nếu hai nguồn chuẩn thực sự bất đồng ở quyết định chưa chốt, nêu chính xác điểm bất đồng trước khi thực hiện phần phụ thuộc.

Không dùng đề xuất 7 quy trình, tài liệu đánh giá cũ hoặc draw.io snapshot 3.0.0 để khôi phục quyền/luồng cũ. Mermaid hiện hành đã đồng bộ; hình draw.io cũ chỉ tham khảo. Không cần duyệt web để suy đoán lại quyết định của cửa hàng.

### Ranh giới sản phẩm

- SO là bản sao của đơn MISA/giấy tờ/nguồn ngoài; không có live MISA hay API đồng bộ bán hàng. Quyết định 29/10/2026: Sales nhập nguồn và bằng chứng ngay trong form tạo SO, không yêu cầu Accountant tạo/xác minh một hồ sơ nguồn trước. Ghi nhận nguồn không tự điền verifiedBy/verifiedAt như một xác minh kế toán.
- WMSD không tính giá bán/chiết khấu, báo giá, hóa đơn nội bộ/thuế, thu/chuyển tiền, công nợ, hoàn tiền hay kế toán. UC-108 chỉ tham chiếu kết quả ngoài; UC-111 chỉ Sales xác nhận đã nhận đủ tiền bên ngoài.
- Không tự thêm vai trò mua hàng/tài xế/khách/NCC, portal đối tác, ủy quyền động, tài khoản chung, route optimization, native/offline app, AI dự báo hoặc tự đặt PO.
- Chỉ cấu hình hữu hạn như quy đổi/ngưỡng tối thiểu; không mở rộng thành general policy editor. Không mặc định thời hạn trả 7/15/30 ngày, hệ số SKU hay calibre thực tế chưa có chứng cứ.
- Không triển khai UC retired: 23–25, 42, 59–62, 74–78, 106. Giữ ID và lịch sử; không thêm action/permission/API/navigation mới cho chúng.

### Tám quy trình khi thực hiện chức năng

| BF | Chuỗi thực hiện và UC chính |
|---|---|
| BF-01 | RR UC-03 → Owner UC-04 → Accountant PO UC-07 → Warehouse arrival/GR UC-10/26 → put-away UC-32/33; partial/mismatch vẫn giữ nguồn. |
| BF-02 | Warehouse defect/hold UC-65 → Owner disposition UC-66 → Warehouse execute UC-67 ngoài freeze; SR đi BF-08; B1 chỉ UC-92/93. |
| BF-03 | Warehouse TO-RELOCATE UC-36/37 giữa hai vị trí cùng kho; không Owner/TR. |
| BF-04 | Warehouse TR UC-40 → Owner UC-41 → TD draft/picking/handover UC-43 → receiver độc lập MWTR UC-104 → put-away/Owner variance UC-44 → đủ điều kiện toàn TR mới đóng. |
| BF-05 | Owner plan UC-86 → Warehouse freeze/snapshot/count/sheet UC-87/105 → reconcile/recount UC-88 → plan/execution UC-91 → Owner approval UC-92/clear UC-93; B1 giữ khóa tới commit. |
| BF-06 | Sales SO UC-47/48 → WIR UC-109 → OD UC-51 → Warehouse GI draft/picking/PGI UC-54/55/58 → photo POD UC-110 → Sales PAY-CFM UC-111. |
| BF-07 | CR từ khách đã nhận: Sales UC-70 → Warehouse custody/inspection UC-72 → Sales ordinary hoặc Owner exception UC-71 → Warehouse GR-CR UC-73. FD chưa POD: Warehouse UC-72/73 GR-FD → tái mở ròng cùng commit → Sales chọn chờ/giao lại/hủy phần đủ điều kiện. |
| BF-08 | Warehouse SR UC-81 → Accountant agreement UC-107 → Warehouse actual GI-SR UC-82 → Accountant ACK/reconcile UC-107/close UC-83 → external reference UC-108; không Owner/UC-106. |

## 2. Ngôn ngữ nghiệp vụ và quyền

Quyết định 28/10/2026: Mỗi user bắt buộc có đúng một role trong OWNER/SALES/WAREHOUSE/ACCOUNTANT/ADMIN, kể cả tài khoản inactive; một role có thể được gán cho nhiều user. Quyền chỉ lấy từ role hiện tại, không cộng gộp quyền hoặc cho người dùng chọn role hoạt động trong phiên. Phạm vi kho vẫn là nhiều kho được phân công. Đổi role chỉ áp dụng cho yêu cầu tiếp theo, không thay danh tính và quyết định lịch sử.

| Khái niệm | Quy tắc khi code |
|---|---|
| Warehouse / location | Kho vật lý khác receiving/storage/staging/quarantine/custody location trong cùng kho. |
| Product / lot | SKU khác lô; nhận dạng lô gồm product + manufacturer lot + tone + actual calibre. Nominal size không chứng minh calibre. Lô UNKNOWN chưa đủ điều kiện cấp hàng. |
| Quality | PENDING / GOOD / DAMAGED / BLOCKED; không dùng IN_TRANSIT làm quality. Bao bì SEALED/OPENED/TORN/UNKNOWN là chiều độc lập. |
| Ownership / custody | Hàng STORE thuộc tồn sở hữu; hàng khách/NCC giữ hộ theo owner riêng, ngoài owned/available. Quarantine không tự chuyển chủ hàng. |
| On-hand / transit | On-hand STORE gồm receiving/storage/staging/quarantine. Transit theo từng TD line, không đồng thời cộng kho đi/kho đích. |
| Reservation / allocation | Reservation giữ stock cụ thể; allocation liên kết nhu cầu với nguồn, có thể là PO/transfer chưa về. Không coi inbound dự kiến là hàng đang khả dụng. |
| TO | Task nội kho: put-away, picking, relocate, quarantine, unpick. Không phải một cấp Owner approval hoặc lệnh liên kho mới. |
| PGI / POD / PAY-CFM | PGI = thực xuất; POD = khách thực nhận có ảnh; PAY-CFM = Sales xác nhận đủ tiền ngoài sau DELIVERED. Ba mốc độc lập. |
| CR / FD / SR | CR: khách đã nhận rồi trả; FD: đã PGI nhưng chưa POD, hàng giao thất bại thực quay về; SR: trả NCC theo thỏa thuận Accountant xác minh. |
| Snapshot / hold | Snapshot kiểm kê bất biến; hold chặn cấp hàng nhưng không thay quantity/quality/location. |
| Version / operation | Version bảo vệ dữ liệu hiện hành; operation/idempotency key nhận dạng một lần thực hiện, giữ nguyên khi retry. |

| Role lưu BE | Vai trò và giới hạn |
|---|---|
| OWNER | Duyệt RR/TR, xử lý lỗi tại chỗ ngoài freeze, CR ngoại lệ đủ điều kiện, lập/duyệt/chốt kiểm kê. Không duyệt CR thường hoặc SR. |
| SALES | Sao SO, quản lý WIR/OD, quyết định ca CR thường sau Warehouse kiểm, xác nhận đủ tiền ngoài. Không kiểm chất lượng thay Warehouse hay post tồn. |
| WAREHOUSE | Thực hiện vật lý, GR/PGI/TD/MWTR/put-away/picking/kiểm kê/GR-CR/GR-FD và POD tại kho được giao. |
| ACCOUNTANT | PO sau RR duyệt; xác minh thỏa thuận/ACK/đối chiếu/đóng SR; xác minh tham chiếu ngoài. Không post tồn hoặc thay Sales xác nhận UC-111. |
| ADMIN | Quản trị tài khoản/role/operation/kho; không tự có quyền kinh doanh hoặc sửa audit. |

Kiểm quyền = active user + role + operation/sub-operation + warehouse/record/evidence scope + state/version + danh tính thực. Quyền View không suy ra mutate; URL trực tiếp/export/download áp cùng scope. Owner/Accountant hỗ trợ kiểm thực tế không kế thừa quyền GR. Mỗi thao tác lưu actual userId từ session.

Mỗi user có đúng một role; người duyệt Owner khác người đề xuất kể cả sau khi đổi role; người nhận điều chuyển khác dispatcher. Ngoại lệ duy nhất đã chọn C2: Sales được STANDARD_ACCEPTANCE cho chính CR thường mình lập, sau Warehouse inspection. Không dùng quy tắc cấm tự duyệt để vô hiệu C2, cũng không mở C2 sang Owner EXCEPTION_APPROVAL.

Master data: UC-13 Owner; UC-16 Owner create/update, Warehouse create only; UC-19 Accountant create/update, Owner activate/deactivate; UC-22 Sales; UC-29 Owner. UC-99 giới hạn theo nhóm báo cáo, không chỉ một cờ report:read.

## 3. Bất biến cần bảo vệ

### 3.1 Đơn vị, số lượng và tính khả dụng

Gạch dùng PIECE làm base theo thiết kế; model UOM vẫn mở rộng theo Product, không hardcode mọi SKU có cùng hệ số. Lưu enteredQty/enteredUom + conversionId/version + conversionSnapshot + qtyBase trên dòng. Quy đổi BOX/m² bằng thông số đã xác minh; với wholeBaseUnits, kết quả phải nguyên. Không dùng calibre để suy hệ số m². Không tính lại chứng từ cũ khi thay quy cách.

Quantity trao đổi API dùng **decimal string**; BE dùng Decimal128 và decimal.js. Quantity NUMERIC(20,6), factor NUMERIC(24,12) theo model. Không tính nghiệp vụ bằng parseFloat/JS float rồi làm tròn tùy ý. Nếu nhu cầu m² không quy ra số viên hợp lệ, yêu cầu lượng viên/thùng thực thay vì âm thầm làm tròn.

Available chỉ gồm STORE/GOOD, lot VERIFIED, product/warehouse/location active, location STORAGE allocatable, không freeze/hold, trừ ACTIVE reservation một lần. Model DefectHold hiện chọn chặn bảo thủ **toàn balance có ACTIVE hold**; không tự triển khai “balance - holdQty - reserved” nếu chưa có giao dịch tách phần hợp lệ. Picking/relocation phải mang reservation theo hàng; staging không sinh cung tự do mới.

Ví dụ minh họa (không phải dữ liệu SKU thực): 4 viên/thùng, 0,36 m²/viên → 3 thùng + 2 viên = 14 viên = 5,04 m².

### 3.2 Mốc post và ledger

| Sự kiện | Hiệu ứng |
|---|---|
| RR/PO/SO/WIR/OD/draft GI/draft TD/approval/inspection | Không tăng giảm tổng; reservation có thể giảm availability ở command được phép. |
| GR-P | Tăng đúng phần nhận sở hữu theo quality/location; custody tách riêng. Không GR0. |
| Put-away/picking/relocation/unpick/RECLASS | Nguồn -q, đích +q cùng owner/lot; RECLASS đổi quality có kiểm soát; tổng bảo toàn. |
| TD rồi MWTR | TD: nguồn -q/transit +q; MWTR: transit -q/đích +q. Không post GI/GR-P thêm cho cùng lượng. |
| PGI/GI-SR/SCRAP | Giảm đúng lượng thực bàn giao/hủy một lần, đúng owner và nguồn. |
| GR-CR | Nhận sở hữu phần được chấp nhận; chuyển đúng custody, không đếm physical arrival hai lần; không tự tái mở nhu cầu. |
| GR-FD | Tăng đúng thực về theo quality và tái mở nguồn ròng SO/WIR/OD trong cùng commit. |
| POD/PAY-CFM/ACK/closure/print/email/EXT-REF | Không post tồn; ACK/đóng trả NCC không trừ lần nữa. |

Cuối kỳ = đầu kỳ + SUM(ledger delta) trên cùng dimension/cutoff, kể cả OPENING. Không sửa balance trực tiếp để khớp đếm. Chứng từ POSTED/ledger/approval/snapshot/count attempt giữ lịch sử; dùng reversal/correction liên kết hợp lệ, kiểm downstream trước đảo. Không PATCH status chung để đi tắt nghiệp vụ.

### 3.3 Chuỗi SO/WIR/OD, A1 và hoàn thành

```text
Nguồn ngoài được Sales ghi nhận kèm bằng chứng khi tạo SO → SO → WIR (header và line đúng SO) → OD theo một kho
→ GI-S DRAFT trước picking → confirm TO thực soạn → PGI khi bàn giao
→ POD ảnh cùng phiếu → DELIVERED → Sales PAY-CFM → COMPLETED.
```

Một external order/line chỉ được sao một lần vào SO. Một SO nhiều WIR; WIR nhiều OD; một OD có nhiều GI cho các lần bàn giao hợp lệ. Release key của WIR ổn định; không nhân SO/WIR để giao lại.

- Theo từng SO line: tổng cam kết WIR còn hiệu lực (bao gồm thực hiện ròng và phần chưa làm) ≤ ordered - cancelled hợp lệ.
- Theo từng WIR line: tổng cam kết OD còn hiệu lực ≤ WIR allowance. Không cộng cả cha WIR và con OD thành hai nhu cầu.
- Net fulfilment = valid unreversed PGI - valid posted GR-FD. Trần thực hiện OD/WIR dùng lượng ròng; luôn giữ gross ledger.
- Theo **cùng GI-S line**: effective POD + posted GR-FD + OPEN FD claim ≤ valid PGI.
- Theo nguồn khách đã nhận: posted GR-CR + OPEN CR claim ≤ lượng POD đủ điều kiện; lịch sử ngoài chỉ thay POD khi đã được Accountant xác minh.
- Claim chuyển CONSUMED khi post receipt; không cộng CONSUMED và receipt cùng lượng. Claim FD chưa post không tăng tồn và không tái mở nhu cầu.
- GR-FD post + consume claim + demandReopening + net progress/version SO/WIR/OD phải cùng transaction. OD thay thế dùng OdCommitmentTransfer với lượng nguồn/đích/version, không tính lại thành demand thứ hai.
- Sales chỉ hủy phần chưa thực hiện hoặc GR-FD đã về chưa giao lại, sau xử lý task/reservation. Không hủy lượng đang ngoài kho chưa giải quyết.
- DELIVERED cần giao đủ từng dòng nghĩa vụ active và tổng nghĩa vụ >0, có ảnh POD hợp lệ. Giao một phần = PARTIALLY_DELIVERED. Hủy hết lúc giao0 = CANCELLED.
- COMPLETED chỉ sau DELIVERED hiện tại và Sales xác nhận fullPaymentReceived=true, có receipt reference **hoặc** evidence **hoặc** nonempty note. Trả trước/chưa đủ/không rõ tiền không hoàn thành sớm.
- POD/PAY-CFM DRAFT → CONFIRMED; ghi nhầm → VOIDED có lý do, giữ lịch sử, tính lại SO/version; PAY-CFM version cũ không hoàn thành SO đã đổi. CR thường giữ POD/PAY-CFM gốc.

Ví dụ A1: SO10 → PGI10/POD0 → GR-FD10 → PGI mới10/POD mới10: gross xuất20, nhận quay về10, thực hiện ròng10. PGI10/POD7 chỉ FD tối đa3; phần đã POD phải CR riêng.

### 3.4 C2 / D6: ca CR thường và ngoại lệ

CR từ lượng khách đã nhận, không chỉ từ “đã xuất kho”. Warehouse giữ customer custody rồi kiểm thực tế packaging/use/installation/damage cause/deadline/source; lưu assessment append-only theo dòng/version.

- Installed/customer-damaged/verified overdue = INELIGIBLE, Owner không override.
- Điều kiện/thời hạn chưa biết = PENDING; không tự gán còn hạn hoặc deadline30. Deadline đã xác minh phải có deadlineReference.
- CASE_REVIEW là đủ thông tin để xét, **chưa phải accepted**.
- Thường: source/lượng xác minh, GOOD/UNUSED, điều khoản/thời hạn có căn cứ, không tranh chấp/deviation → Sales STANDARD_ACCEPTANCE sau inspection, có thể cùng creator.
- Ngoại lệ đủ điều kiện như lỗi NCC/tranh chấp/thỏa thuận lệch nhưng không thuộc D6 cấm → Owner EXCEPTION_APPROVAL, khác người đề xuất.
- Đổi case kind/inspection/assessment/qty/version cần quyết định mới đúng quyền. GR-CR chỉ nhận phần được quyết định hợp lệ; GOOD chờ put-away, defects vào quarantine, rejected giữ custody đến handback thực.
- FD chưa khách nhận không dùng D6, CR thương mại, customer custody hoặc Owner approval; chỉ GI-S hợp lệ/failure evidence/actual inspection/cap.

### 3.5 B1: kiểm kê khóa phạm vi

Owner PLANNED chưa chụp snapshot/khóa. Warehouse activation kiểm task dở/overlap, chụp immutable snapshot và freeze nguyên tử. Mọi posting quantity/quality/location/ownership/correction trong phạm vi phải cùng scope guard; không backdate để lách khóa. Ngoài phạm vi tiếp tục được làm.

Blank count = chưa đếm; count0 phải có attempt thật. Recount append attempt, không ghi đè. Found stock thêm row found_after_cutoff với book0 trong scope; không sửa snapshot gốc. Tách tổng quantity khỏi quality/location variance.

Phát hiện lỗi dưới freeze ghi DefectHold/evidence ngay, chặn availability nhưng không đổi balance/quality/location. Đủ căn cứ có thể giải trình/lập plan trực tiếp; thiếu căn cứ hoặc chọn recount thì Start Recount → Enter Recount → compare lại, không bắt buộc mọi lệch phải recount.

Warehouse lập ST_RESOLUTION theo current count/plan version, tách DELTA khác0 khỏi RECLASS/RELOCATE bảo toàn tổng. Owner UC-92 duyệt; Warehouse xác nhận actual execution/evidence theo plan đã duyệt; Owner UC-93 post một closure batch. Đổi plan sau duyệt phải review lại, không tận dụng approval cũ.

Book50GOOD/count48GOOD+2broken → RECLASS2, tổng50, không shortage-2 hoặc ADJ0. Count46GOOD+2broken → delta-2 + RECLASS2, tổng48, không shortage-4 rồi hủy thêm2.

Chỉ unlock/resolve hold khi toàn bộ task/line/variance đã xử lý và batch commit thành công. Lỗi rollback giữ freeze; unknown commit tra key trước retry. No-variance closure chỉ khi không lệch quantity/quality/location và không open hold/task. Quality-only vẫn UC-92/93 và RECLASS, không tạo ADJ=0. Không UC-67 ordinary posting xuyên freeze. Không trộn với phương án đếm nhưng vẫn cho giao dịch đồng thời.

### 3.6 BF-08 và điều kiện đóng toàn phần

SR: Warehouse đề xuất đúng nguồn, block defects/reserve GOOD → Accountant xác minh agreement source/qty/version/evidence → Warehouse GI-SR/custody release thực tế → Accountant ACK/reconcile → Accountant UC-83 đóng phần kho. Không Owner dispatch/variance/closure, không UC-106, không lấy BF-02 approval lịch sử làm gate.

ACK khác agreement trước xuất; ACK không sửa GI đã post. Dispute/missing/refused còn mở; hàng trả về chỉ tăng bằng actual receipt/inspection. Invoice/Credit Note UC-108 theo type/number/date/source line/reconciledQty/evidence/status; NOT_RECORDED/PENDING_EXTERNAL/RECORDED_EXTERNAL độc lập hoàn tất kho. Tiền/thỏa thuận thay hàng không tạo stock.

TR chỉ đóng khi nhu cầu chưa xuất đã fulfil/hủy hợp lệ, toàn dispatched quantity được giải trình, transit/variance hết và TO xác nhận hoặc hủy phần chưa thực hiện có truy vết. TR100/TD60 nhận đủ60 vẫn còn unissued40, không tự đóng. TD100/MWTR95GOOD+3DAMAGED → đích98 và transit2, không nhận95 rồi coi thiếu5.

### 3.7 Catalogue BR-01–33 để đối chiếu khi sửa UC

Trích bảng hiện hành ở quy trình VI mục 8.1; phần giải thích triển khai nằm ở mục 3.1–3.6 và thẻ UC. DR/GB chỉ là alias lịch sử.

| BR | Quy tắc chuẩn | Truy vết |
|---|---|---|
| BR-01 | Lot identity phải phân biệt product/lot/tone/calibre; không gộp hàng khác tone để đủ lượng. | DR-01, UC-13/16/26/30/54/55/72 |
| BR-02 | Quy đổi theo sản phẩm và phiên bản đóng gói; chốt hệ số ở dòng chứng từ. Với gạch nguyên viên, không tạo số viên phân số. Dùng diện tích theo quy cách sản phẩm; calibre là thuộc tính tương thích, không tự thay hệ số m². | DR-02, GB-03 |
| BR-03 | Sau lưu SO/chốt kiểm kê, hệ thống đánh giá nguồn và hỏi/cảnh báo nếu còn thiếu. User mở form điền sẵn; chỉ Lưu nháp/Gửi duyệt hợp lệ mới ghi RR có source/snapshot/lý do. Owner khác người gửi duyệt; không tự tạo PO. | UC-03/04/13/47/48/93/103 |
| BR-04 | Không tính trùng nhu cầu đã có PO/điều chuyển/phân bổ; lượng dự kiến về chưa phải khả dụng hiện tại. | BF-01/04/06 |
| BR-05 | Cấm tự duyệt RR/TR, ngoại lệ CR, hủy/đổi phẩm cấp và phương án kiểm kê theo userId. Sales được chấp nhận CR thông thường mình lập sau Warehouse kiểm, theo C2; không tự duyệt ngoại lệ hoặc cấp quyền Owner. BF-08 không có approval Owner. | UC-04/41/66/71/92 |
| BR-06 | Receipt/issue/return/adjustment chỉ post một lần, nguyên tử cùng ledger và balance. Không âm tồn khả dụng; retry trả lại kết quả cũ. | DR-09/10/13, GB-09/10/13 |
| BR-07 | Nhận hàng phân tách thực giao, nhận vào tồn, giữ hộ, từ chối; chưa kiểm hoặc chưa sẵn sàng vị trí thì không khả dụng. | DR-04, GB-04, UC-26/33/73 |
| BR-08 | PO nhận nhiều đợt; phần đã ghi nhận bất biến. Chốt thiếu hoặc sửa vượt duyệt có lý do và quyết định phù hợp. | DR-03, GB-05, UC-07/10/26 |
| BR-09 | Chuyển vị trí cùng kho không đổi tổng, lot, chất lượng; không cần Owner duyệt. Bảo toàn liên kết giữ hàng. | DR-06, GB-06, UC-36/37 |
| BR-10 | TR duyệt → TD nháp trước Picking → xác nhận thực hiện → post TD/HO khi bàn giao → MWTR → xác nhận TO put-away. Không thêm Owner duyệt TO hoặc GI thứ hai cho cùng TD. | UC-41/43/104 |
| BR-11 | Tổng TD đã post không vượt TR được duyệt sau hủy. Đã xuất = nhận hợp lệ + transit/chưa giải quyết + kết quả khác có chứng từ. TR chỉ đóng khi yêu cầu hết phần còn phải làm, mọi lượng xuất đã đối chiếu và TO liên quan đã xử lý; khớp một đợt chưa đủ. | UC-43/44/104 |
| BR-12 | Người kho nhận xác nhận độc lập người xuất theo phương án nhân sự đã chốt; không một confirm cập nhật cả hai đầu. | UC-43/104, permissions |
| BR-13 | Chọn nguồn theo tương thích lot/tone/calibre trước, FIFO trong tập hợp đó sau. Ghi lý do/chấp thuận khi ngoại lệ; không dùng LIFO làm mặc định nếu chưa khảo sát. | UC-54/55/103 |
| BR-14 | SO/WIR/GI nháp không đổi tồn; TO Picking chỉ đổi vị trí; PGI giảm thực bàn giao một lần. GR-FD tăng lượng thực nhận và tái mở ròng đúng nguồn; POD/PAY-CFM không đổi tồn. Không sửa ledger để giấu giao lại. | UC-47/109/55/58/73/110/111 |
| BR-15 | Thiếu/hỏng khi soạn phải chặn lượng ảnh hưởng, ghi bằng chứng, phân bổ lại hoặc chờ; không tự chỉnh balance. | BF-02/05/06 |
| BR-16 | CR thông thường lấy trần khách đã nhận (POD/nguồn lịch sử xác minh) trừ lượng trả/đang giữ chỗ; FD dùng phần PGI chưa POD, chưa GR-FD hoặc giữ chỗ FD. Kiểm trần nguyên tử chung nguồn; một lượng không thuộc cả hai nhánh. | UC-70/72/73/108/110 |
| BR-17 | Sales chấp nhận/từ chối CR thông thường sau Warehouse kiểm, có thể là người lập; Owner chỉ duyệt ngoại lệ đủ điều kiện. Warehouse post GR-CR theo quyết định đúng loại/version. FD không cần chấp nhận thương mại hoặc Owner approval. | UC-70–73 |
| BR-18 | CR phân từng lượng: đạt/cách ly/custody-từ chối; giữ POD/GI/hóa đơn gốc. FD theo GI và bằng chứng thất bại, không ghi custody khách, không tự hoàn tiền; chỉ post GR-FD một lần và mở lại ròng cùng commit. | UC-73/108/109 |
| BR-19 | Chặn lượng lỗi ngay; ngoài kiểm kê hủy/đổi phẩm cấp/giải phóng cần Owner. B1 giữ hold đến batch UC-93. Trả NCC theo BF-08 không Owner approval, chỉ GI-SR giảm tồn; không giảm tại BF-02 rồi giảm lại. | UC-65/66/67/82/93 |
| BR-20 | Trả NCC cần thỏa thuận đúng nguồn/lượng do Accountant xác minh, Warehouse xác nhận thực xuất; không Owner approval, UC-106 retired. Accountant đối chiếu/đóng UC-83/107 khi mọi lượng có kết quả; tài chính UC-108 độc lập. Custody không giảm owned. | UC-82/83/107/108 |
| BR-21 | Snapshot bất biến tại kích hoạt; xuất danh sách kiểm kê; lưu thời gian và phạm vi. Không lấy tồn hiện tại để thay số snapshot. | DR-08, GB-08, UC-87/105 |
| BR-22 | Khóa giao dịch thường trong kiểm kê; defect hold/evidence không đổi balance được ghi ngay. B1 chỉ batch chốt đã duyệt post delta/RECLASS/vị trí; giữ khóa/hold đến hoàn tất. Chưa đếm khác 0; lưu recount. | UC-87/88/92/93 |
| BR-23 | Chênh đủ căn cứ có thể lập phương án trực tiếp hoặc recount nếu chưa rõ. Warehouse đề xuất, Owner duyệt/post đúng version. Batch delta thực tế + RECLASS bảo toàn tổng không ghi giảm hai lần; quality-only không ADJ=0. | UC-88/91/92/93 |
| BR-24 | Chứng từ đã post không sửa/xóa để xóa dấu vết. Sai sót cần đảo/điều chỉnh liên kết có thẩm quyền. Master inactive giữ nguyên lịch sử. | DR-14, GB-02/13, UC-97/100–102 |
| BR-25 | Outbox sau commit sinh Notification đúng recipient/scope; đọc không đóng cảnh báo, mở tính lại; retry không post tồn hoặc tự tạo RR. | UC-03/47/48/93/103 |
| BR-26 | Không suy ra tình trạng đã giao khách (DELIVERED) chỉ từ PGI/bàn giao cho nhà vận chuyển, và không suy ra hoàn thành đơn bán (COMPLETED) chỉ từ đã giao hàng; không suy ra hoàn tiền từ phiếu nhập trả; không suy ra tăng tồn từ NCC đồng ý đổi hàng. | BF-06/07/08, UC-58/110/111 |
| BR-27 | Chỉ các vai trò được phép xem chứng cứ mới lấy được tệp; URL không mặc định công khai. | API-02 lưu chứng cứ, GB-NEW-02 |
| BR-28 | Có source system, source document/line, version và correlation ID để chống nhập/ghi nhận trùng giữa WMS và hồ sơ MISA trên SO, WIR, OD, GI-S, `CR` và `EXT-REF`. | UC-47/109/51/58/70/108 |
| BR-29 | CR: nguyên thùng/viên chưa dùng xét từng ca; không nhận đã thi công/hỏng do khách/quá hạn xác minh, chưa rõ thì chờ. C2 Sales quyết định ca đạt thông thường; Owner chỉ ngoại lệ đủ căn cứ, không vượt điều cấm. D6 không áp cho FD chưa khách nhận. | BF-07, UC-70–73 |
| BR-30 | Bao bì rách/thùng mở không tự đồng nghĩa gạch hỏng. Ghi số viên thực tế; phân loại chất lượng sau kiểm tra. Hệ số thùng/viên/m² theo sản phẩm và phiên bản, không suy từ calibre. | D7, BF-01/05/06/07, UC-13/26/55/72/87 |
| BR-31 | SO nguồn xác minh, WIR/OD liên kết dòng; cam kết không vượt SO sau hủy. Trần thực hiện dùng PGI hợp lệ trừ GR-FD đã post; giao lại dùng phần tái mở trên SO/WIR cũ, không cộng OD thay thế thành nhu cầu mới. | UC-45–48/51/58/73/109 |
| BR-32 | POD cần GI-S POSTED, người/thời điểm/lượng/ảnh. POD hiệu lực + GR-FD đã post + FD giữ chỗ ≤ PGI hợp lệ mỗi dòng. Chỉ DELIVERED nếu phần active > 0 đã giao đủ; hủy toàn bộ giao 0 → CANCELLED. | UC-58/73/110 |
| BR-33 | Chỉ Sales xác nhận nhận đủ tiền ngoài hệ thống sau DELIVERED để chuyển SO sang COMPLETED. Chưa đủ tiền hoặc trả trước khi chưa giao đủ không làm hoàn thành đơn. POD/PAY-CFM không đổi tồn; đính chính phải giữ lịch sử và tính lại tiến độ đơn. | BF-06, UC-48/110/111/108 |

### 3.6 Bổ sung hàng và Notification — quyết định 3.3.0 (27/10/2026)

Nguồn quyết định đã được người dùng yêu cầu áp dụng: [đề xuất 1.4.0](git_doc/docs/03_thiet_ke/De_xuat_bo_sung_hang_theo_nguon_2026-10-27.md). Các quy tắc mới thay phần thiếu nguồn SO trực tiếp/thông báo của baseline 3.1.0; giữ 8 BF, 5 role, 111 UC (97 active/14 retired). Model/seed đã hỗ trợ cấu trúc mới; chưa có route/consumer/UI thật cho luồng này.

- Sau lưu SO hoặc chốt kiểm kê đã commit/unlock, tính coverage và cảnh báo. Thiếu bán dùng SO line đã lưu, WIR chỉ tùy chọn; kiểm stock các kho/PO đúng product/tone/calibre và hạn, chưa dành cho nhu cầu khác. Resolve allocation WIR về cùng SO line, không đếm hai lần.
- User bấm Tạo yêu cầu để mở form điền sẵn; được chỉnh lượng/ngày/lý do, thêm dòng có nguồn hoặc lý do riêng, rồi Lưu nháp/Gửi duyệt. Mở/hủy form hoặc Để sau chưa tạo RR. Owner chốt chỉ kích hoạt đánh giá; Sales/Warehouse tạo/gửi, Owner khác người gửi duyệt.
- ProductWarehousePolicy có targetQty >= minimumQty >=0, target mặc định minimum, version và updatedBy. Tồn thấp là available < minimum, xét toàn sản phẩm/kho gồm0; scope còn freeze phải hoãn. Trừ pending RR/cung đúng một lần; tách dự trữ khỏi thiếu bán.
- REPLENISHMENT header có creationKey, submittedBy/submittedAt theo cặp; creationKey unique theo createdBy, payloadHash ở BusinessOperation. Dòng REPLENISHMENT có triggerType, SO-line/version hoặc stocktake/version/policy/version, evaluationKey/evaluatedAt, coverage snapshots, suggestedQty, reasonNote; chỉnh lượng phải có quantityAdjustmentReason. Số vượt thiếu bán tách lý do khác.
- DocumentLink/LineLink dùng REPLENISHES_SALES_ORDER, REPLENISHES_DEMAND, RELATED_ISSUE_REQUEST, STOCKTAKE_REPLENISHMENT, REPLENISHMENT_PURCHASE. ReplenishmentPlanningGuard unique kho/sản phẩm lưu version; mọi command tác động coverage cần conditional-write protocol chung, schema đơn lẻ chưa chống race.
- Outbox STOCKTAKE_CLOSED/SALES_ORDER_SAVED lưu documentVersion cùng transaction nguồn; consumer sau commit đánh giá và lưu Notification, không tạo RR. Notification có recipient/type/title/message/warehouse/sourceDocumentId/sourceDocumentVersion/eventKey/evaluatedAt/readAt/dedupKey; retry không tạo trùng hay reset readAt. Warehouse active đúng kho nhận thông báo tổng hợp; SO chỉ báo người có quyền nguồn.
- List, unread count và mở nguồn đều kiểm recipient + quyền nguồn/kho hiện hành. Đã đọc không phải đã giải quyết thiếu hàng; khi mở cảnh báo/tạo RR tính lại dữ liệu. Để sau không tạo pending coverage/ẩn cảnh báo. MVP không có StockAlert; chưa hỗ trợ assignment/snooze/dismissal lifecycle.
- Contract [TK]: POST /api/replenishments/evaluate, POST /api/replenishments, GET /api/notifications, GET /api/notifications/unread-count, POST /api/notifications/:id/read. Envelope theo data hiện có, ObjectId/decimal strings/UTC ISO. Quyền evaluate + notification:read/mark_read chỉ OWNER/WAREHOUSE/SALES theo scope; Owner không được create RR chỉ vì có evaluate, ADMIN không bypass.
- Seed có39 collections/35 document kinds/19 line kinds; có RR lưu từ form kiểm kê, RR SO chưa WIR có thêm dòng dự trữ riêng, SO chưa có nguồn đúng tone chưa tạo RR và hai recipient readAt độc lập. DB đã có dữ liệu không bị seed lại; SQL tham chiếu84 bảng/2 view.


**Form tạo RR thống nhất (đề xuất 1.4.0 được chấp thuận, baseline 3.3.0):** Người dùng chọn dòng cảnh báo và bấm Tạo yêu cầu, hoặc mở từ menu rồi chọn nguồn/nhu cầu khác. Form điền sẵn sản phẩm, kho, lượng gợi ý, lý do và refs có căn cứ. Sửa lượng/ngày cần/lý do; dòng nguồn giữ sản phẩm/kho/refs. Đổi ngữ cảnh phải chọn lại và tính lại. Một RR một kho/ngày cần; khác nhóm tạo phiếu riêng sau review.

- Mở/hủy form hoặc chọn Để sau không lưu RR, links hay pending coverage. Lưu nháp mới ghi DRAFT; Gửi duyệt kiểm dữ liệu rồi ghi SUBMITTED theo quyền. Nháp đã lưu được cập nhật cùng ID/version. Owner khác người gửi duyệt; Accountant lập PO sau duyệt.
- Sau lưu SO thành công, xét các kho, nguồn về đúng hạn/tương thích và RR đã có. Còn thiếu thì hỏi “Đơn đã lưu; còn thiếu lượng chưa có nguồn phù hợp đúng hạn. Bạn có muốn tạo yêu cầu bổ sung?” Người dùng chọn dòng rồi mở form. Áp dụng cho cả không có nguồn và chỉ đủ một phần; đủ RR/nguồn thì dẫn tới phương án đang có. Có phương án kho khác chưa chọn phải hiển thị trước, không kết luận không có nguồn.
- Đánh giá lỗi/chậm hiển thị chưa kiểm tra được/đang kiểm tra, không coi nguồn bằng0 hoặc làm SO lưu thất bại. Hộp thoại theo lần lưu có thay đổi nhu cầu; refresh/retry/sửa ghi chú không liên quan không tự lặp. Cảnh báo và nút tạo vẫn có trên chi tiết SO.
- Được thêm sản phẩm ngoài cảnh báo. Dòng thêm chọn nguồn đúng của chính nó hoặc MANUAL_OTHER kèm lý do; sản phẩm ngoài SO không gắn giả vào SO line ban đầu. Cùng sản phẩm khác nguồn/lý do có thể tách dòng; trùng đúng cùng nguồn cần gộp/sửa.
- Khi lưu/gửi, BE kiểm lại source/version/coverage và trả số cũ–mới nếu thay đổi. Giữ nội dung người dùng nhập; chỉ lưu sau khi xác nhận dữ liệu hợp lệ. Nguồn hủy/hết quyền/hết nhu cầu phải sửa/xóa dòng; không âm thầm thay lượng hoặc đổi loại lý do. Phần vượt thiếu bán phải tách nhu cầu khác.
- Contract tạo dùng action SAVE_DRAFT/SUBMIT, creationKey, kho/ngày/lý do và source từng dòng; không có trường phân loại cách tạo. Quyền, Notification/readAt, guard và payloadHash giữ nguyên mục đích; mở form/đọc thông báo không ghi tồn. Ngày cần sau kiểm kê không có căn cứ thì để người dùng chọn.


## 4. Trạng thái và lỗi dùng chung

| Đối tượng | Chuyển trạng thái chuẩn |
|---|---|
| RR/TR/ADJ proposal | DRAFT → SUBMITTED → APPROVED/REJECTED/REVISION_REQUIRED, đúng version. |
| CR | Cùng các trạng thái proposal nhưng APPROVED bắt buộc decision kind/role/version/inspection đúng; không chỉ boolean approved. |
| SO | DRAFT → OPEN → IN_PROGRESS/PARTIALLY_DELIVERED → DELIVERED → COMPLETED; CANCELLED theo lượng; GR-FD tính lại và tăng version. |
| PO/WIR/TR execution | OPEN → PARTIAL → COMPLETED; WIR/OD có thể tái mở đúng GR-FD. |
| GR/TD/MWTR/GI/SCRAP/RECLASS | DRAFT → POSTED; chỉnh sai bằng linked correction/reversal. |
| POD/PAY-CFM | DRAFT → CONFIRMED → VOIDED nếu đính chính; không dùng PARTIALLY_DELIVERED làm POD status. |
| TO | OPEN → PARTIAL → CONFIRMED; cancel unexecuted remainder có lý do. |
| SR | DRAFT → AGREEMENT_PENDING → READY → PARTIAL/COMPLETED. |
| FD | OPEN → INSPECTED → PARTIAL/RECEIVED → CLOSED theo lượng. |
| Stocktake | PLANNED → FROZEN → COUNTED → RECONCILING → APPROVED → POSTED/CLOSED; direct CLOSED chỉ no variance/hold/task. |

Các enum workflow ngoài SO/confirmation còn mở trong schema **không có nghĩa được chuyển tùy ý**. Service kiểm transition và tính header từ line/confirmation còn hiệu lực.

| Nhánh chung | Hành vi phải có |
|---|---|
| EX-01 | Sai role/scope/user independence: từ chối, không lộ record/evidence, không mutate. |
| EX-02 | Version/source race: rollback cả batch, refresh nguồn và review lượng còn lại. |
| EX-03 | Unknown commit: lookup operation; có kết quả trả lại; chưa commit mới retry cùng key/payload; đổi payload conflict. |
| EX-04 | Freeze: chặn ordinary posting/backdate; hold/evidence balance-neutral vẫn được ghi; chỉ approved B1 closure được post có kiểm soát. |
| EX-05 | Thiếu evidence bắt buộc: giữ draft/chặn confirm. Print/email lỗi sau commit: retry output/outbox, không post lại. |

MSG catalogue: 01 empty; 02 field validation/giữ draft; 03 vượt source/transit/available; 04 unauthorized; 05 version conflict; 06 trả kết quả đã commit; 07 notification pending; 08 separation/C2; 09 freeze; 10 lot identity; 11 D6; 12 unverified/duplicate source; 13 agreement/reconciliation SR; 14 key khác payload; 15 missing evidence; 16 GI/photo/POD cap; 17 thiếu điều kiện completion. Đây là mã nghiệp vụ từ Report 3, không khẳng định API hiện trả trường code.

Upload evidence hoàn tất trước transaction xác nhận; ảnh phải thuộc đúng parent/line/POD, đúng quyền, là image thật đã lưu thành công. URL không rỗng chưa đủ. Không gọi storage/SMTP trong DB transaction. Outbox gửi SMTP sau commit, retry độc lập; không hứa exactly-once thư đến khi timeout không rõ kết quả. Không tự thêm job tạo phiên kiểm kê tháng hoặc tự mua hàng.

## 5. Hướng dẫn code BACKEND theo checkout hiện tại

### 5.1 Stack, cấu trúc, syntax

Snapshot 26/10/2026: BE HEAD 9a9bd6b, repo building-material-management, branch main. Node ESM JavaScript (type:module), Express5, Mongoose9/MongoDB, Zod4, bcryptjs/JWT, decimal.js, Multer/Cloudinary; npm/package-lock.json; node:test. Không tự chuyển TypeScript/ORM/SQL Server hoặc tạo 82 collection từ DDL.

```text
src/index.js                       dotenv, connect DB, runSeeds tùy cấu hình, listen
src/app.js                         cors/json/cookie/morgan, mount /api, error handler
src/routes.js                      mount health/auth/upload/users/roles hiện có
src/config/                        database, cloudinary, jwt, cookie
src/middlewares/                   auth/permission/validate/upload/errorHandler
src/models/                        shared schemas, constants, model-utils, index, README
src/modules/<resource>/
  <resource>.routes.js             route/middleware/schema/controller
  <resource>.controller.js         catchAsync, gọi service, formatApiResponse
  <resource>.validation.js         Zod {body,query,params}
  <resource>.service.js            use-case logic, authorization scope, persistence
src/seeds/                         catalogue permissions, roles, demo users/warehouses, run CLI
src/shared/utils/                  ApiError, ApiResponse, catchAsync
test/                             models/unit/integration tests
```

Tạo module theo pattern trên khi UC chưa có; tên singular file như user/role, resource route số nhiều theo semantics đã thống nhất. Controller mỏng, transaction/domain calculation ở service; helpers chung chỉ tách khi có dùng thật. Repository/transaction/outbox layer trong thiết kế là **phần cần bổ sung**, không giả đã có service post tồn dùng chung.

- Dùng import/export ESM, import relative có .js; không require/CommonJS hoặc alias TS mới. const mặc định, async/await cho I/O, camelCase field/function, PascalCase model/class, constants enum UPPERCASE.
- Code hiện 2-space indentation/semicolon, trộn single/double quote. Theo file/module đang sửa, không format lại toàn repo. Không thêm lint framework chỉ để viết một UC (BE chưa có lint/build script).
- Model import qua src/models/index.js; không định nghĩa lại cùng collection/model trong module. Reuse model-utils helpers options/ref/refs/decimal/rules/appendOnly và constants.
- Validate {body,query,params} tại route bằng validate(schema). Whitelist payload, reject operator injection/invalid ObjectId/enums/quantity/date range; không truyền req.body vào update operator tùy ý. Pagination/sort phải bounded/allowlisted ở service/validation, không copy Number() không kiểm NaN từ legacy.
- Catch qua catchAsync/ApiError, success qua formatApiResponse. Không trả raw passwordHash/token refresh/secret/internal stack trong DTO. Error code/fieldErrors/correlationId trong thiết kế cần mở rộng contract có kiểm soát, không nói đã tồn tại.
- Business actions cần actual user/context vào service, không theo mẫu master service chỉ nhận req.body mà thiếu actor/scope. State/actor/approvedQty/ledger values không lấy client làm thẩm quyền.

### 5.2 Hợp đồng API ĐANG CÓ và phần ĐỀ XUẤT

Runtime mount **/api**, không /api/v1. Có:

| Endpoint thực | Contract |
|---|---|
| GET /api/health | Kiểm tra service. |
| POST /api/auth/login | Username/password; data={accessToken,user}; set refresh_token HttpOnly cookie. |
| GET /api/auth/me | Active user/roles/permissions. |
| POST /api/auth/refresh | Cookie refresh; access token và user mới. |
| GET/POST /api/users, GET/PUT /api/users/:id, PATCH /api/users/:id/status | Account module; list data={items,total,page,limit}. |
| GET /api/roles, PUT /api/roles/:code/permissions | Catalogue/ma trận role hiện tại. |
| POST /api/upload | multipart field file, image/*, memory5MB; trả url/publicId/format/width/height. |

Success hiện {success:true,message,data?,meta?}; lỗi {success:false,message,stack?} (stack chỉ development). Không hứa field code/fieldErrors/correlationId đã có.

API /sessions, /accounts, /sales-orders, /goods-receipts, /stocktake-resolutions... ở thiết kế mục 8 prefix /api/v1 đều là [TK], **chưa mount**. Khi xây module dùng semantics của thiết kế nhưng thống nhất prefix/envelope với FE; không đổi silently endpoint auth/users/roles đang dùng. GET không mutate; command riêng create/submit/review/confirm/post/void/cancel thay PATCH status tùy ý. Dữ liệu trả ID ObjectId string, quantity/factor decimal string, status/version/operationId và postingId chỉ khi có stock posting. DTO serialize Decimal128 rõ ràng, không trả object $numberDecimal chưa mapping.

BE fallback port code3000; README nói3333 và Vite proxy3333. Cấu hình PORT3333 khi chạy cặp local hoặc đổi cặp config thống nhất, không thay theo README mà bỏ qua index.js.

### 5.3 Auth/permission: nền có sẵn nhưng có lỗi cần biết

authenticate kiểm Bearer hoặc claim_access_token cookie, jwt.verify rồi load User active/populate roleId→permissionIds. authorize kiểm role.code case-insensitive. Luôn gọi authenticate trước authorize/permission; dùng userId thật từ req.user. Role catalogue/roleCode chuẩn uppercase; login/refresh/me/users thống nhất role lowercase và alias roles=[role], primaryRole=role. Thiếu role hợp lệ bị từ chối, không fallback admin.

Permission catalogue thực ở src/seeds/data/permissions.data.js, dạng resource:action, map UC và role mặc định. Đây là lớp role+operation; service vẫn phải kiểm assigned warehouse/source/identity/approval version/caps. roleId là ObjectId đơn bắt buộc; warehouseIds vẫn là mảng, không dùng roleIds hoặc User.role cũ. Không tin JWT permission snapshot thay kiểm active/current quyền phía server cho command nhạy cảm.

**Các độ lệch xác minh bằng đọc code; context này chỉ ghi nhận, chưa sửa:**

1. middlewares/permission.js hiện đã sửa các lỗi user-before-declaration/requiredRoles.map/permission.push ghi trong snapshot cũ; xử lý role/permission ref bị thiếu và không log permission list. Không suy middleware operation thay được record/warehouse scope.
2. users/roles routes còn allow OWNER ở outer authorize và một số read gate khác baseline UC-95–98 Admin-only. role.service tự tạo Permission khi gặp code lạ; cần whitelist catalogue/role-operation compatibility và audit, cấm retired/arbitrary quyền. Giao diện hay seed không thay kiểm server.
3. users API chưa có luồng gán warehouseIds đầy đủ dù User model đã có; roleCode gán/thay đúng một roleId. Cần thiết kế assignment đúng UC-98 trước enforce multi-warehouse, không dùng kho demo làm assignment thật.
4. upload route hiện chưa authenticate/parent scope và trả Cloudinary secure_url; middleware chỉ kiểm MIME khai báo image/*, giới hạn5MB kỹ thuật. Chưa đạt private Evidence/hash/ownership/authorized download của API-02/POD. Mức5MB có trong implementation, không phải cửa hàng đã chốt mọi hạn mức.
5. JWT có secret fallback hardcode và refresh helper hiện chỉ ký/verify, chưa thấy rotation/reuse detection/revocation hoặc logout endpoint. Không đưa fallback vào cấu hình triển khai hoặc khẳng định comment FE đã đúng. CORS origin:true/cookie strict cần kiểm cùng deployment khi làm auth, không suy là kiểm soát production hoàn tất.

Không tự sửa tất cả lỗi trong task một UC; nhưng không xây tiếp phụ thuộc lên phần lỗi rồi báo hoàn tất. Nêu/sửa prerequisite trong scope công việc được giao và kiểm behavior thực.

### 5.4 Mô hình dữ liệu và persistence contract thực

Đọc src/models/README.md trước viết nghiệp vụ. 84 bảng SQL tham chiếu đã có representation trên **39 collections**, **35 document discriminators**, **19 line discriminators**; schema/index không thay transaction/service hoặc FK.

| Nhóm | Model/file và lưu ý |
|---|---|
| Account/master | access,user,warehouse,party,product.model.js; User.roleId đơn/warehouseIds mảng; STORE Party singleton. |
| Document | BusinessDocument trong business_documents, discriminator documentKind, typed header; DocumentLine collection riêng, lineKind và typed details. Parent ID là documentId, không lặp subtype ID vào details. |
| Links/source | DocumentLink/LineLink, ExternalReference/ExternalReferenceLine; source order/line/release unique. |
| Stock | StockAccount, StockBalance, PostingBatch, StockMovement, Reservation, DemandSupplyAllocation trong inventory.model.js. |
| Approval/evidence | Approval/lines, Evidence object key/hash/MIME/uploader/parent. |
| Non-stock ops | BusinessOperation, SalesOrderCancellation; stable keys/hash/source version, append-only facts. |
| Return/A1 | CustomerReturnAssessment, ReturnSourceClaim, DemandReopening, OdCommitmentTransfer trong return.model.js; header/line FD/GR-FD discriminator. |
| B1 | LocationLock, StocktakeSnapshot, CountAttempt, DefectHold; ST_RESOLUTION header/line; selected count/plan/approval/execution/closureBatch. |
| Events | AuditEvent append-only, OutboxEvent có retry state; inventory_ledger/available_stock là aggregation/service chưa triển khai, không collection mới. |

Không sửa dùng tên collection dự kiến trong tài liệu để thay cấu trúc đã có. Constructor BusinessDocument/DocumentLine chọn discriminator theo documentKind/lineKind; không tự dùng Mongoose discriminate một lần nữa. Base schemas strict:throw, timestamps UTC Date, explicit version (versionKey:false). Query update/raw collection/bulk có thể bypass validate/appendOnly; không dựa unique:true như validator hoặc refs như FK.

StockAccount vật lý XOR transitDispatchLineId; StockBalance identity accountId+lotId+qualityCode+ownerPartyId. Dimension không thay sau có lịch sử. Partial unique index cho optional refs/null; ProductUomVersion/Approval/Evidence/PostingBatch/StockMovement/Snapshot/CountAttempt/Audit/BusinessOperation/cancellation/assessment/reopening/commitment transfer giữ append-only. Claim status và hold status mutable nhưng source facts bất biến. Posted document/line immutability còn cần service vì base schema cho workflow rộng.

Số lượng: dùng decimal string/Decimal128, model-utils exact/ExactDecimal precision80; quantity scale6/precision20, conversion scale12/precision24. ADJUSTMENT.details.deltaQty có dấu khác0, qtyBase=abs(delta); ST resolution DELTA có endpoint đúng dấu, RECLASS/RELOCATE hai endpoint khác nhau không deltaQty. wholeBaseUnits là kiểm service theo Product.

A1: DemandReopening.receiptLineId unique; OdCommitmentTransfer.reopeningReceiptLineId trỏ **DocumentLine**, join theo receiptLineId, không DemandReopening._id. POD line cần salesIssueLineId/photoEvidenceId, kiểm parent ảnh thật ở service. PAY-CFM unique SO/deliveredOrderVersion và operationId; VOIDED không xóa uniqueness, xác nhận lại dùng new version/operation.

### 5.5 Protocol cho command và cạnh tranh

Không có posting engine hoàn chỉnh trong checkout. Khi thêm, dùng **một protocol dùng chung** cho mọi flow có stock effect:

1. Authenticate/operation/scope; resolve trusted actor, document/line chain. Upload evidence trước transaction, không chờ kiểm hàng/gọi SMTP trong transaction.
2. Tra operationKey/idempotencyKey, canonical payloadHash SHA-256 gồm source IDs/version/qty/action. Cùng key/hash trả kết quả commit trước; cùng key khác hash conflict; không tạo key mới vì timeout.
3. MongoDB session.withTransaction trên replica set/sharded cluster hỗ trợ transaction. Đọc current version/approval/source/hold/freeze trong transaction; **conditional write trên shared guard** để cạnh tranh thực sự, không chỉ read SUM snapshot.
4. Mọi activation/ordinary posting/closure cùng scope/location guard; POD/FD/CR cùng GI-line guard; SO/PAY-CFM cùng current SO guard. Version/filter/đủ lượng và unique dimension chống oversell/write skew. Định nghĩa shared guards/index khi triển khai; không giả chúng đã tồn tại như service.
5. Recheck product/lot/UOM/kho/owner/sourceKind/same-chain; trần còn lại sau cancellation/reversal/reservation/claim; decision kind/actor/version/approvedQty; task/execution/evidence. Giữ lock-order/ID-order thống nhất.
6. Trong cùng session: batch + đủ movement legs/before-after + conditional balance changes + reservations/allocations + document/line status/version + audit + outbox. Một line lỗi rollback tất cả. Không dùng Promise.all thao tác song song trên cùng MongoDB transaction/session.
7. GR-FD thêm consume claim/demandReopening/net SO-WIR-OD/version trong commit đó. UC-93 thêm plan/count/approval/execution check, delta/RECLASS, resolve hold và unlock chỉ khi hoàn tất.
8. Retry transient write conflict đúng MongoDB semantics, giữ identity. UnknownTransactionCommitResult tra batch/operation theo key trước quyết định retry; không post receipt lần hai hoặc tự unlock.
9. Sau commit: authorized DTO/print từ committed snapshot, outbox notification retry riêng.

SO/WIR/cancellation/POD/PAY-CFM dùng BusinessOperation, không tạo stock batch cho “cho có”. POD/PAY-CFM transaction lưu confirmation + SO progress/version + audit/outbox; không thay balance/reservation. Cancellation có thể release reservation có kiểm soát. GR-FD có posting batch vì thực nhận stock; claim chỉ giữ nguồn, không stock reservation.

Reversal cần kiểm POD/claim/GR/fulfilled reopening/redelivery/tasks và trạng thái kho; không đảo gốc để làm nguồn âm. Receipt quality split, supplier custody, partial receipt/outstanding và repeated TO confirmations dùng line identity/operation riêng, không chỉ header totals.

### 5.6 Seeds, môi trường, migration và test

`npm run migrate:replenishment` xem trước nâng cấp database đã có dữ liệu; thêm `-- --apply` để sao lưu BSON Extended JSON ngoài Git tại `~/.codex/backups/`, tạo index bổ sung và cập nhật data/quyền trong transaction. Script tại `src/migrations/` không seed lại, không drop index, giữ IDs/version/stock/approvals và chỉ bổ sung ba quyền mới cho role phù hợp. Policy thiếu target/version dùng minimum/1; RR cũ thiếu snapshot nguồn được chuyển thành dòng REPLENISHMENT/MANUAL_OTHER với lý do đã ghi, không bịa đánh giá hoặc người/thời điểm gửi. Chạy lại không đổi dữ liệu. Kiểm bằng `test/replenishment-migration.test.js`; integration vẫn cần MONGODB_TEST_URI riêng.

npm run dev/start/seed/seed:sync-permissions/test là scripts thực; không có npm build/lint. index.js có thể runSeeds khi startup nếu SEED_ON_STARTUP khác false; sync quyền chỉ khi SEED_SYNC_ROLE_PERMISSIONS=true hoặc CLI flag. Import models/index.js không connect/seed/post; khởi động server có thể ghi DB. Không chạy server/seeder vào DB thật để “kiểm thử” một task tài liệu. Không log/copy .env, Mongo URI/Cloudinary/JWT credentials; chỉnh .env.example chỉ với placeholder nếu cần.

DB cũ cần migration kiểm chứng, không dựa schema mới tự nâng cấp: User.roleIds/User.role→roleId đơn bằng migrate:single-role; unique ExternalReference.correlationId; WIR customer/external line→saved SO/salesOrderLine; SR bỏ authorizationId cũ và giữ agreement thật; UNKNOWN packaging không suy từ damage. Index details.externalLineId_1_details.releaseKey_1 cũ chỉ bỏ sau audit/migration và quyền triển khai. Không syncIndexes/drop DB/index mù quáng hoặc tạo nguồn chứng minh giả.

Tests hiện test/models.test.js, models.revision-3.1.test.js, users_roles.test.js và models.integration.test.js; unit chủ yếu schema/service mocks. Integration opt-in MONGODB_TEST_URI, ép random DB sep490_model_verification_<ObjectId> và chỉ drop DB tạm này. Chạy npm test phù hợp sau đổi model/service; không tự bật integration trên production URI.

Nghiệp vụ stock cần test transaction trên replica set riêng: competing reservation/PGI/POD-FD-CR; snapshot activation race; unknown commit/same key khác payload; rollback một line; B1 không unlock khi lỗi; actor khác kho/self-approval; proof/source chain. Model validate/index test không chứng minh các test nghiệp vụ đó đã pass. Đối chiếu R-01–26/T01–T56 ở tài liệu; chỉ báo checks đã chạy. Docs-only không cần chạy test app.

## 6. Quy tắc Git, commit, pull và bàn giao

**Lệnh người dùng: Do not auto-commit. Không tự commit ở bất kỳ bước nào.** Context này cũng không phải ủy quyền push/merge. FE và BE là hai Git repo riêng, không dùng trạng thái repo tài liệu để suy trạng thái code.

1. Trước sửa: chạy git status --short, xem branch/remote/diff trong đúng repo; giữ nguyên thay đổi người dùng. Không reset --hard, clean -fd, force push hoặc ghi đè file không liên quan.
2. Theo Report 2, main ổn định; team có integration branch nhưng **chưa xác minh tên**, không tự giả định develop. Công việc code trên feature/fix branch có phạm vi UC; nếu cần tạo nhánh dùng codex/uc-<id>-<mo-ta> theo mặc định môi trường. Không tự đổi branch khi người dùng đang làm việc trên đó.
3. Khi nhiệm vụ cần đồng bộ: kiểm working tree, fetch origin rồi so divergence với đúng upstream. Ưu tiên git pull --ff-only cho nhánh sạch có upstream; diverged thì xem lịch sử, không tự merge/rebase thay đổi người dùng. Dirty tree không tự stash/discard. Không cần pull để chỉ viết tài liệu context này.
4. Commit chỉ khi được yêu cầu rõ ràng ở lượt sau. Quy ước đề xuất dựa trên lịch sử feat/fix/refactor/docs/chore/test, ví dụ feat(returns): implement GR-FD source guards (UC-73). Mỗi commit một thay đổi logic, có UC/task; fix liên kết defect nếu có. Không stage toàn bộ repo một cách mù quáng; không commit .env/token/log/build/node_modules.
5. Trước pull request/merge: build/runtime checks và tests phù hợp; review role/scope/UOM/stock/source/evidence/version. API/model/permission thay đổi cần người phụ trách FE/BE cùng review. PR nêu vấn đề, UC/BR, hành vi mới, contract/migration và checks đã chạy + phần chưa kiểm. Một thành viên khác review trước tích hợp theo Report 2.
6. “Pull code” và “pull request” là hai việc riêng. Không tự push, mở/merge PR hoặc commit chỉ vì đã hoàn tất task. Khi được giao tạo PR, chuẩn bị diff và kết quả kiểm chứng cụ thể.
7. Bàn giao chỉ nói phần thực sự đã sửa/đã kiểm. Schema validate hoặc MSW test không chứng minh MongoDB concurrency/transaction hay full end-to-end đã đúng.

Quy tắc indentation/naming/branch chi tiết không có trong Report 2 được ghi là quy ước đề xuất theo code hiện tại, không giả là luật đã được nhóm phê duyệt. Yêu cầu trực tiếp mới của người dùng và AGENTS.md áp dụng luôn ưu tiên.

## 7. Chi tiết triển khai từng UC

Mỗi ID xuất hiện một thẻ, giữ thứ tự 01–111 để tìm bằng mã. Mô tả quyền lấy từ đặc tả từng UC, không lấy actor association rộng làm quyền mutate. Mã seed là mapping **hiện có**, không chứng minh middleware/API đã chạy; role và scope chuẩn ở dòng quyền nghiệp vụ luôn phải được giữ. UC combined có nhiều operation, không cấp toàn bộ chỉ vì có một mã quyền. Source Report 3 phần II giữ tên tiếng Anh chuẩn để truy vết; logic triển khai được diễn giải tiếng Việt dưới đây.

### UC-01 — View replenishment request list

- **ACTIVE · FE-01 — Bổ sung, mua và nhận hàng · SC-06.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — View; Warehouse Staff — Own / assigned scope; Sales Staff — Own / assigned scope.
- **Mã quyền trong seed hiện tại:** `replenishment_request:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** Filter ngày tạo/người lập/status/decision, phân trang tùy chọn.
- **Logic/kết quả:** Danh sách mã RR/sản phẩm/lượng/quyết định; Sales/Warehouse chỉ own/assigned, Owner/Accountant theo trách nhiệm. Read-only.
- **Thiết kế BE:** Scoped find + count cùng predicate; không trả mọi RR rồi nhờ FE lọc.
- **Điểm đặt BE:** `src/modules/replenishments` [đề xuất, chưa có route]; model/data: REPLENISHMENT; Approval; DemandSupplyAllocation.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-01 (dòng 887 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-02 — View replenishment request details

- **ACTIVE · FE-01 — Bổ sung, mua và nhận hàng · SC-06.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — View; Warehouse Staff — Own / assigned scope; Sales Staff — Own / assigned scope.
- **Mã quyền trong seed hiện tại:** `replenishment_request:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** RR ID đã lưu.
- **Logic/kết quả:** Chi tiết nguồn thiếu/available/pending supply, dòng hàng và versioned approval history; không coi inbound là available.
- **Thiết kế BE:** Validate ID + scope trước populate nguồn/approval/evidence; derive lượng từ transaction.
- **Điểm đặt BE:** `src/modules/replenishments` [đề xuất, chưa có route]; model/data: REPLENISHMENT; Approval; DemandSupplyAllocation.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-02 (dòng 904 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-03 — Create replenishment request

- **ACTIVE · FE-01 — Bổ sung, mua và nhận hàng · SC-06.**
- **Quyền theo Report 3:** Warehouse Staff — Create; Sales Staff — Create.
- **Mã quyền trong seed hiện tại:** `replenishment_request:create`→WAREHOUSE/SALES; `replenishment_request:update`→WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** Kho, sản phẩm, need date, UOM/qty, nguồn shortage/threshold/count.
- **Logic/kết quả:** Sales/Warehouse kiểm stock và supply compatible/timely chưa dùng; chỉ submit uncovered demand, không trùng RR. Pending RR không đổi owned/available.
- **Thiết kế BE:** Guard source demand/allocation; positive exact qty, snapshot conversion và request version; gửi Owner khác user.
- **Điểm đặt BE:** `src/modules/replenishments` [đề xuất, chưa có route]; model/data: REPLENISHMENT; Approval; DemandSupplyAllocation.
- **Điểm kiểm chứng:** Nguồn đã covered không tạo RR trùng; Accountant không tạo.
- **Truy vết:** Report 3 phần II, UC-03 (dòng 921 tại snapshot đọc); nhánh BF-01-A1. Áp dụng BR chung và EX-01–05 khi liên quan.
- **Bổ sung 3.3.0:** Một form điền sẵn từ nguồn; chọn/thêm dòng có căn cứ riêng, Lưu nháp/Gửi duyệt mới tạo RR. Giữ lý do và source refs; recheck phiên bản/coverage, trả dữ liệu mới để review mà giữ form.

### UC-04 — Approve or reject replenishment request

- **ACTIVE · FE-01 — Bổ sung, mua và nhận hàng · SC-06.**
- **Quyền theo Report 3:** Store Owner — Approve / reject / return; not requester.
- **Mã quyền trong seed hiện tại:** `replenishment_request:approve`→OWNER.
- **Đầu vào/điều kiện:** RR pending/current version, decision và từng line/approvedQty/reason.
- **Logic/kết quả:** Owner khác requester approve/reject/return đúng version; reject chặn PO, revision cần review mới. Quyết định không post tồn.
- **Thiết kế BE:** Append Approval gắn document/version/line/qty/actor; chặn self-approval theo userId kể cả sau khi đổi role.
- **Điểm đặt BE:** `src/modules/replenishments` [đề xuất, chưa có route]; model/data: REPLENISHMENT; Approval; DemandSupplyAllocation.
- **Điểm kiểm chứng:** Requester đổi sang Owner vẫn không tự duyệt; approval stale chặn PO.
- **Truy vết:** Report 3 phần II, UC-04 (dòng 936 tại snapshot đọc); nhánh BF-01-A2. Áp dụng BR chung và EX-01–05 khi liên quan.
- **Bổ sung 3.3.0:** Review cả source refs, suggestedQty, lượng thực đề nghị và giải trình; Owner khác submittedBy/requester. Đọc Notification không là approval.

### UC-05 — View purchase order list

- **ACTIVE · FE-01 — Bổ sung, mua và nhận hàng · SC-07.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — View; Warehouse Staff — Receiving scope only.
- **Mã quyền trong seed hiện tại:** `purchase_order:read`→OWNER/ACCOUNTANT/WAREHOUSE.
- **Đầu vào/điều kiện:** Filter NCC/ngày/status/outstanding tùy chọn.
- **Logic/kết quả:** List PO theo trách nhiệm; Warehouse chỉ receipt-scope: không giá mua/tài chính/sửa PO.
- **Thiết kế BE:** Projection theo role+assigned receiving warehouse; cùng scope list/export, không financial DTO cho Warehouse.
- **Điểm đặt BE:** `src/modules/purchase-orders` [đề xuất, chưa có route]; model/data: PO; source RR lines; supplier confirmations.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-05 (dòng 951 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-06 — View purchase order details

- **ACTIVE · FE-01 — Bổ sung, mua và nhận hàng · SC-07.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — View; Warehouse Staff — Receiving scope only.
- **Mã quyền trong seed hiện tại:** `purchase_order:read`→OWNER/ACCOUNTANT/WAREHOUSE.
- **Đầu vào/điều kiện:** PO ID.
- **Logic/kết quả:** Ordered/confirmed/received/accepted/outstanding và nhiều receipt/confirmation links; read-only, không UC outstanding riêng.
- **Thiết kế BE:** Aggregate nguồn hợp lệ/cancel/reversal và source receipt; receipt-only projection cho Warehouse.
- **Điểm đặt BE:** `src/modules/purchase-orders` [đề xuất, chưa có route]; model/data: PO; source RR lines; supplier confirmations.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-06 (dòng 969 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-07 — Manage Purchase Order and Supplier Confirmation

- **ACTIVE · FE-01 — Bổ sung, mua và nhận hàng · SC-07.**
- **Quyền theo Report 3:** Accountant — Perform.
- **Mã quyền trong seed hiện tại:** `purchase_order:create`→ACCOUNTANT; `purchase_order:update`→ACCOUNTANT.
- **Đầu vào/điều kiện:** Approved RR lines còn lượng, NCC/kho, supplier qty/date confirmation.
- **Logic/kết quả:** Accountant lập PO sau duyệt; nhiều đợt nhận, sửa/hủy chỉ unreceived remainder; vượt approval/short closure cần Owner authorization. Không payment/post stock.
- **Thiết kế BE:** Serialize RR line consumption; preserve executed PO/GR; kiểm current approval/version và authorize short closure.
- **Điểm đặt BE:** `src/modules/purchase-orders` [đề xuất, chưa có route]; model/data: PO; source RR lines; supplier confirmations.
- **Điểm kiểm chứng:** PO100 nhận60 còn40; không xóa GR đã post khi cancel remainder.
- **Truy vết:** Report 3 phần II, UC-07 (dòng 987 tại snapshot đọc); nhánh BF-01-A3. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-08 — View goods receipt list

- **ACTIVE · FE-01 — Bổ sung, mua và nhận hàng · SC-08.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `goods_receipt_inspection:read`→OWNER/ACCOUNTANT/WAREHOUSE.
- **Đầu vào/điều kiện:** Filter PO/receipt/date/status.
- **Logic/kết quả:** Danh sách receipt/arrival và processing stage, không coi draft=đã nhập.
- **Thiết kế BE:** Scoped read query theo warehouse/PO; không post side effect trên GET.
- **Điểm đặt BE:** `src/modules/goods-receipts` / `src/modules/warehouse-tasks` [đề xuất, chưa có route]; model/data: ARRIVAL/INSPECTION/GR_PURCHASE/TO; DocumentLine.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-08 (dòng 1003 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-09 — View goods receipt details

- **ACTIVE · FE-01 — Bổ sung, mua và nhận hàng · SC-08.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `goods_receipt_inspection:read`→OWNER/ACCOUNTANT/WAREHOUSE.
- **Đầu vào/điều kiện:** Receipt ID.
- **Logic/kết quả:** Actual/accepted/pending/defective/rejected và evidence/source; chưa accepted không available.
- **Thiết kế BE:** DTO từ inspection/receipt lines, trace actual ownership và ledger, scope attachments.
- **Điểm đặt BE:** `src/modules/goods-receipts` / `src/modules/warehouse-tasks` [đề xuất, chưa có route]; model/data: ARRIVAL/INSPECTION/GR_PURCHASE/TO; DocumentLine.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-09 (dòng 1020 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-10 — Create goods receipt from purchase order

- **ACTIVE · FE-01 — Bổ sung, mua và nhận hàng · SC-08.**
- **Quyền theo Report 3:** Warehouse Staff — Perform in assigned warehouse.
- **Mã quyền trong seed hiện tại:** `goods_receipt_inspection:create`→WAREHOUSE.
- **Đầu vào/điều kiện:** PO mở/dòng PO, kho nhận, actual BOX/PIECE/lô/packaging/evidence.
- **Logic/kết quả:** Warehouse ghi arrival/draft riêng từng chuyến, giữ wrong/excess/zero-accepted evidence; chưa increase owned.
- **Thiết kế BE:** ARRIVAL/draft và references đúng PO/kho; inspect/post để UC-26, không batch/movement khi draft.
- **Điểm đặt BE:** `src/modules/goods-receipts` / `src/modules/warehouse-tasks` [đề xuất, chưa có route]; model/data: ARRIVAL/INSPECTION/GR_PURCHASE/TO; DocumentLine.
- **Điểm kiểm chứng:** Sai role/kho/version/nguồn/evidence phải từ chối; retry cùng key không nhân thao tác; kiểm boundary theo EX-01–05.
- **Truy vết:** Report 3 phần II, UC-10 (dòng 1037 tại snapshot đọc); nhánh BF-01-E2. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-11 — View product list

- **ACTIVE · FE-02 — Master data · SC-03.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — View; Warehouse Staff — View; Sales Staff — View.
- **Mã quyền trong seed hiện tại:** `product:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** Mã/tên/nominal size/status tùy chọn.
- **Logic/kết quả:** List sản phẩm/SKU/category/size/status; không selling price workflow.
- **Thiết kế BE:** Read Product có pagination/sort allowlist, không fabricate stock từ master.
- **Điểm đặt BE:** `src/modules/products` [đề xuất, chưa có route]; model/data: Product/ProductUomVersion/ProductWarehousePolicy/Uom.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-11 (dòng 1053 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-12 — View product details

- **ACTIVE · FE-02 — Master data · SC-03.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — View; Warehouse Staff — View; Sales Staff — View.
- **Mã quyền trong seed hiện tại:** `product:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** Product ID/code.
- **Logic/kết quả:** Thuộc tính gạch và version quy đổi đã lưu; không suy calibre từ nominal size.
- **Thiết kế BE:** Populate phiên bản quy đổi đúng, giữ snapshot chứng từ đã dùng không rewrite.
- **Điểm đặt BE:** `src/modules/products` [đề xuất, chưa có route]; model/data: Product/ProductUomVersion/ProductWarehousePolicy/Uom.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-12 (dòng 1070 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-13 — Maintain Product and Packaging

- **ACTIVE · FE-02 — Master data · SC-03.**
- **Quyền theo Report 3:** Store Owner — Perform.
- **Mã quyền trong seed hiện tại:** `product:create`→OWNER; `product:update`→OWNER.
- **Đầu vào/điều kiện:** Owner: product specs, active, positive factors và warehouse minimum hữu hạn.
- **Logic/kết quả:** Tạo/cập nhật SKU; quy cách mới thành version, giữ factor đã dùng; whole piece; ngưỡng chỉ gợi ý, không auto PO.
- **Thiết kế BE:** Reuse ProductUomVersion append-only + ProductWarehousePolicy; kiểm nguồn hệ số/độ hạt, không update conversion history.
- **Điểm đặt BE:** `src/modules/products` [đề xuất, chưa có route]; model/data: Product/ProductUomVersion/ProductWarehousePolicy/Uom.
- **Điểm kiểm chứng:** Đổi conversion version không đổi qtyBase lịch sử; fractional PIECE bị chặn.
- **Truy vết:** Report 3 phần II, UC-13 (dòng 1087 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.
- **Bổ sung 3.3.0:** Policy theo sản phẩm/kho có minimumQty/targetQty/version/updatedBy; target mặc định minimum, target >= minimum; không thêm autoCreateAfterStocktake.

### UC-14 — View lot list

- **ACTIVE · FE-02 — Master data · SC-04.**
- **Quyền theo Report 3:** Store Owner — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `product_lot:read`→OWNER/WAREHOUSE.
- **Đầu vào/điều kiện:** Product/manufacturer lot/tone/actual calibre tùy chọn.
- **Logic/kết quả:** List lot theo identity thật và quantity presence; chỉ Owner/Warehouse.
- **Thiết kế BE:** Query Lot theo product+identity, không sum khác owner/quality thành available.
- **Điểm đặt BE:** `src/modules/lots` [đề xuất, chưa có route]; model/data: Lot; product/identity/evidence.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-14 (dòng 1101 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-15 — View lot details

- **ACTIVE · FE-02 — Master data · SC-04.**
- **Quyền theo Report 3:** Store Owner — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `product_lot:read`→OWNER/WAREHOUSE.
- **Đầu vào/điều kiện:** Lot ID hoặc product+lot selection.
- **Logic/kết quả:** Lot attrs/production date/tone/calibre/stock history; không đổi lot khi xem.
- **Thiết kế BE:** Scope source/warehouse trước join ledger; giữ nhận dạng lịch sử.
- **Điểm đặt BE:** `src/modules/lots` [đề xuất, chưa có route]; model/data: Lot; product/identity/evidence.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-15 (dòng 1118 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-16 — Maintain Product Lot

- **ACTIVE · FE-02 — Master data · SC-04.**
- **Quyền theo Report 3:** Store Owner — Create / Update; Warehouse Staff — Create only.
- **Mã quyền trong seed hiện tại:** `product_lot:create`→OWNER/WAREHOUSE; `product_lot:update`→OWNER.
- **Đầu vào/điều kiện:** Product tồn tại, lot/tone/calibre hoặc explicit UNKNOWN và evidence.
- **Logic/kết quả:** Owner create/update, Warehouse create only. Không sửa transacted identity để che thiếu; UNKNOWN không allocatable.
- **Thiết kế BE:** Unique identity + transacted-reference guard; quality xử lý bằng inspection/disposition, không sửa Lot để chuyển stock.
- **Điểm đặt BE:** `src/modules/lots` [đề xuất, chưa có route]; model/data: Lot; product/identity/evidence.
- **Điểm kiểm chứng:** Warehouse không edit lot cũ; UNKNOWN không được allocate.
- **Truy vết:** Report 3 phần II, UC-16 (dòng 1135 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-17 — View supplier list

- **ACTIVE · FE-02 — Master data · SC-05.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — View.
- **Mã quyền trong seed hiện tại:** `supplier:read`→OWNER/ACCOUNTANT.
- **Đầu vào/điều kiện:** Supplier code/name/cooperation status tùy chọn.
- **Logic/kết quả:** Danh sách NCC cho Owner/Accountant, read-only.
- **Thiết kế BE:** Party SUPPLIER projection/search, không query cả CUSTOMER/STORE.
- **Điểm đặt BE:** `src/modules/suppliers` [đề xuất, chưa có route]; model/data: Party(kind SUPPLIER).
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-17 (dòng 1149 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-18 — View supplier details

- **ACTIVE · FE-02 — Master data · SC-05.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — View.
- **Mã quyền trong seed hiện tại:** `supplier:read`→OWNER/ACCOUNTANT.
- **Đầu vào/điều kiện:** Supplier ID.
- **Logic/kết quả:** Contact và link PO/GR/SR đã lưu; không payment/debt ledger.
- **Thiết kế BE:** Populate scoped docs, không lộ chứng từ ngoài warehouse/responsibility.
- **Điểm đặt BE:** `src/modules/suppliers` [đề xuất, chưa có route]; model/data: Party(kind SUPPLIER).
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-18 (dòng 1166 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-19 — Maintain Supplier

- **ACTIVE · FE-02 — Master data · SC-05.**
- **Quyền theo Report 3:** Store Owner — Activate / Deactivate; Accountant — Create / Update.
- **Mã quyền trong seed hiện tại:** `supplier:create`→ACCOUNTANT; `supplier:update`→ACCOUNTANT; `supplier:activate`→OWNER.
- **Đầu vào/điều kiện:** Supplier identity/contact hoặc activation action.
- **Logic/kết quả:** Accountant create/update; Owner activate/deactivate. UC gộp không cấp hai bên toàn bộ quyền; inactive không dùng PO mới.
- **Thiết kế BE:** Whitelist theo subcommand/permission, guard active usage/history; không generic full Party patch.
- **Điểm đặt BE:** `src/modules/suppliers` [đề xuất, chưa có route]; model/data: Party(kind SUPPLIER).
- **Điểm kiểm chứng:** Accountant không activate, Owner không edit identity/contact.
- **Truy vết:** Report 3 phần II, UC-19 (dòng 1183 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-20 — View Customer List

- **ACTIVE · FE-02 — Master data · SC-24.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reference scope; Warehouse Staff — Delivery scope; Sales Staff — View.
- **Mã quyền trong seed hiện tại:** `customer:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** Customer code/name/contact/external ID tùy chọn.
- **Logic/kết quả:** Customer delivery/contact reference; Owner/Sales đọc, Accountant reference scope, Warehouse delivery scope; không CRM/debt.
- **Thiết kế BE:** Party CUSTOMER query/projection theo related source/delivery; scope cả external customer identifiers.
- **Điểm đặt BE:** `src/modules/customers` [đề xuất, chưa có route]; model/data: Party(kind CUSTOMER).
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-20 (dòng 1197 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-21 — View Customer Details

- **ACTIVE · FE-02 — Master data · SC-24.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reference scope; Warehouse Staff — Delivery scope; Sales Staff — View.
- **Mã quyền trong seed hiện tại:** `customer:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** Customer ID.
- **Logic/kết quả:** Contact/address/source SO/WIR/return links theo scope; không receivable/giá bán.
- **Thiết kế BE:** Direct detail áp predicate như list; không populate mọi đơn của khách ngoài phạm vi.
- **Điểm đặt BE:** `src/modules/customers` [đề xuất, chưa có route]; model/data: Party(kind CUSTOMER).
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-21 (dòng 1211 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-22 — Maintain Customer

- **ACTIVE · FE-02 — Master data · SC-24.**
- **Quyền theo Report 3:** Sales Staff — Maintain contact / delivery reference.
- **Mã quyền trong seed hiện tại:** `customer:create`→SALES; `customer:update`→SALES.
- **Đầu vào/điều kiện:** Sales: contact/delivery address/external customer code.
- **Logic/kết quả:** Duy trì reference cơ bản, xử lý identity trùng, giữ SO/WIR/return history. Không sales CRM hoặc balance.
- **Thiết kế BE:** Update whitelist Party CUSTOMER, không xóa referenced party; audit identity mapping.
- **Điểm đặt BE:** `src/modules/customers` [đề xuất, chưa có route]; model/data: Party(kind CUSTOMER).
- **Điểm kiểm chứng:** Sai role/kho/version/nguồn/evidence phải từ chối; retry cùng key không nhân thao tác; kiểm boundary theo EX-01–05.
- **Truy vết:** Report 3 phần II, UC-22 (dòng 1225 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-23 — View Selling Price List

- **RETIRED.** Giá bán xử lý bên ngoài.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-24 — View Selling Price Details

- **RETIRED.** Giá bán xử lý bên ngoài.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-25 — Maintain Selling Price

- **RETIRED.** Giá bán xử lý bên ngoài.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-26 — Inspect and Post Goods Receipt

- **ACTIVE · FE-03 — Kiểm nhận và post GR · SC-08.**
- **Quyền theo Report 3:** Warehouse Staff — Perform in assigned warehouse.
- **Mã quyền trong seed hiện tại:** `goods_receipt_inspection:update`→WAREHOUSE; `goods_receipt_inspection:post`→WAREHOUSE.
- **Đầu vào/điều kiện:** Actual arrival/draft PO receipt, lot/pieces/packaging/quality/owner và evidence.
- **Logic/kết quả:** Warehouse inspect rồi post chỉ accepted ownership một lần, pending/rejected custody riêng. TORN không tự DAMAGED; accepted0 không GR0. GOOD chờ put-away.
- **Thiết kế BE:** Guard cumulative PO allowance, current decision/evidence/freeze; atomically GR lines/batch/stock/PO progress/custody, no double receipt.
- **Điểm đặt BE:** `src/modules/goods-receipts` / `src/modules/warehouse-tasks` [đề xuất, chưa có route]; model/data: ARRIVAL/INSPECTION/GR_PURCHASE/TO; DocumentLine.
- **Điểm kiểm chứng:** accepted0 giữ ARR/INS/custody, không GR0; TORN intact không tự DAMAGED. Có stock effect: kiểm batch/ledger/balance/reservation/progress đồng nhất và rollback toàn bộ.
- **Truy vết:** Report 3 phần II, UC-26 (dòng 1258 tại snapshot đọc); nhánh BF-01-A3, BF-01-E1, BF-01-E2, BF-01-A4. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-27 — View warehouse and location list

- **ACTIVE · FE-04 — Kho/tồn/vị trí · SC-09.**
- **Quyền theo Report 3:** Store Owner — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `warehouse_location:read`→OWNER/WAREHOUSE.
- **Đầu vào/điều kiện:** Kho/area/location code/status tùy chọn.
- **Logic/kết quả:** List location theo kho được phép; physical warehouse không đồng nhất area.
- **Thiết kế BE:** Warehouse/Location query scoped by assigned IDs; stable code uniqueness trong kho.
- **Điểm đặt BE:** `src/modules/locations` [đề xuất, chưa có route]; model/data: Warehouse/Location.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-27 (dòng 1276 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-28 — View storage location details

- **ACTIVE · FE-04 — Kho/tồn/vị trí · SC-09.**
- **Quyền theo Report 3:** Store Owner — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `warehouse_location:read`→OWNER/WAREHOUSE.
- **Đầu vào/điều kiện:** Location ID và warehouse context.
- **Logic/kết quả:** Location metadata/status/stock by lot+quality; capacity chỉ hiện khi nguồn có, không tự đặt model field.
- **Thiết kế BE:** Validate location thuộc warehouse đã scope; aggregate balances không gộp ownership.
- **Điểm đặt BE:** `src/modules/locations` [đề xuất, chưa có route]; model/data: Warehouse/Location.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-28 (dòng 1293 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-29 — Maintain Storage Location

- **ACTIVE · FE-04 — Kho/tồn/vị trí · SC-09.**
- **Quyền theo Report 3:** Store Owner — Perform.
- **Mã quyền trong seed hiện tại:** `warehouse_location:create`→OWNER; `warehouse_location:update`→OWNER.
- **Đầu vào/điều kiện:** Owner: warehouse/code/kind/active/allocatable.
- **Logic/kết quả:** Maintain metadata; chỉ STORAGE allocatable. Có stock hoặc reference mở không deactivate; không dùng master edit để move stock/bypass freeze.
- **Thiết kế BE:** Unique warehouse+code, guard stock/open refs; no StockBalance/reservation mutation từ master update.
- **Điểm đặt BE:** `src/modules/locations` [đề xuất, chưa có route]; model/data: Warehouse/Location.
- **Điểm kiểm chứng:** Sai role/kho/version/nguồn/evidence phải từ chối; retry cùng key không nhân thao tác; kiểm boundary theo EX-01–05.
- **Truy vết:** Report 3 phần II, UC-29 (dòng 1310 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-30 — View stock by lot, location, and quality status

- **ACTIVE · FE-04 — Kho/tồn/vị trí · SC-10.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouse; Sales Staff — Available / related demand only.
- **Mã quyền trong seed hiện tại:** `inventory:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** Kho/product/lot/location/quality tùy chọn.
- **Logic/kết quả:** Owned/on-hand/usable/reserved/available/custody/transit riêng; Sales available/related demand, Accountant reconciliation.
- **Thiết kế BE:** Available aggregation kiểm verified/active/allocatable/hold/freeze và reservation đúng chiều; scoped projection.
- **Điểm đặt BE:** `src/modules/inventory` / `src/modules/fulfilment-options` [đề xuất, chưa có route]; model/data: StockBalance/StockAccount/Reservation/DefectHold/DemandSupplyAllocation.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-30 (dòng 1324 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-31 — View inventory balance details

- **ACTIVE · FE-04 — Kho/tồn/vị trí · SC-10.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouse; Sales Staff — Available / related demand only.
- **Mã quyền trong seed hiện tại:** `inventory:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** Balance dimension hoặc product/lot/location/quality selection.
- **Logic/kết quả:** Chi tiết UOM/source/last movements, explain available; staging/hold/reservation không trừ hai lần.
- **Thiết kế BE:** Read StockAccount+Balance+reservations/holds/ledger consistent dimensions; no cross-owner sum.
- **Điểm đặt BE:** `src/modules/inventory` / `src/modules/fulfilment-options` [đề xuất, chưa có route]; model/data: StockBalance/StockAccount/Reservation/DefectHold/DemandSupplyAllocation.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-31 (dòng 1342 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-32 — Create Put-away Task

- **ACTIVE · FE-04 — Kho/tồn/vị trí · SC-08.**
- **Quyền theo Report 3:** Warehouse Staff — Perform in assigned warehouse.
- **Mã quyền trong seed hiện tại:** `putaway_task:read`→OWNER/WAREHOUSE; `putaway_task:create`→WAREHOUSE.
- **Đầu vào/điều kiện:** Posted receipt line còn unplacedQty, suitable destination.
- **Logic/kết quả:** Warehouse tạo/nhận suggestion put-away TO, không approval/nhập lần hai; frozen/blocked đích chờ hoặc đổi.
- **Thiết kế BE:** Guard receipt posted/owned/source and total open tasks vs unplaced qty; TO references source lines.
- **Điểm đặt BE:** `src/modules/goods-receipts` / `src/modules/warehouse-tasks` [đề xuất, chưa có route]; model/data: ARRIVAL/INSPECTION/GR_PURCHASE/TO; DocumentLine.
- **Điểm kiểm chứng:** Sai role/kho/version/nguồn/evidence phải từ chối; retry cùng key không nhân thao tác; kiểm boundary theo EX-01–05.
- **Truy vết:** Report 3 phần II, UC-32 (dòng 1360 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-33 — Confirm Put-away Task

- **ACTIVE · FE-04 — Kho/tồn/vị trí · SC-08.**
- **Quyền theo Report 3:** Warehouse Staff — Perform in assigned warehouse.
- **Mã quyền trong seed hiện tại:** `putaway_task:read`→OWNER/WAREHOUSE; `putaway_task:confirm`→WAREHOUSE.
- **Đầu vào/điều kiện:** Open TO, actual lot/quality/owner/qty/source/destination.
- **Logic/kết quả:** Confirm placement bằng hai vế receiving→storage, reservation đi theo; partial để remainder. Tổng không đổi, GOOD eligible mới available.
- **Thiết kế BE:** Atomic movement legs/balance/reservation/task progress; scope/freeze/source qty/idempotency.
- **Điểm đặt BE:** `src/modules/goods-receipts` / `src/modules/warehouse-tasks` [đề xuất, chưa có route]; model/data: ARRIVAL/INSPECTION/GR_PURCHASE/TO; DocumentLine.
- **Điểm kiểm chứng:** Confirm retry không nhận tồn lần hai; partial giữ remainder. Có stock effect: kiểm batch/ledger/balance/reservation/progress đồng nhất và rollback toàn bộ.
- **Truy vết:** Report 3 phần II, UC-33 (dòng 1374 tại snapshot đọc); nhánh BF-01-A4. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-34 — View location movement list

- **ACTIVE · FE-04 — Kho/tồn/vị trí · SC-12.**
- **Quyền theo Report 3:** Store Owner — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `stock_relocation:read`→OWNER/WAREHOUSE.
- **Đầu vào/điều kiện:** Warehouse/movement/date/status tùy chọn.
- **Logic/kết quả:** Danh sách move cùng kho planned/actual; không TR.
- **Thiết kế BE:** Query TO relocation kind trong assigned warehouse, không lẫn transfer records.
- **Điểm đặt BE:** `src/modules/warehouse-tasks` [đề xuất, chưa có route]; model/data: TO, WAREHOUSE_TASK lines; StockBalance/Reservation.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-34 (dòng 1389 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-35 — View location movement details

- **ACTIVE · FE-04 — Kho/tồn/vị trí · SC-12.**
- **Quyền theo Report 3:** Store Owner — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `stock_relocation:read`→OWNER/WAREHOUSE.
- **Đầu vào/điều kiện:** Relocation TO ID.
- **Logic/kết quả:** Lot/from/to/planned/actual/posting history; read-only.
- **Thiết kế BE:** Scope cả hai location và immutable operation/movement links.
- **Điểm đặt BE:** `src/modules/location-movements` — GET `/api/location-movements/:id` đã triển khai 29/10/2026; xem README trong module. Model TO/WAREHOUSE_TASK, actual từ ledger; FE còn mock.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-35 (dòng 1406 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-36 — Create location movement

- **ACTIVE · FE-04 — Kho/tồn/vị trí · SC-12.**
- **Quyền theo Report 3:** Warehouse Staff — Perform in assigned warehouse.
- **Mã quyền trong seed hiện tại:** `stock_relocation:create`→WAREHOUSE.
- **Đầu vào/điều kiện:** Warehouse: from/to cùng kho, lot/quality/owner/qty/reason.
- **Logic/kết quả:** Lập relocation sau kiểm nguồn/reservation/freeze; khác kho đi BF-04. Chưa move cho đến confirm.
- **Thiết kế BE:** Validate distinct locations same assigned warehouse, quantity/source/suitability; create TO not stock mutation.
- **Điểm đặt BE:** `src/modules/location-movements` — POST `/api/location-movements` đã triển khai 29/10/2026; stock-neutral OPEN TO + lines + idempotent BusinessOperation + audit trong transaction. Location.planningVersion khóa planner cạnh tranh; các UC xác nhận/kiểm kê triển khai sau phải dùng chung guard. Xem README module; UC-37 chưa triển khai.
- **Điểm kiểm chứng:** Sai role/kho/version/nguồn/evidence phải từ chối; retry cùng key không nhân thao tác; kiểm boundary theo EX-01–05.
- **Truy vết:** Report 3 phần II, UC-36 (dòng 1423 tại snapshot đọc); nhánh BF-03-A1, BF-03-E1. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-37 — Confirm actual location movement

- **ACTIVE · FE-04 — Kho/tồn/vị trí · SC-12.**
- **Quyền theo Report 3:** Warehouse Staff — Perform in assigned warehouse.
- **Mã quyền trong seed hiện tại:** `stock_relocation:confirm`→WAREHOUSE.
- **Đầu vào/điều kiện:** Open relocation và actual moved qty/location.
- **Logic/kết quả:** Post source-q/destination+q, giữ owner/lot/quality và reservation; partial còn mở/hủy phần chưa làm có lý do.
- **Thiết kế BE:** Single batch two legs + reservation relocation + TO progress; blocked freeze/source shortage rollback.
- **Điểm đặt BE:** `src/modules/warehouse-tasks` [đề xuất, chưa có route]; model/data: TO, WAREHOUSE_TASK lines; StockBalance/Reservation.
- **Điểm kiểm chứng:** Chuyển stock reserved không tạo available mới; khác kho không dùng relocate. Có stock effect: kiểm batch/ledger/balance/reservation/progress đồng nhất và rollback toàn bộ.
- **Truy vết:** Report 3 phần II, UC-37 (dòng 1438 tại snapshot đọc); nhánh BF-03-A1, BF-03-E1. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-38 — View warehouse transfer list

- **ACTIVE · FE-05 — Điều chuyển liên kho · SC-13.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouses; Sales Staff — Related demand progress.
- **Mã quyền trong seed hiện tại:** `stock_transfer:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** From/to warehouse/status tùy chọn.
- **Logic/kết quả:** Transfer progress theo scope; Sales chỉ nhu cầu liên quan, Accountant reconciliation.
- **Thiết kế BE:** Scoped queries theo cả trách nhiệm warehouse/related demand; no unrestricted transfer list.
- **Điểm đặt BE:** `src/modules/transfers` — GET `/api/warehouse-transfers` đã triển khai. Quyết định 29/10/2026: Sales được xem tổng tiến độ TR liên quan tới nhu cầu của mình kể cả TR phục vụ nhiều Sales, không xem ghi chú/chứng từ nội bộ. Xem README module về DTO và scope.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-38 (dòng 1454 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-39 — View warehouse transfer details

- **ACTIVE · FE-05 — Điều chuyển liên kho · SC-13.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouses; Sales Staff — Related demand progress.
- **Mã quyền trong seed hiện tại:** `stock_transfer:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** TR ID.
- **Logic/kết quả:** Approved/requested/TD/MWTR/quality/transit/variance/TO và whole-TR closure.
- **Thiết kế BE:** Aggregate line chain, valid cancellation/outcome/partial receipt; closure invariant toàn TR.
- **Điểm đặt BE:** `src/modules/transfers` — GET `/api/warehouse-transfers/:id` đã triển khai. Sales nhận DTO tổng tiến độ của TR liên quan, kể cả nhiều nhu cầu, không có ghi chú/chứng từ nội bộ. GET không đóng TR; hiển thị lifecycle đã lưu và số liệu từ TD/MWTR POSTED, transit balance. Xem README module; các command xuất/nhận/đối chiếu chưa thuộc Iteration 1.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-39 (dòng 1472 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-40 — Create Transfer Request

- **ACTIVE · FE-05 — Điều chuyển liên kho · SC-13.**
- **Quyền theo Report 3:** Warehouse Staff — Create.
- **Mã quyền trong seed hiện tại:** `stock_transfer:create`→WAREHOUSE; `stock_transfer:update`→WAREHOUSE.
- **Đầu vào/điều kiện:** Need physical transfer, distinct source/dest, product/lot/qty/date/reason.
- **Logic/kết quả:** Warehouse xem UC-103; direct dispatch dùng BF-06, same kho dùng BF-03; submit TR version chưa post.
- **Thiết kế BE:** Validate compatible supply, source/dest assignment/source need; create TRANSFER_REQUEST only.
- **Điểm đặt BE:** `src/modules/transfers` [đề xuất, chưa có route]; model/data: TRANSFER_REQUEST/TRANSFER_DISPATCH/MWTR/HANDOVER/DISCREPANCY.
- **Điểm kiểm chứng:** Sai role/kho/version/nguồn/evidence phải từ chối; retry cùng key không nhân thao tác; kiểm boundary theo EX-01–05.
- **Truy vết:** Report 3 phần II, UC-40 (dòng 1490 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-41 — Review Transfer Request

- **ACTIVE · FE-05 — Điều chuyển liên kho · SC-13.**
- **Quyền theo Report 3:** Store Owner — Approve / reject / return; not requester.
- **Mã quyền trong seed hiện tại:** `stock_transfer:approve`→OWNER.
- **Đầu vào/điều kiện:** TR pending/current version, Owner khác requester, approved line qty.
- **Logic/kết quả:** Approve/reject/return; approved reserve source atomic, total không đổi; thiếu receiver độc lập thì chờ.
- **Thiết kế BE:** Approval + controlled reservations theo current balance/freeze/source guard, self-approval deny.
- **Điểm đặt BE:** `src/modules/transfers` [đề xuất, chưa có route]; model/data: TRANSFER_REQUEST/TRANSFER_DISPATCH/MWTR/HANDOVER/DISCREPANCY.
- **Điểm kiểm chứng:** TR creator có Owner role vẫn không approve chính mình.
- **Truy vết:** Report 3 phần II, UC-41 (dòng 1504 tại snapshot đọc); nhánh BF-04-E1. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-42 — Create Warehouse Transfer Order

- **RETIRED.** TR đã duyệt thực hiện UC-43/104, không thêm transfer-order layer.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-43 — Record Transfer Dispatch

- **ACTIVE · FE-05 — Điều chuyển liên kho · SC-13.**
- **Quyền theo Report 3:** Warehouse Staff — Draft TD before picking; confirm TO execution; post actual handover.
- **Mã quyền trong seed hiện tại:** `stock_transfer:dispatch`→WAREHOUSE.
- **Đầu vào/điều kiện:** Approved TR, draft TD, actual pick/TO khi staging, handover evidence.
- **Logic/kết quả:** TD draft trước picking; chỉ post actual handover source→transit, không GI thêm/không credit đích; nhiều releases, TR đóng khi đủ điều kiện toàn bộ.
- **Thiết kế BE:** TRANSFER_DISPATCH/HANDOVER lines guard approved remainder/version; ledger two legs+allocations/task status atomic.
- **Điểm đặt BE:** `src/modules/transfers` [đề xuất, chưa có route]; model/data: TRANSFER_REQUEST/TRANSFER_DISPATCH/MWTR/HANDOVER/DISCREPANCY.
- **Điểm kiểm chứng:** TD draft không giảm tồn; post source→transit, không thêm GI và không credit destination. Có stock effect: kiểm batch/ledger/balance/reservation/progress đồng nhất và rollback toàn bộ.
- **Truy vết:** Report 3 phần II, UC-43 (dòng 1525 tại snapshot đọc); nhánh BF-04-E1, BF-04-E3. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-44 — Review Transfer Difference Resolution

- **ACTIVE · FE-05 — Điều chuyển liên kho · SC-13.**
- **Quyền theo Report 3:** Store Owner — Review transfer variance.
- **Mã quyền trong seed hiện tại:** `stock_transfer:update`→WAREHOUSE; `stock_transfer:approve_variance`→OWNER.
- **Đầu vào/điều kiện:** Transfer discrepancy line/evidence/resolution proposal/current version.
- **Logic/kết quả:** Owner duyệt recover/additional receipt/return-source/loss đúng lượng, khác proposer. Damaged physically received không lost transit; decision chưa post.
- **Thiết kế BE:** Approval for linked Warehouse execution documents; guard each variance outcome cap, don't reuse for BF-08 SR.
- **Điểm đặt BE:** `src/modules/transfers` [đề xuất, chưa có route]; model/data: TRANSFER_REQUEST/TRANSFER_DISPATCH/MWTR/HANDOVER/DISCREPANCY.
- **Điểm kiểm chứng:** Đã nhận3DAMAGED không lại ghi loss3 transit.
- **Truy vết:** Report 3 phần II, UC-44 (dòng 1541 tại snapshot đọc); nhánh BF-04-E3. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-45 — View Copied Sales Order List

- **ACTIVE · FE-06 — SO/xuất/giao · SC-16.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Related execution; Sales Staff — Own / assigned demand.
- **Mã quyền trong seed hiện tại:** `sales_order:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** SO source/customer/date/state filter tùy chọn.
- **Logic/kết quả:** List copied source + issued/net delivered/outstanding/DELIVERED/COMPLETED; read-only theo own/assigned.
- **Thiết kế BE:** SALES_ORDER query scope; compute current valid PGI/GR-FD/POD/cancel/confirmation versions.
- **Điểm đặt BE:** `src/modules/sales-orders` [đề xuất, chưa có route]; model/data: SALES_ORDER; ExternalReference/ExternalReferenceLine; BusinessOperation/SalesOrderCancellation.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-45 (dòng 1573 tại snapshot đọc); nhánh BF-06-A1, BF-06-A3. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-46 — View Copied Sales Order Details

- **ACTIVE · FE-06 — SO/xuất/giao · SC-16.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Related execution; Sales Staff — Own / assigned demand.
- **Mã quyền trong seed hiện tại:** `sales_order:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** SO ID/current source history.
- **Logic/kết quả:** Detail source lines/WIR/OD/GI/POD/PAY-CFM/cancellation/FD reopening; không pricing/invoice math.
- **Thiết kế BE:** Typed chain joins + DTO projection; don't conflate WIR completion with SO completion.
- **Điểm đặt BE:** `src/modules/sales-orders` — GET `/api/sales-orders/:id` đã triển khai; scope theo người tạo SO hoặc kho thực hiện. Xem README module về source chain, FD, conversion snapshots và giới hạn DTO.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-46 (dòng 1588 tại snapshot đọc); nhánh BF-06-A1, BF-06-A3. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-47 — Create Copied Sales Order

- **ACTIVE · FE-06 — SO/xuất/giao · SC-16.**
- **Quyền theo Report 3:** Sales Staff — create copied SO.
- **Mã quyền trong seed hiện tại:** `sales_order:create`→SALES.
- **Đầu vào/điều kiện:** Sales nhập source order+line/evidence ngay trên form SO theo quyết định 29/10/2026; customer/address/needDate/product/qty/UOM/tone/calibre. Không cần hồ sơ nguồn do Accountant tạo trước; không giả metadata xác minh kế toán.
- **Logic/kết quả:** Copy source duy nhất; chỉ provider version khi có, phone/Zalo phải có recorded order. Save SO không stock/reservation.
- **Thiết kế BE:** Unique ExternalReference+SO line source, snapshot conversions, BusinessOperation+SO/audit atomic.
- **Điểm đặt BE:** `src/modules/sales-orders` — POST `/api/sales-orders` và `/api/sales-orders/source-evidence` đã triển khai. Source/SO/lines/evidence/BusinessOperation/audit/outbox nguyên tử, không thay tồn/reservation. Xem README module và gói test `docs/api/fe06-iteration1`.
- **Điểm kiểm chứng:** Sai role/kho/version/nguồn/evidence phải từ chối; retry cùng key không nhân thao tác; kiểm boundary theo EX-01–05.
- **Truy vết:** Report 3 phần II, UC-47 (dòng 1603 tại snapshot đọc); nhánh BF-06-E1. Áp dụng BR chung và EX-01–05 khi liên quan.
- **Bổ sung 3.3.0:** Sau lưu SO thành công, đánh giá nguồn và hỏi tạo RR nếu còn thiếu; chỉ mở form khi user chọn. Ghi sự kiện SALES_ORDER_SAVED có version để đánh giá thiếu và Notification theo scope; RR có thể dùng SO-line trước khi có WIR.

### UC-48 — Update or Cancel Unissued Sales Order Remainder

- **ACTIVE · FE-06 — SO/xuất/giao · SC-16.**
- **Quyền theo Report 3:** Sales Staff — Edit/cancel unexecuted or GR-FD-received-back, not-redelivered quantity.
- **Mã quyền trong seed hiện tại:** `sales_order:update`→SALES.
- **Đầu vào/điều kiện:** Sales: original SO/version, requested change/cancel and eligible line qty/reason.
- **Logic/kết quả:** Chỉ unissued hoặc GR-FD received-back not-redelivered. Xử lý OD/WIR/task/reservations, append cancellations/recalc version, không hủy off-site unresolved.
- **Thiết kế BE:** Guard net fulfilment/downstream/FD reopening and cancellation events; release only eligible commitments, no stock movement.
- **Điểm đặt BE:** `src/modules/sales-orders` [đề xuất, chưa có route]; model/data: SALES_ORDER; ExternalReference/ExternalReferenceLine; BusinessOperation/SalesOrderCancellation.
- **Điểm kiểm chứng:** Hàng PGI chưa về không được cancel; GR-FD về chưa redeliver mới đủ điều kiện.
- **Truy vết:** Report 3 phần II, UC-48 (dòng 1618 tại snapshot đọc); nhánh BF-06-A1, BF-06-A2, BF-06-A3. Áp dụng BR chung và EX-01–05 khi liên quan.
- **Bổ sung 3.3.0:** SO thay lượng/nguồn/ngày cần phải đánh giá lại nhu cầu và pending coverage; mở Notification cũ không dùng snapshot cũ để tạo RR.

### UC-49 — View Outbound Delivery List

- **ACTIVE · FE-06 — SO/xuất/giao · SC-22.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Related execution; Sales Staff — Own / assigned demand.
- **Mã quyền trong seed hiện tại:** `outbound_delivery:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** OD warehouse/source/status/date filter tùy chọn.
- **Logic/kết quả:** List OD của linked WIR, read-only theo scope; original/replacement không duplicate demand.
- **Thiết kế BE:** OUTBOUND_DELIVERY query join WIR/SO chain and current net quantities, not mock status patch.
- **Điểm đặt BE:** `src/modules/sales-orders` — GET `/api/outbound-deliveries` đã triển khai, lọc scope trước phân trang; xem README module về filter và số lượng từ ledger.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-49 (dòng 1633 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-50 — View Outbound Delivery Details

- **ACTIVE · FE-06 — SO/xuất/giao · SC-22.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Related execution; Sales Staff — Own / assigned demand.
- **Mã quyền trong seed hiện tại:** `outbound_delivery:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** OD ID.
- **Logic/kết quả:** Detail WIR line allowance/warehouse/reservations/picking/GI/POD/replacement commitment history.
- **Thiết kế BE:** Validate source ownership chain, derive remaining from valid operations and transfers.
- **Điểm đặt BE:** `src/modules/sales-orders` — GET `/api/outbound-deliveries/:id` đã triển khai; typed WIR/SO chain, reservations, picking, GI/POD/GR-FD và commitment history; xem README module.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-50 (dòng 1647 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-51 — Create Outbound Delivery

- **ACTIVE · FE-06 — SO/xuất/giao · SC-22.**
- **Quyền theo Report 3:** Sales Staff — Plan OD/reuse or transfer reopened commitment without duplicate demand.
- **Mã quyền trong seed hiện tại:** `outbound_delivery:create`→SALES; `outbound_delivery:update`→SALES.
- **Đầu vào/điều kiện:** Sales: saved SO/WIR lines/current versions/warehouse/qty, optional reopening transfer.
- **Logic/kết quả:** Lập OD theo WIR allowance, reserve compatible stock một lần. GR-FD posted mới reopen; reuse OD hoặc transfer versioned commitment, không demand mới.
- **Thiết kế BE:** Conditional WIR/SO/OD guards + Reservation + OdCommitmentTransfer; from/to different, qty≤reopening allowance.
- **Điểm đặt BE:** `src/modules/outbound-deliveries` [đề xuất, chưa có route]; model/data: OUTBOUND_DELIVERY; Reservation; OdCommitmentTransfer.
- **Điểm kiểm chứng:** Replacement OD chỉ chuyển reopened commitment, không nhân WIR/SO demand.
- **Truy vết:** Report 3 phần II, UC-51 (dòng 1661 tại snapshot đọc); nhánh BF-04-A1, BF-06-E1, BF-06-A1. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-52 — View Picking Task List

- **ACTIVE · FE-06 — SO/xuất/giao · SC-23.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouse; Sales Staff — Related progress.
- **Mã quyền trong seed hiện tại:** `picking_task:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** Picking task/warehouse/source/status filters.
- **Logic/kết quả:** List assigned picking TO liên quan OD/GI draft, Sales chỉ progress.
- **Thiết kế BE:** Read picking task scope and source kind; do not return unrelated TO.
- **Điểm đặt BE:** `src/modules/picking-tasks` [đề xuất, chưa có route]; model/data: TO/WAREHOUSE_TASK; GI_SALE draft; Reservation.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-52 (dòng 1677 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-53 — View Picking Task Details

- **ACTIVE · FE-06 — SO/xuất/giao · SC-23.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouse; Sales Staff — Related progress.
- **Mã quyền trong seed hiện tại:** `picking_task:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** Picking task ID.
- **Logic/kết quả:** Required lot/location/assigned/reserved/actual/shortage/defect evidence.
- **Thiết kế BE:** DTO joins source OD/GI/reservation and evidence scope, read-only.
- **Điểm đặt BE:** `src/modules/picking-tasks` [đề xuất, chưa có route]; model/data: TO/WAREHOUSE_TASK; GI_SALE draft; Reservation.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-53 (dòng 1691 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-54 — Create Picking Task

- **ACTIVE · FE-06 — SO/xuất/giao · SC-23.**
- **Quyền theo Report 3:** Warehouse Staff — Perform; PGI only on actual handover.
- **Mã quyền trong seed hiện tại:** `picking_task:create`→WAREHOUSE.
- **Đầu vào/điều kiện:** Warehouse: OD + GI-S draft, compatible eligible stock/reservations.
- **Logic/kết quả:** Tạo picking TO sau draft GI; chọn compatible trước FIFO, substitutions có consent/reason; total chưa giảm.
- **Thiết kế BE:** Validate GI draft belongs OD/current source, preserve demand reservation; positive bounded qty and task coverage guards.
- **Điểm đặt BE:** `src/modules/picking-tasks` [đề xuất, chưa có route]; model/data: TO/WAREHOUSE_TASK; GI_SALE draft; Reservation.
- **Điểm kiểm chứng:** Sai role/kho/version/nguồn/evidence phải từ chối; retry cùng key không nhân thao tác; kiểm boundary theo EX-01–05.
- **Truy vết:** Report 3 phần II, UC-54 (dòng 1705 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-55 — Confirm Picking Task

- **ACTIVE · FE-06 — SO/xuất/giao · SC-23.**
- **Quyền theo Report 3:** Warehouse Staff — Perform; PGI only on actual handover.
- **Mã quyền trong seed hiện tại:** `picking_task:confirm`→WAREHOUSE.
- **Đầu vào/điều kiện:** Warehouse: open picking TO, actual BOX/PIECE/lot/location/quality/evidence.
- **Logic/kết quả:** Confirm storage→staging + reservation, partial/defect tách; shortage unexplained BF-05, defects BF-02. Handover chưa có không PGI; unpick có trace.
- **Thiết kế BE:** Atomic movement+reservation+task; recheck freeze/quality/caps; unpick linked operation not manual free stock.
- **Điểm đặt BE:** `src/modules/picking-tasks` [đề xuất, chưa có route]; model/data: TO/WAREHOUSE_TASK; GI_SALE draft; Reservation.
- **Điểm kiểm chứng:** Pick20 bàn giao18 chỉ PGI18; 2 staged/unpick giữ trace. Có stock effect: kiểm batch/ledger/balance/reservation/progress đồng nhất và rollback toàn bộ.
- **Truy vết:** Report 3 phần II, UC-55 (dòng 1719 tại snapshot đọc); nhánh BF-06-E2, BF-06-A2. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-56 — View goods issue list

- **ACTIVE · FE-06 — SO/xuất/giao · SC-17.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouse; Sales Staff — Related progress.
- **Mã quyền trong seed hiện tại:** `goods_issue:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** Source request/issue date/status filters.
- **Logic/kết quả:** List GI theo nguồn thực, draft khác posted; progress xem theo quyền.
- **Thiết kế BE:** GI_SALE/allowed issue kinds read scope; no financial invoice data.
- **Điểm đặt BE:** `src/modules/goods-issues` [đề xuất, chưa có route]; model/data: GI_SALE/SALES_GOODS_ISSUE; PostingBatch/StockMovement.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-56 (dòng 1735 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-57 — View goods issue details

- **ACTIVE · FE-06 — SO/xuất/giao · SC-17.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouse; Sales Staff — Related progress.
- **Mã quyền trong seed hiện tại:** `goods_issue:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** GI ID.
- **Logic/kết quả:** Lot/location/prepared/actual issued và source post batch/history.
- **Thiết kế BE:** Authorized ledger/source detail projection; no mutable balance controls.
- **Điểm đặt BE:** `src/modules/goods-issues` [đề xuất, chưa có route]; model/data: GI_SALE/SALES_GOODS_ISSUE; PostingBatch/StockMovement.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-57 (dòng 1753 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-58 — Post Goods Issue

- **ACTIVE · FE-06 — SO/xuất/giao · SC-17.**
- **Quyền theo Report 3:** Warehouse Staff — Draft GI-S before picking; post actual handover once.
- **Mã quyền trong seed hiện tại:** `goods_issue:create`→WAREHOUSE; `goods_issue:post`→WAREHOUSE.
- **Đầu vào/điều kiện:** OD/version; draft trước picking; post cần actual picked/TO/handover/stock/evidence.
- **Logic/kết quả:** Warehouse save GI DRAFT không stock; actual handover PGI một lần theo net cap. Print từ commit; sau PGI fail delivery dùng FD, không sửa GI/POD giả.
- **Thiết kế BE:** Single posting protocol: stock/reservation/ledger/source progress/audit/outbox; positive actual qty≤prepared/current allowance, no DELIVERED shortcut.
- **Điểm đặt BE:** `src/modules/goods-issues` [đề xuất, chưa có route]; model/data: GI_SALE/SALES_GOODS_ISSUE; PostingBatch/StockMovement.
- **Điểm kiểm chứng:** Retry/print/email fail không PGI lần hai; PGI không tự DELIVERED/COMPLETED. Có stock effect: kiểm batch/ledger/balance/reservation/progress đồng nhất và rollback toàn bộ.
- **Truy vết:** Report 3 phần II, UC-58 (dòng 1771 tại snapshot đọc); nhánh BF-06-A2, BF-06-E3. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-59 — View Internal Invoice List

- **RETIRED.** Hóa đơn bên ngoài; in phiếu kho theo UC-58.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-60 — View Internal Invoice Details

- **RETIRED.** Hóa đơn bên ngoài; in phiếu kho theo UC-58.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-61 — Create Internal Invoice

- **RETIRED.** Hóa đơn bên ngoài; in phiếu kho theo UC-58.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-62 — Issue Internal Invoice and Produce PDF

- **RETIRED.** Hóa đơn bên ngoài; in phiếu kho theo UC-58.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-63 — View defective goods list

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-11.**
- **Quyền theo Report 3:** Store Owner — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `defect:read`→OWNER/WAREHOUSE.
- **Đầu vào/điều kiện:** Warehouse/lot/status/reason tùy chọn.
- **Logic/kết quả:** Danh sách defect source/unresolvedQty/disposition theo scope.
- **Thiết kế BE:** DEFECT_CASE query with stocktake/source link; no automatic deduction.
- **Điểm đặt BE:** `src/modules/defects` / `src/modules/dispositions` [đề xuất, chưa có route]; model/data: DEFECT_CASE/DISPOSITION/SCRAP/RECLASS; DefectHold/Approval.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-63 (dòng 1875 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-64 — View defective goods details

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-11.**
- **Quyền theo Report 3:** Store Owner — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `defect:read`→OWNER/WAREHOUSE.
- **Đầu vào/điều kiện:** Defect case ID.
- **Logic/kết quả:** Affected source/owner/custody/qty/evidence/decision/outcomes; không giảm lặp giữa cases.
- **Thiết kế BE:** Aggregate outcome consumption per source+quantity, parent evidence scope.
- **Điểm đặt BE:** `src/modules/defects` / `src/modules/dispositions` [đề xuất, chưa có route]; model/data: DEFECT_CASE/DISPOSITION/SCRAP/RECLASS; DefectHold/Approval.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-64 (dòng 1892 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-65 — Inspect Defective Goods and Submit Disposition

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-11.**
- **Quyền theo Report 3:** Warehouse Staff — Inspect / isolate / propose.
- **Mã quyền trong seed hiện tại:** `defect:create`→WAREHOUSE.
- **Đầu vào/điều kiện:** Warehouse: defect source/lot/location/owner/qty/photo; stocktake scope nếu có.
- **Logic/kết quả:** Block allocation ngay; ngoài freeze propose disposition; SR đi BF-08; trong B1 chỉ hold/evidence và ST plan, không quality/location post thường.
- **Thiết kế BE:** Create DefectHold/audit against balance/source with race guard; preserve snapshot, block conservative balance until resolution.
- **Điểm đặt BE:** `src/modules/defects` / `src/modules/dispositions` [đề xuất, chưa có route]; model/data: DEFECT_CASE/DISPOSITION/SCRAP/RECLASS; DefectHold/Approval.
- **Điểm kiểm chứng:** Defect dưới freeze ghi hold ngay nhưng không đổi balance/snapshot.
- **Truy vết:** Report 3 phần II, UC-65 (dòng 1909 tại snapshot đọc); nhánh BF-02-E1, BF-02-A1, BF-06-E2. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-66 — Approve or reject defective goods disposition

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-11.**
- **Quyền theo Report 3:** Store Owner — Approve on-site scrap/regrade/release outside ST; not requester.
- **Mã quyền trong seed hiện tại:** `defect:approve`→OWNER.
- **Đầu vào/điều kiện:** Owner: outside-freeze disposition version/action/qty/evidence, khác requester.
- **Logic/kết quả:** Approve/reject/return scrap/regrade/release; SR không cần, B1 qua UC-92. Decision không deduct.
- **Thiết kế BE:** Owner approval guards source/version/action, no required authorization for SR; preserve unapproved hold.
- **Điểm đặt BE:** `src/modules/defects` / `src/modules/dispositions` [đề xuất, chưa có route]; model/data: DEFECT_CASE/DISPOSITION/SCRAP/RECLASS; DefectHold/Approval.
- **Điểm kiểm chứng:** SR không bị yêu cầu UC-66/Owner approval; B1 chỉ UC-92.
- **Truy vết:** Report 3 phần II, UC-66 (dòng 1924 tại snapshot đọc); nhánh BF-02-A2, BF-08-A2. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-67 — Record approved defective goods disposition

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-11.**
- **Quyền theo Report 3:** Warehouse Staff — Execute approved on-site action outside freeze; B1 through UC-93.
- **Mã quyền trong seed hiện tại:** `defect:execute`→WAREHOUSE.
- **Đầu vào/điều kiện:** Warehouse: approved outside-freeze action và actual execution/evidence.
- **Logic/kết quả:** Scrap actual giảm một lần, regrade/release total-preserving; SR chỉ UC-82 trừ, B1 UC-93 post.
- **Thiết kế BE:** Guard approval remaining+freeze+already consumed outcomes; linked batch and hold resolution atomically.
- **Điểm đặt BE:** `src/modules/defects` / `src/modules/dispositions` [đề xuất, chưa có route]; model/data: DEFECT_CASE/DISPOSITION/SCRAP/RECLASS; DefectHold/Approval.
- **Điểm kiểm chứng:** Không vừa BF-02 deduct rồi GI-SR deduct cùng lượng; ordinary post bị freeze chặn. Có stock effect: kiểm batch/ledger/balance/reservation/progress đồng nhất và rollback toàn bộ.
- **Truy vết:** Report 3 phần II, UC-67 (dòng 1939 tại snapshot đọc); nhánh BF-02-A2, BF-02-E2, BF-08-A2. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-68 — View customer return list

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-18.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — External follow-up; Warehouse Staff — Inspection / receipt scope; Sales Staff — Own / assigned returns.
- **Mã quyền trong seed hiện tại:** `customer_return:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** Mode CR/FD/source/reason/inspection/date/status filters.
- **Logic/kết quả:** CR nguồn POD/custody/D6/decision; FD GI/failure/ARR/GR-FD/reopened net. Sales chỉ related returns.
- **Thiết kế BE:** Union typed case reads scoped with source provenance; no D6 metadata fabricated for FD.
- **Điểm đặt BE:** `src/modules/customer-returns` / `src/modules/failed-deliveries` [đề xuất, chưa có route]; model/data: CUSTOMER_RETURN/FAILED_DELIVERY/GR_CUSTOMER_RETURN/GR_FAILED_DELIVERY; assessment/claim/reopening.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-68 (dòng 1954 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-69 — View customer return details

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-18.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — External follow-up; Warehouse Staff — Inspection / receipt scope; Sales Staff — Own / assigned returns.
- **Mã quyền trong seed hiện tại:** `customer_return:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** CR/FD ID.
- **Logic/kết quả:** Detail source/condition/assessment versions/decision/GR/custody hoặc FD reopening; external finance độc lập.
- **Thiết kế BE:** Source/assessment/claim/receipt/reopening DTO joins, permission scoped evidence and financial projection.
- **Điểm đặt BE:** `src/modules/customer-returns` / `src/modules/failed-deliveries` [đề xuất, chưa có route]; model/data: CUSTOMER_RETURN/FAILED_DELIVERY/GR_CUSTOMER_RETURN/GR_FAILED_DELIVERY; assessment/claim/reopening.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-69 (dòng 1973 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-70 — Create Customer Return Request

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-18.**
- **Quyền theo Report 3:** Sales Staff — Create / check source and conditions.
- **Mã quyền trong seed hiện tại:** `customer_return:create`→SALES.
- **Đầu vào/điều kiện:** Sales: customer-received POD/GI hoặc verified historical source, qty/reason/terms evidence.
- **Logic/kết quả:** Create CR/OPEN claim trong cap received - posted GR-CR - OPEN CR; UNKNOWN chờ, excluded không GR; chưa owned receipt/refund/reopen.
- **Thiết kế BE:** Common source guard + ReturnSourceClaim with exact source XOR; no fake historical GI/POD, no source cap via header-only.
- **Điểm đặt BE:** `src/modules/customer-returns` / `src/modules/failed-deliveries` [đề xuất, chưa có route]; model/data: CUSTOMER_RETURN/FAILED_DELIVERY/GR_CUSTOMER_RETURN/GR_FAILED_DELIVERY; assessment/claim/reopening.
- **Điểm kiểm chứng:** CR dùng received POD cap, không gross PGI; historical source chưa verified phải chờ.
- **Truy vết:** Report 3 phần II, UC-70 (dòng 1992 tại snapshot đọc); nhánh BF-06-E3, BF-07-A1, BF-07-E2, BF-07-A3. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-71 — Decide Customer Return Acceptance

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-18.**
- **Quyền theo Report 3:** Store Owner — Eligible EXCEPTION_APPROVAL only; not requester; Sales Staff — STANDARD_ACCEPTANCE after inspection; own ordinary CR allowed.
- **Mã quyền trong seed hiện tại:** `customer_return:accept`→SALES; `customer_return:approve_exception`→OWNER.
- **Đầu vào/điều kiện:** Current Warehouse inspection/latest assessment+version, decision kind/line qty/reason.
- **Logic/kết quả:** Sales STANDARD_ACCEPTANCE ca thường kể cả creator; Owner EXCEPTION_APPROVAL khác proposer chỉ eligible exception. PENDING/INELIGIBLE không vượt; đổi case/version review mới.
- **Thiết kế BE:** Approval decisionKind + latest assessment/inspection + source/qty/version guard; self exception only standardized ordinary Sales.
- **Điểm đặt BE:** `src/modules/customer-returns` / `src/modules/failed-deliveries` [đề xuất, chưa có route]; model/data: CUSTOMER_RETURN/FAILED_DELIVERY/GR_CUSTOMER_RETURN/GR_FAILED_DELIVERY; assessment/claim/reopening.
- **Điểm kiểm chứng:** Sales own ordinary inspected CR được phép; Owner không override installed/customer-damaged/overdue.
- **Truy vết:** Report 3 phần II, UC-71 (dòng 2007 tại snapshot đọc); nhánh BF-07-E1, BF-07-A2, BF-07-E2. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-72 — Inspect Return or Failed-Delivery Intake

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-18.**
- **Quyền theo Report 3:** Warehouse Staff — Inspect CR/custody/D6 or GI-linked FD without customer custody.
- **Mã quyền trong seed hiện tại:** `customer_return:inspect`→WAREHOUSE.
- **Đầu vào/điều kiện:** Warehouse: actual CR arrival/source hoặc FD posted undelivered GI/failure evidence.
- **Logic/kết quả:** CR custody+inspection+D6 assessment append; FD ARR/INS và source claim không custody khách/D6/approval. Chưa post owned/reopen.
- **Thiết kế BE:** Verify assigned receiving scope, source chain, per-GI POD-FD caps; immutable assessment for CR, claim reservation not stock reservation.
- **Điểm đặt BE:** `src/modules/customer-returns` / `src/modules/failed-deliveries` [đề xuất, chưa có route]; model/data: CUSTOMER_RETURN/FAILED_DELIVERY/GR_CUSTOMER_RETURN/GR_FAILED_DELIVERY; assessment/claim/reopening.
- **Điểm kiểm chứng:** FD không D6/custody khách/POD giả; CR unknown deadline vẫn PENDING.
- **Truy vết:** Report 3 phần II, UC-72 (dòng 2022 tại snapshot đọc); nhánh BF-07-E1, BF-07-A2. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-73 — Post Customer Return or Failed-Delivery Receipt

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-18.**
- **Quyền theo Report 3:** Warehouse Staff — Post GR-CR under proper decision or GR-FD with atomic net reopening.
- **Mã quyền trong seed hiện tại:** `customer_return:post`→WAREHOUSE.
- **Đầu vào/điều kiện:** Warehouse: CR current eligible decision hoặc actual FD inspection/evidence/claim, current source versions.
- **Logic/kết quả:** CR accepted ownership convert custody; rejected đến actual handback. FD receipt+claim consume+reopen original net/version cùng commit; quality split và put-away; CR không reopen.
- **Thiết kế BE:** Posting protocol + common GI guard; GR_FAILED_DELIVERY lines/unique DemandReopening; rollback toàn receipt/reopening; reversal check downstream.
- **Điểm đặt BE:** `src/modules/customer-returns` / `src/modules/failed-deliveries` [đề xuất, chưa có route]; model/data: CUSTOMER_RETURN/FAILED_DELIVERY/GR_CUSTOMER_RETURN/GR_FAILED_DELIVERY; assessment/claim/reopening.
- **Điểm kiểm chứng:** PGI10/POD7 chỉ FD3; rollback receipt cũng rollback reopening; GR-CR không reopen. Có stock effect: kiểm batch/ledger/balance/reservation/progress đồng nhất và rollback toàn bộ.
- **Truy vết:** Report 3 phần II, UC-73 (dòng 2038 tại snapshot đọc); nhánh BF-06-E3, BF-07-E1, BF-07-A2, BF-07-E2, BF-07-A3. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-74 — View Refund Request List

- **RETIRED.** Hoàn tiền bên ngoài, chỉ tham chiếu UC-108.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-75 — View Refund Request Details

- **RETIRED.** Hoàn tiền bên ngoài, chỉ tham chiếu UC-108.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-76 — Create Customer Return Refund Request

- **RETIRED.** Hoàn tiền bên ngoài, chỉ tham chiếu UC-108.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-77 — Review Customer Return Refund Request

- **RETIRED.** Hoàn tiền bên ngoài, chỉ tham chiếu UC-108.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-78 — Record Refund Completion

- **RETIRED.** Hoàn tiền bên ngoài, chỉ tham chiếu UC-108.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-79 — View supplier return request list

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-19.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Agreement / reconciliation scope; Warehouse Staff — Assigned warehouse.
- **Mã quyền trong seed hiện tại:** `supplier_return:read`→OWNER/ACCOUNTANT/WAREHOUSE.
- **Đầu vào/điều kiện:** Supplier/lot/reason/agreement/reconciliation filters.
- **Logic/kết quả:** List SR source receipt/qty/agreement/warehouse status; không pending Owner approval.
- **Thiết kế BE:** SUPPLIER_RETURN scoped query, preserve separate finance status.
- **Điểm đặt BE:** `src/modules/supplier-returns` [đề xuất, chưa có route]; model/data: SUPPLIER_RETURN/GI_SUPPLIER_RETURN/SUPPLIER_ACK; agreement/EXT-REF.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-79 (dòng 2085 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-80 — View supplier return request details

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-19.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Agreement / reconciliation scope; Warehouse Staff — Assigned warehouse.
- **Mã quyền trong seed hiện tại:** `supplier_return:read`→OWNER/ACCOUNTANT/WAREHOUSE.
- **Đầu vào/điều kiện:** SR ID.
- **Logic/kết quả:** Lot/location/source GR/verified agreement/actual GI/ACK/Accountant resolution.
- **Thiết kế BE:** Project source/agreement/version/dispatch/variance/evidence, no fake authorizationId prerequisite.
- **Điểm đặt BE:** `src/modules/supplier-returns` [đề xuất, chưa có route]; model/data: SUPPLIER_RETURN/GI_SUPPLIER_RETURN/SUPPLIER_ACK; agreement/EXT-REF.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-80 (dòng 2102 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-81 — Create Supplier Return Request

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-19.**
- **Quyền theo Report 3:** Warehouse Staff — Propose/isolate; Accountant agreement, no Owner.
- **Mã quyền trong seed hiện tại:** `supplier_return:create`→WAREHOUSE; `supplier_return:update`→WAREHOUSE.
- **Đầu vào/điều kiện:** Warehouse: NCC/PO-GR/source lot/location/owner/qty/reason/evidence.
- **Logic/kết quả:** Create SR và block defect/reserve GOOD; request Accountant agreement, chưa giảm stock; không UC-106/BF-02 gate.
- **Thiết kế BE:** Source cumulative return guard and proposal reservation/hold; SR AGREEMENT_PENDING, no stock batch.
- **Điểm đặt BE:** `src/modules/supplier-returns` [đề xuất, chưa có route]; model/data: SUPPLIER_RETURN/GI_SUPPLIER_RETURN/SUPPLIER_ACK; agreement/EXT-REF.
- **Điểm kiểm chứng:** SR không route UC-106; proposal không trừ stock, GOOD được reserve/defect block.
- **Truy vết:** Report 3 phần II, UC-81 (dòng 2119 tại snapshot đọc); nhánh BF-08-A1. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-82 — Confirm Supplier Return Dispatch

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-19.**
- **Quyền theo Report 3:** Warehouse Staff — Post actual agreed GI-SR/custody release; no Owner.
- **Mã quyền trong seed hiện tại:** `supplier_return:dispatch`→WAREHOUSE.
- **Đầu vào/điều kiện:** Warehouse: Accountant-verified agreement đúng source/qty/version/evidence, actual pick/handover.
- **Logic/kết quả:** GI-SR owned deduct một lần hoặc custody release chỉ custody; consume hold; chờ actual ACK, không Owner.
- **Thiết kế BE:** Atomic dispatch batch/stock/reservation/handovers/progress, guard current agreement/freeze/owner/source.
- **Điểm đặt BE:** `src/modules/supplier-returns` [đề xuất, chưa có route]; model/data: SUPPLIER_RETURN/GI_SUPPLIER_RETURN/SUPPLIER_ACK; agreement/EXT-REF.
- **Điểm kiểm chứng:** NCC lấy4 custody chưa owned chỉ giảm custody; ACK không trừ thêm. Có stock effect: kiểm batch/ledger/balance/reservation/progress đồng nhất và rollback toàn bộ.
- **Truy vết:** Report 3 phần II, UC-82 (dòng 2134 tại snapshot đọc); nhánh BF-02-E2, BF-08-E1. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-83 — Review Supplier Return Closure

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-19.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconcile and close accounted warehouse quantities.
- **Mã quyền trong seed hiện tại:** `supplier_return:close`→ACCOUNTANT.
- **Đầu vào/điều kiện:** Accountant: actual GI/ACK và evidenced agreed resolution từng quantity.
- **Logic/kết quả:** Đối chiếu/đóng khi mọi lượng accounted; missing/disputed giữ open; finance independent. Không trừ/thu tiền hay Owner review.
- **Thiết kế BE:** Reconcile read/write current source and outcomes; BusinessOperation/audit no stock mutation; no close if unexplained qty.
- **Điểm đặt BE:** `src/modules/supplier-returns` [đề xuất, chưa có route]; model/data: SUPPLIER_RETURN/GI_SUPPLIER_RETURN/SUPPLIER_ACK; agreement/EXT-REF.
- **Điểm kiểm chứng:** Dispute chưa resolve chặn close; finance pending không bắt phần kho chờ nếu đã accounted.
- **Truy vết:** Report 3 phần II, UC-83 (dòng 2149 tại snapshot đọc); nhánh BF-08-E2, BF-08-A3. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-84 — View stocktake list

- **ACTIVE · FE-08 — Kiểm kê/B1 · SC-14.**
- **Quyền theo Report 3:** Store Owner — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `stocktake:read`→OWNER/WAREHOUSE.
- **Đầu vào/điều kiện:** Warehouse/scope/cutoff/status filters.
- **Logic/kết quả:** List phiên theo quyền Owner/Warehouse; PLANNED khác snapshot active.
- **Thiết kế BE:** Scoped STOCKTAKE query, no activation side effects.
- **Điểm đặt BE:** `src/modules/stocktakes` [đề xuất, chưa có route]; model/data: STOCKTAKE/LocationLock/StocktakeSnapshot/CountAttempt/DefectHold.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-84 (dòng 2187 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-85 — View stocktake details

- **ACTIVE · FE-08 — Kiểm kê/B1 · SC-14.**
- **Quyền theo Report 3:** Store Owner — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `stocktake:read`→OWNER/WAREHOUSE.
- **Đầu vào/điều kiện:** Stocktake ID.
- **Logic/kết quả:** Snapshot/count attempts/recounts/quality-location variance và hold; không lấy current balance thay book.
- **Thiết kế BE:** Read immutable snapshots and attempts with scope and current plan; no overwrite on load.
- **Điểm đặt BE:** `src/modules/stocktakes` [đề xuất, chưa có route]; model/data: STOCKTAKE/LocationLock/StocktakeSnapshot/CountAttempt/DefectHold.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-85 (dòng 2204 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-86 — Create Stocktake Session

- **ACTIVE · FE-08 — Kiểm kê/B1 · SC-14.**
- **Quyền theo Report 3:** Store Owner — Plan session.
- **Mã quyền trong seed hiện tại:** `stocktake:create`→OWNER.
- **Đầu vào/điều kiện:** Owner: kho/location/date/counters/target scope.
- **Logic/kết quả:** Plan monthly/targeted, kiểm feasibility/overlap; lưu PLANNED chưa freeze/snapshot. Không job auto session.
- **Thiết kế BE:** Validate known scope/assignment; persist STOCKTAKE only, activation at UC-87.
- **Điểm đặt BE:** `src/modules/stocktakes` [đề xuất, chưa có route]; model/data: STOCKTAKE/LocationLock/StocktakeSnapshot/CountAttempt/DefectHold.
- **Điểm kiểm chứng:** Sai role/kho/version/nguồn/evidence phải từ chối; retry cùng key không nhân thao tác; kiểm boundary theo EX-01–05.
- **Truy vết:** Report 3 phần II, UC-86 (dòng 2221 tại snapshot đọc); nhánh BF-05-E1. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-87 — Perform Stocktake Count and Record Results

- **ACTIVE · FE-08 — Kiểm kê/B1 · SC-14.**
- **Quyền theo Report 3:** Warehouse Staff — Count / reconcile / propose within locked scope.
- **Mã quyền trong seed hiện tại:** `stocktake:update`→WAREHOUSE.
- **Đầu vào/điều kiện:** Owner-planned scope, resolved tasks, no overlapping freeze; Warehouse actual counts.
- **Logic/kết quả:** Activate snapshot+freeze atomic; append BOX/PIECE/quality/owner count/recount; found row book0; hold/evidence B1 balance-neutral, không adjustment.
- **Thiết kế BE:** Activation competes same location guards as postings; Snapshot/CountAttempt append-only, scope protected, no ordinary quality mutation.
- **Điểm đặt BE:** `src/modules/stocktakes` [đề xuất, chưa có route]; model/data: STOCKTAKE/LocationLock/StocktakeSnapshot/CountAttempt/DefectHold.
- **Điểm kiểm chứng:** Blank không thành zero; activation race với posting không lọt freeze; count attempts không overwrite.
- **Truy vết:** Report 3 phần II, UC-87 (dòng 2236 tại snapshot đọc); nhánh BF-05-E1, BF-05-A1, BF-05-E2. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-88 — Reconcile Stocktake

- **ACTIVE · FE-08 — Kiểm kê/B1 · SC-14.**
- **Quyền theo Report 3:** Warehouse Staff — Count / reconcile / propose within locked scope.
- **Mã quyền trong seed hiện tại:** `stocktake:reconcile`→WAREHOUSE.
- **Đầu vào/điều kiện:** Complete valid counts/selected attempts + immutable snapshot/current version.
- **Logic/kết quả:** Compare quantity và quality/location riêng; đủ căn cứ plan trực tiếp, chưa rõ Start/Enter Recount lặp; no variance+no hold/task mới close/unlock.
- **Thiết kế BE:** Reconcile selected attempts/source/UOM; no ADJ0/fictitious shortage; guard closure atomically against new holds.
- **Điểm đặt BE:** `src/modules/stocktakes` [đề xuất, chưa có route]; model/data: STOCKTAKE/LocationLock/StocktakeSnapshot/CountAttempt/DefectHold.
- **Điểm kiểm chứng:** Có bằng chứng cho shortage2 được plan trực tiếp, chưa rõ mới recount; quality variance không giả shortage.
- **Truy vết:** Report 3 phần II, UC-88 (dòng 2252 tại snapshot đọc); nhánh BF-05-A1, BF-05-A2. Áp dụng BR chung và EX-01–05 khi liên quan.
- **Bổ sung 3.3.0:** Kết quả đang đếm/đối chiếu chưa là nguồn cảnh báo tồn thấp sau chốt. Hoàn tất nhánh không lệch cũng phát STOCKTAKE_CLOSED chỉ sau commit/unlock hợp lệ.

### UC-89 — View inventory adjustment request list

- **ACTIVE · FE-08 — Kiểm kê/B1 · SC-15.**
- **Quyền theo Report 3:** Store Owner — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `stock_adjustment:read`→OWNER/WAREHOUSE.
- **Đầu vào/điều kiện:** Stocktake/lot/location/approval status filter.
- **Logic/kết quả:** List adjustments/resolution, quality-only ST_RESOLUTION cũng phải nhìn thấy; read-only.
- **Thiết kế BE:** Query ST_RESOLUTION + actual ADJ links, distinguish plan from stock posting.
- **Điểm đặt BE:** `src/modules/stocktake-resolutions` [đề xuất, chưa có route]; model/data: ST_RESOLUTION/ADJUSTMENT/RECLASS; Approval/DefectHold/PostingBatch.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-89 (dòng 2268 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-90 — View inventory adjustment request details

- **ACTIVE · FE-08 — Kiểm kê/B1 · SC-15.**
- **Quyền theo Report 3:** Store Owner — View; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `stock_adjustment:read`→OWNER/WAREHOUSE.
- **Đầu vào/điều kiện:** Resolution/adjustment ID.
- **Logic/kết quả:** Book/selected count/before-after/reason/evidence/current approval/exec/batch.
- **Thiết kế BE:** Typed line actions/caps/count versions + approval/execution refs; no editing posted plan.
- **Điểm đặt BE:** `src/modules/stocktake-resolutions` [đề xuất, chưa có route]; model/data: ST_RESOLUTION/ADJUSTMENT/RECLASS; Approval/DefectHold/PostingBatch.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-90 (dòng 2285 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-91 — Create Inventory Adjustment Request

- **ACTIVE · FE-08 — Kiểm kê/B1 · SC-15.**
- **Quyền theo Report 3:** Warehouse Staff — Propose B1 delta/RECLASS/location and confirm execution.
- **Mã quyền trong seed hiện tại:** `stock_adjustment:create`→WAREHOUSE; `stock_adjustment:update`→WAREHOUSE.
- **Đầu vào/điều kiện:** Warehouse: ST/count/hold/current version, explained qty/quality/location/evidence.
- **Logic/kết quả:** Lập ST_RESOLUTION: nonzero DELTA riêng total-preserving RECLASS/RELOCATE. Bản plan/execution evidence không ordinary post; submit distinct Owner.
- **Thiết kế BE:** ST_RESOLUTION typed lines + selected CountAttempt/hold; executedBy/At/evidence all-or-none, changed plan invalidates approval.
- **Điểm đặt BE:** `src/modules/stocktake-resolutions` [đề xuất, chưa có route]; model/data: ST_RESOLUTION/ADJUSTMENT/RECLASS; Approval/DefectHold/PostingBatch.
- **Điểm kiểm chứng:** Book50/count48GOOD+2broken => RECLASS2, không shortage2/ADJ0.
- **Truy vết:** Report 3 phần II, UC-91 (dòng 2302 tại snapshot đọc); nhánh BF-05-A2. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-92 — Approve Stocktake Resolution

- **ACTIVE · FE-08 — Kiểm kê/B1 · SC-15.**
- **Quyền theo Report 3:** Store Owner — Approve/return current B1 resolution; not requester.
- **Mã quyền trong seed hiện tại:** `stock_adjustment:approve`→OWNER.
- **Đầu vào/điều kiện:** Owner khác proposer: latest count/plan/version/hold/evidence.
- **Logic/kết quả:** Review approve/reject/return exact action/qty/version, quality-only vẫn approval; không post/unlock. Require Warehouse execution và UC-93.
- **Thiết kế BE:** Append Approval binds planVersion/count/action lines; same-user deny; no stock mutation.
- **Điểm đặt BE:** `src/modules/stocktake-resolutions` [đề xuất, chưa có route]; model/data: ST_RESOLUTION/ADJUSTMENT/RECLASS; Approval/DefectHold/PostingBatch.
- **Điểm kiểm chứng:** Approve không unlock; plan đổi version cần duyệt mới, Owner khác proposer.
- **Truy vết:** Report 3 phần II, UC-92 (dòng 2317 tại snapshot đọc); nhánh BF-05-A3. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-93 — Clear Stocktake Difference

- **ACTIVE · FE-08 — Kiểm kê/B1 · SC-15.**
- **Quyền theo Report 3:** Store Owner — Post approved B1 batch after Warehouse execution; unlock resolved scope.
- **Mã quyền trong seed hiện tại:** `stock_adjustment:post`→OWNER.
- **Đầu vào/điều kiện:** Owner: UC-92 current approval/count/plan, Warehouse actual execution/evidence, resolvable tasks/holds.
- **Logic/kết quả:** One batch actual DELTA khác0 nếu có + RECLASS/location; only committed complete closure unlock/resolve holds. Lỗi rollback giữ freeze.
- **Thiết kế BE:** Atomic stock batch+source guard+plan+hold+lock release+audit/outbox; recheck execution/version and ledger before/after.
- **Điểm đặt BE:** `src/modules/stocktake-resolutions` [đề xuất, chưa có route]; model/data: ST_RESOLUTION/ADJUSTMENT/RECLASS; Approval/DefectHold/PostingBatch.
- **Điểm kiểm chứng:** Book50/count46GOOD+2broken => delta-2+RECLASS2; lỗi giữ freeze/hold và rollback tất cả. Có stock effect: kiểm batch/ledger/balance/reservation/progress đồng nhất và rollback toàn bộ.
- **Truy vết:** Report 3 phần II, UC-93 (dòng 2332 tại snapshot đọc); nhánh BF-05-A3, BF-05-E2. Áp dụng BR chung và EX-01–05 khi liên quan.
- **Bổ sung 3.3.0:** Ghi STOCKTAKE_CLOSED + documentVersion cùng transaction chốt/unlock. Consumer sau commit báo Warehouse đúng kho, Owner không tự tạo RR; lỗi thông báo retry riêng.

### UC-94 — Sign in to the system

- **ACTIVE · FE-09 — Quản trị/báo cáo/truy vết · SC-01.**
- **Quyền theo Report 3:** Store Owner — Use; Accountant — Use; Warehouse Staff — Use; Sales Staff — Use; Administrator — Use.
- **Mã quyền trong seed hiện tại:** UC-94 dùng authenticated session; login chưa yêu cầu business permission..
- **Đầu vào/điều kiện:** Active personal username/password.
- **Logic/kết quả:** Verify hash/active server; session giữ role/permissions/warehouse scope, không default Admin rights; không log credential.
- **Thiết kế BE:** Reuse auth routes/service; trustworthy req.user; secure env secrets; scope DTO contract with FE, not JWT claim alone.
- **Điểm đặt BE:** `src/modules/auth` [module đã có; cần đối chiếu quyền/contract]; model/data: User/Role/Permission.
- **Điểm kiểm chứng:** Sai role/kho/version/nguồn/evidence phải từ chối; retry cùng key không nhân thao tác; kiểm boundary theo EX-01–05.
- **Truy vết:** Report 3 phần II, UC-94 (dòng 2363 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-95 — View account list

- **ACTIVE · FE-09 — Quản trị/báo cáo/truy vết · SC-02.**
- **Quyền theo Report 3:** Administrator — View.
- **Mã quyền trong seed hiện tại:** `user:read`→ADMIN.
- **Đầu vào/điều kiện:** Admin: name/role/active-status filters và page/limit.
- **Logic/kết quả:** Account list read-only, không passwordHash; Owner không tự được quyền xem tài khoản theo baseline.
- **Thiết kế BE:** Fix permission prerequisite, scoped admin query/projection, whitelist bounded pagination and search.
- **Điểm đặt BE:** `src/modules/users` / `src/modules/roles` [module đã có; cần đối chiếu quyền/contract]; model/data: User/Role/Permission/warehouseIds; AuditEvent.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-95 (dòng 2377 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-96 — View account details

- **ACTIVE · FE-09 — Quản trị/báo cáo/truy vết · SC-02.**
- **Quyền theo Report 3:** Administrator — View.
- **Mã quyền trong seed hiện tại:** `user:read`→ADMIN.
- **Đầu vào/điều kiện:** Admin: account ID.
- **Logic/kết quả:** Account detail staff single role/status/permitted operations/warehouse scope; preserve historical identity.
- **Thiết kế BE:** Direct getById permission equal list, safe DTO and ObjectId validation.
- **Điểm đặt BE:** `src/modules/users` / `src/modules/roles` [module đã có; cần đối chiếu quyền/contract]; model/data: User/Role/Permission/warehouseIds; AuditEvent.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-96 (dòng 2394 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-97 — Maintain Staff Account

- **ACTIVE · FE-09 — Quản trị/báo cáo/truy vết · SC-02.**
- **Quyền theo Report 3:** Administrator — Perform.
- **Mã quyền trong seed hiện tại:** `user:create`→ADMIN; `user:update`→ADMIN.
- **Đầu vào/điều kiện:** Admin: unique username/fullName/contact/password/active.
- **Logic/kết quả:** Maintain account/lock, protect credential hash/audit/actor history; role/warehouse assignments belong UC-98. Không default business approval.
- **Thiết kế BE:** Whitelist payload, bcrypt hash, duplicate unique-index handling, inactive login denied; preserve audit refs and avoid self-lock bypass.
- **Điểm đặt BE:** `src/modules/users` / `src/modules/roles` [module đã có; cần đối chiếu quyền/contract]; model/data: User/Role/Permission/warehouseIds; AuditEvent.
- **Điểm kiểm chứng:** Sai role/kho/version/nguồn/evidence phải từ chối; retry cùng key không nhân thao tác; kiểm boundary theo EX-01–05.
- **Truy vết:** Report 3 phần II, UC-97 (dòng 2411 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-98 — Assign roles and operation permissions

- **ACTIVE · FE-09 — Quản trị/báo cáo/truy vết · SC-02.**
- **Quyền theo Report 3:** Administrator — Maintain existing role / operation / warehouse scope.
- **Mã quyền trong seed hiện tại:** `access_control:read`→ADMIN; `access_control:create`→ADMIN; `access_control:update`→ADMIN.
- **Đầu vào/điều kiện:** Admin: one existing roleCode/operation catalogue/warehouseIds và account/role version.
- **Logic/kết quả:** Gán đúng một trong 5 role/finite operations/assigned warehouses, audit changes, future requests enforce; no retired/arbitrary permissions; mỗi user đúng một role, vẫn kiểm SoD theo userId.
- **Thiết kế BE:** Extend missing assignment path; whitelist PERMISSION_CATALOGUE, validate role-operation restrictions/warehouse existence and audit; no Permission.create arbitrary code.
- **Điểm đặt BE:** `src/modules/users` / `src/modules/roles` [module đã có; cần đối chiếu quyền/contract]; model/data: User/Role/Permission/warehouseIds; AuditEvent.
- **Điểm kiểm chứng:** Từ chối quyền retired/arbitrary, gán nhiều role và đổi role để lách SoD.
- **Truy vết:** Report 3 phần II, UC-98 (dòng 2425 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-99 — View Operational Reports

- **ACTIVE · FE-09 — Quản trị/báo cáo/truy vết · SC-20.**
- **Quyền theo Report 3:** Store Owner — All report groups; Accountant — Movement; purchase/receipt; Warehouse Staff — Movement; stock; transfer; stocktake.
- **Mã quyền trong seed hiện tại:** `report:read`→OWNER/ACCOUNTANT/WAREHOUSE.
- **Đầu vào/điều kiện:** Report group/filter/date range/warehouse/product tùy chọn.
- **Logic/kết quả:** Owner all groups; Accountant movement+purchase/receipt; Warehouse movement+stock+transfer+stocktake. Không revenue/profit; read-only.
- **Thiết kế BE:** Authorize group on server dù report:read, scoped aggregation and cutoff dimensions; no fabricated SLA/financial metrics.
- **Điểm đặt BE:** `src/modules/reports` [đề xuất, chưa có route]; model/data: Scoped stock/document aggregations.
- **Điểm kiểm chứng:** Accountant không đọc stocktake report chỉ vì có report:read; export giữ scope.
- **Truy vết:** Report 3 phần II, UC-99 (dòng 2439 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-100 — View stock movement log

- **ACTIVE · FE-09 — Quản trị/báo cáo/truy vết · SC-21.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Purchase / supplier scope; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `stock_movement:read`→OWNER/ACCOUNTANT/WAREHOUSE.
- **Đầu vào/điều kiện:** Product/lot/warehouse/location/type/time filters.
- **Logic/kết quả:** Movement log source/before-after/operator; Owner/Warehouse scope, Accountant purchase/supplier scope; no edit.
- **Thiết kế BE:** StockMovement append-only queries, correct time filter/scope/sort and source projection.
- **Điểm đặt BE:** `src/modules/stock-movements` / `src/modules/trace` [đề xuất, chưa có route]; model/data: StockMovement/PostingBatch/DocumentLink/LineLink/AuditEvent.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-100 (dòng 2453 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-101 — View stock movement details

- **ACTIVE · FE-09 — Quản trị/báo cáo/truy vết · SC-21.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Purchase / supplier scope; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `stock_movement:read`→OWNER/ACCOUNTANT/WAREHOUSE.
- **Đầu vào/điều kiện:** Movement ID.
- **Logic/kết quả:** Chi tiết committed batch/source/product/lot/location/before-after/actor/time.
- **Thiết kế BE:** Authorize parent doc/warehouse and account owner before returning ledger/evidence.
- **Điểm đặt BE:** `src/modules/stock-movements` / `src/modules/trace` [đề xuất, chưa có route]; model/data: StockMovement/PostingBatch/DocumentLink/LineLink/AuditEvent.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-101 (dòng 2471 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-102 — Trace a product lot through source documents

- **ACTIVE · FE-09 — Quản trị/báo cáo/truy vết · SC-21.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Purchase / supplier scope; Warehouse Staff — View.
- **Mã quyền trong seed hiện tại:** `stock_movement:read`→OWNER/ACCOUNTANT/WAREHOUSE.
- **Đầu vào/điều kiện:** Product/lot/time range tùy chọn.
- **Logic/kết quả:** Trace receipts/transfers/issues/returns/adjustments theo chain including source SO/WIR/POD/PAY-CFM where authorized; không giả missing history.
- **Thiết kế BE:** Traverse DocumentLink/LineLink/source IDs scoped, avoid duplicate event legs masquerading extra stock.
- **Điểm đặt BE:** `src/modules/stock-movements` / `src/modules/trace` [đề xuất, chưa có route]; model/data: StockMovement/PostingBatch/DocumentLink/LineLink/AuditEvent.
- **Điểm kiểm chứng:** Empty hợp lệ; invalid filter/date giữ input; truy cập detail/export/evidence ngoài scope bị chặn; GET không đổi trạng thái hoặc stock.
- **Truy vết:** Report 3 phần II, UC-102 (dòng 2489 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-103 — View and Select Shortage Fulfilment Options

- **ACTIVE · FE-06 — Nhu cầu và xác nhận · SC-10, SC-16.**
- **Quyền theo Report 3:** Store Owner — View; Warehouse Staff — View / select stock option; Sales Staff — View / confirm customer fulfilment.
- **Mã quyền trong seed hiện tại:** `fulfilment_option:read`→OWNER/WAREHOUSE/SALES; `fulfilment_option:select`→WAREHOUSE/SALES.
- **Đầu vào/điều kiện:** Shortage source demand/required identity/date và candidate supply.
- **Logic/kết quả:** Compare compatible available vs timely allocated incoming; Sales/Warehouse chọn direct/transfer/replenish/wait; Owner view only; không auto purchase/post.
- **Thiết kế BE:** Pure scoped suggestion + selection linkage; no stock effect until authorized downstream reservation/dispatch/RR/TR.
- **Điểm đặt BE:** `src/modules/inventory` / `src/modules/fulfilment-options` [đề xuất, chưa có route]; model/data: StockBalance/StockAccount/Reservation/DefectHold/DemandSupplyAllocation.
- **Điểm kiểm chứng:** Need80 main30 other50 compatible => đề xuất direct/transfer, không tự tạo PO50.
- **Truy vết:** Report 3 phần II, UC-103 (dòng 1811 tại snapshot đọc); nhánh BF-01-A1, BF-02-E1, BF-04-A1, BF-06-A1. Áp dụng BR chung và EX-01–05 khi liên quan.
- **Bổ sung 3.3.0:** Hiển thị nguồn/coverage và nút Tạo yêu cầu mở form điền sẵn. SO vừa lưu còn thiếu mới thì hỏi tạo RR, kể cả thiếu một phần; chưa rõ đánh giá không coi là nguồn0. Refresh/retry không tự lặp hộp thoại.

### UC-104 — Inspect and Post Transfer Receipt

- **ACTIVE · FE-05 — Nhận điều chuyển · SC-13.**
- **Quyền theo Report 3:** Warehouse Staff — Destination receive/post; independent from dispatcher.
- **Mã quyền trong seed hiện tại:** `stock_transfer:receive`→WAREHOUSE.
- **Đầu vào/điều kiện:** Independent destination Warehouse: TD/TR/source lines/remaining transit, actual qty/quality/evidence.
- **Logic/kết quả:** Post actual MWTR transit→destination; quality split, allocation preserved; wrong/excess unresolved; put-away/UC-44 tiếp.
- **Thiết kế BE:** Guard TD/TR/destination/receiver!=dispatcher/source version; atomic batch/stock/allocations/receipt/progress, no negative transit.
- **Điểm đặt BE:** `src/modules/transfers` [đề xuất, chưa có route]; model/data: TRANSFER_REQUEST/TRANSFER_DISPATCH/MWTR/HANDOVER/DISCREPANCY.
- **Điểm kiểm chứng:** TD100 nhận95GOOD+3DAMAGED => đích98/transit2; dispatcher không được nhận. Có stock effect: kiểm batch/ledger/balance/reservation/progress đồng nhất và rollback toàn bộ.
- **Truy vết:** Report 3 phần II, UC-104 (dòng 1556 tại snapshot đọc); nhánh BF-04-E1, BF-04-E2, BF-04-E3. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-105 — Export or Print Stocktake Count Sheet

- **ACTIVE · FE-08 — Kiểm kê/B1 · SC-14.**
- **Quyền theo Report 3:** Store Owner — Export / print; Warehouse Staff — Export / print assigned scope.
- **Mã quyền trong seed hiện tại:** `stocktake:export`→OWNER/WAREHOUSE.
- **Đầu vào/điều kiện:** Activated immutable snapshot và permitted session/location.
- **Logic/kết quả:** Export/print count sheet cutoff/scope/lot/location/quality/owner/count blanks/found rows; prefer blind. Không mutate snapshot/count/stock.
- **Thiết kế BE:** Read snapshot projection with scope; no activation/stock transaction, print failure no repost.
- **Điểm đặt BE:** `src/modules/stocktakes` [đề xuất, chưa có route]; model/data: STOCKTAKE/LocationLock/StocktakeSnapshot/CountAttempt/DefectHold.
- **Điểm kiểm chứng:** Print retry không snapshot/activate lại hoặc ghi count0 vào ô trống.
- **Truy vết:** Report 3 phần II, UC-105 (dòng 2348 tại snapshot đọc). Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-106 — Approve Supplier Return and Variance Resolution

- **RETIRED.** BF-08 không Owner approval: Warehouse UC-82, Accountant UC-107/83, EXT-REF UC-108.
- Không tạo endpoint/operation permission/approval mới; không xóa history và không dùng approval lịch sử làm gate.

### UC-107 — Record Supplier Agreement and Receipt Acknowledgement

- **ACTIVE · FE-07 — Hàng lỗi/CR/FD/SR · SC-19.**
- **Quyền theo Report 3:** Accountant — Record / verify external evidence.
- **Mã quyền trong seed hiện tại:** `supplier_return:record_agreement`→ACCOUNTANT.
- **Đầu vào/điều kiện:** Accountant: authentic pre-dispatch agreement/refusal hoặc later actual ACK source/qty/version/evidence.
- **Logic/kết quả:** Lưu hai stage riêng, reconcile mismatch/resolution; disputes open, actual stock do Warehouse; UC-83 close, UC-108 finance riêng.
- **Thiết kế BE:** Versioned verified agreement source/qty/evidence guards + immutable history; ACK can't edit GI or post inventory.
- **Điểm đặt BE:** `src/modules/supplier-returns` [đề xuất, chưa có route]; model/data: SUPPLIER_RETURN/GI_SUPPLIER_RETURN/SUPPLIER_ACK; agreement/EXT-REF.
- **Điểm kiểm chứng:** Agreement trước dispatch không giả ACK; ACK mismatch không rewrite GI.
- **Truy vết:** Report 3 phần II, UC-107 (dòng 2170 tại snapshot đọc); nhánh BF-08-A1, BF-08-E2. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-108 — Record External Document References

- **ACTIVE · FE-09 — Quản trị/báo cáo/truy vết · SC-28.**
- **Quyền theo Report 3:** Accountant — Record / verify external evidence.
- **Mã quyền trong seed hiện tại:** `external_reference:read`→ACCOUNTANT; `external_reference:create`→ACCOUNTANT.
- **Đầu vào/điều kiện:** Accountant: external system/kind/number/date/line/actual provider revision nếu có/correlation/evidence.
- **Logic/kết quả:** Verify history delivered/returned/openQty hoặc link purchase/GI-SR to Invoice/Credit Note/outcome; finance independent; không fake source/deadline.
- **Thiết kế BE:** ExternalReference/Line unique nonblank correlation + verified quantities/audit; no posting batch/money/UC-111 substitution.
- **Điểm đặt BE:** `src/modules/external-references` [đề xuất, chưa có route]; model/data: ExternalReference/ExternalReferenceLine/Evidence.
- **Điểm kiểm chứng:** External refund/reference không thu tiền hoặc hoàn thành SO thay Sales.
- **Truy vết:** Report 3 phần II, UC-108 (dòng 2507 tại snapshot đọc); nhánh BF-06-E1, BF-07-A1, BF-07-A3, BF-08-A3. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-109 — Manage Linked Warehouse Issue Request

- **ACTIVE · FE-06 — Nhu cầu và xác nhận · SC-29.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Related execution view; Sales Staff — Manage net WIR/reopened demand; cancel eligible remainder.
- **Mã quyền trong seed hiện tại:** `issue_request:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES; `issue_request:create`→SALES; `issue_request:update`→SALES.
- **Đầu vào/điều kiện:** Sales: saved verified SO/line/version, releases/net remaining, optional posted GR-FD reopening.
- **Logic/kết quả:** Create/update/cancel WIR within SO, retain already-fulfilled commitments; reuse OD or transfer reopened commitment; cancel only unissued/back-not-redelivered after dependencies resolved.
- **Thiết kế BE:** ISSUE_REQUEST header.salesOrderId, details.salesOrderLineId/releaseKey unique; shared source guard, BusinessOperation/version, no stock by WIR itself.
- **Điểm đặt BE:** `src/modules/issue-requests` [đề xuất, chưa có route]; model/data: ISSUE_REQUEST/SALES_ORDER lines; releaseKey/BusinessOperation/OdCommitmentTransfer.
- **Điểm kiểm chứng:** Không WIR thiếu saved SO, không duplicate releaseKey; FD claim chưa post không reopen.
- **Truy vết:** Report 3 phần II, UC-109 (dòng 1826 tại snapshot đọc); nhánh BF-06-E1, BF-06-A1. Áp dụng BR chung và EX-01–05 khi liên quan.
- **Bổ sung 3.3.0:** WIR là release của SO gốc; RR đã tạo trực tiếp từ SO phải được tính khi kiểm thiếu từ WIR, không cộng SO/WIR allocations hoặc RR trùng lượng.

### UC-110 — Confirm Customer Delivery with Photo Evidence

- **ACTIVE · FE-06 — Nhu cầu và xác nhận · SC-30.**
- **Quyền theo Report 3:** Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Confirm / correct POD in assigned warehouse; Sales Staff — Related progress view.
- **Mã quyền trong seed hiện tại:** `delivery_confirmation:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES; `delivery_confirmation:confirm`→WAREHOUSE.
- **Đầu vào/điều kiện:** Assigned Warehouse: actual customer recipient/time/qty, POSTED GI-S same chain/current source, successfully stored same-POD photo.
- **Logic/kết quả:** Shared cap POD+GR-FD+OPEN FD≤valid PGI; confirm partial/full, active>0 full=>DELIVERED; VOID reason/history/dependency check. Không movement/reservation.
- **Thiết kế BE:** BusinessOperation+confirmation+source/SO conditional writes+version/audit/outbox, validate image parent/storage before commit; no stock batch.
- **Điểm đặt BE:** `src/modules/customer-deliveries` [đề xuất, chưa có route]; model/data: DELIVERY_CONFIRMATION; BusinessOperation/Evidence; GI source guard.
- **Điểm kiểm chứng:** Ảnh upload fail/khác POD không confirm; POD và FD cạnh tranh cùng cap GI; không repick/re-PGI.
- **Truy vết:** Report 3 phần II, UC-110 (dòng 1842 tại snapshot đọc); nhánh BF-06-E3, BF-06-A2. Áp dụng BR chung và EX-01–05 khi liên quan.

### UC-111 — Confirm Full External Payment Receipt

- **ACTIVE · FE-06 — Nhu cầu và xác nhận · SC-31.**
- **Quyền theo Report 3:** Sales Staff — confirm/correct full external receipt after DELIVERED; Store Owner — view; Accountant — reconciliation scope, no confirmation; Warehouse Staff — related progress view, no confirmation. Administrator has no right.
- **Mã quyền trong seed hiện tại:** `payment_confirmation:read`→OWNER/ACCOUNTANT/WAREHOUSE/SALES; `payment_confirmation:confirm`→SALES.
- **Đầu vào/điều kiện:** Sales: current DELIVERED SO/version, fullPaymentReceived true, receipt reference OR evidence OR nonempty note.
- **Logic/kết quả:** Recheck full delivery positive+photos/current version in transaction, unique confirmation version; CONFIRMED=>COMPLETED. Partial/unpaid/early giữ chưa hoàn thành; VOID recalculates history.
- **Thiết kế BE:** Unique SO/deliveredOrderVersion+operationId, BusinessOperation+SO/version/audit/outbox atomic; no stock/reservation/payment execution.
- **Điểm đặt BE:** `src/modules/external-payment-confirmations` [đề xuất, chưa có route]; model/data: PAYMENT_CONFIRMATION; BusinessOperation; deliveredOrderVersion.
- **Điểm kiểm chứng:** Warehouse/Accountant/Owner không confirm thay Sales; prepayment/partial không complete; version cũ vô hiệu.
- **Truy vết:** Report 3 phần II, UC-111 (dòng 1858 tại snapshot đọc); nhánh BF-06-A3. Áp dụng BR chung và EX-01–05 khi liên quan.

## 8. Checklist triển khai theo một UC

1. Đọc quyền/sub-operation, input, output, branch và effect của UC; xem UC trước/sau trong chuỗi nguồn. Không lấy nhãn UI/comment UC cũ thay catalogue hiện hành.
2. Đọc file hiện tại + tests + contract hai phía; phân biệt mock/schema với runtime API. Giải quyết prerequisite thực sự trong phạm vi task.
3. Thống nhất DTO/decimal string/source IDs/version/operation key/evidence/error semantics. Không phát minh source facts, warehouse assignment, return-day hoặc SLA.
4. Code đúng layer/module, reuse model/component/helpers, giữ scope/state/identity/quantity guards. Chỉ nâng abstraction khi có nhu cầu dùng thật.
5. Verify happy path + partial/zero/blank + wrong role/kho/self approval + stale/source cap + retry/evidence/freeze theo UC. Với stock/non-stock confirmation kiểm đúng việc có hoặc không ledger/balance/reservation.
6. Nghiệm thu liên flow quan trọng: SO→WIR→OD→GI draft→picking→PGI→POD→PAY-CFM; GR-FD→reopen→redelivery/cancel; CR thường/ngoại lệ; SR agreement→dispatch→ACK→close; B1 hold→plan→approval→execution→clear. Không claim flow hoàn tất chỉ từ màn hình click hoặc model validation.
7. Ghi checks đã chạy, failures/limitations, file thay đổi và contract/migration liên quan. Không tự commit.

Các ví dụ/T01–T56 là tiêu chí thiết kế, không phải lịch sử test của checkout. Tài liệu context chỉ được kiểm độ phủ UC/source/path, không xác nhận feature code đã đạt nghiệm thu.

## 9. Duy trì context

Khi UC/BR/quyền/trạng thái/contract đổi theo quyết định được chấp thuận, cập nhật đúng context FE và BE cùng nguồn chuẩn liên quan, giữ IDs/retired history; ghi rõ decision mới thay baseline nào. Khi checkout thay, đọc lại code/test/config thay vì tin snapshot này vĩnh viễn. Không dùng context để tự mở rộng scope hoặc tự cấp quyền triển khai/commit.

### Dấu vết nguồn tại lúc tạo — snapshot 26/10 (SHA-256 rút gọn)

- Quy trình VI: `78e4dc84a57bc129`.
- Quy trình EN (đã đọc và đối chiếu): `89262ed72d3492a2`.
- Report 3: `021f037d6a631e32`.
- Thiết kế chi tiết: `005d8d8de92e7cea`.
- Thiết kế dữ liệu VI: `989c275d5fe5045d`.
- DDL tham chiếu: `d7b09b842068ec4d`.
- Report 1: `a469eb13c263a68c`.
- Report 2: `547cfaa156ab506b`.
- Hậu kiểm 25/10: `a2c3b9d73ee895d2`.

Các hash dùng nhận biết nguồn đã đổi, không thay kiểm thử. File được tạo ngày 26/10/2026 (Asia/Saigon), chỉ tổng hợp tài liệu và đọc code; không sửa code ứng dụng, dữ liệu, index hoặc cấu hình trong lượt tạo này.


### Đồng bộ 27/10/2026 — 3.3.0

Đã cập nhật quy tắc chung và UC liên quan theo đề xuất 1.4.0 được người dùng yêu cầu áp dụng. Schema/seed có cấu trúc mới; API đánh giá/tạo RR, notification consumer và UI vẫn là thiết kế cần triển khai. Hash snapshot26/10 phía trên là lịch sử, không xác nhận nội dung nguồn hiện tại. Không tự commit.

### Đồng bộ phân quyền 28/10/2026

Model/BE dùng roleId đơn; API role lowercase và aliases roles=[role], primaryRole=role. Payload gán nhiều role bị từ chối. FE còn màn hình chọn nhiều role và cần sửa riêng; aliases chỉ tương thích đăng nhập/đọc. Chuẩn bị migration mặc định dry-run, ánh xạ userId→roleCode cho ca mơ hồ, backup và transaction trước apply; chưa chạy trên database đang dùng. Duy trì 84 bảng SQL tham chiếu, 39 collections Mongo, năm role và nguyên IDs UC/BR. Không tự commit.
