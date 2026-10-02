# Hng-Shopping

An audio-gear shop (headphones, speakers, earphones) — Next.js, Tailwind, real Google sign-in, Paystack checkout, Postgres persistence, Brevo confirmation emails. The design and 6-product catalog are ported from a user-supplied frontend template; see "UI origin" in `Agents.md` for what was kept, fixed, and deliberately left out (an admin dashboard and manual email/password sign-up — replaced by real Google sign-in).

```
npm install
npm run dev     # http://localhost:3000 — works immediately, no setup required
npm test        # all tests run against an in-memory store and mocked Paystack/Brevo — no external calls
```

With no `.env.local` at all: you can browse products, view product pages, and add to cart. Signing in and paying will fail until you add the credentials below — that's expected, not a bug. There's no standalone cart page — the cart opens as a dropdown from the navbar's Cart button.

## 1. Database — Supabase or Neon (pick one, same code either way)

Both are Postgres, so `DATABASE_URL` is all that matters; nothing else in the code changes.

**Supabase**

1. Create a project at [supabase.com](https://supabase.com).
2. Project Settings → Database → Connection string. Copy the **Transaction pooler** string into `DATABASE_URL`, and the **Session pooler** (or direct connection) string into `DIRECT_URL`.

**Neon**

1. Create a project at [neon.tech](https://neon.tech).
2. Dashboard → Connection Details → copy the connection string into both `DATABASE_URL` and `DIRECT_URL`.

Then, with `.env.local` filled in:

```
npm run db:push   # creates the Product/Order/OrderItem tables
npm run db:seed   # loads the 6-product Audiophile catalog (headphones/speakers/earphones)
```

## 2. Google sign-in

1. [console.cloud.google.com](https://console.cloud.google.com) → create a project (or use an existing one).
2. **APIs & Services → OAuth consent screen** → set it up for External users, add your own email as a test user while it's unpublished.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → Application type: **Web application**.
4. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` exactly — no trailing slash, `http` not `https` for local dev (add your production URL + the same path once deployed).
5. Copy the Client ID and secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
6. Set `NEXTAUTH_SECRET` to the output of `openssl rand -base64 32` (or `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` if you don't have `openssl`).

## 3. Brevo order emails

1. Create or select an account at [app.brevo.com](https://app.brevo.com), then verify the sender email address/domain under **Senders, Domains & Dedicated IPs**.
2. Create an API key under **Transactional → SMTP & API → API Keys** and set `BREVO_API_KEY` in your environment.
3. Set `BREVO_FROM_EMAIL` to the verified sender address. `BREVO_FROM_NAME` is optional and defaults to `Hng-Shopping`.
4. If sending fails, checkout still succeeds and the order is saved — the response just comes back with `emailSent: false`, and the error is logged server-side.

## 4. Paystack

1. [dashboard.paystack.com](https://dashboard.paystack.com) → Settings → API Keys & Webhooks.
2. Copy your **test** public key (`pk_test_...`) into `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, and the **test** secret key (`sk_test_...`) into `PAYSTACK_SECRET_KEY`. Keep using test keys until you're ready to take real payments — Paystack's test mode uses [dummy card numbers](https://paystack.com/docs/payments/test-payments) that never charge anything real.
3. At checkout, the Paystack popup (InlineJS v2) handles the card entry; once it reports success, the app re-verifies that exact charge with Paystack's servers (amount, currency, status) before saving the order — a reference alone is never enough. There's no separate "Callback URL" to configure in the Paystack dashboard for this — that setting is only for Paystack's hosted/redirect checkout, which this app doesn't use. The whole post-payment flow (`onSuccess` → call `/api/checkout` → redirect to the order page) happens in the browser and in `app/checkout/page.tsx`.
4. If `PAYSTACK_SECRET_KEY` isn't set, checkout fails immediately with a clear 400 telling you so, rather than a generic server error.
5. **Known gap:** there's no webhook yet, so if your server restarts or crashes in the few seconds between Paystack confirming payment and the order being saved, that charge wouldn't have a matching order. Low risk for a small/test setup; worth adding a Paystack webhook as a backstop before relying on this for real money.

## Currency

`NEXT_PUBLIC_CURRENCY` is `USD` by default; set it to `NGN` to switch to Naira. This isn't live conversion — `lib/seedProducts.ts` has a separate, hand-picked price per product for each currency. Shipping (10% of subtotal) and VAT (3.33%, shown but not charged) scale automatically with whatever currency you're in. If you switch after already seeding a database, re-run `npm run db:seed` (it won't touch products that already exist by slug, so clear the table first if you want the new currency's prices to actually apply).

## Deploying (Vercel)

1. Import the repo.
2. Add every variable from `.env.example` under Environment Variables.
3. Add your production URL's `/api/auth/callback/google` to the Google OAuth client's redirect URIs — local and production are separate entries.
4. Switch `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` / `PAYSTACK_SECRET_KEY` to your **live** keys only when you're genuinely ready to accept real payments.
5. Run `npm run db:push` and `npm run db:seed` once against the production database before your first real order.

See Agents.md for the testing rules this project follows.
