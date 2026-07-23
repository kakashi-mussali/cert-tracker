import { Resend } from "resend";
import type { Certificate } from "./db";

export function emailIsConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.ALERT_FROM_EMAIL);
}

export async function sendExpiryAlert(
  cert: Certificate,
  daysLeft: number,
  fallbackRecipient?: string
) {
  if (!emailIsConfigured()) {
    console.log(
      `[alerte email désactivée] ${cert.name} (${cert.application}) expire dans ${daysLeft} jour(s)`
    );
    return { sent: false, reason: "email-not-configured" as const };
  }

  const to = cert.notify_email || fallbackRecipient;
  if (!to) {
    return { sent: false, reason: "no-recipient" as const };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const subject =
    daysLeft < 0
      ? `[Expiré] Le certificat "${cert.name}" a expiré`
      : `[Alerte] Le certificat "${cert.name}" expire dans ${daysLeft} jour(s)`;

  const body = `
    <div style="font-family: sans-serif; font-size: 14px; color: #12161C;">
      <h2 style="margin-bottom: 4px;">${subject}</h2>
      <table cellpadding="6" style="border-collapse: collapse; margin-top: 12px;">
        <tr><td><strong>Application</strong></td><td>${cert.application}</td></tr>
        <tr><td><strong>Environnement</strong></td><td>${cert.environment ?? "—"}</td></tr>
        <tr><td><strong>Émetteur</strong></td><td>${cert.issuer ?? "—"}</td></tr>
        <tr><td><strong>Date d'expiration</strong></td><td>${cert.expires_at}</td></tr>
        <tr><td><strong>Jours restants</strong></td><td>${daysLeft}</td></tr>
      </table>
      <p style="margin-top: 16px; color: #6B7280;">
        Seuil d'alerte configuré : ${cert.alert_days_before} jour(s) avant expiration.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: process.env.ALERT_FROM_EMAIL!,
    to,
    subject,
    html: body,
  });

  return { sent: true as const };
}
