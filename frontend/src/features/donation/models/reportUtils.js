export const REPORT_PERIODS = new Set(["all", "month", "last30", "custom"]);

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Formats large chart-axis values using compact notation. */
export function formatCompactNumber(value) {
  return compactNumberFormatter.format(Number(value) || 0);
}

/** Converts a Date into the local YYYY-MM-DD value expected by date inputs. */
function formatCalendarDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Builds API date filters for one of the supported preset report periods. */
export function buildPresetRange(period) {
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
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    start.setDate(start.getDate() - 29);
    return {
      periodStart: formatCalendarDate(start),
      periodEnd: formatCalendarDate(today),
    };
  }

  return {};
}

/** Resolves an API grouping value to its readable chart label. */
export function displayLabel(label, labelMap) {
  return labelMap[label] ?? label ?? "Unknown";
}
