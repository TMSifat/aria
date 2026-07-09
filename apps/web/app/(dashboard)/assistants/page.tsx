import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, TriangleAlert } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS, displayLimit, type PlanId } from '@/lib/plans';
import { AssistantCard } from '@/components/assistants/assistant-card';
import { Button } from '@/components/ui/button';

export default async function AssistantsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = session.user.id;

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  const plan = (subscription?.plan ?? 'FREE') as PlanId;
  const limit = PLAN_LIMITS[plan].assistants;

  const assistants = await prisma.assistant.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const counts = await prisma.usageLog.groupBy({
    by: ['assistantId'],
    where: { userId, assistantId: { in: assistants.map((a) => a.id) } },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.assistantId, c._count._all]));

  const atLimit = assistants.length >= limit;

  return (
    <div className="mx-auto max-w-[1060px] space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h2 className="font-display text-[30px] font-bold tracking-[-0.03em]">
            Assistants<span className="text-primary">.</span>
          </h2>
          <p className="mt-1.5 text-[14.5px] text-muted">
            {assistants.length} of {displayLimit(limit)} slots used.
          </p>
        </div>
        {atLimit ? (
          <Link href="/billing">
            <Button>Upgrade to add more</Button>
          </Link>
        ) : (
          <Link href="/assistants/new">
            <Button>
              <Plus className="h-4 w-4" />
              New assistant
            </Button>
          </Link>
        )}
      </div>

      {atLimit && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary-dim p-4">
          <TriangleAlert className="h-5 w-5 shrink-0 text-primary-text" />
          <div className="flex-1 text-sm text-text-base">
            You&apos;ve reached your assistant limit. Upgrade to create more.
          </div>
          <Link href="/billing">
            <Button size="sm">Upgrade</Button>
          </Link>
        </div>
      )}

      {assistants.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface py-16 text-center">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <rect
              x="16"
              y="24"
              width="40"
              height="32"
              rx="8"
              fill="#F4F5EF"
              stroke="#C8501F"
              strokeWidth="2.5"
            />
            <circle cx="28" cy="40" r="4" fill="#C8501F" />
            <circle cx="44" cy="40" r="4" fill="#C8501F" />
            <path
              d="M28 50h16"
              stroke="#C8501F"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M36 24v-8M36 16a3 3 0 100-6 3 3 0 000 6z"
              stroke="#C8501F"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <div>
            <div className="font-display font-bold tracking-tight text-text-base">
              Create your first assistant
            </div>
            <p className="mt-1 text-sm text-muted">
              Give it a persona, instructions, and knowledge — then chat live.
            </p>
          </div>
          <Link href="/assistants/new">
            <Button>
              <Plus className="h-4 w-4" />
              New assistant
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assistants.map((a) => (
            <AssistantCard
              key={a.id}
              id={a.id}
              name={a.name}
              persona={a.persona}
              messageCount={countMap.get(a.id) ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
