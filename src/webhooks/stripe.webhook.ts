import { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../env";
import ServiceBooking from "../modules/services/serviceBooking.model";

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
  }

  res.json({ received: true });
};
