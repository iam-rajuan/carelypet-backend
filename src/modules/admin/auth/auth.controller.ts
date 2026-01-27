import { Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import * as authService from "./auth.service";
import {
  AdminLoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  VerifyOtpInput,
  ResetPasswordInput,
} from "./auth.validation";

export const login = async (
  req: AuthRequest & { body: AdminLoginInput },
  res: Response
) => {
  try {
    const { user, tokens } = await authService.login(req.body);
    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: "admin",
        },
        tokens,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    res.status(400).json({ success: false, message });
  }
};

export const refresh = async (
  req: AuthRequest & { body: RefreshTokenInput },
  res: Response
) => {
  try {
    const tokens = await authService.refreshTokens(req.body);
    res.json({ success: true, message: "Tokens refreshed", data: tokens });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refresh failed";
    res.status(400).json({ success: false, message });
  }
};

export const logout = async (
  req: AuthRequest & { body: RefreshTokenInput },
  res: Response
) => {
  try {
    await authService.logout(req.body);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Logout failed";
    res.status(400).json({ success: false, message });
  }
};

export const forgotPassword = async (
  req: AuthRequest & { body: ForgotPasswordInput },
  res: Response
) => {
  try {
    await authService.forgotPassword(req.body);
    res.json({
      success: true,
      message: "If this email exists, an OTP has been sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    res.status(400).json({ success: false, message });
  }
};

export const verifyOtp = async (
  req: AuthRequest & { body: VerifyOtpInput },
  res: Response
) => {
  try {
    await authService.verifyOtp(req.body);
    res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    res.status(400).json({ success: false, message });
  }
};

export const resetPassword = async (
  req: AuthRequest & { body: ResetPasswordInput },
  res: Response
) => {
  try {
    await authService.resetPassword(req.body);
    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reset failed";
    res.status(400).json({ success: false, message });
  }
};
