import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_MAP, type PlanId } from '@/lib/plans';
import { getUsageSummary } from '@/lib/usage';

/** For pages/layouts: verifies the caller is signed in and an admin, redirecting otherwise. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');
  return session.user;
}

/** For server actions: verifies the caller is an admin, throwing otherwise (redirect() can't be caught-and-swallowed by a try/catch, so actions use this instead of requireAdmin()). */
export async function assertAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export interface PlatformSummary {
  totalUsers: number;
  newUsersThisWeek: number;
  totalAssistants: number;
  messagesThisMonth: number;
  totalMessages: number;
  mrr: number;
  planCounts: Record<PlanId, number>;
}

export async function getPlatformSummary(): Promise<PlatformSummary> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, newUsersThisWeek, usage, planGroups] = await Promise.all(
    [
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      getUsageSummary(),
      prisma.subscription.groupBy({ by: ['plan'], _count: { _all: true } }),
    ],
  );

  const planCounts = { FREE: 0, STARTER: 0, PRO: 0, AGENCY: 0 } as Record<
    PlanId,
    number
  >;
  for (const g of planGroups) planCounts[g.plan as PlanId] = g._count._all;

  const mrr = (Object.keys(planCounts) as PlanId[]).reduce(
    (sum, id) => sum + planCounts[id] * PLAN_MAP[id].price,
    0,
  );

  return {
    totalUsers,
    newUsersThisWeek,
    totalAssistants: usage.assistants,
    messagesThisMonth: usage.thisMonth,
    totalMessages: usage.totalMessages,
    mrr,
    planCounts,
  };
}

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  plan: PlanId;
  suspended: boolean;
  assistantCount: number;
  createdAt: Date;
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      subscription: true,
      _count: { select: { assistants: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    plan: (u.subscription?.plan ?? 'FREE') as PlanId,
    suspended: u.suspended,
    assistantCount: u._count.assistants,
    createdAt: u.createdAt,
  }));
}
