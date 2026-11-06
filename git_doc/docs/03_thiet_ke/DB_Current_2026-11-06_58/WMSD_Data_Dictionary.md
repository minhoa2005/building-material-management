# Từ điển dữ liệu hiện hành — 06/11/2026

58 collection. Dòng nhúng có ID ổn định; không phải collection độc lập. Mongoose ref là liên kết ứng dụng, không phải foreign key do MongoDB kiểm. API legacy còn cần chuyển riêng.

## users

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

## warehouse_locations

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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `sku` | String | true |  |
| `manufacturerCode` | String | true |  |
| `name` | String | true |  |
| `material` | String | false |  |
| `baseUnit` | String | true |  |
| `wholeBaseUnits` | Boolean | true |  |
| `nominalSize` | String | false |  |
| `isActive` | Boolean | true |  |
| `version` | Number | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `stockThresholds` | Array | false |  |
| `stockThresholds[].productId` | ObjectId | true | Product |
| `stockThresholds[].warehouseId` | ObjectId | true | Warehouse |
| `stockThresholds[].minimumQty` | Decimal128 | true |  |
| `stockThresholds[].targetQty` | Decimal128 | true |  |
| `stockThresholds[].version` | Number | true |  |
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
      "sku": 1
    },
    {
      "unique": true
    }
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `code` | String | true |  |
| `name` | String | true |  |
| `version` | Number | true |  |
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `code` | String | true |  |
| `name` | String | true |  |
| `version` | Number | true |  |
| `contactName` | String | false |  |
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
| `packagingPortions[].balanceId` | ObjectId | true | InventoryBalance |
| `packagingPortions[].packagingState` | String | true |  |
| `packagingPortions[].packagingSnapshot` | Embedded | false |  |
| `packagingPortions[].packagingSnapshot.packageUnit` | String | true |  |
| `packagingPortions[].packagingSnapshot.baseUnitsPerPackage` | Decimal128 | true |  |
| `packagingPortions[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `packagingPortions[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `packagingPortions[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `packagingPortions[].packagingKey` | String | false |  |
| `packagingPortions[].sealedPackCount` | Number | false |  |
| `packagingPortions[].quantityBase` | Decimal128 | true |  |
| `packagingPortions[].createdBy` | ObjectId | true | User |
| `packagingPortions[].updatedBy` | ObjectId | false | User |
| `packagingPortions[].version` | Number | true |  |
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `sourceType` | String | true |  |
| `sourceId` | ObjectId | true |  |
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `demandRef` | Embedded | true |  |
| `demandRef.documentType` | String | true |  |
| `demandRef.documentId` | ObjectId | true |  |
| `demandRef.itemId` | ObjectId | false |  |
| `demandRef.revision` | Number | false |  |
| `executionRef` | Embedded | false |  |
| `executionRef.documentType` | String | true |  |
| `executionRef.documentId` | ObjectId | true |  |
| `executionRef.itemId` | ObjectId | false |  |
| `executionRef.revision` | Number | false |  |
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `demandRef` | Embedded | true |  |
| `demandRef.documentType` | String | true |  |
| `demandRef.documentId` | ObjectId | true |  |
| `demandRef.itemId` | ObjectId | false |  |
| `demandRef.revision` | Number | false |  |
| `sourceRef` | Embedded | true |  |
| `sourceRef.documentType` | String | true |  |
| `sourceRef.documentId` | ObjectId | true |  |
| `sourceRef.itemId` | ObjectId | false |  |
| `sourceRef.revision` | Number | false |  |
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `decisionKey` | String | true |  |
| `subjectType` | String | true |  |
| `subjectId` | ObjectId | true |  |
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
| `basisRefs[].documentId` | ObjectId | true |  |
| `basisRefs[].itemId` | ObjectId | false |  |
| `basisRefs[].revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `supersedesDecisionId` | ObjectId | false | ApprovalHistory |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `ownerDocumentType` | String | true |  |
| `ownerDocumentId` | ObjectId | false |  |
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

Indexes:

```json
[]
```

## return_quantity_claims

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
| `events[].sourceRef.documentId` | ObjectId | true |  |
| `events[].sourceRef.itemId` | ObjectId | false |  |
| `events[].sourceRef.revision` | Number | false |  |
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `stocktakeId` | ObjectId | true | Stocktake |
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `stocktakeId` | ObjectId | true | Stocktake |
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `stocktakeId` | ObjectId | true | Stocktake |
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `recipientId` | ObjectId | true | User |
| `type` | String | true |  |
| `eventKey` | String | true |  |
| `dedupKey` | String | true |  |
| `sourceType` | String | true |  |
| `sourceId` | ObjectId | true |  |
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
| `subjectId` | ObjectId | true |  |
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `eventKey` | String | true |  |
| `handlerCode` | String | true |  |
| `eventType` | String | true |  |
| `sourceType` | String | true |  |
| `sourceId` | ObjectId | true |  |
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `actorType` | String | true |  |
| `actorId` | ObjectId | false | User |
| `operationCode` | String | true |  |
| `requestKey` | String | true |  |
| `requestHash` | String | true |  |
| `operationKey` | String | true |  |
| `subjectType` | String | true |  |
| `subjectId` | ObjectId | true |  |
| `versionBefore` | Number | true |  |
| `versionAfter` | Number | true |  |
| `resultRefs` | Array | false |  |
| `resultRefs[].documentType` | String | true |  |
| `resultRefs[].documentId` | ObjectId | true |  |
| `resultRefs[].itemId` | ObjectId | false |  |
| `resultRefs[].revision` | Number | false |  |
| `resultCode` | String | true |  |
| `completedAt` | Date | true |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `decisionId` | ObjectId | false | ApprovalHistory |
| `correlationId` | String | false |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `sourceKey` | String | true |  |
| `sourceKind` | String | true |  |
| `sourceDocumentId` | ObjectId | true |  |
| `sourceItemId` | ObjectId | true |  |
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
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |
| `items` | Array | false |  |
| `items[].referenceId` | ObjectId | true | ExternalReference |
| `items[].lineKey` | String | true |  |
| `items[].productId` | ObjectId | true | Product |
| `items[].eligibleQty` | Decimal128 | true |  |
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `productId` | ObjectId | true | Product |
| `manufacturerLot` | String | true |  |
| `tone` | String | true |  |
| `calibre` | String | true |  |
| `identificationStatus` | String | true |  |
| `manufacturedOn` | Date | false |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

Indexes:

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
  ]
]
```

## replenishment_requests

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.neededOn` | Date | true |  |
| `header.triggerReason` | String | true |  |
| `header.creationKey` | String | true |  |
| `header.submittedBy` | ObjectId | false | User |
| `header.submittedAt` | Date | false |  |
| `header.approvedRevision` | Number | false |  |
| `header.latestDecisionId` | ObjectId | false | ApprovalHistory |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `submissions[].lines[].reasonNote` | String | true |  |
| `submissions[].lines[].baseUnitSnapshot` | String | true |  |
| `submissions[].lines[].enteredUnit` | String | true |  |
| `submissions[].lines[].baseUnitsPerUnit` | Decimal128 | true |  |
| `submissions[]._id` | ObjectId | false |  |
| `submissions[].createdAt` | Date | false |  |
| `submissions[].updatedAt` | Date | false |  |
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
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
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `replenishmentRequestId` | ObjectId | true |  |
| `totalAmount` | Decimal128 | true |  |
| `currency` | String | true |  |
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.supplierId` | ObjectId | false | Supplier |
| `header.arrivedAt` | Date | true |  |
| `header.deliveryReference` | String | false |  |
| `header.purchaseOrderId` | ObjectId | false | PurchaseOrder |
| `header.recordedAt` | Date | false |  |
| `header.deliveredBy` | String | false |  |
| `header.vehicleReference` | String | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `header` | Embedded | true |  |
| `header.arrivalId` | ObjectId | false | GoodsArrival |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.previousInspectionId` | ObjectId | false | GoodsInspection |
| `header.correctionReason` | String | false |  |
| `header.participants` | Array | false |  |
| `header.confirmedBy` | ObjectId | false | User |
| `header.confirmedAt` | Date | false |  |

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

## purchase_receipts

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.receiptKind` | String | true |  |
| `header.purchaseOrderId` | ObjectId | false | PurchaseOrder |
| `header.arrivalId` | ObjectId | false | GoodsArrival |
| `header.supplierId` | ObjectId | false | Supplier |
| `header.receivedAt` | Date | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].purchaseOrderItemId` | ObjectId | false |  |
| `items[].arrivalItemId` | ObjectId | false |  |
| `items[].inspectionId` | ObjectId | false | GoodsInspection |
| `items[].inspectionResultId` | ObjectId | false |  |
| `items[].destinationLocationId` | ObjectId | false | WarehouseLocation |
| `items[].custodyReceiptRef` | Embedded | false |  |
| `items[].custodyReceiptRef.documentType` | String | true |  |
| `items[].custodyReceiptRef.documentId` | ObjectId | true |  |
| `items[].custodyReceiptRef.itemId` | ObjectId | false |  |
| `items[].custodyReceiptRef.revision` | Number | false |  |
| `items[].custodyBalanceId` | ObjectId | false | InventoryBalance |
| `items[].supplierScheduleId` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |

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

## transfer_orders

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.taskKind` | String | true |  |
| `header.assignedTo` | ObjectId | true | User |
| `header.requirementId` | ObjectId | false | InternalTransferRequirement |
| `header.reason` | String | false |  |
| `header.confirmedBy` | ObjectId | false | User |
| `header.confirmedAt` | Date | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |

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

## warehouse_transfer_requests

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
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
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.sourceDocumentId` | ObjectId | true | document |
| `header.taskKind` | String | true |  |
| `header.sourceType` | String | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |

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

## transfer_dispatches

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.requestId` | ObjectId | true | document |
| `header.dispatchedBy` | ObjectId | true | User |
| `header.dispatchedAt` | Date | true |  |
| `header.approvedRevision` | Number | false |  |
| `header.sourceWarehouseId` | ObjectId | false | Warehouse |
| `header.destinationWarehouseId` | ObjectId | false | Warehouse |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `handovers[].sources[].documentId` | ObjectId | true |  |
| `handovers[].sources[].subjectCollection` | String | true |  |
| `handovers[].sources[].relationCode` | String | true |  |
| `handovers[].sources[].handoverId` | ObjectId | false |  |
| `handovers[].sources[].createdAt` | Date | false |  |
| `handovers[].sources[].updatedAt` | Date | false |  |
| `handovers[].sources[].itemId` | ObjectId | false |  |
| `handovers[].sources[].linkedQty` | Decimal128 | false |  |
| `handovers[].sources[]._id` | ObjectId | false |  |
| `handovers[].header` | Embedded | true |  |
| `handovers[].header.relatedDocumentId` | ObjectId | true | document |
| `handovers[].header.recipientName` | String | true |  |
| `handovers[].header.handedOverAt` | Date | true |  |
| `handovers[].header.confirmedBy` | ObjectId | true | User |
| `handovers[].header.vehiclePlate` | String | false |  |
| `handovers[]._id` | ObjectId | false |  |
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
| `handovers[].items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `handovers[].items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `handovers[].items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `handovers[].items[].enteredQty` | Decimal128 | true |  |
| `handovers[].items[].qtyBase` | Decimal128 | true |  |
| `handovers[].items[].productNameSnapshot` | String | true |  |
| `handovers[].items[].sources` | Array | false |  |
| `handovers[].items[].sources[].documentId` | ObjectId | true |  |
| `handovers[].items[].sources[].subjectCollection` | String | true |  |
| `handovers[].items[].sources[].relationCode` | String | true |  |
| `handovers[].items[].sources[].handoverId` | ObjectId | false |  |
| `handovers[].items[].sources[].createdAt` | Date | false |  |
| `handovers[].items[].sources[].updatedAt` | Date | false |  |
| `handovers[].items[].sources[].itemId` | ObjectId | false |  |
| `handovers[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `handovers[].items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |

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

## transfer_receipts

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.dispatchId` | ObjectId | true | document |
| `header.receivedBy` | ObjectId | true | User |
| `header.receivedAt` | Date | true |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.putawayStatus` | String | false |  |
| `header.damageReportIds` | Array | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.externalReferenceId` | ObjectId | true | ExternalReference |
| `header.customerId` | ObjectId | true | Customer |
| `header.neededOn` | Date | true |  |
| `header.deliveryAddressSnapshot` | String | true |  |
| `header.recipientName` | String | false |  |
| `header.recipientPhone` | String | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `orderAmount` | Decimal128 | true |  |
| `currencyCode` | String | true |  |
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
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
| `paymentConfirmations[].sources[].documentId` | ObjectId | true |  |
| `paymentConfirmations[].sources[].subjectCollection` | String | true |  |
| `paymentConfirmations[].sources[].relationCode` | String | true |  |
| `paymentConfirmations[].sources[].handoverId` | ObjectId | false |  |
| `paymentConfirmations[].sources[].createdAt` | Date | false |  |
| `paymentConfirmations[].sources[].updatedAt` | Date | false |  |
| `paymentConfirmations[].sources[].itemId` | ObjectId | false |  |
| `paymentConfirmations[].sources[].linkedQty` | Decimal128 | false |  |
| `paymentConfirmations[].sources[]._id` | ObjectId | false |  |
| `paymentConfirmations[].header` | Embedded | true |  |
| `paymentConfirmations[].header.salesOrderId` | ObjectId | true | document |
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
| `paymentConfirmations[].header.replacesId` | ObjectId | false | embedded:external_payment_confirmations |
| `paymentConfirmations[]._id` | ObjectId | false |  |
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
| `paymentConfirmations[].items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `paymentConfirmations[].items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `paymentConfirmations[].items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `paymentConfirmations[].items[].enteredQty` | Decimal128 | true |  |
| `paymentConfirmations[].items[].qtyBase` | Decimal128 | true |  |
| `paymentConfirmations[].items[].productNameSnapshot` | String | true |  |
| `paymentConfirmations[].items[].sources` | Array | false |  |
| `paymentConfirmations[].items[].sources[].documentId` | ObjectId | true |  |
| `paymentConfirmations[].items[].sources[].subjectCollection` | String | true |  |
| `paymentConfirmations[].items[].sources[].relationCode` | String | true |  |
| `paymentConfirmations[].items[].sources[].handoverId` | ObjectId | false |  |
| `paymentConfirmations[].items[].sources[].createdAt` | Date | false |  |
| `paymentConfirmations[].items[].sources[].updatedAt` | Date | false |  |
| `paymentConfirmations[].items[].sources[].itemId` | ObjectId | false |  |
| `paymentConfirmations[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `paymentConfirmations[].items[].sources[]._id` | ObjectId | false |  |
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
| `paymentConfirmations[].updatedBy` | ObjectId | false | User |
| `paymentConfirmations[].revision` | Number | false |  |
| `paymentConfirmations[].evidenceIds` | Array | false |  |
| `paymentConfirmations[].cancelledBy` | ObjectId | false | User |
| `paymentConfirmations[].cancelledAt` | Date | false |  |
| `paymentConfirmations[].cancelReason` | String | false |  |
| `cancellations` | Array | false |  |
| `cancellations[].salesOrderId` | ObjectId | true | SalesOrder |
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
| `deliveryConfirmations[].sources[].documentId` | ObjectId | true |  |
| `deliveryConfirmations[].sources[].subjectCollection` | String | true |  |
| `deliveryConfirmations[].sources[].relationCode` | String | true |  |
| `deliveryConfirmations[].sources[].handoverId` | ObjectId | false |  |
| `deliveryConfirmations[].sources[].createdAt` | Date | false |  |
| `deliveryConfirmations[].sources[].updatedAt` | Date | false |  |
| `deliveryConfirmations[].sources[].itemId` | ObjectId | false |  |
| `deliveryConfirmations[].sources[].linkedQty` | Decimal128 | false |  |
| `deliveryConfirmations[].sources[]._id` | ObjectId | false |  |
| `deliveryConfirmations[].header` | Embedded | true |  |
| `deliveryConfirmations[].header.salesOrderId` | ObjectId | true | document |
| `deliveryConfirmations[].header.warehouseId` | ObjectId | true | Warehouse |
| `deliveryConfirmations[].header.recipientName` | String | true |  |
| `deliveryConfirmations[].header.deliveredAt` | Date | true |  |
| `deliveryConfirmations[].header.confirmedBy` | ObjectId | true | User |
| `deliveryConfirmations[].header.confirmedAt` | Date | true |  |
| `deliveryConfirmations[].header.operationId` | ObjectId | true | OperationRecord |
| `deliveryConfirmations[].header.goodsIssueId` | ObjectId | false | SalesGoodsIssue |
| `deliveryConfirmations[].header.correctsConfirmationId` | ObjectId | false | embedded:delivery_confirmations |
| `deliveryConfirmations[]._id` | ObjectId | false |  |
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
| `deliveryConfirmations[].items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `deliveryConfirmations[].items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `deliveryConfirmations[].items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `deliveryConfirmations[].items[].enteredQty` | Decimal128 | true |  |
| `deliveryConfirmations[].items[].qtyBase` | Decimal128 | true |  |
| `deliveryConfirmations[].items[].productNameSnapshot` | String | true |  |
| `deliveryConfirmations[].items[].sources` | Array | false |  |
| `deliveryConfirmations[].items[].sources[].documentId` | ObjectId | true |  |
| `deliveryConfirmations[].items[].sources[].subjectCollection` | String | true |  |
| `deliveryConfirmations[].items[].sources[].relationCode` | String | true |  |
| `deliveryConfirmations[].items[].sources[].handoverId` | ObjectId | false |  |
| `deliveryConfirmations[].items[].sources[].createdAt` | Date | false |  |
| `deliveryConfirmations[].items[].sources[].updatedAt` | Date | false |  |
| `deliveryConfirmations[].items[].sources[].itemId` | ObjectId | false |  |
| `deliveryConfirmations[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `deliveryConfirmations[].items[].sources[]._id` | ObjectId | false |  |
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
| `deliveryConfirmations[].updatedBy` | ObjectId | false | User |
| `deliveryConfirmations[].revision` | Number | false |  |
| `deliveryConfirmations[].evidenceIds` | Array | false |  |
| `deliveryConfirmations[].cancelledBy` | ObjectId | false | User |
| `deliveryConfirmations[].cancelledAt` | Date | false |  |
| `deliveryConfirmations[].cancelReason` | String | false |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.salesOrderId` | ObjectId | true | document |
| `header.requestedWarehouseId` | ObjectId | true | Warehouse |
| `header.neededOn` | Date | true |  |
| `header.deliveryAddressSnapshot` | String | true |  |
| `header.salesOrderVersion` | Number | false |  |
| `header.requestedBy` | ObjectId | false | User |
| `header.requestedAt` | Date | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.issueRequestId` | ObjectId | true | document |
| `header.plannedOn` | Date | true |  |
| `header.recipientName` | String | false |  |
| `header.recipientPhone` | String | false |  |
| `header.deliveryAddress` | String | false |  |
| `header.deliveryInstructions` | String | false |  |
| `header.releasedBy` | ObjectId | false | User |
| `header.releasedAt` | Date | false |  |
| `header.replacesDeliveryOrderId` | ObjectId | false | DeliveryOrder |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.issueKind` | String | true |  |
| `header.deliveryOrderId` | ObjectId | false | DeliveryOrder |
| `header.issuedAt` | Date | false |  |
| `header.issuedBy` | ObjectId | false | User |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `handovers[].sources[].documentId` | ObjectId | true |  |
| `handovers[].sources[].subjectCollection` | String | true |  |
| `handovers[].sources[].relationCode` | String | true |  |
| `handovers[].sources[].handoverId` | ObjectId | false |  |
| `handovers[].sources[].createdAt` | Date | false |  |
| `handovers[].sources[].updatedAt` | Date | false |  |
| `handovers[].sources[].itemId` | ObjectId | false |  |
| `handovers[].sources[].linkedQty` | Decimal128 | false |  |
| `handovers[].sources[]._id` | ObjectId | false |  |
| `handovers[].header` | Embedded | true |  |
| `handovers[].header.relatedDocumentId` | ObjectId | true | document |
| `handovers[].header.recipientName` | String | true |  |
| `handovers[].header.handedOverAt` | Date | true |  |
| `handovers[].header.confirmedBy` | ObjectId | true | User |
| `handovers[].header.vehiclePlate` | String | false |  |
| `handovers[]._id` | ObjectId | false |  |
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
| `handovers[].items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `handovers[].items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `handovers[].items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `handovers[].items[].enteredQty` | Decimal128 | true |  |
| `handovers[].items[].qtyBase` | Decimal128 | true |  |
| `handovers[].items[].productNameSnapshot` | String | true |  |
| `handovers[].items[].sources` | Array | false |  |
| `handovers[].items[].sources[].documentId` | ObjectId | true |  |
| `handovers[].items[].sources[].subjectCollection` | String | true |  |
| `handovers[].items[].sources[].relationCode` | String | true |  |
| `handovers[].items[].sources[].handoverId` | ObjectId | false |  |
| `handovers[].items[].sources[].createdAt` | Date | false |  |
| `handovers[].items[].sources[].updatedAt` | Date | false |  |
| `handovers[].items[].sources[].itemId` | ObjectId | false |  |
| `handovers[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `handovers[].items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.discoveredAt` | Date | true |  |
| `header.reason` | String | true |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.reportedBy` | ObjectId | false | User |
| `header.recordedAt` | Date | false |  |
| `header.sourceRef` | Embedded | false |  |
| `header.sourceRef.documentType` | String | true |  |
| `header.sourceRef.documentId` | ObjectId | true |  |
| `header.sourceRef.itemId` | ObjectId | false |  |
| `header.sourceRef.revision` | Number | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].sourceRef` | Embedded | false |  |
| `items[].sourceRef.documentType` | String | true |  |
| `items[].sourceRef.documentId` | ObjectId | true |  |
| `items[].sourceRef.itemId` | ObjectId | false |  |
| `items[].sourceRef.revision` | Number | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
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
| `holds[].stocktakeId` | ObjectId | false | Stocktake |
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
| `holds[].events[].sourceRef.documentId` | ObjectId | true |  |
| `holds[].events[].sourceRef.itemId` | ObjectId | false |  |
| `holds[].events[].sourceRef.revision` | Number | false |  |
| `holds[].events[].performedBy` | ObjectId | true | User |
| `holds[].events[].performedAt` | Date | true |  |
| `holds[].events[].reason` | String | false |  |
| `holds[].status` | String | true |  |
| `holds[].version` | Number | true |  |
| `holds[]._id` | ObjectId | false |  |
| `holds[].createdAt` | Date | false |  |
| `holds[].updatedAt` | Date | false |  |
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
| `resolutionPlans[].sources[].documentId` | ObjectId | true |  |
| `resolutionPlans[].sources[].subjectCollection` | String | true |  |
| `resolutionPlans[].sources[].relationCode` | String | true |  |
| `resolutionPlans[].sources[].handoverId` | ObjectId | false |  |
| `resolutionPlans[].sources[].createdAt` | Date | false |  |
| `resolutionPlans[].sources[].updatedAt` | Date | false |  |
| `resolutionPlans[].sources[].itemId` | ObjectId | false |  |
| `resolutionPlans[].sources[].linkedQty` | Decimal128 | false |  |
| `resolutionPlans[].sources[]._id` | ObjectId | false |  |
| `resolutionPlans[]._id` | ObjectId | false |  |
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
| `resolutionPlans[].items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `resolutionPlans[].items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `resolutionPlans[].items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `resolutionPlans[].items[].enteredQty` | Decimal128 | true |  |
| `resolutionPlans[].items[].qtyBase` | Decimal128 | true |  |
| `resolutionPlans[].items[].productNameSnapshot` | String | true |  |
| `resolutionPlans[].items[].sources` | Array | false |  |
| `resolutionPlans[].items[].sources[].documentId` | ObjectId | true |  |
| `resolutionPlans[].items[].sources[].subjectCollection` | String | true |  |
| `resolutionPlans[].items[].sources[].relationCode` | String | true |  |
| `resolutionPlans[].items[].sources[].handoverId` | ObjectId | false |  |
| `resolutionPlans[].items[].sources[].createdAt` | Date | false |  |
| `resolutionPlans[].items[].sources[].updatedAt` | Date | false |  |
| `resolutionPlans[].items[].sources[].itemId` | ObjectId | false |  |
| `resolutionPlans[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `resolutionPlans[].items[].sources[]._id` | ObjectId | false |  |
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
| `resolutionPlans[].updatedBy` | ObjectId | false | User |
| `resolutionPlans[].revision` | Number | false |  |
| `resolutionPlans[].evidenceIds` | Array | false |  |
| `resolutionPlans[].cancelledBy` | ObjectId | false | User |
| `resolutionPlans[].cancelledAt` | Date | false |  |
| `resolutionPlans[].cancelReason` | String | false |  |
| `resolutionPlans[].header` | Embedded | true |  |
| `resolutionPlans[].header.defectReportId` | ObjectId | false | DefectReport |
| `resolutionPlans[].header.proposedBy` | ObjectId | false | User |
| `resolutionPlans[].header.submittedAt` | Date | false |  |
| `resolutionPlans[].header.previousPlanId` | ObjectId | false | embedded:defect_resolution_plans |
| `resolutionPlans[].reviewDecisions` | Array | false |  |
| `resolutionPlans[].reviewDecisions[].decisionId` | ObjectId | true | ApprovalHistory |
| `resolutionPlans[].reviewDecisions[].revision` | Number | true |  |
| `resolutionPlans[].reviewDecisions[].reviewedBy` | ObjectId | true | User |
| `resolutionPlans[].reviewDecisions[].reviewedAt` | Date | true |  |
| `resolutionPlans[].reviewDecisions[].decision` | String | true |  |
| `resolutionPlans[].reviewDecisions[].reason` | String | true |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.planId` | ObjectId | false | embedded:defect_resolution_plans |
| `header.approvedRevision` | Number | false |  |
| `header.destroyedBy` | ObjectId | false | User |
| `header.destroyedAt` | Date | false |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
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
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
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
| `resolutionPlans[].sources[].documentId` | ObjectId | true |  |
| `resolutionPlans[].sources[].subjectCollection` | String | true |  |
| `resolutionPlans[].sources[].relationCode` | String | true |  |
| `resolutionPlans[].sources[].handoverId` | ObjectId | false |  |
| `resolutionPlans[].sources[].createdAt` | Date | false |  |
| `resolutionPlans[].sources[].updatedAt` | Date | false |  |
| `resolutionPlans[].sources[].itemId` | ObjectId | false |  |
| `resolutionPlans[].sources[].linkedQty` | Decimal128 | false |  |
| `resolutionPlans[].sources[]._id` | ObjectId | false |  |
| `resolutionPlans[].header` | Embedded | true |  |
| `resolutionPlans[].header.stocktakeId` | ObjectId | true | document |
| `resolutionPlans[].header.planVersion` | Number | true |  |
| `resolutionPlans[].header.approvalId` | ObjectId | false | ApprovalHistory |
| `resolutionPlans[].header.closureBatchId` | ObjectId | false | StockTransaction |
| `resolutionPlans[].header.scopeVersion` | Number | false |  |
| `resolutionPlans[].header.previousPlanId` | ObjectId | false | embedded:stocktake_resolution_plans |
| `resolutionPlans[].header.reason` | String | false |  |
| `resolutionPlans[].header.proposedBy` | ObjectId | false | User |
| `resolutionPlans[].header.proposedAt` | Date | false |  |
| `resolutionPlans[].header.closedBy` | ObjectId | false | User |
| `resolutionPlans[].header.closedAt` | Date | false |  |
| `resolutionPlans[]._id` | ObjectId | false |  |
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
| `resolutionPlans[].items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `resolutionPlans[].items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `resolutionPlans[].items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `resolutionPlans[].items[].enteredQty` | Decimal128 | true |  |
| `resolutionPlans[].items[].qtyBase` | Decimal128 | true |  |
| `resolutionPlans[].items[].productNameSnapshot` | String | true |  |
| `resolutionPlans[].items[].sources` | Array | false |  |
| `resolutionPlans[].items[].sources[].documentId` | ObjectId | true |  |
| `resolutionPlans[].items[].sources[].subjectCollection` | String | true |  |
| `resolutionPlans[].items[].sources[].relationCode` | String | true |  |
| `resolutionPlans[].items[].sources[].handoverId` | ObjectId | false |  |
| `resolutionPlans[].items[].sources[].createdAt` | Date | false |  |
| `resolutionPlans[].items[].sources[].updatedAt` | Date | false |  |
| `resolutionPlans[].items[].sources[].itemId` | ObjectId | false |  |
| `resolutionPlans[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `resolutionPlans[].items[].sources[]._id` | ObjectId | false |  |
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
| `resolutionPlans[].updatedBy` | ObjectId | false | User |
| `resolutionPlans[].revision` | Number | false |  |
| `resolutionPlans[].evidenceIds` | Array | false |  |
| `resolutionPlans[].cancelledBy` | ObjectId | false | User |
| `resolutionPlans[].cancelledAt` | Date | false |  |
| `resolutionPlans[].cancelReason` | String | false |  |
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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `header` | Embedded | true |  |
| `header.stocktakeId` | ObjectId | false | Stocktake |
| `header.resolutionPlanId` | ObjectId | false | embedded:stocktake_resolution_plans |
| `header.warehouseId` | ObjectId | false | Warehouse |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.failureEvidenceId` | ObjectId | true | Attachment |
| `header.reason` | String | true |  |
| `header.goodsIssueId` | ObjectId | false | SalesGoodsIssue |
| `header.reportedBy` | ObjectId | false | User |
| `header.recordedAt` | Date | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |

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

## failed_delivery_receipts

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.receiptKind` | String | true |  |
| `header.failedDeliveryId` | ObjectId | false | FailedDelivery |
| `header.receivedAt` | Date | false |  |
| `header.receivedBy` | ObjectId | false | User |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `demandReopenings` | Array | false |  |
| `demandReopenings[].receiptLineId` | ObjectId | true |  |
| `demandReopenings[].stockTransactionId` | ObjectId | true | StockTransaction |
| `demandReopenings[].salesOrderLineId` | ObjectId | true |  |
| `demandReopenings[].issueRequestLineId` | ObjectId | true |  |
| `demandReopenings[].deliveryOrderLineId` | ObjectId | true |  |
| `demandReopenings[].goodsIssueLineId` | ObjectId | true |  |
| `demandReopenings[].reopenedQtyBase` | Decimal128 | true |  |
| `demandReopenings[].sourceVersion` | Number | true |  |
| `demandReopenings[]._id` | ObjectId | false |  |
| `demandReopenings[].createdAt` | Date | false |  |
| `demandReopenings[].updatedAt` | Date | false |  |
| `commitmentTransfers` | Array | false |  |
| `commitmentTransfers[].reopeningReceiptLineId` | ObjectId | true |  |
| `commitmentTransfers[].fromDeliveryOrderLineId` | ObjectId | true |  |
| `commitmentTransfers[].toDeliveryOrderLineId` | ObjectId | true |  |
| `commitmentTransfers[].quantityBase` | Decimal128 | true |  |
| `commitmentTransfers[].sourceVersion` | Number | true |  |
| `commitmentTransfers[].targetVersion` | Number | true |  |
| `commitmentTransfers[].transferredBy` | ObjectId | true | User |
| `commitmentTransfers[].transferredAt` | Date | true |  |
| `commitmentTransfers[].operationId` | ObjectId | true | OperationRecord |
| `commitmentTransfers[]._id` | ObjectId | false |  |
| `commitmentTransfers[].createdAt` | Date | false |  |
| `commitmentTransfers[].updatedAt` | Date | false |  |

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

## stock_quality_changes

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.operationId` | ObjectId | false | OperationRecord |
| `header.planId` | ObjectId | false | embedded:defect_resolution_plans |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.customerId` | ObjectId | true | Customer |
| `header.financialFollowupStatus` | String | true |  |
| `header.openedBy` | ObjectId | false | User |
| `header.openedAt` | Date | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
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

## customer_return_receipts

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.receiptKind` | String | true |  |
| `header.returnId` | ObjectId | false | CustomerReturn |
| `header.receivedAt` | Date | false |  |
| `header.operationId` | ObjectId | false | OperationRecord |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
| `items[].createdAt` | Date | false |  |
| `items[].updatedAt` | Date | false |  |
| `items[]._id` | ObjectId | false |  |
| `items[].note` | String | false |  |
| `items[].evidenceIds` | Array | false |  |
| `items[].custodyBalanceId` | ObjectId | false | InventoryBalance |
| `items[].inspectionId` | ObjectId | false | embedded:return_inspections |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |

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

## supplier_returns

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.supplierId` | ObjectId | true | Supplier |
| `header.agreementReference` | String | false |  |
| `header.agreedAt` | Date | false |  |
| `header.financialFollowupStatus` | String | true |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `header` | Embedded | true |  |
| `header.warehouseId` | ObjectId | true | Warehouse |
| `header.issueKind` | String | true |  |
| `header.supplierReturnId` | ObjectId | false | SupplierReturn |
| `header.issuedAt` | Date | false |  |
| `header.issuedBy` | ObjectId | false | User |
| `header.receivedByName` | String | false |  |
| `header.operationId` | ObjectId | false | OperationRecord |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
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
| `acknowledgements[].sources[].documentId` | ObjectId | true |  |
| `acknowledgements[].sources[].subjectCollection` | String | true |  |
| `acknowledgements[].sources[].relationCode` | String | true |  |
| `acknowledgements[].sources[].handoverId` | ObjectId | false |  |
| `acknowledgements[].sources[].createdAt` | Date | false |  |
| `acknowledgements[].sources[].updatedAt` | Date | false |  |
| `acknowledgements[].sources[].itemId` | ObjectId | false |  |
| `acknowledgements[].sources[].linkedQty` | Decimal128 | false |  |
| `acknowledgements[].sources[]._id` | ObjectId | false |  |
| `acknowledgements[]._id` | ObjectId | false |  |
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
| `acknowledgements[].items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `acknowledgements[].items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `acknowledgements[].items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `acknowledgements[].items[].enteredQty` | Decimal128 | true |  |
| `acknowledgements[].items[].qtyBase` | Decimal128 | true |  |
| `acknowledgements[].items[].productNameSnapshot` | String | true |  |
| `acknowledgements[].items[].sources` | Array | false |  |
| `acknowledgements[].items[].sources[].documentId` | ObjectId | true |  |
| `acknowledgements[].items[].sources[].subjectCollection` | String | true |  |
| `acknowledgements[].items[].sources[].relationCode` | String | true |  |
| `acknowledgements[].items[].sources[].handoverId` | ObjectId | false |  |
| `acknowledgements[].items[].sources[].createdAt` | Date | false |  |
| `acknowledgements[].items[].sources[].updatedAt` | Date | false |  |
| `acknowledgements[].items[].sources[].itemId` | ObjectId | false |  |
| `acknowledgements[].items[].sources[].linkedQty` | Decimal128 | false |  |
| `acknowledgements[].items[].sources[]._id` | ObjectId | false |  |
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
| `acknowledgements[].updatedBy` | ObjectId | false | User |
| `acknowledgements[].revision` | Number | false |  |
| `acknowledgements[].evidenceIds` | Array | false |  |
| `acknowledgements[].cancelledBy` | ObjectId | false | User |
| `acknowledgements[].cancelledAt` | Date | false |  |
| `acknowledgements[].cancelReason` | String | false |  |
| `acknowledgements[].header` | Embedded | true |  |
| `acknowledgements[].header.supplierReturnId` | ObjectId | false | SupplierReturn |
| `acknowledgements[].header.supplierId` | ObjectId | false | Supplier |
| `acknowledgements[].header.acknowledgedAt` | Date | false |  |
| `acknowledgements[].header.supplierContact` | String | false |  |
| `acknowledgements[].header.recordedBy` | ObjectId | false | User |
| `acknowledgements[].header.recordedAt` | Date | false |  |
| `acknowledgements[].reconciliations` | Array | false |  |
| `acknowledgements[].reconciliations[].itemId` | ObjectId | true |  |
| `acknowledgements[].reconciliations[].performedBy` | ObjectId | true | User |
| `acknowledgements[].reconciliations[].performedAt` | Date | true |  |
| `acknowledgements[].reconciliations[].quantityBase` | Decimal128 | true |  |
| `acknowledgements[].reconciliations[].transactionId` | ObjectId | false | StockTransaction |
| `acknowledgements[].reconciliations[].evidenceIds` | Array | false |  |
| `acknowledgements[].reconciliations[].note` | String | false |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `header` | Embedded | true |  |
| `header.sourceRef` | Embedded | false |  |
| `header.sourceRef.documentType` | String | true |  |
| `header.sourceRef.documentId` | ObjectId | true |  |
| `header.sourceRef.itemId` | ObjectId | false |  |
| `header.sourceRef.revision` | Number | false |  |
| `header.warehouseId` | ObjectId | false | Warehouse |
| `header.reportedBy` | ObjectId | false | User |
| `header.reportedAt` | Date | false |  |
| `resolutionEvents` | Array | false |  |
| `resolutionEvents[].itemId` | ObjectId | true |  |
| `resolutionEvents[].performedBy` | ObjectId | true | User |
| `resolutionEvents[].performedAt` | Date | true |  |
| `resolutionEvents[].quantityBase` | Decimal128 | true |  |
| `resolutionEvents[].transactionId` | ObjectId | false | StockTransaction |
| `resolutionEvents[].evidenceIds` | Array | false |  |
| `resolutionEvents[].note` | String | false |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
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

## stock_reversals

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
| `header` | Embedded | true |  |
| `header.originalTransactionId` | ObjectId | false | StockTransaction |
| `header.sourceDocument` | Embedded | false |  |
| `header.sourceDocument.documentType` | String | true |  |
| `header.sourceDocument.documentId` | ObjectId | true |  |
| `header.sourceDocument.itemId` | ObjectId | false |  |
| `header.sourceDocument.revision` | Number | false |  |
| `header.sourceVersion` | Number | false |  |
| `header.warehouseIds` | Array | false |  |
| `header.requestedBy` | ObjectId | false | User |
| `header.requestedAt` | Date | false |  |
| `header.reason` | String | false |  |
| `header.replacementDocument` | Embedded | false |  |
| `header.replacementDocument.documentType` | String | true |  |
| `header.replacementDocument.documentId` | ObjectId | true |  |
| `header.replacementDocument.itemId` | ObjectId | false |  |
| `header.replacementDocument.revision` | Number | false |  |
| `approvalDecision` | Embedded | false |  |
| `approvalDecision.decisionId` | ObjectId | true | ApprovalHistory |
| `approvalDecision.revision` | Number | true |  |
| `approvalDecision.reviewedBy` | ObjectId | true | User |
| `approvalDecision.reviewedAt` | Date | true |  |
| `approvalDecision.decision` | String | true |  |
| `approvalDecision.reason` | String | true |  |

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
| `sources[].documentId` | ObjectId | true |  |
| `sources[].subjectCollection` | String | true |  |
| `sources[].relationCode` | String | true |  |
| `sources[].handoverId` | ObjectId | false |  |
| `sources[].createdAt` | Date | false |  |
| `sources[].updatedAt` | Date | false |  |
| `sources[].itemId` | ObjectId | false |  |
| `sources[].linkedQty` | Decimal128 | false |  |
| `sources[]._id` | ObjectId | false |  |
| `_id` | ObjectId | false |  |
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
| `items[].packagingSnapshot.outerLengthMm` | Number | false |  |
| `items[].packagingSnapshot.outerWidthMm` | Number | false |  |
| `items[].packagingSnapshot.outerHeightMm` | Number | false |  |
| `items[].enteredQty` | Decimal128 | true |  |
| `items[].qtyBase` | Decimal128 | true |  |
| `items[].productNameSnapshot` | String | true |  |
| `items[].sources` | Array | false |  |
| `items[].sources[].documentId` | ObjectId | true |  |
| `items[].sources[].subjectCollection` | String | true |  |
| `items[].sources[].relationCode` | String | true |  |
| `items[].sources[].handoverId` | ObjectId | false |  |
| `items[].sources[].createdAt` | Date | false |  |
| `items[].sources[].updatedAt` | Date | false |  |
| `items[].sources[].itemId` | ObjectId | false |  |
| `items[].sources[].linkedQty` | Decimal128 | false |  |
| `items[].sources[]._id` | ObjectId | false |  |
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
| `updatedBy` | ObjectId | false | User |
| `revision` | Number | false |  |
| `evidenceIds` | Array | false |  |
| `cancelledBy` | ObjectId | false | User |
| `cancelledAt` | Date | false |  |
| `cancelReason` | String | false |  |
| `stockTransactionId` | ObjectId | false | StockTransaction |
| `postedBy` | ObjectId | false | User |
| `postedAt` | Date | false |  |
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

| Trường | Kiểu | Bắt buộc | Liên kết |
|---|---|---|---|
| `invoiceNo` | String | true |  |
| `salesOrderId` | ObjectId | true | SalesOrder |
| `customerId` | ObjectId | true | Customer |
| `customerSnapshot.name` | String | true |  |
| `customerSnapshot.phone` | String | true |  |
| `currencyCode` | String | true |  |
| `items` | Array | false |  |
| `items[].salesOrderItemId` | ObjectId | true |  |
| `items[].goodsIssueId` | ObjectId | true | SalesGoodsIssue |
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
| `totalAmount` | Decimal128 | true |  |
| `status` | String | true |  |
| `createdBy` | ObjectId | true | User |
| `issuedBy` | ObjectId | false | User |
| `issuedAt` | Date | false |  |
| `version` | Number | true |  |
| `_id` | ObjectId | false |  |
| `createdAt` | Date | false |  |
| `updatedAt` | Date | false |  |

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
