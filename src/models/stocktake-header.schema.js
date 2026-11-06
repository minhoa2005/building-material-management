import {
  Schema,
  embeddedOptions,
  ref,
  refs,
  code,
  date,
} from "./model-utils.js";
import { id, opt, revision, warehouse } from "./schema-helpers.js";

import { createStocktakeHeaderScopeSchema } from "./stocktake-header-scope.schema.js";

// Embedded schema; no standalone collection.
export function createStocktakeHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      cutoffAt: date(false),
      completedAt: date(false),
      mode: code(["FROZEN"], { default: "FROZEN" }),
      scopeLocationIds: refs("Location"),
    },
    embeddedOptions,
  );
  schema.add({
    reason: opt(2000),
    plannedAt: date(false),
    scopeVersion: revision(),
    scope: createStocktakeHeaderScopeSchema(),
    assignedCounterIds: refs("User"),
    activatedBy: ref("User", false),
    activatedAt: date(false),
    closedBy: ref("User", false),
    closureReferenceId: id(false),
  });
  return schema;
}
