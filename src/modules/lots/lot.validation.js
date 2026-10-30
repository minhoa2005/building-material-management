import { z } from "zod";
import {
  calendarDateString,
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
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .nullable()
    .optional();
const expectedVersion = z
  .number()
  .int()
  .min(1)
  .max(Number.MAX_SAFE_INTEGER);
const identityText = (max) => z.string().trim().min(1).max(max);

export const listLotsSchema = z.object({
  params: emptyQuery,
  body: emptyQuery,
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
      productId: objectIdString.optional(),
      manufacturerLot: z.string().trim().max(100).optional(),
      tone: z.string().trim().max(60).optional(),
      calibre: z.string().trim().max(60).optional(),
      identificationStatus: z.enum(["VERIFIED", "UNKNOWN"]).optional(),
      warehouseId: objectIdString.optional(),
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

export const lotIdSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: emptyQuery,
});

export const createLotSchema = z.object({
  params: emptyQuery,
  query: emptyQuery,
  body: z
    .object({
      productId: objectIdString,
      manufacturerLot: identityText(100),
      tone: identityText(60),
      calibre: identityText(60),
      identificationStatus: z.enum(["VERIFIED", "UNKNOWN"]),
      manufacturedOn: calendarDateString.optional().nullable(),
      verificationReference: optionalText(2000),
      notes: optionalText(2000),
    })
    .strict(),
});

export const updateLotSchema = z.object({
  params: z.object({ id: objectIdString }).strict(),
  query: emptyQuery,
  body: z
    .object({
      expectedVersion,
      manufacturerLot: identityText(100).optional(),
      tone: identityText(60).optional(),
      calibre: identityText(60).optional(),
      identificationStatus: z.enum(["VERIFIED", "UNKNOWN"]).optional(),
      manufacturedOn: calendarDateString.optional().nullable(),
      verificationReference: optionalText(2000),
      notes: optionalText(2000),
    })
    .strict(),
});

export const lotMovementsSchema = z.object({
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