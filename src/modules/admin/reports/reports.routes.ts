import { NextFunction, Request, Response, Router } from "express";
import { ZodError, ZodSchema } from "zod";
import adminAuth from "../auth/admin.middleware";
import * as reportsController from "./reports.controller";
import { reportIdParamSchema } from "./reports.validation";

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

router.use(adminAuth);

router.get("/", reportsController.listReports);
router.get("/:id", validateParams(reportIdParamSchema), reportsController.getReport);
router.delete("/:id", validateParams(reportIdParamSchema), reportsController.deleteReport);
router.post("/:id/remove-content", validateParams(reportIdParamSchema), reportsController.removeContent);
router.post("/:id/warn", validateParams(reportIdParamSchema), reportsController.warnUser);
router.post("/:id/dismiss", validateParams(reportIdParamSchema), reportsController.dismissReport);

export default router;
