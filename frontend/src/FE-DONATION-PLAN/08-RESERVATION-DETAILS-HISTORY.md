# Prompt 08: Reservation Details and History

## Role and objective

You own the donor's read-only reservation and manual-entry history from Canva slides 29–30. Build a listing selector, listing summary, reservation table, pagination, client-side controls over the loaded result, feedback display, manual walk-in labels, responsive cards, and a clearly labeled preview-only overbooking scenario.

The live donor endpoint does not expose status-changing reservation actions. Do not invent confirmation, collection, cancellation, or conflict-resolution mutations.

## Prerequisites

- Prompts 01–03 are merged.
- Reuse shared listing types, formatters, API client, query keys, alerts, preview badge, and shell routes.
- Coordinate navigation links with Prompt 03 and status labels with Prompt 07.

## Permitted scope

- Reservation listing selector, listing summary composition, read-only history query, pagination, current-page controls, table/card views, and preview overbooking display.

Do not implement reservation creation, collection, cancellation, conflict resolution, donor listing mutations, or backend changes.

## Routes and API contracts

`/donor/reservations` is a listing selector. Selecting a listing navigates to:

```text
/donor/listings/:listingId/reservations
```

Load the page with two independent queries:

```http
GET /api/donor/food-listings/:id
GET /api/donor/food-listings/:id/donations?page=1&limit=20
```

History response:

```ts
interface ListingDonationEntry {
  id: string
  recipientUsername: string | null
  reservedAt: string | null
  collectedAt: string | null
  quantity: number
  status: string
  totalPaid: number
  paymentMethod: 'Cash' | 'Wallet' | 'Card' | null
  feedback: string | null
}

interface ListingDonationHistoryResponse {
  entries: ListingDonationEntry[]
  metadata: PageMetadata
}
```

Known backend reservation statuses are `Reserved`, `CollectedByRecipient`, `Collected`, and `CancelledByDonor`. Render unknown future values with a neutral readable badge rather than failing.

The Canva labels “Reversed” and “Cancelled by recipient” are not current live status values. Use “Reserved” for the apparent typo. Show cancelled-by-recipient only as labeled preview data if required for visual parity.

## Listing selector

- Load owned listings through the established listing query/hook.
- Search selector results by listing name locally.
- Show status, remaining quantity, and created/closed date.
- Permit history viewing for active and historical listings.
- Handle no listings with a link to Create New Listing.
- Do not accept an arbitrary donor or listing owner ID from the URL/query string; the backend ownership check is authoritative.

## Listing summary — slide 29

Show:

- Category, vegetarian, and status badges.
- Listing name and placeholder artwork.
- Measurement unit and remaining quantity.
- Price and created date.
- Donation Limit.
- Donated Units derived safely when donationLimit is positive.
- Remaining.
- Revenue.
- Edit, Pause/Resume, and Cancel entry points supplied by the existing listing/lifecycle components when permitted.

Do not duplicate mutation logic inside the reservation feature.

## History table

Desktop columns:

- Sequence/index within the current result page.
- Recipient/Name.
- Quantity.
- Reserved at.
- Collected at.
- Status.
- Total Paid.
- Feedback.

Rules:

- Use `recipientUsername` when present.
- Treat a non-account/manual name returned by the API as “Walk-in: {name}” only when the normalized transport marks it as manual or the existing backend response convention makes that safe. Otherwise display the returned string without guessing.
- Use an em-free plain placeholder such as “Not recorded” for null dates/feedback.
- Render totalPaid 0 as Free when appropriate.
- Feedback is text only; never inject HTML.
- Preserve server order unless the user chooses a client-side sort.

## Pagination and controls

The server supports only `page` and `limit` for this endpoint.

- Use server pagination with limit 20 and metadata-driven Previous/Next buttons.
- Disable Previous on page 1 and Next when `hasNextPage` is false.
- Keep the table visible while the next page loads and announce the new page after success.
- Search, status, and sort controls operate only on the currently loaded page.
- Display “Filters apply to this page” beside those controls so the limitation is explicit.
- Do not send unsupported search/status/sort query parameters.
- Reset client filters when moving to another server page.

## Required states

### Loading

- Listing summary and history table have separate stable skeletons.
- A slow history request does not hide a successful listing summary.

### Empty history

- Show “No donation entries yet.”
- Explain that reservations and recorded manual handoffs will appear here.
- Do not render empty table headers on mobile.

### No matches on loaded page

- Keep the page limitation visible.
- Offer Clear Filters without changing server page.

### Listing not found or not owned

- Show a safe not-found state without revealing whether another donor owns the ID.
- Link back to the reservation listing selector.

### History failure

- Keep the listing summary and Retry only the history query.

## Overbooking preview — slide 30

The live donation update path is designed to prevent stock overbooking, and no donor conflict-resolution endpoint exists.

When `VITE_ENABLE_DONATION_PREVIEW_DATA=true`, allow a deterministic history fixture to show:

- Visible Preview Data badge.
- Warning: simultaneous reservations exceed the configured donation limit.
- Total reserved versus donation limit.
- A statement that the state is illustrative and cannot be resolved from this frontend.

Never infer or display this warning from unrelated totals in live data. Never add a fake Resolve button or send a mutation.

## Responsive behavior

- Desktop uses the Canva summary panel and semantic table.
- Tablet may reduce secondary columns but keeps data available through an expandable row.
- Mobile renders one reservation card per entry with labeled values in the same logical order.
- Do not make the user horizontally scroll a full desktop table on a phone.
- Pagination and filter controls remain 44px minimum targets.

## Accessibility

- Use a real table with caption and scoped headers on desktop.
- Status is text plus color.
- Date/time values use `<time dateTime>`.
- Loading and page changes use a polite status region.
- Feedback expansion controls expose `aria-expanded` and retain focus.
- Mobile cards preserve heading hierarchy and do not duplicate screen-reader announcements from a hidden table.

## Tests

Use MSW and user-event to cover:

- Listing selector for active and historical listings.
- Exact detail/history URLs and page/limit query parameters.
- Ownership-safe 404 behavior.
- Known and unknown status labels.
- Recipient, walk-in/manual, null date, free payment, and feedback presentation.
- Server pagination and retained prior page while loading.
- Current-page search/status/sort and limitation notice.
- Empty, no-match, history-only failure, and retry states.
- Listing summary remains visible while history fails.
- Responsive table-to-card content parity.
- Preview overbooking state only when the flag is true and no mutation control exists.
- Keyboard navigation through selector, filters, pagination, and expandable feedback.

## Acceptance criteria

- History is strictly scoped to an owned listing through the live endpoints.
- Pagination uses only supported query parameters.
- Client filters clearly state their current-page scope.
- Unknown statuses and null values never break layout.
- Preview overbooking cannot be confused with live data or a supported mutation.
- Desktop and mobile representations expose the same information accessibly.

## Required verification

```bash
pnpm --filter frontend lint
pnpm --filter frontend build
pnpm --filter frontend test
```

## Handoff

Document selector/detail/history queries, current-page filtering limitation, status normalization, responsive table/card strategy, preview-only slide-30 behavior, tests, and screenshots.
