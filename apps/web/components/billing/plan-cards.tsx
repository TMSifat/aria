'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PLANS, type PlanId } from '@/lib/plans';
import { cn } from '@/lib/utils';

async function startCheckout(plan: PlanId, onDone: () => void) {
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.url) {
      toast.error(body.error ?? 'Could not start checkout.');
      onDone();
      return;
    }
    window.location.href = body.url;
  } catch {
    toast.error('Network error.');
    onDone();
  }
}

async function openBillingPortal(onDone: () => void) {
  try {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.url) {
      toast.error(body.error ?? 'Could not open billing portal.');
      onDone();
      return;
    }
    window.location.href = body.url;
  } catch {
    toast.error('Network error.');
    onDone();
  }
}

const ORDER: PlanId[] = ['FREE', 'STARTER', 'PRO', 'AGENCY'];

export function PlanCards({
  currentPlan,
  stripeConfigured = true,
}: {
  currentPlan: PlanId;
  /** When Stripe isn't set up yet, paid-plan buttons render as "Coming soon". */
  stripeConfigured?: boolean;
}) {
  const [loading, setLoading] = React.useState<PlanId | null>(null);
  const currentRank = ORDER.indexOf(currentPlan);

  return (
    <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
      {PLANS.map((plan) => {
        const isCurrent = plan.id === currentPlan;
        const isUpgrade = ORDER.indexOf(plan.id) > currentRank;
        return (
          <div
            key={plan.id}
            className={cn(
              'flex flex-col rounded-[18px] p-[22px]',
              isCurrent
                ? 'border-[1.5px] border-primary bg-surface'
                : 'border border-border bg-surface',
            )}
          >
            <div className="font-mono text-xs tracking-[0.16em] text-muted">
              {plan.label.toUpperCase()}
            </div>
            <div className="mt-2.5 font-display text-[30px] font-extrabold tracking-[-0.03em]">
              ${plan.price}
              <span className="text-[13px] font-medium text-faint">/mo</span>
            </div>
            <div className="mt-3 flex-1 text-[12.5px] leading-[1.7] text-muted">
              {plan.assistants === Infinity
                ? 'Unlimited'
                : plan.assistants}{' '}
              assistants
              <br />
              {plan.messages.toLocaleString('en-US')} messages/mo
            </div>

            {isCurrent ? (
              <Button
                variant="secondary"
                className="mt-[18px] w-full"
                disabled
              >
                Current plan
              </Button>
            ) : !stripeConfigured ? (
              <Button variant="outline" className="mt-[18px] w-full" disabled>
                Coming soon
              </Button>
            ) : isUpgrade ? (
              <Button
                className="mt-[18px] w-full"
                disabled={loading !== null}
                onClick={() => {
                  setLoading(plan.id);
                  void startCheckout(plan.id, () => setLoading(null));
                }}
              >
                {loading === plan.id && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Upgrade
              </Button>
            ) : (
              <Button
                variant="outline"
                className="mt-[18px] w-full"
                disabled={loading !== null}
                onClick={() => {
                  setLoading(plan.id);
                  void openBillingPortal(() => setLoading(null));
                }}
              >
                {loading === plan.id && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Downgrade
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ManageSubscriptionButton() {
  const [loading, setLoading] = React.useState(false);

  return (
    <Button
      variant="outline"
      onClick={() => {
        setLoading(true);
        void openBillingPortal(() => setLoading(false));
      }}
      disabled={loading}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      Manage subscription
    </Button>
  );
}
