import { z } from 'zod';
import { isDocumentId } from '../../models/document-identity.js';
export const documentIdentifier = z.string().refine(v => /^[a-f\d]{24}$/i.test(v) || isDocumentId(v), 'Mã chứng từ không hợp lệ').transform(v => /^[a-f\d]{24}$/i.test(v) ? v.toLowerCase() : v);
