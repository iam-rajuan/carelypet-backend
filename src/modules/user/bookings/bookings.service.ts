import ServiceBooking, { IServiceBooking, ReminderType } from "../../services/serviceBooking.model";
import ServiceCatalog, { ServiceType } from "../../services/serviceCatalog.model";
import TaxSetting from "../../services/taxSetting.model";
import AvailabilitySetting from "../../services/availabilitySetting.model";
import Pet from "../pets/pets.model";
import { calculateTotals } from "../../services/pricing.service";
import { env } from "../../../env";
import { CreateBookingInput, BookingQuery } from "./bookings.validation";
import { createPaymentIntent } from "./stripe.service";

const parseDate = (value: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid scheduled date/time");
  }
  return parsed;
};

const parseTimeToDate = (date: Date, time: string): Date => {
  const [hour, minute] = time.split(":").map((value) => Number(value));
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
};

const getAvailabilitySetting = async () => {
  const setting = await AvailabilitySetting.findOne().sort({ createdAt: -1 });
  if (!setting) {
    return { startTime: "09:00", endTime: "17:00", slotMinutes: 30 };
  }
  return {
    startTime: setting.startTime,
    endTime: setting.endTime,
    slotMinutes: setting.slotMinutes,
  };
};

export const getAvailableSlots = async (date: string): Promise<string[]> => {
  const day = parseDate(`${date}T00:00:00`);
  const setting = await getAvailabilitySetting();
  const start = parseTimeToDate(day, setting.startTime);
  const end = parseTimeToDate(day, setting.endTime);

  if (end <= start) {
    return [];
  }

  const bookings = await ServiceBooking.find({
    scheduledAt: { $gte: start, $lt: end },
  }).select("scheduledAt");

  const bookedTimes = new Set(
    bookings.map((booking) => booking.scheduledAt.toISOString())
  );

  const slots: string[] = [];
  let cursor = new Date(start);
  while (cursor < end) {
    const slotIso = cursor.toISOString();
    if (!bookedTimes.has(slotIso) && cursor.getTime() > Date.now()) {
      slots.push(cursor.toISOString());
    }
    cursor = new Date(cursor.getTime() + setting.slotMinutes * 60 * 1000);
  }

  return slots;
};

const resolveServices = async (payload: CreateBookingInput) => {
  if (payload.selectAllServices) {
    const services = await ServiceCatalog.find({ isActive: true });
    if (services.length === 0) {
      throw new Error("No active services available");
    }
    return services;
  }
  const ids = payload.serviceIds || [];
  if (ids.length === 0) {
    throw new Error("At least one service is required");
  }
  const services = await ServiceCatalog.find({ _id: { $in: ids }, isActive: true });
  if (services.length === 0) {
    throw new Error("No active services found for selection");
  }
  return services;
};

const resolvePets = async (userId: string, payload: CreateBookingInput) => {
  if (payload.selectAllPets) {
    const pets = await Pet.find({ owner: userId });
    if (pets.length === 0) {
      throw new Error("No pets found for selection");
    }
    return pets;
  }
  const ids = payload.petIds || [];
  if (ids.length === 0) {
    throw new Error("At least one pet is required");
  }
  const pets = await Pet.find({ _id: { $in: ids }, owner: userId });
  if (pets.length === 0) {
    throw new Error("No pets found for selection");
  }
  return pets;
};

const getTaxPercent = async (): Promise<number> => {
  const tax = await TaxSetting.findOne({ isActive: true }).sort({ createdAt: -1 });
  return tax?.percent ?? 0;
};

const buildItems = (
  services: Array<{ _id: any; name: string; type: ServiceType; price: number }>,
  pets: Array<{ _id: any; name: string; species: string; breed?: string; age?: number }>
) => {
  const items = [] as IServiceBooking["items"];
  for (const service of services) {
    for (const pet of pets) {
      items.push({
        service: service._id,
        pet: pet._id,
        serviceName: service.name,
        serviceType: service.type,
        petName: pet.name,
        petType: pet.species,
        petBreed: pet.breed || "",
        petAge: pet.age ?? null,
        unitPrice: service.price,
      });
    }
  }
  return items;
};

export const createBooking = async (
  userId: string,
  payload: CreateBookingInput
): Promise<{ booking: IServiceBooking; clientSecret: string }> => {
  const services = await resolveServices(payload);
  const pets = await resolvePets(userId, payload);
  const scheduledAt = parseDate(payload.scheduledAt);

  const dateKey = scheduledAt.toISOString().slice(0, 10);
  const slots = await getAvailableSlots(dateKey);
  if (!slots.includes(scheduledAt.toISOString())) {
    throw new Error("Selected time is not available");
  }

  const reminderType = (payload.reminderType || "none") as ReminderType;

  const items = buildItems(services, pets);
  const subtotal = Number(
    items.reduce((sum, item) => sum + item.unitPrice, 0).toFixed(2)
  );
  const taxPercent = await getTaxPercent();
  const { taxAmount, total } = calculateTotals(subtotal, taxPercent);
  const currency = env.STRIPE_CURRENCY || "usd";

  const booking = await ServiceBooking.create({
    customer: userId,
    provider: payload.providerId || null,
    pets: pets.map((pet) => pet._id),
    services: services.map((service) => service._id),
    items,
    scheduledAt,
    reminderType,
    status: "pending",
    paymentStatus: "unpaid",
    subtotal,
    taxPercent,
    taxAmount,
    total,
    currency,
  });

  try {
    const paymentIntent = await createPaymentIntent({
      amount: Math.round(total * 100),
      currency,
      metadata: { bookingId: booking._id.toString(), userId },
      idempotencyKey: booking._id.toString(),
    });

    booking.paymentIntentId = paymentIntent.id;
    await booking.save();

    return { booking, clientSecret: paymentIntent.clientSecret };
  } catch (err) {
    await booking.deleteOne();
    const message = err instanceof Error ? err.message : "Failed to create payment";
    throw new Error(message);
  }
};

export const confirmPayment = async (userId: string, bookingId: string): Promise<IServiceBooking> => {
  const booking = await ServiceBooking.findOne({ _id: bookingId, customer: userId });
  if (!booking) {
    throw new Error("Booking not found");
  }
  if (booking.paymentStatus !== "paid") {
    throw new Error("Payment not completed");
  }
  return booking;
};

export const listBookings = async (
  userId: string,
  query: BookingQuery
): Promise<{ data: IServiceBooking[]; pagination: { total: number; page: number; limit: number } }> => {
  const filter: Record<string, unknown> = { customer: userId };
  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }
  if (query.paymentStatus && query.paymentStatus !== "all") {
    filter.paymentStatus = query.paymentStatus;
  }

  const skip = (query.page - 1) * query.limit;
  const [total, data] = await Promise.all([
    ServiceBooking.countDocuments(filter),
    ServiceBooking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
  ]);

  return { data, pagination: { total, page: query.page, limit: query.limit } };
};
