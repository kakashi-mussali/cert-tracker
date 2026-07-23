"use client";

import { useEffect, useMemo, useState } from "react";
import type { Certificate, Status } from "@/lib/db";
import StatusPill from "@/components/StatusPill";
import ExpiryBar from "@/components/ExpiryBar";
import CertificateForm from "@/components/CertificateForm";

const BAR_HORIZON_DAYS = 180;

function daysUntil(dateIso: string): number {
  const target = new Date(dateIso.slice(0, 10) + "T00:00:00Z").getTime();
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - todayUtc) / 86_400_000);
}

function statusFor(cert: Certificate): { status: Status; daysLeft: number } {
  const daysLeft = daysUntil(cert.expires_at);
  if (daysLeft < 0) return { status: "expired", daysLeft };
  if (daysLeft <= Math.min(7, cert.alert_days_before)) return { status: "critical", daysLeft };
  if (daysLeft <= cert.alert_days_before) return { status: "warning", daysLeft };
  return { status: "valid", daysLeft };
}

type Filter = "all" | Status;

export default function DashboardPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/certificates", { cache: "no-store" });
      if (!res.ok) throw new Error("Impossible de charger les certificats");
      const data = await res.json();
      setCerts(data.certificates);
    } catch (err: any) {
      setError(err.message ?? "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const withStatus = useMemo(
    () => certs.map((c) => ({ cert: c, ...statusFor(c) })),
    [certs]
  );

  const counts = useMemo(() => {
    const base: Record<Status, number> = { valid: 0, warning: 0, critical: 0, expired: 0 };
    withStatus.forEach(({ status }) => base[status]++);
    return base;
  }, [withStatus]);

  const filtered = useMemo(
    () => (filter === "all" ? withStatus : withStatus.filter((w) => w.status === filter)),
    [withStatus, filter]
  );

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce certificat ?")) return;
    await fetch(`/api/certificates/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted">
            Suivi des certificats
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">
            Échéances des certificats applicatifs
          </h1>
          <p className="mt-1 text-sm text-muted">
            Une vue unique de tous les certificats, avec alerte automatique avant expiration.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="shrink-0 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primaryDark"
        >
          + Ajouter un certificat
        </button>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Expirés" value={counts.expired} tone="crit" onClick={() => setFilter("expired")} active={filter === "expired"} />
        <SummaryCard label="Urgents (≤ 7 j)" value={counts.critical} tone="crit-soft" onClick={() => setFilter("critical")} active={filter === "critical"} />
        <SummaryCard label="À surveiller" value={counts.warning} tone="warn" onClick={() => setFilter("warning")} active={filter === "warning"} />
        <SummaryCard label="Valides" value={counts.valid} tone="ok" onClick={() => setFilter("valid")} active={filter === "valid"} />
      </section>

      <div className="mb-4 flex items-center gap-2">
        <FilterChip label="Tous" active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterChip label="Expirés" active={filter === "expired"} onClick={() => setFilter("expired")} />
        <FilterChip label="Urgents" active={filter === "critical"} onClick={() => setFilter("critical")} />
        <FilterChip label="À surveiller" active={filter === "warning"} onClick={() => setFilter("warning")} />
        <FilterChip label="Valides" active={filter === "valid"} onClick={() => setFilter("valid")} />
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-panel">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted">Chargement…</div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-crit">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">
            Aucun certificat dans cette catégorie. Ajoutez-en un pour commencer le suivi.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-idleBg/40 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Certificat</th>
                <th className="px-5 py-3 font-medium">Application</th>
                <th className="px-5 py-3 font-medium">Expiration</th>
                <th className="px-5 py-3 font-medium">Échéance</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ cert, status, daysLeft }) => (
                <tr key={cert.id} className="border-b border-line last:border-0 hover:bg-idleBg/30">
                  <td className="px-5 py-4">
                    <div className="font-medium text-ink">{cert.name}</div>
                    {cert.issuer && (
                      <div className="font-mono text-xs text-muted">{cert.issuer}</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div>{cert.application}</div>
                    {cert.environment && (
                      <div className="text-xs text-muted">{cert.environment}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">
                    {cert.expires_at.slice(0, 10)}
                  </td>
                  <td className="px-5 py-4">
                    <ExpiryBar daysLeft={daysLeft} status={status} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => {
                        setEditing(cert);
                        setFormOpen(true);
                      }}
                      className="mr-3 text-xs font-medium text-primary hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(cert.id)}
                      className="text-xs font-medium text-crit hover:underline"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CertificateForm
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />
    </main>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone: "crit" | "crit-soft" | "warn" | "ok";
  active: boolean;
  onClick: () => void;
}) {
  const toneClasses: Record<typeof tone, string> = {
    crit: "text-crit",
    "crit-soft": "text-crit",
    warn: "text-warn",
    ok: "text-ok",
  } as const;

  return (
    <button
      onClick={onClick}
      className={`rounded-card border px-4 py-3 text-left transition ${
        active ? "border-primary ring-1 ring-primary" : "border-line hover:border-muted"
      } bg-panel`}
    >
      <div className={`font-mono text-2xl font-semibold ${toneClasses[tone]}`}>{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </button>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-ink text-white" : "bg-idleBg text-muted hover:bg-idleBg/70"
      }`}
    >
      {label}
    </button>
  );
}
