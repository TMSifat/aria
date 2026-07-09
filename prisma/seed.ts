import { PrismaClient, Plan, Role, SubscriptionStatus, UsageSource } from '@prisma/client';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Aria database...');

  // ─── Demo user (PRO plan) ────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('demo1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@aria.ai' },
    update: {},
    create: {
      email: 'demo@aria.ai',
      name: 'Demo User',
      passwordHash,
      subscription: {
        create: {
          plan: Plan.PRO,
          status: SubscriptionStatus.ACTIVE,
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log(`✔ User:  ${user.email} (password: demo1234)`);

  // ─── Admin user ──────────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('admin1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aria.ai' },
    update: { role: Role.ADMIN },
    create: {
      email: 'admin@aria.ai',
      name: 'Aria Admin',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      subscription: {
        create: {
          plan: Plan.AGENCY,
          status: SubscriptionStatus.ACTIVE,
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log(`✔ Admin: ${admin.email} (password: admin1234)`);

  // ─── Assistants ──────────────────────────────────────────────────────────
  // Start from a clean slate for this demo user so re-seeding is idempotent.
  await prisma.assistant.deleteMany({ where: { userId: user.id } });

  const supportBot = await prisma.assistant.create({
    data: {
      userId: user.id,
      name: 'Support Bot',
      persona: 'Friendly customer support agent',
      instructions:
        'You are a warm, concise customer support agent for a small SaaS. ' +
        'Answer questions about billing, returns, and shipping. Never make up ' +
        'policy details — if you are unsure, offer to connect the user with a human.',
      knowledgeBase:
        'Return policy: 30-day no-questions-asked returns, refunds within 48 hours.\n' +
        'Shipping: 45+ countries, $9.99 flat rate, 7–14 business days.',
      widgetKey: `wk_${nanoid(24)}`,
    },
  });

  const salesCopilot = await prisma.assistant.create({
    data: {
      userId: user.id,
      name: 'Sales Copilot',
      persona: 'Persuasive sales assistant',
      instructions:
        'You are an upbeat, persuasive sales assistant. Qualify the lead, highlight ' +
        'the value of the product, and always end with a clear call to action such as ' +
        'starting a free trial. Keep answers short and benefit-driven.',
      knowledgeBase:
        'Plans: Starter $29/mo, Team $99/mo (20 seats), Enterprise custom.\n' +
        'All plans include a 14-day free trial. No credit card required.',
      widgetKey: `wk_${nanoid(24)}`,
    },
  });

  console.log(`✔ Assistants: ${supportBot.name}, ${salesCopilot.name}`);

  // ─── API key (raw shown once) ────────────────────────────────────────────
  const rawKey = 'aria_sk_demo_key_for_testing_only';
  const keyHash = await bcrypt.hash(rawKey, 10);

  await prisma.apiKey.deleteMany({ where: { userId: user.id } });
  await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: 'Local development key',
      keyHash,
      prefix: rawKey.slice(0, 12), // "aria_sk_demo"
      isActive: true,
    },
  });

  console.log(`✔ API key: ${rawKey} (prefix ${rawKey.slice(0, 12)})`);

  // ─── 30 days of usage data ───────────────────────────────────────────────
  await prisma.usageLog.deleteMany({ where: { userId: user.id } });

  const assistants = [supportBot, salesCopilot];
  const rows: {
    userId: string;
    assistantId: string;
    source: UsageSource;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    createdAt: Date;
  }[] = [];

  for (let d = 29; d >= 0; d--) {
    const day = new Date();
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() - d);

    // Growing trend with a little noise: 2–14 messages per day.
    const base = Math.round(2 + ((29 - d) / 29) * 10);
    const count = base + Math.floor(Math.random() * 4);

    for (let i = 0; i < count; i++) {
      const assistant = assistants[Math.floor(Math.random() * assistants.length)];
      const input = 120 + Math.floor(Math.random() * 400);
      const output = 80 + Math.floor(Math.random() * 500);
      const isApi = Math.random() < 0.2;
      const createdAt = new Date(day);
      createdAt.setMinutes(Math.floor(Math.random() * 60 * 8)); // spread across the day

      rows.push({
        userId: user.id,
        assistantId: assistant.id,
        source: isApi ? UsageSource.API : UsageSource.DASHBOARD,
        inputTokens: input,
        outputTokens: output,
        totalTokens: input + output,
        createdAt,
      });
    }
  }

  await prisma.usageLog.createMany({ data: rows });
  console.log(`✔ Usage logs: ${rows.length} events across 30 days`);

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
