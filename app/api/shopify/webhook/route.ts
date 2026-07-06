import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Shopify sends ORDERS_PAID webhook here.
// We verify the HMAC, then record the WA-attributed order in Supabase for
// real-time dashboard updates (revalidates the /api/shopify/revenue cache).

export async function POST(req: Request) {
  const rawBody = await req.text()

  // ── HMAC verification ────────────────────────────────────────────────────
  const shopifyHmac = req.headers.get('x-shopify-hmac-sha256') ?? ''
  const secret      = process.env.SHOPIFY_WEBHOOK_SECRET

  if (secret) {
    const digest = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64')
    if (digest !== shopifyHmac) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let order: Record<string, unknown>
  try {
    order = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ── Check for WA- discount codes ─────────────────────────────────────────
  const discountCodes = (order.discount_codes as { code: string }[] | undefined) ?? []
  const waCode = discountCodes.find(d => d.code?.toUpperCase().startsWith('WA-'))

  if (!waCode) {
    // Not a WA-attributed order — ignore silently
    return NextResponse.json({ ok: true, attributed: false })
  }

  // ── Find the tenant that owns this Shopify domain ─────────────────────────
  const shopDomain = req.headers.get('x-shopify-shop-domain') ?? ''
  const admin = createAdminClient()

  const { data: tenant } = await admin
    .from('tenants')
    .select('id, user_id, cart_table_name')
    .ilike('shopify_store_domain', `%${shopDomain.split('.')[0]}%`)
    .single()

  if (!tenant) {
    // Unknown store — still acknowledge so Shopify doesn't retry
    return NextResponse.json({ ok: true, attributed: false, reason: 'tenant not found' })
  }

  // ── Write a wa_order_revenue row for this order ───────────────────────────
  const customerId = order.customer as { phone?: string; email?: string } | undefined
  await admin.from('wa_order_revenue').upsert({
    tenant_id:       tenant.id,
    shopify_order_id: String(order.id),
    order_name:      String(order.name ?? ''),
    discount_code:   waCode.code,
    revenue:         parseFloat(String(order.total_price ?? '0')),
    customer_phone:  customerId?.phone ?? null,
    customer_email:  customerId?.email ?? null,
    ordered_at:      String(order.created_at ?? new Date().toISOString()),
  }, { onConflict: 'shopify_order_id' })

  return NextResponse.json({ ok: true, attributed: true, order: order.name })
}
