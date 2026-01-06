import { Router } from "express";
import auth from "../../../middlewares/auth.middleware";
import * as servicesController from "./services.controller";

const router = Router();

router.use(auth);
router.get("/", servicesController.listServices);

export default router;

