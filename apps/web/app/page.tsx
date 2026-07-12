import Link from 'next/link';
import { PLANS } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { AriaWidget } from '@/components/landing/aria-widget';
import { AriaayLogo } from '@/components/logo';
import { ScrollReveal } from '@/components/landing/scroll-reveal';

const WORDS = [
  'Customer support',
  'Lead qualification',
  'Documentation',
  'Onboarding',
  'Internal help',
  'Customer support',
];

const BIG_NUMBERS = [
  {
    n: '1',
    suffix: '_',
    label: 'LINE OF CODE',
    body: 'One script tag deploys your assistant to any site — React, Webflow, plain HTML.',
  },
  {
    n: '10',
    suffix: '′',
    label: 'MINUTES TO LIVE',
    body: 'Create, configure, test, deploy. Most teams ship their first assistant in under ten minutes.',
  },
  {
    n: '0',
    suffix: '$',
    label: 'TO START',
    body: 'The free plan includes one assistant and 100 messages a month. Upgrade only when it earns it.',
  },
];

const FEATURES = [
  {
    n: '/01',
    title: 'Custom instructions',
    body: 'Define a name, persona, and precise behavioral rules. Attach a knowledge base so answers reflect your product, docs, and policies — not the open internet.',
  },
  {
    n: '/02',
    title: 'Live chat preview',
    body: 'Test every change in a real streaming conversation, right in the dashboard. Iterate on instructions and watch the behavior shift instantly. Try the widget in the corner of this page.',
  },
  {
    n: '/03',
    title: 'Embed anywhere',
    body: "One script tag is all it takes. For deeper integrations there's a full REST API with scoped, revocable keys and usage analytics.",
  },
];

const SECURITY = [
  {
    title: 'Hashed credentials',
    body: 'Passwords and API keys are stored as bcrypt hashes. Keys are shown in full exactly once, at creation.',
  },
  {
    title: 'No card data stored',
    body: "All payments run through Stripe. Card details never touch Ariaay's servers.",
  },
  {
    title: 'Rate limiting',
    body: 'Per-user rate limits protect every assistant from abuse and runaway usage.',
  },
  {
    title: 'Server-side enforcement',
    body: 'Plan limits are checked on the server against the live subscription — never trusted to the client.',
  },
  {
    title: 'Secrets never logged',
    body: 'API keys, passwords, and payment secrets are excluded from application logs by design.',
  },
  {
    title: 'Revocable access',
    body: 'Revoke any API key instantly. Sessions re-verify on every request.',
  },
];

const FAQ = [
  {
    q: 'What counts as a message?',
    a: "Every reply your assistant generates counts as one message — from the widget, the dashboard preview, or the API. Your visitors' questions are free.",
  },
  {
    q: 'What happens when I hit my limit?',
    a: 'Your assistants pause politely until the next billing cycle, or resume immediately when you upgrade. No surprise overage charges.',
  },
  {
    q: 'How fast are the responses?',
    a: 'Responses stream in token-by-token, so your visitors start reading immediately — no waiting for the full answer. We keep the underlying model current as newer versions ship.',
  },
  {
    q: 'How does the embed work?',
    a: "Paste a single script tag with your assistant's ID. The widget renders a chat launcher on your site — no build step, no framework requirements.",
  },
  {
    q: 'Can I change plans later?',
    a: 'Upgrade, downgrade, or cancel any time from the billing page. Changes are prorated through Stripe and new limits apply immediately.',
  },
  {
    q: 'Is there an API?',
    a: 'Pro and Agency plans include a REST API for assistants, keys, and usage data, authenticated with scoped bearer keys you can revoke any time.',
  },
];

function Wordmark({ className }: { className?: string }) {
  return <AriaayLogo className={className} />;
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-bg text-text-base">
      <ScrollReveal />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-6 sm:px-10">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-8 text-[14.5px] font-medium md:flex">
            <a href="#features">Features</a>
            <a href="#security">Security</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <Link href="/login">Sign in</Link>
            <Link href="/signup">
              <Button>Get started</Button>
            </Link>
          </nav>
          <Link href="/signup" className="md:hidden">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-[70px] pt-[80px] sm:px-10 sm:pb-[90px] sm:pt-[110px]">
        <div
          className="flex items-center gap-3.5 font-mono text-[12.5px] tracking-[0.22em] text-muted"
          style={{ animation: 'riseIn .7s ease both' }}
        >
          <span className="h-px w-[26px] bg-primary" />
          AI ASSISTANT PLATFORM
        </div>
        <h1
          className="mt-8 font-display text-[clamp(48px,9.5vw,128px)] font-extrabold leading-[0.98] tracking-[-0.045em]"
          style={{ animation: 'riseIn .7s ease .08s both' }}
        >
          Assistants,
          <br />
          engineered<span className="text-primary">.</span>
        </h1>
        <div
          className="mt-11 grid gap-10 sm:gap-[60px] md:grid-cols-[1.2fr_1fr] md:items-end"
          style={{ animation: 'riseIn .7s ease .16s both' }}
        >
          <div>
            <p className="max-w-[560px] text-[17px] leading-relaxed text-text-secondary sm:text-[19px]">
              AI assistants with your instructions and your knowledge base.
              Test them in a live console, then embed anywhere with one line
              of code.
            </p>
            <p className="mt-3.5 font-mono text-xs tracking-[0.08em] text-faint">
              FREE PLAN INCLUDED — NO CREDIT CARD REQUIRED
            </p>
          </div>
          <div className="flex flex-wrap gap-3.5 md:justify-end">
            <Link href="/signup">
              <Button size="lg">Start building</Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg">
                See features →
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Rotating words */}
      <section className="border-y border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-7 px-6 py-[34px] sm:px-10">
          <span className="font-mono text-[12.5px] tracking-[0.22em] text-muted">
            ASSISTANTS FOR
          </span>
          <span className="inline-block h-[58px] overflow-hidden">
            <span
              className="flex flex-col"
              style={{ animation: 'wordSpin 12s cubic-bezier(.77,0,.18,1) infinite' }}
            >
              {WORDS.map((w, i) => (
                <span
                  key={i}
                  className="flex h-[58px] items-center whitespace-nowrap font-display text-[32px] font-extrabold tracking-[-0.035em] text-primary sm:text-[44px]"
                >
                  {w}
                </span>
              ))}
            </span>
          </span>
        </div>
      </section>

      {/* Big numbers */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-[90px] sm:px-10 md:grid-cols-3">
        {BIG_NUMBERS.map((b) => (
          <div
            key={b.label}
            data-reveal
            className="rounded-[18px] border border-border bg-surface p-9"
          >
            <div className="font-display text-[64px] font-extrabold leading-none tracking-[-0.05em] sm:text-[88px]">
              {b.n}
              <span className="text-primary">{b.suffix}</span>
            </div>
            <div className="mt-[18px] font-mono text-xs tracking-[0.16em] text-muted">
              {b.label}
            </div>
            <p className="mt-2.5 text-[15px] leading-[1.55] text-text-secondary">
              {b.body}
            </p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-[100px] sm:px-10">
          <div className="flex items-center gap-3.5 font-mono text-[12.5px] tracking-[0.22em] text-muted">
            <span className="h-px w-[26px] bg-primary" />
            WHAT ARIA DOES
          </div>
          <h2
            data-reveal
            className="mt-6 max-w-[720px] font-display text-[clamp(34px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.04em]"
          >
            Everything you need to ship AI chat.
          </h2>

          <div className="mt-[70px] flex flex-col">
            {FEATURES.map((f) => (
              <div
                key={f.n}
                data-reveal
                className="grid grid-cols-1 gap-3 border-t border-border py-[34px] sm:grid-cols-[120px_1fr_1.2fr] sm:gap-10 sm:items-baseline"
              >
                <div className="font-mono text-sm text-primary">{f.n}</div>
                <div className="font-display text-2xl font-bold tracking-[-0.02em] sm:text-[26px]">
                  {f.title}
                </div>
                <p className="text-base leading-relaxed text-text-secondary">
                  {f.body}
                </p>
              </div>
            ))}
            <div className="border-t border-border" />
          </div>

          <div
            data-reveal
            className="mt-[70px] grid gap-[60px] md:grid-cols-[1fr_1.1fr] md:items-center"
          >
            <div>
              <div className="font-mono text-[12.5px] tracking-[0.22em] text-muted">
                DEPLOY
              </div>
              <h3 className="mt-4 font-display text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em]">
                Paste it. Ship it.
              </h3>
              <p className="mt-4 text-base leading-relaxed text-text-secondary">
                If it renders in a browser, your assistant runs on it. No
                SDK, no build step, no framework requirements.
              </p>
            </div>
            <div className="overflow-x-auto rounded-2xl bg-text-base px-8 py-[30px] font-mono text-[13.5px] leading-[2] text-[#D8D2C2]">
              <div className="text-faint">{'<!-- paste before </body> -->'}</div>
              <div>
                &lt;script src=
                <span className="text-teal-light">
                  &quot;https://cdn.aria.ai/widget.js&quot;
                </span>
              </div>
              <div className="pl-5">
                data-assistant=
                <span className="text-teal-light">&quot;ast_8f3k2m&quot;</span>
                &gt;&lt;/script&gt;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="bg-text-base text-surface">
        <div className="mx-auto max-w-6xl px-6 py-[100px] sm:px-10">
          <div className="flex items-center gap-3.5 font-mono text-[12.5px] tracking-[0.22em] text-on-dark-muted">
            <span className="h-px w-[26px] bg-primary" />
            SECURITY &amp; TRUST
          </div>
          <h2
            data-reveal
            className="mt-6 max-w-[780px] font-display text-[clamp(30px,4.6vw,58px)] font-extrabold leading-[1.04] tracking-[-0.04em]"
          >
            Built like it handles your customers&apos; conversations. Because
            it does.
          </h2>
          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY.map((s) => (
              <div key={s.title} data-reveal className="border-t border-white/20 pt-[22px]">
                <div className="text-[17px] font-bold">{s.title}</div>
                <p className="mt-2 text-[14.5px] leading-relaxed text-on-dark-muted">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing">
        <div className="mx-auto max-w-6xl px-6 py-[100px] sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3.5 font-mono text-[12.5px] tracking-[0.22em] text-muted">
                <span className="h-px w-[26px] bg-primary" />
                PRICING
              </div>
              <h2 className="mt-6 font-display text-[clamp(34px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.04em]">
                Simple. Transparent.
              </h2>
            </div>
            <p className="mb-2 text-[15px] text-muted">
              Start free. Upgrade when usage grows. Cancel any time.
            </p>
          </div>

          <div className="mt-[60px] grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                data-reveal
                className={
                  plan.popular
                    ? 'flex flex-col rounded-[18px] bg-text-base p-[30px] text-surface shadow-[0_20px_44px_rgba(22,21,15,0.22)]'
                    : 'flex flex-col rounded-[18px] border border-border bg-surface p-[30px]'
                }
              >
                <div className="flex items-center justify-between">
                  <div
                    className={
                      plan.popular
                        ? 'font-mono text-xs tracking-[0.16em] text-teal-light'
                        : 'font-mono text-xs tracking-[0.16em] text-muted'
                    }
                  >
                    {plan.label.toUpperCase()}
                  </div>
                  {plan.popular && (
                    <span className="rounded-full bg-teal-light px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-text-base">
                      POPULAR
                    </span>
                  )}
                </div>
                <div className="mt-3.5 font-display text-[44px] font-extrabold tracking-[-0.04em]">
                  ${plan.price}
                  <span
                    className={
                      plan.popular
                        ? 'text-[15px] font-medium text-faint'
                        : 'text-[15px] font-medium text-faint'
                    }
                  >
                    /mo
                  </span>
                </div>
                <ul
                  className={
                    plan.popular
                      ? 'my-[22px] flex flex-1 flex-col gap-2.5 text-sm text-[#C9C4B4]'
                      : 'my-[22px] flex flex-1 flex-col gap-2.5 text-sm text-text-secondary'
                  }
                >
                  {plan.features.map((f) => (
                    <li key={f}>— {f}</li>
                  ))}
                </ul>
                <Link href="/signup" className="block">
                  <Button
                    className={
                      plan.popular
                        ? 'w-full bg-bg text-text-base hover:bg-primary hover:text-surface'
                        : 'w-full'
                    }
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.id === 'FREE' ? 'Get started' : `Choose ${plan.label}`}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-[60px] px-6 py-[100px] sm:px-10 md:grid-cols-[1fr_1.4fr] md:items-start">
          <div>
            <div className="flex items-center gap-3.5 font-mono text-[12.5px] tracking-[0.22em] text-muted">
              <span className="h-px w-[26px] bg-primary" />
              FAQ
            </div>
            <h2 className="mt-6 font-display text-[clamp(30px,4.4vw,56px)] font-extrabold leading-[1.04] tracking-[-0.04em]">
              Questions, answered.
            </h2>
          </div>
          <div className="flex flex-col">
            {FAQ.map((item, i) => (
              <details
                key={item.q}
                className={
                  i === FAQ.length - 1
                    ? 'group border-t border-b border-border py-[22px]'
                    : 'group border-t border-border py-[22px]'
                }
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="text-[22px] font-normal text-primary transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3.5 text-[15px] leading-relaxed text-text-secondary">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-[120px] text-center sm:px-10">
          <h2
            data-reveal
            className="font-display text-[clamp(40px,7vw,96px)] font-extrabold leading-none tracking-[-0.045em]"
          >
            Build yours<span className="text-primary">.</span>
          </h2>
          <p className="mt-[22px] font-mono text-xs tracking-[0.18em] text-muted">
            FREE PLAN · NO CREDIT CARD · LIVE IN MINUTES
          </p>
          <Link href="/signup" className="mt-10 inline-block">
            <Button size="lg">Start building free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-base text-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-11 sm:flex-row sm:px-10">
          <span className="font-display text-xl font-bold tracking-tight">
            <Wordmark />
          </span>
          <div className="flex items-center gap-7 text-[13.5px] text-on-dark-muted">
            <Link href="/login">Sign in</Link>
            <Link href="/signup">Sign up</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
          <span className="font-mono text-xs text-faint">
            © {new Date().getFullYear()} ARIA
          </span>
        </div>
      </footer>

      <AriaWidget />
    </div>
  );
}
