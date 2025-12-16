import { Router, Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import auth from "../../middlewares/auth.middleware";
import validate from "../../middlewares/validate.middleware";
import {
  createAppointmentSchema,
  appointmentIdParamSchema,
  updateAppointmentStatusSchema,
  appointmentQuerySchema,
} from "./appointments.validation";
import * as appointmentsController from "./appointments.controller";

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

router.post("/", validate(createAppointmentSchema), appointmentsController.bookAppointment);

router.get(
  "/me/customer",
  validateQuery(appointmentQuerySchema),
  appointmentsController.listCustomerAppointments
);

router.get(
  "/me/provider",
  validateQuery(appointmentQuerySchema),
  appointmentsController.listProviderAppointments
);

router.patch(
  "/:id/status",
  validateParams(appointmentIdParamSchema),
  validate(updateAppointmentStatusSchema),
  appointmentsController.updateAppointmentStatus
);

export default router;
