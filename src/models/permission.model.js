import { Schema, options, text, code } from "./model-utils.js";
import { optionalText, active } from "./schema-helpers.js";

// Collection: permissions
export function createPermissionSchema() {
  const permissions = new Schema(
    {
      code: text(100, { unique: true, immutable: true }),
      name: text(250),
      description: optionalText(500),
      featureCode: optionalText(30),
      isActive: active(),
    },
    options("permissions"),
  );
  return permissions;
}
