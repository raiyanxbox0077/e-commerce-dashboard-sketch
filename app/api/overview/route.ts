import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Wallet balance direct from tenants row (no wallet_transactions table)
  const walletBalance = tenant?.wallet_balance ?? 0
  const walletTxns: { type: string; amount: number }[] = tenant?.wallet_transactions ?? []
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
  const monthTxns = walletTxns.filter((t: { type: string; amount: number; created_at?: string }) => t.created_at && new Date(t.created_at) >= startOfMonth)
  const spent = monthTxns.filter((t: { type: string }) => t.type === 'debit').reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0)
  const credited = monthTxns.filter((t: { type: string }) => t.type === 'credit').reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0)

  const admin = createAdminClient()

  // ── Table names ────────────────────────────────────────────────────────────
  const codTable  = tenant?.cod_table_name  || 'E-commerce COD confimation'
  const cartTable = tenant?.cart_table_name || 'E-commerce add to cart'

  // ── COD data ───────────────────────────────────────────────────────────────
  let codCount = 0
  let revenueSaved = 0      // sum of shipping_charge on rejected/cancelled COD orders
  let codRejectedCount = 0

  try {
    // Total COD row count
    const { count } = await admin.from(codTable).select('*', { count: 'exact', head: true })
    codCount = count ?? 0

    // Rejected COD = order confirm = 'false'  OR  status = 'rejected' / 'cancelled'
    const { data: rejectedRows } = await admin
      .from(codTable)
      .select('"order confirm", status, shipping_charge')

    if (rejectedRows) {
      const rejected = rejectedRows.filter((r: Record<string, unknown>) =>
        r['order confirm'] === 'false' ||
        String(r['order confirm']).toLowerCase() === 'false' ||
        ['rejected', 'cancelled', 'cancel'].includes(String(r.status ?? '').toLowerCase())
      )
      codRejectedCount = rejected.length
      revenueSaved = rejected.reduce((s: number, r: Record<string, unknown>) => s + Number(r.shipping_charge ?? 0), 0)
    }
  } catch (_) { /* table not found — skip */ }

  // ── Cart data ──────────────────────────────────────────────────────────────
  let cartCount = 0
  let revenueMade = 0       // sum of total_amount on confirmed cart orders (call status = completed/confirmed)
  let cartConvertedCount = 0

  try {
    const { count } = await admin.from(cartTable).select('*', { count: 'exact', head: true })
    cartCount = count ?? 0

    const { data: cartRows } = await admin
      .from(cartTable)
      .select('"call status", "WhatsApp Status", total_amount')

    if (cartRows) {
      const confirmed = cartRows.filter((r: Record<string, unknown>) => {
        const cs = String(r['call status'] ?? '').toLowerCase()
        const wa = String(r['WhatsApp Status'] ?? '').toLowerCase()
        return ['completed', 'confirmed', 'success'].includes(cs) ||
               ['confirmed', 'success'].includes(wa)
      })
      cartConvertedCount = confirmed.length
      revenueMade = confirmed.reduce((s: number, r: Record<string, unknown>) => s + Number(r.total_amount ?? 0), 0)
    }
  } catch (_) { /* table not found — skip */ }

  // ── Call stats — fetched live from Dograh ─────────────────────────────────
  const callStats = { total: 0, completed: 0, failed: 0, no_answer: 0, in_progress: 0 }

  try {
    const apiKey  = tenant?.voice_api_key
    const baseUrl = (tenant?.voice_base_url || 'https://voice.larynxai.in').replace(/\/$/, '')
    const wfIds: string[] = Array.isArray(tenant?.voice_workflow_id)
      ? tenant.voice_workflow_id
      : tenant?.voice_workflow_id ? [String(tenant.voice_workflow_id)] : []

    if (apiKey) {
      const res = await fetch(`${baseUrl}/api/v1/organizations/usage/runs?page=1&limit=100`, {
        headers: { 'X-API-Key': apiKey },
      })
      if (res.ok) {
        const raw = await res.json()
        const allRuns: Record<string, unknown>[] = Array.isArray(raw) ? raw : (raw?.runs ?? [])
        // Filter to this tenant's workflows only
        const runs = wfIds.length ? allRuns.filter(r => wfIds.includes(String(r.workflow_id))) : allRuns

        callStats.total = runs.length
        for (const r of runs) {
          const d = String(r.disposition ?? '')
          if (d === 'end_call_tool' || d === 'user_hangup')       callStats.completed++
          else if (d === 'user_idle_max_duration_exceeded')        callStats.no_answer++
          else if (!d || d === 'null')                             callStats.in_progress++
          else                                                     callStats.failed++
        }
      }
    }
  } catch (_) { /* Dograh unavailable — use zero counts */ }

  // ── Revenue aggregates ─────────────────────────────────────────────────────
  // Call cost savings: ₹50 per completed call (human agent cost avoided)
  const callCostSavings = callStats.completed * 50
  const totalNetImpact  = revenueMade + revenueSaved + callCostSavings

  return NextResponse.json({
    wallet_balance: walletBalance,
    spent_this_month: spent,
    credited_this_month: credited,
    cod_count: codCount,
    cart_count: cartCount,
    call_stats: callStats,
    // Revenue metrics
    revenue: {
      made: revenueMade,                  // cart confirmed orders total_amount
      saved: revenueSaved,                // rejected COD × shipping_charge
      call_cost_savings: callCostSavings, // completed calls × ₹50
      total_net: totalNetImpact,          // made + saved + call_savings
      cod_rejected_count: codRejectedCount,
      cart_converted_count: cartConvertedCount,
    },
  })
}
