import { Supplier, PurchaseOrder, PurchaseReceipt, SupplierReturn, AuditLog } from '../../models/runtime.js';
import { requirePermission, canAccessWarehouse, isOwner } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { escapeRegex } from '../../shared/utils/domain.js';
import { notFoundError } from '../../shared/utils/ApiError.js';
import { appendAudit, changedFields } from '../../shared/utils/audit.js';
import { dto, page, transaction, updateCatalogue } from '../../shared/utils/persistence.js';

const fields = ['name', 'contactName', 'phone', 'email', 'address', 'taxCode', 'notes'];
async function supplier(id, session) {
  const row = await Supplier.findById(id).session(session);
  if (!row) throw notFoundError('Không tìm thấy nhà cung cấp');
  return row;
}
export async function listSuppliers(user, query) {
  requirePermission(user, 'supplier:read');
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) { const search = new RegExp(escapeRegex(query.search), 'i'); filter.$or = [{ code: search }, { name: search }]; }
  return page(Supplier, filter, query);
}
export async function getSupplier(user, id) {
  requirePermission(user, 'supplier:read');
  return dto(await supplier(id));
}
export async function createSupplier(user, input) {
  requirePermission(user, 'supplier:create');
  return transaction(async session => {
    const row = await new Supplier({ ...input, status: 'ACTIVE' }).save({ session });
    await appendAudit({ actorId: user._id, action: 'CREATE_SUPPLIER', entityType: 'suppliers', entityId: row._id, session });
    return dto(row);
  });
}
export async function updateSupplier(user, id, input) {
  requirePermission(user, 'supplier:update');
  return transaction(async session => {
    const before = await supplier(id, session);
    const row = await updateCatalogue(Supplier, id, input.expectedUpdatedAt,
      Object.fromEntries(fields.map(field => [field, input[field] ?? null])), session);
    await appendAudit({ actorId: user._id, action: 'UPDATE_SUPPLIER', entityType: 'suppliers', entityId: row._id, changes: changedFields(before, row, fields), session });
    return dto(row);
  });
}
export async function changeSupplierStatus(user, id, input) {
  requirePermission(user, 'supplier:activate');
  return transaction(async session => {
    const row = await updateCatalogue(Supplier, id, input.expectedUpdatedAt, { status: input.status, statusReason: input.reason }, session);
    await appendAudit({ actorId: user._id, action: 'CHANGE_SUPPLIER_STATUS', entityType: 'suppliers', entityId: row._id, details: { reason: input.reason }, session });
    return dto(row);
  });
}
export async function getSupplierHistory(user, id, query) {
  requirePermission(user, 'supplier:read');
  await supplier(id);
  return page(AuditLog, { subjectType: 'suppliers', subjectId: id }, { ...query, sortBy: 'occurredAt' });
}
export async function getSupplierDocuments(user, id, query) {
  requirePermission(user, 'supplier:read');
  await supplier(id);
  const [Model, permission] = { PO: [PurchaseOrder, 'purchase_order:read'], GR_PURCHASE: [PurchaseReceipt, 'goods_receipt_inspection:read'], SUPPLIER_RETURN: [SupplierReturn, 'supplier_return:read'] }[query.kind];
  requirePermission(user, permission);
  const filter = { 'header.supplierId': id };
  if (!isOwner(user) && currentRole(user)?.code !== 'ACCOUNTANT') filter['header.warehouseId'] = { $in: user.warehouseIds || [] };
  // This endpoint exposes summaries only; purchase prices require their own permission.
  return page(Model, filter, query, '_id documentNo documentKind workflowStatus version header.warehouseId createdAt updatedAt');
}
export async function getSupplierNames(user) {
  requirePermission(user, 'supplier:read');
  return Supplier.find({ status: 'ACTIVE' }).select('_id name').lean();
}
