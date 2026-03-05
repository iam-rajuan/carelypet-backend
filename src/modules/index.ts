import { Router } from "express";
import adminModule from "./admin";
import userModules from "./user";

export interface ModuleDefinition {
  name: string;
  basePath: string;
  router: Router;
}

const modules: ModuleDefinition[] = [adminModule, ...userModules];

export default modules;
