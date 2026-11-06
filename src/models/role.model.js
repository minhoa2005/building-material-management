import { Schema, options, text, refs, code } from "./model-utils.js";
import { optionalText, version, active, uniqueCode } from "./schema-helpers.js";

// Collection: roles
export function createRoleSchema() {
  const roles = new Schema(
    {
      code: uniqueCode(),
      name: text(160),
      description: optionalText(500),
      permissionIds: refs("Permission"),
      isSystemRole: { type: Boolean, default: false },
      isActive: active(),
      version: version(),
    },
    options("roles"),
  );
  return roles;
}
