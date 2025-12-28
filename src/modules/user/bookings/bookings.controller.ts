import { Request, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import * as bookingsService from "./bookings.service";
import { AvailabilityQuery, BookingQuery, CreateBookingInput } from "./bookings.validation";
import { env } from "../../../env";

const requireUser = (req: AuthRequest, res: Response): string | null => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  return req.user.id;
};

export const createBooking = async (req: AuthRequest & { body: CreateBookingInput }, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const { booking, clientSecret } = await bookingsService.createBooking(userId, req.body);
    res.status(201).json({
      success: true,
      data: {
        booking,
        clientSecret,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create booking";
    res.status(400).json({ success: false, message });
  }
};

export const confirmBookingPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const booking = await bookingsService.confirmPayment(userId, req.params.id);

    const organizationName = env.ORG_NAME || "Carely Pets";
    const serviceNames = Array.from(new Set(booking.items.map((item) => item.serviceName)));
    const petNames = Array.from(new Set(booking.items.map((item) => item.petName)));

    res.json({
      success: true,
      message: "Payment confirmed",
      data: {
        bookingId: booking._id,
        services: serviceNames,
        appointmentDateTime: booking.scheduledAt,
        organizationName,
        pets: petNames,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to confirm payment";
    const status = message === "Booking not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const listBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const query =
      (req as Request & { validatedQuery?: BookingQuery }).validatedQuery || {
        status: "all",
        paymentStatus: "all",
        page: 1,
        limit: 20,
      };
    const result = await bookingsService.listBookings(userId, query);

    res.json({
      success: true,
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch bookings";
    res.status(400).json({ success: false, message });
  }
};

export const getAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const query =
      (req as Request & { validatedQuery?: AvailabilityQuery }).validatedQuery || {
        date: "",
      };

    const slots = await bookingsService.getAvailableSlots(query.date);
    res.json({ success: true, data: { date: query.date, slots } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch availability";
    res.status(400).json({ success: false, message });
  }
};
