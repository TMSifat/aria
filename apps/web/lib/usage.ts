import { prisma } from './prisma';

export interface UsageSummary {
  totalMessages: number;
  thisMonth: number;
  assistants: number;
  apiCalls: number;
  totalTokens: number;
}

export interface ChartPoint {
  date: string; // "M/D" label
  count: number;
}

/** Pass a `userId` for a single account's usage, or omit it for platform-wide totals. */
export async function getUsageSummary(
  userId?: string,
): Promise<UsageSummary> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const scope = userId ? { userId } : {};

  const [totalMessages, thisMonth, assistants, apiCalls, tokenAgg] =
    await Promise.all([
      prisma.usageLog.count({ where: scope }),
      prisma.usageLog.count({
        where: { ...scope, createdAt: { gte: startOfMonth } },
      }),
      prisma.assistant.count({ where: scope }),
      prisma.usageLog.count({ where: { ...scope, source: 'API' } }),
      prisma.usageLog.aggregate({
        where: scope,
        _sum: { totalTokens: true },
      }),
    ]);

  return {
    totalMessages,
    thisMonth,
    assistants,
    apiCalls,
    totalTokens: tokenAgg._sum.totalTokens ?? 0,
  };
}

function dayLabel(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Daily message counts for the trailing 30 days (always 30 points).
 * Pass a `userId` for a single account, or omit it for platform-wide totals.
 */
export async function getUsageChart(userId?: string): Promise<ChartPoint[]> {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const logs = await prisma.usageLog.findMany({
    where: { ...(userId ? { userId } : {}), createdAt: { gte: start } },
    select: { createdAt: true },
  });

  const order: string[] = [];
  const labels = new Map<string, string>();
  const counts = new Map<string, number>();

  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayKey(d);
    order.push(key);
    labels.set(key, dayLabel(d));
    counts.set(key, 0);
  }

  for (const log of logs) {
    const key = dayKey(new Date(log.createdAt));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return order.map((key) => ({
    date: labels.get(key)!,
    count: counts.get(key) ?? 0,
  }));
}
