import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VOICE_BASE = 'https://voice.larynxai.in'

async function getTenantVoiceKey(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('tenants')
    .select('voice_api_key')
    .eq('user_id', userId)
    .single()
  return data?.voice_api_key ?? null
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = await getTenantVoiceKey(supabase, user.id)
  if (!apiKey) return NextResponse.json({ error: 'Voice API key not configured. Please add it in Profile > Integrations.' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const workflowId = searchParams.get('workflow_id')
  const page = searchParams.get('page') ?? '1'
  const limit = searchParams.get('limit') ?? '20'
  const status = searchParams.get('status') ?? ''

  if (!workflowId) return NextResponse.json({ error: 'workflow_id is required' }, { status: 400 })

  const params = new URLSearchParams({ page, limit })
  if (status) params.set('status', status)

  const res = await fetch(
    `${VOICE_BASE}/api/v1/workflow/${workflowId}/runs?${params}`,
    { headers: { 'X-API-Key': apiKey } }
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
