# API Reference

All routes live under `/app/api/`. Every route is protected — requires an authenticated Supabase session (cookie). Returns `401` if unauthenticated.

---

## Tenant

### `GET /api/tenant`
Returns the current user's tenant row.

**Response**: Full `tenants` table row. Key fields:
```json
{
  "id": "uuid",
  "user_id": "supabase-auth-uuid",
  "full_name": "Raiyan Ahmed",
  "company_name": "Acme",
  "wallet_balance": 842.50,
  "voice_api_key": "dgr_...",
  "voice_base_url": "https://voice.larynxai.in",
  "voice_workflow_id": "24\n25",
  "whatsapp_api_key": "...",
  "whatsapp_instance_id": "...",
  "shopify_store_url": "...",
  "shopify_api_key": "...",
  "cod_table_name": "shopify_cod_orders",
  "cart_table_name": "shopify_cart_events",
  "support_table_name": "customer_support",
  "review_table_name": "customer_review"
}
```

### `PATCH /api/tenant`
Updates allowed fields on the tenant row.

**Body**: any subset of allowed fields (see `ALLOWED_FIELDS` in route).  
**Response**: Updated tenant row.

---

## Calls (Dograh Voice API)

### `GET /api/calls`
Fetches workflow runs for all workflows saved in `voice_workflow_id`.

**Query params**:
- `page` (default: `1`)
- `limit` (default: `20`)
- `status` — filter by status string

**How it works**:
1. Reads `voice_api_key` + `voice_workflow_id` from tenant
2. Fetches ALL runs from Dograh (`limit=100`) — the Dograh API ignores per-workflow filters
3. Filters client-side to only runs whose `workflow_id` is in the saved list
4. Returns paginated, sorted (newest first) slice

**Response**:
```json
{
  "runs": [{ "run_id": "432", "workflow_id": 24, "agent_name": "...", "contact_name": "...", "phone_number": "...", "status": "completed", "duration": 120, "cost": 0.05, "created_at": "2026-07-06T...", "recording_url": "https://voice.larynxai.in/recordings/432.wav", "transcript_url": "https://voice.larynxai.in/transcripts/432.txt" }],
  "total": 55,
  "page": 1,
  "total_pages": 3,
  "no_workflows_configured": false
}
```

If `no_workflows_configured: true` — the user has not saved any workflow IDs in Profile > Integrations.

### `GET /api/calls/[run_id]`
Returns details for a single run.

**Response**: Same shape as a single run object above.

### `GET /api/calls/workflows`
Returns all available workflows from Dograh for the tenant.

**Response**:
```json
{
  "workflows": [{ "id": 24, "name": "Ad to Cart", "status": "active", "total_runs": 34 }]
}
```

Note: Dograh workflow objects use `id` (not `workflow_id`).

---

## Shopify

### `GET /api/shopify/cod`
Fetches rows from `tenant.cod_table_name` (default: `shopify_cod_orders`).

**Query params**: `page`, `limit`, `search`, `status`

### `GET /api/shopify/cart`
Fetches rows from `tenant.cart_table_name` (default: `shopify_cart_events`).

### `GET /api/shopify/tables`
Returns `{ cod_table_name, cart_table_name }` for the tenant.

---

## WhatsApp (BotSailor)

### `GET /api/whatsapp/chats`
Returns chat list from BotSailor API.

### `GET /api/whatsapp/contacts`
Returns contact list.

### `GET /api/whatsapp/messages?chat_id=...`
Returns messages for a specific chat.

### `POST /api/whatsapp/verify`
Verifies BotSailor API key and instance ID. Returns connection status.

---

## Support & Reviews

### `GET /api/support`
Fetches rows from `tenant.support_table_name` (default: `customer_support`).

**Query params**: `page`, `limit`, `search`

### `GET /api/reviews`
Fetches rows from `tenant.review_table_name` (default: `customer_review`).

---

## Overview

### `GET /api/overview`
Returns aggregated stats for the dashboard home.

**Response**:
```json
{
  "wallet_balance": 842.50,
  "spent_this_month": 210.00,
  "credited_this_month": 500.00,
  "cod_count": 142,
  "cart_count": 87,
  "call_stats": { "total": 67, "completed": 55, "failed": 8, "no_answer": 4, "in_progress": 0 },
  "recent_transactions": []
}
```

---

## Wallet

### `GET /api/wallet`
Returns wallet balance and recent transactions.

### `POST /api/wallet/create-order`
Creates a Razorpay order for wallet top-up.

**Body**: `{ amount: number }` (in INR)  
**Response**: `{ order_id, amount, currency, key_id }`

### `POST /api/wallet/verify-payment`
Verifies Razorpay payment signature and credits the wallet.

**Body**: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, amount }`

---

## Profile & Auth

### `PATCH /api/profile`
Updates `full_name`, `company_name`, `phone` on the tenant row.

### `POST /api/auth/change-password`
Changes the authenticated user's password via Supabase.

**Body**: `{ current_password, new_password }`

---

## Error Conventions

All routes return JSON errors:
```json
{ "error": "descriptive message" }
```
With appropriate HTTP status codes: `400` (bad input), `401` (unauthenticated), `500` (server error).
