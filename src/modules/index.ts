import { Router } from "express";
import authModule from "./auth";

export interface ModuleDefinition {
  name: string;
  basePath: string;
  router: Router;
}

const modules: ModuleDefinition[] = [authModule];

export default modules;
