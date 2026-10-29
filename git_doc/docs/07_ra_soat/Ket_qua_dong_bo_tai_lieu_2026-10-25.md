# Kết quả rà soát và đồng bộ tài liệu WMSD — 25/10/2026

| Phiên bản báo cáo | Ngày | Phạm vi |
|---|---|---|
| 1.0.0 | 25/10/2026 | Rà soát toàn bộ tài liệu trong repo, loại trừ sơ đồ/diagrams; đồng bộ theo baseline nghiệp vụ 3.1.0 ngày 24/10. |
| 1.1.0 | 25/10/2026 | Yêu cầu bổ sung: cập nhật Mermaid và bản xuất liên quan, chỉ loại trừ file draw.io. Kết quả mới nhất ở mục 6. |

> Mục 1–5 ghi kết quả lượt đồng bộ đầu tiên trong ngày. Phạm vi loại trừ diagrams/Mermaid và số hash bảo toàn ở các mục đó là trạng thái trước yêu cầu bổ sung; **mục 6** cập nhật trạng thái hiện tại: chỉ file draw.io bị loại trừ.

Nguồn nghiệp vụ ưu tiên là [quy trình VI](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) và [EN](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md), gồm các lựa chọn A1/B1/C2 và BF-08 không Owner approval đã chốt. Lượt đầu đưa bản tài liệu lên 3.1.1; lượt bổ sung Mermaid đưa lên **3.1.2**. **Baseline nghiệp vụ vẫn là 3.1.0**. Đây là rà soát/thiết kế tài liệu, không phải xác nhận backend đã triển khai hoặc cửa hàng đã nghiệm thu.

## 1. Phạm vi và quyết định xử lý

Kiểm kê trước sửa có **47 tệp**: 30 tệp ngoài sơ đồ và 17 tệp thuộc sơ đồ/gói sơ đồ. Đã đối chiếu nội dung văn bản hiện hành, trích xuất nội dung sáu biên bản Word và năm PDF nguồn, đọc khảo sát CSV và các báo cáo lịch sử. Không sửa các sự kiện/lựa chọn đã ghi nhận trong nguồn khảo sát, biên bản hoặc tài liệu tham khảo để làm khớp thiết kế mới.

| Nhóm | Xử lý |
|---|---|
| Tài liệu hiện hành | Sửa trực tiếp Report 1/2/3, thiết kế hệ thống, thiết kế dữ liệu VI/EN, SQL tham chiếu, README và nhật ký. |
| Hai quy trình nguồn | Hiệu chỉnh trạng thái phát hành, khuyến nghị còn sót và nghiệm thu theo quyết định 3.1.0; không đổi nội dung Mermaid. |
| Đề xuất bảy quy trình và báo cáo rà soát cũ | Chỉ cập nhật đường dẫn/trạng thái đọc hiện hành; giữ nguyên thân phân tích/kết luận theo mốc cũ. |
| Khảo sát, biên bản, PDF và link tham khảo | Đọc/đối chiếu, giữ nguyên dữ liệu nguồn. Những khác biệt As-is với To-be tiếp tục được ghi rõ là quyết định thiết kế. |
| Sơ đồ và gói ERD | Loại trừ toàn bộ 17 file, gồm README/chú giải/mã dựng trong `WMSD_ERD_3_1_0`; không sửa hoặc xuất lại. Các khối Mermaid nhúng trong tài liệu cũng được bảo toàn. |
| Hai file chưa được Git theo dõi từ đầu | Giữ nguyên `WMSD_Conceptual_ERD.drawio` và `Danh_gia_database_va_Conceptual_ERD_2026-10-23.md`; không ghi đè hoặc nhận là sản phẩm của lượt này. |
| `debug.log` | Log kỹ thuật, không phải tài liệu nghiệp vụ; giữ nguyên. |

Lượt này sửa 15 tệp có sẵn và thêm báo cáo này. Không stage/commit. Các bản báo cáo `.docx.txt` là bản văn bản trong repo; không đồng nghĩa đã sửa Word/Google Docs ngoài repo.

## 2. Sai lệch và kết quả đồng bộ

| Mã | Sai lệch trước sửa | Kết quả hiện tại / truy vết |
|---|---|---|
| SYNC31-01 | README, Report 1/3 và thiết kế còn 3.0.0, UC-106 active; 98 active/13 retired. | Catalogue giữ 111 ID, nay **97 active/14 retired**; UC-106 chỉ giữ lịch sử, không quyền/association/màn hình hành động/route thực thi. BR-01–33; SC-01–31 vẫn 28 active/3 retired. |
| SYNC31-02 | Report 3/thiết kế tạo phiếu xuất sau picking; TR có thể bị hiểu đóng theo một chuyến. | TD/GI-S nháp trước picking; xác nhận TO là thực hiện, post khi bàn giao thực tế. TR chỉ đóng khi hết phần nhu cầu còn lại, transit, sai lệch và TO liên quan. UC-43/54/58/104; T41–42. |
| SYNC31-03 | Kiểm kê chỉ mô tả recount/delta, thiếu cách xử lý lỗi phát hiện dưới freeze. | Cho phép giải trình/lập phương án trực tiếp khi đủ căn cứ, hoặc Start/Enter Recount. B1 ghi hold/evidence không đổi balance; Warehouse lập/xác nhận thực hiện, Owner UC-92/93 duyệt/post batch delta thực tế và RECLASS/vị trí trước mở khóa. T43/T53–56. |
| SYNC31-04 | Thiếu nhánh nhận quay về do giao thất bại và công thức thực hiện ròng. | A1 BF-07-FD: GI-S chưa POD + bằng chứng → ARR/INS → GR-FD, không D6/Owner/POD giả/custody khách. Post thực về và tái mở đúng SO/WIR/OD gốc trong cùng commit. UC-72/73/109; T44/T47–49. |
| SYNC31-05 | Trần khách trả dựa trên xuất kho, chưa chia lượng khách nhận với hàng chưa giao; nguy cơ cộng claim và receipt hai lần. | Guard chung mỗi dòng GI: POD hiệu lực + GR-FD hợp lệ + FD OPEN ≤ PGI hợp lệ; GR-CR + CR OPEN ≤ lượng khách đã nhận đủ điều kiện. Consume claim cùng receipt, không cộng CONSUMED lần nữa; đảo kiểm downstream. R-22/23; T45–49. |
| SYNC31-06 | Owner quyết định mọi CR; cấm tự duyệt tổng quát vô hiệu lựa chọn C2. | UC-71 Sales STANDARD_ACCEPTANCE ca thường sau Warehouse kiểm, được cùng creator; Owner EXCEPTION_APPROVAL chỉ ngoại lệ đủ điều kiện, khác người đề xuất. Không vượt D6/UNKNOWN. GR-CR thường không tái mở nhu cầu. R-24; T50/51/56. |
| SYNC31-07 | BF-08 cần Owner/UC-106 duyệt trước xuất, giải quyết sai lệch và đóng. | Bỏ toàn bộ gate Owner; Accountant UC-107 xác minh thỏa thuận/đối chiếu và UC-83 đóng, Warehouse UC-82 thực xuất. Không biến quyết định BF-02 lịch sử thành điều kiện xuất. On-site scrap/regrade/release vẫn theo BF-02/B1. T23/T52. |
| SYNC31-08 | Thiếu dữ liệu hỗ trợ A1/B1/C2 và thông tin Invoice/Credit Note. | DDL tham chiếu 3.1.0 có **82 bảng, 215 FK, 2 view**; thêm 9 bảng, `reference_date`, C2 decision check và nguồn xác minh thỏa thuận SR thay Owner authorization. MongoDB mapping/API đề xuất cùng hợp đồng. |
| SYNC31-09 | Report 2 chỉ trỏ SRS chung; ưu tiên test và đào tạo chưa gồm quyết định mới. | Cập nhật phạm vi, rủi ro, ưu tiên tích hợp/kiểm thử/đào tạo theo A1/B1/C2/BF-08. Giữ nguyên số liệu effort/capacity, lịch 14 tuần và phân công dự án; cần đánh giá backend trước tái ước lượng. |
| SYNC31-10 | Trộn hình 3.0.0 và snapshot đánh giá cũ với tài liệu hiện hành. | README/nguồn/thiết kế nêu rõ hình ngoài phạm vi; báo cáo cũ chỉ thêm banner dẫn tới đây. Không dùng hình hoặc kết luận cũ để ghi đè quyết định hiện hành. |

Ví dụ B1 thống nhất: book50GOOD/count48GOOD+2vỡ → RECLASS2, tổng50, không thiếu−2/ADJ=0. Count46GOOD+2vỡ → delta−2 + RECLASS2, tổng48; không ghi thiếu−4 rồi hủy tiếp2. Ví dụ A1: SO10 → PGI10 → GR-FD10 → giao lại10 giữ ledger xuất20/nhận10, thực hiện ròng10, không tạo đơn nhu cầu20.

## 3. Thay đổi thiết kế tham chiếu

| Thành phần | Hợp đồng bổ sung |
|---|---|
| A1 | `failed_delivery`, `failed_delivery_line`, `return_source_claim`, `failed_delivery_receipt_line`, `demand_reopening`, `od_commitment_transfer`. Giữ nguồn dòng GI và SO/WIR/OD; claim không đổi tồn/tái mở. |
| B1 | `defect_hold`, `stocktake_resolution`, `stocktake_resolution_line`. Hold không đổi balance; plan có version, count, approval và Warehouse execution; UC-93 chốt delta/RECLASS/location cùng batch. |
| C2 | `approval.decision_kind=STANDARD_ACCEPTANCE` là ngoại lệ có kiểm soát cho Sales cùng creator. Các quyết định Owner vẫn cần người đề xuất khác; service kiểm loại chứng từ/role/assessment/version/quantity. CHECK không thay authorization. |
| BF-08 | `supplier_return_line` lưu agreement version/verifier/time/evidence, không yêu cầu Owner `authorization_id`; `external_reference.reference_date` phục vụ ngày Invoice/Credit Note. UC-83/107 không post tồn. |
| Available | `available_stock` loại balance có hold ACTIVE để chặn bảo thủ; việc tách phần còn đủ điều kiện phải qua giao dịch được phép. Không tự trừ hold và reservation trùng lượng. |

DDL là bản tạo mới để review, không phải migration áp lên cơ sở dữ liệu có sẵn. SQL Server là mô hình quan hệ tham chiếu; runtime vẫn MongoDB. Các kiểm tổng nhiều dòng, tính bất biến, thẩm quyền, freeze, idempotency và transaction cần service/index/validation tương ứng; không tuyên bố DDL đã tự cưỡng chế các quy tắc đó.

## 4. Danh mục rà soát ngoài sơ đồ

| File / nhóm file | Trạng thái sau rà soát |
|---|---|
| [README](../../README.md), [change log](../../change_logs.md) | Chuẩn hiện hành, chỉ mục, phiên bản hình và kết quả/giới hạn cập nhật. |
| [Report 1](../01_bao_cao/WMSD_Report1_Fix.docx.txt) | Phạm vi/FE, tám BF, quyền C2/BF-08 và ngoại lệ A1/B1 đồng bộ. Giữ bối cảnh/As-is. |
| [Report 2](../01_bao_cao/WMSD_Report2.docx.txt) | Phạm vi/kế hoạch chất lượng/đào tạo cập nhật; effort/capacity/lịch giữ kế hoạch gốc. OBS-01 về effort/buffer chưa được giải quyết bằng tái ước lượng. |
| [Report 3](../01_bao_cao/WMSD_Report3_Fix.docx.txt) | Flows, mô hình văn bản, catalogue, actor associations, permissions, đặc tả, màn hình, BR/NFR đồng bộ. Mermaid giữ nguyên. |
| Quy trình [VI](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md)/[EN](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) | Bản tài liệu 3.1.1, baseline nghiệp vụ 3.1.0; trạng thái phát hành/diagrams và nghiệm thu làm rõ. |
| [Đề xuất bảy quy trình](../02_nghiep_vu/De_xuat_7_quy_trinh_sau_review1.md) | Thân lịch sử nguyên vẹn; banner trỏ baseline/hậu kiểm hiện hành. |
| [Thiết kế hệ thống](../03_thiet_ke/WMSD_Thiet_ke_he_thong_chi_tiet.md) | Quyền, trạng thái, MongoDB, API/transaction, BR/R/T, screen và truy vết đủ 111 UC đồng bộ. |
| Thiết kế dữ liệu [VI](../03_thiet_ke/de_xuat_database_design_VI.md)/[EN](../03_thiet_ke/de_xuat_database_design_EN.md) | Cấu trúc/luồng dữ liệu, quyền, 26 R và 56 T cùng hợp đồng. ERD nhúng giữ snapshot cũ. |
| [SQL tham chiếu](../03_thiet_ke/WMSD_SQL_schema.sql) | 82 bảng/215 FK/2 view; parse T-SQL và đối chiếu cấu trúc tĩnh, chưa chạy SQL Server. |
| [Báo cáo trước sửa 22/10](Bao_cao_dong_bo_tai_lieu_2026-10-22.md), [hậu kiểm 22/10](Ket_qua_dong_bo_tai_lieu_2026-10-22.md), [rà soát 24/10](Bao_cao_ra_soat_quy_trinh_theo_gop_y_GVHD_2026-10-24.md) | Giữ nguyên thân snapshot, chỉ thêm banner dẫn tới kết quả hiện tại. Liên kết máy cá nhân/số dòng nguồn cũ giữ là lịch sử, không xác nhận nguồn hiện tại còn tồn tại. |
| [Đánh giá database 23/10](Danh_gia_database_va_Conceptual_ERD_2026-10-23.md) | File đã có nhưng chưa tracked từ đầu, giữ nguyên byte; nội dung 73 bảng và kết luận 3.0.0 chỉ áp cho mốc cũ. Đối chiếu A1/B1/C2 hiện tại dùng báo cáo này và DDL mới. |
| [CSV khảo sát](../05_khao_sat/khao_sat_kho_gach.csv) | Một phản hồi/47 cột/26 câu hỏi; giữ nguyên, kể cả câu 13 chọn cả có và không điều chuyển. D1–D8 và lựa chọn 24/10 là quyết định To-be, không sửa câu trả lời. |
| Sáu biên bản .docx: 12/9, 16/9, 26/9, 30/9, 3/10, 09/10 | Trích xuất/đối chiếu; nội dung định hướng rộng, góp ý và phân công theo từng thời điểm được giữ nguyên. Không phát hành lại biên bản. |
| Năm PDF: SAP WM I–IV v4.1 và Tổng hợp quy trình | Trích xuất văn bản đủ 25/33/31/31 và 4 trang tương ứng; giữ nguyên. Chỉ tham khảo khái niệm; không biến phạm vi công nợ/xe/tài chính gốc thành MVP mới. |
| [Link tham khảo](../06_tham_khao/link_tham_khao.md) | Danh mục nguồn, không quy định quyền nghiệp vụ; giữ nguyên. Không đánh giá lại tính năng/giá/hiệu lực của website ngoài trong lượt này. |
| `docs/03_thiet_ke/debug.log` | Không phải tài liệu yêu cầu, giữ nguyên. |

## 5. Hậu kiểm và giới hạn

| Kiểm tra | Kết quả / phạm vi chứng minh |
|---|---|
| Kiểm tra tự động tài liệu | **111 kiểm tra đạt, 0 lỗi**; bao gồm các nhóm đối chiếu dưới đây và 135 liên kết file nội bộ trong bộ tài liệu hiện hành/báo cáo mới. Không phải 111 kiểm thử phần mềm. |
| Catalogue, quyền, actors, đặc tả UC và screens | 111 ID, 97 active/14 retired; UC-106 không quyền thực thi. Screen và appendix khớp catalogue/quyền. |
| Đồng bộ nội dung | BR-01–33 EN khớp SRS, VI khớp thiết kế; R-01–26 và T01–T56 VI khớp thiết kế chi tiết, bộ mã VI/EN khớp. 40 mã nhánh BF gồm A/E và FD khớp hai quy trình/SRS. |
| Markdown và liên kết | Kiểm bảng/cột, code fence, Unicode và liên kết file nội bộ của tài liệu hiện hành; không coi anchor dòng lịch sử hoặc nguồn máy cá nhân là đường dẫn phát hành hiện hành. |
| SQL | Microsoft ScriptDom 180.140.0 / TSql160Parser: **0 lỗi parse**, 6 batch. Đếm 82 PK/bảng, 215 FK và 2 view; kiểm tồn tại bảng/cột đích FK. Không phải chạy DDL hoặc kiểm tổng/concurrency trên SQL Server. |
| Bảo toàn | SHA-256 của 17 file sơ đồ/gói sơ đồ, 13 file nguồn và file đánh giá chưa tracked 23/10 giữ nguyên. Nội dung các khối Mermaid và thân snapshot lịch sử được đối chiếu với bản trước sửa. |
| Git | `git diff --check`; không stage/commit. Script QA, bản chụp trước sửa và thư viện parser nằm ngoài repo. |

56 case T và các nhánh nghiệp vụ là **tiêu chí nghiệm thu đề xuất**, không phải 56 backend test đã chạy. Chưa sửa/chạy backend, MongoDB, API, storage/SMTP hoặc kiểm thử tải. Không render/sửa sơ đồ hoặc tự phát hành Word/Google Docs. Danh sách kho/nhân sự, calibre/hệ số SKU, thời hạn trả, giới hạn file, nhà cung cấp storage và SLA vẫn cần xác minh; không tự tạo số liệu.

## 6. Bổ sung Mermaid — chỉ loại trừ file draw.io

Yêu cầu tiếp theo cho phép sửa Mermaid nhúng và các file liên quan. Baseline nghiệp vụ vẫn **3.1.0**; hai quy trình lên bản tài liệu **3.1.2**, database/gói ERD và thiết kế chi tiết có bản tài liệu **3.1.1**. Không thay DDL hoặc nghiệp vụ đã chọn. Các số liệu ở mục 1–5 là bằng chứng lượt trước, không dùng để khẳng định Mermaid vẫn bị loại trừ ở trạng thái hiện tại.

| Thành phần | Cập nhật |
|---|---|
| Quy trình VI/EN | Đồng bộ 18 Mermaid: context và tám BF mỗi ngôn ngữ. BF-01/BF-03 giữ logic đúng, ghi baseline; các luồng còn lại làm rõ các quyết định hiện hành. |
| BF-02/BF-05 | Nhánh đang freeze đi B1 trước các giao dịch thường; hold không đổi balance. Tách Start/Enter Recount, thiếu bằng chứng thực hiện/task với lỗi hoặc unknown commit; retry tra key và không mở khóa sớm. |
| BF-04 | TD nháp trước picking, post khi bàn giao; MWTR độc lập theo chất lượng; put-away lượng đã xác minh không phải chờ giải quyết mọi sai lệch. Kiểm hết nhu cầu/transit/sai lệch/TO toàn TR trước đóng. |
| BF-06/BF-07 | Sau PGI phân kết quả trước khi ghi POD: hàng giao thất bại thực về đi GR-FD trực tiếp, không qua POD giả. GR-FD/consume claim/tồn/tái mở nguồn gốc cùng commit; GR-CR không tái mở. CR thường dùng Sales STANDARD_ACCEPTANCE, ngoại lệ đủ điều kiện dùng Owner EXCEPTION_APPROVAL; kiểm lại kind/role/version/lượng. |
| BF-08 | Không Owner/UC-106. Accountant xác minh thỏa thuận/ACK/đối chiếu/đóng; Warehouse post thực tế. Tham chiếu Invoice/Credit Note và tài chính là nhánh độc lập, không phải điều kiện đóng phần kho. |
| ERD nhúng trong database VI/EN và Report 3 | Thay mỗi ERD lõi cũ bằng ba góc nhìn cùng cấu trúc: A1 GI/POD/FD/claim/tái mở/OD transfer; B1 hold/plan/execution/batch; C2 quyết định CR và thỏa thuận SR/tài chính ngoài. Hiển thị khóa/trường trọng yếu của phần mới, không khẳng định vẽ đủ 82 bảng. |
| Context | Hai quy trình, Report 3 và [file độc lập](../04_so_do/context-diagrem.mermaid) cùng dữ liệu qua biên: Sales CR thường/nhu cầu ròng, Warehouse CR/FD/hold/B1, Accountant đóng SR, Owner đúng phạm vi. Giữ 5 role và API-01/02. |
| Gói ERD rút gọn | [Model](../03_thiet_ke/WMSD_ERD_3_1_0/model.cjs), [Mermaid](../03_thiet_ke/WMSD_ERD_3_1_0/erd.mmd), [Markdown](../03_thiet_ke/WMSD_ERD_3_1_0/erd.md), [README](../03_thiet_ke/WMSD_ERD_3_1_0/README.md) và [HTML](../03_thiet_ke/WMSD_ERD_3_1_0/erd.html) đồng bộ; vẫn 14 thực thể/32 quan hệ. Thêm nhóm thuộc tính claim/quyết định/tái mở/OD commitment, defect hold/execution/closure. |
| Bản xuất BF-04 | [PNG VI](../04_so_do/WMSD_Mainflow_BF04_VI.png)/[EN](../04_so_do/WMSD_Mainflow_BF04_EN.png) dựng lại từ Mermaid quy trình hiện tại, có nhãn baseline/ngày/nguồn. Không xuất từ draw.io 3.0.0 cũ. |
| README, Report 1/2/3, thiết kế và nhật ký | Bỏ tuyên bố phạm vi hiện tại giữ nguyên mọi Mermaid/diagrams; ghi đúng trạng thái draw.io cũ và nguồn của PNG/HTML mới. Các mục changelog có ngày của lượt trước giữ là lịch sử. |

Kiểm bằng **Mermaid 12.2.0**: 31 nguồn hiện hành (29 khối nhúng, context `.mermaid`, ERD `.mmd`) đều parse/render thành công, gồm 22 graph khác nhau; tám Mermaid lịch sử cũng parse thành công và không sửa nội dung. 96 kiểm tra tài liệu và 67 kiểm tra Mermaid/ngữ nghĩa/bảo toàn đều đạt. Đã xem render BF-04/BF-05/BF-07, ERD A1 và HTML rút gọn; kiểm VI–EN, các bản ERD/context trùng nguồn, trường mới đối chiếu DDL và gói 14 thực thể/32 quan hệ. HTML không có lỗi JavaScript; nút zoom/thực tế/toàn bộ hoạt động. Đây là kiểm tra tài liệu/hình, không phải backend tests.

Hash xác nhận **sáu file draw.io giữ nguyên**, gồm cả file conceptual chưa tracked từ đầu. Mermaid của đề xuất bảy quy trình, hai PNG BF-03B lịch sử, CSV/biên bản/PDF và file đánh giá database 23/10 giữ nguyên; không viết lại bằng chứng lịch sử để làm khớp To-be. Không sửa DDL trong lượt bổ sung, không stage/commit hoặc phát hành Word/Google Docs ngoài repo.
