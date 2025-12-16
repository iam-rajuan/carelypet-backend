import { z } from "zod";

export const createAppointmentSchema = z
  .object({
    providerId: z.string().trim().min(1, "Provider is required"),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((val) => val.startTime < val.endTime, {
    message: "startTime must be before endTime",
    path: ["endTime"],
  });

export const appointmentIdParamSchema = z.object({
  id: z.string().trim().min(1, "Appointment id is required"),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
});

export const appointmentQuerySchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type AppointmentIdParam = z.infer<typeof appointmentIdParamSchema>;
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>;
