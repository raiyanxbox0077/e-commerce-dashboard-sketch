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
  const workflowId = searchParams.get('workflow_id')  // optional filter by workflow
  const page = searchParams.get('page') ?? '1'
  const limit = searchParams.get('limit') ?? '20'
  const status = searchParams.get('status') ?? ''

  // Dograh: GET /api/v1/organizations/usage/runs — paginated org-wide runs
  const params = new URLSearchParams({ page, limit })
  if (workflowId) params.set('filters', JSON.stringify([{ field: 'workflow_id', op: 'eq', value: workflowId }]))
  if (status) params.set('filters', JSON.stringify([{ field: 'status', op: 'eq', value: status }]))

  const res = await fetch(
    `${baseUrl}/api/v1/organizations/usage/runs?${params}`,
    { headers: { 'X-API-Key': apiKey } }
  )
  const raw = await res.json()

  // Dograh response: { runs: WorkflowRunUsageResponse[], total_count, page, limit, total_pages }
  // Each run has: id (int), workflow_id (int), workflow_name, name, created_at,
  //   call_duration_seconds, dograh_token_usage, phone_number, recording_url, transcript_url
  const runsRaw: Record<string, unknown>[] = Array.isArray(raw) ? raw : (raw?.runs ?? [])

  // Normalise field names to match what the UI expects
  const runs = runsRaw.map(r => ({
    run_id: String(r.id ?? r.run_id ?? ''),
    workflow_id: r.workflow_id,
    agent_name: r.workflow_name ?? r.name ?? '—',
    contact_name: r.name ?? '—',
    phone_number: r.phone_number ?? null,
    status: r.status ?? 'completed',
    duration: r.call_duration_seconds ?? r.duration ?? 0,
    cost: r.dograh_token_usage ?? r.cost ?? 0,
    created_at: r.created_at ?? null,
    recording_url: r.recording_public_url ?? r.recording_url ?? null,
    transcript_url: r.transcript_public_url ?? r.transcript_url ?? null,
    bot_recording_url: r.bot_recording_public_url ?? r.bot_recording_url ?? null,
  }))

  return NextResponse.json({
    runs,
    total: raw?.total_count ?? runs.length,
    page: raw?.page ?? parseInt(page),
    total_pages: raw?.total_pages ?? 1,
  }, { status: res.status })
}
