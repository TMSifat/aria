# Aria — AI Assistant Builder SaaS

Create, configure, and deploy Claude-powered AI assistants. Give each assistant a
persona, instructions, and a knowledge base; test it in a live streaming chat;
then embed it anywhere with a one-line `<script>` tag. Subscription tiers gate the
number of assistants and monthly message volume, and API keys let developers call
the REST API directly.

Monorepo: **Next.js 15** web app (`apps/web`) + **NestJS** REST API (`apps/api`),
sharing one **Prisma** schema (`prisma/`). PostgreSQL + Redis via Docker.

| Plan    | Price   | Assistants | Messages/mo |
| ------- | ------- | ---------- | ----------- |
| Free    | $0      | 1          | 100         |
| Starter | $29/mo  | 3          | 2,000       |
| Pro     | $79/mo  | 10         | 10,000      |
| Agency  | $199/mo | Unlimited  | 50,000      |

## Stack

- **Web** — Next.js 15 (App Router, TS strict), Tailwind CSS v4 (CSS-first theme),
  Auth.js (NextAuth v5, credentials + Google), `@anthropic-ai/sdk` streaming,
  Stripe, recharts, react-hook-form + zod, lucide-react, sonner, next-themes.
- **API** — NestJS 10, Prisma, Passport (API-key bearer strategy, global guard),
  Swagger docs, bcrypt, nanoid, class-validator, ioredis.
- **Shared** — PostgreSQL 16, Redis 7, Prisma schema at `prisma/schema.prisma`.

## Prerequisites

- Node.js 20+ and npm 10+
- Docker (for local Postgres + Redis)
- An Anthropic API key (for live chat)
- A Stripe test account (for billing — optional for local dev)

## Setup

```bash
# 1. Install (workspaces). --legacy-peer-deps avoids React 19 peer noise.
npm install --legacy-peer-deps

# 2. Environment. Copy the example and fill in real secrets.
cp .env.example .env
#   Also copy for the web app:
cp .env apps/web/.env.local
#   At minimum set ANTHROPIC_API_KEY and NEXTAUTH_SECRET (openssl rand -base64 32).

# 3. Start Postgres + Redis.
docker compose up -d

# 4. Generate the Prisma client and run the migration.
npx prisma generate
npx prisma migrate dev --name init

# 5. Seed a demo user + assistants + 30 days of usage.
npx prisma db seed
#   Login: demo@aria.ai / demo1234   ·   Demo API key: aria_sk_demo_key_for_testing_only
```

## Run

```bash
# NestJS API  → http://localhost:3001  (Swagger at /api/docs)
npm run dev:api

# Next.js web → http://localhost:3000
npm run dev:web
```

Both apps read env from the repo root `.env` (the web app also reads
`apps/web/.env.local`).

## Architecture notes

- **Prisma is shared.** The schema lives at `prisma/schema.prisma`; the client is
  generated once at the repo root and resolved by both apps through npm-workspace
  hoisting. `directUrl` is set for Neon migrations — locally it points at the same
  database as `DATABASE_URL`.
- **Auth.** NextAuth v5 with a JWT session. The user's `plan` is embedded in the
  token; plan-limit checks in server actions and the chat route read the
  subscription from the database directly so they stay accurate after upgrades.
- **Assistants + API keys in the web app** are created/updated/deleted through
  Next.js **server actions** (`lib/actions/*`) that talk to Prisma directly, so the
  dashboard is fully functional without the NestJS server running. The NestJS API
  exposes the same resources for external/programmatic use, authenticated with an
  API key (`Authorization: Bearer aria_sk_...`).
- **Chat streaming.** `POST /api/chat` verifies the session, enforces the monthly
  message limit and a 20 req/min per-user rate limit (Redis sliding window, fails
  open if Redis is down), streams Claude's response as SSE, and logs token usage.
  The model is configurable via `ANTHROPIC_MODEL` (default `claude-sonnet-4-6`).
- **Stripe.** Checkout + billing portal + webhook (`checkout.session.completed`,
  `customer.subscription.updated` / `.deleted`, `invoice.payment_failed`). The
  webhook reads the raw body via `req.text()` for signature verification.
- **Design system.** Light-first teal palette. Tokens are defined as CSS custom
  properties in `apps/web/app/globals.css` and exposed to Tailwind via
  `@theme inline` (utilities like `bg-surface`, `text-muted`, `border-border-teal`).
  Dark mode via a `.dark` class (next-themes).

## NestJS REST API

All routes are guarded by the API-key Passport strategy (global `ApiKeyGuard`) and
return `{ data, message, timestamp }`.

- `GET/POST /assistants`, `GET/PATCH/DELETE /assistants/:id`
- `GET/POST /api-keys`, `DELETE /api-keys/:id`
- `GET /usage/summary`, `GET /usage/chart`
- `POST /usage/log` — internal only, guarded by the `x-internal-secret` header

Example:

```bash
curl http://localhost:3001/assistants \
  -H "Authorization: Bearer aria_sk_demo_key_for_testing_only"
```

## Local Stripe webhooks

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Put the printed whsec_... into STRIPE_WEBHOOK_SECRET, then create the
# STRIPE_*_PRICE_ID products/prices in your Stripe dashboard.
```

## Deployment

- **Web → Vercel.** Set all env vars. Use the Neon pooled URL for `DATABASE_URL`
  and the direct URL for `DIRECT_DATABASE_URL` (migrations).
- **API → Railway.** Build the container from the repo root so the shared Prisma
  schema is in context: `docker build -f apps/api/Dockerfile -t aria-api .`
- **Redis → Upstash.** Set `REDIS_URL` to the `rediss://` connection string.

## Project layout

```
aria/
├── docker-compose.yml        Postgres + Redis
├── prisma/                    schema.prisma + seed.ts (shared)
└── apps/
    ├── api/                   NestJS REST API
    └── web/                   Next.js 15 app (landing, auth, dashboard)
```

## Notes

- The embed widget CDN (`widget.js`) is out of scope for v1 — the UI shows the
  embed snippet format only.
- API keys, passwords, and Stripe secrets are never logged. API keys are stored
  as bcrypt hashes and shown in full exactly once at creation.
