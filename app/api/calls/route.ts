import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getTenantVoiceConfig(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('tenants')
    .select('voice_api_key, voice_base_url')
    .eq('user_id', userId)
    .single()
  // Attempt to read new multi-workflow columns separately — they may not exist yet if the
  // user hasn't run the migration SQL yet. .catch() ensures no crash if the column is missing.
  const { data: wfData } = await (supabase
    .from('tenants')
    .select('voice_workflow_ids, voice_workflow_id')
    .eq('user_id', userId)
    .single() as Promise<{ data: Record<string, string> | null; error: unknown }>)
    .catch(() => ({ data: null }))
  const raw: string = wfData?.voice_workflow_ids ?? wfData?.voice_workflow_id ?? ''
  const workflowIds: string[] = raw ? raw.split('\n').map(s => s.trim()).filter(Boolean) : []
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
  const page = searchParams.get('page') ?? '1'
  const limit = searchParams.get('limit') ?? '20'
  const status = searchParams.get('status') ?? ''

  // Ensure absolute URL helper (defined before use below)
  function abs(url: unknown): string | null {
    if (!url) return null
    const s = String(url)
    if (s.startsWith('http://') || s.startsWith('https://')) return s
    return `${baseUrl}${s.startsWith('/') ? '' : '/'}${s}`
  }

  function normaliseRun(r: Record<string, unknown>) {
    // Dograh run shape: id (run id), workflow_id, workflow_name, name (contact/call name),
    // created_at, call_duration_seconds, dograh_token_usage, phone_number,
    // recording_public_url / recording_url, transcript_public_url / transcript_url
    return {
      run_id:           String(r.id ?? r.run_id ?? ''),
      workflow_id:      r.workflow_id,
      agent_name:       r.workflow_name ?? '—',
      contact_name:     r.name ?? '—',
      phone_number:     r.phone_number ?? null,
      status:           r.status ?? 'completed',
      duration:         Number(r.call_duration_seconds ?? r.duration ?? 0),
      cost:             Number(r.dograh_token_usage ?? r.cost ?? 0),
      created_at:       r.created_at ?? null,
      recording_url:    abs(r.recording_public_url ?? r.recording_url),
      transcript_url:   abs(r.transcript_public_url ?? r.transcript_url),
      bot_recording_url: abs(r.bot_recording_public_url ?? r.bot_recording_url),
    }
  }

  // Fetch all available workflows to resolve saved names → numeric workflow_id
  // Dograh workflow objects use the key "workflow_id" (not "id")
  const wfRes = await fetch(`${baseUrl}/api/v1/workflow/fetch`, { headers: { 'X-API-Key': apiKey } })
    .then(r => r.json()).catch(() => null)
  const availableWorkflows: { workflow_id: number | string; name: string }[] =
    Array.isArray(wfRes) ? wfRes : (wfRes?.workflows ?? wfRes?.data ?? [])

  // Resolve each saved value (may be a name from earlier) to its numeric workflow_id
  let resolvedWorkflowIds: string[] = workflowIds.map(val => {
    const trimmed = val.trim()
    if (!trimmed) return ''
    // Already matches a numeric workflow_id directly
    if (availableWorkflows.some(w => String(w.workflow_id) === trimmed)) return trimmed
    // Saved as a name — find by case-insensitive match and return its workflow_id
    const byName = availableWorkflows.find(w => w.name.toLowerCase() === trimmed.toLowerCase())
    return byName ? String(byName.workflow_id) : trimmed
  }).filter(Boolean)

  // If nothing was saved in profile, fall back to fetching all available workflow IDs
  if (resolvedWorkflowIds.length === 0 && availableWorkflows.length > 0) {
    resolvedWorkflowIds = availableWorkflows.map(w => String(w.workflow_id))
  }

  // Helper to build a clean runs URL for one workflow (no duplicate filter keys)
  function runsUrl(wfId: string): string {
    const filters: { field: string; op: string; value: string }[] = [
      { field: 'workflow_id', op: 'eq', value: wfId },
    ]
    if (status) filters.push({ field: 'status', op: 'eq', value: status })
    const params = new URLSearchParams({ page, limit, filters: JSON.stringify(filters) })
    return `${baseUrl}/api/v1/organizations/usage/runs?${params}`
  }

  let runsRaw: Record<string, unknown>[] = []
  let totalCount = 0

  if (resolvedWorkflowIds.length > 0) {
    // Fan out — one request per workflow, then merge sorted by created_at desc
    const results = await Promise.all(
      resolvedWorkflowIds.map(wfId =>
        fetch(runsUrl(wfId), { headers: { 'X-API-Key': apiKey } })
          .then(r => r.json())
          .catch(() => ({ runs: [], total_count: 0 }))
      )
    )
    for (const raw of results) {
      const batch: Record<string, unknown>[] = Array.isArray(raw) ? raw : (raw?.runs ?? [])
      runsRaw.push(...batch)
      totalCount += Number(raw?.total_count ?? batch.length)
    }
    runsRaw.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at as string).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at as string).getTime() : 0
      return tb - ta
    })
  } else {
    // Absolute fallback — fetch all org runs with no filter
    const params = new URLSearchParams({ page, limit })
    if (status) params.set('filters', JSON.stringify([{ field: 'status', op: 'eq', value: status }]))
    const res = await fetch(`${baseUrl}/api/v1/organizations/usage/runs?${params}`, { headers: { 'X-API-Key': apiKey } })
    const raw = await res.json()
    runsRaw = Array.isArray(raw) ? raw : (raw?.runs ?? [])
    totalCount = Number(raw?.total_count ?? runsRaw.length)
  }

  // Dograh response fields per run:
  // id, workflow_id, workflow_name, name, created_at,
  // call_duration_seconds, dograh_token_usage, phone_number, recording_url, transcript_url

  const runs = runsRaw.map(normaliseRun)

  return NextResponse.json({
    runs,
    total: totalCount,
    page: parseInt(page),
    total_pages: Math.ceil(totalCount / parseInt(limit)) || 1,
  })
}
