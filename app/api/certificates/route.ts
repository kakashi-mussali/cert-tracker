import { NextRequest, NextResponse } from "next/server";
import { createCertificate, listCertificates } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const certs = await listCertificates();
    return NextResponse.json({ certificates: certs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.application || !body.expires_at) {
      return NextResponse.json(
        { error: "Les champs 'name', 'application' et 'expires_at' sont obligatoires." },
        { status: 400 }
      );
    }

    const cert = await createCertificate({
      name: body.name,
      application: body.application,
      environment: body.environment ?? null,
      issuer: body.issuer ?? null,
      expires_at: body.expires_at,
      alert_days_before: body.alert_days_before ?? 30,
      notify_email: body.notify_email ?? null,
      notes: body.notes ?? null,
    });

    return NextResponse.json({ certificate: cert }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erreur serveur" }, { status: 500 });
  }
}
