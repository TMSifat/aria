'use server';

import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS, type PlanId } from '@/lib/plans';

const assistantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  persona: z.string().max(100).optional().or(z.literal('')),
  instructions: z
    .string()
    .min(20, 'Instructions must be at least 20 characters'),
  knowledgeBase: z.string().optional().or(z.literal('')),
});

export type AssistantInput = z.infer<typeof assistantSchema>;

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  return session.user;
}

async function currentPlan(userId: string): Promise<PlanId> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return (sub?.plan ?? 'FREE') as PlanId;
}

export async function createAssistant(
  input: AssistantInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = assistantSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message };
    }

    const plan = await currentPlan(user.id);
    const count = await prisma.assistant.count({
      where: { userId: user.id },
    });
    if (count >= PLAN_LIMITS[plan].assistants) {
      return {
        ok: false,
        error: 'You have reached your assistant limit. Upgrade to create more.',
      };
    }

    const { name, persona, instructions, knowledgeBase } = parsed.data;
    const assistant = await prisma.assistant.create({
      data: {
        userId: user.id,
        name,
        persona: persona || null,
        instructions,
        knowledgeBase: knowledgeBase || null,
        widgetKey: `wk_${nanoid(24)}`,
      },
    });

    revalidatePath('/assistants');
    revalidatePath('/dashboard');
    return { ok: true, data: { id: assistant.id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to create assistant',
    };
  }
}

export async function updateAssistant(
  id: string,
  input: AssistantInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = assistantSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message };
    }

    const existing = await prisma.assistant.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return { ok: false, error: 'Assistant not found' };

    const { name, persona, instructions, knowledgeBase } = parsed.data;
    await prisma.assistant.update({
      where: { id },
      data: {
        name,
        persona: persona || null,
        instructions,
        knowledgeBase: knowledgeBase || null,
      },
    });

    revalidatePath('/assistants');
    revalidatePath(`/assistants/${id}`);
    revalidatePath(`/assistants/${id}/settings`);
    return { ok: true, data: { id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to update assistant',
    };
  }
}

export async function deleteAssistant(
  id: string,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const existing = await prisma.assistant.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return { ok: false, error: 'Assistant not found' };

    await prisma.assistant.delete({ where: { id } });
    revalidatePath('/assistants');
    revalidatePath('/dashboard');
    return { ok: true, data: undefined };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to delete assistant',
    };
  }
}
