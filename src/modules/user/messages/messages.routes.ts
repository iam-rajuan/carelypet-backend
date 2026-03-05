import { NextFunction, Request, Response, Router } from "express";
import { ZodSchema } from "zod";
import auth from "../../../middlewares/auth.middleware";
import validate from "../../../middlewares/validate.middleware";
import { cacheResponse, invalidateCacheOnSuccess } from "../../../middlewares/cache.middleware";
import * as messagesController from "./messages.controller";
import {
  conversationIdParamSchema,
  conversationListQuerySchema,
  createMessageSchema,
  createMessageWithAttachmentsSchema,
  messageIdParamSchema,
  messageQuerySchema,
  updateMessageSchema,
  userIdParamSchema,
  userSearchQuerySchema,
} from "./messages.validation";
import { uploadMessageAttachments } from "../uploads/upload.middleware";

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

router.use(auth);

router.get(
  "/conversations",
  cacheResponse("messages:conversations", 8),
  validateQuery(conversationListQuerySchema),
  messagesController.listConversations
);
router.get(
  "/conversations/:id/messages",
  cacheResponse("messages:conversation-messages", 8),
  validateParams(conversationIdParamSchema),
  validateQuery(messageQuerySchema),
  messagesController.listMessages
);
router.post(
  "/",
  invalidateCacheOnSuccess("messages:conversations", "messages:conversation-messages"),
  validate(createMessageSchema),
  messagesController.sendMessage
);
router.post(
  "/attachments",
  invalidateCacheOnSuccess("messages:conversations", "messages:conversation-messages"),
  uploadMessageAttachments,
  validate(createMessageWithAttachmentsSchema),
  messagesController.sendMessageWithAttachments
);
router.post(
  "/conversations/:id/read",
  invalidateCacheOnSuccess("messages:conversations", "messages:conversation-messages"),
  validateParams(conversationIdParamSchema),
  messagesController.markConversationRead
);
router.delete(
  "/conversations/:id",
  invalidateCacheOnSuccess("messages:conversations", "messages:conversation-messages"),
  validateParams(conversationIdParamSchema),
  messagesController.deleteConversation
);
router.get(
  "/users/search",
  cacheResponse("messages:user-search", 10),
  validateQuery(userSearchQuerySchema),
  messagesController.searchUsers
);
router.post(
  "/block/:id",
  invalidateCacheOnSuccess("messages:conversations", "messages:user-search"),
  validateParams(userIdParamSchema),
  messagesController.blockUser
);
router.delete(
  "/block/:id",
  invalidateCacheOnSuccess("messages:conversations", "messages:user-search"),
  validateParams(userIdParamSchema),
  messagesController.unblockUser
);
router.patch(
  "/:id",
  invalidateCacheOnSuccess("messages:conversations", "messages:conversation-messages"),
  validateParams(messageIdParamSchema),
  validate(updateMessageSchema),
  messagesController.updateMessage
);
router.delete(
  "/:id",
  invalidateCacheOnSuccess("messages:conversations", "messages:conversation-messages"),
  validateParams(messageIdParamSchema),
  messagesController.deleteMessage
);

export default router;
