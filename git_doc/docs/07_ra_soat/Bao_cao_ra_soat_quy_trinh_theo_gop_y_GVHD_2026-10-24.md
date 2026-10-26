# Báo cáo rà soát quy trình WMSD theo góp ý của giảng viên

> Snapshot lịch sử theo ngày trong tiêu đề, giữ nguyên kết luận/số liệu/đường dẫn nguồn tại thời điểm ghi nhận. Trạng thái tài liệu hiện tại: [hậu kiểm đồng bộ 25/10/2026](Ket_qua_dong_bo_tai_lieu_2026-10-25.md). Các mục “chưa sửa/giữ Report 2”, quyền cũ hoặc số bảng cũ bên dưới không mô tả baseline hiện hành.


- Ngày rà soát lại: **24/10/2026**.
- Tài liệu được đánh giá: **Đề xuất quy trình 2 — WMSD — Tiếng Việt**, phiên bản 3.0.0, cập nhật 22/10/2026.
- Phạm vi: tám luồng BF-01–BF-08; đối chiếu mô tả, ngoại lệ, Mermaid, quyền, business rules và chuỗi chứng từ liên quan.
- Kết quả là **đánh giá tài liệu**, không phải kết quả kiểm thử phần mềm. Báo cáo này không sửa tài liệu quy trình gốc hoặc các sơ đồ.

## 1. Kết luận để đọc trước

**Bản đề xuất có nền tảng nghiệp vụ phù hợp, nhưng chưa hoàn toàn khớp nhận xét trong biên bản được cung cấp.** Không cần viết lại toàn bộ tám luồng.

Hai điểm lệch trực tiếp cần xử lý trước khi chốt:

1. **BF-05:** đang buộc đếm lại khi có chênh lệch; biên bản và note kiểm kê cho phép chọn Clear Difference hoặc Recount.
2. **BF-06:** đang tạo phiếu xuất sau Picking; biên bản đặt bước tạo phiếu xuất trước Picking. Cần tách tạo phiếu nháp khỏi post phiếu, giữ thời điểm giảm tồn khi thực bàn giao.

Các điểm còn lại thuộc nhóm mô tả chưa đủ rõ, cần thống nhất lựa chọn thiết kế hoặc rủi ro logic bổ sung. Đặc biệt, **không đủ căn cứ kết luận cô yêu cầu bỏ mọi phê duyệt của Owner ở BF-07**, và **không được kết luận BF-04 chưa hỗ trợ nhiều đợt**.

## 2. Nguồn và nguyên tắc đối chiếu

### 2.1. Danh mục nguồn

| Ký hiệu | Nguồn | Cách sử dụng |
|---|---|---|
| P | [de_xuat_quy_trinh_2_VI.md](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) | Đối tượng đánh giá; đã đọc toàn bộ ở lượt rà soát trước và kiểm tra lại các đoạn liên quan trong lượt này. |
| M | [Biên bản họp nhóm G56](C:/Users/minhs/OneDrive/Desktop/bi_n_b_n_h_p_d_n_nh_m_g56.md) | Căn cứ ưu tiên về nhận xét của giảng viên. |
| D1 | [WMSD_Bangach-Bản sao của BF01 Mới.drawio.xml](<C:/Users/minhs/OneDrive/Desktop/WMSD_Bangach-Bản sao của BF01 Mới.drawio.xml>) | Note mua/nhập hàng và quan hệ các bước. Trang: “Bản sao của BF01 Mới”. |
| D2 | [WMSD_Bangach-Chuyển kho.drawio.xml](<C:/Users/minhs/OneDrive/Desktop/WMSD_Bangach-Chuyển kho.drawio.xml>) | Note và các bước bổ sung về Picking, TO, put-away, chia đợt. Trang: “Chuyển kho”. |
| D3 | [WMSD_Bangach-INVENTORY AUDIT PROCESS.drawio.xml](<C:/Users/minhs/OneDrive/Desktop/WMSD_Bangach-INVENTORY AUDIT PROCESS.drawio.xml>) | Note hai hướng xử lý chênh lệch kiểm kê. Trang: “INVENTORY AUDIT PROCESS”. |

Thứ tự ưu tiên theo yêu cầu người dùng: **nhận xét trong M → note/chú thích sửa trong draw.io → các hình và đường nối cũ**. Một đường nối chưa sửa không được dùng để bác bỏ nhận xét ở nguồn ưu tiên cao hơn. Những đoạn gọi là “note” trong D2 bao gồm cả nhãn bổ sung thể hiện ý sửa; không khẳng định tất cả đều do giảng viên trực tiếp viết.

Các action item như gửi tài liệu, sửa database hay tìm hiểu Odoo là nội dung cuộc họp; không phải yêu cầu tự thực hiện trong lần rà soát này.

### 2.2. Dấu vết note đã đối chiếu

| Nguồn / cell ID | Nội dung nhận diện | Kết luận áp dụng |
|---|---|---|
| D1 — Kv_OsmvDRLkU-hTQ77P0-0 | Đề nghị → duyệt → PO → GR → tạo TO xác định vị trí → Confirm TO; chưa đủ thì quay lại GR; reject → xem lý do → Edit PR. | BF-01 đã có phần lớn chuỗi này. Không ghi nhận lỗi “thiếu hoàn toàn TO”. |
| D2 — YugwCmwDcmz_hehvzerD-59, -61, -63, -64 | Phiếu xuất tham chiếu yêu cầu; đưa hàng ra staging; Picking bằng TO; Confirm TO. | Làm rõ nhiệm vụ kho sau TR được duyệt, tránh tạo thêm vòng duyệt liên kho. |
| D2 — YugwCmwDcmz_hehvzerD-69; XavdK_t681Dh5oyh7WCD-40, -42 | Yêu cầu nội kho; TO put-away từ cửa kho đến vị trí lưu trữ; xác nhận TO. | MWTR và TO put-away có chức năng khác nhau; cần thể hiện rõ xác nhận TO. |
| D2 — YugwCmwDcmz_hehvzerD-75 | “Transfer Completed?”; có đường quay về tạo đợt xuất. | Phân biệt hoàn tất một đợt với hoàn tất TR. |
| D3 — lS3HtGYTxW23hGVE0gqH-29 | Có chênh lệch → Clear Difference hoặc Start Recount; Enter Recount quay lại kiểm tra chênh lệch. | Là căn cứ sửa nhánh BF-05. |

D2 còn đường nối cũ từ XavdK_t681Dh5oyh7WCD-17 (“Confirm xuất hàng thành công”) sang YugwCmwDcmz_hehvzerD-63 (“Picking with TO”). Không dùng đường này làm thứ tự chuẩn, vì M mô tả Picking trước xác nhận xuất.

### 2.3. Giới hạn kết luận

- M không ghi ngày họp cụ thể, nên chưa thể xác lập quan hệ trước/sau với mọi quyết định D1–D8 hoặc sửa đổi BF-06 đã ghi trong P.
- Không mở lại review1.md, Report 1/3 bên ngoài hoặc các nguồn SAP/MISA/thuế trong lượt này; không xác nhận các tuyên bố đồng bộ toàn bộ tài liệu hay tuân thủ thuế.
- Đã trích đọc nhãn, note và liên kết XML của ba file đính kèm. Chưa render để nghiệm thu trực quan bộ hình hiện hành trong repo.
- Liên kết và số dòng dưới đây ứng với nội dung nguồn tại thời điểm rà soát; số dòng có thể đổi khi tài liệu được chỉnh sửa. Các nguồn đính kèm ở Desktop là đường dẫn trên máy hiện tại, chưa phải gói bằng chứng có thể chuyển sang máy khác.

## 3. Đánh giá từng luồng

| Luồng | Kết luận | Nội dung phù hợp | Điểm cần xử lý |
|---|---|---|---|
| BF-01 — Bổ sung, đặt mua, nhập kho | Cơ bản phù hợp | Có duyệt nhu cầu, PO, GR, TO put-away; nhận nhiều đợt; không cộng tồn lần nữa khi put-away. | Tách nhánh giữ hộ/từ chối khỏi put-away của hàng đã chấp nhận trên Mermaid. |
| BF-02 — Hàng lỗi | Thiết kế bổ trợ có cơ sở | Cách ly ngay; giữ đúng ownership; tránh giảm tồn lặp khi chuyển BF-08. | Làm rõ xử lý quality khi phạm vi kiểm kê đang khóa. M không mô tả đủ để nói toàn bộ BF-02 đã được cô duyệt. |
| BF-03 — Chuyển vị trí cùng kho | Phù hợp | TO → thực hiện → xác nhận; không Owner duyệt; giữ tổng tồn và reservation. | Chuẩn hóa tên activity thành thao tác trên phần mềm khi vẽ To-be. |
| BF-04 — Điều chuyển liên kho | Đúng nền tảng; mainflow cần rõ hơn | Hai đầu độc lập, in-transit, nhiều đợt, nhận thiếu/hỏng, xử lý chênh lệch. | Làm rõ TD nháp trước Picking, xác nhận TO, điều kiện tiếp tục/đóng TR. |
| BF-05 — Kiểm kê | Chưa khớp nhánh quyết định | Snapshot, khóa phạm vi, lịch sử đếm, delta, chống post trùng. | Bổ sung hai lựa chọn Clear Difference hoặc Recount. |
| BF-06 — Đơn bán/xuất/giao | Chưa khớp thứ tự tạo GI | SO nguồn ngoài, WIR/OD, giao từng phần; phân biệt PGI/POD/PAY-CFM. | Tạo GI nháp trước Picking; thống nhất nhánh hàng giao thất bại quay về. |
| BF-07 — Khách trả | Kiểm soát chính phù hợp; cần giải thích phê duyệt | Kiểm nguồn, chặn vượt, phân loại từng lượng; Warehouse xác nhận nhập. | Phân biệt một lần duyệt thương mại trước GR với duyệt lại sau GR. |
| BF-08 — Trả NCC | Phù hợp phần kho; tài chính cần cụ thể | Thỏa thuận, xuất, NCC xác nhận nhận, đối chiếu, tham chiếu ngoài WMS. | Nêu rõ Invoice/Credit Note và liên kết lượng/chứng từ. |

Các phần đã phù hợp cần giữ: [BF-01](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:159), [BF-02](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:192), [BF-03](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:219), [quan hệ nhiều đợt BF-04](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:945).

## 4. Phát hiện cần xử lý theo góp ý và cách trình bày

Quy ước: **P1** — cần giải quyết trước khi chốt luồng; **P2** — cần làm rõ/đồng bộ mô tả. Đây là mức ưu tiên rà soát tài liệu, không phải phân loại lỗi phần mềm đã tái hiện.

### GAP-001 — BF-05 đang bắt buộc Recount thay vì cho hai hướng xử lý

**Loại:** lệch trực tiếp so với M và note D3. **Ưu tiên: P1.**

M nêu hai hướng tại [mục kiểm kê](C:/Users/minhs/OneDrive/Desktop/bi_n_b_n_h_p_d_n_nh_m_g56.md:75): Clear Difference hoặc Recount rồi so sánh lại. D3, cell lS3HtGYTxW23hGVE0gqH-29, xác nhận cùng ý.

P lại quy định “Chênh lệch hoặc lot lạ → kiểm đếm lại” ở [bước 6](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:271), và Mermaid đưa mọi nhánh có chênh lệch sang “Đếm lại và giải trình” ở [dòng 742](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:742). Như vậy thiếu đường đi xử lý trực tiếp khi đã đủ căn cứ.

**Sửa đề nghị:** sau quyết định có chênh lệch, cho chọn đếm lại hoặc giải trình/lập đề nghị điều chỉnh. Đếm lại phải quay về so sánh và có thể lặp. Clear Difference vẫn cần dữ liệu hợp lệ, đúng quyền và phê duyệt theo thiết kế đã chốt. Không chênh thì đóng/mở khóa, không tạo ADJ=0.

Không có căn cứ từ M để kết luận Owner Clear Difference là sai. Giữ snapshot và post delta một lần; không diễn giải “cập nhật tồn thực tế” thành ghi đè thiếu kiểm soát.

**Phần liên quan:** BF-05, UC-87/88/91/92/93, BR-23, mục 10 và 15.4.

### GAP-002 — BF-06 tạo GI sau Picking, khác thứ tự trong biên bản

**Loại:** lệch trực tiếp về thứ tự chứng từ. **Ưu tiên: P1.**

M đặt “Tạo phiếu xuất kho” trước Picking trong [luồng xuất bán](C:/Users/minhs/OneDrive/Desktop/bi_n_b_n_h_p_d_n_nh_m_g56.md:52). P tạo TO, soạn hàng rồi mới lập GI-S tại [bước 5–8](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:299); Mermaid cũng giữ thứ tự đó.

**Sửa đề nghị:** tạo GI-S ở trạng thái nháp từ OD trước Picking; sau soạn hàng xác nhận TO/lượng thực tế; khi thực bàn giao mới PGI. Đây là phương án làm rõ theo nhận xét, không khẳng định mọi WMS đều bắt buộc cùng một thứ tự.

P đã có [quy ước tạo khác post](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:912). Cần tách điều kiện tạo GI nháp với điều kiện post trong bảng chứng từ, vì [dòng GI-S hiện tại](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:927) gộp cả lượng đã soạn và bàn giao vào nguồn bắt buộc.

**Giữ nguyên nguyên tắc:** tạo nháp không giảm tồn; Picking chỉ chuyển vị trí; PGI giảm lượng thực bàn giao đúng một lần. SO sao chép, POD và PAY-CFM được P ghi nhận là quyết định thiết kế trước đó, không tự loại bỏ chỉ vì M không đề cập.

**Phần liên quan:** BF-06, UC-52–58, mục 10, 15.1 và 15.4.

### GAP-003 — BF-04 cần tách tạo TD, Picking và điều kiện hoàn tất TR

**Loại:** mainflow chưa nhất quán với mức chi tiết đã có. **Ưu tiên: P2.**

M mô tả kho nguồn tạo GI trước Picking; kho nhận lập GR rồi put-away và Confirm TO. Xem [mục chuyển kho](C:/Users/minhs/OneDrive/Desktop/bi_n_b_n_h_p_d_n_nh_m_g56.md:67). Note D2 bổ sung TO Picking, TO put-away và “Transfer Completed?” quay lại tạo đợt xuất.

P [bước 4](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:242) gộp soạn, lập TD và bàn giao. Mermaid [nhánh không sai lệch](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:719) đi thẳng put-away/đóng điều chuyển, chưa phân biệt rõ một đợt khớp với toàn bộ TR hoàn tất.

**Sửa đề nghị:** thể hiện TD nháp trước Picking, xác nhận thực hiện TO khi áp dụng, post TD khi bàn giao, MWTR thực nhận và xác nhận TO put-away. Sau mỗi đợt cần kiểm lượng yêu cầu còn phải thực hiện, lượng đang chuyển và sai lệch còn mở trước khi đóng TR.

**Không kết luận thiếu chức năng:** P đã có một TR nhiều TD, một TD nhiều MWTR ở mục 15.2; [dòng 940](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:940) cũng đã nêu TO put-away và TO Picking khi dùng staging. Phạm vi áp dụng TO Picking cần nói rõ hơn nếu muốn theo sát note; không dựng thêm lớp Owner duyệt. TD chính là phiếu xuất điều chuyển, không tạo GI thứ hai để trừ cùng lượng.

Chữ “TRequirement nội bộ” trong D2 chưa đủ để áp đặt thêm một mô hình chứng từ SAP hoặc phục hồi UC-42 đã retired.

### GAP-004 — BF-07 cần giải thích phê duyệt thương mại theo mục tiêu tinh gọn

**Loại:** cần thống nhất cách hiểu, chưa đủ căn cứ kết luận vi phạm trực tiếp. **Ưu tiên: P2.**

[M dòng 44](C:/Users/minhs/OneDrive/Desktop/bi_n_b_n_h_p_d_n_nh_m_g56.md:44) yêu cầu Warehouse xác nhận sau GR, tránh Owner phê duyệt lại các bước thừa. P có một lần Owner quyết định sau kiểm tra, trước GR tại [bước 5](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:347). Không có bước Owner duyệt lại sau GR.

Vì vậy, nhận định “cô yêu cầu bỏ mọi Owner approval” là quá mạnh. Tuy nhiên, bắt Owner duyệt tất cả trường hợp đủ điều kiện vẫn cần lý do so với mục tiêu tinh gọn trong M.

**Sửa đề nghị:** ghi rõ Owner duyệt quyết định thương mại nhận trả; Warehouse xác nhận số lượng/chất lượng và post GR. Nếu chọn tinh gọn cho ca thông thường, cần chốt điều kiện và vai trò có thẩm quyền, chỉ chuyển Owner các ngoại lệ. Đây là lựa chọn thiết kế đề xuất; M chưa tự cấp quyền quyết định thương mại cho Warehouse.

Nếu thay chính sách, phải đồng bộ UC-71/73, permission matrix, BR-17/29, trạng thái CR và chuỗi chứng từ; không chỉ xóa một node trên sơ đồ.

### GAP-005 — BF-08 chưa chỉ rõ Invoice/Credit Note trong hồ sơ đối chiếu

**Loại:** đã đáp ứng một phần, cần cụ thể hóa. **Ưu tiên: P2.**

[M dòng 46](C:/Users/minhs/OneDrive/Desktop/bi_n_b_n_h_p_d_n_nh_m_g56.md:46) nhấn mạnh chứng từ điều chỉnh công nợ. P đã có Accountant xử lý tài chính ngoài WMS và lưu tham chiếu tại [bước 8](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:382), cùng UC-108. Vì vậy không phải hoàn toàn thiếu liên kết kế toán, nhưng chưa mô tả cụ thể Invoice/Credit Note cho trả NCC.

**Sửa đề nghị:** nêu loại chứng từ ngoài, mã/ngày, nguồn mua và GI-SR liên quan, lượng đã đối chiếu, bằng chứng và trạng thái xác minh. Thỏa thuận NCC trước xuất thuộc UC-107; tham chiếu chứng từ tài chính thuộc UC-108. Ảnh tin nhắn là bằng chứng thương lượng, chưa tự chứng minh đã đối chiếu tài chính.

Giữ riêng hoàn tất kho với hoàn tất tài chính theo mục 15.3. Không yêu cầu có Credit Note trước xuất, không đưa hạch toán/chi tiền vào WMS và không suy ra thủ tục thuế từ lần đối chiếu tài liệu này.

### GAP-006 — Mermaid BF-01 gộp hàng giữ hộ/từ chối vào bước put-away chung

**Loại:** sai lệch giữa hình rút gọn và mô tả chi tiết. **Ưu tiên: P2.**

Trong [Mermaid BF-01](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:665), H “chờ xử lý hoặc giữ hộ” và I “từ chối ngay” đều nối vào J “Put-away và cập nhật phần PO còn thiếu”.

Phần chữ đã phân biệt ownership và hàng không nhận đúng ở bước 6–7. Lỗi nằm ở chỗ gộp hai hành động vào một node khiến hàng từ chối cũng có vẻ phải put-away.

**Sửa đề nghị:** hàng chấp nhận → GR → TO put-away/xác nhận; giữ hộ → hồ sơ custody và vị trí giữ riêng khi cần; từ chối → bàn giao trả. Chỉ hội tụ ở node “Cập nhật lượng PO còn thiếu”. Không cấm chuyển vị trí vật lý của hàng custody; chỉ không được nhập nó thành tồn sở hữu/bán được.

### GAP-007 — Một số tên activity chưa thể hiện rõ thao tác trên phần mềm

**Loại:** cần chuẩn hóa cách trình bày To-be. **Ưu tiên: P2.**

M yêu cầu To-be mô tả tương tác phần mềm tại [mục mua hàng](C:/Users/minhs/OneDrive/Desktop/bi_n_b_n_h_p_d_n_nh_m_g56.md:57) và [kết luận 3](C:/Users/minhs/OneDrive/Desktop/bi_n_b_n_h_p_d_n_nh_m_g56.md:90). P còn dùng các cụm “di chuyển”, “đếm”, “soạn và bàn giao” trong activity.

**Sửa đề nghị:** dùng “Tạo TO”, “Nhập kết quả kiểm nhận”, “Xác nhận TO put-away”, “Nhập kết quả kiểm đếm”, “Ghi nhận bàn giao và post phiếu”. Hành động vật lý vẫn được mô tả trong giải thích/điều kiện xác nhận. Không phải mọi câu nhắc tới thực tế trong tài liệu đều là lỗi.

Mục 16 của P đã định hướng actor + hành động + chứng từ; cần áp dụng nhất quán khi vẽ lại.

## 5. Rủi ro logic bổ sung do người rà soát phát hiện

Hai phát hiện sau độc lập với lời nhận xét của cô; chưa phải lỗi runtime đã kiểm thử.

### GAP-008 — BF-06 → BF-07 chưa rõ căn cứ nhận hàng giao thất bại quay về

**Loại:** chưa thống nhất thuật ngữ và điều kiện giữa hai luồng. **Ưu tiên: P1.**

P [dòng 316](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:316) chuyển hàng khách từ chối sau PGI sang BF-07. Nhưng BF-07 [bước 2](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:344) kiểm lượng “đã giao”, trong khi POD ở BF-06 biểu thị khách thực nhận. BR-16 và mục 15.2 lại quy chiếu nguồn xuất/GI.

Ví dụ: PGI 10 thùng, khách từ chối toàn bộ, POD=0. Nếu giới hạn trả dựa vào POD thì không nhận lại được 10 thùng. Nếu dựa vào GI thì phải phân biệt hàng giao thất bại với khách trả sau khi đã sử dụng/nhận hàng.

**Sửa đề nghị:** định nghĩa nhánh nhận lại hàng giao không thành công, gắn GI-S đã post và bằng chứng từ chối; quy định số lượng, tình trạng, nguồn sở hữu và ảnh hưởng nhu cầu còn phải giao. Không tạo POD giả, không áp điều kiện D6 của khách trả thông thường một cách máy móc, không tăng tồn bằng sửa trạng thái. Có thể dùng nhánh riêng trong BF-07 hoặc quy trình nhận quay về liên kết; phải chốt một cách duy nhất.

### GAP-009 — Cách ly ngay và khóa kiểm kê chưa có thứ tự xử lý thống nhất

**Loại:** thiếu mô tả ngoại lệ có kiểm soát. **Ưu tiên: P2.**

[BF-02](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:193) yêu cầu chặn/cách ly hàng lỗi ngay. BF-05 và [EX-04](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:408) chặn mọi thay đổi lượng/vị trí/quality trong phạm vi kiểm kê. [BF-05-A2](D:/Ky_9/SEP490/git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md:287) vẫn chuyển xử lý quality/BF-02 khi giữ khóa.

Ví dụ: sổ 50 viên, đếm đủ 50 nhưng có 2 viên vỡ. Cần ngăn 2 viên này được phân bổ khi phiên kết thúc, đồng thời bảo vệ snapshot và lịch sử kiểm kê.

**Sửa đề nghị:** mô tả chuyển quality có kiểm soát trong bước xử lý phiên, hoặc lưu lượng bị chặn rồi thực hiện tái phân loại theo thứ tự bảo đảm không được xuất trở lại sau mở khóa. Không tự mở khóa để lách quy trình; không ghi thiếu 2 rồi hủy thêm 2. Chưa đủ căn cứ nói hệ thống chắc chắn deadlock; hiện mới là phần hành vi chưa được tài liệu chốt.

## 6. Chuỗi thao tác đề nghị để thống nhất lại

Các chuỗi dưới đây là đề nghị sửa tài liệu, chưa phải thay đổi đã áp dụng.

| Luồng | Chuỗi rút gọn |
|---|---|
| BF-01 | RR → duyệt → PO → nhập kết quả nhận/kiểm → GR phần chấp nhận → tạo/xác nhận TO put-away → cập nhật lượng còn thiếu → nhận đợt tiếp hoặc chốt thiếu hợp lệ. Custody/từ chối đi nhánh riêng. |
| BF-03 | Chọn hàng/vị trí → tạo TO-RELOCATE → xác nhận lượng thực chuyển → đóng hoặc giữ phần còn lại. Không Owner duyệt. |
| BF-04 | TR → duyệt → TD nháp → Picking/xác nhận TO khi áp dụng → bàn giao/post TD → in-transit → MWTR → tạo/xác nhận TO put-away → kiểm phần còn lại/sai lệch → tiếp tục hoặc đóng TR. |
| BF-05 | Tạo tài liệu/khóa/snapshot → nhập kết quả → so sánh → không chênh thì đóng; có chênh thì chọn Recount quay về so sánh hoặc giải trình/duyệt/Clear Difference. |
| BF-06 | SO → WIR/OD → GI-S nháp → TO Picking/xác nhận thực soạn → bàn giao/PGI → POD → PAY-CFM. Chỉ PGI giảm tổng tồn. |
| BF-07 | Kiểm nguồn/điều kiện → nhập kết quả kiểm → chấp nhận thương mại theo quyền đã chốt → Warehouse GR và xác nhận TO nếu cần → khả dụng/cách ly; phần không nhận giữ custody rồi bàn giao trả. |
| BF-08 | Đề nghị/thỏa thuận → duyệt xuất → GI-SR và bàn giao → NCC xác nhận → đối chiếu lượng → lưu tham chiếu Invoice/Credit Note bên ngoài; theo dõi tài chính riêng. |

## 7. Tình huống dùng để duyệt lại tài liệu

Đây là các kịch bản nghiệm thu đề nghị, không phải test đã chạy.

| Mã | Tình huống | Kết quả tài liệu cần quy định rõ |
|---|---|---|
| KT-01 | PO 100; nhận 60 rồi 40 | Hai đợt GR, TO tương ứng; put-away không cộng tổng tồn lần nữa; nhận xong 60 không đóng PO nếu còn cần nhận 40. |
| KT-02 | TR 100; xuất 60 rồi 40, đợt 60 nhận nhiều lần | Theo dõi TD/MWTR riêng; phần chưa xuất không phải in-transit; chưa đóng toàn bộ TR sau khi nhận đủ đợt 60. |
| KT-03 | SO 20; tạo GI nháp; soạn 20 nhưng mới bàn giao 18 | Tạo nháp không giảm tồn; PGI giảm 18; 2 còn staging/unpick và nhu cầu còn lại có cách xử lý rõ. |
| KT-04 | Snapshot 50, đếm 48 | Nếu đủ căn cứ có đường giải trình/duyệt/Clear Difference không buộc recount; nếu chưa rõ có đường recount quay lại so sánh; post -2 một lần, retry không thành 46. |
| KT-05 | Khách trả vượt nguồn; hoặc mang 10 gồm 7 đạt, 2 lỗi được nhận, 1 sai nguồn | Chặn vượt/không rõ nguồn; tách 7 tồn đạt, 2 cách ly, 1 custody; không cộng 10 bán được. |
| KT-06 | PGI 10, POD=0 vì khách từ chối toàn bộ | Nhận quay về có căn cứ GI và bằng chứng giao thất bại, không cần POD giả; quy định rõ nhu cầu giao lại/hủy và không nhập trùng. |
| KT-07 | Đếm 50 gồm 48 đạt, 2 vỡ trong vùng khóa | Tổng 50; chặn lượng lỗi và tái phân loại theo thứ tự đã chốt; không ghi mất rồi hủy cùng 2 viên. |
| KT-08 | Đã trả NCC, chỉ có ảnh tin nhắn và chưa có tham chiếu tài chính được xác minh | Phần kho theo dõi theo kết quả lượng; phần tài chính chưa được coi hoàn tất chỉ nhờ ảnh thỏa thuận. Sau đó gắn chứng từ ngoài theo hồ sơ thực tế. |

## 8. Thứ tự chỉnh sửa và điều kiện chốt

1. Giải quyết GAP-001, GAP-002 và GAP-008 trước: nhánh kiểm kê, GI nháp/post, hàng giao thất bại.
2. Đồng bộ mainflow BF-04 và sửa điểm hội tụ BF-01.
3. Chốt một cách hiểu duy nhất cho phê duyệt BF-07; nêu rõ chứng từ đối chiếu BF-08.
4. Quy định xử lý hàng lỗi trong khóa kiểm kê; chuẩn hóa tên thao tác To-be.
5. Cập nhật đồng thời mục 4, Mermaid mục 10, UC, permission matrix, BR và mục 15 sau khi chọn phương án. Ghi nhận M và các note làm căn cứ; không tự cho rằng mọi ý đều mới hơn D1–D8.
6. Sau khi logic thống nhất, kiểm bộ draw.io phát hành theo yêu cầu BPMN: actor, tác vụ, gateway, nhánh và vòng lặp, bắt đầu/kết thúc. P đã tự ghi tại dòng 653 rằng Mermaid chưa phải BPMN swimlane hoàn chỉnh; chưa thể coi việc có Mermaid là đã hoàn thành yêu cầu BPMN. Không suy ra mọi hình chữ nhật bo góc đều sai chuẩn chỉ từ lời mô tả trong biên bản.

Một bản sửa có thể chốt khi tám luồng giữ nhất quán nguồn lượng, người xác nhận, mốc post, nhánh nhiều đợt và điều kiện kết thúc; các tình huống KT-01–08 đều có đường đi được mô tả rõ. Báo cáo này chỉ đề nghị các chỉnh sửa đó, không xác nhận chúng đã được triển khai.
