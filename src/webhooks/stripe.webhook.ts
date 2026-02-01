import { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../env";
import ServiceBooking from "../modules/services/serviceBooking.model";
import AdoptionOrder from "../modules/user/adoption/adoptionOrder.model";
import AdoptionRequest from "../modules/user/adoption/adoptionRequest.model";
import AdoptionListing from "../modules/user/adoption/adoption.model";
import { clearBasket } from "../modules/user/adoption/adoption.service";

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
    }
  }

  res.json({ received: true });
};
