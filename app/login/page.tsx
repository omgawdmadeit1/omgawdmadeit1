import Link from 'next/link';
import { redirect } from 'next/navigation';
import { appUrl, hasSupabasePublicConfig } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function signIn(formData: FormData) {
  'use server';
  if (!hasSupabasePublicConfig()) {
    redirect('/login?setup=1');
  }
  const email = String(formData.get('email') || '');
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${appUrl()}/auth/callback?next=/grok` } });
  redirect('/login?sent=1');
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string; setup?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <form action={signIn} className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-8">
        <h1 className="text-3xl font-black">Sign in</h1>
        <p className="mt-2 text-slate-300">Enter your email and Supabase will send a magic link for the Grok playground.</p>
        <input name="email" type="email" required placeholder="you@example.com" className="mt-6 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3" />
        <button className="mt-4 w-full rounded-xl bg-sky-400 px-5 py-3 font-bold text-slate-950">Send magic link</button>
        {params.sent ? <p className="mt-4 text-sm text-emerald-300">Check your inbox for the sign-in link.</p> : null}
        {params.setup || !hasSupabasePublicConfig() ? (
          <p className="mt-4 text-sm text-amber-300">Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable magic-link login.</p>
        ) : null}
        <p className="mt-6 text-sm text-slate-400">
          Looking for the finance demo instead? <Link className="text-sky-300" href="/auth">Open Prosperity sign-in</Link>
        </p>
      </form>
    </main>
  );
}
