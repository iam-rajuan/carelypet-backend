import { Request, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { toNotificationResponse } from "../../notifications/notification.mapper";
import * as notificationService from "../../notifications/notification.service";
import { NotificationQueryInput } from "../../notifications/notification.validation";

const requireAdmin = (req: AuthRequest, res: Response): string | null => {
  if (!req.user || req.user.role !== "admin") {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  return req.user.id;
};

export const listNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    const query =
      (req as Request & { validatedQuery?: NotificationQueryInput }).validatedQuery || {
        page: 1,
        limit: 20,
        status: "all",
      };

    const result = await notificationService.listForAudience("admin", adminId, query);
    res.json({
      success: true,
      data: {
        data: result.data.map(toNotificationResponse),
        pagination: result.pagination,
        unreadCount: result.unreadCount,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch notifications";
    res.status(400).json({ success: false, message });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    const unreadCount = await notificationService.getUnreadCount("admin", adminId);
    res.json({ success: true, data: { unreadCount } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch unread count";
    res.status(400).json({ success: false, message });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    const notification = await notificationService.markRead("admin", adminId, req.params.id);
    res.json({
      success: true,
      data: toNotificationResponse(notification),
      message: "Notification marked as read",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to mark notification as read";
    const status = message === "Notification not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    const updated = await notificationService.markAllRead("admin", adminId);
    res.json({
      success: true,
      data: { updated },
      message: "All notifications marked as read",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to mark all notifications as read";
    res.status(400).json({ success: false, message });
  }
};
