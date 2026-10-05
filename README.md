
# Toplier

Toplier is a public competitive leaderboard for products, startups, creators, and projects. Listings are sorted by simulated rank value, so a product can climb by setting a value above the listing immediately ahead of it.

> Pay to climb. Get noticed.

## Features

- Public leaderboard ordered by rank value, with a clear #1 treatment
- Product submission with category, website, description, optional social and logo URLs
- Listing pages with current position and the minimum value needed to move up
- Server-validated simulated climbs with an event history
- Category browsing, a development-only admin summary, and preview data when the database is not configured
- Responsive dark interface with demo listings clearly identified

All amounts in this MVP are simulated. There are no payments, balances, or money transfers.

## Tech stack

- Next.js App Router and React Server Components
- TypeScript
- Tailwind CSS 4, with project-specific styling in `app/globals.css`
- Supabase Postgres and `@supabase/supabase-js`
- Lucide React
- Vercel-compatible server actions and server rendering

## Project structure

```text
app/                 App Router pages, layouts, and server actions
components/          Shared navigation, leaderboard, and form components
lib/                 Constants, validation, ranking, data access, and Supabase client
types/database.ts    Typed Supabase schema contract
supabase/schema.sql  Tables, RLS policies, and atomic ranking functions
```

## Install and run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Supabase environment variables, the site uses read-only preview listings. Submissions and climbs report that the database is not configured rather than pretending to save data.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Configure Supabase

1. Create a Supabase project.
2. Open the project SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql).
3. Run [`supabase/migrations/20261004_secure_listing_climbs.sql`](supabase/migrations/20261004_secure_listing_climbs.sql) after the base schema to enable authenticated listing ownership and atomic climbs.
4. Copy `.env.example` to `.env.local`.
5. In Supabase project settings, copy the project URL and anon/public key into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

6. In Supabase Auth, allow the local app URL (for example `http://localhost:3000/auth/callback`) in the redirect URL list, and make sure the intended users already have accounts. Restart `npm run dev` after changing environment variables.

The public anon key is used for reads and for server-action calls to the listing creation and climb functions. The Supabase project must grant the anon role permission to execute those functions; the app does not use a service-role key. The climb function should serialize ranking changes, update the listing, and insert its climb event in one transaction.

The minimum increment is fixed at ₹5 in both the server-side ranking function and `MINIMUM_INCREMENT` in `lib/constants.ts`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | For persistence | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For persistence | Public anon key used for listing reads |
`.env.local` is ignored by Git; `.env.example` contains placeholders only.

## Deploy to Vercel

1. Push the project to a Git provider and import it into Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Vercel project environment variables for each target environment.
3. Run `supabase/schema.sql` against the Supabase project before deploying.
4. Deploy. Vercel detects the Next.js build automatically.

The `/admin` page is intentionally unauthenticated for local development only. Do not treat it as a production admin console.

## Current MVP limitations

- Rank values are demo amounts; no real money is collected or transferred.
- Submission is public and listings do not yet have an owner account.
- `/admin` has no authentication and is development-only.
- No moderation, abuse/rate limiting, email verification, or payment provider is included.
- Preview listings are static examples and cannot be climbed or saved.

## Future Razorpay integration

Razorpay is intentionally not integrated. A later payment flow should create an order on the server only after recalculating the required amount, verify payment signatures and webhook events server-side, then record the climb and event in a single idempotent database operation. The current ranking RPC provides a server-owned place to preserve the ranking rules, but real payments will also need authenticated ownership, webhook/retry handling, rate limiting, and production admin controls.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
