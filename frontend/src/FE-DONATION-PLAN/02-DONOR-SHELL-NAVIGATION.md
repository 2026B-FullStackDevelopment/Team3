# Prompt 02: Donor Shell and Navigation

## Role and objective

You own the authenticated donor application shell. Build the page frame, donor role guard, route declarations, desktop navigation, mobile navigation, route-level loading/error behavior, and logout interaction shown across Canva slides 15–30.

Do not implement dashboard, listing, statistics, manual-entry, or reservation business logic in this task.

## Prerequisites

- Prompt 01 must be merged.
- Read the prompt-pack README and inspect the current route/provider structure.
- Confirm `/api/auth/me` and `/api/auth/logout` response handling from the backend before typing frontend contracts.
- Coordinate route exports with the owners of Prompts 03–08.

## Permitted scope

- Donor layout and navigation components.
- Route definitions and route placeholders.
- Auth-session query and role guard.
- Shared route error/loading/not-authorized/session-expired surfaces.
- Shell-specific tests.

Do not build login/register pages. `/login` is an external route dependency owned by the identity frontend.

## API contracts

- `GET /api/auth/me` restores the current cookie-authenticated user.
- `POST /api/auth/logout` revokes the current session and clears the cookie server-side.
- Both requests use the shared API client and `credentials: 'include'`.
- Do not add token, donor ID, or role data to request headers.

## Required routes

Declare these routes beneath an authenticated donor layout:

| Route | Navigation purpose |
|---|---|
| `/donor/dashboard` | Dashboard overview |
| `/donor/listings` | My Listing |
| `/donor/listings/new` | Create listing |
| `/donor/listings/:listingId/edit` | Edit listing |
| `/donor/listings/:listingId/reservations` | One listing's reservation details |
| `/donor/reservations` | Reservation listing selector |
| `/donor/manual-donations` | Entries/manual handoff flow |

Redirect `/donor` to `/donor/dashboard`. Render an accessible not-found page for unknown donor routes.

## Authentication behavior

- Load `/api/auth/me` before rendering protected content.
- Permit only a current user whose exact role is `Donor`.
- On 401, clear donor queries and navigate to `/login` with replace navigation and a `returnTo` location state.
- On an authenticated non-donor response, show a not-authorized page; do not briefly render donor data.
- On network/5xx failure, show a retryable session-check error rather than redirecting to login.
- Never read or store the auth cookie or token in JavaScript.
- Logout calls `POST /api/auth/logout`, clears all query data, then navigates to `/login`.

## Shell layout

Match the Canva header:

- AFF mark on the left.
- Centered pill navigation on desktop.
- Labels: Dashboard, My Listing, Reservation, Entries.
- Logout icon/button on the right with an accessible name.
- Active route is indicated by color, shape, and `aria-current="page"`, not color alone.
- Page content uses a centered responsive container and the cream AFF background.

Route-to-nav mapping:

- Dashboard active for `/donor/dashboard`.
- My Listing active for all `/donor/listings` routes except the reservation-detail route.
- Reservation active for `/donor/reservations` and `/donor/listings/:listingId/reservations`.
- Entries active for `/donor/manual-donations`.

## Responsive behavior

- At tablet/mobile width, replace the centered pill group with an accessible menu button and focus-managed drawer/sheet.
- Keep the AFF mark and logout/session action visible.
- Close the menu on route change, Escape, or outside interaction.
- Return focus to the menu trigger after closing.
- Do not use hover-only navigation or hide labels behind unexplained icons.
- Maintain 44px minimum targets.

Use AFF tokens and restrained motion. A custom mobile drawer is acceptable; do not force a Rare UI navigation component if it changes the Canva information hierarchy.

## Route boundaries and placeholders

- Add a suspense/loading shell that preserves header geometry.
- Add one route error boundary that displays a friendly error, retry action when safe, and a link back to the dashboard.
- Provide typed placeholder components for feature routes so this branch compiles before downstream merges.
- Make placeholders easy for feature owners to replace without editing the donor layout.
- Add a skip link targeting the main content region.

## Required UI states

- Session checking with stable shell geometry.
- Authenticated donor shell.
- Session expired redirect.
- Authenticated but unauthorized role.
- Retryable session-service/network failure.
- Unknown donor route.
- Logout pending and logout failure without duplicate submission.

## Query-key contract

Create or adopt centralized query-key factories without implementing the feature queries:

```ts
donorKeys.session()
donationKeys.all()
donationKeys.list(filters)
donationKeys.detail(listingId)
donationKeys.history(listingId, page, limit)
donorReportKeys.dashboard(period)
```

Feature teams must import these factories rather than inventing string keys.

## Tests

Use MSW and MemoryRouter to cover:

- Donor session renders the shell and correct active item.
- `/donor` redirects to the dashboard.
- 401 redirects to `/login` without donor content flashing.
- Non-donor role shows not-authorized.
- 5xx session failure offers retry and does not redirect.
- Logout calls the server, clears query data, and navigates away.
- Mobile menu opens, traps/follows focus correctly, closes on Escape, and closes after navigation.
- Keyboard users can reach the skip link, navigation, logout, and main content.

## Acceptance criteria

- Every required donor URL renders inside the same protected shell.
- Active navigation remains correct on nested listing routes.
- No token or donor profile ID is stored client-side for authentication.
- Loading, 401, 403, 404, and network errors have distinct behavior.
- Desktop and mobile navigation meet the design and accessibility requirements.
- Downstream feature owners can replace placeholders without restructuring the shell.

## Required verification

```bash
pnpm --filter frontend lint
pnpm --filter frontend build
pnpm --filter frontend test
```

## Handoff

List the route table, exported layout/query-key interfaces, tests run, and the identity-team dependency for `/login`. Do not implement feature-page data calls in this branch.
