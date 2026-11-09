import { createHash } from "node:crypto";
import { z } from "zod";
import { ExactDecimal } from "../../models/model-utils.js";

export const SAIGON_OFFSET_MS = 7 * 60 * 60 * 1000;
export const objectIdString = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "ObjectId không hợp lệ");

export const calendarDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có dạng YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Ngày không hợp lệ");

export function saigonDateOnly(now = new Date()) {
  return new Date(now.getTime() + SAIGON_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

export function calendarDateToInstant(value) {
  return new Date(`${value}T00:00:00+07:00`);
}

export function calendarDateRange(from, to) {
  const range = {};
  if (from) range.$gte = calendarDateToInstant(from);
  if (to) {
    range.$lt = new Date(calendarDateToInstant(to).getTime() + 86_400_000);
  }
  return Object.keys(range).length ? range : null;
}

export function decimalStringSchema({
  scale = 6,
  precision = 20,
  positive = false,
  allowZero = true,
  label = "Số lượng",
} = {}) {
  return z
    .string()
    .trim()
    .regex(
      /^\d+(?:\.\d+)?$/,
      `${label} phải là chuỗi số thập phân không âm`,
    )
    .superRefine((value, ctx) => {
      try {
        const number = new ExactDecimal(value);
        if (!number.isFinite()) throw new Error("not finite");
        if (number.decimalPlaces() > scale) {
          ctx.addIssue({
            code: "custom",
            message: `${label} tối đa ${scale} chữ số thập phân`,
          });
        }
        if (number.abs().gte(new ExactDecimal(10).pow(precision - scale))) {
          ctx.addIssue({
            code: "custom",
            message: `${label} vượt độ chính xác cho phép`,
          });
        }
        if (positive ? number.lte(0) : !allowZero && number.isZero()) {
          ctx.addIssue({
            code: "custom",
            message: positive ? `${label} phải lớn hơn 0` : `${label} phải lớn hơn 0`,
          });
        }
      } catch {
        ctx.addIssue({
          code: "custom",
          message: `${label} không hợp lệ`,
        });
      }
    })
    .transform((value) => new ExactDecimal(value).toString());
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeCode(value) {
  return value.trim().toUpperCase();
}

export function idString(value) {
  if (value == null) return null;
  const text = String(value._id ?? value);
  return /^[a-f\d]{24}$/i.test(text) ? text.toLowerCase() : text;
}

export function decimalString(value) {
  return value == null ? null : value.toString();
}

export function isoDate(value) {
  return value == null ? null : new Date(value).toISOString();
}

export function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, stableJson(value[key])]),
    );
  }
  return value;
}

export function sha256Json(value) {
  return createHash("sha256")
    .update(JSON.stringify(stableJson(value)))
    .digest("hex");
}

export const TRIGGER_TYPE = "MANUAL_OTHER";
export const RR_APPROVAL_KIND = "REPLENISHMENT_APPROVAL";
