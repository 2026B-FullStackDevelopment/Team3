import { useId, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ReportDataTable } from "@/features/donation/components/report/ReportDataTable.jsx";
import {
  displayLabel,
  formatCompactNumber,
} from "@/features/donation/components/report/reportUtils.js";

/** Renders a sorted horizontal report chart with an optional accessible table. */
export function ReportBarChart({
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
