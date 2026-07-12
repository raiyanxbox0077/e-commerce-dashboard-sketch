---
name: larynxai-dashboard
description: Guidelines for working on the LarynxAI multi-tenant dashboard built with Next.js 16, Supabase, and Tailwind CSS v4.
---

# LarynxAI Dashboard

Guidelines for modifying the LarynxAI multi-tenant SaaS dashboard.

## When to use

Use this skill when making changes to any Next.js app code, components, API routes, Supabase interactions, or integrations in this repository.

## Before you start

Read these LLM context files in order:

1. `ARCHITECTURE.md` — system architecture, auth model, tenant model, data fetching patterns
2. `DATABASE.md` — Supabase schema, RLS policies, tenant isolation
3. `API.md` — all API routes and request/response shapes
4. `DESIGN_SYSTEM.md` — Tailwind v4 theme, Apple design tokens, component patterns
5. `INTEGRATIONS.md` — Dograh voice, BotSailor WhatsApp, Shopify, Razorpay
6. `DEVELOPMENT.md` — setup, conventions, gotchas
7. `DEPLOY.md` — deployment guide (Vercel and Hetzner self-host)

## Core rules

### Auth and tenancy

- Every API route must start with `await supabase.auth.getUser()` and return 401 if the user is null.
- Use the server Supabase client from `lib/supabase/server.ts` in route handlers.
- Use the browser Supabase client from `lib/supabase/client.ts` in client components.
- Treat every authenticated user as a tenant; look up their row in `public.tenants` by `user_id`.
- Integration credentials (Dograh, BotSailor, Shopify, Razorpay) are stored per-tenant in the database and must never be sent to the browser.

### Data fetching

- Always use **SWR** in client components. Never fetch inside `useEffect`.
- Pass `null` as the SWR key when a required credential is missing to disable the fetch.
- Keep all external API calls in server-side route handlers under `app/api/`.

### Supabase gotcha

- Supabase query builders have `.then()` but **not** `.catch()`. Using `.catch()` crashes at runtime.
- Wrap Supabase calls in `try/catch` instead.

### UI conventions

- Use Tailwind CSS v4 with the Apple design system tokens from `DESIGN_SYSTEM.md`.
- Use the provided empty state, loading skeleton, and error display patterns from `DEVELOPMENT.md`.
- Use `cn()` from `lib/utils.ts` for conditional class names.

### Adding features

- New dashboard tab: create `/components/tabs/<name>-tab.tsx`, add to sidebar nav, register in `/app/dashboard/page.tsx`, and add the label in `/components/layout/header.tsx`.
- New API route: create `/app/api/<resource>/route.ts`, start with auth check, fetch tenant config if needed, and keep credentials server-side.

### Deployment

- Do not push directly to `main`. Work on feature branches and merge via PR.
- Self-hosted deployments run on port **3721**.
