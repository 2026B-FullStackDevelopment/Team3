# Prompt 05: Listing Lifecycle Actions

## Role and objective

You own donor listing lifecycle controls: pause, resume, cancel, delete, and ration changes. Add safe, accessible mutations to the listing cards/detail surfaces established by Prompt 03 without duplicating their query logic.

Create/edit/duplicate forms belong to Prompt 06. Reservation updates are not supported by the current donor history API and remain outside this task.

## Prerequisites

- Prompts 01–03 are merged.
- Reuse the shared API client, normalized listing type, query keys, alert component, and listing action slot.
- Read the live service transition rules before editing UI logic.

## Permitted scope

- Lifecycle/ration mutation hooks and action components.
- Pause/resume controls, cancel dialog, Rare UI delete confirmation, ration editor, mutation alerts, and cache synchronization.

Do not change listing read queries, listing forms, auth behavior, or backend transition rules.

## API contracts

### Pause or resume

```http
PATCH /api/donor/food-listings/:id/status
Content-Type: application/json

{ "status": "Paused" }
```

or:

```json
{ "status": "Active" }
```

### Cancel

```http
PATCH /api/donor/food-listings/:id/status
Content-Type: application/json

{ "status": "Cancelled" }
```

### Ration

```http
PATCH /api/donor/food-listings/:id/ration
Content-Type: application/json

{ "ration": 2 }
```

`ration: 0` means no per-recipient cap.

### Delete

```http
DELETE /api/donor/food-listings/:id
```

Success returns `204 No Content`. Deletion is rejected when recorded revenue is greater than zero.

## Transition matrix

Implement only these status changes:

| Current | Allowed donor actions |
|---|---|
| `Active` | Pause, Cancel |
| `Paused` | Resume, Cancel |
| `PendingCancellation` | No new lifecycle action; show read-only pending state |
| `Cancelled` | None |
| `SoldOut` | None |

Do not expose `PendingCancellation` as a requested target status. Do not allow activation when remaining quantity is zero.

## Interaction rules

- Use pessimistic mutations: keep current server state visible, disable the submitted control, then replace data from the successful response.
- Disable all actions for a listing while one mutation for that listing is pending.
- Other listing cards remain usable.
- Prevent accidental double submission.
- Announce success through a polite status region and failures through an assertive alert.
- On 401 from a protected listing mutation, use the shared session-expiration path.
- On 404, explain that the listing no longer exists and invalidate list/detail queries.
- On 409 or validation error, retain the current card state, display the backend message, and refetch the listing because another reservation or edit may have changed it.

## Pause and resume

- Active cards show “Pause Listing.”
- Paused cards show “Resume Listing.”
- Explain that paused listings reject new reservations and manual donation entries.
- Resume remains disabled when `remainingQuantity <= 0`.
- Successful updates must immediately refresh the card status and available actions.

## Cancel

- Use an accessible confirmation dialog, not a browser `confirm()` call.
- Explain that cancellation closes the listing and cancels active reservations.
- Require an explicit “Cancel Listing” confirmation and a non-destructive “Keep Listing” action.
- Move a successfully cancelled listing from current to past without waiting for a page reload.
- Do not offer undo because the backend does not support donor undo.

## Delete

- Use the themed Rare UI Delete Button for permanent deletion.
- The first activation opens its inline confirmation; Escape and the cancel affordance close it.
- Disable/hide deletion when `revenue > 0`, with explanatory text available to keyboard and screen-reader users.
- Treat the server as authoritative even when the client predicts eligibility.
- Remove the card only after the server returns 204.
- If deletion fails, restore the ready state and keep the listing visible.

Cancellation and deletion are distinct. Cancellation preserves history; deletion removes an eligible listing.

## Ration editor

- Provide a small labeled editor reachable from active or paused listing actions.
- Accept a non-negative number.
- `0` displays as “No ration limit.”
- Ration cannot exceed `donationLimit` when donationLimit is positive.
- Positive ration cannot exceed `remainingQuantity`.
- Disable ration editing for `PerRequest`, cancelled, sold-out, or otherwise closed listings.
- Show field-level errors and preserve the entered value after server rejection.

## Cache synchronization

After successful lifecycle/ration/delete operations:

- Update or invalidate the listing detail.
- Invalidate every listing list variant.
- Invalidate reservation history when cancellation may change reservation statuses.
- Invalidate dashboard report data after cancellation or deletion where totals could be affected.
- Do not clear unrelated auth/profile data.

Keep centralized mutation hooks inside the lifecycle feature. Cards should receive callbacks/state rather than contain fetch calls.

## Required UI states

- Ready actions for each allowed status.
- Per-listing pending state with other listings still usable.
- Cancel confirmation and delete inline-confirmation states.
- Successful status/ration/delete announcement.
- Validation, conflict, not-found, session-expired, and generic failure recovery.
- Read-only closed or pending-cancellation state.

## Tests

Use MSW and user-event to cover:

- Active card exposes pause/cancel; paused exposes resume/cancel.
- Closed and pending listings expose no invalid transitions.
- Exact case-sensitive request bodies for Active, Paused, and Cancelled.
- Resume disabled at zero remaining quantity.
- Cancel dialog focus, Escape, keep action, confirm action, and explanatory copy.
- Rare UI delete confirmation, eligibility, 204 handling, and failure recovery.
- Ration 0, valid positive ration, and both upper-bound errors.
- PerRequest ration editor is unavailable.
- Double-click cannot send duplicate mutations.
- 401, 404, conflict, validation, and generic server errors take distinct paths.
- Correct list/detail/history/report invalidation occurs after each successful action.
- Reduced motion leaves every confirmation fully operable.

## Acceptance criteria

- UI actions exactly follow the transition matrix.
- Destructive actions cannot occur from a single accidental click.
- No optimistic state falsely claims cancellation or deletion.
- Mutation failures preserve the listing and provide a recovery path.
- Current/past grouping and downstream history refresh after relevant changes.
- All controls meet target-size, focus, keyboard, and reduced-motion requirements.

## Required verification

```bash
pnpm --filter frontend lint
pnpm --filter frontend build
pnpm --filter frontend test
```

## Handoff

Document mutation hooks, status matrix, confirmation behavior, invalidation map, exact requests tested, and any backend messages that required UI mapping.
