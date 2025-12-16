import { Router } from "express";
import authModule from "./auth";
import adminModule from "./admin";
import petsModule from "./pets";
import uploadsModule from "./uploads";
import adoptionModule from "./adoption";
import providersModule from "./providers";
import appointmentsModule from "./appointments";

export interface ModuleDefinition {
  name: string;
  basePath: string;
  router: Router;
}

const modules: ModuleDefinition[] = [
  authModule,
  adminModule,
  petsModule,
  uploadsModule,
  adoptionModule,
  providersModule,
  appointmentsModule,
];

export default modules;
