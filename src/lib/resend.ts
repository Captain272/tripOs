/**
 * Resend wrapper + the five transactional email templates.
 *
 * All `send*` functions are safe to call without RESEND_API_KEY — they
 * become no-ops in dev. Real sends happen only when the key is set.
 */

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (_resend) return _resend;
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.FROM_EMAIL || "TripOS <hello@tripos.app>";

interface SendArgs {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

async function send({ to, subject, html, text }: SendArgs) {
  const r = getResend();
  if (!r) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[email · DEV] would send →", { to, subject });
    }
    return { ok: false as const, mocked: true };
  }
  try {
    const { data, error } = await r.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });
    if (error) return { ok: false as const, error };
    return { ok: true as const, id: data?.id };
  } catch (e) {
    return { ok: false as const, error: e };
  }
}

// ─── shared HTML scaffolding ──────────────────────────────────────────
function shell(title: string, body: string, ctaHref?: string, ctaLabel?: string) {
  return `<!doctype html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;background:#06070d;color:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#06070d;padding:32px 16px">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#10131e;border:1px solid #1f2333;border-radius:16px;overflow:hidden">
          <tr><td style="padding:28px 32px 0">
            <div style="font-size:13px;letter-spacing:.16em;color:#38e1ff;text-transform:uppercase;font-weight:600">TripOS</div>
            <h1 style="font-size:22px;margin:12px 0 8px;color:#fff">${title}</h1>
          </td></tr>
          <tr><td style="padding:0 32px 24px;font-size:15px;line-height:1.6;color:#cdd2dc">
            ${body}
            ${
              ctaHref && ctaLabel
                ? `<p style="margin:24px 0 0">
                    <a href="${ctaHref}" style="display:inline-block;background:linear-gradient(180deg,#38e1ff,#7ce9ff);color:#06070d;font-weight:600;padding:12px 22px;border-radius:999px;text-decoration:none">${ctaLabel}</a>
                  </p>`
                : ""
            }
          </td></tr>
          <tr><td style="padding:18px 32px;border-top:1px solid #1f2333;font-size:12px;color:#5e6680">
            TripOS · group travel workspace · ${new Date().getFullYear()}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tripos.app";

// ─── 1. waitlist confirmation ─────────────────────────────────────────
export async function sendWaitlistConfirmationEmail(args: { to: string; name?: string | null }) {
  const greeting = args.name ? `Hey ${args.name},` : "Hey there,";
  return send({
    to: args.to,
    subject: "You're on the TripOS waitlist",
    html: shell(
      "You're on the TripOS waitlist 🎉",
      `<p>${greeting}</p>
       <p>You're now in the queue. We're onboarding small batches every week — we'll text you when your group's slot opens.</p>
       <p><strong style="color:#fff">Founding-member perk:</strong> first Pro Trip is on us.</p>`,
      `${APP_URL}`,
      "Visit TripOS"
    ),
  });
}

// ─── 2. partner lead confirmation ─────────────────────────────────────
export async function sendPartnerLeadConfirmationEmail(args: { to: string; business_name: string }) {
  return send({
    to: args.to,
    subject: "Thanks for your interest in partnering with TripOS",
    html: shell(
      `Welcome, ${args.business_name} 👋`,
      `<p>We received your partner application. Our team will review it and reach out within 48 hours to onboard you.</p>
       <p>Meanwhile, prepare a short note about your group capacity, package highlights, and any photos you'd like featured.</p>`,
      `${APP_URL}/partners`,
      "Read partner FAQ"
    ),
  });
}

// ─── 3. trip invite ───────────────────────────────────────────────────
export async function sendTripInviteEmail(args: {
  to: string;
  trip_title: string;
  inviter_name: string;
  trip_id: string;
}) {
  return send({
    to: args.to,
    subject: "You've been invited to plan a trip on TripOS",
    html: shell(
      `${args.inviter_name} invited you to ${args.trip_title}`,
      `<p>Join the trip workspace — vote on hotels, split expenses, and turn the trip into a beautiful storybook after.</p>`,
      `${APP_URL}/login?next=/app/trips/${args.trip_id}`,
      "Accept invite"
    ),
  });
}

// ─── 4. settlement report ─────────────────────────────────────────────
export async function sendSettlementReportEmail(args: {
  to: string | string[];
  trip_title: string;
  summary_text: string;
  trip_id: string;
}) {
  return send({
    to: args.to,
    subject: `Your trip settlement report is ready · ${args.trip_title}`,
    html: shell(
      `${args.trip_title} · final settlement`,
      `<pre style="background:#0a0c14;border:1px solid #1f2333;border-radius:12px;padding:16px;color:#e9ecf3;font-size:13px;white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas,monospace">${escapeHtml(args.summary_text)}</pre>
       <p>Tap below to view the full ledger and Trip Capsule.</p>`,
      `${APP_URL}/app/trips/${args.trip_id}/settle`,
      "View settlement"
    ),
  });
}

// ─── 5. payment confirmation ──────────────────────────────────────────
export async function sendPaymentConfirmationEmail(args: {
  to: string;
  amount: number;
  purpose: string;
  trip_id?: string | null;
}) {
  const cta =
    args.purpose === "capsule_unlock" && args.trip_id
      ? { href: `${APP_URL}/app/trips/${args.trip_id}/capsule`, label: "Open your Trip Capsule" }
      : { href: `${APP_URL}/app/trips`, label: "Back to your trips" };
  return send({
    to: args.to,
    subject: "TripOS payment successful",
    html: shell(
      "Payment received · ₹" + args.amount,
      `<p>Thanks for upgrading. Your ${prettyPurpose(args.purpose)} is now active.</p>
       <p>Receipt: this email is your record.</p>`,
      cta.href,
      cta.label
    ),
  });
}

function prettyPurpose(p: string) {
  switch (p) {
    case "trip_pro_unlock":
      return "Pro Trip features";
    case "capsule_unlock":
      return "Trip Capsule unlock";
    case "organizer_subscription":
      return "Organizer subscription";
    default:
      return p;
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]!);
}
