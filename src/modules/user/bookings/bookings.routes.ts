import { NextFunction, Request, Response, Router } from "express";
import { ZodError, ZodSchema } from "zod";
import auth from "../../../middlewares/auth.middleware";
import validate from "../../../middlewares/validate.middleware";
import * as bookingsController from "./bookings.controller";
import {
  availabilityQuerySchema,
  bookingIdParamSchema,
  bookingQuerySchema,
  createBookingSchema,
} from "./bookings.validation";

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

router.post("/", validate(createBookingSchema), bookingsController.createBooking);
router.post(
  "/:id/confirm",
  validateParams(bookingIdParamSchema),
  bookingsController.confirmBookingPayment
);
router.get("/", validateQuery(bookingQuerySchema), bookingsController.listBookings);
router.get(
  "/availability",
  validateQuery(availabilityQuerySchema),
  bookingsController.getAvailability
);

export default router;
