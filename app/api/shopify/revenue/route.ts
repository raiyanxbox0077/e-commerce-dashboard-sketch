import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Fetch Shopify orders that used a WA- discount code and sum their revenue.
// Caches for 5 minutes (300s) via Next.js revalidate.
export const revalidate = 300

interface ShopifyOrder {
  id: string
  name: string
  created_at: string
  total_price: string
  financial_status: string
  discount_codes: { code: string; amount: string; type: string }[]
  customer?: { first_name?: string; last_name?: string; email?: string; phone?: string }
}

interface ShopifyOrdersResponse {
  orders: ShopifyOrder[]
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: tenant } = await admin
    .from('tenants')
    .select('shopify_store_domain, shopify_admin_token')
    .eq('user_id', user.id)
    .single()

  if (!tenant?.shopify_store_domain || !tenant?.shopify_admin_token) {
    return NextResponse.json({
      configured: false,
      wa_revenue: 0,
      order_count: 0,
      avg_order_value: 0,
      orders: [],
    })
  }

  const domain = tenant.shopify_store_domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const token  = tenant.shopify_admin_token

  try {
    // Fetch up to 250 recent paid orders with discount codes
    const url = `https://${domain}/admin/api/2024-01/orders.json?status=any&financial_status=paid&limit=250&fields=id,name,created_at,total_price,financial_status,discount_codes,customer`
    const res = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      const body = await res.text()
      return NextResponse.json(
        { error: `Shopify API error: ${res.status} ${body.slice(0, 200)}` },
        { status: res.status }
      )
    }

    const json: ShopifyOrdersResponse = await res.json()
    const allOrders = json.orders ?? []

    // Filter: orders that have at least one discount code starting with "WA-" (case-insensitive)
    const waOrders = allOrders.filter(o =>
      o.discount_codes?.some(d => d.code?.toUpperCase().startsWith('WA-'))
    )

    const waRevenue = waOrders.reduce((sum, o) => sum + parseFloat(o.total_price || '0'), 0)
    const avgOrderValue = waOrders.length > 0 ? waRevenue / waOrders.length : 0

    // Monthly breakdown (last 6 months)
    const monthlyMap: Record<string, number> = {}
    for (const order of waOrders) {
      const month = order.created_at.slice(0, 7) // "2025-06"
      monthlyMap[month] = (monthlyMap[month] ?? 0) + parseFloat(order.total_price || '0')
    }
    const monthly = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }))

    return NextResponse.json({
      configured: true,
      wa_revenue:      Math.round(waRevenue),
      order_count:     waOrders.length,
      avg_order_value: Math.round(avgOrderValue),
      monthly,
      // Most recent 20 WA orders for the table
      orders: waOrders.slice(0, 20).map(o => ({
        id:               o.id,
        name:             o.name,
        created_at:       o.created_at,
        total_price:      parseFloat(o.total_price || '0'),
        discount_code:    o.discount_codes.find(d => d.code?.toUpperCase().startsWith('WA-'))?.code ?? '',
        customer_name:    [o.customer?.first_name, o.customer?.last_name].filter(Boolean).join(' ') || '—',
        customer_phone:   o.customer?.phone ?? '—',
      })),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
