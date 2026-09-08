# AFF Donor Frontend Prompt Pack

This folder contains implementation prompts for the donor dashboard and donation features. Assign one numbered file to one frontend developer or coding agent. Execute the files in dependency order and treat each file as a complete task brief.

## Objective

Coordinate a frontend team from the simplest shared foundation through the most advanced integrated donor workflows while keeping visual, API, testing, and ownership decisions consistent.

## Source of truth

- Product and visual reference: Canva design `DAHQGSF3ktQ`, slides 15–30, for context the slides are here https://www.canva.com/design/DAHQGSF3ktQ/tejdzNlJRRcrZlpSmvNtFQ/edit.
- Live API source of truth: `backend/src/modules/donation`, `backend/src/modules/donorReport`, and their mounted routes.
- Repository rules: root `AGENTS.md`.
- Frontend baseline: React 19, Javascript, and Vite 8 in `frontend/`.
- Backend changes are outside this prompt pack.

When the Canva wording conflicts with the live backend contract, use the backend contract and record the UI wording adjustment in the pull request.

## Visual system

Use Inter throughout the donor area. Implement these values as semantic CSS variables and Tailwind theme tokens:

| Token             |     Value | Usage                                |
| ----------------- | --------: | ------------------------------------ |
| `--aff-bg`        | `#F7F4E9` | Page background                      |
| `--aff-panel`     | `#FBFAF4` | Cards, forms, and panels             |
| `--aff-text`      | `#293326` | Primary copy                         |
| `--aff-primary`   | `#416734` | Main buttons and section bars        |
| `--aff-primary-2` | `#557E3C` | Hover and secondary green            |
| `--aff-accent`    | `#78A63B` | Active states and positive metrics   |
| `--aff-danger`    | `#B56543` | Cancellation and destructive actions |
| `--aff-warning`   | `#EADBA9` | Warnings and Per Request notices     |
| `--aff-border`    | `#D4D6C7` | Dividers and control borders         |
| `--aff-muted`     | `#727A6A` | Secondary copy                       |

The desktop layout should closely match the Canva composition. Responsive adaptations must preserve the same hierarchy rather than scaling the desktop canvas down.

## Required stack

- React 19, JavaScript, Vite, and pnpm.
- React Router for donor routes and client-side navigation.
- TanStack Query for server state management, caching, mutations, and query invalidation.
- React Hook Form and Zod for form handling and runtime validation.
- Tailwind CSS and shadcn-compatible source components.
- Rare UI Animated Counter and Delete Button, copied into `src/components/ui` through the shadcn CLI and themed with AFF design tokens.
- `motion` for Rare UI animations, with `prefers-reduced-motion` support.
- Recharts for accessible chart rendering and Lucide React for icons.
- Vitest, React Testing Library, user-event, MSW, Playwright, and axe checks for unit, integration, accessibility, and end-to-end testing.
- ESLint and Prettier for JavaScript code quality and consistent formatting.

Rare UI components are source files owned directly by this repository rather than runtime component-library dependencies. Review generated source before committing it and keep only the components actually used by the donor experience.

Use `.js` and `.jsx` files throughout the frontend. Do not introduce TypeScript, `.ts`, or `.tsx` files.

## API contract summary

All protected calls use `credentials: "include"`. During local development, Vite proxies `/api` to `http://localhost:3000`.

| Method   | Path                                            | Purpose                                      |
| -------- | ----------------------------------------------- | -------------------------------------------- |
| `GET`    | `/api/auth/me`                                  | Restore the authenticated donor session      |
| `GET`    | `/api/donor/food-listings`                      | List the donor's listings                    |
| `POST`   | `/api/donor/food-listings`                      | Create a listing                             |
| `GET`    | `/api/donor/food-listings/:id`                  | Read one owned listing                       |
| `PATCH`  | `/api/donor/food-listings/:id`                  | Edit an open listing                         |
| `DELETE` | `/api/donor/food-listings/:id`                  | Delete an eligible listing                   |
| `POST`   | `/api/donor/food-listings/:id/duplicate`        | Duplicate configuration into a fresh listing |
| `PATCH`  | `/api/donor/food-listings/:id/status`           | Pause, resume, or cancel                     |
| `PATCH`  | `/api/donor/food-listings/:id/ration`           | Change the per-recipient ration              |
| `POST`   | `/api/donor/food-listings/:id/manual-donations` | Record a direct handoff                      |
| `GET`    | `/api/donor/food-listings/:id/donations`        | Read reservation and handoff history         |
| `GET`    | `/api/donor/reports/dashboard`                  | Read dashboard statistics                    |

Use exact wire values:

```ts
/**
 * @typedef {
 *   "Active" |
 *   "Paused" |
 *   "PendingCancellation" |
 *   "Cancelled" |
 *   "SoldOut"
 * } DonationStatus
 */
export const DonationStatus = Object.freeze({
  ACTIVE: "Active",
  PAUSED: "Paused",
  PENDING_CANCELLATION: "PendingCancellation",
  CANCELLED: "Cancelled",
  SOLD_OUT: "SoldOut",
});

/**
 * @typedef {
 *   "KG" |
 *   "G" |
 *   "L" |
 *   "ML" |
 *   "Unit" |
 *   "PerRequest"
 * } MeasurementUnit
 */
export const MeasurementUnit = Object.freeze({
  KG: "KG",
  G: "G",
  L: "L",
  ML: "ML",
  UNIT: "Unit",
  PER_REQUEST: "PerRequest",
});

/**
 * @typedef {
 *   "Fruit" |
 *   "Vegetable" |
 *   "Meat" |
 *   "CookedDish" |
 *   "BakedGoods" |
 *   "Drink"
 * } FoodCategory
 */
export const FoodCategory = Object.freeze({
  FRUIT: "Fruit",
  VEGETABLE: "Vegetable",
  MEAT: "Meat",
  COOKED_DISH: "CookedDish",
  BAKED_GOODS: "BakedGoods",
  DRINK: "Drink",
});
```

UI labels may be friendlier, but the API values are case-sensitive. Normalize a listing identifier with `id = listing.id ?? listing._id` at the API boundary.

## Known contract gaps

Do not hide or work around these gaps:

- Listing image and pickup location are present in the Canva form but absent from the donation schema and endpoints. Allow local preview only, label it clearly, and omit both fields from request payloads.
- No donor-accessible recipient search or wallet-balance endpoint exists. Wallet selection may be demonstrated with preview data, but production submission stays disabled unless a real `recipientProfileId` is available.
- Dashboard statistics expose totals and category/unit breakdowns, but not previous-period deltas or revenue time series. Never synthesize these as live data.
- The current donor report route does not attach the donor authentication/profile middleware used by listing routes. The frontend must show the independent statistics failure state and log this as a backend dependency; client-provided IDs or custom headers are forbidden.
- Reservation history supports only `page` and `limit`. Search, status, and sort controls are client-side over the loaded set and must not be described as server filters.
- Slide 22 is the canonical quantity-exceeded state. Slide 23 repeats the valid decimal-quantity state despite its title.
- The Canva manual-entry copy calls recipient name optional, but the live validator requires a non-empty `recipientName`. The frontend field must be required.

Preview-only behavior is guarded by `VITE_ENABLE_DONATION_PREVIEW_DATA=false`. When enabled locally, every preview surface must show a visible “Preview data” badge. Preview fields never enter live API payloads.

## Work allocation and dependencies

```text
01 Foundation
  └─ 02 Shell and navigation
      ├─ 03 Dashboard listings
      │   ├─ 05 Lifecycle actions
      │   ├─ 06 Create, edit, duplicate
      │   ├─ 07 Manual donation entry
      │   └─ 08 Reservation history
      └─ 04 Dashboard statistics

03–08 complete
  └─ 09 Responsive, accessibility, and E2E integration
```

- Complete and merge 01 before any feature task.
- Complete 02 before page-level feature work.
- Tasks 03 and 04 may run in parallel.
- Tasks 05–08 may run in parallel after 03 establishes shared listing components and query keys.
- Run 09 only after all feature branches have been integrated.

## Ownership boundaries

- 01 owns application bootstrapping, shared API infrastructure, design tokens, test setup, and generated Rare UI source.
- 02 owns the donor layout, navigation, auth guard, route declarations, and route-level boundaries.
- 03 owns dashboard listing queries, listing cards, filters, pagination, and dashboard empty states.
- 04 owns reports queries, statistic cards, breakdown visualizations, and report states.
- 05 owns lifecycle and ration mutations plus confirmation UI.
- 06 owns listing form schemas, create/edit pages, duplication flow, and preview fields.
- 07 owns manual-donation pages, modal/form logic, payment calculation, and related mutations.
- 08 owns reservation-history queries, table/card presentation, and preview overbooking state.
- 09 owns E2E fixtures/specs and coordinated cross-feature corrections. It must not silently redesign feature-owned components.

If a shared file must change outside the assigned boundary, coordinate with its owner and explain the overlap in the pull request.

## Definition of done for every prompt

- The assigned behavior works with live endpoints wherever a contract exists.
- Loading, empty, error, validation, retry, and success states are implemented.
- Preview data is explicit and cannot be mistaken for a saved server result.
- Components are responsive, keyboard operable, and screen-reader understandable.
- Query keys and invalidations prevent stale listing, report, and reservation data.
- Unit and MSW integration tests cover the new behavior.
- `pnpm --filter frontend lint`, `pnpm --filter frontend build`, and the relevant tests pass.
- The pull request includes screenshots at required viewports and lists remaining backend dependencies.

## Prompt execution rule

Each numbered file below is a standalone implementation prompt. The assignee must inspect the current branch before editing, preserve unrelated work, implement only the stated scope, run the required checks, and report exact files changed, tests run, and unresolved contract gaps.
