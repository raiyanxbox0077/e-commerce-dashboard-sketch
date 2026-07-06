import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  // Auth check via session client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get tenant config for table name override
  const { data: tenant } = await supabase
    .from('tenants')
    .select('cod_table_name')
    .eq('user_id', user.id)
    .single()

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const search = searchParams.get('search') ?? ''
  // order_confirm: 'true' | 'false' | 'pending' (null) — maps to the "order confirm" column
  const orderConfirm = searchParams.get('order_confirm') ?? ''

  const admin = createAdminClient()

  const tableNames = [
    ...(tenant?.cod_table_name ? [tenant.cod_table_name] : []),
    'E-commerce COD confimation',
  ]

  let data = null, error = null, count = null

  for (const tableName of tableNames) {
    let q = admin
      .from(tableName)
      .select('*', { count: 'exact' })
      .order('order_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (search) q = q.ilike('customer_name', `%${search}%`)

    // Filter on "order confirm" column
    if (orderConfirm === 'true')    q = q.eq('order confirm', 'true')
    else if (orderConfirm === 'false') q = q.eq('order confirm', 'false')
    else if (orderConfirm === 'pending') q = q.is('order confirm', null)

    const result = await q
    if (!result.error) {
      data = result.data; count = result.count; error = null; break
    }
    error = result.error
  }

  if (error) return NextResponse.json({
    error: `Table not found. Tried: ${tableNames.join(', ')}. Set the exact name in Profile > Integrations > COD Table Name. Error: ${error.message}`
  }, { status: 500 })

  return NextResponse.json({ data, count, page, limit })
}
