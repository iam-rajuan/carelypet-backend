import Stripe from "stripe";
import { env } from "../../../env";

const buildStripe = (): Stripe => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key not configured");
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
};

export const createPaymentIntent = async (payload: {
  amount: number;
  currency: string;
  metadata: Record<string, string>;
  idempotencyKey?: string;
}): Promise<{ id: string; clientSecret: string }> => {
  const stripe = buildStripe();
  const intent = await stripe.paymentIntents.create(
    {
      amount: payload.amount,
      currency: payload.currency,
      metadata: payload.metadata,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    },
    payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : undefined
  );

  if (!intent.client_secret) {
    throw new Error("Failed to create payment intent");
  }

  return { id: intent.id, clientSecret: intent.client_secret };
};

export const retrievePaymentIntent = async (
  id: string
): Promise<Stripe.PaymentIntent> => {
  const stripe = buildStripe();
  return stripe.paymentIntents.retrieve(id, {
    expand: ["latest_charge"],
  });
};
