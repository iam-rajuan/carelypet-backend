import { Router, Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import auth from "../../middlewares/auth.middleware";
import validate from "../../middlewares/validate.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createProviderSchema,
  updateProviderSchema,
  providerIdParamSchema,
  verifyProviderSchema,
  providerQuerySchema,
  createReviewSchema,
} from "./providers.validation";
import * as providersController from "./providers.controller";

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

// Public endpoints
router.get("/", validateQuery(providerQuerySchema), providersController.listProviders);
router.get("/:id", validateParams(providerIdParamSchema), providersController.getProviderById);

// Admin verification
router.patch(
  "/:id/verify",
  auth,
  requireRole("admin"),
  validateParams(providerIdParamSchema),
  validate(verifyProviderSchema),
  providersController.verifyProvider
);

// Authenticated provider operations
router.use(auth);

router.post("/", validate(createProviderSchema), providersController.createProvider);
router.patch(
  "/:id",
  validateParams(providerIdParamSchema),
  validate(updateProviderSchema),
  providersController.updateProvider
);
router.delete("/:id", validateParams(providerIdParamSchema), providersController.deleteProvider);

router.post(
  "/:id/reviews",
  validateParams(providerIdParamSchema),
  validate(createReviewSchema),
  providersController.createReview
);

export default router;
