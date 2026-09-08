# Prompt 04: Dashboard Statistics

## Role and objective

You own the statistical-report panel on the donor dashboard. Implement the live dashboard report query, summary metrics, category and measurement-unit breakdowns, period controls, charts, loading, empty, retry, and independent failure states represented in Canva slides 15, 17, and 18.

Do not change listing retrieval or backend reporting code. The listing dashboard must remain usable when reports fail.

## Prerequisites

- Prompts 01 and 02 are merged.
- Prompt 03 has defined or documented the dashboard statistics slot.
- Read the prompt-pack README, especially the report-route authentication and missing-data limitations.
- Reuse the shared API client, query-key factory, formatters, AFF tokens, and Rare UI Animated Counter.

## Permitted scope

- Dashboard report query, period URL state, statistic cards, charts/tables, preview-only report visuals, and report-specific states.
- The report slot/component contract consumed by Prompt 03.

Do not change listing queries, auth middleware, backend aggregation, or lifecycle behavior.

## API contract

Use:

```http
GET /api/donor/reports/dashboard?periodStart=YYYY-MM-DD&periodEnd=YYYY-MM-DD
```

Both date parameters are optional. Expected response:

```js
/**
 * @typedef {Object} DashboardBreakdown
 * @property {string} label
 * @property {number} donatedQuantity
 * @property {number} donationCount
 * @property {number} revenue
 */

/**
 * @typedef {Object} DonorDashboardStats
 * @property {string} generatedAt
 * @property {string|null} periodStart
 * @property {string|null} periodEnd
 * @property {number} totalDonatedQuantity
 * @property {number} totalRevenue
 * @property {number} donationCount
 * @property {DashboardBreakdown[]} byCategory
 * @property {DashboardBreakdown[]} byMeasurementUnit
 */
```

The live response does not include listing totals, previous-period comparisons, or revenue-over-time points. Use accurate labels:

- “Collected Donations” for `donationCount`.
- “Total Quantity (mixed units)” for `totalDonatedQuantity`.
- “Total Revenue” for `totalRevenue`.

Do not label `donationCount` as “Listings.”

## Current backend dependency

The report route currently lacks the authentication and donor-profile middleware attached to listing routes. A valid donor session may still receive 401 from this endpoint.

Frontend behavior:

- Call the endpoint normally with the cookie.
- Do not attach donor profile IDs, `x-donor-profile-id`, or custom authentication headers.
- Treat 401 from this isolated request as a statistics-service failure, not as proof that the whole shell session expired when `/api/auth/me` and listing calls remain valid.
- Render the slide-17 statistics error panel and keep listings interactive.
- Record the missing middleware as a backend dependency in the pull request.

## Period controls

Provide an accessible period selector with:

- This Month: first day through current day.
- Last 30 Days: inclusive 30-day range ending today.
- All Time: omit both parameters.
- Custom: require valid start and end dates and prevent start after end.

Send calendar dates as `YYYY-MM-DD`. Store the selected preset and custom dates in dashboard URL search parameters without interfering with listing filters.

## Successful report UI

Match the Canva report panel:

- Section heading “Statistical Reports.”
- Three summary cards.
- Rare UI Animated Counter for numeric transitions; use non-animated text under reduced-motion preference.
- Category breakdown as a donut or horizontal bar chart using AFF greens, warning, and danger accents.
- Measurement-unit breakdown as ranked bars.
- Accessible data-table alternative for every chart, available to screen readers and through a “View data table” control.
- Percentages calculated from the applicable total with zero-total protection and consistent rounding.

Category labels must use the shared display map. Unknown future labels render as readable text rather than crashing.

## Missing live data and preview mode

### Previous-period deltas

The API has no comparison values. In live mode, omit arrows and “vs last month” claims entirely.

### Revenue over time

The API has no time-series points. In live mode, show a compact “Revenue over time is not available from the reporting API” state instead of a fake line.

When `VITE_ENABLE_DONATION_PREVIEW_DATA=true`, deterministic fixtures may demonstrate deltas and a revenue line chart. Requirements:

- Show `PreviewDataBadge` beside each preview visualization.
- Keep live summary/breakdown values visually distinct from preview-only data.
- Preview data must never replace a successful live response silently.
- Tests must prove preview values are absent when the flag is false.

## Required states

### Loading

- Use metric and chart skeletons with stable dimensions.
- Do not block or dim the listing area.

### Empty — Canva slide 18

When all totals are zero and both breakdown arrays are empty:

- Show zero summary values.
- Show “No statistical data yet.”
- Explain that charts appear after collected donation activity exists.
- Do not render meaningless empty axes or percentages.

### Failure — Canva slide 17

- Show “Unable to load statistics.”
- Explain that listings remain available while the reporting service is unavailable.
- Include a Retry button that refetches only the report query.
- Preserve the selected period.

### Malformed partial data

Normalize missing arrays to empty arrays and missing numeric values to zero only at the transport boundary. Log a development warning; do not allow `NaN` or broken chart geometry.

## Responsive behavior

- Desktop report panel sits beside the current listings area where the dashboard composition allows.
- Tablet moves below the primary listing section.
- Mobile stacks summary cards, charts, and tables in one column.
- Tooltips must be keyboard reachable and never contain the only copy of a value.

## Tests

Use MSW and fake system dates where appropriate to cover:

- Query generation for every period preset and valid custom period.
- Invalid custom date order blocks a request.
- Correct response normalization and labels.
- Animated Counter receives correct values; reduced-motion fallback renders final values immediately.
- Percentage calculation and zero-total behavior.
- Empty response hides chart axes and shows the slide-18 state.
- 401/5xx report failure shows slide-17 behavior while the listing fixture remains visible.
- Retry affects only the report query.
- Live mode omits deltas/time series.
- Preview mode labels deterministic delta/time-series fixtures.
- Chart data remains available in an accessible table.

## Acceptance criteria

- Report failure never replaces or disables successful listing content.
- No previous-period or time-series values are presented as live facts.
- Statistics labels match backend semantics.
- All numeric, date, category, and unit values are formatted consistently.
- Empty, error, loading, success, and preview states are visually distinct and accessible.

## Required verification

```bash
pnpm --filter frontend lint
pnpm --filter frontend build
pnpm --filter frontend test
```

## Handoff

Report the report-query contract, period URL parameters, accessible chart strategy, preview-only content, tests run, and the exact backend middleware dependency. Do not edit backend files.
