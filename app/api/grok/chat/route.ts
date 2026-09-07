import { NextResponse } from 'next/server';
import { completeWithGrok } from '@/lib/grok';
import { meterEventName, stripe } from '@/lib/stripe';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

type IncomingMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Sign in to use the Grok playground.' }, { status: 401 });

    const body = (await request.json()) as { messages?: IncomingMessage[] };
    const userMessages = (body.messages || [])
      .filter((message) => ['user', 'assistant'].includes(message.role) && message.content?.trim())
      .slice(-12);
    if (!userMessages.length) return NextResponse.json({ error: 'Send at least one message.' }, { status: 400 });

    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin.from('profiles').select('subscription_tier,stripe_customer_id').eq('id', user.id).single();
    const tier = profile?.subscription_tier || 'free';

    if (tier === 'free') {
      const { count } = await admin
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      if ((count || 0) >= 25) {
        return NextResponse.json({ error: 'Free monthly limit reached. Upgrade to Pro to keep chatting.' }, { status: 402 });
      }
    }

    const result = await completeWithGrok([
      { role: 'system', content: 'You are a concise, practical SaaS copilot.' },
      ...userMessages
    ]);
    const tokens = result.tokens || estimateTokens(userMessages.map((message) => message.content).join(' ') + result.content);
    const model = process.env.GROK_MODEL || 'grok-3-mini';

    await admin.from('usage_logs').insert({ user_id: user.id, tokens_used: tokens, model });

    if (profile?.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
      await stripe().billing.meterEvents.create({
        event_name: meterEventName,
        payload: {
          stripe_customer_id: profile.stripe_customer_id,
          value: String(tokens)
        }
      });
    }

    return NextResponse.json({ content: result.content, tokens, usage: result.usage });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected chat error.' }, { status: 500 });
  }
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}
