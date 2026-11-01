import { idString, canReadRelated } from "./replenishment.access.js";

export const decimalString = (value) =>
  value == null ? null : value.toString();
export const isoDate = (value) =>
  value == null ? null : new Date(value).toISOString();
export const indexById = (items) =>
  new Map(items.map((item) => [idString(item._id), item]));

export function mapUser(value, users) {
  if (value == null) return null;
  const user = users.get(idString(value));
  return { id: idString(value), fullName: user?.fullName ?? null };
}

export function mapUom(value, uoms) {
  if (value == null) return null;
  const uom = uoms.get(idString(value));
  return {
    id: idString(value),
    code: uom?.code ?? null,
    name: uom?.name ?? null,
  };
}

export function mapHeader(document, masters) {
  const warehouse = masters.warehouses.get(
    idString(document.header.warehouseId),
  );
  return {
    id: idString(document._id),
    documentNo: document.documentNo,
    workflowStatus: document.workflowStatus,
    version: document.version,
    warehouse: {
      id: idString(document.header.warehouseId),
      code: warehouse?.code ?? null,
      name: warehouse?.name ?? null,
    },
    createdBy: mapUser(document.createdBy, masters.users),
    createdAt: isoDate(document.createdAt),
    neededOn: isoDate(document.header.neededOn),
  };
}

export function mapApproval(
  approval,
  documentVersion,
  users,
  includeLines = false,
) {
  if (!approval) return null;
  return {
    id: idString(approval._id),
    documentVersion: approval.documentVersion,
    isForCurrentVersion: approval.documentVersion === documentVersion,
    decisionKind: approval.decisionKind,
    decision: approval.decision,
    requestedBy: mapUser(approval.requestedBy, users),
    decidedBy: mapUser(approval.decidedBy, users),
    decidedAt: isoDate(approval.decidedAt),
    reason: approval.reason,
    ...(includeLines && {
      lines: (approval.lines || []).map((line) => ({
        lineId: idString(line.lineId),
        approvedQtyBase: decimalString(line.approvedQty),
        outcome: line.outcome,
      })),
    }),
  };
}

export function mapLine(line, masters) {
  const product = masters.products.get(idString(line.productId));
  const conversion = masters.conversions.get(idString(line.conversionId));
  return {
    id: idString(line._id),
    lineNo: line.lineNo,
    product: {
      id: idString(line.productId),
      sku: product?.sku ?? null,
      name: line.productNameSnapshot ?? product?.name ?? null,
      isActive: product?.isActive ?? null,
    },
    enteredQty: decimalString(line.enteredQty),
    enteredUom: mapUom(conversion?.uomId, masters.uoms),
    conversionId: idString(line.conversionId),
    conversionVersion: conversion?.version ?? null,
    conversionSnapshot: decimalString(line.conversionSnapshot),
    qtyBase: decimalString(line.qtyBase),
    baseUom: mapUom(product?.baseUomId, masters.uoms),
  };
}

const sourceIds = [
  "sourceSalesOrderLineId",
  "sourceIssueRequestLineId",
  "sourceStocktakeId",
  "policyId",
];
const sourceVersions = [
  "sourceSalesOrderVersion",
  "sourceIssueRequestVersion",
  "sourceStocktakeVersion",
  "policyVersion",
];
const snapshotFields = [
  "availableQty",
  "otherWarehouseCoverageQty",
  "remainingDemandQty",
  "reservedForDemandQty",
  "onHandCoverageQty",
  "incomingCoverageQty",
  "pendingRequestCoverageQty",
  "minimumQty",
  "targetQty",
];

export function mapSavedSource(details = {}) {
  return {
    triggerType: details.triggerType ?? null,
    ...Object.fromEntries(
      sourceIds.map((key) => [key, idString(details[key])]),
    ),
    ...Object.fromEntries(
      sourceVersions.map((key) => [key, details[key] ?? null]),
    ),
  };
}

export function mapEvaluationSnapshot(details = {}) {
  return {
    evaluationKey: details.evaluationKey ?? null,
    evaluatedAt: isoDate(details.evaluatedAt),
    suggestedQtyBase: decimalString(details.suggestedQty),
    ...Object.fromEntries(
      snapshotFields.map((key) => [
        `${key}Base`,
        decimalString(details[`${key}Snapshot`]),
      ]),
    ),
  };
}

export function mapRelatedReference(id, expectedKind, documents, user) {
  const document = documents.get(idString(id));
  const base = {
    id: idString(id),
    documentKind: expectedKind,
    access: "UNAVAILABLE",
  };
  if (
    !document ||
    (expectedKind && document.documentKind !== expectedKind) ||
    !canReadRelated(document, user)
  )
    return base;
  return {
    ...base,
    documentKind: document.documentKind,
    access: "READABLE",
    documentNo: document.documentNo,
    workflowStatus: document.workflowStatus,
    version: document.version,
  };
}
