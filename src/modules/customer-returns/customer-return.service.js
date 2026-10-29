import crypto from "node:crypto";
import mongoose from "mongoose";
import Decimal from "decimal.js";
import { ApiError } from "../../shared/utils/ApiError.js";
import { currentRole } from "../../shared/utils/userRole.js";
import { guardLocations } from '../return-workflows/workflow.shared.js';
import { effectiveStockLines } from '../sales-orders/sales-read.service.js';
import {
  Approval, AuditEvent, BusinessDocument, BusinessOperation, CustomerReturnAssessment,
  DocumentLine, DocumentLink, Evidence, LineLink, Location, Party, PostingBatch,
  Product, ReturnSourceClaim, ReturnSourceGuard, StockAccount, StockBalance, StockMovement, Warehouse,
  ExternalReference, ExternalReferenceLine, ProductUomVersion, Lot,
} from "../../models/index.js";

const DecimalExact = Decimal.clone({ precision: 80 });
const decimal128 = (value) => mongoose.Types.Decimal128.fromString(String(value));
const sameId = (left, right) => left != null && String(left) === String(right);
const idString = (value) => value == null ? null : String(value);

function toDto(value) {
  if (value == null) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toDto);
  if (typeof value === "object") {
    if (value._bsontype === "ObjectId") return value.toHexString();
    if (value._bsontype === "Decimal128") return value.toString();
    const plain = value.toObject ? value.toObject() : value;
    return Object.fromEntries(Object.entries(plain).map(([key, item]) => [key, toDto(item)]));
  }
  return value;
}

function returnScope(user) {
  const role = currentRole(user)?.code;
  if (role === "OWNER" || role === "ACCOUNTANT") return {};
  if (role === "WAREHOUSE") return { "header.warehouseId": { $in: user.warehouseIds || [] } };
  if (role === "SALES") return { createdBy: user._id };
  throw new ApiError(403, "You cannot access customer returns");
}

async function getScopedReturn(id, user, session) {
  const document = await BusinessDocument.findOne({
    _id: id,
    documentKind: "CUSTOMER_RETURN",
    ...returnScope(user),
  }).session(session);
  if (!document) throw new ApiError(404, "Customer return was not found");
  return document;
}

async function serializeReturn(document, session) {
  const lines = await DocumentLine.find({ documentId: document._id }).session(session).lean();
  const lineIds = lines.map((line) => line._id);
  const [claims, assessments, approvals, evidence, links] = await Promise.all([
    ReturnSourceClaim.find({ requestLineId: { $in: lineIds }, claimKind: "CR" }).session(session).lean(),
    CustomerReturnAssessment.find({ returnLineId: { $in: lineIds } }).sort({ assessmentNo: 1 }).session(session).lean(),
    Approval.find({ documentId: document._id }).sort({ decidedAt: 1 }).session(session).lean(),
    Evidence.find({ documentId: document._id }).session(session).lean(),
    DocumentLink.find({ parentDocumentId: document._id }).session(session).lean(),
  ]);
  const linkedDocuments = await Promise.all(links.map(async (link) => ({
    ...link,
    document: await BusinessDocument.findById(link.childDocumentId).session(session).lean(),
  })));
  return toDto({
    ...(document.toObject ? document.toObject() : document),
    lines,
    claims,
    assessments,
    approvals,
    evidence: evidence.map(({ _id, objectKey, mediaType, sha256, uploadedBy, uploadedAt }) => ({
      id: _id, objectKey, mediaType, sha256, uploadedBy, uploadedAt,
    })),
    linkedDocuments,
    history: await AuditEvent.find({ documentId: document._id }).sort({ eventAt: 1 }).session(session).lean(),
  });
}

export async function listCustomerReturns(user, filters) {
  const scope = returnScope(user);
  if (filters.warehouseId) {
    const role = currentRole(user)?.code;
    if (role === "WAREHOUSE" && !(user.warehouseIds || []).some((id) => sameId(id, filters.warehouseId))) {
      throw new ApiError(403, "Warehouse is outside your assigned scope");
    }
    scope["header.warehouseId"] = filters.warehouseId;
  }
  if (filters.status) scope.workflowStatus = filters.status;
  if (filters.search) {
    const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchingLines = await DocumentLine.find({ $or: [{ 'details.reason': { $regex: escaped, $options: 'i' } }, { productNameSnapshot: { $regex: escaped, $options: 'i' } }] }).distinct('documentId');
    const matchingSources = await BusinessDocument.find({ documentNo: { $regex: escaped, $options: 'i' } }).distinct('_id');
    const linkedReturns = await DocumentLink.find({ relationCode: 'RETURN_SOURCE', childDocumentId: { $in: matchingSources } }).distinct('parentDocumentId');
    const customers = await Party.find({ kind: 'CUSTOMER', name: { $regex: escaped, $options: 'i' } }).distinct('_id');
    scope.$or = [
      { documentNo: { $regex: escaped, $options: "i" } },
      { note: { $regex: escaped, $options: "i" } },
      { _id: { $in: [...matchingLines, ...linkedReturns] } },
      { 'header.customerId': { $in: customers } },
    ];
  }
  const [documents, total] = await Promise.all([
    BusinessDocument.find({ documentKind: "CUSTOMER_RETURN", ...scope })
      .sort({ createdAt: -1, _id: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(),
    BusinessDocument.countDocuments({ documentKind: "CUSTOMER_RETURN", ...scope }),
  ]);
  const items = await Promise.all(documents.map(async (document) => {
    const lines = await DocumentLine.find({ documentId: document._id }).lean();
    const claims = await ReturnSourceClaim.find({
      claimKind: "CR", requestLineId: { $in: lines.map((line) => line._id) },
    }).lean();
    const openClaimQty = claims.filter((claim) => claim.status === "OPEN")
      .reduce((totalQty, claim) => totalQty.plus(claim.qtyBase.toString()), new DecimalExact(0)).toString();
    return toDto({ ...document, lines, openClaimQty });
  }));
  return { items, total, page: filters.page, limit: filters.limit };
}

export async function getCustomerReturnById(id, user) {
  const session = await mongoose.startSession();
  try {
    return await serializeReturn(await getScopedReturn(id, user, session), session);
  } finally {
    await session.endSession();
  }
}

export async function getSourceContext(salesIssueLine, session) {
  if (salesIssueLine.lineKind !== "SALES_GOODS_ISSUE" || !salesIssueLine.details?.outboundDeliveryLineId) {
    throw new ApiError(409, "Customer return source must be a posted sales goods-issue line");
  }
  if (!salesIssueLine.productId || !salesIssueLine.lotId || !salesIssueLine.conversionId || !salesIssueLine.conversionSnapshot) {
    throw new ApiError(409, "Customer return requires the original product, lot and unit-conversion facts");
  }
  const issueDocument = await BusinessDocument.findOne({
    _id: salesIssueLine.documentId, documentKind: "GI_SALE", workflowStatus: "POSTED",
  }).session(session);
  const outboundLine = await DocumentLine.findById(salesIssueLine.details.outboundDeliveryLineId).session(session);
  const outboundDocument = outboundLine ? await BusinessDocument.findById(outboundLine.documentId).session(session) : null;
  const requestLine = outboundLine?.details?.issueRequestLineId
    ? await DocumentLine.findById(outboundLine.details.issueRequestLineId).session(session)
    : null;
  const requestDocument = requestLine ? await BusinessDocument.findById(requestLine.documentId).session(session) : null;
  const salesOrder = requestDocument?.header?.salesOrderId
    ? await BusinessDocument.findOne({ _id: requestDocument.header.salesOrderId, documentKind: "SALES_ORDER" }).session(session)
    : null;
  if (!issueDocument || !outboundDocument || !requestLine || !requestDocument || !salesOrder) {
    throw new ApiError(409, "Sales issue line has no complete source-order trace");
  }
  const podLines = await DocumentLine.find({
    lineKind: "DELIVERY_CONFIRMATION", "details.salesIssueLineId": salesIssueLine._id,
  }).session(session).lean();
  const podDocumentIds = [...new Set(podLines.map((line) => idString(line.documentId)))];
  const confirmedPods = await BusinessDocument.find({
    _id: { $in: podDocumentIds }, documentKind: "DELIVERY_CONFIRMATION", workflowStatus: "CONFIRMED",
  }).select("_id").session(session).lean();
  const confirmedIds = new Set(confirmedPods.map((document) => idString(document._id)));
  const validPhotos = await Evidence.find({ _id: { $in: podLines.map((line) => line.details?.photoEvidenceId).filter(Boolean) }, documentId: { $in: confirmedPods.map((doc) => doc._id) }, mediaType: /^image\// }).session(session).lean();
  const deliveredQty = podLines.filter((line) => confirmedIds.has(idString(line.documentId)) && validPhotos.some((photo) => sameId(photo._id, line.details.photoEvidenceId) && sameId(photo.documentId, line.documentId)))
    .reduce((sum, line) => sum.plus(line.qtyBase.toString()), new DecimalExact(0));
  const effective = await effectiveStockLines([salesIssueLine.toObject ? salesIssueLine.toObject() : salesIssueLine], [issueDocument.toObject()], session);
  const issuedQty = new DecimalExact(effective[0]?.qtyBase || '0');
  if (deliveredQty.gt(issuedQty)) throw new ApiError(409, "Verified delivery quantity exceeds the posted issue quantity");
  return { issueDocument, salesOrder, deliveredQty, issuedQty, outboundLine, outboundDocument, requestLine, requestDocument };
}

async function returnAllowance(issueLine, deliveredQty, session) {
  const claims = await ReturnSourceClaim.find({
    salesIssueLineId: issueLine._id, claimKind: "CR", status: { $in: ["OPEN", "CONSUMED"] },
  }).session(session).lean();
  const claimedQty = claims.reduce((sum, claim) => sum.plus((claim.status === 'CONSUMED' ? claim.consumedQty ?? claim.qtyBase : claim.qtyBase).toString()), new DecimalExact(0));
  return new DecimalExact(deliveredQty).minus(claimedQty);
}

export async function createCustomerReturn(user, input) {
  const payloadHash = crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const session = await mongoose.startSession();
  try {
    let returnId;
    await session.withTransaction(async () => {
      const repeated = await BusinessOperation.findOne({ idempotencyKey: input.idempotencyKey }).session(session);
      if (repeated) {
        if (repeated.payloadHash !== payloadHash || !sameId(repeated.performedBy, user._id)) {
          throw new ApiError(409, "Idempotency key was already used with a different request");
        }
        returnId = repeated.documentId;
        return;
      }
      const customer = await Party.findOne({ _id: input.customerId, kind: "CUSTOMER", isActive: true }).session(session);
      if (!customer) throw new ApiError(404, "Active customer was not found");
      const warehouse = await Warehouse.findOne({ _id: input.warehouseId, isActive: true }).session(session);
      if (!warehouse) throw new ApiError(404, "Active receiving warehouse was not found");
      const sourceRecords = [];
      for (const entry of input.lines) {
        if (entry.historicalExternalLineId) {
          const historical = await ExternalReferenceLine.findById(entry.historicalExternalLineId).session(session);
          const reference = historical && await ExternalReference.findOne({ _id: historical.referenceId, referenceKind: 'HISTORICAL_DELIVERY', status: 'VERIFIED', verifiedBy: { $ne: null }, verifiedAt: { $ne: null }, customerId: customer._id }).session(session);
          const original = historical?.sourceLineId && await DocumentLine.findById(historical.sourceLineId).session(session);
          const order = original && await BusinessDocument.findOne({ _id: original.documentId, documentKind: 'SALES_ORDER', createdBy: user._id, 'header.customerId': customer._id }).session(session);
          const conversion = historical?.conversionId && await ProductUomVersion.findOne({ _id: historical.conversionId, productId: historical.productId }).session(session);
          const lot = historical?.lotId && await Lot.findOne({ _id: historical.lotId, productId: historical.productId }).session(session);
          if (!reference || !order || !conversion || !lot) throw new ApiError(409, 'Historical source must have verified customer, lot and conversion evidence');
          const changed = await ExternalReferenceLine.updateOne({ _id: historical._id, claimVersion: historical.claimVersion }, { $inc: { claimVersion: 1 } }, { session });
          if (changed.modifiedCount !== 1) throw new ApiError(409, 'Historical return allowance changed');
          const claims = await ReturnSourceClaim.find({ historicalExternalLineId: historical._id, status: { $in: ['OPEN', 'CONSUMED'] } }).session(session);
          const used = claims.reduce((n, x) => n.plus((x.status === 'CONSUMED' ? x.consumedQty ?? x.qtyBase : x.qtyBase).toString()), new DecimalExact(historical.returnedQty?.toString() || '0'));
          if (used.plus(entry.qtyBase).gt(historical.eligibleQty.toString())) throw new ApiError(409, 'Return exceeds verified historical delivered quantity');
          sourceRecords.push({ ...entry, historical, sourceLine: { _id: original._id, productId: historical.productId, lotId: lot._id, conversionId: conversion._id, conversionSnapshot: conversion.basePerUnit }, context: { salesOrder: order, issueDocument: order } });
          continue;
        }
        const sourceLine = await DocumentLine.findById(entry.salesIssueLineId).session(session);
        if (!sourceLine) throw new ApiError(404, "Sales issue line was not found");
        const context = await getSourceContext(sourceLine, session);
        if (!sameId(context.salesOrder.createdBy, user._id)) throw new ApiError(403, "Sales order is outside your assigned source scope");
        if (!sameId(context.salesOrder.header.customerId, customer._id)) {
          throw new ApiError(409, "Return customer does not match the original sales order");
        }
        if (sourceRecords.length && !sameId(sourceRecords[0].context.salesOrder._id, context.salesOrder._id)) {
          throw new ApiError(409, "All return lines must belong to the same original sales order");
        }
        sourceRecords.push({ ...entry, sourceLine, context });
      }
      const sourceLineIds = sourceRecords.filter((record) => !record.historical).map((record) => idString(record.sourceLine._id)).sort();
      if (sourceRecords.some((record) => !sameId(record.context.salesOrder._id, sourceRecords[0].context.salesOrder._id))) throw new ApiError(409, 'All returned lines must belong to the same source order');
      for (const sourceLineId of sourceLineIds) {
        await ReturnSourceGuard.findOneAndUpdate({ salesIssueLineId: sourceLineId }, {
          $setOnInsert: { salesIssueLineId: sourceLineId }, $inc: { version: 1 },
        }, { upsert: true, new: true, setDefaultsOnInsert: true, session });
      }
      for (const record of sourceRecords) {
        if (record.historical) continue;
        const allowance = await returnAllowance(record.sourceLine, record.context.deliveredQty, session);
        if (new DecimalExact(record.qtyBase).gt(allowance)) {
          throw new ApiError(409, "Return quantity exceeds verified customer-delivered quantity remaining after existing claims");
        }
      }

      const id = new mongoose.Types.ObjectId();
      const documentNo = `CR-${id.toHexString().slice(-12).toUpperCase()}`;
      const [document] = await BusinessDocument.create([{
        _id: id, documentNo, documentKind: "CUSTOMER_RETURN", workflowStatus: "OPEN", version: 1,
        createdBy: user._id, occurredAt: new Date(),
        header: { warehouseId: input.warehouseId, customerId: customer._id, financialFollowupStatus: "NOT_RECORDED" },
      }], { session });
      const [operation] = await BusinessOperation.create([{
        documentId: document._id, operation: "CUSTOMER_RETURN_CREATE",
        operationKey: input.idempotencyKey.slice(0, 100), idempotencyKey: input.idempotencyKey,
        payloadHash, documentVersion: document.version, performedBy: user._id,
      }], { session });
      let lineNo = 0;
      for (const record of sourceRecords) {
        const source = record.sourceLine;
        const product = await Product.findById(source.productId).session(session);
        if (!product) throw new ApiError(409, "Return product is unavailable");
        const factor = new DecimalExact(source.conversionSnapshot.toString());
        const qty = new DecimalExact(record.qtyBase);
        const enteredQty = qty.div(factor).toDecimalPlaces(6);
        if (!enteredQty.mul(factor).toDecimalPlaces(6).eq(qty)) {
          throw new ApiError(400, "Return quantity cannot be represented using the original unit conversion");
        }
        const [line] = await DocumentLine.create([{
          documentId: document._id, lineNo: ++lineNo, lineKind: "CUSTOMER_RETURN",
          productId: source.productId, lotId: source.lotId,
          conversionId: source.conversionId, enteredQty: enteredQty.toString(),
          conversionSnapshot: factor.toString(), qtyBase: qty.toString(),
          productNameSnapshot: product.name,
          details: { ...(record.historical ? { historicalExternalLineId: record.historical._id } : { originalIssueLineId: source._id }), reason: record.reason },
        }], { session });
        await ReturnSourceClaim.create([{
          requestLineId: line._id, ...(record.historical ? { historicalExternalLineId: record.historical._id } : { salesIssueLineId: source._id }), claimKind: "CR",
          qtyBase: qty.toString(), status: "OPEN", operationId: operation._id,
        }], { session });
        await LineLink.create([{
          sourceLineId: source._id, targetLineId: line._id,
          relationCode: "CR_FROM_GI", linkedQty: qty.toString(),
        }], { session });
        await DocumentLink.updateOne({
          parentDocumentId: document._id, childDocumentId: record.context.issueDocument._id,
          relationCode: "RETURN_SOURCE",
        }, { $setOnInsert: {
          parentDocumentId: document._id, childDocumentId: record.context.issueDocument._id,
          relationCode: "RETURN_SOURCE",
        } }, { upsert: true, session });
      }
      await AuditEvent.create([{
        documentId: document._id, actorId: user._id, action: "CUSTOMER_RETURN_CREATED",
        details: JSON.stringify({ operationId: operation._id, customerId: customer._id, lineCount: sourceRecords.length }),
      }], { session });
      returnId = document._id;
    });
    return getCustomerReturnById(returnId, user);
  } catch (error) {
    if (error?.code === 11000) throw new ApiError(409, "A concurrent return claim or duplicate request was detected; refresh and retry");
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function addCustomerReturnEvidence(user, id, uploadedFile) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const document = await getScopedReturn(id, user, session);
      if (!["OPEN", "INSPECTED"].includes(document.workflowStatus)) throw new ApiError(409, "Evidence cannot be added after a return decision");
      const [evidence] = await Evidence.create([{
        documentId: document._id, objectKey: uploadedFile.publicId,
        sha256: uploadedFile.sha256, mediaType: uploadedFile.mediaType,
        uploadedBy: user._id,
      }], { session });
      const updated = await BusinessDocument.updateOne({ _id: document._id, version: document.version }, {
        $inc: { version: 1 },
      }, { session });
      if (updated.modifiedCount !== 1) throw new ApiError(409, "Customer return changed while evidence was being added");
      await AuditEvent.create([{
        documentId: document._id, actorId: user._id, action: "CUSTOMER_RETURN_EVIDENCE_ADDED",
        details: JSON.stringify({ evidenceId: evidence._id }),
      }], { session });
    });
    return getCustomerReturnById(id, user);
  } finally {
    await session.endSession();
  }
}

function eligibilityFor(input) {
  const excluded = input.installationStatus === "INSTALLED" || input.damageCause === "CUSTOMER"
    || input.deadlineStatus === "EXCEEDED";
  if (excluded) return "INELIGIBLE";
  const unknown = [input.packagingCondition, input.installationStatus, input.damageCause, input.deadlineStatus].includes("UNKNOWN");
  if (unknown) return "PENDING";
  if (input.installationStatus === "UNUSED" && ["NONE", "SUPPLIER", "OTHER"].includes(input.damageCause)
    && ["WITHIN", "NOT_APPLICABLE"].includes(input.deadlineStatus)) return "CASE_REVIEW";
  return "PENDING";
}

function makeDocumentNo(prefix, id) {
  return `${prefix}-${id.toHexString().slice(-12).toUpperCase()}`;
}

export async function inspectCustomerReturn(user, id, input) {
  const payloadHash = crypto.createHash("sha256").update(JSON.stringify({ id, ...input })).digest("hex");
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const repeated = await BusinessOperation.findOne({ idempotencyKey: input.idempotencyKey }).session(session);
      if (repeated) {
        if (repeated.payloadHash !== payloadHash || !sameId(repeated.performedBy, user._id)) {
          throw new ApiError(409, "Idempotency key was already used with a different request");
        }
        const [inspection, custody] = await Promise.all([
          DocumentLink.findOne({ parentDocumentId: id, relationCode: "RETURN_INSPECTION" }).session(session),
          DocumentLink.findOne({ parentDocumentId: id, relationCode: "RETURN_CUSTODY_RECEIPT" }).session(session),
        ]);
        result = { inspectionId: idString(inspection?.childDocumentId), custodyReceiptId: idString(custody?.childDocumentId), repeated: true };
        return;
      }
      const document = await getScopedReturn(id, user, session);
      if (currentRole(user)?.code !== "WAREHOUSE") throw new ApiError(403, "Only Warehouse can inspect customer returns");
      if (!(user.warehouseIds || []).some((warehouseId) => sameId(warehouseId, document.header.warehouseId))) {
        throw new ApiError(403, "Customer return is outside your assigned warehouse scope");
      }
      if (document.version !== input.expectedVersion || document.workflowStatus !== "OPEN") {
        throw new ApiError(409, "Customer return version or status has changed");
      }
      const lines = await DocumentLine.find({ documentId: document._id, lineKind: "CUSTOMER_RETURN" }).session(session);
      const assessmentsById = new Map(input.lines.map((item) => [idString(item.returnLineId), item]));
      if (lines.length !== input.lines.length || lines.some((line) => !assessmentsById.has(idString(line._id)))) {
        throw new ApiError(400, "Inspection must record conditions and received quantity for every return line");
      }
      const location = await Location.findOne({
        _id: input.custodyLocationId, warehouseId: document.header.warehouseId,
        kind: "CUSTODY", isActive: true,
      }).session(session);
      if (!location) throw new ApiError(400, "An active customer-custody location in this warehouse is required");
      await guardLocations([location._id], session);
      const evidence = await Evidence.find({ _id: { $in: input.evidenceIds }, documentId: document._id }).session(session);
      if (evidence.length !== input.evidenceIds.length) throw new ApiError(400, "Every inspection evidence item must belong to this return");
      const updated = await BusinessDocument.updateOne({ _id: document._id, version: input.expectedVersion, workflowStatus: "OPEN" }, {
        $set: { workflowStatus: "INSPECTED" }, $inc: { version: 1 },
      }, { session });
      if (updated.modifiedCount !== 1) throw new ApiError(409, "Customer return changed during inspection");

      const inspectionId = new mongoose.Types.ObjectId();
      const [inspection] = await BusinessDocument.create([{
        _id: inspectionId, documentNo: makeDocumentNo("CRI", inspectionId),
        documentKind: "INSPECTION", workflowStatus: "POSTED", version: 1,
        createdBy: user._id, occurredAt: new Date(), note: input.note,
      }], { session });
      const hasReceivedQty = input.lines.some((line) => new DecimalExact(line.qtyReceived).gt(0));
      let custody = null;
      if (hasReceivedQty) {
        const custodyId = new mongoose.Types.ObjectId();
        [custody] = await BusinessDocument.create([{
          _id: custodyId, documentNo: makeDocumentNo("CRC", custodyId),
          documentKind: "CUSTODY_RECEIPT", workflowStatus: "POSTED", version: 1,
          createdBy: user._id, occurredAt: new Date(), note: input.note,
        }], { session });
      }
      const operationId = new mongoose.Types.ObjectId();
      const [operation] = await BusinessOperation.create([{
        _id: operationId, documentId: document._id, operation: "CUSTOMER_RETURN_INSPECT",
        operationKey: input.idempotencyKey.slice(0, 100), idempotencyKey: input.idempotencyKey,
        payloadHash, documentVersion: input.expectedVersion + 1, performedBy: user._id,
      }], { session });
      let batch = null;
      if (hasReceivedQty) {
        [batch] = await PostingBatch.create([{
          documentId: custody._id, operation: "RETURN_CUSTODY_RECEIPT",
          operationKey: input.idempotencyKey.slice(0, 100), idempotencyKey: input.idempotencyKey,
          payloadHash, postedBy: user._id,
        }], { session });
      }
      for (const evidenceItem of evidence) {
        await Evidence.create([{
          documentId: inspection._id, objectKey: evidenceItem.objectKey,
          sha256: evidenceItem.sha256, mediaType: evidenceItem.mediaType, uploadedBy: user._id,
        }], { session });
      }
      let lineNo = 0;
      for (const returnLine of lines) {
        const facts = assessmentsById.get(idString(returnLine._id));
        if (facts.deadlineStatus !== "UNKNOWN" && !facts.deadlineReference) {
          throw new ApiError(400, "Known return deadlines require verified terms or supporting evidence");
        }
        const eligibilityStatus = eligibilityFor(facts);
        const priorAssessmentCount = await CustomerReturnAssessment.countDocuments({ returnLineId: returnLine._id }).session(session);
        await CustomerReturnAssessment.create([{
          returnLineId: returnLine._id, assessmentNo: priorAssessmentCount + 1,
          documentVersion: input.expectedVersion + 1,
          packagingCondition: facts.packagingCondition, installationStatus: facts.installationStatus,
          damageCause: facts.damageCause, deadlineStatus: facts.deadlineStatus,
          deadlineReference: facts.deadlineReference, eligibilityStatus,
          assessmentReason: facts.assessmentReason, assessedBy: user._id,
        }], { session });

        const qty = new DecimalExact(facts.qtyReceived);
        if (qty.gt(returnLine.qtyBase.toString())) throw new ApiError(409, "Received quantity exceeds the requested return quantity");
        const factor = new DecimalExact(returnLine.conversionSnapshot.toString());
        const enteredQty = qty.gt(0) ? qty.div(factor).toDecimalPlaces(6) : null;
        if (qty.gt(0) && !enteredQty.mul(factor).toDecimalPlaces(6).eq(qty)) {
          throw new ApiError(400, "Received quantity cannot be represented using the original unit conversion");
        }
        if (qty.gt(0)) {
          const product = await Product.findById(returnLine.productId).session(session);
          if (!product) throw new ApiError(409, "Return product is unavailable");
          const [inspectionLine] = await DocumentLine.create([{
            documentId: inspection._id, lineNo: ++lineNo, lineKind: "INSPECTION",
            productId: returnLine.productId, lotId: returnLine.lotId,
            conversionId: returnLine.conversionId, enteredQty: enteredQty.toString(),
            conversionSnapshot: factor.toString(), qtyBase: qty.toString(), productNameSnapshot: product.name,
            details: {
              inspectedSourceLineId: returnLine._id, qualityCode: "PENDING", ownershipDecision: "CUSTODY",
              inspectedBy: user._id, inspectedAt: new Date(), packagingCondition: facts.packagingCondition,
            },
          }], { session });
          const [custodyLine] = await DocumentLine.create([{
            documentId: custody._id, lineNo, lineKind: "STANDARD",
            productId: returnLine.productId, lotId: returnLine.lotId,
            conversionId: returnLine.conversionId, enteredQty: enteredQty.toString(),
            conversionSnapshot: factor.toString(), qtyBase: qty.toString(), productNameSnapshot: product.name,
          }], { session });
          await LineLink.create([
            { sourceLineId: returnLine._id, targetLineId: inspectionLine._id, relationCode: "CR_INSPECTION", linkedQty: qty.toString() },
            { sourceLineId: returnLine._id, targetLineId: custodyLine._id, relationCode: "CR_CUSTODY_RECEIPT", linkedQty: qty.toString() },
          ], { session, ordered: true });
          const account = await StockAccount.findOneAndUpdate({ locationId: location._id }, {
            $setOnInsert: { locationId: location._id },
          }, { upsert: true, new: true, setDefaultsOnInsert: true, session });
          const balance = await StockBalance.findOneAndUpdate({
            accountId: account._id, lotId: returnLine.lotId, qualityCode: "PENDING", ownerPartyId: document.header.customerId,
          }, { $setOnInsert: { qtyBase: decimal128("0"), version: 0 } }, {
            upsert: true, new: true, setDefaultsOnInsert: true, session,
          });
          const before = new DecimalExact(balance.qtyBase.toString());
          const after = before.plus(qty);
          const balanceUpdate = await StockBalance.updateOne({ _id: balance._id, version: balance.version }, {
            $inc: { qtyBase: decimal128(qty.toString()), version: 1 },
          }, { session });
          if (balanceUpdate.modifiedCount !== 1) throw new ApiError(409, "Customer custody stock changed during receipt");
          await StockMovement.create([{
            batchId: batch._id, documentId: custody._id, lineId: custodyLine._id,
            toBalanceId: balance._id, qtyBase: qty.toString(),
            toBefore: before.toString(), toAfter: after.toString(),
          }], { session });
        }
      }
      await DocumentLink.create([{
        parentDocumentId: document._id, childDocumentId: inspection._id, relationCode: "RETURN_INSPECTION",
      }], { session });
      if (custody) await DocumentLink.create([{
        parentDocumentId: document._id, childDocumentId: custody._id, relationCode: "RETURN_CUSTODY_RECEIPT",
      }], { session });
      await AuditEvent.create([{
        documentId: document._id, actorId: user._id, action: "CUSTOMER_RETURN_INSPECTED",
        details: JSON.stringify({ inspectionId: inspection._id, custodyReceiptId: custody?._id ?? null, operationId: operation._id }),
      }], { session });
      result = { inspectionId: idString(inspection._id), custodyReceiptId: hasReceivedQty ? idString(custody._id) : null, repeated: false };
    });
    return { ...result, customerReturn: await getCustomerReturnById(id, user) };
  } finally {
    await session.endSession();
  }
}

async function decideCustomerReturn(user, id, input, decisionKind) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const document = await getScopedReturn(id, user, session);
      if (document.version !== input.expectedVersion || document.workflowStatus !== "INSPECTED") {
        throw new ApiError(409, "Customer return version or inspection status has changed");
      }
      const lines = await DocumentLine.find({ documentId: document._id, lineKind: "CUSTOMER_RETURN" }).session(session);
      const lineIds = lines.map((line) => line._id);
      const assessments = await CustomerReturnAssessment.find({ returnLineId: { $in: lineIds } }).sort({ assessmentNo: -1 }).session(session);
      const latestByLine = new Map();
      for (const assessment of assessments) {
        if (!latestByLine.has(idString(assessment.returnLineId))) latestByLine.set(idString(assessment.returnLineId), assessment);
      }
      if (lines.some((line) => !latestByLine.has(idString(line._id)))) {
        throw new ApiError(409, "Warehouse inspection is required for every return line");
      }
      const receiptLinks = await LineLink.find({ sourceLineId: { $in: lineIds }, relationCode: "CR_CUSTODY_RECEIPT" }).session(session).lean();
      const receivedByLine = new Map();
      for (const link of receiptLinks) {
        const current = receivedByLine.get(idString(link.sourceLineId)) || new DecimalExact(0);
        receivedByLine.set(idString(link.sourceLineId), current.plus(link.linkedQty.toString()));
      }
      for (const line of lines) {
        const assessment = latestByLine.get(idString(line._id));
        if (input.decision === "APPROVE" && assessment.eligibilityStatus !== "CASE_REVIEW") {
          throw new ApiError(409, "Only fully assessed, eligible returns may be accepted");
        }
        if (input.decision === "APPROVE" && !(receivedByLine.get(idString(line._id)) || new DecimalExact(0)).gt(0)) {
          throw new ApiError(409, "Accepted returns must have a verified customer-custody receipt");
        }
      }
      if (decisionKind === "EXCEPTION_APPROVAL") {
        if (currentRole(user)?.code !== "OWNER") throw new ApiError(403, "Only the Store Owner may approve an eligible exception");
        if (sameId(document.createdBy, user._id)) throw new ApiError(403, "An exception approver cannot be the requester");
        if (lines.every((line) => latestByLine.get(idString(line._id)).damageCause === "NONE")) throw new ApiError(409, "Ordinary returns must be decided by Sales");
        if (lines.some((line) => latestByLine.get(idString(line._id)).eligibilityStatus !== "CASE_REVIEW")) {
          throw new ApiError(409, "Owner exception cannot override excluded or unresolved return conditions");
        }
      } else if (currentRole(user)?.code !== "SALES") {
        throw new ApiError(403, "Only Sales may decide an ordinary customer return");
      } else if (input.decision === "APPROVE" && lines.some((line) => latestByLine.get(idString(line._id)).damageCause !== "NONE")) {
        throw new ApiError(409, "Eligible non-ordinary return conditions require Owner exception approval");
      }

      const approvalLines = lines.map((line) => ({
        lineId: line._id,
        outcome: "RETURN_ACCEPTANCE",
        approvedQty: (receivedByLine.get(idString(line._id)) || new DecimalExact(0)).toString(),
      }));
      await Approval.create([{
        documentId: document._id, documentVersion: document.version,
        decisionKind, decision: input.decision,
        requestedBy: document.createdBy, decidedBy: user._id,
        reason: input.reason, lines: approvalLines,
      }], { session });
      if (input.decision === "REJECT") {
        const receivedTotal = [...receivedByLine.values()].reduce((sum, qty) => sum.plus(qty), new DecimalExact(0));
        if (receivedTotal.isZero()) {
          await ReturnSourceClaim.updateMany({ requestLineId: { $in: lineIds }, claimKind: "CR", status: "OPEN" }, {
            $set: { status: "RELEASED" },
          }, { session });
        }
      }
      const updated = await BusinessDocument.updateOne({ _id: document._id, version: input.expectedVersion, workflowStatus: "INSPECTED" }, {
        $set: { workflowStatus: input.decision === "APPROVE" ? "ACCEPTED" : "REJECTED" },
        $inc: { version: 1 },
      }, { session });
      if (updated.modifiedCount !== 1) throw new ApiError(409, "Customer return changed while the decision was being recorded");
      await AuditEvent.create([{
        documentId: document._id, actorId: user._id, action: `CUSTOMER_RETURN_${decisionKind}_${input.decision}`,
        details: JSON.stringify({ reason: input.reason, decisionKind }),
      }], { session });
    });
    return getCustomerReturnById(id, user);
  } finally {
    await session.endSession();
  }
}

export async function decideOrdinaryCustomerReturn(user, id, input) {
  return decideCustomerReturn(user, id, input, "STANDARD_ACCEPTANCE");
}

export async function approveCustomerReturnException(user, id, input) {
  return decideCustomerReturn(user, id, { ...input, decision: "APPROVE" }, "EXCEPTION_APPROVAL");
}
