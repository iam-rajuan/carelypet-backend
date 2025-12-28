import ServiceCatalog, { IServiceCatalog } from "../../services/serviceCatalog.model";
import TaxSetting, { ITaxSetting } from "../../services/taxSetting.model";
import AvailabilitySetting, {
  IAvailabilitySetting,
} from "../../services/availabilitySetting.model";
import {
  AvailabilityInput,
  CreateServiceInput,
  UpdateServiceInput,
  TaxInput,
} from "./settings.validation";

export const listServices = async (): Promise<IServiceCatalog[]> => {
  return ServiceCatalog.find().sort({ createdAt: -1 });
};

export const createService = async (payload: CreateServiceInput): Promise<IServiceCatalog> => {
  const existing = await ServiceCatalog.findOne({ type: payload.type });
  if (existing) {
    throw new Error("Service type already exists");
  }

  return ServiceCatalog.create({
    name: payload.name.trim(),
    type: payload.type,
    price: payload.price,
    isActive: payload.isActive ?? true,
  });
};

export const updateService = async (
  id: string,
  payload: UpdateServiceInput
): Promise<IServiceCatalog> => {
  const service = await ServiceCatalog.findById(id);
  if (!service) {
    throw new Error("Service not found");
  }

  if (payload.name !== undefined) {
    service.name = payload.name.trim();
  }
  if (payload.price !== undefined) {
    service.price = payload.price;
  }
  if (payload.isActive !== undefined) {
    service.isActive = payload.isActive;
  }

  await service.save();
  return service;
};

export const deleteService = async (id: string): Promise<void> => {
  const service = await ServiceCatalog.findById(id);
  if (!service) {
    throw new Error("Service not found");
  }
  await service.deleteOne();
};

export const setActiveTax = async (payload: TaxInput): Promise<ITaxSetting> => {
  await TaxSetting.updateMany({ isActive: true }, { isActive: false });
  return TaxSetting.create({ percent: payload.percent, isActive: true });
};

export const getActiveTax = async (): Promise<ITaxSetting | null> => {
  return TaxSetting.findOne({ isActive: true }).sort({ createdAt: -1 });
};

export const updateActiveTax = async (payload: TaxInput): Promise<ITaxSetting> => {
  const active = await TaxSetting.findOne({ isActive: true }).sort({ createdAt: -1 });
  if (!active) {
    return setActiveTax(payload);
  }
  active.percent = payload.percent;
  await active.save();
  return active;
};

const DEFAULT_AVAILABILITY = { startTime: "09:00", endTime: "17:00", slotMinutes: 30 };

export const getAvailabilitySetting = async (): Promise<IAvailabilitySetting> => {
  const setting = await AvailabilitySetting.findOne().sort({ createdAt: -1 });
  if (setting) {
    return setting;
  }
  return AvailabilitySetting.create(DEFAULT_AVAILABILITY);
};

export const updateAvailabilitySetting = async (
  payload: AvailabilityInput
): Promise<IAvailabilitySetting> => {
  const setting = await AvailabilitySetting.findOne().sort({ createdAt: -1 });
  if (!setting) {
    return AvailabilitySetting.create(payload);
  }
  setting.startTime = payload.startTime;
  setting.endTime = payload.endTime;
  setting.slotMinutes = payload.slotMinutes;
  await setting.save();
  return setting;
};
