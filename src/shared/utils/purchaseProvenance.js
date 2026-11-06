import { ReceiptPlacement } from '../../models/legacy/index.js';
import { exact } from '../../models/model-utils.js';
import { ApiError } from './ApiError.js';

// Conservative until relocation can carry per-receipt allocations itself.
export async function rejectUntrackedPurchaseRelocation(balanceId, session) {
  const sources = await ReceiptPlacement.find({ sourceBalanceId: balanceId }).session(session).lean();
  if (sources.some(p => exact(p.receivedQtyBase).minus(exact(p.reversedQtyBase)).minus(exact(p.placedQtyBase)).gt(0))) {
    throw new ApiError(409, 'Nguồn nhận mua phải đi qua put-away để giữ truy vết GR', { code: 'ERR-REC-PROVENANCE' });
  }
}
