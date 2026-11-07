---
id: DOC-CODE-IT1-REFERENCE-20261105
title: "Đường dẫn, bộ kiểm tra và model"
version: 1.0.0
phase: Review
domain: Iteration1
tags: [backend, model, route, validation]
last_updated: 2026-11-05
---

# Đường dẫn gọi hàm, bộ kiểm tra và model

[Mục lục](./README.md). Các bảng được lấy từ khai báo source hiện tại; import model để đọc schema không kết nối hoặc ghi MongoDB.

## 1. Từ đường dẫn API tìm hàm

Mọi đường dẫn có tiền tố `/api`. Các route dùng `authenticate` chung trước khi đi vào service. Quyền nghiệp vụ có thể nằm ở middleware hoặc trong service; bảng này không tự kết luận cứ có route là mọi người được dùng.

| Gửi yêu cầu | Hàm xử lý được gọi từ route | Source route |
|---|---|---|
| `GET /api/products/options` | [options()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-1) | [dòng 12](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:12) |
| `GET /api/products` | [list()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-0) | [dòng 18](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:18) |
| `POST /api/products` | [create()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-3) | [dòng 24](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:24) |
| `GET /api/products/:id/warehouse-policies` | [policies()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-8) | [dòng 30](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:30) |
| `PUT /api/products/:id/warehouse-policies/:warehouseId` | [configurePolicy()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-9) | [dòng 36](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:36) |
| `GET /api/products/:id/conversions` | [conversions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-6) | [dòng 42](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:42) |
| `POST /api/products/:id/conversions` | [createConversion()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-7) | [dòng 48](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:48) |
| `GET /api/products/:id` | [detail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-2) | [dòng 54](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:54) |
| `PUT /api/products/:id` | [update()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-4) | [dòng 60](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:60) |
| `PATCH /api/products/:id/status` | [changeStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/02-products.md#fn-5) | [dòng 66](D:/Ky_9/SEP490/src/be/src/modules/products/product.routes.js:66) |
| `GET /api/lots` | [list()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-38) | [dòng 12](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.routes.js:12) |
| `POST /api/lots` | [create()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-40) | [dòng 18](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.routes.js:18) |
| `GET /api/lots/:id/movements` | [movements()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-42) | [dòng 24](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.routes.js:24) |
| `GET /api/lots/:id` | [detail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-39) | [dòng 31](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.routes.js:31) |
| `PUT /api/lots/:id` | [update()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/03-lots.md#fn-41) | [dòng 37](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.routes.js:37) |
| `GET /api/suppliers` | [list()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-69) | [dòng 12](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:12) |
| `GET /api/suppliers/names` | [getNames()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-76) | [dòng 19](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:19) |
| `POST /api/suppliers` | [create()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-71) | [dòng 21](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:21) |
| `GET /api/suppliers/:id/history` | [history()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-74) | [dòng 27](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:27) |
| `GET /api/suppliers/:id/documents` | [documents()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-75) | [dòng 33](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:33) |
| `GET /api/suppliers/:id` | [detail()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-70) | [dòng 39](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:39) |
| `PUT /api/suppliers/:id` | [update()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-72) | [dòng 45](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:45) |
| `PATCH /api/suppliers/:id/status` | [changeStatus()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/04-suppliers.md#fn-73) | [dòng 51](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.routes.js:51) |
| `GET /api/replenishments/options` | [options()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-147) | [dòng 13](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:13) |
| `GET /api/replenishments` | [listReplenishments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-145) | [dòng 18](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:18) |
| `POST /api/replenishments` | [create()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-148) | [dòng 24](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:24) |
| `GET /api/replenishments/:id/submissions` | [submissions()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-152) | [dòng 30](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:30) |
| `GET /api/replenishments/:id/submissions/:version` | [submission()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-153) | [dòng 36](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:36) |
| `POST /api/replenishments/:id/submit` | [submit()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-150) | [dòng 42](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:42) |
| `POST /api/replenishments/:id/review` | [review()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-151) | [dòng 48](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:48) |
| `GET /api/replenishments/:id` | [getReplenishment()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-146) | [dòng 54](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:54) |
| `PUT /api/replenishments/:id` | [update()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/05-replenishments.md#fn-149) | [dòng 60](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.routes.js:60) |
| `POST /api/purchase-orders` | [createPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-187) | [dòng 14](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:14) |
| `PUT /api/purchase-orders/:id` | [updatePurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-188) | [dòng 15](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:15) |
| `POST /api/purchase-orders/:id/confirm` | [confirmPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-189) | [dòng 16](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:16) |
| `POST /api/purchase-orders/:id/amendments` | [amendPurchaseOrder()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-190) | [dòng 17](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:17) |
| `POST /api/purchase-orders/:id/supplier-confirmations` | [supplierConfirmation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-191) | [dòng 19](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:19) |
| `POST /api/purchase-orders/:id/close-requests` | [requestClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-192) | [dòng 21](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:21) |
| `POST /api/purchase-orders/:id/close-approvals` | [approveClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-194) | [dòng 22](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:22) |
| `POST /api/purchase-orders/:id/close-executions` | [executeClose()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-195) | [dòng 23](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:23) |
| `GET /api/purchase-orders` | [list()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-197) | [dòng 10](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.routes.js:10) |
| `GET /api/purchase-orders/:id` | [get()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/06-purchase-orders.md#fn-198) | [dòng 20](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.routes.js:20) |
| `GET /api/po-inspections/:id/history` | [receivingHistory()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-292) | [dòng 34](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:34) |
| `POST /api/po-inspections/:id/cancel` | [cancelDraft()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-228) | [dòng 35](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:35) |
| `POST /api/po-inspections/:id/corrections` | [replaceInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-259) | [dòng 36](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:36) |
| `GET /api/po-inspections` | [listDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-288) | [dòng 37](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:37) |
| `GET /api/po-inspections/:id` | [getDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-286) | [dòng 38](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:38) |
| `PUT /api/po-inspections/:id` | [updateInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-225) | [dòng 39](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:39) |
| `POST /api/po-inspections/:id/confirm` | [confirmInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-226) | [dòng 40](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:40) |
| `POST /api/purchase-receipts/:id/cancel` | [cancelDraft()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-228) | [dòng 42](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:42) |
| `PATCH /api/purchase-receipts/:id/destinations` | [changeDestinations()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-229) | [dòng 43](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:43) |
| `GET /api/purchase-receipts/:id/putaway-context` | [putawayContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-277) | [dòng 44](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:44) |
| `POST /api/purchase-receipts/:id/putaway-tasks` | [createPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-278) | [dòng 45](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:45) |
| `GET /api/purchase-receipts/:id/reversal-preflight` | [reversalPreflight()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-257) | [dòng 46](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:46) |
| `POST /api/purchase-receipts/:id/reverse` | [reverseReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-258) | [dòng 47](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:47) |
| `GET /api/purchase-receipts` | [listDocuments()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-288) | [dòng 48](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:48) |
| `GET /api/purchase-receipts/:id` | [getDocument()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-286) | [dòng 49](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:49) |
| `POST /api/purchase-receipts/:id/post` | [postReceipt()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-227) | [dòng 50](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:50) |
| `GET /api/purchase-orders/:id/receiving-operations/:key` | [receivingOperation()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-231) | [dòng 52](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:52) |
| `GET /api/purchase-orders/:id/receiving-summary` | [receivingSummary()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-289) | [dòng 53](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:53) |
| `GET /api/purchase-orders/:id/receiving-trips` | [receivingTrips()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-290) | [dòng 54](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:54) |
| `GET /api/purchase-orders/:id/inspection-context` | [inspectionContext()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-230) | [dòng 55](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:55) |
| `POST /api/purchase-orders/:id/inspections` | [createInspection()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-224) | [dòng 56](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:56) |
| `GET /api/putaway-tasks/:id` | [getPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-280) | [dòng 58](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:58) |
| `POST /api/putaway-tasks/:id/confirm` | [confirmPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-281) | [dòng 59](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:59) |
| `POST /api/putaway-tasks/:id/cancel-remainder` | [cancelPutaway()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-282) | [dòng 60](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:60) |
| `GET /api/purchase-receiving/queue` | [receivingQueue()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-291) | [dòng 62](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:62) |
| `GET /api/purchase-documents/:id/history` | [receivingHistory()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-292) | [dòng 64](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:64) |
| `GET /api/purchase-documents/:id/evidence` | [listEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-270) | [dòng 65](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:65) |
| `POST /api/purchase-documents/:id/evidence/uploads` | [uploadEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-267) | [dòng 67](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:67) |
| `POST /api/purchase-documents/:id/evidence/attach` | [attachEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-268) | [dòng 68](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:68) |
| `GET /api/purchase-documents/:id/evidence/:evidenceId/download` | [downloadEvidence()](D:/Ky_9/SEP490/src/be/docs/iteration-1/function-guide-2026-11-05/07-receiving.md#fn-271) | [dòng 69](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:69) |

## 2. Tên gọi và alias cần phân biệt

- `id` trong purchase-core chỉ là tên khác của `idString`, không phải query tìm bản ghi.
- `oid` là schema chuỗi ObjectId, không phải bằng chứng mã có tồn tại.
- `ReplenishmentLine`, `Line`, `DocumentLine_PURCHASE_RECEIPT` là kiểu dòng chuyên biệt trên cùng collection `document_lines`; không có collection mới chỉ vì tên class khác.
- `BusinessDocument` có các kiểu riêng theo `documentKind`; `header` được kiểm theo loại. `DocumentLine` phân loại theo `lineKind`.
- Cùng tên hàm ở controller và service là hai hàm: controller chuyển request, service thực hiện nghiệp vụ.
- `read(query, session)` giữ query theo session; `save(Model, fields, session)` ghi model cụ thể truyền vào. Trong mục hàm gọi helper có chép đối số thật để tránh chỉ thấy một chữ Model chung chung.

## 3. Model, collection và ý nghĩa

Một collection là nhóm bản ghi MongoDB. Một model là cách code đọc/ghi các bản ghi theo schema. `ObjectId` là mã tham chiếu; `Decimal128` là số thập phân; `Date` là thời điểm. Field required trong schema chỉ kiểm có giá trị phù hợp, không tự truy vấn xem record được ref tới có thật.

### Product → `products`

Hồ sơ loại hàng; không chứa số dư. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/product.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `sku` | String | Có |
| `name` | String | Có |
| `baseUomId` | ObjectId → Uom | Có |
| `wholeBaseUnits` | Boolean | Có |
| `nominalSize` | String | Không hoặc có mặc định/điều kiện |
| `category` | String | Không hoặc có mặc định/điều kiện |
| `brand` | String | Không hoặc có mặc định/điều kiện |
| `material` | String | Không hoặc có mặc định/điều kiện |
| `surface` | String | Không hoặc có mặc định/điều kiện |
| `lengthMm` | Decimal128 | Không hoặc có mặc định/điều kiện |
| `widthMm` | Decimal128 | Không hoặc có mặc định/điều kiện |
| `thicknessMm` | Decimal128 | Không hoặc có mặc định/điều kiện |
| `origin` | String | Không hoặc có mặc định/điều kiện |
| `description` | String | Không hoặc có mặc định/điều kiện |
| `isActive` | Boolean | Có |
| `version` | Number | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "sku": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "isActive": 1,
      "createdAt": -1,
      "_id": -1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### Uom → `uoms`

Danh mục đơn vị tính. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/product.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `code` | String | Có |
| `name` | String | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "code": 1
    },
    {
      "unique": true
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### ProductUomVersion → `product_uom_versions`

Quy đổi theo sản phẩm/đơn vị/phiên bản; giữ bản đã dùng. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/product.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `productId` | ObjectId → Product | Có |
| `uomId` | ObjectId → Uom | Có |
| `version` | Number | Có |
| `basePerUnit` | Decimal128 | Có |
| `validFrom` | Date | Có |
| `createdBy` | ObjectId → User | Không hoặc có mặc định/điều kiện |
| `verificationReference` | String | Không hoặc có mặc định/điều kiện |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "productId": 1,
      "uomId": 1,
      "version": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "productId": 1,
      "uomId": 1,
      "validFrom": -1,
      "version": -1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### ProductWarehousePolicy → `product_warehouse_policies`

Ngưỡng tối thiểu/mục tiêu của một sản phẩm tại một kho. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/product.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `productId` | ObjectId → Product | Có |
| `warehouseId` | ObjectId → Warehouse | Có |
| `minimumQty` | Decimal128 | Có |
| `targetQty` | Decimal128 | Có |
| `version` | Number | Có |
| `updatedBy` | ObjectId → User | Không hoặc có mặc định/điều kiện |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "productId": 1,
      "warehouseId": 1
    },
    {
      "unique": true
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### Lot → `lots`

Nhận dạng một lô; số lượng thực nằm ở balance. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/product.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `productId` | ObjectId → Product | Có |
| `manufacturerLot` | String | Có |
| `tone` | String | Có |
| `calibre` | String | Có |
| `identificationStatus` | String | Có |
| `manufacturedOn` | Date | Không hoặc có mặc định/điều kiện |
| `version` | Number | Có |
| `createdBy` | ObjectId → User | Không hoặc có mặc định/điều kiện |
| `notes` | String | Không hoặc có mặc định/điều kiện |
| `verificationReference` | String | Không hoặc có mặc định/điều kiện |
| `verifiedBy` | ObjectId → User | Không hoặc có mặc định/điều kiện |
| `verifiedAt` | Date | Không hoặc có mặc định/điều kiện |
| `identityLocked` | Boolean | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "productId": 1,
      "manufacturerLot": 1,
      "tone": 1,
      "calibre": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "productId": 1,
      "identificationStatus": 1,
      "createdAt": -1,
      "_id": -1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### Party → `parties`

Nhà cung cấp/cửa hàng/khách/bên vận chuyển, phân biệt kind. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/party.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `code` | String | Có |
| `name` | String | Có |
| `kind` | String | Có |
| `contactReference` | String | Không hoặc có mặc định/điều kiện |
| `phone` | String | Không hoặc có mặc định/điều kiện |
| `email` | String | Không hoặc có mặc định/điều kiện |
| `address` | String | Không hoặc có mặc định/điều kiện |
| `taxCode` | String | Không hoặc có mặc định/điều kiện |
| `contactPerson` | String | Không hoặc có mặc định/điều kiện |
| `notes` | String | Không hoặc có mặc định/điều kiện |
| `cooperationStatus` | String | Không hoặc có mặc định/điều kiện |
| `statusReason` | String | Không hoặc có mặc định/điều kiện |
| `isActive` | Boolean | Có |
| `version` | Number | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "code": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "kind": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "kind": "STORE"
      }
    }
  ],
  [
    {
      "kind": 1,
      "cooperationStatus": 1,
      "createdAt": -1,
      "_id": -1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### Warehouse → `warehouses`

Kho vật lý. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/warehouse.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `code` | String | Có |
| `name` | String | Có |
| `address` | String | Không hoặc có mặc định/điều kiện |
| `isActive` | Boolean | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "code": 1
    },
    {
      "unique": true
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### Location → `locations`

Vị trí/khu trong kho; có loại và trạng thái hoạt động. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/warehouse.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `warehouseId` | ObjectId → Warehouse | Có |
| `code` | String | Có |
| `kind` | String | Có |
| `allocatable` | Boolean | Có |
| `isActive` | Boolean | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |
| `planningVersion` | Number | Có |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "warehouseId": 1,
      "code": 1
    },
    {
      "unique": true
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### BusinessDocument → `business_documents`

Phần chung phiếu; typed header của RR/PO/inspection/GR/TO. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/business-document.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `documentNo` | String | Có |
| `documentKind` | String | Có |
| `workflowStatus` | String | Có |
| `version` | Number | Có |
| `createdBy` | ObjectId → User | Có |
| `occurredAt` | Date | Không hoặc có mặc định/điều kiện |
| `note` | String | Không hoặc có mặc định/điều kiện |
| `externalReferenceIds` | Array | Không hoặc có mặc định/điều kiện |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "documentKind": 1,
      "workflowStatus": 1,
      "createdAt": 1
    },
    {}
  ],
  [
    {
      "header.poInspectionId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "documentKind": "GR_PURCHASE",
        "header.poInspectionId": {
          "$type": "objectId"
        }
      }
    }
  ],
  [
    {
      "documentKind": 1,
      "createdBy": 1,
      "header.creationKey": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "documentKind": "PO_INSPECTION",
        "header.creationKey": {
          "$type": "string"
        }
      }
    }
  ],
  [
    {
      "documentKind": 1,
      "header.purchaseOrderId": 1,
      "createdAt": -1
    },
    {}
  ],
  [
    {
      "header.replacesInspectionId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "documentKind": "PO_INSPECTION",
        "header.replacesInspectionId": {
          "$type": "objectId"
        }
      }
    }
  ],
  [
    {
      "documentKind": 1,
      "header.warehouseId": 1,
      "createdAt": -1,
      "_id": -1
    },
    {}
  ],
  [
    {
      "documentKind": 1,
      "createdBy": 1,
      "header.warehouseId": 1,
      "createdAt": -1,
      "_id": -1
    },
    {}
  ],
  [
    {
      "createdBy": 1,
      "header.creationKey": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "documentKind": "REPLENISHMENT",
        "header.creationKey": {
          "$type": "string"
        }
      }
    }
  ],
  [
    {
      "documentKind": 1,
      "header.operationId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "header.operationId": {
          "$type": "objectId"
        }
      }
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### DocumentLine → `document_lines`

Dòng hàng có mã riêng và typed details. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/document-line.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `documentId` | ObjectId → BusinessDocument | Có |
| `lineNo` | Number | Có |
| `lineKind` | String | Có |
| `productId` | ObjectId → Product | Có |
| `lotId` | ObjectId → Lot | Không hoặc có mặc định/điều kiện |
| `conversionId` | ObjectId → ProductUomVersion | Có |
| `enteredQty` | Decimal128 | Có |
| `conversionSnapshot` | Decimal128 | Có |
| `qtyBase` | Decimal128 | Có |
| `productNameSnapshot` | String | Có |
| `productSkuSnapshot` | String | Không hoặc có mặc định/điều kiện |
| `enteredUomCodeSnapshot` | String | Không hoặc có mặc định/điều kiện |
| `lotLabelSnapshot` | String | Không hoặc có mặc định/điều kiện |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "documentId": 1,
      "lineNo": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "lotId": 1
    },
    {}
  ],
  [
    {
      "documentId": 1,
      "details.clientLineKey": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "lineKind": "PO_INSPECTION"
      }
    }
  ],
  [
    {
      "details.salesOrderLineId": 1,
      "details.releaseKey": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "lineKind": "ISSUE_REQUEST"
      }
    }
  ],
  [
    {
      "details.externalLineId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "lineKind": "SALES_ORDER"
      }
    }
  ],
  [
    {
      "documentId": 1,
      "details.salesIssueLineId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "lineKind": "DELIVERY_CONFIRMATION"
      }
    }
  ],
  [
    {
      "details.sourceSalesOrderLineId": 1
    },
    {
      "name": "replenishment_source",
      "partialFilterExpression": {
        "lineKind": "REPLENISHMENT"
      }
    }
  ],
  [
    {
      "details.salesOrderLineId": 1
    },
    {
      "name": "issue_request_source",
      "partialFilterExpression": {
        "lineKind": "ISSUE_REQUEST"
      }
    }
  ],
  [
    {
      "details.issueRequestLineId": 1
    },
    {
      "name": "outbound_delivery_source",
      "partialFilterExpression": {
        "lineKind": "OUTBOUND_DELIVERY"
      }
    }
  ],
  [
    {
      "details.outboundDeliveryLineId": 1
    },
    {
      "name": "sales_goods_issue_source",
      "partialFilterExpression": {
        "lineKind": "SALES_GOODS_ISSUE"
      }
    }
  ],
  [
    {
      "details.salesIssueLineId": 1
    },
    {
      "name": "delivery_confirmation_source",
      "partialFilterExpression": {
        "lineKind": "DELIVERY_CONFIRMATION"
      }
    }
  ],
  [
    {
      "details.salesIssueLineId": 1
    },
    {
      "name": "failed_delivery_receipt_source",
      "partialFilterExpression": {
        "lineKind": "FAILED_DELIVERY_RECEIPT"
      }
    }
  ],
  [
    {
      "details.sourceStocktakeId": 1
    },
    {
      "partialFilterExpression": {
        "lineKind": "REPLENISHMENT"
      }
    }
  ],
  [
    {
      "details.dispatchLineId": 1
    },
    {
      "partialFilterExpression": {
        "lineKind": "TRANSFER_RECEIPT"
      }
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### DocumentLink → `document_links`

Nguồn giữa hai phiếu. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/document-link.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `parentDocumentId` | ObjectId → BusinessDocument | Có |
| `childDocumentId` | ObjectId → BusinessDocument | Có |
| `relationCode` | String | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "parentDocumentId": 1,
      "childDocumentId": 1,
      "relationCode": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "childDocumentId": 1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### LineLink → `line_links`

Nguồn giữa hai dòng kèm lượng. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/document-link.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `sourceLineId` | ObjectId → DocumentLine | Có |
| `targetLineId` | ObjectId → DocumentLine | Có |
| `relationCode` | String | Có |
| `linkedQty` | Decimal128 | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "sourceLineId": 1,
      "targetLineId": 1,
      "relationCode": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "targetLineId": 1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### ReplenishmentSubmission → `replenishment_submissions`

Bản chụp nội dung RR lúc gửi. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/replenishment-submission.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `documentId` | ObjectId → BusinessDocument | Có |
| `documentVersion` | Number | Có |
| `submittedBy` | ObjectId → User | Có |
| `submittedAt` | Date | Có |
| `warehouseId` | ObjectId → Warehouse | Có |
| `warehouseCodeSnapshot` | String | Có |
| `warehouseNameSnapshot` | String | Có |
| `neededOn` | Date | Có |
| `triggerReason` | String | Có |
| `note` | String | Không hoặc có mặc định/điều kiện |
| `lines` | Array | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "documentId": 1,
      "documentVersion": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "documentId": 1,
      "submittedAt": -1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### Approval → `approvals`

Quyết định đúng phiên bản và lượng từng dòng. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/approval.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `documentId` | ObjectId → BusinessDocument | Có |
| `documentVersion` | Number | Có |
| `decisionKind` | String | Có |
| `decision` | String | Có |
| `requestedBy` | ObjectId → User | Có |
| `decidedBy` | ObjectId → User | Có |
| `decidedAt` | Date | Có |
| `reason` | String | Có |
| `lines` | Array | Không hoặc có mặc định/điều kiện |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "documentId": 1,
      "documentVersion": 1,
      "decisionKind": 1
    },
    {
      "unique": true
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### PurchaseSourceClaim → `purchase_source_claims`

Phần quyền mua của RR đã được PO sử dụng. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/purchase.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `purchaseOrderId` | ObjectId → BusinessDocument | Có |
| `poLineId` | ObjectId → DocumentLine | Có |
| `rrLineId` | ObjectId → DocumentLine | Có |
| `approvalId` | ObjectId → Approval | Có |
| `qtyBase` | Decimal128 | Có |
| `version` | Number | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "poLineId": 1,
      "rrLineId": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "rrLineId": 1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### PurchaseEvent → `purchase_events`

Sự kiện mua bổ sung/lịch/chốt thiếu/sửa sai/đảo có lịch sử. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/purchase.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `purchaseOrderId` | ObjectId → BusinessDocument | Có |
| `documentId` | ObjectId → BusinessDocument | Có |
| `kind` | String | Có |
| `sourcePoVersion` | Number | Có |
| `actorId` | ObjectId → User | Có |
| `reason` | String | Có |
| `evidenceIds` | Array | Không hoặc có mặc định/điều kiện |
| `lines` | Array | Không hoặc có mặc định/điều kiện |
| `relatedEventId` | ObjectId → PurchaseEvent | Không hoặc có mặc định/điều kiện |
| `relatedDocumentId` | ObjectId → BusinessDocument | Không hoặc có mặc định/điều kiện |
| `postingBatchId` | ObjectId → PostingBatch | Không hoặc có mặc định/điều kiện |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "purchaseOrderId": 1,
      "kind": 1,
      "createdAt": -1
    },
    {}
  ],
  [
    {
      "documentId": 1,
      "kind": 1
    },
    {}
  ],
  [
    {
      "relatedEventId": 1,
      "kind": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "kind": {
          "$in": [
            "CLOSE_APPROVAL",
            "CLOSE_EXECUTION"
          ]
        }
      }
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### ReceiptPlacement → `receipt_placements`

Lượng của từng dòng GR đã cất/đang giữ kế hoạch/đã đảo. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/purchase.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `purchaseOrderId` | ObjectId → BusinessDocument | Có |
| `receiptId` | ObjectId → BusinessDocument | Có |
| `receiptLineId` | ObjectId → DocumentLine | Có |
| `sourceBalanceId` | ObjectId → StockBalance | Có |
| `receivedQtyBase` | Decimal128 | Có |
| `placedQtyBase` | Decimal128 | Có |
| `claimedQtyBase` | Decimal128 | Có |
| `reversedQtyBase` | Decimal128 | Có |
| `version` | Number | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "receiptLineId": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "receiptId": 1
    },
    {}
  ],
  [
    {
      "sourceBalanceId": 1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### PurchaseEvidenceUpload → `purchase_evidence_uploads`

Trạng thái tệp chuẩn bị trước khi gắn Evidence. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/purchase.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `documentId` | ObjectId → BusinessDocument | Có |
| `lineId` | ObjectId → DocumentLine | Không hoặc có mặc định/điều kiện |
| `actorId` | ObjectId → User | Có |
| `objectKey` | String | Có |
| `sha256` | String | Có |
| `mediaType` | String | Có |
| `resourceType` | String | Có |
| `format` | String | Có |
| `bytes` | Number | Có |
| `expiresAt` | Date | Có |
| `status` | String | Có |
| `evidenceId` | ObjectId → Evidence | Không hoặc có mặc định/điều kiện |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "status": 1,
      "expiresAt": 1
    },
    {}
  ],
  [
    {
      "objectKey": 1
    },
    {
      "unique": true
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### Evidence → `evidence_refs`

Chứng cứ đã gắn đúng parent/line; không phải URL công khai. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/evidence.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `documentId` | ObjectId → BusinessDocument | Có |
| `lineId` | ObjectId → DocumentLine | Không hoặc có mặc định/điều kiện |
| `objectKey` | String | Có |
| `sha256` | String | Có |
| `mediaType` | String | Có |
| `uploadedBy` | ObjectId → User | Có |
| `uploadedAt` | Date | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "documentId": 1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### StockAccount → `stock_accounts`

Tài khoản của một location vật lý hoặc dòng transit. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/inventory.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `locationId` | ObjectId → Location | Không hoặc có mặc định/điều kiện |
| `transitDispatchLineId` | ObjectId → DocumentLine | Không hoặc có mặc định/điều kiện |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "locationId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "locationId": {
          "$type": "objectId"
        }
      }
    }
  ],
  [
    {
      "transitDispatchLineId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "transitDispatchLineId": {
          "$type": "objectId"
        }
      }
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### StockBalance → `stock_balances`

Lượng hiện tại theo account/lot/quality/owner. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/inventory.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `accountId` | ObjectId → StockAccount | Có |
| `lotId` | ObjectId → Lot | Có |
| `qualityCode` | String | Có |
| `ownerPartyId` | ObjectId → Party | Có |
| `qtyBase` | Decimal128 | Có |
| `version` | Number | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "accountId": 1,
      "lotId": 1,
      "qualityCode": 1,
      "ownerPartyId": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "lotId": 1,
      "qualityCode": 1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### PostingBatch → `posting_batches`

Một lần ghi sổ, có thể tham chiếu lần bị đảo. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/inventory.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `documentId` | ObjectId → BusinessDocument | Có |
| `operation` | String | Có |
| `operationKey` | String | Có |
| `idempotencyKey` | String | Có |
| `payloadHash` | String | Có |
| `postedBy` | ObjectId → User | Có |
| `postedAt` | Date | Có |
| `reversalOf` | ObjectId → PostingBatch | Không hoặc có mặc định/điều kiện |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "idempotencyKey": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "documentId": 1,
      "operation": 1,
      "operationKey": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "reversalOf": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "reversalOf": {
          "$type": "objectId"
        }
      }
    }
  ],
  [
    {
      "postedAt": 1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### StockMovement → `stock_movements`

Nguồn/đích, lượng và số trước/sau của lần ghi sổ. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/inventory.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `batchId` | ObjectId → PostingBatch | Có |
| `documentId` | ObjectId → BusinessDocument | Có |
| `lineId` | ObjectId → DocumentLine | Có |
| `fromBalanceId` | ObjectId → StockBalance | Không hoặc có mặc định/điều kiện |
| `toBalanceId` | ObjectId → StockBalance | Không hoặc có mặc định/điều kiện |
| `qtyBase` | Decimal128 | Có |
| `fromBefore` | Decimal128 | Không hoặc có mặc định/điều kiện |
| `fromAfter` | Decimal128 | Không hoặc có mặc định/điều kiện |
| `toBefore` | Decimal128 | Không hoặc có mặc định/điều kiện |
| `toAfter` | Decimal128 | Không hoặc có mặc định/điều kiện |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "fromBalanceId": 1,
      "batchId": 1
    },
    {}
  ],
  [
    {
      "toBalanceId": 1,
      "batchId": 1
    },
    {}
  ],
  [
    {
      "documentId": 1,
      "lineId": 1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### Reservation → `reservations`

Phần tồn đã giữ cho nhu cầu. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/inventory.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `demandLineId` | ObjectId → DocumentLine | Có |
| `executionLineId` | ObjectId → DocumentLine | Có |
| `balanceId` | ObjectId → StockBalance | Có |
| `qtyBase` | Decimal128 | Có |
| `status` | String | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "balanceId": 1
    },
    {
      "partialFilterExpression": {
        "status": "ACTIVE"
      }
    }
  ],
  [
    {
      "demandLineId": 1,
      "status": 1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### DefectHold → `defect_holds`

Giữ/chặn số dư do lỗi. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/stocktake.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `defectDocumentId` | ObjectId → BusinessDocument | Có |
| `balanceId` | ObjectId → StockBalance | Có |
| `stocktakeId` | ObjectId → BusinessDocument | Không hoặc có mặc định/điều kiện |
| `qtyBase` | Decimal128 | Có |
| `evidenceId` | ObjectId → Evidence | Có |
| `recordedBy` | ObjectId → User | Có |
| `recordedAt` | Date | Có |
| `status` | String | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "balanceId": 1
    },
    {
      "partialFilterExpression": {
        "status": "ACTIVE"
      }
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### LocationLock → `location_locks`

Khóa vị trí trong phạm vi kiểm kê. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/stocktake.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `locationId` | ObjectId → Location | Có |
| `stocktakeId` | ObjectId → BusinessDocument | Có |
| `lockedAt` | Date | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "locationId": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "stocktakeId": 1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### BusinessOperation → `business_operations`

Biên nhận thao tác chống ghi trùng theo key/hash. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/business-operation.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `documentId` | ObjectId → BusinessDocument | Có |
| `operation` | String | Có |
| `operationKey` | String | Có |
| `idempotencyKey` | String | Có |
| `payloadHash` | String | Có |
| `documentVersion` | Number | Có |
| `performedBy` | ObjectId → User | Có |
| `performedAt` | Date | Có |
| `reason` | String | Không hoặc có mặc định/điều kiện |
| `result` | Embedded | Không hoặc có mặc định/điều kiện |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "idempotencyKey": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "documentId": 1,
      "operation": 1,
      "operationKey": 1
    },
    {
      "unique": true
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### AuditEvent → `audit_events`

Ai thực hiện, khi nào, hành động/thay đổi. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/event.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `documentId` | ObjectId → BusinessDocument | Không hoặc có mặc định/điều kiện |
| `actorId` | ObjectId → User | Có |
| `action` | String | Có |
| `eventAt` | Date | Có |
| `details` | String | Có |
| `entityType` | String | Không hoặc có mặc định/điều kiện |
| `entityId` | ObjectId | Không hoặc có mặc định/điều kiện |
| `changes` | Array | Không hoặc có mặc định/điều kiện |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "documentId": 1,
      "eventAt": 1
    },
    {}
  ],
  [
    {
      "entityType": 1,
      "entityId": 1,
      "eventAt": -1,
      "_id": -1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### User → `users`

Tài khoản active, một role và các kho được giao. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/user.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `username` | String | Có |
| `fullName` | String | Có |
| `passwordHash` | String | Có |
| `roleId` | ObjectId → Role | Có |
| `warehouseIds` | Array | Không hoặc có mặc định/điều kiện |
| `phone` | String | Không hoặc có mặc định/điều kiện |
| `isActive` | Boolean | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "username": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "roleId": 1
    },
    {}
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### Role → `roles`

Vai trò với tập permission đang được gán. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/access.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `code` | String | Có |
| `permissionIds` | Array | Không hoặc có mặc định/điều kiện |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "code": 1
    },
    {
      "unique": true
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

### Permission → `permissions`

Mã thao tác được phép. [Mở schema](D:/Ky_9/SEP490/src/be/src/models/access.model.js:1).

| Trường | Kiểu / ref | Bắt buộc theo schema |
|---|---|---|
| `code` | String | Có |
| `createdAt` | Date | Không hoặc có mặc định/điều kiện |
| `updatedAt` | Date | Không hoặc có mặc định/điều kiện |

**Chỉ mục/ràng buộc khai báo:**

```json
[
  [
    {
      "code": 1
    },
    {
      "unique": true
    }
  ]
]
```

Chỉ mục duy nhất chặn hai bản ghi cùng khóa khi đã được tạo trong database; không thay điều kiện nghiệp vụ, transaction hoặc phạm vi kho. Chỉ mục khai báo ở đây không chứng minh database vận hành đã có đúng index.

## 4. Header/details chuyên biệt trong chuỗi đang giải thích

### REPLENISHMENT.header

Collection vẫn là `business_documents`.

| Trường | Kiểu / ref |
|---|---|
| `warehouseId` | ObjectId → Warehouse |
| `neededOn` | Date |
| `triggerReason` | String |
| `creationKey` | String |
| `submittedBy` | ObjectId → User |
| `submittedAt` | Date |
| `purchasingVersion` | Number |

### PO.header

Collection vẫn là `business_documents`.

| Trường | Kiểu / ref |
|---|---|
| `warehouseId` | ObjectId → Warehouse |
| `supplierId` | ObjectId → Party |
| `expectedOn` | Date |
| `supplierConfirmation` | String |
| `creationKey` | String |

### PO_INSPECTION.header

Collection vẫn là `business_documents`.

| Trường | Kiểu / ref |
|---|---|
| `purchaseOrderId` | ObjectId → BusinessDocument |
| `warehouseId` | ObjectId → Warehouse |
| `supplierId` | ObjectId → Party |
| `sourcePoVersion` | Number |
| `creationKey` | String |
| `arrivedAt` | Date |
| `deliveryReference` | String |
| `delivererName` | String |
| `delivererContact` | String |
| `inspectedBy` | ObjectId → User |
| `inspectedAt` | Date |
| `scheduleId` | ObjectId → PurchaseEvent |
| `rootInspectionId` | ObjectId → BusinessDocument |
| `replacesInspectionId` | ObjectId → BusinessDocument |
| `correctionId` | ObjectId → PurchaseEvent |

### GR_PURCHASE.header

Collection vẫn là `business_documents`.

| Trường | Kiểu / ref |
|---|---|
| `warehouseId` | ObjectId → Warehouse |
| `receiptKind` | String |
| `purchaseOrderId` | ObjectId → BusinessDocument |
| `poInspectionId` | ObjectId → BusinessDocument |
| `supplierId` | ObjectId → Party |
| `delivererName` | String |
| `delivererContact` | String |

### TO.header

Collection vẫn là `business_documents`.

| Trường | Kiểu / ref |
|---|---|
| `warehouseId` | ObjectId → Warehouse |
| `taskKind` | String |
| `assignedTo` | ObjectId → User |
| `purchaseOrderId` | ObjectId → BusinessDocument |
| `receiptId` | ObjectId → BusinessDocument |

### REPLENISHMENT.details

Collection vẫn là `document_lines`.

| Trường | Kiểu / ref |
|---|---|
| `triggerType` | String |
| `sourceSalesOrderLineId` | ObjectId → DocumentLine |
| `sourceSalesOrderVersion` | Number |
| `sourceIssueRequestLineId` | ObjectId → DocumentLine |
| `sourceIssueRequestVersion` | Number |
| `sourceStocktakeId` | ObjectId → BusinessDocument |
| `sourceStocktakeVersion` | Number |
| `policyId` | ObjectId → ProductWarehousePolicy |
| `policyVersion` | Number |
| `evaluationKey` | String |
| `evaluatedAt` | Date |
| `availableQtySnapshot` | Decimal128 |
| `otherWarehouseCoverageQtySnapshot` | Decimal128 |
| `remainingDemandQtySnapshot` | Decimal128 |
| `reservedForDemandQtySnapshot` | Decimal128 |
| `onHandCoverageQtySnapshot` | Decimal128 |
| `incomingCoverageQtySnapshot` | Decimal128 |
| `pendingRequestCoverageQtySnapshot` | Decimal128 |
| `minimumQtySnapshot` | Decimal128 |
| `targetQtySnapshot` | Decimal128 |
| `suggestedQty` | Decimal128 |
| `reasonNote` | String |
| `quantityAdjustmentReason` | String |
| `removedAt` | Date |

### PO_INSPECTION.details

Collection vẫn là `document_lines`.

| Trường | Kiểu / ref |
|---|---|
| `clientLineKey` | String |
| `plannedReceiptLocationId` | ObjectId → Location |
| `poLineId` | ObjectId → DocumentLine |
| `qualityCode` | String |
| `handlingNote` | String |

### PURCHASE_RECEIPT.details

Collection vẫn là `document_lines`.

| Trường | Kiểu / ref |
|---|---|
| `poLineId` | ObjectId → DocumentLine |
| `inspectionLineId` | ObjectId → DocumentLine |
| `receivingLocationId` | ObjectId → Location |
| `qualityCode` | String |

### WAREHOUSE_TASK.details

Collection vẫn là `document_lines`.

| Trường | Kiểu / ref |
|---|---|
| `fromLocationId` | ObjectId → Location |
| `toLocationId` | ObjectId → Location |
| `qualityCode` | String |
| `sourceBalanceId` | ObjectId → StockBalance |
| `sourceBalanceVersion` | Number |
| `ownerPartyId` | ObjectId → Party |
| `receiptLineId` | ObjectId → DocumentLine |
| `placementId` | ObjectId → ReceiptPlacement |

## 5. Liên kết cần theo khi đọc query

```text
RR DocumentLine → Approval.lines.lineId + ReplenishmentSubmission.lines.lineId
RR DocumentLine → PurchaseSourceClaim.rrLineId → PO DocumentLine
PO DocumentLine → PO_INSPECTION.details.poLineId
PO_INSPECTION line → PURCHASE_RECEIPT.details.inspectionLineId
GR line → ReceiptPlacement.receiptLineId → WAREHOUSE_TASK.details.placementId
StockMovement → PostingBatch, BusinessDocument, DocumentLine, from/to StockBalance
StockBalance → StockAccount + Lot + Party; StockAccount → Location → Warehouse
Evidence → documentId/lineId; PurchaseEvidenceUpload → actorId/documentId/evidenceId
```

Ví dụ có supplierId trực tiếp trên GR vẫn phải kiểm nó khớp PO/inspection; có placementId trên task vẫn phải kiểm nó thuộc đúng dòng GR. Liên kết được lưu là dữ liệu cần xác minh, không phải lý do bỏ kiểm nguồn.

## 6. Các bộ kiểm tra đầu vào theo source

### product.validation.js → metadataShape

[Source dòng 29](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:29). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
metadataShape = {
  name: z.string().trim().min(1).max(200),
  nominalSize: optionalText(60),
  category: optionalText(100),
  brand: optionalText(100),
  material: optionalText(100),
  surface: optionalText(100),
  lengthMm: dimension,
  widthMm: dimension,
  thicknessMm: dimension,
  origin: optionalText(100),
  description: optionalText(2000),
}
```

</details>

### product.validation.js → listProductsSchema

[Source dòng 53](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:53). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
listProductsSchema = z.object({
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
      search: z.string().trim().max(100).optional(),
      nominalSize: z.string().trim().max(60).optional(),
      isActive: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),
      sortBy: z.enum(["createdAt", "sku", "name"]).default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .strict()
    .superRefine((query, ctx) => {
      if (!Number.isSafeInteger((query.page - 1) * query.limit)) {
        ctx.addIssue({
          code: "custom",
          path: ["page"],
          message: "Trang vượt giới hạn hỗ trợ",
        });
      }
    }),
  params: emptyQuery,
  body: emptyQuery,
})
```

</details>

### product.validation.js → productIdSchema

[Source dòng 81](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:81). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
productIdSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: emptyQuery,
})
```

</details>

### product.validation.js → createProductSchema

[Source dòng 87](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:87). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
createProductSchema = z.object({
  body: z
    .object({
      sku: z
        .string()
        .trim()
        .min(1)
        .max(60)
        .transform(normalizeCode),
      ...metadataShape,
      baseUomId: objectIdString,
      wholeBaseUnits: z.boolean().optional().default(true),
    })
    .strict()
    .superRefine(pairedDimensions),
  query: emptyQuery,
  params: emptyQuery,
})
```

</details>

### product.validation.js → updateProductSchema

[Source dòng 106](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:106). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
updateProductSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion: expectedVersion(),
      ...metadataShape,
    })
    .strict()
    .superRefine(pairedDimensions),
})
```

</details>

### product.validation.js → changeProductStatusSchema

[Source dòng 118](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:118). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
changeProductStatusSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion: expectedVersion(),
      isActive: z.boolean(),
      reason: z.string().trim().min(1).max(2000),
    })
    .strict(),
})
```

</details>

### product.validation.js → createConversionSchema

[Source dòng 138](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:138). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
createConversionSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedProductVersion: expectedVersion(),
      uomId: objectIdString,
      basePerUnit: decimalStringSchema({
        scale: 12,
        precision: 24,
        positive: true,
        label: "Hệ số quy đổi",
      }),
      validFrom: utcIsoDateTime,
      verificationReference: z.string().trim().min(1).max(2000),
    })
    .strict(),
})
```

</details>

### product.validation.js → conversionHistorySchema

[Source dòng 157](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:157). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
conversionHistorySchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
      uomId: objectIdString.optional(),
    })
    .strict()
    .superRefine((query, ctx) => {
      if (!Number.isSafeInteger((query.page - 1) * query.limit)) {
        ctx.addIssue({
          code: "custom",
          path: ["page"],
          message: "Trang vượt giới hạn hỗ trợ",
        });
      }
    }),
  body: emptyQuery,
})
```

</details>

### product.validation.js → configurePolicySchema

[Source dòng 178](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:178). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
configurePolicySchema = z.object({
  params: z
    .object({ id: objectIdString, warehouseId: objectIdString })
    .strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion: expectedVersion(0),
      minimumQtyBase: decimalStringSchema({
        label: "Lượng tối thiểu",
      }),
      targetQtyBase: decimalStringSchema({
        label: "Lượng mục tiêu",
      }).optional(),
    })
    .strict(),
})
```

</details>

### product.validation.js → listPoliciesSchema

[Source dòng 196](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:196). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
listPoliciesSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: emptyQuery,
})
```

</details>

### product.validation.js → productOptionsSchema

[Source dòng 202](D:/Ky_9/SEP490/src/be/src/modules/products/product.validation.js:202). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
productOptionsSchema = z.object({
  params: emptyQuery,
  query: emptyQuery,
  body: emptyQuery,
})
```

</details>

### lot.validation.js → listLotsSchema

[Source dòng 31](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.validation.js:31). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
listLotsSchema = z.object({
  params: emptyQuery,
  body: emptyQuery,
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
      productId: objectIdString.optional(),
      manufacturerLot: z.string().trim().max(100).optional(),
      tone: z.string().trim().max(60).optional(),
      calibre: z.string().trim().max(60).optional(),
      identificationStatus: z.enum(["VERIFIED", "UNKNOWN"]).optional(),
      warehouseId: objectIdString.optional(),
    })
    .strict()
    .superRefine((query, ctx) => {
      if (!Number.isSafeInteger((query.page - 1) * query.limit)) {
        ctx.addIssue({
          code: "custom",
          path: ["page"],
          message: "Trang vượt giới hạn hỗ trợ",
        });
      }
    }),
})
```

</details>

### lot.validation.js → lotIdSchema

[Source dòng 57](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.validation.js:57). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
lotIdSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: emptyQuery,
})
```

</details>

### lot.validation.js → createLotSchema

[Source dòng 63](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.validation.js:63). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
createLotSchema = z.object({
  params: emptyQuery,
  query: emptyQuery,
  body: z
    .object({
      productId: objectIdString,
      manufacturerLot: identityText(100),
      tone: identityText(60),
      calibre: identityText(60),
      identificationStatus: z.enum(["VERIFIED", "UNKNOWN"]),
      manufacturedOn: calendarDateString.optional().nullable(),
      verificationReference: optionalText(2000),
      notes: optionalText(2000),
    })
    .strict(),
})
```

</details>

### lot.validation.js → updateLotSchema

[Source dòng 80](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.validation.js:80). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
updateLotSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion,
      manufacturerLot: identityText(100).optional(),
      tone: identityText(60).optional(),
      calibre: identityText(60).optional(),
      identificationStatus: z.enum(["VERIFIED", "UNKNOWN"]).optional(),
      manufacturedOn: calendarDateString.optional().nullable(),
      verificationReference: optionalText(2000),
      notes: optionalText(2000),
    })
    .strict(),
})
```

</details>

### lot.validation.js → lotMovementsSchema

[Source dòng 97](D:/Ky_9/SEP490/src/be/src/modules/lots/lot.validation.js:97). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
lotMovementsSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  body: emptyQuery,
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
    })
    .strict()
    .superRefine((query, ctx) => {
      if (!Number.isSafeInteger((query.page - 1) * query.limit)) {
        ctx.addIssue({
          code: "custom",
          path: ["page"],
          message: "Trang vượt giới hạn hỗ trợ",
        });
      }
    }),
})
```

</details>

### supplier.validation.js → contactShape

[Source dòng 34](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.validation.js:34). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
contactShape = {
  phone: optionalText(30),
  email: optionalText(254, { email: true }),
  address: optionalText(500),
  taxCode: optionalText(50),
  contactPerson: optionalText(160),
  notes: optionalText(2000),
}
```

</details>

### supplier.validation.js → listSuppliersSchema

[Source dòng 43](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.validation.js:43). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
listSuppliersSchema = z.object({
  params: emptyQuery,
  body: emptyQuery,
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
      search: z.string().trim().max(100).optional(),
      cooperationStatus: z
        .enum(["ACTIVE", "SUSPENDED", "TERMINATED"])
        .optional(),
    })
    .strict()
    .superRefine((query, ctx) => {
      if (!Number.isSafeInteger((query.page - 1) * query.limit)) {
        ctx.addIssue({
          code: "custom",
          path: ["page"],
          message: "Trang vượt giới hạn hỗ trợ",
        });
      }
    }),
})
```

</details>

### supplier.validation.js → supplierIdSchema

[Source dòng 67](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.validation.js:67). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
supplierIdSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: emptyQuery,
})
```

</details>

### supplier.validation.js → createSupplierSchema

[Source dòng 73](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.validation.js:73). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
createSupplierSchema = z.object({
  params: emptyQuery,
  query: emptyQuery,
  body: z
    .object({
      code: z
        .string()
        .trim()
        .min(1)
        .max(40)
        .transform(normalizeCode),
      name: z.string().trim().min(1).max(200),
      ...contactShape,
    })
    .strict(),
})
```

</details>

### supplier.validation.js → updateSupplierSchema

[Source dòng 90](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.validation.js:90). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
updateSupplierSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion,
      name: z.string().trim().min(1).max(200),
      ...contactShape,
    })
    .strict(),
})
```

</details>

### supplier.validation.js → changeSupplierStatusSchema

[Source dòng 102](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.validation.js:102). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
changeSupplierStatusSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion,
      cooperationStatus: z.enum(["ACTIVE", "SUSPENDED", "TERMINATED"]),
      reason: z.string().trim().min(1).max(2000),
    })
    .strict(),
})
```

</details>

### supplier.validation.js → supplierHistorySchema

[Source dòng 114](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.validation.js:114). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
supplierHistorySchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  body: emptyQuery,
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
    })
    .strict()
    .superRefine((query, ctx) => {
      if (!Number.isSafeInteger((query.page - 1) * query.limit)) {
        ctx.addIssue({
          code: "custom",
          path: ["page"],
          message: "Trang vượt giới hạn hỗ trợ",
        });
      }
    }),
})
```

</details>

### supplier.validation.js → supplierDocumentsSchema

[Source dòng 134](D:/Ky_9/SEP490/src/be/src/modules/suppliers/supplier.validation.js:134). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
supplierDocumentsSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  body: emptyQuery,
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
      kind: z.enum(["PO", "GR_PURCHASE", "SUPPLIER_RETURN"]),
    })
    .strict()
    .superRefine((query, ctx) => {
      if (!Number.isSafeInteger((query.page - 1) * query.limit)) {
        ctx.addIssue({
          code: "custom",
          path: ["page"],
          message: "Trang vượt giới hạn hỗ trợ",
        });
      }
    }),
})
```

</details>

### replenishment.validation.js → objectIdSchema

[Source dòng 4](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:4). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "ObjectId không hợp lệ")
```

</details>

### replenishment.validation.js → listQuerySchema

[Source dòng 74](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:74). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
listQuerySchema = z
  .object({
    page: positiveInteger(1),
    limit: positiveInteger(10, 100),
    search: z.string().trim().max(100).optional(),
    warehouseId: objectIdSchema.optional(),
    createdBy: objectIdSchema.optional(),
    status: z
      .enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "REVISION_REQUIRED"])
      .optional(),
    approvalDecision: z
      .enum(["APPROVE", "REJECT", "REVISE", "NONE"])
      .optional(),
    hasPurchaseOrder: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((v) => v === true || v === "true")
      .optional(),
    poCreated: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((v) => v === true || v === "true")
      .optional(),
    createdFrom: calendarDate.optional(),
    createdTo: calendarDate.optional(),
  })
  .strict()
  .superRefine((query, ctx) => {
    if (
      query.createdFrom &&
      query.createdTo &&
      query.createdFrom > query.createdTo
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["createdTo"],
        message: "Ngày kết thúc phải từ ngày bắt đầu",
      });
    }
    if (!Number.isSafeInteger((query.page - 1) * query.limit)) {
      ctx.addIssue({
        code: "custom",
        path: ["page"],
        message: "Trang vượt giới hạn hỗ trợ",
      });
    }
  })
```

</details>

### replenishment.validation.js → listReplenishmentsSchema

[Source dòng 120](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:120). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
listReplenishmentsSchema = z.object({ query: listQuerySchema })
```

</details>

### replenishment.validation.js → getReplenishmentSchema

[Source dòng 121](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:121). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
getReplenishmentSchema = z.object({
  params: z.object({ id: objectIdSchema }).strict(),
  query: emptyQuery,
  body: emptyQuery,
})
```

</details>

### replenishment.validation.js → createLineSchema

[Source dòng 134](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:134). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
createLineSchema = z
  .object({
    productId: objectIdSchema,
    conversionId: objectIdSchema,
    enteredQty: lineQty,
    reasonNote,
  })
  .strict()
```

</details>

### replenishment.validation.js → createReplenishmentSchema

[Source dòng 143](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:143). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
createReplenishmentSchema = z.object({
  params: emptyQuery,
  query: emptyQuery,
  body: z
    .object({
      action: z.enum(["SAVE_DRAFT", "SUBMIT"]),
      creationKey,
      ...headerShape,
      lines: z.array(createLineSchema).min(1).max(100),
    })
    .strict(),
})
```

</details>

### replenishment.validation.js → updateLineSchema

[Source dòng 156](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:156). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
updateLineSchema = z
  .object({
    id: objectIdSchema.optional(),
    productId: objectIdSchema,
    conversionId: objectIdSchema,
    enteredQty: lineQty,
    reasonNote,
  })
  .strict()
```

</details>

### replenishment.validation.js → updateReplenishmentSchema

[Source dòng 166](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:166). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
updateReplenishmentSchema = z.object({
  params: z.object({ id: objectIdSchema }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion,
      operationKey,
      ...headerShape,
      lines: z.array(updateLineSchema).min(1).max(100),
    })
    .strict(),
})
```

</details>

### replenishment.validation.js → submitReplenishmentSchema

[Source dòng 179](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:179). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
submitReplenishmentSchema = z.object({
  params: z.object({ id: objectIdSchema }).strict(),
  query: emptyQuery,
  body: z.object({ expectedVersion, operationKey }).strict(),
})
```

</details>

### replenishment.validation.js → reviewLineSchema

[Source dòng 185](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:185). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
reviewLineSchema = z
  .object({
    lineId: objectIdSchema,
    approvedQtyBase: approvedQty,
    reason: z.string().trim().max(2000).optional().nullable(),
  })
  .strict()
```

</details>

### replenishment.validation.js → reviewReplenishmentSchema

[Source dòng 193](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:193). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
reviewReplenishmentSchema = z.object({
  params: z.object({ id: objectIdSchema }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion,
      operationKey,
      decision: z.enum(["APPROVE", "REJECT", "REVISE"]),
      reason: z.string().trim().max(2000).optional().nullable(),
      lines: z.array(reviewLineSchema).max(100).optional().default([]),
    })
    .strict(),
})
```

</details>

### replenishment.validation.js → replenishmentOptionsSchema

[Source dòng 207](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:207). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
replenishmentOptionsSchema = z.object({
  params: emptyQuery,
  body: emptyQuery,
  query: z.object({ mode: z.enum(["CREATE", "FILTER"]) }).strict(),
})
```

</details>

### replenishment.validation.js → listSubmissionsSchema

[Source dòng 213](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:213). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
listSubmissionsSchema = z.object({
  params: z.object({ id: objectIdSchema }).strict(),
  query: pageQuery,
  body: emptyQuery,
})
```

</details>

### replenishment.validation.js → getSubmissionSchema

[Source dòng 219](D:/Ky_9/SEP490/src/be/src/modules/replenishments/replenishment.validation.js:219). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
getSubmissionSchema = z.object({
  params: z
    .object({ id: objectIdSchema, version: integerFromPath })
    .strict(),
  query: emptyQuery,
  body: emptyQuery,
})
```

</details>

### purchase-order.commands.routes.js → form

[Source dòng 9](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:9). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
form = { warehouseId: oid, supplierId: oid, expectedOn: z.string().datetime({ offset: true }).optional(),
  lines: z.array(z.object({ id: oid.optional(), rrLineId: oid, approvalId: oid, enteredQty: qty }).strict()).min(1).max(100) }
```

</details>

### purchase-order.commands.routes.js → closeLines

[Source dòng 12](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.commands.routes.js:12). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
closeLines = z.array(z.object({ poLineId: oid, qtyBase: qty }).strict()).min(1).max(100)
```

</details>

### purchase-order.validation.js → getPurchaseOrderSchema

[Source dòng 15](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.validation.js:15). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
getPurchaseOrderSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  body: z.object({}).strict(),
  query: z.object({}).strict(),
})
```

</details>

### purchase-order.validation.js → listPurchaseOrdersSchema

[Source dòng 21](D:/Ky_9/SEP490/src/be/src/modules/purchase-orders/purchase-order.validation.js:21). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
listPurchaseOrdersSchema = z.object({
  params: z.object({}).strict(),
  body: z.object({}).strict(),
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
      search: z.string().trim().max(100).optional(),
      supplierId: objectIdString.optional(),
      warehouseId: objectIdString.optional(),
      status: z.string().trim().min(1).max(30).optional(),
      createdFrom: calendarDateString.optional(),
      createdTo: calendarDateString.optional(),
      outstanding: z.enum(["YES", "NO", "UNKNOWN"]).optional(),
    })
    .strict()
    .superRefine((query, ctx) => {
      if (
        query.createdFrom &&
        query.createdTo &&
        query.createdFrom > query.createdTo
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["createdTo"],
          message: "Ngày kết thúc phải từ ngày bắt đầu",
        });
      }
      if (!Number.isSafeInteger((query.page - 1) * query.limit)) {
        ctx.addIssue({
          code: "custom",
          path: ["page"],
          message: "Trang vượt giới hạn hỗ trợ",
        });
      }
    }),
})
```

</details>

### po-receiving.routes.js → key

[Source dòng 17](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:17). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
key = z.string().trim().min(1).max(160)
```

</details>

### po-receiving.routes.js → ver

[Source dòng 18](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:18). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
ver = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER)
```

</details>

### po-receiving.routes.js → qty

[Source dòng 19](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:19). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
qty = decimalStringSchema({ positive: true })
```

</details>

### po-receiving.routes.js → reason

[Source dòng 20](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:20). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
reason = z.string().trim().min(1).max(2000)
```

</details>

### po-receiving.routes.js → evidenceIds

[Source dòng 21](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:21). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
evidenceIds = z.array(oid).min(1).max(20).refine(a => new Set(a).size === a.length)
```

</details>

### po-receiving.routes.js → iso

[Source dòng 23](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:23). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
iso = z.string().datetime({ offset: true }).refine(v => Date.parse(v) <= Date.now(), 'Thời điểm đến không được ở tương lai')
```

</details>

### po-receiving.routes.js → line

[Source dòng 24](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:24). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
line = z.object({ clientLineKey: key, poLineId: oid, lotId: oid, enteredQty: qty, plannedReceiptLocationId: oid, handlingNote: optionalText(2000) }).strict()
```

</details>

### po-receiving.routes.js → form

[Source dòng 25](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:25). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
form = { expectedPoVersion: ver, arrivedAt: iso, deliveryReference: optionalText(100), delivererName: optionalText(160), delivererContact: optionalText(160), scheduleId: oid.optional(), lines: z.array(line).max(100) }
```

</details>

### po-receiving.routes.js → pager

[Source dòng 26](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:26). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
pager = z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().safe())
```

</details>

### po-receiving.routes.js → pagination

[Source dòng 27](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:27). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
pagination = { page: pager.default(1), limit: pager.pipe(z.number().max(100)).default(10) }
```

</details>

### po-receiving.routes.js → commandBody

[Source dòng 32](D:/Ky_9/SEP490/src/be/src/modules/po-receiving/po-receiving.routes.js:32). Khai báo này kiểm kiểu/giới hạn trước service, chưa kiểm bản ghi nguồn còn tồn tại hoặc quyền thực hiện. Những callback trong schema như refine/superRefine/transform nằm trong đoạn sau.

<details>
<summary>Mở khai báo đầy đủ để xem các trường và giới hạn</summary>

```js
commandBody = { expectedVersion: ver, operationKey: key }
```

</details>
