import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('voice_api_key, voice_base_url')
    .eq('user_id', user.id)
    .single()

  const apiKey = tenant?.voice_api_key
  const baseUrl = (tenant?.voice_base_url ?? 'https://voice.larynxai.in').replace(/\/$/, '')

  if (!apiKey) return NextResponse.json({ error: 'Voice API key not configured.' }, { status: 400 })

  const res = await fetch(`${baseUrl}/api/v1/workflow/fetch`, {
    headers: { 'X-API-Key': apiKey },
  })
  const raw = await res.json()

  // Dograh returns a top-level array of { id, name, status, total_runs, ... }
  const workflows = Array.isArray(raw) ? raw : (raw?.workflows ?? raw?.data ?? [])
  return NextResponse.json({ workflows }, { status: res.status })
}
