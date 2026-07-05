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
  if (!apiKey) return NextResponse.json({ error: 'BotSailor API key not configured.' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const subscriberId = searchParams.get('subscriber_id')
  if (!subscriberId) return NextResponse.json({ error: 'subscriber_id required' }, { status: 400 })

  const res = await fetch(
    `${BOTSAILOR_BASE}/whatsapp/chat/messages?subscriber_id=${subscriberId}&per_page=50`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('botsailor_api_key')
    .eq('user_id', user.id)
    .single()

  const apiKey = tenant?.botsailor_api_key
  if (!apiKey) return NextResponse.json({ error: 'BotSailor API key not configured.' }, { status: 400 })

  const body = await req.json()
  const { subscriber_id, message } = body
  if (!subscriber_id || !message) return NextResponse.json({ error: 'subscriber_id and message required' }, { status: 400 })

  const res = await fetch(`${BOTSAILOR_BASE}/whatsapp/chat/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscriber_id, message_type: 'text', message }),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
