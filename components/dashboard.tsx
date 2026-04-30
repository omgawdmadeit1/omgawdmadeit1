"use client";

import { useEffect, useState } from "react";

type Post = {
  id: string;
  content: string;
  status: string;
  scheduledFor: string | null;
  approved: boolean;
  logs: Array<{ id: string; success: boolean; message: string; attemptedAt: string }>;
};

export function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [approved, setApproved] = useState(false);

  async function refresh() {
    const res = await fetch("/api/posts");
    setPosts(await res.json());
  }

  useEffect(() => { void refresh(); }, []);

  async function submit() {
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, scheduledFor: scheduledFor || undefined, approved }),
    });
    setContent("");
    setScheduledFor("");
    setApproved(false);
    await refresh();
  }

  async function postNow(id: string) {
    await fetch(`/api/posts/${id}/publish`, { method: "POST" });
    await refresh();
  }

  return (
    <main className="mx-auto max-w-4xl p-8 space-y-8">
      <h1 className="text-2xl font-bold">X Auto Poster Dashboard</h1>
      <a className="underline" href="/api/auth/x/login">Connect X Account</a>
      <div className="space-y-2 rounded border border-slate-700 p-4">
        <textarea className="w-full rounded bg-slate-900 p-2" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write post" />
        <input className="rounded bg-slate-900 p-2" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
        <label className="flex items-center gap-2"><input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />Approved</label>
        <button className="rounded bg-blue-600 px-4 py-2" onClick={submit}>Save Post</button>
      </div>
      <div className="space-y-4">
        {posts.map((p) => (
          <div key={p.id} className="rounded border border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <p>{p.content}</p>
              <button className="rounded bg-emerald-700 px-3 py-1" onClick={() => postNow(p.id)}>Post Now</button>
            </div>
            <p className="text-sm">Status: {p.status} {p.scheduledFor ? `(scheduled ${new Date(p.scheduledFor).toLocaleString()})` : ""}</p>
            <p className="text-sm">Approved: {String(p.approved)}</p>
            <ul className="mt-2 text-xs text-slate-300">{p.logs.map((l) => <li key={l.id}>{l.attemptedAt}: {l.success ? "✅" : "❌"} {l.message}</li>)}</ul>
          </div>
        ))}
      </div>
    </main>
  );
}
