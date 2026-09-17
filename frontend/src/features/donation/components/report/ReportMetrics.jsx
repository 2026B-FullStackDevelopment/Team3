import { CalendarDays, HandCoins, PackageOpen } from "lucide-react";
import { formatVnd } from "@/shared/utils/formatters.js";

/** Displays one headline value in the report summary. */
function StatisticCard({ icon, label, value }) {
  return (
    <div className="report-metric-card">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/** Displays the headline donation statistics returned by the report API. */
export function ReportMetrics({ report }) {
  return (
    <div className="report-metrics">
      <StatisticCard
        icon={<CalendarDays aria-hidden="true" />}
        label="Collected Donations"
        value={report.donationCount.toLocaleString()}
      />
      <StatisticCard
        icon={<PackageOpen aria-hidden="true" />}
        label="Total Quantity (mixed units)"
        value={report.totalDonatedQuantity.toLocaleString()}
      />
      <StatisticCard
        icon={<HandCoins aria-hidden="true" />}
        label="Total Revenue"
        value={formatVnd(report.totalRevenue)}
      />
    </div>
  );
}
