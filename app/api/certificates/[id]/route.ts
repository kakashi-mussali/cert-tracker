import { NextRequest, NextResponse } from "next/server";
import { deleteCertificate, getCertificate, updateCertificate } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const cert = await getCertificate(Number(params.id));
  if (!cert) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ certificate: cert });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const cert = await updateCertificate(Number(params.id), {
      name: body.name,
      application: body.application,
      environment: body.environment ?? null,
      issuer: body.issuer ?? null,
      expires_at: body.expires_at,
      alert_days_before: body.alert_days_before ?? 30,
      notify_email: body.notify_email ?? null,
      notes: body.notes ?? null,
    });
    if (!cert) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({ certificate: cert });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await deleteCertificate(Number(params.id));
  return NextResponse.json({ ok: true });
}
