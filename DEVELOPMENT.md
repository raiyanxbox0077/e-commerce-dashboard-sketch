# Development Guide

## Setup

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Required in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Razorpay (wallet top-ups)
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# Optional: override auth redirect for local dev
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

Integration credentials (Dograh, BotSailor, Shopify) are stored per-tenant in the database — not in environment variables.

## Project Conventions

### Adding a New Tab

1. Create `/components/tabs/<name>-tab.tsx` — export a named component `<NameTab />`
2. Add a nav item to `NAV_ITEMS` or `ACCOUNT_ITEMS` in `/components/layout/sidebar.tsx`
3. Register in `/app/dashboard/page.tsx`: add to the `NavTab` type and render with `{activeTab === "<name>" && <NameTab />}`
4. Add the label to `TAB_LABELS` in `/components/layout/header.tsx`

### Adding a New API Route

1. Create `/app/api/<resource>/route.ts`
2. Start with auth check:
```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```
3. Fetch tenant config if needed:
```ts
const { data: tenant } = await supabase.from('tenants').select('...').eq('user_id', user.id).single()
```
4. Never use `.catch()` on Supabase query builders — they are not native Promises. Use `try/catch` with `await` instead.

### Data Fetching in Components

Always use SWR. Never fetch in `useEffect`.

```tsx
const { data, isLoading, error } = useSWR(
  credentialPresent ? '/api/resource' : null,
  (url) => fetch(url).then(r => r.json())
)
```

Use `null` as the SWR key to disable fetching when credentials are not yet configured.

### Supabase `.catch()` Gotcha

Supabase query builders have `.then()` but NOT `.catch()`. This causes a runtime crash:
```ts
// WRONG — crashes at runtime
const result = await supabase.from('tenants').select('col').single().catch(() => null)

// CORRECT — use try/catch
let result = null
try {
  const { data } = await supabase.from('tenants').select('col').single()
  result = data
} catch {}
```

## Key Architecture Decisions

### Why newline-separated workflow IDs?

The `voice_workflow_id` column stores multiple workflow IDs as `"24\n25"` instead of a proper array column. This reuses the existing column without requiring a database migration. If the DB is migrated to add a proper `voice_workflow_ids text[]` column, update the split/join logic in:
- `/app/api/calls/route.ts` → `getTenantVoiceConfig()`
- `/components/tabs/profile-tab.tsx` → `setWorkflowIds()` and save payload

### Why client-side workflow filtering?

The Dograh API `filters` query parameter is silently ignored — it always returns all org runs. So we fetch all runs (`limit=100`, which is the API max) and filter by `workflow_id` in JavaScript. See `/app/api/calls/route.ts`.

### Why always use `https://voice.larynxai.in` instead of the stored base URL?

The tenant may have `http://localhost:8000` saved as `voice_base_url` from earlier testing. The `abs()` function in call routes hardcodes the production base URL and replaces any localhost origin. This ensures recording/transcript URLs always work in production.

## Common Patterns

### Empty state
```tsx
<div className="empty-state">
  <Icon className="w-8 h-8 text-[#c7c7cc]" />
  <p className="text-[14px] font-medium">No items found</p>
  <p className="text-[12px]">Descriptive helper text</p>
</div>
```

### Loading skeleton
```tsx
{isLoading && (
  <div className="flex items-center justify-center py-14">
    <Loader2 className="w-6 h-6 animate-spin text-[#6e6e73]" />
  </div>
)}
```

### Error display
```tsx
{error && (
  <p className="text-[13px] text-[#cc0000] bg-[#fff3f3] border border-[#ffcccc] rounded-xl px-4 py-3">
    {error}
  </p>
)}
```

## Deployment

### Vercel (default)

The project is connected to Vercel. Every push to the head branch deploys automatically. The `main` branch is the production branch.

**Do not push directly to `main`**. Work on feature branches and merge via PR.

### Self-host on Hetzner

See **[DEPLOY.md](./DEPLOY.md)** for the full copy-paste guide.
Quick summary: Node 20 + pnpm + PM2, app runs on port **3721** to avoid conflicts.
