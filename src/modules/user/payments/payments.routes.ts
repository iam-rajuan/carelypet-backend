import { NextFunction, Request, Response, Router } from "express";
import { ZodError, ZodSchema } from "zod";
import auth from "../../../middlewares/auth.middleware";
import * as paymentsController from "./payments.controller";
import { paymentQuerySchema } from "./payments.validation";

const router = Router();

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
router.get("/", validateQuery(paymentQuerySchema), paymentsController.listPayments);

export default router;
