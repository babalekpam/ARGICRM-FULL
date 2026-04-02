import nodemailer from "nodemailer";

const FROM = "ARGILETTE CRM <info@argilette.com>";

// ─── Per-Tenant SMTP sending ──────────────────────────────────────────────────
export interface TenantSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  senderName: string;
  senderEmail: string;
}

export async function testTenantSmtp(cfg: TenantSmtpConfig): Promise<void> {
  const t = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
  });
  await t.verify();
  t.close();
}

export async function sendWithTenantSmtp(
  cfg: TenantSmtpConfig,
  to: string | string[],
  subject: string,
  html: string,
): Promise<void> {
  const t = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  const from = `${cfg.senderName} <${cfg.senderEmail}>`;
  await t.sendMail({ from, to, subject, html });
  t.close();
}

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: "info@argilette.com",
    pass: process.env.SMTP_PASSWORD,
  },
});

async function send(to: string, subject: string, html: string) {
  if (!process.env.SMTP_PASSWORD) {
    console.warn("[EMAIL] SMTP_PASSWORD not set — email not sent to", to);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[EMAIL] Sent "${subject}" → ${to}`);
  } catch (err: any) {
    console.error(`[EMAIL] Failed to send "${subject}" → ${to}:`, err.message);
  }
}

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0}
  .wrapper{max-width:580px;margin:40px auto;padding:0 16px}
  .card{background:#1a1a2e;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden}
  .header{background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 36px;text-align:center}
  .logo{font-size:22px;font-weight:800;color:#fff;letter-spacing:0.05em}
  .logo span{opacity:0.7;font-weight:400;font-size:13px;display:block;margin-top:4px}
  .body{padding:32px 36px}
  h2{margin:0 0 12px;font-size:20px;font-weight:700;color:#fff}
  p{margin:0 0 16px;font-size:14px;line-height:1.7;color:#94a3b8}
  .btn{display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;margin:8px 0}
  .code{background:#0f0f1a;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px 20px;font-family:monospace;font-size:22px;font-weight:700;letter-spacing:0.2em;color:#a78bfa;text-align:center;margin:16px 0}
  .info-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px}
  .info-label{color:#64748b}
  .info-value{color:#e2e8f0;font-weight:500}
  .footer{padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:#475569;text-align:center;line-height:1.6}
  .warning{background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:12px 16px;font-size:13px;color:#fbbf24;margin:16px 0}
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="logo">ARGILETTE<span>Customer Relationship Management</span></div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Argilette. All rights reserved.<br/>
      For support, reply to this email or contact <a href="mailto:info@argilette.com" style="color:#6366f1">info@argilette.com</a>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─── Welcome / Signup Confirmation ────────────────────────────────────────────
export async function sendWelcomeEmail(opts: {
  to: string;
  firstName: string;
  workspaceName: string;
  workspaceDomain: string;
  plan: string;
  trialEndsAt?: Date;
}) {
  const { to, firstName, workspaceName, workspaceDomain, plan, trialEndsAt } = opts;
  const trialNote = trialEndsAt
    ? `<div class="warning">Your 14-day free trial runs until <strong>${trialEndsAt.toLocaleDateString("en-US", { dateStyle: "long" })}</strong>. Upgrade anytime to keep full access.</div>`
    : "";

  const html = base(`
    <h2>Welcome to Argilette, ${firstName}!</h2>
    <p>Your workspace is ready. Here's a summary of your account:</p>
    <div style="margin:16px 0">
      <div class="info-row"><span class="info-label">Workspace</span><span class="info-value">${workspaceName}</span></div>
      <div class="info-row"><span class="info-label">Domain</span><span class="info-value">${workspaceDomain}</span></div>
      <div class="info-row"><span class="info-label">Plan</span><span class="info-value">${plan.charAt(0).toUpperCase() + plan.slice(1)}</span></div>
      <div class="info-row" style="border:none"><span class="info-label">Email</span><span class="info-value">${to}</span></div>
    </div>
    ${trialNote}
    <p>You can start adding contacts, managing deals, and tracking your pipeline right away.</p>
    <a href="https://www.argilette.org" class="btn">Go to my workspace</a>
    <p style="margin-top:24px">If you have any questions, our team is here to help. Just reply to this email.</p>
  `);

  await send(to, "Welcome to Argilette — Your workspace is ready!", html);
}

// ─── Team Member Invite ────────────────────────────────────────────────────────
export async function sendTeamInviteEmail(opts: {
  to: string;
  firstName: string;
  invitedBy: string;
  workspaceName: string;
  role: string;
  tempPassword: string;
}) {
  const { to, firstName, invitedBy, workspaceName, role, tempPassword } = opts;

  const html = base(`
    <h2>You've been invited to ${workspaceName}</h2>
    <p>Hi ${firstName || "there"}, <strong>${invitedBy}</strong> has invited you to join <strong>${workspaceName}</strong> on Argilette as a <strong>${role}</strong>.</p>
    <p>Use the credentials below to log in for the first time:</p>
    <div style="margin:16px 0">
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${to}</span></div>
      <div class="info-row" style="border:none"><span class="info-label">Role</span><span class="info-value">${role.charAt(0).toUpperCase() + role.slice(1)}</span></div>
    </div>
    <p style="font-size:13px;color:#64748b;margin-bottom:4px">Temporary password:</p>
    <div class="code">${tempPassword}</div>
    <div class="warning">For your security, please change this password immediately after your first login.</div>
    <a href="https://www.argilette.org" class="btn">Accept Invitation & Log In</a>
  `);

  await send(to, `You're invited to join ${workspaceName} on Argilette`, html);
}

// ─── Password Change Confirmation ─────────────────────────────────────────────
export async function sendPasswordChangedEmail(opts: {
  to: string;
  firstName: string;
}) {
  const { to, firstName } = opts;
  const now = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

  const html = base(`
    <h2>Your password was changed</h2>
    <p>Hi ${firstName || "there"}, this is a confirmation that your Argilette account password was successfully changed.</p>
    <div style="margin:16px 0">
      <div class="info-row"><span class="info-label">Account</span><span class="info-value">${to}</span></div>
      <div class="info-row" style="border:none"><span class="info-label">Changed at</span><span class="info-value">${now}</span></div>
    </div>
    <div class="warning">If you did not make this change, please contact us immediately at <a href="mailto:info@argilette.com" style="color:#fbbf24">info@argilette.com</a> or reply to this email.</div>
  `);

  await send(to, "Your Argilette password was changed", html);
}

// ─── Payment / Subscription Confirmation ─────────────────────────────────────
export async function sendPaymentConfirmationEmail(opts: {
  to: string;
  firstName: string;
  plan: string;
  amount: number;
  currency?: string;
  invoiceId?: string;
  nextBillingDate?: Date;
}) {
  const { to, firstName, plan, amount, currency = "USD", invoiceId, nextBillingDate } = opts;
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency });

  const html = base(`
    <h2>Payment confirmed</h2>
    <p>Hi ${firstName || "there"}, thank you for your payment. Your Argilette subscription is now active.</p>
    <div style="margin:16px 0">
      <div class="info-row"><span class="info-label">Plan</span><span class="info-value">${plan.charAt(0).toUpperCase() + plan.slice(1)}</span></div>
      <div class="info-row"><span class="info-label">Amount</span><span class="info-value">${fmt.format(amount)}</span></div>
      ${invoiceId ? `<div class="info-row"><span class="info-label">Invoice ID</span><span class="info-value" style="font-family:monospace">${invoiceId}</span></div>` : ""}
      ${nextBillingDate ? `<div class="info-row" style="border:none"><span class="info-label">Next billing</span><span class="info-value">${nextBillingDate.toLocaleDateString("en-US", { dateStyle: "long" })}</span></div>` : ""}
    </div>
    <p>If you have any questions about this charge, please reply to this email or contact us at <a href="mailto:info@argilette.com" style="color:#6366f1">info@argilette.com</a>.</p>
  `);

  await send(to, `Payment confirmed — Argilette ${plan} plan`, html);
}

// ─── Support Request Acknowledgement ─────────────────────────────────────────
export async function sendSupportAcknowledgementEmail(opts: {
  to: string;
  firstName: string;
  ticketId: string;
  subject: string;
  message: string;
}) {
  const { to, firstName, ticketId, subject, message } = opts;

  const html = base(`
    <h2>We received your message</h2>
    <p>Hi ${firstName || "there"}, thank you for reaching out. Our team will get back to you within 24 hours.</p>
    <div style="margin:16px 0">
      <div class="info-row"><span class="info-label">Ticket ID</span><span class="info-value" style="font-family:monospace">${ticketId}</span></div>
      <div class="info-row" style="border:none"><span class="info-label">Subject</span><span class="info-value">${subject}</span></div>
    </div>
    <div style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin:16px 0;font-size:13px;color:#94a3b8;line-height:1.7">
      ${message.replace(/\n/g, "<br/>")}
    </div>
    <p>You can reply directly to this email to add more information to your request.</p>
  `);

  await send(to, `Support request received — Ticket #${ticketId}`, html);
}

// ─── Password Reset (OTP) ─────────────────────────────────────────────────────
export async function sendPasswordResetEmail(opts: {
  to: string;
  firstName: string;
  otp: string;
  expiresInMinutes?: number;
}) {
  const { to, firstName, otp, expiresInMinutes = 15 } = opts;

  const html = base(`
    <h2>Reset your password</h2>
    <p>Hi ${firstName || "there"}, we received a request to reset the password for your Argilette account.</p>
    <p style="font-size:13px;color:#64748b;margin-bottom:4px">Use this code to reset your password:</p>
    <div class="code">${otp}</div>
    <p>This code expires in <strong>${expiresInMinutes} minutes</strong>.</p>
    <div class="warning">If you did not request a password reset, please ignore this email. Your account remains secure.</div>
  `);

  await send(to, "Reset your Argilette password", html);
}
