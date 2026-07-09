import { auth } from '@/lib/auth';
import { anthropic, ARIA_MODEL } from '@/lib/anthropic';
import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS, type PlanId } from '@/lib/plans';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
    history?: ChatMessage[];
  } | null;

  if (!body?.assistantId || !body.message?.trim()) {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }
  const { assistantId, message } = body;
  const history = Array.isArray(body.history) ? body.history : [];

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

  // 6. Start streaming
  const anthropicMessages = [
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: message },
  ];

  const stream = anthropic.messages.stream({
    model: ARIA_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  // 7. Return SSE stream
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: event.delta.text })}\n\n`,
              ),
            );
          }
        }

        const finalMessage = await stream.finalMessage();
        const inputTokens = finalMessage.usage.input_tokens;
        const outputTokens = finalMessage.usage.output_tokens;

        await prisma.usageLog.create({
          data: {
            userId,
            assistantId: assistant.id,
            source: 'DASHBOARD',
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
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
