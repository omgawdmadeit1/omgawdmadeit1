import Link from "next/link";

export default function AuthPage() {
  return <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
    <h1 className="text-3xl font-semibold">Sign in</h1>
    <input className="rounded-xl border border-slate-700 bg-surface p-3" placeholder="Email" />
    <button className="rounded-xl bg-primary p-3 font-semibold text-slate-950">Continue with Email</button>
    <button className="rounded-xl border border-slate-700 p-3">Continue with Google</button>
    <Link href="/onboarding" className="text-sm text-accent">Demo: Continue to onboarding</Link>
  </div>;
}
