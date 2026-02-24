import { NextFunction, Request, Response, Router } from "express";
import { ZodSchema } from "zod";
import adminAuth from "../auth/admin.middleware";
import * as notificationsController from "./notifications.controller";
import {
  notificationIdParamSchema,
  notificationQuerySchema,
} from "../../notifications/notification.validation";

const router = Router();

const validateParams =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const issues = result.error.issues;
      return res.status(400).json({
        success: false,
        message: issues?.[0]?.message || "Validation failed",
        issues,
      });
    }
    req.params = result.data as typeof req.params;
    next();
  };

const validateQuery =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const cleaned = Object.fromEntries(
      Object.entries(req.query || {}).flatMap(([key, value]) => {
        const v = Array.isArray(value) ? value[0] : value;
        return v === "" || v === undefined || v === null ? [] : [[key, v]];
      })
    );

    const result = schema.safeParse(cleaned);
    if (!result.success) {
      const issues = result.error.issues;
      return res.status(400).json({
        success: false,
        message: issues?.[0]?.message || "Validation failed",
        issues,
      });
    }

    (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    next();
  };

router.use(adminAuth);

router.get("/", validateQuery(notificationQuerySchema), notificationsController.listNotifications);
router.get("/unread-count", notificationsController.getUnreadCount);
router.patch(
  "/:id/read",
  validateParams(notificationIdParamSchema),
  notificationsController.markNotificationRead
);
router.patch("/read-all", notificationsController.markAllNotificationsRead);

export default router;
