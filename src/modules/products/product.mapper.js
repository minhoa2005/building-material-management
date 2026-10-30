import {
  decimalString,
  idString,
  isoDate,
} from "../../shared/utils/domain.js";

export function mapUom(value, uoms) {
  if (value == null) return null;
  const uom = uoms.get(idString(value));
  return {
    id: idString(value),
    code: uom?.code ?? null,
    name: uom?.name ?? null,
  };
}

export function mapConversion(conversion, uoms) {
  if (!conversion) return null;
  return {
    id: idString(conversion._id),
    uom: mapUom(conversion.uomId, uoms),
    version: conversion.version,
    basePerUnit: decimalString(conversion.basePerUnit),
    validFrom: isoDate(conversion.validFrom),
    createdBy: idString(conversion.createdBy),
    verificationReference: conversion.verificationReference ?? null,
  };
}

export function mapProductSummary(product, uoms) {
  return {
    id: idString(product._id),
    sku: product.sku,
    name: product.name,
    category: product.category ?? null,
    brand: product.brand ?? null,
    nominalSize: product.nominalSize ?? null,
    baseUom: mapUom(product.baseUomId, uoms),
    isActive: product.isActive,
    version: product.version,
  };
}

export function mapProductDetail(product, uoms, currentConversions = []) {
  return {
    ...mapProductSummary(product, uoms),
    wholeBaseUnits: product.wholeBaseUnits,
    material: product.material ?? null,
    surface: product.surface ?? null,
    lengthMm: decimalString(product.lengthMm),
    widthMm: decimalString(product.widthMm),
    thicknessMm: decimalString(product.thicknessMm),
    origin: product.origin ?? null,
    description: product.description ?? null,
    currentConversions: currentConversions.map((conversion) =>
      mapConversion(conversion, uoms),
    ),
    createdAt: isoDate(product.createdAt),
    updatedAt: isoDate(product.updatedAt),
  };
}

export function mapPolicy(policy, warehouse) {
  return {
    id: idString(policy._id),
    productId: idString(policy.productId),
    warehouse: {
      id: idString(policy.warehouseId),
      code: warehouse?.code ?? null,
      name: warehouse?.name ?? null,
      isActive: warehouse?.isActive ?? null,
    },
    minimumQtyBase: decimalString(policy.minimumQty),
    targetQtyBase: decimalString(policy.targetQty),
    version: policy.version,
    updatedBy: idString(policy.updatedBy),
    updatedAt: isoDate(policy.updatedAt),
  };
}