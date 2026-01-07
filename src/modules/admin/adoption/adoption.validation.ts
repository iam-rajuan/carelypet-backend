import { z } from "zod";

export const adoptionIdParamSchema = z.object({
  id: z.string().trim().min(1, "Listing id is required"),
});

export const adoptionListQuerySchema = z.object({
  status: z.enum(["available", "adopted", "pending"]).optional(),
});

export const adoptionRequestQuerySchema = z.object({
  status: z.enum(["pending", "delivered", "all"]).default("all"),
});

export const updateAdoptionStatusSchema = z.object({
  status: z.enum(["available", "adopted", "pending"]),
});

export const updateAdoptionRequestStatusSchema = z.object({
  status: z.enum(["pending", "delivered"]),
});
