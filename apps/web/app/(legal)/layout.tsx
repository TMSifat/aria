import Link from 'next/link';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-tight text-text-base"
          >
            Aria<span className="text-primary">.</span>
          </Link>
          <Link href="/signup" className="text-sm font-medium text-primary">
            Get started
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
      <footer className="border-t border-border py-8 text-center font-mono text-xs text-muted">
        © {new Date().getFullYear()} ARIA
      </footer>
    </div>
  );
}
