import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getTenantVoiceConfig(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('tenants')
    .select('voice_api_key, voice_base_url, voice_workflow_id')
    .eq('user_id', userId)
    .single()

  // voice_workflow_id stores newline-separated numeric IDs e.g. "24\n25\n26"
  const raw: string = (data?.voice_workflow_id as string) ?? ''
  // Filter out "undefined" string which can be saved by buggy old code
  const workflowIds: string[] = raw
    ? raw.split('\n').map(s => s.trim()).filter(s => s && s !== 'undefined')
    : []

  return {
    apiKey: data?.voice_api_key ?? null,
    baseUrl: (data?.voice_base_url ?? 'https://voice.larynxai.in').replace(/\/$/, ''),
    workflowIds,
  }
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apiKey, baseUrl, workflowIds } = await getTenantVoiceConfig(supabase, user.id)
  if (!apiKey) return NextResponse.json({ error: 'Voice API key not configured. Please add it in Profile > Integrations.' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limitPerPage = parseInt(searchParams.get('limit') ?? '20')
  const statusFilter = searchParams.get('status') ?? ''

  // Map Dograh disposition values to a normalised status
  // dispositions: 'end_call_tool' | 'user_hangup' | 'user_idle_max_duration_exceeded' | null
  function dispositionToStatus(disposition: unknown, mode?: unknown): string {
    const d = String(disposition ?? '')
    if (!d || d === 'null') return 'in_progress'
    if (d === 'user_idle_max_duration_exceeded') return 'no_answer'
    if (d === 'end_call_tool' || d === 'user_hangup') return 'completed'
    return 'completed'
  }

  const safeBase = 'https://voice.larynxai.in'
  function abs(url: unknown): string | null {
    if (!url) return null
    const s = String(url)
    // Already absolute — replace localhost origin with the real base
    if (s.startsWith('http://') || s.startsWith('https://')) {
      return s.replace(/^https?:\/\/localhost(:\d+)?/, safeBase)
    }
    // Relative path — prepend the safe base URL
    return `${safeBase}/${s.startsWith('/') ? s.slice(1) : s}`
  }

  function normaliseRun(r: Record<string, unknown>) {
    const status = dispositionToStatus(r.disposition, r.mode)
    return {
      run_id:            String(r.id ?? r.run_id ?? ''),
      workflow_id:       r.workflow_id,
      agent_name:        r.workflow_name ?? '—',
      contact_name:      r.name ?? '—',
      phone_number:      r.phone_number ?? r.called_number ?? null,
      status,
      disposition:       String(r.disposition ?? ''),
      duration:          Number(r.call_duration_seconds ?? r.duration ?? 0),
      cost:              Number(r.charge_usd ?? r.dograh_token_usage ?? r.cost ?? 0),
      created_at:        r.created_at ?? null,
      recording_url:     abs(r.recording_public_url ?? r.recording_url),
      transcript_url:    abs(r.transcript_public_url ?? r.transcript_url),
      bot_recording_url: abs(r.bot_recording_public_url ?? r.bot_recording_url),
    }
  }

  // Fetch all runs (API max is 100), then filter client-side by saved workflow IDs
  const fetchLimit = 100
  const res = await fetch(
    `${baseUrl}/api/v1/organizations/usage/runs?page=1&limit=${fetchLimit}`,
    { headers: { 'X-API-Key': apiKey } }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return NextResponse.json({ error: `Dograh API error ${res.status}: ${text}` }, { status: res.status })
  }

  const raw = await res.json()
  const allRuns: Record<string, unknown>[] = Array.isArray(raw) ? raw : (raw?.runs ?? [])

  // Also split on commas/spaces in case ID was stored as "23,25" or "23 25"
  const normWorkflowIds = workflowIds.flatMap(id => id.split(/[,\s]+/)).map(s => s.trim()).filter(Boolean)
  const byWorkflow = normWorkflowIds.length
    ? allRuns.filter(r => normWorkflowIds.includes(String(r.workflow_id)))
    : allRuns
  // If stored IDs don't match any real runs, fall back to all org runs
  const filtered = byWorkflow.length > 0 ? byWorkflow : allRuns

  // Apply status filter using derived status (disposition → status mapping)
  const afterStatus = statusFilter
    ? filtered.filter(r => dispositionToStatus(r.disposition, r.mode) === statusFilter)
    : filtered

  // Sort by created_at desc (API returns newest first already, but re-sort after filtering)
  afterStatus.sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at as string).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at as string).getTime() : 0
    return tb - ta
  })

  // Paginate client-side
  const total = afterStatus.length
  const start = (page - 1) * limitPerPage
  const paginated = afterStatus.slice(start, start + limitPerPage)

  return NextResponse.json({
    runs: paginated.map(normaliseRun),
    total,
    page,
    total_pages: Math.ceil(total / limitPerPage) || 1,
  })
}
