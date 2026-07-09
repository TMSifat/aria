import { Progress } from '@/components/ui/progress';
import { displayLimit } from '@/lib/plans';
import { formatNumber } from '@/lib/utils';

interface StatsCardsProps {
  thisMonth: number;
  messageLimit: number;
  totalMessages: number;
  assistants: number;
  assistantLimit: number;
  apiCalls: number;
}

export function StatsCards({
  thisMonth,
  messageLimit,
  totalMessages,
  assistants,
  assistantLimit,
  apiCalls,
}: StatsCardsProps) {
  const pct =
    messageLimit === Infinity
      ? 0
      : Math.min(100, Math.round((thisMonth / messageLimit) * 100));

  const cards: {
    label: string;
    value: string;
    sub: string;
    progress?: number;
  }[] = [
    {
      label: 'MESSAGES / MO',
      value: formatNumber(thisMonth),
      sub: `${pct}% of ${displayLimit(messageLimit)}`,
      progress: pct,
    },
    {
      label: 'ALL-TIME MESSAGES',
      value: formatNumber(totalMessages),
      sub: 'across all assistants',
    },
    {
      label: 'ASSISTANTS',
      value: `${assistants} / ${displayLimit(assistantLimit)}`,
      sub: 'all responding normally',
    },
    {
      label: 'API CALLS',
      value: formatNumber(apiCalls),
      sub: 'via API key',
    },
  ];

  return (
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
          {c.progress !== undefined ? (
            <>
              <Progress
                value={c.progress}
                className="mt-2.5 h-1 bg-text-base/10"
              />
              <div className="mt-2 text-xs text-faint">{c.sub}</div>
            </>
          ) : (
            <div className="mt-[22px] text-xs text-faint">{c.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}
