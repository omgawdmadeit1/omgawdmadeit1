import Link from "next/link";

export default function HomePage() {
  return <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 p-6 text-center">
    <h1 className="text-5xl font-bold">Prosperity CFO</h1>
    <p className="max-w-2xl text-slate-300">Your AI-powered proactive CFO for clear financial control. Connect accounts, track cash flow, and get decisive strategic guidance.</p>
    <div className="flex gap-3"><Link href="/auth" className="rounded-xl bg-primary px-5 py-3 font-medium text-slate-950">Get Started</Link></div>
  </div>;
}
