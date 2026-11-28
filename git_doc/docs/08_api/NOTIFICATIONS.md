# Notification inbox API

The notification bell uses the inbox routes to list notifications, count unread items, and mark them read. Responses use the standard API envelope and set `Cache-Control: no-store` on success. See the [notification router](../../../src/modules/notifications/routes.js) and its [source access checks](../../../src/modules/notifications/sources.js).

## Mark all as read

`POST /api/notifications/read-all` accepts an authenticated request with no body or query parameters. It requires both `notification:read` and `notification:mark_read`. The endpoint marks unread, unarchived notifications for the signed-in recipient across every page, using the same warehouse and source access checks as `GET /api/notifications/unread-count`.

The update sets `readAt` on the matched unread records and preserves existing read timestamps. A repeat request returns zero when no eligible unread records remain. The operation updates the notification inbox only.

| Status | Response |
| --- | --- |
| 200 | The response contains `data.markedCount`, a nonnegative integer equal to the number of notifications updated by the request. |
| 401 | The request lacks a valid authenticated session. |
| 403 | The authenticated user lacks either required permission. |

## Notification bell

The dropdown shows **Đánh dấu tất cả đã đọc** beside **Chỉ chưa đọc** for users with permission to mark notifications. The action is unavailable when the unread count is zero. On success the bell refreshes the list and badge, and the unread view returns to page one. On failure the dropdown shows **Không cập nhật được trạng thái đã đọc.**
