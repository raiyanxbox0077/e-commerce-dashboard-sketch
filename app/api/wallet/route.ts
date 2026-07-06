import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Transactions stored as JSONB array on tenants.wallet_transactions
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('wallet_balance, wallet_transactions')
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const transactions = Array.isArray(tenant?.wallet_transactions) ? tenant.wallet_transactions : []

  return NextResponse.json({
    balance: Number(tenant?.wallet_balance ?? 0),
    transactions,
  })
}
