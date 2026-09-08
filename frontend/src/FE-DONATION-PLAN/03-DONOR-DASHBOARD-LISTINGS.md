# Prompt 03: Donor Dashboard Listings

## Role and objective

You own the listing portion of the donor dashboard and the reusable “My Listing” view. Implement live listing retrieval, listing cards, active/past grouping, filters, sorting, pagination, loading, no-match, empty, and failure behavior from Canva slides 15–18.

Statistics belong to Prompt 04. Lifecycle mutations belong to Prompt 05. Render their integration slots, but do not implement their API calls here.

## Prerequisites

- Prompts 01 and 02 are merged.
- Read the prompt-pack README and reuse its types, API wrapper, query keys, formatting helpers, shell, and design tokens.
- Inspect the current backend query normalization before assuming a filter exists.

## Permitted scope

- Dashboard and My Listing queries, filters, URL state, list/card presentation, pagination, and listing-specific states.
- Reusable read-only listing summary/card components.
- Integration slots for report and lifecycle owners.

Do not implement report, mutation, form, or reservation-history requests.

## API contract

Use:

```http
GET /api/donor/food-listings
```

Supported query parameters:

```text
page, limit, includeClosed, status, measurementUnit, foodCategory,
search, isVegetarian, minPrice, maxPrice, createdFrom, createdTo,
sortBy=createdAt|revenue, sortOrder=asc|desc
```

Expected response:

```js
/**
 * @typedef {Object} DonationListMetadata
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 * @property {number} totalPages
 * @property {boolean} hasNextPage
 * @property {boolean} hasPreviousPage
 * @property {"createdAt"|"revenue"} sortBy
 * @property {"asc"|"desc"} sortOrder
 */

/**
 * @typedef {Object} DonationListResponse
 * @property {DonationListingTransport[]} entries
 * @property {DonationListMetadata} metadata
 */
```

Normalize every entry before it reaches components.

## Data strategy

- Use one server query with `includeClosed=true` and `limit=100`, then partition the loaded result into current and past sections.
- Current listings are `Active`, `Paused`, or `PendingCancellation` with `closedAt === null`.
- Past listings are `Cancelled`, `SoldOut`, or any listing with a non-null `closedAt`.
- Apply server-supported search/category/date/sort filters in the request.
- Paginate the current and past partitions independently in the client at 10 cards per page.
- When API metadata reports more than 100 total results, show “Showing the latest 100 listings” and do not imply the archive is complete. Record server-side multi-status pagination as a backend follow-up.
- Keep prior results visible while filter requests change and show a subtle updating indicator.
- Debounce search by roughly 300ms. All other filters update immediately.
- Store filters and the two section page numbers in URL search parameters so refresh/back navigation preserves state.

## Dashboard composition

Build the Canva slide-15 structure:

- Heading “Welcome Back, Donor!” and supporting text.
- Primary “Create New Listing” link to `/donor/listings/new`.
- Secondary “Input Cash Received” link to `/donor/manual-donations`.
- Current/active donation section.
- Past donation section.
- Statistics slot on desktop beside the active list and below the listings on narrower screens.

`/donor/listings` may reuse the same filter/list components without the welcome/statistics composition.

## Listing cards

Each card shows:

- Category and vegetarian badge when applicable.
- Listing name.
- Remaining quantity plus unit.
- Price or “Free” when the normalized price is zero.
- Donated quantity derived as `max(donationLimit - remainingQuantity, 0)` when donationLimit is positive; otherwise show “Not tracked” rather than inventing a total.
- Revenue.
- Created date for current listings or closed date for past listings.
- Status badge.
- Placeholder food artwork because the live listing API has no image field.
- Stable links for edit and reservation/history detail where allowed.
- A lifecycle-actions slot supplied by Prompt 05.

Do not present `remainingQuantity` as the original total. Do not render negative derived values.

## Filters and sorting

Implement:

- Search by listing name.
- All Categories plus exact category values.
- Date presets that translate to `createdFrom` and `createdTo`.
- Sort by newest/oldest creation date or highest/lowest revenue.
- Clear Filters action that restores the default query and page numbers.

Use real labels with associated controls. Do not use placeholder-only labels.

## Required states

### Loading

- Preserve page header and actions.
- Render card skeletons with stable height.
- Announce completion politely without repeatedly announcing background refreshes.

### No matching listings — Canva slide 16

Show when the unfiltered account has listings but the current filters return none:

- “No matching listings found.”
- Explanation that search/category/date/sort criteria produced no match.
- Clear Filters action.

### No active donations — Canva slide 18

Show when current listings are empty without active filters:

- “No active donations.”
- Explain that a new listing can begin receiving reservations and entries.
- Link to Create New Listing.

Past donations may still render below this state.

### Listing request failure

- Show a listing-specific error with Retry.
- Do not show empty-state copy for a failed request.
- Statistics may still render independently if their query succeeds.

### Partial statistics failure — Canva slide 17

Expose the layout slot so Prompt 04 can show a statistics error without replacing listing data.

## Responsive behavior

- Desktop cards follow Canva's image-left, metrics-middle, actions-right layout.
- Tablet moves actions beneath metrics.
- Mobile uses one-column cards, horizontally scrollable filter controls only when wrapping would break labels, and full-width primary actions.
- Pagination remains keyboard accessible and never relies on tiny page numbers.

## Tests

Use MSW to cover:

- Successful normalization of `_id` and `id`.
- Active/past partitioning for all statuses and `closedAt` combinations.
- Query-string mapping for search, category, dates, and sorting.
- URL state restoration and search debounce.
- Current/past client pagination and the 100-result cap notice.
- Price, quantity, donated amount, revenue, and date formatting.
- No-match state with Clear Filters.
- No-active-listing state with Create link.
- Loading, retryable failure, and background refresh indicators.
- The listing section remains usable when the statistics slot reports an error.

## Acceptance criteria

- Slides 15–18 are represented by deterministic live-data states.
- Filters use only backend-supported wire parameters.
- Current and past sections cannot misclassify closed listings.
- No image URL, trend, donated quantity, or archive completeness is fabricated.
- Dashboard and My Listing share components without duplicate data logic.
- Responsive and keyboard behavior meets the README requirements.

## Required verification

```bash
pnpm --filter frontend lint
pnpm --filter frontend build
pnpm --filter frontend test
```

## Handoff

Document query parameters used, URL-state behavior, the 100-record limitation, shared listing components/query hooks, and the exact extension points for Prompts 04 and 05.
