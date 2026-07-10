'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    setToken(url.searchParams.get('token'));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get('password'));
    const confirm = String(form.get('confirm'));

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Missing reset token — use the link from your email.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Could not reset password.');
      return;
    }

    toast.success('Password updated — sign in with your new password.');
    router.push('/login');
  }

  return (
    <div className="w-full max-w-[410px] rounded-[20px] border border-border bg-surface p-9">
      <h1 className="font-display text-[27px] font-bold tracking-[-0.025em]">
        New password<span className="text-primary">.</span>
      </h1>
      <p className="mt-2 text-sm text-muted">
        Choose a new password for your account.
      </p>

      <div className="mt-[26px] flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-2 rounded-[10px] border border-destructive/30 bg-destructive-dim px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="password"
              className="font-mono text-[11px] font-normal tracking-[0.14em] text-muted"
            >
              NEW PASSWORD
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="confirm"
              className="font-mono text-[11px] font-normal tracking-[0.14em] text-muted"
            >
              CONFIRM PASSWORD
            </Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" className="mt-1 w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>

        <p className="text-center text-[13.5px] text-muted">
          Link expired?{' '}
          <Link href="/forgot-password" className="font-semibold text-primary">
            Request a new one
          </Link>
        </p>
      </div>
    </div>
  );
}
