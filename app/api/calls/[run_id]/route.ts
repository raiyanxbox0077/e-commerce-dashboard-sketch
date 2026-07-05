import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ run_id: string }> }
) {
  const { run_id } = await params
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

  const { searchParams } = new URL(req.url)
  const workflowId = searchParams.get('workflow_id')

  // If we have a workflow_id, use the scoped endpoint; otherwise fall back to org-wide run lookup
  const endpoint = workflowId
    ? `${baseUrl}/api/v1/workflow/${workflowId}/runs/${run_id}`
    : `${baseUrl}/api/v1/runs/${run_id}`

  const res = await fetch(endpoint, { headers: { 'X-API-Key': apiKey } })
  const raw = await res.json()

  // Normalise response fields
  const detail = {
    run_id: String(raw.id ?? run_id),
    workflow_id: raw.workflow_id,
    agent_name: raw.workflow_name ?? raw.name ?? '—',
    contact_name: raw.name ?? '—',
    phone_number: raw.phone_number ?? null,
    status: raw.is_completed ? 'completed' : (raw.status ?? 'in_progress'),
    mode: raw.mode ?? null,
    duration: raw.call_duration_seconds ?? raw.duration ?? 0,
    cost: raw.dograh_token_usage ?? raw.cost ?? 0,
    created_at: raw.created_at ?? null,
    recording_url: raw.recording_url ?? raw.recording_public_url ?? null,
    user_recording_url: raw.user_recording_url ?? raw.user_recording_public_url ?? null,
    bot_recording_url: raw.bot_recording_url ?? raw.bot_recording_public_url ?? null,
    transcript_url: raw.transcript_url ?? raw.transcript_public_url ?? null,
    gathered_context: raw.gathered_context ?? null,
    initial_context: raw.initial_context ?? null,
    summary: raw.summary ?? null,
  }

  return NextResponse.json(detail, { status: res.status })
}
