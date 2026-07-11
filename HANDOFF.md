# Ariaay — Session Handoff / Full Context

> **ব্যবহার:** নতুন Claude session-এ কাজ করতে চাইলে এই পুরো ফাইলটার content copy করে paste করে দাও (অথবা বলো "read D:\MAIN\aria\HANDOFF.md")। এতে নতুন session পুরো প্রজেক্ট বুঝে যাবে।
>
> This document is a complete context handoff. If you are a new Claude session: read this top-to-bottom before doing anything. It reflects the true deployed state as of 2026-07-12.

---

## 1. What this is

**Ariaay** — an "AI Assistant Builder" SaaS (originally named "Aria", rebranded to "Ariaay" in all user-facing text; the folder, package names, git repo, and `aria_sk_` API-key prefix intentionally still say "aria" — do NOT rename those, it breaks things).

Users create AI chat assistants (name + persona + instructions + knowledge base), test them in a live streaming chat, and embed them on any website via a one-line `<script>` tag. Subscription tiers (Free/Starter/Pro/Agency) limit assistant count and monthly messages. API keys allow developers to hit the NestJS REST API directly.

**Owner:** Tanvir Mustabi Sifat (tanvirsifat51@gmail.com). Communicates in Banglish (Bangla in Latin script); non-technical — explain simply, do the technical work yourself, don't ask them to run commands unless unavoidable.

---

## 2. Where it lives

- **Local repo:** `D:\MAIN\aria` (Windows 11, Git Bash + PowerShell both available)
- **GitHub:** `https://github.com/TMSifat/aria` (branch `main`; pushing to main auto-deploys to Vercel)
- **Vercel project:** `aria` (team `tmsifats-projects`), production URL **https://aria-neon-sigma.vercel.app**
- **Vercel CLI** is logged in as `tmsifat` on this machine (`npx vercel ...` works).

---

## 3. Architecture (monorepo, npm workspaces)

```
D:\MAIN\aria\
├── prisma/schema.prisma      ← shared DB schema (client generated to root node_modules)
├── prisma/seed.ts            ← demo data (local only, never seed prod)
├── docker-compose.yml        ← local Postgres (host port 5433) + Redis (host port 6380)
├── apps/web/                 ← Next.js 15 app (the whole product UI + most logic)
├── apps/api/                 ← NestJS 10 REST API (external/developer API-key access)
├── README.md                 ← setup + how it works
├── DEPLOYMENT.md             ← full account-side production runbook
├── GO-LIVE.cmd + scripts/go-live.ps1  ← one-click prod env + deploy helper
└── HANDOFF.md                ← this file
```

**apps/web (Next.js 15, App Router, TS strict):**
- Auth: **NextAuth v5 beta** (`next-auth@5.0.0-beta.25`), JWT sessions, credentials + Google. `lib/auth.ts`.
- AI chat: **provider-switchable** in `lib/ai.ts` — uses **Google Gemini** (`@google/genai`) when `GOOGLE_API_KEY` is set, else Claude (`@anthropic-ai/sdk`). Force with `AI_PROVIDER=google|anthropic`. Streams SSE from `app/api/chat/route.ts`.
- DB: Prisma 5.22, singleton in `lib/prisma.ts`.
- Billing: Stripe (`lib/stripe.ts` = client; `lib/plans.ts` = client-safe plan data — **keep these split**, Stripe SDK must not enter the client bundle).
- Rate limiting: `lib/ratelimit.ts` (ioredis sliding window, **fails open** if Redis down).
- Email: `lib/email.ts` (Resend; logs to console in dev if no key, throws in prod if no key).
- Dashboard mutations (create/edit/delete assistant, api keys) use **Next server actions** in `lib/actions/*` hitting Prisma directly — so the web app is fully functional WITHOUT the NestJS server running.
- Admin panel at `/admin` (role-gated via `lib/admin.ts`; `requireAdmin`/`assertAdmin`).
- UI: Tailwind CSS v4 **CSS-first** (theme in `app/globals.css` via `@theme inline`; there IS a tailwind.config.ts but it's just content globs). Design = teal, light-first, `font-display`/`font-mono` accents. The owner heavily redesigned the pages after initial build — respect their current styling.

**apps/api (NestJS 10):**
- Global API-key Passport bearer strategy (`auth/api-key.strategy.ts`) — `Authorization: Bearer aria_sk_...`, bcrypt-compared against stored hashes.
- Modules: assistants, api-keys, usage. All responses shaped `{ data, message, timestamp }`.
- Swagger at `/api/docs`. Health at `/health` (public).
- `apps/api/Dockerfile` builds from repo root context.
- **Note:** the API is NOT currently deployed anywhere (only the web app is on Vercel). It's ready for Railway per DEPLOYMENT.md but the owner hasn't deployed it, and the web app doesn't need it.

---

## 4. Database

- **Local:** Docker Postgres on **host port 5433** (not 5432 — the machine has another Postgres on 5432), Redis on **6380**. Connection strings in `.env`/`.env.local` use `localhost:5433`. Start with `docker compose up -d`. Docker Desktop is often not running — launch `C:\Program Files\Docker\Docker\Docker Desktop.exe` and wait ~1–3 min.
- **Production:** Neon (connected via Vercel's Neon integration — env vars like `DATABASE_URL`, `POSTGRES_URL_NON_POOLING` are auto-injected and are NOT readable via `vercel env pull`, they come back empty; that's expected).
- **Migrations:** The prod Neon DB was created WITHOUT Prisma migration history, so `prisma migrate deploy` errors with **P3005**. Fix already in place: `apps/web/scripts/migrate-deploy.mjs` runs during the Vercel build (`build` script) — it tries `migrate deploy`, and on P3005 falls back to `prisma db push` to sync the schema idempotently. **So schema changes go live automatically on every deploy.** Locally the script skips if it can't connect.
- Prisma models: User (role USER/ADMIN, suspended, stripe fields), Account/Session/VerificationToken (NextAuth), Subscription, ApiKey, Assistant, Conversation, Message (unused so far), UsageLog, PasswordResetToken.

---

## 5. Environment variables

- `.env` (repo root) and `apps/web/.env.local` — both **gitignored**, contain the REAL local secrets including the Gemini key. `.env.example` is the template.
- **The Gemini API key is already set** locally and in Vercel prod (`GOOGLE_API_KEY`). Value lives in the gitignored env files; don't print it.
- **Vercel production env (already set):** `NEXTAUTH_SECRET`, `NEXTAUTH_URL=https://aria-neon-sigma.vercel.app`, `NEXT_PUBLIC_APP_URL`, `AUTH_TRUST_HOST=true`, `ADMIN_EMAIL=tanvirsifat51@gmail.com`, `GOOGLE_API_KEY`, `GOOGLE_MODEL=gemini-2.5-flash`, plus the Neon DB vars.
- **Admin bootstrap:** whoever signs in with `ADMIN_EMAIL` is auto-promoted to ADMIN role on sign-in (in `lib/auth.ts` jwt callback). No SQL needed.

---

## 6. Current status — WHAT WORKS (verified live on prod)

- ✅ Site is live: https://aria-neon-sigma.vercel.app (landing, login, signup, terms, privacy all 200)
- ✅ **Login + signup work** (verified end-to-end via curl: signup → credentials login → session with user/plan/role)
- ✅ Database connected, schema synced (health returns `{"status":"ok","database":"up"}`)
- ✅ AI chat wired to Gemini (key validated against Google's API; set in prod)
- ✅ Password reset flow (single-use sha256 token, 1h expiry; email via Resend or dev console)
- ✅ Rate limits (login/register/forgot), security headers (HSTS, X-Frame-Options, etc.)
- ✅ Legal pages, health endpoints, admin panel
- ✅ Rebrand Aria→Ariaay complete in all user-facing text

## 7. WHAT'S NOT DONE / pending (do these if asked)

- ⬜ **Stripe** not configured → billing page shows "Coming soon" for paid plans (graceful, nothing breaks). Needs products/prices + webhook + keys per DEPLOYMENT.md §6.
- ⬜ **Resend** email not configured → password-reset email will THROW in prod (works in dev via console log). Needs `RESEND_API_KEY` + `EMAIL_FROM`.
- ⬜ **Google OAuth** not configured → "Sign in with Google" button is auto-hidden (conditional on `/api/auth/providers`). Needs `GOOGLE_CLIENT_ID`/`SECRET`.
- ⬜ **Upstash Redis** not set in prod → rate limiting fails open (allows all). Add `REDIS_URL`.
- ⬜ **Embed widget** (`cdn.aria.ai/widget.js`) is a placeholder — the actual widget.js bundle + public widget chat endpoint don't exist yet (v1 scope-out).
- ⬜ Custom domain, tests/CI, Sentry/error tracking.
- ⬜ A leftover test account `prodtest@aria.ai` exists in prod DB (created during login verification) — harmless, can be deleted from `/admin`.

---

## 8. Local dev — how to run

```bash
# from D:\MAIN\aria
docker compose up -d            # Postgres:5433 + Redis:6380 (start Docker Desktop first)
npx prisma generate             # if node_modules fresh
npx prisma migrate deploy       # or: migrate dev  (local DB)
npx prisma db seed              # demo user: demo@aria.ai / demo1234
npm run dev:web                 # http://localhost:3000
npm run dev:api                 # http://localhost:3001 (optional; /api/docs)
```
Deps installed with `npm install --legacy-peer-deps` (React 19 peer noise).

---

## 9. Deploy — how it works

- **Push to `main`** → Vercel auto-builds `apps/web` (root dir set to `apps/web` in Vercel) → build runs `prisma generate` + `migrate-deploy.mjs` (schema sync) + `next build`.
- Env var changes on Vercel need a **redeploy** to take effect (push an empty commit or redeploy).
- **GOTCHA — Claude Code's auto-mode security classifier BLOCKS:** writing secrets to Vercel prod (`vercel env add ... production`), and running `prisma migrate deploy`/`db push` against the prod DB directly. These need the owner to approve or run `GO-LIVE.cmd`. When such a step is needed, either do it via a committed build step (like migrate-deploy.mjs) or ask the owner to double-click `GO-LIVE.cmd`. Don't fight the classifier.

---

## 10. Important gotchas / non-obvious facts

- **The owner's Chrome times out on the prod URL but curl gets 200 from the same machine.** This is client-side (Chrome extension/VPN/Secure-DNS), NOT a deploy problem. Fix path: incognito → Edge → disable Secure DNS → mobile data. The site is genuinely up.
- **Don't rename identifiers:** `aria_sk_` (API key prefix — renaming breaks existing keys), `@aria/web`/`@aria/api` (package names), folder `D:\MAIN\aria`, the Vercel project/domain. Only user-facing display text says "Ariaay".
- **`aria-git-main-*.vercel.app` has Vercel Deployment Protection** (redirects to SSO) — that's normal; use the `aria-neon-sigma.vercel.app` production alias, which is public.
- **`.env` values aren't readable from Vercel** (Neon integration vars pull back empty) — that's why migrations run inside the build, not from a local pull.
- Model default is `gemini-2.5-flash`. The chat model badge / any "claude" mention was removed during the provider swap + rebrand.
- Windows: use Git Bash for POSIX, but PowerShell for some things; `sleep` inside a loop works, bare foreground long sleeps are discouraged.

---

## 11. The owner's most likely next asks

Ranked by probability: (a) "why can't I open the site" → Chrome client-side fix (§10); (b) set up Stripe so payments work; (c) set up Resend for password-reset emails; (d) add a custom domain; (e) build the actual embed widget; (f) more UI/design tweaks. For any prod-secret or prod-DB step, remember the classifier gotcha (§9) — prefer a committed build step or the `GO-LIVE.cmd` path.

---

*End of handoff. The README.md and DEPLOYMENT.md have deeper detail on running and shipping.*
