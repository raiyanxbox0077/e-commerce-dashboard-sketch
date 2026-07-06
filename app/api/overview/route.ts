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

  // ── Table names — try stored name first, fall back to known defaults ───────
  const COD_TABLE_DEFAULT  = 'E-commerce COD confimation'
  const CART_TABLE_DEFAULT = 'E-commerce add to cart'

  async function resolveTable(stored: string | null | undefined, fallback: string): Promise<string> {
    const name = stored?.trim() || fallback
    if (name === fallback) return name
    const { error } = await admin.from(name).select('*', { count: 'exact', head: true })
    // PostgREST returns 404/PGRST116 when table doesn't exist
    if (error) return fallback
    return name
  }

  const codTable  = await resolveTable(tenant?.cod_table_name,  COD_TABLE_DEFAULT)
  const cartTable = await resolveTable(tenant?.cart_table_name, CART_TABLE_DEFAULT)

  // ── COD data ───────────────────────────────────────────────────────────────
  let codCount = 0
  let revenueSaved = 0
  let codRejectedCount  = 0
  let codConfirmedCount = 0

  try {
    const { count } = await admin.from(codTable).select('*', { count: 'exact', head: true })
    codCount = count ?? 0

    // Derive status from 'order confirm': 'true'=confirmed, 'false'=rejected, null=pending
    const { data: allCodRows } = await admin
      .from(codTable)
      .select('"order confirm", shipping_charge')

    if (allCodRows) {
      const rejected  = allCodRows.filter((r: Record<string, unknown>) => String(r['order confirm']) === 'false')
      const confirmed = allCodRows.filter((r: Record<string, unknown>) => String(r['order confirm']) === 'true')
      codRejectedCount  = rejected.length
      codConfirmedCount = confirmed.length
      revenueSaved = rejected.reduce((s: number, r: Record<string, unknown>) => s + Number(r.shipping_charge ?? 0), 0)
    }
  } catch (_) { /* table unavailable */ }

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
        // voice_workflow_id may be stored as "23\n25" or "23,25" or a plain number — normalise
        const normIds = wfIds
          .flatMap(id => id.split(/[\n,\s]+/))
          .map(id => id.trim())
          .filter(Boolean)
        // Only filter if we have IDs AND at least one matches a real run
        const filtered = normIds.length
          ? allRuns.filter(r => normIds.includes(String(r.workflow_id)))
          : allRuns
        // If zero matches (IDs stored don't match real runs), use all runs for this org
        const runs = filtered.length > 0 ? filtered : allRuns

        // Track total talk-time in minutes for cost calculation
        let totalMinutes = 0
        callStats.total = runs.length
        for (const r of runs) {
          const d = String(r.disposition ?? '')
          const secs = Number(r.call_duration_seconds ?? r.duration ?? 0)
          if (d === 'end_call_tool' || d === 'user_hangup') {
            callStats.completed++
            totalMinutes += secs / 60
          } else if (d === 'user_idle_max_duration_exceeded') {
            callStats.no_answer++
          } else if (!d || d === 'null') {
            callStats.in_progress++
          } else {
            callStats.failed++
          }
        }
        // Store total minutes so revenue calc can use it
        ;(callStats as Record<string, unknown>).total_minutes = Math.round(totalMinutes * 10) / 10
      }
    }
  } catch (_) { /* Dograh unavailable — use zero counts */ }

  // ── Revenue aggregates ─────────────────────────────────────────────────────
  // Call cost savings: cost_per_minute × total talk-time minutes
  // cost_per_minute stored in notification_prefs (default ₹5/min)
  const costPerMin = Number(tenant?.notification_prefs?.call_cost_per_minute ?? 5)
  const totalMinutes = Number((callStats as Record<string, unknown>).total_minutes ?? 0)
  const callCostSavings = Math.round(totalMinutes * costPerMin)
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
      made: revenueMade,
      saved: revenueSaved,
      call_cost_savings: callCostSavings,
      total_net: totalNetImpact,
      cod_confirmed_count: codConfirmedCount,
      cod_rejected_count: codRejectedCount,
      cart_converted_count: cartConvertedCount,
      cost_per_minute: costPerMin,
      total_call_minutes: totalMinutes,
    },
  })
}
