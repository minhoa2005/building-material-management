import { Schema, embeddedOptions, text, refs } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createApprovalHistoryAuthoritySnapshotSchema() {
  const schema = new Schema(
    {
      roleCode: text(60),
      permissionCode: text(100),
      warehouseIds: refs("Warehouse"),
    },
    embeddedOptions,
  );
  return schema;
}
