import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BOTSAILOR_BASE = 'https://app.botsailor.com/api/v1'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('botsailor_api_key')
    .eq('user_id', user.id)
    .single()

  const apiKey = tenant?.botsailor_api_key
  if (!apiKey) return NextResponse.json({ error: 'BotSailor API key not configured. Add it in Profile > Integrations.' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const page = searchParams.get('page') ?? '1'
  const search = searchParams.get('search') ?? ''

  const params = new URLSearchParams({ page, per_page: '20' })
  if (search) params.set('search', search)

  const res = await fetch(`${BOTSAILOR_BASE}/subscriber/list?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
