'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useGoogleAuth } from '@/components/auth/use-google-auth';

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(80),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const googleEnabled = useGoogleAuth();
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const values = {
      name: String(form.get('name')),
      email: String(form.get('email')),
      password: String(form.get('password')),
      confirmPassword: String(form.get('confirmPassword')),
    };

    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        password: values.password,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setLoading(false);
      setError(body.error ?? 'Could not create account.');
      return;
    }

    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      toast.error('Account created — please sign in.');
      router.push('/login');
      return;
    }
    toast.success('Account created!');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="w-full max-w-[410px] rounded-[20px] border border-border bg-surface p-9">
      <h1 className="font-display text-[27px] font-bold tracking-[-0.025em]">
        Create your account<span className="text-primary">.</span>
      </h1>
      <p className="mt-2 text-sm text-muted">
        Free plan included. No credit card required.
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
              htmlFor="name"
              className="font-mono text-[11px] font-normal tracking-[0.14em] text-muted"
            >
              NAME
            </Label>
            <Input id="name" name="name" placeholder="Ada Lovelace" required />
          </div>
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
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="password"
              className="font-mono text-[11px] font-normal tracking-[0.14em] text-muted"
            >
              PASSWORD
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
              htmlFor="confirmPassword"
              className="font-mono text-[11px] font-normal tracking-[0.14em] text-muted"
            >
              CONFIRM PASSWORD
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" className="mt-1 w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>

        {googleEnabled && (
          <>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="font-mono text-[10.5px] tracking-[0.14em] text-faint">
                OR
              </span>
              <Separator className="flex-1" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={googleLoading}
              onClick={() => {
                setGoogleLoading(true);
                void signIn('google', { redirectTo: '/dashboard' });
              }}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Sign up with Google
            </Button>
          </>
        )}

        <p className="text-center text-[13.5px] text-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
