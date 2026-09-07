type GrokMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type GrokUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export async function completeWithGrok(messages: GrokMessage[]) {
  if (!process.env.GROK_API_KEY) {
    throw new Error('Missing GROK_API_KEY.');
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.GROK_MODEL || 'grok-3-mini',
      messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Grok API failed: ${response.status} ${detail}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: GrokUsage;
  };

  return {
    content: data.choices?.[0]?.message?.content || 'No response returned from Grok.',
    tokens: data.usage?.total_tokens || 0,
    usage: data.usage || {}
  };
}
