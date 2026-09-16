import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDonationReport } from "@/features/donation/hooks/donation.hooks.js";
import { ReportBarChart } from "@/features/donation/components/report/ReportBarChart.jsx";
import { ReportMetrics } from "@/features/donation/components/report/ReportMetrics.jsx";
import { ReportPeriodControls } from "@/features/donation/components/report/ReportPeriodControls.jsx";
import {
  buildPresetRange,
  REPORT_PERIODS,
} from "@/features/donation/models/reportUtils.js";
import { CATEGORY_LABELS, UNIT_LABELS } from "@/features/donation/models/donation.js";
import { formatDateTime, formatVnd } from "@/shared/utils/formatters.js";
import { StatusAlert } from "@/shared/components/status-alert.jsx";

/** Coordinates report URL filters, data loading, and report presentation. */
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

  /** Writes the selected report period and optional custom dates to the URL. */
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

  /** Changes between preset periods while preserving an existing custom draft. */
  function handlePeriodChange(nextPeriod) {
    if (nextPeriod === "custom") {
      updateReportParams(nextPeriod, appliedStart, appliedEnd);
      return;
    }
    updateReportParams(nextPeriod);
  }

  /** Applies a complete, ordered custom date range to the report URL. */
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
        <p className="report-filter-hint">
          Choose a valid date range to load statistics.
        </p>
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
          <ReportMetrics report={report.data} />

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
