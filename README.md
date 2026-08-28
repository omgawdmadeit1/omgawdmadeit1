# omgawdmadeit1 Suite

This profile repo now combines three distinct surfaces that previously lived on conflicting pull requests:

1. **Prosperity CFO** — Next.js finance OS (dashboard, transactions, budgets, reports, AI CFO chat).
2. **Grok SaaS starter** (from #9) — Supabase magic-link auth, Stripe metered billing, and Grok chat.
3. **Agent Skill Exchange** (from #11/#12) — Prisma marketplace backend with MCP HTTP routes, authz, moderation, and a queued execution path.

Duplicate SMI-65 creative-brief PRs were left untouched; `SMI-65-creative-concepts.md` is already on `main`.

## Web app (Next.js)

```bash
npm install
cp .env.example .env.local
npm run dev
```

- Finance demo: `/`, `/dashboard`, `/transactions`, `/budgets`, `/reports`, `/chat`
- Grok + billing: `/login`, `/pricing`, `/grok`
- Auth callback: `/auth/callback`

### Supabase + Stripe + Grok

1. Create a Supabase project and run `supabase/schema.sql`.
2. Fill `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, Stripe keys, and `GROK_API_KEY`.
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

The Grok playground stays on `/grok` so it does not replace the Prosperity CFO dashboard.

## Agent Skill Exchange backend

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev:server
```

- Health: `GET /health`
- List tools: `GET /mcp/tools`
- Invoke tool: `POST /mcp/invoke/:toolName`
- Metrics: `GET /metrics`

Env vars used by the backend: `DATABASE_URL`, `APP_BASE_URL`, `DEFAULT_USER_ID`, `DEFAULT_TENANT_ID`, `DEFAULT_USER_ROLE`, `AUTO_APPROVE_SKILLS`, `PORT`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js web app |
| `npm run dev:server` | Agent Skill Exchange HTTP/MCP server |
| `npm run build` | Next.js production build |
| `npm run build:server` | TypeScript compile of `src/` |
| `npm test` | Vitest (Zod validation) |
| `npm run prisma:generate` | Generate Prisma client |

## CI

`.github/workflows/ci.yml` runs `npm ci`, Prisma generate, `build:server`, and `npm test`.
