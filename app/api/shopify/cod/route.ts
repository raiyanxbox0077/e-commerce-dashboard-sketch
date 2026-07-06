import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
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
  const status = searchParams.get('status') ?? ''

  // Use tenant-configured table name or the exact table name from this project
  const tableNames = [
    ...(tenant?.cod_table_name ? [tenant.cod_table_name] : []),
    'E-commerce COD confimation',
  ]

  let data = null, error = null, count = null

  for (const tableName of tableNames) {
    let q = supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (search) q = q.ilike('customer_name', `%${search}%`)
    if (status) q = q.eq('cod_status', status)
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
