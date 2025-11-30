import express, { Request, Response } from "express";
import modules, { ModuleDefinition } from "../modules";
import usersRoutes from "../modules/users/users.routes";

const router = express.Router();

router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

modules.forEach(({ name, basePath, router: moduleRouter }: ModuleDefinition) => {
  if (!moduleRouter) return;
  router.use(basePath || `/${name}`, moduleRouter);
});

router.use("/users", usersRoutes);

export default router;
