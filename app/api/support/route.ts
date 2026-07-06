import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use cod_table_name/cart_table_name columns that already exist, plus new ones if present
  const { data: tenant } = await supabase
    .from('tenants')
    .select('cod_table_name')
    .eq('user_id', user.id)
    .single()

  // Attempt to read the new column separately; if it fails (column missing), default gracefully
  const { data: tenantExtra } = await supabase
    .from('tenants')
    .select('support_table_name')
    .eq('user_id', user.id)
    .single()
    .catch(() => ({ data: null, error: null }))

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const search = searchParams.get('search') ?? ''

  const admin = createAdminClient()
  const tableName = (tenantExtra as Record<string, string> | null)?.support_table_name || 'customer_support'

  let query = admin
    .from(tableName)
    .select('*', { count: 'exact' })
    .order('order_date', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (search) query = query.ilike('customer_name', `%${search}%`)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count })
}
