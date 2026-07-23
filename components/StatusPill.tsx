import type { Status } from "@/lib/db";

const CONFIG: Record<Status, { label: string; text: string; bg: string; dot: string }> = {
  valid: { label: "Valide", text: "text-ok", bg: "bg-okBg", dot: "bg-ok" },
  warning: { label: "À surveiller", text: "text-warn", bg: "bg-warnBg", dot: "bg-warn" },
  critical: { label: "Urgent", text: "text-crit", bg: "bg-critBg", dot: "bg-crit" },
  expired: { label: "Expiré", text: "text-white", bg: "bg-crit", dot: "bg-white" },
};

export default function StatusPill({ status }: { status: Status }) {
  const c = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
