import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('cart_table_name')
    .eq('user_id', user.id)
    .single()

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const search = searchParams.get('search') ?? ''

  const cartTable = tenant?.cart_table_name || 'E-commerce add to cart'  // exact table name in your Supabase

  let query = supabase
    .from(cartTable)
    .select('*', { count: 'exact' })
    .order('order_date', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (search) query = query.ilike('customer_name', `%${search}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({
    error: `Table "${cartTable}" not found. Set the exact name in Profile > Integrations > Cart Table Name. Error: ${error.message}`
  }, { status: 500 })

  return NextResponse.json({ data, count, page, limit })
}
