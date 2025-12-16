import mongoose from "mongoose";
import Appointment, {
  AppointmentStatus,
  IAppointment,
} from "./appointments.model";
import ServiceProvider, { IServiceProvider } from "../providers/providers.model";
import {
  AppointmentQueryInput,
  CreateAppointmentInput,
} from "./appointments.validation";

export interface PaginatedAppointments {
  data: IAppointment[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const sanitizePagination = (page?: number, limit?: number) => {
  const safePage = !page || Number.isNaN(page) || page < 1 ? 1 : Math.floor(page);
  const safeLimit =
    !limit || Number.isNaN(limit) || limit < 1 || limit > 100 ? 10 : Math.floor(limit);
  return { page: safePage, limit: safeLimit };
};

const timeToMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();
const slotToMinutes = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

const isWithinAvailability = (provider: IServiceProvider, start: Date, end: Date) => {
  if (!provider.availability || provider.availability.length === 0) {
    return false;
  }

  if (start.getDay() !== end.getDay()) {
    return false;
  }

  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  const day = start.getDay();

  return provider.availability.some(
    (slot) =>
      slot.isActive !== false &&
      slot.day === day &&
      startMinutes >= slotToMinutes(slot.startTime) &&
      endMinutes <= slotToMinutes(slot.endTime)
  );
};

const ensureNoConflict = async (
  providerId: mongoose.Types.ObjectId,
  startTime: Date,
  endTime: Date
) => {
  const conflict = await Appointment.findOne({
    provider: providerId,
    status: { $in: ["pending", "confirmed"] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });

  if (conflict) {
    throw new Error("Time slot is already booked");
  }
};

export const bookAppointment = async (
  customerId: string,
  payload: CreateAppointmentInput
): Promise<IAppointment> => {
  const startTime = payload.startTime;
  const endTime = payload.endTime;

  if (startTime >= endTime) {
    throw new Error("startTime must be before endTime");
  }

  const provider = await ServiceProvider.findById(payload.providerId);
  if (!provider) {
    throw new Error("Provider not found");
  }

  if (provider.verificationStatus !== "verified") {
    throw new Error("Provider must be verified to accept bookings");
  }

  if (!isWithinAvailability(provider, startTime, endTime)) {
    throw new Error("Requested time is outside provider availability");
  }

  await ensureNoConflict(provider._id, startTime, endTime);

  const appointment = await Appointment.create({
    provider: provider._id,
    customer: customerId,
    startTime,
    endTime,
    status: "pending",
    notes: payload.notes?.trim(),
  });

  return appointment;
};

export const listCustomerAppointments = async (
  customerId: string,
  filters: AppointmentQueryInput
): Promise<PaginatedAppointments> => {
  const { page, limit } = sanitizePagination(filters.page, filters.limit);

  const query: Record<string, any> = { customer: customerId };
  if (filters.status) {
    query.status = filters.status;
  }

  const total = await Appointment.countDocuments(query);
  const appointments = await Appointment.find(query)
    .sort({ startTime: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("provider");

  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
  return { data: appointments, page, limit, total, totalPages };
};

export const listProviderAppointments = async (
  ownerId: string,
  filters: AppointmentQueryInput
): Promise<PaginatedAppointments> => {
  const { page, limit } = sanitizePagination(filters.page, filters.limit);

  const providers = await ServiceProvider.find({ owner: ownerId }, { _id: 1 });
  const providerIds = providers.map((p) => p._id);
  if (providerIds.length === 0) {
    return { data: [], page, limit, total: 0, totalPages: 1 };
  }

  const query: Record<string, any> = { provider: { $in: providerIds } };
  if (filters.status) {
    query.status = filters.status;
  }

  const total = await Appointment.countDocuments(query);
  const appointments = await Appointment.find(query)
    .sort({ startTime: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("customer")
    .populate("provider");

  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
  return { data: appointments, page, limit, total, totalPages };
};

export const updateAppointmentStatus = async (
  appointmentId: string,
  user: { id: string; role: string },
  status: AppointmentStatus
): Promise<IAppointment> => {
  const appointment = await Appointment.findById(appointmentId).populate({
    path: "provider",
    select: "owner verificationStatus",
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const provider = appointment.provider as unknown as IServiceProvider | null;
  const providerOwnerId =
    provider && provider.owner ? (provider.owner as mongoose.Types.ObjectId).toString() : null;

  const isCustomer = appointment.customer.toString() === user.id;
  const isProviderOwner = providerOwnerId === user.id;
  const isAdmin = user.role === "admin";

  if (!isCustomer && !isProviderOwner && !isAdmin) {
    throw new Error("Not authorized to update appointment");
  }

  if (appointment.status === status) {
    throw new Error("Appointment is already in the requested status");
  }

  if (appointment.status === "cancelled" || appointment.status === "completed") {
    throw new Error("Appointment is already finalized");
  }

  if (status === "pending") {
    throw new Error("Cannot revert appointment to pending");
  }

  if (status === "confirmed") {
    if (!isProviderOwner && !isAdmin) {
      throw new Error("Only providers can confirm appointments");
    }
    if (appointment.status !== "pending") {
      throw new Error("Only pending appointments can be confirmed");
    }
  }

  if (status === "completed") {
    if (!isProviderOwner && !isAdmin) {
      throw new Error("Only providers can complete appointments");
    }
    if (appointment.status !== "confirmed") {
      throw new Error("Only confirmed appointments can be completed");
    }
  }

  if (status === "cancelled") {
    if (!["pending", "confirmed"].includes(appointment.status)) {
      throw new Error("Only pending or confirmed appointments can be cancelled");
    }
  }

  appointment.status = status;
  await appointment.save();
  return appointment;
};
