import Link from "next/link";

const products = [
  {
    name: "Financial Dashboard",
    description: "Track cash position, monthly net, and runway in one place.",
    href: "/dashboard",
  },
  {
    name: "Transactions",
    description: "Review and categorize recent activity quickly.",
    href: "/transactions",
  },
  {
    name: "Budgets",
    description: "Set and monitor monthly spending guardrails.",
    href: "/budgets",
  },
  {
    name: "Reports",
    description: "Generate executive summaries and board-ready insights.",
    href: "/reports",
  },
  {
    name: "AI CFO Chat",
    description: "Ask strategic questions and get proactive recommendations.",
    href: "/chat",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 p-6">
      <section className="rounded-3xl border border-slate-800 bg-surface p-8 text-center">
        <p className="mb-3 inline-block rounded-full border border-primary/50 px-4 py-1 text-xs uppercase tracking-wide text-primary">
          Unified Finance Operating System
        </p>
        <h1 className="text-4xl font-bold md:text-5xl">Prosperity CFO Suite</h1>
        <p className="mx-auto mt-4 max-w-3xl text-slate-300">
          All core products are now combined into one functional app experience: onboarding,
          live financial monitoring, transaction workflows, budget controls, reporting, and
          embedded AI strategy support.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/auth" className="rounded-xl bg-primary px-5 py-3 font-medium text-slate-950">
            Get Started
          </Link>
          <Link href="/dashboard" className="rounded-xl border border-slate-700 px-5 py-3 font-medium hover:bg-slate-800">
            Open Unified App
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Included Products</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <Link
              key={product.href}
              href={product.href}
              className="rounded-2xl border border-slate-800 bg-surface p-5 transition hover:border-primary/60"
            >
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="mt-2 text-sm text-slate-300">{product.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
