import { z } from "zod";
import { normalizeCode, objectIdString } from "../../shared/utils/domain.js";

const positiveInteger = (fallback, max = Number.MAX_SAFE_INTEGER) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, "Phải là số nguyên dương")
    .transform(Number)
    .pipe(z.number().int().min(1).max(max))
    .default(fallback);

const emptyQuery = z.object({}).strict();
const optionalText = (max, extra = {}) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value == null || value === "" ? null : value))
    .pipe(z.string().max(max).nullable().optional())
    .superRefine((value, ctx) => {
      if (value != null && extra.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        ctx.addIssue({ code: "custom", message: "Email không hợp lệ" });
      }
    });

const expectedVersion = z
  .number()
  .int()
  .min(1)
  .max(Number.MAX_SAFE_INTEGER);

const contactShape = {
  phone: optionalText(30),
  email: optionalText(254, { email: true }),
  address: optionalText(500),
  
  contactName: optionalText(160),
  taxCode: optionalText(50),
  notes: optionalText(2000),
  
};

export const listSuppliersSchema = z.object({
  params: emptyQuery,
  body: emptyQuery,
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
      search: z.string().trim().max(100).optional(),
      status: z
        .enum(["ACTIVE", "SUSPENDED", "TERMINATED"])
        .optional(),
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
});

export const supplierIdSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: emptyQuery,
});

export const createSupplierSchema = z.object({
  params: emptyQuery,
  query: emptyQuery,
  body: z
    .object({
      code: z
        .string()
        .trim()
        .min(1)
        .max(40)
        .transform(normalizeCode),
      name: z.string().trim().min(1).max(200),
      ...contactShape,
    })
    .strict(),
});

export const updateSupplierSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedUpdatedAt: z.string().datetime({ offset: true }),
      name: z.string().trim().min(1).max(200),
      ...contactShape,
    })
    .strict(),
});

export const changeSupplierStatusSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedUpdatedAt: z.string().datetime({ offset: true }),
      status: z.enum(["ACTIVE", "SUSPENDED", "TERMINATED"]),
      reason: z.string().trim().min(1).max(2000),
    })
    .strict(),
});

export const supplierHistorySchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  body: emptyQuery,
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
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
});

export const supplierDocumentsSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  body: emptyQuery,
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
      kind: z.enum(["PO", "GR_PURCHASE", "SUPPLIER_RETURN"]),
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
});
