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
    return {
      run_id: String(r.id ?? r.run_id ?? ''),
      workflow_id: r.workflow_id,
      agent_name: r.workflow_name ?? r.name ?? '—',
      contact_name: r.name ?? '—',
      phone_number: r.phone_number ?? null,
      status: r.status ?? 'completed',
      duration: r.call_duration_seconds ?? r.duration ?? 0,
      cost: r.dograh_token_usage ?? r.cost ?? 0,
      created_at: r.created_at ?? null,
      recording_url: abs(r.recording_public_url ?? r.recording_url),
      transcript_url: abs(r.transcript_public_url ?? r.transcript_url),
      bot_recording_url: abs(r.bot_recording_public_url ?? r.bot_recording_url),
    }
  }

  // If multiple workflow IDs are configured, fan out and merge; otherwise fetch org-wide
  let runsRaw: Record<string, unknown>[] = []
  let totalCount = 0

  if (workflowIds.length > 0) {
    // Parallel fetch one page from each workflow, then merge + sort by created_at desc
    const results = await Promise.all(
      workflowIds.map(wfId => {
        const params = new URLSearchParams({ page, limit })
        params.set('filters', JSON.stringify([{ field: 'workflow_id', op: 'eq', value: wfId }]))
        if (status) params.append('filters', JSON.stringify([{ field: 'status', op: 'eq', value: status }]))
        return fetch(`${baseUrl}/api/v1/organizations/usage/runs?${params}`, { headers: { 'X-API-Key': apiKey } })
          .then(r => r.json())
          .catch(() => ({ runs: [], total_count: 0 }))
      })
    )
    for (const raw of results) {
      const batch: Record<string, unknown>[] = Array.isArray(raw) ? raw : (raw?.runs ?? [])
      runsRaw.push(...batch)
      totalCount += raw?.total_count ?? batch.length
    }
    // Sort merged results by created_at descending
    runsRaw.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at as string).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at as string).getTime() : 0
      return tb - ta
    })
  } else {
    // No workflow filter — fetch all org runs
    const params = new URLSearchParams({ page, limit })
    if (status) params.set('filters', JSON.stringify([{ field: 'status', op: 'eq', value: status }]))
    const res = await fetch(`${baseUrl}/api/v1/organizations/usage/runs?${params}`, { headers: { 'X-API-Key': apiKey } })
    const raw = await res.json()
    runsRaw = Array.isArray(raw) ? raw : (raw?.runs ?? [])
    totalCount = raw?.total_count ?? runsRaw.length
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
