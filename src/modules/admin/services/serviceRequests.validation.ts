import { z } from "zod";

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

export const serviceRequestIdParamSchema = z.object({
  id: z.string().trim().min(1, "Service request id is required"),
});

export const serviceRequestQuerySchema = z.object({
  status: z.enum(["all", "pending", "completed"]).default("all"),
  page: z.preprocess(toNumber, z.number().int().min(1).default(1)),
  limit: z.preprocess(toNumber, z.number().int().min(1).max(100).default(20)),
});

export const updateServiceStatusSchema = z.object({
  status: z.enum(["pending", "completed"]),
});

export type ServiceRequestIdParam = z.infer<typeof serviceRequestIdParamSchema>;
export type ServiceRequestQuery = z.infer<typeof serviceRequestQuerySchema>;
export type UpdateServiceStatusInput = z.infer<typeof updateServiceStatusSchema>;
