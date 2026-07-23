import type { Status } from "@/lib/db";

const BAR_HORIZON_DAYS = 180;

const BAR_COLOR: Record<Status, string> = {
  valid: "bg-ok",
  warning: "bg-warn",
  critical: "bg-crit",
  expired: "bg-crit",
};

export default function ExpiryBar({
  daysLeft,
  status,
}: {
  daysLeft: number;
  status: Status;
}) {
  const pct = Math.max(0, Math.min(100, (daysLeft / BAR_HORIZON_DAYS) * 100));
  const label =
    daysLeft < 0
      ? `Expiré depuis ${Math.abs(daysLeft)} j`
      : daysLeft === 0
      ? "Expire aujourd'hui"
      : `${daysLeft} j restants`;

  return (
    <div className="w-full min-w-[140px]">
      <div className="h-1.5 w-full rounded-full bg-idleBg overflow-hidden">
        <div
          className={`h-full rounded-full ${BAR_COLOR[status]} transition-all`}
          style={{ width: `${status === "expired" ? 100 : pct}%` }}
        />
      </div>
      <div className="mt-1 font-mono text-[11px] text-muted">{label}</div>
    </div>
  );
}
