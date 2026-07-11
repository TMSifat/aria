// Syncs the database schema during the Vercel build, where the Neon
// integration's env vars exist.
//
// Strategy:
//   1. `prisma migrate deploy` — the clean path for a database that was set up
//      with Prisma migrations (fresh Neon DBs).
//   2. If that fails because the schema already exists without migration history
//      (P3005) — which is the case for DBs created by `db push` or the Vercel
//      Neon integration — fall back to `prisma db push`, which makes the DB
//      match schema.prisma idempotently (creates missing tables/columns).
// Skips quietly when no database is configured (e.g. local builds without env).
import { execSync } from 'node:child_process';

const direct =
  process.env.DIRECT_DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (!direct) {
  console.log('[db-sync] No DATABASE_URL configured — skipping.');
  process.exit(0);
}

const SCHEMA = '../../prisma/schema.prisma';
const env = { ...process.env, DATABASE_URL: direct, DIRECT_DATABASE_URL: direct };

function run(cmd) {
  return execSync(cmd, { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

try {
  console.log('[db-sync] Trying: prisma migrate deploy…');
  const out = run(`npx prisma migrate deploy --schema=${SCHEMA}`);
  process.stdout.write(out);
  console.log('[db-sync] Migrations applied.');
} catch (err) {
  const log = `${err.stdout ?? ''}${err.stderr ?? ''}`;
  process.stdout.write(log);

  // P3005 = schema not empty / no migration history → sync with db push.
  if (log.includes('P3005') || log.includes('not empty')) {
    console.log(
      '[db-sync] Existing schema without migration history — falling back to db push…',
    );
    try {
      const out = run(
        `npx prisma db push --schema=${SCHEMA} --skip-generate`,
      );
      process.stdout.write(out);
      console.log('[db-sync] Schema synced via db push.');
    } catch (pushErr) {
      process.stdout.write(`${pushErr.stdout ?? ''}${pushErr.stderr ?? ''}`);
      console.error('[db-sync] db push failed — aborting build.');
      process.exit(1);
    }
  } else {
    console.error('[db-sync] Migration failed — aborting build.');
    process.exit(1);
  }
}
