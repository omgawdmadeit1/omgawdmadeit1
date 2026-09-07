import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function ReportsPage() {
  return <AppShell title="AI Reports">
    <Card><h2 className="mb-2 text-lg font-semibold">Weekly Brief</h2><p className="text-slate-300">Revenue rose 14% week-over-week. Marketing spend efficiency improved to 3.2x ROAS. Watch contractor utilization: payroll ratio increased 4.8 percentage points.</p></Card>
    <Card><h2 className="mb-2 text-lg font-semibold">Monthly Executive Summary</h2><ul className="list-disc space-y-1 pl-5 text-slate-300"><li>Cash runway stable at 11.2 months.</li><li>Largest cost center: payroll (42% of expenses).</li><li>Recommended action: shift 10% ad budget to highest-converting channel.</li></ul></Card>
  </AppShell>;
}
