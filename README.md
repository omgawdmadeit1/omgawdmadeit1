# Grok SaaS Stripe Starter

Production-oriented AI SaaS MVP with Next.js App Router, Supabase Auth, Stripe subscriptions/metered billing, Grok chat completions, and usage dashboard charts.

## What is included

- Next.js + TypeScript + Tailwind app shell.
- Supabase magic-link auth and protected dashboard.
- Grok chat API integration through xAI's OpenAI-compatible chat completions endpoint.
- Stripe Checkout, Customer Portal, webhooks, and metered token events.
- Supabase usage logging plus dashboard charts.
- Vercel deployment config and environment template.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Enable email magic links in Supabase Auth.

## Stripe setup

1. Create a Stripe product with a subscription price and copy it into `STRIPE_PRO_PRICE_ID`.
2. Create a billing meter named by `STRIPE_METER_EVENT_NAME` (default: `ai_tokens_used`) that aggregates the `value` payload field.
3. Run the Stripe CLI locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Grok setup

Create an xAI API key and set:

```env
GROK_API_KEY=xai-...
GROK_MODEL=grok-3-mini
```

The chat route stores usage in Supabase and mirrors token totals into Stripe Meter Events when the user has a Stripe customer.

## Vercel deployment

1. Import the repo in Vercel.
2. Add all variables from `.env.example` to the Vercel project.
3. Set `NEXT_PUBLIC_APP_URL` to your production domain.
4. Add a Stripe webhook endpoint pointing at `https://your-domain.com/api/stripe/webhook`.
5. Deploy with the included `vercel.json`.
