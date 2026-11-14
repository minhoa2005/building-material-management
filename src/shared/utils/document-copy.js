import { exact } from '../../models/model-utils.js';
import { validationError } from './ApiError.js';
import { newId } from './document-command.js';

export const sourceLink = (document, item, quantity, relationCode = 'SOURCE') => ({
  documentId: document._id, subjectCollection: document.constructor.collection.name,
  ...(item && { itemId: item._id }), ...(quantity != null && { linkedQty: String(quantity) }), relationCode,
});
export function copyItem(source, quantity = source.qtyBase, overrides = {}) {
  let entered = overrides.enteredQty != null ? exact(overrides.enteredQty) : exact(quantity).div(String(source.baseUnitsPerUnit));
  if (entered.decimalPlaces() > 6) {
    // A source whose qtyBase was rounded up from an area unit (enteredQty × factor != qtyBase) keeps qtyBase canonical;
    // its entered quantity is informational, so round it. Any other source must convert exactly.
    const drifted = source.enteredQty != null && !exact(source.enteredQty).mul(String(source.baseUnitsPerUnit)).eq(String(source.qtyBase));
    if (!drifted) throw validationError('Lượng không biểu diễn chính xác theo quy đổi nguồn');
    entered = entered.toDecimalPlaces(6);
  }
  return { _id: newId(), lineNo: source.lineNo, lineKind: 'STANDARD', productId: source.productId,
    lotId: source.lotId, enteredUnit: source.enteredUnit, baseUnitSnapshot: source.baseUnitSnapshot,
    baseUnitsPerUnit: source.baseUnitsPerUnit, enteredQty: entered.toFixed(), qtyBase: String(quantity),
    productNameSnapshot: source.productNameSnapshot, packagingSnapshot: source.packagingSnapshot, ...overrides };
}
