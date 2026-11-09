/**
 * Module Dữ liệu Mẫu GoodsReceipt (WMSD)
 *
 * Triển khai theo kế hoạch:
 * "Gộp GoodsReceipt, giữ đủ trường cũ và tách API theo loại"
 *
 * Hỗ trợ toàn bộ 5 loại chứng từ nhập kho (documentKind):
 *  1. PURCHASE: Phiếu nhập mua hàng từ PO / kiểm nhận
 *  2. CUSTOMER_RETURN: Phiếu nhập hàng khách trả
 *  3. FAILED_DELIVERY: Phiếu nhận hàng giao thất bại (với demandReopenings và commitmentTransfers)
 *  4. TRANSFER: Phiếu nhận hàng điều chuyển liên kho
 *  5. OTHER: Phiếu nhập khác (nhập thủ công, phê duyệt và 4 tình huống sửa sai: bỏ ghi, thay thế, hủy nháp)
 */

import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { serialize } from '../../shared/utils/persistence.js';

const SEED_PREFIX = 'wmsd-goods-receipt-20261109';
const hashKey = (key) => createHash('sha256').update(`${SEED_PREFIX}:${key}`).digest('hex');
export const receiptFixtureId = (key) => new mongoose.Types.ObjectId(hashKey(key).slice(0, 24));
export const decimal = (val) => mongoose.Types.Decimal128.fromString(String(val));
export const seedDate = (day, hour = 8) => new Date(Date.UTC(2026, 9, day, hour));

/**
 * Tính mã băm nội dung dòng hàng phục vụ kiểm duyệt phiên bản cho OtherGoodsReceipt
 */
export function computeStockContentHash(doc) {
  const content = {
    warehouseId: doc.header?.warehouseId,
    items: (doc.items || []).map((item) => ({
      productId: item.productId,
      lotId: item.lotId,
      destinationLocationId: item.destinationLocationId,
      qualityCode: item.qualityCode,
      enteredUnit: item.enteredUnit,
      enteredQty: item.enteredQty,
      baseUnitSnapshot: item.baseUnitSnapshot,
      baseUnitsPerUnit: item.baseUnitsPerUnit,
      qtyBase: item.qtyBase,
      packagingSnapshot: item.packagingSnapshot,
    })),
  };
  return createHash('sha256').update(JSON.stringify(serialize(content))).digest('hex');
}

/**
 * Xây dựng và bổ sung toàn bộ danh mục phiếu GoodsReceipt cho cả 5 loại chứng từ:
 * PURCHASE, CUSTOMER_RETURN, FAILED_DELIVERY, TRANSFER, và OTHER.
 *
 * @param {Object} data - Bản đồ collections hiện hành của demo/seed
 * @returns {Array<Object>} Danh sách goods_receipts đầy đủ sau khi bổ sung và chuẩn hóa
 */
export function enrichGoodsReceiptsSeedData(data) {
  if (!data.goods_receipts) {
    data.goods_receipts = [];
  }

  const byId = (collection) => new Map((data[collection] || []).map((r) => [String(r._id), r]));
  const warehouses = byId('warehouses');
  const locations = data.warehouse_locations || [];
  const users = byId('users');
  const products = byId('products');
  const batches = byId('product_batches');
  const arrivals = byId('goods_arrivals');
  const pos = byId('purchase_orders');
  const inspections = byId('goods_inspections');
  const returns = byId('customer_returns');

  const defaultWh = data.warehouses?.[0] || { _id: receiptFixtureId('warehouse:default') };
  const worker = data.users?.find((u) => u.username === 'thukho01') || data.users?.[0];
  const owner = data.users?.find((u) => u.username === 'chucuahang') || data.users?.[0];

  // 1. Chuẩn hóa và bảo toàn trường cho 4 loại chứng từ đã có
  for (const receipt of data.goods_receipts) {
    receipt.header ??= {};

    if (receipt.documentKind === 'PURCHASE') {
      receipt.header.receiptKind = 'PURCHASE';
      const arrival = arrivals.get(String(receipt.header.arrivalId));
      const po = pos.get(String(receipt.header.purchaseOrderId || arrival?.sources?.[0]?.documentId));
      const inspection = inspections.get(String(receipt.sources?.[0]?.documentId));

      receipt.header.receivedAt ??= receipt.postedAt ?? receipt.occurredAt ?? seedDate(10);
      if (arrival) receipt.header.arrivalId = arrival._id;
      if (po) receipt.header.purchaseOrderId = po._id;
      if (arrival?.header?.supplierId) receipt.header.supplierId = arrival.header.supplierId;

      for (const item of receipt.items || []) {
        item.lineKind = 'STANDARD';
        if (arrival?.items?.[0]) item.arrivalItemId ??= arrival.items[0]._id;
        if (po?.items?.[0]) item.purchaseOrderItemId ??= po.items[0]._id;
        if (inspection) {
          item.inspectionId ??= inspection._id;
          if (inspection.items?.[0]) item.inspectionResultId ??= inspection.items[0]._id;
        }
        if (!item.destinationLocationId) {
          const loc = locations.find((l) => String(l.warehouseId) === String(receipt.header.warehouseId));
          if (loc) item.destinationLocationId = loc._id;
        }
      }
    } else if (receipt.documentKind === 'CUSTOMER_RETURN') {
      receipt.header.receiptKind = 'CUSTOMER_RETURN';
      receipt.header.receivedAt ??= receipt.postedAt ?? receipt.occurredAt ?? seedDate(18);
      receipt.header.operationId ??= data.operation_records?.[0]?._id ?? receiptFixtureId('operation:customer_return');

      const ret = returns.get(String(receipt.header.returnId));
      for (const item of receipt.items || []) {
        item.lineKind = 'STANDARD';
        if (ret?.inspections?.[0]) item.inspectionId ??= ret.inspections[0]._id;
      }
    } else if (receipt.documentKind === 'FAILED_DELIVERY') {
      receipt.header.receiptKind = 'FAILED_DELIVERY';
      receipt.header.receivedAt ??= receipt.postedAt ?? receipt.occurredAt ?? seedDate(15);
      receipt.header.receivedBy ??= receipt.postedBy ?? worker?._id;
      receipt.demandReopenings ??= [];
      receipt.commitmentTransfers ??= [];
    } else if (receipt.documentKind === 'TRANSFER') {
      receipt.header.receivedAt ??= receipt.postedAt ?? receipt.occurredAt ?? seedDate(20);
      receipt.header.receivedBy ??= receipt.postedBy ?? worker?._id;
      receipt.header.putawayStatus ??= 'COMPLETED';
      receipt.header.damageReportIds ??= [];
    }
  }

  // 2. Thêm nhóm phiếu loại OTHER (Nhập khác / thủ công) bao phủ 4 tình huống nghiệp vụ
  const storageLoc = locations.find((l) => String(l.warehouseId) === String(defaultWh._id) && l.code === 'STORAGE-02') || locations[0];
  const receivingLoc = locations.find((l) => String(l.warehouseId) === String(defaultWh._id) && l.code === 'RECEIVING-01') || locations[0];
  const prodTile = data.products?.find((p) => p.sku === 'AP6601') || data.products?.[0];
  const batchTile = data.product_batches?.find((b) => String(b.productId) === String(prodTile?._id)) || data.product_batches?.[0];
  const prodWall = data.products?.find((p) => p.sku === 'TV3601') || data.products?.[1] || prodTile;
  const batchWall = data.product_batches?.find((b) => String(b.productId) === String(prodWall?._id)) || batchTile;

  // Đảm bảo có danh mục Attachment cho bằng chứng nhập khác
  data.attachments ??= [];
  const createEvidence = (key, name) => {
    const id = receiptFixtureId(`attachment:${key}`);
    if (!data.attachments.some((a) => String(a._id) === String(id))) {
      data.attachments.push({
        _id: id,
        ownerDocumentType: 'goods_receipts',
        ownerDocumentId: receiptFixtureId(`goods_receipt:other:${key}`),
        purpose: 'EVIDENCE',
        originalName: name,
        mediaType: 'image/png',
        sizeBytes: 1024,
        storageKey: `synthetic/goods-receipts/${key}.png`,
        checksum: createHash('sha256').update(key).digest('hex'),
        uploadedBy: worker._id,
        uploadedAt: seedDate(20, 8),
        accessCategory: 'BUSINESS',
        status: 'ATTACHED',
        createdAt: seedDate(20, 8),
        updatedAt: seedDate(20, 8),
      });
    }
    return id;
  };

  const evidence1 = createEvidence('proof-nk-001', 'bien_ban_kiem_dinh_dau_ky.png');
  const evidenceReversed = createEvidence('proof-nk-reversed', 'bien_ban_xac_nhan_ghi_nham.png');
  const evidence2 = createEvidence('proof-nk-002', 'bien_ban_dieu_chinh_kiem_dem.png');
  const evidence3 = createEvidence('proof-nk-003', 'giay_gioi_thieu_hang_mau.png');

  // Đảm bảo có danh mục ApprovalHistory cho quyết định duyệt của Owner
  data.approval_history ??= [];
  const createApproval = (key, receiptId, version, reasonText, content = {}) => {
    const id = receiptFixtureId(`approval:${key}`);
    if (!data.approval_history.some((a) => String(a._id) === String(id))) {
      data.approval_history.push({
        _id: id,
        decisionKey: hashKey(`approval-decision:${key}`),
        subjectType: 'goods_receipts',
        subjectId: receiptId,
        subjectRevision: version,
        decisionScope: 'OTHER_RECEIPT',
        reviewedContent: content && Object.keys(content).length > 0 ? content : { receiptId: String(receiptId), version, reason: reasonText },
        decision: 'APPROVE',
        reason: reasonText,
        requestedBy: worker._id,
        decidedBy: owner._id,
        decidedAt: seedDate(20, 9),
        recordedAt: seedDate(20, 9),
        itemDecisions: [{ itemId: receiptFixtureId(`${key}:line:1`), approvedQtyBase: decimal(40), outcome: 'APPROVE' }],
        authoritySnapshot: {
          roleCode: 'OWNER',
          permissionCode: 'goods_receipt_other:approve',
          warehouseIds: [defaultWh._id],
        },
        evidenceIds: [evidence1],
        createdAt: seedDate(20, 9),
        updatedAt: seedDate(20, 9),
      });
    }
    return id;
  };

  const idOther1 = receiptFixtureId('goods_receipt:other:NK-202610-001');
  const idOtherReversed = receiptFixtureId('goods_receipt:other:NK-202610-REVERSED');
  const idOther2 = receiptFixtureId('goods_receipt:other:NK-202610-002');
  const idOtherDraft = receiptFixtureId('goods_receipt:other:NK-202610-003');

  const approval1 = createApproval('other-001', idOther1, 2, 'Duyệt nhập bổ sung hàng kiểm định đầu kỳ');
  const approval2 = createApproval('other-002', idOther2, 2, 'Duyệt phiếu nhập thay thế sau khi điều chỉnh lượng');

  // Kiểm tra xem đã có OTHER receipts chưa, nếu chưa có thì thêm vào
  const hasOther = data.goods_receipts.some((r) => r.documentKind === 'OTHER');
  if (!hasOther) {
    // 1. NK-202610-001: Đã duyệt & đã ghi sổ (POSTED), có chứng cứ và phê duyệt của Owner
    const other1 = {
      _id: idOther1,
      documentNo: 'NK-202610-001',
      documentKind: 'OTHER',
      workflowStatus: 'POSTED',
      version: 3,
      createdBy: worker._id,
      occurredAt: seedDate(20, 8),
      note: 'Dữ liệu mẫu nhập khác: Bổ sung gạch lát nền vân đá trắng AP6601 kiểm định đầu kỳ',
      header: {
        warehouseId: defaultWh._id,
        reason: 'Nhập bổ sung tồn kho thực tế kiểm định đầu kỳ có chứng cứ',
      },
      evidenceIds: [evidence1],
      approvedVersion: 2,
      approvalDecisionId: approval1,
      stockTransactionId: data.stock_transactions?.[0]?._id || receiptFixtureId('tx:other-001'),
      postedBy: worker._id,
      postedAt: seedDate(20, 10),
      items: [
        {
          _id: receiptFixtureId('other-001:line:1'),
          lineNo: 1,
          lineKind: 'STANDARD',
          productId: prodTile._id,
          lotId: batchTile._id,
          enteredUnit: 'Thùng',
          baseUnitSnapshot: prodTile.baseUnit || 'Viên',
          baseUnitsPerUnit: decimal(4),
          enteredQty: decimal(10),
          qtyBase: decimal(40),
          productNameSnapshot: prodTile.name,
          destinationLocationId: storageLoc._id,
          qualityCode: 'GOOD',
          packagingSnapshot: {
            packageUnit: 'Thùng',
            baseUnitsPerPackage: decimal(4),
            outerLengthMm: 620,
            outerWidthMm: 620,
            outerHeightMm: 50,
          },
          createdAt: seedDate(20, 8),
          updatedAt: seedDate(20, 8),
        },
      ],
      createdAt: seedDate(20, 8),
      updatedAt: seedDate(20, 10),
    };
    other1.approvedStockHash = computeStockContentHash(other1);
    data.goods_receipts.push(other1);

    // 2. NK-202610-002-OLD: Tình huống 1 - Đã ghi sổ nhưng phát hiện sai sót, Warehouse Staff trực tiếp Bỏ ghi (REVERSED)
    const otherReversed = {
      _id: idOtherReversed,
      documentNo: 'NK-202610-002-OLD',
      documentKind: 'OTHER',
      workflowStatus: 'REVERSED',
      version: 4,
      createdBy: worker._id,
      occurredAt: seedDate(22, 8),
      note: 'Nhập bổ sung gạch ốp tường TV3601\nBỏ ghi: Phát hiện sai vị trí lưu kho và sai số lượng thùng sau khi kiểm đếm lại',
      header: {
        warehouseId: defaultWh._id,
        reason: 'Nhập bổ sung gạch ốp tường mẫu',
      },
      evidenceIds: [evidenceReversed],
      approvedVersion: 2,
      approvalDecisionId: approval2,
      postedBy: worker._id,
      postedAt: seedDate(22, 9),
      items: [
        {
          _id: receiptFixtureId('other-reversed:line:1'),
          lineNo: 1,
          lineKind: 'STANDARD',
          productId: prodWall._id,
          lotId: batchWall._id,
          enteredUnit: 'Thùng',
          baseUnitSnapshot: prodWall.baseUnit || 'Viên',
          baseUnitsPerUnit: decimal(8),
          enteredQty: decimal(5),
          qtyBase: decimal(40),
          productNameSnapshot: prodWall.name,
          destinationLocationId: storageLoc._id,
          qualityCode: 'GOOD',
          packagingSnapshot: {
            packageUnit: 'Thùng',
            baseUnitsPerPackage: decimal(8),
            outerLengthMm: 620,
            outerWidthMm: 320,
            outerHeightMm: 100,
          },
          createdAt: seedDate(22, 8),
          updatedAt: seedDate(22, 8),
        },
      ],
      createdAt: seedDate(22, 8),
      updatedAt: seedDate(22, 10),
    };
    otherReversed.approvedStockHash = computeStockContentHash(otherReversed);
    data.goods_receipts.push(otherReversed);

    // 3. NK-202610-002: Tình huống 4 - Phiếu thay thế liên kết phiếu gốc qua originalReceiptId
    const other2 = {
      _id: idOther2,
      documentNo: 'NK-202610-002',
      documentKind: 'OTHER',
      workflowStatus: 'POSTED',
      version: 3,
      createdBy: worker._id,
      occurredAt: seedDate(22, 11),
      note: 'Phiếu thay thế cho NK-202610-002-OLD sau khi chỉnh đúng số lượng',
      header: {
        warehouseId: defaultWh._id,
        reason: 'Thay thế phiếu NK-202610-002-OLD sau khi kiểm đếm lại',
        originalReceiptId: idOtherReversed,
      },
      sources: [
        {
          _id: receiptFixtureId('source:replace-reversed'),
          subjectCollection: 'goods_receipts',
          documentId: idOtherReversed,
          relationCode: 'REPLACES',
        },
      ],
      evidenceIds: [evidence2],
      approvedVersion: 2,
      approvalDecisionId: approval2,
      postedBy: worker._id,
      postedAt: seedDate(22, 14),
      items: [
        {
          _id: receiptFixtureId('other-002:line:1'),
          lineNo: 1,
          lineKind: 'STANDARD',
          productId: prodWall._id,
          lotId: batchWall._id,
          enteredUnit: 'Thùng',
          baseUnitSnapshot: prodWall.baseUnit || 'Viên',
          baseUnitsPerUnit: decimal(8),
          enteredQty: decimal(4),
          qtyBase: decimal(32),
          productNameSnapshot: prodWall.name,
          destinationLocationId: storageLoc._id,
          qualityCode: 'GOOD',
          packagingSnapshot: {
            packageUnit: 'Thùng',
            baseUnitsPerPackage: decimal(8),
            outerLengthMm: 620,
            outerWidthMm: 320,
            outerHeightMm: 100,
          },
          createdAt: seedDate(22, 11),
          updatedAt: seedDate(22, 11),
        },
      ],
      createdAt: seedDate(22, 11),
      updatedAt: seedDate(22, 14),
    };
    other2.approvedStockHash = computeStockContentHash(other2);
    data.goods_receipts.push(other2);

    // 4. NK-202610-003: Tình huống phiếu nháp (DRAFT) có đính kèm chứng cứ, chờ gửi duyệt
    const otherDraft = {
      _id: idOtherDraft,
      documentNo: 'NK-202610-003',
      documentKind: 'OTHER',
      workflowStatus: 'DRAFT',
      version: 1,
      createdBy: worker._id,
      occurredAt: seedDate(25, 9),
      note: 'Phiếu nháp nhập kho hàng mẫu kiểm định chất lượng',
      header: {
        warehouseId: defaultWh._id,
        reason: 'Nhập hàng mẫu kiểm định chất lượng',
      },
      evidenceIds: [evidence3],
      items: [
        {
          _id: receiptFixtureId('other-003:line:1'),
          lineNo: 1,
          lineKind: 'STANDARD',
          productId: prodTile._id,
          lotId: batchTile._id,
          enteredUnit: 'Thùng',
          baseUnitSnapshot: prodTile.baseUnit || 'Viên',
          baseUnitsPerUnit: decimal(4),
          enteredQty: decimal(2),
          qtyBase: decimal(8),
          productNameSnapshot: prodTile.name,
          destinationLocationId: receivingLoc._id,
          qualityCode: 'PENDING',
          packagingSnapshot: {
            packageUnit: 'Thùng',
            baseUnitsPerPackage: decimal(4),
            outerLengthMm: 620,
            outerWidthMm: 620,
            outerHeightMm: 50,
          },
          createdAt: seedDate(25, 9),
          updatedAt: seedDate(25, 9),
        },
      ],
      createdAt: seedDate(25, 9),
      updatedAt: seedDate(25, 9),
    };
    data.goods_receipts.push(otherDraft);
  }

  return data.goods_receipts;
}
