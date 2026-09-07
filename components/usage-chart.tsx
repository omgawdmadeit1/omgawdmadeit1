export type UsagePoint = { label: string; tokens: number };

export function UsageChart({ points }: { points: UsagePoint[] }) {
  const max = Math.max(...points.map((point) => point.tokens), 1);
  return (
    <div className="rounded-3xl border border-white/10 bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Usage dashboard</h2>
          <p className="text-sm text-slate-400">Grok tokens logged in Supabase and mirrored to Stripe meter events.</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm">Last 7 events</span>
      </div>
      <div className="flex h-64 items-end gap-3">
        {points.map((point) => {
          const height = Math.max((point.tokens / max) * 100, 4);
          return (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-48 w-full items-end rounded-2xl bg-white/5 p-1">
                <div className="w-full rounded-xl bg-gradient-to-t from-sky-400 to-violet-400" style={{ height: `${height}%` }} />
              </div>
              <span className="text-xs text-slate-400">{point.label}</span>
              <span className="text-xs font-bold">{point.tokens}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
