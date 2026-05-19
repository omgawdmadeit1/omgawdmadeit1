# Prosperity CFO

A clean, premium SaaS MVP for an AI-powered proactive CFO tailored to solopreneurs and small businesses.

## Stack
- Next.js 15 + TypeScript
- Tailwind CSS
- Supabase client scaffolding (Auth + DB)
- OpenAI client scaffolding (AI features)

## Features in this MVP
- Auth + onboarding flow
- Financial dashboard with overview cards and connected account mockups
- Transaction explorer with search and categories
- AI CFO chat (persistent in session state, API-backed mock responses)
- Weekly and monthly report screens
- Smart budget vs actual variance tracker

## Run locally
```bash
npm install
npm run dev
```

## Environment variables
Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```
