import { NextResponse } from 'next/server';
import { appUrl } from '@/lib/env';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${appUrl()}/login`);

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
  if (!profile?.stripe_customer_id) return NextResponse.redirect(`${appUrl()}/pricing`);

  const session = await stripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl()}/dashboard`
  });
  return NextResponse.redirect(session.url);
}
