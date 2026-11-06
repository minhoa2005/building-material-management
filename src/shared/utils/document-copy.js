import { exact } from '../../models/model-utils.js';
import { validationError } from './ApiError.js';
import { newId } from './document-command.js';

export const sourceLink = (document, item, quantity, relationCode = 'SOURCE') => ({
  documentId: document._id, subjectCollection: document.constructor.collection.name,
  ...(item && { itemId: item._id }), ...(quantity != null && { linkedQty: String(quantity) }), relationCode,
});
export function copyItem(source, quantity = source.qtyBase, overrides = {}) {
  const entered = exact(quantity).div(String(source.baseUnitsPerUnit));
  if (entered.decimalPlaces() > 6) throw validationError('Lượng không biểu diễn chính xác theo quy đổi nguồn');
  return { _id: newId(), lineNo: source.lineNo, lineKind: 'STANDARD', productId: source.productId,
    lotId: source.lotId, enteredUnit: source.enteredUnit, baseUnitSnapshot: source.baseUnitSnapshot,
    baseUnitsPerUnit: source.baseUnitsPerUnit, enteredQty: entered.toFixed(), qtyBase: String(quantity),
    productNameSnapshot: source.productNameSnapshot, packagingSnapshot: source.packagingSnapshot, ...overrides };
}
