import Link from "next/link";

const links = [
  ["Dashboard", "/dashboard"],
  ["Transactions", "/transactions"],
  ["AI CFO Chat", "/chat"],
  ["Reports", "/reports"],
  ["Budgets", "/budgets"],
];

export function Sidebar() {
  return <aside className="w-full rounded-2xl border border-slate-800 bg-surface p-4 lg:w-64">
    <div className="mb-6 text-lg font-semibold text-primary">Prosperity CFO</div>
    <nav className="space-y-2">{links.map(([label, href]) => <Link key={href} href={href} className="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">{label}</Link>)}</nav>
  </aside>;
}
