import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getUsageSummary } from '@/lib/usage';
import type { PlanId } from '@/lib/plans';
import { formatDate, formatNumber, truncate } from '@/lib/utils';
import { UserActions } from '@/components/admin/user-actions';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { subscription: true },
  });
  if (!user) notFound();

  const [summary, assistants, apiKeys] = await Promise.all([
    getUsageSummary(id),
    prisma.assistant.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.apiKey.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const plan = (user.subscription?.plan ?? 'FREE') as PlanId;

  return (
    <div className="mx-auto max-w-[1060px] space-y-7">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to users
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="font-display text-[30px] font-bold tracking-[-0.03em]">
            {user.name ?? 'Unnamed user'}
            <span className="text-primary">.</span>
          </h2>
          <p className="mt-1.5 text-[14.5px] text-muted">
            {user.email} · Joined {formatDate(user.createdAt)}
          </p>
        </div>
        {user.suspended ? (
          <span className="font-mono text-[10px] tracking-[0.1em] text-destructive">
            ● SUSPENDED
          </span>
        ) : (
          <span className="font-mono text-[10px] tracking-[0.1em] text-success">
            ● ACTIVE
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'MESSAGES / MO', value: formatNumber(summary.thisMonth) },
          { label: 'ALL-TIME MESSAGES', value: formatNumber(summary.totalMessages) },
          { label: 'ASSISTANTS', value: String(summary.assistants) },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-border bg-surface p-[22px]"
          >
            <div className="font-mono text-[10.5px] tracking-[0.16em] text-muted">
              {c.label}
            </div>
            <div className="mt-2.5 font-display text-[28px] font-bold tracking-[-0.03em]">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <UserActions
        userId={id}
        currentPlan={plan}
        suspended={user.suspended}
        apiKeys={apiKeys.map((k) => ({
          id: k.id,
          name: k.name,
          masked: `${k.prefix}${'•'.repeat(8)}`,
          isActive: k.isActive,
          createdAt: k.createdAt.toISOString(),
        }))}
      />

      <div className="rounded-2xl border border-border bg-surface p-[26px]">
        <div className="mb-1.5 font-mono text-[10.5px] tracking-[0.16em] text-muted">
          ASSISTANTS
        </div>
        {assistants.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            No assistants yet.
          </div>
        ) : (
          <div>
            {assistants.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between border-t border-border py-4"
              >
                <div>
                  <div className="text-[14.5px] font-semibold">{a.name}</div>
                  <div className="text-[12.5px] text-muted">
                    {a.persona ? truncate(a.persona, 64) : 'No persona set'}
                  </div>
                </div>
                <span className="font-mono text-[11px] tracking-[0.08em] text-faint">
                  {formatDate(a.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
