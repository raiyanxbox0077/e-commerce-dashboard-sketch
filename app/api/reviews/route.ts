import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('review_table_name')
    .eq('user_id', user.id)
    .single()

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const search = searchParams.get('search') ?? ''

  const admin = createAdminClient()
  const tableName = tenant?.review_table_name || 'customer_review'

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
