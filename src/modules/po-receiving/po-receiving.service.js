import {
  PurchaseOrder,
  GoodsArrival,
  GoodsInspection,
  PurchaseReceipt,
  CustodyReceipt,
  WarehouseLocation,
  ProductBatch,
  Product,
  Uom,
  OperationRecord,
  TransferOrder,
} from "../../models/runtime.js";
import { exact } from "../../models/model-utils.js";
import { requirePermission } from "../../shared/utils/access.js";
import {
  validationError,
  forbiddenError,
} from "../../shared/utils/ApiError.js";
import {
  command,
  checkVersion,
  saveVersion,
  same,
  newId,
} from "../../shared/utils/document-command.js";
import { copyItem, sourceLink } from "../../shared/utils/document-copy.js";
import { findPurchase, replayPurchase, newDocument } from "./purchase-core.js";
import { purchaseOrderQuantities } from "../purchase-orders/purchase-order.service.js";
import {
  guardLocations,
  locationAt,
  beginStock,
  balanceAt,
  receiveStock,
  verifyCapacity,
} from "../../shared/utils/stock.js";
import { makeItem } from "../../shared/utils/document-items.js";
import { redactPrices } from "../sales-orders/sales-read.service.js";
import { dto, serialize } from "../../shared/utils/persistence.js";

import { postOwnedCustody } from "./purchase-custody.service.js";
export async function activePo(user, id, expectedVersion, session) {
  const po = await findPurchase(id, user, session, { kind: "PO" });
  checkVersion(po, expectedVersion);
  if (!["OPEN", "PARTIAL"].includes(po.workflowStatus))
    throw validationError("PO không còn mở để nhận hàng");
  return po;
}
export const commitments = purchaseOrderQuantities;
export async function inspectionSource(user, id, session) {
  const inspection = await findPurchase(id, user, session, {
    kind: "INSPECTION",
  });
  const arrival = await GoodsArrival.findById(
    inspection.header.arrivalId,
  ).session(session);
  if (!arrival) throw validationError("Thiếu hồ sơ hàng đến");
  return { inspection, arrival };
}
export async function prepare(po, input, actor, session, arrival, inspection) {
  const arrivalItems = [],
    inspectionItems = [],
    seen = new Set();
  for (const [i, row] of input.lines.entries()) {
    if (row.qualityCode !== 'GOOD' && row.ownershipDecision !== 'CUSTODY')
      throw validationError('Hàng chưa đạt phải tạm giữ chờ trả nhà cung cấp');
    const source = po.items.id(row.poLineId);
    if (!source) throw validationError("Dòng không thuộc PO");
    if (!row.lotId) throw validationError("Kiểm nhận cần lô thực nhận");
    const prior = row.id ? inspection.items.id(row.id) : null;
    if (row.id && (!prior || seen.has(row.id)))
      throw validationError("Dòng kiểm không tồn tại hoặc bị trùng");
    if (row.id) seen.add(row.id);
    const oldArrival =
      prior && arrival.items.id(prior.details.inspectedSourceLineId);
    if (oldArrival && !same(oldArrival.purchaseOrderItemId, source._id))
      throw validationError("Không đổi nguồn của dòng đã lưu");
    if (row.receivingLocationId) {
      if (row.ownershipDecision !== 'ACCEPT') throw validationError('Chỉ chọn bãi tiếp nhận cho hàng được nhận mua');
      await locationAt(row.receivingLocationId, po.header.warehouseId, ['RECEIVING'], session);
    }
    const item = await makeItem({
      productId: source.productId, lotId: row.lotId,
      // Staff count in the unit they physically handle (carton/base); default stays the PO unit.
      enteredUnit: row.enteredUnit ?? source.enteredUnit, enteredQty: row.enteredQty,
    }, i + 1, session, { previous: oldArrival, includeLotLabel: true, allowInactiveUom: true });
    const arrived = {
      ...item,
      productNameSnapshot: source.productNameSnapshot,
      purchaseOrderItemId: source._id,
      packagingCondition: row.packagingCondition,
      sources: [sourceLink(po, source, item.qtyBase)],
    };
    arrivalItems.push(arrived);
    inspectionItems.push(
      copyItem(arrived, item.qtyBase, {
        _id: prior?._id ?? newId(),
        lineNo: i + 1,
        lineKind: "INSPECTION",
        note: row.handlingNote,
        sources: [sourceLink(arrival, arrived, item.qtyBase)],
        details: {
          inspectedSourceLineId: arrived._id,
          receivingLocationId: row.receivingLocationId,
          qualityCode: row.qualityCode,
          ownershipDecision: row.ownershipDecision,
          inspectedBy: actor._id,
          inspectedAt: new Date(),
          packagingCondition: row.packagingCondition,
        },
      }),
    );
  }
  arrival.items = arrivalItems;
  inspection.items = inspectionItems;
}
export function createInspection(user, id, input) {
  return command(
    user,
    "CREATE_GOODS_INSPECTION",
    "goods_receipt_inspection:create",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const po = await activePo(actor, id, input.expectedPoVersion, session);
      const arrival = await newDocument(GoodsArrival, "ARR", actor, {
        purchaseOrderId: po._id,
        warehouseId: po.header.warehouseId,
        supplierId: po.header.supplierId,
        arrivedAt: new Date(input.arrivedAt),
        deliveryReference: input.deliveryReference,
        deliveredBy: input.deliveredBy,
      });
      arrival.sources = [sourceLink(po)];
      const inspection = await newDocument(GoodsInspection, "INS", actor, {
        arrivalId: arrival._id,
        warehouseId: po.header.warehouseId,
        participants: [actor._id],
      });
      inspection.sources = [sourceLink(arrival)];
      await prepare(po, input, actor, session, arrival, inspection);
      await arrival.save({ session });
      await inspection.save({ session });
      return {
        document: inspection,
        resultRefs: [
          {
            documentType: "goods_arrivals",
            documentId: arrival._id,
            revision: 1,
          },
        ],
      };
    },
  );
}
export function updateInspection(user, id, input) {
  return command(
    user,
    "UPDATE_GOODS_INSPECTION",
    "goods_receipt_inspection:update",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const { inspection, arrival } = await inspectionSource(
        actor,
        id,
        session,
      );
      checkVersion(inspection, input.expectedVersion);
      if (
        inspection.workflowStatus !== "DRAFT" ||
        arrival.workflowStatus !== "DRAFT"
      )
        throw validationError("Hồ sơ không còn nháp");
      const po = await activePo(
        actor,
        arrival.header.purchaseOrderId,
        input.expectedPoVersion,
        session,
      );
      await prepare(po, input, actor, session, arrival, inspection);
      arrival.header.arrivedAt = new Date(input.arrivedAt);
      arrival.header.deliveryReference = input.deliveryReference;
      arrival.header.deliveredBy = input.deliveredBy;
      await saveVersion(arrival, arrival.version, session);
      return {
        document: await saveVersion(inspection, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
      };
    },
  );
}
export function confirmInspection(user, id, input) {
  return command(
    user,
    "CONFIRM_GOODS_INSPECTION",
    "goods_receipt_inspection:update",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const { inspection, arrival } = await inspectionSource(
        actor,
        id,
        session,
      );
      checkVersion(inspection, input.expectedVersion);
      if (inspection.workflowStatus !== "DRAFT" || !inspection.items.length)
        throw validationError("Chỉ xác nhận hồ sơ nháp có dòng hàng");
      if (inspection.items.some(row => row.details.qualityCode !== 'GOOD' && row.details.ownershipDecision !== 'CUSTODY'))
        throw validationError('Hàng chưa đạt phải tạm giữ chờ trả nhà cung cấp');
      const po = await activePo(
          actor,
          arrival.header.purchaseOrderId,
          input.expectedPoVersion,
          session,
        ),
        quantities = await purchaseOrderQuantities(po, session);
      const free = new Map(
        quantities.map((row) => [
          row.lineId,
          exact(row.acceptanceHeadroomQtyBase),
        ]),
      );
      const accepted = inspection.items.filter(
        (row) => row.details.ownershipDecision === "ACCEPT",
      );
      if (accepted.some((row) => row.details.qualityCode !== "GOOD"))
        throw validationError("Chỉ GOOD được nhận sở hữu");
      const destinations = input.destinations || [];
      if (
        destinations.length !== accepted.length ||
        new Set(destinations.map((row) => row.inspectionItemId)).size !==
          accepted.length
      )
        throw validationError("Chọn vị trí nhập cho từng phần nhận sở hữu");
      const receipt = accepted.length
        ? await newDocument(PurchaseReceipt, "GR", actor, {
            purchaseOrderId: po._id,
            arrivalId: arrival._id,
            warehouseId: po.header.warehouseId,
            supplierId: po.header.supplierId,
          })
        : null;
      for (const [i, item] of accepted.entries()) {
        const source = arrival.items.id(item.details.inspectedSourceLineId),
          poItem = source && po.items.id(source.purchaseOrderItemId);
        if (
          !poItem ||
          !same(item.productId, source.productId) ||
          !same(item.lotId, source.lotId)
        )
          throw validationError("Nguồn kiểm nhận không hợp lệ");
        const left = free.get(String(poItem._id)).minus(String(item.qtyBase));
        if (left.lt(0))
          throw validationError("Tổng nhận vượt phần PO còn được nhận");
        free.set(String(poItem._id), left);
        const destination = destinations.find((row) =>
          same(row.inspectionItemId, item._id),
        );
        if (!destination) throw validationError("Thiếu vị trí nhận");
        await locationAt(
          destination.locationId,
          po.header.warehouseId,
          [item.details.qualityCode === "GOOD" ? "RECEIVING" : "QUARANTINE"],
          session,
        );
        item.details.receivingLocationId = destination.locationId;
        receipt.items.push(
          copyItem(item, item.qtyBase, {
            lineNo: i + 1,
            lineKind: "STANDARD",
            purchaseOrderItemId: poItem._id,
            arrivalItemId: source._id,
            inspectionId: inspection._id,
            inspectionResultId: item._id,
            destinationLocationId: destination.locationId,
            sources: [sourceLink(inspection, item, item.qtyBase)],
          }),
        );
      }
      const refs = [];
      if (receipt) {
        receipt.sources = [sourceLink(po), sourceLink(inspection)];
        await receipt.save({ session });
        refs.push({
          documentType: "goods_receipts",
          documentId: receipt._id,
          revision: 1,
        });
      }
      // Custody is retained as its own document, never added to store-owned stock.
      const held = inspection.items.filter(
        (row) => row.details.ownershipDecision === "CUSTODY",
      );
      if (held.length) {
        const custody = await newDocument(CustodyReceipt, "CRCV", actor, {
          warehouseId: po.header.warehouseId,
          ownerType: "SUPPLIER",
          ownerId: po.header.supplierId,
        });
        custody.items = held.map((item, i) =>
          copyItem(item, item.qtyBase, {
            lineNo: i + 1,
            lineKind: "STANDARD",
            sources: [sourceLink(inspection, item, item.qtyBase)],
          }),
        );
        custody.sources = [sourceLink(inspection)];
        await custody.save({ session });
        refs.push({
          documentType: "custody_receipts",
          documentId: custody._id,
          revision: 1,
        });
      }
      inspection.workflowStatus = "CONFIRMED";
      inspection.header.confirmedBy = actor._id;
      inspection.header.confirmedAt = new Date();
      arrival.workflowStatus = "RECORDED";
      arrival.header.recordedAt = new Date();
      await saveVersion(arrival, arrival.version, session);
      await saveVersion(po, po.version, session);
      return {
        document: await saveVersion(inspection, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
        resultRefs: refs,
      };
    },
  );
}
export function postReceipt(user, id, input) {
  return command(
    user,
    "POST_PURCHASE_RECEIPT",
    "goods_receipt_inspection:post",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const receipt = await findPurchase(id, actor, session, {
        kind: "GR_PURCHASE",
      });
      checkVersion(receipt, input.expectedVersion);
      if (receipt.workflowStatus !== "DRAFT" || !receipt.items.length)
        throw validationError("Phiếu không còn nháp hoặc không có lượng nhập");
      const po = await activePo(
        actor,
        receipt.header.purchaseOrderId,
        input.expectedPoVersion,
        session,
      );
      const quantities = await purchaseOrderQuantities(po, session);
      if (quantities.some((row) => exact(row.acceptanceHeadroomQtyBase).lt(0)))
        throw validationError("Các phiếu nhập vượt hạn mức PO");
      const locations = receipt.items.map((row) => row.destinationLocationId);
      await guardLocations(locations, session);
      const posting = beginStock(receipt, actor, "PURCHASE_RECEIPT", input);
      for (const item of receipt.items) {
        if (item.custodyBalanceId) {
          await postOwnedCustody(receipt, item, po, posting, actor, session);
          continue;
        }
        const inspection = await GoodsInspection.findOne({
            _id: item.inspectionId,
            workflowStatus: "CONFIRMED",
            "header.arrivalId": receipt.header.arrivalId,
          }).session(session),
          source = inspection?.items.id(item.inspectionResultId);
        if (
          !source ||
          source.details.qualityCode !== "GOOD" ||
          source.details.ownershipDecision !== "ACCEPT" ||
          !same(source.lotId, item.lotId) ||
          !same(source.productId, item.productId) ||
          !exact(source.qtyBase).eq(String(item.qtyBase))
        )
          throw validationError("Nguồn nhận sở hữu không hợp lệ");
        await locationAt(
          item.destinationLocationId,
          po.header.warehouseId,
          [source.details.qualityCode === "GOOD" ? "RECEIVING" : "QUARANTINE"],
          session,
        );
        const target = await balanceAt(
          { type: "LOCATION", locationId: item.destinationLocationId },
          { batchId: item.lotId, ownerType: "STORE", ownerId: null },
          source.details.qualityCode,
          session,
        );
        const portions = input.packaging?.find((row) =>
          same(row.lineId, item._id),
        )?.portions;
        if (source.details.packagingCondition !== "SEALED" && !portions?.length)
          throw validationError(
            "Hàng không nguyên thùng cần nhập quy cách và thể tích thực đo",
          );
        await receiveStock(target, item, portions, posting, actor, session);
      }
      await verifyCapacity(locations, session);
      await posting.save({ session });
      receipt.workflowStatus = "POSTED";
      receipt.stockTransactionId = posting._id;
      receipt.postedBy = actor._id;
      receipt.postedAt = new Date();
      receipt.header.receivedAt = new Date();
      const saved = await saveVersion(receipt, input.expectedVersion, session);
      const remaining = await purchaseOrderQuantities(po, session);
      po.workflowStatus = remaining.every((row) =>
        exact(row.outstandingQtyBase).isZero(),
      )
        ? "COMPLETED"
        : "PARTIAL";
      await saveVersion(po, po.version, session);
      return {
        document: saved,
        versionBefore: input.expectedVersion,
        stockTransactionId: posting._id,
      };
    },
  );
}
export function cancelDraft(user, id, kind, input) {
  return command(
    user,
    "CANCEL_" + kind,
    "goods_receipt_inspection:update",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const document = await findPurchase(id, actor, session, { kind });
      checkVersion(document, input.expectedVersion);
      if (document.workflowStatus !== "DRAFT")
        throw validationError("Chỉ hủy phiếu nháp");
      document.workflowStatus = "CANCELLED";
      document.cancelledBy = actor._id;
      document.cancelledAt = new Date();
      document.cancelReason = input.reason;
      if (kind === "GR_PURCHASE") {
        const po = await findPurchase(
          document.header.purchaseOrderId,
          actor,
          session,
          { kind: "PO" },
        );
        checkVersion(po, input.expectedPoVersion);
        await saveVersion(po, po.version, session);
      }
      return {
        document: await saveVersion(document, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
        reason: input.reason,
      };
    },
  );
}
export function changeDestinations(user, id, input) {
  return command(
    user,
    "CHANGE_RECEIPT_DESTINATIONS",
    "goods_receipt_inspection:update",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const receipt = await findPurchase(id, actor, session, {
        kind: "GR_PURCHASE",
      });
      checkVersion(receipt, input.expectedVersion);
      if (receipt.workflowStatus !== "DRAFT")
        throw validationError("Không đổi vị trí sau ghi tồn");
      for (const row of input.lines) {
        const item = receipt.items.id(row.lineId);
        if (!item) throw validationError("Dòng không thuộc phiếu");
        const inspection = await GoodsInspection.findById(
            item.inspectionId,
          ).session(session),
          source = inspection?.items.id(item.inspectionResultId);
        if (!source) throw validationError("Thiếu kiểm nhận");
        await locationAt(
          row.receivingLocationId,
          receipt.header.warehouseId,
          [source.details.qualityCode === "GOOD" ? "RECEIVING" : "QUARANTINE"],
          session,
        );
        item.destinationLocationId = row.receivingLocationId;
      }
      return {
        document: await saveVersion(receipt, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
        reason: input.reason,
      };
    },
  );
}
export async function inspectionContext(user, id) {
  requirePermission(user, "goods_receipt_inspection:read");
  const po = await findPurchase(id, user, null, { kind: "PO", readOnly: true });
  const locations = await WarehouseLocation.find({
    warehouseId: po.header.warehouseId,
    isActive: true,
  }).lean();
  const batches = await ProductBatch.find({
    productId: { $in: po.items.map((row) => row.productId) },
    identificationStatus: "VERIFIED",
  }).lean();
  const products = await Product.find(
    { _id: { $in: po.items.map((row) => row.productId) } },
    "baseUnit lengthMm widthMm",
  ).lean();
  const cartonUnits = await Uom.find({ isCarton: true, isActive: true }, "code").lean();
  return {
    purchaseOrder: redactPrices(dto(po)),
    quantities: await purchaseOrderQuantities(po),
    locations: locations.map(dto),
    batches: batches.map(dto),
    // Lets the UI convert counted units to base units and m² without hardcoding ratios.
    products: products.map((row) => ({
      id: String(row._id),
      baseUnit: row.baseUnit,
      lengthMm: row.lengthMm == null ? null : exact(row.lengthMm).toFixed(),
      widthMm: row.widthMm == null ? null : exact(row.widthMm).toFixed(),
    })),
    cartonUnits: cartonUnits.map((row) => row.code),
  };
}
export async function receivingOperation(user, id, key) {
  requirePermission(user, "goods_receipt_inspection:read");
  const po = await findPurchase(id, user, null, { kind: "PO", readOnly: true });
  const operations = await OperationRecord.find({
    actorId: user._id,
    requestKey: key,
  }).lean();
  for (const operation of operations) {
    const subject = await findPurchase(operation.subjectId, user, null, {
      readOnly: true,
    });
    if (
      same(subject._id, id) ||
      same(subject.header.purchaseOrderId, id) ||
      subject.sources?.some((link) => same(link.documentId, id))
    )
      return serialize(operation);
  }
  return null;
}

export function postCustodyReceipt(user, id, input) {
  return command(
    user,
    "POST_PURCHASE_CUSTODY",
    "goods_receipt_inspection:post",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const receipt = await findPurchase(id, actor, session, {
        kind: "CUSTODY_RECEIPT",
      });
      checkVersion(receipt, input.expectedVersion);
      if (
        receipt.workflowStatus !== "DRAFT" ||
        receipt.header.ownerType !== "SUPPLIER" ||
        !receipt.items.length
      )
        throw validationError("Phiếu giữ hộ không còn nháp");
      if (
        input.destinations.length !== receipt.items.length ||
        new Set(input.destinations.map((r) => r.lineId)).size !==
          receipt.items.length
      )
        throw validationError("Chọn vị trí cho mỗi dòng giữ hộ");
      const locations = input.destinations.map((r) => r.locationId);
      await guardLocations(locations, session);
      const posting = beginStock(receipt, actor, "CUSTODY_RECEIPT", input);
      for (const item of receipt.items) {
        const ref = item.sources.find(
          (r) => r.subjectCollection === "goods_inspections",
        );
        const inspection =
          ref &&
          (await GoodsInspection.findOne({
            _id: ref.documentId,
            workflowStatus: "CONFIRMED",
            "header.warehouseId": receipt.header.warehouseId,
          }).session(session));
        const origin = inspection?.items.id(ref.itemId);
        const arrival =
          inspection &&
          (await GoodsArrival.findById(inspection.header.arrivalId).session(
            session,
          ));
        if (
          !origin ||
          origin.details.ownershipDecision !== "CUSTODY" ||
          !same(arrival?.header.supplierId, receipt.header.ownerId) ||
          !same(item.lotId, origin.lotId) ||
          !same(item.productId, origin.productId) ||
          !exact(item.qtyBase).eq(String(origin.qtyBase))
        )
          throw validationError("Nguồn giữ hộ không hợp lệ");
        const dest = input.destinations.find((r) => same(r.lineId, item._id));
        if (!dest) throw validationError("Thiếu vị trí giữ hộ");
        await locationAt(
          dest.locationId,
          receipt.header.warehouseId,
          ["CUSTODY", "QUARANTINE"],
          session,
        );
        const target = await balanceAt(
          { type: "LOCATION", locationId: dest.locationId },
          {
            batchId: item.lotId,
            ownerType: "SUPPLIER",
            ownerId: receipt.header.ownerId,
          },
          origin.details.qualityCode,
          session,
        );
        const portions = input.packaging?.find((r) =>
          same(r.lineId, item._id),
        )?.portions;
        if (origin.details.packagingCondition !== "SEALED" && !portions?.length)
          throw validationError(
            "Hàng không nguyên thùng cần nhập quy cách và thể tích thực đo",
          );
        await receiveStock(target, item, portions, posting, actor, session);
      }
      await verifyCapacity(locations, session);
      await posting.save({ session });
      receipt.workflowStatus = "POSTED";
      receipt.stockTransactionId = posting._id;
      receipt.postedBy = actor._id;
      receipt.postedAt = new Date();
      receipt.header.receivedAt = new Date();
      receipt.header.receivedBy = actor._id;
      // Optional until the business meaning of "người bàn giao" is confirmed.
      receipt.header.handedOverBy = input.handedOverBy || undefined;
      return {
        document: await saveVersion(receipt, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
        stockTransactionId: posting._id,
      };
    },
  );
}
