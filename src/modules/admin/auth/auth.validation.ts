import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.email("Invalid email format").trim(),
  password: z.string().trim().min(6, "Password must be at least 6 characters"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(10, "Refresh token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email format").trim(),
});

export const verifyOtpSchema = z.object({
  email: z.email("Invalid email format").trim(),
  otp: z.string().trim().length(6, "OTP must be 6 digits"),
});

export const resetPasswordSchema = z.object({
  email: z.email("Invalid email format").trim(),
  newPassword: z.string().trim().min(6, "New password must be at least 6 characters"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
