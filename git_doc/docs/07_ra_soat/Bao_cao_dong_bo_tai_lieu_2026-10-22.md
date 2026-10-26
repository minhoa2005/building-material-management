# Báo cáo rà soát tính nhất quán và đồng bộ tài liệu dự án WMSD (22/10/2026)

> Snapshot lịch sử theo ngày trong tiêu đề, giữ nguyên kết luận/số liệu/đường dẫn nguồn tại thời điểm ghi nhận. Trạng thái tài liệu hiện tại: [hậu kiểm đồng bộ 25/10/2026](Ket_qua_dong_bo_tai_lieu_2026-10-25.md). Các mục “chưa sửa/giữ Report 2”, quyền cũ hoặc số bảng cũ bên dưới không mô tả baseline hiện hành.


> **Bản ghi trước chỉnh sửa.** Các phát hiện và số dòng bên dưới phản ánh snapshot commit fdf6e7a. Đã thực hiện một lượt đồng bộ tiếp theo theo yêu cầu người dùng, giữ nguyên Report 2; xem [kết quả hậu kiểm](Ket_qua_dong_bo_tai_lieu_2026-10-22.md) để biết trạng thái hiện tại. Không dùng số dòng lịch sử này làm số dòng sau sửa.

- **Dự án:** Warehouse Management System Development (WMSD) — Capstone SEP490_G56 (Cửa hàng gạch ốp lát Tân Thương)
- **Ngày rà soát:** 22/10/2026
- **Đối tượng rà soát:** Kho tài liệu dự án tại Git commit `fdf6e7a` (33 tệp trên nhánh làm việc sạch, bao gồm 32 tạo phẩm tài liệu/tham khảo và 1 tệp log kỹ thuật loại trừ riêng)
- **Chuẩn đối chiếu (Comparison Baseline):** Thiết kế mục tiêu phiên bản `3.0.0` ngày 22/10/2026 trong bộ 5 tài liệu cốt lõi hiện hành ([de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md), [de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md), [de_xuat_database_design_EN.md](../03_thiet_ke/de_xuat_database_design_EN.md) và [WMSD_SQL_schema.sql](../03_thiet_ke/WMSD_SQL_schema.sql))
- **Tính chất tài liệu:** Báo cáo kiểm toán độc lập (read-only audit). Báo cáo này chỉ ghi nhận hiện trạng, bằng chứng sai lệch và khuyến nghị khắc phục; **báo cáo này không tự giải quyết hay sửa đổi bất kỳ vấn đề nào trong bộ tài liệu gốc**.

---

## 1. Kết luận tổng quan (Executive Conclusion)

Trong **nhóm 5 tài liệu thiết kế cốt lõi phiên bản `3.0.0` (ngày 22/10/2026)**, các kiểm tra cấu trúc và dãy mã định danh cho thấy sự khớp nhau về mặt tổ chức tài liệu, đồng thời các hợp đồng dữ liệu/bán hàng được lấy mẫu đối chiếu đều thống nhất trên các định nghĩa quan sát được: 8 luồng quy trình (`BF-01` đến `BF-08`), chuỗi mô hình `SO` → `WIR` → `OD`/soạn hàng → `PGI` → `POD`/`DELIVERED` → `PAY-CFM`/`COMPLETED`, bộ 111 mã Use Case (`98 ACTIVE`, `13 RETIRED`), 33 quy tắc nghiệp vụ (`BR-01`..`BR-33`), 37 nhánh `A/E`, 21 quy tắc dữ liệu (`R-01`..`R-21`), 40 kịch bản nghiệm thu dữ liệu (`T01`..`T40`) và 73 bảng / 2 view trên DDL tham chiếu T-SQL (ánh xạ sang MongoDB runtime). Các kiểm tra cấu trúc và đối chiếu mẫu này không đồng nghĩa với việc chứng minh tương đương dịch thuật ngữ nghĩa toàn diện trên từng câu chữ, và bản thân nhóm tài liệu này vẫn còn các điểm cần hiệu chỉnh câu chữ/nguồn trích dẫn ghi nhận tại `SYNC-06` và `SYNC-09`.

Tuy nhiên, **xét trên toàn bộ kho tài liệu dự án**, hiện trạng **chưa đủ tính đồng bộ xuyên suốt để sử dụng trực tiếp toàn bộ bộ hồ sơ cho việc triển khai (implementation) hoặc nghiệm thu (acceptance)** nếu không qua bước cập nhật đồng bộ hoặc gắn nhãn phân tách phiên bản rõ ràng. Cụ thể:

1. **Báo cáo nền tảng và đặc tả yêu cầu ([WMSD_Report1_Fix.docx.txt](../01_bao_cao/WMSD_Report1_Fix.docx.txt), [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt)) đang dừng ở baseline đầu ngày 21/10/2026 (cả hai văn bản vẫn dùng hệ 7 quy trình `BF-01`..`BF-07`; riêng [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) đang ở 108 UC và 30 BR):** Chưa có mô hình đơn bán sao chép `SO`, chưa có các Use Case `UC-109`, `UC-110`, `UC-111`, chưa có quy tắc `BR-31`..`BR-33`, và vẫn dùng hệ mã `BF-03`..`BF-07` cũ (chưa tách `BF-03` chuyển vị trí nội kho và `BF-04` điều chuyển liên kho).
2. **Khoảng trống tài liệu thiết kế hệ thống chi tiết hiện hành:** Tài liệu [WMSD_Thiet_ke_he_thong_chi_tiet.md](../03_thiet_ke/WMSD_Thiet_ke_he_thong_chi_tiet.md) đang ở phiên bản `1.0` ngày 16/10/2026 (102 UC, còn giữ quy trình quản lý giá bán/hóa đơn nội bộ/hoàn tiền, vai trò cũ và các route API của UC đã ngừng sử dụng), nhưng chưa có tài liệu thiết kế chi tiết phiên bản `3.0.0` thay thế.
3. **Sơ đồ thiết kế cơ sở dữ liệu và các sơ đồ quy trình/ngữ cảnh độc lập chưa cập nhật theo baseline `3.0.0`:** Tệp [WMSD_database_design.drawio](../03_thiet_ke/WMSD_database_design.drawio) vẫn thể hiện 63 bảng (thiếu 10 bảng trong [WMSD_SQL_schema.sql](../03_thiet_ke/WMSD_SQL_schema.sql)) và giữ khóa ngoại cũ trên bảng yêu cầu xuất kho; các tệp sơ đồ trong `docs/04_so_do/` vẫn phản ánh cấu trúc 7 quy trình hoặc ngữ cảnh/vai trò của các đợt trước.
4. **Điều hướng, liên kết và diễn đạt còn điểm lệch nhỏ:** Mục lục gốc [README.md](../../README.md) chưa liệt kê các tài liệu quy trình `3.0.0` và toàn bộ biên bản/khảo sát; một số câu giải thích trong bản tiếng Việt [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) còn giữ nhận định lịch sử cũ so với bản tiếng Anh; còn 2 đích liên kết nội bộ bị khuyết và 18 lượt liên kết đường dẫn tuyệt đối ngoài kho lưu trữ; và 1 chỗ ghi nguồn khảo sát cho ảnh chụp giao hàng cần tách bạch rõ giữa dữ liệu CSV thực tế với chỉ dẫn thiết kế bổ sung.

### Tổng hợp số lượng phát hiện theo mức độ ưu tiên tài liệu

> [!IMPORTANT]
> Các mức độ `P1`, `P2`, `P3` dưới đây là **mức độ ưu tiên hoàn thiện tài liệu (documentation priorities)**, không phải tuyên bố về sự cố vận hành hệ thống (production incidents):
> - **P1 (4 phát hiện — `SYNC-01` đến `SYNC-04`):** Bất đồng bộ trọng yếu về mô hình nghiệp vụ, mã quy trình, thiết kế chi tiết hoặc cấu trúc dữ liệu; cần giải quyết trước khi dùng các tài liệu liên quan làm căn cứ lập trình hoặc nghiệm thu.
> - **P2 (4 phát hiện — `SYNC-05` đến `SYNC-08`):** Vấn đề về phạm vi sơ đồ độc lập, diễn đạt đối chiếu nội bộ VI/EN, mục lục điều hướng và tính toàn vẹn liên kết/nguồn tham chiếu.
> - **P3 (1 phát hiện — `SYNC-09`):** Vấn đề diễn đạt căn cứ bằng chứng khảo sát (provenance wording).
> - **Quan sát kế hoạch độc lập (`OBS-01`):** 1 ghi nhận định lượng về cách diễn giải nỗ lực 350 person-days so với quỹ giờ hiệu dụng trong [WMSD_Report2.docx.txt](../01_bao_cao/WMSD_Report2.docx.txt) (không tính gộp vào 9 phát hiện đồng bộ kỹ thuật/nghiệp vụ).

| Mã | Mức ưu tiên | Nhóm vấn đề | Tài liệu chịu ảnh hưởng chính |
|---|---|---|---|
| `SYNC-01` | **P1** | Thiếu chuỗi mô hình bán hàng & nghiệm thu hiện hành (`SO` → `WIR` → `POD` → `PAY-CFM`, `UC-109..111`, `BR-31..33`) trong Report 1 & Report 3 | [WMSD_Report1_Fix.docx.txt](../01_bao_cao/WMSD_Report1_Fix.docx.txt), [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) |
| `SYNC-02` | **P1** | Lệch hệ mã quy trình `BF` (8 quy trình `BF-01..08` so với 7 quy trình `BF-01..07` gộp `BF-03`) giữa bộ đề xuất `3.0.0` và Report 1 / Report 3 | [WMSD_Report1_Fix.docx.txt](../01_bao_cao/WMSD_Report1_Fix.docx.txt), [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) |
| `SYNC-03` | **P1** | Chưa có tài liệu thiết kế hệ thống chi tiết hiện hành thay thế bản `1.0` ngày 16/10/2026 | [WMSD_Thiet_ke_he_thong_chi_tiet.md](../03_thiet_ke/WMSD_Thiet_ke_he_thong_chi_tiet.md) |
| `SYNC-04` | **P1** | Sơ đồ ERD draw.io chỉ có 63 bảng (thiếu 10 bảng SQL `3.0.0`) và giữ cột khóa ngoại cũ tại `issue_request` / `issue_request_line` | [WMSD_database_design.drawio](../03_thiet_ke/WMSD_database_design.drawio) |
| `SYNC-05` | **P2** | Các sơ đồ độc lập (`.drawio`, `.png`, `.mermaid`) tại `docs/04_so_do/` còn phản ánh luồng, mã `BF` và vai trò của các phiên bản trước | Các tệp trong `docs/04_so_do/` |
| `SYNC-06` | **P2** | Bản quy trình tiếng Việt còn giữ một số câu nhận định lịch sử chưa cập nhật tương đương bản tiếng Anh | [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) |
| `SYNC-07` | **P2** | `README.md` chưa cập nhật danh mục tài liệu `3.0.0`, thiếu 5 biên bản họp và tệp CSV khảo sát | [README.md](../../README.md) |
| `SYNC-08` | **P2** | Liên kết nội bộ tới 2 tệp bị khuyết và 18 lượt liên kết đường dẫn tuyệt đối ngoài kho lưu trữ (kèm chênh lệch phiên bản SAP `v4.2` vs `v4.1`) | [README.md](../../README.md), [change_logs.md](../../change_logs.md), các tệp tại `docs/02_nghiep_vu/` và `docs/03_thiet_ke/` |
| `SYNC-09` | **P3** | Gán ghép quá mức nguồn khảo sát CSV (`Q16`, `Q22`, `Q24`) cho yêu cầu chụp ảnh giao hàng khách (`POD`) | [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) |
| `OBS-01` | **Quan sát** | Chênh lệch 70 person-days (560 giờ) giữa tổng ước lượng công đoạn (350 ngày) và quỹ công hiệu dụng sau trừ buffer (280 ngày) | [WMSD_Report2.docx.txt](../01_bao_cao/WMSD_Report2.docx.txt) |

---

## 2. Phạm vi rà soát và Chuẩn đối chiếu (Scope & Comparison Baseline)

### 2.1. Phạm vi tệp được kiểm tra

Đợt kiểm toán bao phủ toàn bộ **33 tệp hiện có** trong kho Git tại commit `fdf6e7a` (trạng thái cây thư mục sạch khi bắt đầu phân tích), gồm:
- **32 tạo phẩm tài liệu và tham khảo:** 9 tệp Markdown (`.md`), 3 tệp văn bản trích xuất báo cáo (`.docx.txt`), 4 tệp sơ đồ `.drawio`, 1 tệp `.sql`, 1 tệp `.mermaid`, 2 tệp ảnh `.png`, 6 tệp biên bản họp Word (`.docx`), 1 tệp khảo sát (`.csv`), 5 tệp `.pdf`.
- **1 tệp nhật ký kỹ thuật loại trừ riêng:** [debug.log](../03_thiet_ke/debug.log) (nằm trong thư mục thiết kế nhưng là log kỹ thuật của công cụ/trình duyệt, không phải tài liệu nghiệp vụ hay thiết kế).

Mức độ đọc và xác minh trên từng định dạng:
- Toàn bộ 4 tệp XML `.drawio` đã được giải mã và đọc cấu trúc XML (tổng cộng **40 trang**: [WMSD_database_design.drawio](../03_thiet_ke/WMSD_database_design.drawio) 9 trang, [Business_Process.drawio](../04_so_do/Business_Process.drawio) 3 trang, [WMSD_Bangach.drawio](../04_so_do/WMSD_Bangach.drawio) 21 trang, [WMSD_Mainflows_EN.drawio](../04_so_do/WMSD_Mainflows_EN.drawio) 7 trang).
- Cả 2 tệp ảnh PNG ([WMSD_Mainflow_BF03B_VI.png](../04_so_do/WMSD_Mainflow_BF03B_VI.png) và [WMSD_Mainflow_BF03B_EN.png](../04_so_do/WMSD_Mainflow_BF03B_EN.png)) đã được kiểm tra trực quan (visual inspection).
- Toàn bộ 6 tệp `.docx` biên bản họp và 5 tệp `.pdf` (tổng cộng **124 trang PDF**: bộ SAP WM Case Study `I` 25 trang, `II` 33 trang, `III` 31 trang, `IV` 31 trang và [Tổng hợp quy trình.pdf](../06_tham_khao/quy_trinh/Tổng%20hợp%20quy%20trình.pdf) 4 trang) đã được trích xuất văn bản để đối chiếu quyết định họp, dữ liệu khảo sát và số trang trích dẫn. *(Lưu ý: chỉ 2 ảnh PNG được duyệt trực quan bằng mắt; văn bản Word/PDF và XML draw.io được kiểm tra bằng trích xuất/phân tích nội dung).*

### 2.2. Chuẩn đối chiếu (Chosen Comparison Baseline)

Chuẩn đối chiếu được chọn là **thiết kế mục tiêu mới nhất trong kho tài liệu — phiên bản `3.0.0` ngày 22/10/2026**, được định nghĩa thống nhất qua 5 tệp:
1. [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md)
2. [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md)
3. [de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md)
4. [de_xuat_database_design_EN.md](../03_thiet_ke/de_xuat_database_design_EN.md)
5. [WMSD_SQL_schema.sql](../03_thiet_ke/WMSD_SQL_schema.sql)

> [!NOTE]
> Chuẩn `3.0.0` ngày 22/10/2026 là **phương án thiết kế được chọn hiện hành trong bộ tài liệu dự án**, không mặc định đồng nhất với văn bản nghiệm thu đã có chữ ký phê duyệt chính thức của chủ cửa hàng Tân Thương.

Các đặc trưng cốt lõi của chuẩn đối chiếu `3.0.0`:
- **8 quy trình nghiệp vụ (`BF-01`..`BF-08`):**
  - `BF-01`: Bổ sung hàng, đặt mua và nhập kho (Purchasing / Replenishment & Goods Receipt).
  - `BF-02`: Phát hiện, cách ly và xử lý hàng lỗi/hỏng trong kho (Defects).
  - `BF-03`: Chuyển vị trí trong cùng kho (Local Relocation — dùng `TO-RELOCATE`, Warehouse Staff thực hiện, không cần Store Owner duyệt).
  - `BF-04`: Điều chuyển giữa các kho và xử lý chênh lệch (Inter-warehouse Transfer — chuỗi `TR` → Owner duyệt → `TD`/`HO` → `MWTR` kiểm nhận độc lập tại kho đích).
  - `BF-05`: Kiểm kê, đối chiếu và điều chỉnh tồn kho (Stocktake — chế độ khóa phạm vi `FROZEN` theo quyết định `D5`).
  - `BF-06`: Đơn bán, xuất kho, giao hàng và hoàn thành đơn (Sales Order & Fulfilment — chuỗi: Sales tạo bản sao `SO` từ đơn ngoài đã xác minh → lập `WIR` liên kết → lập `OD`/soạn hàng → `PGI` trừ tồn 1 lần → Warehouse xác nhận giao hàng kèm ảnh chụp bắt buộc `POD` chuyển `SO` sang `DELIVERED` → Sales xác nhận đã thu đủ tiền ngoài hệ thống `PAY-CFM` chuyển `SO` sang `COMPLETED`).
  - `BF-07`: Khách trả hàng (Customer Returns — Warehouse kiểm tra và đánh giá điều kiện `D6` trước khi Store Owner phê duyệt và post `GR-CR`).
  - `BF-08`: Trả hàng nhà cung cấp (Supplier Returns).
- **5 vai trò ứng dụng (Application Roles):** `Store Owner`, `Sales Staff`, `Warehouse Staff`, `Accountant`, `Administrator`.
- **Kiến trúc lưu trữ và giới hạn phạm vi:** Hệ thống thực thi (runtime) dùng **MongoDB**; mô hình SQL/T-SQL ([WMSD_SQL_schema.sql](../03_thiet_ke/WMSD_SQL_schema.sql) với 73 bảng, 2 view) chỉ là mô hình quan hệ tham chiếu để phân tích và kiểm tra ràng buộc. Không tích hợp trực tiếp (live integration) với MISA, không thực hiện thanh toán/thu ngân, không tính giá bán hay phát hành hóa đơn/hoàn tiền trong WMS.
- **Danh mục truy vết:** **111 mã Use Case** (`UC-01`..`UC-111`, gồm `98 ACTIVE` và `13 RETIRED`) và **33 quy tắc nghiệp vụ** (`BR-01`..`BR-33`).
- **Nguyên tắc đối xử với tài liệu lịch sử và nguồn tham khảo:** Các biên bản họp giai đoạn tháng 9 – đầu tháng 10/2026, bản đề xuất cũ ngày 17/10/2026 ([De_xuat_7_quy_trinh_sau_review1.md](../02_nghiep_vu/De_xuat_7_quy_trinh_sau_review1.md)), các mục nhật ký lịch sử trong [change_logs.md](../../change_logs.md) và tài liệu tham khảo bên ngoài không bị đánh giá là "sai" chỉ vì phạm vi dự án về sau được thu gọn hoặc điều chỉnh. Khuyến nghị chuẩn cho nhóm này là bảo toàn nguyên trạng lịch sử, gắn nhãn trạng thái (`Historical` / `Superseded`) và bổ sung liên kết trỏ tới tài liệu hiện hành.

---

## 3. Ma trận bao phủ tệp, phiên bản và trạng thái đồng bộ (File Coverage Matrix)

Bảng dưới đây thống kê đầy đủ **32 tạo phẩm tài liệu/tham khảo** trong kho lưu trữ cùng trạng thái so với chuẩn `3.0.0` (ngày 22/10/2026):

| STT | Tệp tài liệu (Liên kết tương đối từ `docs/07_ra_soat`) | Định dạng | Phiên bản / Mốc ngày ghi nhận | Vai trò trong kho tài liệu | Trạng thái đồng bộ so với chuẩn `3.0.0` (22/10/2026) | Mã phát hiện liên quan |
|---:|---|---|---|---|---|---|
| 1 | [README.md](../../README.md) | `.md` | Không ghi phiên bản/ngày trên tiêu đề (nội dung trỏ tới đề xuất 17/10/2026) | Mục lục điều hướng gốc của kho tài liệu | **Lệch điều hướng:** Thiếu liên kết bộ quy trình `2_VI/EN`, thiếu 5 biên bản họp và CSV khảo sát; còn trỏ tới 1 tệp draw.io bị khuyết | `SYNC-07`, `SYNC-08` |
| 2 | [change_logs.md](../../change_logs.md) | `.md` | `3.0.0` — 22/10/2026 (kèm lịch sử 20–21/10) | Nhật ký thay đổi và kiểm tra qua các đợt | **Đồng bộ (kèm lịch sử):** Phản ánh đúng đợt tách `BF-03`/`BF-04` ngày 22/10 và bảo toàn nhật ký cũ (có 1 liên kết lịch sử tới tệp draw.io đã xóa) | `SYNC-02`, `SYNC-08` |
| 3 | [WMSD_Report1_Fix.docx.txt](../01_bao_cao/WMSD_Report1_Fix.docx.txt) | `.txt` | Bản cập nhật 21/10/2026 (7 quy trình) | Bản trích xuất văn bản của Report 1 (Project Introduction) | **Chưa đồng bộ chuẩn `3.0.0`:** Còn dùng hệ mã 7 quy trình (`BF-03` gộp, `BF-05` xuất kho) và mô hình `WIR` trực tiếp từ đơn ngoài, kết thúc tại `PGI`/đóng phiếu kho | `SYNC-01`, `SYNC-02` |
| 4 | [WMSD_Report2.docx.txt](../01_bao_cao/WMSD_Report2.docx.txt) | `.txt` | Header: October 2026; nhật ký sửa đổi: 07/10/2026 | Bản trích xuất văn bản của Report 2 (Project Management Plan) | **Tài liệu kế hoạch:** Cần làm rõ cách tính buffer trong 350 person-days và tác động phạm vi mới (`UC-109..111`) | `OBS-01` |
| 5 | [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) | `.txt` | Baseline đầu ngày 21/10/2026 (108 UC, 30 BR) | Bản trích xuất văn bản của Report 3 (SRS) | **Chưa đồng bộ chuẩn `3.0.0`:** Đang ở 108 UC (`95 ACTIVE`/`13 RETIRED`), 30 BR, 7 quy trình (`BF-01..07`); `UC-45..48` vẫn là `WIR`; chưa có `SO`, `POD`, `PAY-CFM`, `UC-109..111`, `BR-31..33` | `SYNC-01`, `SYNC-02`, `SYNC-06` |
| 6 | [De_xuat_7_quy_trinh_sau_review1.md](../02_nghiep_vu/De_xuat_7_quy_trinh_sau_review1.md) | `.md` | 17/10/2026 (bổ sung 19/10/2026; không ghi số hiệu phiên bản) | Đề xuất 7 quy trình sau Review 1 (trước khảo sát CSV 20/10) | **Lịch sử (Historical Baseline):** Bảo toàn để đối chiếu tiến trình; có liên kết tới tệp draw.io bị khuyết và đường dẫn ngoài repo | `SYNC-07`, `SYNC-08` |
| 7 | [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) | `.md` | `3.0.0` — 22/10/2026 | Đề xuất quy trình nghiệp vụ hiện hành (Bản tiếng Việt — 8 BF, 111 UC, 33 BR) | **Chuẩn đối chiếu (Baseline `3.0.0`):** Khớp cấu trúc/mã với bản EN, nhưng còn vài câu thuyết minh lịch sử cũ, liên kết ngoài repo và ghi nguồn khảo sát ảnh chụp hơi rộng | `SYNC-06`, `SYNC-08`, `SYNC-09` |
| 8 | [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) | `.md` | `3.0.0` — 22/10/2026 | Đề xuất quy trình nghiệp vụ hiện hành (Bản tiếng Anh — 8 BF, 111 UC, 33 BR) | **Chuẩn đối chiếu (Baseline `3.0.0`):** Khớp cấu trúc/mã với bản VI; còn liên kết tệp draw.io khuyết/đường dẫn ngoài repo và câu ghi nguồn khảo sát ảnh chụp | `SYNC-06`, `SYNC-08`, `SYNC-09` |
| 9 | [WMSD_SQL_schema.sql](../03_thiet_ke/WMSD_SQL_schema.sql) | `.sql` | `3.0.0` — 22/10/2026 | DDL T-SQL tham chiếu kiểm tra mô hình dữ liệu (73 bảng, 2 view) | **Chuẩn đối chiếu (Baseline `3.0.0`):** Khớp mô hình 8 quy trình, chuỗi `SO`–`WIR`–`OD`–`GI-S`–`POD`–`PAY-CFM` và `customer_return_assessment` | `SYNC-04` |
| 10 | [WMSD_Thiet_ke_he_thong_chi_tiet.md](../03_thiet_ke/WMSD_Thiet_ke_he_thong_chi_tiet.md) | `.md` | `1.0` — 16/10/2026 | Thiết kế hệ thống chi tiết (kiến trúc, trạng thái, API, kiểm thử) | **Lỗi thời / Chưa có bản thay thế (`Superseded Gap`):** Dựa trên phạm vi 102 UC ngày 16/10, còn giữ quản lý giá bán/hóa đơn/hoàn tiền, API của UC đã retired và liên kết ảnh ERD bị khuyết | `SYNC-03`, `SYNC-08` |
| 11 | [WMSD_database_design.drawio](../03_thiet_ke/WMSD_database_design.drawio) | `.drawio` | Trước đợt bổ sung 9 bảng SO/POD/PAY (9 trang) | Sơ đồ ERD thiết kế cơ sở dữ liệu trên diagrams.net | **Chưa đồng bộ chuẩn `3.0.0`:** Trang tổng quan ghi 63 bảng/2 view/138 FK; thiếu 10 bảng của SQL `3.0.0`; bảng `issue_request` còn giữ cột `customer_id`/`external_line_id` | `SYNC-04` |
| 12 | [de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md) | `.md` | `3.0.0` — 22/10/2026 | Đề xuất thiết kế cơ sở dữ liệu hiện hành (Bản tiếng Việt — 21 quy tắc, 40 case) | **Chuẩn đối chiếu (Baseline `3.0.0`):** Khớp cấu trúc 16 bảng, mã `R-01..21`/`T01..40` và ERD với EN; đồng bộ SQL 73 bảng/2 view và dẫn chiếu đúng SAP `v4.1` nội bộ | — |
| 13 | [de_xuat_database_design_EN.md](../03_thiet_ke/de_xuat_database_design_EN.md) | `.md` | `3.0.0` — 22/10/2026 | Đề xuất thiết kế cơ sở dữ liệu hiện hành (Bản tiếng Anh — 21 quy tắc, 40 case) | **Chuẩn đối chiếu (Baseline `3.0.0`):** Khớp cấu trúc 16 bảng, mã `R-01..21`/`T01..40` và ERD với VI; các hợp đồng chính đã đối chiếu có mục tiêu | — |
| 14 | [Business_Process.drawio](../04_so_do/Business_Process.drawio) | `.drawio` | Giai đoạn phân tích ban đầu (3 trang: `'mẫu'`, `'As-in'`, `'To-be'`) | Sơ đồ quy trình tổng quan ban đầu | **Tài liệu lịch sử / Chưa đồng bộ:** Trang `To-be` còn gắn làn Accountant với thao tác tạo yêu cầu mua hàng (Create purchase request) | `SYNC-05` |
| 15 | [WMSD_Bangach.drawio](../04_so_do/WMSD_Bangach.drawio) | `.drawio` | Giai đoạn SRS ban đầu (21 trang) | Bộ sơ đồ Context, Use Case và các quy trình ban đầu | **Tài liệu lịch sử / Chưa đồng bộ:** Còn giữ nhãn `Inventory Staff`, `Product / Pricing`, `Replenishment Request Data` từ Accountant, `Transfer Order` liên kho và làn `System`/`WMSD` | `SYNC-03`, `SYNC-05` |
| 16 | [WMSD_Mainflow_BF03B_EN.png](../04_so_do/WMSD_Mainflow_BF03B_EN.png) | `.png` | 20/10/2026 (1 trang ảnh xuất) | Ảnh sơ đồ luồng điều chuyển liên kho bản tiếng Anh | **Chưa đồng bộ mã `3.0.0`:** Tiêu đề ảnh ghi mã cũ `BF-03B` và mốc ngày `20 Oct 2026` (nay là `BF-04`) | `SYNC-05` |
| 17 | [WMSD_Mainflow_BF03B_VI.png](../04_so_do/WMSD_Mainflow_BF03B_VI.png) | `.png` | 20/10/2026 (1 trang ảnh xuất) | Ảnh sơ đồ luồng điều chuyển liên kho bản tiếng Việt | **Chưa đồng bộ mã `3.0.0`:** Tiêu đề ảnh ghi mã cũ `BF-03B` và mốc ngày `20/10/2026` (nay là `BF-04`) | `SYNC-05` |
| 18 | [WMSD_Mainflows_EN.drawio](../04_so_do/WMSD_Mainflows_EN.drawio) | `.drawio` | 21/10/2026 (7 trang: `BF-01`..`BF-07`) | Bộ sơ đồ Mainflow bằng tiếng Anh (chỉ có làn Actor) | **Chưa đồng bộ chuẩn `3.0.0`:** Chỉ có 7 trang (`BF-01..07`); trang `BF-05` ánh xạ `UC-45..48` vào `WIR` và chưa có chuỗi `SO`/`POD`/`PAY-CFM` | `SYNC-05`, `SYNC-07` |
| 19 | [context-diagrem.mermaid](../04_so_do/context-diagrem.mermaid) | `.mermaid` | Không ghi phiên bản/ngày trong tệp; nội dung theo phạm vi cũ | Sơ đồ ngữ cảnh hệ thống định dạng Mermaid rời | **Chưa đồng bộ chuẩn `3.0.0`:** Còn dùng tên `Inventory Staff`, luồng `Accountant -> Replenishment Request Data`, `Product / Pricing` và cố định `Cloudinary` | `SYNC-05` |
| 20 | [Biên bản họp 12_9.docx](../05_khao_sat/Biên%20bản%20họp%2012_9.docx) | `.docx` | 12/09 (theo tên tệp; bối cảnh dự án 2026, trong tệp không ghi ngày đầy đủ) | Biên bản họp khởi động / khảo sát ban đầu | **Tư liệu lịch sử gốc (Preserved Evidence):** Ghi nhận bối cảnh ban đầu; giữ nguyên để truy vết | `SYNC-07` |
| 21 | [Biên bản họp 16_9.docx](../05_khao_sat/Biên%20bản%20họp%2016_9.docx) | `.docx` | 16/09/2026 | Biên bản họp tiến độ và chuẩn bị khảo sát đợt tháng 9 | **Tư liệu lịch sử gốc (Preserved Evidence):** Ghi nhận tiến độ dự án, tên chính thức đề tài, bối cảnh cần bổ sung cho Report 1, nghiên cứu phần mềm hiện có và kế hoạch khảo sát thực địa 19/09; chưa được liệt kê trong `README.md` | `SYNC-07` |
| 22 | [Biên bản họp 26_9.docx](../05_khao_sat/Biên%20bản%20họp%2026_9.docx) | `.docx` | 26/09/2026 | Biên bản họp rà soát quy trình và yêu cầu | **Tư liệu lịch sử gốc (Preserved Evidence):** Lưu vết quá trình tiến hóa phạm vi; chưa được liệt kê trong `README.md` | `SYNC-07` |
| 23 | [Biên bản họp 30_9.docx](../05_khao_sat/Biên%20bản%20họp%2030_9.docx) | `.docx` | 30/09/2026 | Biên bản họp chốt yêu cầu cuối tháng 9 | **Tư liệu lịch sử gốc (Preserved Evidence):** Lưu vết quá trình tiến hóa phạm vi; chưa được liệt kê trong `README.md` | `SYNC-07` |
| 24 | [Biên bản họp 3_10.docx](../05_khao_sat/Biên%20bản%20họp%203_10.docx) | `.docx` | 03/10/2026 | Biên bản họp đầu tháng 10 | **Tư liệu lịch sử gốc (Preserved Evidence):** Lưu vết quá trình tiến hóa phạm vi; chưa được liệt kê trong `README.md` | `SYNC-07` |
| 25 | [Biên bản họp 09_10.docx](../05_khao_sat/Biên%20bản%20họp%2009_10.docx) | `.docx` | 09/10/2026 | Biên bản họp rà soát trước đợt Review 1 | **Tư liệu lịch sử gốc (Preserved Evidence):** Lưu vết quá trình tiến hóa phạm vi; chưa được liệt kê trong `README.md` | `SYNC-07` |
| 26 | [khao_sat_kho_gach.csv](../05_khao_sat/khao_sat_kho_gach.csv) | `.csv` | 20/10/2026 09:04:25 GMT+7 | Dữ liệu phản hồi biểu mẫu khảo sát thực tế (1 phản hồi, 26 câu hỏi, 47 cột) | **Tư liệu khảo sát gốc (Preserved Evidence):** Nguồn căn cứ thực địa; chưa được liệt kê trong `README.md`; cần trích dẫn chính xác phạm vi các câu `Q16`, `Q22`, `Q24` | `SYNC-07`, `SYNC-09` |
| 27 | [link_tham_khao.md](../06_tham_khao/link_tham_khao.md) | `.md` | Tham khảo chung | Danh sách 4 URL tài liệu MISA SME, MISA eShop, Odoo 18, Dynamics 365 | **Tài liệu tham khảo ngoài:** Giữ nguyên làm nguồn đối chiếu khái niệm | — |
| 28 | [Tổng hợp quy trình.pdf](../06_tham_khao/quy_trinh/Tổng%20hợp%20quy%20trình.pdf) | `.pdf` | Giai đoạn phân tích đầu dự án (4 trang) | Tài liệu tóm tắt quy trình tổng quát ban đầu | **Tư liệu lịch sử / Tham khảo:** Bao gồm cả phạm vi giá/hóa đơn/công nợ trước khi thu hẹp về thuần kho | — |
| 29 | [Intro_S4HANA_Using_Global_Bike_Case_Study_WM_I_en_v4.1.pdf](../06_tham_khao/sap/Intro_S4HANA_Using_Global_Bike_Case_Study_WM_I_en_v4.1.pdf) | `.pdf` | `v4.1` — 06/2022 (`Last Update June 2022`; 25 trang) | Tài liệu tham khảo chuẩn SAP S/4HANA WM Case Study I | **Nguồn tham khảo hợp lệ (`v4.1`):** Khớp trích dẫn trong [de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md); khác hậu tố phiên bản với liên kết `v4.2` trong đề xuất quy trình | `SYNC-08` |
| 30 | [Intro_S4HANA_Using_Global_Bike_Case_Study_WM_II_en_v4.1.pdf](../06_tham_khao/sap/Intro_S4HANA_Using_Global_Bike_Case_Study_WM_II_en_v4.1.pdf) | `.pdf` | `v4.1` — 06/2022 (`Last Update June 2022`; 33 trang) | Tài liệu tham khảo chuẩn SAP S/4HANA WM Case Study II | **Nguồn tham khảo hợp lệ (`v4.1`):** Khớp trích dẫn trong [de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md); khác hậu tố phiên bản với liên kết `v4.2` trong đề xuất quy trình | `SYNC-08` |
| 31 | [Intro_S4HANA_Using_Global_Bike_Case_Study_WM_III_en_v4.1.pdf](../06_tham_khao/sap/Intro_S4HANA_Using_Global_Bike_Case_Study_WM_III_en_v4.1.pdf) | `.pdf` | `v4.1` — 06/2022 (`Last Update June 2022`; 31 trang) | Tài liệu tham khảo chuẩn SAP S/4HANA WM Case Study III | **Nguồn tham khảo hợp lệ (`v4.1`):** Khớp trích dẫn trong [de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md); khác hậu tố phiên bản với liên kết `v4.2` trong đề xuất quy trình | `SYNC-08` |
| 32 | [Intro_S4HANA_Using_Global_Bike_Case_Study_WM_IV_en_v4.1.pdf](../06_tham_khao/sap/Intro_S4HANA_Using_Global_Bike_Case_Study_WM_IV_en_v4.1.pdf) | `.pdf` | `v4.1` — 06/2022 (`Last Update June 2022`; 31 trang) | Tài liệu tham khảo chuẩn SAP S/4HANA WM Case Study IV | **Nguồn tham khảo hợp lệ (`v4.1`):** Khớp trích dẫn trong [de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md); khác hậu tố phiên bản với liên kết `v4.2` trong đề xuất quy trình | `SYNC-08` |

**Tệp loại trừ khỏi ma trận tài liệu nghiệp vụ/thiết kế (1 tệp):**
- [debug.log](../03_thiet_ke/debug.log) (`.log`): Tệp nhật ký gỡ lỗi kỹ thuật nằm tại thư mục `docs/03_thiet_ke/`, không chứa nội dung đặc tả hay thiết kế của dự án.

---

## 4. Chi tiết các phát hiện bất đồng bộ (Findings Ordered by Impact)

### `SYNC-01` [P1] — Report 1 và Report 3 (SRS) chưa cập nhật mô hình đơn bán sao chép (`SO`) và chuỗi nghiệm thu hoàn thành đơn (`POD` → `DELIVERED` → `PAY-CFM` → `COMPLETED`)

- **Mức độ ưu tiên:** **P1** (Cần giải quyết trước khi dùng bộ báo cáo cho giai đoạn lập trình hoặc nghiệm thu).
- **Bằng chứng xác minh (Verified Evidence):**
  - Trong chuẩn hiện hành [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) (tại các dòng 291–316, dòng 439, dòng 475–481 và dòng 606–608) cùng bản tiếng Anh tương ứng [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md), luồng bán hàng và xuất kho (`BF-06`) yêu cầu:
    1. `Sales Staff` tạo bản sao đơn bán nội bộ (`Sales Order` — `SO`, qua `UC-45..48`) từ đơn bán bên ngoài đã xác minh (MISA/giấy tờ).
    2. `Sales Staff` lập yêu cầu xuất kho liên kết với `SO` (`Warehouse Issue Request` — `WIR`, qua `UC-109`).
    3. Sau khi soạn hàng (`OD`/`TO`) và post xuất kho giảm tồn (`PGI`), `Warehouse Staff` xác nhận giao hàng thực tế cho khách kèm ảnh chụp bắt buộc (`POD`, qua `UC-110`) để chuyển `SO` sang trạng thái `DELIVERED`.
    4. `Sales Staff` xác nhận đã thu đủ tiền ngoài hệ thống (`PAY-CFM`, qua `UC-111`) để chuyển `SO` sang trạng thái `COMPLETED`.
    5. Bổ sung 3 quy tắc nghiệp vụ mới `BR-31`, `BR-32`, `BR-33`, nâng tổng số lên 111 mã UC (`98 ACTIVE`, `13 RETIRED`) và 33 quy tắc `BR`.
  - Ngược lại, trong bản đặc tả SRS [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt):
    - Dòng 376 vẫn công bố tổng số là **108 mã UC (`95 ACTIVE`, `13 RETIRED`)**.
    - Bảng danh mục UC (`UC-45` đến `UC-48`) và phần đặc tả chi tiết tại các dòng 1344, 1358, 1372, 1387 vẫn định nghĩa `UC-45..48` là thao tác trực tiếp trên `Warehouse Issue Request` (`WIR`), không phải `Sales Order` (`SO`).
    - Quan hệ dữ liệu khái niệm tại dòng 293 vẫn nối trực tiếp `external_line -> issue_request_line` (bỏ qua tầng `sales_order` / `sales_order_line`).
    - Danh mục màn hình tại dòng 629 vẫn định nghĩa `SC-16` là màn hình của `WIR` thay vì tách bạch màn hình quản lý `SO` và `WIR` liên kết.
    - Danh mục quy tắc nghiệp vụ tại các dòng 2553–2582 (tiêu đề mục tại dòng 2551) chỉ có **30 quy tắc (`BR-01`..`BR-30`)**, chưa có `BR-31`..`BR-33`.
    - Các Use Case `UC-109`, `UC-110`, `UC-111` hoàn toàn chưa xuất hiện trong bảng danh mục, ma trận phân quyền, đặc tả chi tiết hay hợp đồng màn hình/trường dữ liệu của [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt).
  - Tương tự, trong [WMSD_Report1_Fix.docx.txt](../01_bao_cao/WMSD_Report1_Fix.docx.txt) tại các dòng 145, 298, 319–321, 344 và 358, mô tả luồng xuất hàng vẫn đi trực tiếp từ chứng từ bên ngoài sang `WIR` và kết thúc trách nhiệm theo dõi ngay tại bước xuất kho `PGI` / đóng yêu cầu kho.
- **Hệ quả:**
  - Nếu đội phát triển hoặc kiểm thử đọc [WMSD_Report1_Fix.docx.txt](../01_bao_cao/WMSD_Report1_Fix.docx.txt) và [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) làm căn cứ SRS chính thức, hệ thống sẽ bị xây dựng thiếu thực thể `SO`, thiếu bước bắt buộc chụp ảnh `POD` (`UC-110`), thiếu bước xác nhận thu đủ tiền ngoài hệ thống `PAY-CFM` (`UC-111`), và xung đột trực tiếp với cấu trúc bảng của [WMSD_SQL_schema.sql](../03_thiet_ke/WMSD_SQL_schema.sql) cũng như [de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md).
- **Khuyến nghị khắc phục:**
  - Cập nhật đồng bộ chuỗi `SO` → `WIR` → `OD`/soạn hàng → `PGI` → `POD`/`DELIVERED` → `PAY-CFM`/`COMPLETED` vào [WMSD_Report1_Fix.docx.txt](../01_bao_cao/WMSD_Report1_Fix.docx.txt) (đặc biệt ở mô tả quy trình xuất hàng, tính năng `FE-06` và phần giới hạn phạm vi `LI`) và toàn bộ các phần liên quan trong [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) (bối cảnh, mô hình thực thể khái niệm, danh mục 111 UC, ma trận phân quyền, đặc tả chi tiết `UC-45..48` và `UC-109..111`, danh mục màn hình/trường dữ liệu, quy tắc `BR-31..33`, thông điệp lỗi, NFR và báo cáo).
  - **Lưu ý ranh giới bắt buộc khi cập nhật:** Phải ghi rõ `SO` chỉ là bản ghi theo dõi nội bộ được sao chép từ đơn ngoài đã xác minh và `PAY-CFM` chỉ là xác nhận trạng thái đã thu đủ tiền ngoài hệ thống; tuyệt đối không diễn đạt gây hiểu nhầm rằng hệ thống WMS bổ sung chức năng tính giá bán, thanh toán trực tuyến hay lập hóa đơn thương mại.

---

### `SYNC-02` [P1] — Lệch hệ mã định danh quy trình nghiệp vụ (`BF-03`..`BF-08` so với `BF-03`..`BF-07` cũ) giữa bộ đề xuất `3.0.0` và các báo cáo Report 1 / Report 3

- **Mức độ ưu tiên:** **P1** (Cần giải quyết trước khi dùng tài liệu để truy vết yêu cầu và kiểm thử nghiệm thu).
- **Bằng chứng xác minh (Verified Evidence):**
  - Trong chuẩn hiện hành [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) (các tiêu đề mục tại dòng 215, 235, 262, 291, 335, 371) và [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md), hệ thống được chia thành **8 quy trình**:
    - `BF-03`: Chuyển vị trí trong cùng kho (Local Relocation)
    - `BF-04`: Điều chuyển giữa các kho và xử lý chênh lệch (Inter-warehouse Transfer)
    - `BF-05`: Kiểm kê, đối chiếu và điều chỉnh tồn kho (Stocktake)
    - `BF-06`: Đơn bán, xuất kho, giao hàng và hoàn thành đơn (Sales Order & Outbound Fulfilment)
    - `BF-07`: Khách trả hàng (Customer Returns)
    - `BF-08`: Trả nhà cung cấp (Supplier Returns)
  - Trong khi đó, [WMSD_Report1_Fix.docx.txt](../01_bao_cao/WMSD_Report1_Fix.docx.txt) (tại các dòng 311, 315, 319, 323, 327) và [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) (tại các dòng 110, 147, 175, 205, 239) vẫn sử dụng **hệ mã 7 quy trình cũ**:
    - `BF-03`: Gộp chung chuyển vị trí nội kho và điều chuyển liên kho
    - `BF-04`: Kiểm kê kho (Stocktake)
    - `BF-05`: Xuất kho bán hàng (Outbound Issue)
    - `BF-06`: Khách trả hàng (Customer Returns)
    - `BF-07`: Trả hàng nhà cung cấp (Supplier Returns)
  - Các tham chiếu nhánh ngoại lệ bên trong phần đặc tả chi tiết Use Case của [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) cũng còn mang mã cũ; ví dụ tại `UC-104` (dòng 1339) vẫn tham chiếu `BF03-E1/E2/E3` cho nghiệp vụ nhận điều chuyển liên kho (nay thuộc `BF-04`).
  - Sự lệch pha này là độ trôi phiên bản đã được ghi nhận rõ tại [change_logs.md](../../change_logs.md) dòng 8–33 khi thực hiện tách `BF-03` thành `BF-03` và `BF-04` trong phiên bản `3.0.0`, không phải một bảng ánh xạ mới phát sinh ngoài kiểm soát.
- **Hệ quả:**
  - Cùng một mã quy trình (như `BF-04`, `BF-05`, `BF-06`, `BF-07`) đang mang ý nghĩa nghiệp vụ hoàn toàn khác nhau giữa bộ đề xuất quy trình/database `3.0.0` và bộ Report 1 / Report 3, gây nhầm lẫn nghiêm trọng khi lập ma trận truy vết (traceability matrix), viết kịch bản kiểm thử hoặc nghiệm thu theo quy trình.
- **Khuyến nghị khắc phục:**
  - Áp dụng thống nhất việc tách `BF-03` thành `BF-03` (chuyển vị trí nội kho) và `BF-04` (điều chuyển liên kho), đồng thời dịch chuyển toàn bộ các mã quy trình cũ `BF-04..07` sang `BF-05..08` trong [WMSD_Report1_Fix.docx.txt](../01_bao_cao/WMSD_Report1_Fix.docx.txt) và [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt).
  - Rà soát và cập nhật toàn bộ các mã nhánh ngoại lệ (`BFxx-Ax`, `BFxx-Ex`) bên trong thân đặc tả chi tiết của từng Use Case trong [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt); đồng thời định tuyến trường hợp xuất thẳng từ kho khác cho khách sang `BF-06` theo đúng thiết kế `3.0.0`.
  - Giữ nguyên các mục nhật ký lịch sử trong [change_logs.md](../../change_logs.md) theo đúng mốc thời gian của từng lượt sửa.

---

### `SYNC-03` [P1] — Khoảng trống tài liệu thiết kế hệ thống chi tiết hiện hành thay thế cho bản `1.0` ngày 16/10/2026

- **Mức độ ưu tiên:** **P1** (Cần giải quyết trước khi đội phát triển dùng tài liệu thiết kế chi tiết để viết API, state machine và kiểm thử).
- **Bằng chứng xác minh (Verified Evidence):**
  - Tệp [WMSD_Thiet_ke_he_thong_chi_tiet.md](../03_thiet_ke/WMSD_Thiet_ke_he_thong_chi_tiet.md) hiện là tài liệu thiết kế hệ thống chi tiết duy nhất trong kho, nhưng đang ở **phiên bản `1.0` ngày 16/10/2026** (dòng 3).
  - Nội dung bên trong tệp này phản ánh phạm vi thiết kế cũ trước baseline 20–22/10/2026 và xung đột trực tiếp với chuẩn `3.0.0` ở nhiều điểm cốt lõi:
    - Các dòng 32–43 vẫn bao gồm luồng quản lý giá bán, phát hành hóa đơn nội bộ và quy trình hoàn tiền (refund workflows).
    - Dòng 66 vẫn giao quyền tạo yêu cầu bổ sung hàng (Replenishment Request) cho `Accountant`, trong khi chuẩn hiện hành giao cho `Sales Staff` / `Warehouse Staff` đề xuất, `Store Owner` duyệt và `Accountant` lập `PO`.
    - Dòng 50 và dòng 485 vẫn quy định `Store Owner` phê duyệt yêu cầu khách trả hàng **trước** khi kho kiểm tra hàng, ngược với quy trình `BF-07` hiện hành (`Warehouse Staff` nhận custody, kiểm tra thực tế và đánh giá điều kiện `D6` trước khi `Store Owner` duyệt).
    - Dòng 321 vẫn cho phép phát sinh giao dịch nhập/xuất đồng thời sau mốc chốt kiểm kê (post-cutoff movement), ngược với quyết định `D5` khóa cứng phạm vi kiểm kê (`FROZEN`).
    - Dòng 325 và dòng 489 không có nhánh từ chối / trả về yêu cầu đếm lại hoặc làm lại (reject/rework path).
    - Các dòng 553–568 vẫn định nghĩa các route API cho các Use Case đã ngừng sử dụng (`RETIRED`), bao gồm `UC-42`, `UC-61`, `UC-62`, `UC-76`, `UC-77`, `UC-78`.
    - Dòng 57 và dòng 360 cố định dịch vụ lưu trữ ảnh là `Cloudinary`, trong khi SRS hiện hành giữ kiến trúc mở về nhà cung cấp lưu trữ chứng cứ riêng tư.
    - Phần phụ lục chỉ bao phủ **102 Use Case** (chưa có sự phân tách `98 ACTIVE` / `13 RETIRED` của bộ 111 UC hiện hành, chưa có đánh giá trả hàng `D6` và chuỗi `SO`/`POD`/`PAY-CFM`).
    - Các dòng 15–18 mô tả tệp nguồn draw.io lịch sử gồm 37 trang, không khớp với tệp [WMSD_Bangach.drawio](../04_so_do/WMSD_Bangach.drawio) 21 trang hiện có trong kho.
  - Mục lục gốc [README.md](../../README.md) tại dòng 36 đã ghi nhận đây là tài liệu thiết kế cũ ngày 16/10/2026; do đó, đây là **khoảng trống chưa có bản thiết kế chi tiết mới thay thế (unresolved replacement design gap)** chứ không phải lỗi sửa nhầm vào tài liệu đã chốt.
- **Hệ quả:**
  - Nếu lập trình viên tham chiếu trực tiếp [WMSD_Thiet_ke_he_thong_chi_tiet.md](../03_thiet_ke/WMSD_Thiet_ke_he_thong_chi_tiet.md) để xây dựng backend/frontend, hệ thống sẽ cài đặt sai phân quyền, sai thứ tự trạng thái kiểm kê và khách trả hàng, thiếu ánh xạ danh mục UC hiện hành đầy đủ cũng như hợp đồng API/máy trạng thái mới của chuỗi `SO` → `WIR` → `POD` → `PAY-CFM`, đồng thời giữ lại các endpoint đã ngừng sử dụng (`RETIRED`).
- **Khuyến nghị khắc phục:**
  - Soạn thảo phiên bản thiết kế hệ thống chi tiết mới đồng bộ với baseline `3.0.0` (cập nhật mô hình dữ liệu, danh sách API endpoints, máy trạng thái chứng từ, ma trận phân quyền, xử lý khóa kiểm kê `FROZEN`, đánh giá trả hàng `D6`, chuỗi `SO`–`WIR`–`POD`–`PAY-CFM` và các kịch bản kiểm thử), đồng thời gắn nhãn `Superseded / Historical (v1.0 - 16/10/2026)` ngay đầu tệp cũ nếu giữ lại để đối chiếu lịch sử.

---

### `SYNC-04` [P1] — Sơ đồ thiết kế cơ sở dữ liệu `WMSD_database_design.drawio` thiếu 10 bảng của SQL `3.0.0` và còn giữ khóa ngoại cũ trên bảng yêu cầu xuất kho

- **Mức độ ưu tiên:** **P1** (Cần giải quyết trước khi dùng sơ đồ ERD trực quan để rà soát thiết kế hoặc báo cáo nghiệm thu).
- **Bằng chứng xác minh (Verified Evidence):**
  - Trong tệp [WMSD_database_design.drawio](../03_thiet_ke/WMSD_database_design.drawio), tại trang `'0. Tổng quan (Overview)'`, ô (cell) `ov_banner` ghi rõ thống kê mô hình gồm: **63 bảng (tables), 2 views và 138 khóa ngoại (FK)**.
  - Trong khi đó, tệp DDL chuẩn hiện hành [WMSD_SQL_schema.sql](../03_thiet_ke/WMSD_SQL_schema.sql) có đúng **73 lệnh `CREATE TABLE` và 2 lệnh `CREATE VIEW`**.
  - Đối chiếu chi tiết tên bảng cho thấy toàn bộ 63 bảng vẽ trong tệp `.drawio` đều tồn tại trong SQL, nhưng **10 bảng trong [WMSD_SQL_schema.sql](../03_thiet_ke/WMSD_SQL_schema.sql) hoàn toàn vắng mặt trên mọi trang và nhãn của tệp `.drawio`**, bao gồm:
    1. `business_operation`
    2. `customer_delivery`
    3. `customer_delivery_line`
    4. `customer_return_assessment`
    5. `external_payment_confirmation`
    6. `outbound_delivery_line`
    7. `sales_goods_issue_line`
    8. `sales_order`
    9. `sales_order_cancellation`
    10. `sales_order_line`
  - Ngoài ra, trên trang `'5. Xuất kho & Tác vụ Kho'` của [WMSD_database_design.drawio](../03_thiet_ke/WMSD_database_design.drawio), hai ô thực thể `issue_request` và `issue_request_line` vẫn giữ các cột cũ là `customer_id` và `external_line_id`, trong khi [WMSD_SQL_schema.sql](../03_thiet_ke/WMSD_SQL_schema.sql) tại các dòng 333–352 đã chuyển sang liên kết bắt buộc qua `sales_order_id` và `sales_order_line_id`.
  - Hai tài liệu mô tả thiết kế database bằng Markdown ([de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md) và [de_xuat_database_design_EN.md](../03_thiet_ke/de_xuat_database_design_EN.md) tại các dòng 150–185 và 222–258) đã cập nhật đầy đủ các bảng đánh giá trả hàng `customer_return_assessment` cũng như nhóm bảng `SO` / `POD` / `PAY-CFM`.
- **Hệ quả:**
  - Sơ đồ ERD trên diagrams.net không phản ánh đúng cấu trúc 73 bảng của DDL tham chiếu và mô hình tài liệu Markdown `3.0.0`, dẫn đến sai lệch nếu trích xuất hình ảnh từ tệp `.drawio` này đưa vào báo cáo hoặc tài liệu kỹ thuật.
- **Khuyến nghị khắc phục:**
  - Cập nhật tệp [WMSD_database_design.drawio](../03_thiet_ke/WMSD_database_design.drawio) trực tiếp từ [WMSD_SQL_schema.sql](../03_thiet_ke/WMSD_SQL_schema.sql): bổ sung đầy đủ 10 bảng còn thiếu, sửa danh sách cột và đường nối khóa ngoại của `issue_request` / `issue_request_line` sang `sales_order` / `sales_order_line`, và cập nhật lại số liệu thống kê tại cell `ov_banner` trên trang `'0. Tổng quan (Overview)'` (từ 63 bảng lên 73 bảng). *(Lưu ý: con số hiện có trên bản vẽ là đúng 63 bảng đã xác minh; không chỉ đổi tên nhãn hoặc ghi nhầm thành 64 bảng).*

---

### `SYNC-05` [P2] — Các tệp sơ đồ độc lập trong `docs/04_so_do/` vẫn thể hiện luồng nghiệp vụ, mã `BF` và vai trò của các phiên bản trước

- **Mức độ ưu tiên:** **P2** (Vấn đề đồng bộ phạm vi hình minh họa độc lập và truy vết trực quan).
- **Bằng chứng xác minh (Verified Evidence):**
  - [WMSD_Mainflows_EN.drawio](../04_so_do/WMSD_Mainflows_EN.drawio): Chỉ gồm **7 trang (`BF-01`..`BF-07`)** với phụ đề ngày `21 Oct 2026`. Tại trang `BF-05` (các cell `bf05-s1`, `bf05-s7`, `bf05-note`), sơ đồ vẫn ánh xạ `UC-45..48` vào `Warehouse Issue Request` (`WIR`) và hoàn toàn chưa có chuỗi `SO` sao chép → `WIR` liên kết → chụp ảnh `POD` (`DELIVERED`) → xác nhận `PAY-CFM` (`COMPLETED`).
  - [WMSD_Mainflow_BF03B_VI.png](../04_so_do/WMSD_Mainflow_BF03B_VI.png) và [WMSD_Mainflow_BF03B_EN.png](../04_so_do/WMSD_Mainflow_BF03B_EN.png): Qua kiểm tra trực quan, cả hai ảnh đều hiển thị nhãn tiêu đề mã cũ `BF-03B` và ngày `20/10/2026` / `20 Oct 2026` (trong chuẩn `3.0.0`, quy trình điều chuyển liên kho đã tách thành `BF-04`).
  - [context-diagrem.mermaid](../04_so_do/context-diagrem.mermaid): Tại dòng 15 vẫn dùng tên vai trò cũ `Inventory Staff` (nay là `Warehouse Staff`); dòng 51 vẫn vẽ luồng `Accountant` gửi `Replenishment Request Data`; dòng 54 vẫn giữ luồng `Product / Pricing`; dòng 26 vẫn gắn cứng `Cloudinary` (so với [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) dòng 30 xác định giá thương mại nằm ngoài phạm vi WMS, cùng dòng 31 và 647 giữ kiến trúc mở về nhà cung cấp lưu trữ ảnh). *(Ghi chú xác minh: tại các dòng 62–63 của tệp Mermaid này, chiều mũi tên upload/asset đã đúng chuẩn, không bị ngược chiều).*
  - [WMSD_Bangach.drawio](../04_so_do/WMSD_Bangach.drawio) (21 trang): Trang Context cũng giữ các nhãn cũ tương tự (`Inventory Staff`, định giá bán `Pricing`, kế toán tạo yêu cầu bổ sung hàng); trang `'Chuyển kho nội bộ'` vẫn có bước tạo/xác nhận `Transfer Order` cho điều chuyển liên kho (của `UC-42` đã retired); và các trang quy trình `BF` cũ vẫn giữ làn hệ thống (`System` / `WMSD` lane) thay vì quy ước chỉ vẽ làn tác nhân (actor-only lanes).
  - [Business_Process.drawio](../04_so_do/Business_Process.drawio) (3 trang): Trên trang `To-be`, tại cell `oGNuB8JjH54ikDpzXjjq-23`, thao tác `Create purchase request` vẫn nằm ở làn `Accountant`.
- **Hệ quả:**
  - Các sơ đồ rời tại `docs/04_so_do/` không thể nhúng trực tiếp vào báo cáo hiện hành nếu không chỉnh sửa, vì sẽ gây mâu thuẫn giữa hình vẽ và văn bản đặc tả `3.0.0`.
- **Khuyến nghị khắc phục:**
  - Tái xuất và cập nhật bộ sơ đồ quy trình theo cấu trúc 8 quy trình (`BF-01`..`BF-08`, chỉ gồm làn Actor) khớp với 9 khối Mermaid trong [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) / [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md).
  - Cập nhật [context-diagrem.mermaid](../04_so_do/context-diagrem.mermaid) theo đúng ngữ cảnh hiện hành; với các tệp sơ đồ lịch sử ([Business_Process.drawio](../04_so_do/Business_Process.drawio), [WMSD_Bangach.drawio](../04_so_do/WMSD_Bangach.drawio)), phân tách rõ là tạo phẩm lịch sử giai đoạn đầu dự án để tránh dùng nhầm.

---

### `SYNC-06` [P2] — Bản đề xuất quy trình tiếng Việt (`de_xuat_quy_trinh_2_VI.md`) còn sót một số câu nhận định lịch sử chưa khớp với bản tiếng Anh và trạng thái của Report 3

- **Mức độ ưu tiên:** **P2** (Vấn đề nhất quán diễn đạt đối chiếu nội bộ giữa hai bản ngôn ngữ).
- **Bằng chứng xác minh (Verified Evidence):**
  - Hai tệp [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) và [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) khớp nhau về cấu trúc mục, bảng biểu và dãy mã định danh, nhưng bản tiếng Việt còn sót 3 câu thuyết minh mang tính thời điểm cũ:
    1. Tại dòng 415 của [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), văn bản viết rằng các mã từ `UC-103` trở đi *"chưa có trong Report 3"*. Nhận định này mâu thuẫn với chính dòng 481 của cùng tệp tiếng Việt và mâu thuẫn với thực tế trong [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) (các dòng 481–486 và phần đặc tả chi tiết đã có đầy đủ `UC-103` đến `UC-108`, chỉ còn thiếu `UC-109` đến `UC-111`). Trong khi đó, bản tiếng Anh [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) tại dòng 414 chỉ diễn đạt nguyên tắc giữ cố định dãy mã ID mà không có câu khẳng định sai này.
    2. Tại dòng 269 của [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), văn bản viết *"Report 3 đang cho phép giao dịch sau cutoff rồi reconcile"*, trong khi [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) tại dòng 48 và các dòng 147–174 đã chuyển sang chế độ khóa cứng `FROZEN`. Bản tiếng Anh [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) tại dòng 268 đã dùng cụm từ chính xác hơn là *"earlier Report 3"* (bản Report 3 trước đây).
    3. Tại dòng 275 của [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), đoạn mô tả phương án kiểm kê mở kết thúc bằng cụm *"cần chọn một khi chốt SRS"*, dù quyết định `D5` (`FROZEN`) đã được chọn; trong khi bản tiếng Anh tại dòng 274 đã ghi rõ đây là phương án nâng cao không được chọn (unselected advanced alternative).
  - *(Lưu ý loại trừ để tránh báo lỗi giả: Bảng nguồn lịch sử tại dòng 68 và toàn bộ Mục 2 của [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) đang mô tả lại bản chụp trực tuyến 102 UC ngày 17/10/2026 một cách có chủ đích lịch sử; không tính các dòng mô tả lịch sử đó là lỗi bất đồng bộ).*
- **Hệ quả:**
  - Người đọc bản tiếng Việt có thể hiểu nhầm rằng tệp [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) trong kho hiện vẫn chưa có `UC-103..108` hoặc chưa chốt phương án kiểm kê `D5`.
- **Khuyến nghị khắc phục:**
  - Chỉnh lại 3 câu thuyết minh tại các dòng 269, 275 và 415 của [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) cho khớp với bản tiếng Anh: phân biệt rõ trạng thái của bản Report 3 cũ với bản [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) hiện có trong kho (vốn đã có `UC-103..108` và `FROZEN`, chỉ còn thiếu `UC-109..111` cùng chuỗi `SO`/`POD`/`PAY-CFM` và hệ mã 8 quy trình).

---

### `SYNC-07` [P2] — Mục lục gốc `README.md` chưa phản ánh các tài liệu phiên bản `3.0.0` và liệt kê thiếu tư liệu khảo sát/biên bản họp

- **Mức độ ưu tiên:** **P2** (Vấn đề điều hướng và khả năng tra cứu tại điểm vào của kho tài liệu).
- **Bằng chứng xác minh (Verified Evidence):**
  - Trong [README.md](../../README.md):
    - Các dòng 21–23 ở mục `2. Phân tích nghiệp vụ và đề xuất sau review` chỉ liệt kê tệp cũ ngày 17/10/2026 ([De_xuat_7_quy_trinh_sau_review1.md](../02_nghiep_vu/De_xuat_7_quy_trinh_sau_review1.md)), hoàn toàn bỏ sót hai tệp quy trình cốt lõi hiện hành là [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) và [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) cùng [change_logs.md](../../change_logs.md).
    - Dòng 36 chỉ so sánh tài liệu thiết kế chi tiết ngày 16/10/2026 với đề xuất ngày 17/10/2026, chưa phản ánh mốc chuẩn `3.0.0` ngày 22/10/2026.
    - Dòng 44 vẫn giới thiệu tệp `docs/04_so_do/WMSD_Mainflows_VI_EN.drawio` (16 trang, tách chuyển vị trí và điều chuyển liên kho) vốn không tồn tại trên đĩa, trong khi tệp thực tế đang có trong thư mục là [WMSD_Mainflows_EN.drawio](../04_so_do/WMSD_Mainflows_EN.drawio) (7 trang tiếng Anh) và 2 ảnh PNG `BF03B`. *(Lưu ý: không suy diễn tệp 7 trang tiếng Anh là bản thay thế tương đương cho tệp 16 trang song ngữ).*
    - Dòng 53 ở mục `5. Khảo sát và biên bản họp` chỉ liệt kê duy nhất 1 biên bản ([Biên bản họp 12_9.docx](../05_khao_sat/Biên%20bản%20họp%2012_9.docx)), bỏ sót 5 biên bản họp còn lại ([Biên bản họp 16_9.docx](../05_khao_sat/Biên%20bản%20họp%2016_9.docx), [Biên bản họp 26_9.docx](../05_khao_sat/Biên%20bản%20họp%2026_9.docx), [Biên bản họp 30_9.docx](../05_khao_sat/Biên%20bản%20họp%2030_9.docx), [Biên bản họp 3_10.docx](../05_khao_sat/Biên%20bản%20họp%203_10.docx), [Biên bản họp 09_10.docx](../05_khao_sat/Biên%20bản%20họp%2009_10.docx)) và bỏ sót tệp dữ liệu khảo sát thực tế [khao_sat_kho_gach.csv](../05_khao_sat/khao_sat_kho_gach.csv).
- **Hệ quả:**
  - Thành viên dự án hoặc giảng viên phản biện mở [README.md](../../README.md) sẽ bị dẫn hướng vào đề xuất cũ ngày 17/10/2026 thay vì bộ tài liệu `3.0.0` ngày 22/10/2026, đồng thời không thấy danh mục đầy đủ của 6 biên bản họp và bảng khảo sát CSV.
- **Khuyến nghị khắc phục:**
  - Cập nhật [README.md](../../README.md) để đưa bộ tài liệu `3.0.0` ([de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md), [de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md), [de_xuat_database_design_EN.md](../03_thiet_ke/de_xuat_database_design_EN.md), [WMSD_SQL_schema.sql](../03_thiet_ke/WMSD_SQL_schema.sql) và [change_logs.md](../../change_logs.md)) lên làm chuẩn tra cứu chính; gắn nhãn phân biệt rõ các tài liệu lịch sử/chờ đồng bộ (không xóa tài liệu cũ); cập nhật đúng danh sách tệp sơ đồ hiện có và bổ sung đủ 6 biên bản họp cùng tệp [khao_sat_kho_gach.csv](../05_khao_sat/khao_sat_kho_gach.csv).

---

### `SYNC-08` [P2] — Liên kết nội bộ trỏ tới 2 đích bị khuyết và 18 lượt liên kết đường dẫn tuyệt đối ngoài kho lưu trữ (kèm lệch hậu tố phiên bản SAP `v4.2` vs `v4.1`)

- **Mức độ ưu tiên:** **P2** (Vấn đề toàn vẹn liên kết và khả năng tái lập nguồn tham chiếu).
- **Bằng chứng xác minh (Verified Evidence):**
  1. **6 lượt liên kết nội bộ trỏ tới đúng 2 tệp đích không tồn tại trong kho lưu trữ:**
     - Đích thiếu thứ nhất: `docs/04_so_do/WMSD_Mainflows_VI_EN.drawio` (5 lượt xuất hiện) tại [README.md](../../README.md) dòng 44, [change_logs.md](../../change_logs.md) dòng 194 (mục nhật ký lịch sử ngày 20/10), [De_xuat_7_quy_trinh_sau_review1.md](../02_nghiep_vu/De_xuat_7_quy_trinh_sau_review1.md) dòng 774, [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) dòng 992 và [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) dòng 993.
     - Đích thiếu thứ hai: `docs/03_thiet_ke/WMSD_ERD_tu_Report3.png` (1 lượt xuất hiện) tại [WMSD_Thiet_ke_he_thong_chi_tiet.md](../03_thiet_ke/WMSD_Thiet_ke_he_thong_chi_tiet.md) dòng 371.
     - *(Ghi chú: Bản thân các tệp [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) dòng 993, [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) dòng 992 và [README.md](../../README.md) dòng 84–85 đã có ghi chú thừa nhận các tệp thiếu này; do đó đây là **khoảng trống đã biết còn để mở (open known gaps)** chứ không phải lỗi mới phát hiện).*
  2. **18 lượt liên kết đường dẫn tuyệt đối trên máy cục bộ Windows (`D:/Ky_9/SEP490/...`) trỏ ra ngoài phạm vi kho Git:**
     - Xuất hiện trên 3 tài liệu nghiệp vụ trong `docs/02_nghiep_vu/` ([De_xuat_7_quy_trinh_sau_review1.md](../02_nghiep_vu/De_xuat_7_quy_trinh_sau_review1.md), [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md)), trỏ tới tệp `review1.md`, thư mục case-study bên ngoài và 4 tệp PDF SAP mang hậu tố phiên bản **`v4.2`**.
     - Cụ thể, tại [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) các dòng 66, 69 và 882–885 (và vị trí tương ứng trong bản EN), tài liệu liên kết tới `review1.md` và bộ SAP **`v4.2`** qua đường dẫn ngoài kho. Trong khi đó, kho lưu trữ thực tế tại `docs/06_tham_khao/sap/` đang lưu trữ bộ 4 tệp PDF SAP **`v4.1`** ([Intro_S4HANA_Using_Global_Bike_Case_Study_WM_I_en_v4.1.pdf](../06_tham_khao/sap/Intro_S4HANA_Using_Global_Bike_Case_Study_WM_I_en_v4.1.pdf), [II](../06_tham_khao/sap/Intro_S4HANA_Using_Global_Bike_Case_Study_WM_II_en_v4.1.pdf), [III](../06_tham_khao/sap/Intro_S4HANA_Using_Global_Bike_Case_Study_WM_III_en_v4.1.pdf), [IV](../06_tham_khao/sap/Intro_S4HANA_Using_Global_Bike_Case_Study_WM_IV_en_v4.1.pdf)), và [de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md) tại dòng 23 đã liên kết đúng vào bộ tệp `v4.1` nội bộ này kèm số trang đã được xác minh khớp văn bản PDF (`WM I` trang 10, 18, 21; `WM II` trang 6, 12, 18, 26, 29; `WM III` trang 14, 19, 25; `WM IV` trang 4, 12, 14, 21, 27).
     - *(Lưu ý: Đợt kiểm toán không truy cập ra ngoài kho Git nên không khẳng định các đường dẫn ngoài đó có tồn tại trên máy cá nhân hay không, và cũng không mặc định nội dung các trang `v4.1` tự động chứng minh cho `v4.2`).*
- **Hệ quả:**
  - Người đọc trên máy khác hoặc trên môi trường Git từ xa không thể mở được 2 tệp đích bị khuyết cũng như 18 liên kết đường dẫn tuyệt đối `D:/Ky_9/SEP490/...`, đồng thời có sự không thống nhất giữa trích dẫn SAP `v4.2` (trong đề xuất quy trình) và tệp SAP `v4.1` thực có (trong kho và trong đề xuất database).
- **Khuyến nghị khắc phục:**
  - Chỉ khôi phục hoặc tạo lại `docs/04_so_do/WMSD_Mainflows_VI_EN.drawio` và `docs/03_thiet_ke/WMSD_ERD_tu_Report3.png` khi được phép trong đợt đồng bộ sơ đồ; nếu chưa bổ sung tệp, cần chuyển liên kết sống (live link) trong các tài liệu hiện hành thành định dạng mã nội dòng (inline code) kèm ghi chú trạng thái thiếu, nhưng giữ nguyên văn bản nhật ký lịch sử trong [change_logs.md](../../change_logs.md).
  - Đưa (vendor) đúng tệp nguồn được phép vào kho lưu trữ kèm ghi chú phiên bản/mã băm, hoặc sau khi đối chiếu từng trang thì chuyển (rebase) các liên kết SAP trong [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) và [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) về đường dẫn tương đối của bộ tệp SAP `v4.1` sẵn có trong `docs/06_tham_khao/sap/` giống như cách [de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md) đã thực hiện.

---

### `SYNC-09` [P3] — Diễn đạt nguồn khảo sát CSV (`Q16`, `Q22`, `Q24`) cho yêu cầu chụp ảnh giao hàng khách (`POD`) vượt quá nội dung câu trả lời thực tế

- **Mức độ ưu tiên:** **P3** (Vấn đề chính xác hóa câu chữ trích dẫn bằng chứng — evidence wording).
- **Bằng chứng xác minh (Verified Evidence):**
  - Tại dòng 874 của [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) và dòng 873 của [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md), văn bản gộp chung nội dung sử dụng điện thoại và đính kèm ảnh chụp vào nhóm câu hỏi khảo sát `Q16`, `Q22`, `Q24`.
  - Tuy nhiên, kiểm tra trực tiếp tệp dữ liệu gốc [khao_sat_kho_gach.csv](../05_khao_sat/khao_sat_kho_gach.csv) cho thấy:
    - `Q16` chỉ mô tả các kênh tiếp nhận nhu cầu xuất hàng (phần mềm, giấy tờ, Zalo, báo miệng), việc giữ hàng và giao hàng nhiều đợt (partial delivery).
    - `Q22` chỉ mô tả thời điểm cập nhật/ghi nhận số liệu.
    - `Q24` chỉ xác nhận nhân sự có sử dụng điện thoại trong công việc.
    - Không câu nào trong ba câu `Q16`, `Q22`, `Q24` xác nhận nghiệp vụ đính kèm ảnh chụp khi giao hàng cho khách (`customer-delivery photo attachment`).
    - Trong tệp CSV, việc chụp ảnh làm bằng chứng thực tế nằm ở câu `Q8` (nhập kho) và `Q12` (hàng lỗi/vỡ); còn quy định bắt buộc chụp ảnh xác nhận giao hàng cho khách (`POD` photo — `UC-110`, `BR-32`) là **chỉ dẫn thiết kế To-be được bổ sung ngày 21/10/2026**.
- **Hệ quả:**
  - Gây hiểu nhầm nhỏ về nguồn gốc bằng chứng thực địa nếu đối chiếu từng câu trong bảng CSV với phần thuyết minh căn cứ khảo sát.
- **Khuyến nghị khắc phục:**
  - Giữ nguyên yêu cầu nghiệp vụ bắt buộc chụp ảnh `POD` khi giao hàng cho khách (`UC-110`, `BR-32`), nhưng sửa lại câu văn tại dòng 874 của [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) và dòng 873 của [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) để tách bạch rõ: `Q24` xác nhận trang bị điện thoại, `Q8`/`Q12` xác nhận thói quen chụp ảnh bằng chứng khi nhập kho/hàng lỗi, còn ảnh chụp giao hàng khách (`POD`) là quy tắc kiểm soát To-be được chốt bổ sung ngày 21/10/2026.

---

### `OBS-01` [Quan sát kế hoạch độc lập] — Cần làm rõ cách tính quỹ dự phòng (buffer) trong ước lượng 350 person-days và tác động của phạm vi mới trong Report 2

- **Phân loại:** Quan sát định lượng về kế hoạch quản lý dự án (không tính gộp vào 9 phát hiện bất đồng bộ tài liệu `SYNC-01..09`).
- **Bằng chứng xác minh (Verified Evidence):**
  - Trong [WMSD_Report2.docx.txt](../01_bao_cao/WMSD_Report2.docx.txt), tổng nỗ lực ước lượng theo các giai đoạn (stages) là `20 + 45 + 45 + 180 + 40 + 20 = 350 person-days`, và dòng 377 cũng đặt mục tiêu tổng nỗ lực là `350 person-days`.
  - Tuy nhiên, phần phân tích năng lực (capacity) tại các dòng 349–363 tính toán tổng quỹ thời gian danh nghĩa (gross capacity) là `2.800 giờ` (`350 person-days` theo chuẩn 8 giờ/ngày), trừ đi quỹ dự phòng (buffer) `560 giờ` (`70 person-days`), còn lại quỹ thời gian làm việc hiệu dụng (effective capacity) là **`2.240 giờ` (tương đương `280 person-days`)**.
  - Như vậy, tồn tại khoảng chênh lệch **`70 person-days` (`560 giờ`)** nếu các ước lượng công việc theo giai đoạn (`350 person-days`) đang là khối lượng công việc thuần (net work) chưa bao gồm buffer.
  - Ngoài ra, [WMSD_Report2.docx.txt](../01_bao_cao/WMSD_Report2.docx.txt) chưa phản ánh phần công việc bổ sung cho các Use Case mới `UC-109..111`, 9 bảng dữ liệu mới của chuỗi `SO`/`POD`/`PAY-CFM` và các kịch bản kiểm thử chứng cứ ảnh. *(Lưu ý: Report 2 có nhắc tới các Report 4–7, tài liệu kiểm thử và bảng theo dõi tiến độ như các tạo phẩm theo kế hoạch; việc các tệp đó không nằm trong kho Git này không phải là bằng chứng rằng chúng không tồn tại ở nơi lưu trữ khác của nhóm).*
- **Khuyến nghị:**
  - Trước khi chốt lịch biểu triển khai chi tiết, nhóm cần làm rõ trong [WMSD_Report2.docx.txt](../01_bao_cao/WMSD_Report2.docx.txt) xem con số `350 person-days` của 6 giai đoạn đã bao gồm 20% buffer (`560 giờ`) hay chưa, đồng thời rà soát lại phân bổ thời gian cho phần mở rộng `UC-109..111` và mô hình dữ liệu `3.0.0`. *(Báo cáo kiểm toán này không kết luận tiến độ dự án là bất khả thi vì không có dữ liệu tracker thực tế ngoài kho).*

---

## 5. Các kiểm tra nhất quán đã đạt (Passed Consistency Checks)

Bên cạnh các điểm cần đồng bộ nêu trên, đợt kiểm toán ghi nhận các kiểm tra tài liệu (documentary checks) đã đạt kết quả sau:

1. **Tính đối xứng cấu trúc và mã định danh giữa hai bản Quy trình `3.0.0` ([de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) & [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md)):**
   - Cả hai bản đều có đúng **30 bảng Markdown** khớp nhau về kích thước hàng/cột và trình tự mã định danh.
   - Cả hai bản đều có đúng **9 khối sơ đồ Mermaid** (1 sơ đồ Context + 8 sơ đồ luồng `BF-01`..`BF-08`) có cấu trúc đồ thị chuẩn hóa tương đương.
   - Khớp chính xác **37 định nghĩa nhánh ngoại lệ/thay thế (`A/E`)** và **33 quy tắc nghiệp vụ (`BR-01`..`BR-33`)**, không có mã nhánh hoặc mã quy tắc nào bị trùng lặp. *(Lưu ý: đây là kiểm tra cấu trúc và đối chiếu có mục tiêu, không chứng minh tương đương dịch thuật từng câu chữ; các điểm lệch câu chữ/nguồn trích dẫn cụ thể được báo cáo riêng tại `SYNC-06` và `SYNC-09`).*
2. **Tính đối xứng cấu trúc và mã định danh giữa hai bản Thiết kế Database `3.0.0` ([de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md) & [de_xuat_database_design_EN.md](../03_thiet_ke/de_xuat_database_design_EN.md)):**
   - Cả hai bản đều có đúng **16 bảng Markdown** khớp cấu trúc, **21 quy tắc thiết kế dữ liệu (`R-01`..`R-21`)**, **40 kịch bản nghiệm thu dữ liệu (`T01`..`T40`)** và cùng cấu trúc sơ đồ ERD; các hợp đồng chính đã được đối chiếu có mục tiêu. *(Lưu ý: đây là kiểm tra cấu trúc kết hợp đối chiếu ngữ nghĩa có mục tiêu, không thay thế cho việc thẩm định dịch thuật từng từ trên toàn văn bản).*
3. **Sự thống nhất hợp đồng nghiệp vụ – dữ liệu được lấy mẫu trên bộ 5 tài liệu cốt lõi `3.0.0`:**
   - Đối chiếu mẫu trên các trường khóa, 5 vai trò ứng dụng (`OWNER`, `SALES`, `WAREHOUSE`, `ACCOUNTANT`, `ADMIN`), máy trạng thái chứng từ (`SO`, `WIR`, `OD`, `GI-S`, `POD`, `PAY-CFM`, `customer_return_assessment`) và sự phân tách rõ giữa **MongoDB runtime** với **DDL T-SQL tham chiếu** đều thống nhất trên cả 5 tệp ([de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), [de_xuat_quy_trinh_2_EN.md](../02_nghiep_vu/de_xuat_quy_trinh_2_EN.md), [de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md), [de_xuat_database_design_EN.md](../03_thiet_ke/de_xuat_database_design_EN.md), [WMSD_SQL_schema.sql](../03_thiet_ke/WMSD_SQL_schema.sql)).
4. **Tính nhất quán nội tại của bản SRS cục bộ ([WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt)) tại mốc baseline 21/10/2026:**
   - Bản thân tệp [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) trong kho hiện có đúng **108 mục danh mục UC phân biệt (`95 ACTIVE`, `13 RETIRED`)**, **108 dòng phân quyền** và **108 mục đặc tả UC chi tiết** khớp nhau nội bộ (không phải bản 102 UC của đợt ngày 17/10/2026).
5. **Tính toàn vẹn của dữ liệu khảo sát gốc và biên bản lịch sử:**
   - Tệp [khao_sat_kho_gach.csv](../05_khao_sat/khao_sat_kho_gach.csv) được giữ nguyên vẹn (1 phản hồi ngày 20/10/2026, 26 câu hỏi đánh số, 47 cột CSV bao gồm cả cột thời gian và các cột mở rộng dạng lưới); phương án chọn mâu thuẫn tại câu `Q13` trong dữ liệu thô được bảo toàn nguyên trạng và được giải quyết minh bạch bằng quyết định thiết kế `D4` (có điều chuyển liên kho).
   - Các biên bản họp tháng 9 – đầu tháng 10/2026 và [Tổng hợp quy trình.pdf](../06_tham_khao/quy_trinh/Tổng%20hợp%20quy%20trình.pdf) được bảo toàn đúng vai trò là bằng chứng tiến hóa phạm vi dự án.
6. **Xác minh trích dẫn tài liệu tham khảo SAP S/4HANA `v4.1`:**
   - Toàn bộ siêu dữ liệu (`Last Update June 2022` / `06/2022`) và các số trang trích dẫn SAP `v4.1` dùng trong [de_xuat_database_design_VI.md](../03_thiet_ke/de_xuat_database_design_VI.md) (`WM I`: 10, 18, 21; `WM II`: 6, 12, 18, 26, 29; `WM III`: 14, 19, 25; `WM IV`: 4, 12, 14, 21, 27) đã được đối chiếu khớp với văn bản trích xuất từ 4 tệp PDF trong `docs/06_tham_khao/sap/`.
7. **Kiểm tra cổng chất lượng tài liệu, toàn vẹn tệp nguồn và trạng thái Git (Documentary & Repository Integrity Gates):**
   - Toàn bộ **33 tệp gốc trước kiểm toán** giữ nguyên vẹn tuyệt đối mã băm **`SHA-256`** so với trạng thái ban đầu.
   - Toàn bộ các liên kết tệp tương đối (relative file links) được gắn trong báo cáo kiểm toán này đều trỏ tới các tệp đích tồn tại thực tế trên đĩa; ma trận bao phủ tại Mục 3 chứa đúng **32 dòng tạo phẩm đánh số thứ tự (`1..32`)** cùng 1 tệp kỹ thuật [debug.log](../03_thiet_ke/debug.log) được ghi nhận loại trừ riêng.
   - Kiểm tra `git diff` (cả working tree và index/cached đối với các tệp đã theo dõi) hoàn toàn trống, `git diff --check` đạt hoàn toàn, và trên toàn kho lưu trữ chỉ xuất hiện duy nhất tệp báo cáo mới chưa theo dõi (`untracked`) này. *(Lưu ý: đây là các kiểm tra tính toàn vẹn tài liệu và kho lưu trữ thực tế của đợt kiểm toán này, tách biệt hoàn toàn với các kết quả lịch sử về `ScriptDom`, `SQLite in-memory` hay kiểm thử backend được ghi trong [change_logs.md](../../change_logs.md)).*

---

## 6. Danh mục và thứ tự khắc phục khuyến nghị (Ordered Remediation Checklist)

Để đưa toàn bộ kho tài liệu về trạng thái đồng bộ với chuẩn `3.0.0` (ngày 22/10/2026) trước khi bước vào giai đoạn lập trình và nghiệm thu, nhóm dự án nên thực hiện theo đúng thứ tự ưu tiên sau:

1. **[Bước 1 — P1 | Đồng bộ mã quy trình `BF` và mô hình `SO`/`POD`/`PAY-CFM` vào Report 3 & Report 1 (`SYNC-01`, `SYNC-02`)]**
   - Cập nhật [WMSD_Report3_Fix.docx.txt](../01_bao_cao/WMSD_Report3_Fix.docx.txt) và [WMSD_Report1_Fix.docx.txt](../01_bao_cao/WMSD_Report1_Fix.docx.txt) (cùng bản Word `.docx` gốc bên ngoài nếu có) từ 7 quy trình lên 8 quy trình (`BF-01`..`BF-08`, tách `BF-03` và `BF-04`, dịch `BF-04..07` cũ thành `BF-05..08`).
   - Cập nhật `UC-45..48` sang quản lý bản sao `SO`; bổ sung đầy đủ `UC-109` (`WIR` liên kết `SO`), `UC-110` (`POD` kèm ảnh chụp bắt buộc), `UC-111` (`PAY-CFM` xác nhận thu đủ tiền ngoài hệ thống) và `BR-31..33`, nâng tổng số UC trong SRS lên 111 mã (`98 ACTIVE`, `13 RETIRED`) và 33 `BR`.
   - Sửa các tham chiếu mã nhánh ngoại lệ trong phần đặc tả chi tiết UC (ví dụ `UC-104` dòng 1339 từ `BF03-E1/E2/E3` sang mã nhánh của `BF-04`).
2. **[Bước 2 — P1 | Cập nhật sơ đồ ERD `WMSD_database_design.drawio` (`SYNC-04`)]**
   - Bổ sung 10 bảng còn thiếu (`sales_order`, `sales_order_line`, `sales_order_cancellation`, `outbound_delivery_line`, `sales_goods_issue_line`, `customer_delivery`, `customer_delivery_line`, `external_payment_confirmation`, `customer_return_assessment`, `business_operation`) vào [WMSD_database_design.drawio](../03_thiet_ke/WMSD_database_design.drawio).
   - Thay các cột `customer_id`, `external_line_id` trên `issue_request` / `issue_request_line` (trang `'5. Xuất kho & Tác vụ Kho'`) bằng `sales_order_id`, `sales_order_line_id` và cập nhật số liệu thống kê tại cell `ov_banner` trang `'0. Tổng quan (Overview)'` lên 73 bảng / 2 views.
3. **[Bước 3 — P1 | Lấp khoảng trống tài liệu Thiết kế hệ thống chi tiết (`SYNC-03`)]**
   - Xây dựng bản Thiết kế hệ thống chi tiết mới theo baseline `3.0.0` (loại bỏ các route API của UC đã retired, cập nhật 5 role, quy trình kiểm kê `FROZEN`, đánh giá trả hàng `D6`, chuỗi `SO`–`WIR`–`POD`–`PAY-CFM`, và 111 UC); đánh dấu rõ bản `1.0` ngày 16/10/2026 ([WMSD_Thiet_ke_he_thong_chi_tiet.md](../03_thiet_ke/WMSD_Thiet_ke_he_thong_chi_tiet.md)) là bản lịch sử đã được thay thế (`Superseded`).
4. **[Bước 4 — P2 | Chỉnh câu chữ đối chiếu trong `de_xuat_quy_trinh_2_VI.md` và căn cứ khảo sát ảnh chụp (`SYNC-06`, `SYNC-09`)]**
   - Sửa các dòng 269, 275 và 415 của [de_xuat_quy_trinh_2_VI.md](../02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) cho khớp với bản tiếng Anh (ghi nhận Report 3 cục bộ đã có `FROZEN` và `UC-103..108`, chỉ còn thiếu `UC-109..111`).
   - Tách bạch rõ câu chữ tại dòng 874 (bản VI) và dòng 873 (bản EN) giữa dữ liệu thực địa trong CSV (`Q24` dùng điện thoại, `Q8`/`Q12` chụp ảnh nhập kho/hàng lỗi) với quy tắc thiết kế To-be ngày 21/10 (`POD` bắt buộc chụp ảnh khi giao hàng khách).
5. **[Bước 5 — P2 | Đồng bộ bộ sơ đồ độc lập tại `docs/04_so_do/` (`SYNC-05`)]**
   - Cập nhật [WMSD_Mainflows_EN.drawio](../04_so_do/WMSD_Mainflows_EN.drawio) (hoặc bộ sơ đồ song ngữ 8 quy trình `BF-01..08`), xuất lại 2 ảnh PNG điều chuyển liên kho dưới nhãn `BF-04`, cập nhật [context-diagrem.mermaid](../04_so_do/context-diagrem.mermaid) theo đúng 5 role và phạm vi không tính giá bán / không khóa cứng nhà cung cấp lưu trữ ảnh, và gắn nhãn lịch sử cho [Business_Process.drawio](../04_so_do/Business_Process.drawio) cùng [WMSD_Bangach.drawio](../04_so_do/WMSD_Bangach.drawio).
6. **[Bước 6 — P2 | Cập nhật `README.md` và chuẩn hóa liên kết (`SYNC-07`, `SYNC-08`)]**
   - Cập nhật [README.md](../../README.md) để trỏ tới bộ tài liệu `3.0.0`, liệt kê đầy đủ 6 biên bản họp và tệp [khao_sat_kho_gach.csv](../05_khao_sat/khao_sat_kho_gach.csv).
   - Xử lý 2 đích liên kết nội bộ bị khuyết (`docs/04_so_do/WMSD_Mainflows_VI_EN.drawio`, `docs/03_thiet_ke/WMSD_ERD_tu_Report3.png`) và chuyển các liên kết tuyệt đối `D:/Ky_9/SEP490/...` sang tài liệu nội bộ kho lưu trữ (sau khi đối chiếu trang hoặc bổ sung tệp nguồn tương ứng).
7. **[Bước 7 — Kế hoạch | Làm rõ quỹ công và dự phòng trong Report 2 (`OBS-01`)]**
   - Làm rõ mối quan hệ giữa tổng nỗ lực 350 person-days và quỹ hiệu dụng 280 person-days (sau khi trừ 560 giờ buffer) trong [WMSD_Report2.docx.txt](../01_bao_cao/WMSD_Report2.docx.txt), đồng thời cập nhật phạm vi kiểm thử cho `UC-109..111`.

---

## 7. Giới hạn của đợt rà soát (Audit Limitations)

1. **Chỉ kiểm toán trên các tệp có trong kho Git hiện tại (`D:\Ky_9\SEP490\git_doc`):**
   - Các tệp Google Docs trực tuyến, các tệp Word `.docx` gốc của Report 1, Report 2, Report 3 (ngoài 3 bản trích xuất `.docx.txt`), các báo cáo giai đoạn sau (Report 4–7), bảng theo dõi tiến độ bên ngoài và các đường dẫn tuyệt đối ngoài kho (`D:/Ky_9/SEP490/...`) không nằm trong kho Git này và không được truy xuất.
2. **Phạm vi kiểm tra trực quan (Visual Inspection) so với kiểm tra trích xuất văn bản/XML:**
   - Chỉ 2 tệp ảnh PNG ([WMSD_Mainflow_BF03B_VI.png](../04_so_do/WMSD_Mainflow_BF03B_VI.png) và [WMSD_Mainflow_BF03B_EN.png](../04_so_do/WMSD_Mainflow_BF03B_EN.png)) được kiểm tra trực quan bằng mắt.
   - Bố cục hiển thị đồ họa của 4 tệp `.drawio` (40 trang), 6 tệp `.docx` biên bản họp và 5 tệp `.pdf` (124 trang) không được duyệt giao diện bằng mắt từng trang mà được kiểm tra thông qua giải mã cấu trúc XML (với `.drawio`) và trích xuất toàn văn bản theo đoạn/trang (với `.docx` và `.pdf`).
3. **Không thực thi mã nguồn, cơ sở dữ liệu thật hoặc kiểm thử runtime:**
   - Kho lưu trữ này là kho tài liệu; không có mã nguồn backend/frontend hay cơ sở dữ liệu MongoDB / SQL Server đang chạy được thực thi trong đợt kiểm toán này.
   - Cấu trúc bảng và cột trong [WMSD_SQL_schema.sql](../03_thiet_ke/WMSD_SQL_schema.sql) được kiểm tra bằng cách đọc và đối chiếu văn bản mã nguồn DDL; đợt kiểm toán này không chạy lại trình phân tích cú pháp `ScriptDom` hay thực thi lại các bài kiểm tra trên SQLite in-memory (các kết quả `ScriptDom` và SQLite in-memory ghi trong [change_logs.md](../../change_logs.md) là kết quả lịch sử của các lượt trước, không được tính là kiểm thử runtime mới của báo cáo này).
4. **Trạng thái phê duyệt của khách hàng:**
   - Phiên bản `3.0.0` ngày 22/10/2026 được sử dụng làm chuẩn đối chiếu kỹ thuật mới nhất trong kho tài liệu, nhưng báo cáo này không suy diễn rằng phương án `3.0.0` đã có biên bản nghiệm thu hay chữ ký phê duyệt chính thức của chủ cửa hàng Tân Thương.
