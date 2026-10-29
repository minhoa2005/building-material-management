import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import * as models from '../../models/index.js';
import { exact } from '../../models/model-utils.js';
import { SEED_ACCOUNTS, SEED_WAREHOUSES } from './accounts.data.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from './permissions.data.js';

// Synthetic dev fixtures, not evidence of actual store transactions or uploads.
const hash = (value) => createHash('sha256').update(value).digest('hex');
const id = (key) => new mongoose.Types.ObjectId(hash(`wmsd-demo-v1:${key}`).slice(0, 24));
const at = (day, hour = 8) => new Date(Date.UTC(2026, 9, day, hour));
// A real tiny PNG fixture, used only for synthetic POD metadata (no upload).
const demoPhoto = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY9sAAAAASUVORK5CYII=', 'base64');

/** Build the entire graph without connecting to MongoDB or writing any data. */
export async function buildDemoData() {
  const groups = new Map(Object.entries(models)
    .filter(([, value]) => value?.modelName)
    .map(([name, Model]) => [name, { Model, documents: [] }]));
  const add = (name, key, data) => {
    const document = new models[name]({ _id: id(`${name}:${key}`), ...data });
    groups.get(name).documents.push(document);
    return document;
  };
  const permissions = new Map(PERMISSION_CATALOGUE.map(({ code }) =>
    [code, add('Permission', code, { code })]));
  const roles = new Map(models.ROLE_CODES.map((code) => [code, add('Role', code, {
    code, permissionIds: ROLE_PERMISSIONS[code].map((permission) => permissions.get(permission)._id),
  })]));
  const warehouses = new Map(SEED_WAREHOUSES.map((warehouse) =>
    [warehouse.code, add('Warehouse', warehouse.code, warehouse)]));
  const users = new Map();
  for (const account of SEED_ACCOUNTS) {
    users.set(account.username, add('User', account.username, {
      username: account.username, fullName: account.fullName, phone: account.phone,
      passwordHash: await bcrypt.hash(account.password, 10),
      roleId: roles.get(account.roleCode)._id,
      warehouseIds: account.warehouseCodes.map((code) => warehouses.get(code)._id),
    }));
  }
  const owner = users.get('owner@ceratile.vn')._id;
  const sales = users.get('sales@ceratile.vn')._id;
  const accountant = users.get('accountant@ceratile.vn')._id;
  const dispatcher = users.get('warehouse@ceratile.vn')._id;
  const receiver = users.get('warehouse2@ceratile.vn')._id;
  const wh = (code) => warehouses.get(code)._id;
  const locations = new Map();
  const accounts = new Map();
  for (const warehouse of warehouses.values()) {
    for (const kind of ['RECEIVING', 'STORAGE', 'STAGING', 'QUARANTINE', 'CUSTODY']) {
      const key = `${warehouse.code}:${kind}`;
      const location = add('Location', key, {
        warehouseId: warehouse._id, code: `${warehouse.code}-${kind}`,
        kind, allocatable: kind === 'STORAGE',
      });
      locations.set(key, location);
      accounts.set(key, add('StockAccount', key, { locationId: location._id }));
    }
  }
  const store = add('Party', 'store', { code: 'STORE', name: 'Cửa hàng demo CeraTile', kind: 'STORE' });
  const supplier = add('Party', 'supplier', { code: 'NCC-DEMO', name: 'Nhà cung cấp mẫu', kind: 'SUPPLIER' });
  const customer = add('Party', 'customer', {
    code: 'KH-DEMO', name: 'Khách hàng mẫu', kind: 'CUSTOMER', contactReference: 'Địa chỉ giao hàng demo',
  });
  const carrier = add('Party', 'carrier', { code: 'VC-DEMO', name: 'Đơn vị vận chuyển mẫu', kind: 'CARRIER' });
  const piece = add('Uom', 'PIECE', { code: 'PIECE', name: 'Viên' });
  const box = add('Uom', 'BOX', { code: 'BOX', name: 'Thùng' });
  add('Uom', 'M2', { code: 'M2', name: 'Mét vuông' });
  const products = [];
  const lots = [];
  const conversions = [];
  const policies = new Map();
  for (const [index, size, factor] of [[1, '600x600', '4'], [2, '300x600', '8']]) {
    const product = add('Product', `${index}`, {
      sku: `GACH-DEMO-${index}`, name: `Gạch mẫu ${size}`, baseUomId: piece._id, nominalSize: size,
    });
    products.push(product);
    conversions.push(add('ProductUomVersion', `${index}:PIECE`, {
      productId: product._id, uomId: piece._id, version: 1, basePerUnit: '1', validFrom: at(1),
    }));
    add('ProductUomVersion', `${index}:BOX`, {
      productId: product._id, uomId: box._id, version: 1, basePerUnit: factor, validFrom: at(1),
    });
    lots.push(add('Lot', `${index}`, {
      productId: product._id, manufacturerLot: `LOT-DEMO-${index}`, tone: `T${index}`,
      calibre: `CAL-DEMO-${index}`, identificationStatus: 'VERIFIED', manufacturedOn: at(1),
    }));
    for (const warehouse of warehouses.values()) {
      const key = `${index}:${warehouse.code}`;
      policies.set(key, add('ProductWarehousePolicy', key, {
        productId: product._id, warehouseId: warehouse._id,
        minimumQty: index === 1 && warehouse.code === 'WH02' ? '150' : '20',
        targetQty: index === 1 && warehouse.code === 'WH02' ? '160' : '20',
        version: 1, updatedBy: owner,
      }));
      add('ReplenishmentPlanningGuard', key, { warehouseId: warehouse._id, productId: product._id, version: 0 });
    }
  }
  add('Lot', 'unknown', {
    productId: products[0]._id, manufacturerLot: 'UNKNOWN', tone: 'UNKNOWN',
    calibre: 'UNKNOWN', identificationStatus: 'UNKNOWN',
  });

  const doc = (key, kind, actor, header, workflowStatus = 'DRAFT', day = 10) => add('BusinessDocument', key, {
    documentNo: `DEMO-${key}`, documentKind: kind, createdBy: actor, workflowStatus,
    occurredAt: at(day), note: 'Dữ liệu mẫu tổng hợp, chỉ dùng cho dev/test.',
    ...(header ? { header } : {}),
  });
  const line = (key, document, qty, kind = 'STANDARD', details, productIndex = 0) => add('DocumentLine', key, {
    documentId: document._id,
    lineNo: groups.get('DocumentLine').documents.filter((item) => item.documentId.equals(document._id)).length + 1,
    lineKind: kind, productId: products[productIndex]._id, lotId: lots[productIndex]._id,
    conversionId: conversions[productIndex]._id, enteredQty: qty, conversionSnapshot: '1',
    qtyBase: qty, productNameSnapshot: products[productIndex].name,
    ...(details ? { details } : {}),
  });
  const link = (source, target, relationCode = 'SOURCE') => {
    const key = `${source._id}:${target._id}:${relationCode}`;
    add('DocumentLink', key, { parentDocumentId: source.documentId, childDocumentId: target.documentId, relationCode });
    add('LineLink', key, {
      sourceLineId: source._id, targetLineId: target._id, relationCode, linkedQty: target.qtyBase,
    });
  };
  const evidence = (key, document, actor = dispatcher, photo = false) => add('Evidence', key, {
    documentId: document._id, objectKey: `demo-only/${key}.${photo ? 'png' : 'txt'}`,
    sha256: hash(photo ? demoPhoto : `Synthetic demo evidence: ${key}`), mediaType: photo ? 'image/png' : 'text/plain',
    uploadedBy: actor, uploadedAt: document.occurredAt,
  });
  const operation = (key, document, actor, action) => add('BusinessOperation', key, {
    documentId: document._id, operation: action, operationKey: key, idempotencyKey: `demo:${key}`,
    payloadHash: hash(key), documentVersion: document.version, performedBy: actor,
    performedAt: document.occurredAt, reason: 'Thao tác demo',
  });
  const approve = (key, document, actor, kind, approvedLines) => add('Approval', key, {
    documentId: document._id, documentVersion: document.version, decisionKind: kind, decision: 'APPROVE',
    requestedBy: document.createdBy, decidedBy: actor, decidedAt: document.occurredAt,
    reason: 'Quyết định mẫu', lines: approvedLines.map((item) => ({
      lineId: item._id, approvedQty: item.qtyBase, outcome: 'APPROVE',
    })),
  });
  const balances = new Map();
  const balance = (accountKey, quality = 'GOOD', party = store, productIndex = 0) => {
    const key = `${accountKey}:${quality}:${party.code}:${productIndex}`;
    if (!balances.has(key)) {
      balances.set(key, add('StockBalance', key, {
        accountId: accounts.get(accountKey)._id, lotId: lots[productIndex]._id,
        qualityCode: quality, ownerPartyId: party._id, qtyBase: '0',
      }));
    }
    return balances.get(key);
  };
  const batches = new Map();
  const post = (key, document, item, from, to, actor = dispatcher, reversalOf) => {
    if (!batches.has(key)) {
      batches.set(key, add('PostingBatch', key, {
        documentId: document._id, operation: reversalOf ? 'REVERSE' : 'POST', operationKey: key,
        idempotencyKey: `demo:posting:${key}`, payloadHash: hash(key), postedBy: actor,
        postedAt: document.occurredAt, ...(reversalOf ? { reversalOf: reversalOf._id } : {}),
      }));
    }
    const movement = { batchId: batches.get(key)._id, documentId: document._id, lineId: item._id, qtyBase: item.qtyBase };
    for (const [side, endpoint, sign] of [['from', from, -1], ['to', to, 1]]) {
      if (!endpoint) continue;
      movement[`${side}BalanceId`] = endpoint._id;
      movement[`${side}Before`] = endpoint.qtyBase;
      const after = exact(endpoint.qtyBase).plus(exact(item.qtyBase).mul(sign));
      if (after.isNegative()) throw new Error(`Negative demo balance in ${key}`);
      movement[`${side}After`] = after.toFixed();
      endpoint.qtyBase = after.toFixed();
      endpoint.version += 1;
    }
    add('StockMovement', `${key}:${item.lineNo}`, movement);
    return batches.get(key);
  };
  const task = (key, qty, source, target, actor = dispatcher, day = 11, productIndex = 0, quality = 'GOOD') => {
    const warehouseCode = source.split(':')[0];
    const taskDocument = doc(key, 'TO', actor, {
      warehouseId: wh(warehouseCode), taskKind: target.endsWith('STAGING') ? 'PICK' : 'PUTAWAY', assignedTo: actor,
    }, 'CONFIRMED', day);
    const item = line(key, taskDocument, qty, 'WAREHOUSE_TASK', {
      fromLocationId: locations.get(source)._id, toLocationId: locations.get(target)._id, qualityCode: quality,
    }, productIndex);
    post(key, taskDocument, item, balance(source, quality, store, productIndex), balance(target, quality, store, productIndex), actor);
    return item;
  };

  // Opening inventory always has ledger entries, including non-store custody.
  const openings = new Map();
  for (const [key, qty, account, quality, party, productIndex] of [
    ['wh2', '100', 'WH02:STORAGE', 'GOOD', store, 0],
    ['wh3', '60', 'WH03:STORAGE', 'GOOD', store, 1],
    ['damaged', '8', 'WH01:QUARANTINE', 'DAMAGED', store, 0],
    ['custody', '3', 'WH01:CUSTODY', 'PENDING', supplier, 0],
  ]) {
    const warehouseCode = account.split(':')[0];
    const actor = warehouseCode === 'WH03' ? receiver : dispatcher;
    if (!openings.has(warehouseCode)) openings.set(warehouseCode, doc(`OPENING-${warehouseCode}`, 'OPENING', actor, null, 'POSTED', 2));
    const opening = openings.get(warehouseCode);
    post(`opening:${warehouseCode}`, opening, line(`opening:${key}`, opening, qty, 'STANDARD', undefined, productIndex),
      null, balance(account, quality, party, productIndex), actor);
  }

  // BF-01: approved replenishment -> purchase -> arrival/inspection -> GR -> put-away.
  const rr = doc('RR', 'REPLENISHMENT', dispatcher, {
    warehouseId: wh('WH01'), neededOn: at(10), triggerReason: 'Bổ sung hàng demo',
    creationKey: 'demo:rr:initial', submittedBy: dispatcher, submittedAt: at(9),
  }, 'APPROVED');
  const rrLine = line('rr', rr, '120', 'REPLENISHMENT', {
    triggerType: 'MANUAL_OTHER', reasonNote: 'Nhập lô hàng dự trữ ban đầu theo kế hoạch demo.',
  });
  operation('rr:create', rr, dispatcher, 'CREATE_REPLENISHMENT');
  approve('rr', rr, owner, 'REPLENISHMENT_APPROVAL', [rrLine]);
  const po = doc('PO', 'PO', accountant, {
    warehouseId: wh('WH01'), supplierId: supplier._id, expectedOn: at(10), supplierConfirmation: 'Xác nhận NCC demo',
  }, 'COMPLETED');
  const poLine = line('po', po, '120');
  link(rrLine, poLine, models.REPLENISHMENT_RELATIONS.PURCHASE);
  const arrival = doc('ARRIVAL', 'ARRIVAL', dispatcher, {
    warehouseId: wh('WH01'), supplierId: supplier._id, arrivedAt: at(10), deliveryReference: 'DELIVERY-DEMO',
  }, 'COMPLETED');
  const arrivalLine = line('arrival', arrival, '120');
  link(poLine, arrivalLine);
  const inspection = doc('INSPECTION-P', 'INSPECTION', dispatcher, null, 'COMPLETED');
  const inspected = line('inspection:p', inspection, '120', 'INSPECTION', {
    inspectedSourceLineId: arrivalLine._id, qualityCode: 'GOOD', ownershipDecision: 'ACCEPT',
    inspectedBy: dispatcher, inspectedAt: at(10), packagingCondition: 'SEALED',
  });
  link(arrivalLine, inspected);
  const gr = doc('GR-P', 'GR_PURCHASE', dispatcher, { warehouseId: wh('WH01') }, 'POSTED');
  const grLine = line('gr:p', gr, '120');
  link(inspected, grLine);
  post('gr:p', gr, grLine, null, balance('WH01:RECEIVING'));
  link(grLine, task('PUTAWAY-P', '120', 'WH01:RECEIVING', 'WH01:STORAGE'));

  // BF-06: separate completed sale, failed delivery and wholly cancelled sale.
  const saleChain = (key, qty, status) => {
    const external = add('ExternalReference', key, {
      sourceSystem: 'DEMO_PAPER', referenceKind: 'SALES_ORDER', referenceNo: `EXT-${key}`,
      correlationId: `demo:source:${key}`, referenceDate: at(10), verifiedBy: accountant, verifiedAt: at(10),
    });
    const externalLine = add('ExternalReferenceLine', key, {
      referenceId: external._id, lineKey: '1', productId: products[0]._id, eligibleQty: qty,
    });
    const so = doc(`SO-${key}`, 'SALES_ORDER', sales, {
      externalReferenceId: external._id, customerId: customer._id, neededOn: at(12),
      deliveryAddressSnapshot: 'Địa chỉ giao hàng mẫu',
    }, status, 12);
    so.externalReferenceIds = [external._id];
    const soLine = line(`so:${key}`, so, qty, 'SALES_ORDER', {
      externalReferenceId: external._id, externalLineId: externalLine._id, requiredTone: 'T1', requiredCalibre: 'CAL-DEMO-1',
    });
    if (['CANCELLED', 'OPEN'].includes(status)) return { so, soLine };
    const wir = doc(`WIR-${key}`, 'ISSUE_REQUEST', sales, {
      salesOrderId: so._id, requestedWarehouseId: wh('WH01'), neededOn: at(12), deliveryAddressSnapshot: 'Địa chỉ giao hàng mẫu',
    }, status === 'COMPLETED' ? 'COMPLETED' : 'PARTIAL', 12);
    const wirLine = line(`wir:${key}`, wir, qty, 'ISSUE_REQUEST', { salesOrderLineId: soLine._id, releaseKey: `demo:${key}` });
    link(soLine, wirLine);
    const od = doc(`OD-${key}`, 'OUTBOUND_DELIVERY', sales, {
      warehouseId: wh('WH01'), issueRequestId: wir._id, plannedOn: at(12),
    }, status === 'COMPLETED' ? 'COMPLETED' : 'PARTIAL', 12);
    const odLine = line(`od:${key}`, od, qty, 'OUTBOUND_DELIVERY', { issueRequestLineId: wirLine._id });
    link(wirLine, odLine);
    const giDay = key === 'FD' ? 14 : 12;
    const gi = doc(`GI-${key}`, 'GI_SALE', dispatcher, { warehouseId: wh('WH01') }, 'POSTED', giDay);
    const giLine = line(`gi:${key}`, gi, qty, 'SALES_GOODS_ISSUE', { outboundDeliveryLineId: odLine._id });
    link(odLine, giLine);
    const picked = task(`PICK-${key}`, qty, 'WH01:STORAGE', 'WH01:STAGING', dispatcher, giDay - 1);
    link(giLine, picked, 'PICKING');
    post(`gi:${key}`, gi, giLine, balance('WH01:STAGING'), null);
    add('Reservation', key, {
      demandLineId: wirLine._id, executionLineId: giLine._id, balanceId: balance('WH01:STAGING')._id,
      qtyBase: qty, status: 'CONSUMED',
    });
    add('DemandSupplyAllocation', key, { demandLineId: soLine._id, supplyLineId: grLine._id, qtyBase: qty, status: 'FULFILLED' });
    return { so, soLine, wir, wirLine, od, odLine, gi, giLine };
  };
  const delivered = saleChain('DONE', '12', 'COMPLETED');
  delivered.so.version = 3;
  const pod = doc('POD', 'DELIVERY_CONFIRMATION', dispatcher, {
    salesOrderId: delivered.so._id, warehouseId: wh('WH01'), recipientName: customer.name,
    deliveredAt: at(13), confirmedBy: dispatcher, confirmedAt: at(13), operationId: id('BusinessOperation:pod'),
  }, 'CONFIRMED', 13);
  const podEvidence = evidence('pod-placeholder', pod, dispatcher, true);
  const podLine = line('pod', pod, '12', 'DELIVERY_CONFIRMATION', {
    salesIssueLineId: delivered.giLine._id, photoEvidenceId: podEvidence._id,
  });
  link(delivered.giLine, podLine);
  operation('pod', pod, dispatcher, 'CONFIRM_POD');
  const payment = doc('PAY-CFM', 'PAYMENT_CONFIRMATION', sales, {
    salesOrderId: delivered.so._id, deliveredOrderVersion: 3, fullPaymentReceived: true,
    externalReceiptReference: 'RECEIPT-DEMO', confirmationNote: 'Xác nhận mẫu, không ghi nhận thanh toán thật.',
    confirmedBy: sales, confirmedAt: at(14), operationId: id('BusinessOperation:payment'),
  }, 'CONFIRMED', 14);
  operation('payment', payment, sales, 'CONFIRM_PAYMENT');
  add('DocumentLink', 'pod:payment', { parentDocumentId: pod._id, childDocumentId: payment._id, relationCode: 'PAYMENT_AFTER_POD' });
  const cancelled = saleChain('CANCELLED', '2', 'CANCELLED');
  const cancelOperation = operation('cancel', cancelled.so, sales, 'CANCEL');
  add('SalesOrderCancellation', 'cancel', {
    salesOrderId: cancelled.so._id, salesOrderLineId: cancelled.soLine._id, cancelledQtyBase: '2',
    cancelledBy: sales, cancelledAt: at(12), reason: 'Khách hủy toàn bộ trước khi thực xuất (demo)', operationId: cancelOperation._id,
  });

  // BF-07 / A1: PGI10, return4 before POD, net fulfilment6 and replacement OD4.
  const failed = saleChain('FD', '10', 'IN_PROGRESS');
  failed.so.version = 2;
  failed.wir.version = 2;
  failed.od.version = 2;
  const fd = doc('FD', 'FAILED_DELIVERY', dispatcher, {
    warehouseId: wh('WH01'), failureEvidenceId: id('Evidence:fd'), reason: 'Không giao được 4 viên (demo)',
  }, 'CLOSED', 15);
  evidence('fd', fd);
  const fdLine = line('fd', fd, '4', 'FAILED_DELIVERY', { salesIssueLineId: failed.giLine._id });
  link(failed.giLine, fdLine);
  const fdOperation = operation('fd:claim', fd, dispatcher, 'CLAIM_FD');
  const fdClaim = add('ReturnSourceClaim', 'fd', {
    requestLineId: fdLine._id, salesIssueLineId: failed.giLine._id, claimKind: 'FD', qtyBase: '4',
    status: 'CONSUMED', operationId: fdOperation._id,
  });
  const fdInspection = doc('INSPECTION-FD', 'INSPECTION', dispatcher, null, 'COMPLETED', 15);
  const fdInspected = line('inspection:fd', fdInspection, '4', 'INSPECTION', {
    inspectedSourceLineId: fdLine._id, qualityCode: 'GOOD', ownershipDecision: 'ACCEPT',
    inspectedBy: dispatcher, inspectedAt: at(15), packagingCondition: 'OPENED',
  });
  link(fdLine, fdInspected);
  const grFd = doc('GR-FD', 'GR_FAILED_DELIVERY', dispatcher, { warehouseId: wh('WH01') }, 'POSTED', 15);
  const grFdLine = line('gr:fd', grFd, '4', 'FAILED_DELIVERY_RECEIPT', {
    failedDeliveryLineId: fdLine._id, salesIssueLineId: failed.giLine._id,
    inspectionLineId: fdInspected._id, claimId: fdClaim._id,
  });
  link(fdInspected, grFdLine);
  const fdBatch = post('gr:fd', grFd, grFdLine, null, balance('WH01:RECEIVING'));
  add('DemandReopening', 'fd', {
    receiptLineId: grFdLine._id, salesOrderLineId: failed.soLine._id, issueRequestLineId: failed.wirLine._id,
    outboundDeliveryLineId: failed.odLine._id, reopenedQty: '4', sourceVersion: 1, postingBatchId: fdBatch._id,
  });
  const retryOd = doc('OD-RETRY', 'OUTBOUND_DELIVERY', sales, {
    warehouseId: wh('WH01'), issueRequestId: failed.wir._id, plannedOn: at(20),
  }, 'OPEN', 16);
  const retryOdLine = line('od:retry', retryOd, '4', 'OUTBOUND_DELIVERY', { issueRequestLineId: failed.wirLine._id });
  link(failed.wirLine, retryOdLine, 'REOPENED_COMMITMENT');
  const transferOperation = operation('od:transfer', retryOd, sales, 'TRANSFER_COMMITMENT');
  add('OdCommitmentTransfer', 'fd', {
    reopeningReceiptLineId: grFdLine._id, fromOdLineId: failed.odLine._id, toOdLineId: retryOdLine._id,
    qtyBase: '4', sourceVersion: 2, targetVersion: 1, operationId: transferOperation._id,
  });

  // Ordinary CR is inspected by Warehouse and accepted by Sales (C2).
  const cr = doc('CR', 'CUSTOMER_RETURN', sales, { warehouseId: wh('WH01'), customerId: customer._id }, 'APPROVED', 17);
  const crLine = line('cr', cr, '4', 'CUSTOMER_RETURN', { originalIssueLineId: delivered.giLine._id, reason: 'Trả viên chưa dùng (demo)' });
  link(podLine, crLine);
  const crOperation = operation('cr:claim', cr, sales, 'CLAIM_CR');
  add('ReturnSourceClaim', 'cr', {
    requestLineId: crLine._id, salesIssueLineId: delivered.giLine._id, claimKind: 'CR', qtyBase: '4', status: 'CONSUMED', operationId: crOperation._id,
  });
  add('ReturnSourceGuard', 'cr', { salesIssueLineId: delivered.giLine._id });
  const custody = doc('CUSTODY-IN', 'CUSTODY_RECEIPT', dispatcher, null, 'POSTED', 17);
  const custodyLine = line('custody:in', custody, '4');
  link(crLine, custodyLine);
  post('custody:in', custody, custodyLine, null, balance('WH01:CUSTODY', 'GOOD', customer));
  const crInspection = doc('INSPECTION-CR', 'INSPECTION', dispatcher, null, 'COMPLETED', 17);
  const crInspected = line('inspection:cr', crInspection, '4', 'INSPECTION', {
    inspectedSourceLineId: crLine._id, qualityCode: 'GOOD', ownershipDecision: 'ACCEPT',
    inspectedBy: dispatcher, inspectedAt: at(17), packagingCondition: 'SEALED',
  });
  link(custodyLine, crInspected);
  const crApproval = approve('cr', cr, sales, 'STANDARD_ACCEPTANCE', [crLine]);
  add('CustomerReturnAssessment', 'cr', {
    returnLineId: crLine._id, assessmentNo: 1, documentVersion: 1, packagingCondition: 'SEALED',
    installationStatus: 'UNUSED', damageCause: 'NONE', deadlineStatus: 'WITHIN',
    deadlineReference: 'Điều khoản trả hàng giả lập DEMO-CR-TERMS, xác minh ngày 17/10/2026',
    eligibilityStatus: 'CASE_REVIEW', assessmentReason: 'Viên nguyên, chưa dùng, dữ liệu tổng hợp',
    assessedBy: dispatcher, assessedAt: at(17), approvalId: crApproval._id,
  });
  const grCr = doc('GR-CR', 'GR_CUSTOMER_RETURN', dispatcher, { warehouseId: wh('WH01') }, 'POSTED', 18);
  const grCrLine = line('gr:cr', grCr, '4');
  link(crInspected, grCrLine);
  post('gr:cr', grCr, grCrLine, balance('WH01:CUSTODY', 'GOOD', customer), balance('WH01:RECEIVING'));
  const custodyOut = doc('CUSTODY-OUT', 'CUSTODY_RELEASE', dispatcher, null, 'POSTED', 18);
  const custodyOutLine = line('custody:out', custodyOut, '3');
  link(groups.get('DocumentLine').documents.find((item) => item._id.equals(id('DocumentLine:opening:custody'))), custodyOutLine);
  post('custody:out', custodyOut, custodyOutLine, balance('WH01:CUSTODY', 'PENDING', supplier), null);

  // BF-04: dispatch20, receive18; transit2 remains unresolved, TR stays PARTIAL.
  const tr = doc('TR', 'TRANSFER_REQUEST', dispatcher, {
    sourceWarehouseId: wh('WH01'), destinationWarehouseId: wh('WH02'), neededOn: at(19),
  }, 'PARTIAL', 19);
  const trLine = line('tr', tr, '20');
  approve('tr', tr, owner, 'TRANSFER_APPROVAL', [trLine]);
  const td = doc('TD', 'TRANSFER_DISPATCH', dispatcher, { requestId: tr._id, dispatchedBy: dispatcher, dispatchedAt: at(19) }, 'POSTED', 19);
  const tdLine = line('td', td, '20');
  link(trLine, tdLine);
  accounts.set('TRANSIT', add('StockAccount', 'transit', { transitDispatchLineId: tdLine._id }));
  link(tdLine, task('PICK-TD', '20', 'WH01:STORAGE', 'WH01:STAGING', dispatcher, 18));
  post('td', td, tdLine, balance('WH01:STAGING'), balance('TRANSIT'));
  const handover = doc('HANDOVER', 'HANDOVER', dispatcher, {
    relatedDocumentId: td._id, recipientName: 'Người nhận vận chuyển demo', carrierId: carrier._id,
    handedOverAt: at(19), confirmedBy: dispatcher,
  }, 'CONFIRMED', 19);
  link(tdLine, line('handover', handover, '20'));
  const mwtr = doc('MWTR', 'MWTR', receiver, { dispatchId: td._id, receivedBy: receiver, receivedAt: at(20) }, 'POSTED', 20);
  const mwtrLine = line('mwtr', mwtr, '18', 'TRANSFER_RECEIPT', { dispatchLineId: tdLine._id, qualityCode: 'GOOD' });
  link(tdLine, mwtrLine);
  post('mwtr', mwtr, mwtrLine, balance('TRANSIT'), balance('WH02:RECEIVING'), receiver);
  link(mwtrLine, task('PUTAWAY-TR', '18', 'WH02:RECEIVING', 'WH02:STORAGE', receiver, 21));
  const discrepancy = doc('DISCREPANCY', 'DISCREPANCY', receiver, null, 'OPEN', 20);
  link(tdLine, line('discrepancy', discrepancy, '2', 'DISCREPANCY', { sourceLineId: tdLine._id, discrepancyKind: 'SHORT', resolutionStatus: 'OPEN' }));

  // BF-02/BF-08: disposition is separate from Accountant's supplier agreement.
  const defect = doc('DEFECT', 'DEFECT_CASE', dispatcher, { discoveredAt: at(21), reason: 'Kiểm tra hàng hỏng demo' }, 'OPEN', 21);
  const defectLine = line('defect', defect, '8');
  evidence('defect', defect);
  const disposition = doc('DISPOSITION', 'DISPOSITION', dispatcher, null, 'APPROVED', 21);
  const dispositionLine = line('disposition', disposition, '2', 'DISPOSITION', {
    defectLineId: defectLine._id, outcome: 'SCRAP', approvalId: id('Approval:disposition'),
  });
  link(defectLine, dispositionLine);
  approve('disposition', disposition, owner, 'DEFECT_DISPOSITION', [dispositionLine]);
  const scrap = doc('SCRAP', 'SCRAP', dispatcher, null, 'POSTED', 21);
  const scrapLine = line('scrap', scrap, '2');
  link(dispositionLine, scrapLine);
  const scrapBatch = post('scrap', scrap, scrapLine, balance('WH01:QUARANTINE', 'DAMAGED'), null);
  const reversal = doc('REVERSAL', 'REVERSAL', dispatcher, null, 'POSTED', 22);
  const reversalLine = line('reversal', reversal, '2');
  link(scrapLine, reversalLine, 'REVERSAL');
  post('reversal', reversal, reversalLine, null, balance('WH01:QUARANTINE', 'DAMAGED'), dispatcher, scrapBatch);
  const sr = doc('SR', 'SUPPLIER_RETURN', dispatcher, {
    warehouseId: wh('WH01'), supplierId: supplier._id, agreementReference: 'AGREEMENT-DEMO', agreedAt: at(22),
  }, 'COMPLETED', 22);
  const agreementEvidence = evidence('sr:agreement', sr, accountant);
  const srLine = line('sr', sr, '4', 'SUPPLIER_RETURN', {
    originLineId: defectLine._id, ownerPartyId: store._id, agreedQty: '4', agreementVersion: 1,
    agreementVerifiedBy: accountant, agreementVerifiedAt: at(22), agreementEvidenceId: agreementEvidence._id,
  });
  link(defectLine, srLine);
  const giSr = doc('GI-SR', 'GI_SUPPLIER_RETURN', dispatcher, { warehouseId: wh('WH01') }, 'POSTED', 23);
  const giSrLine = line('gi:sr', giSr, '4');
  link(srLine, giSrLine);
  post('gi:sr', giSr, giSrLine, balance('WH01:QUARANTINE', 'DAMAGED'), null);
  const ack = doc('SUPPLIER-ACK', 'SUPPLIER_ACK', accountant, null, 'CONFIRMED', 24);
  link(giSrLine, line('ack', ack, '4', 'SUPPLIER_ACK', { dispatchLineId: giSrLine._id, outcome: 'ACCEPTED', acknowledgedAt: at(24) }));
  const regrade = doc('DISPOSITION-REGRADE', 'DISPOSITION', dispatcher, null, 'APPROVED', 24);
  const regradeLine = line('disposition:regrade', regrade, '2', 'DISPOSITION', {
    defectLineId: defectLine._id, outcome: 'REGRADE', approvalId: id('Approval:regrade'),
  });
  link(defectLine, regradeLine);
  approve('regrade', regrade, owner, 'DEFECT_DISPOSITION', [regradeLine]);
  const reclass = doc('RECLASS', 'RECLASS', dispatcher, null, 'POSTED', 24);
  const reclassLine = line('reclass', reclass, '2');
  link(regradeLine, reclassLine);
  post('reclass', reclass, reclassLine, balance('WH01:QUARANTINE', 'DAMAGED'), balance('WH01:QUARANTINE', 'GOOD'));

  // BF-05/B1: keep the active freeze and hold; adjustment is only a proposal.
  const stocktake = doc('STOCKTAKE', 'STOCKTAKE', owner, {
    warehouseId: wh('WH03'), cutoffAt: at(25), scopeLocationIds: [locations.get('WH03:STORAGE')._id],
  }, 'RECONCILING', 25);
  const frozenBalance = balance('WH03:STORAGE', 'GOOD', store, 1);
  const snapshot = add('StocktakeSnapshot', 'stocktake', { stocktakeId: stocktake._id, balanceId: frozenBalance._id, bookQty: '60' });
  add('LocationLock', 'stocktake', { locationId: locations.get('WH03:STORAGE')._id, stocktakeId: stocktake._id, lockedAt: at(25) });
  const count = add('CountAttempt', 'stocktake:1', {
    snapshotId: snapshot._id, attemptNo: 1, countedQty: '58', countedBy: receiver, countedAt: at(25, 9),
  });
  const frozenDefect = doc('DEFECT-B1', 'DEFECT_CASE', receiver, { discoveredAt: at(25, 9), reason: 'Phát hiện lỗi trong kiểm kê demo' }, 'OPEN', 25);
  line('defect:b1', frozenDefect, '2', 'STANDARD', undefined, 1);
  const frozenEvidence = evidence('defect:b1', frozenDefect, receiver);
  add('DefectHold', 'b1', {
    defectDocumentId: frozenDefect._id, balanceId: frozenBalance._id, stocktakeId: stocktake._id,
    qtyBase: '2', evidenceId: frozenEvidence._id, recordedBy: receiver, recordedAt: at(25, 9), status: 'ACTIVE',
  });
  const resolution = doc('ST-RESOLUTION', 'ST_RESOLUTION', receiver, { stocktakeId: stocktake._id, planVersion: 1 }, 'DRAFT', 25);
  const resolutionLine = line('resolution', resolution, '2', 'ST_RESOLUTION', {
    countId: count._id, actionKind: 'DELTA', fromBalanceId: frozenBalance._id, deltaQty: '-2',
  }, 1);
  const adjustment = doc('ADJUSTMENT', 'ADJUSTMENT', receiver, null, 'DRAFT', 25);
  link(resolutionLine, line('adjustment', adjustment, '2', 'ADJUSTMENT', { countId: count._id, deltaQty: '-2' }, 1), 'PROPOSED_DELTA');
  add('DocumentLink', 'stocktake:resolution', { parentDocumentId: stocktake._id, childDocumentId: resolution._id, relationCode: 'RESOLUTION_PLAN' });

  // A separate closed count: exact counts, released lock, then user-selected RR.
  // Product 2 has a genuine zero count and no RR: the low-stock alert stays actionable.
  const closedStocktake = doc('STOCKTAKE-CLOSED', 'STOCKTAKE', owner, {
    warehouseId: wh('WH02'), cutoffAt: at(26), completedAt: at(26, 10),
    scopeLocationIds: [locations.get('WH02:STORAGE')._id],
  }, 'CLOSED', 26);
  closedStocktake.version = 2;
  // location_locks stores live locks only; this closed scope has none.
  for (const productIndex of [0, 1]) {
    const countedBalance = balance('WH02:STORAGE', 'GOOD', store, productIndex);
    const countedSnapshot = add('StocktakeSnapshot', `closed:${productIndex}`, {
      stocktakeId: closedStocktake._id, balanceId: countedBalance._id, bookQty: countedBalance.qtyBase,
    });
    add('CountAttempt', `closed:${productIndex}`, {
      snapshotId: countedSnapshot._id, attemptNo: 1, countedQty: countedBalance.qtyBase,
      countedBy: receiver, countedAt: at(26, 9),
    });
  }
  const countedAvailable = balance('WH02:STORAGE').qtyBase.toString();
  const stocktakeSuggested = exact('160').minus(countedAvailable).toFixed();
  const stocktakeRr = doc('RR-STOCKTAKE', 'REPLENISHMENT', receiver, {
    warehouseId: wh('WH02'), neededOn: at(29), creationKey: 'demo:rr:stocktake',
    triggerReason: 'Bổ sung dự trữ sau kiểm kê DEMO-STOCKTAKE-CLOSED theo gợi ý đã xác nhận.',
  }, 'DRAFT', 26);
  line('rr:stocktake', stocktakeRr, stocktakeSuggested, 'REPLENISHMENT', {
    triggerType: 'STOCKTAKE_LOW_STOCK', sourceStocktakeId: closedStocktake._id, sourceStocktakeVersion: 2,
    policyId: policies.get('1:WH02')._id, policyVersion: 1,
    evaluationKey: 'demo:closed-count:product1:v2', evaluatedAt: at(26, 11),
    availableQtySnapshot: countedAvailable, minimumQtySnapshot: '150', targetQtySnapshot: '160',
    incomingCoverageQtySnapshot: '0', pendingRequestCoverageQtySnapshot: '0', suggestedQty: stocktakeSuggested,
    reasonNote: `Đếm khớp ${countedAvailable} viên, dưới ngưỡng 150; mục tiêu 160, chưa có nguồn bổ sung.`,
  });
  operation('rr:stocktake:create', stocktakeRr, receiver, 'CREATE_REPLENISHMENT');
  add('DocumentLink', 'stocktake:rr', {
    parentDocumentId: closedStocktake._id, childDocumentId: stocktakeRr._id,
    relationCode: models.REPLENISHMENT_RELATIONS.STOCKTAKE,
  });

  // Saved SO without WIR: the user saved a prefilled form, adjusted quantity and added a separate reserve line.
  const shortage = saleChain('SHORTAGE', '240', 'OPEN');
  shortage.so.occurredAt = at(27);
  shortage.so.header.neededOn = at(29);
  const localAvailable = balance('WH01:STORAGE').qtyBase.toString();
  const salesSuggested = exact('240').minus(localAvailable).minus(countedAvailable).toFixed();
  const requestedSalesQty = exact(salesSuggested).minus('4').toFixed();
  const salesRr = doc('RR-SALES', 'REPLENISHMENT', sales, {
    warehouseId: wh('WH01'), neededOn: at(29), creationKey: 'demo:rr:sales',
    triggerReason: 'Bổ sung một phần thiếu cho DEMO-SO-SHORTAGE và thêm mẫu gạch khác để dự trữ.',
  }, 'DRAFT', 27);
  const salesRrLine = line('rr:sales', salesRr, requestedSalesQty, 'REPLENISHMENT', {
    triggerType: 'SALES_SHORTAGE', sourceSalesOrderLineId: shortage.soLine._id, sourceSalesOrderVersion: 1,
    evaluationKey: 'demo:so-shortage:v1', evaluatedAt: at(27, 9), remainingDemandQtySnapshot: '240',
    reservedForDemandQtySnapshot: '0', availableQtySnapshot: localAvailable, onHandCoverageQtySnapshot: localAvailable,
    otherWarehouseCoverageQtySnapshot: countedAvailable, incomingCoverageQtySnapshot: '0',
    pendingRequestCoverageQtySnapshot: '0', suggestedQty: salesSuggested,
    reasonNote: 'Cần 240 viên; xét kho chính và phương án lấy từ WH02 đúng tone/calibre, chỉ mua phần còn thiếu.',
    quantityAdjustmentReason: 'Đề nghị trước một phần; 4 viên còn lại chờ Sales xác nhận với khách (demo).',
  });
  line('rr:sales:extra', salesRr, '5', 'REPLENISHMENT', {
    triggerType: 'MANUAL_OTHER', reasonNote: 'Mua dự trữ mẫu gạch khác ngoài đơn bán, người dùng thêm trên cùng form.',
  }, 1);
  operation('rr:sales:create', salesRr, sales, 'CREATE_REPLENISHMENT');
  add('DocumentLink', 'so:rr', {
    parentDocumentId: shortage.so._id, childDocumentId: salesRr._id,
    relationCode: models.REPLENISHMENT_RELATIONS.SALES_ORDER,
  });
  add('LineLink', 'so:rr', {
    sourceLineId: shortage.soLine._id, targetLineId: salesRrLine._id,
    relationCode: models.REPLENISHMENT_RELATIONS.DEMAND, linkedQty: requestedSalesQty,
  });

  // A saved SO has no compatible source tone. The user chose Later: no RR/WIR is seeded.
  const noSupply = saleChain('NO-SUPPLY', '30', 'OPEN');
  noSupply.so.occurredAt = at(27);
  noSupply.so.header.neededOn = at(29);
  noSupply.soLine.details.requiredTone = 'T-NO-SUPPLY-DEMO';
  const noSupplyEventKey = 'demo:sales:no-supply:v1';
  add('Notification', 'sales:no-supply', {
    recipientId: sales, type: 'SALES_SHORTAGE', title: 'Đơn DEMO-SO-NO-SUPPLY chưa có nguồn phù hợp',
    message: 'Đơn đã lưu; chưa có nguồn đúng tone đáp ứng 30 viên trước ngày cần. Mở để kiểm tra và chọn Tạo yêu cầu hoặc Để sau.',
    warehouseId: wh('WH01'), sourceDocumentId: noSupply.so._id, sourceDocumentVersion: 1,
    eventKey: noSupplyEventKey, evaluatedAt: at(27, 9), readAt: null,
  });

  const stocktakeEventKey = 'demo:stocktake:closed:v2';
  for (const recipientId of [dispatcher, receiver]) {
    add('Notification', `stocktake:${recipientId}`, {
      recipientId, type: 'LOW_STOCK_AFTER_STOCKTAKE', title: 'Kho WH02 có 2 mặt hàng dưới ngưỡng sau kiểm kê',
      message: 'DEMO-STOCKTAKE-CLOSED: mặt hàng 1 có 118 viên dưới ngưỡng 150; mặt hàng 2 có 0 viên dưới ngưỡng 20. Mở để tính lại nguồn bổ sung.',
      warehouseId: wh('WH02'), sourceDocumentId: closedStocktake._id, sourceDocumentVersion: 2,
      eventKey: stocktakeEventKey, evaluatedAt: at(26, 11),
      readAt: String(recipientId) === String(receiver) ? at(26, 12) : null,
    });
  }
  add('Notification', 'sales:shortage', {
    recipientId: sales, type: 'SALES_SHORTAGE', title: 'Đơn DEMO-SO-SHORTAGE cần bổ sung hàng',
    message: `Sau khi xét kho chính và WH02, đơn còn thiếu ${salesSuggested} viên. Mở để tính lại trước khi tạo RR.`,
    warehouseId: wh('WH01'), sourceDocumentId: shortage.so._id, sourceDocumentVersion: 1,
    eventKey: 'demo:sales:shortage:v1', evaluatedAt: at(27, 9), readAt: null,
  });

  // Delivered outbox fixtures cannot trigger real notification jobs.
  for (const document of groups.get('BusinessDocument').documents) {
    add('AuditEvent', document.documentNo, {
      documentId: document._id, actorId: document.createdBy, action: 'DEMO_SEEDED',
      eventAt: document.occurredAt, details: 'Bản ghi mẫu tổng hợp, không phải thao tác thực tế.',
    });
    const isClosedCount = document._id.equals(closedStocktake._id);
    const isShortageSale = document._id.equals(shortage.so._id);
    const isNoSupplySale = document._id.equals(noSupply.so._id);
    add('OutboxEvent', document.documentNo, {
      documentId: document._id, documentVersion: document.version,
      eventType: isClosedCount ? 'STOCKTAKE_CLOSED' : (isShortageSale || isNoSupplySale) ? 'SALES_ORDER_SAVED' : 'DEMO_SEEDED',
      eventKey: isClosedCount ? stocktakeEventKey : isShortageSale ? 'demo:sales:shortage:v1' : isNoSupplySale ? noSupplyEventKey : `demo:${document.documentNo}`,
      deliveredAt: at(27, 10), attempts: 0,
    });
  }
  return [...groups.values()];
}
