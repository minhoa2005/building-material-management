import { Product, ProductBatch } from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { validationError } from './ApiError.js';
import { newId } from './document-command.js';
import { lockLotIdentity } from './lotIdentity.js';

export async function makeItem(input, lineNo, session, { lineKind = 'STANDARD', previous } = {}) {
  const product = await Product.findOne({ _id: input.productId, isActive: true }).session(session);
  if (!product) throw validationError('Sản phẩm không tồn tại hoặc đã ngừng sử dụng');
  const enteredUnit = input.enteredUnit;
  let factor;
  let packagingSnapshot;
  let batch;
  if (input.lotId) {
    batch = await ProductBatch.findOne({ _id: input.lotId, productId: product._id, identificationStatus: 'VERIFIED' }).session(session);
    if (!batch) throw validationError('Lô chưa xác minh hoặc không thuộc sản phẩm');
    await lockLotIdentity(batch._id, session);
    packagingSnapshot = { packageUnit: 'BOX', baseUnitsPerPackage: String(batch.piecesPerCarton),
      outerLengthMm: batch.cartonLengthMm, outerWidthMm: batch.cartonWidthMm, outerHeightMm: batch.cartonHeightMm };
  }
  if (previous && String(previous.productId) === String(product._id) && previous.enteredUnit === enteredUnit && String(previous.lotId??'') === String(input.lotId??'')) {
    factor = exact(previous.baseUnitsPerUnit);
    packagingSnapshot = previous.packagingSnapshot;
  } else if (enteredUnit === product.baseUnit) factor = exact('1');
  else if (['BOX','Thùng'].includes(enteredUnit) && batch) factor = exact(String(batch.piecesPerCarton));
  else if (['M2','m²'].includes(enteredUnit) && ['PIECE','Viên'].includes(product.baseUnit)) factor = exact('1000000').div(exact(product.lengthMm).mul(String(product.widthMm)));
  else throw validationError('Đơn vị cần có quy đổi xác minh theo sản phẩm hoặc lô');
  if (factor.decimalPlaces() > 12) throw validationError('Quy đổi không biểu diễn chính xác; nhập số viên hoặc thùng');
  const quantity = exact(input.enteredQty).mul(factor);
  if (!quantity.gt(0) || quantity.decimalPlaces() > 6 || quantity.gte('100000000000000') || (product.wholeBaseUnits && !quantity.isInteger())) throw validationError('Số lượng phải quy đổi chính xác sang đơn vị gốc');
  return { _id: previous?._id ?? newId(), lineNo, lineKind, productId: product._id, lotId: batch?._id,
    enteredUnit, baseUnitSnapshot: previous?.baseUnitSnapshot ?? product.baseUnit,
    baseUnitsPerUnit: factor.toFixed(), enteredQty: input.enteredQty, qtyBase: quantity.toFixed(),
    productNameSnapshot: previous?.productNameSnapshot ?? product.name, packagingSnapshot };
}
