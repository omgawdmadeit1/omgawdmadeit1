import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { accounts } from "@/data/mockData";

export default function DashboardPage() {
  return <AppShell title="Financial Overview">
    <div className="grid gap-4 md:grid-cols-3">
      <Card><p className="text-sm text-slate-400">Cash Position</p><p className="text-2xl font-bold">$83,430</p></Card>
      <Card><p className="text-sm text-slate-400">Monthly Net</p><p className="text-2xl font-bold">+$21,240</p></Card>
      <Card><p className="text-sm text-slate-400">Runway</p><p className="text-2xl font-bold">11.2 months</p></Card>
    </div>
    <Card><h2 className="mb-3 text-lg font-semibold">Connected Accounts</h2><div className="space-y-2">{accounts.map(a => <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-800 p-3"><div><p>{a.name}</p><p className="text-xs text-slate-400">{a.type}</p></div><p className="font-semibold">${a.balance.toLocaleString()}</p></div>)}</div></Card>
  </AppShell>;
}
