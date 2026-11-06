import { demoDate, fixtureId, hash, demoPng, decimalValue } from './data.js';

export async function upgradeSupportingData(context) {
  const {data, document, byId, itemParents, items, sourceRef, ancestor, actor} = context;
  const stamp = row => ({_id:row._id,createdAt:row.createdAt ?? demoDate(1)});
  const actorInfo = id => {
    const user=byId('users',id), role=byId('roles',user.roleId);
    return {username:user.username,roleCode:role.code};
  };
  const warehouseActor = warehouseId => data.users.find(user => user.warehouseIds.some(id=>String(id)===String(warehouseId)) && byId('roles',user.roleId).code==='WAREHOUSE')._id;
  data.stock_reservations=data.stock_reservations.map(row => {
    const demand=ancestor(row.demandLineId,'SALES_ORDER');
    return {...stamp(row),demandRef:sourceRef(demand.item._id),executionRef:sourceRef(row.executionLineId),
      balanceId:row.balanceId,reservedQty:row.qtyBase,
      consumedQty:row.status==='CONSUMED'?row.qtyBase:decimalValue(0),
      releasedQty:row.status==='RELEASED'?row.qtyBase:decimalValue(0),movedQty:decimalValue(0),
      creationKey:'demo-reservation:'+row._id,createdBy:itemParents.get(String(row.executionLineId)).createdBy,version:1};
  });
  data.supply_allocations=data.supply_allocations.map(row => {
    const po=ancestor(row.supplyLineId,'PO');
    const demand=itemParents.get(String(row.demandLineId));
    return {...stamp(row),demandRef:sourceRef(row.demandLineId),sourceRef:sourceRef(po.item._id),
      destinationWarehouseId:po.document.header.warehouseId,allocatedQty:row.qtyBase,
      receivedAssignedQty:row.status==='FULFILLED'?row.qtyBase:decimalValue(0),
      releasedQty:row.status==='CANCELLED'?row.qtyBase:decimalValue(0),neededBy:demand.header.neededOn,
      creationKey:'demo-supply:'+row._id,createdBy:demand.createdBy,version:1};
  });
  data.approval_history=data.approval_history.map(row => {
    const subject=document(row.documentId), user=byId('users',row.decidedBy);
    const permission=row.decisionKind==='STANDARD_ACCEPTANCE'?'customer_return:accept':
      subject.documentKind==='TRANSFER_REQUEST'?'stock_transfer:approve':
      subject.documentKind==='REPLENISHMENT'?'replenishment_request:approve':'defect:approve';
    return {...stamp(row),decisionKey:'demo-decision:'+row._id,subjectType:context.documents.get(String(row.documentId)).collection,
      subjectId:row.documentId,subjectRevision:row.documentVersion,decisionScope:row.decisionKind,
      reviewedContent:{documentNo:subject.documentNo,version:row.documentVersion,items:subject.items.map(item=>({_id:item._id,quantityBase:item.qtyBase}))},
      decision:row.decision,reason:row.reason,itemDecisions:row.lines.map(line=>({itemId:line.lineId,approvedQtyBase:line.approvedQty,outcome:line.outcome})),
      requestedBy:row.requestedBy,decidedBy:row.decidedBy,decidedAt:row.decidedAt,recordedAt:row.decidedAt,
      authoritySnapshot:{roleCode:actorInfo(row.decidedBy).roleCode,permissionCode:permission,warehouseIds:user.warehouseIds},
      basisRefs:[],evidenceIds:[]};
  });
  data.attachments=data.attachments.map(row=>({...stamp(row),
    ownerDocumentType:context.documents.get(String(row.documentId)).collection,ownerDocumentId:row.documentId,
    ownerRevision:document(row.documentId).version,purpose:'DEMO_EVIDENCE',
    originalName:'demo-evidence.png',mediaType:'image/png',sizeBytes:demoPng.length,
    storageKey:'demo-fixtures/'+row._id+'.png',checksum:hash(demoPng),uploadedBy:row.uploadedBy,
    uploadedAt:row.uploadedAt,accessCategory:'INTERNAL',status:'ATTACHED'}));
  data.return_inspections=data.return_inspections.map(row => {
    const parent=itemParents.get(String(row.returnLineId));
    return {...stamp(row),returnLineId:row.returnLineId,inspectionNo:row.assessmentNo,returnVersion:row.documentVersion,
      warehouseId:parent.header.warehouseId,inspectedBy:row.assessedBy,inspectedAt:row.assessedAt,
      portions:[{quantityBase:items.get(String(row.returnLineId)).qtyBase,packagingCondition:row.packagingCondition,
        installationStatus:row.installationStatus,damageCause:row.damageCause,deadlineStatus:row.deadlineStatus,
        deadlineReference:row.deadlineReference,eligibilityStatus:row.eligibilityStatus,reason:row.assessmentReason,evidenceIds:[]}]};
  });
  data.return_quantity_claims=data.return_quantity_claims.map(row => {
    const parent=itemParents.get(String(row.requestLineId));
    let sourceLineId=row.salesIssueLineId;
    if(row.claimKind==='CR') {
      const received=data.delivery_confirmations.flatMap(doc=>doc.items).find(item=>String(item.details.salesIssueLineId)===String(row.salesIssueLineId));
      sourceLineId=received._id;
    }
    return {...stamp(row),claimKind:row.claimKind,requestLineId:row.requestLineId,
      sourceKind:row.claimKind==='CR'?'DELIVERY_CONFIRMATION':'GOODS_ISSUE',sourceLineId,
      claimedQtyBase:row.qtyBase,createdBy:parent.createdBy,operationId:row.operationId,version:1,
      events:row.status==='CONSUMED'?[{kind:'RECEIVED',quantityBase:row.qtyBase,sourceRef:sourceRef(row.requestLineId),
        performedBy:actor('WAREHOUSE'),performedAt:demoDate(row.claimKind==='CR'?18:15),reason:'Nhận về kho trong kịch bản mẫu'}]:[]};
  });
  data.delivery_demand_reopenings=data.delivery_demand_reopenings.map(row=>{
    const receipt=items.get(String(row.receiptLineId));
    return {...stamp(row),receiptLineId:row.receiptLineId,stockTransactionId:row.postingBatchId,
      salesOrderLineId:row.salesOrderLineId,issueRequestLineId:row.issueRequestLineId,
      deliveryOrderLineId:row.outboundDeliveryLineId,goodsIssueLineId:receipt.details.salesIssueLineId,
      reopenedQtyBase:row.reopenedQty,sourceVersion:row.sourceVersion};
  });
  data.delivery_commitment_transfers=data.delivery_commitment_transfers.map(row=>({...stamp(row),
    reopeningReceiptLineId:row.reopeningReceiptLineId,fromDeliveryOrderLineId:row.fromOdLineId,toDeliveryOrderLineId:row.toOdLineId,
    quantityBase:row.qtyBase,sourceVersion:row.sourceVersion,targetVersion:row.targetVersion,
    transferredBy:actor('SALES'),transferredAt:demoDate(16),operationId:row.operationId}));
  data.sales_order_cancellations=data.sales_order_cancellations.map(row=>({...row,sourceKind:'UNISSUED',sourceVersion:1}));
  data.stock_holds=data.stock_holds.map(row=>({...stamp(row),
    defectReportLineId:document(row.defectDocumentId).items[0]._id,stocktakeId:row.stocktakeId,
    recordedBy:row.recordedBy,recordedAt:row.recordedAt,reason:'Chặn đúng lượng nghi lỗi trong bộ mẫu',
    evidenceIds:[row.evidenceId],allocations:[{balanceId:row.balanceId,quantityBase:row.qtyBase}],
    events:[],status:row.status,version:1}));
  data.stocktake_snapshots=data.stocktake_snapshots.map(row=>{
    const stocktake=document(row.stocktakeId), balance=byId('inventory_balances',row.balanceId);
    const point=byId('stock_holding_points',balance.holdingPointId);
    const batch=byId('product_batches',balance.batchId), product=byId('products',batch.productId);
    return {...stamp(row),stocktakeId:row.stocktakeId,scopeVersion:1,cutoffAt:stocktake.header.cutoffAt,capturedAt:stocktake.header.cutoffAt,
      sourceBalanceId:row.balanceId,locationId:point.locationId,batchId:balance.batchId,
      ownerType:balance.ownerType,ownerId:balance.ownerId,qualityStatus:balance.qualityStatus,
      bookQtyBase:row.bookQty,baseUnitSnapshot:product.baseUnit,sourceBalanceVersion:balance.version,origin:'BOOK',evidenceIds:[]};
  });
  data.stocktake_counts=data.stocktake_counts.map(row=>{
    const snapshot=byId('stocktake_snapshots',row.snapshotId);
    return {...stamp(row),stocktakeId:snapshot.stocktakeId,scopeVersion:1,locationId:snapshot.locationId,
      targetType:'STOCK',snapshotId:row.snapshotId,attemptNo:row.attemptNo,
      quantityEntries:[{enteredUnit:snapshot.baseUnitSnapshot,enteredQty:row.countedQty,baseUnitsPerUnit:decimalValue(1),quantityBase:row.countedQty}],
      countedQtyBase:row.countedQty,baseUnitSnapshot:snapshot.baseUnitSnapshot,
      evidenceIds:[],countedBy:row.countedBy,countedAt:row.countedAt,recordedAt:row.countedAt};
  });
  data.stocktake_location_locks=data.stocktake_location_locks.map(row=>({...stamp(row),stocktakeId:row.stocktakeId,
    locationId:row.locationId,scopeVersion:1,lockedAt:row.lockedAt,lockedBy:warehouseActor(byId('warehouse_locations',row.locationId).warehouseId),status:'LOCKED',version:1}));
  for(const stocktake of data.stocktakes) {
    const counter = warehouseActor(stocktake.header.warehouseId);
    Object.assign(stocktake.header,{scopeVersion:1,scope:{locationIds:stocktake.header.scopeLocationIds,batchIds:[],productIds:[],areaCodes:[]},
      assignedCounterIds:[counter],activatedBy:counter,activatedAt:stocktake.header.cutoffAt,
      reason:'Kiểm kê mẫu',plannedAt:stocktake.occurredAt});
    if(stocktake.workflowStatus==='CLOSED') {
      stocktake.header.closedBy=actor('OWNER');
      stocktake.header.closureReferenceId=stocktake._id;
      for(const locationId of stocktake.header.scopeLocationIds) data.stocktake_location_locks.push({
        _id:fixtureId('released-lock:'+locationId),stocktakeId:stocktake._id,locationId,scopeVersion:1,
        lockedAt:stocktake.header.cutoffAt,lockedBy:counter,status:'RELEASED',version:2,
        releasedAt:stocktake.header.completedAt,releasedBy:actor('OWNER'),closureReferenceId:stocktake._id,
      });
    }
  }
  data.operation_records=data.operation_records.map(row=>({...stamp(row),actorType:'USER',actorId:row.performedBy,
    operationCode:row.operation,requestKey:row.idempotencyKey,requestHash:row.payloadHash,operationKey:row.operationKey,
    subjectType:context.documents.get(String(row.documentId)).collection,subjectId:row.documentId,
    versionBefore:Math.max(0,row.documentVersion-1),versionAfter:row.documentVersion,
    resultRefs:[{documentType:context.documents.get(String(row.documentId)).collection,documentId:row.documentId}],
    resultCode:'SUCCESS',completedAt:row.performedAt}));
  data.audit_logs=data.audit_logs.map(row=>({...stamp(row),eventKey:'demo-audit:'+row._id,actorType:'USER',actorId:row.actorId,
    actorSnapshot:actorInfo(row.actorId),action:row.action,result:'SUCCESS',reason:row.details,
    subjectType:context.documents.get(String(row.documentId)).collection,subjectId:row.documentId,
    warehouseIds:[],changes:[],occurredAt:row.eventAt,recordedAt:row.eventAt}));
  data.system_events=data.system_events.map(row=>({...stamp(row),eventKey:row.eventKey,handlerCode:'DEMO_SIMULATION',
    eventType:row.eventType,sourceType:context.documents.get(String(row.documentId)).collection,sourceId:row.documentId,
    sourceVersion:row.documentVersion??document(row.documentId).version,payload:{demo:true},payloadVersion:1,
    status:'COMPLETED',attempts:row.attempts,completedAt:row.deliveredAt??demoDate(27),occurredAt:document(row.documentId).occurredAt}));
  data.notifications=data.notifications.map(row=>({...stamp(row),recipientId:row.recipientId,type:row.type,eventKey:row.eventKey,dedupKey:row.dedupKey,
    sourceType:context.documents.get(String(row.sourceDocumentId)).collection,sourceId:row.sourceDocumentId,sourceVersion:row.sourceDocumentVersion,
    warehouseIds:row.warehouseId?[row.warehouseId]:[],title:row.title,message:row.message,
    occurredAt:row.evaluatedAt,evaluatedAt:row.evaluatedAt,readAt:row.readAt,emailDelivery:{status:'SKIPPED',attempts:0}}));
  for(const claim of data.return_quantity_claims) {
    const parent=itemParents.get(String(claim.sourceLineId));
    data.return_source_locks.push({_id:fixtureId('return-source:'+claim.sourceLineId),
      sourceKey:claim.sourceKind+':'+claim.sourceLineId,sourceKind:claim.sourceKind,
      sourceDocumentId:parent._id,sourceItemId:claim.sourceLineId,version:1,lastOperationId:claim.operationId});
  }
}
