import { createClient } from '@/lib/supabase/server'
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

  // Wallet transactions this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: txns } = await supabase
    .from('wallet_transactions')
    .select('type, amount')
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  const spent = txns?.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const credited = txns?.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0) ?? 0

  // COD + Cart counts from same Supabase DB
  let codCount = 0
  let cartCount = 0

  try {
    const codTable = tenant?.cod_table_name || 'E-commerce COD confimation'
    const cartTable = tenant?.cart_table_name || 'E-commerce add to cart'
    const [codRes, cartRes] = await Promise.all([
      supabase.from(codTable).select('*', { count: 'exact', head: true }),
      supabase.from(cartTable).select('*', { count: 'exact', head: true }),
    ])
    codCount = codRes.count ?? 0
    cartCount = cartRes.count ?? 0
  } catch (_) {
    // tables not configured yet — return zeros
  }

  return NextResponse.json({
    wallet_balance: tenant?.wallet_balance ?? 0,
    spent_this_month: spent,
    credited_this_month: credited,
    cod_count: codCount,
    cart_count: cartCount,
    call_stats: { total: 0, completed: 0, failed: 0, no_answer: 0, in_progress: 0 },
  })
}
