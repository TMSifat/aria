import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUsageChart, getUsageSummary } from '@/lib/usage';
import { PLAN_LIMITS, type PlanId } from '@/lib/plans';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { UsageChart } from '@/components/dashboard/usage-chart';
import { Button } from '@/components/ui/button';
import { truncate } from '@/lib/utils';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = session.user.id;

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  const plan = (subscription?.plan ?? 'FREE') as PlanId;
  const limits = PLAN_LIMITS[plan];

  const [summary, chart, recent] = await Promise.all([
    getUsageSummary(userId),
    getUsageChart(userId),
    prisma.assistant.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ]);

  const counts = await prisma.usageLog.groupBy({
    by: ['assistantId'],
    where: { userId, assistantId: { in: recent.map((r) => r.id) } },
    _count: { _all: true },
  });
  const countMap = new Map(
    counts.map((c) => [c.assistantId, c._count._all]),
  );

  const firstName = session.user.name?.split(' ')[0];

  return (
    <div className="mx-auto max-w-[1060px] space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h2 className="font-display text-[30px] font-bold tracking-[-0.03em]">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
            <span className="text-primary">.</span>
          </h2>
          <p className="mt-1.5 text-[14.5px] text-muted">
            Your assistants handled{' '}
            <strong className="text-text-base">
              {summary.thisMonth.toLocaleString('en-US')} messages
            </strong>{' '}
            this month.
          </p>
        </div>
        <Link href="/assistants/new">
          <Button>+ New assistant</Button>
        </Link>
      </div>

      <StatsCards
        thisMonth={summary.thisMonth}
        messageLimit={limits.messages}
        totalMessages={summary.totalMessages}
        assistants={summary.assistants}
        assistantLimit={limits.assistants}
        apiCalls={summary.apiCalls}
      />

      <div className="rounded-2xl border border-border bg-surface p-[26px]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="font-mono text-[10.5px] tracking-[0.16em] text-muted">
              MESSAGE ACTIVITY
            </div>
            <div className="mt-1.5 font-display text-[19px] font-bold tracking-[-0.02em]">
              Last 30 days
            </div>
          </div>
          <span className="font-mono text-[10.5px] tracking-[0.12em] text-primary">
            ● MESSAGES
          </span>
        </div>
        <UsageChart data={chart} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-[26px]">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="font-mono text-[10.5px] tracking-[0.16em] text-muted">
            RECENT ASSISTANTS
          </div>
          <Link href="/assistants" className="text-[13px] font-semibold text-primary">
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted">No assistants yet.</p>
            <Link href="/assistants/new">
              <Button size="sm">Create your first assistant</Button>
            </Link>
          </div>
        ) : (
          <div>
            {recent.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between border-t border-border py-4"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-text-base font-display text-[15px] font-bold text-surface">
                    {a.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <div className="text-[14.5px] font-semibold">{a.name}</div>
                    <div className="text-[12.5px] text-muted">
                      {a.persona ? truncate(a.persona, 48) : 'No persona set'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-[18px]">
                  <span className="font-mono text-[11px] tracking-[0.08em] text-muted">
                    {countMap.get(a.id) ?? 0} MSGS
                  </span>
                  <Link href={`/assistants/${a.id}`}>
                    <Button variant="outline" size="sm">
                      Open
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
