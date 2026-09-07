"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function ChatPage() {
  const [messages, setMessages] = useState([{ role: "assistant", content: "I’m your CFO copilot. Ask me about runway, margins, or spending leaks." }]);
  const [input, setInput] = useState("");
  const send = async () => { if (!input.trim()) return; const next = [...messages, { role: "user", content: input }]; setMessages(next); setInput(""); const r = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ messages: next }) }); const d = await r.json(); setMessages([...next, { role: "assistant", content: d.reply }]); };
  return <AppShell title="AI CFO Chat"><Card className="space-y-3"><div className="h-[420px] space-y-3 overflow-y-auto">{messages.map((m, i) => <div key={i} className={`rounded-xl p-3 ${m.role === "assistant" ? "bg-slate-800" : "bg-primary text-slate-950"}`}>{m.content}</div>)}</div><div className="flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 rounded-xl border border-slate-700 bg-background p-3" placeholder="How can I improve cash flow this month?" /><button onClick={send} className="rounded-xl bg-accent px-4 py-2 font-semibold text-slate-950">Send</button></div></Card></AppShell>;
}
