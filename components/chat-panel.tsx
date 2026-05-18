'use client';

import { FormEvent, useState } from 'react';

type ChatMessage = { role: 'user' | 'assistant'; content: string; tokens?: number };

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) return;

    const nextMessages = [...messages, { role: 'user' as const, content: input.trim() }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError('');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: nextMessages.map(({ role, content }) => ({ role, content })) })
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error || 'Chat request failed.');
      return;
    }

    setMessages((current) => [...current, { role: 'assistant', content: payload.content, tokens: payload.tokens }]);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-card p-6">
      <h2 className="text-xl font-bold">Grok playground</h2>
      <div className="mt-4 min-h-80 space-y-3 rounded-2xl bg-black/20 p-4">
        {messages.length === 0 ? <p className="text-slate-400">Ask Grok something. Token usage will be stored and billed when Stripe is configured.</p> : null}
        {messages.map((message, index) => (
          <div key={index} className={message.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-sky-400 text-slate-950' : 'bg-white/10'}`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.tokens ? <p className="mt-2 text-xs opacity-70">{message.tokens} tokens</p> : null}
            </div>
          </div>
        ))}
        {loading ? <p className="text-sm text-slate-400">Grok is thinking…</p> : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </div>
      <form onSubmit={sendMessage} className="mt-4 flex gap-3">
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Build me a launch plan…" className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3" />
        <button disabled={loading} className="rounded-xl bg-sky-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-60">Send</button>
      </form>
    </section>
  );
}
