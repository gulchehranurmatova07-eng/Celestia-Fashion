# CELESTIA — Luxury Fashion E‑Commerce

*Beyond Fashion. Beyond Ordinary.*

A full-stack, trilingual (EN / RU / UZ) fashion store: editorial storefront, catalogue with URL-based filters, product pages, cart and checkout with server-side order processing, customer accounts, and a protected admin dashboard.

## Quick start

```bash
npm install
cp .env.example .env          # set ADMIN_PASSWORD before seeding
npm run db:push               # create the SQLite dev database
npm run db:seed               # demo catalogue + admin account
npm run dev                   # http://localhost:3000
```

The admin dashboard is at `/admin`. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

`npm run db:reset` wipes the database and reseeds it. `npm run typecheck`, `npm run lint` and `npm run build` must all pass before deploying.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS 3 with brand tokens (`tailwind.config.ts`); Cormorant Garamond + Manrope via `next/font` |
| i18n | `next-intl` — `/` English (default), `/ru`, `/uz`; messages in `messages/<locale>/<namespace>.json` |
| Data | Prisma ORM. SQLite in development, PostgreSQL (e.g. Supabase) in production |
| Auth | Email + password (bcrypt), opaque session tokens stored hashed in the DB, http-only cookies |
| Email | Nodemailer over SMTP when configured; otherwise a development outbox (Admin → Outbox) |

**Why not Supabase directly?** No credentials were available. Prisma talks to Supabase's Postgres unchanged, and every part works locally without external services. To use Supabase:

1. Set `provider = "postgresql"` in `prisma/schema.prisma`.
2. Point `DATABASE_URL` at your Supabase connection string.
3. Run `npm run db:push && npm run db:seed`.

## What is real and what needs configuration

| Area | Status |
| --- | --- |
| Catalogue, filters, search, PDP, cart, wishlist, accounts, admin | ✅ Fully working against the database |
| Orders | ✅ Server-side pricing, discount validation, atomic stock reservation, confirmation page, order history. Admin cancellation restores stock |
| Cash on delivery | ✅ Enabled by default; a business decision, toggle in Admin → Settings |
| Click / Payme / Uzum Bank | ⚠️ **Not live.** Adapters exist in `src/lib/payments.ts`, but a provider only appears at checkout once its credentials are in `.env`, it is enabled in Settings, **and** its redirect/callback integration has been built and tested (`ONLINE_INTEGRATION_READY`). Merchant onboarding is required. Card data is never stored by this app. |
| Email | ⚠️ Without `SMTP_*` variables, emails (order confirmations, password resets, status updates) are **not sent**. They are stored in Admin → Outbox and logged to the console. |
| Image uploads | ⚠️ Saved to `public/uploads` (`src/lib/storage.ts`). On serverless hosting, swap the adapter for S3 or Supabase Storage. |
| Contact details, legal pages | ⚠️ Placeholders and templates — update in Admin → Settings and have a lawyer review `/privacy` and `/terms`. |

## Demo content

- 29 demonstration products with 3 to 5 colour/size variants each. Every product is flagged **Demo**: Admin → Products → "Archive all demo products" removes them from the storefront in one step once real inventory is added.
- Photography is cut from the supplied lookbook sheets in `assets/source` by `scripts/crop_images.py` (`npm run images`).
- **Some source photos show third-party brand marks** (sneaker and watch logos). Replace those images before launch.
- The supplied photography is menswear only. Products are therefore men's or unisex; `/catalog?gender=women` shows unisex pieces with a "women's edit arriving soon" notice. There is no Bags category content yet (empty categories are hidden automatically).
- Demo discount codes: `WELCOME10` (10 %) and `CELESTIA200` (200 000 soʻm off orders from 2 000 000).
- No reviews, ratings, sales figures or certifications are invented. "Most popular" sorting uses real order counts.

## Architecture

```
src/
  app/[locale]/        storefront routes (home, catalog, search, collections, product, cart,
                       checkout, order, account, auth, content pages)
  app/admin/           admin dashboard (own layout, English UI)
  app/actions/         storefront server actions (checkout, auth, wishlist, newsletter, …)
  app/api/             JSON endpoints for live search, cart details, quick view
  components/          UI by area (layout, product, pdp, catalog, checkout, account, admin)
  lib/                 db, auth, catalog queries, orders, pricing, payments, settings, seo
messages/{en,ru,uz}/   translations (identical key structure across locales)
prisma/                schema, seed data, seed script
```

### Multilingual

- The language switcher (EN / RU / UZ) changes the language client-side. It keeps the current page, query string (filters, sort) and bag, remembers the choice in the `NEXT_LOCALE` cookie, and saves it to the profile of signed-in users.
- Products, categories and collections have per-locale translation rows, edited in the admin.
- Prices are formatted per locale: `UZS 1,300,000` · `1 300 000 сум` · `1 300 000 so‘m`.

### Security

- Every admin page, loader, server action and the CSV export call `requireAdmin()` on the server. Hidden buttons are never relied on.
- Customers can only read their own orders and addresses; ownership is enforced in the database `where` clauses. Guests see their order only via an unguessable token link.
- Passwords are hashed with bcrypt. Session and password-reset tokens are stored as SHA-256 hashes. Login and reset requests are throttled. Redirect targets are restricted to same-site paths.
- Checkout recomputes all prices, discounts and delivery costs on the server and reserves stock with conditional decrements inside a transaction.

### SEO and performance

- Per-page titles and descriptions, canonical URLs, `hreflang` alternates, Open Graph images.
- `sitemap.xml` and `robots.txt`.
- Product and breadcrumb JSON-LD.
- `next/image` with AVIF/WebP and responsive sizes; below-the-fold images lazy-load.
- Respects `prefers-reduced-motion`.

## Production checklist

1. Switch Prisma to PostgreSQL and set `DATABASE_URL`.
2. Set `NEXT_PUBLIC_SITE_URL`, a strong `ADMIN_PASSWORD`, and the `SMTP_*` variables.
3. Replace the upload storage adapter if hosting serverless.
4. Integrate and test the payment providers you have merchant accounts for, then enable them.
5. Replace demo products and imagery; update contact details, legal texts and social links in Settings.
