## 27/11/2026 - Sửa luồng khách trả và trả NCC

Bộ chọn khách trả lọc phiếu xuất theo yêu cầu mua hàng. Khi chưa chọn yêu cầu, danh sách chỉ hiện các nguồn độc lập đủ điều kiện. Duyệt lại kiểm tra hạn mức theo lô. Phiếu nhiều dòng xét điều kiện duyệt theo từng dòng, và kiểm số lượng 0 không gửi quy cách bao bì. Lot Trace mở đúng chi tiết phiếu nhập khách trả.

Trả NCC kiểm số nguyên theo đơn vị gốc khi sản phẩm yêu cầu. Tiến độ đối chiếu dựa trên số lượng đã thỏa thuận, bàn giao và nhận phản hồi. Phiếu còn dòng chưa thỏa thuận vẫn có thể xử lý tiếp.

Kiểm tra 45 ca frontend, 32 ca backend trả hàng, 2 bài tích hợp xuất bán và 8 ca lookup có MongoDB local. Cả ba luồng chạy đến hoàn tất qua API local. Kiểm tra kiểu và tài liệu đạt.

## 27/11/2026 - Mark all notifications as read

Added **Đánh dấu tất cả đã đọc** to the notification bell at the user's request. The frontend refreshes the inbox and unread badge after the bulk operation. The [notification inbox contract](docs/08_api/NOTIFICATIONS.md) records the endpoint, permissions, and scope. The change uses the existing `readAt` field and requires no migration.

Both notification component tests passed. A local MongoDB integration test covered 16 eligible notifications, a repeated request, an existing read timestamp, and recipient, archive, warehouse, source, and permission exclusions. Browser checks with mocked API responses passed at 1440 px and 390 px, including keyboard operation, failure and retry, and a read-only account. Targeted lint passed. Repository lint and typecheck reported existing failures outside the notification files. The checkout lacks the UI check and cleanup scripts, so the browser and local server were closed directly.

## 27/11/2026 — BF-03 and BF-04 diagrams in Report 4

Aligned the two class diagrams and four sequences in Report 4 sections II.3–4 with the current relocation, transfer, variance and completion services. BF-03 now shows per-trip postings and partial cancellation. BF-04 covers request edits and cancellation, draft dispatch cancellation and reservation release, per-receipt put-away, both RESOLVED outcomes, and a source-only transit loss. Updated the four BF-04 pages in the companion project’s WMSD_TOBE_BF03_BF04_UML.drawio. Documentation only. Rendered all six report diagrams and the four edited draw.io pages, checked XML references, and ran the relocation, transfer completion and pick-allocation unit tests (14 passed).


## 26/11/2026 — Đồng bộ sơ đồ tổng quan MongoDB với main

Đối chiếu 62 collection đăng ký và luồng khách trả trên `main` tại `aaae98d`. Sơ đồ thể hiện một phiếu khách trả có thể tham chiếu nhiều phiếu xuất của cùng đơn bán, cùng kho xử lý và cùng chế độ tiếp nhận. Thêm quan hệ từ phiếu nhập `FAILED_DELIVERY` đến phiếu xuất qua `header.goodsIssueId`. Bảng đối chiếu ghi ID chứng từ và ID dòng nguồn được lưu trong `items[].sources[]`, cách backend suy ra đơn bán và tham chiếu người hoàn tất phiếu xuất qua `header.completedBy`.

Cập nhật [sơ đồ tổng quan](docs/03_thiet_ke/DB_Current_2026-11-12_58/WMSD_DB_Design_Overview.drawio), ảnh PNG và [bảng quan hệ](docs/03_thiet_ke/DB_Current_2026-11-12_58/WMSD_Overview_Relationships.md) qua `scripts/generate-db-overview.mjs` và draw.io Desktop. Kiểm tra 11 tab, 62 collection, 73 đường nối tổng quan và chạy `node scripts/check-docs.mjs` thành công. Chỉ cập nhật tài liệu, không đổi schema hay dữ liệu.

## 26/11/2026 — Xóa bộ dữ liệu demo Vua Đá Đẹp

Theo yêu cầu người dùng, đã xóa khỏi `wmsd_database` 20 sản phẩm, 20 lô, 20 quy đổi diện tích và các bản ghi thao tác phát sinh riêng trong lượt import. Trước khi xóa đã kiểm tra tham chiếu từ chứng từ và số dư. Cloudinary xác nhận xóa 85 ảnh. Đã dọn ảnh tải về, bản sao tạm và các tệp xem trước trên máy. Kiểm tra sau xóa tìm thấy 0 sản phẩm và 0 lô mang mã của lượt import.

## 26/11/2026 — Áp dụng bộ dữ liệu Vua Đá Đẹp trên Atlas

Theo yêu cầu tạo lô demo, chạy manifest đã duyệt trên `wmsd_database`. Đọc lại xác nhận 20 sản phẩm, 20 lô `UNKNOWN`, 85 ảnh truy cập được và không có số dư cho các lô mới. Dry-run sau nhập trả `SKIP` cho 20 dòng. Xem [hướng dẫn import demo](docs/09_phat_trien/VUADADEP_DEMO_IMPORT.md).

## 26/11/2026 — Import danh mục demo từ Vua Đá Đẹp

Thêm script Python lấy dữ liệu, ảnh và script Node.js import qua dịch vụ sản phẩm/lô. Dry-run chỉ đọc trên `wmsd_database` dự kiến tạo 20 sản phẩm, 20 lô `UNKNOWN` và gắn 85/112 ảnh. Kiểm thử giao dịch MongoDB local với ảnh giả lập đã kiểm tra chạy lại, phục hồi lô còn thiếu và giữ số dư tồn bằng 0. Lệnh ghi Atlas và tải Cloudinary thật chờ duyệt. Xem [hướng dẫn import demo](docs/09_phat_trien/VUADADEP_DEMO_IMPORT.md).

## 26/11/2026 — Folder architecture in agent instructions (BE, FE)

User request (26/11/2026): describe the folder architecture in English in the agent instruction files. BE: new "Folder architecture" section in `AGENTS.md`, copied to `CLAUDE.md` and `GEMINI.md` (entry points, `src/` layers, module file naming, request flow). FE: new "Folder architecture" section in `AGENTS.md` (app shell, feature folder layout, `shared/`, tests). Docs only; no code, contract or data change. Validation: `npm run docs:check` pass. Follow-up the same day: the Vietnamese "Quy tắc định danh chứng từ" section of the BE instruction files was translated to English ("Document identity rule"), with no change in meaning.
## 26/11/2026 - TrungPH partial returns and workflow review

Documented where goods and outstanding quantities remain after partial customer and supplier returns. Removed failed-delivery scenarios from the current TrungPH demo scope. The [workflow reference](docs/08_api/RETURN_WORKFLOWS_NATIVE.md#partial-returns-and-unresolved-cases) records the supplier acknowledgement dead end, custody agreement revisions, dispute handling, approval defaults, defect status, legacy failed-delivery shortages, direct issue lot tracing and historical evidence checks. This entry records review findings only.

The review compared backend `aaae98d` and frontend `f112bfe`. The focused backend run reported 11 passes, 7 skips and 0 failures. The findings come from tracing command and screen logic. Individual gap scenarios still lack browser or database-backed reproduction in this review.

## 26/11/2026 — Customer returns across goods issues on one purchase request

Sales can select a purchase request and combine its posted goods issue lines in one return within one warehouse and intake mode. Each line retains its original issue and lot. Detail links to the request, the source issues and the filtered shipment list. The backend derives references from existing lines, so deployment requires no data migration. [Return API contract](docs/08_api/RETURN_WORKFLOWS_NATIVE.md#purchase-request-and-goods-issue-links).

Verification: 12 focused backend tests passed, including an isolated MongoDB replica-set test of partial delivery, two shipments, ownership, warehouse scope, lot validation, rollback, replay and concurrent claims. Frontend typecheck passed. Of 57 focused frontend tests, 56 passed, including the two-shipment form test. The existing goods-issue warehouse-change test still fails. The older direct-sales integration suite is blocked at import by its obsolete evidence-storage module path. A live browser session was not tested.

## 26/11/2026 — Review and plan for customer return purchase-request links

Reviewed sales and goods issue changes at backend `3bcc61c` and frontend `e5f9d87`. The [implementation plan](docs/08_api/CUSTOMER_RETURN_PURCHASE_REQUEST_LINK_PLAN.md) proposes resolving the original request through the saved goods issue source, listing only authorized related issues, and keeping source eligibility tied to the issue-line claims and receipt rules. The [return API reference](docs/08_api/RETURN_WORKFLOWS_NATIVE.md) links to the proposal. This change is documentation only.

Verification on the main baselines: backend 13 of 14 focused tests passed, with one stale manual SALE validation assertion. Frontend 51 of 56 focused tests passed, with one goods-issue warehouse-change failure and four customer-return form failures. MongoDB transaction and browser verification remain pending for implementation.

## 26/11/2026 — Driver handover without a confirmation step (FE)

User decision (26/11/2026): type the driver name and press "Bàn giao"; no extra confirmation. FE `goods-issues/DirectSales.tsx`: the handover form of a direct sales issue sends `POST /goods-issues/:id/post` on submit instead of opening the review dialog; the uncertain-result retry is kept. Other actions (Hoàn tất, cancel, receipts) keep their confirmation. No BE or contract change. Validation: new test in `goods-issues/pages.test.tsx`; folder 24/25 (pre-existing failure "clears selected products when the warehouse changes…"); `tsc --noEmit` and eslint pass.

## 26/11/2026 — Sales-related receipts shown again (FE)

User decision (26/11/2026): receipts tied to sales were hidden ("Phiếu nhập liên quan đến bán hàng đang tạm ẩn"); show them again. FE `config/salesVisibility.ts`: `isDocumentKindVisible` no longer hides `FAILED_DELIVERY`, `HISTORICAL_DELIVERY` or `GI_SALE`, so the receipt list, its kind filter, Excel export and the receipt detail show goods received back as undelivered (`PNGHTB-…`), including those posted when a direct sales issue is completed. Notification and dashboard shortcuts accept `PNGHTB-` receipts and `PXB-` sales issues. The old create flow from a failed-delivery record stays retired: new `isReceiptCreateKindVisible` keeps `FAILED_DELIVERY` out of "Tạo phiếu nhập kho" and its route permission. No BE, contract or data change. Validation: `src/app/salesVisibility.test.ts` updated; `vitest src/app src/features/receipts` 77/78 (the remaining failure "auto-attaches a picked file…" in `ReceiptDetailPage.test.tsx` predates this change); `tsc --noEmit` and eslint pass; not tried in a browser.

## 26/11/2026 — Faster `GET /goods-issues/direct-options`

Reason: on the shared database the request list for "Xuất bán hàng" stayed empty because the call took about 68 seconds (free stock was computed with several queries per source balance, 375 balances). `direct-sales.service.js` now uses the existing batch helper `freeQuantities` (same result as `freeQuantity`); measured about 3 seconds for a Warehouse account with a read-only run. No contract, model or data change. Validation: `node --check`; read-only call of `options()` on the configured database listed `ĐBH-KD-261126-000001`.

## 26/11/2026 — Sales cannot create goods issues; issue quantities edited in cartons

User decision (26/11/2026): Sales cannot create goods issues; the quantity editor on the issue detail uses cartons.

- BE: `createManualIssue` rejects the SALES role for every issue kind (direct issues already did). Seeds: `permissions.data.js` grants `goods_issue:create` to WAREHOUSE only and `seeds/goods-issue-permissions.js` no longer adds it to SALES; existing databases keep the old grant until an administrator removes it, and the service check applies regardless. Direct issue detail rows add `saleUnit`, `saleUnitName`, `baseUnitsPerSaleUnit` from the request line.
- FE `features/goods-issues`: the create page shows "Sales không lập phiếu xuất…" to Sales; the list hides "Tạo phiếu xuất" for the Sales role; the draft and delivered quantity editor takes cartons and shows the base-unit conversion.
- Docs: `docs/08_api/GOODS_ISSUES.md`.
- Data: no schema change or migration; earlier standalone SALE issues stay readable.
- Validation: FE `vitest src/features/goods-issues` 23/24 (pre-existing failure "clears selected products when the warehouse changes…"), `tsc --noEmit`, eslint pass; BE `node --check` pass. Mongo integration tests not run; not tried in a browser.

## 26/11/2026 — Direct sales issue: driver handover, editable delivered quantity, Complete lock

User decision (26/11/2026): each issue is one goods issue and a request can have several; "Bàn giao cho tài xế" means the goods left the warehouse and are on the way to the customer; the actual quantity can still be edited when the customer does not take everything; a Complete button appears after the handover and locks the issue, and before that the issue can be edited.

- Model: `sales_goods_issues.header.completedAt/completedBy`, `items[].deliveredQtyBase` (optional). Data Dictionary `DB_Current_2026-11-12_58` and `src/models/CHANGELOG.md` updated.
- BE `goods-issues`: `updateIssue` accepts DIRECT drafts (`direct.updateDraft`); new `POST /goods-issues/:id/delivered-quantities` and `POST /goods-issues/:id/complete`; customer receipt and undelivered receipt are rejected after completion; detail capabilities `canEdit`, `canSetDelivered`, `canComplete`.
- FE `goods-issues/DirectSales.tsx`: post button renamed "Bàn giao cho tài xế" (driver name), status "Đang giao cho khách" / "Hoàn tất", quantity editor for drafts and for delivered quantities, "Hoàn tất" action with confirmation; `app/salesVisibility.test.ts` now expects SALE issues to be visible.
- Docs: `docs/08_api/GOODS_ISSUES.md` (lifecycle and open point on returned goods).
- Validation: FE `vitest src/features/goods-issues` 24/25 (the remaining failure "clears selected products when the warehouse changes…" predates this work), `src/features/sales-execution` 11/11, `src/app/salesVisibility.test.ts` pass; `tsc --noEmit`, eslint pass. BE `node --check`, route/model import and `test/reviewed-model-files.test.js` pass. Mongo integration tests not run; not tried in a browser.

## 26/11/2026 — Sales goods issue picks a Customer Purchase Request and issues in one or more rounds

User decision (26/11/2026): "Xuất bán hàng" on the goods issue screen picks the customer purchase request, shows what is still to deliver and issues at most that much, so a request can be delivered in one round or several. The request detail shows only "Mã đơn yêu cầu của khách" for its source reference (source type and RECORDED status removed from the screen).

- BE `src/modules/goods-issues/direct-sales.service.js`: scheduled requests can be issued directly; usable stock = free stock plus the request's own holds on the balance; posting consumes those holds (`takeStock` with `reservationDocumentId`); `direct-options` returns customer, lot code, carton conversion, ordered quantity and holds per balance.
- FE `features/goods-issues`: `DirectIssueForm` rewritten (request, warehouse, one row per open line prefilled with the remainder in cartons, location with usable stock, checks against remainder and location stock), wired to the "Xuất bán hàng" reason for Warehouse and Owner (Sales keeps the standalone form); the detail page routes DIRECT issues to `DirectIssueWorkspace`; `config/salesVisibility.ts` shows DIRECT sales issues again. `features/sales-execution`: "Lập phiếu xuất kho" also appears for requests with a delivery plan while something is left to deliver; source line shows only the request code.
- Docs: `docs/08_api/GOODS_ISSUES.md` (new 26 November section).
- Data: no schema change or migration. Delivery-schedule statuses are not advanced by direct issues.
- Validation: FE `vitest src/features/goods-issues src/features/sales-execution src/config`: all pass except the pre-existing failure "clears selected products when the warehouse changes…" in `goods-issues/pages.test.tsx`; `tsc --noEmit` and eslint pass. BE `node --check` and module import pass. `test/direct-sales.integration.test.js` not run (no Mongo test replica set) and still expects the old scheduled-order rejection; not tried in a browser.

## 26/11/2026 — Customer Purchase Request: delivered total from goods issues, shortage alerts, edit lock

User decision (26/11/2026): a request references one or more goods issues so the real delivered total is visible; it records the wanted quantity and the stock still in the warehouse, and a shortage alerts the people who buy stock (Owner and Accountant) with how much of which lot is missing; a request with no referencing document can still be edited, and editing locks once a document references it.

- BE: new `src/modules/sales-orders/sales-progress.service.js` (`orderReferences`, `assertNoReferences`, `lineProgress`, `notifySalesShortage`). `GET /sales-orders/:id` returns `references`, `canEdit` and `lineProgress`. `PUT /sales-orders/:id` and the new `POST /sales-orders/:id/update` reject edits once a goods issue, delivery order or issue request references the request; short stock on update no longer fails (reserve what is free, record the shortage in `note`, clear the note when covered). Create and update send `SALES_SHORTAGE` in-app notifications to active OWNER and ACCOUNTANT users; `notifications/sources.js` adds the `sales_orders` source linking to `/orders/:id`. This supersedes the earlier same-day note that updating a plan still fails when stock is short.
- FE `features/sales-execution`: the detail page shows a "Tiến độ giao và tồn kho" table (wanted, delivered, still to deliver, held, free stock of the lot, shortage, goods issues, in cartons and base units), a shortage warning, the referencing documents with the lock message, and a "Sửa yêu cầu" form that reuses the create form (customer, lines by lot, delivery plan) and posts to `/sales-orders/:id/update`; a line whose product or lot changes is sent as remove plus new line. `DeliveryPlanFields` keeps the delivery `id` so existing deliveries are updated in place.
- Docs: `docs/08_api/SALES_DELIVERY_SCHEDULE.md`, `docs/08_api/sales-orders/README.md`.
- Data: no schema change or migration.
- Validation: FE `vitest src/features/sales-execution` 11/11, `tsc --noEmit` and eslint for the folder pass; BE `node --check` on the changed modules and `test/sales-validation.test.js` 2/2 pass. Mongo integration tests not run (no test replica set on port 27018); not tried in a browser.

## 26/11/2026 — Customer Purchase Request: address optional, short stock no longer blocks creation

User decision (26/11/2026): the delivery address is optional (`deliveryAddress` optional on `POST /sales-orders`; `deliveryAddressSnapshot` optional on the sales order and warehouse issue request headers; the delivery order header was already optional). Creating a request with a delivery plan no longer fails with "Không đủ hàng khả dụng": `allocateAndReserve` takes an `allowShortfall` option, so the free stock of the lot is reserved FIFO and the remainder stays unreserved. The shortage is written to the request `note` ("Chưa đủ hàng khả dụng khi tạo, cần bổ sung hàng: …") and shown as a warning on the FE detail page. Reason: a shortage is exactly what justifies a replenishment request and purchase order, which can already start from the request's lines (trigger `SALES_SHORTAGE`). Editing the delivery schedule later reserves the missing quantity (existing behaviour). Updating a delivery plan still fails when stock is short. A delivery line with nothing reserved yet has no picking lines until stock is received and the schedule is saved again. No data migration. Validation: `test/sales-validation.test.js` covers a payload without an address; FE `sales-execution` tests cover the optional address and the shortage note; the Mongo integration tests were not run.

## 26/11/2026 — Customer Purchase Request is entered as a copy of the customer's slip

User decision (26/11/2026): Sales creates a request by typing what the customer's slip (paper or MISA eShop receipt) shows: customer name, phone, address and lines of product, quantity and unit price. `POST /sales-orders` now accepts `source`, `evidenceReceipt`, `neededOn`, `currencyCode` (default `VND`), `deliveries`, and per-line `lotId`, `enteredUnit` and `sourceLineKey` as optional. Without `source` the request is its own reference (its document number); without `enteredUnit` the product base unit is used; without `deliveries` no delivery plan or stock reservation is created and Warehouse issues directly from the request (existing DIRECT goods issue path, which picks lot and bin at issue time). Callers that still send the full former payload behave as before. FE (revised the same day after user feedback: lot and delivery schedule stay): the create screen shows an invoice-style line table (STT, product, lot, quantity, unit price, line amount) with total quantity and goods amount (quantity and unit price are per carton, sent as the active carton unit; the lot's carton conversion gives the base pieces), then the delivery schedule (one date and warehouse by default, or several deliveries). The evidence photo, source selector, line number and needed-on date inputs are removed; the form sends lot, auto-numbered line keys and the delivery plan, so stock is reserved at creation as before. Prices stay a typed reference: no VAT, discount, payment or e-invoice. No schema or data migration. Validation: `test/sales-validation.test.js` covers the minimal payload; the Mongo integration tests were not run (no test replica set on port 27018).

## 26/11/2026 — Sales Order renamed to Customer Purchase Request in the UI

User decision (26/11/2026): the document formerly shown as "Đơn bán" / "Đơn bán hàng" (Sales Order) is now called **Yêu cầu mua hàng của khách** (Customer Purchase Request): a request recorded from the customer's order document, not a sales contract or invoice. Only display text changes: FE labels, breadcrumbs, report group names, permission group name, search and audit-log labels, and BE validation messages. Routes (`/orders`), API paths (`/sales-orders`), collection `sales_orders`, permission codes `sales_order:*`, field names (`salesOrderId`) and the document number prefix `ĐBH` are unchanged to keep the contract stable. No data migration.

## 26/11/2026 — Ô gõ tên "Người lấy hàng & bàn giao" (BE + FE)

- **Lý do & nguồn:** Yêu cầu người dùng 26/11/2026: thay ô chọn nhân viên bằng ô gõ tên người lấy hàng.
- **Hành vi trước / sau:** Trước: FE chọn tài khoản thủ kho (`assigneeId`). Sau: FE gõ tên tự do, gửi `pickerName` khi tạo nhiệm vụ lấy hàng (trên chi tiết đơn chuyển và form tạo phiếu xuất điều chuyển); TO lưu `header.pickerName` và thẻ nhiệm vụ đang mở hiện "Người lấy hàng: …". Người được giao xác nhận (`assignedTo`) vẫn theo mặc định cũ; API vẫn nhận `assigneeId`.
- **File ảnh hưởng:** BE `transfer-order-header.schema.js`, `transfer.validation.js`, `transfer.service.js`, `movement-read-fields.js`, `test/transfer-pick-allocation.test.js`; FE `PickerNameInput.tsx` (thay `PickAssigneeSelect.tsx`), `TransferFlowPage.tsx`, `NativeIssueForm.tsx`, `api.ts`, `presentation.ts`, `goods-issues/transfer-create.test.tsx`.
- **Dữ liệu:** Thêm trường tùy chọn, không migration.
- **Tài liệu:** `BF04_API.md` (mục "Picker name"), Data Dictionary `DB_Current_2026-11-12_58`, `src/models/CHANGELOG.md`.
- **Kiểm chứng:** BE `node --test test/transfer-pick-allocation.test.js` 6/6, `test/reviewed-model-files.test.js` đạt; FE `transfer-create.test.tsx` và thư mục `transfers/live` đạt trừ 2 test cũ của `TransferFlowPage.test.tsx` không liên quan; `tsc --noEmit`, eslint đạt. Chưa thử trên trình duyệt.

## 26/11/2026 — Điều chỉnh phân bổ theo ô khi xác nhận bốc hàng chuyển kho (BE + FE)

- **Lý do & nguồn:** Yêu cầu người dùng 26/11/2026: thủ kho được đổi phân bổ ô lấy hàng khi bốc thực tế (ví dụ dự kiến Ô1 5 + Ô2 5 thành Ô1 4 + Ô2 6 thùng) miễn mỗi ô còn đủ tồn khả dụng.
- **Hành vi trước / sau:** Trước: chỉ lấy thiếu theo từng dòng. Sau: `POST /warehouse-transfers/tasks/:id/confirm` nhận thêm `allocations`; dòng TO/yêu cầu nội bộ/phiếu xuất và giữ chỗ tồn đổi theo ô thực tế; tổng thấp hơn lệnh đi theo luồng lấy thiếu (`shortReason`). Chi tiết `GET /warehouse-transfers/:id` thêm `pickPlan` cho TO lấy hàng đang mở.
- **File ảnh hưởng:** BE `transfer.service.js`, `transfer.validation.js`, `transfer-pick-allocation.js` (mới), `transfer-pick-plan.js` (mới), `test/transfer-pick-allocation.test.js`; FE `TransferPickConfirm.tsx`, `TransferFlowPage.tsx` (truyền `requestLines`), `api.ts`, `presentation.ts`, `TransferPickConfirm.test.tsx`.
- **Dữ liệu:** Không đổi model/migration. Bản ghi `stock_reservations` có thể được tạo thêm hoặc nhả bớt khi xác nhận.
- **Tài liệu:** `git_doc/docs/08_api/transfers/BF04_API.md` (mục "Bin (ô) re-allocation at pick").
- **Kiểm chứng:** BE `node --test test/transfer-pick-allocation.test.js` đạt 5/5; FE `vitest` cho `TransferPickConfirm.test.tsx`, `tsc --noEmit`, eslint các file đổi đạt. Chưa chạy test tích hợp với MongoDB (không có mongod cục bộ) nên đường ghi DB của `reallocatePick` chưa được kiểm chứng end-to-end. `TransferFlowPage.test.tsx` có 2 test đang fail ("labels request and operational quantities…", "allows reporting only from the assigned destination warehouse") ở phần không thuộc thay đổi này.

## 26/11/2026 — Sửa khoảng cách và căn chỉnh các biểu mẫu (FE)

- **Lý do & nguồn:** Theo phản hồi của người dùng về màn tạo phiếu xuất: trường lý do bị lệch hàng và phần ghi chú sát nút gửi; đồng thời rà soát các biểu mẫu khác có cùng cách ghép trường.
- **Hành vi trước / sau:** Không đổi quy trình, kiểm tra dữ liệu hay quyền. `GoodsIssueCreatePage.tsx` dùng cùng cấu trúc `Form.Item` cho lý do và kho, thêm khoảng cách dọc giữa ô quy đổi/số lượng, và đặt nhóm thông tin phiếu trong vùng có `space-y-4` để tách ghi chú khỏi nút gửi. Thêm khoảng cách hàng cho các dòng soạn hàng và xuất bán; thêm khoảng cách giữa trường và nút trong form thao tác xuất trực tiếp, khôi phục mật khẩu, tạo vai trò, sửa nhà cung cấp và sửa đơn mua nháp. Các form kiểm kê đã được rà soát và giữ nguyên vì quy tắc `.operations-page` hiện cấp `16px` dưới mỗi trường.
- **File FE ảnh hưởng** (repository `sales-returns-fe`): `src/features/goods-issues/GoodsIssueCreatePage.tsx`, `DirectSales.tsx`, `ManualPickingForm.tsx`; `src/features/auth/ForgotPasswordPage.tsx`; `src/features/accounts/detail/RolePermissionsPage.tsx`, `src/features/accounts/accounts.css`; `src/features/suppliers/components/SupplierEditModal.tsx`; `src/features/purchase-orders/detail/components/EditPurchaseOrderDraftModal.tsx`.
- **Dữ liệu:** Không đổi API, model, quyền, database hay migration.
- **Tài liệu:** Nhật ký `git_doc/change_logs.md`.
- **Kiểm chứng thực tế:** FE `npm run build` đạt (`tsc --noEmit` và Vite build); kiểm tra trình duyệt tại `/goods-issues/create` trên desktop và viewport 390px xác nhận hai trường nguồn thẳng hàng và nút gửi tách khỏi ghi chú. Chưa kiểm tra trực quan các màn còn lại và không chạy test nghiệp vụ.

## 25/11/2026 — Hiển thị lý do hủy, lý do duyệt giảm số lượng và gọn bảng Đề nghị nhập hàng (BE + FE)

- **Lý do & quyết định nguồn:** Theo yêu cầu người dùng ngày 25/11/2026 trên nhánh `minhtd`: bổ sung hiển thị lý do hủy phiếu (kèm tên người hủy và thời điểm hủy), lý do duyệt giảm số lượng từng dòng, bỏ cột "Quyết định mới nhất" không còn dữ liệu trên bảng danh sách (đưa về 7 cột theo `fe/DESIGN.md`) và thêm tab lọc "Đã hủy".
- **Hành vi trước / sau:**
  - **BE (`src/modules/replenishments/replenishment.service.js`):** `getReplenishment` và `listReplenishments` tra thêm `cancelledBy` trong `User.find` để trả về `cancelledByUser: { id, fullName }` bên cạnh `cancelReason`, `cancelledBy`, `cancelledAt`. Không thay đổi schema DB hay migration.
  - **FE (`fe/src/features/replenishments/`):**
    - `replenishmentTypes.ts` & `api/nativeReplenishmentMapping.ts`: bổ sung kiểu và map `cancelReason`, `cancelledAt`, `cancelledBy` (ưu tiên `cancelledByUser`), và `reason` trong `approvalHistory[].lines[]`.
    - `detail/ReplenishmentDetailPage.tsx`: thêm banner `<Alert>` hiển thị lý do hủy, tên người hủy và thời điểm hủy khi phiếu ở trạng thái `CANCELLED`.
    - `detail/components/ReplenishmentLinesTab.tsx`: hiển thị `"Lý do duyệt giảm:"` dưới số lượng duyệt cho các dòng có `approvedQtyBase < qtyBase`.
    - `detail/components/ReplenishmentHistoryTab.tsx`: bổ sung thẻ sự kiện `"Đã hủy phiếu"` (người hủy, thời điểm, lý do hủy) và hiển thị lý do duyệt giảm từng dòng trong mỗi quyết định duyệt.
    - `list/ReplenishmentsListPage.tsx`: xóa cột `"Quyết định mới nhất"` và state thừa `decisionFilter`, giữ 7 cột chuẩn `DESIGN.md`, thêm tab `"Đã hủy"` (`status: CANCELLED`).
- **Tài liệu cập nhật:** `git_doc/docs/08_api/REPLENISHMENT_COVERAGE.md`, `git_doc/change_logs.md`.
- **Kiểm chứng thực tế:**
  - BE: `node --check src/modules/replenishments/replenishment.service.js` đạt; `node --test test/replenishment-review-decision.test.js` (1/1 pass); `npm run docs:check` đạt. Chưa chạy integration test BE cần MongoDB local hoặc E2E trình duyệt.
  - FE: `vitest run` cho `nativeReplenishmentMapping.test.ts`, `ReplenishmentDetailPage.test.tsx`, `ReplenishmentsListPage.test.tsx` (35/35 pass); `tsc --noEmit` đạt (0 lỗi); `eslint` 9 file sửa đạt (0 lỗi); `impeccable detect --json` trên 4 file UI trả `[]` (0 lỗi). `pnpm ui:check` chưa chạy do script `scripts/ui-check.sh` không tồn tại trong repo FE; chưa chạy kiểm thử trình duyệt thực tế (`ui-visual-test`).

## 25/11/2026 — Sửa 404 chi tiết hàng lỗi của Owner và gom truy vấn tồn khả dụng

- **Lý do:** Kiểm tra bản deploy: `GET /api/defects/:id` trả 404 "Không xác định được kho của hồ sơ" với hồ sơ `DEFECT_CASE-202610-002` (Owner thấy trong danh sách nhưng không mở được chi tiết); `GET /api/stock-alerts` và `GET /api/dashboard/owner` mất khoảng 7,9 giây vì mỗi cặp sản phẩm × kho chạy lần lượt khoảng 6 truy vấn cho mỗi số dư.
- **Hành vi:** `scoped()` (`return-workflows/native.shared.js`) cho Owner đọc hồ sơ hàng lỗi không xác định được kho, khớp phạm vi danh sách của Owner; vai trò khác vẫn nhận 404. Thêm `freeQuantities()` (`shared/utils/stock.js`) và `availableStocks()` (`replenishments/replenishment.evaluation.js`) tính tồn khả dụng cho nhiều số dư bằng số truy vấn cố định; `evaluateThresholds()` dùng chúng. `freeQuantity`/`availableStock` giữ nguyên cho luồng ghi.
- **Dữ liệu:** không migration, không đổi API contract hay phân quyền.
- **Kiểm chứng:** `test/stock-availability-bulk.test.js` (mock model) xác nhận kết quả gom bằng kết quả từng số dư; `test/system-admin.test.js` đạt. Chưa đo lại trên bản deploy; test tích hợp cần MongoDB bị bỏ qua.

## 25/11/2026 — Đồng bộ sơ đồ BF-01 sau khi tách module nhận mua

- Rà lại 25 trang, cập nhật trang 1 và 13–25 của [sơ đồ BF-01](docs/04_so_do/WMSD_BF01_Diagrams.drawio). Cập nhật đường gọi kiểm nhận, nhập mua, giữ hộ và đảo phiếu theo module mới. Làm rõ loại vị trí theo chất lượng, thứ tự ghi phiếu và tính lại PO, vòng lặp đảo biến động gốc và bội số RR–quyết định, ARR–INS.
- Đồng bộ [Report 4 §II.1](docs/01_bao_cao/WMSD_Report4_Draft.md#L407), [báo cáo đối chiếu](docs/04_so_do/WMSD_BF01_Diagrams_Review.md) và 14 ảnh xem trước. Thay đổi thuộc tài liệu, không cần migration.
- Kiểm cấu trúc XML cả 25 trang, xem 14 ảnh xuất lại và render 25 khối Mermaid BF-01. Sáu test BE khoanh vùng vòng đời PO, sửa kiểm nhận, ghi tồn và đảo phiếu đạt trên cơ sở dữ liệu tạm MongoDB cục bộ. Nhánh `QUARANTINE` của PATCH được đối chiếu qua mã nguồn. Lượt này không chạy bộ test FE hoặc kiểm thử ứng dụng qua trình duyệt.
- Sau khi đối chiếu, gỡ 25 ảnh xem trước và các liên kết ảnh khỏi báo cáo theo yêu cầu.
- Đổi nhãn `RestController` thành `Controller` trên 21 sơ đồ tuần tự BF-01 trong draw.io và Report 4.

## 25/11/2026 — Tách module `po-receiving` theo loại chứng từ (BE + FE)

- **Lý do & quyết định nguồn:** Thực hiện [PLAN_tach_module_po_receiving.md](../../PLAN_tach_module_po_receiving.md) đã chốt ngày 25/11/2026: tách module `po-receiving` quá lớn thành các module theo loại chứng từ, bỏ phụ thuộc vòng giữa `purchase-orders` ↔ `po-receiving` và nội bộ `po-receiving`. Refactor thuần: giữ nguyên URL, permission, payload request/response, tên command trong audit và hành vi transaction.
- **Hành vi trước / sau:**
  - **BE shared (`src/shared/utils/`):** tách `purchase-core.js` (thêm `activePo`, `cancelDraft`; xóa alias `commitments`), `intake-packaging.js` (`intakePortions`, `checkPackagingLines`), `evidence-storage.js` (`evidenceStorage`, `inspectFile`, `MAX_BYTES`), `purchase-validation.js` (schema Zod dùng chung). Không file nào trong `shared/utils/` import `modules/`.
  - **BE modules mới & di chuyển:**
    - `src/modules/goods-inspections/`: `goods-inspection.service.js`, `goods-inspection.correction.js`, `goods-inspection.controller.js`, `goods-inspection.validation.js`, `goods-inspection.routes.js` (`inspectionRouter`, `purchaseOrderInspectionRouter`).
    - `src/modules/custody/`: `custody-stock.js`, `custody.service.js`, `custody.controller.js`, `custody.validation.js`, `custody.routes.js` (`custodyRouter`, `custodyReleaseRouter`).
    - `src/modules/stock-reversals/`: `stock-reversal.service.js`, `stock-reversal.controller.js`, `stock-reversal.validation.js`, `stock-reversal.routes.js` (`reversalRouter`).
    - `src/modules/goods-receipts/`: thêm `purchase-receipt.service.js`, `purchase-receipt.controller.js`, `purchase-receipt.validation.js`, `purchase-receipt.routes.js`; `goods-receipt.routes.js` và `other-receipt.service.js` cập nhật import.
    - `src/modules/po-receiving/`: chỉ giữ tầng đọc (`purchase-read.service.js` nhận thêm `receivingOperation`, `purchase-evidence.service.js`, `purchase-reconciliation.js`, `po-receiving.routes/controller/validation.js`); xóa `purchase-core.js`, `po-receiving.service.js`, `purchase-correction.service.js`, `purchase-custody.service.js`.
  - **FE (`fe/src/`):** tạo `shared/api/apiResponse.ts` (re-export từ `purchaseOrdersApi.ts`), tạo `features/receiving/` (`api/receivingApi.ts`, `api/receivingMappers.ts`, `api/receivingMappers.test.ts`, `components/PurchaseEvidenceField.tsx`), chuyển `PurchaseReceiptReverseModal.tsx` vào `features/receipts/detail/`, xóa thư mục trống `purchase-orders/detail/components/receiving/`, cập nhật toàn bộ import.
  - **Script & test:** cập nhật `scripts/generate-db-overview.mjs` và các test (`native-api.integration.test.js`, `receiving-custody-policy.test.js`, `purchase-evidence*.test.js`, `refactor-regression.integration.test.js`).
- **Tài liệu cập nhật:** `git_doc/docs/08_api/GOODS_RECEIPTS.md`, `git_doc/docs/09_phat_trien/HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md`, `git_doc/docs/01_bao_cao/WMSD_Report4_Draft.md`, `git_doc/docs/03_thiet_ke/DB_Current_2026-11-12_58/WMSD_Overview_Relationships.md` (sinh lại bằng `generate-db-overview.mjs`), `git_doc/docs/04_so_do/WMSD_BF01_Diagrams_Review.md`, `git_doc/change_logs.md`. Không đổi model, schema DB hay migration.
- **Kiểm chứng thực tế:**
  - Đối chiếu route trước/sau tách BE: `discoverRoutes(app)` 307/307 route và 257/257 cặp `(method, path, checkPermission...)` khớp tuyệt đối (0 diff).
  - BE unit tests (`purchase-evidence.test.js`, `purchase-evidence.local.test.js`, `receiving-custody-policy.test.js`): 9/9 pass.
  - BE integration tests trên MongoDB local `rs0` (`native-api.integration.test.js`, `refactor-regression.integration.test.js`, `goods-receipt.integration.test.js`): 38/38 pass.
  - FE: `npx tsc --noEmit` và `npm run build` pass (0 lỗi); `vitest` cho `purchase-orders`, `receiving`, `inspections`, `receipts`, `custody` đạt 146/148 pass (2 fail duy nhất thuộc `CUSTOMER_RETURN` bị ẩn bởi `salesVisibility` có sẵn trên nhánh `minhtd`, không liên quan refactor).

## 25/11/2026 · Sơ đồ RR Class dùng trực tiếp các model nguồn

- Theo yêu cầu người dùng, bỏ hộp `ReplenishmentSource` và các đường nối qua hộp này. Thêm ba đường phụ thuộc đọc từ `ReplenishmentEvaluation` đến `SalesOrder`, `WarehouseIssueRequest` và `Stocktake` theo `resolveSource()`.
- Đồng bộ ảnh trang 1, báo cáo đối chiếu, sơ đồ Mermaid trong Report 4 và hướng dẫn đọc code RR. Kiểm 16 đường nối của trang RR Class, xuất và xem ảnh trang 1. Thay đổi thuộc tài liệu, không cần migration.

## 25/11/2026 · Báo cáo đối chiếu 25 sơ đồ BF-01

- Thêm [báo cáo Markdown](docs/04_so_do/WMSD_BF01_Diagrams_Review.md) theo yêu cầu giải thích từng hình. Báo cáo nhúng 25 ảnh xuất từ draw.io, giải thích 90 đường nối lớp và ghi lại 400 thông điệp tuần tự. Kết quả gồm 20 hình khớp ở mức thiết kế, 4 khớp một phần và 1 cần chỉnh điều kiện vị trí.
- Kiểm ảnh, thứ tự trang, đích liên kết và mã nguồn hiện hành. BE qua 27 test đã chọn, trong đó 17 test dùng DB tạm trên replica set cục bộ. FE qua 78 test đã chọn. Browser và môi trường triển khai nằm ngoài phạm vi. Thay đổi chỉ thuộc tài liệu, không cần migration.

## 25/11/2026 — Bỏ nhãn mô tả trên đường nối class diagram BF-01

- Bỏ 87 nhãn trên đường nối của bốn class diagram trong draw.io và Report 4. Giữ đầu nối, kiểu quan hệ, bội số UML và toàn bộ sequence diagram.

## 25/11/2026 — Ghi tên file thực thi trên sequence diagram BF-01

- Đồng bộ 21 sequence BF-01 trong Report 4 và WMSD_BF01_Diagrams.drawio. Mỗi lifeline UI, RestController và Service ghi tên file triển khai. Các bước gửi RR đã lưu, phát hành PO và xác nhận sửa kiểm nhận đi qua file UI riêng. Những bước đánh giá RR, tính lượng PO, chuẩn bị lại kiểm nhận và xử lý tồn giữ hộ hiển thị lời gọi giữa các service.
- Luồng PATCH đổi vị trí phiếu nhập mua bắt đầu từ API client vì chưa có đường gọi từ màn hình phiếu nhập hiện tại.
- Kiểm tra 400 thông điệp và đầu mút giữa hai bản, render 26 khối Mermaid, xuất đủ 25 trang draw.io và xem các trang đại diện.

## 25/11/2026 — Tạo vị trí cho ô ngay trên màn hình vẽ

Theo yêu cầu người dùng: “Tạo vị trí mới và gán” không chuyển trang mà hiện thông báo thành công. `PUT /api/warehouse-catalogue/:id/layout` nhận thêm `createLocationForSlots?: string[]`; `createLocationsForNewSlots` tạo vị trí cho các ô này dù đã có trên bản vẽ (mã ô lạ bị từ chối, thiếu `warehouse_location:create` bị từ chối). FE gửi trường này, cập nhật bản vẽ từ response, gọi toast `message.success`, bỏ điều hướng sang trang tạo/chi tiết vị trí; FE còn thêm nút “Nhân bản kích thước” ô, tách công cụ Chọn/Chỉnh sửa và quy tắc con trỏ theo chế độ (chỉ FE). Không đổi model/quyền. Tài liệu: [STAGE2_ZONES.md](docs/10_Kho3D/STAGE2_ZONES.md). Kiểm tra: integration `hieudt-scope` 8 pass trên replica set tạm `127.0.0.1:27018`; FE tsc, eslint, vitest `warehouse-3d`/`warehouse-stock` 74 pass. Chưa thử trên trình duyệt.

## 25/11/2026 — Ô mới vẽ trên Kho 3D tự thành vị trí khi lưu

Theo yêu cầu người dùng: “Vẽ ô pallet” đổi thành “Vẽ ô”, chọn lớp khu vực thì ô là con của khu đó; ô mới tạo khi lưu thành vị trí thật. Người dùng chọn mã vị trí = tên ô và loại vị trí theo chức năng khu vực.

**Hành vi.** `saveLayout` gọi `createLocationsForNewSlots` (src/modules/warehouse-stock/service.js) trước khi ghi bản vẽ trong cùng transaction: ô không có trong bản đã lưu và chưa gán tạo `WarehouseLocation` (mã = tên ô, tên `<khu>/<ô>`, kích thước theo ô, loại theo tên chức năng), gắn `locationId`, audit `CREATE_LOCATION_FROM_LAYOUT_SLOT`. Mã trùng (không phân biệt hoa thường) hoặc dài quá 50 ký tự từ chối cả lần lưu; thiếu `warehouse_location:create` chỉ cảnh báo. Response thêm `createdLocations`. Không đổi model/schema/quyền; không backfill ô chưa gán đã có. FE: công cụ “Vẽ ô”, chọn “Lớp khu vực của ô”, tên ô mặc định `<khu>-NN` không trùng, nhận lại bản vẽ đã gắn vị trí sau khi lưu, bỏ chọn bằng bấm chỗ trống/Esc.

**Tài liệu.** [STAGE2_ZONES.md](docs/10_Kho3D/STAGE2_ZONES.md).

**Kiểm tra.** Replica set tạm `127.0.0.1:27018` (mongod 8.2 cục bộ, DB thử tự xóa): `RUN_HIEUDT_SCOPE_TESTS=1 node --test test/hieudt-scope.integration.test.js` 8 pass, gồm test mới (tạo hai loại vị trí, không tạo lại, trùng mã bị từ chối, thiếu quyền chỉ cảnh báo); test liên kết catalogue–bản vẽ được chỉnh để ô `one` là ô đã có. FE: `tsc --noEmit`, eslint, vitest `warehouse-3d`/`warehouse-stock` 69 pass. Chưa thử trên trình duyệt; chưa chạy toàn bộ test suite.

## 25/11/2026 — Liên kết ô Kho 3D với vị trí và đồng bộ kích thước

Theo yêu cầu người dùng: bản vẽ Kho 3D và danh sách vị trí phải liên kết rõ; sửa thông số/kích thước ô ngay trên bản vẽ; đồng bộ kích thước ô với “Kích thước sử dụng” của vị trí (người dùng chọn “Có, đồng bộ”).

**Hành vi.** `saveLayout` gọi `syncLocationSizesFromLayout` (src/modules/warehouse-stock/service.js) trong cùng transaction: vị trí gắn đúng một ô, ô vừa gán hoặc đổi rộng/dài, được ghi `usableLengthMm = length × 1000`, `usableWidthMm = width × 1000`, tăng version/operationVersion, audit `SYNC_LOCATION_SIZE_FROM_LAYOUT`; khóa kiểm kê, nhiệm vụ mở hoặc thiếu dung tích từ chối toàn bộ lần lưu. Response thêm `syncedLocations`; vị trí gắn nhiều ô được báo trong `warnings`. `saveLocation` khi có kích thước sẽ cập nhật ô duy nhất trong bản nháp nếu vẫn vừa khu vực và pallet. Không đổi model/schema/quyền. FE: tay nắm kéo đổi kích thước ô, thanh sửa nhanh ô, tô màu và ghi mã vị trí trên ô, lối gán từ danh sách/chi tiết vị trí, chế độ `?locationId=`, ô phủ cả khu vực, hiển thị lệch kích thước.

**Tài liệu.** [STAGE2_ZONES.md](docs/10_Kho3D/STAGE2_ZONES.md), [HIEUDT_WAREHOUSE_SCOPE.md](docs/08_api/HIEUDT_WAREHOUSE_SCOPE.md).

**Kiểm tra.** Replica set tạm `127.0.0.1:27018` (mongod 8.2 cục bộ, DB thử đã xóa): `RUN_HIEUDT_SCOPE_TESTS=1 node --test test/hieudt-scope.integration.test.js` 7 pass, gồm test mới về đồng bộ hai chiều, nhiều ô, thiếu dung tích. `warehouse-layout`, `warehouse-zones`, `warehouse-pallets`, `warehouse-stock`: 20 pass. FE: `tsc --noEmit`, eslint `warehouse-3d`/`warehouse-stock`, vitest hai thư mục 68 pass. Chưa thử trên trình duyệt với dữ liệu thật; chưa chạy toàn bộ test suite.

## 25/11/2026 — Đăng nhập bằng mật khẩu cấp lại qua email

Email production dẫn vào trang đăng nhập FE Tân Thương, kể cả khi cấu hình cũ còn URL localhost. Đăng nhập nhận username hoặc một email khớp duy nhất. Ghi hash khi cấp lại và hoàn tác khi lỗi gửi thư đều có điều kiện để tránh ghi đè lần đổi mật khẩu khác. Bổ sung bài test HTTP từ gửi mật khẩu đến đăng nhập bằng username và email cùng với bài test hoàn tác. Không đổi schema hoặc dữ liệu production. Xem [luồng tài khoản](docs/08_api/USER_ACCESS_STATUS.md) và [cấu hình Workers](docs/09_phat_trien/CLOUDFLARE_WORKERS.md).

## 25/11/2026 — Warehouse-first other goods issues

- Add a read-only warehouse availability option to the [Goods Issue contract](docs/08_api/GOODS_ISSUES.md). The frontend checks the selected warehouse before adding or reviewing draft rows. There is no schema or stock-write change.

## 25/11/2026 — Customer returns without a Sales Order screen

- Restore customer return and linked receipt screens without restoring Sales Order screens or changing return permissions.
- The create API and `CustomerReturn` header accept an optional plain-text `salesOrderReference`. Existing records remain valid without migration. Source, lot, claim and stock rules do not change. See [Return Workflows](docs/08_api/RETURN_WORKFLOWS_NATIVE.md).

## 25/11/2026 — Đồng bộ thiết kế BF-01 với code nhận mua hiện hành

- Report 4 §II.0–1 mô tả thứ tự xác thực, kiểm quyền tĩnh, validation và controller, cùng ngoại lệ phân quyền theo chứng từ và cách phân giải mã lịch sử sang _id. Ba class diagram PO, Inspection và Receipt trong draw.io theo tuyến gọi mới. Quan hệ ghi tồn đi qua StockMovement nhúng và hai đầu tham chiếu số dư.
- Đồng bộ sequence xác nhận kiểm nhận, đổi vị trí nhập, post phiếu nhập mua và post giữ hộ. Phân biệt phạm vi API giải quyết giữ hộ với thao tác tạo đề nghị trả NCC từ màn hình giữ hộ. Report 3 cập nhật luồng BF-01, các đoạn liên quan của UC-37/40, vai trò và BR-08 theo xử lý hiện hành: RR chỉ duyệt hoặc từ chối, kế toán đóng phần PO còn thiếu trong một lệnh, chuyển hàng nhập mua qua BF-03.
- Kiểm tra: render 26 khối Mermaid của pipeline và BF-01, xuất đủ 25 trang draw.io, xem trực tiếp 7 trang đã chỉnh, đối chiếu 400 thông điệp sequence và các quan hệ trên 3 trang class đã chỉnh. Ba bài test trong refactor-regression.integration.test.js và purchase-evidence.local.test.js qua với MongoDB rs0 cục bộ. Thay đổi thuộc tài liệu trong repo.

## 25/11/2026 — Sửa 3 lỗi A1–A3 và đưa 4 module mua/nhận/tồn đầu về kiến trúc `routes → controller → service`

- **Lý do & quyết định nguồn:** Quyết định người dùng ngày 25/11/2026: khắc phục 3 lỗi thực tế (`GET /api/opening-stocks/abc` trả `500`, lặp `authenticate` / `User.findById` 2–3 lần trên các prefix gắn nhiều router, và truy vấn bằng `id` thô từ URL thay vì `_id` chuẩn của chứng từ lịch sử) và chuẩn hóa 4 module (`po-receiving`, `purchase-orders`, `opening-stock`, `goods-receipts`) về mô hình `routes → controller → service` kèm `checkPermission` ở tầng route cho các route có quyền tĩnh. Giữ nguyên hợp đồng API (path, payload, `{ data }`, HTTP `200` cho `POST /purchase-orders`).
- **Hành vi trước / sau:**
  - **A1 (Opening-stock `:id`):** trước gọi `databaseId(req.params.id)` trực tiếp làm `GET/POST /opening-stocks/abc` ném `CastError` → `500`; nay chặn ở route bằng `documentIdentifier` → `400` cho ID sai định dạng, `404` cho ID đúng định dạng nhưng không tồn tại (không đổi `errorHandler.js` toàn cục để tránh nuốt `CastError` nội bộ). Body của `preview`/`create`/`post`/`cancel` giữ parse trả thông báo tiếng Việt sạch không có tiền tố `body:`; nhánh lỗi dòng Excel ở `POST /preview` chuyển sang `service.previewRowErrors(user, issues)` kiểm `allowed(user, 'opening_stock:create')` trực tiếp (bỏ mẹo gọi `service.options()` gây 4 truy vấn DB thừa).
  - **A2 (Chống lặp `authenticate`):** thêm `Symbol` private `AUTHENTICATED` trong `src/middlewares/auth.js` (chỉ gắn sau khi JWT, tài khoản `isActive` và `currentRole` hợp lệ) và gộp router lệnh PO vào `purchase-order.routes.js`. Mỗi request trên `/purchase-orders`, `/goods-receipts/purchase`, `/warehouse-transfers` chỉ nạp `User.findById` 1 lần (vẫn nạp lại actor trong `command()` cho transaction/replay).
  - **A3 (`id` thô → `_id` chứng từ):** sau `findPurchase`/`getPurchaseOrder`/`parent`, dùng `_id` đã phân giải trong `getPurchaseOrder` (4 truy vấn liên kết), `receivingSummary` (`po.id`), `receivingTrips` (`String(po._id)`), `receivingOperation` (cả 3 phép so sánh), và `purchase-evidence.service.js` (`listEvidence`, `downloadEvidence`, `attachEvidence` ngoài & trong transaction, đồng thời giữ nguyên `targetId` truyền vào `command()` để không vỡ `requestHash` khi replay).
  - **Kiến trúc & `checkPermission`:** thêm `respondWithData` ở `src/shared/utils/catchAsync.js` và tách Zod primitives dùng chung ra `src/shared/utils/command-validation.js`; tách `validation`/`controller`/`routes` (và `goods-receipt.service.js`) cho 4 module; xóa `purchase-order.commands.routes.js`. Các route quyền tĩnh trả `403` trước `400` validation; route cần 2 quyền (preflight/reverse) gắn đủ 2 middleware `checkPermission`; route quyền động (`/purchase-documents/:id/evidence*`, unified `GET /goods-receipts`, `GET /goods-receipts/:id`) giữ kiểm quyền trong service.
- **File code thay đổi:**
  - Shared/middleware: `src/middlewares/auth.js`, `src/shared/utils/catchAsync.js`, `src/shared/utils/command-validation.js` (mới), `src/routes.js`.
  - `po-receiving`: `po-receiving.validation.js` (mới), `po-receiving.controller.js` (mới), `po-receiving.routes.js`, `po-receiving.service.js`, `purchase-read.service.js`, `purchase-evidence.service.js`.
  - `purchase-orders`: `purchase-order.validation.js`, `purchase-order.controller.js`, `purchase-order.routes.js`, `purchase-order.service.js`, xóa `purchase-order.commands.routes.js`.
  - `opening-stock`: `validation.js`, `controller.js` (mới), `routes.js`, `service.js`.
  - `goods-receipts`: `goods-receipt.validation.js` (mới), `goods-receipt.controller.js` (mới), `goods-receipt.service.js` (mới), `goods-receipt.routes.js`.
  - Test mới: `test/refactor-regression.integration.test.js`.
- **Tài liệu cập nhật:** `git_doc/docs/09_phat_trien/HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md`, `git_doc/docs/08_api/GOODS_RECEIPTS.md`, `git_doc/docs/08_api/EXCEL_AND_OPENING_STOCK.md`, `git_doc/docs/01_bao_cao/WMSD_Report4_Draft.md` (mục 1.2.1, 1.3.1, 1.4.1; giữ nguyên toàn bộ phần chỉnh sửa khác), `git_doc/change_logs.md`. Không đổi model, schema DB hay migration.
- **Kiểm chứng thực tế (MongoDB local `rs0` cổng `27017`):**
  - BE không cần DB: `opening-stock-setup.test.js`, `purchase-evidence.test.js`, `purchase-evidence.local.test.js`, `receiving-custody-policy.test.js`, `public-routing.test.js` — pass 12/12.
  - BE tích hợp MongoDB local (`RUN_NATIVE_API_TESTS=1`, `RUN_GOODS_RECEIPT_TESTS=1`, `RUN_OPENING_TESTS=1`): `refactor-regression.integration.test.js` (2/2), `opening-stock.test.js`, `goods-receipt.integration.test.js`, `backend-permissions.integration.test.js`, `replenishment-warnings.integration.test.js`, `native-api.integration.test.js` — tổng pass 61/61, 0 lỗi.
  - FE: `npx vitest run src/features/opening-stock/OpeningStockPage.test.tsx` — pass 7/7.
  - Docs: `npm run docs:check` — đạt.
  - Sửa thêm cùng loại A3 (yêu cầu người dùng 25/11/2026): bộ lọc `?purchaseOrderId=` trong `listDocuments` (danh sách kiểm nhận, nhập mua, giữ hộ, hàng đợi nhận hàng) và danh sách gộp `GET /goods-receipts` trước so khớp giá trị thô nên PO lịch sử có `_id` ObjectId gọi bằng `documentNo` trả rỗng; nay phân giải qua `purchaseOrderRef` trong `po-receiving/purchase-core.js` (dùng chung bộ lọc `_id`/`documentNo` với `findPurchase`). Test: 4 đường danh sách trong `refactor-regression.integration.test.js` (2/2), `goods-receipt.integration` 1/1, `native-api.integration` + `backend-permissions` 42/42, `purchase-evidence` + `public-routing` 3/3.
  - Review lại cùng ngày: bổ sung vào `refactor-regression.integration.test.js` kiểm tra `403` trước `400` cho các route một quyền tĩnh (lệnh PO, tạo/xác nhận kiểm nhận, ghi phiếu nhập mua, quyết định giữ hộ, tạo phiếu nhập khác, ghi tồn đầu). Chạy lại trên MongoDB local `rs0`: `refactor-regression` 2/2, `goods-receipt.integration` 1/1, `native-api.integration` 35/35, `backend-permissions` + `replenishment-warnings` 21/21, `opening-stock` 2/2 (`MONGODB_TEST_PORT=27017`, `MONGODB_TEST_REPLICA_SET=rs0`), `purchase-evidence.local` 1/1. FE các thư mục `opening-stock`, `purchase-orders`, `receipts`, `inspections`, `custody`: 159/160; lỗi duy nhất ở `ReceiptCreatePage.test.tsx` (nhận hàng điều chuyển, không tìm thấy combobox "Chất lượng") thuộc FE dùng mock MSW, không liên quan thay đổi BE này.
- **Giới hạn / chưa chạy:** Không chạy toàn bộ suite `npm test` ngoài phạm vi thay đổi và không ghi DB remote; không commit/push tự động.
- **Rà lại hướng dẫn code RR → nhập → cất hàng (cùng ngày):** đối chiếu toàn bộ [HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md](docs/09_phat_trien/HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md) với code sau đợt tách. Sửa: dòng đối chiếu code đầu tài liệu; mục 2.0 thêm khung `authenticate → checkPermission → validate → controller → service`, `respondWithData`, `command-validation.js` và cờ `AUTHENTICATED` của `authenticate`; ghi chú bảng route 2B.1 (403 trước 400, route nào còn kiểm quyền trong service); `purchaseOrderRef` và quy ước dùng `_id` đã phân giải ở 2.7, 2B.1, 2B.3.6, 2B.4.2, 2B.4.5, 2B.7; số dòng lệch của `purchase-core.js`, `purchase-read.service.js`, `purchase-evidence.service.js`, `po-receiving.validation.js`, `auth.js`; Phần 3 điểm 20 chuyển thành đã sửa; Phần 4 thêm lượt chạy 25/11/2026; Phụ lục thêm file controller/validation và test hồi quy. Không đổi code. Test chạy lại trên MongoDB local `rs0`: `refactor-regression.integration`, `goods-receipt.integration`, `backend-permissions.integration`, `purchase-evidence`, `public-routing`, `receiving-custody-policy` — 19/19 đạt.

## 25/11/2026 — Report 3: đưa lại thay đổi của `efb9819` (FE-08, FE-09, BF-05) theo catalogue 174 use case

- **Lý do**: mục "Bỏ năm trường tiếng Việt" ngày 25/11 ghi các thay đổi Report 3 của `efb9819` (minhbach-03) chưa có trong file sau merge `5e7456e`. Ghi chú đó hết hiệu lực từ mục này; mục cũ được giữ làm lịch sử. Người dùng chọn catalogue 174 UC ở mục I.4.2 làm chuẩn đánh số.
- **Đã đưa vào** [Report 3](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt): đặc tả FE-08 (UC-129…UC-146, trừ UC-132) thay cho các mục kiểm kê và giải quyết chênh lệch cũ; đặc tả FE-09 tài khoản và vai trò (UC-147, UC-152…UC-160) cùng UC-175; BF-05 viết lại; dòng `Project tracking: UC-xxx` giữ nguyên số của `Project_Tracking.xlsx`; ghi chú `Former`/`Formerly UC-…` giữ số cũ; tham chiếu ở BF-01…BF-08, EX-04, sơ đồ dữ liệu, bảng thực thể, DR, BR, bảng màn hình, mục III (SC-01, SC-02, SC-09…SC-31), IV và V đổi sang số mới. Đặc tả UC-164…UC-174 đã mang số mới từ trước.
- **Giữ nguyên**: mục I.4.2, I.4.3, I.4.4, đặc tả mua hàng và nhập kho (II.1, II.3, trừ bốn tiêu đề khách hàng đã bỏ thêm chữ `Former`), SC-06…SC-08 và hai dòng SC-07/SC-08 ở bảng màn hình, bảng Change Log trong báo cáo.
- **Sửa thêm số cũ mà `efb9819` bỏ sót** trong các dòng nó đã chạm (và dòng Historical GB mapping: UC-113 → UC-164): BF-01-A3; thực thể Party/User, Document, RR/PO, Reservation, Arrival/GR, Notification; DR-03, DR-14; BR-07, BR-08, BR-25. Tham chiếu tới hai use case cất hàng đã bỏ và bước Submit RR cũ được gỡ.
- **Chờ người dùng chốt**: "Confirm Full External Payment Receipt" và "Initiate User Password Reset as Administrator" không có tên tương ứng trong catalogue 174. Tạm đánh UC-176 và UC-175 (số kế tiếp ngoài catalogue, theo cách `efb9819` dùng UC-161/UC-160, vì hai số này trong catalogue là View Notifications và Update Role Permissions). Chưa thêm vào catalogue hay ma trận quyền.
- **Ghép theo tên gần đúng**: ba mục "View/Create Copied Sales Order…" ghép với UC-94…UC-96 "View/Create Sales Order…"; tiêu đề vẫn giữ chữ "Copied".
- **Còn lệch, chưa sửa**: mục I.4.3 dùng bộ số khác I.4.2 (ví dụ Administrator ghi UC-145…UC-152); UC-132 Update Stocktake Session không có đặc tả riêng (nội dung sửa phiên PLANNED nằm trong UC-131) và không có ở SC-14; SC-19 chưa liệt kê UC-125, UC-127; một số use case khác trong catalogue chưa có đặc tả chi tiết ở mục II. Tài liệu ngoài Report 3 (PROJECT_GUIDE, RTM, Report 4) chưa đối chiếu số.
- **File**: `git_doc/docs/01_bao_cao/WMSD_Report3_Fix.docx.txt`, `git_doc/change_logs.md`. Không đổi code, model, quyền hay dữ liệu; không commit.
- **Kiểm chứng**: script so tiêu đề mục II với catalogue: không còn số trùng, mọi tham chiếu `UC-` ngoài bảng Change Log của báo cáo và các ghi chú số cũ (`Former`, `Formerly`, `retired`, `Project tracking`) là số có trong catalogue hoặc UC-175/UC-176; I.4.2, I.4.3, I.4.4, SC-06…SC-08 và Change Log trùng từng dòng với bản trước. `npm run docs:check` đạt. Chưa xuất lại `.docx`, chưa đối chiếu Google Docs, chưa đọc soát lại từng đặc tả so với code.

**Bảng đối chiếu số theo tên use case** (cột "Trước trong file": số ở tiêu đề trước lần sửa này; "—": chưa có hoặc không đánh số). Use case không có trong bảng giữ nguyên số. Tiêu đề đã bỏ ghi `Former UC-…`: 33–36, 62–68, 85, 87, 117–119, 124–128.

| Use case (tiêu đề hiện hành) | `efb9819` | Trước trong file | Nay |
|---|---|---|---|
| Post Goods Receipt | UC-39 | UC-40 | UC-40 |
| View Warehouse List | UC-54 | UC-55 | UC-55 |
| View storage location details | UC-56 | UC-57 | UC-57 |
| Create Storage Location | UC-60 | UC-61 | UC-61 |
| Update Storage Location Information | UC-61 | UC-62 | UC-62 |
| Change Storage Location Status | UC-62 | UC-63 | UC-63 |
| View stock by lot, location, and quality status | UC-63 | UC-64 | UC-64 |
| View inventory balance details | UC-64 | UC-65 | UC-65 |
| View location movement list | UC-65 | UC-68 | UC-68 |
| View location movement details | UC-66 | UC-69 | UC-69 |
| Create location movement | UC-67 | UC-70 | UC-70 |
| Confirm actual location movement | UC-70 | UC-73 | UC-73 |
| View warehouse transfer list | UC-76 | UC-79 | UC-79 |
| View warehouse transfer details | UC-77 | UC-80 | UC-80 |
| Create Transfer Request | UC-78 | UC-81 | UC-81 |
| Review Transfer Request | UC-81 | UC-84 | UC-84 |
| Create Transfer Dispatch (trước: Record Transfer Dispatch) | UC-82 | UC-85 | UC-85 |
| Post Transfer Receipt (trước: Inspect and Post Transfer Receipt) | UC-86 | UC-120 | UC-89 |
| Review Transfer Difference (trước: Review Transfer Difference Resolution) | UC-89 | UC-56 | UC-92 |
| View Copied Sales Order List | UC-91 | UC-94 | UC-94 |
| View Copied Sales Order Details | UC-92 | UC-58 | UC-95 |
| Create Copied Sales Order | UC-93 | UC-59 | UC-96 |
| Update Eligible Sales Order Remainder | UC-94 | UC-60 | UC-97 |
| Cancel Eligible Sales Order Remainder | UC-95 | UC-98 | UC-98 |
| View goods issue list | UC-96 | UC-99 | UC-99 |
| View goods issue details | UC-97 | UC-100 | UC-100 |
| Create goods issue | UC-98 | UC-71 | UC-101 |
| Update goods issue | UC-99 | UC-72 | UC-102 |
| Confirm Customer Delivery with Photo Evidence (trước: Record Customer Receipt Evidence on Goods Issue) | UC-105 | UC-129 | UC-105 |
| View defective goods details | UC-108 | UC-74 | UC-108 |
| Record Defective Goods (trước: Record Defect Inspection and Immediate Hold) | UC-109 | UC-75 | UC-109 |
| Submit Defective Goods Disposition Proposal | UC-110 | UC-76 | UC-110 |
| Review Defective Goods Disposition (trước: Approve or reject defective goods disposition) | UC-111 | UC-77 | UC-111 |
| Record approved defective goods disposition | UC-112 | UC-78 | UC-112 |
| Decide Ordinary Customer Return Acceptance | UC-117 | UC-82 | UC-117 |
| Review Eligible Customer Return Exception | UC-118 | UC-83 | UC-119 |
| Post Customer Return Receipt | UC-119 | UC-86 | UC-120 |
| View supplier return request list | UC-120 | UC-122 | UC-122 |
| View supplier return request details | UC-121 | UC-123 | UC-123 |
| Create Supplier Return Request | UC-122 | UC-124 | UC-124 |
| Confirm Supplier Return Dispatch | UC-124 | UC-126 | UC-126 |
| Close Supplier Return | UC-126 | UC-128 | UC-128 |
| View stocktake list | UC-127 | UC-93 | UC-129 |
| View stocktake details | UC-128 | UC-130 | UC-130 |
| Create Stocktake Session | UC-129 | UC-95 | UC-131 |
| Activate Stocktake Session | UC-130 | UC-96 | UC-133 |
| Print Stocktake Count Sheet | UC-131 | — | UC-134 |
| Record Stocktake Count | UC-132 | — | UC-135 |
| Record Stocktake Difference Reason | UC-133 | — | UC-136 |
| Reconcile Stocktake Results | UC-134 | UC-137 | UC-137 |
| Request Stocktake Recount | UC-135 | — | UC-138 |
| Approve Stocktake Differences | UC-136 | — | UC-139 |
| Cancel Stocktake Session | UC-137 | — | UC-140 |
| View Stocktake Plan List | UC-138 | — | UC-141 |
| View Stocktake Plan Details | UC-139 | — | UC-142 |
| Create Stocktake Plan | UC-140 | — | UC-143 |
| Update Stocktake Plan | UC-141 | — | UC-144 |
| Change Stocktake Plan Status | UC-142 | — | UC-145 |
| Generate Stocktake Session from Plan | UC-143 | — | UC-146 |
| Sign in to the system | UC-144 | UC-106 | UC-147 |
| Reset Own Password by Email | UC-145 | UC-131 | UC-152 |
| View account list | UC-146 | UC-153 | UC-153 |
| View account details | UC-147 | UC-108 | UC-154 |
| Create Staff Account | UC-148 | UC-109 | UC-155 |
| Update Staff Account Information | UC-149 | UC-110 | UC-156 |
| Change Staff Account Status | UC-150 | UC-111 | UC-157 |
| View Role List | UC-151 | — | UC-158 |
| Create Role | UC-152 | — | UC-159 |
| Update Role Permissions | UC-153 | — | UC-160 |
| View Operational Reports | UC-154 | UC-164 | UC-164 |
| View stock movement log | UC-155 | UC-165 | UC-165 |
| View stock movement details | UC-156 | UC-166 | UC-166 |
| Trace a product lot through source documents | UC-157 | UC-172 | UC-172 |
| Verify Historical Customer Delivery Source | UC-158 | UC-173 | UC-173 |
| Record External Document Reference | UC-159 | UC-174 | UC-174 |
| Initiate User Password Reset as Administrator | UC-160 | UC-132 | UC-175 |
| Confirm Full External Payment Receipt | UC-161 | — | UC-176 |

## 25/11/2026 — Bỏ năm trường tiếng Việt sao chép trên chứng từ

- **Lý do**: người dùng quyết định ngày 25/11/2026. `tenLoaiPhieu`, `maDonVi`, `kyDanhSo`, `soThuTu`, `trangThaiTiengViet` lặp lại dữ liệu đã có ở `documentKind`, `documentNo`, `workflowStatus`; nhãn trạng thái đã lưu còn bị cũ khi sang trạng thái thiếu trong bảng nhãn (ví dụ `SUBMITTED` vẫn hiện "Nháp").
- **File**: `src/models/document-helpers.js`, `src/models/stocktake-plan.model.js`, `src/shared/utils/document-number.js` (`nextDocumentFields` và `pairedDocumentFields` chỉ trả `_id`, `documentNo`; lịch giao suy mã từ `documentNo` của đơn bán), `src/modules/search/search.service.js`, `src/modules/stocktake-closure/stocktake-reconciliation.service.js`, `scripts/drop-vietnamese-document-fields.mjs` (mới), `scripts/generate-db-overview.mjs` (thêm `delivery_schedules` vào bố cục), test `document-number` và `system-admin`.
- **Hành vi**: định dạng và cách cấp mã phiếu không đổi. Response API không còn năm trường (FE trong `fe/src` không dùng). Tìm kiếm nhanh vẫn trả nhãn trạng thái tiếng Việt, tính lúc đọc.
- **Tài liệu**: MODEL_MAP, `src/models/CHANGELOG.md`, từ điển và `schema.json` mốc 12/11 (sinh lại), DOCUMENT_IDENTITIES, STOCKTAKE_PLANS, SYSTEM_ADMIN, HIEUDT_ITERATIONS_NATIVE, HUONG_DAN_CODE_RR_NHAP_CAT_HANG; sinh lại hai file draw.io, bảng quan hệ và xuất lại ảnh (hai ảnh tổng quan/toàn bộ), ảnh tab "Phê duyệt và nhật ký" chỉ cập nhật dữ liệu sơ đồ nhúng. Sơ đồ được thêm `delivery_schedules` (62 collection). Từ điển 09/11 giữ nguyên làm lịch sử.
- **Dữ liệu**: không ghi Atlas `wmsd_database`. DB local `wmsd_demo_tile_shop_v9` không có bản ghi cần dọn. Xem trước (chỉ đọc) thấy còn dữ liệu cũ ở `sep491` (11), `wmsd_reopen_check` (9), `wmsd_ui_check_261116` (8); chưa dọn. Con số là số cặp bản ghi/đường dẫn script tìm thấy. Cách dọn một DB local: đặt `MONGODB_URI=mongodb://127.0.0.1:27017/<db>` rồi chạy script với `--apply`.
- **Kiểm chứng**: `npm test` mốc trước khi sửa 441 ca, 302 đạt, 139 bỏ qua, 0 lỗi. Bảy suite tích hợp (document-number, native-api, hieudt-iterations, stocktake-lifecycle, stocktake-resolution, goods-issues, direct-sales) trên replica local tạm 27018: trước khi sửa 54/64 đạt, sau khi sửa 55/65 đạt; 10 ca lỗi đều thuộc `hieudt-iterations`, trùng tên và nội dung lỗi ở hai lần chạy. Script dọn thử trên DB tạm: xóa đúng trường, giữ dữ liệu khác và ảnh chụp phê duyệt. Chưa kiểm trên trình duyệt.
- **Gộp main trước khi sửa**: commit local `fc9eb94`, gộp `origin/main` (`410c1b1`) thành `5e7456e`. `change_logs.md` giữ cả hai bên. Theo lựa chọn của người dùng, `WMSD_Report3_Fix.docx.txt` giữ nguyên bản local: các thay đổi Report 3 của commit `efb9819` (minhbach-03, FE-08, FE-09, BF-05, đánh lại số) **chưa có trong file** dù mục nhật ký 24/11 bên dưới mô tả chúng; cần đưa lại sau.

## 25/11/2026 — Hướng dẫn đọc code RR: giải thích kiểm quyền ở route và trong service

**Yêu cầu.** User, 25/11/2026: giải thích vì sao một số chỗ trong module RR không dùng middleware `checkPermission` mà kiểm quyền trong service, và ghi vào [HUONG_DAN_CODE_RR_NHAP_CAT_HANG](docs/09_phat_trien/HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md) đầy đủ từng hàm, lý do và cách kiểm chứng. Chỉ sửa tài liệu; không đổi code, quyền hay dữ liệu.

**Thay đổi.** Thêm mục "Kiểm quyền: middleware `checkPermission` và hàm `requirePermission` trong service" trong Phần 2.0: tám lớp kiểm tra của một request RR kèm mã lỗi, ba hàm lõi (`hasPermission`, `checkPermission`, `requirePermission`), bốn lý do kiểm trong service (quyền phụ thuộc input, `command()` kiểm lại trong transaction, service được gọi từ nhiều nơi, điều kiện cần đọc bản ghi), bảng từng hàm RR, ví dụ Sales bị gỡ quyền `:create`, quy tắc khi thêm route và cách kiểm chứng. Thêm Phần 3 mục 3.6 (điểm 35–38): `canAccessWarehouse` có hai bản khác nhau khi `warehouseId` null, `replenishmentScope` tự kiểm quyền và bỏ qua `isActive`, tham số `roles` không dùng, quyền `replenishment_request:evaluate` có trong seed nhưng BE không kiểm.

**Kiểm tra.** Đối chiếu code nhánh `minhtd` commit `5e7456e`. MongoDB local `rs0`: `RUN_NATIVE_API_TESTS=1 node --test --test-concurrency=1 --test-name-pattern="HTTP permission scope" test/backend-permissions.integration.test.js`: 6 test, 6 đạt. `npm run docs:check`. Chưa có test HTTP cho `POST /replenishments/evaluate` và `POST /replenishments/:id/cancel` khi thiếu quyền; chưa chạy test FE.

## 25/11/2026 — Report 4 §II.1: tách sequence diagram BF-01 theo thao tác

- Tách bốn sơ đồ tổng hợp thành 21 sơ đồ trong [Report 4](docs/01_bao_cao/WMSD_Report4_Draft.md) và đồng bộ 21 trang sequence trong [tệp draw.io BF-01](docs/04_so_do/WMSD_BF01_Diagrams.drawio). Giữ bốn trang class diagram. Các bước gửi RR, phát hành PO và xác nhận kiểm hàng nằm trong UC Create tương ứng theo Report 3 §4.2.
- Đối chiếu 29 route API với route đăng ký và kiểm tra các lệnh nghiệp vụ tương ứng, gồm tạo phiếu nháp khi xác nhận kiểm, ghi tồn theo chủ sở hữu, hủy phiếu nháp, đảo tồn và trạng thái PO sau ghi hoặc đảo phiếu. Cập nhật dòng tham chiếu BF-01 trong bảng tổng hợp Report 4 theo các mục mới.
- Mermaid parse 46 khối của báo cáo và render đủ 21 sơ đồ mới. Xuất 25 trang từ draw.io, rà bố cục 21 trang sequence và đối chiếu nhãn message, guard giữa hai bản. npm run docs:check đạt. Phạm vi kiểm tra là tài liệu và sơ đồ. Không chạy test ứng dụng.

## 25/11/2026 — Report 4 Draft: cập nhật mục Database Design theo mẫu và 10 tab Draw.io (61 collection)

**Yêu cầu.** User, 25/11/2026: chỉnh sửa mục `I.3 Database Design` trong [WMSD_Report4_Draft.md](docs/01_bao_cao/WMSD_Report4_Draft.md) theo cấu trúc bản mẫu Report 4 và sơ đồ tổng + 10 tab trong [WMSD_DB_Design_Overview.drawio](docs/03_thiet_ke/DB_Current_2026-11-12_58/WMSD_DB_Design_Overview.drawio). Chỉ sửa tài liệu; không đổi code, model hay dữ liệu.

**Thay đổi.**
- Thay các bảng liệt kê cột dài và sơ đồ Mermaid 58 bảng cũ bằng sơ đồ tổng (`WMSD_DB_Design_Overview.drawio.png`) và 10 tiểu mục `3.1`–`3.10` khớp 1:1 với 10 tab nghiệp vụ của `WMSD_DB_Design_Overview.drawio`, cập nhật mục lục tương ứng (không sửa bảng Change Log trong report theo quy tắc tài liệu).
- Mỗi tiểu mục gồm mô tả ngắn nhóm nghiệp vụ, tham chiếu tab Draw.io tương ứng và bảng `Table Descriptions` (`No | Collection | Description` kèm `Primary keys` và `Foreign keys`), đánh số liên tục `01`–`61` phủ đủ 61 collection hiện hành (58 nghiệp vụ + 3 quản trị hệ thống `app_settings`, `api_endpoints`, `error_logs`; đã có `stocktake_plans`, không còn `replenishment_locks`), giữ ghi chú tương thích cho các collection lịch sử (`customers`, `warehouse_issue_requests`, `delivery_orders`, `failed_deliveries`, `sales_invoices`, `supply_allocations`).

**Kiểm tra.** Chạy `npm run docs:check` tại `be/`. Lưu ý: 10 tab con chưa xuất ảnh PNG riêng nên các mục `3.1`–`3.10` đang trỏ tới tên tab trong `WMSD_DB_Design_Overview.drawio`; mục `I.1 Software Architecture` vẫn giữ con số `58 collections` cũ ngoài phạm vi lượt sửa này.

## 24/11/2026 — Hướng dẫn đọc code RR → nhập → cất hàng: đối chiếu lại code và viết đầy đủ luồng phụ

**Yêu cầu.** User, 24/11/2026: cập nhật [HUONG_DAN_CODE_RR_NHAP_CAT_HANG](docs/09_phat_trien/HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md) theo code hiện tại, kiểm các thay đổi và nhánh mới của quy trình, trình bày luồng phụ theo cùng khuôn luồng chính, chạy test để xác nhận. Chỉ sửa tài liệu; không đổi code, model hay dữ liệu.

**Đối chiếu.** Nhánh `minhtd` commit `e251fb0`; `origin/main` không có commit mới chạm `replenishments`, `purchase-orders`, `po-receiving`, `location-movements`, `goods-receipts` hay `shared/utils` của luồng.

**Sửa nội dung sai so với code.** Phiếu nhập ghi hết phần còn lại của PO có dòng chốt thiếu thì PO về `CLOSED` (không phải `COMPLETED`); lập kiểm nhận "chạm" `updatedAt` của PO để tranh chấp với hủy PO; bỏ các câu còn nói về kiểm kê mù (đã gỡ 22/11/2026); `moveStock` có thêm kiểm "Tồn đã được giữ hoặc lập lệnh khác"; `availableStock` được export cho cảnh báo tồn thấp và dashboard; cập nhật 33 số dòng lệch trong liên kết tới `po-receiving.service.js`, `stock.js`, `location-movement.service.js`, `purchase-order.*`, `replenishment.*`, `purchase-evidence.service.js`.

**Bổ sung.** Mã chứng từ `PXGH` (`CustodyRelease`) và `PĐN` (`StockReversal`), vai trò theo seed quyền, bản đồ nhánh rẽ khỏi luồng chính, bảng API BF03. Phần 2B viết lại theo khuôn luồng chính cho: dữ liệu form/nguồn/xem trước/danh sách RR, rút-hủy RR, nhánh từ chối RR, sửa PO, đổi ngày giao, chốt thiếu, mở lại PO, hủy PO, đọc PO, dữ liệu form kiểm nhận, tra theo khóa thao tác, hủy nháp, đổi bãi, màn hình đọc nhận hàng, sửa kết quả kiểm, đảo phiếu, bằng chứng, toàn bộ nhánh giữ hộ (ghi, tái kiểm, quyết định, lập chứng từ, ghi phiếu nhập từ giữ hộ, trả NCC), đọc lệnh chuyển, đối soát, cảnh báo tồn thấp và quy tắc thông báo. Phần 3 thêm 5 giới hạn đã biết (điểm 30–34) và sửa điểm 28 (sau hủy PO, `openRequests` tính lại toàn bộ lượng duyệt của RR). Thêm Phần 4 ghi kết quả test.

**Kiểm thử.** MongoDB local `rs0`: `RUN_NATIVE_API_TESTS=1 RUN_RELOCATION_PARTIAL_TESTS=1 node --test --test-concurrency=1` trên 9 file test của luồng: 79 ca, 78 đạt, 1 lỗi môi trường (`location-movement-partial.integration.test.js` cần replica set `hieudt-test` cổng 27018, máy không có). `npm run docs:check` đạt. Chưa chạy toàn bộ suite, test FE hay trình duyệt.

## 24 November 2026 — Report 3 (Google Doc & local): RR, PO, inspection and receiving alignment

User request (24/11/2026): compare Google Doc `WMSD_Report3_Fix` against `docs/01_bao_cao/WMSD_Report3_Fix.docx.txt` (local baseline) for §§II and III (RR, PO, goods inspection, goods receipt), update the Google Doc accordingly, strip `SC-` prefixes from §III screen headings (leaving screen names only), fix the stray sample name `Trần Minh`, and ensure descriptions remain requirement-level rather than code-copied. Documentation only; no code or database changed.

- Local [Report 3](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt): fixed the `Creator / submitter` row in `SC-06.3` from placeholder `Trần Minh` to `Text, read-only | Scoped user names of the creator and submitter.`
- Google Doc `WMSD_Report3_Fix` (`1vrL-4sV2Rx9AofjiBE7MC3I1i26OUsJk2NH1HUnllCs`):
  - §II.1 (`1. Replenishment, Purchasing and Receipt Tracking (FE-01)`): updated section heading, intro, `UC-01`, `UC-02`, `UC-03` (draft source-version refresh and whole-piece area rounding), `UC-07`, `UC-08`, `UC-09` (`Open order` terminology and whole-carton allowance), `UC-15`, `UC-16` to match the local baseline.
  - §II.3 (`3. Goods Inspection and Goods Receipt (FE-03)`): updated `UC-37` (actual verified lot acceptance, custody flow `UC-50`–`UC-54`, custody draft on held lines), `UC-40` (direct `Post`, volume estimation rule, approved Other receipt branch `UC-47`, postconditions), and `UC-41` (`UC-124`–`UC-128` reference); added full 6×4 UC tables for `UC-43`–`UC-54` (Other goods receipt and custody receipt workflows).
  - §III: removed `SC-xx:` / `SC-xx.y:` prefixes from all screen headings in §III (`1.1.1` through `22.1`); rewrote §III.4 and §III.5 (`4.1.1`–`5.2.2`, preserving existing screenshot `image24` in `4.1.1`) using local's 3-column requirement tables (`Field Name | Data Type / Required | Description`) and clickable Figma wireframe links without route paths, internal node IDs, or `Image to be inserted.` placeholders, and added `5.1.5 Goods Receipt Entry`, `5.2.1 Custody Receipt List`, and `5.2.2 Custody Receipt Detail`.
- Verification: `gdocs readonly read --json` and `readonly export --format md` confirmed 0 remaining `SC-` prefixes in §III headings, 0 occurrences of `Trần Minh`, 0 route-path dumps, and preserved `image24`; `npm run docs:check` passed in `be/`. Note: pre-existing UC-number collisions outside §II.1/§II.3 (e.g. `UC-11`–`UC-16` in §II.2, `UC-37`–`UC-54` in §II.4–§II.6) and the native Google Docs TOC refresh were not modified.

## 24 November 2026 - Report 3 purchasing and receiving specifications

- Revised §§II and III of [Report 3](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt). Purchase receiving ends at POSTED. Accountants open the PO for warehouse receiving and may order the smallest whole-carton quantity that covers the approval. Inspection records the actual verified lot, including a different lot of the same product. The Warehouse Staff Post action posts directly.
- Added purchase and receipt read cases, Other receipt and custody cases, and the referenced supplier-return agreement and acknowledgement. Aligned the affected UC headings, permission entries and screen links with the catalogue.
- Rewrote SC-06 to SC-08 as screen specifications with layout and field type, required condition and description. Updated 14 existing Figma frames and checked that all 19 visible tables have labelled headers and populated example rows. Archived the superseded purchase posting dialog.
- Verification covers the documentation checks, unique detailed UC identifiers, screen links, and Figma table content and bounds. The earlier business-flow diagram remains historical. No application or database changes.

## 24 November 2026 — Report 4 BF-01 Mermaid syntax fixes

- Fixed two message labels in §II.1.3.2 and §II.1.4.2 by replacing semicolons within the labels. Mermaid 12.2.0 reproduced both reported errors before the fix, parsed all 32 Mermaid blocks afterward, and rendered the eight BF-01 diagrams and the purchasing ERD as SVG.

## 24 November 2026 — Report 4 §II.1 (BF-01): UML design-level redraw of class and sequence diagrams

User request (24/11/2026): review and redraw all BF-01 diagrams (`docs/01_bao_cao/WMSD_Report4_Draft.md` §§II.1.1–1.4) at the design/specification UML level and align with the current backend source, then export a consolidated multi-page draw.io file (`docs/04_so_do/WMSD_BF01_Diagrams.drawio`). Documentation only; no code or data changed.

- Class diagrams (`1.1.1`, `1.2.1`, `1.3.1`, `1.4.1`): replaced file-path, collection-name, and runtime-status stereotypes with standard UML stereotypes (`<<controller>>`, `<<router>>`, `<<service>>`, `<<entity>>`, `<<interface>>`, `<<utility>>`); formatted attributes as `+name : Type` and operations with clean UML method signatures; split `ReplenishmentSource` (`<<interface>>`) realized by `SalesOrder`, `WarehouseIssueRequest`, and `Stocktake` and removed the `StockAndPurchaseData` bag; added `PurchaseOrderController`, `PurchaseReadService`, `CustodyRelease`, `PATCH /:id/destinations` (`changeDestinations`), custody resolution routes on `CustodyRouter`/`PurchaseCustodyService`, and `CLOSED` status on `CustodyReceipt`.
- Corrected stored-reference direction and multiplicities: `ApprovalHistory "0..*" --> "1" ReplenishmentRequest` (`subjectId`) alongside `latestDecisionId` (`0..1`), `PurchaseOrder "0..1" --> "0..1" ReplenishmentRequest`, `GoodsInspection "1..*" --> "1" GoodsArrival`, `CustodyReceipt "0..*" --> "0..1" GoodsInspection`, and `StockReversal "0..1" --> "0..1" StockTransaction` (`stockTransactionId`).
- Sequence diagrams (`1.1.2`, `1.2.2`, `1.3.2`, `1.4.2`): restored strict caller/callee message and return symmetry across `FE` ↔ `API` ↔ services (`ReplenishmentCommands`, `ReplenishmentEvaluation`, `PurchaseOrderCommands`, `PoReceivingService`, `PurchaseCorrectionService`, `StockUtils`), added actor triggers in `opt` blocks, added `GET /goods-inspections/:id/correction-preflight` and `PATCH /goods-receipts/purchase/:id/destinations`, and aligned route/command names with the codebase.
- Draw.io output: created `docs/04_so_do/WMSD_BF01_Diagrams.drawio` containing 8 tabs (`1.1.1`–`1.4.2`) built with native draw.io UML containers and sequence lifelines/fragments; exported all 8 pages via draw.io CLI (`draw.io.exe`) to PNG and visually inspected them for overlaps.
- Verification: `npm run docs:check` passed (3 identical instruction files, 61 collections, 1087 local links, change-log signals). Not checked: runtime application tests (unchanged code).

## 24 November 2026 — Report 3 (Google Doc): screen notes moved to §III, §II format cleanup

User request (24/11/2026): the Google Doc `WMSD_Report3_Fix` was edited by the user and showed format errors; screen notes must live in §III only. Edited the Google Doc directly through the Docs API; documentation only, no code or data changed.

- §II FE-01 and FE-03 (UC-01..16, UC-37..42): deleted the 22 italic `Screen(s): ...` paragraphs and the `Feature: ...; Screen: ...` line in each Description cell; removed the stray empty Heading 2 paragraph between each UC heading and its table.
- §III SC-06.1–SC-08.4: removed the stray empty Heading 2 before each field table, added a blank spacer paragraph after each table, restored the bold "Field Description" label, and added a "Use-case screens" line under each Wireframe note that maps every UC to its Figma frame and dialog nodes (04b: 46:6198–46:7053; 05b: 46:7117–46:7478).
- §II 7.22–7.29 (UC-119, 125, 127, 118, 121, 172, 173, 174): the labels and values were Heading 2 paragraphs; rebuilt each as the standard 6x4 UC table (merged value cells, reference column widths and borders, 8 pt text, one paragraph per step) with the original wording; the `Tracker UC-xxx:` prefix and `FE-07; SC-xx.` suffix were dropped from Description.
- Not done: the local mirror `docs/01_bao_cao/WMSD_Report3_Fix.docx.txt` was not re-exported and is now older than the Google Doc; table cell paragraph indentation of the 22 FE-01/FE-03 tables was not changed to the reference 4.55 pt; other §II blocks and the empty headings elsewhere in the document were not touched; the rendered Doc was not viewed.

## 24 November 2026 — Report 4 §II.1: RR, PO, goods inspection and goods receipt diagrams checked against code

User request (24/11/2026): check the §II class and sequence diagrams for RR, PO, goods inspection (ARR+INS) and purchase goods receipt against the code. Three read-only audits compared the diagrams with `src/modules/{replenishments,purchase-orders,po-receiving,goods-receipts}`, `shared/utils/stock.js` and the models.

- `docs/01_bao_cao/WMSD_Report4_Draft.md` §II.1.1–1.4 corrected, documentation only: collection `approval_history`; `availableStock()` is public; the trigger comes from `source.triggerType` instead of being derived; `approvedRevision` is saved on APPROVE only and REJECT stores `approvedQtyBase = 0`; 409 on review; permissions of RR cancel and evaluate; controller layer and `GET /:id/submissions/:version`.
- PO: full PUT body, `operationKey`/`expectedVersion` on close-remainder, create checks, expected-on date rule, cancel side effects, new `reopen` step, `receivingStatus` and `reopenable`.
- Inspection and receipt: purchase GET routes belong to `receiptRouter`; custody routes completed; `PurchaseCustodyService` added; PO becomes CLOSED instead of COMPLETED after a short-closed line; correction blockers include a live replacement inspection and supplier returns; missing `operationKey`/`arrivedAt` fields; `changeDestinations` call.
- A note under §II.1 explains that `RR-/PO-/ARR-/INS-/GR-` ids are placeholders for the Vietnamese type codes.
- Not checked: frontend, tests, role-to-permission seed. No code or data changed. Mermaid blocks were not rendered.

## 24 November 2026 — Report 4 BF-01 application flows and purchasing ERD

- Updated Report 4 §§I.3 and II.1 to match the current application. Separated RR draft edit and submission, documented the whole-carton approval limit for PO, and gated draft receipt creation on the inspection decisions.
- Documented purchase and supplier custody receipt posting, cancellation and reversal. Linked supplier returns to BF-08. The BF-01 application diagrams omit custody-to-purchase ownership acceptance and purchase receipt destination edits, which are API-only.
- Corrected ARR–INS cardinality in the ERD and traced transfer receipt PUTAWAY through the BF-04 requirement. Purchase receipt relocation points to BF-03.
- Verification used current FE and BE source, Mermaid 12.2.0 SVG rendering for all eight BF-01 diagrams and the purchasing ERD, and npm run docs:check. Application integration tests were outside this documentation check. The change affects report text and diagrams only.

## 24 November 2026 — MongoDB design overview

The [editable overview](docs/03_thiet_ke/DB_Current_2026-11-12_58/WMSD_DB_Design_Overview.drawio) and its PNG now show all 61 collections in the backend registry. The design removes `replenishment_locks` and adds `app_settings`, `api_endpoints`, and `error_logs`. Cards resize to fit their top-level fields, and each title divider spans the full card width. Embedded objects and arrays are collapsed to one line per field.

- After reviewing seven disconnected cards, the overview shows 59 edges. It connects system administration to users, approval and operation records to the audit log, return quantity claims to their request lines, and source locks to sales issue lines. The [relationship table](docs/03_thiet_ke/DB_Current_2026-11-12_58/WMSD_Overview_Relationships.md) records other verified targets, including audit subjects and alternate source-lock document types.
- All overview connectors now use the same solid line and omit text labels. The generated diagram follows the saved layout without a title or legend block.
- The separate [full relationship diagram](docs/03_thiet_ke/DB_Current_2026-11-12_58/WMSD_DB_Design_Full_Relationships.drawio) and its PNG cover 488 directed collection pairs across 61 collections. The diagram groups 1,580 reference rows by pair and lists their field paths on hover. Nine connector layers include a layer for pairs declared only by shared embedded variants. The 633 context-dependent rows without a specific target remain in the relationship table. Run `node scripts/generate-db-overview.mjs --full` to regenerate the full diagram.
- `node scripts/generate-db-overview.mjs --check` verifies that the editable diagram and table match the generated output. The follow-up layout check confirmed a connector for each of the seven cards and zero crossings through unrelated cards. The PNG was inspected at full size and contains the editable graph. The validator reported 21 connector crossings, shown with line jumps in the render.
- This update changes documentation and its generator. The registry inspection ran offline, without database access, migration, or data writes.
- Later on 24 November, at the user's request and following the subject-area split of the reference Software Design Document, the editable overview gained ten tabs after the unchanged "Tổng quan thiết kế CSDL" tab: Phân quyền và quản trị hệ thống, Phê duyệt và nhật ký, Danh mục hàng hóa, Kho và tồn kho, Kiểm kê và điều chỉnh, Xử lý hàng lỗi, Mua hàng và nhập kho, Bán hàng và xuất kho, Trả hàng, Điều chuyển kho. Each collection appears in full on exactly one tab. A collection from another tab appears as a key-only card when one of the 59 overview connectors reaches it. The generator asserts both rules. The overview tabs keep the Helvetica font of the saved file, and the full relationship diagram keeps its fonts. Before the split, the generated fields, connectors and cardinalities matched the saved diagram and the current 61-collection registry, so no model change was needed. `--check` and `--full --check` pass, and each new tab was exported with draw.io Desktop and inspected. No new PNG was exported into the repository. The existing PNG shows the first tab.
- After the split, the user asked to connect the cards that had no overview connector. The overview and group tabs now show 66 connectors. The seven new ones come from existing schema references: `customers` → `sales_orders` (`header.customerId`, 0..1 ↔ 0..n), `customers` → `sales_invoices` (`customerId`, 1 ↔ 0..n), `delivery_orders` → `sales_goods_issues` (`header.deliveryOrderId`, 0..1 ↔ 0..n), `warehouses` → `opening_stocks` (`header.warehouseId`, 0..1 ↔ 0..n) and `supplier_returns` → `custody_releases` (`acknowledgements[].header.supplierReturnId`, 0..n ↔ 0..n). The two compatibility links `sales_orders` → `warehouse_issue_requests` and `warehouse_issue_requests` → `delivery_orders` are required in the header schema, so they are drawn 1 ↔ 0..n. The generator asserts each Mongoose cardinality against its schema. At the user's follow-up request, `users` → `attachments` (`uploadedBy`, 1 ↔ 0..n) was added, which brings the total to 67 connectors. The "Phân quyền và quản trị hệ thống" tab now places `attachments` beside `api_endpoints`, so connectors do not share segments. The incoming `evidenceIds` links from about 31 collections and the `replacesAttachmentId` self-reference stay off the diagram and remain in the relationship table. `system_events` has no fixed target, because the meaning of `sourceId` depends on `sourceType`. The "Mua hàng và nhập kho" and "Bán hàng và xuất kho" tabs were rearranged to avoid overlapping lines. The relationship table marks the new rows as drawn. The overview PNG was re-exported from the first tab at the same size, with the diagram embedded. `--check`, `--full --check` and docs:check pass, and the changed tabs were inspected after export.

## 24 November 2026 — Report 3 §II and §III: RR, PO, goods inspection and goods receipt

User request (24/11/2026): complete the use case specifications (§II) and functional requirements (§III) for the replenishment request, purchase order, goods inspection and goods receipt flows, in the Report 3 template format. Decisions: core use cases only (read-only use cases refer to §III); follow the code where it differs from the older SRS text; PO remainder closure is one step by the Accountant.

- `docs/01_bao_cao/WMSD_Report3_Fix.docx.txt` §II: replaced the old UC-01–UC-16 blocks (FE-01) and the old UC-37 block with template-format specifications using the §4.2 numbering: UC-03, 04, 05, 06, 09, 10, 11, 12, 13, 14 (FE-01) and a new "3. Goods Inspection and Goods Receipt (FE-03)" section with UC-37, 38, 39, 40, 41, 42. Other §II blocks keep the old numbering and are unchanged.
- §III: SC-06, SC-07 and SC-08 rewritten as screen sections (SC-06.1–SC-08.4) with a description mapped to UCs and a field table. Wireframe images are not inserted; each block names the Figma frame (node id) to use.
- §4.2 and §4.4: UC-04, UC-05, UC-12 wording aligned with the code (draft-only update, approve or reject without return, one-step PO closure with optional evidence).
- Code facts used: replenishment `REVISE`/return removed 22/11/2026, purchase put-away removed 17/11/2026, PO close-request/approval/execution commands removed (single `close-remainder`), no discrepancy record in the receiving modules, PO becomes CLOSED instead of COMPLETED when a line was short-closed.
- Not changed and now stale against these specifications: BF-01 main flow steps 5–9 and the 01.X table (put-away, discrepancy record, Owner approval of closure), §4.3, §5.1 SC-08 linked UCs, other §II blocks with the old numbering.
- Figma (file 5e8V5HPezbC53OEUnbKhIU): created 18 dialog wireframes in two new sections, 04b (12 dialogs for RR and PO, node 46:7112) and 05b (6 dialogs for goods inspection and goods receipt, node 46:7537). Their node ids are cited in the `Screen(s)` notes of §II and the wireframe notes of §III. Existing frames are unchanged.
- Validation: manual comparison of UC IDs and names with §4.2; `npm run docs:check` result is recorded in the task report.

## 24 November 2026: Report 3 English prompt catalogue (174 UCs)

The user approved a 174-UC catalogue for [the English prompt set](docs/07_ra_soat/Doi_chieu_GoogleDocs_2026-10-27/03_Prompts_Report3.md). Section 4.2 of [English replacement part 03](docs/07_ra_soat/Doi_chieu_GoogleDocs_2026-10-27/Report3_English_Replacements/03_Catalogue_Permissions_and_Interfaces.md#replacement-content) now contains 174 active UCs, numbered by feature using WBS order. The catalogue retains 155 of the 158 baseline UCs and adds 19 confirmed WBS operations.

- Direct sales keeps all five Sales Order UCs. UC-94 to UC-96 use the Excel names. UC-97 and UC-98 keep distinct update and cancellation operations. Sales confirms receipt on the posted issue, and the order reaches DELIVERED. Sales picking, old goods issue approval and external payment confirmation are outside this catalogue. Transfer picking stays.
- The catalogue incorporates scheduled low-stock scans, automatic notification emails, empty-location count corrections and adjustment reads in the relevant UC descriptions. UC-170 retains the WBS name Manage API Endpoint Permissions. Its description reflects the current API endpoint catalogue maintenance operation.
- The new replacement block applies only to section 4.2. Actor associations, permissions, system functionality and detailed specifications still use the historical 97-UC numbering and need a separate update before they can accompany the 174-UC table. This documentation update changes no behaviour or data.
- Applied the same 174 UC names, descriptions and numbering to [Report 3 section 4.2](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt), using its existing four-column layout. Report 3 sections 4.3 and 4.4 and the detailed specifications retain their previous identifiers.
- Validation: checked 174 unique sequential IDs, feature counts, the agreed additions and removals, Sales Order names, in-table references, local links, the replacement boundary and preservation of historical content. `npm run docs:check` and `git diff --check` passed.

## 25/11/2026 — Tách controller cho chuyển kho và chuyển vị trí

Theo yêu cầu người dùng, hai luồng dùng Route → Controller → Service → Model. BF04 chuyển các handler đọc và ghi từ route sang một controller chung. Gộp route, service và validation đọc/ghi thành một file mỗi lớp. Tập trung schema chênh lệch trong validation, giữ nghiệp vụ chênh lệch, kiểm tồn và hoàn tất trong các file riêng theo chức năng. Kiểm tra sau khi gộp qua 19 test, 20 handler và 6 request HTTP với model giả lập. Các test MongoDB vẫn chưa bật. Gỡ file dẫn BF04_API.md trùng trong module và cập nhật các liên kết tài liệu thiết kế hiện hành về hợp đồng chính. BF03 gọi trực tiếp service từ controller, bỏ file xuất lại hàm lifecycle. URL, payload, quyền, nghiệp vụ và model giữ nguyên. Không cần migration. Xem [BF04](docs/08_api/transfers/BF04_API.md) và [BF03](docs/08_api/location-movements/README.md).

Kiểm tra 25 test liên quan đạt, một test MongoDB bỏ qua. Smoke test HTTP với model giả lập qua bảy request. Chưa chạy giao dịch trên MongoDB.

## 25/11/2026 — Add the return workflows controller layer

The shared workflow router delegates HTTP handling for customer returns, supplier returns and shared endpoints to a controller. Existing routes, permissions, validation, evidence cleanup and stock behavior are unchanged. No schema or data migration.

## 25/11/2026 — Add the Goods Issue controller layer

Goods Issue and picking confirmation now delegate HTTP response handling to a controller. Existing routes, validation, permissions, service calls and stock transactions are unchanged. No schema or data migration.

## 25/11/2026 — Let Sales return goods from a Warehouse-issued standalone sale

Sales can create a customer-return request from a posted standalone SALE Goods Issue created by Warehouse when it has an external reference and is in the selected warehouse. This source path uses the posted issue quantity and outstanding return claims; it does not require a Sales Order or a customer-receipt confirmation. Other source, warehouse and quantity checks remain enforced. A focused integration test reproduces the Warehouse-created source and verifies Sales can select it and create the request in an isolated database.

## 25/11/2026 — Notify the requester about supplier acknowledgement and closure

`ACK_SR` now notifies the original supplier-return requester after the Accountant records the supplier response; `CLOSE_SR` sends a final notice when the return completes. The existing worker enforces source-read and warehouse scope and deduplicates each event per recipient. Regression coverage verifies both notices in the isolated supplier lifecycle without changing stock behavior. No schema, index, permission or shared-database change.

## 25/11/2026 — Seed tiếng Việt và sửa lỗi UX theo vai trò

Nguồn: yêu cầu người dùng 25/11/2026 ("dữ liệu đưa vào DB là tiếng Việt", sửa lỗi chung rồi Admin, Owner, Warehouse, Sales, Accountant theo báo cáo kiểm thử UX/UI).

- **BE seed:** tên vai trò, họ tên, mô tả kho, vật liệu, số tham chiếu, email/điện thoại mẫu đổi sang tiếng Việt; bỏ chữ "demo" trong ghi chú. Xem [SEED_CUA_HANG_GACH](docs/09_phat_trien/SEED_CUA_HANG_GACH.md).
- **BE API:** kiểm tra định dạng điện thoại/tên đăng nhập khi tạo/sửa tài khoản ([USER_ACCESS_STATUS](docs/08_api/USER_ACCESS_STATUS.md)); `GET /api/warehouse-overview` thêm `openPutaways`, `openPicks`, `draftIssues` ([HIEUDT_WAREHOUSE_SCOPE](docs/08_api/HIEUDT_WAREHOUSE_SCOPE.md)).
- **FE chung:** tiêu đề báo cáo thống nhất, trang 403 tiếng Việt, đăng nhập không nháy "Đang xác thực", nút Xuất Excel có lý do khi bị khoá, cột Thao tác ghim phải, ẩn cột trống, ngày giờ dạng DD/MM/YYYY HH:mm.
- **Admin:** cảnh báo kho ngừng hoạt động, lỗi form tạo tài khoản có tổng hợp, mô tả quyền khi rê chuột, nhật ký ẩn mã hex, danh mục API ẩn tên trùng URL.
- **Owner:** danh sách Đơn bán/Lệnh giao/Soạn hàng có breadcrumb, mô tả, tag trạng thái; diện tích UOM hiển thị m²; Chuyển kho gộp số đếm vào hàng lọc; Hàng lỗi thu gọn bộ lọc lô/vị trí.
- **Warehouse:** Tổng quan kho có danh sách việc cần làm; kế hoạch kiểm kê có breadcrumb và chặn tiêu đề vô nghĩa; số phiếu kiểm hàng không ngắt dòng; chọn tháng phiếu nhập bằng Select; trạng thái rỗng Trả NCC có nút tạo.
- **Sales:** đăng nhập vào "Tổng quan bán hàng" (có số đơn/lệnh giao đang mở); form Tạo đơn bán chia khối Chứng từ gốc/Khách hàng/Hàng trong đơn/Giao hàng, mặc định giao một lần, có tổng tiền tham chiếu; tooltip "Khả dụng"; nhóm menu "Bán hàng & xuất kho" cho mọi vai trò.
- **Accountant:** trang "Tổng quan kế toán" làm trang đáp; modal tạo đơn mua hướng dẫn trước khi chọn đề nghị; Tham chiếu chứng từ ngoài có trạng thái rỗng tiếng Việt.
- **Bổ sung cùng ngày:** Nhật ký hệ thống có nút Xuất Excel và chế độ "Gộp theo đối tượng"; Danh mục API có chế độ "Theo module" (`GET /api/system/api-endpoints` thêm `moduleCounts`, xem [SYSTEM_ADMIN](docs/08_api/SYSTEM_ADMIN.md)); bộ lọc thu gọn sau nút "Bộ lọc (N)" trên điện thoại (Phiếu nhập kho, Nhật ký, Danh mục API); trang đang tải dùng khung xương thống nhất thay vòng quay giữa màn hình; `.admin-page` (Tài khoản, Vai trò) bỏ căn giữa dọc nên tiêu đề không còn nhảy khi tải.
- **Dữ liệu/triển khai:** không ghi DB. Cần seed lại và `npm run seed:sync-permissions` trên DB đích (có lệnh triển khai) để thấy dữ liệu tiếng Việt và quyền mới.
- **Kiểm tra:** xem báo cáo bàn giao 25/11/2026 (BE `node --test` các test liên quan, FE `tsc --noEmit` và vitest).

## 25/11/2026 — Cấu hình hệ thống do Admin đặt

Quyết định người dùng: Admin cấu hình các con số thay vì cố định trong mã — ngưỡng tồn tối thiểu mặc định (cho sản phẩm có tồn nhưng chưa đặt ngưỡng riêng), mức cảnh báo "Sắp hết" (%) và số dòng trên bảng điều hành; Admin sửa, Chủ cửa hàng xem.

- **BE:** `GET/PUT /api/settings/system`, quyền `system_setting:read` (ADMIN, OWNER) / `system_setting:update` (ADMIN), `app_settings.SYSTEM_SETTINGS` có version và audit `UPDATE_SYSTEM_SETTINGS`. Cảnh báo tồn thêm trạng thái `NEAR` và trường `source`; bảng điều hành đọc số dòng từ cấu hình. Xem [SYSTEM_ADMIN](docs/08_api/SYSTEM_ADMIN.md#cấu-hình-hệ-thống--25112026).
- **FE:** màn hình `/system/settings` "Cấu hình hệ thống" (nhóm Quản trị hệ thống), lịch sử thay đổi; `/inventory/stock-alerts` có lọc Sắp hết và cột Loại ngưỡng.
- **Dữ liệu/triển khai:** không ghi DB. Cần chạy `npm run seed:sync-permissions` trên DB đích để có 2 quyền mới. Giá trị mặc định giữ hành vi cũ.
- **Kiểm tra:** BE `node --test test/system-admin.test.js`; FE vitest `src/features/system-admin src/features/dashboard src/app`, `tsc --noEmit`, eslint.

## 25/11/2026 — Sửa lỗi ưu tiên sau kiểm thử UX/UI và Việt hoá giao diện

Nguồn: báo cáo kiểm thử UX/UI 25/11/2026 và quyết định của người dùng (bỏ toàn bộ chính sách bán hàng theo LI-10; đổi tên hiển thị vai trò kế toán thành "Kế toán"; đưa màn hình FE-06 vào menu).

- **BE:** gỡ `GET/PUT /api/settings/sales-policy`, `sales-policy.service.js` và quyền `sales_policy:read/update` (route trả 404; quyền cũ trong DB không còn hiệu lực). Ngưỡng lô tồn lâu cố định 180 ngày. `POST /api/stock-alerts/scan` chuyển sang quyền `product:update`. Cảnh báo tồn tính song song (bảng điều hành Chủ cửa hàng mất ~8 giây). Giám sát server trả `memory: null` và thời gian chạy theo đồng hồ khi nền tảng (Workers) báo 0. Tên vai trò hệ thống và mô tả quyền trả về tiếng Việt khi hiển thị (`src/shared/utils/roleNames.js`, `role.service.js`, `permissions.data.js`).
- **FE:** màn hình `/inventory/stock-alerts` "Cảnh báo tồn thấp" thay `/settings/sales-policy`; bỏ badge cứng "12"/"Chờ duyệt" trong menu; thêm Lệnh giao hàng, Soạn hàng, Giao thất bại, Báo cáo chuyển kho vào menu; mỗi màn hình một tên cho mọi vai trò, tiêu đề viết hoa đầu câu; antd/dayjs dùng locale tiếng Việt ("No data" → "Không có dữ liệu"); nhãn trạng thái thiếu (`IN_PROGRESS`...), ngày ISO trong báo cáo vận hành, mã thao tác thô ở danh sách nhật ký; chọn ảnh chứng từ tiếng Việt và nút phụ trong form tạo đơn bán; `/purchase-orders/create` chuyển về `/replenishments`; bỏ breadcrumb "Trang chủ" lặp; trang Tổng quan bán hàng chỉ còn lối tắt tới màn hình thật; giám sát server cảnh báo email chưa cấu hình.
- **Tài liệu:** [SYSTEM_ADMIN](docs/08_api/SYSTEM_ADMIN.md).
- **Dữ liệu:** không ghi DB. Bản ghi `app_settings.SALES_POLICY`, quyền `sales_policy:*` và tên vai trò tiếng Anh trong DB còn nguyên. Chưa cấu hình email, chưa dọn dữ liệu test.
- **Kiểm tra:** BE `node --test test/system-admin.test.js test/auth-account.test.js test/user-account-update.test.js`; FE `tsc --noEmit`, vitest các test liên quan (xem báo cáo bàn giao).

## 25/11/2026 — Receipt routes consolidated under /receipts

The duplicate goods receipt detail route `/receipt/:id` is removed; `/receipts/:id` is the only detail URL. The transfer put-away launcher moves from `/transfer-putaway/:id` to `/receipts/:id/putaway`. It keeps the same permissions (`stock_transfer:read` + `stock_transfer:receive`) and the same behaviour: create or reuse the PUTAWAY task, then open `/transfer-tasks/:id`. FE `context.md` is updated to the new URL. No API or data change.

## 25/11/2026 — Sales order and delivery schedule

New sales orders keep customer name and phone, external-source evidence and pricing. Creation writes the order, predicted deliveries and FIFO reservations together. Existing direct sales and legacy permissions remain available for historical workflows. See [Sales delivery schedule](docs/08_api/SALES_DELIVERY_SCHEDULE.md).

## 24/11/2026 — Mở lại kết nối MongoDB của Worker

Kiểm tra trạng thái Mongoose trước API và tác vụ theo lịch. Tái sử dụng pool khi còn kết nối và chia sẻ lần mở lại khi pool bị ngắt. Hành vi 503 giữ nguyên khi kết nối thất bại. Xem [hướng dẫn Cloudflare](docs/09_phat_trien/CLOUDFLARE_WORKERS.md).

## 24 November 2026 — Warehouse Staff may update product lots

User decision (24/11/2026): Warehouse Staff may update existing product lot information, not only create lots. Same guards as for the Store Owner: lot identity and carton specification cannot change once the lot has documents or stock.

- `be/src/seeds/data/permissions.data.js`: `product_lot:update` now granted to OWNER and WAREHOUSE.
- `fe/src/shared/hooks/useCurrentRole.ts`: warehouse default permissions include `product_lot:update`, so the lot edit button shows for Warehouse Staff.
- Existing databases keep the old grant until `npm run seed:sync-permissions` is run; that command resets the default roles to the seed permission list.
- Report 3: UC-27 Update Product Lot Information lists Warehouse Staff in §4.2, §4.3, §4.4 and the UC-27 specification.
- Validation: FE `useCurrentRole` and lots tests pass; BE permission/lot integration tests were skipped (no test MongoDB in this run).

## 24 November 2026 — Report 3 §4.2/§4.3: use-case catalogue reconciled with code

User decisions (23–24/11/2026), after reconciling the catalogue with the backend routes, frontend screens and the five use-case diagrams: one use case covers exactly one user operation (an approve/reject/return decision is one "Review" operation); keep only use cases implemented in both backend and frontend and reachable from the menu; the delivery scope is dropped; in the replenishment, purchase order, goods inspection and purchase receipt groups, saving a draft and sending it on (submit, issue, confirm) are steps of the creating use case, while editing a draft stays a use case of its own. Docs-only: no code, model, API or data change.

- `docs/01_bao_cao/WMSD_Report3_Fix.docx.txt` §4.2 now lists 159 use cases, UC-01–UC-159, numbered consecutively by feature; §4.3 actor associations are regenerated from the same list and current role permissions.
- Removed: Outbound Delivery list/details/create, Picking Task list/details, Issue Request list/details/create/update/cancel, Inspect Failed-Delivery Intake, the three fulfilment-option UCs, Close Stocktake Without Variance, Propose/Confirm/Approve Stocktake Resolution, and the inventory adjustment request list/details (legacy page, not in the menu).
- Merged: Cancel Unreceived PO Remainder + Close Purchase Order → Close Purchase Order; Create goods receipt from PO → Create Goods Inspection; Evaluate Replenishment Suggestions → Create/Update Replenishment Request; Approve Stocktake Resolution and Close Without Variance → Approve Stocktake Differences; Inspect and Post Transfer Receipt → Post Transfer Receipt (one API command); Submit Replenishment Request → Create/Update Replenishment Request; Issue Purchase Order → Create Purchase Order; Confirm Goods Inspection → Create Goods Inspection.
- Added or split: Reopen Purchase Order, Cancel Purchase Order, Update Purchase Order (DRAFT only); Update Goods Inspection (DRAFT only); Create/Update/Submit/Review Other Goods Receipt (outside the merged groups, so Submit stays); Update UOM, Change UOM Status; View Warehouse List/Details; Post and Cancel Opening Stock Document; Create/Cancel Transfer Dispatch, Create/Confirm Transfer Picking Task, Confirm Transfer Put-away Task, Propose Transfer Difference; Receive Undelivered Goods; Record Supplier Return Agreement/Acknowledgement, Close Supplier Return; Record Stocktake Difference Reason; Change Stocktake Plan Status; Reset Own Password by Email; View Role List, Create Role, Update Role Permissions.
- Kept on user decision: Inspect Customer Return (includes reassessment) and Post Customer Return Receipt (includes hand-back); no separate Change Staff Account Email. Custody UCs (reinspect, resolution decision, convert to purchase receipt, release) stay although the frontend has no screen for them yet — pending user decision.
- §4.4 permission matrix regenerated for UC-01–UC-159: one row per use case, existing cell wording reused where the operation and role are unchanged, new rows default to View / Perform within existing scope, Sign in and Reset Own Password are "Own account" for every role.
- Not changed, still on the old numbering: the heading under II, business-flow/data-rule tables and the use-case specifications.
- Validation: UC-01–UC-159 contiguous, names unique (script check); `npm run docs:check`.

## 23/11/2026 — Mở lại PO đã đóng sau khi đảo phiếu nhập

**Quyết định.** User, 23/11/2026: chọn phương án A (lệnh mở lại PO) cho trường hợp PO `CLOSED` có phiếu nhập bị đảo; và PO có dòng đã chốt thiếu, khi nhận hết phần còn lại, về `CLOSED` thay vì `COMPLETED`. Bổ sung, không thay, quyết định 11/11 (đảo phiếu giữ `CLOSED`) và 16/11 (lượng chốt thiếu không hoàn tác).

**Lý do.** Trước đây PO đóng sau chốt thiếu mà bị đảo phiếu nhập sẽ treo phần chưa nhận: không kiểm/nhập lại được (`activePo` chỉ nhận `OPEN`/`PARTIAL`), không chốt thiếu tiếp được, cũng không lập PO thứ hai từ cùng RR.

**Hành vi.** `POST /api/purchase-orders/:id/reopen` (`purchase_order:update`, lý do bắt buộc, AuditLog `REOPEN_PURCHASE_ORDER`, thông báo kho). Chỉ cho PO `CLOSED` còn dòng chưa nhận; về `PARTIAL` hoặc `OPEN`; gỡ `closedAt`, giữ `closureReason` và `cancelledRemainderQtyBase`. Chi tiết PO trả `reopenable`. `postReceipt` đặt `CLOSED` + `closedAt` khi hết phần chưa nhận mà có dòng chốt thiếu. Báo cáo vận hành nhóm mua hàng trừ thêm lượng chốt thiếu khỏi lượng chưa nhận và không còn ép PO `CLOSED` về 0. FE: nút "Mở lại đơn" trên chi tiết PO cho Kế toán; hộp thoại đảo phiếu nhập nhắc PO đã đóng vẫn giữ đóng.

**Tệp.** BE: `purchase-order.service.js` (`receivingStatus`, `reopenable`), `purchase-order.commands.js`, `purchase-order.commands.routes.js`, `purchase-correction.service.js`, `po-receiving.service.js`, `notifications/rules.js`, `operational-reports.service.js`, `test/native-api.integration.test.js`. FE: `purchaseOrdersApi.ts`, `ReopenPurchaseOrderModal.tsx`, `PurchaseOrderDraftActions.tsx`, `PurchaseReceiptReverseModal.tsx`, `PurchaseOrderDraftActions.test.tsx`. Tài liệu: [NATIVE_MODEL_RUNTIME](docs/08_api/NATIVE_MODEL_RUNTIME.md), [HUONG_DAN_CODE_RR_NHAP_CAT_HANG](docs/09_phat_trien/HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md), sơ đồ lớp Report 4, `docs/rtm.md`, `src/models/CHANGELOG.md`, FE `context.md` và `docs/rtm.md`.

**Dữ liệu.** Không đổi model, không cần migration. PO đã ở `COMPLETED` dù có dòng chốt thiếu (theo quy tắc cũ) giữ nguyên trạng thái.

**Còn lại (lỗi có sẵn, chưa sửa).** Đảo phiếu nhập có nguồn giữ hộ trả hàng về số dư NCC; nhập lại phần đó phải qua luồng chấp nhận hàng giữ hộ, không lập phiếu kiểm mới. `pendingRequestQuantity` tính lại phần duyệt RR chưa dùng khi PO mở. Lập phiếu kiểm thay thế không khóa PO nên có thể chạy chồng với chốt thiếu.

**Kiểm thử.** BE, MongoDB local `rs0`: `RUN_NATIVE_API_TESTS=1 node --test test/native-api.integration.test.js test/operational-reports.test.js test/replenishment-evaluation.integration.test.js` đạt 70/70, không bỏ qua ca nào. Ba ca mới gồm: mở lại về `OPEN` (400 sai trạng thái/không còn lượng chưa nhận, 403 Owner, 409 sai phiên bản, body lạ 400, phát lại cùng `operationKey`, audit, hủy PO vẫn bị chặn, nhập lại thì về `CLOSED`, đảo lần nữa giữ `CLOSED`); hai lệnh mở lại song song về `PARTIAL` chỉ ghi một lần, báo cáo mua hàng và `reconcilePurchasing` khớp, chốt thiếu lại; chốt thiếu một phần rồi nhận hết thì `CLOSED`. `npm run docs:check` đạt. FE: `npx vitest run src/features/purchase-orders` 86/86, `npx tsc --noEmit` đạt. Trình duyệt (BE và FE trên DB local `wmsd_reopen_check`, seed demo): dựng PO 100 → nhập 80 → chốt thiếu 20 → đảo phiếu bằng service; Kế toán thấy "Mở lại đơn", bỏ trống lý do thì báo lỗi, mở lại được → "Chờ nhận hàng"; Thủ kho "Kiểm hàng" 80 rồi "Nhập kho" → PO "Đã đóng", có `closedAt`, AuditLog `REOPEN_PURCHASE_ORDER`, sự kiện thông báo được tạo; console không lỗi. Chưa chạy toàn bộ suite. Tài liệu báo cáo: thêm mô tả lượng chưa nhận nhóm `purchases` vào [OPERATIONAL_REPORTS](docs/08_api/OPERATIONAL_REPORTS.md).

## 23 November 2026 — Report 3 §4.2: Inspect and Post use cases split

User decision (23/11/2026): "Inspect and Post" must not be one use case in the report; scope limited to §4.2 of Report 3 with the following UCs renumbered. Docs-only: no code, model, API or data change.

- `docs/01_bao_cao/WMSD_Report3_Fix.docx.txt` §4.2: UC-33 "Inspect and Post Goods Receipt" is now UC-33 Inspect Goods Receipt + UC-34 Post Goods Receipt; old UC-114 "Inspect and Post Transfer Receipt" is now UC-115 Inspect Transfer Receipt + UC-116 Post Transfer Receipt. The catalogue is 166 UCs, UC-01–UC-166 (old UC-34–UC-113 shift +1, old UC-115–UC-164 shift +2). UC IDs cited inside §4.2 descriptions follow the new numbers; the old UC-114 citation became UC-115, UC-116. Descriptions of the four new rows only partition the existing UC-33/UC-114 text.
- Not changed, so still on the old numbering: the heading under II, §4.3 actor associations, §4.4 permission matrix, business-flow/data-rule tables and the use-case specifications (UC-37 and UC-114/UC-120 there are still the combined "Inspect and Post"); the Project Tracking WBS sheet and `WMSD_Report3_Fix_UC_renumbered.docx` (outside the repository), so §4.2 no longer matches the WBS order; `src/seeds/data/permissions.data.js` `uc` traces and `docs/rtm.md`.
- Transfer receipt is one step in the current API (a destination user receives against the posted TD); the split exists in the report only. Not verified against code.
- Validation: UC-01–UC-166 sequence checked contiguous in §4.2; spot-checked shifted IDs and in-description citations; `npm run docs:check`.

## 23 November 2026 — MongoDB design overview layout

The user requested a single canvas for the MongoDB overview used in the graduation report. Removed the group frames, placed related collection cards closer together and routed connections through the gaps. Refreshed the matching PNG export.

Verified that all 59 collection cards and 74 connections retain their original content and endpoints. Checked the rendered diagram for overlapping cards, labels and shared wire segments. The update affects diagram presentation only and requires no migration.
## 23/11/2026 — Sửa đóng gói API catalogue trên Cloudflare

Dùng Router do Express xuất ra trong routeRegistry.js để Wrangler phân giải được dependency sau khi cài pnpm production. Xem [hướng dẫn Cloudflare Workers](docs/09_phat_trien/CLOUDFLARE_WORKERS.md).

## 23/11/2026 — Quản trị hệ thống, dashboard thật, cảnh báo tồn, email, tìm kiếm, dọn mã

**Quyết định.** Yêu cầu của người dùng ngày 23/11/2026 (11 hạng mục, liệt kê trong [SYSTEM_ADMIN](docs/08_api/SYSTEM_ADMIN.md)).

**Hành vi.** README BE có mục "Tài khoản demo"; trang đăng nhập không còn hiển thị/điền sẵn tài khoản. `/owner` và Chính sách bán hàng & ngưỡng kho đọc/ghi DB. Thêm Nhật ký hệ thống, Danh mục API (lưu DB, đồng bộ từ router, admin thêm/sửa), Giám sát server + nhật ký lỗi, tìm kiếm nhanh (Ctrl+K), cảnh báo tồn dưới ngưỡng (thông báo + email), gửi email cho mọi thông báo. "Lần đăng nhập cuối" lấy từ `users.lastLoginAt`. Bỏ menu "Cài đặt hệ thống".

**Dữ liệu và hợp đồng.** Thêm collection `app_settings`, `api_endpoints`, `error_logs` (58 → 61), trường `users.lastLoginAt`, 2 index `audit_logs`, 7 quyền mới, 17 endpoint mới. Cần `npm run seed:sync-permissions` trên DB đang chạy. Biến môi trường tuỳ chọn `NOTIFICATION_EMAIL`, `LOW_STOCK_SCAN_MINUTES`. Cập nhật MODEL_MAP, từ điển dữ liệu và ERD (sinh lại bằng script), `src/models/CHANGELOG.md`, ba file hướng dẫn agent, `context.md`.

**Dọn mã.** FE xoá 251 file không còn tham chiếu (trang giả lập cũ và test chỉ kiểm tra chúng). BE không có file thừa.

**Kiểm thử.** BE: `test/system-admin.test.js` mới; toàn bộ `node --test test/*.test.js` 297 đạt, 136 bỏ qua (cần DB tích hợp), lỗi duy nhất phát sinh (`public-routing`: router gốc chặn 404 thành 401) đã sửa và chạy lại đạt. FE: `systemAdmin.test.tsx` mới; toàn bộ vitest còn 14 lỗi đều đã có trên bản `main` gốc (xuất kho chuyển kho 5, phiếu nhập 2, kiểm kê 1, chuyển kho 2, tạo tài khoản 4), 2 lỗi do thay đổi (phân nhóm menu, quyền `/owner`) đã sửa.

**Giới hạn.** `/issue-requests` và `/lots/create` vẫn dùng dữ liệu giả; 4/5 trường chính sách chưa áp dụng tự động; số liệu yêu cầu của theo dõi server tính trong bộ nhớ từng tiến trình.

## 23/11/2026 — Quên mật khẩu: chọn nhận OTP hoặc mật khẩu mới

**Quyết định.** Người dùng yêu cầu ngày 23/11/2026: người quên mật khẩu được chọn nhận OTP (rồi tự đặt mật khẩu) hoặc nhận mật khẩu mới ngẫu nhiên như trước.

**Hợp đồng.** Thêm `POST /api/auth/forgot-password/otp` và `POST /api/auth/forgot-password/reset` (công khai). `POST /api/auth/forgot-password` giữ nguyên. Tách lõi OTP thành `src/shared/utils/otpChallenge.js`, `emailChange.js` dùng lại lõi này (hành vi không đổi). Chính sách mật khẩu tự chọn dùng chung một quy tắc trong `auth.validation.js`. Không đổi schema, quyền hay seed. Chi tiết: [USER_ACCESS_STATUS](docs/08_api/USER_ACCESS_STATUS.md#quên-mật-khẩu-bằng-otp--23112026).

**Kiểm thử.** `node --test test/forgot-password-otp.test.js test/email-change-otp.test.js test/auth-account.test.js test/user-account-update.test.js test/user-status-commands.test.js test/user-status-validation.test.js test/auth-logout.test.js`: 49/49 đạt (model được mock). FE: thêm `ForgotPasswordPage.test.tsx`; tsc, eslint và vitest `src/features/auth`, `src/features/profile`, `src/features/accounts/detail` đạt. Chạy thử trên DB nháp local `wmsd_profile_review_20261123`: chọn OTP ở `/forgot` cho `banhang01` → nhận mã, đặt mật khẩu mới qua UI → mật khẩu cũ 401, mới 200, audit `RESET_PASSWORD`, thư báo gửi tới email tài khoản; email không tồn tại nhận cùng thông báo và cùng dạng dữ liệu, không có thư nào được gửi. Đã xem UI ở 1440px và 390px.

**Giới hạn.** Lỗi gửi thư với tài khoản có thật trả 502/503 nên có thể để lộ email tồn tại (giống cách nhận mật khẩu mới). Bộ đếm OTP trong bộ nhớ tiến trình.

## 23/11/2026 — Đổi email bằng OTP (tự đổi và quản trị viên)

**Quyết định.** Người dùng yêu cầu ngày 23/11/2026: người dùng được đổi email nhưng cần OTP; quản trị viên đổi email cho người dùng cũng cần OTP; bỏ hiển thị mã tài khoản ở trang Thông tin tài khoản. Gửi OTP tới email mới là lựa chọn triển khai, ghi trong tài liệu API.

**Hợp đồng.** Thêm `POST /api/auth/me/email/otp`, `POST /api/auth/me/email`, `POST /api/users/:id/email/otp`, `POST /api/users/:id/email`. `PUT /api/users/:id` không còn nhận `email` (400). Audit mới `CHANGE_EMAIL`. Không đổi schema, quyền hay seed. Chi tiết: [USER_ACCESS_STATUS](docs/08_api/USER_ACCESS_STATUS.md#đổi-email-bằng-otp--23112026).

**File.** `src/shared/utils/emailChange.js` (mới), `src/modules/auth/*`, `src/modules/users/user.{routes,controller,service,validation}.js`, `test/email-change-otp.test.js` (mới), `test/user-account-update.test.js` (theo hợp đồng mới; hai ca lỗi sẵn do kiểm tra trùng email chưa được mock nay đạt).

**Kiểm thử.** `node --test test/email-change-otp.test.js test/auth-account.test.js test/user-account-update.test.js test/user-status-commands.test.js test/user-status-validation.test.js test/auth-logout.test.js`: 44/44 đạt (model được mock, thư in qua `MAIL_TRANSPORT=console`). Chạy thử end-to-end trên DB nháp local `wmsd_profile_review_20261123` với `MAIL_TRANSPORT=console`: `banhang01` tự đổi email qua UI (mã sai báo còn 4 lần, mã đúng đổi thành công, thư báo gửi tới email cũ, audit `CHANGE_EMAIL` đúng trước/sau); tài khoản `admin` đổi lại email cho `banhang01` từ trang chi tiết tài khoản bằng mã gửi tới email mới. FE: `tsc --noEmit`, eslint các file đổi, vitest `src/features/profile` (8) và `src/features/accounts` đạt, trừ 5 ca cũ tìm ô "Mật khẩu" trong `CreateAccountPage.test.tsx`/`accounts.test.tsx` — đã chạy lại trên bản `main` gốc và lỗi y hệt (ô mật khẩu bị bỏ từ 22/11), không do thay đổi này.

**Giới hạn.** Bộ đếm OTP nằm trong bộ nhớ tiến trình, không chia sẻ giữa nhiều instance.

## 23/11/2026 — Thông tin tài khoản và tự đổi mật khẩu

**Quyết định.** Người dùng yêu cầu ngày 23/11/2026 dựng chức năng "Thông tin tài khoản" (BE + FE) và cho chủ tài khoản đang đăng nhập tự đặt mật khẩu mới.

**Hành vi và hợp đồng.** `GET /api/auth/me` bổ sung email, tên vai trò, kho phân công, version và thời điểm tạo/cập nhật. Thêm `PATCH /api/auth/me` (họ tên, số điện thoại, khoá theo version) và `POST /api/auth/me/password` (cần mật khẩu hiện tại). Audit mới `UPDATE_PROFILE`, `CHANGE_PASSWORD`. `PUT /api/users/:id` nay tăng `users.version`. Không đổi schema, quyền hay seed. Chi tiết: [USER_ACCESS_STATUS](docs/08_api/USER_ACCESS_STATUS.md#thông-tin-tài-khoản-tự-phục-vụ--23112026). FE thêm trang `/account/profile`.

**File.** `src/modules/auth/auth.{routes,controller,service,validation}.js`, `src/modules/users/user.service.js`, `test/auth-account.test.js`.

**Kiểm thử.** Đã chạy `node --test test/auth-account.test.js test/auth-logout.test.js test/user-status-commands.test.js` (21/21 đạt, model được mock, không chạy DB). `test/user-account-update.test.js` có 2 ca lỗi do `User.exists` (kiểm tra trùng email) chưa được mock — lỗi đã có trước thay đổi này, tái hiện trên bản gốc. Chạy thử end-to-end trên DB nháp local `wmsd_profile_review_20261123` (chỉ sao chép users/roles/permissions/warehouses từ `wmsd_demo_tile_shop_v8`, tài khoản `banhang01`): `GET /me` trả đủ vai trò/3 kho/31 quyền, không có hash; PATCH sai version → 409, gửi email → 400; sửa số điện thoại qua UI lưu được; đổi mật khẩu qua UI xong thì mật khẩu cũ 401, mật khẩu mới 200; audit có `UPDATE_PROFILE` (kèm trước/sau) và `CHANGE_PASSWORD`. Đã xem UI ở 1440px và 390px (không cuộn ngang trang). FE: `tsc --noEmit`, eslint các file đổi, vitest `src/features/profile` (6), `PermissionChecklist`, `warehouseNavigation`, `routeAccess`, `MainLayout.*`, `router.session` đều đạt.

**Giới hạn.** Đổi mật khẩu không thu hồi phiên đã cấp; chưa giới hạn số lần nhập sai mật khẩu hiện tại.

## 23/11/2026 — CORS và chẩn đoán kết nối Worker

**Decision.** User decision (23 Nov 2026): the reason for a counted difference is chosen by the Warehouse Staff counter and only approved by the Owner. Reason list unchanged (Vỡ/hỏng, Mất/thất lạc, Để nhầm vị trí/chất lượng, Thừa/tìm thấy, Sai sót ghi sổ, Khác); "Khác" requires a typed reason. The reason is required on every differing line before results are sent; the Owner cannot edit it and requests a recount when they disagree.

**Behavior.** New `POST /api/stocktakes/:id/count-reason` (`stocktake:update`, assigned counter, `COUNTING`) stores the reason for the newest attempt of a differing line in `header.countReasons[]`; a new count of the line invalidates it. `POST /:id/reconcile` refuses while a differing line lacks a reason (`Còn N dòng chênh lệch chưa chọn lý do`). `POST /:id/approve-differences` no longer accepts `reasonCode/reasonNote` in `lines[]` and posts the counter's reason instead. `GET /:id` `lines[]` adds `countReason`. Frontend (frontend repository, same day): the count screen shows a reason select (and a text box for "Khác") under the difference of each differing line; the reconcile action explains missing reasons; the Owner reconciliation table shows the reason read-only.

**Files.** Backend: `src/models/stocktake-count-reason.schema.js` (new), `src/models/stocktake-header.schema.js`, `src/modules/stocktake-closure/stocktake-closure.routes.js`, `stocktake-commands.service.js`, `stocktake-reconciliation.service.js`, `stocktake-closure.service.js`. Docs: [STOCKTAKE_LIFECYCLE.md](docs/08_api/STOCKTAKE_LIFECYCLE.md), [MODEL_MAP.md](MODEL_MAP.md), [WMSD_Data_Dictionary.md](docs/03_thiet_ke/DB_Current_2026-11-12_58/WMSD_Data_Dictionary.md), `schema.json`, `src/models/CHANGELOG.md`. Frontend: `src/features/stocktakes/{api.ts,model.ts,components/LineReasonField.tsx,components/CountTable.tsx,components/ReconcileAction.tsx,components/ReconciliationTable.tsx,lifecycle-count.test.tsx}`.

**Data impact.** Additive embedded field with default `[]`; no migration, index or seed change. Slips already `RECONCILING` without reasons can still be approved (default reason). The ERD (`WMSD_ERD_Current.drawio`) was not regenerated: the generator also picks up unrelated model changes not yet drawn, so it is left for a separate refresh.

**Checks.** Backend on the isolated local replica set `127.0.0.1:27018` (`hieudt-test`, recreated in Docker): `RUN_STOCKTAKE_LIST_TESTS=1 RUN_STOCKTAKE_RESOLUTION_TESTS=1 RUN_STOCKTAKE_LIFECYCLE_TESTS=1 node --test --test-concurrency=1` over the three stocktake integration suites plus `stocktake-count-sheet`, `stocktake-detail`, `stocktake-list`, `stocktake-resolution-detail`, `stocktake-resolution-list`: 50 pass, 0 fail, after the existing lifecycle and resolution set-ups were updated to choose the counter's reason before reconcile; `consolidation`, `reviewed-model-files`, `db-rebuild`: 27 pass; `npm run docs:check` passes. Frontend: `pnpm typecheck`, eslint on `src/features/stocktakes`, `pnpm ui:check`, vitest `src/features/stocktakes` and `src/features/adjustments` (12 files, 93 tests) pass after updating two existing assertions in `lifecycle-count.test.tsx`. No new test file (project policy). Not done: browser check on the shared database (no slip with a counted difference after the 23 Nov clean-up).

## 23 November 2026 — Stocktake plan areas resolve only stocked bins

**Decision.** User decision (23 Nov 2026): a slip generated from a plan should show only the bins that hold what needs counting. Before, a plan with `areaCodes` pulled every active location of the area into the slip, and each bin without book stock had to be confirmed empty before results could be sent (for example plan `KHKK-K-GACH-01-261123-000002`, area `CUSTODY` filtered to one product, generated a slip with 9 locations where only one held that product).

**Behavior.** `POST /api/stocktake-plans/:id/generate` keeps from the area only locations that have an `InventoryBalance` row on a LOCATION holding point within the plan's product/batch filter (the same rows activation snapshots, quantity zero included). Limitation: a bin that receives those goods for the first time after generation but before activation is not in the slip (documented in STOCKTAKE_PLANS). Explicit `locationIds` are kept unchanged. If no location remains, generation returns 400 with a Vietnamese message. Plan create/update validation, the plan detail lookups, ad-hoc slips (`POST /api/stocktakes`) and the reconcile rule for scoped empty locations are unchanged. Frontend (same day, frontend repository): the "Chọn nhanh theo khu" quick-pick adds only stocked, unlocked locations. Follow-up decision the same day: new plans no longer offer the "Khu vực kiểm" field (the edit form keeps it only for plans that already store areas); the API still accepts `areaCodes` for those plans.

**Files.** `src/modules/stocktake-plans/stocktake-plan.service.js`; [STOCKTAKE_PLANS.md](docs/08_api/STOCKTAKE_PLANS.md).

**Data impact.** None: no schema, index, seed or migration. Existing slips keep their scope; a slip already generated with empty bins must be cancelled and generated again to benefit.

**Checks.** `node --check` on the service and `npm run docs:check` pass. A read-only replay of the new queries against plan `KHKK-K-GACH-01-261123-000002` (area `CUSTODY`, 9 active locations) kept only `DM01-CUSTODY-05`. Not run: generation against a database (no isolated local database available), integration tests (none cover plan generation). No automated test added (project policy). One independent reviewer: approved with comments; wording and the activation-gap limitation were addressed.

## 23 November 2026 — Stocktake follow-up to lecturer feedback (frontend only) and lifecycle doc fix

**Decision.** User-delegated follow-up to the 22 November 2026 stocktake redesign, after a gap audit against the lecturer feedback. No backend code, schema, permission, seed or database change.

**Behavior (frontend).** The "Hàng phát hiện ngoài sổ" form no longer asks quality, owner or owner id: found stock is always sent as `qualityStatus: GOOD`, `ownerType: STORE` (damaged goods go through the defect/quarantine flow), and it stays available while a recount is open, because `POST /stocktakes/:id/counts` accepts new found stock then. The printed count sheet drops the quality/owner columns (a tag appears only for stock that is not good store stock) and prints a found-stock blank table inside each location section instead of one table with a location column. The Owner can tick already-counted matching lines for "Yêu cầu đếm lại" (`POST /:id/recount` accepts any unsettled line); "Duyệt chênh lệch" sends only differing lines and is disabled while a matching line is ticked, because the API closes the remaining matching lines with the last difference; the approval dialog counts those closed matching lines the same way. The empty-location correction ("Sửa bằng hàng phát hiện") also stays available during a recount. "Lịch sử phương án" (`/adjustments`) left the menu and stays reachable by URL; the retired resolution-plan read API moved from the stocktakes feature to the adjustments feature. Units were added to quantities on the slip overview, lot movement history, replenishment assessment, purchase-order documents/list/close-remainder, location-move progress and return-workflow linked documents; the approval dialog shows "Không có chênh lệch" instead of a bare 0.

**Documentation.** [STOCKTAKE_LIFECYCLE.md](docs/08_api/STOCKTAKE_LIFECYCLE.md): title BF-05 → BF-04 (as in DOMAIN.md); the blind-count wording of the 17 November server rule and of the count-sheet read is now dated history, and the count-sheet row list and read contract include `uomCode`, `uomName` and `bookQtyBase` as returned since 22 November 2026. The dead `blind-count.js` link in [HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md](docs/09_phat_trien/HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md) §2.12 was fixed on main by the same day's receiving guide update; this change keeps that wording.

**Verification.** Frontend `pnpm typecheck` and `pnpm lint` pass; vitest for stocktakes, adjustments, lots, purchase-orders, replenishments, location-moves, return-workflows and `src/app` pass (52 files, 366 tests) after updating existing assertions in `countSheet.test.tsx`, `live.test.tsx` and `adjustments/routes.test.ts`; after the review fixes the focused rerun (stocktakes, adjustments, purchase-orders, return-workflows, location-moves, `src/app`: 42 files, 310 tests) passes. `pnpm ui:check` fails only on the direct `antd` import in `src/features/notifications/NotificationBell.tsx`, unchanged from HEAD. The single independent reviewer requested changes (matching line silently closed by a partial approval, wrong return-workflow unit, and low items); after fixes the recheck found no critical, high or medium issue. Not done: browser/visual check (the user tests the UI).

**Remaining.** Deprecated `stock_adjustment:create/update/approve` are still offered in the role editor and fallback role lists; the unique partial index `stocktake_plan_period_once` still needs an authorised rollout on shared databases.

## 22 November 2026 — Stocktake end-to-end walkthrough and shortage-approval fix

**Source.** User asked for one complete end-to-end stocktake flow checked against the lecturer's feedback, with a screenshot of each step written into one docs file (22 Nov 2026). No new business rule.

**Behavior.** Before: approving a counted **shortage** (`POST /api/stocktakes/:id/approve-differences`) failed with 400 `InventoryBalance validation failed: packagingPortions.0.createdAt: Path 'createdAt' is immutable` whenever the balance already had packaging portions, because the service reassigned plain portion objects to `balance.packagingPortions`. After: it calls `retainPortions(balance, kept)` like the other stock writers, so existing portions are updated in place. Surplus approval (`receiveStock`) is unchanged.

**Files.** `src/modules/stocktake-closure/stocktake-reconciliation.service.js`; new Vietnamese walkthrough [STOCKTAKE_E2E_WALKTHROUGH](docs/09_phat_trien/STOCKTAKE_E2E_WALKTHROUGH.md) with 29 screenshots in `docs/09_phat_trien/images/stocktake-e2e/`; end-user guide [HUONG_DAN_SU_DUNG_KIEM_KHO.docx](docs/02_nghiep_vu/HUONG_DAN_SU_DUNG_KIEM_KHO.docx) (Vietnamese, written for Owner and Warehouse Staff, same 29 screenshots embedded in the single Word file, no developer content); README index; note in STOCKTAKE_LIFECYCLE.

**Data impact.** None in shared databases. The browser run used an isolated local copy `wmsd_e2e_stocktake_20261122` on the local test replica set; no migration or seed.

**Checks.** Two manual browser runs: first plan → slip → count → recount → approve a shortage (balance 62 → 61, adjustment `POSTED`; this run exposed the defect), second after the fix: quarterly plan → slip → count → recount → approve a surplus (balance 61 → 63, adjustment `POSTED`), 29 screenshots. `RUN_STOCKTAKE_RESOLUTION_TESTS=1 RUN_STOCKTAKE_LIFECYCLE_TESTS=1 node --test --test-concurrency=1 test/stocktake-resolution.integration.test.js test/stocktake-lifecycle.integration.test.js`: 11 pass, 0 fail. No automated test was added (project policy); the existing suites did not cover a shortage on a balance with seeded portions, which is why the defect escaped.

**Open.** Monthly/yearly periods, pause/resume/end, found-not-in-book, multi-unit counting, export/print and mobile were not exercised in the walkthrough.

## 22 November 2026 — Report 3 §4.2 use-case table renumbered from Project Tracking

User request (22/11/2026): renumber only the Report 3 use-case table, following the Project Tracking WBS sheet, in English. Docs-only: no code, model, API or data change.

- `docs/01_bao_cao/WMSD_Report3_Fix.docx.txt` §4.2 now lists the 164 WBS use cases numbered consecutively UC-01–UC-164 in WBS order (old WBS IDs UC-37–UC-171 shift down; UC-01–UC-32 keep their numbers). Names, features and descriptions come from the WBS sheet; the one Vietnamese description (UC-04) keeps the existing English text, and UC IDs cited inside descriptions use the new numbers. The State column and the previous 132-identifier ACTIVE/RETIRED list were removed because the WBS sheet has no retirement state; the table header (ID / Use Case / Feature / Use Case Description) and the §4.2 intro sentence now match the renumbered Report 3 docx (`WMSD_Report3_Fix_UC_renumbered.docx`, kept outside the repository).
- Not changed, so still on the old numbering: the heading under II, §4.3 actor associations, §4.4 permission matrix, business-flow/data-rule tables and the use-case specifications; the WBS sheet itself; `src/seeds/data/permissions.data.js` `uc` traces.
- Validation: row count and order checked against the WBS sheet; `npm run docs:check`.

## 22 November 2026 — Other receipt (OTHER): replacement receipts and approval hash removed

User decision (22/11/2026): keep the other-receipt flow but drop the replacement-receipt feature and the approval content hash, and delete the unused model fields without compatibility code.

- **Backend.** `other-receipt.service.js` no longer links a new receipt to a reversed one (`replacementSource`, `REPLACES` source, copying lines) and no longer auto-approves on submit; submit always moves `DRAFT` → `PENDING_APPROVAL`. Approve stops writing `approvedStockHash`; post checks `APPROVED` and `approvedVersion === version` only (an approved receipt cannot be edited anyway). `POST /goods-receipts/other` now requires `lines`; create and update reject `originalReceiptId` (strict schema). A wrong posted receipt is reversed, then a new receipt is drafted and approved again.
- **Model.** `goods_receipts` `OTHER` header drops `originalReceiptId`; the `OtherGoodsReceipt` discriminator drops `approvedStockHash`. No migration: existing local documents carrying these fields need a reseed.
- **Frontend.** Removed the "Tham chiếu phiếu gốc" input and the "Phiếu gốc" detail row; API types no longer carry `originalReceiptId`.
- **Seed.** `NK-202610-002` is a normal posted receipt drafted after reversing `NK-202610-002-OLD` (no `REPLACES` link); seed hashes removed.
- **Docs.** `docs/08_api/GOODS_RECEIPTS.md` (Lệnh OTHER), `docs/09_phat_trien/SEED_CUA_HANG_GACH.md`, `DB_Current_2026-11-12_58` dictionary and schema snapshot (field row removed by hand; the generator would also rewrite unrelated pending sections), `src/models/CHANGELOG.md`.
- **Tests.** `test/goods-receipt.integration.test.js` replaces the replacement/auto-approve section with missing-`lines` → 400 and a fresh draft → approve → post; `test/database-seed.test.js` drops replacement and hash asserts; FE `ReceiptCreatePage.test.tsx` asserts the update body has no `originalReceiptId`.

## 22 November 2026 — RR review: approve or reject only (REVISE removed)

User decision (22/11/2026): the Owner reviewing a replenishment request (RR) either approves or rejects it with a reason. The "send back for revision" option is removed for RR only; transfers, adjustments and other documents keep theirs.

- **Backend.** `POST /api/replenishments/:id/review` accepts `decision` `APPROVE` or `REJECT`; `REVISE` fails validation. RR status `REVISION_REQUIRED` is gone: edit, submit and lot options need `DRAFT`, the creator can withdraw `DRAFT`/`SUBMITTED`, and the list filters `status` and `approvalDecision` no longer accept `REVISION_REQUIRED`/`REVISE`. The `approval_history` and `review-decision` model enums keep `REVISE` because transfers use them and old RR decisions stay as recorded.
- **Data.** New `npm run rr:drop-revision` (preview) / `-- --apply` (`scripts/replenishment-drop-revision.mjs`) moves RR still in `REVISION_REQUIRED` to `REJECTED` and increments `version`. `latestDecisionId` is unchanged, so the rejection banner shows the old reason. Local MongoDB only; a remote run needs an explicit rollout instruction. Not run against any database yet.
- **Frontend.** The RR detail page already sent only APPROVE/REJECT. Removed the "Yêu cầu sửa" tab, status label, ribbon, warning banner, metric card and the edit path for that status. History still labels old `REVISE` decisions.
- **Docs.** `docs/08_api/replenishments/README.md`, `docs/09_phat_trien/HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md`, Report 4 II.1.1 RR class and sequence diagrams.
- **Tests.** New `test/replenishment-review-decision.test.js`; `test/replenishment-evaluation.integration.test.js` uses `REJECTED` instead of `REVISION_REQUIRED` as the inactive status; FE `ReplenishmentCreatePage.test.tsx` edit case uses `DRAFT`.

## 22 November 2026 | Receiving merge compatibility

Integrated main as requested. Frontend receipt and custody tables preserve product specifications and show quantities with recorded or catalogue units. Custody post and reversal refresh the affected purchase and stock views on success. Purchase receipt and order progress totals use the PO currency, with VND for purchase orders that omit it.

The receiving code guide now covers the BF03 location-lock filter and the notification worker. No database migration. Receipt and custody browser checks used fixture responses.

## 22 November 2026 — Report 4 BF-01 split by document and checked against code

User request (22/11/2026): check Report 4 II.1 BF-01 against the current code and split it so each document has its own class and sequence diagram. Docs-only: no code, model, API or data change.

- `docs/01_bao_cao/WMSD_Report4_Draft.md` II.1 now has 1.1 RR, 1.2 PO, 1.3 Goods Inspection (ARR + INS) and 1.4 purchase GR, each with a class diagram and a sequence; the table of contents lists the four parts. Other BF sections are unchanged.
- Corrections found against `replenishments`, `purchase-orders`, `po-receiving` and `goods-receipt.routes.js`: PO has no `requestClose`/`approveClose`/`executeClose` and no Owner step (the Accountant runs `closeRemainder` and `cancelPurchaseOrder`); `PurchasePutawayService` and `/putaway-tasks` no longer exist (removed 17/11/2026), so GR ends at `POSTED` and RECEIVING → STORAGE goes through BF-03 relocation; RR review also covers `REVISE`, required decision reason and reduced-line reasons; inspection adds GOOD-only ACCEPT, non-GOOD → CUSTODY, headroom check at confirm, draft cancel and correction; GR adds destination change, draft cancel, custody posting and reversal guards. IV.6 BF-01 row no longer lists put-away.
- Review pass (mermaid-diagrams and reviewing-technical-prose): removed the verification date from the report prose; class diagrams use dotted dependencies for calls and solid references with multiplicity (one live PO per RR, one ARR per INS, GR/custody per INS, StockReversal to original StockTransaction); validation steps are self-messages instead of DB calls; permission codes use their real `resource:action` form; PO, inspection and GR sequences show their error path.
- Validation: all 8 Mermaid blocks rendered with Mermaid 11.4.1 in a local browser page; `npm run docs:check`. No tests run (no code change).


## 22 November 2026 — Transfer review batch 5: assignee, destination requests, stop-forward, cleanup

**Behavior.** The pick task can be assigned from a picker or defaults to the source warehouse keeper; destination staff can raise, edit and cancel requests asking for goods; the shipping warehouse and the owner can stop the remaining quantity; the transfer page shows the next step and who does it, with consistent units. Unused mock transfer screens were deleted.

**Data and contracts.** No schema change. New `GET /warehouse-transfers/pick-assignees`; relaxed access on create, update, cancel, options and close-partial. See the [BF04 contract](docs/08_api/transfers/BF04_API.md#pick-assignee-picker-destination-initiated-requests-stop-forward--22-november-2026-batch-5).

**Verification.** `node --check` and `tsc --noEmit` pass after the deletions. Not yet run against the live project; `/test` files not run.

## 22 November 2026 — Transfer review batch 4: execution (short pick, handover, split receipt)

**Behavior.** Pickers can confirm a lower picked quantity with a reason (the rest of the reservation is released); a pick task can be assigned to another warehouse user; handover records driver, phone and note; the receiving form splits good and damaged quantities per dispatch line; creating a dispatch also creates its pick task; the transfer page has a "Nhận hàng" button.

**Data and contracts.** Additive: handover header `driverName`/`driverPhone`/`note`, dispatch header `shortPickReason`; new optional request fields `assigneeId`, `driverName`, `driverPhone`, `note`, `pickedLines`, `shortReason`. See the [BF04 contract](docs/08_api/transfers/BF04_API.md#execution-short-pick-assignee-handover-details-split-receipt--22-november-2026-batch-4).

**Verification.** `node --check` and `tsc --noEmit` pass. Not yet run against the live project; `/test` files not run.

## 22 November 2026 — Transfer review batch 3: per-line approval and stock check

**Behavior.** The approver can lower or drop quantities per line, sees free source stock (per lot), destination stock and the needed-by date, and approval fails when a line exceeds free source stock. Approval no longer needs a note. Stock is checked, not reserved, at approval.

**Data and contracts.** No schema change. New optional review field `lines[]`; read DTO adds `stockCheck[]` and `header.neededOn`. See the [BF04 contract](docs/08_api/transfers/BF04_API.md#per-line-approval-and-stock-check-at-review--22-november-2026-batch-3).

**Verification.** `node --check` and `tsc --noEmit` pass, and the review body schema accepts and rejects the expected cases. Not yet run against the live project; `/test` files not run.

## 22 November 2026 — Transfer review batches 1–2: transit loss and lot mixing

**Behavior.** Batch 1 lets the owner resolve a transit discrepancy by write-off or receipt so a request can complete; batch 2 blocks silent lot mixing on dispatch unless the dispatcher confirms. Frontend: discrepancy dialog, review reason banners, written-off column, dispatch lot/staging selection with planned-picking preview.

**Data and contracts.** Optional `resolutionMode`/`liableParty` on discrepancy headers; `mixedLots`/`mixedLotAcceptedBy` on dispatch headers; `acceptMixedLots` request field. Additive, no migration. See the [BF04 contract](docs/08_api/transfers/BF04_API.md#transit-loss-and-discrepancy-resolution--22-november-2026-batch-1). Data dictionary, ERD, schema.json and model map are not updated yet.

**Verification.** Batch 1 was exercised end to end against the running project (request completed with 6 received and 6 written off). Batch 2 passed `tsc --noEmit` and `node --check`; the `/test` files were intentionally not run.

## 22 November 2026 — Transfer request source locations and partial allocations

**Decision.** The user requested per-bin quantities after choosing a product and lot, with immediate stock checks. The follow-up explicitly allows a partial allocation such as 40 of 160 pieces.

**Behavior.** The transfer editor saves a partial or full allocation, displays the unallocated remainder, and checks available stock for each selected bin. Request detail and the Transfer Goods Issue form show the saved bin quantities. Dispatch uses planned balances first and may source the unallocated remainder from eligible stock of the same lot. The server checks cumulative planned and unplanned dispatch quantities across non-cancelled documents inside the existing reservation transaction.

**Data and contracts.** `warehouse_transfer_requests.items[]` stores optional `lotLabelSnapshot` and `sourceLocations[]`. Existing documents continue to load. The additive schema needs no data migration or index build. The API, model map, current data dictionary, ERD, and frontend context describe the change. See the [BF04 contract](docs/08_api/transfers/BF04_API.md#source-locations-on-transfer-requests--22-november-2026).

**Verification.** Eleven targeted backend read, availability, completion and schema tests and two isolated localhost replica-set transfer tests passed. Thirty-six focused frontend tests passed, including the 40/160 case, and Chrome verified the form at 1440px and 390px with sample stock.

## 22 November 2026 — Frontend backlog: green checks, lazy chunks, explicit currency, locked-stock tag

**Source.** User said "fix all the frontend too" (22 Nov 2026, relayed by the coordinator). Frontend repository `frontend/` only; no backend file other than this entry was changed. No new business rule.

**Behavior.**
1. `formatCurrency` no longer assumes VNĐ: without a currency code it prints `(thiếu tiền tệ)`. VND-only entities (issue requests, purchase-order/replenishment forms, Owner dashboard mock) pass the explicit `VND_ONLY` option or code `VND`; API-backed screens keep using the record's `currencyCode`. `formatDecimal` rounds JS numbers to six decimals before formatting.
2. Mounted mock screens now format money with `formatCurrency` and quantities with `formatQuantity`: issue-request list/detail/print/step, Owner dashboard blocks, PO create/edit modals, replenishment create-PO dialog. Unmounted legacy files were deliberately left untouched (list in the frontend report).
3. Return-workflow stock picker: locked stock stays selectable for defect reports and now shows "Đang khóa kiểm kê — vẫn chọn được để báo hàng lỗi" (other purposes keep the disabled "Đang khóa kiểm kê" row).
4. Excel export failures are toasted once (the global error middleware also shows `CUSTOM_ERROR` messages from `queryFn` endpoints); `Scene.tsx` probes WebGL2 once instead of setting state in an effect; `vite.config.ts` splits `three` into its own chunk and sets the chunk warning limit to 1000 kB because the only chunk above 700 kB is the lazily loaded prebuilt `exceljs.min` (~930 kB).
5. Tests fixed (no new test files): the two mocks with a raw `<button>` use the shared `Button`; `return-workflows/usability.test.tsx` no longer selects a customer (customer comes from the source document); `issue-requests/detail/IssueRequestDetailPage.test.tsx` expects "VNĐ".

**Data impact.** None (no database, seed or migration; the browser check used an isolated local database that was dropped afterwards).

**Checks.** See the frontend report for exact numbers: `pnpm typecheck`, `pnpm lint` (0 errors, 0 warnings), `pnpm ui:check`, full vitest run and `pnpm build` (no chunk warning).

## 22 November 2026 — Stocktake follow-up: lot unit, lock-aware option lists, plan timezone, cancelled slips free their period

**Source.** User said "fix all" for the remaining open items of the stocktake redesign (22 Nov 2026, relayed by the coordinator). No new business rule beyond the decision of the same day; contracts: [STOCKTAKE_PLANS.md](docs/08_api/STOCKTAKE_PLANS.md), [STOCKTAKE_LIFECYCLE.md](docs/08_api/STOCKTAKE_LIFECYCLE.md), [HIEUDT_WAREHOUSE_SCOPE.md](docs/08_api/HIEUDT_WAREHOUSE_SCOPE.md#option-lists-and-stocktake-locks-22-nov-2026), [RETURN_WORKFLOWS_NATIVE.md](docs/08_api/RETURN_WORKFLOWS_NATIVE.md).

**Behavior.**
1. `GET /lots` `items[]` (and `GET /lots/:id`) expose `uomCode` (`Product.baseUnit`) and `uomName` (`Uom.name`, `null` if unknown), same semantics as stocktake `lines[]`. `GET /lots` has no `lookups` block.
2. New helper `stocktakeLockedLocations` (`src/shared/utils/stock.js`). Stock in a location with an active `StocktakeLocationLock` (`LOCKED`) has zero selectable quantity for every role in the goods-issue options and manual-issue `stockSources`, direct-sales options, sales options, location-movement options, transfer options and return-workflow options/lookup: rows that only list selectable stock drop the row; rows with an availability field keep it with `availableQtyBase`/`availableQty` `"0"` and `lockedByStocktake: true`; locations are flagged. Writers' `guardLocations` unchanged. Table in HIEUDT_WAREHOUSE_SCOPE.
3. `stocktake-plan.schedule.js` counts periods on the Asia/Ho_Chi_Minh calendar (UTC+7): a `startDate` `2026-01-31T00:00:00+07:00` anchors on 31 Jan local, clamps month ends and keeps the anchor day for quarter/year steps. The frontend's `08:00+07:00` payload gives results identical to the earlier UTC arithmetic.
4. A `CANCELLED` slip frees its plan period: the exists-check ignores cancelled slips, index `stocktake_plan_period_once` is now partial on `header.planId` exists and `workflowStatus` in the non-cancelled allow-list, `POST /api/stocktake-plans/:id/generate` accepts optional `periodNo` to regenerate an earlier period whose slips are all cancelled (schedule not moved), `GET /api/stocktake-plans/:id` returns `regenerablePeriodNos`.
5. Confirmed, no code change: `approve-differences` posts a misplaced/wrong-quality line pair as separate decrease/increase balances (source-target link not kept); noted in STOCKTAKE_LIFECYCLE.
6. Review fixes of the same day: the `stocktake_plan_period_once` allow-list also lists the retired plan-workflow statuses `PENDING_APPROVAL`, `APPROVED`, `IN_PROGRESS` (historical in-flight slips keep occupying their period); the goods-issue manual-issue source list now queries stocktake locks once per request instead of once per reservation. Schema snapshot and data dictionary regenerated.

**Files.** `src/shared/utils/stock.js`, `src/modules/lots/lot.service.js`, `src/modules/goods-issues/{goods-issue,direct-sales}.service.js`, `src/modules/sales-orders/sales-execution.service.js`, `src/modules/location-movements/location-movement.service.js`, `src/modules/transfers/transfer-read.service.js`, `src/modules/return-workflows/{native.read,native.lookup}.js`, `src/modules/stocktake-plans/{stocktake-plan.schedule,stocktake-plan.service,stocktake-plan.routes}.js`, `src/models/stocktake.model.js`; docs: STOCKTAKE_PLANS, STOCKTAKE_LIFECYCLE, HIEUDT_WAREHOUSE_SCOPE, RETURN_WORKFLOWS_NATIVE, HIEUDT_LOCAL_TESTS, MODEL_MAP, Data Dictionary, `schema.json`, `src/models/CHANGELOG.md`. Existing tests adjusted: `test/movement-projections.test.js` and `test/transfer-read-performance.test.js` (mock `StocktakeLocationLock.find`, which the option endpoints now read).

**Data impact.** No migration, seed or database write. The partial filter of `stocktake_plan_period_once` changed in code only; the index was never built on a shared database, so nothing needs rebuilding there — creating it stays a separate authorised rollout. No permission change.

**Checks.** Isolated replica set `127.0.0.1:27018` (throw-away database, dropped): proof script with 29 checks passed (lot unit; locked vs unlocked location in every option endpoint for Warehouse, an all-permission role and Sales; schedule anchors and 840 old-vs-new occurrences; generate → cancel → regenerate, replay, refusal, index backstop; misplaced pair posted as separate decrease/increase). `npm run docs:check`, `npm test` and the targeted integration suites are listed in [HIEUDT_LOCAL_TESTS.md](docs/09_phat_trien/HIEUDT_LOCAL_TESTS.md).

**Limitations.** Goods-issue options/manual-issue `stockSources` changes are code-reviewed but not exercised at runtime (needs a full delivery/issue chain). The index allow-list must gain any new non-cancelled slip status. `lots`, `return-lookups`, `replenishment-warnings` integration suites need 27017/27028 replica sets that are not available here.

## 22 November 2026 — Review fixes for the stocktake redesign

Independent review follow-up (no new business decision). (1) `approve-differences` with `all: true` on a slip that has no snapshot lines (scope of empty locations only, each confirmed 0) used to fail with "Không có dòng nào để duyệt", so such a slip could never complete (HEAD's old `close` allowed it); it now completes, releases the locks in the same transaction and returns a normal receipt, still verifying every empty location. Reproduced first on the isolated replica set (400), then proved fixed (200 COMPLETED, no stock posted, replay, stale 409, unconfirmed empty location still blocks reconcile). (2) `packaging[]` entries for a line that is not being approved are rejected with a Vietnamese 400 instead of silently ignored. (3) Removed a duplicated settled/recount guard in `recordCountCommand` and the now-unused `currentRole` import in `return-workflows/native.service.js` plus two unused imports in `stocktake-plan.model.js`. Files: `stocktake-reconciliation.service.js`, `stocktake-commands.service.js`, `native.service.js`, `stocktake-plan.model.js`; contract text in [STOCKTAKE_LIFECYCLE](docs/08_api/STOCKTAKE_LIFECYCLE.md). No schema/index/permission change; no shared-database write.

## 22 November 2026 — Frontend follow-up: per-row count units, "Lịch sử phương án", lot unit, unit/currency sweep, lock-aware option lists

**Source.** User said "fix all" for the remaining frontend items of the stocktake redesign (22 Nov 2026, relayed by the coordinator); consumes the backend follow-up entry above. Frontend repository `frontend/` only; no backend file was changed.

**Behavior.**
1. Count table: each "Số lượng thực tế" box stays in the base unit by default; a row whose product has more than one countable unit (`lookups.conversions`, lot factor first) gets a compact unit Select. A value typed in another unit is converted exactly for the preview ("= 8 Viên"), sent as `countedQtyBase` plus `quantityEntries[{ enteredQty, enteredUnit, baseUnitsPerUnit, quantityBase }]`; book, count and difference stay in the base unit. Blur still saves only a changed value; Enter / "Xác nhận số này" still resubmit an unchanged one.
2. `/adjustments` is renamed "Lịch sử phương án" (menu, route titles, page, filters, empty/403/404 texts): read-only history of the plans created before 22/11/2026; wording about approving or executing removed. Route paths unchanged; the sidebar badge stays on `/stocktakes` (slips waiting for reconciliation).
3. "Hàng phát hiện ngoài sổ" shows the lot unit (`uomName`/`uomCode` of `GET /lots`) beside the quantity as soon as a lot is chosen.
4. Unit/currency sweep of API-backed screens: custody lines, receipt lines (no `Viên` guess when the unit is missing), supplier/customer return workflow lines, lot detail and lot movements (unit from the lot), operational reports (unit of the same row), sales order prices (`currencyCode` of the order, "thiếu tiền tệ" when absent). Purchase orders and the sales-order create form stay in VNĐ: the backend accepts only `currency: 'VND'`.
5. Plan detail: "Tạo lại phiếu cho kỳ này" on cancelled slips whose period is in `regenerablePeriodNos` (`generate` with `periodNo`, then opens the new slip).
6. `lockedByStocktake` in option lists: location moves (source and destination) and transfer put-away destinations show "Đang khóa kiểm kê" and are disabled; transfer staging skips locked locations; return-workflow stock rows carry the tag and are disabled except for defect reports, which may still reference the counted (locked) balance.

**Files (frontend).** `src/features/stocktakes/{countUnits.ts,components/{CountTable,LineCountInput,countDrafts,DiscoveredInlineForm}.tsx,plans/*,api.ts}`, `src/features/adjustments/**`, `src/app/routes.config.ts`, `src/features/{custody,receipts,return-workflows,lots,operational-reports,sales-execution,location-moves,transfers}/**`, `context.md`; tests adjusted: `adjustments/{list/LiveAdjustmentsPage,detail/LiveAdjustmentDetailPage}.test.tsx`, `lots/detail/LotTracePage.test.tsx`.

**Data impact.** None (no database, seed or migration).

**Checks.** `pnpm typecheck` and `pnpm lint` pass (one existing `warehouse-3d` warning); related vitest suites pass except 4 tests that also fail on a clean HEAD export (`return-workflows/usability.test.tsx` x3, `shared/components/ExcelExportButton.test.tsx` x1); `pnpm ui:check` reports only the 2 known old mock failures. Browser on an isolated local database (dropped afterwards): Thùng/Viên count saved `quantityEntries` BOX 2×4=8, discovered form showed Viên after picking a lot, history page, locked location disabled in location moves, plan regeneration opened a new slip.

**Limitations.** Mock-backed screens (dashboard approvals, issue requests, customer/supplier-return stores, legacy inventory/warehouse/reports) were not changed. Outbound-delivery, sales-order line and order list payloads carry no unit/currency (listed in the frontend report). The independent code review required by the workspace policy was not run by this worker.

## 22 November 2026 — Frontend: stocktake plan/slip screens, inline count table, reconciliation without resolution plans

**Source.** User decision 22 Nov 2026 following lecturer feedback (same decision as the backend entry below). Frontend repository `frontend/`; no backend file was changed.

**Behavior.** New "Kế hoạch kiểm kê" screens (`/stocktake-plans` list/create/detail) on `/api/stocktake-plans` with due tags, pause/resume/end/update and "Tạo phiếu kiểm kho từ kế hoạch" (navigates to the generated slip). The old stocktake screens are now "Phiếu kiểm kho"; the ad-hoc form is "Tạo phiếu kiểm kho". Counting uses one inline table from `lines[]` (always-visible "Số lượng thực tế" box, saved on blur/Enter, locations grouped instead of a column, found-not-in-book and empty-location confirmations inline, no blind count). On `RECONCILING` the Owner sees the reconciliation table with "Yêu cầu đếm lại" and "Duyệt chênh lệch"/"Duyệt tất cả" (optional per-line reason label, no closing reason); legacy `PENDING_APPROVAL/APPROVED/IN_PROGRESS` slips show a notice and only the recount path. Removed UI calls to `close`, `reopen-counting` and resolution-plan writes. Quantities carry their unit (`formatQuantity`/`formatDecimal`) and `formatCurrency` takes a currency code. Header notice and sidebar badge now count slips in `RECONCILING`.

**Files (frontend).** `src/features/stocktakes/**` (new `plans/`, `components/CountTable|ReconciliationTable|DiscoveredInlineForm|ScopeFields|SlipFields|…`, `commands.ts`; removed legacy resolution/close/reopen components and the unrouted mock `StocktakesPage`/`StocktakeDetailPage`), `src/app/{routes.config,routeAccess,roleNavigation,MainLayout}`, `src/shared/lib/{format,excel,mockStore}.ts`, `src/workspace.css` (antd alerts directly under `.operations-page` keep their own type colors), `blindCount` readers removed from lots/warehouse-stock/transfers/return-workflows/operational-reports, `context.md`, `DESIGN.md`.

**Data impact.** None (frontend only). No API call, database, seed or index was changed by this entry.

**Checks.** Typecheck passes; lint has 0 errors (1 existing warning); `pnpm ui:check` still fails only on two existing test files that contain raw `<button>` in mocks; related vitest files pass except 6 tests that already failed before this change (Excel export partial page, return-workflows usability ×3, adjustments list/detail pending). Browser flow verified against the local backend on an isolated local database: plan create → generate → activate → count → reconcile → approve (COMPLETED) and recount → recount-only counting → reconcile; counter denied plan creation. Not verified in a browser: print sheet, Excel export, legacy-status slip, partial approval, mobile for the slip detail tables.

**Open points.** Independent code review not run (dispatch forbade subagents); follow-up list of quantity-without-unit and price-without-currency screens is in the worker report.

## 22 November 2026 — Stocktake redesign: plan vs slip, no blind count, simplified reconciliation, no closing reason

**Request / reason.** Lecturer feedback on the stocktake (Kiểm kho) flow. **Decision source: User decision 22 Nov 2026 following lecturer feedback (separate plan/slip, remove blind count, simplified reconciliation, drop closing reason).** It supersedes the BF-04 blind-count rule and the 18 Nov 2026 blind-count decision; those statements stay as dated history in [HIEUDT_WAREHOUSE_SCOPE](docs/08_api/HIEUDT_WAREHOUSE_SCOPE.md), [STOCKTAKE_LIFECYCLE](docs/08_api/STOCKTAKE_LIFECYCLE.md), [RETURN_WORKFLOWS_NATIVE](docs/08_api/RETURN_WORKFLOWS_NATIVE.md) and [HIEUDT_ITERATIONS_NATIVE](docs/08_api/HIEUDT_ITERATIONS_NATIVE.md).

**Before → after.**
- A "plan" was only a `Stocktake` in `PLANNED`. Now `stocktake_plans` (`StocktakePlan`, `KHKK-…`, MONTHLY/QUARTERLY/YEARLY, `ACTIVE/PAUSED/ENDED`) generates ordinary `PLANNED` slips through `POST /api/stocktake-plans/:id/generate` (same slip creation code as `POST /api/stocktakes`, stamps `header.planId/planPeriodNo/planPeriodDueAt`, advances `nextDueAt`, one slip per period). Due notice only (`isDue`/`dueSoon`), no cron. No new permission: writes `stocktake:create`, reads `stocktake:read`. Contract: [STOCKTAKE_PLANS](docs/08_api/STOCKTAKE_PLANS.md).
- Blind count removed: `src/shared/utils/blind-count.js` (`blindCountScope`, `blindLockedLocationIds`, `redactMovement`), `isBlind`/`redactPlans` and every `blindCount`/`blindCountedLocations` flag deleted; warehouse-stock, lots, return-workflow lookup/read/trace/service, operational reports, goods-issue, direct-sales, sales-execution, location-movement and transfer readers return real quantities. Count sheet now carries `bookQtyBase`.
- Reconciliation: removed `POST /stocktakes/:id/close`, `/reopen-counting`, `/resolution-plans`, `/resolution-plans/:planId/review`, `/resolution-plans/:planId/executions` and the service code behind them. Added `POST /stocktakes/:id/recount` (Owner, `stocktake:create`) and `POST /stocktakes/:id/approve-differences` (Owner, `stock_adjustment:post`; per-line, one transaction, ledger + balance + `StockAdjustment`, idempotent, `COMPLETED` + locks released when every line is settled, otherwise stays `RECONCILING`). SoD: a counter cannot approve own lines. Closing `reason` no longer exists; optional per-line `reasonCode/reasonNote`.
- Units: `GET /stocktakes/:id` adds `lines[]` and `uomCode/uomName` on snapshots, counts and lookups; count sheet rows add `uomCode/uomName`.
- Added `ERR-STP-409-001/002/003`; `GET /stocktakes?planId=`; evidence upload only while `COUNTING`.

**Models / files.** New: `stocktake-plan.model.js`, `stocktake-plan-header.schema.js`, `stocktake-settled-line.schema.js`, `stocktake-recount-line.schema.js`; `stocktake-header.schema.js` and `stocktake.model.js` (index `stocktake_plan_period_once`) extended; registry/runtime/references/collections/schema-helpers/document-number (`ST_SCHEDULE`) updated; registry is now 59 collections. New modules `src/modules/stocktake-plans/*` and `stocktake-reconciliation.service.js`; `stocktake-closure.service.js`, `-commands.service.js`, `-routes.js`, `-count-sheet`, `-evidence`, `-list.query`, `-resolution.service` changed. Permission descriptions changed (no code/role change); retired `stock_adjustment:create|update|approve` kept and labelled. Seed fixture `src/seeds/rebuild/data.js` gets an empty `stocktake_plans`.

**Docs updated.** MODEL_MAP, Data Dictionary (`DB_Current_2026-11-12_58`, `stocktakes` header + new `stocktake_plans`), regenerated `schema.json` (it also picked up earlier model drift in other collections) and `WMSD_ERD_Current.drawio` (script `scripts/generate-reviewed-db-erd.mjs`, group I extended; layout not reviewed visually), DOCUMENT_IDENTITIES, STOCKTAKE_LIFECYCLE (new current section + frontend notes + superseded markers), new STOCKTAKE_PLANS, HIEUDT_WAREHOUSE_SCOPE, HIEUDT_ITERATIONS_NATIVE, RETURN_WORKFLOWS_NATIVE, README, PROJECT_GUIDE (BF05 row), `context.md`, `src/models/CHANGELOG.md`, `permissions.json`.

**Data impact / rollout.** Additive only: new empty collection, optional header fields, one new unique partial index on `stocktakes`, two read indexes on `stocktake_plans`. Existing slips need no backfill. Historical `resolutionPlans`, `ApprovalHistory` and adjustments stay readable (`GET /stocktakes/resolution-plans*`). Slips created earlier and still in `PENDING_APPROVAL/APPROVED/IN_PROGRESS` must be pulled back with `recount`. **Nothing was built, seeded, migrated or written on any shared/remote database; index creation is a separate authorised step.**

**Checks actually run (22 Nov 2026).** `npm run docs:check` passed (3 identical instruction files, 59 collections, 939 local links, change-log signals); `node --check` on every changed JS file; `npm test` 272 pass / 0 fail / 131 opt-in skipped (untouched HEAD run: 271 pass / 1 fail, a mock-only options test that timed out after 10 s and passes in this run). Isolated local replica set `127.0.0.1:27018` (Docker `hieudt-mongo`, recreated today): `RUN_STOCKTAKE_LIFECYCLE_TESTS` 4/4, `RUN_STOCKTAKE_RESOLUTION_TESTS` 7/7, `RUN_HIEUDT_TESTS` `hieudt-iterations` 10/10; the whole opt-in integration set has the same 32 failures before and after the change (other suites that need the rs0 replica on 27017 or are unrelated), no new failure. A throw-away script outside the repository (38 checks, random database, dropped afterwards) proved: plan create, generate twice (replay, stale version 409, not-due 409), one slip per plan, `nextDueAt` advance, pause/resume/end, auto-end at `endDate`, counter sees book quantity + units, recount of one line with history kept, partial approve (ledger/balance/ADJ once, locks kept), replay and re-approve refused, completion with locks released, removed endpoints 404, SoD.
**Existing tests edited because the change made them obsolete:** see the list in the task report (count assertions 58→59, count-sheet/detail expectations, stocktake lifecycle/resolution/hieudt integration cases that drove the retired plan workflow). No new test file was created.

**Open points.** Not run: UI, shared database, scheduler (none), visual review of the regenerated ERD, `RUN_*` suites that require the rs0 replica on port 27017. `DOMAIN.md` BF-04 still describes blind count and the plan → approval chain (workspace file, not edited here).

## 20 November 2026 — Receiving correctness and recovery fixes

Source: user requested fixes for the confirmed receiving audit findings. Typed FAILED_DELIVERY lists enforce Sales ownership before pagination. Typed and unified TRANSFER receipt reads apply destination warehouse and Sales linked-demand scope, with status-only Sales projection. CR reassessment locks and reacquires released source allowance, retains received charges, and supports historical and split sources. DIRECT inspection and receipt preserve packaging and measured volume; historical sealed returns use a verified lot snapshot and partial measured fragments use a conservative capacity bound. Damaged transfer receipts create ACTIVE defect holds. OTHER evidence is limited to DRAFT or authorized POSTED reversal work, and the UI provides preflight, reason, evidence and exact retry. Purchase inspection creation writes the PO timestamp to serialize with cancellation. Frontend stock mutations invalidate inventory, location and lot caches; custody targets load all server-filtered pages. The lot listing imports the missing `exact` helper. No shared-database write, migration, index change or historical repair is included.

Verification: focused frontend receiving/transfer suites 90/90 across 16 files, typecheck and production build pass; changed-file ESLint passes (the earlier full lint had no errors and one existing Scene warning). Synthetic browser checks at 1440×900 and 390×844 covered OTHER reversal validation and exact retry, custody targets and forbidden-role navigation. Native API integration 28/28 and direct-sales/return integration 21/21 passed; pure backend contracts 35 passed with 7 opt-in integration cases skipped. Disposable Mongo probes covered claim reacquisition, PO inspection/cancellation races, OTHER approval and replay, historical SEALED partial receipt, measured LOOSE receipt without dimensions, TRANSFER Sales visibility, damaged holds and automatic putaway. One existing transfer integration fixture still calls manual ITR creation after automatic putaway; `ui:check` still flags native buttons in two existing test mocks. Test files were not changed. The retained independent reviewer recheck returned **OK with notes** and found no new source issue; it was read-only source review and did not run tests, browser, HTTP or DB operations. Runtime/browser evidence is listed separately above.

## 20 November 2026 — Refresh receiving code guide after commit a2a3ffc

User requested (20/11/2026) that `git_doc/docs/09_phat_trien/HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md` match current code again. Docs-only: no code, model, API or data change.

- Re-anchored line links shifted by a2a3ffc in `purchase-read.service.js` (`enriched` 61, `listDocuments` 191, `receivingSummary` 229, `receivingQueue` 267, `receivingHistory` 276), `purchase-order.service.js`, `po-receiving.service.js` (`changeDestinations`, `inspectionContext`, `receivingOperation`, `postCustodyReceipt`); added anchors for `correctionBlockers`, `correctionPreflight`, `replaceInspection`, `eligible`, `checkDependentDocuments`, `reversalPreflight`, `reverseReceipt`, `restoredCustodyPortions` and each custody command.
- Section 2.11 documents `enrichLineItems` (product/lot specification and location code on read DTOs), the purchase receipt PO number, PO line note and owner/accountant price fields, the full `capabilities` table (including `correct`, custody `cancel`/`reversePreflight`) and inspection `replacedBy`.
- Part 2B: PO reads and `inspectionContext` show the enriched product data; custody detail lists `custodyMetadata`/`returnAvailableQty`; correction blockers list their `action` codes; `eligible` check order, per-portion selection and `restoredCustodyPortions` are explained. State diagram adds GR/custody `REVERSED` and the PO status after reversal.

Validation: `npm run docs:check`; a script resolved every `file.js:N` link in the guide against current source. No tests run (no code change).

## 20 November 2026 | Link a replaced inspection to its replacement

User request (20/11/2026): an inspection that has been corrected must show that it was replaced and link to the replacement.

- `purchase-read.service.js`: inspection detail adds `replacedBy` (`_id`, `documentNo`, `workflowStatus`) for the non-cancelled inspection whose `header.previousInspectionId` points to it. `capabilities.correct` is now `false` when a replacement exists. No model, index, permission or write-path change.
- Updated [the API contract](docs/08_api/GOODS_RECEIPTS.md). Paired FE: `InspectionFormPage.tsx` shows a warning with a "Xem phiếu thay thế" button; `ReceivingDocument` type adds `replacedBy`.
- Validation: the focused `inspection correction` case in `test/native-api.integration.test.js` (`RUN_NATIVE_API_TESTS=1`, temporary DB on local `rs0`) passed with new `replacedBy` and `capabilities.correct` assertions. FE `InspectionFormPage.test.tsx` 20/20 and `tsc --noEmit` passed.

## 20 November 2026 | Receipt reversal, supplier custody and inspection correction

Implemented the BE decisions from `PLAN_dao_phieu_nhap_va_giu_ho.md` after reviewing the receipt reversal and draft cancellation cases. Shared balances can support independent reversals when the original portions are intact and the total quantity remains available. Supplier custody supports draft cancellation and posted reversal. Inspection correction preflight and the write command return the full blocker list. The four correction and reversal write paths accept optional evidence.

- Receiving changes span `po-receiving.routes.js`, `po-receiving.service.js`, `purchase-correction.service.js`, `purchase-custody.service.js`, and `purchase-read.service.js`. When purchase intake changes ownership, it selects portions from the originating custody line. If a purchase reversal returns a split portion, its ledger links identify the portion for custody reversal.
- `goods-receipt.routes.js` and `other-receipt.service.js` apply the shared reversal conditions and optional evidence to OTHER receipts. `permissions.data.js` describes the existing update and reverse grants.
- Updated [the API contract](docs/08_api/GOODS_RECEIPTS.md), [runtime](docs/08_api/NATIVE_MODEL_RUNTIME.md), [Iteration 1 API](docs/08_api/ITERATION1_NATIVE_2026-11-06.md), [project guide](PROJECT_GUIDE.md), [data dictionary](docs/03_thiet_ke/DB_Current_2026-11-09_57/WMSD_Data_Dictionary.md), [receiving code guide](docs/09_phat_trien/HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md) and [UC-37 RTM](../docs/rtm.md).
- Integration checks in `test/native-api.integration.test.js` and `test/goods-receipt.integration.test.js` use temporary databases on local replica set `rs0`. The two-file run reached 27 passes and 6 failures. The existing lot-filter case threw `ReferenceError: exact is not defined` before writing its fixture ledger movement, leaving an unbalanced quantity that affected five later assertions. The final focused run passed 12 receipt, custody and correction cases. Both schema checks, syntax checks on eight BE files, `git diff --check` and `npm run docs:check` passed.
- Legacy receipt movements without `packagingPortionIds` select from the whole balance. Open transfer tasks, inventory counts and active defect holds can still block reversals on a shared balance or location. Active supplier returns and custody releases still block their source. The changes use the existing collections and permission grants. No data migration or rollout was run.

## 20 November 2026 — Plan for receipt reversal, custody receipt cancel/reverse and inspection correction blockers

User requested (20/11/2026) a review of two comments on receipt reversal and draft receipt cancellation, then a plan for another agent. Docs-only: no code, model, API or data change.

- Plan file `PLAN_dao_phieu_nhap_va_giu_ho.md` in the workspace root, outside the `be/` and `fe/` repositories.
- Recorded the analysis and the user's decisions in `be/docs/ai-log.md` and `fe/docs/ai-log.md`. Added a dated "plan only" note to UC-37 in `be/docs/rtm.md` and `fe/docs/rtm.md`; implementation and verification statuses are unchanged.
- Return workflows (supplier returns, custody releases) are out of scope.

Validation: `npm run docs:check`. No tests run (no code change).

## 20 November 2026 — Enrich receiving & purchase order line DTOs with product and lot specifications

Source: lecturer UI review on Goods Receipt layout and product descriptions (comparing WMSD receipts against the supplier invoice sample). No database schema, collection, index, permission or write-path contract changed.

- Added `enrichLineItems(items)` in `src/shared/utils/document-items.js` to attach `productSkuSnapshot`, `productSpec` (`sku`, `name`, `manufacturerCode`, `material`, `surface`, `color`, `lengthMm`, `widthMm`, `heightMm`, `description`, `baseUnit`), `lotLabelSnapshot`, `lotSpec` (`manufacturerLot`, `tone`, `calibre`, `piecesPerCarton`), `destinationLocationCode`, and `destinationLocationName` when shaping read responses.
- Updated `src/modules/po-receiving/purchase-read.service.js` (`enriched` uses `enrichLineItems`; `getDocument` for `PURCHASE` receipts adds `header.purchaseOrderNo`, `items[].poLineNote`, and — only for `OWNER`/`ACCOUNTANT` via `financial(user)` — `items[].unitPurchasePrice`, `items[].poEnteredUnit`, and `items[].receivedLineAmount` using `ExactDecimal`). Updated `src/modules/goods-receipts/goods-receipt.routes.js` (`scopedDetail`), `src/modules/purchase-orders/purchase-order.service.js` (`getPurchaseOrder`, `listPurchaseOrders`), and `src/modules/po-receiving/po-receiving.service.js` (`inspectionContext`).
- Docs updated: `git_doc/docs/08_api/GOODS_RECEIPTS.md`.
- Paired FE updates (`../fe`): shared `ProductSpecificationCell` component, formatting helpers (`formatViNumber`, `sumDecimalValues`, `summarizeQuantitiesByUnit`), and invoice-aligned receipt/PO/inspection/custody/replenishment tables.
- Validation: BE `npm run docs:check`, `node --check` on the 5 edited BE files, and `node --test test/goods-receipt-schema.test.js test/reviewed-model-files.test.js` (2/2) passed; FE focused ESLint (0 errors, 0 warnings), `tsc --noEmit`, `vite build`, and 6 targeted Vitest suites (`ReceiptDetailPage`, `PurchaseOrderProgressTable`, `PurchaseOrderDetailPage`, `CustodyDetailPage`, `InspectionFormPage`, `ReplenishmentDetailPage` — 68/68) passed. Full DB integration tests requiring local replica set (`RUN_GOODS_RECEIPT_TESTS=1`) were not run.

## 19 November 2026 — Refresh RR → receipt → BF03 code-reading guide

User requested (19/11/2026) that `git_doc/docs/09_phat_trien/HUONG_DAN_CODE_RR_NHAP_CAT_HANG.md` match current code. Docs-only: no code, model, API or data change.

- BF03 sections now describe optional `packagingState: SEALED|LOOSE` on create/edit lines and `items[].details.packagingState` (18/11/2026 mixed carton + loose decision), the per-category Zod duplicate rule, `relocationItems` category pool and `allowLooseSplit`, `moveStock(..., { packagingState })` on confirmation, and the `splitPortions` LOOSE mode.
- `locationMovementOptions` section documents the extra `packagingPortions` projection and the `blindCountScope` filter that hides balances of locations locked by a COUNTING stocktake from non-Owners; `Stocktake` added to the model table.
- Corrected stale line anchors in `replenishment.commands.js`, `purchase-order.commands.js`, `conversions.js`, `location-movement.service.js` and `purchase-core.js`.
- Second pass, every function from RR creation to receipt posting checked against code: PO factor snippet now shows the unit-change rule (`changedUnit` only; changed unit drops lot/packaging) and the whole-unit check; RR `items()` documents the integer-carton check; submit shows its creator/status guards; `resolveSource` lists `STOCK_THRESHOLD`; `freeQuantity` counts only unreserved pending tasks; inspection confirmation and receipt posting document the per-line `locationAt` RECEIVING checks; `beginStock` snippet matches its hashes; `receiveStock` explains the estimated `measuredVolumeMm3` on LOOSE/OPEN portions; state diagram adds CANCELLED for RR, PO, ARR, INS and GR; LCV uses the compact warehouse code.
- Third pass (user request: include every dependent/related flow): new Part 2B lists every route of the replenishments, purchase-orders, po-receiving routers and the purchase part of goods-receipts with service function and permission, then documents RR options/sources/evaluate/list/submissions/cancel, PO edit/reschedule/close-remainder/cancel (RR link released)/reads, inspection context, receiving operation lookup, draft cancellation, destination change, receiving reads and queues, inspection correction (`replaceInspection`), receipt reversal (`eligible`, `reverseReceipt`), purchase evidence, the supplier custody branch (post, reinspect, decide, accept-to-receipt, release), `reconcilePurchasing` and `scripts/purchase-maintenance.mjs`, RR source types, and downstream users (BF03, defect reports, supplier returns, operational reports, suppliers, stock history). Part 3 adds six side-flow risks, including that no worker consumes `BUSINESS_NOTIFICATION` system events in `src`.

Validation: `npm run docs:check`. No tests run (no code change).

## 19 November 2026 — Correct erroneous empty-location confirmation

User requested a recoverable BF-05 flow after a Warehouse Staff member confirms a location empty by mistake. Added `POST /stocktakes/:id/correct-empty-location`, requiring the latest `EMPTY_LOCATION` count, a correction reason and ATTACHED evidence. The original count remains append-only; the command adds a linked `DISCOVERED` snapshot and `STOCK` count through `correctsEmptyCountId`. No balance is posted, no lock/cutoff is changed, and repeat correction of the same empty count is refused. Frontend exposes the action on the empty-location row and keeps the correction in history. No collection or index was added; old counts remain readable.

Backend `npm test`: 271 passed, 1 mock-only movement options case failed, and 133 opt-in cases were skipped; `movement-projections.test.js` needs a `Stocktake.find()` fixture for the blind-count lookup. The isolated lifecycle and resolution suites passed 5/5 and 7/7 respectively. Frontend `pnpm ui:check` remains blocked by two native `<button>` mocks in unrelated tests. The correction smoke covered assignment/evidence guards, unchanged state after rejection, append-only history, linked snapshot/count, idempotent replay, duplicate rejection and subsequent discovery. Frontend `pnpm typecheck`, full lint with zero errors and one existing `Scene.tsx` warning, focused lint, and direct Vitest stocktake suite 116/116 passed. Browser synthetic correction flow was checked at 1440×900 and 390×844 with no page errors; existing Ant Design deprecation warnings remain. The independent reviewer returned OK with notes; correction-specific concurrency remains a residual risk because project policy forbids adding test files without an explicit request.



Source: user request (18/11/2026): "thủ kho sẽ nhập số hàng bị chênh lệch, chênh lệch bao nhiêu, lý do là gì, ví dụ chênh −30 viên thì vỡ 27 viên và mất 3 viên, sau đó sẽ gửi lại yêu cầu cho chủ cửa hàng, chủ cửa hàng sẽ phê duyệt". Decisions: broken tiles move to `DAMAGED` quality at the same location (not written off); counters count only good tiles into the good row.

BE: plan lines (`stocktakes.resolutionPlans[].items[].details`) gain optional `reasonCode` (`DAMAGED`, `LOST`, `MISPLACED`, `FOUND`, `RECORD_ERROR`, `OTHER`) and `reasonNote` (≤ 500); `POST /stocktakes/:id/resolution-plans` requires `reasonCode` and a note for `OTHER`, and checks the reason against the line (decrease: `LOST`/`RECORD_ERROR`/`OTHER`; increase: `FOUND`/`RECORD_ERROR`/`OTHER`; moves: `MISPLACED`/`RECORD_ERROR`/`OTHER`, plus `DAMAGED` for a quality change into damaged stock). A `RECLASS` `DAMAGED` line without `toBalanceId` is stored as is (refused at submission if the session already has that damaged row); close finds or creates the `DAMAGED` balance of the same location, lot and owner, so a rejected or cancelled plan leaves no empty balance behind, and lets `DAMAGED` moves open a carton. Plan detail returns the reason fields. Existing plans without a reason stay valid. Docs: STOCKTAKE_LIFECYCLE submit and review rows.

FE: the plan form lists one line per reason with a "+" to split a group (e.g. 27 Vỡ/hỏng + 3 Mất/thất lạc) and a note column; the stock action follows from the reason. Plan lines on the stocktake and the owner's adjustment request show the reason. The count form now says to count only good tiles and note broken ones.

Verification: backend stocktake suites 19/19 on the isolated 27018 replica set (existing plan payloads gained a `reasonCode`); a scratch run on a throwaway database closed book 300 / counted 270 with 27 `DAMAGED` + 3 `LOST` to GOOD 270 and DAMAGED 27. Frontend stocktake suites 116/116 (existing form tests now pick a reason); adjustments has 2 failures that already fail without this change.

## 18 November 2026 — Stocktake plans must resolve every difference at submission

Source: user reported a session stuck at close ("nhập sai thì nó phải xử lý cả 3 viên vỡ nữa", 18/11/2026): a −173 difference was planned as "Giảm 170", approved and executed, then close refused with "Phương án chưa giải quyết đúng toàn bộ chênh lệch". Submission only checked that no line exceeded its difference; completeness was first checked at close, after which the session could neither be cancelled nor given a new plan. `submitResolutionPlan` now runs the close projection (book + DELTA, minus/plus for RECLASS/RELOCATE) and refuses any plan that leaves a group off its selected count. The frontend plan form (redesigned as a table with pre-paired quality/location changes and per-group coverage) blocks the same case before sending. Docs: STOCKTAKE_LIFECYCLE.

FE: the plan form lists one line per reason with a "+" to split a group (e.g. 27 Vỡ/hỏng + 3 Mất/thất lạc) and a note column; the stock action follows from the reason. Plan lines on the stocktake and the owner's adjustment request show the reason. The count form now says to count only good tiles and note broken ones.


Verification: `RUN_STOCKTAKE_RESOLUTION_TESTS=1` 7/7 and `RUN_STOCKTAKE_LIFECYCLE_TESTS=1` 5/5 on the isolated 27018 replica set; frontend stocktake suites 116/116 (one existing test changed from "partial line accepted" to "partial line refused, full line sent"). No backend test was added. Reviewer follow-up: submission also refuses opposite `DELTA` lines of one lot and owner (close already did), with the same message.

Recovery decision (user, 18/11/2026: "Mở lại bước đếm"): new `POST /stocktakes/:id/reopen-counting` (`stocktake:create`, Owner, reason required) from `RECONCILING`, `PENDING_APPROVAL`, `APPROVED` or `IN_PROGRESS`. Open plans are cancelled with the reason, the reconciliation (`selectedCounts`, `lastReconciledAt/By`) is cleared, locks/snapshots/counts stay and the session returns to `COUNTING`; nothing was posted before close, so stock is unchanged. Frontend: "Mở lại bước đếm" button with a confirmation dialog on the stocktake detail for the Owner. Limitation: the book was visible after reconciliation, so the recount is not blind. Review M1 fixed: while blind (`COUNTING`, or cancelled before any reconciliation) `getStocktake` and `listStocktakes` return resolution plans without `items`, `selectedCounts` and `executionRecords`, since a cancelled plan's lines (count − delta) would reveal the book; scratch script asserts detail and list for a reopened session. Unit stocktake suites 36/36, list integration 3/3. Second review (H1/H2/M1): `getResolutionPlan` redacts lines, selected counts, executions, snapshots and counts while blind; `listResolutionPlans` skips sessions in `COUNTING`; return-workflow `options()` loads stocktakes without `resolutionPlans` and, for non-Owners, without `COUNTING` sessions (as `lookup kind=stocktakes` already did). Free-text reasons stay visible (documented; the reopen dialog asks not to write quantities). Scratch script asserts all three paths; return-workflows unit 7/7 and integration 20/20. Third review: blind plan detail also empties `lookups.locations/batches/products`, and the plan list uses the full blind rule (also excludes `CANCELLED` sessions never reconciled). Verified with an isolated scratch script (not committed): incomplete plan refused; Staff refused; Owner reopen cancels the approved plan, keeps locks and the 188 balance; recount 18, reconcile and a −170 plan submit; second reopen from `COUNTING` refused. Suites rerun: resolution 7/7, lifecycle 5/5.

## 18 November 2026 — Stocktake planning: product filter follows the chosen scope

Source: user reported that "Chỉ kiểm các sản phẩm" listed every product instead of the products of the chosen warehouse (18/11/2026). `GET /stocktakes/options` adds `stockedProductIdsByLocation` (`{ [locationId]: productId[] }`), built from the balance rows at each active location's holding point, the same rows activation snapshots. The frontend plan form offers only products stocked in the selected locations, or anywhere in the warehouse while no location is selected; products already in the filter stay listed so an existing plan keeps its labels; the field is disabled until a warehouse is chosen. `products` is unchanged, so older clients keep working. Docs: STOCKTAKE_LIFECYCLE.

Verification: frontend typecheck, eslint and stocktake suites (116 pass); the live local API returned the new map (K-GACH-01: 164 of 166 products stocked; locations DM01-G-01-2 and DM01-G-03-2: DM01-AP6601, DM01-AP6602). No backend integration test was added. Limitation: zero-quantity balance rows count as stocked, matching what activation would snapshot.

## 18 November 2026 — Blind count: defect probing closed

Source: user asked to settle the last limits sensibly ("Sửa cho nó hợp lý đi", 18/11/2026). `createDefect` with `sourceKind: STOCKTAKE` now refuses a non-Owner while the session is `COUNTING`, before the quantity check, so repeated "Vượt lượng chưa chặn" refusals can no longer reveal the blind book; the condition is noted on the count and the defect is recorded after reconciliation (only Warehouse Staff holds `defect:create` in the seed). Correction: replenishment evaluation already leaves locked locations out of available stock (`replenishment.evaluation.js` `availableStock`), so the earlier "replenishment totals" limit was wrong. Accepted residual: before/after of other movements at a visible location can, in theory, be combined to infer one A→B relocation; hiding a visible location's whole history would block normal work. Docs: RETURN_WORKFLOWS_NATIVE defect contract, HIEUDT_WAREHOUSE_SCOPE, user guide.

Review Lows fixed: the defect form's session picker (`lookup kind=stocktakes`) no longer offers a `COUNTING` session to a non-Owner; the guide says a condition found after a row is saved goes through Đếm lại with a reason.

Verification: isolated replica-set scratch script 32/32 (Warehouse Staff defect refused with the counting message during COUNTING; the picker hides the counting session and offers it after reconciliation; after reconciliation the same request reaches the quantity check); BE return suites 7 pass, 0 fail.

## 18 November 2026 — Blind count: remaining limits closed

Source: user asked to fix the remaining accepted limits ("Ok fix đi", 18/11/2026). Inventory report rows withheld while counting carry `blindCount: true`; the report table, its CSV and every Excel export (`src/shared/lib/excel.ts`) write "Ẩn khi đang kiểm kê" instead of an empty cell. `redactMovement` and `/stock-movements` now withhold before/after on both endpoints of a movement touching a counted balance (on the visible endpoint their difference was the moved quantity); `/lots/:id/movements` uses the same helper. `GET /transfers/options` returns `blindCountedLocations` and the transfer form says "Chưa tính N vị trí đang kiểm kê" under the source stock. Not changed (needs a business decision): the over-quantity refusal when creating a defect at a counted location can be probed repeatedly; adjacent movements of a visible location can still be combined; replenishment totals still include counted locations.

Verification: isolated replica-set scratch script 28/28 (adds an A→B relocation hidden on both ends in the movement log and lot movements, report `blindCount`, transfer `blindCountedLocations`); BE transfer/return/lookup/warehouse-stock/reports/stocktake-detail/location-movements suites 54 pass, 8 skipped (live), 0 fail; FE tsc, eslint on changed files, vitest operational-reports/transfers/warehouse-stock/shared lib/stocktakes/lots 211/211; docs:check.

## 18 November 2026 — Blind count extended to stock reads and cancelled sessions

Source: user decision 18/11/2026 ("ẩn hết cả hai") on the two pending review points: hide current balances of locations being counted, and keep book quantities hidden for a session cancelled before reconciliation.

BE (no schema/index/permission change): new `src/shared/utils/blind-count.js` (`blindCountScope(user, session)`: locations locked by a `COUNTING` stocktake and their balances; empty for the Owner). Non-Owner readers get `null` quantities with `blindCount: true` in `GET /inventory`, `/inventory/:id`, `/warehouse-locations/:id` (also `capacity.occupiedMm3`), `/stock-movements` (moved quantity and before/after of hidden endpoints), `/reports?group=inventory`, `/lots/:id` (also drops `packagingPortions`) and `/lots/:id/movements`; `/location-movements/options` leaves those balances out. `GET /stocktakes/:id` also omits `bookQtyBase` for a CANCELLED session without `header.lastReconciledBy`. FE: hidden quantities read "Ẩn khi đang kiểm kê" on the inventory list/detail, location detail, movement log and lot trace; the stocktake detail treats a cancelled session without book quantities as blind. Docs: HIEUDT_WAREHOUSE_SCOPE, STOCKTAKE_LIFECYCLE.

Review (same independent reviewer, recheck): H1 — `/transfers/options`, `/sales-orders/options` and `/return-workflows/lookup?kind=balances` still returned the quantities. Fixed by leaving out balances of blind-counted locations there and, found while fixing, in the return-workflow options, direct-sale stock sources and manual goods-issue stock sources. L2 fixed: the lot trace labels a null endpoint quantity as hidden only when the endpoint is in scope. Full review H3: the lot trace actually routed at `/lots/:id/trace` is the return-workflow trace (`GET /return-workflows/lots/:id/trace` and `/trace/records?section=movements`), which still returned movement quantities and before/after; both now use `redactMovement` and `trace.tsx` shows "Ẩn khi đang kiểm kê". The earlier L2 edit is in `LotTracePage.tsx`, which no route uses. M3: the user guide no longer tells users to add carton dimensions to the lot when closing is refused (lot packaging is locked once it has stock, and closing reads the balance's packaging snapshot). Recheck H2 (regression of the H1 fix): leaving blind balances out of the return-workflow balance lookup blocked a defect with source Kiểm kê, which must reference a balance at the counted location. Fixed: `/return-workflows/lookup?kind=balances` and the return-workflow options keep those rows with null quantities and `blindCount: true`; the picker shows "Ẩn khi đang kiểm kê" and the defect form skips the visible maximum (the command still checks the real quantity). Accepted Low: reports, CSV and Excel show hidden quantities as empty cells (the "Đang kiểm kê" column marks the row); before/after of a visible endpoint (A→B relocation) remain; the transfer form's source stock summary leaves out counted locations without a note; repeated over-quantity refusals when creating a defect at a counted location could be used to probe the book.

Limits: balance rows remain listed on stock reads (lot present, quantity hidden); replenishment evaluation still totals availability including counted locations; the Owner still sees balances while counting.

Verification: BE unit tests warehouse-stock, operational-reports, location-movements, stocktake-detail, stocktake-count-sheet 45/45 and, after the review fix, transfer/sales/goods-issue/return suites 60 pass, 9 skipped (live), 0 fail; scratch script on the isolated `hieudt-mongo` replica set (throwaway database dropped) 25/25 checks (incl. both lot-trace endpoints), including the five option sources above (the goods-issue detail source list is covered by code only): hidden for Warehouse Staff on the locked location, unchanged for an unlocked one and for the Owner, visible again after cancel, book hidden after cancel-before-reconcile and shown after cancel-after-reconcile. FE `tsc`, eslint on changed paths, vitest warehouse-stock/lots/stocktakes/operational-reports 142/142; return-workflows/transfers/lots 71/74, the 3 failures in `return-workflows/usability.test.tsx` (customer combobox not found) also failed before the return-workflow changes. Return-workflow BE suites 7 pass, 7 skipped (live), 0 fail.

## 18 November 2026 — Final independent review fixes for the stocktake flow

Source: one fresh read-only reviewer requested by the user over the whole uncommitted stocktake change set (no Critical/High). Fixed: inline count inputs are locked while a save result is uncertain so "Thử lại" can only resend the displayed values (M2); the pending-plan notice polls only for users holding both `stock_adjustment:approve` and `stock_adjustment:read`, and its accessible name contains the visible text; STOCKTAKE_LIFECYCLE no longer claims that count entry ignores current conversion factors or that history has no evidence access.

Pending user decision (M1): while COUNTING, `/inventory` and location detail still show current balances (equal to the frozen book) to `inventory:read` holders, including counters. Accepted limits reported: products of factor × quantity above 6 decimals are refused by the API with a generic message; MainLayout imports the stocktakes barrel (bundle impact not measured); dialog saves do not join the inline version wait (a 409 self-heals after refetch); count conversion factors are not checked against the Conversion table server-side. The header notice at 390 px (possible overflow next to the brand) was not checked on mobile.

Verification: FE `tsc --noEmit`, eslint `src/features/stocktakes`, vitest `src/features/stocktakes src/app` 160/160; docs:check.

## 18 November 2026 — Stocktake close may open a carton for a counted shortfall

Source: browser E2E of KK-K-GACH-02-261117-000002 (book 72 Viên = 36 sealed cartons of 2, counted 71) reached an approved, fully executed plan that could not be closed: "Không tự mở thùng; chọn lượng nguyên thùng hoặc phần hàng lẻ đã đo". The session could no longer be cancelled either (plan approved), so it stayed locked. User decision 18/11/2026: let closing open a carton, as goods issues already do.

BE: `stocktake-closure.service.js` closes a negative `DELTA` with `splitPortions(..., { allowOpening: true })`; loose/open portions are consumed first and a sealed carton is split into an open portion with the carton-volume bound. Missing carton dimensions still refuse. FE: count dialogs ("Nhập kèm ghi chú", "Đếm lại", "Xác nhận trống") are disabled while an inline save waits for the refreshed version (review round 2 Low). Docs: STOCKTAKE_LIFECYCLE limitation and cancel guard.

Verification: lifecycle integration 5/5 on the isolated replica set after the change; after deploying the change the stuck E2E session was closed through the UI: status COMPLETED, lock RELEASED, balance DM01-G-07-1 72 → 71 (35 sealed cartons = 70 + 1 OPEN), balance version 1 → 2. No automated test covers a non-carton negative DELTA at close yet.

## 17 November 2026 — Stocktake flow improvements: cancel, server blind count, unit counting, scope picker, notices

Source: user asked to improve the whole stocktake flow and decided on 17/11/2026: Owner may cancel before any plan is approved; in-app notice (no email); book quantities hidden from everyone while COUNTING; fix the stuck demo stocktakes on Atlas dev.

BE (no schema/index/permission change):
- `POST /api/stocktakes/:id/cancel` (`stocktake:create`, body `idempotencyKey`, `expectedVersion`, `reason`): only PLANNED/COUNTING/RECONCILING; releases every LOCKED lock of the session (`closureReferenceId` = operation id), cancels non-final plans and fills the existing root `cancelledBy/cancelledAt/cancelReason`; snapshots and counts stay; no stock is posted.
- `GET /stocktakes/:id` omits `bookQtyBase` while COUNTING for every role and returns `lookups.conversions` (current factors of the counted products).
- `GET /stocktakes/options` adds `areaCode`/`locationType` on locations, `lockedLocationIds` and active `products`.
- Evidence upload review fixes: storage confirmation moved inside the cleanup scope; assets are destroyed only for known failures.
- Review round 2: cancel is refused while a plan is pending/approved/executed (legacy data guard) and cancelled plans record `cancelledBy/cancelledAt/cancelReason`. FE inline saves lock every row while a save runs and until the server-returned version arrives; conversion factors are normalized before the 6-decimal check; inline inputs have visible unit labels and fixed-width boxes.

FE: inline first count per row with carton/piece entry converted exactly to the base unit (`quantityEntries` sent only when a non-base unit exists); dialog renamed "Nhập kèm ghi chú" for notes, recounts keep the dialog; Owner cancel button with confirmation and reason; cancelled banner; "Bước tiếp theo" line and grouped header actions; plan form in two columns, locations grouped by area with quick-select buttons, locked locations disabled, optional product filter, lot filters preserved on edit; approver notice in the header and a pending-count badge on Duyệt Điều Chỉnh (polls every 60 s). Shared CSS fix in `workspace.css`: antd form labels inside `.operations-page` keep a one-line layout (the generic label rule had put the required mark on its own line).

Data (Atlas dev, authorized by the user): backup of the 18 affected stocktakes and their 18 locks in `backups/stocktake-fix-2026-11-17/` at the workspace root; 9 RECONCILING sessions with legacy DRAFT plans cancelled through the new API as Owner (9 STORAGE-12 locks released); 9 CLOSED sessions set to COMPLETED with `version` +1. Afterwards: 9 COMPLETED, 9 CANCELLED, the user's own test session untouched.

Verification: BE unit 36/36 (stocktake detail test updated for the new lookups), lifecycle integration 5/5 on an isolated replica set (127.0.0.1:27018/hieudt-test), docs:check. FE `tsc --noEmit`, eslint on changed paths, vitest stocktakes 116/116 (existing count/evidence tests adapted to the new controls). Write-free API probes on the running stack: wrong content 400, wrong step 400, missing file 400, unknown evidence 404, Owner upload 403. Browser (1440): create form layout/area quick-select, detail header with next step and cancel button, cancelled banner, sales order form label regression check. Not exercised: a real Cloudinary upload, inline counting on a live COUNTING session, the notice with a pending plan, mobile layout of the new controls.

## 17 November 2026 — Stocktake evidence upload and view

Source: user reported that the found-not-in-book and execution forms only accept pasted file ids although no stocktake upload existed, and chose the existing private Cloudinary storage with upload plus view.

BE: new `stocktake-evidence.service.js` and routes `POST /api/stocktakes/:id/evidence` (multipart `file`, JPEG/PNG/PDF ≤ 5 MB, content-verified by the shared `inspectFile`) and `GET /api/stocktakes/:id/evidence/:evidenceId` (60-second private link). Upload requires warehouse access, the step permission (`stocktake:update` while COUNTING, `stock_adjustment:update` while APPROVED/IN_PROGRESS) and counter assignment, then saves one ATTACHED `Attachment` owned by the stocktake (`purpose: STOCKTAKE_EVIDENCE`). The stocktake and its version are unchanged; count/execution commands keep their existing evidence checks. No schema, index, permission or seed change.

FE: `EvidenceUploadField` replaces the paste-id `EvidenceIdsField` in DiscoveredCountForm and ExecutionPanel. Count history, execution plan lines and the adjustment detail executions show **Xem** buttons opening the short-lived link. Existing lifecycle tests were adapted from pasting ids to uploading a file through MSW; no new test files.

Docs: STOCKTAKE_LIFECYCLE (endpoint table, new Evidence upload and view section, resolved limitation). Remaining limits: uploads are not idempotent and unreferenced uploads are not cleaned up.

Verification: see the stocktake flow improvements entry above, which re-ran all checks on the final combined code.
## 19/11/2026 · RR và PO lấy lượng gốc làm căn cứ

Theo `PLAN_lam_tron_theo_vien_RR_PO.md`, mục này thay thế các quyết định ngày 18/11 về `approvedEnteredQty`, giới hạn theo đơn vị RR và ví dụ điền sẵn 4 m². RR và lịch sử duyệt chỉ ghi lượng duyệt ở `approvedQtyBase`. Khi duyệt giảm, API yêu cầu lý do trên dòng. RR và PO chặn số lẻ đối với đơn vị thùng và đơn vị gốc yêu cầu số nguyên.

`makeItem` và lệnh lập hoặc sửa PO ghi lượng diện tích quy ngược từ lượng gốc đã làm tròn, sau khi kiểm kết quả quy đổi lại. PO tính tiền theo lượng đã lưu. Lệnh lập, sửa, phát hành và đối soát PO chỉ cho vượt lượng duyệt với số thùng nguyên nhỏ nhất đủ phủ lượng duyệt. Kiểm nhận sử dụng quy cách của lô thực nhận.

Đã cập nhật hợp đồng API, H01/H02, Model Map, Data Dictionary, hướng dẫn code và seed. Seed `wmsd_demo_rr_po_quantity_20261119` trên MongoDB cục bộ có 58 collection, 717 bản ghi và đối soát mua hàng không có lỗi. PO mẫu đặt theo viên, giá trị đơn hàng giữ nguyên. Đã chạy 96 ca BE về quy đổi, RR, PO, nhận hàng, chuyển kho, bán, nhập khác, tồn đầu và seed. Giữ dữ liệu hiện có, áp dụng hợp đồng mới khi FE dùng payload duyệt tương ứng.

Sửa sau review cùng ngày: dòng PO giữ đơn vị của RR thì dùng lại hệ số và lô đã lưu trên dòng RR. Trước đó, dòng RR đặt theo thùng của lô 5 viên/thùng bị quy theo hệ số thùng cấp sản phẩm (4 viên), nên 3 thùng bị ghi thành 12 viên thay vì 15. Chỉ khi đổi đơn vị, PO mới dùng quy đổi cấp sản phẩm và bỏ lô. FE tạo và sửa PO cũng dùng lại hệ số của RR khi người dùng chọn lại đơn vị đó. Bảng tiến độ PO không còn hiện lặp số lượng theo đơn vị đặt. Bỏ đoạn tự ẩn `approvedEnteredQty` của bản ghi cũ (`toObject` trong model RR, projection ở danh sách và chi tiết RR) cùng ca test tương ứng, vì DB sẽ được seed lại. Đã thêm 2 ca BE trong `test/replenishment-warnings.integration.test.js` (giới hạn vượt lượng duyệt theo thùng, m² và viên; hệ số thùng của lô) và 1 ca FE trong `CreatePurchaseOrderModal.test.tsx`. Đã chạy với `RUN_NATIVE_API_TESTS=1`: `replenishment-warnings`, `replenishment-evaluation`, `area-conversion` đều đạt. FE: `vitest run` cho `purchase-orders` (82 ca), `replenishments`, `shared/lib`, `inspections`, `receipts` đều đạt.

## 18/11/2026 · Tone và calibre của lô hàng

Người dùng quyết định thêm lại tone màu và calibre cho `product_batches` (đảo quyết định bỏ hai trường ngày 06/11/2026). Cả hai tùy chọn ở BE (null/thiếu được, tối đa 20 ký tự) để opening-stock import, seed và lô cũ vẫn hợp lệ; FE bắt buộc nhập khi lô `VERIFIED`. Khóa duy nhất giữ `productId + manufacturerLot`, không đổi index, không migration/backfill.

API `/lots`: `POST`/`PUT` nhận `tone`, `calibre`; `GET /lots` lọc `tone`, `calibre` (khớp một phần, không phân biệt hoa thường). `PUT` chặn đổi tone/calibre khi lô đã có chứng từ hoặc tồn (cùng quy tắc với số lô và quy cách thùng); `null` và thiếu được coi là như nhau. `GET /lots` trả thêm `product {id, sku, name}` và `hasScopedStock` (có tồn trong phạm vi kho của người dùng). `GET /lots/:id` trả thêm `identityLocked`, `product`, `stock[]` (kho, vị trí, chất lượng, số lượng gốc) và `verifiedBy {id, fullName}`. `POST`/`PUT` nhận `verificationReference` và `notes` (≤ 500 ký tự, null để xóa); `verifiedAt/verifiedBy` do server đặt khi lô thành VERIFIED. FE: `LotCreatePage`, `CreateLotDialog`, `LotDetailPage`, `LotsListPage`, `lotsApi.ts`; sửa cập nhật lô truyền `expectedUpdatedAt` thật.

Sửa: `lot.service.js` (join sản phẩm, `hasScopedStock`, `stock`, người kiểm tra), `test/lots.integration.test.js` (mới, chạy với `RUN_LOT_TESTS=1` trên DB `rs0` cục bộ, đạt), `product-batch.model.js`, `field-cleanup.js`, `lot.validation.js`, `lot.service.js`, `test/consolidation.test.js`, `InspectionFormPage.test.tsx`. Chạy: `lots.integration.test.js` (1 đạt, DB tạm tự xóa), `consolidation`, `db-rebuild`, `reviewed-demo` (46 đạt), `InspectionFormPage` + `LotTracePage` (18 đạt), `tsc` không lỗi ở `features/lots`. Kiểm thủ công trên trình duyệt với BE tạm và DB cục bộ: tạo lô, sửa tone/ghi chú, lô đã có tồn hiện "Đã khóa" và khóa ô số lô/tone/calibre, danh sách có sản phẩm và trạng thái tồn. Lưu ý: seed fixture cũ giờ giữ `tone`/`calibre` có sẵn trong dữ liệu (trước đây bị xóa khi dựng DB).

## 18/11/2026 · Xóa phiếu tồn đầu demo trên DB dev Atlas

Theo yêu cầu trực tiếp của người dùng, xóa toàn bộ 45 phiếu `opening_stocks` (đều POSTED, dữ liệu seed không có `openingImportSource`, 3 kho) trên DB dev Atlas `wmsd_database`. Chỉ xóa phiếu: 327 `stock_transactions` (gồm 45 giao dịch của các phiếu này) và số dư tồn giữ nguyên, nên các giao dịch đó không còn chứng từ gốc và 3 kho vẫn bị chặn nhập tồn đầu vì đã có tồn. Bản sao lưu EJSON (45 tài liệu) nằm ngoài repo tại `../backups/opening_stocks_wmsd_database_20261118.ejson` trong workspace cục bộ; khôi phục bằng `insertMany(EJSON.parse(...))`.

## 18/11/2026 · Cấp quyền tồn đầu trên DB dev Atlas

Theo yêu cầu trực tiếp của người dùng, chạy `setup-opening-stock-remote.mongosh.js` (cùng logic với `scripts/setup-opening-stock.mjs`, vốn chỉ cho phép localhost) trên DB dev Atlas `wmsd_database`: thêm 3 quyền `opening_stock:read/create/post`, chỉ gán cho OWNER, tạo index `opening_stock_file_import_once`, đặt `stockOperationVersion = 0` cho kho thiếu trường. Chạy thử trước: chưa có quyền nào, không có phiếu ghi trùng kho. Sau khi ghi: chỉ OWNER có quyền. Cũng chạy `setup-opening-stock.mjs --apply` trên DB local `wmsd_demo_tile_shop_v9`. Kiểm thủ công: đăng nhập Chủ cửa hàng, mục Tồn Đầu Kỳ hiện trong Cài đặt & danh mục, trang `/settings/opening-stocks` mở modal nhập. Nguyên nhân lỗi 403 trước đó: BE đọc `.env` (Atlas) nên quyền cấp ở DB local không có tác dụng.

## 18/11/2026 · Tồn đầu: chuyển vào Cài đặt, nhập qua modal

Theo yêu cầu người dùng (tạm thời), trang tồn đầu chuyển từ nhóm Kho & hàng hóa sang Cài đặt & danh mục: route FE đổi thành `/settings/opening-stocks` và `/settings/opening-stocks/:id` (đường dẫn cũ không còn). Mở trang sẽ hiện modal nhập gồm ô chọn kho có tìm kiếm, nút chọn file Excel, tải file mẫu, xác nhận kho trống, kết quả kiểm tra và lưu nháp; nút Nhập tồn đầu mở lại modal. Modal bỏ ba ô mốc tồn đầu, mã đợt và nguồn số liệu: FE tự điền `openingAt` = thời điểm gửi, `cutoverKey` = `TONDAU-<mã kho>`, `sourceDescription` = `File <tên file>` (hoặc `Xác nhận kho trống`). API không đổi. Sửa FE `routes.config.ts`, `roleNavigation.tsx`, `OpeningStockPage.tsx` và test `routeAccess.test.ts`, `OpeningStockPage.test.tsx`; cập nhật [hợp đồng API](docs/08_api/EXCEL_AND_OPENING_STOCK.md). Chạy: `vitest` opening-stock + routeAccess + roleNavigation (36 đạt), `tsc` 0 lỗi. Chưa kiểm thủ công trên trình duyệt. Hạn chế: không chọn được mốc tồn đầu lùi ngày.

## 18/11/2026 · Tồn đầu: tone và calibre của lô

Theo yêu cầu người dùng, nhập tồn đầu đồng bộ với thay đổi tone/calibre của `product_batches`. File Excel thêm 2 cột `Tone`, `Calibre` (17 cột). Lô mới tạo từ tồn đầu bắt buộc có tone và calibre (cùng quy tắc lô VERIFIED trên màn hình lô), được lưu kèm `verifiedAt`/`verifiedBy` là người lưu nháp. Lô đã có: tone/calibre trong file nếu điền phải khớp danh mục, file không sửa lô. Preview và chi tiết phiếu trả thêm `tone`, `calibre`; FE hiện ở cột "Lô / Tone / Calibre". Sửa `opening-stock/validation.js`, `routes.js`, `service.js`; FE `file.ts`, `api.ts`, `OpeningStockPage.tsx`; cập nhật [hợp đồng API](docs/08_api/EXCEL_AND_OPENING_STOCK.md). Test: `test/opening-stock.test.js` với `RUN_OPENING_TESTS=1` trên DB tạm của `rs0` cục bộ (2 đạt; thêm ca lô mới thiếu tone/calibre, tone lệch lô có sẵn, lô mới lưu đúng tone/calibre/người xác minh), FE `vitest src/features/opening-stock` (11 đạt), `tsc` 0 lỗi. Không migration.

## 18/11/2026 · Tồn đầu: đồng bộ FE và kiểm tra lô mới

Review sau khi triển khai `PLAN_ton_dau_khu_tiep_nhan.md` phát hiện FE chưa đổi theo hợp đồng mới, nên mọi file Excel bị BE từ chối vì thừa cột. Đã sửa FE: `file.ts` chỉ còn 15 cột (sau đó thêm tone/calibre thành 17) (số lượng theo đơn vị gốc), trang hướng dẫn mới; `OpeningStockPage.tsx` đổi đoạn mô tả và hiện nhắc cất hàng từ `TONDAU-NHAN` (kèm link `/location-moves`) khi phiếu đã ghi tồn có hàng. BE `opening-stock/service.js`: lô mới thiếu số viên mỗi thùng (số nguyên) hoặc kích thước thùng trả lỗi dòng tiếng Việt thay cho lỗi validate của mongoose. Cập nhật [hợp đồng API](docs/08_api/EXCEL_AND_OPENING_STOCK.md). Test: `test/opening-stock.test.js` thêm ca lô mới thiếu quy cách; FE `file.test.ts` (cột mới, từ chối mẫu 20 cột), `OpeningStockPage.test.tsx` (nhắc cất hàng). Không đổi dữ liệu, không migration.

## 18/11/2026 · Tồn đầu vào khu tiếp nhận

Theo `PLAN_ton_dau_khu_tiep_nhan.md`, API nhập tồn đầu nhận số lượng theo đơn vị gốc. Preview trả một kết quả mỗi dòng và chỉ đọc DB. Khi lưu nháp có hàng, service tạo hoặc dùng lại `TONDAU-NHAN`, ghi nhật ký nếu tạo mới, tách nguyên thùng và hàng lẻ thành các dòng GOOD của cửa hàng. Hủy nháp giữ khu tiếp nhận để dùng lại. Sau khi ghi tồn, kho chuyển hàng bằng BF03. Xác nhận kho trống không tạo khu tiếp nhận.

Cập nhật `opening-stock/validation.js`, `routes.js`, `service.js`, `test/opening-stock.test.js`, [hợp đồng API](docs/08_api/EXCEL_AND_OPENING_STOCK.md), [hướng dẫn local](docs/09_phat_trien/EXCEL_OPENING_SETUP.md) và PROJECT_GUIDE. Không cần migration. Mẫu Excel và payload của FE cần đồng bộ với hợp đồng mới trước khi sử dụng giao diện nhập tồn.

`npm test` có 261 test đạt, 127 test được bỏ qua theo cấu hình mặc định. Chạy riêng `RUN_OPENING_TESTS=1` trên DB thử nghiệm của replica set cục bộ `rs0` qua đủ 2 test, gồm rollback khi dữ liệu lỗi, ghi 10 viên thành 8 nguyên thùng và 2 lẻ, rồi chuyển đủ 10 viên sang STORAGE. Chỉ ghi dữ liệu thử nghiệm.

## 18 November 2026 — Link the location catalogue and drawing in both directions

Location create/edit now optionally assigns draft slots within the selected warehouse in the same transaction. Both screens use the slot's existing locationId. Location detail shows applied and draft assignments and links to the selected draft slot. No new collection, backfill or inventory transaction. See the [warehouse API](docs/08_api/HIEUDT_WAREHOUSE_SCOPE.md) and [drawing contract](docs/10_Kho3D/STAGE2_ZONES.md).


Verification for the bidirectional change: 38 frontend tests, eight layout unit tests and three local MongoDB transaction tests passed. TypeScript passed. The browser showed the empty slot state for Kho Chính. Full frontend lint still reports the existing agent hook parse error and Scene warning. The UI validation and cleanup scripts are absent from this checkout.


## 18 November 2026 — Assign warehouse positions to 3D design slots

The user asked to select positions already created when drawing a warehouse. In the slot form, search the current warehouse's positions by code or name, select one, or clear the link. The existing warehouse detail supplies choices; the layout API stores the optional `locationId` on the draft/applied slot and checks the reference against the same warehouse. New links require an active location. A retained link may stay on the same slot if the location later becomes inactive. Old drawings without the field are supported. No change to warehouse location data, stock, permissions, schema declarations, collections or indexes; no migration. Deploy the FE and BE together.

Verification: 26 targeted FE tests, 12 backend unit tests and one isolated MongoDB integration test passed. The transaction test covered persistence, rejection of another warehouse and nonexistent or newly inactive positions, retaining/clearing an existing inactive link, and unchanged stock. Typecheck and changed-file lint passed. In the local browser, search and assignment of an existing position worked and fit in the form at desktop and narrow widths. No live design was saved or applied. Updated the [Kho 3D contract](docs/10_Kho3D/STAGE2_ZONES.md), warehouse API scope, model map and dictionary.

## 18 November 2026 — Store Owner warehouse design access

The user confirmed that the Store Owner manages every warehouse without assignment. The existing warehouse list and scope already treated `OWNER` this way. The 3D designer had additionally required the function catalogue permission seeded for Admin, hiding the controls and rejecting writes by a default Owner. The Owner's existing `warehouse_location:update` now covers the 3D function catalogue; other roles continue to require both permissions and a warehouse assignment. Updated the warehouse scope, Kho 3D and frontend contracts. No seed, grant, assignment, schema or application database changes.

Verified with 14 targeted frontend tests, 11 backend unit tests, and one isolated MongoDB integration test: an Owner without assigned warehouses listed, opened and applied designs in two warehouses; a custom editor was denied without the function grant or outside their assigned warehouse. Typecheck and changed-file lint passed. The full transaction suite and visual browser test were not run; the automated visual skill and scripts are absent from this checkout.

## 18 November 2026 — Warehouse dimensions and outdoor staging

Source: user requested a usable picking checkbox, dimensions in metres, decimal door offset and outdoor staging. FE enables picking for STORAGE, shows why it is unavailable for other types, and takes the read-only location height from its warehouse. Warehouse forms and details show metres, with exact conversion to API millimetre fields. The location service compares dimension values exactly when an open task protects them. 3D design keeps the entered door offset text until validation; both geometry validators permit areas assigned Khu tập kết/Tập kết outside the outline, with existing overlap and nested containment checks. Updated HieuDT warehouse scope and Kho3D implementation and stage 2 contracts. No schema, permission grant, inventory write, or migration.

Verification: 36 focused FE tests and 11 targeted BE tests passed, as did typecheck and docs:check. Changed-file lint had no errors and one existing WebGL fallback effect warning; full lint fails parsing the existing `.claude/hooks/agent-guard.mjs`. Local browser verified ticking and clearing the checkbox, entering metres, mobile fit and adding a door with `1,25`; there was no submission. The browser actor lacked function-management permission, so outdoor application was verified with FE and BE tests, without writing a real layout. Full transaction suite not run. Automated UI commands could not run: Bash denied access and the scripts and visual skill file are absent from this checkout.

## 18 November 2026 — Mixed relocation cartons and loose pieces

Source: user requested optional 10 cartons + 1 loose piece and the loose field on line 2. FE MoveForm stacks inputs, validates independent stored category caps, shows total and reconstructs mixed edits. API/model add optional WAREHOUSE_TASK details.packagingState SEALED/LOOSE; plans expand into separate tracked items, retain matching IDs on edit and label details/confirmation/history. Stock helper filters the category and permits only explicit known-volume LOOSE splits with conservative bounds; no carton opening, fabricated measurement or OPEN substitution. Existing permission/creator/warehouse/version, partial ledger, idempotency, locks, reservation and capacity checks remain. No collection/index/ref/relationship changes, migration/backfill or application database write. Deploy paired FE/BE.

Updated canonical BF03 API, performance projection contract, model map, Data Dictionary, model changelog, project guide and both contexts. Focused FE tests: 29 passed across MoveForm, presentation, MoveActions and detail; BE focused validation/projection/outbound carton checks: 13 passed. Isolated localhost:27018 transaction profile passed: 10 cartons × 4 + 1 LOOSE, mixed edit ID preservation, independent partial trips, replay and total-stock conservation (remaining 5 sealed cartons + 1 loose). Changed-file lint and docs:check passed. Browser checked the real form at CSS 1440 and 390 widths: 10 cartons + 1 loose displays two vertically stacked inputs and an exact total (61 for the existing 6/carton visual fixture); the seven-column table scrolls locally, with no document horizontal overflow. No plan submitted or stock posted through the application. Viewport reset and temporary tab closed. Existing shared contrast/typography deviations are not certified as resolved; ui-visual-test skill and ui-check/ui-cleanup scripts remain unavailable as recorded in the earlier verification. No commit/push. Full suite and application-stock posting are not part of this verification.

Final mixed-entry validation: FE TypeScript `tsc --noEmit` passed after completing the typed edit fixture; changed-file ESLint and both repositories' `git diff --check` passed. BE `npm run docs:check` passed (58 collections, 885 local links). Tests used direct Vitest/Node runners; no full suite rerun.

## 18/11/2026 · PO cùng đơn vị với RR không vượt lượng duyệt

Theo yêu cầu của người dùng, khi dòng PO dùng đúng đơn vị nhập của dòng RR thì `enteredQty` không được lớn hơn `approvedEnteredQty`; quy tắc làm tròn gói của `withinApproved` chỉ còn áp dụng khi đổi sang đơn vị khác (hoặc RR cũ chưa có `approvedEnteredQty`). Ví dụ RR duyệt 4 M2 thì PO không đặt được 5 M2. Cập nhật `conversions.js` (tham số thứ 5 của `withinApproved`), `purchase-order.commands.js` (tạo/sửa nháp và phát hành), `purchase-reconciliation.js`, test `area-conversion.test.js`; FE `capToApprovedEntered` trong form tạo và sửa PO nháp. Không đổi dữ liệu. Chưa chạy test tích hợp API; `vitest src/features/purchase-orders` còn 3 ca lỗi từ trước (`maxEnteredQty` 278 viên, `orderedBaseQuantity`, form M2 100,08) chưa xử lý.

## 18/11/2026 · Thông báo số lượng PO không nguyên

Tạo và sửa PO nháp trả thông báo rõ khi lượng sau quy đổi sang đơn vị gốc không nguyên với sản phẩm yêu cầu số nguyên; quy tắc kiểm tra và dữ liệu không đổi. Cập nhật `purchase-order.commands.js`, test tích hợp PO và hợp đồng `NATIVE_MODEL_RUNTIME.md`.

## 18/11/2026 · Duyệt RR theo đơn vị nhập

Theo yêu cầu của người dùng, yêu cầu và duyệt dùng cùng một đơn vị. `replenishment_requests.items[]` và `approval_history.itemDecisions[]` có thêm `approvedEnteredQty` (tùy chọn); `reviewReplenishment` nhận `approvedEnteredQty`, tự tính `approvedQtyBase` bằng hệ số đã lưu trên dòng và `toBaseQuantity`, từ chối khi vượt `enteredQty`. Client chỉ gửi `approvedQtyBase` vẫn dùng được. Dữ liệu cũ không có trường mới nên FE hiển thị theo đơn vị gốc.

FE gửi `approvedEnteredQty` ở màn duyệt và hiển thị lượng duyệt dạng "10 m² (28 viên)" ở tab dòng hàng và lịch sử quyết định. Cập nhật CONTRACT trong NATIVE_MODEL_RUNTIME và sheet 13.

Kiểm tra: `RUN_NATIVE_API_TESTS=1` chạy replenishment-warnings (11/11, gồm ca mới duyệt theo đơn vị nhập) và native-api + area-conversion (33/33) trên MongoDB cục bộ; vitest `src/features/replenishments/api` và `detail` 25/25; tsc không lỗi. PO (FE, không đổi API): form tạo PO lấy lượng duyệt theo đơn vị nhập từ `approvedEnteredQty` khi có (thay vì chia ngược từ số viên đã làm tròn lên); form tạo và sửa PO nháp hiện thêm dòng "= N viên" và "vượt lượng duyệt M viên do làm tròn" khi đơn vị đặt khác đơn vị gốc, tính cùng quy tắc với `toBaseQuantity` (`orderedBaseQuantity` trong purchaseOrderLineUtils.ts). `vitest src/features/purchase-orders` 74/74, tsc không lỗi. Sửa 18/11/2026: ô số lượng đặt mua điền sẵn đúng lượng duyệt theo đơn vị nhập (4 m²) thay vì số viên làm tròn lên đổi ngược (4,32 m²); RR duyệt đủ nhưng chưa có `approvedEnteredQty` dùng `enteredQty` của dòng. Chưa làm: trường đơn vị mua mặc định của sản phẩm (cần quyết định thêm trường), chưa xem trên trình duyệt.

## 17 November 2026 — Relocation source packaging overview

Source: user chose the limited display-only scope: sealed cartons, base units inside already open cartons and loose base units from existing data. BF03 options now select packagingPortions.sealedPackCount and quantityBase in the existing balance query; other option endpoints are unchanged. FE presentMoveOptions sums stored sealed counts and OPEN/LOOSE quantities exactly and verifies portion totals against the balance. Current carton factors never invent physical counts. Missing, malformed, unknown or inconsistent packaging is explicit instead of fabricated zero. MoveForm displays the three values in the existing stock cell, keeping seven columns and the total/unit. No open-carton count, new schema, migration, stock mutation, permission or transfer-command change. Updated BF03 README and paired contexts. Main already integrated; preserved all prior inventory/seed and concurrent 3D work.

Verification: 8/8 BE projection/relocation validation checks and 20/20 FE presentation/form/editor tests pass. Tests cover mixed and repeated portions, exact decimal summation, missing/inconsistent legacy data, unchanged command payload and unchanged seven-column table. Typecheck, changed-file ESLint, docs:check and diff whitespace checks pass. Updated the shared read-performance contract to describe the BF03-only projection extension. No full suite or new production build was run for this narrow display/projection change.

Browser checked the existing Warehouse session at the source Khu nhận hàng · DM01: a 32-piece balance shows 7 sealed cartons + 4 pieces inside open packaging + 0 loose; a 100-piece balance shows 15 sealed cartons + 0 open + 10 loose (stored 6-piece carton factor). CSS desktop 1440px keeps seven columns and a fitting table (1068px client/scroll); mobile 390px has no body overflow and retains all four packaging summaries in the table's local scrolling area. No form submission or online stock command. Viewport reset and agent tab closed. Missing/inconsistent data and command preservation are automated checks; a separate unauthorized browser login was not exercised. The referenced visual-test skill and UI check/cleanup scripts remain absent in this checkout, as verified again; direct browser checks substitute. Existing unrelated full-lint deviations remain documented in the preceding inventory entry. No commit or push.

## 17 November 2026 — Inventory overview and direct detail reads

Source: user reported approximately 10 seconds for GET /inventory and requested fastest practical list/detail reads with only relevant fields and overview information on the list. Warehouse-stock reads now project compact scoped context (excluding 3D layouts), balance and joined product/batch fields, batch current-page stock deductions and locks, and use indexed direct detail aggregation instead of reusing the warehouse-wide list. The shared stock read helper exposes exact reserved/pending/held/free quantities and supports sequential reads in a snapshot transaction; existing transfer selection uses the same free-quantity wrapper. Default full rows remain for Excel; view=summary omits detailed quantities, extra IDs/versions and duplicate warehouse metadata. Inventory options reuse the already scoped warehouse read. No schema/index/stock-command/permission change or online DB write.

FE inventory uses summary, seven overview columns and explicit detail navigation; Sales hides physical/quality/owner columns. Detail retains permitted quantities, avoids fabricated freeze status for Sales, uses current route data and fetches independently paginated movement history only when requested with permission. Updated HIEUDT_WAREHOUSE_SCOPE.md and paired contexts. Preserved prior seed deletion and concurrent 3D edits; both branches already contained fetched main. No commit/push.

Verification: 15/15 focused backend query-budget/arithmetic/scope/transfer-selection tests and 11/11 frontend overview/detail/history/Sales tests pass. UC38–44 passes on an isolated loopback replica-set database. Production build/typecheck passes with the existing large-chunk warning; changed-file ESLint passes. Full lint retains the existing unrelated agent-guard.mjs parse error and Scene.tsx effect warning. Documentation and diff whitespace checks pass. The pnpm test wrapper unexpectedly forwarded a literal -- and started the full suite; it was stopped, and only the intended file was rerun directly through Vitest. No full-suite result is claimed.

Synthetic before/after comparison uses a new disposable wmsd_inventory_perf_test_* database on 127.0.0.1:27018, 51 balances and a 20-row first page, one warm-up plus five samples per case. Median service times: original full list 268 ms / 256 reads / 13,132 bytes; optimized full 182 ms / 9 reads / 12,316 bytes; interactive summary 201 ms / 9 reads / 5,716 bytes. Detail 189 -> 176 ms, 20 -> 5 reads, same 579-byte payload. Options 4 -> 6 ms, 8 -> 7 reads, same 14,464-byte payload: no options latency improvement is claimed on this small local fixture. Full rows, totals, detail, summary fields and option catalogues compare identically to HEAD; the disposable database is removed afterward. These are local warm service measurements, not HTTP/auth/Atlas timings or a guarantee for the reported 10-second request. The benchmark script and aggregate metrics are in workspace outputs/inventory-performance.mjs and .json outside this repository.

Browser verified the existing session's seven-column list and native detail for the reported balance, exact units and lazy history with six posted movement rows. CSS viewports 1440/390 have no body overflow; the desktop table fits (1095px client/scroll). Mobile keeps horizontal scrolling within the existing table wrapper (357px list / 327px detail); the inherited nested table minimum width remains. No stock command was submitted. Sales redaction and unauthorized scope/permission behavior are automated tests, not separate browser logins. Browser connection briefly detached during the accidental full-suite run; a fresh agent tab completed verification, viewport reset and fresh tab closure. Referenced ui-visual-test skill and ui-check/ui-cleanup scripts are absent; both script commands also fail with Bash E_ACCESSDENIED, so direct browser checks substitute. Existing filter layout/contrast/typography deviations were not comprehensively redesigned or certified in this performance task.

Initial local test access required sandbox escalation. Auto-review rejected a broad configured-URI measurement because its database/scope was unspecified; the replacement benchmark was restricted to synthetic loopback data. No configured/remote database comparison or remote database/index write was run.

## 17 November 2026 — Remove Atlas demo seed script

Source: user explicitly selected `src/seeds/atlas-demo.seed.js` for deletion. Removed that script and its dedicated `test/atlas-demo.integration.test.js`, which imported it. Updated `docs/09_phat_trien/SEED_CUA_HANG_GACH.md` to remove obsolete commands and the source link, retaining the dated description of previously loaded demo data. Other seeds and runtime APIs are unchanged. No database connection, deletion, migration or remote data write was performed. Main was already up to date before edits.

Validation: `npm run docs:check` passes (58 collections, 881 local links); the reference scan finds only documentation/history mentions, with no remaining source or test imports. Diff review and whitespace checks pass. The deleted integration test is no longer applicable; no full suite or live database verification was run for this file removal.
## 17/11/2026 · Chọn đơn vị đặt mua trên PO

Theo yêu cầu của người dùng, Kế toán chọn đơn vị và nhập đơn giá cho từng dòng khi tạo hoặc sửa PO nháp. Nếu đơn vị đặt trùng đơn vị nhập trên RR, BE dùng hệ số đã lưu trên RR. Đơn vị khác dùng quy đổi cấp sản phẩm đang hiệu lực. Khi lượng đặt vượt lượng RR đã duyệt, BE chỉ chấp nhận số nguyên đơn vị nhỏ nhất đủ phủ lượng duyệt mà không cần Owner duyệt. Ví dụ RR duyệt 10 viên, hộp có 3 viên thì đặt 4 hộp hợp lệ. Quy tắc áp dụng khi lưu nháp, mở PO và đối soát `RR_ALLOWANCE`. Nháp cũ có nhiều dòng cùng nguồn RR cần gộp về một dòng trước khi mở.

FE dùng danh mục RR qua `mode=FILTER`, gợi ý số đơn vị nguyên cho đơn vị đóng gói và hiển thị giới hạn cạnh số lượng. Lệnh tạo và sửa gửi `uomCode`. Sửa nháp điền sẵn đơn vị đã lưu. Khi review đã bổ sung: lệnh sửa không gửi `uomCode` cho dòng đã lưu thì BE giữ đơn vị của dòng PO, tránh đọc nhầm số lượng theo đơn vị RR. Có test tích hợp cho trường hợp này và test FE cho việc đổi đơn vị trên màn sửa nháp. Cập nhật [hợp đồng API](docs/08_api/NATIVE_MODEL_RUNTIME.md#mua-và-nhập), [phiếu H01/H02](docs/03_thiet_ke/DB_Rebuild_Review/13_Duyet_yeu_cau_bo_sung_va_don_mua.md), PROJECT_GUIDE và context hai repo. Dữ liệu hiện có dùng các trường trên dòng PO. Không cần migration.

`RUN_NATIVE_API_TESTS=1 node --test test/native-api.integration.test.js test/area-conversion.test.js` qua 33 test trên MongoDB loopback. `npx vitest run src/features/purchase-orders` qua 70 test. Chrome trên dev server với DB thử nghiệm riêng đã tạo, sửa nháp và mở PO theo hộp. Đã kiểm tra mở danh sách đơn vị bằng phím Enter, xác thực số lượng, kích thước 1440 và 390 px và ẩn nút tạo cho tài khoản Kho. Lint FE toàn repo còn lỗi hook ngoài phạm vi và cảnh báo 3D. Hai lệnh UI dùng Bash không chạy được trên máy kiểm thử.

## 17 November 2026 — Automatic transfer putaway, completion and compact workflow UI

Source: latest user decision restricts receiving-difference actions to assigned destination staff, automatically creates putaway work after Goods Receipt, moves destination choices to a separate TO page, automatically completes fulfilled requests, and groups documents/tasks/reports behind buttons.

BE: transfer-write.service creates one waiting OPEN ITR/PUTAWAY TO in the receipt transaction for GOOD stock; no target is invented. Task confirmation validates a complete unique receipt-line/destination mapping and posts using existing stock, packaging, capacity, freeze, version and retry guards. Historical receipts without tasks explicitly create/reuse via the existing requirement command; GET/list never writes. New scoped GET /warehouse-transfers/tasks/:id returns projected task/source lines and target labels. transfer-completion checks exact dispatched/effective-received totals, zero transit, no open variance, and completed related ITR/TOs after receiving, putaway or variance resolution. Partial closure still requires a reason and settled deliveries. Difference proposal and replay enforce actual destination assignment while preserving independent review. Parent request writes serialize completion against other workflow commands. No model/schema/index, grant, migration or online backfill changes.

FE: TransferFlowPage uses Đơn phiếu / Nhiệm vụ / Báo cáo dialogs and removes inline destination planning and manual full-close controls. Receipt Xem opens the exact linked /receipts/:id?kind=TRANSFER, including the existing draft inspection form. TransferPutawayPage selects STORAGE locations through mode=locations without reading destination stock; uncertain retries freeze choices and retain the exact payload/key. The historical starter opens/reuses one task even in StrictMode. Existing dispatch creation stays on Tạo phiếu xuất kho and inspection on /receipts. Source accounts cannot open the report form; destination operation and direct-route denial are tested. The shared retry hook callback is stable, with unchanged retry semantics.

Updated BF04_API, GOODS_RECEIPTS, HIEUDT_WAREHOUSE_SCOPE, PROJECT_GUIDE, MODEL_MAP and paired contexts. Before new implementation, preserved existing work in 15 separate FE commits and 3 BE documentation commits under the user's standing instruction, then integrated updated main (FE merge 9d40a43, BE merge 6bd5ce8). Conflicts combined authorized work with incoming direct-sales and purchase-putaway retirement changes. This feature remains uncommitted; no push or online DB write.

Verification: 19/19 FE tests in the parent/task/route files; 14/14 BE completion, validation, projection and read-performance unit checks. The isolated native transfer scenario passes on a new wmsd_api_test_* database on loopback 27018/hieudt-test: automatic task creation/reuse, source denial, invalid targets with rollback, one posting on retry, automatic full completion, damaged/variance resolution and explicit partial closure. Standalone stock fixture posts a purchase receipt and real BF03 move so ledger reconciliation also passes. Final TypeScript check, production build and changed-file lint pass; build retains the existing large-bundle warning. Full lint still has the pre-existing .claude/hooks/agent-guard.mjs parse error and Scene.tsx effect warning, outside this feature. No full-suite claim or online transaction.

Browser verified the current destination staff session on existing records: three workflow buttons, destination reporting form, mobile documents/tasks dialogs, and navigation to the existing confirmed PUTAWAY TO. The separate page shows warehouse, source receiving location, quantity/unit, destination and the lot label (current batch fallback when the historical snapshot is absent). Desktop 1440px and mobile 390px have no body overflow; the mobile TO table scrolls locally (292px client / 494px contents) and dialogs fit at about 374px. No receipt, TO, report or legacy-create command was submitted online. The OPEN-task selection/confirmation/retry and source/Owner-not-assigned denial are covered by synthetic/isolated tests, not a separate live-account browser login. Browser tab closed and viewport reset. Referenced ui:check/ui:cleanup scripts and linked visual-test skill remain absent; direct browser checks substitute. docs:check and diff whitespace checks pass.

## 17 November 2026 — Separate transfer dispatch creation from request details

Source: user explicitly requested that transfer requests contain their dispatches, while dispatches are created in Tạo phiếu xuất kho. Removed the inline dispatch form/mutation/selection state and source-stock query from TransferFlowPage. Approved source staff navigate to /goods-issues/create?reason=TRANSFER&transferId=<encoded-id>; the shared form preselects the request, uses the existing native command and returns to the parent, where linked dispatches/receipts remain listed. Existing picking, handover, receipt and putaway actions remain unchanged. Child quantities show base units.

GoodsIssueCreatePage/NativeIssueForm support initial request selection and lock reason/source/quantities through pending/uncertain transfer creation. Exact retry payload/key and version are retained; unapproved sources and unauthorized URL parameters do not enable dispatch creation. The create route accepts the existing stock_transfer:dispatch grant for TRANSFER only so moving the form does not remove existing dispatch authority; other reasons retain their prior grants. No grants, roles, endpoint/schema/model/stock effects changed. The transfer branch skips the unrelated Goods Issue catalogue, and source stock loads only in the separate create form. Updated FE context, BF04_API.md and GOODS_ISSUES.md; current work and prior uncommitted review/edit changes preserved. Main checked up to date before edits. No commit/push or DB write.

Verification: Goods Issue/transfer/route regression 45/45 in 8 files; after the final catalogue-skip assertion, focused transfer-creation/parent/route tests 17/17 in 3 files. Final build/typecheck, changed-file lint, docs:check and diff whitespace checks pass. Tests cover parent navigation/child preservation/no inline stock read, common-form carton dispatch payload/version and return navigation, uncertain retry lock, transfer-only route access, and denial without grants or for unapproved requests.

Browser checked the existing Warehouse session: approved YCĐC-KG1-261113-000001 has one navigation button and zero inline creation headings; clicking opens /goods-issues/create with reason/source preselected and carton/base-unit fields. CSS viewports 1440/390 have no body overflow; the mobile table scrolls locally (292px client / 798px content). No dispatch was submitted or online data written. Creation success/return navigation and transfer-only/unauthorized access are synthetic tests, not an online transaction or separate-role browser login. Agent tab closed and viewport reset. Existing large-bundle warning remains. The referenced ui:check/ui:cleanup scripts and linked visual-test skill are absent; direct browser verification substitutes for the unavailable script. Full lint retains the unrelated existing hook parse error/3D effect warning from the previous change; this task's edited-file lint is clean.

## 17 November 2026 — BF04 review quantity units and editable request rows

Source: user requested quantity units on waiting-approval details, editable quantity/unit in existing request lines, and creation date below destination alongside transfer reason. FE presentation now retains the existing baseUnitSnapshot as baseUnit; entered request quantities display entered units and all operational quantities display historical base units, without an additional API call. Legacy missing units have an explicit generic base-unit label. General facts use a responsive two-column grid with source/destination above reason/date.

TransferCreatePage exposes quantity inputs and configured-unit selects in each line. A shared feature-local unitChoices helper applies batch precedence and preserves unavailable historical units as visibly unavailable rather than silently defaulting. Validation preserves edits and flags zero/negative/invalid/over-six-decimal quantities and unavailable units before saving. Payloads retain original version, warehouse IDs, product/lot identities, retry keys and the existing PUT command. Creator/update permission and pending/revision states remain mandatory; approved/noncreator access stays blocked. Server write checks, stock rules and schemas unchanged. Updated FE context and canonical BF04_API.md; no database write/rollout.

Per explicit user authorization, committed each previous pending file separately (FE 12 commits through 112efb9, BE 11 through 946358d), then merged origin/main into HieuDT: FE aa0c36a and BE c42227c. Resolved only context/changelog conflicts by preserving both current projection/stock-preview notes and incoming customer snapshot documentation. Current review/edit changes are uncommitted; no push or merge back to main.

Verification: final FE transfer tests 20/20 in 5 files; prior broader movement/transfer/Excel regression 43/43 in 12 files. Tests distinguish 2 Thùng requested from 8 Viên approved, retain snapshots, verify update payload/version, reject zero quantities and approved edits, hide editing without permission, and check lot conversion precedence and fact order. Final build/typecheck and changed-file ESLint pass; BE post-merge default regression 251 passed/0 failed/125 skipped/1 existing account-audit TODO. Browser used the existing Warehouse session to read YCĐC-KG1-261117-000001: request rows show 2 Thùng and operational 0 Viên; at 1440px date and reason share y=511.8, date/destination share x=865. Existing-row quantity and unit were changed locally to 3/Viên with keyboard selection; no save/approval/post was submitted. Mobile preview uses a 390px viewport with no page overflow, table scroll stays local. Unauthorized behavior is unit-tested, not a separate live login. Existing large-bundle warning remains; full lint and UI-script limitations are recorded below.

Final tooling: docs:check and diff whitespace checks pass. Full FE lint still reports the existing .claude/hooks/agent-guard.mjs parse error and existing warehouse-3d Scene effect warning; edited-file lint is clean. ui:check/ui:cleanup cannot run because their referenced scripts and the linked visual-test skill are absent in this checkout; browser checks were performed directly, the agent-created tab closed and viewport reset. Browser inspection did not save any changed quantity/unit to the online database. No full-browser permission-denial/login test or live update submission is claimed.

## 17 November 2026 — BF04 request creation stock preview

Source: user requested Viên/Thùng/Pallet stock at request step 2. FE TransferCreatePage now shows on-hand and available STORE/GOOD stock in STORAGE for the chosen product and optional lot, using existing stock options without extra API calls. stockSummary sums exact rational quantities using batch-specific conversions ahead of product factors; carton fallback uses piecesPerCarton for piece-base products only. Missing conversions show “Chưa cấu hình”, negative availability shows zero, approximate values are marked ≈. Equivalent cartons/pallets do not imply sealed packaging or physical pallet counts. Previous-warehouse data is hidden while a new source loads. The three-column preview fits 390px; step titles wrap. No BE runtime/model/schema/data/permission change.

Preserved previous uncommitted projection work. Integrated FE main dd38f8d into HieuDT (merge 6380db3), combining the new document Excel buttons with existing relocation actions and destination receipt inspection. Two isolated detail test harnesses stub the incoming Redux-backed Excel control. No push or commit of the current feature/projection edits. Updated paired FE context and BF04_API.md.

Verification: final FE build/typecheck and changed-file ESLint pass; final regression 38 tests in 11 files pass, including five exact-stock/conversion scenarios, preview/lot/loading/permission behavior and existing relocation/transfer/Excel checks. Initial broad run exposed Redux context requirements introduced by incoming Excel buttons; fixed the two isolated test harnesses and reran successfully. Browser read-only checks with the existing Warehouse session show AP6602 stock 192 Viên/48 Thùng and explicitly unconfigured Pallet, update the lot label, and verify CSS viewports 1440/390 with no page overflow; at 390 the stock table client/scroll widths are both 258px. No form was submitted and no stock/document created. Unauthorized role behavior is unit-tested, not a separate live login. Docs validation and diff whitespace checks pass. Full lint remains blocked by an existing .claude/hooks/agent-guard.mjs parse error and has an existing warehouse-3d Scene effect warning. ui:check/ui:cleanup reference absent scripts in this checkout (the attempted bash launch also reports access denied); the agent-created browser tab was closed manually and viewport reset. Production build retains the existing large-chunk warning.

## 17 November 2026 — BF03/BF04 fields selected at database reads

Source: user requested fetching only fields used, following the online transfer/relocation latency report. Safely merged incoming FE main (4c685a2) into HieuDT before implementation; BE main already integrated. No new commit/push or remote database/index changes for this request.

Before: lists expanded complete item arrays and selection/detail reads retrieved unused catalogue, ledger, workflow and snapshot metadata. After: explicit inclusion projections in movement-read-fields.js and both read services; summary view for FE tables and receipt-source picker; default full retains Excel line fields. Related requirements/tasks/differences/approvals use compact projections. BF03 uses lean projected detail/ledger and ID/full-name performer reads. Shared effectiveQuantities skips empty input and reads only transaction/reversal IDs and source-line quantities. Version, packaging, scope, decimal calculations, command retries and transactional write reads remain intact. Model schemas/data and persisted audit evidence unchanged.

Affected: shared movement-list/read-fields, location-movement service, transfer-read service, sales-read effectiveQuantities, FE BF03/BF04 live API/presentation and projection tests. Updated canonical TRANSFER_PERFORMANCE.md, BF03 README, BF04_API.md and paired contexts. FE/BE must deploy together for view=summary validation and lightweight DTOs.

Verification: BE default suite 249 passed/0 failed/125 skipped/1 existing account-audit TODO; after adding the final BF04 projection scenario, focused projection/performance run 9/9 passed. Tests apply inclusion projections to synthetic records and verify selection units/versions/packaging, detail edits, effective quantities, discrepancy caps, receipt limits and warehouse scope. FE typecheck/build, changed-file ESLint and 38 tests across 11 files passed (including Excel and receipts). Build retains an existing large-chunk warning. Online p50/p95 and Mongo execution plans were not measured; local transaction integration and live browser flow are not claimed.

## 17 November 2026 — HieuDT integration and transfer read performance

User requested committing each pending file on HieuDT before merging main: FE 48 file commits + merge a3dc8b3, BE 35 file commits + merge 73de6ab. Combined conflicting context/changelogs, preserved BF03 partial trips/editor and main exports, retained main warehouse guards after resolving optional edit warehouse IDs. Restored the incoming pallet test to the approved nonblocking height-warning contract. No push, main rewrite or remote DB/index write.

Performance: replace per-balance BF04 availability queries with max four batch reads; preserve exact scalar semantics for reservations, partial tasks and holds. Parallelize independent authorized detail/search reads, compact catalogue projections to omit 3D designs, linear conversion deduplication and BF03 FE lookup/ledger maps. Add mode=locations options; FE skips source stock for non-actionable requests and avoids loading destination stock. Write commands and transactional guards unchanged. Files: stock-availability-read.js, transfer-read service/routes/validation, location-movement service, FE transfer hooks/flow and relocation presentation; focused tests and current contracts updated. See docs/08_api/TRANSFER_PERFORMANCE.md.

Verification: FE typecheck/build and 77 focused regression tests passed before final skip assertions, changed-file ESLint passed; final hook/presentation assertions: 10/10 passed. BE final default regression 246 passed/0 failed/125 skipped/1 existing account-audit TODO, including all five performance tests and scoped receipt-source loading without sibling document expansion. Initial HTTP tests were blocked by sandbox localhost EACCES and passed after rerun with local-network access. Local transaction replica 27018 unavailable; online latency/explain/indexes not measured. No claim of remote rollout or full browser E2E.

## 17/11/2026 - Kiểm thử giữ hộ và nhật ký khoá tài khoản

- Ba test giữ hộ trong `test/return-workflows.integration.test.js` dùng nguồn giao hàng lịch sử có `customerId` của chủ hàng. Test xác minh nguồn mới dùng `customerName` và kiểm tra phiếu trả có chế độ `DIRECT`.
- `src/modules/users/user.service.js` ghi `LOCK_USER` khi thay đổi lý do của tài khoản đang khoá. Trước đây lệnh chỉ ghi nhật ký khi trạng thái đổi. [Hợp đồng trạng thái tài khoản](docs/08_api/USER_ACCESS_STATUS.md)
- Ba tệp test về trả hàng, bán trực tiếp và trạng thái tài khoản đạt 36/36. Test tích hợp dùng MongoDB replica set local với cơ sở dữ liệu riêng. Test audit dùng model giả lập.

## 17/11/2026 - Báo lỗi trùng mã nhà cung cấp

- Nguồn: người dùng yêu cầu sửa lỗi trùng key MongoDB khi tạo NCC. `createSupplier` chuyển lỗi `11000` của key `code` thành HTTP `409`, mã `ERR-CORE-409-002`, thông báo tiếng Việt và `fieldErrors` tại `body.code`. Trước đó API trả `500` kèm thông báo MongoDB.
- Sửa `src/modules/suppliers/supplier.service.js`, thêm `test/supplier-create.test.js` và cập nhật [hợp đồng NCC](docs/08_api/ITERATION1_NATIVE_2026-11-06.md#api-và-quyền). FE đã xử lý mã lỗi này dưới ô mã NCC, không cần sửa consumer. Lỗi DB khác giữ nguyên; unique index và transaction/audit không đổi.
- Không đổi schema, dữ liệu, quyền hay cấu hình DB; không cần migration. Backend đã fast-forward `origin/main` trước khi sửa và giữ các thay đổi đang dở.
- Kiểm tra: `node --test test/supplier-create.test.js` đạt 4/4, gồm response qua controller/middleware, metadata keyValue, lỗi khác và tạo thành công có audit. FE `npm test -- src/features/suppliers/step/SupplierCreatePage.test.tsx` đạt 6/6.
- Giới hạn: test backend dùng model/session giả lập; chưa thử race hoặc unique index trên MongoDB thật, chưa chạy trình duyệt hay toàn bộ suite. Không commit/push.

## Customer details on documents — 17 November 2026

User decision: customers are not managed as catalogue records. New sales orders require `customerName` (1–160 characters) and allow `customerPhone` (up to 30 characters); the delivery address remains on the order. Creating an order does not query or create a Customer. Sales options return an empty compatibility `customers` array.

Customer-return creation sends warehouse and source lines only, without `customerId` or a customer selector. The server resolves name/phone from the source sales order or verified historical delivery and saves a snapshot on the return. Each new request is limited to one source document, while allowing multiple lines and split parts from that document. Warehouse access, source ownership/permissions, confirmed received quantity, claims, evidence, versions and idempotency remain enforced. Direct goods issues retain the sales-order link and no longer require a customer catalogue ID.

Historical verification requires customer name text and optional phone from the external document; verification/evidence remains mandatory. New historical sources with customer snapshots use the current inspection/acceptance/receipt flow without custody. Previously stored sources and custody ledgers retain their legacy behavior. Optional legacy customerId fields and the Customer collection remain readable; no records or collections are deleted or backfilled. Deploy FE and BE together; old clients sending customerId to new creation endpoints must update.

Validation: focused sales/return contract tests and the local direct-sales transaction test passed using an isolated database on the local rs0 replica set (port 27017). The transaction fixture creates a new sale and return with no Customer record, and separately verifies legacy custody compatibility. No Atlas write or migration was performed.
## 17 November 2026 — UC-113 inventory report batch reads

- Replaced per-balance defect/task/movement/reservation reads with snapshot-scoped batch reads and indexed in-memory lookup. Exact decimal quantities, hold resolution, warehouse authorization and response fields are preserved. See [OPERATIONAL_REPORTS.md](docs/08_api/OPERATIONAL_REPORTS.md). No database/index writes.
- Existing operational-report tests pass (23/23). A temporary read-only mocked comparison against HEAD produced identical rows for 1 and 100 balances with partial movements, reservations and released holds; model reads changed from 15/510 to 12/12. This is fixture evidence, not database query telemetry.
- Rebuilt local Compose API/web images. Three observed inventory responses returned HTTP 200 in 706–847 ms, versus the earlier observed approximately 74-second response; this is local timing, not a production benchmark. Frontend report tests pass (16/16), alongside lint, typecheck and UI rules. Shared-theme UI and current-filter export guards were updated in the frontend repository.

## 17 November 2026 — Avoid local API host-port conflict

- Source: user reported repeated `port is already allocated` startup failures; effective Compose still published host port 3000, occupied by another project's container.
- Changed workspace `docker-compose.yml` to publish `3300:3000`. API `PORT=3000`, frontend proxy `http://api:3000`, frontend port 3334 and mount-free packaging remain unchanged. Updated [DOCKER.md](docs/09_phat_trien/DOCKER.md) with the host/internal distinction and port-only recreation command.
- Host port 3300 was free when checked. Final effective-configuration and documentation checks are recorded in the task handoff; this edit does not start the app, stop unrelated containers or access a database. No application runtime/connectivity claim.

## 17 November 2026 — Mount-free local Compose images

- Source: user requested removing backend/frontend volumes so code changes require rebuilding containers.
- The workspace `docker-compose.yml` removes both source bind mounts, both `node_modules` mounts, unused named-volume declarations and polling flags. Backend `Dockerfile` dev target now copies source into the image; frontend `Dockerfile.dev` already copies it. Ports, API proxy, runtime commands, URI handling and default disabled seeding are unchanged. Compose explicitly provides `VITE_API_URL=/api`, replacing the frontend's previous dependency on a mounted host `.env`.
- Current setup instructions are updated in [DOCKER.md](docs/09_phat_trien/DOCKER.md): use `docker compose up -d --build api web` after changes. Restart alone is insufficient. Existing containers/old volume objects are not deleted or restarted by this edit.
- Validation: merged Compose mount/target/port/API-environment assertions, Dockerfile checks (no warnings), both image builds, isolated read-only/network-disabled source/dependency/entrypoint and env-exclusion filesystem checks, `npm run docs:check` and `git diff --check` pass. Independent review is a separate handoff gate. Application/DB/network runtime behavior is not proven: no application startup, seed, schema/index change, database write, old-volume deletion or existing-container recreation was performed.

## 17/11/2026 - Chuyển hàng nhập mua bằng BF03

Theo plan `ancient-launching-zebra.md`, phiếu nhập mua hoàn tất ở `POSTED` và PO ghi nhận lượng đã nhập cùng mốc. Gỡ hàng đợi Chờ cất và API lệnh cất mua. Chi tiết phiếu trả `receivingBalanceId` và `capabilities.relocate`. FE dùng quyền Chuyển vị trí và mở form BF03 tại vị trí tiếp nhận đầu tiên. ITR tiếp tục xử lý xếp hàng của điều chuyển liên kho.

Backend cập nhật `po-receiving`, permission seed và lệnh mẫu dùng `RELOCATE`. Trên `wmsd_demo_tile_shop_v9`, lượt áp dụng tắt bốn quyền cũ. Lượt xem trước và lượt áp dụng đều trả danh sách lệnh rỗng. [Hợp đồng GoodsReceipt](docs/08_api/GOODS_RECEIPTS.md) · [Hướng dẫn migration local](docs/09_phat_trien/MONGODB_LOCAL.md#ngừng-lệnh-cất-hàng-mua).

Native integration đạt 26 ca. Trên Chromium 1440 px và 390 px, form điền đúng nguồn và dòng hàng cho phiếu `PNM-TEST-261117-000001`. Kế toán bị chặn tạo lệnh. Xác nhận `LCV-TEST-261117-000001` đưa 8 viên vào nguồn xuất bán và preflight chặn Bỏ ghi. Đối soát đạt trên DB thử riêng. DB demo còn báo `RR_ALLOWANCE` ở một PO mẫu.

BE test mặc định có 237 ca đạt, 123 ca skip và một ca TODO. FE có 49 ca liên quan đạt cùng build, typecheck và lint trong `src`. Suite FE toàn bộ còn 10 ca lỗi ở các luồng khác, trong đó 5 ca tái hiện trên HEAD sạch. Lint toàn repo báo lỗi cú pháp trong hook `.claude/hooks/agent-guard.mjs`. Checkout FE thiếu hai script `ui:check` và `ui:cleanup`.

## 17/11/2026 - Bỏ danh mục khách hàng và delivery riêng khỏi phạm vi

- Nguồn: người dùng yêu cầu cập nhật cả Report 3/Report 4 và xác nhận chỉ bỏ danh mục khách hàng, giữ đơn bán cùng khách trả.
- Report 3 sửa phạm vi, context, BF-06/BF-07, ERD nhúng, thực thể, catalogue/chi tiết UC, ma trận quyền, màn hình và quy tắc. Giữ 132 mã: 113 ACTIVE, 19 RETIRED; giữ 31 mã màn: 23 ACTIVE, 8 RETIRED. UC-129 chuyển thành bằng chứng khách nhận trên phiếu xuất, không còn màn delivery riêng.
- Report 4 sửa luồng SO -> phiếu xuất trực tiếp, khách trả, quan hệ nhúng và trạng thái thiết kế. Danh mục khách/WIR/OD/FD riêng được đánh dấu ngoài phạm vi; schema cũ được phân biệt là tương thích runtime, không giả đã xóa collection.
- Đồng bộ PROJECT_GUIDE, context BE và README tài liệu. Giữ lịch sử/Change Log cũ của báo cáo và mã UC/SC để truy vết.
- Không sửa source, test, quyền DB, dữ liệu hay tham chiếu lịch sử; không commit/push. API/model vẫn cần thay phần bắt buộc customer master trước khi triển khai phạm vi mới. Bản Word/Google Docs bên ngoài chưa đồng bộ.
- Checks passed: npm run docs:check (3 identical instruction files, 58 collections, 869 local links); 132 unique UC IDs, 113 active/19 retired, 23 active/8 retired screens, no grants on retired UCs and no active screen linked to a retired UC. Active normal flows and historical Report 3 Change Log are retained. Mermaid fences/declarations checked; diagrams were not rendered.

## 17 November 2026 — Upstream integration and conflict-resolution checkpoint

- Source: user requested pulling both repositories, approved continuing the existing backend rebase and merging frontend `origin/main` while preserving local work, and explicitly requested deleting conflicting test files only. No push was requested.
- Backend `main` rebased onto `d146637` and finished at `5aef656`. Conflicted documentation retains the Goods Issue and stocktake entries. A follow-up heading separates stocktake reconciliation metadata from the UOM section in `src/models/CHANGELOG.md`.
- Frontend `minhbach03` merged incoming `457ac9d` into the index; the merge commit is still pending. All 98 original dirty/deleted/untracked paths were accounted for: 79 retain identical bytes and 19 overlapping paths were three-way integrated. Preserve the local working-tree changes separately from the staged merge.
- Deleted only the conflicting `test/customer-returns.contract.test.js` and frontend `src/features/products/warehouseAccess.test.tsx`, as requested. This reduces coverage; deletion is not evidence that the formerly tested behavior passes.
- Checks: frontend typecheck, zero-warning lint, UI rules, production build and four focused test files (19 tests) pass. The separately exported staged merge tree also passes typecheck and production build without unstaged or untracked application source. Completed grouped runs pass for products (21), UOM (2), purchase orders (68), app (40), Goods Issue (11) and sales execution (4). Backend default tests exit 0 with 235 passed, 122 skipped and one pre-existing audit TODO; skipped transaction tests and the TODO are not passes. Documentation validation passes.
- Remaining gates: the broad frontend selection timed out. Three failures reproduce identically on incoming `457ac9d` using the same installed dependencies; the replenishment group also times out and reports two exact-button-name failures that reproduce on incoming `457ac9d` (2 failed, 11 intentionally unselected/skipped in the bounded diagnostic). No additional tests were changed or deleted. Mock-only browser checks cover UOM reset/status refusal, product-edit refusal and read-only access at 1440/390; purchase-order/source-switch/delayed-response visual coverage remains incomplete. No authenticated live workflow or remote database write was performed.
- Independent review found no high/critical conflict-induced issue and one model-changelog heading defect, corrected in the working tree. Final recheck and required verification gates remain open; this entry is not feature acceptance, archive or publication approval.

## 16 November 2026 — FE-08 authorized regression-contract corrections

- Source: user explicitly authorized resolving the two reported baseline failures and reusing the one retained reviewer after implementation. Updated only the existing LotTrace query expectation (`lotId`) and permissions for the single Warehouse lot-create fixture (`product_lot:read`, `product_lot:create`). Production runtime, permission gates and all other assertions are unchanged. Existing dirty work is preserved.
- Final affected-feature Vitest rerun now passes 49 files / 354 tests with exit 0 and no unhandled error; bounded rerun passes 14/14. Full lint with zero warnings, typecheck, UI rules, production frontend bundle, backend list units 5/5 and isolated local Mongo list integration 3/3 also exit 0. No full-repository test claim; no new browser behavior, seed, shared/remote write or backend runtime change.
- The same retained read-only code-reviewer completed the final recheck (revival a62d5dac-3706-4b48-9512-3f6ef05d20dd): no qualifying findings, code OK with notes, FE-08 acceptance ACCEPT. Task 3.1 is complete and the change is 7/7 after final docs/strict/diff closing checks all exit 0. Portable outcomes, review reference and verification limits are in workspace openspec/changes/add-fe08-stocktake-list-filters/evidence.md and tasks.md. Earlier blocker entries below are historical and superseded. No commit, push or archive.

## 16 November 2026 — FE-08 Docker, full lint and local Mongo verification (earlier, superseded)

- Source: user-authorized Docker build and frontend lint cleanup, including typing fixes in existing tests. Frontend safely fast-forwarded to local integrated main with all pre-existing dirty/untracked bytes preserved. No backend runtime, API, schema, permission, dependency, environment-file or assertion change. Removed one unused duplicate frontend receiving mapper; retained active DTO mappers.
- Full frontend lint now exits 0 with zero warnings. Typecheck, UI rules, production bundle, FE08 tests 155/155, backend list units 5/5, docs and strict OpenSpec checks pass. Existing opt-in stocktake-list integration passes 3/3 against an isolated loopback Mongo replica set with nofile=64000. Its disposable database is dropped by test cleanup; no shared/remote database is used.
- Root Compose development image builds pass before and after cleanup. API health smoke returns 200 against an explicit local-only database; seed and password sync are disabled. Browser checks use fail-closed local fixtures, not authenticated real-API UI writes. Desktop/mobile reset/reopen, delayed-response safety, source switching and WebGL failure/recovery are recorded in the workspace change evidence.
- The broader frontend regression run remains exit 1: 352 passed / 2 ordinary failures. The LotTrace query-key expectation and warehouse-access permission fixture both fail on the pre-cleanup baseline; the latter session lacks the permission required to expose its expected create button. No assertions are weakened or changed. A bounded lifecycle rerun passes 36/36 and the final broader run does not repeat the initial teardown error; no root-cause fix for that intermittent error is claimed.
- Reused the one retained same-model independent reviewer: code verdict OK with notes, no qualifying findings; final evidence recheck completed with FE-08 acceptance BLOCK on the two unresolved ordinary regression failures. Task 3.1 stays open pending the baseline-test disposition. No commit, push or archive; details and cleanup status are in workspace openspec/changes/add-fe08-stocktake-list-filters/evidence.md.

## 16 November 2026 — FE-08 stocktake list verification checkpoint (earlier)

- Source: user request to continue OpenSpec change `add-fe08-stocktake-list-filters`. No runtime/API/schema/index, automated-test, dependency, environment or Git/index change in this checkpoint. Existing dirty frontend work is preserved.
- Current checks: frontend related stocktake/app tests 155/155, typecheck, UI rules, build and scoped stocktake lint exit 0; backend stocktake-list unit tests 5/5 and default test suite exit 0 (225 passed, 111 skipped, one account-audit TODO). Required full frontend lint still exits 1 (47 errors, 13 warnings). All 22 files named by lint are outside stocktakes and byte-identical to current frontend HEAD; this is not a clean-baseline config/dependency verification.
- The historical UI-rule blocker is absent in the current worktree, but it does not waive the full lint gate. Task 3.1 remains open. Docker socket is unavailable and no Colima instance is configured, so live Mongo proof was not rerun; no VM, seed or remote write was attempted. Existing visual evidence remains mocked and historical; no new UI behavior or browser proof is claimed.
- The workspace's `openspec/changes/add-fe08-stocktake-list-filters/evidence.md` records commands, outcomes, limits and remaining scope, with final documentation/OpenSpec validation and the single retained independent review. No automatic commit, push or archive.

## 16 November 2026 — Integrate committed minhbach03 work into local main

- Source: explicit user request to merge `minhbach03` into `main` in both repositories, preserve local work and return to the working branch; no push requested. Inputs are pinned: frontend upstream `0d18a0c` plus source `be9eb83`; backend upstream `31529bb` plus source `420a9ca`.
- Prepared in isolated linked worktrees. Original checkouts remain on `minhbach03` with their tracked/untracked contents and index preserved; uncommitted frontend work and the local FE-08 checkpoint changelog are not part of the merge. Backend documentation conflicts preserve both the quantity-workflow guidance and BF-05 contract pointer, and retain all independent changelog entries.
- Candidate checks: frontend typecheck/build and scoped stocktake lint pass; related frontend tests 70/70; backend docs pass; both staged gitleaks scans pass. Full frontend lint still fails with 47 errors and 13 warnings. The tracked frontend package references an absent UI-check script; running the original checkout's script against the candidate also fails on the existing replenishment `antd` type import. Backend default tests report 228 passed, 1 failed, 113 skipped and 1 TODO. The failing customer-return contract test also fails on an untouched upstream `31529bb` archive; no test or production rule was changed to hide it.
- These are Git integration checks, not acceptance or archive of BF-05/FE-08. No dependency update, schema/index change, database write or remote publication. Independent review and final commit identifiers are reported by the delivery session.

## 17 November 2026 — preserve historical opening-stock documents

Backend CI exposed existing fixtures and historical seed data with multiple POSTED opening documents for a warehouse. A unique index across every POSTED opening document prevented those databases from starting. The one-time rule now applies to POSTED file imports identified by `header.openingImportSource=FILE`; the service still blocks importing into any warehouse already initialized. The local setup replaces only the known earlier index after checking for duplicate file imports. No store data was changed.

## 18 November 2026 — customer returns from Goods Issue

Per the user's decision, a Customer Return can use a posted SALE Goods Issue without a Sales Order, so the return demo does not require the separate Sales Order flow. If the issue has no customer snapshot, the requester supplies `customerName`. SO-linked issues keep their confirmed-received cap; standalone issues use effective posted issue quantity less posted undelivered receipts, outstanding failed-delivery claims and CR claims. The existing inspection → Sales decision → Warehouse receipt flow is unchanged; no schema or migration was added. Confirmed supplier custody as the alternate return path: non-GOOD purchase items must use CUSTODY; unused GOOD items may also be explicitly kept supplier-owned in CUSTODY. Accountant agreement → Warehouse CustodyRelease dispatch → Accountant ACK/close already works; already STORE-owned stock uses the regular Supplier Return flow.

Validation at the time: FE return workflow tests 23/23, TypeScript check, changed-file ESLint, backend standalone/source lookup unit checks and `npm run docs:check` passed. The transaction integration test was skipped because its required local replica set was unavailable. No Atlas write.

## 17 November 2026 — direct sales and no-custody customer returns

User explicitly restored Sales Order and requested removal of picking/delivery/custody complexity. Added direct order-backed issue creation/posting, Sales-only evidenced customer receipt and inline undelivered goods receipt. New CR inspections have no inventory effect; accepted receipt posts STORE stock; rejected handback is an embedded event. Return intake mode is derived from its source: direct issues use GOODS_ISSUE and skip customer custody, while historical and legacy delivery sources retain their custody flow; mixed-source requests are rejected. Preserved legacy flows and history through optional mode markers. Added embedded customer receipt/handback schemas, issue stock/order/customer references and FAILED_DELIVERY receipt direct issue reference. No collection, backfill, stored identity change, commit/push or remote write. Updated current API, model map, dictionary, relationship view, contexts and local setup. CI now runs the direct-sales, opening-stock and return-lookup integration suites against its replica set. Tests: isolated direct/legacy integration and standard backend suites; focused frontend tests and production build. Broader frontend verification limitations are tracked in setup/hand-off rather than claimed as passing.

## 17/11/2026 — Kho 3D: bố trí pallet trên 2D và 3D

Theo yêu cầu tiếp tục và lựa chọn trước thao tác hai chế độ: chọn/tìm pallet, kéo trong ô theo bước 0,05 m, nhập tọa độ, undo chung, Esc hủy, Ctrl/chuột phải điều khiển camera, ẩn/hiện tường. Giữ camera khi đổi vị trí; không ghi history/dirty khi chỉ chọn. Kéo pallet không kéo nhầm ô; ngoài ô bị từ chối. Không đổi schema/API/quyền/tồn, không migration hoặc ghi DB. Các phần chồng/xoay độc lập/qua ô và liên kết tồn còn tiếp theo.

File: FE warehouse-3d (pallet-placement, PalletPlacement, scene-pallet-interaction, PlanCanvas, Scene, Warehouse3DPage và tests). Docs: STAGE4_PALLET_PLACEMENT, README/STAGE3 và context FE. Kiểm FE 34 test Kho 3D đạt (7 file): geometry, pointer 2D, raycast Three thật, hủy/readonly/camera gestures, từ chối ngoài ô và undo; build/typecheck và docs:check đạt. ESLint module 0 error/1 warning cũ Scene; lint toàn dự án vẫn 45 errors/13 warnings ngoài phạm vi. Browser Owner tạo bản thử trong phiên: kéo 3D thành (1,2; 1,15), đổi 2D giữ tọa độ, kéo 2D thành (1,7; 1,65); nhập X=9 bị từ chối; undo thử trả X=0. Desktop 1440 và mobile 390 đã xem, mobile scrollWidth=390. Đã reset viewport/đóng tab, không lưu/apply lên server. Quyền readonly được kiểm bằng component/pointer tests; chưa lặp lại đăng nhập tài khoản readonly trong browser ở chặng này. ui-visual-test và scripts ui:check/ui:cleanup vẫn không có trong checkout, Bash bị E_ACCESSDENIED ở lượt trước; kiểm browser trực tiếp thay thế. Chưa kiểm DB round-trip, tương phản tự động hoặc hiệu năng tải lớn.

## 17/11/2026 — Kho 3D: lớp hàng và đo chiều cao pallet

Theo yêu cầu tiếp tục Kho 3D và lựa chọn trước của người dùng: thêm lớp nhiều mã/lô/số thùng trong layout nháp/applied; nhãn thiết kế không phải tồn. measuredCargoHeight cộng cao đế, giữ actualHeight cũ; sửa lớp bỏ số đo cũ. Tách cảnh báo vượt cao khỏi lỗi chặn lưu/áp dụng, trả data.warnings. Sửa edit pallet cũ bị khóa giá trị, cộng tọa độ ô và xoay pallet đúng khu ở 2D/3D. Giữ permission/scope/updatedAt/audit, không migration/DB rollout.

Code: FE warehouse-3d; BE warehouse-stock/layout.js và layout-geometry.js; tests warehouse-layout, PalletsEditor, pallets. Tài liệu: STAGE3_PALLET_LAYERS, STAGE2_ZONES, MODEL_MAP, Data Dictionary, PROJECT_GUIDE, context FE/BE, model changelog. Kiểm FE 21 test đạt, BE 6 test đạt, typecheck/build và docs:check đạt; eslint module 0 error/1 warning cũ Scene setState trong effect. Lint toàn FE còn 45 errors/13 warnings ngoài thay đổi này; ui:check/ui:cleanup không chạy do Bash/E_ACCESSDENIED, script shell cũng không có trong checkout. Browser: Warehouse thiếu quyền sửa thấy read-only; Owner tạo khu/ô/pallet/lớp trong phiên, cảnh báo 7,150 m vượt 6 m rồi nhập số đo 0,8 m cho tổng 0,95 m; 3D render được pallet đỏ. Viewport 1440/390 không tràn ngang; đã đóng tab/reset viewport, không lưu bản nháp/apply lên server. Chưa xác nhận transaction DB hoặc kiểm tương phản tự động. Skill ui-visual-test được DESIGN.md tham chiếu không có trong checkout; đã tìm và kiểm browser trực tiếp thay thế. Chặng sau còn chồng pallet và liên kết tồn.

## 17 November 2026 — BF03 confirms relocation across multiple trips

- User approves multiple actual confirmations on the same relocation: OPEN→PARTIAL→CONFIRMED. Selected lines/quantities are capped by committed remaining amounts; every trip records stock/performer/time atomically and preserves warehouse totals. Cancellation drops only the untransferred remainder, retains history and never reverses posted stock; editing remains OPEN-only. Existing carton/loose-portion restrictions remain.
- BE location-movements service/validation and warehouse overview include PARTIAL, exact ledger totals, own-write balance version refresh, creator/scope/locks/capacity/reservation/version/replay checks, and performer display. No schema, migration, new collection or remote data write. FE detail has blank actual quantities per trip, confirmation/retry, cancellation consequences, per-trip quantity/performer history, exact remaining display and PARTIAL filter. Existing shared design preserved.
- Canonical contract: [BF03](docs/08_api/location-movements/README.md); contexts, PROJECT_GUIDE and warehouse scope updated. Verification: default BE152pass/0fail/108integration skips; isolated relocation_partial_test_<ObjectId> transaction suite1/1pass with0skips, including selective same-source lines, replay/concurrency, freeze/capacity rollback, actor/warehouse scope and cancellation without reversal. FE19/19tests, typecheck/build and changed-file ESLint pass; docs:check passes. Browser1440/390verified16+24completion and4of8then remainder cancellation; ledger3trips, source4/destination44, warehouse total48. Fresh finish reviewer returned ship for this extension, all10provided captures valid; existing DESIGN.md preserved. ui-visual-test is absent and detector engine unavailable; no claim of exhaustive contrast/permission-browser coverage. Synthetic DB, API3002/FE3336, browser tab and fixture script were removed; local preview3001/3334 retained. No schema migration/shared DB write/commit/push for this follow-up.

## 17 November 2026 — Goods Issue reasons, manual references, Sales approval and fractional cartons

- User confirmations: one creation form for SALE/TRANSFER/SUPPLIER_RETURN/SCRAP/OTHER; external MISA order code is recorded manually, no mandatory local SO. SALES creates SALE only in PENDING_APPROVAL; a different Owner approves the same ID to DRAFT without stock effects. OTHER uses manual reference/reason and PXK codes. UC72 covers edits and supported state commands.
- BE adds manual GI creation/approval/scoped stock allocation to the native goods-issues module, optional manual reference/approval fields and legacy compatibility. FE common form embeds native transfer/return/scrap commands with their source caps and evidence. Lists GI_SALE/GI_OTHER; native records retain their existing lists. Shared outbound splitting permits fractional cartons, retains OPEN remainders and conservative volumeUpperBoundMm3, and never invents an actual measurement. Ordinary BF03/receiving splitting is unchanged.
- Updated current Goods Issue/return/BF04 contracts, MODEL_MAP, Data Dictionary, model changelog, identity rules, contexts and local setup. No new collection/index or backfill. Additive permission seed grants Sales create/update, Owner approve and Warehouse update while preserving other grants; applied only to synthetic wmsd_hieudt_local_20261111 (3 role-grant updates, second run0). No shared/Atlas writes.
- Browser proof on guarded random localhost fixture: Sales pending → Owner approval on same PXB, orders/reservations/ledger all0 at approval. OTHER1.5 cartons×4=6 pieces picked/posted once; total16→10, remainder8SEALED+2OPEN, one OTHER_ISSUE and one handover. Captured1440desktop/390mobile. Native source forms checked empty only, not full native browser execution.
- Before integrating newer remote main: typecheck, changed-file lint and build passed; FE51/52 related tests passed, the sole failure is the previously established WorkflowTrace pagination baseline test. Default BE148pass/1existing duplicate-source contract failure/99skip. New validation/opening unit cases pass; repeated broad GI/native transaction runs timed out at60/300seconds under current environment (not reported as passes). Prior dated transaction results are historical. After integrating remote main c6237cc (BE) / 18e36d5 (FE), default BE151pass/0fail/107skip;8focused validation/outbound-opening/inbound-volume tests pass. FE54/54 related tests, production build/typecheck and changed-file lint pass. docs:check passes (58collections,837links). Conflicts preserve incoming portionIds restrictions and sealed-volume lower bounds while enabling outbound OPEN bounds. Current schema.json snapshots for inventory_balances and sales_goods_issues are synced. Fresh UI reviewer scored all three requested fixes resolved (ship at that scope); DESIGN.md preserved, detector and missing ui-visual-test remain unavailable. Synthetic browser DB/API3002/FE3336 and fixture scripts were removed; local preview3001/3334 remains healthy. Final separate GI transaction suite passed4/4 with0skips after running `RUN_GOODS_ISSUE_TESTS=1 node test/goods-issues.integration.test.js` directly (170.3seconds); it verifies legacy caps, same-ID manual approval, fractional-carton picking/posting, scope, replay and competing drafts. Earlier timeout attempts remain recorded as failed verification attempts, superseded by this completed run. User explicitly requested main→HieuDT→main and push for both repos; frontend branches verified at457ac9d.

## 16 November 2026 — UC-69–72 Goods Issue CRU

- Decision source: user renamed UC-71 to Create goods issue and UC-72 to Update goods issue, including supported status transitions, then requested implementation.
- Added native sales Goods Issue list/detail/create/update/cancel/picking/post APIs and FE `/goods-issues` screens. Navigation now separates DeliveryOrder from Goods Issue. Preserve source OD/WIR/SO item links, opaque document identities, lot/conversion snapshots, warehouse scope, optimistic versions, audit/outbox and command replay. Historical issues resolve missing header delivery IDs through their existing item references without migration.
- Draft create/edit/cancel transfers or restores reservation allowance without changing physical stock. Picking reuses the existing partial/full STORAGE → STAGING workflow. Posting atomically consumes staged reservations, deducts stock once, records PGI/handover and sets POSTED; it does not complete the SO or confirm customer delivery. Started picking cannot be silently cancelled.
- Added only `goods_issue:update`, default WAREHOUSE, with additive `npm run seed:goods-issue-permissions` preserving other grants. Canonical contract: [GOODS_ISSUES.md](docs/08_api/GOODS_ISSUES.md); setup: [local tests](docs/09_phat_trien/HIEUDT_LOCAL_TESTS.md). No model/collection change, shared database write, commit or push.
- Validation: 5/5 new BE validation/integration tests passed on guarded random `goods_issue_test_<ObjectId>` databases at localhost:27018/hieudt-test, including partial picking, freeze rollback, once-only posting, historical lookup, scope, cancellation of an unstarted task and concurrent drafts. FE build and 32 related tests passed, including uncertain post/refetch retry, line-specific accessible validation and distinct same-product picking lines. Default BE suite: 144 pass, 1 fail, 99 integration skips; the failure is the unchanged `customer-returns.contract.test.js` duplicate-source assertion, superseded by the existing split-return behavior. Global FE lint: 48 errors/13 warnings outside changed files; changed-file lint and docs:check passed. `ui:check` cannot launch Bash (E_ACCESSDENIED); the referenced ui-visual-test skill is absent. Browser verified list/filter, historical detail, create denial and empty states, then create/edit/cancel/pick/post with two lots in a separate random local `goods_issue_review_<ObjectId>` database. Exactly one PGI/one handover were checked before guarded teardown; temporary fixture/API3002/FE3336 were removed. Additive permission seed updated only the synthetic local review DB's WAREHOUSE role, no stock write there or shared DB write. Desktop1440/mobile390 and list768 inspected; same finish reviewer scored all three listed UI fixes resolved (`ship` at that scope). Impeccable detector cannot start because its engine cache is unavailable.

## 16 November 2026 - Password reset by email OTP

- The user chose an email OTP for password recovery. UC-131 starts at Sign In and UC-132 starts from the account details when an Administrator requests a reset. In both cases the account holder enters the OTP and chooses the new password. The Administrator sees the send outcome.
- Updated [Report 3](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt), [Report 4](docs/01_bao_cao/WMSD_Report4_Draft.md), the [project guide](PROJECT_GUIDE.md), and both requirements traceability matrices. Report 4 records the current support-only Forgot Password dialog and the existing direct password edit. The two OTP flows are pending implementation. This update changes documentation only.
- `npm run docs:check` passed. A cross-check verified the 132 Report 3 identifiers and specifications, both new RTM rows, and their actors, permissions, screen references and OTP failure branches. The existing UC-10 title and UC-11 status differences between Report 3 and the RTMs predate this update.

## 16 November 2026 - Product editing, status and purchase putaway

- The user fixed manufacturer, SKU and colour at product creation. The product update endpoint rejects manufacturer or colour changes with field errors. Both product actions use the saved `updatedAt` and require `product:update`. The frontend uses the record read when opening each dialog and preserves user input on a version conflict.
- Purchase putaway rejects inactive products when creating a task. Warehouse Staff can confirm the remaining quantities of an existing `OPEN` or `PARTIAL` purchase task after product deactivation. Confirmation still checks the original receipt, source portions, quantity and capacity.
- [Product contract](docs/08_api/NATIVE_MODEL_RUNTIME.md#sửa-và-đổi-trạng-thái-sản-phẩm) and [purchase putaway contract](docs/08_api/GOODS_RECEIPTS.md#kiểm-hàng-hàng-tạm-giữ-và-lệnh-cất). The changes require no schema migration. Release the backend before the frontend.
- Five focused native integration tests and 13 backend validation tests passed. The frontend product suite passed 32 of 33 tests, with one failure in the warehouse lot test. Chrome exercised live local API calls at 1440 px and 390 px, including stale edits, stale status changes and read-only access. The scratch databases were dropped. The repository-wide frontend lint still reports existing errors.

## 16 November 2026: Additive Atlas demo seed

- The user requested a separate seed and authorized loading it into Atlas. `src/seeds/atlas-demo.seed.js` added 4,016 records to `wmsd_database` in one transaction. The seed reuses existing warehouses, category and unit records, plus actors with the required warehouse assignments. It inserts synthetic records under groups `DM01` to `DM08`.
- The seed checks the registered schemas, source links, stock ledger, reservations, capacity and unique index keys. It carries historical scenarios and adds work queues for replenishment approval, PO drafts, open orders, partial and full draft inspection, and draft miscellaneous receipts. [Commands and sample codes](docs/09_phat_trien/SEED_CUA_HANG_GACH.md#bổ-sung-dữ-liệu-demo-trên-atlas).
- The local replica check passed preview, a unique-code collision with zero fixture writes, atomic insert, readback and rerun. Atlas readback matched all 4,016 planned IDs and rerun returned `ALREADY_SEEDED`. Native read services showed 120 received and zero outstanding on the sample completed PO, and a Warehouse Staff account could read the 16-piece draft inspection. All 57 tests in `npm run test:db-rebuild` passed. The archive evidence rows contain metadata only. Browser workflows were not exercised.

## 16 November 2026 - Occupied volume for open cartons and loose pieces

- Followed the approved receiving-volume plan. Purchase and custody post from the source inspection condition. `LOOSE` identifies loose pieces in purchase and return inspections.
- Stock receipts use the submitted occupied volume for `OPEN` and `LOOSE` when present. Otherwise they estimate per portion using batch carton or product dimensions. Stored quantities and volumes from existing transactions keep their original values.
- The FE posts purchase receipts without a packaging payload and treats measured volume as optional in custody, returns and stocktake closure.
- Contracts and field definitions are in the [native runtime contract](docs/08_api/NATIVE_MODEL_RUNTIME.md#mua-và-nhập) and [data dictionary](docs/03_thiet_ke/DB_Current_2026-11-12_58/WMSD_Data_Dictionary.md).
- MongoDB integration verified purchase, custody and OTHER receiving. Chrome with mocked API responses verified selection and posting at 1440 px and 390 px. The full test suites still report the existing 1 BE and 15 FE failures.

## 16 November 2026 — Purchase putaway checks receipt-line packaging

- Decision: the user chose to block affected purchase receipt lines and explain why when the source posting lacks packaging portion IDs.
- The purchase putaway service scopes portions by receipt line and source balance for context, planning and confirmation. Missing provenance blocks writes with HTTP 400. Planning checks package splits even when other tasks have open claims. An explicit empty portion list in the stock helper cannot move stock.
- The FE shows `putawayBlockedReason` on affected receipt and task lines. Eligible lines can still be submitted. The BE owns the split check. No schema change or data migration is required.
- Contracts: [native purchase runtime](docs/08_api/NATIVE_MODEL_RUNTIME.md#mua-và-nhập) and [goods receipt API](docs/08_api/GOODS_RECEIPTS.md#kiểm-hàng-hàng-tạm-giữ-và-lệnh-cất).
- Verification: 24 native BE integration tests and 13 focused FE tests passed. Chrome verified actual create and confirm for two loose pieces at 1440 px and both missing-provenance screens at 390 px, using an isolated local MongoDB test database.

## 16 November 2026 — RR submission checks the reviewed source version

- Source: user decisions in chat on 16/11/2026 on the open points of the validation review: (1) PO supplier document reference stays optional and is not added now; (2) `deliveryReference` keeps allowing repeats (no warning or block); (3.b) an RR cannot be submitted when its source document changed after the requester reviewed it.
- API: `POST /api/replenishments` with `action: SUBMIT` and `POST /api/replenishments/:id/submit` compare each line's `source.version` with the current SO/WIR/stocktake version and answer 409 `ERR-RR-409-004` with `invalidLines` when they differ; the RR stays `DRAFT`. `SAVE_DRAFT` and `PUT` still bind the latest version, so saving the draft again clears the conflict. Legacy lines without a stored version are not checked.
- FE: the RR detail "Gửi duyệt" error names the affected lines; the editor already highlighted `invalidLines`.
- Docs: [RR contract](docs/08_api/REPLENISHMENT_COVERAGE.md).
- Verification: 68/68 integration tests on a temporary local replica set 127.0.0.1:27018 (scratch data, shut down afterwards), including a new case: stale submit and stale direct SUBMIT rejected, re-save then submit accepted. FE `tsc --noEmit` clean and RR detail tests pass. Browser check not run. No remote DB write.

## 16 November 2026 — Validation fixes for RR → PO → inspection → receipt → putaway

- Source: user asked in chat to fix the confirmed findings of the validation review and to block past dates when creating/editing an RR or PO.
- IDs: `objectIdString` and the RR `objectIdSchema` lowercase ObjectIds; duplicate checks in putaway confirm/create and PO drafts key by the stored `_id`, so two spellings of one line no longer pass twice.
- Putaway: create/confirm move only the packaging portions recorded by the source receipt line; create rejects a shelf the carton does not fit and stores task lines in base units; DTOs expose `wholeBaseUnits`.
- Purchase/custody intake: packaging lines must belong to the receipt and be unique; SEALED portions cannot declare a volume and must match the batch; opened lines need a measured OPEN/LOOSE portion; no estimate for a loose remainder. Capacity counts intact cartons by their outer size. Destinations reject two targets for one line.
- Inspection: counted unit is the base unit or a carton UOM (default base unit), whole cartons only, SEALED lines a multiple of the carton size, `lines` 1–100, arrival not before the lot manufacture date; correction keeps the new header values. Lot creation rejects a future manufacture date.
- PO: `currency` = `VND`; `expectedOn` not before today (Vietnam time) on create, reschedule and a changed draft date; `lineAmount` rounded to 6 decimals; issue checks the warehouse is active; close-remainder requires whole base units.
- RR: `neededOn` not before today unless unchanged; warehouse fixed after the code is issued; `reasonNote: null` clears a saved reason; unknown/duplicate `evaluations[].lineId` rejected; evaluation always converts the quantity; reduced approval lines need their own reason. Custody quantities require whole base units; reversal preflight compares only the last movement into each balance; item decision reasons hold 2,000 characters (model change, no migration).
- FE: date inputs on RR, PO create/edit/reschedule use `min` = today and validators; PO quantities keep 6 decimals; RR approval blocks empty/over-requested quantities and asks a reason per reduced line; RR quantity checks whole base units; inspection has no ambiguous default lot, header length/phone/future checks, split-row headroom check and a 100-line limit; receipt posting asks for the measured volume of non-sealed lines (estimate removed); putaway checks whole units; reason limits aligned.
- Docs: [native runtime](docs/08_api/NATIVE_MODEL_RUNTIME.md), [RR contract](docs/08_api/REPLENISHMENT_COVERAGE.md), [data dictionary](docs/03_thiet_ke/DB_Current_2026-11-12_58/WMSD_Data_Dictionary.md), `src/models/CHANGELOG.md`.
- Verification: on a temporary local replica set 127.0.0.1:27018 (`hieudt-test`, empty scratch data directory, shut down afterwards) 67/67 integration tests across native-api, goods-receipt, hieudt-iterations, hieudt-scope, replenishment-evaluation, replenishment-warnings, receiving-custody-policy and persistence-transaction, including new regression cases for mixed-case duplicate putaway lines and sealed/opened packaging declarations; `npm test` 142 passed, 1 unrelated failure in `customer-returns.contract.test.js`; `docs:check` passed. FE: `tsc --noEmit` clean; inspection/receipt tests updated for the new rules plus one test for the measured-volume step; purchase-orders, receipts, inspections, putaway and replenishment tests pass (RR and putaway-list tests time out only under full-suite load and pass serially). The full FE suite still fails in unrelated files (inventory, issue requests, lots, warehouse access, return workflows, supplier returns, defective goods). Browser check not run. No remote DB write.
- Not changed (pending business decisions): PO as external document copy (price, RR link), duplicate `deliveryReference`, RR `source.version` confirmation. FE close-remainder relies on the BE whole-unit check because the PO detail DTO has no `wholeBaseUnits`.

## 16 November 2026 — PO UI fixes found during the browser check

- Source: user request in chat to fix four UI issues found while checking the purchase flow in the browser.
- Create PO: the expected date is prefilled from the RR needed date in Vietnam time (`Asia/Ho_Chi_Minh`) instead of slicing the UTC string, so 10/12 no longer shows as 09/12.
- Shared `Dialog`: the title row reserves room for the close button and long titles wrap, fixing overlap on phones for every dialog (props unchanged).
- PO evidence field: the native file input is replaced by the shared `Upload` with a "Chọn tệp" button and "Chưa chọn tệp"/file name text in Vietnamese.
- PO progress table: a line with nothing outstanding and a short-closed quantity shows "Đã chốt thiếu" instead of "Chưa nhận" or "Nhập đủ".
- No API, model or data change. Verification: 68 purchase-order FE tests and `tsc --noEmit` passed; ESLint on the changed files reports warnings only. The full FE suite has 10 failures in 7 unrelated files (inventory, issue requests, lots, warehouse access, RR editor, return workflows, supplier returns); the same 7 files fail with the original `Dialog.tsx`. Browser check on a local scratch copy of the demo DB (desktop and 375px): date prefill, wrapped dialog titles (close-remainder and the existing "Xác nhận PO"), Upload picker and the new status label confirmed.

## 16 November 2026 — One-step PO short closure, PO cancellation and RR list aggregation

- Source: user decisions in chat on 16/11/2026: short closure follows option A (Accountant only, no Owner approval, supplier evidence optional); a PO may be cancelled while DRAFT or OPEN without any linked transaction or document, and the RR then returns to "no PO" and accepts a new PO while one RR still links to one live PO.
- API: `POST /api/purchase-orders/:id/close-remainder` replaces `close-requests`/`close-approvals`/`close-executions` (now 404). `POST /api/purchase-orders/:id/cancel` added; PO detail returns `cancellable`. `purchase_order:approve_exception` is no longer used by PO commands (kept in the catalogue; Owner can still attach PO evidence through it).
- Model: `purchase_orders.replenishmentRequestId` optional and unset on cancel; partial unique index unchanged. `replenishment_requests` new list index. No migration; existing data stays valid.
- `GET /api/replenishments`: single aggregation with `$lookup` + `$facet`, `purchaseOrders` per row (fixes the FE `hasPurchaseOrder` flag that was always false), `submissions` excluded. RR detail lists cancelled POs through `sources`. Reconciliation skips cancelled POs.
- FE: PO detail gains "Chốt thiếu" (per-line quantity capped by outstanding minus draft receipts, required reason, optional evidence, irreversible warning) and "Hủy PO" (required reason, shown when `cancellable`). The unused legacy `CancelPurchaseOrderModal` was rewritten for the new API.
- Docs: [native runtime](docs/08_api/NATIVE_MODEL_RUNTIME.md), [RR contract](docs/08_api/REPLENISHMENT_COVERAGE.md), [MODEL_MAP](MODEL_MAP.md), [data dictionary](docs/03_thiet_ke/DB_Current_2026-11-12_58/WMSD_Data_Dictionary.md) (hand-edited; the generator would overwrite others' field notes), BF-01-A3 in the process proposal (VI/EN), FE context UC-12/UC-13, `src/models/CHANGELOG.md`. Report 4 draft PO sequence diagram updated for cancel and one-step closure; the role/permission table there still lists `purchase_order:approve_exception` for OWNER because the catalogue keeps it.
- Verification: 40 integration tests (38 passed, 2 skipped by design) on local replica set 127.0.0.1:27017 with RUN_NATIVE_API_TESTS=1, including new cancel/re-create/RR-list test and the rewritten HTTP closure flow. `npm test`: 142 passed, 99 skipped, 1 unrelated failure in `customer-returns.contract.test.js` (from main 31529bb). FE: 66 purchase-order tests and `tsc --noEmit` passed; 3 replenishment component tests time out only under full-suite load and pass when run alone; ESLint on the feature reports the 9 existing errors only. Browser visual checks not run. No remote DB write.

## 16 November 2026 — Purchase flow review fixes and required PO unit price

- Source: user asked in chat to fix the issues found in the RR → putaway review and to let Accountant enter the PO purchase price.
- `POST /api/purchase-orders` now answers 400 `Yêu cầu bổ sung đã có đơn mua` when the RR already has a PO instead of a duplicate-key 500. Concurrent creation is still serialized by the RR timestamp write.
- `/putaway-tasks/:id/confirm` and `/cancel-remainder` accept only purchase putaway tasks (source `goods_receipts`). Transfer (ITR) putaway stays readable through `GET /putaway-tasks/:id` but returns 404 on these writes, so the ITR state stays consistent and the confirm path no longer throws on a missing receipt source.
- `POST /goods-inspections/:id/cancel` also cancels the draft GoodsArrival created with the inspection.
- PO unit price: create/edit forms require `unitPurchasePrice` per line and show the order total; the API serializer no longer substitutes `0`. `draftEdit.lines[]` returns the saved price (removed by price redaction for Warehouse Staff). No schema, migration or data change; existing PO drafts saved with price 0 show 0 in the edit form.
- Files: `purchase-order.commands.js`, `purchase-order.service.js`, `purchase-putaway.service.js`, `po-receiving.service.js`; FE `CreatePurchaseOrderModal`, `EditPurchaseOrderDraftModal`, `purchaseOrderLineUtils`, `purchaseOrdersApi`. Contract: [native runtime](docs/08_api/NATIVE_MODEL_RUNTIME.md).
- Verification: 39 integration tests (37 passed, 2 skipped by design) across native-api, replenishment-warnings, backend-permissions and hieudt-scope on local replica set 127.0.0.1:27017 with RUN_NATIVE_API_TESTS=1, including new assertions for duplicate PO, transfer putaway writes, arrival cancellation and draftEdit price visibility. `npm test`: 142 passed, 98 skipped, 1 failure in `customer-returns.contract.test.js` that comes from main commit 31529bb and is unrelated to these files. FE: 63 purchase-order tests and `tsc --noEmit` passed; ESLint on the feature reports only 9 existing errors outside the changed lines. Browser visual checks not run. No remote DB write.

## 16 November 2026 — Owner-only, one-time opening-stock confirmation

- Source: the user explicitly corrected the earlier rule: "only owner should be able to do this and only once". Owner alone may preview/import/read/cancel/confirm opening stock and may confirm their own draft. Successful initialization is once per warehouse, including empty openings; retries replay without adding stock, while cancellation/validation failures do not consume initialization.
- Updated server role checks including command replay, default permission grants, local setup to revoke only opening-stock grants from every non-Owner role, frontend route/screen/action checks, template instructions and initialized-warehouse UI. This is an explicit exception to H36's earlier independent-verifier rule; other workflows retain their existing controls.
- Updated current API/setup docs, project guide, FE design rule, contexts and model compatibility log. No new schema/collection/index or stock arithmetic changes. No remote database writes.
- Regression tests first failed for non-Owner access and self-confirmation. After the change, isolated MongoDB tests pass for Owner self-confirmation, non-Owner/stale-grant rejection, additive setup revocation, role-change replay rejection, duplicate/concurrent/empty initialization and rollback. Route/UI tests pass for Owner access/self-confirmation, denial with stale grants and locked initialized warehouses. Validation: 28 focused frontend tests pass; targeted ESLint passes; production build/typecheck passes after correcting a test-only query option. The updated browser flow passes Owner upload/preview/draft/self-confirmation, initialized-warehouse UI lockout, Warehouse/Sales route and API denial, all-page XLSX export and mobile layout. Isolated opening-stock tests pass 2/2. Documentation checks pass. The existing project-wide failures listed in the earlier entry remain outside this correction. No real application database was changed.

## 16 November 2026 — Excel list exports and opening-stock file import

- Source: user explicitly requested implementation of the reviewed Excel export and Tồn đầu kỳ proposal.
- Added frontend real XLSX export across operational lists and reports, full paged/filter-aware reads, literal strings and precise quantities, metadata and stocktake reconciliation export after blind-count restrictions. Existing local issue-request and adjustment screens retain their local data source, now with XLSX output.
- Added Owner/Warehouse opening import template, client XLSX parsing, server preview with row errors/capacity, atomic draft/catalogue creation, independent Owner posting and creator cancellation. Added three narrow permissions, optional opening packaging fields, unique POSTED-warehouse index, shared warehouse transaction guard and additive local-only setup. Zero-stock initialization is recorded without zero stock transactions. No remote database, store data, commit or push changed.
- Canonical docs: [API/FE contract](docs/08_api/EXCEL_AND_OPENING_STOCK.md), [setup](docs/09_phat_trien/EXCEL_OPENING_SETUP.md), MODEL_MAP, current Data Dictionary, model changelog and both checkout contexts. No relationship/ERD structure changed.
- Validation so far: frontend typecheck/build pass; 19 relevant workbook/export/file/stocktake/report tests pass. Isolated localhost opening validation/transaction tests 2/2 and reviewed-demo tests 20/20 pass. Existing native API and HieuDT transaction integration suites pass 32/32 on a separate local replica set. The backend full run reports 144 passed, 98 skipped, and the one pre-existing contract failure. New opening tests additionally cover capacity rollback, additive setup replay, and an ordinary receipt racing opening initialization. New frontend modules pass targeted ESLint. Global lint has existing failures in legacy modules; one newly introduced ref-render lint failure was corrected. UI check/cleanup scripts and the referenced ui-visual-test skill are absent from this checkout; direct Playwright browser verification passed for template download, upload, preview, Warehouse draft creation, independent Owner posting, 25-record Excel export across a 10-record visible page, Sales route/API denial, and desktop/mobile viewport checks. Browsers were closed after verification. Backend customer-returns.contract.test.js fails identically in the untouched original checkout; its original failure is outside this change. The seed fixture's expected count was increased by three to account for the new permissions.
- Design acceptance: shared controls/tokens, full-width layout, labelled inputs, pending/error/empty/forbidden states and posting confirmation were checked. New frontend modules pass targeted ESLint and the Impeccable mechanical detector reported no findings. Global lint and absent UI scripts remain outside feature compliance. ExcelJS is a separate lazy chunk (about 930 kB minified / 256 kB gzip), producing a size warning without increasing the initial application chunk.
- Limits: existing operational report is a current snapshot; no historical stock reconstruction. File import accepts STORE-owned stock, base/carton quantities, and new products/batches only with required existing catalogue references and dimensions. No custody/transit/open-order/reservation migration. An Owner-created stock draft requires another Owner to post.

## 15 November 2026 — Quantity progress and partial return/defect handling

- Source: user requested all four reviewed Minh quantity patterns for their customer-return, supplier-return and defect flows.
- Added read-only per-line progress from current decisions/inspections and posted receipts/dispatches/ACKs; defect plans expose remaining execution quantities. Historical package snapshots take priority, with source conversion metadata in lookups.
- CR request parts can share one sale source while preserving independent claims and aggregate caps; defect proposals can split dispositions while counting in-payload and existing commitments. Refused customer custody can be handed back after accepted parts are received, bounded by the refused quantity only.
- FE adds a progress table, carton/piece entry, snapshot-based read-only area equivalence, blank actual receipts, explicit part splitting and remaining-quantity validation. Updated canonical return contract, PROJECT_GUIDE and FE context. No schema/collection change, migration or remote data write.
- Verification: 27 backend progress/contract/transaction tests passed using isolated local replica-set databases at 127.0.0.1:27018 (RUN_RETURNS_NATIVE_TESTS=1, RUN_HIEUDT_TESTS=1); 40 targeted FE tests passed. One additional existing list pagination test fails on both the changed tree and an unmodified 23d806f worktree. Changed-file ESLint and TypeScript passed. docs:check passed. Browser visual checks were not performed (the referenced ui-visual-test skill and ui-check script are absent in this checkout; bash is unavailable). The baseline worktree is retained outside the FE repo at ../quantity-review-baseline after automatic cleanup approval was denied; it does not enter normal test discovery. No shared/remote DB writes.

## 14 November 2026 — Purchase custody to supplier-return alternate flow

Source: explicit user request in chat: problematic intake goes to custody, then starts supplier return. Receiving create/update/confirm now require CUSTODY for non-GOOD lines. Custody read DTO adds supplier identity, scoped createSupplierReturn capability and line balance/advisory remaining quantity. FE custody line action creates the standard supplier-return proposal with quantity/reason and stable retry key, then opens agreement stage; supplier-owned dispatch remains CustodyRelease. No defect report, new collection, migration or live database write. Updated PROJECT_GUIDE, native runtime and return contracts, and FE context. Added receiving policy tests, intake-to-return integration coverage and custody UI submission/quantity validation coverage. Validation: 21 native API integration tests passed on an isolated local Mongo replica set at 127.0.0.1:27018 (RUN_NATIVE_API_TESTS=1, RUN_HIEUDT_TESTS=1); 9 policy/return contract tests passed; 25 FE custody/inspection/demo-flow tests passed; TypeScript and changed-file ESLint passed; docs:check passed. Global FE lint reports 48 existing errors and 13 warnings outside the changed files. ui:check cannot run because bash is unavailable and scripts/ui-check.sh is absent. The referenced ui-visual-test skill is absent from the repo and installed skills; desktop/mobile browser visual checks were not performed. No shared/live DB rollout; isolated test DBs are dropped by the tests.
## 16 November 2026 — Generate the account-status test credential at runtime

- Source: user's failed pre-commit gitleaks scan of `test/user-status-commands.test.js` and explicit request to fix that finding.
- Replace the hardcoded mocked account password with `node:crypto` random bytes generated once per test process. The bcrypt hash and positive/negative authentication checks use the same generated value; assertions and production authentication are unchanged.
- No gitleaks suppression, allowlist, hook change, dependency, environment edit or database write. The user's real Git index is preserved; verification scans a temporary copy with the intended changes applied.
- Checks: existing account-status suite exits 0 (14 passed, one pre-existing account re-lock audit TODO, no ordinary failures); syntax, `docs:check` and `git diff --check` exit 0. `gitleaks protect -v --staged --redact` on the copied index plus the two intended file updates exits 0 with no leaks; SHA-256 before/after confirms the real index was unchanged. The original staged fixture is not replaced until the user stages the fix.

## 16 November 2026 — BF-05 verification and embedded plan numbering candidate

- Source: OpenSpec change `add-bf05-stocktake-commands`; preserve the approved native lifecycle and both UC-93 close paths.
- Fixed sequential embedded-number lookup in `src/shared/utils/document-number.js`: inspect both embedded `_id` and `documentNo`, since stocktake plans retain ObjectId IDs. Root numbering, business prefixes and search semantics are unchanged. No historical renumbering, schema/index/migration, dependency change or shared/remote write. This does not add a cross-parent uniqueness guarantee.
- Current contracts: [DOCUMENT_IDENTITIES](docs/08_api/DOCUMENT_IDENTITIES.md) and [STOCKTAKE_LIFECYCLE](docs/08_api/STOCKTAKE_LIFECYCLE.md). Stocktake evidence upload/attach remains unavailable; existing attachment IDs are required.
- Checks after the code change: syntax exit 0; isolated lifecycle integration 5/5 and native iterations 11/11, both exit 0; default `npm test` exit 0 (225 passed, 111 skipped, one unrelated account-audit TODO); frontend stocktake tests 116/116, typecheck, scoped lint, UI rules and build exit 0. Required full frontend lint fails (47 errors, 13 warnings). Resolution integration exits 1 (5 passed, 1 failed, 1 TODO): the uniqueness TODO assertion succeeds, while line 241 has an unresolved search expectation mismatch caused by literal substring overlap between `KK` and `PAXLKK` numbers. No test file was changed or failure waived.
- Browser exercised Staff counting/reconciliation/submission/execution and Owner rejection/approval/close against a synthetic isolated local DB, plus no-variance close without a plan. Attachment metadata was supplied directly in that disposable DB, not uploaded. Desktop command flows and mobile completed-detail/list layouts were checked; full mobile command coverage is not established. Browser evidence predates the allocator fix; integration checks cover the changed code.
- Local Mongo recovery: preserved the stopped test container after observed file-descriptor exhaustion (WiredTiger error 24), and used a separate throwaway container with the same image and explicit nofile limit for successful integration reruns. No data repair, volume deletion or remote operation. The same independent reviewer accepted the allocator delta with notes and found no new production issue; overall BF-05 acceptance remains blocked by required checks and remaining visual coverage. Final docs/OpenSpec validation is recorded in the change evidence; the owned verification container was stopped cleanly without deleting its storage.

## 15 November 2026 — UC-113 role-scoped operational reports

- Source: owner-confirmed role-to-group mapping of 15 Nov 2026 (OpenSpec change `complete-fe08-fe09-use-cases`, decision D5).
- Backend: `GET /reports` now serves a group only to a role entitled to it (OWNER: all eleven; ACCOUNTANT: purchases, receipts; WAREHOUSE: inventory, transfers, stocktakes, adjustments; any other role holding `report:read`: none) and answers 403 otherwise. `GET /reports/options` returns the permitted `groups` next to the warehouses. Warehouse scope, optional strict filters and the reversed-date rejection are unchanged and now covered by tests. See [OPERATIONAL_REPORTS](docs/08_api/OPERATIONAL_REPORTS.md).
- Frontend: the report page drives the group selector from the options response, selects the first permitted group, blocks a reversed date range without a request while keeping the entered values, and shows an explicit empty state.
- Data impact: none; no schema, index, migration, seed, database write or new permission. Reports remain read-only.
- Limitation: a custom role holding `report:read` is offered no group until a business decision maps it.
- Checks: `test/operational-reports.test.js` (23 mocked-model tests) and 8 new frontend MSW tests. Not run against MongoDB or through authenticated HTTP.

## 15 November 2026 — Resolution request reads and count sheet (UC-100, UC-101, UC-121)

- Source: OpenSpec change `complete-fe08-fe09-use-cases` (specs `stocktake-resolution-requests` and `stocktake-count-sheet`, design D2 and D4).
- Backend: added `GET /stocktakes/resolution-plans` (paged, strict combined filters: warehouse, stocktake, lot, location, status, literal text) and `GET /stocktakes/resolution-plans/:planId` (plan, stocktake header, referenced snapshots and counts, decisions, execution records with evidence availability, version links and lookup labels, exact-decimal before/counted/difference per line), both requiring `stock_adjustment:read` and the stocktake-list warehouse scope. Added `GET /stocktakes/:id/count-sheet` requiring `stocktake:export`, warehouse scope and counter assignment (Owner exempt), refused with 400 before activation, returning snapshot rows grouped by location with empty-location confirmations and no book quantity. New files: `stocktake-resolution.query.js`, `stocktake-resolution.service.js`, `stocktake-count-sheet.service.js`; routes registered before `/:id`. See [STOCKTAKE_LIFECYCLE](docs/08_api/STOCKTAKE_LIFECYCLE.md).
- Data impact: read-only. No schema, index, seed, migration, permission or dependency change; no database was contacted.
- Checks: mocked-model tests `test/stocktake-resolution-list.test.js`, `test/stocktake-resolution-detail.test.js`, `test/stocktake-count-sheet.test.js` (results in the task report). Live MongoDB aggregation, timing and HTTP-level proof were not run.
- Limitations: the plan list unwinds embedded plans without a dedicated index; the location filter resolves through snapshots with extra reads. The server-side blind-count exposure in `GET /stocktakes/:id` is unchanged.

## 15 November 2026 — Docker setup consolidated

- Reason: backend needs one Dockerfile and one .dockerignore; the compose file belongs in the folder that holds both projects.
- Change: `Dockerfile` is now multi-stage (`dev` and `prod` targets, BuildKit cache mounts, non-root prod image, runtime `PORT` healthcheck). `Dockerfile.dev`, the backend `docker-compose.yml`, `docker/dev-entrypoint.sh` and the frontend `docker-compose.yml` were removed. A single `docker-compose.yml` at the workspace root runs `api` and `web`, with `AUTO_SEED` defaulting to false. See [DOCKER](docs/09_phat_trien/DOCKER.md).
- Frontend Dockerfiles: base image `node:22-alpine` and `pnpm-workspace.yaml` copied before install so `pnpm install --frozen-lockfile` succeeds; `web` starts Vite on `0.0.0.0` via a compose `command`.
- Data impact: none; no schema, index, seed or database write. The root compose file is outside both repositories and is not versioned.
- Checks: image build for both targets, `docker build --check` and `docker compose config` passed. `compose up` against MongoDB was not run.

## 15 November 2026 — UC-94 stocktake detail view

- Source: requested UC-94 / FE-08 detail viewing of included lots/locations, frozen book quantities, counts and variances.
- Backend: authorized `GET /stocktakes/:id` adds allowlisted, record-scoped warehouse/location/batch/product `lookups`. Current catalogue labels are distinguished from immutable snapshot quantities, units and cutoff; no current balance query. See [STOCKTAKE_LIFECYCLE](docs/08_api/STOCKTAKE_LIFECYCLE.md).
- Frontend: the existing detail route consumes these lookups without inventory permission, displays scope/lock/empty-location context and count/recount history, and preserves explicit zero versus uncounted values. Missing book quantities and invalid selected counts no longer become false variances/matches. Permission/loading/error/retry/record-switch states hide stale content; COUNTING frontend cache/UI redaction remains in place.
- Data impact: no schema, index, migration, seed, database write or new permission. Mutation workflows are unchanged. Server-side blind-count redaction and evidence downloads remain outside this change.
- Checks: 17 backend detail/list/custody-policy tests and docs:check passed; 46 frontend stocktake tests, typecheck, build, UI rules and changed-file ESLint passed. Global frontend lint remains blocked by 47 existing errors and 13 warnings outside this change; no completion/archive claim. Owned agent-browser checks used local fixtures in the actual layout at 1440×900 and 390×844, not authenticated live API/MongoDB evidence. The first fresh same-model review found no new code issue; final UI-delta review and detailed evidence/dispositions are tracked in `openspec/changes/add-uc94-stocktake-details/evidence.md` in the workspace (not this repository). No live MongoDB detail-read proof has been produced.

## 14/11/2026 - Bộ lọc danh sách kiểm kê (UC-93 / FE-08)

- Lý do: màn danh sách đợt kiểm kê cần tìm theo kho, phạm vi, thời điểm cutoff và trạng thái; trước đó `GET /stocktakes` nhận `q`/`from`/`to` nhưng bỏ qua, và không có lọc theo phạm vi.
- Thay đổi: `src/modules/stocktake-closure/stocktake-list.query.js` (schema strict `stocktakeListQuery` + `buildStocktakeListFilter`); route/service dùng chúng thay cho `outboundQuery` dùng chung. Lọc `locationId` theo `header.scopeLocationIds`, `from`/`to` theo `header.cutoffAt`, `q` theo mã đợt (escape ký tự regex). Hợp đồng ghi tại [STOCKTAKE_LIFECYCLE.md](docs/08_api/STOCKTAKE_LIFECYCLE.md).
- Dữ liệu: không đổi schema, index, seed hay dữ liệu; quyền không đổi (`stocktake:read`, phạm vi kho).
- Kiểm chứng: `node --test test/stocktake-list.test.js` 5/5 (hàm dựng filter + validation). Chưa chạy được kiểm chứng với Mongo vì Docker daemon không chạy lúc thực hiện.
- Giới hạn: `cutoffAt`/`scopeLocationIds` chưa có index; xin duyệt riêng nếu danh sách chậm.

## 14/11/2026 - Đồng bộ Report 3 theo code và lập bản nháp Report 4

- Theo yêu cầu người dùng, đối chiếu [Report 3](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt) với template SEP490 trên Drive và code BE/FE hiện hành, ưu tiên code. Sửa trong các mục có sẵn, không thêm dòng vào Change Log của report.
- Nội dung chính đã sửa: BF-01 (cảnh báo RR thay guard, PO chỉ sửa khi nháp, đổi ngày dự kiến, đóng phần còn lại qua đề nghị–duyệt–thực hiện, kiểm nhận theo lô/thùng/viên, GR/hàng giữ hộ nháp, cất hàng nguyên thùng, Warehouse đảo nhập trực tiếp); BF-03 (số nguyên thùng/viên, xác nhận trọn lệnh một lần); BF-04 (giữ hàng khi lập phiếu xuất nháp, PICK + bàn giao, nhận GOOD/DAMAGED, hồ sơ chênh lệch, đóng/đóng một phần); BF-06 (giá bán trên SO, OD giữ hàng, picking tạo GI nháp → PICKED); bỏ tone/calibre; UOM/Conversion; role tùy chỉnh và lockReason; định danh chứng từ (BR-34); MSG-18; UC-11 RETIRED (129 active), UC-10 đổi thành đổi ngày dự kiến PO, UC-12 có Owner duyệt.
- Không sửa quyết định chưa có trong code: PGI/POD/PAY-CFM, lập/kích hoạt/đếm kiểm kê và gửi SMTP vẫn giữ là yêu cầu; trạng thái chưa có API ghi ở Report 4 mục IV.6.
- Thêm [Report 4 bản nháp](docs/01_bao_cao/WMSD_Report4_Draft.md) theo template SDS: kiến trúc, package, ERD, danh mục 58 collection và bảng trường 34 collection sinh từ schema Mongoose hiện hành, sequence/class diagram cho BF-01–BF-08 (tách nhỏ), thiết kế bảo mật/RBAC/hiệu năng theo code.
- Kiểm tra: 35 sơ đồ Mermaid (31 Report 4, 4 Report 3) parse đạt bằng mermaid 11.4.1. Không đổi code, model, API hay dữ liệu DB. Bản Word trên Drive chưa được cập nhật.

## 14/11/2026 - Việt hóa mã và tên đơn vị tính

- Seed mẫu v11 dùng `Viên`, `Thùng` và `Mét vuông` cho cả mã và tên. `Mét vuông` có `areaMm2` Decimal128 bằng 1000000.
- Đồng bộ riêng 5 mục UOM trên MongoDB local `wmsd_demo_tile_shop_v9`. Hai mục trùng được ngừng sử dụng và giữ ID. Đọc lại danh mục và kiểm tra đủ 81 tham chiếu quy đổi sau khi ghi.
- Kiểm tra 29 ca seed, quy đổi diện tích và backfill. Xem [hướng dẫn seed cửa hàng gạch](docs/09_phat_trien/SEED_CUA_HANG_GACH.md).

## 14/11/2026 - Độ đậm tiêu đề kiểm hàng

- Quy tắc typography FE cho phép độ đậm 700; tiêu đề “Theo dõi tình trạng” trên trang tạo và chi tiết kiểm hàng dùng độ đậm này.

## 13/11/2026 - Tổng số lượng phiếu nhập theo đơn vị gốc

- Danh sách gộp phiếu nhập trả thêm `totalsByBaseUnit`, cộng riêng theo đơn vị gốc; màn danh sách hiển thị từng tổng kèm đơn vị. Chi tiết tại [GoodsReceipt API](docs/08_api/GOODS_RECEIPTS.md).

## 13/11/2026 - Dùng chung dấu nối trong mã chứng từ

- Theo yêu cầu ngày 13/11, `src/shared/utils/document-number.js` dùng `-` liền cho mọi loại chứng từ mới. Nhóm điều chuyển vẫn dùng mã kho rút gọn như `KG1`.
- Bộ cấp số tính cả mã liền và mã có dấu cách trong dữ liệu chứng từ và `operation_records`. Với mã kho rút gọn, bộ cấp số tính thêm mã kho gốc. Các chứng từ đã lưu giữ nguyên ID và mã phiếu.
- Cập nhật [hợp đồng định danh](docs/08_api/DOCUMENT_IDENTITIES.md) và dẫn chiếu từ `context.md` của FE.
- Trên MongoDB replica set local, 9 ca định danh, cấp số và thử lại giao dịch đạt, cùng 19 ca API native. Bộ test mặc định có một ca đếm bản ghi seed demo sai lệch `703` so với `702`, tái hiện với bộ cấp mã trước khi sửa.

## 13/11/2026 - Kiểm hàng: đếm theo Thùng/Viên và tự quy đổi ra m²

- **Lý do**: ô "SL thực nhận" luôn theo ĐVT lúc đặt PO (`prepare` ép `enteredUnit = source.enteredUnit`), cột "Còn phải giao" lại hiển thị theo đơn vị gốc và tổng cộng cộng lẫn nhiều đơn vị. Kho đếm thực tế theo Thùng (kèm Viên cho hàng lẻ/vỡ).
- **BE**: `po-receiving.routes.js` nhận `lines[].enteredUnit?`; `po-receiving.service.js` dùng `row.enteredUnit ?? source.enteredUnit` khi gọi `makeItem` và `inspectionContext` trả thêm `products[]`, `cartonUnits[]`. Hạn mức vẫn đối chiếu theo `qtyBase`. Không đổi model, không cần migration.
- **FE**: `InspectionLinesGrid` thêm cột chọn ĐVT đếm và cột "Quy đổi" (Thùng + Viên lẻ theo quy cách lô, đơn vị gốc, m²), "Còn phải giao" theo ĐVT của PO, tổng theo đơn vị gốc/m²; bảng có thanh cuộn ngang (`visible-table-scroll`). Hàm quy đổi ở `inspectionQuantities.ts`.
- **Kiểm thử**: `tsc`, eslint và vitest `features/inspections` đạt; `node --check` BE đạt. Chưa chạy test tích hợp BE (cần MongoDB replica set) và chưa kiểm trên trình duyệt.

## 13/11/2026 - Khôi phục API gộp phiếu nhập `/api/goods-receipts`

- **Lý do**: FE `/receipts` báo "Route not found" và thiếu dữ liệu. Commit `abffe20` (complete transfer receipt and warehouse workflow) ghi đè `goods-receipt.routes.js` bằng bản cũ hơn `137930c`, làm mất `GET /api/goods-receipts`, `GET /api/goods-receipts/:id`, `scopedDetail` (tên kho, mã vị trí, nhãn lô, kho điều chuyển), route sửa nháp `PUT /other/:id` và quyền `capabilities.edit`. Các merge sau không khôi phục.
- **BE**: `goods-receipt.routes.js` lấy lại toàn bộ logic của `137930c` (danh sách gộp lọc `kind`, `status`, `warehouseId`, `purchaseOrderId`, `q`, `from`/`to`; chi tiết chung, phiếu mua đi qua `getDocument`) và giữ danh sách `/transfer` mới của `abffe20` (`transferId`, `transferDocumentNo`, `dispatchId`).
- **BE (bổ sung)**: `transfer-read.service.js` mất `listDispatches` và `getDispatch` (cùng `dispatchScope`, import `hasPermission`) dù `transfer-read.routes.js` và test `native-api` vẫn gọi, nên endpoint dispatch sẽ lỗi. Đã lấy lại từ `137930c`.
- **Kiểm thử**: `node --check` và nạp module đạt; `goods-receipt.integration.test.js` chưa chạy vì không có MongoDB replica set local. Cần khởi động lại BE.

## 13/11/2026 - Tách dòng RR thành nhiều dòng PO theo lô NCC báo giao

- Accountant có thể ghi riêng từng lô NCC báo giao khi nhiều dòng PO dùng chung một dòng RR. `purchase-order.commands.js` kiểm tổng lượng gốc theo dòng RR khi tạo, sửa và phát hành PO. ID của từng dòng PO đã lưu được giữ khi sửa và chỉ được gửi một lần trong payload.
- `purchase-order.commands.routes.js` nhận `lines[].note` tùy chọn, tối đa 2000 ký tự. `purchase-order.service.js` trả ghi chú trong `draftEdit.lines[]`. Kho chọn lô thực nhận khi kiểm hàng và PO dùng chung ngày dự kiến giao. Thực hiện theo phương án A người dùng chọn ngày 13/11/2026.
- Đã cập nhật hợp đồng API native và phiếu duyệt H01/H02. Dữ liệu hiện có tiếp tục dùng schema và index hiện hành. FE chưa triển khai tách dòng và ghi chú.
- MongoDB replica set local: `native-api.integration.test.js` đạt 18/19, gồm ca tách dòng mới (tạo, vượt lượng duyệt, sửa giữ ID, trùng ID, phát hành chặn khi tổng các dòng vượt duyệt dù từng dòng không vượt, kiểm nhận 2 dòng) và vòng đời PO qua HTTP có `note`. Ca điều chuyển `native transfer dispatch…` lỗi `Cannot read properties of null (reading '_id')` tại dòng 380 (không có điểm giữ hàng ở vị trí lưu trữ); lỗi này cũng xảy ra trên worktree `HEAD` chưa có thay đổi, nên có sẵn từ trước. Hai suite hồi quy RR đạt 21/21. `npm run docs:check` đạt.

## 13/11/2026 - Lệnh cất hàng kiểm quy tắc nguyên thùng ngay khi lập lệnh

- **Lý do**: trước đây chỉ `confirmPutaway` (qua `splitPortions`) mới từ chối lượng cắt thùng, nên lệnh như 540 + 510 (100 viên/thùng, lẻ 50) lập được rồi lỗi lúc xác nhận.
- **BE**: `purchase-putaway.service.js` — `createPutaway` mô phỏng `splitPortions` trên quy cách tồn nguồn cho từng dòng và trả lỗi kèm viên/thùng và phần lẻ còn lại; bỏ qua khi tồn nguồn còn lệnh cất khác đang mở (thứ tự tách chưa biết, `confirm` vẫn kiểm cuối). `putawayContext` thêm `piecesPerCarton`, `looseQtyBase`. Không đổi model, không cần migration.
- **FE**: `PutawayTaskDetailPage` thêm cột "Quy cách" và kiểm bội số thùng (hoặc cộng trọn phần lẻ) trước khi gửi; hàm `cartonSplitError` ở `return-workflows/quantity.ts`. FE không biết thứ tự thùng/lẻ nên vẫn có ca chỉ BE từ chối (ví dụ chỉ cất phần lẻ khi còn thùng nguyên).
- Cập nhật [NATIVE_MODEL_RUNTIME.md](docs/08_api/NATIVE_MODEL_RUNTIME.md).
- Chưa chạy test tích hợp BE (cần MongoDB replica set).

## 13/11/2026 - Bỏ "Người bàn giao" khỏi phiếu tạm giữ, gộp chứng từ nguồn

12/11/2026: Kho 3D chặng pallet thêm pallets[] trong ô, nhập mã/kích thước/đế/chiều cao hàng, màu cảnh báo khi vượt giới hạn khu vực/kho trên 2D/3D; BE kiểm pallet nằm trong ô, mã không trùng và height vượt limit chặn apply nhưng cho lưu draft. Chưa liên kết sản phẩm/lô hoặc tồn. Thêm test warehouse-pallets. FE typecheck/lint và test pallet đang kiểm; chưa browser trực quan.

12/11/2026: thêm permission warehouse_layout_function:update vào catalogue và role ADMIN; seed sync tự bổ sung permission còn thiếu trong DB rồi đồng bộ role. BE layout thay kiểm access_control:update bằng quyền riêng khi functions thay đổi. FE Kho 3D dùng quyền riêng để thêm/xóa chức năng khu vực; quyền sửa kho vẫn giữ warehouse_location:update. Không đổi quyền phân quyền role chung.

13/11/2026: hoàn thiện vòng đời kiểm kê BF-05 theo luồng To-Be của người dùng và quyết định đưa **hàng phát hiện ngoài sổ** vào phạm vi. Backend `stocktake-commands.service.js` và routes `/stocktakes` (options, tạo, sửa, kích hoạt, đếm, đối chiếu, phương án, duyệt, thực hiện); đếm hàng phát hiện tạo snapshot `DISCOVERED` (sổ 0) cùng balance số lượng 0 nên chốt UC-93 giữ nguyên logic ghi sổ. Sửa lỗi trong bản làm dở: `resultRefs` không đúng schema `SourceReference` nên mọi lệnh đếm/đối chiếu/phương án sẽ lỗi khi lưu; đối chiếu không còn trả danh sách chênh lệch (bên đọc tính từ GET). Fixture chốt kiểm kê của `hieudt-iterations` cập nhật theo điều kiện "đã đối chiếu". Hợp đồng: [STOCKTAKE_LIFECYCLE.md](docs/08_api/STOCKTAKE_LIFECYCLE.md). Model: header `stocktakes` thêm `selectedCounts`, `lastReconciledBy/At` (không migration). Không đổi collection/index, không ghi DB chung.

Kiểm chứng 13/11/2026 trên replica set cô lập 27018: `stocktake-lifecycle.integration.test.js` 5/5 và `hieudt-iterations.integration.test.js` 11/11 đạt (chạy tuần tự). E2E trình duyệt qua giao diện thật với tài khoản demo Owner/Warehouse trên DB tạm `wmsd_demo_bf05_e2e`: luồng không lệch (lập kế hoạch → kích hoạt → đếm → xác nhận vị trí trống → đối chiếu → chốt) và luồng có lệch kèm hàng phát hiện (thiếu 4, phát hiện 8 → phương án → Owner duyệt → ghi thực hiện → chốt: tồn 128→124 và balance mới 8, 1 phiếu điều chỉnh, 1 giao dịch kho, khóa mở). Bước ghi hàng phát hiện được gọi qua API với đúng payload của form vì dropdown antd không thao tác ổn định trong trình duyệt headless; bằng chứng (`Attachment`) tạo trực tiếp trong DB tạm vì chưa có API tải bằng chứng cho kiểm kê. Chưa kiểm: mobile cho từng bước nhập (chỉ trang chi tiết), DB chung/Atlas, đếm mù ở máy chủ.

12/11/2026: chuẩn bị commit/push theo lệnh người dùng: mỗi file một commit trên HieuDT, push HieuDT, gộp main vào HieuDT rồi gộp HieuDT vào main ở cả FE/BE. Rà diff gồm cấu hình mẫu PORT=3333 không chứa secret. Kiểm trước phát hành: FE 56 test liên quan và build đạt; BE suite mặc định 123 pass/91 skip/2 lỗi EACCES loopback trong sandbox, chạy lại đúng 2 test HTTP ngoài sandbox đạt 2/2. docs:check đạt. Các test tích hợp DB opt-in chưa chạy và chưa xác minh trực tiếp GPU/browser. Không triển khai/seed hoặc migration DB trong luồng Git này.

12/11/2026: sửa lỗi không vẽ được vùng/ô: bỏ khoá vẽ khi chưa có functions, cho functionId rỗng ở draft nhưng chặn apply; thêm kéo vẽ ô trong vùng, preview giữ sau thả và nút xác nhận ngay trên canvas; tính hình từ tọa độ pointerup thay state preview có thể trễ. Công cụ vẽ rõ trạng thái và không bị mode pan chiếm thao tác. Kiểm FE có case kéo tạo vùng+ô rồi lưu khi thiếu quyền quản trị/danh mục rỗng; BE kiểm draft chưa gán chức năng không được apply. 14 test FE và 9 test BE đạt; build (kèm typecheck), lint và docs:check đạt. Chưa xác nhận trực quan trên browser. Không đổi schema collection/index hoặc dữ liệu DB.

12/11/2026: Kho 3D chặng 2 thêm danh mục chức năng theo kho, vùng chữ nhật xoay, ô local có tính kích thước theo lưới pallet; vẽ/kéo khu vực và kéo ô trong 2D, phản ánh màu/vạch trên 3D. Schema layout3d mở rộng; warehouses thêm layout3dApplied/layout3dAppliedAt. API lưu nháp giữ snapshot áp dụng, apply:true kiểm containment và ghi snapshot/audit nguyên tử với optimistic updatedAt; đổi functions cần access_control:update. Chặn chồng vùng/ô, kiểm vùng trong kho lõm theo cả cạnh; vùng ngoài do sửa đường bao lưu nháp được nhưng chặn apply. Catalogue kho loại field layout nặng khỏi response danh sách. Cập nhật MODEL_MAP, Data Dictionary, sơ đồ nhúng STAGE2_ZONES, PROJECT_GUIDE, context FE/BE và model log. Không migration/seed/ghi DB chung, không đổi tồn hoặc enum vị trí nghiệp vụ. FE 13 test Kho 3D và 6 test trang kho đạt; BE 8 test hình học/schema đạt; build (kèm typecheck), lint module và docs:check đạt. Chưa kiểm WebGL trực tiếp hoặc tích hợp ghi DB.

12/11/2026: sửa thao tác bộ vẽ theo người dùng: chuột phải hoặc Ctrl+chuột trái để pan, chặn context menu canvas. Cửa không chọn sẵn tường 1; có công cụ bấm tường đặt vị trí, preview nét xanh và tường cam; chọn tường/distance bằng form vẫn hỗ trợ. Nút thêm cửa disabled khi chưa chọn tường; bỏ chọn sau thêm. 10 test FE Kho 3D, build/lint đạt; chưa browser trực quan. Không đổi API/DB. Cập nhật IMPLEMENTATION/context FE.

12/11/2026: sửa UX bộ vẽ Kho 3D theo phản hồi: hướng dẫn 4 bước, zoom tại chuột và nút, pan pointer, kéo đỉnh (commit một bước hoàn tác), bấm điểm đầu khép kín; kiểm hình học/cửa trước bật Lưu và 3D, trạng thái lưu chưa có thiết kế chính xác, chữ/nút tương phản và nút Lưu xám khi disabled. Cập nhật IMPLEMENTATION và context FE. 7 test Kho 3D đạt; build/lint đạt; typecheck cuối và docs:check đạt. Không đổi API/DB. Chưa kiểm browser trực tiếp.

12/11/2026: Kho 3D chặng 1 thêm warehouses.layout3d tùy chọn cho mặt bằng/tường/cửa; lưu qua PUT warehouse-catalogue/:id/layout với optimistic updatedAt, scope, transaction và audit. Không đổi collection/index hoặc tồn, không backfill/rollout DB. FE thêm Three.js, vẽ 2D theo kích thước và góc, dựng 3D có cửa, lưu/mở theo kho. Thực hiện gộp main BE với backup stash theo lựa chọn người dùng; giữ cả hai phía changelog. Hợp đồng và sơ đồ field: git_doc/docs/10_Kho3D/IMPLEMENTATION.md. FE build/lint và 9 test, BE 3 test hình học đạt; chưa kiểm DB transaction hoặc browser GPU. Các phần khu vực/ô/pallet còn tiếp theo.

12/11/2026: gộp origin/main (định danh chứng từ \_id=documentNo) vào nhánh minhtd (RR theo cảnh báo, bỏ replenishment guard). Giải quyết xung đột: xóa src/shared/utils/replenishment-guard.js theo minhtd; persistence.transaction giữ transactionContext, session.documentNumbers và retry tối đa 20 lần khi trùng mã chứng từ (lý do observability document_number_collision), bỏ retry warehouseId_1_productId_1 của guard; document-command bỏ retry document_sequences; createPurchaseOrder giữ cập nhật updatedAt của RR và await newDocument; replenishmentOptionsSchema dùng documentIdentifier cho requestId kèm thông báo lỗi tiếng Việt. Sửa test HTTP PO lifecycle (native-api) không ép \_id PO sang ObjectId. Kiểm tra: RUN_NATIVE_API_TESTS=1 RUN_GOODS_RECEIPT_TESTS=1 npm test trên MongoDB local đạt 155 ca, 47 skip, 0 lỗi; npm run docs:check đạt.
12/11/2026: theo yêu cầu người dùng, FE /warehouses chỉ hiển thị các kho; thêm /warehouses/:id xem thông tin và vị trí riêng của kho. Danh sách vị trí có warehouseId cố định từ URL, lọc và phân trang tại BE, không tải toàn bộ kho rồi lọc ở FE. Thêm vị trí chọn sẵn kho; chi tiết vị trí quay lại kho cha. Cập nhật context FE và HIEUDT_WAREHOUSE_SCOPE. Test pages kho 6/6 đạt, build, lint file liên quan và docs:check đạt. Chưa kiểm trực quan trên trình duyệt. Không đổi BE hoặc DB.

12/11/2026: thiết kế lại trang role/quyền theo yêu cầu người dùng thành một bảng tick: chọn role phía trên, hiển thị ngay quyền đang gán, mỗi hàng một chức năng, cột Xem/Tạo/Sửa/Quyền khác và chọn cả nhóm. Bỏ tab và danh sách accordion; không hiển thị mã quyền kỹ thuật. Chuyển gán tài khoản vào modal mở riêng. Giữ draft từng role khi đổi lựa chọn, lọc không làm mất quyền. Cập nhật USER_ACCESS_STATUS và context FE. Build và lint accounts đạt; 14 test accounts đạt trước bổ sung test đổi role, bộ role sau bổ sung 7/7 đạt. Chưa kiểm hình trực tiếp qua browser.

12/11/2026: theo ảnh phản hồi, sửa responsive danh sách tài khoản FE: username hiển thị văn bản xuống dòng, cột có độ rộng rõ ràng; bỏ kho phân công và thao tác Sửa trong bảng. Xem/Khoá dùng button viền và icon, các nút điều hướng danh sách dùng onClick thay to/href. Màn dưới 768px dùng thẻ tài khoản và phân trang; bộ lọc co về 1–2 cột. Cập nhật USER_ACCESS_STATUS. FE accounts 14/14 đạt; build, lint file danh sách và docs:check đạt. Chưa kiểm hình trực tiếp trên trình duyệt.

12/11/2026: bổ sung thao tác quản trị tài khoản và phân quyền theo phản hồi người dùng. BE thêm users.lockReason, yêu cầu reason khi khoá qua PATCH /users/:id/status, trả lý do trong DTO, ghi audit; bỏ đường đổi isActive trong PUT thông thường. FE thêm cột Xem/Sửa/Khoá, popup lý do, hiển thị lý do khoá; trang vai trò thu gọn nhóm quyền và cho chọn nhiều tài khoản trên trang để gán cùng role, báo kết quả từng tài khoản. Cập nhật USER_ACCESS_STATUS, MODEL_MAP, Data Dictionary, PROJECT_GUIDE, model changelog. Không migration dữ liệu cũ; tài khoản đã khoá trước đây có thể thiếu lý do. Kiểm tra: BE user-status-validation 2/2, docs:check đạt; FE accounts 14/14, eslint phần accounts và build đạt. Chưa kiểm E2E trong trình duyệt vì browser local không mở được từ phiên này.

12/11/2026: cập nhật FE role Quản trị hệ thống trong repo NameUi. Màn tài khoản có bộ lọc, thông tin role/kho rõ ràng, form tạo/sửa có xác nhận mật khẩu, giữ dữ liệu khi lỗi, xác nhận vô hiệu hóa và chặn tự vô hiệu hóa. Màn Vai trò và quyền truy cập chuyển sang checklist theo nhóm, tìm kiếm, chọn cả nhóm, khôi phục thay đổi, lưu role hệ thống/tùy chỉnh qua API thật; bỏ badge số nhân viên tĩnh. Thêm test tài khoản và phân quyền; typecheck, build và 13 test accounts đạt. Không thay BE API/schema hoặc dữ liệu.

12/11/2026: lập đặc tả Kho 3D phiên bản 1 theo yêu cầu và các lựa chọn trực tiếp của người dùng. Tài liệu mới git_doc/docs/10_Kho3D/README.md mô tả thiết kế 2D/3D, khu vực/ô, pallet hỗn hợp/chồng pallet, công thức chiều cao, bản nháp, quyền và tiêu chí nghiệm thu; tách rõ quyết định đã chốt với đề xuất và điểm tích hợp mở. Thêm liên kết ở README và dòng yêu cầu tương lai trong PROJECT_GUIDE; không thay code/schema/API hoặc dữ liệu DB. Giữ nguyên thay đổi có sẵn tại src/modules/warehouse-stock/service.js. Kiểm tra docs:check lần đầu yêu cầu cập nhật changelog do workspace có code đang sửa; chạy lại đạt: 3 file hướng dẫn đồng nhất, 58 collections, 706 liên kết local và dấu vết changelog. Chưa triển khai hoặc kiểm thử chức năng Kho 3D.

12/11/2026: bổ sung quản lý danh mục kho cửa hàng cho màn /warehouses: GET catalogue/chi tiết, tạo và cập nhật kho qua warehouse_location:create/update; mã kho bất biến, kiểm optimistic updatedAt/idempotency, chặn tắt kho khi còn tồn/reservation/nhiệm vụ và kiểm sức chứa khi đổi kích thước. FE thêm trang tạo/sửa kho và hiển thị số vị trí thực. Test validation warehouse master đạt, FE typecheck/build đạt.

12/11/2026: đã chạy migration Atlas wmsd_database bằng scripts/migrate-receipts-to-goods-receipts.mjs --apply --allow-atlas sau dry-run: chuyển 7 phiếu từ purchase_receipts(1), customer_return_receipts(1), failed_delivery_receipts(1), transfer_receipts(4) vào goods_receipts với documentKind PURCHASE/CUSTOMER_RETURN/FAILED_DELIVERY/TRANSFER; cập nhật 21 bản ghi chứa subject/source collection legacy; tạo index goods_receipts; tạo uoms và conversions với index native; xác minh targetCount=7, referencesAfter=0 rồi xóa 4 collection legacy. Đối soát cuối Atlas: 58 collections, goods_receipts 4 kinds, không còn 4 collection legacy. Không xóa dữ liệu nghiệp vụ, giữ \_id/source links; không ghi DB local trong migration.

12/11/2026: theo yêu cầu mới, loại bỏ document_sequences khỏi registry và DB model set; mọi chứng từ mới dùng \_id=documentNo theo mẫu [Loại Phiếu] - [Mã kho/Bộ phận] - [YYMMDD] - [Số thứ tự tăng dần]. Số cấp trực tiếp từ các mã \_id/operation_records trong transaction, retry va chạm; chứng từ cũ giữ ObjectId. Thêm DocumentIdentity/cast mixed ref, validation mã chứng từ, cập nhật mọi source/subject/order/request/receipt tham chiếu, route cho phép mã mới; catalogue và item IDs vẫn ObjectId. Cập nhật document-number, schemas/references, registry/collections, Data Dictionary 58 collection và ERD 12/11, MODEL_MAP, PROJECT_GUIDE, context, AGENTS/CLAUDE/GEMINI và hợp đồng DOCUMENT_IDENTITIES. Test document identity 4/4, allocator 2/2; HieuDT scope/native đang xác nhận lại trên DB loopback riêng. Không ghi Atlas; migration dữ liệu cũ chưa chạy.

12/11/2026: hoàn thiện phạm vi 20 UC HieuDT theo bảng người dùng mới (38–44,47–56,114–115,120). Thêm native warehouse-stock API cho catalogue kho/vị trí, tạo/sửa/trạng thái vị trí với permission+warehouse+version+idempotency, freeze/capacity/stock/reservation/task guards; đọc tồn physical/usable/available/reserved/held/pending/custody/transit có Sales redaction; nhật ký lọc server theo product/lot/location/operation/time, trước/sau và nguồn theo quyền. FE thay các route demo kho/tồn/nhật ký bằng API thật, danh sách kho/filter nhanh, form riêng, bảng responsive và error không fallback mẫu. BF03 tìm sản phẩm/lô; BF04 trả sửa/gửi lại, giữ hàng từ dispatch draft, hủy draft giải phóng giữ hàng/task/hạn mức, nhận hỗn hợp/từng phần, tiến độ theo dòng và hồ sơ chênh lệch linked receipt qua StockDiscrepancy/ApprovalHistory hiện có. Phiếu nhận toàn hàng lỗi không sinh TO rỗng theo H08 đã duyệt. Scope/API chi tiết: docs/08_api/HIEUDT_WAREHOUSE_SCOPE.md; sửa BF04_API, PROJECT_GUIDE, hai context và tài liệu scope cũ; kiểm chứng ở HIEUDT_LOCAL_TESTS. Không đổi model/collection hoặc ghi DB nhóm; DB test mới đều loopback27018 và tự xóa theo prefix. Kiểm tra đã chạy: BE unit110 đạt/80 integration mặc định skip; FE targeted41/41, lint file liên quan, typecheck/build đạt; scope integration2/2 đạt (bao gồm hủy nháp, mixed receive và linked review). Full FE lần rà đầu437 đạt/24 lỗi ở prototype cũ và module ngoài phạm vi; sau sửa session test, targeted hiện hành41/41. Lint toàn FE còn59 lỗi có sẵn ở lots/products/purchase/replenishments/suppliers, không ghi là toàn suite sạch. Native hồi quy15/15 pass,0 fail,0 skip sau sửa assertion toàn hàng lỗi theo H08; Sales transfer options đã kiểm chỉ đọc local không lộ balances hoặc nguồn tác nghiệp. Browser đã xem kho/vị trí, tồn, nhật ký trên desktop/390px và chi tiết transfer với số thực, brand Tân Thương. Chưa commit/push/deploy.

11/11/2026: sửa hiển thị ObjectID trong BF03/BF04 theo yêu cầu người dùng. API đọc bổ sung warehouse/fromLocation/toLocation/lot cho BF03 và sourceWarehouse/destinationWarehouse cho BF04 sau kiểm scope. FE hiển thị mã/tên kho, vị trí và lô; giữ fromLocationId riêng khi sửa lệnh. Thiếu danh mục dùng nhãn tiếng Việt thay ObjectID. Hai vị trí người dùng đưa là G-01-2 (Ô AP6601 · A02) → G-04-1 (Ô AP6603 · A01), cùng K-GACH-01. Đã đối chiếu API local chỉ đọc, xác nhận ID giữ nguyên và unauth401; FE15/15 test. Không đổi model hoặc dữ liệu DB.

11/11/2026: bản local review đã có 2 UOM Viên/BOX và 38 quy đổi từ lô local v8 (phương án shared trước đó là39; chưa triển khai shared). Đã kiểm BF03 thực qua FE3334 → BE3001: 1 thùng8viên, chặn số lẻ/tách viên, create không ghi tồn, confirm/retry 1ledger. BF04 qua đủ tạo/duyệt/xuất/pick/nhận/putaway/đóng, COMPLETED với người nhận độc lập. Thêm scripts local-only và header định danh DB để tránh chạy nhầm. FE component10/10, build/typecheck đạt; native cuối 15/15 pass sau khi bổ sung chặn số nguyên trước quy đổi; giữ đủ index bằng khởi tạo theo lô. Replica27018/hieudt-test PRIMARY; giữ nguyên nguồn standalone27017.

11/11/2026: theo yêu cầu mới BF03, đổi FE thành bảng theo kho/vị trí nguồn, tìm tên/SKU/lô, chọn từng dòng hoặc toàn bộ vị trí và đích chung. Số lượng nguyên ở FE/BE; BE mô phỏng tách quy cách ngay lúc tạo/sửa, không tự mở thùng. Options dùng UOM/Conversion thực theo lô. Người dùng yêu cầu tạo DB local trước và chờ kiểm tra thành công mới được ghi wmsd_database; đang chuẩn bị bản review từ DB local v8 (nguồn chỉ đọc), không ghi remote. Thêm lệnh dev:hieudt-local port3001 và cấu hình proxy theo VITE_API_PROXY_TARGET. Kiểm tra trước thay đổi: native BF03/BF04 15/15, FE6/6; kết quả cho thay đổi mới được ghi riêng sau khi chạy.

11/11/2026: theo yêu cầu khôi phục tài khoản chọn sẵn FE, đã thêm đúng 5 users email demo vào wmsd_database: admin, owner, sales, warehouse, accountant tại ceratile.vn. Trước ghi đã thử insert/read và kiểm hash mật khẩu trên DB local cô lập (5/5); sau ghi đăng nhập qua FE 3334 đều HTTP 200 đúng vai trò. Tái sử dụng roleId và warehouseIds từ tài khoản nhân viên tương ứng, giữ nguyên toàn bộ 15 tài khoản cũ và danh mục quyền/kho. Không chạy lại seed toàn DB. Tài khoản warehouse2 không thuộc 5 lựa chọn FE nên không tạo.

11/11/2026: sửa proxy Vite từ localhost:3333 sang 127.0.0.1:3000, khớp cổng BE thực tế. Trước sửa auth/me qua FE trả 502 trong khi BE health 200 và auth/me 401. Thay đổi tại FE vite.config.ts và context.md; không đổi API hay dữ liệu DB. Sau sửa đã kiểm qua Vite 3334: /api/health 200, /api/auth/me 401 khi chưa đăng nhập; hết lỗi kết nối proxy.

## 11/11/2026 — Đánh giá RR theo cảnh báo

- Theo plan người dùng xác nhận ngày 11/11/2026, RR cảnh báo theo cùng kho và sản phẩm khi có RR mở, PO còn hàng chưa nhận hoặc tồn khả dụng đủ. Người lập quyết định lượng và xác nhận kèm giải trình khi lưu/gửi dòng có cảnh báo. SO/WIR và kiểm kê dùng để truy vết. API đánh giá trả tổng lượng và chi tiết trong phạm vi quyền.
- Duyệt RR và tạo, sửa, phát hành PO dựa trên bản RR hợp lệ và trần lượng đã duyệt. Bỏ so token, lượng đề xuất và guard RR dùng chung. Transaction tạo PO cập nhật thời điểm của RR nguồn để bảo toàn ràng buộc khi hủy RR đồng thời. Giữ phiên bản chứng từ, replay và unique index một PO mỗi RR.
- Cập nhật [hợp đồng RR](docs/08_api/REPLENISHMENT_COVERAGE.md), [native runtime](docs/08_api/NATIVE_MODEL_RUNTIME.md), [phiếu H01–H02 và bản lịch sử](docs/03_thiet_ke/DB_Rebuild_Review/13_Duyet_yeu_cau_bo_sung_va_don_mua.md), [hướng dẫn dự án](PROJECT_GUIDE.md), [bản đồ model](MODEL_MAP.md) và [từ điển dữ liệu](docs/03_thiet_ke/DB_Current_2026-11-09_57/WMSD_Data_Dictionary.md). Giữ schema và dữ liệu coverage cũ để tương thích, không migration hoặc seed lại. FE vẫn cần nối hợp đồng cảnh báo mới.
- Gọi thử POST /api/replenishments/evaluate với SKU AP6601 trên wmsd_demo_tile_shop_v9. HTTP 200, tồn khả dụng 198, RR đang mở 40, PO chưa nhận 0. Response phát OPEN_REQUEST và STOCK_SUFFICIENT.
- Review sau triển khai sửa hai lỗi. Ngưỡng tối thiểu bằng 0 làm mọi dòng phát `STOCK_SUFFICIENT` kể cả khi hết hàng; nay ngưỡng 0 dùng so sánh theo lượng đề nghị. Sửa dòng lập tay hoặc theo ngưỡng để gắn chứng từ nguồn bị chặn nhầm; nay chỉ dòng đã có chứng từ bị khóa nguồn. Thêm ca test cho cả hai.
- Trên MongoDB local rs0, ba suite replenishment-evaluation, replenishment-warnings và native-api đạt 33/33. Chạy npm test với RUN_NATIVE_API_TESTS=1 và RUN_GOODS_RECEIPT_TESTS=1 đạt 147 ca, 44 ca skip, 0 lỗi. npm run docs:check và git diff --check đạt.

## 11/11/2026 — Bỏ lịch giao PO và theo dõi chứng từ nhận hàng

- Theo plan được người dùng xác nhận, `PurchaseOrder` và seed bỏ lịch giao từng dòng. `replenishment.evaluation.js` dùng `header.expectedOn` cho lượng còn phải nhận sau khi trừ nhập đã ghi sổ và lượng hủy. Chuyển lượng hủy `Decimal128` sang số thập phân chính xác trước khi trừ.
- `purchase-order.commands` thêm lệnh đổi ngày dự kiến cho `OPEN`/`PARTIAL` với `purchase_order:update`, phạm vi kho, phiên bản, lý do và audit `RESCHEDULE_PO_EXPECTED_ON`. `purchase-read.service.js` trả phiếu kiểm và phiếu nhập trong `receiving-summary.documents`, giữ số lượng và tiến độ theo PO.
- Cập nhật [hợp đồng PO](docs/08_api/NATIVE_MODEL_RUNTIME.md#mua-và-nhập), [hợp đồng đánh giá RR](docs/08_api/REPLENISHMENT_COVERAGE.md), [từ điển](docs/03_thiet_ke/DB_Current_2026-11-09_57/WMSD_Data_Dictionary.md), ERD, BF01, phiếu duyệt H02 và [hướng dẫn seed](docs/09_phat_trien/DB_REBUILD.md). BSON cũ có thể giữ lịch đến lần ghi phiên bản tiếp theo. Không chạy migration hoặc seed lại DB demo. FE chưa nối hợp đồng mới.
- Chạy ba suite `native-api`, `replenishment-evaluation` và `replenishment-guards` với `RUN_NATIVE_API_TESTS=1` trên MongoDB local `rs0` tại `127.0.0.1:27017`, đạt 35/35, gồm ca mới kiểm đổi `expectedOn` đưa phần còn thiếu của PO vào hoặc ra khỏi coverage RR. Kiểm trực tiếp bộ dựng seed trong bộ nhớ xác nhận `PO-202610-001` có `expectedOn` và các dòng không còn lịch giao.
- `npm test` với `RUN_NATIVE_API_TESTS=1` và `RUN_GOODS_RECEIPT_TESTS=1` đạt 150 ca, 44 ca skip, 0 lỗi. `npm run docs:check` và `git diff --check` đạt.

## 11/11/2026 — Đảo phiếu nhập giữ PO đã đóng và cờ đang nhận hàng

- Theo quyết định user, 2026-11-11, đảo phiếu nhập của PO `CLOSED` giữ nguyên `CLOSED`; PO `OPEN`, `PARTIAL`, `COMPLETED` vẫn tính lại `PARTIAL`/`OPEN`. Sửa `purchase-correction.service.js`.
- Thêm `hasOpenReceivingWork` vào DTO danh sách và chi tiết PO ở `purchase-order.service.js` (hàm `openReceivingWorkIds`). Không thêm trạng thái PO. Ghi trong [hợp đồng PO](docs/08_api/NATIVE_MODEL_RUNTIME.md#mua-và-nhập).
- Test mới trong `native-api.integration.test.js`: đảo phiếu với PO `COMPLETED`/`CLOSED`, và cờ `hasOpenReceivingWork` theo kiểm nhận nháp. Chạy `RUN_NATIVE_API_TESTS=1`: 16/16 đạt. FE chưa hiển thị nhãn và chưa thống nhất màu trạng thái `COMPLETED`/`CLOSED`.

## 11/11/2026 — PO chỉ sửa khi còn nháp

- Theo quyết định user, 2026-11-11, kế toán chốt với NCC trước khi lập PO. Gỡ hai lệnh `supplier-confirmations` và `amendments` trong module `purchase-orders`. Khi PO đã phát hành, ngừng chờ phần hàng chưa nhận qua quy trình đề nghị, duyệt và thực hiện đóng.
- Bỏ dữ liệu xác nhận NCC khỏi hai schema PO và bộ dựng seed. Đọc và ghi phiên bản mới loại các trường cũ. Lịch giao đã lưu vẫn dùng cho nhận mua và đánh giá RR. API tạo/sửa nháp hiện chỉ nhận ngày dự kiến chung.
- Cập nhật [phiếu duyệt H02](docs/03_thiet_ke/DB_Rebuild_Review/13_Duyet_yeu_cau_bo_sung_va_don_mua.md), [từ điển dữ liệu và ERD](docs/03_thiet_ke/DB_Current_2026-11-09_57/WMSD_Data_Dictionary.md), [hợp đồng PO](docs/08_api/NATIVE_MODEL_RUNTIME.md#mua-và-nhập) và quy trình BF01.
- `npm test` trên replica set local với `RUN_NATIVE_API_TESTS=1` và `RUN_GOODS_RECEIPT_TESTS=1` đạt 141, bỏ qua 32. Test mới kiểm tra tạo/sửa/phát hành PO, hai route 404, từ chối sửa sau phát hành, đọc PO cũ, đóng phần chưa nhận và tính lượng đến đúng hạn theo lịch giao.
- Đã seed và xác minh `wmsd_demo_tile_shop_v9`, gồm PO mẫu `PO-202610-001` có lịch giao. Dữ liệu demo cũ muốn dựng theo schema mới cần seed lại trên đích demo trống. Chưa có migration hoặc API nhập lịch theo dòng. Xem [hướng dẫn seed](docs/09_phat_trien/DB_REBUILD.md#seed-po-theo-quyết-định-11112026).

## 11/11/2026 — Bổ sung liên kết kho, người dùng, SKU sản phẩm và chứng từ nguồn trong API RR

- Theo yêu cầu kiểm tra và hoàn thiện hiển thị chi tiết chứng từ bổ sung hàng (`replenishment/:id`), cập nhật service `replenishment.service.js`:
  - `getReplenishment`: Tra cứu và gắn thông tin đối tượng `Warehouse` (`code`, `name`) thay vì để ID MongoDB thô; tra cứu `User` (`fullName`) cho người tạo (`createdBy`), người gửi duyệt (`submittedBy`), người yêu cầu (`requestedBy`) và người duyệt (`decidedBy`).
  - Tra cứu collection `Product` theo danh sách `productId` của các dòng để trả về `productSkuSnapshot`, `productNameSnapshot`, `productIsActive` và `productImageUrl`.
  - Tra cứu `SalesOrder` và `Stocktake` cho các dòng có `source.documentId` để gắn kèm `documentNo`, `workflowStatus`, `version` thay vì chỉ có ID thô.
  - `listReplenishments`: Bổ sung thông tin kho, người tạo và SKU sản phẩm cho các dòng trong danh sách phân trang.
- Cập nhật tài liệu AI Assistance Log và Requirements Traceability Matrix (`be/docs/ai-log.md`, `be/docs/rtm.md`). Không cần migration DB.
- Bộ kiểm thử backend (`npm test`) đạt 103/103 tests.

11/11/2026: người dùng yêu cầu mã phiếu tự động và lưu thêm nhãn tiếng Việt, giữ mã kỹ thuật, giới hạn luồng HieuDT. Thêm DocumentSequence, cấp số transaction từ mã cuối +1, metadata tiếng Việt và cập nhật schema/seed rỗng/tài liệu. Đã fetch và merge main trực tiếp: BE 495b946, FE c91ef76, already up to date, giữ toàn bộ code đang sửa. Không ghi DB nhóm. Kiểm chứng cuối: allocator MongoDB 2/2; HieuDT 11/11; native 15/15 (bao gồm BF03/BF04); suite mặc định 106 pass/77 skip/0 fail; docs:check 59 collections/696 links. Lượt đầu lỗi biểu thức PCRE khi tìm mã đã được sửa và các test bị ảnh hưởng chạy lại đạt. Không commit/push.

## 11/11/2026 — Rà soát và chuẩn bị push HieuDT theo yêu cầu

- Người dùng yêu cầu kiểm tra đủ code ba iteration HieuDT rồi push đúng nhánh. Fetch/gộp main BE 495b946 và FE c91ef76; giữ stash trước gộp, không force-push hoặc sửa nhánh main. Tích hợp Conversion và các thay đổi mới main; giữ luồng tài khoản dùng quyền/kho thật và BF03/BF04 trong phần đang sửa.
- Bổ sung lịch sử GI/POD/nhập lại hàng giao thất bại trong API SO và lệnh giao theo đúng dòng/kho; FE hiển thị lịch sử thực cùng xác nhận tiền ngoài. Sales options có danh mục đơn vị và quy đổi hiện hành từ main. Không hardcode BOX trên form SO. Không tự quyết người xác minh nguồn D07/D08.
- Sửa bảng API HieuDT dùng đúng /location-movements và /warehouse-transfers; FE vẫn /location-moves và /transfers. Cập nhật docs/rtm.md hai repo theo mã UC hiện hành, đối chiếu mã trong kế hoạch gốc và ghi rõ mức kiểm chứng local.
- Bản sau gộp đã qua production build FE và suite BE mặc định 105 đạt/75 skip/0 lỗi. Kết quả kiểm thử tích hợp và UI cuối được ghi bổ sung sau chạy. Không áp dụng backfill Conversion, seed hoặc dữ liệu lên DB của nhóm; đây là push code, không triển khai DB.

## 11/11/2026 — Tự động hóa kiểm thử và demo quy trình trả hàng (trungph)

- Bổ sung kịch bản kiểm thử tự động hóa end-to-end `scripts/demo-return-workflows.mjs` chạy qua toàn bộ 6 quy trình trả hàng của trungph (BF02 báo cáo phế phẩm, BF07 trả hàng khách, trả hàng giao không thành công, BF08 trả nhà cung cấp, truy vết lô đa cấp qua 58 collection và chứng từ ngoài/lịch sử).
- Thêm lệnh `npm run demo:returns` vào `package.json`. Kịch bản thực thi trực tiếp trên in-memory dataset 58 schema đã chuẩn hóa và tự động kiểm tra kết nối cơ sở dữ liệu trực tiếp khi có biến môi trường.
- Bảo toàn định dạng hợp đồng API trả hàng, kiểm soát phiên bản và tính lũy kế trong [hợp đồng return workflows](docs/08_api/RETURN_WORKFLOWS_NATIVE.md).

## 10/11/2026 — API tra cứu chứng từ nguồn cho RR

- Theo kế hoạch người dùng duyệt, module replenishments thêm `GET /api/replenishments/options/sources` cho đơn bán và phiên kiểm kê. API phân trang sau khi lọc theo phạm vi người dùng, trạng thái nguồn và bộ lọc sản phẩm hoặc kho. Kiểm kê hợp nhất sản phẩm từ dòng và snapshot.
- Cập nhật [hợp đồng RR](docs/08_api/REPLENISHMENT_COVERAGE.md#danh-sách-chứng-từ-nguồn). API chỉ đọc, không cần migration. Form chưa gọi endpoint mới.
- Kiểm thử HTTP trên MongoDB replica set local xác nhận bộ lọc, phân trang, quyền theo loại nguồn, phạm vi dữ liệu, snapshot và điều kiện sửa RR.

## 10/11/2026 — Đơn vị theo sản phẩm trong tùy chọn RR

- Theo yêu cầu người dùng, `getReplenishmentOptions` trả đơn vị gốc và quy đổi cấp sản phẩm đang hiệu lực trong `products[].units`. Bỏ truy vấn chứng từ nguồn và giữ `sources: []` trong response. Quyền tạo, đọc và sửa tiếp tục được kiểm theo chế độ và `requestId`.
- Cập nhật [hợp đồng RR](docs/08_api/REPLENISHMENT_COVERAGE.md). Không cần migration. Form hiện chưa dùng `units` để dựng danh sách chọn đơn vị.
- Integration test trên MongoDB local kiểm tra đơn vị gốc, quy đổi theo sản phẩm, loại quy đổi theo lô và theo lịch tương lai, đơn vị ngừng hoạt động và phạm vi quyền của API.

## 10/11/2026 — Lý do từng dòng yêu cầu bổ sung tùy chọn trên BE

- Theo yêu cầu người dùng ngày 10/11/2026, API tạo và cập nhật RR cho phép bỏ `reasonNote` trong từng dòng. Chi tiết dòng và snapshot chấp nhận thiếu trường. Lý do đã lưu được giữ khi sửa cùng ID dòng và bỏ trường. Không cần migration.
- Cập nhật [hợp đồng RR](docs/08_api/REPLENISHMENT_COVERAGE.md), quy trình VI/EN, bản đồ model và từ điển dữ liệu. Lý do cấp phiếu và giải trình theo coverage vẫn bắt buộc. Form FE vẫn yêu cầu lý do từng dòng.
- Hai bộ test RR integration trên MongoDB replica set local cô lập đạt 14/14. Bao gồm tạo nháp, cập nhật, gửi duyệt trực tiếp và từ nháp, giữ lý do cũ và từ chối khi thiếu giải trình bắt buộc.

## 09/11/2026 — Căn cứ xác minh quy đổi tùy chọn trên API

- Theo kế hoạch backend được yêu cầu ngày 09/11/2026, bỏ yêu cầu nhập `verificationReference` khi thêm phiên bản quy đổi. Áp dụng cùng quy tắc chuẩn hóa cho mảng `conversions` lúc tạo sản phẩm. Validation ở `product.validation.js`, giá trị mặc định theo phạm vi quy đổi ở `conversions.js`.
- Cập nhật [hợp đồng Conversion](docs/08_api/CONVERSIONS.md) cho các bên gọi API. Model vẫn yêu cầu giá trị khi lưu. Không cần migration. Form frontend hiện vẫn yêu cầu người dùng nhập căn cứ.
- Kiểm thử HTTP trong `native-api.integration.test.js` xác nhận mã 201, nội dung phản hồi và lưu DB cho phiên bản cập nhật, đồng thời kiểm tra giá trị mặc định khi tạo sản phẩm và quy đổi gắn lô. Suite backend chạy với `RUN_NATIVE_API_TESTS=1` và `RUN_GOODS_RECEIPT_TESTS=1` trên MongoDB local đạt 131, bỏ qua 32.

## 09/11/2026 — Workspace Claude Code and Pi configuration

- User requested project setup following short instructions, scoped rules, skills, hooks and prompt audits. Added workspace-local configuration and repository launch wiring; corrected stale paired-checkout paths and preserved identical backend instruction files.
- Current behavior and limitations: [AI agent setup](docs/09_phat_trien/AI_AGENT_SETUP.md). No API, model, runtime source, database, credentials, global configuration or publication changes.
- Verification: shared guard tests and structural configuration audit passed; installed Pi native extension loader/handler smoke passed for scoped pointers, mutation blocking and prompt-audit dispatch. These checks do not prove a live Claude model session or full skill behavior. `npm run docs:check` passed: three identical instruction files, 58 collections and 683 local links; `git diff --check` passed in all three repositories.

## 09/11/2026 — Đổi runner CI BE để khởi động MongoDB 8.0

- Log `mongod` của [lần chạy 42635769959](https://github.com/minhoa2005/building-material-management/actions/runs/42635769959/job/129223389790) xác nhận MongoDB từ chối kernel trên runner `ubuntu-24.04`. Đổi `.github/workflows/ci.yml` sang `ubuntu-22.04` theo [hướng dẫn của GitHub Actions](https://github.com/actions/runner-images/issues/15005).
- CI tiếp tục dùng MongoDB 8.0 replica set `rs0` cho integration test. Cập nhật [hướng dẫn GitHub Actions CI](docs/09_phat_trien/GITHUB_ACTIONS_CI.md). Không cần di chuyển dữ liệu.
- `npm run docs:check` và `git diff --check` đạt. Cần chạy workflow từ bản sửa trên GitHub Actions để xác nhận replica set khởi động và test chạy đến hết.

## 09/11/2026 — Ổn định MongoDB 8.0 trên CI BE

- Ghim workflow BE trên `ubuntu-24.04` do MongoDB 8.0 từ chối khởi động trên một số kernel Linux mới; thêm bước in trạng thái và log container khi khởi tạo thất bại. Nguồn tương thích kernel: [MongoDB 8.0 production notes](https://www.mongodb.com/docs/v8.0/administration/production-notes/).
- Cập nhật [hướng dẫn GitHub Actions CI](docs/09_phat_trien/GITHUB_ACTIONS_CI.md). Không ảnh hưởng dữ liệu.
- Kiểm tra `npm run docs:check`; chưa chạy workflow trên GitHub Actions trong lượt này.

## 09/11/2026 — Khôi phục cấu hình MongoDB CI sau merge

- Merge commit `d7d09a6` đã đưa lại `ubuntu-latest` và làm mất bước log container; lần chạy CI mới vẫn gặp lỗi khởi động MongoDB. Khôi phục runner `ubuntu-24.04` và bước chẩn đoán log trong `.github/workflows/ci.yml`.
- Xóa dấu conflict còn sót trong [hướng dẫn GitHub Actions CI](docs/09_phat_trien/GITHUB_ACTIONS_CI.md). Không ảnh hưởng dữ liệu.
- `npm run docs:check` được chạy lại sau chỉnh sửa; workflow GitHub Actions cần chạy lại để xác nhận nguyên nhân qua log `mongod`.

## 09/11/2026 — Chạy integration test BE và diff coverage trong CI

- Cấu hình workflow khởi chạy MongoDB 8.0 replica set một node `rs0`, bật `RUN_NATIVE_API_TESTS=1` và `RUN_GOODS_RECEIPT_TESTS=1`, đồng thời tăng timeout cho coverage suite. Các integration test dùng database `wmsd_*_test_*` riêng; không dùng database ứng dụng.
- Bổ sung kiểm thử lọc danh sách lô, chi tiết tồn theo lô và lịch sử movement. Sửa fixture receipt FAILED_DELIVERY để khai báo đúng `documentKind`, giúp test demand reopening chạy đúng discriminator.
- Kiểm tra local: `npm run test:coverage` đạt 131/163, 32 test vẫn skip do các cổng/dịch vụ riêng; tổng coverage source là 84.03%. `diff-cover` so với `origin/main` đạt 82% (ngưỡng 80%). `npm run docs:check` đạt. Workflow chưa được chạy trên GitHub Actions.

## 09/11/2026 — Bộ quy tắc quản trị và coverage gate

- Tạo/chốt bộ tài liệu quản trị trong `be/docs/` và bản tương ứng trong `fe/docs/`; `release-checklist.md` tiếp tục ở trạng thái chờ quyết định. RTM dùng danh sách UC ACTIVE từ Report 3; mỗi repository tự quản lý test evidence và AI log.
- Thêm c8 9.1.0 và lệnh coverage LCOV cho BE; thêm Vitest V8 coverage cho FE. CI của hai repo checkout đầy đủ lịch sử, tạo LCOV và chạy `diff-cover==10.6.0` trên source mới/sửa trong PR với ngưỡng 80%. Bỏ qua docs, tests, config, scripts và lockfiles; thêm `coverage/` vào `.gitignore`. Không thay đổi GitHub branch protection.
- Kiểm tra BE: `npm run test:coverage` đạt 96, bỏ qua 62; coverage tổng toàn source 66.58% (gate chỉ tính dòng source thay đổi trong PR). FE: build đạt, test coverage tập trung đạt 7; lượt chạy toàn bộ trước đó có 8 lỗi trong hai test file vốn đã có thay đổi. Chạy `diff-cover` cục bộ chưa được vì Python chưa cài; CI cài Python và công cụ đã pin. Cảnh báo npm audit hiện có 5 mục (3 moderate, 2 high), trong đó không còn cảnh báo c8/test-exclude; chưa chạy `npm audit fix`.

## 09/11/2026 — CI trên GitHub Actions cho FE và BE

- Theo yêu cầu người dùng, hoàn thiện workflow BE và thêm workflow FE trong `.github/workflows/ci.yml` của từng repo. Kiểm tra tự chạy khi push lên `main` hoặc cập nhật pull request vào `main`, và hỗ trợ chạy thủ công. Xem [hướng dẫn CI](docs/09_phat_trien/GITHUB_ACTIONS_CI.md).
- BE chạy kiểm tra tài liệu và test mặc định. FE chạy build, test và báo cáo lint ở chế độ tham khảo vì có 47 lỗi lint hiện hữu. Các kiểm tra chạy với lockfile của từng repo, không cần truy cập dữ liệu ứng dụng.
- Đã kiểm tra hai workflow bằng `actionlint`. Build FE và `npm run docs:check` đạt. FE đạt 396/396 ca test. Bộ test mặc định BE có 96 ca đạt và 62 ca bỏ qua. Workflow chưa chạy trên runner GitHub.

## 09/11/2026 — Bỏ query batchId khỏi chi tiết sản phẩm

- Theo yêu cầu người dùng, `GET /api/products/:id` chỉ dùng ID sản phẩm trên đường dẫn. API tự chọn lô đã xác minh mới nhất hoặc trả cấu hình mặc định. Gửi query `batchId` trả 400. Cập nhật [hợp đồng Conversion](docs/08_api/CONVERSIONS.md) và kiểm thử tích hợp.
- Kiểm tra tích hợp BE trên MongoDB loopback đạt 12/12. `npm run docs:check` đạt.

## 09/11/2026 — Tự chọn lô mới nhất khi xem sản phẩm

- Theo yêu cầu người dùng, khi bỏ `batchId`, `getProduct` ưu tiên hệ số hiện hành của lô `VERIFIED` được tạo gần nhất. Dùng cấu hình cấp sản phẩm nếu chưa có lô phù hợp hoặc lô được chọn chưa có hệ số hiện hành. Query chọn lô cụ thể và `batchId=null` vẫn chọn phạm vi trực tiếp.
- Trang chi tiết ưu tiên bảng quy đổi hiện hành và giữ tab lịch sử riêng. Cập nhật [hợp đồng Conversion](docs/08_api/CONVERSIONS.md) và context FE. Thay đổi chỉ đọc, không cần migration.
- Kiểm tra tích hợp BE trên MongoDB loopback đạt 12/12, gồm ca tự chọn lô và ca trả cấu hình mặc định. Bộ test sản phẩm FE đạt 25/25. `npm run docs:check` đạt.

## 09/11/2026 — Chi tiết sản phẩm lấy Conversion theo phạm vi lô

- Bổ sung `batchId` tùy chọn cho GET `/api/products/:id`. Không có lô trả hệ số mặc định; có lô trả hệ số thuộc đúng lô, chỉ bản hiệu lực mới nhất trên mỗi UOM hoạt động. Batch thuộc sản phẩm và phải VERIFIED.
- Cập nhật [hợp đồng Conversion](docs/08_api/CONVERSIONS.md). Kiểm tra tích hợp xác nhận hệ số mặc định 6, hệ số lô 8, bỏ tương lai/UOM ngừng hoạt động và kiểm tra quyền, batch ID sai hoặc không hợp lệ.

## 09/11/2026 — Conversion theo sản phẩm và lô

- Thêm collection `conversions`, unique index theo phạm vi và phiên bản, cờ `uoms.isCarton` và API cấu hình có lịch sử. Thay tra cứu hardcode bằng resolver. PO giữ hệ số dự kiến, kiểm nhận dùng hệ số lô thực và đối chiếu cam kết theo đơn vị gốc.
- Bổ sung backfill có dry-run, seed và kiểm thử. Cập nhật Model Map, Data Dictionary, ERD và [hợp đồng API](docs/08_api/CONVERSIONS.md). Backfill áp dụng trên DB kiểm thử MongoDB loopback cô lập, gồm kiểm tra chạy lại. Chưa áp dụng cho DB ứng dụng.
- Kiểm tra: `npm test` đạt 96, bỏ qua 62 theo cấu hình mặc định. Native API integration đạt 12/12 trên replica set local, gồm HTTP 403/409 và kiểm nhận hệ số 6 → 8. `npm run docs:check` đạt với 58 collection.

## 09/11/2026 — Lưu URL ảnh trên Product

- Thêm `imageUrls` mặc định `[]` vào Product. API tạo nhận trường tùy chọn; API sửa giữ ảnh khi bỏ trường, thay danh sách khi gửi mảng và ghi audit/version theo luồng cập nhật catalogue.
- Cập nhật Model Map, Data Dictionary hiện hành, ERD và hợp đồng runtime Product. Không đổi quyền, không thêm collection/index, không migration/backfill. Upload file và UI nằm ngoài phạm vi.
- Kiểm tra: 18/18 test Product đạt; kiểm thử tích hợp API Product 1/1 đạt trên MongoDB replica set loopback cô lập; `npm run docs:check` đạt với 57 collection và 674 liên kết. Chưa chạy toàn bộ native API integration suite.

## 10/11/2026 — HieuDT: tích hợp main và nối ba iteration native

- Phạm vi do người dùng chốt: 18 UC riêng HieuDT theo kế hoạch ngày 28/10; giữ và gộp toàn bộ công việc đang sửa. BE chuyển HieuDT và fast-forward origin/main babedb1; FE gộp origin/main 01f4c42 bằng merge b1e1da2. Chỉ sửa trên HieuDT. Stash trước merge còn giữ, bản đối chiếu xung đột ở outputs/hieudt-20261109; không commit phần tính năng mới, không push.
- Bổ sung sales-execution service/validation/routes: sửa/hủy phần SO tự do, tạo WIR nguồn cho UC51, OD/reservation, picking từng phần, chống vượt cam kết khi đồng thời và hạn mức chung giao bù/hủy. Sửa Customer lookup theo schema, bổ sung reopenedSources và chống tính trùng reservation của nhiệm vụ trong shared stock. Chốt kiểm kê kiểm đúng snapshot/count/phương án/phê duyệt/thực hiện/bằng chứng; ghi DELTA hoặc RECLASS/RELOCATE và mở khóa nguyên tử. Báo cáo lấy dữ liệu native theo kho, không tổng hợp khác đơn vị hoặc trả giá ngoài phạm vi.
- FE nối orders/outbound-deliveries/picking-tasks/stocktakes/reports; giữ các luồng BF03/BF04 đã sửa. Quyền route dựa permission thực; retry giữ nguyên payload khi chưa rõ kết quả; ảnh nguồn dùng link riêng tư; CSV xuất từng dòng và chặn công thức. Khi giải xung đột giữ hợp đồng mới main cho danh mục/mua/nhập, ghép API tài khoản, lô, phạm vi kho và các luồng HieuDT vào DTO hiện hành.
- Hợp đồng hiện hành: [18 UC và endpoint/màn hình](docs/08_api/HIEUDT_ITERATIONS_NATIVE.md), [sales](docs/08_api/sales-orders/README.md), [native runtime](docs/08_api/NATIVE_MODEL_RUNTIME.md), [local tests](docs/09_phat_trien/HIEUDT_LOCAL_TESTS.md), PROJECT_GUIDE và context hai repo. Không đổi thiết kế collection. Index chống trùng ITR/TO và tài liệu BF03/BF04 từ công việc đang sửa được giữ lại.
- Đã kiểm: suite HieuDT 10/10 (service transaction + HTTP); suite native 11/11 (BF03/BF04, mua/nhập/đảo, catalogue); FE 11/11 trong 4 file; typecheck đạt. Suite BE mặc định cuối: 83 đạt, 71 skip theo cờ môi trường, 0 lỗi. FE production build đạt; docs:check đạt (57 collections, 685 liên kết). Lỗi kết nối loopback ở lượt hạn chế đã được xác định và chạy lại thành công, không sửa API để né kiểm quyền.
- Kiểm thử dùng replica set riêng localhost:27018/hieudt-test, DB ngẫu nhiên có prefix và dọn sau chạy. Không ghi DB chung/Atlas, không đổi instance 27017. Chưa browser E2E và chưa upload/download Cloudinary thật trong lượt này. D07/D08 xác minh nguồn SO mới vẫn chờ quyết định; UC chuẩn bị/phê duyệt/thực hiện kiểm kê ngoài 18 UC là dữ liệu đầu vào, thiếu thì chốt thất bại và giữ khóa.

## 08/11/2026 — Dọn tiện ích không sử dụng

- Theo yêu cầu người dùng, gỡ `scopedWarehouseIds`, `isPastCalendarDate`, `multiplyBaseQuantity` và `sha256Text` sau khi kiểm tra mã, test và script không có điểm gọi. Bốn mapper product, lot, supplier và replenishment cũ đã không còn trong checkout sau merge. Giữ nguyên toàn bộ mã upload.
- Không thay đổi API, model hay dữ liệu; không cần migration. Cập nhật [hợp đồng runtime](docs/08_api/NATIVE_MODEL_RUNTIME.md); function-guide cũ giữ làm bằng chứng lịch sử.
- Kiểm tra: `npm run docs:check` đạt; `npm test` có 79 đạt, 58 bỏ qua và 3 lỗi: hai test cũ import file không có trong checkout, một test CLI timeout khi chạy toàn bộ. Chạy lại riêng `test/local-mongo-config.test.js`: 2/2 đạt. Chưa kiểm thử API với DB thật trong lượt này.

## 07/11/2026 — Sửa danh mục khi tạo sản phẩm

- Form tạo sản phẩm lấy danh mục đang hoạt động từ API tùy chọn, bắt buộc chọn và gửi ObjectId tương ứng. Đơn vị gốc gửi mã UOM. Giữ nguyên API, model và dữ liệu. [Hợp đồng Iteration 1 native](docs/08_api/ITERATION1_NATIVE_2026-11-06.md).
- Sáu test form đạt, gồm kiểm giá trị danh mục, mã UOM, yêu cầu chọn danh mục và hiển thị lỗi `body.categoryId` tại ô phân loại. Kiểm thử form dùng fixture API.

## 2026-11-07 — Presentation startup: public authentication route

Moved the native workflow router after public health/auth mounts so its authentication middleware no longer intercepts login. Reproduced the blocked login, verified local seeded role logins and workflow options, and added a regression for public health/login validation with protected workflow options. Presentation runs against a separate local replica-set demo database; no Atlas connection or data change.

## 2026-11-07 — Tutor feedback: request terminology and source entry

Updated frontend CR/SR creation, list and detail wording to use business-specific requests instead of generic hồ sơ; defects remain reports and failed deliveries are recordings. Replaced record-selection modals with searchable dropdowns backed by scoped paginated lookup APIs. CR/SR/FD creation uses one entry area and a table of added lines; incomplete drafts cannot be silently omitted. No backend contract or database changes.

## 2026-11-07 — Trung workflow usability and scalable selection

Reviewed all routed Trung workflows after the reported customer-dropdown problem. Added scoped paginated selection and trace-section APIs, compact bootstrap and current external-reference version context. Frontend uses searchable record tables, dependency clearing, explicit actual quantities/outcomes, optional defect proposals, confirmation of consequences, stable partial-row identities, upload-safe form state, readable context and responsive navigation. Corrected strict supplier-close payload, reference list totals and the unreachable detail redaction. No model, collection, permission or Atlas change. See [UX review](docs/08_api/RETURN_WORKFLOWS_UX_REVIEW_2026-11-07.md) and [API contract](docs/08_api/RETURN_WORKFLOWS_NATIVE.md) for behavior, checks and limits.

## 07/11/2026 — Sửa các request frontend gây 403

- Chuyển form RR sang API lô theo kho/sản phẩm, bộ lọc PO sang NCC theo PO và tab kiểm nhận sang danh sách lô trong inspection context. Thêm ngữ cảnh sửa RR cho API tùy chọn và capability theo kho cho chứng từ nhận mua.
- Route, sidebar và các request phụ dùng grant phù hợp. Tách quyền từng thao tác UOM, giữ hộ, đảo nhập và put-away. Bổ sung chọn/gắn bằng chứng và giữ payload khi retry.
- Kiểm chứng 49 test FE và 15 test BE tập trung, cùng kiểm HTTP chỉ đọc trên DB local đang dùng. Giữ worktree FE hiện tại theo quyết định người dùng và để tích hợp main sau. [Báo cáo trước/sau và giới hạn](docs/08_api/ITERATION1_NATIVE_VERIFICATION.md).

## 07/11/2026 — Sửa phạm vi phân quyền backend và bổ sung API lựa chọn

- Theo kế hoạch BE được người dùng duyệt, dùng permission hiệu lực ở route và kiểm scope ở service. Role tùy chỉnh đọc SO/lệnh giao theo kho được giao và nhận DTO đã lọc giá, tham chiếu, bằng chứng. Gỡ upload chung và giới hạn xác thực của router trả hàng vào route thuộc nhóm.
- Thêm endpoint chọn lô theo quyền RR và endpoint lọc NCC theo quyền PO. FE nối hai endpoint trong đợt sau. Contract tại [RR coverage](docs/08_api/REPLENISHMENT_COVERAGE.md), [Iteration 1 native](docs/08_api/ITERATION1_NATIVE_2026-11-06.md) và [native runtime](docs/08_api/NATIVE_MODEL_RUNTIME.md).
- Thêm [lệnh đồng bộ quyền local](docs/09_phat_trien/ITERATION1_NATIVE_MIGRATION.md) và test HTTP/transaction. Dry-run xác nhận DB cấu hình đủ quyền, `sep490` thiếu bảy mã. Apply chỉ dùng fixture cô lập. Hành vi trước/sau và kết quả thực chạy ở [báo cáo kiểm chứng](docs/08_api/ITERATION1_NATIVE_VERIFICATION.md).

## 2026-11-07 — Trungph native return workflows, iterations 1–3

User requested implementation and branch pushes for merge review; explicitly confirmed Accountant historical-source verification with uploaded evidence. Ported defects/proposals/decisions/execution, CR custody/assessment/acceptance/receipt/handback, FD receipt and atomic reopening, supplier agreements/dispatch/ACK correction/closure, lot trace and external references to the current registry. Removed the replaced generic services. Added native transaction/HTTP/regression tests and frontend embedded-record mapping, permissions, packaging, recipients and historical evidence forms. Shared commands expose the actual operation ID to claim writers; quantity holds and ownership/packaging use native balances and transactions. No Atlas data/configuration/index change. See [canonical contract](docs/08_api/RETURN_WORKFLOWS_NATIVE.md) for scope, additive fields, migration limits and verification commands. Broader new-SO source decisions remain separate from historical CR verification.

## 07/11/2026 — Seed khởi động database tự động và phân quyền chuẩn 60 models

- Nguồn quyết định: Yêu cầu đọc toàn bộ models hiện tại và tạo file seed khởi động database, tự động kiểm tra database đã có dữ liệu chưa; chỉ chạy seed khi DB hoàn toàn trống và đảm bảo phân quyền chuẩn theo tài liệu dự án.
- Phân quyền & Tài khoản: Cấp chuẩn 5 vai trò (ADMIN, OWNER, SALES, WAREHOUSE, ACCOUNTANT) theo `de_xuat_quy_trinh_2_VI.md` §3 & §6. Danh mục 77+ quyền nghiệp vụ chuẩn (gồm các quyền mới native UOM, custody, reversal, exception chốt thiếu PO, hủy putaway). Bổ sung đầy đủ 6 tài khoản chuẩn `SEED_ACCOUNTS` (`admin@ceratile.vn`, `owner@ceratile.vn`, `sales@ceratile.vn`, `warehouse@ceratile.vn`, `warehouse2@ceratile.vn`, `accountant@ceratile.vn`) băm mật khẩu bcrypt cost 10, gán role và kho tương ứng (giữ nguyên quy tắc người nhận khác người xuất giữa 2 tài khoản kho).
- Cơ chế khởi động: Thêm `src/seeds/seed.js` và cập nhật `src/seeds/index.js`, `src/index.js`. Khi server khởi động và kết nối MongoDB, hệ thống tự động kiểm tra `databaseHasData(db)`: nếu DB đã có dữ liệu sẽ ghi log bỏ qua; nếu DB trống sẽ tự động khởi tạo collections, indexes và insert đầy đủ dữ liệu 60 models (hỗ trợ cả standalone MongoDB và Replica Set/Atlas qua transaction).
- Kiểm chứng: Thêm `test/database-seed.test.js` (3 test qua); toàn bộ 24 test liên quan (rebuild demo, model files, password migration) tiếp tục qua 100%. `npm run docs:check` qua.

## 07/11/2026 — Tích hợp chống trùng RR theo nguồn

- Nguồn quyết định: người dùng yêu cầu triển khai toàn bộ kế hoạch RR coverage; RR thủ công tương tự cần cảnh báo, xác nhận độc lập và giải trình. Không tự xử lý D07/D08, không thêm module kiểm kê vận hành.
- BE: evaluator SO/WIR/ngưỡng/kiểm kê đã chốt; canonical nguồn xuyên kho, chia pool tồn chung, RR→PO→tồn một lần, hàng lỗi/freeze và ledger giao thất bại/đảo. Source/token/snapshot gửi duyệt, hủy/rút RR, recheck PO một phần và giải phóng approval chưa đặt khi PO kết thúc. Shared command guard + thay ngưỡng/sản phẩm/lô dùng cùng khóa SO/kho/sản phẩm, retry và OperationRecord; audit dry-run local có kiểm read-only.
- FE: form native enteredUnit/lotId/source/evaluation, cảnh báo nhu cầu độc lập, giữ input khi409 và nguyên key/payload khi kết quả chưa rõ. Detail/PO có bước xác nhận lại nguồn; DTO giữ snapshot đầy đủ, ngày cần theo Saigon; phép đổi lượng duyệt dùng decimal chính xác thay vì làm tròn đơn vị gốc. Test danh sách kiểm đúng từng row khi trùng tên kho/sản phẩm.
- Tài liệu: [contract RR](docs/08_api/REPLENISHMENT_COVERAGE.md), native runtime, PROJECT_GUIDE/MODEL_MAP, G05/H01, dictionary/schema hiện hành, model changelog và context FE/BE. 60 collections/97 nested schemas; không tạo collection policy/conversion.
- Kiểm chứng cuối: bốn suite integration native/RR local 24/24 qua; FE focus 46/46 ở9 file qua. Build/typecheck, lint9 file mới/sửa và docs:check đều qua.
- Full BE npm test:70 qua/32 bỏ qua/2 file lỗi import src/migrations/iteration-1.js và src/seeds/data/demo.data.js không có trong checkout. Full FE lượt kiểm rộng:342 qua/25 lỗi; sau đó sửa assertion RR list và focused qua, chưa tuyên bố toàn suite xanh. Nhiều lỗi còn ở receiving fixture dùng endpoint cũ và timeout, không sửa ngoài phạm vi.
- Browser local: mở trang RR bị chuyển login; tài khoản demo kho báo sai thông tin, không đổi mật khẩu/data để vượt qua. Chưa xác nhận visual QA form thật; test component/API không thay bằng chứng đó.
- Dữ liệu/Git: chỉ ghi database test local ngẫu nhiên và xóa đúng test DB. Không rollout/migrate dữ liệu đang dùng, không commit/push; giữ thay đổi có sẵn. Lock mọi kho cho sản phẩm liên quan để bảo vệ nguồn khác kho, có đánh đổi tranh chấp theo sản phẩm. Instrumentation qua diagnostics_channel không chứa dữ liệu riêng tư.

## 07/11/2026 — Tự đồng bộ mật khẩu seed khi khởi động

- Theo yêu cầu, `src/index.js` gọi `src/config/seed-password-startup.js` sau kết nối và seed tùy chọn, trước khi mở API; chỉ chạy với MongoDB loopback đã kết nối và `NODE_ENV` khác `production`. Mỗi lần khởi động đưa mật khẩu user seed về giá trị trong source; lỗi đồng bộ chặn mở cổng. Kết nối ban đầu thất bại hoặc remote thì bỏ qua, không tự thử lại sau khi kết nối phục hồi.
- Cập nhật [hướng dẫn](docs/09_phat_trien/SEED_PASSWORD_MIGRATION.md); kiểm tra `node --test test/seed-password-migration.test.js` (3 test thành công với collection giả). Chưa ghi DB hoặc kiểm tra API đăng nhập.

## 07/11/2026 — Migration mật khẩu theo tài khoản seed

- Yêu cầu: đồng bộ mật khẩu user với `src/seeds/data/accounts.data.js` trên database local dev/test.
- Thêm `scripts/migrate-seed-passwords.mjs`: xem trước mặc định, `--apply` băm bcrypt cost 10 cho các username seed hiện có và chưa khớp; không tạo user, không sửa trường khác. Từ chối DB không phải loopback, kiểm tra username trùng, không thu hồi token; ghi từng user nên có thể cần chạy lại sau lỗi.
- Hướng dẫn và giới hạn tại [SEED_PASSWORD_MIGRATION](docs/09_phat_trien/SEED_PASSWORD_MIGRATION.md). Test logic bằng `node --test test/seed-password-migration.test.js` (2 test thành công, collection giả); chưa ghi DB hoặc kiểm tra API đăng nhập.

## 07/11/2026 — Script đặt lại mật khẩu database test local

Theo yêu cầu tạo và chạy script cho `wmsd_api_test_6aedf823b3e33975e06c07d1`, thêm `scripts/reset-test-user-password.mjs` và [hướng dẫn chạy](docs/09_phat_trien/RESET_TEST_USER_PASSWORD.md). Script mặc định xem trước; `--apply` băm bcrypt cost 10 và chỉ cập nhật `passwordHash` của một trong bốn user được chỉ định trên localhost. Đã kiểm tra xem trước, từ chối user không hợp lệ và thiếu mật khẩu; đã cập nhật cả bốn user và đối chiếu bcrypt thành công. Chưa kiểm thử đăng nhập qua API.

# 06/11/2026 — Iteration 1 native theo kế hoạch được duyệt

Thêm Uom, metadata sản phẩm/NCC, xử lý giữ hộ trọn vòng đời và Warehouse tự đảo nhập. Registry 60 collections; giữ items/source/snapshot native. Quyết định mới trong git_doc/docs/08_api/ITERATION1_NATIVE_2026-11-06.md. Có migration dry-run chỉ test DB local; không chạy Atlas, không commit/push. Kết quả kiểm thử ghi trong tài liệu bàn giao cùng đợt.

## 2026-11-07 — Seed bổ sung BF03 theo yêu cầu người dùng

Thêm scripts/seed-bf03.mjs và hướng dẫn docs/09_phat_trien/BF03_SEED.md. Preview
đọc đúng wmsd_database/K-GACH-01: thêm sản phẩm riêng BF03-DEMO-6060, lô VERIFIED,
hai vị trí BF03-A/B, hai holding points, 40 viên/10 thùng tại A, phiếu tồn đầu kỳ
và transaction/movement. Không sửa master hoặc tài khoản hiện có; ghi transaction,
chạy lại không cộng lại tồn đã chuyển. Người dùng duyệt nạp vào wmsd_database.
Đã phân biệt .env đang ghi sep490 với DB người dùng xác nhận wmsd_database;
không dùng số liệu sep490 để kết luận dữ liệu wmsd_database thiếu.

Kết quả: 6/6 native integration local đạt, gồm seed→options→chuyển 1 thùng→rerun
giữ tồn 36 viên. Người dùng đã duyệt đích remote; nạp 9 bản ghi thành công vào
wmsd_database và đọc lại service options với thukho01 thấy nguồn BF03-A 40 viên,
đích BF03-B. Không chuyển thử remote. docs:check/diff check đạt. Không đổi kết
nối ứng dụng, chưa commit/push.

## 2026-11-07 — Sửa API BF03/BF04 theo native models

Theo yêu cầu sửa toàn bộ API BF03/BF04 và quy tắc hiện hành trong PROJECT_GUIDE.
BF03 bỏ trạng thái PARTIAL khỏi bộ lọc và UI, xác nhận trọn lệnh bởi creator;
actual hiển thị từ ledger, giữ key khi thử lại. Sửa lỗi embedded packagingPortions
khi chuyển một phần thùng nguyên: giữ subdocument/timestamp còn lại thay vì recast.
BF04 thêm options có scope tồn/vị trí và danh mục kho đích, kiểm quyền lại khi
replay TO, chặn sinh trùng ITR/TO bằng lock + unique partial indexes. Sửa ca nhận
toàn hàng hỏng với destinations rỗng để có thể đóng TR. FE dùng biểu mẫu thay
prompt/JSON, quyền theo permission và kho, payload enteredUnit/native IDs.

Đã cập nhật hai API contract, MODEL_MAP, Data Dictionary và model changelog.
5/5 native integration đã qua trên replica test cục bộ (gồm full BF03, replay,
full BF04/custom role và ca toàn hỏng). Typecheck FE đạt. Không ghi DB nhóm hoặc
remote. Index mới cần rà trùng trước triển khai DB có dữ liệu. Full FE suite còn
lỗi lịch sử theo mốc trước, không coi đây là nghiệm thu toàn project. Chưa commit/push.

## 2026-11-06 — Đồng bộ runtime theo model mới (đang kiểm chứng)

Theo xác nhận trực tiếp của người dùng: bỏ ba thư mục model và danh sách phụ thuộc đã rà. 59 collection + 96 nested schema chuyển về src/models; services/DTO/permissions/transaction và FE connected consumers chuyển hợp đồng native. Registry được đổi tên trung tính (`registry-entries.js`, `configureReferences`) để không còn chỉ dẫn profile cũ. Seed v9 thêm quyền mới, 642 bản ghi mẫu; không ghi DB ứng dụng hoặc remote. Xem [hợp đồng và giới hạn](docs/08_api/NATIVE_MODEL_RUNTIME.md). Ba test tích hợp native đã qua; FE build đã qua nhưng suite giao diện còn lỗi cần chuyển fixture. Chưa hoàn tất nghiệm thu/commit/push.

## 06/11/2026 — Giải quyết merge main và giữ ranh giới model

Merge baf5fb4 vào HieuDT; giữ API PO/nhận mua, auth, field sản phẩm/lô/NCC của main trong registry legacy (44 collection), giữ bộ schema/category v8 (59 collection). Union scripts/dependencies, sửa import API/test/tool và bổ sung export ReplenishmentSubmission. Fixture reviewed/migration tách khỏi seed PO_INSPECTION runtime bằng EJSON tổng hợp từ 5f4a296; schema lịch sử dùng connection riêng. Không đổi schema/ERD 59 collection, không ghi DB và không port API trong lượt này. Cập nhật MODEL_MAP, PROJECT_GUIDE, context, README và hướng dẫn MERGE_MAIN_2026-11-06. Kiểm chứng cuối ghi trong hướng dẫn merge.

# Bỏ quản lý đội xe và lưu biển số theo lần bàn giao — 05/11/2026

## 06/11/2026 — Category 1–n Product và bỏ builder không dùng (v8)

Người dùng yêu cầu bảng category, tham khảo Gạch Tốt và duyệt 5 nhóm, mỗi product 1 category. Thêm category.model.js (code unique/immutable, name, description, isActive, timestamps), products.categoryId bắt buộc ref Category và index, registry reviewed 59 collection. Profile migration lịch sử giữ hợp đồng cũ. Seed v8 gắn 18 product theo hãng/SKU: lát nền 9, ốp tường 3, trang trí 2, sân vườn 2, giả gỗ 2. Không đổi nghiệp vụ tồn, giá, lô hay quyền API; chưa làm API category.

Rà 315 file JS/MJS trong src/scripts/test: 96 schema embedded có nơi gọi; ít nhất 12 file module API dùng legacy; registry/ref/capacity/seed/migration dùng rebuild. Chỉ bỏ reviewed-events.js, reviewed-support.js, reviewed-workflows.js vì không có importer ngoài chính nhóm ba file này. Giữ các thư mục đang dùng. Báo cáo git_doc/outputs/model_folder_usage_2026-11-06.json.

Khi kiểm tra, local v7 không còn và Atlas wmsd_database đang trống; công cụ nâng v7 dừng trước ghi. Không có nguồn để bảo toàn ID v7, nên tạo mới mẫu local wmsd_demo_tile_shop_v8, rồi deploy vào Atlas rỗng: 59 collection/638 bản ghi. Đọc lại Atlas khớp hash local và toàn bộ index, schema/ref/tồn/hạn mức/sức chứa/hóa đơn. Báo cáo categories_v8_local_seed_2026-11-06.json, categories_v8_atlas_deployed_2026-11-06.json, categories_v8_atlas_verified_2026-11-06.json. Không đổi kết nối ứng dụng, không lưu URI có mật khẩu vào Git.

Bổ sung công cụ nâng category cho máy vẫn có đúng v7: chỉ thêm category/categoryId, không ghi đè dữ liệu khác; bảo vệ bằng so sánh snapshot và transaction Atlas. Nhánh nâng v7 chưa chạy thành công trên môi trường này do nguồn trống; guard và tính bảo toàn dữ liệu có test. 57/57 test DB/model/category/deploy đạt. Cập nhật MODEL_MAP, Data Dictionary 59_v8, SQL-style diagram (11 tab/493 quan hệ), context, PROJECT_GUIDE, hướng dẫn local/seed/category/Atlas, README và ba file luật giống nhau. Đã xuất và xem ảnh tab Warehouse & catalogue; tăng chiều cao theo dòng quấn và khoảng hàng để tránh cắt trường. Các báo cáo v7 giữ nguyên là lịch sử. API legacy chưa port; D07/D08 vẫn chờ; không commit/push Git.

## 06/11/2026 — Tách model từng file, seed chỉ gạch và đưa DB lên Atlas

Theo yêu cầu trực tiếp: mỗi schema hiện hành một file .model.js. 58 collection có file riêng ngay src/models; 96 schema nhúng có file riêng trong embedded, không tăng collection. reviewed-registry nạp factory mới; model cũ chuyển vào legacy cho API chưa port, rebuild giữ registry/helper/profile migration lịch sử. Không đổi trường, ref, default, index hay dữ liệu BSON sau serialize khi tách. Đã đối chiếu metadata trước/sau và hash serialize trên cùng fixture; xem git_doc/outputs/model_files_split_2026-11-06.json.

Người dùng chọn bỏ thiết bị vệ sinh. Giữ nguyên local v6, sao dữ liệu thực đang có sang v7, loại các lô/tồn/ô/điểm tồn/phiếu đầu kỳ/giao dịch/NCC liên quan, kiểm không còn tham chiếu bị bỏ; giữ ID và dữ liệu khác. Seed v7 chỉ gạch: 58 collection, 633 bản ghi, 18 sản phẩm, 39 lô. Atlas wmsd_database trước khi ghi rỗng; đã triển khai từ v7, đọc lại đối chiếu hash toàn bộ dữ liệu cùng index và kiểm nghiệp vụ; xác minh độc lập đạt. Bí mật chỉ nhận qua biến môi trường, không đưa vào Git/tài liệu. Công cụ không ghi đè đích đã có dữ liệu khác.

Cập nhật MODEL_MAP trỏ đúng 58 file, Data Dictionary v7 có sourceFile, hướng dẫn Atlas/local/seed/registry, context, PROJECT_GUIDE, ba file luật giống nhau và README. 52/52 test DB/model/deploy đạt. Full suite ở mốc trước seed v7: 114 đạt, 10 lỗi legacy (9 import thiếu src/shared/utils/domain.js, 1 fixture thiếu INTERNAL_TRANSFER_REQUIREMENT), 13 bỏ qua. Chưa port API/service, chưa đổi kết nối ứng dụng; D07/D08 vẫn chờ. Tiếp tục HieuDT không merge main theo lựa chọn đã có; không commit/push Git trong lượt này.

## 06/11/2026 — Kích thước sản phẩm, màu và thùng theo lô (v6)

Theo quyết định trực tiếp: products bỏ nominalSize, thêm dài/rộng/cao (mm) và màu bắt buộc; mỗi màu một ID, khóa hãng/SKU/màu. product_batches bỏ calibre/tone, khóa productId/manufacturerLot, số viên/thùng cố định và kích thước ngoài thực tế. Snapshot quy cách giữ trên dòng, số thùng trên lần nhập; kiểm quy cách khớp lô, cạnh thùng vừa ô và dung tích. Không suy kích thước ngoài từ thể tích viên. Helper chỉ ước tính lượng xếp được khi chưa có tọa độ/3D. Cập nhật schema, seed v6, validator, tests, dictionary, diagram, MODEL_MAP và hướng dẫn. 48 test DB/model đạt; kết quả local tại git_doc/outputs/product_carton_v6_local_2026-11-06.json. Vẫn 58 collection/654 bản ghi; DB trước giữ nguyên. API legacy chưa port, không ghi DB nhóm, không commit/push.

## 06/11/2026 — Lược trường trùng/thừa trên 58 bảng

Theo yêu cầu rà biến từng bảng: bỏ 44 đường dẫn field, giữ chức năng trạng thái và kiểm sửa đồng thời riêng. Chi tiết từng collection tại DB_Rebuild_Review/38_Ra_soat_truong_58_bang.md; dictionary v5 và diagram đã tái tạo. Seed v5 có 58 collection / 654 bản ghi. 43 test DB/model đạt, docs:check và kiểm local. Danh mục bỏ version cần API kiểm updatedAt khi port; API legacy còn riêng. Không thay DB nhóm và không commit/push.

## 06/11/2026 — Gộp tiếp 5 bảng, 63 → 58

Theo yêu cầu người dùng: movements vào stock_transactions; holds và resolutionPlans vào defect_reports; resolutionPlans vào stocktakes; deliveryConfirmations vào sales_orders. Giữ ID/lịch sử, kiểm hồ sơ cha và trùng dòng, index truy vấn, preflight BSON. Seed v4 riêng ở localhost, API legacy chưa port. Kiểm 41 test và docs:check; kết quả local ở git_doc/outputs. Người dùng chọn tiếp tục HieuDT, chưa merge 5 commit mới của main do file trùng đang sửa; không commit/push.

## 06/11/2026 — Gộp 10 collection theo duyệt của người dùng

Reviewed registry giảm 73 → 63. Giữ ID và lịch sử trong bảng cha; packagingPortions thay chồng, ô dùng chiều cao kho. Cập nhật seed v3, bộ chuyển/kiểm dữ liệu, schema refs tới phần nhúng, sơ đồ và từ điển hiện hành. Migration profile lịch sử/API legacy tách riêng. Không ghi DB nhóm. Kiểm test:db-rebuild, seed preview/local và docs:check; báo cáo ở git_doc/outputs.

Theo quyết định mới, bỏ collection/model `delivery_teams`, tham chiếu `carrierId` và snapshot tên đội. Thêm `vehiclePlate` tùy chọn trực tiếp trong header của từng lần bàn giao; chuyển đổi không đoán biển số từ carrier cũ và tạo cảnh báo khi hồ sơ nguồn có tham chiếu không chuyển được. Bộ seed mới là v2, 73 collection/849 bản ghi; không ghi đè database local v1. Tạo lại SQL-style DB diagram và cập nhật danh mục quyết định, model map, hướng dẫn DB/seed, tài liệu bàn giao và changelog. Các phiếu B08C lịch sử được giữ nhưng đánh dấu đã bị thay thế.

# DB Diagram kiểu SQL theo model hiện hành — 05/11/2026

Tạo [WMSD_SQL_Style_DB_Diagram_2026-11-05.drawio](docs/03_thiet_ke/WMSD_SQL_Style_DB_Diagram_2026-11-05.drawio) theo cách trình bày bảng như SQL/Miro: header tên collection, các trường PK/FK, kiểu dữ liệu, trường bắt buộc/tùy chọn và đường quan hệ crow's-foot. Tab `00` đặt toàn bộ 73 bảng trên một sơ đồ; 10 tab nhóm nghiệp vụ giúp đọc field và quan hệ rõ hơn. Sơ đồ được sinh trực tiếp từ 73 Mongoose model hiện hành để tránh lệch tên collection/ref. Kiểm XML đạt: 11 tab, 146 khung bảng và 502 đường quan hệ FK trực tiếp (gồm tab tổng hợp và các tab nhóm).

# Sơ đồ database chi tiết theo model hiện hành — 05/11/2026

Tạo [WMSD_DB_Diagram_2026-11-05.drawio](docs/03_thiet_ke/WMSD_DB_Diagram_2026-11-05.drawio) từ thiết kế 74 collection đã duyệt. File có 94 tab: chỉ mục, 74 collection, và 19 biến thể dòng hàng nhúng. Header phản ánh database mẫu `wmsd_demo_tile_shop` tại `localhost:27017`, 851 bản ghi seed; không dùng `_db_rebuild`. Nội dung field/ref/index kế thừa thiết kế đang được model hiện hành kiểm thử; D07/D08 và API chưa port vẫn được ghi rõ là điểm mở.

# Đưa model đã duyệt thành model chính và dùng MongoDB Compass localhost — 05/11/2026

Theo yêu cầu người dùng, `src/models/index.js` trở thành entry point của 74 collection đã duyệt qua `registerReviewedModels(connection)`. API chưa chuyển dùng rõ `src/models/legacy/index.js`; không trộn hai profile model trên một Mongoose connection. Giữ `registerMigrationModels` cho công cụ chuyển đổi cũ.

Đã bỏ hoàn toàn collection/guard `_db_rebuild`. Seed và verify chỉ kiểm đúng 74 collection nghiệp vụ, schema/index và quy tắc dữ liệu. Chuyển đích local sang `mongodb://localhost:27017/wmsd_demo_tile_shop`; kiểm tra trực tiếp MongoDB đang chạy standalone, seed đã ghi/đọc lại 74 collection và 851 bản ghi. Seed hỗ trợ standalone, còn API ghi tồn đa collection phải dùng replica set hoặc Atlas khi được port.

Kiểm chứng: `npm run test:db-rebuild` đạt 31/31; `npm run db:local:status` và `npm run db:local:seed` chạy tại localhost:27017. Cập nhật PROJECT_GUIDE, MODEL_MAP, luật agent, hướng dẫn local/seed và model changelog. API/DTO/permission/service chưa được chuyển sang model mới trong đợt này; D07/D08 tiếp tục chờ nghiệp vụ.

# Tổng hợp tài liệu, luật agent và seed cửa hàng — 05/11/2026

Theo yêu cầu người dùng, tập trung phiếu duyệt DB, ERD/Data Dictionary/snapshot, hướng dẫn migration/local, báo cáo chuyển thử và contract API vào git_doc. Manifest nhập tài liệu giữ nguồn/hash, các README module trỏ về bản chính. Tạo PROJECT_GUIDE, MODEL_MAP đủ 74 collection, DOCUMENTATION_RULES; context và README dẫn về đầu mối hiện hành. Các bản context/README trước được lưu theo ngày để tra cứu.

AGENTS.md, CLAUDE.md và GEMINI.md đồng nhất. Agent phải tự cập nhật nội dung tài liệu liên quan trong cùng lượt khi thay model/API/quyền/nghiệp vụ/seed/config, ghi changelog và chạy docs:check. Kiểm này phát hiện lệch ba file luật, liên kết chính, thiếu collection và dấu vết cập nhật; nội dung nghiệp vụ vẫn cần review.

Bổ sung tile-shop.js vào seed reviewed và đổi version thành wmsd-tile-shop-20261105-v1. Bộ gồm 3 kho, 20 sản phẩm, 43 lô, 15 nhân viên, 20 khách, 4 NCC, 2 đội nội bộ. Tồn đầu kỳ có nguồn và lịch sử, thùng nguyên/lẻ theo cùng sản phẩm/lô, kích thước kiện và bố trí chồng. Quy tắc một thùng một sản phẩm/một lô theo xác nhận 05/11; chưa đổi schema collection. Local target là wmsd_demo_tile_shop, bộ v2 giữ riêng. Không ghi DB nhóm.

Kiểm chứng: main đã cập nhật trước code; 32 test DB migration/demo/local config đạt. Seed đã ghi và đọc lại MongoDB local, 74 collection/851 bản ghi nghiệp vụ, 55 số dư, 33 giao dịch/74 dòng biến động. Chạy seed lại trả ALREADY_SEEDED và cùng fingerprint. docs:check đạt, git diff --check sạch, liên kết các phiếu duyệt đã được kiểm. Báo cáo tại outputs/tile_shop_seed_2026-11-05.json. Chưa chuyển các API cũ sang model mới, marker runtimeReady=false; D07/D08 tiếp tục chờ nghiệp vụ.

# Chuyển môi trường thử DB mới về localhost — 03/11/2026

Theo yêu cầu thử trên máy trước DB chung: chạy instance MongoDB riêng tại 127.0.0.1:27018, replica set wmsd-local, dữ liệu dưới .local/mongodb. Giữ dịch vụ 27017 và DB cloud nguyên trạng. Nạp bộ wmsd_demo_v2 tại local; thêm lệnh start/status/stop/seed/verify, cấu hình .env.local và loại dữ liệu máy khỏi Git. Seed remote bị chặn mặc định, cần cờ triển khai rõ ràng.

Kiểm thử trực tiếp bằng model mới trên DB local tạm: populate, commit/rollback transaction, khóa chống trừ lặp, tranh chấp phiên bản tồn, lịch sử append-only và unique hãng/SKU. Cả 7 test đạt; DB tạm được dọn sau kiểm tra. Hướng dẫn tại src/models/rebuild/LOCAL_DEVELOPMENT.md. Chưa chuyển toàn bộ service/API, không đổi URI trong .env nhóm và không commit/push.

# Bộ DB mẫu theo thiết kế đã duyệt — 03/11/2026

Người dùng xác nhận dữ liệu cũ chỉ để test và yêu cầu tạo bộ mới. Đã tạo wmsd_demo_v2 gồm 74 collection nghiệp vụ, 511 bản ghi; tách biệt sep490 và bản chuyển thử ngày 02/11. Bổ sung model hỗ trợ theo phiếu đã duyệt, kịch bản chuyển kho/nhập/xuất/bán/trả/kiểm kê, đơn vị và quy đổi trên dòng, giá mẫu, sức chứa, vai trò tùy chỉnh, ảnh bằng chứng giả lập. Hướng dẫn xem DB và danh mục collection tại E:/Doan/outputs/db_rebuild/HUONG_DAN_DB_MOI.md; mô tả cách chạy và giới hạn tại src/models/rebuild/README.md.

Kiểm chứng: 27 test migration/demo đạt; đọc lại MongoDB đối chiếu liên kết, chuỗi tăng giảm tồn, số lượng điều chuyển, sức chứa và hóa đơn. Chạy lại không tạo thêm dữ liệu. Full suite còn lỗi có sẵn do thiếu dependency replenishment và fixture cũ thiếu INTERNAL_TRANSFER_REQUIREMENT. Chưa chuyển API sang schema mới, không đổi .env, không commit/push; D07/D08 tiếp tục chờ nghiệp vụ.

# Chuyển thử DB và model — 02/11/2026

Bổ sung hướng dẫn tại src/models/rebuild/README.md về model đích, lệnh chuyển và kiểm tra dữ liệu, tên DB sao lưu, dữ liệu cần bổ sung và phạm vi chưa chuyển ở API. Bản chuyển thử sep490_rebuild_20261102 đã được đối chiếu với nguồn. Các phiếu duyệt thiết kế tiếp tục là căn cứ nghiệp vụ.

# PO draft edit and confirmation UI — 05/11/2026

Added Accountant-only draft edit and confirmation actions to PO detail. The editor changes supplier, expected date and entered quantities while preserving line IDs and saved RR/approval references. Existing PUT and POST /confirm commands retain permission, assigned-warehouse, version and idempotency checks. The PO detail reader adds scoped draftEdit source data. Success refreshes purchase/replenishment queries; errors preserve input, and uncertain outcomes retry the exact request. Confirmation opens Warehouse receiving without posting stock.

Verification: 16 focused FE tests and 33 BE integration tests passed; BE used an isolated MongoDB replica set. Typecheck, production build and targeted ESLint passed. A real browser exercised live edit/confirm and Warehouse receiving availability at desktop/mobile sizes using temporary demo data; no browser runtime errors. Full-repo lint retains 7 existing errors and 2 warnings outside this change. Legacy ui:check/ui:cleanup scripts are absent and host Bash fails. No shared demo database reset, commit or push.

---

# Mở quyền xem chuỗi mua cho Owner và Accountant — 05/11/2026

Owner/Accountant xem PO, kiểm nhận, GR và put-away mua ở mọi kho, gồm chi tiết task, lịch sử và chứng cứ có xác thực. Thêm `putaway_task:read` cho Accountant trong catalogue và permissions.json; chỉ reader dùng scope mua mở rộng, command và phạm vi kho Warehouse giữ nguyên. FE hiển thị workspace put-away cho Accountant trên trang GR; tab PO vẫn hỗ trợ chế độ xem. Cập nhật context FE/BE.

Thêm `npm run seed:purchase-read-permissions` để bổ sung ba quyền đọc vào OWNER/ACCOUNTANT bằng $addToSet, chỉ cập nhật role còn thiếu quyền; không ghi đè quyền khác hoặc seed/reset dữ liệu. Đã áp dụng trên database local sep490, một role được bổ sung. Kiểm tra: 32 bài BE (HTTP/MongoDB trên database thử riêng và seed unit), 17 bài FE (RTL/MSW), typecheck và lint các file FE sửa đều đạt. Kiểm role không có warehouseIds vẫn đọc được; lệnh post/tạo/xác nhận/hủy put-away bị403, Warehouse ngoài kho không đọc task/chứng cứ, Sales/Admin không được đọc. Không kiểm storage live hoặc giao diện bằng trình duyệt; không commit/push.

---

# Giải thích từng hàm và tương tác cơ sở dữ liệu — 05/11/2026

Thêm bộ tài liệu `docs/iteration-1/function-guide-2026-11-05/`: 342 hàm có tên trong sáu nhóm module Iteration 1 và các helper liên quan, mỗi hàm có tham số, mục đích, thứ tự xử lý, nơi gọi/gọi tiếp, query MongoDB nguyên văn, bước ghi qua helper với model/đối số cụ thể, ví dụ và code đối chiếu. Thêm luồng đọc/ghi theo từng bước của tạo/gửi/duyệt yêu cầu, mở PO, confirm/post GR, cất/đảo/chứng cứ; bảng72 route,53 khai báo kiểm tra và các model/collection/header/details liên quan. Lưu inventory/source hashes và cập nhật mục lục.

Đọc lại phạm vi kế toán được mở rộng ở reader mua nhưng không ở command và tab supplier; ghi rõ các giới hạn về xóa dòng nháp có chứng cứ, trạng thái cuối khi chốt thiếu/nhận nốt và các điểm quyền/nhận dạng đã biết. Chạy lại sáu tệp kiểm thử liên quan (gồm hai tệp reader RR sau cập nhật bộ lọc PO): 84/84 đạt, 0 lỗi, 0 bỏ qua, khoảng 14,6 giây trên database thử riêng. Không chạy lại full suite/storage thật/browser/benchmark, không sửa runtime hoặc reset/seed demo, không commit/push.

---

# Sửa logic đăng xuất FE/BE — 03/11/2026

Thêm POST /api/auth/logout để xóa HttpOnly refresh_token và cookie claim_access_token bằng cùng cookie defaults, kể cả khi token thiếu/hết hạn. FE xóa token/profile và tăng session generation ngay khi thoát; chặn refresh/phản hồi cũ khôi phục hoặc ghi đè phiên mới. Logout đi trực tiếp ngoài mutex, không retry401, timeout 5 giây; luôn reset RTK Query cache và thay route bằng /login khi thành công, lỗi mạng/API hoặc timeout. Nút thoát khóa trong lúc xử lý, nội dung bảo vệ được ẩn. Login thành công cũng bắt đầu generation mới.

Cập nhật context FE/BE và sửa comment authToken về cookie/rotation theo runtime. JWT vẫn stateless; xóa cookie không thu hồi bản sao token ở nơi khác. Thêm test HTTP cookie cleanup, test menu thật/reset cache/navigation và test race refresh/late 401/đăng nhập tài khoản khác. Kiểm tra: 21 test FE liên quan và 7 test BE auth/role đạt; typecheck, lint các file thay đổi và production build FE đạt. UI kiểm bằng RTL/MSW, HTTP BE chạy Express thật không cần DB; chưa kiểm bằng phiên trình duyệt đang mở. Không thay model/database, không commit/push.

---

# Review và giải thích nhận mua v3 — 03/11/2026

Thêm docs/po-receiving-proposal/REVIEW_GIAI_THICH_NHAN_HANG_V3.md: giải thích bằng tiếng Việt các nghiệp vụ đã triển khai, người thực hiện, luồng chứng từ, vai trò/liên kết model, hàm xử lý, bảng lượng trước/sau và ví dụ theo từng tình huống. Có mục riêng cho quyền, phiên bản, gửi lại an toàn, chứng cứ, cất từng phần, sửa sai và đối soát.

Đã đối chiếu source và tái hiện hai vấn đề trên database thử ngẫu nhiên: xóa dòng inspection DRAFT để Evidence.lineId tham chiếu dòng đã mất; chốt thiếu trước đợt nhập cuối làm trạng thái PO thành COMPLETED trong khi đường chốt thiếu chọn CLOSED. Báo cáo ghi rõ ảnh hưởng, hướng sửa, kiểm thử cần bổ sung và các giới hạn đã biết. Chỉ thêm tài liệu/changelog; không sửa code nghiệp vụ, không thay sep490, không chạy lại full suite hoặc upload storage thật trong lượt này. Không commit/push.

---

# Review code hiện tại bằng tiếng Việt, kèm ví dụ nghiệp vụ — 03/11/2026

Thêm `docs/iteration-1/REVIEW_GIAI_THICH_CODE_2026-11-03.md`: đọc lại code cho đủ 23 UC gốc và các phần mua/nhận/cất/sửa sai/chứng cứ đã triển khai; giải thích luồng, hàm, model, phiên bản, lượng, quyền và ví dụ từng nghiệp vụ. Phân biệt luồng hiện tại chỉ nhận lượng đồng ý nhập với custody lịch sử đã bỏ; cập nhật link bản hiện hành trong README Iteration 1.

Chạy lại toàn bộ backend: 189 bài, 187 đạt, 0 lỗi, 2 bỏ qua kiểm storage live. Thêm script kiểm tra review dùng database ngẫu nhiên riêng và kết quả JSON: xác nhận `/suppliers/names` thiếu quyền đọc nghiệp vụ, cùng hành vi lô UNKNOWN được post Receiving nhưng chặn cất vào Storage allocatable. Lưu dấu kiểm source và kết quả kiểm thử để nhận biết code đổi sau review. Không sửa runtime, không reset/seed demo, không commit/push.

---

# BE nhận mua v3 theo plan điều chỉnh — 03/11/2026

Thực hiện yêu cầu chỉ ghi lượng cửa hàng đồng ý nhập: bỏ stock custody của nhận mua, giữ confirm riêng với post. Bổ sung PO từ RR duyệt có guard allowance, amendment/schedule/chốt thiếu có quyết định Owner, DTO summary/trips/queue/history/operation recovery, evidence private có kiểm bytes và cleanup intent, put-away mua partial/split với projection/claim và bảo vệ Receiving relocation, reversal toàn GR do Warehouse thực hiện có chứng cứ/dependency guards, correction cùng chuyến gốc. Không triển khai hàng sai/lỗi/unknown/custody resolution và không đổi UI.

Thêm contract BACKEND_V3.md, báo cáo VERIFICATION_V3.md, benchmark-v3.json; cập nhật IMPLEMENTATION, context BE, model README/changelog và đánh dấu phần plan v2 được thay thế. Kết quả test/reset và manifest ghi trong báo cáo. Không commit/push.

---

# Loại bỏ nhận mua cũ và tạo lại DB local — 03/11/2026

Theo yêu cầu, xóa ARRIVAL khỏi model/catalogue/seed; bỏ traversal PO→ARRIVAL→INSPECTION→GR ở reader PO/NCC, bắt buộc direct PO/PO_INSPECTION/supplier refs cho GR mua. INSPECTION chung chỉ giữ cho CR/FD. Chuyển fixture và regression sang chuỗi mới, có ca từ chối ARRIVAL và GR thiếu nguồn. FE receipt list/detail đọc API thật; xóa các form, hooks, stores và components nhập mua localStorage cũ, thay tests bằng kiểm API/no-fallback.

DB localhost sep490 đã dry-run, backup, drop và seed lại bằng CLI có kiểm target. Manifest: `C:/Users/minhs/.codex/backups/sep490-po-receiving-1793695344564/manifest.ejson`. Hậu kiểm: ARRIVAL0,PO_INSPECTION1,GR mua1 với nguồn đầy đủ,INSPECTION CR/FD2,36 document kinds. Không commit/push. Kết quả test/build cuối ghi trong bàn giao.

Kiểm chứng cuối: backend178 tests/177 pass/0 fail/1 skip; focused receiving/PO/reset23/23 pass sau bổ sung kiểm lineage. Frontend11/11 pass, build và lint receipt/API pass. Các thay đổi UI nhận hàng song song được giữ; sửa các import/type không khớp để build working tree hiện tại.

---

# Triển khai nền tảng nháp và workspace nhận mua — 03/11/2026

PO detail nối API thật cho nhiều đợt nhận, create/update/confirm inspection, chọn lô/split lượng/đích GR, review/post GR và cancel draft. Backend giữ line ID theo clientLineKey, lưu plannedReceiptLocationId, cancel DRAFT không xóa custody, scoped history/operation lookup. Cập nhật contract và context hai repo/model changelog. Các gói custody resolution, purchase put-away, reversal, evidence scoped, PO lifecycle và migration còn chưa hoàn thành; không nhận là đã triển khai toàn plan v2.

Kiểm chứng: full backend177 tests/176 pass/0 fail/1 skip;7 frontend tests PO/workspace pass; build/typecheck và lint runtime frontend thay đổi pass. Database test riêng đã cleanup, không reset demo. Chưa kiểm browser end-to-end, không commit/push.

---

# Bổ sung lượng có thể chấp nhận trong context nhận mua — 03/11/2026

Inspection context trả thêm lượng GR nháp đang cam kết và lượng còn được chấp nhận theo từng dòng PO trên cùng snapshot đọc; trả null khi nguồn không đủ căn cứ. Confirm vẫn kiểm lại trong transaction. Kiểm thử tập trung nhận mua: 9/9 pass trên database test riêng. Đây là một phần của plan v2, chưa triển khai các gói và UI còn lại; không commit/push.

---

# Rà soát giới hạn nhận mua và plan v2 — 03/11/2026

Thêm [báo cáo18 giới hạn](../docs/po-receiving-proposal/gap-analysis-current-2026-11-03.md) và [plan v2](../docs/po-receiving-proposal/ui/design-plan-v2.md), liên kết từ tài liệu UI v1. Rà nguồn BE/FE/PO/supplier/upload/evidence/audit/BF04/relocation; phân biệt quan hệ PO nhiều đợt đã có với thiếu UI, headroom, stable draft/destination, cancel, custody resolution/actual handback, put-away mua partial, correction/reversal, evidence scoped, PO amendment/close/schedule và exception intake. Đề xuất source GR bổ sung, claims theo dòng nguồn, quyền/DTO/API, migration add-only, lộ trình W0–W5 và tiêu chí nghiệm thu; không đổi catalogue hoặc runtime theo các đề xuất này.

Kiểm chứng mới: chạy hai file integration nhận mua/PO ledger trên DB replica set local riêng,18/18 pass,0 fail,0 skip (gồm hai bài cha). Ba probe DB random riêng đạt:40+35+25 trên cùng PO; GR nháp70 chặn ACCEPT40 nhưng context chưa trả headroom; save thay line ID và không lưu đích GR. DB probe đã cleanup, không reset/migrate DB sep490. Chỉ thêm/cập nhật tài liệu và script kiểm tra ngoài Git; không sửa runtime/model/test repo, không commit/push. Liên kết và whitespace kiểm riêng trước bàn giao.

---

# Kế hoạch UI nhận mua theo PO — 03/11/2026

Thêm [kế hoạch UI](../docs/po-receiving-proposal/ui/design-plan.md), [luồng người dùng](../docs/po-receiving-proposal/ui/user-flow.md) và [wireframe](../docs/po-receiving-proposal/ui/wireframe-ascii.md). Đề xuất PO detail làm màn trung tâm, mỗi đợt có stepper Tiếp nhận → Kiểm hàng & lô → Ghi nhận GR → Xếp kho. Đối chiếu contract PO_INSPECTION hiện tại: custody NCC khi chốt kiểm, tối đa một GR nháp cho toàn bộ ACCEPT, post riêng nhận STORE, lựa chọn đích GR trước confirm và line IDs thay sau cập nhật nháp. Phân biệt PO nhận đủ với xếp kho và custody còn chờ; ghi rõ UI receipt đang dùng demo, giới hạn dữ liệu read/enrichment, cap GR nháp, evidence/audit và put-away chưa tích hợp.

Đây là đề xuất thiết kế theo nội dung tham khảo người dùng gửi, không thay nghiệp vụ/quyền hoặc khẳng định đã triển khai. Kiểm chứng bằng đọc source/routes/contract hiện tại và kiểm liên kết tài liệu; không chạy test ứng dụng vì không sửa runtime. Không sửa dữ liệu, không commit/push.

---

# Review toàn bộ UC Iteration 1 của minhtd — 02/11/2026

Thêm [báo cáo tổng hợp23 UC](../docs/iteration-1/REVIEW_TOAN_BO_UC_2026-11-02.md), đọc lại trực tiếp bản plan chi tiết cuối trong chat `01a18c8f-8d7c-7032-965b-95a746e96ae6`, đối chiếu working tree hiện tại. Mỗi UC-01–07/17–32 có nghiệp vụ/actor/API/input, chuỗi function và các bước xử lý, model đọc/ghi, ví dụ, lỗi và test references. Giải thích quyền, decimal/version/snapshot/idempotency, sơ đồ quan hệ model, luồng RR và PO_INSPECTION/custody/GR ảnh hưởng UC-07/29; ghi rõ extension không thay danh sách phân công23 UC và RV-01–04 đã sửa. Bổ sung giới hạn UI/performance/transit/lot race/reversal thay vì coi pass test là nghiệm thu toàn hệ thống.

Kiểm chứng tài liệu: kiểm đủ23 mã UC không trùng/thiếu, liên kết source và git diff --check. Kết quả172 tests/171 pass/1 skip được dẫn từ lượt triển khai trước cùng ngày, không nhận là full-suite chạy lại. Chỉ viết tài liệu/index/changelog; không sửa runtime/model/test, không reset hoặc ghi DB, không commit/push.

---

# Triển khai backend PO_INSPECTION, custody và GR — 02/11/2026

Theo các lựa chọn đã chốt, triển khai model/command kiểm hàng theo chuyến, intake giữ hộ toàn bộ phần keptOnSite thuộc NCC, một GR draft cho phần ACCEPT và post GR riêng chuyển custody sang STORE receiving/quarantine. Thêm API context/list/detail/create/update/confirm/handling-note/post, source PO/inspection/supplier và thông tin người giao; transaction, PO/location CAS guards, freeze, scope, idempotent receipt/batch IDs và audit. Không thêm FE UI, put-away hay command xử lý/return hàng chưa chấp nhận.

Sửa reader PO/NCC cho nguồn mới và xác thực legacy; sửa direction/product/batch RV-01/02, scope replay RR RV-03, typed source traversal RV-04. Thêm test luồng ownership, accepted0, rollback, race confirm/post, sửa draft/note, quyền/freeze và regression bốn finding. Seed dùng flow mua mới; CLI migrate:po-receiving mặc định dry-run, chỉ reset localhost/sep490 khi đủ flags và backup đã hoàn tất. Đã backup và tạo lại DB demo sep490 theo lựa chọn người dùng; manifest ngoài Git tại `C:/Users/minhs/.codex/backups/sep490-po-receiving-1793619545404/manifest.ejson`.

Contract, quyết định và kế hoạch thực hiện: [IMPLEMENTATION.md](../docs/po-receiving-proposal/IMPLEMENTATION.md). Cập nhật context BE/FE và model changelog. Main đã merge không commit, giữ thay đổi có sẵn; không commit/push. Kết quả kiểm thử cuối được ghi trong tài liệu implementation và bàn giao chat.

---

# Đánh giá đề xuất gộp nhận hàng PO_INSPECTION — 02/11/2026

Thêm [gap analysis](../docs/po-receiving-proposal/gap-analysis.md) cho ý tưởng gộp ARRIVAL/INSPECTION trong nhánh mua hàng, GR tham chiếu trực tiếp PO và ghi người giao. Đánh giá nhận nhiều đợt, actual/accepted/rejected/pending, lot/quality/ownership, note xử lý lỗi, nguồn inspection cho GR, supplier từ PO, concurrency/retry và ảnh hưởng CR/FD/legacy. Đề xuất giới hạn thay đổi trong flow PO; đây là tài liệu đánh giá, chưa chấp thuận thay baseline hoặc triển khai.

Kiểm chứng: đọc context và model/seed/readers liên quan, kiểm liên kết và git diff --check. Không sửa runtime/model/test, không migration hoặc thao tác DB, không commit/push.

---

# Giải thích chi tiết nghiệp vụ và luồng code của các finding — 01/11/2026

Thêm [báo cáo giải thích bốn vấn đề](../docs/iteration-1/BAO_CAO_GIAI_THICH_VAN_DE_2026-11-01.md): nghiệp vụ đúng, vai trò model, chuỗi gọi function và vị trí source, ví dụ tính từng bước, nguyên nhân RV-01/02/03/04, phạm vi tác động thực tế, hướng sửa và regression cases. Làm rõ dữ liệu bất thường trong probe khác dữ liệu thật, GET sai kết quả khác post sai tồn, quyền record khác idempotency; giải thích nguy cơ đảo dấu reversal hai lần khi sửa và yêu cầu kiểm scope cả replay fallback. Bổ sung liên kết trong README iteration, giữ nguyên review và bằng chứng lịch sử.

Kiểm chứng: đối chiếu checkout HEAD `2e31d79`, chạy lại sáu probe trên database localhost random và nhận lại kết quả cũ; kiểm liên kết source và git diff --check. Số157 pass/1 skip là kết quả full suite của lượt review trước, không phải full suite mới trong lượt viết giải thích này. Không sửa logic/model/API ứng dụng, không apply migration vào DB dùng chung, không commit/push.

---

# Review backend Iteration 1 và giải thích module — 31/10/2026

Thêm [báo cáo review](../docs/iteration-1/REVIEW_2026-10-31.md) đối chiếu bản plan chi tiết trong chat `01a18c8f-8d7c-7032-965b-95a746e96ae6` với checkout `2e31d79`: đủ 23 UC có endpoint/service; giải thích kiến trúc, logic/flow/function, transaction/retry/version và quan hệ model của replenishments, products, lots, suppliers, purchase-orders. Ghi bốn phát hiện P2 đã tái hiện: PO tính dương movement sai chiều; PO thiếu kiểm lot-product/batch-document; replay tạo RR bỏ qua scope kho hiện tại; supplier GR traversal chấp nhận nguồn thiếu ARRIVAL/INSPECTION. Kèm JSON bằng chứng và script probe chỉ dùng DB localhost random, cập nhật liên kết tại README iteration.

Kiểm chứng mới: `npm test` 90 test/75 pass/15 skip; replica set cục bộ 158 test/157 pass/1 skip Cloudinary; sáu probe gồm một control và năm ca xác nhận bốn phát hiện. Các DB test riêng được dọn sau chạy. Không sửa logic/model ứng dụng, không apply migration vào DB dùng chung, không commit/push. Báo cáo cũng ghi các ca race/rollback/reversal còn thiếu và giới hạn hiệu năng chưa benchmark.

---

# Triển khai backend Iteration 1 — 30/10/2026

Triển khai backend UC-01–UC-07 và UC-17–UC-32 trên nhánh `codex/uc-01-32-iteration-1`; frontend chưa nối. Thêm API RR thủ công (tạo nháp/gửi trực tiếp, sửa, gửi, Owner duyệt lượng từng dòng), snapshot bất biến theo version, lịch sử submission; PO list đọc lượng nhận từ chuỗi PO→ARRIVAL→INSPECTION→GR→ledger/reversal; product/master, conversion, policy, lot, supplier và history/documents. Bổ sung model/version/audit/submission và migration mặc định dry-run.

Tài liệu mới: [đặc tả Iteration 1](docs/iteration-1/README.md), [API reference](docs/api/iteration-1/README.md), [use-case cards](docs/iteration-1/use-cases.md), [migration guide](docs/iteration-1/MIGRATION.md), [verification](docs/iteration-1/VERIFICATION.md). Cập nhật context BE/FE, model README/changelog và ánh xạ UC trong permission metadata; giữ nguyên permission keys runtime. Số collection MongoDB tăng 39→40 do `replenishment_submissions`.

Kiểm chứng: `npm test` (90 test, 75 pass, 15 skip khi không có DB); với MongoDB replica set cục bộ (DB random) 158 test, 157 pass, 1 skip Cloudinary live. Không chạy frontend/browser, không apply migration lên DB dùng chung, không commit/push thay đổi implementation.

---

# Bỏ nhóm UC-107 cũ khỏi catalogue — 30/10/2026

Theo yêu cầu người dùng, bỏ ba mục UC độc lập Verify Supplier Return Agreement, Record Supplier Receipt Acknowledgement và Reconcile Supplier Return Variance (mã trước lượt này UC-122/123/124, tách từ UC-107 cũ). Không khôi phục dòng UC-107 gộp. Catalogue còn 130 UC, mã liên tục UC-01–UC-130; chín mã cuối được dịch xuống ba số. Đồng bộ catalogue/quyền/spec/actor/screen/BR/BF, phụ lục thiết kế, VI/EN, context và crosswalk. Không loại bỏ bằng chứng/thỏa thuận/ACK hay kiểm soát đang có trong luồng trả NCC, không cấp thêm quyền.

Mapping WBS còn 96 nguồn active với 20 nhóm tách thành 54 UC, thêm 34 dòng, tổng 130. Nếu kế thừa kế hoạch và bỏ dòng UC-107 nguồn effort 1: iteration 74/49/7 UC, effort 29.75/32.5/7.75, tổng 70; đây là hướng dẫn cho Gemini, chưa sửa sheet. Cập nhật prompt tự chứa, không sửa runtime/database/cloud hoặc file lịch sử, không commit/push.

---

# Loại UC ngoài phạm vi và đánh lại mã — 30/10/2026

Theo yêu cầu người dùng, xóa 14 UC retired khỏi catalogue, ma trận quyền, đặc tả Report 3, phụ lục thiết kế và context BE/FE. Đánh lại 133 UC active liên tục UC-01–UC-133 theo thứ tự catalogue sau tách. Đồng bộ tham chiếu đầy đủ, shorthand/range, actor, BF/BR/SC, Report 1/2/3, quy trình VI/EN, thiết kế hệ thống/dữ liệu và đề xuất replenishment đang dùng. Bảng đối chiếu mã đầy đủ: docs/07_ra_soat/UC_RENUMBER_2026-10-30.md; crosswalk phân rã đã ghi rõ cột mã cũ và mã hiện hành.

Kiểm chứng: 133 mã duy nhất ở catalogue/quyền/spec/phụ lục, tên tương ứng đúng mapping; đủ dãy UC-01–UC-133, không còn mục UC RETIRED; bảo toàn nội dung nhật ký phiên bản. Tài liệu rà soát và sơ đồ lịch sử giữ nguyên mã tại thời điểm ghi nhận, đối chiếu qua mapping mới. Không sửa runtime, permission strings, dữ liệu, spreadsheet/cloud, Word hoặc draw.io; không commit/push.

---

# Áp dụng phân rã UC — 30/10/2026

Áp dụng P1/P2 đã chấp thuận: 21 UC thành 57 mục tiêu, tăng ròng 36; 147 mã = 133 active + 14 retired. Giữ mã cha cho mục tiêu kế thừa, thêm UC-112–147. Cập nhật SRS catalogue/quyền/actor/spec/screen, quy trình VI/EN, thiết kế/dữ liệu, Report 1/2, README và context BE/FE. Crosswalk/impact/QA tại docs/07_ra_soat/CR-2026-10-30-UC-SPLIT.md. Giữ nguyên effort/ngày và dòng WBS cũ ở cấp nhóm, không nhân estimate hoặc tuyên bố hoàn thành UC con. Không sửa runtime, spreadsheet, Word/cloud hoặc draw.io lịch sử; không commit/push.

---

# Chuyển ví dụ model sang tình huống thực tế — 29/10/2026

Theo điều chỉnh của người dùng, sửa [MO_TA_DATABASE_MODELS.md](../MO_TA_DATABASE_MODELS.md): thay toàn bộ 39 ví dụ JSON bằng tình huống vận hành cửa hàng gạch, có nhân vật, hàng hóa, số lượng và giải thích model ghi nhận điều gì. Đổi quy ước ví dụ và sơ đồ dạng khối sang diễn giải/bảng dễ đọc; bỏ các minh họa gọi hàm, tạo object và định danh giả. Giữ mô tả trường/quan hệ/ràng buộc và các luồng nghiệp vụ để đối chiếu source.

Kiểm chứng: đủ 39 mục model và mỗi mục có ví dụ thực tế; không còn khối mã hoặc ví dụ JSON; kiểm bảng, liên kết nội bộ và git diff --check. Đây là sửa tài liệu, không chạy kiểm thử ứng dụng hoặc thao tác database. Bảo toàn thay đổi có sẵn; không stage, commit hoặc push.

---

# Giải thích model database tại root backend — 29/10/2026

Thêm [MO_TA_DATABASE_MODELS.md](../MO_TA_DATABASE_MODELS.md) tại root `be`, giải thích đủ 39 model/collection MongoDB, 35 loại chứng từ và 19 loại dòng chứng từ theo source hiện tại. Mỗi model có mục đích, trường chính, quan hệ/ràng buộc đáng chú ý và ví dụ JSON; có các tình huống nhập mua, PGI/POD/PAY-CFM, FD mở lại nhu cầu, CR, điều chuyển, kiểm kê B1, trả NCC và thông báo/bổ sung hàng. Làm rõ discriminator dùng chung collection, decimal/snapshot/version, reservation/allocation/claim/hold và giới hạn schema so với service/transaction/API.

Kiểm chứng: đối chiếu model/collection/discriminator từ registry Mongoose không kết nối database; parse và validate cục bộ các ví dụ JSON sau thay alias ID bằng ObjectId minh họa; kiểm liên kết và git diff --check. Không thay model/code ứng dụng, không chạy server/seed/migration hoặc ghi database. Bảo toàn các thay đổi có sẵn; không stage, commit hoặc push.

---

# Rà soát và đề xuất tách Use Case — 29/10/2026

Thêm [báo cáo đề xuất tách UC](docs/07_ra_soat/De_xuat_tach_Use_Case_2026-10-29.md), dựa trên catalogue/quyền/đặc tả Report 3 trong workspace và baseline 3.3.0. Phân loại đủ 111 mã: 11 UC ưu tiên tách, 10 UC chuẩn hóa tiếp, 7 UC cân nhắc theo cách vận hành, 69 ACTIVE giữ cấu trúc và 14 RETIRED giữ lịch sử. Chi tiết UC-13 thành 5 mục tiêu sản phẩm/trạng thái/quy đổi/policy minimum-target; UC-19 thành tạo/sửa của Accountant và thay trạng thái của Owner. Các nhóm khác có actor, ranh giới trạng thái/tồn, mapping tạm và số lượng dự kiến.

Đây là đề xuất để review; không thay catalogue, mã UC chính thức, quyền, quy trình, code hoặc bản tài liệu riêng tại SEP490/git_doc. Bảo toàn các thay đổi có sẵn trong workspace và changelog. Kiểm chứng bằng đối chiếu tập mã, số lượng/mapping, liên kết cục bộ và git diff --check; không chạy test ứng dụng cho báo cáo tài liệu. Không stage, commit hoặc push.

---

# Làm rõ tạo yêu cầu bổ sung chủ động — 29/10/2026

Theo yêu cầu người dùng, bổ sung trực tiếp vào các mục hiện có của Report 3 (BF-01, catalogue/đặc tả UC-03, SC-06, BR-03) và quy trình VI/EN: Sales/Warehouse được tạo RR hoàn toàn bằng MANUAL_OTHER từ menu dù không có đơn thiếu, cảnh báo tồn thấp hay kiểm kê. Bắt buộc lý do nghiệp vụ từng dòng, kho/ngày cần và lượng dương; đối chiếu tồn, yêu cầu và nguồn sắp về để tránh mua trùng; không tạo giả refs/snapshot nguồn. Owner khác người đề xuất duyệt, Accountant lập PO sau duyệt; RR không đổi tồn.

Tác động: làm rõ nhánh nhu cầu khác đã được chấp thuận trong đề xuất replenishment 1.4.0; không phát sinh UC/role/schema/API mới. Đồng bộ nội dung này trong cả bản tài liệu src/be/git_doc và SEP490/git_doc, không nâng toàn bộ bản cũ lên baseline 3.3.0. Bản quy trình tăng patch tài liệu; giữ bảng Change Log trong report. Bổ sung hai tình huống nghiệm thu: tạo không có trigger và chặn lý do trống. Rủi ro cần kiểm khi triển khai: không ép nguồn SO/kiểm kê vào MANUAL_OTHER, không mua trùng. Đây là cập nhật tài liệu, không phải xác nhận runtime.

Kiểm chứng: rà soát các mục đã sửa, đối chiếu VI/EN, kiểm cấu trúc bảng/liên kết và git diff --check; không chạy kiểm thử ứng dụng cho thay đổi tài liệu. Không stage, commit hoặc push.

---

# Cập nhật hướng dẫn agent và changelog — 28/10/2026

## 2026-10-29 — Trungph iterations 1–3 application contracts

Implemented and connected UC-63–73, UC-79–83, UC-102, UC-107 and UC-108 through the return-workflow API screens. Added transaction/HTTP verification on an isolated temporary database, frontend permission/error tests, and the shared manual acceptance guide at workspace ALL_ITERATIONS_TEST_GUIDE.md. Runtime contract and optional model additions are documented in src/modules/return-workflows/README.md and src/models/CHANGELOG.md. Existing report/submission copies were not edited.

## 2026-10-30 — Revised BF04 backend main flow

Implemented request/review/outbound/internal requirement/generated TO/dispatch/receipt/putaway/closure commands.
Step 7 confirms dispatch into transit; damage is received in destination QUARANTINE with a linked defect report.
API contract and boundaries are in `src/modules/transfers/BF04_API.md`; additive model changes are logged in `src/models/CHANGELOG.md`.

Updated BE/FE agent contexts with the latest BF04 decisions and API handoff (frontend command screens are not implemented in this change). Tests cover BF03 lifecycle and BF04 posting/receipt/quarantine/putaway, with isolated replica-set databases; schema and read/validation tests also run. Test setup now explicitly creates the relevant collections before indexes, avoiding unrelated full-registry initialization.

## 2026-10-29 — BF03 same-warehouse relocation lifecycle

Added scoped list/form options and creator-only edit, confirm and cancel APIs for
RELOCATE Transfer Orders. Confirmation posts exact source/destination balance
movements and carries reservations in a MongoDB transaction; only the unposted
remainder can be cancelled. The FE location-move routes now use live API data.
Updated the module README and backend context for the implemented lifecycle.

## 2026-10-29 — FE-06 Iteration 1 read API contract

Documented UC-46/49/50 routes, scoped SO/OD source-chain reads, decimal quantities,
FD/replacement and reversal semantics in src/modules/sales-orders/README.md.
UC-47 implements the confirmed single-form source entry, signed evidence receipt,
atomic creation, idempotency and outbox. Added private scoped evidence retrieval,
OD search, stale conversion guards and a Thunder-compatible Postman 2.1 pack with
isolated local demo server. Live Cloudinary smoke test passed private upload,
signed retrieval, denied unsigned retrieval and test-asset cleanup.
FE Warehouse Staff read screens now consume UC-46/49/50; FE UC-47 create form and
shortage evaluation/notification consumer remain separate.
Final verification: 4/4 FE06 acceptance tests passed without skips; 63 non-DB
regression tests passed (10 integration/live skips); 1/1 live Cloudinary smoke
passed; 23 collection HTTP checks passed against isolated local demo data.

## 2026-10-29 — FE-05 Iteration 1 backend reads

Added UC-38/39 API contract in src/modules/transfers/README.md: pagination, scope,
posted-document progress, transit balances and read-only detail. Documented the
confirmed Sales access to overall related-TR progress (including mixed-demand
TRs), while hiding internal documents/notes, and separate write workflows.

Chuyển hướng dẫn FE/BE sang tiếng Anh; bổ sung quy tắc pull main trước khi sửa code, đề nghị người dùng push sau khi hoàn thành feature và ghi thay đổi tài liệu vào changelog này. Tạo changelog riêng cho các thay đổi model về sau. Không tự commit hoặc push.

---

# Phân quyền mỗi user một role — 28/10/2026

Theo quyết định người dùng, User.roleId là ObjectId đơn bắt buộc; bỏ roleIds, giữ warehouseIds và năm role. SQL tham chiếu chuyển user_role sang app_user.role_code NOT NULL FK: 84 bảng/2 view; Mongo vẫn 39 collections. BE auth/middleware/users/roles/replenishment/seed đồng bộ; DTO lowercase role và alias roles=[role], primaryRole=role phục vụ FE chưa sửa. Runtime không gộp quyền, không fallback ADMIN và lọc quyền theo role catalogue.

Chuẩn bị migrate:single-role mặc định dry-run; user nhiều/thiếu/sai/mâu thuẫn role cần ánh xạ userId→roleCode; preflight toàn bộ, backup users/roles, transaction chuyển dữ liệu và index roleId không unique. Không tự chạy migration trên database đang dùng. Đồng bộ quy trình VI/EN, report đúng mục có sẵn, thiết kế, context, Mermaid/ERD hiện hành; giữ draw.io lịch sử, khảo sát và biên bản. Bảo toàn thay đổi có sẵn, không stage/commit.

Kiểm chứng: SQL ScriptDom TSql160Parser 0 lỗi, 6 batch, 84 bảng/2 view; không chạy DDL trên SQL Server. Toàn bộ 99 test đạt trên MongoDB replica set tạm, không skip; gồm HTTP tạo/đổi role, login/refresh/me bằng token cũ, scope replenishment, seed, migration/rollback. Kiểm chứng thêm CLI thật trên DB tạm: mặc định read-only, mapping, EJSON backup, transaction/index và apply lần hai cập nhật 0 user. Parse 31 Mermaid và dựng lại ERD HTML; đã xem ảnh Role 1–N User và User.Role đơn. git diff --check đạt. Các kết quả này không áp dụng cho database đang dùng hoặc DDL thực thi trên SQL Server.

---

# Đồng bộ form tạo RR và Notification — 27/10/2026

Baseline hiện hành 3.3.0 theo đề xuất1.4.0 được chấp thuận. Đã cập nhật model/seed/DTO/tài liệu/context cho một form điền sẵn, lựa chọn dòng và thêm sản phẩm, hỏi sau lưu SO còn thiếu, giữ form khi dữ liệu đổi, lưu nháp/gửi duyệt và source từng dòng. Không có phân loại cách tạo. API/consumer/UI vẫn cần triển khai; chưa thay database người dùng hoặc commit. Chi tiết [báo cáo đồng bộ](docs/07_ra_soat/CR-2026-10-27-REPLENISHMENT.md).

---

# Cập nhật Mermaid và bản xuất liên quan, chỉ loại trừ draw.io — 25/10/2026

Theo yêu cầu bổ sung, phạm vi loại trừ chỉ còn **file draw.io**. Các mục nhật ký cũ về “giữ nguyên diagrams/Mermaid” bên dưới phản ánh lượt trước, không mô tả trạng thái hiện tại. Chi tiết tại [hậu kiểm mục 6](docs/07_ra_soat/Ket_qua_dong_bo_tai_lieu_2026-10-25.md#6-bổ-sung-mermaid--chỉ-loại-trừ-file-drawio).

- Hai quy trình lên bản tài liệu 3.1.2, baseline nghiệp vụ giữ 3.1.0: cập nhật 18 Mermaid context/BF. BF-06/07 tách kết quả sau PGI khỏi POD trước nhánh FD; GR-FD/claim/tái mở nguồn cùng commit. BF-02/05 làm rõ freeze/hold, recount, thực hiện B1 và lỗi/unknown commit. BF-04 theo dõi toàn TR, put-away phần nhận hợp lệ; BF-08 không Owner, tài chính riêng.
- Database VI/EN và Report 3 dùng cùng ba ERD Mermaid hiện hành cho A1, B1, C2/BF-08; có các khóa/trường quan trọng, không vẽ đủ 82 bảng DDL. Context Report 3 và file `.mermaid` đồng bộ cùng bản EN trong quy trình.
- Đồng bộ generator/Mermaid/Markdown/README/HTML của gói ERD rút gọn; giữ 14 thực thể/32 quan hệ, thêm nhóm thuộc tính claim/quyết định/tái mở/OD transfer và B1 hold/execution/closure. Dựng lại PNG BF-04 VI/EN từ Mermaid, có nhãn baseline/ngày; không lấy draw.io cũ làm nguồn.
- Mermaid 12.2.0 parse/render thành công 31 nguồn hiện hành, 22 graph khác nhau. Tám khối Mermaid lịch sử parse được và giữ nguyên. Đã xem render đại diện; kiểm cấu trúc VI–EN và đồng bộ các bản nguồn/bản xuất.
- SHA-256 xác nhận sáu file draw.io không thay đổi. Giữ Mermaid/PNG lịch sử và nguồn khảo sát/biên bản/PDF; không sửa DDL/backend trong lượt bổ sung. README, phạm vi ở Report 1/2/3, thiết kế và báo cáo hậu kiểm phản ánh yêu cầu mới. Không stage/commit.

---

# Đồng bộ tài liệu theo quy trình 3.1.0, loại trừ diagrams — 25/10/2026

## 1. Phạm vi và chuẩn hiện hành

Theo yêu cầu rà soát toàn repo dựa trên hai bản quy trình vừa cập nhật, đã đồng bộ tài liệu hiện hành với quyết định A1/B1/C2 và BF-08 không Owner approval. Baseline nghiệp vụ giữ **3.1.0 ngày 24/10**; hai bản quy trình lên patch tài liệu **3.1.1** để sửa trạng thái phát hành/khuyến nghị còn sót và làm rõ trần nguồn trong nghiệm thu, không đổi các quyết định đã chốt. Chi tiết tại [hậu kiểm 25/10](docs/07_ra_soat/Ket_qua_dong_bo_tai_lieu_2026-10-25.md).

Kiểm kê trước sửa: 47 file; 30 file ngoài sơ đồ và 17 file diagrams/gói ERD. Sửa 15 file có sẵn và thêm một báo cáo hậu kiểm. Các mục nhật ký từ 24/10 trở về trước dưới đây là lịch sử theo đúng mốc ghi nhận, gồm cả tuyên bố “Report 2 giữ nguyên/chưa đồng bộ” ở lượt cũ.

## 2. Nội dung đã cập nhật

- Report 1/2/3, thiết kế hệ thống, database VI/EN, SQL tham chiếu, README và trạng thái hai quy trình cùng baseline: 8 BF, 5 role, 111 UC với **97 active/14 retired**, BR-01–33, SC-01–31 với 28 active/3 retired. UC-106 giữ ID/lịch sử, không quyền thực thi/association/action/route mới.
- A1: Warehouse nhận FD theo GI-S chưa POD và bằng chứng, không D6/Owner/POD giả/custody khách; GR-FD thực về và tái mở đúng SO/WIR/OD gốc ròng cùng commit. POD/FD/CR chia trần dòng nguồn; consume claim không cộng trùng receipt, OD thay thế chuyển cam kết có version, đảo kiểm downstream. GR-CR thông thường không tự tái mở nhu cầu.
- B1: giữ FROZEN/snapshot, hold/evidence không đổi balance được ghi ngay. Cho phép giải trình trực tiếp hoặc recount; Warehouse lập/xác nhận thực hiện phương án, Owner UC-92/93 duyệt/post delta thực tế và RECLASS/vị trí cùng batch trước mở khóa. Quality-only không ADJ=0; không thiếu/hủy hai lần một lượng lỗi.
- C2: Sales STANDARD_ACCEPTANCE CR thông thường sau Warehouse kiểm, có thể cùng creator; Owner EXCEPTION_APPROVAL chỉ ngoại lệ đủ điều kiện và khác người đề xuất. Không vượt điều cấm D6/UNKNOWN. BF-08 bỏ Owner duyệt xuất/sai lệch/đóng; Accountant UC-107/83 xác minh/đối chiếu/đóng, Warehouse thực xuất, tài chính Invoice/Credit Note độc lập.
- TD/GI-S nháp trước picking; TO xác nhận thực hiện, post tại bàn giao. TR chỉ đóng khi hết phần cần thực hiện/transit/sai lệch/TO. SRS đồng bộ cả catalogue, quyền, associations, đặc tả và hợp đồng màn hình, không chỉ thêm ghi chú tổng quát.
- DDL tham chiếu 3.1.0: 82 bảng, 215 FK, 2 view; thêm 9 bảng cho FD/claim/tái mở/OD transfer và B1 hold/resolution; thêm `reference_date`, ngoại lệ CHECK C2 và thông tin xác minh thỏa thuận SR thay Owner authorization. Thiết kế giữ MongoDB runtime, mở rộng **R-01–26/T01–T56**.
- Report 2 cập nhật phạm vi, rủi ro/ưu tiên kiểm thử/đào tạo; giữ số liệu effort/capacity/lịch gốc, chưa tái ước lượng OBS-01. Đề xuất bảy quy trình và ba báo cáo rà soát lịch sử chỉ sửa banner/chỉ mục; thân nội dung cũ được bảo toàn.

## 3. Hậu kiểm và phần giữ nguyên

Đã kiểm đối chiếu dãy mã, tên/trạng thái/quyền và screens/specs/appendix, BR/R/T VI–EN, 40 mã nhánh A/E/FD; cấu trúc bảng/fence/Unicode và liên kết nội bộ hiện hành. ScriptDom 180.140.0 / TSql160Parser parse DDL đạt **0 lỗi**, 6 batch; kiểm tĩnh 82 bảng/PK, 215 FK và 2 view. `git diff --check` đạt. Kết quả chi tiết nằm trong báo cáo hậu kiểm; các case nghiệm thu không phải backend tests đã chạy.

SHA-256 xác nhận 17 file sơ đồ/gói ERD, 13 file nguồn (CSV, sáu biên bản, năm PDF, link tham khảo) và file đánh giá database 23/10 chưa tracked giữ nguyên. Các khối Mermaid nhúng và thân snapshot lịch sử không đổi. Không sửa hai file chưa tracked từ đầu, không sửa `debug.log`. Không render/xuất lại hình, sửa Word/Google Docs ngoài repo hoặc chạy SQL Server/MongoDB/backend. Script/bản chụp QA và parser đặt ngoài repo. Không stage/commit.

---

# Cập nhật quy trình theo góp ý GVHD — 24/10/2026 — phiên bản 3.1.0

## 1. Phạm vi và căn cứ

Cập nhật trực tiếp hai bản [quy trình VI](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md) và [quy trình EN](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md) lên 3.1.0, theo [báo cáo rà soát 24/10](docs/07_ra_soat/Bao_cao_ra_soat_quy_trinh_theo_gop_y_GVHD_2026-10-24.md), biên bản góp ý và note draw.io được cung cấp. Ưu tiên biên bản Markdown, sau đó note; không lấy đường nối cũ chưa sửa làm chuẩn cao hơn nhận xét.

Người dùng chốt A1, B1, C2 và bỏ toàn bộ Owner approval trong BF-08. Không dùng AGY, không stage/commit. Lượt bổ sung nhật ký này chỉ sửa change_logs.md; hai bản quy trình giữ nguyên kết quả đã sửa ở lượt trước. Các mục 22/10 trở về trước dưới đường phân cách là lịch sử theo phiên bản tại thời điểm đó, không phải xác nhận toàn bộ tài liệu đã đồng bộ 3.1.0.

## 2. Thay đổi đã ghi nhận

- **BF-01/BF-03:** tách hàng chấp nhận, custody và từ chối trên Mermaid; hàng từ chối không đi qua put-away như tồn sở hữu. Làm rõ tạo/xác nhận TO và tên activity thể hiện thao tác trên phần mềm.
- **BF-04/BF-06:** tạo TD/GI-S nháp trước Picking; xác nhận thực hiện TO khi áp dụng, chỉ post khi thực bàn giao. Nháp không đổi tồn. BF-04 có vòng lặp nhận/xuất nhiều đợt và chỉ đóng TR khi hết nhu cầu, transit, sai lệch và nhiệm vụ liên quan.
- **BF-05:** có hai hướng khi chênh lệch: đủ căn cứ thì giải trình/lập phương án trực tiếp; chưa rõ hoặc chọn đếm lại thì Start Recount → Enter Recount → so sánh lại. Không bắt mọi chênh lệch phải recount.
- **A1 — BF-07-FD:** nhánh riêng nhận hàng giao thất bại theo GI-S đã post và chứng cứ, không áp D6 của khách trả sau nhận, không cần POD giả, Owner approval hoặc custody thuộc khách. Warehouse post GR-FD theo lượng thực về/quality; cùng commit tái mở đúng nhu cầu ròng trên SO/WIR/OD gốc để Sales chọn chờ/giao lại/hủy phần đã nhận về. Kiểm chung trần POD/FD/CR, chuyển claim thành receipt không tính hai lần, giữ nguyên ledger xuất/nhận và kiểm nghiệp vụ phụ thuộc khi đảo.
- **B1 — kiểm kê có hàng lỗi:** ghi defect hold/evidence ngay, không thay balance bằng giao dịch thường dưới khóa. Warehouse lập và xác nhận thực hiện phương án; Owner UC-92 duyệt, UC-93 post batch delta thực tế và RECLASS/vị trí có kiểm soát trước mở khóa. Quality-only không ADJ=0; đếm đủ 50 gồm 48 đạt + 2 vỡ không bị ghi thiếu 2 rồi hủy thêm 2.
- **C2 — BF-07 trả thông thường:** Sales chấp nhận/từ chối sau Warehouse kiểm và có thể là người lập CR. Owner chỉ duyệt ngoại lệ đủ điều kiện, không vượt điều cấm D6; chưa rõ thời hạn/điều kiện vẫn chờ. Warehouse post GR-CR theo quyết định đúng loại/phiên bản; CR thông thường không tự mở lại nhu cầu bán.
- **BF-08:** bỏ Owner duyệt xuất, xử lý sai lệch và đóng; Accountant xác minh thỏa thuận NCC, đối chiếu và đóng phần kho qua UC-83; Warehouse post xuất/nhận thực tế. Không đặt quyết định BF-02 lịch sử làm điều kiện xuất trả. Hủy/đổi phẩm cấp/giải phóng hàng lỗi còn tại kho vẫn theo quyền BF-02 hoặc batch B1. Bổ sung tham chiếu Invoice/Credit Note ngoài WMS; trạng thái tài chính độc lập phần kho.
- **UC và phân quyền:** UC-106 retired, giữ ID/lịch sử và năm role; catalogue vẫn 111 ID, nay 97 active/14 retired. Retired: UC-23–25, UC-42, UC-59–62, UC-74–78, UC-106. Đồng bộ UC mapping, permissions, BR-01–33, chứng từ/trạng thái, mainflow/Mermaid và tiêu chí nghiệm thu trong hai bản quy trình.
- **Mục 17:** lưu cả phương án A1/A2/A3 và B1/B2/B3, ưu/nhược điểm, lựa chọn đã chốt, quyền C2/BF-08 và tác động triển khai. Báo cáo rà soát giữ là snapshot phát hiện trước sửa.

## 3. Kiểm tra và giới hạn

- Ở lượt sửa quy trình: mỗi bản có 34 bảng, 9 khối Mermaid (context + tám BF), 15 liên kết tệp nội bộ được kiểm tra; không có liên kết lỗi được phát hiện. Cấu trúc nhánh/nút và đường nối Mermaid VI/EN khớp; thứ tự 17 mục và mã UC trong phạm vi catalogue hợp lệ.
- Đây là kiểm tra cấu trúc tài liệu và đối chiếu nội dung; chưa render lại Mermaid/draw.io hoặc kiểm thử backend, MongoDB, SQL, API hay transaction. Các tình huống nghiệm thu là yêu cầu đề xuất, không phải test phần mềm đã chạy.
- Lượt bổ sung change log: đối chiếu nội dung với hai bản 3.1.0, kiểm liên kết mới, bảo toàn nguyên phần nhật ký cũ và nội dung hai bản quy trình; git diff --check đạt. Không stage/commit.

## 4. Phần còn cần đồng bộ

Report 1/3, thiết kế dữ liệu VI/EN, SQL tham chiếu, thiết kế chi tiết liên quan, bộ draw.io/PNG và Word/Google Docs ngoài repo chưa được cập nhật theo lượt 3.1.0 này. Report 2 giữ nguyên. Các tuyên bố đồng bộ toàn bộ bộ tài liệu ở mục 22/10 chỉ ứng với baseline 3.0.0.

Cần đánh giá/cập nhật CR/FD, decision_kind, liên kết dòng GI/POD/GR-FD và claim, lượng thực hiện ròng/tái mở/OD thay thế, defect hold/RECLASS/batch chốt và quyền UC-71/73/83/92/93; ngừng gọi UC-106. Chưa có schema/API/backend nào được sửa hoặc chạy thử trong lượt này.

---

# Đồng bộ toàn bộ tài liệu hiện hành, giữ Report 2 — 22/10/2026 — baseline 3.0.0

## 1. Phạm vi

Theo yêu cầu sau rà soát, Codex chỉnh sửa trực tiếp, không dùng AGY; không stage/commit. Report 2 được giữ nguyên. Phần dưới đường phân cách là lịch sử các lượt trước; các phát biểu “chưa sửa Report 1/3/hình” trong những lượt đó chỉ đúng tại thời điểm ghi nhận.

Đã xử lý SYNC-01–09 trong [báo cáo trước sửa](docs/07_ra_soat/Bao_cao_dong_bo_tai_lieu_2026-10-22.md); chi tiết và giới hạn tại [kết quả hậu kiểm](docs/07_ra_soat/Ket_qua_dong_bo_tai_lieu_2026-10-22.md). OBS-01 về Report 2 tạm hoãn.

## 2. Thay đổi

- Report 1/3: tám BF; SO UC-45–48, WIR UC-109, Warehouse POD có ảnh UC-110 và Sales PAY-CFM UC-111. Catalogue, actor associations, permissions, đặc tả, BR-01–33, SC-01–31, NFR và lỗi cùng phiên bản. Giữ 111 ID, 98 active/13 retired; 31 screen, 28 active/3 retired.
- Thay thiết kế chi tiết 1.0/16-10 bằng 3.0.0, giữ MongoDB runtime và ranh giới nghiệp vụ hiện hành; truy vết đủ 111 UC, 33 BR, 21 R, 40 T. Không khôi phục giá bán, hóa đơn/hoàn tiền nội bộ, vai trò mới hoặc live MISA.
- Database draw.io: 10 trang, 73 bảng đầy đủ/cột/kiểu/PK, 173 FK và 2 view; thêm các khái niệm SO/POD/PAY-CFM và sửa nguồn WIR/OD/GI theo DDL. Stub FK cục bộ có cặp cột và liên kết trang; SQL giữ nguyên.
- Tạo lại mainflow VI/EN 16 trang, cập nhật EN 8 trang, context và ảnh BF-04 VI/EN. Bản EN riêng có graph giống phần EN của bản song ngữ. Hai workbook cũ gắn nhãn lịch sử trên 24 trang, bảo toàn nội dung/ID và offset nhãn; ảnh BF-03B gốc giữ nguyên.
- Quy trình/database VI/EN: sửa nhận định nguồn/trạng thái cũ, đồng bộ API-02 chưa chốt provider, sửa căn cứ ảnh POD. Liên kết nguồn hiện hành dùng SAP v4.1 trong repo; review1/v4.2 ngoài repo được ghi rõ là nguồn lịch sử chưa đóng gói.
- README: mục lục đủ tài liệu hiện hành/lịch sử, 6 biên bản và CSV. Báo cáo trước sửa được thêm nhãn snapshot; kết quả sau sửa nằm ở tệp hậu kiểm riêng.

## 3. Kiểm tra

41 kiểm tra tự động tài liệu đạt, bao gồm liên kết file; đối chiếu 30 bảng/9 Mermaid blocks quy trình VI–EN, 16 bảng/ERD thiết kế dữ liệu, 37 A/E, 33 BR và đủ R/T. Kiểm độc lập 73 PK và từng tuple của 173 FK với SQL, cùng SHA nguồn; các link trang draw.io không treo.

Validator của ba workbook hiện hành báo 0 lỗi/0 cảnh báo, score 0. draw.io desktop 32.5.5 xuất thử toàn bộ 34 trang; đã xem ảnh tổng hợp và trang trọng điểm, xuất lại hai PNG BF-04 từ workbook hiện hành. `git diff --check` đạt, không stage/commit.

Hash 17 tệp cần bảo toàn khớp trước sửa: Report 2, khảo sát/6 biên bản, 5 PDF/link nguồn, SQL và hai PNG lịch sử. Chưa sửa Word/Google Docs ngoài repo, chưa chạy SQL Server/MongoDB/backend; 40 case T là tiêu chí nghiệm thu, không phải báo cáo backend tests. Các tham số thực địa/vận hành chưa xác minh vẫn để mở.

---

# Tách chuyển vị trí và điều chuyển liên kho — 22/10/2026 — phiên bản 3.0.0

## 1. Yêu cầu và phạm vi

Theo yêu cầu mới nhất, tách hai nội dung của BF-03 cũ thành hai quy trình độc lập; Codex sửa trực tiếp, không dùng AGY. Tiếp tục giữ các cập nhật thiết kế dữ liệu và chỉnh câu chữ từ lượt trước. Sáu tệp được cập nhật: hai bản quy trình EN/VI, hai bản thiết kế database EN/VI, SQL tham chiếu và change log. Không stage/commit, không sửa các báo cáo hoặc hình xuất riêng.

## 2. Ánh xạ mã quy trình

| Mã trước khi tách           | Mã hiện tại | Quy trình                                      |
| --------------------------- | ----------- | ---------------------------------------------- |
| BF-01                       | BF-01       | Bổ sung hàng, đặt mua và nhập kho              |
| BF-02                       | BF-02       | Hàng lỗi                                       |
| BF-03A, nhánh chuyển vị trí | BF-03       | Chuyển vị trí trong cùng kho                   |
| BF-03B, nhánh liên kho      | BF-04       | Điều chuyển giữa các kho và xử lý chênh lệch   |
| BF-04                       | BF-05       | Kiểm kê, đối chiếu và điều chỉnh               |
| BF-05                       | BF-06       | Đơn bán, xuất kho, giao hàng và hoàn thành đơn |
| BF-06                       | BF-07       | Khách trả hàng                                 |
| BF-07                       | BF-08       | Trả nhà cung cấp                               |

BF-03 có trigger, bốn bước, kết thúc, chứng từ TO-RELOCATE, ngoại lệ và sơ đồ riêng; Warehouse thực hiện, không Owner duyệt, không tạo TR/TD/MWTR. BF-04 có trigger riêng và chuỗi TR → Owner duyệt → TD/HO → MWTR kiểm nhận độc lập → put-away/xử lý sai lệch. Trường hợp xuất thẳng kho khác chuyển BF-06, không tạo điều chuyển hoặc nhập giả.

Đã cập nhật tham chiếu BF đầy đủ và dạng rút gọn, mã nhánh A/E, tên mục/anchor, bảng chứng từ, UC/rule mapping, checklist đồng bộ báo cáo, trình tự triển khai và chú thích SQL. BF-03-A1 dành cho chuyển hàng đã giữ; thêm BF-03-E1 cho sai kho/khóa/thiếu nguồn. Nhánh xuất thẳng BF-03-A2 cũ trở thành BF-04-A1. Các nhánh sau đánh lại mã theo quy trình mới. Tổng hiện có 37 nhánh A/E; giữ 111 UC (98 active/13 retired), 33 BR, 21 quy tắc thiết kế dữ liệu và 40 tình huống nghiệm thu.

Việc tách mã không đổi định nghĩa bảng/cột/ràng buộc/view: SQL vẫn 73 bảng và 2 view. BF-03 ánh xạ warehouse_task/warehouse_task_line; BF-04 ánh xạ transfer_request/dispatch/receipt. Các dữ liệu SO/POD/PAY-CFM từ lượt trước được giữ nguyên, nay thuộc BF-06.

## 3. Kiểm tra và giới hạn

- EN/VI: đủ và đúng thứ tự BF-01–BF-08 ở cả phần mô tả và sơ đồ; 30 bảng có cấu trúc tương ứng; 9 khối Mermaid cùng quan hệ nối (context + 8 BF). Không còn mã quy trình ghép BF-03A/B trong nội dung hiện hành.
- Mã tham chiếu: khớp 37 nhánh A/E, 33 BR và đủ 111 UC; hai bản database khớp 16 bảng, 21 quy tắc, 40 case và ERD. Không thêm liên kết file lỗi so với bản chụp trước sửa.
- SQL: so sánh sau loại bỏ chú thích xác nhận toàn bộ lệnh thực thi không đổi so với trước khi tách; kiểm cú pháp ScriptDom hiện tại 0 lỗi/6 batch. Kết quả kiểm dữ liệu 21 trường hợp của lượt đồng bộ trước vẫn được ghi riêng phía dưới, không coi đây là chạy backend.
- Giữ nguyên nội dung nhật ký cũ làm phần lịch sử; git diff --check đạt; không stage/commit. Giữ nguyên trạng thái xóa draw.io đã có trước lượt này. Script và bản chụp kiểm tra nằm ngoài repository.

Report 1/3, Word và bộ draw.io/PNG vẫn dùng mã cũ; phải cập nhật theo bảng ánh xạ này khi đồng bộ tiếp. Lịch sử bên dưới giữ các mã BF đúng với thời điểm từng lượt, không tự đổi mã trong nhật ký cũ. Chưa chạy SQL Server hoặc backend MongoDB; Mermaid được đối chiếu cấu trúc, chưa xuất lại bộ hình.

---

# Đồng bộ dữ liệu và rà soát BF-05 — 21/10/2026 — phiên bản 2.0.0

## 1. Yêu cầu và phạm vi

Người dùng yêu cầu sửa thiết kế dữ liệu theo quy trình hiện tại, kiểm tra lại nội dung AGY đã tạo, giảm highlight, làm rõ tiếng Việt và cập nhật change log. Lượt này do Codex sửa trực tiếp theo chỉ dẫn mới nhất, không sử dụng AGY, không stage/commit. Nội dung các bản ghi trước được giữ nguyên phía dưới.

| Tệp                                                                                                                          | Thay đổi                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SQL tham chiếu](docs/03_thiet_ke/WMSD_SQL_schema.sql)                                                                       | Bổ sung mô hình SO, hủy phần chưa xuất, dòng OD/GI-S, POD có ảnh và PAY-CFM; thêm khóa ngoại ghép, khóa chống trùng, CHECK trạng thái và hợp đồng transaction.                      |
| [Thiết kế database VI](docs/03_thiet_ke/de_xuat_database_design_VI.md), [EN](docs/03_thiet_ke/de_xuat_database_design_EN.md) | Đồng bộ 7 quy trình theo BF-05 mới; cập nhật nguồn, MongoDB mapping, bảng/quan hệ, ERD, quyền, trạng thái, quy tắc và nghiệm thu.                                                   |
| [Quy trình VI](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), [EN](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md)               | Rà nội dung AGY: viết gọn BF-05, bỏ nhấn mạnh dài và định dạng code trên chữ viết tắt nghiệp vụ; chỉnh tiếng Việt; làm rõ số lượng cam kết, trạng thái xác nhận và cách đính chính. |
| [Nhật ký này](change_logs.md)                                                                                                | Ghi tác động, kết quả kiểm tra thực tế và giới hạn; giữ toàn bộ lịch sử trước lượt sửa.                                                                                             |

## 2. Tác động và quyết định thiết kế

- Luồng thống nhất: SO nhập lại từ MISA/giấy tờ → WIR liên kết → OD/soạn/PGI → Warehouse xác nhận POD kèm ảnh → DELIVERED → Sales xác nhận nhận đủ tiền ngoài hệ thống (PAY-CFM) → COMPLETED.
- Thay đổi hợp đồng dữ liệu WIR: tham chiếu trực tiếp external_line được thay bằng SO/dòng SO bắt buộc. Các FK ghép giữ đúng chuỗi chứng từ và chặn dòng thuộc đơn/yêu cầu khác. Một nguồn chỉ có một bản sao SO; sửa/mở lại dùng SO cũ. Đây là thay đổi phiên bản lớn của mô hình tham chiếu, không phải migration đã chạy trên cơ sở dữ liệu thực.
- SQL tăng từ 64 lên 73 bảng, giữ 2 view. Chín bảng mới: sales_order, sales_order_line, sales_order_cancellation, outbound_delivery_line, sales_goods_issue_line, customer_delivery, customer_delivery_line, external_payment_confirmation và business_operation. Tệp ảnh tiếp tục dùng evidence riêng tư; ảnh POD/tệp PAY-CFM phải thuộc đúng phiếu.
- Tổng cam kết WIR tính cả phần đã xuất; hoàn tất WIR không làm phát sinh lại nhu cầu. Tổng OD nằm trong WIR, tổng POD đã xác nhận chưa hủy hiệu lực nằm trong PGI hợp lệ. Kiểm tổng nhiều dòng và cập nhật đồng thời là trách nhiệm service/transaction, không tuyên bố CHECK/FK đã thực hiện thay.
- Chuẩn hóa POD/PAY-CFM thành DRAFT → CONFIRMED, hoặc VOIDED khi đính chính có lý do. Giao một phần thuộc trạng thái SO. Hủy toàn bộ khi chưa giao là CANCELLED; không tự thành DELIVERED/COMPLETED. Đính chính tăng phiên bản SO, tính lại tiến độ và không tái dùng điều kiện hoàn thành cũ.
- POD/PAY-CFM dùng business_operation để chống ghi lặp, cập nhật cùng SO/audit/outbox; không tạo movement hoặc đổi tồn. Hủy phần chưa xuất chỉ giải phóng lượng giữ phù hợp. Khách trả thông thường vẫn giữ lịch sử giao/nhận tiền và dùng BF-06 riêng.
- Giữ 5 vai trò, 111 UC (98 active/13 retired), BR-01–33 và 36 nhánh A/E. Thiết kế database bổ sung R-16–21 và T27–T40, tổng 40 tình huống nghiệm thu đề xuất. Không thêm phân hệ thu tiền, hóa đơn, công nợ hoặc đồng bộ MISA tự động.
- Tác động triển khai: cần cập nhật API/service/validator/index MongoDB và kiểm thử đồng thời trước sử dụng. Rủi ro chính là vượt nguồn, xác nhận giao thiếu ảnh, hoàn thành sớm hoặc dùng xác nhận cũ; đã mô tả điểm kiểm và case nghiệm thu. Chưa có mã backend/lịch sprint để ước lượng thời gian triển khai đáng tin cậy.

## 3. Kiểm tra đã thực hiện

| Kiểm tra                  | Kết quả và giới hạn                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cú pháp SQL Server        | Microsoft ScriptDom TSql160Parser: 0 lỗi, 6 batch. Parse không thay thế chạy SQL Server.                                                                                                                                                                                                                                                           |
| Khóa/FK/CHECK             | 21 kiểm tra trên SQLite in-memory sau chuyển đổi cú pháp DDL: chuỗi SO–WIR–OD–GI–POD–PAY hợp lệ; chặn nguồn trùng, sai chứng từ cha, ảnh sai/thiếu, lượng âm, trạng thái sai, xác nhận tiền thiếu căn cứ/không đủ/lặp phiên bản, mã chống trùng và hủy không hợp lệ. Không mô phỏng đầy đủ kiểu số, collation hoặc transaction SQL Server/MongoDB. |
| Bảo toàn mô hình kho      | So sánh với bản chụp trước lượt sửa: định nghĩa 58 bảng cũ ngoài nhóm được sửa và cả hai view inventory_ledger/available_stock giữ nguyên.                                                                                                                                                                                                         |
| Hai bản quy trình         | Khớp 111 mã UC, 33 BR, 36 nhánh A/E; 29 bảng cùng cấu trúc và 8 sơ đồ cùng quan hệ nối. Không còn định dạng code trên SO/WIR/POD/PAY-CFM/DELIVERED/COMPLETED hoặc đoạn nhấn mạnh dài.                                                                                                                                                              |
| Hai bản thiết kế database | Khớp 21 mã quy tắc, 40 case T01–T40, 16 bảng cùng cấu trúc và ERD; có đủ thực thể và quyền cho UC-109–111. Đây là kiểm tra tài liệu, không phải 40 case đã chạy trên backend.                                                                                                                                                                      |
| Liên kết, lịch sử và Git  | Không thêm liên kết file lỗi; giữ lịch sử nhật ký và các thay đổi có sẵn; git diff --check đạt; không stage/commit. Script kiểm tra và bản chụp nằm ở thư mục tạm ngoài repository.                                                                                                                                                                |

## 4. Giới hạn và tài liệu còn cần đồng bộ

Report 1/3 dạng text, Word, hình PNG và draw.io chưa được sửa trong lượt này; ghi chú trong tài liệu phân biệt rõ baseline cũ với thiết kế hiện hành. File docs/04_so_do/WMSD_Mainflows_VI_EN.drawio đã ở trạng thái bị xóa khi bắt đầu lượt này và được giữ nguyên trạng thái; liên kết tới file đó vẫn chưa có đích. Chưa chạy SQL Server hoặc backend MongoDB để kiểm phân quyền, lưu ảnh, transaction/concurrency và toàn bộ quy trình đầu cuối.

---

# Nhật ký cập nhật BF-05 trong Đề xuất quy trình 2 — 21/10/2026 (Lượt sửa đổi BF-05)

## 1. Phạm vi và căn cứ thực hiện

- **Yêu cầu người dùng (21/10/2026):** Sửa BF-05 (xuất hàng, soạn hàng, giao hàng) và toàn bộ các phần liên quan trong hai bản Đề xuất quy trình 2 song ngữ theo luồng: bước đầu Sales Staff tạo đơn bán (`Sales Order` — `SO`) bằng cách sao chép/nhập lại đơn bán từ bên ngoài đã xác minh (MISA, giấy tờ, ...), sau đó mới tạo yêu cầu xuất hàng (`Warehouse Issue Request` — `WIR`) liên kết với đơn bán `SO`; có bước giao hàng cho khách kèm chụp ảnh xác nhận để cập nhật trạng thái đơn sang đã giao (`DELIVERED`); khi Sales Staff xác nhận đã nhận đủ tiền ngoài hệ thống thì cập nhật trạng thái đơn sang hoàn thành (`COMPLETED`); cập nhật tất cả phần liên quan trong hai file quy trình và nhật ký này.
- **Phạm vi 3 file tài liệu được phép sửa của nhiệm vụ này (phân biệt với thay đổi đồng thời ngoài nhiệm vụ trong workspace):**
  1. [docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md)
  2. [docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md)
  3. [change_logs.md](change_logs.md)
- **Thực thi, kiểm chứng độc lập của Codex và ghi chú workspace:** Phần triển khai được ủy quyền cho AGY thực hiện; lượt kiểm chứng độc lập ban đầu của Codex đã hoàn tất với kết quả thực tế: hai bản EN/VI đều khớp đúng 33 mã `BR`, 36 mã nhánh `A/E`, 27 bảng với kích thước dòng/cột tương ứng, 8 khối Mermaid đóng/mở fence đầy đủ; toàn bộ nội dung nhật ký trước khi chạy được bảo toàn nguyên vẹn làm phần hậu tố chuẩn hóa line-ending; `git diff --check` đạt; không có stage hay commit. Tiếp theo kết quả review của Codex, lượt hiệu chỉnh tập trung này cập nhật nhánh vòng lặp giao hàng/ảnh chụp trong Mermaid BF-05, trần định lượng theo từng tầng dòng (`SO` → `WIR` → `OD` và `POSTED GI-S` → `POD`) và quy tắc hủy toàn bộ đơn (`CANCELLED` so với `DELIVERED` khi lượng active `> 0`), sau đó Codex thực hiện lượt kiểm chứng độc lập cuối cùng. **Ghi chú trạng thái workspace:** file `docs/04_so_do/WMSD_Mainflows_VI_EN.drawio` đã bị xóa đồng thời ngoài phạm vi nhiệm vụ (`git status D`) trong quá trình chạy trước; thao tác `git checkout` khôi phục trái phép của AGY đối với file đó đã được hoàn tác (sau khi xác minh nội dung khớp `HEAD`) để trả lại đúng trạng thái `DELETED` đã quan sát, nên `git status` tổng thể của workspace gồm 3 file tài liệu được sửa của nhiệm vụ này cùng 1 thay đổi xóa `drawio` độc lập đó.

## 2. Tóm tắt thay đổi trong hai bản Đề xuất quy trình 2 (VI & EN)

| Nhóm nội dung                                                        | Nội dung cập nhật chính                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ranh giới phạm vi & Thuật ngữ (`SO`, `WIR`, `POD`, `PAY-CFM`)        | Giữ ngừng (retired) tính giá bán (`UC-23–25`), hóa đơn nội bộ (`UC-59–62`) và workflow hoàn tiền (`UC-74–78`). Thay vì bỏ hoàn toàn `SO` nội bộ, giữ `Sales Order` (`SO`) làm bản ghi theo dõi nội bộ do Sales Staff sao chép thủ công từ đơn bán bên ngoài đã xác minh (MISA/giấy tờ) kèm mã tham chiếu đơn/dòng nguồn và tệp/ảnh bằng chứng. Tách rõ `SO` với `WIR` liên kết, `POD` (xác nhận giao khách kèm ảnh) và `PAY-CFM` (xác nhận của Sales về việc đã thu đủ tiền ngoài hệ thống).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Luồng chính BF-05 & Mermaid BF-05                                    | Cập nhật thành 10 bước có thứ tự: (1) Sales tạo `SO` sao chép từ đơn ngoài đã xác minh → (2) Sales tạo `WIR` riêng biệt liên kết ở cả cấp header và dòng số lượng với `SO` đã lưu (`tổng WIR active <= lượng_đặt − lượng_hủy` trên dòng `SO`, `tổng OD active <= lượng WIR` mà không cộng gộp `WIR` với `OD`; tạo `SO`/`WIR` không đổi tồn) → (3–4) kiểm tra khả dụng, gợi ý BF-03/BF-01 khi thiếu và thống nhất khách → (5–7) giữ hàng theo FIFO tương thích, tạo task soạn `TO`, soạn/đếm vào staging, xử lý thiếu/lỗi qua BF-02/BF-04 → (8) lập `GI-S`, bàn giao kho `HO` và post `PGI` trừ tồn đúng một lần (bàn giao carrier/`PGI` không tự chuyển `DELIVERED`) → (9) Warehouse Staff xác nhận giao khách thực tế kèm ảnh chụp bắt buộc (`POD`, `UC-110` gắn với dòng `GI-S` đã `POSTED`, kiểm tra nguyên tử `tổng POD <= lượng PGI hợp lệ đã POSTED`) để chuyển `SO` sang `DELIVERED` khi lượng đặt active còn lại `> 0` đã giao đủ kèm ảnh (Mermaid BF-05 tách riêng nhánh thiếu ảnh/chờ khách nhận chỉ quay lại bước `POD`, nhánh từ chối/trả hàng sau `PGI` chuyển `BF-06`, nhánh giao một phần còn lượng chưa xuất mới quay lại bước kiểm nguồn kho `B`) → (10) sau `DELIVERED`, chỉ Sales Staff xác nhận đã nhận đủ tiền ngoài hệ thống (`PAY-CFM`, `UC-111`) để chuyển `SO` sang `COMPLETED`. |
| Luồng thay thế & ngoại lệ BF-05 (`05.X`)                             | Cập nhật `BF-05-E1..E3`, `BF-05-A1..A2` và bổ sung `BF-05-A3` (tiền ngoài hệ thống chưa thu/thu một phần/chưa rõ hoặc trả trước khi `DELIVERED`): chặn tạo `WIR` không có `SO` hoặc vượt lượng dòng `SO`; thiếu ảnh chụp giao hàng hoặc giao một phần/từ chối nhận chỉ giữ `PARTIALLY_DELIVERED`; chưa nhận đủ tiền ngoài hệ thống thì giữ `DELIVERED`; biết trả tiền sớm trước khi giao đủ hàng kèm ảnh không thể chuyển `COMPLETED`; không tự cộng/trừ tồn kho khi đổi trạng thái đơn.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Vai trò, Catalogue UC (111 mã) & Ma trận phân quyền                  | Giữ nguyên 5 role (`Store Owner`, `Sales Staff`, `Warehouse Staff`, `Accountant`, `Administrator`), không thêm role tài xế/thu ngân. Giữ `UC-45–48` cho danh sách/chi tiết/tạo/cập nhật bản sao `SO` và theo dõi tiến độ; bổ sung 3 UC mới: `UC-109` (_Manage Linked Warehouse Issue Requests_ — Sales tạo/sửa/hủy phần chưa xuất, các role nghiệp vụ khác xem theo phạm vi), `UC-110` (_Confirm Customer Delivery with Photo Evidence_ — Warehouse Staff), `UC-111` (_Confirm External Receipt and Complete Sales Order_ — chỉ Sales Staff). Giữ `UC-108` của Accountant cho đối chiếu/tham chiếu chứng từ bên ngoài, không thay thế bước hoàn thành đơn của Sales. Tổng số mã UC: **111 mã (`UC-01–UC-111`), gồm 98 active và 13 retired** (13 mã retired giữ nguyên).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Quy tắc nghiệp vụ (`BR-01–BR-33`), Chứng từ, Trạng thái & Nghiệm thu | Cập nhật `BR-14`, `BR-25`, `BR-26`, `BR-28` và bổ sung `BR-31` (bắt buộc `SO` sao chép từ nguồn ngoài trước `WIR`, trần định lượng từng tầng `SO` → `WIR` → `OD`), `BR-32` (Warehouse xác nhận `POD` gắn dòng `GI-S` đã `POSTED` kèm ảnh chụp bắt buộc, kiểm tra nguyên tử không vượt lượng `PGI` hợp lệ, idempotent cùng operation key không trừ tồn lần hai; chỉ sang `DELIVERED` khi lượng đặt active còn lại `> 0` đã giao đủ kèm ảnh, còn hủy toàn bộ đơn khi thực giao bằng `0` thì chuyển `CANCELLED` chứ không `DELIVERED`/`COMPLETED`), `BR-33` (chỉ Sales xác nhận đã nhận đủ tiền ngoài hệ thống sau `DELIVERED` mới sang `COMPLETED`, không xử lý thanh toán/hóa đơn hay đổi tồn). Cập nhật bảng chứng từ (`SO`, `WIR`/`OD`, `GI-S`, `POD`, `PAY-CFM`), liên kết dòng (15.2), trạng thái `SO` (15.3) tách biệt với `WIR`, chuỗi chứng từ BF-05 và 3 tình huống nghiệm thu BF-05.                                                                                                                                                                                                                                                                                                                                                                                                              |

## 3. Các tài liệu ngoài phạm vi lượt này (cần đồng bộ tiếp theo)

- [docs/01_bao_cao/WMSD_Report1_Fix.docx.txt](docs/01_bao_cao/WMSD_Report1_Fix.docx.txt), [docs/01_bao_cao/WMSD_Report3_Fix.docx.txt](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt), [docs/03_thiet_ke/de_xuat_database_design_VI.md](docs/03_thiet_ke/de_xuat_database_design_VI.md), [docs/03_thiet_ke/de_xuat_database_design_EN.md](docs/03_thiet_ke/de_xuat_database_design_EN.md), [docs/03_thiet_ke/WMSD_SQL_schema.sql](docs/03_thiet_ke/WMSD_SQL_schema.sql) cũng như các file Word `.docx`, ảnh PNG và sơ đồ `draw.io` **không nằm trong danh sách file được phép sửa của lượt này** và vẫn đang ở baseline 108 UC (95 active / 13 retired) đầu ngày 21/10/2026. Mục 9 và các ghi chú liên quan trong hai bản Đề xuất quy trình 2 đã được đánh dấu rõ là danh mục yêu cầu cần đồng bộ tiếp theo cho các tài liệu đó.

---

> **Nhật ký lịch sử đầu ngày 21/10/2026 và ngày 20/10/2026:** Toàn bộ nội dung bên dưới được giữ nguyên văn để bảo toàn lịch sử. Các phát biểu trong các bản ghi cũ bên dưới như “không dùng AGY”, “bỏ SO nội bộ / thay SO bằng WIR”, “108 ID: 95 active, 13 retired” hoặc “đã đồng bộ toàn bộ 7 file” phản ánh trạng thái của các lượt trước (trước khi có yêu cầu sửa đổi BF-05 `SO` → `WIR` → `DELIVERED` → `COMPLETED` ở trên).

# Nhật ký đồng bộ WMSD — 21/10/2026

## 1. Phạm vi và căn cứ hiện hành

- Yêu cầu lần này: đồng bộ toàn bộ bảy file đã chỉ định theo quy trình mới và bổ sung các luồng ngoài happy case. Sửa trực tiếp theo chỉ dẫn mới nhất; không dùng AGY, không stage/commit, không gửi email hoặc yêu cầu review ra ngoài.
- Căn cứ: quyết định D1–D8 trong nhật ký 20/10 bên dưới, khảo sát một phản hồi lúc 09:04:25 ngày 20/10/2026 (GMT+7), và hai bản Đề xuất quy trình 2. Không tự thay đổi các quyết định đã chốt hoặc bịa thời hạn nhận trả/hệ số SKU/danh sách kho.
- Git trước sửa sạch. Chỉ bảy file được yêu cầu và nhật ký này thay đổi; tài liệu nguồn cũ/CSV, Word, hình và draw.io giữ nguyên. Bản chụp trước sửa và script kiểm tra ở thư mục tạm của phiên, ngoài repository.

## 2. Nội dung đã đồng bộ

| File                                                                                                                         | Thay đổi                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Report 1 text](docs/01_bao_cao/WMSD_Report1_Fix.docx.txt)                                                                   | Đồng bộ mục tiêu, bối cảnh As-is, giải pháp, đủ 7 BF, 9 FE và giới hạn LI. Tách dữ kiện khảo sát khỏi To-be; bỏ cam kết SO/giá/hóa đơn/hoàn tiền trong WMS. Giữ thông tin dự án/stakeholders và lịch sử chỉnh sửa. Bỏ số trang Word cũ khỏi mục lục text.                                                                                                                                                                            |
| [Report 3 text](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt)                                                                   | Viết lại các phần baseline cũ và gom boilerplate lặp; đồng bộ context/mainflow/model/rules, catalogue, associations, quyền, đặc tả, màn hình/API/job, NFR và appendix. Giữ 108 ID: 95 active, 13 retired; đủ 108 đặc tả và 108 dòng quyền. 49 UC có hợp đồng thao tác cụ thể; UC xem/trace giữ input/display phù hợp và không post. UC-72 là custody/inspection trước Owner; UC-73 chỉ nhận phần đủ điều kiện đúng version/quantity. |
| [Quy trình VI](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md), [EN](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md)               | Thêm 35 nhánh A/E ở ngay từng BF với điều kiện, người xử lý, điểm tiếp tục, tác động tồn và UC; thêm EX-01–05 dùng chung. Cập nhật phạm vi đồng bộ, trạng thái checklist, source version/correlation và tham chiếu database.                                                                                                                                                                                                         |
| [Thiết kế database VI](docs/03_thiet_ke/de_xuat_database_design_VI.md), [EN](docs/03_thiet_ke/de_xuat_database_design_EN.md) | Chuyển căn cứ sang baseline 21/10 và D1–D8; xác nhận từ 3 kho nhưng chưa biết danh sách. Đồng bộ T-SQL/schema wmsd, MongoDB runtime, assessment D6, packaging, external source/correlation, enforcement R-13–15, 26 case nghiệm thu và trace nhánh ngoại lệ. Không gán kết quả PostgreSQL cũ cho T-SQL hiện tại.                                                                                                                     |
| [SQL tham chiếu](docs/03_thiet_ke/WMSD_SQL_schema.sql)                                                                       | Thêm CHECK cố định 5 role; inspection packaging enum độc lập quality; lý do assessment không trống và index tìm assessment theo dòng/version; source_version nullable, correlation_id UNIQUE không trống; bổ sung nghĩa vụ service theo các ngoại lệ. Vẫn 64 bảng, 2 view; không thêm engine runtime hoặc stored procedure giả.                                                                                                      |
| [Nhật ký này](change_logs.md)                                                                                                | Bổ sung bản ghi 21/10; giữ toàn bộ nhật ký 20/10 nguyên văn phía dưới dưới nhãn lịch sử.                                                                                                                                                                                                                                                                                                                                             |

Màn hình Report 3: SC-01–24 tiếp tục active, SC-25–27 retired; thêm SC-28 External Document References. Tổng 28 ID màn hình, 25 active/3 retired. UC-103 dùng SC-10/16; UC-104 tại SC-13; UC-105 tại SC-14; UC-106/107 tại SC-19; UC-108 tại SC-28. API-02 mô tả hợp đồng lưu chứng cứ riêng tư, chưa chọn nhà cung cấp; JOB-01 chỉ xử lý thông báo kho sau commit, không có job tự tạo kiểm kê/PO.

## 3. Phủ luồng ngoài happy case

| BF    | Số nhánh mỗi ngôn ngữ | Các tình huống bổ sung                                                                                                      |
| ----- | --------------------: | --------------------------------------------------------------------------------------------------------------------------- |
| BF-01 |                     6 | Nhu cầu đã có nguồn; từ chối/trả sửa; giao phần/chốt thiếu; thừa/sai; không nhận lượng nào; thùng mở/rách và hàng thay thế. |
| BF-02 |                     4 | Lỗi trên hàng đã giữ/soạn; chưa rõ chủ/cause; duyệt phần/từ chối; chưa thực hủy/trả và chống trừ lặp.                       |
| BF-03 |                     5 | Nội kho; xuất trực tiếp kho khác; thiếu nguồn/người nhận độc lập; nhận phần/hỏng; thừa/sai lô/thất lạc đã xác minh.         |
| BF-04 |                     5 | Task dở/khóa chồng; chưa đếm/0/hàng mới; quality khác mất lượng; không lệch/trả sửa; lỗi mạng khi clearing.                 |
| BF-05 |                     5 | Nguồn chưa rõ/trùng/tranh hàng; giao phần/đổi lô; soạn lệch; hủy trước PGI/unpick; hủy/trả sau PGI.                         |
| BF-06 |                     5 | Lịch sử ngoài WMS; D6 chưa rõ/bị loại; trả hỗn hợp; đổi assessment/vượt nguồn; rút yêu cầu/chậm giao trả custody.           |
| BF-07 |                     5 | NCC chưa đồng ý/đồng ý phần; tái dùng quyết định BF-02; soạn thiếu/custody; ACK lệch; đổi hàng/bồi thường ngoài WMS.        |

EX-01–05: phân quyền/tách người; version/cạnh tranh nguồn; chưa rõ commit/retry; khóa kiểm kê; chứng cứ/in/email lỗi. Nhánh quy định rõ rollback/giữ trạng thái/chờ hoặc tiếp tục, không tự tạo quyền hay tăng/trừ tồn bằng đổi trạng thái.

## 4. Kiểm tra của lượt 21/10

| Kiểm tra                   | Kết quả và giới hạn                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalogue ↔ đặc tả ↔ quyền | 108 ID duy nhất, tên/trạng thái khớp; 95 active/13 retired; mọi retired không có quyền hoặc bước thực thi.                                                                                                                                                                                                                                |
| Màn hình                   | 28 ID, 25 active/3 retired; mọi active UC có màn hình, không màn hình active nào gắn UC retired.                                                                                                                                                                                                                                          |
| VI–EN và SRS               | Cùng 35 mã nhánh theo thứ tự, 5 lỗi chung, 30 BR; BR tiếng Anh trong SRS trùng bộ quy trình. Hai bản quy trình cùng 27 bảng với số dòng tương ứng; hai bản database cùng 13 bảng và 26 case T01–T26.                                                                                                                                      |
| Liên kết nội bộ            | Các liên kết file trong 4 bản quy trình/database không có đích bị thiếu; kiểm range UC trong SRS không có range đảo/vượt 108.                                                                                                                                                                                                             |
| Cú pháp SQL Server         | Microsoft ScriptDom 180.140.0, TSql160Parser: 0 lỗi, 6 batch; đếm 64 bảng/2 view. Đây là parse, chưa thực thi trên SQL Server.                                                                                                                                                                                                            |
| Biểu thức CHECK            | 750 phép kiểm trên SQLite in-memory dùng nguyên biểu thức CHECK/enum từ DDL và hàm LEN tương thích. Gồm 720 tổ hợp D6, 9 thiếu bằng chứng thời hạn, 2 lý do trống, 1 enum D6 sai; 18 kiểm bổ sung về role/packaging/source-version/correlation và unique nguồn. Không thay thế hành vi collation, FK, service hay concurrency SQL Server. |
| Diff / phạm vi             | Đọc diff các thay đổi, rà các phần nguồn/role/stock effect và whitespace; git diff --check đạt. Không stage hoặc commit; không sửa file ngoài 8 file nêu trên.                                                                                                                                                                            |

## 5. Giới hạn còn lại

- Chỉ cập nhật các bản text/Markdown/DDL được chỉ định. Word .docx, hình nhúng, PNG và draw.io không được sửa trong lượt này; sơ đồ Mermaid/context/ER và nội dung text hiện hành không làm ảnh cũ tự đổi. Khi dựng Word/PDF mới phải thay hình cũ theo bộ này.
- Chưa có SQL Server engine hoặc backend runtime để chạy migration, phân quyền, transaction/concurrency và end-to-end. Các nhánh/26 case là tiêu chí nghiệm thu, không tuyên bố hệ thống đã vượt qua chúng.
- Chưa xác minh danh sách/địa chỉ/số kho chính xác (đã biết từ 3), người từng kho, actual calibre, hệ số từng SKU, thời hạn trả và lịch đối chiếu MISA. Không tự đặt giá trị mặc định.
- Các tham khảo sản phẩm/thuế/SAP từ bản trước là lịch sử; lượt này không tái xác minh nguồn web hay đưa hướng dẫn pháp lý mới.

---

> **Nhật ký lịch sử 20/10/2026:** phạm vi và giới hạn dưới đây mô tả lượt trước. Phần “Report 3 chưa viết lại toàn bộ”, “không sửa Report 1” và “chưa cập nhật thiết kế database” đã được thay bằng kết quả lượt 21/10 phía trên; không còn là trạng thái hiện tại của bộ text.

# Nhật ký cập nhật quy trình WMSD — 20/10/2026

## 1. Căn cứ và phạm vi

- [Khảo sát Tân Thương](docs/05_khao_sat/khao_sat_kho_gach.csv): 1 phản hồi lúc 09:04:25 ngày 20/10/2026 (GMT+7), 26 câu hỏi.
- [Đề xuất sau review1](docs/02_nghiep_vu/De_xuat_7_quy_trinh_sau_review1.md): nguồn kế thừa; giữ nguyên file gốc.
- Quyết định D1–D8 của người dùng trong chat: đã cho phép cập nhật hai bản đề xuất mới, bảng UC của Report 3 dạng text, sơ đồ mainflow và SQL tham chiếu.
- Không sử dụng AGY; không tạo commit; không gửi email hoặc yêu cầu review ra ngoài.

## 2. Quyết định áp dụng

| Mã  | Nội dung đã chốt                            | Tác động                                                                                                                                                                                                                       |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Giữ giảm tồn vật lý tại bàn giao/PGI        | Lập yêu cầu chỉ giữ hàng/giảm khả dụng. Ghi rõ khác câu 17 của khảo sát và cần đối chiếu đơn MISA chưa thực giao.                                                                                                              |
| D2  | Giữ các bộ phận tự nhập/xác nhận như bản cũ | Không thêm nhập hộ hoặc tài khoản dùng chung, dù khảo sát chọn kế toán/một người nhập chung.                                                                                                                                   |
| D3  | Giữ đúng 5 application role                 | Store Owner, Sales Staff, Warehouse Staff, Accountant, Administrator. Warehouse Staff là tên thống nhất của Inventory Staff, không phải role mới. Không thêm mua hàng/giao hàng hoặc cơ chế ủy quyền động.                     |
| D4  | Có chuyển hàng giữa các kho                 | Giải quyết mâu thuẫn chọn có/không ở câu 13 bằng xác nhận người dùng; không sửa CSV. Giữ BF-03B và xác nhận độc lập hai đầu.                                                                                                   |
| D5  | Giữ khóa phạm vi kiểm kê                    | Bổ sung lịch kiểm hằng tháng. Không chọn vừa đếm vừa nhập/xuất; không thêm job tự tạo phiên.                                                                                                                                   |
| D6  | Bổ sung điều kiện khách trả                 | Nguyên thùng/viên lẻ chưa dùng xét từng trường hợp; không nhận đã thi công, hỏng do khách, quá hạn đã xác minh. Chưa rõ điều kiện/thời hạn thì chờ, không tự đặt số ngày.                                                      |
| D7  | Cập nhật dữ kiện có căn cứ                  | Từ 3 kho trở lên theo khảo sát; đã chia khu/kệ và đánh mã; ghi lô/màu/kích thước; thùng/viên/m², thùng mở, bao bì rách; dùng điện thoại; phối hợp kiểm nhận/liên hệ NCC. Không suy diễn calibre, địa chỉ, hệ số hay quyền mới. |
| D8  | Giữ các kiểm soát còn lại dưới nhãn To-be   | Custody, staging/put-away, FIFO tương thích, chống post trùng, không tự duyệt, duyệt TR, không live MISA tiếp tục là thiết kế đề xuất.                                                                                         |

## 3. File được tạo/cập nhật

| File                                                                                                                                             | Nội dung                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [de_xuat_quy_trinh_2_VI.md](docs/02_nghiep_vu/de_xuat_quy_trinh_2_VI.md)                                                                         | Tạo bản Việt đầy đủ từ nguồn cũ, giữ cấu trúc thuật ngữ và 16 mục. Thêm nguồn khảo sát, bảng D1–D8, phân biệt As-is/To-be, dữ kiện đã rõ/chưa rõ, BR-29/30 và tình huống nghiệm thu mới. |
| [de_xuat_quy_trinh_2_EN.md](docs/02_nghiep_vu/de_xuat_quy_trinh_2_EN.md)                                                                         | Tạo bản Anh tương ứng đầy đủ: thuật ngữ, 7 quy trình, UC, quyền, context, 30 BR, Mermaid, nghiệm thu, nguồn, chứng từ/trạng thái và quy ước lane.                                        |
| [WMSD_Report3_Fix.docx.txt](docs/01_bao_cao/WMSD_Report3_Fix.docx.txt)                                                                           | Cập nhật 4.1 actors, 4.2 catalogue và 4.4 permission matrix; sửa tên Warehouse Staff và ghi chú trạng thái sơ đồ cũ tại 4.3. Nội dung trước mục 4.1 và từ mục 5 trở đi được giữ nguyên.  |
| [WMSD_Mainflows_VI_EN.drawio](docs/04_so_do/WMSD_Mainflows_VI_EN.drawio)                                                                         | Cập nhật phiên bản/nguồn đề xuất trên 16 trang, nhãn/ghi chú liên quan khảo sát và D1–D8; giữ IDs, lanes, edges và hình học các bước hiện có.                                            |
| [WMSD_Mainflow_BF03B_VI.png](docs/04_so_do/WMSD_Mainflow_BF03B_VI.png) và [WMSD_Mainflow_BF03B_EN.png](docs/04_so_do/WMSD_Mainflow_BF03B_EN.png) | Xuất lại hai ảnh đã được tài liệu tham chiếu từ trang 4 và 12 của draw.io cập nhật, tránh ảnh cũ lệch nhãn/ghi chú.                                                                      |
| [WMSD_SQL_schema.sql](docs/03_thiet_ke/WMSD_SQL_schema.sql)                                                                                      | Bổ sung bảng đánh giá điều kiện khách trả theo dòng/phiên bản, CHECK và index; bổ sung các nghĩa vụ kiểm soát tại tầng ứng dụng. Bảo toàn toàn bộ dòng SQL có trước lượt này.            |
| [change_logs.md](change_logs.md)                                                                                                                 | Nhật ký này: phạm vi, quyết định, thay đổi, kiểm tra và giới hạn.                                                                                                                        |

## 4. Thay đổi theo quy trình

| Quy trình | Thay đổi / phần giữ nguyên                                                                                                                                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BF-01     | Ghi chủ/kế toán có thể cùng kiểm và lưu người tham gia trong bằng chứng. Warehouse vẫn xác nhận/post GR. Bao bì rách không tự là gạch hỏng; thùng mở ghi viên thực tế. Luồng RR → Owner → Accountant PO → Warehouse nhận/put-away giữ nguyên.                                                                             |
| BF-02     | Giữ nguyên luồng, quyền và tác động tồn. Không thêm quyền tự động cho người được ủy quyền trong thực tế.                                                                                                                                                                                                                  |
| BF-03A    | Giữ nguyên di chuyển nội kho không Owner approval, bảo toàn tổng/lô/chất lượng/reservation.                                                                                                                                                                                                                               |
| BF-03B    | Ghi có điều chuyển theo D4 và từ 3 kho theo khảo sát; danh sách kho cụ thể chưa có. Giữ TR duyệt, TD/MWTR riêng, người nhận độc lập và xử lý chênh lệch.                                                                                                                                                                  |
| BF-04     | Thêm lịch hằng tháng, giữ khóa phạm vi đến khi hoàn tất xử lý. Phương án reconcile giao dịch sau cutoff được ghi là phương án chưa chọn.                                                                                                                                                                                  |
| BF-05     | Ghi các kênh yêu cầu thực tế nhưng Sales chuẩn hóa thành WIR có nguồn xác minh; không tích hợp tự động các kênh. Giữ PGI, reservation, partial delivery và từng bộ phận tự nhập.                                                                                                                                          |
| BF-06     | Thêm điều kiện D6, phân loại theo từng lượng, phiên bản đánh giá/bằng chứng và kiểm điều kiện trước khi duyệt/post. Chưa rõ → custody/chờ xác minh; bị loại → không GR-CR, bàn giao lại nếu đã giữ hàng. Lỗi do NCC không bị đánh đồng hỏng do khách. Mermaid thể hiện riêng nhánh chưa rõ. Hoàn tiền tiếp tục ngoài WMS. |
| BF-07     | Ghi chủ/nhân viên mua hàng có thể liên hệ NCC ngoài phần mềm; Accountant vẫn nhập thỏa thuận/ACK, không thêm role. Giữ chấp thuận NCC trước xuất, duyệt nội bộ, thực xuất và đối chiếu.                                                                                                                                   |

## 5. Catalogue UC và quyền

**108 mã để truy vết = 95 UC active + 13 UC retired.** Không đánh lại số UC.

| Nhóm               | Cập nhật                                                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UC-03/04/07        | Sales/Warehouse đề xuất, Owner duyệt khác người đề xuất, Accountant lập PO theo dòng đã duyệt.                                                                                                               |
| UC-13/26/30/31     | Quy đổi/bao bì, cùng kiểm nhận không đồng nghĩa quyền post, phân biệt tồn vật lý/khả dụng/giữ hộ/đang chuyển.                                                                                                |
| UC-32/33, UC-52–55 | Đặt tên put-away/picking task; không gọi là tầng phê duyệt mới.                                                                                                                                              |
| UC-40/41/43/44     | TR → duyệt → xuất nguồn; UC-43 đổi thành Record Transfer Dispatch, UC-104 nhận đích.                                                                                                                         |
| UC-45–48/51/58     | Sales Order đổi thành Warehouse Issue Request có nguồn ngoài; kế hoạch giao theo outstanding; PGI theo bàn giao thực tế.                                                                                     |
| UC-65–67           | Cách ly ngay, duyệt và thực hiện đúng lượng; không trừ lặp khi chuyển BF-07.                                                                                                                                 |
| UC-70–73           | Sales tạo; Warehouse kiểm/đánh giá D6; Owner duyệt sau kiểm; chỉ post lượng đủ điều kiện đúng phiên bản.                                                                                                     |
| UC-81–83           | Kho đề nghị/thực xuất, NCC đồng ý + Owner duyệt trước xuất; ACK về sau, đóng không trừ lại.                                                                                                                  |
| UC-86–93           | Kiểm theo tháng/mục tiêu; snapshot và FROZEN; phiếu đếm/recount; Warehouse đề xuất delta; Owner duyệt và Clear Difference riêng. UC-92 đổi tên Review Inventory Adjustment để thể hiện duyệt/từ chối/trả về. |
| UC-98–102          | Năm role, scope kho, nhật ký, báo cáo và trace theo phạm vi kho; không nhập hộ/ủy quyền động.                                                                                                                |
| UC retired         | UC-23–25 giá bán; UC-42 TO liên kho dư; UC-59–62 hóa đơn nội bộ; UC-74–78 workflow hoàn tiền. Giữ mã/lý do, không có quyền active.                                                                           |
| UC-103 mới         | View and Select Shortage Fulfilment Options — Sales/Warehouse; hỗ trợ BF-01/03/05.                                                                                                                           |
| UC-104 mới         | Inspect and Post Transfer Receipt — Warehouse kho đích độc lập.                                                                                                                                              |
| UC-105 mới         | Export or Print Stocktake Count Sheet — Warehouse/Owner; giữ riêng, chưa gộp vào UC-87.                                                                                                                      |
| UC-106 mới         | Approve Supplier Return and Variance Resolution — Owner; phân biệt quyết định trước xuất và xử lý sai lệch.                                                                                                  |
| UC-107 mới         | Record Supplier Agreement and Receipt Acknowledgement — Accountant; hai mốc độc lập.                                                                                                                         |
| UC-108 mới         | Record External Document References — Accountant; nguồn lịch sử/hóa đơn/hoàn tiền/đối chiếu bên ngoài.                                                                                                       |

Bảng quyền được đồng bộ cho đủ 108 mã; cả 13 retired đều không còn quyền thực hiện. Quyền xem không tự cấp quyền nhập, duyệt hoặc post. Bản đề xuất giữ ma trận nghiệp vụ tổng hợp, Report 3 giữ ma trận từng UC.

## 6. SQL: đánh giá phù hợp và bổ sung

### 6.1 Cấu trúc có sẵn phù hợp, giữ nguyên

- `app_role` có đúng OWNER, SALES, WAREHOUSE, ACCOUNTANT, ADMIN.
- `warehouse`, `location`, `user_warehouse` đã hỗ trợ nhiều kho, mã vị trí và phạm vi người dùng; không cần seed ba kho giả.
- `product_uom_version`, `document_line` đã lưu hệ số/đơn vị và snapshot để theo dõi thùng/viên/m².
- `transfer_dispatch`, `transfer_receipt`, `stock_account` đã tách xuất, nhận và transit.
- `reservation`, `posting_batch`, `stock_movement`, `available_stock` đã biểu diễn giữ hàng và ghi nhận thực xuất.
- `stocktake.mode = 'FROZEN'`, `location_lock`, snapshot/count/adjustment phù hợp D5.
- `evidence`, `document.note`, `audit_event`, `external_reference` dùng để ghi phối hợp kiểm nhận, người liên hệ NCC và kết quả bên ngoài; không cần role mới.

### 6.2 Khoảng trống và cách bổ sung

Trước cập nhật, `customer_return_line` chỉ có nguồn và lý do, chưa biểu diễn có cấu trúc các điều kiện D6. Thêm `customer_return_assessment`:

| Dữ liệu                                                          | Ý nghĩa                                                                                                                                       |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `return_line_id`, `assessment_no`, `document_version`            | Lượng/dòng được đánh giá, lần đánh giá và phiên bản hồ sơ. Tách dòng khi điều kiện từng lượng khác nhau.                                      |
| `packaging_condition`                                            | SEALED / OPENED / TORN / UNKNOWN; không đồng nghĩa quality.                                                                                   |
| `installation_status`                                            | UNUSED / INSTALLED / UNKNOWN.                                                                                                                 |
| `damage_cause`                                                   | NONE / CUSTOMER / SUPPLIER / OTHER / UNKNOWN.                                                                                                 |
| `deadline_status`, `deadline_reference`                          | WITHIN / EXCEEDED / NOT_APPLICABLE / UNKNOWN; trạng thái đã xác minh phải có căn cứ, kể cả không áp dụng thời hạn. Không có số ngày mặc định. |
| `eligibility_status`                                             | PENDING / CASE_REVIEW / INELIGIBLE. CASE_REVIEW chỉ có nghĩa đủ căn cứ để xét, chưa phải Owner đã chấp nhận.                                  |
| `assessment_reason`, `assessed_by`, `assessed_at`, `approval_id` | Lý do, người/thời điểm đánh giá và liên kết quyết định.                                                                                       |

- `ck_return_deadline_evidence`: chặn trạng thái thời hạn đã xác minh nhưng thiếu/trống tham chiếu.
- `ck_return_eligibility`: đã thi công/hỏng do khách/quá hạn không thể là CASE_REVIEW; điều kiện chưa rõ phải PENDING nếu chưa có căn cứ loại; biết chắc điều kiện loại phải INELIGIBLE.
- Unique `(return_line_id, assessment_no)` và index theo trạng thái/dòng.
- Tầng ứng dụng phải chọn đánh giá mới nhất đúng phiên bản, kiểm kết quả inspection và approval đúng hồ sơ/dòng/lượng trước GR-CR; thay điều kiện phải đánh giá/duyệt lại. DDL không tự thực hiện các kiểm tra liên bảng này.

**Bảo toàn thay đổi có sẵn:** trước lượt này SQL đã được sửa từ PostgreSQL sang SQL Server/T-SQL, gồm `wmsd.*`, `IDENTITY`, `bit`, `datetimeoffset`, filtered indexes và `GO`. Toàn bộ các dòng đang có được giữ theo đúng thứ tự; lần này chỉ chèn bổ sung. Diff với Git HEAD lớn hơn phần thay đổi của lượt này vì bao gồm chuyển đổi cú pháp có trước.

SQL tiếp tục là **DDL tham chiếu để review**, không phải schema runtime MongoDB, không phải migration đã triển khai và chưa có posting/authorization service.

## 7. Kiểm tra đã thực hiện

| Kiểm tra                          | Kết quả và giới hạn                                                                                                                                                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Giữ nguyên tài liệu gốc           | Không sửa `De_xuat_7_quy_trinh_sau_review1.md` hoặc CSV.                                                                                                                                                                                                                                               |
| Bảo toàn phần Việt không thay đổi | So sánh nguyên văn mục 3, 6, 7, 13, 14, 15 với nguồn cũ: trùng khớp. Các mục còn lại sửa tại phần có tác động hoặc thêm dữ kiện.                                                                                                                                                                       |
| Tương ứng Việt–Anh                | Đủ 16 mục đánh số, 19 bảng có cùng số dòng tương ứng, 7 BF chi tiết và 7 Mermaid mainflow mỗi bản; cùng các mã BR/UC. Đã đọc đối chiếu nội dung, không chỉ đếm mục.                                                                                                                                    |
| Catalogue / permission            | 108 mã duy nhất; 95 active, 13 retired; đủ 108 dòng quyền; mọi retired đều không có quyền.                                                                                                                                                                                                             |
| Phạm vi Report 3                  | Nội dung trước 4.1 và từ mục 5 trở đi trùng bản trước sửa. 4.3 chỉ đổi tên role và ghi chú sơ đồ cũ cần đồng bộ.                                                                                                                                                                                       |
| Draw.io                           | `validate.py --score`: 0 lỗi, 0 cảnh báo; 16 trang. IDs/lane/edge và geometry bước không đổi; chỉ tăng vùng note/page ở trang cần ghi chú dài.                                                                                                                                                         |
| Bản vẽ xuất                       | Draw.io Desktop 32.5.5 xuất thành công PDF kiểm tra đủ 16 trang và ảnh PNG; đã xem toàn bộ bố cục qua contact sheet và BF-06 Việt/Anh ở kích thước đọc được. Hai PNG BF-03B đã xuất lại.                                                                                                               |
| Cú pháp SQL                       | Microsoft ScriptDom 180.140.0, parser `TSql160Parser`: 0 lỗi, 6 batch. Đây là parse cú pháp SQL Server, không phải chạy DDL trên SQL Server.                                                                                                                                                           |
| Điều kiện trả hàng                | 20 tình huống thử các CHECK mới trong SQLite in-memory, giữ biểu thức CHECK và cung cấp hàm LEN tương thích: nguyên thùng, lẻ, bao bì rách, lỗi NCC, đã thi công, hỏng do khách, quá hạn, thiếu căn cứ và chờ xác minh đều cho kết quả mong đợi. Không thay thế kiểm thử SQL Server hoặc service thật. |
| Bảo toàn SQL trước sửa            | So sánh với bản chụp đầu lượt: chỉ có insert, không delete/replace các dòng SQL cũ.                                                                                                                                                                                                                    |
| Git                               | `git diff --check` không báo lỗi whitespace. Không stage hoặc commit.                                                                                                                                                                                                                                  |

Các script kiểm tra, bản chụp trước sửa, parser tải về và ảnh/PDF xem trước nằm trong thư mục tạm của phiên, không thêm vào repository.

## 8. Phần còn ngoài phạm vi / chưa xác minh

1. **Report 3 chưa được viết lại toàn bộ.** Người dùng yêu cầu cập nhật bảng UC trong bản `.docx.txt`; catalogue, actor và permission đã đồng bộ. Các mainflow bằng chữ, đặc tả UC chi tiết ở phần II, screen, entity/rule và hình nhúng cũ vẫn còn nội dung baseline. Ghi chú ngay trong mục 4.2/4.3 chỉ rõ các phần cũ không được dùng để khôi phục quyền/phạm vi đã retired. Cần một lượt đồng bộ toàn SRS trước khi gọi cả report là bản cuối. Không sửa Word `.docx` hay Report 1.
2. Không có SQL Server engine được dùng để chạy DDL hoặc test dịch vụ thực tế; chỉ kiểm cú pháp và biểu thức điều kiện như mục 7. Không chạy trên database có dữ liệu.
3. Không tự cập nhật ERD database draw.io hoặc tài liệu thiết kế database khác: người dùng chỉ chỉ định SQL và mainflow, và ERD đang là file chưa theo dõi có trước lượt này.
4. Chưa xác minh số kho chính xác/danh sách/địa chỉ, số người từng kho, actual calibre, hệ số từng SKU, thời hạn nhận trả và lịch đối chiếu MISA. Giữ các mục này ở trạng thái cần xác minh.
5. Các liên kết SAP/MISA và hướng dẫn hóa đơn được kế thừa từ đề xuất gốc; lượt này không tái xác minh toàn bộ nguồn trực tuyến hoặc quy định thuế. Không coi đó là tư vấn pháp lý được cập nhật.
6. Các file có sẵn chưa theo dõi `docs/03_thiet_ke/WMSD_database_design.drawio`, `docs/03_thiet_ke/debug.log` và CSV khảo sát được giữ nguyên. Không thu dọn hoặc gán chúng là sản phẩm của lượt này.

## 2026-10-29 — BE UC-35 / UC-36

- Added the implementation/API handoff document at `src/modules/location-movements/README.md` and linked it from the root README.
- Updated the BE context entries for UC-35/36 to point at the implemented routes. Business scope and permissions remain unchanged; FE mock screens are not represented as HTTP-integrated.
- Documented additive task-source fields and the Location planning guard in `src/models/CHANGELOG.md`, including future cross-module guard obligations and replica-set tests.

Kiểm chứng đợt native 06/11: [báo cáo](docs/08_api/ITERATION1_NATIVE_VERIFICATION.md), 75 pass/9 skip/0 fail cho bộ test hiện hành. Hai test legacy untracked không import được module đã bị main xóa, được giữ nguyên. Không ghi Atlas, commit/push hoặc merge commit.

## 09/11/2026 — Gộp GoodsReceipt trên BE

- Theo kế hoạch được duyệt, thay bốn model/collection phiếu nhập bằng `GoodsReceipt`/`goods_receipts` và năm `documentKind`; giữ ID, nguồn, chứng cứ, Decimal128, quy cách, header, trường riêng và lịch sử nhúng. `CustodyReceipt` giữ riêng. Seed sạch chuyển fixture cũ sang collection chung, giữ liên kết.
- API đọc tách theo loại ở `/api/goods-receipts`; lệnh nhận vẫn ở luồng nguồn. Quyền giao thất bại tách khỏi khách trả. `OTHER` có nháp, chứng cứ, Owner duyệt phiên bản, Warehouse ghi sổ/Bỏ ghi và phiếu thay thế. Gỡ `/api/purchase-receipts` và hai lệnh duyệt/post đảo cũ không còn dùng; giữ API chứng cứ, kiểm nhận, giữ hộ và putaway.
- Cập nhật [Model Map](MODEL_MAP.md), [Data Dictionary](docs/03_thiet_ke/DB_Current_2026-11-09_57/WMSD_Data_Dictionary.md), [API](docs/08_api/GOODS_RECEIPTS.md), [seed](docs/09_phat_trien/SEED_CUA_HANG_GACH.md), quyền seed và Model Changelog. Chưa đổi FE trong lượt này; người dùng sẽ tự seed sau reset DB test đúng phạm vi.
- Kiểm tra: `npm test` đạt 81 pass/59 skip/0 fail; HTTP MongoDB riêng cho năm loại và hai nhánh thay thế `OTHER` đạt; kiểm thử tích hợp mua 9 pass và khách trả/giao thất bại 17 pass; `npm run docs:check` đạt 57 collection.

## 12/11/2026 — Tổng quan và bộ lọc danh sách BF03/BF04

- Nguồn: người dùng yêu cầu thiết kế lại trang chuyển kho/chuyển vị trí với số đơn chưa hoàn thành, STT, mã đơn, tìm kiếm và bộ lọc/sắp xếp kho/trạng thái/ngày tạo.
- API đọc bổ sung thống kê toàn scope, kho từ đơn được phép xem, tìm mã literal, lọc ngày và sort allowlist; FE phân trang server, tổng quan tách khỏi kết quả lọc, tạo đơn thu gọn. Không đổi schema, migration, quyền, lệnh ghi hoặc hiệu ứng tồn; không ghi dữ liệu remote.
- File: shared/utils/movement-list.js; validation/service của location-movements và transfer-read; FE MovementList/useMovementFilters, hai list pages, DTO/presentation và workspace.css. Hợp đồng hiện hành đã cập nhật tại location-movements/README.md và transfers/BF04_API.md.
- Kiểm chứng: 4 tests backend (có aggregate thật trên database thử local tách biệt, sau đó xóa DB thử); 8 tests FE liên quan đạt; build FE đạt. Không xác nhận lại toàn chuỗi ghi BF03/BF04 từ các kiểm thử đọc này.

## 12/11/2026 — Tách trang tạo và cập nhật chuyển hàng

- Nguồn: người dùng yêu cầu tạo đơn chuyển vị trí/chuyển kho sang trang riêng, xem/cập nhật trên trang riêng với header và thông tin dễ đọc.
- FE thêm routes create cho BF03/BF04 và edit cho BF03; danh sách chỉ còn tổng quan/bộ lọc/bảng. Chi tiết có breadcrumb, header/trạng thái, metadata và bảng hàng. Sửa BF03 vẫn giới hạn creator/OPEN/permission. BF04 giữ các cập nhật workflow trên detail, không thêm API sửa TR.
- File: routes.config.ts, location-moves/live/pages.tsx và MoveForm.tsx, transfers/live/TransferFlowPage.tsx và TransferCreatePage.tsx, MovementDocumentHeader.tsx, workspace.css, context FE; đã bổ sung hướng dẫn UX vào hai hợp đồng hiện hành.
- Kiểm chứng: build đạt; 14 tests FE liên quan đạt (tạo → detail, retry giữ nguyên payload, edit guard, form hàng, list, quyền route); lint file sửa đạt. Đã xem trang tạo và chi tiết BF03, trang tạo BF04 trên trình duyệt local. Không ghi dữ liệu remote, không đổi model/API/stock; kiểm tra hiển thị không xác nhận lại toàn bộ chuỗi ghi tồn.

Bổ sung kiểm tra UX cùng lượt: đơn chuyển kho COMPLETED không hiển thị các form xuất/nhận/cất/đóng tiếp; các form thực hiện chỉ xuất hiện khi APPROVED. Kiểm thử detail hoàn tất đạt, nâng tổng kiểm thử FE liên quan trong lượt lên 15. Đã xem thêm detail BF04 và form tạo BF04 ở 390px.

## 12/11/2026 — Menu phân cấp cho mọi vai trò

- Theo yêu cầu người dùng mở rộng mẫu menu của thủ kho: FE MainLayout dùng roleNavigation.tsx để gom entry đã kiểm quyền cho Owner, Sales, Accountant, Admin, Warehouse và role tùy chỉnh. AppSidebar dùng caption theo role, trạng thái accordion tách theo role, tự mở nhánh active và ẩn nhóm rỗng.
- Không thay route, API, quyền, dữ liệu hoặc stock effects. Các mục ngoài phân loại được giữ trong Chức năng khác; mỗi entry xuất hiện đúng một lần. context FE đã ghi hành vi mới.
- Kiểm chứng: build đạt; 24 tests menu/route/quyền/logout/responsive đạt; lint các file sửa đạt. Đã xem menu Owner và Warehouse trên trình duyệt local, không tuyên bố browser E2E cho mọi tài khoản.

## 12/11/2026 — Đổi thương hiệu hiển thị sang Tân Thương

- Nguồn: người dùng yêu cầu đổi meta/title và mọi chữ WMSD trên giao diện thành Tân Thương; đồng bộ tên Ceratile ERP cũ trong FE.
- Đổi config branding, header/logo, auth, nội dung trang, biểu mẫu in, tiêu đề email và CSV. index.html có title Tân Thương, meta description/application-name/Open Graph/Twitter, lang vi và viewport; public/erd.html đổi tên trang. README/context FE ghi vị trí cấu hình và phạm vi tương thích.
- Không đổi API, model, email/tên đăng nhập hoặc các khóa localStorage; không migrate dữ liệu/ghi remote. Các định danh kỹ thuật lịch sử trong tài liệu vẫn giữ vai trò truy vết.
- Kiểm chứng: build FE đạt, 11 tests auth/layout/logout/responsive đạt, diff check đạt; title tab và header đã hiển thị Tân Thương trong trình duyệt local.
# 15/11/2026: BF04 điều chuyển liên kho theo luồng tách bước

FE tạo TR chỉ chọn kho nguồn/kho đích, sản phẩm, lô và đơn vị quy đổi; options BF04 trả các quy đổi hiện hành để nhập theo viên, thùng hoặc pallet khi đã cấu hình. Sau khi SO/Owner duyệt, màn chi tiết tạo phiếu xuất trước, sau đó mới tạo và xác nhận TO lấy hàng; nhận/kiểm, TO cất hàng, đối soát và tạo đợt xuất tiếp theo giữ nguyên hợp đồng native. Cập nhật `src/modules/transfers/transfer-read.service.js`, `src/features/transfers/live/TransferCreatePage.tsx`, `TransferFlowPage.tsx` và DTO FE. Không đổi schema hay cách post tồn. Đã chạy FE typecheck và test BF04 liên quan; chưa chạy browser trực quan hoặc test tích hợp MongoDB.

## 14/11/2026 - Đơn vị diện tích (M2) tự quy đổi và làm tròn tới viên

- **Lý do**: gạch 600×600 có hệ số `2.777777777778` nên mọi lượng nhập theo M2 bị từ chối (quá 6 số lẻ) và backfill bỏ qua cỡ này. Thực hiện theo kế hoạch người dùng chốt ngày 14/11/2026.
- **Model/BE**: `uoms.areaMm2` (bất biến, tùy chọn); `POST /api/uoms` nhận, `PUT` từ chối. `areaFactor`, `toBaseQuantity`, `syncAreaConversions` trong `shared/utils/conversions.js`; `makeItem` và `previewQuantity` làm tròn `ceil(round(qty × factor, 6))` khi đơn vị nhập là đơn vị diện tích và sản phẩm `wholeBaseUnits`. `createProduct`/`updateProduct` tự sinh quy đổi diện tích (không ghi đè bản nhập tay). Options RR và chi tiết RR trả `areaMm2`/`wholeBaseUnits`. `currentConversions` sắp xếp ổn định theo `uomId`.
- **Migration**: `src/migrations/conversions.js` dùng `uoms.areaMm2`, bỏ `areaCodes`/`pieceCodes`; `--apply` gán `areaMm2 = 1000000` cho M2/M². Seed rebuild: UOM `M2` có `areaMm2`.
- **FE**: form/danh sách UOM có "Diện tích (mm²)" (chỉ đọc khi sửa); duyệt RR, tổng duyệt và gợi ý "≈ N Viên" làm tròn giống BE. Modal tạo/sửa PO quy đổi ngược từ `qtyBase` bằng `enteredFromBase`, không để lượng nhập làm tròn lên khiến BE nâng `qtyBase` quá số đã duyệt (ví dụ cỡ 600,125×600).
- **Tài liệu**: MODEL_MAP, Data Dictionary/schema.json 2026-11-12_58, CONVERSIONS, CONVERSION_BACKFILL, CHANGELOG model.
- **Chưa làm**: làm tròn tới thùng, sửa tay số viên, bảng cấu hình, `--apply` trên DB thật.

## 14/11/2026 - Bỏ tách dòng PO; dòng PO theo M2

- **Quyết định người dùng 14/11/2026**: bỏ việc tách một dòng RR thành nhiều dòng PO (phương án ngày 13/11). Việc tách theo lô diễn ra khi kiểm hàng và nhập kho, đã có sẵn. Giữ ghi chú dòng PO (`lines[].note`).
- **BE**: `draftItems` trả 400 "Gộp lượng của cùng dòng RR" khi một dòng RR xuất hiện hai lần (quy tắc trước 13/11), bỏ kiểm tổng theo nhóm và kiểm trùng ID dòng. Dòng PO dùng `toBaseQuantity` nên M2 được làm tròn tới viên và so với `approvedQtyBase`. Phát hành PO giữ kiểm tổng lượng gốc theo dòng RR cho PO nháp cũ. `copyItem` và `document-item.schema.js` chấp nhận `qtyBase` đã làm tròn tới viên (cần cho mọi chứng từ M2).
- **FE**: modal tạo PO bỏ nút "Tách dòng"/"Xóa dòng", nhãn "Dòng n/m" và tổng nhóm; dòng M2 tính "còn được đặt" với 6 chữ số. Modal sửa PO bỏ nút "Tách dòng"; PO nháp cũ có nhiều dòng cùng dòng RR bị chặn khi lưu cho tới khi xóa dòng thừa. Bỏ `suggestRemainingQtyForSplit`.
- **Tài liệu**: phiếu duyệt 13 (mục đặt PO, `note`), NATIVE_MODEL_RUNTIME, CONVERSIONS.
- **Dữ liệu**: không migration. PO nháp đã tách dòng phải gộp lại trước khi lưu; PO đã phát hành giữ nguyên.
- **Kiểm thử**: BE `RUN_NATIVE_API_TESTS=1 npm test`; FE test PO. Chưa kiểm trực quan trình duyệt.
## 23/11/2026 — Gỡ Dockerfile backend

Theo yêu cầu người dùng, gỡ Dockerfile của BE và cập nhật hướng dẫn chạy bằng `npm run dev`.

## 25 November 2026 — Database design descriptions and diagram corrections

- Reason: the user asked to correct the differences found between Report 4 §I.3, the ten group tabs of the MongoDB overview and the current schemas and services.
- Report 4 §§3.4–3.10: 25 table rows corrected. Fixed the transfer request warehouse field names; limited stock discrepancies to transit shortages; stated that a quality change can move stock to another location; corrected the opening stock uniqueness scope, goods issue states, requirement-to-Transfer Order cardinality, goods-issue picking tasks and the `header.planId` target; added missing warehouse and business foreign keys. The lists still omit some user, product, batch and embedded-line references; the relationship table remains the full list.
- Diagram: `scripts/generate-db-overview.mjs` now draws `internal_transfer_requirements` → `transfer_orders` as 0..1 ↔ 0..1 (partial unique index) and adds `stock_transactions` → `operation_records`, `approval_history` → `operation_records` and `sales_goods_issues` → `failed_deliveries`, for 70 connectors. The "Kho và tồn kho" tab gains an `operation_records` key card. Regenerated the overview diagram and relationship table; re-exported the overview PNG (3258×4787, diagram embedded).
- No model, API, permission or data change.
- Checks: `node scripts/generate-db-overview.mjs --check` and `--full --check` pass; a read-only script found every checked foreign key path of the 61 table rows in the Mongoose schemas; the changed group tabs and the overview PNG were inspected; `npm run docs:check` was run. Application tests were not run.

## 24/11/2026 — Khôi phục Docker dev cho BE và FE, tách riêng, không nginx

- **Lý do**: người dùng yêu cầu chạy dự án bằng Docker với backend và frontend tách riêng, không dùng nginx. Các Dockerfiles đã bị xóa trong đợt chuyển deploy Cloudflare Workers ngày 23/11; `docker-compose.yml` root vì thế bị hỏng (`failed to read dockerfile`).
- **File**: thêm `building-material-management/Dockerfile` (`node:22-alpine`, `npm ci`, `npm run dev`, `PORT=3000`) và `frontend/Dockerfile` (`node:22-alpine` + pnpm 11.27.0, `pnpm exec vite --host 0.0.0.0 --port 3334`). Viết lại `docker-compose.yml` root: bỏ `target: dev`, bỏ `dockerfile: Dockerfile.dev`, bỏ `depends_on`, bỏ biến `AUTO_SEED` (không có code nào đọc), đặt proxy `VITE_API_PROXY_TARGET` qua `host.docker.internal:3300` và cho phép override bằng biến môi trường. Không dùng nginx ở runtime.
- **Hành vi**: chạy riêng bằng `docker compose up -d --build api` và `docker compose up -d --build web`; host `3300` → API, host `3334` → Vite. `PORT=3000` trong compose ghi đè `PORT=3333` của `.env` local để khớp mapping. Secret vẫn nằm ở `.env`, bị `.dockerignore` loại khỏi image.
- **Dữ liệu**: không seed, không migrate, không ghi DB ngoài luồng ứng dụng thông thường. Backend kết nối đúng `MONGODB_URI` hiện có trong `.env`. Không sửa `.env`, không thêm secret, không commit/push.
- **Tài liệu**: viết lại `git_doc/docs/09_phat_trien/DOCKER.md` theo cấu hình mới; phần verification 17/11 được giữ nhãn historical.
- **Kiểm chứng**: `docker compose config --quiet` đạt; build riêng 2 image đạt; 2 container Up; `/api/health` trả `status: ok` trực tiếp và qua proxy `3334`; web trả HTTP 200; `/api/auth/me` trả 401; log backend báo `Connected to MongoDB.` Reviewer UI xác nhận trang login render ổn ở 1280×720 và 390×844, không lỗi console.
- **Hạn chế**: chưa chạy luồng nghiệp vụ đăng nhập/tạo chứng từ; `.env` đang thiếu `JWT_SECRET`/`REFRESH_TOKEN_SECRET` nên code dùng secret mặc định (cần người quản lý bổ sung); port publish bind `0.0.0.0` chỉ phù hợp local; thư mục `frontend/nginx/` còn lại nhưng không được image dùng.

## 24/11/2026 — Hoàn thiện đặc tả use case của bachhm và sửa lỗi trùng mã vai trò

- **Lý do**: người dùng yêu cầu rà các task của bachhm trong `Project_Tracking.xlsx` (UC-126…UC-153 theo số của file tracking) và hoàn thiện phần còn thiếu. Code BE/FE của cả 28 use case đã có; phần thiếu là đặc tả chi tiết trong Report 3 và một lỗi khi tạo vai trò trùng mã. Người dùng chốt: không tạo file test mới, không làm scheduler cho kế hoạch kiểm kê, đánh số theo catalogue hiện hành trên `main`.
- **Report 3** (`docs/01_bao_cao/WMSD_Report3_Fix.docx.txt`): viết lại phần đặc tả chi tiết FE-08 thành UC-127…UC-143 theo đúng catalogue/permission matrix đã đánh số lại (thêm Record Stocktake Difference Reason, Request Recount, Approve Stocktake Differences theo luồng 22–23/11, Cancel Session, 6 use case kế hoạch kiểm kê; các use case giải quyết chênh lệch cũ được ghi là retired). Phần FE-09 của bachhm thành UC-144…UC-154 (tách UC-112 cũ thành View Role List, Create Role, Update Role Permissions; chuyển Reset Own Password thành UC-145 và bỏ nhãn "Implementation: Pending"). Mỗi mục có `Project tracking: UC-xxx` để tra sang file tracking. Cập nhật bảng màn hình và mục SC-01, SC-02, SC-14, SC-15 (nay là Stocktake Plans), SC-20.
- **Code**: `src/modules/roles/role.service.js` — `createRole` bắt lỗi khóa trùng (E11000) của chỉ mục unique `code` và trả 409 `ERR-CORE-409-002` "Mã vai trò đã tồn tại" thay vì 500. Không đổi model, chỉ mục, quyền hay dữ liệu.
- **Tài liệu khác**: `NATIVE_MODEL_RUNTIME.md` (409 khi trùng mã vai trò); trạng thái Reset Own Password đã triển khai trong `PROJECT_GUIDE.md`, `WMSD_Report4_Draft.md`, `docs/rtm.md` và `../frontend/docs/rtm.md`. UC-132 (Administrator yêu cầu OTP) vẫn chờ triển khai.
- **Kiểm chứng**: `npm run docs:check` đạt; `node --check` file service; kiểm tra ad-hoc bằng stub (không DB): trùng mã → 409, lỗi khác giữ nguyên, tạo bình thường vẫn trả role; `node --test test/forgot-password-otp.test.js` 5/5 đạt; FE `vitest run src/features/auth/ForgotPasswordPage.test.tsx` 4/4 đạt.
- **Sau review độc lập**: sửa phạm vi phiên ad-hoc (chỉ vị trí, mã khu chỉ dùng cho kế hoạch), bằng chứng bắt buộc cho hàng phát hiện ngoài sổ và khi sửa xác nhận vị trí trống, Reconcile chỉ cho người đếm được phân công, kích hoạt bị chặn cả khi còn giữ chỗ, chi tiết kế hoạch chỉ có thông tin tạm dừng/tiếp tục/kết thúc gần nhất; bỏ tham chiếu BF-05 cũ khỏi UC-136 và cập nhật EX-04 theo luồng duyệt chênh lệch. "Initiate User Password Reset as Administrator" không còn trong catalogue nên đổi từ UC-132 (trùng với Record Stocktake Count) sang UC-160 và cập nhật các tham chiếu, kể cả dòng UC-132 trong hai RTM.
- **Bổ sung cùng ngày (yêu cầu "sửa nốt")**:
  - Audit vai trò: `createRole` ghi `CREATE_ROLE`, `updateRolePermissions` ghi `UPDATE_ROLE_PERMISSIONS` (quyền trước/sau) với người thực hiện lấy từ `req.user` (`role.controller.js`); thêm nhãn tiếng Việt trong `ACTION_LABELS` của `audit-log.service.js`; ghi trong `SYSTEM_ADMIN.md` và `NATIVE_MODEL_RUNTIME.md`. Không đổi model hay chỉ mục.
  - Report 3: hết trùng số giữa các mục chi tiết. Mục FE-06 "Record Customer Receipt Evidence on Goods Issue" (UC-129 cũ) đổi thành UC-105 "Confirm Customer Delivery with Photo Evidence" theo catalogue; "Confirm Full External Payment Receipt" (UC-130 cũ, chưa có trong catalogue nhưng còn trong code) đổi thành UC-161; hai mục WIR đã retired UC-127/128 ghi "Former UC-127/128". Cập nhật mọi tham chiếu tương ứng (BF-06, bảng thực thể, DR-10, SC-17, SC-31, BR-14…BR-33, UC-123).
  - Report 3: viết lại BF-05 (luồng chính và bảng nhánh) theo luồng kế hoạch/phiếu/lý do/đếm lại/duyệt chênh lệch hiện hành; thay các tham chiếu tới use case giải quyết chênh lệch cũ (UC-93…UC-105, UC-121) và tài khoản cũ (UC-109…UC-111) trong BF-02/03, sơ đồ dữ liệu, bảng thực thể, DR-02/08/09/14, BR-03/05/19/21/22/23/24/25/30 và các mục hàng lỗi UC-76…UC-78, SC-11 bằng số mới; mục lục ghi 159 use case của catalogue cùng UC-160/UC-161 chờ đưa vào catalogue. Sau lần review thứ ba: năm mục WIR đã retired ghi "Former UC-124…128"; nhãn khóa của `STOCKTAKE_RESOLUTION` trong sơ đồ dữ liệu ghi là lịch sử (đã ngừng 22/11/2026); BR-05 nêu đúng quy tắc người đếm không được tự duyệt chênh lệch.
- **Kiểm chứng bổ sung**: `node --check` các file đổi; kiểm tra ad-hoc bằng stub (không DB) ghi đúng 2 bản audit (người thực hiện, đối tượng `roles`, quyền trước/sau); `node --test test/system-admin.test.js` 7/7 đạt; `npm run docs:check` đạt; không còn tiêu đề use case trùng số trong Report 3.
- **Hạn chế còn lại**: các mục chi tiết và tham chiếu của nhóm khác vẫn dùng số cũ khác với catalogue (ví dụ customer return UC-79…UC-86, defect UC-73…UC-78, supplier return UC-88…UC-92, stock movement UC-114…UC-116, UC-117…UC-120, UC-122/123), nên nhiều dòng BF/DR/BR đang trộn số cũ và số mới; không còn trùng tiêu đề nhưng cần một đợt đánh số lại toàn bộ phần chi tiết theo catalogue; kế hoạch kiểm kê, hủy phiên, `GET/POST /users`, `POST /roles`, `PUT /roles/:code/permissions` và chọn lý do chênh lệch (FE) vẫn chưa có test tự động theo quyết định không tạo test mới; không chạy test cần MongoDB.
25/11/2026 — Customer Return sources from posted Goods Issues expose the actual active issue lots and per-lot remaining claim. Sales can split one source across those lots; the backend validates and retains each lot through receipt. Add an explicit private local evidence provider for isolated demos with no Cloudinary credentials; Cloudinary remains the default. Current contracts: `docs/08_api/GOODS_ISSUES.md`, `docs/08_api/RETURN_WORKFLOWS_NATIVE.md`.
## 26/11/2026 — Xuất bán độc lập và demo bán 8 → trả khách 4 → trả NCC 4

- Backend cho phép Sales tạo `SALE` bằng mã đơn ngoài, tùy chọn snapshot tên/SĐT khách; Owner khác duyệt cùng phiếu; Kho chọn lô khi soạn và ghi xuất trừ tồn một lần.
- Lookup nguồn khách trả tìm theo số PXB hoặc mã ngoài, trả lô và lượng còn được trả; Customer Return kế thừa snapshot khách của phiếu nguồn. Luồng supplier return giữ agreement/dispatch/ACK hiện hành và được kiểm chứng với lô khác.
- FE hiển thị form Sale, quy đổi lượng nhập → lượng gốc, snapshot khách, source reference/lot/remaining quantity và giữ ẩn Sales Order nội bộ.
- Backend direct-sales 1/1 và return-workflows 22/22 đã đạt; FE typecheck/build và docs check đạt. Focused UI tests 27/32, còn 5 lỗi jsdom/Ant Design interaction; chưa browser visual run.

## 26/11/2026 — FE giữ định danh dòng nguồn và làm mới danh sách sản phẩm khi đổi kho

- **Lý do:** chạy lại bộ kiểm tra luồng bán → khách trả cho thấy form trả hàng hiển thị đúng nguồn nhưng dòng thêm vào `Form.List` không luôn mang `salesIssueLineId`/`originLineId`; màn tạo phiếu xuất cũng đọc snapshot dòng cũ khi kho vừa đổi.
- **Hành vi sau:** khi thêm dòng nguồn, FE ghi định danh dòng vào payload tương ứng với loại đề nghị; khi đổi kho, bộ chọn sản phẩm dùng field hiện tại của `Form.List` để loại trừ trùng và cho phép chọn lại sản phẩm có tồn ở kho mới.
- **Phạm vi:** chỉ FE tại `sales-returns-fe/src/features/return-workflows/create.tsx` và `sales-returns-fe/src/features/goods-issues/GoodsIssueCreatePage.tsx`; không đổi API, model, quyền, tồn kho hay migration.
- **Kiểm chứng:** FE `npm run typecheck` đạt. Bộ test tập trung vẫn ghi nhận 5 lỗi jsdom/Ant Design/fixture bắt buộc tên khách; không đánh dấu chúng là pass. Backend full-flow 8 → 4 → supplier 4 giữ nguyên bằng chứng trong test hiện hành.
- **Tài liệu chính:** cập nhật `git_doc/docs/09_phat_trien/TRUNG_SALES_RETURNS_IMPLEMENTATION_PLAN.md` cùng mục này.

## 26/11/2026 — Đồng bộ tài liệu luồng bán, trả khách và trả NCC (BE + FE)

- **Lý do & phạm vi:** Đối chiếu tài liệu với `main` mới nhất của BE và FE sau khi hoàn tất demo và các sửa lỗi biểu mẫu. Cập nhật mô tả hiện hành; giữ quyết định 16–17/11 dưới dạng lịch sử có ngày rõ ràng. Không đổi code runtime, API, model, quyền, database hay migration.
- **Tài liệu BE:** `git_doc/PROJECT_GUIDE.md`, `git_doc/README.md`, `git_doc/docs/08_api/GOODS_ISSUES.md`, `git_doc/docs/08_api/RETURN_WORKFLOWS_VERIFICATION.md`, `git_doc/docs/09_phat_trien/SIMPLIFIED_SALES_SETUP.md`.
- **Tài liệu FE:** `context.md`, `DESIGN.md`, `docs/rtm.md`, `docs/ai-log.md` trong repository FE.
- **Hợp đồng được đồng bộ:** Sales Order mới dùng lịch giao và giữ tồn FIFO; SALE độc lập dùng mã đơn ngoài, Sales gửi, Owner khác duyệt cùng phiếu, Kho chọn lô khi soạn và ghi xuất. Trả khách lấy phiếu xuất/lô nguồn và hạn mức còn lại; kiểm hàng không đổi tồn, chỉ phần Sales chấp nhận mới ghi nhập. Trả NCC ghi giảm tồn khi bàn giao; `ACK_SR` và đóng/đối chiếu không ghi sổ lần hai. Demo 8 → 4 → 4 dùng lô nguồn khác cho phần trả NCC.
- **Tài liệu giao diện:** ghi nhận quy tắc cách tối thiểu 16px giữa cụm ghi chú/trường cuối và hàng nút; cập nhật RTM cho UC-71/72 và UC-79–92 theo phần đã triển khai, giữ trạng thái kiểm chứng `Partial` khi còn giới hạn.
- **Pull request:** BE #40–#44 và FE #36–#39 được merge riêng từng file. Không có thay đổi dữ liệu hoặc triển khai production.
- **Kiểm chứng:** BE `npm run docs:check` đạt với 1.235 liên kết nội bộ; `git diff --check` đạt. Không chạy FE tests hoặc kiểm tra trình duyệt cho các thay đổi tài liệu. Kết quả demo FE ngày 25/11 vẫn là 27/32, còn 5 lỗi tương tác jsdom/Ant Design; không có visual review cho acceptance run đó.
- **Giới hạn CI:** Backend CI trên các PR tài liệu báo lỗi ở test/fixture hiện có (thiếu export `evidenceStorage` và kỳ vọng cũ rằng SALE phải có Sales Order). Các thay đổi ở đây chỉ là tài liệu; không sửa code hoặc test để che các lỗi đó.

