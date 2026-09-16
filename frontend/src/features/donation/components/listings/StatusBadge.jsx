import { STATUS_LABELS } from "@/features/donation/models/donation.js";

export function StatusBadge({ status }) {
  return (
    <span className={`donation-status status-${status}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
