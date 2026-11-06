import { ReplenishmentRequest, Warehouse, Product, PurchaseOrder, ApprovalHistory } from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { requirePermission, requireWarehouseAccess, isOwner } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { validationError, forbiddenError, notFoundError } from '../../shared/utils/ApiError.js';
import { dto } from '../../shared/utils/persistence.js';
import { command, scopedDocument, checkVersion, saveVersion, newId, same, hash } from '../../shared/utils/document-command.js';
import { makeItem } from '../../shared/utils/document-items.js';

export async function readRequest(id, user, session) {
  const document = await scopedDocument(ReplenishmentRequest, id, user, session);
  const role = currentRole(user)?.code;
  if (['SALES','WAREHOUSE'].includes(role) && !same(document.createdBy, user._id)) throw notFoundError();
  return document;
}
const replay = (id, user, session) => readRequest(id, user, session);
async function header(input, user, session) {
  requireWarehouseAccess(user, input.warehouseId);
  const warehouse = await Warehouse.findOne({ _id: input.warehouseId, isActive: true }).session(session);
  if (!warehouse) throw validationError('Kho không hợp lệ');
  return { warehouseId: warehouse._id, neededOn: new Date(input.neededOn + 'T00:00:00+07:00'), triggerReason: input.triggerReason };
}
async function items(input, session, previous = []) {
  const result = [];
  const seen = new Set();
  for (const [index, line] of input.lines.entries()) {
    const old = line.id ? previous.find(item => same(item._id, line.id)) : null;
    if (line.id && (!old || seen.has(line.id))) throw validationError('Dòng hàng không thuộc yêu cầu hoặc bị trùng');
    if (line.id) seen.add(line.id);
    if (old?.details?.triggerType && old.details.triggerType !== 'MANUAL_OTHER') throw validationError('Không sửa dòng phát sinh từ nguồn bằng biểu mẫu thủ công');
    result.push({ ...await makeItem(line, index + 1, session, { previous: old, lineKind: 'REPLENISHMENT' }),
      details: { triggerType: 'MANUAL_OTHER', reasonNote: line.reasonNote } });
  }
  if (previous.some(item => item.details.triggerType !== 'MANUAL_OTHER' && !seen.has(String(item._id)))) throw validationError('Không xóa dòng phát sinh từ nguồn');
  return result;
}
async function submission(document, user, session) {
  const warehouse = await Warehouse.findById(document.header.warehouseId).session(session);
  const snapshots = [];
  for (const item of document.items) {
    const product = await Product.findById(item.productId).session(session);
    if (!product?.isActive) throw validationError('Sản phẩm đã ngừng sử dụng');
    snapshots.push({ lineId: item._id, lineNo: item.lineNo, productId: item.productId,
      productSkuSnapshot: product.sku, productNameSnapshot: item.productNameSnapshot,
      baseUomCodeSnapshot: item.baseUnitSnapshot, enteredUomCodeSnapshot: item.enteredUnit,
      conversionVersion: document.version, enteredQty: item.enteredQty, conversionSnapshot: item.baseUnitsPerUnit,
      qtyBase: item.qtyBase, triggerType: item.details.triggerType, reasonNote: item.details.reasonNote,
      baseUnitSnapshot: item.baseUnitSnapshot, enteredUnit: item.enteredUnit, baseUnitsPerUnit: item.baseUnitsPerUnit });
  }
  const now = new Date();
  document.header.submittedBy = user._id; document.header.submittedAt = now;
  document.submissions ??= [];
  document.submissions.push({ documentVersion: document.version, submittedBy: user._id, submittedAt: now,
    warehouseId: warehouse._id, warehouseCodeSnapshot: warehouse.code, warehouseNameSnapshot: warehouse.name,
    neededOn: document.header.neededOn, triggerReason: document.header.triggerReason, note: document.note, lines: snapshots });
  document.workflowStatus = 'SUBMITTED';
}
export async function getReplenishmentOptions(user, mode) {
  requirePermission(user, mode === 'CREATE' ? 'replenishment_request:create' : 'replenishment_request:read');
  const scope = isOwner(user) ? {} : { _id: { $in: user.warehouseIds || [] } };
  const [warehouses, products] = await Promise.all([
    Warehouse.find({ ...scope, isActive: true }).select('_id code name').lean(),
    Product.find({ isActive: true }).select('_id sku name baseUnit lengthMm widthMm').lean(),
  ]);
  return { warehouses: warehouses.map(dto), products: products.map(dto) };
}
export function createReplenishment(user, input) {
  return command(user, 'CREATE_REPLENISHMENT', 'replenishment_request:create', null, input, replay, async (session, actor) => {
    const document = new ReplenishmentRequest({ _id: newId(), documentNo: 'RR-' + newId(),
      workflowStatus: 'DRAFT', version: 1, createdBy: actor._id, note: input.note,
      header: { ...await header(input, actor, session), creationKey: input.creationKey },
      items: await items(input, session) });
    if (input.action === 'SUBMIT') await submission(document, actor, session);
    await document.save({ session });
    return { document };
  });
}
export function updateReplenishment(user, id, input) {
  return command(user, 'UPDATE_REPLENISHMENT', 'replenishment_request:update', id, input, replay, async (session, actor) => {
    const document = await readRequest(id, actor, session);
    checkVersion(document, input.expectedVersion);
    if (!same(document.createdBy, actor._id)) throw forbiddenError('Chỉ người lập được sửa');
    if (!['DRAFT','REVISION_REQUIRED'].includes(document.workflowStatus)) throw validationError('Yêu cầu không còn được sửa');
    if (await PurchaseOrder.exists({ replenishmentRequestId: id }).session(session)) throw validationError('Yêu cầu đã có đơn mua');
    document.items = await items(input, session, document.items);
    document.header.set(await header(input, actor, session)); document.note = input.note; document.updatedBy = actor._id;
    return { document: await saveVersion(document, input.expectedVersion, session), versionBefore: input.expectedVersion };
  });
}
export function submitReplenishment(user, id, input) {
  return command(user, 'SUBMIT_REPLENISHMENT', 'replenishment_request:update', id, input, replay, async (session, actor) => {
    const document = await readRequest(id, actor, session);
    checkVersion(document, input.expectedVersion);
    if (!same(document.createdBy, actor._id)) throw forbiddenError('Chỉ người lập được gửi');
    if (!['DRAFT','REVISION_REQUIRED'].includes(document.workflowStatus)) throw validationError('Yêu cầu không thể gửi ở trạng thái hiện tại');
    document.version = input.expectedVersion + 1;
    await submission(document, actor, session);
    return { document: await saveVersion(document, input.expectedVersion, session), versionBefore: input.expectedVersion };
  });
}
export function reviewReplenishment(user, id, input) {
  return command(user, 'REVIEW_REPLENISHMENT', 'replenishment_request:approve', id, input, replay, async (session, actor) => {
    const document = await readRequest(id, actor, session);
    checkVersion(document, input.expectedVersion);
    if (same(document.createdBy, actor._id)) throw forbiddenError('Người duyệt phải khác người lập');
    if (document.workflowStatus !== 'SUBMITTED') throw validationError('Chỉ duyệt yêu cầu đã gửi');
    if (!input.reason?.trim()) throw validationError('Cần ghi căn cứ quyết định');
    const seen = new Set();
    for (const decision of input.lines) {
      if (seen.has(decision.lineId) || !document.items.some(item => same(item._id, decision.lineId))) throw validationError('Dòng duyệt bị trùng hoặc sai nguồn');
      seen.add(decision.lineId);
    }
    if (input.decision === 'APPROVE' && seen.size !== document.items.length) throw validationError('Phải xét tất cả dòng hàng');
    const products = await Product.find({ _id: { $in: document.items.map(item => item.productId) } }).session(session);
    let positive = false;
    const itemDecisions = document.items.map(item => {
      const decision = input.lines.find(row => same(row.lineId, item._id));
      const quantity = input.decision === 'APPROVE' ? exact(decision.approvedQtyBase) : exact('0');
      const product = products.find(row => same(row._id, item.productId));
      if (!product || (product.wholeBaseUnits && !quantity.isInteger())) throw validationError('Lượng duyệt phải đúng đơn vị gốc của sản phẩm');
      if (quantity.gt(String(item.qtyBase))) throw validationError('Lượng duyệt vượt lượng đề nghị');
      if (quantity.gt(0)) positive = true;
      item.approvedQtyBase = quantity.toFixed();
      return { itemId: item._id, approvedQtyBase: quantity.toFixed(), outcome: input.decision, reason: decision?.reason || input.reason };
    });
    if (input.decision === 'APPROVE' && !positive) throw validationError('Duyệt cần có lượng lớn hơn 0');
    const approval = await new ApprovalHistory({ decisionKey: hash({ id, version: document.version, key: input.operationKey }),
      subjectType: 'replenishment_requests', subjectId: document._id, subjectRevision: document.version,
      decisionScope: 'REPLENISHMENT', reviewedContent: document.toObject(), decision: input.decision, reason: input.reason,
      itemDecisions, requestedBy: document.createdBy, decidedBy: actor._id, decidedAt: new Date(), recordedAt: new Date(),
      authoritySnapshot: { roleCode: currentRole(actor).code, permissionCode: 'replenishment_request:approve', warehouseIds: actor.warehouseIds } }).save({ session });
    document.header.latestDecisionId = approval._id;
    if (input.decision === 'APPROVE') document.header.approvedRevision = document.version;
    document.workflowStatus = { APPROVE: 'APPROVED', REJECT: 'REJECTED', REVISE: 'REVISION_REQUIRED' }[input.decision];
    return { document: await saveVersion(document, input.expectedVersion, session), versionBefore: input.expectedVersion, decisionId: approval._id };
  });
}

