import mongoose from "mongoose";
import Notification, { INotification, NotificationAudience, NotificationPriority } from "./notification.model";
import Admin from "../admin/auth/admin.model";

export interface NotificationListQuery {
  page: number;
  limit: number;
  status: "all" | "read" | "unread";
  type?: string;
}

interface CreateNotificationInput {
  audience: NotificationAudience;
  recipientId: string;
  type: string;
  title: string;
  body: string;
  priority?: NotificationPriority;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
}

const toObjectId = (value: string) => new mongoose.Types.ObjectId(value);

const buildListFilter = (
  audience: NotificationAudience,
  recipientId: string,
  query: NotificationListQuery
) => {
  const filter: Record<string, unknown> = {
    audience,
    recipientId: toObjectId(recipientId),
  };

  if (query.status === "read") {
    filter.readAt = { $ne: null };
  } else if (query.status === "unread") {
    filter.readAt = null;
  }

  if (query.type) {
    filter.type = query.type;
  }

  return filter;
};

export const createNotification = async (
  payload: CreateNotificationInput
): Promise<INotification> => {
  const doc: any = {
    ...payload,
    recipientId: toObjectId(payload.recipientId),
    priority: payload.priority || "normal",
    entityType: payload.entityType,
    entityId: payload.entityId,
    metadata: payload.metadata,
    dedupeKey: payload.dedupeKey,
  };

  if (doc.dedupeKey) {
    return (await Notification.findOneAndUpdate(
      {
        audience: doc.audience,
        recipientId: doc.recipientId,
        dedupeKey: doc.dedupeKey,
      },
      { $setOnInsert: doc },
      { upsert: true, new: true }
    )) as INotification;
  }

  const created = new Notification(doc);
  await created.save();
  return created;
};

export const createForUser = async (
  payload: Omit<CreateNotificationInput, "audience">
): Promise<INotification> => {
  return createNotification({ ...payload, audience: "user" });
};

export const createForAdmins = async (
  payload: Omit<CreateNotificationInput, "audience" | "recipientId">
): Promise<number> => {
  const admins = await Admin.find({}).select("_id").lean();
  if (admins.length === 0) return 0;

  const results = await Promise.all(
    admins.map((admin) =>
      createNotification({
        ...payload,
        audience: "admin",
        recipientId: String(admin._id),
        dedupeKey: payload.dedupeKey ? `${payload.dedupeKey}:${String(admin._id)}` : undefined,
      })
    )
  );

  return results.length;
};

export const listForAudience = async (
  audience: NotificationAudience,
  recipientId: string,
  query: NotificationListQuery
): Promise<{
  data: INotification[];
  pagination: { total: number; page: number; limit: number };
  unreadCount: number;
}> => {
  const filter = buildListFilter(audience, recipientId, query);
  const skip = (query.page - 1) * query.limit;

  const [total, data, unreadCount] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Notification.countDocuments({
      audience,
      recipientId: toObjectId(recipientId),
      readAt: null,
    }),
  ]);

  return {
    data,
    pagination: { total, page: query.page, limit: query.limit },
    unreadCount,
  };
};

export const markRead = async (
  audience: NotificationAudience,
  recipientId: string,
  notificationId: string
): Promise<INotification> => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      audience,
      recipientId: toObjectId(recipientId),
    },
    { readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};

export const markAllRead = async (
  audience: NotificationAudience,
  recipientId: string
): Promise<number> => {
  const result = await Notification.updateMany(
    {
      audience,
      recipientId: toObjectId(recipientId),
      readAt: null,
    },
    { readAt: new Date() }
  );

  return result.modifiedCount;
};

export const getUnreadCount = async (
  audience: NotificationAudience,
  recipientId: string
): Promise<number> => {
  return Notification.countDocuments({
    audience,
    recipientId: toObjectId(recipientId),
    readAt: null,
  });
};
