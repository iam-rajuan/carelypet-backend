import { Router } from "express";
import authRouter from "./auth/auth.routes";
import profileRouter from "./profile/profile.routes";
import petRouter from "./pets/pet.routes";
import usersRouter from "./users/users.routes";
import serviceRequestsRouter from "./services/serviceRequests.routes";
import settingsRouter from "./settings/settings.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/profile", profileRouter);
router.use("/users", usersRouter);
router.use("/services", serviceRequestsRouter);
router.use("/settings", settingsRouter);
router.use("/", petRouter);

const adminModule = { name: "admin", basePath: "/admin", router };

export default adminModule;
