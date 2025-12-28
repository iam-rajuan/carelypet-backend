import { NextFunction, Request, Response, Router } from "express";
import { ZodError, ZodSchema } from "zod";
import adminAuth from "../auth/admin.middleware";
import validate from "../../../middlewares/validate.middleware";
import * as serviceRequestsController from "./serviceRequests.controller";
import {
  serviceRequestIdParamSchema,
  serviceRequestQuerySchema,
  updateServiceStatusSchema,
} from "./serviceRequests.validation";

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

router.use(adminAuth);

router.get("/", validateQuery(serviceRequestQuerySchema), serviceRequestsController.listServiceRequests);
router.get(
  "/:id",
  validateParams(serviceRequestIdParamSchema),
  serviceRequestsController.getServiceRequestDetails
);
router.patch(
  "/:id/status",
  validateParams(serviceRequestIdParamSchema),
  validate(updateServiceStatusSchema),
  serviceRequestsController.updateServiceStatus
);
router.delete(
  "/:id",
  validateParams(serviceRequestIdParamSchema),
  serviceRequestsController.deleteServiceRequest
);

export default router;
