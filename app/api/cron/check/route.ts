import { NextRequest, NextResponse } from "next/server";
import { listCertificates, markAlertSent, statusFor } from "@/lib/db";
import { sendExpiryAlert } from "@/lib/email";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // pas de secret configuré → pas de vérification (dev / usage simple)
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const certs = await listCertificates();
  const results: Array<{ id: number; name: string; daysLeft: number; sent: boolean }> = [];

  for (const cert of certs) {
    const { status, daysLeft } = statusFor(cert);
    if (status === "valid") continue;

    // Évite de renvoyer une alerte plus d'une fois par 24h pour le même certificat.
    const lastSent = cert.last_alert_sent_at ? new Date(cert.last_alert_sent_at) : null;
    const sentRecently = lastSent && Date.now() - lastSent.getTime() < 23 * 60 * 60 * 1000;
    if (sentRecently) continue;

    const outcome = await sendExpiryAlert(cert, daysLeft, process.env.ALERT_FALLBACK_EMAIL);
    if (outcome.sent) await markAlertSent(cert.id);
    results.push({ id: cert.id, name: cert.name, daysLeft, sent: outcome.sent });
  }

  return NextResponse.json({ checked: certs.length, alerted: results.length, results });
}
