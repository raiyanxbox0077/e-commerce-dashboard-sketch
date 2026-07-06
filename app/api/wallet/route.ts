import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // wallet_transactions table does not exist — balance lives on tenants.wallet_balance
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('wallet_balance')
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ balance: tenant?.wallet_balance ?? 0, transactions: [] })
}
