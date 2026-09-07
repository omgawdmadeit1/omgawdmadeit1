export type QueueJob<T> = { id: string; payload: T; run: (payload: T) => Promise<void> };
const queue: QueueJob<unknown>[] = [];
let running = false;

export function enqueue<T>(job: QueueJob<T>) {
  queue.push(job as QueueJob<unknown>);
  void drain();
}

async function drain() {
  if (running) return;
  running = true;
  while (queue.length) {
    const next = queue.shift();
    if (!next) continue;
    await next.run(next.payload);
  }
  running = false;
}
