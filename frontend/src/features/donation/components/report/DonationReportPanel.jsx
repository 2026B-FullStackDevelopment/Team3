import { useId, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, HandCoins, PackageOpen } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useDonationReport } from "@/features/donation/hooks/useDonationData.js";
import { CATEGORY_LABELS, UNIT_LABELS } from "@/lib/donation.js";
import { formatDateTime, formatVnd } from "@/lib/formatters.js";
import { StatusAlert } from "@/shared/components/status-alert.jsx";

const REPORT_PERIODS = new Set(["all", "month", "last30", "custom"]);
const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatCompactNumber(value) {
  return compactNumberFormatter.format(Number(value) || 0);
}

function formatCalendarDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildPresetRange(period) {
  const today = new Date();

  if (period === "month") {
    return {
      periodStart: formatCalendarDate(
        new Date(today.getFullYear(), today.getMonth(), 1),
      ),
      periodEnd: formatCalendarDate(today),
    };
  }

  if (period === "last30") {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    start.setDate(start.getDate() - 29);
    return {
      periodStart: formatCalendarDate(start),
      periodEnd: formatCalendarDate(today),
    };
  }

  return {};
}

function displayLabel(label, labelMap) {
  return labelMap[label] ?? label ?? "Unknown";
}

function StatisticCard({ icon, label, value }) {
  return (
    <div className="report-metric-card">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ReportDataTable({ id, title, rows, valueLabel, valueFormatter, dataKey }) {
  return (
    <div className="report-table-wrap" id={id}>
      <table className="report-data-table">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Group</th>
            <th scope="col">{valueLabel}</th>
            <th scope="col">Collections</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.displayLabel}</th>
              <td>{valueFormatter(row[dataKey])}</td>
              <td>{row.donationCount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportBarChart({
  title,
  description,
  entries,
  dataKey,
  valueLabel,
  valueFormatter,
  axisFormatter = formatCompactNumber,
  labelMap,
  color,
}) {
  const [showTable, setShowTable] = useState(false);
  const titleId = useId();
  const tableId = useId();
  const rows = useMemo(
    () =>
      entries
        .map((entry) => ({
          ...entry,
          displayLabel: displayLabel(entry.label, labelMap),
        }))
        .sort((left, right) => right[dataKey] - left[dataKey]),
    [dataKey, entries, labelMap],
  );
  const chartHeight = Math.max(280, rows.length * 46);

  return (
    <section className="report-chart-card" aria-labelledby={titleId}>
      <div className="report-chart-heading">
        <div>
          <h3 id={titleId}>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {rows.length > 0 && (
          <button
            aria-controls={tableId}
            aria-expanded={showTable}
            className="button-quiet report-table-toggle"
            onClick={() => setShowTable((visible) => !visible)}
            type="button"
          >
            {showTable ? "Hide data table" : "View data table"}
          </button>
        )}
      </div>
      {rows.length > 0 ? (
        <div className="report-chart" role="img" aria-label={title}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 8, right: 28, bottom: 8, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={axisFormatter} />
              <YAxis
                dataKey="displayLabel"
                type="category"
                width={105}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [valueFormatter(value), valueLabel]}
                labelFormatter={(label) => String(label)}
              />
              <Bar
                dataKey={dataKey}
                fill={color}
                isAnimationActive={false}
                name={valueLabel}
                radius={[0, 5, 5, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="muted-text">No breakdown data available.</p>
      )}
      {showTable && (
        <ReportDataTable
          dataKey={dataKey}
          id={tableId}
          rows={rows}
          title={`${title} data`}
          valueFormatter={valueFormatter}
          valueLabel={valueLabel}
        />
      )}
    </section>
  );
}

function ReportPeriodControls({
  period,
  appliedStart,
  appliedEnd,
  onPeriodChange,
  onApplyCustom,
}) {
  const [customStart, setCustomStart] = useState(appliedStart);
  const [customEnd, setCustomEnd] = useState(appliedEnd);
  const customIsValid = Boolean(
    customStart && customEnd && customStart <= customEnd,
  );

  return (
    <div className="report-period-controls">
      <label>
        <span>Period</span>
        <select
          aria-label="Report period"
          value={period}
          onChange={(event) => onPeriodChange(event.target.value)}
        >
          <option value="all">All time</option>
          <option value="month">This month</option>
          <option value="last30">Last 30 days</option>
          <option value="custom">Custom range</option>
        </select>
      </label>
      {period === "custom" && (
        <div className="report-custom-range">
          <label>
            <span>From</span>
            <input
              type="date"
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
            />
          </label>
          <label>
            <span>To</span>
            <input
              type="date"
              value={customEnd}
              onChange={(event) => setCustomEnd(event.target.value)}
            />
          </label>
          <button
            className="button-primary"
            disabled={!customIsValid}
            onClick={() => onApplyCustom(customStart, customEnd)}
            type="button"
          >
            Apply
          </button>
          {!customIsValid && (customStart || customEnd) && (
            <p className="report-filter-error" role="alert">
              Choose both dates and make sure the start is not after the end.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function DonationReportPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPeriod = searchParams.get("reportPeriod") ?? "all";
  const period = REPORT_PERIODS.has(requestedPeriod)
    ? requestedPeriod
    : "all";
  const appliedStart = searchParams.get("reportFrom") ?? "";
  const appliedEnd = searchParams.get("reportTo") ?? "";

  const appliedCustomIsValid = Boolean(
    appliedStart && appliedEnd && appliedStart <= appliedEnd,
  );
  const filters = useMemo(() => {
    if (period === "custom") {
      return appliedCustomIsValid
        ? { periodStart: appliedStart, periodEnd: appliedEnd }
        : {
            periodStart: appliedStart || null,
            periodEnd: appliedEnd || null,
          };
    }
    return buildPresetRange(period);
  }, [appliedCustomIsValid, appliedEnd, appliedStart, period]);
  const report = useDonationReport(filters, {
    enabled: period !== "custom" || appliedCustomIsValid,
  });

  function updateReportParams(nextPeriod, start = "", end = "") {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("reportPeriod", nextPeriod);
        if (nextPeriod === "custom" && start && end) {
          next.set("reportFrom", start);
          next.set("reportTo", end);
        } else {
          next.delete("reportFrom");
          next.delete("reportTo");
        }
        return next;
      },
      { replace: true },
    );
  }

  function handlePeriodChange(nextPeriod) {
    if (nextPeriod === "custom") {
      updateReportParams(nextPeriod, appliedStart, appliedEnd);
      return;
    }
    updateReportParams(nextPeriod);
  }

  function applyCustomRange(start, end) {
    if (!start || !end || start > end) return;
    updateReportParams("custom", start, end);
  }

  const isEmpty = Boolean(
    report.data &&
      report.data.donationCount === 0 &&
      report.data.totalRevenue === 0 &&
      report.data.byCategory.length === 0 &&
      report.data.byMeasurementUnit.length === 0,
  );

  return (
    <aside className="report-panel">
      <div className="report-heading">
        <div>
          <p className="donation-eyebrow">Live overview</p>
          <h2>Statistical Reports</h2>
        </div>
        <ReportPeriodControls
          appliedEnd={appliedEnd}
          appliedStart={appliedStart}
          key={`${period}:${appliedStart}:${appliedEnd}`}
          onApplyCustom={applyCustomRange}
          onPeriodChange={handlePeriodChange}
          period={period}
        />
      </div>

      {period === "custom" && !appliedCustomIsValid && !report.data && (
        <p className="report-filter-hint">Choose a valid date range to load statistics.</p>
      )}

      {report.isLoading && (
        <div className="report-loading" aria-label="Loading statistics">
          <div className="report-metric-skeleton" />
          <div className="report-metric-skeleton" />
          <div className="report-metric-skeleton" />
          <div className="report-chart-skeleton" />
        </div>
      )}

      {report.isError && (
        <StatusAlert
          variant="danger"
          title="Unable to load statistics"
          action={<button onClick={() => report.refetch()}>Retry</button>}
        >
          Listings remain available while reports recover.
        </StatusAlert>
      )}

      {report.data && (
        <>
          <div className="report-metrics">
            <StatisticCard
              icon={<CalendarDays aria-hidden="true" />}
              label="Collected Donations"
              value={report.data.donationCount.toLocaleString()}
            />
            <StatisticCard
              icon={<PackageOpen aria-hidden="true" />}
              label="Total Quantity (mixed units)"
              value={report.data.totalDonatedQuantity.toLocaleString()}
            />
            <StatisticCard
              icon={<HandCoins aria-hidden="true" />}
              label="Total Revenue"
              value={formatVnd(report.data.totalRevenue)}
            />
          </div>

          {isEmpty ? (
            <div className="donation-empty">
              <h3>No statistical data yet</h3>
              <p>Charts appear after donations are collected.</p>
            </div>
          ) : (
            <div className="report-chart-grid">
              <ReportBarChart
                color="#6f8f3d"
                dataKey="donatedQuantity"
                description="Quantities may combine different measurement units."
                entries={report.data.byCategory}
                labelMap={CATEGORY_LABELS}
                title="Quantity by Food Category"
                valueFormatter={(value) => Number(value).toLocaleString()}
                valueLabel="Donated quantity"
              />
              <ReportBarChart
                color="#b7802e"
                dataKey="revenue"
                entries={report.data.byCategory}
                labelMap={CATEGORY_LABELS}
                title="Revenue by Food Category"
                valueFormatter={formatVnd}
                valueLabel="Revenue"
              />
              <ReportBarChart
                color="#4f7d5a"
                dataKey="donatedQuantity"
                entries={report.data.byMeasurementUnit}
                labelMap={UNIT_LABELS}
                title="Quantity by Measurement Unit"
                valueFormatter={(value) => Number(value).toLocaleString()}
                valueLabel="Donated quantity"
              />
              <ReportBarChart
                color="#9b5f45"
                dataKey="revenue"
                entries={report.data.byMeasurementUnit}
                labelMap={UNIT_LABELS}
                title="Revenue by Measurement Unit"
                valueFormatter={formatVnd}
                valueLabel="Revenue"
              />
            </div>
          )}

          <div className="report-footer">
            <span>Updated {formatDateTime(report.data.generatedAt)}</span>
            <span>Revenue trends require a future time-series API.</span>
          </div>
        </>
      )}
    </aside>
  );
}
