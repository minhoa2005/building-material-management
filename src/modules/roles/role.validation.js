import { z } from 'zod';

export const updateRolePermissionsSchema = z.object({
  params: z.object({
    code: z.string(),
  }),
  body: z.object({
    permissionCodes: z.array(z.string()),
  }),
});
