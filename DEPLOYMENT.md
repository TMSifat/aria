# Aria — Production Deployment Runbook

Everything code-side is done. This checklist covers the **account-side** steps
only you can do. Work top to bottom; each step lists the env vars it produces.
Set every var in **both** Vercel (web) and Railway (API) unless noted.

---

## 1. Database — Neon (~5 min)

1. Create a project at https://neon.tech (region close to your users).
2. Copy the two connection strings:
   - **Pooled** (`...-pooler.neon.tech`) → `DATABASE_URL`
   - **Direct** → `DIRECT_DATABASE_URL`
3. Run the migrations against Neon from your machine:

   ```bash
   DATABASE_URL="<direct-url>" DIRECT_DATABASE_URL="<direct-url>" npx prisma migrate deploy
   ```

   ⚠️ Use `migrate deploy` (not `migrate dev`) and **do not run the seed** in
   production.
4. Create your own account through the app's signup once live, then promote it
   to admin:

   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
   ```

Produces: `DATABASE_URL`, `DIRECT_DATABASE_URL`

## 2. Redis — Upstash (~3 min)

1. Create a Redis database at https://upstash.com (same region as hosting).
2. Copy the `rediss://` connection string.

Produces: `REDIS_URL`

## 3. AI provider — Google AI Studio (~2 min)

1. Get a key at https://aistudio.google.com/apikey.
2. For real traffic, enable billing on the Google Cloud project behind the key
   (free-tier daily quotas will 429 under load). `gemini-2.5-flash` is the
   default model; override with `GOOGLE_MODEL`.

Produces: `GOOGLE_API_KEY` (web only). Optional: `ANTHROPIC_API_KEY` +
`AI_PROVIDER=anthropic` to use Claude instead.

## 4. Email — Resend (~5 min)

Required for password reset emails (production **throws** without it).

1. Create an account at https://resend.com, add + verify your sending domain.
2. Create an API key.

Produces: `RESEND_API_KEY`, `EMAIL_FROM="Aria <no-reply@yourdomain.com>"`
(web only)

## 5. Google OAuth (~5 min)

1. https://console.cloud.google.com → APIs & Services → Credentials →
   OAuth client ID (Web application).
2. Authorized redirect URI: `https://yourdomain.com/api/auth/callback/google`
3. Publish the OAuth consent screen (links to your live `/terms` and
   `/privacy` pages — already built).

Produces: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (web only)

## 6. Stripe (~15 min)

1. In the Stripe dashboard (start in **test mode**): Products → create
   **Starter $29/mo**, **Pro $79/mo**, **Agency $199/mo** (recurring monthly).
2. Copy each price ID → `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`,
   `STRIPE_AGENCY_PRICE_ID`.
3. Developers → API keys → `STRIPE_SECRET_KEY` and
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
4. Developers → Webhooks → Add endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
5. Settings → Billing → Customer portal → enable it (the "Manage
   subscription" button uses it).
6. Test with card `4242 4242 4242 4242`: upgrade → plan changes on the
   billing page → cancel in the portal → plan drops to FREE.
7. When happy, flip to live mode and repeat steps 2–5 with live keys.

Produces: 6 Stripe vars (web only)

## 7. Deploy the web app — Vercel (~10 min)

1. Import the GitHub repo. Root directory: `apps/web`
   (the repo's Vercel build already runs `prisma generate`).
2. Set env vars:
   - `DATABASE_URL` (pooled), `DIRECT_DATABASE_URL` (direct)
   - `REDIS_URL`
   - `NEXTAUTH_SECRET` — generate fresh: `openssl rand -base64 32`
   - `NEXTAUTH_URL=https://yourdomain.com`
   - `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
   - `GOOGLE_API_KEY`, `GOOGLE_MODEL`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `RESEND_API_KEY`, `EMAIL_FROM`
   - All 6 Stripe vars
   - `NEST_API_URL` (Railway URL, after step 8), `NEST_API_INTERNAL_SECRET`
     (generate: `openssl rand -hex 32`)
3. Add your custom domain in Vercel → update `NEXTAUTH_URL` /
   `NEXT_PUBLIC_APP_URL` if they differ.

## 8. Deploy the REST API — Railway (~10 min)

1. New project → Deploy from GitHub repo.
2. Build with the Dockerfile: set **Dockerfile path** to `apps/api/Dockerfile`
   (build context = repo root).
3. Env vars: `DATABASE_URL` (pooled), `WEB_URL=https://yourdomain.com`,
   `NEST_API_INTERNAL_SECRET` (same value as Vercel), `API_PORT` if Railway
   assigns one (defaults to 3001).
4. Health check path: `/health`.
5. Optional: map an API subdomain, e.g. `api.yourdomain.com`.

## 9. Post-launch checks (~10 min)

- [ ] `https://yourdomain.com/api/health` → `{"status":"ok"}`
- [ ] `https://api.yourdomain.com/health` → status ok
- [ ] Signup with email+password works; welcome state renders
- [ ] Google sign-in works
- [ ] Forgot password → email arrives → reset works
- [ ] Create assistant → chat streams a reply
- [ ] Stripe test upgrade + cancel round-trip (if still in test mode)
- [ ] Admin: your account promoted, `/admin` loads, non-admins bounced
- [ ] Uptime monitor pointed at both `/api/health` endpoints
      (uptimerobot.com free tier is fine)

## 10. Recommended next (not blocking)

- **Error tracking:** `npx @sentry/wizard@latest -i nextjs` in `apps/web`
  (and the Nest SDK in `apps/api`).
- **Spend alert** on the Google Cloud project for Gemini usage.
- **Widget CDN:** the embed snippet references `cdn.aria.ai/widget.js` —
  point that at wherever you host the built widget script when you ship the
  public embed.
- **CI:** a GitHub Action running `tsc --noEmit` + `next build` on PRs.

---

## Env var → where it goes (summary)

| Var | Vercel (web) | Railway (API) |
|---|---|---|
| DATABASE_URL / DIRECT_DATABASE_URL | ✅ | ✅ (pooled only) |
| REDIS_URL | ✅ | — |
| NEXTAUTH_SECRET / NEXTAUTH_URL / NEXT_PUBLIC_APP_URL | ✅ | — |
| GOOGLE_API_KEY / GOOGLE_MODEL (or ANTHROPIC_*) | ✅ | — |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | ✅ | — |
| RESEND_API_KEY / EMAIL_FROM | ✅ | — |
| STRIPE_* (6 vars) | ✅ | — |
| NEST_API_URL / NEST_API_INTERNAL_SECRET | ✅ | secret only |
| WEB_URL | — | ✅ |
