import { randomUUID } from 'node:crypto';
import { AuditLog } from '../../models/runtime.js';
import { serialize } from './persistence.js';

export function changedFields(before, after, fields) {
  return fields.flatMap(field => {
    const left = serialize(before?.[field] ?? null), right = serialize(after?.[field] ?? null);
    return JSON.stringify(left) === JSON.stringify(right) ? [] : [{ field, before: left, after: right }];
  });
}

export async function appendAudit({ documentId, actorId, action, entityType, entityId,
  changes = [], details, eventAt = new Date(), session, warehouseIds = [],
  versionBefore, versionAfter, operationId, transactionId } = {}) {
  const subjectId = entityId ?? documentId;
  if (!subjectId) throw new Error('Audit requires a subject');
  const reason = typeof details === 'string' ? details : details?.reason;
  const event = new AuditLog({ eventKey: randomUUID(), actorType: actorId ? 'USER' : 'SYSTEM', actorId,
    action, result: 'SUCCESS', subjectType: entityType ?? 'document', subjectId,
    changes: changes.map(change => ({ field: change.field ?? change.path, before: change.before, after: change.after })),
    warehouseIds, reason, versionBefore, versionAfter, operationId, transactionId,
    occurredAt: eventAt, recordedAt: new Date() });
  return event.save({ session });
}
