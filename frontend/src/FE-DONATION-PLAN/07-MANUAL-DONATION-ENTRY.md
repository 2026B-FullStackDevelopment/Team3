# Prompt 07: Manual Donation Entry

## Role and objective

You own the donor's direct handoff workflow from Canva slides 19–26. Implement listing selection, required recipient identification, quantity rules, free and cash payments, wallet preview, calculated totals/change, eligibility errors, concurrent-change recovery, and sold-out completion.

Free and cash submissions use the live backend. Wallet lookup remains preview-only until a donor-accessible recipient lookup contract exists.

## Prerequisites

- Prompts 01–03 are merged.
- Reuse normalized listing types, API client, query keys, formatters, alerts, and preview guard.
- Coordinate cache invalidation with Prompt 05 and form primitives with Prompt 06.
- Read the backend manual-donation validator/service and use the backend's exact field names.

## Permitted scope

- Manual-entry listing selection, dialog/sheet/page form, live free/cash submission, preview wallet adapter, calculations, and manual-entry states.
- Cache updates caused by a successful direct handoff.

Do not create recipient lookup, wallet balance, lifecycle, reservation-update, or backend functionality.

## API contracts

Load candidate listings with:

```http
GET /api/donor/food-listings?includeClosed=true&limit=100
```

Submit a live entry with:

```http
POST /api/donor/food-listings/:id/manual-donations
Content-Type: application/json
```

Request shape:

```ts
interface ManualDonationRequest {
  recipientName: string
  quantity: number
  paymentMethod?: 'Cash' | 'Wallet'
  amountReceived?: number
  recipientProfileId?: string
}
```

The live validator requires a non-empty `recipientName`, despite the Canva optional label.

Expected success contains:

```ts
interface ManualDonationResult {
  donation: unknown
  payment: {
    method: 'Cash' | 'Wallet' | null
    totalPrice: number
    amountReceived: number
    change: number
  }
  listing: DonationListingTransport
  soldOutAlert: unknown | null
}
```

Normalize the returned listing before updating caches.

## Page structure

Implement `/donor/manual-donations` with:

- Heading “Manual Donation Entry.”
- Explanation that this records food handed directly to a recipient.
- Back to Dashboard action.
- Listing search/filter panel or compact active-listing list.
- “Give Out Donation” form as a responsive dialog/sheet or inline panel.
- Desktop dialog may overlay the dashboard composition as in slide 19.
- Mobile uses a full-height sheet/page so the form is not cramped.

Use a real `<form>` with a single submit path. Enter submits only when validation succeeds and focus is not on a quantity stepper button.

## Listing eligibility

- Active listings are selectable for live submission.
- Paused, PendingCancellation, Cancelled, and SoldOut listings remain visible when helpful but are disabled with a reason.
- If a previously selected listing changes status before submit, display the server error, refetch, and retain the entered recipient/quantity.
- Listings owned by another donor must never be reachable through client input.
- The 100-result cap must be disclosed when metadata reports more results.

Preview mode may allow an ineligible fixture to be selected solely to demonstrate slides 25–26. Mark the entire state as preview and never submit it.

## Form fields and calculations

### Recipient name

- Required for free, cash, and wallet flows.
- Trim whitespace and reject an empty value.
- Maximum 80 characters in the client to match Canva copy.
- Keep the entered name after recoverable server failure.

### Quantity

- Must be greater than zero and cannot exceed `remainingQuantity`.
- Unit requires a positive integer.
- KG, G, L, and ML permit positive decimal values.
- PerRequest is fixed to exactly 1 and labeled “Request.”
- Plus/minus buttons use a unit-aware step, remain keyboard accessible, and are not the only way to enter a value.
- Always recheck eligibility on the server; client validation cannot prevent concurrent stock changes.

### Total price

Calculate display total as `quantity * listing.price`. The backend remains authoritative and the success screen uses the returned `payment.totalPrice`.

### Free listing

- Hide payment-method and amount-received inputs.
- Omit `paymentMethod`, `amountReceived`, and `recipientProfileId` from the request.
- Display total as Free.

### Cash

- Send `paymentMethod: 'Cash'`.
- Require a non-negative integer VND `amountReceived`.
- Require amountReceived to be at least the calculated total.
- Display `change = amountReceived - totalPrice` live and explain that it is calculated automatically.
- Send the exact amount entered; use the backend response for final receipt values.

### Wallet preview

No donor-accessible API can search recipients or read recipient wallet balances. Implement a typed adapter boundary:

```ts
type RecipientLookupResult =
  | { source: 'preview'; recipientProfileId: string; name: string; balance: number }
  | { source: 'live'; recipientProfileId: string; name: string; balance?: number }
```

Current implementation supplies preview results only when `VITE_ENABLE_DONATION_PREVIEW_DATA=true`.

- Show Preview Data badges on recipient and balance values.
- Demonstrate sufficient and insufficient balances, including slide 20.
- For `source: 'preview'`, the final action is “Preview Wallet Result” and must not call the manual-donation endpoint or update listing caches.
- Hide wallet selection when preview mode is false and no live adapter is available.
- A future `source: 'live'` adapter may submit `paymentMethod: 'Wallet'` plus the real `recipientProfileId`; do not invent that adapter now.

## Per Request — slide 24

- Display the three PerRequest warning messages from `reservationPolicy.warningMessages` when available.
- Fix quantity at one fulfilled request.
- Hide payment selection when price is zero.
- Explain that the current backend records a fulfilled request and may mark the listing SoldOut after this entry.
- Do not imply online reservation support.

## Required edge states

### Quantity exceeded — slide 22

- Field error names the requested and remaining quantity with unit.
- Submit remains blocked until corrected.
- Treat slide 22 as canonical; slide 23 is the valid decimal example.

### Decimal quantity — slides 21 and 23

- Accept 1.5 for KG/G/L/ML.
- Keep exact decimal input without binary-float artifacts in display.

### Paused listing — slide 25

- Explain that the donor must resume before recording a new entry.
- Provide a link/back path to listing management, not an inline status mutation in this form.

### Cancelled listing — slide 26

- Explain that historical listings cannot receive new entries.
- Do not offer resume.

### Concurrent change

For “listing changed; retry” or new remaining quantity:

- Keep recipient and payment inputs.
- Refetch the listing.
- Clamp/reset quantity only after showing what changed.
- Require the donor to submit again.

### Sold out success

- Use the returned listing and soldOutAlert.
- Announce that the entry was recorded and the listing moved to SoldOut.
- Move it out of active selectors and refresh dashboard/history/report queries.

## Cache invalidation

After live success:

- Update the exact listing detail with the normalized returned listing.
- Invalidate all listing lists.
- Invalidate that listing's history.
- Invalidate dashboard reports.

Preview wallet results must not invalidate any live query.

## Tests

Use MSW and user-event to cover:

- Recipient name required and max length.
- Integer Unit and decimal measurement quantities.
- Quantity zero, negative, and above remaining.
- PerRequest fixed quantity and warning state.
- Free payload omits all payment fields.
- Cash payload and change for exact, excess, and insufficient cash.
- Backend-returned totals replace client estimates on success.
- Ineligible listing display and stale-status server rejection.
- Slide-22 exceeded state and slides-21/23 decimal success.
- Preview wallet sufficient/insufficient balance without any POST request.
- Wallet option absent when neither preview nor live adapter exists.
- Concurrent update retry behavior.
- Sold-out response moves the listing and triggers exact invalidations.
- Dialog/sheet focus, Escape/cancel, validation focus, and mobile keyboard behavior.

## Acceptance criteria

- Free and cash entries persist through the live endpoint with exact fields.
- Preview wallet behavior can never be mistaken for a recorded transaction.
- All quantity and listing-state rules are explicit before and after submission.
- Concurrent failures do not lose the donor's form data or silently retry a mutation.
- Success synchronizes listing, history, and report views.
- Slides 19–26 have corresponding deterministic states.

## Required verification

```bash
pnpm --filter frontend lint
pnpm --filter frontend build
pnpm --filter frontend test
```

## Handoff

Document live versus preview flows, exact request bodies, quantity steps, payment calculations, cache invalidations, Canva draft inconsistency, screenshots for slides 19–26, and verification results.
