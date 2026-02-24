import { z } from "zod";

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

export const notificationQuerySchema = z.object({
  page: z.preprocess(toNumber, z.number().int().min(1).default(1)),
  limit: z.preprocess(toNumber, z.number().int().min(1).max(100).default(20)),
  status: z.enum(["all", "read", "unread"]).default("all"),
  type: z.string().trim().optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string().trim().min(1, "Notification id is required"),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
