import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, PLAN_MAP, type PlanId } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { plan } = (await req.json().catch(() => ({}))) as { plan?: PlanId };
  const cfg = plan ? PLAN_MAP[plan] : undefined;
  if (!cfg || cfg.id === 'FREE' || !cfg.priceId) {
    return NextResponse.json(
      { error: 'Invalid or unconfigured plan.' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Get or create the Stripe customer.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: cfg.priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/billing`,
    metadata: { userId: user.id, plan: cfg.id },
    subscription_data: {
      metadata: { userId: user.id, plan: cfg.id },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkout.url });
}
