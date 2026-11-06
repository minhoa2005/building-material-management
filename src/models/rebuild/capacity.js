import { exact } from '../model-utils.js';

// Upright cartons may turn horizontally; do not assume the goods can be tipped.
export function estimateCartonCapacity(location, warehouse, batch, occupiedVolumeMm3='0') {
  const L=exact(location.usableLengthMm),W=exact(location.usableWidthMm),H=exact(warehouse.clearHeightMm);
  const l=exact(batch.cartonLengthMm),w=exact(batch.cartonWidthMm),h=exact(batch.cartonHeightMm);
  if ([L,W,H,l,w,h].some(value=>!value.isFinite()||value.lte(0))) throw new Error('Positive bin/carton dimensions required');
  const used=exact(occupiedVolumeMm3);
  if(!used.isFinite()||used.lt(0))throw new Error('Invalid occupied volume');
  const a=L.div(l).floor().mul(W.div(w).floor()).mul(H.div(h).floor());
  const b=L.div(w).floor().mul(W.div(l).floor()).mul(H.div(h).floor());
  const grid=a.gte(b)?a:b,spare=L.mul(W).mul(H).minus(used);
  const byVolume=spare.gt(0)?spare.div(l.mul(w).mul(h)).floor():exact(0);
  return {fits:grid.gt(0),cartonsInEmptyBinByGrid:grid.toFixed(0),
    additionalCartonsUpperBound:(byVolume.lte(grid)?byVolume:grid).toFixed(0)};
}

export function assertBatchPackaging(batch,packaging) {
  const pairs=[['piecesPerCarton','baseUnitsPerPackage'],['cartonLengthMm','outerLengthMm'],
    ['cartonWidthMm','outerWidthMm'],['cartonHeightMm','outerHeightMm']];
  for(const [a,b] of pairs) if(batch[a]==null||packaging?.[b]==null||!exact(batch[a]).eq(String(packaging[b]))) {
    throw new Error('Carton packaging differs from fixed batch specification');
  }
}

// Pure validation. A write service must call this with the post-operation balances
// inside its stock transaction and conditionally update the location version.
export function checkBinCapacity(data) {
  const used = new Map();
  const find = (name, id) => data[name].find(row => String(row._id) === String(id));
  for (const balance of data.inventory_balances) {
    const point = find('stock_holding_points', balance.holdingPointId);
    if (!point) throw new Error('Missing holding point');
    if (point.type !== 'LOCATION') continue;
    const location = find('warehouse_locations', point.locationId);
    const warehouse = location && find('warehouses', location.warehouseId);
    if (exact(balance.quantityBase).gt(0) && (!location?.usableLengthMm || !location.usableWidthMm || !warehouse?.clearHeightMm)) throw new Error('Bin capacity dimensions required');
    const batch=find('product_batches',balance.batchId);
    if(!batch)throw new Error('Missing product batch');
    let qty = exact(0), volume = exact(0);
    for (const portion of balance.packagingPortions || []) {
      qty = qty.plus(String(portion.quantityBase));
      if(portion.packagingState==='SEALED') {
        assertBatchPackaging(batch,portion.packagingSnapshot);
        if(!estimateCartonCapacity(location,warehouse,batch).fits)throw new Error('Carton dimensions do not fit bin');
      }
      if (portion.measuredVolumeMm3 != null) {
        volume = volume.plus(String(portion.measuredVolumeMm3));
      } else {
        const p = portion.packagingSnapshot;
        if (portion.packagingState !== 'SEALED' || !p?.outerLengthMm || !p.outerWidthMm || !p.outerHeightMm) throw new Error('Packaging volume measurement required');
        if (!exact(portion.quantityBase).eq(exact(p.baseUnitsPerPackage).mul(portion.sealedPackCount))) throw new Error('Sealed carton quantity mismatch');
        volume = volume.plus(exact(p.outerLengthMm).mul(String(p.outerWidthMm)).mul(String(p.outerHeightMm)).mul(portion.sealedPackCount));
      }
      volume = volume.plus(String(portion.extraOccupiedVolumeMm3 || 0));
    }
    if (!qty.eq(String(balance.quantityBase))) throw new Error('Packaging quantity differs from physical balance');
    if (volume.lt(0)) throw new Error('Invalid occupied volume');
    if (qty.gt(0) && (!location?.usableLengthMm || !location.usableWidthMm || !warehouse?.clearHeightMm)) throw new Error('Bin capacity dimensions required');
    const key = String(location._id);
    used.set(key, (used.get(key) || exact(0)).plus(volume));
    if (qty.gt(0) && used.get(key).gt(exact(location.usableLengthMm).mul(location.usableWidthMm).mul(warehouse.clearHeightMm))) throw new Error('Bin capacity exceeded');
  }
  return used;
}
