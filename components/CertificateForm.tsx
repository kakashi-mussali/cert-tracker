"use client";

import { useEffect, useState } from "react";
import type { Certificate } from "@/lib/db";

export type CertFormValues = {
  name: string;
  application: string;
  environment: string;
  issuer: string;
  expires_at: string;
  alert_days_before: number;
  notify_email: string;
  notes: string;
};

const EMPTY: CertFormValues = {
  name: "",
  application: "",
  environment: "",
  issuer: "",
  expires_at: "",
  alert_days_before: 30,
  notify_email: "",
  notes: "",
};

export default function CertificateForm({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Certificate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<CertFormValues>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setValues({
        name: editing.name,
        application: editing.application,
        environment: editing.environment ?? "",
        issuer: editing.issuer ?? "",
        expires_at: editing.expires_at.slice(0, 10),
        alert_days_before: editing.alert_days_before,
        notify_email: editing.notify_email ?? "",
        notes: editing.notes ?? "",
      });
    } else {
      setValues(EMPTY);
    }
    setError(null);
  }, [editing, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = editing ? `/api/certificates/${editing.id}` : "/api/certificates";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Échec de l'enregistrement");
      }
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "Erreur inattendue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative z-10 h-full w-full max-w-md overflow-y-auto bg-panel shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-base font-semibold">
            {editing ? "Modifier le certificat" : "Ajouter un certificat"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md p-1 text-muted hover:bg-idleBg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          <Field label="Nom du certificat" required>
            <input
              required
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              placeholder="ex. wildcard.mtech.fr"
              className="input"
            />
          </Field>

          <Field label="Application" required>
            <input
              required
              value={values.application}
              onChange={(e) => setValues({ ...values, application: e.target.value })}
              placeholder="ex. BioWeb4Visa"
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Environnement">
              <input
                value={values.environment}
                onChange={(e) => setValues({ ...values, environment: e.target.value })}
                placeholder="prod, staging…"
                className="input"
              />
            </Field>
            <Field label="Émetteur">
              <input
                value={values.issuer}
                onChange={(e) => setValues({ ...values, issuer: e.target.value })}
                placeholder="Let's Encrypt…"
                className="input"
              />
            </Field>
          </div>

          <Field label="Date d'expiration" required>
            <input
              required
              type="date"
              value={values.expires_at}
              onChange={(e) => setValues({ ...values, expires_at: e.target.value })}
              className="input"
            />
          </Field>

          <Field label="Alerter combien de jours avant expiration ?" required>
            <input
              required
              type="number"
              min={1}
              value={values.alert_days_before}
              onChange={(e) =>
                setValues({ ...values, alert_days_before: Number(e.target.value) })
              }
              className="input"
            />
          </Field>

          <Field label="Email de notification (optionnel)">
            <input
              type="email"
              value={values.notify_email}
              onChange={(e) => setValues({ ...values, notify_email: e.target.value })}
              placeholder="equipe-ops@mtech.fr"
              className="input"
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={values.notes}
              onChange={(e) => setValues({ ...values, notes: e.target.value })}
              rows={3}
              className="input resize-none"
            />
          </Field>

          {error && <p className="text-sm text-crit">{error}</p>}

          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primaryDark disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Ajouter le certificat"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-idleBg"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .input {
          border: 1px solid #e4e7ec;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 14px;
          background: white;
          width: 100%;
        }
        .input:focus {
          border-color: #3b4fd9;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">
        {label} {required && <span className="text-crit">*</span>}
      </span>
      {children}
    </label>
  );
}
