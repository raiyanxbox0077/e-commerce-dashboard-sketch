import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Dograh has no single-run GET endpoint — we fetch the full list and find by ID.
// This is cached by Next.js for 60s to avoid hammering the API on every panel open.

async function getTenantVoiceConfig(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('tenants')
    .select('voice_api_key, voice_base_url')
    .eq('user_id', userId)
    .single()
  return {
    apiKey:  data?.voice_api_key ?? null,
    baseUrl: (data?.voice_base_url ?? 'https://voice.larynxai.in').replace(/\/$/, ''),
  }
}

function dispositionToStatus(disposition: unknown): string {
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
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return s.replace(/^https?:\/\/localhost(:\d+)?/, safeBase)
  }
  return `${safeBase}/${s.startsWith('/') ? s.slice(1) : s}`
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apiKey, baseUrl } = await getTenantVoiceConfig(supabase, user.id)
  if (!apiKey) return NextResponse.json({ error: 'Voice API key not configured' }, { status: 400 })

  // Fetch enough runs to find this one (Dograh max = 100 per page)
  const res = await fetch(
    `${baseUrl}/api/v1/organizations/usage/runs?page=1&limit=100`,
    { headers: { 'X-API-Key': apiKey }, next: { revalidate: 60 } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: `Dograh API error ${res.status}` }, { status: res.status })
  }

  const raw = await res.json()
  const allRuns: Record<string, unknown>[] = Array.isArray(raw) ? raw : (raw?.runs ?? [])

  // Find by numeric ID (Dograh stores IDs as numbers)
  const run = allRuns.find(r => String(r.id ?? r.run_id ?? '') === String(runId))

  if (!run) {
    return NextResponse.json({ error: `Run ${runId} not found` }, { status: 404 })
  }

  return NextResponse.json({
    run_id:            String(run.id ?? run.run_id ?? ''),
    workflow_id:       run.workflow_id,
    agent_name:        run.workflow_name ?? '—',
    contact_name:      run.name ?? '—',
    phone_number:      run.phone_number ?? run.called_number ?? null,
    status:            dispositionToStatus(run.disposition),
    disposition:       String(run.disposition ?? ''),
    duration:          Number(run.call_duration_seconds ?? run.duration ?? 0),
    cost:              Number(run.charge_usd ?? run.dograh_token_usage ?? run.cost ?? 0),
    created_at:        run.created_at ?? null,
    summary:           run.summary ?? run.call_summary ?? null,
    recording_url:     abs(run.recording_public_url ?? run.recording_url),
    transcript_url:    abs(run.transcript_public_url ?? run.transcript_url),
    bot_recording_url: abs(run.bot_recording_public_url ?? run.bot_recording_url),
  })
}
