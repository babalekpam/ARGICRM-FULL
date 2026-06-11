/**
 * Stripe client factory — uses store-specific or platform keys
 */
import Stripe from "stripe";

export function getStripeForKey(secretKey: string): Stripe {
  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" });
}

export function getPlatformStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-08-27.basil" });
}
