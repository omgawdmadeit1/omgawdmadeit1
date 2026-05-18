import { appUrl } from '@/lib/env';

export default function PricingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <h1 className="text-4xl font-black">Simple usage-based pricing</h1>
      <p className="mt-3 text-slate-300">Free users can test the product. Pro customers unlock metered Grok usage through Stripe.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Plan name="Free" price="$0" bullets={["Magic-link login", "Limited Grok trials", "Usage dashboard"]} />
        <form action={`${appUrl()}/api/stripe/checkout`} method="POST" className="rounded-3xl border border-sky-400/40 bg-sky-400/10 p-8 shadow-glow">
          <h2 className="text-2xl font-bold">Pro</h2>
          <p className="mt-3 text-5xl font-black">Metered</p>
          <ul className="my-6 space-y-2 text-slate-200">
            <li>Unlimited Grok messages</li>
            <li>Stripe meter events per token</li>
            <li>Customer portal and invoices</li>
          </ul>
          <button className="w-full rounded-xl bg-sky-400 px-5 py-3 font-bold text-slate-950">Start checkout</button>
        </form>
      </div>
    </main>
  );
}

function Plan({ name, price, bullets }: { name: string; price: string; bullets: string[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-card p-8">
      <h2 className="text-2xl font-bold">{name}</h2>
      <p className="mt-3 text-5xl font-black">{price}</p>
      <ul className="my-6 space-y-2 text-slate-300">{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
    </div>
  );
}
