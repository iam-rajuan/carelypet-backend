import { NextFunction, Request, Response, Router } from "express";
import { ZodError, ZodSchema } from "zod";
import auth from "../../../middlewares/auth.middleware";
import validate from "../../../middlewares/validate.middleware";
import { cacheResponse, invalidateCacheOnSuccess } from "../../../middlewares/cache.middleware";
import {
  createCommentSchema,
  createPostSchema,
  createReplySchema,
  listPostsQuerySchema,
  postIdParamSchema,
  commentIdParamSchema,
  reportPostSchema,
  sharePostSchema,
  updatePostSchema,
  updateCommentSchema,
  userIdParamSchema,
} from "./community.validation";
import * as communityController from "./community.controller";
import { uploadPostMedia } from "../uploads/upload.middleware";

const router = Router();

const validateParams =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.params);
      req.params = parsed as typeof req.params;
      next();
    } catch (err) {
      const isZodError = err instanceof ZodError;
      return res.status(400).json({
        success: false,
        message: isZodError
          ? err.issues?.[0]?.message || "Validation failed"
          : "Validation failed",
        issues: isZodError ? err.issues : err,
      });
    }
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

const maybeUploadPostMedia = (req: Request, res: Response, next: NextFunction) => {
  if (req.is("multipart/form-data")) {
    return uploadPostMedia(req, res, next);
  }
  return next();
};

router.post(
  "/posts",
  invalidateCacheOnSuccess("community:posts", "community:post", "community:photos"),
  maybeUploadPostMedia,
  validate(createPostSchema),
  communityController.createPost
);
router.get(
  "/posts",
  cacheResponse("community:posts", 20),
  validateQuery(listPostsQuerySchema),
  communityController.listPosts
);
router.get(
  "/posts/me",
  cacheResponse("community:posts", 15),
  validateQuery(listPostsQuerySchema),
  communityController.listMyPosts
);
router.get("/posts/me/photos", cacheResponse("community:photos", 20), communityController.listMyPhotos);
router.get(
  "/posts/user/:id",
  cacheResponse("community:posts", 20),
  validateParams(userIdParamSchema),
  validateQuery(listPostsQuerySchema),
  communityController.listUserPosts
);
router.get(
  "/posts/user/:id/photos",
  cacheResponse("community:photos", 20),
  validateParams(userIdParamSchema),
  communityController.listUserPhotos
);
router.get(
  "/posts/:id",
  cacheResponse("community:post", 20),
  validateParams(postIdParamSchema),
  communityController.getPost
);
router.patch(
  "/posts/:id",
  invalidateCacheOnSuccess("community:posts", "community:post", "community:comments", "community:photos"),
  validateParams(postIdParamSchema),
  maybeUploadPostMedia,
  validate(updatePostSchema),
  communityController.updatePost
);
router.delete(
  "/posts/:id",
  invalidateCacheOnSuccess("community:posts", "community:post", "community:comments", "community:photos"),
  validateParams(postIdParamSchema),
  communityController.deletePost
);
router.post(
  "/posts/:id/like",
  invalidateCacheOnSuccess("community:posts", "community:post"),
  validateParams(postIdParamSchema),
  communityController.toggleLike
);
router.post(
  "/posts/:id/comments",
  invalidateCacheOnSuccess("community:posts", "community:post", "community:comments"),
  validateParams(postIdParamSchema),
  validate(createCommentSchema),
  communityController.addComment
);
router.get(
  "/posts/:id/comments",
  cacheResponse("community:comments", 20),
  validateParams(postIdParamSchema),
  communityController.listComments
);
router.post(
  "/comments/:id/replies",
  invalidateCacheOnSuccess("community:posts", "community:post", "community:comments"),
  validateParams(commentIdParamSchema),
  validate(createReplySchema),
  communityController.replyToComment
);
router.patch(
  "/comments/:id",
  invalidateCacheOnSuccess("community:comments"),
  validateParams(commentIdParamSchema),
  validate(updateCommentSchema),
  communityController.updateComment
);
router.delete(
  "/comments/:id",
  invalidateCacheOnSuccess("community:posts", "community:post", "community:comments"),
  validateParams(commentIdParamSchema),
  communityController.deleteComment
);
router.post(
  "/comments/:id/like",
  invalidateCacheOnSuccess("community:comments"),
  validateParams(commentIdParamSchema),
  communityController.toggleLikeComment
);
router.post(
  "/posts/:id/share",
  invalidateCacheOnSuccess("community:posts", "community:post"),
  validateParams(postIdParamSchema),
  validate(sharePostSchema),
  communityController.sharePost
);
router.post(
  "/posts/:id/report",
  invalidateCacheOnSuccess("community:posts", "community:post"),
  validateParams(postIdParamSchema),
  validate(reportPostSchema),
  communityController.reportPost
);

export default router;
