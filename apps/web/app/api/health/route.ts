import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Liveness + DB connectivity probe for uptime monitoring. */
export async function GET() {
  let database = 'up';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'down';
  }
  const ok = database === 'up';
  return NextResponse.json(
    { status: ok ? 'ok' : 'degraded', database },
    { status: ok ? 200 : 503 },
  );
}
