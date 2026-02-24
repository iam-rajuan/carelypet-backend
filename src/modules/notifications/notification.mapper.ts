import { INotification } from "./notification.model";

export const toNotificationResponse = (notification: INotification) => ({
  id: String(notification._id),
  type: notification.type,
  title: notification.title,
  body: notification.body,
  priority: notification.priority,
  entityType: notification.entityType || null,
  entityId: notification.entityId || null,
  metadata: notification.metadata || null,
  isRead: Boolean(notification.readAt),
  readAt: notification.readAt || null,
  createdAt: notification.createdAt,
});
