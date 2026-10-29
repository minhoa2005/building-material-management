import crypto from "node:crypto";
import mongoose from "mongoose";
import Decimal from "decimal.js";
import { ApiError } from "../../shared/utils/ApiError.js";
import { currentRole } from "../../shared/utils/userRole.js";
import { guardLocations } from '../return-workflows/workflow.shared.js';
import {
  Approval, AuditEvent, BusinessDocument, DefectHold, DocumentLine,
  DocumentLink, Evidence, Location, LocationLock, Lot, Product,
  Party, ProductUomVersion, PostingBatch, Reservation, StockAccount, StockBalance, StockMovement,
  StocktakeSnapshot,
} from "../../models/index.js";

const DecimalExact = Decimal.clone({ precision: 80 });
const decimal128 = (value) => mongoose.Types.Decimal128.fromString(String(value));
const sameId = (left, right) => left != null && String(left) === String(right);
const idString = (value) => value == null ? null : String(value);

function requireWarehouse(user, warehouseId) {
  if (currentRole(user)?.code === "OWNER") return;
  if (currentRole(user)?.code !== "WAREHOUSE" || !(user.warehouseIds || []).some((id) => sameId(id, warehouseId))) {
    throw new ApiError(403, "Warehouse is outside your assigned scope");
  }
}

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

function detailScope(user) {
  if (currentRole(user)?.code === "OWNER") return {};
  if (currentRole(user)?.code !== "WAREHOUSE") throw new ApiError(403, "You cannot access defect records");
  return { "header.warehouseId": { $in: user.warehouseIds } };
}

async function getDefect(id, user, session) {
  const defect = await BusinessDocument.findOne({
    _id: id,
    documentKind: "DEFECT_CASE",
    ...detailScope(user),
  }).session(session);
  if (!defect) throw new ApiError(404, "Defect case was not found");
  return defect;
}

async function serializeDefect(defect, session) {
  const [lines, holds, links] = await Promise.all([
    DocumentLine.find({ documentId: defect._id }).session(session).lean(),
    DefectHold.find({ defectDocumentId: defect._id }).session(session).lean(),
    DocumentLink.find({ parentDocumentId: defect._id, relationCode: "DEFECT_DISPOSITION" }).session(session).lean(),
  ]);
  const dispositions = await Promise.all(links.map(async (link) => {
    const [document, approval, lines] = await Promise.all([
      BusinessDocument.findById(link.childDocumentId).session(session).lean(),
      Approval.findOne({ documentId: link.childDocumentId, decisionKind: "DEFECT_DISPOSITION" }).session(session).lean(),
      DocumentLine.find({ documentId: link.childDocumentId }).session(session).lean(),
    ]);
    return { document, approval, lines };
  }));
  const balance = defect.header?.sourceBalanceId
    ? await StockBalance.findById(defect.header.sourceBalanceId).session(session).lean()
    : null;
  const account = balance ? await StockAccount.findById(balance.accountId).session(session).lean() : null;
  const location = account?.locationId ? await Location.findById(account.locationId).session(session).lean() : null;
  const evidence = await Evidence.find({ documentId: defect._id }).session(session).lean();
  return toDto({
    ...(defect.toObject ? defect.toObject() : defect),
    lines,
    holds,
    source: { balance, account, location },
    evidence: evidence.map(({ _id, objectKey, mediaType, sha256, uploadedBy, uploadedAt }) => ({
      id: idString(_id), objectKey, mediaType, sha256, uploadedBy: idString(uploadedBy), uploadedAt,
    })),
    dispositions,
    history: await AuditEvent.find({ documentId: defect._id }).sort({ eventAt: 1 }).session(session).lean(),
  });
}

export async function listDefects(user, filters) {
  const scope = detailScope(user);
  if (filters.warehouseId) {
    requireWarehouse(user, filters.warehouseId);
    scope["header.warehouseId"] = filters.warehouseId;
  }
  if (filters.status) scope.workflowStatus = filters.status;
  if (filters.sourceKind) scope['header.sourceKind'] = filters.sourceKind;
  const restrictions = [];
  if (filters.search) {
    const search = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lineIds = await DocumentLine.find({ productNameSnapshot: { $regex: search, $options: 'i' } }).distinct('documentId');
    scope.$or = [{ documentNo: { $regex: search, $options: 'i' } }, { 'header.reason': { $regex: search, $options: 'i' } }, { _id: { $in: lineIds } }];
  }
  if (filters.lotId || filters.locationId || filters.ownerPartyId) {
    const balanceQuery = {};
    if (filters.lotId) balanceQuery.lotId = filters.lotId;
    if (filters.ownerPartyId) balanceQuery.ownerPartyId = filters.ownerPartyId;
    if (filters.locationId) balanceQuery.accountId = { $in: await StockAccount.find({ locationId: filters.locationId }).distinct('_id') };
    restrictions.push({ 'header.sourceBalanceId': { $in: await StockBalance.find(balanceQuery).distinct('_id') } });
  }
  if (filters.hasEvidence) restrictions.push({ _id: { [filters.hasEvidence === 'yes' ? '$in' : '$nin']: await Evidence.distinct('documentId') } });
  if (filters.disposition) {
    const dispositions = await DocumentLine.find({ lineKind: 'DISPOSITION', 'details.outcome': filters.disposition }).distinct('documentId');
    restrictions.push({ _id: { $in: await DocumentLink.find({ relationCode: 'DEFECT_DISPOSITION', childDocumentId: { $in: dispositions } }).distinct('parentDocumentId') } });
  }
  if (filters.unresolvedOnly) restrictions.push({ _id: { [filters.unresolvedOnly === 'yes' ? '$in' : '$nin']: await DefectHold.find({ status: 'ACTIVE' }).distinct('defectDocumentId') } });
  if (restrictions.length) scope.$and = restrictions;
  const page = filters.page;
  const limit = filters.limit;
  const [documents, total] = await Promise.all([
    BusinessDocument.find({ documentKind: "DEFECT_CASE", ...scope })
      .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    BusinessDocument.countDocuments({ documentKind: "DEFECT_CASE", ...scope }),
  ]);
  const items = await Promise.all(documents.map(async (document) => {
    const [line, holds] = await Promise.all([
      DocumentLine.findOne({ documentId: document._id }).lean(),
      DefectHold.find({ defectDocumentId: document._id, status: "ACTIVE" }).lean(),
    ]);
    return toDto({ ...document, line, unresolvedQty: holds.reduce((sum, hold) => sum.plus(hold.qtyBase.toString()), new DecimalExact(0)).toString() });
  }));
  return { items, total, page, limit };
}

export async function getDefectById(id, user) {
  const session = await mongoose.startSession();
  try {
    const defect = await getDefect(id, user, session);
    return await serializeDefect(defect, session);
  } finally {
    await session.endSession();
  }
}

export async function createDefect(user, input, uploadedFile) {
  requireWarehouse(user, input.warehouseId);
  const session = await mongoose.startSession();
  try {
    let createdId;
    await session.withTransaction(async () => {
      const balance = await StockBalance.findById(input.balanceId).session(session);
      if (!balance || !sameId(balance.ownerPartyId, await findStorePartyId(session))) {
        throw new ApiError(404, "Owned stock balance was not found");
      }
      const account = await StockAccount.findById(balance.accountId).session(session);
      const location = account?.locationId ? await Location.findById(account.locationId).session(session) : null;
      if (!location || !location.isActive || !sameId(location.warehouseId, input.warehouseId)) {
        throw new ApiError(400, "The source balance is not in the selected warehouse");
      }
      const requestedQty = new DecimalExact(input.quantity);
      if (requestedQty.gt(balance.qtyBase.toString())) throw new ApiError(409, "Defect quantity exceeds the current balance");
      if (await Reservation.exists({ balanceId: balance._id, status: "ACTIVE" }).session(session)) {
        throw new ApiError(409, "Active reservations must be resolved before placing a defect hold on this balance");
      }

      let sourceLine = null;
      let sourceDocument = null;
      if (["MANUAL", "STOCKTAKE"].includes(input.sourceKind) && input.sourceLineId) {
        throw new ApiError(400, "Manual and stocktake defects do not use a source transaction line");
      }
      if (input.sourceLineId) {
        sourceLine = await DocumentLine.findById(input.sourceLineId).session(session);
        sourceDocument = sourceLine ? await BusinessDocument.findById(sourceLine.documentId).session(session) : null;
        if (!sourceLine || !sourceDocument || !sourceLine.lotId || !sameId(sourceLine.lotId, balance.lotId)) {
          throw new ApiError(409, "The source line does not match this stock lot");
        }
        const sourceKinds = {
          RECEIPT: ["GR_PURCHASE", "GR_CUSTOMER_RETURN", "GR_FAILED_DELIVERY"],
          ISSUE: ["GI_SALE"],
          TRANSFER: ["MWTR"],
          CUSTOMER_RETURN: ["GR_CUSTOMER_RETURN"],
        };
        if (sourceKinds[input.sourceKind] && !sourceKinds[input.sourceKind].includes(sourceDocument.documentKind)) {
          throw new ApiError(409, "Source line type does not match the selected source kind");
        }
        if (sourceKinds[input.sourceKind] && sourceDocument.workflowStatus !== "POSTED") {
          throw new ApiError(409, "Defects can only be recorded against a posted source document");
        }
        if (sourceDocument.header?.warehouseId) requireWarehouse(user, sourceDocument.header.warehouseId);
        if (sourceDocument.documentKind === 'MWTR') {
          const dispatch = await BusinessDocument.findById(sourceDocument.header.dispatchId).session(session);
          const request = dispatch && await BusinessDocument.findById(dispatch.header.requestId).session(session);
          if (!request || !sameId(request.header.destinationWarehouseId, input.warehouseId)) throw new ApiError(403, 'Transfer receipt is outside the selected destination warehouse');
        }
        if (requestedQty.gt(sourceLine.qtyBase.toString())) throw new ApiError(409, 'Defect quantity exceeds the selected source line');
      } else if (input.sourceKind !== "MANUAL" && input.sourceKind !== "STOCKTAKE") {
        throw new ApiError(400, "A source document line is required for this defect type");
      }
      if (input.sourceKind === "STOCKTAKE" && !input.stocktakeId) {
        throw new ApiError(400, "Stocktake defects must identify the active stocktake");
      }
      await Location.updateOne({ _id: location._id }, { $inc: { planningVersion: 1 } }, { session });
      const sourceGuard = await StockBalance.updateOne({ _id: balance._id, version: balance.version }, { $inc: { version: 1 } }, { session });
      if (sourceGuard.modifiedCount !== 1) throw new ApiError(409, 'Source stock changed while the hold was being recorded');
      const locationLock = await LocationLock.findOne({ locationId: location._id }).session(session);
      if (input.stocktakeId) {
        const stocktake = await BusinessDocument.findOne({ _id: input.stocktakeId, documentKind: "STOCKTAKE", workflowStatus: { $nin: ["CLOSED", "POSTED"] } }).session(session);
        const lock = await LocationLock.findOne({ locationId: location._id, stocktakeId: input.stocktakeId }).session(session);
        const snapshot = await StocktakeSnapshot.exists({ stocktakeId: input.stocktakeId, balanceId: balance._id }).session(session);
        if (!stocktake || !lock || !snapshot) throw new ApiError(409, "The specified active stocktake does not freeze and snapshot this balance");
        if (!sameId(input.sourceKind, "STOCKTAKE")) throw new ApiError(400, "A defect recorded under freeze must use the stocktake source type");
      } else if (locationLock) {
        throw new ApiError(409, "A frozen stocktake requires a balance-neutral stocktake defect record");
      }
      if (await DefectHold.exists({ balanceId: balance._id, status: "ACTIVE" }).session(session)) {
        throw new ApiError(409, "This balance already has an active defect hold");
      }
      const lot = await Lot.findById(balance.lotId).session(session);
      const product = lot ? await Product.findById(lot.productId).session(session) : null;
      if (!lot || !product) throw new ApiError(409, "The lot or product for this balance is unavailable");
      if (product.wholeBaseUnits && !requestedQty.isInteger()) throw new ApiError(400, 'This product requires whole base units');
      const conversion = await ProductUomVersion.findOne({ productId: product._id, uomId: product.baseUomId }).sort({ version: -1 }).session(session);
      if (!conversion) throw new ApiError(409, "A verified base-unit conversion is required for this product");
      const enteredQty = requestedQty.div(conversion.basePerUnit.toString()).toDecimalPlaces(6);
      if (!enteredQty.mul(conversion.basePerUnit.toString()).toDecimalPlaces(6).eq(requestedQty)) {
        throw new ApiError(400, "Defect quantity cannot be represented using the verified base-unit conversion");
      }

      const id = new mongoose.Types.ObjectId();
      const documentNo = `DEF-${id.toHexString().slice(-12).toUpperCase()}`;
      const [defect] = await BusinessDocument.create([{
        _id: id,
        documentNo,
        documentKind: "DEFECT_CASE",
        workflowStatus: "OPEN",
        version: 1,
        createdBy: user._id,
        occurredAt: new Date(),
        header: {
          discoveredAt: new Date(), reason: input.reason,
          sourceKind: input.sourceKind, sourceLineId: sourceLine?._id,
          warehouseId: input.warehouseId, sourceBalanceId: balance._id,
          stocktakeId: input.stocktakeId,
        },
      }], { session });
      const [defectLine] = await DocumentLine.create([{
        documentId: defect._id, lineNo: 1, lineKind: "STANDARD",
        productId: product._id, lotId: lot._id,
        conversionId: conversion._id, enteredQty: enteredQty.toString(),
        conversionSnapshot: conversion.basePerUnit.toString(), qtyBase: input.quantity,
        productNameSnapshot: product.name,
      }], { session });
      const [evidence] = await Evidence.create([{
        documentId: defect._id, objectKey: uploadedFile.publicId,
        sha256: uploadedFile.sha256, mediaType: uploadedFile.mediaType,
        uploadedBy: user._id,
      }], { session });
      await DefectHold.create([{
        defectDocumentId: defect._id, balanceId: balance._id,
        stocktakeId: input.stocktakeId, qtyBase: input.quantity,
        evidenceId: evidence._id, recordedBy: user._id, status: "ACTIVE",
      }], { session });
      if (!input.stocktakeId) {
        if (input.disposition.outcome === "RELEASE" && input.disposition.targetQuality !== "GOOD") {
          throw new ApiError(400, "Release disposition must target GOOD quality");
        }
        if (input.disposition.outcome === "REGRADE" && !input.disposition.targetQuality) {
          throw new ApiError(400, "Regrade disposition must specify its target quality");
        }
        if (input.disposition.outcome === "SCRAP" && input.disposition.targetQuality) {
          throw new ApiError(400, "Scrap disposition cannot specify a target quality");
        }
        const dispositionId = new mongoose.Types.ObjectId();
        const [disposition] = await BusinessDocument.create([{
          _id: dispositionId,
          documentNo: `DSP-${dispositionId.toHexString().slice(-12).toUpperCase()}`,
          documentKind: "DISPOSITION", workflowStatus: "SUBMITTED", version: 1,
          createdBy: user._id, occurredAt: new Date(), note: input.disposition.reason,
        }], { session });
        await DocumentLine.create([{
          documentId: disposition._id, lineNo: 1, lineKind: "DISPOSITION",
          productId: product._id, lotId: lot._id, conversionId: conversion._id,
          enteredQty: enteredQty.toString(), conversionSnapshot: conversion.basePerUnit.toString(),
          qtyBase: input.quantity, productNameSnapshot: product.name,
          details: {
            defectLineId: defectLine._id, outcome: input.disposition.outcome,
            targetQuality: input.disposition.targetQuality,
          },
        }], { session });
        await DocumentLink.create([{
          parentDocumentId: defect._id, childDocumentId: disposition._id,
          relationCode: "DEFECT_DISPOSITION",
        }], { session });
      }
      if (sourceDocument) await DocumentLink.create([{
        parentDocumentId: defect._id, childDocumentId: sourceDocument._id,
        relationCode: "DEFECT_SOURCE",
      }], { session });
      await AuditEvent.create([{
        documentId: defect._id, actorId: user._id, action: "DEFECT_INSPECTED_AND_HELD",
        details: JSON.stringify({ balanceId: balance._id, quantity: input.quantity, evidenceId: evidence._id, stocktakeId: input.stocktakeId ?? null }),
      }], { session });
      createdId = defect._id;
    });
    return getDefectById(createdId, user);
  } finally {
    await session.endSession();
  }
}

async function findStorePartyId(session) {
  const store = await Party.findOne({ kind: "STORE" }).select("_id").session(session);
  return store?._id;
}

export async function addDefectEvidence(user, id, uploadedFile) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const defect = await getDefect(id, user, session);
      requireWarehouse(user, defect.header.warehouseId);
      const [evidence] = await Evidence.create([{
        documentId: defect._id, objectKey: uploadedFile.publicId,
        sha256: uploadedFile.sha256, mediaType: uploadedFile.mediaType,
        uploadedBy: user._id,
      }], { session });
      const updated = await BusinessDocument.updateOne({ _id: defect._id, version: defect.version }, {
        $inc: { version: 1 },
      }, { session });
      if (updated.modifiedCount !== 1) throw new ApiError(409, "Defect case changed while evidence was being added");
      await AuditEvent.create([{
        documentId: defect._id, actorId: user._id, action: "DEFECT_EXECUTION_EVIDENCE_ADDED",
        details: JSON.stringify({ evidenceId: evidence._id }),
      }], { session });
    });
    return getDefectById(id, user);
  } finally {
    await session.endSession();
  }
}

export async function decideDefect(user, id, input) {
  if (currentRole(user)?.code !== "OWNER") throw new ApiError(403, "Only the Store Owner can decide this disposition");
  const session = await mongoose.startSession();
  try {
    let dispositionId;
    await session.withTransaction(async () => {
      const defect = await getDefect(id, user, session);
      if (defect.header.stocktakeId) throw new ApiError(409, "Stocktake defects must be resolved through the approved stocktake plan");
      const link = await DocumentLink.findOne({ parentDocumentId: defect._id, relationCode: "DEFECT_DISPOSITION" }).session(session);
      const disposition = link ? await BusinessDocument.findById(link.childDocumentId).session(session) : null;
      if (!disposition || disposition.workflowStatus !== "SUBMITTED" || disposition.version !== input.expectedVersion) {
        throw new ApiError(409, "Disposition version or status has changed");
      }
      if (sameId(disposition.createdBy, user._id)) throw new ApiError(403, "A requester cannot approve their own disposition");
      const line = await DocumentLine.findOne({ documentId: disposition._id }).session(session);
      const quantity = input.approvedQty ?? line.qtyBase.toString();
      if (!new DecimalExact(quantity).eq(line.qtyBase.toString())) throw new ApiError(400, "Revise the disposition quantity before submitting it for approval");
      const [approval] = await Approval.create([{
        documentId: disposition._id, documentVersion: disposition.version,
        decisionKind: "DEFECT_DISPOSITION", decision: input.decision,
        requestedBy: disposition.createdBy, decidedBy: user._id,
        reason: input.reason, lines: [{ lineId: line._id, approvedQty: quantity, outcome: line.details.outcome }],
      }], { session });
      const nextStatus = input.decision === "APPROVE" ? "APPROVED" : input.decision === "REJECT" ? "REJECTED" : "REVISION_REQUIRED";
      const updated = await BusinessDocument.updateOne({ _id: disposition._id, version: input.expectedVersion, workflowStatus: "SUBMITTED" }, {
        $set: { workflowStatus: nextStatus }, $inc: { version: 1 },
      }, { session });
      if (updated.modifiedCount !== 1) throw new ApiError(409, "Disposition changed while the decision was being recorded");
      await DocumentLine.updateOne({ _id: line._id, lineKind: 'DISPOSITION' }, { $set: { "details.approvalId": approval._id } }, { session });
      await AuditEvent.create([{
        documentId: defect._id, actorId: user._id, action: `DEFECT_DISPOSITION_${input.decision}`,
        details: JSON.stringify({ dispositionId: disposition._id, approvalId: approval._id, approvedQty: quantity, reason: input.reason }),
      }], { session });
      dispositionId = disposition._id;
    });
    return { dispositionId: idString(dispositionId), decision: input.decision };
  } finally {
    await session.endSession();
  }
}

export async function executeDefect(user, id, input) {
  requireWarehouse(user, (await getDefect(id, user)).header.warehouseId);
  const payloadHash = crypto.createHash("sha256").update(JSON.stringify({
    defectId: id, expectedVersion: input.expectedVersion, evidenceId: input.evidenceId, note: input.note,
  })).digest("hex");
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const retry = await PostingBatch.findOne({ idempotencyKey: input.idempotencyKey }).session(session);
      if (retry) {
        if (retry.payloadHash !== payloadHash) throw new ApiError(409, "Idempotency key was already used with a different request");
        result = { postingId: idString(retry._id), repeated: true };
        return;
      }
      const defect = await getDefect(id, user, session);
      if (defect.version !== input.expectedVersion) throw new ApiError(409, "Defect case version has changed");
      if (defect.header.stocktakeId) throw new ApiError(409, "Stocktake defects must be posted through the approved stocktake closure");
      const evidence = await Evidence.findOne({ _id: input.evidenceId, documentId: defect._id }).session(session);
      if (!evidence) throw new ApiError(400, "Execution evidence must belong to this defect case");
      const link = await DocumentLink.findOne({ parentDocumentId: defect._id, relationCode: "DEFECT_DISPOSITION" }).session(session);
      const disposition = link ? await BusinessDocument.findById(link.childDocumentId).session(session) : null;
      if (!disposition || disposition.workflowStatus !== "APPROVED") throw new ApiError(409, "An approved disposition is required");
      const approval = await Approval.findOne({ documentId: disposition._id, decisionKind: "DEFECT_DISPOSITION", decision: "APPROVE" }).session(session);
      const dispositionLines = await DocumentLine.find({ documentId: disposition._id }).session(session);
      if (!approval) throw new ApiError(409, "A current Owner decision is required");
      const balance = await StockBalance.findById(defect.header.sourceBalanceId).session(session);
      if (!balance) throw new ApiError(409, "Source balance no longer exists");
      const account = await StockAccount.findById(balance.accountId).session(session);
      const location = account?.locationId ? await Location.findById(account.locationId).session(session) : null;
      if (!location || await LocationLock.exists({ locationId: location._id }).session(session)) {
        throw new ApiError(409, "A frozen stocktake blocks ordinary defect disposition");
      }
      await guardLocations([location._id], session);
      const activeHold = await DefectHold.findOne({ defectDocumentId: defect._id, balanceId: balance._id, status: "ACTIVE" }).session(session);
      if (!activeHold) throw new ApiError(409, "The defect has no active hold");
      if (await Reservation.exists({ balanceId: balance._id, status: "ACTIVE" }).session(session)) throw new ApiError(409, "Resolve the supplier return reservation before ordinary defect execution");

      const lineLinks = [];
      for (const line of dispositionLines) {
        const approvedLine = approval.lines.find((entry) => sameId(entry.lineId, line._id));
        if (!approvedLine) continue;
        const alreadyPosted = await DocumentLink.aggregate([
          { $match: { relationCode: "POSTED_DISPOSITION", parentDocumentId: line._id } },
          { $lookup: { from: "business_documents", localField: "childDocumentId", foreignField: "_id", as: "document" } },
          { $unwind: "$document" },
          { $match: { "document.workflowStatus": "POSTED" } },
          { $lookup: { from: "document_lines", localField: "childDocumentId", foreignField: "documentId", as: "lines" } },
          { $unwind: "$lines" },
          { $group: { _id: null, qty: { $sum: { $toDecimal: "$lines.qtyBase" } } } },
        ]).session(session);
        const consumed = new DecimalExact(alreadyPosted[0]?.qty?.toString() ?? "0");
        const remaining = new DecimalExact(approvedLine.approvedQty.toString()).minus(consumed);
        if (remaining.lte(0)) continue;
        if (remaining.gt(balance.qtyBase.toString()) || remaining.gt(activeHold.qtyBase.toString())) {
          throw new ApiError(409, "Approved quantity exceeds the remaining held stock");
        }
        const fromBefore = new DecimalExact(balance.qtyBase.toString());
        let fromAfter = fromBefore.minus(remaining);
        const action = line.details.outcome;
        const unchanged = action === 'RELEASE' && balance.qualityCode === line.details.targetQuality;
        if (unchanged) fromAfter = fromBefore;
        let toBalance = null;
        let toBefore = null;
        let toAfter = null;
        if (["RELEASE", "REGRADE"].includes(action) && !unchanged) {
          const targetQuality = line.details.targetQuality;
          if (!targetQuality) throw new ApiError(409, "Approved disposition has no target quality");
          if (balance.qualityCode === targetQuality) throw new ApiError(409, "The source balance is already good quality");
          const criteria = {
            accountId: balance.accountId, lotId: balance.lotId,
            qualityCode: targetQuality, ownerPartyId: balance.ownerPartyId,
          };
          toBalance = await StockBalance.findOneAndUpdate(criteria, { $setOnInsert: { qtyBase: decimal128("0"), version: 0 } }, {
            upsert: true, new: true, setDefaultsOnInsert: true, session,
          });
          toBefore = new DecimalExact(toBalance.qtyBase.toString());
          toAfter = toBefore.plus(remaining);
        }
        const sourceUpdate = await StockBalance.updateOne({
          _id: balance._id, version: balance.version,
          qtyBase: { $gte: decimal128(remaining.toString()) },
        }, { $inc: { qtyBase: decimal128(unchanged ? '0' : remaining.negated().toString()), version: 1 } }, { session });
        if (sourceUpdate.modifiedCount !== 1) throw new ApiError(409, "Source stock changed while disposition was executing");
        if (toBalance) {
          const targetUpdate = await StockBalance.updateOne({ _id: toBalance._id, version: toBalance.version, qtyBase: toBalance.qtyBase }, {
            $inc: { qtyBase: decimal128(remaining.toString()), version: 1 },
          }, { session });
          if (targetUpdate.modifiedCount !== 1) throw new ApiError(409, "Target stock changed while disposition was executing");
        }
        lineLinks.push({ line, remaining, fromBefore, fromAfter, toBalance, toBefore, toAfter, unchanged });
        balance.qtyBase = decimal128(fromAfter.toString());
        balance.version += 1;
        if (toBalance) {
          toBalance.qtyBase = decimal128(toAfter.toString());
          toBalance.version += 1;
        }
      }
      if (lineLinks.length === 0) throw new ApiError(409, "No approved disposition quantity remains");
      const executionDocumentId = new mongoose.Types.ObjectId();
      const executionKind = dispositionLines[0].details.outcome === "SCRAP" ? "SCRAP" : "RECLASS";
      const [execution] = await BusinessDocument.create([{
        _id: executionDocumentId,
        documentNo: `DSX-${executionDocumentId.toHexString().slice(-12).toUpperCase()}`,
        documentKind: executionKind, workflowStatus: "POSTED", version: 1,
        createdBy: user._id, occurredAt: new Date(), note: input.note,
      }], { session });
      const [posting] = await PostingBatch.create([{
        documentId: execution._id, operation: "DEFECT_DISPOSITION",
        operationKey: input.idempotencyKey, idempotencyKey: input.idempotencyKey,
        payloadHash, postedBy: user._id,
      }], { session });
      let lineNo = 0;
      for (const item of lineLinks) {
        const defectLine = await DocumentLine.findOne({ documentId: defect._id }).session(session);
        const lot = await Lot.findById(balance.lotId).session(session);
        const product = await Product.findById(lot.productId).session(session);
        const conversionFactor = new DecimalExact(defectLine.conversionSnapshot.toString());
        const enteredQty = item.remaining.div(conversionFactor).toDecimalPlaces(6);
        if (!enteredQty.mul(conversionFactor).toDecimalPlaces(6).eq(item.remaining)) {
          throw new ApiError(409, "Execution quantity cannot be represented using the recorded conversion");
        }
        const [movementLine] = await DocumentLine.create([{
          documentId: execution._id, lineNo: ++lineNo, lineKind: "STANDARD",
          productId: product._id, lotId: balance.lotId, conversionId: defectLine.conversionId,
          enteredQty: enteredQty.toString(), conversionSnapshot: defectLine.conversionSnapshot.toString(),
          qtyBase: item.remaining.toString(), productNameSnapshot: product.name,
        }], { session });
        if (!item.unchanged) await StockMovement.create([{
          batchId: posting._id, documentId: execution._id, lineId: movementLine._id,
          fromBalanceId: balance._id, toBalanceId: item.toBalance?._id,
          qtyBase: item.remaining.toString(), fromBefore: item.fromBefore.toString(), fromAfter: item.fromAfter.toString(),
          toBefore: item.toBefore?.toString(), toAfter: item.toAfter?.toString(),
        }], { session });
        await DocumentLink.create([{
          parentDocumentId: item.line._id, childDocumentId: execution._id, relationCode: "POSTED_DISPOSITION",
        }], { session });
      }
      const totalExecuted = lineLinks.reduce((sum, item) => sum.plus(item.remaining), new DecimalExact(0));
      const heldRemaining = new DecimalExact(activeHold.qtyBase.toString()).minus(totalExecuted);
      if (heldRemaining.lte(0)) {
        await DefectHold.updateOne({ _id: activeHold._id, status: "ACTIVE" }, { $set: { status: "RESOLVED" } }, { session });
      } else {
        await DefectHold.updateOne({ _id: activeHold._id, status: "ACTIVE" }, { $set: { status: "RESOLVED" } }, { session });
        await DefectHold.create([{
          defectDocumentId: defect._id, balanceId: balance._id,
          qtyBase: heldRemaining.toString(), evidenceId: activeHold.evidenceId,
          recordedBy: user._id, status: "ACTIVE",
        }], { session });
      }
      await DocumentLink.create([{
        parentDocumentId: disposition._id, childDocumentId: execution._id, relationCode: "DEFECT_EXECUTION",
      }], { session });
      const remainingHold = await DefectHold.exists({ defectDocumentId: defect._id, status: "ACTIVE" }).session(session);
      const updated = await BusinessDocument.updateOne({ _id: defect._id, version: input.expectedVersion }, {
        $set: { workflowStatus: remainingHold ? "PARTIAL" : "CLOSED" }, $inc: { version: 1 },
      }, { session });
      if (updated.modifiedCount !== 1) throw new ApiError(409, "Defect case changed while disposition was executing");
      await BusinessDocument.updateOne({ _id: disposition._id, workflowStatus: "APPROVED" }, {
        $set: { workflowStatus: "POSTED" }, $inc: { version: 1 },
      }, { session });
      await AuditEvent.create([{
        documentId: defect._id, actorId: user._id, action: "DEFECT_DISPOSITION_EXECUTED",
        details: JSON.stringify({ postingId: posting._id, evidenceId: evidence._id, note: input.note, lineCount: lineLinks.length }),
      }], { session });
      result = { postingId: idString(posting._id), repeated: false };
    });
    return result;
  } finally {
    await session.endSession();
  }
}
