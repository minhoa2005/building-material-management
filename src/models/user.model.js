import { Schema, options, model, text, ref, refs } from "./model-utils.js";

const userSchema = new Schema(
  {
    username: text(100, { unique: true }),
    // Retain the existing API names: SQL display_name/credential_hash/active.
    fullName: text(160),
    passwordHash: text(255, { trim: false, select: false }),
    roleId: ref("Role", true, {
      index: true,
      set(value) {
        if (Array.isArray(value)) throw new TypeError('roleId must be a single Role reference');
        return value;
      },
    }),
    warehouseIds: refs("Warehouse"),
    phone: text(30, { required: false }),
    isActive: { type: Boolean, default: true, required: true },
  },
  options("users"),
);

export const User = model("User", userSchema);
