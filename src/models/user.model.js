import { Schema, options, text, ref, refs } from "./model-utils.js";
import { optionalText, version, active, uniqueCode } from "./schema-helpers.js";

// Collection: users
export function createUserSchema() {
  const users = new Schema(
    {
      username: uniqueCode(),
      fullName: text(160),
      passwordHash: text(255, { select: false, trim: false }),
      roleId: ref("Role"),
      warehouseIds: refs("Warehouse"),
      phone: optionalText(30),
      email: optionalText(254),
      isActive: active(),
      lockReason: optionalText(2000),
      version: version(),
    },
    options("users"),
  );
  return users;
}
