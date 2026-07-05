import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getTenantVoiceConfig(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('tenants')
    .select('voice_api_key, voice_base_url')
    .eq('user_id', userId)
    .single()
  return {
    apiKey: data?.voice_api_key ?? null,
    baseUrl: (data?.voice_base_url ?? 'https://voice.larynxai.in').replace(/\/$/, ''),
  }
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apiKey, baseUrl } = await getTenantVoiceConfig(supabase, user.id)
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
    `${baseUrl}/api/v1/workflow/${workflowId}/runs?${params}`,
    { headers: { 'X-API-Key': apiKey } }
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
