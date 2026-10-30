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

export const listPurchaseOrdersSchema = z.object({
  params: z.object({}).strict(),
  body: z.object({}).strict(),
  query: z
    .object({
      page: positiveInteger(1),
      limit: positiveInteger(10, 100),
      search: z.string().trim().max(100).optional(),
      supplierId: objectIdString.optional(),
      warehouseId: objectIdString.optional(),
      status: z.string().trim().min(1).max(30).optional(),
      createdFrom: calendarDateString.optional(),
      createdTo: calendarDateString.optional(),
      outstanding: z.enum(["YES", "NO", "UNKNOWN"]).optional(),
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
    }),
});