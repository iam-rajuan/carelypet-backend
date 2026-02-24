import mongoose, { Document, Model, Schema } from "mongoose";

export type NotificationAudience = "user" | "admin";
export type NotificationPriority = "low" | "normal" | "high";

export interface INotification extends Document {
  audience: NotificationAudience;
  recipientId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  dedupeKey?: string | null;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    audience: {
      type: String,
      enum: ["user", "admin"],
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    type: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, required: true, trim: true, maxlength: 500 },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    entityType: { type: String, default: null, trim: true },
    entityId: { type: String, default: null, trim: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    dedupeKey: { type: String, default: null, trim: true },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1, recipientId: 1, createdAt: -1 });
notificationSchema.index({ audience: 1, recipientId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index(
  { audience: 1, recipientId: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }
);

const Notification: Model<INotification> = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;
