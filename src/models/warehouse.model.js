import {
  Schema,
  options,
  model,
  text,
  ref,
  code,
  rules,
} from "./model-utils.js";

const warehouseSchema = new Schema(
  {
    code: text(30, { unique: true }),
    name: text(160),
    address: text(500, { required: false }),
    isActive: { type: Boolean, required: true, default: true },
  },
  options("warehouses"),
);

const locationSchema = new Schema(
  {
    warehouseId: ref("Warehouse"),
    code: text(50),
    kind: code(["RECEIVING", "STORAGE", "STAGING", "QUARANTINE", "CUSTODY"]),
    allocatable: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
  },
  options("locations"),
);
locationSchema.index({ warehouseId: 1, code: 1 }, { unique: true });
rules(locationSchema, function validateAllocatableLocation() {
  if (this.allocatable && this.kind !== "STORAGE") {
    this.invalidate("allocatable", "Only STORAGE locations can be allocatable");
  }
});

export const Warehouse = model("Warehouse", warehouseSchema);
export const Location = model("Location", locationSchema);
