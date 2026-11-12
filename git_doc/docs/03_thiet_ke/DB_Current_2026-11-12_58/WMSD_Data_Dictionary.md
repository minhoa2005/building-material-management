# Từ điển dữ liệu hiện hành — 12/11/2026

58 collection. Dòng nhúng có ID ổn định; không phải collection độc lập. Mongoose ref là liên kết ứng dụng, không phải foreign key do MongoDB kiểm. Native return workflow additions and compatibility are documented in [RETURN_WORKFLOWS_NATIVE](../../08_api/RETURN_WORKFLOWS_NATIVE.md). `DocumentIdentity` nhận mã liền dạng String, mã String đã lưu có dấu cách quanh dấu nối và ObjectId lịch sử. [Quy tắc định danh](../../08_api/DOCUMENT_IDENTITIES.md).

## uoms

Model: [uom.model.js](../../../../src/models/uom.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `code` | String | true |  |
| `name` | String | true |  |
| `isActive` | Boolean | true |  |
| `isCarton` | Boolean | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

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

## conversions

Model: [conversion.model.js](../../../../src/models/conversion.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `productId` | ObjectId | true | Product |
| `productBatchId` | ObjectId | false | ProductBatch |
| `uomId` | ObjectId | true | Uom |
| `basePerUnit` | Decimal128 | true |  |
| `version` | Number | true |  |
| `validFrom` | Date | true |  |
| `verificationReference` | String | true |  |
| `createdBy` | ObjectId | false | User |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "productId": 1,
      "productBatchId": 1,
      "uomId": 1,
      "validFrom": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "productId": 1,
      "productBatchId": 1,
      "uomId": 1,
      "version": 1
    },
    {
      "unique": true
    }
  ]
]
```

## categories

Model: [category.model.js](../../../../src/models/category.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `code` | String | true |  |
| `name` | String | true |  |
| `description` | String | false |  |
| `isActive` | Boolean | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "code": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ]
]
```

## users

Model: [user.model.js](../../../../src/models/user.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `username` | String | true |  |
| `fullName` | String | true |  |
| `passwordHash` | String | true |  |
| `roleId` | ObjectId | true | Role |
| `warehouseIds` | Array | false |  |
| `phone` | String | false |  |
| `email` | String | false |  |
| `isActive` | Boolean | true |  |
| `version` | Number | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "username": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ]
]
```

## roles

Model: [role.model.js](../../../../src/models/role.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `code` | String | true |  |
| `name` | String | true |  |
| `description` | String | false |  |
| `permissionIds` | Array | false |  |
| `isSystemRole` | Boolean | false |  |
| `isActive` | Boolean | true |  |
| `version` | Number | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "code": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ]
]
```

## permissions

Model: [permission.model.js](../../../../src/models/permission.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `code` | String | true |  |
| `name` | String | true |  |
| `description` | String | false |  |
| `featureCode` | String | false |  |
| `isActive` | Boolean | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "code": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ]
]
```

## warehouses

Model: [warehouse.model.js](../../../../src/models/warehouse.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `code` | String | true |  |
| `name` | String | true |  |
| `address` | String | false |  |
| `description` | String | false |  |
| `lengthMm` | Number | false |  |
| `widthMm` | Number | false |  |
| `clearHeightMm` | Number | false |  |
| `isActive` | Boolean | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "code": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ]
]
```

## warehouse_locations

Model: [warehouse-location.model.js](../../../../src/models/warehouse-location.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `warehouseId` | ObjectId | true | Warehouse |
| `code` | String | true |  |
| `name` | String | false |  |
| `areaCode` | String | false |  |
| `locationType` | String | true |  |
| `isPickable` | Boolean | false |  |
| `description` | String | false |  |
| `isActive` | Boolean | true |  |
| `version` | Number | true |  |
| `operationVersion` | Number | true |  |
| `usableLengthMm` | Number | false |  |
| `usableWidthMm` | Number | false |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

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

## products

Model: [product.model.js](../../../../src/models/product.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `sku` | String | true |  |
| `manufacturerCode` | String | true |  |
| `name` | String | true |  |
| `categoryId` | ObjectId | true | Category |
| `material` | String | false |  |
| `surface` | String | false |  |
| `origin` | String | false |  |
| `description` | String | false |  |
| `imageUrls` | Array | false |  |
| `baseUnit` | String | true |  |
| `wholeBaseUnits` | Boolean | true |  |
| `lengthMm` | Decimal128 | true |  |
| `widthMm` | Decimal128 | true |  |
| `heightMm` | Decimal128 | true |  |
| `color` | String | true |  |
| `isActive` | Boolean | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `stockThresholds` | Array | false |  |
| `stockThresholds[].warehouseId` | ObjectId | true | Warehouse |
| `stockThresholds[].minimumQty` | Decimal128 | true |  |
| `stockThresholds[].targetQty` | Decimal128 | true |  |
| `stockThresholds[].updatedBy` | ObjectId | false | User |
| `stockThresholds[]._id` | ObjectId | false |  |
| `stockThresholds[].createdAt` | Date | false |  |
| `stockThresholds[].updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "manufacturerCode": 1,
      "sku": 1,
      "color": 1
    },
    {
      "unique": true,
      "collation": {
        "locale": "vi",
        "strength": 2
      }
    }
  ],
  [
    {
      "categoryId": 1
    },
    {}
  ],
  [
    {
      "stockThresholds._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ]
]
```

## customers

Model: [customer.model.js](../../../../src/models/customer.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `code` | String | true |  |
| `name` | String | true |  |
| `phone` | String | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "code": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ]
]
```

## suppliers

Model: [supplier.model.js](../../../../src/models/supplier.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `code` | String | true |  |
| `name` | String | true |  |
| `contactName` | String | false |  |
| `taxCode` | String | false |  |
| `notes` | String | false |  |
| `statusReason` | String | false |  |
| `phone` | String | false |  |
| `email` | String | false |  |
| `address` | String | false |  |
| `status` | String | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "code": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ]
]
```

## stock_holding_points

Model: [stock-holding-point.model.js](../../../../src/models/stock-holding-point.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `type` | String | true |  |
| `locationId` | ObjectId | false | WarehouseLocation |
| `dispatchLineId` | ObjectId | false |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

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
      "dispatchLineId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "dispatchLineId": {
          "$type": "objectId"
        }
      }
    }
  ]
]
```

## inventory_balances

Model: [inventory-balance.model.js](../../../../src/models/inventory-balance.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `holdingPointId` | ObjectId | true | StockHoldingPoint |
| `batchId` | ObjectId | true | ProductBatch |
| `qualityStatus` | String | true |  |
| `ownerType` | String | true |  |
| `ownerId` | ObjectId | false |  |
| `quantityBase` | Decimal128 | true |  |
| `version` | Number | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `packagingPortions` | Array | false |  |
| `packagingPortions[].packagingState` | String | true |  |
| `packagingPortions[].packagingSnapshot` | Embedded | false |  |
| `packagingPortions[].packagingSnapshot.packageUnit` | String | true |  |
| `packagingPortions[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `packagingPortions[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `packagingPortions[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `packagingPortions[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `packagingPortions[].packagingKey` | String | false |  |
| `packagingPortions[].sealedPackCount` | Number | false |  |
| `packagingPortions[].quantityBase` | Decimal128 | true |  |
| `packagingPortions[].createdBy` | ObjectId | true | User |
| `packagingPortions[].updatedBy` | ObjectId | false | User |
| `packagingPortions[]._id` | ObjectId | false |  |
| `packagingPortions[].createdAt` | Date | false |  |
| `packagingPortions[].updatedAt` | Date | false |  |
| `packagingPortions[].measuredVolumeMm3` | Decimal128 | false |  |
| `packagingPortions[].extraOccupiedVolumeMm3` | Decimal128 | false |  |

Indexes:

```json
[
  [
    {
      "holdingPointId": 1,
      "batchId": 1,
      "qualityStatus": 1,
      "ownerType": 1,
      "ownerId": 1
    },
    {
      "unique": true
    }
  ]
]
```

## stock_transactions

Model: [stock-transaction.model.js](../../../../src/models/stock-transaction.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `sourceType` | String | true |  |
| `operation` | String | true |  |
| `eventKey` | String | true |  |
| `requestKey` | String | true |  |
| `requestHash` | String | true |  |
| `performedBy` | ObjectId | true | User |
| `occurredAt` | Date | true |  |
| `recordedAt` | Date | true |  |
| `reversedTransactionId` | ObjectId | false | StockTransaction |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `movements` | Array | false |  |
| `movements[].transactionId` | ObjectId | true | StockTransaction |
| `movements[].lineNo` | Number | true |  |
| `movements[].packagingPortionIds` | Array | false |  |
| `movements[].sourceLineId` | ObjectId | true |  |
| `movements[].fromBalanceId` | ObjectId | false | InventoryBalance |
| `movements[].toBalanceId` | ObjectId | false | InventoryBalance |
| `movements[].quantityBase` | Decimal128 | true |  |
| `movements[].fromBefore` | Decimal128 | false |  |
| `movements[].fromAfter` | Decimal128 | false |  |
| `movements[].toBefore` | Decimal128 | false |  |
| `movements[].toAfter` | Decimal128 | false |  |
| `movements[]._id` | ObjectId | false |  |
| `movements[].createdAt` | Date | false |  |
| `movements[].updatedAt` | Date | false |  |
| `sourceId` | DocumentIdentity | true |  |

Indexes:

```json
[
  [
    {
      "requestKey": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "sourceId": 1,
      "operation": 1,
      "eventKey": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "reversedTransactionId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "reversedTransactionId": {
          "$type": "objectId"
        }
      }
    }
  ],
  [
    {
      "movements._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ],
  [
    {
      "movements.fromBalanceId": 1,
      "occurredAt": 1
    },
    {}
  ],
  [
    {
      "movements.toBalanceId": 1,
      "occurredAt": 1
    },
    {}
  ]
]
```

## stock_reservations

Model: [stock-reservation.model.js](../../../../src/models/stock-reservation.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `demandRef` | Embedded | true |  |
| `demandRef.documentType` | String | true |  |
| `demandRef.itemId` | ObjectId | false |  |
| `demandRef.revision` | Number | false |  |
| `demandRef.documentId` | DocumentIdentity | true |  |
| `executionRef` | Embedded | false |  |
| `executionRef.documentType` | String | true |  |
| `executionRef.itemId` | ObjectId | false |  |
| `executionRef.revision` | Number | false |  |
| `executionRef.documentId` | DocumentIdentity | true |  |
| `balanceId` | ObjectId | true | InventoryBalance |
| `reservedQty` | Decimal128 | true |  |
| `consumedQty` | Decimal128 | true |  |
| `releasedQty` | Decimal128 | true |  |
| `movedQty` | Decimal128 | true |  |
| `previousReservationId` | ObjectId | false | StockReservation |
| `sourceAllocationId` | ObjectId | false | SupplyAllocation |
| `originMovementId` | ObjectId | false | embedded:stock_movements |
| `creationKey` | String | true |  |
| `createdBy` | ObjectId | true | User |
| `updatedBy` | ObjectId | false | User |
| `version` | Number | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "creationKey": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "balanceId": 1
    },
    {}
  ],
  [
    {
      "demandRef.documentId": 1,
      "demandRef.itemId": 1
    },
    {}
  ]
]
```

## supply_allocations

Model: [supply-allocation.model.js](../../../../src/models/supply-allocation.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `demandRef` | Embedded | true |  |
| `demandRef.documentType` | String | true |  |
| `demandRef.itemId` | ObjectId | false |  |
| `demandRef.revision` | Number | false |  |
| `demandRef.documentId` | DocumentIdentity | true |  |
| `sourceRef` | Embedded | true |  |
| `sourceRef.documentType` | String | true |  |
| `sourceRef.itemId` | ObjectId | false |  |
| `sourceRef.revision` | Number | false |  |
| `sourceRef.documentId` | DocumentIdentity | true |  |
| `destinationWarehouseId` | ObjectId | true | Warehouse |
| `allocatedQty` | Decimal128 | true |  |
| `receivedAssignedQty` | Decimal128 | true |  |
| `releasedQty` | Decimal128 | true |  |
| `neededBy` | Date | true |  |
| `creationKey` | String | true |  |
| `createdBy` | ObjectId | true | User |
| `updatedBy` | ObjectId | false | User |
| `version` | Number | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "creationKey": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ]
]
```

## approval_history

Model: [approval-history.model.js](../../../../src/models/approval-history.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `decisionKey` | String | true |  |
| `subjectType` | String | true |  |
| `subjectRevision` | Number | true |  |
| `decisionScope` | String | true |  |
| `reviewedContent` | Mixed | true |  |
| `decision` | String | true |  |
| `reason` | String | true |  |
| `itemDecisions` | Array | false |  |
| `itemDecisions[].itemId` | ObjectId | true |  |
| `itemDecisions[].approvedQtyBase` | Decimal128 | true |  |
| `itemDecisions[].outcome` | String | true |  |
| `itemDecisions[].reason` | String | false |  |
| `requestedBy` | ObjectId | true | User |
| `decidedBy` | ObjectId | true | User |
| `decidedAt` | Date | true |  |
| `recordedAt` | Date | true |  |
| `authoritySnapshot` | Embedded | false |  |
| `authoritySnapshot.roleCode` | String | true |  |
| `authoritySnapshot.permissionCode` | String | true |  |
| `authoritySnapshot.warehouseIds` | Array | false |  |
| `basisRefs` | Array | false |  |
| `basisRefs[].documentType` | String | true |  |
| `basisRefs[].itemId` | ObjectId | false |  |
| `basisRefs[].revision` | Number | false |  |
| `basisRefs[].documentId` | DocumentIdentity | true |  |
| `evidenceIds` | Array | false |  |
| `supersedesDecisionId` | ObjectId | false | ApprovalHistory |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `subjectId` | DocumentIdentity | true |  |

Indexes:

```json
[
  [
    {
      "decisionKey": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "subjectType": 1,
      "subjectId": 1,
      "subjectRevision": 1
    },
    {}
  ]
]
```

## attachments

Model: [attachment.model.js](../../../../src/models/attachment.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `ownerDocumentType` | String | true |  |
| `ownerItemId` | ObjectId | false |  |
| `ownerRevision` | Number | false |  |
| `purpose` | String | true |  |
| `originalName` | String | true |  |
| `mediaType` | String | true |  |
| `sizeBytes` | Number | true |  |
| `storageKey` | String | true |  |
| `checksum` | String | true |  |
| `uploadedBy` | ObjectId | true | User |
| `uploadedAt` | Date | true |  |
| `capturedAt` | Date | false |  |
| `accessCategory` | String | true |  |
| `status` | String | true |  |
| `uploadSessionId` | String | false |  |
| `expiresAt` | Date | false |  |
| `replacesAttachmentId` | ObjectId | false | Attachment |
| `replacementReason` | String | false |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `ownerDocumentId` | DocumentIdentity | false |  |

Indexes:

```json
[]
```

## return_quantity_claims

Model: [return-quantity-claim.model.js](../../../../src/models/return-quantity-claim.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `claimKind` | String | true |  |
| `requestLineId` | ObjectId | true |  |
| `sourceKind` | String | true |  |
| `sourceLineId` | ObjectId | true |  |
| `claimedQtyBase` | Decimal128 | true |  |
| `createdBy` | ObjectId | true | User |
| `operationId` | ObjectId | true | OperationRecord |
| `version` | Number | true |  |
| `events` | Array | false |  |
| `events[].kind` | String | true |  |
| `events[].quantityBase` | Decimal128 | true |  |
| `events[].sourceRef` | Embedded | false |  |
| `events[].sourceRef.documentType` | String | true |  |
| `events[].sourceRef.itemId` | ObjectId | false |  |
| `events[].sourceRef.revision` | Number | false |  |
| `events[].sourceRef.documentId` | DocumentIdentity | true |  |
| `events[].performedBy` | ObjectId | true | User |
| `events[].performedAt` | Date | true |  |
| `events[].reason` | String | false |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

```json
[]
```

## stocktake_snapshots

Model: [stocktake-snapshot.model.js](../../../../src/models/stocktake-snapshot.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `scopeVersion` | Number | true |  |
| `cutoffAt` | Date | true |  |
| `capturedAt` | Date | true |  |
| `sourceBalanceId` | ObjectId | false | InventoryBalance |
| `locationId` | ObjectId | true | WarehouseLocation |
| `batchId` | ObjectId | true | ProductBatch |
| `ownerType` | String | true |  |
| `ownerId` | ObjectId | false |  |
| `qualityStatus` | String | true |  |
| `bookQtyBase` | Decimal128 | true |  |
| `baseUnitSnapshot` | String | true |  |
| `sourceBalanceVersion` | Number | false |  |
| `origin` | String | true |  |
| `discoveredAt` | Date | false |  |
| `discoveredBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `stocktakeId` | DocumentIdentity | true | Stocktake |

Indexes:

```json
[
  [
    {
      "stocktakeId": 1,
      "locationId": 1,
      "batchId": 1,
      "qualityStatus": 1,
      "ownerType": 1,
      "ownerId": 1
    },
    {
      "unique": true
    }
  ]
]
```

## stocktake_counts

Model: [stocktake-count.model.js](../../../../src/models/stocktake-count.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `scopeVersion` | Number | true |  |
| `locationId` | ObjectId | true | WarehouseLocation |
| `targetType` | String | true |  |
| `snapshotId` | ObjectId | false | StocktakeSnapshot |
| `attemptNo` | Number | true |  |
| `previousCountId` | ObjectId | false | StocktakeCount |
| `recountReason` | String | false |  |
| `quantityEntries` | Array | false |  |
| `quantityEntries[].enteredUnit` | String | true |  |
| `quantityEntries[].enteredQty` | Decimal128 | true |  |
| `quantityEntries[].baseUnitsPerUnit` | Decimal128 | true |  |
| `quantityEntries[].quantityBase` | Decimal128 | true |  |
| `countedQtyBase` | Decimal128 | true |  |
| `baseUnitSnapshot` | String | false |  |
| `conditionNote` | String | false |  |
| `evidenceIds` | Array | false |  |
| `countedBy` | ObjectId | true | User |
| `countedAt` | Date | true |  |
| `recordedAt` | Date | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `stocktakeId` | DocumentIdentity | true | Stocktake |

Indexes:

```json
[
  [
    {
      "stocktakeId": 1,
      "locationId": 1,
      "snapshotId": 1,
      "attemptNo": 1
    },
    {
      "unique": true
    }
  ]
]
```

## stocktake_location_locks

Model: [stocktake-location-lock.model.js](../../../../src/models/stocktake-location-lock.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `locationId` | ObjectId | true | WarehouseLocation |
| `scopeVersion` | Number | true |  |
| `lockedAt` | Date | true |  |
| `lockedBy` | ObjectId | true | User |
| `status` | String | true |  |
| `version` | Number | true |  |
| `releasedAt` | Date | false |  |
| `releasedBy` | ObjectId | false | User |
| `closureReferenceId` | ObjectId | false |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `stocktakeId` | DocumentIdentity | true | Stocktake |

Indexes:

```json
[
  [
    {
      "locationId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "status": "LOCKED"
      }
    }
  ]
]
```

## notifications

Model: [notification.model.js](../../../../src/models/notification.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `recipientId` | ObjectId | true | User |
| `type` | String | true |  |
| `eventKey` | String | true |  |
| `dedupKey` | String | true |  |
| `sourceType` | String | true |  |
| `sourceVersion` | Number | true |  |
| `warehouseIds` | Array | false |  |
| `title` | String | true |  |
| `message` | String | true |  |
| `occurredAt` | Date | true |  |
| `readAt` | Date | false |  |
| `archivedAt` | Date | false |  |
| `conditionKey` | String | false |  |
| `conditionState` | String | false |  |
| `evaluatedAt` | Date | false |  |
| `emailDelivery` | Embedded | false |  |
| `emailDelivery.status` | String | true |  |
| `emailDelivery.attempts` | Number | true |  |
| `emailDelivery.sentAt` | Date | false |  |
| `emailDelivery.lastError` | String | false |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `sourceId` | DocumentIdentity | true |  |

Indexes:

```json
[
  [
    {
      "dedupKey": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "recipientId": 1,
      "readAt": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## audit_logs

Model: [audit-log.model.js](../../../../src/models/audit-log.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `eventKey` | String | true |  |
| `correlationId` | String | false |  |
| `actorType` | String | true |  |
| `actorId` | ObjectId | false | User |
| `actorSnapshot` | Embedded | false |  |
| `actorSnapshot.username` | String | true |  |
| `actorSnapshot.roleCode` | String | true |  |
| `action` | String | true |  |
| `result` | String | true |  |
| `reason` | String | false |  |
| `subjectType` | String | true |  |
| `warehouseIds` | Array | false |  |
| `versionBefore` | Number | false |  |
| `versionAfter` | Number | false |  |
| `changes` | Array | false |  |
| `changes[].field` | String | true |  |
| `changes[].before` | Mixed | false |  |
| `changes[].after` | Mixed | false |  |
| `decisionId` | ObjectId | false | ApprovalHistory |
| `transactionId` | ObjectId | false | StockTransaction |
| `operationId` | ObjectId | false | OperationRecord |
| `occurredAt` | Date | true |  |
| `recordedAt` | Date | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `subjectId` | DocumentIdentity | true |  |

Indexes:

```json
[
  [
    {
      "eventKey": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "subjectId": 1,
      "occurredAt": 1
    },
    {}
  ]
]
```

## system_events

Model: [system-event.model.js](../../../../src/models/system-event.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `eventKey` | String | true |  |
| `handlerCode` | String | true |  |
| `eventType` | String | true |  |
| `sourceType` | String | true |  |
| `sourceVersion` | Number | true |  |
| `correlationId` | String | false |  |
| `payload` | Mixed | true |  |
| `payloadVersion` | Number | true |  |
| `status` | String | true |  |
| `attempts` | Number | true |  |
| `nextAttemptAt` | Date | false |  |
| `leaseOwner` | String | false |  |
| `leaseToken` | String | false |  |
| `leaseUntil` | Date | false |  |
| `lastErrorCode` | String | false |  |
| `lastErrorSummary` | String | false |  |
| `completedAt` | Date | false |  |
| `occurredAt` | Date | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `sourceId` | DocumentIdentity | true |  |

Indexes:

```json
[
  [
    {
      "eventKey": 1,
      "handlerCode": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "status": 1,
      "nextAttemptAt": 1
    },
    {}
  ]
]
```

## operation_records

Model: [operation-record.model.js](../../../../src/models/operation-record.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `actorType` | String | true |  |
| `actorId` | ObjectId | false | User |
| `operationCode` | String | true |  |
| `requestKey` | String | true |  |
| `requestHash` | String | true |  |
| `operationKey` | String | true |  |
| `subjectType` | String | true |  |
| `versionBefore` | Number | true |  |
| `versionAfter` | Number | true |  |
| `resultRefs` | Array | false |  |
| `resultRefs[].documentType` | String | true |  |
| `resultRefs[].itemId` | ObjectId | false |  |
| `resultRefs[].revision` | Number | false |  |
| `resultRefs[].documentId` | DocumentIdentity | true |  |
| `resultCode` | String | true |  |
| `completedAt` | Date | true |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `decisionId` | ObjectId | false | ApprovalHistory |
| `correlationId` | String | false |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `subjectId` | DocumentIdentity | true |  |

Indexes:

```json
[
  [
    {
      "actorType": 1,
      "actorId": 1,
      "operationCode": 1,
      "requestKey": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "operationKey": 1
    },
    {
      "unique": true
    }
  ]
]
```

## replenishment_locks

Model: [replenishment-lock.model.js](../../../../src/models/replenishment-lock.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `warehouseId` | ObjectId | true | Warehouse |
| `productId` | ObjectId | true | Product |
| `version` | Number | true |  |
| `lastOperationId` | ObjectId | false | OperationRecord |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "warehouseId": 1,
      "productId": 1
    },
    {
      "unique": true
    }
  ]
]
```

## return_source_locks

Model: [return-source-lock.model.js](../../../../src/models/return-source-lock.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `sourceKey` | String | true |  |
| `sourceKind` | String | true |  |
| `sourceItemId` | ObjectId | true |  |
| `version` | Number | true |  |
| `lastOperationId` | ObjectId | false | OperationRecord |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `sourceDocumentId` | DocumentIdentity | true |  |

Indexes:

```json
[
  [
    {
      "sourceKey": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ]
]
```

## external_references

Model: [external-reference.model.js](../../../../src/models/external-reference.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `sourceSystem` | String | true |  |
| `referenceKind` | String | true |  |
| `referenceNo` | String | true |  |
| `referenceDate` | Date | false |  |
| `sourceVersion` | String | false |  |
| `correlationId` | String | true |  |
| `verifiedBy` | ObjectId | false | User |
| `verifiedAt` | Date | false |  |
| `customerId` | ObjectId | false | Customer |
| `warehouseId` | ObjectId | false | Warehouse |
| `evidenceIds` | Array | false |  |
| `status` | String | true |  |
| `note` | String | false |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineKey` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].eligibleQty` | Decimal128 | true |  |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | false |  |
| `items[].baseUnitSnapshot` | String | false |  |
| `items[].baseUnitsPerUnit` | Decimal128 | false |  |
| `items[].previouslyReturnedQty` | Decimal128 | true |  |
| `items[]._id` | ObjectId | false |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "correlationId": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "sourceSystem": 1,
      "referenceKind": 1,
      "referenceNo": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "items._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ]
]
```

## product_batches

Model: [product-batch.model.js](../../../../src/models/product-batch.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `productId` | ObjectId | true | Product |
| `manufacturerLot` | String | true |  |
| `identificationStatus` | String | true |  |
| `manufacturedOn` | Date | false |  |
| `piecesPerCarton` | Number | true |  |
| `cartonLengthMm` | Decimal128 | true |  |
| `cartonWidthMm` | Decimal128 | true |  |
| `cartonHeightMm` | Decimal128 | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

```json
[
  [
    {
      "productId": 1,
      "manufacturerLot": 1
    },
    {
      "unique": true
    }
  ]
]
```

## replenishment_requests

Model: [replenishment-request.model.js](../../../../src/models/replenishment-request.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.neededOn` | Date | true |  |
| `header.triggerReason` | String | true |  |
| `header.creationKey` | String | true |  |
| `header.submittedBy` | ObjectId | false | User |
| `header.submittedAt` | Date | false |  |
| `header.approvedRevision` | Number | false |  |
| `header.latestDecisionId` | ObjectId | false | ApprovalHistory |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].approvedQtyBase` | Decimal128 | false |  |
| `items[].requiredBatchId` | ObjectId | false | ProductBatch |
| `items[].neededBy` | Date | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `submissions` | Array | false |  |
| `submissions[].documentVersion` | Number | true |  |
| `submissions[].submittedBy` | ObjectId | true | User |
| `submissions[].submittedAt` | Date | true |  |
| `submissions[].warehouseId` | ObjectId | true | Warehouse |
| `submissions[].warehouseCodeSnapshot` | String | true |  |
| `submissions[].warehouseNameSnapshot` | String | true |  |
| `submissions[].neededOn` | Date | true |  |
| `submissions[].triggerReason` | String | true |  |
| `submissions[].note` | String | false |  |
| `submissions[].lines` | Array | true |  |
| `submissions[].lines[].lineId` | ObjectId | true | item |
| `submissions[].lines[].lineNo` | Number | true |  |
| `submissions[].lines[].productId` | ObjectId | true | Product |
| `submissions[].lines[].productSkuSnapshot` | String | true |  |
| `submissions[].lines[].productNameSnapshot` | String | true |  |
| `submissions[].lines[].baseUomCodeSnapshot` | String | true |  |
| `submissions[].lines[].enteredUomCodeSnapshot` | String | true |  |
| `submissions[].lines[].conversionVersion` | Number | true |  |
| `submissions[].lines[].enteredQty` | Decimal128 | true |  |
| `submissions[].lines[].conversionSnapshot` | Decimal128 | true |  |
| `submissions[].lines[].qtyBase` | Decimal128 | true |  |
| `submissions[].lines[].triggerType` | String | true |  |
| `submissions[].lines[].evaluation` | Embedded | false |  |
| `submissions[].lines[].evaluation.triggerType` | String | true |  |
| `submissions[].lines[].evaluation.source` | Embedded | false |  |
| `submissions[].lines[].evaluation.source.triggerType` | String | true |  |
| `submissions[].lines[].evaluation.source.documentType` | String | false |  |
| `submissions[].lines[].evaluation.source.itemId` | ObjectId | false |  |
| `submissions[].lines[].evaluation.source.version` | Number | false |  |
| `submissions[].lines[].evaluation.source.salesOrderItemId` | ObjectId | false |  |
| `submissions[].lines[].evaluation.source.salesOrderVersion` | Number | false |  |
| `submissions[].lines[].evaluation.source.documentId` | DocumentIdentity | false |  |
| `submissions[].lines[].evaluation.source.salesOrderId` | DocumentIdentity | false |  |
| `submissions[].lines[].evaluation.canonicalSourceKey` | String | false |  |
| `submissions[].lines[].evaluation.independentNeedConfirmed` | Boolean | false |  |
| `submissions[].lines[].evaluation.independentNeedReason` | String | false |  |
| `submissions[].lines[].evaluation.sourceSalesOrderLineId` | ObjectId | false | item |
| `submissions[].lines[].evaluation.sourceSalesOrderVersion` | Number | false |  |
| `submissions[].lines[].evaluation.sourceIssueRequestLineId` | ObjectId | false | item |
| `submissions[].lines[].evaluation.sourceIssueRequestVersion` | Number | false |  |
| `submissions[].lines[].evaluation.sourceStocktakeVersion` | Number | false |  |
| `submissions[].lines[].evaluation.policyId` | ObjectId | false | embedded:stock_thresholds |
| `submissions[].lines[].evaluation.policyVersion` | Number | false |  |
| `submissions[].lines[].evaluation.evaluationKey` | String | false |  |
| `submissions[].lines[].evaluation.evaluatedAt` | Date | false |  |
| `submissions[].lines[].evaluation.availableQtySnapshot` | Decimal128 | false |  |
| `submissions[].lines[].evaluation.otherWarehouseCoverageQtySnapshot` | Decimal128 | false |  |
| `submissions[].lines[].evaluation.remainingDemandQtySnapshot` | Decimal128 | false |  |
| `submissions[].lines[].evaluation.reservedForDemandQtySnapshot` | Decimal128 | false |  |
| `submissions[].lines[].evaluation.onHandCoverageQtySnapshot` | Decimal128 | false |  |
| `submissions[].lines[].evaluation.incomingCoverageQtySnapshot` | Decimal128 | false |  |
| `submissions[].lines[].evaluation.pendingRequestCoverageQtySnapshot` | Decimal128 | false |  |
| `submissions[].lines[].evaluation.minimumQtySnapshot` | Decimal128 | false |  |
| `submissions[].lines[].evaluation.targetQtySnapshot` | Decimal128 | false |  |
| `submissions[].lines[].evaluation.suggestedQty` | Decimal128 | false |  |
| `submissions[].lines[].evaluation.reasonNote` | String | false |  |
| `submissions[].lines[].evaluation.quantityAdjustmentReason` | String | false |  |
| `submissions[].lines[].evaluation.sourceStocktakeId` | DocumentIdentity | false |  |
| `submissions[].lines[].reasonNote` | String | false |  |
| `submissions[].lines[].baseUnitSnapshot` | String | true |  |
| `submissions[].lines[].enteredUnit` | String | true |  |
| `submissions[].lines[].baseUnitsPerUnit` | Decimal128 | true |  |
| `submissions[]._id` | ObjectId | false |  |
| `submissions[].createdAt` | Date | false |  |
| `submissions[].updatedAt` | Date | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## purchase_orders

Model: [purchase-order.model.js](../../../../src/models/purchase-order.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.supplierId` | ObjectId | true | Supplier |
| `header.expectedOn` | Date | false |  |
| `header.supplierConfirmation` | String | false |  |
| `header.approvedRequestRevision` | Number | false |  |
| `header.orderDate` | Date | false |  |
| `header.issuedAt` | Date | false |  |
| `header.closedAt` | Date | false |  |
| `header.closureDecisionId` | ObjectId | false | ApprovalHistory |
| `header.closureReason` | String | false |  |
| `header.supplierSnapshot` | Embedded | false |  |
| `header.supplierSnapshot.code` | String | true |  |
| `header.supplierSnapshot.name` | String | true |  |
| `header.supplierSnapshot.phone` | String | false |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].unitPurchasePrice` | Decimal128 | true |  |
| `items[].lineAmount` | Decimal128 | true |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].requestItemId` | ObjectId | false |  |
| `items[].supplierConfirmedQtyBase` | Decimal128 | false |  |
| `items[].supplierConfirmedBy` | ObjectId | false | User |
| `items[].supplierConfirmedAt` | Date | false |  |
| `items[].cancelledRemainderQtyBase` | Decimal128 | false |  |
| `items[].cancellationDecisionId` | ObjectId | false | ApprovalHistory |
| `items[].deliverySchedule` | Array | false |  |
| `items[].deliverySchedule[].quantityBase` | Decimal128 | true |  |
| `items[].deliverySchedule[].expectedAt` | Date | true |  |
| `items[].deliverySchedule[].supplierReference` | String | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `totalAmount` | Decimal128 | true |  |
| `currency` | String | true |  |
| `_id` | DocumentIdentity | false |  |
| `replenishmentRequestId` | DocumentIdentity | true |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ],
  [
    {
      "replenishmentRequestId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "replenishmentRequestId": {
          "$type": "objectId"
        }
      }
    }
  ]
]
```

## goods_arrivals

Model: [goods-arrival.model.js](../../../../src/models/goods-arrival.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.supplierId` | ObjectId | false | Supplier |
| `header.arrivedAt` | Date | true |  |
| `header.deliveryReference` | String | false |  |
| `header.recordedAt` | Date | false |  |
| `header.deliveredBy` | String | false |  |
| `header.vehicleReference` | String | false |  |
| `header.purchaseOrderId` | DocumentIdentity | false | PurchaseOrder |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].purchaseOrderItemId` | ObjectId | false |  |
| `items[].expectedProductId` | ObjectId | false | Product |
| `items[].observedLabel` | String | false |  |
| `items[].lotLabelSnapshot` | String | false |  |
| `items[].packagingCondition` | String | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## goods_inspections

Model: [goods-inspection.model.js](../../../../src/models/goods-inspection.model.js).

`items[].details.receivingLocationId` là ObjectId tùy chọn tham chiếu `WarehouseLocation`, khai báo trong [inspection-details.schema.js](../../../../src/models/inspection-details.schema.js). Lệnh kiểm nhận mua xác thực vị trí đang hoạt động, thuộc kho nhận và có loại `RECEIVING`. Bản ghi cũ có thể thiếu trường này.

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.correctionReason` | String | false |  |
| `header.participants` | Array | false |  |
| `header.confirmedBy` | ObjectId | false | User |
| `header.confirmedAt` | Date | false |  |
| `header.arrivalId` | DocumentIdentity | false | GoodsArrival |
| `header.previousInspectionId` | DocumentIdentity | false | GoodsInspection |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## goods_receipts

Model: [goods-receipt.model.js](../../../../src/models/goods-receipt.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `custodyDecisionId` | ObjectId | false | ApprovalHistory |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].purchaseOrderItemId` | ObjectId | false |  |
| `items[].arrivalItemId` | ObjectId | false |  |
| `items[].inspectionResultId` | ObjectId | false |  |
| `items[].destinationLocationId` | ObjectId | false | WarehouseLocation |
| `items[].custodyReceiptRef` | Embedded | false |  |
| `items[].custodyReceiptRef.documentType` | String | true |  |
| `items[].custodyReceiptRef.itemId` | ObjectId | false |  |
| `items[].custodyReceiptRef.revision` | Number | false |  |
| `items[].custodyReceiptRef.documentId` | DocumentIdentity | true |  |
| `items[].custodyBalanceId` | ObjectId | false | InventoryBalance |
| `items[].supplierScheduleId` | ObjectId | false |  |
| `items[].qualityCode` | String | false |  |
| `items[].inspectionId` | DocumentIdentity | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |
| `{PurchaseReceipt}.header` | Embedded | true |  |
| `{CustomerReturnReceipt}.header` | Embedded | true |  |
| `{FailedDeliveryReceipt}.header` | Embedded | true |  |
| `{FailedDeliveryReceipt}.demandReopenings` | Array | false |  |
| `{FailedDeliveryReceipt}.commitmentTransfers` | Array | false |  |
| `{TransferReceipt}.header` | Embedded | true |  |
| `{OtherGoodsReceipt}.header` | Embedded | true |  |
| `{OtherGoodsReceipt}.approvedStockHash` | String | false |  |
| `{OtherGoodsReceipt}.approvedVersion` | Number | false |  |
| `{OtherGoodsReceipt}.approvalDecisionId` | ObjectId | false | ApprovalHistory |

Indexes:

```json
[
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ],
  [
    {
      "documentKind": 1,
      "documentNo": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "documentKind": 1,
      "header.warehouseId": 1,
      "createdAt": -1
    },
    {}
  ],
  [
    {
      "demandReopenings._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ],
  [
    {
      "commitmentTransfers._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ]
]
```

## transfer_orders

Model: [transfer-order.model.js](../../../../src/models/transfer-order.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.taskKind` | String | true |  |
| `header.assignedTo` | ObjectId | true | User |
| `header.reason` | String | false |  |
| `header.confirmedBy` | ObjectId | false | User |
| `header.confirmedAt` | Date | false |  |
| `header.requirementId` | DocumentIdentity | false | InternalTransferRequirement |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ],
  [
    {
      "header.requirementId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "header.requirementId": {
          "$type": [
            "objectId",
            "string"
          ]
        }
      }
    }
  ]
]
```

## warehouse_transfer_requests

Model: [warehouse-transfer-request.model.js](../../../../src/models/warehouse-transfer-request.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.sourceWarehouseId` | ObjectId | true | Warehouse |
| `header.destinationWarehouseId` | ObjectId | true | Warehouse |
| `header.neededOn` | Date | false |  |
| `header.approvedVersion` | Number | false |  |
| `header.approvedRevision` | Number | false |  |
| `header.requestedBy` | ObjectId | false | User |
| `header.requestedAt` | Date | false |  |
| `header.reason` | String | false |  |
| `header.approvalStatus` | String | false |  |
| `header.executionStatus` | String | false |  |
| `header.reviewedBy` | ObjectId | false | User |
| `header.reviewedAt` | Date | false |  |
| `header.rejectionReason` | String | false |  |
| `header.closedBy` | ObjectId | false | User |
| `header.closedAt` | Date | false |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].approvedQtyBase` | Decimal128 | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## internal_transfer_requirements

Model: [internal-transfer-requirement.model.js](../../../../src/models/internal-transfer-requirement.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.taskKind` | String | true |  |
| `header.sourceType` | String | false |  |
| `header.sourceDocumentId` | DocumentIdentity | true |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ],
  [
    {
      "header.sourceDocumentId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "header.sourceDocumentId": {
          "$type": [
            "objectId",
            "string"
          ]
        }
      }
    }
  ]
]
```

## transfer_dispatches

Model: [transfer-dispatch.model.js](../../../../src/models/transfer-dispatch.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.dispatchedBy` | ObjectId | true | User |
| `header.dispatchedAt` | Date | true |  |
| `header.approvedRevision` | Number | false |  |
| `header.sourceWarehouseId` | ObjectId | false | Warehouse |
| `header.destinationWarehouseId` | ObjectId | false | Warehouse |
| `header.requestId` | DocumentIdentity | true |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `handovers` | Array | false |  |
| `handovers[].documentNo` | String | true |  |
| `handovers[].documentKind` | String | true |  |
| `handovers[].workflowStatus` | String | true |  |
| `handovers[].version` | Number | true |  |
| `handovers[].createdBy` | ObjectId | true | User |
| `handovers[].occurredAt` | Date | false |  |
| `handovers[].note` | String | false |  |
| `handovers[].externalReferenceIds` | Array | false |  |
| `handovers[].sources` | Array | false |  |
| `handovers[].sources[].subjectCollection` | String | true |  |
| `handovers[].sources[].relationCode` | String | true |  |
| `handovers[].sources[].handoverId` | ObjectId | false |  |
| `handovers[].sources[].createdAt` | Date | false |  |
| `handovers[].sources[].updatedAt` | Date | false |  |
| `handovers[].sources[].itemId` | ObjectId | false |  |
| `handovers[].sources[].linkedQty` | Decimal128 | false |  |
| `handovers[].sources[]._id` | ObjectId | false |  |
| `handovers[].sources[].documentId` | DocumentIdentity | true |  |
| `handovers[].header` | Embedded | true |  |
| `handovers[].header.recipientName` | String | true |  |
| `handovers[].header.handedOverAt` | Date | true |  |
| `handovers[].header.confirmedBy` | ObjectId | true | User |
| `handovers[].header.vehiclePlate` | String | false |  |
| `handovers[].header.relatedDocumentId` | DocumentIdentity | true |  |
| `handovers[].createdAt` | Date | false |  |
| `handovers[].updatedAt` | Date | false |  |
| `handovers[].items` | Array | false |  |
| `handovers[].items[].lineNo` | Number | true |  |
| `handovers[].items[].lineKind` | String | true |  |
| `handovers[].items[].productId` | ObjectId | true | Product |
| `handovers[].items[].lotId` | ObjectId | false | ProductBatch |
| `handovers[].items[].enteredUnit` | String | true |  |
| `handovers[].items[].baseUnitSnapshot` | String | true |  |
| `handovers[].items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `handovers[].items[].packagingSnapshot` | Embedded | false |  |
| `handovers[].items[].packagingSnapshot.packageUnit` | String | true |  |
| `handovers[].items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `handovers[].items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `handovers[].items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `handovers[].items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `handovers[].items[].enteredQty` | Decimal128 | true |  |
| `handovers[].items[].qtyBase` | Decimal128 | true |  |
| `handovers[].items[].productNameSnapshot` | String | true |  |
| `handovers[].items[].sources` | Array | false |  |
| `handovers[].items[].sources[].subjectCollection` | String | true |  |
| `handovers[].items[].sources[].relationCode` | String | true |  |
| `handovers[].items[].sources[].handoverId` | ObjectId | false |  |
| `handovers[].items[].sources[].createdAt` | Date | false |  |
| `handovers[].items[].sources[].updatedAt` | Date | false |  |
| `handovers[].items[].sources[].itemId` | ObjectId | false |  |
| `handovers[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `handovers[].items[].sources[]._id` | ObjectId | false |  |
| `handovers[].items[].sources[].documentId` | DocumentIdentity | true |  |
| `handovers[].items[].createdAt` | Date | false |  |
| `handovers[].items[].updatedAt` | Date | false |  |
| `handovers[].items[]._id` | ObjectId | false |  |
| `handovers[].items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `handovers[].tenLoaiPhieu` | String | false |  |
| `handovers[].maDonVi` | String | false |  |
| `handovers[].kyDanhSo` | String | false |  |
| `handovers[].soThuTu` | Number | false |  |
| `handovers[].trangThaiTiengViet` | String | false |  |
| `handovers[]._id` | DocumentIdentity | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## sales_orders

Model: [sales-order.model.js](../../../../src/models/sales-order.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `replenishmentPlanningVersion` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.externalReferenceId` | ObjectId | true | ExternalReference |
| `header.customerId` | ObjectId | true | Customer |
| `header.neededOn` | Date | true |  |
| `header.deliveryAddressSnapshot` | String | true |  |
| `header.recipientName` | String | false |  |
| `header.recipientPhone` | String | false |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].unitSellingPrice` | Decimal128 | true |  |
| `items[].lineAmount` | Decimal128 | true |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].priceRevision` | Number | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `orderAmount` | Decimal128 | true |  |
| `currencyCode` | String | true |  |
| `paymentConfirmations` | Array | false |  |
| `paymentConfirmations[].documentNo` | String | true |  |
| `paymentConfirmations[].documentKind` | String | true |  |
| `paymentConfirmations[].workflowStatus` | String | true |  |
| `paymentConfirmations[].version` | Number | true |  |
| `paymentConfirmations[].createdBy` | ObjectId | true | User |
| `paymentConfirmations[].occurredAt` | Date | false |  |
| `paymentConfirmations[].note` | String | false |  |
| `paymentConfirmations[].externalReferenceIds` | Array | false |  |
| `paymentConfirmations[].sources` | Array | false |  |
| `paymentConfirmations[].sources[].subjectCollection` | String | true |  |
| `paymentConfirmations[].sources[].relationCode` | String | true |  |
| `paymentConfirmations[].sources[].handoverId` | ObjectId | false |  |
| `paymentConfirmations[].sources[].createdAt` | Date | false |  |
| `paymentConfirmations[].sources[].updatedAt` | Date | false |  |
| `paymentConfirmations[].sources[].itemId` | ObjectId | false |  |
| `paymentConfirmations[].sources[].linkedQty` | Decimal128 | false |  |
| `paymentConfirmations[].sources[]._id` | ObjectId | false |  |
| `paymentConfirmations[].sources[].documentId` | DocumentIdentity | true |  |
| `paymentConfirmations[].header` | Embedded | true |  |
| `paymentConfirmations[].header.deliveredOrderVersion` | Number | true |  |
| `paymentConfirmations[].header.fullPaymentReceived` | Boolean | true |  |
| `paymentConfirmations[].header.externalReceiptReference` | String | false |  |
| `paymentConfirmations[].header.receiptEvidenceId` | ObjectId | false | Attachment |
| `paymentConfirmations[].header.confirmationNote` | String | false |  |
| `paymentConfirmations[].header.confirmedBy` | ObjectId | true | User |
| `paymentConfirmations[].header.confirmedAt` | Date | true |  |
| `paymentConfirmations[].header.operationId` | ObjectId | true | OperationRecord |
| `paymentConfirmations[].header.voidedBy` | ObjectId | false | User |
| `paymentConfirmations[].header.voidedAt` | Date | false |  |
| `paymentConfirmations[].header.voidReason` | String | false |  |
| `paymentConfirmations[].header.salesOrderId` | DocumentIdentity | true |  |
| `paymentConfirmations[].header.replacesId` | DocumentIdentity | false |  |
| `paymentConfirmations[].updatedBy` | ObjectId | false | User |
| `paymentConfirmations[].evidenceIds` | Array | false |  |
| `paymentConfirmations[].cancelledBy` | ObjectId | false | User |
| `paymentConfirmations[].cancelledAt` | Date | false |  |
| `paymentConfirmations[].cancelReason` | String | false |  |
| `paymentConfirmations[].createdAt` | Date | false |  |
| `paymentConfirmations[].updatedAt` | Date | false |  |
| `paymentConfirmations[].items` | Array | false |  |
| `paymentConfirmations[].items[].lineNo` | Number | true |  |
| `paymentConfirmations[].items[].lineKind` | String | true |  |
| `paymentConfirmations[].items[].productId` | ObjectId | true | Product |
| `paymentConfirmations[].items[].lotId` | ObjectId | false | ProductBatch |
| `paymentConfirmations[].items[].enteredUnit` | String | true |  |
| `paymentConfirmations[].items[].baseUnitSnapshot` | String | true |  |
| `paymentConfirmations[].items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `paymentConfirmations[].items[].packagingSnapshot` | Embedded | false |  |
| `paymentConfirmations[].items[].packagingSnapshot.packageUnit` | String | true |  |
| `paymentConfirmations[].items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `paymentConfirmations[].items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `paymentConfirmations[].items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `paymentConfirmations[].items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `paymentConfirmations[].items[].enteredQty` | Decimal128 | true |  |
| `paymentConfirmations[].items[].qtyBase` | Decimal128 | true |  |
| `paymentConfirmations[].items[].productNameSnapshot` | String | true |  |
| `paymentConfirmations[].items[].sources` | Array | false |  |
| `paymentConfirmations[].items[].sources[].subjectCollection` | String | true |  |
| `paymentConfirmations[].items[].sources[].relationCode` | String | true |  |
| `paymentConfirmations[].items[].sources[].handoverId` | ObjectId | false |  |
| `paymentConfirmations[].items[].sources[].createdAt` | Date | false |  |
| `paymentConfirmations[].items[].sources[].updatedAt` | Date | false |  |
| `paymentConfirmations[].items[].sources[].itemId` | ObjectId | false |  |
| `paymentConfirmations[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `paymentConfirmations[].items[].sources[]._id` | ObjectId | false |  |
| `paymentConfirmations[].items[].sources[].documentId` | DocumentIdentity | true |  |
| `paymentConfirmations[].items[].createdAt` | Date | false |  |
| `paymentConfirmations[].items[].updatedAt` | Date | false |  |
| `paymentConfirmations[].items[]._id` | ObjectId | false |  |
| `paymentConfirmations[].items[].note` | String | false |  |
| `paymentConfirmations[].items[].evidenceIds` | Array | false |  |
| `paymentConfirmations[].items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `paymentConfirmations[].items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `paymentConfirmations[].tenLoaiPhieu` | String | false |  |
| `paymentConfirmations[].maDonVi` | String | false |  |
| `paymentConfirmations[].kyDanhSo` | String | false |  |
| `paymentConfirmations[].soThuTu` | Number | false |  |
| `paymentConfirmations[].trangThaiTiengViet` | String | false |  |
| `paymentConfirmations[]._id` | DocumentIdentity | false |  |
| `cancellations` | Array | false |  |
| `cancellations[].salesOrderLineId` | ObjectId | true |  |
| `cancellations[].sourceKind` | String | true |  |
| `cancellations[].reopeningReceiptLineId` | ObjectId | false |  |
| `cancellations[].cancelledQtyBase` | Decimal128 | true |  |
| `cancellations[].reason` | String | true |  |
| `cancellations[].sourceVersion` | Number | true |  |
| `cancellations[].cancelledBy` | ObjectId | true | User |
| `cancellations[].cancelledAt` | Date | true |  |
| `cancellations[].operationId` | ObjectId | true | OperationRecord |
| `cancellations[]._id` | ObjectId | false |  |
| `cancellations[].createdAt` | Date | false |  |
| `cancellations[].updatedAt` | Date | false |  |
| `cancellations[].salesOrderId` | DocumentIdentity | true | SalesOrder |
| `deliveryConfirmations` | Array | false |  |
| `deliveryConfirmations[].documentNo` | String | true |  |
| `deliveryConfirmations[].documentKind` | String | true |  |
| `deliveryConfirmations[].workflowStatus` | String | true |  |
| `deliveryConfirmations[].version` | Number | true |  |
| `deliveryConfirmations[].createdBy` | ObjectId | true | User |
| `deliveryConfirmations[].occurredAt` | Date | false |  |
| `deliveryConfirmations[].note` | String | false |  |
| `deliveryConfirmations[].externalReferenceIds` | Array | false |  |
| `deliveryConfirmations[].sources` | Array | false |  |
| `deliveryConfirmations[].sources[].subjectCollection` | String | true |  |
| `deliveryConfirmations[].sources[].relationCode` | String | true |  |
| `deliveryConfirmations[].sources[].handoverId` | ObjectId | false |  |
| `deliveryConfirmations[].sources[].createdAt` | Date | false |  |
| `deliveryConfirmations[].sources[].updatedAt` | Date | false |  |
| `deliveryConfirmations[].sources[].itemId` | ObjectId | false |  |
| `deliveryConfirmations[].sources[].linkedQty` | Decimal128 | false |  |
| `deliveryConfirmations[].sources[]._id` | ObjectId | false |  |
| `deliveryConfirmations[].sources[].documentId` | DocumentIdentity | true |  |
| `deliveryConfirmations[].header` | Embedded | true |  |
| `deliveryConfirmations[].header.warehouseId` | ObjectId | true | Warehouse |
| `deliveryConfirmations[].header.recipientName` | String | true |  |
| `deliveryConfirmations[].header.deliveredAt` | Date | true |  |
| `deliveryConfirmations[].header.confirmedBy` | ObjectId | true | User |
| `deliveryConfirmations[].header.confirmedAt` | Date | true |  |
| `deliveryConfirmations[].header.operationId` | ObjectId | true | OperationRecord |
| `deliveryConfirmations[].header.salesOrderId` | DocumentIdentity | true |  |
| `deliveryConfirmations[].header.goodsIssueId` | DocumentIdentity | false | SalesGoodsIssue |
| `deliveryConfirmations[].header.correctsConfirmationId` | DocumentIdentity | false |  |
| `deliveryConfirmations[].updatedBy` | ObjectId | false | User |
| `deliveryConfirmations[].evidenceIds` | Array | false |  |
| `deliveryConfirmations[].cancelledBy` | ObjectId | false | User |
| `deliveryConfirmations[].cancelledAt` | Date | false |  |
| `deliveryConfirmations[].cancelReason` | String | false |  |
| `deliveryConfirmations[].createdAt` | Date | false |  |
| `deliveryConfirmations[].updatedAt` | Date | false |  |
| `deliveryConfirmations[].items` | Array | false |  |
| `deliveryConfirmations[].items[].lineNo` | Number | true |  |
| `deliveryConfirmations[].items[].lineKind` | String | true |  |
| `deliveryConfirmations[].items[].productId` | ObjectId | true | Product |
| `deliveryConfirmations[].items[].lotId` | ObjectId | false | ProductBatch |
| `deliveryConfirmations[].items[].enteredUnit` | String | true |  |
| `deliveryConfirmations[].items[].baseUnitSnapshot` | String | true |  |
| `deliveryConfirmations[].items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `deliveryConfirmations[].items[].packagingSnapshot` | Embedded | false |  |
| `deliveryConfirmations[].items[].packagingSnapshot.packageUnit` | String | true |  |
| `deliveryConfirmations[].items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `deliveryConfirmations[].items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `deliveryConfirmations[].items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `deliveryConfirmations[].items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `deliveryConfirmations[].items[].enteredQty` | Decimal128 | true |  |
| `deliveryConfirmations[].items[].qtyBase` | Decimal128 | true |  |
| `deliveryConfirmations[].items[].productNameSnapshot` | String | true |  |
| `deliveryConfirmations[].items[].sources` | Array | false |  |
| `deliveryConfirmations[].items[].sources[].subjectCollection` | String | true |  |
| `deliveryConfirmations[].items[].sources[].relationCode` | String | true |  |
| `deliveryConfirmations[].items[].sources[].handoverId` | ObjectId | false |  |
| `deliveryConfirmations[].items[].sources[].createdAt` | Date | false |  |
| `deliveryConfirmations[].items[].sources[].updatedAt` | Date | false |  |
| `deliveryConfirmations[].items[].sources[].itemId` | ObjectId | false |  |
| `deliveryConfirmations[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `deliveryConfirmations[].items[].sources[]._id` | ObjectId | false |  |
| `deliveryConfirmations[].items[].sources[].documentId` | DocumentIdentity | true |  |
| `deliveryConfirmations[].items[].createdAt` | Date | false |  |
| `deliveryConfirmations[].items[].updatedAt` | Date | false |  |
| `deliveryConfirmations[].items[]._id` | ObjectId | false |  |
| `deliveryConfirmations[].items[].note` | String | false |  |
| `deliveryConfirmations[].items[].evidenceIds` | Array | false |  |
| `deliveryConfirmations[].items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `deliveryConfirmations[].items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `deliveryConfirmations[].tenLoaiPhieu` | String | false |  |
| `deliveryConfirmations[].maDonVi` | String | false |  |
| `deliveryConfirmations[].kyDanhSo` | String | false |  |
| `deliveryConfirmations[].soThuTu` | Number | false |  |
| `deliveryConfirmations[].trangThaiTiengViet` | String | false |  |
| `deliveryConfirmations[]._id` | DocumentIdentity | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ],
  [
    {
      "header.externalReferenceId": 1
    },
    {
      "unique": true
    }
  ],
  [
    {
      "paymentConfirmations._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ],
  [
    {
      "cancellations._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ],
  [
    {
      "deliveryConfirmations._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ]
]
```

## warehouse_issue_requests

Model: [warehouse-issue-request.model.js](../../../../src/models/warehouse-issue-request.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.requestedWarehouseId` | ObjectId | true | Warehouse |
| `header.neededOn` | Date | true |  |
| `header.deliveryAddressSnapshot` | String | true |  |
| `header.salesOrderVersion` | Number | false |  |
| `header.requestedBy` | ObjectId | false | User |
| `header.requestedAt` | Date | false |  |
| `header.salesOrderId` | DocumentIdentity | true |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## delivery_orders

Model: [delivery-order.model.js](../../../../src/models/delivery-order.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.plannedOn` | Date | true |  |
| `header.recipientName` | String | false |  |
| `header.recipientPhone` | String | false |  |
| `header.deliveryAddress` | String | false |  |
| `header.deliveryInstructions` | String | false |  |
| `header.releasedBy` | ObjectId | false | User |
| `header.releasedAt` | Date | false |  |
| `header.issueRequestId` | DocumentIdentity | true |  |
| `header.replacesDeliveryOrderId` | DocumentIdentity | false | DeliveryOrder |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## sales_goods_issues

Model: [sales-goods-issue.model.js](../../../../src/models/sales-goods-issue.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.issueKind` | String | true |  |
| `header.issuedAt` | Date | false |  |
| `header.issuedBy` | ObjectId | false | User |
| `header.deliveryOrderId` | DocumentIdentity | false | DeliveryOrder |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].salesOrderItemId` | ObjectId | false |  |
| `items[].salePriceSnapshot` | Embedded | false |  |
| `items[].salePriceSnapshot.saleUnit` | String | true |  |
| `items[].salePriceSnapshot.baseUnitsPerSaleUnit` | Decimal128 | true |  |
| `items[].salePriceSnapshot.unitSellingPrice` | Decimal128 | true |  |
| `items[].salePriceSnapshot.salesOrderRevision` | Number | true |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `handovers` | Array | false |  |
| `handovers[].documentNo` | String | true |  |
| `handovers[].documentKind` | String | true |  |
| `handovers[].workflowStatus` | String | true |  |
| `handovers[].version` | Number | true |  |
| `handovers[].createdBy` | ObjectId | true | User |
| `handovers[].occurredAt` | Date | false |  |
| `handovers[].note` | String | false |  |
| `handovers[].externalReferenceIds` | Array | false |  |
| `handovers[].sources` | Array | false |  |
| `handovers[].sources[].subjectCollection` | String | true |  |
| `handovers[].sources[].relationCode` | String | true |  |
| `handovers[].sources[].handoverId` | ObjectId | false |  |
| `handovers[].sources[].createdAt` | Date | false |  |
| `handovers[].sources[].updatedAt` | Date | false |  |
| `handovers[].sources[].itemId` | ObjectId | false |  |
| `handovers[].sources[].linkedQty` | Decimal128 | false |  |
| `handovers[].sources[]._id` | ObjectId | false |  |
| `handovers[].sources[].documentId` | DocumentIdentity | true |  |
| `handovers[].header` | Embedded | true |  |
| `handovers[].header.recipientName` | String | true |  |
| `handovers[].header.handedOverAt` | Date | true |  |
| `handovers[].header.confirmedBy` | ObjectId | true | User |
| `handovers[].header.vehiclePlate` | String | false |  |
| `handovers[].header.relatedDocumentId` | DocumentIdentity | true |  |
| `handovers[].createdAt` | Date | false |  |
| `handovers[].updatedAt` | Date | false |  |
| `handovers[].items` | Array | false |  |
| `handovers[].items[].lineNo` | Number | true |  |
| `handovers[].items[].lineKind` | String | true |  |
| `handovers[].items[].productId` | ObjectId | true | Product |
| `handovers[].items[].lotId` | ObjectId | false | ProductBatch |
| `handovers[].items[].enteredUnit` | String | true |  |
| `handovers[].items[].baseUnitSnapshot` | String | true |  |
| `handovers[].items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `handovers[].items[].packagingSnapshot` | Embedded | false |  |
| `handovers[].items[].packagingSnapshot.packageUnit` | String | true |  |
| `handovers[].items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `handovers[].items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `handovers[].items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `handovers[].items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `handovers[].items[].enteredQty` | Decimal128 | true |  |
| `handovers[].items[].qtyBase` | Decimal128 | true |  |
| `handovers[].items[].productNameSnapshot` | String | true |  |
| `handovers[].items[].sources` | Array | false |  |
| `handovers[].items[].sources[].subjectCollection` | String | true |  |
| `handovers[].items[].sources[].relationCode` | String | true |  |
| `handovers[].items[].sources[].handoverId` | ObjectId | false |  |
| `handovers[].items[].sources[].createdAt` | Date | false |  |
| `handovers[].items[].sources[].updatedAt` | Date | false |  |
| `handovers[].items[].sources[].itemId` | ObjectId | false |  |
| `handovers[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `handovers[].items[].sources[]._id` | ObjectId | false |  |
| `handovers[].items[].sources[].documentId` | DocumentIdentity | true |  |
| `handovers[].items[].createdAt` | Date | false |  |
| `handovers[].items[].updatedAt` | Date | false |  |
| `handovers[].items[]._id` | ObjectId | false |  |
| `handovers[].items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `handovers[].items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `handovers[].tenLoaiPhieu` | String | false |  |
| `handovers[].maDonVi` | String | false |  |
| `handovers[].kyDanhSo` | String | false |  |
| `handovers[].soThuTu` | Number | false |  |
| `handovers[].trangThaiTiengViet` | String | false |  |
| `handovers[]._id` | DocumentIdentity | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## defect_reports

Model: [defect-report.model.js](../../../../src/models/defect-report.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.discoveredAt` | Date | true |  |
| `header.reason` | String | true |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.reportedBy` | ObjectId | false | User |
| `header.recordedAt` | Date | false |  |
| `header.sourceRef` | Embedded | false |  |
| `header.sourceRef.documentType` | String | true |  |
| `header.sourceRef.itemId` | ObjectId | false |  |
| `header.sourceRef.revision` | Number | false |  |
| `header.sourceRef.documentId` | DocumentIdentity | true |  |
| `header.sourceKind` | String | false |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].sourceRef` | Embedded | false |  |
| `items[].sourceRef.documentType` | String | true |  |
| `items[].sourceRef.itemId` | ObjectId | false |  |
| `items[].sourceRef.revision` | Number | false |  |
| `items[].sourceRef.documentId` | DocumentIdentity | true |  |
| `items[].balanceId` | ObjectId | false | InventoryBalance |
| `items[].ownerType` | String | false |  |
| `items[].ownerId` | ObjectId | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `inspections` | Array | false |  |
| `inspections[].itemId` | ObjectId | true |  |
| `inspections[].performedBy` | ObjectId | true | User |
| `inspections[].performedAt` | Date | true |  |
| `inspections[].quantityBase` | Decimal128 | true |  |
| `inspections[].transactionId` | ObjectId | false | StockTransaction |
| `inspections[].evidenceIds` | Array | false |  |
| `inspections[].note` | String | false |  |
| `holds` | Array | false |  |
| `holds[].defectReportLineId` | ObjectId | true |  |
| `holds[].recordedBy` | ObjectId | true | User |
| `holds[].recordedAt` | Date | true |  |
| `holds[].reason` | String | true |  |
| `holds[].evidenceIds` | Array | false |  |
| `holds[].allocations` | Array | false |  |
| `holds[].allocations[].balanceId` | ObjectId | true | InventoryBalance |
| `holds[].allocations[].quantityBase` | Decimal128 | true |  |
| `holds[].events` | Array | false |  |
| `holds[].events[].kind` | String | true |  |
| `holds[].events[].quantityBase` | Decimal128 | true |  |
| `holds[].events[].sourceRef` | Embedded | false |  |
| `holds[].events[].sourceRef.documentType` | String | true |  |
| `holds[].events[].sourceRef.itemId` | ObjectId | false |  |
| `holds[].events[].sourceRef.revision` | Number | false |  |
| `holds[].events[].sourceRef.documentId` | DocumentIdentity | true |  |
| `holds[].events[].performedBy` | ObjectId | true | User |
| `holds[].events[].performedAt` | Date | true |  |
| `holds[].events[].reason` | String | false |  |
| `holds[].status` | String | true |  |
| `holds[].version` | Number | true |  |
| `holds[]._id` | ObjectId | false |  |
| `holds[].createdAt` | Date | false |  |
| `holds[].updatedAt` | Date | false |  |
| `holds[].stocktakeId` | DocumentIdentity | false | Stocktake |
| `resolutionPlans` | Array | false |  |
| `resolutionPlans[].documentNo` | String | true |  |
| `resolutionPlans[].documentKind` | String | true |  |
| `resolutionPlans[].workflowStatus` | String | true |  |
| `resolutionPlans[].version` | Number | true |  |
| `resolutionPlans[].createdBy` | ObjectId | true | User |
| `resolutionPlans[].occurredAt` | Date | false |  |
| `resolutionPlans[].note` | String | false |  |
| `resolutionPlans[].externalReferenceIds` | Array | false |  |
| `resolutionPlans[].sources` | Array | false |  |
| `resolutionPlans[].sources[].subjectCollection` | String | true |  |
| `resolutionPlans[].sources[].relationCode` | String | true |  |
| `resolutionPlans[].sources[].handoverId` | ObjectId | false |  |
| `resolutionPlans[].sources[].createdAt` | Date | false |  |
| `resolutionPlans[].sources[].updatedAt` | Date | false |  |
| `resolutionPlans[].sources[].itemId` | ObjectId | false |  |
| `resolutionPlans[].sources[].linkedQty` | Decimal128 | false |  |
| `resolutionPlans[].sources[]._id` | ObjectId | false |  |
| `resolutionPlans[].sources[].documentId` | DocumentIdentity | true |  |
| `resolutionPlans[].header` | Embedded | true |  |
| `resolutionPlans[].header.proposedBy` | ObjectId | false | User |
| `resolutionPlans[].header.submittedAt` | Date | false |  |
| `resolutionPlans[].header.defectReportId` | DocumentIdentity | false | DefectReport |
| `resolutionPlans[].header.previousPlanId` | DocumentIdentity | false |  |
| `resolutionPlans[].updatedBy` | ObjectId | false | User |
| `resolutionPlans[].evidenceIds` | Array | false |  |
| `resolutionPlans[].cancelledBy` | ObjectId | false | User |
| `resolutionPlans[].cancelledAt` | Date | false |  |
| `resolutionPlans[].cancelReason` | String | false |  |
| `resolutionPlans[].createdAt` | Date | false |  |
| `resolutionPlans[].updatedAt` | Date | false |  |
| `resolutionPlans[].items` | Array | false |  |
| `resolutionPlans[].items[].lineNo` | Number | true |  |
| `resolutionPlans[].items[].lineKind` | String | true |  |
| `resolutionPlans[].items[].productId` | ObjectId | true | Product |
| `resolutionPlans[].items[].lotId` | ObjectId | false | ProductBatch |
| `resolutionPlans[].items[].enteredUnit` | String | true |  |
| `resolutionPlans[].items[].baseUnitSnapshot` | String | true |  |
| `resolutionPlans[].items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `resolutionPlans[].items[].packagingSnapshot` | Embedded | false |  |
| `resolutionPlans[].items[].packagingSnapshot.packageUnit` | String | true |  |
| `resolutionPlans[].items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `resolutionPlans[].items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `resolutionPlans[].items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `resolutionPlans[].items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `resolutionPlans[].items[].enteredQty` | Decimal128 | true |  |
| `resolutionPlans[].items[].qtyBase` | Decimal128 | true |  |
| `resolutionPlans[].items[].productNameSnapshot` | String | true |  |
| `resolutionPlans[].items[].sources` | Array | false |  |
| `resolutionPlans[].items[].sources[].subjectCollection` | String | true |  |
| `resolutionPlans[].items[].sources[].relationCode` | String | true |  |
| `resolutionPlans[].items[].sources[].handoverId` | ObjectId | false |  |
| `resolutionPlans[].items[].sources[].createdAt` | Date | false |  |
| `resolutionPlans[].items[].sources[].updatedAt` | Date | false |  |
| `resolutionPlans[].items[].sources[].itemId` | ObjectId | false |  |
| `resolutionPlans[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `resolutionPlans[].items[].sources[]._id` | ObjectId | false |  |
| `resolutionPlans[].items[].sources[].documentId` | DocumentIdentity | true |  |
| `resolutionPlans[].items[].createdAt` | Date | false |  |
| `resolutionPlans[].items[].updatedAt` | Date | false |  |
| `resolutionPlans[].items[]._id` | ObjectId | false |  |
| `resolutionPlans[].items[].note` | String | false |  |
| `resolutionPlans[].items[].evidenceIds` | Array | false |  |
| `resolutionPlans[].items[].approvedQtyBase` | Decimal128 | false |  |
| `resolutionPlans[].items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `resolutionPlans[].tenLoaiPhieu` | String | false |  |
| `resolutionPlans[].maDonVi` | String | false |  |
| `resolutionPlans[].kyDanhSo` | String | false |  |
| `resolutionPlans[].soThuTu` | Number | false |  |
| `resolutionPlans[].trangThaiTiengViet` | String | false |  |
| `resolutionPlans[].reviewDecisions` | Array | false |  |
| `resolutionPlans[].reviewDecisions[].decisionId` | ObjectId | true | ApprovalHistory |
| `resolutionPlans[].reviewDecisions[].revision` | Number | true |  |
| `resolutionPlans[].reviewDecisions[].reviewedBy` | ObjectId | true | User |
| `resolutionPlans[].reviewDecisions[].reviewedAt` | Date | true |  |
| `resolutionPlans[].reviewDecisions[].decision` | String | true |  |
| `resolutionPlans[].reviewDecisions[].reason` | String | true |  |
| `resolutionPlans[]._id` | DocumentIdentity | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ],
  [
    {
      "holds._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ],
  [
    {
      "resolutionPlans._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ],
  [
    {
      "holds.allocations.balanceId": 1,
      "holds.status": 1
    },
    {}
  ]
]
```

## stock_scrap_records

Model: [stock-scrap-record.model.js](../../../../src/models/stock-scrap-record.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.approvedRevision` | Number | false |  |
| `header.destroyedBy` | ObjectId | false | User |
| `header.destroyedAt` | Date | false |  |
| `header.planId` | DocumentIdentity | false |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## stocktakes

Model: [stocktake.model.js](../../../../src/models/stocktake.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.cutoffAt` | Date | false |  |
| `header.completedAt` | Date | false |  |
| `header.mode` | String | true |  |
| `header.scopeLocationIds` | Array | false |  |
| `header.reason` | String | false |  |
| `header.plannedAt` | Date | false |  |
| `header.scopeVersion` | Number | false |  |
| `header.scope` | Embedded | false |  |
| `header.scope.locationIds` | Array | false |  |
| `header.scope.batchIds` | Array | false |  |
| `header.scope.productIds` | Array | false |  |
| `header.scope.areaCodes` | Array | false |  |
| `header.assignedCounterIds` | Array | false |  |
| `header.activatedBy` | ObjectId | false | User |
| `header.activatedAt` | Date | false |  |
| `header.closedBy` | ObjectId | false | User |
| `header.closureReferenceId` | ObjectId | false |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `resolutionPlans` | Array | false |  |
| `resolutionPlans[].documentNo` | String | true |  |
| `resolutionPlans[].documentKind` | String | true |  |
| `resolutionPlans[].workflowStatus` | String | true |  |
| `resolutionPlans[].version` | Number | true |  |
| `resolutionPlans[].createdBy` | ObjectId | true | User |
| `resolutionPlans[].occurredAt` | Date | false |  |
| `resolutionPlans[].note` | String | false |  |
| `resolutionPlans[].externalReferenceIds` | Array | false |  |
| `resolutionPlans[].sources` | Array | false |  |
| `resolutionPlans[].sources[].subjectCollection` | String | true |  |
| `resolutionPlans[].sources[].relationCode` | String | true |  |
| `resolutionPlans[].sources[].handoverId` | ObjectId | false |  |
| `resolutionPlans[].sources[].createdAt` | Date | false |  |
| `resolutionPlans[].sources[].updatedAt` | Date | false |  |
| `resolutionPlans[].sources[].itemId` | ObjectId | false |  |
| `resolutionPlans[].sources[].linkedQty` | Decimal128 | false |  |
| `resolutionPlans[].sources[]._id` | ObjectId | false |  |
| `resolutionPlans[].sources[].documentId` | DocumentIdentity | true |  |
| `resolutionPlans[].header` | Embedded | true |  |
| `resolutionPlans[].header.planVersion` | Number | true |  |
| `resolutionPlans[].header.approvalId` | ObjectId | false | ApprovalHistory |
| `resolutionPlans[].header.closureBatchId` | ObjectId | false | StockTransaction |
| `resolutionPlans[].header.scopeVersion` | Number | false |  |
| `resolutionPlans[].header.reason` | String | false |  |
| `resolutionPlans[].header.proposedBy` | ObjectId | false | User |
| `resolutionPlans[].header.proposedAt` | Date | false |  |
| `resolutionPlans[].header.closedBy` | ObjectId | false | User |
| `resolutionPlans[].header.closedAt` | Date | false |  |
| `resolutionPlans[].header.stocktakeId` | DocumentIdentity | true |  |
| `resolutionPlans[].header.previousPlanId` | DocumentIdentity | false |  |
| `resolutionPlans[].updatedBy` | ObjectId | false | User |
| `resolutionPlans[].evidenceIds` | Array | false |  |
| `resolutionPlans[].cancelledBy` | ObjectId | false | User |
| `resolutionPlans[].cancelledAt` | Date | false |  |
| `resolutionPlans[].cancelReason` | String | false |  |
| `resolutionPlans[].createdAt` | Date | false |  |
| `resolutionPlans[].updatedAt` | Date | false |  |
| `resolutionPlans[].items` | Array | false |  |
| `resolutionPlans[].items[].lineNo` | Number | true |  |
| `resolutionPlans[].items[].lineKind` | String | true |  |
| `resolutionPlans[].items[].productId` | ObjectId | true | Product |
| `resolutionPlans[].items[].lotId` | ObjectId | false | ProductBatch |
| `resolutionPlans[].items[].enteredUnit` | String | true |  |
| `resolutionPlans[].items[].baseUnitSnapshot` | String | true |  |
| `resolutionPlans[].items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `resolutionPlans[].items[].packagingSnapshot` | Embedded | false |  |
| `resolutionPlans[].items[].packagingSnapshot.packageUnit` | String | true |  |
| `resolutionPlans[].items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `resolutionPlans[].items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `resolutionPlans[].items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `resolutionPlans[].items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `resolutionPlans[].items[].enteredQty` | Decimal128 | true |  |
| `resolutionPlans[].items[].qtyBase` | Decimal128 | true |  |
| `resolutionPlans[].items[].productNameSnapshot` | String | true |  |
| `resolutionPlans[].items[].sources` | Array | false |  |
| `resolutionPlans[].items[].sources[].subjectCollection` | String | true |  |
| `resolutionPlans[].items[].sources[].relationCode` | String | true |  |
| `resolutionPlans[].items[].sources[].handoverId` | ObjectId | false |  |
| `resolutionPlans[].items[].sources[].createdAt` | Date | false |  |
| `resolutionPlans[].items[].sources[].updatedAt` | Date | false |  |
| `resolutionPlans[].items[].sources[].itemId` | ObjectId | false |  |
| `resolutionPlans[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `resolutionPlans[].items[].sources[]._id` | ObjectId | false |  |
| `resolutionPlans[].items[].sources[].documentId` | DocumentIdentity | true |  |
| `resolutionPlans[].items[].createdAt` | Date | false |  |
| `resolutionPlans[].items[].updatedAt` | Date | false |  |
| `resolutionPlans[].items[]._id` | ObjectId | false |  |
| `resolutionPlans[].items[].note` | String | false |  |
| `resolutionPlans[].items[].evidenceIds` | Array | false |  |
| `resolutionPlans[].items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `resolutionPlans[].items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `resolutionPlans[].tenLoaiPhieu` | String | false |  |
| `resolutionPlans[].maDonVi` | String | false |  |
| `resolutionPlans[].kyDanhSo` | String | false |  |
| `resolutionPlans[].soThuTu` | Number | false |  |
| `resolutionPlans[].trangThaiTiengViet` | String | false |  |
| `resolutionPlans[].selectedCounts` | Array | false |  |
| `resolutionPlans[].selectedCounts[].snapshotId` | ObjectId | true | StocktakeSnapshot |
| `resolutionPlans[].selectedCounts[].countId` | ObjectId | true | StocktakeCount |
| `resolutionPlans[].reviewDecisions` | Array | false |  |
| `resolutionPlans[].reviewDecisions[].decisionId` | ObjectId | true | ApprovalHistory |
| `resolutionPlans[].reviewDecisions[].revision` | Number | true |  |
| `resolutionPlans[].reviewDecisions[].reviewedBy` | ObjectId | true | User |
| `resolutionPlans[].reviewDecisions[].reviewedAt` | Date | true |  |
| `resolutionPlans[].reviewDecisions[].decision` | String | true |  |
| `resolutionPlans[].reviewDecisions[].reason` | String | true |  |
| `resolutionPlans[].executionRecords` | Array | false |  |
| `resolutionPlans[].executionRecords[].itemId` | ObjectId | true |  |
| `resolutionPlans[].executionRecords[].performedBy` | ObjectId | true | User |
| `resolutionPlans[].executionRecords[].performedAt` | Date | true |  |
| `resolutionPlans[].executionRecords[].quantityBase` | Decimal128 | true |  |
| `resolutionPlans[].executionRecords[].transactionId` | ObjectId | false | StockTransaction |
| `resolutionPlans[].executionRecords[].evidenceIds` | Array | false |  |
| `resolutionPlans[].executionRecords[].note` | String | false |  |
| `resolutionPlans[]._id` | DocumentIdentity | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ],
  [
    {
      "resolutionPlans._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ]
]
```

## stock_adjustments

Model: [stock-adjustment.model.js](../../../../src/models/stock-adjustment.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.stocktakeId` | DocumentIdentity | false | Stocktake |
| `header.resolutionPlanId` | DocumentIdentity | false |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].planItemId` | ObjectId | false |  |
| `items[].snapshotIds` | Array | false |  |
| `items[].countIds` | Array | false |  |
| `items[].stockBalanceId` | ObjectId | false | InventoryBalance |
| `items[].quantityDeltaBase` | Decimal128 | false |  |
| `items[].beforeQty` | Decimal128 | false |  |
| `items[].afterQty` | Decimal128 | false |  |
| `items[].reason` | String | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## failed_deliveries

Model: [failed-delivery.model.js](../../../../src/models/failed-delivery.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.failureEvidenceId` | ObjectId | true | Attachment |
| `header.reason` | String | true |  |
| `header.reportedBy` | ObjectId | false | User |
| `header.recordedAt` | Date | false |  |
| `header.goodsIssueId` | DocumentIdentity | false | SalesGoodsIssue |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].holderName` | String | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## stock_quality_changes

Model: [stock-quality-change.model.js](../../../../src/models/stock-quality-change.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.operationId` | ObjectId | false | OperationRecord |
| `header.planId` | DocumentIdentity | false |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].fromBalanceId` | ObjectId | false | InventoryBalance |
| `items[].toBalanceId` | ObjectId | false | InventoryBalance |
| `items[].previousQuality` | String | false |  |
| `items[].targetQuality` | String | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## customer_returns

Model: [customer-return.model.js](../../../../src/models/customer-return.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.customerId` | ObjectId | true | Customer |
| `header.financialFollowupStatus` | String | true |  |
| `header.openedBy` | ObjectId | false | User |
| `header.openedAt` | Date | false |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `decisions` | Array | false |  |
| `decisions[].decisionId` | ObjectId | true | ApprovalHistory |
| `decisions[].revision` | Number | true |  |
| `decisions[].reviewedBy` | ObjectId | true | User |
| `decisions[].reviewedAt` | Date | true |  |
| `decisions[].decision` | String | true |  |
| `decisions[].reason` | String | true |  |
| `inspections` | Array | false |  |
| `inspections[].returnLineId` | ObjectId | true |  |
| `inspections[].inspectionNo` | Number | true |  |
| `inspections[].returnVersion` | Number | true |  |
| `inspections[].warehouseId` | ObjectId | true | Warehouse |
| `inspections[].inspectedBy` | ObjectId | true | User |
| `inspections[].inspectedAt` | Date | true |  |
| `inspections[].portions` | Array | false |  |
| `inspections[].portions[].quantityBase` | Decimal128 | true |  |
| `inspections[].portions[].packagingCondition` | String | true |  |
| `inspections[].portions[].installationStatus` | String | true |  |
| `inspections[].portions[].damageCause` | String | true |  |
| `inspections[].portions[].deadlineStatus` | String | true |  |
| `inspections[].portions[].deadlineReference` | String | false |  |
| `inspections[].portions[].eligibilityStatus` | String | true |  |
| `inspections[].portions[].reason` | String | true |  |
| `inspections[].portions[].evidenceIds` | Array | false |  |
| `inspections[]._id` | ObjectId | false |  |
| `inspections[].createdAt` | Date | false |  |
| `inspections[].updatedAt` | Date | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ],
  [
    {
      "inspections._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ]
]
```

## supplier_returns

Model: [supplier-return.model.js](../../../../src/models/supplier-return.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.supplierId` | ObjectId | true | Supplier |
| `header.agreementReference` | String | false |  |
| `header.agreedAt` | Date | false |  |
| `header.financialFollowupStatus` | String | true |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `agreements` | Array | false |  |
| `agreements[].itemId` | ObjectId | true |  |
| `agreements[].agreedQtyBase` | Decimal128 | true |  |
| `agreements[].verifiedBy` | ObjectId | true | User |
| `agreements[].verifiedAt` | Date | true |  |
| `agreements[].version` | Number | true |  |
| `agreements[].evidenceIds` | Array | false |  |
| `closure` | Embedded | false |  |
| `closure.closedBy` | ObjectId | true | User |
| `closure.closedAt` | Date | true |  |
| `closure.reason` | String | true |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## supplier_return_issues

Model: [supplier-return-issue.model.js](../../../../src/models/supplier-return-issue.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.issueKind` | String | true |  |
| `header.issuedAt` | Date | false |  |
| `header.issuedBy` | ObjectId | false | User |
| `header.receivedByName` | String | false |  |
| `header.operationId` | ObjectId | false | OperationRecord |
| `header.supplierReturnId` | DocumentIdentity | false | SupplierReturn |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `acknowledgements` | Array | false |  |
| `acknowledgements[].documentNo` | String | true |  |
| `acknowledgements[].documentKind` | String | true |  |
| `acknowledgements[].workflowStatus` | String | true |  |
| `acknowledgements[].version` | Number | true |  |
| `acknowledgements[].createdBy` | ObjectId | true | User |
| `acknowledgements[].occurredAt` | Date | false |  |
| `acknowledgements[].note` | String | false |  |
| `acknowledgements[].externalReferenceIds` | Array | false |  |
| `acknowledgements[].sources` | Array | false |  |
| `acknowledgements[].sources[].subjectCollection` | String | true |  |
| `acknowledgements[].sources[].relationCode` | String | true |  |
| `acknowledgements[].sources[].handoverId` | ObjectId | false |  |
| `acknowledgements[].sources[].createdAt` | Date | false |  |
| `acknowledgements[].sources[].updatedAt` | Date | false |  |
| `acknowledgements[].sources[].itemId` | ObjectId | false |  |
| `acknowledgements[].sources[].linkedQty` | Decimal128 | false |  |
| `acknowledgements[].sources[]._id` | ObjectId | false |  |
| `acknowledgements[].sources[].documentId` | DocumentIdentity | true |  |
| `acknowledgements[].header` | Embedded | true |  |
| `acknowledgements[].header.supplierId` | ObjectId | false | Supplier |
| `acknowledgements[].header.acknowledgedAt` | Date | false |  |
| `acknowledgements[].header.supplierContact` | String | false |  |
| `acknowledgements[].header.recordedBy` | ObjectId | false | User |
| `acknowledgements[].header.recordedAt` | Date | false |  |
| `acknowledgements[].header.supplierReturnId` | DocumentIdentity | false | SupplierReturn |
| `acknowledgements[].updatedBy` | ObjectId | false | User |
| `acknowledgements[].evidenceIds` | Array | false |  |
| `acknowledgements[].cancelledBy` | ObjectId | false | User |
| `acknowledgements[].cancelledAt` | Date | false |  |
| `acknowledgements[].cancelReason` | String | false |  |
| `acknowledgements[].createdAt` | Date | false |  |
| `acknowledgements[].updatedAt` | Date | false |  |
| `acknowledgements[].items` | Array | false |  |
| `acknowledgements[].items[].lineNo` | Number | true |  |
| `acknowledgements[].items[].lineKind` | String | true |  |
| `acknowledgements[].items[].productId` | ObjectId | true | Product |
| `acknowledgements[].items[].lotId` | ObjectId | false | ProductBatch |
| `acknowledgements[].items[].enteredUnit` | String | true |  |
| `acknowledgements[].items[].baseUnitSnapshot` | String | true |  |
| `acknowledgements[].items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `acknowledgements[].items[].packagingSnapshot` | Embedded | false |  |
| `acknowledgements[].items[].packagingSnapshot.packageUnit` | String | true |  |
| `acknowledgements[].items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `acknowledgements[].items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `acknowledgements[].items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `acknowledgements[].items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `acknowledgements[].items[].enteredQty` | Decimal128 | true |  |
| `acknowledgements[].items[].qtyBase` | Decimal128 | true |  |
| `acknowledgements[].items[].productNameSnapshot` | String | true |  |
| `acknowledgements[].items[].sources` | Array | false |  |
| `acknowledgements[].items[].sources[].subjectCollection` | String | true |  |
| `acknowledgements[].items[].sources[].relationCode` | String | true |  |
| `acknowledgements[].items[].sources[].handoverId` | ObjectId | false |  |
| `acknowledgements[].items[].sources[].createdAt` | Date | false |  |
| `acknowledgements[].items[].sources[].updatedAt` | Date | false |  |
| `acknowledgements[].items[].sources[].itemId` | ObjectId | false |  |
| `acknowledgements[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `acknowledgements[].items[].sources[]._id` | ObjectId | false |  |
| `acknowledgements[].items[].sources[].documentId` | DocumentIdentity | true |  |
| `acknowledgements[].items[].createdAt` | Date | false |  |
| `acknowledgements[].items[].updatedAt` | Date | false |  |
| `acknowledgements[].items[]._id` | ObjectId | false |  |
| `acknowledgements[].items[].note` | String | false |  |
| `acknowledgements[].items[].evidenceIds` | Array | false |  |
| `acknowledgements[].items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `acknowledgements[].tenLoaiPhieu` | String | false |  |
| `acknowledgements[].maDonVi` | String | false |  |
| `acknowledgements[].kyDanhSo` | String | false |  |
| `acknowledgements[].soThuTu` | Number | false |  |
| `acknowledgements[].trangThaiTiengViet` | String | false |  |
| `acknowledgements[].reconciliations` | Array | false |  |
| `acknowledgements[].reconciliations[].itemId` | ObjectId | true |  |
| `acknowledgements[].reconciliations[].performedBy` | ObjectId | true | User |
| `acknowledgements[].reconciliations[].performedAt` | Date | true |  |
| `acknowledgements[].reconciliations[].quantityBase` | Decimal128 | true |  |
| `acknowledgements[].reconciliations[].transactionId` | ObjectId | false | StockTransaction |
| `acknowledgements[].reconciliations[].evidenceIds` | Array | false |  |
| `acknowledgements[].reconciliations[].note` | String | false |  |
| `acknowledgements[]._id` | DocumentIdentity | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ],
  [
    {
      "acknowledgements._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ]
]
```

## stock_discrepancies

Model: [stock-discrepancy.model.js](../../../../src/models/stock-discrepancy.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.sourceRef` | Embedded | false |  |
| `header.sourceRef.documentType` | String | true |  |
| `header.sourceRef.itemId` | ObjectId | false |  |
| `header.sourceRef.revision` | Number | false |  |
| `header.sourceRef.documentId` | DocumentIdentity | true |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.reportedBy` | ObjectId | false | User |
| `header.reportedAt` | Date | false |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `resolutionEvents` | Array | false |  |
| `resolutionEvents[].itemId` | ObjectId | true |  |
| `resolutionEvents[].performedBy` | ObjectId | true | User |
| `resolutionEvents[].performedAt` | Date | true |  |
| `resolutionEvents[].quantityBase` | Decimal128 | true |  |
| `resolutionEvents[].transactionId` | ObjectId | false | StockTransaction |
| `resolutionEvents[].evidenceIds` | Array | false |  |
| `resolutionEvents[].note` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## custody_receipts

Model: [custody-receipt.model.js](../../../../src/models/custody-receipt.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.ownerType` | String | false |  |
| `header.ownerId` | ObjectId | false |  |
| `header.receivedAt` | Date | false |  |
| `header.receivedBy` | ObjectId | false | User |
| `header.handedOverBy` | String | false |  |
| `header.releasedAt` | Date | false |  |
| `header.releasedBy` | ObjectId | false | User |
| `header.recipientName` | String | false |  |
| `header.operationId` | ObjectId | false | OperationRecord |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## custody_releases

Model: [custody-release.model.js](../../../../src/models/custody-release.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.ownerType` | String | false |  |
| `header.ownerId` | ObjectId | false |  |
| `header.receivedAt` | Date | false |  |
| `header.receivedBy` | ObjectId | false | User |
| `header.handedOverBy` | String | false |  |
| `header.releasedAt` | Date | false |  |
| `header.releasedBy` | ObjectId | false | User |
| `header.recipientName` | String | false |  |
| `header.operationId` | ObjectId | false | OperationRecord |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `custodyDecisionId` | ObjectId | false | ApprovalHistory |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `acknowledgements` | Array | false |  |
| `acknowledgements[].documentNo` | String | true |  |
| `acknowledgements[].documentKind` | String | true |  |
| `acknowledgements[].workflowStatus` | String | true |  |
| `acknowledgements[].version` | Number | true |  |
| `acknowledgements[].createdBy` | ObjectId | true | User |
| `acknowledgements[].occurredAt` | Date | false |  |
| `acknowledgements[].note` | String | false |  |
| `acknowledgements[].externalReferenceIds` | Array | false |  |
| `acknowledgements[].sources` | Array | false |  |
| `acknowledgements[].sources[].subjectCollection` | String | true |  |
| `acknowledgements[].sources[].relationCode` | String | true |  |
| `acknowledgements[].sources[].handoverId` | ObjectId | false |  |
| `acknowledgements[].sources[].createdAt` | Date | false |  |
| `acknowledgements[].sources[].updatedAt` | Date | false |  |
| `acknowledgements[].sources[].itemId` | ObjectId | false |  |
| `acknowledgements[].sources[].linkedQty` | Decimal128 | false |  |
| `acknowledgements[].sources[]._id` | ObjectId | false |  |
| `acknowledgements[].sources[].documentId` | DocumentIdentity | true |  |
| `acknowledgements[].header` | Embedded | true |  |
| `acknowledgements[].header.supplierId` | ObjectId | false | Supplier |
| `acknowledgements[].header.acknowledgedAt` | Date | false |  |
| `acknowledgements[].header.supplierContact` | String | false |  |
| `acknowledgements[].header.recordedBy` | ObjectId | false | User |
| `acknowledgements[].header.recordedAt` | Date | false |  |
| `acknowledgements[].header.supplierReturnId` | DocumentIdentity | false | SupplierReturn |
| `acknowledgements[].updatedBy` | ObjectId | false | User |
| `acknowledgements[].evidenceIds` | Array | false |  |
| `acknowledgements[].cancelledBy` | ObjectId | false | User |
| `acknowledgements[].cancelledAt` | Date | false |  |
| `acknowledgements[].cancelReason` | String | false |  |
| `acknowledgements[].createdAt` | Date | false |  |
| `acknowledgements[].updatedAt` | Date | false |  |
| `acknowledgements[].items` | Array | false |  |
| `acknowledgements[].items[].lineNo` | Number | true |  |
| `acknowledgements[].items[].lineKind` | String | true |  |
| `acknowledgements[].items[].productId` | ObjectId | true | Product |
| `acknowledgements[].items[].lotId` | ObjectId | false | ProductBatch |
| `acknowledgements[].items[].enteredUnit` | String | true |  |
| `acknowledgements[].items[].baseUnitSnapshot` | String | true |  |
| `acknowledgements[].items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `acknowledgements[].items[].packagingSnapshot` | Embedded | false |  |
| `acknowledgements[].items[].packagingSnapshot.packageUnit` | String | true |  |
| `acknowledgements[].items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `acknowledgements[].items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `acknowledgements[].items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `acknowledgements[].items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `acknowledgements[].items[].enteredQty` | Decimal128 | true |  |
| `acknowledgements[].items[].qtyBase` | Decimal128 | true |  |
| `acknowledgements[].items[].productNameSnapshot` | String | true |  |
| `acknowledgements[].items[].sources` | Array | false |  |
| `acknowledgements[].items[].sources[].subjectCollection` | String | true |  |
| `acknowledgements[].items[].sources[].relationCode` | String | true |  |
| `acknowledgements[].items[].sources[].handoverId` | ObjectId | false |  |
| `acknowledgements[].items[].sources[].createdAt` | Date | false |  |
| `acknowledgements[].items[].sources[].updatedAt` | Date | false |  |
| `acknowledgements[].items[].sources[].itemId` | ObjectId | false |  |
| `acknowledgements[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `acknowledgements[].items[].sources[]._id` | ObjectId | false |  |
| `acknowledgements[].items[].sources[].documentId` | DocumentIdentity | true |  |
| `acknowledgements[].items[].createdAt` | Date | false |  |
| `acknowledgements[].items[].updatedAt` | Date | false |  |
| `acknowledgements[].items[]._id` | ObjectId | false |  |
| `acknowledgements[].items[].note` | String | false |  |
| `acknowledgements[].items[].evidenceIds` | Array | false |  |
| `acknowledgements[].items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `acknowledgements[].items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `acknowledgements[].tenLoaiPhieu` | String | false |  |
| `acknowledgements[].maDonVi` | String | false |  |
| `acknowledgements[].kyDanhSo` | String | false |  |
| `acknowledgements[].soThuTu` | Number | false |  |
| `acknowledgements[].trangThaiTiengViet` | String | false |  |
| `acknowledgements[].reconciliations` | Array | false |  |
| `acknowledgements[].reconciliations[].itemId` | ObjectId | true |  |
| `acknowledgements[].reconciliations[].performedBy` | ObjectId | true | User |
| `acknowledgements[].reconciliations[].performedAt` | Date | true |  |
| `acknowledgements[].reconciliations[].quantityBase` | Decimal128 | true |  |
| `acknowledgements[].reconciliations[].transactionId` | ObjectId | false | StockTransaction |
| `acknowledgements[].reconciliations[].evidenceIds` | Array | false |  |
| `acknowledgements[].reconciliations[].note` | String | false |  |
| `acknowledgements[]._id` | DocumentIdentity | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ],
  [
    {
      "acknowledgements._id": 1
    },
    {
      "unique": true,
      "sparse": true
    }
  ]
]
```

## stock_reversals

Model: [stock-reversal.model.js](../../../../src/models/stock-reversal.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.originalTransactionId` | ObjectId | false | StockTransaction |
| `header.sourceDocument` | Embedded | false |  |
| `header.sourceDocument.documentType` | String | true |  |
| `header.sourceDocument.itemId` | ObjectId | false |  |
| `header.sourceDocument.revision` | Number | false |  |
| `header.sourceDocument.documentId` | DocumentIdentity | true |  |
| `header.sourceVersion` | Number | false |  |
| `header.warehouseIds` | Array | false |  |
| `header.requestedBy` | ObjectId | false | User |
| `header.requestedAt` | Date | false |  |
| `header.reason` | String | false |  |
| `header.replacementDocument` | Embedded | false |  |
| `header.replacementDocument.documentType` | String | true |  |
| `header.replacementDocument.itemId` | ObjectId | false |  |
| `header.replacementDocument.revision` | Number | false |  |
| `header.replacementDocument.documentId` | DocumentIdentity | true |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `approvalDecision` | Embedded | false |  |
| `approvalDecision.decisionId` | ObjectId | true | ApprovalHistory |
| `approvalDecision.revision` | Number | true |  |
| `approvalDecision.reviewedBy` | ObjectId | true | User |
| `approvalDecision.reviewedAt` | Date | true |  |
| `approvalDecision.decision` | String | true |  |
| `approvalDecision.reason` | String | true |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## opening_stocks

Model: [opening-stock.model.js](../../../../src/models/opening-stock.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `documentNo` | String | true |  |
| `documentKind` | String | true |  |
| `workflowStatus` | String | true |  |
| `version` | Number | true |  |
| `createdBy` | ObjectId | true | User |
| `occurredAt` | Date | false |  |
| `note` | String | false |  |
| `externalReferenceIds` | Array | false |  |
| `sources` | Array | false |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `sources[].documentId` | DocumentIdentity | true |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.cutoverKey` | String | false |  |
| `header.openingAt` | Date | false |  |
| `header.coveredLocationIds` | Array | false |  |
| `header.sourceDescription` | String | false |  |
| `header.preparedBy` | ObjectId | false | User |
| `header.preparedAt` | Date | false |  |
| `header.verifiedBy` | ObjectId | false | User |
| `header.verifiedAt` | Date | false |  |
| `header.verifiedVersion` | Number | false |  |
| `header.verificationNote` | String | false |  |
| `updatedBy` | ObjectId | false | User |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].lineNo` | Number | true |  |
| `items[].lineKind` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].lotId` | ObjectId | false | ProductBatch |
| `items[].enteredUnit` | String | true |  |
| `items[].baseUnitSnapshot` | String | true |  |
| `items[].baseUnitsPerUnit` | Decimal128 | true |  |
| `items[].packagingSnapshot` | Embedded | false |  |
| `items[].packagingSnapshot.packageUnit` | String | true |  |
| `items[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `items[].packagingSnapshot.outerLengthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Decimal128 | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Decimal128 | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].sources[].documentId` | DocumentIdentity | true |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].locationId` | ObjectId | false | WarehouseLocation |
| `items[].ownerType` | String | false |  |
| `items[].ownerId` | ObjectId | false |  |
| `items[].qualityStatus` | String | false |  |
| `items[].{DocumentLine_REPLENISHMENT}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_ORDER}.details` | Embedded | true |  |
| `items[].{DocumentLine_OUTBOUND_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_SALES_GOODS_ISSUE}.details` | Embedded | true |  |
| `items[].{DocumentLine_DELIVERY_CONFIRMATION}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY}.details` | Embedded | true |  |
| `items[].{DocumentLine_FAILED_DELIVERY_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_ST_RESOLUTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_INSPECTION}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_RECEIPT}.details` | Embedded | true |  |
| `items[].{DocumentLine_TRANSFER_OUTBOUND}.details` | Embedded | true |  |
| `items[].{DocumentLine_ISSUE_REQUEST}.details` | Embedded | true |  |
| `items[].{DocumentLine_WAREHOUSE_TASK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISPOSITION}.details` | Embedded | true |  |
| `items[].{DocumentLine_CUSTOMER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_RETURN}.details` | Embedded | true |  |
| `items[].{DocumentLine_SUPPLIER_ACK}.details` | Embedded | true |  |
| `items[].{DocumentLine_DISCREPANCY}.details` | Embedded | true |  |
| `items[].{DocumentLine_ADJUSTMENT}.details` | Embedded | true |  |
| `tenLoaiPhieu` | String | false |  |
| `maDonVi` | String | false |  |
| `kyDanhSo` | String | false |  |
| `soThuTu` | Number | false |  |
| `trangThaiTiengViet` | String | false |  |
| `_id` | DocumentIdentity | false |  |

Indexes:

```json
[
  [
    {
      "documentNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "items._id": 1
    },
    {}
  ],
  [
    {
      "sources.documentId": 1
    },
    {}
  ],
  [
    {
      "items.sources.itemId": 1
    },
    {}
  ],
  [
    {
      "workflowStatus": 1,
      "createdAt": -1
    },
    {}
  ]
]
```

## sales_invoices

Model: [sales-invoice.model.js](../../../../src/models/sales-invoice.model.js).

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `invoiceNo` | String | true |  |
| `customerId` | ObjectId | true | Customer |
| `customerSnapshot.name` | String | true |  |
| `customerSnapshot.phone` | String | true |  |
| `currencyCode` | String | true |  |
| `items` | Array | false |  |
| `items[].salesOrderItemId` | ObjectId | true |  |
| `items[].goodsIssueItemId` | ObjectId | true |  |
| `items[].goodsIssueNo` | String | true |  |
| `items[].issuedAt` | Date | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].productNameSnapshot` | String | true |  |
| `items[].issuedQtyBase` | Decimal128 | true |  |
| `items[].billedQtyBase` | Decimal128 | true |  |
| `items[].saleUnit` | String | true |  |
| `items[].baseUnitsPerSaleUnit` | Decimal128 | true |  |
| `items[].unitSellingPrice` | Decimal128 | true |  |
| `items[].lineAmount` | Decimal128 | true |  |
| `items[]._id` | ObjectId | false |  |
| `items[].goodsIssueId` | DocumentIdentity | true | SalesGoodsIssue |
| `totalAmount` | Decimal128 | true |  |
| `status` | String | true |  |
| `createdBy` | ObjectId | true | User |
| `issuedBy` | ObjectId | false | User |
| `issuedAt` | Date | false |  |
| `version` | Number | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `salesOrderId` | DocumentIdentity | true | SalesOrder |

Indexes:

```json
[
  [
    {
      "invoiceNo": 1
    },
    {
      "unique": true,
      "_autoIndex": false
    }
  ],
  [
    {
      "salesOrderId": 1
    },
    {
      "unique": true,
      "partialFilterExpression": {
        "status": "ISSUED"
      }
    }
  ]
]
```
