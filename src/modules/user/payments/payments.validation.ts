import { z } from "zod";

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

export const paymentQuerySchema = z.object({
  status: z.enum(["all", "pending", "completed"]).default("all"),
  paymentStatus: z.enum(["all", "paid", "unpaid"]).default("all"),
  page: z.preprocess(toNumber, z.number().int().min(1).default(1)),
  limit: z.preprocess(toNumber, z.number().int().min(1).max(100).default(20)),
});

export type PaymentQuery = z.infer<typeof paymentQuerySchema>;
