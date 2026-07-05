import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all tenant config — use * so missing columns don't cause 400
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Wallet transactions this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: txns } = await supabase
    .from('wallet_transactions')
    .select('type, amount, created_at')
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  const spent = txns?.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const credited = txns?.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0) ?? 0

  // If client has their own Supabase, pull COD + cart counts
  let codCount = 0
  let cartCount = 0

  if (tenant?.client_supabase_url && tenant?.client_supabase_anon_key) {
    try {
      const { createClient: createClientDynamic } = await import('@supabase/supabase-js')
      // Auto-correct dashboard URL → API URL
      let supabaseUrl = tenant.client_supabase_url.trim()
      const dashboardMatch = supabaseUrl.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i)
      if (dashboardMatch) supabaseUrl = `https://${dashboardMatch[1]}.supabase.co`
      const clientDb = createClientDynamic(supabaseUrl, tenant.client_supabase_anon_key)

      const codTable = (tenant as Record<string, unknown>).cod_table_name as string || 'cod_confirmation'
      const cartTable = (tenant as Record<string, unknown>).cart_table_name as string || 'E-commerce add to cart'
      const [{ count: cod }, { count: cart }] = await Promise.all([
        clientDb.from(codTable).select('*', { count: 'exact', head: true }),
        clientDb.from(cartTable).select('*', { count: 'exact', head: true }),
      ])
      codCount = cod ?? 0
      cartCount = cart ?? 0
    } catch (_) {
      // client DB not reachable yet — return zeros
    }
  }

  // Calls from voice API (just last 50 to compute stats)
  let callStats = { total: 0, completed: 0, failed: 0, no_answer: 0, in_progress: 0 }

  if (tenant?.voice_api_key) {
    try {
      const baseUrl = (tenant.voice_base_url ?? 'https://voice.larynxai.in').replace(/\/$/, '')
      // We'll just return a placeholder — a real workflow_id is needed from the tenant
      // For now return zero so the UI can show "configure workflow" prompt
      callStats = { total: 0, completed: 0, failed: 0, no_answer: 0, in_progress: 0 }
    } catch (_) {
      // silent
    }
  }

  return NextResponse.json({
    wallet_balance: tenant?.wallet_balance ?? 0,
    spent_this_month: spent,
    credited_this_month: credited,
    cod_count: codCount,
    cart_count: cartCount,
    call_stats: callStats,
  })
}
