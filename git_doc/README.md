## Phạm vi hiện hành

Phạm vi hiện hành ngày 26/11/2026 gồm đơn bán mới theo lịch giao và giữ tồn FIFO, cùng phiếu SALE độc lập theo mã ngoài (Sales gửi chờ duyệt, Owner khác duyệt, Kho vận chọn lô và ghi xuất). Khách trả bắt đầu từ phiếu xuất đã ghi sổ, hiển thị lô thực xuất và hạn mức còn lại; kiểm hàng không đổi tồn, chỉ phần được Sales chấp nhận mới ghi nhập. Trả NCC dùng thỏa thuận theo nguồn; Accountant ghi ACK riêng rồi đối chiếu/đóng, không ghi tồn lần hai. Không có danh mục khách hàng; thông tin khách là snapshot trên chứng từ. Xem [phạm vi và nguồn yêu cầu](PROJECT_GUIDE.md#phạm-vi-chức-năng-hiện-hành).

> Mới 15/11/2026: [Báo cáo vận hành UC-113](docs/08_api/OPERATIONAL_REPORTS.md) — nhóm báo cáo theo vai trò, bộ lọc, chỉ đọc và giới hạn vai trò tùy chỉnh.
> Mới 22/11/2026: kiểm kê được thiết kế lại theo phản hồi giảng viên — [kế hoạch kiểm kê định kỳ tách khỏi phiếu](docs/08_api/STOCKTAKE_PLANS.md), bỏ đếm mù, đối chiếu đơn giản (đếm lại hoặc duyệt chênh lệch theo từng dòng) và bỏ lý do chốt: [hợp đồng hiện hành](docs/08_api/STOCKTAKE_LIFECYCLE.md#redesign--22-november-2026-current-contract).
> 13/11/2026 (một phần đã bị thay thế ngày 22/11/2026): [Vòng đời kiểm kê BF-05](docs/08_api/STOCKTAKE_LIFECYCLE.md) — lập kế hoạch, đóng băng, đếm mù, đối chiếu, duyệt độc lập, chốt và hàng phát hiện ngoài sổ.
> Mới 10/11/2026: [18 UC HieuDT — API và màn hình](docs/08_api/HIEUDT_ITERATIONS_NATIVE.md), [chạy test local](docs/09_phat_trien/HIEUDT_LOCAL_TESTS.md).

# WMSD — Tài liệu chung của nhóm

Cập nhật ngày 06/11/2026. Đây là điểm bắt đầu khi phát triển backend và chuyển sang DB mới.

[Quyết định gộp 10 bảng](docs/03_thiet_ke/DB_Rebuild_Review/36_Gop_10_bang.md) · [Từ điển registry hiện hành 58 collection](docs/03_thiet_ke/DB_Current_2026-11-09_57/WMSD_Data_Dictionary.md)

## Đọc theo thứ tự

[Merge main 06/11/2026 — model, API runtime và kiểm thử](docs/09_phat_trien/MERGE_MAIN_2026-11-06.md).

Bản v8 là snapshot lịch sử có category. Registry hiện hành có 58 collection, gồm GoodsReceipt và Conversion. Xem [từ điển 58 collection](docs/03_thiet_ke/DB_Current_2026-11-09_57/WMSD_Data_Dictionary.md), [ERD hiện hành](docs/03_thiet_ke/DB_Current_2026-11-09_57/WMSD_ERD_Current.drawio), [hợp đồng Conversion](docs/08_api/CONVERSIONS.md) và [sản phẩm, lô, thùng và sức chứa](docs/03_thiet_ke/DB_Rebuild_Review/39_San_pham_va_lo_dang_chot.md). Các snapshot trước giữ làm lịch sử.

1. [Hướng dẫn dự án và quyết định hiện hành](PROJECT_GUIDE.md).
2. [Bản đồ toàn bộ 59 collection và nơi sửa model](MODEL_MAP.md).
3. [Quy tắc tự cập nhật tài liệu khi code](DOCUMENTATION_RULES.md).
4. [Phiếu duyệt từng bảng](docs/03_thiet_ke/DB_Rebuild_Review/00_Hien_trang_va_cach_duyet.md) và [nhật ký quyết định](docs/03_thiet_ke/DB_Rebuild_Review/04_Nhat_ky_duyet.md).
5. [DB Diagram kiểu SQL (59 bảng, PK/FK và crow's-foot)](docs/03_thiet_ke/WMSD_SQL_Style_DB_Diagram_2026-11-05.drawio), [DB Diagram chi tiết snapshot (94 tab)](docs/03_thiet_ke/WMSD_DB_Diagram_2026-11-05.drawio), [ERD / snapshot / từ điển dữ liệu lịch sử](docs/03_thiet_ke/DB_Current_2026-11-04/README.md).
6. [MongoDB local và Compass](docs/09_phat_trien/MONGODB_LOCAL.md), [bộ seed cửa hàng gạch](docs/09_phat_trien/SEED_CUA_HANG_GACH.md).

## Tài liệu triển khai

Đã triển khai luồng [xuất bán và trả hàng theo demo Trungph](docs/09_phat_trien/TRUNG_SALES_RETURNS_IMPLEMENTATION_PLAN.md): backend full-flow đã kiểm chứng; FE còn 5 lỗi tương tác jsdom/Ant Design trong bộ tập trung và chưa có browser visual run. Kịch bản 8 → 4 → 4 trả NCC dùng lô nguồn khác cho phần trả NCC.

Đặc tả tính năng đang chuẩn bị: [Kho 3D — phiên bản 1](docs/10_Kho3D/README.md) (12/11/2026). Ghi các quyết định mới về mặt bằng, khu vực, pallet và cảnh báo chiều cao; chưa phải hợp đồng API hoặc tính năng đã triển khai.

| Tài liệu | Nội dung |
|---|---|
| [GitHub Actions CI](docs/09_phat_trien/GITHUB_ACTIONS_CI.md) | Trigger và lệnh kiểm tra cho hai repo FE và BE |
| [Hướng dẫn sử dụng kiểm kho (Word)](docs/02_nghiep_vu/HUONG_DAN_SU_DUNG_KIEM_KHO.docx) | Tài liệu người dùng cuối: lập kế hoạch, tạo phiếu, đếm, đếm lại, duyệt chênh lệch; 29 ảnh nhúng trong một file (22/11/2026) |
| [Stocktake end-to-end walkthrough](docs/09_phat_trien/STOCKTAKE_E2E_WALKTHROUGH.md) | Luồng kế hoạch → phiếu → đếm → đếm lại → duyệt, có ảnh từng bước (22/11/2026) |
| [Docker](docs/09_phat_trien/DOCKER.md) | Dockerfile backend, compose ở thư mục gốc workspace |
| [Import đá và gạch cầu thang demo](docs/09_phat_trien/VUADADEP_DEMO_IMPORT.md) | Lịch sử import và dọn dữ liệu demo |
| [DB rebuild](docs/09_phat_trien/DB_REBUILD.md) | Registry mới, migration lịch sử và giới hạn runtime |
| [Đọc code RR → nhập → cất hàng](docs/09_phat_trien/HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md) | Từng hàm, biến, truy vấn MongoDB và rủi ro của luồng mua hàng |
| [Giải thích và đối chiếu 26 sơ đồ BF-01](docs/04_so_do/WMSD_BF01_Diagrams_Review.md) | Mermaid cho từng trang, ký hiệu UML và đối chiếu với code RR, PO, kiểm nhận, nhập mua và giữ hộ |
| [BF03](docs/08_api/location-movements/README.md) | API chuyển vị trí cùng kho trên runtime hiện có |
| [BF04](docs/08_api/transfers/BF04_API.md) / [quyền đọc TR](docs/08_api/transfers/README.md) | API chuyển giữa kho và phạm vi xem |
| [RR](docs/08_api/replenishments/README.md) | Bổ sung hàng |
| [Notification inbox](docs/08_api/NOTIFICATIONS.md) | Notification bell and bulk read API |
| [SO / giao hàng](docs/08_api/sales-orders/README.md) | Hợp đồng API bán hàng hiện có |
| [Goods Issue UC-69–72](docs/08_api/GOODS_ISSUES.md) | Phiếu bán theo lịch đơn bán hoặc mã ngoài độc lập; picking/PGI, điều chuyển và các lệnh xuất native |
| [Gói test FE06](docs/08_api/test_packs/fe06-iteration1/README.md) | Cách gọi API và nguồn test lịch sử |
| [Return workflows native](docs/08_api/RETURN_WORKFLOWS_NATIVE.md) / [kết quả kiểm chứng](docs/08_api/RETURN_WORKFLOWS_VERIFICATION.md) | Khách trả theo phiếu xuất/lô nguồn, trả NCC theo thỏa thuận, ACK và đối chiếu riêng |
| [Nhật ký thay đổi](change_logs.md) | Mỗi lượt thay đổi cùng kiểm chứng và phần còn mở |
| [Nhật ký model](../src/models/CHANGELOG.md) | Thay đổi schema và ảnh hưởng dữ liệu |

## Nguồn và mốc tài liệu

Bộ duyệt DB ngày 31/10–05/11 là căn cứ cho thiết kế mới. Quy trình, UC và report baseline 3.3.x trong `docs/01_bao_cao`, `docs/02_nghiep_vu` và các thiết kế trước đó dùng để truy vết phần chưa bị thay thế. Khi khác nhau về role, UOM, giá/hóa đơn, chứng từ hoặc số đợt điều chuyển, áp dụng quyết định đã duyệt được chỉ ra trong PROJECT_GUIDE.

ERD/Data Dictionary ngày 04/11 là snapshot schema, đã bổ sung quy tắc một thùng một sản phẩm/một lô ngày 05/11. Số bản ghi trong snapshot thuộc bộ mẫu lúc chụp. Bộ seed cửa hàng ngày 05/11 có báo cáo riêng.

Phiếu duyệt, thiết kế, hướng dẫn chuyển DB và API đã tập trung vào repo này. Đường dẫn cũ tại module dẫn về tài liệu chính. [Manifest nhập tài liệu](outputs/document_import_manifest_2026-11-05.json) ghi nguồn và mã kiểm tra tại lúc nhập. Từ lượt này sửa bản trong `git_doc`; nếu phát hành lại bản ở `docs_doan`, ghi rõ ngày xuất và nguồn.

## Lịch sử, khảo sát và báo cáo

- [Context BE trước đợt tổng hợp](docs/99_lich_su/context_BE_truoc_tong_hop_2026-11-05.md) giữ các thẻ UC và ghi chú triển khai cũ để tra cứu.
- [Chỉ mục tài liệu cũ](docs/99_lich_su/README_truoc_tong_hop_2026-11-05.md) giữ lịch sử 3.0–3.3.
- Các file `docs/01_bao_cao` là bản so sánh/nộp bài, sửa trong mục hiện có và bảo toàn format.
- Khảo sát ở `docs/05_khao_sat`, SAP tham khảo ở `docs/06_tham_khao`, rà soát theo ngày ở `docs/07_ra_soat`.

Model runtime hiện hành dùng 59 file collection `src/models/*.model.js` và 101 schema nhúng `src/models/*.schema.js`, cùng một registry. Ba thư mục model cũ đã được bỏ theo quyết định ngày 06/11/2026. DB Atlas/v8 là bằng chứng có ngày, không phải đích runtime hiện tại. Xem [hợp đồng runtime](docs/08_api/NATIVE_MODEL_RUNTIME.md) và [hướng dẫn local](docs/09_phat_trien/DB_REBUILD.md).

[Category v8: phân loại, dọn model và triển khai](docs/09_phat_trien/CATEGORIES_V8.md). Bản v7 trước là mốc lịch sử.

Current feature contract: [Excel exports and opening stock](docs/08_api/EXCEL_AND_OPENING_STOCK.md), including [local additive setup](docs/09_phat_trien/EXCEL_OPENING_SETUP.md) (16 November 2026).

Sales and returns: [scheduled orders](docs/08_api/SALES_DELIVERY_SCHEDULE.md) · [Goods Issue](docs/08_api/GOODS_ISSUES.md) · [return workflow](docs/08_api/RETURN_WORKFLOWS_NATIVE.md) · [local setup](docs/09_phat_trien/SIMPLIFIED_SALES_SETUP.md).
