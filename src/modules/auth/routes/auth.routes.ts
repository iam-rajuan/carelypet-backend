import { Router, Response } from "express";
import * as authController from "../controllers/auth.controller";
import validate from "../../../middlewares/validate.middleware";
import { registerSchema, loginSchema } from "../validations/auth.validation";
import auth, { AuthRequest } from "../../../middlewares/auth.middleware";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

router.get("/me", auth, (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: "User authenticated",
    user: req.user,
  });
});

export default router;
