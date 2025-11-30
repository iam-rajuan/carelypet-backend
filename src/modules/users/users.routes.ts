import { Router } from "express";
import auth from "../../middlewares/auth.middleware";
import validate from "../../middlewares/validate.middleware";
import {
  updateProfileSchema,
  changePasswordSchema,
  updateAvatarSchema,
} from "./users.validation";
import * as usersController from "./users.controller";

const router = Router();

router.use(auth);

router.get("/me", usersController.getMe);
router.patch("/me", validate(updateProfileSchema), usersController.updateMe);
router.patch("/me/password", validate(changePasswordSchema), usersController.changePassword);
router.patch("/me/avatar", validate(updateAvatarSchema), usersController.updateAvatar);

export default router;
