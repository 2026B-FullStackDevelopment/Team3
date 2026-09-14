# Architecture Notes — Admin & Audit Log Module

Gitignored, personal reference. Points at the **current** files on disk — no
history, no "found on day X." If a path or claim below goes stale (renamed,
moved, function deleted), fix the entry or delete it; this file should only
ever describe what's actually there right now.

`SESSION_NOTES.md` (also gitignored) is the chronological build log with
full interview Q&A, if you need the "why did we do it this way" story in
more depth than the one-liners here.

---

## 1. Module layout

There is **no separate `admin` "domain" module and `auditLog` module** —
one module, `backend/src/modules/admin/`, owns the AuditLog data. "Admin" is
a role, not a bounded context of its own; account/donation mutations the
Admin performs actually live in the `identity` and `donation` modules and
get called *into* from here.

```
backend/src/modules/admin/
  models/AuditLog.js
  repositories/auditLog.repository.js
  services/auditLog.service.js
  controllers/auditLog.controller.js
  routes/auditLog.routes.js
```

Cross-module calls go through each module's public surface, never a raw
import of internals:
- `backend/src/modules/identity/index.js` — facade `identity` calls through
- `backend/src/modules/donation/interfaces/donorListing.interface.js` —
  interface `donation` calls through

---

## 2. `backend/src/modules/admin/repositories/auditLog.repository.js`

Five plain functions (`create`, `findById`, `findExpiredPending`,
`updateStatus`, `findAll`) — no query-builder, no generic base-repository
class.

- `findExpiredPending()` filters `status: Pending, undoDeadline: { $lte: now,
  $ne: null }`. The `$ne: null` matters: MongoDB's BSON type ordering ranks
  `null` below any real `Date`, so without it, entries that never had a
  deadline would incorrectly match `$lte`.
- `updateStatus()` uses `findByIdAndUpdate` (one atomic round trip), not
  `findById()` + `.save()` — avoids a race between the sweep/finalize path
  and an admin's undo click landing in the same window.
- `findAll()` supports both `adminId` (scalar) and `adminIds` (array, from
  email search) and **intersects them** when both are present, rather than
  one overriding the other.

## 3. `backend/src/modules/admin/services/auditLog.service.js`

- `createAuditLog` does **not** re-verify `adminId`/`targetId` exist — that's
  already proven by the action succeeding through the target module's
  interface a moment earlier. Re-checking would be redundant and a race risk
  (a legit entry could get rejected if the target vanished in the tiny gap
  between the two checks).
- Every read returns a DTO via `toAuditLogDTO` — nothing outside this
  service sees a raw Mongoose document.
- `listAuditLogs` clamps `page`/`limit` (default 1/20, cap 100), rejects
  unrecognized `targetType`/`status` loudly, and accepts `search` — resolves
  to `adminIds` via `findAdminIdsByEmailLike` (identity), short-circuits to
  zero results if the email matches no admin, then joins each returned
  entry's `adminEmail` via a batch `withAdminEmails()` helper.
- `undoAction()` validates the entry is still `Pending` and its deadline
  hasn't passed, then branches on `action`: `DeactivateUser`/`ReactivateUser`
  call the identity facade's opposite method; `CancelDonation` calls
  `donation.reinstateDonation` (see §6 — cheap, since cancel never mutated
  anything but the donation's own status). All three run inside one
  transaction with the `AuditLog` status flip to `Undone`. The
  `NotImplementedError` branch is now a pure defensive fallback for a future
  action type added without an undo path — not a real code path today.
- `finalizeExpiredEntries()` **is now wired** — `backend/src/jobs/
  auditLogSweep.job.js` calls it on a plain `setInterval`
  (`env.admin.sweepIntervalMs`, default 60s), started once from `index.js`'s
  `startServer()` after `connectDatabase()`. It branches per entry, not one
  shape for all three actions: `DeactivateUser`/`ReactivateUser` just need
  their `AuditLog` row flipped to `Finalized` (the real effect already
  happened at action time). `CancelDonation` needs a real domain mutation
  first — `donation.finalizeCancellation` (§6), transaction-wrapped with the
  status flip — since cancelling only ever created a limbo state, not the
  real thing.
- `listAuditLogs` filters by `targetType` (`User`/`Donation` — two values),
  **not** `actionType` (`DeactivateUser`/`ReactivateUser`/`CancelDonation` —
  three values). The frontend's Action Type dropdown sends `actionType`,
  which this function doesn't read — see §7.

## 4. `backend/src/modules/admin/controllers/auditLog.controller.js` +
   `routes/auditLog.routes.js`

- Route guard order matters and is explicit:
  `auditLogRoutes.use(requireAuth); auditLogRoutes.use(requireRole(Admin))`
  — `requireRole` only reads `req.user`, which `requireAuth` is the one that
  populates.
- Mounted at `/api/admin` (not `/api/admin/audit-logs`) — also serves the
  account/donation admin endpoints this controller exposes.

---

## 5. Account management — `backend/src/modules/identity/`

- `services/account.service.js` — `listAccounts`, `deactivateAccount`,
  `reactivateAccount`, `getDonorProfilesByIds`, `findDonorProfileIdsByName`,
  `getUsersByIds`, `findAdminIdsByEmailLike` (wraps
  `repositories/user.repository.js`'s `findAdminIdsByEmailLike`, which is
  itself scoped to `role: Admin` — `AuditLog.adminId` can only ever be an
  Admin's id, so a Donor/Recipient email can never match).
  All exposed through `identity/index.js`.
- **This is a separate file from `auth.service.js`/`profile.service.js`** —
  those cover a user managing their *own* account; an Admin managing
  someone else's is kept separate even though all three touch `User`.
- `listAccounts` is **hard-restricted to `role: [Recipient, Donor]`** —
  filtering by `Admin` throws `ValidationError`. Admin accounts never come
  back from this endpoint at all.
- `deactivateAccount` throws `ForbiddenError` if `role === Admin` — an Admin
  can never deactivate another Admin.
- Username display resolves to `RecipientProfile.userName` OR
  `DonorProfile.companyName` (Donors have no username field — 1B
  registration only collects Company Name) — done in
  `identity/dtos/accountSummary.dto.js`.
- `repositories/donorProfile.repository.js` has its own, **different**
  `findByIds` (DonorProfile collection) — don't confuse it with
  `user.repository.js`'s `findByIds` (User collection). Same name, different
  data.
- `repositories/donorProfile.repository.js`'s `findIdsByCompanyNameLike` is
  what `account.service.js` wraps and re-exports as
  `findDonorProfileIdsByName` — naming diverges one layer down; if you're
  tracing a call and the names don't match, that's why.

---

## 6. Donation admin actions — `backend/src/modules/donation/`

**Admin cancel is a limbo/finalize model, not an immediate cancel** — this
is the one place Admin's undo isn't a simple direct inverse (contrast §5's
deactivate/reactivate, which are). Three functions in
`services/donorListing.service.js`, all exposed through
`interfaces/donorListing.interface.js`:

- `adminCancelDonation(id, options)` — only allows `Active →
  PendingCancellation` (SRS 7.2.2's literal "cancel any **active**
  listing"). Does **not** touch reservations and needs no transaction (one
  write). `PendingCancellation` is a pre-existing `DonationStatus` enum
  value that had no caller before this — see the note at the bottom of this
  section.
- `reinstateDonation(id, options)` — the undo path (`PendingCancellation →
  Active`), called by `undoAction` (§3) within the window. Trivial: since
  cancel never cascaded anything, undo is just flipping the status back.
- `finalizeCancellation(id, options)` — the real cancel, run by the sweep
  (§3, §7) once the window expires unactioned: `PendingCancellation →
  Cancelled` + `closedAt`, **then** cascades
  `reservationRepository.cancelActiveReservationsForDonation` (Reserved →
  CancelledByDonor) inside the same transaction. This is the one call site
  that still does what `adminCancelDonation` used to do immediately.

Why the deferral: it makes undo trivial (nothing to reverse) instead of
needing to capture which reservations got cascaded and reverse exactly
those, at the cost of the real cancellation not taking effect until the
window closes. `adminCancelDonation`'s admin-service caller (§3) still reads
the donation once itself first (to snapshot `previousState` for the
`AuditLog` entry) before calling into this — same
snapshot-for-log-vs-re-check-at-write-time split as §5, just one layer
removed from the actual "real" cancel now.

Donor-side guards updated to also reject a `PendingCancellation` listing,
same as they already reject `Cancelled`/`SoldOut`: `updateDonation`,
`updateDonationRation`, `deleteDonation` (this last one is a new guard —
previously only checked `revenue > 0`). `changeDonationStatus`'s own
transition table needs no entry for `PendingCancellation` —
`ALLOWED_STATUS_TRANSITIONS[donation.status] ?? []` already defaults to "no
transitions allowed" for a status with no table entry.

**Found but not wired to this flow**: `donorListing.repository.js` already
had `markPendingCancellation(id, donorProfileId)` (owner-scoped, via
`updateDonationStatus`) sitting unused before any of the above was built —
looks like groundwork for the donor's own self-cancel-with-grace-period
flow (SRS 4.2.3) that was never finished. Admin's cancel needed its own
non-owner-scoped path instead (`donationRepository.updateById`, not
`updateOwnedDonation`), so this helper is still unused. Whoever picks up
donor self-cancel should check it before writing a new one.

- `services/donorListing.service.js` — `listActiveListingsForAdmin`, called
  by the admin module for SRS 7.3.1/7.3.2, also exposed through the same
  interface.
- `repositories/donorListing.repository.js`:
  - `findActiveDonations` **hardcodes `status: Active` and
    `minRemainingQuantity: 1`** on every query. Paused/Cancelled/
    PendingCancellation listings can never be returned by this path, full
    stop — this is now load-bearing, not just a constraint: it's the entire
    reason a `PendingCancellation` listing disappears from Listing
    Moderation and the recipient browse page for free, with zero extra
    filtering code needed in either.
  - `buildDonationQuery` (not exported — private helper) defaults
    `query.status = { $ne: PendingCancellation }` whenever neither `status`
    nor `statuses` is given — the one place that needed an explicit change,
    since the donor's own unfiltered listing view isn't behind a hardcoded
    `status: Active` like the two views above. An explicit
    `?status=PendingCancellation` still overrides this.
  - `buildDonationQuery` also accepts `search`
    (regex on the listing's own name), `donorProfileIds` (plural — **ANDs**
    against everything else when present), and `searchDonorProfileIds`
    (plural, a **separate** field from `donorProfileIds` — **ORs** against
    the name-search instead of ANDing). These two plural fields look similar
    but combine differently on purpose; don't merge them.
  - The `search`/`searchDonorProfileIds` `$or` does **not** short-circuit to
    empty results when zero donors match — unlike the admin-email search
    (§3), the grocery-name half of the `$or` can still legitimately match on
    its own, so an early return here would be a correctness bug, not an
    optimization.

---

## 7. Shared backend pieces

- `middleware/role.js` — `requireRole(...roles)`, reads `req.user.role`.
- `middleware/auth.js` — `requireAuth`, populates `req.user`. Must run
  before `requireRole` on every route (see §4).
- `middleware/error.js` — central handler, reads `err.statusCode` off
  whichever error class was thrown.
- `shared/errors/errors.js` — `DomainError` base, plus one class per status
  code: `NotFoundError`(404), `ConflictError`(409), `ForbiddenError`(403),
  `UnauthorizedError`(401, not logged in — different fix than 403, which is
  logged in but wrong role), `ValidationError`(400), `NotImplementedError`
  (501). Add new error types the same way — one class per status, not a
  generic "access denied."
- `config/env.js` reads `dbUri: required("MONGODB_URI")` — matches
  `.env.example` and `config/database.js`'s error message now; the earlier
  `MONGODB_URI_TEST` mismatch is fixed.
- `backend/src/jobs/auditLogSweep.job.js` — `startAuditLogSweep()`, a plain
  `setInterval` (not `node-cron` — the requirement is "every N seconds
  forever," not calendar scheduling, so a cron-expression parser would be a
  dependency for syntax nothing here uses). Called once from `index.js`'s
  `startServer()`, after `connectDatabase()`. See §3 for what it actually
  does per entry.
- **Admin/role route guards are restored** —
  `auditLogRoutes.use(requireAuth); auditLogRoutes.use(requireRole(Admin))`
  in `admin/routes/auditLog.routes.js`, and `RequireRole` back on the
  frontend's `/admin` route group (`routes/index.jsx`). These had been
  commented out for cross-team testing before login existed; restoring them
  also fixes the "every admin mutation 500s" issue below, since `req.user`
  is populated again. Confirmed with `curl`: an unauthenticated
  `GET /api/admin/accounts` now correctly 401s instead of 500ing. The
  separate top-level `ProtectedRoute` bypass (gates donor/recipient too,
  not admin-specific) is still commented out — untouched, and not needed
  for admin correctness since `RequireRole` already redirects an anonymous
  session to `/login` on its own.
- **This means every admin mutation now requires a real Admin session** —
  no login flow has been exercised against these buttons yet (the dev
  clicks so far all predate the guard restore). Confirm an actual
  Admin-role login + cookie flow works before assuming Deactivate/
  Reactivate/Cancel/Undo succeed for a real user, not just that they
  correctly error without one.
- **Git tracks a case-duplicate path**:
  `reservation/repositories/ReservationRepository.js` and
  `reservationRepository.js` are both in the index, resolving to the same
  physical file on a case-insensitive filesystem (Windows/macOS) — harmless
  there, but would materialize as two files (one stale) on a case-sensitive
  checkout (Linux CI). The only real import in the codebase uses the
  lowercase path. Not fixed — resolving a git-index case collision cleanly
  needs a deliberate step, not a normal `git add`.

---

## 8. Frontend

```
frontend/src/routes/index.jsx                         — route table
frontend/src/routes/layouts/AdminShell.jsx             — sidebar shell for /admin/*
frontend/src/routes/layouts/RoleLayout.jsx             — top-navbar shell for donor/recipient (untouched by AdminShell)
frontend/src/routes/pages/Placeholder.jsx              — reused by unbuilt routes
frontend/src/config/api/httpClient.js                  — hand-rolled fetch wrapper
frontend/src/config/api/routes/admin.routes.js         — admin endpoint paths (in-code comment still marks it "Skeleton")
frontend/src/shared/components/Pagination.jsx          — only shared UI piece across the 3 admin pages
frontend/src/shared/utils/format.js                    — formatVND, formatShortDate

frontend/src/features/admin/
  services/accountService.js    — getAccounts, deactivateAccount, reactivateAccount
  services/donationService.js   — getListings, cancelListing
  services/auditLogService.js   — getAuditLogs, undoAuditLogEntry
  hooks/useAccounts.js          — + handleDeactivate/handleReactivate, actingAccountIds, accountActionErrors
  hooks/useListings.js          — + handleCancel, actingListingIds, listingActionErrors
  hooks/useAuditLog.js          — + handleUndo, actingLogIds, logActionErrors
  pages/UserManagementPage.jsx
  pages/ListingModerationPage.jsx
  pages/AuditLogPage.jsx
```

- `AdminShell.jsx` is its own component, not a branch inside `RoleLayout` —
  the admin design is a persistent sidebar, a different layout shape than
  `RoleLayout`'s top bar, and `RoleLayout`'s own comment says it was built
  specifically to replace per-role-branching shells. Static "AFF" wordmark
  reuses the existing `Brand` component (already had a real logo asset —
  nothing new to build there).
- `/admin` redirects to `/admin/listing-moderation` (`routes/index.jsx`) —
  no design has a distinct Admin "home"; the three page routes are the only
  real destinations.
- Three separate hooks, not one generic `useAdminList(service, filters)` —
  each view's filter shape genuinely differs (accounts: status+role;
  listings: search only; audit log: status+actionType).
- In each hook, a filter-setter and the page-1 reset are batched into the
  **same** `setState` call (not a separate effect watching filters) — a
  separate reset effect would let one fetch fire with the old page number
  before the reset lands, and if that stale request resolves after the
  correct one, it silently overwrites good data. Batching guarantees exactly
  one fetch per filter change.
- **`result.error` is never a bare string** — it's the backend's
  `{ error, message }` body (`middleware/error.js`), a raw `Error` on a
  network failure, or `null` with no body at all. Every hook reads
  `result.error?.message`, matching the convention already established in
  `identity/Hook/identityHook.js`. This was a real, previously-shipped bug
  (`result.error || 'fallback'`) that only surfaced once a per-row action
  error actually got rendered — React throws hard on "Objects are not valid
  as a React child," it doesn't silently stringify. Caught by actually
  clicking a real button against a running backend, not by reading the code.
- Mutations follow one shape across all three hooks: a per-row `Set` of
  in-flight ids (`actingXIds`) and a per-row error map (`xActionErrors`),
  both keyed by the row's own id — clicking one row never disables or
  spinners another. On success, `useAccounts` replaces the row with the
  server's response directly (deactivate/reactivate take effect
  immediately, so that response already is the row's new truth);
  `useListings` refetches instead (a cancelled listing lands in
  `PendingCancellation` limbo, not `Cancelled` — see §6 — and this hook's
  own query already only asks for `Active`, so the correct result is the
  row disappearing, not getting relabelled to a status it doesn't have
  yet); `useAuditLog` patches only the row's `status` field to `Undone`
  (the two `undoAuditLogEntry` branches return different shapes — an
  Account vs. an AuditLog entry — so patching just the one field every
  caller needs sidesteps reconciling those). None of the three poll or do
  optimistic-then-rollback; all just await the call, then update.
- `useAuditLog`'s `handleUndo` calls `auditLogService.undoAuditLogEntry`,
  which itself branches on `action` (see §10's "undo dispatch doesn't have
  to be symmetric"): `DeactivateUser`/`ReactivateUser` call
  `accountService.reactivateAccount`/`deactivateAccount` directly — the
  exact same functions `UserManagementPage`'s own buttons call, not a
  separate undo endpoint; `CancelDonation` calls the dedicated
  `POST .../audit-logs/:id/undo` route instead, since there's no
  "reactivate listing" function anywhere to call symmetrically (§6). The
  hook itself doesn't branch on anything — it just awaits whatever that
  service function decides to call and patches `status` on success either
  way.
- Only `Pagination` is shared — pure page-number math, no domain knowledge.
  Tables and filter bars stay local to each page file; columns/filters
  genuinely differ per screen, and a shared table would need
  column-definition/render-prop machinery. Rule for extracting anything
  else to `shared/`: does it know what a business object is, not just
  "does the markup look similar."
- `UserManagementPage.jsx` — `STATUS_DISPLAY` maps the real
  `Deactivated` enum value to the copy `"Inactive"` **only at render
  time**; the value in state/sent to the backend stays the real enum. Role
  filter offers only Donor/Recipient — matches `listAccounts`'s hard
  restriction (§5); adding "Admin" as an option would be a dropdown value
  that always 400s. Deactivate/Reactivate call `window.confirm(...)` before
  firing — no confirm-dialog component exists elsewhere to justify building
  one for this.
- `ListingModerationPage.jsx` — price via `formatVND` (₫), not `$` —
  listings are genuinely priced/stored in VND. Cancel button hidden once a
  row is `Cancelled` (unchanged condition from before Cancel was wired —
  a `PendingCancellation` row never reaches this table at all, per §6, so
  there was never a "hide during limbo" case to add). `Paused` uses
  Tailwind's stock `amber-700` (no custom `@theme` token needed — Tailwind
  v4's `@theme` only adds colors, doesn't remove the default palette).
- `AuditLogPage.jsx` — `formatLogTimestamp` (date+year+time) is local to
  this file, not in `shared/utils/format.js` — no second page needs the
  full format yet. Admin column renders `entry.adminEmail` (falls back to
  `entry.adminId` if a user record is missing). "Already Undone" renders
  `text-blue-600`, matching the Status column's own color for `Undone` —
  fixed from a plain gray `text-muted` that pre-dated the Undo wiring.
  "Expired" stays `text-muted`/gray and is never triggered from this page —
  that transition belongs entirely to the backend sweep (§3, §7); nothing
  client-side computes or counts down to it.
- All three pages now call real mutations, gated behind a plain
  `window.confirm(...)` — deliberately not a modal component. A generic
  `Modal` exists (`shared/components/Modal/`, used for the login lockout
  notice) but nothing in the app has an established "are you sure?"
  confirm-dialog pattern to reuse, and this scope didn't call for building
  one.
- Every fetch effect carries
  `// eslint-disable-next-line react-hooks/set-state-in-effect` — the
  installed `eslint-plugin-react-hooks` v7 rule flags the standard
  fetch-on-mount/dep-change shape too, not just the antipattern it's meant
  for (deriving state from props during render).

---

## 9. Current known gaps (check before assuming these work)

Deactivate/Reactivate/Cancel/Undo have all now been exercised end-to-end
with a real logged-in Admin session (real login form, restored guards, real
backend, throwaway data cleaned up after) — not just faked network
responses. Confirmed correct in the database itself, not just on-screen,
except for gap #1 below.

1. **Undoing a DeactivateUser/ReactivateUser entry never marks that
   *original* entry `Undone` in the database.** Clicking Undo on a
   `DeactivateUser` entry correctly reactivates the account (verified in
   the DB) — but does so by calling `accountService.reactivateAccount`
   directly (§8's asymmetric dispatch, §10), which creates a **new**
   `ReactivateUser` audit entry rather than touching the original one. The
   original stays `Pending` forever, until its own `undoDeadline` passes
   and the sweep finalizes it — even though the account was already
   reversed. The frontend's local patch (`status: 'Undone'`) makes the
   *current* browser session look right; a refresh reveals the original
   entry still `Pending`/apparently undoable — clicking it again hits a
   `ConflictError` ("Account is already Active/Deactivated"), harmless but
   confusing. Does **not** affect `CancelDonation` — that undo path goes
   through the real dedicated `/undo` endpoint, which does correctly flip
   its own entry. Deliberately left as-is (discussed with the user) — the
   account-level effect is correct either way, and the stale entry
   self-resolves once its window expires.
2. **`identity.listAccounts` has no `status` filter** — `accountService.js`
   sends one anyway; silently ignored server-side.
3. **`listAuditLogs` filters by `targetType`, frontend sends `actionType`**
   — picking a specific action in the UI dropdown does nothing server-side.
   (§3)
4. **`pageSize` sent by the frontend is never read by the backend** — every
   list endpoint reads `limit`; harmless today only because `totalPages` is
   computed from the response's own `limit`/`total`, not the request's local
   `pageSize`.
5. **`identity/repositories/__tests__/user.repository.test.js`'s
   `updateAccountStatus` test expects options exactly `{ new: true }`**, but
   the real call always includes `session: options.session` (undefined when
   no session passed) — this test currently fails on its own, unrelated to
   any of the above.
6. **`config/api/routes/admin.routes.js` is commented as "Skeleton" in the
   file itself** — the full set of admin routes now exist and are wired
   frontend-to-backend, but the comment was never updated; don't assume a
   path is a stub just because of that label.
7. **Git tracks a case-duplicate reservation-repository path** — see §7.
   Harmless on this Windows checkout, would break on a case-sensitive one.
8. **The top-level `ProtectedRoute` bypass is still in place**
   (`routes/index.jsx`, gates donor/recipient too) — only the admin-specific
   guards were restored. Leaves an unused `ProtectedRoute` import (pre-
   existing lint error, not introduced restoring the admin guards).

Resolved since the last pass over this doc (kept here briefly so the
history doesn't just vanish — delete once nobody needs the "used to be
broken" context): `finalizeExpiredEntries` is now wired (§3, §7);
`env.js` now reads plain `MONGODB_URI`, matching everything else (§7);
`adminCancelDonation`/`findActiveDonations` being "Active-only" is no
longer a gap — it's the intended limbo design (§6), not an inconsistency.

---

## 10. Patterns used more than once (reach for these before inventing a new shape)

- **Read-side join via facade**: batch-fetch by id from another module's
  exposed interface/facade, build a Map, stitch a field onto each DTO. Used
  for `donorName` (`donation` ← `identity`, §6) and `adminEmail` (`admin` ←
  `identity`, §3).
- **Snapshot-for-log vs. re-check-at-write-time**: read once to capture
  `previousState` for an AuditLog entry, read/guard again immediately before
  the actual mutation. Used in `adminCancelDonation` (§6) and the
  deactivate/reactivate flows (§5).
- **Plural-ids-intersect-with-scalar-id**: when both a specific id filter
  and a resolved-from-search array of ids can be present, intersect them
  rather than letting one silently override the other. Used in
  `auditLog.repository.js`'s `adminId`/`adminIds` (§2) and
  `donorListing.repository.js`'s `donorProfileId`/`donorProfileIds` (§6).
- **Short-circuit-on-zero-matches is only valid when the resolved field is
  the sole match criterion.** Correct for admin-email search (§3, one
  criterion). Wrong for the listing search's `$or` (§6, two independent
  criteria) — would incorrectly return nothing when the name-search half
  could still match.
- **Presentation-layer mapping, not a new domain value** — a small,
  findable translation object (`STATUS_DISPLAY`, §8) between what the
  backend's enum says and what the UI's copy says, rather than adding a
  third status anywhere in the data model.
- **Extract to `shared/` only if domain-free** — `Pagination` (§8) vs. the
  tables that stay local.
- **Atomic single-round-trip updates over read-then-write** —
  `findByIdAndUpdate` instead of `findById()` + `.save()` anywhere two
  writers could race (§2).
- **Defer the real effect instead of doing it immediately and reversing
  it.** `adminCancelDonation` (§6) only creates a limbo state; the real
  mutation (and its reservation cascade) happens later, at finalize time,
  only if undo didn't run first. Makes undo trivial (nothing to reverse) at
  the cost of the "real" effect not being immediate. Contrast deactivate/
  reactivate (§5), which take effect immediately because they're genuinely,
  cheaply invertible — reach for deferral specifically when the forward
  action has a cascade that would be expensive or risky to reverse exactly.
- **Undo dispatch doesn't have to be symmetric.** `undoAuditLogEntry`
  (frontend, §8) and `undoAction` (backend, §3) both branch by action
  family: a cheaply-invertible action reuses its own direct inverse
  function (no dedicated "undo" concept needed); an action with cascading
  consequences goes through one dedicated undo path instead of ever getting
  a hand-rolled "reactivate" counterpart. Match the undo mechanism to
  whether a real inverse operation should exist at all, not to "make both
  paths look the same."
