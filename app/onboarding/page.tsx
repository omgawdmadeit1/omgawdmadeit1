import Link from "next/link";

export default function OnboardingPage() {
  return <div className="mx-auto max-w-2xl p-6">
    <h1 className="mb-4 text-3xl font-semibold">Welcome to Prosperity CFO</h1>
    <div className="grid gap-3">
      <input className="rounded-xl border border-slate-700 bg-surface p-3" placeholder="Business name" />
      <select className="rounded-xl border border-slate-700 bg-surface p-3"><option>Choose business type</option></select>
      <select className="rounded-xl border border-slate-700 bg-surface p-3"><option>Monthly revenue range</option></select>
    </div>
    <Link href="/dashboard" className="mt-4 inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-slate-950">Launch Dashboard</Link>
  </div>;
}
