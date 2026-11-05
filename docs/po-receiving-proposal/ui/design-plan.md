# Kế hoạch thiết kế UI nhận hàng mua theo PO

> Bản v1 giữ làm tham chiếu. Kế hoạch phát triển mới và giải pháp cho các giới hạn hiện tại nằm ở [Plan v2](design-plan-v2.md), dựa trên [rà soát source/test ngày03/11/2026](../gap-analysis-current-2026-11-03.md). Phần custody resolution/GR bổ sung, hủy/sửa sai và put-away partial trong v2 là đề xuất mới, chưa phải runtime.

Ngày: 03/11/2026 · Trạng thái: **Đề xuất thiết kế để review, chưa triển khai UI**.

Phạm vi: nhận hàng từ NCC theo PO, từ tiếp nhận đến GR và thiết kế tiếp nối put-away. Không áp dụng tự động cho hàng khách trả, giao thất bại hoặc điều chuyển liên kho. Tài liệu không thay đổi catalogue UC, business rule hoặc quyền hiện hành.

Tài liệu đi cùng: [Luồng và trạng thái](user-flow.md), [Wireframe](wireframe-ascii.md).

## 1. Hướng thiết kế đề xuất

**PO detail là màn trung tâm theo dõi; mỗi đợt nhận là một không gian thao tác riêng có stepper bốn bước.**

```text
Danh sách PO → Chi tiết PO → Chọn/tạo đợt nhận
                              1. Tiếp nhận
                              2. Kiểm hàng & lô
                              3. Ghi nhận nhập kho (GR)
                              4. Xếp kho (put-away)
```

Một PO có nhiều đợt nhận. Không dùng một stepper duy nhất cho cả PO vì đợt trước có thể đang xếp kho trong khi đợt sau đang kiểm hàng. Stepper hiển thị tiến độ của đợt đang mở; trạng thái PO, GR và nhiệm vụ xếp kho được hiển thị riêng.

Bước 1–2 cùng soạn một PO_INSPECTION DRAFT. Chuyển từ bước 1 sang bước 2 chỉ đổi phần form đang xem; **không có command check-in/ARRIVAL riêng** trong contract mua mới. Chốt kiểm ở cuối bước 2 mới ghi custody NCC và tạo GR nháp nếu có lượng ACCEPT. Bước 3 post GR riêng. Bước 4 là phần thiết kế tiếp nối, cần contract put-away trước khi tích hợp thật.

## 2. Điều chỉnh so với nội dung tham khảo được gửi

| Ý trong bản gửi | Áp dụng cho WMSD |
|---|---|
| Stepper cho trình tự, Tabs cho nhóm dữ liệu | Giữ; stepper theo từng đợt nhận. Cho quay về xem bước cũ, chỉ sửa facts khi inspection còn DRAFT. |
| Gán lô và xếp kho ở cùng bước | Đưa lô/tone/calibre lên bước kiểm hàng. Cần lotId thật trước khi lưu dòng kiểm và chốt; không đợi đến xếp kho. |
| Hoàn tất ở bước cuối mới tăng tồn | GR ở bước 3 tăng tồn STORE. Put-away ở bước 4 bảo toàn tổng tồn, thay đổi vị trí và điều kiện khả dụng. |
| Hàng đạt và hàng lỗi | Tách ba chiều: chất lượng, quyết định nhận sở hữu, tình trạng bao bì. Bao bì rách không tự đồng nghĩa gạch hỏng. |
| Nhận một phần | Nhận qua nhiều đợt của cùng PO. Mỗi đợt tối đa một GR, bao phủ toàn bộ lượng ACCEPT đã chốt; không chọn post một phần GR đó. |
| Thêm hàng ngoài PO, nhận dư | Chưa có command nhận ngoài PO. Chỉ chọn dòng PO; lượng dư cùng mặt hàng có thể ghi PENDING/REJECT, lượng ACCEPT bị chặn theo phần chưa nhận/chưa cam kết. |
| Date/hạn sử dụng | WMSD bán gạch: ưu tiên mã lô nhà sản xuất, tone, calibre thực tế. Không thêm HSD bắt buộc vào MVP. |
| Quét mã tự cộng một đơn vị | Để sau, cần xác minh mã và đơn vị đóng gói; không tự cộng +1 thùng/viên từ mã chưa định nghĩa. |
| Offline và tự lưu | MVP có lưu nháp server và giữ input khi lỗi; không hứa xác nhận offline. Tự lưu là cải tiến sau, chỉ gửi payload hợp lệ. |
| Công nợ/thanh toán NCC | Ngoài phạm vi sản phẩm. Hồ sơ chỉ phục vụ nguồn PO, kiểm hàng, GR và bằng chứng đúng quyền. |

Các mô tả về Odoo/SAP/NetSuite/Sapo trong bản gửi là ý tưởng tham khảo do người dùng cung cấp, chưa được xác minh như đặc tả sản phẩm. Thiết kế này dựa vào contract WMSD hiện tại.

## 3. Kiến trúc màn hình

### 3.1 Danh sách PO — điểm vào hiện có

- Giữ tìm PO, NCC, kho và tình trạng còn phải nhận; dịch trạng thái sang tiếng Việt.
- Trên PO đủ điều kiện và Warehouse có quyền: thao tác “Tiếp nhận hàng” mở form đợt mới. PO chỉ cho nhận khi OPEN/PARTIAL, thuộc kho được giao và nguồn đủ căn cứ; BE kiểm lại khi ghi.
- PO đã nhận đủ vẫn mở để xem GR và việc xếp kho còn lại. Không dùng trạng thái PO COMPLETED để khóa việc xếp kho của GR đã post.
- Không hứa badge tổng số việc chờ từ API list hiện tại: list inspection/GR chưa có thống kê tác nghiệp. Chỉ hiện số lượng đã tải có nhãn rõ hoặc bổ sung API thống kê ở giai đoạn sau.

### 3.2 Chi tiết PO — màn trung tâm

Header: mã PO, NCC, kho nhận, ngày dự kiến giao, trạng thái PO; CTA “Tiếp nhận đợt mới” theo quyền/điều kiện.

Tabs cố định:

1. **Tổng quan**: dòng PO, lượng đặt, đã nhận vào sở hữu, còn phải nhận. Null hiển thị “Chưa đủ căn cứ”, không đổi thành 0.
2. **Đợt nhận**: danh sách inspection và GR liên quan; mỗi dòng có thời điểm đến, người giao, kết quả kiểm, trạng thái GR, CTA “Tiếp tục kiểm”/“Xem GR”/“Xem đợt nhận”. Tiến độ xếp kho bổ sung khi có nguồn dữ liệu thật.
3. **Hồ sơ**: tham chiếu chứng từ và các mốc đã có dữ liệu. Upload/download và nhật ký audit đầy đủ chỉ bật khi đã xác minh endpoint/quyền.

Không cộng chung số thùng của các SKU có quy cách khác nhau, hoặc cộng thùng với viên/m² vào một KPI. Tổng hợp theo SKU/UOM; phần đầu có thể dùng số dòng hàng và số đợt nhận.

### 3.3 Chi tiết đợt nhận — trang thao tác chính

Route đề xuất: `/purchase-orders/:poId/receiving/new` và `/purchase-orders/:poId/receiving/:inspectionId`. Route là kế hoạch FE, không phải API đã có. Trang tự tải được khi mở link hoặc refresh; kiểm inspection thuộc đúng PO.

- Breadcrumb về PO và danh sách đợt; header gọn ghi PO/NCC/kho/mã kiểm.
- Stepper luôn nhìn thấy trong phần đầu trang; trạng thái bước suy từ chứng từ thật.
- Thân trang thay theo bước; chỉ bước có nhiều nhóm dữ liệu mới dùng Tabs, tối đa ba tab ở cùng một hàng.
- Bằng chứng/nguồn mở bằng drawer từ header; không chồng hai tầng Tabs của PO và đợt nhận.
- Footer cố định có trạng thái lưu, “Lưu nháp” khi còn sửa được và một CTA chính theo bước.
- “Đóng trang” rời màn hình; không có nút “Hủy phiếu” khi BE chưa có command hủy inspection/GR của luồng mới.

### 3.4 Danh sách và chi tiết GR

Giữ `/receipts` và `/receipts/:id` làm điểm tra cứu chứng từ. GR mua mới mở đúng bản GR đã sinh từ inspection; liên kết về đợt nhận tương ứng. Nội dung bước 3 dùng chung với chi tiết GR, không tạo hai form nghiệp vụ khác nhau.

Danh sách hiện đang dùng demo; tích hợp mua mới phải phân biệt GR_PURCHASE với receipt CR/FD hoặc legacy. Không đổi ID hay ép toàn bộ receipt cũ đi qua PO_INSPECTION. Record không hỗ trợ thì mở màn đọc phù hợp, không đưa vào lệnh post mua mới.

## 4. Thiết kế bốn bước

| Bước | Nội dung | CTA chính | Khi nào được tiếp tục |
|---|---|---|---|
| 1. Tiếp nhận | PO/NCC/kho chỉ đọc; thời điểm đến, số phiếu giao, tên và liên hệ người giao | Tiếp tục kiểm hàng | Header hợp lệ; thời điểm đến không ở tương lai. Không tự sinh chứng từ chỉ vì mở form. |
| 2. Kiểm hàng & lô | Bảng PO, phân dòng thực giao theo lô/chất lượng/quyết định/bao bì, vị trí custody và đích GR | Chốt kiểm hàng | Đã lưu draft mới nhất; có ít nhất một phần lượng dương; đủ dữ liệu và không vượt cap ACCEPT. |
| 3. Ghi nhận nhập kho | Xem lại toàn bộ phần ACCEPT; PO/inspection nguồn, lô, UOM, lượng, chất lượng, vị trí nhận và phần còn thuộc NCC | Ghi nhận nhập kho | Inspection CONFIRMED, GR DRAFT, đúng quyền/version/nguồn, không bị khóa. |
| 4. Xếp kho | Phần GOOD chờ cất, vị trí nguồn/đích, lượng dự kiến/thực cất, các nhiệm vụ còn mở | Tạo nhiệm vụ / Xác nhận thực xếp | GR POSTED; contract put-away hỗ trợ nguồn/lượng/vị trí/version thực. |

### Bước 1 — Tiếp nhận

- Chỉ thời điểm đến là trường bắt buộc trong nhóm thông tin giao hàng hiện tại. Số phiếu giao, tên/liên hệ người giao có nhãn tùy chọn.
- Không thêm biển số xe, tài xế, nhiệt độ xe, pallet như dữ liệu đã được BE lưu; chỉ mở rộng khi có yêu cầu và contract.
- “Lưu nháp” có thể tạo inspection rỗng về dòng; không tăng tồn. Sau tạo dùng ID thật, giữ nguyên thời điểm đến khi retry.
- Nên hiển thị nháp đang có của PO để người dùng chọn tiếp tục; không cấm nhiều nháp vì có thể là nhiều chuyến thật.

### Bước 2 — Kiểm hàng & lô

Tabs: **Kiểm hàng** và **Chờ xử lý / Không nhận**. Tab thứ hai là góc nhìn lọc trên cùng dữ liệu dòng, không phải danh sách nhập riêng. Chứng từ/ảnh qua drawer khi có API.

Bảng chính nhóm theo dòng PO: mặt hàng/SKU; UOM theo snapshot PO; đã đặt/đã nhập/còn phải nhận; thực giao đợt này; nhận sở hữu; chờ; không nhận; trạng thái dữ liệu. Mở rộng một dòng để chỉnh các phần lượng. SKU không giao đợt này có thể để trống; không tạo dòng qty=0 gửi BE.

Mỗi phần lượng gồm:

- Lô chọn theo productId: mã nhà sản xuất, tone, calibre, trạng thái VERIFIED/UNKNOWN. Tạo lô trong drawer bằng API thật nếu Warehouse có quyền; sau lưu nhận lotId thật. Lô UNKNOWN có cảnh báo chưa đủ điều kiện khả dụng; không tự đánh VERIFIED.
- Số lượng dương theo UOM và conversionSnapshot của dòng PO. Hiện lượng quy đổi viên, không cho tự thay hệ số bằng quy cách hiện hành.
- **Chất lượng**: Tốt / Hư hỏng / Chưa xác định / Bị chặn, map GOOD/DAMAGED/PENDING/BLOCKED.
- **Hướng nhận**: Nhận vào sở hữu / Chờ xử lý / Không nhận, map ACCEPT/PENDING/REJECT. Chấp nhận sở hữu và chất lượng là hai cột độc lập.
- **Bao bì**: Nguyên niêm / Đã mở / Rách / Chưa rõ. Không tự đổi chất lượng khi đổi bao bì.
- **Còn giữ tại kho**: ACCEPT và PENDING phải có; REJECT cho chọn “Giữ tại kho” hoặc “Đã giao trả ngay”. Mọi phần giữ tại kho phải chọn vị trí CUSTODY cùng kho.
- **Ghi chú xử lý**: bắt buộc cho PENDING/REJECT; một ghi chú không thực hiện trả NCC, hủy hoặc đổi phẩm cấp.
- **Vị trí sau GR**: riêng phần ACCEPT, GOOD chọn RECEIVING; quality khác chọn QUARANTINE. Chọn trước chốt kiểm vì GR được tạo ngay lúc confirm.

Đích GR được giữ trong form FE cho đến confirm; API PUT inspection không lưu bản đồ receivingLocations. Mất bản đồ sau refresh thì chọn lại, không hiển thị “Đã lưu” cho phần này. Sau PUT, phải đọc lại inspection để lấy line ID mới: backend thay dòng nháp, bản đồ confirm phải dùng ID dòng đã lưu mới nhất. Dùng client row key ổn định để giữ trạng thái nhập và ánh xạ kết quả đọc lại; không dùng index làm identity chứng từ.

Ví dụ một SKU đặt 100 thùng, chuyến này giao 80: chia 70 GOOD/ACCEPT, 5 DAMAGED/PENDING, 5 GOOD/REJECT giao trả ngay. Đã phân loại đủ 80; phần còn phải nhận của PO không tự giảm ở bước kiểm. Thiếu so PO có thể do nhận nhiều đợt, không bắt buộc gán lý do “NCC giao thiếu” khi chưa có cam kết giao đợt.

Modal chốt kiểm nêu rõ: hàng còn ở kho thuộc NCC; sẽ sinh một GR nháp cho lượng ACCEPT; facts bị khóa sau chốt. Nếu ACCEPT=0, CTA vẫn “Chốt kiểm hàng”, không gọi là tạo GR và không sinh GR0.

### Bước 3 — Xem lại và ghi nhận GR

- Chỉ đọc dòng đã chốt; không đổi lô, lượng, quality hay đích nhận trên GR. Contract hiện chưa có sửa GR draft hoặc mở lại inspection.
- CTA “Ghi nhận nhập kho” mở modal tổng hợp theo SKU/UOM và đích nhận; mô tả lượng chuyển NCC → cửa hàng và lượng vẫn thuộc NCC.
- Sau thành công tải lại GR, inspection, PO và danh sách liên quan. Hiện “Đã ghi nhận nhập kho” và “Chờ xếp kho” riêng cho GOOD; hàng quality khác hiện “Đã nhập khu cách ly”. Không hiện “Đã sẵn sàng bán” chỉ vì post.
- Có thể rời trang và xếp kho sau. Không bắt buộc cất hàng ngay để hoàn tất GR.
- Nếu phát hiện nhập sai sau chốt: hiển thị giới hạn “Kết quả kiểm đã chốt; hiện chưa hỗ trợ sửa hoặc đảo tại màn này”. Không tạo lệnh sửa giả, không tạo inspection mới để nhận lại cùng hàng custody.

### Bước 4 — Xếp kho, thiết kế giai đoạn tiếp theo

- Tách “Tạo nhiệm vụ xếp kho” với “Xác nhận thực xếp”. Tạo kế hoạch không làm hàng đã cất.
- Chọn dòng GOOD của GR POSTED còn lượng chưa cất/chưa được task khác giữ. Giữ nguyên lot/quality/owner/kho nguồn.
- Cho tách 60 viên vào A-01, 40 viên vào A-02 nếu nguồn còn đủ. Dòng task có lượng kế hoạch, đã xác nhận thực cất, còn lại; vị trí thực tế phải được xác nhận.
- Có thể xác nhận một phần; phần chưa cất tiếp tục mở. Chỉ hoàn tất khi phần cần cất đã có kết quả thực hiện hợp lệ.
- Hàng STORE ở QUARANTINE có khối theo dõi cách ly riêng; không có CTA “Đưa lên kệ bán” trong luồng này. Hàng NCC custody không là nguồn put-away STORE.
- Endpoint location-movements hiện tại tạo taskKind=RELOCATE, không phải bằng chứng đã hỗ trợ PUTAWAY từ GR. Không dùng nó để giả lập thiếu contract.
- Trong MVP, bước 4 chỉ phản ánh mốc đã nhập và phần chờ xếp có căn cứ. Nếu chưa có dữ liệu task, ghi “Chưa có dữ liệu tiến độ xếp kho”; không hiện 0% hay Đã xếp. Ẩn CTA ghi put-away cho đến khi có contract thật.

## 5. Trạng thái và quyền

| Tình huống | Hiển thị và thao tác |
|---|---|
| Form chưa lưu | “Chưa lưu”; cảnh báo khi rời trang có thay đổi. |
| Inspection DRAFT | “Đang kiểm hàng”; sửa và lưu, chưa có hiệu ứng tồn. Header-only có thể ghi “Đã lưu nháp tiếp nhận”. |
| Inspection CONFIRMED, GR DRAFT | “Đã chốt kiểm · Chờ ghi nhận nhập kho”; khóa facts; có thể sửa handling note đúng quyền. |
| Inspection CONFIRMED, không có GR | “Đã chốt kiểm · Không có lượng nhận sở hữu”; bước GR/xếp kho không áp dụng, custody còn chờ xử lý vẫn có cảnh báo riêng. |
| GR POSTED | “Đã nhập kho”; đọc chứng từ; xếp kho là tiến độ khác. |
| PO PARTIAL/COMPLETED | “Nhận một phần”/“Đã nhận đủ theo PO”; không suy ra đã cất hết hoặc đã giải quyết mọi hàng NCC còn giữ. |

Warehouse có quyền create/update/post tại kho được giao. Owner xem mọi kho, Accountant/Warehouse xem trong scope theo API; Owner/Accountant không có nút chốt kiểm hoặc post. Sales/Admin không được cấp quyền nhận mua từ màn này. Read-only không gọi inspection-context, vì endpoint đó yêu cầu create; dùng GET inspection/GR/PO có read scope.

Quyền put-away được kiểm riêng (`putaway_task:*`); Accountant không mặc nhiên được mở task chi tiết. UI là kiểm soát thao tác, BE quyết định quyền cuối cùng. Không dùng admin bypass của helper demo cho action nghiệp vụ.

## 6. Khả năng API và phần còn thiếu

Prefix API hiện tại: `/api`. Tên trường/ID thực lấy từ routes và service; không dựa vào model UI demo.

| Nhu cầu UI | Nguồn hiện có / giới hạn |
|---|---|
| PO, lượng đã nhập/còn nhận | GET `/purchase-orders`, `/purchase-orders/:id`. Quantity null giữ nguyên ý nghĩa chưa đủ căn cứ. |
| Context nhập | GET `/purchase-orders/:id/inspection-context`: PO, lines raw, computed quantities, active custody/receiving/quarantine locations. Chỉ Warehouse/create. |
| Nháp kiểm | POST `/purchase-orders/:id/inspections`; PUT `/po-inspections/:id`; GET `/po-inspections/:id`. |
| Chốt kiểm | POST `/po-inspections/:id/confirm`, receivingLocations theo ID dòng inspection đã lưu. |
| Đợt nhận theo PO | GET `/po-inspections?purchaseOrderId=...`; phân trang. List là header, không có tổng lượng từng đợt. |
| GR và post | GET `/purchase-receipts`, `/purchase-receipts/:id`; POST `/purchase-receipts/:id/post`. Không có edit/cancel GR mới. |
| Ghi chú sau chốt | PATCH `/po-inspections/:id/handling-note`, có version/audit; không thay facts. |
| Lô | API lots hiện có cho Owner/Warehouse. Không để Accountant gọi lots rồi lỗi cả trang đọc GR; cần snapshot/enrichment được phép hoặc hiển thị ID và thông báo phần dữ liệu chưa cung cấp. |
| Nhãn SKU/UOM/location/người dùng | Reader inspection/GR trả document/line raw, chưa có toàn bộ tên hiển thị. Tận dụng snapshot/PO preview theo quyền; cần contract read enrichment cho nhãn còn thiếu, không dựng tên giả. |
| Cap ACCEPT sau GR nháp khác | Confirm đã trừ cam kết GR DRAFT ở BE; context chưa trả cap sau cam kết. MVP báo giới hạn và xử lý409; muốn hiện số “Còn được chấp nhận” chính xác cần thêm field read ở BE. Không đồng nhất nó với outstanding PO. |
| Bằng chứng và audit đầy đủ | Chưa nằm trong contract receiving đã đọc; cần xác minh/tích hợp API trước khi bật upload, download, audit timeline đầy đủ. Mốc document hiện có vẫn hiển thị được. |
| Giải quyết PENDING/REJECT, hủy/đảo | Chưa có command trong gói nhận mua. Chỉ theo dõi/note; không có nút “Nhận tiếp hàng chờ” hay “Đã trả NCC” làm thay đổi custody. |
| PUTAWAY, lượng chờ cất và queue toàn kho | Chưa có trong module nhận mua; cần đặc tả và xác minh runtime riêng trước giai đoạn 2. |

## 7. Trình tự thực hiện

| Gói | Công việc | Kết quả để review |
|---|---|---|
| A. Chốt luồng và wireframe | Review PO nhiều đợt, phân lượng kiểm, chốt custody, GR riêng, put-away riêng; chọn nhãn CTA | Ba tài liệu UI này và ví dụ xuyên suốt. |
| B. Chốt dữ liệu hiển thị | Ghi DTO thật; kiểm snapshot/nhãn cho từng role, line ID sau save, đích GR chưa được lưu; chốt enrichment tối thiểu nếu thiếu | Bảng field–API và hợp đồng đọc không vượt scope. Đây là điều kiện trước khi hứa UI đầy đủ tên/mã. |
| C. Nối UI nhận mua MVP | Mở rộng PO detail; form tiếp nhận/kiểm, split theo lot/quality/disposition, lưu/chốt; GR review/post; read-only | Nhận mua thật đến RECEIVING/QUARANTINE, nhiều chuyến; không fallback demo. |
| D. Hoàn thiện độ tin cậy | Version conflict, retry cùng key/payload, lỗi trường, freeze/hold, refresh/deep link, mobile, lịch sử thực có | Review cùng dữ liệu thật và kiểm flow ownership. |
| E. Xếp kho | Contract PUTAWAY từ GR; task cap/concurrency, partial/split, actual confirm, số dư chưa cất, scope | Xếp kho thật, tổng STORE không tăng lần hai. |
| F. Tối ưu sau | Server autosave payload hợp lệ, barcode đã có mapping/UOM, hàng đợi có API tổng hợp, evidence đầy đủ | Chỉ thêm theo contract đã xác minh; không mở rộng offline app/công nợ. |

Chưa sửa code trong lượt lập plan. Trước triển khai code phải kiểm lại Git và tích hợp main theo AGENTS.md; hai repo hiện có thay đổi dở dang nên không tự stash/discard/pull chồng lên. Không commit hoặc push khi chưa được yêu cầu.

## 8. Tiêu chí review và kiểm chứng khi triển khai

1. Một PO nhận nhiều chuyến; mở lại đúng nháp/đợt từ URL, không ghi nhận trùng khi refresh.
2. Kiểm xong 80, ACCEPT70, PENDING5, REJECT5 trả ngay: confirm ghi NCC custody75/STORE0; post GR chuyển70 sang STORE, NCC còn5; không có hàng khả dụng mới khi còn ở receiving.
3. Không ACCEPT: confirm có hồ sơ kiểm, có custody nếu giữ hàng, không GR0; không yêu cầu người dùng “Hoàn tất GR”.
4. Tách lot/quality/bao bì đúng, lot không thuộc product bị chặn; quality DAMAGED/ACCEPT vào QUARANTINE, không thành hàng bán.
5. Hai chuyến cùng PO/GR nháp giữ cap: BE chặn overcommit; FE giữ input và tải nguồn để review, không âm thầm cắt lượng.
6. Save thay ID dòng: confirm nhận đúng line IDs mới và đúng đích receiving/quarantine; refresh không giả đã lưu đích.
7. Timeout confirm/post: retry cùng key/payload trả cùng kết quả; không tăng custody/STORE lần hai. Kết quả replay không thay thế việc tải trạng thái mới nhất.
8. Read-only đúng role/kho, deep link ngoài scope không lộ hồ sơ; Accountant không phụ thuộc endpoint create hoặc lots không có quyền.
9. Freeze/hold,409 và mất mạng giữ nội dung chưa gửi; chưa có thành công từ server thì không hiển thị đã chốt/đã nhập.
10. Giai đoạn xếp kho: tạo task chưa chuyển hàng; confirm một phần/split không vượt nguồn; tổng STORE bảo toàn; availability vẫn kiểm lot/quality/hold/freeze/vị trí/reservation.

Đây là tiêu chí nghiệm thu tương lai, chưa phải kết quả chạy test. Lượt này chỉ đối chiếu tài liệu/source và kiểm liên kết tài liệu.

## 9. Nguồn đối chiếu hiện tại

- [Contract nhận mua](../IMPLEMENTATION.md), [routes](../../../src/modules/po-receiving/po-receiving.routes.js), [service](../../../src/modules/po-receiving/po-receiving.service.js).
- [Context FE](../../../../fe/context.md), [PO detail hiện có](../../../../fe/src/features/purchase-orders/detail/PurchaseOrderDetailPage.tsx), [PO API](../../../../fe/src/features/purchase-orders/api/purchaseOrdersApi.ts).
- [Receipt detail hiện có](../../../../fe/src/features/receipts/detail/ReceiptDetailPage.tsx), hook demo useReceiptDetail.ts (đã xóa theo quyết định bỏ luồng cũ ngày03/11/2026).
- [Quy trình VI, BF-01 và BR-07/08/30](../../../git_doc/docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md). Quyết định PO_INSPECTION ngày02/11 ở contract thay phần ARRIVAL mua mới trong tài liệu lịch sử.
- [Location-movement service](../../../src/modules/location-movements/location-movement.service.js): taskKind RELOCATE; không dùng như API put-away.
