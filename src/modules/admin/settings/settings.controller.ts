import { Request, Response } from "express";
import * as settingsService from "./settings.service";
import {
  AvailabilityInput,
  CreateServiceInput,
  TaxInput,
  UpdateServiceInput,
} from "./settings.validation";

export const listServices = async (_req: Request, res: Response) => {
  try {
    const services = await settingsService.listServices();
    res.json({ success: true, data: services });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch services";
    res.status(400).json({ success: false, message });
  }
};

export const createService = async (req: Request & { body: CreateServiceInput }, res: Response) => {
  try {
    const service = await settingsService.createService(req.body);
    res.status(201).json({ success: true, data: service, message: "Service created" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create service";
    res.status(400).json({ success: false, message });
  }
};

export const updateService = async (req: Request & { body: UpdateServiceInput }, res: Response) => {
  try {
    const service = await settingsService.updateService(req.params.id, req.body);
    res.json({ success: true, data: service, message: "Service updated" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update service";
    const status = message === "Service not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    await settingsService.deleteService(req.params.id);
    res.json({ success: true, message: "Service deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete service";
    const status = message === "Service not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const getActiveTax = async (_req: Request, res: Response) => {
  try {
    const tax = await settingsService.getActiveTax();
    res.json({ success: true, data: tax ? { percent: tax.percent } : { percent: 0 } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch tax";
    res.status(400).json({ success: false, message });
  }
};

export const setActiveTax = async (req: Request & { body: TaxInput }, res: Response) => {
  try {
    const tax = await settingsService.setActiveTax(req.body);
    res.status(201).json({ success: true, data: { percent: tax.percent }, message: "Tax updated" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update tax";
    res.status(400).json({ success: false, message });
  }
};

export const updateActiveTax = async (req: Request & { body: TaxInput }, res: Response) => {
  try {
    const tax = await settingsService.updateActiveTax(req.body);
    res.json({ success: true, data: { percent: tax.percent }, message: "Tax updated" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update tax";
    res.status(400).json({ success: false, message });
  }
};

export const getAvailability = async (_req: Request, res: Response) => {
  try {
    const setting = await settingsService.getAvailabilitySetting();
    res.json({
      success: true,
      data: {
        startTime: setting.startTime,
        endTime: setting.endTime,
        slotMinutes: setting.slotMinutes,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch availability";
    res.status(400).json({ success: false, message });
  }
};

export const updateAvailability = async (
  req: Request & { body: AvailabilityInput },
  res: Response
) => {
  try {
    const setting = await settingsService.updateAvailabilitySetting(req.body);
    res.json({
      success: true,
      message: "Availability updated",
      data: {
        startTime: setting.startTime,
        endTime: setting.endTime,
        slotMinutes: setting.slotMinutes,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update availability";
    res.status(400).json({ success: false, message });
  }
};
