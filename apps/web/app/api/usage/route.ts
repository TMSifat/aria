import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUsageSummary, getUsageChart } from '@/lib/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const [summary, chart, assistantCount] = await Promise.all([
    getUsageSummary(userId),
    getUsageChart(userId),
    prisma.assistant.count({ where: { userId } }),
  ]);

  return NextResponse.json({ summary, chart, assistantCount });
}
