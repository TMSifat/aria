import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/ratelimit';
import { passwordResetEmail, sendEmail } from '@/lib/email';

export const runtime = 'nodejs';

const schema = z.object({ email: z.string().email() });

/**
 * Always responds 200 with { success: true } regardless of whether the email
 * exists — prevents account enumeration. Rate limited per IP and per email.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const [ipLimit, emailLimit] = await Promise.all([
    rateLimit(`forgot:ip:${ip}`, 10, 3600),
    rateLimit(`forgot:email:${email}`, 3, 3600),
  ]);
  if (!ipLimit.success || !emailLimit.success) {
    return NextResponse.json(
      { error: 'Too many reset requests. Try again later.' },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && !user.suspended) {
    // Raw token goes only in the email; we store its sha256.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await prisma.$transaction([
      // One active token per user — invalidate any previous ones.
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      }),
    ]);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
    const mail = passwordResetEmail(resetUrl);

    try {
      await sendEmail({ to: user.email, ...mail });
    } catch (err) {
      console.error('Password reset email failed:', err);
      // Still return success — do not leak account existence via errors.
    }
  }

  return NextResponse.json({ success: true });
}
