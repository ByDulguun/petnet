# PetNet 🐾

**Everything your pet needs.** Mongolia's largest pet ecosystem platform — vets, shops, grooming, training, hotels, adoption, health tracking, and a community for pet owners.

## Stack

- **Next.js 15** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** — design tokens in `src/app/globals.css`
- **Framer Motion** — scroll reveals, honors `prefers-reduced-motion`
- **Prisma + PostgreSQL** — full schema in `prisma/schema.prisma`
- **Auth.js v5** (Credentials/email+password, JWT sessions) · **TanStack Query** · **React Hook Form + Zod**
- **Cloudinary** (images) · **Google Maps** (pet map tiles) · **OpenStreetMap Nominatim** (geocoding) — see `.env.example`

## Getting started

```bash
npm install                # also runs `prisma generate` via postinstall
cp .env.example .env.local # fill in DATABASE_URL + secrets (gitignored, never .env)
npm run db:migrate         # create tables (needs PostgreSQL) — dev only, see below
npm run db:seed            # vaccines, breeds, article categories
npm run db:seed-businesses # demo businesses/reviews/staff (optional)
npm run dev                # http://localhost:3000
```

The app is fully wired to Postgres via Prisma — nothing renders from
`src/lib/mock-data.ts`/fixtures in the live app anymore; that file is legacy
and unused.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `start` | Production build / serve (see Deployment below — `start` doesn't work with the standalone output; use it only if you remove `output: "standalone"` from next.config.ts) |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push schema to DB without a migration (dev/prototyping only) |
| `npm run db:migrate` | Create + apply a migration (dev, interactive) |
| `npm run db:migrate:deploy` | Apply pending migrations non-interactively (**use this in production**) |
| `npm run db:seed` | Seed reference data (vaccines, breeds, article categories) |
| `npm run db:seed-businesses` | Seed demo businesses/reviews (optional, idempotent) |
| `npm run db:verify` | Read-only data integrity report (`prisma/verify-data-integrity.ts`) — never modifies anything |
| `npm run db:studio` | Prisma Studio |

## Deployment

Production build:

```bash
npm run db:migrate:deploy   # run once per deploy, BEFORE starting new instances —
                             # never run concurrently from multiple instances
npm run build
node .next/standalone/server.js
```

- `next.config.ts` sets `output: "standalone"` — the build produces a
  self-contained `.next/standalone/server.js` plus `.next/static` and
  `public`, which need to be copied alongside it (see `Dockerfile`).
  `npm run start` (`next start`) does **not** work with this output mode —
  use `node .next/standalone/server.js` directly, or a container built from
  the included `Dockerfile`.
- **The standalone server does not read `.env`/`.env.local` at runtime** —
  those files are only used by `next dev`/`next build`. Supply real secrets
  as actual process environment variables (`docker run --env-file`, your
  platform's env var config, etc.), or Cloudinary/Nominatim calls will fail
  closed with a clean 503 (by design — see `src/lib/cloudinary.ts` /
  `src/lib/geocoding.ts`) even though the values look correct in a local
  `.env` file.
- `AUTH_URL` must exactly match the domain the app is actually served from
  in that environment — a mismatch silently sends auth redirects (like
  logout) to the wrong origin instead of erroring loudly. `AUTH_TRUST_HOST`
  is required on any host other than Vercel/Cloudflare. See `.env.example`
  for the full variable reference.
- First admin: there's no seeded admin account and no promotion UI —
  register a normal account, then set `role = 'ADMIN'` for that user
  directly in the database (`UserRole` enum in `prisma/schema.prisma`).
  `/admin/claims` and `/admin/reports` are the only admin routes today.

## Structure

```
prisma/               schema + seed (all domains: pets, health, businesses,
                      community, content, events, commerce, adoption)
src/
  app/                routes, layout, loading/error/not-found, SEO
  components/
    brand/            logo (SVG puppy mark)
    layout/           header, footer, theme toggle
    providers/        theme + query + motion config
    shared/           section headings, empty states, motion wrappers
    ui/               shadcn/ui primitives
  features/
    home/             hero, categories, pets, shops, community, articles,
                      events, CTA
  lib/                constants, types, utils, prisma client, mock data
```

## Design system

- Primary `#FF7A00` · Secondary `#2563EB` · Background `#FAFAFA` · Dark `#0B1120`
- Typography: Plus Jakarta Sans
- Tokens (light + dark) live in `globals.css` under `:root` / `.dark` and are
  exposed to Tailwind via `@theme inline` (`bg-brand`, `text-success`, …)

## Pet Services Ecosystem (Module 1)

- **`/map`** — Google Maps-style explorer: search with autocomplete, filter
  chips + all-filters sheet, virtualized result list, synced markers.
  Desktop = split view; mobile = full-screen map + draggable bottom sheet.
- **`/business/[slug]`** — Airbnb-style profiles: gallery, services & pricing,
  booking flow (calendar → slots → confirmation), reviews with owner replies,
  team, FAQs, hours with holiday overrides, nearby places, LocalBusiness
  JSON-LD. SSG + 5-min ISR.
- **REST API** — `/api/businesses` (search/filter/nearby with facets),
  `/autocomplete`, `/[slug]`, `/[slug]/reviews`, `/[slug]/slots`,
  `/api/bookings` — all Zod-validated.
- **Data-driven taxonomy** — business categories and amenities are rows
  (`BusinessCategory`, `Amenity`), not enums; adding a type needs no deploy.
  Icons resolve by name via `category-icon.tsx` with a paw-print fallback.
- **Maps** — with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` set you get live Google
  Maps with marker clustering; without it a schematic projected map renders
  so the explorer works in every environment.
- **Geocoding** — business addresses are geocoded server-side via
  OpenStreetMap's Nominatim (`src/lib/geocoding.ts`), not Google — no API key
  or billing account required. Runs once per address change (never on page
  load), is rate-limited to Nominatim's 1 request/second policy and cached
  by query in Postgres (`GeocodeCache`) so a given address is never looked up
  twice. `NOMINATIM_BASE_URL`/`NOMINATIM_USER_AGENT` are optional overrides —
  set a real `NOMINATIM_USER_AGENT` with your own contact info before relying
  on the public instance in production.

## Status

The core marketplace loop is built and production-hardened end to end:
registration/login, pet profiles with photo upload, business discovery
(search/map/detail), booking → confirm/complete → verified review,
in-app notifications, and a full business dashboard (profile, logo/cover,
services, hours, appointments, geocoded address). Community, Marketplace,
Adoption, Lost & Found, medical records, and payments are intentionally
not built yet.
# petnet
