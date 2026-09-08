# Prompt 01: Foundation and Design System

## Role and objective

You own the frontend foundation for the AFF donor experience. Replace the untouched Vite starter with production-ready application infrastructure that later donor modules can extend without changing their contracts.

Do not build donor dashboard features in this task. Establish routing, server-state infrastructure, design tokens, shared primitives, API types, testing, and Rare UI source components.

## Prerequisites

- Read `AGENTS.md` and `src/FE-DONATION-PLAN/00-README-EXECUTION-ORDER.md` completely.
- Confirm the frontend is still React 19 + JavaScript + Vite and inspect any changes already made by other developers.
- Use pnpm from the workspace root. Do not create a nested lockfile.
- Keep the backend unchanged.

## Permitted scope

You may change frontend package/config files and create shared files under:

- `frontend/src/app`
- `frontend/src/lib`
- `frontend/src/types`
- `frontend/src/components/ui`
- `frontend/src/test`
- `frontend/e2e`

Do not implement feature pages beyond small route placeholders needed to prove the shell boots.

## Required foundation UI states

- Application boot/loading state that does not flash Vite demo content.
- Route-level unexpected-error state with safe retry/navigation choices.
- Reusable inline loading, empty, warning, danger, and success surfaces for feature owners.
- A visibly labeled preview-data state that cannot be mistaken for a live server result.

## Required implementation

### 1. Dependencies and scripts

Add the runtime packages required by the prompt pack:

```text
react-router-dom
@tanstack/react-query
react-hook-form
zod
@hookform/resolvers
recharts
lucide-react
motion
clsx
tailwind-merge
```

Add and configure the relevant development packages:

```text
tailwindcss
@tailwindcss/vite
vitest
jsdom
@testing-library/react
@testing-library/jest-dom
@testing-library/user-event
msw
@playwright/test
@axe-core/playwright
```

Add scripts equivalent to:

- `test`: run Vitest once.
- `test:watch`: run Vitest interactively.
- `test:e2e`: run Playwright.
- `test:e2e:ui`: run Playwright UI mode.

Keep the existing dev, build, lint, and preview scripts.

### 2. Tailwind, shadcn, and aliases

- Configure Tailwind through Vite using the current supported setup.
- Add the `@/* -> ./src/*` JavaScript and Vite alias.
- Initialize shadcn-compatible component configuration in `frontend/`.
- Use the pnpm shadcn CLI to add Rare UI's `animated-counter` and `delete-button` source files from `swamimalode07/rare-ui`.
- Review generated code, remove demo-only content, and theme it using AFF variables.
- Rare UI components must inherit font, color, and focus styles rather than hard-code an unrelated palette.
- Ensure animations respect `prefers-reduced-motion` and do not block interaction.

### 3. Global styles and tokens

Remove Vite demo styling and define the visual tokens from the README. Requirements:

- Load Inter with a robust local/system fallback. Do not block rendering if a remote font fails.
- Apply `#F7F4E9` to the app background and `#293326` as default text.
- Define consistent radii, shadows, spacing, focus rings, form-control height, and a 44px minimum pointer target.
- Do not add an automatic dark theme because Canva defines a light interface only.
- Provide reusable classes or primitives for panel, section heading, muted text, success, warning, danger, skeleton, and empty-state surfaces.
- Add a visually hidden utility and skip-link styles.

### 4. Application composition

Refactor `main.jsx` to mount this provider order:

```text
StrictMode
  BrowserRouter
    QueryClientProvider
      application router
```

Create a QueryClient with conservative retry behavior:

- Retry idempotent queries once for network/5xx failures.
- Do not retry 400, 401, 403, 404, or mutation failures automatically.
- Keep previous paginated data visible while the next page loads.
- Disable refetch-on-window-focus for form-heavy donor pages.

Add a route-level error boundary and a reusable accessible status/alert component. Feature prompts will provide the actual donor pages.

## API contracts

### 5. API client

Create a typed `apiFetch` wrapper with these rules:

- Use relative `/api` URLs.
- Always set `credentials: 'include'`.
- Set JSON headers only when sending JSON.
- Accept `204 No Content` without parsing JSON.
- Parse the backend error envelope `{ error, message }` when present.
- Throw a typed `ApiError` containing status, code, message, and optional response details.
- Never attach donor IDs or bypass headers to authenticate a request.
- Support `AbortSignal` so TanStack Query can cancel obsolete requests.

Configure Vite to proxy `/api` and `/upload` to `http://localhost:3000` in development.

### 6. Shared contracts

Define and export the exact wire unions in the README plus these normalized interfaces:

```js
/** @type {DonationListing} */
const donation = {
  id: "donation-001",
  donorProfileId: "donor-001",
  name: "Fresh Apples",
  description: "Fresh apples available for donation",
  measurementUnit: "KG",
  foodCategory: "Fruit",
  isVegetarian: true,
  donationLimit: 100,
  price: 0,
  remainingQuantity: 50,
  ration: 5,
  status: "Active",
  revenue: 0,
  createdAt: "2026-09-07T10:00:00.000Z",
  closedAt: null,
  reservationPolicy: {
    allowsOnlineReservation: true,
    warningMessages: [],
  },
};
```

Create a listing normalizer that accepts either `_id` or `id` from the server and exposes only `id` to feature components. Keep transport types separate from normalized UI types.

Add centralized label maps for categories, units, and statuses. For example, display `BakedGoods` as “Baked Goods”, `CookedDish` as “Cooked Dish”, and `Unit` as “Per Unit” while preserving wire values.

### 7. Formatting utilities

Provide tested helpers for:

- VND values using a consistent Vietnamese display ending in `vnđ`.
- Dates and date-times with invalid-date fallback.
- Quantities without forced decimals for integer units.
- Measurement-unit labels and singular/plural display.
- Percentage calculation with zero-total protection.

### 8. Preview-data guard

Type `VITE_ENABLE_DONATION_PREVIEW_DATA` in `vite-env.d.ts`. Expose one parsed boolean helper. Preview mode defaults to false unless the value is exactly `true`.

Create a reusable `PreviewDataBadge` that is always visible beside preview-only information. Do not add sample production data in this task.

## Tests

- Configure Vitest with jsdom and Testing Library cleanup/jest-dom setup.
- Configure MSW with a reusable server lifecycle for tests.
- Configure Playwright with Vite webServer startup and desktop/tablet/mobile projects.
- Add one smoke test proving the provider tree renders and one API-client test for success, 204, structured error, malformed error, credentials, and abort behavior.

## Acceptance criteria

- The Vite starter logos, counter, and demo CSS no longer appear.
- Shared providers render without console errors.
- `/api` and `/upload` proxy configuration targets port 3000.
- API calls include the auth cookie through `credentials: 'include'`.
- JavaScript prevents unsupported status/category/unit strings.
- Rare UI source exists locally and uses AFF tokens.
- Reduced-motion users receive non-animated but complete output.
- All new tests, lint, and build pass.

## Required verification

Run from the workspace root:

```bash
pnpm --filter frontend lint
pnpm --filter frontend build
pnpm --filter frontend test
```

## Handoff

Report:

- Installed dependencies and generated Rare UI files.
- Final provider and directory structure.
- Public shared types/utilities created for later prompts.
- Verification commands and results.
- Any generated shadcn code you adjusted manually.

Do not start Prompt 02 work in this branch.
