import { NextResponse } from 'next/server';
import { appUrl } from '@/lib/env';
import { stripe } from '@/lib/stripe';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(`${appUrl()}/login`);
    if (!process.env.STRIPE_PRO_PRICE_ID) throw new Error('Missing STRIPE_PRO_PRICE_ID.');

    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin.from('profiles').select('stripe_customer_id,email').eq('id', user.id).single();
    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe().customers.create({ email: user.email || profile?.email || undefined, metadata: { user_id: user.id } });
      customerId = customer.id;
      await admin.from('profiles').upsert({ id: user.id, email: user.email, stripe_customer_id: customerId }, { onConflict: 'id' });
    }

    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${appUrl()}/grok?checkout=success`,
      cancel_url: `${appUrl()}/pricing?checkout=cancelled`,
      metadata: { user_id: user.id }
    });

    return NextResponse.redirect(session.url || `${appUrl()}/pricing`);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Checkout error.' }, { status: 500 });
  }
}
