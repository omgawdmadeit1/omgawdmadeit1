import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChatPanel } from '@/components/chat-panel';
import { UsageChart } from '@/components/usage-chart';
import { hasSupabasePublicConfig } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function GrokDashboardPage() {
  if (!hasSupabasePublicConfig()) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl space-y-4 px-6 py-10">
        <h1 className="text-4xl font-black">Grok playground</h1>
        <p className="text-slate-300">
          Configure Supabase, Stripe, and GROK_API_KEY to enable the signed-in usage dashboard and metered billing.
        </p>
        <Link className="inline-block rounded-xl bg-sky-400 px-5 py-3 font-bold text-slate-950" href="/pricing">
          View pricing
        </Link>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('subscription_tier,stripe_customer_id').eq('id', user.id).single();
  const { data: logs } = await supabase
    .from('usage_logs')
    .select('tokens_used,model,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(7);

  const points = (logs || []).reverse().map((log, index) => ({
    label: new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) || `#${index + 1}`,
    tokens: log.tokens_used || 0
  }));

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black">Grok dashboard</h1>
          <p className="text-slate-300">Signed in as {user.email}. Plan: {profile?.subscription_tier || 'free'}.</p>
        </div>
        <form action="/api/stripe/portal" method="POST">
          <button className="rounded-xl border border-white/15 px-5 py-3 font-bold">Manage billing</button>
        </form>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ChatPanel />
        <UsageChart points={points.length ? points : [{ label: 'No data', tokens: 0 }]} />
      </div>
    </main>
  );
}
