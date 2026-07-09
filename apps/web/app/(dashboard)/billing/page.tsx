import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS, PLAN_MAP, displayLimit, type PlanId } from '@/lib/plans';
import { getUsageSummary } from '@/lib/usage';
import {
  ManageSubscriptionButton,
  PlanCards,
} from '@/components/billing/plan-cards';
import { formatDate, formatNumber } from '@/lib/utils';

const STATUS_META: Record<string, string> = {
  ACTIVE: '● ACTIVE',
  TRIALING: '● TRIALING',
  PAST_DUE: '● PAST DUE',
  CANCELED: '● CANCELED',
  INCOMPLETE: '● INCOMPLETE',
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = session.user.id;

  const [subscription, summary] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    getUsageSummary(userId),
  ]);

  const plan = (subscription?.plan ?? 'FREE') as PlanId;
  const status = subscription?.status ?? 'ACTIVE';
  const planCfg = PLAN_MAP[plan];
  const limit = PLAN_LIMITS[plan].messages;
  const pct =
    limit === Infinity
      ? 0
      : Math.min(100, Math.round((summary.thisMonth / limit) * 100));

  const statusLabel = STATUS_META[status] ?? STATUS_META.INCOMPLETE;
  const canManage = plan !== 'FREE' && status !== 'CANCELED';

  return (
    <div className="mx-auto max-w-[1060px] space-y-7">
      <div>
        <h2 className="font-display text-[30px] font-bold tracking-[-0.03em]">
          Billing<span className="text-primary">.</span>
        </h2>
        <p className="mt-1.5 text-[14.5px] text-muted">
          Manage your plan and see your usage.
        </p>
      </div>

      {/* Current plan */}
      <div className="rounded-2xl border border-border bg-text-base p-7 text-bg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10.5px] tracking-[0.16em] text-faint">
              CURRENT PLAN
            </div>
            <div className="mt-2 flex items-baseline gap-3.5">
              <span className="font-display text-[26px] font-bold tracking-[-0.02em]">
                {planCfg.label}
              </span>
              <span className="font-mono text-[10px] tracking-[0.12em] text-success-dark">
                {statusLabel}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] text-on-dark-muted">
              {plan === 'FREE'
                ? 'You are on the free plan.'
                : `$${planCfg.price}/mo`}
              {subscription?.periodEnd && status !== 'CANCELED'
                ? ` · Renews ${formatDate(subscription.periodEnd)}`
                : ''}
            </p>
          </div>
          {canManage && <ManageSubscriptionButton />}
        </div>

        <div className="mt-[26px]">
          <div className="mb-2 flex items-center justify-between text-[13px] text-on-dark-muted">
            <span>Messages this month</span>
            <span className="font-semibold text-bg">
              {formatNumber(summary.thisMonth)} / {displayLimit(limit)}
            </span>
          </div>
          <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.14]">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {status === 'CANCELED' && (
          <div className="mt-4 rounded-[10px] border border-destructive/30 bg-destructive-dim px-3 py-2 text-sm text-bg">
            Your subscription was canceled. Pick a plan below to resubscribe.
          </div>
        )}
        {status === 'PAST_DUE' && (
          <div className="mt-4 rounded-[10px] border border-destructive/30 bg-destructive-dim px-3 py-2 text-sm text-bg">
            Your last payment failed. Update your payment method to keep your
            plan active.
          </div>
        )}
      </div>

      {/* Plans */}
      <div>
        <div className="mb-3.5 font-mono text-[10.5px] tracking-[0.16em] text-muted">
          CHANGE PLAN
        </div>
        <PlanCards currentPlan={plan} />
      </div>
    </div>
  );
}
