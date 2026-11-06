# Cấu trúc hiện tại — phụ lục kiểm chứng

Đọc MongoDB ở chế độ chỉ đọc; không xuất giá trị tài khoản, khách hàng, chứng từ hoặc thông tin kết nối. Các danh mục loại chứng từ dưới đây là mã phân loại, không phải nội dung hồ sơ.

- Database: `sep490`.
- Thời điểm snapshot: 2026-10-31T14:38:23.396Z (UTC).
- Collection thực: 40. Model cơ sở được export: 39.
- Trường thực được khảo sát từ tối đa 100 document đầu mỗi collection; collection rỗng không có mẫu. Đây không phải kiểm tra toàn bộ dữ liệu hoặc kết luận dữ liệu hợp lệ.
- Danh sách field từ Mongoose là schema đang khai báo; không chứng minh mọi API đã triển khai hoặc mọi ràng buộc đã được service thực thi.
- Tham chiếu Mongoose được ghi để đối chiếu; metadata ref không tự chứng minh cardinality hoặc tính toàn vẹn nghiệp vụ.

## approvals

Ước lượng bản ghi: **5**. Model: **Approval**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `documentId` | ObjectId | Có | BusinessDocument | Không |
| `documentVersion` | Number | Có | — | Không |
| `decisionKind` | String | Có | — | Không |
| `decision` | String | Có | — | Không |
| `requestedBy` | ObjectId | Có | User | Không |
| `decidedBy` | ObjectId | Có | User | Không |
| `decidedAt` | Date | Có | — | Không |
| `reason` | String | Có | — | Không |
| `lines` | Array | Không | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `decidedAt` (date); `decidedBy` (objectId); `decision` (string); `decisionKind` (string); `documentId` (objectId); `documentVersion` (int); `lines` (array); `reason` (string); `requestedBy` (objectId)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `documentId_1_documentVersion_1_decisionKind_1`: `{"documentId":1,"documentVersion":1,"decisionKind":1}`; unique=true; partial=`null`.

## audit_events

Ước lượng bản ghi: **51**. Model: **AuditEvent**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `documentId` | ObjectId | Không | BusinessDocument | Không |
| `actorId` | ObjectId | Có | User | Không |
| `action` | String | Có | — | Không |
| `eventAt` | Date | Có | — | Không |
| `details` | String | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `action` (string); `actorId` (objectId); `createdAt` (date); `details` (string); `documentId` (objectId); `eventAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `documentId_1_eventAt_1`: `{"documentId":1,"eventAt":1}`; unique=false; partial=`null`.

## business_documents

Ước lượng bản ghi: **51**. Model: **BusinessDocument**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `documentNo` | String | Có | — | Không |
| `documentKind` | String | Có | — | Không |
| `workflowStatus` | String | Có | — | Không |
| `version` | Number | Có | — | Không |
| `createdBy` | ObjectId | Có | User | Không |
| `occurredAt` | Date | Không | — | Không |
| `note` | String | Không | — | Không |
| `externalReferenceIds` | Array | Không | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `createdBy` (objectId); `documentKind` (string); `documentNo` (string); `externalReferenceIds` (array); `header` (object); `note` (string); `occurredAt` (date); `updatedAt` (date); `version` (int); `workflowStatus` (string)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `documentNo_1`: `{"documentNo":1}`; unique=true; partial=`null`.
- `documentKind_1_workflowStatus_1_createdAt_1`: `{"documentKind":1,"workflowStatus":1,"createdAt":1}`; unique=false; partial=`null`.
- `header.dispatchId_1`: `{"header.dispatchId":1}`; unique=false; partial=`{"documentKind":"MWTR"}`.
- `header.externalReferenceId_1`: `{"header.externalReferenceId":1}`; unique=true; partial=`{"documentKind":"SALES_ORDER"}`.
- `documentKind_1_header.operationId_1`: `{"documentKind":1,"header.operationId":1}`; unique=true; partial=`{"header.operationId":{"$type":"objectId"}}`.
- `header.salesOrderId_1_header.deliveredOrderVersion_1`: `{"header.salesOrderId":1,"header.deliveredOrderVersion":1}`; unique=true; partial=`{"documentKind":"PAYMENT_CONFIRMATION"}`.
- `header.salesOrderId_1`: `{"header.salesOrderId":1}`; unique=false; partial=`{"documentKind":"ISSUE_REQUEST"}`.
- `header.salesOrderId_1_header.deliveredAt_1`: `{"header.salesOrderId":1,"header.deliveredAt":1}`; unique=false; partial=`{"documentKind":"DELIVERY_CONFIRMATION"}`.
- `header.stocktakeId_1`: `{"header.stocktakeId":1}`; unique=false; partial=`{"documentKind":"ST_RESOLUTION"}`.
- `documentKind_1_header.warehouseId_1_createdAt_-1__id_-1`: `{"documentKind":1,"header.warehouseId":1,"createdAt":-1,"_id":-1}`; unique=false; partial=`null`.
- `documentKind_1_createdBy_1_header.warehouseId_1_createdAt_-1__id_-1`: `{"documentKind":1,"createdBy":1,"header.warehouseId":1,"createdAt":-1,"_id":-1}`; unique=false; partial=`null`.
- `createdBy_1_header.creationKey_1`: `{"createdBy":1,"header.creationKey":1}`; unique=true; partial=`{"documentKind":"REPLENISHMENT","header.creationKey":{"$type":"string"}}`.

**Phân bố mã loại trong DB:**

- `ARRIVAL`: 1.
- `PO`: 1.
- `GR_CUSTOMER_RETURN`: 1.
- `ISSUE_REQUEST`: 2.
- `DELIVERY_CONFIRMATION`: 1.
- `CUSTODY_RECEIPT`: 1.
- `GR_FAILED_DELIVERY`: 1.
- `DEFECT_CASE`: 2.
- `GI_SUPPLIER_RETURN`: 1.
- `FAILED_DELIVERY`: 1.
- `TRANSFER_DISPATCH`: 1.
- `SUPPLIER_RETURN`: 1.
- `RECLASS`: 1.
- `INSPECTION`: 3.
- `GR_PURCHASE`: 1.
- `OUTBOUND_DELIVERY`: 3.
- `DISCREPANCY`: 1.
- `GI_SALE`: 2.
- `REPLENISHMENT`: 1.
- `STOCKTAKE`: 1.
- `ADJUSTMENT`: 1.
- `TRANSFER_REQUEST`: 1.
- `DISPOSITION`: 2.
- `CUSTODY_RELEASE`: 1.
- `ST_RESOLUTION`: 1.
- `MWTR`: 1.
- `SALES_ORDER`: 3.
- `TO`: 5.
- `OPENING`: 3.
- `HANDOVER`: 1.
- `PAYMENT_CONFIRMATION`: 1.
- `CUSTOMER_RETURN`: 1.
- `REVERSAL`: 1.
- `SCRAP`: 1.
- `SUPPLIER_ACK`: 1.

**Các schema loại con đang khai báo:**

- `BusinessDocument_REPLENISHMENT`: `header` [Embedded]
- `BusinessDocument_PO`: `header` [Embedded]
- `BusinessDocument_ARRIVAL`: `header` [Embedded]
- `BusinessDocument_INSPECTION`: Dùng các trường chung; chi tiết xem file schema.
- `BusinessDocument_GR_PURCHASE`: `header` [Embedded]
- `BusinessDocument_TO`: `header` [Embedded]
- `BusinessDocument_TRANSFER_REQUEST`: `header` [Embedded]
- `BusinessDocument_INTERNAL_TRANSFER_REQUIREMENT`: `header` [Embedded]
- `BusinessDocument_TRANSFER_DISPATCH`: `header` [Embedded]
- `BusinessDocument_MWTR`: `header` [Embedded]
- `BusinessDocument_HANDOVER`: `header` [Embedded]
- `BusinessDocument_SALES_ORDER`: `header` [Embedded]
- `BusinessDocument_ISSUE_REQUEST`: `header` [Embedded]
- `BusinessDocument_OUTBOUND_DELIVERY`: `header` [Embedded]
- `BusinessDocument_GI_SALE`: `header` [Embedded]
- `BusinessDocument_DELIVERY_CONFIRMATION`: `header` [Embedded]
- `BusinessDocument_PAYMENT_CONFIRMATION`: `header` [Embedded]
- `BusinessDocument_DEFECT_CASE`: `header` [Embedded]
- `BusinessDocument_DISPOSITION`: Dùng các trường chung; chi tiết xem file schema.
- `BusinessDocument_SCRAP`: Dùng các trường chung; chi tiết xem file schema.
- `BusinessDocument_STOCKTAKE`: `header` [Embedded]
- `BusinessDocument_ADJUSTMENT`: Dùng các trường chung; chi tiết xem file schema.
- `BusinessDocument_FAILED_DELIVERY`: `header` [Embedded]
- `BusinessDocument_GR_FAILED_DELIVERY`: `header` [Embedded]
- `BusinessDocument_ST_RESOLUTION`: `header` [Embedded]
- `BusinessDocument_RECLASS`: Dùng các trường chung; chi tiết xem file schema.
- `BusinessDocument_CUSTOMER_RETURN`: `header` [Embedded]
- `BusinessDocument_GR_CUSTOMER_RETURN`: `header` [Embedded]
- `BusinessDocument_SUPPLIER_RETURN`: `header` [Embedded]
- `BusinessDocument_GI_SUPPLIER_RETURN`: `header` [Embedded]
- `BusinessDocument_SUPPLIER_ACK`: Dùng các trường chung; chi tiết xem file schema.
- `BusinessDocument_DISCREPANCY`: Dùng các trường chung; chi tiết xem file schema.
- `BusinessDocument_CUSTODY_RECEIPT`: Dùng các trường chung; chi tiết xem file schema.
- `BusinessDocument_CUSTODY_RELEASE`: Dùng các trường chung; chi tiết xem file schema.
- `BusinessDocument_REVERSAL`: Dùng các trường chung; chi tiết xem file schema.
- `BusinessDocument_OPENING`: Dùng các trường chung; chi tiết xem file schema.

## business_operations

Ước lượng bản ghi: **6**. Model: **BusinessOperation**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `documentId` | ObjectId | Có | BusinessDocument | Không |
| `operation` | String | Có | — | Không |
| `operationKey` | String | Có | — | Không |
| `idempotencyKey` | String | Có | — | Không |
| `payloadHash` | String | Có | — | Không |
| `documentVersion` | Number | Có | — | Không |
| `performedBy` | ObjectId | Có | User | Không |
| `performedAt` | Date | Có | — | Không |
| `reason` | String | Không | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `documentId` (objectId); `documentVersion` (int); `idempotencyKey` (string); `operation` (string); `operationKey` (string); `payloadHash` (string); `performedAt` (date); `performedBy` (objectId); `reason` (string)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `idempotencyKey_1`: `{"idempotencyKey":1}`; unique=true; partial=`null`.
- `documentId_1_operation_1_operationKey_1`: `{"documentId":1,"operation":1,"operationKey":1}`; unique=true; partial=`null`.

## count_attempts

Ước lượng bản ghi: **1**. Model: **CountAttempt**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `snapshotId` | ObjectId | Có | StocktakeSnapshot | Không |
| `attemptNo` | Number | Có | — | Không |
| `countedQty` | Decimal128 | Có | — | Không |
| `countedBy` | ObjectId | Có | User | Không |
| `countedAt` | Date | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `attemptNo` (int); `countedAt` (date); `countedBy` (objectId); `countedQty` (decimal); `createdAt` (date); `snapshotId` (objectId)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `snapshotId_1_attemptNo_1`: `{"snapshotId":1,"attemptNo":1}`; unique=true; partial=`null`.

## customer_return_assessments

Ước lượng bản ghi: **1**. Model: **CustomerReturnAssessment**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `returnLineId` | ObjectId | Có | DocumentLine | Không |
| `assessmentNo` | Number | Có | — | Không |
| `documentVersion` | Number | Có | — | Không |
| `packagingCondition` | String | Có | — | Không |
| `installationStatus` | String | Có | — | Không |
| `damageCause` | String | Có | — | Không |
| `deadlineStatus` | String | Có | — | Không |
| `deadlineReference` | String | Không | — | Không |
| `eligibilityStatus` | String | Có | — | Không |
| `assessmentReason` | String | Có | — | Không |
| `assessedBy` | ObjectId | Có | User | Không |
| `assessedAt` | Date | Có | — | Không |
| `approvalId` | ObjectId | Không | Approval | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `approvalId` (objectId); `assessedAt` (date); `assessedBy` (objectId); `assessmentNo` (int); `assessmentReason` (string); `createdAt` (date); `damageCause` (string); `deadlineReference` (string); `deadlineStatus` (string); `documentVersion` (int); `eligibilityStatus` (string); `installationStatus` (string); `packagingCondition` (string); `returnLineId` (objectId)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `returnLineId_1_assessmentNo_1`: `{"returnLineId":1,"assessmentNo":1}`; unique=true; partial=`null`.
- `returnLineId_1_documentVersion_1_assessmentNo_-1`: `{"returnLineId":1,"documentVersion":1,"assessmentNo":-1}`; unique=false; partial=`null`.
- `eligibilityStatus_1_returnLineId_1`: `{"eligibilityStatus":1,"returnLineId":1}`; unique=false; partial=`null`.

## defect_holds

Ước lượng bản ghi: **1**. Model: **DefectHold**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `defectDocumentId` | ObjectId | Có | BusinessDocument | Có |
| `balanceId` | ObjectId | Có | StockBalance | Có |
| `stocktakeId` | ObjectId | Không | BusinessDocument | Có |
| `qtyBase` | Decimal128 | Có | — | Có |
| `evidenceId` | ObjectId | Có | Evidence | Có |
| `recordedBy` | ObjectId | Có | User | Có |
| `recordedAt` | Date | Có | — | Có |
| `status` | String | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `balanceId` (objectId); `createdAt` (date); `defectDocumentId` (objectId); `evidenceId` (objectId); `qtyBase` (decimal); `recordedAt` (date); `recordedBy` (objectId); `status` (string); `stocktakeId` (objectId); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `balanceId_1`: `{"balanceId":1}`; unique=false; partial=`{"status":"ACTIVE"}`.

## demand_reopenings

Ước lượng bản ghi: **1**. Model: **DemandReopening**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `receiptLineId` | ObjectId | Có | DocumentLine | Không |
| `salesOrderLineId` | ObjectId | Có | DocumentLine | Không |
| `issueRequestLineId` | ObjectId | Có | DocumentLine | Không |
| `outboundDeliveryLineId` | ObjectId | Có | DocumentLine | Không |
| `reopenedQty` | Decimal128 | Có | — | Không |
| `sourceVersion` | Number | Có | — | Không |
| `postingBatchId` | ObjectId | Có | PostingBatch | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `issueRequestLineId` (objectId); `outboundDeliveryLineId` (objectId); `postingBatchId` (objectId); `receiptLineId` (objectId); `reopenedQty` (decimal); `salesOrderLineId` (objectId); `sourceVersion` (int)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `receiptLineId_1`: `{"receiptLineId":1}`; unique=true; partial=`null`.

## demand_supply_allocations

Ước lượng bản ghi: **2**. Model: **DemandSupplyAllocation**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `demandLineId` | ObjectId | Có | DocumentLine | Không |
| `supplyLineId` | ObjectId | Có | DocumentLine | Không |
| `qtyBase` | Decimal128 | Có | — | Không |
| `status` | String | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `demandLineId` (objectId); `qtyBase` (decimal); `status` (string); `supplyLineId` (objectId); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `demandLineId_1_supplyLineId_1`: `{"demandLineId":1,"supplyLineId":1}`; unique=true; partial=`null`.

## document_lines

Ước lượng bản ghi: **50**. Model: **DocumentLine**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `documentId` | ObjectId | Có | BusinessDocument | Không |
| `lineNo` | Number | Có | — | Không |
| `lineKind` | String | Có | — | Không |
| `productId` | ObjectId | Có | Product | Không |
| `lotId` | ObjectId | Không | Lot | Không |
| `conversionId` | ObjectId | Có | ProductUomVersion | Không |
| `enteredQty` | Decimal128 | Có | — | Không |
| `conversionSnapshot` | Decimal128 | Có | — | Không |
| `qtyBase` | Decimal128 | Có | — | Không |
| `productNameSnapshot` | String | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `conversionId` (objectId); `conversionSnapshot` (decimal); `createdAt` (date); `details` (object); `documentId` (objectId); `enteredQty` (decimal); `lineKind` (string); `lineNo` (int); `lotId` (objectId); `productId` (objectId); `productNameSnapshot` (string); `qtyBase` (decimal); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `documentId_1_lineNo_1`: `{"documentId":1,"lineNo":1}`; unique=true; partial=`null`.
- `lotId_1`: `{"lotId":1}`; unique=false; partial=`null`.
- `details.salesOrderLineId_1_details.releaseKey_1`: `{"details.salesOrderLineId":1,"details.releaseKey":1}`; unique=true; partial=`{"lineKind":"ISSUE_REQUEST"}`.
- `details.externalLineId_1`: `{"details.externalLineId":1}`; unique=true; partial=`{"lineKind":"SALES_ORDER"}`.
- `documentId_1_details.salesIssueLineId_1`: `{"documentId":1,"details.salesIssueLineId":1}`; unique=true; partial=`{"lineKind":"DELIVERY_CONFIRMATION"}`.
- `issue_request_source`: `{"details.salesOrderLineId":1}`; unique=false; partial=`{"lineKind":"ISSUE_REQUEST"}`.
- `outbound_delivery_source`: `{"details.issueRequestLineId":1}`; unique=false; partial=`{"lineKind":"OUTBOUND_DELIVERY"}`.
- `sales_goods_issue_source`: `{"details.outboundDeliveryLineId":1}`; unique=false; partial=`{"lineKind":"SALES_GOODS_ISSUE"}`.
- `delivery_confirmation_source`: `{"details.salesIssueLineId":1}`; unique=false; partial=`{"lineKind":"DELIVERY_CONFIRMATION"}`.
- `failed_delivery_receipt_source`: `{"details.salesIssueLineId":1}`; unique=false; partial=`{"lineKind":"FAILED_DELIVERY_RECEIPT"}`.
- `details.dispatchLineId_1`: `{"details.dispatchLineId":1}`; unique=false; partial=`{"lineKind":"TRANSFER_RECEIPT"}`.
- `replenishment_source`: `{"details.sourceSalesOrderLineId":1}`; unique=false; partial=`{"lineKind":"REPLENISHMENT"}`.
- `details.sourceStocktakeId_1`: `{"details.sourceStocktakeId":1}`; unique=false; partial=`{"lineKind":"REPLENISHMENT"}`.

**Phân bố mã loại trong DB:**

- `SALES_ORDER`: 3.
- `STANDARD`: 20.
- `SUPPLIER_RETURN`: 1.
- `INSPECTION`: 3.
- `OUTBOUND_DELIVERY`: 3.
- `DISCREPANCY`: 1.
- `CUSTOMER_RETURN`: 1.
- `FAILED_DELIVERY_RECEIPT`: 1.
- `SUPPLIER_ACK`: 1.
- `WAREHOUSE_TASK`: 5.
- `SALES_GOODS_ISSUE`: 2.
- `ADJUSTMENT`: 1.
- `TRANSFER_RECEIPT`: 1.
- `DELIVERY_CONFIRMATION`: 1.
- `ISSUE_REQUEST`: 2.
- `DISPOSITION`: 2.
- `FAILED_DELIVERY`: 1.
- `ST_RESOLUTION`: 1.

**Các schema loại con đang khai báo:**

- `DocumentLine_STANDARD`: Dùng các trường chung; chi tiết xem file schema.
- `DocumentLine_REPLENISHMENT`: `details` [Embedded]
- `DocumentLine_SALES_ORDER`: `details` [Embedded]
- `DocumentLine_OUTBOUND_DELIVERY`: `details` [Embedded]
- `DocumentLine_SALES_GOODS_ISSUE`: `details` [Embedded]
- `DocumentLine_DELIVERY_CONFIRMATION`: `details` [Embedded]
- `DocumentLine_FAILED_DELIVERY`: `details` [Embedded]
- `DocumentLine_FAILED_DELIVERY_RECEIPT`: `details` [Embedded]
- `DocumentLine_ST_RESOLUTION`: `details` [Embedded]
- `DocumentLine_INSPECTION`: `details` [Embedded]
- `DocumentLine_TRANSFER_RECEIPT`: `details` [Embedded]
- `DocumentLine_TRANSFER_OUTBOUND`: `details` [Embedded]
- `DocumentLine_ISSUE_REQUEST`: `details` [Embedded]
- `DocumentLine_WAREHOUSE_TASK`: `details` [Embedded]
- `DocumentLine_DISPOSITION`: `details` [Embedded]
- `DocumentLine_CUSTOMER_RETURN`: `details` [Embedded]
- `DocumentLine_SUPPLIER_RETURN`: `details` [Embedded]
- `DocumentLine_SUPPLIER_ACK`: `details` [Embedded]
- `DocumentLine_DISCREPANCY`: `details` [Embedded]
- `DocumentLine_ADJUSTMENT`: `details` [Embedded]

## document_links

Ước lượng bản ghi: **40**. Model: **DocumentLink**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `parentDocumentId` | ObjectId | Có | BusinessDocument | Không |
| `childDocumentId` | ObjectId | Có | BusinessDocument | Không |
| `relationCode` | String | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `childDocumentId` (objectId); `createdAt` (date); `parentDocumentId` (objectId); `relationCode` (string); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `parentDocumentId_1_childDocumentId_1_relationCode_1`: `{"parentDocumentId":1,"childDocumentId":1,"relationCode":1}`; unique=true; partial=`null`.
- `childDocumentId_1`: `{"childDocumentId":1}`; unique=false; partial=`null`.

## evidence_refs

Ước lượng bản ghi: **5**. Model: **Evidence**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `documentId` | ObjectId | Có | BusinessDocument | Không |
| `objectKey` | String | Có | — | Không |
| `sha256` | String | Có | — | Không |
| `mediaType` | String | Có | — | Không |
| `uploadedBy` | ObjectId | Có | User | Không |
| `uploadedAt` | Date | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `documentId` (objectId); `mediaType` (string); `objectKey` (string); `sha256` (string); `uploadedAt` (date); `uploadedBy` (objectId)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `documentId_1`: `{"documentId":1}`; unique=false; partial=`null`.

## external_reference_lines

Ước lượng bản ghi: **3**. Model: **ExternalReferenceLine**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `referenceId` | ObjectId | Có | ExternalReference | Không |
| `lineKey` | String | Có | — | Không |
| `productId` | ObjectId | Có | Product | Không |
| `eligibleQty` | Decimal128 | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `eligibleQty` (decimal); `lineKey` (string); `productId` (objectId); `referenceId` (objectId); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `referenceId_1_lineKey_1`: `{"referenceId":1,"lineKey":1}`; unique=true; partial=`null`.

## external_references

Ước lượng bản ghi: **3**. Model: **ExternalReference**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `sourceSystem` | String | Có | — | Không |
| `referenceKind` | String | Có | — | Không |
| `referenceNo` | String | Có | — | Không |
| `referenceDate` | Date | Không | — | Không |
| `sourceVersion` | String | Không | — | Không |
| `correlationId` | String | Có | — | Không |
| `verifiedBy` | ObjectId | Không | User | Không |
| `verifiedAt` | Date | Không | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `correlationId` (string); `createdAt` (date); `referenceDate` (date); `referenceKind` (string); `referenceNo` (string); `sourceSystem` (string); `updatedAt` (date); `verifiedAt` (date); `verifiedBy` (objectId)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `correlationId_1`: `{"correlationId":1}`; unique=true; partial=`null`.
- `sourceSystem_1_referenceKind_1_referenceNo_1`: `{"sourceSystem":1,"referenceKind":1,"referenceNo":1}`; unique=true; partial=`null`.

## line_links

Ước lượng bản ghi: **38**. Model: **LineLink**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `sourceLineId` | ObjectId | Có | DocumentLine | Không |
| `targetLineId` | ObjectId | Có | DocumentLine | Không |
| `relationCode` | String | Có | — | Không |
| `linkedQty` | Decimal128 | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `linkedQty` (decimal); `relationCode` (string); `sourceLineId` (objectId); `targetLineId` (objectId); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `sourceLineId_1_targetLineId_1_relationCode_1`: `{"sourceLineId":1,"targetLineId":1,"relationCode":1}`; unique=true; partial=`null`.
- `targetLineId_1`: `{"targetLineId":1}`; unique=false; partial=`null`.

## location_locks

Ước lượng bản ghi: **1**. Model: **LocationLock**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `locationId` | ObjectId | Có | Location | Không |
| `stocktakeId` | ObjectId | Có | BusinessDocument | Không |
| `lockedAt` | Date | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `locationId` (objectId); `lockedAt` (date); `stocktakeId` (objectId); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `locationId_1`: `{"locationId":1}`; unique=true; partial=`null`.
- `stocktakeId_1`: `{"stocktakeId":1}`; unique=false; partial=`null`.

## locations

Ước lượng bản ghi: **15**. Model: **Location**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `warehouseId` | ObjectId | Có | Warehouse | Không |
| `code` | String | Có | — | Không |
| `kind` | String | Có | — | Không |
| `allocatable` | Boolean | Có | — | Không |
| `isActive` | Boolean | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |
| `planningVersion` | Number | Có | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `allocatable` (bool); `code` (string); `createdAt` (date); `isActive` (bool); `kind` (string); `updatedAt` (date); `warehouseId` (objectId)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `warehouseId_1_code_1`: `{"warehouseId":1,"code":1}`; unique=true; partial=`null`.

## lots

Ước lượng bản ghi: **3**. Model: **Lot**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `productId` | ObjectId | Có | Product | Không |
| `manufacturerLot` | String | Có | — | Không |
| `tone` | String | Có | — | Không |
| `calibre` | String | Có | — | Không |
| `identificationStatus` | String | Có | — | Không |
| `manufacturedOn` | Date | Không | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `calibre` (string); `createdAt` (date); `identificationStatus` (string); `manufacturedOn` (date); `manufacturerLot` (string); `productId` (objectId); `tone` (string); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `productId_1_manufacturerLot_1_tone_1_calibre_1`: `{"productId":1,"manufacturerLot":1,"tone":1,"calibre":1}`; unique=true; partial=`null`.

## notifications

Ước lượng bản ghi: **0**. Model: **Notification**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `recipientId` | ObjectId | Có | User | Có |
| `type` | String | Có | — | Có |
| `title` | String | Có | — | Có |
| `message` | String | Có | — | Có |
| `warehouseId` | ObjectId | Có | Warehouse | Có |
| `sourceDocumentId` | ObjectId | Có | BusinessDocument | Có |
| `sourceDocumentVersion` | Number | Có | — | Có |
| `eventKey` | String | Có | — | Có |
| `evaluatedAt` | Date | Có | — | Có |
| `readAt` | Date | Không | — | Không |
| `dedupKey` | String | Có | — | Có |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** Collection rỗng, không có mẫu.

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `dedupKey_1`: `{"dedupKey":1}`; unique=true; partial=`null`.
- `recipientId_1_createdAt_-1`: `{"recipientId":1,"createdAt":-1}`; unique=false; partial=`null`.
- `recipientId_1_readAt_1_createdAt_-1`: `{"recipientId":1,"readAt":1,"createdAt":-1}`; unique=false; partial=`null`.

## od_commitment_transfers

Ước lượng bản ghi: **1**. Model: **OdCommitmentTransfer**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `reopeningReceiptLineId` | ObjectId | Có | DocumentLine | Không |
| `fromOdLineId` | ObjectId | Có | DocumentLine | Không |
| `toOdLineId` | ObjectId | Có | DocumentLine | Không |
| `qtyBase` | Decimal128 | Có | — | Không |
| `sourceVersion` | Number | Có | — | Không |
| `targetVersion` | Number | Có | — | Không |
| `operationId` | ObjectId | Có | BusinessOperation | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `fromOdLineId` (objectId); `operationId` (objectId); `qtyBase` (decimal); `reopeningReceiptLineId` (objectId); `sourceVersion` (int); `targetVersion` (int); `toOdLineId` (objectId)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `operationId_1_fromOdLineId_1_toOdLineId_1`: `{"operationId":1,"fromOdLineId":1,"toOdLineId":1}`; unique=true; partial=`null`.

## outbox_events

Ước lượng bản ghi: **51**. Model: **OutboxEvent**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `documentId` | ObjectId | Có | BusinessDocument | Không |
| `eventType` | String | Có | — | Không |
| `eventKey` | String | Có | — | Không |
| `documentVersion` | Number | Có | — | Không |
| `deliveredAt` | Date | Không | — | Không |
| `attempts` | Number | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `attempts` (int); `createdAt` (date); `deliveredAt` (date); `documentId` (objectId); `eventKey` (string); `eventType` (string); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `eventKey_1`: `{"eventKey":1}`; unique=true; partial=`null`.
- `createdAt_1`: `{"createdAt":1}`; unique=false; partial=`{"deliveredAt":null}`.

## parties

Ước lượng bản ghi: **4**. Model: **Party**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `code` | String | Có | — | Không |
| `name` | String | Có | — | Không |
| `kind` | String | Có | — | Không |
| `contactReference` | String | Không | — | Không |
| `isActive` | Boolean | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `code` (string); `contactReference` (string); `createdAt` (date); `isActive` (bool); `kind` (string); `name` (string); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `code_1`: `{"code":1}`; unique=true; partial=`null`.
- `kind_1`: `{"kind":1}`; unique=true; partial=`{"kind":"STORE"}`.

## permissions

Ước lượng bản ghi: **98**. Model: **Permission**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `code` | String | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `code` (string); `createdAt` (date); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `code_1`: `{"code":1}`; unique=true; partial=`null`.

## posting_batches

Ước lượng bản ghi: **21**. Model: **PostingBatch**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `documentId` | ObjectId | Có | BusinessDocument | Không |
| `operation` | String | Có | — | Không |
| `operationKey` | String | Có | — | Không |
| `idempotencyKey` | String | Có | — | Không |
| `payloadHash` | String | Có | — | Không |
| `postedBy` | ObjectId | Có | User | Không |
| `postedAt` | Date | Có | — | Không |
| `reversalOf` | ObjectId | Không | PostingBatch | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `documentId` (objectId); `idempotencyKey` (string); `operation` (string); `operationKey` (string); `payloadHash` (string); `postedAt` (date); `postedBy` (objectId); `reversalOf` (objectId)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `idempotencyKey_1`: `{"idempotencyKey":1}`; unique=true; partial=`null`.
- `documentId_1_operation_1_operationKey_1`: `{"documentId":1,"operation":1,"operationKey":1}`; unique=true; partial=`null`.
- `reversalOf_1`: `{"reversalOf":1}`; unique=true; partial=`{"reversalOf":{"$type":"objectId"}}`.
- `postedAt_1`: `{"postedAt":1}`; unique=false; partial=`null`.

## product_uom_versions

Ước lượng bản ghi: **4**. Model: **ProductUomVersion**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `productId` | ObjectId | Có | Product | Không |
| `uomId` | ObjectId | Có | Uom | Không |
| `version` | Number | Có | — | Không |
| `basePerUnit` | Decimal128 | Có | — | Không |
| `validFrom` | Date | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `basePerUnit` (decimal); `createdAt` (date); `productId` (objectId); `uomId` (objectId); `validFrom` (date); `version` (int)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `productId_1_uomId_1_version_1`: `{"productId":1,"uomId":1,"version":1}`; unique=true; partial=`null`.

## product_warehouse_policies

Ước lượng bản ghi: **6**. Model: **ProductWarehousePolicy**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `productId` | ObjectId | Có | Product | Không |
| `warehouseId` | ObjectId | Có | Warehouse | Không |
| `minimumQty` | Decimal128 | Có | — | Không |
| `targetQty` | Decimal128 | Có | — | Không |
| `version` | Number | Có | — | Không |
| `updatedBy` | ObjectId | Không | User | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `minimumQty` (decimal); `productId` (objectId); `updatedAt` (date); `warehouseId` (objectId)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `productId_1_warehouseId_1`: `{"productId":1,"warehouseId":1}`; unique=true; partial=`null`.

## products

Ước lượng bản ghi: **2**. Model: **Product**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `sku` | String | Có | — | Không |
| `name` | String | Có | — | Không |
| `baseUomId` | ObjectId | Có | Uom | Không |
| `wholeBaseUnits` | Boolean | Có | — | Không |
| `nominalSize` | String | Không | — | Không |
| `isActive` | Boolean | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `baseUomId` (objectId); `createdAt` (date); `isActive` (bool); `name` (string); `nominalSize` (string); `sku` (string); `updatedAt` (date); `wholeBaseUnits` (bool)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `sku_1`: `{"sku":1}`; unique=true; partial=`null`.

## replenishment_planning_guards

Ước lượng bản ghi: **0**. Model: **ReplenishmentPlanningGuard**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `warehouseId` | ObjectId | Có | Warehouse | Không |
| `productId` | ObjectId | Có | Product | Không |
| `version` | Number | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** Collection rỗng, không có mẫu.

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `warehouseId_1_productId_1`: `{"warehouseId":1,"productId":1}`; unique=true; partial=`null`.

## reservations

Ước lượng bản ghi: **2**. Model: **Reservation**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `demandLineId` | ObjectId | Có | DocumentLine | Không |
| `executionLineId` | ObjectId | Có | DocumentLine | Không |
| `balanceId` | ObjectId | Có | StockBalance | Không |
| `qtyBase` | Decimal128 | Có | — | Không |
| `status` | String | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `balanceId` (objectId); `createdAt` (date); `demandLineId` (objectId); `executionLineId` (objectId); `qtyBase` (decimal); `status` (string); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `balanceId_1`: `{"balanceId":1}`; unique=false; partial=`{"status":"ACTIVE"}`.
- `demandLineId_1_status_1`: `{"demandLineId":1,"status":1}`; unique=false; partial=`null`.

## return_source_claims

Ước lượng bản ghi: **2**. Model: **ReturnSourceClaim**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `requestLineId` | ObjectId | Có | DocumentLine | Có |
| `salesIssueLineId` | ObjectId | Không | DocumentLine | Có |
| `historicalExternalLineId` | ObjectId | Không | ExternalReferenceLine | Có |
| `claimKind` | String | Có | — | Có |
| `qtyBase` | Decimal128 | Có | — | Có |
| `status` | String | Có | — | Không |
| `operationId` | ObjectId | Có | BusinessOperation | Có |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `claimKind` (string); `createdAt` (date); `operationId` (objectId); `qtyBase` (decimal); `requestLineId` (objectId); `salesIssueLineId` (objectId); `status` (string); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `requestLineId_1_operationId_1`: `{"requestLineId":1,"operationId":1}`; unique=true; partial=`null`.
- `salesIssueLineId_1_claimKind_1_status_1`: `{"salesIssueLineId":1,"claimKind":1,"status":1}`; unique=false; partial=`null`.
- `historicalExternalLineId_1_status_1`: `{"historicalExternalLineId":1,"status":1}`; unique=false; partial=`null`.

## return_source_guards

Ước lượng bản ghi: **0**. Model: **chưa tìm thấy trong models/index.js**.


**Trường quan sát trong mẫu MongoDB:** Collection rỗng, không có mẫu.

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.

## roles

Ước lượng bản ghi: **5**. Model: **Role**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `code` | String | Có | — | Không |
| `permissionIds` | Array | Không | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `code` (string); `createdAt` (date); `permissionIds` (array); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `code_1`: `{"code":1}`; unique=true; partial=`null`.

**Phân bố mã loại trong DB:**

- `WAREHOUSE`: 1.
- `ACCOUNTANT`: 1.
- `ADMIN`: 1.
- `SALES`: 1.
- `OWNER`: 1.

## sales_order_cancellations

Ước lượng bản ghi: **1**. Model: **SalesOrderCancellation**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `salesOrderId` | ObjectId | Có | BusinessDocument | Không |
| `salesOrderLineId` | ObjectId | Có | DocumentLine | Không |
| `cancelledQtyBase` | Decimal128 | Có | — | Không |
| `cancelledBy` | ObjectId | Có | User | Không |
| `cancelledAt` | Date | Có | — | Không |
| `reason` | String | Có | — | Không |
| `operationId` | ObjectId | Có | BusinessOperation | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `cancelledAt` (date); `cancelledBy` (objectId); `cancelledQtyBase` (decimal); `createdAt` (date); `operationId` (objectId); `reason` (string); `salesOrderId` (objectId); `salesOrderLineId` (objectId)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `operationId_1`: `{"operationId":1}`; unique=true; partial=`null`.
- `salesOrderLineId_1`: `{"salesOrderLineId":1}`; unique=false; partial=`null`.

## stock_accounts

Ước lượng bản ghi: **16**. Model: **StockAccount**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `locationId` | ObjectId | Không | Location | Có |
| `transitDispatchLineId` | ObjectId | Không | DocumentLine | Có |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `locationId` (objectId); `transitDispatchLineId` (objectId); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `locationId_1`: `{"locationId":1}`; unique=true; partial=`{"locationId":{"$type":"objectId"}}`.
- `transitDispatchLineId_1`: `{"transitDispatchLineId":1}`; unique=true; partial=`{"transitDispatchLineId":{"$type":"objectId"}}`.

## stock_balances

Ước lượng bản ghi: **11**. Model: **StockBalance**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `accountId` | ObjectId | Có | StockAccount | Có |
| `lotId` | ObjectId | Có | Lot | Có |
| `qualityCode` | String | Có | — | Có |
| `ownerPartyId` | ObjectId | Có | Party | Có |
| `qtyBase` | Decimal128 | Có | — | Không |
| `version` | Number | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `accountId` (objectId); `createdAt` (date); `lotId` (objectId); `ownerPartyId` (objectId); `qtyBase` (decimal); `qualityCode` (string); `updatedAt` (date); `version` (int)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `accountId_1_lotId_1_qualityCode_1_ownerPartyId_1`: `{"accountId":1,"lotId":1,"qualityCode":1,"ownerPartyId":1}`; unique=true; partial=`null`.
- `lotId_1_qualityCode_1`: `{"lotId":1,"qualityCode":1}`; unique=false; partial=`null`.

## stock_movements

Ước lượng bản ghi: **22**. Model: **StockMovement**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `batchId` | ObjectId | Có | PostingBatch | Không |
| `documentId` | ObjectId | Có | BusinessDocument | Không |
| `lineId` | ObjectId | Có | DocumentLine | Không |
| `fromBalanceId` | ObjectId | Không | StockBalance | Không |
| `toBalanceId` | ObjectId | Không | StockBalance | Không |
| `qtyBase` | Decimal128 | Có | — | Không |
| `fromBefore` | Decimal128 | Không | — | Không |
| `fromAfter` | Decimal128 | Không | — | Không |
| `toBefore` | Decimal128 | Không | — | Không |
| `toAfter` | Decimal128 | Không | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `batchId` (objectId); `createdAt` (date); `documentId` (objectId); `fromAfter` (decimal); `fromBalanceId` (objectId); `fromBefore` (decimal); `lineId` (objectId); `qtyBase` (decimal); `toAfter` (decimal); `toBalanceId` (objectId); `toBefore` (decimal)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `fromBalanceId_1_batchId_1`: `{"fromBalanceId":1,"batchId":1}`; unique=false; partial=`null`.
- `toBalanceId_1_batchId_1`: `{"toBalanceId":1,"batchId":1}`; unique=false; partial=`null`.
- `documentId_1_lineId_1`: `{"documentId":1,"lineId":1}`; unique=false; partial=`null`.

## stocktake_snapshots

Ước lượng bản ghi: **1**. Model: **StocktakeSnapshot**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `stocktakeId` | ObjectId | Có | BusinessDocument | Không |
| `balanceId` | ObjectId | Có | StockBalance | Không |
| `bookQty` | Decimal128 | Có | — | Không |
| `foundAfterCutoff` | Boolean | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `balanceId` (objectId); `bookQty` (decimal); `createdAt` (date); `foundAfterCutoff` (bool); `stocktakeId` (objectId)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `stocktakeId_1_balanceId_1`: `{"stocktakeId":1,"balanceId":1}`; unique=true; partial=`null`.

## uoms

Ước lượng bản ghi: **3**. Model: **Uom**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `code` | String | Có | — | Không |
| `name` | String | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `code` (string); `createdAt` (date); `name` (string); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `code_1`: `{"code":1}`; unique=true; partial=`null`.

## users

Ước lượng bản ghi: **6**. Model: **User**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `username` | String | Có | — | Không |
| `fullName` | String | Có | — | Không |
| `passwordHash` | String | Có | — | Không |
| `roleId` | ObjectId | Có | Role | Không |
| `warehouseIds` | Array | Không | — | Không |
| `phone` | String | Không | — | Không |
| `isActive` | Boolean | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `createdAt` (date); `fullName` (string); `isActive` (bool); `passwordHash` (string); `phone` (string); `roleId` (objectId); `updatedAt` (date); `username` (string); `warehouseIds` (array)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `username_1`: `{"username":1}`; unique=true; partial=`null`.
- `roleId_1`: `{"roleId":1}`; unique=false; partial=`null`.

## warehouses

Ước lượng bản ghi: **3**. Model: **Warehouse**.

| Trường schema | Kiểu | Bắt buộc theo schema | Ref model | Bất biến theo khai báo |
|---|---|---|---|---|
| `code` | String | Có | — | Không |
| `name` | String | Có | — | Không |
| `address` | String | Không | — | Không |
| `isActive` | Boolean | Có | — | Không |
| `_id` | ObjectId | Không | — | Không |
| `createdAt` | Date | Không | — | Có |
| `updatedAt` | Date | Không | — | Không |

**Trường quan sát trong mẫu MongoDB:** `_id` (objectId); `address` (string); `code` (string); `createdAt` (date); `isActive` (bool); `name` (string); `updatedAt` (date)

**Index đang có:**

- `_id_`: `{"_id":1}`; unique=false; partial=`null`.
- `code_1`: `{"code":1}`; unique=true; partial=`null`.
