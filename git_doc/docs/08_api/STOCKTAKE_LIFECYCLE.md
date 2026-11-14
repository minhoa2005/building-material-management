# Vòng đời kiểm kê BF-05 — hợp đồng API native (13/11/2026)

Nguồn yêu cầu: luồng "Inventory Audit Process — To-Be" do người dùng cung cấp (Owner lập kế hoạch → Warehouse Staff đóng băng, đếm mù, đối chiếu → tạo phương án khi lệch → Owner duyệt độc lập → Staff ghi thực hiện → Owner chốt) và các bảng review 28/29. Quyết định bổ sung ngày 13/11/2026: **hàng đếm thực tế nhưng chưa có trong sổ (found-not-in-book) thuộc phạm vi lần triển khai này**. Chốt kiểm kê UC-93 giữ nguyên logic ghi sổ; xem [HIEUDT_ITERATIONS_NATIVE.md](HIEUDT_ITERATIONS_NATIVE.md).

Mọi endpoint nằm dưới `/api/stocktakes`, dùng `Authorization: Bearer`, body strict (khóa lạ bị từ chối 400) và nhận `idempotencyKey` (+ `expectedVersion` khi sửa chứng từ có sẵn). Mã đợt là định danh chứng từ `KK - <kho> - YYMMDD - <số>`; phương án là `PAXLKK - …` (xem [DOCUMENT_IDENTITIES.md](DOCUMENT_IDENTITIES.md)). Phản hồi lệnh: `{ id, version, workflowStatus, operationId, decisionId?, resultRefs, replayed }`; `resultRefs[]` chỉ gồm `documentType`, `documentId`, `itemId?`, `revision?` (đếm → `stocktakes` + `itemId` = mã lần đếm + `revision` = lần thứ; phương án → `stocktake_resolution_plans` + `revision` = phiên bản). **Đối chiếu không trả danh sách chênh lệch trong phản hồi**: bên đọc tính từ `GET /stocktakes/:id` (`snapshots`, `counts`, `header.selectedCounts`; chênh lệch = `countedQtyBase − bookQtyBase`).

## Trạng thái và quyền

`PLANNED → COUNTING → RECONCILING → PENDING_APPROVAL → APPROVED → IN_PROGRESS → COMPLETED` (từ chối phương án quay về `RECONCILING`; không chênh lệch thì chốt thẳng từ `RECONCILING`). Quyền theo vai trò seed: Owner `stocktake:create`, `stock_adjustment:approve`, `stock_adjustment:post`; Warehouse Staff `stocktake:update`, `stocktake:reconcile`, `stock_adjustment:create`, `stock_adjustment:update`. Mọi lệnh còn kiểm tra kho được giao, trạng thái, version, và với đếm/đối chiếu/phương án/thực hiện: nhân viên phải nằm trong `header.assignedCounterIds`.

| Lệnh | Endpoint | Quyền | Hiệu lực |
|---|---|---|---|
| Danh sách (UC-93) | `GET /` | `stocktake:read` | Chỉ đọc. Owner thấy mọi kho, vai trò khác chỉ kho được giao. Query strict (khóa lạ, id/ngày sai hoặc `from` > `to` → 400): `warehouseId` (ngoài phạm vi → bị chặn), `status`, `locationId` (đợt có vị trí này trong `header.scopeLocationIds`), `from`/`to` (ISO, bao gồm hai đầu, lọc theo `header.cutoffAt` nên đợt `PLANNED` chưa có cutoff bị loại khi có khoảng cutoff), `q` (mã đợt, khớp nguyên văn, không phân biệt hoa thường), `page`, `limit` ≤ 100. Mặc định sắp xếp `createdAt` giảm dần; `total` khớp tập đã lọc. Không thêm index mới. |
| Tùy chọn lập kế hoạch | `GET /options` | `stocktake:create` | Kho, vị trí, nhân viên có quyền đếm trong kho. |
| Lập kế hoạch | `POST /` | `stocktake:create` | Tạo `PLANNED` (version 1), phạm vi ≥1 vị trí, không đổi tồn, không khóa. |
| Sửa kế hoạch | `POST /:id/update` | `stocktake:create` | Chỉ `PLANNED`, đúng version; đổi phạm vi tăng `scopeVersion`. |
| Kích hoạt | `POST /:id/activate` | `stocktake:update` (người được giao) | Một transaction: tăng `operationVersion` mọi vị trí, từ chối nếu còn giữ chỗ/nhiệm vụ/hold hoặc vị trí đã bị đợt khác khóa, chụp snapshot `BOOK` cho từng balance, khóa **mọi** vị trí kể cả trống → `COUNTING`. Thua tranh chấp thì rollback toàn bộ. |
| Ghi số đếm | `POST /:id/counts` | `stocktake:update` (người được giao) | Chỉ `COUNTING`; chỉ ghi thêm (append-only). Đếm lại cần `previousCountId` (lần mới nhất) và `recountReason`. |
| Đối chiếu | `POST /:id/reconcile` | `stocktake:reconcile` (người được giao) | Cần mọi snapshot có lần đếm mới nhất và mọi vị trí không có snapshot có xác nhận trống = 0; lưu `header.selectedCounts` → `RECONCILING`. Không ghi tồn, không mở khóa. |
| Trình phương án | `POST /:id/resolution-plans` | `stock_adjustment:create` | Chỉ khi có lệch; gắn `scopeVersion` và đúng `selectedCounts`; dòng `DELTA`/`RECLASS`/`RELOCATE` không vượt chênh lệch; → `PENDING_APPROVAL`. Không cần phương án nếu mọi dòng khớp (bị từ chối nếu nộp). |
| Duyệt/từ chối | `POST /:id/resolution-plans/:planId/review` | `stock_adjustment:approve` | Đúng `expectedPlanVersion`; người lập không tự duyệt; lưu `approval_history` với nội dung đã duyệt (hash đối chiếu khi chốt). Duyệt không ghi tồn. |
| Ghi thực hiện | `POST /:id/resolution-plans/:planId/executions` | `stock_adjustment:update` (người được giao) | Sau khi duyệt; không vượt lượng dòng; bằng chứng phải là `Attachment` `ATTACHED`, thuộc đợt/phương án và do chính người ghi tải lên. Không ghi tồn. |
| Chốt | `POST /:id/close` | `stock_adjustment:post` | UC-93: chỉ chốt khi đã đối chiếu và `selectedCounts` khớp `header.selectedCounts`; không lệch → không cần phương án, không tạo phiếu điều chỉnh; có lệch → phương án được duyệt độc lập, đủ thực hiện. Ghi sổ một lần, mở khóa cùng transaction; lỗi thì giữ nguyên khóa. |

## Hàng phát hiện ngoài sổ (found-not-in-book)

`POST /:id/counts` với `targetType: "STOCK"`, **không** `snapshotId`, kèm:

```json
{ "discovered": { "locationId": "…", "batchId": "…", "ownerType": "STORE|SUPPLIER|CUSTOMER", "ownerId": "… (bắt buộc nếu không phải STORE)", "qualityStatus": "GOOD|…" },
  "countedQtyBase": "8", "evidenceIds": ["<attachmentId>"] }
```

Đúng một trong `snapshotId` hoặc `discovered` (hoặc `targetType: "EMPTY_LOCATION"` + `locationId`). Backend tạo snapshot `origin: "DISCOVERED"` với `bookQtyBase = 0`, `discoveredBy/At`, kèm `InventoryBalance` số lượng 0 tại vị trí (và `sourceBalanceId` của snapshot trỏ tới nó) để phương án/duyệt/chốt xử lý như mọi snapshot khác; không đổi logic ghi sổ UC-93. Từ chối khi: vị trí ngoài phạm vi hoặc đã xác nhận trống; bộ định danh (vị trí, lô, chất lượng, chủ hàng) đã có snapshot sổ (phải đếm theo mốc); đã có số dư dương cho bộ định danh; lô không `VERIFIED`/sản phẩm ngừng hoạt động/ngoài bộ lọc lô-sản phẩm của đợt; số lượng không dương; thiếu hoặc sai bằng chứng; sản phẩm nguyên đơn vị gốc mà số lượng không nguyên. Đếm lại cùng bộ định danh dùng lại snapshot đã phát hiện.

Giới hạn đã biết của hợp đồng hiện hành (không phải thay đổi mới): chốt từ chối hai `DELTA` ngược dấu trên cùng lô + chủ hàng (phải dùng `RECLASS`/`RELOCATE`); không tự mở thùng nên `DELTA` giảm phải là bội số nguyên thùng nếu không kèm quy cách đo; `DELTA` tăng của hàng lẻ cần `packaging` khi chốt.

## Giới hạn và điểm chưa quyết

- **Đếm mù chỉ được thực thi ở UI.** `GET /stocktakes/:id` vẫn trả `bookQtyBase` cho người có `stocktake:read` ở mọi trạng thái; màn nhập đếm frontend xóa số sổ khỏi cache khi `COUNTING`. Muốn chặn ở máy chủ cần quyết định riêng về redaction theo vai trò/trạng thái.
- **Chưa có API tải bằng chứng cho kiểm kê.** `evidenceIds` phải là `Attachment` đã `ATTACHED` với `ownerDocumentId` là mã đợt (hoặc phương án) và `uploadedBy` là người thao tác. Hiện frontend cho dán mã tệp; các module khác (mua hàng, đổi trả) có luồng upload riêng. Cần quyết định kho lưu trữ và endpoint upload/attach cho kiểm kê.
- Hủy/abort đợt đang khóa và mở lại đợt sau đối chiếu chưa có quy trình được duyệt; không tự mở khóa.

## Kiểm chứng

`test/stocktake-lifecycle.integration.test.js` (bật `RUN_STOCKTAKE_LIFECYCLE_TESTS=1`, replica set cô lập `127.0.0.1:27018/hieudt-test`, DB `stocktake_lc_test_<ObjectId>` bị drop khi kết thúc) kiểm: lập kế hoạch Owner-only, kích hoạt đóng băng và khóa kể cả vị trí trống, đếm chỉ-ghi-thêm/đếm lại/trễ, bao phủ đủ khi đối chiếu, hàng phát hiện ngoài sổ (bằng chứng, trùng sổ, ngoài phạm vi), phương án (sai chiều/vượt), duyệt độc lập (người lập, version cũ, từ chối + trình lại), thực hiện (vượt, sai người tải), chốt có lệch ghi sổ đúng một lần + phát hiện thành tồn thật, chốt không lệch không phiếu điều chỉnh, kích hoạt đồng thời hai đợt chồng vị trí (một thắng), và DTO HTTP strict. Kết quả thực từng lần chạy ghi ở [change_logs](../../change_logs.md).
