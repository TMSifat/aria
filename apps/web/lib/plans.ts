// Client-safe plan catalogue. No Stripe SDK import here, so this module is safe
// to import from both client and server components.

export type PlanId = 'FREE' | 'STARTER' | 'PRO' | 'AGENCY';

export interface PlanConfig {
  id: PlanId;
  label: string;
  price: number;
  messages: number;
  assistants: number;
  priceId?: string;
  features: string[];
  popular?: boolean;
}

/** Limits keyed by plan — used for gating throughout the app. */
export const PLAN_LIMITS: Record<
  PlanId,
  { messages: number; assistants: number }
> = {
  FREE: { messages: 100, assistants: 1 },
  STARTER: { messages: 2000, assistants: 3 },
  PRO: { messages: 10000, assistants: 10 },
  AGENCY: { messages: 50000, assistants: Infinity },
};

/** Ordered plan catalogue used by pricing + billing cards. */
export const PLANS: PlanConfig[] = [
  {
    id: 'FREE',
    label: 'Free',
    price: 0,
    messages: 100,
    assistants: 1,
    features: [
      '1 assistant',
      '100 messages/mo',
      'Community support',
      'Widget embed',
    ],
  },
  {
    id: 'STARTER',
    label: 'Starter',
    price: 29,
    messages: 2000,
    assistants: 3,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    features: [
      '3 assistants',
      '2,000 messages/mo',
      'Email support',
      'Widget embed',
      'Analytics',
    ],
  },
  {
    id: 'PRO',
    label: 'Pro',
    price: 79,
    messages: 10000,
    assistants: 10,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    popular: true,
    features: [
      '10 assistants',
      '10,000 messages/mo',
      'Priority support',
      'API access',
      'Analytics',
      'Custom branding',
    ],
  },
  {
    id: 'AGENCY',
    label: 'Agency',
    price: 199,
    messages: 50000,
    assistants: Infinity,
    priceId: process.env.STRIPE_AGENCY_PRICE_ID,
    features: [
      'Unlimited assistants',
      '50,000 messages/mo',
      'Dedicated support',
      'White-label',
      'SLA guarantee',
      'SSO/SAML',
    ],
  },
];

export const PLAN_MAP: Record<PlanId, PlanConfig> = Object.fromEntries(
  PLANS.map((p) => [p.id, p]),
) as Record<PlanId, PlanConfig>;

/** Resolve a plan id from a Stripe price id (used by the webhook). */
export function planFromPriceId(
  priceId: string | null | undefined,
): PlanId | null {
  if (!priceId) return null;
  const match = PLANS.find((p) => p.priceId && p.priceId === priceId);
  return match ? match.id : null;
}

export function displayLimit(n: number): string {
  return n === Infinity ? 'Unlimited' : n.toLocaleString('en-US');
}
