import { z } from "zod";
import {
  decimalStringSchema,
  normalizeCode,
  objectIdString,
} from "../../shared/utils/domain.js";

const positiveInteger = (fallback, max = Number.MAX_SAFE_INTEGER) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, "Phải là số nguyên dương")
    .transform(Number)
    .pipe(z.number().int().min(1).max(max))
    .default(fallback);

const emptyQuery = z.object({}).strict();
const optionalText = (max) =>
  z.string().trim().min(1).max(max).nullable().optional();
const expectedVersion = (minimum = 1) =>
  z.number().int().min(minimum).max(Number.MAX_SAFE_INTEGER);

const dimension = decimalStringSchema({
  scale: 6,
  precision: 20,
  positive: true,
  label: "Kích thước",
}).optional();

const metadataShape = {
  name: z.string().trim().min(1).max(200),
  nominalSize: optionalText(60),
  category: optionalText(100),
  brand: optionalText(100),
  material: optionalText(100),
  surface: optionalText(100),
  lengthMm: dimension,
  widthMm: dimension,
  thicknessMm: dimension,
  origin: optionalText(100),
  description: optionalText(2000),
};

const pairedDimensions = (value, ctx) => {
  if (Boolean(value.lengthMm) !== Boolean(value.widthMm)) {
    ctx.addIssue({
      code: "custom",
      path: ["widthMm"],
      message: "Chiều dài và chiều rộng phải cùng có hoặc cùng không có",
    });
  }
};

export const listProductsSchema = z.object({
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
      search: z.string().trim().max(100).optional(),
      nominalSize: z.string().trim().max(60).optional(),
      isActive: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),
      sortBy: z.enum(["createdAt", "sku", "name"]).default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .strict()
    .superRefine((query, ctx) => {
      if (!Number.isSafeInteger((query.page - 1) * query.limit)) {
        ctx.addIssue({
          code: "custom",
          path: ["page"],
          message: "Trang vượt giới hạn hỗ trợ",
        });
      }
    }),
  params: emptyQuery,
  body: emptyQuery,
});

export const productIdSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: emptyQuery,
});

export const createProductSchema = z.object({
  body: z
    .object({
      sku: z
        .string()
        .trim()
        .min(1)
        .max(60)
        .transform(normalizeCode),
      ...metadataShape,
      baseUomId: objectIdString,
      wholeBaseUnits: z.boolean().optional().default(true),
    })
    .strict()
    .superRefine(pairedDimensions),
  query: emptyQuery,
  params: emptyQuery,
});

export const updateProductSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion: expectedVersion(),
      ...metadataShape,
    })
    .strict()
    .superRefine(pairedDimensions),
});

export const changeProductStatusSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion: expectedVersion(),
      isActive: z.boolean(),
      reason: z.string().trim().min(1).max(2000),
    })
    .strict(),
});

const utcIsoDateTime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,
    "validFrom phải là ISO datetime có múi giờ",
  )
  .refine((value) => Number.isFinite(Date.parse(value)), "validFrom không hợp lệ");

export const createConversionSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedProductVersion: expectedVersion(),
      uomId: objectIdString,
      basePerUnit: decimalStringSchema({
        scale: 12,
        precision: 24,
        positive: true,
        label: "Hệ số quy đổi",
      }),
      validFrom: utcIsoDateTime,
      verificationReference: z.string().trim().min(1).max(2000),
    })
    .strict(),
});

export const conversionHistorySchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
      uomId: objectIdString.optional(),
    })
    .strict()
    .superRefine((query, ctx) => {
      if (!Number.isSafeInteger((query.page - 1) * query.limit)) {
        ctx.addIssue({
          code: "custom",
          path: ["page"],
          message: "Trang vượt giới hạn hỗ trợ",
        });
      }
    }),
  body: emptyQuery,
});

export const configurePolicySchema = z.object({
  params: z
    .object({ id: objectIdString, warehouseId: objectIdString })
    .strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion: expectedVersion(0),
      minimumQtyBase: decimalStringSchema({
        label: "Lượng tối thiểu",
      }),
      targetQtyBase: decimalStringSchema({
        label: "Lượng mục tiêu",
      }).optional(),
    })
    .strict(),
});

export const listPoliciesSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: emptyQuery,
});

export const productOptionsSchema = z.object({
  params: emptyQuery,
  query: emptyQuery,
  body: emptyQuery,
});