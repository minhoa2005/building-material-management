import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { isDeepStrictEqual } from 'node:util';

const { EJSON } = mongoose.mongo.BSON;
export function fingerprint(snapshot) {
  const hash = createHash('sha256');
  for (const name of Object.keys(snapshot).sort()) {
    hash.update(name);
    const sorted = [...snapshot[name]].sort((a,b) => String(a._id).localeCompare(String(b._id)));
    for (const row of sorted) hash.update(EJSON.stringify(row, { relaxed: false }));
  }
  return hash.digest('hex');
}

export function verifyGraph(source, target) {
  const documents = new Map(), items = new Map(), links = new Set(), lineLinks = new Set();
  function remember(document) {
    if (documents.has(String(document._id))) throw new Error('Duplicate migrated document ID');
    documents.set(String(document._id), document);
    for (const link of document.sources || []) links.add(String(link._id));
    for (const item of document.items || []) {
      if (items.has(String(item._id))) throw new Error('Duplicate migrated item ID');
      items.set(String(item._id), item);
      for (const link of item.sources || []) lineLinks.add(String(link._id));
    }
    for (const handover of document.handovers || []) remember(handover);
  }
  for (const rows of Object.values(target)) for (const row of rows) if (row.documentKind) remember(row);
  for (const old of source.business_documents || []) {
    const current = documents.get(String(old._id));
    if (!current || current.documentNo !== old.documentNo || current.workflowStatus !== old.workflowStatus ||
        current.version !== old.version) throw new Error('Document identity/state changed: ' + old._id);
  }
  if (documents.size !== (source.business_documents || []).length) throw new Error('Document count mismatch');
  for (const old of source.document_lines || []) {
    const current = items.get(String(old._id));
    if (!current) throw new Error('Item lost: ' + old._id);
    for (const field of ['productId','lotId','enteredQty','qtyBase']) {
      if (!isDeepStrictEqual(current[field], old[field])) throw new Error('Item identity or quantity changed: ' + old._id);
    }
    if (!isDeepStrictEqual(current.baseUnitsPerUnit, old.conversionSnapshot)) throw new Error('Historical conversion changed: ' + old._id);
  }
  if (items.size !== (source.document_lines || []).length) throw new Error('Item count mismatch');
  for (const [rows, preserved, label] of [[source.document_links || [],links,'document'],[source.line_links || [],lineLinks,'item']]) {
    if (rows.length !== preserved.size || rows.some(row => !preserved.has(String(row._id)))) throw new Error('Lost ' + label + ' source links');
  }
  for (const row of items.values()) {
    for (const reference of row.sources || []) {
      if (!items.has(String(reference.itemId)) || !documents.has(String(reference.handoverId || reference.documentId))) throw new Error('Dangling item source');
    }
  }
  const balances = new Map(target.inventory_balances.map(row => [String(row._id), row]));
  if (balances.size !== (source.stock_balances || []).length) throw new Error('Stock balance count mismatch');
  for (const old of source.stock_balances || []) {
    const current = balances.get(String(old._id));
    if (!current || !isDeepStrictEqual(old.qtyBase,current.quantityBase) ||
        !isDeepStrictEqual(old.accountId,current.holdingPointId) || !isDeepStrictEqual(old.lotId,current.batchId) ||
        old.qualityCode !== current.qualityStatus) throw new Error('Stock identity or balance changed: ' + old._id);
  }
  for (const name of ['external_references','external_reference_lines']) {
    if (!isDeepStrictEqual(source[name] || [], target[name])) throw new Error('Unapproved external document changes');
  }
  return { documents: documents.size, items: items.size, documentLinks: links.size, itemLinks: lineLinks.size, balances: balances.size };
}

export async function validateTarget(target, models) {
  const errors = [];
  for (const name of models.keys()) {
    const Model = models.get(name);
    for (const row of target[name]) {
      try {
        const document = new Model(row);
        await document.validate();
        if (mongoose.mongo.BSON.calculateObjectSize(document.toObject()) > 16 * 1024 * 1024) throw new Error('Document exceeds MongoDB size limit');
      }
      catch (error) {
        errors.push({ collection: name, id: String(row._id), fields: error.errors ? Object.keys(error.errors) : [error.path ?? 'schema'], kind: error.name });
      }
    }
  }
  return errors;
}
