import { Resend } from 'resend';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends a transactional email via Resend when RESEND_API_KEY is configured.
 * In development without a key, the email content is logged to the server
 * console instead so the flow stays fully testable.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'Aria <onboarding@resend.dev>';

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'RESEND_API_KEY is not configured — cannot send email in production.',
      );
    }
    console.log(
      `\n━━━ [dev] email to ${opts.to} ━━━\nSubject: ${opts.subject}\n\n${opts.text}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
    );
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }
}

export function passwordResetEmail(resetUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Reset your Aria password';
  const text = [
    'Someone requested a password reset for your Aria account.',
    '',
    `Reset your password: ${resetUrl}`,
    '',
    'This link expires in 1 hour. If you did not request this, you can safely ignore this email — your password will not change.',
  ].join('\n');

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Inter,-apple-system,Segoe UI,sans-serif;color:#0f172a;">
    <div style="max-width:440px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
      <div style="font-size:20px;font-weight:800;letter-spacing:-0.02em;margin-bottom:16px;">Aria</div>
      <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">
        Someone requested a password reset for your Aria account. Click the button
        below to choose a new password.
      </p>
      <a href="${resetUrl}"
         style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 22px;border-radius:10px;">
        Reset password
      </a>
      <p style="font-size:12px;line-height:1.6;color:#64748b;margin:24px 0 0;">
        This link expires in 1 hour. If you didn't request this, you can safely
        ignore this email — your password will not change.
      </p>
    </div>
  </body>
</html>`;

  return { subject, html, text };
}
