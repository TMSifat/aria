import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS, type PlanId } from '@/lib/plans';
import { rateLimit } from '@/lib/ratelimit';
import { streamAssistantReply, type ChatTurn } from '@/lib/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 1. Verify session
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // 2. Rate limit: 20 requests / minute / user
  const rl = await rateLimit(`chat:${userId}`, 20, 60);
  if (!rl.success) {
    return Response.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    assistantId?: string;
    message?: string;
    history?: ChatTurn[];
  } | null;

  if (!body?.assistantId || !body.message?.trim()) {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }
  const { assistantId, message } = body;
  const history = (Array.isArray(body.history) ? body.history : []).filter(
    (m) => m && (m.role === 'user' || m.role === 'assistant'),
  );

  // 3. Fetch assistant (verify ownership)
  const assistant = await prisma.assistant.findFirst({
    where: { id: assistantId, userId },
  });
  if (!assistant) {
    return Response.json({ error: 'Assistant not found' }, { status: 404 });
  }

  // 4. Check monthly message limit
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  const plan = (subscription?.plan ?? 'FREE') as PlanId;
  const limit = PLAN_LIMITS[plan].messages;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const usedThisMonth = await prisma.usageLog.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  });
  if (usedThisMonth >= limit) {
    return Response.json(
      { error: 'Monthly message limit reached. Please upgrade your plan.' },
      { status: 429 },
    );
  }

  // 5. Build system prompt
  const systemPrompt = [
    assistant.instructions,
    assistant.knowledgeBase
      ? `\n\nKnowledge base:\n${assistant.knowledgeBase}`
      : '',
  ].join('');

  // 6. Stream from the active provider (Gemini or Claude) as SSE
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const usage = await streamAssistantReply({
          system: systemPrompt,
          history,
          message,
          maxTokens: 1024,
          onText: (text) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          },
        });

        await prisma.usageLog.create({
          data: {
            userId,
            assistantId: assistant.id,
            source: 'DASHBOARD',
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            totalTokens: usage.inputTokens + usage.outputTokens,
          },
        });

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        const messageText =
          err instanceof Error ? err.message : 'Streaming error';
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: messageText })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
