# Staybook Portugal

A small Booking.com–style product: browse stays in Portugal, open details and reviews, check availability and nightly pricing, then complete a **mock checkout**. Includes **sign-in**, **bookings tied to your account**, **cancellation** (dates become available again on the calendar), and a **navy + yellow** visual nod to Booking.com.

**Stack:** Next.js (App Router), Tailwind CSS v4, shadcn/ui (Base UI). Backend: Next **Route Handlers** with in-memory mock data.

**Demo account (created on server start):** `demo@example.com` / `demo1234`

## Run locally (one command)

```bash
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start after `build` |
| `npm run lint` | ESLint (Next core-web-vitals) |
| `npm run test` | Vitest (unit + component smoke) |

## Architecture (short)

- **`src/app/api/*`:** REST API used from the browser (`fetch` with `credentials: "include"` for session cookies).
  - `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` — httpOnly session cookie.
  - `GET /api/stays` — search, property type filter, sort.
  - `GET /api/stays/:id` — detail plus `calendarBlocks` (maintenance blocks + booked nights).
  - `GET|POST /api/stays/:id/reviews` — list / add reviews (basic moderation).
  - `GET /api/bookings` — current user’s bookings.
  - `POST /api/bookings` — create booking (requires session; booking email = account email).
  - `GET|DELETE /api/bookings/:id` — confirmation (owner only) or cancel (removes booking and frees dates).
- **`src/lib/stay-store.ts`** and **`src/lib/auth-store.ts`:** in-memory singletons (same serverless caveat: not durable across cold instances).
- **`src/lib/{pricing,availability,moderation}.ts`:** pure rules, unit tested.
- **`src/lib/logger.ts`:** JSON logs to stdout per request.

## Product flow

1. **Home:** search, type, sort; loading, empty, and error states.
2. **Stay detail:** description, amenities, date-range calendar with blocked + booked nights, total price, reviews.
3. **Checkout:** session required (otherwise redirect to `/login`); guest name + mock payment; confirmation visible to owner only.
4. **`/bookings`:** list and **cancel** bookings (dates show as free again on the stay page).

## Tests

- Unit: pricing, availability, moderation, calendar block merging for bookings.
- Component: `StayCard` with `next/image` and `next/link` mocks (`vitest.setup.ts`).

## CI / release

- **CI:** `.github/workflows/ci.yml` — `npm ci`, `lint`, `test`, `build` on push/PR to `main`/`master`.
- **Release:** bump `package.json` + `CHANGELOG.md`; optionally `git tag v0.2.0 && git push origin v0.2.0`.
- **Deploy (optional):** Vercel-ready (`next build`); add env vars only if you extend with external services.

## Scope cuts / next steps (4–6h timebox)

**Intentionally out of scope**

- Real persistence (Postgres / Turso) and production auth.
- Map, favorites, compare — good phase-2 items.
- Strong moderation and transactional email.

**Suggested next**

1. Persist bookings/reviews + migrations.
2. E2E (Playwright) for list → detail → checkout.
3. Rate limits and stricter API payload validation.

## LLM

See [`LLM_USAGE.md`](./LLM_USAGE.md).

## Assumptions

- Currency **EUR**; nightly rate + optional fixed cleaning fee.
- **Available** means the night range does not overlap merged calendar blocks (inclusive maintenance ranges + booked nights).
- Checkout expects valid dates in the query string; otherwise the user is sent back to the stay page.
