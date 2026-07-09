import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, planFromPriceId, type PlanId } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import type { SubscriptionStatus } from '@prisma/client';

export const runtime = 'nodejs';
// Stripe requires the raw request body for signature verification.
export const dynamic = 'force-dynamic';

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE';
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELED';
    case 'trialing':
      return 'TRIALING';
    default:
      return 'INCOMPLETE';
  }
}

function periodEnd(sub: Stripe.Subscription): Date | null {
  return sub.current_period_end
    ? new Date(sub.current_period_end * 1000)
    : null;
}

function periodStart(sub: Stripe.Subscription): Date | null {
  return sub.current_period_start
    ? new Date(sub.current_period_start * 1000)
    : null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return new NextResponse('Missing signature/secret', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return new NextResponse(`Webhook signature error: ${msg}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const cs = event.data.object as Stripe.Checkout.Session;
        const userId = cs.metadata?.userId;
        const plan = (cs.metadata?.plan as PlanId) ?? 'PRO';
        if (!userId || !cs.subscription) break;

        const sub = await stripe.subscriptions.retrieve(
          cs.subscription as string,
        );

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: cs.customer as string,
            stripeSubscriptionId: sub.id,
          },
        });

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan,
            status: mapStatus(sub.status),
            periodStart: periodStart(sub),
            periodEnd: periodEnd(sub),
          },
          update: {
            plan,
            status: mapStatus(sub.status),
            periodStart: periodStart(sub),
            periodEnd: periodEnd(sub),
          },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!user) break;

        const priceId = sub.items.data[0]?.price.id;
        const planFromPrice =
          planFromPriceId(priceId) ??
          (sub.metadata?.plan as PlanId | undefined);

        await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            status: mapStatus(sub.status),
            periodStart: periodStart(sub),
            periodEnd: periodEnd(sub),
            ...(planFromPrice ? { plan: planFromPrice } : {}),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!user) break;

        await prisma.subscription.update({
          where: { userId: user.id },
          data: { plan: 'FREE', status: 'CANCELED' },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeSubscriptionId: null },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string | null;
        if (!subId) break;
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subId },
        });
        if (!user) break;
        await prisma.subscription.update({
          where: { userId: user.id },
          data: { status: 'PAST_DUE' },
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    // Log server-side but still 200 handled events we recognise to avoid retries
    // storming; unexpected failures surface as 500 so Stripe retries.
    console.error('Stripe webhook handler error:', err);
    return new NextResponse('Handler error', { status: 500 });
  }

  return NextResponse.json({ received: true });
}
