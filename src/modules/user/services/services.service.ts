import ServiceCatalog, { IServiceCatalog } from "../../services/serviceCatalog.model";
import TaxSetting from "../../services/taxSetting.model";

export const listActiveServices = async (): Promise<IServiceCatalog[]> => {
  return ServiceCatalog.find({ isActive: true }).sort({ createdAt: -1 });
};

export const getActiveTaxPercent = async (): Promise<number> => {
  const tax = await TaxSetting.findOne({ isActive: true }).sort({ createdAt: -1 });
  return tax?.percent ?? 0;
};
