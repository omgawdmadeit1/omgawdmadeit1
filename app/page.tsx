import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
      <nav className="flex items-center justify-between">
        <strong className="text-xl">Grok SaaS</strong>
        <div className="flex gap-3 text-sm text-slate-300">
          <Link href="/pricing">Pricing</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </nav>
      <section className="grid flex-1 items-center gap-10 py-20 md:grid-cols-2">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-sm text-sky-200">
            Grok-powered, Stripe-metered AI SaaS starter
          </p>
          <h1 className="text-5xl font-black tracking-tight md:text-7xl">Launch billable AI features without plumbing hell.</h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300">
            Supabase auth, Stripe checkout and metered usage, Grok chat completions, and dashboard usage charts are wired together for a Vercel deploy.
          </p>
          <div className="mt-8 flex gap-3">
            <Link className="rounded-xl bg-sky-400 px-5 py-3 font-bold text-slate-950" href="/dashboard">Open dashboard</Link>
            <Link className="rounded-xl border border-white/15 px-5 py-3 font-bold" href="/pricing">View pricing</Link>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-glow backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">Monthly AI tokens</span>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">Live billing ready</span>
          </div>
          <div className="space-y-4">
            {[72, 54, 88, 43, 91].map((width, index) => (
              <div key={index} className="h-10 rounded-full bg-white/5 p-1">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400" style={{ width: `${width}%` }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
