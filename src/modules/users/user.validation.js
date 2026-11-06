import { z } from 'zod';
import { objectIdString as oid } from '../../shared/utils/domain.js';

export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    role: z.string().optional(),
    status: z.enum(['active', 'inactive', 'all']).optional(),
  }),
});

export const createUserSchema = z.object({
  body: z.strictObject({
    username: z.string().min(3, 'Tên đăng nhập tối thiểu 3 ký tự'),
    fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    roleCode: z.string().trim().min(1).max(60),
    phone: z.string().max(30).optional(),
    email: z.email().optional(), warehouseIds:z.array(oid).max(100).refine(ids=>new Set(ids).size===ids.length).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.strictObject({
    fullName: z.string().min(2).optional(),
    roleCode: z.string().trim().min(1).max(60).optional(),
    phone: z.string().max(30).optional(),
    email: z.email().optional(), warehouseIds:z.array(oid).max(100).refine(ids=>new Set(ids).size===ids.length).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).optional(),
  }),
});

export const toggleStatusSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});
