import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS, type PlanId } from '@/lib/plans';
import { getUsageSummary } from '@/lib/usage';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { TooltipProvider } from '@/components/ui/tooltip';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const name = session.user.name ?? 'User';
  const email = session.user.email ?? '';
  const userId = session.user.id;

  const [dbUser, subscription, summary] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.subscription.findUnique({ where: { userId } }),
    getUsageSummary(userId),
  ]);
  if (dbUser?.suspended) redirect('/login?error=suspended');

  const plan = (subscription?.plan ?? 'FREE') as PlanId;

  return (
    <TooltipProvider delayDuration={200}>
      <Sidebar
        name={name}
        email={email}
        plan={plan}
        thisMonth={summary.thisMonth}
        messageLimit={PLAN_LIMITS[plan].messages}
        isAdmin={session.user.role === 'ADMIN'}
      />
      <div className="ml-[236px] flex min-h-screen flex-col bg-bg">
        <Header />
        <main className="flex-1 p-9">{children}</main>
      </div>
    </TooltipProvider>
  );
}
