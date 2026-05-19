import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { budgets } from "@/data/mockData";

export default function BudgetsPage() {
  return <AppShell title="Smart Budgets">
    <Card><h2 className="mb-3 text-lg font-semibold">Category Budget vs Actual</h2><div className="space-y-3">{budgets.map((b) => { const variance = b.actual - b.budgeted; return <div key={b.category}><div className="mb-1 flex justify-between text-sm"><span>{b.category}</span><span className={variance > 0 ? "text-rose-400" : "text-emerald-400"}>{variance > 0 ? "+" : ""}${variance}</span></div><div className="h-2 rounded bg-slate-800"><div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, (b.actual / b.budgeted) * 100)}%` }} /></div></div>;})}</div></Card>
  </AppShell>;
}
