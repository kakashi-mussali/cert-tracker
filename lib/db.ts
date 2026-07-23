import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// Initialisation volontairement paresseuse : si on appelait neon() au chargement
// du module et qu'aucune base n'est encore branchée, Next.js planterait au
// build (il importe les routes pour "collecter les données de page"), avant
// même qu'une requête ne soit exécutée.
let cachedSql: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (cachedSql) return cachedSql;
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error(
      "Aucune base de données connectée. Dans Vercel : Storage → Create Database → Postgres."
    );
  }
  cachedSql = neon(connectionString);
  return cachedSql;
}

// Proxy tagged-template : délègue à la vraie fonction sql, créée à la
// première utilisation réelle plutôt qu'à l'import du module.
const sql: NeonQueryFunction<false, false> = ((...args: Parameters<NeonQueryFunction<false, false>>) =>
  getSql()(...args)) as NeonQueryFunction<false, false>;

export type Certificate = {
  id: number;
  name: string;
  application: string;
  environment: string | null;
  issuer: string | null;
  expires_at: string; // ISO date
  alert_days_before: number;
  notify_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  last_alert_sent_at: string | null;
};

export type Status = "valid" | "warning" | "critical" | "expired";

let initialized = false;

/**
 * Crée la table si elle n'existe pas encore. Appelé au début de chaque
 * route API : aucune migration manuelle n'est nécessaire au déploiement.
 */
export async function ensureSchema() {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS certificates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      application TEXT NOT NULL,
      environment TEXT,
      issuer TEXT,
      expires_at DATE NOT NULL,
      alert_days_before INTEGER NOT NULL DEFAULT 30,
      notify_email TEXT,
      notes TEXT,
      last_alert_sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  initialized = true;
}

export function daysUntil(dateIso: string): number {
  const target = new Date(dateIso + "T00:00:00Z").getTime();
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - todayUtc) / 86_400_000);
}

export function statusFor(cert: Pick<Certificate, "expires_at" | "alert_days_before">): {
  status: Status;
  daysLeft: number;
} {
  const daysLeft = daysUntil(cert.expires_at);
  if (daysLeft < 0) return { status: "expired", daysLeft };
  if (daysLeft <= Math.min(7, cert.alert_days_before)) return { status: "critical", daysLeft };
  if (daysLeft <= cert.alert_days_before) return { status: "warning", daysLeft };
  return { status: "valid", daysLeft };
}

export async function listCertificates(): Promise<Certificate[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM certificates ORDER BY expires_at ASC;
  `) as Certificate[];
  return rows;
}

export async function getCertificate(id: number): Promise<Certificate | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM certificates WHERE id = ${id};`) as Certificate[];
  return rows[0] ?? null;
}

export type CertificateInput = {
  name: string;
  application: string;
  environment?: string | null;
  issuer?: string | null;
  expires_at: string;
  alert_days_before?: number;
  notify_email?: string | null;
  notes?: string | null;
};

export async function createCertificate(input: CertificateInput): Promise<Certificate> {
  await ensureSchema();
  const rows = (await sql`
    INSERT INTO certificates
      (name, application, environment, issuer, expires_at, alert_days_before, notify_email, notes)
    VALUES (
      ${input.name},
      ${input.application},
      ${input.environment ?? null},
      ${input.issuer ?? null},
      ${input.expires_at},
      ${input.alert_days_before ?? 30},
      ${input.notify_email ?? null},
      ${input.notes ?? null}
    )
    RETURNING *;
  `) as Certificate[];
  return rows[0];
}

export async function updateCertificate(
  id: number,
  input: CertificateInput
): Promise<Certificate | null> {
  await ensureSchema();
  const rows = (await sql`
    UPDATE certificates SET
      name = ${input.name},
      application = ${input.application},
      environment = ${input.environment ?? null},
      issuer = ${input.issuer ?? null},
      expires_at = ${input.expires_at},
      alert_days_before = ${input.alert_days_before ?? 30},
      notify_email = ${input.notify_email ?? null},
      notes = ${input.notes ?? null},
      updated_at = now()
    WHERE id = ${id}
    RETURNING *;
  `) as Certificate[];
  return rows[0] ?? null;
}

export async function deleteCertificate(id: number): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM certificates WHERE id = ${id};`;
}

export async function markAlertSent(id: number): Promise<void> {
  await sql`UPDATE certificates SET last_alert_sent_at = now() WHERE id = ${id};`;
}
