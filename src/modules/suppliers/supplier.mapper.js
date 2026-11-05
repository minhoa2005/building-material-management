import {
  idString,
  isoDate,
} from "../../shared/utils/domain.js";

export function supplierStatus(party) {
  return (
    party.cooperationStatus ??
    (party.isActive === false ? "SUSPENDED" : "ACTIVE")
  );
}

export function mapSupplierSummary(party) {
  return {
    id: idString(party._id),
    code: party.code,
    name: party.name,
    contact: {
      phone: party.phone ?? null,
      email: party.email ?? null,
      contactPerson: party.contactPerson ?? null,
    },
    cooperationStatus: supplierStatus(party),
    isActive: party.isActive,
    version: party.version ?? 1,
    createdAt: isoDate(party.createdAt),
  };
}

export function mapSupplierDetail(party) {
  return {
    ...mapSupplierSummary(party),
    address: party.address ?? null,
    taxCode: party.taxCode ?? null,
    notes: party.notes ?? null,
    statusReason: party.statusReason ?? null,
    updatedAt: isoDate(party.updatedAt),
  };
}

export function mapSupplierDocument(document, warehouse) {
  return {
    id: idString(document._id),
    documentNo: document.documentNo,
    documentKind: document.documentKind,
    workflowStatus: document.workflowStatus,
    version: document.version,
    warehouse: document.header?.warehouseId
      ? {
          id: idString(document.header.warehouseId),
          code: warehouse?.code ?? null,
          name: warehouse?.name ?? null,
        }
      : null,
    documentDate: isoDate(
      document.header?.expectedOn ?? document.occurredAt ?? document.createdAt,
    ),
    createdAt: isoDate(document.createdAt),
  };
}