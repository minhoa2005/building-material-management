import { z } from 'zod';

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
  body: z.object({
    username: z.string().min(3, 'Tên đăng nhập tối thiểu 3 ký tự'),
    fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    roleCode: z.enum(['ADMIN', 'OWNER', 'SALES', 'WAREHOUSE', 'ACCOUNTANT']),
    phone: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    fullName: z.string().min(2).optional(),
    roleCode: z.enum(['ADMIN', 'OWNER', 'SALES', 'WAREHOUSE', 'ACCOUNTANT']).optional(),
    phone: z.string().optional(),
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
