import { Request, Response } from "express";
import * as servicesService from "./services.service";

export const listServices = async (_req: Request, res: Response) => {
  try {
    const [services, taxPercent] = await Promise.all([
      servicesService.listActiveServices(),
      servicesService.getActiveTaxPercent(),
    ]);
    res.json({ success: true, data: { services, taxPercent } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch services.";
    res.status(400).json({ success: false, message });
  }
};
