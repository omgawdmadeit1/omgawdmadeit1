"use client";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { transactions } from "@/data/mockData";

export default function TransactionsPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => transactions.filter(t => t.merchant.toLowerCase().includes(query.toLowerCase()) || t.category.toLowerCase().includes(query.toLowerCase())), [query]);
  return <AppShell title="Transactions">
    <Card><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-background p-3" placeholder="Search merchant or category" /></Card>
    <Card><table className="w-full text-sm"><thead className="text-left text-slate-400"><tr><th>Date</th><th>Merchant</th><th>Category</th><th>Account</th><th className="text-right">Amount</th></tr></thead><tbody>{filtered.map(t => <tr key={t.id} className="border-t border-slate-800"><td className="py-3">{t.date}</td><td>{t.merchant}</td><td><span className="rounded bg-slate-800 px-2 py-1">{t.category}</span></td><td>{t.account}</td><td className="text-right font-medium">${t.amount.toLocaleString()}</td></tr>)}</tbody></table></Card>
  </AppShell>;
}
