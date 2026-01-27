import { Router } from "express";
import * as legalController from "./legal.controller";

const router = Router();

router.get("/terms", legalController.getTerms);

export default router;
