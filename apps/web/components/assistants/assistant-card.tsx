import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { truncate } from '@/lib/utils';

interface AssistantCardProps {
  id: string;
  name: string;
  persona: string | null;
  messageCount: number;
}

export function AssistantCard({
  id,
  name,
  persona,
  messageCount,
}: AssistantCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-text-base font-display text-[17px] font-bold text-surface">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="font-mono text-[10px] tracking-[0.12em] text-success">
          ● LIVE
        </span>
      </div>
      <div className="font-display text-[17px] font-bold tracking-[-0.015em]">
        {name}
      </div>
      <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted">
        {persona ? truncate(persona, 80) : 'No persona set'}
      </p>
      <div className="my-4 font-mono text-[10.5px] tracking-[0.1em] text-faint">
        {messageCount} MESSAGES · 7D
      </div>
      <div className="flex gap-2">
        <Link href={`/assistants/${id}`} className="flex-1">
          <Button size="sm" className="w-full">
            Open chat
          </Button>
        </Link>
        <Link href={`/assistants/${id}/settings`} className="flex-1">
          <Button size="sm" variant="outline" className="w-full">
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}
