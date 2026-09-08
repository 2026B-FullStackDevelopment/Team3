# Prompt 06: Create, Edit, and Duplicate Listing

## Role and objective

You own the listing form workflow from Canva slides 27–28. Implement create, edit, and duplicate experiences using one tested form model while preserving the different API semantics of each operation.

Image and pickup location are client-only previews because the live donation API cannot persist them. Do not modify the backend or send unsupported fields.

## Prerequisites

- Prompts 01–03 are merged.
- Prompt 05 may be in progress; coordinate the Edit and Duplicate entry points but do not change its mutation controls.
- Reuse shared API types, label maps, API errors, formatting, query keys, form controls, and `PreviewDataBadge`.

## Permitted scope

- Shared listing-form schema and controls.
- Create, edit, and duplicate pages/mutations.
- Preview-only image/location controls and form-specific success/error navigation.

Do not implement listing lifecycle actions, reservation history, real upload/location persistence, or backend changes.

## API contracts and routes

### Create

```http
POST /api/donor/food-listings
Content-Type: application/json
```

Required live fields are `name`, `measurementUnit`, `foodCategory`, and positive `remainingQuantity`. Supported optional fields are `description`, `isVegetarian`, `donationLimit`, `price`, and `ration`.

### Edit

Load:

```http
GET /api/donor/food-listings/:id
```

Save changed supported fields through:

```http
PATCH /api/donor/food-listings/:id
Content-Type: application/json
```

Do not send an empty patch. Cancelled and SoldOut listings are read-only.

### Duplicate

```http
POST /api/donor/food-listings/:id/duplicate
Content-Type: application/json
```

A new unique `name` is required. The backend copies configuration and resets operational values. Do not send status, revenue, createdAt, or closedAt.

## Form model

Use React Hook Form and Zod. Provide these controls:

- Listing Name: required, trimmed, non-empty.
- Category: required exact FoodCategory selection.
- Measurement Unit: required exact MeasurementUnit selection.
- Dietary Preference: Vegetarian, Non-vegetarian, or Not specified; map to `true`, `false`, or `null`.
- Initial Available Quantity: create/duplicate only, positive.
- Donation Limit: non-negative.
- Remaining Quantity: edit only, non-negative.
- Ration: non-negative, with 0 meaning unlimited.
- Price: non-negative VND.
- Description: optional, trimmed, maximum 500 characters, with counter.
- Pickup Location Preview: preview mode only.
- Image Preview: preview mode only.

Use input modes appropriate for numeric entry. Preserve decimals for KG, G, L, and ML. Require integers for Unit. Do not rely on native number-input arrows as the only method of adjustment.

## Create mapping

For KG, G, L, ML, and Unit:

- Map Initial Available Quantity to `remainingQuantity`.
- Default `donationLimit` to the same value, while allowing the donor to set `0` only when the product copy clearly explains that the total cap is untracked.
- Default ration to 0.

For `PerRequest`:

- Fix `remainingQuantity` at 1 for the current backend contract.
- Send `donationLimit: 0` and `ration: 0`.
- Hide/disable quantity and ration controls that imply a measurable amount.
- Show the backend-aligned warnings: donor discretion, no online reservation, and possible visits after distribution.
- Explain in the handoff that the current manual-entry service will mark this listing sold out after one fulfilled request.

## Pricing rule

- Display the Canva rule that a price below 1,000 VND becomes Free.
- Normalize a positive value below 1,000 to `0` before submission.
- Show the normalized result before the donor confirms submission.
- Never mutate the visible value silently while the field is focused.
- Free listings send `price: 0`.

## Ration validation

- `ration >= 0`.
- If donationLimit is positive, ration cannot exceed it.
- Positive ration cannot exceed remaining quantity.
- PerRequest always sends ration 0.
- Revalidate dependent fields immediately when quantity, unit, or donation limit changes.

## Preview-only image and location

Render these controls only when `VITE_ENABLE_DONATION_PREVIEW_DATA=true`:

- Place `PreviewDataBadge` in the section heading.
- Image accepts PNG/JPEG only and a maximum of 5 MB, matching the Canva control.
- Generate a local object URL for preview and revoke it on replacement/unmount.
- Location is a local text preview; it is not an address verification feature.
- Show “Preview only — this information will not be saved by the current API.”
- Assert in payload-building tests that neither value is serialized.
- Clearing/resetting the form also clears these previews.

In live mode, omit the unsupported section and do not imply that listing images or pickup locations have been saved.

## Create experience — slide 27

- Page title “Create New Donation Listing.”
- Back action returns safely without submitting.
- Group fields under “Fill in Details.”
- PerRequest condition panel appears only for that unit.
- Submit disables only while the request is pending.
- On success, announce creation and navigate to the created listing/dashboard using the normalized ID.
- On duplicate-name conflict, focus the name field and preserve all other input.

## Validation experience — slide 28

Implement field-level states for:

- Missing listing name.
- Missing/invalid quantity.
- Donation limit/ration below or above allowed bounds.
- Invalid pickup preview in preview mode.
- Unsupported image type or oversized image in preview mode.
- Empty patch on edit.
- Closed listing edit attempt.

Disable submit only for known client validation or an active submission. Do not disable it merely because an optional preview field is absent.

## Edit experience

- Render a stable loading skeleton while the listing loads.
- Populate only normalized supported fields.
- Treat Donation Limit and Remaining Quantity as separate edit fields; do not recalculate donated history.
- Omit unchanged fields from the PATCH body.
- If status becomes closed before save, show the backend rejection, refetch, and switch to read-only state.
- On success, update detail/list caches and return to the originating listing view.

## Duplicate experience

- Prefill configuration from the source listing but leave name invalid until the donor enters a new unique value.
- Permit duplication from a historical listing because the backend creates a fresh active record.
- Clearly state that revenue, status, dates, and historical reservations are not copied.
- On success, invalidate listing queries and navigate to the new listing.

## Required UI states

- Create blank/default, validating, submitting, success, and recoverable failure.
- Edit loading, populated, unchanged, submitting, stale/closed, success, and not-found.
- Duplicate loading, prefilled/new-name-required, submitting, conflict, and success.
- PerRequest warning state.
- Preview image/location valid and invalid states.
- Unsaved-change navigation warning for every workflow.

## Tests

Cover:

- Every label-to-wire enum mapping and reverse display mapping.
- Create payload for each measurement-unit family.
- PerRequest payload and warnings.
- Decimal versus integer validation.
- Price 0, 999, 1,000, and a normal paid amount.
- Ration and quantity dependency validation.
- Image MIME/size preview and object URL cleanup.
- Unsupported image/location exclusion from all payloads.
- Create success, duplicate-name error, 401, conflict, and generic failure.
- Edit population, minimal PATCH, closed-state refetch, and empty-patch prevention.
- Duplicate prefill, required new name, operational-field exclusion, and successful navigation.
- Keyboard order, field-error association, focus on first invalid field, and unsaved-change warning.

## Acceptance criteria

- All three workflows share one domain-aware form implementation without conflating their payloads.
- Only backend-supported fields are submitted.
- PerRequest, numeric-unit, ration, and price rules are deterministic and tested.
- Preview controls cannot be mistaken for persisted data.
- Server errors preserve donor input and focus the actionable field or alert.
- Create/edit/duplicate success invalidates and navigates consistently.

## Required verification

```bash
pnpm --filter frontend lint
pnpm --filter frontend build
pnpm --filter frontend test
```

## Handoff

Document route components, shared form schema, payload mappings, preview-only fields, PerRequest limitation, cache updates, screenshots for slides 27–28, and verification results.
