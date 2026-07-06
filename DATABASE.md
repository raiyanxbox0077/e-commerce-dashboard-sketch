# Database

## Provider

Supabase (PostgreSQL). The project uses `@supabase/ssr` for SSR-safe auth cookie management.

## Core Table: `public.tenants`

One row per authenticated user. Created on signup via a Supabase trigger or first API call.

```sql
create table public.tenants (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique not null references auth.users(id) on delete cascade,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),

  -- Profile
  full_name           text,
  company_name        text,
  phone               text,

  -- Wallet
  wallet_balance      numeric(12,2) default 0,
  wallet_transactions jsonb default '[]'::jsonb,   -- JSONB array of top-up records (newest first, capped at 100)

  -- Dograh Voice API
  voice_api_key       text,
  voice_base_url      text default 'https://voice.larynxai.in',
  voice_workflow_id   text,  -- newline-separated numeric IDs e.g. "24\n25"

  -- BotSailor WhatsApp
  whatsapp_api_key    text,
  whatsapp_instance_id text,

  -- Shopify
  shopify_store_url   text,
  shopify_api_key     text,

  -- Dynamic table names (per-tenant Supabase tables for Shopify data)
  cod_table_name      text default 'shopify_cod_orders',
  cart_table_name     text default 'shopify_cart_events',
  support_table_name  text,  -- default: 'customer_support'
  review_table_name   text   -- default: 'customer_review'
);
```

### `voice_workflow_id` field

Stores multiple Dograh workflow numeric IDs as a **newline-separated string**. This reuses an existing column without requiring a migration.

Example value: `"24\n25\n26"`

Parsed in code: `raw.split('\n').map(s => s.trim()).filter(s => s && s !== 'undefined')`

## Dynamic Per-Tenant Tables

Each tenant may have their own Supabase tables for Shopify events (configured via Profile > Integrations). The table names are stored in `tenants.cod_table_name`, `tenants.cart_table_name`, etc.

These tables are queried via the service role client from server-side API routes. They are never queried directly from the browser.

## RLS (Row Level Security)

The `tenants` table should have RLS enabled with a policy allowing users to read/write only their own row:

```sql
-- Enable RLS
alter table public.tenants enable row level security;

-- Users can only access their own row
create policy "tenants_own_row" on public.tenants
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Note: All API routes also manually filter by `user_id` for defense-in-depth.

## Migration: Add Missing Columns

If new columns are missing (e.g. after cloning the repo without running all migrations):

```sql
alter table public.tenants
  add column if not exists support_table_name text,
  add column if not exists review_table_name  text,
  add column if not exists voice_workflow_id  text;
```

## Supabase Clients

| File | Usage |
|------|-------|
| `lib/supabase/client.ts` | Browser client — for auth state in client components |
| `lib/supabase/server.ts` | Server client — reads session cookies, used in API routes |
| `lib/supabase/proxy.ts` | Edge/middleware client — for middleware.ts route protection |

Always use the **server client** in API routes. Never use the browser client in server-side code.

## Wallet

Transactions are stored as a JSONB array on the `tenants` row — no separate table needed.

Run this in the Supabase SQL editor if the columns are missing:

```sql
alter table public.tenants
  add column if not exists wallet_balance      numeric(12,2) default 0;

alter table public.tenants
  add column if not exists wallet_transactions jsonb default '[]'::jsonb;
```

Each entry in `wallet_transactions` has this shape:
```json
{
  "id": "pay_XXXX",
  "type": "credit",
  "amount": 500.00,
  "description": "Wallet recharge via Razorpay",
  "razorpay_payment_id": "pay_XXXX",
  "razorpay_order_id": "order_XXXX",
  "status": "success",
  "created_at": "2026-07-06T12:00:00.000Z"
}
```

The `wallet_transactions` array is capped at 100 entries (newest first). Balance is updated atomically alongside the transaction append in a single `UPDATE` call.
