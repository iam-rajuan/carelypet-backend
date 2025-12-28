import { z } from "zod";

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

export const createBookingSchema = z.object({
  serviceIds: z.array(z.string().trim().min(1)).optional(),
  selectAllServices: z.boolean().optional(),
  petIds: z.array(z.string().trim().min(1)).optional(),
  selectAllPets: z.boolean().optional(),
  scheduledAt: z.string().trim().min(1, "Scheduled date/time is required"),
  reminderType: z.enum(["none", "day_before", "week_before"]).default("none"),
  providerId: z.string().trim().min(1).optional(),
});

export const bookingIdParamSchema = z.object({
  id: z.string().trim().min(1, "Booking id is required"),
});

export const bookingQuerySchema = z.object({
  status: z.enum(["all", "pending", "completed"]).default("all"),
  paymentStatus: z.enum(["all", "paid", "unpaid"]).default("all"),
  page: z.preprocess(toNumber, z.number().int().min(1).default(1)),
  limit: z.preprocess(toNumber, z.number().int().min(1).max(100).default(20)),
});

export const availabilityQuerySchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingIdParam = z.infer<typeof bookingIdParamSchema>;
export type BookingQuery = z.infer<typeof bookingQuerySchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
