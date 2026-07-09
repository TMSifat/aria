import Link from 'next/link';
import { getPlatformSummary, listUsers } from '@/lib/admin';
import { formatDate, formatNumber } from '@/lib/utils';

export default async function AdminOverviewPage() {
  const [summary, users] = await Promise.all([
    getPlatformSummary(),
    listUsers(),
  ]);
  const recent = users.slice(0, 8);

  const cards = [
    {
      label: 'TOTAL USERS',
      value: formatNumber(summary.totalUsers),
      sub: `${summary.newUsersThisWeek} new this week`,
    },
    {
      label: 'MRR',
      value: `$${formatNumber(summary.mrr)}`,
      sub: 'from active subscriptions',
    },
    {
      label: 'TOTAL ASSISTANTS',
      value: formatNumber(summary.totalAssistants),
      sub: 'across all accounts',
    },
    {
      label: 'MESSAGES / MO',
      value: formatNumber(summary.messagesThisMonth),
      sub: `${formatNumber(summary.totalMessages)} all-time`,
    },
  ];

  return (
    <div className="mx-auto max-w-[1060px] space-y-7">
      <div>
        <h2 className="font-display text-[30px] font-bold tracking-[-0.03em]">
          Overview<span className="text-primary">.</span>
        </h2>
        <p className="mt-1.5 text-[14.5px] text-muted">
          Platform-wide stats across every account.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-border bg-surface p-[22px]"
          >
            <div className="font-mono text-[10.5px] tracking-[0.16em] text-muted">
              {c.label}
            </div>
            <div className="mt-2.5 font-display text-[32px] font-bold tracking-[-0.03em] text-text-base">
              {c.value}
            </div>
            <div className="mt-[22px] text-xs text-faint">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-[26px]">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="font-mono text-[10.5px] tracking-[0.16em] text-muted">
            RECENT SIGNUPS
          </div>
          <Link href="/admin/users" className="text-[13px] font-semibold text-primary">
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            No users yet.
          </div>
        ) : (
          <div>
            {recent.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between border-t border-border py-4"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-text-base font-display text-[15px] font-bold text-surface">
                    {(u.name ?? u.email).slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <div className="text-[14.5px] font-semibold">
                      {u.name ?? 'Unnamed'}
                    </div>
                    <div className="text-[12.5px] text-muted">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-[18px]">
                  <span className="font-mono text-[10.5px] tracking-[0.1em] text-faint">
                    {u.plan}
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.08em] text-muted">
                    {formatDate(u.createdAt)}
                  </span>
                  <Link href={`/admin/users/${u.id}`}>
                    <span className="text-[13px] font-semibold text-primary">
                      View
                    </span>
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
