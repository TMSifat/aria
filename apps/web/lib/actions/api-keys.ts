'use server';

import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/lib/actions/assistants';

export interface MaskedApiKey {
  id: string;
  name: string;
  masked: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  return session.user;
}

export async function listApiKeys(): Promise<MaskedApiKey[]> {
  const user = await requireUser();
  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return keys.map((k) => ({
    id: k.id,
    name: k.name,
    masked: `${k.prefix}${'•'.repeat(8)}`,
    isActive: k.isActive,
    lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
    createdAt: k.createdAt.toISOString(),
  }));
}

export async function createApiKey(
  name: string,
): Promise<ActionResult<{ key: string; name: string; id: string }>> {
  try {
    const user = await requireUser();
    const parsed = z.string().min(1).max(50).safeParse(name);
    if (!parsed.success) return { ok: false, error: 'Name is required' };

    const rawKey = `aria_sk_${nanoid(32)}`;
    const keyHash = await bcrypt.hash(rawKey, 10);
    const prefix = rawKey.slice(0, 12);

    const created = await prisma.apiKey.create({
      data: { userId: user.id, name: parsed.data, keyHash, prefix },
    });

    revalidatePath('/api-keys');
    return {
      ok: true,
      data: { key: rawKey, name: created.name, id: created.id },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to create API key',
    };
  }
}

export async function revokeApiKey(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const key = await prisma.apiKey.findFirst({
      where: { id, userId: user.id },
    });
    if (!key) return { ok: false, error: 'API key not found' };

    await prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath('/api-keys');
    return { ok: true, data: undefined };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to revoke API key',
    };
  }
}
