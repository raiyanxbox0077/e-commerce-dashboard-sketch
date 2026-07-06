import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BOTSAILOR_BASE = 'https://botsailor.com/api/v1'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('botsailor_api_key, botsailor_phone_id')
    .eq('user_id', user.id)
    .single()

  const apiKey = tenant?.botsailor_api_key
  const phoneId = tenant?.botsailor_phone_id
  if (!apiKey) return NextResponse.json({ error: 'BotSailor API key not configured.' }, { status: 400 })
  if (!phoneId) return NextResponse.json({ error: 'BotSailor Phone Number ID not configured. Add it in Profile > Integrations.' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const page = searchParams.get('page') ?? '1'
  const offset = ((parseInt(page) - 1) * 20).toString()

  // BotSailor subscriber list with latest message ordering
  const params = new URLSearchParams({
    apiToken: apiKey,
    phone_number_id: phoneId,
    limit: '20',
    offset,
    orderBy: '1',
  })

  const res = await fetch(`${BOTSAILOR_BASE}/whatsapp/subscriber/list?${params}`)
  const data = await res.json()

  // BotSailor returns 200 even for errors — check status field
  if (data?.status !== undefined && String(data.status) !== '1') {
    return NextResponse.json(
      { error: data?.message ?? 'BotSailor error. Check your Phone Number ID in Profile > Integrations.', botsailor_status: data?.status },
      { status: 400 }
    )
  }

  return NextResponse.json(data, { status: res.status })
}
