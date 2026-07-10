'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const email = String(new FormData(e.currentTarget).get('email'));

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Something went wrong. Try again.');
      return;
    }
    setSent(true);
  }

  return (
    <div className="w-full max-w-[410px] rounded-[20px] border border-border bg-surface p-9">
      <h1 className="font-display text-[27px] font-bold tracking-[-0.025em]">
        Reset password<span className="text-primary">.</span>
      </h1>
      <p className="mt-2 text-sm text-muted">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <div className="mt-[26px] flex flex-col gap-4">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <MailCheck className="h-8 w-8 text-primary" />
            <p className="text-sm text-muted">
              If an account exists for that email, a reset link is on its way.
              The link expires in 1 hour.
            </p>
            <Link href="/login" className="text-sm font-semibold text-primary">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-center gap-2 rounded-[10px] border border-destructive/30 bg-destructive-dim px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="email"
                  className="font-mono text-[11px] font-normal tracking-[0.14em] text-muted"
                >
                  EMAIL
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />
              </div>
              <Button type="submit" className="mt-1 w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
            </form>
            <p className="text-center text-[13.5px] text-muted">
              Remembered it?{' '}
              <Link href="/login" className="font-semibold text-primary">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
