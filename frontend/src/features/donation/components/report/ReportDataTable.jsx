/** Renders an accessible table containing the values displayed in a report chart. */
export function ReportDataTable({
  id,
  title,
  rows,
  valueLabel,
  valueFormatter,
  dataKey,
}) {
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
