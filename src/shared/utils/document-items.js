import { Product, ProductBatch } from '../../models/runtime.js';
import { resolveConversion } from './conversions.js';
import { exact } from '../../models/model-utils.js';
import { validationError } from './ApiError.js';
import { newId } from './document-command.js';
import { lockLotIdentity } from './lotIdentity.js';

export async function makeItem(input, lineNo, session, { lineKind = 'STANDARD', previous, includeLotLabel = false, allowInactiveUom = false } = {}) {
  const product = await Product.findOne({ _id: input.productId, isActive: true }).session(session);
  if (!product) throw validationError('Sản phẩm không tồn tại hoặc đã ngừng sử dụng');
  const enteredUnit = input.enteredUnit;
  const reuseSnapshot = previous && String(previous.productId) === String(product._id) &&
    previous.enteredUnit === enteredUnit && String(previous.lotId ?? '') === String(input.lotId ?? '');
  let factor;
  let packagingSnapshot;
  let batch;
  if (input.lotId) {
    batch = await ProductBatch.findOne({ _id: input.lotId, productId: product._id, identificationStatus: 'VERIFIED' }).session(session);
    if (!batch) throw validationError('Lô chưa xác minh hoặc không thuộc sản phẩm');
    await lockLotIdentity(batch._id, session);
    packagingSnapshot = { packageUnit: 'Thùng', baseUnitsPerPackage: String(batch.piecesPerCarton),
      outerLengthMm: batch.cartonLengthMm, outerWidthMm: batch.cartonWidthMm, outerHeightMm: batch.cartonHeightMm };
  }
  if (reuseSnapshot) {
    factor = exact(previous.baseUnitsPerUnit);
    packagingSnapshot = previous.packagingSnapshot;
  } else {
    factor = await resolveConversion(product, batch, enteredUnit, session, { allowInactiveUom });
  }
  const quantity = exact(input.enteredQty).mul(factor);
  if (!quantity.gt(0) || quantity.decimalPlaces() > 6 || quantity.gte('100000000000000') || (product.wholeBaseUnits && !quantity.isInteger())) throw validationError('Số lượng phải quy đổi chính xác sang đơn vị gốc');
  return { _id: previous?._id ?? newId(), lineNo, lineKind, productId: product._id, lotId: batch?._id,
    enteredUnit, baseUnitSnapshot: reuseSnapshot ? previous.baseUnitSnapshot : product.baseUnit,
    baseUnitsPerUnit: factor.toFixed(), enteredQty: input.enteredQty, qtyBase: quantity.toFixed(),
    productNameSnapshot: reuseSnapshot ? previous.productNameSnapshot : product.name,
    ...(includeLotLabel && { lotLabelSnapshot: batch?.manufacturerLot }), packagingSnapshot };
}
