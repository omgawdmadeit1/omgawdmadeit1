# Safe X Auto Poster (Next.js + TypeScript)

A safe-by-default X auto-poster app for drafting, scheduling, and publishing posts through the **official X API v2** with OAuth 2.0 + PKCE.

## Features
- Connect X account via OAuth 2.0 + PKCE.
- Create drafts and scheduled posts.
- Manual **Post Now** action.
- Minute-based cron scheduler endpoint.
- Retry logic for failed posts.
- Rate-limit handling (`429` + reset time).
- Publish attempt logs.
- Safety controls:
  - safety delay between posts,
  - daily posting limit,
  - approval requirement toggle.
- SQLite via Prisma.

## Tech Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- X API v2

## Environment Variables
Copy `.env.example` to `.env` and set values:
- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `X_REDIRECT_URI`
- `DATABASE_URL`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL` (optional)

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
3. Push schema:
   ```bash
   npx prisma db push
   ```
4. Seed default user:
   ```bash
   npm run db:seed
   ```
5. Start app:
   ```bash
   npm run dev
   ```

## Scheduler
Call cron endpoint every minute:
- `POST /api/cron/publish`
- header `x-cron-secret: <CRON_SECRET>`

### Example cron call
```bash
curl -X POST http://localhost:3000/api/cron/publish -H "x-cron-secret: your-secret"
```

## API Routes
- `GET /api/auth/x/login` → start OAuth flow.
- `GET /api/auth/x/callback` → OAuth callback + token save.
- `GET /api/posts` → list posts + logs.
- `POST /api/posts` → create draft/scheduled post.
- `POST /api/posts/:id/publish` → manual publish now.
- `POST /api/cron/publish` → publish due scheduled posts.

## Deployment (Vercel)
1. Push repo to Git provider.
2. Import project into Vercel.
3. Add environment variables in Vercel Project Settings.
4. Add a Vercel Cron Job to call `/api/cron/publish` every minute.
5. Run `prisma db push` against your production DB (SQLite persistent disk or move to Supabase/Postgres by editing Prisma datasource).

## Compliance Notes
- Uses only official X API endpoints.
- No spam reply automation, scraping, mass DMs, or unsolicited engagement features.
- Includes duplicate-prevention expectation (implement stricter text hashing if needed for production).
- Enforces safety delay and daily limits in publishing logic.
- Supports approval gate before publishing.
