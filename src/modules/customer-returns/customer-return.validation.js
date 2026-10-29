import { z } from "zod";

const id = z.string().regex(/^[a-f\d]{24}$/i);
const quantity = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/).refine((value) => Number(value) > 0);
const receivedQuantity = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/);
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(25);

export const listCustomerReturnsSchema = z.object({
  query: z.object({
    status: z.string().trim().min(1).max(30).optional(),
    warehouseId: id.optional(),
    search: z.string().trim().max(100).optional(),
    page,
    limit,
  }).strict(),
});

export const customerReturnIdSchema = z.object({
  params: z.object({ id }),
  body: z.object({}).optional(),
});

export const createCustomerReturnSchema = z.object({
  body: z.object({
    customerId: id,
    warehouseId: id,
    idempotencyKey: z.string().trim().min(16).max(120),
    lines: z.array(z.object({
      salesIssueLineId: id.optional(),
      historicalExternalLineId: id.optional(),
      qtyBase: quantity,
      reason: z.string().trim().min(1).max(1000),
    }).strict().refine((line) => Boolean(line.salesIssueLineId) !== Boolean(line.historicalExternalLineId), 'Choose exactly one delivered source')).min(1).max(100),
  }).strict().superRefine((body, context) => {
    const ids = body.lines.map((line) => line.salesIssueLineId || line.historicalExternalLineId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: "custom", path: ["lines"], message: "Each sales issue line may appear once" });
    }
  }),
});

export const assessment = z.object({
  returnLineId: id,
  qtyReceived: receivedQuantity,
  packagingCondition: z.enum(["SEALED", "OPENED", "TORN", "UNKNOWN"]),
  installationStatus: z.enum(["UNUSED", "INSTALLED", "UNKNOWN"]),
  damageCause: z.enum(["NONE", "CUSTOMER", "SUPPLIER", "OTHER", "UNKNOWN"]),
  deadlineStatus: z.enum(["WITHIN", "EXCEEDED", "NOT_APPLICABLE", "UNKNOWN"]),
  deadlineReference: z.string().trim().max(1000).optional(),
  assessmentReason: z.string().trim().min(1).max(2000),
}).strict();

export const inspectCustomerReturnSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    expectedVersion: z.number().int().min(1),
    idempotencyKey: z.string().trim().min(16).max(120),
    custodyLocationId: id,
    evidenceIds: z.array(id).min(1).max(20),
    lines: z.array(assessment).min(1).max(100),
    note: z.string().trim().max(1000).optional(),
  }).strict().superRefine((body, context) => {
    const ids = body.lines.map((line) => line.returnLineId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: "custom", path: ["lines"], message: "Each return line may be assessed once" });
    }
    if (new Set(body.evidenceIds).size !== body.evidenceIds.length) {
      context.addIssue({ code: "custom", path: ["evidenceIds"], message: "Evidence IDs must be unique" });
    }
  }),
});

export const decideCustomerReturnSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    expectedVersion: z.number().int().min(1),
    decision: z.enum(["APPROVE", "REJECT"]),
    reason: z.string().trim().min(1).max(2000),
  }).strict(),
});

export const decideCustomerReturnExceptionSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    expectedVersion: z.number().int().min(1),
    reason: z.string().trim().min(1).max(2000),
  }).strict(),
});

export const addCustomerReturnEvidenceSchema = z.object({
  params: z.object({ id }),
  body: z.object({}).optional(),
});
