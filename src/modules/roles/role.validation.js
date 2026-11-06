import { z } from 'zod';

export const updateRolePermissionsSchema = z.object({
  params: z.object({
    code: z.string(),
  }),
  body: z.object({
    permissionCodes: z.array(z.string()),
  }),
});

export const createRoleSchema=z.object({body:z.object({code:z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,59}$/),name:z.string().trim().min(1).max(160),description:z.string().trim().max(500).optional(),permissionCodes:z.array(z.string()).max(300)}).strict()});
