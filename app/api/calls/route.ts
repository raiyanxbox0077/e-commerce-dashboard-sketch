import { createClient, createAdminClient } from '@/lib/supabase/server'
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

  // If no workflows configured, return early with a flag so the UI can prompt the user
  if (workflowIds.length === 0) {
    return NextResponse.json({ runs: [], total: 0, page: 1, total_pages: 0, no_workflows_configured: true })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limitPerPage = parseInt(searchParams.get('limit') ?? '20')
  const statusFilter = searchParams.get('status') ?? ''
  const typeFilter   = searchParams.get('type') ?? '' // 'cod' | 'cart' | ''

  // For COD/Cart type filters — fetch known RUN_IDs from Supabase tables
  let typeRunIds: Set<string> | null = null
  if (typeFilter === 'cod' || typeFilter === 'cart') {
    try {
      const { data: tenant } = await (await createClient())
        .from('tenants').select('cod_table_name, cart_table_name').eq('user_id', user.id).single()
      const admin = createAdminClient()
      const tableName = typeFilter === 'cod'
        ? (tenant?.cod_table_name || 'E-commerce COD confimation')
        : (tenant?.cart_table_name || 'E-commerce add to cart')
      const { data: rows } = await admin.from(tableName).select('RUN_ID').not('RUN_ID', 'is', null)
      typeRunIds = new Set((rows ?? []).map((r: Record<string, unknown>) => String(r.RUN_ID)).filter(Boolean))
    } catch (_) { typeRunIds = new Set() }
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
    return {
      run_id:            String(r.id ?? r.run_id ?? ''),
      workflow_id:       r.workflow_id,
      agent_name:        r.workflow_name ?? '—',
      contact_name:      r.name ?? '—',
      phone_number:      r.phone_number ?? null,
      status:            r.status ?? 'completed',
      duration:          Number(r.call_duration_seconds ?? r.duration ?? 0),
      cost:              Number(r.dograh_token_usage ?? r.cost ?? 0),
      created_at:        r.created_at ?? null,
      recording_url:     abs(r.recording_public_url ?? r.recording_url),
      transcript_url:    abs(r.transcript_public_url ?? r.transcript_url),
      bot_recording_url: abs(r.bot_recording_public_url ?? r.bot_recording_url),
    }
  }

  // The Dograh API ignores the `filters` param — it returns all org runs regardless.
  // Strategy: fetch all runs (API max is 100), then filter client-side by the saved workflow IDs.
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

  // Filter to only runs belonging to the configured workflow IDs
  const filtered = allRuns.filter(r => workflowIds.includes(String(r.workflow_id)))

  // Apply COD/Cart type filter — match run_id against known RUN_IDs in Supabase tables
  const afterType = typeRunIds !== null
    ? filtered.filter(r => typeRunIds!.has(String(r.id ?? r.run_id ?? '')))
    : filtered

  // Apply status filter if provided
  const afterStatus = statusFilter
    ? afterType.filter(r => String(r.status) === statusFilter)
    : afterType

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
