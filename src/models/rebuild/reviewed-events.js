import { Schema, appendOnly, code, date, embeddedOptions, integer, options, ref, refs, text } from '../model-utils.js';
import { sourceReference } from './reviewed-support.js';

const optional = length => text(length, { required: false });
const id = { type: Schema.Types.ObjectId, required: true };
const embedded = fields => new Schema(fields, embeddedOptions);
const subject = () => ({ subjectType: text(80), subjectId: id });
const origin = () => ({ sourceType: text(80), sourceId: id, sourceVersion: integer(1) });
export function reviewedEventSchemas() {
  const notifications = new Schema({
    recipientId: ref('User'), type: text(80), eventKey: text(160), dedupKey: text(400, { unique: true }),
    ...origin(), warehouseIds: refs('Warehouse'), title: text(200), message: text(2000), occurredAt: date(),
    readAt: date(false), archivedAt: date(false), conditionKey: optional(160), conditionState: optional(40), evaluatedAt: date(false),
    emailDelivery: embedded({ status: code(['PENDING','SENT','FAILED','SKIPPED']), attempts: integer(0),
      sentAt: date(false), lastError: optional(500) }),
  }, options('notifications'));
  notifications.index({ recipientId: 1, readAt: 1, createdAt: -1 });
  const audits = new Schema({
    eventKey: text(160, { unique: true }), correlationId: optional(160), actorType: code(['USER','SYSTEM']),
    actorId: ref('User', false), actorSnapshot: embedded({ username: text(100), roleCode: text(60) }),
    action: text(100), result: code(['SUCCESS','REJECTED','FAILED']), reason: optional(2000),
    ...subject(), warehouseIds: refs('Warehouse'), versionBefore: integer(0, { required: false }),
    versionAfter: integer(1, { required: false }),
    changes: [embedded({ field: text(150), before: Schema.Types.Mixed, after: Schema.Types.Mixed })],
    decisionId: ref('ApprovalHistory', false), transactionId: ref('StockTransaction', false), operationId: ref('OperationRecord', false),
    occurredAt: date(), recordedAt: date(),
  }, options('audit_logs'));
  audits.index({ subjectId: 1, occurredAt: 1 });
  appendOnly(audits);
  const events = new Schema({
    eventKey: text(160), handlerCode: text(80), eventType: text(80), ...origin(), correlationId: optional(160),
    payload: { type: Schema.Types.Mixed, required: true }, payloadVersion: integer(1),
    status: code(['PENDING','PROCESSING','COMPLETED','FAILED']), attempts: integer(0), nextAttemptAt: date(false),
    leaseOwner: optional(100), leaseToken: optional(100), leaseUntil: date(false),
    lastErrorCode: optional(100), lastErrorSummary: optional(1000), completedAt: date(false), occurredAt: date(),
  }, options('system_events'));
  events.index({ eventKey: 1, handlerCode: 1 }, { unique: true });
  events.index({ status: 1, nextAttemptAt: 1 });
  const operations = new Schema({
    actorType: code(['USER','SYSTEM']), actorId: ref('User', false), operationCode: text(100),
    requestKey: text(160), requestHash: text(64, { match: /^[a-f\d]{64}$/i }), operationKey: text(200),
    ...subject(), versionBefore: integer(0), versionAfter: integer(1),
    resultRefs: [sourceReference], resultCode: text(60), completedAt: date(),
    stockTransactionId: ref('StockTransaction', false), decisionId: ref('ApprovalHistory', false), correlationId: optional(160),
  }, options('operation_records'));
  operations.index({ actorType: 1, actorId: 1, operationCode: 1, requestKey: 1 }, { unique: true });
  operations.index({ operationKey: 1 }, { unique: true });
  appendOnly(operations);
  const replenishmentLocks = new Schema({
    warehouseId: ref('Warehouse'), productId: ref('Product'), version: integer(0, { default: 0 }),
    lastOperationId: ref('OperationRecord', false),
  }, options('replenishment_locks'));
  replenishmentLocks.index({ warehouseId: 1, productId: 1 }, { unique: true });
  const returnLocks = new Schema({
    sourceKey: text(200, { unique: true }), sourceKind: text(80), sourceDocumentId: id, sourceItemId: id,
    version: integer(0, { default: 0 }), lastOperationId: ref('OperationRecord', false),
  }, options('return_source_locks'));
  return { Notification: notifications, AuditLog: audits, SystemEvent: events, OperationRecord: operations,
    ReplenishmentLock: replenishmentLocks, ReturnSourceLock: returnLocks };
}
