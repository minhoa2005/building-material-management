import { Schema, options, text } from "./model-utils.js";
import { optionalText, active } from "./schema-helpers.js";

// Collection: categories
export function createCategorySchema() {
  const schema = new Schema(
    {
      code: text(60, { immutable: true, unique: true }),
      name: text(160),
      description: optionalText(1000),
      isActive: active(),
    },
    options("categories"),
  );
  return schema;
}
