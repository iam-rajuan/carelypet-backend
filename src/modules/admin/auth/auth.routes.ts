import { Router } from "express";
import validate from "../../../middlewares/validate.middleware";
import * as authController from "./auth.controller";
import {
  adminLoginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from "./auth.validation";

const router = Router();

router.post("/login", validate(adminLoginSchema), authController.login);
router.post("/refresh", validate(refreshTokenSchema), authController.refresh);
router.post("/logout", validate(refreshTokenSchema), authController.logout);
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);

export default router;
