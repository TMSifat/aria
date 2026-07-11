// Runs `prisma migrate deploy` during the Vercel build, where the Neon
// integration's env vars exist. Prefers a direct (non-pooled) connection —
// pgbouncer pools can break Prisma's migration advisory locks.
// Skips quietly when no database is configured (e.g. local builds).
import { execSync } from 'node:child_process';

const direct =
  process.env.DIRECT_DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!direct) {
  console.log('[migrate-deploy] No DATABASE_URL configured — skipping.');
  process.exit(0);
}

console.log('[migrate-deploy] Applying pending migrations…');
try {
  execSync('npx prisma migrate deploy --schema=../../prisma/schema.prisma', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: direct,
      DIRECT_DATABASE_URL: direct,
    },
  });
  console.log('[migrate-deploy] Done.');
} catch {
  console.error('[migrate-deploy] Migration failed — aborting build.');
  process.exit(1);
}
