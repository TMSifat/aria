'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  reactivateUser,
  revokeApiKeyAsAdmin,
  setUserPlan,
  suspendUser,
} from '@/lib/actions/admin';
import { PLANS, type PlanId } from '@/lib/plans';
import { formatDate } from '@/lib/utils';

interface ApiKeyRow {
  id: string;
  name: string;
  masked: string;
  isActive: boolean;
  createdAt: string;
}

interface UserActionsProps {
  userId: string;
  currentPlan: PlanId;
  suspended: boolean;
  apiKeys: ApiKeyRow[];
}

export function UserActions({
  userId,
  currentPlan,
  suspended,
  apiKeys,
}: UserActionsProps) {
  const router = useRouter();
  const [plan, setPlan] = React.useState<PlanId>(currentPlan);
  const [savingPlan, setSavingPlan] = React.useState(false);
  const [togglingStatus, setTogglingStatus] = React.useState(false);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);

  async function onUpdatePlan() {
    setSavingPlan(true);
    const res = await setUserPlan(userId, plan);
    setSavingPlan(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Plan updated to ${plan}`);
    router.refresh();
  }

  async function onToggleStatus() {
    setTogglingStatus(true);
    const res = suspended
      ? await reactivateUser(userId)
      : await suspendUser(userId);
    setTogglingStatus(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(suspended ? 'Account reactivated' : 'Account suspended');
    router.refresh();
  }

  async function onRevoke(keyId: string) {
    setRevokingId(keyId);
    const res = await revokeApiKeyAsAdmin(keyId);
    setRevokingId(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success('API key revoked');
    router.refresh();
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-surface p-[22px]">
        <div className="font-mono text-[10.5px] tracking-[0.16em] text-muted">
          PLAN &amp; STATUS
        </div>
        <div className="mt-4 flex items-center gap-2">
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as PlanId)}
            className="h-11 flex-1 rounded-[10px] border border-text-base/25 bg-surface-raised px-3.5 text-[14.5px] text-text-base outline-none focus:border-primary"
          >
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <Button
            onClick={onUpdatePlan}
            disabled={savingPlan || plan === currentPlan}
          >
            {savingPlan && <Loader2 className="h-4 w-4 animate-spin" />}
            Update
          </Button>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <Button
            variant={suspended ? 'default' : 'destructive'}
            className="w-full"
            onClick={onToggleStatus}
            disabled={togglingStatus}
          >
            {togglingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
            {suspended ? 'Reactivate account' : 'Suspend account'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-[22px]">
        <div className="font-mono text-[10.5px] tracking-[0.16em] text-muted">
          API KEYS
        </div>
        {apiKeys.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            No API keys.
          </div>
        ) : (
          <div>
            {apiKeys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between border-t border-border py-3 first:border-t-0"
              >
                <div>
                  <div className="text-[13.5px] font-medium">{k.name}</div>
                  <div className="font-mono text-[11px] text-muted">
                    {k.masked} · {formatDate(k.createdAt)}
                  </div>
                </div>
                {k.isActive ? (
                  <button
                    type="button"
                    className="text-[12.5px] font-semibold text-destructive hover:opacity-75 disabled:opacity-50"
                    onClick={() => void onRevoke(k.id)}
                    disabled={revokingId === k.id}
                  >
                    {revokingId === k.id ? 'Revoking…' : 'Revoke'}
                  </button>
                ) : (
                  <span className="font-mono text-[10px] tracking-[0.1em] text-faint">
                    ● REVOKED
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
