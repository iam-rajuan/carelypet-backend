import { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../env";
import ServiceBooking from "../modules/services/serviceBooking.model";
import AdoptionOrder from "../modules/user/adoption/adoptionOrder.model";
import AdoptionRequest from "../modules/user/adoption/adoptionRequest.model";
import AdoptionListing from "../modules/user/adoption/adoption.model";
import { clearBasket } from "../modules/user/adoption/adoption.service";
import * as notificationService from "../modules/notifications/notification.service";

const buildStripe = (): Stripe => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key not configured");
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    return res.status(400).send("Missing Stripe signature");
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).send("Stripe webhook secret not configured");
  }

  let event: Stripe.Event;
  try {
    const stripe = buildStripe();
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook signature";
    return res.status(400).send(message);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const booking = await ServiceBooking.findOne({ paymentIntentId: intent.id });
    if (booking && booking.paymentStatus !== "paid") {
      booking.paymentStatus = "paid";
      booking.paidAt = new Date();
      await booking.save();

      try {
        await Promise.all([
          notificationService.createForUser({
            recipientId: String(booking.customer),
            type: "payment_received",
            title: "Payment received",
            body: "Your service booking payment was confirmed.",
            priority: "high",
            entityType: "booking",
            entityId: String(booking._id),
            dedupeKey: `payment-booking:${intent.id}`,
            metadata: { paymentIntentId: intent.id },
          }),
          notificationService.createForAdmins({
            type: "payment_received",
            title: "Booking payment succeeded",
            body: `Payment received for booking ${String(booking._id)}.`,
            priority: "high",
            entityType: "booking",
            entityId: String(booking._id),
            dedupeKey: `payment-booking-admin:${intent.id}`,
            metadata: { paymentIntentId: intent.id, bookingId: String(booking._id) },
          }),
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[notifications] Failed to create booking payment notifications:", message);
      }
    }

    const adoptionOrder = await AdoptionOrder.findOne({ paymentIntentId: intent.id });
    if (adoptionOrder && adoptionOrder.paymentStatus !== "paid") {
      adoptionOrder.paymentStatus = "paid";
      adoptionOrder.status = "paid";
      adoptionOrder.paidAt = new Date();
      await adoptionOrder.save();

      const listingIds = adoptionOrder.items.map((item) => item.listing.toString());
      const listings = await AdoptionListing.find({ _id: { $in: listingIds } });
      await Promise.all(
        listings.map((listing) => {
          listing.status = "pending";
          return listing.save();
        })
      );

      await Promise.all(
        listingIds.map((listingId) =>
          AdoptionRequest.findOneAndUpdate(
            { listing: listingId, customer: adoptionOrder.customer },
            { status: "pending" },
            { upsert: true, new: true }
          )
        )
      );

      await clearBasket(adoptionOrder.customer.toString());

      try {
        await Promise.all([
          notificationService.createForUser({
            recipientId: String(adoptionOrder.customer),
            type: "payment_received",
            title: "Payment received",
            body: "Your adoption order payment was confirmed.",
            priority: "high",
            entityType: "adoption_order",
            entityId: String(adoptionOrder._id),
            dedupeKey: `payment-adoption:${intent.id}`,
            metadata: { paymentIntentId: intent.id },
          }),
          notificationService.createForAdmins({
            type: "payment_received",
            title: "Adoption payment succeeded",
            body: `Payment received for adoption order ${String(adoptionOrder._id)}.`,
            priority: "high",
            entityType: "adoption_order",
            entityId: String(adoptionOrder._id),
            dedupeKey: `payment-adoption-admin:${intent.id}`,
            metadata: { paymentIntentId: intent.id, orderId: String(adoptionOrder._id) },
          }),
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[notifications] Failed to create adoption payment notifications:", message);
      }
    }
  }

  res.json({ received: true });
};
