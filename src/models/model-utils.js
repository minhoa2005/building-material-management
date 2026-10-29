import mongoose from "mongoose";
import Decimal from "decimal.js";

// Decimal128 has 34 significant digits. Intermediate products need extra precision.
export const ExactDecimal = Decimal.clone({
  precision: 80,
  rounding: Decimal.ROUND_HALF_UP,
});
export const { Schema } = mongoose;

export const options = (collection, extra = {}) => ({
  collection,
  timestamps: true,
  versionKey: false,
  strict: "throw",
  ...extra,
});
export const embeddedOptions = {
  _id: false,
  versionKey: false,
  strict: "throw",
};
export const model = (name, schema) =>
  mongoose.models[name] || mongoose.model(name, schema);
export const text = (maxlength, extra = {}) => ({
  type: String,
  required: true,
  trim: true,
  maxlength,
  ...extra,
});
export const ref = (name, required = true, extra = {}) => ({
  type: Schema.Types.ObjectId,
  ref: name,
  required,
  ...extra,
});
export const integer = (min = 0, extra = {}) => ({
  type: Number,
  required: true,
  min,
  validate: {
    validator: Number.isSafeInteger,
    message: "{PATH} must be a safe integer",
  },
  ...extra,
});
export const code = (values, extra = {}) => ({
  type: String,
  required: true,
  enum: values,
  ...extra,
});
export const date = (required = true, extra = {}) => ({
  type: Date,
  required,
  ...extra,
});
export const sameId = (left, right) =>
  left != null && right != null && String(left) === String(right);
export const exact = (value) => new ExactDecimal(value.toString());

export function decimal({
  positive = false,
  signed = false,
  nonzero = false,
  scale = 6,
  precision = 20,
  ...extra
} = {}) {
  return {
    type: Schema.Types.Decimal128,
    required: true,
    // Fractions must enter as strings/Decimal128, never through a JS float.
    set(value) {
      if (typeof value === "number" && !Number.isSafeInteger(value)) {
        throw new TypeError(
          "Use a decimal string or Decimal128 for fractional quantities",
        );
      }
      return value;
    },
    validate: {
      validator(value) {
        if (value == null) return true; // required handles absence
        try {
          const n = exact(value);
          return (
            n.isFinite() &&
            n.decimalPlaces() <= scale &&
            n.abs().lt(new ExactDecimal(10).pow(precision - scale)) &&
            (signed || (positive ? n.gt(0) : n.gte(0))) &&
            (!nonzero || !n.isZero())
          );
        } catch {
          return false;
        }
      },
      message: `{PATH} must be a finite ${precision},${scale} decimal${positive ? " > 0" : signed ? "" : " >= 0"}${nonzero ? " and nonzero" : ""}`,
    },
    ...extra,
  };
}

export const uniqueValues = (values) =>
  new Set(values.map(String)).size === values.length;
export const refs = (name) => ({
  type: [ref(name)],
  default: [],
  validate: {
    validator: uniqueValues,
    message: "{PATH} must not contain duplicate IDs",
  },
});

export function rules(schema, validate) {
  schema.pre("validate", function validateLocalRules() {
    validate.call(this);
  });
  return schema;
}

// Guards the normal Mongoose API. Raw collection access/DB permissions and
// transactional, cross-collection rules still belong to the persistence service.
export function appendOnly(schema) {
  schema.set("timestamps", { createdAt: true, updatedAt: false });
  schema.pre("save", function preventHistoryRewrite() {
    if (!this.isNew)
      throw new Error(`${this.constructor.modelName} is append-only`);
  });
  schema.pre(
    [
      "updateOne",
      "updateMany",
      "replaceOne",
      "findOneAndUpdate",
      "findOneAndReplace",
      "deleteOne",
      "deleteMany",
      "findOneAndDelete",
    ],
    { document: true, query: true },
    function preventHistoryMutation() {
      throw new Error(
        "This model is append-only; create a correction record instead",
      );
    },
  );
  schema.pre("bulkWrite", function preventBulkHistoryMutation(operations) {
    if (
      operations.some((operation) => !Object.hasOwn(operation, "insertOne"))
    ) {
      throw new Error(
        "This model is append-only; bulkWrite only supports insertOne",
      );
    }
  });
  return schema;
}

export function discriminators(base, definitions) {
  for (const [value, shape] of Object.entries(definitions)) {
    if (base.discriminators?.[`${base.modelName}_${value}`]) continue;
    const schema = new Schema(shape, { strict: "throw", versionKey: false });
    base.discriminator(`${base.modelName}_${value}`, schema, { value });
  }
  return base;
}
