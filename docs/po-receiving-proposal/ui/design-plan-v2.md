> **BE đã được điều chỉnh theo quyết định 03/11/2026:** chỉ lượng đồng ý nhập; không triển khai hàng lỗi/sai SKU/unknown/custody resolution. Warehouse tự đảo toàn GR khi đủ guard/chứng cứ, không Owner approval cho reversal. Bổ sung nền tảng PO từ RR và put-away. Contract BE hiện hành ở ../BACKEND_V3.md; trạng thái từng gap/kiểm chứng ở ../VERIFICATION_V3.md. Phần còn lại của file này là thiết kế v2 gốc để truy vết, không dùng để khôi phục custody mua hoặc luồng ARRIVAL. UI nằm ngoài gói BE này.

# Plan v2 — nhận mua nhiều đợt và giải quyết các giới hạn hiện tại

Ngày: 03/11/2026 · **Đề xuất để review, chưa triển khai hoặc thay baseline nghiệp vụ**.

Đọc cùng [báo cáo18 giới hạn và bằng chứng](../gap-analysis-current-2026-11-03.md). Bản này thay định hướng phát triển trong [plan UI v1](design-plan.md); [user-flow](user-flow.md) và [wireframe](wireframe-ascii.md) v1 là tham chiếu bố cục, các nhánh bổ sung và thay đổi contract lấy theo v2 này. [Contract hiện có](../IMPLEMENTATION.md) vẫn mô tả runtime cho đến khi gói tương ứng được thực hiện.

## 1. Mục tiêu và ranh giới

Hoàn thiện một luồng có đường kết thúc cho cả hàng đã nhập, hàng chưa nhận sở hữu, phiếu bỏ dở và sai sót có chứng cứ:

```text
PO → nhiều đợt thực giao → kiểm + lô → custody NCC → GR → put-away STORE
                                     ├→ quyết định thêm → GR bổ sung từ custody
                                     ├→ không nhận → bàn giao trả thực tế
                                     └→ sửa sai có liên kết, không sửa đè lịch sử
```

Giữ các điểm đã có: Warehouse ghi nhận thực tế theo kho được giao; confirm khác post; không GR0; không Owner duyệt nhận mua thông thường; tồn/quantity dùng decimal và snapshot; không sửa chứng từ đã chốt để che lịch sử. Không thêm công nợ, tiền, offline post, portal NCC hoặc bắt buộc scanner.

Kết quả review source và chạy local ngày03/11:

- Chuỗi nhận40+35+25 trên cùng PO100 đã chạy thành công, không cần thiết kế lại quan hệ PO nhiều inspection.
- 18/18 kết quả Node test tập trung pass, không skip; 3 probe bổ sung pass. Chưa nghiệm thu browser, production hoặc tải.
- PUTAWAY đã có trong BF-04 nhưng nguồn bắt buộc MWTR và confirm toàn bộ. RELOCATE có actual partial nhưng không thay được provenance receipt. Cần mở rộng có adapter, không viết lại hay gọi nhầm route.

## 2. Quyết định thiết kế đề xuất

| Chủ đề | Phương án đề xuất |
|---|---|
| Đơn vị công việc | Một chuyến thực tế = một PO_INSPECTION; một PO có nhiều chuyến. Không dùng lịch giao dự kiến làm sự kiện nhập thực tế. |
| Mốc tồn | Confirm tạo custody NCC; post GR mới nhận STORE; confirm put-away chỉ chuyển vị trí. |
| Nháp | Stable line ID + clientLineKey và persist plannedReceiptLocationId; không đẩy bài toán map ID/destination cho UI lâu dài. |
| Cam kết nhận | Headroom hiển thị do BE tính, gồm GR nháp gốc/bổ sung; mọi lệnh ghi kiểm lại nguyên tử. |
| GR nháp | Facts acceptance không sửa; chỉ cho đổi đích hợp lệ hoặc hủy bằng lệnh riêng. Hủy giải phóng cap nhưng không giao trả custody. |
| Hàng chờ | Quyết định mới append-only gắn inspection line cũ. Nhận thêm từ custody tạo nguồn acceptance mới, không tạo chuyến hàng đến giả. |
| Số GR | Inspection gốc vẫn tối đa1 GR cho lần chấp nhận ban đầu; mỗi custody resolution ACCEPT mới tối đa1 GR riêng. Ở cấp đợt UI có thể thấy nhiều GR từ các quyết định khác nhau. **Đây là mở rộng so với giới hạn v1 “mỗi đợt tối đa1 GR”, cần chấp thuận khi triển khai.** |
| Put-away | Theo GR line, xác nhận partial và split vị trí; số chưa cất không suy từ tổng balance đã gộp nhiều nguồn. |
| Sửa sai | Trước post: cancel/supersede và correction có nguồn. Sau post: preflight phụ thuộc rồi linked reversal nếu đủ điều kiện, không PATCH facts. |
| Hoàn tất | Nghĩa vụ PO, tồn đã post, xếp kho và custody còn mở là các tiến độ riêng. |

## 3. Gói nền tảng: dữ liệu đọc, nháp, lỗi và quyền

### 3.1 Read DTO dùng được cho UI

Mở rộng reader đang có, không cấp quyền create cho người chỉ xem:

- `GET /purchase-orders/:id/receiving-summary` (đề xuất): PO/version, totals theo từng PO line, số đợt, việc mở và links có access status.
- `GET /purchase-orders/:id/receiving-trips` (đề xuất): phân trang inspection; mỗi item có mã/thời điểm/người giao, lượng theo SKU/UOM, trạng thái kiểm, danh sách GR gốc/bổ sung, custody mở, put-away progress và actions được phép. Không đếm tổng toàn bộ chỉ từ trang đang tải.
- `GET /po-inspections/:id` và `GET /purchase-receipts/:id`: giữ response tương thích, bổ sung hoặc version hóa DTO snapshot/labels/links. Bất kỳ link xuất/tải/command nào vẫn reauthorize ở BE.
- Hợp nhất read query theo lô thay N+1 từng đợt; pagination/count/filter cùng phạm vi kho. Không lấy tên hiện tại rồi ghi đè tên/UOM snapshot lịch sử. Master thiếu thì hiển thị snapshot hoặc “Chưa cung cấp”, không tạo tên giả.
- Accountant xem thông tin lô trong chứng từ được cấp quyền qua DTO; không cần thêm quyền xem catalogue lots hoặc tồn toàn hệ thống.

Theo mỗi PO line, dùng các tên tách bạch:

```text
authorizedOrderedQtyBase      lượng PO có hiệu lực theo phiên bản đã được phép
netPostedReceiptQtyBase       lượng nhận sở hữu ròng từ ledger GR hợp lệ
closedRemainderQtyBase        phần không giao được chốt hợp lệ (gói PO lifecycle)
openDraftCommitmentQtyBase    lượng đang giữ bởi mọi GR nháp còn hiệu lực
outstandingQtyBase           authorizedOrdered - closedRemainder - netPosted
acceptanceHeadroomQtyBase     outstanding - openDraftCommitment
```

Các số là decimal strings; tính theo base UOM và trình bày thêm UOM nhập/snapshot. Lượng custody không tự trừ nghĩa vụ PO. Giữ UNKNOWN/null nếu nguồn hỏng; số âm là lỗi nguồn cần chặn, không clamp về0 để che sai lệch. Trả `computedAt`, `poVersion` và `quantityState`.

Context của một inspection nháp không cộng lượng chưa confirm vào openDraftCommitment; có thể trả thêm `proposedAcceptedQtyBase` để so headroom. UI không tự tính quyền nhận chỉ từ “còn phải nhận”. Gói PO close chưa có thì closedRemainder vẫn0 với ý nghĩa có căn cứ, không bịa canceled quantity lịch sử.

### 3.2 Lưu nháp có identity ổn định

- Dòng draft nhận `clientLineKey` UUID và server lineId nếu đã tồn tại. Unique theo inspection+clientLineKey. Chỉ DRAFT cho upsert; không xóa toàn bộ rồi tạo ID mới sau mỗi lần lưu.
- Dòng có plannedReceiptLocationId và UOM snapshot cần hiển thị. ACCEPT/GOOD chọn RECEIVING; ACCEPT khác GOOD chọn QUARANTINE; keptOnSite có holdingLocationId CUSTODY. Kiểm warehouse/kind/active ngay khi save và kiểm freeze/hold tại command ghi stock.
- Response save trả ID/version và ánh xạ clientLineKey→lineId; server đọc được đúng đích khi refresh. Facts chốt khác với dữ liệu nháp; planned destination không phải xác nhận đã chuyển hàng.
- Confirm mới theo expectedVersion/expectedPoVersion dùng các đích đã lưu. Trong thời gian chuyển tiếp, nếu còn nhận receivingLocations cũ thì phải bằng dữ liệu đã lưu hoặc từ chối conflict; không âm thầm ưu tiên một trong hai nguồn.
- Mỗi lần save/confirm là action có key riêng; retry của cùng action giữ nguyên payload/key. Hủy request FE không có nghĩa hủy transaction BE.
- MVP chỉ autosave payload hợp lệ; trường đang gõ dở giữ trong phiên và có leave guard. Nếu cần khôi phục form chưa hợp lệ qua phiên, lưu `draftInput` riêng có schema/version/TTL và nhãn “Chưa kiểm tra”, không đưa input đó vào ledger/DocumentLine đã xác nhận.
- Giữ giới hạn100 phần lượng trong gói đầu, hiện đếm và lỗi trước khi thêm. Nếu số phần thực tế vượt100 cần chunk edit cùng inspection/version rồi validate toàn bộ khi confirm; không ép lập nhiều chuyến giả để vượt giới hạn form.

### 3.3 Quyền và phục hồi thao tác

Warehouse có create/update/post trong kho được giao; Owner read mọi kho; Accountant read scope được cấp. Sales/Admin không có quyền nhận mua. Put-away kiểm `putaway_task:*` độc lập, không dùng quyền transfer để thực hiện nhận mua.

Capability FE kiểm role hiện tại+permission+kho, loại bỏ admin bypass đối với business actions. Route guard và server capability chỉ hướng dẫn UX; middleware/command phải xác thực lại. Không gọi inspection-context quyền create để render Owner/Accountant read-only.

Thêm scoped operation status, ví dụ `GET /po-receiving/operations/:key`: key hash theo actor, target/action/payload hash khớp, quyền/scope hiện tại; trả receipt tối thiểu và trạng thái nguồn live bằng request riêng. Không trả payload nhạy cảm hoặc operation của người khác. NOT_FOUND là “chưa thấy commit ở thời điểm tra”, không phải quyền đổi key/gửi action khác khi request cũ có thể vẫn chạy.

FE có thể giữ command intent tối thiểu theo user+target trong sessionStorage để phục hồi refresh, không lưu stock chính thức hoặc token mới. Khi logout phải xóa intent/cache; pending action không được tái gửi dưới actor khác. Hết quyền thì trả403/404 và dừng phục hồi.

Chuẩn hóa lỗi receiving theo domain: state/version/source headroom/line-location/hold/freeze/operation mismatch. Dùng code+fieldErrors(clientLineKey/lineId)+details(current versions, quantities được phép thấy); không để FE parse câu message tiếng Việt để xác định hành vi. Mọi409 giữ input và yêu cầu review source mới trước action mới.

## 4. Vòng đời hủy và giải quyết custody

### 4.1 Hủy đúng đối tượng

| Lệnh mới đề xuất | Điều kiện | Hiệu ứng |
|---|---|---|
| Cancel inspection DRAFT | Warehouse/update tại kho; reason/version/key | DRAFT→CANCELLED; không stock vì chưa confirm. Giữ lịch sử, không delete. |
| Change GR draft destination | GR DRAFT; lot/quality/qty/owner/source giữ nguyên | Đổi đúng Receiving/Quarantine cùng kho có audit/version; post recheck locks/active. |
| Cancel GR DRAFT | Warehouse có quyền hủy được chốt trong catalogue; PO/GR/source version hợp lệ | GR→CANCELLED, giải phóng cap và source claim cùng transaction; NCC custody giữ nguyên, chuyển sang việc cần quyết định lại. |
| Cancel task remainder | Task OPEN/PARTIAL, chỉ phần chưa thực hiện | Giải phóng phần kế hoạch còn lại; movement đã confirm giữ nguyên. |

Không auto-expire GR nháp để giải phóng lượng. Có thể nhắc việc theo tuổi phiếu nhưng hủy cần actor/lý do/audit. “Bỏ đợt nhận” sau confirm không được làm custody biến mất.

### 4.2 Nhận thêm hàng đang giữ hộ

Đề xuất chứng từ `PO_CUSTODY_RESOLUTION` với sourceInspectionId/sourceInspectionLineId, PO/NCC/kho, qtyBase, outcome ACCEPT/REJECT, reason/evidence, versions và actor/time. Đây là tên schema mới đề xuất, chưa tồn tại runtime.

Luồng ACCEPT:

1. Tải phần NCC còn giữ thực tế và chưa bị GR draft/return khác giữ theo đúng source line.
2. Warehouse nhập quyết định thực tế; Accountant ghi tham chiếu thỏa thuận NCC nếu có. Quyết định vượt PO/duyệt không được bypass bằng resolution.
3. Confirm kiểm source entitlement/version, PO/headroom, lot/quality/location và scope. Khóa nguồn và PO; tạo acceptance claim và một GR DRAFT cho phần được nhận, ghi resolution/operation/audit cùng transaction.
4. Post GR bổ sung trừ NCC custody, tăng STORE đúng một lần. Không tạo CUSTODY_RECEIPT mới, không sửa lượng PENDING cũ thành ACCEPT bằng PUT.
5. Inspection gốc giữ facts đã chốt. Reader tính effective outcome bằng chuỗi resolution/cancel/post còn hiệu lực và hiện cả lịch sử.

Resolution REJECT thay kết quả xử lý, **chưa giảm hàng vật lý**. “Bàn giao trả thực tế” là command riêng, qty≤NCC on-site chưa bị claim và có biên bản/người nhận/thời điểm. Lệnh này ghi custody NCC giảm, không trừ STORE, không dùng GI-SR hàng thuộc cửa hàng.

Nếu đánh giá lại quality: lưu assessment mới; thay quality balance NCC phải có RECLASS đúng owner/lot/vị trí và ledger bảo toàn lượng. Không chỉ sửa quality trên GR. Sai lot/quantity do nhập liệu đi nhánh correction có nguồn, không giả là đánh giá lại chất lượng.

### 4.3 Sửa contract nguồn GR mà vẫn chống trùng

Đề xuất GR mới có `sourceKind=PO_INSPECTION|CUSTODY_RESOLUTION`, `sourceAcceptanceId`, `purchaseOrderId` và `originalPoInspectionId`. GR gốc giữ poInspectionId để tương thích; GR bổ sung dùng custodyResolutionId, không giả poInspectionId là resolution hoặc bỏ qua guard.

- Unique mới theo sourceKind+sourceAcceptanceId cho GR; giữ unique poInspectionId hiện tại đối với GR gốc. Resolution mỗi lần chấp nhận chỉ sinh một GR.
- Validator bắt buộc đúng một source theo sourceKind. GR line mang poLineId, source inspection line và acceptance source line hợp lệ; lượng phải đúng toàn bộ quyết định mới.
- `postReceipt`, `remaining`, PO reader, supplier documents/history và lot trace phải dispatch theo sourceKind. Không thêm source mới rồi để reader cũ coi INCOMPLETE hoặc bỏ qua kiểm nguồn.
- Hủy GR không cho tạo lại GR từ acceptance cũ. Một resolution mới có source và lượng eligible mới là đường nhận lại; không bỏ unique index để chữa kẹt.
- DTO đợt nhận trả `receipts[]` gồm original/supplemental và sự kiện nguồn. Field goodsReceiptId legacy chỉ là GR gốc, không được dùng làm tổng toàn đợt.

### 4.4 Entitlement theo nguồn, không chỉ theo số dư gộp

StockBalance có thể gộp hàng cùng lot/owner/quality/location từ nhiều chuyến. Vì vậy phải có projection/claim có version theo inspection line, kèm liên kết ledger và command nguồn:

```text
NCC còn ở kho của dòng nguồn
  = custody đã ghi + correction vật lý hợp lệ - STORE receipt ròng - actual handback

Lượng được xử lý tiếp
  = NCC còn ở kho - open GR claims - open actual-return claims
```

Các projection là cache kiểm soát có thể đối chiếu lại từ events/ledger; không thay StockBalance làm sổ tồn thứ hai. Khi confirm/post/cancel/return phải cập nhật source claim + PO guard + balances/ledger (nếu có) + operation/audit trong cùng transaction. Hai request dùng cùng nguồn không thể tiêu cùng phần quantity. Không dùng “balance vẫn còn đủ” để lấy hàng của chuyến khác cho source line đã hết.

## 5. Put-away mua hàng: tái sử dụng có kiểm soát

### 5.1 API và dữ liệu đề xuất

- `GET /purchase-receipts/:id/putaway-context`: GR POSTED, dòng GOOD eligible, lượng đã cất/đang có kế hoạch/chưa có kế hoạch, nguồn thực còn đủ và đích STORAGE cùng kho hợp lệ.
- `POST /purchase-receipts/:id/putaway-tasks`: chọn receiptLineId, lượng kế hoạch, đích và source/receipt versions; một dòng GR có thể tách nhiều task/destination.
- `GET /putaway-tasks/:id`, `POST /putaway-tasks/:id/confirm`, `POST /putaway-tasks/:id/cancel-remainder`: expectedVersion+operationKey; confirm nhận từng taskLineId và actualQtyBase; đích thực tế khác kế hoạch cần review và audit trước khi move.
- Task `OPEN→PARTIAL→CONFIRMED`; cancel chỉ lượng chưa làm. Receipt POSTED không có nghĩa task CONFIRMED.

Mỗi task line phải liên kết GR line, sourceBalance/location và lot/quality/owner; claim receipt quantity và source balance cùng transaction. Tổng kế hoạch còn mở của mọi task không vượt nguồn, bao gồm pending task từ module khác. Không dùng một unique “một task/GR” vì cần partial/split.

### 5.2 Công thức và bảo toàn nguồn

```text
eligibleReceiptQty = effective posted GOOD của receipt line còn đủ điều kiện
unplacedQty       = eligibleReceiptQty - actual placed hợp lệ
unplannedQty      = unplacedQty - active outstanding task claims
```

Ledger là bằng chứng đã di chuyển; không lấy “đã tạo task” hoặc trạng thái UI làm actual placed. Để tổng trên còn đúng khi receiving balance đã gộp, cần line-linked placement allocations. Movement từ RECEIVING của hàng tracked phải có provenance: generic RELOCATE hoặc chuyển vào adapter put-away, hoặc ghi/consume cùng allocation. Nếu chưa nối được lineage thì chặn đường relocate không có nguồn đối với phần tracked, không để hai module cùng cất một lượng rồi UI đếm sai.

Confirm partial giữ nguyên owner/lot/quality, nguồn-q/đích+q trong một transaction, kiểm reservations/hold/freeze và location/product/warehouse active; carries reservation theo helper đã được kiểm chứng nếu nguồn được phép có reservation. Không quảng cáo “khả dụng” nếu chưa kiểm đủ GOOD/STORE/VERIFIED/STORAGE allocatable và các điều kiện hiện hành.

Quarantine và NCC custody không là nguồn put-away hàng bán. Không gợi ý “kệ còn trống/sức chứa đủ” nếu model chưa có số sức chứa được xác minh; chỉ lọc suitability đã có căn cứ.

### 5.3 Tận dụng code hiện có

- Tách primitive đọc nguồn/guard location/conditional balance write/ledger/idempotency/pending-task calculation từ relocation và transfer khi thực sự cùng invariant.
- Adapter `PURCHASE_RECEIPT` dùng `putaway_task:*`, nguồn GR và partial confirm; adapter BF-04 giữ MWTR/TR chain và luồng full confirm hiện tại.
- Không đổi BF-04 thành partial một cách ngầm định; giữ regression transfer. Không gọi `/warehouse-transfers/documents/:id/internal-requirements` bằng GR mua vì code hiện từ chối nguồn này.
- Không gắn receipt provenance chỉ bằng ghi note ở RELOCATE. Cần LineLink/allocation và lượng nguồn hợp lệ để trace/reconcile.

## 6. Sửa sai, hàng sai nguồn và vòng đời PO

### 6.1 Sửa sai trước/sau post

| Tình huống | Giải pháp đề xuất |
|---|---|
| Inspection DRAFT sai | Sửa bằng version/key; chưa có stock. |
| Inspection đã confirm, GR còn nháp; chỉ sai đích nhận | Đổi đích GR DRAFT hợp lệ, giữ source facts. |
| Inspection đã confirm, sai lượng/lô/kết quả | Hủy GR nháp và release claims; correction chứng từ nguồn có reason/evidence, bù/đảo NCC custody đúng phần chưa được dùng; đánh dấu superseded bằng sự kiện liên kết, không sửa facts cũ. Sau đó lập acceptance mới hợp lệ. |
| GR đã post nhưng chưa có downstream | Preflight nguồn/stock/claims/task/reservation; nếu đủ điều kiện thì linked reversal đúng lượng một lần, trả ownership STORE→NCC hoặc kết quả vật lý phù hợp hồ sơ; tính lại PO và claim. |
| Hàng đã put-away/pick/dispatch/return hoặc không đủ stock đảo | Chặn reversal trực tiếp, trả dependencies và hướng xử lý. Unwind theo thứ tự nghiệp vụ hoặc lập case xử lý có thẩm quyền; không force balance âm hoặc đảo giả hàng đã ra khỏi kho. |
| Hàng đã nhập đúng rồi thực tế trả NCC | Đi BF-08 theo thỏa thuận và GI-SR; không dùng sửa sai GR để bỏ lịch sử nhập thật. |

Reversal cần preflight và recheck khi execute để tránh race. Giữ GR gốc và batches; reader tính net bằng chain reversal. Nếu dùng reader hiện tại thì reversal PostingBatch/movement phải neo original GR document/line và reversalOf nhất quán; chứng từ correction tham chiếu batch đó. Nếu đổi owner document của batch sang correction thì phải đổi reader/test cùng gói, không trộn hai contract. Không chuyển original workflowStatus tùy ý sang trạng thái reader không tính.

Quyền hủy/sửa kế hoạch nháp có thể tách từ Warehouse operation hiện tại. Quyền đảo post cần chốt riêng trước khi bật: đề xuất Warehouse lập yêu cầu có chứng cứ, Owner cho phép đảo, Warehouse thực hiện theo scope/version; đây là **đề xuất quyền mới cần review**, không suy Owner đang có quyền này hoặc gán nhầm vào một UC quản trị. Không thêm Owner approval cho GR thường, put-away thường hoặc bàn giao trả NCC custody thông thường.

### 6.2 Hàng sai SKU hoặc chưa nhận diện

Thêm exception record thuộc đợt nhận, không bắt buộc poLineId giả:

- Known product/lot: ghi phần custody NCC ngoài PO line, nguồn exception id; chưa GR cho đến khi có PO/amendment hợp lệ hoặc xử lý handback.
- Unknown product: ghi kiện/nhãn mô tả, vị trí giữ, ảnh/biên bản. Không tính nó thành qtyBase của một SKU khi chưa có UOM/lot có căn cứ. UI phân biệt hồ sơ vật lý chưa nhận diện với balance SKU đã xác nhận.
- Sau xác minh master/lô, confirm identified custody đúng một lần từ exception; match vào nguồn PO hợp lệ hoặc giao trả. Không đồng thời giữ record “unknown on-site” và tính lại cùng hàng như một intake mới.
- Giao dư cùng SKU: PENDING/REJECT hiện có vẫn dùng được. Chỉ ACCEPT phần dư sau PO amendment đúng quyền và headroom/version mới.

### 6.3 Chốt thiếu và lịch giao

Đề xuất receipt summary tách PO confirmed schedule khỏi actual trips. Schedule có ngày/quantity/UOM/phiên bản và source agreement; tạo/sửa schedule không tăng stock hoặc acceptance claim. Khi hàng tới, có thể tham chiếu schedule, vẫn lập inspection riêng; không báo “thiếu so chuyến” chỉ từ thiếu so tổng PO.

Chốt không giao phần còn lại: Accountant ghi yêu cầu/căn cứ, Owner cho phép theo BF-01-A3; lưu amendment/close record từng dòng. Không giảm ordered gốc để che lịch sử, không nhận giả phần hủy. Kiểm cam kết GR nháp/nguồn pending cần nhận; giải quyết/cancel phần xung đột trước close. Custody handback và put-away đã post không tự bị đóng theo PO.

`confirmedQtyBase` chỉ có số khi có confirmed source; không dùng ordered hoặc actual để giả NCC xác nhận. Các trạng thái PO hoàn tất theo close/amendment phải được bổ sung cùng reader: runtime hiện tại coi CLOSED/CANCELLED thiếu căn cứ là INCOMPLETE. Supplier return của hàng STORE không tự mở lại nghĩa vụ PO nếu chưa có quy tắc/thỏa thuận riêng.

## 7. Evidence, audit và khả năng vận hành

- Evidence endpoint gắn document/line, loại chứng từ và quyền đọc/ghi hiện hành; server sinh objectKey/folder, tính hash, kiểm file bytes/content chứ không chỉ MIME client.
- Đề xuất allowlist JPEG/PNG/PDF, tối đa5MB/tệp cho release đầu, có kiểm image/PDF tương ứng. Đây là giới hạn sản phẩm đề xuất; upload hiện chỉ hỗ trợ ảnh5MB. Không nhận PDF bằng route ảnh cũ.
- Upload/storage hoàn tất ngoài DB transaction; attach chỉ khi file đã tồn tại và thuộc đúng upload intent/actor/parent. Download qua quyền hiện hành và cơ chế storage private/signed phù hợp provider; không trả URL công khai như bằng chứng đã được bảo vệ.
- Evidence append-only theo model hiện tại; gỡ tham chiếu/void cần event và lý do, không xóa chứng cứ cũ của hồ sơ đã chốt. File mồ côi xử lý bằng job có TTL và trace, không xóa object đã attach.
- Rà callers product/upload trước khi bảo vệ route chung; thêm route receipt evidence riêng rồi migrate callers có kế hoạch. Không làm form sản phẩm hỏng vì thay response upload đột ngột.
- Scoped history reader tổng hợp AuditEvent, milestones và correction/resolution/tasks; có actor/time/action/before-after được phép thấy. Không công khai objectKey/hash hoặc thông tin tài khoản ngoài scope.
- Read queue theo kho: nháp kiểm, chờ GR, chờ cất, custody chờ xử lý, exception. Count server theo cùng filter/scope; tuổi phiếu là thời gian thực, không đặt SLA phạt NCC khi chưa có cam kết.

## 8. Thiết kế UI v2

### 8.1 PO detail: một màn theo dõi, nhiều đợt độc lập

Tabs: **Tổng quan · Đợt nhận · Hàng chờ & sai lệch · Hồ sơ**.

```text
PO-001 · Nhận một phần                         [+ Tiếp nhận hàng]

Gạch A · Đặt100 · Đã nhập70 · GR nháp25 · Còn được nhận5
Hàng NCC giữ hộ: theo từng nguồn/chất lượng, không cộng vào đã nhập

[Tổng quan] [Đợt nhận] [Hàng chờ & sai lệch] [Hồ sơ]

Hồ sơ      Thực giao   Nhận sở hữu ròng   GR                 Việc còn mở
KIEM-003   25          0                 GR-003 Nháp        [Xem GR]
KIEM-002   35          30                GR-002 Đã nhập     5 chờ [Xử lý]
KIEM-001   40          40                GR-001 Đã nhập     [Xem đợt]
```

Ví dụ trên giả định cùng SKU/UOM: trip1 nhận40,trip2 nhận30/chờ5,trip3 có GR nháp25. Pending5 chưa có GR nên headroom5. Từng trạng thái lấy summary server; không dùng số lượng mặc định từ local store. Nhãn đợt dùng mã hồ sơ thật; nếu muốn “Đợt1/2/3” ổn định cần sequence per PO được cấp nguyên tử, không lấy số thứ tự trang phân trang.

### 8.2 Trang đợt nhận

Stepper giữ bốn bước: **Tiếp nhận → Kiểm hàng & lô → Ghi nhận GR → Xếp kho**. Tiếp nhận/kiểm là cùng inspection DRAFT; không thêm check-in command chỉ để chuyển step.

- Bước2: bảng nhóm PO line và phần lượng; lô/quality/disposition/bao bì/holding location/planned GR destination. Drawer exception nhận hàng ngoài PO; drawer hồ sơ có API thật.
- Bước3: danh sách acceptance events và GR gốc/bổ sung. Mỗi GR có trạng thái, nguồn, quantity, đích, CTA theo trạng thái; không còn giả định toàn bộ đợt chỉ có một GR trong v2.
- Bước4: từng receipt line có Đã nhập/Đã cất/Đang có kế hoạch/Chưa có kế hoạch; tạo task/split và confirm actual partial. Hàng cách ly ở khối riêng, không có nút cất vào vị trí bán.
- Hàng chờ xử lý có drawer độc lập xuyên stepper; giải quyết sau một tháng không kéo inspection về DRAFT. Có thể xem dòng thời gian original→resolution→GR bổ sung hoặc actual return.
- Sau GR draft canceled, hiện “Phiếu đã hủy; hàng vẫn thuộc NCC” và CTA xử lý nguồn hợp lệ. Không bấm “Tạo lại GR” từ acceptance cũ.
- Sau PO nhận đủ, còn task/custody thì vẫn có badge/nút việc mở đúng quyền. Không khóa toàn màn theo PO COMPLETED.

### 8.3 Drawer xử lý hàng chờ

```text
KIEM-002 / Gạch A / LOT-A                  NCC đang giữ hộ:5
Chưa có claim khác:5                      Chủ hàng: NCC

[Nhận vào sở hữu] [Không nhận] [Bàn giao trả thực tế]
Lượng xử lý [5]  Chất lượng hiện có [GOOD]  Đích GR [RECEIVING-01]
Căn cứ/Ghi chú [.............................................]
Ảnh/biên bản [Chọn từ evidence đã lưu]

Nhận vào sở hữu: tạo quyết định mới + GR nháp, chưa tăng STORE.
                              [Đóng] [Xác nhận quyết định]
```

Các tab trên chỉ hiện action hợp lệ cho state/role; quyết định REJECT chưa đồng nghĩa đã giao trả. Nếu quality cần đánh giá lại, mở nhánh assessment/RECLASS có kiểm soát. Drawer luôn hiện giới hạn source/headroom khác nhau.

### 8.4 Trạng thái UX và độ tin cậy

Skeleton khi tải lần đầu; empty có CTA đúng quyền; network error giữ input; conflict cho xem source cũ–mới và focus đúng dòng; freeze/hold có thông báo phần bị chặn; unknown outcome có “Đang kiểm tra kết quả” thay vì báo thất bại chắc chắn. Một CTA chính ở footer, không có nút “Hoàn tất” gộp confirm/post/put-away.

Mobile dùng card theo SKU và phần lượng, stepper gọn “Bước2/4”. Không ép autofocus tìm SKU khi người dùng đang nhập dòng. Keyboard/focus/labels có thể kiểm bằng browser; không coi screenshot đẹp là kiểm chứng ledger.

## 9. API và dữ liệu mới cần triển khai

Tất cả path/schema dưới đây là **đề xuất**, cần thống nhất DTO/permission trước code. Dùng prefix `/api`, integer version, decimal strings và operationKey/creationKey theo convention nhận mua. Không trộn idempotencyKey của module transfer vào public contract nhận mua.

| Gói | API/contract chính | Dữ liệu/guards |
|---|---|---|
| Nền tảng read/draft | receiving-summary/trips; inspection create/update/detail/confirm nâng cấp | stable clientLineKey, plannedReceiptLocationId, snapshot nhãn, headroom, codes/capabilities |
| Hủy và đổi kế hoạch | POST inspection/:id/cancel; POST purchase-receipts/:id/cancel; PATCH purchase-receipts/:id/destinations | CAS PO/GR/entitlement, reason/audit, claims release; chỉ DRAFT |
| Custody | GET /purchase-orders/:id/custody-items; POST /po-inspection-lines/:lineId/custody-resolutions; POST /custody-resolutions/:id/confirm; POST /custody-returns và POST /custody-returns/:id/post | resolution/return documents, source claims+version, NCC ledger, typed GR source |
| Xếp kho | receipt putaway-context/tasks; task detail/confirm/cancel-remainder | WAREHOUSE_TASK lines/allocations, actual partial, source provenance; putaway permissions |
| Evidence/history/recovery | parent evidence create/attach/download; scoped history; operations/:key | Evidence + AuditEvent + BusinessOperation, storage permissions |
| Sửa sai | correction draft/review; GR reversal preflight/execute | linked correction/reversalOf, dependencies/source entitlement, quyền riêng |
| PO ngoại lệ | amendment/confirmed schedule/close remainder; exception intake identify/match/return | approved authority/source versions, không sửa facts posted |

Permission mới cần cập nhật whitelist/seed/tests/context và tài liệu chuẩn trong lượt triển khai được chấp thuận. Không tự suy quyền mutation từ read hoặc từ vai trò Admin; không tự thêm UC mới chỉ vì thêm endpoint kỹ thuật.

## 10. Lộ trình theo gói có thể review và nghiệm thu

| Gói | Giải quyết | Công việc BE + FE | Điều kiện hoàn tất |
|---|---|---|---|
| W0 — Contract và dữ liệu hiện có | Tất cả gap có dependency | Đối chiếu schema/index/live compatibility ở môi trường triển khai; chốt nguồn GR bổ sung, claims, quyền sửa sai, unknown goods và DTO; mapping UC/BR giữ nguyên khi phù hợp | Spec field/state/action/migration có ví dụ và test cases; chưa thay DB dùng chung. |
| W1 — Nền tảng nhận mua | 001–004,009–011,015 | DTO/read-only/headroom; stable draft/destination; typed API/UI PO nhiều đợt→inspection→GR; scoped evidence/history/operation recovery; role guards | Flow nhiều chuyến thật, refresh không mất dữ liệu đã lưu, retry an toàn; browser/API/ledger khớp. |
| W2 — Không để phiếu/hàng chờ kẹt | 005,006,013 | Cancel/destination edit; source entitlement/resolution/handback; exception intake đọc/ghi trong phạm vi đã chốt; UI hàng chờ và GR bổ sung | Hủy giải phóng cap nhưng không mất custody; nhận thêm và trả NCC không double intake; mọi nguồn mở có đường xử lý. |
| W3 — Xếp kho mua thực tế | 007 | Adapter purchase put-away, claims/lineage và partial/split, tích hợp generic movement, giữ BF04 regression; UI task thực tế | Tạo task không move; actual confirm bảo toàn STORE; hai module không chi cùng nguồn; PO complete vẫn xử lý task. |
| W4 — Sửa sai và PO ngoại lệ | 008,012 | Controlled correction/reversal; amendment/schedule/close remainder; enrich readers nguồn mới và approvals theo quyết định | Reversal có dependency guard; close không nhận giả; lịch dự kiến không post; không mất lịch sử NCC/PO. |
| W5 — Độ bền và rollout | 014,016–018 + toàn flow | Autosave hợp lệ, queue/summary, measured query optimization, migration add-only, focused/full relevant tests và browser regression | Dry-run/backfill/report; no-reset; reconciliation không lệch; release flags và rollback compatibility được kiểm. |

Thực hiện theo vertical slice: W1 có UI nhận mua đến GR, W2 bổ sung vòng đời custody, W3 có xếp kho. Không coi W1 là toàn bộ quy trình đã hoàn chỉnh. Nếu nghiệm thu chức năng “nhập hàng đến kệ và giải quyết hàng chờ”, cần W1–W3 cùng các kiểm soát evidence/quyền/migration; nếu bao gồm xử lý sai sót/chốt thiếu thì cần W4. Các gate test/migration áp dụng ở từng gói, không đợi đến cuối W5 mới kiểm.

Không đưa thời lượng cố định khi chưa chốt các thay đổi source/role/data migration. Có thể chia PR theo gói; trước code phải kiểm Git và tích hợp main theo AGENTS, giữ thay đổi người dùng. Lượt plan không tự pull, commit, stage hoặc push.

## 11. Migration và tương thích

1. Backup và dry-run thống kê inspections/GR/legacy, duplicate refs, missing source/lot/UOM và claims/task đang mở. Không dùng script reset demo để nâng cấp.
2. Thêm field/schema/index mới; backfill clientLineKey cho draft hiện có bằng ID hiện có, giữ ID thật; planned destination cũ không có thì đánh cần chọn lại, không đoán.
3. GR gốc có poInspectionId hợp lệ được backfill sourceKind/sourceAcceptanceId theo nguồn đó. Legacy không đủ chain giữ reader legacy/INCOMPLETE; không dựng inspection lịch sử giả.
4. Source entitlement/placement claims chỉ backfill khi có chain và ledger xác minh được. Record không đủ căn cứ nằm trong queue đối soát, không cho command mới tiêu nguồn đó.
5. Deploy readers hỗ trợ nguồn mới trước khi bật writers resolution/correction/put-away; seed permissions có kiểm soát. Giữ old callers nhận mua/transfer chạy qua adapter trong thời gian chuyển tiếp.
6. Feature flags theo năng lực/source kind; rollback writer giữ readers đọc được dữ liệu đã sinh, không drop docs/index để rollback. Chạy reconciliation quantity/ownership/claims sau từng migration.

## 12. Bộ tiêu chí nghiệm thu bắt buộc

| Nhóm | Kịch bản và kỳ vọng |
|---|---|
| Nhiều đợt |40+35+25,3 inspections/3 GR; net40/75/100,PO PARTIAL/PARTIAL/COMPLETED. Đưa probe thành regression. |
| Cap | PO100/GR nháp70 trả headroom30; ACCEPT40 bị409,ACCEPT30 được phép trên version mới. Hai confirm cạnh tranh không vượt cap. |
| Draft | Save/refresh giữ clientLineKey,line ID,lot,UOM,destination; quantity chưa hợp lệ không hiện “đã lưu”; stale không ghi đè. |
| Cancel | Cancel GR nháp70 giải phóng70 cap, NCC custody không giảm; replay một lần; cancel vs post chỉ một nhánh thành công. |
| Hàng chờ | Giao80/accept70/pending10: confirm NCC80,post STORE70/NCC10; resolution nhận5→GR bổ sung→STORE75/NCC5; trả thực5→NCC0/STORE75. Không intake lần hai. |
| Unique nguồn | Hai resolution cạnh tranh trên cùng10 chỉ tiêu tối đa10; mỗi acceptance sinh≤1 GR, GR canceled không được re-post, supplier/PO reader tính GR bổ sung đúng. |
| Quality/bao bì | TORN+GOOD không tự DAMAGED; ACCEPT/DAMAGED vào QUARANTINE; đánh giá lại có assessment/RECLASS, không đổi owner hoặc lượng ngầm. |
| Put-away | Nhận70; task40 đếnA,30 đếnB; confirm20/20/30 theo từng phần, tổng STORE70; actualPlaced tăng theo ledger; retry không move lặp. |
| Cross-module | RELOCATE và PUTAWAY mua cùng balance/source không overclaim; lineage không bị mất; BF04MWTR/full confirm vẫn đúng. |
| Recovery | Timeout sau commit và refresh: lookup/retry cùng key trả receipt cũ, đọc live riêng; key khác payload409; actor/kho mất quyền không được replay. |
| Evidence | Anonymous/wrong scope/wrong parent/file giả/oversize bị chặn; download reauthorize; file lỗi không tạo attached evidence thành công hoặc post giả. |
| Correction | Trước downstream đảo đúng một lần và PO net giảm; có pick/dispatch/stock thiếu/claim mới thì preflight/execute chặn, không force balance. |
| PO ngoại lệ | Close remainder có căn cứ không post stock; nhận dư chỉ sau amended allowance; schedule thay đổi không tăng tồn; pending handback vẫn mở khi PO complete. |
| Sai nguồn | Hàng ngoài PO không gắn giả poLineId; unknown không có qtyBase giả; identify/match/handover không double custody. |
| Read/quyền | Warehouse assigned write; Owner/Accountant read theo scope; Admin/Sales không được mutate; không lộ master/evidence ngoài quyền và không fallback demo. |
| Scale/migration | Count/filter/pagination nhất quán; benchmark query với tập dữ liệu ghi rõ quy mô; migration chạy lại không nhân chứng từ/claim và không thay ledger lịch sử. |

Test hiện tại và probe không chứng minh các command mới đã đạt các tiêu chí trên. Mỗi gói chỉ được báo hoàn tất khi command, UI và dữ liệu thực của gói đã kiểm cùng nhau.

## 13. Truy vết gap sang gói và giới hạn đề xuất

| Giới hạn | Gói giải quyết |
|---|---|
| GAP-REC-001 · UI/demo | W1 |
| GAP-REC-002 · Read DTO | W1 |
| GAP-REC-003 · Headroom | W1 |
| GAP-REC-004 · Stable draft/destination | W1 |
| GAP-REC-005 · Hủy/đổi đích nháp | W2 |
| GAP-REC-006 · Custody resolution/handback | W2 |
| GAP-REC-007 · Put-away mua/partial/provenance | W3 |
| GAP-REC-008 · Correction/reversal | W4 |
| GAP-REC-009 · Evidence | W1 |
| GAP-REC-010 · Audit/recovery/errors | W1 |
| GAP-REC-011 · Quyền FE/đọc | W1 |
| GAP-REC-012 · PO lifecycle/schedule | W4 |
| GAP-REC-013 · Hàng sai nguồn/unknown | W2 |
| GAP-REC-014 · Draft dở/giới hạn form | W1 save hợp lệ, W5 cải tiến |
| GAP-REC-015 · Version/trùng chuyến | W1 retry/CAS, W5 cảnh báo trùng |
| GAP-REC-016 · Query/queue/scale | W5 |
| GAP-REC-017 · Migration/compatibility | Mỗi gói, tổng kiểm W5 |
| GAP-REC-018 · Test coverage | Mỗi gói, tổng kiểm W5 |

Các lựa chọn cần chốt trong review triển khai: cho GR bổ sung từ quyết định custody mới; quyền cancel/correction/reversal; có nhận unknown physical exceptions trong release đầu hay chặn và chỉ lập biên bản; có schedule/chốt thiếu trong release đó hay chưa. Đây là đề xuất giải pháp đã cụ thể hóa, không phải thay đổi quyền/quy trình đã được người dùng chấp thuận.
