import { Router, Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import auth from "../../middlewares/auth.middleware";
import validate from "../../middlewares/validate.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createAdoptionListingSchema,
  listingIdParamSchema,
  updateAdoptionStatusSchema,
  listingQuerySchema,
} from "./adoption.validation";
import * as adoptionController from "./adoption.controller";

const router = Router();

// Helpers
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
    // Drop blank query params (common from Postman) and collapse arrays to first value
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

    // Express 5 makes req.query read-only; stash validated data separately
    (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    next();
  };

// 🔓 Public endpoints
router.get(
  "/",
  validateQuery(listingQuerySchema),
  adoptionController.listAdoptionListings
);
router.get(
  "/:id",
  validateParams(listingIdParamSchema),
  adoptionController.getAdoptionListingById
);

// 🔐 Authenticated endpoints
router.use(auth);

router.get("/me/listings", adoptionController.getMyAdoptionListings);

router.post(
  "/",
  validate(createAdoptionListingSchema),
  adoptionController.createAdoptionListing
);

// Admin-only status management (Available/Pending/Adopted)
router.patch(
  "/:id/status",
  requireRole("admin"),
  validateParams(listingIdParamSchema),
  validate(updateAdoptionStatusSchema),
  adoptionController.updateAdoptionStatus
);

// Owner or admin can delete
router.delete(
  "/:id",
  validateParams(listingIdParamSchema),
  adoptionController.deleteAdoptionListing
);

export default router;
