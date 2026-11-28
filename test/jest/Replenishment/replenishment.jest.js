import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import * as models from '../../../src/models/runtime.js';
import * as rr from '../../../src/modules/replenishments/replenishment.commands.js';
import { getReplenishment, listReplenishments } from '../../../src/modules/replenishments/replenishment.service.js';
import { createPurchaseOrder } from '../../../src/modules/purchase-orders/purchase-order.commands.js';
import {
  approveRequest, commandInput, createProduct, createPurchasingFixture, createPurchasingUser,
  createRequest, createWarehouse, dateInSaigon, decisionLine, id, key, purchaseInput,
  purchasingEnabled, requestInput, requestLine, reviewInput, startPurchasingDatabase,
  stopPurchasingDatabase,
} from '../../fixtures/purchasing.js';

jest.setTimeout(30_000);
const suite = purchasingEnabled ? describe : describe.skip;

suite('Replenishment (Report 5.1)', () => {
  let fixture;

  beforeAll(startPurchasingDatabase);
  afterAll(stopPurchasingDatabase);
  beforeEach(async () => { fixture = await createPurchasingFixture(); });

  const create = (overrides) => createRequest(fixture, overrides);
  const submit = (request) => rr.submitReplenishment(fixture.worker, id(request), commandInput(request));
  const review = (request, fields) => rr.reviewReplenishment(fixture.owner, id(request), reviewInput(request, fields));
  const cancel = (request, actor = fixture.worker, reason = 'Duplicate request') =>
    rr.cancelReplenishment(actor, id(request), commandInput(request, { reason }));
  const reload = (request) => models.ReplenishmentRequest.findById(request._id).orFail();
  const submitted = (overrides = {}) => create({ action: 'SUBMIT', ...overrides });

  function updateInput(request, overrides = {}) {
    return commandInput(request, {
      warehouseId: id(fixture.warehouse),
      neededOn: dateInSaigon(),
      triggerReason: request.header.triggerReason,
      lines: request.items.map((item) => requestLine(fixture, {
        id: id(item), productId: String(item.productId), enteredQty: String(item.enteredQty),
      })),
      ...overrides,
    });
  }

  async function twoLines() {
    const second = await createProduct();
    return [requestLine(fixture), requestLine(fixture, { productId: id(second) })];
  }

  test('UTC-RR-001 saves a draft and assigns its warehouse document number', async () => {
    const request = await create();
    expect(request.workflowStatus).toBe('DRAFT');
    expect(request.version).toBe(1);
    expect(request.documentNo).toMatch(new RegExp(`^YCBS-${fixture.warehouse.code}-\\d{6}-\\d{6}$`));
    expect(id(request)).toBe(request.documentNo);
    expect(String(request.createdBy)).toBe(id(fixture.worker));
    expect(request.items).toHaveLength(1);
    expect(String(request.items[0].qtyBase)).toBe('10');
  });

  test('UTC-RR-002 submits a new request and captures its snapshots', async () => {
    const request = await submitted();
    expect(request.workflowStatus).toBe('SUBMITTED');
    expect(request.version).toBe(1);
    expect(request.submissions).toHaveLength(1);
    expect(request.submissions[0]).toMatchObject({
      documentVersion: 1,
      warehouseCodeSnapshot: fixture.warehouse.code,
      lines: [expect.objectContaining({
        productSkuSnapshot: fixture.product.sku,
        baseUomCodeSnapshot: 'PIECE',
        enteredUomCodeSnapshot: 'PIECE',
      })],
    });
  });

  test('UTC-RR-003 rejects yesterday as the need date', async () => {
    await expect(create({ neededOn: dateInSaigon(-1) })).rejects.toMatchObject({
      statusCode: 400, message: 'Ngày cần hàng không được trước hôm nay',
    });
  });

  test('UTC-RR-004 rejects an inactive assigned warehouse', async () => {
    await models.Warehouse.updateOne({ _id: fixture.warehouse._id }, { isActive: false });
    await expect(create()).rejects.toMatchObject({ statusCode: 400, message: 'Kho không hợp lệ' });
  });

  test('UTC-RR-005 rejects an active warehouse outside the worker scope', async () => {
    const other = await createWarehouse(`OTHER${key().slice(-6).toUpperCase()}`);
    await expect(create({ warehouseId: id(other) })).rejects.toMatchObject({
      statusCode: 403, message: 'Bạn không được phân công kho này',
    });
  });

  test('UTC-RR-006 rejects a fractional carton', async () => {
    await expect(create({ lines: [requestLine(fixture, { enteredUnit: 'BOX', enteredQty: '2.5' })] }))
      .rejects.toMatchObject({ statusCode: 400, message: 'Số thùng phải là số nguyên' });
  });

  test('UTC-RR-007 requires acknowledgement when an open request covers the same product', async () => {
    fixture.product.stockThresholds.push({ warehouseId: fixture.warehouse._id, minimumQty: '5', targetQty: '10' });
    await fixture.product.save();
    await create();
    await expect(create({ lines: [requestLine(fixture, { source: { triggerType: 'STOCK_THRESHOLD' } })] }))
      .rejects.toMatchObject({
        statusCode: 409,
        code: 'ERR-RR-409-004',
        details: {
          requiresReview: true,
          latestEvaluations: [expect.objectContaining({ lineNo: 1, warningRequired: true, warnings: ['OPEN_REQUEST'] })],
          invalidLines: [expect.objectContaining({ lineNo: 1 })],
        },
      });
    expect(await models.ReplenishmentRequest.countDocuments({ 'header.warehouseId': fixture.warehouse._id })).toBe(1);
  });

  test('UTC-RR-008 replays the same creation input and rejects a changed payload with the same key', async () => {
    const input = requestInput(fixture);
    const created = await rr.createReplenishment(fixture.worker, input);
    await expect(rr.createReplenishment(fixture.worker, input)).resolves.toEqual({ ...created, replayed: true });
    await expect(rr.createReplenishment(fixture.worker, {
      ...input, lines: [requestLine(fixture, { enteredQty: '20' })],
    })).rejects.toMatchObject({ statusCode: 409, message: 'Operation key đã được dùng với nội dung khác' });
    const requests = await models.ReplenishmentRequest.find({ 'header.warehouseId': fixture.warehouse._id });
    expect(requests.map(id)).toEqual([created.id]);
    expect(String(requests[0].items[0].qtyBase)).toBe('10');
  });

  test('UTC-RR-009 edits the retained line and removes the omitted line', async () => {
    const draft = await create({ lines: await twoLines() });
    const retained = draft.items[0];
    await expect(rr.updateReplenishment(fixture.worker, id(draft), updateInput(draft, {
      lines: [requestLine(fixture, { id: id(retained), enteredQty: '15' })],
    }))).resolves.toMatchObject({ version: 2 });
    const saved = await reload(draft);
    expect(saved.items.map(id)).toEqual([id(retained)]);
    expect(String(saved.items[0].qtyBase)).toBe('15');
  });

  test('UTC-RR-010 hides another creator’s draft during update', async () => {
    const draft = await create();
    const sales = await createPurchasingUser('SALES', fixture.warehouse);
    await expect(rr.updateReplenishment(sales, id(draft), updateInput(draft))).rejects.toMatchObject({
      statusCode: 404, message: 'Không tìm thấy dữ liệu',
    });
  });

  test('UTC-RR-011 rejects edits after submission', async () => {
    const request = await submitted();
    await expect(rr.updateReplenishment(fixture.worker, id(request), updateInput(request)))
      .rejects.toMatchObject({ statusCode: 400, message: 'Yêu cầu không còn được sửa' });
  });

  test('UTC-RR-012 returns the current version for a stale edit', async () => {
    const draft = await create();
    const stale = updateInput(draft);
    await rr.updateReplenishment(fixture.worker, id(draft), updateInput(draft, {
      lines: [requestLine(fixture, { id: id(draft.items[0]), enteredQty: '15' })],
    }));
    await expect(rr.updateReplenishment(fixture.worker, id(draft), stale)).rejects.toMatchObject({
      statusCode: 409, message: 'Chứng từ đã thay đổi, hãy tải lại', details: { currentVersion: 2 },
    });
    expect(String((await reload(draft)).items[0].qtyBase)).toBe('15');
  });

  test('UTC-RR-013 rejects changing the warehouse of a numbered request', async () => {
    const draft = await create();
    const other = await createWarehouse(`OTHER${key().slice(-6).toUpperCase()}`);
    await fixture.worker.updateOne({ $addToSet: { warehouseIds: other._id } });
    await expect(rr.updateReplenishment(fixture.worker, id(draft), updateInput(draft, {
      warehouseId: id(other),
    }))).rejects.toMatchObject({
      statusCode: 400, message: 'Không đổi kho sau khi đã cấp mã yêu cầu; hủy và lập yêu cầu mới',
    });
  });

  test('UTC-RR-014 submits a saved draft and snapshots the new version', async () => {
    const draft = await create();
    await expect(submit(draft)).resolves.toMatchObject({ workflowStatus: 'SUBMITTED', version: 2 });
    const request = await reload(draft);
    expect(String(request.header.submittedBy)).toBe(id(fixture.worker));
    expect(request.submissions.map((snapshot) => snapshot.documentVersion)).toEqual([2]);
  });

  test('UTC-RR-015 rejects submission after the product is deactivated', async () => {
    const draft = await create();
    await fixture.product.updateOne({ isActive: false });
    await expect(submit(draft)).rejects.toMatchObject({ statusCode: 400, message: 'Sản phẩm không hoạt động' });
    const saved = await reload(draft);
    expect(saved).toMatchObject({ workflowStatus: 'DRAFT', version: 1 });
    expect(saved.submissions ?? []).toHaveLength(0);
  });

  test('UTC-RR-016 rejects a second submission with a fresh key', async () => {
    const request = await submitted();
    await expect(submit(request)).rejects.toMatchObject({
      statusCode: 400, message: 'Yêu cầu không thể gửi ở trạng thái hiện tại',
    });
  });

  test('UTC-RR-017 approves the submitted revision and increments the document version', async () => {
    const draft = await create();
    await submit(draft);
    const request = await reload(draft);
    const decision = await review(request);
    expect(decision).toMatchObject({ workflowStatus: 'APPROVED', version: 3 });
    const saved = await reload(draft);
    expect(saved.header.approvedRevision).toBe(2);
    expect(String(saved.header.latestDecisionId)).toBe(decision.decisionId);
    const history = await models.ApprovalHistory.findById(decision.decisionId).orFail();
    expect(history).toMatchObject({ decision: 'APPROVE', subjectRevision: 2 });
    expect(String(history.itemDecisions[0].itemId)).toBe(id(request.items[0]));
    expect(String(history.itemDecisions[0].approvedQtyBase)).toBe('10');
  });

  test('UTC-RR-018 approves a reduced quantity without altering requested quantity', async () => {
    const request = await submitted();
    const decision = await review(request, {
      lines: [decisionLine(request.items[0], { approvedQtyBase: '6', reason: 'Budget' })],
    });
    const saved = await reload(request);
    expect(decision.workflowStatus).toBe('APPROVED');
    expect(String(saved.items[0].approvedQtyBase)).toBe('6');
    expect(String(saved.items[0].qtyBase)).toBe('10');
  });

  test('UTC-RR-019 rejects a submitted request and records the decision', async () => {
    const request = await submitted();
    const decision = await review(request, { decision: 'REJECT', reason: 'No longer needed', lines: [] });
    expect((await reload(request)).workflowStatus).toBe('REJECTED');
    expect(await models.ApprovalHistory.findById(decision.decisionId).orFail())
      .toMatchObject({ decision: 'REJECT' });
  });

  test('UTC-RR-020 rejects self-approval despite both permissions', async () => {
    const dual = await createPurchasingUser('RR_DUAL', fixture.warehouse);
    const request = await createRequest(fixture, { action: 'SUBMIT' }, dual);
    await expect(rr.reviewReplenishment(dual, id(request), reviewInput(request))).rejects.toMatchObject({
      statusCode: 403, message: 'Người duyệt phải khác người lập',
    });
  });

  test('UTC-RR-021 rejects approval of a draft', async () => {
    const draft = await create();
    await expect(review(draft)).rejects.toMatchObject({ statusCode: 400, message: 'Chỉ duyệt yêu cầu đã gửi' });
  });

  test('UTC-RR-022 requires a nonblank decision reason', async () => {
    const request = await submitted();
    await expect(review(request, { decision: 'REJECT', reason: '   ', lines: [] })).rejects.toMatchObject({
      statusCode: 400, message: 'Cần ghi căn cứ quyết định',
    });
  });

  test('UTC-RR-023 requires approving or reducing every request line', async () => {
    const request = await submitted({ lines: await twoLines() });
    await expect(review(request, { lines: [decisionLine(request.items[0])] })).rejects.toMatchObject({
      statusCode: 400, message: 'Phải xét tất cả dòng hàng',
    });
  });

  test.each([
    ['UTC-RR-024', 'approval above the requested quantity', '11', undefined, 'Lượng duyệt vượt lượng đề nghị'],
    ['UTC-RR-025', 'reduced approval without a line reason', '6', undefined, 'Cần lý do cho dòng duyệt giảm số lượng'],
    ['UTC-RR-026', 'approval with all quantities zero', '0', 'Budget', 'Duyệt cần có lượng lớn hơn 0'],
  ])('%s rejects %s', async (_caseId, _title, quantity, reason, message) => {
    const request = await submitted();
    const fields = { approvedQtyBase: quantity, ...(reason && { reason }) };
    await expect(review(request, { lines: [decisionLine(request.items[0], fields)] }))
      .rejects.toMatchObject({ statusCode: 400, message });
    expect((await reload(request)).workflowStatus).toBe('SUBMITTED');
  });

  test('UTC-RR-027 rejects an approval that splits a requested carton', async () => {
    const request = await submitted({ lines: [requestLine(fixture, { enteredUnit: 'BOX', enteredQty: '2' })] });
    await expect(review(request, {
      lines: [decisionLine(request.items[0], { approvedQtyBase: '6', reason: 'Budget' })],
    })).rejects.toMatchObject({ statusCode: 400, message: 'Số thùng duyệt phải là số nguyên' });
  });

  test('UTC-RR-028 allows the creator to cancel a draft with a reason', async () => {
    const draft = await create();
    await expect(cancel(draft)).resolves.toMatchObject({ workflowStatus: 'CANCELLED' });
    const saved = await reload(draft);
    expect(saved.cancelReason).toBe('Duplicate request');
    expect(String(saved.cancelledBy)).toBe(id(fixture.worker));
  });

  test('UTC-RR-029 allows the Owner to cancel an approved RR without a PO', async () => {
    const approved = await approveRequest(fixture);
    await expect(cancel(approved, fixture.owner)).resolves.toMatchObject({ workflowStatus: 'CANCELLED' });
    expect((await reload(approved)).workflowStatus).toBe('CANCELLED');
  });

  test('UTC-RR-030 denies cancellation of an approved RR by its worker', async () => {
    const approved = await approveRequest(fixture);
    await expect(cancel(approved)).rejects.toMatchObject({ statusCode: 403, message: 'Owner xử lý phần đã duyệt' });
  });

  test('UTC-RR-031 rejects cancellation of an approved RR with a linked PO', async () => {
    const approved = await approveRequest(fixture);
    await createPurchaseOrder(fixture.accountant, purchaseInput(fixture, approved));
    await expect(cancel(approved, fixture.owner)).rejects.toMatchObject({
      statusCode: 400, message: 'Yêu cầu đã có PO; xử lý theo luồng PO',
    });
  });

  test('UTC-RR-032 rejects cancellation without a reason', async () => {
    const draft = await create();
    await expect(cancel(draft, fixture.worker, '')).rejects.toMatchObject({
      statusCode: 400, message: 'Cần lý do rút/hủy yêu cầu',
    });
  });

  test('UTC-RR-033 filters the list by creator and warehouse scope', async () => {
    const workerRequest = await create();
    const sales = await createPurchasingUser('SALES', fixture.warehouse);
    const product = await createProduct();
    const salesRequest = await createRequest(fixture, {
      lines: [requestLine(fixture, { productId: id(product) })],
    }, sales);
    const query = { page: 1, limit: 10, warehouseId: id(fixture.warehouse) };
    const listIds = async (actor) => (await listReplenishments(actor, query)).items.map((item) => item.id).sort();
    expect(await listIds(fixture.worker)).toEqual([id(workerRequest)]);
    const all = [id(workerRequest), id(salesRequest)].sort();
    expect(await listIds(fixture.accountant)).toEqual(all);
    expect(await listIds(fixture.owner)).toEqual(all);
  });

  test('UTC-RR-034 hides another creator’s request in detail', async () => {
    const sales = await createPurchasingUser('SALES', fixture.warehouse);
    const request = await createRequest(fixture, {}, sales);
    await expect(getReplenishment(fixture.worker, id(request))).rejects.toMatchObject({
      statusCode: 404, message: 'Không tìm thấy dữ liệu',
    });
  });
});
