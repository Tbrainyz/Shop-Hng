# Agents.md

Rules for any AI agent working in this repo.

## Project

"Hng-Shopping" — an audio-gear shop (headphones/speakers/earphones) on Next.js (App Router) + TypeScript, Tailwind CSS. Visual design and catalog were ported from a user-supplied Vite/React frontend (the "Audiophile" template) — see "UI origin" below before changing styling. Cart, Paystack-verified checkout, Google sign-in, Postgres persistence (Supabase or Neon), Brevo order-confirmation email. Currency is NGN by default (`lib/currency.ts`, `NEXT_PUBLIC_CURRENCY`), switchable to USD.
## UI origin — read before restyling

The design (navbar, footer, product pages, checkout layout, the `#D87D4A` accent color, Manrope font) is ported pixel-for-pixel from a user-supplied template, not something to redesign on a whim. If asked to change the look, change it — but don't drift the existing pages' structure/spacing as a side effect of an unrelated change.
Two things were deliberately **left out** of the port, not forgotten:

- The template's admin dashboard (`components/admin/`, `pages/admin/`) — charts, product upload form, mock data. Not needed for the assignment's requirements; add it back only if asked.
- The template's manual SignIn/SignUp pages (email+password forms) — replaced entirely by real Google sign-in (NextAuth), since that's what the task specifies. Don't resurrect a parallel manual auth form.
  One actual bug was fixed while porting: the template's `ProductGallery.tsx` was a copy-paste of `RelatedProducts.tsx` (same component, wrong name, ignored its `gallery` prop entirely). `components/product/ProductGallery.tsx` here is a real image gallery.

## Storage: works with no setup, mirrors production when configured

`lib/db.ts` returns an `OrderRepo` (see `lib/repo.ts`): `MemoryOrderRepo` (in-memory, seeded from `lib/seedProducts.ts`, the real 6-product Audiophile catalog) when `DATABASE_URL` is unset in dev, `PrismaOrderRepo` (Postgres via Prisma) when it is set. Production refuses to boot without `DATABASE_URL`. Never delete the memory fallback to "clean up" — it's what lets `npm test` and `npm run dev` work without a live database.

## Endpoint / logic rules (mandatory)

1. **Every API route (`app/api/`) or pure logic module (`lib/cart.ts`, `lib/validate.ts`, `lib/brevo.ts`, `lib/paystack.ts`, the repos) you create or change MUST have tests** in `tests/`, in the same change.
2. Tests cover the happy path AND edge cases: invalid input (400), no session (401), unknown id (400/404), a client-supplied price being ignored in favor of the DB price, insufficient stock, malformed JSON, a thrown repo/email-provider error not crashing the request (500, or in checkout's case a graceful `emailSent:false`), and Paystack verification failing or mismatching the amount/currency.
3. **Always validate the change works before saying you're done**: run `npm test` and `npm run typecheck`, and confirm both pass. Never claim something works without a passing run.
4. Route handlers that touch auth (`getServerSession`) or email (`sendOrderConfirmationEmail`) or payment (`verifyPaystackTransaction`) get mocked in tests via `vi.mock` — never make a real network/Google/Brevo/Paystack call from a test.
5. If a test fails, fix the code (or the test if the test is wrong) and re-run. Never skip, delete, or weaken tests to get green.
6. Update the endpoint table below when adding or changing routes.
7. **Never trust a price, total, or stock count from the client — or a client's claim that it paid.** `POST /api/checkout` must always recompute totals from `repo.getProductsByIds()`, and must always re-verify the Paystack reference server-side via `verifyPaystackTransaction()` before creating an order.

## Endpoints

| Method | Path                    | Success                                                                       | Errors        |
| ------ | ----------------------- | ----------------------------------------------------------------------------- | ------------- |
| GET    | /api/products           | 200 `Product[]` (slug, category, gallery, includes, related, isNew, featured) | 500           |
| POST   | /api/checkout           | 201 `{orderId, totalCents, emailSent}`                                        | 400, 401, 500 |
| \*     | /api/auth/[...nextauth] | NextAuth-managed (Google sign-in)                                             | —             |
| GET    | /api/products/[slug]    | 200 `Product`                                                                 | 404, 500      |
| GET    | /api/orders/[id]        | 200 `Order` (caller's own only; others' orders are 404)                       | 401, 404, 500 |
| GET    | /api/me                 | 200 `{id, email}` for the cookie or bearer-token caller                       | 401, 500      |
| GET    | /api/cart               | 200 `{items, rev}` (hydrated with name/image/price); `?since=<rev>` -> `{unchanged:true, rev}` | 401, 500 |
| PUT    | /api/cart               | body `{items:[{productId, quantity}]}` replaces the cart; 200 `{items, rev}`   | 400, 401, 500 |
| GET    | /api/mobile/token       | 3xx redirect to the app deep link with `?token=` (needs `?redirect=`, a session cookie) | 400, 401, 500 |

`POST /api/checkout` requires `paystackReference`: the client charges the card via the Paystack **InlineJS v2** popup first (`https://js.paystack.co/v2/inline.js`, `new window.PaystackPop().newTransaction({...})` — not v1's `PaystackPop.setup()`, which throws "put your Paystack Inline javascript file inside of a form element" when called outside the declarative form-embed style), then posts the reference here. The route 400s immediately if `PAYSTACK_SECRET_KEY` isn't set (checked before calling Paystack, so misconfiguration shows up as a clear message rather than a generic 500), then calls `verifyPaystackTransaction()` (`lib/paystack.ts`) and refuses the order (400) unless Paystack confirms `status: "success"` with an amount and currency matching the server-computed total.

**Mobile app auth:** API routes identify the caller with `getUser(req)` (`lib/getUser.ts`), which accepts the NextAuth cookie (web) or `Authorization: Bearer <jwt>` (mobile app). Mobile sign-in goes `/mobile-login?redirect=<deep link>` → Google → `/api/mobile/token`, which mints the bearer token. The redirect is validated by `lib/mobileRedirect.ts` (app schemes, plus Expo Go on private-network hosts only) so tokens can't be sent to arbitrary sites. New routes use `getUser`, not `getServerSession`.

**Shared cart:** signed-in users' carts live on the server (`Cart` table, `repo.getCart/setCart`, `/api/cart`) so the website and the mobile app show the same cart. Clients push every change (debounced) and poll `?since=<rev>` every 2s; guests keep a local cart that is merged at sign-in (`lib/cartMerge.ts`). Checkout empties the server cart. Conflict policy is last-write-wins on the whole cart.

`/`, `/category/[category]`, `/product/[slug]`, and `/order/[id]` are Server Components that read the repo directly (no API route) — that's fine for reads; any new mutation still needs a tested route handler.

**Known limitation, not yet handled:** no Paystack webhook, so if stock changes (or the server crashes) between the charge completing and the order being saved, the charge has already happened but the order can still fail to save, with no refund path yet.

## Conventions

- Money is always integer cents (`priceCents`, `*Cents` on Order) — the minor unit of whichever currency is configured (cents for USD, kobo for NGN), never floats. Format for display with `formatCents()`/`formatMoney()` (`lib/cart.ts` / `lib/currency.ts`), never by hand. Both the product catalog (`lib/seedProducts.ts`) and checkout math (`lib/cart.ts`: 10% shipping, 3.33% VAT shown but not added to the total) are ported from the original template's logic — don't change the formula without checking both the client display and the server-side recompute stay in sync.
- Auth is JWT-only (`lib/auth.ts`, `session: { strategy: "jwt" }`) — no Users/Accounts tables, no adapter. Don't add one without discussing it; it changes the deployment story.
- Products have real fields beyond price: `slug`, `image`, `gallery` (string[]), `features` (paragraph text, `\n\n`-separated), `includes` ({quantity,item}[]), `related` (slugs, not ids), `isNew`, `featured`. `lib/seedProducts.ts` is the source of truth; `CATEGORY_ORDER`/`CATEGORY_LABEL` there drive nav links and category pages.
- Images live in `public/assets/` (copied from the uploaded template) and are referenced by plain string path (`/assets/headphones/headphone1.svg`), not ES-module imports — this was a deliberate choice when porting from Vite so asset handling doesn't depend on bundler-specific import behavior.
- Client components need `"use client"`. Cart state lives in `lib/cartContext.tsx` (localStorage-backed, per-device, includes the cart-modal open/close state — orders themselves are the durable record, in Postgres). There is no standalone `/cart` page by design, matching the original template — the cart is a dropdown modal (`components/cart/CartModal.tsx`) opened from the navbar, with "Checkout" inside it routing to `/checkout`.
