import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const schema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(6).max(200),
});

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await rateLimit(`reset:ip:${ip}`, 10, 3600);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid reset link or password too short (min 6 characters).' },
      { status: 400 },
    );
  }

  const tokenHash = crypto
    .createHash('sha256')
    .update(parsed.data.token)
    .digest('hex');

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'This reset link is invalid or has expired. Request a new one.' },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate any active NextAuth database sessions for safety.
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  return NextResponse.json({ success: true });
}
