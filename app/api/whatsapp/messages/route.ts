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
  if (!phoneId) return NextResponse.json({ error: 'BotSailor Phone Number ID not configured.' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const phoneNumber = searchParams.get('phone_number')
  if (!phoneNumber) return NextResponse.json({ error: 'phone_number required' }, { status: 400 })

  // Get conversation by phone number (subscriber phone number with country code)
  const params = new URLSearchParams({
    apiToken: apiKey,
    phone_number_id: phoneId,
    phone_number: phoneNumber,
    limit: '50',
    offset: '0',
  })

  const res = await fetch(`${BOTSAILOR_BASE}/whatsapp/get/conversation?${params}`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: Request) {
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
  if (!phoneId) return NextResponse.json({ error: 'BotSailor Phone Number ID not configured.' }, { status: 400 })

  const body = await req.json()
  const { phone_number, message } = body
  if (!phone_number || !message) return NextResponse.json({ error: 'phone_number and message required' }, { status: 400 })

  // Send text message via BotSailor
  const params = new URLSearchParams({
    apiToken: apiKey,
    phone_number_id: phoneId,
    phone_number,
    message,
  })

  const res = await fetch(`${BOTSAILOR_BASE}/whatsapp/send?${params}`, { method: 'GET' })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
