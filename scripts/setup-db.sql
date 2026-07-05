-- =============================================================
-- Dashboard Setup SQL
-- Run this in: Supabase > SQL Editor
-- Project: iaisgphpjgwmrzkffvgu
-- =============================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Tenants table (one row per logged-in user)
create table if not exists tenants (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text,
  email         text,
  phone         text,
  company_name  text,

  -- Voice / Dograh
  voice_api_key   text,
  voice_base_url  text default 'https://voice.larynxai.in',

  -- BotSailor WhatsApp
  botsailor_api_key   text,
  botsailor_phone_id  text,   -- WhatsApp Business phone_number_id from BotSailor

  -- Client Supabase (for COD / cart tables)
  client_supabase_url      text,
  client_supabase_anon_key text,

  -- Shopify
  shopify_store_domain text,

  -- Razorpay
  razorpay_key_id     text,
  razorpay_key_secret text,

  -- Notification preferences (JSON)
  notification_prefs  jsonb default '{}',

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique(user_id)
);

-- 3. Wallet ledger
create table if not exists wallet_transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount      numeric(12,2) not null,
  type        text not null check (type in ('credit','debit')),
  description text,
  reference   text,
  created_at  timestamp with time zone default now()
);

-- 4. Row Level Security
alter table tenants enable row level security;
alter table wallet_transactions enable row level security;

-- Tenants: each user can only see/edit their own row
drop policy if exists "tenants_own" on tenants;
create policy "tenants_own" on tenants
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Wallet: each user can only see their own transactions
drop policy if exists "wallet_own" on wallet_transactions;
create policy "wallet_own" on wallet_transactions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Auto-create tenant row when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into tenants (user_id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 6. Add any missing columns if tenants table already exists
alter table tenants add column if not exists botsailor_phone_id text;
alter table tenants add column if not exists cod_table_name text;
alter table tenants add column if not exists cart_table_name text;
alter table tenants add column if not exists wallet_balance numeric(12,2) default 0;
alter table tenants add column if not exists voice_base_url text default 'https://voice.larynxai.in';
alter table tenants add column if not exists shopify_store_domain text;
alter table tenants add column if not exists razorpay_key_id text;
alter table tenants add column if not exists razorpay_key_secret text;
