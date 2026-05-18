import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { appUrl } from '@/lib/env';

async function signIn(formData: FormData) {
  'use server';
  const email = String(formData.get('email') || '');
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${appUrl()}/auth/callback?next=/dashboard` } });
  redirect('/login?sent=1');
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <form action={signIn} className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-8">
        <h1 className="text-3xl font-black">Sign in</h1>
        <p className="mt-2 text-slate-300">Enter your email and Supabase will send a magic link.</p>
        <input name="email" type="email" required placeholder="you@example.com" className="mt-6 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3" />
        <button className="mt-4 w-full rounded-xl bg-sky-400 px-5 py-3 font-bold text-slate-950">Send magic link</button>
        <SentNotice searchParams={searchParams} />
      </form>
    </main>
  );
}

async function SentNotice({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const params = await searchParams;
  return params.sent ? <p className="mt-4 text-sm text-emerald-300">Check your inbox for the sign-in link.</p> : null;
}
