'use client';

import { usePathname } from 'next/navigation';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/assistants': 'Assistants',
  '/api-keys': 'API Keys',
  '/billing': 'Billing',
  '/admin': 'Overview',
  '/admin/users': 'Users',
};

const CRUMBS: Record<string, string> = {
  '/dashboard': 'WORKSPACE / OVERVIEW',
  '/assistants': 'WORKSPACE / ASSISTANTS',
  '/api-keys': 'DEVELOPER / KEYS',
  '/billing': 'ACCOUNT / BILLING',
  '/admin': 'ADMIN / OVERVIEW',
  '/admin/users': 'ADMIN / USERS',
};

export function Header() {
  const pathname = usePathname();

  let title = 'Dashboard';
  let crumb = CRUMBS['/dashboard'];
  for (const [path, label] of Object.entries(TITLES)) {
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      title = label;
      crumb = CRUMBS[path];
    }
  }

  const today = new Date()
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border bg-bg/92 px-10 backdrop-blur">
      <div className="flex items-baseline gap-3.5">
        <h1 className="font-display text-xl font-bold tracking-[-0.02em]">
          {title}
        </h1>
        <span className="font-mono text-[10.5px] tracking-[0.16em] text-faint">
          {crumb}
        </span>
      </div>
      <span className="rounded-full border border-text-base/[0.18] px-[13px] py-1.5 font-mono text-[11px] tracking-[0.1em] text-muted">
        {today}
      </span>
    </header>
  );
}
