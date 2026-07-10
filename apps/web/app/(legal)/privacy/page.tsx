import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Aria',
};

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'tanvirsifat51@gmail.com';

const EFFECTIVE_DATE = 'July 11, 2026';

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-9 font-display text-lg font-bold tracking-tight text-text-base">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-muted">{children}</p>;
}

function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="mt-2 text-sm leading-relaxed text-muted">{children}</li>
  );
}

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="font-display text-3xl font-bold tracking-tight text-text-base">
        Privacy Policy<span className="text-primary">.</span>
      </h1>
      <p className="mt-2 font-mono text-xs tracking-wide text-muted">
        EFFECTIVE {EFFECTIVE_DATE.toUpperCase()}
      </p>

      <P>
        This policy explains what data Aria collects, why, and how it is
        handled when you use our website, dashboard, API, and embeddable chat
        widget.
      </P>

      <H2>1. Data we collect</H2>
      <ul className="ml-5 list-disc">
        <LI>
          <strong>Account data</strong> — name, email address, and a bcrypt
          hash of your password (never the password itself). If you sign in
          with Google, we receive your name, email, and avatar from Google.
        </LI>
        <LI>
          <strong>Assistant content</strong> — the names, instructions, and
          knowledge bases you configure, and the messages exchanged in chats
          with your assistants.
        </LI>
        <LI>
          <strong>Usage data</strong> — message counts and token counts per
          conversation, used for plan limits and your usage dashboard.
        </LI>
        <LI>
          <strong>Billing data</strong> — handled by Stripe. We store only your
          Stripe customer/subscription identifiers and plan status; we never
          see or store card numbers.
        </LI>
      </ul>

      <H2>2. How we use it</H2>
      <P>
        To operate the Service: authenticate you, generate assistant responses,
        enforce plan limits, process payments, send transactional email (such
        as password resets), prevent abuse, and improve reliability. We do not
        sell personal data and we do not use your content for advertising.
      </P>

      <H2>3. AI processing</H2>
      <P>
        To generate responses, your assistant&apos;s instructions, knowledge
        base, and conversation messages are sent to our AI model providers
        (Google and/or Anthropic, depending on configuration). These providers
        process the content to return a reply, subject to their own API data
        policies, and API content is not used by them to train their models
        per their standard API terms.
      </P>

      <H2>4. Processors we rely on</H2>
      <ul className="ml-5 list-disc">
        <LI>Google / Anthropic — AI response generation</LI>
        <LI>Stripe — payments and subscription management</LI>
        <LI>Resend — transactional email</LI>
        <LI>
          Hosting and data infrastructure — our cloud hosting, database, and
          cache providers (e.g. Vercel, Railway, Neon, Upstash)
        </LI>
      </ul>

      <H2>5. Cookies</H2>
      <P>
        We use only essential cookies: a session cookie to keep you signed in
        and a CSRF token to secure forms. No advertising or cross-site tracking
        cookies are set.
      </P>

      <H2>6. Retention and deletion</H2>
      <P>
        Account and content data are retained while your account is active.
        When you delete an assistant, its data is removed; when your account is
        deleted, associated data (assistants, API keys, usage logs) is deleted
        with it. Backups age out on a rolling schedule. To request deletion or
        a copy of your data, contact us.
      </P>

      <H2>7. Security</H2>
      <P>
        Passwords and API keys are stored only as one-way hashes. Transport is
        encrypted with TLS. Access to production data is restricted. No system
        is perfectly secure — if we learn of a breach affecting your data, we
        will notify you without undue delay.
      </P>

      <H2>8. Your rights</H2>
      <P>
        Depending on your jurisdiction, you may have rights to access, correct,
        export, or delete your personal data, and to object to certain
        processing. Contact us to exercise these rights and we will respond
        within 30 days.
      </P>

      <H2>9. Changes</H2>
      <P>
        We will announce material changes to this policy by email or in-app
        notice before they take effect.
      </P>

      <H2>10. Contact</H2>
      <P>
        Privacy questions: <strong>{CONTACT_EMAIL}</strong>
      </P>
    </article>
  );
}
