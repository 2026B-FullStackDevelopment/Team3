import { useState } from "react";

/** Controls preset report periods and validates a custom date range. */
export function ReportPeriodControls({
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
