> 12/11/2026: [Phạm vi HieuDT 20 UC mới](docs/08_api/HIEUDT_WAREHOUSE_SCOPE.md) theo bảng người dùng: kho/vị trí, tồn, BF03, BF04, đối soát và nhật ký. Đây là nguồn đối chiếu phạm vi hiện tại; các khả năng 18 UC trước vẫn được giữ. Native warehouse-stock thay route demo, không fallback dữ liệu mẫu.

> 11/11/2026: BF03 dùng bảng chọn hàng theo kho/vị trí, chỉ số nguyên thùng/viên; không tự mở thùng. Luồng tạo/sửa kiểm quy cách ngay trước lưu. Thử đơn vị/quy đổi trên DB local riêng và chờ người dùng kiểm tra trước triển khai lên wmsd_database.

> 10/11/2026: [Hợp đồng 18 UC HieuDT](docs/08_api/HIEUDT_ITERATIONS_NATIVE.md) là nguồn hiện hành cho SO/WIR/OD/picking, chốt kiểm kê và báo cáo; [kiểm thử local](docs/09_phat_trien/HIEUDT_LOCAL_TESTS.md). Chốt kiểm kê kiểm phê duyệt đúng nội dung, count mới nhất, thực hiện/bằng chứng trước khi ghi tồn và mở khóa nguyên tử.

> Quyết định 09/11/2026 bổ sung [Conversion theo sản phẩm và lô](docs/08_api/CONVERSIONS.md). [Iteration 1 native](docs/08_api/ITERATION1_NATIVE_2026-11-06.md) tiếp tục áp dụng cho NCC, giữ hộ và đảo nhập.

# WMSD — Hướng dẫn chung khi phát triển

Mốc tổng hợp 05/11/2026. Phạm vi cửa hàng gạch ốp lát, nhiều kho, sản phẩm/lô, mua–nhập, chuyển, bán–giao, hàng lỗi/trả và kiểm kê. Các dữ kiện dưới đây là thiết kế đã duyệt; trạng thái triển khai được ghi riêng.

## 1. Phân biệt thiết kế và runtime

The runtime uses one registry: `src/models/index.js` exports `registerModels(connection)`; `runtime.js` supplies API models. There are 59 collection schemas (`*.model.js`); five GoodsReceipt kinds share `goods_receipts`. Nested schemas do not create collections. `registerReviewedModels` is a compatibility alias. Pure historical transforms and synthetic fixtures under `src/migrations/rebuild` and `src/seeds/rebuild` remain for regression checks.

[Hợp đồng runtime mới](docs/08_api/NATIVE_MODEL_RUNTIME.md) phân biệt API đã chuyển và phạm vi kiểm chứng. Việc có schema cho một nghiệp vụ không có nghĩa mọi màn hình demo đã thành chức năng vận hành.

[Hợp đồng GoodsReceipt BE](docs/08_api/GOODS_RECEIPTS.md) là nguồn hiện hành cho năm loại phiếu nhập, quyền tách riêng khách trả/giao thất bại, phiếu `OTHER`, Bỏ ghi và API đã gỡ. FE dùng danh sách phiếu nhập gộp, chi tiết theo loại và form ghi tồn từ chứng từ nguồn. Kiểm hàng, tạm giữ và cất hàng có màn hình riêng.

## 2. Thứ tự dùng nguồn

1. Quyết định trực tiếp mới nhất của người dùng trong phạm vi công việc.
2. Các phiếu đã duyệt và [nhật ký duyệt](docs/03_thiet_ke/DB_Rebuild_Review/04_Nhat_ky_duyet.md).
3. Hướng dẫn này, MODEL_MAP, Data Dictionary và schema code khi xác định hiện trạng.
4. Hợp đồng module hiện có để bảo toàn tương thích trong giai đoạn chuyển API.
5. Baseline UC/report/quy trình cũ cho phần còn phù hợp. Dùng cả tên UC và crosswalk khi mã số đã được đổi.

Code thực tế chứng minh hiện trạng triển khai, không tự thay quyết định nghiệp vụ. Nếu quyết định chưa rõ, ghi điểm mở và hỏi đúng phần phụ thuộc. D07/D08 về xác minh chứng từ nguồn vẫn chờ người phụ trách, không tự đánh dấu đã duyệt.

## 3. Quyết định cần nắm trước khi sửa bất kỳ model nào

| Chủ đề | Quy tắc đã chốt | Nguồn chi tiết |
|---|---|---|
| Tài khoản/quyền | Một user có một role, có thể phụ trách nhiều kho. Tên role kho là Warehouse Staff. Admin được tạo role và tick quyền có sẵn, role mới thực hiện theo quyền. Kiểm thêm kho, người tạo, trạng thái và tách người duyệt khi luồng yêu cầu. | [A01–A03](docs/03_thiet_ke/DB_Rebuild_Review/02_Duyet_tai_khoan_va_phan_quyen.md) |
| SKU và lô | Nhận diện sản phẩm bằng hãng + SKU hãng + màu; khác màu là productId khác. Sản phẩm có lengthMm/widthMm/heightMm của từng viên. Lô theo productId + manufacturerLot; không có calibre/tone. Số viên/thùng cố định theo lô, kích thước ngoài thùng ghi thực tế, không suy từ thể tích viên. | [B04/B05 hiện hành](docs/03_thiet_ke/DB_Rebuild_Review/39_San_pham_va_lo_dang_chot.md) |
| Đơn vị/thùng | Uom giữ mã, tên, trạng thái và dấu hiệu đơn vị thùng. Conversion giữ hệ số theo sản phẩm, lô tùy chọn và ngày hiệu lực. Chứng từ lưu snapshot hệ số và quy cách. Một thùng vật lý chỉ chứa một sản phẩm, một lô. Gộp thùng cùng sản phẩm, lô và quy cách trên một dòng. | [Quy đổi](docs/08_api/CONVERSIONS.md), [nhận thùng](docs/03_thiet_ke/DB_Rebuild_Review/15_Duyet_hang_den_kiem_nhan_va_phieu_nhap.md) |
| Kho và sức chứa | Ô giữ chiều dài/rộng; chiều cao dùng chung từ kho. Không quản lý chồng. packagingPortions[] giữ thùng nguyên/hàng lẻ và thể tích thực đo. BE kiểm cạnh thùng vừa ô và tổng thể tích. Chưa có tọa độ xếp kiện nên lượng thùng còn xếp được chỉ là ước tính; 3D triển khai sau. | [B01/B02](docs/03_thiet_ke/DB_Rebuild_Review/05_Duyet_kho_vi_tri_don_vi_tinh.md), [quy cách và kiểm sức chứa](docs/03_thiet_ke/DB_Rebuild_Review/39_San_pham_va_lo_dang_chot.md) |
| Khách/NCC/bàn giao | Khách và nhà cung cấp có danh mục riêng. Không quản lý đội xe; mỗi lần bàn giao ghi biển số xe trực tiếp nếu có phương tiện. | [B08A](docs/03_thiet_ke/DB_Rebuild_Review/08A_Khach_hang.md), [B08B](docs/03_thiet_ke/DB_Rebuild_Review/08B_Nha_cung_cap.md), [bàn giao H11](docs/03_thiet_ke/DB_Rebuild_Review/17_Duyet_phieu_xuat_nhan_va_ban_giao_chuyen_kho.md) |
| RR và PO | Một RR tối đa một PO, một PO thuộc một RR, một NCC, một kho. PO nhiều lần nhận. Accountant lập và cùng Owner xem giá mua/tổng tiền. | [H01/H02](docs/03_thiet_ke/DB_Rebuild_Review/13_Duyet_yeu_cau_bo_sung_va_don_mua.md) |
| Giá bán/hóa đơn | SO lưu giá bán, quy đổi và giá lịch sử. Accountant lập hóa đơn cuối theo SO, mỗi SO tối đa một bản đang hiệu lực. Ghi từng phiếu/ngày xuất và lượng xuất, tính tiền theo lượng khách nhận. 100 xuất/98 nhận thì hiển thị 100 và tính 98. | [H12](docs/03_thiet_ke/DB_Rebuild_Review/18_Duyet_don_ban_yeu_cau_xuat_va_lenh_giao.md), [H37](docs/03_thiet_ke/DB_Rebuild_Review/19_Duyet_xuat_ban_giao_nhan_va_hoa_don.md) |
| Tiền và nguồn ngoài | Sales xác nhận nhận đủ tiền bên ngoài theo H17. WMSD không tích hợp trực tiếp MISA hoặc thực hiện thu/chuyển tiền, công nợ. Chưa suy ra cơ chế xác minh nguồn D07/D08 từ khả năng tạo SO. | [H17](docs/03_thiet_ke/DB_Rebuild_Review/20_Duyet_xac_nhan_tien_ngoai.md), [D07/D08](docs/03_thiet_ke/DB_Rebuild_Review/33_Duyet_lich_su_quyet_dinh_va_tep_dinh_kem.md) |
| Cách lưu | Collection riêng cho từng nghiệp vụ. Dòng hàng có `_id` ổn định trong `items[]`. Liên kết chứng từ/dòng đặt ở đúng nguồn xử lý. Bàn giao nằm trong phiếu xuất. | [D01](docs/03_thiet_ke/DB_Rebuild_Review/31_Duyet_cach_to_chuc_ho_so_nghiep_vu.md), [D02–D04](docs/03_thiet_ke/DB_Rebuild_Review/32_Duyet_dong_hang_va_lien_ket_chung_tu.md) |

Không tạo general policy editor. Danh mục quyền được định nghĩa bởi chức năng phần mềm, không cho Admin nhập tùy ý mã thao tác mới. Khi thêm quyền cho tính năng mới, cập nhật catalogue, mặc định role và đặc tả quyền trong cùng thay đổi.

## 4. Chuỗi nghiệp vụ và hiệu ứng tồn

| Luồng | Chuỗi và mốc xác nhận |
|---|---|
| BF01 mua/nhập | RR → duyệt → kế toán chốt với NCC → lập và phát hành PO → hàng đến → kiểm nhận → nhập sở hữu → xếp hàng. Sửa nội dung khi PO còn nháp. Khi `OPEN`/`PARTIAL`, đổi ngày dự kiến chung cho phần chưa nhận bằng lệnh có lý do. Theo dõi các lần nhận qua phiếu kiểm và phiếu nhập. Ngừng chờ phần chưa nhận qua quy trình duyệt đóng. Hàng giữ hộ ghi chủ riêng. Nhận sở hữu hàng đã giữ hộ chuyển đúng chủ, không nhận vật lý lần hai. |
| BF02 hàng lỗi | Phát hiện/chặn đúng lượng → đề xuất → duyệt cách xử lý → thực hiện. Chặn giữ nguyên tổng. Hủy thực tế mới giảm. Trả NCC đi BF08. |
| BF03 chuyển ô | Create TO → Confirm TO. Người tạo sửa/hủy trước confirm và tự confirm. Mỗi TO xác nhận trọn lệnh một lần. Chuyển hai ô cùng kho giữ tổng, lô, chủ và liên kết giữ hàng. |
| BF04 liên kho | TR → Owner duyệt/từ chối có lý do → phiếu xuất theo TR → yêu cầu lấy hàng sinh TO → confirm PICK đồng thời xuất đi → nhận tại kho đích → yêu cầu xếp hàng sinh TO → confirm PUTAWAY → đóng TR đủ điều kiện. |
| BF04 số đợt | Một TR nhiều phiếu xuất, mỗi phiếu xuất nhiều phiếu nhận. Phiếu mở giữ hạn mức. Tổng trong lượng duyệt/đã xuất. Người nhận khác người xuất. Hàng lỗi vào QUARANTINE trong kho nhận. Nhận thực tế giảm transit, PUTAWAY chỉ chuyển vị trí. |
| BF05 kiểm kê | Owner lập đợt → Warehouse kích hoạt khóa ô + snapshot → đếm/đếm lại giữ lịch sử → phương án → Owner duyệt → Warehouse ghi thực hiện → Owner chốt transaction và mở khóa. Tách thiếu/thừa khỏi đổi chất lượng/vị trí. |
| BF06 bán/giao | SO → WIR → lệnh giao giữ hàng → phiếu xuất/soạn → bàn giao thực xuất → xác nhận khách nhận → hóa đơn cuối khi đủ điều kiện H37. Hoàn thành SO chờ Sales xác nhận đủ tiền ngoài theo H17. |
| BF07 khách trả/giao thất bại | Khách đã nhận rồi trả dùng CR + kiểm + quyết định. Sales xử lý ca thường, Owner xử lý ngoại lệ đủ căn cứ. Hàng lỗi NSX chỉ nhận sở hữu khi Owner duyệt vào khu lỗi. Giao thất bại dùng phiếu về kho riêng, chỉ lượng thực về mới tái mở nhu cầu giao bù. |
| BF08 trả NCC | Warehouse đề nghị → Accountant xác minh thỏa thuận → Warehouse xuất thực tế → Accountant ghi NCC nhận/đối chiếu/đóng. Không thêm Owner duyệt bắt buộc cho luồng này. |

Đọc phiếu H06–H11, H18–H36 và C01–C08 trong [bộ duyệt](docs/03_thiet_ke/DB_Rebuild_Review/01_Danh_muc_duyet.md) trước sửa nhóm tương ứng.

## 5. Quy tắc dữ liệu dùng chung

- V5 đã [rà trường trên 58 bảng](docs/03_thiet_ke/DB_Rebuild_Review/38_Ra_soat_truong_58_bang.md). Đầu phiếu dùng một `version`, bỏ `revision` trùng. Các `approvedRevision`, `subjectRevision`, `scopeVersion`, phiên bản giá và nguồn giữ nguyên vai trò lịch sử. `status` không thay phép kiểm sửa đồng thời. Danh mục products/warehouses/customers/suppliers bỏ version, khi port API phải kiểm updatedAt của dữ liệu vừa đọc. Các FK đã được bảng cha xác định không lưu lặp trong phần nhúng.

- Số lượng/tiền dùng Decimal128 và helper decimal, API trả decimal string. Giữ nguyên hệ số, giá và quy cách đã ghi trên chứng từ cũ.
- Tồn theo điểm giữ hàng + lô + chất lượng + chủ. Hàng transit, hàng giữ hộ, hàng đã giữ cho nhu cầu được theo dõi riêng. Hàng chưa nhận không tính available.
- Xác nhận tồn phải nguyên tử với balance, transaction, movement, chứng từ, hạn mức/giữ hàng, audit và outbox. Cùng request key/payload trả lại kết quả cũ, key khác nội dung phải báo xung đột.
- Kiểm active user, permission hiện tại, warehouseIds, nguồn, creator/approver/receiver, trạng thái, revision, freeze, số lượng còn lại và sức chứa ngay khi ghi. UI không thay kiểm quyền BE.
- Chứng từ đã ghi tồn, snapshot, kết quả đếm và lịch sử duyệt giữ dấu vết. Sửa sai dùng phiếu đảo/điều chỉnh có nguồn và kiểm phụ thuộc.
- Tệp/bằng chứng theo quyền phiếu và kho. Không lộ giá mua, giá bán hoặc chứng cứ nội bộ qua DTO, export hay audit ngoài quyền.
- Email/notification qua outbox sau commit. Lỗi gửi thư chỉ thử gửi lại.

## 6. Kiểm chứng và giới hạn hiện tại

Mốc BF03/BF04 07/11: đã kiểm 5/5 native integration trên localhost replica test,
gồm full BF03/replay, BF04/custom role và ca nhận toàn hàng hỏng. BF04 options
trả danh mục kho đích nhưng chỉ trả tồn/vị trí kho được phân công; một nguồn chỉ
sinh một ITR, mỗi ITR một TO. Chi tiết tại [BF03](docs/08_api/location-movements/README.md)
và [BF04](docs/08_api/transfers/BF04_API.md). FE build và 3 test presentation BF03
đạt; chưa kiểm toàn luồng qua trình duyệt.

Các API đang gắn router dùng registry mới. Ba kiểm thử tích hợp trên MongoDB replica set thử riêng đã qua: RR–PO–kiểm–nhập–xếp từng phần, đảo nhập với người duyệt độc lập, và chuyển kho đủ các bước. FE đã build nhưng toàn bộ kiểm thử giao diện còn lỗi do hợp đồng/kỳ vọng cũ; chưa xác nhận toàn project hoàn tất. D07/D08 vẫn chờ xác minh. Không tự ghi dữ liệu remote.

## 7. Quy trình làm việc của nhóm

Đọc [quy tắc tài liệu](DOCUMENTATION_RULES.md). Mỗi thay đổi code có ảnh hưởng model, API, quyền, nghiệp vụ, seed, cấu hình hoặc cách chạy phải sửa tài liệu hiện hành trong cùng lượt. Ghi quyết định chưa duyệt ở phần mở, không ghi thành đã chốt. Không đổi toàn bộ mã UC chỉ để khớp model đang làm.

## Gộp bảng lần hai

[Gộp thêm 5 bảng](docs/03_thiet_ke/DB_Rebuild_Review/37_Gop_them_5_bang.md). Biến động nằm trong giao dịch tồn; chặn và phương án lỗi trong hồ sơ lỗi; phương án kiểm kê trong đợt; khách nhận trong SO. Các lần phát sinh và quyền vẫn giữ.

## 8. Mốc triển khai DB ngày 06/11/2026

Atlas `wmsd_database` đã nhận dữ liệu chỉ còn gạch từ local `wmsd_demo_tile_shop_v7`: 59 collection/633 bản ghi. Giữ nguyên v6 để truy vết, không ghi đè dữ liệu đã có. Việc tải DB không đồng nghĩa các API đã port; kết nối ứng dụng chưa đổi. [Quy trình và kết quả](docs/09_phat_trien/ATLAS_DEPLOYMENT.md).

## 9. Category v8 và kiểm thư mục

Người dùng duyệt 5 nhóm sau tham khảo Gạch Tốt. Mỗi product có một categoryId bắt buộc; Category 1–n Product. Hãng/kích thước/màu giữ riêng. Không đổi nghiệp vụ tồn. Mốc hiện hành là local v8 và Atlas wmsd_database, 59 collection/638 bản ghi. Tại lúc thực hiện local v7 và Atlas đều trống, nên đã tạo lại mẫu; không coi các DB cũ là hiện còn trên máy. Đây là mốc trước yêu cầu đồng bộ runtime. Quyết định mới hơn ngày 06/11 đã cho phép bỏ cả ba thư mục model và các phụ thuộc được rà; xem hợp đồng runtime ở mục 1. [Chi tiết và nguồn duyệt](docs/03_thiet_ke/DB_Rebuild_Review/40_Category_va_don_model.md), [triển khai](docs/09_phat_trien/CATEGORIES_V8.md).

## Historical return-source decision — 7 November 2026

The user confirmed Accountant verification with uploaded evidence for historical customer-delivery sources. This scope is implemented in [the native return contract](docs/08_api/RETURN_WORKFLOWS_NATIVE.md). It does not settle broader new-SO external-source gates. Trungph return workflows now use the native registry; local automated verification and rollout limits are recorded in that contract and the PR evidence. No Atlas data or connection change.

## Cảnh báo bổ sung hàng — 11/11/2026

[Hợp đồng RR](docs/08_api/REPLENISHMENT_COVERAGE.md) quy định cảnh báo RR đang mở, PO chưa nhận đủ và tồn khả dụng. Người lập quyết định lượng, xác nhận và giải trình khi có cảnh báo. SO/WIR và kiểm kê là tham chiếu truy vết. Lý do từng dòng tùy chọn. Người duyệt độc lập xét lượng, còn PO dựa trên lượng RR đã duyệt.
