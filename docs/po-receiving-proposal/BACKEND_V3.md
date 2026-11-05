# Nhận mua BE v3 — contract bàn giao FE

Quyết định người dùng ngày 03/11/2026 thay phần custody/exception của design-plan-v2. Chỉ ghi lượng cửa hàng đồng ý nhập, giữ nhiều đợt trên PO. Ví dụ PO100, xe giao80, đồng ý nhập70: API chỉ nhận70; sau post STORE+70 và PO còn30. Không ghi10 không nhận, không giữ hộ NCC trong nhánh mua.

## 1. Mốc nghiệp vụ và dữ liệu

`RR APPROVED → PO DRAFT → OPEN → PO_INSPECTION DRAFT → CONFIRMED + GR DRAFT → GR POSTED → TO PUTAWAY OPEN/PARTIAL/CONFIRMED`.

- PO/inspection/GR draft, schedule và approval không ghi stock. Confirm inspection chỉ giữ headroom bằng GR DRAFT. Post GR ghi một movement từ ngoài vào STORE/GOOD tại RECEIVING, cùng ReceiptPlacement. Không có purchase CUSTODY_RECEIPT/sourceCustodyBalanceId.
- Một đợt có một GR gốc. Correction tạo inspection thay thế cùng rootInspectionId, không thêm chuyến vật lý; mỗi phiên bản inspection vẫn chỉ có một GR. Không có GR bổ sung từ custody.
- Put-away chỉ chuyển Receiving→Storage, giữ owner/lot/quality, có line-linked claim và actual ledger. PO COMPLETED/CLOSED vẫn cho xử lý task đã nhập.
- Hàng lỗi/sai SKU/unknown physical intake, custody resolution/handback, BF-02/BF-08 mới và UI không thuộc gói này. CR/FD/transfer/custody dùng chung vẫn giữ nguyên.
- 44 collections, 36 document kinds, 22 line kinds. Bốn model mới: PurchaseEvent (append-only), PurchaseSourceClaim, ReceiptPlacement, PurchaseEvidenceUpload.

### Lượng theo dòng PO

`authorizedOrdered = ordered gốc + AMENDMENT`; `outstanding = authorizedOrdered - CLOSE_EXECUTION - netPosted`; `headroom = outstanding - openDraftCommitment`.

Tất cả quantity/factor là decimal string; version là integer. Chỉ quantityState=KNOWN mới cho nhận. Nguồn hỏng/âm không clamp về0. `confirmedQtyBase=null` nếu chưa có xác nhận NCC thật; xác nhận mới nhất của từng dòng thay xác nhận trước, không cộng dồn các bản xác nhận.

PO line giữ ordered/snapshot gốc; amendment và close nằm trong PurchaseEvent. Claim RR DRAFT có qty0 để lưu approval đã review, không giữ allowance. Xác nhận OPEN và tăng lượng serialize qua RR.header.purchasingVersion, không đổi version của approval RR. Chốt thiếu giải phóng đúng lượng chưa nhận, giữ authority phần đã mua.

## 2. Quyền và command protocol

| Thao tác | Permission / role |
|---|---|
| PO read / summary | purchase_order:read — Owner mọi kho; Accountant/Warehouse assigned |
| PO create / draft edit / open / amend / schedule / close request & execute | purchase_order:create/update — Accountant assigned |
| Close approval | purchase_order:approve_exception — Owner, khác người yêu cầu |
| Inspection/GR read | goods_receipt_inspection:read — Owner, Accountant/Warehouse assigned |
| Inspection create/update/confirm/cancel; GR cancel/destination/correction | goods_receipt_inspection:create/update — Warehouse assigned; correction cần cả create và update |
| GR post | goods_receipt_inspection:post — Warehouse assigned |
| Preflight/reverse GR | goods_receipt_inspection:reverse — Warehouse assigned, không Owner approval |
| Purchase put-away | putaway_task:read — Owner/Warehouse; create/confirm/cancel — Warehouse assigned |

Admin/Sales không có business bypass. Read không cấp write. Evidence dùng permission của parent; Owner chỉ attach evidence PO qua approve_exception. Accountant xem snapshot lô trong chứng từ, không được cấp catalogue lots.

Create dùng creationKey; command dùng operationKey. Key tối đa160 ký tự, scope actor thực, hash gồm action+target+payload. Retry giữ nguyên key/body, kể cả versions cũ. Cùng key khác nội dung409. Replay kiểm quyền/kho hiện tại, trả receipt commit cũ; muốn live state phải GET lại.

Command thành công: `{id,version,workflowStatus,operationId,replayed}`; tùy action thêm goodsReceiptId/postingBatchId/eventId/evidenceId/relatedDocumentId. Không còn custodyReceiptId. Mọi stock effect cùng transaction ledger/balance/projection/PO version/operation/audit; replica set bắt buộc.

Lỗi envelope chung `{success:false,message,code?,fieldErrors?,details?}`. Nhóm receiving dùng ERR-REC-STATE/SOURCE/HEADROOM/LOCATION/FREEZE/HOLD/CLAIM/PROVENANCE/RR_CAP/RR_SOURCE/CLOSE_APPROVAL/REVERSAL_DEPENDENCY/EVIDENCE; version/key cũng có mã CORE. Sai payload400, role403, ngoài record scope404, conflict409, quá file413. Không parse message để điều khiển UI.

## 3. API `/api`

### PO và nguồn mua

PO draft UI extension (05/11/2026): `GET /purchase-orders/:id` adds `draftEdit: { lines: [{ id, rrLineId, approvalId, enteredQty, enteredUomCode }] }` for assigned Accountants with `purchase_order:update` on DRAFT POs; all other readers/states receive null. References are the saved RR/approval source claims; quantities use the original entered UOM, not base quantities. Missing or ambiguous source claims produce null source IDs and the UI blocks saving. FE sends the existing PUT/confirm contracts below, preserving line IDs and optimistic versions. No new write permissions or stock effects are introduced.

| Method/path | Body ngoài id trên path |
|---|---|
| POST /purchase-orders | creationKey,warehouseId,supplierId,expectedOn?,lines[{rrLineId,approvalId,enteredQty}] |
| PUT /purchase-orders/:id | expectedVersion,operationKey,warehouseId,supplierId,expectedOn?,lines[{id?,rrLineId,approvalId,enteredQty}]; chỉ DRAFT |
| POST /purchase-orders/:id/confirm | expectedVersion,operationKey; kiểm lại approval đã lưu và cap RR rồi OPEN |
| POST /purchase-orders/:id/amendments | expectedVersion,operationKey,reason,evidenceIds,expectedOn?,lines[{poLineId,rrLineId,approvalId,enteredQty}] |
| POST /purchase-orders/:id/supplier-confirmations | expectedVersion,operationKey,reason,evidenceIds,lines[{poLineId,qtyBase,expectedOn}] |
| POST /purchase-orders/:id/close-requests | expectedVersion,operationKey,reason,evidenceIds,lines[{poLineId,qtyBase}] |
| POST /purchase-orders/:id/close-approvals | expectedVersion,operationKey,reason,evidenceIds,requestId |
| POST /purchase-orders/:id/close-executions | expectedVersion,operationKey,reason,approvalId; ID của PurchaseEvent CLOSE_APPROVAL |

Lấy RR/line/approval IDs từ API RR hiện có. Tạo PO không tự gửi RR hay duyệt RR. Một PO một NCC/kho; sau OPEN không đổi nguồn/SKU/NCC/kho. Amendment tăng dòng PO hiện có bằng RR cùng SKU/kho được duyệt, không sửa ordered gốc. Amendment đổi ngày có thể có lines=[]; giảm nghĩa vụ đi close có duyệt. Không thêm tiền/công nợ.

Close request/approval bắt buộc evidence thuộc PO. Request làm tăng PO version; approve chỉ đúng request.sourcePoVersion+1; execute chỉ đúng approval.sourcePoVersion+1. PO thay đổi giữa các bước phải review/yêu cầu mới. Chặn dòng đang có GR DRAFT; partial close giữ phần còn mở. Close không đóng task put-away.

Schedule ghi ngày ISO, quantity và căn cứ theo dòng; là dự kiến. Mỗi xác nhận là append-only event; inspection có thể gắn scheduleId đúng PO. Không giả số thiếu của chuyến chỉ từ lượng tổng PO.

### Đợt nhận và GR

| Method/path | Ý nghĩa |
|---|---|
| GET /purchase-orders/:id/inspection-context | Warehouse/create: PO/version, lines/snapshots, quantities/headroom, Receiving locations |
| POST /purchase-orders/:id/inspections | Form bên dưới + creationKey |
| PUT /po-inspections/:id | Form + expectedVersion/operationKey, bỏ creationKey |
| POST /po-inspections/:id/confirm | expectedVersion,expectedPoVersion,operationKey; không nhận receivingLocations |
| POST /po-inspections/:id/cancel | expectedVersion,operationKey,reason; chỉ DRAFT |
| GET /po-inspections(/:id) | List page/limit/purchaseOrderId/warehouseId/status hoặc detail |
| GET /purchase-receipts(/:id) | List/detail GR thật, snapshot/capabilities/progress/reversed |
| POST /purchase-receipts/:id/post | expectedVersion,expectedPoVersion,operationKey |
| POST /purchase-receipts/:id/cancel | expectedVersion,expectedPoVersion,operationKey,reason; chỉ DRAFT |
| PATCH /purchase-receipts/:id/destinations | expectedVersion,operationKey,reason,lines[{lineId,receivingLocationId}] |

Form ví dụ, thay placeholders bằng ID thật:

```json
{
  "creationKey":"create-trip-001",
  "expectedPoVersion":2,
  "arrivedAt":"2026-11-03T08:00:00+07:00",
  "deliveryReference":"Phiếu giao 001",
  "delivererName":"Người giao",
  "lines":[{
    "clientLineKey":"row-001",
    "poLineId":"<PO_LINE_ID>",
    "lotId":"<LOT_ID>",
    "enteredQty":"70",
    "plannedReceiptLocationId":"<RECEIVING_ID>"
  }]
}
```

Optional header: delivererContact,scheduleId. Optional line: handlingNote. Line key bắt buộc và giữ ID/link qua save/reorder; đổi nguồn của key cũ bị chặn, muốn đổi phải bỏ dòng rồi thêm key mới. Lines tối đa100, draft có thể rỗng, confirm cần ít nhất1 dòng dương. UOM/factor lấy snapshot PO, không nhận qtyBase từ client. Facts CONFIRMED không PUT lại. qualityCode nội bộ GOOD; không gửi disposition/keptOnSite/holdingLocationId/packagingCondition/qualityCode/sourceCustodyBalanceId. Các field cũ bị strict validation từ chối. PATCH handling-note cũ đã bỏ; ghi chú được lưu trong draft, facts sau confirm sửa qua hồ sơ correction.

### Put-away

| Method/path | Contract |
|---|---|
| GET /purchase-receipts/:id/putaway-context | receiptVersion,lines với placementVersion/sourceBalanceVersion/received/placed/claimed/unplaced/unplanned,Storage locations,tasks |
| POST /purchase-receipts/:id/putaway-tasks | creationKey,expectedVersion của GR,lines[{receiptLineId,expectedPlacementVersion,expectedSourceVersion,qtyBase,toLocationId}] |
| GET /putaway-tasks/:id | Plan,actual,remaining theo task line |
| POST /putaway-tasks/:id/confirm | expectedVersion,operationKey,lines[{taskLineId,actualQtyBase}] |
| POST /putaway-tasks/:id/cancel-remainder | expectedVersion,operationKey,reason |

Một request có thể split cùng receipt line ra nhiều vị trí; gửi cùng initial placement/source versions từ context. Confirm partial dùng đích đã review trong task; muốn đổi đích, hủy remainder rồi lập task mới. Tạo task không move. Cancel giữ actual đã thực hiện. Reservation được mang theo helper chung khi actual cần di chuyển lượng reserved.

Generic Receiving relocation bị chặn nếu nguồn còn quantity mua tracked, để không mất GR provenance. BF-04 vẫn dùng endpoint/key/full-confirm riêng, không dùng API purchase task để thực hiện MWTR.

### Sửa sai

| Method/path | Contract |
|---|---|
| GET /purchase-receipts/:id/reversal-preflight | receiptVersion,poVersion,canReverse,blockers[] |
| POST /purchase-receipts/:id/reverse | expectedVersion,expectedPoVersion,operationKey,reason,evidenceIds thuộc GR |
| POST /po-inspections/:id/corrections | expectedVersion inspection,expectedPoVersion,operationKey,reason,evidenceIds thuộc inspection,lines theo form; deliveryReference/delivererName/delivererContact/scheduleId tùy chọn |

Reversal chỉ toàn GR một lần, giữ original GR POSTED và nối batch REVERSE.reversalOf; detail trả reversed=true. Không dùng workflowStatus để giả net stock. Preflight và execute cùng kiểm nguồn; có actual downstream/open task/reservation/hold/freeze/thiếu stock thì chặn. Với balance gộp, downstream sau GR trên cùng balance được chặn bảo thủ, không đoán hàng đã chuyển thuộc chuyến nào.

Correction trước post tự cancel GR DRAFT và tạo inspection thay thế trong cùng commit. Sau post phải reverse thành công trước. Bản mới giữ arrivedAt của đợt gốc, rootInspectionId/replacesInspectionId/correctionId; confirm/post mới vẫn phải kiểm headroom. Không tạo lại GR từ acceptance cũ hoặc sửa đè lịch sử.

### Read, history và recovery

- GET /purchase-orders/:id/receiving-summary: poVersion/computedAt, quantity/snapshot từng dòng, tripCount, schedules, openWork. Owner/Accountant không phải gọi inspection-context quyền create.
- GET /purchase-orders/:id/receiving-trips?page=1&limit=10&status=DRAFT: phân trang theo chuyến gốc, mỗi item có root/current IDs và revisions/receipts; filter status theo bản mới nhất.
- GET /purchase-receiving/queue?stage=DRAFT_INSPECTION|AWAITING_POST|AWAITING_PUTAWAY|CORRECTION&page=1&limit=10&warehouseId=&purchaseOrderId=: count/filter cùng scope. Không có SLA NCC giả.
- GET /po-inspections/:id/history hoặc /purchase-documents/:id/history?page=1&limit=10: audit có actor/time/changes; PO gồm descendants, inspection gồm revisions/GR/task. Chỉ parent mua hợp lệ, không mở history của TO/SO khác bằng permission nhận mua.
- GET /purchase-orders/:id/receiving-operations/:key: operation của actor hiện tại; COMMITTED+receipt hoặc NOT_FOUND. NOT_FOUND chỉ là chưa thấy commit khi tra, không cho đổi key của request còn chưa rõ kết quả.

## 4. Evidence

1. POST /purchase-documents/:id/evidence/uploads multipart `file`, optional `lineId`: trả uploadIntentId/mediaType/bytes/expiresAt. Server sinh object key, hash SHA256, decode JPEG/PNG/PDF thật; tối đa5MB, ảnh≤10MP, PDF1–2000 trang.
2. POST /purchase-documents/:id/evidence/attach JSON `{expectedVersion,operationKey,uploadIntentId}`: recheck actor/parent/line/expiry/READY và storage tồn tại, tạo Evidence + ATTACHED + parent version/audit cùng transaction.
3. GET /purchase-documents/:id/evidence: metadata an toàn, không objectKey/hash. GET /:id/evidence/:evidenceId/download: reauthorize, trả URL ký hạn60 giây. Không trả public URL.

Upload intent hạn24 giờ; upload lỗi vẫn giữ trace. Evidence đã attach append-only, không có delete endpoint. Storage I/O ngoài DB transaction. `npm run purchase:cleanup-evidence` chỉ preview; thêm `-- --apply` dọn tối đa100 intent expired/lần, có CAS với attach, retry DELETING sau5 phút, không xóa ATTACHED. Có thể lập lịch chạy CLI trên môi trường triển khai; gói này không tạo automation ngoài hệ thống.

## 5. Kiểm chứng, reset và vận hành

- `npm test` cùng MONGODB_TEST_URI replica set riêng. Test tạo DB random và chỉ xóa DB test. Test storage thật: `LIVE_PURCHASE_EVIDENCE_TEST=true node --import dotenv/config --test test/purchase-evidence.live.test.js`.
- `npm run purchase:benchmark` với MONGODB_TEST_URI local: tạo/xóa DB benchmark random, ghi benchmark-v3.json. So query count giữa trang5/50 để kiểm N+1, không coi p95 local là SLA production.
- `npm run purchase:reconcile`: chỉ đọc snapshot để so ledger/balance, receipt/task projections, RR allowance và PO source; không tự sửa số dư. Exit1 nếu còn issue.
- `npm run migrate:po-receiving -- --dry-run`, sau đó `-- --apply --reset-demo --database=sep490`: chỉ localhost/sep490, backup hoàn tất trước drop. Không dùng reset để upgrade database vận hành.
- Contract mua breaking change: FE cần cập nhật form/confirm/DTO và bỏ giả định custody. Không thay form/API upload sản phẩm và không sửa UI trong gói BE này.

Kết quả thực chạy, backup manifest và mapping GAP xem VERIFICATION_V3.md. Không commit/push tự động.
