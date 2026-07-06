import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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

  if (!tenant?.client_supabase_url || !tenant?.client_supabase_anon_key) {
    return NextResponse.json({ error: 'Client Supabase not configured.' }, { status: 400 })
  }

  let supabaseUrl = tenant.client_supabase_url.trim()
  const dashboardMatch = supabaseUrl.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i)
  if (dashboardMatch) supabaseUrl = `https://${dashboardMatch[1]}.supabase.co`

  const clientDb = createSupabaseClient(supabaseUrl, tenant.client_supabase_anon_key)

  // Query information_schema to list all public tables
  const { data, error } = await clientDb
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE')
    .order('table_name')

  if (error) {
    // Fallback: try a known RPC or just return the error
    return NextResponse.json({ error: error.message, tables: [] }, { status: 500 })
  }

  return NextResponse.json({ tables: data?.map(r => r.table_name) ?? [] })
}
