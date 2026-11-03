import { AuditEvent } from "../../models/index.js";

const MAX_DETAILS = 4000;

export function changedFields(before, after, fields) {
  const changes = [];
  for (const field of fields) {
    const left = before?.[field] ?? null;
    const right = after?.[field] ?? null;
    const leftValue = left?.toString?.() ?? left;
    const rightValue = right?.toString?.() ?? right;
    if (JSON.stringify(leftValue) !== JSON.stringify(rightValue)) {
      changes.push({ path: field, before: leftValue, after: rightValue });
    }
  }
  return changes;
}

export async function appendAudit({
  documentId = null,
  actorId,
  action,
  entityType = null,
  entityId = null,
  changes = [],
  details = null,
  eventAt = new Date(),
  session = null,
} = {}) {
  if (Boolean(entityType) !== Boolean(entityId)) {
    throw new Error("Audit entityType and entityId must be supplied together");
  }
  const summary =
    details ??
    (changes.length
      ? { changedFields: changes.map((change) => change.path) }
      : { action });
  const serialized =
    typeof summary === "string" ? summary : JSON.stringify(summary);
  if (serialized.length > MAX_DETAILS) {
    throw new Error("Audit details exceed the 4000-character limit");
  }
  const event = new AuditEvent({
    ...(documentId && { documentId }),
    actorId,
    action,
    eventAt,
    details: serialized,
    ...(entityType && { entityType, entityId }),
    changes,
  });
  await event.save(session ? { session } : undefined);
  return event;
}