# Integrations

All integration credentials are stored per-tenant in `public.tenants`. They are never exposed to the browser — only used server-side in API route handlers.

---

## Dograh — AI Voice Calls

**Base URL**: `https://voice.larynxai.in` (configured per tenant via `voice_base_url`)  
**Auth**: `X-API-Key: <voice_api_key>` header

### Stored Fields
| Field | Description |
|-------|-------------|
| `voice_api_key` | Dograh API key (e.g. `dgr_...`) |
| `voice_base_url` | Base URL, defaults to `https://voice.larynxai.in` |
| `voice_workflow_id` | Newline-separated numeric workflow IDs (e.g. `"24\n25"`) |

### Key API Endpoints

```
GET  /api/v1/workflow/fetch
  → Returns array of { id, name, status, total_runs }
  → Note: field is "id" not "workflow_id"

GET  /api/v1/organizations/usage/runs?page=1&limit=100
  → Returns { runs: [...], total_count: N }
  → The `filters` query param is IGNORED by the API — always returns all org runs
  → Client-side filter by workflow_id after fetching
  → Max limit: 100 (higher values return empty array)

Run object shape:
{
  id: number,             ← the run's own numeric ID
  workflow_id: number,    ← which workflow this run belongs to
  workflow_name: string,
  name: string,           ← contact/call name
  phone_number: string,
  status: string,         ← "completed" | "failed" | "no_answer" | "in_progress"
  call_duration_seconds: number,
  dograh_token_usage: number,
  created_at: string,
  recording_url: string,       ← relative path e.g. "recordings/432.wav"
  recording_public_url: string,
  transcript_url: string,
  transcript_public_url: string
}
```

### URL Resolution

Dograh returns **relative paths** for recording/transcript URLs (e.g. `recordings/432.wav`). The `abs()` helper in the API route prepends `https://voice.larynxai.in/` and replaces any `localhost` origin:

```ts
const safeBase = 'https://voice.larynxai.in'
function abs(url: unknown): string | null {
  if (!url) return null
  const s = String(url)
  if (s.startsWith('http')) return s.replace(/^https?:\/\/localhost(:\d+)?/, safeBase)
  return `${safeBase}/${s.startsWith('/') ? s.slice(1) : s}`
}
```

### Known Quirks
- The `filters` param on the runs endpoint is silently ignored
- `limit > 100` returns an empty array
- Workflow objects use field `id`, run objects also have `id` (run ID) plus `workflow_id`

---

## BotSailor — WhatsApp

**Auth**: API key + instance ID stored per-tenant.

### Stored Fields
| Field | Description |
|-------|-------------|
| `whatsapp_api_key` | BotSailor API key |
| `whatsapp_instance_id` | BotSailor instance/device ID |

Used in: `/api/whatsapp/**`

---

## Shopify

Tenant-specific Shopify store connected via API key. Shopify data (COD orders, cart events) is synced into per-tenant Supabase tables (table names configurable in Profile).

### Stored Fields
| Field | Description |
|-------|-------------|
| `shopify_store_url` | e.g. `mystore.myshopify.com` |
| `shopify_api_key` | Admin API access token |
| `cod_table_name` | Supabase table for COD orders (default: `shopify_cod_orders`) |
| `cart_table_name` | Supabase table for cart events (default: `shopify_cart_events`) |

---

## Razorpay — Wallet Top-ups

Used for adding credits to the tenant wallet.

### Environment Variables Required
```
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
```

### Flow
1. Client calls `POST /api/wallet/create-order` with `{ amount }` in INR
2. Server creates Razorpay order, returns `{ order_id, amount, currency, key_id }`
3. Client opens Razorpay checkout modal
4. On success, client calls `POST /api/wallet/verify-payment` with the Razorpay callback payload
5. Server verifies HMAC signature, then increments `tenants.wallet_balance`

---

## Supabase

Managed Postgres + Auth.

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← server-only, never exposed to browser
```

The service role key bypasses RLS and is used for querying per-tenant dynamic tables.

---

## Adding a New Integration

1. Add credential columns to `public.tenants` (with `IF NOT EXISTS`)
2. Add field names to `ALLOWED_FIELDS` in `/app/api/tenant/route.ts`
3. Add UI inputs in `ProfileTab` under the Integrations section
4. Create API route(s) in `/app/api/<integration>/route.ts`
5. Create a tab component in `/components/tabs/<integration>-tab.tsx`
6. Register the tab in `/app/dashboard/page.tsx` and add nav item to sidebar
