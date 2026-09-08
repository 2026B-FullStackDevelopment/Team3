# Prompt 09: Responsive, Accessibility, and End-to-End Integration

## Role and objective

You own final integration and release readiness after Prompts 01–08 are merged. Validate the complete donor workflow, resolve coordinated integration defects, add deterministic Playwright journeys, run accessibility checks, and verify desktop/tablet/mobile parity against Canva slides 15–30.

Do not add new product features or modify backend contracts. Route substantial feature changes back to the owning prompt/module.

## Prerequisites

- Prompts 01–08 are merged into one integration branch.
- Read every prompt handoff and unresolved backend dependency.
- Confirm the working tree before making cross-module fixes.
- Use deterministic Playwright network interception or a dedicated frontend test mode. Never run destructive seed commands as part of frontend E2E startup.

## Permitted scope

- Playwright fixtures/specs, axe checks, responsive/keyboard/reduced-motion verification, integration test configuration, and small coordinated fixes needed to make merged modules work together.

Do not add features, modify backend files, loosen validated contracts, or redesign a feature without its owner.

## API contract constraints

- Intercept and assert the exact API methods, paths, query parameters, bodies, and `credentials: 'include'` behavior defined in Prompts 01–08.
- Reject unexpected network calls in deterministic E2E scenarios.
- Run separate fixtures for live-contract behavior and visibly labeled preview behavior.
- Never use donor IDs or custom headers as authentication workarounds.

## Integration audit

Verify these shared contracts before writing E2E assertions:

- One provider tree and one donor layout.
- One API client with `credentials: 'include'`.
- One normalized listing type and ID rule.
- One set of category/unit/status label maps.
- One query-key factory.
- Mutations invalidate the correct listing, history, and report queries.
- One preview flag parser and consistent Preview Data badge.
- No feature contains a copied/private version of shared formatters or API errors.

Remove duplicated integration code only when ownership is clear. Avoid unrelated formatting changes.

## Tests

Implement the following end-to-end journeys with deterministic network fixtures and assertions against the exact live contracts.

### 1. Session and navigation

- Authenticated Donor opens `/donor/dashboard` and sees the shell.
- Direct navigation to every donor route works.
- Active navigation follows nested routes.
- Expired session redirects to `/login` without donor data flashing.
- Authenticated non-donor receives not-authorized.
- Logout clears donor data and returns to `/login`.

### 2. Dashboard listings

- Successful active and past sections render normalized listing data.
- Search/category/date/sort update URL state and results.
- Refresh preserves filter state.
- No matches show Clear Filters.
- No active listings show Create New Listing while past history remains available.
- Listing failure and statistics failure are independent.

### 3. Dashboard reports

- Successful totals and breakdowns render with accessible chart tables.
- Empty response renders zeros and no-chart copy.
- Report 401/5xx renders Retry while listings remain usable.
- Live mode never shows preview deltas or time series.
- Preview mode visibly labels every preview value.

### 4. Create, edit, and duplicate

- Create a free Unit listing with exact enum values.
- Create a paid decimal-unit listing.
- PerRequest form locks unsupported controls and sends the defined payload.
- Invalid name, quantity, ration, price normalization, and duplicate name are recoverable.
- Edit sends only changed supported fields.
- Duplicate requires a new name and does not copy operational fields.
- Preview image/location are excluded from every network payload.

### 5. Lifecycle

- Pause then resume with exact request bodies.
- Cancel requires explicit confirmation and moves the listing to past.
- Invalid transition/conflict refetches without false success.
- Eligible delete uses Rare UI confirmation and waits for 204.
- Revenue-bearing listing cannot be deleted.
- Ration accepts 0 and rejects values above limits.

### 6. Manual donation

- Free entry omits payment fields.
- Cash entry calculates and submits amount/change correctly.
- Decimal KG entry succeeds.
- Quantity exceeding remaining is blocked.
- Stale concurrent quantity returns a recoverable conflict.
- Paused/cancelled fixtures explain why submission is unavailable.
- PerRequest records one request in the defined live flow.
- Sold-out response removes the listing from active selection and refreshes history/report queries.
- Preview wallet never sends a mutation and always displays Preview Data.

### 7. Reservation history

- Select an active and a historical listing.
- Navigate history pages with exact page/limit parameters.
- Current-page filters show their scope notice.
- Manual walk-in, statuses, totals, null dates, and feedback render safely.
- History failure retains listing summary.
- Preview overbooking has no mutation/Resolve action.

## Responsive visual QA

Capture and review these viewports:

| Viewport | Required checks |
|---|---|
| 1440×900 | Canva desktop composition, two-column dashboard/report balance, desktop history table |
| 1024×768 | Tablet navigation, wrapping filters, stacked dashboard/report balance |
| 390×844 | Mobile menu, one-column cards/forms, reservation cards, full-width primary actions |

For each viewport check:

- No horizontal page overflow.
- No clipped labels, currency, badges, dialogs, or chart legends.
- Sticky/fixed elements do not cover focused controls.
- On-screen keyboard does not hide the active manual-entry field.
- Touch targets are at least 44px.
- Content order remains meaningful without CSS positioning.

Keep screenshot assertions focused on stable major surfaces. Do not snapshot animated intermediate frames or all text pixel-for-pixel.

## Accessibility verification

Run automated axe checks on:

- Dashboard success, no-match, no-active, and report-error states.
- Create form default, invalid, and PerRequest states.
- Lifecycle confirmation dialog and Rare UI delete confirmation.
- Manual-entry free, cash, validation, and wallet-preview states.
- Reservation table and mobile reservation cards.

Manually verify:

- Logical heading order and one main landmark.
- Skip link and keyboard-only navigation.
- Visible focus on every interactive control.
- Dialog/sheet focus entry, containment, Escape, and restoration.
- Errors are linked to fields and announced once.
- Status/alert regions do not repeat on every background refetch.
- Status and chart meaning never depend on color alone.
- Reduced motion preserves final values and confirmation controls.
- 200% browser zoom remains usable at desktop width.

Automated axe success does not replace the manual keyboard and reading-order checks.

## Reliability and performance checks

- No uncaught console errors or React key/hydration warnings.
- No duplicate requests caused by component-local fetch effects.
- Route changes cancel obsolete queries through AbortSignal.
- Repeated submit/click cannot duplicate a mutation.
- Feature routes may be lazy-loaded, but the shell and error boundaries remain immediate.
- Charts and Rare UI animation do not cause layout shifts that move controls during interaction.
- Object URLs from image preview are revoked.
- Sensitive auth data, recipient IDs, and server error internals are not logged.

## Preview/live separation audit

Run the full suite twice:

1. `VITE_ENABLE_DONATION_PREVIEW_DATA=false`
   - No preview fixtures, wallet option, fake deltas, time series, image/location preview, cancelled-by-recipient, or overbooking warning appears.
2. `VITE_ENABLE_DONATION_PREVIEW_DATA=true`
   - Preview surfaces appear only where planned and every one displays Preview Data.
   - Preview wallet never makes a POST request.
   - Unsupported image/location keys never enter create/edit/duplicate payloads.

## Required UI states

The integrated suite must exercise success, loading, empty, no-match, validation, pending mutation, conflict, unauthorized, not-found, partial-service failure, generic failure, retry, and preview-only states at their owning routes.

## Acceptance criteria

- Every journey above has a deterministic Playwright test or an explicitly documented manual-only check.
- Lint, TypeScript/Vite build, Vitest, Playwright, and axe checks pass.
- Desktop closely matches slides 15–30 and responsive adaptations preserve functionality.
- Live and preview information cannot be confused.
- No frontend workaround bypasses backend ownership or authentication.
- Known backend limitations remain documented with exact affected surfaces.
- The final PR contains screenshots at all three viewports and a concise verification matrix.

## Required verification

Run from the workspace root:

```bash
pnpm --filter frontend lint
pnpm --filter frontend build
pnpm --filter frontend test
pnpm --filter frontend test:e2e
```

Also run the E2E suite with preview mode disabled and enabled as separate configurations.

## Final handoff

Provide:

- Pass/fail matrix for lint, build, unit/integration, E2E, axe, keyboard, reduced motion, and responsive QA.
- Links or paths to desktop/tablet/mobile screenshots.
- Exact known backend dependencies: report middleware, listing image/location persistence, recipient wallet lookup, report trends/time series, and server-side reservation filtering.
- Any defect returned to a feature owner and its resolution.
- Confirmation that backend files and unsupported request payloads were not changed.
