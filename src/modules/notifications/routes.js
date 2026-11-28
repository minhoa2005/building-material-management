import { Router } from 'express';
import { z } from 'zod';
import { Notification } from '../../models/runtime.js';
import { authenticate } from '../../middlewares/auth.js';
import checkPermission from '../../middlewares/permission.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import { notFoundError, validationError } from '../../shared/utils/ApiError.js';
import { canReadSource, sources } from './sources.js';

const router = Router();
const own = user => ({ recipientId: user._id, archivedAt: null });
const send = (res, data) => {
  res.set('Cache-Control', 'no-store');
  return formatApiResponse(res, { data });
};
const query = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
  unread: z.enum(['true', 'false']).default('false'),
});

async function* visible(user, unread) {
  const cursor = Notification.find({ ...own(user), ...(unread && { readAt: null }) })
    .sort({ occurredAt: -1, _id: -1 }).lean().cursor();
  for await (const item of cursor) {
    if (await canReadSource(user, item)) yield item;
  }
}

router.use(authenticate);
router.get('/', checkPermission('notification:read'), catchAsync(async (req, res) => {
  const parsed = query.safeParse(req.query);
  if (!parsed.success) throw validationError('Bộ lọc thông báo không hợp lệ');
  const { page, limit, unread } = parsed.data;
  const items = [];
  let total = 0;
  for await (const item of visible(req.user, unread === 'true')) {
    if (total++ < (page - 1) * limit || items.length === limit) continue;
    items.push({ id: item._id, title: item.title, message: item.message,
      occurredAt: item.occurredAt, readAt: item.readAt ?? null,
      href: sources[item.sourceType][0] + '/' + encodeURIComponent(String(item.sourceId)) });
  }
  return send(res, { items, page, limit, total });
}));

router.get('/unread-count', checkPermission('notification:read'), catchAsync(async (req, res) => {
  let count = 0;
  for await (const item of visible(req.user, true)) count++;
  return send(res, { count });
}));

router.post('/read-all', checkPermission('notification:read'), checkPermission('notification:mark_read'), catchAsync(async (req, res) => {
  const ids = [];
  for await (const item of visible(req.user, true)) ids.push(item._id);
  if (!ids.length) return send(res, { markedCount: 0 });
  const result = await Notification.updateMany(
    { ...own(req.user), readAt: null, _id: { $in: ids } },
    { $set: { readAt: new Date() } },
  );
  return send(res, { markedCount: result.modifiedCount });
}));

router.post('/:id/read', checkPermission('notification:read'), checkPermission('notification:mark_read'), catchAsync(async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw notFoundError();
  const filter = { ...own(req.user), _id: req.params.id };
  const item = await Notification.findOne(filter).lean();
  if (!item || !await canReadSource(req.user, item)) throw notFoundError();
  await Notification.updateOne({ ...filter, readAt: null }, { $set: { readAt: new Date() } });
  return send(res, { id: item._id });
}));

export default router;
