import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY.');
  }
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY, {
    appInfo: { name: 'Grok SaaS Billing Starter' }
  });
  return stripeClient;
}

export const meterEventName = process.env.STRIPE_METER_EVENT_NAME || 'ai_tokens_used';
