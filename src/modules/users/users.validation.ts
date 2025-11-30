import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  bio: z.string().trim().max(500, "Bio must be at most 500 characters").optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "Phone must be 10 to 15 digits")
    .optional(),
  location: z
    .object({
      city: z.string().trim().optional(),
      country: z.string().trim().optional(),
    })
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().trim().min(1, "Current password is required"),
  newPassword: z.string().trim().min(6, "New password must be at least 6 characters"),
});

export const updateAvatarSchema = z.object({
  avatarUrl: z.string().trim().url("Invalid avatar URL"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;
