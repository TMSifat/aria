import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS, type PlanId } from '@/lib/plans';
import { getUsageSummary } from '@/lib/usage';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { TooltipProvider } from '@/components/ui/tooltip';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  const name = user.name ?? 'Admin';
  const email = user.email ?? '';
  const userId = user.id;

  const [subscription, summary] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    getUsageSummary(userId),
  ]);
  const plan = (subscription?.plan ?? 'FREE') as PlanId;

  return (
    <TooltipProvider delayDuration={200}>
      <Sidebar
        name={name}
        email={email}
        plan={plan}
        thisMonth={summary.thisMonth}
        messageLimit={PLAN_LIMITS[plan].messages}
        isAdmin
      />
      <div className="ml-[236px] flex min-h-screen flex-col bg-bg">
        <Header />
        <main className="flex-1 p-9">{children}</main>
      </div>
    </TooltipProvider>
  );
}
