import { z } from "zod";

const timeToMinutes = (value: string): number => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM format (24h)");

export const availabilitySchema = z
  .object({
    day: z.number().int().min(0).max(6),
    startTime: timeString,
    endTime: timeString,
    isActive: z.boolean().optional().default(true),
  })
  .refine((val) => timeToMinutes(val.endTime) > timeToMinutes(val.startTime), {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const createProviderSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  category: z.enum(["vet", "grooming", "walking", "training"]),
  bio: z.string().trim().max(1000).optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").optional(),
  address: z.string().trim().max(500).optional(),
  location: locationSchema.optional(),
  availability: z.array(availabilitySchema).max(50).optional(),
});

export const updateProviderSchema = createProviderSchema.partial();

export const providerIdParamSchema = z.object({
  id: z.string().trim().min(1, "Provider id is required"),
});

export const verifyProviderSchema = z.object({
  verificationStatus: z.enum(["pending", "verified", "rejected"]),
});

export const providerQuerySchema = z
  .object({
    category: z.enum(["vet", "grooming", "walking", "training"]).optional(),
    status: z.enum(["pending", "verified", "rejected"]).optional(),
    search: z.string().trim().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().min(0.1).max(200).optional(),
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
  })
  .refine(
    (val) =>
      (!val.lat && !val.lng && !val.radiusKm) ||
      (typeof val.lat === "number" && typeof val.lng === "number"),
    { message: "lat and lng are required together", path: ["lat"] }
  );

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type ProviderIdParam = z.infer<typeof providerIdParamSchema>;
export type VerifyProviderInput = z.infer<typeof verifyProviderSchema>;
export type ProviderQueryInput = z.infer<typeof providerQuerySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type LocationInput = z.infer<typeof locationSchema>;
