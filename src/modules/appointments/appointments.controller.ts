import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import * as appointmentsService from "./appointments.service";
import { AppointmentQueryInput } from "./appointments.validation";

const requireUser = (
  req: AuthRequest,
  res: Response
): { id: string; role: string } | null => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  return { id: req.user.id, role: req.user.role };
};

export const bookAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const appointment = await appointmentsService.bookAppointment(user.id, req.body);
    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to book appointment";
    const status = message === "Provider not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const listCustomerAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const filters = (req as Request & { validatedQuery?: AppointmentQueryInput })
      .validatedQuery || {};
    const result = await appointmentsService.listCustomerAppointments(user.id, filters);
    res.json({ success: true, data: result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch appointments";
    res.status(400).json({ success: false, message });
  }
};

export const listProviderAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const filters = (req as Request & { validatedQuery?: AppointmentQueryInput })
      .validatedQuery || {};
    const result = await appointmentsService.listProviderAppointments(user.id, filters);
    res.json({ success: true, data: result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch appointments";
    res.status(400).json({ success: false, message });
  }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const appointment = await appointmentsService.updateAppointmentStatus(
      req.params.id,
      user,
      req.body.status
    );
    res.json({
      success: true,
      data: appointment,
      message: "Appointment status updated",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update appointment status";
    const status = message === "Appointment not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};
