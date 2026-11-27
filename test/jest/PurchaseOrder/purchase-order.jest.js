import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import * as models from '../../../src/models/runtime.js';
import * as po from '../../../src/modules/purchase-orders/purchase-order.commands.js';
import { purchaseOrderQuantities } from '../../../src/modules/purchase-orders/purchase-order.service.js';
import { createInspection, confirmInspection } from '../../../src/modules/goods-inspections/goods-inspection.service.js';
import { postReceipt } from '../../../src/modules/goods-receipts/purchase-receipt.service.js';
import { reverseReceipt } from '../../../src/modules/stock-reversals/stock-reversal.service.js';
import {
  approveRequest, commandInput, createProduct, createPurchasingFixture, createRequest,
  dateInSaigon, id, key, purchaseInput, purchasingEnabled, requestLine,
  startPurchasingDatabase, stopPurchasingDatabase,
} from '../../fixtures/purchasing.js';

jest.setTimeout(30_000);
const suite = purchasingEnabled ? describe : describe.skip;

suite('PurchaseOrder (Report 5.1)', () => {
  let fixture;

  beforeAll(startPurchasingDatabase);
  afterAll(stopPurchasingDatabase);
  beforeEach(async () => { fixture = await createPurchasingFixture(); });

  const loadOrder = (orderId) => models.PurchaseOrder.findById(orderId).orFail();
  const create = (request, fields) => po.createPurchaseOrder(fixture.accountant, purchaseInput(fixture, request, fields));
  const confirm = (order) => po.confirmPurchaseOrder(fixture.accountant, id(order), commandInput(order));
  const close = (order, qtyBase) => po.closeRemainder(fixture.accountant, id(order), commandInput(order, {
    reason: 'Supplier cannot deliver the remainder',
    lines: [{ poLineId: id(order.items[0]), qtyBase }],
  }));
  const reopen = (order) => po.reopenPurchaseOrder(fixture.accountant, id(order), commandInput(order, {
    reason: 'Receive the corrected delivery',
  }));
  const cancel = (order) => po.cancelPurchaseOrder(fixture.accountant, id(order), commandInput(order, {
    reason: 'Wrong supplier',
  }));

  async function draftOrder(request) {
    request ??= await approveRequest(fixture);
    const created = await create(request);
    return loadOrder(created.id);
  }

  async function openOrder() {
    const order = await draftOrder();
    await confirm(order);
    return loadOrder(id(order));
  }

  function lineInput(request, changes) {
    const { lines: [line] } = purchaseInput(fixture, request);
    return { ...line, ...changes };
  }

  function editInput(order, request, lines) {
    const { creationKey, ...fields } = purchaseInput(fixture, request);
    return commandInput(order, { ...fields, lines });
  }

  async function inspect(order, quantity) {
    const [lot, location] = await Promise.all([
      models.ProductBatch.create({
        productId: fixture.product._id,
        manufacturerLot: 'B1',
        identificationStatus: 'VERIFIED',
        piecesPerCarton: 4,
        cartonLengthMm: '620',
        cartonWidthMm: '620',
        cartonHeightMm: '50',
      }),
      models.WarehouseLocation.create({
        warehouseId: fixture.warehouse._id,
        code: 'IN',
        locationType: 'RECEIVING',
        usableLengthMm: '5000',
        usableWidthMm: '5000',
      }),
    ]);
    const created = await createInspection(fixture.worker, id(order), {
      creationKey: key(),
      expectedPoVersion: order.version,
      arrivedAt: new Date().toISOString(),
      lines: [{
        poLineId: id(order.items[0]),
        lotId: id(lot),
        enteredUnit: 'PIECE',
        enteredQty: quantity,
        qualityCode: 'GOOD',
        ownershipDecision: 'ACCEPT',
        packagingCondition: 'LOOSE',
      }],
    });
    const inspection = await models.GoodsInspection.findById(created.id).orFail();
    return { inspection, location };
  }

  async function receive(order, quantity) {
    const { inspection, location } = await inspect(order, quantity);
    const confirmed = await confirmInspection(fixture.worker, id(inspection), commandInput(inspection, {
      expectedPoVersion: order.version,
      destinations: [{ inspectionItemId: id(inspection.items[0]), locationId: id(location) }],
    }));
    const reference = confirmed.resultRefs.find((ref) => ref.documentType === 'goods_receipts');
    const draft = await models.PurchaseReceipt.findById(reference.documentId).orFail();
    const current = await loadOrder(id(order));
    await postReceipt(fixture.worker, id(draft), commandInput(draft, { expectedPoVersion: current.version }));
    return models.PurchaseReceipt.findById(draft._id).orFail();
  }

  async function partialOrder() {
    const order = await openOrder();
    const receipt = await receive(order, '6');
    return { order: await loadOrder(id(order)), receipt };
  }

  test('UTC-PO-001 creates a numbered draft PO with the RR source and total', async () => {
    const request = await approveRequest(fixture);
    const order = await draftOrder(request);
    expect(order.workflowStatus).toBe('DRAFT');
    expect(order.documentNo).toMatch(new RegExp(`^ĐMH-${fixture.warehouse.code}-\\d{6}-\\d{6}$`));
    expect(id(order)).toBe(order.documentNo);
    expect(String(order.replenishmentRequestId)).toBe(id(request));
    expect(String(order.totalAmount)).toBe('500000');
  });

  test('UTC-PO-002 permits the smallest whole-carton order covering the approval', async () => {
    const request = await approveRequest(fixture);
    const receipt = await create(request, { lines: [
      lineInput(request, { uomCode: 'BOX', enteredQty: '3', unitPurchasePrice: '200000' }),
    ] });
    const order = await loadOrder(receipt.id);
    expect(order.workflowStatus).toBe('DRAFT');
    expect(order.items[0].enteredUnit).toBe('BOX');
    expect(String(order.items[0].qtyBase)).toBe('12');
  });

  test.each([
    ['UTC-PO-003', 'four cartons against an approval of ten pieces', 'BOX', '4', '200000', 'Sản phẩm hoặc lượng PO vượt nguồn được duyệt'],
    ['UTC-PO-004', 'eleven pieces against an approval of ten', 'PIECE', '11', '50000', 'Sản phẩm hoặc lượng PO vượt nguồn được duyệt'],
    ['UTC-PO-010', 'a fractional carton', 'BOX', '1.5', '200000', 'Số thùng phải là số nguyên'],
  ])('%s rejects %s', async (_caseId, _title, uomCode, enteredQty, unitPurchasePrice, message) => {
    const request = await approveRequest(fixture);
    await expect(create(request, { lines: [lineInput(request, { uomCode, enteredQty, unitPurchasePrice })] }))
      .rejects.toMatchObject({ statusCode: 400, message });
    expect(await models.PurchaseOrder.exists({ replenishmentRequestId: request._id })).toBeNull();
  });

  test('UTC-PO-005 rejects an unapproved source RR', async () => {
    const approved = await approveRequest(fixture);
    const product = await createProduct();
    const submitted = await createRequest(fixture, {
      action: 'SUBMIT',
      lines: [requestLine(fixture, { productId: id(product) })],
    });
    await expect(create(approved, { lines: [
      lineInput(approved, { rrLineId: id(submitted.items[0]), enteredQty: '5', unitPurchasePrice: '1' }),
    ] })).rejects.toMatchObject({ statusCode: 400, message: 'Một PO phải thuộc một RR đã duyệt và cùng kho' });
  });

  test('UTC-PO-006 rejects a second PO from the same RR with a fresh creation key', async () => {
    const request = await approveRequest(fixture);
    await draftOrder(request);
    await expect(create(request)).rejects.toMatchObject({ statusCode: 400, message: 'Yêu cầu bổ sung đã có đơn mua' });
    expect(await models.PurchaseOrder.countDocuments({ replenishmentRequestId: request._id })).toBe(1);
  });

  test('UTC-PO-007 rejects a suspended supplier', async () => {
    await fixture.supplier.updateOne({ status: 'SUSPENDED' });
    const request = await approveRequest(fixture);
    await expect(create(request)).rejects.toMatchObject({
      statusCode: 400, message: 'Kho hoặc nhà cung cấp không hoạt động',
    });
  });

  test('UTC-PO-008 rejects an expected delivery date in the past', async () => {
    const request = await approveRequest(fixture);
    await expect(create(request, { expectedOn: `${dateInSaigon(-1)}T00:00:00+07:00` }))
      .rejects.toMatchObject({ statusCode: 400, message: 'Ngày dự kiến giao không được trước hôm nay' });
  });

  test('UTC-PO-009 rejects two lines from the same approved RR line', async () => {
    const request = await approveRequest(fixture);
    const line = lineInput(request, { enteredQty: '5' });
    await expect(create(request, { lines: [line, { ...line }] }))
      .rejects.toMatchObject({ statusCode: 400, message: 'Gộp lượng của cùng dòng RR' });
  });

  test('UTC-PO-011 edits the draft quantity and unit price and recalculates the total', async () => {
    const request = await approveRequest(fixture);
    const order = await draftOrder(request);
    const payload = editInput(order, request, [
      lineInput(request, { id: id(order.items[0]), enteredQty: '8', unitPurchasePrice: '55000' }),
    ]);
    await expect(po.updatePurchaseOrder(fixture.accountant, id(order), payload)).resolves.toMatchObject({ version: 2 });
    const updated = await loadOrder(id(order));
    expect(id(updated.items[0])).toBe(id(order.items[0]));
    expect(String(updated.items[0].qtyBase)).toBe('8');
    expect(String(updated.totalAmount)).toBe('440000');
  });

  test('UTC-PO-012 rejects editing an open PO', async () => {
    const request = await approveRequest(fixture);
    const draft = await draftOrder(request);
    await confirm(draft);
    const order = await loadOrder(id(draft));
    const payload = editInput(order, request, [lineInput(request, { id: id(order.items[0]) })]);
    await expect(po.updatePurchaseOrder(fixture.accountant, id(order), payload))
      .rejects.toMatchObject({ statusCode: 400, message: 'Chỉ sửa trực tiếp PO nháp' });
  });

  test('UTC-PO-013 rejects changing the source RR of a draft PO', async () => {
    const order = await draftOrder();
    const product = await createProduct();
    const other = await approveRequest(fixture, { lines: [requestLine(fixture, { productId: id(product) })] });
    const payload = editInput(order, other, [lineInput(other)]);
    await expect(po.updatePurchaseOrder(fixture.accountant, id(order), payload))
      .rejects.toMatchObject({ statusCode: 400, message: 'Không đổi RR nguồn của PO' });
  });

  test('UTC-PO-014 rejects an edit based on an older version', async () => {
    const request = await approveRequest(fixture);
    const order = await draftOrder(request);
    const line = lineInput(request, { id: id(order.items[0]), enteredQty: '8' });
    await po.updatePurchaseOrder(fixture.accountant, id(order), editInput(order, request, [line]));
    await expect(po.updatePurchaseOrder(fixture.accountant, id(order), editInput(order, request, [line])))
      .rejects.toMatchObject({
        statusCode: 409, message: 'Chứng từ đã thay đổi, hãy tải lại', details: { currentVersion: 2 },
      });
  });

  test('UTC-PO-015 confirms a valid draft and records its issue time', async () => {
    const draft = await draftOrder();
    await expect(confirm(draft)).resolves.toMatchObject({ workflowStatus: 'OPEN', version: 2 });
    expect((await loadOrder(id(draft))).header.issuedAt).toBeInstanceOf(Date);
  });

  test('UTC-PO-016 rejects confirming an already open PO with a fresh key', async () => {
    const order = await openOrder();
    await expect(confirm(order)).rejects.toMatchObject({ statusCode: 400, message: 'PO không phải nháp có dòng hàng' });
  });

  test('UTC-PO-017 rejects confirmation when the supplier becomes suspended after drafting', async () => {
    const draft = await draftOrder();
    await fixture.supplier.updateOne({ status: 'SUSPENDED' });
    await expect(confirm(draft)).rejects.toMatchObject({ statusCode: 400, message: 'NCC đã ngừng hoạt động' });
    expect((await loadOrder(id(draft))).workflowStatus).toBe('DRAFT');
  });

  test('UTC-PO-018 rejects confirmation when the product becomes inactive after drafting', async () => {
    const draft = await draftOrder();
    await fixture.product.updateOne({ isActive: false });
    await expect(confirm(draft)).rejects.toMatchObject({ statusCode: 400, message: 'Sản phẩm đã ngừng hoạt động' });
    expect((await loadOrder(id(draft))).workflowStatus).toBe('DRAFT');
  });

  test('UTC-PO-019 reschedules a PO and records the previous and new date in the audit log', async () => {
    const order = await openOrder();
    const expectedOn = new Date(`${dateInSaigon(7)}T00:00:00+07:00`).toISOString();
    const input = commandInput(order, { expectedOn, reason: 'Supplier delay' });
    const result = await po.rescheduleExpectedOn(fixture.accountant, id(order), input);
    expect((await loadOrder(id(order))).header.expectedOn.toISOString()).toBe(expectedOn);
    const audit = await models.AuditLog.findOne({
      subjectId: order._id, action: 'RESCHEDULE_PO_EXPECTED_ON', versionAfter: result.version,
    }).orFail();
    expect(audit.reason).toBe(input.reason);
    expect(audit.changes[0]).toMatchObject({
      field: 'header.expectedOn', before: order.header.expectedOn.toISOString(), after: expectedOn,
    });
  });

  test('UTC-PO-020 rejects rescheduling a draft', async () => {
    const draft = await draftOrder();
    await expect(po.rescheduleExpectedOn(fixture.accountant, id(draft), commandInput(draft, {
      expectedOn: `${dateInSaigon(7)}T00:00:00+07:00`, reason: 'Supplier delay',
    }))).rejects.toMatchObject({ statusCode: 400, message: 'PO không còn mở' });
  });

  test('UTC-PO-021 closes a PO when all of its unreceived quantity is short-closed', async () => {
    const { order } = await partialOrder();
    await expect(close(order, '4')).resolves.toMatchObject({ workflowStatus: 'CLOSED' });
    const saved = await loadOrder(id(order));
    expect(saved.header.closedAt).toBeInstanceOf(Date);
    expect(String(saved.items[0].cancelledRemainderQtyBase)).toBe('4');
    const [quantity] = await purchaseOrderQuantities(saved);
    expect(quantity).toMatchObject({ receivedQtyBase: '6', outstandingQtyBase: '0' });
  });

  test('UTC-PO-022 leaves a partially received PO open when some quantity remains', async () => {
    const { order } = await partialOrder();
    await expect(close(order, '2')).resolves.toMatchObject({ workflowStatus: 'PARTIAL' });
    const saved = await loadOrder(id(order));
    expect(String(saved.items[0].cancelledRemainderQtyBase)).toBe('2');
    const [quantity] = await purchaseOrderQuantities(saved);
    expect(quantity.outstandingQtyBase).toBe('2');
  });

  test('UTC-PO-023 rejects short-closing more than the outstanding quantity', async () => {
    const { order } = await partialOrder();
    await expect(close(order, '5')).rejects.toMatchObject({
      statusCode: 400, message: 'Lượng chốt thiếu vượt phần chưa cam kết',
    });
  });

  test('UTC-PO-024 rejects short-closing quantity held by a draft inspection', async () => {
    const order = await openOrder();
    const { inspection } = await inspect(order, '4');
    expect(inspection.workflowStatus).toBe('DRAFT');
    await expect(close(await loadOrder(id(order)), '1')).rejects.toMatchObject({
      statusCode: 400, message: 'PO còn phiếu kiểm nhận nháp. Xác nhận hoặc hủy phiếu kiểm trước khi chốt thiếu',
    });
  });

  test('UTC-PO-025 reopens a short-closed PO after reversing its only receipt', async () => {
    const { order, receipt } = await partialOrder();
    const closed = await close(order, '4');
    await reverseReceipt(fixture.worker, id(receipt), commandInput(receipt, {
      expectedPoVersion: closed.version,
      reason: 'Incorrect delivery receipt',
    }));
    const reversed = await loadOrder(id(order));
    expect(reversed.workflowStatus).toBe('CLOSED');
    await expect(reopen(reversed)).resolves.toMatchObject({ workflowStatus: 'OPEN' });
    const saved = await loadOrder(id(order));
    expect(saved.header.closedAt).toBeUndefined();
    expect(String(saved.items[0].cancelledRemainderQtyBase)).toBe('4');
    const [quantity] = await purchaseOrderQuantities(saved);
    expect(quantity).toMatchObject({ receivedQtyBase: '0', outstandingQtyBase: '6' });
  });

  test('UTC-PO-026 rejects reopening a PO that is already open', async () => {
    const order = await openOrder();
    await expect(reopen(order)).rejects.toMatchObject({ statusCode: 400, message: 'PO không ở trạng thái đã đóng' });
  });

  test('UTC-PO-027 rejects reopening a closed PO with nothing outstanding', async () => {
    const { order } = await partialOrder();
    await close(order, '4');
    await expect(reopen(await loadOrder(id(order)))).rejects.toMatchObject({
      statusCode: 400, message: 'PO không có lượng chưa nhận để mở lại',
    });
  });

  test('UTC-PO-028 cancels an open PO with no receiving work and frees its RR for a new PO', async () => {
    const request = await approveRequest(fixture);
    const draft = await draftOrder(request);
    await confirm(draft);
    const order = await loadOrder(id(draft));
    await expect(cancel(order)).resolves.toMatchObject({ workflowStatus: 'CANCELLED' });
    const saved = await loadOrder(id(order));
    expect(saved.replenishmentRequestId).toBeUndefined();
    const replacement = await create(request);
    expect(replacement).toMatchObject({ workflowStatus: 'DRAFT' });
    expect(replacement.id).not.toBe(id(order));
  });

  test('UTC-PO-029 rejects cancellation when a draft inspection and arrival are linked', async () => {
    const order = await openOrder();
    await inspect(order, '4');
    await expect(cancel(await loadOrder(id(order)))).rejects.toMatchObject({
      statusCode: 400, message: 'PO đã có chứng từ nhận hàng liên kết',
    });
  });

  test('UTC-PO-030 rejects cancellation of a partially received PO', async () => {
    const { order } = await partialOrder();
    await expect(cancel(order)).rejects.toMatchObject({
      statusCode: 400, message: 'Chỉ hủy PO nháp hoặc PO đã phát hành chưa nhận hàng',
    });
  });
});
