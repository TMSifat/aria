'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { displayLimit } from '@/lib/plans';
import { cn } from '@/lib/utils';

const GROUPS = [
  {
    label: 'WORKSPACE',
    items: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/assistants', label: 'Assistants' },
    ],
  },
  {
    label: 'DEVELOPER',
    items: [{ href: '/api-keys', label: 'API Keys' }],
  },
  {
    label: 'ACCOUNT',
    items: [{ href: '/billing', label: 'Billing' }],
  },
];

const ADMIN_GROUP = {
  label: 'ADMIN',
  items: [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/users', label: 'Users' },
  ],
};

interface SidebarProps {
  name: string;
  email: string;
  plan: string;
  thisMonth: number;
  messageLimit: number;
  isAdmin?: boolean;
}

export function Sidebar({
  name,
  email,
  plan,
  thisMonth,
  messageLimit,
  isAdmin,
}: SidebarProps) {
  const pathname = usePathname();
  const pct =
    messageLimit === Infinity
      ? 0
      : Math.min(100, Math.round((thisMonth / messageLimit) * 100));
  const groups = isAdmin ? [ADMIN_GROUP, ...GROUPS] : GROUPS;

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[236px] flex-col bg-text-base text-bg">
      <div className="flex h-[68px] items-center border-b border-white/10 px-6">
        <Link href="/dashboard" className="font-display text-[22px] font-bold tracking-[-0.03em] text-bg">
          Ariaay<span className="text-primary">.</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3.5">
        {groups.map((group) => (
          <React.Fragment key={group.label}>
            <div className="px-3 pb-2.5 pt-[22px] font-mono text-[10px] tracking-[0.2em] text-on-dark-muted first:pt-0">
              {group.label}
            </div>
            {group.items.map(({ href, label }) => {
              const active =
                href === '/admin'
                  ? pathname === '/admin'
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'rounded-[9px] border-l-2 px-3 py-2.5 text-[13.5px] transition-colors',
                    active
                      ? 'border-primary bg-white/10 font-semibold text-bg'
                      : 'border-transparent text-on-dark-muted hover:bg-white/5',
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

      <div className="m-3.5 rounded-xl border border-white/[0.14] bg-white/5 p-3.5">
        <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.16em] text-on-dark-muted">
          <span>{plan.toUpperCase()} PLAN</span>
          <span className="text-success-dark">● ACTIVE</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between text-xs text-on-dark-muted">
          <span>Messages</span>
          <span className="font-semibold text-bg">
            {thisMonth.toLocaleString('en-US')} / {displayLimit(messageLimit)}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.14]">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-[11px] border-t border-white/10 px-5 py-4">
        <Avatar fallback={name || 'U'} className="h-[34px] w-[34px]" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-bg">
            {name || 'User'}
          </div>
          <div className="truncate text-[11px] text-on-dark-muted">
            {email}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut({ redirectTo: '/' })}
          aria-label="Sign out"
          className="rounded-md p-1.5 text-on-dark-muted transition-colors hover:text-bg"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
