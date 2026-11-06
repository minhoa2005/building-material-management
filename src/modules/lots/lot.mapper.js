import {
  idString,
  isoDate,
} from "../../shared/utils/domain.js";

export function mapLotSummary(lot, product, hasScopedStock = false) {
  return {
    id: idString(lot._id),
    product: product
      ? {
          id: idString(product._id),
          sku: product.sku,
          name: product.name,
        }
      : { id: idString(lot.productId), sku: null, name: null },
    manufacturerLot: lot.manufacturerLot,
    tone: lot.tone,
    calibre: lot.calibre,
    identificationStatus: lot.identificationStatus,
    manufacturedOn: isoDate(lot.manufacturedOn),
    verificationReference: lot.verificationReference ?? null,
    identityLocked: lot.identityLocked === true,
    version: lot.version ?? 1,
    hasScopedStock,
    createdAt: isoDate(lot.createdAt),
  };
}

export function mapLotDetail(lot, product, stock) {
  return {
    ...mapLotSummary(lot, product, stock.length > 0),
    notes: lot.notes ?? null,
    verifiedBy: idString(lot.verifiedBy),
    verifiedAt: isoDate(lot.verifiedAt),
    updatedAt: isoDate(lot.updatedAt),
    stock,
  };
}

export function mapScopedStock(balance, account, location, warehouse, party) {
  return {
    balanceId: idString(balance._id),
    qtyBase: balance.qtyBase.toString(),
    version: balance.version,
    warehouse: warehouse
      ? {
          id: idString(warehouse._id),
          code: warehouse.code,
          name: warehouse.name,
        }
      : null,
    location: location
      ? {
          id: idString(location._id),
          code: location.code,
          name: location.name,
        }
      : null,
    accountId: idString(account._id),
    qualityCode: balance.qualityCode,
    ownerParty: party
      ? {
          id: idString(party._id),
          code: party.code,
          name: party.name,
          kind: party.kind,
        }
      : { id: idString(balance.ownerPartyId), code: null, name: null, kind: null },
  };
}