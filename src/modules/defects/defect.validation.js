import { z } from "zod";

const id = z.string().regex(/^[a-f\d]{24}$/i);
const quantity = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/).refine((value) => Number(value) > 0);

export const listDefectsSchema = z.object({
  query: z.object({
    warehouseId: id.optional(),
    status: z.enum(["OPEN", "PARTIAL", "CLOSED"]).optional(),
    search: z.string().trim().max(100).optional(),
    sourceKind: z.enum(["RECEIPT", "ISSUE", "STOCKTAKE", "TRANSFER", "CUSTOMER_RETURN", "MANUAL"]).optional(),
    lotId: id.optional(),
    locationId: id.optional(),
    ownerPartyId: id.optional(),
    hasEvidence: z.enum(['yes', 'no']).optional(),
    disposition: z.enum(['RELEASE', 'REGRADE', 'SCRAP', 'RETURN_SUPPLIER']).optional(),
    unresolvedOnly: z.enum(['yes', 'no']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  }).strict(),
});

const createDefectBodySchema = z.object({
    warehouseId: id,
    balanceId: id,
    quantity,
    sourceKind: z.enum(["RECEIPT", "ISSUE", "STOCKTAKE", "TRANSFER", "CUSTOMER_RETURN", "MANUAL"]),
    sourceLineId: id.optional(),
    reason: z.string().trim().min(1).max(1000),
    stocktakeId: id.optional(),
    disposition: z.object({
      outcome: z.enum(["RELEASE", "REGRADE", "SCRAP"]),
      targetQuality: z.enum(["GOOD", "DAMAGED", "BLOCKED"]).optional(),
      quantity,
      reason: z.string().trim().min(1).max(1000),
    }).strict().optional(),
  }).strict().superRefine((body, context) => {
    if (body.sourceKind === "STOCKTAKE" && !body.stocktakeId) {
      context.addIssue({ code: "custom", path: ["stocktakeId"], message: "Stocktake ID is required" });
    }
    if (body.sourceKind === "STOCKTAKE" && body.disposition) {
      context.addIssue({ code: "custom", path: ["disposition"], message: "Stocktake defects are held for the stocktake plan without a standard disposition proposal" });
    }
    if (body.sourceKind !== "STOCKTAKE" && !body.disposition) {
      context.addIssue({ code: "custom", path: ["disposition"], message: "Disposition proposal is required outside stocktake" });
    }
    if (body.disposition?.outcome === "RELEASE" && body.disposition.targetQuality !== "GOOD") {
      context.addIssue({ code: "custom", path: ["disposition", "targetQuality"], message: "Release must target GOOD quality" });
    }
    if (body.disposition?.outcome === "REGRADE" && !body.disposition.targetQuality) {
      context.addIssue({ code: "custom", path: ["disposition", "targetQuality"], message: "Regrade requires a target quality" });
    }
    if (body.disposition?.outcome === "SCRAP" && body.disposition.targetQuality) {
      context.addIssue({ code: "custom", path: ["disposition", "targetQuality"], message: "Scrap cannot set target quality" });
    }
    if (body.disposition && body.disposition.quantity !== body.quantity) {
      context.addIssue({ code: "custom", path: ["disposition", "quantity"], message: "Proposal quantity must equal the held quantity" });
    }
  });

export const createDefectSchema = z.object({ body: createDefectBodySchema });

export const defectIdSchema = z.object({ params: z.object({ id }), body: z.object({}).optional() });

export const decideDefectSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    expectedVersion: z.number().int().min(1),
    decision: z.enum(["APPROVE", "REJECT"]),
    reason: z.string().trim().min(1).max(2000),
    approvedQty: quantity.optional(),
  }).strict(),
});

export const addDefectEvidenceSchema = z.object({
  params: z.object({ id }),
  body: z.object({}).optional(),
});

export const executeDefectSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    expectedVersion: z.number().int().min(1),
    idempotencyKey: z.string().trim().min(16).max(100),
    evidenceId: id,
    note: z.string().trim().min(1).max(1000),
  }).strict(),
});
