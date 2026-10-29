import { z } from "zod";

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

export const listQuerySchema = z
  .object({
    page: positiveInteger(1),
    limit: positiveInteger(10, 100),
    search: z.string().trim().max(100).optional(),
    warehouseId: objectIdSchema.optional(),
    createdBy: objectIdSchema.optional(),
    status: z
      .enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "REVISION_REQUIRED"])
      .optional(),
    approvalDecision: z
      .enum(["APPROVE", "REJECT", "REVISE", "NONE"])
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
  query: z.object({}).strict(),
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
