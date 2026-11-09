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

| Tài liệu | Nội dung |
|---|---|
| [DB rebuild](docs/09_phat_trien/DB_REBUILD.md) | Registry mới, migration lịch sử và giới hạn runtime |
| [BF03](docs/08_api/location-movements/README.md) | API chuyển vị trí cùng kho trên runtime hiện có |
| [BF04](docs/08_api/transfers/BF04_API.md) / [quyền đọc TR](docs/08_api/transfers/README.md) | API chuyển giữa kho và phạm vi xem |
| [RR](docs/08_api/replenishments/README.md) | Bổ sung hàng |
| [SO / giao hàng](docs/08_api/sales-orders/README.md) | Hợp đồng API bán hàng hiện có |
| [Gói test FE06](docs/08_api/test_packs/fe06-iteration1/README.md) | Cách gọi API và nguồn test lịch sử |
| [Return workflows native](docs/08_api/RETURN_WORKFLOWS_NATIVE.md) / [kết quả kiểm chứng](docs/08_api/RETURN_WORKFLOWS_VERIFICATION.md) | Port ba iteration Trungph theo schema hiện hành |
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

Model runtime hiện hành dùng 59 file collection `src/models/*.model.js` và 96 schema nhúng `src/models/*.schema.js`, cùng một registry. Ba thư mục model cũ đã được bỏ theo quyết định ngày 06/11/2026. DB Atlas/v8 là bằng chứng có ngày, không phải đích runtime hiện tại. Xem [hợp đồng runtime](docs/08_api/NATIVE_MODEL_RUNTIME.md) và [hướng dẫn local](docs/09_phat_trien/DB_REBUILD.md).

[Category v8: phân loại, dọn model và triển khai](docs/09_phat_trien/CATEGORIES_V8.md). Bản v7 trước là mốc lịch sử.
