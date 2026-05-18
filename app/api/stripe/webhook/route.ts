import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing Stripe webhook signature or secret.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid webhook signature.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    if (userId) {
      await admin.from('profiles').upsert({
        id: userId,
        email: session.customer_details?.email,
        stripe_customer_id: String(session.customer),
        subscription_tier: 'pro'
      }, { onConflict: 'id' });
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const tier = subscription.status === 'active' || subscription.status === 'trialing' ? 'pro' : 'free';
    await admin.from('profiles').update({ subscription_tier: tier }).eq('stripe_customer_id', String(subscription.customer));
  }

  return NextResponse.json({ received: true });
}
