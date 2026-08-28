const counters = new Map<string, number>();

export function incMetric(name: string) {
  counters.set(name, (counters.get(name) ?? 0) + 1);
}

export function getMetricsSnapshot() {
  return Object.fromEntries(counters.entries());
}
