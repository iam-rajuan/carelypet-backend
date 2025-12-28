import { Request, Response } from "express";
import * as serviceRequestsService from "./serviceRequests.service";
import { toServiceDetails, toServiceSummary } from "./serviceRequests.mapper";
import { ServiceRequestQuery, UpdateServiceStatusInput } from "./serviceRequests.validation";

export const listServiceRequests = async (req: Request, res: Response) => {
  try {
    const query =
      (req as Request & { validatedQuery?: ServiceRequestQuery }).validatedQuery || {
        status: "all",
        page: 1,
        limit: 20,
      };
    const result = await serviceRequestsService.listServiceRequests(query);
    res.json({
      success: true,
      data: {
        data: result.data.map(toServiceSummary),
        pagination: result.pagination,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list service requests";
    res.status(400).json({ success: false, message });
  }
};

export const getServiceRequestDetails = async (req: Request, res: Response) => {
  try {
    const request = await serviceRequestsService.getServiceRequestById(req.params.id);
    res.json({
      success: true,
      data: toServiceDetails(request),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Service request not found";
    const status = message === "Service request not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const updateServiceStatus = async (
  req: Request & { body: UpdateServiceStatusInput },
  res: Response
) => {
  try {
    await serviceRequestsService.updateServiceStatus(req.params.id, req.body);
    res.json({ success: true, message: "Service status updated" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update service status";
    const status = message === "Service request not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const deleteServiceRequest = async (req: Request, res: Response) => {
  try {
    await serviceRequestsService.deleteServiceRequest(req.params.id);
    res.json({ success: true, message: "Service request deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete service request";
    const status = message === "Service request not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};
