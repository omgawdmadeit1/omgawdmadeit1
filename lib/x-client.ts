import { env } from "@/lib/env";

export type XTokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope: string;
  refresh_token?: string;
};

export async function exchangeCodeForToken(code: string, codeVerifier: string) {
  const auth = Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.X_REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const res = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);
  return (await res.json()) as XTokenResponse;
}

export async function createTweet(accessToken: string, text: string, replyToId?: string) {
  const payload = replyToId ? { text, reply: { in_reply_to_tweet_id: replyToId } } : { text };
  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const resetAt = res.headers.get("x-rate-limit-reset");
  if (res.status === 429) {
    const when = resetAt ? Number(resetAt) * 1000 : Date.now() + 15 * 60 * 1000;
    return { rateLimitedUntil: new Date(when), ok: false as const, data: null };
  }
  const json = await res.json();
  if (!res.ok) throw new Error(`Tweet create failed (${res.status}): ${JSON.stringify(json)}`);
  return { ok: true as const, data: json, rateLimitedUntil: null };
}
