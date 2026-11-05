import { isDeepStrictEqual } from 'node:util';
import { exact } from '../../models/model-utils.js';
import { documentCollections, collectionNames, splitSources, newCollections } from '../../models/rebuild/collections.js';
import { PERMISSION_CATALOGUE } from '../../seeds/data/permissions.data.js';

const roleNames = { OWNER: 'Store Owner', WAREHOUSE: 'Warehouse Staff', ACCOUNTANT: 'Accountant', SALES: 'Sales Staff', ADMIN: 'Administrator' };
const catalogue = new Map(PERMISSION_CATALOGUE.map(entry => [entry.code, entry]));
const permissionGroups = {
  'FE-01': ['replenishment_request', 'notification', 'purchase_order', 'goods_receipt_inspection', 'putaway_task'],
  'FE-02': ['product', 'product_lot', 'supplier', 'customer'],
  'FE-04': ['warehouse_location', 'inventory', 'stock_relocation'], 'FE-05': ['stock_transfer'],
  'FE-06': ['sales_order', 'issue_request', 'outbound_delivery', 'picking_task', 'goods_issue', 'fulfilment_option', 'delivery_confirmation', 'payment_confirmation'],
  'FE-07': ['defect', 'customer_return', 'supplier_return'], 'FE-08': ['stocktake', 'stock_adjustment'],
  'FE-09': ['report', 'stock_movement', 'external_reference', 'user', 'access_control'],
};
const features = new Map(Object.entries(permissionGroups).flatMap(([group,resources]) => resources.map(resource => [resource,group])));
const keys = rows => new Map(rows.map(row => [String(row._id), row]));
function lookup(map, id, label) {
  const value = map.get(String(id));
  if (!value) throw new Error('Missing ' + label + ' ' + String(id));
  return value;
}
const without = (row, names) => Object.fromEntries(Object.entries(row).filter(([key]) => !names.includes(key)));
const baseFields = row => without(row, ['kind','contactReference','isActive']);

export function transformSnapshot(source) {
  const target = Object.fromEntries(newCollections.map(name => [name, []]));
  const supported = new Set([...Object.keys(collectionNames), ...splitSources]);
  for (const name of Object.keys(source)) if (!supported.has(name)) throw new Error('Unmapped source collection: ' + name);
  const rows = name => source[name] || [];
  const docs = keys(rows('business_documents')), lines = keys(rows('document_lines'));
  const parties = keys(rows('parties')), units = keys(rows('uoms')), products = keys(rows('products'));
  const conversions = keys(rows('product_uom_versions'));
  const issues = [];
  const flag = (collection, row, field) => issues.push({ collection, id: String(row._id), field });
  function locationOf(documentId) {
    const doc = lookup(docs, documentId, 'document');
    if (doc.documentKind === 'HANDOVER') {
      const parent = lookup(docs, doc.header?.relatedDocumentId, 'handover parent');
      if (!['TRANSFER_DISPATCH','GI_SALE'].includes(parent.documentKind)) throw new Error('Unsupported parent for handover ' + doc._id);
      return { documentId: parent._id, subjectCollection: documentCollections[parent.documentKind], handoverId: doc._id };
    }
    const subjectCollection = documentCollections[doc.documentKind];
    if (!subjectCollection) throw new Error('Unknown document kind: ' + doc.documentKind);
    return { documentId: doc._id, subjectCollection };
  }
  function owner(ownerPartyId) {
    const party = lookup(parties, ownerPartyId, 'stock owner');
    if (!['STORE','SUPPLIER','CUSTOMER'].includes(party.kind)) throw new Error('Invalid stock owner ' + party._id);
    return { ownerType: party.kind, ownerId: party.kind === 'STORE' ? null : party._id };
  }
  const transformedDocs = new Map(), transformedItems = new Map();
  for (const row of docs.values()) {
    const value = { ...row, items: [] };
    transformedDocs.set(String(row._id), value);
    locationOf(row._id);
    if (row.documentKind !== 'HANDOVER') target[documentCollections[row.documentKind]].push(value);
  }
  for (const row of lines.values()) {
    const doc = lookup(transformedDocs, row.documentId, 'parent for item');
    const product = lookup(products, row.productId, 'item product');
    const conversion = lookup(conversions, row.conversionId, 'item conversion');
    if (String(product._id) !== String(conversion.productId)) throw new Error('Wrong product on conversion for item ' + row._id);
    const value = {
      ...without(row, ['documentId','conversionId','conversionSnapshot']),
      enteredUnit: lookup(units, conversion.uomId, 'entered unit').name,
      baseUnitSnapshot: lookup(units, product.baseUomId, 'base unit').name,
      baseUnitsPerUnit: row.conversionSnapshot,
    };
    if (value.details?.ownerPartyId) value.details = {
      ...without(value.details,['ownerPartyId']), ...owner(value.details.ownerPartyId),
    };
    if (!exact(value.enteredQty).mul(String(value.baseUnitsPerUnit)).eq(String(value.qtyBase))) throw new Error('Historical quantity mismatch on item ' + row._id);
    if (doc.documentKind === 'PO' && value.unitPurchasePrice == null) flag('purchase_orders', row, 'items.unitPurchasePrice');
    if (doc.documentKind === 'SALES_ORDER' && value.unitSellingPrice == null) flag('sales_orders', row, 'items.unitSellingPrice');
    doc.items.push(value);
    transformedItems.set(String(row._id), value);
  }
  for (const link of rows('document_links')) {
    const child = lookup(transformedDocs, link.childDocumentId, 'child document');
    const pointer = locationOf(link.parentDocumentId);
    (child.sources ??= []).push({ _id: link._id, ...pointer, relationCode: link.relationCode, createdAt: link.createdAt, updatedAt: link.updatedAt });
    if (child.documentKind === 'PO' && pointer.subjectCollection === 'replenishment_requests') {
      if (child.replenishmentRequestId && !child.replenishmentRequestId.equals(pointer.documentId)) throw new Error('PO links to several replenishment requests: ' + child._id);
      child.replenishmentRequestId = pointer.documentId;
    }
  }
  for (const link of rows('line_links')) {
    const child = lookup(transformedItems, link.targetLineId, 'child item');
    const sourceItem = lookup(lines, link.sourceLineId, 'source item');
    (child.sources ??= []).push({ _id: link._id, ...locationOf(sourceItem.documentId), itemId: sourceItem._id,
      linkedQty: link.linkedQty, relationCode: link.relationCode, createdAt: link.createdAt, updatedAt: link.updatedAt });
  }
  for (const doc of transformedDocs.values()) {
    doc.items.sort((a,b) => a.lineNo - b.lineNo);
    if (doc.documentKind === 'HANDOVER') {
      const parent = lookup(transformedDocs, doc.header.relatedDocumentId, 'handover parent');
      (parent.handovers ??= []).push(doc);
    }
  }
  for (const s of rows('replenishment_submissions')) {
    const rr = lookup(transformedDocs, s.documentId, 'submission parent');
    if (rr.documentKind !== 'REPLENISHMENT') throw new Error('Wrong parent for RR revision');
    (rr.submissions ??= []).push({ ...without(s,['documentId']), lines: s.lines.map(line => ({
      ...without(line,['baseUomId','enteredUomId','conversionId']),
      baseUnitSnapshot: lookup(units,line.baseUomId,'submission base unit').name,
      enteredUnit: lookup(units,line.enteredUomId,'submission entered unit').name,
      baseUnitsPerUnit: line.conversionSnapshot,
    })) });
  }
  for (const row of parties.values()) {
    if (row.kind === 'STORE') continue;
    if (row.kind === 'CUSTOMER') {
      const customer = { ...baseFields(row), version: row.version ?? 1 };
      if (!row.phone) flag('customers', row, 'phone');
      target.customers.push(customer);
    } else if (row.kind === 'SUPPLIER') {
      target.suppliers.push({ ...baseFields(row), version: row.version ?? 1, status: row.isActive ? 'ACTIVE' : 'INACTIVE' });
    } else if (row.kind === 'CARRIER') {
      // Legacy carriers could be third parties. Check the team before using it for a new dispatch.
      flag('delivery_teams', row, 'verifyInternalTeam');
      target.delivery_teams.push({ ...baseFields(row), isActive: row.isActive, version: row.version ?? 1 });
    } else throw new Error('Unmapped party kind: ' + row.kind);
    if (row.contactReference) flag({ CUSTOMER:'customers', SUPPLIER:'suppliers', CARRIER:'delivery_teams' }[row.kind], row, 'legacyContactReferenceRetainedInSource');
  }
  const sequence = new Map();
  const changes = {
    users: row => ({ ...row, version: row.version ?? 1 }),
    roles: row => ({ ...row, name: row.name ?? roleNames[row.code] ?? row.code, version: row.version ?? 1,
      isSystemRole: row.isSystemRole ?? Object.hasOwn(roleNames, row.code), isActive: row.isActive ?? true }),
    permissions: row => {
      const description = catalogue.get(row.code)?.description;
      const featureCode = row.featureCode ?? features.get(row.code.split(':')[0]);
      if (!featureCode) flag('permissions',row,'featureCode');
      return { ...row, name: row.name ?? description ?? row.code, description: row.description ?? description, featureCode, isActive: row.isActive ?? true };
    },
    warehouses: row => ({ ...row, version: row.version ?? 1 }),
    locations: row => {
      if (!row.usableLengthMm) flag('warehouse_locations',row,'usableDimensions');
      return { ...without(row,['kind','allocatable','planningVersion']), locationType: row.kind,
        isPickable: row.allocatable, operationVersion: row.planningVersion ?? 0, version: row.version ?? 1 };
    },
    products: row => {
      if (!row.manufacturerCode) flag('products',row,'manufacturerCode');
      return { ...without(row,['baseUomId']), baseUnit: lookup(units,row.baseUomId,'product base unit').name, version: row.version ?? 1 };
    },
    stock_accounts: row => {
      if (Boolean(row.locationId) === Boolean(row.transitDispatchLineId)) throw new Error('Invalid stock holding point ' + row._id);
      if (row.transitDispatchLineId) lookup(lines,row.transitDispatchLineId,'transit dispatch item');
      return { ...without(row,['transitDispatchLineId']), type: row.locationId ? 'LOCATION' : 'IN_TRANSIT',
        ...(row.transitDispatchLineId ? { dispatchLineId: row.transitDispatchLineId } : {}) };
    },
    stock_balances: row => ({ ...without(row,['accountId','lotId','qualityCode','ownerPartyId','qtyBase']),
      holdingPointId: row.accountId, batchId: row.lotId, qualityStatus: row.qualityCode, ...owner(row.ownerPartyId), quantityBase: row.qtyBase }),
    posting_batches: row => ({ ...without(row,['documentId','operationKey','idempotencyKey','payloadHash','postedBy','postedAt','reversalOf']),
      sourceType: locationOf(row.documentId).subjectCollection, sourceId: row.documentId, eventKey: row.operationKey,
      requestKey: row.idempotencyKey, requestHash: row.payloadHash, performedBy: row.postedBy, occurredAt: row.postedAt,
      recordedAt: row.createdAt ?? row.postedAt, ...(row.reversalOf ? { reversedTransactionId: row.reversalOf } : {}) }),
    stock_movements: row => {
      const transaction = lookup(transactions,row.batchId,'stock transaction');
      const line = lookup(lines,row.lineId,'movement source item');
      if (String(transaction.documentId) !== String(row.documentId) || String(line.documentId) !== String(row.documentId)) throw new Error('Inconsistent movement source ' + row._id);
      const number = (sequence.get(String(row.batchId)) || 0) + 1;
      sequence.set(String(row.batchId), number);
      return { ...without(row,['batchId','documentId','lineId','qtyBase']), transactionId: row.batchId,
        lineNo: number, sourceLineId: row.lineId, quantityBase: row.qtyBase };
    },
  };
  const transactions = keys(rows('posting_batches'));
  for (const [from,to] of Object.entries(collectionNames)) {
    target[to] = rows(from).map(row => changes[from] ? changes[from](row) : row);
  }
  const accounts = keys(target.stock_holding_points), batches = keys(target.product_batches);
  const balances = keys(target.inventory_balances);
  for (const old of rows('stock_balances')) {
    const current = lookup(balances,old._id,'migrated balance');
    lookup(accounts,current.holdingPointId,'balance holding point');
    lookup(batches,current.batchId,'balance lot');
    if (!isDeepStrictEqual(current.quantityBase,old.qtyBase)) throw new Error('Balance changed ' + old._id);
  }
  return { target, issues };
}
