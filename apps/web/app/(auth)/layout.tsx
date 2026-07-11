import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-12">
      <Link
        href="/"
        className="mb-[30px] font-display text-[28px] font-bold tracking-tight text-text-base"
      >
        Ariaay<span className="text-primary">.</span>
      </Link>
      {children}
      <p className="mt-[26px] max-w-[410px] text-center font-mono text-[10.5px] tracking-[0.1em] text-faint">
        BY CONTINUING YOU AGREE TO ARIA&apos;S TERMS &amp; PRIVACY POLICY
      </p>
    </div>
  );
}
