import { ReplenishmentRequest, PurchaseOrder, ApprovalHistory } from '../../models/runtime.js';
import { requirePermission } from '../../shared/utils/access.js';
import { dto, page, serialize } from '../../shared/utils/persistence.js';
import { notFoundError } from '../../shared/utils/ApiError.js';
import { escapeRegex } from '../../shared/utils/domain.js';
import { replenishmentScope } from './replenishment.access.js';
import { readRequest } from './replenishment.commands.js';
import { creationDateRange } from './replenishment.validation.js';

export async function listReplenishments(user, query) {
  requirePermission(user, 'replenishment_request:read');
  const filter = replenishmentScope(user);
  const and = [];
  if (query.warehouseId) and.push({ 'header.warehouseId': query.warehouseId });
  if (query.createdBy) and.push({ createdBy: query.createdBy });
  if (query.status) filter.workflowStatus = query.status;
  if (query.search) filter.documentNo = new RegExp(escapeRegex(query.search), 'i');
  const dateRange = creationDateRange(query); if (dateRange) filter.createdAt = dateRange;
  const hasPo = query.hasPurchaseOrder ?? query.poCreated;
  if (hasPo !== undefined) {
    const ids = await PurchaseOrder.find({}).distinct('replenishmentRequestId');
    filter._id = { [hasPo ? '$in' : '$nin']: ids };
  }
  if (query.approvalDecision) {
    const status = { APPROVE: 'APPROVED', REJECT: 'REJECTED', REVISE: 'REVISION_REQUIRED' }[query.approvalDecision];
    and.push(status ? { workflowStatus: status } : { 'header.latestDecisionId': { $exists: false } });
  }
  if (and.length) filter.$and = and;
  return page(ReplenishmentRequest, filter, query);
}
export async function getReplenishment(user, id) {
  requirePermission(user, 'replenishment_request:read');
  const document = await readRequest(id, user);
  const approvals = await ApprovalHistory.find({ subjectType: 'replenishment_requests', subjectId: id }).sort({ recordedAt: -1 }).lean();
  const purchaseOrders = await PurchaseOrder.find({ replenishmentRequestId: id }).select('_id documentNo workflowStatus').lean();
  return { ...dto(document), approvals: approvals.map(dto), purchaseOrders: purchaseOrders.map(dto) };
}
export async function listReplenishmentSubmissions(user, id, query) {
  requirePermission(user, 'replenishment_request:read');
  const document = await readRequest(id, user);
  const submissions = [...(document.submissions || [])].sort((a,b) => b.documentVersion - a.documentVersion);
  return { items: serialize(submissions.slice((query.page - 1) * query.limit, query.page * query.limit)), total: submissions.length, page: query.page, limit: query.limit };
}
export async function getReplenishmentSubmission(user, id, version) {
  requirePermission(user, 'replenishment_request:read');
  const document = await readRequest(id, user);
  const submission = document.submissions?.find(row => row.documentVersion === Number(version));
  if (!submission) throw notFoundError('Không tìm thấy lần gửi');
  return serialize(submission);
}


