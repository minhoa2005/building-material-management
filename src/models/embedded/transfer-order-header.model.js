import { Schema, embeddedOptions, ref, code, date } from "../model-utils.js";
import { opt, warehouse } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createTransferOrderHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      taskKind: code(["PUTAWAY", "PICK", "RELOCATE", "QUARANTINE", "UNPICK"]),
      assignedTo: ref("User"),
    },
    embeddedOptions,
  );
  schema.add({
    requirementId: ref("InternalTransferRequirement", false),
    reason: opt(2000),
    confirmedBy: ref("User", false),
    confirmedAt: date(false),
  });
  return schema;
}
