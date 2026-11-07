import { z } from "zod";
import { decimalStringSchema } from "../../shared/utils/domain.js";

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "ObjectId không hợp lệ");
const positiveInteger = (fallback, max = Number.MAX_SAFE_INTEGER) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, "Phải là số nguyên dương")
    .transform(Number)
    .pipe(z.number().int().min(1).max(max))
    .default(fallback);
const integerFromPath = z
  .string()
  .regex(/^[1-9]\d*$/, "Version phải là số nguyên dương")
  .transform(Number)
  .pipe(z.number().int().min(1).max(Number.MAX_SAFE_INTEGER));
const expectedVersion = z
  .number()
  .int()
  .min(1)
  .max(Number.MAX_SAFE_INTEGER);
const operationKey = z.string().trim().min(1).max(160);
const creationKey = z.string().trim().min(1).max(160);
const reasonNote = z.string().trim().min(1).max(2000);
const optionalNote = z
  .string()
  .trim()
  .max(2000)
  .nullable()
  .optional()
  .transform((value) => (value == null || value === "" ? null : value));
const lineQty = decimalStringSchema({
  scale: 6,
  precision: 20,
  positive: true,
  label: "Số lượng",
});
const approvedQty = decimalStringSchema({
  scale: 6,
  precision: 20,
  label: "Lượng duyệt",
});

const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có dạng YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Ngày không hợp lệ");

const emptyQuery = z.object({}).strict();
const pageQuery = z
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
  });

export const listQuerySchema = z
  .object({
    page: positiveInteger(1),
    limit: positiveInteger(10, 100),
    search: z.string().trim().max(100).optional(),
    warehouseId: objectIdSchema.optional(),
    createdBy: objectIdSchema.optional(),
    status: z
      .enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "REVISION_REQUIRED", "CANCELLED"])
      .optional(),
    approvalDecision: z
      .enum(["APPROVE", "REJECT", "REVISE", "NONE"])
      .optional(),
    hasPurchaseOrder: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((v) => v === true || v === "true")
      .optional(),
    poCreated: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((v) => v === true || v === "true")
      .optional(),
    createdFrom: calendarDate.optional(),
    createdTo: calendarDate.optional(),
  })
  .strict()
  .superRefine((query, ctx) => {
    if (
      query.createdFrom &&
      query.createdTo &&
      query.createdFrom > query.createdTo
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["createdTo"],
        message: "Ngày kết thúc phải từ ngày bắt đầu",
      });
    }
    if (!Number.isSafeInteger((query.page - 1) * query.limit)) {
      ctx.addIssue({
        code: "custom",
        path: ["page"],
        message: "Trang vượt giới hạn hỗ trợ",
      });
    }
  });

export const listReplenishmentsSchema = z.object({ query: listQuerySchema });
export const getReplenishmentSchema = z.object({
  params: z.object({ id: objectIdSchema }).strict(),
  query: emptyQuery,
  body: emptyQuery,
});

const headerShape = {
  warehouseId: objectIdSchema,
  neededOn: calendarDate,
  triggerReason: z.string().trim().min(1).max(200),
  note: optionalNote,
};

export const sourceSchema = z.discriminatedUnion('triggerType', [
  z.object({ triggerType: z.literal('MANUAL_OTHER') }).strict(),
  z.object({ triggerType: z.literal('STOCK_THRESHOLD') }).strict(),
  z.object({ triggerType: z.literal('STOCKTAKE_LOW_STOCK'), documentType: z.literal('stocktakes'), documentId: objectIdSchema, version: expectedVersion }).strict(),
  z.object({ triggerType: z.literal('SALES_SHORTAGE'), documentType: z.enum(['sales_orders','warehouse_issue_requests']), documentId: objectIdSchema, itemId: objectIdSchema, version: expectedVersion }).strict(),
]);
const assessmentFields = {
  evaluationKey: z.string().regex(/^[a-f\d]{64}$/i).optional(),
  independentNeedConfirmed: z.boolean().optional(),
  independentNeedReason: reasonNote.optional(),
  quantityAdjustmentReason: reasonNote.optional(),
};
const createLineSchema = z
  .object({
    productId: objectIdSchema,
    enteredUnit: z.string().trim().min(1).max(60), lotId: objectIdSchema.optional(),
    enteredQty: lineQty,
    reasonNote,
    source: sourceSchema.optional(),
    ...assessmentFields,
  })
  .strict();

export const createReplenishmentSchema = z.object({
  params: emptyQuery,
  query: emptyQuery,
  body: z
    .object({
      action: z.enum(["SAVE_DRAFT", "SUBMIT"]),
      creationKey,
      ...headerShape,
      lines: z.array(createLineSchema).min(1).max(100),
    })
    .strict(),
});

const updateLineSchema = z
  .object({
    id: objectIdSchema.optional(),
    productId: objectIdSchema,
    enteredUnit: z.string().trim().min(1).max(60), lotId: objectIdSchema.optional(),
    enteredQty: lineQty,
    reasonNote,
    source: sourceSchema.optional(),
    ...assessmentFields,
  })
  .strict();

export const updateReplenishmentSchema = z.object({
  params: z.object({ id: objectIdSchema }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion,
      operationKey,
      ...headerShape,
      lines: z.array(updateLineSchema).min(1).max(100),
    })
    .strict(),
});

const evaluations = z.array(z.object({ lineId: objectIdSchema, ...assessmentFields }).strict()).max(100).optional();
export const submitReplenishmentSchema = z.object({
  params: z.object({ id: objectIdSchema }).strict(),
  query: emptyQuery,
  body: z.object({ expectedVersion, operationKey, evaluations }).strict(),
});

const reviewLineSchema = z
  .object({
    lineId: objectIdSchema,
    approvedQtyBase: approvedQty,
    reason: z.string().trim().max(2000).optional().nullable(),
  })
  .strict();

export const reviewReplenishmentSchema = z.object({
  params: z.object({ id: objectIdSchema }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion,
      operationKey,
      decision: z.enum(["APPROVE", "REJECT", "REVISE"]),
      evaluations,
      reason: z.string().trim().max(2000).optional().nullable(),
      lines: z.array(reviewLineSchema).max(100).optional().default([]),
    })
    .strict(),
});

export const replenishmentLotOptionsSchema = z.object({
  query: z.object({
    productId: objectIdSchema,
    warehouseId: objectIdSchema,
    requestId: objectIdSchema.optional(),
    page: positiveInteger(1),
    limit: positiveInteger(20, 100),
  }).strict().refine(({ page, limit }) => Number.isSafeInteger((page - 1) * limit)),
});

export const replenishmentOptionsSchema = z.object({
  params: emptyQuery,
  body: emptyQuery,
  query: z.object({
    mode: z.enum(["CREATE", "FILTER"]),
    requestId: objectIdSchema.optional(),
  }).strict().refine(query => !query.requestId || query.mode === "CREATE"),
});

export const evaluateReplenishmentSchema = z.object({
  params: emptyQuery, query: emptyQuery,
  body: z.object({ warehouseId: objectIdSchema, neededOn: calendarDate,
    requestId: objectIdSchema.optional(),
    lines: z.array(z.object({ id: objectIdSchema.optional(), productId: objectIdSchema,
      source: sourceSchema.optional(), enteredUnit: z.string().trim().min(1).max(60).optional(),
      lotId: objectIdSchema.optional(), enteredQty: lineQty.optional(), reasonNote: reasonNote.optional(),
    }).strict()).min(1).max(100),
  }).strict(),
});
export const cancelReplenishmentSchema = z.object({
  params: z.object({ id: objectIdSchema }).strict(), query: emptyQuery,
  body: z.object({ expectedVersion, operationKey, reason: reasonNote }).strict(),
});

export const listSubmissionsSchema = z.object({
  params: z.object({ id: objectIdSchema }).strict(),
  query: pageQuery,
  body: emptyQuery,
});

export const getSubmissionSchema = z.object({
  params: z
    .object({ id: objectIdSchema, version: integerFromPath })
    .strict(),
  query: emptyQuery,
  body: emptyQuery,
});

export function creationDateRange({ createdFrom, createdTo }) {
  const range = {};
  if (createdFrom) range.$gte = new Date(`${createdFrom}T00:00:00+07:00`);
  if (createdTo)
    range.$lt = new Date(
      new Date(`${createdTo}T00:00:00+07:00`).getTime() + 86400000,
    );
  return Object.keys(range).length ? range : null;
}
