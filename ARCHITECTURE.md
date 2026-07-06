# Architecture

## Overview

LarynxAI Dashboard is a **multi-tenant SaaS dashboard** where each authenticated user (tenant) has their own isolated configuration and data. There is no shared admin — every user sees only their own data.

```
Browser
  └─ Next.js App Router (Next.js 16)
       ├─ /app/auth/login        → login page
       ├─ /app/auth/signup       → signup page
       ├─ /app/auth/callback     → Supabase OAuth callback
       ├─ /app/dashboard         → main SPA shell (client component)
       └─ /app/api/**            → Route Handlers (server-side)

Supabase
  ├─ Auth (email + password, JWT sessions)
  └─ Postgres DB (tenants table, per-tenant dynamic tables)

External APIs
  ├─ Dograh (voice.larynxai.in) — AI voice calls
  ├─ BotSailor — WhatsApp messaging
  ├─ Shopify Storefront/Admin API
  └─ Razorpay — wallet top-ups
```

## Auth Model

- Supabase email/password auth, cookies managed via `@supabase/ssr`
- Middleware (`middleware.ts`) protects `/dashboard` and `/api/**` — redirects unauthenticated users to `/auth/login`
- Server-side API routes use `createClient()` from `lib/supabase/server.ts` which reads the session from cookies
- Client components use `createClient()` from `lib/supabase/client.ts`
- Every API route starts with: `const { data: { user } } = await supabase.auth.getUser()` and returns 401 if null

## Tenant Model

Each authenticated user is a tenant. On first login, a row is inserted into `public.tenants` keyed by `user_id` (= Supabase auth user UUID).

The `tenants` table stores:
- Integration credentials (encrypted in-transit): `voice_api_key`, `voice_base_url`, `whatsapp_api_key`, `whatsapp_instance_id`, `shopify_store_url`, `shopify_api_key`
- Custom table names for Shopify data: `cod_table_name`, `cart_table_name`, `support_table_name`, `review_table_name`
- Voice workflow IDs (newline-separated): `voice_workflow_id`
- Wallet balance: `wallet_balance`
- Profile: `full_name`, `company_name`, `phone`

## Dashboard Shell (`/app/dashboard/page.tsx`)

Single-page app shell. Renders one tab at a time using `useState<NavTab>`. Tab state lives here and is passed down to `<Sidebar>` and `<Header>`. Each tab component is independently responsible for its own data fetching via SWR.

```
DashboardPage
  ├─ Sidebar (navigation, wallet balance, logout)
  ├─ Header (tab title, search, notifications)
  └─ <ActiveTab /> — one of:
       OverviewTab, CallsTab, ShopifyTab, WhatsAppTab,
       WalletTab, BillingTab, ProfileTab
```

## Data Fetching Pattern

- All data fetching uses **SWR** — never `useEffect` + `fetch`
- Client → `/api/[resource]` → server route → external API or Supabase
- No external API keys are ever sent to the browser; all credentials stay server-side
- SWR key is `null` when a required credential is missing (disables the fetch)

Example:
```tsx
const { data, isLoading } = useSWR(
  tenant?.voice_api_key ? '/api/calls?page=1&limit=20' : null,
  fetcher
)
```

## File Structure

```
app/
  auth/               — login, signup, callback pages
  api/
    tenant/           — GET/PATCH tenant config
    calls/            — GET runs, GET single run, GET workflows
    shopify/          — COD, cart, tables
    whatsapp/         — chats, contacts, messages, verify
    support/          — customer support table rows
    reviews/          — customer reviews table rows
    overview/         — aggregated stats
    wallet/           — balance, create Razorpay order, verify payment
    profile/          — user profile update
    auth/change-password/
  dashboard/          — main SPA page
  layout.tsx          — root layout (fonts, metadata, Analytics)
  globals.css         — Tailwind v4 theme + design tokens

components/
  layout/
    sidebar.tsx       — navigation sidebar (desktop fixed, mobile drawer)
    header.tsx        — sticky top bar
  tabs/
    overview-tab.tsx
    calls-tab.tsx
    shopify-tab.tsx
    whatsapp-tab.tsx
    wallet-tab.tsx
    billing-tab.tsx
    profile-tab.tsx
    customer-support-tab.tsx
    customer-review-tab.tsx
  dashboard-blueprint.tsx  — legacy wireframe (not used in production)

hooks/
  use-tenant.ts       — SWR hook for /api/tenant

lib/
  supabase/
    client.ts         — browser Supabase client
    server.ts         — server Supabase client (reads cookies)
    proxy.ts          — edge/middleware Supabase client
  utils.ts            — cn() helper (clsx + tailwind-merge)

middleware.ts         — auth protection for /dashboard and /api routes
```
