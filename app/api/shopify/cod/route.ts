import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Select all tenant fields — fall back gracefully if newer columns don't exist yet
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!tenant?.client_supabase_url || !tenant?.client_supabase_anon_key) {
    return NextResponse.json({ error: 'Client Supabase credentials not configured. Add them in Profile > Integrations.' }, { status: 400 })
  }

  // Auto-correct: user may have pasted the dashboard URL instead of the API URL
  // e.g. https://supabase.com/dashboard/project/PROJECTID → https://PROJECTID.supabase.co
  let supabaseUrl = tenant.client_supabase_url.trim()
  const dashboardMatch = supabaseUrl.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i)
  if (dashboardMatch) supabaseUrl = `https://${dashboardMatch[1]}.supabase.co`

  const clientDb = createSupabaseClient(supabaseUrl, tenant.client_supabase_anon_key)

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''

  // Try tenant-configured name first, then common variations
  const tableNames = [
    ...(tenant.cod_table_name ? [tenant.cod_table_name] : []),
    'cod_confirmation', 'COD Confirmation', 'COD_confirmation', 'cod_confirmations', 'orders_cod', 'cod_orders',
  ]
  let data = null, error = null, count = null

  for (const tableName of tableNames) {
    let q = clientDb
      .from(tableName)
      .select('*', { count: 'exact' })
      .order('order_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (search) q = q.ilike('customer_name', `%${search}%`)
    if (status) q = q.eq('cod_status', status)
    const result = await q
    if (!result.error) {
      data = result.data; count = result.count; error = null; break
    }
    error = result.error
  }

  if (error) return NextResponse.json({ error: `Table not found. Please check your Supabase table name. Tried: ${tableNames.join(', ')}. Error: ${error.message}` }, { status: 500 })

  return NextResponse.json({ data, count, page, limit })
}
