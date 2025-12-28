import { Request, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import * as paymentsService from "./payments.service";
import { PaymentQuery } from "./payments.validation";

const requireUser = (req: AuthRequest, res: Response): string | null => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  return req.user.id;
};

export const listPayments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const query =
      (req as Request & { validatedQuery?: PaymentQuery }).validatedQuery || {
        status: "all",
        paymentStatus: "all",
        page: 1,
        limit: 20,
      };

    const result = await paymentsService.listPayments(userId, query);
    res.json({
      success: true,
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch payments";
    res.status(400).json({ success: false, message });
  }
};
