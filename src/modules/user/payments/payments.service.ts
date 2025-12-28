import * as bookingsService from "../bookings/bookings.service";
import { PaymentQuery } from "./payments.validation";
import { IServiceBooking } from "../../services/serviceBooking.model";

export const listPayments = async (
  userId: string,
  query: PaymentQuery
): Promise<{ data: IServiceBooking[]; pagination: { total: number; page: number; limit: number } }> => {
  return bookingsService.listBookings(userId, {
    ...query,
    paymentStatus: query.paymentStatus === "all" ? "paid" : query.paymentStatus,
  });
};
