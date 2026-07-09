'use server';

import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import type { PlanId } from '@/lib/plans';
import type { ActionResult } from '@/lib/actions/assistants';

export async function setUserPlan(
  userId: string,
  plan: PlanId,
): Promise<ActionResult> {
  try {
    await assertAdmin();
    await prisma.subscription.upsert({
      where: { userId },
      update: { plan },
      create: { userId, plan },
    });
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/users');
    return { ok: true, data: undefined };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to update plan',
    };
  }
}

async function setSuspended(
  userId: string,
  suspended: boolean,
): Promise<ActionResult> {
  try {
    await assertAdmin();
    await prisma.user.update({ where: { id: userId }, data: { suspended } });
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/users');
    return { ok: true, data: undefined };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Failed to update account status',
    };
  }
}

export async function suspendUser(userId: string): Promise<ActionResult> {
  return setSuspended(userId, true);
}

export async function reactivateUser(userId: string): Promise<ActionResult> {
  return setSuspended(userId, false);
}

export async function revokeApiKeyAsAdmin(
  keyId: string,
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key) return { ok: false, error: 'API key not found' };

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });
    revalidatePath(`/admin/users/${key.userId}`);
    return { ok: true, data: undefined };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to revoke API key',
    };
  }
}
