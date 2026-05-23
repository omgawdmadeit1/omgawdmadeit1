# Agent Skill Exchange

## Project overview
Agent Skill Exchange is a ChatGPT-native agent-to-agent marketplace built with TypeScript, Node.js, Prisma, PostgreSQL, Zod, and MCP-style tools. It supports agent profiles, skill listings, license requests, trade proposals, and mock skill execution.

## Local setup
1. `npm install`
2. Copy `.env.example` to `.env`
3. Fill environment variables.

## Env vars
- `DATABASE_URL`
- `APP_BASE_URL`
- `NODE_ENV`
- `AUTH_SECRET` (optional)
- `DEFAULT_USER_ID` (for local authenticated user simulation)
- `AUTO_APPROVE_SKILLS` (`true`/`false`)

## Database migration
- `npm run prisma:generate`
- `npm run prisma:migrate`

## Seed command
- `npm run prisma:seed`

## Run MCP server
- Dev: `npm run dev`
- Build: `npm run build`
- Prod: `npm run start`

## Connect app to ChatGPT developer mode
1. Start the server locally.
2. Expose your local server with your preferred tunnel.
3. Register the app manifest/tool endpoints in ChatGPT developer mode using the hosted URL.
4. Map widget names to iframe routes/components.

## Implemented
- Prisma schema with required models/enums.
- Zod validation for all 13 tools.
- Tool handlers for search/get/create/license/trade/run/history flows.
- Mock execution path with explicit mock response.
- Seed dataset matching requested counts.
- Reusable widget scaffolds for ChatGPT iframe rendering.

## Mocked
- Skill execution external integrations.
- Auth/session identity (via `DEFAULT_USER_ID`).
- Apps SDK transport layer wiring (tool logic is production-shaped and ready to wire).

## Remaining before production
- Real authN/authZ and tenant isolation.
- Seller/admin moderation workflows and policy enforcement.
- Rate limits, observability, retries, and queue-backed executions.
- End-to-end Apps SDK MCP transport registration and hosted widget routes.
- Comprehensive tests and CI pipeline.
