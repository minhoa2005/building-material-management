# Đánh giá mức đáp ứng nhận xét hội đồng — WMSD

Ngày đánh giá: **26/10/2026**. Căn cứ yêu cầu: toàn bộ nhận xét thầy cô do người dùng cung cấp trong phiên đánh giá này.

Chuẩn nội dung được đánh giá: quy trình bản 3.1.2, baseline nghiệp vụ 3.1.0; Report 1/Report 3 dạng `.docx.txt`; thiết kế dữ liệu và hệ thống trong repo. Đây là đánh giá **thiết kế và tính nhất quán tài liệu**, không phải kết quả nghiệm thu phần mềm hoặc xác nhận hội đồng đã chấp nhận.

## 1. Kết luận

**Chưa đủ căn cứ kết luận đã đáp ứng đầy đủ nhận xét của thầy cô.** Thiết kế hiện tại đã xử lý phần lớn lỗi nghiệp vụ ban đầu, nhưng còn thiếu yêu cầu được nêu trực tiếp trong nhận xét và còn lệch giữa tài liệu chữ với bộ hình draw.io.

Các điểm đã có căn cứ để xác nhận ở mức thiết kế:

- Nhu cầu bổ sung hàng do Sales/Warehouse khởi tạo, có tình huống thiếu hàng phục vụ khách, dưới ngưỡng và sau kiểm kê; Accountant lập PO sau duyệt.
- Điều chuyển đã tách chuyển vị trí trong cùng kho với chuyển giữa các kho; có duyệt/từ chối TR, xuất nguồn, transit, nhận độc lập và xử lý sai lệch.
- Kiểm kê đã có snapshot, khóa phạm vi, phân công người đếm ở UC, lịch sử đếm lại, giải trình, từ chối/trả phương án, quyết định và biến động có truy vết.
- Phần chữ hiện hành phân công Sales lập CR, Warehouse kiểm/nhập thực tế; hoàn tiền, giá bán, hóa đơn, công nợ và báo cáo lợi nhuận đã loại khỏi chức năng nghiệp vụ nội bộ.
- Thiết kế chi tiết đã có hồ sơ hàng lỗi, tài khoản/vai trò, bằng chứng, biến động tồn, truy vết lô/vị trí và nguyên tắc không sửa đè chứng từ đã post.

Các việc chưa đóng:

1. Chưa có luồng/UC nhập tồn đầu kỳ theo lô–vị trí và import danh mục từ Excel/file xuất MISA.
2. Thiếu hàng hiện mới dẫn đến gợi ý phương án; Warehouse vẫn tự tạo TR, chưa đáp ứng yêu cầu tự tạo/kích hoạt yêu cầu điều chuyển.
3. Hủy TR mới được nhắc trong quy tắc tổng quát, chưa có đặc tả thao tác, quyền và xử lý từng trạng thái.
4. Đếm mù vẫn là “khuyến nghị/prefer”, chưa thành yêu cầu có thể nghiệm thu.
5. SO sao chép và PAY-CFM/COMPLETED là lựa chọn mở rộng so với đề xuất “chỉ làm kho”; chưa có bằng chứng thầy cô chấp thuận lựa chọn này.
6. Draw.io còn sai khác trực tiếp với baseline hiện hành; chưa có bộ slide hiện tại trong repo để kiểm tra nội dung trình bày thực tế.
7. Khảo sát đã bổ sung nhưng nhiều chính sách và cách bố trí nhân sự vẫn là To-be chưa xác nhận với cửa hàng.

Không quy đổi thành phần trăm: các nhận xét chứa nhiều yêu cầu có trọng số khác nhau, trong đó thiếu đầu kỳ/import hoặc dùng nhầm hình cũ có thể khiến một nội dung vẫn chưa đạt dù đã sửa nhiều phần khác.

## 2. Nguồn và cách đọc dẫn chứng

Số dòng dưới đây phản ánh tệp tại thời điểm đánh giá. Với draw.io, dẫn chiếu bằng tên trang và ID node, vì cấu trúc XML không thích hợp để dẫn số dòng nghiệp vụ.

| Mã nguồn | Tài liệu và nội dung đã đối chiếu |
|---|---|
| S1 | [Quy trình VI](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md): mục 1, 3, 4, 8, 10, 12, 15; trọng tâm các dòng 162–298, 346–410, 964–982, 1063–1078. Đối chiếu thuật ngữ/diễn đạt liên quan trong [bản EN](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md). |
| S2 | [Report 1](../01_bao_cao/WMSD_Report1_Fix.docx.txt): BF-01–08 và FE/LI, dòng 311–376. |
| S3 | [Report 3/SRS](../01_bao_cao/WMSD_Report3_Fix.docx.txt): BF, catalogue, quyền, đặc tả UC và SC liên quan; các dẫn chứng chi tiết ở mục 4. |
| S4 | [Thiết kế database VI](../03_thiet_ke/de_xuat_database_design_VI.md): master, chứng từ, các nghiệp vụ, posting/reversal và đối soát; dòng 106–170, 536–555. |
| S5 | [SQL tham chiếu](../03_thiet_ke/WMSD_SQL_schema.sql): app_user/app_role, evidence, defect_case, warehouse_task_line, stock_account/balance/movement, stocktake và OPENING. Đây không phải database runtime đã triển khai. |
| S6 | [Thiết kế hệ thống](../03_thiet_ke/WMSD_Thiet_ke_he_thong_chi_tiet.md): trạng thái, hợp đồng transaction/API và truy vết UC. |
| S7 | [Mainflow draw.io VI/EN](../04_so_do/WMSD_Mainflows_VI_EN.drawio): đọc XML các trang BF-01, BF-04–08 VI; kiểm actor qua parent của node. |
| S8 | [Conceptual ERD draw.io](../03_thiet_ke/WMSD_Conceptual_ERD.drawio), [database draw.io](../03_thiet_ke/WMSD_database_design.drawio) và [ERD rút gọn](../03_thiet_ke/WMSD_ERD_3_1_0/README.md): đối chiếu phạm vi/version và mức trừu tượng. |
| S9 | [CSV khảo sát 20/10](../05_khao_sat/khao_sat_kho_gach.csv): một phản hồi; câu 7, 13, 15, 18–24. [README](../../README.md) được dùng để nhận diện tài liệu hiện hành/lịch sử. |

Không dùng kết luận “đã đồng bộ” trong báo cáo cũ thay cho kiểm tra nội dung nguồn. Không mở/chỉnh Word, Google Docs hoặc slide bên ngoài repo. Các liên kết tham khảo SAP/MISA trong tài liệu không được dùng để suy ra cửa hàng đã xác nhận một chính sách cụ thể.

## 3. Ma trận đối chiếu nhận xét

| Nhận xét / yêu cầu | Kết quả hiện tại | Đánh giá |
|---|---|---|
| Nêu đúng thời điểm phát sinh nhu cầu nhập hàng; Accountant không khởi tạo nhu cầu vận hành | BF-01 có ba nhóm trigger; UC-03 giao Sales/Warehouse; Owner duyệt rồi Accountant lập PO. | **Đã đáp ứng trong thiết kế chữ.** |
| Transfer request tự tạo/kích hoạt khi kho phục vụ khách thiếu hàng | UC-103 chỉ gợi ý/chọn nguồn; BF-04 và UC-40 vẫn để Warehouse lập/gửi TR. | **Chưa đáp ứng phần tự động.** Các bước xuất/nhận đã được làm rõ. |
| Nhất quán phạm vi, ưu tiên chỉ quản lý kho | Đã retire giá bán, hóa đơn và hoàn tiền; UC-99 không báo cáo doanh thu/lợi nhuận. Vẫn giữ SO sao chép và xác nhận tiền ngoài hệ thống để hoàn thành SO. | **Đáp ứng một phần so với khuyến nghị hội đồng.** Phần chữ nội bộ đã xác định ranh giới, nhưng cần chốt lựa chọn SO/PAY-CFM với GVHD. |
| Có tồn đầu kỳ theo lô/vị trí và import Excel/MISA | SQL có loại chứng từ OPENING và nguyên tắc đối soát ledger, nhưng catalogue/UC/SC chưa có quy trình vận hành tương ứng; chưa thấy đặc tả import. | **Chưa đáp ứng ở mức yêu cầu chức năng.** |
| Duyệt, từ chối, hủy điều chuyển | UC-41 đã có approve/reject/return; UC-44 riêng cho sai lệch. Hủy phần chưa làm có trong quy tắc tổng quát nhưng không có thao tác UC/SC/quyền cụ thể. | **Đáp ứng một phần; còn thiếu hủy TR.** |
| Kiểm kê đủ actor, phân công, đếm lại, nguyên nhân, từ chối, đếm mù và freeze rõ nghĩa | Đã có phần lớn nội dung; freeze là snapshot bất biến đồng thời khóa giao dịch trong phạm vi. Đếm mù chỉ được ưu tiên/khuyến nghị. Phân công đã có ở UC nhưng dữ liệu và kiểm quyền thực hiện còn cần làm rõ. | **Phần lớn đã đáp ứng, chưa đóng đếm mù/phân công ở mức nghiệm thu.** |
| Customer Return thống nhất actor và ranh giới hoàn tiền | Phần chữ: Sales UC-70, Warehouse UC-72/73, Sales nhận thông thường/Owner ngoại lệ UC-71; UC-74–78 retired. Draw.io BF-07 vẫn có bước quyết định tại lane Owner. | **Phần chữ đã sửa; bộ hình chưa khớp.** |
| ERD đủ đối tượng/truy vết lô–vị trí; không sửa chứng từ cũ để xử lý trả hàng | Thiết kế chi tiết có các đối tượng hoặc cấu trúc tương đương; biến động nối dòng chứng từ với số dư theo lô/vị trí. Có receipt/đảo mới thay vì sửa đè. ERD 14 thực thể cố ý ẩn nhiều hồ sơ. | **Đã xử lý ở thiết kế chi tiết; cần đúng góc nhìn ERD và mapping khi trình bày.** |
| Khảo sát kỹ và vẽ lại toàn bộ luồng, dùng thuật ngữ chuẩn | Có khảo sát, glossary, tám BF và Mermaid hiện hành. Còn chính sách chưa xác nhận; draw.io giữ bản 3.0.0; chưa kiểm được slide mới. | **Chưa đủ bằng chứng hoàn tất toàn bộ yêu cầu.** |

## 4. Các khoảng trống cần xử lý

Mức ưu tiên: **P1** cần đóng trước khi trình bày lại để tránh lặp nhận xét trực tiếp; **P2** cần hoàn thiện để thiết kế có thể kiểm chứng và vận hành. Các đề xuất sau chưa phải thay đổi đã được áp dụng vào baseline.

### GAP-001 — P1 — Thiếu quy trình tồn đầu kỳ và import

**Dẫn chứng:** SRS có 111 mã UC, nhưng chưa tìm thấy UC khởi tạo tồn đầu kỳ hoặc import danh mục. SRS dòng 2832 yêu cầu đối soát kể cả OPENING; SQL dòng 113 có document kind OPENING; database VI dòng 157 liệt kê loại này. Đây là nền dữ liệu, chưa phải quy trình người dùng.

**Ảnh hưởng:** chưa giải thích được cửa hàng đưa số tồn hiện tại vào WMSD bằng cách nào, ai duyệt số liệu ban đầu và làm sao tránh nhập tăng hai lần. Chỉ tạo SKU thủ công không đáp ứng yêu cầu import.

**Cần bổ sung để đóng:**

- UC nhập/import danh mục: nguồn Excel hoặc file xuất MISA, template và mapping SKU/đơn vị/quy đổi, preview, phát hiện trùng, kiểm lỗi theo dòng, kết quả import và lịch sử file/người/thời điểm. Import file MISA không đồng nghĩa live MISA API.
- UC lập–kiểm tra–duyệt/post tồn đầu: ngày cutoff, kho, vị trí, SKU, lô/tone/calibre, chất lượng, quyền sở hữu, lượng và đơn vị/hệ số. Không đưa custody vào tồn sở hữu.
- Kiểm soát tái chạy, phạm vi được phép khởi tạo, dữ liệu phát sinh sau cutoff và cách điều chỉnh sai sót bằng chứng từ có dấu vết. Không khởi tạo bằng sửa trực tiếp stock_balance.
- Nghiệm thu tối thiểu: một lô ở hai vị trí, một SKU nhiều lô, hàng lỗi/giữ hộ, dòng lỗi, file trùng và sửa số dư đã post.

Không tự cấp mã UC mới trong báo cáo này; khi bổ sung phải cập nhật catalogue, quyền, SC, model/API và tổng số UC đồng bộ.

### GAP-002 — P1 — Chưa có tự sinh TR theo thiếu hụt

**Dẫn chứng:** S1 dòng 248–250; Mermaid dòng 743–747 có “Warehouse lập TR”. UC-40 dòng 1490–1502 để Warehouse Create/Submit. UC-103 dòng 701 mô tả suggestions, không có thao tác tự sinh TR.

**Đánh giá:** phát hiện thiếu và gợi ý nguồn không tương đương tự tạo yêu cầu. Việc đã có trigger tổng quát chưa đóng nhận xét này.

**Cần bổ sung để đóng:** định nghĩa sự kiện thiếu hụt đã xác nhận, điều kiện kho đích, nguồn tương thích/đúng hạn, cách trừ nguồn đã phân bổ và khóa chống tạo trùng. Khi chọn phương án chuyển vật lý, hệ thống sinh TR liên kết dòng nhu cầu; người kho xác nhận thông tin trước gửi hoặc hệ thống gửi theo chính sách đã chốt. Tự sinh yêu cầu không tự duyệt, tự xuất hoặc tự nhận hàng.

Nếu thầy cô yêu cầu tự tạo ngay khi thiếu mà không chờ chọn phương án, cần mô tả đúng điều kiện tự tạo đó. Đồng thời phải có nhánh xuất thẳng từ kho khác hoặc không còn nguồn nội bộ để tránh tạo TR không thể thực hiện. Một lựa chọn giữ tạo thủ công chỉ đóng góp ý khi có xác nhận chấp thuận thay đổi yêu cầu.

### GAP-003 — P1 — Cần chốt lại ranh giới SO/PAY-CFM với khuyến nghị “chỉ làm kho”

**Dẫn chứng:** S1 dòng 43, 52, 61–100; Report 1 dòng 331–333, 357, 366–367; SRS UC-111 dòng 709 và UC-99 dòng 697.

**Đã sửa:** không còn chức năng giá bán UC-23–25, hóa đơn UC-59–62 và hoàn tiền UC-74–78 ở trạng thái thực thi. Báo cáo lợi nhuận/doanh thu đã loại. SO là bản chép nguồn ngoài; PAY-CFM không thực hiện giao dịch tiền.

**Điểm chưa đóng:** điều kiện “chỉ COMPLETED sau xác nhận đủ tiền” vẫn khiến hoàn thành đơn phụ thuộc kết quả thương mại. Đây là lựa chọn thiết kế đã được ghi rõ giữa các tài liệu hiện hành, nhưng chưa có bằng chứng trong repo rằng GVHD chấp thuận thay cho khuyến nghị kho thuần túy. Không nên đánh đồng lựa chọn này với việc đã triển khai bán hàng/kế toán đầy đủ; cũng không nên tuyên bố đã làm đúng hoàn toàn hướng “chỉ quản lý hàng ra vào”.

**Hai cách đóng:**

- Bám sát kho: giữ nguồn đơn bán ngoài để truy vết nhu cầu, kết thúc nghĩa vụ kho theo xuất/giao/nhận; tách tham chiếu xác nhận tiền khỏi điều kiện hoàn thành phần kho. Cập nhật đồng bộ BF-06, UC-111, tên trạng thái và phạm vi.
- Giữ baseline hiện tại: trình rõ phạm vi bổ sung SO sao chép/POD/PAY-CFM và lấy xác nhận chấp thuận; phân biệt hoàn thành phần kho với hoàn thành theo dõi đơn. Không nói WMSD lập hóa đơn, thu tiền, tính lãi hay quản lý công nợ.

Đây là điểm cần quyết định phạm vi với GVHD, không thể kết luận chấp thuận thay người đánh giá. Báo cáo này không tự thay đổi lựa chọn đã ghi trong baseline.

### GAP-004 — P1 — Thiếu thao tác hủy TR có quyền và điều kiện rõ

**Dẫn chứng:** UC-41 dòng 1504–1517 đã có duyệt/từ chối/trả sửa. S1 dòng 1072 và database VI dòng 536 nhắc hủy phần chưa thực hiện. Tuy nhiên SC-13 dòng 2651–2658 và UC-40/41/43/44/104 không đặc tả command hủy TR, actor được hủy hoặc quy trình duyệt hủy.

Không cần bắt buộc tách thành một UC độc lập nếu mở rộng UC hiện có đầy đủ; thiếu hiện tại là hành vi và quyền, không đơn thuần là thiếu một tên UC.

**Cần bổ sung để đóng:** ai được rút yêu cầu trước duyệt; ai hủy phần đã duyệt nhưng chưa xuất; lý do, version và lịch sử; giải phóng reservation/allocation và TO/TD nháp. Với TR đã xuất một phần chỉ hủy phần chưa xuất; lượng đang transit phải tiếp tục nhận/đối soát/trả nguồn có chứng từ, không được biến mất bằng đổi trạng thái CANCELLED.

Nghiệm thu: TR100 chưa xuất; TR100 đã TD60; TR100 có transit chưa xử lý; hai người đồng thời xuất/hủy phần còn lại.

### GAP-005 — P2 — Đếm mù và phân công chưa đủ hợp đồng nghiệm thu

**Dẫn chứng:** S1 dòng 275–282 đã có phân công, snapshot/khóa và recount. UC-86 dòng 2221–2234 lập scope/counters. UC-105 dòng 2356 vẫn ghi “prefer blind counts”; S1 dòng 277 ghi “Khuyến nghị”. SQL stocktake/scope/count_attempt dòng 613–646 lưu phiên/phạm vi/người đã đếm, nhưng chưa có cấu trúc phân công người phải đếm theo phiên/vị trí hoặc liên kết tương đương được chỉ rõ.

**Đã đáp ứng:** đếm lại không ghi đè; nguyên nhân/giải trình; Owner từ chối/trả phương án; snapshot khác khóa giao dịch. UC-92 dòng 2325 có nhánh reject/return dù một số tên/ngắn gọn chỉ ghi approve/return.

**Cần bổ sung để đóng:**

- Đếm mù thành quy tắc áp dụng cụ thể: người đếm không thấy tồn sổ/chênh lệch trên form/phiếu đếm và các đầu ra liên quan trong giai đoạn đếm; xác định thời điểm và người được mở đối chiếu.
- Lưu phân công phiên/vị trí/người đếm và lịch sử đổi người; kiểm người được giao khi nhập count/recount. Người thực nhập đã lưu không thay thế phân công trước công việc.
- Phân biệt người đếm, người đối chiếu/lập phương án, người duyệt/post; quy định ai yêu cầu recount và khi nào phải có người đếm độc lập nếu nhóm chọn kiểm soát đó.
- Giữ khóa khi phương án bị từ chối/chưa thực hiện; không mở khóa chỉ vì đã có quyết định duyệt.

Không kết luận cơ chế freeze hiện tại sai: thiết kế hiện hành đã chọn **cả snapshot bất biến lẫn khóa giao dịch theo phạm vi**, không còn chỉ một cụm “Freeze book quantity” mơ hồ.

### GAP-006 — P1 — Draw.io còn mâu thuẫn với phần chữ hiện hành

**Dẫn chứng từ XML S7:**

| Trang / node | Nội dung hiện có | Khác với baseline 3.1.0 |
|---|---|---|
| BF-07 VI / `bf07-review`, parent `bf07-lane-owner` | Bước quyết định UC-71 ở lane Chủ cửa hàng. | Ca CR thông thường phải do Sales quyết định sau kiểm; Owner chỉ ngoại lệ đủ điều kiện. Hình cũng chưa thể hiện nhánh FD hiện hành. |
| BF-08 VI / `bf08-review`, `bf08-variance` | Duyệt trước xuất và duyệt sai lệch bằng UC-106 ở lane Owner. | UC-106 đã RETIRED; BF-08 hiện không có Owner approval. |
| BF-05 VI / `bf05-clear` | UC-93 “chỉ delta đã duyệt”; trước đó lập ADJ. | Chưa thể hiện B1 quality-only RECLASS, hold/thực hiện và điều kiện chốt không tạo ADJ0. |

README đã công khai draw.io là snapshot cũ; vì vậy đây không phải phát hiện phần chữ giả vờ đồng bộ draw.io. Nhưng các trang mainflow vẫn có banner “Thiết kế hiện hành · 3.0.0”, tạo nguy cơ dùng nhầm khi đưa lên slide.

Mermaid hiện hành đã sửa nhiều nhánh này; ví dụ S1 dòng 774–804 thể hiện B1. Vì vậy không nói “toàn bộ flow vẫn chưa sửa”. Kết luận đúng là **có hai bộ hình khác phiên bản và bộ draw.io chưa dùng được như nguồn hiện hành cho mọi nhánh**.

**Cần bổ sung để đóng:** chọn một bộ nguồn trình bày thống nhất, cập nhật draw.io hoặc gắn nhãn lịch sử rõ và xuất hình từ nguồn hiện hành; kiểm actor, thứ tự, nhánh từ chối/hủy và trạng thái kết thúc. Tạo bảng thay đổi “bản bảo vệ cũ → baseline mới → lý do → BF/UC/BR bị tác động”. Kiểm trực tiếp slide/Word phát hành trước lần trình bày tiếp theo; repo hiện không có slide để xác nhận đã làm bước này.

### GAP-007 — P2 — ERD đã có nền truy vết nhưng cần trình bày đúng mức

**Dẫn chứng:** database VI dòng 110–131, 147–155; SQL có `app_user`, `app_role`, `evidence`, `defect_case`, `warehouse_task_line`, `stock_account`, `stock_balance`, `posting_batch`, `stock_movement`.

Không còn đúng nếu nhận định thiết kế chi tiết hiện tại vẫn thiếu toàn bộ các đối tượng thầy cô nêu. Cụ thể:

- Account/Role được mô hình bằng app_user/app_role và các bảng quyền/phạm vi kho.
- Attachment được mô hình bằng evidence; không cần thêm bảng chỉ để khớp tên Attachment.
- Defective Goods Case có defect_case, disposition và defect_hold.
- Location Movement có TO-RELOCATE/warehouse_task_line cộng stock_movement hai đầu; không bắt buộc có thêm bảng cùng tên nếu cấu trúc này lưu đủ nghiệp vụ.
- `stock_movement` liên kết `line_id/document_id` với from/to stock_balance; stock_balance giữ lot, quality, owner và stock_account; stock_account trỏ location hoặc transit. Vì vậy vị trí không nhất thiết nằm trực tiếp trên mọi document_line để truy vết được.

**Giới hạn:** ERD 14 thực thể cố ý không có ô riêng cho defect case, TR/TD/MWTR, CR/FD/SR, evidence và nhiều hồ sơ khác; Conceptual ERD 13 thực thể khái quát chúng vào “Chứng từ nghiệp vụ”. Ba ERD Mermaid trong SRS/database tập trung vào các mở rộng A1/B1/C2, không phải hình tổng thể mọi bảng. Chỉ đưa một hình rút gọn mà không giải thích mapping sẽ chưa chứng minh đầy đủ yêu cầu của thầy cô.

**Cần bổ sung để đóng:** bảng đối chiếu BF → UC → đối tượng nghiệp vụ → cấu trúc dữ liệu → nguồn/dòng → lot/location → biến động. Có thể giữ ERD khái niệm gọn và kèm góc nhìn chi tiết; không cần ép toàn bộ 82 bảng vào một slide. Dùng ví dụ khách trả một phần theo GI gốc để chứng minh chuỗi truy vết.

Trả hàng là **chứng từ mới liên kết chứng từ gốc**. Chứng từ đã post giữ lịch sử; đảo/điều chỉnh cần điều kiện và kiểm phụ thuộc, không sửa phiếu xuất cũ để cộng lại tồn. Quy tắc này hiện đã có ở S1 mục 15.3 và database VI dòng 536.

### GAP-008 — P2 — Chưa đủ bằng chứng quy trình đã được cửa hàng xác nhận

**Dẫn chứng:** một phản hồi S9; S1 mục 12 dòng 964–982 tiếp tục để mở danh sách/quyền các kho, nhân sự, calibre, hệ số SKU, thời hạn trả hàng, custody, thời lượng khóa kiểm kê, ưu tiên nguồn và đối chiếu MISA.

Khảo sát mới hỗ trợ việc Sales/Kho đề xuất và kế toán đặt hàng; kiểm hằng tháng/đếm lại; kho đi/kho nhận xác nhận. Tuy nhiên câu 13 chọn hai ý mâu thuẫn về điều chuyển; câu 20 ghi Chủ/người được ủy quyền duyệt xuất trả, trong khi To-be BF-08 đã chọn bỏ Owner duyệt. Câu 21 dự kiến kế toán/một người nhập chung cũng khác To-be mỗi bộ phận dùng tài khoản cá nhân. Tài liệu hiện đã ghi nhận một số khác biệt; vẫn cần người vận hành xác nhận khả thi.

**Cần bổ sung để đóng:** walkthrough với cửa hàng, ghi ai trả lời và ngày xác nhận; chốt điểm khác As-is/To-be, điều kiện trả, phân công, quyền nhập liệu/duyệt và cách đối soát hai hệ thống. Quyết định thiết kế của nhóm hoặc người dùng không tự thay thế xác nhận vận hành của cửa hàng hay chấp thuận phạm vi của GVHD.

## 5. Nội dung có thể dùng để giải trình ngay

1. **Nhập hàng:** “Nhu cầu xuất hiện khi đơn khách thiếu, tồn khả dụng xuống dưới ngưỡng hoặc cần bù sau kiểm kê/hàng lỗi. Sales/Kho đề xuất, Chủ duyệt; kế toán lập PO sau duyệt. PO chưa làm tăng tồn.”
2. **Điều chuyển:** “Chuyển vị trí cùng kho khác điều chuyển liên kho. Liên kho có xuất nguồn–transit–nhận đích độc lập; thiếu/hỏng được xử lý theo từng lượng. Tự sinh TR vẫn là phần phải bổ sung/chốt.”
3. **Kiểm kê:** “Snapshot là số dư làm căn cứ đối chiếu, freeze là khóa thay đổi trong phạm vi. Đếm lại lưu lịch sử; chủ duyệt phương án; chênh lệch lượng và thay đổi chất lượng được ghi riêng, mở khóa sau khi xử lý xong.”
4. **Trả khách:** “Sales tiếp nhận nhu cầu, kho kiểm thực tế, Sales quyết định thông thường/Chủ duyệt ngoại lệ; kho nhập bằng chứng từ mới theo nguồn. Hoàn tiền xử lý ở MISA, WMSD chỉ lưu tham chiếu.”
5. **Phạm vi:** phải nói rõ SO là bản chép nhu cầu từ nguồn ngoài. Nếu giữ PAY-CFM, trình đây là phần theo dõi xác nhận bên ngoài đã chọn bổ sung; không gọi là kho thuần túy đã được thầy cô duyệt khi chưa có bằng chứng.

Các câu trên giải thích được thiết kế hiện tại, không thay thế việc hoàn thiện những phần chưa có.

## 6. Thứ tự khắc phục và điều kiện chốt đánh giá

| Thứ tự | Việc cần hoàn thành | Bằng chứng đóng |
|---|---|---|
| 1 | Chốt phạm vi SO/PAY-CFM và cơ chế tự sinh TR theo nhận xét. | Quyết định có người xác nhận; delta phạm vi/luồng rõ. |
| 2 | Bổ sung đầu kỳ/import, hủy TR và yêu cầu đếm mù/phân công. | UC, quyền, SC, trạng thái, quy tắc và tình huống nghiệm thu tương ứng. |
| 3 | Đồng bộ quy trình VI/EN, Report 1/SRS, thiết kế dữ liệu/API. | Không còn thao tác được mô tả nhưng thiếu quyền/nguồn/điểm ghi nhận; cập nhật tổng UC nếu có thay đổi. |
| 4 | Chốt bộ hình hiện hành và phát hành slide/báo cáo cùng phiên bản. | Không dùng UC retired hoặc sai lane; có bảng giải trình thay đổi với bản cũ. |
| 5 | Walkthrough với cửa hàng và chạy các tình huống liên quy trình. | Biên bản xác nhận; phân biệt test đã chạy với case mới được viết. |

Bộ tình huống liên quy trình tối thiểu: khách thiếu hàng → kho khác/điều chuyển/mua; TR100 xuất60 rồi hủy40; nhận98 trong đó3 vỡ trên TD100; sổ50 đạt/đếm48 đạt+2 vỡ; phương án kiểm kê bị từ chối; khách trả2 trên GI10; giao thất bại quay về; nhập tồn đầu cùng lô ở hai vị trí và import lại cùng file.

**Trạng thái cuối đợt đánh giá: “đã khắc phục nhiều điểm trong thiết kế, còn các yêu cầu và bằng chứng cần hoàn tất trước khi tuyên bố đáp ứng đầy đủ nhận xét hội đồng”.** Lượt này chỉ thêm báo cáo đánh giá, không thay baseline, không sửa sơ đồ, không stage/commit và không chạy kiểm thử ứng dụng.
